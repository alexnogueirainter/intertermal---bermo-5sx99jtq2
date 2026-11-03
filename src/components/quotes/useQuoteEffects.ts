import { useEffect } from 'react'
import { quoteDealSyncService } from '@/services/quotes-deal-sync'
import {
  computeQuoteDiffs,
  extractQuoteSnapshot,
  quoteHistoryService,
  QuoteSnapshot,
} from '@/services/quote-history'
import {
  QuoteChemicalProductItem,
  QuoteCustomMaterial,
  QuoteEquipmentItem,
  QuoteMaterialItem,
  QuoteRecord,
} from '@/types/crm'
import type { Dispatch, MutableRefObject, SetStateAction } from 'react'

interface UseQuoteEffectsDeps {
  activeQuoteId: string | null
  adminRate: number
  assignedTo: string
  autoSaveTimerRef: MutableRefObject<any>
  carRentalDailyRate: number
  carRentalDays: number
  carRentalType: string
  chemicalProducts: QuoteChemicalProductItem[]
  clientId: string
  clientName: string
  cofinsRate: number
  commercialNotes: string
  connectionSize: string
  consumptionKmL: number
  csllRate: number
  customMaterials: QuoteCustomMaterial[]
  dealId: string
  dealTitle: string
  destinationAddress: string
  destinationCep: string
  dimensionsWHd: string
  distanceKm: number
  equipmentBrand: string
  equipmentModel: string
  equipmentQuantity: number
  equipments: QuoteEquipmentItem[]
  foremanCount: number
  foremanHours: number
  foremanRate: number
  fuelPrice: number
  gasketMaterial: string
  getFormDataObject: () => Partial<QuoteRecord>
  helperCount: number
  helperHours: number
  helperRate: number
  homologatedProcedure: string
  hotelDays: number
  hotelRate: number
  initialSnapshotRef: MutableRefObject<QuoteSnapshot | null>
  inspectorCount: number
  inspectorHours: number
  inspectorRate: number
  integrationCost: number
  integrationRequired: boolean
  integrationTiming: 'same_day' | 'early' | string
  integrationWeekday: string
  irDiffRate: number
  irpjRate: number
  isEditorOpen: boolean
  isInitialMount: MutableRefObject<boolean>
  isRoundTrip: boolean
  issRate: number
  loadQuoteHistory: (qId: string) => any
  loadQuoteIntoForm: (quote: QuoteRecord) => any
  loadedQuoteIdRef: MutableRefObject<string | null>
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
  onUpdateQuote: (id: string, data: Partial<QuoteRecord>) => Promise<void>
  originAddress: string
  originCep: string
  otherCosts: number
  paymentTerms: string
  pisRate: number
  plateCount: number | undefined
  plateMaterial: string
  plateThickness: number | undefined
  plumberCount: number
  plumberHours: number
  plumberRate: number
  pressureTestBar: number | undefined
  quoteTitle: string
  salesCommission: number
  scopeOfWork: string
  selectedQuote: QuoteRecord | null | undefined
  serviceMargin: number
  setIsEditorOpen: Dispatch<SetStateAction<boolean>>
  taxRate: number
  techCount: number
  techHours: number
  techRate: number
  technicalNotes: string
  thirdPartyCost: number
  tollRoadPercent: number
  validityDays: number
  welderCount: number
  welderHours: number
  welderRate: number
  workFluid: string
  workPermitRequired: boolean
  workingPressureBar: number | undefined
}

export function useQuoteEffects(p: UseQuoteEffectsDeps) {
  const {
    activeQuoteId,
    adminRate,
    assignedTo,
    autoSaveTimerRef,
    carRentalDailyRate,
    carRentalDays,
    carRentalType,
    chemicalProducts,
    clientId,
    clientName,
    cofinsRate,
    commercialNotes,
    connectionSize,
    consumptionKmL,
    csllRate,
    customMaterials,
    dealId,
    dealTitle,
    destinationAddress,
    destinationCep,
    dimensionsWHd,
    distanceKm,
    equipmentBrand,
    equipmentModel,
    equipmentQuantity,
    equipments,
    foremanCount,
    foremanHours,
    foremanRate,
    fuelPrice,
    gasketMaterial,
    getFormDataObject,
    helperCount,
    helperHours,
    helperRate,
    homologatedProcedure,
    hotelDays,
    hotelRate,
    initialSnapshotRef,
    inspectorCount,
    inspectorHours,
    inspectorRate,
    integrationCost,
    integrationRequired,
    integrationTiming,
    integrationWeekday,
    irDiffRate,
    irpjRate,
    isEditorOpen,
    isInitialMount,
    isRoundTrip,
    issRate,
    loadQuoteHistory,
    loadQuoteIntoForm,
    loadedQuoteIdRef,
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
    onUpdateQuote,
    originAddress,
    originCep,
    otherCosts,
    paymentTerms,
    pisRate,
    plateCount,
    plateMaterial,
    plateThickness,
    plumberCount,
    plumberHours,
    plumberRate,
    pressureTestBar,
    quoteTitle,
    salesCommission,
    scopeOfWork,
    selectedQuote,
    serviceMargin,
    setIsEditorOpen,
    taxRate,
    techCount,
    techHours,
    techRate,
    technicalNotes,
    thirdPartyCost,
    tollRoadPercent,
    validityDays,
    welderCount,
    welderHours,
    welderRate,
    workFluid,
    workPermitRequired,
    workingPressureBar,
  } = p

  useEffect(() => {
    if (selectedQuote && selectedQuote.id !== loadedQuoteIdRef.current) {
      // Se já estamos editando ativamente a proposta com o mesmo ID, não recarrega os campos locais
      if (isEditorOpen && activeQuoteId === selectedQuote.id) {
        loadedQuoteIdRef.current = selectedQuote.id
        return
      }
      loadedQuoteIdRef.current = selectedQuote.id
      loadQuoteIntoForm(selectedQuote)
      setIsEditorOpen(true)
    }
  }, [selectedQuote, isEditorOpen, activeQuoteId])

  // AUTO-SAVE DE 2 SEGUNDOS: apenas se o modal estiver aberto e activeQuoteId existir

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false
      return
    }

    if (!isEditorOpen || !activeQuoteId) return

    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current)
    }

    autoSaveTimerRef.current = setTimeout(async () => {
      try {
        const payload = getFormDataObject()
        await onUpdateQuote(activeQuoteId, payload)

        // Sincronização em segundo plano com CRM (Deals + Service Orders) sem bloquear digitação.
        // REGRA: carrega o mesmo sinal do Salvar explícito — se o STATUS mudou de verdade,
        // o auto-save também move o card (3 momentos); senão, preserva a etapa atual.
        // Sem isso, o auto-save corria com o sync do Salvar (lock inFlightSync) e gravava "não mover".
        const quoteToSync = {
          ...payload,
          id: activeQuoteId,
          _statusChanged: (initialSnapshotRef.current?.status ?? payload.status) !== payload.status,
        } as QuoteRecord
        quoteDealSyncService.syncQuoteToCrm(quoteToSync).catch((err) => {
          console.warn('Auto-save syncQuoteToCrm falhou em segundo plano:', err)
        })

        // Diff engine e gravação no histórico aditivo
        if (initialSnapshotRef.current) {
          const currentSnapshot = extractQuoteSnapshot(payload)
          const diffs = computeQuoteDiffs(initialSnapshotRef.current, currentSnapshot)
          if (diffs.length > 0) {
            initialSnapshotRef.current = currentSnapshot
            quoteHistoryService
              .recordDiffs(activeQuoteId, diffs, assignedTo || 'Usuário do Sistema')
              .then(() => loadQuoteHistory(activeQuoteId))
              .catch((err) => console.warn('Erro ao gravar diff no auto-save:', err))
          }
        }
      } catch (err) {
        console.warn('Auto-save de 2s falhou silenciosamente:', err)
      }
    }, 2000)

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current)
      }
    }
  }, [
    isEditorOpen,
    activeQuoteId,
    clientId,
    clientName,
    quoteTitle,
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
    equipments,
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
    dealId,
    dealTitle,
    assignedTo,
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
    taxRate,
    paymentTerms,
    validityDays,
    technicalNotes,
    commercialNotes,
    dimensionsWHd,
    workFluid,
    homologatedProcedure,
    integrationRequired,
    integrationTiming,
    integrationWeekday,
    integrationCost,
    workPermitRequired,
    materialsItems,
    customMaterials,
    chemicalProducts,
    pisRate,
    cofinsRate,
    issRate,
    csllRate,
    irpjRate,
    irDiffRate,
  ])

  // Recalcular Rota Mapeia / CEP
}
