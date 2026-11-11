// Voz: el test se maneja hablando. El participante le habla al TUTOR y le responde en voz alta.
// Dos formas de escuchar, según dónde se abra la página:
//  · claude.ai: dictado de la plataforma, mientras se mantiene apretada la barra espaciadora.
//  · Chrome (link web o archivo local): manos libres, se lo llama diciendo «Tutor…»; la barra también sirve.
import * as THREE from 'three';

const norm = (s) => (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/[¿?¡!.,;:«»"()\-–—]/g, ' ').replace(/\s+/g, ' ').trim();

const VACIAS = new Set('la el los las de del a al que y en lo un una mi tu me te por para con se le les mas muy eso esto este esta ese esa ahi aca'.split(' '));
const palabras = (s) => norm(s).split(' ').filter((w) => w && !VACIAS.has(w));

function lev(a, b) {
  if (Math.abs(a.length - b.length) > 2) return 9;
  const m = Array.from({ length: a.length + 1 }, (_, i) => [i]);
  for (let j = 1; j <= b.length; j++) m[0][j] = j;
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) m[i][j] = Math.min(m[i - 1][j] + 1, m[i][j - 1] + 1, m[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return m[a.length][b.length];
}
const parecida = (a, b) => a === b || (a.length >= 4 && b.length >= 4 && (a.startsWith(b.slice(0, 5)) || b.startsWith(a.slice(0, 5)) || lev(a, b) <= 1));

// cuánto de una etiqueta aparece en lo que se dijo (0 a 1)
function puntaje(dicho, etiqueta) {
  const d = norm(dicho), e = norm(etiqueta);
  if (!e) return 0;
  if (d === e || (e.length > 3 && d.includes(e))) return 1;
  const pe = palabras(etiqueta), pd = palabras(dicho);
  if (!pe.length) return 0;
  let n = 0;
  for (const w of pe) if (pd.some((x) => parecida(x, w))) n++;
  return n / pe.length;
}

const SI = /^(si|sii|dale|ok|okey|okay|bueno|listo|vamos|de una|obvio|claro|genial|perfecto|seguir|sigamos|segui|joya|va|hagamoslo|si dale|dale si|si por favor|me parece bien)\b/;
const NO = /^(no|ahora no|despues|mas tarde|nada|no gracias|dejalo|paso|cancelar|no quiero)\b/;
const ORDINAL = [/\b(primera|primero|uno|1)\b/, /\b(segunda|segundo|dos|2)\b/, /\b(tercera|tercero|tres|3)\b/, /\b(cuarta|cuarto|cuatro|4)\b/];
// Se lo llama diciendo «Tutor». Cuenta como llamado solo al principio de la frase
// («Tutor, …», «che tutor …»), para no confundirlo con «el tutor me dijo…» al pensar en voz alta.
const DESPERTAR = /^(ok |oye |eh |che |hola |dale |a ver )?(tutor|tutora|tuto|tutu|doctor)\b/;
const VOCATIVO = '^(?:(?:ok|oye|eh|che|hola|dale|a ver|bueno|y)\\s+)?';
const LLAMADO_FIRME = new RegExp(VOCATIVO + '(tutor|tutora)\\b');
const LLAMADO_DEBIL = new RegExp(VOCATIVO + '(tuto|tutu|doctor|tu tor)\\b'); // puede ser «Tutor» mal transcripto
// separa «… hilo, llevame al taller» en llamado + pedido
function llamado(t) {
  const d = norm(t);
  let m = d.match(LLAMADO_FIRME);
  if (m) return { firme: true, resto: d.slice(m[0].length).trim() };
  m = d.match(LLAMADO_DEBIL);
  if (m) return { firme: false, resto: d.slice(m[0].length).trim() };
  return null;
}

const LUGARES = [
  ['entrada', /\b(entrada|puerta|afuera|plaza|la calle)\b/],
  ['hall', /\b(hall|jol|joll|hol|vestibulo|patio)\b/],
  ['taller', /\b(taller|aula|mi mesa|la mesa|clase de talles)\b/],
  ['proyeccion', /\b(proyeccion|presentacion|presentaciones|exposicion)\b/],
  ['rincon', /\b(rincon|lugar tranquilo|zona tranquila)\b/],
  ['nodo', /\b(nodo|servidor|servidores|sala del nodo)\b/],
];
const PERSONAS = [['Tomi', /\b(tomi|tomas|tommy)\b/], ['Ana', /\bana\b/], ['Juli', /\b(juli|julian|julia)\b/], ['Prof. Sosa', /\b(sosa|profe|profesora|docente)\b/], ['Santi', /\b(santi|santiago)\b/], ['Mica', /\b(mica|micaela)\b/], ['Lauti', /\b(lauti|lautaro)\b/], ['Nahuel', /\bnahuel\b/], ['Cami', /\b(cami|camila)\b/], ['Fede', /\b(fede|federico)\b/]];
const COSAS = [
  ['sol', /\b(luz|mancha|sol)\b/], ['oculo', /\b(oculo|techo|claraboya)\b/], ['gradas', /\b(gradas|escalones|escalera)\b/],
  ['maceta', /\b(maceta|planta|salvia)\b/], ['fachada', /\b(fachada|parasoles)\b/], ['antena', /\bantena\b/],
  ['perchero', /\b(perchero|ropa|percha)\b/], ['mesa', /\b(mesa|mi mesa)\b/], ['racks', /\b(servidores|racks|rack)\b/],
  ['pizarron', /\b(pizarron|pantalla)\b/], ['holo', /\b(holograma|proyeccion del piso|barras)\b/],
];
const lugarEn = (d) => (LUGARES.find(([, r]) => r.test(d)) || [])[0];
const personaEn = (d) => (PERSONAS.find(([, r]) => r.test(d)) || [])[0];

export class Voz {
  constructor({ hud, nav }) {
    this.hud = hud; this.nav = nav;
    this.modo = null;        // 'claude' | 'web' | null
    this.activa = false;     // escuchando de fondo (manos libres)
    this.ptt = false;        // barra espaciadora apretada
    this.ventana = 0;        // hasta cuándo no hace falta decir «Tutor»
    this.hablaTutor = true;
    this.ultimo = '';
    this.el = { voz: document.getElementById('hud-voz') };
    this.el.dot = this.el.voz.querySelector('i');
    this.el.txt = this.el.voz.querySelector('em');
    this.registro = [];
    hud.alDecir = (txt, info) => this.decir(txt, info);
    hud.voz = this;
  }

  // ── preparar ─────────────────────────────────────────────
  async iniciar() {
    const c = window.claude && window.claude.use ? window.claude : null;
    if (c) {
      try { this.dictado = await c.use('dictation'); } catch (e) { this.dictado = null; }
      try { this.tts = await c.use('tts'); } catch (e) { this.tts = null; }
    }
    const R = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (this.dictado) this.modo = 'claude';
    else if (R && location.protocol !== 'about:') this.modo = 'web';
    if (this.dictado) {
      this.parciales = '';
      this.dictado.onPartial(({ text }) => this._mostrar(text, true));
      this.dictado.onFinal(({ text }) => { this.finales = ((this.finales || '') + ' ' + text).trim(); this._mostrar(this.finales, true); });
      this.dictado.onState(({ state }) => this._estado(state === 'listening' ? 'escucha' : 'quieta'));
    }
    if (this.tts && this.tts.onState) this.tts.onState(({ state }) => { this.hablando = state === 'speaking'; this._estado(this.hablando ? 'habla' : (this.ptt ? 'escucha' : 'quieta')); });
    this.sintesis = !this.tts && window.speechSynthesis ? window.speechSynthesis : null;
    if (this.sintesis) {
      const cargar = () => { this.voces = this.sintesis.getVoices(); };
      cargar();
      this.sintesis.onvoiceschanged = cargar;
    }
    this._teclas();
    this.hud.pistaVoz = this.modo === 'claude' ? 'Mantené la barra espaciadora y hablame.' : this.modo === 'web' ? 'Hablame cuando quieras: «Tutor, llevame al taller».' : '';
    this._estado('quieta');
    return this.modo;
  }

  describir() {
    if (this.modo === 'claude') return 'Dictado de claude.ai: el participante mantiene la barra espaciadora mientras habla.';
    if (this.modo === 'web') {
      const base = 'Manos libres: el participante le habla al TUTOR. Empezar con «Tutor…» asegura que responda; los pedidos claros («llevame al taller», «sacá una foto») funcionan aunque no lo diga.';
      return location.protocol === 'file:' ? `${base} Ojo: abierto como archivo, Chrome pide el permiso del micrófono seguido. Abrilo con el link web o con «Abrir test TUTOR.bat».` : base;
    }
    return 'Este navegador no puede escuchar. Abrí el test en Chrome.';
  }

  // prueba del micrófono desde la preparación (se llama desde un clic)
  probar(cb) {
    if (this.modo === 'claude') {
      this.finales = ''; this._parcial = '';
      const prev = this.alMostrar;
      this.alMostrar = (t) => cb(t, true);
      this.dictado.start().then(() => {
        setTimeout(async () => { try { await this.dictado.stop(); } catch (e) { /* */ } this.alMostrar = prev; cb((this.finales || this._parcial || '').trim() || 'No escuché nada. Revisá el permiso del micrófono.', false); }, 4000);
      }, (e) => { this.alMostrar = prev; cb(e && e.code === 'not_granted' ? 'El navegador no dio permiso para el micrófono.' : 'No se pudo abrir el micrófono.', false); });
      return;
    }
    const R = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!R) return cb('Este navegador no puede escuchar. Abrí el test en Chrome.', false);
    const prev = this.alMostrar;
    let oido = '';
    this.probando = true;
    this.alMostrar = (t) => { oido = t; cb(t, true); };
    this.encender();
    setTimeout(() => {
      this.probando = false;
      this.alMostrar = prev;
      cb(this.error ? this.error : oido ? `Escuché: ${oido.trim()} · el micrófono queda abierto para el test` : 'No escuché nada. Revisá el permiso del micrófono.', false);
    }, 5000);
  }

  // manos libres (Chrome local)
  encender() {
    if (this.modo !== 'web' || this.activa) return;
    this.activa = true;
    this._rec();
  }

  apagar() { this.activa = false; try { this.rec && this.rec.abort(); } catch (e) { /* */ } }

  _tutorHablando() {
    if (this.hablando && performance.now() - (this.hablandoDesde || 0) > 20000) this.hablando = false; // nunca queda trabado
    return this.hablando || performance.now() < (this.silencioHasta || 0);
  }

  _callarTutor() {
    this.colaVoz = [];
    this._cortarVoz();
    this.hablando = false;
    this.silencioHasta = 0;
  }

  _esEco(t, estricto = false) {
    const u = this.ultimoDicho;
    if (!u || performance.now() - u.t > 8000) return false;
    return estricto ? puntaje(t, u.txt) > 0.85 && palabras(t).length >= 5 : puntaje(t, u.txt) > 0.6 && palabras(t).length >= 3;
  }

  // El micrófono también oye los parlantes: lo que dijeron el tutor o un compañero puede volver
  // como si lo hubiera dicho la persona. Se guarda qué sonó y cuándo, para reconocer ese eco.
  _sonando(item) {
    const ahora = performance.now();
    this.recientes = (this.recientes || []).filter((v) => v.t1 === Infinity || ahora - v.t1 < 20000);
    const v = { txt: item.limpio, t0: ahora, t1: Infinity };
    this.recientes.push(v);
    return v;
  }

  // una frase que empezó a oírse mientras sonaba una voz (o apenas terminó) puede ser eco
  _sospechosa(t0) {
    return (this.recientes || []).some((v) => t0 >= v.t0 - 300 && t0 <= v.t1 + 1300);
  }

  // Quita el eco: null si todo lo oído es lo que acaba de sonar; si la persona habló pegado
  // al final de la voz, devuelve solo su parte. El eco se reconoce porque repite lo que sonó
  // en el mismo orden (con alguna palabra mal oída); lo que sigue después es de la persona.
  _sinEco(t) {
    const ws = norm(t).split(' ').filter(Boolean);
    if (!ws.length) return null;
    const igual = (w, x) => x === w || (w.length >= 4 && parecida(w, x));
    let k = 0;
    for (const v of this.recientes || []) {
      const seq = norm(v.txt).split(' ').filter(Boolean);
      let pos = -1, n = 0, i = 0;
      const busca = (w) => {
        const desde = pos < 0 ? 0 : pos + 1, hasta = pos < 0 ? seq.length : Math.min(seq.length, pos + 5);
        for (let j = desde; j < hasta; j++) if (igual(w, seq[j])) return j;
        return -1;
      };
      while (i < ws.length) {
        let j = busca(ws[i]);
        if (j >= 0) { pos = j; i++; n = i; continue; }
        // una palabra mal oída en el medio del eco: si la siguiente sigue el orden, también es eco
        if (pos >= 0 && i + 1 < ws.length && (j = busca(ws[i + 1])) >= 0) { pos = j; i += 2; n = i; continue; }
        break;
      }
      k = Math.max(k, n);
    }
    if (!k) return t;
    return k < ws.length ? ws.slice(k).join(' ') : null;
  }

  // ¿lo que se escuchó son palabras que el tutor acaba de decir? (comparación exacta, sirve para frases cortas)
  _ecoExacto(t) {
    const u = this.ultimoDicho;
    if (!u || performance.now() - u.t > 15000) return false;
    const dichas = new Set(norm(u.txt).split(' '));
    const ws = palabras(t);
    return ws.length > 0 && ws.filter((w) => dichas.has(w)).length / ws.length >= 0.75;
  }

  _rec() {
    const R = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!R || this.escuchandoWeb) return;
    const rec = (this.rec = new R());
    rec.lang = 'es-AR';
    rec.continuous = true;
    rec.interimResults = true;
    rec.maxAlternatives = 3;
    rec.onstart = () => { this.escuchandoWeb = true; this.vistos = new Map(); this._estado('escucha'); };
    rec.onresult = (e) => {
      const vistos = (this.vistos = this.vistos || new Map());
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        let t = r[0].transcript;
        if (!vistos.has(i)) vistos.set(i, performance.now()); // cuándo empezó a oírse esta frase
        if (this.probando) { this._mostrar(t, !r.isFinal); continue; }
        let corto = false;
        if (this._tutorHablando()) {
          // mientras habla el tutor, solo cuenta si lo interrumpen llamándolo
          // (o, en el test de tareas, con un pedido corto como «pará» o «¿qué es eso?»)
          const ll = llamado(t);
          // (un pedido largo que repite lo que el tutor viene diciendo es su eco, no un pedido)
          const corta = !!this.hud.interrumpe && !this._ecoExacto(t) && (palabras(t).length < 3 || this._sinEco(t) != null) && this.hud.interrumpe(norm(t));
          if (!corta && (!ll || !ll.firme || this._esEco(t))) continue;
          this._callarTutor();
          corto = true;
        }
        let alternativas = Array.from(r).map((x) => x.transcript);
        if (!corto) {
          if (this._sospechosa(vistos.get(i))) {
            // empezó mientras sonaba una voz: lo que se repite de esa voz es eco, no la persona
            const propio = this._sinEco(t);
            if (propio == null) continue;
            if (propio !== t) { t = propio; alternativas = [t]; }
          } else if (this._esEco(t, true)) continue;
        }
        if (!r.isFinal) { this._mostrar(t, true); continue; }
        this._final(t, alternativas);
      }
    };
    rec.onerror = (e) => {
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') { this.activa = false; this.error = 'Sin permiso para el micrófono'; this._estado('error'); }
      else if (e.error === 'audio-capture') { this.error = 'No encuentro un micrófono'; this._estado('error'); }
      else if (e.error === 'network') { this.error = 'Sin conexión con el reconocimiento de voz (necesita internet)'; this._estado('error'); }
    };
    rec.onend = () => {
      // Chrome corta la sesión de vez en cuando: se retoma sin cerrar nada más
      this.escuchandoWeb = false;
      if (this.activa) setTimeout(() => this._rec(), 250);
      else this._estado('quieta');
    };
    try { rec.start(); } catch (e) { this.escuchandoWeb = false; }
  }

  _despierta(t) { return DESPERTAR.test(norm(t)); }
  _enVentana() { return performance.now() < this.ventana; }
  abrirVentana(seg) { this.ventana = Math.max(this.ventana, performance.now() + seg * 1000); }

  // Una frase terminada. Si le hablaron al TUTOR (o el tutor acaba de preguntar), se responde siempre.
  // Si no, solo se actúa cuando la frase es un pedido claro: así no molesta a quien piensa en voz alta.
  _final(t, alternativas) {
    const ll = llamado(t);
    const dirigido = !!(ll && ll.firme) || this.ptt || this._enVentana();
    this.oir(t, alternativas, { dirigido, debil: !!ll && !ll.firme });
  }

  // barra espaciadora: mantener para hablar
  _teclas() {
    window.addEventListener('keydown', (e) => {
      if (e.code !== 'Space' || e.repeat || (e.target && /input|textarea/i.test(e.target.tagName))) return;
      if (!this.hud.visible) return;
      e.preventDefault();
      this.ptt = true;
      if (this.modo === 'claude') {
        try { if (this.tts) this.tts.stop(); } catch (er) { /* */ }
        this.finales = '';
        this.dictado.start().catch((er) => { this.ptt = false; this.error = er && er.code === 'not_granted' ? 'Sin permiso para el micrófono' : ''; this._estado(this.error ? 'error' : 'quieta'); });
        this._estado('escucha');
      } else if (this.modo === 'web') {
        if (this.sintesis) this.sintesis.cancel();
        this.hablando = false;
        if (!this.escuchandoWeb) { this.activa = true; this._rec(); }
        this._estado('escucha');
      }
    });
    window.addEventListener('keyup', async (e) => {
      if (e.code !== 'Space' || !this.ptt) return;
      e.preventDefault();
      if (this.modo === 'claude') {
        try { await this.dictado.stop(); } catch (er) { /* */ }
        this.ptt = false;
        const t = (this.finales || '').trim() || (this._parcial || '').trim();
        this.finales = ''; this._parcial = '';
        if (t) this.oir(t);
        else this._estado('quieta');
      } else {
        // en manos libres la frase llega sola; la ventana deja contestar sin «Tutor»
        this.abrirVentana(2.5);
        setTimeout(() => { this.ptt = false; }, 1500);
      }
    });
  }

  // ── mostrar ──────────────────────────────────────────────
  _estado(e) {
    this.estadoVoz = e;
    const v = this.el.voz;
    v.dataset.estado = e;
    v.hidden = !this.modo;
    if (e === 'error') this.el.txt.textContent = this.error || 'No te escucho';
  }

  _mostrar(t, parcial, resultado) {
    if (parcial) this._parcial = t;
    if (this.alMostrar) this.alMostrar(t, parcial);
    const marca = resultado === 'ok' ? ' ✓' : resultado === 'no' ? ' ?' : '';
    this.el.txt.textContent = t ? `«${t.trim()}»${marca}` : '';
    this.el.voz.classList.toggle('parcial', !!parcial || resultado === 'nada');
    clearTimeout(this._tTxt);
    this._tTxt = setTimeout(() => { this.el.txt.textContent = ''; }, 5000);
  }

  // ── hablar (voz del tutor y de los compañeros) ───────────
  decir(texto, { quien = 'tutor', pregunta = false, alTerminar = null } = {}) {
    if (!this.hablaTutor || !this.hud.puestas || !texto) return;
    if (quien === 'tutor') this.ultimo = texto;
    const item = { limpio: texto.replace(/[«»]/g, '').replace(/·/g, ','), quien, pregunta, alTerminar };
    this.colaVoz = this.colaVoz || [];
    if (quien === 'tutor') { this.colaVoz = this.colaVoz.filter((x) => x.quien !== 'tutor'); this.colaVoz.push(item); } // del tutor solo queda lo último
    else {
      // un compañero o la docente: pasa primero, antes que cualquier frase del tutor
      const k = this.colaVoz.findIndex((x) => x.quien === 'tutor');
      if (k < 0) this.colaVoz.push(item); else this.colaVoz.splice(k, 0, item);
    }
    // el tutor nunca habla encima: si está hablando él, se corta (por un compañero o por su propia frase nueva)
    if (this.actualVoz && this.actualVoz.quien === 'tutor') this._cortarVoz();
    this._sigVoz();
  }

  _cortarVoz() {
    try { if (this.sintesis) this.sintesis.cancel(); if (this.tts) this.tts.stop(); } catch (e) { /* */ }
  }

  _sigVoz() {
    if (this.actualVoz || this.ptt) return;
    const item = (this.colaVoz || []).shift();
    if (!item) return;
    this.actualVoz = item;
    this.hablando = true;
    this.hablandoDesde = performance.now();
    this.ultimoDicho = { txt: item.limpio, t: performance.now() };
    const sonido = this._sonando(item);
    this._estado('habla');
    let listo = false;
    const fin = () => {
      if (listo) return;
      listo = true;
      sonido.t1 = performance.now();
      this.actualVoz = null;
      this.hablando = false;
      this.silencioHasta = performance.now() + 700;
      if (item.pregunta) this.abrirVentana(10);
      if (item.alTerminar) item.alTerminar();
      if (this.activa && this.modo === 'web' && !this.escuchandoWeb) this._rec();
      this._estado(this.activa || this.ptt ? 'escucha' : 'quieta');
      setTimeout(() => this._sigVoz(), 350); // un respiro entre una voz y la siguiente
    };
    setTimeout(fin, 2500 + item.limpio.length * 90);
    if (this.tts) { this.tts.speak(item.limpio, { voice: item.quien === 'tutor' ? 'buttery' : 'airy', language: 'es' }).then(fin, fin); return; }
    const s = this.sintesis;
    if (!s) return fin();
    const u = new SpeechSynthesisUtterance(item.limpio);
    if (!this.vozEs) {
      const voces = (this.voces && this.voces.length ? this.voces : s.getVoices()).filter((v) => v.lang && v.lang.replace('_', '-').toLowerCase().startsWith('es'));
      const pref = ['es-ar', 'es-us', 'es-mx', 'es-419', 'es-es'];
      const nota = (v) => { const l = v.lang.replace('_', '-').toLowerCase(); const i = pref.indexOf(l); return (i < 0 ? 9 : i) - (/google|natural|online/i.test(v.name) ? 0.5 : 0); };
      this.vozEs = voces.sort((a, b) => nota(a) - nota(b))[0] || null;
    }
    u.voice = this.vozEs;
    u.lang = u.voice ? u.voice.lang : 'es-AR';
    u.rate = 1.04 * (this.ritmo || 1); // «más despacio» en la explicación guionada
    u.pitch = item.quien === 'tutor' ? 1 : 1.3;
    u.onend = fin; u.onerror = fin;
    s.speak(u);
  }

  // ── entender ─────────────────────────────────────────────
  // lo que dijo el participante → una acción de las gafas
  oir(texto, alternativas = [], { dirigido = true, debil = false } = {}) {
    const h = this.hud;
    if (!h.visible) return false;
    const limpiar = (t) => {
      const ll = llamado(t);
      const base = ll ? ll.resto : norm(t);
      return base.replace(/^(por favor|porfa|che|eh|bueno|a ver)\s+/, '').replace(/\s+(por favor|porfa)$/, '').trim();
    };
    const d = limpiar(texto);
    this.dirigido = dirigido || debil;
    if (h.ia) return this._oirIA(texto, d, dirigido || debil);
    const r = this._interpretar(d, texto) || alternativas.slice(1).map((a) => this._interpretar(limpiar(a), a)).find(Boolean);
    this.registro.push({ t: h.st ? h.st.minuto : 0, dijo: texto, hizo: !!r });
    h.registrar('voz', `${texto}${r ? '' : ' (sin acción)'}`);
    this._mostrar(texto, false, r ? 'ok' : dirigido ? 'no' : 'nada');
    if (r) { this.abrirVentana(6); r(); return true; }
    if (dirigido) this._noEntendi(d);
    return false;
  }

  // con IA: el intérprete local solo decide si la frase era un pedido; la respuesta la da el modelo
  _oirIA(texto, d, dirigido) {
    const h = this.hud;
    const anotar = (res) => { this.registro.push({ t: h.st.minuto, dijo: texto, hizo: res !== 'nada' }); h.registrar('voz', texto); this._mostrar(texto, false, res); };
    // gafas, repetir y callar: al instante
    if (/\b(saca|sacar|sacarme|me saco|quita|quitarme|me quito)\b.*\b(gafas|lentes|anteojos)\b/.test(d)) { anotar('ok'); h.quitarGafas(); return true; }
    if (/\b(pone|poner|ponerme|me pongo)\b.*\b(gafas|lentes|anteojos)\b/.test(d)) { anotar('ok'); h.ponerGafas(); return true; }
    if (!h.puestas) return false;
    if (/^(repeti|repetir|repetilo|que dijiste|de nuevo|otra vez)$/.test(d)) { anotar('ok'); this.decir(this.ultimo || h.el.tutorTxt.textContent); return true; }
    if (/^(silencio|callate|basta|para|cerra|cerrar|cerrar todo)$/.test(d)) { anotar('ok'); this._callarTutor(); h.cerrarPanel(); h.cerrarLanzador(); h.cerrarTutor(true); return true; }
    // una opción que el tutor ofreció
    const ops = this._opciones();
    if (ops.length) {
      let mejor = null, pm = 0;
      for (const b of ops) { const p = puntaje(d, b.textContent); if (p > pm) { pm = p; mejor = b; } }
      if (pm >= 0.67) { anotar('ok'); this._hacer(mejor)(); return true; }
    }
    const solo = !d && llamado(texto);
    const pedido = dirigido || !!this._interpretar(d, texto);
    if (!pedido) { anotar('nada'); return false; }
    anotar('ok');
    if (solo) { this.abrirVentana(10); h.proponer('Te escucho.'); return true; }
    this.abrirVentana(8);
    const local = this._interpretar(d, texto);
    const limpio = texto.replace(/^\s*((ok|oye|eh|che|hola|dale|a ver|bueno|y)[,\s]+)?tutora?[,:.\s]*/i, '').trim() || texto;
    h.cerebro.decirle(limpio).then((ok) => {
      if (ok) return;
      // sin conexión con el modelo: se resuelve con lo que se entienda localmente
      if (local) local(); else h.proponer(h.cerebro.error || 'No me pude conectar. Probá de nuevo en un momento.');
    });
    return true;
  }

  _hacer(el) {
    if (!el) return null;
    return () => {
      el.classList.add('voz-ok');
      setTimeout(() => { el.classList.remove('voz-ok'); el.click(); }, 260);
    };
  }

  _opciones() {
    const o = this.hud.el.opciones;
    if (o.classList.contains('esperando')) return [];
    return Array.from(o.querySelectorAll('button'));
  }

  _interpretar(d, crudo) {
    const h = this.hud, nav = this.nav, st = h.st;
    const dir = this.dirigido !== false;
    if (!d && llamado(crudo) && llamado(crudo).firme) {
      // solo «Tutor»: el tutor escucha
      return () => { this.abrirVentana(8); if (!h.tutorAbierto && h.puestas) h.abrirTutor(); };
    }
    // 1 · gafas
    if (/\b(saca|sacar|sacarme|sacate|me saco|quita|quitar|quitarme|me quito)\b.*\b(gafas|lentes|anteojos)\b/.test(d)) return () => h.quitarGafas();
    if (/\b(pone|poner|ponerme|ponete|me pongo)\b.*\b(gafas|lentes|anteojos)\b/.test(d)) return () => h.ponerGafas();
    if (!h.puestas) return null;
    // 1b · lo que entiende el modo activo (test de tareas: corazón, ejercicio, foco)
    if (h.oirExtra) { const r = h.oirExtra(d, dir, crudo); if (r) return r; }
    // 2 · cortitas
    if (/^(repeti|repetir|repetilo|que dijiste|de nuevo|otra vez)\b/.test(d)) return () => this.decir(this.ultimo || h.el.tutorTxt.textContent);
    if (/^(cerra|cerrar|cerralo|cerrar todo|volver|volve|salir|sali|ya esta|basta|listo gracias|eso es todo)$/.test(d)) return () => { h.cerrarPanel(); h.cerrarLanzador(); h.cerrarTutor(); };

    // 3 · predicción del óculo
    if (h.oculo && h.oculo.estado === 'predecir') {
      const corto = d.split(' ').length <= 4;
      let k = null;
      const letra = corto && (dir || d.split(' ').length <= 2);
      if (/\b(debajo|abajo|centro|medio)\b/.test(d) || (letra && /\b(a|la a|opcion a)$/.test(d))) k = 'A';
      else if (/\b(proyeccion|sur|adelante|un poco)\b/.test(d) || (letra && /\b(b|be|la b|la be|opcion b)$/.test(d))) k = 'B';
      else if (/\b(gradas|escalones)\b/.test(d) || (letra && /\b(c|ce|se|la c|la ce|opcion c)$/.test(d))) k = 'C';
      if (k) { const b = h.oculo.botones.find((x) => x.el.textContent.startsWith(k)); return this._hacer(b && b.el); }
      if (/\bpista\b/.test(d)) return () => h.oculo._pista();
    }

    // 4 · contestar al tutor
    const ops = this._opciones();
    if (ops.length) {
      let mejor = null, pm = 0;
      for (const b of ops) { const p = puntaje(d, b.textContent); if (p > pm) { pm = p; mejor = b; } }
      if (pm >= 0.67) return this._hacer(mejor);
      const corta = d.split(' ').length <= 4;
      // «sí», «no», «la primera» sueltos solo valen si le hablaron al TUTOR o si es una respuesta corta
      if (!dir && !corta) return null;
      const ord = ORDINAL.findIndex((r) => r.test(d) && d.split(' ').length <= 4);
      if (ord >= 0 && ops[ord]) return this._hacer(ops[ord]);
      if (SI.test(d) && d.split(' ').length <= 4) return this._hacer(ops[0]);
      if (NO.test(d) && d.split(' ').length <= 4) {
        const neg = ops.find((b) => /\b(no|despues|mas tarde|nada|ahora no)\b/.test(norm(b.textContent)));
        return neg ? this._hacer(neg) : () => { h.propuesta = null; h.cerrarTutor(); };
      }
    }

    // 5 · menú de funciones abierto
    if (!h.el.lanzador.hidden) {
      let mejor = null, pm = 0;
      for (const b of h.el.lanzador.querySelectorAll('.fn')) { const p = puntaje(d, b.querySelector('b') ? b.querySelector('b').textContent : b.textContent); if (p > pm) { pm = p; mejor = b; } }
      if (pm >= 0.99) return this._hacer(mejor);
    }

    // 6 · lo que está abierto en el panel
    const panel = h.panelAbierto;
    if (panel === 'proceso' || panel === 'docente') {
      if (/\b(ver como|vista del|como me ve|que ve|vea|ve mi)\b.*\b(docente|profe|profesora|sosa)\b/.test(d) || /^vista docente/.test(d)) return this._hacer(h.el.panel.querySelector('[data-a="ver-docente"]'));
      const accion = /\b(destaca|destacar|destacala|destacalo|estrella|marca|marcar|resalta|resaltar)\b/.test(d) ? 'dest' : /\b(oculta|ocultar|esconde|esconder|privad)/.test(d) ? 'ocu' : /\b(mostra|mostrar|que la vea|visible)\b/.test(d) ? 'mos' : null;
      if (accion) {
        const resto = d.replace(/\b(destaca|destacar|destacala|destacalo|estrella|marca|marcar|resalta|resaltar|oculta|ocultar|esconde|esconder|mostra|mostrar|la evidencia|evidencia)\b/g, '');
        let mejor = null, pm = 0;
        for (const e of st.proceso) { const p = puntaje(resto, e.txt) + (resto.includes('foto') && e.tag === 'Captura' ? 0.5 : 0); if (p > pm) { pm = p; mejor = e; } }
        if (!mejor || pm < 0.2) mejor = st.proceso.find((e) => e.id === 'oc') || st.proceso[st.proceso.length - 1];
        const sel = accion === 'dest' ? `[data-a="dest:${mejor.id}"]` : `[data-a="vis:${mejor.id}"]`;
        if (!h.el.panel.querySelector(sel)) h.panel('proceso', true);
        return this._hacer(h.el.panel.querySelector(sel));
      }
    }

    // 6b · proyecto del grupo
    const pv = h.proyOir(d, dir);
    if (pv) return pv;

    // 7 · pedidos con nombre de persona
    const per = personaEn(d);
    if (per && /\b(ayuda|ayudame|pedi|pedile|pedir|pedirle|pregunta|preguntale|preguntarle|necesito)\b/.test(d)) return () => h.pedirAyuda(per);
    if (per && /\b(saluda|saludar|saludalo|saludala|hola a)\b/.test(d)) return () => h._accion(`saludo:${per}`);

    // 8 · compartir algo (qué + a quién)
    if (/\b(manda|mandar|mandale|mandarle|envia|enviar|enviale|comparti|compartir|compartile|mostra|mostrar|mostrale|pasale|pasa|pone en|subi|proyecta)\b/.test(d)) {
      const item = /\b(grafico|stock|barras)\b/.test(d) ? 'graf' : /\b(luz|oculo|sol|lo que aprendi|lo que descubri|lo que guarde)\b/.test(d) ? 'oc' : /\bperchero\b/.test(d) ? 'e1' : /\b(foto|captura)\b/.test(d) ? ((st.proceso.filter((e) => e.tag === 'Captura').pop() || {}).id || null) : null;
      const dest = /\bpizarr/.test(d) ? 'pizarron' : /\bpiso\b/.test(d) ? 'piso' : /\bsanti/.test(d) ? 'santi' : /\btomi/.test(d) ? 'tomi' : (/\b(clase|todos|grupo)\b/.test(d) && st.minuto >= 615 ? 'pizarron' : null);
      if (item && dest) return () => { h.comp = { item, destino: dest }; h.enviar(); };
      if (item || dest || /\b(comparti|compartir)\b/.test(d)) return () => { h.comp = { item: item || null, destino: dest || null }; h.panel('compartir', true); };
    }

    // 9 · ir a un lugar (las gafas guían y el participante camina)
    const lugar = lugarEn(d);
    if (lugar && /\b(llevame|lleva|llevar|guiame|guia|como llego|como voy|quiero ir|necesito ir|tengo que ir|vamos|ir|anda|andar|camina|caminar|ve|voy|donde queda|donde esta)\b/.test(d)) {
      return () => {
        if (nav.current === lugar && !nav.walk) return h.proponer(`Ya estás en ${{ entrada: 'la entrada', hall: 'el hall', taller: 'el aula-taller', proyeccion: 'la zona de proyección', rincon: 'el rincón tranquilo', nodo: 'la sala del nodo' }[lugar]}.`);
        h.guiar(lugar);
        setTimeout(() => nav.goTo(lugar), 1300);
      };
    }
    if (/^(camina|caminar|avanza|avanzar|segui|seguir|segui la linea|vamos|anda|anda nomas|move|moverme|dale camina)\b/.test(d) && (dir || d.split(' ').length <= 3)) {
      return () => {
        if (st.guia && st.guia !== nav.current) nav.goTo(st.guia);
        else h.decir('¿A dónde querés ir?', [['Al aula-taller', () => { h.cerrarTutor(); h.guiar('taller'); nav.goTo('taller'); }], ['A la zona de proyección', () => { h.cerrarTutor(); h.guiar('proyeccion'); nav.goTo('proyeccion'); }], ['Al rincón tranquilo', () => { h.cerrarTutor(); h.guiar('rincon'); nav.goTo('rincon'); }]]);
      };
    }

    // 10 · mirar
    if (/\b(mira|mirar|mirá|gira|girar|giro|doblá|dobla|date vuelta|da vuelta|voltea|ver)\b/.test(d)) {
      const dir = /\bderecha\b/.test(d) ? [-1, 0] : /\bizquierda\b/.test(d) ? [1, 0] : /\b(arriba|techo)\b/.test(d) && !/oculo/.test(d) ? [0, 1] : /\b(abajo|piso|suelo)\b/.test(d) ? [0, -1] : /\b(atras|vuelta)\b/.test(d) ? [3, 0] : null;
      const quien = per ? h.anclas.find((a) => a.tipo === 'persona' && a.tit === per) : null;
      const cosa = !quien ? (COSAS.find(([, r]) => r.test(d)) || [])[0] : null;
      const ancla = quien || (cosa && h.anclas.find((a) => a.id === cosa));
      if (ancla) return () => this.mirarA(ancla);
      if (cosa === 'holo' || cosa === 'pizarron') return () => this.mirarPunto(new THREE.Vector3(0, 2.2, -16.5));
      if (dir) return () => this.girar(dir);
    }

    // 11 · ¿qué es eso? / guardalo
    if (/\b(que es (eso|esto)|que es|que hay|explora|explorar|modo explorar|que cosas hay)\b/.test(d)) {
      return () => {
        if (!st.explorar) h.setExplorar(true);
        setTimeout(() => { const a = h.mirada; if (a && a.det) { a.fija = 6; this.decir(`${a.tit}. ${a.det()}`); } }, 400);
      };
    }
    if (/^(guarda|guardalo|guardala|guardar|guardame|guardalo en mi proceso|guardar eso)\b/.test(d)) {
      return () => {
        const a = h.mirada && h.mirada.tipo === 'curiosidad' ? h.mirada : h.anclas.find((x) => x.tipo === 'curiosidad' && x.abierta);
        if (a) h._guardarCuriosidad(a);
        else h.proponer('Mirá algo marcado con + y decime «guardalo».');
      };
    }

    // 12 · funciones de las gafas. Cada una tiene una forma clara (vale siempre)
    //      y una palabra suelta (vale solo si le hablaron al TUTOR).
    const F = [
      [/\b(abri|abrir|mostrame|mostra|ver)\b.*\b(menu|funciones)\b|\bque (podes|sabes) hacer\b/, /\b(menu|funciones|opciones|aplicaciones)\b/, () => h.abrirLanzador()],
      [/\b(que me toca|que tengo que hacer|que hago ahora|a donde tengo que ir|que sigue|que tengo ahora)\b/, /\b(mi dia|agenda|horario)\b/, () => h._queSigue()],
      [/\b(abri|abrir|mostrame|ver)\b.*\bmapa\b|\bdonde estoy\b/, /\bmapa\b/, () => h.panel('mapa', true)],
      [/\b(saca|sacar|saco|sacame|sacale|toma|tomar|tomame|hace|hacer)\b.*\b(foto|captura)\b|\bcapturar?\b/, /\bfoto\b/, () => h.capturar()],
      [/\b(salir del foco|sali del foco|sacar el foco|saca el foco|desactiva el foco|apaga el foco|terminar el foco)\b/, null, () => h.setFoco(false)],
      [/\b(activa|activar|pone|poner|quiero|modo)\b.*\bfoco\b|\b(quiero concentrarme|no molestar)\b/, /\b(foco|concentrar|concentrarme)\b/, () => h.setFoco(true)],
      [/\b(que ve (mi|el|la) (docente|profe|profesora)|que ve sosa|como me ve|vista del docente|ve mi docente)\b/, /\bseguimiento\b/, () => h.panel(st.foco ? 'seguimiento' : 'docente', true)],
      [/\b(abri|abrir|mostrame|ver|mira)\b.*\bproceso\b|\bmi proceso\b/, /\b(proceso|evidencias|lo que guarde|lo que aprendi)\b/, () => h.panel('proceso', true)],
      [/\b(mi grupo|quien esta disponible|quien me puede ayudar)\b/, /\b(grupo|companeros|equipo)\b/, () => h.panel('grupo', true)],
      [/\b(activa|activar|pone|poner|saca|apaga|desactiva|quiero)\b.*\bsubtitul/, /\bsubtitul|\bno escucho\b|\bque dice\b/, () => h.setAjuste('subtitulos', !/\b(saca|apaga|desactiva|sin)\b/.test(d))],
      [/\b(letra mas grande|texto mas grande|agranda)\b/, null, () => h.setAjuste('escala', Math.min(1.3, (h.aj.escala || 1) + 0.15))],
      [/\b(letra mas chica|texto mas chico|achica)\b/, null, () => h.setAjuste('escala', Math.max(1, (h.aj.escala || 1) - 0.15))],
      [/\b(abri|abrir|ir a)\b.*\b(ajustes|configuracion)\b/, /\b(ajustes|configuracion|configurar|privacidad)\b/, () => h.panel('ajustes', true)],
      [/\b(que quedo esperando|como esta la conexion|hay internet|que quedo en cola|se corto internet)\b/, /\b(conexion|internet|wifi|en cola)\b/, () => h.panel('conexion', true)],
      [null, /\b(hoy|el dia)\b/, () => h.panel('hoy', true)],
      [/\b(luz del oculo|la mancha de luz|donde va a caer la luz)\b/, /\b(la luz|la mancha|oculo|el sol)\b/, () => h.oculo.empezar()],
      [null, /\b(compartir|comparti)\b/, () => h.panel('compartir', true)],
      [/\b(ayudame|tengo una duda|necesito ayuda)\b/, /\b(ayuda|no entiendo|una pregunta)\b/, () => h.abrirTutor()],
      [null, /\btutor\b/, () => h.abrirTutor()],
    ];
    for (const [fuerte, suelta, fn] of F) if ((fuerte && fuerte.test(d)) || (dir && suelta && suelta.test(d))) return fn;

    // 13 · algo parecido a una opción visible (solo si le hablaron al TUTOR)
    if (!dir) return null;
    if (ops.length) {
      let mejor = null, pm = 0;
      for (const b of ops) { const p = puntaje(d, b.textContent); if (p > pm) { pm = p; mejor = b; } }
      if (pm >= 0.45) return this._hacer(mejor);
    }
    if (!h.el.lanzador.hidden) {
      let mejor = null, pm = 0;
      for (const b of h.el.lanzador.querySelectorAll('.fn')) { const p = puntaje(d, b.querySelector('b').textContent); if (p > pm) { pm = p; mejor = b; } }
      if (pm >= 0.5) return this._hacer(mejor);
    }
    return null;
  }

  _noEntendi(d) {
    const h = this.hud;
    if (!h.puestas) return;
    if (h.noEntendiExtra && h.noEntendiExtra(d)) return;
    const ops = this._opciones().map((b) => `«${b.textContent}»`);
    const pista = ops.length ? `Podés contestarme ${ops.slice(0, 3).join(', ')}.` : 'Probá con «¿qué me toca ahora?», «llevame al taller» o «sacá una foto».';
    h.proponer(`No te entendí. ${pista}`);
  }

  // ── girar la cabeza ──────────────────────────────────────
  girar([gx, gy]) {
    const nav = this.nav;
    nav.vy = nav.vp = 0;
    if (gx === 3) nav.settle = { yaw: nav.yaw + Math.PI, pitch: 0, t: 0 };
    else nav.settle = { yaw: nav.yaw + gx * 1.05, pitch: Math.max(-1, Math.min(1, nav.pitch + gy * 0.4)), t: 0 };
    nav.settle.t = -0.4; // un poco más largo que el asentado normal
  }

  mirarPunto(p) {
    const nav = this.nav, c = this.hud.camera.position;
    const dx = p.x - c.x, dz = p.z - c.z;
    nav.vy = nav.vp = 0;
    nav.settle = { yaw: Math.atan2(-dx, -dz), pitch: Math.atan2(p.y - c.y, Math.hypot(dx, dz)), t: -0.4 };
  }

  mirarA(a) {
    const v = new THREE.Vector3();
    if (a.persona) a.persona.cabeza.getWorldPosition(v);
    else v.set(a.pos[0], a.pos[1], a.pos[2]);
    this.mirarPunto(v);
    a.fija = 6;
  }
}
