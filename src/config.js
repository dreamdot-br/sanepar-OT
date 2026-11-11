// Parâmetros do layout CONCEITUAL e da simulação — Sanepar OT & Lakehouse GCP.
// Os volumes do inventário vêm de "Inventário Lakehouse SANEPAR 2.html" (lido do GCP em 26/10/2026).
// Os tempos e taxas de pacotes na tela são ILUSTRATIVOS e acelerados para visualização.

export const DT = 1 / 60;
export const TICKS_PER_SEC = 60;
export const SEED = 20261026;

// ---- Paleta Engineering Design System + Camadas do Inventário Lakehouse ------
export const COLORS = {
  bg: 0x090b10,
  floor: 0x0d121a,
  subsoil: 0x121822,
  earthCut: 0x1a2230,
  terrainHill: 0x162926,
  terrainGrass: 0x1c342e,
  asphalt: 0x171d26,
  sidewalk: 0x26303d,
  buildingGlass: 0x1e3246,
  buildingEdge: 0x3b5875,
  steel: 0x8793a6,
  steelDark: 0x3b4452,
  frame: 0x232b36,
  concrete: 0x566273,
  water: 0x0b6e78,
  waterBright: 0x2edce6,
  engPink: 0xc51b88,
  engCyan: 0x2edce6,
  engOrange: 0xe76b1e,
  white: 0xfcfcfc,
  green: 0x34d399,
  yellow: 0xfacc15,
  red: 0xef4444,
  // Cores canônicas das camadas do Inventário Lakehouse SANEPAR
  layerSrc: 0x7ea865,
  layerIng: 0xe3a04a,
  layerRaw: 0x8fa3bd,
  layerTru: 0x2edce6,
  layerRef: 0x5c8df6,
  layerGov: 0xbba0e2,
  layerUse: 0xc51b88,
};

// ---- Cena 1: Cidade 3D + Rede Subterrânea + Nuvem DHuO/GCP ------------------
export const FIELD_PLAN = {
  hill: { x: -13.5, z: -2.0, w: 9.5, d: 13.5, h: 2.2 },
  reservoir: { x: -13.8, y: 2.2, z: -2.2, r: 3.6, h: 4.2 },
  pumpHouse: { x: -5.2, y: 0.0, z: -2.2, w: 4.2, d: 3.6, h: 2.4 },
  vrpPit: { x: 2.6, y: -0.65, z: -0.8, w: 3.2, d: 2.6, h: 1.3 },
  rtuBuilding: { x: -4.8, y: 0.0, z: 4.2 },
  // Nuvem flutuante no alto (sem postes físicos no chão)
  cloudDeck: { x: 4.5, y: 11.2, z: -6.5 },
  dhuoGateway: { x: 0.8, y: 11.3, z: -6.5 },
  gcpCloud: { x: 8.2, y: 11.3, z: -6.5 },
};

// ---- Cena 2: Plataforma de Dados (Lakehouse em camadas) ---------------------
export const LAKEHOUSE_BANDS = [
  { id: 'src', label: '1. Fontes & Gateway DHuO', x: -18, color: COLORS.layerSrc, hex: '#7ea865' },
  { id: 'ing', label: '2. Ingestão (Quente + Diário)', x: -10.5, color: COLORS.layerIng, hex: '#e3a04a' },
  { id: 'raw', label: '3. RAW (Parquet + Iceberg)', x: -3, color: COLORS.layerRaw, hex: '#8fa3bd' },
  { id: 'tru', label: '4. Trusted (BigQuery)', x: 4.5, color: COLORS.layerTru, hex: '#2edce6' },
  { id: 'ref', label: '5. Refined (Produto de Dados)', x: 12, color: COLORS.layerRef, hex: '#5c8df6' },
  { id: 'use', label: '6. Consumo (Looker)', x: 19, color: COLORS.layerUse, hex: '#c51b88' },
];

// ---- Tempos da simulação (acelerados para visualização fluida) --------------
export const SIM_RATES = {
  terceirosCycleSec: 3.2,
  proprioCycleSec: 1.8,
  icebergConvertSec: 6.4,
  fieldPulseSec: 0.95,
  packetTransitSec: 1.75,
  terceirosBatchReads: 580,
  proprioBatchReads: 76,
};

// ---- Sequência "Reproduzir Madrugada" (03:45 → 05:40 compactada em ~40s) ----
export const NIGHT_PHASES = [
  {
    id: 'reconciliacao_busca',
    clock: '03:45',
    durationSec: 7.0,
    title: '03:45 · Reconciliação D-3 a D-1 (Busca)',
    detail: 'sch-telemetria-rec-terceiros-busca e proprio-busca acionam cr-telemetria-backfill para identificar lacunas dos últimos 3 dias nos dois parques.',
    activeNodes: ['src_historian', 'dhuo_gw', 'ing_reconciliacao'],
    activeLinks: ['src-dhuo', 'dhuo-rec'],
  },
  {
    id: 'reconciliacao_carga',
    clock: '04:45',
    durationSec: 7.0,
    title: '04:45 · Reconciliação (Carga na RAW / Trusted)',
    detail: 'Grava apenas as leituras faltantes em Parquet (fd_sanepar_raw_telemetria_*) e expõe nas tabelas externas ext_sanepar_trusted_telemetria_backfill*.',
    activeNodes: ['ing_reconciliacao', 'raw_gcs', 'tru_telemetria'],
    activeLinks: ['rec-raw', 'raw-tru-ext'],
  },
  {
    id: 'cadastros_raw',
    clock: '05:00 → 05:20',
    durationSec: 8.5,
    title: '05:00–05:20 · Retratos Diários de Cadastro e Geografia',
    detail: '05:00 cr-metadata-discovery (17.278 tags, 5.756 devices) · 05:10 cr-cadastro-borg e cr-arcgis-geo (12 camadas) · 05:20 cr-cadastro-operacional (BOPE 20.116 + SDOA 11.848).',
    activeNodes: ['src_cadastros', 'dhuo_gw', 'ing_cadastros', 'raw_cadastro_org_op', 'raw_geo'],
    activeLinks: ['cad-dhuo', 'dhuo-ing-cad', 'ing-cad-raw', 'ing-cad-geo'],
  },
  {
    id: 'trusted_dataform',
    clock: '05:30',
    durationSec: 7.5,
    title: '05:30 · Dataform Trusted (SCD2 + Geografia Tipada)',
    detail: 'Workflows wf-sanepar-trusted-cadastro e wf-sanepar-trusted-geo versionam tags/equipamentos (SCD2) e tipam as 12 camadas geográficas + 24 assertions de qualidade.',
    activeNodes: ['gov_dataform', 'raw_cadastro_org_op', 'raw_geo', 'tru_cadastro_geo'],
    activeLinks: ['raw-tru-cad', 'raw-tru-geo', 'gov-tru'],
  },
  {
    id: 'refined_parametros',
    clock: '05:35',
    durationSec: 5.5,
    title: '05:35 · Dataform Refined — Parâmetros de Regra de Negócio',
    detail: 'wf-sanepar-refined-parametro atualiza catálogo (22 parâmetros), faixas, réguas e decisões que fundamentam os limiares dos painéis.',
    activeNodes: ['gov_dataform', 'ref_parametros'],
    activeLinks: ['gov-ref-param'],
  },
  {
    id: 'refined_paineis',
    clock: '05:40',
    durationSec: 8.5,
    title: '05:40 · Dataform Refined — Pressão (D4), Geografia e Energia (D6)',
    detail: 'wf-sanepar-refined-pressao-dia (3.587 pontos), wf-sanepar-refined-geo e wf-sanepar-refined-energia-dia (190 unidades) concluem antes das 06:00 para leitura nos painéis Looker.',
    activeNodes: ['tru_telemetria', 'tru_cadastro_geo', 'ref_parametros', 'ref_pressao', 'ref_energia', 'use_d0', 'use_d4', 'use_d6'],
    activeLinks: ['tru-ref-pressao', 'tru-ref-energia', 'param-ref-pressao', 'param-ref-energia', 'ref-d0', 'ref-d4', 'ref-d6'],
  },
];

// ---- Presets de câmera (Modo 1 = Grande Diorama Urbano Cutaway 3D) ----------
export const CAMERA_PRESETS = {
  campo_geral: { pos: [4.0, 29.0, 46.0], target: [0.0, 2.5, 0.0], fit: true, mode: 'operacional', label: 'Visão Geral Cidade & Nuvem' },
  campo_manancial: { pos: [-34.0, 14.0, 18.0], target: [-22.0, 1.5, -10.0], fit: false, mode: 'operacional', label: 'Captação, Poços & ETA' },
  campo_reservatorio: { pos: [-14.0, 13.0, 16.0], target: [-6.0, 2.5, -10.0], fit: false, mode: 'operacional', label: 'Reservatórios & Elevatórias (D6)' },
  campo_remanejamento: { pos: [21.0, 18.5, 19.0], target: [20.5, 2.0, -8.5], fit: false, mode: 'operacional', label: 'Remanejamento R2 Norte → R4 Leste' },
  campo_rede: { pos: [8.0, 13.5, 28.0], target: [4.0, -0.5, 4.0], fit: false, mode: 'operacional', label: 'Bairros, VRPs & Subsolo (D4)' },
  campo_gateway: { pos: [2.0, 21.0, 10.0], target: [2.0, 15.8, -11.5], fit: false, mode: 'operacional', label: 'Nuvem DHuO → Lakehouse GCP' },
};
