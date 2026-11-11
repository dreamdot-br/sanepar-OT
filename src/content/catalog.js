// Catálogo canônico de dados, equipamentos de campo e nós agrupados do Lakehouse GCP.
// Todos os números de inventário reproduzem "Inventário Lakehouse SANEPAR 2.html" (coleta GCP 26/10/2026).

export const FIDELITY = {
  inv: {
    id: 'inv',
    short: 'Inventário GCP',
    label: 'Construído e rodando no GCP',
    desc: 'Objeto permanente auditado em sanepar-dhuo-nonprd / gateway DHuO de produção (26/10/2026).',
  },
  arq: {
    id: 'arq',
    short: 'Arquitetura / Proposta',
    label: 'Desenho de referência',
    desc: 'Componente previsto na arquitetura corporativa ou protótipo funcional.',
  },
  sim: {
    id: 'sim',
    short: 'Simulado',
    label: 'Contador da simulação',
    desc: 'Gerado pelo motor determinístico desta visualização (não lê o BigQuery em tempo real).',
  },
};

// ---- Cartões executivos fixos por modo (público: Diretoria / Comitê Sanepar) -
export const EXECUTIVE_CARDS = {
  operacional: [
    {
      eyebrow: '1 · Origem no Saneamento',
      title: 'Da instrumentação de campo ao barramento corporativo',
      metric: '19.552 tags',
      metricSub: '17.278 parque terceiros + 2.274 parque próprio (SCADA)',
      bullets: [
        'Unidades operacionais (reservatórios, elevatórias, VRPs e macromedidores) geram sinais contínuos de nível (LT), pressão (PT), vazão (FT) e energia (KFF).',
        'A operação local nunca depende da nuvem para manobra física; o Historian consolida as leituras e expõe via API segura.',
      ],
      fid: 'inv',
    },
    {
      eyebrow: '2 · Integração Segura',
      title: 'Gateway DHuO como fronteira única OT / TI',
      metric: '6 fontes ativas',
      metricSub: '2 Historians + BORG + BOPE + SDOA + ArcGIS Portal',
      bullets: [
        'O DHuO (produção) publica e governa os proxies de API com autenticação, rate limiting e isolamento entre a rede da Sanepar e a nuvem.',
        'Credenciais protegidas no Secret Manager (7 chaves sm_sanepar_*) sem exposição nos pipelines.',
      ],
      fid: 'inv',
    },
    {
      eyebrow: '3 · Frescor e Continuidade',
      title: 'Caminho quente contínuo + reconciliação automática',
      metric: '120 s / 1 min',
      metricSub: 'Histórico contínuo desde 28/08/2025 · 2,18 bi leituras',
      bullets: [
        'Coleta contínua 24×7 traz o estado operacional com frescor de 120 s (terceiros via Dataflow) e 1 min (parque próprio via Cloud Run).',
        'Toda madrugada (03:45–04:45), o backfill relê D-3 a D-1 e recompõe qualquer lacuna de comunicação de campo.',
      ],
      fid: 'inv',
    },
  ],
  plataforma: [
    {
      eyebrow: '1 · Arquitetura Medallion no GCP',
      title: 'RAW em Apache Iceberg · Trusted e Refined em BigQuery',
      metric: '25 tabelas RAW · 19 Trusted · 25 Refined',
      metricSub: '59 GB brutos na RAW · 275 GB (2,18 bi linhas) na Trusted',
      bullets: [
        'RAW preserva o dado bruto em Parquet e catálogo BigLake/Iceberg, sem regra de negócio.',
        'Trusted deduplica os dois parques de telemetria, versiona cadastros (SCD Tipo 2) e tipa as 12 camadas geográficas do ArcGIS.',
      ],
      fid: 'inv',
    },
    {
      eyebrow: '2 · Relógio da Operação & Governança',
      title: '14 agendamentos coordenados antes das 06:00 + 40 regras',
      metric: '03:45 → 05:40',
      metricSub: '8 jobs de coleta/carga · Dataform Trusted (05:30) e Refined (05:35/05:40)',
      bullets: [
        'Cadeia determinística: reconciliação D-3..D-1 → retratos BORG/BOPE/SDOA/ArcGIS → Trusted SCD2 → parâmetros de negócio → tabelas de painel.',
        '40 assertions no dataset ds_org_sanepar_governance auditam integridade de cadastro, geografia, pressão, energia e parâmetros.',
      ],
      fid: 'inv',
    },
    {
      eyebrow: '3 · Produtos de Dados Prontos para Decisão',
      title: 'Camada Refined abastece os painéis estratégicos Looker',
      metric: '3.587 pontos D4 · 190 UOs D6',
      metricSub: '22 parâmetros de negócio versionados (pm_sanepar_refined_*)',
      bullets: [
        'Os painéis consomem exclusivamente a Refined: views de estado atual (vw_*) e fatos diários agregados (ft_*).',
        'D4 (Pressão na rede) e D6 (Energia das unidades próprias) já contam com objetos Refined completos; D0 consolida a visão executiva.',
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

// ---- Nós agrupados da Cena 2 (Plataforma de Dados / Lakehouse GCP) ----------
export const LAKEHOUSE_NODES = {
  src_historian: {
    id: 'src_historian',
    band: 'src',
    title: 'Telemetria (2 Parques)',
    sub: '19.552 tags · 5.756 devices',
    pos: [-18, 2.2, -3.6],
    fid: 'inv',
    badge: '17.278 + 2.274 tags',
    metrics: [
      ['Parque de terceiros (Historian REST)', '17.278 tags'],
      ['Parque próprio (SCADA)', '2.274 tags'],
      ['Equipamentos inventariados', '5.756 devices'],
    ],
    objects: [
      'Historian · parque de terceiros (17.278 tags)',
      'Historian · parque próprio SCADA (2.274 tags)',
    ],
    description: 'Sistemas de telemetria da Sanepar que originam as leituras contínuas de pressão, vazão, nível e energia.',
  },
  src_cadastros: {
    id: 'src_cadastros',
    band: 'src',
    title: 'Cadastros & ArcGIS',
    sub: 'BORG · BOPE · SDOA · 12 camadas Geo',
    pos: [-18, 2.2, 3.2],
    fid: 'inv',
    badge: '4 sistemas corporativos',
    metrics: [
      ['BORG (organizacional)', '186 unidades · 22 GR · 670 localidades'],
      ['BOPE (operacional)', '20.116 UOs · 1.115 sistemas'],
      ['SDOA (atributos de água)', '11.848 unidades'],
      ['ArcGIS Portal', '12 camadas geográficas'],
    ],
    objects: [
      'BORG · estrutura organizacional',
      'BOPE · unidades operacionais (20.116)',
      'SDOA · atributos das unidades (11.848)',
      'ArcGIS Portal · 12 camadas geográficas',
    ],
    description: 'Fontes cadastrais e geográficas lidas diariamente na janela da madrugada para contextualizar cada tag e equipamento.',
  },
  dhuo_gw: {
    id: 'dhuo_gw',
    band: 'src',
    title: 'Gateway DHuO · Produção',
    sub: 'Proxies de API + Secret Manager (7)',
    pos: [-14.2, 3.6, -0.2],
    fid: 'inv',
    accent: 'pink',
    badge: '6 fontes → GCP',
    metrics: [
      ['Ambiente do Gateway', 'Produção (lido por sanepar-dhuo-nonprd)'],
      ['Credenciais gerenciadas', '7 secrets no GCP Secret Manager'],
    ],
    objects: [
      'Gateway DHuO · produção (6 fontes conectadas)',
      'sm_sanepar_user_key_prod_telemetria / borg / bope / sdoa',
      'sm_sanepar_arcgis_portal_token',
    ],
    description: 'Camada de API Management da Engineering que publica e protege os endpoints da Sanepar consumidos pelos workers no GCP.',
  },

  // 2. INGESTÃO
  ing_quente: {
    id: 'ing_quente',
    band: 'ing',
    title: 'Caminho Quente (24×7)',
    sub: 'Dataflow 120s + Cloud Run 1min + Iceberg 10min',
    pos: [-10.5, 2.5, -4.2],
    fid: 'inv',
    badge: 'Frescor 120 s',
    metrics: [
      ['Dataflow streaming (terceiros)', 'sanepar-coletor-v16 (a cada 120 s)'],
      ['Cloud Run Job (parque próprio)', 'cr-telemetria-proprio (* * * * *)'],
      ['Conversão Parquet → Iceberg', 'cr-iceberg-raw-measures (*/10 * * * *)'],
    ],
    objects: [
      'sanepar-coletor-v16 (Dataflow streaming · southamerica-east1)',
      'cr-telemetria-proprio + sch-telemetria-proprio-1min',
      'cr-iceberg-raw-measures + sch-iceberg-raw-measures-10min',
    ],
    description: 'Três coletores contínuos operam dia e noite: Dataflow grava direto na Trusted e Parquet; jobs convertem Parquet em tabelas Iceberg a cada 10 minutos.',
  },
  ing_reconciliacao: {
    id: 'ing_reconciliacao',
    band: 'ing',
    title: 'Reconciliação D-3 a D-1',
    sub: '03:45 busca · 04:45 carga (2 parques)',
    pos: [-10.5, 2.5, 0.0],
    fid: 'inv',
    badge: '03:45 → 04:45',
    metrics: [
      ['Job Cloud Run', 'cr-telemetria-backfill'],
      ['Agendamentos de busca (03:45)', 'sch-telemetria-rec-terceiros-busca / proprio-busca'],
      ['Agendamentos de carga (04:45)', 'sch-telemetria-rec-terceiros-carga / proprio-carga'],
    ],
    objects: [
      'cr-telemetria-backfill',
      'sch-telemetria-rec-terceiros-busca (45 3 * * *)',
      'sch-telemetria-rec-proprio-busca (45 3 * * *)',
      'sch-telemetria-rec-terceiros-carga (45 4 * * *)',
      'sch-telemetria-rec-proprio-carga (45 4 * * *)',
    ],
    description: 'Relê os últimos 3 dias dos dois parques todas as madrugadas e grava somente o que faltou, terminando 45 min antes dos cálculos analíticos.',
  },
  ing_cadastros: {
    id: 'ing_cadastros',
    band: 'ing',
    title: 'Coletores de Cadastro & Geo',
    sub: '05:00 Tags · 05:10 BORG/ArcGIS · 05:20 BOPE/SDOA',
    pos: [-10.5, 2.5, 4.2],
    fid: 'inv',
    badge: '05:00 → 05:20',
    metrics: [
      ['05:00 Cadastro Historian', 'cr-metadata-discovery + sch-metadata-discovery-daily'],
      ['05:10 Organizacional & GIS', 'cr-cadastro-borg + cr-arcgis-geo'],
      ['05:20 Operacional', 'cr-cadastro-operacional (BOPE + SDOA)'],
    ],
    objects: [
      'cr-metadata-discovery (0 5 * * *)',
      'cr-cadastro-borg (10 5 * * *)',
      'cr-arcgis-geo (10 5 * * *)',
      'cr-cadastro-operacional (20 5 * * *)',
    ],
    description: 'Quatro jobs serverless extraem o retrato diário de tags, estrutura organizacional, camadas ArcGIS e unidades operacionais.',
  },

  // 3. RAW
  raw_gcs: {
    id: 'raw_gcs',
    band: 'raw',
    title: 'Cloud Storage + Telemetria RAW',
    sub: '59 GB Parquet · Iceberg measures + base histórica',
    pos: [-3.0, 2.5, -3.8],
    fid: 'inv',
    badge: '59 GB brutos',
    metrics: [
      ['Bucket bruto', 'gs://sanepar-lakehouse-raw-nonprd (59 GB)'],
      ['Telemetria corrente (Iceberg)', 'tb_sanepar_raw_telemetria_measures (32 arq/ciclo)'],
      ['Base histórica (Iceberg)', '4 tabelas desde 28/08/2025'],
    ],
    objects: [
      'fd_sanepar_raw_telemetria/ (32 arquivos/ciclo)',
      'fd_sanepar_raw_telemetria_proprio/ & _terceiros/',
      'tb_sanepar_raw_telemetria_measures (Iceberg)',
      'tb_sanepar_raw_telemetria_device_measures (histórico)',
    ],
    description: 'Armazenamento objeto em Parquet e tabelas Apache Iceberg (BigLake) preservando o dado exatamente como recebido.',
  },
  raw_cadastro_org_op: {
    id: 'raw_cadastro_org_op',
    band: 'raw',
    title: 'RAW Cadastros (Tag, BORG, BOPE, SDOA)',
    sub: '10 tabelas Iceberg · retratos diários',
    pos: [-3.0, 2.5, 0.3],
    fid: 'inv',
    badge: '10 tabelas Iceberg',
    metrics: [
      ['ds_org_sanepar_raw_cadastro', 'tag (17.278) + device (5.756)'],
      ['ds_org_sanepar_raw_organizacional', 'unidade (186), gerencia, localidade (670), vínculo (6.314)'],
      ['ds_org_sanepar_raw_operacional', 'bope_uo (20.116), sistema (1.115), comp (10.742), sdoa (11.848)'],
    ],
    objects: [
      'tb_sanepar_raw_cadastro_tag / device',
      'tb_sanepar_raw_organizacional_unidade / gerencia / localidade',
      'tb_sanepar_raw_operacional_bope_unidade_operacional / sistema',
      'tb_sanepar_raw_operacional_sdoa_unidade_agua',
    ],
    description: 'Tabelas Iceberg na camada RAW para metadados do Historian, hierarquia organizacional BORG e cadastro técnico BOPE/SDOA.',
  },
  raw_geo: {
    id: 'raw_geo',
    band: 'raw',
    title: 'RAW Geografia (ArcGIS)',
    sub: 'ds_org_sanepar_raw_geo · 12 tabelas Iceberg',
    pos: [-3.0, 2.5, 4.3],
    fid: 'inv',
    badge: '12 camadas brutas',
    metrics: [
      ['Dataset BigQuery Iceberg', 'ds_org_sanepar_raw_geo'],
      ['Camadas', 'zona_pressao, dmc, area_influencia, setor_manobra, GR, concessao, 5 UOs'],
    ],
    objects: [
      'tb_sanepar_raw_geo_zona_pressao / distrito_medicao / area_influencia',
      'tb_sanepar_raw_geo_setor_manobra / setor_distribuicao',
      'tb_sanepar_raw_geo_uo_reservatorio / uo_eea / uo_eta / uo_poco / uo_captacao',
    ],
    description: 'Retrato bruto diário das 12 feições espaciais sincronizadas do ArcGIS Portal da Sanepar.',
  },

  // 4. TRUSTED + GOVERNANÇA
  tru_telemetria: {
    id: 'tru_telemetria',
    band: 'tru',
    title: 'Trusted Telemetria',
    sub: '2,18 bi leituras (275 GB) · sem duplicata',
    pos: [4.5, 2.6, -3.5],
    fid: 'inv',
    badge: '2,18 bi · 275 GB',
    metrics: [
      ['Fato unificado', 'ft_sanepar_trusted_telemetria_measures (2,18 bi · 275 GB)'],
      ['Visão de estado atual', 'vw_sanepar_trusted_telemetria_ultima_leitura'],
      ['Tabelas externas backfill', 'ext_sanepar_trusted_telemetria_backfill (terceiros + próprio)'],
    ],
    objects: [
      'ft_sanepar_trusted_telemetria_measures',
      'vw_sanepar_trusted_telemetria_ultima_leitura',
      'ext_sanepar_trusted_telemetria_backfill',
      'ext_sanepar_trusted_telemetria_backfill_proprio',
    ],
    description: 'Unifica os dois parques de telemetria sem duplicidade no BigQuery nativo e expõe a última leitura conhecida de cada tag.',
  },
  tru_cadastro_geo: {
    id: 'tru_cadastro_geo',
    band: 'tru',
    title: 'Trusted Cadastro (SCD2) & Geo Tipada',
    sub: 'Histórico de versões + 12 dimensões GEOGRAPHY',
    pos: [4.5, 2.6, 2.2],
    fid: 'inv',
    badge: '05:30 Dataform',
    metrics: [
      ['Dimensões SCD Tipo 2', 'dm_sanepar_trusted_cadastro_tag (17.278) & device (5.756)'],
      ['Views correntes', 'vw_sanepar_trusted_cadastro_tag_corrente & device_corrente'],
      ['Geografia tipada (12 dm_*)', 'setor_manobra (41.924), uo_poco (4.177), zona_pressao (3.955)...'],
    ],
    objects: [
      'dm_sanepar_trusted_cadastro_tag / device (SCD2)',
      'vw_sanepar_trusted_cadastro_tag_corrente / device_corrente',
      'dm_sanepar_trusted_geo_* (12 dimensões tipadas)',
    ],
    description: 'Mantém o histórico de mudanças cadastrais (SCD2) e converte as geometrias WKT/GeoJSON em tipos espaciais validados do BigQuery.',
  },
  gov_dataform: {
    id: 'gov_dataform',
    band: 'tru',
    title: 'Orquestração Dataform & 40 Regras',
    sub: '6 workflows (05:30–05:40) · ds_org_sanepar_governance',
    pos: [4.5, 5.2, -0.6],
    fid: 'inv',
    badge: '40 assertions',
    metrics: [
      ['Repositórios Dataform', 'df_org_sanepar_trusted + df_org_sanepar_refined'],
      ['Assertions de qualidade', '40 regras (6 cadastro, 12 geo, 5 D4, 5 mapas, 6 param, 6 D6)'],
      ['Auditoria de reconciliação', 'ft_sanepar_governance_telemetria_reconciliacao'],
    ],
    objects: [
      'wf-sanepar-trusted-cadastro / wf-sanepar-trusted-geo (05:30)',
      'wf-sanepar-refined-parametro (05:35)',
      'wf-sanepar-refined-pressao-dia / geo / energia-dia (05:40)',
      'ds_org_sanepar_governance (40 regras + ft_..._reconciliacao)',
    ],
    description: 'Camada transversal que orquestra as transformações SQL no BigQuery e bloqueia anomalias por meio de 40 assertions automatizadas.',
  },

  // 5. REFINED
  ref_parametros: {
    id: 'ref_parametros',
    band: 'ref',
    title: 'Refined Parâmetros de Negócio',
    sub: 'ds_org_sanepar_refined_parametro · 8 tabelas pm_*',
    pos: [12.0, 2.5, -4.2],
    fid: 'inv',
    badge: '05:35 · 22 parâmetros',
    metrics: [
      ['Catálogo e decisões', '22 parâmetros · 29 decisões · 62 vínculos de rastreio'],
      ['Faixas e escalares vigentes', '23 faixas/réguas · 12 escalares · 33 usos em painel'],
      ['Ciclo de atualização', 'pm_sanepar_refined_parametro_ciclo_painel (5 painéis)'],
    ],
    objects: [
      'pm_sanepar_refined_parametro_catalogo (22)',
      'pm_sanepar_refined_parametro_faixa (23) / escalar (12)',
      'pm_sanepar_refined_parametro_decisao (29) / rastreio (62)',
      'pm_sanepar_refined_parametro_uso_painel (33) / ciclo_painel (32)',
    ],
    description: 'Governa fora do código todos os limiares, faixas operacionais e janelas horárias que classificam os indicadores dos painéis.',
  },
  ref_pressao: {
    id: 'ref_pressao',
    band: 'ref',
    title: 'Refined Distribuição & Pressão + Mapas',
    sub: '3.587 pontos · 88.173 linhas/dia · 5 camadas de mapa',
    pos: [12.0, 2.5, 0.0],
    fid: 'inv',
    badge: '05:40 · Produto D4',
    metrics: [
      ['Situação atual (view tempo real)', 'vw_sanepar_refined_distribuicao_agua_pressao_ponto_atual (3.587)'],
      ['Fato diário (mín/máx/média)', 'ft_sanepar_refined_distribuicao_agua_pressao_ponto_dia (88.173)'],
      ['Geografia simplificada p/ Looker', 'zona_pressao (3.776), DMC (3.251), influência (987), GR (22), concessão (400)'],
    ],
    objects: [
      'vw_sanepar_refined_distribuicao_agua_pressao_ponto_atual (3.587)',
      'ft_sanepar_refined_distribuicao_agua_pressao_ponto_dia (88.173)',
      'dm_sanepar_refined_distribuicao_agua_pressao_ponto_geo (3.533)',
      'dm_sanepar_refined_distribuicao_agua_geo_* (5 tabelas para mapas)',
    ],
    description: 'Produto de dados pronto para o monitoramento de pressão na rede de distribuição e renderização ágil de mapas no Looker.',
  },
  ref_energia: {
    id: 'ref_energia',
    band: 'ref',
    title: 'Refined Energia (Unidades Próprias)',
    sub: '190 UOs · 250 interrupções · 1.140 unidade×dia',
    pos: [12.0, 2.5, 4.2],
    fid: 'inv',
    badge: '05:40 · Produto D6',
    metrics: [
      ['Situação atual das unidades', 'vw_sanepar_refined_energia_unidade_atual (190 UOs)'],
      ['Fato de interrupções (início/fim/duração)', 'ft_sanepar_refined_energia_interrupcao (250)'],
      ['Fato diário (minutos sem energia)', 'ft_sanepar_refined_energia_unidade_dia (1.140)'],
    ],
    objects: [
      'vw_sanepar_refined_energia_unidade_atual (190)',
      'ft_sanepar_refined_energia_interrupcao (250)',
      'ft_sanepar_refined_energia_unidade_dia (1.140)',
      'dm_sanepar_refined_energia_ponto (190) / tag_status (190)',
    ],
    description: 'Consolida o status elétrico de cada unidade operacional própria, calculando duração de quedas de energia e acumulado diário.',
  },

  // 6. CONSUMO LOOKER
  use_d0: {
    id: 'use_d0',
    band: 'use',
    title: 'Hub Visão Geral (D0)',
    sub: 'Consolidação executiva dos KPIs operacionais',
    pos: [19.0, 2.8, -4.0],
    fid: 'arq',
    accent: 'pink',
    badge: 'Hub CCO / Diretoria',
    metrics: [
      ['Papel do painel', 'Ponto único de entrada executiva e síntese de criticidade por domínio'],
      ['Leitura de dados', 'Consome exclusivamente views e tabelas da camada Refined'],
    ],
    objects: [
      'pm_sanepar_refined_parametro_ciclo_painel (5 painéis)',
      'Views e fatos agregados da camada Refined',
    ],
    description: 'Painel executivo centralizador (Hub) que sintetiza os indicadores críticos dos domínios operacionais monitorados.',
  },
  use_d4: {
    id: 'use_d4',
    band: 'use',
    title: 'Painel D4 · Pressão na Rede',
    sub: 'Lê vw_..._pressao_ponto_atual + ft_..._ponto_dia + 5 mapas',
    pos: [19.0, 2.8, 0.0],
    fid: 'inv',
    badge: '3.587 pontos ativos',
    metrics: [
      ['Entrada tempo real', 'vw_sanepar_refined_distribuicao_agua_pressao_ponto_atual'],
      ['Série histórica', 'ft_sanepar_refined_distribuicao_agua_pressao_ponto_dia'],
      ['Camadas de mapa', '5 dimensões geográficas otimizadas para visualização'],
    ],
    objects: [
      'vw_sanepar_refined_distribuicao_agua_pressao_ponto_atual',
      'ft_sanepar_refined_distribuicao_agua_pressao_ponto_dia',
      'dm_sanepar_refined_distribuicao_agua_geo_*',
    ],
    description: 'Painel analítico do Looker abastecido pela camada Refined de distribuição de água, com recorte por Gerência Regional, município, DMC e zona de pressão.',
  },
  use_d6: {
    id: 'use_d6',
    band: 'use',
    title: 'Painel D6 · Energia & UOs',
    sub: 'Lê vw_..._energia_unidade_atual + ft_..._interrupcao / dia',
    pos: [19.0, 2.8, 4.0],
    fid: 'inv',
    badge: '190 UOs monitoradas',
    metrics: [
      ['Entrada tempo real', 'vw_sanepar_refined_energia_unidade_atual (190 unidades)'],
      ['Histórico de eventos e diário', 'ft_..._energia_interrupcao (250) + ft_..._unidade_dia (1.140)'],
    ],
    objects: [
      'vw_sanepar_refined_energia_unidade_atual',
      'ft_sanepar_refined_energia_interrupcao',
      'ft_sanepar_refined_energia_unidade_dia',
    ],
    description: 'Painel analítico do Looker para acompanhamento de disponibilidade elétrica nas unidades próprias, duração de interrupções e tempo de regularização.',
  },
};

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
