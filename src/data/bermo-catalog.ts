export type BermoCategoryKey = 'valvulas' | 'trocadores' | 'sistemas' | 'instrumentacao'

export interface BermoProductItem {
  id: string
  code: string
  name: string
  brand: 'BERMO' | 'Alfa Laval' | 'ARI Armaturen' | 'Outro'
  model: string
  category: 'Válvulas' | 'Trocadores de Calor' | 'Sistemas' | 'Instrumentação'
  categoryKey?: BermoCategoryKey
  categoryLabel?: string
  description: string
  basePrice: number
  specs: {
    connection: string
    pressure: string
    maxPressure?: string
    temperature: string
    maxTemperature?: string
    material: string
    materials?: string
    gasketMaterial?: string
    gaskets?: string
    platesRange?: string
    platesCount?: string
    plateDimensions?: string
    dimensions?: string
    gasketsCount?: string
    maxFlowRate?: string
    heatExchangeArea?: string
    typeOrFeatures?: string
    applications?: string
  }
}

export const BERMO_CATEGORIES: { id: BermoCategoryKey; label: string; count?: number }[] = [
  { id: 'trocadores', label: 'Trocadores de Calor a Placas' },
  { id: 'valvulas', label: 'Válvulas Industriais' },
  { id: 'sistemas', label: 'Sistemas Térmicos & Skids' },
  { id: 'instrumentacao', label: 'Instrumentação & Controle' },
]

export const BERMO_CATALOG: BermoProductItem[] = [
  // ----------------------------------------------------
  // CATÁLOGO OFICIAL BERMO
  // ----------------------------------------------------
  {
    id: 'bermo-bp6',
    code: 'BP6',
    name: 'Trocador de Calor a Placas BP6',
    brand: 'BERMO',
    model: 'BP6',
    category: 'Trocadores de Calor',
    categoryKey: 'trocadores',
    categoryLabel: 'Trocadores de Calor a Placas',
    description: 'Trocador de calor a placas desmontável para aplicações de baixa a média vazão.',
    basePrice: 12500,
    specs: {
      connection: '1" BSP / NPT',
      pressure: '16 bar',
      maxPressure: '16 bar',
      temperature: '-10°C a 150°C',
      maxTemperature: '150°C',
      material: 'AISI 316L / Titânio',
      materials: 'AISI 316L / Titânio',
      gasketMaterial: 'NBR / EPDM',
      gaskets: 'NBR / EPDM',
      platesRange: '10 a 50 placas',
      platesCount: '10 a 50 placas',
      plateDimensions: '320 x 130 mm',
      dimensions: '320 x 130 mm',
      gasketsCount: '10 a 50',
      maxFlowRate: '8 m³/h',
      heatExchangeArea: '0.04 m²/placa',
      typeOrFeatures: 'Placas corrugadas tipo Chevron com vedação por gaxetas intercambiáveis.',
      applications: 'Resfriamento de água, pasteurização de bebidas, aquecimento de processos.',
    },
  },
  {
    id: 'bermo-bp30',
    code: 'BP30',
    name: 'Trocador de Calor a Placas BP30',
    brand: 'BERMO',
    model: 'BP30',
    category: 'Trocadores de Calor',
    categoryKey: 'trocadores',
    categoryLabel: 'Trocadores de Calor a Placas',
    description: 'Trocador de calor compacto para processos sanitários e industriais.',
    basePrice: 18500,
    specs: {
      connection: 'DN50 (2 pol) Flangeado',
      pressure: '16 bar',
      maxPressure: '16 bar',
      temperature: '-10°C a 160°C',
      maxTemperature: '160°C',
      material: 'AISI 316L (0.5mm)',
      materials: 'AISI 316L (0.5mm)',
      gasketMaterial: 'EPDM Clip-on / NBR',
      gaskets: 'EPDM Clip-on / NBR',
      platesRange: '20 a 100 placas',
      platesCount: '20 a 100 placas',
      plateDimensions: '680 x 280 mm',
      dimensions: '680 x 280 mm',
      gasketsCount: '20 a 100',
      maxFlowRate: '35 m³/h',
      heatExchangeArea: '0.18 m²/placa',
      typeOrFeatures:
        'Sistema Clip-on sem cola para fixação rápida de gaxetas e fácil higienização.',
      applications:
        'Indústria alimentícia, laticínios, químicos leves e aquecimento de água com vapor.',
    },
  },
  {
    id: 'bermo-bp60',
    code: 'BP60',
    name: 'Trocador de Calor a Placas BP60',
    brand: 'BERMO',
    model: 'BP60',
    category: 'Trocadores de Calor',
    categoryKey: 'trocadores',
    categoryLabel: 'Trocadores de Calor a Placas',
    description: 'Trocador de placas de alta eficiência para médias e grandes vazões.',
    basePrice: 32000,
    specs: {
      connection: 'DN100 (4 pol) Flangeado',
      pressure: '16 bar / 25 bar',
      maxPressure: '25 bar',
      temperature: '-20°C a 180°C',
      maxTemperature: '180°C',
      material: 'AISI 316L / Titânio (0.6mm)',
      materials: 'AISI 316L / Titânio (0.6mm)',
      gasketMaterial: 'EPDM / FKM (Viton)',
      gaskets: 'EPDM / FKM (Viton)',
      platesRange: '40 a 250 placas',
      platesCount: '40 a 250 placas',
      plateDimensions: '1150 x 450 mm',
      dimensions: '1150 x 450 mm',
      gasketsCount: '40 a 250',
      maxFlowRate: '120 m³/h',
      heatExchangeArea: '0.45 m²/placa',
      typeOrFeatures:
        'Estrutura robusta com tirantes em aço galvanizado e placas com padrão de alto coeficiente de troca.',
      applications:
        'Central de condensados de vapor, utilities industriais pesadas e HVAC central.',
    },
  },
  {
    id: 'bermo-bp6-s',
    code: 'BP6-S',
    name: 'Trocador de Calor Sanitário BP6-S',
    brand: 'BERMO',
    model: 'BP6-S',
    category: 'Trocadores de Calor',
    categoryKey: 'trocadores',
    categoryLabel: 'Trocadores de Calor a Placas',
    description:
      'Trocador de calor sanitário com conexões TC e acabamento polido para indústria alimentícia e farmacêutica.',
    basePrice: 15800,
    specs: {
      connection: '1" Tri-Clamp Sanitário',
      pressure: '16 bar',
      maxPressure: '16 bar',
      temperature: '-10°C a 150°C',
      maxTemperature: '150°C',
      material: 'AISI 316L Sanitário Ra < 0.8µm',
      materials: 'AISI 316L Sanitário Ra < 0.8µm',
      gasketMaterial: 'EPDM FDA Clip-on',
      gaskets: 'EPDM FDA Clip-on',
      platesRange: '10 a 60 placas',
      platesCount: '10 a 60 placas',
      plateDimensions: '320 x 130 mm',
      dimensions: '320 x 130 mm',
      gasketsCount: '10 a 60',
      maxFlowRate: '10 m³/h',
      heatExchangeArea: '0.04 m²/placa',
      typeOrFeatures:
        'Acabamento eletropolido e gaxetas com certificação FDA 3-A Sanitary Standards.',
      applications:
        'Pasteurização, resfriamento de mosto cervejeiro, sucos e fluidos farmacêuticos.',
    },
  },
  {
    id: 'bermo-bp30-s',
    code: 'BP30-S',
    name: 'Trocador de Calor Sanitário BP30-S',
    brand: 'BERMO',
    model: 'BP30-S',
    category: 'Trocadores de Calor',
    categoryKey: 'trocadores',
    categoryLabel: 'Trocadores de Calor a Placas',
    description:
      'Versão sanitária do modelo BP30 para alimentos, laticínios, cervejarias e pharma.',
    basePrice: 22400,
    specs: {
      connection: 'DN50 (2 pol) Tri-Clamp / DIN 11851',
      pressure: '16 bar',
      maxPressure: '16 bar',
      temperature: '-10°C a 160°C',
      maxTemperature: '160°C',
      material: 'AISI 316L Eletropolido',
      materials: 'AISI 316L Eletropolido',
      gasketMaterial: 'EPDM FDA / Viton FDA',
      gaskets: 'EPDM FDA / Viton FDA',
      platesRange: '20 a 120 placas',
      platesCount: '20 a 120 placas',
      plateDimensions: '680 x 280 mm',
      dimensions: '680 x 280 mm',
      gasketsCount: '20 a 120',
      maxFlowRate: '40 m³/h',
      heatExchangeArea: '0.18 m²/placa',
      typeOrFeatures:
        'Cabeçotes em aço inox 304 com pintura epóxi alimentícia ou revestimento integral inox.',
      applications: 'Linhas CIP, pasteurizadores HTST de leite, cerveja artesanal e refrigerantes.',
    },
  },
  {
    id: 'bermo-bp60-s',
    code: 'BP60-S',
    name: 'Trocador de Calor Sanitário BP60-S',
    brand: 'BERMO',
    model: 'BP60-S',
    category: 'Trocadores de Calor',
    categoryKey: 'trocadores',
    categoryLabel: 'Trocadores de Calor a Placas',
    description:
      'Trocador de placas sanitário de alta vazão para pasteurização e resfriamento CIP.',
    basePrice: 38900,
    specs: {
      connection: 'DN100 (4 pol) Tri-Clamp Sanitário',
      pressure: '16 bar',
      maxPressure: '16 bar',
      temperature: '-20°C a 180°C',
      maxTemperature: '180°C',
      material: 'AISI 316L Polido Ra < 0.4µm',
      materials: 'AISI 316L Polido Ra < 0.4µm',
      gasketMaterial: 'EPDM FDA / FKM FDA',
      gaskets: 'EPDM FDA / FKM FDA',
      platesRange: '40 a 280 placas',
      platesCount: '40 a 280 placas',
      plateDimensions: '1150 x 450 mm',
      dimensions: '1150 x 450 mm',
      gasketsCount: '40 a 280',
      maxFlowRate: '150 m³/h',
      heatExchangeArea: '0.45 m²/placa',
      typeOrFeatures: 'Placas multi-seção para recuperação térmica combinada com regenerador.',
      applications: 'Grandes cervejarias, usinas de suco concentrado, plantas de CIP centralizado.',
    },
  },
  {
    id: 'bermo-bl14',
    code: 'BL14',
    name: 'Trocador de Calor a Placas BL14',
    brand: 'BERMO',
    model: 'BL14',
    category: 'Trocadores de Calor',
    categoryKey: 'trocadores',
    categoryLabel: 'Trocadores de Calor a Placas',
    description: 'Trocador compacto para fluidos de aquecimento de água e óleo térmico leve.',
    basePrice: 14200,
    specs: {
      connection: '1.1/4" BSP / DN32',
      pressure: '16 bar',
      maxPressure: '16 bar',
      temperature: '-10°C a 150°C',
      maxTemperature: '150°C',
      material: 'AISI 316L',
      materials: 'AISI 316L',
      gasketMaterial: 'NBR / EPDM',
      gaskets: 'NBR / EPDM',
      platesRange: '15 a 60 placas',
      platesCount: '15 a 60 placas',
      plateDimensions: '480 x 180 mm',
      dimensions: '480 x 180 mm',
      gasketsCount: '15 a 60',
      maxFlowRate: '18 m³/h',
      heatExchangeArea: '0.08 m²/placa',
      typeOrFeatures: 'Canal de escoamento otimizado para baixas perdas de carga.',
      applications: 'Aquecimento predial, trocadores para caldeiras e recuperadores compactos.',
    },
  },
  {
    id: 'bermo-bl20',
    code: 'BL20',
    name: 'Trocador de Calor a Placas BL20',
    brand: 'BERMO',
    model: 'BL20',
    category: 'Trocadores de Calor',
    categoryKey: 'trocadores',
    categoryLabel: 'Trocadores de Calor a Placas',
    description: 'Trocador de placas versátil para indústrias químicas e HVAC.',
    basePrice: 19800,
    specs: {
      connection: 'DN50 (2 pol) Flangeado',
      pressure: '16 bar',
      maxPressure: '16 bar',
      temperature: '-10°C a 160°C',
      maxTemperature: '160°C',
      material: 'AISI 316L / AISI 304',
      materials: 'AISI 316L / AISI 304',
      gasketMaterial: 'EPDM / NBR',
      gaskets: 'EPDM / NBR',
      platesRange: '20 a 120 placas',
      platesCount: '20 a 120 placas',
      plateDimensions: '750 x 250 mm',
      dimensions: '750 x 250 mm',
      gasketsCount: '20 a 120',
      maxFlowRate: '45 m³/h',
      heatExchangeArea: '0.22 m²/placa',
      typeOrFeatures: 'Padrão corrugado em L e H para controle de turbulência.',
      applications: 'Química fina, tratamento de efluentes, condensadores de vapor secundário.',
    },
  },
  {
    id: 'bermo-bl26',
    code: 'BL26',
    name: 'Trocador de Calor a Placas BL26',
    brand: 'BERMO',
    model: 'BL26',
    category: 'Trocadores de Calor',
    categoryKey: 'trocadores',
    categoryLabel: 'Trocadores de Calor a Placas',
    description: 'Trocador de alto rendimento para condensação de vapor e recuperação térmica.',
    basePrice: 26500,
    specs: {
      connection: 'DN65 (2.5 pol) Flangeado',
      pressure: '16 bar / 20 bar',
      maxPressure: '20 bar',
      temperature: '-10°C a 170°C',
      maxTemperature: '170°C',
      material: 'AISI 316L',
      materials: 'AISI 316L',
      gasketMaterial: 'EPDM / Viton',
      gaskets: 'EPDM / Viton',
      platesRange: '30 a 160 placas',
      platesCount: '30 a 160 placas',
      plateDimensions: '890 x 310 mm',
      dimensions: '890 x 310 mm',
      gasketsCount: '30 a 160',
      maxFlowRate: '70 m³/h',
      heatExchangeArea: '0.30 m²/placa',
      typeOrFeatures: 'Distribuição simétrica com entrada alargada para fluidos viscosos.',
      applications: 'Óleos industriais, aquecedores de processo contínuo e condensadores.',
    },
  },
  {
    id: 'bermo-bl26c',
    code: 'BL26C',
    name: 'Trocador de Calor Compacto BL26C',
    brand: 'BERMO',
    model: 'BL26C',
    category: 'Trocadores de Calor',
    categoryKey: 'trocadores',
    categoryLabel: 'Trocadores de Calor a Placas',
    description: 'Versão compacta de alta densidade térmica da série BL26.',
    basePrice: 24900,
    specs: {
      connection: 'DN65 (2.5 pol) Flangeado',
      pressure: '16 bar',
      maxPressure: '16 bar',
      temperature: '-10°C a 165°C',
      maxTemperature: '165°C',
      material: 'AISI 316L',
      materials: 'AISI 316L',
      gasketMaterial: 'EPDM / NBR',
      gaskets: 'EPDM / NBR',
      platesRange: '25 a 140 placas',
      platesCount: '25 a 140 placas',
      plateDimensions: '840 x 300 mm',
      dimensions: '840 x 300 mm',
      gasketsCount: '25 a 140',
      maxFlowRate: '65 m³/h',
      heatExchangeArea: '0.28 m²/placa',
      typeOrFeatures:
        'Menor altura total para instalação em skids com limitação de espaço vertical.',
      applications: 'Skids montados, salas de caldeira compactas, trocadores marítimos.',
    },
  },
  {
    id: 'bermo-bl50',
    code: 'BL50',
    name: 'Trocador de Calor a Placas BL50',
    brand: 'BERMO',
    model: 'BL50',
    category: 'Trocadores de Calor',
    categoryKey: 'trocadores',
    categoryLabel: 'Trocadores de Calor a Placas',
    description:
      'Trocador industrial de grande porte para aplicações severas de processo e utilities.',
    basePrice: 42000,
    specs: {
      connection: 'DN150 (6 pol) Flangeado',
      pressure: '16 bar / 25 bar',
      maxPressure: '25 bar',
      temperature: '-20°C a 190°C',
      maxTemperature: '190°C',
      material: 'AISI 316L / Titânio / Hastelloy',
      materials: 'AISI 316L / Titânio / Hastelloy',
      gasketMaterial: 'NBR / EPDM / Viton',
      gaskets: 'NBR / EPDM / Viton',
      platesRange: '50 a 350 placas',
      platesCount: '50 a 350 placas',
      plateDimensions: '1420 x 520 mm',
      dimensions: '1420 x 520 mm',
      gasketsCount: '50 a 350',
      maxFlowRate: '250 m³/h',
      heatExchangeArea: '0.65 m²/placa',
      typeOrFeatures: 'Placas reforçadas e guias de alinhamento duplo para grandes pacotes.',
      applications: 'Papel e celulose, siderurgia, usinas de etanol e resfriamento central.',
    },
  },

  // ----------------------------------------------------
  // CATÁLOGO FORNECEDOR: ALFA LAVAL
  // ----------------------------------------------------
  {
    id: 'alfalaval-t2-bfg',
    code: 'T2-BFG',
    name: 'Trocador de Calor a Placas Alfa Laval T2-BFG',
    brand: 'Alfa Laval',
    model: 'T2-BFG',
    category: 'Trocadores de Calor',
    categoryKey: 'trocadores',
    categoryLabel: 'Trocadores de Calor a Placas',
    description:
      'Trocador de calor a placas gaxetado compacto para pequenas vazões e resfriamento em espaço reduzido.',
    basePrice: 11800,
    specs: {
      connection: '1"',
      pressure: '16 bar',
      maxPressure: '16 bar',
      temperature: '-10°C a 150°C',
      maxTemperature: '150°C',
      material: 'AISI 316 / AISI 304',
      materials: 'AISI 316 / AISI 304',
      gasketMaterial: 'NBR / EPDM',
      gaskets: 'NBR / EPDM',
      platesRange: '20-60 placas',
      platesCount: '20-60 placas',
      plateDimensions: '310x140mm',
      dimensions: '310x140mm',
      gasketsCount: '20-60',
      maxFlowRate: '6 m³/h',
      typeOrFeatures: 'Gaxetas Clip-on e placas corrugadas simétricas.',
      applications: 'Resfriamento de óleo hidráulico, trocadores em máquinas e unidades compactas.',
    },
  },
  {
    id: 'alfalaval-t5-bfg',
    code: 'T5-BFG',
    name: 'Trocador de Calor a Placas Alfa Laval T5-BFG',
    brand: 'Alfa Laval',
    model: 'T5-BFG',
    category: 'Trocadores de Calor',
    categoryKey: 'trocadores',
    categoryLabel: 'Trocadores de Calor a Placas',
    description:
      'Trocador de placas de média vazão com alta eficiência e distribuição uniforme de fluxo.',
    basePrice: 19500,
    specs: {
      connection: '2"',
      pressure: '16 bar',
      maxPressure: '16 bar',
      temperature: '-10°C a 180°C',
      maxTemperature: '180°C',
      material: 'AISI 316L / Titânio',
      materials: 'AISI 316L / Titânio',
      gasketMaterial: 'NBR / EPDM / Viton',
      gaskets: 'NBR / EPDM / Viton',
      platesRange: '40-120 placas',
      platesCount: '40-120 placas',
      plateDimensions: '500x210mm',
      dimensions: '500x210mm',
      gasketsCount: '40-120',
      maxFlowRate: '30 m³/h',
      typeOrFeatures: 'Área de distribuição CurveFlow para redução de depósitos e incrustações.',
      applications: 'HVAC, processos térmicos em indústrias químicas e farmacêuticas.',
    },
  },
  {
    id: 'alfalaval-t8-bfg',
    code: 'T8-BFG',
    name: 'Trocador de Calor a Placas Alfa Laval T8-BFG',
    brand: 'Alfa Laval',
    model: 'T8-BFG',
    category: 'Trocadores de Calor',
    categoryKey: 'trocadores',
    categoryLabel: 'Trocadores de Calor a Placas',
    description:
      'Trocador de placas industrial versátil com conexões de 3 polegadas para processos contínuos.',
    basePrice: 28900,
    specs: {
      connection: '3"',
      pressure: '16 bar',
      maxPressure: '16 bar',
      temperature: '-10°C a 180°C',
      maxTemperature: '180°C',
      material: 'AISI 316L / Titânio',
      materials: 'AISI 316L / Titânio',
      gasketMaterial: 'NBR / EPDM / Viton',
      gaskets: 'NBR / EPDM / Viton',
      platesRange: '60-200 placas',
      platesCount: '60-200 placas',
      plateDimensions: '750x310mm',
      dimensions: '750x310mm',
      gasketsCount: '60-200',
      maxFlowRate: '80 m³/h',
      typeOrFeatures: 'Tecnologia CurveFlow com excelente homogeneidade térmica.',
      applications: 'Sistemas de condensado, aquecimento de água potável e fluidos de processo.',
    },
  },
  {
    id: 'alfalaval-t10-bfg',
    code: 'T10-BFG',
    name: 'Trocador de Calor a Placas Alfa Laval T10-BFG',
    brand: 'Alfa Laval',
    model: 'T10-BFG',
    category: 'Trocadores de Calor',
    categoryKey: 'trocadores',
    categoryLabel: 'Trocadores de Calor a Placas',
    description:
      'Trocador de placas com tecnologia de distribuição CurveFlow para máxima eficiência térmica.',
    basePrice: 39500,
    specs: {
      connection: '4"',
      pressure: '16 bar',
      maxPressure: '16 bar',
      temperature: '-10°C a 180°C',
      maxTemperature: '180°C',
      material: 'AISI 316L / Titânio',
      materials: 'AISI 316L / Titânio',
      gasketMaterial: 'NBR / EPDM / Viton',
      gaskets: 'NBR / EPDM / Viton',
      platesRange: '80-300 placas',
      platesCount: '80-300 placas',
      plateDimensions: '980x380mm',
      dimensions: '980x380mm',
      gasketsCount: '80-300',
      maxFlowRate: '150 m³/h',
      typeOrFeatures: 'Placas FlexFlow assimétricas que aumentam eficiência em fluxos desiguais.',
      applications: 'Usinas de açúcar, utilidades pesadas e recuperação de calor residual.',
    },
  },
  {
    id: 'alfalaval-t20-bfg',
    code: 'T20-BFG',
    name: 'Trocador de Calor a Placas Alfa Laval T20-BFG',
    brand: 'Alfa Laval',
    model: 'T20-BFG',
    category: 'Trocadores de Calor',
    categoryKey: 'trocadores',
    categoryLabel: 'Trocadores de Calor a Placas',
    description:
      'Trocador de placas de grande porte com conexões de 6 polegadas para altas vazões industriais.',
    basePrice: 54000,
    specs: {
      connection: '6"',
      pressure: '16 bar',
      maxPressure: '16 bar',
      temperature: '-10°C a 180°C',
      maxTemperature: '180°C',
      material: 'AISI 316L / Titânio',
      materials: 'AISI 316L / Titânio',
      gasketMaterial: 'NBR / EPDM / Viton',
      gaskets: 'NBR / EPDM / Viton',
      platesRange: '120-450 placas',
      platesCount: '120-450 placas',
      plateDimensions: '1200x480mm',
      dimensions: '1200x480mm',
      gasketsCount: '120-450',
      maxFlowRate: '300 m³/h',
      typeOrFeatures:
        'Frame padrão industrial com guias de suporte de roletes para abertura suave.',
      applications: 'Petroquímica, grandes centrais de resfriamento e evaporação industrial.',
    },
  },
  {
    id: 'alfalaval-m3',
    code: 'M3',
    name: 'Trocador de Calor a Placas Alfa Laval M3',
    brand: 'Alfa Laval',
    model: 'M3',
    category: 'Trocadores de Calor',
    categoryKey: 'trocadores',
    categoryLabel: 'Trocadores de Calor a Placas',
    description:
      'Micro trocador de placas para resfriamento de amostras, laboratório e processos ultra-compactos.',
    basePrice: 8900,
    specs: {
      connection: '3/4"',
      pressure: '10 bar',
      maxPressure: '10 bar',
      temperature: '-10°C a 130°C',
      maxTemperature: '130°C',
      material: 'AISI 316 / AISI 304',
      materials: 'AISI 316 / AISI 304',
      gasketMaterial: 'NBR / EPDM',
      gaskets: 'NBR / EPDM',
      platesRange: '10-30 placas',
      platesCount: '10-30 placas',
      plateDimensions: '280x110mm',
      dimensions: '280x110mm',
      gasketsCount: '10-30',
      maxFlowRate: '4 m³/h',
      typeOrFeatures: 'Gaxetas coladas ou encaixadas, facilidade de montagem bancada.',
      applications: 'Amostragem de caldeiras, laboratórios e sistemas piloto.',
    },
  },
  {
    id: 'alfalaval-m6',
    code: 'M6',
    name: 'Trocador de Calor a Placas Alfa Laval M6',
    brand: 'Alfa Laval',
    model: 'M6',
    category: 'Trocadores de Calor',
    categoryKey: 'trocadores',
    categoryLabel: 'Trocadores de Calor a Placas',
    description:
      'Trocador de placas da linha M com conexões de 1.5 polegadas para serviços gerais de aquecimento e resfriamento.',
    basePrice: 16200,
    specs: {
      connection: '1.5"',
      pressure: '16 bar',
      maxPressure: '16 bar',
      temperature: '-10°C a 160°C',
      maxTemperature: '160°C',
      material: 'AISI 316L',
      materials: 'AISI 316L',
      gasketMaterial: 'NBR / EPDM / Viton',
      gaskets: 'NBR / EPDM / Viton',
      platesRange: '20-60 placas',
      platesCount: '20-60 placas',
      plateDimensions: '400x180mm',
      dimensions: '400x180mm',
      gasketsCount: '20-60',
      maxFlowRate: '20 m³/h',
      typeOrFeatures: 'Placas com vedação confiável e facilidade de limpeza mecânica manual.',
      applications: 'Usinas térmicas, refrigeração comercial e processos gerais.',
    },
  },
  {
    id: 'alfalaval-m10-b',
    code: 'M10-B',
    name: 'Trocador de Calor a Placas Alfa Laval M10-B',
    brand: 'Alfa Laval',
    model: 'M10-B',
    category: 'Trocadores de Calor',
    categoryKey: 'trocadores',
    categoryLabel: 'Trocadores de Calor a Placas',
    description:
      'Trocador de placas consagrado para utilidades industriais com conexões de 2.5 polegadas.',
    basePrice: 24500,
    specs: {
      connection: '2.5"',
      pressure: '16 bar',
      maxPressure: '16 bar',
      temperature: '-10°C a 180°C',
      maxTemperature: '180°C',
      material: 'AISI 316L / Titânio',
      materials: 'AISI 316L / Titânio',
      gasketMaterial: 'NBR / EPDM / Viton',
      gaskets: 'NBR / EPDM / Viton',
      platesRange: '40-150 placas',
      platesCount: '40-150 placas',
      plateDimensions: '680x310mm',
      dimensions: '680x310mm',
      gasketsCount: '40-150',
      maxFlowRate: '60 m³/h',
      typeOrFeatures: 'Design consagrado em milhares de plantas ao redor do mundo.',
      applications: 'Refrigeração industrial, condensadores, aquecedores de água.',
    },
  },
  {
    id: 'alfalaval-m15-b',
    code: 'M15-B',
    name: 'Trocador de Calor a Placas Alfa Laval M15-B',
    brand: 'Alfa Laval',
    model: 'M15-B',
    category: 'Trocadores de Calor',
    categoryKey: 'trocadores',
    categoryLabel: 'Trocadores de Calor a Placas',
    description:
      'Trocador de placas para processos severos de condensação, pasteurização e recuperação térmica com conexões de 4 polegadas.',
    basePrice: 36800,
    specs: {
      connection: '4"',
      pressure: '16 bar',
      maxPressure: '16 bar',
      temperature: '-10°C a 180°C',
      maxTemperature: '180°C',
      material: 'AISI 316L / Titânio',
      materials: 'AISI 316L / Titânio',
      gasketMaterial: 'NBR / EPDM / Viton',
      gaskets: 'NBR / EPDM / Viton',
      platesRange: '60-250 placas',
      platesCount: '60-250 placas',
      plateDimensions: '920x380mm',
      dimensions: '920x380mm',
      gasketsCount: '60-250',
      maxFlowRate: '160 m³/h',
      typeOrFeatures: 'Padrão multi-passe e alta densidade de placas.',
      applications: 'Indústria naval, papel e celulose, bioenergia.',
    },
  },
]

// Base consolidada de fornecedores (Bermo e Alfa Laval e outros)
export const SUPPLIERS_DATABASE: BermoProductItem[] = [...BERMO_CATALOG]

/**
 * Busca por modelo na base de fornecedores (busca case-insensitive flexível)
 */
export function searchSupplierProduct(query: string): BermoProductItem | undefined {
  if (!query) return undefined
  const clean = query.trim().toLowerCase()
  return SUPPLIERS_DATABASE.find(
    (p) =>
      p.code.toLowerCase() === clean ||
      p.model.toLowerCase() === clean ||
      p.name.toLowerCase().includes(clean) ||
      clean.includes(p.code.toLowerCase()) ||
      clean.includes(p.model.toLowerCase()),
  )
}

/**
 * Retorna o texto padrão da metodologia técnica com nomes dinâmicos dos fabricantes
 * @param brands Lista de marcas presentes nos produtos/itens ('BERMO' | 'Alfa Laval' | string)
 */
export function getStandardServiceMethodology(brands?: string[]): string {
  let manufacturerLabel = 'Bermo e Alfa Laval'
  if (brands && brands.length > 0) {
    const hasBermo = brands.some(
      (b) => b && (b.toUpperCase() === 'BERMO' || b.toUpperCase().includes('BERMO')),
    )
    const hasAlfaLaval = brands.some(
      (b) =>
        b &&
        (b.toUpperCase() === 'ALFA LAVAL' ||
          b.toUpperCase() === 'ALFALAVAL' ||
          b.toUpperCase().includes('ALFA')),
    )

    if (hasBermo && !hasAlfaLaval) {
      manufacturerLabel = 'Bermo'
    } else if (hasAlfaLaval && !hasBermo) {
      manufacturerLabel = 'Alfa Laval'
    } else if (hasBermo && hasAlfaLaval) {
      manufacturerLabel = 'Bermo e Alfa Laval'
    }
  }

  return `A metodologia aplicada seguiu rigorosamente as normas técnicas de manutenção industrial e as recomendações dos fabricantes (${manufacturerLabel}), consistindo nas seguintes etapas:

1. Desmontagem: Abertura do feixe de placas com registro prévio da Medida A (distância entre as placas de aperto) para referência de remontagem.
2. Limpeza: Remoção de incrustações e resíduos de processo através de limpeza mecânica manual e/ou química, preservando a integridade do material das placas.
3. Inspeção de Placas: Análise visual individualizada para detecção de furos, deformações, pontos de corrosão ou desgaste prematuro.
4. Inspeção de Gaxetas: Verificação da elasticidade, presença de trincas, ressecamento ou perda de perfil de vedação.
5. Montagem: Fechamento do equipamento com aplicação de torque gradual e uniforme, respeitando a Medida A final especificada.
6. Teste de Estanqueidade: Verificação pós-montagem para garantia de ausência de vazamentos externos sob pressão de operação.`
}

/**
 * Texto padrão institucional de inclusões na proposta comercial
 */
export const PROPOSAL_INCLUSIONS_TEXT = `O valor da presente proposta inclui todos os impostos incidentes sobre serviços (ISS, PIS, COFINS, CSLL e IRPJ), mão de obra especializada com profissionais habilitados e capacitados para execução dos serviços técnicos descritos, deslocamento e despesas diversas com funcionários (transporte, alimentação e hospedagem quando aplicável), e todo material de consumo necessário para realização dos procedimentos de limpeza e manutenção (produtos químicos, ferramentas, EPIs e equipamentos de aplicação). As peças de reposição necessárias (placas, gaxetas, parafusos e componentes) são de responsabilidade do cliente, podendo ser fornecidas mediante orçamento complementar.`
