import { QuoteChemicalProductItem, QuoteMaterialItem, QuoteRecord, QuoteStatus } from '@/types/crm'

interface ComputeQuoteCalculationsDeps {
  adminRate: number
  carRentalDailyRate: number
  carRentalDays: number
  carRentalType: string
  chemicalProducts: QuoteChemicalProductItem[]
  cofinsRate: number
  consumptionKmL: number
  csllRate: number
  distanceKm: number
  foremanCount: number
  foremanHours: number
  foremanRate: number
  fuelPrice: number
  helperCount: number
  helperHours: number
  helperRate: number
  hotelDays: number
  hotelRate: number
  inspectorCount: number
  inspectorHours: number
  inspectorRate: number
  integrationCost: number
  integrationRequired: boolean
  irDiffRate: number
  irpjRate: number
  isRoundTrip: boolean
  issRate: number
  manualFuelAdj: number
  manualTollAdj: number
  materialsCost: number
  materialsItems: QuoteMaterialItem[]
  mealVoucherHousedQty: number
  mealVoucherHousedRate: number
  mealVoucherUnhousedQty: number
  mealVoucherUnhousedRate: number
  mealsDays: number
  mealsRate: number
  otherCosts: number
  pisRate: number
  plumberCount: number
  plumberHours: number
  plumberRate: number
  quotes: QuoteRecord[]
  salesCommission: number
  searchTerm: string
  serviceMargin: number
  status: QuoteStatus
  statusFilter: string
  techCount: number
  techHours: number
  techRate: number
  thirdPartyCost: number
  tollRoadPercent: number
  welderCount: number
  welderHours: number
  welderRate: number
}

export function computeQuoteCalculations(p: ComputeQuoteCalculationsDeps) {
  const {
    adminRate,
    carRentalDailyRate,
    carRentalDays,
    carRentalType,
    chemicalProducts,
    cofinsRate,
    consumptionKmL,
    csllRate,
    distanceKm,
    foremanCount,
    foremanHours,
    foremanRate,
    fuelPrice,
    helperCount,
    helperHours,
    helperRate,
    hotelDays,
    hotelRate,
    inspectorCount,
    inspectorHours,
    inspectorRate,
    integrationCost,
    integrationRequired,
    irDiffRate,
    irpjRate,
    isRoundTrip,
    issRate,
    manualFuelAdj,
    manualTollAdj,
    materialsCost,
    materialsItems,
    mealVoucherHousedQty,
    mealVoucherHousedRate,
    mealVoucherUnhousedQty,
    mealVoucherUnhousedRate,
    mealsDays,
    mealsRate,
    otherCosts,
    pisRate,
    plumberCount,
    plumberHours,
    plumberRate,
    quotes,
    salesCommission,
    searchTerm,
    serviceMargin,
    status,
    statusFilter,
    techCount,
    techHours,
    techRate,
    thirdPartyCost,
    tollRoadPercent,
    welderCount,
    welderHours,
    welderRate,
  } = p

  const materialsItemsTotal = materialsItems.reduce(
    (acc, item) =>
      acc +
      (Number(item.subtotal) || (Number(item.quantity) || 0) * (Number(item.unit_price) || 0) || 0),
    0,
  )

  // Cálculos de Produtos Químicos
  const chemicalProductsTotal = chemicalProducts.reduce((acc, p) => acc + (p.subtotal || 0), 0)

  // Cálculos de Mão de Obra (6 funções)
  const techTotal = techCount * techHours * techRate
  const helperTotal = helperCount * helperHours * helperRate
  const inspectorTotal = inspectorCount * inspectorHours * inspectorRate
  const welderTotal = welderCount * welderHours * welderRate
  const plumberTotal = plumberCount * plumberHours * plumberRate
  const foremanTotal = foremanCount * foremanHours * foremanRate
  const totalLaborCost =
    techTotal + helperTotal + inspectorTotal + welderTotal + plumberTotal + foremanTotal
  const totalLaborHours =
    techHours + helperHours + inspectorHours + welderHours + plumberHours + foremanHours

  // Cálculos de Deslocamento
  const effectiveDistance = isRoundTrip ? distanceKm * 2 : distanceKm
  const baseFuelCost = Math.max(
    0,
    (effectiveDistance / (consumptionKmL || 9.5)) * fuelPrice + manualFuelAdj,
  )
  const estimatedTolls = Math.max(
    0,
    Math.round((effectiveDistance / 100) * (tollRoadPercent / 100)),
  )
  const baseTollCost = Math.max(0, estimatedTolls * 12.5 + manualTollAdj)
  const carRentalSubtotal =
    carRentalType !== 'none' ? Math.max(0, carRentalDailyRate * carRentalDays) : 0

  // Total Deslocamento
  const travelTotalCost = Math.max(0, baseFuelCost + baseTollCost + carRentalSubtotal)

  // Cálculos de Hospedagem & Alimentação
  const hotelTotal = hotelDays * hotelRate
  const mealsTotal = mealsDays * mealsRate
  const voucherHousedTotal = mealVoucherHousedQty * mealVoucherHousedRate
  const voucherUnhousedTotal = mealVoucherUnhousedQty * mealVoucherUnhousedRate
  const lodgingMealsTotalCost = hotelTotal + mealsTotal + voucherHousedTotal + voucherUnhousedTotal

  // Total Custos Diretos
  // Grupo de Materiais = Campo Materiais + Peças e Componentes (materials_items) + Produtos Químicos (chemical_products)
  // REGRA: Este grupo é REPASSE PURO — entra no preço final pelo valor exato, sem overhead (admin), margem, comissão ou imposto.
  const totalMaterialsCostCombined = materialsCost + materialsItemsTotal
  const totalMaterialsWithChemicals = totalMaterialsCostCombined + chemicalProductsTotal
  const materialsPassThrough = totalMaterialsWithChemicals

  // Custo de Integração de Funcionários (entra no cálculo apenas se integrationRequired for true)
  const effectiveIntegrationCost = integrationRequired ? Number(integrationCost || 0) : 0

  // Custos Diretos de Serviços (SEM materiais)
  const serviceDirectCostsTotal =
    totalLaborCost +
    travelTotalCost +
    lodgingMealsTotalCost +
    thirdPartyCost +
    otherCosts +
    effectiveIntegrationCost

  // Custos Diretos Totais (Serviços + Materiais)
  const directCostsTotal = serviceDirectCostsTotal + materialsPassThrough

  // Total Tributos (Soma das alíquotas individuais de impostos)
  const totalTaxesPercent =
    Math.round(
      (Number(pisRate || 0) +
        Number(cofinsRate || 0) +
        Number(issRate || 0) +
        Number(csllRate || 0) +
        Number(irpjRate || 0) +
        Number(irDiffRate || 0)) *
        10000,
    ) / 10000

  // Divisor de formação de preço (Markup) — incide apenas sobre a parte de serviço
  const totalDeductionsPercent = (serviceMargin + salesCommission + totalTaxesPercent) / 100
  const divisor = Math.max(0.1, 1 - totalDeductionsPercent)

  // Overhead (adminRate) incide apenas sobre custos de serviço
  const adminAmount = Math.round(serviceDirectCostsTotal * (adminRate / 100) * 100) / 100
  const baseGrossCost = Math.round((serviceDirectCostsTotal + adminAmount) * 100) / 100

  // Preço da parcela de serviço (com tributos)
  const serviceSalePrice = Math.max(0, Math.round((baseGrossCost / divisor) * 100) / 100)

  // Preço Final ao Cliente = Serviço (com tributos) + Materiais/Peças (repasso puro sem tributos)
  const calculatedSalePrice = Math.round((serviceSalePrice + materialsPassThrough) * 100) / 100

  // Desdobramento de Margens, Comissão e Tributos (incidem exclusivamente sobre serviceSalePrice)
  const serviceMarginAmount = Math.round(serviceSalePrice * (serviceMargin / 100) * 100) / 100
  const salesCommissionAmount = Math.round(serviceSalePrice * (salesCommission / 100) * 100) / 100
  const taxesAmount = Math.round(serviceSalePrice * (totalTaxesPercent / 100) * 100) / 100
  const totalIndirectMarkupSum =
    Math.round((serviceMarginAmount + salesCommissionAmount + taxesAmount + adminAmount) * 100) /
    100

  // Objeto de dados do formulário para salvar / criar / atualizar

  const filteredQuotes = quotes.filter((q) => {
    const term = searchTerm.toLowerCase()
    const matchesSearch =
      (q.quote_number || '').toLowerCase().includes(term) ||
      (q.client_name || '').toLowerCase().includes(term) ||
      (q.equipment_model || '').toLowerCase().includes(term) ||
      (q.title || '').toLowerCase().includes(term) ||
      (q.assigned_to || '').toLowerCase().includes(term)

    const matchesStatus = statusFilter === 'all' || q.status === statusFilter
    return matchesSearch && matchesStatus
  })

  // Métricas para a barra superior de resumo
  const totalValue = quotes.reduce((acc, q) => acc + (q.total || q.final_price || 0), 0)
  const approvedQuotes = quotes.filter((q) => q.status === 'approved')
  const approvedValue = approvedQuotes.reduce((acc, q) => acc + (q.total || q.final_price || 0), 0)
  const pendingQuotes = quotes.filter((q) => q.status === 'sent' || q.status === 'draft')

  return {
    materialsItemsTotal,
    chemicalProductsTotal,
    techTotal,
    helperTotal,
    inspectorTotal,
    welderTotal,
    plumberTotal,
    foremanTotal,
    totalLaborCost,
    totalLaborHours,
    effectiveDistance,
    baseFuelCost,
    estimatedTolls,
    baseTollCost,
    carRentalSubtotal,
    travelTotalCost,
    hotelTotal,
    mealsTotal,
    voucherHousedTotal,
    voucherUnhousedTotal,
    lodgingMealsTotalCost,
    totalMaterialsCostCombined,
    totalMaterialsWithChemicals,
    materialsPassThrough,
    effectiveIntegrationCost,
    serviceDirectCostsTotal,
    directCostsTotal,
    totalTaxesPercent,
    totalDeductionsPercent,
    divisor,
    adminAmount,
    baseGrossCost,
    serviceSalePrice,
    calculatedSalePrice,
    serviceMarginAmount,
    salesCommissionAmount,
    taxesAmount,
    totalIndirectMarkupSum,
    filteredQuotes,
    totalValue,
    approvedQuotes,
    approvedValue,
    pendingQuotes,
  }
}
