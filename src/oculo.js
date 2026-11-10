// Ejercicio "La luz del óculo": aprender de lo que Lu ve en la escuela.
// La mancha de sol que entra por el óculo del hall se mueve durante el día.
// Lu predice con la mirada dónde va a caer al mediodía, las gafas simulan el
// recorrido y el tutor pregunta por qué. Geometría solar real (≈33° S, noviembre).
import * as THREE from 'three';
import { zona } from './zonas.js';

const LAT = -33, DEC = -15.6; // latitud aproximada de una ciudad del centro del país; declinación a principios de noviembre
const ALTO = 10.4;            // altura efectiva del óculo (m)
const AHORA = 9.5;            // hora solar del sol del mundo (preset "mañana")
const R = Math.PI / 180;

// dirección hacia el sol a la hora h (mundo: norte = +Z, este = −X)
export function solDir(h) {
  const f = LAT * R, d = DEC * R, H = 15 * (h - 12) * R;
  const se = Math.sin(f) * Math.sin(d) + Math.cos(f) * Math.cos(d) * Math.cos(H);
  const el = Math.asin(se);
  let az = Math.acos(Math.max(-1, Math.min(1, (Math.sin(d) - se * Math.sin(f)) / (Math.cos(el) * Math.cos(f)))));
  if (H > 0) az = 2 * Math.PI - az;
  return { el, az, v: new THREE.Vector3(-Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el)) };
}

function alturaPiso(x, z) {
  if (z > -7.6 && z < -0.6 && x > -7.85 && x < -5.45) return x < -7.05 ? 1.35 : x < -6.25 ? 0.9 : 0.45; // gradas
  if (z > -7.2 && z < -1.2 && x > 6.85 && x < 7.85) return 0.45; // banco
  return 0;
}

// dónde cae el centro de la mancha a la hora h (null si cae en una pared)
export function manchaEn(h) {
  const s = solDir(h);
  if (s.v.y <= 0.05) return null;
  let x = 0, y = 0, z = 0;
  for (let i = 0; i < 5; i++) { const k = (ALTO - y) / s.v.y; x = -s.v.x * k; z = -s.v.z * k; y = alturaPiso(x, z); }
  if (Math.abs(x) > 7.7 || Math.abs(z) > 7.7) return null;
  return { p: new THREE.Vector3(x, y, z), el: s.el, v: s.v };
}

const LUGARES = [
  { k: 'A', txt: 'Justo debajo del óculo', p: [0, 0, 0], pin: 0.5 },
  { k: 'B', txt: 'Un poco hacia la proyección', p: [0, 0, -3.25], ok: true, pin: 1.85 },
  { k: 'C', txt: 'Sobre las gradas', p: [-6.0, 0.45, -5.4], pin: 1.3 },
];
const NOMBRE = { A: 'justo debajo del óculo', B: 'un poco hacia la proyección', C: 'sobre las gradas' };
const hora = (h) => `${Math.floor(h)}:${String(Math.round((h % 1) * 60) % 60).padStart(2, '0')}`;

export class Oculo {
  constructor({ hud, scene, camera }) {
    this.hud = hud; this.camera = camera;
    this.g = new THREE.Group();
    this.g.name = 'oculo-ar';
    scene.add(this.g);
    const naranja = (op) => new THREE.MeshBasicMaterial({ color: '#e8743b', transparent: true, opacity: op, depthWrite: false, toneMapped: false, polygonOffset: true, polygonOffsetFactor: -4 });
    const blanco = (op) => new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: op, depthWrite: false, toneMapped: false, polygonOffset: true, polygonOffsetFactor: -4 });
    const plano = (geo) => { geo.rotateX(-Math.PI / 2); return geo; };
    // la mancha simulada
    this.mancha = new THREE.Group();
    this.mancha.add(new THREE.Mesh(plano(new THREE.CircleGeometry(1.1, 48)), naranja(0.3)));
    this.mancha.add(new THREE.Mesh(plano(new THREE.RingGeometry(1.04, 1.1, 64)), naranja(0.95)));
    this.mancha.visible = false;
    this.g.add(this.mancha);
    // marcas del recorrido
    this.geoPunto = plano(new THREE.RingGeometry(0.16, 0.24, 32));
    this.matPunto = naranja(0.95);
    this.puntos = [];
    // lugares para predecir
    this.marcas = LUGARES.map((L) => {
      const m = new THREE.Mesh(plano(new THREE.RingGeometry(0.62, 0.7, 64)), blanco(0.9));
      m.position.set(L.p[0], L.p[1] + 0.03, L.p[2]);
      const linea = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, L.pin, 0)]), new THREE.LineBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.7, toneMapped: false }));
      m.add(linea);
      m.visible = false;
      this.g.add(m);
      return m;
    });
    // etiquetas en la capa de las gafas
    this.capa = document.createElement('div');
    this.capa.className = 'oculo-capa';
    document.getElementById('hud-anclas').appendChild(this.capa);
    this.botones = LUGARES.map((L, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'pred';
      b.dataset.dwell = '1.15';
      b.innerHTML = `<b>${L.k}</b>${L.txt}`;
      b.addEventListener('click', () => this.elegir(L.k));
      this.capa.appendChild(b);
      return { el: b, v: new THREE.Vector3(L.p[0], L.p[1] + L.pin + 0.05, L.p[2]), i };
    });
    this.etiquetas = [];
    this.etMancha = this._etiqueta('');
    this.reset();
  }

  _etiqueta(txt, clase = 'hora-sol') {
    const d = document.createElement('div');
    d.className = clase;
    d.textContent = txt;
    d.style.display = 'none';
    this.capa.appendChild(d);
    return d;
  }

  reset() {
    this.estado = 'inactivo';
    this.pred = null;
    this.ayudas = 0;
    this.simT = 0;
    this.verHasta = 0;
    this.mancha.visible = false;
    this.marcas.forEach((m) => { m.visible = false; m.material.color.set('#ffffff'); });
    this.botones.forEach((b) => { b.el.style.display = 'none'; b.el.classList.remove('elegida', 'correcta'); });
    this.puntos.forEach((p) => this.g.remove(p.m));
    this.etiquetas.forEach((e) => e.el.remove());
    this.puntos = []; this.etiquetas = [];
    this.etMancha.style.display = 'none';
    this.siguiente = 10;
  }

  get activo() { return this.estado !== 'inactivo' && this.estado !== 'hecho'; }

  // ── conversación ─────────────────────────────────────────
  empezar() {
    const h = this.hud;
    if (h.st.oculoResuelto) return h.decir('Ya lo resolviste: a las 12 la luz cae cerca del centro, corrida hacia el sur. Está en tu proceso.', [['Gracias', () => h.cerrarTutor()]]);
    if (this.estado === 'inactivo') { this.reset(); this.estado = 'predecir'; h.registrar('oculo', 'empezar'); }
    h.cola = (h.cola || []).filter((q) => q.clave !== 'oculo');
    if (this.estado !== 'predecir') return this._retomar();
    this.marcas.forEach((m) => (m.visible = true));
    this.botones.forEach((b) => (b.el.style.display = ''));
    this._pedir('Te marqué tres lugares en el piso, hacia la proyección. ¿Dónde va a caer la luz a las 12? Mirá uno y sostené la mirada.');
  }

  // pedido en la barra compacta, para que el piso quede a la vista
  _pedir(txt) {
    const h = this.hud;
    if (h.tutorAbierto) h.cerrarTutor(true);
    h.propuesta = null;
    h.proponer(txt, [['Dame una pista', () => this._pista()]]);
  }

  _retomar() {
    if (this.estado === 'preguntas') return this._q1();
    if (this.estado === 'q2') return this._q2();
  }

  // mundo libre: solo dibuja el recorrido; la conversación la lleva el tutor con IA
  simular() {
    this.reset();
    this.libre = true;
    this.estado = 'simulando';
    this.simT = 0;
  }

  _pista() {
    this.ayudas++;
    this.hud.registrar('oculo', 'pista');
    this.hud.decir('La luz siempre cae del lado contrario al sol. Ahora el sol está para el lado del taller y la entrada, por eso la luz cae del otro lado, en el banco. ¿Y dónde va a estar el sol a las 12?', [['Ok, elijo', () => this._pedir('Elegí con la mirada uno de los tres lugares del piso.')]]);
  }

  elegir(k) {
    if (this.estado !== 'predecir') return;
    const h = this.hud;
    this.pred = k;
    h.st.oculoPred = k;
    h.registrar('oculo', `prediccion:${k}`);
    this.botones.forEach((b) => b.el.classList.toggle('elegida', LUGARES[b.i].k === k));
    this.estado = 'simulando';
    this.simT = 0;
    if (h.tutorAbierto) h.cerrarTutor(true);
    h.propuesta = null;
    h.proponer(`Elegiste ${NOMBRE[k]}. Mirá el piso: te muestro qué hace la luz desde ahora hasta la tarde.`);
  }

  _resultado() {
    if (this.libre) { this.libre = false; this.estado = 'hecho'; this.verHasta = this.hud.t + 90; this.etMancha.style.display = 'none'; return; }
    const h = this.hud, k = this.pred;
    this.estado = 'preguntas';
    this.marcas.forEach((m, i) => m.material.color.set(LUGARES[i].ok ? '#e8743b' : '#ffffff'));
    this.botones.forEach((b) => b.el.classList.toggle('correcta', !!LUGARES[b.i].ok));
    const m12 = manchaEn(12);
    if (m12) this._colocar(m12);
    this.etMancha.textContent = '12:00';
    const txt = k === 'B'
      ? '¡Bien! A las 12 cae ahí: cerca del centro, pero corrida hacia el sur, hacia la proyección.'
      : k === 'A'
        ? 'Casi. A las 12 no cae justo debajo del óculo: cae un poco más al sur, hacia la proyección.'
        : 'A las gradas llega, pero a la tarde. A las 12 cae cerca del centro, un poco al sur.';
    h.st.oculoAcierto = k === 'B';
    h.decir(txt, [['¿Y por qué?', () => this._q1()]]);
  }

  _q1() {
    this.estado = 'preguntas';
    const h = this.hud;
    const bien = () => h.decir('Exacto. La Tierra gira y desde acá vemos al sol cruzar el cielo de este a oeste. La luz hace el camino al revés: del banco a las gradas.', [['Seguir', () => this._q2()]]);
    const mal = (t) => () => { this.ayudas++; h.decir(t, [['Seguir', () => this._q2()]]); };
    h.decir('Primero: ¿por qué la mancha de luz se mueve por el piso?', [
      ['La Tierra gira', bien],
      ['El sol gira alrededor de la Tierra', mal('Parece eso, pero es al revés: la Tierra gira sobre sí misma y por eso vemos moverse al sol, de este a oeste.')],
      ['Se mueve el techo', mal('El techo está quieto. Lo que se mueve es el sol en el cielo, porque la Tierra gira.')],
    ]);
  }

  _q2() {
    this.estado = 'q2';
    const h = this.hud;
    const fin = (t) => () => h.decir(t, [['Guardarlo', () => this._fin()]]);
    h.decir('Y al mediodía, ¿por qué no cae justo debajo del óculo?', [
      ['El sol no pasa justo por arriba', fin('Eso. Acá el sol del mediodía queda hacia el norte, nunca justo encima. Por eso la luz cae corrida hacia el sur.')],
      ['El óculo está torcido', () => { this.ayudas++; fin('El óculo está derecho. Pasa que acá el sol del mediodía queda hacia el norte, nunca justo encima: por eso la luz cae corrida al sur.')(); }],
    ]);
  }

  _fin() {
    const h = this.hud, st = h.st;
    this.estado = 'hecho';
    st.oculoResuelto = true;
    st.oculoAyudas = this.ayudas;
    st.proceso = st.proceso.filter((e) => e.id !== 'oc');
    const pistas = this.ayudas === 0 ? 'sin pistas' : this.ayudas === 1 ? 'con 1 pista' : `con ${this.ayudas} pistas`;
    st.proceso.push({ id: 'oc', hora: hora(st.minuto / 60), txt: `La luz del óculo: ${st.oculoAcierto ? 'acerté' : 'no acerté'} dónde cae a las 12 y entendí por qué (${pistas})`, visible: true, dest: false, tag: 'Nuevo' });
    this.marcas.forEach((m) => (m.visible = false));
    this.botones.forEach((b) => (b.el.style.display = 'none'));
    this.verHasta = this.hud.t + 25; // el recorrido queda un rato a la vista
    h.registrar('oculo', `fin:${this.ayudas}`);
    h.decir('Lo guardé en tu proceso con tu predicción. Si pasás por acá a las 12, lo vas a poder comprobar con tus propios ojos.', [['Genial', () => {
      h.cerrarTutor();
      h.proponer('En la escuela hay más cosas para descubrir. ¿Activo Explorar?', [['Activar Explorar', () => h.setExplorar(true)], ['Ahora no', null]], 'explorar', 'hall');
    }]]);
    h.cambio();
  }

  // ── capa visual ──────────────────────────────────────────
  _colocar(m) {
    this.mancha.visible = true;
    this.mancha.position.set(m.p.x, m.p.y + 0.03, m.p.z);
    this.mancha.rotation.y = Math.atan2(m.v.x, m.v.z);
    this.mancha.scale.set(1, 1, 1 / Math.sin(m.el));
    this.posMancha = m.p;
  }

  _marcarHora(hh) {
    const m = manchaEn(hh);
    if (!m) return;
    const p = new THREE.Mesh(this.geoPunto, this.matPunto);
    p.position.set(m.p.x, m.p.y + 0.035, m.p.z);
    this.g.add(p);
    this.puntos.push({ m: p });
    this.etiquetas.push({ el: this._etiqueta(`${hh} h`, 'hora-sol chica'), v: m.p.clone().setY(m.p.y + 0.05) });
  }

  update(dt, t, visible) {
    const enHall = zona(this.camera.position.x, this.camera.position.z) === 'hall';
    const mostrar = visible && enHall && (this.activo || t < this.verHasta);
    this.g.visible = mostrar;
    if (this.estado === 'simulando') {
      this.simT += dt / 6.5;
      const hh = AHORA + Math.min(1, this.simT) * (15 - AHORA);
      while (this.siguiente <= 14 && hh >= this.siguiente) { this._marcarHora(this.siguiente); this.siguiente++; }
      const m = manchaEn(hh);
      if (m) { this._colocar(m); this.etMancha.textContent = hora(hh); }
      if (this.simT >= 1 || !m) this._resultado();
    }
    // proyectar etiquetas
    const cam = this.camera, w = innerWidth, h = innerHeight, tmp = new THREE.Vector3(), fwd = new THREE.Vector3();
    cam.getWorldDirection(fwd);
    const poner = (el, v, on) => {
      if (on) {
        tmp.copy(v).sub(cam.position);
        if (tmp.dot(fwd) < 0.4) on = false;
      }
      if (on) {
        tmp.copy(v).project(cam);
        const x = ((tmp.x + 1) / 2) * w, y = ((1 - tmp.y) / 2) * h;
        if (x < -60 || x > w + 60 || y < 40 || y > h - 40) on = false;
        else el.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%)`;
      }
      el.style.display = on ? '' : 'none';
    };
    const pred = mostrar && (this.estado === 'predecir' || this.estado === 'simulando' || this.estado === 'preguntas' || this.estado === 'q2');
    this.botones.forEach((b) => poner(b.el, b.v, pred));
    this.etiquetas.forEach((e) => poner(e.el, e.v, mostrar));
    if (this.posMancha) poner(this.etMancha, tmp.copy(this.posMancha).setY(this.posMancha.y + 0.05).clone(), mostrar && this.mancha.visible && this.estado !== 'hecho');
    else this.etMancha.style.display = 'none';
  }
}
