// Ejercicio con pistas (tareas 4 a 6): un cuaderno en las gafas con una ecuación de dos pasos.
// El participante dice en voz alta lo que haría; el tutor reconoce los pasos y los anota, da pistas
// de a una (qué mirar, qué operación, cómo quedaría) y nunca dice la respuesta. Si pasa un rato sin
// avances o el paso está mal, el tutor puede sugerir algo por su cuenta (cuando la tarea lo habilita).
// Todo está guionado: no usa la IA real.

export const EJERCICIOS = [
  { ec: '3x + 5 = 20', a: 3, b: 5, c: 20 },
  { ec: '2x − 4 = 10', a: 2, b: -4, c: 10 },
  { ec: '5x − 3 = 12', a: 5, b: -3, c: 12 },
  { ec: '4x + 1 = 21', a: 4, b: 1, c: 21 },
];

// números dichos con palabras → cifras («tres equis igual quince» → «3 x igual 15»)
const NUMS = { cero: 0, uno: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5, seis: 6, siete: 7, ocho: 8, nueve: 9, diez: 10, once: 11, doce: 12, trece: 13, catorce: 14, quince: 15, dieciseis: 16, diecisiete: 17, dieciocho: 18, diecinueve: 19, veinte: 20, veintiuno: 21, veintidos: 22, veintitres: 23, veinticuatro: 24, veinticinco: 25, veintiseis: 26, veintisiete: 27, veintiocho: 28, veintinueve: 29, treinta: 30 };
export function aNumeros(d) {
  let t = ` ${d} `.replace(/=/g, ' igual ').replace(/\+/g, ' mas ').replace(/[÷/]/g, ' dividido ').replace(/[×*]/g, ' por ');
  t = t.replace(/\b(equis|ecuis|equi|ekis)\b/g, 'x');
  t = t.replace(/(\d+)\s*x\b/g, '$1 x');
  t = t.replace(/\b[a-z]+\b/g, (w) => (w in NUMS ? String(NUMS[w]) : w));
  t = t.replace(/\b(\d+) por x\b/g, '$1 x');
  return t.replace(/\s+/g, ' ').trim();
}

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const signo = (b) => (b > 0 ? `+ ${b}` : `− ${-b}`);

export class Ejercicio {
  constructor({ hud }) {
    this.hud = hud;
    this.el = document.createElement('div');
    this.el.id = 'hud-cuaderno';
    this.el.className = 'zoom';
    this.el.hidden = true;
    document.getElementById('hud').appendChild(this.el);
    // con la mirada (o el mouse): elegir el próximo paso o pedir una pista
    this.el.addEventListener('click', (ev) => {
      const b = ev.target.closest('[data-paso], [data-pista]');
      if (!b || !this.activo) return;
      if (b.dataset.pista != null) return this.pista('mirada');
      const op = this._ops && this._ops[+b.dataset.paso];
      if (op) op[1]();
    });
    this.activo = false;
    this.espontaneas = false; // sugerencias que el tutor hace sin que se las pidan
    this.demora = 25;         // segundos sin avances antes de sugerir
    this.historial = [];
    this.sugerencias = [];
    this.tPregunta = 0;
  }

  cargar(k) {
    const def = EJERCICIOS[Math.min(k, EJERCICIOS.length - 1)];
    const m = def.c - def.b;
    this.e = { n: EJERCICIOS.indexOf(def) + 1, ...def, m, x: m / def.a, paso1: false, op1: false, op2: false, resuelto: false, comprobado: false, nivel: [0, 0], pistas: 0, pistasSug: 0, pidioRespuesta: 0, errores: [], lineas: [], ultimaPista: null, tInicio: performance.now(), tResuelto: null, sugeridas: 0 };
    this.historial.push(this.e);
    this.activo = true;
    this.ultimoAvance = performance.now();
    this.el.hidden = false;
    this._pintar();
    this.hud.registrar('ejercicio', `cargar:${def.ec}`);
  }

  ocultar() { this.activo = false; this.el.hidden = true; }

  // ── el tutor habla en la barra de abajo, sin tapar el cuaderno ──
  _decir(txt, ops = []) {
    const h = this.hud;
    if (h.tutorAbierto) h.cerrarTutor(true);
    h.propuesta = null;
    h.proponer(txt, ops);
    if (/\?\s*$/.test(txt)) this.tPregunta = performance.now();
  }

  _linea(txt, c = '') { this.e.lineas.push({ txt, c }); this._pintar(); }
  _avance() { this.ultimoAvance = performance.now(); }

  // ── pistas: tres niveles por paso, nunca la respuesta ──
  _textosPista(etapa) {
    const { a, b, c, m } = this.e, B = Math.abs(b);
    if (etapa === 0) return [
      `Fijate en el ${b > 0 ? '+' : '−'} ${B}: está ${b > 0 ? 'sumando' : 'restando'} del mismo lado que la x.`,
      b > 0 ? `Si restás ${B} de los dos lados, la igualdad se mantiene y el ${B} se va.` : `Si sumás ${B} de los dos lados, la igualdad se mantiene y el − ${B} se va.`,
      `Te quedaría ${a}x = ${c} ${b > 0 ? '−' : '+'} ${B}. ¿Cuánto da eso?`,
    ];
    return [
      `Ahora la x está multiplicada por ${a}. ¿Qué operación deshace eso?`,
      `Dividí los dos lados por ${a}.`,
      `Te quedaría x = ${m} ÷ ${a}. ¿Cuánto da?`,
    ];
  }

  pista(origen = 'voz') {
    if (!this.activo) return;
    const e = this.e;
    this._avance();
    if (e.resuelto) return this._decir(`Ya lo resolviste: x = ${e.x}.`);
    const et = e.paso1 ? 1 : 0;
    if (e.nivel[et] >= 3) { this.hud.registrar('ejercicio', `pista-agotada:${origen}`); return this._decir('Ya te di las tres pistas de este paso. Probá con la última y decime qué te da.'); }
    const txt = this._textosPista(et)[e.nivel[et]];
    e.nivel[et]++;
    if (origen === 'sugerencia') e.pistasSug++; else e.pistas++;
    e.ultimaPista = { n: e.nivel[et], txt };
    this.hud.registrar('ejercicio', `pista:${et + 1}.${e.nivel[et]}:${origen}`);
    this._pintar();
    this._decir(txt);
  }

  pedirRespuesta(origen = 'voz') {
    if (!this.activo || this.e.resuelto) return;
    this.e.pidioRespuesta++;
    this.hud.registrar('ejercicio', `pidio-respuesta:${origen}`);
    const e = this.e, et = e.paso1 ? 1 : 0;
    if (e.nivel[et] >= 3) return this._decir('La respuesta no te la doy, pero ya estás a un paso: hacé la cuenta de la última pista.');
    this._decir('La respuesta no te la doy, pero te ayudo a llegar.');
    setTimeout(() => this.pista(origen), 2600);
  }

  // ── pasos que dice el participante ──
  _op1(origen) {
    const e = this.e, B = Math.abs(e.b), op = e.b > 0 ? '−' : '+';
    this._avance();
    this.hud.registrar('ejercicio', `paso:op1:${origen}`);
    if (!e.op1) { e.op1 = true; this._linea(`${e.a}x ${signo(e.b)} ${op} ${B} = ${e.c} ${op} ${B}`, 'op'); }
    this._decir('Bien pensado. ¿Y cómo te queda?');
  }

  _paso1(origen) {
    const e = this.e;
    this._avance();
    this.hud.registrar('ejercicio', `paso:${e.a}x=${e.m}:${origen}`);
    if (e.paso1) return this._decir(`Sí, ${e.a}x = ${e.m}. ¿Cómo seguís?`);
    e.paso1 = true;
    e.ultimaPista = null;
    this._linea(`${e.a}x = ${e.m}`, 'ok');
    this._decir(`Eso: ${e.a}x = ${e.m}. ¿Cómo seguís?`);
  }

  _op2(origen) {
    const e = this.e;
    this._avance();
    if (!e.paso1) { this.hud.registrar('ejercicio', `paso:op2-antes:${origen}`); return this._decir(`Se puede, pero conviene sacar primero el ${Math.abs(e.b)} de al lado de la x.`); }
    this.hud.registrar('ejercicio', `paso:op2:${origen}`);
    if (!e.op2) { e.op2 = true; this._linea(`${e.a}x ÷ ${e.a} = ${e.m} ÷ ${e.a}`, 'op'); }
    this._decir('Bien. ¿Cuánto te da?');
  }

  _resolver(origen) {
    const e = this.e;
    if (e.resuelto) return;
    this._avance();
    e.resuelto = true;
    e.tResuelto = performance.now();
    e.ultimaPista = null;
    this._linea(`x = ${e.x}`, 'ok fin');
    this.hud.registrar('ejercicio', `resuelto:${e.ec}:${e.pistas + e.pistasSug}:${origen}`);
    // cierre con una pregunta corta para que lo compruebe
    this._decir(`¡Eso, x = ${e.x}! ¿Comprobás que ${e.a} · ${e.x} ${signo(e.b)} da ${e.c}?`, [[`Sí, da ${e.c}`, () => this.comprobar('boton')], ['Listo', () => this.comprobar('boton', false)]]);
    this.hud.cambio();
  }

  comprobar(origen = 'voz', dijo = true) {
    const e = this.e;
    if (!e || !e.resuelto || e.comprobado) return;
    e.comprobado = true;
    this.hud.registrar('ejercicio', `comprobado:${dijo ? 'si' : 'listo'}:${origen}`);
    const n = e.pistas + e.pistasSug;
    this._pintar();
    this._decir(`${dijo ? `Sí: ${e.a * e.x} ${signo(e.b)} = ${e.c}. ` : ''}Lo resolviste${n ? ` con ${n} pista${n > 1 ? 's' : ''}` : ' sin pistas'}.`);
    this.hud.cambio();
  }

  _error(txt, origen, dir) {
    const e = this.e;
    e.errores.push(txt);
    this._linea(txt, 'tachado');
    this.hud.registrar('ejercicio', `error:${txt}:${origen}`);
    this._avance();
    if (this.espontaneas) return this.sugerir('error');
    // sin sugerencias espontáneas: solo contesta si le hablaron al tutor
    if (dir) this._decir('Mmm, eso no da. Revisalo.');
  }

  _valor(k, v, origen, dir) {
    const e = this.e;
    if (k === 1 && v === e.x) return this._resolver(origen);
    if (k === e.a && v === e.m) return this._paso1(origen);
    return this._error(k === 1 ? `x = ${v}` : `${k}x = ${v}`, origen, dir);
  }

  _suelto(v, origen, dir) {
    const e = this.e;
    if (v === e.x) return this._resolver(origen);
    if (!e.paso1 && v === e.m) return this._paso1(origen);
    // un número suelto equivocado solo cuenta si contesta una pregunta del tutor
    if (dir || performance.now() - this.tPregunta < 15000) return this._error(`${v}`, origen, dir);
  }

  // ── sugerencias que el tutor hace sin que se las pidan ──
  sugerir(motivo = 'tiempo') {
    const h = this.hud, e = this.e;
    if (!this.activo) return false;
    if (e.resuelto) return this.sugerirPractica(motivo);
    if (h.st.foco || !h.aj.sugerencias) {
      this._avance();
      h.registrar('sugerencia', `retenida:${motivo}`);
      return false;
    }
    const B = Math.abs(e.b);
    const txt = !e.paso1 ? `¿Te ayudo? Fijate qué pasa con el ${e.b > 0 ? '' : '− '}${B} cuando lo pasás al otro lado.` : '¿Te ayudo? Fijate qué número está multiplicando a la x.';
    this._mostrarSugerencia(txt, motivo, () => this.pista('sugerencia'));
    return true;
  }

  sugerirPractica(motivo = 'practica') {
    const h = this.hud;
    if (h.st.foco || !h.aj.sugerencias) { h.registrar('sugerencia', `retenida:${motivo}`); return false; }
    const sig = Math.min(this.e.n, EJERCICIOS.length - 1);
    this._mostrarSugerencia('¿Querés otro parecido para practicar?', motivo, () => this.cargar(sig));
    return true;
  }

  _mostrarSugerencia(txt, motivo, alAceptar) {
    const h = this.hud;
    const s = { txt, motivo, estado: 'mostrada', ec: this.e.ec, t: performance.now() };
    this.sugerencias.push(s);
    this.pendiente = s;
    this.e.sugeridas++;
    this._avance();
    h.registrar('sugerencia', `mostrada:${motivo}`);
    if (h.tutorAbierto) h.cerrarTutor(true);
    h.propuesta = null;
    h.proponer(txt, [
      ['Dale', () => { s.estado = 'aceptada'; h.registrar('sugerencia', `aceptada:${motivo}`); if (alAceptar) alAceptar(); h.cambio(); }],
      ['Ahora no', () => { s.estado = 'descartada'; h.registrar('sugerencia', `descartada:${motivo}`); this._avance(); h.cambio(); }],
    ]);
    h.cambio();
  }

  // responde a la sugerencia que está a la vista (el moderador, con sus teclas)
  responderSugerencia(si) {
    const o = this.hud.el.opciones.querySelectorAll('button');
    const b = si ? o[0] : o[o.length - 1];
    if (b) b.click();
  }

  // ── voz: ¿la frase es algo del ejercicio? (llega sin tildes ni mayúsculas) ──
  oir(d, dir) {
    if (!this.activo) return null;
    const e = this.e;
    // la sugerencia a la vista se contesta aunque sus botones todavía no aparecieron
    const s = this.pendiente, h = this.hud;
    if (s && s.estado === 'mostrada' && h.propuesta && h.propuesta.texto === s.txt && d.split(' ').length <= 4) {
      if (/^(dale|si|si dale|dale si|bueno|bueno dale|ok|okey|listo|de una|ayudame|por favor|si por favor)$/.test(d)) return () => this.responderSugerencia(true);
      if (/^(no|no gracias|ahora no|no ahora|despues|mas tarde|paso|no hace falta|no por ahora|todavia no)$/.test(d)) return () => this.responderSugerencia(false);
    }
    const t = aNumeros(d);
    const tiene = (k) => new RegExp(`\\b${k}\\b`).test(t);
    if (e.resuelto) {
      if (!e.comprobado && tiene(e.c) && (/^(?:si |da |es |dio |si da |claro |exacto )*\d+$/.test(t) || /\b(si|da|dio|claro|exacto|correcto)\b/.test(t))) return () => this.comprobar('voz');
      return null;
    }
    // «x es 5», «x igual a cinco», «tres x igual quince», «me queda 3x = 15»
    const mx = t.match(/(?:\b(\d+) )?\bx (?:(?:es|vale|da|seria|queda|nos queda|me queda) )?(?:igual )?(?:a )?(\d+)\b/);
    if (mx) { const k = mx[1] ? +mx[1] : 1, v = +mx[2]; return () => this._valor(k, v, 'voz', dir); }
    // un número suelto: «da quince», «cinco»
    const mn = t.match(/^(?:(?:y|entonces|creo que|me parece que|seria|es|da|me da|queda|son|el resultado es|resultado|igual a|igual) )*(\d+)$/);
    if (mn) return () => this._suelto(+mn[1], 'voz', dir);
    // operaciones con palabras (si está leyendo la ecuación en voz alta, no cuenta)
    const leeEc = /\bx\b/.test(t) && /\bigual\b/.test(t);
    if (!leeEc) {
      const B = Math.abs(e.b);
      const resta = /\b(resto|restar|restas|restando|resta|restamos|le resto|saco|sacar|sacas|sacamos|le saco|quito|quitar|le quito)\b/.test(t);
      const suma = /\b(sumo|sumar|sumas|sumando|suma|sumamos|le sumo|agrego|agregar|agregando)\b/.test(t);
      const divide = /\b(divido|dividir|dividis|dividiendo|divide|dividimos|dividido|entre|partido)\b/.test(t);
      if (!e.paso1 && tiene(B)) {
        if (e.b > 0 ? resta : suma) return () => this._op1('voz');
        if (/\b(paso|pasar|pasas|lo paso|pasamos)\b.*\b(otro lado|al otro)\b/.test(t) && !(e.b > 0 ? suma : resta)) return () => this._op1('voz');
        if (e.b > 0 ? suma : resta) return () => this._error(`${e.b > 0 ? 'sumar' : 'restar'} ${B}`, 'voz', dir);
      }
      if (divide && tiene(e.a)) return () => this._op2('voz');
      if (/\bmultiplic/.test(t) && tiene(e.a)) return () => this._error(`multiplicar por ${e.a}`, 'voz', dir);
      if (e.paso1 && tiene(e.a) && (resta || suma)) return () => this._error(`${resta ? 'restar' : 'sumar'} ${e.a}`, 'voz', dir);
    }
    // pedir la respuesta o pedir ayuda
    if (/\b(dame|decime|deci|cual es|pasame)\b.*\b(respuesta|resultado|solucion)\b|\bcuanto da x\b|\bcuanto vale x\b/.test(t)) return () => this.pedirRespuesta('voz');
    if (/\b(ayuda|ayudame|ayudar|pista|otra pista|no entiendo|no se (que|como|seguir)|me trabe|estoy trabad\w*|me quede trabad\w*|no me sale|como sigo|que hago|que tengo que hacer|como hago|como se hace|me perdi|una mano|no lo entiendo|como lo resuelvo|como resuelvo|no se por donde)\b/.test(t)) return () => this.pista('voz');
    return null;
  }

  // ── cuadro a cuadro: sugerencia si pasa un rato sin avances ──
  update() {
    if (!this.activo || !this.espontaneas) return;
    const e = this.e, h = this.hud;
    if (e.resuelto || e.sugeridas >= 3) return;
    if (performance.now() - this.ultimoAvance < this.demora * 1000) return;
    // en foco (o con la iniciativa apagada) no se muestra: queda anotada como retenida
    if (h.st.foco || !h.aj.sugerencias) { this.sugerir('tiempo'); return; }
    if (h.tutorAbierto || (h.propuesta && h.propuesta.opciones.length) || !h.puestas || !h.visible) return;
    if (h.voz && (h.voz.hablando || h.voz.ptt)) return;
    this.sugerir('tiempo');
  }

  // ── el cuaderno ──
  _pintar() {
    const e = this.e;
    if (!e) return;
    const n = e.pistas + e.pistasSug;
    let h = `<div class="cab"><span>Matemática · Ecuaciones</span><span class="np">${n ? `Pistas · ${n}` : 'Sin pistas'}</span></div>`;
    h += `<div class="sub">Ejercicio ${e.n} · Resolvé</div><div class="ec">${esc(e.ec)}</div>`;
    h += `<ol class="pasos">${e.lineas.map((l) => `<li class="${l.c}">${esc(l.txt)}</li>`).join('')}</ol>`;
    if (e.resuelto) h += `<div class="res">${e.comprobado ? 'Resuelto y comprobado' : 'Resuelto'} · x = ${e.x}</div>`;
    else if (e.ultimaPista) h += `<div class="pista"><b>Pista ${e.ultimaPista.n} de 3</b>${esc(e.ultimaPista.txt)}</div>`;
    if (!e.resuelto) {
      this._ops = this._opcionesPaso();
      h += `<div class="elegir"><span>Próximo paso</span>${this._ops.map(([t], i) => `<button type="button" data-dwell="1.3" data-paso="${i}">${esc(t)}</button>`).join('')}</div>`;
      h += '<div class="pie">Decí cada paso en voz alta o elegilo con la mirada · <button type="button" data-dwell="1.3" data-pista>Pedir una pista</button></div>';
    }
    this.el.innerHTML = h;
  }

  // las tres opciones del próximo paso: una correcta y dos que no (la correcta cambia de lugar)
  _opcionesPaso() {
    const e = this.e, { a, b, c, m, x } = e, B = Math.abs(b);
    const sumar = b < 0, mal = (t) => [t, () => this._error(t, 'mirada', true)];
    let ops, k;
    if (!e.paso1 && !e.op1) {
      ops = [[`${sumar ? 'Sumar' : 'Restar'} ${B} de los dos lados`, () => this._op1('mirada')], mal(`${sumar ? 'Restar' : 'Sumar'} ${B} de los dos lados`), [`Dividir por ${a} los dos lados`, () => this._op2('mirada')]]; k = 0;
    } else if (!e.paso1) {
      ops = [mal(`${a}x = ${c + b}`), [`${a}x = ${m}`, () => this._paso1('mirada')], mal(`x = ${m}`)]; k = 1;
    } else if (!e.op2) {
      ops = [mal(`Multiplicar por ${a} los dos lados`), mal(`Restar ${a} de los dos lados`), [`Dividir por ${a} los dos lados`, () => this._op2('mirada')]]; k = 2;
    } else {
      ops = [[`x = ${x}`, () => this._resolver('mirada')], mal(`x = ${m * a}`), mal(`x = ${m - a}`)]; k = 0;
    }
    return ops;
  }
}
