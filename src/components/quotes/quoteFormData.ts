import { buildServiceDetails } from './quoteServiceDetails'
import {
  QuoteChemicalProductItem,
  QuoteCustomMaterial,
  QuoteEquipmentItem,
  QuoteLaborConfig,
  QuoteLodgingMealsConfig,
  QuoteMaterialItem,
  QuoteRecord,
  QuoteStatus,
  QuoteTravelConfig,
} from '@/types/crm'

interface MakeGetFormDataObjectDeps {
  materialsItems: QuoteMaterialItem[]
  chemicalProducts: QuoteChemicalProductItem[]
  clientId: string
  clientName: string
  quoteTitle: string
  quoteNumber: string
  status: QuoteStatus
  equipmentModel: string
  equipmentBrand: string
  equipmentQuantity: number
  plateCount: number | undefined
  plateMaterial: string
  plateThickness: number | undefined
  gasketMaterial: string
  connectionSize: string
  pressureTestBar: number | undefined
  workingPressureBar: number | undefined
  dimensionsWHd: string
  workFluid: string
  homologatedProcedure: string
  technicalProvenance: any[]
  integrationRequired: boolean
  integrationTiming: 'same_day' | 'early' | string
  integrationWeekday: string
  integrationCost: number
  workPermitRequired: boolean
  customMaterials: QuoteCustomMaterial[]
  equipments: QuoteEquipmentItem[]
  scopeOfWork: string
  dealId: string
  dealTitle: string
  assignedTo: string
  approvalToken: string
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
  thirdPartyCost: number
  otherCosts: number
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
  technicalNotes: string
  commercialNotes: string
  materialsItemsTotal: number
  chemicalProductsTotal: number
  techTotal: number
  helperTotal: number
  inspectorTotal: number
  welderTotal: number
  plumberTotal: number
  foremanTotal: number
  totalLaborCost: number
  totalLaborHours: number
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

export function makeGetFormDataObject(p: MakeGetFormDataObjectDeps) {
  const {
    materialsItems,
    chemicalProducts,
    clientId,
    clientName,
    quoteTitle,
    quoteNumber,
    status,
    equipmentModel,
    equipmentBrand,
    equipmentQuantity,
    plateCount,
    plateMaterial,
    plateThickness,
    gasketMaterial,
    connectionSize,
    pressureTestBar,
    workingPressureBar,
    dimensionsWHd,
    workFluid,
    homologatedProcedure,
    technicalProvenance,
    integrationRequired,
    integrationTiming,
    integrationWeekday,
    integrationCost,
    workPermitRequired,
    customMaterials,
    equipments,
    scopeOfWork,
    dealId,
    dealTitle,
    assignedTo,
    approvalToken,
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
    thirdPartyCost,
    otherCosts,
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
    technicalNotes,
    commercialNotes,
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

  const getFormDataObject = (): Partial<QuoteRecord> => {
    const travelConfig: QuoteTravelConfig = {
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
      car_rental_type: carRentalType,
      car_rental_daily_rate: carRentalDailyRate,
      car_rental_days: carRentalDays,
      car_rental_total: carRentalSubtotal,
    }

    const lodgingConfig: QuoteLodgingMealsConfig = {
      hotelDays,
      hotelRate,
      mealsDays,
      mealsRate,
      mealVoucherHousedQty,
      mealVoucherHousedRate,
      mealVoucherUnhousedQty,
      mealVoucherUnhousedRate,
    }

    const laborConfig: QuoteLaborConfig = {
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
    }

    const sanitizedEquipments: QuoteEquipmentItem[] = (
      equipments && equipments.length > 0
        ? equipments
        : [
            {
              id: `eq-${Date.now()}-1`,
              model: equipmentModel || '',
              brand: equipmentBrand || '',
              quantity: equipmentQuantity || 1,
              tag: '',
              serial_number: '',
              plate_count: plateCount,
              plate_material: plateMaterial || '',
              plate_thickness: plateThickness,
              gasket_material: gasketMaterial || '',
              connection_size: connectionSize || '',
              pressure_test_bar: pressureTestBar,
              working_pressure_bar: workingPressureBar,
            },
          ]
    ).map((eq, idx) => ({
      id: eq.id || `eq-${idx + 1}`,
      model: eq.model != null ? String(eq.model).trim() : '',
      brand: eq.brand != null && String(eq.brand).trim() ? String(eq.brand).trim() : '',
      series: eq.series || undefined,
      quantity: Math.max(1, Number(eq.quantity) || 1),
      tag: eq.tag || undefined,
      serial_number: eq.serial_number || undefined,
      plate_count:
        eq.plate_count != null && !isNaN(Number(eq.plate_count))
          ? Number(eq.plate_count)
          : undefined,
      plate_material:
        eq.plate_material != null && String(eq.plate_material).trim()
          ? String(eq.plate_material).trim()
          : undefined,
      plate_thickness:
        eq.plate_thickness != null && !isNaN(Number(eq.plate_thickness))
          ? Number(eq.plate_thickness)
          : undefined,
      gasket_material:
        eq.gasket_material != null && String(eq.gasket_material).trim()
          ? String(eq.gasket_material).trim()
          : undefined,
      connection_size:
        eq.connection_size != null && String(eq.connection_size).trim()
          ? String(eq.connection_size).trim()
          : undefined,
      connection_type: eq.connection_type || undefined,
      pressure_test_bar:
        eq.pressure_test_bar != null && !isNaN(Number(eq.pressure_test_bar))
          ? Number(eq.pressure_test_bar)
          : undefined,
      working_pressure_bar:
        eq.working_pressure_bar != null && !isNaN(Number(eq.working_pressure_bar))
          ? Number(eq.working_pressure_bar)
          : undefined,
      dimensions: eq.dimensions || undefined,
      dimensions_w_h_d: eq.dimensions_w_h_d || undefined,
      weight_kg:
        eq.weight_kg != null && !isNaN(Number(eq.weight_kg)) ? Number(eq.weight_kg) : undefined,
      weightKg:
        eq.weightKg != null && !isNaN(Number(eq.weightKg)) ? Number(eq.weightKg) : undefined,
    }))

    const primaryEq = sanitizedEquipments[0] || {
      id: 'eq-1',
      model: equipmentModel || '',
      brand: equipmentBrand || '',
      quantity: equipmentQuantity || 1,
      plate_count: plateCount,
      plate_material: plateMaterial || '',
      plate_thickness: plateThickness,
      gasket_material: gasketMaterial || '',
      connection_size: connectionSize || '',
      pressure_test_bar: pressureTestBar,
      working_pressure_bar: workingPressureBar,
    }

    const currentSavedTime = new Date().toISOString()

    return {
      title:
        quoteTitle ||
        `Proposta Técnica ${primaryEq.model || equipmentModel || 'BERMO'} - ${clientName || 'Cliente'}`,
      quote_number:
        quoteNumber || `INT-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      client_id: clientId,
      client_name: clientName,
      deal_id: dealId || undefined,
      deal_title: dealTitle || undefined,
      assigned_to: assignedTo || 'Alex Nogueira',
      approval_token: approvalToken || undefined,
      status,
      equipments: sanitizedEquipments,
      equipment_brand: primaryEq.brand || equipmentBrand || '',
      equipment_model: primaryEq.model || equipmentModel || '',
      equipment_quantity: primaryEq.quantity || equipmentQuantity || 1,
      plate_count: primaryEq.plate_count ?? plateCount,
      plate_material: primaryEq.plate_material || plateMaterial || undefined,
      plate_thickness: primaryEq.plate_thickness ?? plateThickness,
      gasket_material: primaryEq.gasket_material || gasketMaterial || undefined,
      connection_size: primaryEq.connection_size || connectionSize || undefined,
      pressure_test_bar: primaryEq.pressure_test_bar ?? pressureTestBar,
      working_pressure_bar: primaryEq.working_pressure_bar ?? workingPressureBar,
      dimensions_w_h_d: dimensionsWHd,
      work_fluid: workFluid,
      homologated_procedure: homologatedProcedure,
      last_saved_at: currentSavedTime,
      scope_of_work: scopeOfWork,

      // Integração & Permissão de Trabalho
      integration_needed: integrationRequired,
      integration_timing: integrationTiming,
      integration_when: integrationTiming,
      integration_weekday: integrationWeekday,
      integration_day: integrationWeekday,
      integration_cost: integrationCost,
      work_permit_needed: workPermitRequired,
      work_permit_cost: 0,

      // Peças, Materiais customizados e Produtos Químicos
      materials_items: materialsItems && materialsItems.length > 0 ? materialsItems : [],
      custom_materials: customMaterials && customMaterials.length > 0 ? customMaterials : undefined,
      chemical_products: chemicalProducts && chemicalProducts.length > 0 ? chemicalProducts : [],

      // Custos diretos - Mão de Obra (6 funções)
      labor_hours: totalLaborHours,
      labor_rate_hourly: techRate,
      tech_count: techCount,
      tech_hours: techHours,
      tech_rate: techRate,
      helper_count: helperCount,
      helper_hours: helperHours,
      helper_rate: helperRate,
      inspector_count: inspectorCount,
      inspector_hours: inspectorHours,
      inspector_rate: inspectorRate,
      welder_count: welderCount,
      welder_hours: welderHours,
      welder_rate: welderRate,
      plumber_count: plumberCount,
      plumber_hours: plumberHours,
      plumber_rate: plumberRate,
      foreman_count: foremanCount,
      foreman_hours: foremanHours,
      foreman_rate: foremanRate,
      labor_config: laborConfig,

      // Deslocamento & Rotas
      origin_cep: originCep,
      origin_address: originAddress,
      destination_cep: destinationCep,
      destination_address: destinationAddress,
      distance_km: distanceKm,
      is_round_trip: isRoundTrip,
      consumption_km_l: consumptionKmL,
      fuel_price: fuelPrice,
      toll_road_percent: tollRoadPercent,
      manual_fuel_adj: manualFuelAdj,
      manual_toll_adj: manualTollAdj,
      car_rental_type: carRentalType,
      car_rental_daily_rate: carRentalDailyRate,
      car_rental_days: carRentalDays,
      car_rental_total: carRentalSubtotal,
      travel_config: travelConfig,

      // Hospedagem & Alimentação
      hotel_days: hotelDays,
      hotel_rate: hotelRate,
      meals_days: mealsDays,
      meals_rate: mealsRate,
      meal_voucher_housed_qty: mealVoucherHousedQty,
      meal_voucher_housed_rate: mealVoucherHousedRate,
      meal_voucher_unhoused_qty: mealVoucherUnhousedQty,
      meal_voucher_unhoused_rate: mealVoucherUnhousedRate,
      lodging_meals_config: lodgingConfig,

      lodging_meals_cost: lodgingMealsTotalCost,
      travel_cost: travelTotalCost,
      materials_cost: materialsCost,
      third_party_cost: thirdPartyCost,
      other_costs: otherCosts,
      total_cost: directCostsTotal,

      // Margens e Tributos
      service_margin: Math.round(serviceMargin),
      sales_commission: Math.round(salesCommission),
      admin_rate: Math.round(adminRate),
      admin_cost: adminAmount,
      pis_rate: pisRate,
      cofins_rate: cofinsRate,
      iss_rate: issRate,
      csll_rate: csllRate,
      irpj_rate: irpjRate,
      ir_diff_rate: irDiffRate,
      pricing_config: {
        serviceMargin: Math.round(serviceMargin),
        salesCommission: Math.round(salesCommission),
        adminRate: Math.round(adminRate),
        pisRate,
        cofinsRate,
        issRate,
        csllRate,
        irpjRate,
        irDiffRate,
      },

      // Atualização em tempo real de service_details para manter a Composição Interna e relatórios 100% sincronizados
      service_details: buildServiceDetails({
        primaryEq,
        sanitizedEquipments,
        connectionSize,
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
      }),

      final_price: calculatedSalePrice,
      total: calculatedSalePrice,
      subtotal: calculatedSalePrice,
      payment_terms: paymentTerms,
      validity_days: validityDays,
      technical_notes: technicalNotes,
      commercial_notes: commercialNotes,
      technical_provenance: technicalProvenance,
    }
  }

  return getFormDataObject
}
