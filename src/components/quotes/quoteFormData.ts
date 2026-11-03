import type {
  QuoteLaborConfig,
  QuotePricingConfig,
  QuoteTravelConfig,
  QuoteLodgingMealsConfig,
  QuoteEquipmentItem,
  QuoteRecord,
} from '@/types/crm'

interface MakeGetFormDataObjectDeps {
  clientId: string
  clientName: string
  clientDocument?: string
  quoteTitle: string
  quoteNumber: string
  status: string
  equipmentModel: string
  equipmentBrand: string
  equipmentQuantity: number
  plateCount?: number
  plateMaterial: string
  plateThickness?: number
  gasketMaterial: string
  connectionSize: string
  connectionType?: string
  pressureTestBar?: number
  workingPressureBar?: number
  dimensionsWHd: string
  workFluid: string
  homologatedProcedure: string
  scopeOfWork: string
  integrationRequired: boolean
  integrationTiming: string
  integrationWeekday: string
  integrationCost: number
  workPermitRequired: boolean
  materialsItems: QuoteMaterialItemLocal[]
  customMaterials?: QuoteCustomMaterialLocal[]
  chemicalProducts: QuoteChemicalProductLocal[]
  techCount: number
  techHours: number
  techRate: number
  helperCount: number
  helperHours: number
  helperRate: number
  inspectorCount: number
  inspectorHours: number
  inspectorRate: number
  welderCount?: number
  welderHours?: number
  welderRate?: number
  plumberCount?: number
  plumberHours?: number
  plumberRate?: number
  foremanCount?: number
  foremanHours?: number
  foremanRate?: number
  pisRate: number
  cofinsRate: number
  issRate: number
  csllRate: number
  irpjRate: number
  irDiffRate: number
  serviceMargin: number
  salesCommission: number
  adminRate: number
  adminCost: number
  laborTotal: number
  techTotal: number
  helperTotal: number
  inspectorTotal: number
  welderTotal: number
  plumberTotal: number
  foremanTotal: number
  travelConfig: QuoteTravelConfig
  lodgingConfig: QuoteLodgingMealsConfig
  laborConfig: QuoteLaborConfig
  pricingConfig: QuotePricingConfig
  dealId: string
  dealTitle: string
  assignedTo: string
  approvalToken: string
  lastSavedAt: string | null
  technicalProvenance: any[]
  subtotal: number
  total: number
  totalCost: number
  finalPrice: number
  paymentTerms: string
  validityDays: number
  technicalNotes: string
  commercialNotes: string
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
  carRentalSubtotal: number
  hotelDays: number
  hotelRate: number
  mealsDays: number
  mealsRate: number
  mealVoucherHousedQty: number
  mealVoucherHousedRate: number
  mealVoucherUnhousedQty: number
  mealVoucherUnhousedRate: number
}

interface QuoteMaterialItemLocal {
  id: string
  description: string
  quantity: number
  unit_price: number
  subtotal: number
}

interface QuoteCustomMaterialLocal {
  id: string
  description: string
  qty?: number
  unitPrice?: number
  quantity?: number
  unit_cost?: number
  unitCost?: number
  subtotal?: number
}

interface QuoteChemicalProductLocal {
  id: string
  category: 'cleaning' | 'painting'
  description: string
  unit: 'L' | 'kg' | 'un' | 'gl' | 'lata'
  quantity: number
  unit_price: number
  subtotal: number
}

export function makeGetFormDataObject(p: MakeGetFormDataObjectDeps) {
  return (): Partial<QuoteRecord> => {
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

    const pricingConfig: QuotePricingConfig = {
      serviceMargin,
      salesCommission,
      adminRate,
      pisRate,
      cofinsRate,
      issRate,
      csllRate,
      irpjRate,
      irDiffRate,
    }

    const sanitizedEquipments: QuoteEquipmentItem[] = ((p as any).equipments || []).map(
      (eq: any, idx: number) => ({
        id: eq.id || `eq-${idx + 1}`,
        model: eq.model || undefined,
        brand: eq.brand || undefined,
        series: eq.series || undefined,
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
      }),
    )

    const primaryEq = sanitizedEquipments[0] || {
      id: 'eq-1',
      model: equipmentModel || '',
      brand: equipmentBrand || '',
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
      client_document: clientDocument || undefined,
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

      // Custos diretos - Deslocamento
      travel_cost: travelCost,
      travel_config: travelConfig,
      lodging_meals_cost: lodgingMealsCost,
      lodging_meals_config: lodgingConfig,
      materials_cost: materialsCost,
      third_party_cost: thirdPartyCost,
      other_costs: otherCosts,
      total_cost: totalCost,

      // Impostos e Margens
      service_margin: serviceMargin,
      sales_commission: salesCommission,
      admin_rate: adminRate,
      admin_cost: adminCost,
      pis_rate: pisRate,
      cofins_rate: cofinsRate,
      iss_rate: issRate,
      csll_rate: csllRate,
      irpj_rate: irpjRate,
      ir_diff_rate: irDiffRate,
      pricing_config: pricingConfig,

      // Preço e condições
      subtotal: subtotal,
      total: total,
      final_price: finalPrice,
      payment_terms: paymentTerms,
      validity_days: validityDays,
      technical_notes: technicalNotes,
      commercial_notes: commercialNotes,
      technical_provenance: technicalProvenance,
      last_saved_at: currentSavedTime,
      service_details: serviceDetails,
    }
  }
}
