# Sanepar 3D — Telemetria OT, DHuO e Lakehouse GCP

Visualização 3D interativa e simulador conceitual da jornada de dados operacionais (OT) da **Sanepar**, do barramento corporativo **DHuO** e da plataforma **Lakehouse no Google Cloud (`southamerica-east1`)** até os painéis analíticos **Looker**.

Desenvolvido com a mesma arquitetura técnica do simulador `ultragaz-3d` (Vite + Three.js, motor determinístico desacoplado da cena e zero dependências de CDN em tempo de execução), com identidade visual **Engineering**.

> **Layout conceitual e ilustrativo.** A Unidade Operacional (reservatório, elevatória, VRP/DMC) não utiliza CAD nem geografia real do Paraná. Todos os números de objetos permanentes, volumes e horários reproduzem fielmente o levantamento **`Inventário Lakehouse SANEPAR 2.html`** (lido do GCP em 26/10/2026). Os contadores de sessão no rodapé são gerados pelo motor de simulação e estão explicitamente rotulados como **`Simulado · Sessão`**.

---

## Como executar

Requisitos: **Node.js 18 ou superior** e um navegador moderno com **WebGL** (Edge, Chrome, Firefox).

```powershell
cd "Sanepar - Edital BigData\Projeto\sanepar-3d"
npm install

# servidor de desenvolvimento -> http://127.0.0.1:5173
npm run dev

# verificação automatizada da simulação e do catálogo (Node)
npm run check:sim

# build de produção -> pasta dist/
npm run build
npm run preview
```

---

## O que há na tela

| Área | Função |
| --- | --- |
| **Switch de 2 modos (Topbar)** | Alterna entre **`1 · Operação de campo (OT)`** e **`2 · Plataforma de dados (Lakehouse GCP)`**, reconfigurando a cena 3D, os atalhos de câmera e os 3 cartões executivos. Atalhos de teclado: teclas `1` e `2`. |
| **Faixa de Cartões Executivos** | 3 cartões fixos voltados à diretoria/comitê da Sanepar. Exibem exclusivamente fatos do inventário auditado (`19.552 tags`, `6 fontes via DHuO`, `2,18 bi leituras / 275 GB na Trusted`, `3.587 pontos D4`, `190 UOs D6`, `40 regras de qualidade`). |
| **Cena 1 · Operação de campo (OT)** | Unidade operacional genérica: **Reservatório Apoiado** (nível `LT`), **Estação Elevatória & Quadro de Energia** (status elétrico `KFF` / painel D6), **Rede de Distribuição, VRP e DMC** (pressão `PT` e vazão `FT` / painel D4), **Concentrador RTU / Historian** e envio seguro ao **Gateway DHuO → GCP**. |
| **Cena 2 · Plataforma de dados (Lakehouse GCP)** | Pipeline 3D organizado nas 6 faixas do inventário: **1. Fontes & Gateway DHuO**, **2. Ingestão**, **3. RAW (Parquet + Iceberg)**, **4. Trusted (BigQuery)**, **5. Refined (Produto de Dados)** e **6. Consumo (Looker D0, D4, D6)**, além da camada transversal **Dataform & 40 Regras**. |
| **Botão `Reproduzir madrugada (03:45→05:40)`** | Demonstra em ~40 segundos a janela crítica da madrugada no horário de Brasília: reconciliação D-3..D-1 (`03:45` busca e `04:45` carga), retratos de cadastro e geografia (`05:00` a `05:20`), workflows Dataform da Trusted (`05:30`), parâmetros de negócio (`05:35`) e produtos Refined de Pressão, Mapas e Energia (`05:40`). |
| **Inspeção por clique (Popover técnico)** | Clicar em qualquer equipamento de campo ou nó do Lakehouse abre o cartão técnico com métricas e os nomes reais dos objetos no GCP (`cr-*`, `sch-*`, `ds_*`, `tb_*`, `ft_*`, `dm_*`, `vw_*`, `pm_*`, `wf-*`). |
| **Rodapé `Simulado · Sessão` + Legenda** | Separa visualmente os contadores gerados pela sessão (leituras simuladas, fila Parquet, commits Iceberg, entregas Refined) dos indicadores fixos do inventário. |

**Atalhos:** `Espaço` pausa/continua; `1` e `2` alternam os modos; `Esc` fecha o popover ou interrompe a reprodução da madrugada.

---

## Estrutura do projeto

```text
sanepar-3d/
  index.html                       casca da aplicação + aviso contra abertura via file://
  public/
    eng-logo-dark.svg              logotipo Engineering (Design System Eng)
    fonts/                         tipografia corporativa CocoEng (Regular, Bold, Heavy)
  src/
    main.js                        inicialização, cenas 3D, eventos e ciclo de quadros
    config.js                      parâmetros das cenas, taxas da simulação e fases da madrugada
    content/
      catalog.js                   fatos do Inventário GCP, cartões executivos, nós e links
    simulation/
      EventBus.js                  barramento de eventos síncrono
      DataFlowSimulator.js         motor determinístico (caminho quente 24x7 + janela madrugada)
    scene/
      SceneManager.js              WebGLRenderer, CSS2DRenderer, neblina e redimensionamento
      CameraController.js          OrbitControls + transições suaves entre presets
      Lighting.js                  iluminação técnica e RoomEnvironment local
      Picking.js                   seleção por Raycaster com destaque de bounding box
      materials.js                 materiais e texturas procedurais compartilhados
    factory/
      build.js                     utilitários de geometria 3D
      OperationField.js            Cena 1: Unidade Operacional (reservatório, EEA, VRP, RTU, DHuO)
    integration/
      LakehouseLayer.js            Cena 2: 6 bandas do Lakehouse, 15 nós agrupados, 25 links e pacotes
    ui/
      AppState.js                  estado de visão (2 modos) e seleção
      TopBar.js                    barra superior Engineering, switch de modos e controles
      ExecutiveStrip.js            cartões executivos com dados do inventário
      StageOverlay.js              presets de câmera, banner da madrugada e popover técnico
      SimFooter.js                 contadores da sessão ("Simulado") e legenda de fidelidade
      dom.js                       utilidades mínimas de DOM e formatação PT-BR
    styles/
      base.css                     tokens Design System Engineering + estilos das cenas e cartões
  tools/
    sim-check.mjs                  verificação automatizada da simulação e do catálogo em Node
```
