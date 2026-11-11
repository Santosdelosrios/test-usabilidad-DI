import * as THREE from 'three';
import { Guia } from './guia.js';

import { zona, VE } from './zonas.js';
import { Mirada } from './mirada.js';
import { Oculo } from './oculo.js';
import { instalarProyectos, estadoInicial } from './proyectos.js';
export { zona };

const NOMBRE_PARADA = { entrada: 'Entrada', hall: 'Hall', taller: 'Aula-taller', proyeccion: 'Zona de proyección', rincon: 'Rincón tranquilo', nodo: 'Sala del nodo' };
const EN = { entrada: 'la entrada', hall: 'el hall', taller: 'el aula-taller', proyeccion: 'la zona de proyección', rincon: 'el rincón tranquilo', nodo: 'la sala del nodo' };

const AGENDA = [
  { h: 9 * 60 + 20, tit: 'Llegada', lugar: 'Escuela-nodo', dest: null },
  // lo primero del día: la clase en su mesa, seis consignas cortas con el tutor que explica (tareas-ia.js)
  { h: 9 * 60 + 30, tit: 'Clase en tu mesa · Biología y Matemática', lugar: 'Aula-taller · tu mesa', dest: 'taller', clase: true },
  { h: 10 * 60, tit: 'Taller · proyecto del grupo', lugar: 'Aula-taller', dest: 'taller', proy: true },
  { h: 10 * 60 + 45, tit: 'Presentación al grupo', lugar: 'Zona de proyección', dest: 'proyeccion' },
  { h: 11 * 60 + 15, tit: 'Bloque de foco', lugar: 'Rincón tranquilo', dest: 'rincon' },
  { h: 12 * 60, tit: 'Visita técnica', lugar: 'Sala del nodo', dest: 'nodo' },
];

// Guion del tutor: guía, no resuelve. (El ejercicio de la luz del óculo vive en oculo.js.)
const GUION = {};

const I = (d) => `<span class="ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${d}</svg></span>`;
export const ICONOS = {
  tutor: I('<path d="M4 5h16v10H10l-4 4v-4H4z"/><path d="M12 7.5v5M9.5 10h5"/>'),
  hoy: I('<rect x="4" y="5" width="16" height="15" rx="1"/><path d="M4 10h16M9 3v4M15 3v4"/><circle cx="12" cy="15" r="1.4" fill="currentColor"/>'),
  mapa: I('<path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2z"/><path d="M9 4v14M15 6v14"/>'),
  explorar: I('<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/><circle cx="12" cy="12" r="2.6"/>'),
  capturar: I('<rect x="3" y="7" width="18" height="13" rx="1"/><path d="M8 7l2-3h4l2 3"/><circle cx="12" cy="13.5" r="3.5"/>'),
  proceso: I('<path d="M6 4v16"/><circle cx="6" cy="7" r="1.6"/><circle cx="6" cy="12" r="1.6"/><circle cx="6" cy="17" r="1.6"/><path d="M10 7h10M10 12h7M10 17h9"/>'),
  compartir: I('<path d="M12 15V3M7 8l5-5 5 5"/><path d="M5 12v8h14v-8"/>'),
  proyecto: I('<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>'),
  grupo: I('<circle cx="9" cy="9" r="3"/><circle cx="17" cy="10" r="2.4"/><path d="M3 20c0-3 3-5 6-5s6 2 6 5M15.5 15.4c3 0 5.5 1.6 5.5 4.6"/>'),
  subtitulos: I('<rect x="3" y="5" width="18" height="14" rx="1"/><path d="M7 12h4M13 12h4M7 15.5h7"/>'),
  foco: I('<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r=".9" fill="currentColor"/>'),
  ajustes: I('<path d="M4 7h10M18 7h2M4 17h4M12 17h8"/><circle cx="16" cy="7" r="2"/><circle cx="10" cy="17" r="2"/>'),
  gafas: I('<rect x="2.5" y="9" width="8" height="7" rx="2.5"/><rect x="13.5" y="9" width="8" height="7" rx="2.5"/><path d="M10.5 11.5c1-1 2-1 3 0"/>'),
  menu: I('<circle cx="6" cy="6" r="1.3"/><circle cx="12" cy="6" r="1.3"/><circle cx="18" cy="6" r="1.3"/><circle cx="6" cy="12" r="1.3"/><circle cx="12" cy="12" r="1.3"/><circle cx="18" cy="12" r="1.3"/><circle cx="6" cy="18" r="1.3"/><circle cx="12" cy="18" r="1.3"/><circle cx="18" cy="18" r="1.3"/>'),
  conexion: I('<circle cx="12" cy="12" r="2"/><path d="M7 7a7 7 0 0 0 0 10M17 7a7 7 0 0 1 0 10M4.5 4.5a10.5 10.5 0 0 0 0 15M19.5 4.5a10.5 10.5 0 0 1 0 15"/>'),
  seguimiento: I('<path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>'),
  docente: I('<circle cx="12" cy="8" r="3.5"/><path d="M5 20c0-4 3-6 7-6s7 2 7 6"/>'),
};
// Funciones de las gafas: [id, nombre, tecla, descripción]
export const FUNCIONES = [
  ['proyecto', 'Proyecto', 'Y', 'El trabajo con tu grupo'],
  ['hoy', 'Hoy', 'R', 'Tu ruta del día y a dónde ir'],
  ['mapa', 'Mapa', 'M', 'Dónde estás en la escuela'],
  ['explorar', 'Explorar', 'X', 'Aprendé de lo que mirás'],
  ['capturar', 'Capturar', 'K', 'Foto a tu proceso, privada'],
  ['proceso', 'Proceso', 'P', 'Lo que guardaste hoy'],
  ['compartir', 'Compartir', 'C', 'Pizarrón y compañeros'],
  ['grupo', 'Grupo', 'U', 'Tu equipo de proyecto'],
  ['subtitulos', 'Subtítulos', 'V', 'Lo que se dice, escrito'],
  ['foco', 'Foco', 'F', 'Silencio y concentración'],
  ['ajustes', 'Ajustes', 'O', 'Texto, privacidad, pausas'],
  ['gafas', 'Sacarme las gafas', 'G', 'Ver la escuela sin capa'],
];
const TECLAS = { KeyT: 'tutor', KeyR: 'hoy', KeyM: 'mapa', KeyX: 'explorar', KeyK: 'capturar', KeyP: 'proceso', KeyC: 'compartir', KeyU: 'grupo', KeyY: 'proyecto', KeyV: 'subtitulos', KeyF: 'foco', KeyO: 'ajustes' };
const TITULOS = { proyecto: 'Proyecto', hoy: 'Hoy', proceso: 'Mi proceso', docente: 'Así te ve Prof. Sosa', compartir: 'Compartir', seguimiento: 'Seguimiento', conexion: 'Conexión', mapa: 'Mapa', grupo: 'Grupo', ajustes: 'Ajustes' };
const ICONO_PANEL = { proyecto: 'proyecto', hoy: 'hoy', proceso: 'proceso', docente: 'docente', compartir: 'compartir', seguimiento: 'seguimiento', conexion: 'conexion', mapa: 'mapa', grupo: 'grupo', ajustes: 'ajustes' };

const mmss = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
const hhmm = (m) => `${String(Math.floor(m / 60) % 24).padStart(2, '0')}:${String(Math.floor(m % 60)).padStart(2, '0')}`;
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export class HUD {
  constructor({ nav, vida, world, camera, acabado, scene }) {
    this.nav = nav; this.vida = vida; this.world = world; this.camera = camera; this.acabado = acabado;
    this.S = world.sistema;
    this.ev = {};
    this.t = 0;
    this.visible = false;
    this.guia = new Guia(scene, nav);
    this.guia.mesh.visible = false;
    const $ = (id) => document.getElementById(id);
    this.el = {
      hud: $('hud'), anclas: $('hud-anclas'), mira: $('hud-mira'), miraEt: $('hud-mira-et'), hoy: $('hud-hoy'), hoyTxt: $('hud-hoy-txt'), horario: $('hud-horario'),
      foco: $('hud-foco'), focoT: $('hud-foco-t'), focoAv: $('hud-foco-av'), conexion: $('hud-conexion'), seguimiento: $('hud-seguimiento'),
      hora: $('hud-hora'), avisos: $('hud-avisos'), panel: $('hud-panel'), tutor: $('hud-tutor'), tutorTxt: $('hud-tutor-txt'),
      opciones: $('hud-opciones'), onda: $('hud-onda'), dock: $('hud-dock'),
      sugerencia: $('hud-sugerencia'), lanzador: $('hud-lanzador'), arranque: $('hud-arranque'), arranqueTxt: $('hud-arranque-txt'),
      lentes: $('lentes'), sinGafas: $('sin-gafas'), gafasBtn: $('gafas-btn'), flash: $('flash'),
      tutorYo: $('hud-tutor-yo'), tutorMenu: $('hud-tutor-menu'),
    };
    this.el.tutorMenu.innerHTML = ICONOS.menu;
    this.ojos = new Mirada({ alElegir: (t) => this.registrar('mirada', (t.dataset.a || t.dataset.acc || t.getAttribute('aria-label') || t.textContent || '').trim().slice(0, 40)) });
    this.propuesta = null; this.pendiente = null; this.tutorUsado = false;
    this.oculo = new Oculo({ hud: this, scene, camera });
    this.puestas = true;
    this.aj = { escala: 1, sugerencias: true, subtitulos: false, pausas: true, visibilidad: 'todo' };
    this.usoSeg = 0;
    this.capturas = 0;
    this._armarDock();
    this._armarLanzador();
    this.reset();
    this._anclas();
    this._bind();
    this.S.alCruzarLu = (entrando) => { if (entrando && this.visible && this.puestas) this.conectar(); };
    this.ondaCtx = this.el.onda.getContext('2d');
  }

  on(e, f) { (this.ev[e] ||= []).push(f); }
  emit(e, ...a) { (this.ev[e] || []).forEach((f) => f(...a)); }
  cambio() { this.emit('cambio', this); }

  reset() {
    this.tutorUsado = false;
    const proy = AGENDA.find((a) => a.proy);
    if (proy) proy.tit = 'Taller · proyecto del grupo';
    if (this.anclas) {
      this.anclas.filter((a) => a.id.startsWith('pm-')).forEach((a) => a.el.remove());
      this.anclas = this.anclas.filter((a) => !a.id.startsWith('pm-'));
      this.anclas.forEach((a) => { if (a.tipo === 'persona' && a.acc !== a.accBase) { a.acc = a.accBase; this._pintarAcc(a); } });
    }
    if (this.oculo) this.oculo.reset();
    this.buscando = 0;
    this.pistaDada = false;
    this.st = {
      conectada: false, local: false, foco: false, seg: 'activo', guia: null, hoyAbierto: false,
      oculoResuelto: false, oculoPred: null, oculoAcierto: false, oculoAyudas: 0, vistoDocente: false, compartido: null, segVistoEnFoco: false, conexVistaLocal: false,
      focoSeg: 0, focoTotal: 0, enEspera: [], minuto: 9 * 60 + 22, tomiAvisado: false, explorar: false, sugeridas: {},
      proy: estadoInicial(),
      ayudaDe: null, pedidos: [], santiPregunta: false, ensenoSanti: false, procesoVistoConCaptura: false,
      proceso: [
        { id: 'e1', hora: 'Ayer', txt: 'Foto del perchero por talle', visible: true, dest: false },
        { id: 'e2', hora: 'Ayer', txt: 'Primer gráfico de stock: puse los ejes al revés', visible: true, dest: false, tag: 'Error' },
        { id: 'e3', hora: 'Ayer', txt: 'Nota de voz: «no sé por dónde arrancar el proyecto»', visible: false, dest: false, tag: 'Privada' },
      ],
    };
    this.comp = { item: null, destino: null };
    this.panelAbierto = null;
    if (this.el && this.el.sugerencia) { this.el.sugerencia.hidden = true; this.cerrarLanzador(); this.el.hud.classList.remove('explorar'); this.ojos.el.classList.remove('explorar'); }
    this.S.compartido = null;
    this.S.modoLocal = false;
    if (this.el) {
      this.el.hud.classList.add('apagado');
      this.el.hud.classList.remove('foco');
      this.el.conexion.className = 'vidrio buscando';
      this.el.conexion.querySelector('span').textContent = 'Buscando nodo…';
      this.el.foco.hidden = true;
      this.cerrarPanel();
      this.cerrarTutor(true);
      this.guia.set(null);
      this.nav.resaltar(null);
      this._estadoSeg();
      this._dock();
    }
  }

  // ── modos generales ───────────────────────────────────────
  setVisible(v) {
    this.visible = v;
    this.el.hud.classList.toggle('oculto', !v);
    this.el.lentes.classList.toggle('oculto', !v);
    this.el.gafasBtn.hidden = !v;
    this.el.sinGafas.hidden = !v || this.puestas;
    this.ojos.setActiva(v && this.puestas && this.ojos.habilitada);
    this._guiaVisible();
    if (v) {
      const p = this.camera.position;
      if (zona(p.x, p.z) !== 'plaza' && !this.st.conectada) this.conectar(true);
    }
  }

  conectar(silencioso = false) {
    if (this.st.conectada) return;
    this.st.conectada = true;
    this.el.hud.classList.remove('apagado');
    this._conexionPill();
    if (!silencioso) {
      this.aviso('Conectada a Escuela-nodo 014', 'TUTOR');
      setTimeout(() => this._bienvenida(), 1100);
      this.el.hoy.classList.remove('pulso');
      void this.el.hoy.offsetWidth;
      this.el.hoy.classList.add('pulso');
    }
    this._hoyPill();
    this._reposo();
    this.cambio();
  }

  // al entrar: lo primero del día es la clase; el proyecto se elige después
  _bienvenida() {
    if (this.st.conectada && this.clase && this.clase.pendiente()) return this._saludoClase();
    this._elegirProyecto();
  }

  _saludoClase() {
    if (this.ia) return this.cerebro.evento('Acaba de entrar a la escuela y las gafas se conectaron. Lo primero del día es la clase de Biología y Matemática en su mesa del aula-taller, a las 9:30; después, a las 10:00, arranca un proyecto con Tomi y Ana. Saludalo en una frase, contale qué tiene primero y ofrecé llevarlo a su mesa, sin llevarlo todavía.');
    this.proponer(`Buen día${this._coma()}. Lo primero es la clase de Biología y Matemática, a las 9:30 en tu mesa del aula-taller.`, [['Llevame', () => this.clase.sentarse('saludo')], ['Ver mi día', () => this.panel('hoy', true)]], 'saludo');
  }

  // el proyecto del taller: se elige una sola vez (después de la clase)
  // introIA: qué pasó (para el tutor con IA); introTxt: cómo arranca la frase del tutor guionado
  _elegirProyecto(introIA, introTxt) {
    if (!this.st.conectada || this.st.proy.id) return this._saludo();
    if (this.proyFijo) { this.proyElegir(this.proyFijo); return; }
    this.panel('proyecto', true);
    if (this.ia) this.cerebro.evento(`${introIA || 'Acaba de entrar a la escuela y las gafas se conectaron.'} Ahora su grupo arranca un proyecto nuevo con Tomi y Ana, y tiene en pantalla cuatro para elegir. Invitalo a elegir en una frase; no elijas por él.`);
    else this.proponer(`${introTxt || `Buen día${this._coma()}. `}Ahora tu grupo arranca un proyecto nuevo con Tomi y Ana: elegí uno de los cuatro.`);
  }

  _saludo() {
    if (this.ia) return this.cerebro.evento('Acaba de entrar a la escuela y las gafas se conectaron al nodo. Saludalo en una frase y contale qué tiene primero en su itinerario, sin llevarlo todavía.');
    if (!this.st.conectada || this.st.guia || this.nav.current === 'taller') return this._reposo();
    this.proponer(`Seguís con el taller de tu proyecto, en el aula-taller. A las 10:45 lo presentan.`, [['Llevame', () => this.guiar('taller')], ['Ver mi día', () => this.panel('hoy', true)]], 'saludo');
  }

  setLocal(on) {
    this.st.local = on;
    this.S.modoLocal = on;
    this._conexionPill();
    if (on) this.proponer('Se cortó internet en el barrio. Yo sigo funcionando desde el nodo de la escuela.', [['¿Qué quedó esperando?', () => this.panel('conexion', true)], ['Ok', null]]);
    else this.aviso('Volvió internet. Se enviaron 3 cosas en cola.', 'Conexión');
    if (this.panelAbierto === 'conexion') this.panel('conexion', true);
    this.cambio();
  }

  setFoco(on) {
    if (this.st.foco === on) return;
    this.st.foco = on;
    this.el.hud.classList.toggle('foco', on);
    this.el.foco.hidden = !on;
    if (this.st.seg !== 'pausado') this.st.seg = on ? 'foco' : 'activo';
    this._estadoSeg();
    if (on) {
      this.st.focoSeg = 0;
      this.cerrarTutor(true);
      if (this.panelAbierto && this.panelAbierto !== 'seguimiento') this.cerrarPanel();
      this.proponer('En foco. Silencio los avisos y escondo a los demás hasta que salgas.', [['¿Qué ve mi docente?', () => this.panel('seguimiento', true)], ['Salir del foco', () => this.setFoco(false)]]);
    } else {
      const n = this.st.enEspera.length;
      this.propuesta = null;
      this.proponer(n ? `Saliste del foco. Tenías ${n} aviso${n > 1 ? 's' : ''} en espera: te los muestro.` : 'Saliste del foco.');
      const pend = this.st.enEspera.splice(0);
      pend.forEach((a, i) => setTimeout(() => this.aviso(a[0], a[1]), 900 + i * 900));
    }
    if (this.panelAbierto === 'seguimiento') this.panel('seguimiento', true);
    this._dock();
    this.cambio();
  }

  _proximo(desde, dest) {
    if (!desde || !dest || desde === dest) return null;
    const prev = { [desde]: null }, cola = [desde];
    while (cola.length) {
      const u = cola.shift();
      if (u === dest) break;
      for (const e of this.nav.adj[u]) if (!(e.to in prev)) { prev[e.to] = u; cola.push(e.to); }
    }
    let c = dest;
    while (prev[c] && prev[c] !== desde) c = prev[c];
    return c;
  }

  guiar(dest) {
    this.st.guia = dest;
    this.guia.on = this.visible && this.puestas;
    this.guia.set(dest);
    this.nav.resaltar(this.guia.on ? this._proximo(this.nav.current, dest) : null);
    if (dest) {
      const pts = this.nav.route(this.nav.current, dest);
      let l = 0;
      for (let i = 1; i < pts.length; i++) l += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
      this.proponer(`Seguí la línea naranja del piso: ${Math.round(l)} m hasta ${EN[dest]}.`);
    }
    this.cambio();
  }

  llegar(stop) {
    if (!this.st.conectada && this.visible && this.puestas && stop.id !== 'entrada') this.conectar();
    if (this.cola) this.cola = this.cola.filter((q) => !q.lugar || q.lugar === stop.id);
    if (this.propuesta && this.propuesta.lugar && this.propuesta.lugar !== stop.id) { this.propuesta = null; this._siguiente(); }
    setTimeout(() => this._sugerirLugar(stop.id), 1400);
    // ya es la hora de la clase y llegó al aula-taller: le ofrece sentarse
    if (stop.id === 'taller' && this.st.conectada && this.clase && this.clase.pendiente()) setTimeout(() => this.clase.ofrecer('llegada'), 1600);
    if (this.st.guia && stop.id === this.st.guia) {
      if (!this.ia) this.proponer(`Llegaste ${('a ' + EN[stop.id]).replace(/^a el /, 'al ')}.`);
      this.st.guia = null;
      this.guia.set(null);
      this.nav.resaltar(null);
    } else {
      this._guiaVisible();
    }
    this.cambio();
  }

  // ── avisos ───────────────────────────────────────────────
  aviso(txt, et = 'Aviso', forzar = false) {
    if (this.st.foco && !forzar) { this.st.enEspera.push([txt, et]); this._focoAv(); return; }
    const d = document.createElement('div');
    d.className = 'aviso vidrio';
    d.innerHTML = `<b>${esc(et)}</b>${esc(txt)}`;
    this.el.avisos.prepend(d);
    if (this.alDecir && ['Tomi', 'Ana', 'Santi', 'Juli', 'Prof. Sosa'].includes(et)) this.alDecir(txt, { quien: et });
    while (this.el.avisos.children.length > 3) this.el.avisos.lastChild.remove();
    setTimeout(() => { d.classList.add('sale'); setTimeout(() => d.remove(), 450); }, 4800);
  }

  // ── tutor: siempre presente, abajo al centro ─────────────
  // reposo: una línea + propuestas cortas · habla: conversación en grande
  tutor(nodo) {
    if (!this.st.conectada) return;
    if (nodo && nodo[0] === '#') { this.cerrarTutor(); return this.panel(nodo.slice(1), true); }
    const n = GUION[nodo];
    if (!n) return this.cerrarTutor();
    this.decir(n.txt, n.op.map(([t, sig]) => [t, () => (sig ? this.tutor(sig) : this.cerrarTutor())]));
    this.registrar('tutor', nodo);
    this.cambio();
  }

  // Lu mira al tutor: retoma lo que estaba proponiendo o le ofrece lo que sirve acá
  abrirTutor() {
    if (!this.st.conectada || !this.puestas) return;
    if (this.alAbrirTutor) return this.alAbrirTutor(); // el modo activo decide (test de tareas)
    if (this.ia) { if (this.voz) this.voz.abrirVentana(10); return this.proponer('Te escucho.'); }
    const st = this.st, aca = this.nav.walk ? null : this.nav.current;
    if (this.propuesta && this.propuesta.opciones.length) {
      const p = this.propuesta;
      this.propuesta = null;
      return this.decir(p.texto, p.opciones.map(([t, fn]) => [t, () => { this.cerrarTutor(); if (fn) fn(); }]));
    }
    const ops = [];
    if (this.oculo.activo) ops.push(['Seguir con la luz del óculo', () => this.oculo.empezar()]);
    else if (aca === 'hall' && !st.oculoResuelto) ops.push(['La luz del óculo', () => this.oculo.empezar()]);
    ops.push(['¿Qué me toca ahora?', () => this._queSigue()]);
    if (aca === 'taller') ops.push(['Necesito ayuda de alguien', () => { this.cerrarTutor(); this.panel('grupo', true); }]);
    if (st.foco) ops.push(['Salir del foco', () => { this.cerrarTutor(); this.setFoco(false); }]);
    else if (aca === 'rincon') ops.push(['Quiero concentrarme', () => { this.cerrarTutor(); this.setFoco(true); }]);
    ops.push(['Más funciones', () => { this.cerrarTutor(); this.abrirLanzador(); }]);
    if (ops.length < 4) ops.push(['Nada, gracias', () => this.cerrarTutor()]);
    this.registrar('tutor', 'abrir');
    this.decir(`¿En qué te ayudo${this._coma()}?`, ops.slice(0, 5));
  }

  // lo próximo del itinerario (la clase, una vez hecha, ya no cuenta)
  _prox(m) {
    const st = this.st;
    const L = AGENDA.filter((a) => !(a.clase && st.claseHecha));
    return L.find((a, i) => a.dest && (m < a.h || (L[i + 1] ? m < L[i + 1].h : true))) || L[L.length - 1];
  }

  _queSigue() {
    const m = this.st.minuto;
    const prox = this._prox(m);
    const verDia = ['Ver todo el día', () => { this.cerrarTutor(); this.panel('hoy', true); }];
    // la clase: se sienta en su mesa (o lo lleva hasta ahí)
    if (prox.clase && this.clase && this.clase.pendiente()) {
      const aca = !this.nav.walk && this.nav.current === prox.dest;
      return this.decir(`${aca ? 'Ahora' : `A las ${hhmm(prox.h)}`} tenés clase en tu mesa: Biología y Matemática${aca ? '' : `, en ${EN[prox.dest]}`}.`, [[aca ? 'Sentarme' : 'Llevame', () => { this.cerrarTutor(); this.clase.sentarse('tutor'); }], verDia]);
    }
    if (!this.nav.walk && this.nav.current === prox.dest) return this.decir(`Ahora te toca ${prox.tit.toLowerCase()}, y ya estás en ${EN[prox.dest]}.`, [verDia, ['Gracias', () => this.cerrarTutor()]]);
    this.decir(`A las ${hhmm(prox.h)} tenés ${prox.tit.toLowerCase()}, en ${EN[prox.dest]}.`, [['Llevame', () => { this.cerrarTutor(); this.guiar(prox.dest); }], verDia]);
  }

  // conversación en grande (también la usa el panel del facilitador en la etapa 5)
  // alTerminar: avisa cuando la voz del tutor terminó de decirlo (lo usa la explicación guionada)
  decir(texto, opciones = [], { alTerminar } = {}) {
    this.tutorAbierto = true;
    this.tutorUsado = true;
    this.propuesta = null;
    clearTimeout(this._tProp);
    if (this.panelAbierto) this.cerrarPanel();
    this.cerrarLanzador();
    this._escribir(texto, opciones, 'habla');
    if (this.alDecir) this.alDecir(texto, { pregunta: opciones.length > 0, alTerminar });
    this._dock();
  }

  // el tutor propone algo sin interrumpir: una línea y opciones cortas
  proponer(texto, opciones = [], clave = null, lugar = null) {
    if (this.mudo) return; // el tutor con IA ya dijo lo suyo
    if (clave) { if (this.st.sugeridas[clave]) return; this.st.sugeridas[clave] = true; }
    const p = { texto, opciones, lugar, clave };
    // una sugerencia no pisa a otra que todavía espera respuesta: hace fila
    if (clave && ((this.propuesta && this.propuesta.opciones.length) || this.tutorAbierto)) {
      this.cola = (this.cola || []).filter((q) => q.clave !== clave);
      this.cola.push(p);
      return;
    }
    if (this.tutorAbierto) { this.pendiente = p; return; }
    this._mostrarPropuesta(p);
  }

  // qué muestra el tutor cuando termina algo: lo pendiente, la fila o el reposo
  _siguiente() {
    if (this.tutorAbierto || this.propuesta) return;
    const aca = this.nav.walk ? null : this.nav.current;
    while (this.cola && this.cola.length) {
      const q = this.cola.shift();
      if (!q.lugar || q.lugar === aca) return this._mostrarPropuesta(q);
    }
    this._reposo();
  }

  _mostrarPropuesta(p) {
    this.propuesta = p;
    const ops = p.opciones.map(([txt, fn]) => [txt, () => { this.propuesta = null; if (fn) fn(); this._siguiente(); }]);
    this._escribir(p.texto, ops, 'reposo');
    if (this.alDecir) this.alDecir(p.texto, { pregunta: ops.length > 0 });
    const t = this.el.tutor;
    t.classList.remove('nuevo'); void t.offsetWidth; t.classList.add('nuevo');
    clearTimeout(this._tProp);
    if (!p.opciones.length) this._tProp = setTimeout(() => { if (this.propuesta === p && !this.tutorAbierto) { this.propuesta = null; this._siguiente(); } }, 7000);
  }

  _idle() {
    const st = this.st;
    if (!st.conectada) return 'Busco el nodo de la escuela para despertarme…';
    if (st.foco) return 'En foco. Te guardo los avisos hasta que salgas.';
    if (this.pistaVoz) return `Acá estoy${this._coma()}. ${this.pistaVoz}`;
    return this.tutorUsado ? `Acá estoy${this._coma()}.` : `Acá estoy${this._coma()}. Mirá el círculo cuando me necesites.`;
  }

  _reposo() {
    if (this.tutorAbierto || this.propuesta) return;
    const ops = this.st.foco && this.st.conectada ? [['Salir del foco', () => this.setFoco(false)]] : [];
    this._escribir(this._idle(), ops, 'reposo');
    this.tipeo = null;
    this.el.tutorTxt.textContent = this._idle();
    this.el.opciones.classList.remove('esperando');
  }

  _escribir(txt, opciones, modo) {
    const t = this.el.tutor;
    t.classList.toggle('reposo', modo === 'reposo');
    t.classList.toggle('habla', modo === 'habla');
    this.tipeo = { txt, i: 0 };
    this.el.tutorTxt.textContent = '';
    const o = this.el.opciones;
    o.innerHTML = '';
    o.classList.toggle('esperando', opciones.length > 0);
    opciones.forEach(([txtB, fn]) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'vidrio';
      b.textContent = txtB;
      b.addEventListener('click', () => { this.registrar('respuesta', txtB); fn(); });
      o.appendChild(b);
    });
  }

  cerrarTutor(limpiar = false) {
    this.tutorAbierto = false;
    if (limpiar) { this.propuesta = null; this.pendiente = null; this.cola = []; }
    const pend = this.pendiente;
    this.pendiente = null;
    if (pend) this._mostrarPropuesta(pend);
    else this._siguiente();
    this._dock();
  }

  // ── paneles ──────────────────────────────────────────────
  panel(tipo, refrescar = false) {
    if (!this.st.conectada) return;
    if (this.panelAbierto === tipo && !refrescar) return this.cerrarPanel();
    this.panelAbierto = tipo;
    const st = this.st;
    let h = '<button class="cerrar" data-a="cerrar">Esc ×</button>';
    if (tipo === 'hoy') {
      st.hoyAbierto = true;
      h += `<h3>Hoy</h3><div class="sub"><span>Martes · ruta del día</span><span>${hhmm(st.minuto)}</span></div>`;
      AGENDA.forEach((a, i) => {
        const sig = AGENDA[i + 1];
        const ahora = !(a.clase && st.claseHecha) && st.minuto >= a.h && (!sig || st.minuto < sig.h);
        const hecha = (a.clase && st.claseHecha) || (!a.dest && st.conectada) || (sig && st.minuto >= sig.h);
        const guiando = st.guia && st.guia === a.dest;
        h += `<div class="fila ${ahora ? 'ahora' : ''} ${hecha && !ahora ? 'hecha' : ''}"><span class="h">${hhmm(a.h)}</span><span class="t">${esc(a.tit)}<small class="${ahora ? 'nar' : ''}">${ahora ? 'Ahora · ' : ''}${esc(a.lugar)}</small></span>`
          + (a.dest ? `<span class="acciones"><button class="btn ${guiando ? 'on' : ''}" data-a="guiar:${a.dest}">${guiando ? 'Guiando' : 'Guiar'}</button></span>` : '<span></span>') + '</div>';
      });
    } else if (tipo === 'proceso') {
      if (st.proceso.some((e) => e.tag === 'Captura')) st.procesoVistoConCaptura = true;
      const vis = st.proceso.filter((e) => e.visible).length;
      h += `<h3>Mi proceso</h3><div class="sub"><span>Hoy · ${st.proceso.length} evidencias</span><span>Tu docente ve ${vis}</span></div>`;
      h += `<div class="bloque arriba"><button class="btn lleno" data-a="ver-docente">Ver como mi docente</button></div>`;
      st.proceso.slice().reverse().forEach((e) => {
        h += `<div class="fila"><span class="h">${e.hora}</span><span class="t">${esc(e.txt)}${e.img ? `<img class="thumb" src="${e.img}" alt="">` : ''}<small class="${e.dest ? 'nar' : ''}">${e.dest ? '★ Destacada · ' : ''}${e.tag ? esc(e.tag) + ' · ' : ''}${e.visible ? 'La ve tu docente' : 'Solo vos'}</small></span>`
          + `<span class="acciones"><button class="btn ${e.dest ? 'on' : ''}" data-a="dest:${e.id}" title="Destacar">★</button><button class="btn" data-a="vis:${e.id}">${e.visible ? 'Ocultar' : 'Mostrar'}</button></span></div>`;
      });
    } else if (tipo === 'docente') {
      st.vistoDocente = true;
      const vis = st.proceso.filter((e) => e.visible).sort((a, b) => b.dest - a.dest);
      h += `<h3>Así te ve Prof. Sosa</h3><div class="sub"><span>Vista docente · hoy</span><span>${vis.length} de ${st.proceso.length}</span></div>`;
      vis.forEach((e) => { h += `<div class="fila"><span class="h">${e.hora}</span><span class="t">${esc(e.txt)}${e.img ? `<img class="thumb" src="${e.img}" alt="">` : ''}${e.dest ? `<small class="nar">★ Destacada por ${esc(this.nombre || 'el estudiante')}</small>` : ''}</span><span></span></div>`; });
      h += `<div class="bloque"><div class="et">También ve</div><ul><li>Trabajó con el tutor: ${st.oculoResuelto ? `la luz del óculo · ${st.oculoAyudas} pista${st.oculoAyudas === 1 ? '' : 's'}` : 'todavía no'}</li><li>Pidió ayuda a compañeros: ${st.pedidos.length}</li><li>Tiempo en foco hoy: ${Math.round(st.focoTotal / 60)} min</li></ul></div>`;
      h += `<div class="bloque"><div class="et">No ve</div><ul><li class="no">Lo que ocultaste (${st.proceso.length - vis.length})</li><li class="no">Lo que mirás y con quién hablás</li></ul></div>`;
      h += `<div class="bloque"><button class="btn" data-a="panel:proceso">← Volver a mi proceso</button></div>`;
    } else if (tipo === 'compartir') {
      const zLu = zona(this.camera.position.x, this.camera.position.z);
      const enZona = zLu === 'proyeccion';
      const items = [];
      if (st.proy.grafico) items.push(['graf', `Resultado del proyecto «${this.proyDef().nombre}»`]);
      if (st.proceso.find((e) => e.id === 'oc')) items.push(['oc', 'La luz del óculo']);
      items.push(['e1', 'Foto del perchero']);
      st.proceso.filter((e) => e.img).slice(-2).forEach((e) => items.push([e.id, e.txt]));
      if (!this.comp.item) this.comp.item = items[0][0];
      h += `<h3>Compartir</h3><div class="sub"><span>Qué y con quién</span><span>${enZona ? 'Zona 04' : 'Lejos del pizarrón'}</span></div>`;
      h += '<div class="et" style="font-size:9.5px;letter-spacing:.18em;color:rgba(236,235,231,.55);text-transform:uppercase">Qué</div>';
      items.forEach(([id, t]) => { h += `<button class="opcion ${this.comp.item === id ? 'sel' : ''}" data-a="item:${id}"><i></i>${esc(t)}</button>`; });
      h += '<div class="et" style="font-size:9.5px;letter-spacing:.18em;color:rgba(236,235,231,.55);text-transform:uppercase;margin-top:14px">Dónde</div>';
      const dest = [['pizarron', 'Pizarrón · zona 04', enZona ? '6 gafas' : 'Acercate'], ['piso', 'Proyección del piso', enZona ? 'Zona 04' : 'Acercate'], ['santi', 'Santi', st.santiPregunta && !st.ensenoSanti ? 'Te preguntó algo' : 'Compañero'], ['tomi', 'Tomi', 'Tu grupo']];
      dest.forEach(([id, t, n]) => {
        const off = (id === 'pizarron' || id === 'piso') && !enZona;
        h += `<button class="opcion ${this.comp.destino === id ? 'sel' : ''} ${off ? 'off' : ''}" data-a="destino:${id}"><i></i>${esc(t)}<small>${esc(n)}</small></button>`;
      });
      const listo = this.comp.item && this.comp.destino;
      h += `<div class="bloque"><button class="btn lleno ${listo ? '' : 'off'}" data-a="enviar">Enviar</button></div>`;
    } else if (tipo === 'seguimiento') {
      if (st.foco) st.segVistoEnFoco = true;
      const vis = st.proceso.filter((e) => e.visible).length;
      if (st.seg === 'pausado') {
        h += `<h3>Seguimiento</h3><div class="sub"><span>Lo que le llega a Prof. Sosa</span></div><div class="grande">Pausado</div>`
          + `<div class="bloque">Tu docente ve «pausado» y desde qué hora. No ve nada de lo que hagas mientras tanto.</div><div class="bloque"><button class="btn lleno" data-a="reanudar">Reanudar</button></div>`;
      } else if (st.foco) {
        h += `<h3>Seguimiento</h3><div class="sub"><span>Lo que le llega a Prof. Sosa</span></div><div class="grande nar">Solo foco</div>`
          + `<div class="bloque"><div class="et">Mientras estás en foco ve</div><ul><li class="si">Que estás en foco</li><li class="si">Cuánto tiempo llevás (${mmss(st.focoSeg)})</li></ul></div>`
          + `<div class="bloque"><div class="et">No ve</div><ul><li class="no">Qué hacés en ese tiempo</li><li class="no">Lo que mirás</li><li class="no">Lo que le pedís al tutor</li></ul></div>`;
      } else {
        h += `<h3>Seguimiento</h3><div class="sub"><span>Lo que le llega a Prof. Sosa</span></div><div class="grande">Activo</div>`
          + `<div class="bloque"><div class="et">Ve ahora</div><ul><li class="si">Tus evidencias visibles (${vis})</li><li class="si">Si pediste ayuda al tutor</li><li class="si">Tiempo en cada actividad</li></ul></div>`
          + `<div class="bloque"><div class="et">No ve</div><ul><li class="no">Lo que mirás</li><li class="no">Tus notas privadas</li><li class="no">Tus charlas con compañeros</li></ul></div>`
          + `<div class="bloque"><button class="btn" data-a="pausar">Pausar 15 min</button> <span style="font-size:10px;color:rgba(236,235,231,.55)">Tu docente va a ver «pausado».</span></div>`;
      }
    } else if (tipo === 'conexion') {
      if (st.local) {
        st.conexVistaLocal = true;
        const arco = 2 * Math.PI * 34;
        h += `<h3>Conexión</h3><div class="sub"><span>Escuela-nodo 014</span><span>Sin internet externa</span></div><div class="grande nar">Modo local</div>`
          + `<div class="bloque"><div class="et">Sigue funcionando</div><ul><li class="si">Tutor (corre en el nodo)</li><li class="si">Tus materiales y tu proceso</li><li class="si">Pizarrón y proyecciones</li><li class="si">Mensajes dentro de la escuela</li></ul></div>`
          + `<div class="bloque cola"><svg viewBox="0 0 84 84" aria-hidden="true"><circle cx="42" cy="42" r="34" fill="none" stroke="rgba(236,235,231,.18)" stroke-width="4"/><circle cx="42" cy="42" r="34" fill="none" stroke="#e8743b" stroke-width="4" stroke-dasharray="${arco * 0.375} ${arco}" transform="rotate(-90 42 42)"/><text x="42" y="52" text-anchor="middle" fill="#ecebe7" font-size="28" style="font-family:var(--display);font-stretch:var(--estirar);font-weight:var(--peso-d)">3</text></svg>`
          + `<div><div class="et">En cola</div><ul><li>Avance para el negocio del proyecto</li><li>Banco de ejercicios nuevo</li><li>Copia semanal del proceso</li></ul></div></div>`
          + `<div class="bloque" style="color:rgba(236,235,231,.6)">Se envía solo cuando vuelva la conexión.</div>`;
      } else {
        h += `<h3>Conexión</h3><div class="sub"><span>Escuela-nodo 014</span><span>En línea</span></div><div class="grande">Nodo 014</div>`
          + `<div class="bloque"><ul><li class="si">Internet del barrio: conectada</li><li class="si">31 gafas en la escuela</li><li class="si">Tu proceso se guarda en el nodo, no en la nube</li></ul></div>`;
      }
    }
    if (tipo === 'mapa') {
      h += `<h3>Mapa</h3><div class="sub"><span>Escuela-nodo 014</span><span>${st.guia ? 'Guiando a ' + esc(NOMBRE_PARADA[st.guia]) : 'Tocá un lugar para ir'}</span></div><canvas class="mapa" width="680" height="640"></canvas>`;
    } else if (tipo === 'proyecto') {
      h += this.proyPanel();
    } else if (tipo === 'grupo') {
      const miembros = [['Tomi', 'Compañero de proyecto'], ['Ana', 'Compañera de proyecto'], ['Prof. Sosa', 'Docente del taller']];
      const lugares = { plaza: 'en la plaza', hall: 'en el hall', taller: 'en el taller', proyeccion: 'en la zona 04', rincon: 'en el rincón', nodo: 'en el nodo', pasillo: 'en el pasillo' };
      h += `<h3>Grupo</h3><div class="sub"><span>${this.proyDef() ? esc(this.proyDef().nombre) : 'Tu grupo de proyecto'}</span><span>${miembros.length} personas</span></div>`;
      for (const [n, rol] of miembros) {
        const p = this._quien(n);
        let d = '—', donde = '';
        if (p) {
          const v = new THREE.Vector3(); p.root.getWorldPosition(v);
          d = Math.round(v.distanceTo(this.camera.position)) + ' m';
          donde = lugares[zona(v.x, v.z)] || '';
        }
        const estado = n === 'Tomi' && st.tomiAvisado ? 'Te espera para explicarte' : p ? p.o.estado : rol;
        h += `<div class="fila apilada"><span class="h">${d}</span><span class="t">${esc(n)}<small>${esc(estado)} · ${esc(donde)}</small></span><span class="acciones"><button class="btn" data-a="ayuda:${esc(n)}">Pedir ayuda</button><button class="btn" data-a="saludo:${esc(n)}">Saludar</button></span></div>`;
      }
      const quien = this.nombre || 'Vos';
      const yo = { todo: `${quien} · trabajando en el taller`, nombre: `${quien} (sin estado)`, nada: 'No aparecés en la capa social' }[this.aj.visibilidad];
      h += `<div class="bloque"><div class="et">Así te ven tus compañeros</div>${esc(yo)}<div style="margin-top:8px"><button class="btn" data-a="panel:ajustes">Cambiar en Ajustes</button></div></div>`;
    } else if (tipo === 'ajustes') {
      const aj = this.aj;
      const sino = (k) => `<button class="btn ${aj[k] ? 'on' : ''}" data-a="aj:${k}">${aj[k] ? 'Sí' : 'No'}</button>`;
      h += `<h3>Ajustes</h3><div class="sub"><span>Tus gafas</span><span>TUTOR</span></div>`;
      h += `<div class="ajuste"><span>Tamaño del texto<small>Paneles, tutor y avisos</small></span><span class="acciones">${[[0.9, 'A−'], [1, 'A'], [1.15, 'A+'], [1.3, 'A++']].map(([v, t]) => `<button class="btn ${aj.escala === v ? 'on' : ''}" data-a="escala:${v}">${t}</button>`).join('')}</span></div>`;
      h += `<div class="ajuste"><span>Mirada con el mouse<small>Si está apagada, todo se maneja con la voz</small></span><span class="acciones"><button class="btn ${this.ojos.habilitada ? 'on' : ''}" data-a="mirar:1">Sí</button><button class="btn ${!this.ojos.habilitada ? 'on' : ''}" data-a="mirar:0">No</button></span></div>`;
      if (this.voz && this.voz.modo) h += `<div class="ajuste"><span>Voz del tutor<small>El tutor lee en voz alta lo que te dice</small></span><span class="acciones"><button class="btn ${this.voz.hablaTutor ? 'on' : ''}" data-a="vozt:1">Sí</button><button class="btn ${!this.voz.hablaTutor ? 'on' : ''}" data-a="vozt:0">No</button></span></div>`;
      h += `<div class="ajuste"><span>Tiempo de mirada<small>Cuánto sostenés la vista para elegir</small></span><span class="acciones">${[[0.6, 'Rápido'], [0.85, 'Normal'], [1.2, 'Lento']].map(([v, t]) => `<button class="btn ${this.ojos.tiempo === v ? 'on' : ''}" data-a="mirada:${v}">${t}</button>`).join('')}</span></div>`;
      h += `<div class="ajuste"><span>Iniciativa del tutor<small>Puede hablarte primero, sin que le preguntes</small></span><span class="acciones">${sino('sugerencias')}</span></div>`;
      h += `<div class="ajuste"><span>Subtítulos<small>Lo que dicen las personas cerca tuyo</small></span><span class="acciones">${sino('subtitulos')}</span></div>`;
      h += `<div class="ajuste"><span>Pausas para los ojos<small>Te recuerda mirar lejos cada tanto</small></span><span class="acciones">${sino('pausas')}</span></div>`;
      h += `<div class="ajuste"><span>Qué ven tus compañeros<small>Tu nombre y estado en la capa social</small></span><span class="acciones">${[['todo', 'Todo'], ['nombre', 'Nombre'], ['nada', 'Nada']].map(([v, t]) => `<button class="btn ${aj.visibilidad === v ? 'on' : ''}" data-a="priv:${v}">${t}</button>`).join('')}</span></div>`;
      h += `<div class="ajuste"><span>Sacarme las gafas<small>Ver la escuela sin la capa digital</small></span><span class="acciones"><button class="btn" data-a="gafas">Sacar · G</button></span></div>`;
    }
    h = h.replace('<h3>', '<h3>' + (ICONOS[ICONO_PANEL[tipo]] || ''));
    this.el.panel.innerHTML = h;
    this.el.panel.hidden = false;
    this.mapaCanvas = null;
    if (tipo === 'mapa') {
      const cv = this.el.panel.querySelector('canvas.mapa');
      this.mapaCanvas = cv;
      this.dibujarMapa(cv);
      cv.addEventListener('click', (e) => {
        const r = cv.getBoundingClientRect();
        const x = ((e.clientX - r.left) / r.width) * cv.width, y = ((e.clientY - r.top) / r.height) * cv.height;
        let best = null, bd = 40;
        for (const [px, py, id] of this.mapaPuntos || []) { const d = Math.hypot(px - x, py - y); if (d < bd) { bd = d; best = id; } }
        if (best) { this.guiar(this.st.guia === best ? null : best); this.panel('mapa', true); }
      });
    }
    this._dock();
    this.registrar('panel', tipo);
    this.cambio();
  }

  cerrarPanel() {
    this.panelAbierto = null;
    this.mapaCanvas = null;
    this.el.panel.hidden = true;
    this._dock();
  }

  _accion(a) {
    const [k, v] = a.split(':');
    const st = this.st;
    if (k === 'cerrar') return this.cerrarPanel();
    if (k === 'panel') return this.panel(v, true);
    if (k === 'guiar') { this.guiar(st.guia === v ? null : v); return this.panel('hoy', true); }
    if (k === 'dest') { const e = st.proceso.find((q) => q.id === v); e.dest = !e.dest; if (e.dest) e.visible = true; this.registrar('destacar', v); return this.panel('proceso', true); }
    if (k === 'vis') { const e = st.proceso.find((q) => q.id === v); e.visible = !e.visible; if (!e.visible) e.dest = false; this.registrar('visibilidad', v); return this.panel('proceso', true); }
    if (k === 'ver-docente') return this.panel('docente', true);
    if (k === 'item') { this.comp.item = v; return this.panel('compartir', true); }
    if (k === 'destino') { this.comp.destino = v; return this.panel('compartir', true); }
    if (k === 'enviar') return this.enviar();
    if (k === 'escala') return this.setAjuste('escala', parseFloat(v));
    if (k === 'proy') { const [que, arg] = v.split('|'); return this.proyHacer(que, arg); }
    if (k === 'mirar') { this.setMirada(v === '1'); return this.panel('ajustes', true); }
    if (k === 'vozt') { if (this.voz) this.voz.hablaTutor = v === '1'; this.registrar('ajuste', `vozTutor=${v}`); return this.panel('ajustes', true); }
    if (k === 'mirada') { this.ojos.tiempo = parseFloat(v); this.registrar('ajuste', `mirada=${v}`); return this.panel('ajustes', true); }
    if (k === 'aj') return this.setAjuste(v, !this.aj[v]);
    if (k === 'priv') { this.aj.visibilidad = v; this.registrar('privacidad', v); this.aviso({ todo: 'Tus compañeros ven tu nombre y lo que estás haciendo.', nombre: 'Tus compañeros solo ven tu nombre.', nada: 'No aparecés en la capa social de tus compañeros.' }[v], 'Privacidad', true); return this.panel('ajustes', true); }
    if (k === 'gafas') { this.cerrarPanel(); return this.quitarGafas(); }
    if (k === 'ayuda') { this.pedirAyuda(v); return this.panel('grupo', true); }
    if (k === 'saludo') {
      this.aviso(`Saludaste a ${v}.`, 'Grupo', true);
      setTimeout(() => this.aviso({ Tomi: `¡Hola${this._coma()}!`, Ana: '👋', 'Prof. Sosa': `Buen día${this._coma()}.` }[v] || '¡Hola!', v), 2200);
      this.registrar('saludo', v);
      return this.panel('grupo', true);
    }
    if (k === 'pausar') { st.seg = 'pausado'; this._estadoSeg(); this.aviso('Tu docente ve «pausado».', 'Seguimiento', true); this.registrar('pausar'); return this.panel('seguimiento', true); }
    if (k === 'reanudar') { st.seg = st.foco ? 'foco' : 'activo'; this._estadoSeg(); return this.panel('seguimiento', true); }
  }

  enviar() {
    const { item, destino } = this.comp;
    const st = this.st;
    const fichas = {
      oc: { grande: 'LA LUZ DEL ÓCULO', lineas: ['A LAS 12 CAE AL SUR DEL CENTRO', 'LA TIERRA GIRA · EL SOL QUEDA AL NORTE'] },
      graf: this.proyFicha() || { grande: 'PROYECTO', lineas: ['TU GRUPO · TOMI · ANA', ''] },
      e1: { grande: 'PERCHERO', lineas: ['FOTO DEL STOCK POR TALLE', 'TOMADA A LAS 09:08'] },
    };
    if (!fichas[item]) {
      const e = st.proceso.find((q) => q.id === item);
      fichas[item] = { grande: 'CAPTURA DESDE LAS GAFAS', lineas: [(e ? e.txt : 'Captura').toUpperCase(), `TOMADA A LAS ${e ? e.hora : ''}`] };
    }
    if (destino === 'pizarron') {
      this.S.compartido = { ...fichas[item], t: this.t, hora: hhmm(st.minuto) };
      this.proponer('Listo: ya está en el pizarrón. Lo ven las 6 gafas de la zona.');
    } else if (destino === 'piso') {
      this.aviso('Se proyecta en el piso de la zona 04.', 'Enviado a la proyección', true);
    } else if (destino === 'santi') {
      st.ensenoSanti = true;
      this.aviso('Santi lo recibió.', 'Enviado', true);
      setTimeout(() => this.aviso(item === 'oc' ? `¡Ahh, por eso a la tarde nos da el sol en las gradas! Gracias${this._coma()}.` : `¡Gracias${this._coma()}!`, 'Santi'), 2600);
    } else {
      this.aviso('Tomi lo recibió.', 'Enviado', true);
      setTimeout(() => this.aviso('¡Buenísimo! Lo sumo a la presentación.', 'Tomi'), 2600);
    }
    st.compartido = destino;
    st.compartidoItem = item;
    this.registrar('compartir', `${item}→${destino}`);
    this.comp = { item: null, destino: null };
    this.cerrarPanel();
    this.cambio();
  }

  // nombre del participante (opcional): el test no usa un personaje
  setNombre(n) {
    this.nombre = (n || '').trim().slice(0, 24);
    const q = document.getElementById('hud-quien');
    if (q) q.textContent = this.nombre ? `${this.nombre} · 4° B` : '4° B';
  }

  _coma() { return this.nombre ? `, ${this.nombre}` : ''; }

  get agenda() { return AGENDA; }

  // en el test de tareas el tutor es guionado: no se usa la IA real aunque haya clave
  get ia() { return !this.guionado && !!(this.cerebro && this.cerebro.activo); }
  pensando(on) { this.el.tutor.classList.toggle('pensando', !!on); }

  // mensaje de la docente (mundo libre): llega solo a cierta hora o lo dispara el moderador
  mensajeSosa() {
    this.st.evSosa = true;
    const txt = 'Antes de la presentación voy a mirar el proceso de tu grupo. ¿Me destacás la evidencia que quieras que vea primero?';
    this.aviso(txt, 'Prof. Sosa');
    if (this.ia) this.cerebro.anotar(`Prof. Sosa le mandó este mensaje: «${txt}»`);
  }

  setMirada(on) {
    this.ojos.habilitada = on;
    this.ojos.setActiva(on && this.visible && this.puestas);
    this.registrar('ajuste', `mirada=${on ? 1 : 0}`);
  }

  // con cámara, las gafas de utilería mandan: ponérselas muestra la interfaz y sacárselas la saca
  setCamara(on) {
    this.camaraActiva = on;
    const b = document.getElementById('poner-gafas');
    const t = document.getElementById('sin-gafas-txt');
    if (b) b.hidden = on;
    if (t) t.textContent = on ? 'Ponete las gafas para ver su interfaz.' : 'Ves la escuela como es: sin ruta, sin tutor, sin capa social.';
  }

  // pedirle ayuda a un compañero: las gafas respetan a quien está en foco
  pedirAyuda(n) {
    const st = this.st, p = this._quien(n);
    st.pedidos.push(n);
    this.registrar('ayuda', n);
    const entrega = this._proyEntrega(n);
    if (p && p.o.foco) {
      // las gafas respetan a quien está concentrado: el pedido espera
      this.aviso(`${n} está en foco: tu pedido le llega cuando termine.`, 'Grupo', true);
      setTimeout(() => { this.aviso(entrega ? entrega.resp : 'Termino esto y te ayudo, ¿en 15 minutos?', n); if (entrega) setTimeout(entrega.dar, 600); }, 7000);
      return this.cambio();
    }
    const resp = { Tomi: '¡Voy! ¿Qué necesitás?', 'Prof. Sosa': 'Ahora estoy con otro grupo. Probá primero con tu grupo.', Juli: 'Uy, estoy con otro proyecto. ¿Probaste con Tomi?' };
    this.aviso(`Le pediste ayuda a ${n}.`, 'Grupo', true);
    if (n === 'Tomi') { st.ayudaDe = 'Tomi'; st.tomiAvisado = true; }
    setTimeout(() => { this.aviso(entrega ? entrega.resp : resp[n] || '¡Dale!', n); if (entrega) setTimeout(entrega.dar, 600); }, 2200);
    this.cambio();
  }

  // Santi le escribe a Lu (tarea social)
  preguntaSanti() {
    const st = this.st;
    st.santiPregunta = true;
    this.registrar('santi', 'pregunta');
    if (this.ia) {
      const txt = '¿Viste la luz del techo del hall? Se mueve por las gradas. ¿Vos sabés por qué?';
      this.aviso(txt, 'Santi');
      return this.cerebro.anotar(`Su compañero Santi le mandó este mensaje: «${txt}»`);
    }
    const tiene = st.proceso.find((e) => e.id === 'oc');
    this.proponer('Santi te escribe: «¿Qué descubriste de la luz del techo? La vi moverse por las gradas»', tiene ? [
      ['Mandarle lo que guardé', () => { this.comp = { item: 'oc', destino: 'santi' }; this.enviar(); }],
      ['Elegir qué mandar', () => { this.comp = { item: null, destino: 'santi' }; this.panel('compartir', true); }],
    ] : [['Responder', () => { this.comp = { item: null, destino: 'santi' }; this.panel('compartir', true); }]]);
  }

  registrar(tipo, dato = '') { this.emit('registro', { tipo, dato, t: performance.now() }); }

  // ── capa del mundo ───────────────────────────────────────
  _anclas() {
    const st = () => this.st;
    this.anclas = [
      { id: 'pizarron', tipo: 'objeto', pos: [-4.0, 4.55, -25.5], zona: 'proyeccion', max: 24, tit: 'Pizarrón · zona 04', det: () => (st().local ? 'Modo local · sigue funcionando' : '6 gafas conectadas · proyecto de stock'), acc: [['Enviar algo', () => { this.comp.destino = 'pizarron'; this.panel('compartir', true); }]] },
      { id: 'mesa', tipo: 'objeto', pos: [-12, 1.05, 3.33], zona: 'taller', max: 7, tit: 'Tu mesa · proyecto', det: () => (this.proyDef() ? `${this.proyDef().nombre} · avance ${this.proyAvance()} de ${this.proyTotal()}` : 'Todavía no elegiste proyecto'), acc: [['Abrir el proyecto', () => this.panel('proyecto', true)]] },
      { id: 'holo', tipo: 'objeto', pos: [-2.5, 1.7, -17], zona: 'proyeccion', max: 16, tit: 'Proyección · stock por talle', det: () => 'La ven las 6 gafas de la zona' },
      { id: 'nodo', tipo: 'objeto', pos: [11.4, 3.05, -18], zona: 'nodo', max: 13, tit: 'Nodo 014 · servidor local', det: () => (st().local ? 'Sin internet externa · el tutor sigue funcionando acá' : 'En línea · 31 gafas · el tutor vive en este servidor'), acc: [['Ver conexión', () => this.panel('conexion', true)]] },
      { id: 'oculo', tipo: 'curiosidad', pos: [0, 8.6, 0], zona: 'hall', max: 14, tit: 'Óculo', det: () => 'Mide 5,2 m y es la única ventana del techo del hall. Por acá entra la mancha de sol que se mueve por el piso.' },
      { id: 'sol', tipo: 'objeto', pos: [7.2, 0.6, -2.6], zona: 'hall', max: 16, tit: 'Luz del óculo · ahora', det: () => (st().oculoResuelto ? 'A las 12 va a estar cerca del centro, corrida al sur' : '¿Dónde va a estar al mediodía?'), acc: [['Preguntarle al tutor', () => (this.ia ? this.cerebro.decirle('Quiero saber más sobre esta luz que entra por el óculo.') : this.oculo.empezar())]] },
      { id: 'antena', tipo: 'curiosidad', pos: [15.5, 19.4, 3.2], zona: 'plaza', max: 45, tit: 'Antena del nodo', det: () => 'Conecta la escuela con la red del barrio. Si se corta, el nodo sigue funcionando adentro.' },
      { id: 'fachada', tipo: 'curiosidad', pos: [-12, 7.2, 8.9], zona: 'plaza', max: 30, tit: 'Parasoles modulares', det: () => 'La grilla blanca frena el sol de la tarde: adentro hace hasta 4 °C menos.' },
      { id: 'gradas', tipo: 'curiosidad', pos: [-6.6, 1.9, -4.2], zona: 'hall', max: 12, tit: 'Gradas', det: () => 'El hall también es aula: acá se hacen las charlas de los viernes.' },
      { id: 'maceta', tipo: 'curiosidad', pos: [5.7, 2.3, 5.9], zona: 'hall', max: 10, tit: 'Salvia', det: () => 'El nodo la riega cuando el sensor de humedad lo pide. ¿Cuánta agua por semana?' },
      { id: 'racks', tipo: 'curiosidad', pos: [17.75, 2.45, -16.2], zona: 'nodo', max: 14, tit: 'Servidores', det: () => 'Tus datos no salen del edificio: el proceso se guarda acá.' },
    ];
    for (const a of this.anclas) {
      if (a.tipo === 'curiosidad' && !a.acc) a.acc = [['Guardar en mi proceso', () => this._guardarCuriosidad(a)]];
    }
    for (const p of this.vida.gente) {
      if (!p.o.nombre) continue;
      const n = p.o.nombre;
      const acc = ['Tomi', 'Ana', 'Juli', 'Prof. Sosa'].includes(n) ? [['Pedir ayuda', () => this.pedirAyuda(n)]] : null;
      this.anclas.push({ id: 'p-' + n, tipo: 'persona', persona: p, max: 13, tit: n, acc, accBase: acc, det: () => p.o.detalle || '', estado: () => (n === 'Tomi' && this.st.tomiAvisado ? 'Viene a ayudarte' : p.o.estado) });
    }
    for (const a of this.anclas) this._crearAncla(a);
  }

  _crearAncla(a) {
    const d = document.createElement('div');
    d.className = `ancla ${a.tipo}`;
    d.innerHTML = `<i class="pt"></i><div class="cu"><b>${esc(a.tit)}</b><div class="det"></div><div class="acc"></div>${a.tipo === 'persona' ? '<div class="subt"></div>' : ''}</div>`;
    d.addEventListener('pointerenter', () => { a.hover = true; });
    d.addEventListener('pointerleave', () => { a.hover = false; });
    d.addEventListener('click', () => { a.fija = 5; this.registrar('mirar', a.id); });
    d.style.display = 'none';
    this.el.anclas.appendChild(d);
    a.el = d;
    a.v = new THREE.Vector3();
    this._pintarAcc(a);
  }

  _pintarAcc(a) {
    const caja = a.el.querySelector('.acc');
    caja.innerHTML = '';
    (a.acc || []).forEach(([t, fn]) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'btn';
      b.textContent = t;
      b.addEventListener('click', (e) => { e.stopPropagation(); this.registrar('ancla', a.id); fn(); });
      caja.appendChild(b);
    });
  }

  _guardarCuriosidad(a) {
    const id = 'q-' + a.id;
    if (this.st.proceso.find((e) => e.id === id)) return this.aviso('Ya está en tu proceso.', a.tit, true);
    this.st.proceso.push({ id, hora: hhmm(this.st.minuto), txt: `Curiosidad: ${a.tit.toLowerCase()}`, visible: false, dest: false, tag: 'Curiosidad' });
    this.aviso('Guardada en tu proceso (privada).', a.tit, true);
    this.cambio();
  }

  _bind() {
    this.el.panel.addEventListener('click', (e) => {
      const b = e.target.closest('[data-a]');
      if (b) this._accion(b.dataset.a);
    });
    this.el.dock.addEventListener('click', (e) => {
      const b = e.target.closest('[data-acc]');
      if (b) this.dock(b.dataset.acc);
    });
    this.el.hoy.addEventListener('click', () => this.panel('hoy'));
    this.el.conexion.addEventListener('click', () => this.panel('conexion'));
    this.el.seguimiento.addEventListener('click', () => this.panel('seguimiento'));
    this.el.tutor.querySelector('[data-cerrar-tutor]').addEventListener('click', () => this.cerrarTutor());
    this.el.tutorYo.addEventListener('click', () => { if (!this.tutorAbierto) this.abrirTutor(); });
    this.el.tutorMenu.addEventListener('click', () => this.dock('menu'));
    this.el.lanzador.querySelector('[data-cerrar-lanzador]').addEventListener('click', () => this.cerrarLanzador());
    document.getElementById('poner-gafas').addEventListener('click', () => this.ponerGafas());
    this.el.gafasBtn.addEventListener('click', () => this.toggleGafas());
    window.addEventListener('keydown', (e) => {
      if (!this.visible || e.repeat || (e.target && /input|textarea/i.test(e.target.tagName))) return;
      if (e.code === 'KeyG') { this.toggleGafas(); e.preventDefault(); return; }
      // moderador: situaciones a demanda
      if (e.code === 'F2') { e.preventDefault(); return this.preguntaSanti(); }
      if (e.code === 'F3') { e.preventDefault(); return this.mensajeSosa(); }
      if (e.code === 'F4') { e.preventDefault(); return this.setLocal(!this.st.local); }
      if (!this.puestas) return;
      if (e.code === 'Space') {
        if (this.voz && this.voz.modo) return; // la barra es para hablar
        e.preventDefault();
        if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
        this.dock('menu');
        return;
      }
      const m = TECLAS[e.code];
      if (m) { this.dock(m); e.preventDefault(); }
      if (e.code === 'Escape') { this.cerrarPanel(); this.cerrarTutor(); this.cerrarLanzador(); }
      if (e.code === 'KeyE' && this.mirada) {
        const a = this.mirada;
        this.registrar('pellizcar', a.id);
        if (a.acc && a.acc[0]) a.acc[0][1](); else a.fija = 5;
      }
    });
  }

  dock(acc) {
    if (acc === 'gafas') return this.toggleGafas();
    if (!this.st.conectada || !this.puestas) return;
    this.registrar('dock', acc);
    if (acc !== 'menu') this.cerrarLanzador();
    if (this._sugAcc === acc) this.el.sugerencia.hidden = true;
    if (acc === 'menu') return this.el.lanzador.hidden ? this.abrirLanzador() : this.cerrarLanzador();
    if (acc === 'explorar') return this.setExplorar(!this.st.explorar);
    if (acc === 'subtitulos') return this.setAjuste('subtitulos', !this.aj.subtitulos);
    if (acc === 'capturar') return this.capturar();
    if (acc === 'hoy') return this.panel('hoy');
    if (acc === 'tutor') return this.tutorAbierto ? this.cerrarTutor() : this.abrirTutor();
    if (acc === 'foco') return this.setFoco(!this.st.foco);
    return this.panel(acc);
  }

  _dock() {
    const on = (a) => (a === 'tutor' && this.tutorAbierto) || (a === 'foco' && this.st.foco) || (a === 'explorar' && this.st.explorar) || (a === 'subtitulos' && this.aj.subtitulos) || (a === 'menu' && !this.el.lanzador.hidden) || this.panelAbierto === a || (a === 'proceso' && this.panelAbierto === 'docente');
    this.el.dock.querySelectorAll('button').forEach((b) => b.classList.toggle('on', on(b.dataset.acc)));
    if (this.el.tutorMenu) this.el.tutorMenu.classList.toggle('on', !this.el.lanzador.hidden);
    this.el.lanzador.querySelectorAll('.fn').forEach((b) => {
      const a = b.dataset.acc;
      b.classList.toggle('on', on(a));
      const est = b.querySelector('.estado');
      const txt = a === 'foco' && this.st.foco ? 'Activado' : a === 'explorar' && this.st.explorar ? 'Activado' : a === 'subtitulos' && this.aj.subtitulos ? 'Activados' : '';
      if (est.textContent !== txt) est.textContent = txt;
    });
  }

  _armarDock() {
    const d = this.el.dock;
    d.innerHTML = '';
    for (const [id, nom, tecla] of [['tutor', 'Tutor', 'T'], ['foco', 'Foco', 'F'], ['menu', 'Menú', 'Espacio']]) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'vidrio';
      b.dataset.acc = id;
      b.innerHTML = `${ICONOS[id]}${nom} <kbd>${tecla}</kbd>`;
      d.appendChild(b);
    }
  }

  _armarLanzador() {
    const g = this.el.lanzador.querySelector('.grilla');
    g.innerHTML = '';
    for (const [id, nom, tecla, desc] of FUNCIONES) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'fn';
      b.dataset.acc = id;
      b.innerHTML = `${ICONOS[id]}<b>${esc(nom)}</b><small>${esc(desc)}</small><span class="estado"></span><kbd>${tecla}</kbd>`;
      b.addEventListener('click', () => this.dock(id));
      g.appendChild(b);
    }
  }

  abrirLanzador() {
    this.cerrarPanel();
    if (this.tutorAbierto) this.cerrarTutor();
    this.el.lanzador.hidden = false;
    this.el.sugerencia.hidden = true;
    this._dock();
    this.registrar('menu', 'abrir');
  }

  cerrarLanzador() {
    if (!this.el.lanzador) return;
    this.el.lanzador.hidden = true;
    if (this.el.dock) this._dock();
  }

  // ── gafas puestas / sacadas ──────────────────────────────
  toggleGafas() { return this.puestas ? this.quitarGafas() : this.ponerGafas(); }

  quitarGafas() {
    if (!this.puestas || !this.visible) return;
    this.puestas = false;
    this.registrar('gafas', 'sacar');
    this.cerrarPanel(); this.cerrarTutor(true); this.cerrarLanzador();
    this.ojos.setActiva(false);
    this.el.sugerencia.hidden = true;
    if (this.voz && this.voz._callarTutor) this.voz._callarTutor();
    this.el.hud.classList.add('quitadas');
    // cancela cualquier puesta a medias (si no, el HUD reaparecería sin gafas)
    this._gafasTok = (this._gafasTok || 0) + 1;
    this._poniendo = false;
    clearTimeout(this._tGafas); clearTimeout(this._tGafas2);
    this.el.arranque.hidden = true;
    const L = this.el.lentes;
    L.classList.remove('poniendo'); void L.offsetWidth; L.classList.add('quitando');
    this._tGafas = setTimeout(() => { L.classList.remove('quitando'); if (!this.puestas && this.visible) this.el.sinGafas.hidden = false; }, 1000);
    this.el.gafasBtn.textContent = 'Ponerme las gafas · G';
    this._guiaVisible();
    this.cambio();
  }

  ponerGafas() {
    if (this.puestas || !this.visible) return;
    this.puestas = true;
    this.registrar('gafas', 'poner');
    this.el.sinGafas.hidden = true;
    const L = this.el.lentes;
    L.classList.remove('quitando'); void L.offsetWidth; L.classList.add('poniendo');
    const tok = this._gafasTok = (this._gafasTok || 0) + 1;
    this._poniendo = true;
    clearTimeout(this._tGafas); clearTimeout(this._tGafas2);
    this.el.gafasBtn.textContent = 'Sacarme las gafas · G';
    this._tGafas = setTimeout(() => {
      if (tok !== this._gafasTok) return;
      L.classList.remove('poniendo');
      const a = this.el.arranque;
      const hola = `Hola${this._coma()}`;
      this.el.arranqueTxt.textContent = this.st.conectada ? (this.st.local ? `${hola} · modo local` : `${hola} · Nodo 014`) : `${hola} · buscando nodo`;
      a.hidden = false;
      this._tGafas2 = setTimeout(() => {
        if (tok !== this._gafasTok || !this.puestas) return;
        a.hidden = true;
        this._poniendo = false;
        this.el.hud.classList.remove('quitadas');
        this._guiaVisible();
        // propuestas de la sala que se perdieron mientras no tenía las gafas
        if (!this.nav.walk && this.nav.current) this._sugerirLugar(this.nav.current);
      }, 1100);
    }, 900);
    this.cambio();
  }

  _guiaVisible() {
    const v = this.visible && this.puestas && !this._poniendo;
    this.guia.on = v;
    this.nav.resaltar(v && this.st.guia ? this._proximo(this.nav.current, this.st.guia) : null);
    this.guia.mesh.visible = v && !!this.st.guia && this.guia.mesh.geometry.attributes.position !== undefined;
    this.guia.meta.visible = v && !!this.st.guia;
    if (v && this.st.guia) this.guia.rehacer();
    // capa digital compartida: el holograma de la zona de proyección solo se ve con las gafas
    // (en revisión, con this.visible en false, se sigue viendo el mundo completo)
    if (this.vida && this.vida.setAR) this.vida.setAR(!this.visible || this.puestas);
  }

  // ── explorar, subtítulos, ajustes ────────────────────────
  setExplorar(on) {
    this.st.explorar = on;
    this.ojos.el.classList.toggle('explorar', on);
    this.el.hud.classList.toggle('explorar', on);
    if (on) this.proponer('Explorar activado: mirá las cosas marcadas con + y te cuento qué son.');
    this._dock();
    this.registrar('explorar', on ? 'on' : 'off');
    this.cambio();
  }

  setAjuste(k, v) {
    this.aj[k] = v;
    if (k === 'escala') { document.documentElement.style.setProperty('--hud-zoom', v); this.el.hud.classList.toggle('texto-grande', v > 1); }
    if (k === 'subtitulos') this.aviso(v ? 'Vas a ver escrito lo que dicen las personas cerca tuyo.' : 'Subtítulos desactivados.', 'Subtítulos', true);
    if (k === 'sugerencias' && !v && this.propuesta && this.propuesta.lugar) { this.propuesta = null; this._reposo(); }
    this.registrar('ajuste', `${k}=${v}`);
    if (this.panelAbierto === 'ajustes') this.panel('ajustes', true);
    this._dock();
    this.cambio();
  }

  // ── sugerencias contextuales ─────────────────────────────
  proponerOculo(forzar = false) {
    if (this.ia || this.libre) return;
    if (this.st.oculoResuelto || this.oculo.activo) return;
    if (forzar) delete this.st.sugeridas.oculo;
    this.proponer('¿Viste la mancha de luz sobre el banco? Entra por el óculo del techo. ¿Adivinamos dónde va a estar al mediodía?', [['Dale', () => this.oculo.empezar()], ['Ahora no', null]], 'oculo', 'hall');
  }

  // propuestas del tutor según el lugar (se pueden apagar en Ajustes para probar si las funciones se descubren solas)
  _sugerirLugar(id) {
    const st = this.st;
    if (this.nav.current !== id || this.nav.walk) return; // ya se fue de ahí
    if (!this.aj.sugerencias || !this.puestas || !this.visible || !st.conectada || st.foco || this.soloClase) return;
    if (this.ia) { if (!st.sugeridas['ia-' + id]) { st.sugeridas['ia-' + id] = true; this.cerebro.evento(`Llegó a ${EN[id]} por primera vez hoy.`); } return; }
    const P = (txt, ops, clave) => this.proponer(txt, ops, clave, id);
    if (id === 'hall' && !st.oculoResuelto && !this.oculo.activo) this.proponerOculo();
    if (id === 'proyeccion') {
      if (st.minuto >= 10 * 60 + 35 && st.compartido !== 'pizarron') {
        P('Es la presentación de tu grupo. ¿Mostramos en el pizarrón el gráfico de stock que hicieron con Tomi y Ana?', [
          ['Mostrarlo', () => { this.comp = { item: 'graf', destino: 'pizarron' }; this.enviar(); }],
          ['Elegir otra cosa', () => { this.comp = { item: null, destino: 'pizarron' }; this.panel('compartir', true); }],
        ], 'pizarron');
      } else if (!this.aj.subtitulos) P('Están presentando stock por talle. ¿Te pongo subtítulos?', [['Sí', () => this.setAjuste('subtitulos', true)], ['No', null]], 'subtit');
    }
    if (id === 'rincon') P('Este rincón es tranquilo. ¿Activo el modo foco?', [['Activar foco', () => this.setFoco(true)], ['Ahora no', null]], 'rincon');
    if (id === 'nodo') P('Esta es la sala del nodo: acá funciono yo. ¿Querés verla por dentro?', [['Activar Explorar', () => this.setExplorar(true)], ['Ahora no', null]], 'nodo');
  }

  // ── capturar ─────────────────────────────────────────────
  capturar() {
    this.capturaPendiente = true;
    const f = this.el.flash;
    f.classList.remove('on'); void f.offsetWidth; f.classList.add('on');
  }

  recibirCaptura(url) {
    this.capturaPendiente = false;
    this.capturas++;
    const p = this.camera.position;
    const lugares = { plaza: 'Plaza', hall: 'Hall', taller: 'Aula-taller', proyeccion: 'Zona de proyección', rincon: 'Rincón tranquilo', nodo: 'Sala del nodo', pasillo: 'Pasillo del nodo' };
    const e = { id: 'k' + this.capturas, hora: hhmm(this.st.minuto), txt: `Captura · ${lugares[zona(p.x, p.z)] || 'Escuela'}`, visible: false, dest: false, tag: 'Captura', img: url };
    this.st.proceso.push(e);
    this.aviso('Guardada en tu proceso. Solo la ves vos hasta que decidas mostrarla.', 'Captura', true);
    this.registrar('captura', e.id);
    if (this.panelAbierto === 'proceso') this.panel('proceso', true);
    this.cambio();
  }

  dibujarMapa(cv) {
    const g = cv.getContext('2d'), W = cv.width, H = cv.height;
    const B = { x0: -24, x1: 24, z0: -28, z1: 29.5 };
    const k = Math.min(W / (B.x1 - B.x0), H / (B.z1 - B.z0));
    const ox = (W - (B.x1 - B.x0) * k) / 2, oz = (H - (B.z1 - B.z0) * k) / 2;
    const m = (x, z) => [ox + (x - B.x0) * k, oz + (z - B.z0) * k];
    g.clearRect(0, 0, W, H);
    const rect = (r, c) => { const [a, b] = m(r[0], r[2]), [c2, d] = m(r[1], r[3]); g.fillStyle = c; g.fillRect(Math.min(a, c2), Math.min(b, d), Math.max(1.5, Math.abs(c2 - a)), Math.max(1.5, Math.abs(d - b))); };
    rect([-22.2, 22.2, -26.2, 8.2], 'rgba(236,235,231,0.05)');
    this.world.plan.muros.forEach((r) => rect(r, 'rgba(236,235,231,0.75)'));
    this.world.plan.vidrios.forEach((r) => rect(r, 'rgba(160,190,210,0.7)'));
    if (this.st.guia && this.nav.current) {
      const pts = this.nav.route(this.nav.current, this.st.guia);
      g.strokeStyle = '#e8743b'; g.lineWidth = 2.5; g.setLineDash([5, 4]);
      g.beginPath(); pts.forEach(([x, z], i) => (i ? g.lineTo(...m(x, z)) : g.moveTo(...m(x, z)))); g.stroke(); g.setLineDash([]);
    }
    this.mapaPuntos = [];
    g.font = `500 ${Math.round(10 * (W / 340))}px ${getComputedStyle(document.documentElement).getPropertyValue('--mono')}`;
    const ET = { entrada: ['Entrada', 'd'], hall: ['Hall', 'd'], taller: ['Taller', 'b'], proyeccion: ['Proyección', 'd'], rincon: ['Rincón', 'b'], nodo: ['Nodo', 'd'] };
    const fs = Math.round(10 * (W / 340));
    for (const id of Object.keys(NOMBRE_PARADA)) {
      const st = this.nav.byId[id];
      const [x, y] = m(st.p[0], st.p[1]);
      const dest = this.st.guia === id, aca = this.nav.current === id && !this.nav.walk;
      g.beginPath(); g.arc(x, y, 8, 0, Math.PI * 2);
      g.fillStyle = dest ? '#e8743b' : 'rgba(11,12,14,0.92)'; g.fill();
      g.strokeStyle = dest || aca ? '#e8743b' : 'rgba(236,235,231,0.85)'; g.lineWidth = 2; g.stroke();
      const [nom, lado] = ET[id] || [NOMBRE_PARADA[id], 'd'];
      const txt = nom.toUpperCase(), tw = g.measureText(txt).width;
      const tx = lado === 'b' ? x - tw / 2 : x + 14, ty = lado === 'b' ? y + fs + 12 : y + fs * 0.36;
      g.fillStyle = 'rgba(11,12,14,0.78)'; g.fillRect(tx - 5, ty - fs * 0.9, tw + 10, fs * 1.3);
      g.fillStyle = dest ? '#e8743b' : 'rgba(236,235,231,0.95)';
      g.fillText(txt, tx, ty);
      this.mapaPuntos.push([x, y, id]);
    }
    g.textAlign = 'left';
    const cp = this.camera.position, [px, py] = m(cp.x, cp.z);
    const ang = -Math.PI / 2 - this.nav.yaw;
    const gr = g.createRadialGradient(px, py, 0, px, py, 34);
    gr.addColorStop(0, 'rgba(232,116,59,0.6)'); gr.addColorStop(1, 'rgba(232,116,59,0)');
    g.fillStyle = gr; g.beginPath(); g.moveTo(px, py); g.arc(px, py, 34, ang - 0.6, ang + 0.6); g.closePath(); g.fill();
    g.beginPath(); g.arc(px, py, 4.5, 0, Math.PI * 2); g.fillStyle = '#fff'; g.fill();
  }

  _quien(nombre) { return this.vida.gente.find((p) => p.o.nombre === nombre); }

  _conexionPill() {
    const c = this.el.conexion;
    c.className = 'vidrio' + (this.st.local ? ' local' : '');
    c.querySelector('span').textContent = this.st.local ? 'Modo local' : 'Nodo 014';
  }

  _estadoSeg() {
    const s = this.el.seguimiento;
    s.className = 'vidrio' + (this.st.seg === 'foco' ? ' foco' : this.st.seg === 'pausado' ? ' pausa' : '');
    s.querySelector('span').textContent = { activo: 'Seguimiento · activo', foco: 'Seguimiento · solo foco', pausado: 'Seguimiento · pausado' }[this.st.seg];
  }

  _focoAv() {
    const n = this.st.enEspera.length;
    this.el.focoAv.textContent = n ? `${n} aviso${n > 1 ? 's' : ''} en espera` : 'Avisos en silencio';
  }

  // el horario del día, siempre a la vista: lo que toca ahora, lo hecho y lo que sigue
  _hoyPill() {
    const st = this.st, m = st.minuto;
    const prox = this._prox(m);
    const txt = this.hoyFijo || `${prox.tit} · ${hhmm(prox.h)}`;
    if (this.el.hoyTxt.textContent !== txt) this.el.hoyTxt.textContent = txt;
    const L = AGENDA.filter((a) => a.dest);
    const firma = `${Math.floor(m)}|${prox.tit}|${st.claseHecha ? 1 : 0}|${this.hoyFijo || ''}|${L.map((a) => a.tit).join('/')}`;
    if (firma === this._firmaHorario) return;
    this._firmaHorario = firma;
    this.el.horario.innerHTML = L.map((a, i) => {
      const sig = L[i + 1];
      const ahora = a === prox;
      const paso = sig ? m >= sig.h : false;
      const hecha = a.clase ? !!st.claseHecha : !ahora && paso;
      const pend = a.clase && !st.claseHecha && !ahora && paso;
      const sub = !ahora ? '' : a.clase && this.hoyFijo ? `Ahora · ${this.hoyFijo}` : `${m < a.h ? 'Sigue' : 'Ahora'} · ${a.lugar}`;
      return `<li class="${ahora ? 'ahora' : hecha ? 'hecha' : pend ? 'pend' : ''}"><span class="h">${hhmm(a.h)}</span><span class="t">${esc(a.tit)}${sub ? `<small>${esc(sub)}</small>` : ''}</span></li>`;
    }).join('');
    // los avisos van debajo del horario
    const abajo = this.el.hoy.offsetTop + this.el.hoy.offsetHeight + 12;
    if (abajo > 80) this.el.avisos.style.top = `${abajo}px`;
  }

  setHora(min) { this.st.minuto = min; this._hoyPill(); }

  // ── cuadro a cuadro ──────────────────────────────────────
  update(dt, t) {
    this.t = t;
    if (!this.visible) return;
    const st = this.st;
    if (!this.puestas) {
      // sin gafas: el mundo sigue, pero no hay capa personal
      for (const a of this.anclas) if (a.on) { a.on = false; a.el.style.display = 'none'; }
      this.mirada = null;
      this.oculo.update(dt, t, false);
      if (!this.relojPausado) st.minuto += dt / 20;
      const u = this.acabado.uniforms.uFoco;
      u.value += (0 - u.value) * Math.min(1, dt * 3);
      return;
    }
    if (this.libre && st.conectada) {
      if (!st.evClase && st.minuto >= 9 * 60 + 30 && this.clase) { st.evClase = true; this.clase.ofrecer('hora'); }
    }
    // (por ahora el test es solo llegar y hacer la clase: el resto del día no corre)
    if (this.libre && st.conectada && !this.soloClase) {
      // si a las 10:05 no fue a la clase, el día sigue igual: arranca el taller (la clase queda pendiente, F8)
      if (!st.evProy && st.minuto >= 10 * 60 + 5 && !st.proy.id) { st.evProy = true; this._elegirProyecto('Son las 10:05 y la clase quedó sin hacer.', 'Ya son las 10. '); }
      if (!st.santiPregunta && st.minuto >= 10 * 60 + 8) this.preguntaSanti();
      if (!st.evSosa && st.minuto >= 10 * 60 + 22) this.mensajeSosa();
      if (!st.evPres && st.minuto >= 10 * 60 + 40) { st.evPres = true; this.aviso('En 5 minutos presenta tu grupo en la zona de proyección.', 'Horario'); if (this.ia) this.cerebro.evento('Faltan 5 minutos para la presentación de su grupo en la zona de proyección (10:45).'); }
    }
    this.ojos.setActiva(this.ojos.habilitada);
    this.ojos.update(dt);
    this.oculo.update(dt, t, true);
    // bienestar: recordatorio de pausa visual
    this.usoSeg += dt;
    if (this.aj.pausas && st.conectada && this.usoSeg > 240) { this.usoSeg = -120; this.aviso('Pausa visual: mirá algo lejano durante 20 segundos.', 'Bienestar'); }
    const pn = this.el.panel;
    if (!pn.hidden && (this._tMas = (this._tMas || 0) + dt) > 0.3 && !(this._tMas = 0)) pn.classList.toggle('mas', pn.scrollTop + pn.clientHeight < pn.scrollHeight - 4);
    if (this.mapaCanvas && (this._tMapa = (this._tMapa || 0) + dt) > 0.1) { this._tMapa = 0; this.dibujarMapa(this.mapaCanvas); }
    // las gafas se conectan al llegar a la puerta (no hace falta acertar el umbral exacto)
    if (!st.conectada && !this._poniendo) {
      const p = this.camera.position;
      if (zona(p.x, p.z) !== 'plaza' || (p.z < 8.8 && Math.abs(p.x) < 6)) this.conectar();
      else {
        this.buscando = (this.buscando || 0) + dt;
        if (this.buscando > 6 && !this.pistaDada) { this.pistaDada = true; this.aviso('Buscando nodo… Entrá a la escuela: las gafas se conectan en la puerta.', 'TUTOR', true); }
      }
    }
    // durante la clase el reloj de la escuela se detiene: la clase dura lo que tarde (ver tareas-ia.js)
    if (!this.relojPausado) st.minuto += dt / 20;
    this.el.hora.textContent = hhmm(st.minuto);
    if (st.foco) { st.focoSeg += dt; st.focoTotal += dt; this.el.focoT.textContent = mmss(st.focoSeg); this._focoAv(); }
    this._hoyPill();
    // efecto foco en la imagen
    const u = this.acabado.uniforms.uFoco;
    u.value += ((st.foco ? 1 : 0) - u.value) * Math.min(1, dt * 3);
    this.guia.update(t, !!this.nav.walk);

    // tutor: texto que se escribe y onda de voz
    if (this.tipeo) {
      this.tipeo.i += dt * 42;
      this.el.tutorTxt.textContent = this.tipeo.txt.slice(0, Math.floor(this.tipeo.i));
      if (this.tipeo.i >= this.tipeo.txt.length) { this.tipeo = null; this.el.opciones.classList.remove('esperando'); }
    }
    this.el.tutor.classList.toggle('hablando', !!this.tipeo);
    this._onda(t, !!this.tipeo);

    // anclas: proyectar, filtrar por zona y distancia, abrir la que se mira
    const cam = this.camera;
    const w = window.innerWidth, h = window.innerHeight;
    const cp = cam.position;
    const fwd = new THREE.Vector3();
    cam.getWorldDirection(fwd);
    const zLu = zona(cp.x, cp.z);
    const veo = VE[zLu] || [];
    let mejor = null, mejorD = 1e9;
    const tmp = new THREE.Vector3();
    const g = this.ojos.punto();
    for (const a of this.anclas) {
      let on = st.conectada && !this.nav.walk;
      if (a.tipo === 'persona') {
        a.persona.cabeza.getWorldPosition(a.v);
        a.v.y += 0.32;
        if (st.foco) on = false;
        if (on && !veo.includes(zona(a.v.x, a.v.z))) on = false;
      } else {
        a.v.set(a.pos[0], a.pos[1], a.pos[2]);
        if (on && !veo.includes(a.zona)) on = false;
        if (a.tipo === 'curiosidad' && (!st.explorar || st.foco)) on = false;
      }
      const dist = a.v.distanceTo(cp);
      if (on && dist > a.max) on = false;
      if (on && tmp.copy(a.v).sub(cp).dot(fwd) <= 0.3) on = false;
      let x = 0, y = 0;
      if (on) {
        tmp.copy(a.v).project(cam);
        x = ((tmp.x + 1) / 2) * w; y = ((1 - tmp.y) / 2) * h;
        if (x < -40 || x > w + 40 || y < 34 || y > h - 40) on = false;
      }
      a.on = on;
      a.el.style.display = on ? '' : 'none';
      if (!on) { a.fija = 0; continue; }
      a.el.style.transform = `translate(${x}px, ${y}px) translate(-4px, -100%)`;
      a.el.style.opacity = a.tipo === 'persona' ? String(Math.max(0.35, 1 - dist / a.max)) : '1';
      const dc = g ? Math.hypot(x - g.x, y - g.y) : 1e9; // lo que Lu mira con los ojos
      const radio = a.tipo === 'persona' ? 70 : 90;
      if (dc < radio && dc < mejorD) { mejorD = dc; mejor = a; }
      if (a.fija > 0) a.fija -= dt;
    }
    // si la mirada ya está sobre una etiqueta, esa manda (no se abre otra encima)
    const sobre = this.anclas.find((q) => q.on && q.hover);
    if (sobre) mejor = sobre;
    this.mirada = mejor;
    for (const a of this.anclas) {
      if (!a.on) continue;
      const abierta = a.hover || a.fija > 0 || a === mejor;
      if (abierta !== a.abierta) {
        a.abierta = abierta;
        a.el.classList.toggle('abierta', abierta);
      }
      // subtítulos anclados a quien habla
      if (a.tipo === 'persona') {
        const o = a.persona.o;
        let linea = '';
        if (this.aj.subtitulos && o.habla && a.v.distanceTo(cp) < 14) {
          const per = 6.2, u = t + (o.fase || 0) * 2.1 + o.nombre.length;
          if (o.privado) linea = 'Conversación privada · no se subtitula';
          else if (u % per < 4.4) linea = o.habla[Math.floor(u / per) % o.habla.length];
        }
        const habla = !!linea;
        if (habla !== a.habla) { a.habla = habla; a.el.classList.toggle('habla', habla); }
        if (habla) { const sb = a.el.querySelector('.subt'); if (sb.textContent !== linea) sb.textContent = linea; }
      }
      if (abierta) {
        const det = a.el.querySelector('.det');
        const html = a.tipo === 'persona'
          ? `<span class="estado ${a.persona.o.foco ? 'foco' : ''}">${esc(a.estado())}</span>${a.det() ? '<br>' + esc(a.det()) : ''}`
          : esc(a.det());
        if (det.innerHTML !== html) det.innerHTML = html;
      }
    }
    this.el.mira.classList.toggle('fija', !!mejor);
    this.el.miraEt.classList.toggle('on', !!(mejor && mejor.acc));
  }

  _onda(t, hablando) {
    const g = this.ondaCtx, W = 300, H = 44;
    g.clearRect(0, 0, W, H);
    const n = 46;
    for (let i = 0; i < n; i++) {
      const x = 2 + i * 6.4;
      const fade = 1 - i / n;
      const amp = hablando ? (0.35 + 0.65 * Math.abs(Math.sin(t * 9 + i * 0.7) * Math.sin(t * 3.3 + i * 0.23))) : 0.08 + 0.04 * Math.sin(t * 2 + i);
      const hh = Math.max(2, amp * H * 0.9 * (0.4 + 0.6 * fade));
      g.fillStyle = `rgba(236,235,231,${0.25 + 0.75 * fade})`;
      g.fillRect(x, (H - hh) / 2, 2.4, hh);
    }
  }
}

instalarProyectos(HUD);
