// Estado compartilhado da interface: modo de visão (2 modos) e item selecionado (popover técnico).
export const VIEWS = {
  operacional: {
    id: 'operacional',
    label: '1 · Operação de campo (OT)',
    sub: 'Unidade operacional → Historian → Gateway DHuO',
  },
  plataforma: {
    id: 'plataforma',
    label: '2 · Plataforma de dados (Lakehouse GCP)',
    sub: 'Fontes → Ingestão → RAW → Trusted → Refined → Looker (D0, D4, D6)',
  },
};

class Emitter {
  constructor() {
    this.fns = new Set();
  }
  on(fn) {
    this.fns.add(fn);
    return () => this.fns.delete(fn);
  }
  emit(...a) {
    for (const f of [...this.fns]) f(...a);
  }
}

export class Selection extends Emitter {
  constructor() {
    super();
    this.type = null;
    this.id = null;
  }
  set(type, id) {
    if (this.type === type && this.id === id) return;
    this.type = type;
    this.id = id;
    this.emit(this);
  }
  clear() {
    this.set(null, null);
  }
}

export class ViewState extends Emitter {
  constructor() {
    super();
    this.id = 'operacional';
  }
  set(id) {
    if (!VIEWS[id] || id === this.id) return;
    this.id = id;
    this.emit(id);
  }
}
