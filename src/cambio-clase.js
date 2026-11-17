// Cambio de clase (la clase en la mesa, tareas-ia.js): al terminar una materia (y su repaso), la persona
// se levanta de su mesa, gira, camina por la línea naranja que marcan las gafas hasta la mesa de la materia
// siguiente y se sienta: de Biología (consignas 1 a 3) a la mesa de atrás, donde es Matemática (4 a 6), y
// de ahí a la mesa junto al perchero, donde es Arte (7). Es automático: dura unos diez segundos y no hay
// que tocar nada (mientras dura, el mouse no mueve la vista: ver nav.guion).
// Este módulo dice dónde se sienta y cómo se mueve la cámara; tareas-ia.js lo pone en marcha.

const D = Math.PI / 180;
const DE_PIE = 1.55; // altura de los ojos parado (la misma del recorrido por la escuela)

// La cámara sentada en cada clase: p (ojos), hacia dónde mira (yaw: 0 = sur, 180 = norte), dónde flota el
// corazón si se lo piden y dónde va la pantalla de la mesa con la materia (giro: para leerla desde ese lado).
export const ASIENTOS = {
  biologia: { p: [-12.0, 1.2, 2.45], yaw: 180, pitch: -9, mesa: [-12.0, 1.4, 3.5], pantalla: { p: [-12.0, 0.777, 3.33], giro: 0 } },
  // la banqueta libre de la mesa de atrás (mesa 4), del lado que mira al fondo del aula
  matematica: { p: [-12.5, 1.2, -2.62], yaw: 0, pitch: -9, mesa: [-12.5, 1.4, -3.67], pantalla: { p: [-12.5, 0.777, -3.5], giro: 180 } },
  // la banqueta libre de la mesa junto al perchero (mesa 1), del mismo lado que la de Biología (al lado se sienta Juli)
  arte: { p: [-16.85, 1.2, 2.45], yaw: 180, pitch: -9, mesa: [-16.85, 1.4, 3.5], pantalla: { p: [-16.85, 0.777, 3.33], giro: 0 } },
};

// Cada cambio, en segundos desde que termina la materia (después de su repaso):
// pararse (antes, la tarjeta y el tutor avisan), girar, caminar con la línea en el piso, sentarse y fin
// (arranca la primera consigna de la materia nueva).
// rumbo: el camino va en diagonal, así que mientras camina mira hacia donde va y al sentarse gira hacia la mesa.
const CAMBIOS = {
  // gira por el lado del hall, no contra el perchero, y camina unos 4,5 m
  'biologia>matematica': {
    tiempos: { pararse: [2.0, 3.3], girar: [2.5, 4.3], linea: [2.9, 8.2], caminar: [3.6, 7.6], sentarse: [7.4, 8.8], fin: 9.4 },
  },
  // cruza el pasillo en diagonal hasta la mesa junto al perchero: unos 6 m, al mismo paso
  'matematica>arte': {
    rumbo: true,
    tiempos: { pararse: [2.0, 3.3], girar: [2.6, 4.2], linea: [2.9, 9.8], caminar: [3.6, 9.2], sentarse: [8.9, 10.4], fin: 11.0 },
  },
};

// paso atrás de un asiento: donde se queda de pie al levantarse o antes de sentarse
const atras = (s, d) => [s.p[0] + Math.sin(s.yaw * D) * d, s.p[2] + Math.cos(s.yaw * D) * d];
const avance = (t, [a, b]) => { const x = Math.min(1, Math.max(0, (t - a) / (b - a))); return x * x * (3 - 2 * x); };

// El camino de un asiento a otro (claves de ASIENTOS): lo que dibujan las gafas en el piso (ruta), cuánto dura
// cada parte (tiempos) y dónde está la cámara a los t segundos (pose: { x, y, z, yaw, pitch }, en radianes).
export function trayecto(de, a) {
  const A = ASIENTOS[de], B = ASIENTOS[a], C = CAMBIOS[`${de}>${a}`];
  const T = C.tiempos;
  const P0 = [A.p[0], A.p[2]];
  const P1 = atras(A, 0.25);
  const P2 = atras(B, 0.35);
  const P3 = [B.p[0], B.p[2]];
  const LARGO = Math.hypot(P2[0] - P1[0], P2[1] - P1[1]);
  const GIRO = (((B.yaw - A.yaw) % 360) + 360) % 360;
  // hacia dónde mira mientras camina: sin rumbo, ya mira hacia la mesa nueva; con rumbo, hacia donde va
  let medio = A.yaw + GIRO;
  if (C.rumbo) {
    medio = Math.atan2(-(P2[0] - P1[0]), -(P2[1] - P1[1])) / D;
    while (medio < A.yaw) medio += 360;
    while (medio > A.yaw + GIRO) medio -= 360;
  }
  return {
    ruta: [P1, P2, P3],
    tiempos: T,
    pose(t) {
      const kPar = avance(t, T.pararse), kGir = avance(t, T.girar), kCam = avance(t, T.caminar), kSen = avance(t, T.sentarse);
      // en el piso: un paso atrás al pararse, la caminata y un paso adelante al sentarse
      const x = P0[0] + (P1[0] - P0[0]) * kPar + (P2[0] - P1[0]) * kCam + (P3[0] - P2[0]) * kSen;
      const z = P0[1] + (P1[1] - P0[1]) * kPar + (P2[1] - P1[1]) * kCam + (P3[1] - P2[1]) * kSen;
      // la altura: sube al pararse, se mece un poco al caminar y baja al sentarse
      const vaiven = Math.sin(((kCam * LARGO) / 0.7) * Math.PI) * 0.016 * Math.sin(Math.PI * kCam);
      const y = A.p[1] + (DE_PIE - A.p[1]) * kPar + (B.p[1] - DE_PIE) * kSen + vaiven;
      // la mirada: gira hacia donde va (o hacia la mesa nueva) y, al sentarse, termina de girar hacia la mesa
      const yaw = (A.yaw + (medio - A.yaw) * kGir + (A.yaw + GIRO - medio) * kSen) * D;
      // parado mira un poco más adelante; sentado, la mesa
      const pitch = (A.pitch + (-6 - A.pitch) * kPar + (B.pitch + 6) * kSen) * D;
      return { x, y, z, yaw, pitch };
    },
  };
}
