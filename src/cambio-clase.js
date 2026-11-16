// Cambio de clase (la clase en la mesa, tareas-ia.js): entre Biología (consignas 1 a 3 y su repaso) y
// Matemática (4 a 6), la persona se levanta de su mesa, gira, camina por la línea naranja que marcan las
// gafas hasta la mesa de atrás y se sienta. Es automático: dura unos diez segundos y no hay que tocar nada
// (mientras dura, el mouse no mueve la vista: ver nav.guion).
// Este módulo dice dónde se sienta y cómo se mueve la cámara; tareas-ia.js lo pone en marcha.

const D = Math.PI / 180;
const DE_PIE = 1.55; // altura de los ojos parado (la misma del recorrido por la escuela)

// La cámara sentada en cada clase: p (ojos), hacia dónde mira (yaw: 0 = sur, 180 = norte), dónde flota el
// corazón si se lo piden y dónde va la pantalla de la mesa con la materia (giro: para leerla desde ese lado).
export const ASIENTOS = {
  biologia: { p: [-12.0, 1.2, 2.45], yaw: 180, pitch: -9, mesa: [-12.0, 1.4, 3.5], pantalla: { p: [-12.0, 0.777, 3.33], giro: 0 } },
  // la banqueta libre de la mesa de atrás (mesa 4), del lado que mira al fondo del aula
  matematica: { p: [-12.5, 1.2, -2.62], yaw: 0, pitch: -9, mesa: [-12.5, 1.4, -3.67], pantalla: { p: [-12.5, 0.777, -3.5], giro: 180 } },
};

// Segundos desde que termina Biología (después de su repaso).
export const TIEMPOS = {
  pararse: [2.0, 3.3],   // antes, la tarjeta y el tutor avisan; se levanta
  girar: [2.5, 4.3],     // gira por el lado del hall hacia la mesa de atrás
  linea: [2.9, 8.2],     // las gafas marcan el camino en el piso
  caminar: [3.6, 7.6],   // camina unos 4,5 m
  sentarse: [7.4, 8.8],  // se sienta mirando la mesa nueva
  fin: 9.4,              // arranca la consigna 4
};

// paso atrás de un asiento: donde se queda de pie al levantarse o antes de sentarse
const atras = (s, d) => [s.p[0] + Math.sin(s.yaw * D) * d, s.p[2] + Math.cos(s.yaw * D) * d];
const A = ASIENTOS.biologia, B = ASIENTOS.matematica;
const P0 = [A.p[0], A.p[2]];
const P1 = atras(A, 0.25);
const P2 = atras(B, 0.35);
const P3 = [B.p[0], B.p[2]];
const LARGO = Math.hypot(P2[0] - P1[0], P2[1] - P1[1]);
const GIRO = (((B.yaw - A.yaw) % 360) + 360) % 360; // 180: gira por el lado del hall, no contra el perchero

// lo que dibujan las gafas en el piso, de donde se para hasta la banqueta nueva
export const RUTA = [P1, P2, P3];

const avance = (t, [a, b]) => { const x = Math.min(1, Math.max(0, (t - a) / (b - a))); return x * x * (3 - 2 * x); };

// dónde está la cámara a los t segundos: { x, y, z, yaw, pitch } (ángulos en radianes)
export function pose(t) {
  const T = TIEMPOS;
  const kPar = avance(t, T.pararse), kGir = avance(t, T.girar), kCam = avance(t, T.caminar), kSen = avance(t, T.sentarse);
  // en el piso: un paso atrás al pararse, la caminata y un paso adelante al sentarse
  const x = P0[0] + (P1[0] - P0[0]) * kPar + (P2[0] - P1[0]) * kCam + (P3[0] - P2[0]) * kSen;
  const z = P0[1] + (P1[1] - P0[1]) * kPar + (P2[1] - P1[1]) * kCam + (P3[1] - P2[1]) * kSen;
  // la altura: sube al pararse, se mece un poco al caminar y baja al sentarse
  const vaiven = Math.sin(((kCam * LARGO) / 0.7) * Math.PI) * 0.016 * Math.sin(Math.PI * kCam);
  const y = A.p[1] + (DE_PIE - A.p[1]) * kPar + (B.p[1] - DE_PIE) * kSen + vaiven;
  // la mirada: parado mira un poco más adelante; sentado, la mesa
  const yaw = (A.yaw + GIRO * kGir) * D;
  const pitch = (A.pitch + (-6 - A.pitch) * kPar + (B.pitch + 6) * kSen) * D;
  return { x, y, z, yaw, pitch };
}
