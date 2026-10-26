import { EquipmentSpecsExtractionResponse, EquipmentWebSearchResultItem } from '@/services/quotes'
import { QuoteHistoryItem, QuoteSnapshot } from '@/services/quote-history'
import { EquipmentWebSearchResultItem } from '@/services/quotes'
import {
  QuoteChemicalProductItem,
  QuoteCustomMaterial,
  QuoteEquipmentItem,
  QuoteMaterialItem,
  QuoteStatus,
} from '@/types/crm'
import type { Dispatch, MutableRefObject, SetStateAction } from 'react'

interface MakeResetFormDeps {
  initialSnapshotRef: MutableRefObject<QuoteSnapshot | null>
  loadedQuoteIdRef: MutableRefObject<string | null>
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
  setNewChemicalCategory: Dispatch<SetStateAction<'cleaning' | 'painting'>>
  setNewChemicalDescription: Dispatch<SetStateAction<string>>
  setNewChemicalQty: Dispatch<SetStateAction<number>>
  setNewChemicalUnit: Dispatch<SetStateAction<'L' | 'kg' | 'un' | 'gl' | 'lata'>>
  setNewChemicalUnitPrice: Dispatch<SetStateAction<number>>
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
  setQuoteHistoryList: Dispatch<SetStateAction<QuoteHistoryItem[]>>
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
  setWebSearchExtractionByResult: Dispatch<
    SetStateAction<Record<string, EquipmentSpecsExtractionResponse>>
  >
  setWebSearchMessage: Dispatch<SetStateAction<string>>
  setWebSearchResults: Dispatch<SetStateAction<EquipmentWebSearchResultItem[]>>
  setWebSearchSelectedFields: Dispatch<SetStateAction<Record<string, Record<string, boolean>>>>
  setWelderCount: Dispatch<SetStateAction<number>>
  setWelderHours: Dispatch<SetStateAction<number>>
  setWelderRate: Dispatch<SetStateAction<number>>
  setWorkFluid: Dispatch<SetStateAction<string>>
  setWorkPermitRequired: Dispatch<SetStateAction<boolean>>
  setWorkingPressureBar: Dispatch<SetStateAction<number | undefined>>
}

export function makeResetForm(p: MakeResetFormDeps) {
  const {
    initialSnapshotRef,
    loadedQuoteIdRef,
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
    setNewChemicalCategory,
    setNewChemicalDescription,
    setNewChemicalQty,
    setNewChemicalUnit,
    setNewChemicalUnitPrice,
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
    setQuoteHistoryList,
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
    setWebSearchExtractionByResult,
    setWebSearchMessage,
    setWebSearchResults,
    setWebSearchSelectedFields,
    setWelderCount,
    setWelderHours,
    setWelderRate,
    setWorkFluid,
    setWorkPermitRequired,
    setWorkingPressureBar,
  } = p

  const resetForm = () => {
    setActiveQuoteId(null)
    loadedQuoteIdRef.current = null
    initialSnapshotRef.current = null
    setQuoteHistoryList([])
    setClientId('')
    setClientName('')
    setDealId('')
    setDealTitle('')
    setAssignedTo('Alex Nogueira')
    setApprovalToken('')
    setQuoteTitle('')
    setQuoteNumber(`INT-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`)
    setStatus('draft')
    setEquipmentModel('')
    setEquipmentBrand('')
    setEquipmentQuantity(0)
    setPlateCount(undefined)
    setPlateMaterial('')
    setPlateThickness(undefined)
    setGasketMaterial('')
    setConnectionSize('')
    setPressureTestBar(undefined)
    setWorkingPressureBar(undefined)
    setDimensionsWHd('')
    setWorkFluid('')
    setHomologatedProcedure('')
    setLastSavedAt(null)
    setTechnicalProvenance([])
    setWebSearchExtractionByResult({})
    setWebSearchSelectedFields({})
    setWebSearchResults([])
    setWebSearchMessage('')
    setIntegrationRequired(false)
    setIntegrationTiming('same_day')
    setIntegrationWeekday('Segunda-feira')
    setIntegrationCost(532.0)
    setWorkPermitRequired(false)
    setMaterialsItems([])
    setNewPartDescription('')
    setNewPartQty(1)
    setNewPartUnitPrice(0)
    setCustomMaterials([])
    setChemicalProducts([])
    setNewChemicalCategory('cleaning')
    setNewChemicalDescription('')
    setNewChemicalUnit('L')
    setNewChemicalQty(1)
    setNewChemicalUnitPrice(0)
    setEquipments([
      {
        id: `eq-${Date.now()}-1`,
        model: '',
        brand: '',
        quantity: 0,
        tag: '',
        serial_number: '',
        plate_count: undefined,
        plate_material: '',
        plate_thickness: undefined,
        gasket_material: '',
        connection_size: '',
        pressure_test_bar: undefined,
        working_pressure_bar: undefined,
      },
    ])
    setScopeOfWork('')
    setTechCount(0)
    setTechHours(0)
    setTechRate(0)
    setHelperCount(0)
    setHelperHours(0)
    setHelperRate(0)
    setInspectorCount(0)
    setInspectorHours(0)
    setInspectorRate(0)
    setWelderCount(0)
    setWelderHours(0)
    setWelderRate(0)
    setPlumberCount(0)
    setPlumberHours(0)
    setPlumberRate(0)
    setForemanCount(0)
    setForemanHours(0)
    setForemanRate(0)

    setOriginCep('')
    setOriginAddress('')
    setDestinationCep('')
    setDestinationAddress('')
    setDistanceKm(0)
    setIsRoundTrip(false)
    setConsumptionKmL(0)
    setFuelPrice(0)
    setTollRoadPercent(0)
    setManualFuelAdj(0)
    setManualTollAdj(0)
    setCarRentalType('none')
    setCarRentalDailyRate(0)
    setCarRentalDays(0)

    setHotelDays(0)
    setHotelRate(0)
    setMealsDays(0)
    setMealsRate(0)
    setMealVoucherHousedQty(0)
    setMealVoucherHousedRate(0)
    setMealVoucherUnhousedQty(0)
    setMealVoucherUnhousedRate(0)

    setMaterialsCost(0)
    setThirdPartyCost(0)
    setOtherCosts(0)
    setServiceMargin(0)
    setSalesCommission(0)
    setAdminRate(0)
    setPisRate(0.65)
    setCofinsRate(3.0)
    setIssRate(5.0)
    setCsllRate(2.88)
    setIrpjRate(4.8)
    setIrDiffRate(5.0)
    setTaxRate(21.33)
    setPaymentTerms('')
    setValidityDays(0)
    setTechnicalNotes('')
    setCommercialNotes('')
  }
  // Adicionar equipamento dinâmico

  return {
    resetForm,
  }
}
