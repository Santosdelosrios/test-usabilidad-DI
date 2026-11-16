// Ayuda del tutor: la «documentación» de todo lo que se puede hacer en la simulación, y el
// contexto del usuario en cada momento. Con eso el tutor siempre tiene una respuesta: al mirarlo,
// ofrece las preguntas que corresponden a lo que está pasando, y «Otra pregunta…» muestra todas.
// No usa IA: las respuestas están escritas y se arman con el contexto (así todos ven lo mismo).
//
// También: el recorrido guiado de la interfaz al ponerse las gafas, y un empujón si el
// participante se queda sin hacer nada antes de la clase.

const LUGAR = { entrada: 'la entrada', hall: 'el hall', taller: 'el aula-taller', proyeccion: 'la zona de proyección', rincon: 'el rincón tranquilo', nodo: 'la sala del nodo' };

// lo que está pasando ahora, en un objeto (se registra con cada consulta)
export function contexto(h) {
  const nav = h.nav, c = h.clase;
  const enClase = !!(c && c.activa && !c.fin);
  const ej = c && c.ej;
  const lugar = nav.walk ? (nav.walk.to || 'caminando') : (nav.current || 'entrada');
  return {
    lugar,
    caminando: !!nav.walk,
    gafas: !!h.puestas,
    conectada: !!h.st.conectada,
    clase: c ? c.estado() : null,
    pendiente: !!(c && c.pendiente()),
    hecha: !!(c && c.hecha),
    enClase,
    interludio: !!(c && c.interludio),
    tarea: enClase ? c.i : 0,
    materia: enClase && c.i ? (c.i <= 3 ? 'Biología' : 'Matemática') : null,
    consigna: enClase && c.i ? c.consignaActual() : null,
    corazon: !!(c && c.corazon.abierto),
    ejercicio: !!(ej && ej.activo && ej.e && !ej.e.resuelto),
    foco: !!h.st.foco,
    hechas: c ? c.hechas() : 0,
  };
}

const llevar = (h) => ['Llevame a mi mesa', () => { h.cerrarTutor(true); h.clase.sentarse('ayuda'); }];
const sentar = (h) => ['Sentarme', () => { h.cerrarTutor(true); h.clase.sentarse('ayuda'); }];

// cada pregunta: cuándo aplica (si), qué tan útil es ahora (peso) y la respuesta (r)
export const AYUDA = [
  {
    id: 'que-hago', p: '¿Qué tengo que hacer ahora?', si: () => true, peso: (x) => (x.enClase && !x.interludio ? 5 : 10),
    r: (x, h) => {
      if (!x.gafas) return { txt: 'Ponete las gafas para ver tu día.' };
      if (x.pendiente && x.lugar !== 'taller') return { txt: 'Ahora te toca la clase de Biología y Matemática, en tu mesa del aula-taller. Elegí «Llevame a mi mesa» y te llevo.', ops: [llevar(h)] };
      if (x.pendiente) return { txt: 'Tu mesa es esta. Elegí «Sentarme» para empezar la clase.', ops: [sentar(h)] };
      if (x.interludio) return { txt: 'Estás en el cartel del centro. Para elegir una opción, mirala y después mirá el punto naranja que aparece al costado.' };
      if (x.enClase) return { txt: `Estás en la consigna ${x.tarea} de 6, de ${x.materia}: «${x.consigna}» Si te trabás, podés pasar a la siguiente.` };
      if (x.hecha) return { txt: 'Ya terminaste la clase. ¡Muy bien! Avisale a quien te acompaña.' };
      return { txt: 'Mirá tu progreso, arriba a la izquierda: ahí está lo que sigue.' };
    },
  },
  {
    id: 'como-elijo', p: '¿Cómo elijo algo?', si: () => true, peso: () => 3,
    r: () => ({ txt: 'Mirá lo que querés elegir: se marca y aparece un punto naranja al costado. Mirá ese punto un segundo, sin hacer clic, y queda elegido. Mirar el botón solo no elige nada, así que podés leer tranquilo.' }),
  },
  {
    id: 'como-muevo', p: '¿Cómo me muevo?', si: (x) => !x.enClase, peso: (x) => (x.pendiente && x.lugar !== 'taller' ? 6 : 2),
    r: (x, h) => ({
      txt: 'Mirá una flecha blanca del piso (o su cartel) y después el punto naranja que aparece al lado: vas hasta ahí. Si te ofrezco «Llevame», elegilo igual y te llevo yo por la línea naranja. Para girar la cabeza, llevá la mirada al borde izquierdo o derecho de la pantalla.',
      ops: x.pendiente && x.lugar !== 'taller' ? [llevar(h)] : [],
    }),
  },
  {
    id: 'donde', p: '¿Dónde estoy?', si: (x) => !x.enClase, peso: () => 2,
    r: (x, h) => ({
      txt: `${x.caminando ? 'Estamos yendo hacia' : 'Estás en'} ${LUGAR[x.lugar] || 'la escuela'}.${x.pendiente && x.lugar !== 'taller' ? ' Tu mesa está en el aula-taller.' : ''}`,
      ops: x.pendiente && x.lugar !== 'taller' && !x.caminando ? [llevar(h)] : [],
    }),
  },
  {
    id: 'progreso', p: '¿Cuánto me falta?', si: (x) => x.conectada, peso: (x) => (x.enClase ? 4 : 1),
    r: (x) => ({
      txt: x.pendiente ? 'Todavía no empezó la clase: te falta llegar a tu mesa y sentarte. Tu progreso está arriba a la izquierda.'
        : x.hecha ? 'Terminaste todo: la clase y los dos repasos.'
        : `Hiciste ${x.hechas} de 6 consignas. Arriba a la izquierda ves tu progreso completo.`,
    }),
  },
  {
    id: 'corazon-control', p: '¿Cómo pauso o repito la explicación?', si: (x) => x.corazon, peso: () => 7,
    r: () => ({ txt: 'Mirá los botones al costado del corazón: Pausar, Repetir, Más despacio, Girar y Acercar.' }),
  },
  {
    id: 'corazon-parte', p: '¿Cómo pregunto por una parte del corazón?', si: (x) => x.corazon, peso: () => 6,
    r: () => ({ txt: 'Mirá el nombre de la parte y después el punto que aparece al lado: te digo qué es y sigo donde estábamos.' }),
  },
  {
    id: 'ejercicio', p: '¿Cómo resuelvo el ejercicio?', si: (x) => x.ejercicio, peso: () => 7,
    r: () => ({ txt: 'En el cuaderno, elegí el próximo paso entre las tres opciones. Si no sabés cuál, pedime una pista: te ayudo sin darte la respuesta.' }),
  },
  {
    id: 'pasar', p: '¿Cómo paso a la siguiente consigna?', si: (x) => x.enClase && !x.interludio, peso: () => 3,
    r: () => ({ txt: 'Cuando cumplís la consigna, pasa sola. Si te trabás, mirá «Pasar a la siguiente», en la consigna de arriba.' }),
  },
  {
    id: 'callar', p: '¿Cómo hago que no me interrumpas?', si: (x) => x.enClase, peso: (x) => (x.foco ? 0 : 2),
    r: (x, h) => {
      const voz = h.tutorVoz && h.tutorVoz.puede();
      if (x.foco) return { txt: voz ? 'Ya estoy en silencio. Para volver a escucharme, mirame y decime «ya podés hablar».' : 'Ya estoy en silencio. Para volver a escucharme, mirame y elegí «Ya podés hablar».' };
      return { txt: voz ? 'Mirame y decime «no me interrumpas» (o elegilo en estas preguntas): me callo hasta que me digas «ya podés hablar».' : 'Mirame y elegí «No me interrumpas»: me callo hasta que vuelvas a mirarme y elijas «Ya podés hablar».' };
    },
  },
  {
    id: 'repaso', p: '¿Qué es este cartel?', si: (x) => x.interludio, peso: () => 8,
    r: () => ({ txt: 'Es un cambio de materia o un repaso corto. Si es una pregunta, elegí la respuesta que te parezca: te digo enseguida si está bien.' }),
  },
  {
    id: 'gafas', p: '¿Qué pasa si me saco las gafas?', si: () => true, peso: () => 1,
    r: (x, h) => ({ txt: `Con las gafas puestas ves lo digital: tu horario, tu progreso, a mí, la ruta y los nombres de las cosas. Si te las sacás, ves la escuela tal como es, sin nada de eso. Al volver a ponértelas, aparece todo de nuevo. ${h.camaraActiva ? 'Te las sacás de verdad: la cámara se da cuenta.' : 'Para sacártelas o ponértelas, apretá la tecla G.'}` }),
  },
  {
    id: 'tutor', p: '¿Qué podés hacer vos?', si: () => true, peso: () => 1,
    r: (x, h) => ({ txt: `Te explico los temas de la clase, te doy pistas sin darte la respuesta, te llevo a donde tengas que ir y, si querés pensar solo, me callo. Podés consultarme en cualquier momento: mirame y después mirá el punto que aparece al lado${h.tutorVoz && h.tutorVoz.puede() ? '; ahí te escucho y me decís qué necesitás' : ''}.` }),
  },
];

// las preguntas frecuentes se marcan: mientras están abiertas, la explicación del corazón espera
const decirAyuda = (h, txt, ops) => {
  h.decir(txt, ops);
  h.el.opciones.dataset.de = 'ayuda';
  h.consultando = true; // ya mismo (después lo mantiene tutor-voz.js mientras siga abierto)
  const c = h.clase && h.clase.corazon;
  if (c && c.abierto) c.retener(900);
};

function responder(h, q, volver = null) {
  const x = contexto(h);
  const { txt, ops = [] } = q.r(x, h);
  h.registrar('ayuda', `${q.id}|${x.lugar}|${x.clase}|${x.tarea}`);
  decirAyuda(h, txt, [...ops, ['Otra pregunta…', () => todas(h, volver)], ['Listo', () => h.cerrarTutor()]]);
}

function todas(h, volver = null) {
  const x = contexto(h);
  const L = AYUDA.filter((q) => q.si(x)).sort((a, b) => b.peso(x) - a.peso(x));
  h.registrar('ayuda', 'todas');
  decirAyuda(h, 'Elegí tu pregunta:', [...L.map((q) => [q.p, () => responder(h, q, volver)]), ['Volver', volver || (() => h.abrirTutor())]]);
}

// el menú del tutor: lo que se puede hacer ahora (acciones) + las preguntas más útiles para este momento.
// Con IA y micrófono, mirar al tutor primero lo escucha (tutor-voz.js); «Ver preguntas» abre este menú.
export function abrirAyuda(h, acciones = [], { menu = false } = {}) {
  if (!menu && h.tutorVoz && h.tutorVoz.puede()) return h.tutorVoz.escuchar(() => abrirAyuda(h, acciones, { menu: true }));
  const volver = () => abrirAyuda(h, acciones, { menu: true });
  const x = contexto(h);
  const n = 2;
  const sug = AYUDA.filter((q) => q.si(x)).sort((a, b) => b.peso(x) - a.peso(x)).slice(0, n);
  h.registrar('tutor', 'abrir');
  decirAyuda(h, `${h.tutorVoz && h.tutorVoz.puede() ? 'Estas son las preguntas frecuentes' : `Te escucho${h._coma()}`}. ¿Qué necesitás?`, [
    ...acciones,
    ...sug.map((q) => [q.p, () => responder(h, q, volver)]),
    ['Otra pregunta…', () => todas(h, volver)],
    ...(h.tutorVoz && h.tutorVoz.puede() ? [['Hablarle', () => h.tutorVoz.escuchar(volver)]] : []),
    ['Nada, gracias', () => h.cerrarTutor()],
  ]);
}

// antes de la clase: lo único que hay que hacer es llegar a la mesa y sentarse
function accionesMundo(h) {
  const x = contexto(h);
  if (!x.pendiente || x.caminando) return [];
  return [x.lugar === 'taller' ? sentar(h) : llevar(h)];
}

// ── recorrido guiado de la interfaz, la primera vez que se pone las gafas ──
const PASOS_TOUR = [
  { sel: '#hud-hoy', lado: 'der', txt: 'Este es tu día y tu progreso. Se va completando a medida que avanzás.' },
  { sel: '#hud-tutor-yo', lado: 'arriba', txt: (h) => (h.tutorVoz && h.tutorVoz.puede() ? 'Este soy yo, tu tutor. Cuando necesites algo, mirame y después mirá el punto que aparece al lado: te escucho y me lo decís en voz alta.' : 'Este soy yo, tu tutor. Cuando tengas una duda, mirame y después mirá el punto que aparece al lado: te muestro qué podés preguntarme.') },
  { sel: null, lado: 'centro', txt: 'La línea naranja del piso te lleva a tu mesa. Para ir directo, elegí «Llevame» cuando te lo ofrezca.' },
];

export function recorridoGuiado(h, alTerminar) {
  const hud = document.getElementById('hud');
  let caja = document.getElementById('guia-tour');
  if (!caja) {
    caja = document.createElement('div');
    caja.id = 'guia-tour';
    caja.innerHTML = '<span class="k"></span><p></p><button type="button">Entendido</button>';
    hud.appendChild(caja);
  }
  let i = 0, resaltado = null;
  const fin = () => {
    if (resaltado) resaltado.classList.remove('resaltado');
    caja.hidden = true;
    h.cerrarGuia = null;
    h.registrar('guia', 'fin');
    if (alTerminar) alTerminar();
  };
  const mostrar = () => {
    if (resaltado) resaltado.classList.remove('resaltado');
    const P = PASOS_TOUR[i];
    if (i === 2 && h.clase && h.clase.pendiente()) h.guiar('taller', true); // que se vea la línea naranja
    caja.querySelector('.k').textContent = `Tus gafas · ${i + 1} de ${PASOS_TOUR.length}`;
    caja.querySelector('p').textContent = typeof P.txt === 'function' ? P.txt(h) : P.txt;
    caja.querySelector('button').textContent = i === PASOS_TOUR.length - 1 ? 'Entendido · empezar' : 'Entendido';
    caja.hidden = false;
    caja.className = P.lado;
    resaltado = P.sel ? document.querySelector(P.sel) : null;
    if (resaltado) resaltado.classList.add('resaltado');
    // al lado de lo que explica
    const r = resaltado ? resaltado.getBoundingClientRect() : null;
    caja.style.left = caja.style.top = caja.style.bottom = '';
    if (r && P.lado === 'der') { caja.style.left = `${r.right + 18}px`; caja.style.top = `${r.top}px`; }
    else if (r && P.lado === 'arriba') { caja.style.left = `${Math.max(16, r.left + r.width / 2 - 170)}px`; caja.style.bottom = `${innerHeight - r.top + 18}px`; }
    h.registrar('guia', `paso:${i + 1}`);
  };
  caja.querySelector('button').onclick = () => { i++; if (i >= PASOS_TOUR.length) fin(); else mostrar(); };
  // si la clase arranca antes de terminar el recorrido (el moderador apretó F8), se cierra sin saludar
  h.cerrarGuia = () => { if (resaltado) resaltado.classList.remove('resaltado'); caja.hidden = true; h.guiaAbierta = false; h.cerrarGuia = null; };
  mostrar();
}

// ── instalar: menú del tutor y empujón si se queda quieto antes de la clase ──
export function instalarAyuda(h) {
  h.alAbrirTutor = () => abrirAyuda(h, accionesMundo(h));
  let ultima = performance.now(), empujones = 0;
  h.on('registro', (r) => { if (r.tipo !== 'empujon') ultima = performance.now(); });
  setInterval(() => {
    const x = contexto(h);
    if (!x.conectada || !x.gafas || !x.pendiente || x.caminando || h.tutorAbierto || h.guiaAbierta) return;
    // si el tutor ya le está ofreciendo algo, no se le encima otra oferta
    if (h.propuesta && h.propuesta.opciones && h.propuesta.opciones.length) { ultima = performance.now(); return; }
    if (performance.now() - ultima < 35000 || empujones >= 3) return;
    empujones++;
    ultima = performance.now();
    h.registrar('empujon', String(empujones));
    h.proponer('¿Te ayudo? Tu clase es en tu mesa del aula-taller.', [x.lugar === 'taller' ? sentar(h) : llevar(h), ['¿Qué tengo que hacer?', () => responder(h, AYUDA[0])]]);
  }, 5000);
}
