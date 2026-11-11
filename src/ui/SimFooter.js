// Rodapé de contadores da simulação (claramente separados dos dados de inventário) + legenda de fidelidade.
import { FIDELITY } from '../content/catalog.js';
import { h, fmtNum, setText, chip } from './dom.js';

export function createSimFooter(ctx) {
  const host = document.getElementById('sim-footer');

  const valEls = {};
  const makeCounter = (key, label, sub) => {
    const vEl = h('strong', { class: 'sc-val' }, '0');
    valEls[key] = vEl;
    return h('div', { class: 'sc-item' }, vEl, h('span', { class: 'sc-lbl' }, label), sub ? h('small', null, sub) : null);
  };

  const tagUidEl = h('code', { class: 'st-uid' }, '—');
  const tagMetaEl = h('span', { class: 'st-meta' }, '—');

  const leftSim = h(
    'div',
    { class: 'sim-counters' },
    h(
      'div',
      { class: 'sim-badge-box' },
      chip('sim', { label: 'Simulado · Sessão' }),
      h('small', null, 'Fluxo determinístico (não consulta o GCP ao vivo)')
    ),
    makeCounter('sessionReads', 'leituras na sessão', 'proporcional 17,2k + 2,2k tags'),
    makeCounter('cycles', 'ciclos de coleta', 'Dataflow 120s + Job 1min'),
    makeCounter('parquetPendingFiles', 'arquivos Parquet na fila', 'aguardando job 10min'),
    makeCounter('icebergCommits', 'conversões Iceberg', 'cr-iceberg-raw-measures'),
    makeCounter('dataformWorkflows', 'workflows Dataform', 'Trusted + Refined'),
    makeCounter('refinedDeliveries', 'entregas p/ painéis', 'Refined → D0 / D4 / D6'),
    h(
      'div',
      { class: 'sample-tag-box', title: 'Exemplo ilustrativo de pacote percorrendo o pipeline' },
      h('span', { class: 'st-label' }, 'Último pacote (exemplo):'),
      tagUidEl,
      tagMetaEl
    )
  );

  const legend = h(
    'div',
    { class: 'fidelity-legend' },
    Object.keys(FIDELITY).map((k) => chip(k))
  );

  host.append(leftSim, legend);

  return {
    update() {
      const c = ctx.sim.counters;
      setText(valEls.sessionReads, fmtNum(c.sessionReads));
      setText(valEls.cycles, `${fmtNum(c.terceirosCycles)} / ${fmtNum(c.proprioCycles)}`);
      setText(valEls.parquetPendingFiles, fmtNum(c.parquetPendingFiles));
      setText(valEls.icebergCommits, fmtNum(c.icebergCommits));
      setText(valEls.dataformWorkflows, `${fmtNum(c.dataformWorkflows)} (${c.assertionsChecked} as_*)`);
      setText(valEls.refinedDeliveries, fmtNum(c.refinedDeliveries));

      if (c.sampleTag) {
        setText(tagUidEl, `${c.sampleTag.uid} = ${c.sampleTag.valor}`);
        setText(tagMetaEl, `${c.sampleTag.parque} → ${c.sampleTag.dest}`);
      }
    },
  };
}
