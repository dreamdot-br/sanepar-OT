// Ponto de entrada do Sanepar 3D:
// - Modo 1 ("operacional"): Cidade 3D + Rede de Água Subterrânea + Nuvem DHuO -> GCP (WebGL / Three.js)
// - Modo 2 ("plataforma"): Diagrama de Arquitetura 2D Interativo e Animado do Lakehouse GCP (HTML + SVG 60fps)
import './styles/base.css';
import { DataFlowSimulator } from './simulation/DataFlowSimulator.js';
import { SceneManager, webglAvailable } from './scene/SceneManager.js';
import { Picking } from './scene/Picking.js';
import { OperationField } from './factory/OperationField.js';
import { PlatformDiagram2D } from './integration/PlatformDiagram2D.js';
import { Selection, ViewState } from './ui/AppState.js';
import { createTopBar } from './ui/TopBar.js';
import { createExecutiveStrip } from './ui/ExecutiveStrip.js';
import { createStageOverlay } from './ui/StageOverlay.js';
import { createSimFooter } from './ui/SimFooter.js';

const sim = new DataFlowSimulator();
const selection = new Selection();
const view = new ViewState();
const hasGL = webglAvailable();

const sceneContainer = document.getElementById('scene');
const stageContainer = document.getElementById('stage');

const ctx = {
  sim,
  selection,
  view,
  sm: null,
  flyTo: () => {},
  setView: () => {},
};

let picking = null;
let fieldScene = null;

function selectItem(type, id) {
  if (!type || !id) {
    selection.clear();
    if (picking) picking.select(null);
    return;
  }
  selection.set(type, id);
  if (picking && type === 'field') picking.selectById(type, id);
}

// Diagrama 2D animado da Plataforma de Dados (funciona mesmo sem WebGL)
const platform2D = new PlatformDiagram2D(stageContainer, sim, {
  onSelectItem: selectItem,
});

ctx.flyTo = (presetName) => {
  if (ctx.sm) ctx.sm.cameraController.flyTo(presetName, 1.25);
};

ctx.setView = (modeId, { camera = true } = {}) => {
  const changed = view.id !== modeId;
  view.set(modeId);
  if (changed) selection.clear();

  const isField = view.id === 'operacional';
  sceneContainer.style.display = isField ? '' : 'none';
  document.getElementById('fallback').hidden = !isField || hasGL;

  if (fieldScene) fieldScene.setVisible(isField);
  platform2D.setVisible(!isField);

  if (changed && camera && isField && ctx.sm) {
    ctx.flyTo('campo_geral');
  }
  uiUpdate();
};

if (hasGL) {
  const sm = new SceneManager(sceneContainer);
  ctx.sm = sm;
  picking = new Picking(sm, {
    onSelect: (pick, root) => {
      if (pick) {
        picking.select(root);
        selection.set(pick.type, pick.id);
      } else {
        picking.select(null);
        selection.clear();
      }
    },
  });

  fieldScene = new OperationField(sm, sim, picking, { onSelectItem: selectItem });
  fieldScene.setVisible(true);

  sm.onContextLost = () => {
    if (view.id === 'operacional') document.getElementById('fallback').hidden = false;
  };
} else {
  document.getElementById('fallback').hidden = false;
}

document.getElementById('fallback-reload').addEventListener('click', () => window.location.reload());

const modules = [
  createTopBar(ctx),
  createExecutiveStrip(ctx),
  createStageOverlay(ctx),
  createSimFooter(ctx),
];

function uiUpdate() {
  for (const m of modules) m.update();
}

selection.on(() => {
  if (fieldScene) fieldScene.setHighlight(selection.type === 'field' ? selection.id : null);
  platform2D.setHighlight(selection.type === 'lakehouse' ? selection.id : null);
  if (picking && !selection.type) picking.select(null);
  uiUpdate();
});

for (const ev of ['run:change', 'speed:change', 'night:change', 'sim:reset']) {
  sim.bus.on(ev, uiUpdate);
}

window.addEventListener('keydown', (e) => {
  if (e.target && ['INPUT', 'SELECT', 'TEXTAREA'].includes(e.target.tagName)) return;
  if (e.code === 'Space') {
    e.preventDefault();
    sim.setRunning(!sim.running);
  } else if (e.code === 'Escape') {
    if (selection.type) selection.clear();
    else if (sim.night.active) sim.stopNightCycle();
  } else if (e.key === '1') {
    ctx.setView('operacional');
  } else if (e.key === '2') {
    ctx.setView('plataforma');
  }
});

let uiAccum = 0;
function stepAll(dt) {
  sim.advance(dt);
  platform2D.update(dt);
  uiAccum += dt;
  if (uiAccum >= 0.15) {
    uiAccum = 0;
    uiUpdate();
  }
}

if (ctx.sm) {
  ctx.sm.addUpdater(stepAll);
  ctx.sm.start();
} else {
  let last = performance.now();
  setInterval(() => {
    const now = performance.now();
    stepAll(Math.min(0.1, (now - last) / 1000));
    last = now;
  }, 33);
}
uiUpdate();
