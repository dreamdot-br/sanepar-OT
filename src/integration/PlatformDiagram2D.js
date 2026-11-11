// Visão 2 — Plataforma de Dados (Lakehouse GCP) atualizada 100% com "Inventário Lakehouse SANEPAR 2.html":
// - Placar oficial dos 8 indicadores (6 fontes, 25 RAW, 20 Trusted, 25 Refined, 40 regras, 8 jobs, 16 agendamentos, 7 secrets)
// - Sub-aba 1: Diagrama de Arquitetura Integrada e Animada (sem sobreposição, com os 5 pilares transversais)
// - Sub-aba 2: Catálogo de Objetos & Camadas Transversais (pesquisa instantânea nos objetos reais do GCP)
// - Sub-aba 3: Relógio da Operação (3 coletores contínuos + linha do tempo SVG das 03:30 às 06:00 com os 14 agendamentos)
import {
  LAKEHOUSE_NODES,
  LAKEHOUSE_LINKS,
  INVENTORY_SCORE,
  INVENTORY_PULSES,
  INVENTORY_CROSS_PILLARS,
} from '../content/catalog.js';

const NS = 'http://www.w3.org/2000/svg';

const KIND_HEX = {
  hot: '#2edce6',
  batch: '#e3a04a',
  gov: '#bba0e2',
  use: '#c51b88',
};

const NODE_META = {
  src_historian: { color: '#7ea865', tag: 'OT / SCADA · 2 Parques' },
  src_cadastros: { color: '#7ea865', tag: 'BORG · BOPE · SDOA · ArcGIS' },
  dhuo_gw: { color: '#c51b88', tag: 'Gateway DHuO · Produção', isHub: true },
  ing_quente: { color: '#e3a04a', tag: 'Dataflow 120s + 2 Jobs (1m/10m)' },
  ing_reconciliacao: { color: '#e3a04a', tag: 'cr-telemetria-backfill · 4 sch-*' },
  ing_cadastros: { color: '#e3a04a', tag: '4 Jobs Diários + 4 sch-*' },
  gov_dataform: { color: '#bba0e2', tag: 'Dataform (6 wf-*) + 40 Assertions' },
  ref_parametros: { color: '#5c8df6', tag: 'ds_..._refined_parametro · 05:35' },
  raw_gcs: { color: '#8fa3bd', tag: 'GCS (12 pastas) + 5 tb_* Telemetria' },
  raw_cadastro_org_op: { color: '#8fa3bd', tag: 'cadastro (2) + org (4) + op (4)' },
  raw_geo: { color: '#8fa3bd', tag: 'ds_org_sanepar_raw_geo · 12 tb_*' },
  tru_telemetria: { color: '#2edce6', tag: 'ds_..._trusted_telemetria · 4 obj' },
  tru_cadastro_geo: { color: '#2edce6', tag: 'cadastro SCD2 (4) + geo (12)' },
  ref_pressao: { color: '#5c8df6', tag: 'pressao D4 (4) + mapas (5)' },
  ref_energia: { color: '#5c8df6', tag: 'ds_..._refined_energia · 8 obj' },
  use_d0: { color: '#c51b88', tag: 'Looker · Mapas & Ciclo' },
  use_d4: { color: '#c51b88', tag: 'Looker · Painel D4 Pressão' },
  use_d6: { color: '#c51b88', tag: 'Looker · Painel D6 Energia' },
};

const CLOCK_LANES = [
  [
    'Reconciliação (Ingestão)',
    '#e3a04a',
    [
      ['sch-telemetria-rec-terceiros-busca', '03:45'],
      ['sch-telemetria-rec-proprio-busca', '03:45'],
      ['sch-telemetria-rec-terceiros-carga', '04:45'],
      ['sch-telemetria-rec-proprio-carga', '04:45'],
    ],
  ],
  [
    'Cadastros → RAW (Iceberg)',
    '#8fa3bd',
    [
      ['sch-metadata-discovery-daily', '05:00'],
      ['sch-cadastro-borg-daily', '05:10'],
      ['sch-arcgis-geo-daily', '05:10'],
      ['sch-cadastro-operacional-daily', '05:20'],
    ],
  ],
  [
    'Trusted (Dataform)',
    '#2edce6',
    [
      ['wf-sanepar-trusted-cadastro', '05:30'],
      ['wf-sanepar-trusted-geo', '05:30'],
    ],
  ],
  [
    'Refined (Dataform)',
    '#5c8df6',
    [
      ['wf-sanepar-refined-parametro', '05:35'],
      ['wf-sanepar-refined-pressao-dia', '05:40'],
      ['wf-sanepar-refined-geo', '05:40'],
      ['wf-sanepar-refined-energia-dia', '05:40'],
    ],
  ],
];

export class PlatformDiagram2D {
  constructor(stageEl, sim, { onSelectItem = () => {} } = {}) {
    this.stageEl = stageEl;
    this.sim = sim;
    this.onSelectItem = onSelectItem;

    this.nodeEls = {};
    this.linkEls = {};
    this.pktEls = [];
    this.visible = false;
    this.subTab = 'arquitetura'; // 'arquitetura' | 'catalogo' | 'relogio'
    this._needsLayout = true;

    this._buildDOM();

    this.ro = new ResizeObserver(() => {
      this._needsLayout = true;
    });
    this.ro.observe(this.root);
  }

  _makeNodeCard(nodeId) {
    const def = LAKEHOUSE_NODES[nodeId];
    const meta = NODE_META[nodeId] || { color: '#2edce6', tag: 'GCP' };
    const card = document.createElement('button');
    card.type = 'button';
    card.className = `arch2d-node ${def.accent === 'pink' ? 'pink' : ''} ${meta.isHub ? 'hub-node' : ''}`;
    card.dataset.nodeId = nodeId;
    card.style.setProperty('--node-color', meta.color);

    card.innerHTML = `
      <div class="a2n-chip-row">
        <span class="a2n-tag">${meta.tag}</span>
        <span class="a2n-badge">${def.badge}</span>
      </div>
      <div class="a2n-top">
        <span class="a2n-dot"></span>
        <strong>${def.title}</strong>
      </div>
      <p class="a2n-sub">${def.sub}</p>
    `;

    card.addEventListener('click', (e) => {
      e.stopPropagation();
      this.onSelectItem('lakehouse', nodeId);
    });

    this.nodeEls[nodeId] = card;
    return card;
  }

  _buildDOM() {
    this.root = document.createElement('div');
    this.root.className = 'arch2d-view';
    this.root.hidden = true;

    // 1. Barra superior: Placar Oficial de 8 KPIs do Inventário + Sub-abas da Frente 2
    const topBar = document.createElement('div');
    topBar.className = 'arch2d-topbar';

    const scoreStrip = document.createElement('div');
    scoreStrip.className = 'arch2d-score-strip';
    scoreStrip.innerHTML = INVENTORY_SCORE.map(
      (s) => `
      <div class="a2s-item">
        <i style="background:${s.color}"></i>
        <b>${s.num}</b>
        <span>${s.label}</span>
      </div>
    `
    ).join('');

    const subTabs = document.createElement('div');
    subTabs.className = 'arch2d-subtabs';
    const tabDefs = [
      ['arquitetura', 'A · Arquitetura Animada'],
      ['catalogo', 'B · Catálogo & Transversais (GCP)'],
      ['relogio', 'C · Relógio da Operação (03:45→05:40)'],
    ];
    this.subTabBtns = {};
    for (const [id, label] of tabDefs) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'a2-tab-btn';
      btn.setAttribute('aria-pressed', String(this.subTab === id));
      btn.textContent = label;
      btn.addEventListener('click', () => this.setSubTab(id));
      subTabs.appendChild(btn);
      this.subTabBtns[id] = btn;
    }

    topBar.append(scoreStrip, subTabs);
    this.root.appendChild(topBar);

    // =========================================================================
    // PAINEL A: Diagrama de Arquitetura Integrada e Animada
    // =========================================================================
    this.board = document.createElement('div');
    this.board.className = 'arch2d-canvas';

    this.svg = document.createElementNS(NS, 'svg');
    this.svg.setAttribute('class', 'arch2d-svg');

    const defs = document.createElementNS(NS, 'defs');
    for (const [k, hex] of Object.entries(KIND_HEX)) {
      const marker = document.createElementNS(NS, 'marker');
      marker.setAttribute('id', `arrow-${k}`);
      marker.setAttribute('viewBox', '0 0 10 10');
      marker.setAttribute('refX', '8');
      marker.setAttribute('refY', '5');
      marker.setAttribute('markerWidth', '5.5');
      marker.setAttribute('markerHeight', '5.5');
      marker.setAttribute('orient', 'auto-start-reverse');
      const p = document.createElementNS(NS, 'path');
      p.setAttribute('d', 'M 0 1.5 L 9 5 L 0 8.5 z');
      p.setAttribute('fill', hex);
      marker.appendChild(p);
      defs.appendChild(marker);
    }
    this.svg.appendChild(defs);

    this.linksGroup = document.createElementNS(NS, 'g');
    this.pktsGroup = document.createElementNS(NS, 'g');
    this.svg.append(this.linksGroup, this.pktsGroup);
    this.board.appendChild(this.svg);

    const layoutGrid = document.createElement('div');
    layoutGrid.className = 'arch2d-domains';

    // Domínio 1: Fontes Sanepar
    const domSanepar = document.createElement('section');
    domSanepar.className = 'arch2d-domain';
    domSanepar.style.setProperty('--dom-color', '#7ea865');
    domSanepar.innerHTML = `
      <header class="ad-head">
        <strong>1 · FONTES SANEPAR (6)</strong>
        <span>2 Historians + 4 Cadastros/GIS</span>
      </header>
    `;
    const saneparBody = document.createElement('div');
    saneparBody.className = 'ad-body around';
    saneparBody.append(
      this._makeNodeCard('src_historian'),
      this._makeNodeCard('src_cadastros')
    );
    domSanepar.appendChild(saneparBody);

    // Barramento Central: Gateway DHuO
    const domDhuo = document.createElement('section');
    domDhuo.className = 'arch2d-domain dhuo-bridge';
    domDhuo.style.setProperty('--dom-color', '#c51b88');
    domDhuo.innerHTML = `
      <header class="ad-head">
        <strong>GATEWAY DHuO</strong>
        <span>Produção · Fronteira Sanepar ↔ GCP</span>
      </header>
    `;
    const dhuoBody = document.createElement('div');
    dhuoBody.className = 'ad-body center';
    dhuoBody.appendChild(this._makeNodeCard('dhuo_gw'));
    domDhuo.appendChild(dhuoBody);

    // Domínio 2: Plataforma Google Cloud (sanepar-dhuo-nonprd)
    const domGcp = document.createElement('section');
    domGcp.className = 'arch2d-domain gcp-domain';
    domGcp.style.setProperty('--dom-color', '#2edce6');
    domGcp.innerHTML = `
      <header class="ad-head">
        <div class="ad-head-row">
          <strong>2 · PLATAFORMA GOOGLE CLOUD · sanepar-dhuo-nonprd (southamerica-east1)</strong>
          <div class="a2h-legend">
            <span><i style="background:#2edce6"></i>Caminho Quente (120s/1min)</span>
            <span><i style="background:#e3a04a"></i>Batch & Backfill (03:45–05:20)</span>
            <span><i style="background:#bba0e2"></i>Dataform & 40 Regras (05:30–05:40)</span>
            <span><i style="background:#c51b88"></i>Consumo Looker</span>
          </div>
        </div>
        <span>RAW em Apache Iceberg (catálogo BigLake) · Trusted (20 obj) e Refined (25 obj) em BigQuery nativo · 7 imagens Artifact Registry · 3 repos GitLab</span>
      </header>
    `;

    const gcpContent = document.createElement('div');
    gcpContent.className = 'gcp-interior';

    // Barra Superior Transversal no GCP
    const govBar = document.createElement('div');
    govBar.className = 'gcp-gov-bar';
    govBar.innerHTML = `
      <div class="ggb-meta">
        <span class="ggb-label">ATRAVESSA TODAS AS CAMADAS</span>
        <small>Dataform (2 releases + 6 wf-*) · 40 Assertions (ds_org_sanepar_governance) · 7 Secrets (sm_*) · 7 Imagens (Artifact Registry) · 3 Repos GitLab</small>
      </div>
    `;
    const govNodes = document.createElement('div');
    govNodes.className = 'ggb-nodes';
    govNodes.append(
      this._makeNodeCard('gov_dataform'),
      this._makeNodeCard('ref_parametros')
    );
    govBar.appendChild(govNodes);
    gcpContent.appendChild(govBar);

    // 4 Estágios Medallion
    const stagesRow = document.createElement('div');
    stagesRow.className = 'gcp-stages-row';

    const gcpStages = [
      {
        title: '2.1 Ingestão (8 Jobs + 10 sch-*)',
        foot: 'Grava Parquet e Iceberg sem regra',
        color: '#e3a04a',
        nodes: ['ing_quente', 'ing_reconciliacao', 'ing_cadastros'],
      },
      {
        title: '2.2 RAW (25 tb_* Iceberg + GCS)',
        foot: 'Dataflow grava Trusted direto; resto às 05:30',
        color: '#8fa3bd',
        nodes: ['raw_gcs', 'raw_cadastro_org_op', 'raw_geo'],
      },
      {
        title: '2.3 Trusted (20 Objetos BQ)',
        foot: 'Dataform aplica regras às 05:35 e 05:40',
        color: '#2edce6',
        nodes: ['tru_telemetria', 'tru_cadastro_geo'],
      },
      {
        title: '2.4 Refined (25 Objetos BQ)',
        foot: 'Os painéis leem só a Refined',
        color: '#5c8df6',
        nodes: ['ref_pressao', 'ref_energia'],
      },
    ];

    for (const st of gcpStages) {
      const boxEl = document.createElement('div');
      boxEl.className = 'gcp-stage-box';
      boxEl.style.setProperty('--st-color', st.color);
      boxEl.innerHTML = `<div class="gsb-title">${st.title}</div>`;
      const listEl = document.createElement('div');
      listEl.className = 'gsb-nodes';
      for (const nid of st.nodes) {
        listEl.appendChild(this._makeNodeCard(nid));
      }
      const footEl = document.createElement('div');
      footEl.className = 'gsb-foot';
      footEl.textContent = st.foot;
      boxEl.append(listEl, footEl);
      stagesRow.appendChild(boxEl);
    }

    gcpContent.appendChild(stagesRow);
    domGcp.appendChild(gcpContent);

    // Domínio 3: Consumo Looker
    const domConsumo = document.createElement('section');
    domConsumo.className = 'arch2d-domain';
    domConsumo.style.setProperty('--dom-color', '#c51b88');
    domConsumo.innerHTML = `
      <header class="ad-head">
        <strong>3 · CONSUMO LOOKER</strong>
        <span>Painéis, Séries & 5 Mapas</span>
      </header>
    `;
    const consumoBody = document.createElement('div');
    consumoBody.className = 'ad-body around';
    consumoBody.append(
      this._makeNodeCard('use_d0'),
      this._makeNodeCard('use_d4'),
      this._makeNodeCard('use_d6')
    );
    domConsumo.appendChild(consumoBody);

    layoutGrid.append(domSanepar, domDhuo, domGcp, domConsumo);
    this.board.appendChild(layoutGrid);
    this.root.appendChild(this.board);

    this.board.addEventListener('click', () => {
      this.onSelectItem(null, null);
    });

    // =========================================================================
    // PAINEL B: Catálogo de Objetos & 5 Pilares Transversais (Inventário GCP)
    // =========================================================================
    this.catalogPane = document.createElement('div');
    this.catalogPane.className = 'arch2d-subpane';
    this.catalogPane.hidden = true;
    this._buildCatalogPane();
    this.root.appendChild(this.catalogPane);

    // =========================================================================
    // PAINEL C: Relógio da Operação (Contínuo + Madrugada 03:30 → 06:00)
    // =========================================================================
    this.clockPane = document.createElement('div');
    this.clockPane.className = 'arch2d-subpane';
    this.clockPane.hidden = true;
    this._buildClockPane();
    this.root.appendChild(this.clockPane);

    this.stageEl.appendChild(this.root);

    // Cria paths SVG para todas as ligações
    for (const def of LAKEHOUSE_LINKS) {
      const p = document.createElementNS(NS, 'path');
      p.setAttribute('fill', 'none');
      p.setAttribute('stroke', KIND_HEX[def.kind] || '#2edce6');
      p.setAttribute('stroke-width', def.kind === 'hot' || def.kind === 'use' ? '2.1' : '1.5');
      p.setAttribute('marker-end', `url(#arrow-${def.kind})`);
      if (def.kind !== 'hot') {
        p.setAttribute('stroke-dasharray', '5 4');
      }
      p.setAttribute('class', `arch2d-link kind-${def.kind}`);
      this.linksGroup.appendChild(p);
      this.linkEls[def.id] = { def, pathEl: p, len: 1 };
    }

    for (let i = 0; i < 65; i++) {
      const c = document.createElementNS(NS, 'circle');
      c.setAttribute('r', '4.4');
      c.setAttribute('class', 'arch2d-pkt');
      c.style.display = 'none';
      this.pktsGroup.appendChild(c);
      this.pktEls.push(c);
    }
  }

  _buildCatalogPane() {
    const crossHtml = INVENTORY_CROSS_PILLARS.map(
      (p) => `
      <div class="inv-cross-card" style="--p-color:${p.color}">
        <div class="icc-head">
          <strong>${p.title}</strong>
          <span>${p.count}</span>
        </div>
        <div class="icc-sub">${p.sub}</div>
        <ul>
          ${p.items.map((it) => `<li>${it}</li>`).join('')}
        </ul>
      </div>
    `
    ).join('');

    const nodesHtml = Object.values(LAKEHOUSE_NODES)
      .map(
        (n) => `
      <div class="inv-node-box" data-search="${[n.title, n.sub, ...(n.objects || [])].join(' ').toLowerCase()}">
        <div class="inb-head">
          <strong>${n.title}</strong>
          <span>${n.badge}</span>
        </div>
        <div class="inb-sub">${n.sub}</div>
        <ul>
          ${(n.objects || []).map((o) => `<li><code>${o}</code></li>`).join('')}
        </ul>
      </div>
    `
      )
      .join('');

    this.catalogPane.innerHTML = `
      <div class="inv-pane-scroll">
        <div class="inv-section-head">
          <div>
            <h3>Atravessa todas as camadas (Orquestração, Qualidade, Segurança, Imagens e Código)</h3>
            <p>Componentes transversais lidos do GCP em 26/10/2026 (projeto <code>sanepar-dhuo-nonprd</code> + gateway DHuO de produção).</p>
          </div>
          <input type="search" class="inv-search" placeholder="Filtrar objeto (ex.: energia, scd2, 05:40, sm_, cr-)..." />
        </div>
        <div class="inv-cross-grid">${crossHtml}</div>
        <div class="inv-section-head" style="margin-top:12px">
          <div>
            <h3>Catálogo detalhado de objetos por componente (ds_ · tb_ · ft_ · dm_ · vw_ · pm_ · cr- · sch- · wf-)</h3>
          </div>
        </div>
        <div class="inv-nodes-grid">${nodesHtml}</div>
      </div>
    `;

    const input = this.catalogPane.querySelector('.inv-search');
    const boxes = [...this.catalogPane.querySelectorAll('.inv-node-box')];
    input.addEventListener('input', () => {
      const q = input.value.trim().toLowerCase();
      for (const b of boxes) {
        b.hidden = q.length > 0 && !b.dataset.search.includes(q);
      }
    });
  }

  _buildClockPane() {
    const pulsesHtml = INVENTORY_PULSES.map(
      (p) => `
      <div class="inv-pulse-card" style="--p-color:${p.color}">
        <div class="ipc-top">
          <strong>${p.title}</strong>
          <b>${p.freq}</b>
        </div>
        <code>${p.name}</code>
        <small>${p.detail}</small>
      </div>
    `
    ).join('');

    // Gera SVG da linha do tempo das 03:30 às 06:00 (fiel ao Inventário 2.html)
    const W = 1000;
    const X0 = 310;
    const X1 = 965;
    const T0 = 210; // 03:30
    const T1 = 360; // 06:00
    const xOf = (hm) => {
      const [h, m] = hm.split(':').map(Number);
      return X0 + ((h * 60 + m - T0) / (T1 - T0)) * (X1 - X0);
    };
    const RH = 22;
    let y = 38;
    let gridSvg = '';
    for (let t = T0; t <= T1; t += 15) {
      const hm = `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`;
      const xx = xOf(hm);
      const major = t % 30 === 0;
      gridSvg += `<line x1="${xx}" x2="${xx}" y1="26" y2="430" stroke="#253142" stroke-width="${major ? 1 : 0.6}" ${major ? '' : 'stroke-dasharray="2 4"'} />`;
      if (major) {
        gridSvg += `<text x="${xx}" y="18" text-anchor="middle" font-size="11.5" fill="#9ba7b8" font-family="monospace">${hm}</text>`;
      }
    }

    let rowsSvg = '';
    for (const [lane, color, evs] of CLOCK_LANES) {
      const h = evs.length * RH + 24;
      rowsSvg += `<rect x="8" y="${y}" width="${W - 16}" height="${h - 5}" rx="5" fill="#131c28" opacity="0.88" />`;
      rowsSvg += `<rect x="8" y="${y}" width="4" height="${h - 5}" rx="2" fill="${color}" />`;
      rowsSvg += `<text x="20" y="${y + 15}" font-size="11" font-weight="700" fill="${color}" letter-spacing="0.04em">${lane.toUpperCase()}</text>`;
      let yy = y + 22;
      for (const [name, hm] of evs) {
        const cy = yy + RH / 2 - 2;
        const xx = xOf(hm);
        rowsSvg += `<text x="20" y="${cy + 4}" font-size="11" fill="#e6eef8" font-family="monospace">${name}</text>`;
        rowsSvg += `<line x1="${X0 - 6}" x2="${xx - 7}" y1="${cy}" y2="${cy}" stroke="#253142" stroke-width="1" />`;
        rowsSvg += `<circle cx="${xx}" cy="${cy}" r="5.5" fill="${color}" />`;
        rowsSvg += `<text x="${xx + 10}" y="${cy + 4}" font-size="10.5" fill="#9ba7b8" font-family="monospace">${hm}</text>`;
        yy += RH;
      }
      y += h + 4;
    }

    const finalSvg = `<svg viewBox="0 0 ${W} ${y + 8}" class="inv-clock-svg">${gridSvg.replace(/y2="430"/g, `y2="${y}"`)}${rowsSvg}</svg>`;

    this.clockPane.innerHTML = `
      <div class="inv-pane-scroll">
        <div class="inv-pulse-grid">${pulsesHtml}</div>
        <div class="inv-clock-box">${finalSvg}</div>
        <div class="inv-clock-notes">
          <div style="--c:#e3a04a"><b>03:45 → 04:45 · Reconciliação.</b> Relê os últimos 3 dias dos dois parques e grava só o que faltou. Termina 45 min antes de qualquer cálculo.</div>
          <div style="--c:#8fa3bd"><b>05:00 → 05:20 · Cadastros.</b> Tags e equipamentos, estrutura organizacional (BORG), geografia (ArcGIS) e unidades operacionais (BOPE + SDOA) chegam à RAW.</div>
          <div style="--c:#2edce6"><b>05:30 · Trusted.</b> Histórico de cadastro (versões SCD2) e 12 camadas geográficas tipadas, já com o retrato do dia.</div>
          <div style="--c:#5c8df6"><b>05:35 → 05:40 · Refined.</b> Primeiro os parâmetros de regra de negócio (05:35); depois pressão (D4), geografia para mapas e energia (D6) às 05:40.</div>
        </div>
      </div>
    `;
  }

  setSubTab(id) {
    this.subTab = id;
    for (const [k, btn] of Object.entries(this.subTabBtns)) {
      btn.setAttribute('aria-pressed', String(k === id));
    }
    this.board.hidden = id !== 'arquitetura';
    this.catalogPane.hidden = id !== 'catalogo';
    this.clockPane.hidden = id !== 'relogio';
    if (id === 'arquitetura') {
      this._needsLayout = true;
      requestAnimationFrame(() => this._recomputePaths());
    }
  }

  setVisible(v) {
    const vis = !!v;
    this.visible = vis;
    this.root.hidden = !vis;
    if (vis && this.subTab === 'arquitetura') {
      this._needsLayout = true;
      requestAnimationFrame(() => this._recomputePaths());
    }
  }

  setHighlight(id) {
    for (const [k, el] of Object.entries(this.nodeEls)) {
      el.classList.toggle('selected', k === id);
    }
  }

  _recomputePaths() {
    if (!this.visible || this.subTab !== 'arquitetura') return;
    const bRect = this.board.getBoundingClientRect();
    if (bRect.width < 10 || bRect.height < 10) return;

    this.svg.setAttribute('viewBox', `0 0 ${bRect.width} ${bRect.height}`);

    const rects = {};
    for (const [id, el] of Object.entries(this.nodeEls)) {
      const r = el.getBoundingClientRect();
      rects[id] = {
        left: r.left - bRect.left,
        right: r.right - bRect.left,
        top: r.top - bRect.top,
        bottom: r.bottom - bRect.top,
        cx: r.left - bRect.left + r.width / 2,
        cy: r.top - bRect.top + r.height / 2,
        w: r.width,
        h: r.height,
      };
    }

    for (const l of Object.values(this.linkEls)) {
      const a = rects[l.def.from];
      const b = rects[l.def.to];
      if (!a || !b) continue;

      let d;
      if (l.def.from === 'gov_dataform' && l.def.to === 'tru_cadastro_geo') {
        const x1 = a.cx;
        const y1 = a.bottom;
        const x2 = b.cx - b.w * 0.2;
        const y2 = b.top;
        const my = (y1 + y2) / 2;
        d = `M ${x1} ${y1} C ${x1} ${my}, ${x2} ${my}, ${x2} ${y2}`;
      } else if (l.def.from === 'ref_parametros') {
        const x1 = a.cx;
        const y1 = a.bottom;
        const x2 = b.cx;
        const y2 = b.top;
        const my = (y1 + y2) / 2;
        d = `M ${x1} ${y1} C ${x1} ${my}, ${x2} ${my}, ${x2} ${y2}`;
      } else if (l.def.id === 'quente-tru') {
        const x1 = a.right;
        const y1 = a.top + a.h * 0.3;
        const x2 = b.left;
        const y2 = b.top + b.h * 0.3;
        const liftY = Math.min(y1, y2) - 18;
        d = `M ${x1} ${y1} C ${x1 + 50} ${liftY}, ${x2 - 50} ${liftY}, ${x2} ${y2}`;
      } else {
        const x1 = a.right;
        const y1 = a.cy;
        const x2 = b.left;
        const y2 = b.cy;
        const cDx = Math.max(20, (x2 - x1) * 0.45);
        d = `M ${x1} ${y1} C ${x1 + cDx} ${y1}, ${x2 - cDx} ${y2}, ${x2} ${y2}`;
      }

      l.pathEl.setAttribute('d', d);
      try {
        l.len = Math.max(1, l.pathEl.getTotalLength());
      } catch {
        l.len = 100;
      }
    }
    this._needsLayout = false;
  }

  update() {
    if (!this.visible || this.subTab !== 'arquitetura') return;
    if (this._needsLayout) this._recomputePaths();

    const nightPhase = this.sim.night.active ? this.sim.night.current : null;
    const activeNodes = nightPhase ? new Set(nightPhase.activeNodes) : null;
    const activeLinks = nightPhase ? new Set(nightPhase.activeLinks) : null;

    for (const [id, el] of Object.entries(this.nodeEls)) {
      if (activeNodes) {
        const hit = activeNodes.has(id);
        el.classList.toggle('night-active', hit);
        el.classList.toggle('night-dim', !hit);
      } else {
        el.classList.remove('night-active', 'night-dim');
      }
    }

    for (const [id, l] of Object.entries(this.linkEls)) {
      if (activeLinks) {
        const hit = activeLinks.has(id);
        l.pathEl.classList.toggle('night-active', hit);
        l.pathEl.classList.toggle('night-dim', !hit);
      } else {
        l.pathEl.classList.remove('night-active', 'night-dim');
      }
    }

    const pkts = this.sim.lakePackets;
    for (let i = 0; i < this.pktEls.length; i++) {
      const c = this.pktEls[i];
      const pkt = pkts[i];
      const link = pkt && this.linkEls[pkt.linkId];
      if (!link) {
        c.style.display = 'none';
        continue;
      }
      const dist = Math.min(1, Math.max(0, pkt.t)) * link.len;
      try {
        const pt = link.pathEl.getPointAtLength(dist);
        c.setAttribute('cx', pt.x.toFixed(1));
        c.setAttribute('cy', pt.y.toFixed(1));
        c.setAttribute('fill', KIND_HEX[pkt.kind] || '#2edce6');
        c.style.display = '';
      } catch {
        c.style.display = 'none';
      }
    }
  }
}
