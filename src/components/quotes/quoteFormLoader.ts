import { QuoteSnapshot } from '@/services/quote-history'
import {
  QuoteChemicalProductItem,
  QuoteCustomMaterial,
  QuoteEquipmentItem,
  QuoteMaterialItem,
  QuoteRecord,
  QuoteStatus,
} from '@/types/crm'
import type { Dispatch, MutableRefObject, SetStateAction } from 'react'

interface MakeLoadQuoteIntoFormDeps {
  adminRate: number
  cofinsRate: number
  connectionSize: string
  consumptionKmL: number
  csllRate: number
  destinationAddress: string
  destinationCep: string
  distanceKm: number
  equipments: QuoteEquipmentItem[]
  foremanCount: number
  foremanHours: number
  foremanRate: number
  fuelPrice: number
  gasketMaterial: string
  helperCount: number
  helperHours: number
  helperRate: number
  hotelDays: number
  hotelRate: number
  initialSnapshotRef: MutableRefObject<QuoteSnapshot | null>
  inspectorCount: number
  inspectorHours: number
  inspectorRate: number
  irDiffRate: number
  irpjRate: number
  isRoundTrip: boolean
  issRate: number
  loadQuoteHistory: (qId: string) => any
  manualFuelAdj: number
  manualTollAdj: number
  mealVoucherHousedQty: number
  mealVoucherHousedRate: number
  mealVoucherUnhousedQty: number
  mealVoucherUnhousedRate: number
  mealsDays: number
  mealsRate: number
  originAddress: string
  originCep: string
  pisRate: number
  plateCount: number | undefined
  plateMaterial: string
  plateThickness: number | undefined
  plumberCount: number
  plumberHours: number
  plumberRate: number
  pressureTestBar: number | undefined
  setActiveQuoteId: Dispatch<SetStateAction<string | null>>
  setAdminRate: Dispatch<SetStateAction<number>>
  setApprovalToken: Dispatch<SetStateAction<string>>
  setAssignedTo: Dispatch<SetStateAction<string>>
  setCarRentalDailyRate: Dispatch<SetStateAction<number>>
  setCarRentalDays: Dispatch<SetStateAction<number>>
  setCarRentalType: Dispatch<SetStateAction<string>>
  setChemicalProducts: Dispatch<SetStateAction<QuoteChemicalProductItem[]>>
  setClientId: Dispatch<SetStateAction<string>>
  setClientName: Dispatch<SetStateAction<string>>
  setCofinsRate: Dispatch<SetStateAction<number>>
  setCommercialNotes: Dispatch<SetStateAction<string>>
  setConnectionSize: Dispatch<SetStateAction<string>>
  setConsumptionKmL: Dispatch<SetStateAction<number>>
  setCsllRate: Dispatch<SetStateAction<number>>
  setCustomMaterials: Dispatch<SetStateAction<QuoteCustomMaterial[]>>
  setDealId: Dispatch<SetStateAction<string>>
  setDealTitle: Dispatch<SetStateAction<string>>
  setDestinationAddress: Dispatch<SetStateAction<string>>
  setDestinationCep: Dispatch<SetStateAction<string>>
  setDimensionsWHd: Dispatch<SetStateAction<string>>
  setDistanceKm: Dispatch<SetStateAction<number>>
  setEquipmentBrand: Dispatch<SetStateAction<string>>
  setEquipmentModel: Dispatch<SetStateAction<string>>
  setEquipmentQuantity: Dispatch<SetStateAction<number>>
  setEquipments: Dispatch<SetStateAction<QuoteEquipmentItem[]>>
  setForemanCount: Dispatch<SetStateAction<number>>
  setForemanHours: Dispatch<SetStateAction<number>>
  setForemanRate: Dispatch<SetStateAction<number>>
  setFuelPrice: Dispatch<SetStateAction<number>>
  setGasketMaterial: Dispatch<SetStateAction<string>>
  setHelperCount: Dispatch<SetStateAction<number>>
  setHelperHours: Dispatch<SetStateAction<number>>
  setHelperRate: Dispatch<SetStateAction<number>>
  setHomologatedProcedure: Dispatch<SetStateAction<string>>
  setHotelDays: Dispatch<SetStateAction<number>>
  setHotelRate: Dispatch<SetStateAction<number>>
  setInspectorCount: Dispatch<SetStateAction<number>>
  setInspectorHours: Dispatch<SetStateAction<number>>
  setInspectorRate: Dispatch<SetStateAction<number>>
  setIntegrationCost: Dispatch<SetStateAction<number>>
  setIntegrationRequired: Dispatch<SetStateAction<boolean>>
  setIntegrationTiming: Dispatch<SetStateAction<'same_day' | 'early' | string>>
  setIntegrationWeekday: Dispatch<SetStateAction<string>>
  setIrDiffRate: Dispatch<SetStateAction<number>>
  setIrpjRate: Dispatch<SetStateAction<number>>
  setIsRoundTrip: Dispatch<SetStateAction<boolean>>
  setIssRate: Dispatch<SetStateAction<number>>
  setLastSavedAt: Dispatch<SetStateAction<string | null>>
  setManualFuelAdj: Dispatch<SetStateAction<number>>
  setManualTollAdj: Dispatch<SetStateAction<number>>
  setMaterialsCost: Dispatch<SetStateAction<number>>
  setMaterialsItems: Dispatch<SetStateAction<QuoteMaterialItem[]>>
  setMealVoucherHousedQty: Dispatch<SetStateAction<number>>
  setMealVoucherHousedRate: Dispatch<SetStateAction<number>>
  setMealVoucherUnhousedQty: Dispatch<SetStateAction<number>>
  setMealVoucherUnhousedRate: Dispatch<SetStateAction<number>>
  setMealsDays: Dispatch<SetStateAction<number>>
  setMealsRate: Dispatch<SetStateAction<number>>
  setNewPartDescription: Dispatch<SetStateAction<string>>
  setNewPartQty: Dispatch<SetStateAction<number>>
  setNewPartUnitPrice: Dispatch<SetStateAction<number>>
  setOriginAddress: Dispatch<SetStateAction<string>>
  setOriginCep: Dispatch<SetStateAction<string>>
  setOtherCosts: Dispatch<SetStateAction<number>>
  setPaymentTerms: Dispatch<SetStateAction<string>>
  setPisRate: Dispatch<SetStateAction<number>>
  setPlateCount: Dispatch<SetStateAction<number | undefined>>
  setPlateMaterial: Dispatch<SetStateAction<string>>
  setPlateThickness: Dispatch<SetStateAction<number | undefined>>
  setPlumberCount: Dispatch<SetStateAction<number>>
  setPlumberHours: Dispatch<SetStateAction<number>>
  setPlumberRate: Dispatch<SetStateAction<number>>
  setPressureTestBar: Dispatch<SetStateAction<number | undefined>>
  setQuoteNumber: Dispatch<SetStateAction<string>>
  setQuoteTitle: Dispatch<SetStateAction<string>>
  setSalesCommission: Dispatch<SetStateAction<number>>
  setScopeOfWork: Dispatch<SetStateAction<string>>
  setServiceMargin: Dispatch<SetStateAction<number>>
  setStatus: Dispatch<SetStateAction<QuoteStatus>>
  setTaxRate: Dispatch<SetStateAction<number>>
  setTechCount: Dispatch<SetStateAction<number>>
  setTechHours: Dispatch<SetStateAction<number>>
  setTechRate: Dispatch<SetStateAction<number>>
  setTechnicalNotes: Dispatch<SetStateAction<string>>
  setTechnicalProvenance: Dispatch<SetStateAction<any[]>>
  setThirdPartyCost: Dispatch<SetStateAction<number>>
  setTollRoadPercent: Dispatch<SetStateAction<number>>
  setValidityDays: Dispatch<SetStateAction<number>>
  setWelderCount: Dispatch<SetStateAction<number>>
  setWelderHours: Dispatch<SetStateAction<number>>
  setWelderRate: Dispatch<SetStateAction<number>>
  setWorkFluid: Dispatch<SetStateAction<string>>
  setWorkPermitRequired: Dispatch<SetStateAction<boolean>>
  setWorkingPressureBar: Dispatch<SetStateAction<number | undefined>>
  status: QuoteStatus
  techCount: number
  techHours: number
  techRate: number
  tollRoadPercent: number
  welderCount: number
  welderHours: number
  welderRate: number
  workingPressureBar: number | undefined
}

export function makeLoadQuoteIntoForm(p: MakeLoadQuoteIntoFormDeps) {
  const {
    adminRate,
    cofinsRate,
    connectionSize,
    consumptionKmL,
    csllRate,
    destinationAddress,
    destinationCep,
    distanceKm,
    equipments,
    foremanCount,
    foremanHours,
    foremanRate,
    fuelPrice,
    gasketMaterial,
    helperCount,
    helperHours,
    helperRate,
    hotelDays,
    hotelRate,
    initialSnapshotRef,
    inspectorCount,
    inspectorHours,
    inspectorRate,
    irDiffRate,
    irpjRate,
    isRoundTrip,
    issRate,
    loadQuoteHistory,
    manualFuelAdj,
    manualTollAdj,
    mealVoucherHousedQty,
    mealVoucherHousedRate,
    mealVoucherUnhousedQty,
    mealVoucherUnhousedRate,
    mealsDays,
    mealsRate,
    originAddress,
    originCep,
    pisRate,
    plateCount,
    plateMaterial,
    plateThickness,
    plumberCount,
    plumberHours,
    plumberRate,
    pressureTestBar,
    setActiveQuoteId,
    setAdminRate,
    setApprovalToken,
    setAssignedTo,
    setCarRentalDailyRate,
    setCarRentalDays,
    setCarRentalType,
    setChemicalProducts,
    setClientId,
    setClientName,
    setCofinsRate,
    setCommercialNotes,
    setConnectionSize,
    setConsumptionKmL,
    setCsllRate,
    setCustomMaterials,
    setDealId,
    setDealTitle,
    setDestinationAddress,
    setDestinationCep,
    setDimensionsWHd,
    setDistanceKm,
    setEquipmentBrand,
    setEquipmentModel,
    setEquipmentQuantity,
    setEquipments,
    setForemanCount,
    setForemanHours,
    setForemanRate,
    setFuelPrice,
    setGasketMaterial,
    setHelperCount,
    setHelperHours,
    setHelperRate,
    setHomologatedProcedure,
    setHotelDays,
    setHotelRate,
    setInspectorCount,
    setInspectorHours,
    setInspectorRate,
    setIntegrationCost,
    setIntegrationRequired,
    setIntegrationTiming,
    setIntegrationWeekday,
    setIrDiffRate,
    setIrpjRate,
    setIsRoundTrip,
    setIssRate,
    setLastSavedAt,
    setManualFuelAdj,
    setManualTollAdj,
    setMaterialsCost,
    setMaterialsItems,
    setMealVoucherHousedQty,
    setMealVoucherHousedRate,
    setMealVoucherUnhousedQty,
    setMealVoucherUnhousedRate,
    setMealsDays,
    setMealsRate,
    setNewPartDescription,
    setNewPartQty,
    setNewPartUnitPrice,
    setOriginAddress,
    setOriginCep,
    setOtherCosts,
    setPaymentTerms,
    setPisRate,
    setPlateCount,
    setPlateMaterial,
    setPlateThickness,
    setPlumberCount,
    setPlumberHours,
    setPlumberRate,
    setPressureTestBar,
    setQuoteNumber,
    setQuoteTitle,
    setSalesCommission,
    setScopeOfWork,
    setServiceMargin,
    setStatus,
    setTaxRate,
    setTechCount,
    setTechHours,
    setTechRate,
    setTechnicalNotes,
    setTechnicalProvenance,
    setThirdPartyCost,
    setTollRoadPercent,
    setValidityDays,
    setWelderCount,
    setWelderHours,
    setWelderRate,
    setWorkFluid,
    setWorkPermitRequired,
    setWorkingPressureBar,
    status,
    techCount,
    techHours,
    techRate,
    tollRoadPercent,
    welderCount,
    welderHours,
    welderRate,
    workingPressureBar,
  } = p

  const loadQuoteIntoForm = (quote: QuoteRecord) => {
    setActiveQuoteId(quote.id)
    loadQuoteHistory(quote.id)
    initialSnapshotRef.current = extractQuoteSnapshot(quote)
    setClientId(quote.client_id || '')
    setClientName(quote.client_name || '')
    setDealId(quote.deal_id || '')
    setDealTitle(quote.deal_title || '')
    setAssignedTo(quote.assigned_to || 'Alex Nogueira')
    setApprovalToken(quote.approval_token || '')
    setQuoteTitle(quote.title || '')
    setQuoteNumber(quote.quote_number || '')
    setStatus(quote.status || 'draft')
    setEquipmentModel(quote.equipment_model || '')
    setEquipmentBrand(quote.equipment_brand || '')
    setEquipmentQuantity(quote.equipment_quantity || 1)
    setPlateCount(quote.plate_count ?? undefined)
    setPlateMaterial(quote.plate_material || '')
    setPlateThickness(quote.plate_thickness ?? undefined)
    setGasketMaterial(quote.gasket_material || '')
    setConnectionSize(quote.connection_size || '')
    setPressureTestBar(quote.pressure_test_bar ?? undefined)
    setWorkingPressureBar(quote.working_pressure_bar ?? undefined)

    if (quote.equipments && Array.isArray(quote.equipments) && quote.equipments.length > 0) {
      const restored = quote.equipments.map((eq: any, idx: number) => ({
        id: eq.id || `eq-${quote.id || 'item'}-${idx + 1}`,
        model: eq.model != null ? String(eq.model) : '',
        brand: eq.brand != null && String(eq.brand).trim() ? String(eq.brand) : 'BERMO',
        series: eq.series || '',
        quantity: Math.max(1, Number(eq.quantity) || 1),
        tag: eq.tag || '',
        serial_number: eq.serial_number || '',
        plate_count:
          eq.plate_count != null && !isNaN(Number(eq.plate_count))
            ? Number(eq.plate_count)
            : eq.plateCount != null && !isNaN(Number(eq.plateCount))
              ? Number(eq.plateCount)
              : undefined,
        plate_material: eq.plate_material || eq.plateMaterial || '',
        plate_thickness:
          eq.plate_thickness != null && !isNaN(Number(eq.plate_thickness))
            ? Number(eq.plate_thickness)
            : eq.plateThickness != null && !isNaN(Number(eq.plateThickness))
              ? Number(eq.plateThickness)
              : undefined,
        gasket_material: eq.gasket_material || eq.gasketMaterial || '',
        connection_size: eq.connection_size || eq.connectionSize || '',
        connection_type: eq.connection_type || eq.connectionType || '',
        pressure_test_bar:
          eq.pressure_test_bar != null && !isNaN(Number(eq.pressure_test_bar))
            ? Number(eq.pressure_test_bar)
            : eq.pressureTestBar != null && !isNaN(Number(eq.pressureTestBar))
              ? Number(eq.pressureTestBar)
              : undefined,
        working_pressure_bar:
          eq.working_pressure_bar != null && !isNaN(Number(eq.working_pressure_bar))
            ? Number(eq.working_pressure_bar)
            : eq.workingPressureBar != null && !isNaN(Number(eq.workingPressureBar))
              ? Number(eq.workingPressureBar)
              : undefined,
        dimensions: eq.dimensions || eq.dimensions_w_h_d || '',
        dimensions_w_h_d: eq.dimensions_w_h_d || eq.dimensions || '',
        weight_kg:
          eq.weight_kg != null && !isNaN(Number(eq.weight_kg))
            ? Number(eq.weight_kg)
            : eq.weightKg != null && !isNaN(Number(eq.weightKg))
              ? Number(eq.weightKg)
              : undefined,
        weightKg:
          eq.weightKg != null && !isNaN(Number(eq.weightKg))
            ? Number(eq.weightKg)
            : eq.weight_kg != null && !isNaN(Number(eq.weight_kg))
              ? Number(eq.weight_kg)
              : undefined,
      }))
      setEquipments(restored)
      if (restored[0]) {
        setEquipmentModel(restored[0].model || '')
        setEquipmentBrand(restored[0].brand || 'BERMO')
        setEquipmentQuantity(restored[0].quantity || 1)
        setPlateCount(restored[0].plate_count)
        setPlateMaterial(restored[0].plate_material || '')
        setPlateThickness(restored[0].plate_thickness)
        setGasketMaterial(restored[0].gasket_material || '')
        setConnectionSize(restored[0].connection_size || '')
        setPressureTestBar(restored[0].pressure_test_bar)
        setWorkingPressureBar(restored[0].working_pressure_bar)
      }
    } else {
      setEquipments([
        {
          id: `eq-${quote.id || 'item'}-1`,
          model: quote.equipment_model || '',
          brand: quote.equipment_brand || '',
          quantity: quote.equipment_quantity || 1,
          tag: '',
          serial_number: '',
          plate_count: quote.plate_count ?? undefined,
          plate_material: quote.plate_material || '',
          plate_thickness: quote.plate_thickness ?? undefined,
          gasket_material: quote.gasket_material || '',
          connection_size: quote.connection_size || '',
          pressure_test_bar: quote.pressure_test_bar ?? undefined,
          working_pressure_bar: quote.working_pressure_bar ?? undefined,
        },
      ])
    }

    setDimensionsWHd(quote.dimensions_w_h_d || '')
    setWorkFluid(quote.work_fluid || '')
    setHomologatedProcedure(quote.homologated_procedure || '')
    setLastSavedAt(quote.last_saved_at || quote.updated || null)
    setTechnicalProvenance(
      Array.isArray(quote.technical_provenance) ? quote.technical_provenance : [],
    )

    setIntegrationRequired(quote.integration_needed ?? (quote as any).integration_required ?? false)
    setIntegrationTiming(quote.integration_timing || quote.integration_when || 'same_day')
    setIntegrationWeekday(
      quote.integration_day || (quote as any).integration_weekday || 'Segunda-feira',
    )
    setIntegrationCost(resolveIntegrationCost(quote))
    setWorkPermitRequired(quote.work_permit_needed ?? (quote as any).work_permit_required ?? false)

    if (quote.materials_items && Array.isArray(quote.materials_items)) {
      setMaterialsItems(quote.materials_items)
    } else {
      setMaterialsItems([])
    }
    setNewPartDescription('')
    setNewPartQty(1)
    setNewPartUnitPrice(0)

    if (quote.custom_materials && Array.isArray(quote.custom_materials)) {
      setCustomMaterials(quote.custom_materials)
    } else {
      setCustomMaterials([])
    }

    const loadedChemicals =
      quote.chemical_products && Array.isArray(quote.chemical_products)
        ? quote.chemical_products
        : []
    setChemicalProducts(loadedChemicals)

    setScopeOfWork(quote.scope_of_work || '')

    setTechCount(quote.tech_count ?? quote.labor_config?.techCount ?? 2)
    setTechHours(quote.tech_hours ?? quote.labor_config?.techHours ?? 16)
    setTechRate(quote.tech_rate ?? quote.labor_config?.techRate ?? 85)
    setHelperCount(quote.helper_count ?? quote.labor_config?.helperCount ?? 1)
    setHelperHours(quote.helper_hours ?? quote.labor_config?.helperHours ?? 16)
    setHelperRate(quote.helper_rate ?? quote.labor_config?.helperRate ?? 55)
    setInspectorCount(quote.inspector_count ?? quote.labor_config?.inspectorCount ?? 0)
    setInspectorHours(quote.inspector_hours ?? quote.labor_config?.inspectorHours ?? 0)
    setInspectorRate(quote.inspector_rate ?? quote.labor_config?.inspectorRate ?? 120)
    setWelderCount(quote.welder_count ?? quote.labor_config?.welderCount ?? 0)
    setWelderHours(quote.welder_hours ?? quote.labor_config?.welderHours ?? 0)
    setWelderRate(quote.welder_rate ?? quote.labor_config?.welderRate ?? 160)
    setPlumberCount(quote.plumber_count ?? quote.labor_config?.plumberCount ?? 0)
    setPlumberHours(quote.plumber_hours ?? quote.labor_config?.plumberHours ?? 0)
    setPlumberRate(quote.plumber_rate ?? quote.labor_config?.plumberRate ?? 120)
    setForemanCount(quote.foreman_count ?? quote.labor_config?.foremanCount ?? 0)
    setForemanHours(quote.foreman_hours ?? quote.labor_config?.foremanHours ?? 0)
    setForemanRate(quote.foreman_rate ?? quote.labor_config?.foremanRate ?? 180)

    // Deslocamento & Rotas
    setOriginCep(quote.origin_cep || quote.travel_config?.originCep || '89066-000')
    setOriginAddress(
      quote.origin_address ||
        quote.travel_config?.originAddress ||
        'Rua Bernardo Reiter, 500 - Blumenau/SC',
    )
    setDestinationCep(quote.destination_cep || quote.travel_config?.destinationCep || '')
    setDestinationAddress(
      quote.destination_address || quote.travel_config?.destinationAddress || '',
    )
    setDistanceKm(quote.distance_km ?? quote.travel_config?.distanceKm ?? 120)
    setIsRoundTrip(quote.is_round_trip ?? quote.travel_config?.isRoundTrip ?? true)
    setConsumptionKmL(quote.consumption_km_l ?? quote.travel_config?.consumptionKmL ?? 9.5)
    setFuelPrice(quote.fuel_price ?? quote.travel_config?.fuelPrice ?? 5.89)
    setTollRoadPercent(quote.toll_road_percent ?? quote.travel_config?.tollRoadPercent ?? 60)
    setManualFuelAdj(quote.manual_fuel_adj ?? quote.travel_config?.manualFuelAdj ?? 0)
    setManualTollAdj(quote.manual_toll_adj ?? quote.travel_config?.manualTollAdj ?? 0)

    setCarRentalType(quote.car_rental_type || quote.travel_config?.car_rental_type || 'none')
    setCarRentalDailyRate(
      quote.car_rental_daily_rate ?? quote.travel_config?.car_rental_daily_rate ?? 230,
    )
    setCarRentalDays(quote.car_rental_days ?? quote.travel_config?.car_rental_days ?? 1)

    // Hospedagem & Alimentação
    setHotelDays(quote.hotel_days ?? quote.lodging_meals_config?.hotelDays ?? 0)
    setHotelRate(quote.hotel_rate ?? quote.lodging_meals_config?.hotelRate ?? 220)
    setMealsDays(quote.meals_days ?? quote.lodging_meals_config?.mealsDays ?? 0)
    setMealsRate(quote.meals_rate ?? quote.lodging_meals_config?.mealsRate ?? 95)
    setMealVoucherHousedQty(
      quote.meal_voucher_housed_qty ?? quote.lodging_meals_config?.mealVoucherHousedQty ?? 0,
    )
    setMealVoucherHousedRate(
      quote.meal_voucher_housed_rate ?? quote.lodging_meals_config?.mealVoucherHousedRate ?? 45,
    )
    setMealVoucherUnhousedQty(
      quote.meal_voucher_unhoused_qty ?? quote.lodging_meals_config?.mealVoucherUnhousedQty ?? 0,
    )
    setMealVoucherUnhousedRate(
      quote.meal_voucher_unhoused_rate ?? quote.lodging_meals_config?.mealVoucherUnhousedRate ?? 40,
    )

    // Campo digitado puro de materiais (peças e químicos somam à parte no repasse)
    const rawMaterialsCost = quote.materials_cost ?? 0
    setMaterialsCost(Math.max(0, Number(rawMaterialsCost) || 0))
    setThirdPartyCost(quote.third_party_cost ?? 0)
    setOtherCosts(quote.other_costs ?? 0)
    setServiceMargin(Math.round(quote.service_margin ?? 25))
    setSalesCommission(Math.round(quote.sales_commission ?? 6))
    setAdminRate(
      Math.round(
        quote.admin_rate ??
          quote.pricing_config?.adminRate ??
          quote.service_details?.indirect_costs?.adminRate ??
          3,
      ),
    )
    // Se a proposta já tiver total_taxes salvo ou alíquotas individuais somadas, preserva; padrão 14.83%
    const existingTaxSum =
      (quote.pis_rate ?? quote.pricing_config?.pisRate ?? 0) +
      (quote.cofins_rate ?? quote.pricing_config?.cofinsRate ?? 0) +
      (quote.iss_rate ?? quote.pricing_config?.issRate ?? 0) +
      (quote.csll_rate ?? quote.pricing_config?.csllRate ?? 0) +
      (quote.irpj_rate ?? quote.pricing_config?.irpjRate ?? 0) +
      (quote.ir_diff_rate ?? quote.pricing_config?.irDiffRate ?? 0)
    const initialTaxRate =
      (quote as any).tax_rate ??
      (quote as any).taxes_rate ??
      (quote.service_details?.indirect_costs?.taxes?.totalTaxes != null
        ? Number(quote.service_details.indirect_costs.taxes.totalTaxes)
        : existingTaxSum > 0
          ? Number(existingTaxSum.toFixed(2))
          : 14.83)
    setTaxRate(initialTaxRate)
    setPisRate(quote.pis_rate ?? quote.pricing_config?.pisRate ?? 0.65)
    setCofinsRate(quote.cofins_rate ?? quote.pricing_config?.cofinsRate ?? 3.0)
    setIssRate(quote.iss_rate ?? quote.pricing_config?.issRate ?? 5.0)
    setCsllRate(quote.csll_rate ?? quote.pricing_config?.csllRate ?? 2.88)
    setIrpjRate(quote.irpj_rate ?? quote.pricing_config?.irpjRate ?? 4.8)
    setIrDiffRate(quote.ir_diff_rate ?? quote.pricing_config?.irDiffRate ?? 5.0)
    setPaymentTerms(quote.payment_terms || '28 DDL faturado após entrega técnica')
    setValidityDays(quote.validity_days || 15)
    setTechnicalNotes(quote.technical_notes || '')
    setCommercialNotes(quote.commercial_notes || '')
  }

  // Salvar novo cliente manualmente a partir da Seção 3A

  return {
    loadQuoteIntoForm,
  }
}
