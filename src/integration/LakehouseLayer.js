// Cena 2 — Plataforma de Dados (Lakehouse SANEPAR em camadas):
// Fontes & Gateway DHuO -> Ingestão -> RAW (Iceberg) -> Trusted (BigQuery) -> Refined -> Consumo Looker (D0, D4, D6).
import * as THREE from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { Line2 } from 'three/addons/lines/Line2.js';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';
import { LineGeometry } from 'three/addons/lines/LineGeometry.js';
import { COLORS, LAKEHOUSE_BANDS } from '../config.js';
import { LAKEHOUSE_NODES, LAKEHOUSE_LINKS } from '../content/catalog.js';
import { M } from '../scene/materials.js';
import { box, cylinder, at } from '../factory/build.js';

class Path3 {
  constructor(points) {
    this.pts = points;
    this.cum = [0];
    for (let i = 1; i < points.length; i++) {
      this.cum.push(this.cum[i - 1] + points[i].distanceTo(points[i - 1]));
    }
    this.len = this.cum[this.cum.length - 1] || 1;
  }

  at(t, out) {
    const d = Math.min(1, Math.max(0, t)) * this.len;
    let i = 1;
    while (i < this.cum.length - 1 && this.cum[i] < d) i++;
    const seg = this.cum[i] - this.cum[i - 1] || 1;
    return out.lerpVectors(this.pts[i - 1], this.pts[i], (d - this.cum[i - 1]) / seg);
  }
}

const BAND_MAP = Object.fromEntries(LAKEHOUSE_BANDS.map((b) => [b.id, b]));

const KIND_COLOR = {
  hot: COLORS.engCyan,
  batch: 0xe3a04a,
  gov: 0xbba0e2,
  use: COLORS.engPink,
};

export class LakehouseLayer {
  constructor(sm, sim, picking, { onSelectItem = () => {} } = {}) {
    this.sm = sm;
    this.sim = sim;
    this.picking = picking;
    this.onSelectItem = onSelectItem;

    this.group = new THREE.Group();
    this.group.name = 'plataforma_lakehouse';
    this.group.visible = false;
    sm.scene.add(this.group);

    this.nodes = {};
    this.links = {};
    this.lineMats = [];
    this.bandLabels = [];
    this._tmp = new THREE.Vector3();

    this._buildFloorAndBands();
    for (const [id, def] of Object.entries(LAKEHOUSE_NODES)) {
      this._buildNode(id, def);
    }
    for (const def of LAKEHOUSE_LINKS) {
      this._buildLink(def);
    }
    this._buildPacketPool();

    sm.addUpdater((dt) => this.update(dt));
  }

  setVisible(v) {
    const vis = !!v;
    this.group.visible = vis;
    for (const n of Object.values(this.nodes)) {
      n.el.style.display = vis ? '' : 'none';
    }
    for (const el of this.bandLabels) {
      el.style.display = vis ? '' : 'none';
    }
  }

  setHighlight(id) {
    for (const [k, n] of Object.entries(this.nodes)) {
      n.el.classList.toggle('selected', k === id);
    }
  }

  _buildFloorAndBands() {
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(96, 72), M.floor);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.group.add(floor);

    for (const band of LAKEHOUSE_BANDS) {
      const slabMat = new THREE.MeshStandardMaterial({
        color: 0x131b26,
        roughness: 0.8,
        metalness: 0.15,
      });
      const w = band.id === 'src' ? 6.8 : 5.4;
      const xCenter = band.id === 'src' ? -16.1 : band.x;
      const slab = box(w, 0.12, 13.5, slabMat, { cast: false, receive: true });
      at(slab, xCenter, 0.06, 0.2);
      this.group.add(slab);

      // Borda colorida da faixa
      const pts = [
        [xCenter - w / 2, 0.14, -6.55],
        [xCenter + w / 2, 0.14, -6.55],
        [xCenter + w / 2, 0.14, 6.95],
        [xCenter - w / 2, 0.14, 6.95],
        [xCenter - w / 2, 0.14, -6.55],
      ];
      const geo = new LineGeometry();
      geo.setPositions(pts.flat());
      const mat = new LineMaterial({
        color: band.color,
        linewidth: 2.0,
        transparent: true,
        opacity: 0.65,
      });
      const line = new Line2(geo, mat);
      line.computeLineDistances();
      this.lineMats.push(mat);
      this.group.add(line);

      // Rótulo superior da camada
      const el = document.createElement('div');
      el.className = 'band-header';
      el.style.setProperty('--band-color', band.hex);
      el.style.display = 'none';
      el.textContent = band.label;
      const obj = new CSS2DObject(el);
      obj.position.set(xCenter, 0.4, -7.2);
      this.group.add(obj);
      this.bandLabels.push(el);
    }
  }

  _buildNode(id, def) {
    const band = BAND_MAP[def.band] || LAKEHOUSE_BANDS[0];
    const color = def.accent === 'pink' ? COLORS.engPink : band.color;

    const root = new THREE.Group();
    at(root, def.pos[0], def.pos[1], def.pos[2]);

    // Haste até o piso
    const stemH = Math.max(0.2, def.pos[1] - 0.35);
    const stem = cylinder(0.08, 0.12, stemH, M.frame, 12);
    at(stem, 0, -stemH / 2 - 0.2, 0);
    root.add(stem);

    // Bloco 3D do nó
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x16202c,
      emissive: color,
      emissiveIntensity: 0.22,
      roughness: 0.38,
      metalness: 0.35,
    });
    const body = box(2.5, 0.56, 1.35, bodyMat);
    root.add(body);

    // Topo colorido da camada
    const capMat = new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: 0.35,
      roughness: 0.3,
      metalness: 0.2,
    });
    const cap = box(2.54, 0.1, 1.39, capMat);
    at(cap, 0, 0.31, 0);
    root.add(cap);

    this.group.add(root);
    this.picking.register(root, { type: 'lakehouse', id });

    // Rótulo CSS2D clicável
    const el = document.createElement('button');
    el.type = 'button';
    el.className = `arch-node ${def.accent === 'pink' ? 'pink' : ''}`;
    el.style.setProperty('--node-color', def.accent === 'pink' ? '#c51b88' : band.hex);
    el.style.display = 'none';
    el.innerHTML = `
      <span class="an-top"><b>${def.title}</b></span>
      <span class="an-sub">${def.sub}</span>
      <span class="an-badge">${def.badge}</span>
    `;
    el.addEventListener('pointerdown', (e) => e.stopPropagation());
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      this.onSelectItem('lakehouse', id);
    });

    const labelObj = new CSS2DObject(el);
    labelObj.position.set(0, 0.92, 0);
    root.add(labelObj);

    this.nodes[id] = { id, def, root, bodyMat, capMat, el };
  }

  _buildLink(def) {
    const a = new THREE.Vector3(...LAKEHOUSE_NODES[def.from].pos);
    const b = new THREE.Vector3(...LAKEHOUSE_NODES[def.to].pos);
    const mid = a.clone().lerp(b, 0.5);
    mid.y = Math.max(a.y, b.y) + 0.55;

    const pts = [a, mid, b];
    const path = new Path3(pts);

    const color = KIND_COLOR[def.kind] || COLORS.engCyan;
    const geo = new LineGeometry();
    geo.setPositions(pts.flatMap((p) => [p.x, p.y, p.z]));
    const mat = new LineMaterial({
      color,
      linewidth: def.kind === 'hot' || def.kind === 'use' ? 2.4 : 1.8,
      dashed: def.kind !== 'hot',
      dashSize: 0.45,
      gapSize: 0.25,
      transparent: true,
      opacity: 0.78,
    });
    const line = new Line2(geo, mat);
    line.computeLineDistances();
    this.lineMats.push(mat);
    this.group.add(line);

    this.links[def.id] = { def, path, line, mat, baseColor: color };
  }

  _buildPacketPool() {
    const geo = new THREE.SphereGeometry(0.22, 12, 12);
    this.pktMats = {
      hot: M.glowCyan,
      use: M.glowPink,
      batch: new THREE.MeshBasicMaterial({
        color: 0xe3a04a,
        transparent: true,
        opacity: 0.95,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
      gov: new THREE.MeshBasicMaterial({
        color: 0xbba0e2,
        transparent: true,
        opacity: 0.95,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    };
    this.pktMeshes = [];
    for (let i = 0; i < 60; i++) {
      const m = new THREE.Mesh(geo, M.glowCyan);
      m.visible = false;
      this.group.add(m);
      this.pktMeshes.push(m);
    }
  }

  update() {
    const w = this.sm.container.clientWidth;
    const h = this.sm.container.clientHeight;
    for (const m of this.lineMats) m.resolution.set(w, h);

    if (!this.group.visible) return;

    // Destaque de fase quando "Reproduzir madrugada" está ativo
    const nightPhase = this.sim.night.active ? this.sim.night.current : null;
    const activeNodes = nightPhase ? new Set(nightPhase.activeNodes) : null;
    const activeLinks = nightPhase ? new Set(nightPhase.activeLinks) : null;

    for (const [id, n] of Object.entries(this.nodes)) {
      if (activeNodes) {
        const hit = activeNodes.has(id);
        n.el.classList.toggle('night-active', hit);
        n.el.classList.toggle('night-dim', !hit);
        n.bodyMat.emissiveIntensity = hit ? 0.65 : 0.08;
      } else {
        n.el.classList.remove('night-active', 'night-dim');
        n.bodyMat.emissiveIntensity = 0.22;
      }
    }

    for (const [id, l] of Object.entries(this.links)) {
      if (activeLinks) {
        const hit = activeLinks.has(id);
        l.mat.opacity = hit ? 1.0 : 0.2;
        l.mat.linewidth = hit ? 3.2 : 1.4;
      } else {
        l.mat.opacity = 0.78;
        l.mat.linewidth = l.def.kind === 'hot' || l.def.kind === 'use' ? 2.4 : 1.8;
      }
    }

    // Atualiza pacotes em trânsito nas ligações do Lakehouse
    const pkts = this.sim.lakePackets;
    for (let i = 0; i < this.pktMeshes.length; i++) {
      const mesh = this.pktMeshes[i];
      const pkt = pkts[i];
      const link = pkt && this.links[pkt.linkId];
      if (!link) {
        mesh.visible = false;
        continue;
      }
      link.path.at(pkt.t, this._tmp);
      mesh.position.copy(this._tmp);
      mesh.material = this.pktMats[pkt.kind] || M.glowCyan;
      mesh.visible = true;
    }
  }
}
