import * as THREE from 'three';

// Camino guiado en el piso: cinta naranja punteada que avanza hacia el destino.
export class Guia {
  constructor(scene, nav) {
    this.nav = nav;
    this.dest = null;
    this.on = true; // la guía es de las gafas: sin gafas no se dibuja
    const c = document.createElement('canvas');
    c.width = 128; c.height = 32;
    const g = c.getContext('2d');
    g.fillStyle = '#ffffff';
    g.fillRect(0, 6, 72, 20);
    this.tex = new THREE.CanvasTexture(c);
    this.tex.wrapS = THREE.RepeatWrapping;
    this.mat = new THREE.MeshBasicMaterial({ map: this.tex, color: '#e8743b', transparent: true, opacity: 0.92, depthWrite: false, toneMapped: false, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -4 });
    this.mesh = new THREE.Mesh(new THREE.BufferGeometry(), this.mat);
    this.mesh.renderOrder = 5;
    this.mesh.visible = false;
    scene.add(this.mesh);
    const anillo = new THREE.RingGeometry(0.42, 0.5, 48).rotateX(-Math.PI / 2);
    this.meta = new THREE.Mesh(anillo, new THREE.MeshBasicMaterial({ color: '#e8743b', transparent: true, opacity: 0.9, depthWrite: false, toneMapped: false }));
    this.meta.visible = false;
    scene.add(this.meta);
  }

  set(dest) {
    this.dest = dest;
    this.rehacer();
  }

  rehacer() {
    const nav = this.nav;
    if (!this.on || !this.dest || !nav.current || nav.current === this.dest) {
      this.mesh.visible = false;
      this.meta.visible = false;
      return;
    }
    const pts = nav.route(nav.current, this.dest).map(([x, z]) => new THREE.Vector3(x, 0.03, z));
    const curva = new THREE.CatmullRomCurve3(pts, false, 'centripetal');
    const largo = curva.getLength();
    const n = Math.max(2, Math.ceil(largo / 0.15));
    const pos = [], uv = [], idx = [];
    const ancho = 0.075;
    let k = 0;
    for (let i = 0; i <= n; i++) {
      const u = i / n;
      const s = u * largo;
      if (s < 1.4) continue; // no dibujar bajo los pies de Lu
      const p = curva.getPointAt(u);
      const tg = curva.getTangentAt(u);
      const nx = -tg.z, nz = tg.x;
      const fade = Math.min(1, (s - 1.4) / 1.2);
      pos.push(p.x + nx * ancho * fade, 0.03, p.z + nz * ancho * fade, p.x - nx * ancho * fade, 0.03, p.z - nz * ancho * fade);
      uv.push(s / 0.55, 0, s / 0.55, 1);
      if (k > 0) { const a = (k - 1) * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
      k++;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    geo.setIndex(idx);
    this.mesh.geometry.dispose();
    this.mesh.geometry = geo;
    this.mesh.visible = k > 1;
    const fin = pts[pts.length - 1];
    this.meta.position.set(fin.x, 0.035, fin.z);
    this.meta.visible = true;
  }

  update(t, caminando) {
    this.tex.offset.x = -t * 1.4;
    this.mesh.material.opacity = caminando ? 0.5 : 0.92;
    this.meta.scale.setScalar(1 + 0.12 * Math.sin(t * 3));
  }
}
