import React, { useState, useEffect, useRef } from 'react'
import {
  FileText,
  Plus,
  Trash2,
  Pencil,
  Save,
  Search,
  CheckCircle,
  Clock,
  Printer,
  Copy,
  FolderOpen,
  DollarSign,
  AlertCircle,
  FileDown,
  RefreshCw,
  Building2,
  Calendar,
  Layers,
  Sparkles,
  Calculator,
  UserPlus,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  Info,
  Check,
  Send,
  Loader2,
  ExternalLink,
  Ban,
  Wrench,
  Percent,
  TrendingUp,
  Receipt,
  RotateCcw,
  Truck,
  ArrowLeftRight,
  Car,
  Mail,
  MoreVertical,
  Eye,
  CheckCheck,
  XCircle,
  Globe,
  Package,
} from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import {
  QuoteRecord,
  ClientRecord,
  DealRecord,
  QuoteStatus,
  QuoteTravelConfig,
  QuoteLodgingMealsConfig,
  QuoteLaborConfig,
  QuoteEquipmentItem,
  QuoteCustomMaterial,
  QuoteChemicalProductItem,
  QuoteMaterialItem,
} from '@/types/crm'
import { QuotePdfPreviewDialog } from './QuotePdfPreviewDialog'
import {
  BLUMENAU_COORDS,
  geocodeCity,
  fetchCepCoordinates,
  haversineDistance,
} from '@/lib/mapeia-calculator'
import {
  quotesService,
  searchEquipmentSpecsOnline,
  searchEquipmentWeb,
  EquipmentWebSearchResultItem,
} from '@/services/quotes'
import { getStandardServiceMethodology } from '@/data/bermo-catalog'
import { equipmentCatalogService, EquipmentCatalogItem } from '@/services/equipment-catalog'
import { clientsService } from '@/services/clients'

export interface QuotesManagerProps {
  quotes: QuoteRecord[]
  clients: ClientRecord[]
  deals?: DealRecord[]
  selectedQuote?: QuoteRecord | null
  onCreateQuote: (data: Partial<QuoteRecord>) => Promise<void>
  onUpdateQuote: (id: string, data: Partial<QuoteRecord>) => Promise<void>
  onDeleteQuote: (id: string) => Promise<void>
  onUpdateQuoteStatus?: (id: string, status: QuoteStatus) => Promise<void>
  onCreateClient?: (data: Partial<ClientRecord>) => Promise<ClientRecord>
  onOpenCatalog?: () => void
}

export function QuotesManager({
  quotes,
  clients,
  deals = [],
  selectedQuote,
  onCreateQuote,
  onUpdateQuote,
  onDeleteQuote,
  onUpdateQuoteStatus,
  onCreateClient,
  onOpenCatalog,
}: QuotesManagerProps) {
  const { toast } = useToast()

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
  const [equipmentBrand, setEquipmentBrand] = useState('BERMO')
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
      brand: 'BERMO',
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
  const [taxRate, setTaxRate] = useState(14.83)
  const [pisRate, setPisRate] = useState(0.65)
  const [cofinsRate, setCofinsRate] = useState(3.0)
  const [issRate, setIssRate] = useState(5.0)
  const [csllRate, setCsllRate] = useState(2.88)
  const [irpjRate, setIrpjRate] = useState(4.8)
  const [irDiffRate, setIrDiffRate] = useState(1.5)

  // Notas e Condições
  const [paymentTerms, setPaymentTerms] = useState('28 DDL faturado após entrega técnica')
  const [validityDays, setValidityDays] = useState(15)
  const [technicalNotes, setTechnicalNotes] = useState('')
  const [commercialNotes, setCommercialNotes] = useState('')

  // Auto-save debounce timer ref (apenas quando o modal de edição está aberto)
  const autoSaveTimerRef = useRef<any>(null)
  const isInitialMount = useRef(true)

  // Cálculos de Peças e Componentes (materials_items)
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

  // Custos Diretos de Serviços (SEM materiais)
  const serviceDirectCostsTotal =
    totalLaborCost + travelTotalCost + lodgingMealsTotalCost + thirdPartyCost + otherCosts

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
              brand: equipmentBrand || 'BERMO',
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
      brand: eq.brand != null && String(eq.brand).trim() ? String(eq.brand).trim() : 'BERMO',
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
      brand: equipmentBrand || 'BERMO',
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
      equipment_brand: primaryEq.brand || equipmentBrand || 'BERMO',
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
      service_details: {
        service_technical_specs: {
          productCode: primaryEq.model || equipmentModel || '',
          productName: primaryEq.model || equipmentModel || '',
          productModel: primaryEq.model || equipmentModel || '',
          productBrand: primaryEq.brand || equipmentBrand || 'BERMO',
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
      },

      final_price: calculatedSalePrice,
      total: calculatedSalePrice,
      subtotal: calculatedSalePrice,
      payment_terms: paymentTerms,
      validity_days: validityDays,
      technical_notes: technicalNotes,
      commercial_notes: commercialNotes,
    }
  }

  // Reset Form para Nova Proposta
  const resetForm = () => {
    setActiveQuoteId(null)
    loadedQuoteIdRef.current = null
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
    setIntegrationRequired(false)
    setIntegrationTiming('same_day')
    setIntegrationWeekday('')
    setIntegrationCost(0)
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
    setIrDiffRate(1.5)
    setTaxRate(17.83)
    setPaymentTerms('')
    setValidityDays(0)
    setTechnicalNotes('')
    setCommercialNotes('')
  }
  // Adicionar equipamento dinâmico
  const handleAddEquipment = () => {
    setEquipments((prev) => [
      ...prev,
      {
        id: `eq-${Date.now()}-${prev.length + 1}`,
        model: '',
        brand: 'BERMO',
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
  }

  // Remover equipamento dinâmico
  const handleRemoveEquipment = (index: number) => {
    setEquipments((prev) => {
      if (prev.length <= 1) return prev
      const next = prev.filter((_, idx) => idx !== index)
      if (index === 0 && next[0]) {
        setEquipmentModel(next[0].model || '')
        setEquipmentBrand(next[0].brand || 'BERMO')
        setEquipmentQuantity(next[0].quantity || 1)
        setPlateCount(next[0].plate_count)
        setPlateMaterial(next[0].plate_material || '')
        setPlateThickness(next[0].plate_thickness)
        setGasketMaterial(next[0].gasket_material || '')
        setConnectionSize(next[0].connection_size || '')
        setPressureTestBar(next[0].pressure_test_bar)
        setWorkingPressureBar(next[0].working_pressure_bar)
      }
      return next
    })
  }

  // Atualizar campo de equipamento dinâmico
  const handleUpdateEquipment = (index: number, patch: Partial<QuoteEquipmentItem>) => {
    setEquipments((prev) => {
      const next = [...prev]
      const curr = next[index] || { id: `eq-${index}` }
      next[index] = { ...curr, ...patch }
      if (index === 0) {
        if (patch.model !== undefined) setEquipmentModel(patch.model)
        if (patch.brand !== undefined) setEquipmentBrand(patch.brand)
        if (patch.quantity !== undefined) setEquipmentQuantity(patch.quantity)
        if (patch.plate_count !== undefined) setPlateCount(patch.plate_count)
        if (patch.plate_material !== undefined) setPlateMaterial(patch.plate_material)
        if (patch.plate_thickness !== undefined) setPlateThickness(patch.plate_thickness)
        if (patch.gasket_material !== undefined) setGasketMaterial(patch.gasket_material)
        if (patch.connection_size !== undefined) setConnectionSize(patch.connection_size)
        if (patch.pressure_test_bar !== undefined) setPressureTestBar(patch.pressure_test_bar)
        if (patch.working_pressure_bar !== undefined)
          setWorkingPressureBar(patch.working_pressure_bar)
      }
      return next
    })
  }

  // Aplica conjunto de especificações técnicas recebido no equipamento especificado
  // Retorna booleano indicando se alguma especificação válida foi aplicada
  const applySpecsToEquipment = (
    index: number,
    specs: any,
    suggestedBrand?: string,
    suggestedModel?: string,
  ): boolean => {
    if (!specs || typeof specs !== 'object') {
      toast({
        title: 'Nenhuma especificação encontrada',
        description:
          'Não foram localizados dados técnicos confirmados para este modelo. Preencha os campos manualmente.',
        variant: 'destructive',
      })
      return false
    }

    const patch: Partial<QuoteEquipmentItem> = {}
    let hasAppliedFields = false

    if (suggestedBrand && suggestedBrand.trim()) {
      patch.brand = suggestedBrand.trim()
    }
    if (suggestedModel && suggestedModel.trim()) {
      patch.model = suggestedModel.trim()
    }
    if (specs.platesCount) {
      const parsed = parseInt(String(specs.platesCount), 10)
      if (!isNaN(parsed) && parsed > 0) {
        patch.plate_count = parsed
        hasAppliedFields = true
      }
    }
    if (specs.material || specs.plateMaterial) {
      const mat = (specs.material || specs.plateMaterial || '').trim()
      if (mat) {
        patch.plate_material = mat
        hasAppliedFields = true
      }
    }
    if (specs.plateThickness) {
      const parsedThick = parseFloat(String(specs.plateThickness))
      if (!isNaN(parsedThick) && parsedThick > 0) {
        patch.plate_thickness = parsedThick
        hasAppliedFields = true
      }
    }
    if (specs.gasketMaterial) {
      const gMat = (specs.gasketMaterial || '').trim()
      if (gMat) {
        patch.gasket_material = gMat
        hasAppliedFields = true
      }
    }
    if (specs.connection || specs.connectionSize) {
      const conn = (specs.connection || specs.connectionSize || '').trim()
      if (conn) {
        patch.connection_size = conn
        hasAppliedFields = true
      }
    }
    if (specs.pressure || specs.workingPressureBar) {
      const rawPress = specs.pressure || specs.workingPressureBar
      const match = String(rawPress).match(/(\d+)/)
      if (match && match[1]) {
        const p = parseInt(match[1], 10)
        if (!isNaN(p) && p > 0) {
          patch.working_pressure_bar = p
          patch.pressure_test_bar = Math.round(p * 1.5)
          hasAppliedFields = true
        }
      }
    }

    if (!hasAppliedFields) {
      toast({
        title: 'Nenhuma especificação encontrada',
        description:
          'Os dados retornados não contêm especificações técnicas confirmadas. O equipamento permaneceu inalterado para inserção manual.',
        variant: 'destructive',
      })
      return false
    }

    handleUpdateEquipment(index, patch)
    return true
  }

  // Executa busca server-side (web/técnica/AI) sem abrir abas externas no navegador
  const handleSearchSpecsOnline = async (index: number) => {
    const item = equipments[index]
    const model = (item?.model || equipmentModel || '').trim()
    const brand = (item?.brand || equipmentBrand || '').trim()

    if (!model) {
      toast({
        title: 'Modelo não informado',
        description: 'Digite o modelo do equipamento antes de buscar especificações.',
        variant: 'destructive',
      })
      return
    }

    setSearchingSpecsIndex(index)
    setWebSearchActiveIndex(index)
    setWebSearchQuery(model)
    setIsWebSearching(true)
    setWebSearchResults([])
    setWebSearchMessage('')

    // Abre o modal interno imediatamente para feedback visual do usuário
    setIsWebSearchModalOpen(true)

    try {
      // 1. Linha primária: consulta o endpoint rico server-side
      const webResult = await searchEquipmentWeb(model, brand)

      if (webResult && webResult.success && webResult.results && webResult.results.length > 0) {
        setWebSearchResults(webResult.results)
        setWebSearchMessage(
          webResult.message || `Localizados ${webResult.results.length} resultados no servidor.`,
        )

        // Se houver apenas 1 resultado exato com specs confirmadas, aplica
        if (webResult.results.length === 1 && webResult.results[0].specs) {
          const first = webResult.results[0]
          const ok = applySpecsToEquipment(index, first.specs, first.brand, first.model)
          if (ok) {
            toast({
              title: 'Especificações aplicadas automaticamente!',
              description: `Ficha técnica de ${first.title} carregada nos campos.`,
            })
          }
        }
      } else {
        // Fallback para endpoint de specs se webResult vier vazio
        const singleResult = await searchEquipmentSpecsOnline(model, brand)
        if (singleResult && singleResult.found && singleResult.specs) {
          const fallbackItem: EquipmentWebSearchResultItem = {
            id: 'fb-specs-1',
            sourceType: 'specs_catalog',
            title:
              singleResult.name || `${singleResult.brand || brand} ${singleResult.model || model}`,
            url: singleResult.source || 'https://bermo.com.br',
            snippet: singleResult.message || 'Dados técnicos oficiais obtidos pelo servidor.',
            brand: singleResult.brand,
            model: singleResult.model,
            specs: singleResult.specs,
            badge: 'Base Técnica BERMO',
          }
          setWebSearchResults([fallbackItem])
          setWebSearchMessage('Especificações localizadas no catálogo técnico interno.')
          applySpecsToEquipment(index, singleResult.specs, singleResult.brand, singleResult.model)
        } else {
          setWebSearchResults([])
          setWebSearchMessage(
            `Nenhum dado encontrado no servidor para "${model}". Você pode preencher manualmente ou copiar o termo abaixo para pesquisa manual.`,
          )
        }
      }
    } catch (err) {
      console.warn('Erro na busca server-side de especificações:', err)
      setWebSearchMessage(
        'O serviço de busca online pelo servidor está momentaneamente indisponível. Utilize a cópia de termos abaixo ou informe os dados manualmente.',
      )
    } finally {
      setIsWebSearching(false)
      setSearchingSpecsIndex(null)
    }
  }

  // Realizar nova busca com texto customizado dentro do modal interno
  const handlePerformInternalQuery = async (customQueryText: string) => {
    const cleanQuery = customQueryText.trim()
    if (!cleanQuery) return

    setIsWebSearching(true)
    setWebSearchMessage('')
    try {
      const activeEq = equipments[webSearchActiveIndex]
      const brand = activeEq?.brand || equipmentBrand || ''
      const res = await searchEquipmentWeb(cleanQuery, brand, cleanQuery)
      if (res && res.results && res.results.length > 0) {
        setWebSearchResults(res.results)
        setWebSearchMessage(res.message || `Localizados ${res.results.length} resultados.`)
      } else {
        setWebSearchResults([])
        setWebSearchMessage(`Nenhum resultado retornado para "${cleanQuery}".`)
      }
    } catch (err) {
      console.warn('Erro ao refinar pesquisa:', err)
      setWebSearchMessage('Falha ao processar pesquisa no servidor.')
    } finally {
      setIsWebSearching(false)
    }
  }

  // Preencher descrição padrão dos serviços
  const handleInsertStandardScope = () => {
    const brandsList = equipments
      .map((e) => e.brand)
      .filter((b): b is string => !!b && b.trim() !== '')
    const standardText = getStandardServiceMethodology(
      brandsList.length > 0 ? brandsList : [equipmentBrand || 'BERMO'],
    )
    setScopeOfWork(standardText)
    toast({
      title: 'Descrição padrão inserida',
      description: 'O escopo técnico foi preenchido com a metodologia de manutenção.',
    })
  }

  // Adicionar Produto Químico (Limpeza / Pintura)
  const handleAddChemicalProduct = () => {
    if (!newChemicalDescription.trim()) {
      toast({
        title: 'Descrição obrigatória',
        description: 'Informe a descrição do produto químico (limpeza ou pintura).',
        variant: 'destructive',
      })
      return
    }
    const qty = Math.max(0.01, Number(newChemicalQty) || 1)
    const unitPrice = Math.max(0, Number(newChemicalUnitPrice) || 0)
    const subtotal = Math.round(qty * unitPrice * 100) / 100
    const newItem: QuoteChemicalProductItem = {
      id: `chem-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      category: newChemicalCategory,
      description: newChemicalDescription.trim(),
      unit: newChemicalUnit,
      quantity: qty,
      unit_price: unitPrice,
      subtotal,
    }
    setChemicalProducts((prev) => [...prev, newItem])
    setNewChemicalDescription('')
    setNewChemicalQty(1)
    setNewChemicalUnitPrice(0)
    toast({
      title: 'Produto químico adicionado',
      description: `${newItem.description} inserido com sucesso.`,
    })
  }

  // Remover Produto Químico (com confirmação)
  const handleRemoveChemicalProduct = (id: string, description?: string) => {
    const itemLabel = description ? `"${description}"` : 'este produto químico'
    if (confirm(`Deseja realmente remover ${itemLabel}?`)) {
      setChemicalProducts((prev) => prev.filter((p) => p.id !== id))
      toast({
        title: 'Produto químico removido',
        description: 'Item removido da lista.',
      })
    }
  }

  // Adicionar Peça / Componente (materials_items)
  const handleAddMaterialItem = () => {
    if (!newPartDescription.trim()) {
      toast({
        title: 'Descrição obrigatória',
        description: 'Informe a descrição da peça ou componente.',
        variant: 'destructive',
      })
      return
    }
    const qty = Math.max(0.01, Number(newPartQty) || 1)
    const unitPrice = Math.max(0, Number(newPartUnitPrice) || 0)
    const subtotal = Math.round(qty * unitPrice * 100) / 100
    const newItem: QuoteMaterialItem = {
      id: `part-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      description: newPartDescription.trim(),
      quantity: qty,
      unit_price: unitPrice,
      subtotal,
    }
    setMaterialsItems((prev) => [...prev, newItem])
    setNewPartDescription('')
    setNewPartQty(1)
    setNewPartUnitPrice(0)
    toast({
      title: 'Peça/componente adicionado',
      description: `${newItem.description} inserido com sucesso.`,
    })
  }

  // Remover Peça / Componente
  const handleRemoveMaterialItem = (id: string) => {
    setMaterialsItems((prev) => prev.filter((item) => item.id !== id))
  }

  // Adicionar Material Customizado
  const handleAddCustomMaterial = () => {
    if (!newMaterialDescription.trim()) {
      toast({
        title: 'Descrição obrigatória',
        description: 'Informe o nome ou descrição do material/peça.',
        variant: 'destructive',
      })
      return
    }
    const qty = Math.max(1, newMaterialQty)
    const unitCost = Math.max(0, newMaterialUnitCost)
    const subtotal = qty * unitCost
    const newItem: QuoteCustomMaterial = {
      id: `mat-${Date.now()}`,
      description: newMaterialDescription.trim(),
      quantity: qty,
      unit_cost: unitCost,
      subtotal,
    }
    const updated = [...customMaterials, newItem]
    setCustomMaterials(updated)
    // Recalcular materialsCost para refletir nos custos diretos
    const sumMat = updated.reduce((acc, m) => acc + (m.subtotal || 0), 0)
    setMaterialsCost(sumMat)
    setNewMaterialDescription('')
    setNewMaterialQty(1)
    setNewMaterialUnitCost(0)
  }

  // Remover Material Customizado
  const handleRemoveCustomMaterial = (id: string) => {
    const updated = customMaterials.filter((m) => m.id !== id)
    setCustomMaterials(updated)
    const sumMat = updated.reduce((acc, m) => acc + (m.subtotal || 0), 0)
    setMaterialsCost(sumMat)
  }

  // Carregar lista completa do catálogo de equipamentos BERMO do banco ao abrir o editor
  useEffect(() => {
    let isMounted = true
    equipmentCatalogService
      .getAll()
      .then((items) => {
        if (isMounted && items && items.length > 0) {
          setAllCatalogEquipments(items)
        }
      })
      .catch((err) => {
        console.warn('Erro ao carregar catálogo de equipamentos inicial:', err)
      })
    return () => {
      isMounted = false
    }
  }, [])

  // Buscar sugestões de equipamentos do catálogo conforme o usuário digita
  const handleModelInputChange = (index: number, val: string) => {
    handleUpdateEquipment(index, { model: val })
    const trimmed = val.trim().toLowerCase()
    if (!trimmed) {
      setActiveCatalogSuggestionsIndex(null)
      setCatalogSuggestions([])
      return
    }

    const cleanNoHyphen = trimmed.replace(/[\s\-_]/g, '')
    const matches = allCatalogEquipments.filter((item) => {
      const m = (item.model || '').toLowerCase()
      const mClean = m.replace(/[\s\-_]/g, '')
      const n = (item.name || '').toLowerCase()
      const s = (item.series || '').toLowerCase()
      const b = (item.brand || '').toLowerCase()
      return (
        m.includes(trimmed) ||
        mClean.includes(cleanNoHyphen) ||
        n.includes(trimmed) ||
        s.includes(trimmed) ||
        b.includes(trimmed)
      )
    })

    setCatalogSuggestions(matches.slice(0, 8))
    setActiveCatalogSuggestionsIndex(index)
  }

  // Ao selecionar um equipamento do catálogo da BERMO no autocomplete
  const handleSelectCatalogItem = (index: number, item: EquipmentCatalogItem) => {
    const patch: Partial<QuoteEquipmentItem> = {
      model: item.model,
      brand: item.brand || 'BERMO',
    }

    if (item.plate_count && item.plate_count > 0) {
      patch.plate_count = item.plate_count
    }
    if (item.plate_material) {
      patch.plate_material = item.plate_material
    }
    if (item.plate_thickness) {
      patch.plate_thickness = item.plate_thickness
    }
    if (item.gasket_material) {
      patch.gasket_material = item.gasket_material
    }
    if (item.connection_size) {
      patch.connection_size = item.connection_size
    }
    if (item.working_pressure_bar) {
      patch.working_pressure_bar = item.working_pressure_bar
      patch.pressure_test_bar =
        item.pressure_test_bar || Math.round(item.working_pressure_bar * 1.5)
    }

    handleUpdateEquipment(index, patch)
    setActiveCatalogSuggestionsIndex(null)
    setCatalogSuggestions([])

    toast({
      title: 'Equipamento BERMO selecionado!',
      description: `${item.name} (${item.model}) preenchido automaticamente com dados da base.`,
    })
  }

  // Carregar Proposta Existente no Formulário
  const loadQuoteIntoForm = (quote: QuoteRecord) => {
    setActiveQuoteId(quote.id)
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
    setEquipmentBrand(quote.equipment_brand || 'BERMO')
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
          brand: quote.equipment_brand || 'BERMO',
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

    setIntegrationRequired(quote.integration_needed ?? (quote as any).integration_required ?? false)
    setIntegrationTiming(quote.integration_timing || quote.integration_when || 'same_day')
    setIntegrationWeekday(
      quote.integration_day || (quote as any).integration_weekday || 'Segunda-feira',
    )
    setIntegrationCost(quote.integration_cost ?? 532.0)
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
    setIrDiffRate(quote.ir_diff_rate ?? quote.pricing_config?.irDiffRate ?? 1.5)
    setPaymentTerms(quote.payment_terms || '28 DDL faturado após entrega técnica')
    setValidityDays(quote.validity_days || 15)
    setTechnicalNotes(quote.technical_notes || '')
    setCommercialNotes(quote.commercial_notes || '')
  }

  // Salvar novo cliente manualmente a partir da Seção 3A
  const handleSaveNewClientQuick = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmedName = newClientName.trim()
    if (!trimmedName) {
      toast({
        title: 'Nome obrigatório',
        description: 'Informe a razão social ou nome do cliente.',
        variant: 'destructive',
      })
      return
    }

    setIsSavingNewClient(true)
    try {
      const clientData: Partial<ClientRecord> = {
        name: trimmedName,
        company_name: trimmedName,
        document: newClientDocument.trim() || undefined,
        email: newClientEmail.trim() || undefined,
        phone: newClientPhone.trim() || undefined,
        whatsapp: newClientPhone.trim() || undefined,
        city: newClientCity.trim() || undefined,
        state: newClientState.trim().toUpperCase() || undefined,
        status: 'prospect',
      }

      if (newClientContact.trim()) {
        clientData.contacts = [
          {
            id: `c-${Date.now()}`,
            name: newClientContact.trim(),
            email: newClientEmail.trim() || undefined,
            phone: newClientPhone.trim() || undefined,
            role: 'Contato Comercial / Manutenção',
          },
        ]
      }

      let created: ClientRecord
      if (onCreateClient) {
        created = await onCreateClient(clientData)
      } else {
        created = await clientsService.create(clientData)
      }

      // Seleciona automaticamente o novo cliente na proposta
      setClientId(created.id)
      setClientName(created.name || created.company_name || trimmedName)
      if (created.address) {
        setDestinationAddress(created.address)
      } else if (created.city || created.state) {
        setDestinationAddress([created.city, created.state].filter(Boolean).join(' - '))
      }

      toast({
        title: 'Cliente cadastrado com sucesso!',
        description: `${created.name} foi adicionado e selecionado na proposta.`,
      })

      // Limpar formulário e fechar modal
      setNewClientName('')
      setNewClientDocument('')
      setNewClientContact('')
      setNewClientEmail('')
      setNewClientPhone('')
      setNewClientCity('')
      setNewClientState('')
      setIsNewClientDialogOpen(false)
    } catch (err: any) {
      console.error('Erro ao cadastrar novo cliente:', err)
      toast({
        title: 'Erro ao cadastrar cliente',
        description: err.message || 'Não foi possível cadastrar o cliente no sistema.',
        variant: 'destructive',
      })
    } finally {
      setIsSavingNewClient(false)
    }
  }

  // Abrir editor para nova proposta
  const handleOpenCreateModal = () => {
    resetForm()
    setIsEditorOpen(true)
  }

  // Abrir editor para editar proposta existente
  const handleOpenEditModal = (quote: QuoteRecord) => {
    loadedQuoteIdRef.current = quote.id
    loadQuoteIntoForm(quote)
    setIsEditorOpen(true)
  }

  // Se receber selectedQuote das props externas (ex: do Kanban ou Pipeline), carrega e abre apenas se mudou de ID ou ao abrir
  // Durante a edição ativa (quando isEditorOpen é true e activeQuoteId === selectedQuote.id), NÃO recarrega para evitar reset/duplicação
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
  const handleRecalculateRouteByCep = async (destCep?: string, origCep?: string) => {
    const dest = (destCep || destinationCep || '').replace(/\D/g, '')
    const orig = (origCep || originCep || '').replace(/\D/g, '')

    if (dest.length !== 8) {
      toast({
        title: 'CEP Inválido',
        description: 'Digite um CEP de destino completo com 8 dígitos para o cálculo.',
      })
      return
    }

    setIsCalculatingRoute(true)
    try {
      const destCoords = await fetchCepCoordinates(dest)
      let origCoords = BLUMENAU_COORDS
      if (orig.length === 8) {
        const customOrig = await fetchCepCoordinates(orig)
        if (customOrig) origCoords = customOrig
      }

      if (!destCoords) {
        toast({
          title: 'Rota manual recomendada',
          description:
            'Não foi possível obter coordenadas para o CEP informado. Ajuste os km manualmente.',
        })
        return
      }

      const straightKm = haversineDistance(
        origCoords.lat,
        origCoords.lng ?? 0,
        destCoords.lat,
        destCoords.lng ?? 0,
        1.0,
      )
      const roadKm = Math.max(10, Math.round(straightKm * 1.25))

      setDistanceKm(roadKm)
      toast({
        title: 'Rota Mapeia Calculada',
        description: `Distância estimada: ${roadKm} km por percurso rodoviário.`,
      })
    } catch (err: any) {
      console.warn('Erro ao calcular rota:', err)
    } finally {
      setIsCalculatingRoute(false)
    }
  }

  const handleRecalculateRouteByCities = async (origCity: string, destCity: string) => {
    setIsCalculatingRoute(true)
    try {
      const [origCoords, destCoords] = await Promise.all([
        geocodeCity(origCity),
        geocodeCity(destCity),
      ])
      if (origCoords && destCoords) {
        const straightKm = haversineDistance(
          origCoords.lat,
          origCoords.lng ?? 0,
          destCoords.lat,
          destCoords.lng ?? 0,
          1.0,
        )
        const roadKm = Math.max(10, Math.round(straightKm * 1.25))

        setDistanceKm(roadKm)
        toast({
          title: 'Rota Calculada',
          description: `${origCity} até ${destCity}: ~${roadKm} km rodoviários.`,
        })
      } else {
        toast({
          title: 'Atenção',
          description: 'Não foi possível localizar uma das cidades informadas.',
        })
      }
    } catch {
      // Ignora erro
    } finally {
      setIsCalculatingRoute(false)
    }
  }

  // Salvar Proposta (Manual) dentro do editor
  const handleSaveQuote = async () => {
    const payload = getFormDataObject()
    setIsSaving(true)
    try {
      if (activeQuoteId) {
        await onUpdateQuote(activeQuoteId, payload)
        toast({ title: 'Alterações salvas com sucesso!' })
      } else {
        await onCreateQuote(payload)
        toast({ title: 'Nova proposta técnica criada!' })
      }
      setIsEditorOpen(false)
    } catch (err: any) {
      toast({
        title: 'Erro ao salvar proposta',
        description: err.message || 'Verifique os dados preenchidos.',
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  // Salvar como Rascunho explicitamente
  const handleSaveDraft = async () => {
    const payload = getFormDataObject()
    payload.status = 'draft'
    setStatus('draft')
    setIsSaving(true)
    try {
      if (activeQuoteId) {
        await onUpdateQuote(activeQuoteId, payload)
        toast({ title: 'Rascunho salvo com sucesso!' })
      } else {
        await onCreateQuote(payload)
        toast({ title: 'Proposta salva como rascunho!' })
      }
      setIsEditorOpen(false)
    } catch (err: any) {
      toast({
        title: 'Erro ao salvar rascunho',
        description: err.message || 'Verifique os dados preenchidos.',
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  // Ações de Mudança de Status
  const handleSetStatus = async (quoteId: string, newStatus: QuoteStatus) => {
    try {
      if (onUpdateQuoteStatus) {
        await onUpdateQuoteStatus(quoteId, newStatus)
      } else {
        await onUpdateQuote(quoteId, { status: newStatus })
      }
      if (activeQuoteId === quoteId) {
        setStatus(newStatus)
      }
      toast({
        title:
          newStatus === 'approved'
            ? '🎉 Proposta Aprovada! Ordem de Serviço (OS) gerada no fluxo técnico.'
            : newStatus === 'rejected'
              ? 'Proposta marcada como recusada'
              : `Status alterado para ${newStatus}`,
      })
    } catch (err: any) {
      toast({
        title: 'Erro ao atualizar status',
        description: err.message,
        variant: 'destructive',
      })
    }
  }

  // Abrir Visualização do PDF nas duas visões
  const handleOpenPdfPreview = (quoteObj: QuoteRecord, mode: 'client' | 'internal' = 'client') => {
    setQuoteForPreview(quoteObj)
    setPreviewViewMode(mode)
    setIsPreviewOpen(true)
  }

  // Excluir proposta com confirmação
  const handleDelete = async (quote: QuoteRecord) => {
    if (
      confirm(
        `Deseja realmente excluir a proposta ${quote.quote_number || ''} do cliente ${quote.client_name || ''}?`,
      )
    ) {
      try {
        await onDeleteQuote(quote.id)
        if (activeQuoteId === quote.id) {
          setIsEditorOpen(false)
          resetForm()
        }
        toast({ title: 'Proposta excluída com sucesso.' })
      } catch (err: any) {
        toast({
          title: 'Erro ao excluir proposta',
          description: err.message,
          variant: 'destructive',
        })
      }
    }
  }

  // Filtragem de Lista de Propostas
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

  const getStatusBadge = (st: QuoteStatus) => {
    switch (st) {
      case 'approved':
        return (
          <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300 font-semibold text-[11px] gap-1">
            <CheckCheck className="h-3 w-3" /> Aprovada
          </Badge>
        )
      case 'rejected':
        return (
          <Badge className="bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border-rose-300 font-semibold text-[11px] gap-1">
            <XCircle className="h-3 w-3" /> Rejeitada
          </Badge>
        )
      case 'sent':
        return (
          <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-300 font-semibold text-[11px] gap-1">
            <Send className="h-3 w-3" /> Enviada
          </Badge>
        )
      default:
        return (
          <Badge
            variant="outline"
            className="text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 border-slate-300 font-semibold text-[11px] gap-1"
          >
            <Clock className="h-3 w-3" /> Rascunho
          </Badge>
        )
    }
  }

  return (
    <div className="space-y-6">
      {/* 1. Barra de Cabeçalho da Gestão de Propostas (Layout de Coluna Única) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Calculator className="h-6 w-6 text-teal-600" />
            Orçamentos de Serviços Intertermal
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            Gestão unificada de propostas comerciais e técnicas: visualize, edite, gere PDF e aprove
            diretamente.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {onOpenCatalog && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onOpenCatalog}
              className="text-xs border-teal-300 text-teal-700 hover:bg-teal-50"
            >
              <Sparkles className="h-3.5 w-3.5 mr-1 text-teal-600" />
              Catálogo BERMO
            </Button>
          )}

          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={handleOpenCreateModal}
            className="text-xs font-bold bg-teal-700 hover:bg-teal-600 text-white shadow-xs"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Nova Proposta
          </Button>
        </div>
      </div>

      {/* 2. Resumo de Métricas (Cards em linha) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="border-slate-200 dark:border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Total de Propostas
              </span>
              <FolderOpen className="h-4 w-4 text-teal-600" />
            </div>
            <div className="mt-2 text-2xl font-bold font-mono text-slate-900 dark:text-slate-100">
              {quotes.length}
            </div>
            <span className="text-[11px] text-muted-foreground mt-0.5 block">
              Volume total emitido
            </span>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Valor em Carteira
              </span>
              <DollarSign className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="mt-2 text-2xl font-bold font-mono text-emerald-700 dark:text-emerald-400">
              {totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>
            <span className="text-[11px] text-muted-foreground mt-0.5 block">
              Soma de todas as propostas
            </span>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Aprovadas / OS
              </span>
              <CheckCircle className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="mt-2 text-2xl font-bold font-mono text-slate-900 dark:text-slate-100">
              {approvedQuotes.length}
              <span className="text-xs text-muted-foreground font-normal ml-1.5">
                ({approvedValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })})
              </span>
            </div>
            <span className="text-[11px] text-emerald-600 font-semibold mt-0.5 block">
              Convertidas para execução
            </span>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Em Negociação
              </span>
              <Clock className="h-4 w-4 text-amber-500" />
            </div>
            <div className="mt-2 text-2xl font-bold font-mono text-amber-600">
              {pendingQuotes.length}
            </div>
            <span className="text-[11px] text-muted-foreground mt-0.5 block">
              Rascunhos ou enviadas
            </span>
          </CardContent>
        </Card>
      </div>

      {/* 3. Filtros e Pesquisa da Lista de Propostas */}
      <Card className="border-slate-200 dark:border-slate-800">
        <CardHeader className="p-4 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="h-4 w-4 absolute left-3 top-2.5 text-muted-foreground" />
              <Input
                placeholder="Buscar por cliente, número, modelo ou título..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="text-xs h-9 pl-9"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="text-xs h-9 w-44">
                  <SelectValue placeholder="Filtrar por Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Status ({quotes.length})</SelectItem>
                  <SelectItem value="draft">
                    Rascunho ({quotes.filter((q) => q.status === 'draft').length})
                  </SelectItem>
                  <SelectItem value="sent">
                    Enviada ({quotes.filter((q) => q.status === 'sent').length})
                  </SelectItem>
                  <SelectItem value="approved">
                    Aprovada ({quotes.filter((q) => q.status === 'approved').length})
                  </SelectItem>
                  <SelectItem value="rejected">
                    Rejeitada ({quotes.filter((q) => q.status === 'rejected').length})
                  </SelectItem>
                </SelectContent>
              </Select>

              {searchTerm && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSearchTerm('')}
                  className="text-xs h-9 text-muted-foreground hover:text-slate-900"
                >
                  Limpar busca
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        {/* 4. Tabela / Lista de Propostas em Coluna Única com Ações Diretas */}
        <CardContent className="p-0">
          {filteredQuotes.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <FolderOpen className="h-10 w-10 text-muted-foreground/50 mx-auto" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Nenhuma proposta encontrada
              </p>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                {searchTerm || statusFilter !== 'all'
                  ? 'Tente ajustar os filtros ou o termo de busca.'
                  : 'Crie sua primeira proposta técnica e comercial clicando no botão acima.'}
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleOpenCreateModal}
                className="text-xs mt-2 border-teal-300 text-teal-700 hover:bg-teal-50"
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                Criar Nova Proposta
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    <th className="py-3 px-4">Proposta</th>
                    <th className="py-3 px-4">Cliente</th>
                    <th className="py-3 px-4">Equipamento / Modelo</th>
                    <th className="py-3 px-4">Responsável</th>
                    <th className="py-3 px-4 text-right">Valor Total</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredQuotes.map((quote) => {
                    const price = quote.total || quote.final_price || 0
                    return (
                      <tr
                        key={quote.id}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-900/60 transition-colors"
                      >
                        {/* Identificação / Número */}
                        <td className="py-3 px-4 font-mono font-bold text-teal-700 dark:text-teal-400 whitespace-nowrap">
                          <div>
                            <span className="font-semibold">{quote.quote_number || 'INT-S/N'}</span>
                            {quote.created && (
                              <span className="block text-[10px] text-muted-foreground font-normal font-sans">
                                {new Date(quote.created).toLocaleDateString('pt-BR')}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Cliente & Oportunidade */}
                        <td className="py-3 px-4 font-medium text-slate-900 dark:text-slate-100">
                          <div
                            className="max-w-[200px] truncate"
                            title={quote.client_name || 'Cliente Sem Nome'}
                          >
                            <span className="font-semibold block">
                              {quote.client_name || 'Cliente Sem Nome'}
                            </span>
                            {quote.deal_title && (
                              <span className="text-[10px] text-teal-600 truncate block">
                                Funil: {quote.deal_title}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Equipamento */}
                        <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                          <div className="max-w-[240px] truncate">
                            {quote.equipments &&
                            Array.isArray(quote.equipments) &&
                            quote.equipments.length > 1 ? (
                              <>
                                <span className="font-medium block truncate">
                                  {quote.equipments
                                    .map((e) => `${e.model || 'Item'} (${e.quantity || 1})`)
                                    .join(' + ')}
                                </span>
                                <span className="text-[10px] text-teal-600 dark:text-teal-400 truncate block font-medium">
                                  {quote.equipments.reduce(
                                    (sum, e) => sum + (Number(e.quantity) || 1),
                                    0,
                                  )}{' '}
                                  unidades em {quote.equipments.length} modelos
                                </span>
                              </>
                            ) : (
                              <>
                                <span className="font-medium block truncate">
                                  {quote.equipment_model
                                    ? `${quote.equipment_brand || 'BERMO'} ${quote.equipment_model}${quote.equipment_quantity && quote.equipment_quantity > 1 ? ` (${quote.equipment_quantity} peças)` : ''}`
                                    : quote.title || 'Manutenção Geral'}
                                </span>
                                <span className="text-[10px] text-muted-foreground truncate block">
                                  {quote.plate_count ? `${quote.plate_count} placas` : ''}{' '}
                                  {quote.gasket_material ? `• ${quote.gasket_material}` : ''}
                                </span>
                              </>
                            )}
                          </div>
                        </td>

                        {/* Responsável */}
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                          {quote.assigned_to || 'Alex Nogueira'}
                        </td>

                        {/* Valor Total */}
                        <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-slate-100 text-right whitespace-nowrap">
                          {price.toLocaleString('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          })}
                        </td>

                        {/* Status */}
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          {getStatusBadge(quote.status || 'draft')}
                        </td>

                        {/* Ações Diretas por Proposta */}
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1">
                            {/* Editar */}
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-8 px-2.5 text-xs font-semibold text-slate-800 dark:text-slate-100 border-slate-300 dark:border-slate-700 hover:bg-teal-50 dark:hover:bg-teal-950/40 hover:text-teal-700 dark:hover:text-teal-300"
                              onClick={() => handleOpenEditModal(quote)}
                              title="Editar Proposta"
                            >
                              <Pencil className="h-3.5 w-3.5 mr-1.5 text-teal-600 dark:text-teal-400" />
                              Editar
                            </Button>

                            {/* Visualizar PDF - Visão Cliente */}
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-8 px-2.5 text-xs text-teal-700 dark:text-teal-400 border-teal-300 hover:bg-teal-50"
                              onClick={() => handleOpenPdfPreview(quote, 'client')}
                              title="Visualizar Proposta em PDF (Visão Cliente)"
                            >
                              <FileText className="h-3.5 w-3.5 mr-1 text-teal-600" />
                              PDF
                            </Button>

                            {/* Menu de Ações Secundárias */}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-slate-500 hover:text-slate-900"
                                >
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-52">
                                <DropdownMenuLabel className="text-xs">
                                  Opções da Proposta
                                </DropdownMenuLabel>
                                <DropdownMenuItem onClick={() => handleOpenEditModal(quote)}>
                                  <Pencil className="h-3.5 w-3.5 mr-2" />
                                  Editar Parâmetros & Custos
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleOpenPdfPreview(quote, 'client')}
                                >
                                  <FileText className="h-3.5 w-3.5 mr-2 text-teal-600" />
                                  Visualizar PDF (Visão Cliente)
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleOpenPdfPreview(quote, 'internal')}
                                >
                                  <SlidersHorizontal className="h-3.5 w-3.5 mr-2 text-amber-600" />
                                  Memória de Cálculo (Visão Interna)
                                </DropdownMenuItem>

                                {(quote.approval_token || quote.id) && (
                                  <DropdownMenuItem
                                    onClick={() => {
                                      const token = quote.approval_token || quote.id
                                      window.open(
                                        `/proposta/${token}`,
                                        '_blank',
                                        'noopener,noreferrer',
                                      )
                                    }}
                                  >
                                    <ExternalLink className="h-3.5 w-3.5 mr-2 text-blue-600" />
                                    Abrir Link de Aceite do Cliente
                                  </DropdownMenuItem>
                                )}

                                <DropdownMenuSeparator />

                                {quote.status !== 'approved' && (
                                  <DropdownMenuItem
                                    onClick={() => handleSetStatus(quote.id, 'approved')}
                                    className="text-emerald-700 dark:text-emerald-400 font-semibold"
                                  >
                                    <CheckCircle className="h-3.5 w-3.5 mr-2 text-emerald-600" />
                                    Aprovar Proposta & Gerar OS
                                  </DropdownMenuItem>
                                )}

                                {quote.status !== 'rejected' && (
                                  <DropdownMenuItem
                                    onClick={() => handleSetStatus(quote.id, 'rejected')}
                                    className="text-rose-700 dark:text-rose-400"
                                  >
                                    <Ban className="h-3.5 w-3.5 mr-2 text-rose-600" />
                                    Marcar como Rejeitada
                                  </DropdownMenuItem>
                                )}

                                {quote.status !== 'draft' && (
                                  <DropdownMenuItem
                                    onClick={() => handleSetStatus(quote.id, 'draft')}
                                  >
                                    <RotateCcw className="h-3.5 w-3.5 mr-2 text-slate-500" />
                                    Voltar para Rascunho
                                  </DropdownMenuItem>
                                )}

                                <DropdownMenuSeparator />

                                <DropdownMenuItem
                                  onClick={() => handleDelete(quote)}
                                  className="text-rose-600 focus:text-rose-600 font-semibold"
                                >
                                  <Trash2 className="h-3.5 w-3.5 mr-2" />
                                  Excluir Proposta
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 5. DIALOG / MODAL DE EDIÇÃO E COMPOSIÇÃO DE PROPOSTA */}
      <Dialog open={isEditorOpen} onOpenChange={setIsEditorOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0 gap-0">
          <DialogHeader className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 sticky top-0 z-10 backdrop-blur-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pr-6">
              <div>
                <DialogTitle className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Calculator className="h-5 w-5 text-teal-600" />
                  Editar Proposta
                </DialogTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {quoteNumber
                    ? `Orçamento nº #${quoteNumber}`
                    : 'Orçamento de Serviços e Equipamentos'}{' '}
                  — Layout integral unificado (5 seções).
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const currentObj = getFormDataObject() as QuoteRecord
                    handleOpenPdfPreview({ ...currentObj, id: activeQuoteId || 'draft' }, 'client')
                  }}
                  className="text-xs border-teal-300 text-teal-700 hover:bg-teal-50"
                >
                  <FileText className="h-3.5 w-3.5 mr-1" />
                  Proposta do Cliente
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const currentObj = getFormDataObject() as QuoteRecord
                    handleOpenPdfPreview(
                      { ...currentObj, id: activeQuoteId || 'draft' },
                      'internal',
                    )
                  }}
                  className="text-xs border-indigo-300 text-indigo-700 hover:bg-indigo-50"
                >
                  <Layers className="h-3.5 w-3.5 mr-1" />
                  Composição Interna
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const currentObj = getFormDataObject() as QuoteRecord
                    handleOpenPdfPreview({ ...currentObj, id: activeQuoteId || 'draft' }, 'client')
                  }}
                  className="text-xs border-slate-300 text-slate-700 hover:bg-slate-50"
                >
                  <Eye className="h-3.5 w-3.5 mr-1" />
                  Visualizar PDF
                </Button>

                <Badge
                  variant="outline"
                  className="text-[11px] font-mono text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 gap-1"
                >
                  <CheckCheck className="h-3 w-3" />
                  {lastSavedAt
                    ? `✓ Salvo em ${new Date(lastSavedAt).toLocaleDateString('pt-BR')} às ${new Date(
                        lastSavedAt,
                      ).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
                    : '✓ Salvo em ' +
                      new Date().toLocaleDateString('pt-BR') +
                      ' às ' +
                      new Date().toLocaleTimeString('pt-BR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                </Badge>

                {activeQuoteId && getStatusBadge(status)}
              </div>
            </div>
          </DialogHeader>

          <div className="p-4 sm:p-6 space-y-5">
            {/* Resumo Financeiro Consolidado */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
              <div className="space-y-0.5">
                <span className="text-[10px] text-muted-foreground uppercase font-bold">
                  Custos Diretos Totais
                </span>
                <div className="font-mono font-bold text-slate-900 dark:text-slate-100 text-sm">
                  {directCostsTotal.toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  })}
                </div>
                <span className="text-[9.5px] text-muted-foreground block">
                  Mão Obra + Desloc. + Hotel + Peças
                </span>
              </div>

              <div className="space-y-0.5">
                <span className="text-[10px] text-muted-foreground uppercase font-bold">
                  Logística & Rotas
                </span>
                <div className="font-mono font-bold text-emerald-700 dark:text-emerald-400 text-sm">
                  {travelTotalCost.toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  })}
                </div>
                <span className="text-[9.5px] text-muted-foreground block">
                  Combustível + Pedágios
                </span>
              </div>

              <div className="space-y-0.5">
                <span className="text-[10px] text-muted-foreground uppercase font-bold">
                  Margem / Markup
                </span>
                <div className="font-mono font-bold text-blue-700 dark:text-blue-400 text-sm">
                  {serviceMargin}% Margem ({adminRate}% Adm)
                </div>
                <span className="text-[9.5px] text-muted-foreground block">
                  Divisor: {(divisor * 100).toFixed(1)}%
                </span>
              </div>

              <div className="space-y-0.5 bg-teal-50 dark:bg-teal-950/60 p-2 rounded-lg border border-teal-200 dark:border-teal-800">
                <span className="text-[10px] text-teal-800 dark:text-teal-300 uppercase font-bold">
                  Preço Final de Venda
                </span>
                <div className="font-mono font-extrabold text-teal-800 dark:text-teal-300 text-base">
                  {calculatedSalePrice.toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  })}
                </div>
                <span className="text-[9.5px] text-teal-700 dark:text-teal-400 block font-semibold">
                  Valor total consolidado
                </span>
              </div>
            </div>

            {/* SEÇÕES EMPILHADAS (Layout Unificado Versão 0.0.66) */}
            <div className="space-y-6">
              {/* SEÇÃO 3A: Escopo / Identificação Técnica */}
              <Card className="border-slate-200 dark:border-slate-800 shadow-xs">
                <CardHeader className="p-4 pb-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <span className="flex items-center justify-center w-7 h-5 rounded bg-teal-600 text-white text-[11px] font-bold">
                        3A
                      </span>
                      3A Escopo / Identificação Técnica
                    </CardTitle>
                    <span className="text-[11px] text-muted-foreground">
                      Dados do cliente, oportunidade, equipamentos, materiais e escopo técnico
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-semibold">Cliente</Label>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setNewClientName('')
                            setNewClientDocument('')
                            setNewClientContact('')
                            setNewClientEmail('')
                            setNewClientPhone('')
                            setNewClientCity('')
                            setNewClientState('')
                            setIsNewClientDialogOpen(true)
                          }}
                          className="h-6 px-1.5 text-[11px] font-semibold text-teal-700 hover:text-teal-800 hover:bg-teal-50 dark:text-teal-300 dark:hover:bg-teal-950/50 flex items-center gap-1"
                          title="Inserir novo cliente manualmente"
                        >
                          <UserPlus className="h-3.5 w-3.5" />
                          <span>Novo cliente</span>
                        </Button>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Select
                          value={clientId}
                          onValueChange={(val) => {
                            setClientId(val)
                            const found = clients.find((c) => c.id === val)
                            if (found) {
                              setClientName(found.name || found.company_name || '')
                              if (found.address) setDestinationAddress(found.address)
                            }
                          }}
                        >
                          <SelectTrigger className="text-xs h-8 flex-1">
                            <SelectValue placeholder="Selecione o cliente..." />
                          </SelectTrigger>
                          <SelectContent>
                            {clients.map((c) => (
                              <SelectItem key={c.id} value={c.id}>
                                {c.name || c.company_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setNewClientName('')
                            setNewClientDocument('')
                            setNewClientContact('')
                            setNewClientEmail('')
                            setNewClientPhone('')
                            setNewClientCity('')
                            setNewClientState('')
                            setIsNewClientDialogOpen(true)
                          }}
                          className="h-8 px-2 text-teal-700 border-teal-300 hover:bg-teal-50 dark:border-teal-700 dark:text-teal-300 dark:hover:bg-teal-950/50 shrink-0"
                          title="Cadastrar novo cliente manualmente"
                        >
                          <UserPlus className="h-3.5 w-3.5" />
                          <span className="sr-only">Cadastrar novo cliente</span>
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs font-semibold">Título da Proposta</Label>
                      <Input
                        value={quoteTitle}
                        onChange={(e) => setQuoteTitle(e.target.value)}
                        placeholder="Ex: Manutenção Preventiva Trocador BP30"
                        className="text-xs h-8"
                      />
                    </div>
                  </div>

                  {/* Vínculo com Oportunidade do Pipeline Comercial & Responsável */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <TrendingUp className="h-3.5 w-3.5 text-teal-600" />
                        Vínculo Oportunidade (CRM)
                      </Label>
                      <Select
                        value={dealId || 'none'}
                        onValueChange={(val) => {
                          if (val === 'none') {
                            setDealId('')
                            return
                          }
                          setDealId(val)
                          const found = deals.find((d) => d.id === val)
                          if (found) {
                            setDealTitle(found.title)
                            if (!clientId && found.client_id) {
                              setClientId(found.client_id)
                              setClientName(found.client_name || '')
                            }
                          }
                        }}
                      >
                        <SelectTrigger className="text-xs h-8">
                          <SelectValue placeholder="Selecione a oportunidade..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Nenhum negócio vinculado</SelectItem>
                          {deals.map((d) => (
                            <SelectItem key={d.id} value={d.id}>
                              {d.title} ({d.client_name || 'Sem cliente'} -{' '}
                              {(d.value || 0).toLocaleString('pt-BR', {
                                style: 'currency',
                                currency: 'BRL',
                              })}
                              )
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Título Oportunidade / Negócio (Livre)
                      </Label>
                      <Input
                        value={dealTitle}
                        onChange={(e) => setDealTitle(e.target.value)}
                        placeholder="Ex: Reforma Trocador Placas Linha 2"
                        className="text-xs h-8"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Responsável Técnico
                      </Label>
                      <Input
                        value={assignedTo}
                        onChange={(e) => setAssignedTo(e.target.value)}
                        placeholder="Ex: Alex Nogueira"
                        className="text-xs h-8"
                      />
                    </div>
                  </div>

                  {/* Bloco Dinâmico de Equipamentos / Itens do Orçamento */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Label className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide">
                          Itens / Equipamentos ({equipments.length})
                        </Label>
                        <span className="text-[11px] text-muted-foreground">
                          Cada equipamento com especificações técnicas próprias
                        </span>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleAddEquipment}
                        className="h-7 text-xs border-dashed border-teal-500 text-teal-700 hover:bg-teal-50 dark:hover:bg-teal-950/40"
                      >
                        <Plus className="h-3.5 w-3.5 mr-1" />
                        Adicionar item
                      </Button>
                    </div>

                    <div className="space-y-3">
                      {equipments.map((eq, eqIdx) => {
                        const isPrimary = eqIdx === 0
                        const currentModel =
                          eq.model != null ? eq.model : isPrimary ? equipmentModel : ''
                        const currentBrand =
                          eq.brand != null && eq.brand !== ''
                            ? eq.brand
                            : isPrimary
                              ? equipmentBrand || 'BERMO'
                              : 'BERMO'
                        const currentQty =
                          eq.quantity != null ? eq.quantity : isPrimary ? equipmentQuantity || 1 : 1
                        const currentPlateCount = eq.plate_count
                        const currentPlateMat = eq.plate_material ?? ''
                        const currentPlateThick = eq.plate_thickness
                        const currentGasketMat = eq.gasket_material ?? ''
                        const currentConnSize = eq.connection_size ?? ''
                        const currentWorkingPress = eq.working_pressure_bar
                        const isSearchingThis = searchingSpecsIndex === eqIdx

                        return (
                          <div
                            key={eq.id || `eq-${eqIdx}`}
                            className="p-3.5 bg-slate-50 dark:bg-slate-900/90 rounded-lg border border-slate-200 dark:border-slate-800 space-y-3 relative shadow-xs"
                          >
                            <div className="flex items-center justify-between gap-2 border-b border-slate-200/80 dark:border-slate-800 pb-2">
                              <div className="flex items-center gap-2">
                                <Badge
                                  variant="secondary"
                                  className="text-[11px] font-mono font-bold bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300"
                                >
                                  Item #{eqIdx + 1}
                                  {isPrimary && ' (Principal)'}
                                </Badge>
                                {currentModel && (
                                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                                    {currentModel}
                                  </span>
                                )}
                                <span className="text-xs text-muted-foreground font-mono">
                                  • {currentQty} {currentQty === 1 ? 'peça/unid.' : 'peças/unid.'}
                                </span>
                                {eq.tag && (
                                  <span className="text-[11px] text-muted-foreground font-mono">
                                    TAG: {eq.tag}
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-1.5">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  disabled={isSearchingThis}
                                  onClick={() => handleSearchSpecsOnline(eqIdx)}
                                  className="h-7 text-xs border-teal-300 text-teal-700 hover:bg-teal-50 dark:border-teal-800 dark:text-teal-300"
                                  title="Buscar especificações técnicas na base técnica ou internet"
                                >
                                  {isSearchingThis ? (
                                    <>
                                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                      Buscando...
                                    </>
                                  ) : (
                                    <>
                                      <Globe className="h-3 w-3 mr-1 text-teal-600" />
                                      Buscar especificações na internet
                                    </>
                                  )}
                                </Button>

                                {equipments.length > 1 && (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleRemoveEquipment(eqIdx)}
                                    className="h-7 px-2 text-xs text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                                    title="Remover este item"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                )}
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                              <div className="space-y-1 sm:col-span-2 relative">
                                <div className="flex items-center justify-between">
                                  <Label className="text-xs font-semibold flex items-center gap-1.5">
                                    <span>Modelo do Equipamento</span>
                                    <span className="text-[10px] text-teal-700 dark:text-teal-400 font-normal">
                                      (Catálogo BERMO integrado)
                                    </span>
                                  </Label>
                                  {currentModel && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        // Abre sugestões mesmo se já digitado
                                        handleModelInputChange(eqIdx, currentModel || 'B')
                                      }}
                                      className="text-[10px] text-teal-600 hover:underline"
                                    >
                                      Ver na base
                                    </button>
                                  )}
                                </div>
                                <Input
                                  value={currentModel}
                                  onChange={(e) => handleModelInputChange(eqIdx, e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault()
                                      // Fecha o autocomplete mantendo o modelo digitado sem alterar campos técnicos
                                      setActiveCatalogSuggestionsIndex(null)
                                    }
                                  }}
                                  onFocus={() => {
                                    if (currentModel && currentModel.trim().length > 0) {
                                      handleModelInputChange(eqIdx, currentModel)
                                    } else {
                                      // Mostra os primeiros itens mais populares da BERMO
                                      setCatalogSuggestions(allCatalogEquipments.slice(0, 8))
                                      setActiveCatalogSuggestionsIndex(eqIdx)
                                    }
                                  }}
                                  placeholder="Ex: BP30, BP6, GP10, BL14, BLN20, ARI-ZESA..."
                                  className="text-xs h-8 font-semibold"
                                  autoComplete="off"
                                />

                                {/* Dropdown de sugestões do catálogo local BERMO */}
                                {activeCatalogSuggestionsIndex === eqIdx && (
                                  <>
                                    <div
                                      className="fixed inset-0 z-40"
                                      onClick={() => setActiveCatalogSuggestionsIndex(null)}
                                    />
                                    <div className="absolute left-0 right-0 top-full mt-1 bg-white dark:bg-slate-900 border border-teal-500/40 dark:border-teal-500/30 rounded-lg shadow-xl z-50 overflow-hidden max-h-72 overflow-y-auto">
                                      <div className="p-2 bg-teal-50/80 dark:bg-teal-950/60 border-b border-teal-100 dark:border-teal-900/60 flex items-center justify-between text-[11px]">
                                        <span className="font-semibold text-teal-900 dark:text-teal-200 flex items-center gap-1">
                                          <Sparkles className="h-3 w-3 text-teal-600" />
                                          Base de dados BERMO ({catalogSuggestions.length}{' '}
                                          encontrado{catalogSuggestions.length !== 1 ? 's' : ''})
                                        </span>
                                        <span className="text-[10px] text-muted-foreground">
                                          Clique para autocompletar
                                        </span>
                                      </div>

                                      {/* Opção em destaque para manter o modelo digitado manualmente sem preencher dados técnicos */}
                                      {currentModel && currentModel.trim() && (
                                        <div className="p-2 bg-amber-50/60 dark:bg-amber-950/30 border-b border-amber-200/60 dark:border-amber-900/40">
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setActiveCatalogSuggestionsIndex(null)
                                              toast({
                                                title: 'Modelo definido manualmente',
                                                description: `Modelo "${currentModel.trim()}" mantido sem dados automáticos. Preencha os campos técnicos se desejar.`,
                                              })
                                            }}
                                            className="w-full text-left p-2 rounded-md bg-white dark:bg-slate-900 hover:bg-amber-100/70 dark:hover:bg-amber-950/50 border border-amber-300 dark:border-amber-800 transition-colors flex items-center justify-between gap-2"
                                          >
                                            <div className="min-w-0 flex-1">
                                              <p className="text-xs font-bold text-amber-900 dark:text-amber-200 truncate">
                                                Usar &ldquo;{currentModel.trim()}&rdquo; (inserir
                                                manualmente, sem dados automáticos)
                                              </p>
                                              <p className="text-[10px] text-muted-foreground mt-0.5">
                                                Mantém os campos técnicos vazios para digitação
                                                livre.
                                              </p>
                                            </div>
                                            <Badge
                                              variant="secondary"
                                              className="text-[9px] px-1.5 py-0.5 h-auto bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-700 shrink-0 font-medium"
                                            >
                                              Manual
                                            </Badge>
                                          </button>
                                        </div>
                                      )}

                                      {catalogSuggestions.length > 0 ? (
                                        <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                          {catalogSuggestions.map((catItem) => (
                                            <button
                                              key={catItem.id}
                                              type="button"
                                              onClick={() =>
                                                handleSelectCatalogItem(eqIdx, catItem)
                                              }
                                              className="w-full text-left p-2.5 hover:bg-teal-50/60 dark:hover:bg-teal-950/40 transition-colors flex items-start justify-between gap-2"
                                            >
                                              <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-1.5 flex-wrap">
                                                  <span className="text-xs font-bold text-teal-700 dark:text-teal-300">
                                                    {catItem.model}
                                                  </span>
                                                  <Badge
                                                    variant="secondary"
                                                    className="text-[9px] px-1 py-0 h-4 bg-slate-100 dark:bg-slate-800"
                                                  >
                                                    {catItem.brand}
                                                  </Badge>
                                                  {catItem.series && (
                                                    <span className="text-[10px] text-muted-foreground truncate">
                                                      • {catItem.series}
                                                    </span>
                                                  )}
                                                </div>
                                                <p className="text-[11px] text-slate-600 dark:text-slate-300 truncate mt-0.5">
                                                  {catItem.name}
                                                </p>
                                                <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-2 flex-wrap">
                                                  {catItem.plate_count ? (
                                                    <span>{catItem.plate_count} placas</span>
                                                  ) : null}
                                                  {catItem.connection_size && (
                                                    <span>Conexão: {catItem.connection_size}</span>
                                                  )}
                                                  {catItem.working_pressure_bar && (
                                                    <span>{catItem.working_pressure_bar} bar</span>
                                                  )}
                                                </div>
                                              </div>
                                              <div className="shrink-0 pt-0.5">
                                                <Badge
                                                  variant="outline"
                                                  className="text-[9px] border-teal-300 text-teal-700 dark:border-teal-700 dark:text-teal-300"
                                                >
                                                  Usar specs
                                                </Badge>
                                              </div>
                                            </button>
                                          ))}
                                        </div>
                                      ) : (
                                        <div className="p-3 text-center space-y-2">
                                          <p className="text-xs text-muted-foreground">
                                            Nenhum equipamento com &ldquo;{currentModel}&rdquo;
                                            encontrado na base local BERMO.
                                          </p>
                                          <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                              setActiveCatalogSuggestionsIndex(null)
                                              handleSearchSpecsOnline(eqIdx)
                                            }}
                                            className="h-7 text-xs border-teal-400 text-teal-700 hover:bg-teal-50 dark:border-teal-800 dark:text-teal-300"
                                          >
                                            <Globe className="h-3 w-3 mr-1 text-teal-600" />
                                            Buscar especificações na internet
                                          </Button>
                                        </div>
                                      )}
                                    </div>
                                  </>
                                )}
                              </div>

                              <div className="space-y-1">
                                <Label className="text-xs font-semibold">Marca</Label>
                                <Input
                                  value={currentBrand}
                                  onChange={(e) =>
                                    handleUpdateEquipment(eqIdx, { brand: e.target.value })
                                  }
                                  placeholder="Ex: BERMO / Alfa Laval"
                                  className="text-xs h-8"
                                />
                              </div>

                              <div className="space-y-1">
                                <Label className="text-xs font-semibold">Quantidade</Label>
                                <Input
                                  type="number"
                                  min="1"
                                  value={currentQty}
                                  onChange={(e) =>
                                    handleUpdateEquipment(eqIdx, {
                                      quantity: Math.max(1, Number(e.target.value)),
                                    })
                                  }
                                  className="text-xs h-8 font-mono"
                                />
                              </div>
                            </div>

                            {/* Detalhes Técnicos de Placas / Gaxetas */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                              <div className="space-y-1">
                                <Label className="text-[10px] text-muted-foreground">
                                  Qtd. de Placas
                                </Label>
                                <Input
                                  type="number"
                                  value={currentPlateCount ?? ''}
                                  onChange={(e) =>
                                    handleUpdateEquipment(eqIdx, {
                                      plate_count:
                                        e.target.value === '' ? undefined : Number(e.target.value),
                                    })
                                  }
                                  placeholder="Ex: 40"
                                  className="text-xs h-7 font-mono bg-white dark:bg-slate-950"
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-[10px] text-muted-foreground">
                                  Material da Placa
                                </Label>
                                <Input
                                  value={currentPlateMat ?? ''}
                                  onChange={(e) =>
                                    handleUpdateEquipment(eqIdx, {
                                      plate_material: e.target.value,
                                    })
                                  }
                                  placeholder="Ex: AISI 316L"
                                  className="text-xs h-7 bg-white dark:bg-slate-950"
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-[10px] text-muted-foreground">
                                  Espessura (mm)
                                </Label>
                                <Input
                                  type="number"
                                  step="0.1"
                                  value={currentPlateThick ?? ''}
                                  onChange={(e) =>
                                    handleUpdateEquipment(eqIdx, {
                                      plate_thickness:
                                        e.target.value === '' ? undefined : Number(e.target.value),
                                    })
                                  }
                                  placeholder="Ex: 0.5"
                                  className="text-xs h-7 font-mono bg-white dark:bg-slate-950"
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-[10px] text-muted-foreground">Gaxeta</Label>
                                <Input
                                  value={currentGasketMat ?? ''}
                                  onChange={(e) =>
                                    handleUpdateEquipment(eqIdx, {
                                      gasket_material: e.target.value,
                                    })
                                  }
                                  placeholder="Ex: EPDM Clip-on"
                                  className="text-xs h-7 bg-white dark:bg-slate-950"
                                />
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    {/* Bloco: Produtos Químicos (Limpeza e Pintura) */}
                    <div className="p-3.5 bg-slate-50 dark:bg-slate-900/90 rounded-lg border border-slate-200 dark:border-slate-800 space-y-3 shadow-xs">
                      <div className="flex items-center justify-between gap-2 border-b border-slate-200/80 dark:border-slate-800 pb-2">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="secondary"
                            className="text-[11px] font-bold bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300"
                          >
                            Insumos Químicos
                          </Badge>
                          <Label className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide">
                            Produtos Químicos (Limpeza e Pintura)
                          </Label>
                        </div>
                        <span className="text-xs font-mono font-bold text-teal-700 dark:text-teal-400">
                          Total Químicos:{' '}
                          {chemicalProductsTotal.toLocaleString('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          })}
                        </span>
                      </div>

                      {/* Formulário de inserção rápida */}
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end bg-white dark:bg-slate-950 p-2.5 rounded-md border border-slate-200 dark:border-slate-800">
                        <div className="sm:col-span-2 space-y-1">
                          <Label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                            Finalidade
                          </Label>
                          <div className="flex gap-1">
                            <button
                              type="button"
                              onClick={() => setNewChemicalCategory('cleaning')}
                              className={`flex-1 text-[11px] py-1 px-1.5 rounded font-medium transition-colors border ${
                                newChemicalCategory === 'cleaning'
                                  ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                              }`}
                            >
                              Limpeza
                            </button>
                            <button
                              type="button"
                              onClick={() => setNewChemicalCategory('painting')}
                              className={`flex-1 text-[11px] py-1 px-1.5 rounded font-medium transition-colors border ${
                                newChemicalCategory === 'painting'
                                  ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                              }`}
                            >
                              Pintura
                            </button>
                          </div>
                        </div>

                        <div className="sm:col-span-4 space-y-1">
                          <Label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                            Descrição do Produto Químico
                          </Label>
                          <Input
                            value={newChemicalDescription}
                            onChange={(e) => setNewChemicalDescription(e.target.value)}
                            placeholder={
                              newChemicalCategory === 'cleaning'
                                ? 'Ex: Desengraxante alcalino, solvente decapante...'
                                : 'Ex: Fundo primer epóxi, esmalte poliuretano...'
                            }
                            className="text-xs h-8"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault()
                                handleAddChemicalProduct()
                              }
                            }}
                          />
                        </div>

                        <div className="sm:col-span-2 space-y-1">
                          <Label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                            Unidade
                          </Label>
                          <Select
                            value={newChemicalUnit}
                            onValueChange={(val: 'L' | 'kg' | 'un' | 'gl' | 'lata') =>
                              setNewChemicalUnit(val)
                            }
                          >
                            <SelectTrigger className="text-xs h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="L">L (Litro)</SelectItem>
                              <SelectItem value="kg">kg (Quilograma)</SelectItem>
                              <SelectItem value="un">un (Unidade)</SelectItem>
                              <SelectItem value="gl">gl (Galão)</SelectItem>
                              <SelectItem value="lata">lata (Lata)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="sm:col-span-1 space-y-1">
                          <Label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                            Qtd
                          </Label>
                          <Input
                            type="number"
                            step="any"
                            min="0.01"
                            value={newChemicalQty}
                            onChange={(e) => setNewChemicalQty(parseFloat(e.target.value) || 0)}
                            className="text-xs h-8 font-mono"
                          />
                        </div>

                        <div className="sm:col-span-2 space-y-1">
                          <Label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                            Preço Unit. (R$)
                          </Label>
                          <Input
                            type="number"
                            step="any"
                            min="0"
                            value={newChemicalUnitPrice}
                            onChange={(e) =>
                              setNewChemicalUnitPrice(parseFloat(e.target.value) || 0)
                            }
                            className="text-xs h-8 font-mono"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault()
                                handleAddChemicalProduct()
                              }
                            }}
                          />
                        </div>

                        <div className="sm:col-span-12 sm:flex sm:justify-end">
                          <Button
                            type="button"
                            onClick={handleAddChemicalProduct}
                            className="h-8 text-xs bg-teal-600 hover:bg-teal-700 text-white font-semibold gap-1.5 px-3"
                            title="+ Adicionar produto químico"
                          >
                            <Plus className="h-3.5 w-3.5" />
                            <span>+ Adicionar produto químico</span>
                          </Button>
                        </div>
                      </div>

                      {/* Lista de Produtos Químicos Adicionados */}
                      {chemicalProducts.length > 0 ? (
                        <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-md bg-white dark:bg-slate-950">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 text-[11px] text-muted-foreground uppercase">
                              <tr>
                                <th className="p-2 w-10 text-center">#</th>
                                <th className="p-2 w-24">Finalidade</th>
                                <th className="p-2">Descrição</th>
                                <th className="p-2 w-16 text-center">Unid.</th>
                                <th className="p-2 w-20 text-right">Qtd</th>
                                <th className="p-2 w-24 text-right">Preço Unit.</th>
                                <th className="p-2 w-24 text-right">Subtotal</th>
                                <th className="p-2 w-12 text-center">Ação</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                              {chemicalProducts.map((p, idx) => {
                                const isCleaning = p.category === 'cleaning'
                                return (
                                  <tr
                                    key={p.id || idx}
                                    className="hover:bg-slate-50/70 dark:hover:bg-slate-900/40"
                                  >
                                    <td className="p-2 text-center text-muted-foreground font-mono">
                                      {idx + 1}
                                    </td>
                                    <td className="p-2">
                                      <Badge
                                        variant="secondary"
                                        className={`text-[10px] font-semibold ${
                                          isCleaning
                                            ? 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300 border-teal-300'
                                            : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-300'
                                        }`}
                                      >
                                        {isCleaning ? 'Limpeza' : 'Pintura'}
                                      </Badge>
                                    </td>
                                    <td className="p-2 font-medium text-slate-800 dark:text-slate-200">
                                      {p.description}
                                    </td>
                                    <td className="p-2 text-center font-mono text-muted-foreground">
                                      {p.unit}
                                    </td>
                                    <td className="p-2 text-right font-mono font-semibold">
                                      {p.quantity}
                                    </td>
                                    <td className="p-2 text-right font-mono text-muted-foreground">
                                      {(p.unit_price || 0).toLocaleString('pt-BR', {
                                        style: 'currency',
                                        currency: 'BRL',
                                      })}
                                    </td>
                                    <td className="p-2 text-right font-mono font-bold text-slate-900 dark:text-slate-100">
                                      {(p.subtotal || 0).toLocaleString('pt-BR', {
                                        style: 'currency',
                                        currency: 'BRL',
                                      })}
                                    </td>
                                    <td className="p-2 text-center">
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() =>
                                          handleRemoveChemicalProduct(p.id, p.description)
                                        }
                                        className="h-6 w-6 p-0 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                                        title="Remover produto químico"
                                      >
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </Button>
                                    </td>
                                  </tr>
                                )
                              })}
                            </tbody>
                            <tfoot className="bg-slate-50 dark:bg-slate-900/60 border-t border-slate-200 dark:border-slate-800 font-semibold">
                              <tr>
                                <td colSpan={6} className="p-2 text-right text-xs">
                                  Somatório dos Produtos Químicos:
                                </td>
                                <td className="p-2 text-right font-mono font-bold text-teal-700 dark:text-teal-300 text-xs">
                                  {chemicalProductsTotal.toLocaleString('pt-BR', {
                                    style: 'currency',
                                    currency: 'BRL',
                                  })}
                                </td>
                                <td></td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>
                      ) : (
                        <div className="p-3 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-md bg-slate-50/50 dark:bg-slate-900/30">
                          <p className="text-xs text-muted-foreground">
                            Nenhum produto químico cadastrado para esta proposta. Use os campos
                            acima para quantificar produtos de limpeza e pintura.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Bloco: Custo de Materiais & Peças */}
                  <div className="p-3.5 bg-slate-50 dark:bg-slate-900/90 rounded-lg border border-slate-200 dark:border-slate-800 space-y-3 shadow-xs">
                    <div className="flex items-center justify-between gap-2 border-b border-slate-200/80 dark:border-slate-800 pb-2">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="secondary"
                          className="text-[11px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                        >
                          Materiais
                        </Badge>
                        <Label className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide">
                          Materiais / Peças / Componentes
                        </Label>
                      </div>
                      <span className="text-xs font-mono font-bold text-amber-700 dark:text-amber-400">
                        Total Materiais (com peças):{' '}
                        {totalMaterialsCostCombined.toLocaleString('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        })}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end bg-white dark:bg-slate-950 p-2.5 rounded-md border border-slate-200 dark:border-slate-800">
                      <div className="space-y-1">
                        <Label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                          Custo Direto de Materiais (R$)
                        </Label>
                        <Input
                          type="number"
                          step="any"
                          min="0"
                          value={materialsCost}
                          onChange={(e) => setMaterialsCost(parseFloat(e.target.value) || 0)}
                          placeholder="0,00"
                          className="text-xs h-8 font-mono"
                        />
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        Informe o valor direto de materiais ou use a tabela de peças e componentes
                        abaixo. Ambos somam ao custo de materiais.
                      </p>
                    </div>

                    {/* Bloco: Peças e Componentes (materials_items) */}
                    <div className="space-y-2.5 pt-2 border-t border-slate-200 dark:border-slate-800">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Package className="h-3.5 w-3.5 text-amber-700 dark:text-amber-400" />
                          <Label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                            Peças e Componentes ({materialsItems.length})
                          </Label>
                        </div>
                        <span className="text-xs font-mono font-bold text-amber-700 dark:text-amber-400">
                          Total do Grupo:{' '}
                          {materialsItemsTotal.toLocaleString('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          })}
                        </span>
                      </div>

                      {/* Formulário para Inserir Peça / Componente */}
                      <div className="p-2.5 bg-white dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800 space-y-2">
                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-end">
                          <div className="sm:col-span-5 space-y-1">
                            <Label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                              Descrição da Peça / Componente
                            </Label>
                            <Input
                              value={newPartDescription}
                              onChange={(e) => setNewPartDescription(e.target.value)}
                              placeholder="Ex: Jogo de Gaxetas NBR Clip-on, Placa Inox 316 0.5mm..."
                              className="text-xs h-8"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault()
                                  handleAddMaterialItem()
                                }
                              }}
                            />
                          </div>

                          <div className="sm:col-span-2 space-y-1">
                            <Label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                              Quantidade
                            </Label>
                            <Input
                              type="number"
                              step="any"
                              min="0.01"
                              value={newPartQty}
                              onChange={(e) => setNewPartQty(parseFloat(e.target.value) || 0)}
                              className="text-xs h-8 font-mono text-center"
                            />
                          </div>

                          <div className="sm:col-span-2 space-y-1">
                            <Label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                              Preço Unit. (R$)
                            </Label>
                            <Input
                              type="number"
                              step="any"
                              min="0"
                              value={newPartUnitPrice}
                              onChange={(e) => setNewPartUnitPrice(parseFloat(e.target.value) || 0)}
                              placeholder="0,00"
                              className="text-xs h-8 font-mono text-right"
                            />
                          </div>

                          <div className="sm:col-span-3 flex items-center gap-2">
                            <div className="flex-1 text-right">
                              <span className="text-[10px] text-muted-foreground block">
                                Subtotal
                              </span>
                              <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200 block truncate">
                                {((newPartQty || 0) * (newPartUnitPrice || 0)).toLocaleString(
                                  'pt-BR',
                                  { style: 'currency', currency: 'BRL' },
                                )}
                              </span>
                            </div>
                            <Button
                              type="button"
                              size="sm"
                              onClick={handleAddMaterialItem}
                              className="h-8 px-3 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shrink-0"
                            >
                              <Plus className="h-3.5 w-3.5 mr-1" />
                              Adicionar Peça
                            </Button>
                          </div>
                        </div>
                      </div>

                      {/* Lista de Peças e Componentes Adicionados */}
                      {materialsItems.length > 0 ? (
                        <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden bg-white dark:bg-slate-950">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-amber-50/70 dark:bg-amber-950/40 text-slate-700 dark:text-slate-300 uppercase text-[10px] font-bold border-b border-slate-200 dark:border-slate-800">
                              <tr>
                                <th className="p-2 w-8 text-center">#</th>
                                <th className="p-2">Descrição</th>
                                <th className="p-2 text-right w-20">Qtd</th>
                                <th className="p-2 text-right w-28">Preço Unit.</th>
                                <th className="p-2 text-right w-28">Subtotal</th>
                                <th className="p-2 w-10 text-center">Ações</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                              {materialsItems.map((item, idx) => {
                                const qty = Number(item.quantity) || 0
                                const unitPrice = Number(item.unit_price) || 0
                                const sub = Number(item.subtotal) || qty * unitPrice
                                return (
                                  <tr
                                    key={item.id || idx}
                                    className="hover:bg-slate-50/70 dark:hover:bg-slate-900/60"
                                  >
                                    <td className="p-2 text-center font-mono text-slate-400 text-[11px]">
                                      {idx + 1}
                                    </td>
                                    <td className="p-2 font-medium text-slate-900 dark:text-slate-100">
                                      {item.description}
                                    </td>
                                    <td className="p-2 text-right font-mono font-semibold">
                                      {qty}
                                    </td>
                                    <td className="p-2 text-right font-mono text-slate-700 dark:text-slate-300">
                                      {unitPrice.toLocaleString('pt-BR', {
                                        style: 'currency',
                                        currency: 'BRL',
                                      })}
                                    </td>
                                    <td className="p-2 text-right font-mono font-bold text-slate-900 dark:text-slate-100">
                                      {sub.toLocaleString('pt-BR', {
                                        style: 'currency',
                                        currency: 'BRL',
                                      })}
                                    </td>
                                    <td className="p-2 text-center">
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleRemoveMaterialItem(item.id)}
                                        className="h-7 w-7 p-0 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                                        title="Remover peça"
                                      >
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </Button>
                                    </td>
                                  </tr>
                                )
                              })}
                            </tbody>
                            <tfoot className="bg-slate-50 dark:bg-slate-900/80 font-bold border-t border-slate-200 dark:border-slate-800">
                              <tr>
                                <td
                                  colSpan={4}
                                  className="p-2 text-right text-slate-700 dark:text-slate-300"
                                >
                                  Total do Grupo (Peças e Componentes):
                                </td>
                                <td className="p-2 text-right font-mono text-amber-700 dark:text-amber-400 font-bold">
                                  {materialsItemsTotal.toLocaleString('pt-BR', {
                                    style: 'currency',
                                    currency: 'BRL',
                                  })}
                                </td>
                                <td></td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>
                      ) : (
                        <p className="text-[11px] text-muted-foreground italic px-1">
                          Nenhuma peça ou componente adicionado. Utilize o formulário acima para
                          inserir itens detalhados (ex: gaxetas, placas adicionais, tirantes).
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-semibold">
                        Escopo Detalhado do Fornecimento
                      </Label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleInsertStandardScope}
                        className="h-6 px-2 text-[11px] text-teal-700 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-950/40"
                      >
                        <Sparkles className="h-3 w-3 mr-1 text-teal-600" />
                        Inserir descrição padrão
                      </Button>
                    </div>
                    <Textarea
                      rows={4}
                      value={scopeOfWork}
                      onChange={(e) => setScopeOfWork(e.target.value)}
                      placeholder="Descreva detalhadamente a metodologia técnica e escopo do serviço..."
                      className="text-xs leading-relaxed"
                    />
                  </div>

                  {/* Mensagem ao Cliente e Observações Técnicas */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold">
                        Mensagem ao Cliente (Aparece na Proposta / PDF)
                      </Label>
                      <Textarea
                        rows={2}
                        value={commercialNotes}
                        onChange={(e) => setCommercialNotes(e.target.value)}
                        placeholder="Ex: Prezado cliente, apresentamos nossa proposta técnica e comercial..."
                        className="text-xs"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs font-semibold">
                        Observações Técnicas / Restrições de Campo
                      </Label>
                      <Textarea
                        rows={2}
                        value={technicalNotes}
                        onChange={(e) => setTechnicalNotes(e.target.value)}
                        placeholder="Ex: Ponto de água e energia 220V fornecidos pelo contratante..."
                        className="text-xs"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* SEÇÃO 3B: Mão de Obra */}
              <Card className="border-slate-200 dark:border-slate-800 shadow-xs">
                <CardHeader className="p-4 pb-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <span className="flex items-center justify-center w-7 h-5 rounded bg-teal-600 text-white text-[11px] font-bold">
                        3B
                      </span>
                      3B Mão de Obra
                    </CardTitle>
                    <span className="text-xs font-mono font-bold text-teal-700 dark:text-teal-400">
                      Subtotal:{' '}
                      {totalLaborCost.toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      })}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 space-y-2">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                        Técnico Mecânico
                      </span>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="space-y-0.5">
                          <Label className="text-[10px] text-muted-foreground">Qtd</Label>
                          <Input
                            type="number"
                            min="0"
                            value={techCount}
                            onChange={(e) => setTechCount(Number(e.target.value))}
                            className="text-xs h-7 font-mono"
                          />
                        </div>
                        <div className="space-y-0.5">
                          <Label className="text-[10px] text-muted-foreground">Horas</Label>
                          <Input
                            type="number"
                            min="0"
                            value={techHours}
                            onChange={(e) => setTechHours(Number(e.target.value))}
                            className="text-xs h-7 font-mono"
                          />
                        </div>
                        <div className="space-y-0.5">
                          <Label className="text-[10px] text-muted-foreground">R$/h</Label>
                          <Input
                            type="number"
                            min="0"
                            value={techRate}
                            onChange={(e) => setTechRate(Number(e.target.value))}
                            className="text-xs h-7 font-mono"
                          />
                        </div>
                      </div>
                      <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300 font-mono text-right pt-1">
                        Subtotal:{' '}
                        {techTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </div>
                    </div>

                    <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 space-y-2">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                        Ajudante / Auxiliar
                      </span>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="space-y-0.5">
                          <Label className="text-[10px] text-muted-foreground">Qtd</Label>
                          <Input
                            type="number"
                            min="0"
                            value={helperCount}
                            onChange={(e) => setHelperCount(Number(e.target.value))}
                            className="text-xs h-7 font-mono"
                          />
                        </div>
                        <div className="space-y-0.5">
                          <Label className="text-[10px] text-muted-foreground">Horas</Label>
                          <Input
                            type="number"
                            min="0"
                            value={helperHours}
                            onChange={(e) => setHelperHours(Number(e.target.value))}
                            className="text-xs h-7 font-mono"
                          />
                        </div>
                        <div className="space-y-0.5">
                          <Label className="text-[10px] text-muted-foreground">R$/h</Label>
                          <Input
                            type="number"
                            min="0"
                            value={helperRate}
                            onChange={(e) => setHelperRate(Number(e.target.value))}
                            className="text-xs h-7 font-mono"
                          />
                        </div>
                      </div>
                      <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300 font-mono text-right pt-1">
                        Subtotal:{' '}
                        {helperTotal.toLocaleString('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        })}
                      </div>
                    </div>

                    <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 space-y-2">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                        Inspetor END / Qualidade
                      </span>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="space-y-0.5">
                          <Label className="text-[10px] text-muted-foreground">Qtd</Label>
                          <Input
                            type="number"
                            min="0"
                            value={inspectorCount}
                            onChange={(e) => setInspectorCount(Number(e.target.value))}
                            className="text-xs h-7 font-mono"
                          />
                        </div>
                        <div className="space-y-0.5">
                          <Label className="text-[10px] text-muted-foreground">Horas</Label>
                          <Input
                            type="number"
                            min="0"
                            value={inspectorHours}
                            onChange={(e) => setInspectorHours(Number(e.target.value))}
                            className="text-xs h-7 font-mono"
                          />
                        </div>
                        <div className="space-y-0.5">
                          <Label className="text-[10px] text-muted-foreground">R$/h</Label>
                          <Input
                            type="number"
                            min="0"
                            value={inspectorRate}
                            onChange={(e) => setInspectorRate(Number(e.target.value))}
                            className="text-xs h-7 font-mono"
                          />
                        </div>
                      </div>
                      <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300 font-mono text-right pt-1">
                        Subtotal:{' '}
                        {inspectorTotal.toLocaleString('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Linha 2 de Funções */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                    <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 space-y-2">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                        Soldador Especializado (TIG / Eletrodo)
                      </span>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="space-y-0.5">
                          <Label className="text-[10px] text-muted-foreground">Qtd</Label>
                          <Input
                            type="number"
                            min="0"
                            value={welderCount}
                            onChange={(e) => setWelderCount(Number(e.target.value))}
                            className="text-xs h-7 font-mono"
                          />
                        </div>
                        <div className="space-y-0.5">
                          <Label className="text-[10px] text-muted-foreground">Horas</Label>
                          <Input
                            type="number"
                            min="0"
                            value={welderHours}
                            onChange={(e) => setWelderHours(Number(e.target.value))}
                            className="text-xs h-7 font-mono"
                          />
                        </div>
                        <div className="space-y-0.5">
                          <Label className="text-[10px] text-muted-foreground">R$/h</Label>
                          <Input
                            type="number"
                            min="0"
                            value={welderRate}
                            onChange={(e) => setWelderRate(Number(e.target.value))}
                            className="text-xs h-7 font-mono"
                          />
                        </div>
                      </div>
                      <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300 font-mono text-right pt-1">
                        Subtotal:{' '}
                        {welderTotal.toLocaleString('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        })}
                      </div>
                    </div>

                    <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 space-y-2">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                        Encanador Industrial / Tubulações
                      </span>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="space-y-0.5">
                          <Label className="text-[10px] text-muted-foreground">Qtd</Label>
                          <Input
                            type="number"
                            min="0"
                            value={plumberCount}
                            onChange={(e) => setPlumberCount(Number(e.target.value))}
                            className="text-xs h-7 font-mono"
                          />
                        </div>
                        <div className="space-y-0.5">
                          <Label className="text-[10px] text-muted-foreground">Horas</Label>
                          <Input
                            type="number"
                            min="0"
                            value={plumberHours}
                            onChange={(e) => setPlumberHours(Number(e.target.value))}
                            className="text-xs h-7 font-mono"
                          />
                        </div>
                        <div className="space-y-0.5">
                          <Label className="text-[10px] text-muted-foreground">R$/h</Label>
                          <Input
                            type="number"
                            min="0"
                            value={plumberRate}
                            onChange={(e) => setPlumberRate(Number(e.target.value))}
                            className="text-xs h-7 font-mono"
                          />
                        </div>
                      </div>
                      <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300 font-mono text-right pt-1">
                        Subtotal:{' '}
                        {plumberTotal.toLocaleString('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        })}
                      </div>
                    </div>

                    <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 space-y-2">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                        Encarregado de Equipe / Supervisão
                      </span>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="space-y-0.5">
                          <Label className="text-[10px] text-muted-foreground">Qtd</Label>
                          <Input
                            type="number"
                            min="0"
                            value={foremanCount}
                            onChange={(e) => setForemanCount(Number(e.target.value))}
                            className="text-xs h-7 font-mono"
                          />
                        </div>
                        <div className="space-y-0.5">
                          <Label className="text-[10px] text-muted-foreground">Horas</Label>
                          <Input
                            type="number"
                            min="0"
                            value={foremanHours}
                            onChange={(e) => setForemanHours(Number(e.target.value))}
                            className="text-xs h-7 font-mono"
                          />
                        </div>
                        <div className="space-y-0.5">
                          <Label className="text-[10px] text-muted-foreground">R$/h</Label>
                          <Input
                            type="number"
                            min="0"
                            value={foremanRate}
                            onChange={(e) => setForemanRate(Number(e.target.value))}
                            className="text-xs h-7 font-mono"
                          />
                        </div>
                      </div>
                      <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300 font-mono text-right pt-1">
                        Subtotal:{' '}
                        {foremanTotal.toLocaleString('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-teal-50 dark:bg-teal-950/40 rounded-lg border border-teal-200 dark:border-teal-800">
                    <span className="text-xs font-bold text-teal-900 dark:text-teal-200">
                      Total da Mão de Obra ({totalLaborHours} horas homem)
                    </span>
                    <span className="font-mono font-bold text-sm text-teal-900 dark:text-teal-200">
                      {totalLaborCost.toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      })}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* SEÇÃO 3C: Deslocamento & Rotas */}
              <Card className="border-slate-200 dark:border-slate-800 shadow-xs">
                <CardHeader className="p-4 pb-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <span className="flex items-center justify-center w-7 h-5 rounded bg-teal-600 text-white text-[11px] font-bold">
                        3C
                      </span>
                      3C Deslocamento & Rotas
                    </CardTitle>
                    <span className="text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400">
                      Subtotal:{' '}
                      {travelTotalCost.toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      })}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Truck className="h-4 w-4 text-emerald-600" />
                        <span className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                          Deslocamento & Rotas (Ref. Mapeia / ViaCEP / Haversine)
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 bg-white dark:bg-slate-950 px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-800">
                          <ArrowLeftRight
                            className={`h-3.5 w-3.5 ${isRoundTrip ? 'text-emerald-600' : 'text-slate-400'}`}
                          />
                          <Label
                            htmlFor="toggle-round-trip-modal"
                            className="text-xs font-semibold cursor-pointer select-none"
                          >
                            {isRoundTrip ? 'Ida e Volta (×2)' : 'Apenas Ida (×1)'}
                          </Label>
                          <Switch
                            id="toggle-round-trip-modal"
                            checked={isRoundTrip}
                            onCheckedChange={setIsRoundTrip}
                          />
                        </div>

                        <span className="text-xs font-bold text-emerald-600 font-mono">
                          Subtotal:{' '}
                          {travelTotalCost.toLocaleString('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          })}
                        </span>
                      </div>
                    </div>

                    {/* CEPs */}
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
                                handleRecalculateRouteByCep(destinationCep, val)
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
                                handleRecalculateRouteByCep(val, originCep)
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

                    {/* Parâmetros do percurso */}
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
                      </div>

                      <div className="space-y-1">
                        <Label className="text-[10px] text-muted-foreground">
                          % Rodovias c/ Pedágio
                        </Label>
                        <Input
                          type="number"
                          value={tollRoadPercent}
                          onChange={(e) => setTollRoadPercent(Number(e.target.value))}
                          className="text-xs h-8"
                        />
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

                    {/* Aluguel de Carro */}
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
                          <Select value={carRentalType} onValueChange={setCarRentalType}>
                            <SelectTrigger className="text-xs h-8">
                              <SelectValue placeholder="Selecione..." />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Sem aluguel</SelectItem>
                              <SelectItem value="simple">Carro Simples (R$ 230,00/dia)</SelectItem>
                              <SelectItem value="complete">
                                Carro Completo (R$ 350,00/dia)
                              </SelectItem>
                              <SelectItem value="custom">Personalizado</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {carRentalType !== 'none' && (
                          <>
                            <div className="space-y-1">
                              <Label className="text-[10px] text-muted-foreground font-medium">
                                Valor Diária (R$)
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
                                onChange={(e) =>
                                  setCarRentalDays(Math.max(1, Number(e.target.value)))
                                }
                                className="text-xs h-8 font-mono font-semibold"
                              />
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[10px] text-muted-foreground">
                        * Digite as cidades (ou CEPs) para rota automática via Nominatim/Mapeia.
                      </span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={isCalculatingRoute}
                        onClick={() => {
                          const orig = originAddress.trim()
                          const dest = destinationAddress.trim()
                          if (orig.length >= 3 && dest.length >= 3) {
                            handleRecalculateRouteByCities(orig, dest)
                          } else {
                            handleRecalculateRouteByCep()
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
                </CardContent>
              </Card>

              {/* SEÇÃO 3D: Hospedagem & Alimentação */}
              <Card className="border-slate-200 dark:border-slate-800 shadow-xs">
                <CardHeader className="p-4 pb-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <span className="flex items-center justify-center w-7 h-5 rounded bg-teal-600 text-white text-[11px] font-bold">
                        3D
                      </span>
                      3D Hospedagem & Alimentação
                    </CardTitle>
                    <span className="text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400">
                      Subtotal:{' '}
                      {lodgingMealsTotalCost.toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      })}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                        Composição de Hospedagem & Alimentação em Campo
                      </span>
                      <span className="text-xs font-bold text-emerald-600 font-mono">
                        Subtotal:{' '}
                        {lodgingMealsTotalCost.toLocaleString('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        })}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Diárias de Hotel */}
                      <div className="p-3 bg-white dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800 space-y-2">
                        <Label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          Diárias de Hotel
                        </Label>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-0.5">
                            <Label className="text-[10px] text-muted-foreground">
                              Quantidade de Diárias
                            </Label>
                            <Input
                              type="number"
                              min="0"
                              value={hotelDays}
                              onChange={(e) => setHotelDays(Number(e.target.value))}
                              className="text-xs h-8 font-mono"
                            />
                          </div>
                          <div className="space-y-0.5">
                            <Label className="text-[10px] text-muted-foreground">
                              Valor Diária (R$)
                            </Label>
                            <Input
                              type="number"
                              min="0"
                              value={hotelRate}
                              onChange={(e) => setHotelRate(Number(e.target.value))}
                              className="text-xs h-8 font-mono"
                            />
                          </div>
                        </div>
                        <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300 font-mono text-right pt-1">
                          Subtotal Hotel:{' '}
                          {hotelTotal.toLocaleString('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          })}
                        </div>
                      </div>

                      {/* Refeições */}
                      <div className="p-3 bg-white dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800 space-y-2">
                        <Label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          Refeições / Alimentação Diária
                        </Label>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-0.5">
                            <Label className="text-[10px] text-muted-foreground">
                              Quantidade de Refeições
                            </Label>
                            <Input
                              type="number"
                              min="0"
                              value={mealsDays}
                              onChange={(e) => setMealsDays(Number(e.target.value))}
                              className="text-xs h-8 font-mono"
                            />
                          </div>
                          <div className="space-y-0.5">
                            <Label className="text-[10px] text-muted-foreground">
                              Valor Refeição (R$)
                            </Label>
                            <Input
                              type="number"
                              min="0"
                              value={mealsRate}
                              onChange={(e) => setMealsRate(Number(e.target.value))}
                              className="text-xs h-8 font-mono"
                            />
                          </div>
                        </div>
                        <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300 font-mono text-right pt-1">
                          Subtotal Refeições:{' '}
                          {mealsTotal.toLocaleString('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Vale Refeição Funcionários (Alojado e Não Alojado) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                      <div className="p-3 bg-white dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800 space-y-2">
                        <Label className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                          Vale Refeição Alojado (Equipe Hospedada)
                        </Label>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-0.5">
                            <Label className="text-[10px] text-muted-foreground">Quantidade</Label>
                            <Input
                              type="number"
                              min="0"
                              value={mealVoucherHousedQty}
                              onChange={(e) => setMealVoucherHousedQty(Number(e.target.value))}
                              className="text-xs h-8 font-mono"
                            />
                          </div>
                          <div className="space-y-0.5">
                            <Label className="text-[10px] text-muted-foreground">Valor (R$)</Label>
                            <Input
                              type="number"
                              min="0"
                              value={mealVoucherHousedRate}
                              onChange={(e) => setMealVoucherHousedRate(Number(e.target.value))}
                              className="text-xs h-8 font-mono"
                            />
                          </div>
                        </div>
                        <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300 font-mono text-right pt-1">
                          Subtotal:{' '}
                          {voucherHousedTotal.toLocaleString('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          })}
                        </div>
                      </div>

                      <div className="p-3 bg-white dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800 space-y-2">
                        <Label className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                          Vale Refeição Não Alojado (Equipe Local)
                        </Label>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-0.5">
                            <Label className="text-[10px] text-muted-foreground">Quantidade</Label>
                            <Input
                              type="number"
                              min="0"
                              value={mealVoucherUnhousedQty}
                              onChange={(e) => setMealVoucherUnhousedQty(Number(e.target.value))}
                              className="text-xs h-8 font-mono"
                            />
                          </div>
                          <div className="space-y-0.5">
                            <Label className="text-[10px] text-muted-foreground">Valor (R$)</Label>
                            <Input
                              type="number"
                              min="0"
                              value={mealVoucherUnhousedRate}
                              onChange={(e) => setMealVoucherUnhousedRate(Number(e.target.value))}
                              className="text-xs h-8 font-mono"
                            />
                          </div>
                        </div>
                        <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300 font-mono text-right pt-1">
                          Subtotal:{' '}
                          {voucherUnhousedTotal.toLocaleString('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* SEÇÃO 3E: Margens & Fechamento */}
              <Card className="border-slate-200 dark:border-slate-800 shadow-xs">
                <CardHeader className="p-4 pb-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <span className="flex items-center justify-center w-7 h-5 rounded bg-teal-600 text-white text-[11px] font-bold">
                        3E
                      </span>
                      3E Margens & Fechamento
                    </CardTitle>
                    <span className="text-xs font-mono font-extrabold text-teal-800 dark:text-teal-300">
                      Total:{' '}
                      {calculatedSalePrice.toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      })}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                  {/* Bloco 1: Margens Comerciais & Operacionais com Sliders 0-50% */}
                  <div className="space-y-3">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 block">
                      Margens e Custos Indiretos (Barras 0 a 50%)
                    </span>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {/* Margem de Serviço */}
                      <div className="p-3 rounded-lg border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/30 dark:bg-emerald-950/20 space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs font-bold text-emerald-900 dark:text-emerald-300">
                            Margem de Serviço (%)
                          </Label>
                          <span className="text-[11px] font-mono text-emerald-700 dark:text-emerald-300 font-bold">
                            {(calculatedSalePrice * (serviceMargin / 100)).toLocaleString('pt-BR', {
                              style: 'currency',
                              currency: 'BRL',
                            })}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Slider
                            value={[Math.min(50, Math.max(0, serviceMargin))]}
                            min={0}
                            max={50}
                            step={1}
                            onValueChange={(val) => setServiceMargin(Math.round(val[0]))}
                            className="flex-1 cursor-pointer"
                          />
                          <span className="text-[11px] font-mono font-bold w-12 text-right text-emerald-800 dark:text-emerald-300">
                            {serviceMargin}%
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 pt-0.5">
                          <Input
                            type="number"
                            min="0"
                            max="50"
                            step="1"
                            value={serviceMargin}
                            onChange={(e) => {
                              const val = Math.min(
                                50,
                                Math.max(0, Math.round(parseFloat(e.target.value) || 0)),
                              )
                              setServiceMargin(val)
                            }}
                            className="text-xs h-7 font-mono font-bold text-emerald-700 dark:text-emerald-400 flex-1 min-w-0"
                          />
                          <Select
                            value={
                              [15, 20, 25, 30, 35].includes(serviceMargin)
                                ? String(serviceMargin)
                                : 'custom'
                            }
                            onValueChange={(val) => {
                              if (val !== 'custom') setServiceMargin(Number(val))
                            }}
                          >
                            <SelectTrigger
                              className="w-16 h-7 text-[11px] font-mono px-1.5 shrink-0 bg-emerald-50/50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800"
                              title="Escolher percentual pré-definido"
                            >
                              <SelectValue placeholder="Opção" />
                            </SelectTrigger>
                            <SelectContent align="end">
                              <SelectItem value="15" className="text-xs font-mono">
                                15%
                              </SelectItem>
                              <SelectItem value="20" className="text-xs font-mono">
                                20%
                              </SelectItem>
                              <SelectItem value="25" className="text-xs font-mono">
                                25% (Padrão)
                              </SelectItem>
                              <SelectItem value="30" className="text-xs font-mono">
                                30%
                              </SelectItem>
                              <SelectItem value="35" className="text-xs font-mono">
                                35%
                              </SelectItem>
                              {![15, 20, 25, 30, 35].includes(serviceMargin) && (
                                <SelectItem
                                  value="custom"
                                  className="text-xs font-mono text-muted-foreground"
                                >
                                  {serviceMargin}% (Outro)
                                </SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Comissão de Vendas */}
                      <div className="p-3 rounded-lg border border-blue-200 dark:border-blue-900/50 bg-blue-50/30 dark:bg-blue-950/20 space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs font-bold text-blue-900 dark:text-blue-300">
                            Comissão de Vendas (%)
                          </Label>
                          <span className="text-[11px] font-mono text-blue-700 dark:text-blue-300 font-bold">
                            {(calculatedSalePrice * (salesCommission / 100)).toLocaleString(
                              'pt-BR',
                              {
                                style: 'currency',
                                currency: 'BRL',
                              },
                            )}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Slider
                            value={[Math.min(50, Math.max(0, salesCommission))]}
                            min={0}
                            max={50}
                            step={1}
                            onValueChange={(val) => setSalesCommission(Math.round(val[0]))}
                            className="flex-1 cursor-pointer"
                          />
                          <span className="text-[11px] font-mono font-bold w-12 text-right text-blue-800 dark:text-blue-300">
                            {salesCommission}%
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 pt-0.5">
                          <Input
                            type="number"
                            min="0"
                            max="50"
                            step="1"
                            value={salesCommission}
                            onChange={(e) => {
                              const val = Math.min(
                                50,
                                Math.max(0, Math.round(parseFloat(e.target.value) || 0)),
                              )
                              setSalesCommission(val)
                            }}
                            className="text-xs h-7 font-mono font-bold text-blue-700 dark:text-blue-400 flex-1 min-w-0"
                          />
                          <Select
                            value={
                              [0, 2, 3, 5, 6, 8, 10].includes(salesCommission)
                                ? String(salesCommission)
                                : 'custom'
                            }
                            onValueChange={(val) => {
                              if (val !== 'custom') setSalesCommission(Number(val))
                            }}
                          >
                            <SelectTrigger
                              className="w-16 h-7 text-[11px] font-mono px-1.5 shrink-0 bg-blue-50/50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800"
                              title="Escolher percentual pré-definido"
                            >
                              <SelectValue placeholder="Opção" />
                            </SelectTrigger>
                            <SelectContent align="end">
                              <SelectItem value="0" className="text-xs font-mono">
                                0% (Sem)
                              </SelectItem>
                              <SelectItem value="2" className="text-xs font-mono">
                                2%
                              </SelectItem>
                              <SelectItem value="3" className="text-xs font-mono">
                                3%
                              </SelectItem>
                              <SelectItem value="5" className="text-xs font-mono">
                                5%
                              </SelectItem>
                              <SelectItem value="6" className="text-xs font-mono">
                                6% (Padrão)
                              </SelectItem>
                              <SelectItem value="8" className="text-xs font-mono">
                                8%
                              </SelectItem>
                              <SelectItem value="10" className="text-xs font-mono">
                                10%
                              </SelectItem>
                              {![0, 2, 3, 5, 6, 8, 10].includes(salesCommission) && (
                                <SelectItem
                                  value="custom"
                                  className="text-xs font-mono text-muted-foreground"
                                >
                                  {salesCommission}% (Outro)
                                </SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Overhead Administrativo */}
                      <div className="p-3 rounded-lg border border-purple-200 dark:border-purple-900/50 bg-purple-50/30 dark:bg-purple-950/20 space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs font-bold text-purple-900 dark:text-purple-300">
                            Overhead Adm (%)
                          </Label>
                          <span className="text-[11px] font-mono text-purple-700 dark:text-purple-300 font-bold">
                            {adminAmount.toLocaleString('pt-BR', {
                              style: 'currency',
                              currency: 'BRL',
                            })}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Slider
                            value={[Math.min(50, Math.max(0, adminRate))]}
                            min={0}
                            max={50}
                            step={1}
                            onValueChange={(val) => setAdminRate(Math.round(val[0]))}
                            className="flex-1 cursor-pointer"
                          />
                          <span className="text-[11px] font-mono font-bold w-12 text-right text-purple-800 dark:text-purple-300">
                            {adminRate}%
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 pt-0.5">
                          <Input
                            type="number"
                            min="0"
                            max="50"
                            step="1"
                            value={adminRate}
                            onChange={(e) => {
                              const val = Math.min(
                                50,
                                Math.max(0, Math.round(parseFloat(e.target.value) || 0)),
                              )
                              setAdminRate(val)
                            }}
                            className="text-xs h-7 font-mono font-bold text-purple-700 dark:text-purple-400 flex-1 min-w-0"
                          />
                          <Select
                            value={
                              [0, 2, 3, 5, 8, 10, 15].includes(adminRate)
                                ? String(adminRate)
                                : 'custom'
                            }
                            onValueChange={(val) => {
                              if (val !== 'custom') setAdminRate(Number(val))
                            }}
                          >
                            <SelectTrigger
                              className="w-16 h-7 text-[11px] font-mono px-1.5 shrink-0 bg-purple-50/50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800"
                              title="Escolher percentual pré-definido"
                            >
                              <SelectValue placeholder="Opção" />
                            </SelectTrigger>
                            <SelectContent align="end">
                              <SelectItem value="0" className="text-xs font-mono">
                                0% (Sem)
                              </SelectItem>
                              <SelectItem value="2" className="text-xs font-mono">
                                2%
                              </SelectItem>
                              <SelectItem value="3" className="text-xs font-mono">
                                3% (Padrão)
                              </SelectItem>
                              <SelectItem value="5" className="text-xs font-mono">
                                5%
                              </SelectItem>
                              <SelectItem value="8" className="text-xs font-mono">
                                8%
                              </SelectItem>
                              <SelectItem value="10" className="text-xs font-mono">
                                10%
                              </SelectItem>
                              <SelectItem value="15" className="text-xs font-mono">
                                15% (Fixo Adm)
                              </SelectItem>
                              {![0, 2, 3, 5, 8, 10, 15].includes(adminRate) && (
                                <SelectItem
                                  value="custom"
                                  className="text-xs font-mono text-muted-foreground"
                                >
                                  {adminRate}% (Outro)
                                </SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center gap-2">
                        <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          Validade da Proposta (Dias):
                        </Label>
                        <Input
                          type="number"
                          value={validityDays}
                          onChange={(e) => setValidityDays(Number(e.target.value))}
                          className="text-xs h-7 w-24 font-mono font-bold"
                        />
                      </div>
                      <span className="text-[11px] text-muted-foreground font-mono">
                        Margem ({serviceMargin}%) + Comissão ({salesCommission}%) + Overhead (
                        {adminRate}%) = {(serviceMargin + salesCommission + adminRate).toFixed(2)}%
                      </span>
                    </div>
                  </div>

                  {/* Bloco 2: Impostos Individuais com Alíquotas e Valores em R$ */}
                  <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 space-y-3">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-1.5">
                        <Percent className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" />
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                          Tributos & Encargos Fiscais Individuais
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className="text-[11px] font-mono font-bold bg-rose-50 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-300 dark:border-rose-800 shadow-xs"
                        >
                          Carga Tributária Total: {totalTaxesPercent.toFixed(2)}% •{' '}
                          {taxesAmount.toLocaleString('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          })}
                        </Badge>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
                      {/* PIS */}
                      <div className="p-2.5 rounded-md bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                            PIS (%)
                          </Label>
                          <span className="text-[9px] text-muted-foreground font-mono">0,65%</span>
                        </div>
                        <Input
                          type="number"
                          step="0.01"
                          value={pisRate}
                          onChange={(e) => setPisRate(Number(e.target.value))}
                          className="text-xs h-7 font-mono font-bold text-slate-900 dark:text-slate-100"
                        />
                        <div className="text-[10px] font-mono font-semibold text-rose-600 dark:text-rose-400 text-right truncate">
                          {(serviceSalePrice * (Number(pisRate || 0) / 100)).toLocaleString(
                            'pt-BR',
                            {
                              style: 'currency',
                              currency: 'BRL',
                            },
                          )}
                        </div>
                      </div>

                      {/* COFINS */}
                      <div className="p-2.5 rounded-md bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                            COFINS (%)
                          </Label>
                          <span className="text-[9px] text-muted-foreground font-mono">3,00%</span>
                        </div>
                        <Input
                          type="number"
                          step="0.01"
                          value={cofinsRate}
                          onChange={(e) => setCofinsRate(Number(e.target.value))}
                          className="text-xs h-7 font-mono font-bold text-slate-900 dark:text-slate-100"
                        />
                        <div className="text-[10px] font-mono font-semibold text-rose-600 dark:text-rose-400 text-right truncate">
                          {(serviceSalePrice * (Number(cofinsRate || 0) / 100)).toLocaleString(
                            'pt-BR',
                            {
                              style: 'currency',
                              currency: 'BRL',
                            },
                          )}
                        </div>
                      </div>

                      {/* ISS */}
                      <div className="p-2.5 rounded-md bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                            ISS (%)
                          </Label>
                          <span className="text-[9px] text-muted-foreground font-mono">5,00%</span>
                        </div>
                        <Input
                          type="number"
                          step="0.01"
                          value={issRate}
                          onChange={(e) => setIssRate(Number(e.target.value))}
                          className="text-xs h-7 font-mono font-bold text-slate-900 dark:text-slate-100"
                        />
                        <div className="text-[10px] font-mono font-semibold text-rose-600 dark:text-rose-400 text-right truncate">
                          {(serviceSalePrice * (Number(issRate || 0) / 100)).toLocaleString(
                            'pt-BR',
                            {
                              style: 'currency',
                              currency: 'BRL',
                            },
                          )}
                        </div>
                      </div>

                      {/* CSLL */}
                      <div className="p-2.5 rounded-md bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                            CSLL (%)
                          </Label>
                          <span className="text-[9px] text-muted-foreground font-mono">2,88%</span>
                        </div>
                        <Input
                          type="number"
                          step="0.01"
                          value={csllRate}
                          onChange={(e) => setCsllRate(Number(e.target.value))}
                          className="text-xs h-7 font-mono font-bold text-slate-900 dark:text-slate-100"
                        />
                        <div className="text-[10px] font-mono font-semibold text-rose-600 dark:text-rose-400 text-right truncate">
                          {(serviceSalePrice * (Number(csllRate || 0) / 100)).toLocaleString(
                            'pt-BR',
                            {
                              style: 'currency',
                              currency: 'BRL',
                            },
                          )}
                        </div>
                      </div>

                      {/* IRPJ */}
                      <div className="p-2.5 rounded-md bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                            IRPJ (%)
                          </Label>
                          <span className="text-[9px] text-muted-foreground font-mono">4,80%</span>
                        </div>
                        <Input
                          type="number"
                          step="0.01"
                          value={irpjRate}
                          onChange={(e) => setIrpjRate(Number(e.target.value))}
                          className="text-xs h-7 font-mono font-bold text-slate-900 dark:text-slate-100"
                        />
                        <div className="text-[10px] font-mono font-semibold text-rose-600 dark:text-rose-400 text-right truncate">
                          {(serviceSalePrice * (Number(irpjRate || 0) / 100)).toLocaleString(
                            'pt-BR',
                            {
                              style: 'currency',
                              currency: 'BRL',
                            },
                          )}
                        </div>
                      </div>

                      {/* Dif. IR */}
                      <div className="p-2.5 rounded-md bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                            Dif. IR (%)
                          </Label>
                          <span className="text-[9px] text-muted-foreground font-mono">1,50%</span>
                        </div>
                        <Input
                          type="number"
                          step="0.01"
                          value={irDiffRate}
                          onChange={(e) => setIrDiffRate(Number(e.target.value))}
                          className="text-xs h-7 font-mono font-bold text-slate-900 dark:text-slate-100"
                        />
                        <div className="text-[10px] font-mono font-semibold text-rose-600 dark:text-rose-400 text-right truncate">
                          {(serviceSalePrice * (Number(irDiffRate || 0) / 100)).toLocaleString(
                            'pt-BR',
                            {
                              style: 'currency',
                              currency: 'BRL',
                            },
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-0.5">
                      <span>
                        Alíquotas incidentes sobre o faturamento bruto homologado da proposta.
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setPisRate(0.65)
                          setCofinsRate(3.0)
                          setIssRate(5.0)
                          setCsllRate(2.88)
                          setIrpjRate(4.8)
                          setIrDiffRate(1.5)
                        }}
                        className="h-6 text-[10px] font-medium text-slate-500 hover:text-rose-600 px-2"
                      >
                        Restaurar Alíquotas Padrão (17,83%)
                      </Button>
                    </div>
                  </div>

                  {/* Bloco 3: Formação de Preço & Fechamento Gerencial */}
                  <div className="p-3.5 rounded-lg border-2 border-amber-300 dark:border-amber-900/60 bg-amber-50/70 dark:bg-amber-950/20 space-y-3">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-amber-950 dark:text-amber-200 flex items-center gap-1.5">
                        <Calculator className="h-3.5 w-3.5 text-amber-700 dark:text-amber-400" />
                        Formação de Preço: Serviços Tributados + Repasse Puro de Materiais
                      </span>
                      <div className="flex items-center gap-1.5">
                        <Badge className="bg-amber-700 dark:bg-amber-800 text-white font-mono text-[10px]">
                          DIVISOR DE SERVIÇO: {(divisor * 100).toFixed(1)}%
                        </Badge>
                      </div>
                    </div>

                    {/* Destaque das 3 Parcelas Obrigatórias */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                      {/* Parcela 1: Serviços Especializados */}
                      <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border-2 border-teal-500/40 dark:border-teal-700/50 space-y-1 shadow-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] uppercase font-bold text-teal-800 dark:text-teal-300 flex items-center gap-1">
                            <Wrench className="h-3 w-3 text-teal-600" />
                            Serviços Especializados
                          </span>
                          <Badge
                            variant="secondary"
                            className="text-[9px] font-mono bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-300"
                          >
                            com tributos e margem
                          </Badge>
                        </div>
                        <div className="font-mono font-black text-teal-900 dark:text-teal-100 text-base">
                          {serviceSalePrice.toLocaleString('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          })}
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                          Direto:{' '}
                          {serviceDirectCostsTotal.toLocaleString('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          })}{' '}
                          + Adm ({adminRate}%):{' '}
                          {adminAmount.toLocaleString('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          })}{' '}
                          ÷ {divisor.toFixed(4)}
                        </div>
                      </div>

                      {/* Parcela 2: Repasse de Materiais e Componentes */}
                      <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border-2 border-blue-500/40 dark:border-blue-700/50 space-y-1 shadow-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] uppercase font-bold text-blue-800 dark:text-blue-300 flex items-center gap-1">
                            <Package className="h-3 w-3 text-blue-600" />
                            Repasse de Materiais e Componentes
                          </span>
                          <Badge
                            variant="secondary"
                            className="text-[9px] font-mono bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                          >
                            sem tributos
                          </Badge>
                        </div>
                        <div className="font-mono font-black text-blue-900 dark:text-blue-100 text-base">
                          {materialsPassThrough.toLocaleString('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          })}
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                          Materiais:{' '}
                          {materialsCost.toLocaleString('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          })}{' '}
                          • Peças:{' '}
                          {materialsItemsTotal.toLocaleString('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          })}{' '}
                          • Químicos:{' '}
                          {chemicalProductsTotal.toLocaleString('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          })}
                        </div>
                      </div>

                      {/* Parcela 3: Preço Final Consolidado */}
                      <div className="bg-amber-900 text-white p-3 rounded-lg space-y-1 shadow-sm border-2 border-amber-800">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] uppercase font-bold text-amber-200">
                            Preço Final Consolidado
                          </span>
                          <Badge className="bg-amber-700 text-white text-[9px] font-mono">
                            Total Proposta
                          </Badge>
                        </div>
                        <div className="font-mono font-black text-white text-lg">
                          {calculatedSalePrice.toLocaleString('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          })}
                        </div>
                        <div className="text-[10px] text-amber-300 leading-tight">
                          Serviço tributado (
                          {serviceSalePrice.toLocaleString('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          })}
                          ) + Repasse puro (
                          {materialsPassThrough.toLocaleString('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          })}
                          )
                        </div>
                      </div>
                    </div>

                    {/* Linha de Apoio: Custos Diretos Totais e Margem/Comissão/Tributos */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs pt-1 border-t border-amber-200 dark:border-amber-900/40">
                      <div className="bg-white/80 dark:bg-slate-900/80 p-2 rounded border border-amber-200/80 dark:border-amber-900/50 space-y-0.5">
                        <span className="text-[9.5px] text-slate-500 uppercase font-semibold block">
                          Custos Diretos Totais
                        </span>
                        <div className="font-mono font-bold text-slate-800 dark:text-slate-200 text-xs">
                          {directCostsTotal.toLocaleString('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          })}
                        </div>
                        <div className="text-[9px] text-slate-500">
                          Serviços{' '}
                          {serviceDirectCostsTotal.toLocaleString('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          })}{' '}
                          + Repasse{' '}
                          {materialsPassThrough.toLocaleString('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          })}
                        </div>
                      </div>

                      <div className="bg-white/80 dark:bg-slate-900/80 p-2 rounded border border-amber-200/80 dark:border-amber-900/50 space-y-0.5">
                        <span className="text-[9.5px] text-slate-500 uppercase font-semibold block">
                          Overhead Adm ({adminRate}%)
                        </span>
                        <div className="font-mono font-bold text-purple-700 dark:text-purple-400 text-xs">
                          {adminAmount.toLocaleString('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          })}
                        </div>
                        <div className="text-[9px] text-slate-500">Incide apenas sobre serviço</div>
                      </div>

                      <div className="bg-white/80 dark:bg-slate-900/80 p-2 rounded border border-amber-200/80 dark:border-amber-900/50 space-y-0.5">
                        <span className="text-[9.5px] text-slate-500 uppercase font-semibold block">
                          Margem ({serviceMargin}%) + Comis ({salesCommission}%)
                        </span>
                        <div className="font-mono font-bold text-emerald-700 dark:text-emerald-400 text-xs">
                          {(serviceMarginAmount + salesCommissionAmount).toLocaleString('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          })}
                        </div>
                        <div className="text-[9px] text-slate-500">
                          Sobre serviço:{' '}
                          {serviceMarginAmount.toLocaleString('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          })}{' '}
                          +{' '}
                          {salesCommissionAmount.toLocaleString('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          })}
                        </div>
                      </div>

                      <div className="bg-white/80 dark:bg-slate-900/80 p-2 rounded border border-amber-200/80 dark:border-amber-900/50 space-y-0.5">
                        <span className="text-[9.5px] text-slate-500 uppercase font-semibold block">
                          Tributos Totais ({totalTaxesPercent.toFixed(2)}%)
                        </span>
                        <div className="font-mono font-bold text-rose-700 dark:text-rose-400 text-xs">
                          {taxesAmount.toLocaleString('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          })}
                        </div>
                        <div className="text-[9px] text-slate-500">
                          Incidem exclusivamente no serviço
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bloco 4: Condições de Pagamento e Status */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold">Condições de Pagamento</Label>
                      <Input
                        value={paymentTerms}
                        onChange={(e) => setPaymentTerms(e.target.value)}
                        placeholder="Ex: 28 DDL faturado após entrega técnica"
                        className="text-xs h-8"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs font-semibold">Status Inicial</Label>
                      <Select value={status} onValueChange={(val) => setStatus(val as QuoteStatus)}>
                        <SelectTrigger className="text-xs h-8">
                          <SelectValue placeholder="Selecione o status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="draft">Rascunho</SelectItem>
                          <SelectItem value="sent">Enviada ao Cliente</SelectItem>
                          <SelectItem value="approved">Aprovada</SelectItem>
                          <SelectItem value="rejected">Rejeitada</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <DialogFooter className="p-4 sm:p-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sticky bottom-0 z-10 backdrop-blur-sm">
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsEditorOpen(false)}
                className="text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100"
              >
                Cancelar
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const currentObj = getFormDataObject() as QuoteRecord
                  handleOpenPdfPreview({ ...currentObj, id: activeQuoteId || 'draft' }, 'client')
                }}
                className="text-xs border-teal-300 text-teal-700 hover:bg-teal-50 dark:border-teal-800 dark:text-teal-300"
              >
                <Eye className="h-3.5 w-3.5 mr-1 text-teal-600" />
                Visualizar PDF
              </Button>

              {activeQuoteId && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const token = approvalToken || activeQuoteId
                    window.open(`/proposta/${token}`, '_blank', 'noopener,noreferrer')
                  }}
                  className="text-xs text-slate-600 hover:text-teal-700 hidden sm:inline-flex"
                >
                  <ExternalLink className="h-3.5 w-3.5 mr-1" />
                  Link Aceite
                </Button>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleSaveDraft}
                disabled={isSaving}
                className="text-xs border-slate-300 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300"
              >
                <Clock className="h-3.5 w-3.5 mr-1 text-slate-500" />
                Salvar Rascunho
              </Button>

              <Button
                type="button"
                size="sm"
                onClick={handleSaveQuote}
                disabled={isSaving}
                className="text-xs font-bold bg-teal-700 hover:bg-teal-600 text-white shadow-xs"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="h-3.5 w-3.5 mr-1" />
                    Salvar Alterações
                  </>
                )}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal para Cadastro Manual de Novo Cliente (Seção 3A) */}
      <Dialog open={isNewClientDialogOpen} onOpenChange={setIsNewClientDialogOpen}>
        <DialogContent className="sm:max-w-[540px] p-0 overflow-hidden">
          <DialogHeader className="p-4 pb-3 border-b border-slate-100 dark:border-slate-800 bg-teal-50/60 dark:bg-teal-950/30">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-teal-600 text-white flex items-center justify-center shrink-0">
                <UserPlus className="h-4 w-4" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Cadastrar Novo Cliente
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Preencha os dados abaixo. O novo cliente será salvo e selecionado na proposta.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <form onSubmit={handleSaveNewClientQuick} className="p-4 space-y-3.5">
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                Nome do Cliente / Razão Social <span className="text-rose-500">*</span>
              </Label>
              <Input
                required
                autoFocus
                placeholder="Ex: Cervejaria Catarinense Ltda"
                value={newClientName}
                onChange={(e) => setNewClientName(e.target.value)}
                className="text-xs h-8"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  CNPJ / CPF (opcional)
                </Label>
                <Input
                  placeholder="00.000.000/0001-00"
                  value={newClientDocument}
                  onChange={(e) => setNewClientDocument(e.target.value)}
                  className="text-xs h-8"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  Contato / Responsável
                </Label>
                <Input
                  placeholder="Ex: Eng. Roberto Silveira"
                  value={newClientContact}
                  onChange={(e) => setNewClientContact(e.target.value)}
                  className="text-xs h-8"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  E-mail
                </Label>
                <Input
                  type="email"
                  placeholder="contato@empresa.com.br"
                  value={newClientEmail}
                  onChange={(e) => setNewClientEmail(e.target.value)}
                  className="text-xs h-8"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  Telefone / Celular
                </Label>
                <Input
                  placeholder="(47) 99999-8888"
                  value={newClientPhone}
                  onChange={(e) => setNewClientPhone(e.target.value)}
                  className="text-xs h-8"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1 col-span-2">
                <Label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  Cidade
                </Label>
                <Input
                  placeholder="Ex: Blumenau"
                  value={newClientCity}
                  onChange={(e) => setNewClientCity(e.target.value)}
                  className="text-xs h-8"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-medium text-slate-700 dark:text-slate-300">UF</Label>
                <Input
                  placeholder="SC"
                  maxLength={2}
                  value={newClientState}
                  onChange={(e) => setNewClientState(e.target.value.toUpperCase())}
                  className="text-xs h-8"
                />
              </div>
            </div>

            <DialogFooter className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsNewClientDialogOpen(false)}
                className="h-8 text-xs"
                disabled={isSavingNewClient}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSavingNewClient || !newClientName.trim()}
                className="h-8 text-xs bg-teal-600 hover:bg-teal-700 text-white"
              >
                {isSavingNewClient ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="h-3.5 w-3.5 mr-1" />
                    Cadastrar e Selecionar
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 5.5 Modal interno de Pesquisa Técnica Server-Side (Sem abrir abas externas / Iframe Safe) */}
      <Dialog open={isWebSearchModalOpen} onOpenChange={setIsWebSearchModalOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-0 overflow-hidden">
          <DialogHeader className="p-4 pb-2 border-b border-slate-100 dark:border-slate-800 bg-teal-50/50 dark:bg-teal-950/20">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-sm font-bold flex items-center gap-2 text-teal-900 dark:text-teal-200">
                <Globe className="h-4 w-4 text-teal-600" />
                Busca de Especificações Técnicas (Server-Side)
              </DialogTitle>
              <Badge
                variant="outline"
                className="text-[10px] border-teal-300 text-teal-700 dark:border-teal-700 dark:text-teal-300"
              >
                Item #{webSearchActiveIndex + 1}
              </Badge>
            </div>
            <DialogDescription className="text-xs text-muted-foreground mt-1">
              Pesquisa realizada no servidor com catálogo BERMO, fichas técnicas de trocadores e IA
              integrada. Selecione um resultado para aplicar os dados técnicos diretamente no
              orçamento.
            </DialogDescription>
          </DialogHeader>

          {/* Barra de busca refinada */}
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                value={webSearchQuery}
                onChange={(e) => setWebSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handlePerformInternalQuery(webSearchQuery)
                  }
                }}
                placeholder="Ex: BP30, BP6, M10-B, BL50..."
                className="pl-8 h-8 text-xs font-medium"
              />
            </div>
            <Button
              type="button"
              size="sm"
              disabled={isWebSearching || !webSearchQuery.trim()}
              onClick={() => handlePerformInternalQuery(webSearchQuery)}
              className="h-8 px-3 text-xs bg-teal-600 hover:bg-teal-700 text-white"
            >
              {isWebSearching ? (
                <>
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  Pesquisando...
                </>
              ) : (
                <>
                  <Search className="h-3 w-3 mr-1" />
                  Pesquisar
                </>
              )}
            </Button>
          </div>

          {/* Área de Resultados */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {webSearchMessage && (
              <p className="text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/60 p-2.5 rounded-md border border-slate-200 dark:border-slate-800">
                {webSearchMessage}
              </p>
            )}

            {isWebSearching ? (
              <div className="py-12 flex flex-col items-center justify-center space-y-3 text-center">
                <Loader2 className="h-8 w-8 text-teal-600 animate-spin" />
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    Consultando especificações técnicas no servidor...
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Verificando base BERMO, fabricantes homologados e parâmetros térmicos
                  </p>
                </div>
              </div>
            ) : webSearchResults.length > 0 ? (
              <div className="space-y-2.5">
                {webSearchResults.map((resItem) => {
                  const specs = resItem.specs
                  return (
                    <div
                      key={resItem.id}
                      className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 hover:border-teal-500/50 hover:shadow-xs transition-all space-y-2.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                              {resItem.title}
                            </span>
                            {resItem.badge && (
                              <Badge
                                variant="secondary"
                                className="text-[10px] px-1.5 py-0 h-4 bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800"
                              >
                                {resItem.badge}
                              </Badge>
                            )}
                          </div>
                          {resItem.snippet && (
                            <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                              {resItem.snippet}
                            </p>
                          )}
                        </div>

                        <Button
                          type="button"
                          size="sm"
                          onClick={() => {
                            const applied = applySpecsToEquipment(
                              webSearchActiveIndex,
                              resItem.specs,
                              resItem.brand,
                              resItem.model,
                            )
                            if (applied) {
                              setIsWebSearchModalOpen(false)
                              toast({
                                title: 'Especificações aplicadas!',
                                description: `Dados de ${resItem.title} preenchidos com sucesso no Item #${webSearchActiveIndex + 1}.`,
                              })
                            }
                          }}
                          className="h-7 px-3 text-xs bg-teal-600 hover:bg-teal-700 text-white shrink-0"
                        >
                          <Check className="h-3 w-3 mr-1" />
                          Aplicar Specs
                        </Button>
                      </div>

                      {/* Grade de Especificações Extraídas */}
                      {specs && (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-2 bg-slate-50 dark:bg-slate-950/60 rounded border border-slate-100 dark:border-slate-800/80 text-[11px]">
                          <div>
                            <span className="text-muted-foreground block text-[10px]">
                              Qtd Placas:
                            </span>
                            <span className="font-semibold text-slate-800 dark:text-slate-200">
                              {specs.platesCount || specs.platesRange || 'N/A'}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground block text-[10px]">
                              Material:
                            </span>
                            <span className="font-semibold text-slate-800 dark:text-slate-200 truncate block">
                              {specs.material || specs.plateMaterial || 'AISI 316L'}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground block text-[10px]">
                              Gaxeta / Vedação:
                            </span>
                            <span className="font-semibold text-slate-800 dark:text-slate-200 truncate block">
                              {specs.gasketMaterial || 'EPDM Clip-on'}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground block text-[10px]">
                              Conexão / Pressão:
                            </span>
                            <span className="font-semibold text-slate-800 dark:text-slate-200 truncate block">
                              {specs.connection || 'DN50'} • {specs.pressure || '16 bar'}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Link de referência com proteção noopener */}
                      {resItem.url && (
                        <div className="flex items-center justify-between pt-0.5 text-[10px] text-muted-foreground">
                          <span className="truncate max-w-[80%]">Fonte: {resItem.url}</span>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(resItem.url || '')
                              toast({
                                title: 'URL copiada',
                                description:
                                  'Endereço da fonte copiado para a área de transferência.',
                              })
                            }}
                            className="text-teal-600 hover:underline flex items-center gap-1"
                          >
                            <Copy className="h-2.5 w-2.5" />
                            Copiar URL
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="py-8 text-center space-y-3">
                <p className="text-xs text-muted-foreground">
                  Nenhuma ficha técnica automática encontrada para &ldquo;{webSearchQuery}&rdquo;.
                </p>
                <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-md text-left text-xs space-y-2">
                  <p className="font-semibold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-amber-600" />
                    Busca manual assistida (segura contra bloqueios do navegador):
                  </p>
                  <p className="text-muted-foreground text-[11px]">
                    Copie o termo técnico abaixo e faça a pesquisa diretamente em seu navegador em
                    nova janela, evitando bloqueios de iframe da prévia:
                  </p>
                  <div className="flex items-center gap-2">
                    <Input
                      readOnly
                      value={`${webSearchQuery || equipmentModel || 'trocador de calor'} trocador de calor especificações técnicas datasheet`}
                      className="h-7 text-xs bg-white dark:bg-slate-900 font-mono"
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const term = `${webSearchQuery || equipmentModel || 'trocador de calor'} trocador de calor especificações técnicas datasheet`
                        navigator.clipboard.writeText(term)
                        toast({
                          title: 'Termo copiado!',
                          description: 'Termo técnico copiado para a área de transferência.',
                        })
                      }}
                      className="h-7 px-2.5 text-xs border-amber-300 text-amber-800 hover:bg-amber-100"
                    >
                      <Copy className="h-3 w-3 mr-1" />
                      Copiar
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="p-3 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span className="text-[11px] text-muted-foreground">
              Total de resultados: {webSearchResults.length}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsWebSearchModalOpen(false)}
              className="h-7 text-xs"
            >
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 6. Modal de Impressão e PDF (com suporte explícito a visão cliente e interna + aprovação) */}
      {quoteForPreview && (
        <QuotePdfPreviewDialog
          quote={
            {
              ...quoteForPreview,
              ...(activeQuoteId === quoteForPreview.id ? getFormDataObject() : {}),
              id: quoteForPreview.id,
            } as QuoteRecord
          }
          open={isPreviewOpen}
          onOpenChange={setIsPreviewOpen}
          viewMode={previewViewMode}
          onApproveQuote={async (q) => {
            const quoteId = q.id || activeQuoteId
            if (!quoteId) return

            const payload = getFormDataObject()
            payload.status = 'approved'

            if (onUpdateQuoteStatus) {
              await onUpdateQuote(quoteId, payload)
              await onUpdateQuoteStatus(quoteId, 'approved')
            } else {
              await onUpdateQuote(quoteId, payload)
            }
            setStatus('approved')
            toast({
              title: '🎉 Proposta Aprovada com Sucesso!',
              description: 'A Ordem de Serviço foi gerada e o pipeline atualizado.',
            })
          }}
        />
      )}
    </div>
  )
}

export default QuotesManager
