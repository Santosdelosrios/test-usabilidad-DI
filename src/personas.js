import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { rng } from './textures.js';

// Personas estilizadas, sin rasgos (maqueta), con gafas TUTOR: banda grafito + punto naranja.
// Frente local = +Z. Izquierda de la figura = +X.

const r = rng(314);
const G = {};
function geos() {
  if (G.ok) return G;
  G.torso = new THREE.CapsuleGeometry(0.165, 0.22, 6, 14);
  G.pelvis = new THREE.CapsuleGeometry(0.15, 0.06, 4, 12);
  G.cabeza = new THREE.SphereGeometry(0.1, 18, 14);
  G.pelo = new THREE.SphereGeometry(0.106, 18, 10, 0, Math.PI * 2, 0, Math.PI * 0.55);
  G.cuello = new THREE.CapsuleGeometry(0.045, 0.05, 3, 8);
  G.brazo = new THREE.CapsuleGeometry(0.048, 0.19, 4, 10);
  G.ante = new THREE.CapsuleGeometry(0.042, 0.18, 4, 10);
  G.mano = new THREE.SphereGeometry(0.045, 10, 8);
  G.muslo = new THREE.CapsuleGeometry(0.075, 0.27, 4, 10);
  G.pierna = new THREE.CapsuleGeometry(0.058, 0.3, 4, 10);
  G.pie = new THREE.BoxGeometry(0.1, 0.06, 0.24);
  G.gafas = new THREE.BoxGeometry(0.17, 0.032, 0.014);
  G.patilla = new THREE.BoxGeometry(0.008, 0.012, 0.1);
  G.punto = new THREE.SphereGeometry(0.009, 8, 6);
  G.tableta = new THREE.BoxGeometry(0.2, 0.012, 0.28);
  G.sombra = new THREE.CircleGeometry(0.42, 24).rotateX(-Math.PI / 2);
  G.ok = true;
  return G;
}

let texSombra = null;
function matSombra() {
  if (!texSombra) {
    const c = document.createElement('canvas');
    c.width = c.height = 64;
    const g = c.getContext('2d');
    const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, 'rgba(0,0,0,0.55)');
    gr.addColorStop(0.55, 'rgba(0,0,0,0.25)');
    gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr;
    g.fillRect(0, 0, 64, 64);
    texSombra = new THREE.CanvasTexture(c);
  }
  return new THREE.MeshBasicMaterial({ map: texSombra, transparent: true, depthWrite: false, opacity: 0.55, toneMapped: false });
}

// Todas las personas se dibujan con un puñado de InstancedMesh (una llamada por parte del cuerpo).
export class Multitud {
  constructor() {
    this.partes = new Map();
    this.cuerpo = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.9 });
  }
  slot(geo, mat, parent) {
    const especial = !mat.userData.cuerpo;
    const key = geo.uuid + '|' + (especial ? mat.uuid : 'cuerpo');
    if (!this.partes.has(key)) this.partes.set(key, { geo, mat: especial ? mat : this.cuerpo, slots: [], color: !especial });
    const o = new THREE.Object3D();
    parent.add(o);
    this.partes.get(key).slots.push({ o, color: especial ? null : mat.color });
    return o;
  }
  construir(parent) {
    this.mallas = [];
    for (const p of this.partes.values()) {
      const im = new THREE.InstancedMesh(p.geo, p.mat, p.slots.length);
      im.frustumCulled = false;
      im.castShadow = false;
      im.receiveShadow = !p.mat.transparent;
      if (p.mat.transparent) im.renderOrder = 1;
      if (p.color) p.slots.forEach((s, i) => im.setColorAt(i, s.color));
      parent.add(im);
      this.mallas.push({ im, slots: p.slots });
    }
    this.actualizar();
  }
  actualizar() {
    for (const { im, slots } of this.mallas) {
      for (let i = 0; i < slots.length; i++) im.setMatrixAt(i, slots[i].o.matrixWorld);
      im.instanceMatrix.needsUpdate = true;
    }
  }
}

export function paletaPersonas() {
  const std = (c, rough = 0.95) => { const m = new THREE.MeshStandardMaterial({ color: c, roughness: rough }); m.userData.cuerpo = true; return m; };
  return {
    piel: ['#d9c3ad', '#c4a389', '#a07d63', '#7d5d47', '#5e4535'].map((c) => std(c, 0.8)),
    ropaArriba: ['#2f3237', '#cfd0d1', '#e6e4df', '#3d4046', '#a9a193', '#8e959c', '#1d1f23'].map((c) => std(c)),
    ropaAbajo: ['#26292d', '#3a3e44', '#5b636c', '#a9a193', '#1b1d20'].map((c) => std(c)),
    pelo: ['#1c1a19', '#2e2722', '#4a3a2e', '#6b5847', '#151515'].map((c) => std(c, 0.9)),
    calzado: [std('#f0efeb', 0.6), std('#1c1e21', 0.6)],
    gafas: new THREE.MeshPhysicalMaterial({ color: '#1b1d21', roughness: 0.25, metalness: 0.4, clearcoat: 1 }),
    punto: new THREE.MeshStandardMaterial({ color: '#e8743b', emissive: '#e8743b', emissiveIntensity: 4.5 }),
    tableta: new THREE.MeshStandardMaterial({ color: '#16181b', emissive: '#e8743b', emissiveIntensity: 0.12, roughness: 0.2, metalness: 0.3 }),
  };
}

const pick = (a) => a[Math.floor(r() * a.length)];
let MU = null; // multitud activa mientras se construyen las personas
const mesh = (g, m, parent, x = 0, y = 0, z = 0) => {
  const o = MU.slot(g, m, parent);
  o.position.set(x, y, z);
  return o;
};
const nodo = (parent, x = 0, y = 0, z = 0) => {
  const g = new THREE.Group();
  g.position.set(x, y, z);
  parent.add(g);
  return g;
};

// Ruido suave para miradas y gestos
const suave = (t, f, ph) => Math.sin(t * f + ph) * 0.6 + Math.sin(t * f * 2.31 + ph * 1.7) * 0.4;

export class Persona {
  /**
   * o.modo: 'parado' | 'sentado' | 'camina' | 'gesto' | 'charla' | 'toca' | 'lee'
   * o.p: [x, z]  o.piso: altura del piso  o.asiento: altura del asiento  o.mira: [x, z] o heading (rad)
   * o.ruta: [[x, z, pausa]...] (lazo)  o.vel: m/s  o.mesa: apoya los brazos  o.docente: sin gafas, con tableta
   */
  constructor(P, o, multitud) {
    const g = geos();
    MU = multitud;
    this.multitud = multitud;
    this.o = o;
    this.ph = r() * 100;
    const alto = o.alto ?? (o.docente ? 1.78 : 1.6 + r() * 0.12);
    const s = alto / 1.7;
    const piel = o.piel ?? pick(P.piel);
    const arriba = o.arriba ?? pick(P.ropaArriba);
    const abajo = o.abajo ?? pick(P.ropaAbajo);
    const mangaCorta = r() > 0.6;

    this.root = new THREE.Group();
    this.root.scale.setScalar(s);
    this.s = s;
    const pel = (this.pelvis = nodo(this.root, 0, 0.88, 0));
    mesh(g.pelvis, abajo, pel, 0, 0.0, 0).scale.set(1.05, 0.85, 0.75);
    const tor = (this.torso = nodo(pel, 0, 0.02, 0));
    mesh(g.torso, arriba, tor, 0, 0.29, 0).scale.set(1.05, 1, 0.72);
    const cab = (this.cabeza = nodo(tor, 0, 0.58, 0));
    mesh(g.cuello, piel, cab, 0, 0.03, 0);
    mesh(g.cabeza, piel, cab, 0, 0.15, 0.005).scale.set(0.9, 1.12, 1.0);
    if (r() > 0.15) {
      const mpelo = pick(P.pelo);
      const pe = mesh(g.pelo, mpelo, cab, 0, 0.165, -0.008);
      pe.scale.set(0.92, 1.12, 1.04);
      pe.rotation.x = -0.35;
      if (r() > 0.55) mesh(g.cuello, mpelo, cab, 0, 0.09, -0.07).scale.set(2.1, 1.6, 0.9); // pelo largo
    }
    if (!o.docente) {
      mesh(g.gafas, P.gafas, cab, 0, 0.16, 0.094);
      mesh(g.patilla, P.gafas, cab, 0.083, 0.165, 0.045);
      mesh(g.patilla, P.gafas, cab, -0.083, 0.165, 0.045);
      const pt = mesh(g.punto, P.punto, cab, 0.086, 0.168, 0.088);
      pt.castShadow = false;
    }
    // brazos (L = +x)
    this.brazo = {};
    for (const [lado, sx] of [['L', 1], ['R', -1]]) {
      const sh = nodo(tor, 0.2 * sx, 0.47, 0);
      mesh(g.brazo, arriba, sh, 0, -0.14, 0);
      const el = nodo(sh, 0, -0.285, 0);
      mesh(g.ante, mangaCorta ? piel : arriba, el, 0, -0.13, 0);
      mesh(g.mano, piel, el, 0, -0.27, 0.005);
      this.brazo[lado] = { sh, el };
    }
    if (o.docente) {
      const tb = mesh(g.tableta, P.tableta, this.brazo.R.el, 0.04, -0.27, 0.1);
      tb.rotation.set(0.25, 0.2, 0.1);
    }
    // piernas
    this.pierna = {};
    const calz = pick(P.calzado);
    for (const [lado, sx] of [['L', 1], ['R', -1]]) {
      const hip = nodo(pel, 0.09 * sx, -0.02, 0);
      mesh(g.muslo, abajo, hip, 0, -0.21, 0);
      const kn = nodo(hip, 0, -0.42, 0);
      mesh(g.pierna, abajo, kn, 0, -0.2, 0);
      mesh(g.pie, calz, kn, 0, -0.4, 0.05);
      this.pierna[lado] = { hip, kn };
    }
    // sombra de contacto (las personas no recalculan la sombra del sol)
    if (!P.sombra) P.sombra = matSombra();
    this.sombraPadre = new THREE.Group();
    this.sombra = MU.slot(g.sombra, P.sombra, this.sombraPadre);

    // ubicación inicial
    this.piso = o.pies ?? o.piso ?? 0.006;
    const [x, z] = o.p ?? (o.ruta ? o.ruta[0] : [0, 0]);
    this.root.position.set(x, this.piso, z);
    this.rumbo = typeof o.mira === 'number' ? o.mira : o.mira ? Math.atan2(o.mira[0] - x, o.mira[1] - z) : 0;
    this.root.rotation.y = this.rumbo;
    if (o.ruta) this._prepRuta(o.ruta);
  }

  agregar(parent) {
    parent.add(this.root);
    parent.add(this.sombraPadre);
    this._sombra();
    return this;
  }

  _sombra() {
    const p = this.root.position;
    const sentado = this.o.modo === 'sentado' || this.o.modo === 'lee';
    const fwd = sentado ? 0.22 * this.s : 0;
    this.sombra.position.set(p.x + Math.sin(this.rumbo) * fwd, this.piso + 0.012, p.z + Math.cos(this.rumbo) * fwd);
    this.sombra.scale.setScalar(sentado ? 1.15 : 0.95);
  }

  _prepRuta(ruta) {
    this.tramos = [];
    let acc = 0;
    for (let i = 0; i < ruta.length; i++) {
      const a = ruta[i], b = ruta[(i + 1) % ruta.length];
      const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
      this.tramos.push({ a, b, len, ini: acc, pausa: a[2] || 0 });
      acc += len;
    }
    this.largo = acc;
    this.idx = 0;
    this.enTramo = 0;
    this.pausa = this.tramos[0].pausa;
    this.paso = r() * 10;
  }

  update(t, dt) {
    const o = this.o, ph = this.ph;
    const P = this.pierna, B = this.brazo;
    // reposo por defecto
    let hipL = 0, hipR = 0, knL = 0, knR = 0;
    let shLx = 0.05, shRx = 0.05, shLz = 0.07, shRz = -0.07, elL = -0.12, elR = -0.12;
    let cabY = 0, cabX = 0, torX = 0.015 * Math.sin(t * 1.7 + ph), torY = 0;
    let pelY = 0.88, pelX = 0;

    if (o.modo === 'camina') {
      let moviendo = false;
      if (this.pausa > 0) {
        this.pausa -= dt;
      } else {
        const tr = this.tramos[this.idx];
        this.enTramo += (o.vel ?? 1.15) * dt;
        if (this.enTramo >= tr.len) {
          this.enTramo -= tr.len;
          this.idx = (this.idx + 1) % this.tramos.length;
          this.pausa = this.tramos[this.idx].pausa;
          if (this.tramos[this.idx].a[3] === 'salto') { this.idx = (this.idx + 1) % this.tramos.length; this.enTramo = 0; }
        }
        moviendo = this.pausa <= 0;
      }
      const tr = this.tramos[this.idx];
      const k = Math.min(1, this.enTramo / Math.max(tr.len, 1e-4));
      const x = tr.a[0] + (tr.b[0] - tr.a[0]) * k, z = tr.a[1] + (tr.b[1] - tr.a[1]) * k;
      this.root.position.x = x;
      this.root.position.z = z;
      const objetivo = Math.atan2(tr.b[0] - tr.a[0], tr.b[1] - tr.a[1]);
      let d = objetivo - this.rumbo;
      d = Math.atan2(Math.sin(d), Math.cos(d));
      this.rumbo += d * Math.min(1, dt * 6);
      this.root.rotation.y = this.rumbo;
      if (moviendo) {
        this.paso += ((o.vel ?? 1.15) * dt) / 0.62 * Math.PI;
        const sp = Math.sin(this.paso);
        hipL = -0.42 * sp; hipR = 0.42 * sp;
        knL = 0.6 * Math.max(0, Math.sin(this.paso + 1.2)); knR = 0.6 * Math.max(0, Math.sin(this.paso + 1.2 + Math.PI));
        shLx = 0.32 * sp; shRx = -0.32 * sp;
        elL = -0.25 - 0.15 * Math.max(0, sp); elR = -0.25 - 0.15 * Math.max(0, -sp);
        pelY = 0.88 - 0.02 + 0.025 * Math.abs(Math.cos(this.paso));
        torY = 0.06 * sp;
        cabY = 0.15 * suave(t, 0.3, ph);
      } else {
        cabY = 0.5 * suave(t, 0.4, ph);
        cabX = 0.15;
        if (o.docente) { shRx = -0.9; elR = -1.1; cabX = 0.45; }
      }
      if (o.docente && moviendo) { shRx = -0.35; elR = -1.2; }
    } else if (o.modo === 'sentado' || o.modo === 'lee') {
      const cad = (o.asiento ?? 0.46) + 0.07;
      const D = cad - this.piso, Ls = 0.455 * this.s;
      const phi = D < Ls ? Math.acos(D / Ls) : 0.12;
      pelY = D / this.s;
      hipL = hipR = -1.5;
      knL = 1.5 - phi + 0.04 * Math.sin(t * 0.7 + ph);
      knR = 1.5 - phi - 0.05 + 0.04 * Math.sin(t * 0.6 + ph + 1);
      torX = 0.08 + 0.015 * Math.sin(t * 1.5 + ph);
      if (o.mesa) {
        shLx = shRx = -0.75; elL = elR = -0.85;
        shLz = 0.18; shRz = -0.18;
        // escribe / toca la proyección
        elR += 0.12 * Math.max(0, Math.sin(t * 2.6 + ph));
        cabX = 0.38 + 0.08 * suave(t, 0.35, ph);
        cabY = 0.25 * suave(t, 0.22, ph);
      } else if (o.modo === 'lee') {
        shLx = shRx = -0.55; elL = elR = -1.35;
        shLz = 0.22; shRz = -0.22;
        cabX = 0.5;
        cabY = 0.06 * Math.sin(t * 0.3 + ph);
      } else {
        shLx = shRx = -0.35; elL = elR = -0.55;
        cabY = 0.45 * suave(t, 0.25, ph);
        cabX = 0.05 + 0.08 * Math.sin(t * 0.4 + ph);
        if (o.charla) { elR = -0.8 - 0.4 * Math.max(0, Math.sin(t * 2.1 + ph)); shRx = -0.55; }
      }
    } else if (o.modo === 'gesto') {
      // presenta: señala el holograma y mira al público
      const ciclo = (Math.sin(t * 0.55 + ph) + 1) / 2;
      shRx = -1.15 - 0.12 * Math.sin(t * 1.3); shRz = -0.25; elR = -0.2;
      shLx = -0.3; elL = -0.9 + 0.3 * Math.sin(t * 1.7);
      torY = -0.5 + 0.9 * ciclo;
      cabY = -0.4 + 1.1 * ciclo;
      pelX = 0.02 * Math.sin(t * 0.5);
    } else if (o.modo === 'charla') {
      cabY = 0.25 * suave(t, 0.5, ph);
      cabX = 0.05 * Math.sin(t * 2.4 + ph);
      const hab = Math.max(0, Math.sin(t * 0.9 + ph));
      elR = -0.5 - 0.9 * hab * (0.6 + 0.4 * Math.sin(t * 3.1));
      shRx = -0.3 * hab;
      elL = -0.15 - 0.4 * Math.max(0, Math.sin(t * 0.7 + ph + 2));
      pelX = 0.015 * Math.sin(t * 0.6 + ph);
    } else if (o.modo === 'toca') {
      // toca la patilla de las gafas
      const k = Math.max(0, Math.sin(t * 0.45 + ph));
      const subir = Math.min(1, k * 1.6);
      shRz = -0.25 - 0.95 * subir; shRx = -0.35 * subir; elR = -0.15 - 2.0 * subir;
      cabY = 0.3 * suave(t, 0.3, ph) * (1 - subir);
      cabX = -0.08 * subir;
    } else {
      // parado
      cabY = 0.55 * suave(t, 0.23, ph);
      cabX = 0.05 + 0.05 * Math.sin(t * 0.37 + ph);
      pelX = 0.018 * Math.sin(t * 0.5 + ph);
      if (o.mira && o.modo === 'parado' && o.manos === 'atras') { shLx = shRx = 0.2; elL = elR = -0.4; }
    }

    this.pelvis.position.y = pelY;
    this.pelvis.position.x = pelX;
    P.L.hip.rotation.x = hipL; P.R.hip.rotation.x = hipR;
    P.L.kn.rotation.x = knL; P.R.kn.rotation.x = knR;
    B.L.sh.rotation.x = shLx; B.R.sh.rotation.x = shRx;
    B.L.sh.rotation.z = shLz; B.R.sh.rotation.z = shRz;
    B.L.el.rotation.x = elL; B.R.el.rotation.x = elR;
    this.torso.rotation.x = torX;
    this.torso.rotation.y = torY;
    this.cabeza.rotation.y = cabY;
    this.cabeza.rotation.x = cabX;
    if (o.modo === 'camina') this._sombra();
  }
}

// Auto estilizado (eco del Vario / Tron): carrocería redondeada, cúpula oscura.
export function auto(color) {
  const g = new THREE.Group();
  const cuerpo = new THREE.MeshPhysicalMaterial({ color, roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.12, metalness: 0.1 });
  const vidrio = new THREE.MeshStandardMaterial({ color: '#15171a', roughness: 0.1, metalness: 0.5 });
  const rueda = new THREE.MeshStandardMaterial({ color: '#1e2023', roughness: 0.8 });
  const caja = (w, h, d, m, x, y, z, rad) => {
    const geo = new THREE.BoxGeometry(w, h, d, 1, 1, 1);
    const me = new THREE.Mesh(rad ? new RoundedBoxGeometry(w, h, d, 3, rad) : geo, m);
    me.position.set(x, y, z);
    g.add(me);
    return me;
  };
  caja(4.3, 0.75, 1.82, cuerpo, 0, 0.62, 0, 0.32);
  caja(2.3, 0.56, 1.6, vidrio, -0.25, 1.18, 0, 0.26);
  const ruedas = [];
  for (const [x, z] of [[1.35, 0.86], [-1.35, 0.86], [1.35, -0.86], [-1.35, -0.86]]) {
    const w = new THREE.Mesh(new THREE.CylinderGeometry(0.33, 0.33, 0.22, 20), rueda);
    w.rotation.x = Math.PI / 2;
    w.position.set(x, 0.33, z);
    g.add(w);
    ruedas.push(w);
  }
  const luz = new THREE.MeshStandardMaterial({ color: '#ffffff', emissive: '#ffffff', emissiveIntensity: 1.5 });
  caja(0.04, 0.06, 1.5, luz, 2.16, 0.72, 0);
  const tras = new THREE.MeshStandardMaterial({ color: '#7a1f12', emissive: '#c43a22', emissiveIntensity: 1.2 });
  caja(0.04, 0.06, 1.5, tras, -2.16, 0.74, 0);
  g.userData.ruedas = ruedas;
  return g;
}

