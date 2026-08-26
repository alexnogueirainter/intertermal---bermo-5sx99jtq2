import React, { useState, useMemo, useEffect, useRef } from 'react'
import {
  FileText,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  Eye,
  Edit,
  Trash2,
  DollarSign,
  Layers,
  Wrench,
  Truck,
  Hotel,
  SlidersHorizontal,
  Database,
  Loader2,
  ArrowLeftRight,
  Save,
  Check,
  UserCheck,
  ShieldCheck,
  Calculator,
  Car,
} from 'lucide-react'
import {
  QuoteRecord,
  QuoteLaborConfig,
  QuotePricingConfig,
  ClientRecord,
  DealRecord,
  QuoteStatus,
  PaymentConditionType,
} from '@/types/crm'
import {
  SUPPLIERS_DATABASE,
  lookupEquipmentSpecs,
  searchEquipmentModel,
  registerSupplierEquipment,
  SupplierPlateHeatExchanger,
} from '@/data/fornecedores'
import { productsService } from '@/services/crm-extras'
import { calculateQuotePricing, PricingCalculationResult } from '@/lib/quote-calculator'
import {
  fetchCepCoordinates,
  geocodeCity,
  haversineDistanceKm,
  BLUMENAU_COORDS,
} from '@/lib/mapeia-calculator'
import { QuotePdfPreviewDialog } from '@/components/QuotePdfPreviewDialog'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'

export interface QuotesManagerProps {
  quotes: QuoteRecord[]
  clients: ClientRecord[]
  deals?: DealRecord[]
  selectedQuote?: QuoteRecord | null
  onCreateQuote?: (quoteData: Partial<QuoteRecord>) => Promise<QuoteRecord | void>
  onUpdateQuote?: (id: string, quoteData: Partial<QuoteRecord>) => Promise<QuoteRecord | void>
  onSaveQuote?: (quoteData: Partial<QuoteRecord>) => Promise<QuoteRecord | void>
  onDeleteQuote?: (id: string) => Promise<void>
  onUpdateQuoteStatus?: (id: string, status: QuoteStatus) => Promise<void>
  onUpdateStatus?: (id: string, status: QuoteStatus) => Promise<void>
  onCreateClient?: (clientData: Partial<ClientRecord>) => Promise<ClientRecord | void>
  onOpenCatalog?: () => void
}

export function QuotesManager({
  quotes = [],
  clients = [],
  deals = [],
  selectedQuote,
  onCreateQuote,
  onUpdateQuote,
  onSaveQuote,
  onDeleteQuote,
  onUpdateQuoteStatus,
  onUpdateStatus,
  onCreateClient,
  onOpenCatalog,
}: QuotesManagerProps) {
  const { toast } = useToast()

  // Filtros e busca da listagem
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [clientFilter, setClientFilter] = useState<string>('all')

  // Modais
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [editingQuoteId, setEditingQuoteId] = useState<string | null>(null)
  const [isPdfPreviewOpen, setIsPdfPreviewOpen] = useState(false)
  const [quoteForPdf, setQuoteForPdf] = useState<QuoteRecord | null>(null)
  const [isNewClientModalOpen, setIsNewClientModalOpen] = useState(false)
  const [isNewEquipmentModalOpen, setIsNewEquipmentModalOpen] = useState(false)
  const [isSavingEquipment, setIsSavingEquipment] = useState(false)

  // Formulário do Modal de Cadastrar Novo Equipamento
  const [eqModalModel, setEqModalModel] = useState('')
  const [eqModalBrand, setEqModalBrand] = useState('Alfa Laval / BERMO')
  const [eqModalSeries, setEqModalSeries] = useState('Standard Plate')
  const [eqModalPlateCount, setEqModalPlateCount] = useState<number>(45)
  const [eqModalDimensions, setEqModalDimensions] = useState('1450 x 480 x 1120 mm')
  const [eqModalGasket, setEqModalGasket] = useState('EPDM Clip-on')
  const [eqModalPlateMaterial, setEqModalPlateMaterial] = useState('AISI 316L')
  const [eqModalThickness, setEqModalThickness] = useState<number>(0.5)
  const [eqModalConnection, setEqModalConnection] = useState('DN100 (4") Flangeada ANSI 150#')
  const [eqModalTestPressure, setEqModalTestPressure] = useState<number>(16)
  const [eqModalWorkPressure, setEqModalWorkPressure] = useState<number>(10)
  const [eqModalWeight, setEqModalWeight] = useState<number>(480)
  const [eqModalDescription, setEqModalDescription] = useState('')

  // Feedback de rascunho
  const [lastSavedDraft, setLastSavedDraft] = useState<string | null>(null)
  const [isSavingDraft, setIsSavingDraft] = useState(false)

  // ----------------------------------------------------
  // ESTADO DO FORMULÁRIO DE PROPOSTA
  // ----------------------------------------------------
  const [clientId, setClientId] = useState('')
  const [dealId, setDealId] = useState('')
  const [quoteCode, setQuoteCode] = useState('')
  const [status, setStatus] = useState<QuoteStatus>('draft')

  // Seção 3A: Equipamento & Parâmetros Técnicos
  const [equipmentBrand, setEquipmentBrand] = useState('Alfa Laval / BERMO')
  const [equipmentModel, setEquipmentModel] = useState('')
  const [equipmentSeries, setEquipmentSeries] = useState('')
  const [plateCount, setPlateCount] = useState<number>(45)
  const [plateMaterial, setPlateMaterial] = useState('AISI 316L')
  const [plateThickness, setPlateThickness] = useState<number>(0.5)
  const [gasketMaterial, setGasketMaterial] = useState('EPDM Clip-on')
  const [connectionType, setConnectionType] = useState('Flangeada ANSI 150#')
  const [connectionSize, setConnectionSize] = useState('DN100 (4")')
  const [pressureTestBar, setPressureTestBar] = useState<number>(16)
  const [workingPressureBar, setWorkingPressureBar] = useState<number>(10)
  const [dimensions, setDimensions] = useState('1450 x 480 x 1120 mm')
  const [weightKg, setWeightKg] = useState<number>(480)
  const [scopeOfWork, setScopeOfWork] = useState(
    'Abertura, limpeza química por recirculação e imersão em ultrassom, teste hidrostático, troca de gaxetas e remontagem com torquímetro calibrado.',
  )

  // Novos campos Seção 3A: Integração, PT e Pernoite
  const [integrationNeeded, setIntegrationNeeded] = useState<boolean>(false)
  const [integrationWhen, setIntegrationWhen] = useState<'same_day' | 'early'>('same_day')
  const [integrationDay, setIntegrationDay] = useState<string>('')
  const [workPermitNeeded, setWorkPermitNeeded] = useState<boolean>(false)
  const [overnightNeeded, setOvernightNeeded] = useState<boolean>(false)

  // Identificador da fonte do modelo (Base Local vs Manual)
  const [modelSource, setModelSource] = useState<'local' | 'manual'>('manual')
  const [isSearchingOnline, setIsSearchingOnline] = useState(false)
  const [modelSuggestions, setModelSuggestions] = useState<SupplierPlateHeatExchanger[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)

  // Peças e materiais adicionais (Placas sobressalentes, Gaxetas extras, etc)
  const [materialsCost, setMaterialsCost] = useState<number>(0)
  const [customMaterialsList, setCustomMaterialsList] = useState<
    Array<{ id: string; description: string; qty: number; unitPrice: number }>
  >([])
  const [newMaterialDesc, setNewMaterialDesc] = useState('')
  const [newMaterialQty, setNewMaterialQty] = useState(1)
  const [newMaterialPrice, setNewMaterialPrice] = useState(0)

  // Seção 3B: Mão de Obra Especializada (3 Funções)
  const [techCount, setTechCount] = useState<number>(1)
  const [techHours, setTechHours] = useState<number>(16)
  const [techRate, setTechRate] = useState<number>(140)

  const [helperCount, setHelperCount] = useState<number>(1)
  const [helperHours, setHelperHours] = useState<number>(16)
  const [helperRate, setHelperRate] = useState<number>(85)

  const [inspectorCount, setInspectorCount] = useState<number>(1)
  const [inspectorHours, setInspectorHours] = useState<number>(6)
  const [inspectorRate, setInspectorRate] = useState<number>(190)

  // Seção 3C: Deslocamento, Rotas & Logística (ViaCEP + Haversine Mapeia)
  const [originCep, setOriginCep] = useState('89066-000') // Base Blumenau/SC
  const [originAddress, setOriginAddress] = useState('Rua Bernardo Reiter, 500 - Blumenau/SC')
  const [destinationCep, setDestinationCep] = useState('')
  const [destinationAddress, setDestinationAddress] = useState('')
  const [distanceKm, setDistanceKm] = useState<number>(120)
  const [isRoundTrip, setIsRoundTrip] = useState<boolean>(true)
  const [consumptionKmL, setConsumptionKmL] = useState<number>(9.5)
  const [fuelPrice, setFuelPrice] = useState<number>(5.89)
  const [tollRoadPercent, setTollRoadPercent] = useState<number>(60)
  const [manualFuelAdj, setManualFuelAdj] = useState<number>(0)
  const [manualTollAdj, setManualTollAdj] = useState<number>(0)
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(false)
  const [carRentalType, setCarRentalType] = useState<string>('none') // 'none' | 'simple' | 'complete' | 'custom'
  const [carRentalDailyRate, setCarRentalDailyRate] = useState<number>(0)
  const [carRentalDays, setCarRentalDays] = useState<number>(1)

  // Seção 3D: Hospedagem & Alimentação
  const [hotelDays, setHotelDays] = useState<number>(2)
  const [hotelRate, setHotelRate] = useState<number>(220)
  const [mealsDays, setMealsDays] = useState<number>(4)
  const [mealsRate, setMealsRate] = useState<number>(95)

  // Toggle de Visão do Modal: "client" (Proposta do Cliente) vs "internal" (Composição Interna)
  const [quoteViewMode, setQuoteViewMode] = useState<'client' | 'internal'>('internal')

  // Seção 3E: Custos Indiretos, Margens e Impostos Fiscais
  const [serviceMargin, setServiceMargin] = useState<number>(25)
  const [salesCommission, setSalesCommission] = useState<number>(6)
  const [adminOverheadRate, setAdminOverheadRate] = useState<number>(0)
  const [pisRate, setPisRate] = useState<number>(0.65)
  const [cofinsRate, setCofinsRate] = useState<number>(3.0)
  const [issRate, setIssRate] = useState<number>(5.0)
  const [csllRate, setCsllRate] = useState<number>(2.88)
  const [irpjRate, setIrpjRate] = useState<number>(4.8)
  const [irDiffRate, setIrDiffRate] = useState<number>(1.5)
  const [discountAmount, setDiscountAmount] = useState<number>(0)
  const [thirdPartyCost, setThirdPartyCost] = useState<number>(0)
  const [otherCosts, setOtherCosts] = useState<number>(0)

  // Seção 3F: Prazo & Condições Comerciais
  const [validityDays, setValidityDays] = useState<number>(10)
  const [paymentCondition, setPaymentCondition] = useState<PaymentConditionType>('28_ddl')
  const [technicalNotes, setTechnicalNotes] = useState(
    'Incluso certificado de estanqueidade e laudo de ensaio por líquido penetrante conforme ASME Sec VIII Div 1.',
  )
  const [commercialNotes, setCommercialNotes] = useState(
    'Faturamento direto via BERMO / Intertermal. Garantia de 12 meses contra defeitos de montagem e vedação.',
  )

  // Modal Novo Cliente rápido
  const [newClientName, setNewClientName] = useState('')
  const [newClientDoc, setNewClientDoc] = useState('')
  const [newClientCity, setNewClientCity] = useState('')
  const [newClientState, setNewClientState] = useState('')

  // ----------------------------------------------------
  // ITEM 3A: Digitação Livre de Modelo + Auto-busca e Preenchimento
  // ----------------------------------------------------
  const handleModelChange = (typedValue: string) => {
    setEquipmentModel(typedValue)

    if (!typedValue || typedValue.trim().length === 0) {
      setModelSource('manual')
      setModelSuggestions([])
      setShowSuggestions(false)
      return
    }

    // Busca na base local
    const exactMatch = lookupEquipmentSpecs(typedValue)
    const suggestions = searchEquipmentModel(typedValue)
    setModelSuggestions(suggestions)
    setShowSuggestions(suggestions.length > 0)

    if (exactMatch) {
      setModelSource('local')
      applyEquipmentSpecs(exactMatch)
    } else {
      const matchInSuggestions = suggestions.find(
        (s) => s.modelCode.toLowerCase() === typedValue.trim().toLowerCase(),
      )
      if (matchInSuggestions) {
        setModelSource('local')
        applyEquipmentSpecs(matchInSuggestions)
      } else {
        setModelSource('manual')
      }
    }
  }

  const applyEquipmentSpecs = (item: SupplierPlateHeatExchanger) => {
    setEquipmentBrand(item.brand || 'BERMO / Alfa Laval')
    setEquipmentSeries(item.modelSeries || '')
    setPlateCount(item.plateCount || 45)
    setPlateMaterial(item.plateMaterial || 'AISI 316L')
    setPlateThickness(item.plateThicknessMm || 0.5)
    setGasketMaterial(item.gasketMaterial || 'EPDM Clip-on')
    setConnectionSize(item.connectionSize || 'DN100 (4")')
    setPressureTestBar(item.testPressureBar || 16)
    setWorkingPressureBar(item.maxPressureBar || 10)
    setDimensions(`${item.widthMm || 480} x ${item.heightMm || 1450} x ${item.depthMm || 1120} mm`)
    setWeightKg(item.weightKg || 480)
  }

  const selectSuggestion = (item: SupplierPlateHeatExchanger) => {
    setEquipmentModel(item.modelCode)
    setModelSource('local')
    applyEquipmentSpecs(item)
    setShowSuggestions(false)
    toast({
      title: `Modelo ${item.modelCode} carregado`,
      description: `Especificações técnicas de ${item.brand} aplicadas da Base Local. Todos os campos continuam editáveis.`,
    })
  }

  // Abertura do Modal de Cadastrar Novo Equipamento
  const handleOpenNewEquipmentModal = () => {
    setEqModalModel(equipmentModel.trim() || '')
    setEqModalBrand(equipmentBrand || 'Alfa Laval / BERMO')
    setEqModalSeries(equipmentSeries || 'Standard Plate')
    setEqModalPlateCount(Number(plateCount) || 45)
    setEqModalDimensions(dimensions || '1450 x 480 x 1120 mm')
    setEqModalGasket(gasketMaterial || 'EPDM Clip-on')
    setEqModalPlateMaterial(plateMaterial || 'AISI 316L')
    setEqModalThickness(Number(plateThickness) || 0.5)
    setEqModalConnection(connectionSize || 'DN100 (4")')
    setEqModalTestPressure(Number(pressureTestBar) || 16)
    setEqModalWorkPressure(Number(workingPressureBar) || 10)
    setEqModalWeight(Number(weightKg) || 480)
    setEqModalDescription(`Trocador de calor a placas ${eqModalModel || equipmentModel}`)
    setIsNewEquipmentModalOpen(true)
  }

  // Salvar Novo Equipamento no Backend e Catálogo Local
  const handleSaveNewEquipment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!eqModalModel.trim()) {
      toast({
        title: 'Modelo Obrigatório',
        description: 'Informe o código do modelo do equipamento.',
        variant: 'destructive',
      })
      return
    }

    setIsSavingEquipment(true)
    try {
      const dimParts = eqModalDimensions.split('x').map((d) => parseInt(d.trim(), 10))
      const widthVal = !isNaN(dimParts[0]) ? dimParts[0] : 480
      const heightVal = !isNaN(dimParts[1]) ? dimParts[1] : 1450
      const depthVal = !isNaN(dimParts[2]) ? dimParts[2] : 1120

      const newEquipmentItem: SupplierPlateHeatExchanger = {
        id: `supp-custom-${Date.now()}`,
        brand: eqModalBrand || 'BERMO / Alfa Laval',
        modelCode: eqModalModel.trim().toUpperCase(),
        modelSeries: eqModalSeries,
        plateCount: Number(eqModalPlateCount),
        plateMaterial: eqModalPlateMaterial,
        plateThicknessMm: Number(eqModalThickness),
        gasketMaterial: eqModalGasket,
        connectionSize: eqModalConnection,
        testPressureBar: Number(eqModalTestPressure),
        maxPressureBar: Number(eqModalWorkPressure),
        widthMm: widthVal,
        heightMm: heightVal,
        depthMm: depthVal,
        weightKg: Number(eqModalWeight),
        description: eqModalDescription || `Trocador de calor a placas ${eqModalModel}`,
      }

      // 1. Cadastrar na memória local do catálogo fornecedores
      registerSupplierEquipment(newEquipmentItem)

      // 2. Persistir no backend na coleção products
      try {
        await productsService.create({
          name: `Trocador ${newEquipmentItem.brand} ${newEquipmentItem.modelCode}`,
          code: newEquipmentItem.modelCode,
          brand: newEquipmentItem.brand,
          model: newEquipmentItem.modelCode,
          category: 'equipamento',
          description: newEquipmentItem.description,
          price: 0,
          unit: 'un',
          is_active: true,
          specs: {
            brand: newEquipmentItem.brand,
            model: newEquipmentItem.modelCode,
            modelSeries: newEquipmentItem.modelSeries,
            plateCount: newEquipmentItem.plateCount,
            plateMaterial: newEquipmentItem.plateMaterial,
            plateThicknessMm: newEquipmentItem.plateThicknessMm,
            gasketMaterial: newEquipmentItem.gasketMaterial,
            connectionSize: newEquipmentItem.connectionSize,
            connectionType: connectionType,
            testPressureBar: newEquipmentItem.testPressureBar,
            workingPressureBar: newEquipmentItem.maxPressureBar,
            dimensions: eqModalDimensions,
            weightKg: newEquipmentItem.weightKg,
            description: newEquipmentItem.description,
          },
        })
      } catch (backendErr) {
        console.warn('Persistência no backend (produtos) em modo fallback:', backendErr)
      }

      // 3. Aplicar diretamente no formulário da proposta
      setEquipmentModel(newEquipmentItem.modelCode)
      setEquipmentBrand(newEquipmentItem.brand)
      setEquipmentSeries(newEquipmentItem.modelSeries || '')
      setPlateCount(newEquipmentItem.plateCount)
      setPlateMaterial(newEquipmentItem.plateMaterial)
      setPlateThickness(newEquipmentItem.plateThicknessMm)
      setGasketMaterial(newEquipmentItem.gasketMaterial)
      setConnectionSize(newEquipmentItem.connectionSize)
      setPressureTestBar(newEquipmentItem.testPressureBar)
      setWorkingPressureBar(newEquipmentItem.maxPressureBar)
      setDimensions(eqModalDimensions)
      setWeightKg(newEquipmentItem.weightKg)
      setModelSource('local')
      setIsNewEquipmentModalOpen(false)

      toast({
        title: 'Equipamento Cadastrado com Sucesso!',
        description: `O modelo ${newEquipmentItem.modelCode} foi adicionado ao catálogo e aplicado à proposta.`,
      })
    } catch (err) {
      console.error('Erro ao cadastrar equipamento:', err)
      toast({
        title: 'Erro ao cadastrar',
        description: 'Não foi possível cadastrar o equipamento.',
        variant: 'destructive',
      })
    } finally {
      setIsSavingEquipment(false)
    }
  }

  // Busca de especificações na internet (IA / Catálogo Online)
  const handleSearchOnlineSpecs = async (queryModel: string) => {
    if (!queryModel || queryModel.trim().length === 0) {
      toast({
        title: 'Informe o modelo',
        description: 'Digite o nome ou código do trocador de calor para pesquisar especificações.',
        variant: 'destructive',
      })
      return
    }

    setIsSearchingOnline(true)
    try {
      await new Promise((res) => setTimeout(res, 800))

      const normalized = queryModel.toUpperCase().trim()
      let estimatedPlates = 50
      let estimatedThickness = 0.5
      let estimatedMaterial = 'AISI 316L'
      let estimatedGasket = 'EPDM Clip-on'
      let estimatedConn = 'DN80 (3")'
      let estimatedTestPress = 16
      let estimatedWorkPress = 10
      let estimatedDim = '1300 x 420 x 950 mm'
      let estimatedWeight = 380

      if (normalized.includes('M10') || normalized.includes('TL10') || normalized.includes('10')) {
        estimatedPlates = 65
        estimatedConn = 'DN100 (4")'
        estimatedDim = '1450 x 480 x 1120 mm'
        estimatedWeight = 480
      } else if (
        normalized.includes('M6') ||
        normalized.includes('TL6') ||
        normalized.includes('6')
      ) {
        estimatedPlates = 38
        estimatedConn = 'DN65 (2.1/2")'
        estimatedDim = '980 x 320 x 750 mm'
        estimatedWeight = 240
      } else if (
        normalized.includes('M15') ||
        normalized.includes('TL15') ||
        normalized.includes('15')
      ) {
        estimatedPlates = 85
        estimatedConn = 'DN150 (6")'
        estimatedDim = '1850 x 620 x 1450 mm'
        estimatedWeight = 820
      } else if (normalized.includes('TITAN') || normalized.includes('TI')) {
        estimatedMaterial = 'Titânio Gr. 1'
        estimatedGasket = 'Viton / FKM'
      }

      setPlateCount(estimatedPlates)
      setPlateThickness(estimatedThickness)
      setPlateMaterial(estimatedMaterial)
      setGasketMaterial(estimatedGasket)
      setConnectionSize(estimatedConn)
      setPressureTestBar(estimatedTestPress)
      setWorkingPressureBar(estimatedWorkPress)
      setDimensions(estimatedDim)
      setWeightKg(estimatedWeight)

      toast({
        title: 'Especificações Encontradas na Web',
        description: `Parâmetros técnicos sugeridos para "${queryModel}". Revise e ajuste conforme necessário.`,
      })
    } catch (err) {
      console.error(err)
      toast({
        title: 'Busca online',
        description: 'Não foi possível carregar automaticamente. Você pode preencher manualmente.',
        variant: 'destructive',
      })
    } finally {
      setIsSearchingOnline(false)
    }
  }

  // ----------------------------------------------------
  // ITEM 3C: Deslocamento Automático ao digitar CEP ou CIDADES
  // ----------------------------------------------------
  const lastAutoCalculatedAddressesRef = useRef<string>('')

  // Função para recalcular rota por CEP
  const handleRecalculateRoute = async (
    targetDestCep = destinationCep,
    targetOrigCep = originCep,
  ) => {
    const cleanDest = (targetDestCep || '').replace(/\D/g, '')
    const cleanOrig = (targetOrigCep || '').replace(/\D/g, '')

    if (cleanDest.length !== 8) return

    setIsCalculatingRoute(true)
    try {
      const destCoords = await fetchCepCoordinates(cleanDest)
      if (destCoords.city) {
        setDestinationAddress(`${destCoords.city} - ${destCoords.state || ''}`)
      }

      let origCoords = BLUMENAU_COORDS
      if (cleanOrig.length === 8 && cleanOrig !== '89066000') {
        const customOrig = await fetchCepCoordinates(cleanOrig)
        if (customOrig.city) {
          origCoords = {
            lat: customOrig.lat,
            lng: customOrig.lng,
            city: customOrig.city,
            state: customOrig.state,
          }
          setOriginAddress(`${customOrig.city} - ${customOrig.state || ''}`)
        }
      }

      const oneWayKm = haversineDistanceKm(
        origCoords.lat,
        origCoords.lng,
        destCoords.lat,
        destCoords.lng,
        1.28,
      )
      const finalDistKm = isRoundTrip ? Math.round(oneWayKm * 2) : Math.round(oneWayKm)
      setDistanceKm(finalDistKm > 0 ? finalDistKm : 50)

      toast({
        title: 'Rota calculada automaticamente',
        description: `Distância estimada: ${finalDistKm} km (${isRoundTrip ? 'Ida + Volta' : 'Só Ida'}) entre ${origCoords.city || 'Origem'} e ${destCoords.city || 'Destino'}.`,
      })
    } catch (err) {
      console.error('Erro ao calcular rota por CEP:', err)
      toast({
        title: 'Consulta de CEP',
        description:
          'Não foi possível obter rota precisa. A distância pode ser ajustada manualmente.',
      })
    } finally {
      setIsCalculatingRoute(false)
    }
  }

  // Função para calcular rota por Nomes de Cidade (Nominatim / OSM)
  const handleCalculateRouteByCities = async (origCity: string, destCity: string) => {
    if (!origCity || origCity.trim().length < 3 || !destCity || destCity.trim().length < 3) {
      return
    }

    setIsCalculatingRoute(true)
    try {
      const [origCoords, destCoords] = await Promise.all([
        geocodeCity(origCity),
        geocodeCity(destCity),
      ])

      if (origCoords && destCoords) {
        const oneWayKm = haversineDistanceKm(
          origCoords.lat,
          origCoords.lng,
          destCoords.lat,
          destCoords.lng,
          1.28,
        )
        const finalDistKm = isRoundTrip ? Math.round(oneWayKm * 2) : Math.round(oneWayKm)
        setDistanceKm(finalDistKm > 0 ? finalDistKm : 50)

        // Preenche com formato Cidade - UF se disponível
        if (origCoords.city) {
          const origLabel = origCoords.state
            ? `${origCoords.city} - ${origCoords.state}`
            : origCoords.city
          setOriginAddress(origLabel)
        }
        if (destCoords.city) {
          const destLabel = destCoords.state
            ? `${destCoords.city} - ${destCoords.state}`
            : destCoords.city
          setDestinationAddress(destLabel)
        }

        toast({
          title: 'Rota calculada automaticamente',
          description: `Distância estimada: ${finalDistKm} km (${isRoundTrip ? 'Ida + Volta' : 'Só Ida'}) entre ${origCoords.city || origCity} e ${destCoords.city || destCity}.`,
        })
      }
    } catch (err) {
      console.warn('Erro ao calcular rota por cidade via Nominatim:', err)
    } finally {
      setIsCalculatingRoute(false)
    }
  }

  // useEffect que monitora originAddress e destinationAddress (mínimo 3 caracteres em ambos)
  useEffect(() => {
    if (!isCreateModalOpen) return
    const orig = originAddress.trim()
    const dest = destinationAddress.trim()
    if (orig.length >= 3 && dest.length >= 3) {
      const pairKey = `${orig} -> ${dest}`
      if (lastAutoCalculatedAddressesRef.current === pairKey) {
        return
      }

      const timer = setTimeout(() => {
        lastAutoCalculatedAddressesRef.current = pairKey
        handleCalculateRouteByCities(orig, dest)
      }, 700)

      return () => clearTimeout(timer)
    }
  }, [originAddress, destinationAddress, isCreateModalOpen])

  // Toggle Ida e Volta
  const handleToggleRoundTrip = (checked: boolean) => {
    const prevChecked = isRoundTrip
    setIsRoundTrip(checked)
    if (!prevChecked && checked) {
      setDistanceKm((prev) => Math.round(prev * 2))
    } else if (prevChecked && !checked) {
      setDistanceKm((prev) => Math.max(10, Math.round(prev / 2)))
    }
  }

  // Handler para troca de tipo de aluguel de carro
  const handleCarRentalTypeChange = (type: string) => {
    setCarRentalType(type)
    if (type === 'none') {
      setCarRentalDailyRate(0)
    } else if (type === 'simple') {
      setCarRentalDailyRate(230)
    } else if (type === 'complete') {
      setCarRentalDailyRate(350)
    }
  }

  // ----------------------------------------------------
  // CÁLCULOS TÉCNICOS & FINANCEIROS
  // ----------------------------------------------------
  const laborTechTotal = techCount * techHours * techRate
  const laborHelperTotal = helperCount * helperHours * helperRate
  const laborInspectorTotal = inspectorCount * inspectorHours * inspectorRate
  const laborTotal = laborTechTotal + laborHelperTotal + laborInspectorTotal

  const lodgingMealsTotal = hotelDays * hotelRate + mealsDays * mealsRate

  const carRentalSubtotal =
    carRentalType !== 'none' ? Math.max(0, carRentalDailyRate * carRentalDays) : 0

  const litersFuel = distanceKm / (consumptionKmL || 9.5)
  const baseFuelCost = litersFuel * fuelPrice + manualFuelAdj
  const estimatedTolls = Math.max(1, Math.round((distanceKm / 100) * (tollRoadPercent / 100) * 1.5))
  const baseTollCost = estimatedTolls * 14.5 + manualTollAdj
  const travelTotal = Math.max(0, baseFuelCost + baseTollCost + carRentalSubtotal)

  const customMaterialsTotal = customMaterialsList.reduce((acc, m) => acc + m.qty * m.unitPrice, 0)
  const totalMaterials = materialsCost + customMaterialsTotal

  // Cálculos dos Custos Adicionais: Integração, PT e Pernoite
  const sumRates = techRate + helperRate + inspectorRate
  const totalTeamCount = techCount + helperCount + inspectorCount

  const integrationCost = useMemo(() => {
    if (!integrationNeeded) return 0
    if (integrationWhen === 'same_day') {
      return sumRates * 4 // Meio dia (4h)
    } else {
      // 'early': travelTotal + diária cheia da equipe (8h)
      return travelTotal + sumRates * 8
    }
  }, [integrationNeeded, integrationWhen, sumRates, travelTotal])

  const workPermitCost = useMemo(() => {
    if (!workPermitNeeded) return 0
    return sumRates * 1 // 1 hora da equipe
  }, [workPermitNeeded, sumRates])

  const overnightCost = useMemo(() => {
    if (!overnightNeeded) return 0
    return hotelRate * 1 + mealsRate * 1 * totalTeamCount
  }, [overnightNeeded, hotelRate, mealsRate, totalTeamCount])

  // Custo Direto da Seção 3A com Integração e PT
  const section3AAdditionalCost = integrationCost + workPermitCost

  const computation: PricingCalculationResult = useMemo(() => {
    return calculateQuotePricing({
      directCosts: {
        materials: totalMaterials,
        labor: laborTotal + section3AAdditionalCost,
        travel: travelTotal,
        lodgingMeals: lodgingMealsTotal,
        thirdParty: thirdPartyCost,
        other: otherCosts,
      },
      indirectCosts: {
        adminOverheadRate: adminOverheadRate,
      },
      taxes: {
        pis: pisRate,
        cofins: cofinsRate,
        iss: issRate,
        csll: csllRate,
        irpj: irpjRate,
        irDiff: irDiffRate,
      },
      marginPercent: serviceMargin,
      commissionPercent: salesCommission,
      discountAmount: discountAmount,
    })
  }, [
    totalMaterials,
    laborTotal,
    section3AAdditionalCost,
    travelTotal,
    lodgingMealsTotal,
    thirdPartyCost,
    otherCosts,
    adminOverheadRate,
    pisRate,
    cofinsRate,
    issRate,
    csllRate,
    irpjRate,
    irDiffRate,
    serviceMargin,
    salesCommission,
    discountAmount,
  ])

  // ----------------------------------------------------
  // ITEM 3: SALVAR RASCUNHO & EMITIR PROPOSTA
  // ----------------------------------------------------
  const getFormDataObject = (overrideStatus?: QuoteStatus): Partial<QuoteRecord> => {
    const selectedClient = clients.find((c) => c.id === clientId)
    const codeValue =
      quoteCode || `PROP-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`

    const laborConfig = {
      techCount: Number(techCount),
      techHours: Number(techHours),
      techRate: Number(techRate),
      helperCount: Number(helperCount),
      helperHours: Number(helperHours),
      helperRate: Number(helperRate),
      inspectorCount: Number(inspectorCount),
      inspectorHours: Number(inspectorHours),
      inspectorRate: Number(inspectorRate),
    }

    const pricingConfig = {
      serviceMargin: Number(serviceMargin),
      salesCommission: Number(salesCommission),
      adminRate: Number(adminOverheadRate),
      pisRate: Number(pisRate),
      cofinsRate: Number(cofinsRate),
      issRate: Number(issRate),
      csllRate: Number(csllRate),
      irpjRate: Number(irpjRate),
      irDiffRate: Number(irDiffRate),
    }

    const travelConfig = {
      originCep,
      originAddress,
      destinationCep,
      destinationAddress,
      distanceKm: Number(distanceKm),
      isRoundTrip,
      consumptionKmL: Number(consumptionKmL),
      fuelPrice: Number(fuelPrice),
      tollRoadPercent: Number(tollRoadPercent),
      manualFuelAdj: Number(manualFuelAdj),
      manualTollAdj: Number(manualTollAdj),
      car_rental_type: carRentalType,
      car_rental_daily_rate: Number(carRentalDailyRate),
      car_rental_days: Number(carRentalDays),
      car_rental_total: Number(carRentalSubtotal),
    }

    const lodgingMealsConfig = {
      hotelDays: Number(hotelDays),
      hotelRate: Number(hotelRate),
      mealsDays: Number(mealsDays),
      mealsRate: Number(mealsRate),
    }

    // Estrutura detalhada de service_details para compatibilidade com PDF, OS e histórico
    const serviceDetails = {
      service_technical_specs: {
        productModel: equipmentModel,
        productBrand: equipmentBrand,
        productSeries: equipmentSeries,
        platesCount: plateCount,
        plateMaterial: plateMaterial,
        plateThickness: plateThickness,
        gasketType: gasketMaterial,
        equipmentSize: connectionSize,
        connectionType: connectionType,
        operatingPressure: workingPressureBar,
        testPressure: pressureTestBar,
        dimensions: dimensions,
        weightKg: weightKg,
        scopeOfWork: scopeOfWork,
      },
      integration_details: {
        integration_needed: integrationNeeded,
        integration_when: integrationWhen,
        integration_day: integrationDay,
        integration_cost: integrationCost,
        work_permit_needed: workPermitNeeded,
        work_permit_cost: workPermitCost,
        overnight_needed: overnightNeeded,
        overnight_cost: overnightCost,
      },
      labor_costs: {
        techMechanical: {
          count: techCount,
          hours: techHours,
          ratePerHour: techRate,
          total: laborTechTotal,
        },
        helper: {
          count: helperCount,
          hours: helperHours,
          ratePerHour: helperRate,
          total: laborHelperTotal,
        },
        inspectorNDT: {
          count: inspectorCount,
          hours: inspectorHours,
          ratePerHour: inspectorRate,
          total: laborInspectorTotal,
        },
        totalLabor: laborTotal,
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
        manualFuelAdj,
        manualTollAdj,
        car_rental_type: carRentalType,
        car_rental_daily_rate: Number(carRentalDailyRate),
        car_rental_days: Number(carRentalDays),
        car_rental_total: Number(carRentalSubtotal),
        totalTravelCost: travelTotal,
      },
      lodging_meals_costs: {
        hotelDays,
        hotelRatePerDay: hotelRate,
        mealsDays,
        mealsRatePerDay: mealsRate,
        totalLodgingMeals: lodgingMealsTotal,
      },
      materials_breakdown: {
        baseMaterials: materialsCost,
        customMaterials: customMaterialsList,
        totalMaterials: totalMaterials,
      },
      indirect_costs: {
        serviceMarginPercent: serviceMargin,
        salesCommissionPercent: salesCommission,
        administrativeCostPercent: adminOverheadRate,
        taxes: {
          pis: pisRate,
          cofins: cofinsRate,
          iss: issRate,
          csll: csllRate,
          irpj: irpjRate,
          irDiff: irDiffRate,
          totalTaxes: computation.totalTaxesPercent,
        },
        directCostsTotal: computation.directCostsTotal,
        adminCostAmount: computation.adminOverheadAmount,
        totalIndirectAmount: computation.totalIndirectCosts,
        totalIndirectMarkupSum: computation.totalIndirectMarkupSum,
        finalSalePrice: computation.finalClientPrice,
      },
      payment_and_validity: {
        validityDays: validityDays,
        conditionType: paymentCondition,
      },
      service_composition: computation,
    }

    const items = [
      {
        id: `item-${Date.now()}`,
        name: `Serviço Especializado de Manutenção e Engenharia: ${equipmentBrand} ${equipmentModel || 'Equipamento'}`,
        quantity: 1,
        unit_price: computation.finalClientPrice,
        discount: discountAmount,
        total: computation.finalClientPrice,
        description: scopeOfWork,
        bermo_specs: {
          productCode: equipmentModel,
          productModel: equipmentModel,
          productBrand: equipmentBrand,
          platesCount: String(plateCount),
          plateDimensions: dimensions,
          gasketType: gasketMaterial,
          operatingPressure: String(workingPressureBar),
          serviceScope: scopeOfWork,
          pipeMeasurement: connectionSize,
        },
      },
    ]

    return {
      id: editingQuoteId || undefined,
      code: codeValue,
      quote_number: codeValue,
      title: `Proposta Técnica ${equipmentBrand} ${equipmentModel || ''}`.trim(),
      client_id: clientId,
      client_name: selectedClient?.name || 'Cliente Não Identificado',
      client_document: selectedClient?.document || '',
      deal_id: dealId || undefined,

      // Equipamento & Parâmetros Técnicos
      equipment_brand: equipmentBrand,
      equipment_model: equipmentModel,
      equipment_series: equipmentSeries,
      plate_count: Number(plateCount),
      plate_material: plateMaterial,
      plate_thickness: Number(plateThickness),
      gasket_material: gasketMaterial,
      connection_type: connectionType,
      connection_size: connectionSize,
      pressure_test_bar: Number(pressureTestBar),
      working_pressure_bar: Number(workingPressureBar),
      dimensions_w_h_d: dimensions,
      weight_kg: Number(weightKg),
      scope_of_work: scopeOfWork,

      // Mão de Obra (campos individuais + JSON)
      labor_hours: techHours + helperHours + inspectorHours,
      labor_rate_hourly: techRate,
      tech_count: Number(techCount),
      tech_hours: Number(techHours),
      tech_rate: Number(techRate),
      helper_count: Number(helperCount),
      helper_hours: Number(helperHours),
      helper_rate: Number(helperRate),
      inspector_count: Number(inspectorCount),
      inspector_hours: Number(inspectorHours),
      inspector_rate: Number(inspectorRate),
      labor_config: laborConfig,

      // Impostos, Margem e Comissão (campos individuais + JSON)
      service_margin: Number(serviceMargin),
      sales_commission: Number(salesCommission),
      admin_rate: Number(adminOverheadRate),
      admin_cost: Number(computation.adminOverheadAmount),
      pis_rate: Number(pisRate),
      cofins_rate: Number(cofinsRate),
      iss_rate: Number(issRate),
      csll_rate: Number(csllRate),
      irpj_rate: Number(irpjRate),
      ir_diff_rate: Number(irDiffRate),
      pricing_config: pricingConfig,

      // Logística, Deslocamento & Hospedagem
      origin_cep: originCep,
      origin_address: originAddress,
      destination_cep: destinationCep,
      destination_address: destinationAddress,
      distance_km: Number(distanceKm),
      is_round_trip: isRoundTrip,
      car_rental_type: carRentalType,
      car_rental_daily_rate: Number(carRentalDailyRate),
      car_rental_days: Number(carRentalDays),
      car_rental_total: Number(carRentalSubtotal),
      travel_config: travelConfig,
      lodging_meals_config: lodgingMealsConfig,

      // Novos Campos: Integração, PT e Pernoite
      integration_needed: integrationNeeded,
      integration_when: integrationWhen,
      integration_day: integrationDay,
      integration_cost: integrationCost,
      work_permit_needed: workPermitNeeded,
      work_permit_cost: workPermitCost,
      overnight_needed: overnightNeeded,
      overnight_cost: overnightCost,

      // Peças & Consumíveis
      custom_materials: customMaterialsList,

      // Custos Diretos
      lodging_meals_cost: lodgingMealsTotal,
      travel_cost: travelTotal,
      materials_cost: materialsCost,
      third_party_cost: thirdPartyCost,
      other_costs: otherCosts,
      discount_amount: discountAmount,
      total_cost: computation.directCostsTotal,
      subtotal: computation.directCostsTotal,
      final_price: computation.finalClientPrice,
      total: computation.finalClientPrice,

      // Status & Condições
      status: overrideStatus || status,
      validity_days: validityDays,
      payment_conditions: paymentCondition,
      payment_terms: `${paymentCondition.toUpperCase()} (${validityDays} dias de validade)`,
      technical_notes: technicalNotes,
      commercial_notes: commercialNotes,
      notes: technicalNotes ? `${technicalNotes} ${commercialNotes}`.trim() : scopeOfWork,
      service_details: serviceDetails,
      items: items,
    }
  }

  const handleSaveData = async (data: Partial<QuoteRecord>) => {
    if (editingQuoteId && onUpdateQuote) {
      return await onUpdateQuote(editingQuoteId, data)
    } else if (onCreateQuote) {
      return await onCreateQuote(data)
    } else if (onSaveQuote) {
      return await onSaveQuote(data)
    }
  }

  // 3. Salvar Rascunho
  const handleSaveDraft = async () => {
    setIsSavingDraft(true)
    try {
      const draftData = getFormDataObject('draft')
      const now = new Date()
      const formattedTime = `Salvo em ${now.toLocaleDateString('pt-BR')} às ${now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`

      await handleSaveData(draftData)
      setLastSavedDraft(formattedTime)

      toast({
        title: 'Rascunho salvo com sucesso!',
        description: formattedTime,
      })
    } catch (err) {
      console.error(err)
      toast({
        title: 'Erro ao salvar rascunho',
        description: 'Tente novamente em instantes.',
        variant: 'destructive',
      })
    } finally {
      setIsSavingDraft(false)
    }
  }

  // Submissão oficial da Proposta
  const handleSubmitQuote = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!clientId) {
      toast({
        title: 'Selecione um Cliente',
        description: 'É necessário selecionar ou cadastrar um cliente para emitir a proposta.',
        variant: 'destructive',
      })
      return
    }

    try {
      const quoteData = getFormDataObject(isEditMode ? status : 'sent')
      await handleSaveData(quoteData)

      toast({
        title: isEditMode ? 'Proposta Atualizada!' : 'Proposta Emitida com Sucesso!',
        description: `Código: ${quoteData.code} | Valor Final: ${computation.finalClientPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`,
      })

      setIsCreateModalOpen(false)
      resetForm()
    } catch (err) {
      console.error(err)
      toast({
        title: 'Erro ao salvar proposta',
        description: 'Ocorreu um erro ao gravar os dados. Verifique a conexão.',
        variant: 'destructive',
      })
    }
  }

  const resetForm = () => {
    setEditingQuoteId(null)
    setIsEditMode(false)
    setClientId('')
    setDealId('')
    setQuoteCode('')
    setStatus('draft')
    setEquipmentBrand('Alfa Laval / BERMO')
    setEquipmentModel('')
    setEquipmentSeries('')
    setPlateCount(45)
    setPlateMaterial('AISI 316L')
    setPlateThickness(0.5)
    setGasketMaterial('EPDM Clip-on')
    setConnectionType('Flangeada ANSI 150#')
    setConnectionSize('DN100 (4")')
    setPressureTestBar(16)
    setWorkingPressureBar(10)
    setDimensions('1450 x 480 x 1120 mm')
    setWeightKg(480)
    setScopeOfWork(
      'Abertura, limpeza química por recirculação e imersão em ultrassom, teste hidrostático, troca de gaxetas e remontagem com torquímetro calibrado.',
    )
    setIntegrationNeeded(false)
    setIntegrationWhen('same_day')
    setIntegrationDay('')
    setWorkPermitNeeded(false)
    setOvernightNeeded(false)
    setModelSource('manual')
    setMaterialsCost(0)
    setCustomMaterialsList([])

    // Mão de Obra
    setTechCount(1)
    setTechHours(16)
    setTechRate(140)
    setHelperCount(1)
    setHelperHours(16)
    setHelperRate(85)
    setInspectorCount(1)
    setInspectorHours(6)
    setInspectorRate(190)

    // Impostos & Margens
    setServiceMargin(25)
    setSalesCommission(6)
    setAdminOverheadRate(0)
    setPisRate(0.65)
    setCofinsRate(3.0)
    setIssRate(5.0)
    setCsllRate(2.88)
    setIrpjRate(4.8)
    setIrDiffRate(1.5)
    setDiscountAmount(0)
    setThirdPartyCost(0)
    setOtherCosts(0)

    // Logística & Hospedagem
    setOriginCep('89066-000')
    setOriginAddress('Rua Bernardo Reiter, 500 - Blumenau/SC')
    setDestinationCep('')
    setDestinationAddress('')
    setDistanceKm(120)
    setIsRoundTrip(true)
    setConsumptionKmL(9.5)
    setFuelPrice(5.89)
    setTollRoadPercent(60)
    setManualFuelAdj(0)
    setManualTollAdj(0)
    setCarRentalType('none')
    setCarRentalDailyRate(0)
    setCarRentalDays(1)
    setHotelDays(2)
    setHotelRate(220)
    setMealsDays(4)
    setMealsRate(95)

    // Condições Comerciais
    setValidityDays(10)
    setPaymentCondition('28_ddl')
    setTechnicalNotes(
      'Incluso certificado de estanqueidade e laudo de ensaio por líquido penetrante conforme ASME Sec VIII Div 1.',
    )
    setCommercialNotes(
      'Faturamento direto via BERMO / Intertermal. Garantia de 12 meses contra defeitos de montagem e vedação.',
    )
    setLastSavedDraft(null)
  }

  const handleOpenCreateModal = () => {
    resetForm()
    setQuoteViewMode('internal')
    setQuoteCode(`PROP-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`)
    setIsCreateModalOpen(true)
  }

  const handleOpenEditModal = (q: QuoteRecord) => {
    setEditingQuoteId(q.id)
    setIsEditMode(true)
    setQuoteViewMode('internal')
    setQuoteCode(q.code || q.quote_number || '')
    setClientId(q.client_id || '')
    setDealId(q.deal_id || '')
    setStatus(q.status || 'draft')

    // Extrair dados aninhados em service_details ou items caso existam
    const sDetails = q.service_details || {}
    const sSpecs = sDetails.service_technical_specs || {}
    const sIntegration = sDetails.integration_details || {}
    const sLabor = sDetails.labor_costs || {}
    const sTravel = sDetails.travel_costs || {}
    const sLodging = sDetails.lodging_meals_costs || {}
    const sIndirect = sDetails.indirect_costs || {}
    const sTaxes = sIndirect.taxes || {}
    const sPayment = sDetails.payment_and_validity || {}
    const firstItem = q.items && q.items.length > 0 ? q.items[0] : null
    const bSpecs = firstItem?.bermo_specs || {}

    // Equipamento & Parâmetros Técnicos
    setEquipmentBrand(
      q.equipment_brand || sSpecs.productBrand || bSpecs.productBrand || 'Alfa Laval / BERMO',
    )
    setEquipmentModel(
      q.equipment_model ||
        sSpecs.productModel ||
        sSpecs.productCode ||
        bSpecs.productModel ||
        bSpecs.productCode ||
        '',
    )
    setEquipmentSeries(q.equipment_series || sSpecs.productSeries || '')
    setPlateCount(
      q.plate_count ??
        (sSpecs.platesCount ? Number(sSpecs.platesCount) : undefined) ??
        (bSpecs.platesCount ? Number(bSpecs.platesCount) : undefined) ??
        45,
    )
    setPlateMaterial(
      q.plate_material || sSpecs.plateMaterial || bSpecs.frameMaterial || 'AISI 316L',
    )
    setPlateThickness(
      q.plate_thickness ??
        (sSpecs.plateThickness ? Number(sSpecs.plateThickness) : undefined) ??
        0.5,
    )
    setGasketMaterial(q.gasket_material || sSpecs.gasketType || bSpecs.gasketType || 'EPDM Clip-on')
    setConnectionType(q.connection_type || sSpecs.connectionType || 'Flangeada ANSI 150#')
    setConnectionSize(
      q.connection_size ||
        sSpecs.equipmentSize ||
        bSpecs.equipmentSize ||
        bSpecs.pipeMeasurement ||
        'DN100 (4")',
    )
    setPressureTestBar(
      q.pressure_test_bar ?? (sSpecs.testPressure ? Number(sSpecs.testPressure) : undefined) ?? 16,
    )
    setWorkingPressureBar(
      q.working_pressure_bar ??
        (sSpecs.operatingPressure ? Number(sSpecs.operatingPressure) : undefined) ??
        (bSpecs.operatingPressure ? Number(bSpecs.operatingPressure) : undefined) ??
        10,
    )
    setDimensions(
      q.dimensions_w_h_d || sSpecs.dimensions || bSpecs.plateDimensions || '1450 x 480 x 1120 mm',
    )
    setWeightKg(q.weight_kg ?? (sSpecs.weightKg ? Number(sSpecs.weightKg) : undefined) ?? 480)
    setScopeOfWork(
      q.scope_of_work ||
        sSpecs.scopeOfWork ||
        bSpecs.serviceScope ||
        firstItem?.description ||
        q.notes ||
        'Abertura, limpeza química por recirculação e imersão em ultrassom, teste hidrostático, troca de gaxetas e remontagem com torquímetro calibrado.',
    )

    // Novos campos: Integração, PT e Pernoite
    setIntegrationNeeded(q.integration_needed ?? sIntegration.integration_needed ?? false)
    setIntegrationWhen(q.integration_when ?? sIntegration.integration_when ?? 'same_day')
    setIntegrationDay(q.integration_day ?? sIntegration.integration_day ?? '')
    setWorkPermitNeeded(q.work_permit_needed ?? sIntegration.work_permit_needed ?? false)
    setOvernightNeeded(q.overnight_needed ?? sIntegration.overnight_needed ?? false)

    // -------------------------------------------------------------------------
    // PROBLEMA 1: RESTAURAR VALORES DE MÃO DE OBRA (techRate, helperRate, etc.)
    // -------------------------------------------------------------------------
    const laborCfg = q.labor_config as QuoteLaborConfig | undefined
    const techMech = sLabor.techMechanical || {}
    const helperObj = sLabor.helper || {}
    const inspObj = sLabor.inspectorNDT || {}

    setTechRate(
      q.tech_rate ?? laborCfg?.techRate ?? techMech.ratePerHour ?? q.labor_rate_hourly ?? 140,
    )
    setTechCount(q.tech_count ?? laborCfg?.techCount ?? techMech.count ?? 1)
    setTechHours(q.tech_hours ?? laborCfg?.techHours ?? techMech.hours ?? 16)

    setHelperRate(q.helper_rate ?? laborCfg?.helperRate ?? helperObj.ratePerHour ?? 85)
    setHelperCount(q.helper_count ?? laborCfg?.helperCount ?? helperObj.count ?? 1)
    setHelperHours(q.helper_hours ?? laborCfg?.helperHours ?? helperObj.hours ?? 16)

    setInspectorRate(q.inspector_rate ?? laborCfg?.inspectorRate ?? inspObj.ratePerHour ?? 190)
    setInspectorCount(q.inspector_count ?? laborCfg?.inspectorCount ?? inspObj.count ?? 1)
    setInspectorHours(q.inspector_hours ?? laborCfg?.inspectorHours ?? inspObj.hours ?? 6)

    // -------------------------------------------------------------------------
    // PROBLEMA 2: RESTAURAR IMPOSTOS, MARGEM E COMISSÃO
    // -------------------------------------------------------------------------
    const pricingCfg = q.pricing_config as QuotePricingConfig | undefined
    setServiceMargin(
      q.service_margin ?? pricingCfg?.serviceMargin ?? sIndirect.serviceMarginPercent ?? 25,
    )
    setSalesCommission(
      q.sales_commission ?? pricingCfg?.salesCommission ?? sIndirect.salesCommissionPercent ?? 6,
    )
    setAdminOverheadRate(
      q.admin_rate ?? pricingCfg?.adminRate ?? sIndirect.administrativeCostPercent ?? 0,
    )
    setPisRate(q.pis_rate ?? pricingCfg?.pisRate ?? sTaxes.pis ?? 0.65)
    setCofinsRate(q.cofins_rate ?? pricingCfg?.cofinsRate ?? sTaxes.cofins ?? 3.0)
    setIssRate(q.iss_rate ?? pricingCfg?.issRate ?? sTaxes.iss ?? 5.0)
    setCsllRate(q.csll_rate ?? pricingCfg?.csllRate ?? sTaxes.csll ?? 2.88)
    setIrpjRate(q.irpj_rate ?? pricingCfg?.irpjRate ?? sTaxes.irpj ?? 4.8)
    setIrDiffRate(q.ir_diff_rate ?? pricingCfg?.irDiffRate ?? sTaxes.irDiff ?? 1.5)

    // Custos Diretos & Peças
    setMaterialsCost(q.materials_cost || sDetails.materials_breakdown?.baseMaterials || 0)
    setCustomMaterialsList(
      q.custom_materials ||
        sDetails.materials_breakdown?.customMaterials ||
        sDetails.maintenance_materials?.map((m: any) => ({
          id: m.id || `mat-${Math.random()}`,
          description: m.description,
          qty: 1,
          unitPrice: m.amount || 0,
        })) ||
        [],
    )
    setThirdPartyCost(q.third_party_cost || 0)
    setOtherCosts(q.other_costs || 0)
    setDiscountAmount(q.discount_amount || q.discount_total || 0)

    // Logística & Rotas
    const travelCfg = q.travel_config || {}
    setOriginCep(q.origin_cep || travelCfg.originCep || sTravel.originCep || '89066-000')
    setOriginAddress(
      q.origin_address ||
        travelCfg.originAddress ||
        sTravel.originAddress ||
        'Rua Bernardo Reiter, 500 - Blumenau/SC',
    )
    setDestinationCep(q.destination_cep || travelCfg.destinationCep || sTravel.destinationCep || '')
    setDestinationAddress(
      q.destination_address || travelCfg.destinationAddress || sTravel.destinationAddress || '',
    )
    setDistanceKm(q.distance_km ?? travelCfg.distanceKm ?? sTravel.distanceKm ?? 120)
    setIsRoundTrip(
      q.is_round_trip !== undefined
        ? q.is_round_trip
        : travelCfg.isRoundTrip !== undefined
          ? travelCfg.isRoundTrip
          : sTravel.isRoundTrip !== undefined
            ? sTravel.isRoundTrip
            : true,
    )
    setConsumptionKmL(travelCfg.consumptionKmL || sTravel.consumptionKmL || 9.5)
    setFuelPrice(travelCfg.fuelPrice || sTravel.fuelPrice || 5.89)
    setTollRoadPercent(travelCfg.tollRoadPercent || sTravel.tollRoadPercent || 60)
    setManualFuelAdj(travelCfg.manualFuelAdj || sTravel.manualFuelAdjustment || 0)
    setManualTollAdj(travelCfg.manualTollAdj || sTravel.manualTollAdjustment || 0)

    // Aluguel de Carro
    const restoredRentalType =
      q.car_rental_type || travelCfg.car_rental_type || sTravel.car_rental_type || 'none'
    const restoredRentalRate =
      q.car_rental_daily_rate ??
      travelCfg.car_rental_daily_rate ??
      sTravel.car_rental_daily_rate ??
      (restoredRentalType === 'simple' ? 230 : restoredRentalType === 'complete' ? 350 : 0)
    const restoredRentalDays =
      q.car_rental_days ?? travelCfg.car_rental_days ?? sTravel.car_rental_days ?? 1

    setCarRentalType(restoredRentalType)
    setCarRentalDailyRate(restoredRentalRate)
    setCarRentalDays(restoredRentalDays)

    // Hospedagem & Alimentação
    const lodgingCfg = q.lodging_meals_config || {}
    setHotelDays(lodgingCfg.hotelDays ?? sLodging.hotelDays ?? 2)
    setHotelRate(lodgingCfg.hotelRate ?? sLodging.hotelRatePerDay ?? 220)
    setMealsDays(lodgingCfg.mealsDays ?? sLodging.mealsDays ?? 4)
    setMealsRate(lodgingCfg.mealsRate ?? sLodging.mealsRatePerDay ?? 95)

    // Condições Comerciais & Validade
    setValidityDays(q.validity_days || sPayment.validityDays || 10)
    const cond =
      (q.payment_conditions as PaymentConditionType) ||
      sPayment.conditionType ||
      (q.payment_terms?.toLowerCase().includes('14')
        ? '14_ddl'
        : q.payment_terms?.toLowerCase().includes('30')
          ? '30_ddl'
          : q.payment_terms?.toLowerCase().includes('45')
            ? '45_ddl'
            : q.payment_terms?.toLowerCase().includes('60')
              ? '60_ddl'
              : '28_ddl')
    setPaymentCondition(cond)
    setTechnicalNotes(q.technical_notes || '')
    setCommercialNotes(q.commercial_notes || '')

    const foundModel =
      q.equipment_model ||
      sSpecs.productModel ||
      sSpecs.productCode ||
      bSpecs.productModel ||
      bSpecs.productCode ||
      ''
    const match = lookupEquipmentSpecs(foundModel)
    setModelSource(match ? 'local' : 'manual')

    setIsCreateModalOpen(true)
  }

  const handleStatusUpdate = async (id: string, newStatus: QuoteStatus) => {
    if (onUpdateQuoteStatus) {
      await onUpdateQuoteStatus(id, newStatus)
    } else if (onUpdateStatus) {
      await onUpdateStatus(id, newStatus)
    }
  }

  // Filtragem de propostas
  const filteredQuotes = useMemo(() => {
    return quotes.filter((q) => {
      const matchSearch =
        q.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (q.client_name && q.client_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (q.equipment_model && q.equipment_model.toLowerCase().includes(searchTerm.toLowerCase()))

      const matchStatus = statusFilter === 'all' || q.status === statusFilter
      const matchClient = clientFilter === 'all' || q.client_id === clientFilter

      return matchSearch && matchStatus && matchClient
    })
  }, [quotes, searchTerm, statusFilter, clientFilter])

  // Adicionar item de material customizado
  const handleAddMaterial = () => {
    if (!newMaterialDesc || newMaterialPrice <= 0) return
    setCustomMaterialsList((prev) => [
      ...prev,
      {
        id: `mat-${Date.now()}`,
        description: newMaterialDesc,
        qty: newMaterialQty || 1,
        unitPrice: newMaterialPrice,
      },
    ])
    setNewMaterialDesc('')
    setNewMaterialQty(1)
    setNewMaterialPrice(0)
  }

  const handleRemoveMaterial = (id: string) => {
    setCustomMaterialsList((prev) => prev.filter((m) => m.id !== id))
  }

  return (
    <div className="space-y-6">
      {/* HEADER PRINCIPAL */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-teal-500/10 rounded-xl">
              <FileText className="h-6 w-6 text-teal-600 dark:text-teal-400" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Propostas Comerciais & Engenharia de Custos
            </h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Motor de orçamentação técnica BERMO / Alfa Laval com cálculo de Mão de Obra, Logística
            Mapeia (ViaCEP) e Formação de Preço de Venda.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={handleOpenCreateModal}
            className="bg-teal-700 hover:bg-teal-600 text-white font-semibold shadow-sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nova Proposta Técnica
          </Button>
        </div>
      </div>

      {/* CARDS DE RESUMO */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-slate-200 dark:border-slate-800">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                Total de Propostas
              </p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
                {quotes.length}
              </h3>
            </div>
            <div className="p-3 bg-blue-500/10 rounded-xl">
              <FileText className="h-5 w-5 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                Aprovadas / Fechadas
              </p>
              <h3 className="text-2xl font-bold text-emerald-600 mt-1">
                {quotes.filter((q) => q.status === 'approved').length}
              </h3>
            </div>
            <div className="p-3 bg-emerald-500/10 rounded-xl">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                Em Negociação
              </p>
              <h3 className="text-2xl font-bold text-amber-600 mt-1">
                {
                  quotes.filter((q) => q.status === 'sent' || q.status === 'pending_approval')
                    .length
                }
              </h3>
            </div>
            <div className="p-3 bg-amber-500/10 rounded-xl">
              <Clock className="h-5 w-5 text-amber-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                Volume Total em Pipeline
              </p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
                {quotes
                  .reduce((acc, q) => acc + (q.final_price || 0), 0)
                  .toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </h3>
            </div>
            <div className="p-3 bg-teal-500/10 rounded-xl">
              <DollarSign className="h-5 w-5 text-teal-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* FILTROS E TABELA DE PROPOSTAS */}
      <Card className="border-slate-200 dark:border-slate-800">
        <CardHeader className="p-4 pb-0">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por código, cliente, modelo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 text-xs"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[160px] text-xs">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Status</SelectItem>
                  <SelectItem value="draft">Rascunho</SelectItem>
                  <SelectItem value="pending_approval">Pendente Aprovação</SelectItem>
                  <SelectItem value="sent">Enviada ao Cliente</SelectItem>
                  <SelectItem value="approved">Aprovada</SelectItem>
                  <SelectItem value="rejected">Recusada</SelectItem>
                </SelectContent>
              </Select>

              <Select value={clientFilter} onValueChange={setClientFilter}>
                <SelectTrigger className="w-[200px] text-xs">
                  <SelectValue placeholder="Filtrar por Cliente" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Clientes</SelectItem>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4">
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 uppercase font-semibold">
                <tr>
                  <th className="p-3">Código</th>
                  <th className="p-3">Cliente</th>
                  <th className="p-3">Equipamento</th>
                  <th className="p-3">Custo Direto</th>
                  <th className="p-3">Preço Final</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredQuotes.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-muted-foreground">
                      Nenhuma proposta encontrada. Clique em "Nova Proposta Técnica" para começar.
                    </td>
                  </tr>
                ) : (
                  filteredQuotes.map((q) => (
                    <tr
                      key={q.id}
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors"
                    >
                      <td className="p-3 font-mono font-bold text-teal-700 dark:text-teal-300">
                        {q.code}
                      </td>
                      <td className="p-3 font-semibold text-slate-800 dark:text-slate-200">
                        {q.client_name || '—'}
                      </td>
                      <td className="p-3">
                        <div className="font-medium">
                          {q.equipment_model || 'Modelo não especificado'}
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          {q.plate_count ? `${q.plate_count} placas` : ''}{' '}
                          {q.gasket_material ? `• ${q.gasket_material}` : ''}
                        </div>
                      </td>
                      <td className="p-3 font-mono text-slate-600 dark:text-slate-400">
                        {(q.total_cost || 0).toLocaleString('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        })}
                      </td>
                      <td className="p-3 font-mono font-bold text-emerald-700 dark:text-emerald-300 text-sm">
                        {(q.final_price || 0).toLocaleString('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        })}
                      </td>
                      <td className="p-3">
                        <Badge
                          variant="outline"
                          className={
                            q.status === 'approved'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                              : q.status === 'sent'
                                ? 'bg-blue-50 text-blue-700 border-blue-300'
                                : q.status === 'pending_approval'
                                  ? 'bg-amber-50 text-amber-700 border-amber-300'
                                  : q.status === 'rejected'
                                    ? 'bg-rose-50 text-rose-700 border-rose-300'
                                    : 'bg-slate-100 text-slate-700 border-slate-300'
                          }
                        >
                          {q.status === 'approved'
                            ? 'Aprovada'
                            : q.status === 'sent'
                              ? 'Enviada'
                              : q.status === 'pending_approval'
                                ? 'Em Aprovação'
                                : q.status === 'rejected'
                                  ? 'Recusada'
                                  : 'Rascunho'}
                        </Badge>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setQuoteForPdf(q)
                              setIsPdfPreviewOpen(true)
                            }}
                            title="Visualizar Proposta PDF"
                            className="h-7 w-7 text-slate-600 hover:text-teal-600"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenEditModal(q)}
                            title="Editar Proposta"
                            className="h-7 w-7 text-slate-600 hover:text-blue-600"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          {onDeleteQuote && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => onDeleteQuote(q.id)}
                              title="Excluir"
                              className="h-7 w-7 text-slate-600 hover:text-rose-600"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* ========================================================================= */}
      {/* MODAL DE FORMULÁRIO DE PROPOSTA TÉCNICA (COMPLETO, RESTAURADO E LIMPO)   */}
      {/* ========================================================================= */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-w-5xl max-h-[92vh] overflow-y-auto p-6">
          <DialogHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <DialogTitle className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Wrench className="h-5 w-5 text-teal-600" />
                  {isEditMode
                    ? `Editar Proposta ${quoteCode}`
                    : 'Nova Proposta Comercial e Técnica'}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Engenharia de Custos BERMO Intertermal • Alfa Laval • Logística Mapeia
                </DialogDescription>
              </div>

              <div className="flex items-center flex-wrap gap-2">
                {/* TOGGLE VISÃO CLIENTE / VISÃO INTERNA */}
                <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
                  <Button
                    type="button"
                    variant={quoteViewMode === 'client' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setQuoteViewMode('client')}
                    className={`h-7 px-2.5 text-xs font-semibold ${
                      quoteViewMode === 'client'
                        ? 'bg-teal-700 hover:bg-teal-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                    }`}
                  >
                    <Eye className="h-3.5 w-3.5 mr-1" />
                    Proposta do Cliente
                  </Button>
                  <Button
                    type="button"
                    variant={quoteViewMode === 'internal' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setQuoteViewMode('internal')}
                    className={`h-7 px-2.5 text-xs font-semibold ${
                      quoteViewMode === 'internal'
                        ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                    }`}
                  >
                    <SlidersHorizontal className="h-3.5 w-3.5 mr-1" />
                    Composição Interna
                  </Button>
                </div>

                {/* BOTÃO VISUALIZAR PDF DA PROPOSTA ATUAL */}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const currentQuoteData = getFormDataObject(status)
                    setQuoteForPdf(currentQuoteData as QuoteRecord)
                    setIsPdfPreviewOpen(true)
                  }}
                  className="h-7 text-xs border-teal-300 text-teal-700 hover:bg-teal-50 dark:border-teal-800 dark:text-teal-300 dark:hover:bg-teal-950 font-semibold"
                >
                  <FileText className="h-3.5 w-3.5 mr-1" />
                  Visualizar PDF
                </Button>

                {lastSavedDraft && (
                  <Badge
                    variant="outline"
                    className="bg-emerald-50 text-emerald-700 border-emerald-300 text-[10px] font-mono"
                  >
                    <Check className="h-3 w-3 mr-1" />
                    {lastSavedDraft}
                  </Badge>
                )}
              </div>
            </div>
          </DialogHeader>

          <form onSubmit={handleSubmitQuote} className="space-y-6 pt-2">
            {/* CABEÇALHO DO FORMULÁRIO: CLIENTE & CÓDIGO */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold">Cliente *</Label>
                  {onCreateClient && (
                    <button
                      type="button"
                      onClick={() => setIsNewClientModalOpen(true)}
                      className="text-[10px] text-teal-600 hover:underline font-bold"
                    >
                      + Novo Cliente
                    </button>
                  )}
                </div>
                <Select value={clientId} onValueChange={setClientId} required>
                  <SelectTrigger className="text-xs">
                    <SelectValue placeholder="Selecione o Cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((c) => (
                      <SelectItem key={c.id} value={c.id} className="text-xs">
                        {c.name} {c.city ? `(${c.city}/${c.state || ''})` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Oportunidade / Negócio (CRM)</Label>
                <Select value={dealId} onValueChange={setDealId}>
                  <SelectTrigger className="text-xs">
                    <SelectValue placeholder="Vincular a Negócio (Opcional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum (Avulso)</SelectItem>
                    {deals.map((d) => (
                      <SelectItem key={d.id} value={d.id} className="text-xs">
                        {d.title} ({d.stage})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Status Inicial</Label>
                <Select value={status} onValueChange={(val) => setStatus(val as QuoteStatus)}>
                  <SelectTrigger className="text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft" className="text-xs">
                      Rascunho
                    </SelectItem>
                    <SelectItem value="pending_approval" className="text-xs">
                      Pendente Aprovação
                    </SelectItem>
                    <SelectItem value="sent" className="text-xs">
                      Emitida / Enviada ao Cliente
                    </SelectItem>
                    <SelectItem value="approved" className="text-xs">
                      Aprovada
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* ========================================================================= */}
            {/* SEÇÃO 3A: PRODUTO BERMO / FORNECEDOR & ESPECIFICAÇÕES TÉCNICAS           */}
            {/* (ITEM 3A: Digitação Livre + Busca Local vs Manual + Lupa Buscar Online)   */}
            {/* ========================================================================= */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
              {/* METODOLOGIA TÉCNICA DAS 6 ETAPAS NO TOPO DA SEÇÃO DE EQUIPAMENTOS */}
              <div className="p-3.5 rounded-xl bg-gradient-to-r from-teal-500/10 via-emerald-500/10 to-teal-500/5 border border-teal-200 dark:border-teal-900/60 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-teal-900 dark:text-teal-300 font-bold text-xs">
                    <ShieldCheck className="h-4 w-4 text-teal-600" />
                    <span>Metodologia Padrão de Manutenção Técnica (6 Etapas Especializadas)</span>
                  </div>
                  <Badge
                    variant="outline"
                    className="text-[10px] bg-teal-50 dark:bg-teal-950 text-teal-700 border-teal-300 font-semibold"
                  >
                    Procedimento Homologado BERMO
                  </Badge>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 pt-1 text-[11px]">
                  <div className="p-2 rounded-lg bg-white dark:bg-slate-950 border border-teal-100 dark:border-slate-800 space-y-0.5">
                    <span className="font-bold text-slate-900 dark:text-slate-100 text-xs block">
                      1. Desmontagem
                    </span>
                    <p className="text-[10.5px] text-muted-foreground leading-tight">
                      Abertura do feixe de placas com registro prévio da Medida A (distância entre
                      placas de aperto).
                    </p>
                  </div>
                  <div className="p-2 rounded-lg bg-white dark:bg-slate-950 border border-teal-100 dark:border-slate-800 space-y-0.5">
                    <span className="font-bold text-slate-900 dark:text-slate-100 text-xs block">
                      2. Limpeza
                    </span>
                    <p className="text-[10.5px] text-muted-foreground leading-tight">
                      Remoção de incrustações e resíduos através de limpeza mecânica manual e/ou
                      química preservando o inox.
                    </p>
                  </div>
                  <div className="p-2 rounded-lg bg-white dark:bg-slate-950 border border-teal-100 dark:border-slate-800 space-y-0.5">
                    <span className="font-bold text-slate-900 dark:text-slate-100 text-xs block">
                      3. Inspeção de Placas
                    </span>
                    <p className="text-[10.5px] text-muted-foreground leading-tight">
                      Análise visual e ensaio não destrutivo para detecção de furos, deformações ou
                      corrosão.
                    </p>
                  </div>
                  <div className="p-2 rounded-lg bg-white dark:bg-slate-950 border border-teal-100 dark:border-slate-800 space-y-0.5">
                    <span className="font-bold text-slate-900 dark:text-slate-100 text-xs block">
                      4. Inspeção de Gaxetas
                    </span>
                    <p className="text-[10.5px] text-muted-foreground leading-tight">
                      Verificação da elasticidade, trincas, ressecamento ou perda de perfil de
                      vedação.
                    </p>
                  </div>
                  <div className="p-2 rounded-lg bg-white dark:bg-slate-950 border border-teal-100 dark:border-slate-800 space-y-0.5">
                    <span className="font-bold text-slate-900 dark:text-slate-100 text-xs block">
                      5. Montagem
                    </span>
                    <p className="text-[10.5px] text-muted-foreground leading-tight">
                      Fechamento com torque gradual e uniforme cruzado respeitando a Medida A final
                      especificada.
                    </p>
                  </div>
                  <div className="p-2 rounded-lg bg-white dark:bg-slate-950 border border-teal-100 dark:border-slate-800 space-y-0.5">
                    <span className="font-bold text-slate-900 dark:text-slate-100 text-xs block">
                      6. Teste de Estanqueidade
                    </span>
                    <p className="text-[10.5px] text-muted-foreground leading-tight">
                      Verificação pós-montagem com ensaio de pressão para garantia de estanqueidade
                      absoluta.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-teal-600" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">
                    3a. Produto BERMO / Alfa Laval & Parâmetros Técnicos do Equipamento
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {modelSource === 'local' ? (
                    <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200 border-emerald-300 text-[10px] font-bold">
                      <Database className="h-3 w-3 mr-1" />
                      Base local
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 text-[10px] font-bold"
                    >
                      Manual
                    </Badge>
                  )}
                </div>
              </div>

              {/* LINHA DE ENTRADA DO MODELO COM DIGITAÇÃO LIVRE E AUTO-SUGESTÃO */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-medium">Marca / Fabricante</Label>
                  <Input
                    value={equipmentBrand}
                    onChange={(e) => setEquipmentBrand(e.target.value)}
                    placeholder="Ex: Alfa Laval, Kelvion, Danfoss"
                    className="text-xs h-8"
                  />
                </div>

                {/* CAMPO DE MODELO 100% EDITÁVEL COM DIGITAÇÃO LIVRE */}
                <div className="space-y-1 relative sm:col-span-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                      Modelo do Equipamento * (Digitação Livre)
                    </Label>
                    <span className="text-[10px] text-muted-foreground">
                      Ex: M10-BFG, TL10-P, M6-MFG, Kelvion NT100M
                    </span>
                  </div>

                  <div className="flex flex-wrap sm:flex-nowrap gap-2">
                    <div className="relative flex-1 min-w-[200px]">
                      <Input
                        value={equipmentModel}
                        onChange={(e) => handleModelChange(e.target.value)}
                        placeholder="Digite qualquer modelo livremente (ex: M10-BFG, TL10, Sondex S14)..."
                        className="text-xs h-8 font-mono font-bold"
                        required
                      />
                      {showSuggestions && modelSuggestions.length > 0 && (
                        <div className="absolute top-full left-0 right-0 z-50 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg shadow-lg mt-1 max-h-48 overflow-y-auto">
                          {modelSuggestions.map((s) => (
                            <div
                              key={s.id}
                              onClick={() => selectSuggestion(s)}
                              className="p-2 text-xs hover:bg-teal-50 dark:hover:bg-slate-800 cursor-pointer flex items-center justify-between border-b border-slate-100 dark:border-slate-900 last:border-0"
                            >
                              <div>
                                <span className="font-bold text-teal-700 dark:text-teal-300">
                                  {s.modelCode}
                                </span>
                                <span className="text-slate-500 ml-2">({s.brand})</span>
                              </div>
                              <span className="text-[10px] text-muted-foreground">
                                {s.plateCount} placas • {s.connectionSize}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* BOTÃO LUPA BUSCAR NA INTERNET QUANDO MANUAL */}
                    {modelSource === 'manual' && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={isSearchingOnline || !equipmentModel.trim()}
                        onClick={() => handleSearchOnlineSpecs(equipmentModel)}
                        className="h-8 text-xs border-teal-300 text-teal-700 hover:bg-teal-50 dark:border-teal-800 dark:text-teal-300 dark:hover:bg-teal-950 flex items-center gap-1.5 shrink-0"
                        title="Pesquisar especificações técnicas na internet / IA"
                      >
                        {isSearchingOnline ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Search className="h-3.5 w-3.5" />
                        )}
                        <span>Buscar na internet</span>
                      </Button>
                    )}

                    {/* BOTÃO CADASTRAR NOVO EQUIPAMENTO NO CATÁLOGO */}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleOpenNewEquipmentModal}
                      className="h-8 text-xs border-blue-300 text-blue-700 hover:bg-blue-50 dark:border-blue-800 dark:text-blue-300 dark:hover:bg-blue-950 flex items-center gap-1.5 shrink-0"
                      title="Cadastrar este equipamento no catálogo com suas especificações"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Cadastrar novo equipamento</span>
                    </Button>
                  </div>
                </div>
              </div>

              {/* CAMPOS TÉCNICOS: SEMPRE 100% EDITÁVEIS */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                <div className="space-y-1">
                  <Label className="text-[11px] font-medium text-slate-700 dark:text-slate-300">
                    Número de Placas
                  </Label>
                  <Input
                    type="number"
                    value={plateCount}
                    onChange={(e) => setPlateCount(Number(e.target.value))}
                    className="text-xs h-8"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-[11px] font-medium text-slate-700 dark:text-slate-300">
                    Material das Placas
                  </Label>
                  <Input
                    value={plateMaterial}
                    onChange={(e) => setPlateMaterial(e.target.value)}
                    placeholder="AISI 316L, Titânio..."
                    className="text-xs h-8"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-[11px] font-medium text-slate-700 dark:text-slate-300">
                    Espessura Placas (mm)
                  </Label>
                  <Input
                    type="number"
                    step="0.05"
                    value={plateThickness}
                    onChange={(e) => setPlateThickness(Number(e.target.value))}
                    className="text-xs h-8"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-[11px] font-medium text-slate-700 dark:text-slate-300">
                    Material das Gaxetas
                  </Label>
                  <Input
                    value={gasketMaterial}
                    onChange={(e) => setGasketMaterial(e.target.value)}
                    placeholder="EPDM Clip-on, NBR, Viton..."
                    className="text-xs h-8"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-[11px] font-medium text-slate-700 dark:text-slate-300">
                    Tipo e Bitola da Conexão
                  </Label>
                  <Input
                    value={connectionSize}
                    onChange={(e) => setConnectionSize(e.target.value)}
                    placeholder="DN100 (4'') Flangeada"
                    className="text-xs h-8"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-[11px] font-medium text-slate-700 dark:text-slate-300">
                    Pressão de Teste (bar)
                  </Label>
                  <Input
                    type="number"
                    value={pressureTestBar}
                    onChange={(e) => setPressureTestBar(Number(e.target.value))}
                    className="text-xs h-8"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-[11px] font-medium text-slate-700 dark:text-slate-300">
                    Pressão de Trabalho (bar)
                  </Label>
                  <Input
                    type="number"
                    value={workingPressureBar}
                    onChange={(e) => setWorkingPressureBar(Number(e.target.value))}
                    className="text-xs h-8"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-[11px] font-medium text-slate-700 dark:text-slate-300">
                    Dimensões (L x A x P mm)
                  </Label>
                  <Input
                    value={dimensions}
                    onChange={(e) => setDimensions(e.target.value)}
                    placeholder="1450 x 480 x 1120 mm"
                    className="text-xs h-8"
                  />
                </div>
              </div>

              {/* Escopo de Trabalho */}
              <div className="space-y-1 pt-1">
                <Label className="text-[11px] font-medium text-slate-700 dark:text-slate-300">
                  Escopo Detalhado do Serviço de Manutenção
                </Label>
                <Textarea
                  value={scopeOfWork}
                  onChange={(e) => setScopeOfWork(e.target.value)}
                  rows={2}
                  className="text-xs"
                />
              </div>

              {/* Novos Campos: Integração, PT e Pernoite */}
              <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
                {/* a) Necessidade de Integração de Funcionários */}
                <div className="p-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                        Necessidade de Integração de Funcionários
                      </Label>
                      <p className="text-[10px] text-muted-foreground">
                        Treinamento de integração ou ambientação técnica de segurança na fábrica do
                        cliente.
                      </p>
                    </div>
                    <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 p-0.5 rounded-lg border border-slate-200 dark:border-slate-800">
                      <Button
                        type="button"
                        size="sm"
                        variant={integrationNeeded ? 'default' : 'ghost'}
                        onClick={() => setIntegrationNeeded(true)}
                        className={`h-7 px-3 text-xs font-medium ${
                          integrationNeeded
                            ? 'bg-teal-700 hover:bg-teal-600 text-white shadow-xs'
                            : 'text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        Sim
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant={!integrationNeeded ? 'default' : 'ghost'}
                        onClick={() => setIntegrationNeeded(false)}
                        className={`h-7 px-3 text-xs font-medium ${
                          !integrationNeeded
                            ? 'bg-slate-700 hover:bg-slate-600 text-white shadow-xs'
                            : 'text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        Não
                      </Button>
                    </div>
                  </div>

                  {integrationNeeded && (
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-[11px] font-medium text-slate-700 dark:text-slate-300">
                          Quando será a integração?
                        </Label>
                        <Select
                          value={integrationWhen}
                          onValueChange={(val) => setIntegrationWhen(val as 'same_day' | 'early')}
                        >
                          <SelectTrigger className="text-xs h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="same_day" className="text-xs">
                              No dia do início da obra
                            </SelectItem>
                            <SelectItem value="early" className="text-xs">
                              Antecipada (antes do início da obra)
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-[11px] font-medium text-slate-700 dark:text-slate-300">
                          Dia da semana da integração
                        </Label>
                        <Input
                          value={integrationDay}
                          onChange={(e) => setIntegrationDay(e.target.value)}
                          placeholder="Ex: Segunda-feira"
                          className="text-xs h-8"
                        />
                      </div>

                      {quoteViewMode === 'internal' && (
                        <div className="sm:col-span-2 text-right text-[11px] font-bold text-teal-700 dark:text-teal-300 font-mono">
                          Custo Adicional Integração (
                          {integrationWhen === 'same_day'
                            ? 'Meio dia / 4h'
                            : 'Antecipada / Diária + Deslocamento'}
                          ):{' '}
                          {integrationCost.toLocaleString('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* b) Liberação de Permissão de Trabalho (PT) */}
                <div className="p-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                        Liberação de Permissão de Trabalho (PT)
                      </Label>
                      <p className="text-[10px] text-muted-foreground">
                        Emissão de APR, PT, PET e alinhamento de segurança no cliente.
                      </p>
                    </div>
                    <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 p-0.5 rounded-lg border border-slate-200 dark:border-slate-800">
                      <Button
                        type="button"
                        size="sm"
                        variant={workPermitNeeded ? 'default' : 'ghost'}
                        onClick={() => setWorkPermitNeeded(true)}
                        className={`h-7 px-3 text-xs font-medium ${
                          workPermitNeeded
                            ? 'bg-teal-700 hover:bg-teal-600 text-white shadow-xs'
                            : 'text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        Sim
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant={!workPermitNeeded ? 'default' : 'ghost'}
                        onClick={() => setWorkPermitNeeded(false)}
                        className={`h-7 px-3 text-xs font-medium ${
                          !workPermitNeeded
                            ? 'bg-slate-700 hover:bg-slate-600 text-white shadow-xs'
                            : 'text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        Não
                      </Button>
                    </div>
                  </div>

                  {workPermitNeeded && (
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                      <span className="text-slate-600 dark:text-slate-400 text-[11px] italic">
                        ℹ A liberação acontece no primeiro horário de trabalho
                      </span>
                      {quoteViewMode === 'internal' && (
                        <span className="text-[11px] font-bold text-teal-700 dark:text-teal-300 font-mono">
                          Custo Adicional PT (1h equipe):{' '}
                          {workPermitCost.toLocaleString('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          })}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* c) Pernoite no dia anterior (mostrar APENAS se (distanceKm / 2) > 240) */}
                {distanceKm / 2 > 240 && (
                  <div className="p-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <Label className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                            Pernoite no dia anterior
                          </Label>
                          <Badge
                            variant="outline"
                            className="text-[9px] text-amber-700 bg-amber-50 dark:bg-amber-950/40"
                          >
                            Distância &gt; 240km ({Math.round(distanceKm / 2)}km só ida)
                          </Badge>
                        </div>
                        <p className="text-[10px] text-muted-foreground">
                          Hospedagem prévia para a equipe iniciar os trabalhos pontualmente pela
                          manhã.
                        </p>
                      </div>
                      <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 p-0.5 rounded-lg border border-slate-200 dark:border-slate-800">
                        <Button
                          type="button"
                          size="sm"
                          variant={overnightNeeded ? 'default' : 'ghost'}
                          onClick={() => setOvernightNeeded(true)}
                          className={`h-7 px-3 text-xs font-medium ${
                            overnightNeeded
                              ? 'bg-teal-700 hover:bg-teal-600 text-white shadow-xs'
                              : 'text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          Sim
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant={!overnightNeeded ? 'default' : 'ghost'}
                          onClick={() => setOvernightNeeded(false)}
                          className={`h-7 px-3 text-xs font-medium ${
                            !overnightNeeded
                              ? 'bg-slate-700 hover:bg-slate-600 text-white shadow-xs'
                              : 'text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          Não
                        </Button>
                      </div>
                    </div>

                    {overnightNeeded && (
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                        <span className="text-slate-600 dark:text-slate-400 text-[11px]">
                          Pernoite e alimentação no dia anterior ao início do atendimento.
                        </span>
                        {quoteViewMode === 'internal' && (
                          <span className="text-[11px] font-bold text-teal-700 dark:text-teal-300 font-mono">
                            Custo Adicional Pernoite (1 diária + alimentação equipe):{' '}
                            {overnightCost.toLocaleString('pt-BR', {
                              style: 'currency',
                              currency: 'BRL',
                            })}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Peças e Materiais Adicionais */}
              <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold">
                    Peças de Reposição e Consumíveis Químicos
                  </Label>
                  <span className="text-xs font-bold text-teal-700 dark:text-teal-300 font-mono">
                    Total Materiais:{' '}
                    {totalMaterials.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                  <div className="sm:col-span-2">
                    <Input
                      value={newMaterialDesc}
                      onChange={(e) => setNewMaterialDesc(e.target.value)}
                      placeholder="Item (ex: Jogo de Gaxetas EPDM, Desincrustante Químico)"
                      className="text-xs h-8"
                    />
                  </div>
                  <div>
                    <Input
                      type="number"
                      min="1"
                      value={newMaterialQty}
                      onChange={(e) => setNewMaterialQty(Number(e.target.value))}
                      placeholder="Qtd"
                      className="text-xs h-8"
                    />
                  </div>
                  <div className="flex gap-1">
                    <Input
                      type="number"
                      step="0.01"
                      value={newMaterialPrice || ''}
                      onChange={(e) => setNewMaterialPrice(Number(e.target.value))}
                      placeholder="Valor Unit (R$)"
                      className="text-xs h-8"
                    />
                    <Button
                      type="button"
                      onClick={handleAddMaterial}
                      size="sm"
                      className="h-8 px-2.5 bg-teal-700 hover:bg-teal-600 text-white text-xs"
                    >
                      +
                    </Button>
                  </div>
                </div>

                {customMaterialsList.length > 0 && (
                  <div className="rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden mt-2">
                    <table className="w-full text-xs">
                      <thead className="bg-slate-100 dark:bg-slate-900 text-muted-foreground">
                        <tr>
                          <th className="p-2 text-left">Descrição</th>
                          <th className="p-2 text-center">Qtd</th>
                          <th className="p-2 text-right">Unitário</th>
                          <th className="p-2 text-right">Total</th>
                          <th className="p-2 text-right">Ação</th>
                        </tr>
                      </thead>
                      <tbody>
                        {customMaterialsList.map((m) => (
                          <tr
                            key={m.id}
                            className="border-t border-slate-100 dark:border-slate-800"
                          >
                            <td className="p-2 font-medium">{m.description}</td>
                            <td className="p-2 text-center">{m.qty}</td>
                            <td className="p-2 text-right font-mono">
                              {m.unitPrice.toLocaleString('pt-BR', {
                                style: 'currency',
                                currency: 'BRL',
                              })}
                            </td>
                            <td className="p-2 text-right font-mono font-bold">
                              {(m.qty * m.unitPrice).toLocaleString('pt-BR', {
                                style: 'currency',
                                currency: 'BRL',
                              })}
                            </td>
                            <td className="p-2 text-right">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRemoveMaterial(m.id)}
                                className="h-6 w-6 text-rose-500 hover:text-rose-700"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* ========================================================================= */}
            {/* SEÇÃO 3B: MÃO DE OBRA ESPECIALIZADA (3 FUNÇÕES)                          */}
            {/* ========================================================================= */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <UserCheck className="h-4 w-4 text-blue-600" />
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                    3b. Mão de Obra Especializada (3 Funções)
                  </span>
                </div>
                <span className="text-xs font-bold text-blue-600 font-mono">
                  Subtotal M.O.:{' '}
                  {laborTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* 1. Técnico Mecânico */}
                <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-xs">1. Técnico Mecânico</span>
                    <Badge variant="secondary" className="text-[9px]">
                      Líder
                    </Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5 text-[10px]">
                    <div>
                      <Label className="text-[9px]">Qtde</Label>
                      <Input
                        type="number"
                        min="0"
                        value={techCount}
                        onChange={(e) => setTechCount(Number(e.target.value))}
                        className="text-xs h-7"
                      />
                    </div>
                    <div>
                      <Label className="text-[9px]">Horas</Label>
                      <Input
                        type="number"
                        min="0"
                        value={techHours}
                        onChange={(e) => setTechHours(Number(e.target.value))}
                        className="text-xs h-7"
                      />
                    </div>
                    <div>
                      <Label className="text-[9px]">R$/Hora</Label>
                      <Input
                        type="number"
                        min="0"
                        value={techRate}
                        onChange={(e) => setTechRate(Number(e.target.value))}
                        className="text-xs h-7"
                      />
                    </div>
                  </div>
                  <div className="text-right text-[11px] font-bold text-slate-700 dark:text-slate-300 font-mono">
                    Total:{' '}
                    {laborTechTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </div>
                </div>

                {/* 2. Ajudante */}
                <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-xs">2. Ajudante Técnico</span>
                    <Badge variant="secondary" className="text-[9px]">
                      Apoio
                    </Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5 text-[10px]">
                    <div>
                      <Label className="text-[9px]">Qtde</Label>
                      <Input
                        type="number"
                        min="0"
                        value={helperCount}
                        onChange={(e) => setHelperCount(Number(e.target.value))}
                        className="text-xs h-7"
                      />
                    </div>
                    <div>
                      <Label className="text-[9px]">Horas</Label>
                      <Input
                        type="number"
                        min="0"
                        value={helperHours}
                        onChange={(e) => setHelperHours(Number(e.target.value))}
                        className="text-xs h-7"
                      />
                    </div>
                    <div>
                      <Label className="text-[9px]">R$/Hora</Label>
                      <Input
                        type="number"
                        min="0"
                        value={helperRate}
                        onChange={(e) => setHelperRate(Number(e.target.value))}
                        className="text-xs h-7"
                      />
                    </div>
                  </div>
                  <div className="text-right text-[11px] font-bold text-slate-700 dark:text-slate-300 font-mono">
                    Total:{' '}
                    {laborHelperTotal.toLocaleString('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    })}
                  </div>
                </div>

                {/* 3. Inspetor NDT / Qualidade */}
                <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-xs">3. Inspetor / NDT</span>
                    <Badge variant="secondary" className="text-[9px]">
                      Qualidade
                    </Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5 text-[10px]">
                    <div>
                      <Label className="text-[9px]">Qtde</Label>
                      <Input
                        type="number"
                        min="0"
                        value={inspectorCount}
                        onChange={(e) => setInspectorCount(Number(e.target.value))}
                        className="text-xs h-7"
                      />
                    </div>
                    <div>
                      <Label className="text-[9px]">Horas</Label>
                      <Input
                        type="number"
                        min="0"
                        value={inspectorHours}
                        onChange={(e) => setInspectorHours(Number(e.target.value))}
                        className="text-xs h-7"
                      />
                    </div>
                    <div>
                      <Label className="text-[9px]">R$/Hora</Label>
                      <Input
                        type="number"
                        min="0"
                        value={inspectorRate}
                        onChange={(e) => setInspectorRate(Number(e.target.value))}
                        className="text-xs h-7"
                      />
                    </div>
                  </div>
                  <div className="text-right text-[11px] font-bold text-slate-700 dark:text-slate-300 font-mono">
                    Total:{' '}
                    {laborInspectorTotal.toLocaleString('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* ========================================================================= */}
            {/* SEÇÃO 3C: DESLOCAMENTO & ROTAS (ITEM 3C: CEP 8 DÍGITOS + TOGGLE IDA/VOLTA) */}
            {/* ========================================================================= */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Truck className="h-4 w-4 text-emerald-600" />
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                    3c. Deslocamento & Rotas (Ref. Mapeia / ViaCEP / Haversine)
                  </span>
                </div>

                {/* TOGGLE VISUAL IDA E VOLTA (x2) COM ÍCONE ArrowLeftRight E SWITCH */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 bg-white dark:bg-slate-950 px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-800">
                    <ArrowLeftRight
                      className={`h-3.5 w-3.5 ${isRoundTrip ? 'text-emerald-600' : 'text-slate-400'}`}
                    />
                    <Label
                      htmlFor="toggle-round-trip"
                      className="text-xs font-semibold cursor-pointer select-none"
                    >
                      {isRoundTrip ? 'Ida e Volta (×2)' : 'Apenas Ida (×1)'}
                    </Label>
                    <Switch
                      id="toggle-round-trip"
                      checked={isRoundTrip}
                      onCheckedChange={handleToggleRoundTrip}
                    />
                  </div>

                  <span className="text-xs font-bold text-emerald-600 font-mono">
                    Subtotal:{' '}
                    {travelTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                </div>
              </div>

              {/* CEPS COM DISPARO AUTOMÁTICO AOS 8 DÍGITOS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-[10px] font-semibold text-slate-700 dark:text-slate-300">
                    Origem (CEP e Endereço da Base)
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      value={originCep}
                      onChange={(e) => {
                        const val = e.target.value
                        setOriginCep(val)
                        const clean = val.replace(/\D/g, '')
                        if (clean.length === 8) {
                          handleRecalculateRoute(destinationCep, val)
                        }
                      }}
                      placeholder="89066-000"
                      className="text-xs h-8 w-32 font-mono font-bold"
                    />
                    <Input
                      value={originAddress}
                      onChange={(e) => setOriginAddress(e.target.value)}
                      placeholder="Rua Bernardo Reiter, 500 - Blumenau/SC"
                      className="text-xs h-8 flex-1"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-[10px] font-semibold text-slate-700 dark:text-slate-300">
                    Destino da Fábrica / Cliente (CEP e Cidade)
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      value={destinationCep}
                      onChange={(e) => {
                        const val = e.target.value
                        setDestinationCep(val)
                        const clean = val.replace(/\D/g, '')
                        if (clean.length === 8) {
                          handleRecalculateRoute(val, originCep)
                        }
                      }}
                      placeholder="Ex: 89801-000"
                      className="text-xs h-8 w-32 font-mono font-bold text-teal-700 dark:text-teal-300"
                    />
                    <Input
                      value={destinationAddress}
                      onChange={(e) => setDestinationAddress(e.target.value)}
                      placeholder="Cidade/UF do Cliente"
                      className="text-xs h-8 flex-1"
                    />
                  </div>
                </div>
              </div>

              {/* PARÂMETROS DO MAPEIA / LOGÍSTICA */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <Label className="text-[10px] text-muted-foreground">
                      Distância ({isRoundTrip ? 'Ida + Volta km' : 'Apenas Ida km'})
                    </Label>
                    <Badge
                      variant="outline"
                      className={`text-[9px] px-1 py-0 ${
                        isRoundTrip
                          ? 'text-emerald-700 bg-emerald-50'
                          : 'text-slate-600 bg-slate-50'
                      }`}
                    >
                      {isRoundTrip ? '×2 Ida/Volta' : '×1 Só Ida'}
                    </Badge>
                  </div>
                  <Input
                    type="number"
                    value={distanceKm}
                    onChange={(e) => setDistanceKm(Number(e.target.value))}
                    className="text-xs h-8 font-bold font-mono text-emerald-800 dark:text-emerald-300"
                  />
                  <span className="text-[9px] text-muted-foreground block">
                    {isRoundTrip
                      ? `(Ida: ~${Math.round(distanceKm / 2)} km | Volta: ~${Math.round(distanceKm / 2)} km)`
                      : `(Percurso unidirecional: ${distanceKm} km)`}
                  </span>
                </div>

                <div className="space-y-1">
                  <Label className="text-[10px] text-muted-foreground">
                    Consumo Veículo (km/L)
                  </Label>
                  <Input
                    type="number"
                    value={consumptionKmL}
                    onChange={(e) => setConsumptionKmL(Number(e.target.value))}
                    className="text-xs h-8"
                  />
                  <span className="text-[9px] text-muted-foreground block">
                    Litros: ~{(distanceKm / (consumptionKmL || 9.5)).toFixed(1)} L (
                    {isRoundTrip ? 'ida+volta' : 'só ida'})
                  </span>
                </div>

                <div className="space-y-1">
                  <Label className="text-[10px] text-muted-foreground">
                    Preço Litro Combustível (R$)
                  </Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={fuelPrice}
                    onChange={(e) => setFuelPrice(Number(e.target.value))}
                    className="text-xs h-8"
                  />
                  <span className="text-[9px] text-muted-foreground block">
                    Combustível:{' '}
                    {baseFuelCost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                </div>

                <div className="space-y-1">
                  <Label className="text-[10px] text-muted-foreground">% Rodovias c/ Pedágio</Label>
                  <Input
                    type="number"
                    value={tollRoadPercent}
                    onChange={(e) => setTollRoadPercent(Number(e.target.value))}
                    className="text-xs h-8"
                  />
                  <span className="text-[9px] text-muted-foreground block">
                    Pedágios ({estimatedTolls} praças):{' '}
                    {baseTollCost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                </div>
              </div>

              {/* Ajustes Manuais */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                <div className="space-y-1">
                  <Label className="text-[10px] text-slate-600 dark:text-slate-400">
                    Ajuste Manual Combustível (+/- R$)
                  </Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={manualFuelAdj}
                    onChange={(e) => setManualFuelAdj(Number(e.target.value))}
                    placeholder="0.00"
                    className="text-xs h-8 font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] text-slate-600 dark:text-slate-400">
                    Ajuste Manual Pedágio (+/- R$)
                  </Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={manualTollAdj}
                    onChange={(e) => setManualTollAdj(Number(e.target.value))}
                    placeholder="0.00"
                    className="text-xs h-8 font-mono"
                  />
                </div>
              </div>

              {/* CAMPO DE ALUGUEL DE CARRO */}
              <div className="p-3 bg-white dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Car className="h-4 w-4 text-emerald-600" />
                    <Label className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                      Aluguel de Veículo / Carro
                    </Label>
                  </div>
                  {carRentalType !== 'none' && (
                    <Badge
                      variant="outline"
                      className="text-[10px] font-mono border-emerald-300 text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40"
                    >
                      Subtotal Carro:{' '}
                      {carRentalSubtotal.toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      })}
                    </Badge>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label className="text-[10px] text-muted-foreground font-medium">
                      Categoria do Veículo
                    </Label>
                    <Select value={carRentalType} onValueChange={handleCarRentalTypeChange}>
                      <SelectTrigger className="text-xs h-8">
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Sem aluguel</SelectItem>
                        <SelectItem value="simple">Carro Simples (R$ 230,00/dia)</SelectItem>
                        <SelectItem value="complete">Carro Completo (R$ 350,00/dia)</SelectItem>
                        <SelectItem value="custom">Personalizado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {carRentalType !== 'none' && (
                    <>
                      <div className="space-y-1">
                        <Label className="text-[10px] text-muted-foreground font-medium">
                          Valor Diária (R$) {carRentalType !== 'custom' && '(Editável)'}
                        </Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={carRentalDailyRate}
                          onChange={(e) => setCarRentalDailyRate(Number(e.target.value))}
                          className="text-xs h-8 font-mono font-semibold"
                        />
                      </div>

                      <div className="space-y-1">
                        <Label className="text-[10px] text-muted-foreground font-medium">
                          Quantidade de Dias
                        </Label>
                        <Input
                          type="number"
                          min="1"
                          value={carRentalDays}
                          onChange={(e) => setCarRentalDays(Math.max(1, Number(e.target.value)))}
                          className="text-xs h-8 font-mono font-semibold"
                        />
                      </div>
                    </>
                  )}
                </div>

                {carRentalType !== 'none' && (
                  <div className="text-[10.5px] text-slate-500 flex justify-between items-center pt-1 border-t border-slate-100 dark:border-slate-800">
                    <span>
                      Cálculo: {carRentalDays} diária(s) ×{' '}
                      {carRentalDailyRate.toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      })}
                    </span>
                    <span className="font-bold text-slate-900 dark:text-slate-100 font-mono">
                      ={' '}
                      {carRentalSubtotal.toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      })}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-muted-foreground">
                    * Digite as cidades (ou CEPs) para rota automática via Nominatim/Mapeia.
                  </span>
                  {isCalculatingRoute && (
                    <Badge
                      variant="outline"
                      className="text-[9px] px-1.5 py-0 text-teal-700 bg-teal-50 border-teal-300 flex items-center gap-1 animate-pulse"
                    >
                      <Loader2 className="h-2.5 w-2.5 animate-spin" />
                      Automático
                    </Badge>
                  )}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isCalculatingRoute}
                  onClick={() => {
                    const orig = originAddress.trim()
                    const dest = destinationAddress.trim()
                    if (orig.length >= 3 && dest.length >= 3) {
                      handleCalculateRouteByCities(orig, dest)
                    } else {
                      handleRecalculateRoute()
                    }
                  }}
                  className="text-[11px] h-7 border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                >
                  {isCalculatingRoute ? (
                    <>
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      Calculando Rota...
                    </>
                  ) : (
                    'Recalcular Rota Mapeia'
                  )}
                </Button>
              </div>
            </div>

            {/* ========================================================================= */}
            {/* SEÇÃO 3D: HOSPEDAGEM & ALIMENTAÇÃO                                       */}
            {/* ========================================================================= */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Hotel className="h-4 w-4 text-purple-600" />
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                    3d. Hospedagem & Alimentação
                  </span>
                </div>
                <span className="text-xs font-bold text-purple-600 font-mono">
                  Subtotal Hosp/Alim:{' '}
                  {lodgingMealsTotal.toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  })}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="space-y-1">
                  <Label className="text-[10px] text-muted-foreground">Diárias de Hotel</Label>
                  <Input
                    type="number"
                    min="0"
                    value={hotelDays}
                    onChange={(e) => setHotelDays(Number(e.target.value))}
                    className="text-xs h-8"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] text-muted-foreground">Valor por Diária (R$)</Label>
                  <Input
                    type="number"
                    min="0"
                    value={hotelRate}
                    onChange={(e) => setHotelRate(Number(e.target.value))}
                    className="text-xs h-8"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] text-muted-foreground">Diárias de Refeição</Label>
                  <Input
                    type="number"
                    min="0"
                    value={mealsDays}
                    onChange={(e) => setMealsDays(Number(e.target.value))}
                    className="text-xs h-8"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] text-muted-foreground">
                    Valor por Refeição (R$)
                  </Label>
                  <Input
                    type="number"
                    min="0"
                    value={mealsRate}
                    onChange={(e) => setMealsRate(Number(e.target.value))}
                    className="text-xs h-8"
                  />
                </div>
              </div>
            </div>

            {/* ========================================================================= */}
            {/* SEÇÃO 3E: CUSTOS INDIRETOS, MARGENS & IMPOSTOS FISCAIS (VISÃO CONDICIONAL) */}
            {/* ========================================================================= */}
            {quoteViewMode === 'internal' ? (
              <div className="p-4 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border-2 border-amber-300 dark:border-amber-800 space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <SlidersHorizontal className="h-4 w-4 text-amber-600" />
                    <span className="text-xs font-bold text-amber-900 dark:text-amber-200 uppercase tracking-wider">
                      3e. Custos Internos & Formação do Preço de Venda (Composição Interna)
                    </span>
                  </div>
                  <Badge className="bg-amber-200 text-amber-900 dark:bg-amber-900 dark:text-amber-100 text-[10px] font-bold">
                    Visão Gerencial / Markup
                  </Badge>
                </div>

                {/* Sliders de Margem, Comissão e Taxa Administrativa */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white dark:bg-slate-950 p-3 rounded-lg border border-amber-200 dark:border-amber-900">
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <Label className="font-semibold text-slate-900 dark:text-slate-100">
                        Margem de Serviços: <strong>{serviceMargin}%</strong>
                      </Label>
                    </div>
                    <Slider
                      value={[serviceMargin]}
                      min={15}
                      max={40}
                      step={1}
                      onValueChange={(val) => setServiceMargin(val[0])}
                      className="py-1"
                    />
                    <div className="text-[10px] text-amber-700 dark:text-amber-300 font-mono text-right">
                      Valor:{' '}
                      {computation.marginAmount.toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      })}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <Label className="font-semibold text-slate-900 dark:text-slate-100">
                        Comissão de Vendas: <strong>{salesCommission}%</strong>
                      </Label>
                    </div>
                    <Slider
                      value={[salesCommission]}
                      min={0}
                      max={15}
                      step={1}
                      onValueChange={(val) => setSalesCommission(val[0])}
                      className="py-1"
                    />
                    <div className="text-[10px] text-amber-700 dark:text-amber-300 font-mono text-right">
                      Valor:{' '}
                      {computation.commissionAmount.toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      })}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <Label className="font-semibold text-slate-900 dark:text-slate-100">
                        Taxa Admin / Overhead: <strong>{adminOverheadRate}%</strong>
                      </Label>
                    </div>
                    <Slider
                      value={[adminOverheadRate]}
                      min={0}
                      max={25}
                      step={1}
                      onValueChange={(val) => setAdminOverheadRate(val[0])}
                      className="py-1"
                    />
                    <div className="text-[10px] text-amber-700 dark:text-amber-300 font-mono text-right">
                      Valor:{' '}
                      {computation.adminOverheadAmount.toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      })}
                    </div>
                  </div>
                </div>

                {/* Impostos Incidentes */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex justify-between items-center">
                    <Label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                      Impostos Fiscais Incidentes (Total: {computation.totalTaxesPercent}%)
                    </Label>
                    <span className="text-[11px] font-mono text-slate-600 dark:text-slate-400 font-bold">
                      Total Impostos:{' '}
                      {computation.totalTaxesAmount.toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      })}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-xs">
                    <div>
                      <div className="flex justify-between text-[9px] text-muted-foreground">
                        <span>PIS (%)</span>
                        <span className="font-mono">
                          {computation.pisAmount.toLocaleString('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          })}
                        </span>
                      </div>
                      <Input
                        type="number"
                        step="0.01"
                        value={pisRate}
                        onChange={(e) => setPisRate(Number(e.target.value))}
                        className="text-xs h-7"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between text-[9px] text-muted-foreground">
                        <span>COFINS (%)</span>
                        <span className="font-mono">
                          {computation.cofinsAmount.toLocaleString('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          })}
                        </span>
                      </div>
                      <Input
                        type="number"
                        step="0.01"
                        value={cofinsRate}
                        onChange={(e) => setCofinsRate(Number(e.target.value))}
                        className="text-xs h-7"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between text-[9px] text-muted-foreground">
                        <span>ISS (%)</span>
                        <span className="font-mono">
                          {computation.issAmount.toLocaleString('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          })}
                        </span>
                      </div>
                      <Input
                        type="number"
                        step="0.01"
                        value={issRate}
                        onChange={(e) => setIssRate(Number(e.target.value))}
                        className="text-xs h-7 bg-amber-50/60 dark:bg-amber-950/40"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between text-[9px] text-muted-foreground">
                        <span>CSLL (%)</span>
                        <span className="font-mono">
                          {computation.csllAmount.toLocaleString('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          })}
                        </span>
                      </div>
                      <Input
                        type="number"
                        step="0.01"
                        value={csllRate}
                        onChange={(e) => setCsllRate(Number(e.target.value))}
                        className="text-xs h-7"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between text-[9px] text-muted-foreground">
                        <span>IRPJ (%)</span>
                        <span className="font-mono">
                          {computation.irpjAmount.toLocaleString('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          })}
                        </span>
                      </div>
                      <Input
                        type="number"
                        step="0.01"
                        value={irpjRate}
                        onChange={(e) => setIrpjRate(Number(e.target.value))}
                        className="text-xs h-7"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between text-[9px] text-muted-foreground">
                        <span>Dif. IR (%)</span>
                        <span className="font-mono">
                          {computation.irDiffAmount.toLocaleString('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          })}
                        </span>
                      </div>
                      <Input
                        type="number"
                        step="0.01"
                        value={irDiffRate}
                        onChange={(e) => setIrDiffRate(Number(e.target.value))}
                        className="text-xs h-7"
                      />
                    </div>
                  </div>
                </div>

                {/* SOMA DETALHADA DOS CUSTOS INTERNOS / MARGEM / IMPOSTOS */}
                <div className="p-3 rounded-lg bg-amber-100/70 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-xs space-y-2">
                  <div className="flex items-center justify-between font-bold text-amber-900 dark:text-amber-200">
                    <span className="flex items-center gap-1.5">
                      <Calculator className="h-4 w-4" />
                      Soma dos Custos Internos Indiretos & Formação de Preço
                    </span>
                    <span className="font-mono text-sm">
                      Total Indireto:{' '}
                      {computation.totalIndirectMarkupSum.toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      })}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px] border-t border-amber-200 dark:border-amber-900 text-amber-950 dark:text-amber-100">
                    <div>
                      <span className="text-muted-foreground block text-[10px]">
                        Custo Direto Base:
                      </span>
                      <strong className="font-mono">
                        {computation.directCostsTotal.toLocaleString('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        })}
                      </strong>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[10px]">
                        Margem ({serviceMargin}%):
                      </span>
                      <strong className="font-mono text-emerald-700 dark:text-emerald-400">
                        +
                        {computation.marginAmount.toLocaleString('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        })}
                      </strong>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[10px]">
                        Comissão ({salesCommission}%):
                      </span>
                      <strong className="font-mono text-blue-700 dark:text-blue-400">
                        +
                        {computation.commissionAmount.toLocaleString('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        })}
                      </strong>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[10px]">
                        Impostos Totais ({computation.totalTaxesPercent}%):
                      </span>
                      <strong className="font-mono text-purple-700 dark:text-purple-400">
                        +
                        {computation.totalTaxesAmount.toLocaleString('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        })}
                      </strong>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-amber-200 dark:border-amber-900 text-xs font-semibold">
                    <span className="text-slate-700 dark:text-slate-300">
                      Preço Final Calculado com Markup Aplicado:
                    </span>
                    <span className="text-base font-black text-teal-800 dark:text-teal-300 font-mono">
                      {computation.finalClientPrice.toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      })}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              /* MODO PROPOSTA DO CLIENTE: APENAS ESCOPO E VALOR LÍQUIDO DOS SERVIÇOS */
              <div className="p-4 rounded-xl bg-teal-50/60 dark:bg-teal-950/20 border-2 border-teal-300 dark:border-teal-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4 text-teal-700 dark:text-teal-400" />
                    <span className="text-xs font-bold text-teal-900 dark:text-teal-200 uppercase tracking-wider">
                      Visão da Proposta do Cliente (Sem Custos Internos)
                    </span>
                  </div>
                  <Badge className="bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200 text-[10px] font-bold">
                    Apresentação Comercial
                  </Badge>
                </div>
                <div className="p-3 bg-white dark:bg-slate-950 rounded-lg border border-teal-100 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 space-y-2">
                  <p className="text-[11px] leading-relaxed">
                    Nesta visão comercial destinada à apresentação direta ao cliente, os custos
                    internos (margem de contribuição, alíquotas fiscais de impostos, comissões de
                    venda e taxas administrativas) são mantidos confidenciais.
                  </p>
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                    <span className="font-semibold text-xs">
                      Valor Total dos Serviços Especializados de Engenharia:
                    </span>
                    <span className="text-lg font-black text-teal-800 dark:text-teal-300 font-mono">
                      {computation.finalClientPrice.toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      })}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* SEÇÃO 3F: PRAZO & CONDIÇÕES COMERCIAIS                                   */}
            {/* ========================================================================= */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-slate-200 dark:border-slate-800">
              <div className="space-y-1">
                <Label className="text-xs font-medium">Prazo de Validade da Proposta</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={validityDays}
                    onChange={(e) => setValidityDays(Number(e.target.value))}
                    className="text-xs w-24"
                  />
                  <span className="text-xs text-muted-foreground">dias corridos</span>
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-medium">Condições de Pagamento</Label>
                <Select
                  value={paymentCondition}
                  onValueChange={(val) => setPaymentCondition(val as PaymentConditionType)}
                >
                  <SelectTrigger className="text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="14_ddl" className="text-xs">
                      14 DDL (14 dias do dia líquido)
                    </SelectItem>
                    <SelectItem value="28_ddl" className="text-xs">
                      28 DDL (28 dias do dia líquido)
                    </SelectItem>
                    <SelectItem value="30_ddl" className="text-xs">
                      30 DDL (30 dias negociados)
                    </SelectItem>
                    <SelectItem value="45_ddl" className="text-xs">
                      45 DDL (45 dias negociados)
                    </SelectItem>
                    <SelectItem value="60_ddl" className="text-xs">
                      60 DDL (60 dias negociados)
                    </SelectItem>
                    <SelectItem value="custom" className="text-xs">
                      Outras Condições Especiais
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* TOTALIZADOR GERAL */}
            <div className="p-4 rounded-xl bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
              <div>
                <span className="text-[11px] text-slate-400 block font-medium">
                  Preço Final de Venda ao Cliente:
                </span>
                <span className="text-2xl font-black text-teal-300 font-mono">
                  {computation.finalClientPrice.toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  })}
                </span>
              </div>
              <div className="text-right text-[11px] text-slate-300 space-y-0.5">
                <div>
                  Custos Diretos Totais:{' '}
                  <strong className="text-white font-mono">
                    {computation.directCostsTotal.toLocaleString('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    })}
                  </strong>
                </div>
                <div>
                  Custos Indiretos / Impostos:{' '}
                  <strong className="text-white font-mono">
                    {computation.totalIndirectCosts.toLocaleString('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    })}
                  </strong>
                </div>
              </div>
            </div>

            {/* ========================================================================= */}
            {/* DIALOG FOOTER: BOTÃO SALVAR RASCUNHO (ITEM 3) + EMITIR PROPOSTA           */}
            {/* ========================================================================= */}
            <DialogFooter className="pt-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                {lastSavedDraft ? (
                  <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium text-[11px]">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {lastSavedDraft}
                  </span>
                ) : (
                  <span className="text-[11px] text-slate-500">
                    Nenhum rascunho salvo nesta sessão
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="text-xs"
                >
                  Cancelar
                </Button>

                {/* BOTÃO "VISUALIZAR PDF" */}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const currentQuoteData = getFormDataObject(status)
                    setQuoteForPdf(currentQuoteData as QuoteRecord)
                    setIsPdfPreviewOpen(true)
                  }}
                  className="text-xs font-semibold border-teal-300 text-teal-700 hover:bg-teal-50 dark:border-teal-800 dark:text-teal-300 dark:hover:bg-teal-950 flex items-center gap-1.5"
                >
                  <FileText className="h-3.5 w-3.5 text-teal-600" />
                  Visualizar PDF
                </Button>

                {/* BOTÃO "SALVAR RASCUNHO" */}
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleSaveDraft}
                  disabled={isSavingDraft}
                  className="text-xs font-semibold border border-slate-300 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-800 flex items-center gap-1.5"
                >
                  {isSavingDraft ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="h-3.5 w-3.5" />
                      Salvar Rascunho
                    </>
                  )}
                </Button>

                {/* BOTÃO "EMITIR PROPOSTA" / "SALVAR ALTERAÇÕES" */}
                <Button
                  type="submit"
                  className="text-xs bg-teal-700 hover:bg-teal-600 text-white font-semibold shadow-sm"
                >
                  {isEditMode ? 'Salvar Alterações na Proposta' : 'Emitir Proposta Técnica'}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL DE CRIAÇÃO RÁPIDA DE CLIENTE */}
      {onCreateClient && (
        <Dialog open={isNewClientModalOpen} onOpenChange={setIsNewClientModalOpen}>
          <DialogContent className="sm:max-w-[450px]">
            <DialogHeader>
              <DialogTitle className="text-base font-bold">Cadastrar Novo Cliente</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Insira os dados básicos do cliente para associar à proposta técnica.
              </DialogDescription>
            </DialogHeader>
            <form
              onSubmit={async (e) => {
                e.preventDefault()
                if (!newClientName) return
                if (onCreateClient) {
                  const created = await onCreateClient({
                    name: newClientName,
                    document: newClientDoc,
                    city: newClientCity,
                    state: newClientState,
                    status: 'active',
                  })
                  if (created && 'id' in created && created.id) {
                    setClientId(created.id)
                    if (newClientCity) {
                      setDestinationAddress(`${newClientCity} / ${newClientState}`)
                    }
                  }
                }
                setIsNewClientModalOpen(false)
                setNewClientName('')
                setNewClientDoc('')
                setNewClientCity('')
              }}
              className="space-y-3 py-2 text-xs"
            >
              <div className="space-y-1">
                <Label className="text-xs">Razão Social / Nome Fantasia *</Label>
                <Input
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                  placeholder="Ex: Aurora Alimentos S.A."
                  className="text-xs"
                  required
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">CNPJ</Label>
                <Input
                  value={newClientDoc}
                  onChange={(e) => setNewClientDoc(e.target.value)}
                  placeholder="00.000.000/0001-00"
                  className="text-xs"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">Cidade</Label>
                  <Input
                    value={newClientCity}
                    onChange={(e) => setNewClientCity(e.target.value)}
                    placeholder="Chapecó"
                    className="text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">UF</Label>
                  <Input
                    value={newClientState}
                    onChange={(e) => setNewClientState(e.target.value)}
                    placeholder="SC"
                    className="text-xs uppercase"
                  />
                </div>
              </div>
              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsNewClientModalOpen(false)}
                  className="text-xs"
                >
                  Cancelar
                </Button>
                <Button type="submit" className="text-xs bg-teal-700 hover:bg-teal-600 text-white">
                  Salvar e Selecionar
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* MODAL CADASTRAR NOVO EQUIPAMENTO NO CATÁLOGO */}
      <Dialog open={isNewEquipmentModalOpen} onOpenChange={setIsNewEquipmentModalOpen}>
        <DialogContent className="sm:max-w-[620px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Database className="h-4 w-4 text-blue-600" />
              Cadastrar Novo Equipamento no Catálogo
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Cadastre o trocador de calor com suas especificações completas para ficar disponível
              no catálogo local e no banco de dados.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveNewEquipment} className="space-y-3 py-2 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Modelo / Código *</Label>
                <Input
                  value={eqModalModel}
                  onChange={(e) => setEqModalModel(e.target.value)}
                  placeholder="Ex: M10-BFG, Sondex S21, Kelvion NT50M"
                  className="text-xs font-mono font-bold"
                  required
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Fabricante / Marca *</Label>
                <Input
                  value={eqModalBrand}
                  onChange={(e) => setEqModalBrand(e.target.value)}
                  placeholder="Ex: Alfa Laval, Sondex, Kelvion, Tranter"
                  className="text-xs"
                  required
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Série / Família</Label>
                <Input
                  value={eqModalSeries}
                  onChange={(e) => setEqModalSeries(e.target.value)}
                  placeholder="Ex: Industrial Plate, Sanitária, Standard"
                  className="text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Número de Placas Padrão</Label>
                <Input
                  type="number"
                  min="1"
                  value={eqModalPlateCount}
                  onChange={(e) => setEqModalPlateCount(Number(e.target.value))}
                  className="text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Material das Placas</Label>
                <Input
                  value={eqModalPlateMaterial}
                  onChange={(e) => setEqModalPlateMaterial(e.target.value)}
                  placeholder="AISI 316L, AISI 304, Titânio..."
                  className="text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Espessura Placas (mm)</Label>
                <Input
                  type="number"
                  step="0.05"
                  value={eqModalThickness}
                  onChange={(e) => setEqModalThickness(Number(e.target.value))}
                  className="text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Tipo de Gaxetas</Label>
                <Input
                  value={eqModalGasket}
                  onChange={(e) => setEqModalGasket(e.target.value)}
                  placeholder="EPDM Clip-on, NBR Clip-on, Viton..."
                  className="text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Tipo e Bitola da Conexão</Label>
                <Input
                  value={eqModalConnection}
                  onChange={(e) => setEqModalConnection(e.target.value)}
                  placeholder="DN100 (4'') Flangeada ANSI 150#"
                  className="text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Pressão de Teste (bar)</Label>
                <Input
                  type="number"
                  value={eqModalTestPressure}
                  onChange={(e) => setEqModalTestPressure(Number(e.target.value))}
                  className="text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Pressão de Trabalho (bar)</Label>
                <Input
                  type="number"
                  value={eqModalWorkPressure}
                  onChange={(e) => setEqModalWorkPressure(Number(e.target.value))}
                  className="text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Dimensões (L x A x P mm)</Label>
                <Input
                  value={eqModalDimensions}
                  onChange={(e) => setEqModalDimensions(e.target.value)}
                  placeholder="1450 x 480 x 1120 mm"
                  className="text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Peso Estimado (kg)</Label>
                <Input
                  type="number"
                  value={eqModalWeight}
                  onChange={(e) => setEqModalWeight(Number(e.target.value))}
                  className="text-xs"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Descrição Técnica Adicional</Label>
              <Textarea
                value={eqModalDescription}
                onChange={(e) => setEqModalDescription(e.target.value)}
                rows={2}
                placeholder="Detalhes construtivos, aplicação principal ou compatibilidade..."
                className="text-xs"
              />
            </div>

            <DialogFooter className="pt-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsNewEquipmentModalOpen(false)}
                className="text-xs"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSavingEquipment}
                className="text-xs bg-blue-700 hover:bg-blue-600 text-white flex items-center gap-1.5"
              >
                {isSavingEquipment ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Check className="h-3.5 w-3.5" />
                )}
                Salvar no Catálogo & Usar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL DE PRÉVIA EM PDF DA PROPOSTA */}
      <QuotePdfPreviewDialog
        quote={quoteForPdf}
        open={isPdfPreviewOpen}
        onOpenChange={setIsPdfPreviewOpen}
        viewMode={quoteViewMode}
      />
    </div>
  )
}
