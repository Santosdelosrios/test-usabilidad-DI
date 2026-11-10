// Pares tipográficos. Se eligen en la capa de Revisión y se aplican a todo:
// interfaz de las gafas, capa de revisión y los textos dibujados dentro del mundo 3D.
export const TIPOS = {
  grotesk: {
    nombre: 'Grotesk espacial', display: "'Space Grotesk'", texto: "'Space Grotesk'", mono: "'Space Mono'",
    estirar: 'normal', pesoD: 500, pesoT: 400, pesoM: 400, monoEsp: 0.7,
  },
  cine: {
    nombre: 'Cine', display: "'Michroma'", texto: "'Inter'", mono: "'Share Tech Mono'",
    estirar: 'normal', pesoD: 400, pesoT: 400, pesoM: 400, monoEsp: 1,
  },
  sistema: {
    nombre: 'Sistema', display: "'Manrope'", texto: "'Manrope'", mono: "'DM Mono'",
    estirar: 'normal', pesoD: 600, pesoT: 500, pesoM: 500, monoEsp: 0.85,
  },
  moodboard: {
    nombre: 'Moodboard', display: "'Archivo'", texto: "'Archivo'", mono: "'JetBrains Mono'",
    estirar: 'expanded', pesoD: 400, pesoT: 400, pesoM: 500, monoEsp: 1,
  },
};

let actual = 'grotesk';
try { const g = localStorage.getItem('hilo-tipo'); if (TIPOS[g]) actual = g; } catch (e) { /* sin almacenamiento */ }

export const tipoActual = () => actual;
export const tipo = () => TIPOS[actual];

// font de canvas: k = 'display' | 'texto' | 'mono'
export function fuente(k, px) {
  const t = TIPOS[actual];
  const fam = k === 'display' ? t.display : k === 'texto' ? t.texto : t.mono;
  const peso = k === 'display' ? t.pesoD : k === 'texto' ? t.pesoT : t.pesoM;
  return `${peso} ${Math.round(px)}px ${fam}, system-ui, sans-serif`;
}
export const estiramiento = (k) => (k === 'display' ? TIPOS[actual].estirar : 'normal');

export function aplicarCSS() {
  const t = TIPOS[actual], s = document.documentElement.style;
  s.setProperty('--display', `${t.display}, 'Helvetica Neue', Arial, sans-serif`);
  s.setProperty('--texto', `${t.texto}, 'Helvetica Neue', Arial, sans-serif`);
  s.setProperty('--mono', `${t.mono}, ui-monospace, Menlo, monospace`);
  s.setProperty('--estirar', t.estirar === 'expanded' ? '125%' : '100%');
  s.setProperty('--peso-d', t.pesoD);
  s.setProperty('--peso-t', t.pesoT);
  s.setProperty('--peso-m', t.pesoM);
  s.setProperty('--esp-m', t.monoEsp);
}

export async function cargar() {
  const t = TIPOS[actual];
  try {
    await Promise.all([
      document.fonts.load(`${t.pesoD} 40px ${t.display}`),
      document.fonts.load(`${t.pesoT} 20px ${t.texto}`),
      document.fonts.load(`${t.pesoM} 20px ${t.mono}`),
    ]);
  } catch (e) { /* sigue con lo que haya */ }
}

export async function setTipo(k) {
  if (!TIPOS[k]) return;
  actual = k;
  try { localStorage.setItem('hilo-tipo', k); } catch (e) { /* sin almacenamiento */ }
  aplicarCSS();
  await cargar();
}
