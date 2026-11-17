// Arte (consigna 7): el dibujo de un paisaje en una lámina de las gafas, que el participante mejora antes de
// entregarlo. El tutor tira tips de composición de a uno (horizonte, árbol, colores, profundidad); cada tip
// trae dos opciones para probar y una para dejarlo como estaba. Mirar una opción muestra en el dibujo cómo
// quedaría, sin elegirla; mirar su punto la elige. No hay respuestas correctas: el dibujo es suyo y el tutor
// solo propone. Si pasa un rato sin pedir un tip, el tutor le tira uno por su cuenta (salvo en «No me
// interrumpas»). Cuando le gusta cómo quedó, lo entrega. Todo está guionado: no usa la IA real.

// los tips, en el orden en que los da el tutor. En cada opción: t (el botón), corto (cómo queda anotado),
// cambio (qué cambia en el dibujo; null = lo deja como estaba), dice (lo que contesta el tutor) y voz.
export const TIPS = [
  {
    id: 'horizonte', tema: 'Horizonte', tercios: true,
    txt: 'El horizonte está justo en el medio y parte el dibujo en dos mitades iguales. Probá correrlo a un tercio: la parte más grande gana protagonismo.',
    ops: [
      { t: 'Bajarlo · más cielo', corto: 'más cielo', cambio: { horizonte: 'abajo' }, dice: 'Ahora el cielo tiene más lugar y el paisaje se siente más abierto.', voz: /\b(bajalo|bajarlo|baja el horizonte|bajar el horizonte|mas cielo|abajo)\b/ },
      { t: 'Subirlo · más campo', corto: 'más campo', cambio: { horizonte: 'arriba' }, dice: 'Ahora gana el campo: la mirada se queda abajo, cerca del árbol.', voz: /\b(subilo|subirlo|subi el horizonte|subir el horizonte|mas campo|mas tierra|arriba)\b/ },
      { t: 'Dejarlo en el medio', corto: 'en el medio', cambio: null, dice: 'Dale, es tu dibujo. Un horizonte al medio también transmite calma.', voz: /\b(dejalo|dejarlo|en el medio|al medio|como esta|como estaba)\b/ },
    ],
  },
  {
    id: 'arbol', tema: 'El árbol', tercios: true,
    txt: 'El árbol está en el centro exacto y la mirada se queda quieta ahí. Si lo corrés a un costado, sobre una línea de los tercios, el dibujo gana movimiento.',
    ops: [
      { t: 'Correrlo a la izquierda', corto: 'a la izquierda', cambio: { arbol: 'izq' }, dice: 'Con el árbol a la izquierda, la mirada lo encuentra y después recorre el resto.', voz: /\b(izquierda)\b/ },
      { t: 'Correrlo a la derecha', corto: 'a la derecha', cambio: { arbol: 'der' }, dice: 'Con el árbol a la derecha, el otro lado respira y la mirada viaja de un lado al otro.', voz: /\b(derecha)\b/ },
      { t: 'Dejarlo en el centro', corto: 'en el centro', cambio: null, dice: 'Dale. En el centro, el árbol es lo primero que se mira: también es una decisión.', voz: /\b(dejalo|dejarlo|en el centro|al centro|en el medio|como esta|como estaba)\b/ },
    ],
  },
  {
    id: 'color', tema: 'Los colores',
    txt: 'Los colores son apagados y parecidos, así que nada resalta. Un color cálido sobre uno frío llama la atención: probá cambiar el sol o el cielo.',
    ops: [
      { t: 'Sol naranja, cálido', corto: 'sol naranja', cambio: { color: 'calido' }, dice: 'El sol naranja sobre el cielo celeste resalta: es lo primero que se ve.', voz: /\b(sol naranja|sol calido|el sol|calido)\b/ },
      { t: 'Cielo de atardecer', corto: 'atardecer', cambio: { color: 'atardecer' }, dice: 'Con el atardecer todo se vuelve cálido: cambia el clima del dibujo.', voz: /\b(atardecer|cielo)\b/ },
      { t: 'Dejar los colores', corto: 'como estaban', cambio: null, dice: 'Dale. Los colores suaves también dicen algo: tranquilidad.', voz: /\b(dejalos|dejarlos|dejar los colores|como estan|como estaban)\b/ },
    ],
  },
  {
    id: 'fondo', tema: 'Profundidad',
    txt: 'El paisaje se ve plano. Lo que está lejos se dibuja más chico y más claro: probá agregar algo al fondo para que se sienta profundo.',
    ops: [
      { t: 'Montañas a lo lejos', corto: 'montañas', cambio: { fondo: 'montanas' }, dice: 'Las montañas claras parecen lejanas: el paisaje ganó profundidad.', voz: /\b(montanas?|sierras?|cerros?)\b/ },
      { t: 'Un camino que se angosta', corto: 'un camino', cambio: { fondo: 'camino' }, dice: 'El camino se angosta hacia el horizonte y lleva la mirada al fondo.', voz: /\b(camino|sendero)\b/ },
      { t: 'Dejarlo así', corto: 'sin fondo', cambio: null, dice: 'Dale, lo dejamos así. Es tu paisaje.', voz: /\b(dejalo|dejarlo|sin fondo|como esta|como estaba)\b/ },
    ],
  },
];

// el boceto con el que empieza: todo al medio y apagado (cada tip propone cambiar una de estas cuatro cosas)
const BOCETO = { horizonte: 'medio', arbol: 'centro', color: 'apagado', fondo: 'nada' };
const COMO = {
  horizonte: { medio: 'horizonte en el medio', abajo: 'horizonte bajo (más cielo)', arriba: 'horizonte alto (más campo)' },
  arbol: { centro: 'árbol en el centro', izq: 'árbol a la izquierda', der: 'árbol a la derecha' },
  color: { apagado: 'colores apagados', calido: 'sol naranja sobre cielo celeste', atardecer: 'cielo de atardecer' },
  fondo: { nada: 'sin fondo', montanas: 'montañas a lo lejos', camino: 'un camino que se angosta' },
};

// el dibujo: 400 × 170, con las líneas de los tercios en x 133/267 e y 57/113
const W = 400, H = 170;
const HORIZONTE = { arriba: 57, medio: 85, abajo: 113 };
const ARBOL = { izq: 133, centro: 200, der: 267 };
const PALETA = {
  apagado: { cielo: ['#c3ccd0', '#d6dcdc'], sol: '#e4ddb6', tierra: '#a7af97', lejos: '#bcc5c9', copa: '#7e8a72', tronco: '#857767', camino: '#cfc7b5' },
  calido: { cielo: ['#86b6dc', '#c2dcee'], sol: '#e8743b', tierra: '#a0ae8b', lejos: '#a9bdcc', copa: '#6b8656', tronco: '#7a634d', camino: '#d8cbae' },
  atardecer: { cielo: ['#e9925f', '#f8d9ae'], sol: '#d4472a', tierra: '#8b875d', lejos: '#d6a58e', copa: '#5b6941', tronco: '#69513e', camino: '#e5c89b' },
};

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

function svgPaisaje(d, { tercios = false, marca = '', firma = '' } = {}) {
  const P = PALETA[d.color], hy = HORIZONTE[d.horizonte], tx = ARBOL[d.arbol];
  const sy = Math.max(26, hy * 0.42);       // el sol, arriba a la derecha
  const by = hy + (H - hy) * 0.5;           // la base del árbol, en el campo
  const linea = 'stroke="rgba(27,29,33,.55)" stroke-width="1" stroke-linejoin="round"';
  let s = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Tu paisaje: ${esc(describir(d))}">`;
  s += `<defs><linearGradient id="lam-cielo" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${P.cielo[0]}"/><stop offset="1" stop-color="${P.cielo[1]}"/></linearGradient></defs>`;
  s += `<rect width="${W}" height="${hy}" fill="url(#lam-cielo)"/>`;
  if (d.color !== 'apagado') s += `<circle cx="330" cy="${sy}" r="25" fill="${P.sol}" opacity=".2"/>`;
  s += `<circle cx="330" cy="${sy}" r="15" fill="${P.sol}" ${linea}/>`;
  // profundidad: montañas más claras detrás del horizonte (lo lejano, más chico y más claro)
  if (d.fondo === 'montanas') {
    s += `<path d="M0 ${hy} L54 ${hy - 25} L98 ${hy - 9} L150 ${hy - 38} L214 ${hy} Z" fill="${P.lejos}" opacity=".7" ${linea}/>`;
    s += `<path d="M168 ${hy} L248 ${hy - 31} L298 ${hy - 14} L348 ${hy - 33} L${W} ${hy - 11} L${W} ${hy} Z" fill="${P.lejos}" opacity=".9" ${linea}/>`;
  }
  s += `<rect y="${hy}" width="${W}" height="${H - hy}" fill="${P.tierra}"/>`;
  s += `<path d="M0 ${hy} H${W}" ${linea}/>`;
  // profundidad: un camino que se angosta hacia el horizonte (sin pasar por debajo del árbol)
  if (d.fondo === 'camino') {
    const vx = d.arbol === 'der' ? 160 : 250;
    s += `<path d="M${vx - 78} ${H} L${vx + 14} ${H} L${vx + 2} ${hy + 1} L${vx - 2} ${hy + 1} Z" fill="${P.camino}" ${linea}/>`;
  }
  s += `<ellipse cx="${tx + 7}" cy="${by}" rx="17" ry="3" fill="#1b1d21" opacity=".14"/>`;
  s += `<rect x="${tx - 3.5}" y="${by - 26}" width="7" height="26" fill="${P.tronco}" ${linea}/>`;
  s += `<g fill="${P.copa}" ${linea}><circle cx="${tx - 13}" cy="${by - 30}" r="13"/><circle cx="${tx + 14}" cy="${by - 31}" r="14"/><circle cx="${tx}" cy="${by - 39}" r="20"/></g>`;
  // las gafas le marcan los tercios cuando el tip habla de ellos
  if (tercios) {
    s += '<g class="tercios" stroke="#e8743b" stroke-width="1" stroke-dasharray="4 4" fill="#e8743b">';
    for (const x of [133.3, 266.7]) s += `<line x1="${x}" y1="0" x2="${x}" y2="${H}"/>`;
    for (const y of [56.7, 113.3]) s += `<line x1="0" y1="${y}" x2="${W}" y2="${y}"/>`;
    for (const x of [133.3, 266.7]) for (const y of [56.7, 113.3]) s += `<circle cx="${x}" cy="${y}" r="2.4" stroke="none"/>`;
    s += '</g>';
  }
  if (firma) s += `<text x="${W - 8}" y="${H - 8}" text-anchor="end" class="firma">${esc(firma)}</text>`;
  if (marca) s += `<g class="marca"><rect x="8" y="8" width="${marca.length * 6.3 + 14}" height="16"/><text x="15" y="19.6">${esc(marca)}</text></g>`;
  return `${s}</svg>`;
}

export function describir(d) { return Object.keys(COMO).map((k) => COMO[k][d[k]]).join(', '); }

export class Lamina {
  constructor({ hud }) {
    this.hud = hud;
    this.el = document.createElement('div');
    this.el.id = 'hud-lamina';
    this.el.hidden = true;
    document.getElementById('hud').appendChild(this.el);
    // con la mirada (o el mouse): pedir un tip, elegir una opción del tip o entregar
    this.el.addEventListener('click', (ev) => {
      const b = ev.target.closest('[data-op], [data-tip], [data-entregar]');
      if (!b || !this.activo) return;
      if (b.dataset.tip != null) return this.pedirTip('mirada');
      if (b.dataset.entregar != null) return this.entregar('mirada');
      this.elegir(+b.dataset.op, 'mirada');
    });
    this.activo = false;
    this.espontaneos = false; // tips que el tutor tira sin que se los pidan
    this.primero = 12;        // segundos sin pedir nada antes del primer tip del tutor
    this.demora = 20;         // y entre un tip y el siguiente
    this.historial = [];
  }

  // un dibujo nuevo (si el moderador vuelve a la consigna, empieza de nuevo y el anterior queda en el historial)
  cargar() {
    this.e = { d: { ...BOCETO }, i: 0, tip: null, dados: [], lineas: [], entregado: false, tEntregado: null, tInicio: performance.now(), avisoEntregar: false, vistas: new Set() };
    this.historial.push(this.e);
    this.activo = true;
    this.ultimoAvance = performance.now();
    this.el.hidden = false;
    this._pintar(true);
    this.hud.registrar('arte', 'cargar');
  }

  ocultar() { this.activo = false; this.el.hidden = true; }

  quedan() { return !!this.e && this.e.i < TIPS.length; }
  describir() { return this.e ? describir(this.e.d) : ''; }

  // ── el tutor habla en la barra de abajo, sin tapar la lámina ──
  _decir(txt) {
    const h = this.hud;
    if (h.tutorAbierto) h.cerrarTutor(true);
    h.propuesta = null;
    h.proponer(txt);
  }

  _avance() { this.ultimoAvance = performance.now(); }

  // ── tips: el siguiente de la lista (pedido o porque el tutor lo tira solo) ──
  pedirTip(origen = 'voz') {
    if (!this.activo) return;
    const e = this.e, h = this.hud;
    this._avance();
    if (e.entregado) return this._decir('Ya lo entregaste. ¡Quedó muy tuyo!');
    if (e.tip) { h.registrar('arte', `tip-repetido:${e.tip.def.id}:${origen}`); return this._decir(e.tip.def.txt); }
    if (!this.quedan()) { h.registrar('arte', `tips-agotados:${origen}`); return this._decir('Ya te di todos mis tips. Si te gusta cómo quedó, entregalo: es tu dibujo.'); }
    this._mostrarTip(origen);
  }

  _mostrarTip(origen) {
    const e = this.e, def = TIPS[e.i++];
    const reg = { id: def.id, tema: def.tema, origen, eleccion: null, aplicado: false, segundos: null, como: null };
    e.dados.push(reg);
    e.tip = { def, origen, reg, t0: performance.now() };
    this.hud.registrar('arte', `tip:${def.id}:${origen}`);
    this._pintar();
    this._decir(origen === 'tutor' ? `Te tiro un tip: ${def.txt}` : def.txt);
    this.hud.cambio();
  }

  // elige una opción del tip a la vista (la última siempre lo deja como estaba)
  elegir(k, origen = 'mirada') {
    const e = this.e;
    if (!this.activo || !e.tip || e.entregado) return;
    const def = e.tip.def, op = def.ops[k];
    if (!op) return;
    this._avance();
    Object.assign(e.tip.reg, { eleccion: op.t, aplicado: !!op.cambio, segundos: Math.round((performance.now() - e.tip.t0) / 100) / 10, como: origen });
    if (op.cambio) Object.assign(e.d, op.cambio);
    e.tip = null;
    e.lineas.push({ txt: `${def.tema}: ${op.corto}`, c: op.cambio ? 'ok' : 'igual' });
    this.hud.registrar('arte', op.cambio ? `aplicado:${def.id}:${k + 1}:${origen}` : `dejado:${def.id}:${origen}`);
    this._pintar(true);
    this._decir(op.dice);
    this.hud.cambio();
  }

  entregar(origen = 'mirada') {
    const e = this.e;
    if (!this.activo || e.entregado) return;
    this._avance();
    if (e.tip) { e.tip.reg.eleccion = null; e.tip = null; } // un tip a la vista sin responder queda así
    e.entregado = true;
    e.tEntregado = performance.now();
    const ap = e.dados.filter((x) => x.aplicado).length, vistos = e.dados.length;
    this.hud.registrar('arte', `entregado:${ap}:${origen}`);
    this._pintar(true);
    this._decir(ap ? `¡Entregado! Probaste ${ap === 1 ? 'un cambio' : `${ap} cambios`} y elegiste vos cuáles: quedó muy tuyo.`
      : vistos ? '¡Entregado! Lo dejaste como lo imaginaste: también es una decisión.' : '¡Entregado! Quedó como lo imaginaste.');
    this.hud.cambio();
  }

  // ── voz: ¿la frase es algo de la lámina? (llega sin tildes ni mayúsculas) ──
  oir(d) {
    if (!this.activo || !this.e || this.e.entregado) return null;
    const e = this.e;
    if (e.tip) {
      const ops = e.tip.def.ops;
      for (let k = 0; k < ops.length; k++) if (ops[k].voz.test(d)) return () => this.elegir(k, 'voz');
      if (/^(no|no gracias|ahora no|asi esta bien|asi esta|asi|no lo cambies|prefiero dejarlo)$/.test(d)) return () => this.elegir(ops.length - 1, 'voz');
    }
    if (/\b(entregalo|entregarlo|entregar|lo entrego|entrego|ya esta listo|termine el dibujo)\b/.test(d)) return () => this.entregar('voz');
    if (/\b(tips?|un consejo|consejos?|que le cambio|que le cambiarias|como lo mejoro|como mejoro|que mejoro|una idea|ideas|que me recomendas|que me sugeris|ayudame|ayuda|no se que cambiar)\b/.test(d)) return () => this.pedirTip('voz');
    return null;
  }

  // ── cuadro a cuadro: la vista previa de la opción que mira y el tip que el tutor tira solo ──
  update() {
    if (!this.activo) return;
    this._vistaPrevia();
    const h = this.hud, e = this.e;
    // mientras le está hablando al tutor no se le encima un tip
    if (h.consultando) { this._avance(); return; }
    if (!this.espontaneos || e.entregado || e.tip) return;
    if (performance.now() - this.ultimoAvance < (e.i ? this.demora : this.primero) * 1000) return;
    // en foco (o con la iniciativa apagada) no se muestra: queda anotado como retenido
    if (h.st.foco || !h.aj.sugerencias) { this._avance(); if (this.quedan()) h.registrar('arte', 'tip-retenido'); return; }
    if (h.tutorAbierto || (h.propuesta && h.propuesta.opciones.length) || !h.puestas || !h.visible) return;
    if (h.voz && (h.voz.hablando || h.voz.ptt)) return;
    if (this.quedan()) return this._mostrarTip('tutor');
    // ya vio todos los tips: le recuerda una vez cómo entregarlo
    if (!e.avisoEntregar) { e.avisoEntregar = true; this._avance(); h.registrar('arte', 'aviso-entregar'); this._decir('Cuando te guste cómo quedó, entregalo: mirá «Entregar», al lado del dibujo.'); }
  }

  // mirar una opción (sin elegirla) muestra en el dibujo cómo quedaría
  _vistaPrevia() {
    const e = this.e;
    const b = e.tip && !e.entregado ? (this.el.querySelector('[data-op].mirando') || this.el.querySelector('[data-op]:hover')) : null;
    const k = b ? +b.dataset.op : null;
    if (k === this._prev) return;
    this._prev = k;
    const op = k != null ? e.tip.def.ops[k] : null;
    this._dibujar(op && op.cambio ? { ...e.d, ...op.cambio } : e.d, op ? (op.cambio ? 'Vista previa' : 'Así como está') : '');
    if (op && !e.vistas.has(`${e.tip.def.id}:${k}`)) { e.vistas.add(`${e.tip.def.id}:${k}`); this.hud.registrar('arte', `mira:${e.tip.def.id}:${k + 1}`); }
  }

  // ── la lámina ──
  _dibujar(d, marca = '', cambio = false) {
    const caja = this.el.querySelector('.dibujo');
    if (!caja) return;
    const e = this.e;
    caja.innerHTML = svgPaisaje(d, { tercios: !!(e.tip && e.tip.def.tercios), marca, firma: (this.hud.nombre || '').split(/\s+/)[0] });
    caja.classList.toggle('previa', !!marca);
    // solo un cambio de verdad se anima (la vista previa cambia al instante)
    caja.classList.remove('cambia');
    if (cambio) { void caja.offsetWidth; caja.classList.add('cambia'); }
  }

  _pintar(cambio = false) {
    const e = this.e;
    if (!e) return;
    const n = e.dados.length;
    let h = `<div class="cab"><span>Arte · Tu paisaje${e.entregado ? ' · entregado' : ''}</span><span class="np">${n ? `Tips · ${n} de ${TIPS.length}` : 'Sin tips'}</span></div>`;
    // a la izquierda, el dibujo y lo que fue decidiendo; a la derecha, el tip y los botones
    h += '<div class="cols"><div class="izq"><div class="dibujo"></div>';
    h += `<ul class="cambios">${e.lineas.length ? e.lineas.map((l) => `<li class="${l.c}">${esc(l.txt)}</li>`).join('') : '<li class="vacio">Tu boceto, sin cambios</li>'}</ul></div><div class="der">`;
    if (e.entregado) {
      h += '<div class="res">Entregado ✓</div><p class="nota">Tu paisaje quedó entregado.</p>';
    } else if (e.tip) {
      const def = e.tip.def;
      h += `<div class="tip"><b>Tip ${e.i} de ${TIPS.length} · ${esc(def.tema)}${e.tip.origen === 'tutor' ? ' · del tutor' : ''}</b>${esc(def.txt)}</div>`;
      h += `<div class="ops">${def.ops.map((o, k) => `<button type="button" data-op="${k}" class="${o.cambio ? '' : 'igual'}">${esc(o.t)}</button>`).join('')}</div>`;
      h += '<p class="nota">Mirá una opción y el dibujo te muestra cómo quedaría. Vos decidís.</p>';
    } else {
      h += `<p class="nota">${this.quedan() ? '¿Le falta algo? Pedile un tip al tutor: te propone una idea y vos decidís si la usás.' : `Ya viste los ${TIPS.length} tips. Si te gusta cómo quedó, entregalo.`}</p>`;
    }
    if (!e.entregado) h += `<div class="acc">${!e.tip && this.quedan() ? '<button type="button" data-tip>Pedir un tip</button>' : ''}<button type="button" class="prim" data-entregar>Entregar</button></div>`;
    h += '</div></div>';
    this.el.innerHTML = h;
    this._prev = null; // los botones son nuevos: nada marcado todavía
    this._dibujar(e.d, '', cambio);
  }
}
