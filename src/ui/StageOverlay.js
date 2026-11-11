// Controles sobrepostos ao palco:
// - Na Visão 1 (Cidade 3D):
//   1) Botões das 2 Narrativas Automáticas de Negócio (Auto-Loop estilo vídeo Energisa) + HUD de Relógio/Status + Card de Negócio
//   2) Botões dos 5 Cenários Pontuais de Campo + Cartão Diagnóstico
//   3) Presets de câmera 3D
// - Em ambas: Banner da Madrugada e Popover Técnico ao clicar em equipamentos/nós.
import { CAMERA_PRESETS, NIGHT_PHASES } from '../config.js';
import {
  FIELD_ITEMS,
  LAKEHOUSE_NODES,
  FIELD_SCENARIOS,
  BUSINESS_STORIES,
} from '../content/catalog.js';
import { h, setChildren, chip } from './dom.js';

export function createStageOverlay(ctx) {
  const stageEl = document.getElementById('stage');
  const camsHost = document.getElementById('stage-cams');
  const noteHost = document.getElementById('stage-note');
  const popHost = document.getElementById('popover-host');
  const nightHost = document.getElementById('night-banner');

  const scenBarHost = h('div', { class: 'scenario-bar' });
  const scenCardHost = h('div', { class: 'scenario-card-host' });
  const storyHudHost = h('div', { class: 'story-hud-host' });
  stageEl.append(scenBarHost, scenCardHost, storyHudHost);

  let lastMode = null;
  let lastSelKey = '';
  let lastNightKey = '';
  let lastBarStateKey = '';
  let lastStoryActKey = '';
  let lastCameraActId = null;

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

  function triggerStory(storyId) {
    if (!storyId) {
      ctx.sim.stopStory();
      lastCameraActId = null;
      ctx.flyTo('campo_geral');
      return;
    }
    ctx.selection.clear();
    ctx.sim.startStory(storyId);
    if (ctx.sim.story.active && ctx.sim.story.currentAct) {
      lastCameraActId = ctx.sim.story.currentAct.id;
      ctx.flyTo(ctx.sim.story.currentAct.cameraPreset || 'campo_geral');
    } else {
      lastCameraActId = null;
      ctx.flyTo('campo_geral');
    }
  }

  function renderScenarioBarAndCard() {
    const isField = ctx.view.id === 'operacional';
    scenBarHost.hidden = !isField;
    scenCardHost.hidden = !isField || !ctx.sim.activeScenario;
    storyHudHost.hidden = !isField || !ctx.sim.story.active;

    if (!isField) return;

    // Acompanha mudança automática de ato da narrativa para mover a câmera sozinha
    if (ctx.sim.story.active && ctx.sim.story.currentAct) {
      const curAct = ctx.sim.story.currentAct;
      if (curAct.id !== lastCameraActId) {
        lastCameraActId = curAct.id;
        if (curAct.cameraPreset) ctx.flyTo(curAct.cameraPreset);
      }
    } else {
      lastCameraActId = null;
    }

    const barKey = `${ctx.sim.activeScenario || ''}|${ctx.sim.story.active ? ctx.sim.story.storyId : ''}`;
    if (barKey !== lastBarStateKey) {
      lastBarStateKey = barKey;

      setChildren(
        scenBarHost,
        h('span', { class: 'sb-label pink-lbl' }, 'Simulações de Negócio (Auto-Loop):'),
        Object.values(BUSINESS_STORIES).map((st) =>
          h(
            'button',
            {
              type: 'button',
              class: `btn story-btn ${ctx.sim.story.active && ctx.sim.story.storyId === st.id ? 'active' : ''}`,
              'aria-pressed': String(ctx.sim.story.active && ctx.sim.story.storyId === st.id),
              onclick: () => triggerStory(st.id),
            },
            st.shortLabel
          )
        ),
        h('span', { class: 'sb-sep' }),
        h('span', { class: 'sb-label' }, 'Eventos Pontuais:'),
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
        ctx.sim.activeScenario || ctx.sim.story.active
          ? h(
              'button',
              {
                type: 'button',
                class: 'btn scen-reset-btn',
                onclick: () => {
                  if (ctx.sim.story.active) triggerStory(null);
                  if (ctx.sim.activeScenario) triggerScenario(null);
                },
              },
              'Restaurar Visão Normal'
            )
          : null
      );

      // Cartão de evento pontual (quando um dos 5 cenários está ativo)
      const sc = ctx.sim.activeScenario ? FIELD_SCENARIOS[ctx.sim.activeScenario] : null;
      if (!sc) {
        setChildren(scenCardHost);
      } else {
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
    }

    // Renderiza o HUD de Negócio (estilo vídeo Energisa) quando uma Narrativa está ativa
    if (!ctx.sim.story.active || !ctx.sim.story.currentAct) {
      if (lastStoryActKey !== '') {
        lastStoryActKey = '';
        setChildren(storyHudHost);
      }
      return;
    }

    const st = BUSINESS_STORIES[ctx.sim.story.storyId];
    const act = ctx.sim.story.currentAct;
    const progBucket = Math.floor(ctx.sim.story.actProgress * 25);
    const actKey = `${st.id}:${act.id}:${progBucket}`;
    if (actKey === lastStoryActKey) return;
    lastStoryActKey = actKey;

    setChildren(
      storyHudHost,
      // 1) HUD Superior Esquerdo estilo Energisa (Relógio + Período + Status da Rede) + Banner
      h(
        'div',
        { class: 'energisa-top-row' },
        h(
          'div',
          { class: 'energisa-clock-pill' },
          h('strong', { class: 'ecp-clock' }, act.clock),
          h('span', { class: 'ecp-weather' }, act.weather),
          h('span', { class: `ecp-status ${act.statusKind}` }, act.status)
        ),
        h('div', { class: `energisa-banner ${act.statusKind}` }, act.banner)
      ),
      // 2) Card Executivo de Negócio (Canto Inferior Direito / Esquerdo limpo)
      h(
        'aside',
        { class: 'story-business-card' },
        h(
          'div',
          { class: 'sbc-head' },
          h(
            'div',
            null,
            h('span', { class: 'sbc-eyebrow' }, `${st.title} · ETAPA ${ctx.sim.story.actIndex + 1} DE ${st.acts.length} (AUTO-LOOP)`),
            h('h3', null, act.headline)
          ),
          h(
            'div',
            { class: 'sbc-nav' },
            h(
              'button',
              {
                type: 'button',
                class: 'btn sbc-btn',
                title: 'Etapa anterior',
                onclick: () => ctx.sim.stepStory(-1),
              },
              '◀'
            ),
            h(
              'button',
              {
                type: 'button',
                class: 'btn sbc-btn',
                title: 'Próxima etapa',
                onclick: () => ctx.sim.stepStory(1),
              },
              '▶'
            ),
            h(
              'button',
              {
                type: 'button',
                class: 'tp-close',
                title: 'Sair da simulação',
                onclick: () => triggerStory(null),
              },
              '×'
            )
          )
        ),
        h('p', { class: 'sbc-narrative' }, act.narrative),
        h(
          'div',
          { class: 'sbc-kpis' },
          act.kpis.map(([lbl, val]) =>
            h('div', { class: 'sbc-kpi' }, h('span', null, lbl), h('strong', null, val))
          )
        ),
        h(
          'div',
          { class: 'sbc-progress-track' },
          st.acts.map((a, idx) =>
            h(
              'div',
              { class: 'sbc-seg' },
              h('i', {
                style:
                  idx < ctx.sim.story.actIndex
                    ? 'width:100%'
                    : idx === ctx.sim.story.actIndex
                      ? `width:${Math.round(ctx.sim.story.actProgress * 100)}%`
                      : 'width:0%',
              })
            )
          )
        )
      )
    );
  }

  function renderCamerasAndNote() {
    if (lastMode === ctx.view.id) return;
    lastMode = ctx.view.id;
    lastBarStateKey = '';
    lastStoryActKey = '';

    if (ctx.view.id === 'operacional') {
      camsHost.hidden = false;
      noteHost.textContent =
        'Maquete 3D de Operação · selecione uma simulação no topo ou clique nos elementos da cidade';
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
