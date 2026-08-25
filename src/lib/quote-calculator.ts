import type {
  LaborCosts,
  TravelCosts,
  LodgingMealsCosts,
  IndirectCosts,
  IndirectTaxes,
  QuoteItem,
} from '@/types/crm'

export interface QuoteServiceComputation {
  itemsTotal: number
  laborTotal: number
  travelTotal: number
  lodgingMealsTotal: number
  integrationTotal: number // Custo de integração de funcionários (Item 3A)
  directCostsTotal: number // Soma dos custos diretos (Itens + MO + Deslocamento + Hospedagem + Integração)

  // Custos indiretos calculados
  serviceMarginPercent: number
  serviceMarginAmount: number
  adminCostPercent: number
  adminCostAmount: number
  salesCommissionPercent: number
  salesCommissionAmount: number

  // Impostos
  taxes: IndirectTaxes
  totalTaxesPercent: number
  taxesAmount: number

  // Preço de venda sugerido e total final
  totalIndirectCosts: number
  finalClientPrice: number
}

export const DEFAULT_INDIRECT_TAXES: IndirectTaxes = {
  pis: 1.65, // 1,65%
  cofins: 7.6, // 7,60%
  iss: 5.0, // 5,00% (editável conforme município)
  csll: 1.08, // 1,08%
  irpj: 4.8, // 4,80%
  irDifference: 20.0, // 20% sobre o IRPJ (= 0.96%)
  totalTaxesPercentage: 21.09, // Soma efetiva
  calculatedTaxesAmount: 0,
}

export function computeTotalTaxesPercentage(taxes: IndirectTaxes): number {
  const irEffective = taxes.irpj + taxes.irpj * (taxes.irDifference / 100)
  const sum =
    (taxes.pis || 0) + (taxes.cofins || 0) + (taxes.iss || 0) + (taxes.csll || 0) + irEffective
  return Math.round(sum * 100) / 100
}

/**
 * Calcula a composição de custos diretos e indiretos de serviços BERMO
 */
/**
 * Calcula o custo adicional da Integração de Funcionários (Item 3A do orçamento):
 * - Se "Não": 0
 * - Se "Sim" e "No dia do início da obra" (same_day):
 *     Meio dia (4h) de serviço para cada funcionário alocado (Técnico, Ajudante, Inspetor)
 *     => 4h * (techCount * techRate + helperCount * helperRate + inspectorCount * inspectorRate)
 * - Se "Sim" e "Antecipada" (early):
 *     Custos COMPLETOS de deslocamento (ida e volta) + 1 DIA INTEIRO (8h) de serviço de cada funcionário alocado
 *     => travelTotal + 8h * (techCount * techRate + helperCount * helperRate + inspectorCount * inspectorRate)
 */
export function calculateIntegrationCost({
  needsIntegration = 'Não',
  integrationTiming = 'same_day',
  labor,
  travel,
}: {
  needsIntegration?: 'Sim' | 'Não'
  integrationTiming?: 'same_day' | 'early'
  labor?: LaborCosts
  travel?: TravelCosts
}): number {
  if (needsIntegration !== 'Sim') {
    return 0
  }

  const techCount = Number(labor?.technician?.professionalsCount || 0)
  const techRate = Number(labor?.technician?.hourlyRate || 0)

  const helperCount = Number(labor?.helper?.professionalsCount || 0)
  const helperRate = Number(labor?.helper?.hourlyRate || 0)

  const inspectorCount = Number(labor?.inspector?.professionalsCount || 0)
  const inspectorRate = Number(labor?.inspector?.hourlyRate || 0)

  // Custo por hora de toda a equipe alocada
  const hourlyTeamCost =
    techCount * techRate + helperCount * helperRate + inspectorCount * inspectorRate

  if (integrationTiming === 'same_day') {
    // Meio dia (4 horas ou 50% de uma diária de 8h)
    const halfDayLabor = hourlyTeamCost * 4
    return Math.round(halfDayLabor * 100) / 100
  } else if (integrationTiming === 'early') {
    // Deslocamento completo + Um dia inteiro (8 horas)
    const fullDayLabor = hourlyTeamCost * 8
    const travelCost = Number(travel?.total || 0)
    return Math.round((travelCost + fullDayLabor) * 100) / 100
  }

  return 0
}

export function calculateQuoteServiceComposition({
  items = [],
  labor,
  travel,
  lodgingMeals,
  needsIntegration = 'Não',
  integrationTiming = 'same_day',
  serviceMarginPercent = 25, // 20% a 30% (padrão 25%)
  adminCostPercent = 15, // Fixo 15%
  salesCommissionPercent = 6, // 4% a 10% (padrão 6%)
  customTaxes,
}: {
  items: QuoteItem[]
  labor?: LaborCosts
  travel?: TravelCosts
  lodgingMeals?: LodgingMealsCosts
  needsIntegration?: 'Sim' | 'Não'
  integrationTiming?: 'same_day' | 'early'
  serviceMarginPercent?: number
  adminCostPercent?: number
  salesCommissionPercent?: number
  customTaxes?: IndirectTaxes
}): QuoteServiceComputation {
  const itemsTotal = items.reduce((acc, it) => acc + (Number(it.total) || 0), 0)

  // Mão de Obra
  const laborTech = labor
    ? Number(labor.technician?.total) ||
      Number(labor.technician?.professionalsCount || 0) *
        Number(labor.technician?.estimatedHours || 0) *
        Number(labor.technician?.hourlyRate || 0)
    : 0
  const laborHelper = labor
    ? Number(labor.helper?.total) ||
      Number(labor.helper?.professionalsCount || 0) *
        Number(labor.helper?.estimatedHours || 0) *
        Number(labor.helper?.hourlyRate || 0)
    : 0
  const laborInspector = labor
    ? Number(labor.inspector?.total) ||
      Number(labor.inspector?.professionalsCount || 0) *
        Number(labor.inspector?.estimatedHours || 0) *
        Number(labor.inspector?.hourlyRate || 0)
    : 0
  const laborTotal = labor ? laborTech + laborHelper + laborInspector : 0

  // Deslocamento
  const travelTotal = travel ? Number(travel.total || 0) : 0

  // Hospedagem & Alimentação
  const lodgingMealsTotal = lodgingMeals
    ? Number(
        lodgingMeals.total ||
          Number(lodgingMeals.hotelSubtotal || 0) + Number(lodgingMeals.mealsSubtotal || 0),
      )
    : 0

  // Custo de Integração de Funcionários (Item 3A)
  const integrationTotal = calculateIntegrationCost({
    needsIntegration,
    integrationTiming,
    labor,
    travel,
  })

  // Total de Custos Diretos
  const directCostsTotal =
    itemsTotal + laborTotal + travelTotal + lodgingMealsTotal + integrationTotal

  // Impostos
  const taxes: IndirectTaxes = customTaxes || { ...DEFAULT_INDIRECT_TAXES }
  const totalTaxesPercent = computeTotalTaxesPercentage(taxes)
  taxes.totalTaxesPercentage = totalTaxesPercent

  // Cálculo dos Custos Indiretos:
  // Preço Final = (custos diretos + margem + admin + impostos + comissão)
  // Como percentuais sobre a base de custo direto:
  const marginAmt = Math.round(directCostsTotal * (serviceMarginPercent / 100) * 100) / 100
  const adminAmt = Math.round(directCostsTotal * (adminCostPercent / 100) * 100) / 100
  const taxesAmt = Math.round(directCostsTotal * (totalTaxesPercent / 100) * 100) / 100
  const commissionAmt = Math.round(directCostsTotal * (salesCommissionPercent / 100) * 100) / 100
  taxes.calculatedTaxesAmount = taxesAmt

  const totalIndirectCosts = marginAmt + adminAmt + taxesAmt + commissionAmt
  const finalClientPrice = Math.round((directCostsTotal + totalIndirectCosts) * 100) / 100

  return {
    itemsTotal,
    laborTotal,
    travelTotal,
    lodgingMealsTotal,
    integrationTotal,
    directCostsTotal,
    serviceMarginPercent,
    serviceMarginAmount: marginAmt,
    adminCostPercent,
    adminCostAmount: adminAmt,
    salesCommissionPercent,
    salesCommissionAmount: commissionAmt,
    taxes,
    totalTaxesPercent,
    taxesAmount: taxesAmt,
    totalIndirectCosts,
    finalClientPrice,
  }
}
