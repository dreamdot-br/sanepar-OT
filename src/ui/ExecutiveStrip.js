// Faixa de cartões executivos fixos (Diretoria / Comitê Sanepar).
// Exibe apenas fatos auditados no Inventário Lakehouse SANEPAR (26/10/2026), mudando conforme o modo.
import { EXECUTIVE_CARDS } from '../content/catalog.js';
import { h, setChildren, chip } from './dom.js';

export function createExecutiveStrip(ctx) {
  const host = document.getElementById('exec-strip');
  let renderedMode = null;

  function render() {
    const mode = ctx.view.id;
    if (mode === renderedMode) return;
    renderedMode = mode;

    const cards = EXECUTIVE_CARDS[mode] || EXECUTIVE_CARDS.operacional;
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
  }

  render();
  return { update: render };
}
