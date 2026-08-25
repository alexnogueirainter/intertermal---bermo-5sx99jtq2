export interface QuoteCalculationInput {
  materialsCost?: number
  laborHours?: number
  laborRate?: number
  travelCost?: number
  lodgingMealsCost?: number
  thirdPartyCost?: number
  otherCosts?: number
  serviceMargin?: number // % ex: 25
  salesCommission?: number // % ex: 6
  taxesRate?: number // % ex: 14.83
  discountAmount?: number
  // Formato estruturado alternativo
  directCosts?: {
    materials?: number
    labor?: number
    travel?: number
    lodgingMeals?: number
    thirdParty?: number
    other?: number
  }
  indirectCosts?: {
    adminOverheadRate?: number
    commercialRate?: number
    equipmentDepreciation?: number
    contingencyRate?: number
  }
  taxes?: {
    pis?: number
    cofins?: number
    iss?: number
    csll?: number
    irpj?: number
    irDiff?: number
  }
  marginPercent?: number
  commissionPercent?: number
}

export interface PricingCalculationResult {
  directCostsTotal: number
  totalIndirectCosts: number
  totalTaxesPercent: number
  totalTaxesAmount: number
  marginAmount: number
  commissionAmount: number
  discountAmount: number
  subtotalBeforeTaxes: number
  finalClientPrice: number
}

export function calculateDirectCosts(
  input: QuoteCalculationInput['directCosts'] | QuoteCalculationInput,
): number {
  if (!input) return 0
  if ('materials' in input) {
    const d = input as NonNullable<QuoteCalculationInput['directCosts']>
    return (
      (d.materials || 0) +
      (d.labor || 0) +
      (d.travel || 0) +
      (d.lodgingMeals || 0) +
      (d.thirdParty || 0) +
      (d.other || 0)
    )
  }
  const full = input as QuoteCalculationInput
  const labor = (full.laborHours || 0) * (full.laborRate || 0)
  return (
    (full.materialsCost || 0) +
    labor +
    (full.travelCost || 0) +
    (full.lodgingMealsCost || 0) +
    (full.thirdPartyCost || 0) +
    (full.otherCosts || 0)
  )
}

export function calculateIndirectCosts(
  directTotal: number,
  indirects?: QuoteCalculationInput['indirectCosts'],
): number {
  if (!indirects) return 0
  const rate =
    (indirects.adminOverheadRate || 0) +
    (indirects.commercialRate || 0) +
    (indirects.equipmentDepreciation || 0) +
    (indirects.contingencyRate || 0)
  return directTotal * (rate / 100)
}

export function calculateTaxes(taxes?: QuoteCalculationInput['taxes']): number {
  if (!taxes) return 14.83
  return (
    (taxes.pis || 0) +
    (taxes.cofins || 0) +
    (taxes.iss || 0) +
    (taxes.csll || 0) +
    (taxes.irpj || 0) +
    (taxes.irDiff || 0)
  )
}

export function calculateQuotePricing(input: QuoteCalculationInput): PricingCalculationResult {
  const directTotal = input.directCosts
    ? (input.directCosts.materials || 0) +
      (input.directCosts.labor || 0) +
      (input.directCosts.travel || 0) +
      (input.directCosts.lodgingMeals || 0) +
      (input.directCosts.thirdParty || 0) +
      (input.directCosts.other || 0)
    : calculateDirectCosts(input)

  const indirectTotal = calculateIndirectCosts(directTotal, input.indirectCosts)
  const baseCost = directTotal + indirectTotal

  const marginPct =
    input.marginPercent !== undefined ? input.marginPercent : input.serviceMargin || 25
  const commissionPct =
    input.commissionPercent !== undefined ? input.commissionPercent : input.salesCommission || 6
  const taxPct = input.taxes ? calculateTaxes(input.taxes) : input.taxesRate || 14.83
  const discount = input.discountAmount || 0

  // Preço de venda com Markup divisor: Preço = Custo / (1 - (Margem% + Comissão% + Impostos%)/100)
  const totalDeductionsPercent = (marginPct + commissionPct + taxPct) / 100
  const divisor = Math.max(0.1, 1 - totalDeductionsPercent)

  const priceGross = baseCost / divisor
  const finalPrice = Math.max(0, priceGross - discount)

  const taxAmount = finalPrice * (taxPct / 100)
  const commissionAmount = finalPrice * (commissionPct / 100)
  const marginAmount = finalPrice * (marginPct / 100)

  return {
    directCostsTotal: Math.round(directTotal * 100) / 100,
    totalIndirectCosts: Math.round(indirectTotal * 100) / 100,
    totalTaxesPercent: Math.round(taxPct * 100) / 100,
    totalTaxesAmount: Math.round(taxAmount * 100) / 100,
    marginAmount: Math.round(marginAmount * 100) / 100,
    commissionAmount: Math.round(commissionAmount * 100) / 100,
    discountAmount: discount,
    subtotalBeforeTaxes: Math.round((finalPrice - taxAmount) * 100) / 100,
    finalClientPrice: Math.round(finalPrice * 100) / 100,
  }
}
