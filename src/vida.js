import * as THREE from 'three';
import { Persona, paletaPersonas, auto, Multitud } from './personas.js';
import { zona } from './zonas.js';
import { fuente, estiramiento } from './tipos.js';

const NARANJA = '#e8743b';
const TALLES = ['S', 'M', 'L', 'XL'];
// Datos del proyecto de Lu: stock y demanda por talle en el negocio familiar (semanas 12 a 14)
const SEMANAS = [
  { n: 12, stock: [14, 22, 17, 6], demanda: [11, 23, 18, 7] },
  { n: 13, stock: [13, 20, 16, 5], demanda: [12, 24, 19, 8] },
  { n: 14, stock: [15, 21, 14, 4], demanda: [12, 23, 20, 7] },
];
const MAX = 26;

function datos(t) {
  const per = 7;
  const k = (t / per) % SEMANAS.length;
  const i = Math.floor(k), j = (i + 1) % SEMANAS.length;
  let f = k - i;
  f = f < 0.8 ? 0 : (f - 0.8) / 0.2;
  f = f * f * (3 - 2 * f);
  const mix = (a, b) => a.map((v, q) => v + (b[q] - v) * f);
  const sem = f < 0.5 ? SEMANAS[i] : SEMANAS[j];
  return { stock: mix(SEMANAS[i].stock, SEMANAS[j].stock), demanda: mix(SEMANAS[i].demanda, SEMANAS[j].demanda), semana: sem.n };
}

function lienzo(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return { c, g: c.getContext('2d'), t };
}

function letras(g, txt, x, y, esp) {
  for (const ch of txt) { g.fillText(ch, x, y); x += g.measureText(ch).width + esp; }
  return x;
}
const ARCH = (px) => fuente('display', px);
const MONO = (px) => fuente('mono', px);
function estirar(g, v) { try { g.fontStretch = v === 'expanded' ? estiramiento('display') : 'normal'; } catch (e) { /* sin soporte */ } }
// achica la letra si el texto no entra en el ancho disponible (cada tipografía mide distinto)
function encajar(g, txt, px, maxW) {
  g.font = ARCH(px);
  const w = g.measureText(txt).width;
  if (w > maxW) g.font = ARCH(px * (maxW / w));
}

// ── Pizarrón inteligente: tablero del proyecto en vivo ─────
function dibujarPizarron(g, W, H, d, t, S = {}) {
  g.clearRect(0, 0, W, H);
  g.strokeStyle = 'rgba(208,210,214,0.05)';
  g.lineWidth = 1;
  for (let x = 0; x < W; x += 32) { g.beginPath(); g.moveTo(x + 0.5, 0); g.lineTo(x + 0.5, H); g.stroke(); }
  for (let y = 0; y < H; y += 32) { g.beginPath(); g.moveTo(0, y + 0.5); g.lineTo(W, y + 0.5); g.stroke(); }
  estirar(g, 'normal');
  g.font = MONO(13);
  g.fillStyle = 'rgba(208,210,214,0.7)';
  letras(g, 'PROYECTO · STOCK Y DEMANDA POR TALLE', 34, 42, 2.2);
  g.fillStyle = NARANJA;
  const pulso = 0.5 + 0.5 * Math.sin(t * 3);
  g.globalAlpha = 0.5 + 0.5 * pulso;
  g.beginPath(); g.arc(W - 214, 37, 5, 0, Math.PI * 2); g.fill();
  g.globalAlpha = 1;
  letras(g, S.modoLocal ? 'MODO LOCAL · NODO' : 'EN VIVO · 6 GAFAS', W - 200, 42, 2.2);

  // columna izquierda
  estirar(g, 'expanded');
  encajar(g, 'VS DEMANDA', 40, 400);
  g.fillStyle = '#ecebe7';
  g.fillText('STOCK', 34, 118);
  g.fillStyle = NARANJA;
  g.fillText('VS DEMANDA', 34, 164);
  estirar(g, 'normal');
  g.font = MONO(12);
  g.fillStyle = 'rgba(208,210,214,0.6)';
  letras(g, `SEMANA ${d.semana} · NEGOCIO DE ROPA DEL BARRIO`, 36, 196, 1.8);
  const falta = Math.round(d.demanda[3] - d.stock[3]);
  estirar(g, 'expanded');
  g.font = ARCH(92);
  g.fillStyle = NARANJA;
  g.fillText(falta > 0 ? `−${falta}` : '0', 30, 304);
  estirar(g, 'normal');
  g.font = MONO(12);
  g.fillStyle = 'rgba(236,235,231,0.85)';
  letras(g, 'XL · FALTAN PRENDAS', 36, 334, 1.8);
  g.fillStyle = 'rgba(208,210,214,0.5)';
  letras(g, 'SUGERENCIA DEL TUTOR: REPONER ANTES DEL VIERNES', 36, 356, 1.4);

  // gráfico de barras
  const x0 = 470, x1 = 990, yb = 318, alto = 230;
  g.strokeStyle = 'rgba(208,210,214,0.35)';
  g.beginPath(); g.moveTo(x0, yb + 0.5); g.lineTo(x1, yb + 0.5); g.stroke();
  const paso = (x1 - x0) / 4;
  for (let i = 0; i < 4; i++) {
    const cx = x0 + paso * (i + 0.5);
    const hs = (d.stock[i] / MAX) * alto, hd = (d.demanda[i] / MAX) * alto;
    g.fillStyle = 'rgba(223,231,239,0.88)';
    g.fillRect(cx - 40, yb - hs, 34, hs);
    g.strokeStyle = NARANJA;
    g.lineWidth = 2;
    g.strokeRect(cx + 6, yb - hd + 1, 34, hd - 1);
    g.lineWidth = 1;
    g.font = MONO(12);
    g.fillStyle = 'rgba(236,235,231,0.8)';
    g.fillText(String(Math.round(d.stock[i])), cx - 33, yb - hs - 8);
    g.fillStyle = NARANJA;
    g.fillText(String(Math.round(d.demanda[i])), cx + 13, yb - hd - 8);
    estirar(g, 'expanded');
    g.font = ARCH(20);
    g.fillStyle = i === 3 ? NARANJA : '#ecebe7';
    const w = g.measureText(TALLES[i]).width;
    g.fillText(TALLES[i], cx - w / 2, yb + 30);
    estirar(g, 'normal');
  }
  g.font = MONO(11);
  g.fillStyle = 'rgba(223,231,239,0.88)';
  g.fillRect(x0, 54, 10, 10);
  g.fillStyle = 'rgba(208,210,214,0.7)';
  letras(g, 'STOCK', x0 + 16, 63, 1.5);
  g.strokeStyle = NARANJA; g.lineWidth = 2;
  g.strokeRect(x0 + 82, 55, 9, 9);
  g.lineWidth = 1;
  letras(g, 'DEMANDA', x0 + 98, 63, 1.5);

  // línea de tiempo con "HOY" (como la interfaz del moodboard)
  const yt = 382;
  g.strokeStyle = 'rgba(208,210,214,0.3)';
  g.beginPath(); g.moveTo(34, yt + 0.5); g.lineTo(W - 34, yt + 0.5); g.stroke();
  const sem = ['S10', 'S11', 'S12', 'S13', 'S14', 'S15', 'S16'];
  g.font = MONO(10);
  sem.forEach((s, i) => {
    const x = 34 + ((W - 68) * i) / (sem.length - 1);
    g.fillStyle = 'rgba(208,210,214,0.45)';
    g.fillRect(x, yt - 4, 1, 8);
    g.fillText(s, x + 4, yt - 6);
  });
  const xh = 34 + ((W - 68) * (d.semana - 10)) / (sem.length - 1);
  g.fillStyle = NARANJA;
  g.fillRect(xh - 1, yt - 12, 2, 16);
  g.beginPath(); g.arc(xh, yt, 4 + pulso * 2, 0, Math.PI * 2); g.fill();
  letras(g, 'HOY', xh + 8, yt + 18, 1.5);

  // tarjeta que Lu manda desde sus gafas
  if (S.compartido) {
    const k = Math.min(1, (t - S.compartido.t) / 0.5);
    g.globalAlpha = k;
    g.fillStyle = 'rgba(11,12,14,0.92)';
    g.fillRect(452, 60, 548, 286);
    g.strokeStyle = NARANJA; g.lineWidth = 2;
    g.strokeRect(452, 60, 548, 286);
    g.lineWidth = 1;
    g.font = MONO(13);
    g.fillStyle = NARANJA;
    letras(g, 'COMPARTIDO DESDE LAS GAFAS', 478, 96, 2);
    estirar(g, 'expanded');
    encajar(g, S.compartido.grande, 46, 500);
    g.fillStyle = '#ecebe7';
    g.fillText(S.compartido.grande, 476, 170);
    estirar(g, 'normal');
    g.font = MONO(13);
    g.fillStyle = 'rgba(236,235,231,0.75)';
    S.compartido.lineas.forEach((l, i) => letras(g, l, 478, 214 + i * 24, 1.4));
    g.fillStyle = 'rgba(208,210,214,0.5)';
    letras(g, `${S.compartido.hora} · VISTO POR 6 GAFAS`, 478, 322, 1.6);
    g.globalAlpha = 1;
  }
}

// ── Proyección sobre la mesa de Lu ──────────────────────────
function fondoMesa(g, W, H) {
  g.clearRect(0, 0, W, H);
  g.fillStyle = 'rgba(18,20,24,0.9)';
  g.beginPath();
  g.roundRect ? g.roundRect(2, 2, W - 4, H - 4, 14) : g.rect(2, 2, W - 4, H - 4);
  g.fill();
}
function dibujarMesa(g, W, H, d, t) {
  fondoMesa(g, W, H);
  g.strokeStyle = 'rgba(236,235,231,0.55)';
  g.lineWidth = 1.5;
  g.strokeRect(6, 6, W - 12, H - 12);
  g.font = MONO(15);
  g.fillStyle = 'rgba(236,235,231,0.8)';
  letras(g, `TALLES · SEMANA ${d.semana}`, 22, 34, 2);
  const cw = (W - 44) / 4;
  for (let i = 0; i < 4; i++) {
    const x = 22 + i * cw;
    const xl = i === 3;
    g.strokeStyle = xl ? NARANJA : 'rgba(236,235,231,0.45)';
    g.lineWidth = xl ? 2.5 : 1.2;
    g.strokeRect(x + 4, 52, cw - 8, H - 76);
    estirar(g, 'expanded');
    g.font = ARCH(30);
    g.fillStyle = xl ? NARANJA : '#ecebe7';
    g.fillText(TALLES[i], x + 16, 96);
    estirar(g, 'normal');
    g.font = MONO(28);
    g.fillStyle = 'rgba(236,235,231,0.95)';
    g.fillText(String(Math.round(d.stock[i])), x + 16, 150);
    g.font = MONO(12);
    g.fillStyle = xl ? NARANJA : 'rgba(236,235,231,0.6)';
    g.fillText(xl ? `FALTAN ${Math.round(d.demanda[3] - d.stock[3])}` : 'EN STOCK', x + 16, 176);
    // mini barra
    const hb = (d.stock[i] / MAX) * 50;
    g.fillStyle = xl ? NARANJA : 'rgba(236,235,231,0.7)';
    g.fillRect(x + 16, H - 34 - hb, 10, hb);
  }
  // cursor del dedo de Lu
  const cx = 22 + 3 * cw + cw / 2 + Math.sin(t * 1.3) * 10;
  g.strokeStyle = 'rgba(236,235,231,0.8)';
  g.beginPath(); g.arc(cx, 120 + Math.cos(t * 1.1) * 6, 14 + 2 * Math.sin(t * 4), 0, Math.PI * 2); g.stroke();
}

// mesa del test de tareas: la materia de la clase, en vez del proyecto de talles
function dibujarMesaClase(g, W, H, t, clase) {
  const bio = clase === 'bio';
  fondoMesa(g, W, H);
  g.strokeStyle = 'rgba(236,235,231,0.55)';
  g.lineWidth = 1.5;
  g.strokeRect(6, 6, W - 12, H - 12);
  g.font = MONO(15);
  g.fillStyle = 'rgba(236,235,231,0.8)';
  letras(g, bio ? 'BIOLOGÍA · 4° B' : 'MATEMÁTICA · 4° B', 22, 34, 2);
  g.fillStyle = NARANJA;
  g.globalAlpha = 0.55 + 0.45 * Math.sin(t * 3);
  g.beginPath(); g.arc(W - 30, 29, 5, 0, Math.PI * 2); g.fill();
  g.globalAlpha = 1;
  estirar(g, 'expanded');
  encajar(g, bio ? 'EL CORAZÓN' : 'ECUACIONES', 54, W - 48);
  g.fillStyle = '#ecebe7';
  g.fillText(bio ? 'EL CORAZÓN' : 'ECUACIONES', 22, 112);
  estirar(g, 'normal');
  g.font = MONO(13);
  g.fillStyle = bio ? NARANJA : 'rgba(236,235,231,0.75)';
  letras(g, bio ? 'SISTEMA CIRCULATORIO' : 'DE PRIMER GRADO', 24, 146, 1.8);
  g.fillStyle = 'rgba(208,210,214,0.55)';
  g.font = MONO(12);
  letras(g, bio ? 'CIRCULACIÓN MAYOR Y MENOR' : 'DESPEJAR X · COMPROBAR', 24, 170, 1.4);
  g.strokeStyle = 'rgba(236,235,231,0.25)';
  g.beginPath(); g.moveTo(22, H - 40.5); g.lineTo(W - 22, H - 40.5); g.stroke();
  g.fillStyle = 'rgba(208,210,214,0.5)';
  letras(g, 'TUTOR · TE ESCUCHA CUANDO LO NECESITES', 24, H - 20, 1.4);
}

function dibujarMesaOtra(g, W, H, t) {
  fondoMesa(g, W, H);
  g.strokeStyle = 'rgba(236,235,231,0.5)';
  g.lineWidth = 1.5;
  g.strokeRect(6, 6, W - 12, H - 12);
  g.font = MONO(15);
  g.fillStyle = 'rgba(236,235,231,0.8)';
  letras(g, 'ENERGÍA DEL BARRIO · KWH', 22, 34, 2);
  g.strokeStyle = 'rgba(236,235,231,0.85)';
  g.lineWidth = 2;
  g.beginPath();
  for (let i = 0; i <= 40; i++) {
    const x = 26 + (i / 40) * (W - 52);
    const y = H * 0.62 - Math.sin(i * 0.35 + t * 0.6) * 28 - Math.sin(i * 0.9) * 10;
    i ? g.lineTo(x, y) : g.moveTo(x, y);
  }
  g.stroke();
  g.fillStyle = NARANJA;
  const k = (t * 0.15) % 1;
  g.beginPath(); g.arc(26 + k * (W - 52), H * 0.62 - Math.sin(k * 40 * 0.35 + t * 0.6) * 28 - Math.sin(k * 40 * 0.9) * 10, 5, 0, Math.PI * 2); g.fill();
}

const aditivo = (color, opacity) => new THREE.MeshBasicMaterial({ color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });

export function buildVida({ scene, world, camera }) {
  const vida = new THREE.Group();
  vida.name = 'vida';
  scene.add(vida);
  const anim = [];
  const S = world.sistema;

  // ── PIZARRÓN EN VIVO ──────────────────────────────────────
  const piz = lienzo(1024, 410);
  S.pantalla.material.map = piz.t;
  S.pantalla.material.needsUpdate = true;
  // ── PROYECCIONES SOBRE MESAS ──────────────────────────────
  const mesaLu = lienzo(512, 230);
  const pm = new THREE.Mesh(new THREE.PlaneGeometry(1.15, 0.52).rotateZ(Math.PI).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: mesaLu.t, transparent: true, depthWrite: false, toneMapped: false, polygonOffset: true, polygonOffsetFactor: -2 }));
  pm.position.set(-12.0, 0.777, 3.33);
  vida.add(pm);
  const mesaB = lienzo(512, 230);
  const pb = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 0.5).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: mesaB.t, transparent: true, depthWrite: false, toneMapped: false, polygonOffset: true, polygonOffsetFactor: -2 }));
  pb.position.set(-17.6, 0.777, -3.75);
  vida.add(pb);

  // ── HOLOGRAMA EN EL DISCO DE PROYECCIÓN ──────────────────
  const holo = new THREE.Group();
  holo.position.set(0, 0.03, -17);
  vida.add(holo);
  const geoBarra = new THREE.BoxGeometry(0.34, 1, 0.34).translate(0, 0.5, 0);
  const geoBorde = new THREE.EdgesGeometry(geoBarra);
  const lineaBlanca = new THREE.LineBasicMaterial({ color: new THREE.Color('#e3ebf3').multiplyScalar(1.6), transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false });
  const lineaNaranja = new THREE.LineBasicMaterial({ color: new THREE.Color(NARANJA).multiplyScalar(2.6), transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false });
  const rellenoBlanco = aditivo('#cfdbe6', 0.13);
  const rellenoNaranja = aditivo(NARANJA, 0.12);
  const barras = [];
  const etiquetasPiso = [];
  TALLES.forEach((tl, i) => {
    const x = -1.65 + i * 1.1;
    const st = new THREE.Group(), de = new THREE.Group();
    st.position.set(x - 0.2, 0, 0);
    de.position.set(x + 0.2, 0, 0);
    st.add(new THREE.Mesh(geoBarra, rellenoBlanco), new THREE.LineSegments(geoBorde, lineaBlanca));
    de.add(new THREE.Mesh(geoBarra, rellenoNaranja), new THREE.LineSegments(geoBorde, lineaNaranja));
    holo.add(st, de);
    barras.push({ st, de });
    // etiqueta del talle en el piso
    const et = lienzo(128, 128);
    const dibEt = () => {
      et.g.clearRect(0, 0, 128, 128);
      estirar(et.g, 'expanded');
      encajar(et.g, tl, i === 3 ? 62 : 70, 112);
      et.g.fillStyle = i === 3 ? NARANJA : '#2b2e33';
      const w = et.g.measureText(tl).width;
      et.g.fillText(tl, 64 - w / 2, 88);
      et.t.needsUpdate = true;
    };
    dibEt();
    etiquetasPiso.push(dibEt);
    const ep = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.42).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: et.t, transparent: true, depthWrite: false, toneMapped: false, polygonOffset: true, polygonOffsetFactor: -2 }));
    ep.position.set(x, 0.005, 0.72);
    holo.add(ep);
  });
  // rótulo flotante y "−3"
  const rot = lienzo(1024, 160);
  rot.g.font = MONO(30);
  rot.g.fillStyle = 'rgba(236,235,231,0.85)';
  letras(rot.g, 'STOCK', 40, 70, 4);
  rot.g.fillStyle = NARANJA;
  letras(rot.g, 'VS DEMANDA · POR TALLE', 175, 70, 4);
  const rotulo = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 0.53), new THREE.MeshBasicMaterial({ map: rot.t, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
  rotulo.position.set(0, 2.35, 0);
  // (el pizarrón ya rotula; el holograma queda limpio)
  const menos = lienzo(256, 128);
  const menosMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.5), new THREE.MeshBasicMaterial({ map: menos.t, transparent: true, depthWrite: false, toneMapped: false }));
  holo.add(menosMesh);
  let menosTxt = '';
  // anillos del campo de proyección
  for (const rad of [1.9, 2.7]) {
    const a = new THREE.Mesh(new THREE.RingGeometry(rad, rad + 0.015, 128).rotateX(-Math.PI / 2), aditivo(NARANJA, 0.35));
    a.position.y = 0.004;
    holo.add(a);
  }
  const barrido = new THREE.Mesh(new THREE.RingGeometry(3.2, 3.26, 128).rotateX(-Math.PI / 2), aditivo(NARANJA, 0.5));
  holo.add(barrido);

  // ── NODO: pulsos de datos ─────────────────────────────────
  const pulsoMat = new THREE.MeshStandardMaterial({ color: NARANJA, emissive: NARANJA, emissiveIntensity: 5 });
  const pulsos = new THREE.InstancedMesh(new THREE.BoxGeometry(0.05, 0.025, 0.22), pulsoMat, 16);
  vida.add(pulsos);
  const subida = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.18, 0.05), new THREE.MeshStandardMaterial({ color: '#fff', emissive: '#fff2e8', emissiveIntensity: 6 }));
  vida.add(subida);
  // ── ANTENA: ondas ─────────────────────────────────────────
  const ondas = [0, 1, 2].map(() => {
    const m = new THREE.Mesh(new THREE.RingGeometry(0.95, 1, 96).rotateX(-Math.PI / 2), aditivo(NARANJA, 0.5));
    m.position.set(15.5, 18.6, 3.2);
    vida.add(m);
    return m;
  });
  // ── UMBRAL: onda en el piso al cruzar ────────────────────
  const ondaPiso = new THREE.Mesh(new THREE.RingGeometry(0.9, 1, 96).rotateX(-Math.PI / 2), aditivo(NARANJA, 0));
  ondaPiso.position.set(0, 0.02, 5.8);
  vida.add(ondaPiso);
  let ondaT = 9;
  const cruzar = () => { S.destello = 1; ondaT = 0; };

  // ── PERSONAS ──────────────────────────────────────────────
  const P = paletaPersonas();
  const multitud = new Multitud();
  const gente = [];
  const add = (o) => { const p = new Persona(P, o, multitud).agregar(vida); gente.push(p); return p; };
  const mirar = (x, z, tx, tz) => Math.atan2(tx - x, tz - z);

  // plaza: llegan a la escuela y cruzan el umbral
  add({ modo: 'camina', vel: 1.15, ruta: [[-2.6, 33.5, 1], [-2.6, 9.6], [-1.0, 6.6], [-0.9, 4.0], [-4.2, 3.0, 0, 'salto']] });
  const b = add({ modo: 'camina', vel: 1.0, ruta: [[2.8, 33.5, 2], [2.6, 9.6], [1.0, 6.6], [0.9, 3.8], [4.3, 3.0, 0, 'salto']] });
  b.enTramo = 9;
  add({ modo: 'charla', p: [-3.7, 16.3], mira: [-4.4, 17.1] });
  add({ modo: 'parado', p: [-4.4, 17.1], mira: [-3.7, 16.3] });
  add({ modo: 'lee', p: [5.65, 20.4], asiento: 0.45, pies: 0, mira: -Math.PI / 2 });
  add({ modo: 'lee', p: [6.84, 13.8], asiento: 0.45, pies: 0, mira: -Math.PI / 2 });
  // vereda
  add({ modo: 'camina', vel: 1.3, pies: 0.12, ruta: [[-80, 35.6], [80, 35.6, 0, 'salto']] });
  const v2 = add({ modo: 'camina', vel: 1.2, pies: 0.12, ruta: [[80, 49.4], [-80, 49.4, 0, 'salto']] });
  v2.enTramo = 70;

  // hall
  add({ nombre: 'Santi', estado: 'Disponible', disponible: true, detalle: 'Recreo de proyecto', habla: ['¿Viste cómo se mueve la luz del techo?', '¿Vas a la presentación de las 10:30?'], fase: 0, modo: 'sentado', p: [-6.68, -5.0], asiento: 0.9, pies: 0.45, mira: Math.PI / 2 - 0.2, charla: true });
  add({ nombre: 'Mica', estado: 'Disponible', disponible: true, detalle: 'Recreo de proyecto', habla: ['Sí, después del recreo. ¿Vos?', 'Pedile otra pista, a mí me sirvió.'], fase: 3, modo: 'sentado', p: [-5.88, -3.7], asiento: 0.45, pies: 0.006, mira: Math.PI / 2 - 0.5 });
  add({ modo: 'sentado', p: [-7.45, -2.4], asiento: 1.35, pies: 0.9, mira: Math.PI / 2 + 0.3 });
  add({ nombre: 'Lauti', estado: 'Hablando con su tutor', detalle: 'No molestar · 5 min', privado: true, habla: ['Conversación privada con su tutor'], modo: 'toca', p: [5.3, -4.4], mira: -Math.PI / 2 + 0.4 });

  // aula-taller (Lu es la cámara: su banqueta queda libre)
  const T2 = [-11.8, 3.6], T1 = [-17.6, 3.6], T3 = [-17.6, -3.8], T4 = [-11.8, -3.8];
  const enMesa = (m, dx, lado, extra = {}) => add({ modo: 'sentado', mesa: true, p: [m[0] + dx, m[1] + lado * 0.98], asiento: 0.46, pies: 0.006, mira: lado > 0 ? Math.PI : 0, ...extra });
  enMesa(T2, -0.75, 1, { nombre: 'Tomi', estado: 'Disponible para ayudar', disponible: true, detalle: 'Tu grupo de proyecto · ya hizo su parte' });
  enMesa(T2, 0.75, 1, { nombre: 'Ana', estado: 'En foco · hasta las 9:50', foco: true, detalle: 'Tu grupo de proyecto · terminando su parte' });
  enMesa(T1, -0.75, -1, { nombre: 'Juli', estado: 'Trabajando', detalle: 'Proyecto: etiquetas de precios' }); enMesa(T1, 0.75, 1);
  enMesa(T3, -0.75, -1); enMesa(T3, 0.75, -1); enMesa(T3, -0.75, 1);
  enMesa(T4, -0.75, -1); enMesa(T4, 0.75, 1);
  add({ modo: 'parado', p: [-15.55, 3.7], mira: Math.PI / 2 });
  add({ nombre: 'Prof. Sosa', estado: 'Docente del taller', detalle: 'Recibe el proceso de tu grupo', habla: ['Ana, revisá de nuevo tu parte del proyecto.', 'Tomi, cuando puedas mostrale a tu compañera cómo cargaste los M.', 'En diez minutos arrancan las presentaciones.'], modo: 'camina', docente: true, vel: 0.85, ruta: [[-20.3, -1.5], [-14.7, -1.6, 3], [-9.4, -1.6], [-9.4, -6.1], [-14.7, -6.0, 3.5], [-20.3, -6.0]] });

  // zona de proyección: público en las gradas mirando el holograma
  const grada = (a, k) => {
    const rad = 5.42 + k;
    const x = rad * Math.cos((a * Math.PI) / 180), z = -17 - rad * Math.sin((a * Math.PI) / 180);
    add({ modo: 'sentado', p: [x, z], asiento: 0.42 * (k + 1), pies: 0.42 * k + (k === 0 ? 0.006 : 0), mira: mirar(x, z, 0, -17), charla: r2() > 0.6 });
  };
  let sem = 5;
  const r2 = () => { sem = (sem * 9301 + 49297) % 233280; return sem / 233280; };
  grada(214, 0); grada(232, 1); grada(245, 0); grada(296, 0); grada(311, 1); grada(327, 2); grada(222, 2);
  add({ nombre: 'Nahuel', estado: 'Presentando', detalle: 'Grupo de energía · semana 14', habla: ['Esto es el consumo de energía del barrio, semana por semana.', 'Los martes sube porque abre el centro cultural.', 'Con las gafas medimos cuánto baja si apagamos el patio.', '¿Alguien del grupo de talles quiere mostrar su avance?'], modo: 'gesto', p: [2.7, -19.3], mira: mirar(2.7, -19.3, 0, -11) });

  // rincón tranquilo
  add({ nombre: 'Cami', estado: 'En foco', foco: true, modo: 'lee', p: [12.3, 7.32], asiento: 0.53, pies: 0.006, mira: Math.PI });
  add({ nombre: 'Fede', estado: 'En foco', foco: true, modo: 'sentado', p: [16.8, 4.08], asiento: 0.47, pies: 0.006, mira: 0 });
  add({ modo: 'parado', p: [9.25, -3.0], mira: -Math.PI / 2 });

  vida.updateMatrixWorld(true);
  multitud.construir(vida);

  // calle: autos
  const autos = [
    { m: auto('#e9e8e4'), x: -60, z: 40.3, v: 9, dir: 1 },
    { m: auto('#2d3035'), x: 40, z: 44.9, v: 11, dir: -1 },
    { m: auto('#6f8499'), x: 110, z: 40.3, v: 8, dir: 1 },
  ];
  autos.forEach((a) => { a.m.rotation.y = a.dir > 0 ? 0 : Math.PI; a.m.position.set(a.x, 0, a.z); vida.add(a.m); });

  // ── cuadro a cuadro ───────────────────────────────────────
  const dummy = new THREE.Object3D();
  let accPiz = 1, accMesa = 1;
  const prevCam = camera.position.clone();
  const prevZ = new Map();

  function tick(t, dt) {
    const d = datos(t);
    // pizarrón y mesas: se redibujan solo si Lu puede verlos
    const zc = zona(camera.position.x, camera.position.z);
    accPiz += dt; accMesa += dt;
    if (accPiz > 0.16 && ['proyeccion', 'hall', 'nodo', 'pasillo'].includes(zc)) { accPiz = 0; dibujarPizarron(piz.g, 1024, 410, d, t, S); piz.t.needsUpdate = true; }
    if (accMesa > 0.25 && ['taller', 'hall'].includes(zc)) { accMesa = 0; if (S.mesaClase) dibujarMesaClase(mesaLu.g, 512, 230, t, S.mesaClase); else dibujarMesa(mesaLu.g, 512, 230, d, t); mesaLu.t.needsUpdate = true; dibujarMesaOtra(mesaB.g, 512, 230, t); mesaB.t.needsUpdate = true; }
    // holograma
    barras.forEach((b, i) => {
      b.st.scale.y = Math.max(0.02, (d.stock[i] / MAX) * 1.75 * (1 + 0.015 * Math.sin(t * 3 + i)));
      b.de.scale.y = Math.max(0.02, (d.demanda[i] / MAX) * 1.75 * (1 + 0.015 * Math.sin(t * 3.4 + i)));
    });
    holo.rotation.y = 0.12 * Math.sin(t * 0.25);
    const falta = Math.round(d.demanda[3] - d.stock[3]);
    const txt = falta > 0 ? `−${falta}` : '0';
    if (txt !== menosTxt) {
      menosTxt = txt;
      menos.g.clearRect(0, 0, 256, 128);
      estirar(menos.g, 'expanded');
      menos.g.font = ARCH(84);
      menos.g.fillStyle = NARANJA;
      menos.g.fillText(txt, 20, 96);
      menos.t.needsUpdate = true;
    }
    menosMesh.position.set(1.65 + 0.25, (d.demanda[3] / MAX) * 1.75 + 0.45 + 0.04 * Math.sin(t * 2), 0);
    menosMesh.material.opacity = 0.8 + 0.2 * Math.sin(t * 4);
    const kb = (t % 3.2) / 3.2;
    barrido.position.y = 0.02 + kb * 2.3;
    barrido.material.opacity = 0.45 * (1 - kb);

    // nodo: pulsos por las bandejas y por el núcleo
    for (let i = 0; i < 16; i++) {
      const fila = i < 8 ? 13.55 : 17.75;
      const k = ((t * 0.42 + (i % 8) / 8) % 1);
      dummy.position.set(fila, 2.83, -21.5 + k * 7.1);
      dummy.updateMatrix();
      pulsos.setMatrixAt(i, dummy.matrix);
    }
    pulsos.instanceMatrix.needsUpdate = true;
    const ks = (t * 0.6) % 1;
    subida.position.set(10.925, 0.5 + ks * 1.9, -18);
    subida.material.emissiveIntensity = 6 * Math.sin(ks * Math.PI);

    // antena: ondas que se expanden
    ondas.forEach((o, i) => {
      const k = ((t / 3.6) + i / 3) % 1;
      o.scale.setScalar(0.4 + k * 16);
      o.material.opacity = S.modoLocal ? 0 : 0.42 * (1 - k) * (1 - k);
    });

    // umbral: se enciende cuando alguien (o Lu) lo cruza
    const zU = 5.8;
    const cp = camera.position;
    if (Math.abs(cp.x) < 2 && (prevCam.z - zU) * (cp.z - zU) < 0) { cruzar(); if (S.alCruzarLu) S.alCruzarLu(cp.z < zU); }
    prevCam.copy(cp);
    for (const p of gente) {
      p.update(t, dt);
      if (p.o.modo !== 'camina') continue;
      const z = p.root.position.z, x = p.root.position.x;
      const pz = prevZ.get(p);
      if (pz !== undefined && Math.abs(x) < 2 && (pz - zU) * (z - zU) < 0 && Math.abs(pz - z) < 1) cruzar();
      prevZ.set(p, z);
    }
    for (const p of gente) { p.root.updateMatrixWorld(true); p.sombraPadre.updateMatrixWorld(true); }
    multitud.actualizar();
    ondaT += dt;
    const ko = Math.min(1, ondaT / 1.4);
    ondaPiso.scale.setScalar(0.3 + ko * 3.2);
    ondaPiso.material.opacity = ko < 1 ? 0.7 * (1 - ko) : 0;

    // autos
    for (const a of autos) {
      a.x += a.v * a.dir * dt;
      if (a.x > 160) a.x = -160;
      if (a.x < -160) a.x = 160;
      a.m.position.x = a.x;
      a.m.userData.ruedas.forEach((w) => (w.rotation.y -= (a.v * dt) / 0.33));
    }
  }

  const redibujarTextos = () => { etiquetasPiso.forEach((f) => f()); menosTxt = ''; accPiz = accMesa = 9; };
  return { vida, tick, gente, holo, redibujarTextos };
}
