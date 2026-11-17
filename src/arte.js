// Arte (consigna 7): una hoja en blanco en las gafas para dibujar un paisaje. Se dibuja con el mouse
// apretado, como un lápiz (es la única excepción a «mirar elige»): arriba están los colores, la goma y el
// grosor; al costado, «Deshacer» y «Borrar todo». El tutor tira tips generales de dibujo, de a uno: los
// pide la persona («Pedir un tip») o se los tira solo cada tanto mientras dibuja (salvo en «No me
// interrumpas»). Los tips no tocan el dibujo: son ideas, y se pueden contestar («Lo pruebo», «Ahora no»)
// o dejar pasar. El tutor no ve el dibujo. Cuando le gusta cómo quedó, lo entrega; el dibujo queda en
// los resultados. Todo está guionado: no usa la IA real.

// los tips, en el orden en que los da el tutor (el primero, solo si la hoja todavía está en blanco)
export const TIPS = [
  { id: 'empezar', tema: 'Para empezar', txt: 'Podés empezar por lo más grande, como el cielo y la tierra, y después sumar detalles.', soloVacia: true },
  { id: 'centro', tema: 'Lo principal', txt: 'Probá no poner lo más importante justo en el medio.' },
  { id: 'contraste', tema: 'Contraste', txt: 'Para que algo se vea primero, usá un color que contraste con lo que tiene alrededor.' },
  { id: 'lejos', tema: 'Profundidad', txt: 'Lo que está lejos se dibuja más chico y más claro.' },
  { id: 'espacio', tema: 'Espacio', txt: 'Dejá algo de espacio libre: ayuda a que el dibujo respire.' },
  { id: 'repetir', tema: 'Unidad', txt: 'Repetir un color en distintas partes une el dibujo.' },
];

export const COLORES = [['negro', '#1b1d21'], ['azul', '#2f6db5'], ['celeste', '#7fbbe6'], ['verde', '#4c8a3f'], ['amarillo', '#f1c232'], ['naranja', '#e8743b'], ['rojo', '#cf3f2e'], ['marrón', '#7d5230']];
const GROSOR = { fino: 7, grueso: 22 }; // en el espacio de la hoja
const GOMA = 38;
const ANCHO = 1200, ALTO = 675;         // la hoja tiene su propio espacio (16:9) y se ve más chica
const PRIMERO = 15, ENTRE = 30, SOLOS = 3; // segundos hasta el primer tip del tutor y entre uno y otro; cuántos tira solo

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const sinTilde = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

// los trazos que se ven: los que vienen después del último «Borrar todo»
function visibles(e) {
  const t = e.trazos;
  let k = t.length - 1;
  while (k >= 0 && !t[k].borrar) k--;
  return t.slice(k + 1);
}

export class Lamina {
  constructor({ hud }) {
    this.hud = hud;
    const el = this.el = document.createElement('div');
    el.id = 'hud-lamina';
    el.hidden = true;
    el.innerHTML = `<div class="cab"><span class="tit">Arte · Tu paisaje</span><span class="np">Sin tips</span></div>
      <div class="cols"><div class="izq">
        <div class="herr">${COLORES.map(([n, c], i) => `<button type="button" class="color" data-color="${i}" style="--c:${c}" aria-label="Color ${n}" title="${n}"></button>`).join('')}<button type="button" data-goma>Goma</button><span class="sep"></span><button type="button" data-grosor="fino">Fino</button><button type="button" data-grosor="grueso">Grueso</button></div>
        <div class="hoja"><canvas width="${ANCHO}" height="${ALTO}"></canvas><p class="vacio">Mantené apretado el mouse y dibujá: es tu lápiz.</p></div>
      </div><div class="der"></div></div>`;
    document.getElementById('hud').appendChild(el);
    this.cv = el.querySelector('canvas');
    this.g = this.cv.getContext('2d');
    this.der = el.querySelector('.der');
    this.vacio = el.querySelector('.vacio');
    // los botones se eligen con la mirada (o con clic, como en todo el test)
    el.addEventListener('click', (ev) => {
      const b = ev.target.closest('button');
      if (!b || !this.activo) return;
      const d = b.dataset;
      if (d.color != null) return this.elegirColor(+d.color, 'mirada');
      if (d.goma != null) return this.elegirColor('goma', 'mirada');
      if (d.grosor) return this.elegirGrosor(d.grosor, 'mirada');
      if (d.tip != null) return this.pedirTip('mirada');
      if (d.resp) return this.responder(d.resp === 'si', 'mirada');
      if (d.deshacer != null) return this.deshacer('mirada');
      if (d.borrar != null) return this.borrarTodo('mirada');
      if (d.entregar != null) return this.entregar('mirada');
    });
    this._lapiz();
    this.activo = false;
    this.espontaneos = false; // tips que el tutor tira sin que se los pidan
    this.historial = [];
    this.color = 0; this.goma = false; this.grosor = 'fino';
  }

  // ── el lápiz: mantener apretado el mouse sobre la hoja y moverlo ──
  _lapiz() {
    const cv = this.cv, mira = document.getElementById('mirada');
    const punto = (ev) => {
      const r = cv.getBoundingClientRect();
      return [Math.min(ANCHO, Math.max(0, ((ev.clientX - r.left) / r.width) * ANCHO)), Math.min(ALTO, Math.max(0, ((ev.clientY - r.top) / r.height) * ALTO))];
    };
    cv.addEventListener('pointerdown', (ev) => {
      if (!this.activo || !this.e || this.e.entregado || ev.button !== 0) return;
      ev.preventDefault();
      try { cv.setPointerCapture(ev.pointerId); } catch (er) { /* */ }
      const [x, y] = punto(ev);
      const s = { c: this.goma ? null : COLORES[this.color][1], col: this.goma ? 'goma' : COLORES[this.color][0], w: this.goma ? GOMA : GROSOR[this.grosor], p: [x, y] };
      this.e.trazos.push(s);
      this.trazo = s;
      this._linea(s, x, y, x, y);
      this.vacio.hidden = true;
    });
    cv.addEventListener('pointermove', (ev) => {
      if (!this.trazo) return;
      const evs = ev.getCoalescedEvents ? ev.getCoalescedEvents() : [];
      for (const q of evs.length ? evs : [ev]) {
        const [x, y] = punto(q), p = this.trazo.p, lx = p[p.length - 2], ly = p[p.length - 1];
        if (Math.hypot(x - lx, y - ly) < 2) continue;
        p.push(x, y);
        this._linea(this.trazo, lx, ly, x, y);
      }
    });
    const fin = () => this._finTrazo();
    cv.addEventListener('pointerup', fin);
    cv.addEventListener('pointercancel', fin);
    cv.addEventListener('lostpointercapture', fin);
    // sobre la hoja, los ojos se achican y toman el color del lápiz (el centro es la punta)
    cv.addEventListener('pointerenter', () => { if (mira && this.activo && !(this.e && this.e.entregado)) mira.classList.add('lapiz'); });
    cv.addEventListener('pointerleave', () => { if (mira) mira.classList.remove('lapiz'); });
  }

  _finTrazo() {
    const s = this.trazo, e = this.e;
    if (!s) return;
    this.trazo = null;
    e.version++;
    if (s.c) {
      e.nTrazos++;
      if (e.tip) e.tip.reg.trazosDespues++; // lo que dibujó después del último tip
    }
    this.hud.registrar('arte', `trazo:${s.col}`);
    this._estado();
  }

  // un tramo del trazo (al dibujar) o el trazo entero (al redibujar)
  _estilo(s) {
    const g = this.g;
    g.globalCompositeOperation = s.c ? 'source-over' : 'destination-out';
    g.strokeStyle = g.fillStyle = s.c || '#000';
    g.lineWidth = s.w; g.lineCap = 'round'; g.lineJoin = 'round';
  }

  _linea(s, x0, y0, x1, y1) {
    const g = this.g;
    g.save();
    this._estilo(s);
    g.beginPath();
    if (x0 === x1 && y0 === y1) { g.arc(x0, y0, s.w / 2, 0, Math.PI * 2); g.fill(); } else { g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); }
    g.restore();
  }

  _redibujar() {
    const g = this.g;
    g.clearRect(0, 0, ANCHO, ALTO);
    if (this.e) for (const s of visibles(this.e)) {
      const p = s.p;
      g.save();
      this._estilo(s);
      g.beginPath();
      if (p.length === 2) { g.arc(p[0], p[1], s.w / 2, 0, Math.PI * 2); g.fill(); } else { g.moveTo(p[0], p[1]); for (let i = 2; i < p.length; i += 2) g.lineTo(p[i], p[i + 1]); g.stroke(); }
      g.restore();
    }
  }

  // ── la hoja: una por consigna (si el moderador vuelve a la 7 sin que la haya entregado, sigue la misma) ──
  cargar() {
    if (this.e && !this.e.entregado) {
      this.activo = true; this.el.hidden = false;
      this._redibujar(); this._pintar();
      this.hud.registrar('arte', 'retomar');
      return;
    }
    if (this.e) this.e.imagen = this.imagen();
    this.e = { trazos: [], nTrazos: 0, version: 0, deshechos: 0, borrados: 0, vistos: new Set(), tips: [], tip: null, solos: 0, entregado: false, tEntregado: null, tInicio: performance.now(), tUltimoTip: performance.now(), avisoEntregar: false };
    this.historial.push(this.e);
    this.color = 0; this.goma = false; this.grosor = 'fino';
    this.activo = true; this.el.hidden = false;
    this._redibujar(); this._pintar();
    this.hud.registrar('arte', 'cargar');
  }

  ocultar() {
    if (this.trazo) this._finTrazo();
    this.activo = false;
    this.el.hidden = true;
    const mira = document.getElementById('mirada');
    if (mira) mira.classList.remove('lapiz');
  }

  hayDibujo(e = this.e) { return !!e && visibles(e).some((s) => s.c); }

  // cómo está el dibujo, en pocas palabras (para el tutor con IA y los resultados)
  describir(e = this.e) {
    if (!e) return '';
    const v = visibles(e).filter((s) => s.c);
    if (!v.length) return 'la hoja está en blanco';
    const cols = [...new Set(v.map((s) => s.col))];
    return `${v.length} trazo${v.length > 1 ? 's' : ''} con ${cols.length === 1 ? 'un color' : `${cols.length} colores`} (${cols.join(', ')})`;
  }

  resumen(e = this.e) {
    const v = visibles(e).filter((s) => s.c);
    return { trazos: e.nTrazos, a_la_vista: v.length, colores: [...new Set(e.trazos.filter((s) => s.c).map((s) => s.col))] };
  }

  // el dibujo como imagen chica (va a los resultados); se rehace solo si cambió
  imagen() {
    const e = this.e;
    if (!e) return null;
    if (this._img && this._imgE === e && this._imgV === e.version) return this._img;
    const c = document.createElement('canvas');
    c.width = 480; c.height = 270;
    const g = c.getContext('2d');
    g.fillStyle = '#fff';
    g.fillRect(0, 0, c.width, c.height);
    g.drawImage(this.cv, 0, 0, c.width, c.height);
    this._img = c.toDataURL('image/jpeg', 0.8);
    this._imgE = e; this._imgV = e.version;
    return this._img;
  }

  // ── herramientas ──
  elegirColor(v, origen = 'mirada') {
    if (!this.activo || !this.e || this.e.entregado) return false;
    const goma = v === 'goma' || /\b(goma|borrador)\b/.test(sinTilde(v));
    const i = typeof v === 'number' ? v : COLORES.findIndex(([n]) => sinTilde(n) === sinTilde(v));
    if (!goma && !(i >= 0 && i < COLORES.length)) return false;
    this.goma = goma;
    if (!goma) this.color = i;
    this.hud.registrar('arte', `color:${goma ? 'goma' : COLORES[i][0]}:${origen}`);
    this._estado();
    return true;
  }

  elegirGrosor(gr, origen = 'mirada') {
    if (!this.activo || !this.e || this.e.entregado || !GROSOR[gr]) return false;
    this.grosor = gr;
    if (this.goma) this.goma = false; // elegir un grosor vuelve al lápiz
    this.hud.registrar('arte', `grosor:${gr}:${origen}`);
    this._estado();
    return true;
  }

  deshacer(origen = 'mirada') {
    const e = this.e;
    if (!this.activo || !e || e.entregado || !e.trazos.length) return false;
    e.trazos.pop();
    e.deshechos++; e.version++;
    this._redibujar();
    this.hud.registrar('arte', `deshacer:${origen}`);
    this._estado();
    return true;
  }

  // borra todo, pero se puede deshacer (queda una marca en la lista de trazos)
  borrarTodo(origen = 'mirada') {
    const e = this.e;
    if (!this.activo || !e || e.entregado || !visibles(e).length) return false;
    e.trazos.push({ borrar: true });
    e.borrados++; e.version++;
    this._redibujar();
    this.hud.registrar('arte', `borrar-todo:${origen}`);
    this._estado();
    return true;
  }

  // ── tips ──
  _siguiente() {
    const e = this.e, vacia = !this.hayDibujo();
    return TIPS.find((t) => !e.vistos.has(t.id) && (!t.soloVacia || vacia)) || null;
  }

  quedan() { return !!(this.e && this._siguiente()); }

  pedirTip(origen = 'voz') {
    if (!this.activo || !this.e) return;
    const e = this.e;
    if (e.entregado) return this._decir('Ya lo entregaste. ¡Quedó muy tuyo!');
    if (!this.quedan()) { this.hud.registrar('arte', `tips-agotados:${origen}`); return this._decir('Ya te di todos mis tips. Seguí a tu manera: es tu dibujo.'); }
    this._mostrarTip(origen);
  }

  // el tutor tira un tip por su cuenta (la tecla del moderador lo fuerza)
  tirarTip() { if (this.activo && this.e && !this.e.entregado && this.quedan()) this._mostrarTip('tutor'); }

  _mostrarTip(origen) {
    const e = this.e, def = this._siguiente();
    if (!def) return;
    e.vistos.add(def.id);
    const reg = { id: def.id, tema: def.tema, origen, respuesta: null, segundos: null, trazosDespues: 0 };
    e.tips.push(reg);
    e.tip = { def, reg, t0: performance.now() };
    e.tUltimoTip = performance.now();
    if (origen === 'tutor') e.solos++;
    this.hud.registrar('arte', `tip:${def.id}:${origen}`);
    this._pintar();
    this._decir(origen === 'tutor' ? `Te tiro un tip: ${def.txt}` : def.txt);
    this.hud.cambio();
  }

  // la respuesta al tip a la vista; no hace falta contestar: se puede seguir dibujando
  responder(si, origen = 'mirada') {
    const e = this.e;
    if (!this.activo || !e || e.entregado || !e.tip || e.tip.reg.respuesta) return false;
    const reg = e.tip.reg;
    reg.respuesta = si ? 'lo pruebo' : 'ahora no';
    reg.segundos = Math.round((performance.now() - e.tip.t0) / 100) / 10;
    e.tUltimoTip = performance.now(); // el próximo tip del tutor cuenta desde acá
    this.hud.registrar('arte', `respuesta:${reg.id}:${si ? 'pruebo' : 'ahora-no'}:${origen}`);
    this._pintar();
    this._decir(si ? 'Dale, probalo a tu manera.' : 'Dale, es tu dibujo.');
    this.hud.cambio();
    return true;
  }

  entregar(origen = 'mirada', confirmado = false) {
    const e = this.e, h = this.hud;
    if (!this.activo || !e || e.entregado) return;
    // la hoja en blanco: el tutor pregunta antes (el moderador, con su tecla, entrega directo)
    if (!this.hayDibujo() && !confirmado && origen !== 'tecla') {
      h.registrar('arte', `entregar-vacia:${origen}`);
      if (h.tutorAbierto) h.cerrarTutor(true);
      h.propuesta = null;
      h.proponer('Tu hoja está en blanco. ¿La entregás igual?', [['Entregar igual', () => this.entregar(origen, true)], ['Sigo dibujando', null]]);
      return;
    }
    if (this.trazo) this._finTrazo();
    e.entregado = true;
    e.tEntregado = performance.now();
    h.registrar('arte', `entregado:${visibles(e).filter((s) => s.c).length}:${origen}`);
    const mira = document.getElementById('mirada');
    if (mira) mira.classList.remove('lapiz');
    this._pintar();
    this._decir(this.hayDibujo() ? '¡Entregado! Quedó muy tuyo.' : 'Listo, entregado.');
    h.cambio();
  }

  // ── el tutor habla en la barra de abajo, sin tapar la hoja ──
  _decir(txt) {
    const h = this.hud;
    if (h.tutorAbierto) h.cerrarTutor(true);
    h.propuesta = null;
    h.proponer(txt);
  }

  // ── voz: ¿la frase es algo de la hoja? (llega sin tildes ni mayúsculas) ──
  oir(d) {
    if (!this.activo || !this.e || this.e.entregado) return null;
    const e = this.e, corta = d.split(' ').length <= 5;
    if (e.tip && !e.tip.reg.respuesta && corta) {
      if (/^(lo pruebo|lo voy a probar|dale|si|si dale|bueno|ok|me sirve|buena idea)$/.test(d)) return () => this.responder(true, 'voz');
      if (/^(ahora no|no|no gracias|despues|paso|no me sirve)$/.test(d)) return () => this.responder(false, 'voz');
    }
    if (/\b(entregalo|entregarlo|entregar|lo entrego|entrego|ya termine)\b/.test(d)) return () => this.entregar('voz');
    if (/\b(borra todo|borrar todo|borralo todo|empezar de nuevo|empiezo de nuevo)\b/.test(d)) return () => this.borrarTodo('voz');
    if (/\b(deshace|deshacer|deshacelo|borra lo ultimo|borrar lo ultimo|volve atras)\b/.test(d)) return () => this.deshacer('voz');
    if (corta && /\b(goma|borrador)\b/.test(d)) return () => this.elegirColor('goma', 'voz');
    if (corta) { const c = COLORES.findIndex(([n]) => new RegExp(`\\b${sinTilde(n)}\\b`).test(d)); if (c >= 0) return () => this.elegirColor(c, 'voz'); }
    if (corta && /\b(fino|finito)\b/.test(d)) return () => this.elegirGrosor('fino', 'voz');
    if (corta && /\b(grueso|gruesa|gordo)\b/.test(d)) return () => this.elegirGrosor('grueso', 'voz');
    if (/\b(tips?|un consejo|consejos?|una idea|ideas|que me recomendas|que me sugeris|ayudame|ayuda|no se que dibujar|que dibujo)\b/.test(d)) return () => this.pedirTip('voz');
    return null;
  }

  // ── cuadro a cuadro: el tip que el tutor tira solo, cada tanto, mientras dibuja ──
  update() {
    if (!this.activo || !this.e) return;
    const h = this.hud, e = this.e, ahora = performance.now();
    if (!this.espontaneos || e.entregado || this.trazo) return;
    const espera = (e.tips.length ? ENTRE : PRIMERO) * 1000;
    // mientras le está hablando al tutor no se le encima un tip (y después le da unos segundos)
    if (h.consultando) { e.tUltimoTip = Math.max(e.tUltimoTip, ahora - espera + 4000); return; }
    if (ahora - e.tUltimoTip < espera) return;
    if (e.solos >= SOLOS || !this.quedan()) {
      // ya tiró los suyos: si sigue un rato sin entregar, le recuerda una vez cómo hacerlo
      if (!e.avisoEntregar && this.hayDibujo() && ahora - e.tUltimoTip > 45000 && !h.tutorAbierto && !(h.propuesta && h.propuesta.opciones.length)) {
        e.avisoEntregar = true;
        h.registrar('arte', 'aviso-entregar');
        this._decir('Cuando te guste cómo quedó, entregalo: mirá «Entregar», al lado de la hoja.');
      }
      return;
    }
    // en foco (o con la iniciativa apagada) no se muestra: queda anotado como retenido
    if (h.st.foco || !h.aj.sugerencias) { e.tUltimoTip = ahora; h.registrar('arte', 'tip-retenido'); return; }
    if (h.tutorAbierto || (h.propuesta && h.propuesta.opciones.length) || !h.puestas || !h.visible) return;
    if (h.voz && (h.voz.hablando || h.voz.ptt)) return;
    this._mostrarTip('tutor');
  }

  // ── la lámina: cabecera, herramientas y la columna del costado ──
  _pintar() {
    const e = this.e;
    if (!e) return;
    const n = e.tips.length;
    this.el.querySelector('.tit').textContent = `Arte · Tu paisaje${e.entregado ? ' · entregado' : ''}`;
    this.el.querySelector('.np').textContent = n ? `Tips · ${n}` : 'Sin tips';
    this.el.classList.toggle('entregada', e.entregado);
    let h = '';
    if (e.entregado) {
      h += '<div class="res">Entregado ✓</div><p class="nota">Tu dibujo quedó entregado.</p>';
    } else {
      if (e.tip) {
        const { def, reg } = e.tip;
        h += `<div class="tip"><b>Tip ${n} · ${esc(def.tema)}${reg.origen === 'tutor' ? ' · del tutor' : ''}</b>${esc(def.txt)}</div>`;
        h += reg.respuesta ? `<p class="nota resp">${reg.respuesta === 'lo pruebo' ? '✓ Lo vas a probar a tu manera.' : 'Lo dejaste para después.'}</p>`
          : '<div class="acc resp"><button type="button" data-resp="si">Lo pruebo</button><button type="button" data-resp="no">Ahora no</button></div>';
      } else {
        h += '<p class="nota">Mientras dibujás, el tutor te puede tirar tips. También se los podés pedir.</p>';
      }
      h += '<div class="acc pedir"></div>';
      h += '<div class="acc"><button type="button" data-deshacer>Deshacer</button><button type="button" data-borrar>Borrar todo</button></div>';
      h += '<div class="acc"><button type="button" class="prim" data-entregar>Entregar</button></div>';
    }
    this.der.innerHTML = h;
    this._quedanPintado = null;
    this._estado();
  }

  // lo que cambia con cada trazo o herramienta, sin rehacer los botones (así no se pierde lo que se está mirando)
  _estado() {
    const e = this.e;
    if (!e) return;
    const ent = e.entregado;
    this.el.querySelectorAll('.herr button').forEach((b) => {
      const d = b.dataset;
      b.classList.toggle('on', d.color != null ? !this.goma && +d.color === this.color : d.goma != null ? this.goma : d.grosor === this.grosor && !this.goma);
      b.disabled = ent;
    });
    const des = this.der.querySelector('[data-deshacer]'), bor = this.der.querySelector('[data-borrar]');
    if (des) des.disabled = !e.trazos.length;
    if (bor) bor.disabled = !visibles(e).length;
    this.vacio.hidden = ent || visibles(e).length > 0;
    // «Pedir un tip» u «Otro tip», mientras queden (el de empezar solo vale con la hoja en blanco)
    const q = this.quedan(), caja = this.der.querySelector('.pedir');
    if (caja && q !== this._quedanPintado) {
      this._quedanPintado = q;
      caja.innerHTML = q ? `<button type="button" data-tip>${e.tip ? 'Otro tip' : 'Pedir un tip'}</button>` : '<span class="nota">Ya viste todos los tips.</span>';
    }
    const mira = document.getElementById('mirada');
    if (mira) mira.style.setProperty('--lapiz', this.goma ? '#ffffff' : COLORES[this.color][1]);
  }
}
