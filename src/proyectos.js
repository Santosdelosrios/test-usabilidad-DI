// Proyectos del taller. El participante elige uno al entrar a la escuela y no lo puede cambiar.
// Son distintos entre sí (dónde se trabaja, con quién, qué se arma), pero comparten piezas:
//  medir · pedir (a un compañero) · encuesta · prediccion · simular · grafico · conclusion
import * as THREE from 'three';

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const hhmm = (m) => `${String(Math.floor(m / 60) % 24).padStart(2, '0')}:${String(Math.floor(m % 60)).padStart(2, '0')}`;
const LUGAR = { entrada: 'la plaza de la entrada', hall: 'el hall', taller: 'el aula-taller', proyeccion: 'la zona de proyección', rincon: 'el rincón tranquilo', nodo: 'la sala del nodo' };
const MEDIOS = ['colectivo', 'bici', 'caminando', 'auto'];

export const PROYECTOS = [
  {
    id: 'talles', nombre: 'Talles del negocio', tema: 'Economía', corto: 'Qué talle le conviene reponer a un negocio de ropa del barrio.', donde: 'En el aula-taller',
    claves: /\b(talles?|negocio|ropa|economia|stock|primero|primer|uno)\b/,
    encargo: ['Marta, la dueña de un negocio de ropa del barrio, le pidió ayuda al curso: algunos talles se le agotan y otros le sobran.', '<b>Tu grupo tiene que recomendarle qué talle reponer esta semana</b>, comparando lo que hay (stock) con lo que se vendió (ventas).', 'Ana cargó el talle S y Tomi el M. A vos te tocan <b>L y XL</b>.'],
    ia: 'Comparan stock y ventas por talle. S: stock 12, ventas 8. M: stock 9, ventas 10. Lo que salta a la vista cuando está el gráfico: del XL hay muy poco stock y se vende mucho.',
    pasos: [
      { tipo: 'medir', tit: 'Contar el stock en el perchero', verbo: 'Contar', items: [
        { k: 'L', et: 'talle L', valor: 7, unidad: 'prendas', lugar: 'taller', pos: [-14.75, 1.95, 3.6], ancla: 'Perchero · talles', claves: /\b(l|ele|large)\b/ },
        { k: 'XL', et: 'talle XL', valor: 2, unidad: 'prendas', lugar: 'taller', pos: [-14.75, 1.95, 3.6], ancla: 'Perchero · talles', claves: /\b(xl|equis ele|extra large)\b/ },
      ] },
      { tipo: 'pedir', tit: 'Ventas de la semana', persona: 'Tomi', que: 'las ventas de L y XL', txt: 'Las ventas las tiene Tomi, que habló con Marta.', claves: /\bventas?\b/, resp: '¡Dale! Te paso las ventas de L y XL: 5 y 9.', da: { vL: 5, vXL: 9 }, listo: (v) => `L ${v.vL} · XL ${v.vXL}` },
      { tipo: 'grafico', tit: 'Gráfico stock vs ventas', comenta: ['Tomi', '¡Quedó el gráfico! Mirá el XL…'], datos: (v) => ({ cats: ['S', 'M', 'L', 'XL'], a: ['Stock', [12, 9, v.L, v.XL]], b: ['Ventas', [8, 10, v.vL, v.vXL]] }) },
      { tipo: 'conclusion', tit: 'Recomendación para Marta', ayuda: '¿Qué le recomiendan al negocio?', opciones: ['Reponer XL: se vende más de lo que hay', 'Reponer todos los talles por igual', 'No hace falta reponer nada'] },
    ],
    ficha: (p) => ({ grande: 'STOCK VS VENTAS', lineas: [`S 12/8 · M 9/10 · L ${p.v.L}/${p.v.vL} · XL ${p.v.XL}/${p.v.vXL}`] }),
  },
  {
    id: 'luz', nombre: 'La luz del hall', tema: 'Ciencias', corto: 'Dónde poner un rincón de lectura según por dónde pasa el sol.', donde: 'En el hall',
    claves: /\b(luz|sol|hall|ciencias?|oculo|lectura|segundo|dos)\b/,
    encargo: ['La biblioteca quiere armar un rincón de lectura en el hall. Tiene que tener luz de sol durante el recreo largo, de 10 a 11, pero no a la tarde, cuando hace calor.', '<b>Tu grupo tiene que decir dónde ponerlo</b>, mostrando por dónde se mueve la mancha de sol que entra por el óculo del techo.', 'Vos estudiás la mañana y el mediodía en el hall. Ana midió la tarde.'],
    ia: 'La mancha de sol del óculo se mueve porque la Tierra gira: a las 9:30 está sobre el banco, de 10 a 11 entre el banco y el centro, a las 12 cerca del centro pero corrida al sur (hacia la proyección) porque acá el sol del mediodía queda al norte, y a la tarde sube a las gradas. El lugar que cumple el encargo es cerca del banco.',
    pasos: [
      { tipo: 'prediccion', tit: 'Tu predicción', pregunta: '¿Dónde va a caer la luz del óculo a las 12?', opciones: ['Justo debajo del óculo', 'Un poco hacia la proyección', 'Sobre las gradas'] },
      { tipo: 'simular', tit: 'Ver el recorrido de la luz', lugar: 'hall', txt: 'Las gafas dibujan en el piso del hall por dónde pasa la mancha de sol, hora por hora.' },
      { tipo: 'pedir', tit: 'Mediciones de la tarde', persona: 'Ana', que: 'las mediciones de la tarde', txt: 'Ana midió dónde da el sol después de las 15.', claves: /\b(mediciones?|tarde|medidas?)\b/, resp: 'Ya está, te las paso: a las 16 da en lo alto de las gradas y a las 17 pega en la pared.', da: { t16: 'Gradas, arriba', t17: 'Pared este' }, listo: (v) => `16 h ${v.t16.toLowerCase()} · 17 h ${v.t17.toLowerCase()}` },
      { tipo: 'grafico', nombre: 'la tabla', tit: 'Tabla: dónde da el sol a cada hora', comenta: ['Ana', '¡Buenísimo! Fijate qué pasa de 10 a 11.'], datos: (v) => ({ filas: [['9:30', 'Sobre el banco'], ['10 a 11', 'Entre el banco y el centro'], ['12:00', 'Cerca del centro, corrida al sur'], ['14:00', 'Al pie de las gradas'], ['16:00', v.t16], ['17:00', v.t17]] }) },
      { tipo: 'conclusion', tit: 'Dónde poner el rincón de lectura', ayuda: '¿Dónde lo pondrían y por qué?', opciones: ['Cerca del banco: tiene sol a la mañana', 'En el centro del hall', 'En las gradas'] },
    ],
    ficha: (p) => ({ grande: 'LA LUZ DEL HALL', lineas: ['9:30 BANCO · 12 CENTRO-SUR · 16 GRADAS'] }),
  },
  {
    id: 'agua', nombre: 'El agua de la escuela', tema: 'Ambiente', corto: 'Cuánta agua usa la escuela y dónde se puede ahorrar.', donde: 'Recorriendo la escuela',
    claves: /\b(agua|ambiente|ahorr\w+|sensores?|tercero|tercer|tres)\b/,
    encargo: ['La escuela-nodo quiere bajar su consumo de agua este año y le pidió al curso una propuesta.', '<b>Tu grupo tiene que decir dónde conviene ahorrar primero</b>, con los datos de los sensores de la escuela.', 'Vos leés tres sensores que están en lugares distintos: el riego de las plantas del hall, el riego de la plaza y la refrigeración de la sala del nodo. Tomi tiene los de baños y cocina.'],
    ia: 'Consumo por día: plantas del hall 40 L, riego de la plaza 120 L, refrigeración del nodo 260 L, baños 310 L, cocina 90 L. Los dos mayores son los baños y la refrigeración del nodo; el agua del nodo sale limpia y tibia y hoy se tira.',
    pasos: [
      { tipo: 'medir', tit: 'Leer los sensores de agua', verbo: 'Leer', items: [
        { k: 'plantas', et: 'riego de las plantas', valor: 40, unidad: 'L por día', lugar: 'hall', pos: [5.7, 2.3, 5.9], ancla: 'Sensor · riego de plantas', claves: /\b(plantas?|maceta|salvia|hall)\b/ },
        { k: 'plaza', et: 'riego de la plaza', valor: 120, unidad: 'L por día', lugar: 'entrada', pos: [5.5, 1.5, 21], ancla: 'Sensor · riego de la plaza', claves: /\b(plaza|entrada|afuera|arboles)\b/ },
        { k: 'nodo', et: 'refrigeración del nodo', valor: 260, unidad: 'L por día', lugar: 'nodo', pos: [17.75, 2.45, -16.2], ancla: 'Sensor · refrigeración', claves: /\b(nodo|servidor\w*|refrigeracion)\b/ },
      ] },
      { tipo: 'pedir', tit: 'Baños y cocina', persona: 'Tomi', que: 'el consumo de baños y cocina', txt: 'Tomi leyó los sensores de los baños y la cocina.', claves: /\b(banos?|cocina|consumo)\b/, resp: 'Los tengo: baños 310 litros por día y cocina 90.', da: { banos: 310, cocina: 90 }, listo: (v) => `Baños ${v.banos} · cocina ${v.cocina} L por día` },
      { tipo: 'grafico', tit: 'Gráfico: litros por día en cada sector', comenta: ['Tomi', 'Mirá cuánto se va en el nodo… y esa agua sale limpia.'], datos: (v) => ({ cats: ['Baños', 'Nodo', 'Plaza', 'Cocina', 'Plantas'], a: ['Litros por día', [v.banos, v.nodo, v.plaza, v.cocina, v.plantas]] }) },
      { tipo: 'conclusion', tit: 'Propuesta de ahorro', ayuda: '¿Por dónde empezarían a ahorrar?', opciones: ['Reusar el agua del nodo para regar', 'Regar menos la plaza', 'Canillas con corte en los baños'] },
    ],
    ficha: (p) => ({ grande: 'EL AGUA DE LA ESCUELA', lineas: [`BAÑOS ${p.v.banos} · NODO ${p.v.nodo} · PLAZA ${p.v.plaza} L/DÍA`] }),
  },
  {
    id: 'viaje', nombre: 'Cómo llegamos', tema: 'Sociales', corto: 'Cómo viene el curso a la escuela y qué pedirle al municipio.', donde: 'Hablando con tus compañeros',
    claves: /\b(llegamos|llegar|transporte|sociales|colectivos?|municipio|encuesta|venimos|cuarto|cuatro)\b/,
    encargo: ['El municipio va a rehacer las calles alrededor de la escuela y les preguntó a los estudiantes qué necesitan.', '<b>Tu grupo tiene que hacer un pedido concreto</b>, mostrando cómo viene la gente a la escuela.', 'Vos les preguntás a tus compañeros de 4° B (por lo menos a cuatro) cómo vienen y cuánto tardan. Ana tiene las respuestas de 3° A.'],
    ia: 'Encuesta de transporte. En 3° A: colectivo 11, bici 4, caminando 6, auto 3. En 4° B los que vienen en colectivo son los que más tardan (35 a 50 minutos). No hay una única respuesta correcta para el pedido.',
    pasos: [
      { tipo: 'encuesta', tit: 'Preguntarles a tus compañeros', min: 4, txt: 'Mirá a un compañero y preguntale cómo viene a la escuela.', resp: { Tomi: ['bici', 15], Santi: ['colectivo', 40], Mica: ['caminando', 10], Juli: ['colectivo', 35], Lauti: ['auto', 20], Nahuel: ['colectivo', 50], Cami: ['bici', 12], Fede: ['caminando', 8] } },
      { tipo: 'pedir', tit: 'Respuestas de 3° A', persona: 'Ana', que: 'las respuestas de 3° A', txt: 'Ana encuestó ayer a 3° A.', claves: /\b(respuestas?|tercero|3|otro curso|encuesta)\b/, resp: 'Ya está, te las mando: en 3° A, 11 vienen en colectivo, 6 caminando, 4 en bici y 3 en auto.', da: { otro: [11, 4, 6, 3] }, listo: () => 'Colectivo 11 · bici 4 · caminando 6 · auto 3' },
      { tipo: 'grafico', tit: 'Gráfico: cómo venimos', comenta: ['Ana', 'Quedó. ¿Viste cuánto tardan los que vienen en colectivo?'], datos: (v, p) => ({ cats: ['Colectivo', 'Bici', 'Caminando', 'Auto'], a: ['4° B (tu encuesta)', MEDIOS.map((m) => Object.values(p.enc).filter((r) => r[0] === m).length)], b: ['3° A', v.otro] }) },
      { tipo: 'conclusion', tit: 'Pedido al municipio', ayuda: '¿Qué le pedirían al municipio?', opciones: ['Más colectivos a la mañana', 'Una bicisenda hasta la escuela', 'Cruces seguros para venir caminando'] },
    ],
    ficha: (p) => ({ grande: 'CÓMO LLEGAMOS', lineas: [`4° B: ${MEDIOS.map((m) => `${m.toUpperCase()} ${Object.values(p.enc).filter((r) => r[0] === m).length}`).join(' · ')}`] }),
  },
];

export const estadoInicial = () => ({ id: null, v: {}, enc: {}, pred: null, sim: false, grafico: false, conclusion: '' });

// métodos del proyecto, sumados al HUD
export function instalarProyectos(HUD) {
  Object.assign(HUD.prototype, {
    proyDef() { return PROYECTOS.find((d) => d.id === this.st.proy.id) || null; },

    _pasoHecho(paso) {
      const p = this.st.proy;
      if (paso.tipo === 'medir') return paso.items.every((i) => p.v[i.k] != null);
      if (paso.tipo === 'pedir') return Object.keys(paso.da).every((k) => p.v[k] != null);
      if (paso.tipo === 'encuesta') return Object.keys(p.enc).length >= paso.min;
      if (paso.tipo === 'prediccion') return !!p.pred;
      if (paso.tipo === 'simular') return p.sim;
      if (paso.tipo === 'grafico') return p.grafico;
      if (paso.tipo === 'conclusion') return !!p.conclusion;
      return false;
    },

    // lo que falta antes de poder armar el gráfico o la tabla
    proyFalta() {
      const d = this.proyDef(), p = this.st.proy, f = [];
      if (!d) return ['elegir un proyecto'];
      for (const paso of d.pasos) {
        if (paso.tipo === 'grafico') break;
        if (this._pasoHecho(paso)) continue;
        if (paso.tipo === 'medir') paso.items.filter((i) => p.v[i.k] == null).forEach((i) => f.push(`${paso.verbo.toLowerCase()} ${i.et}`));
        else if (paso.tipo === 'pedir') f.push(`pedirle a ${paso.persona} ${paso.que}`);
        else if (paso.tipo === 'encuesta') f.push(`preguntarle a ${paso.min - Object.keys(p.enc).length} compañero(s) más`);
        else if (paso.tipo === 'prediccion') f.push('hacer tu predicción');
        else if (paso.tipo === 'simular') f.push('ver el recorrido de la luz en el hall');
      }
      return f;
    },

    proyAvance() { const d = this.proyDef(); return d ? d.pasos.filter((x) => this._pasoHecho(x)).length : 0; },
    proyTotal() { const d = this.proyDef(); return d ? d.pasos.length : 0; },

    // resumen para el tutor con IA
    proyEstado() {
      const d = this.proyDef(), p = this.st.proy;
      if (!d) return `Todavía no eligió proyecto. Tiene que elegir uno de estos cuatro y después no puede cambiarlo: ${PROYECTOS.map((x) => `«${x.nombre}» (${x.tema}: ${x.corto})`).join('; ')}. No elijas por él.`;
      const pasos = d.pasos.map((paso, i) => {
        let det = '';
        if (paso.tipo === 'medir') det = paso.items.map((it) => `${it.et}: ${p.v[it.k] != null ? `${p.v[it.k]} ${it.unidad}` : `sin ${paso.verbo.toLowerCase()} (se hace en ${LUGAR[it.lugar]})`}`).join(', ');
        if (paso.tipo === 'pedir') det = this._pasoHecho(paso) ? paso.listo(p.v, p) : `las tiene ${paso.persona}, hay que pedírselas`;
        if (paso.tipo === 'encuesta') det = `${Object.entries(p.enc).map(([n, r]) => `${n}: ${r[0]}, ${r[1]} min`).join('; ') || 'nadie todavía'} (mínimo ${paso.min}; se le pregunta a cada compañero mirándolo)`;
        if (paso.tipo === 'prediccion') det = p.pred ? `predijo «${p.pred}»` : `${paso.pregunta} Opciones: ${paso.opciones.join(' / ')}`;
        if (paso.tipo === 'conclusion') det = p.conclusion ? `«${p.conclusion}»` : 'sin escribir';
        return `${i + 1}) ${paso.tit} [${this._pasoHecho(paso) ? 'hecho' : 'pendiente'}]${det ? `: ${det}` : ''}`;
      }).join(' ');
      return `Proyecto elegido (no se puede cambiar): «${d.nombre}» (${d.tema}). Encargo: ${d.encargo.join(' ').replace(/<[^>]+>/g, '')} Pasos, en el orden que quiera: ${pasos} Lo que vos sabés y él tiene que descubrir: ${d.ia}`;
    },

    _proyRefrescar() { if (this.panelAbierto === 'proyecto') this.panel('proyecto', true); this.cambio(); },

    // ── elegir (una sola vez) ────────────────────────────────
    proyElegir(id) {
      const st = this.st, d = PROYECTOS.find((x) => x.id === id);
      if (!d) return;
      if (st.proy.id) return this.aviso('El proyecto ya está elegido: no se puede cambiar.', 'Proyecto', true);
      st.proy.id = id;
      this.registrar('proyecto', `elegir ${id}`);
      this.agenda[1].tit = `Taller · ${d.nombre.toLowerCase()}`;
      this._hoyPill();
      this._proyAnclas(d);
      this.aviso(`Elegiste «${d.nombre}». Lo hacés con Tomi y Ana.`, 'Proyecto', true);
      this.panel('proyecto', true);
      if (this.ia) this.cerebro.evento(`Acaba de elegir el proyecto «${d.nombre}». Decile en una o dos frases de qué se trata y por dónde puede empezar, sin apurarlo.`);
      else this.proponer(`Buena elección. ${d.encargo[1].replace(/<[^>]+>/g, '')}`);
      this.cambio();
    },

    // marcas en la escuela para lo que hay que medir, y preguntas a los compañeros
    _proyAnclas(d) {
      const porAncla = {};
      for (const paso of d.pasos) if (paso.tipo === 'medir') for (const it of paso.items) (porAncla[it.ancla] = porAncla[it.ancla] || { paso, items: [] }).items.push(it);
      for (const [tit, g] of Object.entries(porAncla)) {
        const it0 = g.items[0];
        const a = { id: 'pm-' + it0.k, tipo: 'objeto', pos: it0.pos, zona: it0.lugar === 'entrada' ? 'plaza' : it0.lugar, max: it0.lugar === 'entrada' ? 30 : 12, tit, det: () => g.items.map((it) => `${it.et}: ${this.st.proy.v[it.k] != null ? `${this.st.proy.v[it.k]} ${it.unidad}` : '—'}`).join(' · '), acc: g.items.map((it) => [`${g.paso.verbo} ${it.et}`, () => this.proyHacer('medir', it.k)]) };
        this.anclas.push(a);
        this._crearAncla(a);
      }
      const enc = d.pasos.find((x) => x.tipo === 'encuesta');
      if (enc) for (const a of this.anclas) if (a.tipo === 'persona' && enc.resp[a.tit]) { a.acc = [...(a.acc || []), ['Preguntarle cómo viene', () => this.proyHacer('preguntar', a.tit)]]; this._pintarAcc(a); }
    },

    // ── hacer ────────────────────────────────────────────────
    proyHacer(que, cual, texto) {
      const st = this.st, p = st.proy, d = this.proyDef();
      this.registrar('proyecto', [que, cual, texto].filter(Boolean).join(' '));
      if (que === 'elegir') return this.proyElegir(cual);
      if (que === 'abrir') return this.panel('proyecto', true);
      if (!d) return this.panel('proyecto', true);
      const paso = (t) => d.pasos.find((x) => x.tipo === t);
      const acaNo = (lugar) => (this.nav.current !== lugar || this.nav.walk);
      if (que === 'explicar') {
        if (this.ia) return this.cerebro.decirle('Explicame de qué se trata mi proyecto y qué me falta hacer a mí.');
        const f = this.proyFalta();
        return this.proponer(`${d.encargo[1].replace(/<[^>]+>/g, '')} ${f.length ? `Te falta ${f[0]}.` : p.grafico ? (p.conclusion ? 'Ya está todo: falta presentarlo.' : 'Falta escribir la conclusión.') : `Ya podés armar ${paso('grafico').nombre || 'el gráfico'}.`}`);
      }
      if (que === 'medir') {
        const m = paso('medir');
        const it = m && m.items.find((i) => i.k === cual || i.k.toLowerCase() === String(cual || '').toLowerCase());
        if (!it) return this.aviso('Eso no es parte de lo que te toca.', 'Proyecto', true);
        if (acaNo(it.lugar)) return this.aviso(`Para ${m.verbo.toLowerCase()} ${it.et} hay que estar en ${LUGAR[it.lugar]}.`, 'Proyecto', true);
        if (this.voz) this.voz.mirarPunto(new THREE.Vector3(it.pos[0], it.pos[1] - 0.3, it.pos[2]));
        p.v[it.k] = it.valor;
        this.aviso(`${it.et[0].toUpperCase()}${it.et.slice(1)}: ${it.valor} ${it.unidad}.`, 'Proyecto', true);
      } else if (que === 'pedir') {
        const pd = paso('pedir');
        if (!pd) return;
        if (this._pasoHecho(pd)) return this.aviso('Eso ya lo tenés.', 'Proyecto', true);
        this.pedirAyuda(pd.persona);
      } else if (que === 'preguntar') {
        const e = paso('encuesta');
        if (!e) return;
        const n = Object.keys(e.resp).find((x) => x.toLowerCase() === String(cual || '').toLowerCase());
        if (!n) return this.aviso('A esa persona no le podés preguntar.', 'Proyecto', true);
        if (p.enc[n]) return this.aviso(`A ${n} ya le preguntaste.`, 'Proyecto', true);
        const a = this.anclas.find((x) => x.tipo === 'persona' && x.tit === n);
        if (!a || !a.on) return this.aviso(`${n} no está cerca: tenés que encontrarlo en la escuela.`, 'Proyecto', true);
        if (this.voz) this.voz.mirarA(a);
        p.enc[n] = e.resp[n];
        const [medio, min] = e.resp[n];
        setTimeout(() => this.aviso(`${medio === 'caminando' ? 'Vengo caminando' : `Vengo en ${medio}`}, tardo ${min} minutos.`, n, true), 700);
      } else if (que === 'predecir') {
        const pr = paso('prediccion');
        if (!pr) return;
        if (p.pred) return this.aviso('Tu predicción ya quedó guardada.', 'Proyecto', true);
        const op = pr.opciones.find((o) => o === cual) || pr.opciones[Number(cual)];
        if (!op) return;
        p.pred = op;
        this.aviso(`Predicción guardada: «${op}».`, 'Proyecto', true);
      } else if (que === 'simular') {
        const s = paso('simular');
        if (!s) return;
        if (acaNo(s.lugar)) return this.aviso(`El recorrido se ve en ${LUGAR[s.lugar]}.`, 'Proyecto', true);
        this.cerrarPanel();
        this.oculo.simular();
        p.sim = true;
        if (this.voz) this.voz.mirarPunto(new THREE.Vector3(2, 0, -3));
        this.aviso('Mirá el piso: la mancha de sol, hora por hora.', 'Proyecto', true);
        return this.cambio();
      } else if (que === 'grafico') {
        const g = paso('grafico'), f = this.proyFalta();
        if (f.length) return this.aviso(`Todavía falta: ${f.join(', ')}.`, 'Proyecto', true);
        if (p.grafico) return this.panel('proyecto', true);
        p.grafico = true;
        st.proceso.push({ id: 'pg', hora: hhmm(st.minuto), txt: `${g.tit} (con Tomi y Ana)`, visible: true, dest: false, tag: 'Grupo' });
        this.panel('proyecto', true);
        if (g.comenta) setTimeout(() => this.aviso(g.comenta[1], g.comenta[0]), 2400);
      } else if (que === 'conclusion') {
        if (!p.grafico) return this.aviso(`Primero hace falta ${paso('grafico').nombre || 'el gráfico'}.`, 'Proyecto', true);
        p.conclusion = String(texto || cual || '').trim().slice(0, 140);
        st.proceso = st.proceso.filter((e) => e.id !== 'pc');
        if (p.conclusion) st.proceso.push({ id: 'pc', hora: hhmm(st.minuto), txt: `Conclusión del grupo: ${p.conclusion}`, visible: true, dest: false, tag: 'Grupo' });
        this.aviso('Conclusión guardada. Tomi y Ana la ven en sus gafas.', 'Proyecto', true);
      } else if (que === 'borrar') { p.conclusion = ''; st.proceso = st.proceso.filter((e) => e.id !== 'pc'); }
      this._proyRefrescar();
    },

    // cuando un compañero ayuda: si tiene datos del proyecto, los pasa
    _proyEntrega(persona) {
      const d = this.proyDef(), p = this.st.proy;
      const pd = d && d.pasos.find((x) => x.tipo === 'pedir' && x.persona === persona);
      if (!pd || this._pasoHecho(pd)) return null;
      return { resp: pd.resp, dar: () => { Object.assign(p.v, pd.da); this.aviso(`${pd.tit}: ${pd.listo(p.v, p)}`, 'Proyecto', true); this._proyRefrescar(); } };
    },

    proyFicha() {
      const d = this.proyDef(), p = this.st.proy;
      if (!d || !p.grafico) return null;
      const f = d.ficha(p);
      return { grande: f.grande, lineas: [f.lineas[0], (p.conclusion || 'TU GRUPO · TOMI · ANA').toUpperCase().slice(0, 46)] };
    },

    // ── panel ────────────────────────────────────────────────
    proyPanel() {
      const d = this.proyDef(), p = this.st.proy;
      if (!d) {
        return `<h3>Elegí tu proyecto</h3><div class="sub"><span>Lo hacés con Tomi y Ana</span><span>No se puede cambiar</span></div>`
          + PROYECTOS.map((x) => `<button class="btn tarjeta" data-dwell="1.6" data-a="proy:elegir|${x.id}"><small>${x.tema} · ${x.donde}</small><b>${x.nombre}</b><span>${x.corto}</span></button>`).join('');
      }
      let h = `<h3>${d.nombre}</h3><div class="sub"><span>${d.tema} · con Tomi y Ana</span><span>${this.proyAvance()} de ${this.proyTotal()}</span></div>`;
      h += `<div class="encargo"><div class="cap">El encargo</div>${d.encargo.map((t) => `<p>${t}</p>`).join('')}<p>A las 10:30 lo presentan en la zona de proyección.</p><div class="acciones"><button class="btn" data-a="proy:explicar">Que el tutor me lo explique</button></div></div>`;
      d.pasos.forEach((paso, i) => {
        const hecho = this._pasoHecho(paso);
        h += `<div class="bloque"><div class="cap">${i + 1} · ${paso.tit}</div>`;
        if (paso.tipo === 'medir') {
          h += paso.items.map((it) => (p.v[it.k] != null ? `<p class="hecho">${it.et}: ${p.v[it.k]} ${it.unidad}</p>` : `<p>${it.et[0].toUpperCase()}${it.et.slice(1)} · en ${LUGAR[it.lugar]}</p>`)).join('');
          const aca = paso.items.filter((it) => p.v[it.k] == null && this.nav.current === it.lugar && !this.nav.walk);
          if (aca.length) h += `<div class="acciones">${aca.map((it) => `<button class="btn" data-a="proy:medir|${it.k}">${paso.verbo} ${it.et}</button>`).join('')}</div>`;
        } else if (paso.tipo === 'pedir') {
          h += hecho ? `<p class="hecho">${paso.listo(p.v, p)} (te lo pasó ${paso.persona})</p>` : `<p>${paso.txt}</p><div class="acciones"><button class="btn" data-a="proy:pedir">Pedírselo a ${paso.persona}</button></div>`;
        } else if (paso.tipo === 'encuesta') {
          const n = Object.keys(p.enc).length;
          h += `<p>${hecho ? '' : paso.txt + ' '}Llevás ${n} de ${paso.min}.</p>${Object.entries(p.enc).map(([nom, r]) => `<p class="hecho">${nom}: ${r[0]}, ${r[1]} min</p>`).join('')}`;
        } else if (paso.tipo === 'prediccion') {
          h += hecho ? `<p class="hecho">«${esc(p.pred)}»</p>` : `<p>${paso.pregunta}</p><div class="acciones">${paso.opciones.map((o, k) => `<button class="btn" data-a="proy:predecir|${k}">${o}</button>`).join('')}</div>`;
        } else if (paso.tipo === 'simular') {
          h += `${hecho ? '<p class="hecho">Ya lo viste. Podés repetirlo.</p>' : `<p>${paso.txt}</p>`}<div class="acciones"><button class="btn" data-a="proy:simular">${this.nav.current === paso.lugar ? 'Mostrar el recorrido' : `Se ve en ${LUGAR[paso.lugar]}`}</button></div>`;
        } else if (paso.tipo === 'grafico') {
          if (hecho) {
            const g = paso.datos(p.v, p);
            if (g.filas) h += `<div class="tabla-horas">${g.filas.map(([a, b]) => `<b>${a}</b><span>${esc(b)}</span>`).join('')}</div>`;
            else {
              const max = Math.max(1, ...g.a[1], ...(g.b ? g.b[1] : []));
              h += `<div class="graf-proy">${g.cats.map((c, k) => `<div><i style="height:${(g.a[1][k] / max) * 100}%"></i>${g.b ? `<i class="v" style="height:${(g.b[1][k] / max) * 100}%"></i>` : ''}<b>${c}</b></div>`).join('')}</div><small class="ley"><i></i>${g.a[0]}${g.b ? ` <i class="v"></i>${g.b[0]}` : ''}</small>`;
            }
          } else {
            const f = this.proyFalta();
            h += `<div class="acciones"><button class="btn ${f.length ? 'off' : ''}" data-a="proy:grafico">Armar ${paso.nombre || 'el gráfico'}</button></div>${f.length ? `<small>Falta: ${f.join(', ')}</small>` : ''}`;
          }
        } else if (paso.tipo === 'conclusion') {
          if (hecho) h += `<p class="hecho">«${esc(p.conclusion)}»</p><div class="acciones"><button class="btn" data-a="proy:borrar">Cambiarla</button></div>`;
          else if (p.grafico) h += `<p>${paso.ayuda} Decíselo al tutor con tus palabras, o elegí:</p><div class="acciones">${paso.opciones.map((o) => `<button class="btn" data-a="proy:conclusion|${o}">${o.split(':')[0]}</button>`).join('')}</div>`;
          else h += `<p>Primero hace falta ${d.pasos.find((x) => x.tipo === 'grafico').nombre || 'el gráfico'}.</p>`;
        }
        h += `</div>`;
      });
      return h;
    },

    // ── voz: ¿la frase es algo del proyecto? ─────────────────
    proyOir(d, dir) {
      const def = this.proyDef(), p = this.st.proy;
      if (!def) {
        if (this.panelAbierto !== 'proyecto' && !dir) return null;
        const ord = [/\b(primero|primer|uno|1)\b/, /\b(segundo|dos|2)\b/, /\b(tercero|tercer|tres|3)\b/, /\b(cuarto|cuatro|4)\b/].findIndex((r) => r.test(d));
        const x = PROYECTOS.find((q) => q.claves.test(d)) || (ord >= 0 && d.split(' ').length <= 4 ? PROYECTOS[ord] : null);
        if (x && /\b(elijo|quiero|prefiero|hago|hagamos|vamos con|me quedo|el de|la de|el del|ese|dale)\b/.test(d + ' ') || (x && d.split(' ').length <= 4)) return () => this.proyElegir(x.id);
        if (/\b(proyectos?|que puedo elegir|opciones)\b/.test(d)) return () => this.panel('proyecto', true);
        return null;
      }
      const paso = (t) => def.pasos.find((x) => x.tipo === t);
      const m = paso('medir');
      if (m && /\b(cont\w+|cuant\w+|le[eé]\w*|leer|med\w+|sensor\w*|fij\w+)\b/.test(d)) {
        const cand = m.items.filter((i) => i.claves.test(d));
        const it = cand.sort((a, b) => b.k.length - a.k.length)[0] || m.items.find((i) => p.v[i.k] == null && i.lugar === this.nav.current);
        if (it) return () => this.proyHacer('medir', it.k);
      }
      const pd = paso('pedir');
      if (pd && pd.claves.test(d) && /\b(pedi\w*|pasa\w*|necesito|consegui\w*|manda\w*|tenes|dame)\b/.test(d)) return () => this.proyHacer('pedir');
      const e = paso('encuesta');
      if (e && /\b(pregunt\w+|como vien\w+|como llega\w*|en que vien\w+)\b/.test(d)) {
        const n = Object.keys(e.resp).find((x) => new RegExp(`\\b${x.toLowerCase()}\\b`).test(d)) || (this.mirada && this.mirada.tipo === 'persona' && e.resp[this.mirada.tit] ? this.mirada.tit : null);
        if (n) return () => this.proyHacer('preguntar', n);
      }
      const pr = paso('prediccion');
      if (pr && !p.pred && this.panelAbierto === 'proyecto') {
        const k = /\b(debajo|abajo|justo)\b/.test(d) ? 0 : /\b(proyeccion|un poco|sur)\b/.test(d) ? 1 : /\b(gradas|escalones)\b/.test(d) ? 2 : -1;
        if (k >= 0) return () => this.proyHacer('predecir', k);
      }
      if (paso('simular') && /\b(recorrido|simul\w+|mostra\w* (la luz|el sol|por donde)|como se mueve)\b/.test(d)) return () => this.proyHacer('simular');
      if (/\b(arm\w+|hac\w+|hag\w+|mostra\w*)\b.*\b(grafico|tabla)\b/.test(d)) return () => this.proyHacer('grafico');
      const mc = d.match(/^(?:anota|anotar|escribi|pone|la conclusion es|nuestra conclusion es|conclusion|el pedido es|la propuesta es)\s+(?:que\s+|como conclusion\s+(?:que\s+)?)?(.{6,})$/);
      if (mc && p.grafico) return () => this.proyHacer('conclusion', null, mc[1]);
      if (/\b(abri|abrir|mostrame|ver|como va|como vamos)\b.*\bproyecto\b/.test(d) || (dir && /\bproyecto\b/.test(d))) return () => this.panel('proyecto', true);
      return null;
    },
  });
}
