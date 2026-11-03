import { QuoteEquipmentItem } from '@/types/crm'

interface BuildServiceDetailsDeps {
  primaryEq: any
  sanitizedEquipments: QuoteEquipmentItem[]
  connectionSize: string
  equipmentModel: string
  equipmentBrand: string
  plateCount: number | undefined
  plateMaterial: string
  gasketMaterial: string
  pressureTestBar: number | undefined
  workingPressureBar: number | undefined
  workFluid: string
  integrationRequired: boolean
  scopeOfWork: string
  techCount: number
  techHours: number
  techRate: number
  helperCount: number
  helperHours: number
  helperRate: number
  inspectorCount: number
  inspectorHours: number
  inspectorRate: number
  welderCount: number
  welderHours: number
  welderRate: number
  plumberCount: number
  plumberHours: number
  plumberRate: number
  foremanCount: number
  foremanHours: number
  foremanRate: number
  originCep: string
  originAddress: string
  destinationCep: string
  destinationAddress: string
  distanceKm: number
  isRoundTrip: boolean
  consumptionKmL: number
  fuelPrice: number
  tollRoadPercent: number
  manualFuelAdj: number
  manualTollAdj: number
  carRentalType: string
  carRentalDailyRate: number
  carRentalDays: number
  hotelDays: number
  hotelRate: number
  mealsDays: number
  mealsRate: number
  mealVoucherHousedQty: number
  mealVoucherHousedRate: number
  mealVoucherUnhousedQty: number
  mealVoucherUnhousedRate: number
  materialsCost: number
  serviceMargin: number
  salesCommission: number
  adminRate: number
  pisRate: number
  cofinsRate: number
  issRate: number
  csllRate: number
  irpjRate: number
  irDiffRate: number
  paymentTerms: string
  validityDays: number
  materialsItemsTotal: number
  chemicalProductsTotal: number
  techTotal: number
  helperTotal: number
  inspectorTotal: number
  welderTotal: number
  plumberTotal: number
  foremanTotal: number
  totalLaborCost: number
  baseFuelCost: number
  baseTollCost: number
  carRentalSubtotal: number
  travelTotalCost: number
  lodgingMealsTotalCost: number
  totalMaterialsWithChemicals: number
  materialsPassThrough: number
  effectiveIntegrationCost: number
  serviceDirectCostsTotal: number
  directCostsTotal: number
  totalTaxesPercent: number
  divisor: number
  adminAmount: number
  serviceSalePrice: number
  calculatedSalePrice: number
  serviceMarginAmount: number
  salesCommissionAmount: number
  taxesAmount: number
  totalIndirectMarkupSum: number
}

export function buildServiceDetails(p: BuildServiceDetailsDeps) {
  const {
    primaryEq,
    sanitizedEquipments,
    equipmentModel,
    equipmentBrand,
    plateCount,
    plateMaterial,
    gasketMaterial,
    connectionSize,
    pressureTestBar,
    workingPressureBar,
    workFluid,
    integrationRequired,
    scopeOfWork,
    techCount,
    techHours,
    techRate,
    helperCount,
    helperHours,
    helperRate,
    inspectorCount,
    inspectorHours,
    inspectorRate,
    welderCount,
    welderHours,
    welderRate,
    plumberCount,
    plumberHours,
    plumberRate,
    foremanCount,
    foremanHours,
    foremanRate,
    originCep,
    originAddress,
    destinationCep,
    destinationAddress,
    distanceKm,
    isRoundTrip,
    consumptionKmL,
    fuelPrice,
    tollRoadPercent,
    manualFuelAdj,
    manualTollAdj,
    carRentalType,
    carRentalDailyRate,
    carRentalDays,
    hotelDays,
    hotelRate,
    mealsDays,
    mealsRate,
    mealVoucherHousedQty,
    mealVoucherHousedRate,
    mealVoucherUnhousedQty,
    mealVoucherUnhousedRate,
    materialsCost,
    serviceMargin,
    salesCommission,
    adminRate,
    pisRate,
    cofinsRate,
    issRate,
    csllRate,
    irpjRate,
    irDiffRate,
    paymentTerms,
    validityDays,
    materialsItemsTotal,
    chemicalProductsTotal,
    techTotal,
    helperTotal,
    inspectorTotal,
    welderTotal,
    plumberTotal,
    foremanTotal,
    totalLaborCost,
    baseFuelCost,
    baseTollCost,
    carRentalSubtotal,
    travelTotalCost,
    lodgingMealsTotalCost,
    totalMaterialsWithChemicals,
    materialsPassThrough,
    effectiveIntegrationCost,
    serviceDirectCostsTotal,
    directCostsTotal,
    totalTaxesPercent,
    divisor,
    adminAmount,
    serviceSalePrice,
    calculatedSalePrice,
    serviceMarginAmount,
    salesCommissionAmount,
    taxesAmount,
    totalIndirectMarkupSum,
  } = p

  return {
    service_technical_specs: {
      productCode: primaryEq.model || equipmentModel || '',
      productName: primaryEq.model || equipmentModel || '',
      productModel: primaryEq.model || equipmentModel || '',
      productBrand: primaryEq.brand || equipmentBrand || '',
      fluidType: workFluid || '',
      pipeMeasurement: primaryEq.connection_size || connectionSize || '',
      platesCount: String(primaryEq.plate_count ?? plateCount ?? ''),
      frameMaterial: primaryEq.plate_material || plateMaterial || '',
      gasketType: primaryEq.gasket_material || gasketMaterial || '',
      operatingPressure: String(primaryEq.working_pressure_bar ?? workingPressureBar ?? ''),
      testPressure: String(primaryEq.pressure_test_bar ?? pressureTestBar ?? ''),
      workFluid: workFluid || '',
      custom_work_fluid: '',
      scopeOfWork: scopeOfWork,
      equipments_list: sanitizedEquipments,
    },
    labor_costs: {
      techMechanical: {
        count: techCount,
        hours: techHours,
        ratePerHour: techRate,
        total: techTotal,
      },
      helper: {
        count: helperCount,
        hours: helperHours,
        ratePerHour: helperRate,
        total: helperTotal,
      },
      inspectorNDT: {
        count: inspectorCount,
        hours: inspectorHours,
        ratePerHour: inspectorRate,
        total: inspectorTotal,
      },
      welder: {
        count: welderCount,
        hours: welderHours,
        ratePerHour: welderRate,
        total: welderTotal,
      },
      plumber: {
        count: plumberCount,
        hours: plumberHours,
        ratePerHour: plumberRate,
        total: plumberTotal,
      },
      foreman: {
        count: foremanCount,
        hours: foremanHours,
        ratePerHour: foremanRate,
        total: foremanTotal,
      },
      totalLabor: totalLaborCost,
    },
    travel_costs: {
      originCep,
      originAddress,
      destinationCep,
      destinationAddress,
      distanceKm,
      isRoundTrip,
      fuelPrice,
      consumptionKmL,
      tollRoadPercent,
      calculatedFuelCost: baseFuelCost,
      calculatedTollCost: baseTollCost,
      manualFuelAdjustment: manualFuelAdj,
      manualTollAdjustment: manualTollAdj,
      car_rental_type: carRentalType,
      car_rental_daily_rate: carRentalDailyRate,
      car_rental_days: carRentalDays,
      car_rental_total: carRentalSubtotal,
      totalTravelCost: travelTotalCost,
    },
    lodging_meals_costs: {
      hotelDays,
      hotelRatePerDay: hotelRate,
      mealsDays,
      mealsRatePerDay: mealsRate,
      mealVoucherHousedQty,
      mealVoucherHousedRatePerDay: mealVoucherHousedRate,
      mealVoucherUnhousedQty,
      mealVoucherUnhousedRatePerDay: mealVoucherUnhousedRate,
      totalLodgingMeals: lodgingMealsTotalCost,
    },
    integration_cost: effectiveIntegrationCost,
    integration_needed: integrationRequired,
    pricing: {
      service_sale_price: serviceSalePrice,
      calculated_sale_price: calculatedSalePrice,
      final_sale_price: calculatedSalePrice,
      materials_pass_through: materialsPassThrough,
    },
    materials_breakdown: {
      typedMaterialsCost: materialsCost,
      materialsItemsTotal,
      chemicalProductsTotal,
      materialsPassThrough,
      totalMaterials: totalMaterialsWithChemicals,
    },
    indirect_costs: {
      serviceMarginPercent: serviceMargin,
      administrativeCostPercent: adminRate,
      adminRate,
      salesCommissionPercent: salesCommission,
      taxes: {
        pis: pisRate,
        cofins: cofinsRate,
        iss: issRate,
        csll: csllRate,
        irpj: irpjRate,
        irDiff: irDiffRate,
        totalTaxes: totalTaxesPercent,
      },
      serviceDirectCostsTotal,
      materialsPassThrough,
      totalDirectCosts: directCostsTotal,
      directCostsTotal,
      serviceMarginAmount,
      adminCostAmount: adminAmount,
      salesCommissionAmount,
      taxesAmount,
      totalIndirectAmount: totalIndirectMarkupSum,
      totalIndirectMarkupSum,
      divisor,
      serviceSalePrice,
      calculatedSalePrice,
      finalSalePrice: calculatedSalePrice,
    },
    payment_and_validity: {
      validityDays,
      paymentTerms,
    },
  }
}
