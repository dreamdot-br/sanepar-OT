// Faixa de cartões executivos fixos:
// Oculta na Visão 1 (Negócio / Cidade 3D) para dar espaço total à maquete;
// exibida na Visão 2 (Plataforma de Dados / Camada Técnica).
import { EXECUTIVE_CARDS } from '../content/catalog.js';
import { h, setChildren, chip } from './dom.js';

export function createExecutiveStrip(ctx) {
  const host = document.getElementById('exec-strip');
  let renderedMode = null;

  function render() {
    const mode = ctx.view.id;
    if (mode === renderedMode) return;
    renderedMode = mode;

    // Na Visão 1 (operacional / negócio), ocultamos a faixa de cartões técnicos do topo
    if (mode === 'operacional') {
      host.hidden = true;
      if (ctx.sm) requestAnimationFrame(() => ctx.sm.resize());
      return;
    }

    host.hidden = false;
    const cards = EXECUTIVE_CARDS[mode] || EXECUTIVE_CARDS.plataforma;
    setChildren(
      host,
      cards.map((c) =>
        h(
          'article',
          { class: 'exec-card' },
          h(
            'div',
            { class: 'ec-head' },
            h('span', { class: 'ec-eyebrow' }, c.eyebrow),
            chip(c.fid)
          ),
          h('h2', { class: 'ec-title' }, c.title),
          h(
            'div',
            { class: 'ec-kpi' },
            h('strong', { class: 'ec-metric' }, c.metric),
            h('span', { class: 'ec-sub' }, c.metricSub)
          ),
          h(
            'ul',
            { class: 'ec-bullets' },
            c.bullets.map((b) => h('li', null, b))
          )
        )
      )
    );
    if (ctx.sm) requestAnimationFrame(() => ctx.sm.resize());
  }

  render();
  return { update: render };
}
