// Cerebro del tutor: una IA real conversa libremente con el participante.
// No hay guiones: en cada turno recibe qué pasa en la escuela (lugar, hora, itinerario,
// personas cerca, proceso) y devuelve qué decir y qué hacer con las gafas.
//  · Link web / archivo local: Gemini (clave gratuita de Google AI Studio, guardada solo en esta compu).
//  · claude.ai: Claude, a través de la plataforma.
import * as THREE from 'three';

const MODELOS = ['gemini-3.8-flash', 'gemini-3.6-flash', 'gemini-3.5-flash-lite', 'gemini-3.1-flash-lite'];
const LUGAR = { entrada: 'la entrada (plaza)', hall: 'el hall', taller: 'el aula-taller', proyeccion: 'la zona de proyección', rincon: 'el rincón tranquilo', nodo: 'la sala del nodo' };
const hhmm = (m) => `${Math.floor(m / 60)}:${String(Math.floor(m % 60)).padStart(2, '0')}`;

const SISTEMA = (nombre) => `Sos TUTOR, el tutor de inteligencia artificial integrado en las gafas de un estudiante de secundaria (4° año, 15 años) en una escuela argentina del año 2040. ${nombre ? `Se llama ${nombre}.` : 'No sabés su nombre.'} Te habla en voz alta y tu respuesta se lee en voz alta dentro de las gafas.

CÓMO HABLÁS
- Español rioplatense, de vos, cálido y natural. Sin emojis, sin listas, sin markdown.
- Muy breve: una o dos oraciones. Es una conversación hablada.
- Sos tutor, no buscador: cuando se trata de aprender, guiá con preguntas y pistas en vez de dar la respuesta de entrada. Si después de intentarlo sigue trabado, explicá.
- No des órdenes ni armes planes paso a paso: el estudiante decide qué hacer. Podés sugerir, una cosa por vez.
- No inventes personas, lugares ni funciones que no figuren acá o en ESTADO. Si algo no se puede, decilo.
- Si lo que escuchás no parece dirigido a vos o no se entiende, respondé con "decir" vacío y sin acciones.

LA ESCUELA
Lugares: entrada (plaza), hall (tiene gradas, un banco y un óculo en el techo), aula-taller, zona de proyección (pizarrón compartido y proyección en el piso), rincón tranquilo, sala del nodo (servidores: si se corta internet, vos y los materiales siguen funcionando desde ahí).
Todos usan gafas: compañeros y docentes. Cada persona muestra un estado (disponible, en foco, presentando). A quien está en foco no se lo interrumpe: los pedidos le llegan cuando termina.
El estudiante trabaja en grupo con Tomi y Ana en el "proyecto talles": ordenar el stock por talle de un negocio de ropa del barrio. Su docente es Prof. Sosa, que evalúa el proceso (las evidencias que el estudiante guarda), no solo el resultado. El estudiante decide qué evidencias ve la docente.
La luz del hall: entra una mancha de sol por el óculo. La Tierra gira, así que la mancha se mueve por el piso de oeste a este durante el día (a la mañana cae sobre el banco, a la tarde sobre las gradas). Al mediodía cae cerca del centro pero corrida hacia el sur, porque acá el sol del mediodía queda hacia el norte y nunca pasa justo por arriba.

QUÉ PODÉS HACER (acciones)
- {"a":"ir","lugar":"entrada|hall|taller|proyeccion|rincon|nodo"}: marca la ruta en el piso y lo lleva.
- {"a":"mirar","objetivo":"nombre de persona | sol | oculo | gradas | pizarron | derecha | izquierda | atras | arriba | abajo"}
- {"a":"panel","cual":"itinerario|mapa|proceso|docente|grupo|compartir|ajustes|conexion|menu"}: "docente" muestra lo que ve la docente. {"a":"cerrar"} cierra lo abierto.
- {"a":"foto"}: saca una foto de lo que ve y la guarda en su proceso (privada).
- {"a":"guardar","texto":"..."}: guarda una nota de lo que aprendió o descubrió en su proceso, con sus palabras.
- {"a":"destacar","id":"..."} y {"a":"visible","id":"...","valor":true|false}: sobre evidencias del proceso (ids en ESTADO).
- {"a":"compartir","id":"id de evidencia o graf","con":"pizarron|piso|santi|tomi"}: "graf" es el gráfico de stock del grupo. El pizarrón y el piso solo funcionan estando en la zona de proyección.
- {"a":"mensaje","para":"nombre","texto":"..."}: le manda un mensaje a un compañero o docente con las palabras del estudiante.
- {"a":"ayuda","persona":"nombre"}: le pide ayuda a alguien.
- {"a":"foco","valor":true|false}: silencia avisos y oculta a los demás.
- {"a":"explorar","valor":true|false}: marca con + las cosas de las que puede aprender.
- {"a":"subtitulos","valor":true|false}
- {"a":"simular_luz"}: dibuja en el piso del hall el recorrido de la mancha de sol con las horas. Solo sirve en el hall. Usala después de que el estudiante arriesgue una idea, no antes.
Hacé una acción solo si el estudiante la pidió o aceptó. Nunca compartas, mandes mensajes ni cambies qué ve la docente sin que lo pida.

FORMATO
Respondé SOLO con un objeto JSON, sin texto alrededor:
{"decir":"lo que decís en voz alta","opciones":["hasta 3 respuestas cortas que el estudiante podría dar, o lista vacía"],"acciones":[]}
Las opciones son atajos opcionales (máximo 4 palabras cada una); no las pongas en cada turno.

Cada mensaje trae ESTADO (lo que pasa ahora) y después lo que dijo el estudiante, o un EVENTO de la escuela. Ante un EVENTO, decí algo solo si de verdad ayuda (una oración); si no, "decir" vacío.`;

export class Cerebro {
  constructor({ hud, nav }) {
    this.hud = hud; this.nav = nav;
    this.backend = null;
    this.activo = false;
    this.historia = [];
    this.hechos = [];
    this.cola = Promise.resolve();
    this.registro = [];
    this.modelo = 0;
    this.sinThinking = false;
    try { this.clave = localStorage.getItem('tutor-gemini') || ''; } catch (e) { this.clave = ''; }
    hud.cerebro = this;
    hud.alEvento = (txt) => this.evento(txt);
  }

  async iniciar() {
    if (window.claude && window.claude.use) {
      try { this.sample = await window.claude.use('sample'); } catch (e) { this.sample = null; }
    }
    this.backend = this.sample ? 'claude' : this.clave ? 'gemini' : null;
    return this.backend;
  }

  setClave(k) {
    this.clave = (k || '').trim();
    try { if (this.clave) localStorage.setItem('tutor-gemini', this.clave); else localStorage.removeItem('tutor-gemini'); } catch (e) { /* */ }
    this.backend = this.sample ? 'claude' : this.clave ? 'gemini' : null;
  }

  encender(on) {
    this.activo = !!on && !!this.backend;
    this.hud.soloIA = this.activo;
    this.historia = []; this.hechos = [];
  }

  // ── hablar con el modelo ─────────────────────────────────
  async pedir(sistema, mensajes, json = true) {
    if (this.backend === 'claude') {
      const m = mensajes.map((x, i) => ({ role: x.role, content: i === 0 ? `${sistema}\n\n———\n${x.text}` : x.text }));
      const r = await this.sample(m, { modelTier: 'quick', cache: false });
      return r.text;
    }
    let ultimo = null;
    for (let i = this.modelo; i < MODELOS.length; i++) {
      const cuerpo = {
        systemInstruction: { parts: [{ text: sistema }] },
        contents: mensajes.map((x) => ({ role: x.role === 'assistant' ? 'model' : 'user', parts: [{ text: x.text }] })),
        generationConfig: { temperature: 0.7, maxOutputTokens: 400, ...(json ? { responseMimeType: 'application/json' } : {}), ...(this.sinThinking ? {} : { thinkingConfig: { thinkingLevel: 'minimal' } }) },
      };
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODELOS[i]}:generateContent`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': this.clave }, body: JSON.stringify(cuerpo),
      });
      if (r.ok) {
        this.modelo = i;
        const d = await r.json();
        const t = (((d.candidates || [])[0] || {}).content || {}).parts;
        return (t || []).filter((p) => !p.thought).map((p) => p.text || '').join('');
      }
      const err = await r.json().catch(() => ({}));
      const msg = (err.error && err.error.message) || `HTTP ${r.status}`;
      ultimo = new Error(msg); ultimo.status = r.status;
      if (r.status === 400 && !this.sinThinking && /thinking/i.test(msg)) { this.sinThinking = true; i--; continue; }
      if (r.status === 400 || r.status === 401 || r.status === 403) break; // clave inválida: no sirve probar otro modelo
      // 404 (modelo no disponible) o 429 (cupo): se prueba el siguiente
    }
    throw ultimo || new Error('sin respuesta');
  }

  async probar() {
    const t = await this.pedir('Respondé solo con JSON.', [{ role: 'user', text: 'Devolvé {"ok":true}' }]);
    return this.backend === 'claude' ? 'Claude (claude.ai)' : `Gemini · ${MODELOS[this.modelo]}${t ? '' : ' (respuesta vacía)'}`;
  }

  // ── qué pasa ahora en la escuela ─────────────────────────
  estado() {
    const h = this.hud, st = h.st, nav = this.nav, cam = h.camera.position, v = new THREE.Vector3();
    const personas = [], cosas = [];
    for (const a of h.anclas) {
      if (a.tipo === 'persona') {
        a.persona.cabeza.getWorldPosition(v);
        const d = v.distanceTo(cam);
        if (d < 18) personas.push({ nombre: a.tit, estado: a.estado ? a.estado() : '', detalle: a.det ? a.det() : '', metros: Math.round(d) });
      } else if (a.pos) {
        const d = v.set(a.pos[0], a.pos[1], a.pos[2]).distanceTo(cam);
        if (d < (a.max || 12) + 4) cosas.push({ nombre: a.tit, info: a.det ? a.det() : '' });
      }
    }
    const ag = (h.agenda || []).map((a) => `${hhmm(a.h)} ${a.tit} (${a.lugar})`);
    return {
      hora: hhmm(st.minuto),
      lugar: nav.walk ? `caminando hacia ${LUGAR[nav.walk.to] || nav.walk.to}` : LUGAR[nav.current] || nav.current,
      itinerario: ag,
      gafas: { conectadas: st.conectada, foco: st.foco, explorar: st.explorar, subtitulos: h.aj.subtitulos, sin_internet: st.local },
      mirando: h.mirada ? h.mirada.tit : null,
      panel_abierto: h.panelAbierto || null,
      personas_cerca: personas.sort((a, b) => a.metros - b.metros).slice(0, 8),
      cosas_cerca: cosas.slice(0, 6),
      proceso: st.proceso.map((e) => ({ id: e.id, texto: e.txt, la_ve_la_docente: !!e.visible, destacada: !!e.dest })),
      en_el_pizarron: st.compartido || null,
    };
  }

  anotar(hecho) { this.hechos.push(hecho); if (this.hechos.length > 6) this.hechos.shift(); }

  // ── turnos ───────────────────────────────────────────────
  usuario(texto) { return this._turno(`El estudiante dice: «${texto}»`, texto, true); }

  evento(texto) {
    if (!this.activo) return;
    this.anotar(texto);
    if (!this.hud.aj.sugerencias || !this.hud.puestas) return; // sin iniciativa: solo queda como contexto
    return this._turno(`EVENTO: ${texto}`, `(evento: ${texto})`, false);
  }

  // el participante mira al tutor o lo llama sin pedir nada
  escuchar() {
    const h = this.hud;
    h._deIA = true; h.proponer('Te escucho.'); h._deIA = false;
    if (h.voz) h.voz.abrirVentana(10);
  }

  _turno(entrada, corto, deUsuario) {
    if (!this.activo) return Promise.resolve(false);
    const tarea = async () => {
      const h = this.hud;
      if (!h.visible || !h.puestas) return false;
      if (deUsuario) this._pensando(true);
      const hechos = this.hechos.length ? `\nHECHOS RECIENTES: ${this.hechos.join(' · ')}` : '';
      const msg = `ESTADO: ${JSON.stringify(this.estado())}${hechos}\n${entrada}`;
      if (deUsuario) this.hechos = [];
      const t0 = performance.now();
      let r;
      try {
        const txt = await this.pedir(SISTEMA(h.nombre), [...this.historia, { role: 'user', text: msg }]);
        r = this._leer(txt);
      } catch (e) {
        this._pensando(false);
        this.registro.push({ hora: hhmm(h.st.minuto), entrada: corto, error: String(e.message || e) });
        if (deUsuario || !this._avisoError) {
          this._avisoError = true;
          h.aviso(e.status === 429 ? 'Se acabó el cupo gratuito de la IA por ahora. Esperá un minuto.' : `El tutor no pudo responder (${String(e.message || e).slice(0, 80)}).`, 'TUTOR', true);
        }
        return false;
      }
      this._pensando(false);
      this.historia.push({ role: 'user', text: corto }, { role: 'assistant', text: JSON.stringify({ decir: r.decir, acciones: r.acciones }) });
      if (this.historia.length > 16) this.historia.splice(0, 2);
      this.registro.push({ hora: hhmm(h.st.minuto), entrada: corto, decir: r.decir, acciones: r.acciones, ms: Math.round(performance.now() - t0) });
      h.registrar('ia', `${corto} → ${r.decir}`.slice(0, 200));
      for (const a of r.acciones) { try { this._hacer(a); } catch (e) { /* una acción inválida no corta el turno */ } }
      if (r.decir) {
        const ops = r.opciones.slice(0, 3).map((o) => [o, () => this.usuario(o)]);
        h._deIA = true; h.proponer(r.decir, ops); h._deIA = false;
      }
      return true;
    };
    this.cola = this.cola.then(tarea, tarea);
    return this.cola;
  }

  _pensando(on) {
    const h = this.hud;
    h.el.tutor.classList.toggle('pensando', on);
    if (on) { h.propuesta = null; h.el.opciones.innerHTML = ''; h.tipeo = null; h.el.tutorTxt.textContent = '…'; }
  }

  _leer(txt) {
    let o = null;
    try { o = JSON.parse(txt); } catch (e) {
      const m = (txt || '').match(/\{[\s\S]*\}/);
      if (m) { try { o = JSON.parse(m[0]); } catch (e2) { /* */ } }
    }
    if (!o || typeof o !== 'object') o = { decir: (txt || '').replace(/[{}"]/g, '').slice(0, 240) };
    return {
      decir: typeof o.decir === 'string' ? o.decir.trim() : '',
      opciones: Array.isArray(o.opciones) ? o.opciones.filter((x) => typeof x === 'string' && x.trim()).map((x) => x.trim().slice(0, 40)) : [],
      acciones: Array.isArray(o.acciones) ? o.acciones.filter((x) => x && typeof x.a === 'string') : [],
    };
  }

  // ── ejecutar lo que decidió el tutor ─────────────────────
  _hacer(x) {
    const h = this.hud, nav = this.nav, st = h.st, voz = h.voz;
    const persona = (n) => h.anclas.find((a) => a.tipo === 'persona' && a.tit.toLowerCase().includes(String(n || '').toLowerCase().replace(/^prof(e|\.)?\s*/, '')));
    switch (x.a) {
      case 'ir':
        if (!LUGAR[x.lugar] || (nav.current === x.lugar && !nav.walk)) return;
        h.guiar(x.lugar); setTimeout(() => nav.goTo(x.lugar), 900); return;
      case 'mirar': {
        const o = String(x.objetivo || '').toLowerCase();
        const dir = { derecha: [-1, 0], izquierda: [1, 0], atras: [3, 0], 'atrás': [3, 0], arriba: [0, 1], abajo: [0, -1] }[o];
        if (dir) return voz && voz.girar(dir);
        if (/pizarr/.test(o)) return voz && voz.mirarPunto(new THREE.Vector3(0, 2.2, -16.5));
        const a = persona(o) || h.anclas.find((q) => q.id === o || q.tit.toLowerCase().includes(o));
        if (a && voz) voz.mirarA(a);
        return;
      }
      case 'panel': {
        const c = { itinerario: 'hoy', hoy: 'hoy', mapa: 'mapa', proceso: 'proceso', docente: st.foco ? 'seguimiento' : 'docente', grupo: 'grupo', compartir: 'compartir', ajustes: 'ajustes', conexion: 'conexion' }[x.cual];
        if (x.cual === 'menu') return h.abrirLanzador();
        if (c) h.panel(c, true);
        return;
      }
      case 'cerrar': h.cerrarPanel(); h.cerrarLanzador(); return;
      case 'foto': h.capturar(); return;
      case 'guardar': {
        const t = String(x.texto || '').trim().slice(0, 140);
        if (!t) return;
        st.proceso.push({ id: `n${st.proceso.length + 1}`, hora: hhmm(st.minuto), txt: t, visible: true, dest: false, tag: 'Nota' });
        h.aviso('Guardado en tu proceso.', 'Proceso', true);
        if (h.panelAbierto === 'proceso') h.panel('proceso', true);
        h.cambio(); return;
      }
      case 'destacar': { const e = st.proceso.find((q) => q.id === x.id); if (e) { e.dest = true; h.aviso('Evidencia destacada.', 'Proceso', true); if (h.panelAbierto === 'proceso') h.panel('proceso', true); h.cambio(); } return; }
      case 'visible': { const e = st.proceso.find((q) => q.id === x.id); if (e) { e.visible = !!x.valor; h.aviso(e.visible ? 'Ahora la ve tu docente.' : 'Ahora la ves solo vos.', 'Proceso', true); if (h.panelAbierto === 'proceso') h.panel('proceso', true); h.cambio(); } return; }
      case 'compartir': {
        const con = { pizarron: 'pizarron', 'pizarrón': 'pizarron', piso: 'piso', santi: 'santi', tomi: 'tomi' }[String(x.con || '').toLowerCase()];
        const id = x.id === 'graf' || st.proceso.find((q) => q.id === x.id) ? x.id : null;
        if (!con || !id) return h.panel('compartir', true);
        h.comp = { item: id, destino: con }; h.enviar(); return;
      }
      case 'mensaje': return this._mensaje(String(x.para || ''), String(x.texto || ''));
      case 'ayuda': { const a = persona(x.persona); if (a) h.pedirAyuda(a.tit); return; }
      case 'foco': if (!!x.valor !== !!st.foco) h.setFoco(!!x.valor); return;
      case 'explorar': if (!!x.valor !== !!st.explorar) h.setExplorar(!!x.valor); return;
      case 'subtitulos': h.setAjuste('subtitulos', !!x.valor); return;
      case 'simular_luz': if (nav.current === 'hall') h.oculo.simular(); return;
      default:
    }
  }

  // mensaje a otra persona: la respuesta también la improvisa la IA, en el papel de esa persona
  _mensaje(para, texto) {
    const h = this.hud;
    if (!para || !texto) return;
    const a = h.anclas.find((q) => q.tipo === 'persona' && q.tit.toLowerCase().includes(para.toLowerCase().replace(/^prof(e|\.)?\s*/, '')));
    const nombre = a ? a.tit : para;
    h.aviso(`Para ${nombre}: «${texto.slice(0, 120)}»`, 'Mensaje enviado', true);
    h.registrar('mensaje', `${nombre}: ${texto}`);
    if (/santi/i.test(nombre)) h.st.ensenoSanti = true;
    const quien = /sosa/i.test(nombre) ? 'Prof. Sosa, docente del taller, amable y concreta' : `${nombre}, compañero o compañera de 4° año, 15 años`;
    const foco = a && a.persona.o.foco;
    setTimeout(async () => {
      if (foco) return h.aviso(`${nombre} está en foco: lo va a ver cuando termine.`, 'Mensajes', true);
      let r = '👍';
      try {
        r = (await this.pedir(`Sos ${quien}, en una escuela argentina de 2040 donde todos usan gafas con mensajes. Contexto: ${nombre} ${a && a.det ? a.det() : ''}. Respondé al mensaje en UNA línea corta, informal, en español rioplatense, sin emojis. Solo el texto de la respuesta.`, [{ role: 'user', text: texto }], false)).trim().replace(/^["«]|["»]$/g, '').slice(0, 140) || r;
      } catch (e) { /* queda el pulgar */ }
      h.aviso(r, nombre);
      this.anotar(`${nombre} respondió: «${r}»`);
    }, 1800);
  }
}
