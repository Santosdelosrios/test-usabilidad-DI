// Las 6 tareas del test de usabilidad. Cada una sabe cómo empezar y cuándo se logró.
// Cada tarea sigue el guion de la prueba: escenario (contexto) + tarea + "convierte cuando".
export const TAREAS = [
  {
    n: 1, tit: 'Arrancá el día', parada: 'entrada', hora: 9 * 60 + 22, bloque: 'Llegada',
    esc: 'Es martes, son las 9:22 y llegás a la escuela-nodo con tus gafas puestas.',
    txt: 'Averiguá qué te toca primero y pedile a las gafas que te lleven.',
    convierte: 'Activa la guía hacia el aula-taller (o abre su día y llega al taller).',
    ok: (h, nav) => h.st.guia === 'taller' || (h.st.hoyAbierto && nav.current === 'taller'),
  },
  {
    n: 2, tit: 'Aprendé de lo que ves', parada: 'hall', mover: true, hora: 9 * 60 + 24, bloque: 'Descubrir y aprender',
    esc: 'Cruzando el hall ves una mancha de sol sobre el banco. Entra por el óculo del techo.',
    txt: 'Con ayuda del tutor, descubrí dónde va a caer esa luz al mediodía y por qué.',
    convierte: 'Completa el ejercicio con el tutor (predicción + explicación) y queda guardado en su proceso.',
    inicio: (h) => setTimeout(() => h.proponerOculo(true), 900),
    ok: (h) => h.st.oculoResuelto,
  },
  {
    n: 3, tit: 'Descubrí algo más', parada: 'hall', hora: 9 * 60 + 26, bloque: 'Descubrir y aprender',
    esc: 'Te quedan unos minutos antes de entrar al taller. La escuela tiene cosas que todavía no conocés.',
    txt: 'Encontrá algo de la escuela que no conocías, averiguá qué es y guardalo en tu proceso.',
    convierte: 'Guarda al menos una curiosidad en su proceso (Explorar → mirar una marca + → Guardar).',
    ok: (h) => h.st.proceso.some((e) => e.id.startsWith('q-')),
  },
  {
    n: 4, tit: 'Guardá una evidencia', parada: 'hall', hora: 9 * 60 + 28, bloque: 'Descubrir y aprender',
    esc: 'En tu escuela, tu docente evalúa el proceso, no solo el resultado.',
    txt: 'Sacá una foto de algo que muestre lo que aprendiste hoy y comprobá que quedó en tu proceso.',
    convierte: 'Saca una captura y abre su proceso, donde aparece la foto.',
    ok: (h) => h.st.procesoVistoConCaptura,
  },
  {
    n: 5, tit: 'Pedí ayuda', parada: 'taller', mover: true, hora: 9 * 60 + 40, bloque: 'Social y en equipo',
    esc: 'En el taller, tu grupo carga el stock de un negocio de ropa del barrio. No sabés cómo pasar los talles del perchero al sistema y la profe está con otro grupo.',
    txt: 'Conseguí que un compañero te ayude, sin interrumpir a quien está concentrado.',
    convierte: 'Le pide ayuda a Tomi, el compañero disponible (Ana está en foco).',
    ok: (h) => h.st.ayudaDe === 'Tomi',
  },
  {
    n: 6, tit: 'Enseñale a un compañero', parada: 'taller', hora: 9 * 60 + 52, bloque: 'Social y en equipo',
    esc: 'Santi vio la luz moviéndose por las gradas y te escribe para preguntarte qué descubriste.',
    txt: 'Respondele a Santi con lo que aprendiste, sin dejar lo que estás haciendo.',
    convierte: 'Le manda a Santi su evidencia de la luz del óculo.',
    inicio: (h) => setTimeout(() => h.preguntaSanti(), 1800),
    ok: (h) => h.st.ensenoSanti,
  },
  {
    n: 7, tit: 'Mirá qué ve tu docente', parada: 'taller', hora: 10 * 60 + 5, bloque: 'Proceso',
    esc: 'Prof. Sosa va a revisar el proceso de tu grupo antes de la presentación.',
    txt: 'Fijate qué parte de tu proceso le llega y destacá la evidencia que mejor muestre lo que aprendiste.',
    convierte: 'Destaca una evidencia y abre la vista del docente.',
    inicio: (h) => { h.st.vistoDocente = false; },
    ok: (h) => h.st.proceso.some((e) => e.dest) && h.st.vistoDocente,
  },
  {
    n: 8, tit: 'Presentá con tu grupo', parada: 'taller', hora: 10 * 60 + 26, bloque: 'Social y en equipo',
    esc: 'Son las 10:26. Tu grupo presenta el avance del proyecto de stock en la zona de proyección.',
    txt: 'Mostrale a la clase, en el pizarrón de la zona, el gráfico que hicieron con Tomi y Ana.',
    convierte: 'El gráfico aparece en el pizarrón de la zona 04.',
    inicio: (h) => { h.st.compartido = null; h.S.compartido = null; },
    ok: (h) => h.st.compartido === 'pizarron',
  },
  {
    n: 9, tit: 'Concentrate', parada: 'proyeccion', hora: 11 * 60 + 12, bloque: 'Bienestar',
    esc: 'Tenés que terminar un texto y necesitás un rato sin interrupciones.',
    txt: 'Buscá un lugar tranquilo, poné las gafas en modo foco y averiguá si tu docente sigue viendo lo que hacés.',
    convierte: 'Activa el foco y abre el estado del seguimiento.',
    ok: (h) => h.st.foco && h.st.segVistoEnFoco,
  },
  {
    n: 10, tit: 'Sin internet', parada: 'rincon', hora: 11 * 60 + 50, bloque: 'Imprevisto',
    esc: 'Se cortó internet en todo el barrio.',
    txt: 'Averiguá qué podés seguir haciendo en la escuela y cuántas cosas quedaron esperando para enviarse.',
    convierte: 'Abre el estado de la conexión en modo local.',
    inicio: (h) => setTimeout(() => { if (!h.st.local) h.setLocal(true); }, 2500),
    ok: (h) => h.st.local && h.st.conexVistaLocal,
  },
];

export class Tareas {
  constructor({ hud, nav }) {
    this.hud = hud;
    this.nav = nav;
    this.i = 0;
    this.activa = false;
    this.hechas = new Set();
    this.ev = {};
    const $ = (id) => document.getElementById(id);
    this.el = { card: $('tarea'), num: $('t-num'), tit: $('t-tit'), esc: $('t-esc'), txt: $('t-txt'), estado: $('t-estado'), sig: $('t-sig'), menu: $('t-menu'), lista: $('t-lista') };
    hud.on('cambio', () => this.check());
    nav.on('stop', () => this.check());
    this.el.sig.addEventListener('click', () => this.siguiente());
    this.el.menu.addEventListener('click', () => { this.el.lista.hidden = !this.el.lista.hidden; });
    this._lista();
  }

  on(e, f) { (this.ev[e] ||= []).push(f); }
  emit(e, ...a) { (this.ev[e] || []).forEach((f) => f(...a)); }

  _lista() {
    const ul = this.el.lista;
    ul.innerHTML = '';
    TAREAS.forEach((T) => {
      const li = document.createElement('li');
      li.className = this.hechas.has(T.n) ? 'hecha' : '';
      li.innerHTML = `<button type="button">${T.n} · ${T.tit}</button>`;
      li.querySelector('button').addEventListener('click', () => { ul.hidden = true; this.empezar(T.n, { saltar: true }); });
      ul.appendChild(li);
    });
    const li = document.createElement('li');
    li.innerHTML = '<button type="button">↺ Reiniciar la prueba</button>';
    li.querySelector('button').addEventListener('click', () => { ul.hidden = true; this.hechas.clear(); this.empezar(1, { saltar: true }); });
    ul.appendChild(li);
  }

  // Deja el mundo listo para la tarea n (cuando se salta directo a ella)
  _preparar(n) {
    const h = this.hud, st = h.st, nav = this.nav;
    const T = TAREAS[n - 1];
    if (n === 1) {
      h.reset();
    } else {
      h.conectar(true);
      if (st.local) h.setLocal(false);
      if (st.foco) h.setFoco(false);
      h.cerrarPanel();
      h.cerrarTutor(true);
      h.guiar(null);
      if (n === 2) { st.oculoResuelto = false; st.proceso = st.proceso.filter((e) => e.id !== 'oc'); h.oculo.reset(); }
      if (n >= 3 && !st.oculoResuelto) {
        h.oculo.reset();
        st.oculoResuelto = true; st.oculoAcierto = true; st.oculoAyudas = 1;
        st.proceso = st.proceso.filter((e) => e.id !== 'oc');
        st.proceso.push({ id: 'oc', hora: '9:25', txt: 'La luz del óculo: acerté dónde cae a las 12 y entendí por qué (con 1 pista)', visible: true, dest: false, tag: 'Nuevo' });
      }
      if (n === 3) st.proceso = st.proceso.filter((e) => !e.id.startsWith('q-'));
      if (n === 4) { st.procesoVistoConCaptura = false; st.proceso = st.proceso.filter((e) => e.tag !== 'Captura'); }
      if (n === 5) { st.ayudaDe = null; st.tomiAvisado = false; }
      if (n === 6) { st.ensenoSanti = false; st.santiPregunta = false; }
      if (n === 7) { st.vistoDocente = false; st.proceso.forEach((e) => (e.dest = false)); }
      if (n === 8) { st.compartido = null; h.S.compartido = null; }
      if (n === 9) { st.segVistoEnFoco = false; st.seg = 'activo'; h._estadoSeg(); }
      if (n === 10) { st.conexVistaLocal = false; }
    }
    nav.walk = null;
    nav.current = null;
    nav.goTo(T.parada, { instant: true });
    h.setHora(T.hora);
  }

  empezar(n, { saltar = false } = {}) {
    const T = TAREAS[n - 1];
    if (saltar) this._preparar(n);
    else h_prepContinuo(this.hud, n);
    this.i = n;
    this.activa = true;
    this.inicioT = performance.now();
    if (T.inicio) T.inicio(this.hud);
    const c = this.el;
    c.card.hidden = false;
    c.card.classList.remove('lograda');
    c.num.textContent = `Tarea ${n}`;
    c.tit.textContent = T.tit;
    c.esc.textContent = T.esc;
    c.txt.textContent = T.txt;
    c.estado.textContent = 'En curso';
    c.estado.className = '';
    c.sig.hidden = true;
    this.emit('inicio', n);
    this.check();
  }

  check() {
    if (!this.activa || this.hechas.has(this.i)) return;
    const T = TAREAS[this.i - 1];
    if (T && T.ok(this.hud, this.nav)) this._lograda();
  }

  _lograda() {
    this.hechas.add(this.i);
    const c = this.el;
    c.card.classList.add('lograda');
    c.estado.textContent = '✓ Lograda';
    c.estado.className = 'ok';
    c.sig.hidden = false;
    c.sig.textContent = this.i < TAREAS.length ? 'Siguiente tarea →' : 'Terminar →';
    this._lista();
    this.emit('logro', this.i, performance.now() - this.inicioT);
  }

  siguiente() {
    if (this.i < TAREAS.length) this.empezar(this.i + 1);
    else this.fin();
  }

  fin() {
    this.activa = false;
    const c = this.el;
    c.card.classList.remove('lograda');
    c.num.textContent = 'Fin';
    c.tit.textContent = `Terminaste las ${TAREAS.length} tareas`;
    c.esc.textContent = '';
    c.txt.textContent = '¡Gracias! Ahora vienen unas preguntas cortas sobre cómo te fue y qué te pareció este futuro.';
    c.estado.textContent = `${this.hechas.size} de ${TAREAS.length} logradas`;
    c.estado.className = 'ok';
    c.sig.hidden = true;
    this.emit('fin');
  }

  ocultar(v) { this.el.card.hidden = v || !this.activa && this.el.num.textContent !== 'Fin'; }
}

// Al pasar de una tarea a la siguiente sin saltar: solo lo que el escenario necesita
function h_prepContinuo(h, n) {
  const T = TAREAS[n - 1];
  if (T.hora > h.st.minuto) h.setHora(T.hora);
  if (n === 9 && h.st.foco) h.setFoco(false);
  // tareas que pasan en otro lugar y no tratan de llegar: se camina solo hasta ahí
  if (T.mover && h.nav.current !== T.parada) h.nav.goTo(T.parada);
}
