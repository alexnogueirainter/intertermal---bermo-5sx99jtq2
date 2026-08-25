export interface SupplierProductSpecs {
  connection: string // ex: 1", 2", 3", 4", 6", 3/4", 1.5", 2.5"
  pressure: string // ex: 16 bar, 10 bar
  temperature: string // ex: -10°C a 150°C
  material?: string // ex: AISI 316 / Titânio
  gasketMaterial: string // ex: NBR/EPDM, NBR/EPDM/Viton
  platesRange: string // ex: 20-60, 40-120
  plateDimensions: string // ex: 310x140mm
  platesCountDefault?: number // valor numérico sugerido
}

export interface SupplierProductItem {
  id: string
  code: string
  model: string
  name: string
  brand: 'Alfa Laval' | 'BERMO' | 'Outro'
  category: string
  description: string
  basePrice: number
  specs: SupplierProductSpecs
}

import { BERMO_CATALOG, BermoProductItem } from './bermo-catalog'

export { BERMO_CATALOG }
export const SUPPLIERS_DATABASE = BERMO_CATALOG

export const ALFA_LAVAL_SUPPLIERS: SupplierProductItem[] = [
  {
    id: 'alfa-t2-bfg',
    code: 'T2-BFG',
    model: 'T2-BFG',
    name: 'Trocador de Calor Alfa Laval T2-BFG',
    brand: 'Alfa Laval',
    category: 'Trocadores de Calor a Placas Gaxetados',
    description:
      'Trocador Alfa Laval T2-BFG: placas 20-60, dimensão 310x140mm, gaxetas NBR/EPDM, conexões 1", 16 bar, -10°C a 150°C',
    basePrice: 11800,
    specs: {
      platesRange: '20-60',
      plateDimensions: '310x140mm',
      gasketMaterial: 'NBR/EPDM',
      connection: '1"',
      pressure: '16 bar',
      temperature: '-10°C a 150°C',
      material: 'AISI 316L / Titânio',
      platesCountDefault: 40,
    },
  },
  {
    id: 'alfa-t5-bfg',
    code: 'T5-BFG',
    model: 'T5-BFG',
    name: 'Trocador de Calor Alfa Laval T5-BFG',
    brand: 'Alfa Laval',
    category: 'Trocadores de Calor a Placas Gaxetados',
    description:
      'Trocador Alfa Laval T5-BFG: placas 40-120, dimensão 500x210mm, gaxetas NBR/EPDM/Viton, conexões 2", 16 bar, -10°C a 180°C',
    basePrice: 19500,
    specs: {
      platesRange: '40-120',
      plateDimensions: '500x210mm',
      gasketMaterial: 'NBR/EPDM/Viton',
      connection: '2"',
      pressure: '16 bar',
      temperature: '-10°C a 180°C',
      material: 'AISI 316L / Titânio',
      platesCountDefault: 80,
    },
  },
  {
    id: 'alfa-t8-bfg',
    code: 'T8-BFG',
    model: 'T8-BFG',
    name: 'Trocador de Calor Alfa Laval T8-BFG',
    brand: 'Alfa Laval',
    category: 'Trocadores de Calor a Placas Gaxetados',
    description:
      'Trocador Alfa Laval T8-BFG: placas 60-200, dimensão 750x310mm, gaxetas NBR/EPDM/Viton, conexões 3", 16 bar, -10°C a 180°C',
    basePrice: 28900,
    specs: {
      platesRange: '60-200',
      plateDimensions: '750x310mm',
      gasketMaterial: 'NBR/EPDM/Viton',
      connection: '3"',
      pressure: '16 bar',
      temperature: '-10°C a 180°C',
      material: 'AISI 316L / Titânio',
      platesCountDefault: 130,
    },
  },
  {
    id: 'alfa-t10-bfg',
    code: 'T10-BFG',
    model: 'T10-BFG',
    name: 'Trocador de Calor Alfa Laval T10-BFG',
    brand: 'Alfa Laval',
    category: 'Trocadores de Calor a Placas Gaxetados',
    description:
      'Trocador Alfa Laval T10-BFG: placas 80-300, dimensão 980x380mm, gaxetas NBR/EPDM/Viton, conexões 4", 16 bar, -10°C a 180°C',
    basePrice: 39500,
    specs: {
      platesRange: '80-300',
      plateDimensions: '980x380mm',
      gasketMaterial: 'NBR/EPDM/Viton',
      connection: '4"',
      pressure: '16 bar',
      temperature: '-10°C a 180°C',
      material: 'AISI 316L / Titânio',
      platesCountDefault: 190,
    },
  },
  {
    id: 'alfa-t20-bfg',
    code: 'T20-BFG',
    model: 'T20-BFG',
    name: 'Trocador de Calor Alfa Laval T20-BFG',
    brand: 'Alfa Laval',
    category: 'Trocadores de Calor a Placas Gaxetados',
    description:
      'Trocador Alfa Laval T20-BFG: placas 120-450, dimensão 1200x480mm, gaxetas NBR/EPDM/Viton, conexões 6", 16 bar, -10°C a 180°C',
    basePrice: 54000,
    specs: {
      platesRange: '120-450',
      plateDimensions: '1200x480mm',
      gasketMaterial: 'NBR/EPDM/Viton',
      connection: '6"',
      pressure: '16 bar',
      temperature: '-10°C a 180°C',
      material: 'AISI 316L / Titânio',
      platesCountDefault: 280,
    },
  },
  {
    id: 'alfa-m3',
    code: 'M3',
    model: 'M3',
    name: 'Trocador de Calor Alfa Laval M3',
    brand: 'Alfa Laval',
    category: 'Trocadores de Calor a Placas Gaxetados',
    description:
      'Trocador Alfa Laval M3: placas 10-30, dimensão 280x110mm, gaxetas NBR/EPDM, conexões 3/4", 10 bar, -10°C a 130°C',
    basePrice: 8900,
    specs: {
      platesRange: '10-30',
      plateDimensions: '280x110mm',
      gasketMaterial: 'NBR/EPDM',
      connection: '3/4"',
      pressure: '10 bar',
      temperature: '-10°C a 130°C',
      material: 'AISI 316 / Titânio',
      platesCountDefault: 20,
    },
  },
  {
    id: 'alfa-m6',
    code: 'M6',
    model: 'M6',
    name: 'Trocador de Calor Alfa Laval M6',
    brand: 'Alfa Laval',
    category: 'Trocadores de Calor a Placas Gaxetados',
    description:
      'Trocador Alfa Laval M6: placas 20-60, dimensão 400x180mm, gaxetas NBR/EPDM/Viton, conexões 1.5", 16 bar, -10°C a 160°C',
    basePrice: 16200,
    specs: {
      platesRange: '20-60',
      plateDimensions: '400x180mm',
      gasketMaterial: 'NBR/EPDM/Viton',
      connection: '1.5"',
      pressure: '16 bar',
      temperature: '-10°C a 160°C',
      material: 'AISI 316L',
      platesCountDefault: 40,
    },
  },
  {
    id: 'alfa-m10-b',
    code: 'M10-B',
    model: 'M10-B',
    name: 'Trocador de Calor Alfa Laval M10-B',
    brand: 'Alfa Laval',
    category: 'Trocadores de Calor a Placas Gaxetados',
    description:
      'Trocador Alfa Laval M10-B: placas 40-150, dimensão 680x310mm, gaxetas NBR/EPDM/Viton, conexões 2.5", 16 bar, -10°C a 180°C',
    basePrice: 24500,
    specs: {
      platesRange: '40-150',
      plateDimensions: '680x310mm',
      gasketMaterial: 'NBR/EPDM/Viton',
      connection: '2.5"',
      pressure: '16 bar',
      temperature: '-10°C a 180°C',
      material: 'AISI 316L / Titânio',
      platesCountDefault: 95,
    },
  },
  {
    id: 'alfa-m15-b',
    code: 'M15-B',
    model: 'M15-B',
    name: 'Trocador de Calor Alfa Laval M15-B',
    brand: 'Alfa Laval',
    category: 'Trocadores de Calor a Placas Gaxetados',
    description:
      'Trocador Alfa Laval M15-B: placas 60-250, dimensão 920x380mm, gaxetas NBR/EPDM/Viton, conexões 4", 16 bar, -10°C a 180°C',
    basePrice: 36800,
    specs: {
      platesRange: '60-250',
      plateDimensions: '920x380mm',
      gasketMaterial: 'NBR/EPDM/Viton',
      connection: '4"',
      pressure: '16 bar',
      temperature: '-10°C a 180°C',
      material: 'AISI 316L / Titânio',
      platesCountDefault: 155,
    },
  },
]

/**
 * Busca por modelo na base de fornecedores (Alfa Laval e outros)
 */
export function searchSupplierProduct(
  query: string,
): BermoProductItem | SupplierProductItem | undefined {
  if (!query) return undefined
  const clean = query.trim().toLowerCase().replace(/\s+/g, '')

  // Primeiro busca no catálogo unificado BERMO / Alfa Laval
  const foundBermo = BERMO_CATALOG.find((p) => {
    const codeClean = p.code.toLowerCase().replace(/\s+/g, '')
    const modelClean = p.model.toLowerCase().replace(/\s+/g, '')
    const nameClean = p.name.toLowerCase().replace(/\s+/g, '')
    return (
      codeClean === clean ||
      modelClean === clean ||
      codeClean.includes(clean) ||
      clean.includes(codeClean) ||
      nameClean.includes(clean)
    )
  })
  if (foundBermo) return foundBermo

  return ALFA_LAVAL_SUPPLIERS.find((p) => {
    const codeClean = p.code.toLowerCase().replace(/\s+/g, '')
    const modelClean = p.model.toLowerCase().replace(/\s+/g, '')
    const nameClean = p.name.toLowerCase().replace(/\s+/g, '')
    return (
      codeClean === clean ||
      modelClean === clean ||
      codeClean.includes(clean) ||
      clean.includes(codeClean) ||
      nameClean.includes(clean)
    )
  })
}

/**
 * Retorna o texto padronizado da metodologia técnica na descrição do serviço com fabricante dinâmico
 * @param brands Marcas ou itens selecionados no orçamento
 */
export function getStandardServiceMethodology(brands?: (string | undefined)[]): string {
  let manufacturerLabel = 'Bermo e Alfa Laval'
  if (brands && brands.length > 0) {
    const validBrands = brands.filter(Boolean) as string[]
    const hasBermo = validBrands.some((b) => {
      const u = b.toUpperCase()
      return u.includes('BERMO') || u.includes('ARI')
    })
    const hasAlfaLaval = validBrands.some((b) => {
      const u = b.toUpperCase()
      return u.includes('ALFA') || u.includes('LAVAL')
    })

    if (hasBermo && !hasAlfaLaval) {
      manufacturerLabel = 'Bermo'
    } else if (hasAlfaLaval && !hasBermo) {
      manufacturerLabel = 'Alfa Laval'
    } else if (hasBermo && hasAlfaLaval) {
      manufacturerLabel = 'Bermo e Alfa Laval'
    } else if (!hasBermo && !hasAlfaLaval) {
      // Se tiver marca não reconhecida, padrão Bermo e Alfa Laval
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
 * Texto obrigatório e exato da seção "Incluso no valor" da proposta (PDF e Modal)
 */
export const PROPOSAL_INCLUSIONS_TEXT =
  'O valor da presente proposta inclui todos os impostos incidentes sobre serviços (ISS, PIS, COFINS, CSLL e IRPJ), mão de obra especializada com profissionais habilitados e capacitados para execução dos serviços técnicos descritos, deslocamento e despesas diversas com funcionários (transporte, alimentação e hospedagem quando aplicável), e todo material de consumo necessário para realização dos procedimentos de limpeza e manutenção (produtos químicos, ferramentas, EPIs e equipamentos de aplicação). As peças de reposição necessárias (placas, gaxetas, parafusos e componentes) são de responsabilidade do cliente, podendo ser fornecidas mediante orçamento complementar.'
