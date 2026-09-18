export interface QuoteDirectCosts {
  labor: number
  travel: number
  lodgingMeals: number
  materials: number
  thirdParty: number
  other: number
}

export interface QuoteIndirectRates {
  adminRate: number
  serviceMargin: number
  salesCommission: number
}

export interface QuoteTaxRates {
  pis: number
  cofins: number
  iss: number
  csll: number
  irpj: number
  irDiff: number
}

export interface QuoteCalculationInput {
  directCosts?: QuoteDirectCosts
  indirectRates?: QuoteIndirectRates
  taxes?: QuoteTaxRates
  // Campos planos como alternativa
  laborCost?: number
  travelCost?: number
  lodgingMealsCost?: number
  materialsCost?: number
  thirdPartyCost?: number
  otherCosts?: number
  adminRate?: number
  serviceMargin?: number
  salesCommission?: number
  pisRate?: number
  cofinsRate?: number
  issRate?: number
  csllRate?: number
  irpjRate?: number
  irDiffRate?: number
}

export interface PricingCalculationResult {
  // Custos Diretos
  serviceDirectCostsTotal: number // Serviços SEM materiais (mão de obra + deslocamento + hotel + terceiros + outros)
  materialsPassThrough: number // Repasse puro de materiais (materiais + peças + químicos)
  directCostsTotal: number // Total de custos diretos (serviços + repasse puro)

  // Formação de Preço da Parcela de Serviço (com overhead e divisor)
  adminAmount: number // Overhead de serviço = serviceDirectCostsTotal * (adminRate / 100)
  baseGrossCost: number // Base bruta de serviço = serviceDirectCostsTotal + adminAmount
  totalTaxesPercent: number
  totalDeductionsPercent: number
  divisor: number
  serviceSalePrice: number // Preço da parte de serviço = baseGrossCost / divisor

  // Preço Final ao Cliente
  calculatedSalePrice: number // Preço Final = serviceSalePrice + materialsPassThrough
  finalSalePrice?: number

  // Desdobramento de Margens, Comissão e Tributos (incidem EXCLUSIVAMENTE sobre serviceSalePrice)
  serviceMarginAmount: number
  salesCommissionAmount: number
  taxesAmount: number
  totalIndirectMarkupSum?: number
  pisAmount: number
  cofinsAmount: number
  issAmount: number
  csllAmount: number
  irpjAmount: number
  irDiffAmount: number
}

export function calculateDirectCosts(
  labor: number,
  travel: number,
  lodging: number,
  materials: number,
  thirdParty: number,
  other: number,
): number {
  return (
    Number(labor || 0) +
    Number(travel || 0) +
    Number(lodging || 0) +
    Number(materials || 0) +
    Number(thirdParty || 0) +
    Number(other || 0)
  )
}

export function calculateServiceDirectCosts(
  labor: number,
  travel: number,
  lodging: number,
  thirdParty: number,
  other: number,
): number {
  return (
    Number(labor || 0) +
    Number(travel || 0) +
    Number(lodging || 0) +
    Number(thirdParty || 0) +
    Number(other || 0)
  )
}

export function calculateIndirectCosts(
  serviceDirectCosts: number,
  adminRate: number,
): { adminAmount: number; baseGrossCost: number } {
  const adminAmount =
    Math.round(Number(serviceDirectCosts || 0) * (Number(adminRate || 0) / 100) * 100) / 100
  const baseGrossCost = Math.round((Number(serviceDirectCosts || 0) + adminAmount) * 100) / 100
  return { adminAmount, baseGrossCost }
}

export function calculateTaxes(
  pis: number,
  cofins: number,
  iss: number,
  csll: number,
  irpj: number,
  irDiff: number,
): number {
  return (
    Math.round(
      (Number(pis || 0) +
        Number(cofins || 0) +
        Number(iss || 0) +
        Number(csll || 0) +
        Number(irpj || 0) +
        Number(irDiff || 0)) *
        10000,
    ) / 10000
  )
}

/**
 * Nova formação de preço:
 * 1. O grupo "materiais" (campo Materiais + Peças e Componentes + Químicos) é REPASSE PURO:
 *    não sofre overhead (admin), margem, comissão nem impostos.
 * 2. Preço de Serviço = [custos diretos de serviço × (1 + overhead%)] ÷ divisor
 * 3. Preço Final ao Cliente = Preço de Serviço + Repasse Puro de Materiais
 * 4. Margem, comissão e tributos incidem exclusivamente sobre o Preço de Serviço.
 */
export function calculateQuotePricing(input: QuoteCalculationInput): PricingCalculationResult {
  const labor = Number(input.directCosts?.labor ?? input.laborCost ?? 0)
  const travel = Number(input.directCosts?.travel ?? input.travelCost ?? 0)
  const lodging = Number(input.directCosts?.lodgingMeals ?? input.lodgingMealsCost ?? 0)
  const materials = Number(input.directCosts?.materials ?? input.materialsCost ?? 0)
  const thirdParty = Number(input.directCosts?.thirdParty ?? input.thirdPartyCost ?? 0)
  const other = Number(input.directCosts?.other ?? input.otherCosts ?? 0)

  const adminRate = Number(input.indirectRates?.adminRate ?? input.adminRate ?? 0)
  const serviceMargin = Number(input.indirectRates?.serviceMargin ?? input.serviceMargin ?? 0)
  const salesCommission = Number(input.indirectRates?.salesCommission ?? input.salesCommission ?? 0)

  const pisRate = Number(input.taxes?.pis ?? input.pisRate ?? 0)
  const cofinsRate = Number(input.taxes?.cofins ?? input.cofinsRate ?? 0)
  const issRate = Number(input.taxes?.iss ?? input.issRate ?? 0)
  const csllRate = Number(input.taxes?.csll ?? input.csllRate ?? 0)
  const irpjRate = Number(input.taxes?.irpj ?? input.irpjRate ?? 0)
  const irDiffRate = Number(input.taxes?.irDiff ?? input.irDiffRate ?? 0)

  const materialsPassThrough = Math.max(0, materials)
  const serviceDirectCostsTotal = calculateServiceDirectCosts(
    labor,
    travel,
    lodging,
    thirdParty,
    other,
  )
  const directCostsTotal = serviceDirectCostsTotal + materialsPassThrough

  // Overhead (adminRate) incide apenas sobre os custos de serviço
  const { adminAmount, baseGrossCost } = calculateIndirectCosts(serviceDirectCostsTotal, adminRate)

  const totalTaxesPercent = calculateTaxes(
    pisRate,
    cofinsRate,
    issRate,
    csllRate,
    irpjRate,
    irDiffRate,
  )
  const totalDeductionsPercent = (serviceMargin + salesCommission + totalTaxesPercent) / 100
  const divisor = Math.max(0.1, 1 - totalDeductionsPercent)

  // Preço da parcela de serviço calculada pelo divisor
  const serviceSalePrice = Math.max(0, Math.round((baseGrossCost / divisor) * 100) / 100)

  // Preço final ao cliente = serviço com tributos + repasse puro de materiais sem tributos
  const calculatedSalePrice = Math.round((serviceSalePrice + materialsPassThrough) * 100) / 100

  // Margem, comissão e tributos incidem EXCLUSIVAMENTE sobre a parte de serviço
  const serviceMarginAmount = Math.round(serviceSalePrice * (serviceMargin / 100) * 100) / 100
  const salesCommissionAmount = Math.round(serviceSalePrice * (salesCommission / 100) * 100) / 100
  const taxesAmount = Math.round(serviceSalePrice * (totalTaxesPercent / 100) * 100) / 100

  const pisAmount = Math.round(serviceSalePrice * (pisRate / 100) * 100) / 100
  const cofinsAmount = Math.round(serviceSalePrice * (cofinsRate / 100) * 100) / 100
  const issAmount = Math.round(serviceSalePrice * (issRate / 100) * 100) / 100
  const csllAmount = Math.round(serviceSalePrice * (csllRate / 100) * 100) / 100
  const irpjAmount = Math.round(serviceSalePrice * (irpjRate / 100) * 100) / 100
  const irDiffAmount = Math.round(serviceSalePrice * (irDiffRate / 100) * 100) / 100

  const totalIndirectMarkupSum =
    Math.round((serviceMarginAmount + salesCommissionAmount + taxesAmount + adminAmount) * 100) /
    100

  return {
    serviceDirectCostsTotal,
    materialsPassThrough,
    directCostsTotal,
    adminAmount,
    baseGrossCost,
    totalTaxesPercent,
    totalDeductionsPercent,
    divisor,
    serviceSalePrice,
    calculatedSalePrice,
    finalSalePrice: calculatedSalePrice,
    serviceMarginAmount,
    salesCommissionAmount,
    taxesAmount,
    totalIndirectMarkupSum,
    pisAmount,
    cofinsAmount,
    issAmount,
    csllAmount,
    irpjAmount,
    irDiffAmount,
  }
}
