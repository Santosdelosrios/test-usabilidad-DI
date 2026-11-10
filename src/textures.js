import * as THREE from 'three';
import { fuente, estiramiento } from './tipos.js';

// Generador pseudoaleatorio con semilla: el mundo sale siempre igual
export function rng(seed = 7) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function canvas(size, draw) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  draw(c.getContext('2d'), size);
  return c;
}

const cache = {};
function tex(key, size, draw, rx, ry, srgb = true) {
  if (!cache[key]) cache[key] = canvas(size, draw);
  const t = new THREE.CanvasTexture(cache[key]);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(rx, ry);
  t.anisotropy = 8;
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// Hormigón pulido: moteado suave y juntas cada 4 m
export function hormigon(rx, ry) {
  return tex('hormigon', 512, (g, s) => {
    const r = rng(11);
    g.fillStyle = '#ffffff'; g.fillRect(0, 0, s, s);
    for (let i = 0; i < 14; i++) {
      const x = r() * s, y = r() * s, rad = 60 + r() * 160;
      const gr = g.createRadialGradient(x, y, 0, x, y, rad);
      gr.addColorStop(0, `rgba(120,118,112,${0.025 + r() * 0.03})`);
      gr.addColorStop(1, 'rgba(120,118,112,0)');
      g.fillStyle = gr; g.fillRect(0, 0, s, s);
    }
    for (let i = 0; i < 9000; i++) {
      g.fillStyle = `rgba(80,80,78,${r() * 0.06})`;
      g.fillRect(r() * s, r() * s, 1 + r() * 1.5, 1 + r() * 1.5);
    }
    g.fillStyle = 'rgba(70,70,68,0.22)';
    g.fillRect(0, 0, s, 2); g.fillRect(0, 0, 2, s);
  }, rx, ry);
}

// Baldosas de exterior 1,2 m (tile de 2x2)
export function baldosas(rx, ry) {
  return tex('baldosas', 512, (g, s) => {
    const r = rng(23);
    g.fillStyle = '#ffffff'; g.fillRect(0, 0, s, s);
    const h = s / 2;
    for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) {
      const v = 238 + Math.floor(r() * 14);
      g.fillStyle = `rgb(${v},${v - 1},${v - 3})`;
      g.fillRect(i * h, j * h, h, h);
    }
    for (let i = 0; i < 7000; i++) {
      g.fillStyle = `rgba(90,88,84,${r() * 0.07})`;
      g.fillRect(r() * s, r() * s, 1.5, 1.5);
    }
    g.fillStyle = 'rgba(80,80,78,0.35)';
    g.fillRect(0, 0, s, 3); g.fillRect(0, h, s, 3);
    g.fillRect(0, 0, 3, s); g.fillRect(h, 0, 3, s);
  }, rx, ry);
}

// Piso técnico de la sala del nodo (placas de 60 cm)
export function grilla(rx, ry) {
  return tex('grilla', 128, (g, s) => {
    g.fillStyle = '#ffffff'; g.fillRect(0, 0, s, s);
    g.fillStyle = 'rgba(40,42,46,0.45)';
    g.fillRect(0, 0, s, 3); g.fillRect(0, 0, 3, s);
    g.fillStyle = 'rgba(40,42,46,0.12)';
    for (let i = 0; i < 6; i++) for (let j = 0; j < 6; j++) {
      g.beginPath(); g.arc(20 + i * 18, 20 + j * 18, 2.2, 0, Math.PI * 2); g.fill();
    }
  }, rx, ry);
}

// Frente perforado de racks (eco de la cúpula del planetario)
export function perforado() {
  return tex('perforado', 256, (g, s) => {
    g.fillStyle = '#ffffff'; g.fillRect(0, 0, s, s);
    g.fillStyle = 'rgba(0,0,0,0.55)';
    const step = 10;
    for (let y = 18; y < s - 14; y += step) for (let x = 12; x < s - 12; x += step) {
      g.beginPath(); g.arc(x + ((y / step) % 2) * 5, y, 2.6, 0, Math.PI * 2); g.fill();
    }
    g.fillStyle = 'rgba(0,0,0,0.25)';
    g.fillRect(0, 0, s, 6); g.fillRect(0, s - 6, s, 6);
  }, 1, 1);
}

// Chapa perforada clara (paneles del hall, óculo)
export function perforadoClaro(rx, ry) {
  return tex('perforadoClaro', 256, (g, s) => {
    g.fillStyle = '#ffffff'; g.fillRect(0, 0, s, s);
    g.fillStyle = 'rgba(70,72,76,0.62)';
    const step = 12.8;
    for (let j = 0; j < 20; j++) for (let i = 0; i < 20; i++) {
      g.beginPath(); g.arc(6.4 + i * step + ((j % 2) * step) / 2, 6.4 + j * step, 2.6, 0, Math.PI * 2); g.fill();
    }
  }, rx, ry);
}

// Texto sobre lienzo (carteles del mundo). Se redibuja si cambia la tipografía.
// Cada línea: { text, k: 'display'|'texto'|'mono', px, x, y, spacing, color, accent, dot }  (o font/stretch a mano)
const vivos = [];
export function texto({ lines, w = 1024, h = 256, bg = null, color = '#2b2e33', accent = '#e8743b' }) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d');
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  const dibujar = () => {
    g.clearRect(0, 0, w, h);
    if (bg) { g.fillStyle = bg; g.fillRect(0, 0, w, h); }
    for (const l of lines) {
      let px = l.px;
      const fam = () => (l.k ? fuente(l.k, px) : l.font);
      g.font = fam();
      try { g.fontStretch = l.k ? estiramiento(l.k) : (l.stretch || 'normal'); } catch (e) { /* sin soporte */ }
      // que entre en el cartel, sea cual sea la tipografía
      if (l.k) {
        const ancho = () => { let a = 0; for (const ch of l.text) a += g.measureText(ch).width + (l.spacing || 0); return a; };
        const libre = w - l.x - 10;
        let a = ancho();
        if (a > libre) { px = px * (libre / a); g.font = fam(); }
      }
      g.fillStyle = l.accent ? accent : (l.color || color);
      g.textBaseline = 'alphabetic';
      if (l.spacing) {
        let x = l.x;
        for (const ch of l.text) { g.fillText(ch, x, l.y); x += g.measureText(ch).width + l.spacing; }
      } else g.fillText(l.text, l.x, l.y);
      if (l.dot) { g.fillStyle = accent; g.beginPath(); g.arc(l.dot[0], l.dot[1], l.dot[2], 0, Math.PI * 2); g.fill(); }
    }
    t.needsUpdate = true;
  };
  dibujar();
  vivos.push(dibujar);
  return t;
}
export function redibujarTextos() { vivos.forEach((f) => f()); }
