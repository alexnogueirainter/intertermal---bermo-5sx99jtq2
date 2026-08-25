import { QuoteItem, TravelCostsState } from '@/types/crm'

export interface IndirectTaxes {
  pis: number // 1.65%
  cofins: number // 7.60%
  iss: number // editável (padrão 3.5%)
  csll: number // 1.08%
  irpj: number // 4.80%
  irDiff: number // 0.96% (20% sobre IRPJ)
}

export const DEFAULT_INDIRECT_TAXES: IndirectTaxes = {
  pis: 1.65,
  cofins: 7.6,
  iss: 3.5,
  csll: 1.08,
  irpj: 4.8,
  irDiff: 0.96,
}

export interface QuoteCalculationInput {
  items: QuoteItem[]
  laborTotal: number
  travelCosts: TravelCostsState
  lodgingMeals: {
    hotelDays: number
    hotelRatePerDay: number
    mealsDays: number
    mealsRatePerDay: number
  }
  maintenanceMaterialsTotal?: number // Materiais de manutenção (custo interno)
  needsIntegration?: 'Sim' | 'Não'
  integrationTiming?: 'same_day' | 'early'
  serviceMarginPercent?: number // Padrão 25% (20% a 30%)
  adminCostPercent?: number // Fixo 15%
  salesCommissionPercent?: number // Padrão 6% (4% a 10%)
  customTaxes?: Partial<IndirectTaxes>
}

export interface QuoteCalculationResult {
  // Custos Diretos
  itemsDirectCost: number
  laborTotal: number
  travelTotal: number
  lodgingMealsTotal: number
  maintenanceMaterialsTotal: number
  integrationTotal: number
  directCostsTotal: number

  // Custos Indiretos & Margens
  serviceMarginPercent: number
  serviceMarginAmount: number
  adminCostPercent: number
  adminCostAmount: number
  salesCommissionPercent: number
  salesCommissionAmount: number

  // Impostos
  taxes: IndirectTaxes & { totalTaxes: number }
  totalTaxesPercent: number
  taxesAmount: number

  // Totalizador
  totalIndirectCosts: number
  finalClientPrice: number
}

/**
 * Realiza o cálculo rigoroso da composição de custos e formação do preço de venda do orçamento de serviço
 */
export function calculateQuotePricing(input: QuoteCalculationInput): QuoteCalculationResult {
  const {
    items = [],
    laborTotal = 0,
    travelCosts,
    lodgingMeals,
    maintenanceMaterialsTotal = 0,
    needsIntegration = 'Não',
    integrationTiming = 'same_day',
    serviceMarginPercent = 25,
    adminCostPercent = 15,
    salesCommissionPercent = 6,
    customTaxes = {},
  } = input

  // 1. Custos Diretos de Itens/Produtos de equipamentos (apenas se marcado para incluir custo de produto novo)
  const itemsDirectCost = items.reduce((sum, it) => {
    if (it.include_product_cost) {
      const prodPrice = it.bermo_specs?.productBasePrice || 0
      const qty = it.quantity || 1
      return sum + prodPrice * qty
    }
    // Para itens genéricos sem bermo_specs que possam ter valor unitário direto
    if (!it.bermo_specs && it.unit_price) {
      return sum + (it.total || 0)
    }
    return sum
  }, 0)

  // 2. Custos de Logística e Deslocamento
  const travelTotal =
    (travelCosts?.calculatedFuelCost || 0) +
    (travelCosts?.calculatedTollCost || 0) +
    (travelCosts?.manualFuelAdjustment || 0) +
    (travelCosts?.manualTollAdjustment || 0)

  // 3. Custos de Hospedagem & Alimentação
  const lodgingMealsTotal =
    (lodgingMeals?.hotelDays || 0) * (lodgingMeals?.hotelRatePerDay || 0) +
    (lodgingMeals?.mealsDays || 0) * (lodgingMeals?.mealsRatePerDay || 0)

  // 4. Custos Adicionais de Integração
  let integrationTotal = 0
  if (needsIntegration === 'Sim') {
    if (integrationTiming === 'same_day') {
      // 50% de H/H (4 horas extras da equipe)
      integrationTotal = laborTotal > 0 ? Math.round(laborTotal * 0.5) : 350
    } else {
      // Antecipada: 1 diária completa H/H + deslocamento extra
      integrationTotal = (laborTotal > 0 ? laborTotal : 700) + Math.round(travelTotal * 0.4)
    }
  }

  // Materiais de Manutenção (custo interno)
  const safeMaintenanceMaterials = Math.max(0, maintenanceMaterialsTotal || 0)

  // Soma dos Custos Diretos
  const directCostsTotal =
    itemsDirectCost +
    laborTotal +
    travelTotal +
    lodgingMealsTotal +
    safeMaintenanceMaterials +
    integrationTotal

  // 5. Impostos Consolidados
  const taxes: IndirectTaxes & { totalTaxes: number } = {
    pis: customTaxes.pis ?? DEFAULT_INDIRECT_TAXES.pis,
    cofins: customTaxes.cofins ?? DEFAULT_INDIRECT_TAXES.cofins,
    iss: customTaxes.iss ?? DEFAULT_INDIRECT_TAXES.iss,
    csll: customTaxes.csll ?? DEFAULT_INDIRECT_TAXES.csll,
    irpj: customTaxes.irpj ?? DEFAULT_INDIRECT_TAXES.irpj,
    irDiff: customTaxes.irDiff ?? DEFAULT_INDIRECT_TAXES.irDiff,
    totalTaxes: 0,
  }

  taxes.totalTaxes = Number(
    (taxes.pis + taxes.cofins + taxes.iss + taxes.csll + taxes.irpj + taxes.irDiff).toFixed(2),
  )

  const totalTaxesPercent = taxes.totalTaxes

  // 6. Formação do Preço de Venda Final
  // Preço de Venda = Custo Direto * (1 + Margem) * (1 + Custos Administrativos) / (1 - (Impostos + Comissão))
  // Se divisor for zero ou negativo, evita divisão por zero
  const markupMultiplier = (1 + serviceMarginPercent / 100) * (1 + adminCostPercent / 100)
  const divisor = Math.max(0.1, 1 - (totalTaxesPercent + salesCommissionPercent) / 100)

  let finalClientPrice = 0
  if (directCostsTotal > 0) {
    finalClientPrice = (directCostsTotal * markupMultiplier) / divisor
  } else {
    // Se não há custos diretos calculados (ex: orçamento simples), usa a soma bruta dos itens
    finalClientPrice = items.reduce((s, it) => s + (it.total || 0), 0)
  }

  // Arredondamento para 2 casas
  finalClientPrice = Math.round(finalClientPrice * 100) / 100

  // 7. Quebra dos Custos Indiretos
  const serviceMarginAmount =
    Math.round(directCostsTotal * (serviceMarginPercent / 100) * 100) / 100
  const adminCostAmount = Math.round(directCostsTotal * (adminCostPercent / 100) * 100) / 100
  const salesCommissionAmount =
    Math.round(finalClientPrice * (salesCommissionPercent / 100) * 100) / 100
  const taxesAmount = Math.round(finalClientPrice * (totalTaxesPercent / 100) * 100) / 100

  const totalIndirectCosts =
    Math.round(
      (serviceMarginAmount + adminCostAmount + salesCommissionAmount + taxesAmount) * 100,
    ) / 100

  return {
    itemsDirectCost,
    laborTotal,
    travelTotal,
    lodgingMealsTotal,
    maintenanceMaterialsTotal: safeMaintenanceMaterials,
    integrationTotal,
    directCostsTotal,
    serviceMarginPercent,
    serviceMarginAmount,
    adminCostPercent,
    adminCostAmount,
    salesCommissionPercent,
    salesCommissionAmount,
    taxes,
    totalTaxesPercent,
    taxesAmount,
    totalIndirectCosts,
    finalClientPrice,
  }
}
