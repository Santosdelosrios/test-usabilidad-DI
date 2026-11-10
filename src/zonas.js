// Zonas de la escuela: sirven para saber qué se ve desde dónde y qué vale la pena actualizar.
export function zona(x, z) {
  if (z > 8.2) return 'plaza';
  if (x < -8) return z > -12 ? 'taller' : 'otro';
  if (x > 8.15 && z > -5.85) return 'rincon';
  if (x > 10 && z < -10) return 'nodo';
  if (x > 8.15) return 'pasillo';
  if (z < -8) return 'proyeccion';
  return 'hall';
}

export const VE = {
  plaza: ['plaza', 'hall'], hall: ['hall', 'proyeccion', 'plaza', 'taller', 'rincon'], taller: ['taller', 'hall'],
  rincon: ['rincon', 'hall'], proyeccion: ['proyeccion', 'hall', 'nodo', 'pasillo'], pasillo: ['pasillo', 'proyeccion', 'nodo'],
  nodo: ['nodo', 'proyeccion', 'pasillo'], otro: [],
};
