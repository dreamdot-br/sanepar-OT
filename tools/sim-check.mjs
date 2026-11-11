// Verificação automatizada em Node (sem DOM/WebGL) dos invariantes da simulação e do catálogo.
import assert from 'node:assert/strict';
import { DataFlowSimulator } from '../src/simulation/DataFlowSimulator.js';
import { NIGHT_PHASES } from '../src/config.js';
import { EXECUTIVE_CARDS, FIELD_ITEMS, LAKEHOUSE_NODES, LAKEHOUSE_LINKS } from '../src/content/catalog.js';

console.log('Iniciando verificações do Sanepar 3D (check:sim)...');

// 1. Integridade do catálogo
assert.equal(EXECUTIVE_CARDS.operacional.length, 3, '3 cartões executivos no modo operacional');
assert.equal(EXECUTIVE_CARDS.plataforma.length, 3, '3 cartões executivos no modo plataforma');
assert.ok(Object.keys(FIELD_ITEMS).length >= 5, '5 itens selecionáveis na cena de campo');
assert.ok(Object.keys(LAKEHOUSE_NODES).length >= 14, 'nós agrupados do Lakehouse');

for (const link of LAKEHOUSE_LINKS) {
  assert.ok(LAKEHOUSE_NODES[link.from], `Link ${link.id}: nó de origem ${link.from} existe`);
  assert.ok(LAKEHOUSE_NODES[link.to], `Link ${link.id}: nó de destino ${link.to} existe`);
}

// 2. Determinismo por semente (duas instâncias independentes produzem o mesmo estado)
const simA = new DataFlowSimulator();
const simB = new DataFlowSimulator();
for (let i = 0; i < 600; i++) {
  simA.advance(1 / 60);
  simB.advance(1 / 60);
}
assert.deepEqual(simA.counters, simB.counters, 'Simulação deve ser 100% determinística');
assert.ok(simA.counters.sessionReads > 0, 'Leituras da sessão avançam no modo contínuo');
assert.ok(simA.counters.terceirosCycles > 0, 'Ciclos do coletor terceiros avançam');
assert.ok(simA.counters.proprioCycles > 0, 'Ciclos do coletor próprio avançam');

// 3. Sequência completa da madrugada (03:45 -> 05:40)
const simNight = new DataFlowSimulator();
simNight.startNightCycle();
assert.equal(simNight.night.active, true, 'Madrugada inicia ativa');
assert.equal(simNight.night.current.id, NIGHT_PHASES[0].id, 'Inicia na fase 03:45');

const seenPhases = new Set([simNight.night.current.id]);
const totalNightSec = NIGHT_PHASES.reduce((a, p) => a + p.durationSec, 0);
const steps = Math.ceil((totalNightSec + 2) * 60);

for (let i = 0; i < steps; i++) {
  simNight.advance(1 / 60);
  if (simNight.night.current) seenPhases.add(simNight.night.current.id);
}

assert.equal(seenPhases.size, NIGHT_PHASES.length, 'Todas as 6 fases da madrugada foram percorridas');
assert.equal(simNight.night.active, false, 'Madrugada encerra automaticamente após 05:40');
assert.equal(simNight.night.completedRuns, 1, 'Registra 1 ciclo completo de madrugada');
assert.ok(simNight.counters.dataformWorkflows >= 6, 'Executa os 6 workflows Dataform na madrugada');

console.log('OK — todas as verificações de catálogo, determinismo e ciclo da madrugada passaram.');
