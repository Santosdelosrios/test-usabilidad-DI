import * as THREE from 'three';

// Altura de los ojos de Lu (15 años)
export const EYE = 1.55;
const D = Math.PI / 180;

// Paradas del recorrido. yaw: 0 = sur (fondo de la escuela), 90 = este, -90 = oeste, 180 = norte (entrada).
export const STOPS = [
  { id: 'entrada', n: '01', nombre: 'Entrada', sub: 'Plaza de acceso · escuela-nodo', p: [0, 26.5], yaw: 0, pitch: 4 },
  { id: 'hall', n: '02', nombre: 'Hall', sub: 'Umbral del nodo', p: [0, 3.2], yaw: 0, pitch: 2 },
  { id: 'taller', n: '03', nombre: 'Aula-taller', sub: 'Tu mesa del proyecto', p: [-12.0, 0.4], yaw: 168, pitch: -7 },
  { id: 'proyeccion', n: '04', nombre: 'Zona de proyección', sub: 'Pizarrón y proyecciones', p: [0, -10.2], yaw: 0, pitch: 3 },
  { id: 'rincon', n: '05', nombre: 'Rincón tranquilo', sub: 'Modo foco', p: [15.1, 0.4], yaw: 180, pitch: -5 },
  { id: 'nodo', n: '06', nombre: 'Sala del nodo', sub: 'Servidor local', p: [5.4, -17.4], yaw: -92, pitch: 1 },
];

// Conexiones con puntos intermedios (de a hacia b) para no atravesar muros
const EDGES = [
  ['entrada', 'hall', []],
  ['hall', 'taller', [[-4.6, 2.2], [-9.4, 1.9]]],
  ['hall', 'rincon', [[4.6, 2.2], [9.6, 1.9]]],
  ['hall', 'proyeccion', [[0, -7.6]]],
  ['proyeccion', 'nodo', []],
];

const clamp = THREE.MathUtils.clamp;
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const ease = (k) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);
const wrap = (a) => { a = (a + Math.PI) % (Math.PI * 2); if (a < 0) a += Math.PI * 2; return a - Math.PI; };
const lerpAngle = (a, b, t) => a + wrap(b - a) * t;

function chevronGeo(scale = 1) {
  const s = new THREE.Shape();
  s.moveTo(-0.42, -0.32); s.lineTo(0, 0.1); s.lineTo(0.42, -0.32); s.lineTo(0.42, -0.1); s.lineTo(0, 0.32); s.lineTo(-0.42, -0.1); s.closePath();
  const g = new THREE.ShapeGeometry(s);
  g.scale(scale, scale, scale);
  g.rotateX(-Math.PI / 2);
  return g;
}

export class Navigator {
  constructor({ camera, dom, scene, root, labelsEl }) {
    this.camera = camera;
    this.dom = dom;
    this.scene = scene;
    this.root = root;
    this.labelsEl = labelsEl;
    camera.rotation.order = 'YXZ';
    this.yaw = 0; this.pitch = 0; this.vy = 0; this.vp = 0;
    this.current = null; this.walk = null; this.settle = null;
    this.fovTarget = camera.fov;
    this.ev = {};
    this.ray = new THREE.Raycaster();
    this.ndc = new THREE.Vector2();
    this.markers = [];
    this.hovered = null;
    this.keys = {};
    this.byId = Object.fromEntries(STOPS.map((s) => [s.id, s]));

    // adyacencia con polilíneas orientadas
    this.adj = Object.fromEntries(STOPS.map((s) => [s.id, []]));
    for (const [a, b, w] of EDGES) {
      const pa = this.byId[a].p, pb = this.byId[b].p;
      const fwd = [...w, pb], back = [...[...w].reverse(), pa];
      const len = (start, pts) => pts.reduce((acc, q, i) => acc + Math.hypot(q[0] - (i ? pts[i - 1][0] : start[0]), q[1] - (i ? pts[i - 1][1] : start[1])), 0);
      this.adj[a].push({ to: b, pts: fwd, len: len(pa, fwd) });
      this.adj[b].push({ to: a, pts: back, len: len(pb, back) });
    }

    // geometrías compartidas
    this.geoChev = chevronGeo(1);
    this.geoChevSombra = chevronGeo(1.16);
    this.geoHit = new THREE.CircleGeometry(0.75, 24).rotateX(-Math.PI / 2);
    this.markerGroup = new THREE.Group();
    scene.add(this.markerGroup);

    // cursor de piso estilo Street View
    const cm = new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.85, depthWrite: false, toneMapped: false });
    const cd = new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.16, depthWrite: false, toneMapped: false });
    this.cursor = new THREE.Group();
    this.cursor.add(new THREE.Mesh(new THREE.RingGeometry(0.25, 0.29, 48).rotateX(-Math.PI / 2), cm));
    this.cursor.add(new THREE.Mesh(new THREE.CircleGeometry(0.25, 48).rotateX(-Math.PI / 2), cd));
    this.cursor.renderOrder = 10;
    this.cursor.visible = false;
    scene.add(this.cursor);
    this.cursorMats = [cm, cd];

    this._bind();
  }

  on(e, f) { (this.ev[e] ||= []).push(f); }
  emit(e, ...a) { (this.ev[e] || []).forEach((f) => f(...a)); }

  // ── entrada del usuario ─────────────────────────────────
  _bind() {
    const el = this.dom;
    let down = null, last = null;
    el.addEventListener('pointerdown', (e) => {
      if (e.button !== 0 && e.pointerType === 'mouse') return;
      el.setPointerCapture(e.pointerId);
      down = { x: e.clientX, y: e.clientY, t: performance.now() };
      last = { x: e.clientX, y: e.clientY, t: performance.now() };
      this.dragging = false;
      this.vy = this.vp = 0;
    });
    el.addEventListener('pointermove', (e) => {
      this.pointer = { x: e.clientX, y: e.clientY };
      this.pointerDirty = true;
      if (!down) return;
      const dx = e.clientX - last.x, dy = e.clientY - last.y;
      if (!this.dragging && Math.hypot(e.clientX - down.x, e.clientY - down.y) > 5) {
        this.dragging = true;
        el.classList.add('arrastrando');
        this.emit('interact');
      }
      if (this.dragging && !this.walk) {
        this.settle = null;
        const k = (this.camera.fov * D) / el.clientHeight;
        this.yaw += dx * k;
        this.pitch += dy * k;
        const now = performance.now(), dt = Math.max(1, now - last.t) / 1000;
        this.vy = THREE.MathUtils.lerp(this.vy, (dx * k) / dt, 0.5);
        this.vp = THREE.MathUtils.lerp(this.vp, (dy * k) / dt, 0.5);
      }
      last = { x: e.clientX, y: e.clientY, t: performance.now() };
    });
    const up = (e) => {
      if (!down) return;
      const wasDrag = this.dragging;
      if (!wasDrag) this._click(e.clientX, e.clientY);
      if (performance.now() - last.t > 90) this.vy = this.vp = 0;
      if (!wasDrag) this.vy = this.vp = 0;
      down = null;
      this.dragging = false;
      el.classList.remove('arrastrando');
    };
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
    el.addEventListener('pointerleave', () => { this.cursor.visible = false; this._hover(null); this.pointer = null; });
    el.addEventListener('wheel', (e) => {
      e.preventDefault();
      this.fovTarget = clamp(this.fovTarget + e.deltaY * 0.03, 40, 76);
    }, { passive: false });

    window.addEventListener('keydown', (e) => {
      if (e.target && /input|textarea|select/i.test(e.target.tagName)) return;
      const k = e.code;
      if (['ArrowLeft', 'ArrowRight', 'KeyA', 'KeyD'].includes(k)) { this.keys[k] = true; this.emit('interact'); e.preventDefault(); }
      if ((k === 'ArrowUp' || k === 'KeyW') && !e.repeat) { this.step(1); e.preventDefault(); }
      if ((k === 'ArrowDown' || k === 'KeyS') && !e.repeat) { this.step(-1); e.preventDefault(); }
      const m = k.match(/^Digit([1-6])$/);
      if (m) this.goTo(STOPS[+m[1] - 1].id);
    });
    window.addEventListener('keyup', (e) => { this.keys[e.code] = false; });
    window.addEventListener('blur', () => { this.keys = {}; });
  }

  _pick(x, y) {
    const rect = this.dom.getBoundingClientRect();
    this.ndc.set(((x - rect.left) / rect.width) * 2 - 1, -((y - rect.top) / rect.height) * 2 + 1);
    this.ray.setFromCamera(this.ndc, this.camera);
    const mh = this.ray.intersectObjects(this.markers.map((m) => m.hit), false)[0];
    if (mh) return { marker: this.markers.find((m) => m.hit === mh.object) };
    const hits = this.pickables ? this.ray.intersectObjects(this.pickables, false) : this.ray.intersectObject(this.root, true);
    const h = hits.find((q) => q.object.visible !== false && !(q.object.material && q.object.material.visible === false));
    if (h && h.object.userData.floor && h.distance < 45) return { floor: h };
    return {};
  }

  // Flecha que coincide con la guía de las gafas: naranja
  resaltar(id) {
    this.resaltado = id;
    for (const m of this.markers) m.fill.material.color.set(m.to === id ? '#e8743b' : '#ffffff');
  }

  _hover(marker) {
    if (this.hovered === marker) return;
    if (this.hovered) {
      this.hovered.fill.material.color.set(this.hovered.to === this.resaltado ? '#e8743b' : '#ffffff');
      this.hovered.group.scale.setScalar(1);
      this.hovered.label.classList.remove('hover');
    }
    this.hovered = marker;
    if (marker) {
      marker.fill.material.color.set('#e8743b');
      marker.group.scale.setScalar(1.14);
      marker.label.classList.add('hover');
    }
    this.dom.style.cursor = marker ? 'pointer' : '';
  }

  _click(x, y) {
    this.emit('interact');
    if (this.walk) return;
    const p = this._pick(x, y);
    if (p.marker) return this.goTo(p.marker.to);
    if (p.floor) {
      const cp = this.camera.position;
      const v = new THREE.Vector2(p.floor.point.x - cp.x, p.floor.point.z - cp.z).normalize();
      let best = null, bestA = 0.7;
      for (const m of this.markers) {
        const a = Math.acos(clamp(v.dot(m.dir), -1, 1));
        if (a < bestA) { bestA = a; best = m; }
      }
      if (best) this.goTo(best.to);
      else this._pulseCursor();
    }
  }

  _pulseCursor() {
    this.cursorPulse = 0.35;
  }

  step(sign) {
    if (this.walk || !this.current) return;
    const f = new THREE.Vector2(-Math.sin(this.yaw), -Math.cos(this.yaw)).multiplyScalar(sign);
    let best = null, bestDot = Math.cos(75 * D);
    for (const m of this.markers) { const d = m.dir.dot(f); if (d > bestDot) { bestDot = d; best = m; } }
    if (best) this.goTo(best.to);
  }

  // ── recorrido ───────────────────────────────────────────
  route(a, b) {
    const dist = {}, prev = {}, q = new Set(STOPS.map((s) => s.id));
    STOPS.forEach((s) => (dist[s.id] = Infinity));
    dist[a] = 0;
    while (q.size) {
      let u = null;
      for (const id of q) if (u === null || dist[id] < dist[u]) u = id;
      q.delete(u);
      if (u === b) break;
      for (const e of this.adj[u]) {
        const nd = dist[u] + e.len;
        if (nd < dist[e.to]) { dist[e.to] = nd; prev[e.to] = { from: u, e }; }
      }
    }
    const chain = [];
    let cur = b;
    while (cur !== a) { chain.unshift(prev[cur].e); cur = prev[cur].from; }
    const pts = [this.byId[a].p];
    chain.forEach((e) => pts.push(...e.pts));
    return pts;
  }

  goTo(id, { instant = false } = {}) {
    if (this.walk || id === this.current || !this.byId[id]) return;
    const s = this.byId[id];
    if (instant || !this.current) {
      this.camera.position.set(s.p[0], EYE, s.p[1]);
      this.yaw = s.yaw * D; this.pitch = s.pitch * D;
      this.vy = this.vp = 0;
      this._arrive(id);
      return;
    }
    const pts = this.route(this.current, id).map(([x, z]) => new THREE.Vector3(x, EYE, z));
    pts[0].copy(this.camera.position).setY(EYE);
    const curve = new THREE.CatmullRomCurve3(pts, false, 'centripetal', 0.5);
    const len = curve.getLength();
    this.walk = { curve, len, dur: clamp(0.9 + len / 6.5, 1.1, 4.8), t: 0, to: id, yawEnd: s.yaw * D, pitchEnd: s.pitch * D };
    this.settle = null;
    this.vy = this.vp = 0;
    this._clearMarkers();
    this.cursor.visible = false;
    this.emit('walk', s);
  }

  _arrive(id) {
    this.current = id;
    this._buildMarkers();
    this.emit('stop', this.byId[id]);
  }

  _clearMarkers() {
    this._hover(null);
    this.markers.forEach((m) => { this.markerGroup.remove(m.group); m.label.remove(); m.fill.material.dispose(); });
    this.markers = [];
  }

  _buildMarkers() {
    this._clearMarkers();
    const s = this.byId[this.current];
    for (const e of this.adj[this.current]) {
      const first = e.pts[0];
      const dir = new THREE.Vector2(first[0] - s.p[0], first[1] - s.p[1]);
      const dist = dir.length();
      dir.normalize();
      const d = Math.min(4.2, dist * 0.7);
      const group = new THREE.Group();
      group.position.set(s.p[0] + dir.x * d, 0.035, s.p[1] + dir.y * d);
      group.rotation.y = Math.atan2(-dir.x, -dir.y);
      const sombra = new THREE.Mesh(this.geoChevSombra, new THREE.MeshBasicMaterial({ color: '#0b0c0e', transparent: true, opacity: 0.5, depthWrite: false, toneMapped: false }));
      sombra.position.y = -0.004;
      const fill = new THREE.Mesh(this.geoChev, new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.95, depthWrite: false, toneMapped: false }));
      const hit = new THREE.Mesh(this.geoHit, new THREE.MeshBasicMaterial({ visible: false }));
      sombra.renderOrder = 11; fill.renderOrder = 12;
      group.add(sombra, fill, hit);
      this.markerGroup.add(group);
      const to = this.byId[e.to];
      const label = document.createElement('div');
      label.className = 'etiqueta';
      label.innerHTML = `<span>${to.n}</span>${to.nombre}`;
      label.addEventListener('click', () => this.goTo(e.to));
      this.labelsEl.appendChild(label);
      this.markers.push({ group, fill, hit, label, to: e.to, dir });
    }
    this.resaltar(this.resaltado);
  }

  // ── cuadro a cuadro ─────────────────────────────────────
  update(dt, t) {
    const cam = this.camera;
    if (this.walk) {
      const w = this.walk;
      w.t += dt;
      const k = Math.min(w.t / w.dur, 1);
      const u = ease(k);
      const p = w.curve.getPointAt(u);
      const fade = Math.sin(Math.PI * k);
      p.y = EYE + Math.sin(((u * w.len) / 0.7) * Math.PI) * 0.016 * fade;
      cam.position.copy(p);
      const tan = w.curve.getTangentAt(Math.min(u + 0.06, 1));
      const yawTan = Math.atan2(-tan.x, -tan.z);
      const blend = smooth(0.5, 0.97, k);
      const yawDes = lerpAngle(yawTan, w.yawEnd, blend);
      const pitchDes = THREE.MathUtils.lerp(-0.03, w.pitchEnd, blend);
      const a = 1 - Math.exp(-dt * (k > 0.85 ? 12 : 5));
      this.yaw = lerpAngle(this.yaw, yawDes, a);
      this.pitch += (pitchDes - this.pitch) * a;
      if (k >= 1) {
        this.walk = null;
        this.settle = { yaw: w.yawEnd, pitch: w.pitchEnd, t: 0 };
        this._arrive(w.to);
      }
    } else {
      if (this.settle) {
        const a = 1 - Math.exp(-dt * 9);
        this.yaw = lerpAngle(this.yaw, this.settle.yaw, a);
        this.pitch += (this.settle.pitch - this.pitch) * a;
        this.settle.t += dt;
        if (this.settle.t > 0.8) this.settle = null;
      }
      if (!this.dragging) {
        this.yaw += this.vy * dt;
        this.pitch += this.vp * dt;
        const dec = Math.exp(-dt * 5);
        this.vy *= dec; this.vp *= dec;
      }
      const turn = (this.keys.ArrowLeft || this.keys.KeyA ? 1 : 0) - (this.keys.ArrowRight || this.keys.KeyD ? 1 : 0);
      if (turn) { this.yaw += turn * 1.5 * dt; this.settle = null; }
    }
    this.pitch = clamp(this.pitch, -1.25, 1.25);
    cam.rotation.set(this.pitch, this.yaw, 0);
    if (Math.abs(cam.fov - this.fovTarget) > 0.01) {
      cam.fov += (this.fovTarget - cam.fov) * (1 - Math.exp(-dt * 10));
      cam.updateProjectionMatrix();
    }
    cam.updateMatrixWorld();

    // hover (cursor de piso y flechas)
    if (this.pointerDirty && this.pointer && !this.dragging && !this.walk) {
      this.pointerDirty = false;
      const p = this._pick(this.pointer.x, this.pointer.y);
      this._hover(p.marker || null);
      if (p.floor) {
        this.cursor.visible = true;
        this.cursor.position.copy(p.floor.point).add(new THREE.Vector3(0, 0.03, 0));
      } else this.cursor.visible = false;
    }
    if (this.walk || this.dragging) this.cursor.visible = false;
    if (this.cursorPulse > 0) {
      this.cursorPulse -= dt;
      const s = 1 + Math.sin((this.cursorPulse / 0.35) * Math.PI) * 0.35;
      this.cursor.scale.setScalar(s);
      this.cursorMats[0].color.set('#e8743b');
    } else {
      this.cursor.scale.setScalar(1);
      this.cursorMats[0].color.set('#ffffff');
    }

    // flechas: leve pulso y etiquetas proyectadas
    const w = this.dom.clientWidth, h = this.dom.clientHeight;
    const v = new THREE.Vector3();
    for (const m of this.markers) {
      if (m !== this.hovered) m.fill.material.opacity = 0.82 + 0.16 * Math.sin(t * 3);
      v.copy(m.group.position).setY(0.25).project(cam);
      const on = v.z < 1 && Math.abs(v.x) < 1.15 && Math.abs(v.y) < 1.15;
      m.label.style.display = on ? '' : 'none';
      if (on) m.label.style.transform = `translate(${((v.x + 1) / 2) * w}px, ${((1 - v.y) / 2) * h}px) translate(-50%, -120%)`;
    }
  }
}
