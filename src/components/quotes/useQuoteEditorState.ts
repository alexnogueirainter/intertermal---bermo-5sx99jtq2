import { useRef, useState } from 'react'
import type { EquipmentSpecsExtractionResponse } from '@/services/quotes'
import { getStandardServiceMethodology } from '@/data/bermo-catalog'
import { EquipmentCatalogItem } from '@/services/equipment-catalog'
import { QuoteHistoryItem, QuoteSnapshot } from '@/services/quote-history'
import { EquipmentWebSearchResultItem } from '@/services/quotes'
import {
  QuoteChemicalProductItem,
  QuoteCustomMaterial,
  QuoteEquipmentItem,
  QuoteMaterialItem,
  QuoteRecord,
  QuoteStatus,
} from '@/types/crm'

export function useQuoteEditorState() {
  // State de busca, status e ordenação
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  // Controle do modal de criação / edição de proposta
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [activeQuoteId, setActiveQuoteId] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  // PDF Preview Dialog (visão cliente e interna)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [quoteForPreview, setQuoteForPreview] = useState<QuoteRecord | null>(null)
  const [previewViewMode, setPreviewViewMode] = useState<'client' | 'internal'>('client')

  // Peças e Componentes (materials_items)
  const [materialsItems, setMaterialsItems] = useState<QuoteMaterialItem[]>([])
  const [newPartDescription, setNewPartDescription] = useState('')
  const [newPartQty, setNewPartQty] = useState<number>(1)
  const [newPartUnitPrice, setNewPartUnitPrice] = useState<number>(0)

  // Materiais Customizados legados - input temporário para novo item
  const [newMaterialDescription, setNewMaterialDescription] = useState('')
  const [newMaterialQty, setNewMaterialQty] = useState(1)
  const [newMaterialUnitCost, setNewMaterialUnitCost] = useState(0)

  // Produtos Químicos (Limpeza e Pintura)
  const [chemicalProducts, setChemicalProducts] = useState<QuoteChemicalProductItem[]>([])
  const [newChemicalCategory, setNewChemicalCategory] = useState<'cleaning' | 'painting'>(
    'cleaning',
  )
  const [newChemicalDescription, setNewChemicalDescription] = useState('')
  const [newChemicalUnit, setNewChemicalUnit] = useState<'L' | 'kg' | 'un' | 'gl' | 'lata'>('L')
  const [newChemicalQty, setNewChemicalQty] = useState<number>(1)
  const [newChemicalUnitPrice, setNewChemicalUnitPrice] = useState<number>(0)

  // Modal de cadastro manual de novo cliente (Seção 3A)
  const [isNewClientDialogOpen, setIsNewClientDialogOpen] = useState(false)
  const [isSavingNewClient, setIsSavingNewClient] = useState(false)
  const [newClientName, setNewClientName] = useState('')
  const [newClientDocument, setNewClientDocument] = useState('')
  const [newClientContact, setNewClientContact] = useState('')
  const [newClientEmail, setNewClientEmail] = useState('')
  const [newClientPhone, setNewClientPhone] = useState('')
  const [newClientCity, setNewClientCity] = useState('')
  const [newClientState, setNewClientState] = useState('')

  // Form Fields - Identificação Geral
  const [clientId, setClientId] = useState('')
  const [clientName, setClientName] = useState('')
  const [quoteTitle, setQuoteTitle] = useState('')
  const [quoteNumber, setQuoteNumber] = useState('')
  const [status, setStatus] = useState<QuoteStatus>('draft')
  const [equipmentModel, setEquipmentModel] = useState('')
  const [equipmentBrand, setEquipmentBrand] = useState('')
  const [equipmentQuantity, setEquipmentQuantity] = useState(1)
  const [plateCount, setPlateCount] = useState<number | undefined>(undefined)
  const [plateMaterial, setPlateMaterial] = useState('')
  const [plateThickness, setPlateThickness] = useState<number | undefined>(undefined)
  const [gasketMaterial, setGasketMaterial] = useState('')
  const [connectionSize, setConnectionSize] = useState('')
  const [pressureTestBar, setPressureTestBar] = useState<number | undefined>(undefined)
  const [workingPressureBar, setWorkingPressureBar] = useState<number | undefined>(undefined)
  const [dimensionsWHd, setDimensionsWHd] = useState('')
  const [workFluid, setWorkFluid] = useState('')
  const [homologatedProcedure, setHomologatedProcedure] = useState('')
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null)
  const [technicalProvenance, setTechnicalProvenance] = useState<any[]>([])

  // Integração de Funcionários & Permissão de Trabalho
  const [integrationRequired, setIntegrationRequired] = useState(false)
  const [integrationTiming, setIntegrationTiming] = useState<'same_day' | 'early' | string>(
    'same_day',
  )
  const [integrationWeekday, setIntegrationWeekday] = useState('Segunda-feira')
  const [integrationCost, setIntegrationCost] = useState(532.0)
  const [workPermitRequired, setWorkPermitRequired] = useState(false)

  // Materiais Customizados / Peças
  const [customMaterials, setCustomMaterials] = useState<QuoteCustomMaterial[]>([])

  const [equipments, setEquipments] = useState<QuoteEquipmentItem[]>([
    {
      id: 'eq-1',
      model: '',
      brand: '',
      quantity: 1,
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
  const [searchingSpecsIndex, setSearchingSpecsIndex] = useState<number | null>(null)
  const [activeCatalogSuggestionsIndex, setActiveCatalogSuggestionsIndex] = useState<number | null>(
    null,
  )
  const [catalogSuggestions, setCatalogSuggestions] = useState<EquipmentCatalogItem[]>([])
  const [allCatalogEquipments, setAllCatalogEquipments] = useState<EquipmentCatalogItem[]>([])
  const [scopeOfWork, setScopeOfWork] = useState(() => getStandardServiceMethodology(['BERMO']))

  // Painel / Modal interno de resultados de pesquisa server-side (sem abrir abas no navegador)
  const [isWebSearchModalOpen, setIsWebSearchModalOpen] = useState(false)
  const [webSearchActiveIndex, setWebSearchActiveIndex] = useState<number>(0)
  const [webSearchQuery, setWebSearchQuery] = useState('')
  const [webSearchResults, setWebSearchResults] = useState<EquipmentWebSearchResultItem[]>([])
  const [isWebSearching, setIsWebSearching] = useState(false)
  const [webSearchMessage, setWebSearchMessage] = useState('')
  const [webSearchExtractingId, setWebSearchExtractingId] = useState<string | null>(null)
  const [webSearchExtractionByResult, setWebSearchExtractionByResult] = useState<
    Record<string, EquipmentSpecsExtractionResponse>
  >({})
  const [webSearchSelectedFields, setWebSearchSelectedFields] = useState<
    Record<string, Record<string, boolean>>
  >({})

  // Vínculo com Oportunidade CRM e Responsável
  const [dealId, setDealId] = useState('')
  const [dealTitle, setDealTitle] = useState('')
  const [assignedTo, setAssignedTo] = useState('Alex Nogueira')
  const [approvalToken, setApprovalToken] = useState('')

  // Seção 3A: Mão de Obra (6 Funções Especializadas Suportadas)
  const [techCount, setTechCount] = useState(2)
  const [techHours, setTechHours] = useState(16)
  const [techRate, setTechRate] = useState(85)
  const [helperCount, setHelperCount] = useState(1)
  const [helperHours, setHelperHours] = useState(16)
  const [helperRate, setHelperRate] = useState(55)
  const [inspectorCount, setInspectorCount] = useState(0)
  const [inspectorHours, setInspectorHours] = useState(0)
  const [inspectorRate, setInspectorRate] = useState(120)
  const [welderCount, setWelderCount] = useState(0)
  const [welderHours, setWelderHours] = useState(0)
  const [welderRate, setWelderRate] = useState(160)
  const [plumberCount, setPlumberCount] = useState(0)
  const [plumberHours, setPlumberHours] = useState(0)
  const [plumberRate, setPlumberRate] = useState(120)
  const [foremanCount, setForemanCount] = useState(0)
  const [foremanHours, setForemanHours] = useState(0)
  const [foremanRate, setForemanRate] = useState(180)

  // Seção 3C: Deslocamento & Rotas
  const [originCep, setOriginCep] = useState('89066-000')
  const [originAddress, setOriginAddress] = useState('Rua Bernardo Reiter, 500 - Blumenau/SC')
  const [destinationCep, setDestinationCep] = useState('')
  const [destinationAddress, setDestinationAddress] = useState('')
  const [distanceKm, setDistanceKm] = useState(120)
  const [isRoundTrip, setIsRoundTrip] = useState(true)
  const [consumptionKmL, setConsumptionKmL] = useState(9.5)
  const [fuelPrice, setFuelPrice] = useState(5.89)
  const [tollRoadPercent, setTollRoadPercent] = useState(60)
  const [manualFuelAdj, setManualFuelAdj] = useState(0)
  const [manualTollAdj, setManualTollAdj] = useState(0)
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(false)

  // Aluguel de Carro
  const [carRentalType, setCarRentalType] = useState<string>('none')
  const [carRentalDailyRate, setCarRentalDailyRate] = useState(230)
  const [carRentalDays, setCarRentalDays] = useState(1)

  // Ref para controle de carregamento de proposta selecionada (evita re-carregamento indevido no auto-save)
  const loadedQuoteIdRef = useRef<string | null>(null)
  // Snapshot inicial ao abrir o formulário para motor de diff e histórico
  const initialSnapshotRef = useRef<QuoteSnapshot | null>(null)
  // Histórico de alterações da proposta ativa
  const [quoteHistoryList, setQuoteHistoryList] = useState<QuoteHistoryItem[]>([])
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)

  // Seção 3D: Hospedagem & Alimentação
  const [hotelDays, setHotelDays] = useState(0)
  const [hotelRate, setHotelRate] = useState(220)
  const [mealsDays, setMealsDays] = useState(0)
  const [mealsRate, setMealsRate] = useState(95)
  const [mealVoucherHousedQty, setMealVoucherHousedQty] = useState(0)
  const [mealVoucherHousedRate, setMealVoucherHousedRate] = useState(45)
  const [mealVoucherUnhousedQty, setMealVoucherUnhousedQty] = useState(0)
  const [mealVoucherUnhousedRate, setMealVoucherUnhousedRate] = useState(40)

  // Custos Diretos
  const [materialsCost, setMaterialsCost] = useState(0)
  const [thirdPartyCost, setThirdPartyCost] = useState(0)
  const [otherCosts, setOtherCosts] = useState(0)
  // Impostos & Margens (Markup divisor)
  const [serviceMargin, setServiceMargin] = useState(25)
  const [salesCommission, setSalesCommission] = useState(6)
  const [adminRate, setAdminRate] = useState(3)
  const [taxRate, setTaxRate] = useState(21.33)
  const [pisRate, setPisRate] = useState(0.65)
  const [cofinsRate, setCofinsRate] = useState(3.0)
  const [issRate, setIssRate] = useState(5.0)
  const [csllRate, setCsllRate] = useState(2.88)
  const [irpjRate, setIrpjRate] = useState(4.8)
  const [irDiffRate, setIrDiffRate] = useState(5.0)

  // Notas e Condições
  const [paymentTerms, setPaymentTerms] = useState('28 DDL faturado após entrega técnica')
  const [validityDays, setValidityDays] = useState(15)
  const [technicalNotes, setTechnicalNotes] = useState('')
  const [commercialNotes, setCommercialNotes] = useState('')

  // Auto-save debounce timer ref (apenas quando o modal de edição está aberto)
  const autoSaveTimerRef = useRef<any>(null)
  const isInitialMount = useRef(true)

  return {
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    isEditorOpen,
    setIsEditorOpen,
    activeQuoteId,
    setActiveQuoteId,
    isSaving,
    setIsSaving,
    isPreviewOpen,
    setIsPreviewOpen,
    quoteForPreview,
    setQuoteForPreview,
    previewViewMode,
    setPreviewViewMode,
    materialsItems,
    setMaterialsItems,
    newPartDescription,
    setNewPartDescription,
    newPartQty,
    setNewPartQty,
    newPartUnitPrice,
    setNewPartUnitPrice,
    newMaterialDescription,
    setNewMaterialDescription,
    newMaterialQty,
    setNewMaterialQty,
    newMaterialUnitCost,
    setNewMaterialUnitCost,
    chemicalProducts,
    setChemicalProducts,
    newChemicalCategory,
    setNewChemicalCategory,
    newChemicalDescription,
    setNewChemicalDescription,
    newChemicalUnit,
    setNewChemicalUnit,
    newChemicalQty,
    setNewChemicalQty,
    newChemicalUnitPrice,
    setNewChemicalUnitPrice,
    isNewClientDialogOpen,
    setIsNewClientDialogOpen,
    isSavingNewClient,
    setIsSavingNewClient,
    newClientName,
    setNewClientName,
    newClientDocument,
    setNewClientDocument,
    newClientContact,
    setNewClientContact,
    newClientEmail,
    setNewClientEmail,
    newClientPhone,
    setNewClientPhone,
    newClientCity,
    setNewClientCity,
    newClientState,
    setNewClientState,
    clientId,
    setClientId,
    clientName,
    setClientName,
    quoteTitle,
    setQuoteTitle,
    quoteNumber,
    setQuoteNumber,
    status,
    setStatus,
    equipmentModel,
    setEquipmentModel,
    equipmentBrand,
    setEquipmentBrand,
    equipmentQuantity,
    setEquipmentQuantity,
    plateCount,
    setPlateCount,
    plateMaterial,
    setPlateMaterial,
    plateThickness,
    setPlateThickness,
    gasketMaterial,
    setGasketMaterial,
    connectionSize,
    setConnectionSize,
    pressureTestBar,
    setPressureTestBar,
    workingPressureBar,
    setWorkingPressureBar,
    dimensionsWHd,
    setDimensionsWHd,
    workFluid,
    setWorkFluid,
    homologatedProcedure,
    setHomologatedProcedure,
    lastSavedAt,
    setLastSavedAt,
    technicalProvenance,
    setTechnicalProvenance,
    integrationRequired,
    setIntegrationRequired,
    integrationTiming,
    setIntegrationTiming,
    integrationWeekday,
    setIntegrationWeekday,
    integrationCost,
    setIntegrationCost,
    workPermitRequired,
    setWorkPermitRequired,
    customMaterials,
    setCustomMaterials,
    equipments,
    setEquipments,
    searchingSpecsIndex,
    setSearchingSpecsIndex,
    activeCatalogSuggestionsIndex,
    setActiveCatalogSuggestionsIndex,
    catalogSuggestions,
    setCatalogSuggestions,
    allCatalogEquipments,
    setAllCatalogEquipments,
    scopeOfWork,
    setScopeOfWork,
    isWebSearchModalOpen,
    setIsWebSearchModalOpen,
    webSearchActiveIndex,
    setWebSearchActiveIndex,
    webSearchQuery,
    setWebSearchQuery,
    webSearchResults,
    setWebSearchResults,
    isWebSearching,
    setIsWebSearching,
    webSearchMessage,
    setWebSearchMessage,
    webSearchExtractingId,
    setWebSearchExtractingId,
    webSearchExtractionByResult,
    setWebSearchExtractionByResult,
    webSearchSelectedFields,
    setWebSearchSelectedFields,
    dealId,
    setDealId,
    dealTitle,
    setDealTitle,
    assignedTo,
    setAssignedTo,
    approvalToken,
    setApprovalToken,
    techCount,
    setTechCount,
    techHours,
    setTechHours,
    techRate,
    setTechRate,
    helperCount,
    setHelperCount,
    helperHours,
    setHelperHours,
    helperRate,
    setHelperRate,
    inspectorCount,
    setInspectorCount,
    inspectorHours,
    setInspectorHours,
    inspectorRate,
    setInspectorRate,
    welderCount,
    setWelderCount,
    welderHours,
    setWelderHours,
    welderRate,
    setWelderRate,
    plumberCount,
    setPlumberCount,
    plumberHours,
    setPlumberHours,
    plumberRate,
    setPlumberRate,
    foremanCount,
    setForemanCount,
    foremanHours,
    setForemanHours,
    foremanRate,
    setForemanRate,
    originCep,
    setOriginCep,
    originAddress,
    setOriginAddress,
    destinationCep,
    setDestinationCep,
    destinationAddress,
    setDestinationAddress,
    distanceKm,
    setDistanceKm,
    isRoundTrip,
    setIsRoundTrip,
    consumptionKmL,
    setConsumptionKmL,
    fuelPrice,
    setFuelPrice,
    tollRoadPercent,
    setTollRoadPercent,
    manualFuelAdj,
    setManualFuelAdj,
    manualTollAdj,
    setManualTollAdj,
    isCalculatingRoute,
    setIsCalculatingRoute,
    carRentalType,
    setCarRentalType,
    carRentalDailyRate,
    setCarRentalDailyRate,
    carRentalDays,
    setCarRentalDays,
    loadedQuoteIdRef,
    initialSnapshotRef,
    quoteHistoryList,
    setQuoteHistoryList,
    isLoadingHistory,
    setIsLoadingHistory,
    hotelDays,
    setHotelDays,
    hotelRate,
    setHotelRate,
    mealsDays,
    setMealsDays,
    mealsRate,
    setMealsRate,
    mealVoucherHousedQty,
    setMealVoucherHousedQty,
    mealVoucherHousedRate,
    setMealVoucherHousedRate,
    mealVoucherUnhousedQty,
    setMealVoucherUnhousedQty,
    mealVoucherUnhousedRate,
    setMealVoucherUnhousedRate,
    materialsCost,
    setMaterialsCost,
    thirdPartyCost,
    setThirdPartyCost,
    otherCosts,
    setOtherCosts,
    serviceMargin,
    setServiceMargin,
    salesCommission,
    setSalesCommission,
    adminRate,
    setAdminRate,
    taxRate,
    setTaxRate,
    pisRate,
    setPisRate,
    cofinsRate,
    setCofinsRate,
    issRate,
    setIssRate,
    csllRate,
    setCsllRate,
    irpjRate,
    setIrpjRate,
    irDiffRate,
    setIrDiffRate,
    paymentTerms,
    setPaymentTerms,
    validityDays,
    setValidityDays,
    technicalNotes,
    setTechnicalNotes,
    commercialNotes,
    setCommercialNotes,
    autoSaveTimerRef,
    isInitialMount,
  }
}
