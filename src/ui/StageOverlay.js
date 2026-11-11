// Controles sobrepostos ao palco: presets de câmera (na Cidade 3D), banner da madrugada e popover técnico ao clicar.
import { CAMERA_PRESETS, NIGHT_PHASES } from '../config.js';
import { FIELD_ITEMS, LAKEHOUSE_NODES } from '../content/catalog.js';
import { h, setChildren, chip } from './dom.js';

export function createStageOverlay(ctx) {
  const camsHost = document.getElementById('stage-cams');
  const noteHost = document.getElementById('stage-note');
  const popHost = document.getElementById('popover-host');
  const nightHost = document.getElementById('night-banner');

  let lastMode = null;
  let lastSelKey = '';
  let lastNightKey = '';

  function renderCamerasAndNote() {
    if (lastMode === ctx.view.id) return;
    lastMode = ctx.view.id;

    if (ctx.view.id === 'operacional') {
      camsHost.hidden = false;
      noteHost.textContent =
        'Maquete 3D conceitual (relevo, cidade, rede subterrânea e nuvem DHuO/GCP) · clique nos elementos para ver os objetos do inventário · arraste para orbitar';
      const presets = Object.entries(CAMERA_PRESETS).filter(([, p]) => p.mode === 'operacional');
      setChildren(
        camsHost,
        presets.map(([key, p]) =>
          h(
            'button',
            {
              type: 'button',
              class: 'btn cam-btn',
              onclick: () => ctx.flyTo(key),
            },
            p.label
          )
        )
      );
    } else {
      camsHost.hidden = true;
      noteHost.textContent =
        'Arquitetura 2D animada em tempo real · clique em qualquer bloco para inspecionar métricas e objetos reais do GCP';
    }
  }

  function renderPopover() {
    const sel = ctx.selection;
    const key = sel.type ? `${sel.type}:${sel.id}` : '';
    if (key === lastSelKey) return;
    lastSelKey = key;

    if (!sel.type || !sel.id) {
      setChildren(popHost);
      return;
    }

    const item = sel.type === 'field' ? FIELD_ITEMS[sel.id] : LAKEHOUSE_NODES[sel.id];
    if (!item) {
      setChildren(popHost);
      return;
    }

    setChildren(
      popHost,
      h(
        'aside',
        { class: 'tech-popover', role: 'dialog', 'aria-label': item.title },
        h(
          'div',
          { class: 'tp-head' },
          h(
            'div',
            null,
            h('span', { class: 'tp-eyebrow' }, item.layerLabel || `Camada · ${item.band?.toUpperCase() || 'GCP'}`),
            h('h3', null, item.title)
          ),
          h(
            'div',
            { class: 'tp-actions' },
            chip(item.fid || 'inv'),
            h(
              'button',
              {
                type: 'button',
                class: 'tp-close',
                onclick: () => ctx.selection.clear(),
                title: 'Fechar (Esc)',
              },
              '×'
            )
          )
        ),
        h('p', { class: 'tp-desc' }, item.description),
        item.metrics && item.metrics.length
          ? h(
              'div',
              { class: 'tp-metrics' },
              item.metrics.map(([k, v]) =>
                h('div', { class: 'tp-row' }, h('span', null, k), h('b', null, v))
              )
            )
          : null,
        item.objects && item.objects.length
          ? h(
              'div',
              { class: 'tp-objects' },
              h('span', { class: 'tp-obj-title' }, 'Objetos canônicos no Inventário GCP:'),
              h(
                'ul',
                null,
                item.objects.map((o) => h('li', null, h('code', null, o)))
              )
            )
          : null
      )
    );
  }

  function renderNightBanner() {
    const n = ctx.sim.night;
    if (!n.active || !n.current) {
      nightHost.hidden = true;
      lastNightKey = '';
      return;
    }
    nightHost.hidden = false;
    const key = `${n.phaseIndex}:${Math.floor(n.phaseProgress * 20)}`;
    if (key === lastNightKey) return;
    lastNightKey = key;

    const ph = n.current;
    setChildren(
      nightHost,
      h(
        'div',
        { class: 'nb-top' },
        h('span', { class: 'nb-clock' }, `JANELA DA MADRUGADA · ${ph.clock}`),
        h('strong', { class: 'nb-title' }, ph.title),
        h(
          'div',
          { class: 'nb-steps' },
          NIGHT_PHASES.map((p, idx) =>
            h('i', {
              class: idx < n.phaseIndex ? 'done' : idx === n.phaseIndex ? 'cur' : '',
              title: p.title,
            })
          )
        )
      ),
      h('p', { class: 'nb-detail' }, ph.detail)
    );
  }

  renderCamerasAndNote();
  return {
    update() {
      renderCamerasAndNote();
      renderPopover();
      renderNightBanner();
    },
  };
}
