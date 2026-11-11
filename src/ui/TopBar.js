// Barra superior com identidade Engineering, switch principal entre os 2 modos e controles enxutos.
import { VIEWS } from './AppState.js';
import { h, setText } from './dom.js';

export function createTopBar(ctx) {
  const host = document.getElementById('topbar');

  // Marca Engineering + Projeto Sanepar
  const brand = h(
    'div',
    { class: 'brand' },
    h('img', {
      class: 'eng-logo',
      src: '/eng-logo-dark.svg',
      alt: 'Engineering',
    }),
    h('span', { class: 'brand-divider' }),
    h(
      'div',
      { class: 'brand-titles' },
      h('strong', null, 'PROJETO SANEPAR · DADOS OT & LAKEHOUSE GCP'),
      h('small', null, 'Telemetria operacional, barramento DHuO e arquitetura Medallion · southamerica-east1')
    )
  );

  // Switch central dos 2 modos (Metáfora A vs Metáfora B)
  const modeButtons = {};
  const modeSwitch = h(
    'div',
    { class: 'mode-switch', role: 'tablist', 'aria-label': 'Modo de visualização 3D' },
    Object.values(VIEWS).map((v) => {
      const b = h(
        'button',
        {
          type: 'button',
          class: 'mode-btn',
          'aria-pressed': String(ctx.view.id === v.id),
          onclick: () => ctx.setView(v.id),
        },
        v.label
      );
      modeButtons[v.id] = b;
      return b;
    })
  );

  // Controles de execução + Madrugada + Foco 3D
  const playBtn = h(
    'button',
    {
      type: 'button',
      class: 'btn ctrl-btn',
      onclick: () => ctx.sim.setRunning(!ctx.sim.running),
    },
    'Pausar'
  );

  const speedSelect = h(
    'select',
    {
      class: 'speed-select',
      'aria-label': 'Velocidade da simulação',
      onchange: (e) => ctx.sim.setSpeed(Number(e.target.value)),
    },
    [0.5, 1, 2, 4].map((s) =>
      h('option', { value: String(s), selected: s === 1 ? 'selected' : null }, `${s}×`)
    )
  );

  const nightBtn = h(
    'button',
    {
      type: 'button',
      class: 'btn pink-btn',
      title: 'Alterna para a Plataforma e reproduz a janela 03:45 → 05:40 (reconciliação, cadastros e Dataform)',
      onclick: () => {
        if (ctx.sim.night.active) {
          ctx.sim.stopNightCycle();
        } else {
          if (ctx.view.id !== 'plataforma') ctx.setView('plataforma');
          ctx.sim.startNightCycle();
        }
      },
    },
    'Reproduzir madrugada (03:45→05:40)'
  );

  const focusBtn = h(
    'button',
    {
      type: 'button',
      class: 'btn ghost-btn',
      'aria-pressed': 'false',
      onclick: () => {
        const on = document.getElementById('app').classList.toggle('focus');
        focusBtn.setAttribute('aria-pressed', String(on));
        setText(focusBtn, on ? 'Mostrar cartões' : 'Foco 3D');
        if (ctx.sm) ctx.sm.resize();
      },
    },
    'Foco 3D'
  );

  const actions = h('div', { class: 'topbar-actions' }, playBtn, speedSelect, nightBtn, focusBtn);

  host.append(brand, modeSwitch, actions);

  return {
    update() {
      for (const [id, b] of Object.entries(modeButtons)) {
        b.setAttribute('aria-pressed', String(ctx.view.id === id));
      }
      setText(playBtn, ctx.sim.running ? 'Pausar' : 'Continuar');
      playBtn.classList.toggle('paused', !ctx.sim.running);
      setText(
        nightBtn,
        ctx.sim.night.active
          ? `Parar madrugada (${ctx.sim.night.current?.clock || ''})`
          : 'Reproduzir madrugada (03:45→05:40)'
      );
      nightBtn.classList.toggle('active', ctx.sim.night.active);
    },
  };
}
