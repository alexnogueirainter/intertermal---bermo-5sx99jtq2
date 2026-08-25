export interface BermoTechnicalSpecs {
  dimensions?: string // ex: Altura 704mm, Largura 400mm
  connection?: string // ex: DN65, Flange/Rosca/Solda
  maxTemperature?: string // ex: 180°C, -195°C a 200°C
  maxPressure?: string // ex: 10 barg, 30 bar / Teste 45 bar
  maxFlowRate?: string // ex: 20 kg/s
  materials?: string // ex: Placas AISI 316L / Titânio
  gaskets?: string // ex: NBR / EPDM / Viton
  heatExchangeArea?: string // ex: Até 13 m²
  applications?: string // ex: Aquecimento e refrigeração geral, vapor, alimentos
  typeOrFeatures?: string // ex: Triexcêntrica, Passagem Plena, Trunnion
}

export interface BermoProductItem {
  id: string
  code: string
  name: string
  model: string
  category: BermoCategoryKey
  categoryLabel: string
  brand: 'BERMO' | 'ARI Armaturen'
  description: string
  basePrice: number
  specs: BermoTechnicalSpecs
}

export type BermoCategoryKey =
  | 'heat_exchanger_gasketed'
  | 'heat_exchanger_brazed'
  | 'butterfly_valves'
  | 'ball_valves'
  | 'automation'
  | 'industrial_accessories'

export const BERMO_CATEGORIES: {
  key: BermoCategoryKey
  label: string
  icon: string
  description: string
}[] = [
  {
    key: 'heat_exchanger_gasketed',
    label: 'Trocadores de Calor a Placas Gaxetados',
    icon: 'Layers',
    description:
      'Trocadores de placas desmontáveis com gaxetas para alta eficiência térmica e fácil manutenção.',
  },
  {
    key: 'heat_exchanger_brazed',
    label: 'Trocadores de Calor a Placas Brasados',
    icon: 'Flame',
    description:
      'Trocadores compactos soldados a cobre/inox, alta resistência à pressão e temperaturas extremas.',
  },
  {
    key: 'butterfly_valves',
    label: 'Válvulas Borboleta (ARI Armaturen)',
    icon: 'Disc',
    description:
      'Válvulas borboleta industriais alemãs de alta performance ARI-ZESA, ARI-GESA, ARI-ZIVA e ARI-ZETRIX.',
  },
  {
    key: 'ball_valves',
    label: 'Válvulas de Esfera',
    icon: 'CircleDot',
    description:
      'Válvulas bipartidas, tripartidas e trunnion para bloqueio industrial de fluidos e vapores.',
  },
  {
    key: 'automation',
    label: 'Automação & Controle',
    icon: 'Cpu',
    description:
      'Painéis Total Control, temporizadores CDP, transmissores de pressão e controle de descarga.',
  },
  {
    key: 'industrial_accessories',
    label: 'Acessórios Industriais',
    icon: 'Wrench',
    description:
      'Separadores de umidade SUV, estações misturadoras água/vapor, resfriadores de amostra e compensadores.',
  },
]

export const BERMO_CATALOG: BermoProductItem[] = [
  // 1. Trocadores Gaxetados
  {
    id: 'bermo-bp6',
    code: 'BERMO-BP6',
    name: 'Trocador de Calor a Placas Gaxetado BP6',
    model: 'BP6',
    category: 'heat_exchanger_gasketed',
    categoryLabel: 'Trocadores de Calor a Placas Gaxetados',
    brand: 'BERMO',
    description:
      'Trocador de calor a placas gaxetado compacto para aplicações gerais de aquecimento, resfriamento e recuperação térmica.',
    basePrice: 14500,
    specs: {
      dimensions: 'Altura 704 mm, Largura 400 mm',
      connection: 'DN65 (2.1/2")',
      maxTemperature: '180 °C',
      maxPressure: '10 barg',
      maxFlowRate: '20 kg/s (72 m³/h)',
      materials: 'Placas em AISI 316L, Hastelloy C276 ou Titânio Gr.1',
      gaskets: 'Gaxetas em NBR, EPDM ou Viton (Clip-on / Coladas)',
      heatExchangeArea: 'Área máxima de 13 m²',
      applications: 'Aquecimento e refrigeração geral, processos industriais, circuitos HVAC.',
    },
  },
  {
    id: 'bermo-bp30',
    code: 'BERMO-BP30',
    name: 'Trocador de Calor a Placas Gaxetado BP30',
    model: 'BP30',
    category: 'heat_exchanger_gasketed',
    categoryLabel: 'Trocadores de Calor a Placas Gaxetados',
    brand: 'BERMO',
    description:
      'Trocador de calor gaxetado de média-alta capacidade para indústrias químicas, têxteis e celulose.',
    basePrice: 28900,
    specs: {
      dimensions: 'Altura 1.150 mm, Largura 480 mm',
      connection: 'DN100 (4")',
      maxTemperature: '180 °C',
      maxPressure: '16 barg',
      maxFlowRate: '55 kg/s (198 m³/h)',
      materials: 'Placas em AISI 316L / Titânio Gr.1 / Hastelloy',
      gaskets: 'Gaxetas em NBR / EPDM / Viton',
      heatExchangeArea: 'Área máxima de 45 m²',
      applications: 'Processamento térmico contínuo, óleo térmico, recuperação de calor residual.',
    },
  },
  {
    id: 'bermo-bp60',
    code: 'BERMO-BP60',
    name: 'Trocador de Calor a Placas Gaxetado BP60',
    model: 'BP60',
    category: 'heat_exchanger_gasketed',
    categoryLabel: 'Trocadores de Calor a Placas Gaxetados',
    brand: 'BERMO',
    description:
      'Trocador de placas gaxetado de grande porte para elevadas vazões volumétricas e alta carga térmica.',
    basePrice: 52000,
    specs: {
      dimensions: 'Altura 1.680 mm, Largura 620 mm',
      connection: 'DN150 (6")',
      maxTemperature: '190 °C',
      maxPressure: '16 barg',
      maxFlowRate: '120 kg/s (430 m³/h)',
      materials: 'Placas em AISI 316L / 254 SMO / Titânio',
      gaskets: 'Gaxetas em NBR / EPDM / Fluorelastômero Viton',
      heatExchangeArea: 'Área máxima de 120 m²',
      applications: 'Usinas de açúcar e etanol, indústrias siderúrgicas e petroquímicas.',
    },
  },
  {
    id: 'bermo-bp6-sanitario',
    code: 'BERMO-BP6-SAN',
    name: 'Trocador de Calor a Placas BP6 Sanitário',
    model: 'BP6 Sanitário',
    category: 'heat_exchanger_gasketed',
    categoryLabel: 'Trocadores de Calor a Placas Gaxetados',
    brand: 'BERMO',
    description:
      'Versão sanitária com conexões clamp/SMS, acabamento polido para indústrias alimentícias, bebidas e farmacêuticas.',
    basePrice: 19800,
    specs: {
      dimensions: 'Altura 720 mm, Largura 400 mm (Estrutura Inox Sanitária)',
      connection: 'Tri-Clamp DN65 / SMS / RJT',
      maxTemperature: '160 °C',
      maxPressure: '10 barg',
      maxFlowRate: '20 kg/s',
      materials: 'Placas AISI 316L eletropolidas Ra < 0.8 µm',
      gaskets: 'Gaxetas em EPDM FDA / Silicone Grau Alimentício',
      heatExchangeArea: 'Área máxima de 13 m²',
      applications: 'Pasteurização de leite, sucos, cervejaria, xopes e soluções biofarmacêuticas.',
    },
  },
  {
    id: 'bermo-bp30-sanitario',
    code: 'BERMO-BP30-SAN',
    name: 'Trocador de Calor a Placas BP30 Sanitário',
    model: 'BP30 Sanitário',
    category: 'heat_exchanger_gasketed',
    categoryLabel: 'Trocadores de Calor a Placas Gaxetados',
    brand: 'BERMO',
    description:
      'Versão sanitária de média capacidade com cabeçotes revestidos em aço inox e certificação 3-A / FDA.',
    basePrice: 36500,
    specs: {
      dimensions: 'Altura 1.200 mm, Largura 490 mm',
      connection: 'Tri-Clamp DN100 / DIN 11851',
      maxTemperature: '160 °C',
      maxPressure: '16 barg',
      maxFlowRate: '50 kg/s',
      materials: 'Placas AISI 316L polimento sanitário',
      gaskets: 'Gaxetas EPDM FDA atóxicas',
      heatExchangeArea: 'Área máxima de 45 m²',
      applications: 'Processamento de laticínios, condensação de vapores limpos, sistemas CIP/SIP.',
    },
  },

  // 2. Trocadores Brasados
  {
    id: 'bermo-bl14',
    code: 'BERMO-BL14',
    name: 'Trocador de Calor Brasado BL14',
    model: 'BL14',
    category: 'heat_exchanger_brazed',
    categoryLabel: 'Trocadores de Calor a Placas Brasados',
    brand: 'BERMO',
    description:
      'Trocador de placas brasadas compacto ultra-resistente para climatização e óleo hidráulico.',
    basePrice: 3200,
    specs: {
      dimensions: 'Altura 208 mm, Largura 74 mm',
      connection: 'Rosca BSP 3/4" ou Solda',
      maxTemperature: '-195 °C a +200 °C',
      maxPressure: 'Projeto: 30 bar | Teste hidrostático: 45 bar',
      maxFlowRate: '4 m³/h',
      materials: 'Placas em Aço Inox AISI 316L',
      gaskets: 'Brasagem a Cobre puro 99.9% (Sem gaxetas)',
      heatExchangeArea: 'Até 1.5 m²',
      applications:
        'Refrigeração, chillers compactos, aquecimento solar, resfriamento de óleo hidráulico.',
    },
  },
  {
    id: 'bermo-bl20',
    code: 'BERMO-BL20',
    name: 'Trocador de Calor Brasado BL20',
    model: 'BL20',
    category: 'heat_exchanger_brazed',
    categoryLabel: 'Trocadores de Calor a Placas Brasados',
    brand: 'BERMO',
    description:
      'Trocador brasado com excelente custo-benefício para bombas de calor e evaporadores/condensadores.',
    basePrice: 4600,
    specs: {
      dimensions: 'Altura 324 mm, Largura 94 mm',
      connection: 'Rosca BSP 1" ou Solda ODS',
      maxTemperature: '-195 °C a +200 °C',
      maxPressure: 'Projeto: 30 bar | Teste: 45 bar',
      maxFlowRate: '9 m³/h',
      materials: 'Placas em AISI 316L',
      gaskets: 'Brasagem a Cobre puro',
      heatExchangeArea: 'Até 3.8 m²',
      applications:
        'Condensadores frigoríficos, trocadores de óleo para compressores e caldeiras murais.',
    },
  },
  {
    id: 'bermo-bl26',
    code: 'BERMO-BL26',
    name: 'Trocador de Calor Brasado BL26',
    model: 'BL26',
    category: 'heat_exchanger_brazed',
    categoryLabel: 'Trocadores de Calor a Placas Brasados',
    brand: 'BERMO',
    description: 'Trocador brasado de capacidade intermediária com conexões de 1.1/4".',
    basePrice: 6800,
    specs: {
      dimensions: 'Altura 310 mm, Largura 112 mm',
      connection: 'Rosca BSP 1.1/4" / Solda',
      maxTemperature: '-195 °C a +200 °C',
      maxPressure: 'Projeto: 30 bar | Teste: 45 bar',
      maxFlowRate: '14 m³/h',
      materials: 'Placas em AISI 316L',
      gaskets: 'Brasagem a Cobre',
      heatExchangeArea: 'Até 5.6 m²',
      applications:
        'Sistemas solares térmicos centralizados, recuperação em geradores e resfriamento industrial.',
    },
  },
  {
    id: 'bermo-bl26c',
    code: 'BERMO-BL26C',
    name: 'Trocador de Calor Brasado BL26C (Alta Pressão/CO2)',
    model: 'BL26C',
    category: 'heat_exchanger_brazed',
    categoryLabel: 'Trocadores de Calor a Placas Brasados',
    brand: 'BERMO',
    description:
      'Versão especial de alta pressão reforçada para gases ecológicos e fluidos térmicos agressivos.',
    basePrice: 8400,
    specs: {
      dimensions: 'Altura 310 mm, Largura 112 mm (Reforçado)',
      connection: 'Conexões Solda de Alta Pressão',
      maxTemperature: '-195 °C a +200 °C',
      maxPressure: 'Projeto: 45 bar | Teste: 65 bar',
      maxFlowRate: '14 m³/h',
      materials: 'Placas Inox 316L espessura reforçada',
      gaskets: 'Brasagem Cobre / Níquel Especial',
      heatExchangeArea: 'Até 5.6 m²',
      applications:
        'Sistemas com R410A, CO2 subcrítico, trocadores para circuitos de alta pressão.',
    },
  },
  {
    id: 'bermo-bl50',
    code: 'BERMO-BL50',
    name: 'Trocador de Calor Brasado BL50',
    model: 'BL50',
    category: 'heat_exchanger_brazed',
    categoryLabel: 'Trocadores de Calor a Placas Brasados',
    brand: 'BERMO',
    description:
      'Trocador brasado de alta vazão para subestações térmicas, centrais de água gelada (CAG) e vapor saturado.',
    basePrice: 13900,
    specs: {
      dimensions: 'Altura 527 mm, Largura 190 mm',
      connection: 'Flange DN50 / Rosca 2"',
      maxTemperature: '-195 °C a +200 °C',
      maxPressure: 'Projeto: 30 bar | Teste: 45 bar',
      maxFlowRate: '35 m³/h',
      materials: 'Placas em AISI 316L',
      gaskets: 'Brasagem a Cobre puro 99.9%',
      heatExchangeArea: 'Até 18 m²',
      applications:
        'Aquecimento urbano, subestações prediais de vapor, centrais de ar condicionado.',
    },
  },

  // 3. Válvulas Borboleta (ARI Armaturen)
  {
    id: 'ari-zesa',
    code: 'ARI-ZESA',
    name: 'Válvula Borboleta ARI-ZESA (Wafer)',
    model: 'ARI-ZESA',
    category: 'butterfly_valves',
    categoryLabel: 'Válvulas Borboleta',
    brand: 'ARI Armaturen',
    description:
      'Válvula borboleta tipo Wafer com furos passantes alongados para centragem entre flanges.',
    basePrice: 1850,
    specs: {
      typeOrFeatures:
        'Furos alongados tipo Wafer, alavanca com trava multiposição / redutor manual',
      connection: 'Entre flanges EN 1092-1 / ANSI B16.5 DN25 a DN500',
      maxTemperature: '-10 °C a +130 °C (EPDM) / +200 °C (Viton)',
      maxPressure: 'PN6 / PN10 / PN16',
      materials: 'Corpo em Ferro Fundido Nodular EN-GJS-400-15, Disco em Inox 1.4408',
      gaskets: 'Sede de vedação em EPDM / NBR / Viton',
      applications: 'Água fria, água quente, potável, água de processo, sistemas HVAC.',
    },
  },
  {
    id: 'ari-gesa',
    code: 'ARI-GESA',
    name: 'Válvula Borboleta ARI-GESA (Lug)',
    model: 'ARI-GESA',
    category: 'butterfly_valves',
    categoryLabel: 'Válvulas Borboleta',
    brand: 'ARI Armaturen',
    description:
      'Válvula borboleta tipo Lug com furos roscados, permitindo instalação de fim de linha.',
    basePrice: 2400,
    specs: {
      typeOrFeatures: 'Furos roscados tipo Lug para serviço de fim de linha, alavanca com trava',
      connection: 'Roscada Lug DN25 a DN500 (PN10/PN16/Class 150)',
      maxTemperature: '-10 °C a +130 °C',
      maxPressure: 'PN16 bar',
      materials: 'Corpo Nodular EN-GJS-400, Disco Aço Inox 316',
      gaskets: 'Sede EPDM / NBR / PTFE',
      applications:
        'Bloqueio seguro em fim de linha em tanques, utilidades industriais e sistemas pressurizados.',
    },
  },
  {
    id: 'ari-ziva-z',
    code: 'ARI-ZIVA-Z',
    name: 'Válvula Borboleta ARI-ZIVA Z (Wafer Industrial)',
    model: 'ARI-ZIVA Z',
    category: 'butterfly_valves',
    categoryLabel: 'Válvulas Borboleta',
    brand: 'ARI Armaturen',
    description:
      'Válvula borboleta com furos alongados, excelente vedação estanque e baixo torque operacional.',
    basePrice: 2100,
    specs: {
      typeOrFeatures:
        'Furos alongados, disco hidrodinâmico com menor perda de carga, alavanca com trava',
      connection: 'Wafer universal DN25 a DN600',
      maxTemperature: '-10 °C a +150 °C',
      maxPressure: 'PN16',
      materials: 'Corpo EN-JL1040 / EN-JS1030, Disco Inox 1.4408',
      gaskets: 'Manga de vedação EPDM/NBR intercambiável',
      applications: 'Ar comprimido, gases inertes, água desmineralizada e circuitos industriais.',
    },
  },
  {
    id: 'ari-ziva-g',
    code: 'ARI-ZIVA-G',
    name: 'Válvula Borboleta ARI-ZIVA G (Lug Industrial)',
    model: 'ARI-ZIVA G',
    category: 'butterfly_valves',
    categoryLabel: 'Válvulas Borboleta',
    brand: 'ARI Armaturen',
    description:
      'Válvula borboleta com furos roscados tipo Lug da linha ZIVA, indicada para manutenção em linha viva.',
    basePrice: 2750,
    specs: {
      typeOrFeatures:
        'Furos roscados Lug, permite desmontagem a jusante sem esvaziamento da montante',
      connection: 'Lug DN25 a DN600',
      maxTemperature: '-10 °C a +150 °C',
      maxPressure: 'PN16',
      materials: 'Corpo Ferro Nodular, Disco AISI 316',
      gaskets: 'Sede vulcanizada ou encaixada',
      applications: 'Isolamento de bombas, caldeiras, trocadores de calor e linhas de processo.',
    },
  },
  {
    id: 'ari-zetrix',
    code: 'ARI-ZETRIX',
    name: 'Válvula Borboleta Triexcêntrica ARI-ZETRIX',
    model: 'ARI-ZETRIX',
    category: 'butterfly_valves',
    categoryLabel: 'Válvulas Borboleta',
    brand: 'ARI Armaturen',
    description:
      'Válvula de alta performance triexcêntrica, dupla flange, vedação metal x metal estanque (Zero Leakage).',
    basePrice: 12500,
    specs: {
      typeOrFeatures:
        'Geometria triexcêntrica (Triple Offset), dupla flange, vedação metal-metal estanque',
      connection: 'Dupla Flange / Solda DN80 a DN600 (Class 150/300 e PN10 a PN40)',
      maxTemperature: '-60 °C a +450 °C',
      maxPressure: 'Até 40 bar / Class 300',
      materials: 'Corpo Aço Carbono 1.0619 / Inox 1.4408, Disco Inox estelitado',
      gaskets: 'Anel de vedação metálico em Inox/Grafite laminado',
      applications:
        'Vapor superaquecido, óleo térmico, hidrocarbonetos, produtos químicos e criogenia.',
    },
  },

  // 4. Válvulas de Esfera
  {
    id: 'bermo-esfera-bip-150',
    code: 'BERMO-VE-BIP-150',
    name: 'Válvula de Esfera Bipartida Passagem Plena Classe 150',
    model: 'Bipartida Passagem Plena Classe 150',
    category: 'ball_valves',
    categoryLabel: 'Válvulas de Esfera',
    brand: 'BERMO',
    description:
      'Válvula de esfera bipartida flangeada com passagem 100% plena, haste a prova de expulsão e Fire-Safe.',
    basePrice: 1950,
    specs: {
      typeOrFeatures: 'Corpo bipartido em 2 peças (Split Body), passagem plena, montagem flutuante',
      connection: 'Flange ASME B16.5 Classe 150 (1/2" a 8")',
      maxTemperature: '-29 °C a +230 °C',
      maxPressure: '19.6 bar (Classe 150)',
      materials: 'Aço Carbono WCB ou Aço Inox CF8M (316)',
      gaskets: 'Vedação em PTFE puro, RTFE (reforçado) ou Devlon',
      applications:
        'Bloqueio on/off em linhas de vapor saturado, condensado, ar e produtos químicos.',
    },
  },
  {
    id: 'bermo-esfera-bip-300',
    code: 'BERMO-VE-BIP-300',
    name: 'Válvula de Esfera Bipartida Passagem Plena Classe 300',
    model: 'Bipartida Passagem Plena Classe 300',
    category: 'ball_valves',
    categoryLabel: 'Válvulas de Esfera',
    brand: 'BERMO',
    description:
      'Válvula de esfera bipartida robusta para pressões elevadas até 51 bar em processos industriais.',
    basePrice: 3100,
    specs: {
      typeOrFeatures:
        'Passagem plena, classe de pressão 300 lbs, vedação com alívio automático de cavidade',
      connection: 'Flange ASME B16.5 Classe 300 (1/2" a 6")',
      maxTemperature: '-29 °C a +260 °C',
      maxPressure: '51.1 bar (Classe 300)',
      materials: 'Corpo ASTM A216 WCB / Inox CF8M',
      gaskets: 'PTFE + 15% Fibra de Vidro / PEEK',
      applications:
        'Linhas de vapor de alta pressão, gases comprimidos e fluidos industriais sob pressão.',
    },
  },
  {
    id: 'bermo-esfera-trunnion',
    code: 'BERMO-VE-TRUNNION',
    name: 'Válvula de Esfera Tripartida Trunnion Classes 150/600/1500',
    model: 'Tripartida Trunnion Classes 150/600/1500',
    category: 'ball_valves',
    categoryLabel: 'Válvulas de Esfera',
    brand: 'BERMO',
    description:
      'Válvula Trunnion com esfera fixada em munhões superior e inferior, garantindo baixo torque em alta pressão.',
    basePrice: 8900,
    specs: {
      typeOrFeatures:
        'Montagem Trunnion montada sobre munhão, dupla vedação DBB (Double Block and Bleed)',
      connection: 'Flangeadas Classe 150, 300, 600, 900 e 1500 (2" a 24")',
      maxTemperature: '-46 °C a +350 °C',
      maxPressure: 'Até 250 bar (Classe 1500)',
      materials: 'Corpo A105 Forjado / WCB / F316',
      gaskets: 'Sedes resilientes PEEK/Devlon ou Metal x Metal com Tungstênio',
      applications:
        'Dutos de petróleo, gás natural, vapor supercrítico e linhas de transmissão de fluidos.',
    },
  },
  {
    id: 'bermo-esfera-forjada-800',
    code: 'BERMO-VE-FORJ-800',
    name: 'Válvula de Esfera Tripartida Forjada Classe 800',
    model: 'Tripartida Forjada Classe 800',
    category: 'ball_valves',
    categoryLabel: 'Válvulas de Esfera',
    brand: 'BERMO',
    description:
      'Válvula tripartida em corpo forjado de alta densidade para alta ciclagem e manutenção rápida sem retirar tubulação.',
    basePrice: 1450,
    specs: {
      typeOrFeatures:
        'Construção tripartida (3 peças) em aço forjado, conexões roscadas ou para solda de topo',
      connection: 'Rosca NPT/BSPT ou Solda SW (Socket Weld) 1/4" a 2"',
      maxTemperature: '-29 °C a +240 °C',
      maxPressure: 'Classe 800 (138 bar à temperatura ambiente)',
      materials: 'Corpo ASTM A105 Forjado / A182 F316',
      gaskets: 'Sedes PTFE / R-PTFE / PEEK',
      applications:
        'Sistemas de amostragem, injeção química, compressores de ar e vapor de alta pressão.',
    },
  },
  {
    id: 'bermo-esfera-trip-300',
    code: 'BERMO-VE-TRIP-300',
    name: 'Válvula de Esfera Tripartida Classe 300',
    model: 'Tripartida Classe 300',
    category: 'ball_valves',
    categoryLabel: 'Válvulas de Esfera',
    brand: 'BERMO',
    description:
      'Válvula tripartida versátil com flange classe 300 para processos químicos e térmicos.',
    basePrice: 2600,
    specs: {
      typeOrFeatures:
        'Corpo em 3 peças facilitando inspeção de internos, trava de segurança na alavanca',
      connection: 'Flange Classe 300 / SW / BW (1/2" a 4")',
      maxTemperature: '-20 °C a +220 °C',
      maxPressure: '50 bar',
      materials: 'Inox ASTM A351 CF8M / Aço Carbono WCB',
      gaskets: 'PTFE Carbo-grafite',
      applications: 'Água superaquecida, condensado, linhas de solventes e fluidos petroquímicos.',
    },
  },

  // 5. Automação
  {
    id: 'bermo-total-control-btc',
    code: 'BERMO-BTC-PANEL',
    name: 'Painel Total Control BTC',
    model: 'Painel Total Control BTC',
    category: 'automation',
    categoryLabel: 'Automação',
    brand: 'BERMO',
    description:
      'Painel microprocessado para controle automático de purga de fundo, TDS e condutividade em caldeiras a vapor.',
    basePrice: 9800,
    specs: {
      typeOrFeatures:
        'Display LCD digital, temporizador cíclico ajustável, I/O para válvulas pneumáticas e sensores',
      connection: 'Alimentação 110/220V AC, saídas a relé 24V DC / 220V',
      maxTemperature: 'Ambiente de operação 0 °C a +55 °C',
      maxPressure: 'N/A (painel elétrico IP65)',
      materials: 'Gabinete metálico pintura epóxi / Policarbonato com proteção UV',
      applications: 'Automação de purgas contínuas e intermitentes em geradores de vapor.',
    },
  },
  {
    id: 'bermo-valvula-df40',
    code: 'BERMO-DF-DFA40',
    name: 'Válvula de Descarga de Fundo DF/DFA-40',
    model: 'Válvulas Descarga de Fundo DF/DFA-40',
    category: 'automation',
    categoryLabel: 'Automação',
    brand: 'BERMO',
    description:
      'Válvula tipo disco com acionamento manual ou atuador pneumático diafragma para purga rápida de lodo em caldeiras.',
    basePrice: 6200,
    specs: {
      typeOrFeatures: 'Abertura rápida anti-incrustante para arraste de sólidos decantados',
      connection: 'Flanges PN40 / ANSI 300 DN32, DN40 e DN50',
      maxTemperature: '+250 °C',
      maxPressure: '40 barg',
      materials: 'Corpo Aço Forjado GP240GH / 1.0619, Internos Inox endurecido',
      gaskets: 'Vedação metal x metal resistente à erosão',
      applications:
        'Descarga periódica de fundo em caldeiras a vapor, eliminando incrustações e lodo.',
    },
  },
  {
    id: 'bermo-cdp-timer',
    code: 'BERMO-CDP-4-8',
    name: 'Temporizador CDP-4 e CDP-8',
    model: 'Temporizador CDP-4 e CDP-8',
    category: 'automation',
    categoryLabel: 'Automação',
    brand: 'BERMO',
    description:
      'Temporizador digital programável para ciclo de acionamento de purgas automáticas e válvulas solenoides.',
    basePrice: 1850,
    specs: {
      typeOrFeatures: 'Temporização de intervalo (0.5 a 45 min) e tempo de descarga (0.5 a 10 s)',
      connection: 'Conector DIN 43650A integrado',
      maxTemperature: '-10 °C a +60 °C',
      maxPressure: 'Grau de proteção IP65',
      materials: 'Corpo em ABS antichama',
      applications:
        'Controle de purga automática de condensado em compressores, reservatórios e caldeiras.',
    },
  },
  {
    id: 'bermo-tpb102',
    code: 'BERMO-TPB-102',
    name: 'Transmissor de Pressão TPB 102',
    model: 'Transmissor de Pressão TPB 102',
    category: 'automation',
    categoryLabel: 'Automação',
    brand: 'BERMO',
    description:
      'Transmissor de pressão piezorresistivo de alta estabilidade com saída 4-20mA e protocolo HART.',
    basePrice: 2450,
    specs: {
      typeOrFeatures:
        'Sensor cerâmico piezorresistivo, display digital local opcional, calibração em campo',
      connection: 'Rosca 1/2" NPT Macho ou BSP',
      maxTemperature: '-40 °C a +125 °C (com selo até 250 °C)',
      maxPressure: 'Faixas de 0..1 bar até 0..600 bar',
      materials: 'Corpo Inox AISI 316L, Diafragma em Inox 316L / Hastelloy',
      applications:
        'Monitoramento contínuo de pressão em linhas de vapor, óleo térmico e trocadores de calor.',
    },
  },
  {
    id: 'bermo-transmissor-base',
    code: 'BERMO-TP-BASE',
    name: 'Transmissor de Pressão (Modelo Base Industrial)',
    model: 'Transmissor de Pressão (modelo base)',
    category: 'automation',
    categoryLabel: 'Automação',
    brand: 'BERMO',
    description:
      'Transmissor compacto analógico 4-20mA 2 fios para medição padrão em centrais térmicas.',
    basePrice: 1650,
    specs: {
      typeOrFeatures: 'Sinal 4 a 20 mA a 2 fios, precisão 0.5% FS, tempo de resposta < 2ms',
      connection: 'Rosca 1/4" ou 1/2" NPT',
      maxTemperature: '-20 °C a +85 °C',
      maxPressure: '0 a 25 bar',
      materials: 'Invólucro em Aço Inox 304',
      applications: 'Supervisão de pressão em utilidades, ar comprimido, redes de água e vapor.',
    },
  },

  // 6. Acessórios Industriais
  {
    id: 'bermo-suv',
    code: 'BERMO-SUV',
    name: 'Separadores de Umidade Verticais SUV',
    model: 'Separadores de Umidade Verticais SUV',
    category: 'industrial_accessories',
    categoryLabel: 'Acessórios Industriais',
    brand: 'BERMO',
    description:
      'Separador centrífugo vertical para eliminação de gotículas de água em linhas de vapor e ar comprimido.',
    basePrice: 5400,
    specs: {
      typeOrFeatures: 'Separação centrífuga com chicanas helicoidais internas, eficiência > 98%',
      connection: 'Flange ANSI 150 / PN16 / PN40 DN15 a DN200',
      maxTemperature: '+250 °C',
      maxPressure: 'PN16 / PN25 / PN40',
      materials: 'Corpo Aço Carbono ASTM A106 Gr. B / Aço Inox',
      applications: 'Secagem de vapor na entrada de trocadores de calor, turbinas e autoclaves.',
    },
  },
  {
    id: 'bermo-wd2010',
    code: 'BERMO-WD-2010',
    name: 'Estação Misturadora Água/Vapor WD2010/WD2010L/WD2010H',
    model: 'Estação Misturadora Água/Vapor WD2010/WD2010L/WD2010H',
    category: 'industrial_accessories',
    categoryLabel: 'Acessórios Industriais',
    brand: 'BERMO',
    description:
      'Estação automática para geração instantânea de água quente através da injeção direta e silenciosa de vapor.',
    basePrice: 7900,
    specs: {
      typeOrFeatures:
        'Válvula termostática com corte automático contra falta de água fria (anti-queimadura)',
      connection: 'Entradas 3/4" BSP água e vapor, Saída 3/4" água quente misturada',
      maxTemperature: 'Água quente ajustável de 35 °C a 95 °C',
      maxPressure: 'Pressão de vapor: 2 a 10 bar | Água: 2 a 10 bar',
      materials: 'Corpo em Bronze / Aço Inox, internas em Inox e PTFE',
      applications:
        'Higienização e lavagem de pisos, carcaças e tanques em frigoríficos, laticínios e cervejarias.',
    },
  },
  {
    id: 'bermo-tc-condensado',
    code: 'BERMO-TC-COND',
    name: 'Compensadores de Condensado TC',
    model: 'Compensadores de Condensado TC',
    category: 'industrial_accessories',
    categoryLabel: 'Acessórios Industriais',
    brand: 'BERMO',
    description:
      'Vaso de condensação e equalização para tomadas de transmissores de nível e pressão diferencial em vapor.',
    basePrice: 1980,
    specs: {
      typeOrFeatures:
        'Câmara de equilíbrio hidrostático para proteção térmica do transmissor de pressão',
      connection: 'Rosca 1/2" NPT ou Solda SW',
      maxTemperature: '+400 °C',
      maxPressure: '100 bar',
      materials: 'Tubo sem costura A106 Gr B / Aço Inox 316',
      applications: 'Medição de vazão por placa de orifício em linhas de vapor superaquecido.',
    },
  },
  {
    id: 'bermo-resfriador-amostra',
    code: 'BERMO-RA-STD',
    name: 'Resfriador de Amostra Industrial',
    model: 'Resfriador de Amostra',
    category: 'industrial_accessories',
    categoryLabel: 'Acessórios Industriais',
    brand: 'BERMO',
    description:
      'Trocador de calor tubular helicoidal compacto para resfriamento seguro de amostras de água de caldeira.',
    basePrice: 2850,
    specs: {
      dimensions: 'Diâmetro 114 mm, Altura 450 mm',
      connection: 'Entrada/Saída Amostra: 1/4" / 3/8" NPT | Refrigeração: 1/2" BSP',
      maxTemperature: '+400 °C na serpentina',
      maxPressure: 'Serpentina: 100 bar | Carcaça: 16 bar',
      materials: 'Serpentina contínua em Inox 316L, carcaça em Aço Carbono/Inox',
      applications:
        'Coleta de amostras de água de caldeira para controle químico de pH, condutividade e sílica.',
    },
  },
  {
    id: 'bermo-ra30-sanitario',
    code: 'BERMO-RA30-SAN',
    name: 'Resfriador de Amostra Sanitário RA30',
    model: 'Resfriador de Amostra Sanitário RA30',
    category: 'industrial_accessories',
    categoryLabel: 'Acessórios Industriais',
    brand: 'BERMO',
    description:
      'Resfriador de amostra totalmente desmontável em aço inox sanitário polido para vapor puro e água WFI.',
    basePrice: 4800,
    specs: {
      dimensions: 'Diâmetro 120 mm, Altura 480 mm (Desmontável)',
      connection: 'Tri-Clamp 1/2" para amostra e 3/4" para água de resfriamento',
      maxTemperature: '+200 °C',
      maxPressure: 'Serpentina: 40 bar | Carcaça: 10 bar',
      materials: 'Totalmente em Aço Inox 316L eletropolido (Ra < 0.4 µm)',
      applications:
        'Coleta de amostra de vapor limpo/puro em autoclaves, linhas WFI e biorreatores farmacêuticos.',
    },
  },
]
