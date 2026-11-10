// Cámara: detecta si el participante tiene puestas las gafas (las de utilería del test).
// Encuentra la cara (face-api, modelos incluidos en la página), alinea la zona de los ojos
// y la compara con dos muestras que toma el moderador: sin gafas y con gafas.
// No guarda imágenes: solo números de esa zona, mientras dura la sesión.
import * as faceapi from '@vladmandic/face-api/dist/face-api.esm.js';
import detMan from '@vladmandic/face-api/model/tiny_face_detector_model-weights_manifest.json';
import detBin from '@vladmandic/face-api/model/tiny_face_detector_model.bin';
import lmMan from '@vladmandic/face-api/model/face_landmark_68_tiny_model-weights_manifest.json';
import lmBin from '@vladmandic/face-api/model/face_landmark_68_tiny_model.bin';

const AW = 96, AH = 48;          // banda de los ojos alineada
const OJO_I = [30, 22], OJO_D = [66, 22];
const CW = 8, CH = 8;            // celdas
const NX = AW / CW, NY = AH / CH;

let modelos = null;
async function cargarModelos() {
  if (modelos) return modelos;
  modelos = (async () => {
    const tf = faceapi.tf;
    try { await tf.setBackend('webgl'); } catch (e) { await tf.setBackend('cpu'); }
    await tf.ready();
    const mapa = (man, bin) => tf.io.decodeWeights(bin.buffer.slice(bin.byteOffset, bin.byteOffset + bin.byteLength), man[0].weights);
    faceapi.nets.tinyFaceDetector.loadFromWeightMap(mapa(detMan, detBin));
    faceapi.nets.faceLandmark68TinyNet.loadFromWeightMap(mapa(lmMan, lmBin));
    return true;
  })();
  return modelos;
}

export class Camara {
  constructor({ alCambiar, alInfo } = {}) {
    this.alCambiar = alCambiar; this.alInfo = alInfo;
    this.estado = null;          // 'con' | 'sin' | null
    this.p = 0.5;                // probabilidad suavizada de "con gafas"
    this.muestras = { sin: [], con: [] };
    this.modelo = null;
    this.cara = false;
    this.activa = false;
    this.alin = document.createElement('canvas');
    this.alin.width = AW; this.alin.height = AH;
    this.gx = this.alin.getContext('2d', { willReadFrequently: true });
    this.fuente = document.createElement('canvas');
    this.fx = this.fuente.getContext('2d', { willReadFrequently: true });
  }

  async preparar() { await cargarModelos(); }

  static disponible() { return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia); }

  async activar(video) {
    this.video = video;
    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' }, audio: false });
    } catch (e) {
      this.error = e && (e.name === 'NotAllowedError' || e.name === 'SecurityError') ? 'La cámara está bloqueada acá (en claude.ai no se puede usar: abrí la versión local).' : 'No encontré una cámara.';
      this._info();
      return false;
    }
    video.srcObject = stream;
    video.muted = true; video.playsInline = true;
    await video.play().catch(() => {});
    this._info('Cargando el detector de caras…');
    await cargarModelos();
    this.activa = true;
    this._ciclo();
    return true;
  }

  apagar() {
    this.activa = false;
    if (this.video && this.video.srcObject) this.video.srcObject.getTracks().forEach((t) => t.stop());
  }

  // ── cuadro a cuadro (unas 6 veces por segundo) ───────────
  async _ciclo() {
    while (this.activa) {
      const t0 = performance.now();
      try { await this.procesar(this.video); } catch (e) { /* un cuadro fallido no corta la sesión */ }
      const espera = Math.max(250, 450 - (performance.now() - t0)); // 2 veces por segundo: no le saca la placa de video al 3D
      await new Promise((r) => setTimeout(r, espera));
    }
  }

  async procesar(img) {
    const w = img.videoWidth || img.naturalWidth || img.width, h = img.videoHeight || img.naturalHeight || img.height;
    if (!w || !h) return null;
    const esc = Math.min(1, 320 / w);
    this.fuente.width = Math.round(w * esc); this.fuente.height = Math.round(h * esc);
    this.fx.drawImage(img, 0, 0, this.fuente.width, this.fuente.height);
    const r = await faceapi.detectSingleFace(this.fuente, new faceapi.TinyFaceDetectorOptions({ inputSize: 160, scoreThreshold: 0.35 })).withFaceLandmarks(true);
    const ahora = performance.now();
    if (!r) {
      this.cara = false;
      if (!this.sinCaraDesde) this.sinCaraDesde = ahora;
      this._info();
      return null;
    }
    this.cara = true;
    this.sinCaraDesde = 0;
    this.caja = r.detection.box;
    const pts = r.landmarks.positions;
    this.pts = pts;
    const x = this._rasgos(this.fuente, pts);
    this.ultimo = x;
    if (this.grabando) this.muestras[this.grabando].push(x);
    if (this.modelo) this._clasificar(x, ahora);
    this._info();
    return x;
  }

  // banda de los ojos alineada → gradientes por celda + brillo
  _rasgos(src, pts) {
    const prom = (a, b) => { let x = 0, y = 0; for (let i = a; i <= b; i++) { x += pts[i].x; y += pts[i].y; } const n = b - a + 1; return [x / n, y / n]; };
    const L = prom(36, 41), R = prom(42, 47);
    const d = Math.hypot(R[0] - L[0], R[1] - L[1]) || 1;
    const ang = Math.atan2(R[1] - L[1], R[0] - L[0]);
    const g = this.gx;
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.fillStyle = '#808080'; g.fillRect(0, 0, AW, AH);
    g.translate(OJO_I[0], OJO_I[1]);
    g.scale((OJO_D[0] - OJO_I[0]) / d, (OJO_D[0] - OJO_I[0]) / d);
    g.rotate(-ang);
    g.translate(-L[0], -L[1]);
    g.drawImage(src, 0, 0);
    g.setTransform(1, 0, 0, 1, 0, 0);
    const px = g.getImageData(0, 0, AW, AH).data;
    const gris = new Float32Array(AW * AH);
    let media = 0;
    for (let i = 0; i < AW * AH; i++) { const v = 0.299 * px[i * 4] + 0.587 * px[i * 4 + 1] + 0.114 * px[i * 4 + 2]; gris[i] = v; media += v; }
    media /= AW * AH;
    const gxv = new Float32Array(NX * NY), gyv = new Float32Array(NX * NY), br = new Float32Array(NX * NY);
    for (let y = 1; y < AH - 1; y++) {
      for (let x = 1; x < AW - 1; x++) {
        const i = y * AW + x;
        const dx = Math.abs(gris[i + 1] - gris[i - 1]);
        const dy = Math.abs(gris[i + AW] - gris[i - AW]);
        const c = Math.floor(y / CH) * NX + Math.floor(x / CW);
        gxv[c] += dx; gyv[c] += dy; br[c] += gris[i];
      }
    }
    const n = NX * NY, out = new Float32Array(n * 3);
    let ng = 0;
    for (let c = 0; c < n; c++) ng += gxv[c] * gxv[c] + gyv[c] * gyv[c];
    ng = Math.sqrt(ng) || 1;
    for (let c = 0; c < n; c++) {
      out[c] = gxv[c] / ng;
      out[n + c] = gyv[c] / ng;
      out[2 * n + c] = (br[c] / (CW * CH) / (media || 1) - 1) * 0.08;
    }
    return out;
  }

  // ── calibración: el moderador toma una muestra sin gafas y otra con gafas ──
  async calibrar(cual, segundos = 3) {
    this.muestras[cual] = [];
    this.grabando = cual;
    this._info();
    await new Promise((r) => setTimeout(r, segundos * 1000));
    this.grabando = null;
    if (this.muestras.sin.length >= 4 && this.muestras.con.length >= 4) this._entrenar();
    this._info();
    return this.muestras[cual].length;
  }

  // discriminante lineal con varianza por rasgo
  _entrenar() {
    const S = this.muestras.sin, C = this.muestras.con, n = S[0].length;
    const media = (A) => { const m = new Float32Array(n); A.forEach((x) => { for (let i = 0; i < n; i++) m[i] += x[i]; }); for (let i = 0; i < n; i++) m[i] /= A.length; return m; };
    const mS = media(S), mC = media(C);
    const v = new Float32Array(n);
    [[S, mS], [C, mC]].forEach(([A, m]) => A.forEach((x) => { for (let i = 0; i < n; i++) v[i] += (x[i] - m[i]) ** 2; }));
    const tot = S.length + C.length;
    let vm = 0; for (let i = 0; i < n; i++) { v[i] /= tot; vm += v[i]; } vm /= n;
    const w = new Float32Array(n), mid = new Float32Array(n);
    for (let i = 0; i < n; i++) { w[i] = (mC[i] - mS[i]) / (v[i] + vm * 0.5 + 1e-6); mid[i] = (mC[i] + mS[i]) / 2; }
    const puntaje = (x) => { let s = 0; for (let i = 0; i < n; i++) s += w[i] * (x[i] - mid[i]); return s; };
    const pc = C.reduce((a, x) => a + puntaje(x), 0) / C.length, ps = S.reduce((a, x) => a + puntaje(x), 0) / S.length;
    const escala = (pc - ps) / 2 || 1;
    this.modelo = { puntaje: (x) => puntaje(x) / escala };
    // qué tan bien separa lo calibrado
    const ok = C.filter((x) => this.modelo.puntaje(x) > 0).length + S.filter((x) => this.modelo.puntaje(x) < 0).length;
    this.calidad = ok / tot;
    this.p = 0.5; this.estable = 0;
  }

  _clasificar(x, ahora) {
    const s = this.modelo.puntaje(x);
    const p = 1 / (1 + Math.exp(-2.5 * s));
    this.p = this.p * 0.4 + p * 0.6;
    const quiere = this.p > 0.68 ? 'con' : this.p < 0.32 ? 'sin' : this.estado;
    if (quiere !== this.estado) {
      if (this.candidato !== quiere) { this.candidato = quiere; this.desde = ahora; }
      else if (ahora - this.desde > 700) {
        this.estado = quiere;
        this.candidato = null;
        if (this.alCambiar) this.alCambiar(quiere);
      }
    } else this.candidato = null;
  }

  // para la pantalla del moderador
  _info(msg) {
    if (!this.alInfo) return;
    let txt = msg;
    if (!txt) {
      if (this.error) txt = this.error;
      else if (!this.activa) txt = 'Cámara apagada';
      else if (this.grabando) txt = `Grabando muestra ${this.grabando === 'sin' ? 'sin gafas' : 'con gafas'}… (${this.muestras[this.grabando].length})`;
      else if (!this.cara) txt = 'No veo una cara: que mire a la cámara';
      else if (!this.modelo) txt = `Cara detectada. Falta calibrar${this.muestras.sin.length >= 4 ? '' : ' sin gafas'}${this.muestras.con.length >= 4 ? '' : ' con gafas'}.`;
      else txt = `${this.estado === 'con' ? 'Con gafas' : this.estado === 'sin' ? 'Sin gafas' : 'Mirando…'} · ${Math.round(this.p * 100)}% · calibración ${Math.round(this.calidad * 100)}%`;
    }
    this.alInfo({ txt, cara: this.cara, caja: this.caja, p: this.p, estado: this.estado, listo: !!this.modelo, grabando: this.grabando });
  }
}
