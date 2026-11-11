// El corazón: una explicación guionada en 3D que el tutor arma sobre la mesa del participante.
// Cuatro cavidades, venas cavas, arteria pulmonar, venas pulmonares y aorta, con la sangre como
// partículas (azul con poco oxígeno por el lado derecho hacia los pulmones; roja desde los pulmones
// por el lado izquierdo hasta la aorta). El tutor la cuenta de a una oración por paso y en cada paso
// se ilumina la parte que corresponde. Se maneja por voz, con los botones del costado o con las
// teclas del moderador (ver tareas-ia.js). Las respuestas están escritas de antemano: no usa la IA real.
// Vista de frente, como en los libros: el lado derecho del corazón queda a la izquierda de quien mira.
import * as THREE from 'three';

const NARANJA = '#e8743b';
const AZUL = '#5aa8ff', ROJO = '#ff5a48';

// material "holograma": relleno tenue y borde que brilla; uMix lo lleva al naranja cuando se resalta
const HOLO = {
  vertexShader: `
    varying vec3 vN; varying vec3 vV;
    void main(){
      vec4 mv = modelViewMatrix * vec4(position, 1.0);
      vN = normalize(normalMatrix * normal);
      vV = normalize(-mv.xyz);
      gl_Position = projectionMatrix * mv;
    }`,
  fragmentShader: `
    uniform vec3 uColor; uniform vec3 uAlto; uniform float uOp; uniform float uRim; uniform float uMix; uniform float uTime;
    varying vec3 vN; varying vec3 vV;
    void main(){
      float f = 1.0 - abs(dot(normalize(vN), normalize(vV)));
      float rim = pow(f, 2.4);
      vec3 col = mix(uColor, uAlto, uMix);
      float pulso = 1.0 + uMix * 0.2 * sin(uTime * 5.5);
      float a = (uOp + rim * uRim + uMix * 0.24) * pulso;
      gl_FragColor = vec4(col * (0.5 + 0.7 * rim + uMix * 0.4), clamp(a, 0.0, 0.95));
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }`,
};

const holo = (color, op, rim) => new THREE.ShaderMaterial({
  uniforms: { uColor: { value: new THREE.Color(color) }, uAlto: { value: new THREE.Color(NARANJA) }, uOp: { value: op }, uRim: { value: rim }, uMix: { value: 0 }, uTime: { value: 0 } },
  vertexShader: HOLO.vertexShader, fragmentShader: HOLO.fragmentShader,
  transparent: true, depthWrite: false, toneMapped: false,
});

// partes con nombre; «et» es dónde va la etiqueta y «al» hacia qué lado sale (l, r, c = arriba)
const PARTES = {
  ad: { nombre: 'Aurícula derecha', lado: 'der', et: [-0.45, 0.17, 0], al: 'l' },
  vd: { nombre: 'Ventrículo derecho', lado: 'der', et: [-0.4, -0.32, 0.05], al: 'l' },
  ai: { nombre: 'Aurícula izquierda', lado: 'izq', et: [0.45, 0.13, 0], al: 'r' },
  vi: { nombre: 'Ventrículo izquierdo', lado: 'izq', et: [0.45, -0.36, 0], al: 'r' },
  cavas: { nombre: 'Venas cavas', lado: 'der', et: [-0.34, 0.8, -0.02], al: 'l' },
  pulmonar: { nombre: 'Arteria pulmonar', lado: 'der', et: [-0.07, 0.3, 0.13], al: 'l' },
  pulmones: { nombre: 'Pulmones', lado: 'neutro', et: [0.74, 0.82, -0.12], al: 'c' },
  vpulm: { nombre: 'Venas pulmonares', lado: 'izq', et: [0.52, 0.34, -0.08], al: 'r' },
  aorta: { nombre: 'Aorta', lado: 'izq', et: [0.1, 1.0, -0.12], al: 'c' },
  tri: { nombre: 'Válvula', lado: 'valv', et: [-0.22, -0.04, 0.12], al: 'c', solo: true },
  mit: { nombre: '', lado: 'valv' }, pul: { nombre: '', lado: 'valv' }, aor: { nombre: '', lado: 'valv' },
};
const GRUPOS = { valvulas: ['tri', 'mit', 'pul', 'aor'], ventriculo: ['vd', 'vi'], auricula: ['ad', 'ai'], color: ['pulmones'] };
const COLOR_LADO = { der: ['#9cc4ff', 0.1, 0.55], izq: ['#ffb3a8', 0.1, 0.55], neutro: ['#c9d3dc', 0.05, 0.32], valv: ['#ecebe7', 0.45, 0.4] };

// la explicación, de a una oración; «parte» es lo que se ilumina y «clave» dónde está la sangre
export const PASOS = [
  { parte: ['ad', 'ai', 'vd', 'vi'], clave: 'cavas', txt: 'Este es tu corazón: una bomba con cuatro cavidades. Arriba, las dos aurículas; abajo, los dos ventrículos.' },
  { parte: 'cavas', clave: 'cavas', txt: 'La sangre que ya recorrió el cuerpo, con poco oxígeno, entra por las venas cavas.' },
  { parte: 'ad', clave: 'ad', txt: 'Llega a la aurícula derecha, que la recibe.' },
  { parte: ['vd', 'tri'], clave: 'vd', txt: 'Pasa por una válvula al ventrículo derecho, que la empuja hacia afuera.' },
  { parte: 'pulmonar', clave: 'pulmonar', txt: 'Sale por la arteria pulmonar y viaja a los pulmones.' },
  { parte: 'pulmones', clave: 'pulmones', txt: 'En los pulmones suelta el dióxido de carbono y se carga de oxígeno: por eso pasa de azul a roja.' },
  { parte: ['vpulm', 'ai'], clave: 'ai', txt: 'Vuelve por las venas pulmonares y entra a la aurícula izquierda.' },
  { parte: 'vi', clave: 'vi', txt: 'Baja al ventrículo izquierdo, el más fuerte de los cuatro.' },
  { parte: 'aorta', clave: 'aorta', txt: 'Y sale por la aorta hacia todo el cuerpo. Después vuelve a empezar.' },
];
export const PASO_VENTRICULO = 3;

// respuestas a «¿qué es…?» (una o dos oraciones, y después se retoma la explicación)
const RESP = {
  ventriculo: { parte: ['vd', 'vi'], txt: 'Un ventrículo es una de las dos cavidades de abajo: la que empuja la sangre hacia afuera. El derecho la manda a los pulmones y el izquierdo, a todo el cuerpo.' },
  vd: { parte: 'vd', txt: 'El ventrículo derecho es la cavidad de abajo del lado derecho. Empuja la sangre con poco oxígeno hacia los pulmones.' },
  vi: { parte: 'vi', txt: 'El ventrículo izquierdo es la cavidad más fuerte: empuja la sangre con oxígeno a todo el cuerpo por la aorta.' },
  auricula: { parte: ['ad', 'ai'], txt: 'Las aurículas son las dos cavidades de arriba. Reciben la sangre que llega al corazón y la pasan a los ventrículos.' },
  ad: { parte: 'ad', txt: 'La aurícula derecha es la cavidad de arriba del lado derecho. Recibe la sangre que vuelve del cuerpo por las venas cavas.' },
  ai: { parte: 'ai', txt: 'La aurícula izquierda es la cavidad de arriba del lado izquierdo. Recibe la sangre con oxígeno que vuelve de los pulmones.' },
  aorta: { parte: 'aorta', txt: 'La aorta es la arteria más grande del cuerpo. Sale del ventrículo izquierdo y reparte la sangre con oxígeno a todo el cuerpo.' },
  valvulas: { parte: ['tri', 'mit', 'pul', 'aor'], txt: 'Las válvulas son como puertas de un solo sentido: dejan pasar la sangre hacia adelante y no la dejan volver.' },
  cavas: { parte: 'cavas', txt: 'Las venas cavas son las dos venas que traen al corazón la sangre que ya usó el cuerpo, con poco oxígeno. Entran a la aurícula derecha.' },
  pulmonar: { parte: 'pulmonar', txt: 'La arteria pulmonar sale del ventrículo derecho y lleva la sangre a los pulmones, donde se carga de oxígeno.' },
  vpulm: { parte: 'vpulm', txt: 'Las venas pulmonares traen la sangre ya cargada de oxígeno desde los pulmones hasta la aurícula izquierda.' },
  pulmones: { parte: 'pulmones', txt: 'En los pulmones la sangre suelta el dióxido de carbono y toma oxígeno. Por eso en el dibujo pasa de azul a roja.' },
  color: { parte: 'pulmones', txt: 'El azul marca la sangre con poco oxígeno y el rojo, la que ya pasó por los pulmones. En la realidad es siempre roja, más oscura o más clara.' },
  entra: { parte: ['cavas', 'ad'], clave: 'ad', txt: 'Entra por las venas cavas, acá, a la aurícula derecha. Es sangre que ya recorrió el cuerpo y viene con poco oxígeno.' },
};
// «¿y a dónde va después?» según dónde está la sangre en la explicación
const DESPUES = {
  cavas: { parte: 'ad', clave: 'ad', txt: 'Por las venas cavas llega a la aurícula derecha.' },
  ad: { parte: ['vd', 'tri'], clave: 'vd', txt: 'De la aurícula derecha pasa por una válvula al ventrículo derecho.' },
  vd: { parte: 'pulmonar', clave: 'pulmonar', txt: 'Del ventrículo derecho sale por la arteria pulmonar hacia los pulmones.' },
  pulmonar: { parte: 'pulmones', clave: 'pulmones', txt: 'Por la arteria pulmonar llega a los pulmones, donde se carga de oxígeno.' },
  pulmones: { parte: 'vpulm', clave: 'vpulm', txt: 'De los pulmones vuelve al corazón por las venas pulmonares.' },
  vpulm: { parte: 'ai', clave: 'ai', txt: 'Por las venas pulmonares entra a la aurícula izquierda.' },
  ai: { parte: ['vi', 'mit'], clave: 'vi', txt: 'De la aurícula izquierda baja al ventrículo izquierdo.' },
  vi: { parte: 'aorta', clave: 'aorta', txt: 'Del ventrículo izquierdo sale por la aorta hacia todo el cuerpo.' },
  aorta: { parte: 'cavas', clave: 'cavas', txt: 'Por la aorta va a todo el cuerpo. Cuando el cuerpo la usa, vuelve por las venas cavas y empieza de nuevo.' },
};
// palabras que nombran cada parte (el texto ya viene sin tildes ni mayúsculas)
const PARTE_EN = [
  ['vd', /\bventriculo derecho\b/], ['vi', /\bventriculo izquierdo\b/], ['ventriculo', /\bventricul/],
  ['ad', /\bauricula derecha\b/], ['ai', /\bauricula izquierda\b/], ['auricula', /\b(auricul|atrio)/],
  ['aorta', /\baorta\b/], ['valvulas', /\bvalvul/], ['cavas', /\b(vena cava|venas cavas|cava|cavas)\b/],
  ['vpulm', /\bvenas? pulmonar/], ['pulmonar', /\barteria pulmonar\b|\bpulmonar\b/], ['pulmones', /\bpulmon/],
  ['color', /\b(azul|roja|rojo|color|colores)\b/],
];
export const NOMBRE_PREGUNTA = { ventriculo: 'el ventrículo', vd: 'el ventrículo derecho', vi: 'el ventrículo izquierdo', auricula: 'la aurícula', ad: 'la aurícula derecha', ai: 'la aurícula izquierda', aorta: 'la aorta', valvulas: 'las válvulas', cavas: 'las venas cavas', pulmonar: 'la arteria pulmonar', vpulm: 'las venas pulmonares', pulmones: 'los pulmones', color: 'los colores', entra: 'por dónde entra la sangre', despues: 'a dónde va después' };

const V = (p) => new THREE.Vector3(p[0], p[1], p[2]);
const curva = (pts) => new THREE.CatmullRomCurve3(pts.map(V), false, 'catmullrom', 0.5);
const tubo = (pts, r, mat, orden = 22) => { const m = new THREE.Mesh(new THREE.TubeGeometry(curva(pts), 32, r, 10, false), mat); m.renderOrder = orden; return m; };
const esfera = (p, r, s, mat, orden = 23) => { const m = new THREE.Mesh(new THREE.SphereGeometry(r, 28, 20), mat); m.position.set(p[0], p[1], p[2]); m.scale.set(s[0], s[1], s[2]); m.renderOrder = orden; return m; };
const anillo = (p, r, mat) => { const m = new THREE.Mesh(new THREE.TorusGeometry(r, 0.011, 8, 32), mat); m.position.set(p[0], p[1], p[2]); m.rotation.x = Math.PI / 2; m.renderOrder = 25; return m; };

// recorridos de la sangre (en unidades del corazón; +x es la derecha de quien mira)
const CAVA_SUP = [[-0.32, 0.9, -0.02], [-0.31, 0.6, -0.02], [-0.28, 0.33, 0]];
const CAVA_INF = [[-0.4, -0.9, -0.08], [-0.37, -0.5, -0.1], [-0.31, -0.12, -0.06], [-0.27, 0.0, -0.02]];
const AD_VD = [[-0.27, 0.1, 0.02], [-0.23, -0.04, 0.03], [-0.17, -0.2, 0.04]];
const TRONCO = [[-0.16, -0.18, 0.05], [-0.08, 0.0, 0.1], [-0.05, 0.26, 0.13], [-0.02, 0.42, 0.1]];
const PULM_I = [[-0.02, 0.42, 0.1], [-0.3, 0.52, 0.0], [-0.62, 0.5, -0.06], [-0.74, 0.42, -0.1]];
const PULM_D = [[-0.02, 0.42, 0.1], [0.3, 0.5, -0.02], [0.62, 0.48, -0.06], [0.74, 0.4, -0.1]];
const EN_PULM_I = [[-0.74, 0.42, -0.1], [-0.84, 0.28, -0.12], [-0.72, 0.18, -0.12], [-0.6, 0.3, -0.12]];
const EN_PULM_D = [[0.74, 0.4, -0.1], [0.84, 0.26, -0.12], [0.72, 0.16, -0.12], [0.6, 0.3, -0.1]];
const VENA_I = [[-0.6, 0.3, -0.12], [-0.2, 0.3, -0.22], [0.1, 0.24, -0.12], [0.22, 0.2, -0.04]];
const VENA_D = [[0.6, 0.3, -0.1], [0.42, 0.26, -0.06], [0.3, 0.2, 0.0]];
const AI_VI = [[0.27, 0.1, 0.03], [0.23, -0.05, 0.03], [0.18, -0.22, 0.03]];
const AORTA = [[0.17, -0.2, 0.02], [0.1, -0.02, 0.0], [0.04, 0.3, -0.04], [0.03, 0.62, -0.08], [0.13, 0.78, -0.14], [0.24, 0.6, -0.24], [0.21, 0.1, -0.29], [0.15, -0.5, -0.29], [0.11, -0.9, -0.29]];
const RUTAS = [
  [[CAVA_SUP, AZUL, AZUL], [AD_VD, AZUL, AZUL], [[...TRONCO, ...PULM_I.slice(1)], AZUL, AZUL], [EN_PULM_I, AZUL, ROJO], [VENA_I, ROJO, ROJO], [AI_VI, ROJO, ROJO], [AORTA, ROJO, ROJO]],
  [[CAVA_INF, AZUL, AZUL], [AD_VD, AZUL, AZUL], [[...TRONCO, ...PULM_D.slice(1)], AZUL, AZUL], [EN_PULM_D, AZUL, ROJO], [VENA_D, ROJO, ROJO], [AI_VI, ROJO, ROJO], [AORTA, ROJO, ROJO]],
];

const ANCHO = 2.5, ALTO = 2.2; // del fondo oscuro, en unidades del corazón
const CONTROLES = [['pausa', 'Pausar'], ['repetir', 'Repetir'], ['despacio', 'Más despacio'], ['girar', 'Girar'], ['acercar', 'Acercar'], ['cerrar', 'Cerrar ×']];
const SIN_CONTROL = ['tarea', 'foco', 'gafas'];

export class Corazon {
  // pos: dónde flota (sobre la mesa); escala: metros por unidad del corazón
  constructor({ hud, scene, camera, pos, escala = 0.4 }) {
    this.hud = hud; this.camera = camera;
    this.pos = new THREE.Vector3(...pos);
    this.ESCALA = escala;
    this.g = new THREE.Group();
    this.g.name = 'corazon-ar';
    this.g.visible = false;
    scene.add(this.g);
    this.inner = new THREE.Group();
    this.g.add(this.inner);
    this._armar();
    this._capa();
    this.estado = 'cerrado';
    this.i = 0;
    this.vel = 1;
    this.giroObj = 0;
    this.zoomObj = 1; // «acercar» agranda el corazón dentro del marco; el marco no cambia
    this.flujo = 0;
    this.holdHasta = 0;
    this._hid = 0;
    this.marcarInicio();
  }

  // ── geometría ─────────────────────────────────────────────
  _armar() {
    const inner = this.inner;
    // fondo oscuro para que se lea sobre el aula (queda quieto cuando el corazón gira)
    const fondo = new THREE.Mesh(new THREE.PlaneGeometry(ANCHO, ALTO), new THREE.MeshBasicMaterial({ color: '#0b0c0e', transparent: true, opacity: 0.86, depthWrite: false, toneMapped: false }));
    fondo.position.z = -0.42; fondo.renderOrder = 20;
    this.g.add(fondo);
    const lin = (pts, op) => { const l = new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(pts.map(V)), new THREE.LineBasicMaterial({ color: '#ecebe7', transparent: true, opacity: op, toneMapped: false })); l.position.z = -0.41; l.renderOrder = 21; this.g.add(l); };
    const w = ANCHO / 2, h = ALTO / 2, e = 0.12;
    lin([[-w, h, 0], [w, h, 0], [w, h, 0], [w, -h, 0], [w, -h, 0], [-w, -h, 0], [-w, -h, 0], [-w, h, 0]], 0.14);
    const esq = [];
    for (const [sx, sy] of [[-1, 1], [1, 1], [-1, -1], [1, -1]]) esq.push([sx * w, sy * h, 0], [sx * (w - e), sy * h, 0], [sx * w, sy * h, 0], [sx * w, sy * (h - e), 0]);
    lin(esq, 0.8);

    this.mats = {};
    for (const k of Object.keys(PARTES)) { const [c, op, rim] = COLOR_LADO[PARTES[k].lado]; this.mats[k] = holo(c, op, rim); this.mats[k].userData.mix = 0; }
    const M = this.mats;
    // cavidades
    inner.add(esfera([-0.26, 0.16, 0], 0.19, [1, 1, 1], M.ad));
    inner.add(esfera([0.26, 0.17, 0.02], 0.18, [1, 1, 1], M.ai));
    inner.add(esfera([-0.15, -0.22, 0.03], 0.25, [1, 1.25, 0.85], M.vd));
    inner.add(esfera([0.17, -0.26, 0], 0.28, [1, 1.3, 0.9], M.vi));
    // válvulas
    inner.add(anillo([-0.22, -0.04, 0.03], 0.09, M.tri));
    inner.add(anillo([0.22, -0.05, 0.02], 0.085, M.mit));
    inner.add(anillo([-0.07, 0.03, 0.1], 0.055, M.pul));
    inner.add(anillo([0.08, 0.05, -0.02], 0.055, M.aor));
    // vasos
    inner.add(tubo(CAVA_SUP, 0.055, M.cavas));
    inner.add(tubo(CAVA_INF, 0.055, M.cavas));
    inner.add(tubo(TRONCO, 0.055, M.pulmonar, 24));
    inner.add(tubo(PULM_I, 0.045, M.pulmonar, 24));
    inner.add(tubo(PULM_D, 0.045, M.pulmonar, 24));
    inner.add(tubo(VENA_I, 0.04, M.vpulm));
    inner.add(tubo(VENA_D, 0.04, M.vpulm));
    inner.add(tubo(AORTA, 0.06, M.aorta));
    inner.add(tubo([[0.06, 0.7, -0.1], [0.05, 0.95, -0.1]], 0.026, M.aorta));
    inner.add(tubo([[0.15, 0.8, -0.14], [0.17, 0.97, -0.14]], 0.026, M.aorta));
    // pulmones
    inner.add(esfera([-0.74, 0.42, -0.12], 0.26, [0.85, 1.35, 0.7], M.pulmones, 21));
    inner.add(esfera([0.74, 0.4, -0.12], 0.26, [0.85, 1.35, 0.7], M.pulmones, 21));

    // sangre: partículas que recorren cada circuito
    this.tramos = [];
    for (const ruta of RUTAS) {
      let acum = 0;
      const segs = ruta.map(([pts, c0, c1]) => { const c = curva(pts); const len = c.getLength(); const s = { c, len, desde: acum, c0: new THREE.Color(c0), c1: new THREE.Color(c1) }; acum += len; return s; });
      this.tramos.push({ segs, largo: acum });
    }
    const DENS = 15;
    const n = this.tramos.reduce((a, t) => a + Math.round(t.largo * DENS), 0);
    this.particulas = [];
    const pos = new Float32Array(n * 3), col = new Float32Array(n * 3);
    let i = 0;
    this.tramos.forEach((t, k) => {
      const m = Math.round(t.largo * DENS);
      for (let j = 0; j < m; j++) this.particulas.push({ ruta: k, s0: (j / m) * t.largo + Math.random() * 0.04, off: new THREE.Vector3((Math.random() - 0.5) * 0.03, (Math.random() - 0.5) * 0.03, (Math.random() - 0.5) * 0.03), i: i++ });
    });
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    const cv = document.createElement('canvas'); cv.width = cv.height = 64;
    const g2 = cv.getContext('2d'); const gr = g2.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.4, 'rgba(255,255,255,.85)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    g2.fillStyle = gr; g2.fillRect(0, 0, 64, 64);
    const tex = new THREE.CanvasTexture(cv);
    this.puntos = new THREE.Points(geo, new THREE.PointsMaterial({ map: tex, vertexColors: true, size: 0.022, sizeAttenuation: true, transparent: true, depthWrite: false, alphaTest: 0.02, toneMapped: false }));
    this.puntos.renderOrder = 26;
    this.puntos.frustumCulled = false;
    inner.add(this.puntos);
    this.g.scale.setScalar(this.ESCALA);
    this._tmp = new THREE.Vector3(); this._tmpC = new THREE.Color();
  }

  // etiquetas, título y controles, en la capa de las gafas
  _capa() {
    const capa = document.createElement('div');
    capa.className = 'corazon-capa';
    capa.style.display = 'none';
    document.getElementById('hud-anclas').appendChild(capa);
    this.capa = capa;
    this.tit = document.createElement('div');
    this.tit.className = 'tit';
    this.tit.innerHTML = '<b>Explicación · Biología</b><em>Cómo funciona el corazón</em><span class="est"></span><small><i class="az"></i>Poco oxígeno<i class="ro"></i>Con oxígeno</small>';
    capa.appendChild(this.tit);
    this.etiquetas = [];
    for (const [k, p] of Object.entries(PARTES)) {
      if (!p.nombre) continue;
      const d = document.createElement('div');
      d.className = `et ${p.al}`;
      d.innerHTML = `<i></i><span>${p.nombre}</span>`;
      capa.appendChild(d);
      this.etiquetas.push({ el: d, v: V(p.et), al: p.al, k, solo: p.solo });
    }
    this.tags = [];
    for (const [txt, p] of [['Del cuerpo', [-0.32, 0.98, -0.02]], ['Del cuerpo', [-0.4, -0.98, -0.08]], ['Al cuerpo', [0.11, -0.98, -0.29]]]) {
      const d = document.createElement('div'); d.className = 'tag'; d.textContent = txt; capa.appendChild(d);
      this.tags.push({ el: d, v: V(p) });
    }
    this.ctl = document.createElement('div');
    this.ctl.className = 'ctl';
    this.botones = {};
    for (const [k, txt] of CONTROLES) {
      const b = document.createElement('button');
      b.type = 'button'; b.dataset.dwell = '1.3'; b.textContent = txt;
      b.addEventListener('click', () => this.accion(k, 'boton'));
      this.ctl.appendChild(b);
      this.botones[k] = b;
    }
    capa.appendChild(this.ctl);
  }

  // ── estado ────────────────────────────────────────────────
  get abierto() { return this.estado !== 'cerrado'; }
  // lo que mide el test (se reinicia al empezar cada tarea)
  marcarInicio() { this.abrio = null; this.controles = []; this.preguntas = []; this.preguntasParte = 0; this.volvio = false; this.respondio = false; }
  _reg(d) { this.hud.registrar('corazon', d); }
  _control(k, origen) { if (!SIN_CONTROL.includes(origen)) this.controles.push(k); }
  // la voz cortó al tutor para decir algo: se espera a que llegue la frase antes de seguir
  retener(ms = 2500) { this.holdHasta = Math.max(this.holdHasta, performance.now() + ms); }

  accion(k, origen = 'boton') {
    if (k === 'pausa') return this.estado === 'pausado' ? this.seguir(origen) : this.pausar(origen);
    if (k === 'repetir') return this.repetir(false, origen);
    if (k === 'despacio') return this.velocidad(this.vel === 1, origen);
    if (k === 'girar') return this.girar(origen);
    if (k === 'acercar') return this.acercar(this.zoomObj === 1, origen);
    if (k === 'cerrar') return this.cerrar(origen);
  }

  abrir(origen = 'voz') {
    const h = this.hud;
    if (this.abierto) return this.repetir(true, origen);
    this.abrio = this.abrio || origen;
    this.vel = 1; if (h.voz) h.voz.ritmo = 1;
    this.giroObj = 0; this.inner.rotation.y = 0;
    this.zoomObj = 1; this.inner.scale.setScalar(1);
    this.retomar = null; this.ultima = null;
    // flota sobre la mesa, de frente a quien mira
    const c = this.camera.position;
    this.g.position.copy(this.pos);
    this.g.lookAt(c.x, this.pos.y, c.z);
    this.g.visible = true;
    this.capa.style.display = '';
    this.mirarlo();
    h.cerrarPanel(); h.cerrarLanzador();
    this._reg(`abrir:${origen}`);
    this._paso(0);
  }

  // gira la cabeza hacia el corazón
  mirarlo() {
    const nav = this.hud.nav, c = this.camera.position, p = this.pos;
    const dx = p.x - c.x, dz = p.z - c.z;
    nav.vy = nav.vp = 0;
    nav.settle = { yaw: Math.atan2(-dx, -dz), pitch: Math.atan2(p.y - c.y, Math.hypot(dx, dz)), t: -0.4 };
  }

  cerrar(origen = 'voz', callado = false) {
    if (!this.abierto) return;
    this._hid++;
    this.estado = 'cerrado';
    this.g.visible = false;
    this.capa.style.display = 'none';
    this._resaltar([]);
    if (this.hud.voz) this.hud.voz.ritmo = 1;
    this._control('cerrar', origen);
    this._reg(`cerrar:${origen}`);
    this.hud.cerrarTutor(true);
    if (!callado) this.hud.proponer('Listo, lo cierro. Si querés verlo de nuevo, pedímelo.');
  }

  pausar(origen = 'voz', callado = false) {
    if (!this.abierto || this.estado === 'pausado' || this.estado === 'fin') return;
    this._hid++;
    this.estado = 'pausado';
    this.retomar = null;
    this.callado = callado;
    this._control('pausa', origen);
    this._reg(`pausa:${origen}`);
    if (callado) this._refrescar(); else this._mostrarPausa();
  }

  _mostrarPausa() {
    this.callado = false;
    this.hud.decir('Pausado. Decime «seguí» cuando quieras, o preguntame algo.', [['Seguir', () => this.seguir('boton')]]);
    this._refrescar();
  }

  seguir(origen = 'voz') {
    if (!this.abierto) return;
    if (this.estado === 'pausado') { this._control('seguir', origen); this._reg(`seguir:${origen}`); return this._paso(this.i); }
    if (this.estado === 'fin') return this.repetir(true, origen);
  }

  repetir(todo = false, origen = 'voz') {
    if (!this.abierto) return;
    this._control(todo ? 'repetir-todo' : 'repetir', origen);
    this._reg(`repetir:${todo ? 'todo' : this.i + 1}:${origen}`);
    this.retomar = null;
    this._paso(todo || this.estado === 'fin' ? 0 : this.i);
  }

  // salta a un paso (lo usa el moderador al preparar una tarea)
  irAPaso(i, origen = 'tarea') {
    if (!this.abierto) this.abrir(origen);
    this.retomar = null;
    this._reg(`paso:${i + 1}:${origen}`);
    this._paso(i);
  }

  velocidad(despacio, origen = 'voz') {
    if (!this.abierto) return;
    this.vel = despacio ? 0.5 : 1;
    if (this.hud.voz) this.hud.voz.ritmo = despacio ? 0.82 : 1;
    this._control(despacio ? 'despacio' : 'normal', origen);
    this._reg(`${despacio ? 'despacio' : 'normal'}:${origen}`);
    this.retomar = null;
    this._paso(this.estado === 'fin' ? 0 : this.i, despacio ? 'Dale, voy más despacio. ' : 'Dale, velocidad normal. ');
  }

  girar(origen = 'voz') {
    if (!this.abierto) return;
    this.giroObj += Math.PI / 2;
    this._control('girar', origen);
    this._reg(`girar:${origen}`);
  }

  acercar(si, origen = 'voz') {
    if (!this.abierto) return;
    this.zoomObj = si ? 1.3 : 1;
    this._control(si ? 'acercar' : 'alejar', origen);
    this._reg(`${si ? 'acercar' : 'alejar'}:${origen}`);
    this._refrescar();
  }

  // ── la explicación ────────────────────────────────────────
  _paso(i, prefijo = '') {
    this.i = i;
    this.estado = 'explicando';
    const p = PASOS[i];
    this._resaltar(p.parte);
    this.ultima = p.clave;
    this._refrescar();
    this._hablar(prefijo + p.txt, () => {
      if (this.estado !== 'explicando') return;
      if (this.i + 1 < PASOS.length) this._paso(this.i + 1); else this._fin();
    });
  }

  _fin(corto = false) {
    this.estado = 'fin';
    this._resaltar([]);
    this._refrescar();
    this.hud.decir(corto ? '¿Lo repito, o tenés alguna otra pregunta?' : 'Ese fue un latido completo. ¿Lo repito, o tenés alguna pregunta?', [['Repetir', () => this.repetir(true, 'boton')], ['Cerrar', () => this.cerrar('boton')]]);
  }

  // preguntas: resalta la parte, contesta corto y vuelve a donde estaba
  preguntar(q, origen = 'voz') {
    if (!this.abierto) return;
    const r = q === 'despues' ? DESPUES[this.ultima || 'cavas'] : RESP[q];
    if (!r) return;
    this.preguntas.push(q);
    if (q !== 'entra' && q !== 'despues') this.preguntasParte++;
    this._reg(`pregunta:${q}:${origen}`);
    this._interrumpir();
    if (r.clave) this.ultima = r.clave;
    this._resaltar(r.parte);
    this._refrescar();
    this._hablar(r.txt, () => this._volver());
  }

  // el participante dice lo que la consigna le pide averiguar (tarea 2)
  responder(tipo, origen = 'voz') {
    if (!this.abierto) return;
    this.respondio = true;
    this._reg(`respuesta:${tipo}:${origen}`);
    this._interrumpir();
    const r = tipo === 'entra'
      ? { parte: ['cavas', 'ad'], clave: 'ad', txt: '¡Eso! Entra por las venas cavas a la aurícula derecha. Y de ahí baja al ventrículo derecho.' }
      : { parte: ['vd', 'pulmonar'], clave: 'pulmonar', txt: 'Exacto: del ventrículo derecho sale por la arteria pulmonar hacia los pulmones.' };
    this.ultima = r.clave;
    this._resaltar(r.parte);
    this._refrescar();
    this._hablar(r.txt, () => this._volver());
  }

  noEntendi() {
    if (!this.abierto) return false;
    this._interrumpir();
    this._refrescar();
    this._hablar('No te entendí. Podés decirme «pausá», «repetí», «más despacio», «girá», o preguntarme por una parte.', () => this._volver());
    return true;
  }

  _interrumpir() {
    this._hid++;
    if (this.estado !== 'pregunta') this.retomar = { estado: this.estado, i: this.i };
    this.estado = 'pregunta';
  }

  // después de una pregunta, la explicación sigue donde estaba (o queda en pausa o en el final)
  _volver() {
    const r = this.retomar;
    this.retomar = null;
    if (!r || this.estado !== 'pregunta') return;
    this.volvio = true;
    this._reg('volver');
    if (r.estado === 'fin') return this._fin(true);
    if (r.estado === 'pausado') { this.estado = 'pausado'; this.i = r.i; this._resaltar(PASOS[r.i].parte); return this._mostrarPausa(); }
    this._paso(r.i, 'Sigo donde estábamos. ');
  }

  // dice una frase (texto grande del tutor y voz) y avisa cuando terminó de leerse y de decirse
  _hablar(txt, cb) {
    const id = ++this._hid;
    const h = this.hud, v = h.voz;
    const conVoz = !!(v && v.hablaTutor && (v.tts || v.sintesis) && h.puestas);
    const min = (1.6 + txt.length * 0.06) * (this.vel < 1 ? 1.5 : 1);
    let vozOk = !conVoz, tOk = false;
    const ver = () => {
      if (id !== this._hid) return;
      // si el participante está hablando (o recién cortó al tutor), se espera a su frase
      const espera = Math.max(this.holdHasta - performance.now(), v && v.ptt ? 400 : 0);
      if (espera > 0) { setTimeout(ver, espera); return; }
      if (vozOk && tOk) { this._hid++; cb(); }
    };
    h.decir(txt, [], { alTerminar: () => { if (vozOk) return; vozOk = true; setTimeout(ver, 900); } });
    setTimeout(() => { tOk = true; ver(); }, min * 1000);
    if (conVoz) setTimeout(() => { if (!vozOk) { vozOk = true; ver(); } }, ((4 + txt.length * 0.12) * 1000) / (v.ritmo || 1));
  }

  _resaltar(partes) {
    const lista = [].concat(partes || []).flatMap((k) => GRUPOS[k] || [k]);
    for (const k of Object.keys(this.mats)) this.mats[k].userData.mix = lista.includes(k) ? 1 : 0;
    this.resaltadas = lista;
  }

  _refrescar() {
    const est = this.estado === 'pausado' ? 'En pausa' : this.estado === 'fin' ? 'Terminó · podés preguntar' : this.estado === 'pregunta' ? 'Respondiendo' : `Paso ${this.i + 1} de ${PASOS.length}`;
    this.tit.querySelector('.est').textContent = `${est}${this.vel < 1 ? ' · despacio' : ''}`;
    this.botones.pausa.textContent = this.estado === 'pausado' ? 'Seguir' : 'Pausar';
    this.botones.pausa.classList.toggle('on', this.estado === 'pausado');
    this.botones.despacio.textContent = this.vel < 1 ? 'Velocidad normal' : 'Más despacio';
    this.botones.despacio.classList.toggle('on', this.vel < 1);
    this.botones.acercar.textContent = this.zoomObj > 1 ? 'Alejar' : 'Acercar';
    this.botones.acercar.classList.toggle('on', this.zoomObj > 1);
  }

  // ── voz: ¿la frase es algo del corazón? (el texto llega sin tildes ni mayúsculas) ──
  oir(d, dir) {
    const abierto = this.abierto;
    const pide = /\b(explica|explicame|explicar|explicas|explicarme|contame|conta|mostrame|mostra|ensename|ayudame|quiero entender|no entiendo|como funciona|como es|como anda|que es|ver|veamos|quiero ver|quiero saber|como trabaja)\b/;
    if (/\b(corazon|circulatorio|circulacion|latido|late|bombea)\b/.test(d) && (pide.test(d) || dir || d.split(' ').length <= 3)) {
      if (!abierto) return () => this.abrir('voz');
      if (/\b(de nuevo|otra vez|desde el principio)\b/.test(d)) return () => this.repetir(true, 'voz');
    }
    if (!abierto) return null;
    if (/\b(pausa|pausar|pausalo|pausala|para|pare|parar|paralo|frena|frenalo|frenala|espera|esperate|esperame|stop|momento|detene|detenelo)\b/.test(d) && !/\bno (la |lo )?pares\b/.test(d) && !/\bpara (que|donde|ver|el|la|los|las|mi)\b/.test(d)) return () => this.pausar('voz');
    if (/\b(mas despacio|despacio|mas lento|lento|mas tranquilo|muy rapido|va rapido|va muy rapido|bajale|baja la velocidad)\b/.test(d)) return () => this.velocidad(true, 'voz');
    if (/\b(mas rapido|velocidad normal|normal)\b/.test(d)) return () => this.velocidad(false, 'voz');
    if (/\b(desde el principio|de nuevo todo|todo de nuevo|empeza de nuevo|arranca de nuevo|repeti todo|repetilo todo)\b/.test(d)) return () => this.repetir(true, 'voz');
    if (/\b(repeti|repetir|repetilo|repetimelo|repetime|de nuevo|otra vez|que dijiste|no escuche|no te escuche|no entendi eso)\b/.test(d)) return () => this.repetir(false, 'voz');
    if (/\b(segui|seguir|seguimos|continua|continuar|continuemos|sigue|reanuda|retoma|retomar|play|volvamos|dale segui)\b/.test(d)) return () => this.seguir('voz');
    if (/\b(gira|girar|giralo|giremos|rota|rotar|rotalo|da vuelta|dalo vuelta|del otro lado|de costado|de perfil|de atras|por atras|por detras)\b/.test(d)) return () => this.girar('voz');
    if (/\b(acerca|acercalo|acercar|acercame|acercamelo|agranda|agrandalo|agrandar|mas grande|zoom|mas cerca|ampliar|amplia|amplialo)\b/.test(d)) return () => this.acercar(true, 'voz');
    if (/\b(aleja|alejalo|alejar|achica|achicalo|achicar|mas chico|mas lejos|tamano normal)\b/.test(d)) return () => this.acercar(false, 'voz');
    if (/\b(cerra|cerrar|cerralo|sacalo|quitalo|ya esta|ya entendi|ya lo entendi|suficiente|terminamos|terminalo)\b/.test(d) || (dir && /^(gracias|ok gracias|muchas gracias|listo|listo gracias|basta)$/.test(d))) return () => this.cerrar('voz');
    if (/\b(entra|llega|viene|empieza)\b.*\b(cava|cavas|auricula derecha)\b/.test(d) && !/\b(que|donde|por donde)\b/.test(d)) return () => this.responder('entra', 'voz');
    if (/\b(va|sale|pasa|sigue|despues)\b.*\b(pulmon|pulmones|arteria pulmonar|ventriculo derecho)\b/.test(d) && !/\b(que|donde|adonde)\b/.test(d)) return () => this.responder('despues', 'voz');
    if (/\b(por donde|donde|de donde)\b.*\b(entra|llega|viene|empieza|arranca)\b|\b(entra|llega) la sangre\b/.test(d)) return () => this.preguntar('entra', 'voz');
    if (/\b(a donde|adonde|donde|para donde|hacia donde|por donde)\b.*\b(va|sigue|sale|continua)\b|\b(que pasa|y) despues\b|\bdespues (a donde|adonde|donde|que)\b/.test(d)) return () => this.preguntar('despues', 'voz');
    const parte = (PARTE_EN.find(([, r]) => r.test(d)) || [])[0];
    if (parte) return () => this.preguntar(parte, 'voz');
    return null;
  }

  // ── cuadro a cuadro ───────────────────────────────────────
  update(dt, t) {
    const h = this.hud;
    const visible = this.abierto && h.visible && h.puestas;
    // sin gafas (o en modo revisión) la explicación espera
    if (this.abierto && !visible && this.estado === 'explicando') { this.pausar('gafas', true); this._pausaGafas = true; }
    if (visible && this._pausaGafas) { this._pausaGafas = false; this._mostrarPausa(); }
    this.g.visible = visible;
    this.capa.style.display = visible ? '' : 'none';
    // con el corazón abierto, los nombres de los compañeros no se cruzan con las etiquetas
    if (visible !== this._hudClase) { this._hudClase = visible; h.el.hud.classList.toggle('corazon', visible); }
    if (!visible) return;
    const k = Math.min(1, dt * 4);
    this.inner.rotation.y += (this.giroObj - this.inner.rotation.y) * k;
    this.inner.scale.setScalar(this.inner.scale.x + (this.zoomObj - this.inner.scale.x) * k);
    for (const m of Object.values(this.mats)) { const u = m.uniforms; u.uMix.value += (m.userData.mix - u.uMix.value) * Math.min(1, dt * 5); u.uTime.value = t; }
    // sangre
    if (this.estado !== 'pausado') this.flujo += dt * 0.26 * (this.estado === 'pregunta' ? 0.6 : this.vel);
    const pos = this.puntos.geometry.attributes.position, col = this.puntos.geometry.attributes.color;
    const tmp = this._tmp, c = this._tmpC;
    for (const p of this.particulas) {
      const tr = this.tramos[p.ruta];
      const s = (p.s0 + this.flujo) % tr.largo;
      let seg = tr.segs[tr.segs.length - 1];
      for (const q of tr.segs) if (s >= q.desde && s < q.desde + q.len) { seg = q; break; }
      const u = Math.min(1, Math.max(0, (s - seg.desde) / seg.len));
      seg.c.getPointAt(u, tmp).add(p.off);
      pos.setXYZ(p.i, tmp.x, tmp.y, tmp.z);
      c.copy(seg.c0).lerp(seg.c1, u);
      col.setXYZ(p.i, c.r, c.g, c.b);
    }
    pos.needsUpdate = true; col.needsUpdate = true;
    this.g.updateMatrixWorld(true);
    // etiquetas proyectadas sobre la capa de las gafas
    const cam = this.camera, w = innerWidth, hh = innerHeight;
    const MOV = { l: 'translate(-100%, -50%)', r: 'translate(0, -50%)', c: 'translate(-50%, -100%)', br: 'translate(-100%, -100%)', d: 'translate(0, -50%)' };
    const poner = (el, v, obj, al, on = true) => {
      if (on) {
        tmp.copy(v).applyMatrix4(obj.matrixWorld).project(cam);
        if (tmp.z > 1) on = false;
      }
      if (on) {
        const x = ((tmp.x + 1) / 2) * w, y = ((1 - tmp.y) / 2) * hh;
        if (x < -120 || x > w + 120 || y < 20 || y > hh - 20) on = false;
        else el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) ${MOV[al]}`;
      }
      el.style.display = on ? '' : 'none';
    };
    // girado o acercado se amontonan: quedan solo las etiquetas de lo que se está explicando
    const res = this.resaltadas || [];
    const giro = this.inner.rotation.y % (Math.PI * 2);
    const limpio = Math.abs(giro) < 0.2 && this.inner.scale.x < 1.05;
    for (const et of this.etiquetas) {
      const on = res.includes(et.k);
      if (on !== et.on) { et.on = on; et.el.classList.toggle('on', on); }
      poner(et.el, et.v, this.inner, et.al, on || (limpio && !et.solo));
    }
    for (const tg of this.tags) poner(tg.el, tg.v, this.inner, 'c', limpio);
    // título abajo a la derecha del marco (ahí no hay partes) y controles afuera, a su derecha
    this._v1 = this._v1 || new THREE.Vector3(ANCHO / 2 - 0.08, -ALTO / 2 + 0.08, -0.41);
    this._v2 = this._v2 || new THREE.Vector3(ANCHO / 2 + 0.06, 0, -0.41);
    poner(this.tit, this._v1, this.g, 'br');
    poner(this.ctl, this._v2, this.g, 'd');
  }
}
