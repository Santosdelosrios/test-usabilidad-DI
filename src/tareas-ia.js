// Test de tareas · IA que explica: seis tareas guiadas para evaluar al tutor que explica y ayuda a aprender.
// El participante está sentado en su mesa del aula-taller con las gafas puestas. El tutor no usa la IA real:
// sus respuestas están escritas de antemano (corazon.js y ejercicio.js), así todos ven lo mismo.
// Todo se maneja con la voz; el moderador tiene teclas de respaldo (Shift + tecla) y un panel (⇧M)
// que marca cada tarea, toma tiempos, cuenta pistas y frases, y descarga los resultados.
import { Corazon, PASO_VENTRICULO, NOMBRE_PREGUNTA } from './corazon.js';
import { Ejercicio } from './ejercicio.js';

export const TAREAS_IA = [
  {
    n: 1, tit: 'Pedir una explicación',
    esc: 'En Biología están viendo el sistema circulatorio y no terminás de entender cómo funciona el corazón.',
    txt: 'Usá las gafas para entender cómo funciona el corazón.',
    exito: 'Abre la explicación del corazón.',
    observar: 'Si le habla al tutor sin dudar o busca un menú. Qué palabras usa. Cuánto tarda en pedirlo.',
  },
  {
    n: 2, tit: 'Moverse dentro de la explicación',
    esc: 'La animación va rápido y no llegaste a ver por dónde entra la sangre.',
    txt: 'Averiguá por dónde entra la sangre al corazón y a dónde va después.',
    exito: 'Usa pausar, repetir, girar, acercar o «más despacio», o dice la respuesta («entra por las venas cavas a la aurícula derecha»).',
    observar: 'Qué control busca primero (voz, botones, mirada). Si nota los botones del costado. Si llega a la respuesta.',
  },
  {
    n: 3, tit: 'Repreguntar',
    esc: 'El tutor dijo «ventrículo» y no sabés qué es.',
    txt: 'Averiguá qué es sin perder la explicación que estabas viendo.',
    exito: 'Pregunta por el ventrículo (o por otra parte) y la explicación sigue o vuelve a donde estaba.',
    observar: 'Si pregunta sin miedo a perder el hilo. Si nota que la explicación retoma sola. Si la respuesta le alcanza.',
  },
  {
    n: 4, tit: 'Trabarse en un ejercicio',
    esc: 'Estás resolviendo una ecuación para matemática y te trabaste en un paso.',
    txt: 'Seguí con el ejercicio. Podés usar las gafas si te sirven.',
    exito: 'Pide ayuda y llega al resultado después de las pistas.',
    observar: 'Cuánto tarda en pedir ayuda. Si pide la respuesta directa y cómo reacciona a que no se la den. Cuántas pistas usa.',
  },
  {
    n: 5, tit: 'Una sugerencia que no pidió',
    esc: '',
    txt: 'Seguí trabajando con el ejercicio.',
    exito: 'Ve la sugerencia del tutor y la acepta o la descarta.',
    observar: 'Si nota la sugerencia, si la lee, si la acepta o la descarta y por qué. Si la siente ayuda o interrupción.',
  },
  {
    n: 6, tit: 'Que el tutor no interrumpa',
    esc: 'Querés pensar el ejercicio solo, sin que el tutor te diga nada.',
    txt: 'Hacé que las gafas no te interrumpan por un rato.',
    exito: 'Activa el modo foco o el silencio del tutor.',
    observar: 'Cómo intenta callar al tutor (voz, menú, foco). Si entiende que está en foco. Si sabe cómo volver.',
  },
];

// dónde se sienta el participante y dónde flota el corazón (sobre su mesa del aula-taller)
const SENTADO = { p: [-12.0, 1.2, 2.45], yaw: 180, pitch: -9 };
const SOBRE_MESA = [-12.0, 1.4, 3.5];
const D = Math.PI / 180;
const CONTROLES_T2 = ['pausa', 'seguir', 'repetir', 'repetir-todo', 'despacio', 'normal', 'girar', 'acercar', 'alejar'];

// frases que pueden cortar al tutor mientras habla (sin tener que decir «Tutor» primero)
const CORTE = /^(?:(?:tutor|tutora|che|eh|ey|bueno) )?(?:para|pare|pausa|pausalo|frena|frenalo|espera|esperate|esperame|stop|momento|un momento|un segundo|alto|repeti|repetilo|repetime|de nuevo|otra vez|mas despacio|despacio|mas lento|que es|que son|que significa|que quiere decir|por donde|a donde|adonde|y despues|gira|giralo|rota|da vuelta|acerca|acercalo|agranda|aleja|cerra|cerralo|basta|no entiendo|no entendi|silencio|callate|shh|no me interrumpas|dejame pensar|dejame|ya entendi)\b/;
// silenciar al tutor (tarea 6) y volver a escucharlo
const FOCO_SI = /\b(no me interrumpas|no interrumpas|no me interrumpa|sin interrupciones|dejame pensar|deja que piense|quiero pensar solo|quiero pensar sola|dejame solo|dejame sola|dejame tranquilo|dejame tranquila|silencio|silencia|silenciate|callate|calla|shh+|no me hables|no hables|no me digas nada|no digas nada|necesito concentrarme|quiero concentrarme|modo foco|activa el foco|activar el foco|activa foco|pone el foco|no molestar|no me molestes|un rato solo|un rato sola|mute|mutea)\b/;
const FOCO_NO = /\b(ya podes hablar|podes hablar|podes volver|volve a hablar|volve a ayudarme|ya termine de pensar|ya pense|sali del foco|salir del foco|saca el foco|sacar el foco|desactiva el foco|apaga el foco|termina el foco|terminar el foco|fin del foco|ya podes ayudarme|ya podes volver)\b/;

const mmss = (ms) => { const s = Math.max(0, Math.round(ms / 1000)); return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`; };
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const MARCAS = [['sola', 'Sola'], ['empujon', 'Con empujón'], ['no', 'No']];

// Teclas del moderador: siempre con Shift. [código, tecla, qué hace, grupo, acción]
const TECLAS = [
  ['KeyM', '⇧M', 'Abrir o cerrar este panel', 'General', (m) => m.panel()],
  ['KeyN', '⇧N', 'Siguiente tarea', 'General', (m) => m.siguiente()],
  ['KeyB', '⇧B', 'Tarea anterior', 'General', (m) => m.anterior()],
  ['KeyC', '⇧C', '«Explicame cómo funciona el corazón» (abre o cierra)', 'Corazón', (m) => (m.corazon.abierto ? m.corazon.cerrar('tecla') : m.corazon.abrir('tecla'))],
  ['KeyP', '⇧P', 'Pausar o seguir', 'Corazón', (m) => m.corazon.accion('pausa', 'tecla')],
  ['KeyR', '⇧R', 'Repetir el paso', 'Corazón', (m) => m.corazon.repetir(false, 'tecla')],
  ['KeyD', '⇧D', 'Más despacio o velocidad normal', 'Corazón', (m) => m.corazon.accion('despacio', 'tecla')],
  ['KeyG', '⇧G', 'Girar', 'Corazón', (m) => m.corazon.girar('tecla')],
  ['KeyZ', '⇧Z', 'Acercar o alejar', 'Corazón', (m) => m.corazon.accion('acercar', 'tecla')],
  ['KeyE', '⇧E', '«¿Por dónde entra la sangre?»', 'Corazón', (m) => m.corazon.preguntar('entra', 'tecla')],
  ['KeyA', '⇧A', '«¿Y a dónde va después?»', 'Corazón', (m) => m.corazon.preguntar('despues', 'tecla')],
  ['KeyX', '⇧X', 'Dijo la respuesta: «entra por las venas cavas»', 'Corazón', (m) => m.corazon.responder('entra', 'tecla')],
  ['KeyV', '⇧V', '«¿Qué es el ventrículo?»', 'Corazón', (m) => m.corazon.preguntar('ventriculo', 'tecla')],
  ['KeyU', '⇧U', '«¿Qué es la aurícula?»', 'Corazón', (m) => m.corazon.preguntar('auricula', 'tecla')],
  ['KeyO', '⇧O', '«¿Qué es la aorta?»', 'Corazón', (m) => m.corazon.preguntar('aorta', 'tecla')],
  ['KeyL', '⇧L', '«¿Qué es una válvula?»', 'Corazón', (m) => m.corazon.preguntar('valvulas', 'tecla')],
  ['KeyK', '⇧K', '«¿Qué son las venas cavas?»', 'Corazón', (m) => m.corazon.preguntar('cavas', 'tecla')],
  ['KeyY', '⇧Y', '«¿Qué es la arteria pulmonar?»', 'Corazón', (m) => m.corazon.preguntar('pulmonar', 'tecla')],
  ['KeyH', '⇧H', 'Pide ayuda (siguiente pista)', 'Ejercicio', (m) => m.ej.pista('tecla')],
  ['Digit1', '⇧1', 'Dijo el primer paso («resto 5 en los dos lados»)', 'Ejercicio', (m) => m.ej.activo && !m.ej.e.resuelto && m.ej._op1('tecla')],
  ['Digit2', '⇧2', 'Dijo el resultado del primer paso («3x = 15»)', 'Ejercicio', (m) => m.ej.activo && !m.ej.e.resuelto && m.ej._paso1('tecla')],
  ['Digit3', '⇧3', 'Dijo el segundo paso («divido por 3»)', 'Ejercicio', (m) => m.ej.activo && !m.ej.e.resuelto && m.ej._op2('tecla')],
  ['Digit4', '⇧4', 'Dijo el resultado («x = 5»)', 'Ejercicio', (m) => m.ej.activo && m.ej._resolver('tecla')],
  ['Digit5', '⇧5', 'Dijo que lo comprobó («sí, da 20»)', 'Ejercicio', (m) => m.ej.activo && m.ej.comprobar('tecla')],
  ['Digit0', '⇧0', 'Dijo un paso equivocado', 'Ejercicio', (m) => m.ej.activo && !m.ej.e.resuelto && m.ej._error('paso equivocado', 'tecla', true)],
  ['KeyS', '⇧S', 'El tutor sugiere algo por su cuenta, ahora', 'Ejercicio', (m) => m.ej.activo && m.ej.sugerir('tecla')],
  ['Digit7', '⇧7', 'Responde «Dale» (primera opción del tutor)', 'Ejercicio', (m) => m.ej.responderSugerencia(true)],
  ['Digit8', '⇧8', 'Responde «Ahora no» (última opción del tutor)', 'Ejercicio', (m) => m.ej.responderSugerencia(false)],
  ['KeyF', '⇧F', '«No me interrumpas»: activa o saca el foco', 'Foco', (m) => m.foco(!m.hud.st.foco, 'tecla')],
];

export class TareasIA {
  constructor({ hud, nav, scene, camera }) {
    this.hud = hud; this.nav = nav; this.camera = camera;
    this.corazon = new Corazon({ hud, scene, camera, pos: SOBRE_MESA });
    this.ej = new Ejercicio({ hud });
    this.activa = false;
    this.i = 0;
    this.eventos = [];
    this.abiertas = new Set();
    this.res = TAREAS_IA.map((T) => ({ n: T.n, auto: null, detalle: '', marca: null, intentos: 0, tAcum: 0, tDesde: null, tLogro: null }));
    const $ = (id) => document.getElementById(id);
    this.el = { card: $('consigna'), num: $('c-num'), esc: $('c-esc'), txt: $('c-txt'), panel: $('moderador'), btn: $('mod-btn') };
    this.el.btn.addEventListener('click', () => this.panel());
    this.el.panel.addEventListener('click', (e) => { const b = e.target.closest('[data-m]'); if (b) this._accion(b.dataset.m); });
    hud.on('registro', (r) => this._registro(r));
    hud.on('cambio', () => this.check());
    // las teclas del moderador van antes que las de las gafas y la caminata (fase de captura)
    window.addEventListener('keydown', (e) => this._tecla(e), true);
  }

  // ── arranque: sentado en la mesa, con las gafas puestas ──
  empezarSesion() {
    const h = this.hud, nav = this.nav;
    this.activa = true;
    this.t0 = performance.now();
    this.fecha = new Date();
    document.body.classList.add('tareas-ia');
    // el tutor de este modo es guionado: no se usa la IA real aunque haya clave
    h.guionado = true;
    h.oirExtra = (d, dir) => this.oir(d, dir);
    h.interrumpe = (d) => this.interrumpe(d);
    h.noEntendiExtra = () => this.corazon.abierto && this.corazon.noEntendi();
    // mirar o llamar al tutor abre la escucha (como el tutor con IA), sin el menú del mundo libre
    h.alAbrirTutor = () => { if (h.voz) h.voz.abrirVentana(10); h.proponer(`Te escucho${h._coma()}. Pedime lo que necesites.`); };
    h.aj.sugerencias = true;  // la tarea 5 necesita que el tutor pueda sugerir
    h.aj.pausas = false;      // sin recordatorios de pausa visual que se mezclen con las tareas
    // la pista de voz del tutor en reposo no habla de caminar: acá está sentado
    if (h.voz && h.voz.modo) h.pistaVoz = h.voz.modo === 'claude' ? 'Mantené la barra espaciadora y hablame.' : 'Hablame cuando quieras: empezá con «Tutor…».';
    const mesa = h.anclas.find((a) => a.id === 'mesa');
    if (mesa) mesa.max = 0;   // la etiqueta del proyecto de la mesa no aplica en este modo
    // sentado en su banqueta: puede mirar alrededor, no caminar
    nav.fijo = true;
    nav.walk = null;
    nav.current = null;
    nav.goTo('taller', { instant: true });
    this.camera.position.set(...SENTADO.p);
    nav.yaw = SENTADO.yaw * D; nav.pitch = SENTADO.pitch * D;
    nav.vy = nav.vp = 0; nav.settle = null;
    this.el.btn.hidden = false;
    this.empezar(1);
  }

  // ── tareas ──
  empezar(n) {
    if (n < 1 || n > TAREAS_IA.length) return;
    const ahora = performance.now();
    this._cortarTiempo(ahora);
    this.i = n;
    this.fin = false;
    const r = this.res[n - 1];
    r.intentos++;
    r.tDesde = ahora;
    this._preparar(n);
    this.corazon.marcarInicio();
    this.focoOrigen = null;
    this.practicaOfrecida = false;
    const T = TAREAS_IA[n - 1];
    const c = this.el;
    c.card.hidden = !this.hud.visible;
    c.num.textContent = `Tarea ${n} de ${TAREAS_IA.length}`;
    c.esc.textContent = T.esc;
    c.txt.textContent = T.txt;
    c.card.classList.remove('fin');
    this.hud.registrar('tarea', `inicio:${n}`);
    this._pintar();
  }

  _preparar(n) {
    const h = this.hud, cor = this.corazon, ej = this.ej;
    if (h.st.foco) h.setFoco(false);
    h.cerrarPanel(); h.cerrarLanzador();
    if (n <= 3) ej.ocultar();
    if (n === 1) { if (cor.abierto) cor.cerrar('tarea', true); h.cerrarTutor(true); }
    // la explicación tiene que estar en marcha
    if (n === 2) { if (!cor.abierto) cor.abrir('tarea'); else if (cor.estado !== 'explicando') cor.irAPaso(0, 'tarea'); else cor.mirarlo(); }
    // el tutor acaba de decir «ventrículo»
    if (n === 3) { cor.irAPaso(PASO_VENTRICULO, 'tarea'); cor.mirarlo(); }
    if (n >= 4) {
      if (cor.abierto) cor.cerrar('tarea', true);
      h.cerrarTutor(true);
      this._mirarCuaderno();
    }
    // en la tarea 4 el tutor espera a que le pidan ayuda; desde la 5 puede sugerir por su cuenta
    if (n === 4) { ej.espontaneas = false; ej.cargar(0); }
    if (n === 5) { ej.espontaneas = true; ej.demora = 20; ej.cargar(1); }
    if (n === 6) { ej.espontaneas = true; ej.demora = 15; if (!(ej.e && ej.e.n === 3 && !ej.e.resuelto)) ej.cargar(2); }
  }

  _mirarCuaderno() {
    const nav = this.nav;
    nav.vy = nav.vp = 0;
    nav.settle = { yaw: SENTADO.yaw * D, pitch: SENTADO.pitch * D, t: -0.4 };
  }

  siguiente() {
    if (!this.activa) return;
    if (this.i < TAREAS_IA.length) this.empezar(this.i + 1);
    else this.terminar();
  }

  anterior() { if (this.activa && this.i > 1) this.empezar(this.i - 1); }

  terminar() {
    this._cortarTiempo(performance.now());
    this.fin = true;
    this.ej.espontaneas = false;
    const c = this.el;
    c.num.textContent = 'Fin';
    c.esc.textContent = '';
    c.txt.textContent = '¡Gracias! Ahora vienen unas preguntas cortas sobre cómo te fue.';
    c.card.classList.add('fin');
    this.hud.registrar('tarea', 'fin');
    this._pintar();
  }

  _cortarTiempo(ahora) {
    const r = this.i && this.res[this.i - 1];
    if (r && r.tDesde != null && !this.fin) { r.tAcum += ahora - r.tDesde; r.tDesde = null; }
  }

  _tiempo(r) { return r.tAcum + (r.tDesde != null && !this.fin ? performance.now() - r.tDesde : 0); }

  // ── ¿se cumplió? ──
  check() {
    if (!this.activa || !this.i || this.fin) return;
    const r = this.res[this.i - 1];
    if (r.auto === 'ok') return;
    const v = this._evaluar(this.i);
    if (!v || (v.estado === r.auto && v.detalle === r.detalle)) return;
    r.auto = v.estado;
    r.detalle = v.detalle;
    if (v.estado === 'ok') r.tLogro = r.tAcum + (performance.now() - r.tDesde);
    this.hud.registrar('tarea', `${this.i}:${v.estado}:${v.detalle}`);
    this._pintar();
  }

  _evaluar(n) {
    const cor = this.corazon, ej = this.ej, h = this.hud, ev = this._resumen(n);
    if (n === 1 && cor.abrio) return { estado: 'ok', detalle: { voz: 'Lo pidió por voz', tecla: 'Con la tecla del moderador', boton: 'Con un botón' }[cor.abrio] || cor.abrio };
    if (n === 2) {
      // controles y preguntas de esta tarea, con cómo se hicieron (voz, botón, tecla)
      const como = [...new Set([...ev.controles.filter((c) => CONTROLES_T2.includes(c.split(' ')[0]) || c.startsWith('dijo la respuesta')), ...ev.preguntas.filter((q) => /^(entra|despues) /.test(q)).map((q) => `preguntó ${NOMBRE_PREGUNTA[q.split(' ')[0]]} ${q.slice(q.indexOf('('))}`)])];
      if (como.length) return { estado: 'ok', detalle: como.join(', ') };
    }
    if (n === 3 && cor.preguntasParte > 0) {
      const qs = [...new Set(cor.preguntas.filter((q) => q !== 'entra' && q !== 'despues'))].map((q) => NOMBRE_PREGUNTA[q] || q).join(', ');
      return cor.volvio ? { estado: 'ok', detalle: `Preguntó por: ${qs}. La explicación retomó.` } : { estado: 'parcial', detalle: `Preguntó por: ${qs}. Falta que retome.` };
    }
    if (n === 4 && ej.e && ej.e.n === 1 && ej.e.resuelto) {
      const p = ej.e.pistas + ej.e.pistasSug;
      return p ? { estado: 'ok', detalle: `Resolvió con ${p} pista${p > 1 ? 's' : ''}` } : { estado: 'parcial', detalle: 'Resolvió sin pedir ayuda' };
    }
    if (n === 5) {
      if (ev.aceptadas || ev.descartadas) return { estado: 'ok', detalle: ev.aceptadas ? 'Aceptó la sugerencia' : 'Descartó la sugerencia' };
      if (ev.mostradas) return { estado: 'parcial', detalle: 'Vio la sugerencia, sin responder' };
    }
    if (n === 6 && (h.st.foco || !h.aj.sugerencias)) return { estado: 'ok', detalle: h.st.foco ? `Activó el foco (${this.focoOrigen || 'menú o tecla F'})` : 'Apagó la iniciativa del tutor' };
    return null;
  }

  // ── voz ──
  // el texto llega normalizado: minúsculas, sin tildes ni signos
  oir(d, dir) {
    const h = this.hud;
    if (FOCO_NO.test(d) && h.st.foco) return () => this.foco(false, 'voz');
    if (FOCO_SI.test(d) && !FOCO_NO.test(d)) return () => this.foco(true, 'voz');
    const c = this.corazon.oir(d, dir);
    if (c) return c;
    if (this.ej.activo) { const e = this.ej.oir(d, dir); if (e) return e; }
    // en este modo no se camina: está en su mesa, en clase
    if (/\b(llevame|lleva|guiame|quiero ir|vamos al|vamos a la|como llego|como voy)\b/.test(d)) return () => h.proponer('Ahora estás en clase, en tu mesa. Seguimos acá.');
    return null;
  }

  // ¿esta frase corta al tutor aunque no empiece con «Tutor»?
  interrumpe(d) {
    if (!this.activa || !d || d.split(' ').length > 9 || !CORTE.test(d)) return false;
    this.corazon.retener();
    return true;
  }

  foco(on, origen = 'voz') {
    const h = this.hud;
    if (on && !h.st.foco) {
      this.focoOrigen = origen === 'voz' ? 'por voz' : origen === 'tecla' ? 'con la tecla del moderador' : origen;
      if (this.corazon.abierto) this.corazon.pausar('foco', true);
      h.setFoco(true);
    } else if (!on && h.st.foco) h.setFoco(false);
    h.registrar('foco', `${on ? 'on' : 'off'}:${origen}`);
  }

  // ── cuadro a cuadro ──
  update(dt, t) {
    if (!this.activa) return;
    const h = this.hud;
    this.corazon.update(dt, t);
    this.ej.update();
    this.el.card.hidden = !h.visible;
    // tarea 5: si resolvió antes de ver una sugerencia, el tutor le ofrece practicar más
    if (this.i === 5 && !this.fin && !this.practicaOfrecida && this.ej.e && this.ej.e.resuelto && !this._resumen(5).mostradas
      && performance.now() - this.ej.e.tResuelto > 6000 && !h.tutorAbierto && !h.propuesta) {
      this.practicaOfrecida = true;
      this.ej.sugerirPractica('practica');
    }
    if ((this._tPanel = (this._tPanel || 0) + dt) > 0.5) {
      this._tPanel = 0;
      this.check();
      this._indicador();
      // el cuaderno se acomoda debajo de la tarjeta de la consigna
      const card = this.el.card;
      if (!card.hidden) { const b = `${Math.round(card.offsetTop + card.offsetHeight)}px`; if (b !== this._bajo) { this._bajo = b; document.documentElement.style.setProperty('--consigna-bajo', b); } }
      if (!this.el.panel.hidden) this.el.panel.querySelectorAll('[data-t]').forEach((s) => { s.textContent = mmss(this._tiempo(this.res[+s.dataset.t - 1])); });
      const ses = this.el.panel.querySelector('[data-ses]');
      if (ses) ses.textContent = mmss(performance.now() - this.t0);
    }
  }

  // ── registro de todo lo que pasa ──
  _registro(r) {
    if (!this.activa) return;
    this.eventos.push({ s: Math.round((r.t - this.t0) / 100) / 10, tarea: this.fin ? 'fin' : this.i, tipo: r.tipo, dato: String(r.dato) });
    if (['voz', 'sugerencia', 'ejercicio', 'corazon', 'tarea', 'foco'].includes(r.tipo) && !this.el.panel.hidden) {
      clearTimeout(this._tPint);
      this._tPint = setTimeout(() => this._pintar(), 120);
    }
  }

  // todo lo que pasó en una tarea, contado desde el registro
  _resumen(n) {
    const out = { pistas: 0, pistasSug: 0, mostradas: 0, aceptadas: 0, descartadas: 0, retenidas: 0, controles: [], preguntas: [], entendidas: [], sinAccion: [], pidioRespuesta: 0, errores: 0 };
    for (const e of this.eventos) {
      if (e.tarea !== n) continue;
      const [a, b] = e.dato.split(':');
      const origen = e.dato.split(':').pop();
      if (e.tipo === 'ejercicio') {
        if (a === 'pista') { if (origen === 'sugerencia') out.pistasSug++; else out.pistas++; }
        if (a === 'pidio-respuesta') out.pidioRespuesta++;
        if (a === 'error') out.errores++;
      }
      const sug = { mostrada: 'mostradas', aceptada: 'aceptadas', descartada: 'descartadas', retenida: 'retenidas' }[a];
      if (e.tipo === 'sugerencia' && sug) out[sug]++;
      if (e.tipo === 'corazon') {
        if (a === 'pregunta') out.preguntas.push(`${b} (${origen})`);
        else if (a === 'respuesta') out.controles.push(`dijo la respuesta (${origen})`);
        else if (['pausa', 'seguir', 'repetir', 'despacio', 'normal', 'girar', 'acercar', 'alejar', 'cerrar', 'abrir'].includes(a) && !['tarea', 'foco', 'gafas'].includes(origen)) out.controles.push(`${a} (${origen})`);
      }
      if (e.tipo === 'voz') {
        if (e.dato.endsWith(' (sin acción)')) out.sinAccion.push(e.dato.slice(0, -13));
        else out.entendidas.push(e.dato);
      }
    }
    return out;
  }

  _frases() { return this.eventos.filter((e) => e.tipo === 'voz').map((e) => ({ s: e.s, tarea: e.tarea, txt: e.dato.replace(/ \(sin acción\)$/, ''), ok: !e.dato.endsWith(' (sin acción)') })); }

  // ── teclas del moderador ──
  _tecla(e) {
    if (!this.activa || !e.shiftKey || e.ctrlKey || e.altKey || e.metaKey) return;
    if (e.target && /input|textarea|select/i.test(e.target.tagName)) return;
    const k = TECLAS.find((x) => x[0] === e.code);
    if (!k) return;
    e.preventDefault();
    e.stopPropagation();
    if (e.repeat) return;
    if (k[0] !== 'KeyM') this.hud.registrar('moderador', `${k[1]} ${k[2]}`);
    k[4](this);
  }

  // ── panel del moderador ──
  panel(on = this.el.panel.hidden) {
    this.el.panel.hidden = !on;
    if (on) this._pintar();
  }

  _indicador() {
    const r = this.i && this.res[this.i - 1];
    const marca = this.fin ? 'Fin' : r ? `T${this.i}${r.auto === 'ok' ? ' ✓' : r.auto === 'parcial' ? ' ~' : ''}` : '';
    const txt = `Moderador · ${marca} · ⇧M`;
    if (this.el.btn.textContent !== txt) this.el.btn.textContent = txt;
  }

  _accion(a) {
    const [k, v, w] = a.split(':');
    if (k === 'cerrar') return this.panel(false);
    if (k === 'sig') return this.siguiente();
    if (k === 'ant') return this.anterior();
    if (k === 'ir') return this.empezar(+v);
    if (k === 'ver') { if (this.abiertas.has(+v)) this.abiertas.delete(+v); else this.abiertas.add(+v); return this._pintar(); }
    if (k === 'marca') {
      const r = this.res[+v - 1];
      r.marca = r.marca === w ? null : w;
      this.hud.registrar('marca', `${v}:${r.marca || 'sin marca'}`);
      return this._pintar();
    }
    if (k === 'descargar') return this.descargar();
    if (k === 'json') return this.descargar(true);
  }

  _pintar() {
    const p = this.el.panel;
    this._indicador();
    if (p.hidden) return;
    const voz = this.hud.voz;
    const nombre = document.getElementById('prep-nombre').value.trim() || 'sin nombre';
    let h = `<div class="mod-cab"><div><b>Moderador</b><span>Tareas · IA que explica</span></div><button data-m="cerrar" title="Cerrar el panel">⇧M ×</button></div>`;
    h += `<div class="mod-meta"><span>${esc(nombre)} · sesión <b data-ses>${mmss(performance.now() - this.t0)}</b></span><span>${voz && voz.modo ? (voz.modo === 'web' ? 'Voz: manos libres' : 'Voz: barra espaciadora') : 'Sin voz: usar las teclas'}</span></div>`;
    h += `<div class="mod-acc"><button class="prim" data-m="descargar">Descargar resultados</button><button data-m="json">Solo JSON</button></div>`;
    h += `<div class="mod-nav"><button data-m="ant" ${this.i > 1 ? '' : 'disabled'}>← Anterior · ⇧B</button><span>${this.fin ? 'Terminó' : `Tarea ${this.i} de ${TAREAS_IA.length}`}</span><button data-m="sig">${this.i < TAREAS_IA.length || this.fin ? 'Siguiente · ⇧N →' : 'Terminar · ⇧N'}</button></div>`;
    h += '<ol class="mod-tareas">';
    for (const T of TAREAS_IA) {
      const r = this.res[T.n - 1], actual = T.n === this.i && !this.fin, ver = actual || this.abiertas.has(T.n);
      const est = r.auto === 'ok' ? '<span class="est ok">✓ Cumplida</span>' : r.auto === 'parcial' ? '<span class="est par">~ Parcial</span>' : actual ? '<span class="est cur">En curso</span>' : r.intentos ? '<span class="est no">Sin cumplir</span>' : '<span class="est">Pendiente</span>';
      const sum = this._resumen(T.n);
      h += `<li class="${actual ? 'actual' : ''} ${r.auto === 'ok' ? 'ok' : ''}">`;
      h += `<div class="fila"><button class="tit" data-m="ver:${T.n}"><i>${T.n}</i>${esc(T.tit)}</button>${est}<span class="tiempo" data-t="${T.n}">${mmss(this._tiempo(r))}</span></div>`;
      if (ver) {
        if (T.esc) h += `<p><small>Escenario</small>${esc(T.esc)}</p>`;
        h += `<p><small>Consigna</small>${esc(T.txt)}</p><p><small>Éxito</small>${esc(T.exito)}</p><p><small>Observar</small>${esc(T.observar)}</p>`;
      }
      if (r.detalle || r.tLogro != null) h += `<p class="det">${esc(r.detalle)}${r.tLogro != null ? ` · a los ${mmss(r.tLogro)}` : ''}</p>`;
      const datos = [];
      if (sum.pistas || sum.pistasSug) datos.push(`Pistas: ${sum.pistas} pedidas${sum.pistasSug ? `, ${sum.pistasSug} por sugerencia` : ''}`);
      if (sum.pidioRespuesta) datos.push(`Pidió la respuesta ${sum.pidioRespuesta} ${sum.pidioRespuesta > 1 ? 'veces' : 'vez'}`);
      if (sum.mostradas || sum.retenidas) datos.push(`Sugerencias: ${sum.mostradas} mostradas, ${sum.aceptadas} aceptadas, ${sum.descartadas} descartadas${sum.retenidas ? `, ${sum.retenidas} retenidas por el foco` : ''}`);
      if (sum.controles.length) datos.push(`Corazón: ${sum.controles.join(', ')}`);
      if (sum.preguntas.length) datos.push(`Preguntas: ${sum.preguntas.join(', ')}`);
      if (sum.entendidas.length || sum.sinAccion.length) datos.push(`Voz: ${sum.entendidas.length} entendidas, ${sum.sinAccion.length} sin acción`);
      if (datos.length && (ver || r.intentos)) h += `<ul class="datos">${datos.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>`;
      h += `<div class="marca"><span>Marca</span>${MARCAS.map(([k, t]) => `<button class="${r.marca === k ? 'on' : ''}" data-m="marca:${T.n}:${k}">${t}</button>`).join('')}${actual ? '' : `<button class="ir" data-m="ir:${T.n}">Ir a esta tarea</button>`}</div>`;
      h += '</li>';
    }
    h += '</ol>';
    const fr = this._frases();
    h += `<section><h4>Frases de voz <small>${fr.filter((f) => f.ok).length} entendidas · ${fr.filter((f) => !f.ok).length} sin acción</small></h4>`;
    h += fr.length ? `<ul class="frases">${fr.slice(-14).reverse().map((f) => `<li class="${f.ok ? 'ok' : 'no'}"><span>${mmss(f.s * 1000)} · T${f.tarea}</span>${esc(f.txt)}</li>`).join('')}</ul>` : '<p class="vacio">Todavía nada. Si el micrófono no anda, usá las teclas.</p>';
    h += '</section>';
    h += '<section><h4>Teclas del moderador <small>siempre con Shift</small></h4>';
    let grupo = '';
    h += '<dl class="teclas">';
    for (const [, k, txt, g] of TECLAS) {
      if (g !== grupo) { grupo = g; h += `<dt class="g">${g}</dt>`; }
      h += `<dt>${k}</dt><dd>${esc(txt)}</dd>`;
    }
    h += '</dl><p class="vacio">Las teclas de siempre siguen igual: G gafas, H revisión, F foco, Espacio para hablar (en claude.ai).</p></section>';
    p.innerHTML = h;
  }

  // ── resultados ──
  _datos() {
    const nombre = document.getElementById('prep-nombre').value.trim();
    const f = this.fecha || new Date();
    const voz = this.hud.voz;
    return {
      participante: nombre,
      fecha: `${f.getFullYear()}-${String(f.getMonth() + 1).padStart(2, '0')}-${String(f.getDate()).padStart(2, '0')} ${String(f.getHours()).padStart(2, '0')}:${String(f.getMinutes()).padStart(2, '0')}`,
      modo: 'Tareas · IA que explica',
      duracion_s: Math.round((performance.now() - this.t0) / 1000),
      ajustes: { voz: voz ? voz.modo : null, voz_del_tutor: voz ? voz.hablaTutor : null, mirada: this.hud.ojos.habilitada, camara: !!this.hud.camaraActiva },
      tareas: TAREAS_IA.map((T) => {
        const r = this.res[T.n - 1], s = this._resumen(T.n);
        return {
          n: T.n, titulo: T.tit, estado_auto: r.auto || (r.intentos ? 'no' : 'sin hacer'), detalle_auto: r.detalle, marca_moderador: r.marca || '',
          intentos: r.intentos, tiempo_hasta_logro_s: r.tLogro != null ? Math.round(r.tLogro / 1000) : null, tiempo_en_tarea_s: Math.round(this._tiempo(r) / 1000),
          pistas_pedidas: s.pistas, pistas_por_sugerencia: s.pistasSug, pidio_la_respuesta: s.pidioRespuesta, pasos_equivocados: s.errores,
          sugerencias: { mostradas: s.mostradas, aceptadas: s.aceptadas, descartadas: s.descartadas, retenidas_por_foco: s.retenidas },
          corazon: { controles: s.controles, preguntas: s.preguntas },
          frases: { entendidas: s.entendidas, sin_accion: s.sinAccion },
        };
      }),
      ejercicios: this.ej.historial.map((e) => ({ ecuacion: e.ec, resuelto: e.resuelto, comprobado: e.comprobado, tiempo_s: e.tResuelto ? Math.round((e.tResuelto - e.tInicio) / 1000) : null, pistas_pedidas: e.pistas, pistas_por_sugerencia: e.pistasSug, pidio_la_respuesta: e.pidioRespuesta, pasos_equivocados: e.errores })),
      sugerencias: this.ej.sugerencias.map((s) => ({ ecuacion: s.ec, motivo: s.motivo, texto: s.txt, resultado: s.estado === 'mostrada' ? 'sin respuesta' : s.estado })),
      frases: this._frases().map((f) => ({ segundo: f.s, tarea: f.tarea, frase: f.txt, entendida: f.ok })),
      eventos: this.eventos,
    };
  }

  _csv(d) {
    const c = (v) => { const s = Array.isArray(v) ? v.join(' | ') : v == null ? '' : String(v); return /[;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
    const fila = (a) => a.map(c).join(';');
    const L = [fila(['participante', 'fecha', 'tarea', 'titulo', 'estado_auto', 'detalle_auto', 'marca_moderador', 'intentos', 'tiempo_hasta_logro_s', 'tiempo_en_tarea_s', 'pistas_pedidas', 'pistas_por_sugerencia', 'pidio_la_respuesta', 'pasos_equivocados', 'sugerencias_mostradas', 'sugerencias_aceptadas', 'sugerencias_descartadas', 'sugerencias_retenidas_foco', 'controles_corazon', 'preguntas_corazon', 'frases_entendidas', 'frases_sin_accion'])];
    for (const t of d.tareas) L.push(fila([d.participante, d.fecha, t.n, t.titulo, t.estado_auto, t.detalle_auto, t.marca_moderador, t.intentos, t.tiempo_hasta_logro_s, t.tiempo_en_tarea_s, t.pistas_pedidas, t.pistas_por_sugerencia, t.pidio_la_respuesta, t.pasos_equivocados, t.sugerencias.mostradas, t.sugerencias.aceptadas, t.sugerencias.descartadas, t.sugerencias.retenidas_por_foco, t.corazon.controles, t.corazon.preguntas, t.frases.entendidas.length, t.frases.sin_accion.length]));
    L.push('', fila(['ejercicio', 'resuelto', 'comprobado', 'tiempo_s', 'pistas_pedidas', 'pistas_por_sugerencia', 'pidio_la_respuesta', 'pasos_equivocados']));
    for (const e of d.ejercicios) L.push(fila([e.ecuacion, e.resuelto ? 'si' : 'no', e.comprobado ? 'si' : 'no', e.tiempo_s, e.pistas_pedidas, e.pistas_por_sugerencia, e.pidio_la_respuesta, e.pasos_equivocados.length]));
    L.push('', fila(['segundo', 'tarea', 'frase', 'entendida']));
    for (const f of d.frases) L.push(fila([Math.round(f.segundo), f.tarea, f.frase, f.entendida ? 'si' : 'sin accion']));
    return '﻿' + L.join('\r\n');
  }

  descargar(soloJSON = false) {
    const d = this._datos();
    const base = `tareas-ia_${(d.participante || 'participante').replace(/[^\p{L}\p{N}_-]+/gu, '-')}_${d.fecha.replace(/[: ]/g, '-')}`;
    const bajar = (txt, tipo, ext) => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([txt], { type: tipo }));
      a.download = `${base}.${ext}`;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
    };
    if (!soloJSON) bajar(this._csv(d), 'text/csv;charset=utf-8', 'csv');
    setTimeout(() => bajar(JSON.stringify(d, null, 2), 'application/json', 'json'), soloJSON ? 0 : 600);
    this.hud.registrar('moderador', soloJSON ? 'descargar:json' : 'descargar:csv+json');
  }
}
