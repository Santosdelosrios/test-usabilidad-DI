import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { C, makeMaterials } from './palette.js';
import * as T from './textures.js';

// ─────────────────────────────────────────────────────────────
// La escuela-nodo. Unidades en metros. Y hacia arriba, norte = +Z (la entrada mira al norte, al sol).
// Planta (vista desde arriba):
//   z  8 ── fachada norte (entrada) ───────────────────────
//        AULA-TALLER  |      HALL      |  RINCÓN TRANQUILO
//   z -6/-8/-12 ─────┤                ├───────────────────
//        (depósito)   |   PROYECCIÓN   |  SALA DEL NODO
//   z -26 ── fachada sur ──────────────────────────────────
//        x -22      x -8             x 8 / 10           x 22
// ─────────────────────────────────────────────────────────────

export const ROOF_Y = 9.5;

export function buildWorld(scene) {
  const M = makeMaterials();
  const root = new THREE.Group();
  root.name = 'mundo';
  scene.add(root);
  const tick = [];
  const sistema = { destello: 0 }; // piezas del ecosistema que otras capas animan
  const plan = { muros: [], vidrios: [] };
  const rects = [];
  // Luces interiores: puntuales (mucho más livianas que las luces de área)
  function rectLuz(color, intensidad, w, h, x, y, z) {
    const l = new THREE.PointLight(color, intensidad * Math.min(w * h, 16) * 0.6, 17, 2);
    l.position.set(x, y - 0.8, z);
    l.userData.base = l.intensity;
    rects.push(l);
    root.add(l);
    return l;
  }
  const r = T.rng(42);

  // ── utilidades ────────────────────────────────────────────
  function blk(x0, x1, y0, y1, z0, z1, mat, o = {}) {
    const g = new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0);
    const m = new THREE.Mesh(g, mat);
    m.position.set((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
    m.castShadow = o.cast ?? true;
    m.receiveShadow = o.receive ?? true;
    if (o.floor) m.userData.floor = true;
    if (o.plan) plan.muros.push([x0, x1, z0, z1]);
    (o.parent || root).add(m);
    return m;
  }

  // Muro con vanos. axis 'x': corre en X, espesor en Z (c0..c1). axis 'z': corre en Z, espesor en X.
  function wall(axis, c0, c1, a0, a1, y0, y1, openings = [], mat = M.muro) {
    const seg = (s0, s1, ya, yb) => {
      const plano = ya < 0.5 && yb > 2;
      if (axis === 'x') blk(s0, s1, ya, yb, c0, c1, mat, { plan: plano });
      else blk(c0, c1, ya, yb, s0, s1, mat, { plan: plano });
    };
    const cuts = new Set([a0, a1]);
    openings.forEach((o) => { cuts.add(o.a); cuts.add(o.b); });
    const xs = [...cuts].filter((v) => v >= a0 && v <= a1).sort((p, q) => p - q);
    for (let i = 0; i < xs.length - 1; i++) {
      const s0 = xs[i], s1 = xs[i + 1];
      if (s1 - s0 < 1e-4) continue;
      const mid = (s0 + s1) / 2;
      const holes = openings.filter((o) => o.a < mid && o.b > mid).map((o) => [o.lo, o.hi]).sort((p, q) => p[0] - q[0]);
      let y = y0;
      for (const [lo, hi] of holes) { if (lo > y) seg(s0, s1, y, lo); y = Math.max(y, hi); }
      if (y < y1) seg(s0, s1, y, y1);
    }
    const cm = (c0 + c1) / 2;
    for (const o of openings) if (o.glass) pane(axis, cm, o.a, o.b, o.lo, o.hi, o.glass, o.mull ?? 0);
  }

  // Paño vidriado con marco y parantes
  function pane(axis, cm, a, b, lo, hi, glass, mull = 0) {
    const P = (s0, s1, ya, yb, t, mat, cast = true) =>
      axis === 'x' ? blk(s0, s1, ya, yb, cm - t, cm + t, mat, { cast, receive: false })
                   : blk(cm - t, cm + t, ya, yb, s0, s1, mat, { cast, receive: false });
    const g = P(a, b, lo, hi, 0.01, glass, false);
    g.userData.glass = true;
    const f = 0.05;
    P(a, b, hi - f, hi, 0.035, M.grafito);
    P(a, b, lo, lo + f, 0.035, M.grafito);
    P(a, a + f, lo, hi, 0.035, M.grafito);
    P(b - f, b, lo, hi, 0.035, M.grafito);
    if (mull > 0) {
      const n = Math.max(1, Math.round((b - a) / mull));
      for (let i = 1; i < n; i++) {
        const x = a + ((b - a) * i) / n;
        P(x - 0.025, x + 0.025, lo, hi, 0.035, M.grafito);
      }
    }
    if (axis === 'x') plan.vidrios.push([a, b, cm - 0.05, cm + 0.05]);
    else plan.vidrios.push([cm - 0.05, cm + 0.05, a, b]);
  }

  function plane(w, d, mat, x, y, z, o = {}) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), mat);
    m.rotation.x = -Math.PI / 2;
    m.position.set(x, y, z);
    m.receiveShadow = true;
    if (o.floor) m.userData.floor = true;
    root.add(m);
    return m;
  }

  function cyl(rt, rb, h, seg, mat, x, y, z, o = {}) {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg, 1, o.open ?? false), mat);
    m.position.set(x, y + h / 2, z);
    m.castShadow = o.cast ?? true;
    m.receiveShadow = true;
    (o.parent || root).add(m);
    return m;
  }

  function rbox(w, h, d, mat, x, y, z, ry = 0, rad = 0.05) {
    const m = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 3, rad), mat);
    m.position.set(x, y, z);
    m.rotation.y = ry;
    m.castShadow = m.receiveShadow = true;
    root.add(m);
    return m;
  }

  function instanced(geo, mat, matrices, o = {}) {
    const im = new THREE.InstancedMesh(geo, mat, matrices.length);
    matrices.forEach((m, i) => im.setMatrixAt(i, m));
    im.castShadow = o.cast ?? true;
    im.receiveShadow = true;
    root.add(im);
    return im;
  }
  const mat4 = (x, y, z, ry = 0, s = 1) => {
    const m = new THREE.Matrix4();
    m.compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), ry), new THREE.Vector3(s, s, s));
    return m;
  };

  // Planta estilizada: tallo + copa facetada
  function planta(x, y, z, s = 1, alta = false) {
    const g = new THREE.Group();
    const mat = r() > 0.5 ? M.planta : M.plantaOscura;
    if (alta) {
      cyl(0.03 * s, 0.04 * s, 1.3 * s, 8, M.tronco, 0, 0, 0, { parent: g });
      for (let i = 0; i < 4; i++) {
        const m = new THREE.Mesh(new THREE.IcosahedronGeometry((0.32 + r() * 0.2) * s, 0), mat);
        m.position.set((r() - 0.5) * 0.5 * s, (1.1 + i * 0.32 + r() * 0.2) * s, (r() - 0.5) * 0.5 * s);
        m.rotation.set(r() * 3, r() * 3, r() * 3);
        m.castShadow = m.receiveShadow = true;
        g.add(m);
      }
    } else {
      for (let i = 0; i < 5; i++) {
        const m = new THREE.Mesh(new THREE.IcosahedronGeometry((0.18 + r() * 0.14) * s, 0), mat);
        m.position.set((r() - 0.5) * 0.45 * s, (0.15 + r() * 0.35) * s, (r() - 0.5) * 0.45 * s);
        m.rotation.set(r() * 3, r() * 3, r() * 3);
        m.castShadow = m.receiveShadow = true;
        g.add(m);
      }
    }
    g.position.set(x, y, z);
    root.add(g);
    return g;
  }

  function maceta(x, z, s = 1, alta = true) {
    cyl(0.5 * s, 0.44 * s, 0.6 * s, 40, M.blancoCalido, x, 0, z);
    cyl(0.46 * s, 0.46 * s, 0.02, 32, M.tronco, x, 0.58 * s, z, { cast: false });
    planta(x, 0.6 * s, z, s * 1.1, alta);
  }

  function arbol(x, z, s = 1, y = 0) {
    const g = new THREE.Group();
    cyl(0.1 * s, 0.14 * s, 2.8 * s, 10, M.tronco, 0, 0, 0, { parent: g });
    const n = 3 + Math.floor(r() * 2);
    for (let i = 0; i < n; i++) {
      const m = new THREE.Mesh(new THREE.IcosahedronGeometry((1.3 + r() * 0.8) * s, 1), r() > 0.4 ? M.planta : M.plantaOscura);
      m.position.set((r() - 0.5) * 1.6 * s, (3.4 + r() * 1.4) * s, (r() - 0.5) * 1.6 * s);
      m.rotation.set(r() * 3, r() * 3, r() * 3);
      m.scale.y = 0.85;
      m.castShadow = m.receiveShadow = true;
      g.add(m);
    }
    g.position.set(x, y, z);
    root.add(g);
  }

  // ── cielo, niebla, suelo ─────────────────────────────────
  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(900, 32, 16),
    new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false, fog: false,
      uniforms: {
        top: { value: new THREE.Color(C.cielo) }, bottom: { value: new THREE.Color(C.horizonte) },
        sunDir: { value: new THREE.Vector3(-0.9, 1.25, 0.33).normalize() }, sunCol: { value: new THREE.Color('#fff1de') }, sunGlow: { value: 1 },
      },
      vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
      fragmentShader: 'uniform vec3 top;\nuniform vec3 bottom;\nuniform vec3 sunDir;\nuniform vec3 sunCol;\nuniform float sunGlow;\nvarying vec3 vP;\nvoid main(){\n vec3 d = normalize(vP);\n float h = clamp(d.y*1.5+0.02,0.0,1.0);\n h = pow(h,0.75);\n vec3 c = mix(bottom, top, h);\n float s = max(dot(d, sunDir), 0.0);\n c += sunCol * (pow(s, 900.0) * 6.0 + pow(s, 10.0) * 0.22 * sunGlow + pow(s, 3.0) * 0.06 * sunGlow);\n gl_FragColor = vec4(c, 1.0);\n #include <colorspace_fragment>\n}',
    })
  );
  sky.renderOrder = -1;
  scene.add(sky);
  scene.fog = new THREE.Fog(C.horizonte, 80, 360);

  const suelo = plane(1400, 1400, new THREE.MeshStandardMaterial({ color: '#cdcac3', roughness: 1 }), 0, -0.03, 0, { floor: true });

  // ── ciudad alrededor (maqueta) ───────────────────────────
  {
    const cell = 30;
    for (let gx = -8; gx <= 8; gx++) for (let gz = -8; gz <= 8; gz++) {
      const cx = gx * cell, cz = gz * cell + 12;
      if (Math.abs(cx) < 52 && cz > -52 && cz < 56) continue; // terreno de la escuela y la calle
      if (cz > 32 && cz < 58) continue; // calle frente a la escuela
      const d = Math.hypot(cx, cz);
      if (d > 260) continue;
      const n = 1 + Math.floor(r() * 2);
      for (let k = 0; k < n; k++) {
        const w = 8 + r() * 14, dd = 8 + r() * 14;
        const h = 7 + r() * (d < 90 ? 22 : 40);
        const ox = (r() - 0.5) * (cell - w), oz = (r() - 0.5) * (cell - dd);
        const mat = M.ciudad[Math.floor(r() * M.ciudad.length)];
        const m = blk(cx + ox - w / 2, cx + ox + w / 2, 0, h, cz + oz - dd / 2, cz + oz + dd / 2, mat, { cast: d < 110 });
        m.userData.ciudad = true;
      }
    }
    // frente de manzana al otro lado de la calle
    let x = -70;
    while (x < 70) {
      const w = 9 + r() * 10, h = 10 + r() * 16;
      const m = blk(x, x + w - 0.6, 0, h, 53, 66, M.ciudad[Math.floor(r() * 4)], { cast: true });
      m.userData.ciudad = true;
      x += w;
    }
  }

  // ── calle y veredas ──────────────────────────────────────
  blk(-300, 300, -0.03, 0.12, 34, 37.6, M.hormigon, { floor: true });
  plane(600, 10, M.asfalto, 0, 0.0, 42.6);
  for (let x = -96; x < 96; x += 6) blk(x, x + 2.6, 0.0, 0.012, 42.5, 42.7, M.muro, { cast: false });
  blk(-300, 300, -0.03, 0.12, 47.6, 52, M.hormigon);
  for (let x = -54; x <= 54; x += 18) {
    cyl(0.06, 0.08, 6.2, 10, M.grafito, x, 0.12, 36.9);
    blk(x - 0.05, x + 0.05, 6.1, 6.2, 36.2, 36.9, M.grafito);
    blk(x - 0.18, x + 0.18, 5.98, 6.1, 35.8, 36.4, M.grafito);
  }

  // ── plaza de acceso ──────────────────────────────────────
  plane(84, 25.8, M.pisoExt(84, 25.8), 0, 0.0, 21.1, { floor: true });
  const cantero = (x0, x1, z0, z1) => {
    blk(x0, x1, 0, 0.42, z0, z1, M.blancoCalido);
    blk(x0 + 0.25, x1 - 0.25, 0.42, 0.45, z0 + 0.25, z1 - 0.25, M.cesped, { cast: false });
  };
  cantero(-34, -6.5, 12.5, 31);
  cantero(6.5, 34, 12.5, 31);
  [[-25, 16, 1.05], [-15.5, 19.5, 0.95], [-27.5, 26.8, 1.15], [-11.5, 27.2, 0.9], [-20.5, 24.2, 1]].forEach(([x, z, s]) => arbol(x, z, s, 0.44));
  [[24.5, 15.5, 1.1], [14.5, 20, 0.92], [28, 27, 1.05], [11.2, 26.5, 1], [20, 24.6, 0.9]].forEach(([x, z, s]) => arbol(x, z, s, 0.44));
  blk(-6.2, -5.0, 0, 0.45, 15, 18.6, M.hormigon);
  blk(5.0, 6.2, 0, 0.45, 19, 22.6, M.hormigon);
  blk(-6.2, -5.0, 0, 0.45, 24, 27.6, M.hormigon);
  // monolito con el nombre
  blk(-5.6, -5.15, 0, 2.6, 9.6, 11.2, M.muroLiso);
  {
    const t = T.texto({
      w: 512, h: 832, color: C.grafito,
      lines: [
        { text: 'ESCUELA', k: 'display', px: 74, x: 44, y: 140 },
        { text: 'NODO', k: 'display', px: 74, x: 44, y: 226, accent: true },
        { text: 'SECUNDARIA · NODO 014', k: 'mono', px: 24, x: 46, y: 300, spacing: 3 },
        { text: '→ ENTRADA', k: 'mono', px: 24, x: 46, y: 760, spacing: 3 },
      ],
    });
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 2.6), new THREE.MeshStandardMaterial({ map: t, transparent: true, roughness: 0.9 }));
    m.rotation.y = Math.PI / 2;
    m.position.set(-5.14, 1.3, 10.4);
    root.add(m);
  }

  // ── edificio: envolvente ─────────────────────────────────
  plane(43.6, 33.6, M.pisoInt(43.6, 33.6), 0, 0.006, -9, { floor: true });
  const H_EXT = 10.7;
  // fachada sur
  wall('x', 7.8, 8.2, -22.2, 22.2, 0, H_EXT, [
    { a: -20.5, b: -9.5, lo: 0.9, hi: 3.5, glass: M.vidrio, mull: 1.8 },
    { a: -3, b: 3, lo: 0, hi: 4.2 },
    { a: 9.5, b: 20.5, lo: 0.5, hi: 3.0, glass: M.vidrio, mull: 2.2 },
    { a: -7.6, b: 7.6, lo: 4.8, hi: 9.4, glass: M.vidrioTinte, mull: 1.9 },
  ]);
  wall('x', -26.2, -25.8, -22.2, 22.2, 0, H_EXT, []);
  wall('z', -22.2, -21.8, -25.8, 7.8, 0, H_EXT, [{ a: -10, b: 6, lo: 0.9, hi: 3.5, glass: M.vidrio, mull: 2 }]);
  wall('z', 21.8, 22.2, -25.8, 7.8, 0, H_EXT, []);

  // banda superior oscura + pantalla modular (eco del "monolito")
  blk(-22.2, -7.6, 4.5, 10.45, 8.2, 8.23, M.vidrioOscuro, { cast: false });
  blk(7.6, 22.2, 4.5, 10.45, 8.2, 8.23, M.vidrioOscuro, { cast: false });
  blk(-7.6, 7.6, 4.5, 4.8, 8.2, 8.23, M.vidrioOscuro, { cast: false });
  blk(-7.6, 7.6, 9.4, 10.45, 8.2, 8.23, M.vidrioOscuro, { cast: false });
  blk(-22.2, 22.2, 4.2, 4.5, 8.2, 8.8, M.muro);
  {
    const n = 50, mats = [];
    for (let i = 0; i < n; i++) mats.push(mat4(-22.14 + (44.28 * i) / (n - 1), 7.475, 8.5));
    instanced(new THREE.BoxGeometry(0.12, 5.95, 0.6), M.muro, mats);
    for (let k = 1; k <= 6; k++) blk(-22.2, 22.2, 4.45 + k * 0.85, 4.55 + k * 0.85, 8.2, 8.8, M.muro);
    blk(-22.2, 22.2, 10.45, H_EXT, 8.2, 8.8, M.muro);
  }
  // pórtico de entrada
  blk(-3.6, -3.0, 0, 4.8, 8.2, 9.9, M.muro);
  blk(3.0, 3.6, 0, 4.8, 8.2, 9.9, M.muro);
  blk(-3.6, 3.6, 4.2, 4.8, 8.8, 9.9, M.muro);
  const naranjaUmbral = M.naranja.clone();
  blk(-2.95, 2.95, 4.16, 4.2, 9.1, 9.22, naranjaUmbral, { cast: false });

  // techo con óculo (hall) y ranuras de luz (proyección)
  {
    const s = new THREE.Shape();
    s.moveTo(-21.8, -7.8); s.lineTo(21.8, -7.8); s.lineTo(21.8, 25.8); s.lineTo(-21.8, 25.8); s.lineTo(-21.8, -7.8);
    const o = new THREE.Path(); o.absarc(0, 0, 2.6, 0, Math.PI * 2, true); s.holes.push(o);
    for (const c of [-4.5, 0, 4.5]) {
      const h = new THREE.Path();
      h.moveTo(c - 0.3, 11); h.lineTo(c - 0.3, 24); h.lineTo(c + 0.3, 24); h.lineTo(c + 0.3, 11); h.lineTo(c - 0.3, 11);
      s.holes.push(h);
    }
    const g = new THREE.ExtrudeGeometry(s, { depth: 0.6, bevelEnabled: false, curveSegments: 64 });
    g.rotateX(-Math.PI / 2);
    const m = new THREE.Mesh(g, M.techo);
    m.position.y = ROOF_Y;
    m.castShadow = m.receiveShadow = true;
    root.add(m);
    const well = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 2.6, 1.2, 64, 1, true), M.perfo(18, 1.3));
    well.material.side = THREE.DoubleSide;
    well.position.set(0, ROOF_Y + 0.6, 0);
    well.castShadow = true;
    root.add(well);
  }

  // ── interiores: muros y losas ────────────────────────────
  wall('z', -8.15, -7.85, -25.8, 7.8, 0, ROOF_Y, [{ a: 0, b: 4, lo: 0, hi: 3.4 }], M.muroInt);
  wall('z', 7.85, 8.15, -8.15, 7.8, 0, ROOF_Y, [{ a: 0, b: 4, lo: 0, hi: 3.4 }], M.muroInt);
  wall('x', -8.15, -7.85, -7.85, 7.85, 0, ROOF_Y, [{ a: -4, b: 4, lo: 0, hi: 5.6 }], M.muroInt);
  wall('x', -12.15, -11.85, -21.8, -8.15, 0, 4.2, [], M.muroInt);
  wall('x', -6.15, -5.85, 8.15, 21.8, 0, 4.2, [], M.muroInt);
  blk(7.85, 8.15, 4.2, ROOF_Y, -25.8, -8.15, M.muroInt);
  blk(7.75, 8.25, 0, 4.2, -20.25, -19.75, M.muroInt, { plan: true });
  blk(7.75, 8.25, 0, 4.2, -14.25, -13.75, M.muroInt, { plan: true });
  blk(-21.8, -8.15, 4.2, 4.5, -11.85, 7.8, M.techo);
  blk(8.15, 21.8, 4.2, 4.5, -25.8, -5.85, M.techo);
  blk(8.15, 21.8, 3.4, 3.7, -5.85, 7.8, M.techo);
  // cerramientos vidriados de la sala del nodo
  pane('z', 10, -25.8, -10.05, 0, 4.2, M.vidrio, 1.75);
  pane('x', -10, 10.05, 21.8, 0, 4.2, M.vidrio, 1.95);

  // ── HALL ─────────────────────────────────────────────────
  {
    // umbral del nodo: dos monolitos con línea naranja
    blk(-2.4, -2.05, 0, 2.5, 5.3, 6.3, M.blancoBrillo);
    blk(2.05, 2.4, 0, 2.5, 5.3, 6.3, M.blancoBrillo);
    const lu = M.naranja.clone();
    blk(-2.05, -2.03, 0.3, 2.2, 5.72, 5.88, lu, { cast: false });
    blk(2.03, 2.05, 0.3, 2.2, 5.72, 5.88, lu, { cast: false });
    tick.push((t, dt) => {
      sistema.destello = Math.max(0, sistema.destello - dt * 1.4);
      lu.emissiveIntensity = 1.2 + 0.9 * (0.5 + 0.5 * Math.sin(t * 1.4)) + 9 * sistema.destello * sistema.destello;
      naranjaUmbral.emissiveIntensity = lu.emissiveIntensity;
    });
    // gradas
    blk(-7.85, -5.45, 0, 0.45, -7.6, -0.6, M.hormigon);
    blk(-7.85, -6.25, 0.45, 0.9, -7.6, -0.6, M.hormigon);
    blk(-7.85, -7.05, 0.9, 1.35, -7.6, -0.6, M.hormigon);
    rbox(0.55, 0.1, 0.55, M.tela, -5.9, 0.5, -5.2, 0.2);
    rbox(0.55, 0.1, 0.55, M.telaArena, -6.6, 0.95, -2.6, -0.3);
    rbox(0.55, 0.1, 0.55, M.telaClara, -5.85, 0.5, -1.6, 0.1);
    // banco y macetas
    blk(6.85, 7.85, 0, 0.45, -7.2, -1.2, M.hormigon);
    maceta(5.7, 5.9, 1.05);
    maceta(-5.7, 5.9, 0.95);
    maceta(6.6, -7.0, 0.9, false);
    // anillo en el piso bajo el óculo
    const ring = new THREE.Mesh(new THREE.RingGeometry(2.57, 2.6, 128), M.gris);
    ring.rotation.x = -Math.PI / 2; ring.position.set(0, 0.016, 0);
    root.add(ring);
    // ventanas del piso superior (grilla modular)
    const mats = [];
    for (let i = 0; i < 9; i++) for (const y of [5.7, 7.5]) {
      const z = -6.4 + i * 1.6;
      mats.push(mat4(-7.83, y, z));
      mats.push(mat4(7.83, y, z));
    }
    for (let i = 0; i < 9; i++) mats.push(mat4(-6.4 + i * 1.6, 7.5, -7.83, Math.PI / 2));
    instanced(new THREE.BoxGeometry(0.04, 1.1, 1.1), M.perfo(1, 1), mats, { cast: false });
  }

  // ── AULA-TALLER ──────────────────────────────────────────
  const mesa = (cx, cz, w = 2.8, d = 1.2) => {
    rbox(w, 0.05, d, M.blancoSatin, cx, 0.745, cz, 0, 0.02);
    blk(cx - w / 2 + 0.15, cx - w / 2 + 0.21, 0, 0.72, cz - d / 2 + 0.1, cz + d / 2 - 0.1, M.grafitoSatin);
    blk(cx + w / 2 - 0.21, cx + w / 2 - 0.15, 0, 0.72, cz - d / 2 + 0.1, cz + d / 2 - 0.1, M.grafitoSatin);
    for (const sx of [-0.75, 0.75]) for (const sz of [-0.98, 0.98]) {
      rbox(0.36, 0.46, 0.36, r() > 0.6 ? M.blancoBrillo : M.grafitoSatin, cx + sx + (r() - 0.5) * 0.15, 0.23, cz + sz + (r() - 0.5) * 0.1, r() * 0.5, 0.045);
    }
  };
  {
    mesa(-17.6, 3.6); mesa(-11.8, 3.6); mesa(-17.6, -3.8); mesa(-11.8, -3.8);
    // mesa de Lu: pilas de prendas por talle (en un grupo aparte: el test de tareas las saca de la mesa)
    const telas = [M.tela, M.telaClara, M.gris, M.telaArena];
    const pilasMesa = new THREE.Group();
    pilasMesa.name = 'pilas-mesa';
    root.add(pilasMesa);
    sistema.pilasMesa = pilasMesa;
    for (let k = 0; k < 4; k++) {
      const n = 2 + ((k * 7) % 4);
      for (let j = 0; j < n; j++) {
        const m = blk(-12.95 + k * 0.42, -12.63 + k * 0.42, 0.77 + j * 0.036, 0.803 + j * 0.036, 3.86, 4.11, telas[(k + j) % 4], { parent: pilasMesa });
        m.userData.noFusionar = true;
      }
    }
    blk(-11.05, -10.75, 0.77, 0.78, 3.12, 3.34, M.grafito); // cuaderno
    // perchero con prendas (proyecto de talles)
    blk(-14.8, -14.7, 0, 1.62, 2.3, 2.36, M.metal);
    blk(-14.8, -14.7, 0, 1.62, 4.84, 4.9, M.metal);
    blk(-15.05, -14.45, 0, 0.04, 2.27, 2.39, M.metal);
    blk(-15.05, -14.45, 0, 0.04, 4.81, 4.93, M.metal);
    const riel = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 2.6, 8), M.metal);
    riel.rotation.x = Math.PI / 2; riel.position.set(-14.75, 1.58, 3.6); riel.castShadow = true;
    root.add(riel);
    const prendas = [M.tela, M.telaClara, M.gris, M.grafitoMate, M.telaArena, M.telaClara, M.tela, M.gris, M.blancoCalido];
    prendas.forEach((pm, i) => {
      rbox(0.5, 0.78, 0.035, pm, -14.75, 1.15, 2.6 + i * 0.25, (r() - 0.5) * 0.25, 0.015);
    });
    // estantería modular contra el muro norte
    const z0 = -11.85, z1 = -11.45;
    for (let i = 0; i <= 10; i++) { const x = -21.4 + i * 1.24; blk(x - 0.02, x + 0.02, 0, 2.4, z0, z1, M.muroInt); }
    for (const y of [0.0, 0.6, 1.2, 1.8, 2.37]) blk(-21.42, -8.98, y, y + 0.03, z0, z1, M.muroInt);
    for (let i = 0; i < 10; i++) for (let j = 0; j < 4; j++) {
      if (r() > 0.62) continue;
      const x = -21.4 + i * 1.24 + 0.62;
      const m = r() > 0.85 ? M.blancoBrillo : [M.gris, M.grafitoMate, M.blancoCalido][Math.floor(r() * 3)];
      blk(x - 0.48, x + 0.48, j * 0.6 + 0.03, j * 0.6 + 0.4, z0 + 0.04, z1 - 0.02, m);
    }
    // luminarias lineales
    for (const z of [3.6, -3.8]) {
      blk(-20.5, -9.5, 4.14, 4.2, z - 0.09, z + 0.09, M.luz, { cast: false });
      rectLuz('#fff4e6', 4.2, 11, 0.9, -15, 4.13, z);
    }
    maceta(-20.8, -10.6, 1, true);
  }

  // ── ZONA DE PROYECCIÓN ───────────────────────────────────
  {
    blk(-4.25, 4.25, 0.8, 4.4, -25.8, -25.66, M.grafito);
    blk(-4.12, 4.12, 0.93, 4.27, -25.66, -25.62, M.pizarron);
    const barra = M.naranja.clone();
    blk(-4.05, -2.6, 0.97, 0.99, -25.62, -25.605, barra, { cast: false });
    const t = T.texto({
      w: 2048, h: 820,
      lines: [
        { text: 'PIZARRÓN · ZONA DE PROYECCIÓN', k: 'mono', px: 30, x: 70, y: 96, color: 'rgba(208,210,214,0.55)', spacing: 4 },
        { text: 'EN ESPERA', k: 'mono', px: 30, x: 1700, y: 96, color: 'rgba(232,116,59,0.9)', spacing: 4, dot: [1676, 86, 9] },
      ],
    });
    const p = new THREE.Mesh(new THREE.PlaneGeometry(8.24, 3.3), new THREE.MeshBasicMaterial({ map: t, transparent: true, toneMapped: false }));
    p.position.set(0, 2.6, -25.6);
    sistema.pantalla = p;
    root.add(p);
    // disco de proyección en el piso
    const disco = new THREE.Mesh(new THREE.CircleGeometry(3.4, 96), new THREE.MeshStandardMaterial({ color: '#c6c6c2', roughness: 0.32, metalness: 0.05 }));
    disco.rotation.x = -Math.PI / 2; disco.position.set(0, 0.016, -17); disco.receiveShadow = true;
    disco.userData.floor = true;
    root.add(disco);
    const aro = new THREE.Mesh(new THREE.RingGeometry(3.4, 3.46, 160), M.naranja);
    aro.rotation.x = -Math.PI / 2; aro.position.set(0, 0.02, -17);
    root.add(aro);
    // gradas en arco, con pasillo central
    const sector = (r0, r1, a0, a1, h) => {
      const s = new THREE.Shape();
      const A0 = (a0 * Math.PI) / 180, A1 = (a1 * Math.PI) / 180;
      s.absarc(0, 0, r1, A0, A1, false);
      s.absarc(0, 0, r0, A1, A0, true);
      const g = new THREE.ExtrudeGeometry(s, { depth: h, bevelEnabled: false, curveSegments: 40 });
      g.rotateX(-Math.PI / 2);
      const m = new THREE.Mesh(g, M.hormigon);
      m.position.set(0, 0, -17);
      m.castShadow = m.receiveShadow = true;
      root.add(m);
    };
    for (const [a0, a1] of [[200, 255], [285, 340]]) {
      sector(5, 6, a0, a1, 0.42);
      sector(6, 7, a0, a1, 0.84);
      sector(7, 8, a0, a1, 1.26);
    }
    // aro de luz suspendido
    const halo = new THREE.Mesh(new THREE.TorusGeometry(3.3, 0.035, 8, 160), M.luz);
    halo.rotation.x = Math.PI / 2; halo.position.set(0, 7.0, -17);
    root.add(halo);
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2;
      cyl(0.006, 0.006, ROOF_Y - 7.0, 4, M.grafito, Math.cos(a) * 3.3, 7.0, -17 + Math.sin(a) * 3.3, { cast: false });
    }
    rectLuz('#fff3e3', 1.6, 7, 7, 0, 6.95, -17);
    maceta(-6.9, -24.6, 1.1, true);
    maceta(6.6, -24.8, 0.95, false);
  }

  // ── SALA DEL NODO ────────────────────────────────────────
  {
    blk(10.05, 21.8, 0, 0.12, -25.8, -10.05, M.pisoTecnico(11.75, 15.75), { floor: true });
    const leds = [];
    for (const xr of [13.55, 17.75]) {
      for (let i = 0; i < 10; i++) {
        const z = -21.06 + i * 0.68;
        if (xr === 13.55 && Math.abs(z + 18) < 0.8) continue; // hueco frente al núcleo
        // cuerpo + frente perforado como piezas separadas (así se fusionan con el resto)
        blk(xr - 0.55, xr + 0.55, 0.12, 2.22, z - 0.32, z + 0.32, M.grafitoMate);
        blk(xr - 0.562, xr - 0.55, 0.14, 2.2, z - 0.31, z + 0.31, M.frenteRack, { cast: false });
        for (const dz of [-0.18, 0.18]) for (let k = 0; k < 10; k++) leds.push([xr - 0.566, 0.42 + k * 0.17, z + dz]);
      }
      blk(xr - 0.55, xr + 0.55, 2.75, 2.8, -21.6, -14.3, M.grafito);
    }
    const ledMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(0.004, 0.02, 0.05), new THREE.MeshBasicMaterial({ color: '#ffffff', toneMapped: false }), leds.length);
    const cBlanco = new THREE.Color('#dfe6ee'), cTenue = new THREE.Color('#3b4048'), cNaranja = new THREE.Color(C.naranja).multiplyScalar(1.4);
    leds.forEach((p, i) => {
      ledMesh.setMatrixAt(i, mat4(p[0], p[1], p[2]));
      ledMesh.setColorAt(i, r() > 0.9 ? cNaranja : r() > 0.4 ? cBlanco : cTenue);
    });
    root.add(ledMesh);
    let acc = 0;
    tick.push((t, dt) => {
      acc += dt;
      if (acc < 0.12) return;
      acc = 0;
      for (let k = 0; k < 18; k++) {
        const i = Math.floor(Math.random() * leds.length);
        ledMesh.setColorAt(i, Math.random() > 0.93 ? cNaranja : Math.random() > 0.45 ? cBlanco : cTenue);
      }
      ledMesh.instanceColor.needsUpdate = true;
    });
    // núcleo del nodo: monolito blanco con ranura naranja que late
    blk(10.95, 11.85, 0.12, 2.75, -18.45, -17.55, M.blancoBrillo);
    const nucleo = M.naranja.clone();
    blk(10.93, 10.95, 0.45, 2.45, -18.035, -17.965, nucleo, { cast: false });
    blk(10.93, 11.87, 2.55, 2.57, -18.47, -17.53, nucleo, { cast: false });
    tick.push((t) => { nucleo.emissiveIntensity = 1.0 + 1.6 * Math.pow(0.5 + 0.5 * Math.sin(t * 2.2), 3); });
    for (const x of [11.6, 15.6, 19.6]) blk(x - 0.07, x + 0.07, 4.14, 4.2, -24.5, -11.2, M.luzFria, { cast: false });
    rectLuz('#e6eeff', 3.2, 10, 13, 15.9, 4.13, -18);
    // placa sobre el vidrio
    const t = T.texto({
      w: 768, h: 216, bg: 'rgba(236,235,231,0.92)', color: C.grafito,
      lines: [
        { text: 'SALA DEL NODO', k: 'display', px: 46, x: 34, y: 92 },
        { text: 'SERVIDOR LOCAL · EN LÍNEA', k: 'mono', px: 22, x: 36, y: 162, spacing: 3, dot: [560, 154, 8] },
      ],
    });
    const placa = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.42), new THREE.MeshStandardMaterial({ map: t, transparent: true, roughness: 0.8 }));
    placa.rotation.y = -Math.PI / 2;
    placa.position.set(9.955, 1.75, -20.5);
    root.add(placa);
  }

  // ── RINCÓN TRANQUILO ─────────────────────────────────────
  {
    blk(9.6, 20.4, 0, 0.46, 6.95, 7.8, M.blancoCalido);
    [[10.6, M.tela], [12.4, M.telaClara], [15.7, M.telaArena], [18.7, M.tela]].forEach(([x, m]) => rbox(1.5, 0.14, 0.62, m, x, 0.53, 7.37, 0, 0.05));
    rbox(0.9, 0.5, 0.18, M.telaClara, 10.6, 0.82, 7.62, 0, 0.07).rotation.x = -0.18;
    const sillon = (x, z) => {
      rbox(0.9, 0.38, 0.84, M.tela, x, 0.19, z, 0, 0.06);
      rbox(0.68, 0.12, 0.62, M.telaClara, x, 0.44, z + 0.05, 0, 0.05);
      const b = rbox(0.9, 0.6, 0.18, M.tela, x, 0.62, z - 0.37, 0, 0.07); b.rotation.x = -0.14;
      rbox(0.14, 0.5, 0.84, M.tela, x - 0.42, 0.42, z, 0, 0.06);
      rbox(0.14, 0.5, 0.84, M.tela, x + 0.42, 0.42, z, 0, 0.06);
    };
    sillon(13.4, 4.1);
    sillon(16.8, 4.1);
    cyl(0.38, 0.38, 0.36, 40, M.blancoSatin, 15.1, 0, 4.5);
    blk(14.95, 15.25, 0.36, 0.40, 4.35, 4.6, M.grafito);
    // listones acústicos en el muro este
    const mats = [];
    for (let z = -5.6; z <= 7.5; z += 0.2) mats.push(mat4(21.68, 1.7, z));
    instanced(new THREE.BoxGeometry(0.2, 3.4, 0.06), M.listones, mats);
    maceta(20.5, -4.7, 1.15, true);
    // biblioteca baja
    blk(8.15, 8.55, 0, 1.12, -5.6, -0.6, M.blancoCalido);
    let z = -5.4;
    while (z < -1.1) {
      const w = 0.04 + r() * 0.05, h = 0.2 + r() * 0.12;
      blk(8.2, 8.48, 1.12, 1.12 + h, z, z + w, [M.grafitoMate, M.gris, M.telaClara, M.telaArena][Math.floor(r() * 4)]);
      z += w + 0.006;
    }
    planta(8.35, 1.12, -0.95, 0.7);
    // lámpara colgante
    cyl(0.005, 0.005, 0.95, 4, M.grafito, 15.1, 2.45, 4.5, { cast: false });
    cyl(0.34, 0.34, 0.05, 48, M.grafitoSatin, 15.1, 2.4, 4.5);
    const pant = new THREE.Mesh(new THREE.CircleGeometry(0.3, 40), M.luzCalida);
    pant.rotation.x = Math.PI / 2; pant.position.set(15.1, 2.395, 4.5);
    root.add(pant);
    rectLuz('#ffd7ad', 1.5, 9, 5, 15, 3.38, 1.5);
  }

  // ── ANTENA DEL NODO en el techo ─────────────────────────
  {
    const ax = 15.5, az = 3.2, y0 = ROOF_Y + 0.6;
    blk(ax - 0.6, ax + 0.6, y0, y0 + 1.2, az - 0.6, az + 0.6, M.grafito);
    cyl(0.07, 0.1, 8.6, 12, M.plata, ax, y0 + 1.2, az);
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2 + 0.4;
      const m = new THREE.Mesh(new THREE.BoxGeometry(0.32, 1.5, 0.1), M.blancoBrillo);
      m.position.set(ax + Math.cos(a) * 0.32, y0 + 7.6, az + Math.sin(a) * 0.32);
      m.rotation.y = -a + Math.PI / 2;
      m.castShadow = true;
      root.add(m);
    }
    const plato = new THREE.Mesh(new THREE.SphereGeometry(0.5, 24, 10, 0, Math.PI * 2, 0, Math.PI / 2.8), M.blancoBrillo.clone());
    plato.material.side = THREE.DoubleSide;
    plato.position.set(ax + 0.35, y0 + 5.2, az + 0.25);
    plato.rotation.set(-Math.PI / 2 + 0.4, 0, -0.7);
    plato.castShadow = true;
    root.add(plato);
    blk(ax - 0.5, ax + 0.5, y0 + 8.5, y0 + 8.56, az - 0.03, az + 0.03, M.plata);
    const faro = M.naranja.clone();
    const b = new THREE.Mesh(new THREE.SphereGeometry(0.1, 16, 12), faro);
    b.position.set(ax, y0 + 9.9, az);
    root.add(b);
    tick.push((t) => { faro.emissiveIntensity = (t % 1.6) < 0.14 ? 6 : 0.5; });
  }

  // ── TIPOGRAFÍA EN EL MUNDO (Archivo expandida + mono) ───
  function cartel(lines, w, h, x, y, z, ry, { bg = null, ppm = 380, color = C.grafito } = {}) {
    const cw = Math.min(2048, Math.round(w * ppm));
    const k = cw / w;
    const ch = Math.round(h * k);
    const t = T.texto({
      w: cw, h: ch, bg, color,
      lines: lines.map((l) => ({
        ...l,
        x: l.x * k, y: l.y * k,
        k: l.fk[0], px: l.fk[1] * k,
        spacing: l.spacing ? l.spacing * k : 0,
        dot: l.dot ? l.dot.map((v) => v * k) : undefined,
      })),
    });
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(w, h),
      new THREE.MeshStandardMaterial({ map: t, transparent: true, roughness: 0.85, polygonOffset: true, polygonOffsetFactor: -2 })
    );
    m.position.set(x, y, z);
    m.rotation.y = ry;
    root.add(m);
    return m;
  }
  // pórtico de entrada
  cartel([
    { text: 'ESCUELA-NODO', fk: ['display', 0.3], x: 0.12, y: 0.37 },
    { text: 'SECUNDARIA · NODO 014', fk: ['mono', 0.085], x: 4.55, y: 0.34, spacing: 0.012 },
  ], 6.6, 0.5, 0, 4.5, 9.905, 0);
  // fichas sobre las puertas del hall (como los rótulos del moodboard)
  const ficha = (txt, x, z, ry, w) => cartel([{ text: txt, fk: ['mono', 0.11], x: 0.14, y: 0.215, spacing: 0.02, color: '#ecebe7' }], w, 0.32, x, 3.78, z, ry, { bg: C.grafito });
  ficha('03 · AULA-TALLER', -7.84, 2, Math.PI / 2, 2.25);
  ficha('05 · RINCÓN TRANQUILO', 7.84, 2, -Math.PI / 2, 2.85);
  // supergráficas
  cartel([
    { text: '04 · ACCESO AL NODO', fk: ['mono', 0.12], x: 0.05, y: 0.2, spacing: 0.03 },
    { text: 'ZONA DE PROYECCIÓN', fk: ['display', 0.5], x: 0.0, y: 0.86 },
  ], 9.4, 1.0, 0, 6.3, -7.84, 0);
  cartel([
    { text: '03 · TALLER DE PROYECTOS', fk: ['mono', 0.11], x: 0.05, y: 0.18, spacing: 0.025 },
    { text: 'AULA-TALLER', fk: ['display', 0.52], x: 0.0, y: 0.82 },
  ], 7.4, 0.95, -15.3, 3.15, -11.84, 0);
  cartel([
    { text: '05 · VOZ BAJA · MODO FOCO', fk: ['mono', 0.09], x: 0.04, y: 0.15, spacing: 0.02 },
    { text: 'RINCÓN TRANQUILO', fk: ['display', 0.3], x: 0.0, y: 0.55 },
  ], 6.2, 0.65, 15.2, 2.55, -5.84, 0);

  // ── fachada: celdas iluminadas (se encienden en la tarde) ─
  const fachadaLuz = (() => {
    const filas = [[4.5, 5.3], [5.4, 6.15], [6.25, 7.0], [7.1, 7.85], [7.95, 8.7], [8.8, 9.55], [9.65, 10.45]];
    const n = 50, xs = [];
    for (let i = 0; i < n; i++) xs.push(-22.14 + (44.28 * i) / (n - 1));
    const celdas = [];
    for (let i = 0; i < n - 1; i++) {
      const cx = (xs[i] + xs[i + 1]) / 2;
      if (Math.abs(cx) < 7.7) continue;
      for (const [a, b] of filas) if (r() < 0.34) celdas.push([cx, (a + b) / 2, b - a - 0.06]);
    }
    const im = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ color: '#ffffff' }), celdas.length);
    const cal = new THREE.Color('#ffd9b0'), fri = new THREE.Color('#e9efff');
    celdas.forEach(([x, y, h], i) => {
      im.setMatrixAt(i, new THREE.Matrix4().compose(new THREE.Vector3(x, y, 8.236), new THREE.Quaternion(), new THREE.Vector3(0.74, h, 1)));
      im.setColorAt(i, (r() > 0.3 ? cal : fri).clone().multiplyScalar(0.7 + r() * 0.5));
    });
    im.visible = false;
    root.add(im);
    return im;
  })();

  // techo luminoso del hall (suave; fuerte en la tarde)
  rectLuz('#fff4e6', 0.35, 13, 13, 0, 9.45, 0);

  // ── luces ────────────────────────────────────────────────
  const hemi = new THREE.HemisphereLight('#e7edf3', '#b9b4ab', 0.85);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight('#fff2e0', 3.4);
  const sunDir = new THREE.Vector3(-0.9, 1.25, 0.33).normalize();
  sun.target.position.set(0, 0, -6);
  sun.position.copy(sun.target.position).addScaledVector(sunDir, 140);
  sun.castShadow = true;
  sun.shadow.mapSize.set(4096, 4096);
  const sc = sun.shadow.camera;
  sc.left = -54; sc.right = 54; sc.top = 54; sc.bottom = -54; sc.near = 40; sc.far = 260;
  sun.shadow.bias = -0.0003;
  sun.shadow.normalBias = 0.035;
  sun.shadow.radius = 2;
  scene.add(sun, sun.target);

  const emisivos = [M.luz, M.luzFria, M.luzCalida].map((mat) => ({ mat, base: mat.emissiveIntensity }));
  // geometría liviana solo para el cursor del piso (pisos + muros como cajas simples)
  const pick = [];
  root.traverse((o) => { if (o.isMesh && o.userData.floor) pick.push(o); });
  const pickMat = new THREE.MeshBasicMaterial();
  for (const [x0, x1, z0, z1] of [...plan.muros, ...plan.vidrios]) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(Math.max(x1 - x0, 0.05), 3, Math.max(z1 - z0, 0.05)), pickMat);
    m.position.set((x0 + x1) / 2, 1.5, (z0 + z1) / 2);
    m.updateMatrixWorld(true);
    pick.push(m);
  }

  fusionar(root);
  return { pick, root, tick, plan, M, sun, hemi, skyU: sky.material.uniforms, rects, emisivos, fachadaLuz, sistema };
}

// Une la geometría estática que comparte material: de ~1500 objetos a unas decenas de llamadas de dibujo.
function fusionar(root) {
  root.updateMatrixWorld(true);
  const grupos = new Map();
  const quitar = [];
  root.traverse((o) => {
    if (!o.isMesh || o.isInstancedMesh || Array.isArray(o.material)) return;
    if (o.userData.floor || o.userData.glass || o.material.transparent || o.userData.noFusionar) return;
    let g = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone();
    for (const n of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(n)) g.deleteAttribute(n);
    if (!g.attributes.uv || !g.attributes.normal) return;
    g.morphAttributes = {};
    g.clearGroups();
    g.applyMatrix4(o.matrixWorld);
    const key = o.material.uuid + '|' + o.castShadow + '|' + o.receiveShadow;
    if (!grupos.has(key)) grupos.set(key, { mat: o.material, cast: o.castShadow, rec: o.receiveShadow, geos: [] });
    grupos.get(key).geos.push(g);
    quitar.push(o);
  });
  for (const o of quitar) o.parent.remove(o);
  for (const { mat, cast, rec, geos } of grupos.values()) {
    const merged = mergeGeometries(geos, false);
    if (!merged) continue;
    merged.computeBoundingSphere();
    const m = new THREE.Mesh(merged, mat);
    m.castShadow = cast;
    m.receiveShadow = rec;
    root.add(m);
  }
  // los grupos vacíos (árboles, plantas) quedan sin hijos: se quitan
  const vacios = [];
  root.traverse((o) => { if (o.isGroup && o !== root && o.children.length === 0) vacios.push(o); });
  vacios.forEach((o) => o.parent.remove(o));
}
