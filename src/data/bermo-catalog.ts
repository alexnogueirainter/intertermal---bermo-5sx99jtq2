export interface BermoProductItem {
  id: string
  code: string
  name: string
  brand: 'BERMO' | 'Alfa Laval' | 'Outro'
  model: string
  category: 'Válvulas' | 'Trocadores de Calor' | 'Sistemas' | 'Instrumentação'
  description: string
  basePrice: number
  specs: {
    connection: string
    pressure: string
    temperature: string
    material: string
    gasketMaterial?: string
    platesRange?: string
    plateDimensions?: string
  }
}

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
    description: 'Trocador de calor a placas desmontável para aplicações de baixa a média vazão.',
    basePrice: 12500,
    specs: {
      connection: '1" BSP / NPT',
      pressure: '16 bar',
      temperature: '-10°C a 150°C',
      material: 'AISI 316L / Titânio',
      gasketMaterial: 'NBR / EPDM',
      platesRange: '10 a 50 placas',
      plateDimensions: '320 x 130 mm',
    },
  },
  {
    id: 'bermo-bp30',
    code: 'BP30',
    name: 'Trocador de Calor a Placas BP30',
    brand: 'BERMO',
    model: 'BP30',
    category: 'Trocadores de Calor',
    description: 'Trocador de calor compacto para processos sanitários e industriais.',
    basePrice: 18500,
    specs: {
      connection: 'DN50 (2 pol) Flangeado',
      pressure: '16 bar',
      temperature: '-10°C a 160°C',
      material: 'AISI 316L (0.5mm)',
      gasketMaterial: 'EPDM Clip-on / NBR',
      platesRange: '20 a 100 placas',
      plateDimensions: '680 x 280 mm',
    },
  },
  {
    id: 'bermo-bp60',
    code: 'BP60',
    name: 'Trocador de Calor a Placas BP60',
    brand: 'BERMO',
    model: 'BP60',
    category: 'Trocadores de Calor',
    description: 'Trocador de placas de alta eficiência para médias e grandes vazões.',
    basePrice: 32000,
    specs: {
      connection: 'DN100 (4 pol) Flangeado',
      pressure: '16 bar / 25 bar',
      temperature: '-20°C a 180°C',
      material: 'AISI 316L / Titânio (0.6mm)',
      gasketMaterial: 'EPDM / FKM (Viton)',
      platesRange: '40 a 250 placas',
      plateDimensions: '1150 x 450 mm',
    },
  },
  {
    id: 'bermo-bp6-s',
    code: 'BP6-S',
    name: 'Trocador de Calor Sanitário BP6-S',
    brand: 'BERMO',
    model: 'BP6-S',
    category: 'Trocadores de Calor',
    description:
      'Trocador de calor sanitário com conexões TC e acabamento polido para indústria alimentícia e farmacêutica.',
    basePrice: 15800,
    specs: {
      connection: '1" Tri-Clamp Sanitário',
      pressure: '16 bar',
      temperature: '-10°C a 150°C',
      material: 'AISI 316L Sanitário Ra < 0.8µm',
      gasketMaterial: 'EPDM FDA Clip-on',
      platesRange: '10 a 60 placas',
      plateDimensions: '320 x 130 mm',
    },
  },
  {
    id: 'bermo-bp30-s',
    code: 'BP30-S',
    name: 'Trocador de Calor Sanitário BP30-S',
    brand: 'BERMO',
    model: 'BP30-S',
    category: 'Trocadores de Calor',
    description:
      'Versão sanitária do modelo BP30 para alimentos, laticínios, cervejarias e pharma.',
    basePrice: 22400,
    specs: {
      connection: 'DN50 (2 pol) Tri-Clamp / DIN 11851',
      pressure: '16 bar',
      temperature: '-10°C a 160°C',
      material: 'AISI 316L Eletropolido',
      gasketMaterial: 'EPDM FDA / Viton FDA',
      platesRange: '20 a 120 placas',
      plateDimensions: '680 x 280 mm',
    },
  },
  {
    id: 'bermo-bp60-s',
    code: 'BP60-S',
    name: 'Trocador de Calor Sanitário BP60-S',
    brand: 'BERMO',
    model: 'BP60-S',
    category: 'Trocadores de Calor',
    description:
      'Trocador de placas sanitário de alta vazão para pasteurização e resfriamento CIP.',
    basePrice: 38900,
    specs: {
      connection: 'DN100 (4 pol) Tri-Clamp Sanitário',
      pressure: '16 bar',
      temperature: '-20°C a 180°C',
      material: 'AISI 316L Polido Ra < 0.4µm',
      gasketMaterial: 'EPDM FDA / FKM FDA',
      platesRange: '40 a 280 placas',
      plateDimensions: '1150 x 450 mm',
    },
  },
  {
    id: 'bermo-bl14',
    code: 'BL14',
    name: 'Trocador de Calor a Placas BL14',
    brand: 'BERMO',
    model: 'BL14',
    category: 'Trocadores de Calor',
    description: 'Trocador compacto para fluidos de aquecimento de água e óleo térmico leve.',
    basePrice: 14200,
    specs: {
      connection: '1.1/4" BSP / DN32',
      pressure: '16 bar',
      temperature: '-10°C a 150°C',
      material: 'AISI 316L',
      gasketMaterial: 'NBR / EPDM',
      platesRange: '15 a 60 placas',
      plateDimensions: '480 x 180 mm',
    },
  },
  {
    id: 'bermo-bl20',
    code: 'BL20',
    name: 'Trocador de Calor a Placas BL20',
    brand: 'BERMO',
    model: 'BL20',
    category: 'Trocadores de Calor',
    description: 'Trocador de placas versátil para indústrias químicas e HVAC.',
    basePrice: 19800,
    specs: {
      connection: 'DN50 (2 pol) Flangeado',
      pressure: '16 bar',
      temperature: '-10°C a 160°C',
      material: 'AISI 316L / AISI 304',
      gasketMaterial: 'EPDM / NBR',
      platesRange: '20 a 120 placas',
      plateDimensions: '750 x 250 mm',
    },
  },
  {
    id: 'bermo-bl26',
    code: 'BL26',
    name: 'Trocador de Calor a Placas BL26',
    brand: 'BERMO',
    model: 'BL26',
    category: 'Trocadores de Calor',
    description: 'Trocador de alto rendimento para condensação de vapor e recuperação térmica.',
    basePrice: 26500,
    specs: {
      connection: 'DN65 (2.5 pol) Flangeado',
      pressure: '16 bar / 20 bar',
      temperature: '-10°C a 170°C',
      material: 'AISI 316L',
      gasketMaterial: 'EPDM / Viton',
      platesRange: '30 a 160 placas',
      plateDimensions: '890 x 310 mm',
    },
  },
  {
    id: 'bermo-bl26c',
    code: 'BL26C',
    name: 'Trocador de Calor Compacto BL26C',
    brand: 'BERMO',
    model: 'BL26C',
    category: 'Trocadores de Calor',
    description: 'Versão compacta de alta densidade térmica da série BL26.',
    basePrice: 24900,
    specs: {
      connection: 'DN65 (2.5 pol) Flangeado',
      pressure: '16 bar',
      temperature: '-10°C a 165°C',
      material: 'AISI 316L',
      gasketMaterial: 'EPDM / NBR',
      platesRange: '25 a 140 placas',
      plateDimensions: '840 x 300 mm',
    },
  },
  {
    id: 'bermo-bl50',
    code: 'BL50',
    name: 'Trocador de Calor a Placas BL50',
    brand: 'BERMO',
    model: 'BL50',
    category: 'Trocadores de Calor',
    description:
      'Trocador industrial de grande porte para aplicações severas de processo e utilities.',
    basePrice: 42000,
    specs: {
      connection: 'DN150 (6 pol) Flangeado',
      pressure: '16 bar / 25 bar',
      temperature: '-20°C a 190°C',
      material: 'AISI 316L / Titânio / Hastelloy',
      gasketMaterial: 'NBR / EPDM / Viton',
      platesRange: '50 a 350 placas',
      plateDimensions: '1420 x 520 mm',
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
    description:
      'Trocador de calor a placas gaxetado compacto para pequenas vazões e resfriamento em espaço reduzido.',
    basePrice: 11800,
    specs: {
      connection: '1"',
      pressure: '16 bar',
      temperature: '-10°C a 150°C',
      material: 'AISI 316 / AISI 304',
      gasketMaterial: 'NBR / EPDM',
      platesRange: '20-60 placas',
      plateDimensions: '310x140mm',
    },
  },
  {
    id: 'alfalaval-t5-bfg',
    code: 'T5-BFG',
    name: 'Trocador de Calor a Placas Alfa Laval T5-BFG',
    brand: 'Alfa Laval',
    model: 'T5-BFG',
    category: 'Trocadores de Calor',
    description:
      'Trocador de placas de média vazão com alta eficiência e distribuição uniforme de fluxo.',
    basePrice: 19500,
    specs: {
      connection: '2"',
      pressure: '16 bar',
      temperature: '-10°C a 180°C',
      material: 'AISI 316L / Titânio',
      gasketMaterial: 'NBR / EPDM / Viton',
      platesRange: '40-120 placas',
      plateDimensions: '500x210mm',
    },
  },
  {
    id: 'alfalaval-t8-bfg',
    code: 'T8-BFG',
    name: 'Trocador de Calor a Placas Alfa Laval T8-BFG',
    brand: 'Alfa Laval',
    model: 'T8-BFG',
    category: 'Trocadores de Calor',
    description:
      'Trocador de placas industrial versátil com conexões de 3 polegadas para processos térmicos contínuos.',
    basePrice: 28900,
    specs: {
      connection: '3"',
      pressure: '16 bar',
      temperature: '-10°C a 180°C',
      material: 'AISI 316L / Titânio',
      gasketMaterial: 'NBR / EPDM / Viton',
      platesRange: '60-200 placas',
      plateDimensions: '750x310mm',
    },
  },
  {
    id: 'alfalaval-t10-bfg',
    code: 'T10-BFG',
    name: 'Trocador de Calor a Placas Alfa Laval T10-BFG',
    brand: 'Alfa Laval',
    model: 'T10-BFG',
    category: 'Trocadores de Calor',
    description:
      'Trocador de placas com tecnologia de distribuição CurveFlow para máxima eficiência térmica.',
    basePrice: 39500,
    specs: {
      connection: '4"',
      pressure: '16 bar',
      temperature: '-10°C a 180°C',
      material: 'AISI 316L / Titânio',
      gasketMaterial: 'NBR / EPDM / Viton',
      platesRange: '80-300 placas',
      plateDimensions: '980x380mm',
    },
  },
  {
    id: 'alfalaval-t20-bfg',
    code: 'T20-BFG',
    name: 'Trocador de Calor a Placas Alfa Laval T20-BFG',
    brand: 'Alfa Laval',
    model: 'T20-BFG',
    category: 'Trocadores de Calor',
    description:
      'Trocador de placas de grande porte com conexões de 6 polegadas para altas vazões industriais.',
    basePrice: 54000,
    specs: {
      connection: '6"',
      pressure: '16 bar',
      temperature: '-10°C a 180°C',
      material: 'AISI 316L / Titânio',
      gasketMaterial: 'NBR / EPDM / Viton',
      platesRange: '120-450 placas',
      plateDimensions: '1200x480mm',
    },
  },
  {
    id: 'alfalaval-m3',
    code: 'M3',
    name: 'Trocador de Calor a Placas Alfa Laval M3',
    brand: 'Alfa Laval',
    model: 'M3',
    category: 'Trocadores de Calor',
    description:
      'Micro trocador de placas para resfriamento de amostras, laboratório e processos ultra-compactos.',
    basePrice: 8900,
    specs: {
      connection: '3/4"',
      pressure: '10 bar',
      temperature: '-10°C a 130°C',
      material: 'AISI 316 / AISI 304',
      gasketMaterial: 'NBR / EPDM',
      platesRange: '10-30 placas',
      plateDimensions: '280x110mm',
    },
  },
  {
    id: 'alfalaval-m6',
    code: 'M6',
    name: 'Trocador de Calor a Placas Alfa Laval M6',
    brand: 'Alfa Laval',
    model: 'M6',
    category: 'Trocadores de Calor',
    description:
      'Trocador de placas da linha M com conexões de 1.5 polegadas para serviços gerais de aquecimento e resfriamento.',
    basePrice: 16200,
    specs: {
      connection: '1.5"',
      pressure: '16 bar',
      temperature: '-10°C a 160°C',
      material: 'AISI 316L',
      gasketMaterial: 'NBR / EPDM / Viton',
      platesRange: '20-60 placas',
      plateDimensions: '400x180mm',
    },
  },
  {
    id: 'alfalaval-m10-b',
    code: 'M10-B',
    name: 'Trocador de Calor a Placas Alfa Laval M10-B',
    brand: 'Alfa Laval',
    model: 'M10-B',
    category: 'Trocadores de Calor',
    description:
      'Trocador de placas consagrado para utilidades industriais com conexões de 2.5 polegadas.',
    basePrice: 24500,
    specs: {
      connection: '2.5"',
      pressure: '16 bar',
      temperature: '-10°C a 180°C',
      material: 'AISI 316L / Titânio',
      gasketMaterial: 'NBR / EPDM / Viton',
      platesRange: '40-150 placas',
      plateDimensions: '680x310mm',
    },
  },
  {
    id: 'alfalaval-m15-b',
    code: 'M15-B',
    name: 'Trocador de Calor a Placas Alfa Laval M15-B',
    brand: 'Alfa Laval',
    model: 'M15-B',
    category: 'Trocadores de Calor',
    description:
      'Trocador de placas para processos severos de condensação, pasteurização e recuperação térmica com conexões de 4 polegadas.',
    basePrice: 36800,
    specs: {
      connection: '4"',
      pressure: '16 bar',
      temperature: '-10°C a 180°C',
      material: 'AISI 316L / Titânio',
      gasketMaterial: 'NBR / EPDM / Viton',
      platesRange: '60-250 placas',
      plateDimensions: '920x380mm',
    },
  },
]

// Base consolidada de fornecedores (Bermo e Alfa Laval e outros)
export {
  ALFA_LAVAL_SUPPLIERS,
  searchSupplierProduct,
  getStandardServiceMethodology,
  PROPOSAL_INCLUSIONS_TEXT,
} from './fornecedores'
