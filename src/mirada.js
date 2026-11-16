// Mirada: en la prueba, el puntero simula hacia dónde miran los ojos
// (las gafas tienen seguimiento ocular). Arrastrar gira la cabeza; mover el puntero mueve los ojos.
//
// Regla única en toda la prueba: MIRAR NO ELIGE. Mirar algo elegible lo marca y hace aparecer un
// punto naranja a su costado; mirar ESE punto 1 segundo lo elige (el anillo del punto se llena).
// Así se puede leer una opción con calma sin elegirla sin querer.
// El clic sigue andando como respaldo (sobre el botón o sobre el punto), pero nunca hace falta.

const ELEGIBLE = '#hud button, #hud [data-a], #hud [data-mirar], #consigna button, #bienvenida button, #interludio button, #etiquetas .etiqueta';
const AFUERA = '#tarea, #pantalla-ia, #moderador, #externos, #intro, .capa, #sin-gafas, #carga';
export const TIEMPO_MIRADA = 1;   // segundos mirando el punto para elegir (el mismo en todos lados)
const GRACIA = 0.8;               // segundos que el punto espera mientras los ojos van del botón al punto
const PUNTO = 34;                 // tamaño del punto en pantalla (zona que cuenta como «mirar el punto»)

export class Mirada {
  constructor({ alElegir } = {}) {
    this.el = document.getElementById('mirada');
    this.alElegir = alElegir;
    this.x = innerWidth / 2; this.y = innerHeight / 2;
    this.hayPuntero = false;
    this.presionado = false;
    this.activa = false;
    this.habilitada = true; // se puede apagar: entonces se maneja todo con la voz
    this.fuera = false;
    this.tiempo = TIEMPO_MIRADA;
    this.obj = null;        // lo marcado (al lado está el punto)
    this.externo = null;    // algo marcado desde afuera: el cartel de la flecha del piso que se está mirando
    this.p = 0; this.gracia = 0; this.enfriar = 0; this.salida = null;
    // el punto para elegir: uno solo, que se mueve al costado de lo marcado
    this.pt = document.createElement('div');
    this.pt.id = 'mirada-punto';
    this.pt.hidden = true;
    this.pt.innerHTML = '<i></i>';
    this.pt.setAttribute('aria-hidden', 'true');
    this.pt.addEventListener('click', () => { if (this.obj) this._elegir(this.obj); });
    document.body.appendChild(this.pt);
    this._pos();
    addEventListener('pointermove', (e) => {
      if (e.pointerType === 'touch') return;
      this.x = e.clientX; this.y = e.clientY;
      this.hayPuntero = true;
      this._pos();
    }, { passive: true });
    addEventListener('pointerdown', () => { this.presionado = true; }, true);
    addEventListener('pointerup', () => { this.presionado = false; }, true);
    addEventListener('pointercancel', () => { this.presionado = false; }, true);
    document.documentElement.addEventListener('mouseleave', () => { this.hayPuntero = false; this._soltar(); });
  }

  setActiva(on) {
    if (on === this.activa) return;
    this.activa = on;
    document.body.classList.toggle('mirada-on', on);
    this.el.hidden = !on;
    if (!on) this._soltar();
  }

  // punto de la mirada en pantalla; null si mira fuera de las gafas (la consigna, por ejemplo)
  punto() {
    if (!this.activa || !this.hayPuntero) return { x: innerWidth / 2, y: innerHeight / 2 };
    return this.fuera ? null : { x: this.x, y: this.y };
  }

  _pos() { this.el.style.transform = `translate3d(${this.x}px, ${this.y}px, 0)`; }

  _soltar() {
    if (this.obj) this.obj.classList.remove('mirando');
    this.obj = null; this.p = 0; this.gracia = 0;
    this.pt.hidden = true;
    this.pt.style.setProperty('--p', '0');
    this.el.classList.remove('objetivo');
    this.el.style.setProperty('--p', '0');
  }

  _marcar(t) {
    if (this.obj) this.obj.classList.remove('mirando');
    this.obj = t; this.p = 0; this.gracia = 0;
    t.classList.add('mirando');
    this.pt.classList.remove('aparece'); void this.pt.offsetWidth; this.pt.classList.add('aparece');
    this._ubicar(true);
  }

  // el punto va al costado derecho de lo marcado; si ahí hay otra cosa elegible (o no entra), a la izquierda,
  // abajo o arriba. Nunca encima del texto: así leer no elige.
  _ubicar(forzar = false) {
    const t = this.obj;
    if (!t || !t.isConnected) return this._soltar();
    const r = t.getBoundingClientRect();
    if (!r.width && !r.height) return this._soltar();
    // solo se recalcula si lo marcado se movió (las etiquetas en 3D se mueven al girar)
    const u = this._ur;
    if (!forzar && u && Math.abs(u.x - r.x) < 1.5 && Math.abs(u.y - r.y) < 1.5 && Math.abs(u.w - r.width) < 1.5 && Math.abs(u.h - r.height) < 1.5) return;
    this._ur = { x: r.x, y: r.y, w: r.width, h: r.height };
    const m = PUNTO / 2 + 6, w = innerWidth, h = innerHeight;
    const cands = [
      [r.right + m, r.top + r.height / 2],
      [r.left - m, r.top + r.height / 2],
      [r.left + r.width / 2, r.bottom + m],
      [r.left + r.width / 2, r.top - m],
    ];
    const libre = ([x, y]) => {
      if (x < PUNTO / 2 || y < PUNTO / 2 || x > w - PUNTO / 2 || y > h - PUNTO / 2) return false;
      for (const [dx, dy] of [[0, 0], [-12, 0], [12, 0], [0, -12], [0, 12]]) {
        const e = document.elementsFromPoint(x + dx, y + dy).find((q) => q !== this.pt && !this.pt.contains(q) && q !== this.el);
        const el = e && e.closest(ELEGIBLE);
        if (el && el !== t) return false;
      }
      return true;
    };
    const [x, y] = cands.find(libre) || cands[0];
    this.pt.style.transform = `translate3d(${Math.round(x - PUNTO / 2)}px, ${Math.round(y - PUNTO / 2)}px, 0)`;
    this.pt.hidden = false;
    this._pc = { x, y };
  }

  _elegir(t) {
    this.p = 0;
    this.enfriar = 0.4;
    this.salida = { x: this.x, y: this.y };  // hasta que los ojos se vayan de ahí no se marca nada
    t.classList.remove('elegido-flash'); void t.offsetWidth; t.classList.add('elegido-flash');
    setTimeout(() => t.classList.remove('elegido-flash'), 500);
    this.el.classList.remove('elegido'); void this.el.offsetWidth; this.el.classList.add('elegido');
    this._soltar();
    if (this.alElegir) this.alElegir(t);
    t.click();
  }

  update(dt) {
    if (!this.activa || !this.hayPuntero) return;
    // 20 veces por segundo alcanza para la mirada y no frena el dibujo
    this._acum = (this._acum || 0) + dt;
    if (this._acum < 0.05) return;
    dt = this._acum; this._acum = 0;
    this.enfriar -= dt;
    // después de elegir, los ojos tienen que moverse un poco antes de marcar otra cosa
    if (this.salida && Math.hypot(this.x - this.salida.x, this.y - this.salida.y) > 40) this.salida = null;
    // lo marcado se puede mover (etiquetas en 3D, opciones que se reacomodan): el punto lo sigue
    if (this.obj && (!this.obj.isConnected || this.obj.closest('[hidden]') || this.obj.disabled)) this._soltar();
    if (this.obj) this._ubicar();
    const sobre = document.elementFromPoint(this.x, this.y);
    const enPunto = !!(this.obj && sobre && (sobre === this.pt || this.pt.contains(sobre)));
    this.fuera = !enPunto && !!(sobre && sobre.closest(AFUERA));
    this.el.classList.toggle('fuera', this.fuera);
    // mirar el borde de abajo (o de arriba) de un panel largo lo desplaza
    const panel = !this.fuera && sobre ? sobre.closest('#hud-panel') : null;
    if (panel && panel.scrollHeight > panel.clientHeight + 2) {
      const r = panel.getBoundingClientRect(), borde = 60;
      if (this.y > r.bottom - borde) panel.scrollTop += 300 * dt * Math.min(1, (this.y - (r.bottom - borde)) / borde + 0.3);
      else if (this.y < r.top + borde && panel.scrollTop > 0) panel.scrollTop -= 300 * dt * Math.min(1, ((r.top + borde) - this.y) / borde + 0.3);
    }
    let t = null;
    if (!enPunto && !this.fuera && !this.salida && sobre) t = sobre.closest(ELEGIBLE);
    if (t && (t.disabled || t.closest('[hidden], .esperando, .off'))) t = null;
    if (!t && !enPunto && !this.fuera && !this.salida && this.externo && this.externo.isConnected) t = this.externo;
    if (enPunto) this.gracia = 0;
    else if (t) { if (t !== this.obj) this._marcar(t); this.gracia = 0; }
    else if (this.obj) { this.gracia += dt; if (this.gracia > GRACIA) this._soltar(); }
    this.el.classList.toggle('objetivo', enPunto);
    // solo mirar el punto llena el anillo
    const avanza = enPunto && !this.presionado && this.enfriar <= 0;
    if (avanza) this.p += dt / this.tiempo;
    else this.p = Math.max(0, this.p - dt * 3);
    if (this.p >= 1 && this.obj) return this._elegir(this.obj);
    this.pt.style.setProperty('--p', this.p.toFixed(3));
    this.el.style.setProperty('--p', this.p.toFixed(3));
  }
}
