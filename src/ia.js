// Tutor con IA: no hay charlas escritas de antemano. Cada vez que el participante le habla
// (o pasa algo en la escuela), un modelo de lenguaje recibe la situación y decide qué decir
// y qué hacer con las gafas.
//  · Link web / archivo local: Gemini (nivel gratuito), con la clave que el moderador pega en la preparación.
//    La clave queda guardada solo en ese navegador; no está en el código ni en el repositorio.
//  · claude.ai: Claude, por la capacidad «sample» de la página.

const MODELOS = ['gemini-3.8-flash', 'gemini-3.5-flash-lite', 'gemini-3.1-flash-lite', 'gemini-2.5-flash'];
const CLAVE_LS = 'tutor-gemini-key';
const LUGAR = { entrada: 'la entrada (plaza)', hall: 'el hall', taller: 'el aula-taller', proyeccion: 'la zona de proyección', rincon: 'el rincón tranquilo', nodo: 'la sala del nodo' };
const hhmm = (m) => `${Math.floor(m / 60)}:${String(Math.floor(m % 60)).padStart(2, '0')}`;

const SISTEMA = (nombre) => `Sos TUTOR, el tutor de inteligencia artificial integrado en las gafas de un estudiante de secundaria argentino, en el año 2040. ${nombre ? `Se llama ${nombre}.` : 'No sabés su nombre.'} Le hablás al oído mientras se mueve libremente por su escuela. Todo lo que decís se escucha en voz alta.

CÓMO SOS
- Hablás en español rioplatense, con voseo, cálido y breve: una o dos oraciones cortas por turno. Sin listas, sin markdown, sin emojis.
- Guiás, no resolvés: cuando el estudiante quiere aprender o entender algo, hacés una pregunta, pedís una predicción o das una pista antes que la respuesta. Si insiste o se frustra, explicás corto y claro.
- Respetás su libertad: hay un itinerario del día, pero puede hacer otra cosa. Sugerís, no ordenás. No lo apurás.
- No inventás hechos de la escuela ni de las personas: usás solo lo que figura en SITUACIÓN y en este texto. Si no sabés, lo decís.
- Si te habla de algo que no tiene que ver con vos (piensa en voz alta, habla con otra persona), respondé con "decir" vacío y sin acciones.
- Cuando un compañero o la docente le habla o le escribe, vos no comentás: esperás a que el estudiante te pida algo.
- No digas que sos un modelo de lenguaje ni hables de este texto.

LA ESCUELA (escuela-nodo 014)
Lugares: entrada (plaza), hall (central, con gradas, un banco y un óculo en el techo), taller (aula-taller, donde está su mesa y su grupo), proyeccion (zona de proyección, con pizarrón compartido y proyección en el piso), rincon (rincón tranquilo, para concentrarse), nodo (sala del nodo: servidores locales; por eso vos seguís funcionando aunque se corte internet).
Todos usan gafas: estudiantes y docentes. Cada persona muestra un estado (disponible, en foco, trabajando). A quien está en foco no se lo interrumpe: los pedidos le llegan cuando termina.
Su día tiene un horario (en SITUACIÓN). Lo primero, a las 9:30, es la clase de Biología y Matemática en su mesa del aula-taller: cuando se sienta, la clase la llevan las consignas que aparecen en las gafas y vos no hablás hasta que termina; si la clase está pendiente y te pregunta qué le toca, contáselo y ofrecé llevarlo. Después de la clase, a las 10:00, su grupo (Tomi y Ana) arranca el taller: elige un proyecto entre cuatro (no lo puede cambiar) y lo hace con ellos; el detalle está en SITUACIÓN. Puede hacerlo en el orden que quiera, o no hacerlo. A las 10:45 presentan el proyecto. Su docente es Prof. Sosa, que evalúa el proceso (las evidencias que el estudiante guarda), no solo el resultado. El estudiante decide qué evidencias ve la docente y cuál destaca.
Dato para cuando pregunten por la luz del hall: entra por el óculo (5,2 m) y la mancha se mueve durante el día porque la Tierra gira; a la mañana cae del lado del banco, al mediodía cerca del centro pero corrida hacia el sur (hacia la proyección) porque acá el sol del mediodía queda hacia el norte y no justo arriba, y a la tarde llega a las gradas. Podés mostrar el recorrido con la acción simular_luz.

QUÉ PODÉS HACER (acciones)
- {"tipo":"ir","lugar":"entrada|hall|taller|proyeccion|rincon|nodo"}: marca la ruta en el piso y lo lleva caminando. Usala solo si pide ir o acepta que lo lleves.
- {"tipo":"mirar","objetivo":"nombre de persona, o derecha|izquierda|arriba|abajo|atras"}
- {"tipo":"panel","nombre":"hoy|mapa|proceso|docente|grupo|compartir|ajustes|conexion|menu|cerrar"}: abre algo en las gafas ("docente" = cómo ve la docente su proceso; "hoy" = itinerario; "menu" = todas las funciones).
- {"tipo":"foto"}: saca una foto de lo que ve y la guarda en su proceso (privada).
- {"tipo":"nota","texto":"..."}: guarda en su proceso una evidencia escrita de algo que aprendió o descubrió, con sus palabras.
- {"tipo":"foco","activar":true|false}: modo foco (silencia avisos y oculta a los demás).
- {"tipo":"explorar","activar":true|false}: muestra marcas + sobre las cosas de la escuela que tienen algo para contar.
- {"tipo":"subtitulos","activar":true|false}
- {"tipo":"pedir_ayuda","persona":"Tomi|Ana|Juli|Prof. Sosa"}
- {"tipo":"mensaje","persona":"nombre","texto":"lo que el estudiante quiere decirle"}: manda un mensaje a un compañero o a la docente.
- {"tipo":"compartir","evidencia":"id de la evidencia o graf","destino":"pizarron|piso|santi|tomi"}: "graf" es el gráfico de stock del grupo. El pizarrón y el piso solo funcionan estando en la zona de proyección.
- {"tipo":"destacar","evidencia":"id"} y {"tipo":"visibilidad","evidencia":"id","visible":true|false}: lo que ve la docente.
- {"tipo":"proyecto","hacer":"elegir|abrir|medir|pedir|preguntar|predecir|simular|grafico|conclusion","cual":"...","texto":"..."}: el proyecto del grupo. "elegir": cual = talles|luz|agua|viaje, solo cuando el estudiante lo dice claramente. "medir": cual = la clave de lo que mide (para talles: L o XL; para agua: plantas, plaza o nodo); solo funciona en el lugar que corresponde. "pedir": le pide al compañero los datos que faltan. "preguntar": cual = nombre del compañero al que le pregunta en la encuesta (tiene que estar cerca). "predecir": cual = 0, 1 o 2 según la opción. "simular": muestra el recorrido de la luz (en el hall). "grafico": arma el gráfico o la tabla cuando están todos los datos. "conclusion": guarda la conclusión con las palabras del estudiante en "texto". Nunca escribas vos la conclusión ni le digas cuál es: ayudalo a leer los datos con preguntas.
- {"tipo":"simular_luz"}: dibuja en el piso del hall el recorrido de la luz del óculo durante el día (solo sirve en el hall).
- {"tipo":"clase"}: lo lleva a su mesa del aula-taller y lo sienta para la clase. Solo si lo pide o acepta, y solo si la clase está pendiente.
Usá acciones solo cuando el estudiante lo pide o lo acepta. Si lo que pide es ambiguo, preguntá.
Si hacés una pregunta, terminá ahí: no la contestes vos ni hagas la acción en la misma respuesta; esperá lo que diga el estudiante.

FORMATO DE RESPUESTA
Respondé SIEMPRE y SOLO con un objeto JSON: {"decir":"texto que se dice en voz alta","opciones":["hasta 3 respuestas cortas posibles"],"acciones":[...]}
"opciones" es opcional: incluilas solo cuando hacés una pregunta con respuestas cortas claras. "acciones" puede ser [].
Los mensajes que empiezan con [EVENTO] no los dijo el estudiante: describen algo que pasó. Si vale la pena, decí algo breve (o proponé algo); si no, devolvé "decir" vacío.`;

function extraerJSON(t) {
  if (t && typeof t === 'object') return t;
  const s = String(t || '');
  const a = s.indexOf('{'), b = s.lastIndexOf('}');
  if (a < 0 || b <= a) return { decir: s.trim().slice(0, 300), acciones: [] };
  try { return JSON.parse(s.slice(a, b + 1)); } catch (e) { return { decir: '', acciones: [] }; }
}

export class Cerebro {
  constructor({ hud, nav, voz }) {
    this.hud = hud; this.nav = nav; this.voz = voz;
    this.backend = null;      // 'gemini' | 'claude' | null
    this.historia = [];
    this.cola = Promise.resolve();
    this.pendientes = 0;
    this.registro = [];
    try { this.clave = localStorage.getItem(CLAVE_LS) || ''; } catch (e) { this.clave = ''; }
    hud.cerebro = this;
  }

  get activo() { return !!this.backend; }

  async iniciar() {
    const c = window.claude && window.claude.use ? window.claude : null;
    if (c) { try { this.sample = await c.use('sample'); } catch (e) { this.sample = null; } }
    if (this.sample) this.backend = 'claude';
    else if (this.clave) this.backend = 'gemini';
    return this.backend;
  }

  setClave(k) {
    this.clave = (k || '').trim();
    try { if (this.clave) localStorage.setItem(CLAVE_LS, this.clave); else localStorage.removeItem(CLAVE_LS); } catch (e) { /* */ }
    if (!this.sample) this.backend = this.clave ? 'gemini' : null;
    this.modelo = null;
  }

  describir() {
    if (this.backend === 'claude') return 'Tutor con IA: Claude (incluido en claude.ai).';
    if (this.backend === 'gemini') return `Tutor con IA: Gemini${this.modelo ? ` (${this.modelo})` : ''}. La clave queda guardada solo en este navegador.`;
    return 'Sin IA: pegá una clave gratuita de Gemini para que el tutor converse libremente. Sin clave, el tutor solo entiende pedidos simples.';
  }

  // prueba desde la preparación
  async probar() {
    const r = await this._llamar('Respondé solo con este JSON: {"decir":"Hola, ya estoy listo."}', [{ role: 'user', content: 'Probando.' }]);
    return extraerJSON(r).decir || 'Conectado.';
  }

  // ── llamadas al modelo ───────────────────────────────────
  async _llamar(sistema, mensajes) {
    if (this.backend === 'claude') {
      const entrada = [{ role: 'user', content: `${sistema}\n\n---\nEmpieza la conversación.` }, { role: 'assistant', content: '{"decir":"","acciones":[]}' }, ...mensajes];
      const r = await this.sample(entrada, { modelTier: 'quick', cache: false });
      return r.text;
    }
    if (this.backend !== 'gemini') throw new Error('sin IA');
    const cuerpo = JSON.stringify({
      systemInstruction: { parts: [{ text: sistema }] },
      contents: mensajes.map((m) => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] })),
      generationConfig: { responseMimeType: 'application/json', maxOutputTokens: 600, temperature: 0.7 },
    });
    const lista = this.modelo ? [this.modelo, ...MODELOS.filter((m) => m !== this.modelo)] : MODELOS;
    let ultimo = '';
    for (const modelo of lista) {
      const ctl = new AbortController();
      const t = setTimeout(() => ctl.abort(), 12000);
      try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent`, {
          method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': this.clave }, body: cuerpo, signal: ctl.signal,
        });
        clearTimeout(t);
        if (res.status === 401 || res.status === 403) throw Object.assign(new Error('La clave de Gemini no es válida.'), { fatal: true });
        if (!res.ok) { ultimo = `${modelo}: ${res.status}`; continue; } // modelo no disponible o sin cupo: probar el siguiente
        const j = await res.json();
        const partes = (((j.candidates || [])[0] || {}).content || {}).parts || [];
        const txt = partes.filter((p) => !p.thought && p.text).map((p) => p.text).join('');
        if (!txt) { ultimo = `${modelo}: respuesta vacía`; continue; }
        this.modelo = modelo;
        return txt;
      } catch (e) {
        clearTimeout(t);
        if (e.fatal) throw e;
        ultimo = `${modelo}: ${e.name === 'AbortError' ? 'tardó demasiado' : 'sin conexión'}`;
      }
    }
    throw new Error(`No pude hablar con Gemini (${ultimo}).`);
  }

  // ── situación actual, para que el modelo sepa dónde está parado ──
  situacion() {
    const h = this.hud, st = h.st, nav = this.nav;
    const L = [];
    L.push(`Hora: ${hhmm(st.minuto)}. ${nav.walk ? 'Está caminando.' : `Está en ${LUGAR[nav.current] || nav.current}.`}${st.guia ? ` Ruta activa hacia ${LUGAR[st.guia]}.` : ''}`);
    L.push(`Itinerario de hoy: ${h.agenda.map((a) => `${hhmm(a.h)} ${a.tit} (${a.lugar})`).join('; ')}.`);
    if (h.clase) L.push(`Clase en su mesa: ${h.clase.estado()}.`);
    if (!h.puestas) L.push('Tiene las gafas sacadas.');
    const per = h.anclas.filter((a) => a.tipo === 'persona' && a.on).map((a) => `${a.tit} (${a.estado ? a.estado() : ''}${a.det && a.det() ? `; ${a.det()}` : ''})`);
    if (per.length) L.push(`Personas que ve cerca: ${per.join(', ')}.`);
    const cosas = h.anclas.filter((a) => a.tipo !== 'persona' && a.on).map((a) => `${a.tit}: ${a.det ? a.det() : ''}`);
    if (cosas.length) L.push(`Cosas a la vista con información: ${cosas.join(' | ')}.`);
    if (h.mirada) L.push(`Está mirando: ${h.mirada.tit}.`);
    L.push(`Su proceso (evidencias): ${st.proceso.map((e) => `[${e.id}] ${e.txt} (${e.visible ? 'la ve la docente' : 'privada'}${e.dest ? ', destacada' : ''})`).join('; ')}.`);
    L.push(h.proyEstado());
    const est = [];
    if (st.foco) est.push('modo foco activado');
    if (st.explorar) est.push('explorar activado');
    if (st.local) est.push('se cortó internet en el barrio (vos seguís andando desde el nodo; hay 3 cosas en cola para enviar)');
    if (st.compartido === 'pizarron') est.push('ya hay algo suyo en el pizarrón');
    if (h.panelAbierto) est.push(`tiene abierto el panel «${h.panelAbierto}»`);
    if (est.length) L.push(`Estado: ${est.join('; ')}.`);
    return L.join('\n');
  }

  // algo que pasó y el tutor tiene que saber, pero sin opinar (por ejemplo, cuando le habla un compañero)
  anotar(texto) { this.historia.push({ role: 'user', content: `[EVENTO] ${texto}` }, { role: 'assistant', content: '{"decir":"","acciones":[]}' }); }

  // ── un turno: lo que dijo el estudiante, o un evento ─────
  decirle(texto) { return this._turno(texto, false); }
  evento(texto) { if (!this.hud.aj.sugerencias) { this.historia.push({ role: 'user', content: `[EVENTO] ${texto}` }, { role: 'assistant', content: '{"decir":"","acciones":[]}' }); return Promise.resolve(); } return this._turno(`[EVENTO] ${texto}`, true); }

  _turno(texto, esEvento) {
    if (!this.activo) return Promise.resolve(false);
    this.pendientes++;
    if (!esEvento) this.hud.pensando(true);
    this.cola = this.cola.then(async () => {
      const h = this.hud;
      const mensajes = [...this.historia.slice(-16), { role: 'user', content: `SITUACIÓN\n${this.situacion()}\n\n${esEvento ? texto : `El estudiante dice: «${texto}»`}` }];
      let r;
      try {
        r = extraerJSON(await this._llamar(SISTEMA(h.nombre), mensajes));
      } catch (e) {
        this.registro.push({ t: hhmm(h.st.minuto), entra: texto, error: e.message });
        this.error = e.message;
        if (!esEvento) { h.pensando(false); if (this.alFallar) this.alFallar(texto, e); }
        return false;
      } finally { this.pendientes--; }
      this.error = '';
      this.historia.push({ role: 'user', content: esEvento ? texto : `El estudiante dice: «${texto}»` }, { role: 'assistant', content: JSON.stringify(r) });
      this.registro.push({ t: hhmm(h.st.minuto), entra: texto, decir: r.decir, acciones: r.acciones });
      h.registrar('ia', `${texto} → ${r.decir || ''} ${JSON.stringify(r.acciones || [])}`);
      h.pensando(false);
      if (!h.puestas || !h.visible) return true;
      // lo que el tutor propone por su cuenta y termina en pregunta espera la respuesta: no hace nada solo
      if (esEvento && /\?/.test(r.decir || '')) r = { ...r, acciones: [] };
      this._aplicar(r);
      return true;
    });
    return this.cola;
  }

  _aplicar(r) {
    const h = this.hud;
    const acciones = Array.isArray(r.acciones) ? r.acciones : [];
    // las acciones no hablan por su cuenta: lo que se dice es lo que decidió el tutor
    h.mudo = true;
    try { for (const a of acciones.slice(0, 4)) this._accion(a); } catch (e) { /* una acción mal formada no corta el turno */ }
    h.mudo = false;
    const decir = (r.decir || '').trim();
    const ops = (Array.isArray(r.opciones) ? r.opciones : []).filter((o) => typeof o === 'string' && o.trim()).slice(0, 3);
    if (!decir) { if (!h.tutorAbierto) h._reposo(); return; }
    const abrePanel = acciones.some((a) => a && a.tipo === 'panel' && a.nombre !== 'cerrar');
    const botones = ops.map((o) => [o, () => { h.cerrarTutor(true); this.decirle(o); }]);
    // con un panel abierto el tutor habla en la barra compacta para no taparlo
    if (abrePanel || (!ops.length && decir.length < 90)) { h.tutorAbierto = false; h.propuesta = null; h.proponer(decir, botones); } else h.decir(decir, botones);
  }

  _accion(a) {
    if (!a || !a.tipo) return;
    const h = this.hud, nav = this.nav, st = h.st, voz = this.voz;
    const ev = (id) => st.proceso.find((e) => e.id === id);
    switch (a.tipo) {
      case 'clase': if (h.clase) h.clase.sentarse('ia'); break;
      case 'ir': if (LUGAR[a.lugar] && !(nav.current === a.lugar && !nav.walk)) { h.guiar(a.lugar); setTimeout(() => nav.goTo(a.lugar), 1300); } break;
      case 'mirar': {
        const o = String(a.objetivo || '').toLowerCase();
        const dir = { derecha: [-1, 0], izquierda: [1, 0], arriba: [0, 1], abajo: [0, -1], atras: [3, 0], 'atrás': [3, 0] }[o];
        if (dir) voz.girar(dir);
        else { const an = h.anclas.find((x) => x.tit && x.tit.toLowerCase().includes(o)); if (an) voz.mirarA(an); }
        break;
      }
      case 'panel':
        if (a.nombre === 'cerrar') { h.cerrarPanel(); h.cerrarLanzador(); } else if (a.nombre === 'menu') h.abrirLanzador();
        else if (['hoy', 'mapa', 'proceso', 'proyecto', 'docente', 'grupo', 'compartir', 'ajustes', 'conexion', 'seguimiento'].includes(a.nombre)) h.panel(a.nombre === 'docente' && st.foco ? 'seguimiento' : a.nombre, true);
        break;
      case 'foto': h.capturar(); break;
      case 'nota': if (a.texto) { st.proceso.push({ id: `n${st.proceso.length + 1}`, hora: hhmm(st.minuto), txt: String(a.texto).slice(0, 140), visible: true, dest: false, tag: 'Nota' }); h.mudo = false; h.aviso('Guardado en tu proceso.', 'Proceso', true); h.mudo = true; h.cambio(); } break;
      case 'foco': h.setFoco(a.activar !== false); break;
      case 'explorar': h.setExplorar(a.activar !== false); break;
      case 'subtitulos': h.setAjuste('subtitulos', a.activar !== false); break;
      case 'pedir_ayuda': if (a.persona) h.pedirAyuda(a.persona); break;
      case 'mensaje': if (a.persona && a.texto) this.mensaje(a.persona, a.texto); break;
      case 'compartir': if (a.destino) { const item = (a.evidencia === 'graf' && st.proy.grafico) || ev(a.evidencia) ? a.evidencia : null; if (item) { h.comp = { item, destino: a.destino }; h.enviar(); } else { h.comp = { item: null, destino: a.destino }; h.panel('compartir', true); } } break;
      case 'destacar': { const e = ev(a.evidencia); if (e) { st.proceso.forEach((x) => (x.dest = false)); e.dest = true; e.visible = true; if (h.panelAbierto === 'proceso') h.panel('proceso', true); h.cambio(); } break; }
      case 'visibilidad': { const e = ev(a.evidencia); if (e) { e.visible = a.visible !== false; if (!e.visible) e.dest = false; if (h.panelAbierto === 'proceso') h.panel('proceso', true); h.cambio(); } break; }
      case 'proyecto': h.mudo = false; h.proyHacer(a.hacer || 'abrir', a.cual ?? a.talle, a.texto); h.mudo = true; break;
      case 'simular_luz': h.oculo.simular(); break;
      default:
    }
  }

  // mensaje a otra persona: la respuesta también se improvisa
  async mensaje(persona, texto) {
    const h = this.hud;
    h.aviso(`Para ${persona}: «${String(texto).slice(0, 120)}»`, 'Enviado', true);
    if (/santi/i.test(persona)) h.st.ensenoSanti = true;
    const quien = /sosa|profe/i.test(persona) ? 'Prof. Sosa, docente de una secundaria argentina en 2040, atenta y breve' : `${persona}, estudiante de 15 años de una secundaria argentina en 2040, compañero/a de curso`;
    try {
      const r = extraerJSON(await this._llamar(`Sos ${quien}. Un estudiante te manda un mensaje por las gafas. Respondé en una sola oración corta, natural, en español rioplatense. Formato: {"decir":"..."}`, [{ role: 'user', content: String(texto) }]));
      if (r.decir) { h.aviso(r.decir, persona); this.historia.push({ role: 'user', content: `[EVENTO] ${persona} le respondió: «${r.decir}»` }, { role: 'assistant', content: '{"decir":"","acciones":[]}' }); }
    } catch (e) { h.aviso('👍', persona); }
  }
}
