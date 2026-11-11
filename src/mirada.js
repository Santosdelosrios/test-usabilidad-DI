// Mirada: en la prueba, el puntero simula hacia dónde miran los ojos de Lu
// (las gafas tienen seguimiento ocular). Arrastrar gira la cabeza; mover el
// puntero mueve los ojos. Sostener la mirada sobre algo elegible lo elige.
// El clic queda como atajo (equivale al pellizco).

const ELEGIBLE = '#hud button, #hud [data-a], #hud [data-mirar]';
const AFUERA = '#tarea, #consigna, #moderador, #externos, #intro, .capa, #sin-gafas, #carga';

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
    this.tiempo = 0.85; // segundos de mirada sostenida para elegir
    this.obj = null; this.p = 0; this.bloq = null;
    this.req = false; this.mov = 0; this.quieto = 0;
    this.enfriar = 0;
    this._pos();
    addEventListener('pointermove', (e) => {
      if (e.pointerType === 'touch') return;
      this.mov += Math.hypot(e.clientX - this.x, e.clientY - this.y);
      this.x = e.clientX; this.y = e.clientY;
      this.hayPuntero = true;
      this.quieto = 0;
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

  // punto de la mirada en pantalla; null si Lu mira fuera de las gafas (la consigna, por ejemplo)
  punto() {
    // sin mirada con el mouse, se mira hacia donde apunta la cabeza (el centro)
    if (!this.activa || !this.hayPuntero) return { x: innerWidth / 2, y: innerHeight / 2 };
    return this.fuera ? null : { x: this.x, y: this.y };
  }

  _pos() { this.el.style.transform = `translate3d(${this.x}px, ${this.y}px, 0)`; }

  _soltar() {
    if (this.obj) this.obj.classList.remove('mirando');
    this.obj = null; this.p = 0;
    this.el.classList.remove('objetivo');
    this.el.style.setProperty('--p', '0');
  }

  update(dt) {
    if (!this.activa || !this.hayPuntero) return;
    // 20 veces por segundo alcanza para la mirada y no frena el dibujo
    this._acum = (this._acum || 0) + dt;
    if (this._acum < 0.05) return;
    dt = this._acum; this._acum = 0;
    this.quieto += dt;
    const sobre = document.elementFromPoint(this.x, this.y);
    this.fuera = !!(sobre && sobre.closest(AFUERA));
    this.el.classList.toggle('fuera', this.fuera);
    // mirar el borde de abajo (o de arriba) de un panel largo lo desplaza
    const panel = !this.fuera && sobre ? sobre.closest('#hud-panel') : null;
    if (panel && panel.scrollHeight > panel.clientHeight + 2) {
      const r = panel.getBoundingClientRect(), borde = 60;
      if (this.y > r.bottom - borde) panel.scrollTop += 300 * dt * Math.min(1, (this.y - (r.bottom - borde)) / borde + 0.3);
      else if (this.y < r.top + borde && panel.scrollTop > 0) panel.scrollTop -= 300 * dt * Math.min(1, ((r.top + borde) - this.y) / borde + 0.3);
    }
    let t = !this.fuera && sobre ? sobre.closest(ELEGIBLE) : null;
    if (t && (t.disabled || t.closest('[hidden], .esperando, .off'))) t = null;
    if (t !== this.obj) {
      if (this.obj) this.obj.classList.remove('mirando');
      this.obj = t; this.p = 0;
      // si algo aparece bajo una mirada quieta no se elige solo: hay que mover un poco los ojos hacia eso
      this.req = this.quieto > 0.25;
      this.mov = 0;
      this.tObj = 0;
      if (t) t.classList.add('mirando');
      this.el.classList.toggle('objetivo', !!t);
    }
    if (this.bloq && t !== this.bloq) this.bloq = null;
    this.enfriar -= dt;
    this.tObj = (this.tObj || 0) + dt;
    const avanza = t && t !== this.bloq && !this.presionado && (!this.req || this.mov > 6) && this.enfriar <= 0;
    if (avanza) this.p += dt / ((parseFloat(t.dataset.dwell) || 1) * this.tiempo);
    else if (t !== this.bloq) this.p = Math.max(0, this.p - dt * 2);
    if (this.p >= 1) {
      this.p = 0;
      this.bloq = t;
      this.enfriar = 0.35;
      t.classList.remove('mirando');
      this.el.classList.remove('elegido'); void this.el.offsetWidth; this.el.classList.add('elegido');
      if (this.alElegir) this.alElegir(t);
      t.click();
    }
    this.el.style.setProperty('--p', this.p.toFixed(3));
  }
}
