// Controles sobrepostos ao palco:
// - Na Visão 1 (Cidade 3D): Barra superior de 5 Cenários de Falha/Inteligência Operacional + Cartão Diagnóstico Comparativo + Presets de câmera.
// - Em ambas: Banner da Madrugada e Popover Técnico ao clicar em equipamentos/nós.
import { CAMERA_PRESETS, NIGHT_PHASES } from '../config.js';
import { FIELD_ITEMS, LAKEHOUSE_NODES, FIELD_SCENARIOS } from '../content/catalog.js';
import { h, setChildren, chip } from './dom.js';

export function createStageOverlay(ctx) {
  const stageEl = document.getElementById('stage');
  const camsHost = document.getElementById('stage-cams');
  const noteHost = document.getElementById('stage-note');
  const popHost = document.getElementById('popover-host');
  const nightHost = document.getElementById('night-banner');

  // Host da barra de cenários de falha e do cartão de diagnóstico comparativo (Visão 1)
  const scenBarHost = h('div', { class: 'scenario-bar' });
  const scenCardHost = h('div', { class: 'scenario-card-host' });
  stageEl.append(scenBarHost, scenCardHost);

  let lastMode = null;
  let lastSelKey = '';
  let lastNightKey = '';
  let lastScenId = undefined;

  function triggerScenario(id) {
    ctx.sim.setScenario(id);
    const active = ctx.sim.activeScenario;
    if (active && FIELD_SCENARIOS[active]) {
      const sc = FIELD_SCENARIOS[active];
      ctx.selection.clear();
      if (sc.cameraPreset) ctx.flyTo(sc.cameraPreset);
    } else {
      ctx.flyTo('campo_geral');
    }
  }

  function renderScenarioBarAndCard() {
    const isField = ctx.view.id === 'operacional';
    scenBarHost.hidden = !isField;
    scenCardHost.hidden = !isField || !ctx.sim.activeScenario;

    if (!isField) return;
    if (lastScenId === ctx.sim.activeScenario) return;
    lastScenId = ctx.sim.activeScenario;

    setChildren(
      scenBarHost,
      h('span', { class: 'sb-label' }, 'Simular Eventos em Campo:'),
      Object.values(FIELD_SCENARIOS).map((sc) =>
        h(
          'button',
          {
            type: 'button',
            class: `btn scen-btn ${sc.severity} ${ctx.sim.activeScenario === sc.id ? 'active' : ''}`,
            'aria-pressed': String(ctx.sim.activeScenario === sc.id),
            onclick: () => triggerScenario(sc.id),
          },
          sc.shortLabel
        )
      ),
      ctx.sim.activeScenario
        ? h(
            'button',
            {
              type: 'button',
              class: 'btn scen-reset-btn',
              onclick: () => triggerScenario(null),
            },
            'Restaurar Operação Normal'
          )
        : null
    );

    const sc = ctx.sim.activeScenario ? FIELD_SCENARIOS[ctx.sim.activeScenario] : null;
    if (!sc) {
      setChildren(scenCardHost);
      return;
    }

    setChildren(
      scenCardHost,
      h(
        'aside',
        { class: `scenario-diag-card ${sc.severity}`, role: 'region', 'aria-label': sc.title },
        h(
          'div',
          { class: 'sdc-head' },
          h(
            'div',
            null,
            h('span', { class: 'sdc-eyebrow' }, 'DIAGNÓSTICO DE CAMPO · INTELIGÊNCIA CRUZADA NO LAKEHOUSE'),
            h('h3', null, sc.title)
          ),
          h(
            'button',
            {
              type: 'button',
              class: 'tp-close',
              title: 'Encerrar cenário',
              onclick: () => triggerScenario(null),
            },
            '×'
          )
        ),
        h(
          'div',
          { class: 'sdc-tag-strip' },
          h('code', null, sc.tagAlert.uid),
          h('strong', null, sc.tagAlert.valor),
          h('span', null, `→ ${sc.tagAlert.dest}`)
        ),
        h(
          'div',
          { class: 'sdc-compare' },
          h(
            'div',
            { class: 'sdc-col before' },
            h('span', { class: 'sdc-col-lbl' }, 'Sem visão integrada (Antes)'),
            h('p', null, sc.beforeText)
          ),
          h(
            'div',
            { class: 'sdc-col now' },
            h('span', { class: 'sdc-col-lbl' }, 'Com DHuO + Lakehouse GCP (Agora)'),
            h('p', null, sc.nowText)
          )
        ),
        h(
          'div',
          { class: 'sdc-objects' },
          h('span', null, 'Objetos acionados no BigQuery:'),
          sc.objectsUsed.map((o) => h('code', null, o))
        )
      )
    );
  }

  function renderCamerasAndNote() {
    if (lastMode === ctx.view.id) return;
    lastMode = ctx.view.id;
    lastScenId = undefined;

    if (ctx.view.id === 'operacional') {
      camsHost.hidden = false;
      noteHost.textContent =
        'Maquete 3D conceitual · use os botões acima para simular falhas e eventos operacionais ou clique nos elementos da cidade';
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
  renderScenarioBarAndCard();
  return {
    update() {
      renderCamerasAndNote();
      renderScenarioBarAndCard();
      renderPopover();
      renderNightBanner();
    },
  };
}
