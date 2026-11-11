// Visão 2 — Diagrama de Arquitetura 2D Integrada e Animada (Zero sobreposição):
// Estrutura de arquitetura corporativa:
// [1. Ambiente Sanepar (Fontes)] ---> [Barramento Gateway DHuO] ---> [2. Plataforma Google Cloud: (Topo Transversal: Dataform & Parâmetros) + (Fluxo Medallion: 2.1 Ingestão -> 2.2 RAW -> 2.3 Trusted -> 2.4 Refined)] ---> [3. Consumo Analítico (Looker)]
import { LAKEHOUSE_NODES, LAKEHOUSE_LINKS } from '../content/catalog.js';

const NS = 'http://www.w3.org/2000/svg';

const KIND_HEX = {
  hot: '#2edce6',
  batch: '#e3a04a',
  gov: '#bba0e2',
  use: '#c51b88',
};

const NODE_META = {
  src_historian: { color: '#7ea865', tag: 'OT / SCADA' },
  src_cadastros: { color: '#7ea865', tag: 'Corporativo & GIS' },
  dhuo_gw: { color: '#c51b88', tag: 'API Gateway · Produção', isHub: true },
  ing_quente: { color: '#e3a04a', tag: 'Streaming 120s + Job 1m' },
  ing_reconciliacao: { color: '#e3a04a', tag: 'Backfill 03:45 / 04:45' },
  ing_cadastros: { color: '#e3a04a', tag: 'Jobs Diários 05:00–05:20' },
  gov_dataform: { color: '#bba0e2', tag: 'Dataform · 40 Assertions' },
  ref_parametros: { color: '#5c8df6', tag: 'Regras · 05:35' },
  raw_gcs: { color: '#8fa3bd', tag: 'GCS + Iceberg · 59 GB' },
  raw_cadastro_org_op: { color: '#8fa3bd', tag: '10 Tabelas Iceberg' },
  raw_geo: { color: '#8fa3bd', tag: '12 Camadas Iceberg' },
  tru_telemetria: { color: '#2edce6', tag: '2,18 bi leituras · 275 GB' },
  tru_cadastro_geo: { color: '#2edce6', tag: 'SCD2 + 12 Geo · 05:30' },
  ref_pressao: { color: '#5c8df6', tag: 'Produto D4 · 05:40' },
  ref_energia: { color: '#5c8df6', tag: 'Produto D6 · 05:40' },
  use_d0: { color: '#c51b88', tag: 'Looker · Executivo' },
  use_d4: { color: '#c51b88', tag: 'Looker · Rede (D4)' },
  use_d6: { color: '#c51b88', tag: 'Looker · Energia (D6)' },
};

export class PlatformDiagram2D {
  constructor(stageEl, sim, { onSelectItem = () => {} } = {}) {
    this.stageEl = stageEl;
    this.sim = sim;
    this.onSelectItem = onSelectItem;

    this.nodeEls = {};
    this.linkEls = {};
    this.pktEls = [];
    this.visible = false;
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

    // Cabeçalho compacto com legenda de fluxos
    const header = document.createElement('div');
    header.className = 'arch2d-header';
    header.innerHTML = `
      <div class="a2h-left">
        <span class="a2h-tag">DIAGRAMA DE ARQUITETURA INTEGRADA · SANEPAR → GATEWAY DHuO → GCP LAKEHOUSE → LOOKER</span>
      </div>
      <div class="a2h-legend">
        <span><i style="background:#2edce6"></i>Caminho Quente (120 s / 1 min)</span>
        <span><i style="background:#e3a04a"></i>Batch & Reconciliação (03:45–05:20)</span>
        <span><i style="background:#bba0e2"></i>Dataform & 40 Regras (05:30–05:40)</span>
        <span><i style="background:#c51b88"></i>Consumo Looker (D0 / D4 / D6)</span>
      </div>
    `;
    this.root.appendChild(header);

    // Palco principal (CSS Grid de 4 macro-blocos + SVG overlay para setas e partículas)
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

    // === Layout estruturado em 4 Macro-Domínios (sem sobreposição!) ===
    const layoutGrid = document.createElement('div');
    layoutGrid.className = 'arch2d-domains';

    // 1. Domínio Ambiente Sanepar (Fontes)
    const domSanepar = document.createElement('section');
    domSanepar.className = 'arch2d-domain';
    domSanepar.style.setProperty('--dom-color', '#7ea865');
    domSanepar.innerHTML = `
      <header class="ad-head">
        <strong>1 · AMBIENTE SANEPAR</strong>
        <span>Fontes OT / SCADA & Sistemas</span>
      </header>
    `;
    const saneparBody = document.createElement('div');
    saneparBody.className = 'ad-body around';
    saneparBody.append(
      this._makeNodeCard('src_historian'),
      this._makeNodeCard('src_cadastros')
    );
    domSanepar.appendChild(saneparBody);

    // 2. Barramento Central: Gateway DHuO (entre Fontes Sanepar e Ingestão GCP)
    const domDhuo = document.createElement('section');
    domDhuo.className = 'arch2d-domain dhuo-bridge';
    domDhuo.style.setProperty('--dom-color', '#c51b88');
    domDhuo.innerHTML = `
      <header class="ad-head">
        <strong>BARRAMENTO DHuO</strong>
        <span>Fronteira única Sanepar ↔ GCP</span>
      </header>
    `;
    const dhuoBody = document.createElement('div');
    dhuoBody.className = 'ad-body center';
    dhuoBody.appendChild(this._makeNodeCard('dhuo_gw'));
    domDhuo.appendChild(dhuoBody);

    // 3. Domínio Plataforma Google Cloud (southamerica-east1)
    const domGcp = document.createElement('section');
    domGcp.className = 'arch2d-domain gcp-domain';
    domGcp.style.setProperty('--dom-color', '#2edce6');
    domGcp.innerHTML = `
      <header class="ad-head">
        <strong>2 · PLATAFORMA GOOGLE CLOUD (southamerica-east1)</strong>
        <span>Ingestão Serverless · Lakehouse Medallion (RAW Iceberg → Trusted → Refined) · Governança Dataform</span>
      </header>
    `;

    const gcpContent = document.createElement('div');
    gcpContent.className = 'gcp-interior';

    // 3A. Faixa Superior Transversal no GCP: Orquestração Dataform & Parâmetros de Negócio
    const govBar = document.createElement('div');
    govBar.className = 'gcp-gov-bar';
    govBar.innerHTML = `<span class="ggb-label">2.0 Governança, Qualidade & Parâmetros Transversais</span>`;
    const govNodes = document.createElement('div');
    govNodes.className = 'ggb-nodes';
    govNodes.append(
      this._makeNodeCard('gov_dataform'),
      this._makeNodeCard('ref_parametros')
    );
    govBar.appendChild(govNodes);
    gcpContent.appendChild(govBar);

    // 3B. Fluxo Medallion Horizontal (4 Sub-regiões lado a lado: Ingestão | RAW | Trusted | Refined)
    const stagesRow = document.createElement('div');
    stagesRow.className = 'gcp-stages-row';

    const gcpStages = [
      {
        title: '2.1 Ingestão & Agendamento',
        color: '#e3a04a',
        nodes: ['ing_quente', 'ing_reconciliacao', 'ing_cadastros'],
      },
      {
        title: '2.2 Camada RAW (Iceberg)',
        color: '#8fa3bd',
        nodes: ['raw_gcs', 'raw_cadastro_org_op', 'raw_geo'],
      },
      {
        title: '2.3 Camada Trusted (BQ)',
        color: '#2edce6',
        nodes: ['tru_telemetria', 'tru_cadastro_geo'],
      },
      {
        title: '2.4 Camada Refined (Produtos)',
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
      boxEl.appendChild(listEl);
      stagesRow.appendChild(boxEl);
    }

    gcpContent.appendChild(stagesRow);
    domGcp.appendChild(gcpContent);

    // 4. Domínio Consumo Analítico (Looker)
    const domConsumo = document.createElement('section');
    domConsumo.className = 'arch2d-domain';
    domConsumo.style.setProperty('--dom-color', '#c51b88');
    domConsumo.innerHTML = `
      <header class="ad-head">
        <strong>3 · CONSUMO ANALÍTICO</strong>
        <span>Painéis Estratégicos Looker</span>
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

  setVisible(v) {
    const vis = !!v;
    this.visible = vis;
    this.root.hidden = !vis;
    if (vis) {
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
    if (!this.visible) return;
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
        // Dataform desce para Trusted Cadastro
        const x1 = a.cx;
        const y1 = a.bottom;
        const x2 = b.cx - b.w * 0.2;
        const y2 = b.top;
        const my = (y1 + y2) / 2;
        d = `M ${x1} ${y1} C ${x1} ${my}, ${x2} ${my}, ${x2} ${y2}`;
      } else if (l.def.from === 'ref_parametros') {
        // Parâmetros descem da barra superior para os produtos Refined
        const x1 = a.cx;
        const y1 = a.bottom;
        const x2 = b.cx;
        const y2 = b.top;
        const my = (y1 + y2) / 2;
        d = `M ${x1} ${y1} C ${x1} ${my}, ${x2} ${my}, ${x2} ${y2}`;
      } else if (l.def.id === 'quente-tru') {
        // Atalho streaming Dataflow -> Trusted Telemetria passando suavemente acima do card raw_gcs
        const x1 = a.right;
        const y1 = a.top + a.h * 0.3;
        const x2 = b.left;
        const y2 = b.top + b.h * 0.3;
        const liftY = Math.min(y1, y2) - 18;
        d = `M ${x1} ${y1} C ${x1 + 50} ${liftY}, ${x2 - 50} ${liftY}, ${x2} ${y2}`;
      } else {
        // Fluxo natural esquerda -> direita entre componentes
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
    if (!this.visible) return;
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
