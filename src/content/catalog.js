// Catálogo canônico de dados, equipamentos de campo e objetos do Lakehouse GCP.
// Sincronizado integralmente com "Inventário Lakehouse SANEPAR 2.html" (lido do GCP em 26/10/2026, 18:11).

export const FIDELITY = {
  inv: {
    id: 'inv',
    short: 'Inventário GCP',
    label: 'Construído e rodando no GCP',
    desc: 'Objeto permanente auditado em sanepar-dhuo-nonprd / gateway DHuO de produção (26/10/2026, 18:11).',
  },
  arq: {
    id: 'arq',
    short: 'Consumo Looker',
    label: 'Entrada pronta para painel',
    desc: 'Views e fatos na camada Refined prontos para leitura direta pelos painéis no Looker.',
  },
  sim: {
    id: 'sim',
    short: 'Simulado',
    label: 'Contador da simulação',
    desc: 'Gerado pelo motor determinístico desta visualização (não consulta o BigQuery em tempo real).',
  },
};

export const GEO_COUNTS = {
  area_influencia: '1.042',
  zona_pressao: '3.955',
  distrito_medicao: '3.292',
  setor_distribuicao: '1.273',
  setor_manobra: '41.924',
  gerencia_regional: '22',
  concessao: '400',
  uo_captacao: '1.524',
  uo_eea: '2.557',
  uo_eta: '1.244',
  uo_poco: '4.177',
  uo_reservatorio: '2.606',
};

export const GEO_12_NAMES = Object.keys(GEO_COUNTS);

// Placar oficial dos 8 indicadores do Inventário Lakehouse SANEPAR 2.html
export const INVENTORY_SCORE = [
  { num: '6', label: 'fontes conectadas (via DHuO)', layer: 'src', color: '#7ea865' },
  { num: '25', label: 'tabelas na RAW (Iceberg)', layer: 'raw', color: '#8fa3bd' },
  { num: '20', label: 'objetos na Trusted (BQ)', layer: 'tru', color: '#2edce6' },
  { num: '25', label: 'objetos na Refined (BQ)', layer: 'ref', color: '#5c8df6' },
  { num: '40', label: 'regras de qualidade (as_*)', layer: 'gov', color: '#bba0e2' },
  { num: '8', label: 'jobs de coleta e carga', layer: 'ing', color: '#e3a04a' },
  { num: '16', label: 'agendamentos (sch + wf)', layer: 'ing', color: '#e3a04a' },
  { num: '7', label: 'credenciais Secret Manager', layer: 'use', color: '#c51b88' },
];

// Pulsos contínuos do Relógio da Operação (aba C do Inventário)
export const INVENTORY_PULSES = [
  {
    title: 'Coletor de terceiros',
    name: 'sanepar-coletor-v16',
    freq: '720 ciclos/dia',
    periodSec: 120,
    layer: 'ing',
    color: '#e3a04a',
    detail: 'a cada 120 s · 17.278 tags por ciclo (Dataflow streaming)',
  },
  {
    title: 'Coletor do parque próprio',
    name: 'cr-telemetria-proprio',
    freq: '1.440 execuções/dia',
    periodSec: 60,
    layer: 'tru',
    color: '#2edce6',
    detail: 'a cada 1 min · ≈ 1.200 leituras novas por minuto',
  },
  {
    title: 'Conversão para Iceberg',
    name: 'cr-iceberg-raw-measures',
    freq: '144 execuções/dia',
    periodSec: 600,
    layer: 'raw',
    color: '#8fa3bd',
    detail: 'a cada 10 min · converte Parquet em RAW legível no BigQuery',
  },
];

// ---- Cartões executivos fixos por modo (público: Diretoria / Comitê Sanepar) -
export const EXECUTIVE_CARDS = {
  operacional: [
    {
      eyebrow: '1 · Origem no Saneamento',
      title: 'Da instrumentação de campo ao barramento corporativo',
      metric: '19.552 tags',
      metricSub: '17.278 parque terceiros + 2.274 parque próprio (SCADA)',
      bullets: [
        'Captações (1.524), poços (4.177), ETAs (1.244), reservatórios (2.606), EEAs (2.557) e VRPs/DMCs geram leituras contínuas de nível, pressão, vazão e energia.',
        'A operação local nunca depende da nuvem para manobra física; os Historians consolidam as séries e expõem via API segura.',
      ],
      fid: 'inv',
    },
    {
      eyebrow: '2 · Integração Segura',
      title: 'Gateway DHuO de produção como fronteira única OT / TI',
      metric: '6 fontes · 7 secrets',
      metricSub: '2 Historians + BORG + BOPE + SDOA + ArcGIS Portal',
      bullets: [
        'Todas as seis fontes da Sanepar são lidas pelo gateway DHuO de produção com autenticação e isolamento de rede.',
        '7 credenciais protegidas no Secret Manager (sm_sanepar_*) + 7 imagens em Artifact Registry + 3 repositórios GitLab.',
      ],
      fid: 'inv',
    },
    {
      eyebrow: '3 · Frescor e Continuidade',
      title: 'Caminho quente 24×7 + reconciliação automática D-3 a D-1',
      metric: '120 s / 1 min',
      metricSub: 'Histórico contínuo desde 28/08/2025 · 2,18 bi leituras',
      bullets: [
        'De dia e de noite: sanepar-coletor-v16 (720 ciclos/dia, 120s), cr-telemetria-proprio (1.440/dia, 1min) e cr-iceberg-raw-measures (144/dia, 10min).',
        'De madrugada (03:45–04:45), cr-telemetria-backfill relê os últimos 3 dias dos dois parques e grava só o que faltou.',
      ],
      fid: 'inv',
    },
  ],
  plataforma: [
    {
      eyebrow: '1 · Arquitetura Construída no GCP',
      title: 'RAW em Apache Iceberg (BigLake) · Trusted e Refined em BigQuery',
      metric: '25 RAW · 20 Trusted · 25 Refined',
      metricSub: '59 GB brutos na RAW (12 pastas GCS) · 275 GB (2,18 bi leituras) na Trusted',
      bullets: [
        'Dataflow grava a Trusted de telemetria direto (ft_sanepar_trusted_telemetria_measures) e Parquet no GCS; job converte para Iceberg a cada 10 min.',
        'Trusted mantém cadastro versionado em SCD2 (tags e devices) e 12 camadas geográficas tipadas.',
      ],
      fid: 'inv',
    },
    {
      eyebrow: '2 · Relógio da Operação & Qualidade',
      title: '3 coletores contínuos + 14 agendamentos de madrugada + 40 regras',
      metric: '03:45 → 05:40',
      metricSub: '8 jobs (Dataflow + 7 Cloud Run) · 16 agendamentos (10 Scheduler + 6 Dataform)',
      bullets: [
        '03:45→04:45 Reconciliação D-3..D-1 · 05:00→05:20 Cadastros (Tags, BORG, ArcGIS, BOPE+SDOA) · 05:30 Trusted · 05:35/05:40 Refined.',
        '40 assertions no dataset ds_org_sanepar_governance + auditoria diária ft_sanepar_governance_telemetria_reconciliacao.',
      ],
      fid: 'inv',
    },
    {
      eyebrow: '3 · Produtos de Dados Prontos para Painel',
      title: 'Os painéis Looker leem exclusivamente a camada Refined',
      metric: '3.587 pontos D4 · 190 UOs D6',
      metricSub: '8 tabelas de parâmetros (22 parâmetros, 29 decisões, 62 rastreios)',
      bullets: [
        'Pressão na rede (D4): vw_..._pressao_ponto_atual (3.587), ft_..._ponto_dia (88.173) e 5 camadas geográficas simplificadas para mapas.',
        'Energia das unidades próprias (D6): vw_..._energia_unidade_atual (190), ft_..._interrupcao (250) e ft_..._unidade_dia (1.140).',
      ],
      fid: 'inv',
    },
  ],
};

// ---- Equipamentos selecionáveis na Cena 1 (Operação de Campo) ---------------
export const FIELD_ITEMS = {
  uo_captacao: {
    id: 'uo_captacao',
    title: 'Captação Superficial & Manancial (Rio / Barragem)',
    subtitle: 'Tomada de Água Bruta, Vazão de Adução (FT) e Nível de Manancial (LT)',
    layerLabel: 'Campo OT · Captação (uo_captacao)',
    fid: 'inv',
    metrics: [
      ['Unidades de captação no ArcGIS (uo_captacao)', '1.524 unidades'],
      ['Áreas de influência mapeadas', '1.042 polígonos (Trusted) · 987 (Refined)'],
      ['Grandezas monitoradas', 'Vazão de água bruta (FT), nível da barragem (LT), status bombas'],
    ],
    objects: [
      'tb_sanepar_raw_geo_uo_captacao / dm_sanepar_trusted_geo_uo_captacao (1.524)',
      'dm_sanepar_trusted_geo_area_influencia (1.042)',
      'tb_sanepar_raw_operacional_bope_unidade_operacional (20.116)',
    ],
    description:
      'Captação superficial no manancial com barragem, gradeamento e elevatória de água bruta. Dataloggers e RTUs transmitem vazão aduzida, nível do rio e status elétrico continuamente.',
  },
  uo_poco: {
    id: 'uo_poco',
    title: 'Poços Tubulares Profundos (Captação Subterrânea)',
    subtitle: 'Bateria de Poços Artesianos · Nível Dinâmico (LT), Vazão (FT) e Energia (KFF)',
    layerLabel: 'Campo OT · Poços (uo_poco)',
    fid: 'inv',
    metrics: [
      ['Poços cadastrados na Geografia (uo_poco)', '4.177 unidades'],
      ['Sistemas produtores integrados (BOPE)', '1.115 sistemas · 10.742 vínculos'],
      ['Telemetria de operação', 'Nível estático/dinâmico, vazão de recalque, horímetro e KFF'],
    ],
    objects: [
      'tb_sanepar_raw_geo_uo_poco / dm_sanepar_trusted_geo_uo_poco (4.177)',
      'tb_sanepar_raw_operacional_bope_composicao_sistema (10.742)',
      'ft_sanepar_trusted_telemetria_measures (2,18 bi leituras)',
    ],
    description:
      'Maior parque numérico entre as unidades de produção (4.177 poços). Cada poço possui bomba submersa, cavalete com macromedidor, sensor de pressão/nível e quadro elétrico monitorado.',
  },
  uo_eta: {
    id: 'uo_eta',
    title: 'Estação de Tratamento de Água (ETA)',
    subtitle: 'Floculação, Decantação, Filtração e Macromedição de Tratado',
    layerLabel: 'Campo OT · Tratamento (uo_eta)',
    fid: 'inv',
    metrics: [
      ['ETAs mapeadas na Geografia (uo_eta)', '1.244 unidades'],
      ['Unidades de água com atributos SDOA', '11.848 unidades'],
      ['Variáveis típicas de processo', 'Vazão entrada/saída, nível de filtros, pressão e energia'],
    ],
    objects: [
      'tb_sanepar_raw_geo_uo_eta / dm_sanepar_trusted_geo_uo_eta (1.244)',
      'tb_sanepar_raw_operacional_sdoa_unidade_agua (11.848)',
      'tb_sanepar_raw_operacional_bope_sistema (1.115)',
    ],
    description:
      'Complexo de tratamento contendo tanques de floculação/decantação, casa de química e filtros rápidos. Os CLPs da ETA concentram centenas de tags enviadas ao Historian.',
  },
  uo_reservatorio: {
    id: 'uo_reservatorio',
    title: 'Centros de Reservação & Castelos d’Água (RAP / REL)',
    subtitle: 'Instrumentação de Nível (LT) e Autonomia Hídrica Distribuída na Cidade',
    layerLabel: 'Campo OT · Reservação (uo_reservatorio)',
    fid: 'inv',
    metrics: [
      ['Reservatórios na camada geo (uo_reservatorio)', '2.606 unidades'],
      ['Unidades de água no SDOA', '11.848 unidades'],
      ['Grandezas típicas', 'Nível (m / %), extravasão, volume útil, autonomia hídrica'],
    ],
    objects: [
      'tb_sanepar_raw_operacional_sdoa_unidade_agua (11.848)',
      'dm_sanepar_trusted_geo_uo_reservatorio (2.606)',
    ],
    description:
      'Reservatórios apoiados (RAP) nos centros de reservação e reservatórios elevados (REL) distribuídos pelos bairros. Medidores ultrassônicos e hidrostáticos reportam o nível (LT) continuamente.',
  },
  uo_elevatoria: {
    id: 'uo_elevatoria',
    title: 'Estações Elevatórias de Água (EEAs) & Subestações de Energia',
    subtitle: 'Monitoramento Elétrico (KFF) e Bombeamento Urbano · Painel D6',
    layerLabel: 'Campo OT · Energia & Bombeamento (D6)',
    fid: 'inv',
    metrics: [
      ['Unidades monitoradas na Refined Energia (D6)', '190 unidades próprias'],
      ['Sinais de status elétrico (dm_..._tag_status)', '190 tags'],
      ['Interrupções registradas (ft_..._interrupcao)', '250 eventos · 1.140 linhas/dia'],
      ['EEAs mapeadas no ArcGIS (uo_eea)', '2.557 unidades'],
    ],
    objects: [
      'vw_sanepar_refined_energia_unidade_atual (190 unidades)',
      'ft_sanepar_refined_energia_interrupcao (250)',
      'ft_sanepar_refined_energia_unidade_dia (1.140)',
      'dm_sanepar_refined_energia_ponto (190)',
    ],
    description:
      'Conjuntos motobomba e subestações elétricas espalhados pela cidade para vencer desníveis topográficos. Sinais de falta de fase/energia (KFF) alimentam diretamente o Painel D6.',
  },
  uo_rede_vrp: {
    id: 'uo_rede_vrp',
    title: 'Zonas de Pressão, Câmaras VRP & Macromedidores (DMC)',
    subtitle: 'Monitoramento de Pressão (PT / MCA) e Vazão Distrital (FT) · Painel D4',
    layerLabel: 'Campo OT · Rede de Distribuição (D4)',
    fid: 'inv',
    metrics: [
      ['Pontos de pressão na Refined (vw_..._pressao_ponto_atual)', '3.587 pontos ativos'],
      ['Série diária de pressão (ft_..._pressao_ponto_dia)', '88.173 registros (mín/máx/média)'],
      ['Zonas de pressão / DMCs (Refined Geo)', '3.776 zonas · 3.251 DMCs'],
      ['Setores de distribuição (Trusted Geo)', '1.273 setores'],
    ],
    objects: [
      'vw_sanepar_refined_distribuicao_agua_pressao_ponto_atual (3.587)',
      'ft_sanepar_refined_distribuicao_agua_pressao_ponto_dia (88.173)',
      'dm_sanepar_refined_distribuicao_agua_pressao_ponto_geo (3.533)',
      'dm_sanepar_refined_distribuicao_agua_pressao_parametro_regra (10)',
    ],
    description:
      'Câmaras subterrâneas com Válvulas Redutoras de Pressão (VRP), macromedidores de Distrito de Medição e Controle (DMC) e dataloggers de ponto crítico espalhados sob as avenidas da cidade.',
  },
  uo_setor_manobra: {
    id: 'uo_setor_manobra',
    title: 'Setores de Manobra, Bairros & Ligações Prediais',
    subtitle: 'Malha Subterrânea Urbana, Registros de Manobra e Consumo Residencial/Comercial',
    layerLabel: 'Campo OT · Malha Urbana & GIS',
    fid: 'inv',
    metrics: [
      ['Setores de manobra no ArcGIS (setor_manobra)', '41.924 polígonos'],
      ['Municípios da concessão / Localidades BORG', '400 concessões · 670 localidades · 22 GR'],
      ['Vínculos Gerência × Localidade', '6.314 registros'],
    ],
    objects: [
      'dm_sanepar_trusted_geo_setor_manobra (41.924)',
      'dm_sanepar_trusted_geo_concessao (400) / gerencia_regional (22)',
      'tb_sanepar_raw_organizacional_localidade (670)',
    ],
    description:
      'Representa a capilaridade urbana atendida pela Sanepar: dezenas de quarteirões, residências, edifícios e setores de manobra conectados à malha subterrânea e cruzados com a geografia no BigQuery.',
  },
  uo_rtu_historian: {
    id: 'uo_rtu_historian',
    title: 'Concentradores RTU / Dataloggers & Servidores Historian',
    subtitle: '5.756 Devices de Telemetria Consolidando 19.552 Tags na Rede Sanepar',
    layerLabel: 'Ambiente Sanepar · Telemetria OT',
    fid: 'inv',
    metrics: [
      ['Total de tags monitoradas', '19.552 tags (17.278 terceiros + 2.274 próprio)'],
      ['Equipamentos (devices) cadastrados', '5.756 devices'],
      ['Início da série histórica contínua', '28/08/2025 (2,18 bi leituras na Trusted)'],
    ],
    objects: [
      'tb_sanepar_raw_cadastro_tag (17.278) / dm_sanepar_trusted_cadastro_tag',
      'tb_sanepar_raw_cadastro_device (5.756) / dm_sanepar_trusted_cadastro_device',
      'ft_sanepar_trusted_telemetria_measures (2,18 bi · 275 GB)',
    ],
    description:
      'Centenas de RTUs, CLPs e dataloggers celulares espalhados pelos poços, ETAs, reservatórios, EEAs e VRPs transmitem leituras sem parar para os Historians (terceiros e SCADA próprio).',
  },
  campo_dhuo_gw: {
    id: 'campo_dhuo_gw',
    title: 'Nuvem · Gateway DHuO (Produção) → Lakehouse GCP',
    subtitle: 'API Management Corporativo Recebendo Todo o Fluxo da Cidade → southamerica-east1',
    layerLabel: 'Integração em Nuvem · DHuO + GCP',
    fid: 'inv',
    metrics: [
      ['Fontes lidas pelo gateway DHuO de produção', '6 fontes (2 Historians + BORG + BOPE + SDOA + ArcGIS)'],
      ['Credenciais no Secret Manager', '7 secrets (sm_sanepar_*)'],
      ['Frescor do caminho quente', '120 s (Dataflow streaming) / 1 min (Cloud Run Job)'],
    ],
    objects: [
      'sanepar-coletor-v16 (Dataflow 120s) + cr-telemetria-proprio (1min)',
      'sm_sanepar_user_key_prod_telemetria / borg / bope / sdoa',
      'sanepar-lakehouse-raw-nonprd (Iceberg) → Trusted → Refined',
    ],
    description:
      'Na nuvem, o Gateway DHuO governa e autentica o recebimento contínuo das 19.552 tags vindas de toda a cidade e entrega os dados aos coletores do Lakehouse no GCP.',
  },
};

// ---- 5 Cenários Interativos de Falha & Inteligência Operacional na Cidade 3D ----
export const FIELD_SCENARIOS = {
  power_outage_cascade: {
    id: 'power_outage_cascade',
    shortLabel: '1 · Queda de Energia (D6 → Autonomia)',
    title: 'Queda de Energia na Elevatória → Risco de Desabastecimento em Cascata',
    severity: 'critical',
    cameraPreset: 'campo_reservatorio',
    highlightItem: 'uo_elevatoria',
    tagAlert: {
      uid: 'SNP-CTB-EEA01-KFF01',
      parque: 'Próprio SCADA (1m)',
      valor: 'FALTA DE ENERGIA (0) · Nível RAP: 28% (Crítico)',
      dest: 'Refined Energia (D6) + Autonomia',
    },
    beforeText:
      'O sinal de falta de fase (KFF) na elevatória ficava isolado no SCADA elétrico, enquanto o nível do reservatório caía silenciosamente até faltar água nos bairros.',
    nowText:
      'O coletor de 1 min atualiza vw_sanepar_refined_energia_unidade_atual, abre o evento em ft_..._energia_interrupcao e cruza via BOPE/SDOA qual reservatório depende daquela EEA, calculando a autonomia restante (3,8 h) antes do desabastecimento.',
    objectsUsed: [
      'vw_sanepar_refined_energia_unidade_atual (190 UOs)',
      'ft_sanepar_refined_energia_interrupcao (início, fim e duração)',
      'tb_sanepar_raw_operacional_bope_composicao_sistema (10.742 vínculos)',
    ],
  },
  severe_weather: {
    id: 'severe_weather',
    shortLabel: '2 · Tempestade Severa (Clima → Poços/ETA)',
    title: 'Frente de Tempestade Severa → Pré-Alarme em Manancial, Poços e Rede Elétrica',
    severity: 'warning',
    cameraPreset: 'campo_manancial',
    highlightItem: 'uo_poco',
    tagAlert: {
      uid: 'SNP-LON-POC18-KFF01',
      parque: 'Terceiros (120s) + Geo',
      valor: 'ALERTA METEOROLÓGICO · 4 Poços + 1 Captação na Área de Risco',
      dest: 'Trusted Geo + Refined Energia (D6)',
    },
    beforeText:
      'Chuvas intensas desligavam dezenas de poços artesianos distantes e elevavam a turbidez na captação sem visão espacial consolidada de quais sistemas seriam afetados.',
    nowText:
      'O cruzamento espacial entre as polígonais geográficas (dm_sanepar_trusted_geo_area_influencia e uo_poco / uo_captacao) identifica preventivamente as UOs sob a mancha de tempestade para manobra antecipada de reservação.',
    objectsUsed: [
      'dm_sanepar_trusted_geo_uo_poco (4.177) & uo_captacao (1.524)',
      'dm_sanepar_refined_distribuicao_agua_geo_area_influencia (987)',
      'vw_sanepar_refined_energia_unidade_atual (190 UOs)',
    ],
  },
  vrp_burst_leak: {
    id: 'vrp_burst_leak',
    shortLabel: '3 · Falha VRP & Vazamento Subterrâneo (D4)',
    title: 'Sobrepressão em VRP + Vazamento Oculto na Rede Subterrânea',
    severity: 'critical',
    cameraPreset: 'campo_rede',
    highlightItem: 'uo_rede_vrp',
    tagAlert: {
      uid: 'SNP-CTB-DMC02-PT03',
      parque: 'Terceiros (120s)',
      valor: '68,4 mca (LIMITE MAX: 50 mca) · Vazão Mín Noturna +42%',
      dest: 'Refined Pressão (D4) + Anomalias Vazão',
    },
    beforeText:
      'Uma VRP travada aberta durante a madrugada gerava sobrepressão e rompia tubulações subterrâneas sem aflorar no asfalto, mantendo perda física invisível por dias.',
    nowText:
      'As leituras de 120 s em vw_sanepar_refined_distribuicao_agua_pressao_ponto_atual são comparadas com as réguas vigentes (pm_sanepar_refined_parametro_faixa), apontando na hora a VRP fora de faixa e o salto de vazão no DMC.',
    objectsUsed: [
      'vw_sanepar_refined_distribuicao_agua_pressao_ponto_atual (3.587 pontos)',
      'dm_sanepar_refined_distribuicao_agua_pressao_parametro_regra (10)',
      'pm_sanepar_refined_parametro_faixa (23 réguas e faixas)',
    ],
  },
  planned_maintenance: {
    id: 'planned_maintenance',
    shortLabel: '4 · Manobra Programada (Setor #1408)',
    title: 'Intervenção Programada em Campo → Isolamento de Setor sem Falso Alarme',
    severity: 'info',
    cameraPreset: 'campo_rede',
    highlightItem: 'uo_setor_manobra',
    tagAlert: {
      uid: 'SNP-CTB-SM1408-PT01',
      parque: 'Terceiros (120s) + Parâmetros',
      valor: '0,8 mca · JANELA PROGRAMADA ATIVA (08:00–12:00)',
      dest: 'Refined Parâmetros + Geo Setor Manobra',
    },
    beforeText:
      'O fechamento de registro para manutenção planejada derrubava a pressão dos sensores a jusante e inundava o CCO com falsos alarmes de rompimento.',
    nowText:
      'O polígono do setor (dm_sanepar_trusted_geo_setor_manobra — 41.924 setores) e a janela cadastrada (pm_sanepar_refined_parametro_janela_diaria) qualificam automaticamente a queda de pressão como intervenção planejada.',
    objectsUsed: [
      'dm_sanepar_trusted_geo_setor_manobra (41.924 polígonos)',
      'pm_sanepar_refined_parametro_janela_diaria (janelas horárias)',
      'dm_sanepar_refined_distribuicao_agua_pressao_ponto_geo (3.533)',
    ],
  },
  critical_low_pressure: {
    id: 'critical_low_pressure',
    shortLabel: '5 · Subpressão em Ponto Crítico (< 10 mca)',
    title: 'Subpressão em Ponta de Rede / Cota Alta durante Horário de Pico',
    severity: 'warning',
    cameraPreset: 'campo_rede',
    highlightItem: 'uo_rede_vrp',
    tagAlert: {
      uid: 'SNP-MGA-DMC09-PT04',
      parque: 'Terceiros (120s)',
      valor: '6,8 mca (ABAIXO DO MÍNIMO REGULATÓRIO 10 mca)',
      dest: 'Refined Pressão (D4 · Ponto Crítico)',
    },
    beforeText:
      'A pressão na saída da ETA/Reservatório parecia normal (38 mca), mas imóveis nas pontas de rede mais altas sofriam falta de pressão no horário de pico sem visibilidade no CCO.',
    nowText:
      'Os 3.587 sensores distribuídos nas zonas de pressão (dm_..._geo_zona_pressao) expõem em tempo real (frescor 120 s) exatamente quais DMCs violaram a faixa mínima parametrizada.',
    objectsUsed: [
      'vw_sanepar_refined_distribuicao_agua_pressao_ponto_atual (3.587)',
      'ft_sanepar_refined_distribuicao_agua_pressao_ponto_dia (88.173)',
      'dm_sanepar_refined_distribuicao_agua_geo_zona_pressao (3.776)',
    ],
  },
};

// ---- Nós da Frente 2 (Plataforma de Dados / Lakehouse GCP) — 100% Fiel ao Inventário 2.html ----
export const LAKEHOUSE_NODES = {
  // 1. FONTES SANEPAR & BARRAMENTO DHuO
  src_historian: {
    id: 'src_historian',
    band: 'src',
    title: 'Telemetria (2 Parques)',
    sub: 'Terceiros (17.278 tags) + Próprio SCADA (2.274 tags)',
    pos: [-18, 2.2, -3.6],
    fid: 'inv',
    badge: '19.552 tags · 2 fontes',
    metrics: [
      ['Historian · parque de terceiros', '17.278 tags (lido a cada 120 s)'],
      ['Historian · parque próprio (SCADA)', '2.274 tags (lido a cada 1 min)'],
      ['Equipamentos cadastrados (devices)', '5.756 equipamentos'],
    ],
    objects: [
      'Fontes externas · Historian · parque de terceiros (17.278 tags)',
      'Fontes externas · Historian · parque próprio SCADA (2.274 tags)',
    ],
    description:
      'Dois parques de telemetria operacional da Sanepar lidos continuamente pelo gateway DHuO de produção.',
  },
  src_cadastros: {
    id: 'src_cadastros',
    band: 'src',
    title: 'Cadastros Corporativos & ArcGIS',
    sub: 'BORG (186 un) · BOPE (20.116 UOs) · SDOA (11.848) · ArcGIS (12)',
    pos: [-18, 2.2, 3.2],
    fid: 'inv',
    badge: '4 fontes corporativas',
    metrics: [
      ['BORG · estrutura organizacional', '186 unidades · 22 GR · 670 localidades'],
      ['BOPE · unidades operacionais', '20.116 unidades · 1.115 sistemas'],
      ['SDOA · atributos das unidades', '11.848 unidades de água'],
      ['ArcGIS Portal · cadastro geográfico', '12 camadas espaciais'],
    ],
    objects: [
      'BORG · estrutura organizacional (186 unidades · 22 GR · 670 localidades)',
      'BOPE · unidades operacionais (20.116 unidades · 1.115 sistemas)',
      'SDOA · atributos das unidades (11.848 unidades)',
      'ArcGIS Portal · cadastro geográfico (12 camadas)',
    ],
    description:
      'Quatro fontes corporativas e geográficas lidas todas as madrugadas (05:00 às 05:20) via gateway DHuO de produção.',
  },
  dhuo_gw: {
    id: 'dhuo_gw',
    band: 'src',
    title: 'Gateway DHuO · Produção',
    sub: '6 fontes conectadas · 7 secrets (sm_sanepar_*) · 3 repos GitLab',
    pos: [-14.2, 3.6, -0.2],
    fid: 'inv',
    accent: 'pink',
    badge: '6 fontes · 7 secrets',
    metrics: [
      ['Fontes lidas pelo Gateway DHuO de produção', '6 fontes (2 Telemetria + 4 Cadastros/GIS)'],
      ['Credenciais protegidas (Secret Manager)', '7 secrets (sm_sanepar_*)'],
      ['Código versionado (GitLab)', '3 repositórios (engbr/energy-and-utilities/sanepar)'],
    ],
    objects: [
      'sm_sanepar_user_key_prod_telemetria (Historian)',
      'sm_sanepar_user_key_prod_borg / bope / sdoa',
      'sm_sanepar_arcgis_portal_token (ArcGIS)',
      'sm_sanepar_gitlab_trusted_token / refined_token',
      'GitLab: pipelines_sanepar · df_org_sanepar_trusted · df_org_sanepar_refined',
    ],
    description:
      'Barramento corporativo de produção que intermedia todas as 6 fontes da Sanepar com os coletores do projeto sanepar-dhuo-nonprd no GCP.',
  },

  // 2. INGESTÃO (1 Dataflow + 7 Cloud Run Jobs + 10 Cloud Schedulers + 7 imagens Artifact Registry)
  ing_quente: {
    id: 'ing_quente',
    band: 'ing',
    title: 'Caminho Quente (Contínuo 24×7)',
    sub: 'sanepar-coletor-v16 (120s) · cr-telemetria-proprio (1m) · cr-iceberg (10m)',
    pos: [-10.5, 2.5, -4.2],
    fid: 'inv',
    badge: '720 + 1.440 + 144 /dia',
    metrics: [
      ['Dataflow streaming (terceiros)', 'sanepar-coletor-v16 · a cada 120 s (720 ciclos/dia)'],
      ['Cloud Run Job (parque próprio)', 'cr-telemetria-proprio + sch-*-1min (1.440 exec/dia · ≈1.200 leituras/min)'],
      ['Conversão Parquet → Iceberg', 'cr-iceberg-raw-measures + sch-*-10min (144 exec/dia)'],
    ],
    objects: [
      'sanepar-coletor-v16 (Dataflow · southamerica-east1 · a cada 120 s)',
      'cr-telemetria-proprio + sch-telemetria-proprio-1min (* * * * *)',
      'cr-iceberg-raw-measures + sch-iceberg-raw-measures-10min (*/10 * * * *)',
      'Artifact Registry (pipelines): parquet-iceberg, telemetria-proprio',
    ],
    description:
      'Três coletores rodam sem parar: Dataflow grava a Trusted de telemetria direto e Parquet na RAW; o job de 10 min converte o Parquet em tabela Iceberg.',
  },
  ing_reconciliacao: {
    id: 'ing_reconciliacao',
    band: 'ing',
    title: 'Reconciliação Diária (D−3 a D−1)',
    sub: 'cr-telemetria-backfill · 03:45 busca · 04:45 carga (2 parques)',
    pos: [-10.5, 2.5, 0.0],
    fid: 'inv',
    badge: '03:45 → 04:45 · 4 sch-*',
    metrics: [
      ['Cloud Run Job', 'cr-telemetria-backfill (imagem: pipelines/telemetria-backfill)'],
      ['Busca às 03:45 (45 3 * * *)', 'sch-telemetria-rec-terceiros-busca + sch-telemetria-rec-proprio-busca'],
      ['Carga às 04:45 (45 4 * * *)', 'sch-telemetria-rec-terceiros-carga + sch-telemetria-rec-proprio-carga'],
    ],
    objects: [
      'cr-telemetria-backfill (03:45 / 04:45)',
      'sch-telemetria-rec-terceiros-busca (45 3 * * *)',
      'sch-telemetria-rec-proprio-busca (45 3 * * *)',
      'sch-telemetria-rec-terceiros-carga (45 4 * * *)',
      'sch-telemetria-rec-proprio-carga (45 4 * * *)',
    ],
    description:
      'Relê os últimos 3 dias dos dois parques todas as madrugadas e grava só o que o tempo real não trouxe, terminando 45 min antes de qualquer cálculo.',
  },
  ing_cadastros: {
    id: 'ing_cadastros',
    band: 'ing',
    title: 'Cadastros & Geografia (Retrato Diário)',
    sub: '05:00 metadata-discovery · 05:10 borg + arcgis-geo · 05:20 operacional',
    pos: [-10.5, 2.5, 4.2],
    fid: 'inv',
    badge: '05:00 → 05:20 · 4 cr-*',
    metrics: [
      ['05:00 Tags e equipamentos', 'cr-metadata-discovery + sch-metadata-discovery-daily (0 5 * * *)'],
      ['05:10 Estrutura BORG', 'cr-cadastro-borg + sch-cadastro-borg-daily (10 5 * * *)'],
      ['05:10 Camadas ArcGIS', 'cr-arcgis-geo + sch-arcgis-geo-daily (10 5 * * *)'],
      ['05:20 BOPE + SDOA', 'cr-cadastro-operacional + sch-cadastro-operacional-daily (20 5 * * *)'],
    ],
    objects: [
      'cr-metadata-discovery + sch-metadata-discovery-daily (05:00)',
      'cr-cadastro-borg + sch-cadastro-borg-daily (05:10)',
      'cr-arcgis-geo + sch-arcgis-geo-daily (05:10)',
      'cr-cadastro-operacional + sch-cadastro-operacional-daily (05:20)',
      'Artifact Registry: metadata-discovery, cadastro-borg, cadastro-operacional, arcgis-geo',
    ],
    description:
      'Quatro Cloud Run Jobs agendados entre 05:00 e 05:20 atualizam na RAW o retrato diário de tags, BORG, ArcGIS e BOPE/SDOA.',
  },

  // 3. RAW (25 tabelas Iceberg em 6 datasets + 12 pastas GCS em gs://sanepar-lakehouse-raw-nonprd)
  raw_gcs: {
    id: 'raw_gcs',
    band: 'raw',
    title: 'RAW Telemetria & Cloud Storage',
    sub: 'gs://sanepar-lakehouse-raw-nonprd (59 GB) · 5 tabelas Iceberg telemetria',
    pos: [-3.0, 2.5, -3.8],
    fid: 'inv',
    badge: '59 GB · 5 tb_* + 12 pastas',
    metrics: [
      ['Arquivos brutos (GCS)', 'fd_sanepar_raw_telemetria/ (32 arq/ciclo), _proprio/, _terceiros/, _geo/'],
      ['Controle do coletor e watermark', 'fd_sanepar_control_tags/ + fd_sanepar_control_watermark/ + 6 pastas Iceberg'],
      ['Telemetria corrente (Iceberg)', 'ds_org_sanepar_raw_telemetria.tb_sanepar_raw_telemetria_measures'],
      ['Base histórica desde 28/08/2025', 'ds_org_sanepar_raw_telemetria_base_historica (4 tabelas Iceberg)'],
    ],
    objects: [
      'gs://sanepar-lakehouse-raw-nonprd: fd_sanepar_raw_telemetria/ (32 arq/ciclo)',
      'fd_sanepar_raw_telemetria_proprio/ · fd_sanepar_raw_telemetria_terceiros/',
      'fd_sanepar_control_tags/ · fd_sanepar_control_watermark/ · fd_sanepar_raw_geo/',
      'tb_sanepar_raw_telemetria_measures (ds_org_sanepar_raw_telemetria)',
      'tb_sanepar_raw_telemetria_device_measures / device_data / device_tag / fato_qualidade_tags',
    ],
    description:
      'Armazena os arquivos Parquet brutos dos coletores e da reconciliação, as marcas d’água e as 5 tabelas Iceberg de telemetria corrente e histórica (desde 28/08/2025).',
  },
  raw_cadastro_org_op: {
    id: 'raw_cadastro_org_op',
    band: 'raw',
    title: 'RAW Cadastros (Historian, BORG, BOPE, SDOA)',
    sub: 'ds_..._raw_cadastro (2) · _organizacional (4) · _operacional (4)',
    pos: [-3.0, 2.5, 0.3],
    fid: 'inv',
    badge: '8 tabelas Iceberg',
    metrics: [
      ['Cadastro do Historian (2 tb_*)', 'tb_sanepar_raw_cadastro_tag (17.278) · device (5.756)'],
      ['Organizacional BORG (4 tb_*)', 'unidade (186) · gerencia (7 tipos) · localidade (670) · gerencia_localidade (6.314)'],
      ['Operacional BOPE + SDOA (4 tb_*)', 'bope_unidade_operacional (20.116) · bope_sistema (1.115) · composicao (10.742) · sdoa_unidade_agua (11.848)'],
    ],
    objects: [
      'tb_sanepar_raw_cadastro_tag (17.278) · tb_sanepar_raw_cadastro_device (5.756)',
      'tb_sanepar_raw_organizacional_unidade (186) · gerencia · localidade (670) · gerencia_localidade (6.314)',
      'tb_sanepar_raw_operacional_bope_unidade_operacional (20.116) · bope_sistema (1.115)',
      'tb_sanepar_raw_operacional_bope_composicao_sistema (10.742) · sdoa_unidade_agua (11.848)',
    ],
    description:
      'Dez tabelas Apache Iceberg (catálogo BigLake) em 3 datasets que guardam o retrato bruto diário sem regra de negócio.',
  },
  raw_geo: {
    id: 'raw_geo',
    band: 'raw',
    title: 'RAW Geografia (ArcGIS)',
    sub: 'ds_org_sanepar_raw_geo · 12 tabelas Iceberg (tb_sanepar_raw_geo_*)',
    pos: [-3.0, 2.5, 4.3],
    fid: 'inv',
    badge: '12 tabelas Iceberg',
    metrics: [
      ['Dataset BigQuery Iceberg', 'ds_org_sanepar_raw_geo (12 tabelas)'],
      ['Divisões territoriais e rede', 'area_influencia, zona_pressao, distrito_medicao, setor_distribuicao, setor_manobra, gerencia_regional, concessao'],
      ['Unidades operacionais georreferenciadas', 'uo_captacao, uo_eea, uo_eta, uo_poco, uo_reservatorio'],
    ],
    objects: GEO_12_NAMES.map((g) => `tb_sanepar_raw_geo_${g}`),
    description:
      'Retrato bruto diário das 12 camadas geográficas extraídas do ArcGIS Portal às 05:10.',
  },

  // 4. TRUSTED (20 objetos no BigQuery nativo) + GOVERNANÇA (Dataform + 40 assertions)
  tru_telemetria: {
    id: 'tru_telemetria',
    band: 'tru',
    title: 'Trusted Telemetria',
    sub: 'ds_org_sanepar_trusted_telemetria · 4 objetos · 2,18 bi leituras (275 GB)',
    pos: [4.5, 2.6, -3.5],
    fid: 'inv',
    badge: '4 obj · 2,18 bi · 275 GB',
    metrics: [
      ['Fato unificado sem duplicata', 'ft_sanepar_trusted_telemetria_measures (2,18 bi · 275 GB)'],
      ['View de última leitura', 'vw_sanepar_trusted_telemetria_ultima_leitura'],
      ['Tabelas externas da reconciliação', 'ext_sanepar_trusted_telemetria_backfill (terceiros) + _backfill_proprio'],
    ],
    objects: [
      'ft_sanepar_trusted_telemetria_measures (2,18 bi · 275 GB)',
      'vw_sanepar_trusted_telemetria_ultima_leitura',
      'ext_sanepar_trusted_telemetria_backfill',
      'ext_sanepar_trusted_telemetria_backfill_proprio',
    ],
    description:
      'Recebe escrita direta do coletor Dataflow streaming e une os dois parques sem duplicata, além de expor os arquivos da reconciliação D−3..D−1.',
  },
  tru_cadastro_geo: {
    id: 'tru_cadastro_geo',
    band: 'tru',
    title: 'Trusted Cadastro (SCD2) & Geografia Tipada',
    sub: 'ds_..._trusted_cadastro (4) + ds_..._trusted_geo (12) · recalculados às 05:30',
    pos: [4.5, 2.6, 2.2],
    fid: 'inv',
    badge: '16 objetos · 05:30',
    metrics: [
      ['Cadastro com histórico SCD2 (4 obj)', 'dm_..._tag (17.278), dm_..._device (5.756), vw_..._tag_corrente, vw_..._device_corrente'],
      ['Geografia tipada (12 dm_*)', 'setor_manobra (41.924), uo_poco (4.177), zona_pressao (3.955), dmc (3.292), uo_reservatorio (2.606), uo_eea (2.557)...'],
    ],
    objects: [
      'dm_sanepar_trusted_cadastro_tag (17.278) · dm_sanepar_trusted_cadastro_device (5.756)',
      'vw_sanepar_trusted_cadastro_tag_corrente · vw_sanepar_trusted_cadastro_device_corrente',
      ...GEO_12_NAMES.map((g) => `dm_sanepar_trusted_geo_${g} (${GEO_COUNTS[g]})`),
    ],
    description:
      'Atualizados às 05:30 pelos workflows wf-sanepar-trusted-cadastro e wf-sanepar-trusted-geo do Dataform.',
  },
  gov_dataform: {
    id: 'gov_dataform',
    band: 'tru',
    title: 'Dataform (6 Workflows) & Governança (40 Regras)',
    sub: 'df_org_sanepar_trusted / refined · ds_org_sanepar_governance',
    pos: [4.5, 5.2, -0.6],
    fid: 'inv',
    badge: '6 wf-* · 40 as_*',
    metrics: [
      ['Workflows Trusted (05:30)', 'wf-sanepar-trusted-cadastro + wf-sanepar-trusted-geo (release sanepar-trusted-cadastro)'],
      ['Workflows Refined (05:35 / 05:40)', 'wf-sanepar-refined-parametro (05:35) · pressao-dia, geo, energia-dia (05:40)'],
      ['Qualidade · 40 assertions (ds_org_sanepar_governance)', '6 cadastro · 12 geo Trusted · 5 pressão D4 · 5 geo mapas · 6 parâmetros · 6 energia D6'],
      ['Fato de reconciliação', 'ft_sanepar_governance_telemetria_reconciliacao'],
    ],
    objects: [
      'df_org_sanepar_trusted: sanepar-trusted-cadastro, wf-sanepar-trusted-cadastro (05:30), wf-sanepar-trusted-geo (05:30)',
      'df_org_sanepar_refined: rel-sanepar-refined-main, wf-sanepar-refined-parametro (05:35)',
      'wf-sanepar-refined-pressao-dia (05:40) · wf-sanepar-refined-geo (05:40) · wf-sanepar-refined-energia-dia (05:40)',
      'ds_org_sanepar_governance: 40 regras (as_*) + ft_sanepar_governance_telemetria_reconciliacao',
    ],
    description:
      'Orquestra toda a cadeia SQL da madrugada (05:30 → 05:40) e audita a qualidade de todas as camadas com 40 assertions.',
  },

  // 5. REFINED (25 objetos em 3 datasets: 8 parametro + 9 distribuicao_agua + 8 energia)
  ref_parametros: {
    id: 'ref_parametros',
    band: 'ref',
    title: 'Refined Parâmetros de Regra de Negócio',
    sub: 'ds_org_sanepar_refined_parametro · 8 tabelas pm_* (05:35)',
    pos: [12.0, 2.5, -4.2],
    fid: 'inv',
    badge: '8 tabelas pm_* · 05:35',
    metrics: [
      ['Catálogo e decisões', 'pm_..._catalogo (22) · pm_..._decisao (29) · pm_..._rastreio (62)'],
      ['Valores e réguas com vigência', 'pm_..._escalar (12) · pm_..._faixa (23) · pm_..._janela_diaria (1)'],
      ['Atuação e ciclo nos painéis', 'pm_..._uso_painel (33) · pm_..._ciclo_painel (5 painéis · 32)'],
    ],
    objects: [
      'pm_sanepar_refined_parametro_catalogo (22)',
      'pm_sanepar_refined_parametro_decisao (29)',
      'pm_sanepar_refined_parametro_uso_painel (33)',
      'pm_sanepar_refined_parametro_escalar (12)',
      'pm_sanepar_refined_parametro_faixa (23)',
      'pm_sanepar_refined_parametro_janela_diaria (1)',
      'pm_sanepar_refined_parametro_rastreio (62)',
      'pm_sanepar_refined_parametro_ciclo_painel (5 painéis · 32)',
    ],
    description:
      'Calculado às 05:35 (wf-sanepar-refined-parametro) antes das tabelas de pressão, geografia e energia, que leem esses parâmetros.',
  },
  ref_pressao: {
    id: 'ref_pressao',
    band: 'ref',
    title: 'Refined Pressão na Rede (D4) & Geografia p/ Mapas',
    sub: 'ds_org_sanepar_refined_distribuicao_agua · 9 objetos (05:40)',
    pos: [12.0, 2.5, 0.0],
    fid: 'inv',
    badge: '9 obj · 3.587 pts · 05:40',
    metrics: [
      ['Pressão na rede (4 objetos · painel D4)', 'vw_..._pressao_ponto_atual (3.587) · ft_..._ponto_dia (88.173) · dm_..._ponto_geo (3.533) · dm_..._parametro_regra (10)'],
      ['Geografia para mapas (5 dimensões)', 'zona_pressao (3.776) · distrito_medicao (3.251) · area_influencia (987) · gerencia_regional (22) · concessao (400)'],
    ],
    objects: [
      'vw_sanepar_refined_distribuicao_agua_pressao_ponto_atual (3.587 pontos)',
      'ft_sanepar_refined_distribuicao_agua_pressao_ponto_dia (88.173)',
      'dm_sanepar_refined_distribuicao_agua_pressao_ponto_geo (3.533)',
      'dm_sanepar_refined_distribuicao_agua_pressao_parametro_regra (10)',
      'dm_sanepar_refined_distribuicao_agua_geo_zona_pressao (3.776)',
      'dm_sanepar_refined_distribuicao_agua_geo_distrito_medicao (3.251)',
      'dm_sanepar_refined_distribuicao_agua_geo_area_influencia (987)',
      'dm_sanepar_refined_distribuicao_agua_geo_gerencia_regional (22)',
      'dm_sanepar_refined_distribuicao_agua_geo_concessao (400)',
    ],
    description:
      'Atualizado às 05:40 por wf-sanepar-refined-pressao-dia e wf-sanepar-refined-geo; a view de situação atual responde em tempo real.',
  },
  ref_energia: {
    id: 'ref_energia',
    band: 'ref',
    title: 'Refined Energia das Unidades Próprias (D6)',
    sub: 'ds_org_sanepar_refined_energia · 8 objetos (05:40)',
    pos: [12.0, 2.5, 4.2],
    fid: 'inv',
    badge: '8 obj · 190 UOs · 05:40',
    metrics: [
      ['Visão atual e fatos de interrupção', 'vw_..._energia_unidade_atual (190 UOs) · ft_..._interrupcao (250) · ft_..._unidade_dia (1.140)'],
      ['Dimensões e estruturas prontas', 'dm_..._ponto (190) · dm_..._ponto_geo (estrutura pronta) · dm_..._tag_status (190 tags) · dm_..._vinculo_tag_unidade · ft_..._consumo_unidade'],
    ],
    objects: [
      'vw_sanepar_refined_energia_unidade_atual (190 unidades)',
      'ft_sanepar_refined_energia_interrupcao (250)',
      'ft_sanepar_refined_energia_unidade_dia (1.140)',
      'dm_sanepar_refined_energia_ponto (190)',
      'dm_sanepar_refined_energia_ponto_geo (estrutura pronta)',
      'dm_sanepar_refined_energia_tag_status (190 tags)',
      'dm_sanepar_refined_energia_vinculo_tag_unidade',
      'ft_sanepar_refined_energia_consumo_unidade (estrutura pronta)',
    ],
    description:
      'Atualizado às 05:40 por wf-sanepar-refined-energia-dia; consolida disponibilidade elétrica, interrupções e minutos sem energia por unidade.',
  },

  // 6. CONSUMO (Entradas prontas para o Looker — leem só a Refined)
  use_d0: {
    id: 'use_d0',
    band: 'use',
    title: 'Mapas & Visão Integrada (Hub / 5 Camadas)',
    sub: '5 camadas geográficas simplificadas + ciclo vigente de 5 painéis',
    pos: [19.0, 2.8, -4.0],
    fid: 'arq',
    accent: 'pink',
    badge: '5 camadas de mapa',
    metrics: [
      ['Mapas para visualização Looker', 'zona_pressao (3.776), distrito_medicao (3.251), area_influencia (987), gerencia_regional (22), concessao (400)'],
      ['Governança de ciclo dos painéis', 'pm_sanepar_refined_parametro_ciclo_painel (5 painéis · 32 registros)'],
    ],
    objects: [
      'dm_sanepar_refined_distribuicao_agua_geo_zona_pressao (3.776)',
      'dm_sanepar_refined_distribuicao_agua_geo_distrito_medicao (3.251)',
      'dm_sanepar_refined_distribuicao_agua_geo_area_influencia (987)',
      'dm_sanepar_refined_distribuicao_agua_geo_gerencia_regional (22)',
      'dm_sanepar_refined_distribuicao_agua_geo_concessao (400)',
      'pm_sanepar_refined_parametro_ciclo_painel (5 painéis · 32)',
    ],
    description:
      'Fornece as 5 camadas geográficas simplificadas para renderização rápida nos mapas do Looker e o controle de ciclo dos 5 painéis.',
  },
  use_d4: {
    id: 'use_d4',
    band: 'use',
    title: 'Consumo Looker · Pressão na Rede (Painel D4)',
    sub: 'vw_…_pressao_ponto_atual (tempo real) + ft_…_pressao_ponto_dia (série)',
    pos: [19.0, 2.8, 0.0],
    fid: 'arq',
    badge: '3.587 pts · 88.173/dia',
    metrics: [
      ['Painel tempo real', 'vw_sanepar_refined_distribuicao_agua_pressao_ponto_atual (3.587 pontos)'],
      ['Série histórica diária', 'ft_sanepar_refined_distribuicao_agua_pressao_ponto_dia (88.173 linhas)'],
      ['Vínculo geográfico e regras', 'dm_..._pressao_ponto_geo (3.533) + dm_..._parametro_regra (10)'],
    ],
    objects: [
      'vw_sanepar_refined_distribuicao_agua_pressao_ponto_atual',
      'ft_sanepar_refined_distribuicao_agua_pressao_ponto_dia',
      'dm_sanepar_refined_distribuicao_agua_pressao_ponto_geo',
      'dm_sanepar_refined_distribuicao_agua_pressao_parametro_regra',
    ],
    description:
      'Entradas prontas da camada Refined consumidas diretamente pelo Painel D4 de monitoramento de pressão na rede de distribuição.',
  },
  use_d6: {
    id: 'use_d6',
    band: 'use',
    title: 'Consumo Looker · Energia das UOs (Painel D6)',
    sub: 'vw_…_energia_unidade_atual (tempo real) + ft_…_energia_unidade_dia (série)',
    pos: [19.0, 2.8, 4.0],
    fid: 'arq',
    badge: '190 UOs · 250 eventos',
    metrics: [
      ['Painel tempo real', 'vw_sanepar_refined_energia_unidade_atual (190 unidades próprias)'],
      ['Série histórica diária e eventos', 'ft_sanepar_refined_energia_unidade_dia (1.140) + ft_..._interrupcao (250)'],
    ],
    objects: [
      'vw_sanepar_refined_energia_unidade_atual',
      'ft_sanepar_refined_energia_unidade_dia',
      'ft_sanepar_refined_energia_interrupcao',
      'dm_sanepar_refined_energia_ponto / tag_status',
    ],
    description:
      'Entradas prontas da camada Refined consumidas diretamente pelo Painel D6 de energia das unidades operacionais próprias.',
  },
};

// ---- Pilares Transversais ("Atravessa todas as camadas" — CROSS do Inventário) ----
export const INVENTORY_CROSS_PILLARS = [
  {
    title: 'Orquestração · Dataform',
    color: '#2edce6',
    count: '8',
    sub: 'df_org_sanepar_trusted + df_org_sanepar_refined',
    items: [
      'sanepar-trusted-cadastro (release branch main)',
      'wf-sanepar-trusted-cadastro (05:30) · wf-sanepar-trusted-geo (05:30)',
      'rel-sanepar-refined-main (release branch main)',
      'wf-sanepar-refined-parametro (05:35) · pressao-dia, geo, energia-dia (05:40)',
    ],
  },
  {
    title: 'Qualidade · Assertions',
    color: '#bba0e2',
    count: '41',
    sub: 'ds_org_sanepar_governance (40 regras + 1 fato)',
    items: [
      'Cadastro c/ versões (6 regras) · Geografia tipada Trusted (12 regras)',
      'Pressão D4 (5 regras) · Geografia p/ mapas (5 regras)',
      'Parâmetros (6 regras) · Energia D6 (6 regras)',
      'ft_sanepar_governance_telemetria_reconciliacao (resultado diário)',
    ],
  },
  {
    title: 'Segurança · Secret Manager',
    color: '#c51b88',
    count: '7',
    sub: 'Credenciais de acesso protegidas',
    items: [
      'sm_sanepar_user_key_prod_telemetria (Historian)',
      'sm_sanepar_user_key_prod_borg · _bope · _sdoa',
      'sm_sanepar_arcgis_portal_token (ArcGIS)',
      'sm_sanepar_gitlab_trusted_token · _refined_token',
    ],
  },
  {
    title: 'Imagens · Artifact Registry',
    color: '#e3a04a',
    count: '7',
    sub: 'Repositório: pipelines (southamerica-east1)',
    items: [
      'parquet-iceberg · telemetria-proprio · telemetria-backfill',
      'metadata-discovery · cadastro-borg · cadastro-operacional · arcgis-geo',
    ],
  },
  {
    title: 'Código Versionado · GitLab',
    color: '#7ea865',
    count: '3',
    sub: 'engbr/energy-and-utilities/sanepar',
    items: [
      'pipelines_sanepar (Coletores, jobs e SQL de carga)',
      'df_org_sanepar_trusted (Transformações da Trusted)',
      'df_org_sanepar_refined (Transformações da Refined)',
    ],
  },
];

// ---- Ligações entre os nós da Cena 2 (Plataforma Lakehouse) -----------------
export const LAKEHOUSE_LINKS = [
  // Fontes -> DHuO
  { id: 'src-dhuo', from: 'src_historian', to: 'dhuo_gw', kind: 'hot' },
  { id: 'cad-dhuo', from: 'src_cadastros', to: 'dhuo_gw', kind: 'batch' },

  // DHuO -> Ingestão
  { id: 'dhuo-quente', from: 'dhuo_gw', to: 'ing_quente', kind: 'hot' },
  { id: 'dhuo-rec', from: 'dhuo_gw', to: 'ing_reconciliacao', kind: 'batch' },
  { id: 'dhuo-ing-cad', from: 'dhuo_gw', to: 'ing_cadastros', kind: 'batch' },

  // Ingestão -> RAW / Trusted
  { id: 'quente-raw', from: 'ing_quente', to: 'raw_gcs', kind: 'hot' },
  { id: 'quente-tru', from: 'ing_quente', to: 'tru_telemetria', kind: 'hot' },
  { id: 'rec-raw', from: 'ing_reconciliacao', to: 'raw_gcs', kind: 'batch' },
  { id: 'ing-cad-raw', from: 'ing_cadastros', to: 'raw_cadastro_org_op', kind: 'batch' },
  { id: 'ing-cad-geo', from: 'ing_cadastros', to: 'raw_geo', kind: 'batch' },

  // RAW -> Trusted
  { id: 'raw-tru-ext', from: 'raw_gcs', to: 'tru_telemetria', kind: 'hot' },
  { id: 'raw-tru-cad', from: 'raw_cadastro_org_op', to: 'tru_cadastro_geo', kind: 'batch' },
  { id: 'raw-tru-geo', from: 'raw_geo', to: 'tru_cadastro_geo', kind: 'batch' },
  { id: 'gov-tru', from: 'gov_dataform', to: 'tru_cadastro_geo', kind: 'gov' },

  // Trusted / Gov -> Refined
  { id: 'gov-ref-param', from: 'gov_dataform', to: 'ref_parametros', kind: 'gov' },
  { id: 'tru-ref-pressao', from: 'tru_telemetria', to: 'ref_pressao', kind: 'hot' },
  { id: 'tru-ref-energia', from: 'tru_telemetria', to: 'ref_energia', kind: 'hot' },
  { id: 'cad-ref-pressao', from: 'tru_cadastro_geo', to: 'ref_pressao', kind: 'batch' },
  { id: 'cad-ref-energia', from: 'tru_cadastro_geo', to: 'ref_energia', kind: 'batch' },
  { id: 'param-ref-pressao', from: 'ref_parametros', to: 'ref_pressao', kind: 'gov' },
  { id: 'param-ref-energia', from: 'ref_parametros', to: 'ref_energia', kind: 'gov' },

  // Refined -> Consumo Looker
  { id: 'ref-d0', from: 'ref_pressao', to: 'use_d0', kind: 'use' },
  { id: 'ref-d4', from: 'ref_pressao', to: 'use_d4', kind: 'use' },
  { id: 'ref-d6', from: 'ref_energia', to: 'use_d6', kind: 'use' },
  { id: 'ref-e-d0', from: 'ref_energia', to: 'use_d0', kind: 'use' },
];

// ---- Duas Simulações Automáticas de Negócio na Cidade 3D (Auto-Loop) ----
// 100% em linguagem de negócio (sem jargão técnico de banco de dados/algoritmo na tela).
export const BUSINESS_STORIES = {
  demanda_24h: {
    id: 'demanda_24h',
    shortLabel: '▶ Previsão de Demanda 24h',
    title: 'Equilíbrio entre Reservatórios e Projeção de Volume para 24 Horas',
    acts: [
      {
        id: 'd1_manha_4_normais',
        durationSec: 12,
        clock: '08:00',
        weather: 'Manhã · Sistema Integrado',
        status: '4 RESERVATÓRIOS COM VOLUMES ALTOS',
        statusKind: 'ok',
        nightLight: false,
        cameraPreset: 'campo_geral',
        tankLevels: {
          r1: { from: 0.82, to: 0.80, color: 'ok' },
          r2: { from: 0.85, to: 0.84, color: 'ok' },
          r3: { from: 0.79, to: 0.77, color: 'ok' },
          r4: { from: 0.80, to: 0.76, color: 'ok' },
        },
        banner: '08:00 DA MANHÃ · Os 4 reservatórios da cidade operam com volumes altos e projeção saudável para as próximas 24h',
        headline: '1 · Manhã: todos os 4 reservatórios com volume alto e projeção para 24h',
        narrative:
          'No início do dia, a operação acompanha simultaneamente o volume atual de cada reservatório espalhado pela cidade e quanto cada um terá daqui a 24 horas segundo o comportamento esperado daquele dia.',
        kpis: [
          ['Reservatórios no Sistema', '4 centros monitorados (Centro, Norte, Sul, Leste)'],
          ['Volume Médio Inicial', '81% de capacidade útil (faixa segura)'],
          ['Projeção Inicial p/ 24h', 'Todos previstos acima de 64%'],
        ],
        callouts: [
          { pos: [-6.8, 6.2, -14.2], kind: 'ok', title: 'R1 · CENTRO | Atual: 82%', sub: 'Projeção 24h: 68% (Normal)' },
          { pos: [15.5, 5.8, -13.5], kind: 'ok', title: 'R2 · NORTE | Atual: 85%', sub: 'Projeção 24h: 74% (Com sobra)' },
          { pos: [-9.5, 5.2, 12.2], kind: 'ok', title: 'R3 · SUL | Atual: 79%', sub: 'Projeção 24h: 64% (Normal)' },
          { pos: [26.5, 5.6, -3.8], kind: 'ok', title: 'R4 · LESTE | Atual: 80%', sub: 'Projeção 24h: 65% (Normal)' },
        ],
      },
      {
        id: 'd2_queda_acelerada_r4',
        durationSec: 13,
        clock: '13:30',
        weather: 'Tarde · Consumo Acelerado no Leste',
        status: 'R4 BAIXANDO MAIS RÁPIDO QUE O PREVISTO',
        statusKind: 'crit',
        nightLight: false,
        cameraPreset: 'campo_remanejamento',
        tankLevels: {
          r1: { from: 0.78, to: 0.74, color: 'ok' },
          r2: { from: 0.83, to: 0.80, color: 'ok' },
          r3: { from: 0.75, to: 0.71, color: 'ok' },
          r4: { from: 0.72, to: 0.34, color: 'crit' },
        },
        banner: 'ALERTA ANTECIPADO ÀS 13:30 · Reservatório R4 (Leste) cai muito mais rápido que o previsto e projeta falta d’água às 19h',
        headline: '2 · Passar do dia: um reservatório baixa mais rápido que o previsto',
        narrative:
          'Ao longo da tarde, o reservatório R4 (Leste) começa a esvaziar numa velocidade muito maior que a prevista. A projeção de 24 horas despenca para 12% (risco real de faltar água no pico), enquanto o R2 (Norte), do mesmo sistema, permanece com sobra (80%).',
        kpis: [
          ['Reservatório em Risco (R4 Leste)', 'Caiu p/ 36% · Projeção 24h: 12% (Crítico)'],
          ['Reservatório c/ Sobra (R2 Norte)', 'Atual: 80% · Projeção 24h: 72% (Folga)'],
          ['Janela p/ Agir', '5 horas de antecedência antes de faltar água'],
        ],
        callouts: [
          { pos: [26.5, 5.6, -3.8], kind: 'crit', title: 'R4 · LESTE | Atual: 36% (CAINDO RÁPIDO)', sub: 'Projeção 24h caiu p/ 12% · Risco de falta d’água!' },
          { pos: [15.5, 5.8, -13.5], kind: 'ok', title: 'R2 · NORTE | Atual: 80% (SOBRA DE ÁGUA)', sub: 'Projeção 24h: 72% · Mesmo sistema integrado' },
          { pos: [-6.8, 6.2, -14.2], kind: 'info', title: 'R1 · CENTRO | Atual: 75%', sub: 'Projeção 24h: 66% (Estável)' },
          { pos: [-9.5, 5.2, 12.2], kind: 'info', title: 'R3 · SUL | Atual: 72%', sub: 'Projeção 24h: 62% (Estável)' },
        ],
      },
      {
        id: 'd3_remanejamento_rede',
        durationSec: 15,
        clock: '15:00',
        weather: 'Tarde · Manobra de Rede Integrada',
        status: 'REMANEJAMENTO ATIVO: R2 NORTE → R4 LESTE',
        statusKind: 'info',
        nightLight: false,
        cameraPreset: 'campo_remanejamento',
        transferEffect: true,
        tankLevels: {
          r1: { from: 0.74, to: 0.70, color: 'ok' },
          r2: { from: 0.80, to: 0.65, color: 'ok' },
          r3: { from: 0.71, to: 0.68, color: 'ok' },
          r4: { from: 0.34, to: 0.54, color: 'warn' },
        },
        banner: 'REMANEJAMENTO EM CURSO · Sobra de água do R2 (Norte) é redirecionada pela rede para desafogar o R4 (Leste)',
        headline: '3 · Avaliação antecipada permite remanejar água de quem tem sobra para quem vai faltar',
        narrative:
          'Por enxergar o problema horas antes do colapso, a operação executa o remanejamento na rede entre os dois reservatórios do mesmo sistema de abastecimento: o R2 (Norte), que estava com folga, assume parte da carga e transfere vazão para desafogar o R4 (Leste).',
        kpis: [
          ['Ação Executada', 'Remanejamento de rede R2 Norte → R4 Leste'],
          ['Doador (R2 Norte)', 'Usa a folga (80% → 65%) sem afetar seu bairro'],
          ['Receptor (R4 Leste)', 'Interrompe a queda e recupera nível (34% → 54%)'],
        ],
        callouts: [
          { pos: [15.5, 5.8, -13.5], kind: 'ok', title: 'R2 · NORTE (DOADOR COM SOBRA)', sub: 'Atual: 66% | Projeção 24h: 62% · Enviando reforço' },
          { pos: [20.5, 3.6, -6.2], kind: 'info', title: 'REMANEJAMENTO DE REDE ATIVO', sub: 'Transferindo água pelo mesmo sistema de abastecimento' },
          { pos: [26.5, 5.6, -3.8], kind: 'warn', title: 'R4 · LESTE (DESAFOGADO)', sub: 'Atual subindo p/ 54% | Nova Projeção 24h: 56%' },
        ],
      },
      {
        id: 'd4_equilibrio_pico',
        durationSec: 15,
        clock: '19:30',
        weather: 'Noite · Horário de Pico Superado',
        status: 'SISTEMA REEQUILIBRADO · ZERO FALTA D’ÁGUA',
        statusKind: 'ok',
        nightLight: true,
        cameraPreset: 'campo_geral',
        transferEffect: true,
        tankLevels: {
          r1: { from: 0.68, to: 0.66, color: 'ok' },
          r2: { from: 0.64, to: 0.62, color: 'ok' },
          r3: { from: 0.65, to: 0.63, color: 'ok' },
          r4: { from: 0.54, to: 0.58, color: 'ok' },
        },
        banner: 'PICO DAS 19H SUPERADO COM SUCESSO · Todos os 4 reservatórios permanecem abastecidos e equilibrados',
        headline: '4 · Resultado no horário crítico: sistema equilibrado e nenhum bairro sem água',
        narrative:
          'Chega o horário de pico noturno e nenhum morador do Setor Leste sofre falta d’água. O remanejamento antecipado equilibrou os volumes entre os reservatórios do sistema, evitando o desabastecimento sem precisar de manobras de emergência.',
        kpis: [
          ['R4 · Leste no Pico', 'Estabilizado em 58% (salvo do desabastecimento)'],
          ['Demais Reservatórios (R1, R2, R3)', 'Todos equilibrados entre 62% e 66%'],
          ['Impacto na População', '100% da cidade abastecida continuamente'],
        ],
        callouts: [
          { pos: [-6.8, 6.2, -14.2], kind: 'ok', title: 'R1 · CENTRO | Atual: 66%', sub: 'Projeção 24h: 65% (Equilibrado)' },
          { pos: [15.5, 5.8, -13.5], kind: 'ok', title: 'R2 · NORTE | Atual: 62%', sub: 'Projeção 24h: 61% (Folga compartilhada)' },
          { pos: [-9.5, 5.2, 12.2], kind: 'ok', title: 'R3 · SUL | Atual: 63%', sub: 'Projeção 24h: 62% (Equilibrado)' },
          { pos: [26.5, 5.6, -3.8], kind: 'ok', title: 'R4 · LESTE | Atual: 58% (RECUPERADO)', sub: 'Projeção 24h: 60% · Falta d’água evitada!' },
        ],
      },
    ],
  },

  vazamento_madrugada: {
    id: 'vazamento_madrugada',
    shortLabel: '▶ Predição de Vazamento Oculto',
    title: 'Identificação de Vazamentos Ocultos no Silêncio da Madrugada',
    acts: [
      {
        id: 'v1_silencio',
        durationSec: 11,
        clock: '02:30',
        weather: 'Madrugada · Cidade Dormindo',
        status: 'VIGILÂNCIA NOTURNA (22H–06H)',
        statusKind: 'info',
        nightLight: true,
        cameraPreset: 'campo_geral',
        banner: '02:30 DA MADRUGADA · Casas dormindo e torneiras fechadas: o momento em que a rede revela perdas ocultas',
        headline: '1 · O silêncio da madrugada: quando quase ninguém consome água',
        narrative:
          'Entre 22h e 06h o consumo das famílias cai ao mínimo. Se muita água continua entrando num bairro durante a madrugada, ela pode estar escapando por baixo da terra — mesmo que o asfalto na superfície esteja completamente seco.',
        kpis: [
          ['Janela Analisada', 'Toda madrugada (22h às 06h)'],
          ['Foco da Busca', 'Vazamentos ocultos que não afloram na rua'],
          ['Histórico Aprendido', '6 meses do comportamento noturno de cada bairro'],
        ],
        callouts: [
          { pos: [-23.5, 6.4, 12.2], kind: 'info', title: 'RESIDÊNCIAS DORMINDO', sub: 'Consumo doméstico próximo de zero às 02:30' },
          { pos: [5.5, 8.2, 4.8], kind: 'info', title: 'CENTRO URBANO EM SILÊNCIO', sub: 'Monitorando o fluxo mínimo sob as avenidas' },
        ],
      },
      {
        id: 'v2_filtro_manobra',
        durationSec: 12,
        clock: '03:15',
        weather: 'Madrugada · Qualificação',
        status: 'DESCARTANDO MANOBRAS E CASOS ISOLADOS',
        statusKind: 'info',
        nightLight: true,
        cameraPreset: 'campo_rede',
        maintEffect: true,
        banner: 'TRIAGEM INTELIGENTE · Sistema descarta manobras programadas, feriados e oscilações de uma única noite',
        headline: '2 · Avaliando se não é algo programado previamente ou um caso isolado',
        narrative:
          'Nem toda alta noturna é vazamento: antes de gerar um alerta, o sistema verifica se houve manobra operacional na região, se é feriado ou apenas um evento isolado de uma noite. Isso reduz em cerca de 20% os deslocamentos desnecessários de equipes.',
        kpis: [
          ['Redução de Falsos Alertas', '−20% de deslocamentos improdutivos'],
          ['Filtro de Manobra', 'Descarta quando a região inteira subiu junta por manobra'],
          ['Filtro de Caso Isolado', 'Ignora picos passageiros de apenas 1 ou 2 noites'],
        ],
        callouts: [
          { pos: [5.4, 8.2, 4.5], kind: 'info', title: 'MANOBRA PROGRAMADA · IGNORADA', sub: 'Região subiu junta · Equipe NÃO precisa ir a campo' },
          { pos: [-13.6, 3.2, 11.4], kind: 'ok', title: 'OSCILAÇÃO DE 1 NOITE · DESCARTADA', sub: 'Caso isolado sem persistência nas noites seguintes' },
        ],
      },
      {
        id: 'v3_quinta_noite',
        durationSec: 13,
        clock: '04:45',
        weather: 'Madrugada · Persistência Confirmada',
        status: '5 DE 7 MADRUGADAS ACIMA DO NORMAL',
        statusKind: 'crit',
        nightLight: true,
        cameraPreset: 'campo_rede',
        leakEffect: true,
        banner: 'VAZAMENTO OCULTO CONFIRMADO · 5 das últimas 7 madrugadas com vazão +38% acima do normal sob a Avenida Central',
        headline: '3 · Cinco de sete madrugadas acima do normal: água escapando no subsolo',
        narrative:
          'Descartadas as manobras e os casos isolados, o setor sob a Avenida Central permanece mais de 30% acima do normal em 5 das últimas 7 madrugadas. É a confirmação de um vazamento subterrâneo em curso antes de aflorar na rua.',
        kpis: [
          ['Regra de Confirmação', '5 das últimas 7 madrugadas acima do normal'],
          ['Volume Escapando', '+38% acima do consumo mínimo esperado'],
          ['Visibilidade', 'Invisível no asfalto · Confirmado pela recorrência'],
        ],
        callouts: [
          { pos: [3.6, 3.6, 12.6], kind: 'crit', title: 'VAZAMENTO OCULTO CONFIRMADO', sub: '5 de 7 madrugadas acima do normal (+38%)' },
          { pos: [18.2, 3.8, 11.4], kind: 'warn', title: 'PRIORIDADE 1 PARA CAMPO', sub: 'Comportamento persistente validado para abertura de OS' },
        ],
      },
      {
        id: 'v4_reparo_preventivo',
        durationSec: 20,
        clock: '06:00',
        weather: 'Manhã · Intervenção em Campo',
        status: 'EQUIPE SANEPAR EM ATUAÇÃO NO LOCAL',
        statusKind: 'ok',
        nightLight: false,
        cameraPreset: 'campo_rede',
        leakEffect: true,
        truckDispatch: true,
        banner: '06:00 DA MANHÃ · Viatura da Sanepar se desloca direto ao ponto indicado e estanca o vazamento antes de romper a via',
        headline: '4 · Equipe Sanepar em campo: intervenção certeira antes de abrir cratera na avenida',
        narrative:
          'Logo ao amanhecer, a equipe de manutenção da Sanepar sai direto para o trecho sinalizado, posiciona a viatura e executa o reparo na rede subterrânea antes que a tubulação estoure o asfalto, preservando a água tratada e o trânsito da cidade.',
        kpis: [
          ['Despacho às 06:00', 'Equipe direcionada exatamente ao setor confirmado'],
          ['Intervenção Preventiva', 'Vazamento contido antes de romper o pavimento'],
          ['Resultado para a Cidade', 'Água recuperada, trânsito fluindo e clientes abastecidos'],
        ],
        callouts: [
          { pos: [3.6, 4.2, 9.2], kind: 'ok', title: 'EQUIPE SANEPAR NO LOCAL', sub: 'Intervenção em andamento · Vazamento sendo estancado' },
          { pos: [14.5, 4.2, 8.8], kind: 'info', title: 'VIA PÚBLICA PRESERVADA', sub: 'Atuação antes de abrir cratera na avenida' },
        ],
      },
    ],
  },
};

