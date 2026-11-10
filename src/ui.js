import { STOPS } from './nav.js';
import { fuente } from './tipos.js';

const B = { x0: -24, x1: 24, z0: -28, z1: 29.5 };

export class UI {
  constructor({ nav, plan, camera }) {
    this.nav = nav;
    this.plan = plan;
    this.camera = camera;
    const $ = (id) => document.getElementById(id);
    this.el = {
      capa: document.querySelector('.capa'),
      num: $('p-num'), nombre: $('p-nombre'), sub: $('p-sub'), titulo: $('titulo'),
      contador: $('contador'), ruta: $('ruta'), mapa: $('mapa'), consejo: $('consejo'),
    };

    // botones de la ruta
    this.botones = {};
    for (const s of STOPS) {
      const b = document.createElement('button');
      b.type = 'button';
      b.innerHTML = `<span>${s.n}</span>${s.nombre}`;
      b.addEventListener('click', () => { nav.emit('interact'); nav.goTo(s.id); });
      this.el.ruta.appendChild(b);
      this.botones[s.id] = b;
    }

    // luz del día
    this.botonesLuz = {};
    this.botonesCal = {};
    document.querySelectorAll('#luz button[data-calidad]').forEach((b) => {
      this.botonesCal[b.dataset.calidad] = b;
      b.addEventListener('click', () => this.onCalidad && this.onCalidad(b.dataset.calidad));
    });
    this.botonesTipo = {};
    document.querySelectorAll('#luz button[data-tipo]').forEach((b) => {
      this.botonesTipo[b.dataset.tipo] = b;
      b.addEventListener('click', () => this.onTipo && this.onTipo(b.dataset.tipo));
    });
    document.querySelectorAll('#luz button[data-luz]').forEach((b) => {
      this.botonesLuz[b.dataset.luz] = b;
      b.addEventListener('click', () => { nav.emit('interact'); this.onLuz && this.onLuz(b.dataset.luz); });
    });

    // mini-plano
    const c = this.el.mapa;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.W = 156; this.H = Math.round((196 * (B.z1 - B.z0)) / (B.x1 - B.x0));
    c.width = this.W * dpr; c.height = this.H * dpr;
    c.style.width = this.W + 'px'; c.style.height = this.H + 'px';
    this.ctx = c.getContext('2d');
    this.ctx.scale(dpr, dpr);
    this.base = this._drawBase(dpr);
    c.addEventListener('click', (e) => {
      const rc = c.getBoundingClientRect();
      const x = e.clientX - rc.left, y = e.clientY - rc.top;
      let best = null, bd = 14;
      for (const s of STOPS) {
        const [px, py] = this.map(s.p[0], s.p[1]);
        const d = Math.hypot(px - x, py - y);
        if (d < bd) { bd = d; best = s; }
      }
      if (best) { nav.emit('interact'); nav.goTo(best.id); }
    });

    nav.on('stop', (s) => this.setStop(s));
    nav.on('walk', (s) => this.setWalking(s));
    nav.on('interact', () => this.hideHint());

    this.hintTimer = setTimeout(() => this.hideHint(), 12000);
  }

  map(x, z) {
    return [((x - B.x0) / (B.x1 - B.x0)) * this.W, ((z - B.z0) / (B.z1 - B.z0)) * this.H];
  }

  _drawBase(dpr) {
    const cv = document.createElement('canvas');
    cv.width = this.W * dpr; cv.height = this.H * dpr;
    const g = cv.getContext('2d');
    g.scale(dpr, dpr);
    const rect = (x0, x1, z0, z1, style) => {
      const [a, b] = this.map(x0, z0), [c, d] = this.map(x1, z1);
      g.fillStyle = style;
      g.fillRect(Math.min(a, c), Math.min(b, d), Math.max(1, Math.abs(c - a)), Math.max(1, Math.abs(d - b)));
    };
    rect(-22.2, 22.2, -26.2, 8.2, 'rgba(233,233,230,0.05)');
    for (const [x0, x1, z0, z1] of this.plan.muros) rect(x0, x1, z0, z1, 'rgba(233,233,230,0.78)');
    for (const [x0, x1, z0, z1] of this.plan.vidrios) rect(x0, x1, z0, z1, 'rgba(160,190,210,0.7)');
    // recorridos posibles
    g.setLineDash([2, 3]);
    g.strokeStyle = 'rgba(232,116,59,0.55)';
    g.lineWidth = 1;
    const seen = new Set();
    for (const s of STOPS) for (const e of this.nav.adj[s.id]) {
      const key = [s.id, e.to].sort().join('-');
      if (seen.has(key)) continue;
      seen.add(key);
      g.beginPath();
      g.moveTo(...this.map(s.p[0], s.p[1]));
      e.pts.forEach((p) => g.lineTo(...this.map(p[0], p[1])));
      g.stroke();
    }
    g.setLineDash([]);
    return cv;
  }

  draw() {
    const g = this.ctx;
    g.clearRect(0, 0, this.W, this.H);
    g.drawImage(this.base, 0, 0, this.W, this.H);
    // cono de visión
    const cp = this.camera.position;
    const [px, py] = this.map(cp.x, cp.z);
    const yaw = this.nav.yaw;
    const half = (Math.atan(Math.tan((this.camera.fov * Math.PI) / 360) * this.camera.aspect));
    const ang = -Math.PI / 2 - yaw; // canvas: norte arriba
    const grad = g.createRadialGradient(px, py, 0, px, py, 28);
    grad.addColorStop(0, 'rgba(232,116,59,0.55)');
    grad.addColorStop(1, 'rgba(232,116,59,0)');
    g.fillStyle = grad;
    g.beginPath();
    g.moveTo(px, py);
    g.arc(px, py, 28, ang - half, ang + half);
    g.closePath();
    g.fill();
    // paradas
    g.font = fuente('mono', 8);
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    for (const s of STOPS) {
      const [x, y] = this.map(s.p[0], s.p[1]);
      const actual = s.id === this.nav.current && !this.nav.walk;
      g.beginPath();
      g.arc(x, y, 6.5, 0, Math.PI * 2);
      g.fillStyle = actual ? '#e8743b' : 'rgba(11,12,14,0.85)';
      g.fill();
      g.lineWidth = 1;
      g.strokeStyle = actual ? '#e8743b' : 'rgba(233,233,230,0.7)';
      g.stroke();
      g.fillStyle = actual ? '#0b0c0e' : 'rgba(233,233,230,0.9)';
      g.fillText(String(+s.n), x, y + 0.5);
    }
    // Lu
    g.beginPath();
    g.arc(px, py, 3.2, 0, Math.PI * 2);
    g.fillStyle = '#ffffff';
    g.fill();
  }

  setStop(s) {
    const { num, nombre, sub, titulo, contador } = this.el;
    titulo.classList.remove('caminando');
    num.textContent = s.n;
    nombre.textContent = s.nombre;
    sub.textContent = s.sub;
    contador.textContent = `${s.n} / 0${STOPS.length}`;
    Object.entries(this.botones).forEach(([id, b]) => b.classList.toggle('activa', id === s.id));
  }

  setWalking(s) {
    this.el.titulo.classList.add('caminando');
    this.el.sub.textContent = `Caminando hacia ${s.nombre.toLowerCase()}…`;
    Object.entries(this.botones).forEach(([id, b]) => b.classList.toggle('activa', id === s.id));
  }

  setCalidad(n) {
    Object.entries(this.botonesCal).forEach(([k, b]) => b.classList.toggle('activa', k === n));
  }

  setTipo(n) {
    Object.entries(this.botonesTipo).forEach(([k, b]) => b.classList.toggle('activa', k === n));
  }

  setLuz(n) {
    Object.entries(this.botonesLuz).forEach(([k, b]) => b.classList.toggle('activa', k === n));
  }

  hideHint() {
    clearTimeout(this.hintTimer);
    this.el.consejo.classList.add('fuera');
  }
}
