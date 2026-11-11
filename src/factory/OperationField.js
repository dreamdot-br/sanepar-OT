// Cena 1 — Grande Diorama Urbano Cutaway 3D (escala ~10x, cobrindo todo o ciclo OT da Sanepar):
// 1. Captação Superficial / Manancial (1.524 uo_captacao)
// 2. Bateria de Poços Tubulares Profundos (4.177 uo_poco)
// 3. Complexo ETA — Estação de Tratamento de Água (1.244 uo_eta)
// 4. Reservatórios Apoiados e Castelos d'Água nos bairros (2.606 uo_reservatorio)
// 5. Estações Elevatórias (EEAs) e Subestações de Energia (2.557 uo_eea · 190 UOs D6)
// 6. Malha Subterrânea em Corte: Câmaras VRP, Macromedidores DMC e Pontos de Pressão (3.587 pontos D4)
// 7. Cidade com múltiplos bairros, dezenas de casas/prédios, casa em corte e 41.924 setores de manobra
// 8. 14 feixes simultâneos de telemetria subindo de toda a cidade para a Nuvem (Gateway DHuO -> Lakehouse GCP).
import * as THREE from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { Line2 } from 'three/addons/lines/Line2.js';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';
import { LineGeometry } from 'three/addons/lines/LineGeometry.js';
import { COLORS } from '../config.js';
import { FIELD_ITEMS } from '../content/catalog.js';
import { M } from '../scene/materials.js';
import { box, cylinder, at } from './build.js';

class Path3 {
  constructor(points) {
    this.pts = points.map((p) => (p.isVector3 ? p : new THREE.Vector3(...p)));
    this.cum = [0];
    for (let i = 1; i < this.pts.length; i++) {
      this.cum.push(this.cum[i - 1] + this.pts[i].distanceTo(this.pts[i - 1]));
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

function bezierArc(p0, pCtrl, p1, segments = 26) {
  const curve = new THREE.QuadraticBezierCurve3(
    new THREE.Vector3(...p0),
    new THREE.Vector3(...pCtrl),
    new THREE.Vector3(...p1)
  );
  return curve.getPoints(segments);
}

function buildPipeRun(points, radius, material, radialSeg = 12) {
  const pts = points.map((p) => new THREE.Vector3(...p));
  const path = new THREE.CurvePath();
  for (let i = 0; i < pts.length - 1; i++) {
    path.add(new THREE.LineCurve3(pts[i], pts[i + 1]));
  }
  const geo = new THREE.TubeGeometry(path, pts.length * 8, radius, radialSeg, false);
  const mesh = new THREE.Mesh(geo, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

export class OperationField {
  constructor(sm, sim, picking, { onSelectItem = () => {} } = {}) {
    this.sm = sm;
    this.sim = sim;
    this.picking = picking;
    this.onSelectItem = onSelectItem;

    this.group = new THREE.Group();
    this.group.name = 'diorama_cidade_completa';
    sm.scene.add(this.group);

    this.lineMats = [];
    this.labelEls = {};
    this.labelObjs = {};
    this.pulseRings = {};
    this.routes = {};
    this.waterMesh = null;
    this.impellers = [];
    this.cloudGroup = null;
    this.telemetryLinesGroup = null;
    this.packetsGroup = null;

    this._buildMacroDioramaAndRoads();
    this._buildRiverIntake();
    this._buildDeepWells();
    this._buildEtaComplex();
    this._buildDistributedReservoirs();
    this._buildPumpStationsAndPower();
    this._buildCityNeighborhoods();
    this._buildUndergroundCutawayNetwork();
    this._buildRtuTelemetryHub();
    this._buildSkyCloudDhuoGcp();
    this._buildTelemetryRoutes();
    this._buildPacketPool();
    this._buildScenarioEffects();

    sm.addUpdater((dt) => this.update(dt));
  }

  setVisible(v) {
    this.group.visible = !!v;
    this._syncScenarioLabels();
  }

  setHighlight(id) {
    for (const [k, el] of Object.entries(this.labelEls)) {
      el.classList.toggle('selected', k === id);
    }
  }

  // ---- 1. Grande Bloco Diorama (68 x 38 u) com Corte Geológico e Avenidas ---
  _buildMacroDioramaAndRoads() {
    const env = new THREE.Group();

    const bgPlane = new THREE.Mesh(new THREE.PlaneGeometry(200, 160), M.floor);
    bgPlane.rotation.x = -Math.PI / 2;
    bgPlane.position.y = -3.85;
    bgPlane.receiveShadow = true;
    env.add(bgPlane);

    // Camada profunda de rocha/subsolo (y: -3.8 .. -2.5)
    env.add(at(box(68.0, 1.3, 38.0, M.soilDeep), 0, -3.15, -1.0));

    // Camada intermediária de argila laranja (y: -2.5 .. -1.2)
    // Parte traseira/central inteira + recortes frontais para expor a grande galeria subterrânea
    env.add(at(box(67.6, 1.3, 25.0, M.soilMid), 0, -1.85, -7.4));
    env.add(at(box(17.0, 1.3, 12.6, M.soilMid), -25.3, -1.85, 11.4));
    env.add(at(box(12.0, 1.3, 12.6, M.soilMid), -4.5, -1.85, 11.4));
    env.add(at(box(11.5, 1.3, 12.6, M.soilMid), 28.0, -1.85, 11.4));

    // Camada superior de terra marrom (y: -1.2 .. -0.24)
    env.add(at(box(67.2, 0.96, 24.8, M.soilTop), 0, -0.72, -7.4));
    env.add(at(box(16.8, 0.96, 12.4, M.soilTop), -25.3, -0.72, 11.4));
    env.add(at(box(11.8, 0.96, 12.4, M.soilTop), -4.5, -0.72, 11.4));
    env.add(at(box(11.3, 0.96, 12.4, M.soilTop), 28.0, -0.72, 11.4));

    // Pisos de areia/argila das duas grandes valas escavadas frontais (cutaway trenches)
    env.add(at(box(6.6, 0.35, 12.4, M.trenchSand), -13.6, -2.32, 11.4));
    env.add(at(box(21.0, 0.35, 12.4, M.trenchSand), 11.8, -2.32, 11.4));

    // Gramado verde vibrante no topo do diorama (y: -0.24 .. 0.0)
    env.add(at(box(67.2, 0.24, 24.8, M.grassTop), 0, -0.12, -7.4));
    env.add(at(box(16.8, 0.24, 12.4, M.grassTop), -25.3, -0.12, 11.4));
    env.add(at(box(11.8, 0.24, 12.4, M.grassTop), -4.5, -0.12, 11.4));
    env.add(at(box(11.3, 0.24, 12.4, M.grassTop), 28.0, -0.12, 11.4));

    // Elevação/platô Norte para a Captação, Poços e ETA
    env.add(at(box(30.0, 0.7, 10.5, M.grassDark), -18.0, 0.35, -14.2));

    // === Malha Viária da Cidade (3 Avenidas Leste-Oeste + 4 Avenidas Norte-Sul) ===
    const roadsEW = [
      { x: 4.5, z: -8.5, len: 56.0 },
      { x: 2.0, z: 0.5, len: 62.0 },
      { x: 2.0, z: 8.8, len: 62.0 },
    ];
    for (const r of roadsEW) {
      env.add(at(box(r.len, 0.14, 3.6, M.curb), r.x, 0.05, r.z));
      env.add(at(box(r.len - 0.2, 0.16, 3.0, M.asphalt), r.x, 0.07, r.z));
      for (const dz of [-0.12, 0.12]) {
        env.add(at(box(r.len - 0.6, 0.18, 0.07, M.laneYellow, { cast: false }), r.x, 0.08, r.z + dz));
      }
    }

    const roadsNS = [-17.0, -1.5, 11.5, 22.5];
    for (const rx of roadsNS) {
      env.add(at(box(3.6, 0.14, 34.0, M.curb), rx, 0.05, -0.8));
      env.add(at(box(3.0, 0.16, 33.8, M.asphalt), rx, 0.07, -0.8));
      for (const dx of [-0.12, 0.12]) {
        env.add(at(box(0.07, 0.18, 33.2, M.laneYellow, { cast: false }), rx + dx, 0.08, -0.8));
      }
    }

    // Pedras no corte geológico
    const pebbleGeo = new THREE.DodecahedronGeometry(0.55, 0);
    for (let px = -30; px <= 30; px += 4.5) {
      const p = new THREE.Mesh(pebbleGeo, M.pebble);
      p.position.set(px, -1.4 - ((px * 7) % 3) * 0.35, 17.5);
      p.scale.set(1.2, 0.7, 0.9);
      env.add(p);
    }

    this.group.add(env);
  }

  // ---- 2. Captação Superficial / Manancial no Rio (1.524 uo_captacao) -------
  _buildRiverIntake() {
    const root = new THREE.Group();
    at(root, -29.5, 0.7, -14.0);

    // Leito do rio / represa azul-clara
    root.add(at(box(6.5, 0.28, 9.8, M.waterStream, { cast: false }), -0.5, -0.18, 0));
    // Barragem de concreto e canal de tomada d'água
    root.add(at(box(1.4, 1.3, 9.6, M.concrete), 2.6, 0.45, 0));
    root.add(at(box(2.8, 1.5, 3.2, M.pumpBrick), 3.6, 0.75, -1.5));
    root.add(at(box(3.0, 0.22, 3.4, M.pumpRoof), 3.6, 1.58, -1.5));

    // 3 Bombas de água bruta + adutora de saída para a ETA
    for (const bz of [-2.4, -1.5, -0.6]) {
      root.add(at(cylinder(0.26, 0.26, 1.1, M.tankBlue, 16), 2.2, 0.85, bz));
    }
    // Antena/sensor de captação (FT / LT manancial)
    root.add(at(cylinder(0.08, 0.12, 1.8, M.steel, 12), 3.6, 2.5, -1.5));
    root.add(at(cylinder(0.32, 0.32, 0.28, M.engCyan, 16), 3.6, 3.45, -1.5));

    this.pulseRings.captacao = this._makePulseRing(3.6, 3.68, -1.5, COLORS.engCyan);
    root.add(this.pulseRings.captacao);

    this.group.add(root);
    this.picking.register(root, { type: 'field', id: 'uo_captacao' });
    this._addLabel(
      root,
      'uo_captacao',
      [1.2, 4.5, -1.5],
      'Captação & Manancial (FT/LT)',
      '1.524 UOs Captação · 1.042 áreas'
    );
  }

  // ---- 3. Bateria de Poços Tubulares Profundos (4.177 uo_poco) -------------
  _buildDeepWells() {
    const root = new THREE.Group();

    const wellCoords = [
      [-28.5, 0.0, -3.5],
      [-23.5, 0.0, -3.5],
      [-28.5, 0.0, 4.5],
      [-22.5, 0.0, 12.8],
    ];

    for (const [wx, wy, wz] of wellCoords) {
      const wGroup = new THREE.Group();
      at(wGroup, wx, wy, wz);

      // Laje de proteção sanitária do poço
      wGroup.add(at(box(2.4, 0.2, 2.2, M.concrete), 0, 0.1, 0));
      // Coluna geológica profunda do poço (visível descendo no subsolo)
      wGroup.add(at(cylinder(0.24, 0.24, 3.6, M.pipeWater, 16), -0.4, -1.6, 0));
      // Cavalete de recalque com macromedidor e válvula
      wGroup.add(
        buildPipeRun(
          [
            [-0.4, 0.1, 0],
            [-0.4, 1.15, 0],
            [0.55, 1.15, 0],
            [0.55, 0.1, 0],
          ],
          0.14,
          M.pipeWater
        )
      );
      // Quadro de comando + telemetria do poço
      wGroup.add(at(box(0.75, 1.35, 0.45, M.sensorBody), -0.75, 0.85, -0.65));
      wGroup.add(at(cylinder(0.26, 0.26, 0.24, M.engCyan, 16), 0.1, 1.38, 0));

      root.add(wGroup);
    }

    this.pulseRings.poco = this._makePulseRing(-26.0, 1.65, -3.5, COLORS.engCyan);
    root.add(this.pulseRings.poco);

    this.group.add(root);
    this.picking.register(root, { type: 'field', id: 'uo_poco' });
    this._addLabel(
      root,
      'uo_poco',
      [-26.0, 3.2, -3.5],
      'Poços Tubulares (4.177 UOs)',
      'Nível dinâmico, vazão e status KFF'
    );
  }

  // ---- 4. Complexo ETA — Estação de Tratamento de Água (1.244 uo_eta) ------
  _buildEtaComplex() {
    const root = new THREE.Group();
    at(root, -16.5, 0.7, -14.2);

    // 3 Tanques de Floculação/Decantação em concreto com água azul-clara
    for (const tx of [-3.2, 0.0, 3.2]) {
      root.add(at(box(2.8, 0.65, 4.6, M.concrete), tx, 0.32, 0.8));
      root.add(at(box(2.4, 0.58, 4.1, M.waterStream, { cast: false }), tx, 0.4, 0.8));
    }

    // Edifício de Dosagem Química / Filtros Rápidos
    root.add(at(box(7.8, 2.2, 2.6, M.pumpBrick), 0, 1.1, -2.5));
    root.add(at(box(8.1, 0.24, 2.9, M.pumpRoof), 0, 2.3, -2.5));

    // Sensor principal da ETA
    root.add(at(cylinder(0.35, 0.35, 0.3, M.engCyan, 18), 0, 2.65, -2.5));
    this.pulseRings.eta = this._makePulseRing(0, 2.88, -2.5, COLORS.engCyan);
    root.add(this.pulseRings.eta);

    this.group.add(root);
    this.picking.register(root, { type: 'field', id: 'uo_eta' });
    this._addLabel(
      root,
      'uo_eta',
      [0, 4.3, -1.5],
      'Estação de Tratamento — ETA',
      '1.244 ETAs Geo · 1.115 sistemas BOPE'
    );
  }

  // ---- 5. Centros de Reservação & Castelos d'Água (2.606 uo_reservatorio) --
  _buildDistributedReservoirs() {
    const root = new THREE.Group();

    // A) Centro de Reservação Principal (2 grandes tanques apoiados azuis junto à ETA)
    for (const [rx, rz, r, h] of [
      [-6.8, -14.2, 2.2, 3.8],
      [-1.8, -14.2, 2.2, 3.8],
    ]) {
      root.add(at(cylinder(r + 0.3, r + 0.35, 0.35, M.concrete, 28), rx, 1.0, rz));
      root.add(at(cylinder(r, r, h, M.tankBlue, 28), rx, 1.15 + h / 2, rz));
      root.add(at(cylinder(r + 0.1, r + 0.1, 0.22, M.tankCap, 28), rx, 1.15 + h, rz));
      root.add(at(cylinder(0.32, 0.32, 0.28, M.engCyan, 16), rx, 1.45 + h, rz));
    }

    // Visor dinâmico no tanque principal
    root.add(at(box(0.5, 3.1, 0.28, M.frame), -6.8, 2.9, -11.95));
    this.waterMesh = box(0.36, 2.8, 0.24, M.waterFill, { cast: false });
    at(this.waterMesh, -6.8, 2.75, -11.9);
    root.add(this.waterMesh);

    // B) Reservatório Elevado (Castelo d'Água) no Bairro Norte (x: 15.5, z: -13.5)
    root.add(at(cylinder(0.85, 1.15, 4.2, M.concrete, 20), 15.5, 2.1, -13.5));
    root.add(at(cylinder(1.85, 1.65, 2.4, M.tankBlue, 24), 15.5, 5.2, -13.5));
    root.add(at(cylinder(1.92, 1.92, 0.2, M.tankCap, 24), 15.5, 6.5, -13.5));
    root.add(at(cylinder(0.32, 0.32, 0.28, M.engCyan, 16), 15.5, 6.8, -13.5));

    // C) Reservatório de Bairro no Setor Leste (x: 27.5, z: -4.2)
    root.add(at(cylinder(2.1, 2.1, 3.2, M.tankBlue, 24), 27.5, 1.6, -4.2));
    root.add(at(cylinder(2.18, 2.18, 0.2, M.tankCap, 24), 27.5, 3.3, -4.2));
    root.add(at(cylinder(0.32, 0.32, 0.28, M.engCyan, 16), 27.5, 3.6, -4.2));

    this.pulseRings.reservatorio = this._makePulseRing(-6.8, 5.5, -14.2, COLORS.engCyan);
    root.add(this.pulseRings.reservatorio);

    this.group.add(root);
    this.picking.register(root, { type: 'field', id: 'uo_reservatorio' });
    this._addLabel(
      root,
      'uo_reservatorio',
      [-4.3, 6.4, -14.2],
      'Reservatórios & Castelos d’Água (LT)',
      '2.606 reservatórios · 11.848 unidades SDOA'
    );
  }

  // ---- 6. Estações Elevatórias (EEAs) & Subestações de Energia (D6) --------
  _buildPumpStationsAndPower() {
    const root = new THREE.Group();

    const stations = [
      { x: 5.5, z: -13.5 },
      { x: 17.5, z: -3.8 },
    ];

    for (const st of stations) {
      const sGroup = new THREE.Group();
      at(sGroup, st.x, 0, st.z);

      sGroup.add(at(box(4.2, 2.2, 3.0, M.pumpBrick), 0, 1.1, 0));
      sGroup.add(at(box(4.5, 0.25, 3.3, M.pumpRoof), 0, 2.3, 0));

      // 2 motobombas externas
      for (const bx of [-0.9, 0.9]) {
        const motor = cylinder(0.35, 0.35, 0.95, M.tankBlue, 18);
        motor.rotation.x = Math.PI / 2;
        at(motor, bx, 0.55, 1.95);
        sGroup.add(motor);

        const ring = cylinder(0.18, 0.18, 0.38, M.engCyan, 12);
        ring.rotation.x = Math.PI / 2;
        at(ring, bx, 0.55, 2.45);
        sGroup.add(ring);
        this.impellers.push(ring);
      }

      // Poste de subestação elétrica + transformador + Quadro QGBT/KFF (Painel D6)
      sGroup.add(at(cylinder(0.12, 0.16, 4.2, M.concrete, 12), -2.6, 2.1, -0.5));
      sGroup.add(at(box(1.3, 0.12, 0.14, M.steelDark), -2.6, 3.9, -0.5));
      sGroup.add(at(box(1.05, 1.75, 0.55, M.steel), 2.5, 0.95, 0.4));
      sGroup.add(at(cylinder(0.24, 0.24, 0.3, M.engOrange, 16), 2.5, 1.98, 0.4));

      root.add(sGroup);
    }

    this.pulseRings.elevatoria = this._makePulseRing(8.0, 2.2, -13.1, COLORS.engOrange);
    root.add(this.pulseRings.elevatoria);

    this.group.add(root);
    this.picking.register(root, { type: 'field', id: 'uo_elevatoria' });
    this._addLabel(
      root,
      'uo_elevatoria',
      [5.5, 4.0, -13.5],
      'Elevatórias (EEAs) & Energia (D6)',
      '2.557 EEAs Geo · 190 UOs próprias no D6'
    );
  }

  // ---- 7. Bairros da Cidade: Dezenas de Casas, Prédios e Casa em Corte -----
  _buildCityNeighborhoods() {
    const root = new THREE.Group();

    // A) Casa em Corte (Cutaway House) em destaque na frente-esquerda (x: -23.5, z: 12.2)
    const house = new THREE.Group();
    at(house, -23.5, 0, 12.2);
    house.add(at(box(5.2, 0.22, 4.6, M.concreteDark), 0, 0.11, 0));
    house.add(at(box(2.9, 0.08, 4.3, M.floorWood), -1.0, 0.24, 0));
    house.add(at(box(1.9, 0.08, 4.3, M.floorTile), 1.45, 0.24, 0));
    house.add(at(box(5.2, 2.5, 0.22, M.wallCream), 0, 1.45, -2.2));
    house.add(at(box(0.22, 2.5, 4.6, M.wallCream), -2.5, 1.45, 0));
    house.add(at(box(0.18, 2.3, 4.3, M.wallInner), 0.4, 1.38, 0));
    const roofSlope = box(5.6, 0.2, 2.8, M.roofCeramic);
    roofSlope.rotation.x = 0.36;
    at(roofSlope, 0, 3.05, -1.1);
    house.add(roofSlope);
    // Caixa d'água azul no telhado da casa em corte
    house.add(at(box(1.3, 0.75, 1.3, M.wallCream), -1.5, 3.15, -1.1));
    house.add(at(cylinder(0.82, 0.76, 1.2, M.tankBlue, 22), -1.5, 4.08, -1.1));
    house.add(at(cylinder(0.88, 0.88, 0.16, M.tankCap, 22), -1.5, 4.72, -1.1));
    root.add(house);

    // Cavalete externo com hidrômetro + tubo azul subindo pela casa em corte
    root.add(
      buildPipeRun(
        [
          [-28.2, -1.5, 13.5],
          [-28.2, 0.95, 13.5],
          [-26.8, 0.95, 13.5],
          [-26.8, -1.5, 13.5],
          [-26.0, -1.5, 11.2],
          [-26.0, 4.4, 11.2],
          [-25.0, 4.4, 11.2],
        ],
        0.13,
        M.pipeWater
      )
    );
    root.add(at(cylinder(0.28, 0.28, 0.24, M.engCyan, 16), -27.5, 1.12, 13.5));

    // B) 18 Casas Residenciais com telhado cerâmico e caixas d'água azuis distribuídas nos bairros
    const houses = [
      [-12.5, -4.5], [-8.8, -4.5], [-5.2, -4.5],
      [-12.5, 4.5], [-8.8, 4.5], [-5.2, 4.5],
      [-6.8, 12.8], [-2.8, 12.8],
      [3.5, -4.5], [7.8, -4.5],
      [15.2, 4.5], [19.2, 4.5],
      [25.5, 4.5], [29.5, 4.5],
      [25.8, 12.5], [29.8, 12.5],
      [21.5, -13.5], [26.5, -13.5],
    ];
    for (const [cx, cz] of houses) {
      const hUnit = new THREE.Group();
      at(hUnit, cx, 0, cz);
      hUnit.add(at(box(2.6, 1.65, 2.3, M.wallCream), 0, 0.82, 0));
      const r1 = box(2.9, 0.16, 1.45, M.roofCeramic);
      r1.rotation.x = 0.38;
      at(r1, 0, 1.92, -0.55);
      const r2 = box(2.9, 0.16, 1.45, M.roofCeramic);
      r2.rotation.x = -0.38;
      at(r2, 0, 1.92, 0.55);
      hUnit.add(r1, r2);
      // Mini caixa d'água azul no telhado
      hUnit.add(at(cylinder(0.32, 0.3, 0.45, M.tankBlue, 14), -0.6, 2.25, -0.3));
      root.add(hUnit);
    }

    // C) 16 Edifícios Urbanos (Centro Comercial, Hospitais, Condomínios) nos quarteirões centrais e leste
    const towers = [
      { x: 2.2, z: 4.2, w: 2.6, d: 2.2, h: 4.8 },
      { x: 5.5, z: 4.8, w: 2.8, d: 2.4, h: 6.4 },
      { x: 8.6, z: 4.0, w: 2.4, d: 2.1, h: 5.2 },
      { x: 2.5, z: -13.2, w: 2.5, d: 2.2, h: 4.2 },
      { x: 10.5, z: -13.5, w: 2.8, d: 2.4, h: 5.8 },
      { x: 14.8, z: -4.2, w: 2.4, d: 2.2, h: 4.6 },
      { x: 25.5, z: -9.5, w: 2.8, d: 2.4, h: 6.2 },
      { x: 29.2, z: -9.2, w: 2.6, d: 2.2, h: 5.0 },
      { x: -12.5, z: -12.5, w: 2.4, d: 2.0, h: 3.6 },
      { x: -21.5, z: 4.5, w: 2.6, d: 2.2, h: 4.2 },
    ];
    for (const b of towers) {
      root.add(at(box(b.w, b.h, b.d, M.concrete), b.x, b.h / 2, b.z));
      root.add(at(box(b.w + 0.12, 0.18, b.d + 0.12, M.concreteDark), b.x, b.h + 0.09, b.z));
      // Reservatório superior de edifício
      root.add(at(cylinder(0.45, 0.45, 0.65, M.tankBlue, 16), b.x, b.h + 0.5, b.z));
    }

    // D) 28 Árvores low-poly espalhadas pelos bairros
    const crownGeo = new THREE.IcosahedronGeometry(0.85, 1);
    const treeCoords = [
      [-31.5, -6.5], [-20.0, -6.5], [-14.8, -6.2], [-14.8, 2.8],
      [-0.2, -6.2], [-0.2, 2.8], [9.8, -6.2], [9.8, 2.8],
      [13.5, -6.2], [20.5, -6.2], [24.2, 2.5], [31.5, 2.5],
      [-19.5, 14.5], [-8.5, 15.2], [24.8, 15.2], [31.2, 14.8],
    ];
    for (const [tx, tz] of treeCoords) {
      root.add(at(cylinder(0.14, 0.2, 0.9, M.treeTrunk, 8), tx, 0.45, tz));
      const crown = new THREE.Mesh(crownGeo, (tx + tz) % 2 === 0 ? M.treeFoliage : M.treeFoliageLight);
      crown.position.set(tx, 1.45, tz);
      crown.scale.set(1.1, 1.35, 1.1);
      crown.castShadow = true;
      root.add(crown);
    }

    this.pulseRings.setor_manobra = this._makePulseRing(5.5, 0.35, 8.8, COLORS.engCyan);
    root.add(this.pulseRings.setor_manobra);

    this.group.add(root);
    this.picking.register(root, { type: 'field', id: 'uo_setor_manobra' });
    this._addLabel(
      root,
      'uo_setor_manobra',
      [5.5, 7.6, 4.8],
      'Cidade, Setores de Manobra & Ligações',
      '41.924 setores · 400 concessões · 670 localidades'
    );
  }

  // ---- 8. Grande Malha Subterrânea em Corte: 3 VRPs + 3 DMCs + Rede Azul ---
  _buildUndergroundCutawayNetwork() {
    const root = new THREE.Group();

    // Tronco adutor principal subterrâneo atravessando toda a cidade de Oeste a Leste (x: -29 .. +30)
    root.add(
      buildPipeRun(
        [
          [-26.5, 0.8, -14.2],
          [-6.8, 0.8, -14.2],
          [-6.8, -1.55, -2.0],
          [-13.6, -1.55, 11.4],
          [11.8, -1.55, 11.4],
          [27.5, -1.55, 11.4],
        ],
        0.32,
        M.pipeWater
      )
    );

    // Anéis subterrâneos secundários sob as avenidas Norte-Sul e Leste-Oeste
    for (const rx of [-13.6, 3.5, 11.8, 19.5]) {
      root.add(
        buildPipeRun(
          [
            [rx, -1.55, -8.5],
            [rx, -1.55, 15.2],
          ],
          0.22,
          M.pipeSub
        )
      );
    }
    root.add(
      buildPipeRun(
        [
          [-28.0, -1.55, 13.5],
          [28.5, -1.55, 13.5],
        ],
        0.22,
        M.pipeSub
      )
    );

    // 3 Câmaras Subterrâneas de VRP + 3 Macromedidores DMC expostos nas valas escavadas frontais
    const vrpNodes = [
      { x: -13.6, z: 11.4 },
      { x: 4.2, z: 11.4 },
      { x: 18.2, z: 11.4 },
    ];
    for (const v of vrpNodes) {
      // Poço de concreto com grelha superior
      root.add(at(box(2.8, 2.3, 2.6, M.concrete), v.x, -1.1, v.z - 2.4));
      root.add(at(box(2.2, 0.14, 2.0, M.steelDark), v.x, 0.12, v.z - 2.4));

      // Válvula Redutora de Pressão (VRP) + Atuador Ciano e Macromedidor DMC na vala aberta
      root.add(at(cylinder(0.52, 0.52, 1.15, M.pipeWater, 20), v.x - 0.6, -1.5, v.z + 1.2));
      root.add(at(cylinder(0.58, 0.34, 0.52, M.engCyan, 20), v.x - 0.6, -0.82, v.z + 1.2));
      root.add(at(box(0.75, 0.78, 0.75, M.sensorBody), v.x + 0.85, -1.4, v.z + 1.2));
    }

    // Dezenas de totens de leitura de pressão (PT) emergindo da malha subterrânea
    for (const [px, pz] of [
      [-18.5, 0.5], [-7.5, 0.5], [4.5, 0.5], [15.5, 0.5], [25.5, 0.5],
      [-13.6, 6.5], [4.2, 6.5], [11.8, 13.5], [18.2, 6.5],
    ]) {
      root.add(at(cylinder(0.07, 0.07, 1.6, M.steel, 10), px, -0.7, pz));
      root.add(at(cylinder(0.26, 0.26, 0.28, M.engCyan, 16), px, 0.24, pz));
    }

    this.pulseRings.rede_vrp = this._makePulseRing(4.2 - 0.6, -0.48, 12.6, COLORS.engCyan);
    root.add(this.pulseRings.rede_vrp);

    this.group.add(root);
    this.picking.register(root, { type: 'field', id: 'uo_rede_vrp' });
    this._addLabel(
      root,
      'uo_rede_vrp',
      [11.8, 1.2, 12.6],
      'Malha Subterrânea, VRPs & DMCs (D4)',
      '3.587 pontos pressão · 3.776 zonas · 3.251 DMCs'
    );
  }

  // ---- 9. Estação Concentradora RTU / Servidores Historian Sanepar ---------
  _buildRtuTelemetryHub() {
    const root = new THREE.Group();
    at(root, -4.5, 0, 2.2);

    root.add(at(box(3.2, 0.24, 2.4, M.concrete), 0, 0.12, 0));
    root.add(at(box(2.6, 2.2, 1.7, M.sensorBody), 0, 1.3, 0));
    root.add(at(box(2.68, 0.2, 1.76, M.engCyan), 0, 2.35, 0));

    // Torre central de telemetria
    root.add(at(cylinder(0.1, 0.16, 3.4, M.steel, 12), 0.6, 4.1, 0));
    root.add(at(cylinder(0.38, 0.14, 0.38, M.engCyan, 16), 0.6, 5.85, 0));

    this.pulseRings.rtu = this._makePulseRing(0.6, 6.1, 0, COLORS.engCyan);
    root.add(this.pulseRings.rtu);

    this.group.add(root);
    this.picking.register(root, { type: 'field', id: 'uo_rtu_historian' });
    this._addLabel(
      root,
      'uo_rtu_historian',
      [0, 7.0, 0],
      'Concentradores RTU & Historian',
      '5.756 devices · 19.552 tags (Terceiros + SCADA)'
    );
  }

  // ---- 10. Nuvem Compacta no Céu: Gateway DHuO -> Lakehouse GCP ------------
  _buildSkyCloudDhuoGcp() {
    const deck = { x: 2.0, y: 15.8, z: -11.5 };
    const gw = { x: 0.1, y: 15.9, z: -11.5 };
    const gcp = { x: 3.9, y: 15.9, z: -11.5 };

    const root = new THREE.Group();
    this.cloudGroup = root;

    // Nuvem bem mais compacta e discreta para não ocupar a tela
    const puffs = [
      [-3.1, -0.15, 0.1, 1.35],
      [-1.8, 0.1, -0.2, 1.7],
      [-0.3, 0.2, 0.15, 1.65],
      [1.2, 0.22, -0.15, 1.85],
      [2.6, 0.1, 0.18, 1.65],
      [3.8, -0.12, -0.1, 1.3],
    ];
    const puffGeo = new THREE.SphereGeometry(1, 18, 14);
    for (const [px, py, pz, r] of puffs) {
      const m = new THREE.Mesh(puffGeo, M.cloudWhite);
      m.position.set(deck.x + px, deck.y + py, deck.z + pz);
      m.scale.set(r * 1.25, r * 0.52, r * 0.85);
      root.add(m);
    }

    // Bloco compacto Gateway DHuO (Magenta Engineering)
    root.add(at(box(2.1, 0.58, 1.15, M.engPink, { cast: false }), gw.x, gw.y + 0.25, gw.z));

    // Bloco compacto Lakehouse GCP (Ciano Engineering)
    root.add(at(box(2.4, 0.62, 1.25, M.engCyan, { cast: false }), gcp.x, gcp.y + 0.28, gcp.z));
    for (const dx of [-0.65, 0, 0.65]) {
      root.add(
        at(cylinder(0.22, 0.22, 0.34, M.white, 14, { cast: false }), gcp.x + dx, gcp.y + 0.75, gcp.z)
      );
    }

    this.pulseRings.dhuo = this._makePulseRing(gw.x, gw.y + 0.62, gw.z, COLORS.engPink);
    root.add(this.pulseRings.dhuo);

    this.group.add(root);
    this.picking.register(root, { type: 'field', id: 'campo_dhuo_gw' });
    this._addLabel(
      root,
      'campo_dhuo_gw',
      [deck.x, deck.y + 1.65, deck.z],
      'Nuvem · Gateway DHuO → Lakehouse GCP',
      '6 fontes → southamerica-east1'
    );
  }

  // ---- 11. 14 Feixes Simultâneos de Telemetria Subindo da Cidade p/ Nuvem --
  _buildTelemetryRoutes() {
    this.telemetryLinesGroup = new THREE.Group();
    this.group.add(this.telemetryLinesGroup);

    const rtuPos = [-3.9, 5.85, 2.2];
    const gwCloud = [0.1, 16.1, -11.5];
    const gcpCloud = [3.9, 16.15, -11.5];

    const defs = {
      // 1. Captação Manancial -> Nuvem DHuO
      cap_cloud: {
        pts: bezierArc([-25.9, 4.1, -15.5], [-14.0, 14.0, -14.0], gwCloud),
        color: COLORS.engCyan,
      },
      // 2 & 3. Poços Tubulares -> Nuvem DHuO
      poco1_cloud: {
        pts: bezierArc([-28.5, 1.5, -3.5], [-15.5, 12.2, -8.0], gwCloud),
        color: COLORS.engCyan,
      },
      poco2_cloud: {
        pts: bezierArc([-22.5, 1.5, 12.8], [-11.5, 12.0, 1.0], gwCloud),
        color: COLORS.engCyan,
      },
      // 4. ETA -> Concentrador RTU
      eta_rtu: {
        pts: bezierArc([-16.5, 3.4, -16.7], [-11.0, 7.5, -6.0], rtuPos),
        color: COLORS.engCyan,
      },
      // 5, 6, 7. Reservatórios (Centro, Castelo Norte, Leste) -> RTU / Nuvem
      res1_rtu: {
        pts: bezierArc([-6.8, 5.4, -14.2], [-5.5, 7.8, -5.5], rtuPos),
        color: COLORS.engCyan,
      },
      res2_cloud: {
        pts: bezierArc([15.5, 6.9, -13.5], [7.5, 14.0, -12.5], gwCloud),
        color: COLORS.engCyan,
      },
      res3_cloud: {
        pts: bezierArc([27.5, 3.7, -4.2], [14.0, 13.8, -8.5], gwCloud),
        color: COLORS.engCyan,
      },
      // 8 & 9. Elevatórias & Subestações de Energia (D6) -> RTU / Nuvem
      eea1_rtu: {
        pts: bezierArc([8.0, 2.1, -13.1], [2.0, 6.8, -5.0], rtuPos),
        color: COLORS.engOrange,
      },
      eea2_cloud: {
        pts: bezierArc([20.0, 2.1, -3.4], [9.5, 12.5, -8.0], gwCloud),
        color: COLORS.engOrange,
      },
      // 10, 11, 12. Câmaras Subterrâneas de VRP (D4) -> RTU / Nuvem
      vrp1_rtu: {
        pts: bezierArc([-14.2, -0.5, 12.6], [-9.2, 4.8, 7.5], rtuPos),
        color: COLORS.engCyan,
      },
      vrp2_cloud: {
        pts: bezierArc([3.6, -0.5, 12.6], [1.5, 11.2, 1.0], gwCloud),
        color: COLORS.engCyan,
      },
      vrp3_cloud: {
        pts: bezierArc([17.6, -0.5, 12.6], [8.5, 12.0, 1.0], gwCloud),
        color: COLORS.engCyan,
      },
      // 13 & 14. Macromedidores DMC & Ligações Urbanas -> Nuvem
      dmc1_cloud: {
        pts: bezierArc([-27.5, 1.2, 13.5], [-14.0, 11.8, 2.0], gwCloud),
        color: COLORS.engCyan,
      },
      dmc2_cloud: {
        pts: bezierArc([25.5, 0.4, 0.5], [12.5, 12.8, -5.5], gwCloud),
        color: COLORS.engCyan,
      },
      // Uplink Concentrador RTU/Historian -> Gateway DHuO na Nuvem
      rtu_dhuo: {
        pts: bezierArc(rtuPos, [-2.0, 12.6, -4.5], gwCloud, 32),
        color: COLORS.engPink,
        width: 2.4,
      },
      // Ponte interna na Nuvem: Gateway DHuO -> Lakehouse GCP
      dhuo_gcp: {
        pts: bezierArc(gwCloud, [2.0, 17.1, -11.5], gcpCloud, 20),
        color: COLORS.engCyan,
        width: 2.6,
      },
    };

    for (const [id, d] of Object.entries(defs)) {
      this.routes[id] = new Path3(d.pts);
      const geo = new LineGeometry();
      geo.setPositions(d.pts.flatMap((p) => [p.x, p.y, p.z]));
      const mat = new LineMaterial({
        color: d.color,
        linewidth: d.width || 1.6,
        dashed: true,
        dashSize: 0.5,
        gapSize: 0.32,
        transparent: true,
        opacity: 0.78,
      });
      const line = new Line2(geo, mat);
      line.computeLineDistances();
      this.lineMats.push(mat);
      this.telemetryLinesGroup.add(line);
    }
  }

  _buildPacketPool() {
    this.packetsGroup = new THREE.Group();
    this.group.add(this.packetsGroup);

    const geo = new THREE.SphereGeometry(0.24, 12, 12);
    this.pktMeshes = [];
    for (let i = 0; i < 75; i++) {
      const m = new THREE.Mesh(geo, i % 3 === 0 ? M.glowPink : M.glowCyan);
      m.visible = false;
      this.packetsGroup.add(m);
      this.pktMeshes.push(m);
    }
    this._tmp = new THREE.Vector3();
  }

  _makePulseRing(x, y, z, color) {
    const geo = new THREE.RingGeometry(0.35, 0.6, 24);
    const mat = new THREE.MeshBasicMaterial({
      color,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.0,
      depthWrite: false,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(x, y, z);
    return mesh;
  }

  _addLabel(parent, id, pos, title, sub) {
    const item = FIELD_ITEMS[id];
    const el = document.createElement('button');
    el.type = 'button';
    el.className = `scene-label ${id === 'campo_dhuo_gw' ? 'pink' : ''}`;
    el.innerHTML = `<span class="sl-top"><span class="sl-dot"></span><b>${title}</b></span><span class="sl-sub">${sub}</span>`;
    el.addEventListener('pointerdown', (e) => e.stopPropagation());
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      if (item) this.onSelectItem('field', id);
    });
    const obj = new CSS2DObject(el);
    obj.position.set(...pos);
    parent.add(obj);
    this.labelEls[id] = el;
    this.labelObjs[id] = obj;
  }

  // ---- 12. Efeitos 3D dos 5 Cenários de Falha & Inteligência Operacional ----
  _buildScenarioEffects() {
    this.scenarioGroups = {};
    this.scenarioBadges = {};

    const redBeaconMat = new THREE.MeshBasicMaterial({
      color: 0xff3b3b,
      transparent: true,
      opacity: 0.78,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const warnBeaconMat = new THREE.MeshBasicMaterial({
      color: 0xfacc15,
      transparent: true,
      opacity: 0.78,
      side: THREE.DoubleSide,
      depthWrite: false,
    });

    // 1. Queda de Energia (D6 -> Autonomia Hídrica)
    const gOutage = new THREE.Group();
    gOutage.visible = false;
    const outageRingEea = new THREE.Mesh(new THREE.RingGeometry(2.4, 3.1, 32), redBeaconMat);
    outageRingEea.rotation.x = -Math.PI / 2;
    outageRingEea.position.set(5.5, 0.22, -13.5);
    const outageRingRap = new THREE.Mesh(new THREE.RingGeometry(2.6, 3.3, 32), redBeaconMat);
    outageRingRap.rotation.x = -Math.PI / 2;
    outageRingRap.position.set(-6.8, 1.08, -14.2);
    gOutage.add(outageRingEea, outageRingRap);
    this.group.add(gOutage);
    this.scenarioGroups.power_outage_cascade = gOutage;
    this._addScenarioBadge(
      'power_outage_cascade',
      gOutage,
      [-0.5, 7.6, -13.8],
      'crit',
      'QUEDA DE ENERGIA (KFF=0) · EEA-01 PARADA',
      'Nível RAP caindo (28%) · Autonomia calculada: 3,8 h · TMR: 95 min'
    );

    // 2. Tempestade Severa (Clima -> Poços + Captação + ETA)
    const gStorm = new THREE.Group();
    gStorm.visible = false;
    const darkCloudMat = new THREE.MeshStandardMaterial({
      color: 0x263244,
      emissive: 0x101824,
      roughness: 0.7,
      transparent: true,
      opacity: 0.88,
    });
    const stormCenter = { x: -24.5, y: 11.2, z: -8.5 };
    const stormPuffs = [
      [-4.2, 0, 0, 2.8],
      [-1.5, 0.4, -0.5, 3.5],
      [1.8, 0.3, 0.4, 3.4],
      [4.5, -0.1, -0.2, 2.7],
      [0, -0.2, 2.2, 2.9],
    ];
    const sGeo = new THREE.SphereGeometry(1, 18, 14);
    for (const [px, py, pz, r] of stormPuffs) {
      const m = new THREE.Mesh(sGeo, darkCloudMat);
      m.position.set(stormCenter.x + px, stormCenter.y + py, stormCenter.z + pz);
      m.scale.set(r * 1.35, r * 0.6, r * 1.05);
      gStorm.add(m);
    }
    // Feixes de chuva e raio sob a tempestade
    const rainMat = new THREE.MeshBasicMaterial({
      color: 0x6ec5ff,
      transparent: true,
      opacity: 0.42,
      depthWrite: false,
    });
    this.rainLines = [];
    for (let i = 0; i < 18; i++) {
      const rx = stormCenter.x - 5.5 + (i % 6) * 2.2;
      const rz = stormCenter.z - 2.8 + Math.floor(i / 6) * 2.8;
      const drop = cylinder(0.035, 0.035, 9.5, rainMat, 6, { cast: false, receive: false });
      at(drop, rx, 5.5, rz);
      gStorm.add(drop);
      this.rainLines.push(drop);
    }
    this.lightningBolt = cylinder(0.12, 0.05, 10.2, warnBeaconMat, 6, { cast: false, receive: false });
    at(this.lightningBolt, -26.0, 5.6, -5.0);
    gStorm.add(this.lightningBolt);
    const stormZone = new THREE.Mesh(new THREE.RingGeometry(6.8, 7.5, 36), warnBeaconMat);
    stormZone.rotation.x = -Math.PI / 2;
    stormZone.position.set(-24.5, 0.85, -8.5);
    gStorm.add(stormZone);
    this.group.add(gStorm);
    this.scenarioGroups.severe_weather = gStorm;
    this._addScenarioBadge(
      'severe_weather',
      gStorm,
      [-24.5, 13.8, -8.5],
      'warn',
      'ALERTA DE TEMPESTADE SEVERA · MANANCIAL & POÇOS',
      'Cruzamento ArcGIS area_influencia: 4 Poços + Captação sob risco elétrico e turbidez'
    );

    // 3. Falha de VRP & Vazamento Subterrâneo (D4 -> Anomalia de Vazão DMC)
    const gBurst = new THREE.Group();
    gBurst.visible = false;
    const burstRing = new THREE.Mesh(new THREE.RingGeometry(1.8, 2.5, 32), redBeaconMat);
    burstRing.rotation.x = -Math.PI / 2;
    burstRing.position.set(3.6, -1.35, 12.6);
    gBurst.add(burstRing);

    // Jatos 3D de água jorrando da tubulação subterrânea na vala escavada
    this.leakJets = [];
    for (let j = 0; j < 5; j++) {
      const jet = cylinder(0.06, 0.32, 2.6, M.waterStream, 12, { cast: false });
      jet.position.set(3.6 + (j - 2) * 0.25, -0.2, 12.6 + ((j % 2) - 0.5) * 0.25);
      jet.rotation.z = (j - 2) * 0.14;
      gBurst.add(jet);
      this.leakJets.push(jet);
    }
    const puddle = cylinder(2.1, 2.1, 0.12, M.waterStream, 24, { cast: false });
    at(puddle, 3.6, -2.08, 12.6);
    gBurst.add(puddle);
    this.group.add(gBurst);
    this.scenarioGroups.vrp_burst_leak = gBurst;
    this._addScenarioBadge(
      'vrp_burst_leak',
      gBurst,
      [3.6, 3.4, 12.6],
      'crit',
      'SOBREPRESSÃO VRP (68,4 mca) + VAZAMENTO SUBTERRÂNEO',
      'Violação pm_..._faixa (>50 mca) · Salto de vazão mínima noturna no DMC (+42%)'
    );

    // 4. Manobra / Manutenção Programada em Setor de Manobra
    const gMaint = new THREE.Group();
    gMaint.visible = false;
    const maintPts = [
      [0.5, 0.25, 2.2],
      [10.2, 0.25, 2.2],
      [10.2, 0.25, 7.2],
      [0.5, 0.25, 7.2],
      [0.5, 0.25, 2.2],
    ];
    const maintGeo = new LineGeometry();
    maintGeo.setPositions(maintPts.flat());
    const maintMat = new LineMaterial({
      color: COLORS.yellow,
      linewidth: 3.2,
      dashed: true,
      dashSize: 0.6,
      gapSize: 0.3,
    });
    const maintLine = new Line2(maintGeo, maintMat);
    maintLine.computeLineDistances();
    this.lineMats.push(maintMat);
    gMaint.add(maintLine);
    this.group.add(gMaint);
    this.scenarioGroups.planned_maintenance = gMaint;
    this._addScenarioBadge(
      'planned_maintenance',
      gMaint,
      [5.4, 8.2, 4.5],
      'info',
      'MANOBRA PROGRAMADA · SETOR #1408 (08:00–12:00)',
      'Polígono setor_manobra isolado · Queda de pressão qualificada (sem falso alarme no CCO)'
    );

    // 5. Subpressão em Ponto Crítico (< 10 mca na Ponta de Rede / Casa em Corte)
    const gLowP = new THREE.Group();
    gLowP.visible = false;
    for (const [lx, lz] of [
      [-23.5, 12.2],
      [25.5, 0.5],
      [28.0, 12.5],
    ]) {
      const r = new THREE.Mesh(new THREE.RingGeometry(2.0, 2.6, 28), warnBeaconMat);
      r.rotation.x = -Math.PI / 2;
      r.position.set(lx, 0.25, lz);
      gLowP.add(r);
    }
    this.group.add(gLowP);
    this.scenarioGroups.critical_low_pressure = gLowP;
    this._addScenarioBadge(
      'critical_low_pressure',
      gLowP,
      [-23.5, 6.6, 12.2],
      'warn',
      'SUBPRESSÃO EM PONTO CRÍTICO · 6,8 mca (< MÍN 10 mca)',
      'Detectado em vw_..._pressao_ponto_atual na cota alta durante horário de pico'
    );

    // Callouts dinâmicos das 2 Narrativas de Negócio (estilo vídeo Energisa)
    this.storyCallouts = [];
    for (let i = 0; i < 3; i++) {
      const el = document.createElement('div');
      el.className = 'story-3d-callout';
      const obj = new CSS2DObject(el);
      obj.visible = false;
      this.group.add(obj);
      this.storyCallouts.push({ el, obj });
    }
    this._lastStoryActId = null;
  }

  _addScenarioBadge(id, parent, pos, kind, title, sub) {
    const el = document.createElement('div');
    el.className = `scenario-3d-badge ${kind}`;
    el.innerHTML = `<strong>${title}</strong><span>${sub}</span>`;
    const obj = new CSS2DObject(el);
    obj.position.set(...pos);
    obj.visible = false;
    parent.add(obj);
    this.scenarioBadges[id] = { el, obj };
  }

  _syncScenarioLabels() {
    const vis = this.group.visible;
    const active = vis ? this.sim.activeScenario : null;
    const storyAct = vis && this.sim.story.active ? this.sim.story.currentAct : null;
    const inDemo = !!(active || storyAct);

    // 1) No modo demonstração, esconde os fluxos contínuos para a Cloud, a Nuvem e os labels técnicos padrão
    if (this.telemetryLinesGroup) this.telemetryLinesGroup.visible = vis && !inDemo;
    if (this.packetsGroup) this.packetsGroup.visible = vis && !inDemo;
    if (this.cloudGroup) this.cloudGroup.visible = vis && !inDemo;

    for (const obj of Object.values(this.labelObjs || {})) {
      obj.visible = vis && !inDemo;
    }

    // 2) Grupos 3D e badges dos 5 cenários pontuais
    for (const [id, g] of Object.entries(this.scenarioGroups || {})) {
      const fromStory =
        (id === 'vrp_burst_leak' && storyAct?.leakEffect) ||
        (id === 'planned_maintenance' && storyAct?.maintEffect);
      g.visible = vis && (id === active || !!fromStory);
    }
    for (const [id, b] of Object.entries(this.scenarioBadges || {})) {
      b.obj.visible = vis && id === active;
    }

    // 3) Callouts 3D das 2 Narrativas de Negócio (escondidos via obj.visible = false ao parar)
    const actId = storyAct ? storyAct.id : null;
    if (actId !== this._lastStoryActId) {
      this._lastStoryActId = actId;
      const list = storyAct?.callouts || [];
      for (let i = 0; i < (this.storyCallouts || []).length; i++) {
        const sc = this.storyCallouts[i];
        const cDef = list[i];
        if (!cDef) {
          sc.obj.visible = false;
          continue;
        }
        sc.el.className = `story-3d-callout ${cDef.kind || 'info'}`;
        sc.el.innerHTML = `<strong>${cDef.title}</strong><span>${cDef.sub}</span>`;
        sc.obj.position.set(...cDef.pos);
        sc.obj.visible = true;
      }
    }
    if ((!vis || !storyAct) && this.storyCallouts) {
      for (const sc of this.storyCallouts) {
        sc.obj.visible = false;
      }
    }
  }

  update(dt) {
    const w = this.sm.container.clientWidth;
    const h = this.sm.container.clientHeight;
    for (const m of this.lineMats) m.resolution.set(w, h);

    if (!this.group.visible) return;

    this._syncScenarioLabels();

    // Transição suave de iluminação Dia / Madrugada
    const wantNight = !!(this.sim.story.active && this.sim.story.currentAct?.nightLight);
    if (this.sm.lighting?.updateNightMode) {
      this.sm.lighting.updateNightMode(wantNight, dt);
    }

    if (this.cloudGroup) {
      this.cloudGroup.position.y = Math.sin(this.sim.time * 0.9) * 0.16;
    }

    if (this.waterMesh) {
      const lvl = this.sim.fieldState.reservoirLevel;
      this.waterMesh.scale.y = Math.max(0.2, Math.min(1, lvl));
      this.waterMesh.position.y = 1.35 + 1.4 * this.waterMesh.scale.y;
      this.waterMesh.material.color.setHex(
        this.sim.activeScenario === 'power_outage_cascade' ? 0xef4444 : COLORS.waterBright
      );
    }

    // Se houver queda de energia, a bomba da EEA-01 para de girar
    for (let i = 0; i < this.impellers.length; i++) {
      if (this.sim.activeScenario === 'power_outage_cascade' && i < 2) continue;
      this.impellers[i].rotation.z += dt * 5.0 * (this.sim.running ? this.sim.speed : 0);
    }

    // Animação do jato de vazamento subterrâneo (VRP burst ou Narrativa 2)
    const showLeak =
      this.sim.activeScenario === 'vrp_burst_leak' ||
      (this.sim.story.active && this.sim.story.currentAct?.leakEffect);
    if (showLeak && this.leakJets) {
      for (let j = 0; j < this.leakJets.length; j++) {
        const s = 0.75 + 0.35 * Math.sin(this.sim.time * 9 + j * 1.4);
        this.leakJets[j].scale.set(1, s, 1);
      }
    }

    // Animação de relâmpago na tempestade severa
    if (this.sim.activeScenario === 'severe_weather' && this.lightningBolt) {
      this.lightningBolt.visible = Math.sin(this.sim.time * 14) > 0.65;
    }

    for (const [k, ring] of Object.entries(this.pulseRings)) {
      const p = this.sim.fieldState.sensorPulse[k] || 0;
      ring.material.opacity = p * 0.88;
      const s = 1 + (1 - p) * 1.35;
      ring.scale.set(s, s, 1);
    }

    const pkts = this.sim.fieldPackets;
    for (let i = 0; i < this.pktMeshes.length; i++) {
      const mesh = this.pktMeshes[i];
      const pkt = pkts[i];
      if (!pkt || !this.routes[pkt.route]) {
        mesh.visible = false;
        continue;
      }
      this.routes[pkt.route].at(pkt.t, this._tmp);
      mesh.position.copy(this._tmp);
      mesh.material = pkt.route === 'rtu_dhuo' || pkt.kind === 'use' ? M.glowPink : M.glowCyan;
      mesh.visible = true;
    }
  }
}
