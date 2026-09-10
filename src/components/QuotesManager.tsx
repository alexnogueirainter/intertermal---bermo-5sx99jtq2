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
} from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
} from '@/types/crm'
import { QuotePdfPreviewDialog } from './QuotePdfPreviewDialog'
import {
  BLUMENAU_COORDS,
  geocodeCity,
  fetchCepCoordinates,
  haversineDistance,
} from '@/lib/mapeia-calculator'
import { quotesService, searchEquipmentSpecsOnline } from '@/services/quotes'
import { getStandardServiceMethodology } from '@/data/bermo-catalog'

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

  // Materiais Customizados - input temporário para novo item
  const [newMaterialDescription, setNewMaterialDescription] = useState('')
  const [newMaterialQty, setNewMaterialQty] = useState(1)
  const [newMaterialUnitCost, setNewMaterialUnitCost] = useState(0)

  // Form Fields - Identificação Geral
  const [clientId, setClientId] = useState('')
  const [clientName, setClientName] = useState('')
  const [quoteTitle, setQuoteTitle] = useState('')
  const [quoteNumber, setQuoteNumber] = useState('')
  const [status, setStatus] = useState<QuoteStatus>('draft')
  const [equipmentModel, setEquipmentModel] = useState('')
  const [equipmentBrand, setEquipmentBrand] = useState('BERMO')
  const [equipmentQuantity, setEquipmentQuantity] = useState(1)
  const [plateCount, setPlateCount] = useState(40)
  const [plateMaterial, setPlateMaterial] = useState('AISI 316L')
  const [plateThickness, setPlateThickness] = useState(0.5)
  const [gasketMaterial, setGasketMaterial] = useState('EPDM Clip-on')
  const [connectionSize, setConnectionSize] = useState('DN50 (2")')
  const [pressureTestBar, setPressureTestBar] = useState(16)
  const [workingPressureBar, setWorkingPressureBar] = useState(10)
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
      plate_count: 40,
      plate_material: 'AISI 316L',
      plate_thickness: 0.5,
      gasket_material: 'EPDM Clip-on',
      connection_size: 'DN50 (2")',
      pressure_test_bar: 16,
      working_pressure_bar: 10,
    },
  ])
  const [searchingSpecsIndex, setSearchingSpecsIndex] = useState<number | null>(null)
  const [scopeOfWork, setScopeOfWork] = useState(() => getStandardServiceMethodology(['BERMO']))

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

  // Seção 3D: Hospedagem & Alimentação
  const [hotelDays, setHotelDays] = useState(0)
  const [hotelRate, setHotelRate] = useState(220)
  const [mealsDays, setMealsDays] = useState(0)
  const [mealsRate, setMealsRate] = useState(95)
  const [mealVoucherHousedQty, setMealVoucherHousedQty] = useState(0)
  const [mealVoucherHousedRate, setMealVoucherHousedRate] = useState(45)
  const [mealVoucherUnhousedQty, setMealVoucherUnhousedQty] = useState(0)
  const [mealVoucherUnhousedRate, setMealVoucherUnhousedRate] = useState(40)

  // Peças, Terceiros, Outros
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
  const directCostsTotal =
    totalLaborCost +
    travelTotalCost +
    lodgingMealsTotalCost +
    materialsCost +
    thirdPartyCost +
    otherCosts

  // Total Tributos (Taxa Fiscal Consolidada - modelo v0.0.66)
  const totalTaxesPercent = taxRate

  // Divisor de formação de preço (Markup)
  const totalDeductionsPercent = (serviceMargin + salesCommission + totalTaxesPercent) / 100
  const divisor = Math.max(0.1, 1 - totalDeductionsPercent)
  const adminAmount = directCostsTotal * (adminRate / 100)
  const baseGrossCost = directCostsTotal + adminAmount
  const calculatedSalePrice = Math.max(0, Math.round((baseGrossCost / divisor) * 100) / 100)

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

    const primaryEq = equipments[0] || {
      model: equipmentModel || '',
      brand: equipmentBrand || 'BERMO',
      quantity: equipmentQuantity || 1,
      plate_count: plateCount || 40,
      plate_material: plateMaterial || 'AISI 316L',
      plate_thickness: plateThickness || 0.5,
      gasket_material: gasketMaterial || 'EPDM Clip-on',
      connection_size: connectionSize || 'DN50 (2")',
      pressure_test_bar: pressureTestBar || 16,
      working_pressure_bar: workingPressureBar || 10,
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
      equipments: equipments && equipments.length > 0 ? equipments : undefined,
      equipment_brand: primaryEq.brand || equipmentBrand || 'BERMO',
      equipment_model: primaryEq.model || equipmentModel || '',
      equipment_quantity: primaryEq.quantity || equipmentQuantity || 1,
      plate_count: primaryEq.plate_count ?? plateCount ?? 40,
      plate_material: primaryEq.plate_material || plateMaterial || 'AISI 316L',
      plate_thickness: primaryEq.plate_thickness ?? plateThickness ?? 0.5,
      gasket_material: primaryEq.gasket_material || gasketMaterial || 'EPDM Clip-on',
      connection_size: primaryEq.connection_size || connectionSize || 'DN50 (2")',
      pressure_test_bar: primaryEq.pressure_test_bar ?? pressureTestBar ?? 16,
      working_pressure_bar: primaryEq.working_pressure_bar ?? workingPressureBar ?? 10,
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

      // Materiais customizados
      custom_materials: customMaterials && customMaterials.length > 0 ? customMaterials : undefined,

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
      service_margin: serviceMargin,
      sales_commission: salesCommission,
      admin_rate: adminRate,
      admin_cost: adminAmount,
      pis_rate: pisRate,
      cofins_rate: cofinsRate,
      iss_rate: issRate,
      csll_rate: csllRate,
      irpj_rate: irpjRate,
      ir_diff_rate: irDiffRate,

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
    setEquipmentBrand('BERMO')
    setEquipmentQuantity(1)
    setPlateCount(40)
    setPlateMaterial('AISI 316L')
    setPlateThickness(0.5)
    setGasketMaterial('EPDM Clip-on')
    setConnectionSize('DN50 (2")')
    setPressureTestBar(16)
    setWorkingPressureBar(10)
    setDimensionsWHd('')
    setWorkFluid('')
    setHomologatedProcedure('')
    setLastSavedAt(null)
    setIntegrationRequired(false)
    setIntegrationTiming('same_day')
    setIntegrationWeekday('Segunda-feira')
    setIntegrationCost(532.0)
    setWorkPermitRequired(false)
    setCustomMaterials([])
    setEquipments([
      {
        id: `eq-${Date.now()}-1`,
        model: '',
        brand: 'BERMO',
        quantity: 1,
        tag: '',
        serial_number: '',
        plate_count: 40,
        plate_material: 'AISI 316L',
        plate_thickness: 0.5,
        gasket_material: 'EPDM Clip-on',
        connection_size: 'DN50 (2")',
        pressure_test_bar: 16,
        working_pressure_bar: 10,
      },
    ])
    setScopeOfWork(getStandardServiceMethodology(['BERMO']))
    setTechCount(2)
    setTechHours(16)
    setTechRate(85)
    setHelperCount(1)
    setHelperHours(16)
    setHelperRate(55)
    setInspectorCount(0)
    setInspectorHours(0)
    setInspectorRate(120)
    setWelderCount(0)
    setWelderHours(0)
    setWelderRate(160)
    setPlumberCount(0)
    setPlumberHours(0)
    setPlumberRate(120)
    setForemanCount(0)
    setForemanHours(0)
    setForemanRate(180)

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
    setCarRentalDailyRate(230)
    setCarRentalDays(1)

    setHotelDays(0)
    setHotelRate(220)
    setMealsDays(0)
    setMealsRate(95)
    setMealVoucherHousedQty(0)
    setMealVoucherHousedRate(45)
    setMealVoucherUnhousedQty(0)
    setMealVoucherUnhousedRate(40)

    setMaterialsCost(0)
    setThirdPartyCost(0)
    setOtherCosts(0)
    setServiceMargin(25)
    setSalesCommission(6)
    setAdminRate(3)
    setTaxRate(14.83)
    setPisRate(0.65)
    setCofinsRate(3.0)
    setIssRate(5.0)
    setCsllRate(2.88)
    setIrpjRate(4.8)
    setIrDiffRate(1.5)
    setPaymentTerms('28 DDL faturado após entrega técnica')
    setValidityDays(15)
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
        plate_count: 40,
        plate_material: 'AISI 316L',
        plate_thickness: 0.5,
        gasket_material: 'EPDM Clip-on',
        connection_size: 'DN50 (2")',
        pressure_test_bar: 16,
        working_pressure_bar: 10,
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
        setPlateCount(next[0].plate_count ?? 40)
        setPlateMaterial(next[0].plate_material || 'AISI 316L')
        setPlateThickness(next[0].plate_thickness ?? 0.5)
        setGasketMaterial(next[0].gasket_material || 'EPDM Clip-on')
        setConnectionSize(next[0].connection_size || 'DN50 (2")')
        setPressureTestBar(next[0].pressure_test_bar ?? 16)
        setWorkingPressureBar(next[0].working_pressure_bar ?? 10)
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

  // Busca na internet de especificações técnicas do equipamento com fallback para Google
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
    try {
      const result = await searchEquipmentSpecsOnline(model, brand)
      if (result && result.found && result.specs) {
        const specs = result.specs
        const patch: Partial<QuoteEquipmentItem> = {}

        if (result.brand) {
          patch.brand = result.brand
        }
        if (result.model) {
          patch.model = result.model
        }
        if (specs.platesCount) {
          const parsed = parseInt(String(specs.platesCount), 10)
          if (!isNaN(parsed) && parsed > 0) {
            patch.plate_count = parsed
          }
        }
        if (specs.material) {
          patch.plate_material = specs.material
        }
        if (specs.gasketMaterial) {
          patch.gasket_material = specs.gasketMaterial
        }
        if (specs.connection) {
          patch.connection_size = specs.connection
        }
        if (specs.pressure) {
          const match = String(specs.pressure).match(/(\d+)/)
          if (match && match[1]) {
            const p = parseInt(match[1], 10)
            if (!isNaN(p) && p > 0) {
              patch.working_pressure_bar = p
              patch.pressure_test_bar = Math.round(p * 1.5)
            }
          }
        }

        handleUpdateEquipment(index, patch)
        toast({
          title: 'Especificações encontradas!',
          description:
            result.message ||
            `Dados carregados para ${result.model || model} (${result.brand || brand}).`,
        })
      } else {
        // Fallback: abrir busca no Google em nova aba
        const queryTerm = `${brand ? `${brand} ` : ''}${model} trocador de calor especificações técnicas datasheet`
        window.open(`https://www.google.com/search?q=${encodeURIComponent(queryTerm)}`, '_blank')
        toast({
          title: 'Não encontrado no catálogo',
          description: 'Abrindo busca no Google em nova aba com o termo digitado.',
        })
      }
    } catch (err) {
      console.warn('Erro na busca online de specs:', err)
      const queryTerm = `${brand ? `${brand} ` : ''}${model} trocador de calor especificações técnicas datasheet`
      window.open(`https://www.google.com/search?q=${encodeURIComponent(queryTerm)}`, '_blank')
      toast({
        title: 'Busca online falhou',
        description: 'Abrindo busca no Google em nova aba com o termo digitado.',
      })
    } finally {
      setSearchingSpecsIndex(null)
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
    setPlateCount(quote.plate_count || 40)
    setPlateMaterial(quote.plate_material || 'AISI 316L')
    setPlateThickness(quote.plate_thickness || 0.5)
    setGasketMaterial(quote.gasket_material || 'EPDM Clip-on')
    setConnectionSize(quote.connection_size || 'DN50 (2")')
    setPressureTestBar(quote.pressure_test_bar || 16)
    setWorkingPressureBar(quote.working_pressure_bar || 10)

    if (quote.equipments && Array.isArray(quote.equipments) && quote.equipments.length > 0) {
      setEquipments(quote.equipments)
    } else {
      setEquipments([
        {
          id: `eq-${quote.id || 'item'}-1`,
          model: quote.equipment_model || '',
          brand: quote.equipment_brand || 'BERMO',
          quantity: quote.equipment_quantity || 1,
          tag: '',
          serial_number: '',
          plate_count: quote.plate_count || 40,
          plate_material: quote.plate_material || 'AISI 316L',
          plate_thickness: quote.plate_thickness || 0.5,
          gasket_material: quote.gasket_material || 'EPDM Clip-on',
          connection_size: quote.connection_size || 'DN50 (2")',
          pressure_test_bar: quote.pressure_test_bar || 16,
          working_pressure_bar: quote.working_pressure_bar || 10,
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

    if (quote.custom_materials && Array.isArray(quote.custom_materials)) {
      setCustomMaterials(quote.custom_materials)
    } else {
      setCustomMaterials([])
    }

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

    setMaterialsCost(quote.materials_cost ?? 0)
    setThirdPartyCost(quote.third_party_cost ?? 0)
    setOtherCosts(quote.other_costs ?? 0)
    setServiceMargin(quote.service_margin ?? 25)
    setSalesCommission(quote.sales_commission ?? 6)
    setAdminRate(quote.admin_rate ?? 3)
    // Se a proposta já tiver total_taxes salvo ou alíquotas individuais somadas, preserva; padrão 14.83%
    const existingTaxSum =
      (quote.pis_rate ?? 0) +
      (quote.cofins_rate ?? 0) +
      (quote.iss_rate ?? 0) +
      (quote.csll_rate ?? 0) +
      (quote.irpj_rate ?? 0) +
      (quote.ir_diff_rate ?? 0)
    const initialTaxRate =
      (quote as any).tax_rate ??
      (quote as any).taxes_rate ??
      (quote.service_details?.indirect_costs?.taxes?.totalTaxes != null
        ? Number(quote.service_details.indirect_costs.taxes.totalTaxes)
        : existingTaxSum > 0
          ? Number(existingTaxSum.toFixed(2))
          : 14.83)
    setTaxRate(initialTaxRate)
    setPisRate(quote.pis_rate ?? 0.65)
    setCofinsRate(quote.cofins_rate ?? 3.0)
    setIssRate(quote.iss_rate ?? 5.0)
    setCsllRate(quote.csll_rate ?? 2.88)
    setIrpjRate(quote.irpj_rate ?? 4.8)
    setIrDiffRate(quote.ir_diff_rate ?? 1.5)
    setPaymentTerms(quote.payment_terms || '28 DDL faturado após entrega técnica')
    setValidityDays(quote.validity_days || 15)
    setTechnicalNotes(quote.technical_notes || '')
    setCommercialNotes(quote.commercial_notes || '')
  }

  // Abrir editor para nova proposta
  const handleOpenCreateModal = () => {
    resetForm()
    setIsEditorOpen(true)
  }

  // Abrir editor para editar proposta existente
  const handleOpenEditModal = (quote: QuoteRecord) => {
    loadQuoteIntoForm(quote)
    setIsEditorOpen(true)
  }

  // Se receber selectedQuote das props externas (ex: do Kanban ou Pipeline), carrega e abre
  useEffect(() => {
    if (selectedQuote) {
      loadQuoteIntoForm(selectedQuote)
      setIsEditorOpen(true)
    }
  }, [selectedQuote])

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
    customMaterials,
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
                          <div className="max-w-[220px] truncate">
                            <span className="font-medium block truncate">
                              {quote.equipment_model
                                ? `${quote.equipment_brand || 'BERMO'} ${quote.equipment_model}`
                                : quote.title || 'Manutenção Geral'}
                            </span>
                            <span className="text-[10px] text-muted-foreground truncate block">
                              {quote.plate_count ? `${quote.plate_count} placas` : ''}{' '}
                              {quote.gasket_material ? `• ${quote.gasket_material}` : ''}
                            </span>
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
                                      window.open(`/proposta/${token}`, '_blank')
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
                  Editar Proposta {quoteNumber ? `#${quoteNumber}` : ''}
                </DialogTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Layout integral unificado: escopo, mão de obra, deslocamento, hospedagem e
                  fechamento comercial.
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
                    : '✓ Salvo automaticamente'}
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
                      3A. Escopo / Identificação Técnica
                    </CardTitle>
                    <span className="text-[11px] text-muted-foreground">
                      Dados do cliente, oportunidade, equipamentos, materiais e escopo técnico
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold">Cliente</Label>
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
                        <SelectTrigger className="text-xs h-8">
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
                        const currentModel = eq.model ?? (isPrimary ? equipmentModel : '')
                        const currentBrand = eq.brand ?? (isPrimary ? equipmentBrand : 'BERMO')
                        const currentQty = eq.quantity ?? (isPrimary ? equipmentQuantity : 1)
                        const currentPlateCount = eq.plate_count ?? (isPrimary ? plateCount : 40)
                        const currentPlateMat =
                          eq.plate_material ?? (isPrimary ? plateMaterial : 'AISI 316L')
                        const currentPlateThick =
                          eq.plate_thickness ?? (isPrimary ? plateThickness : 0.5)
                        const currentGasketMat =
                          eq.gasket_material ?? (isPrimary ? gasketMaterial : 'EPDM Clip-on')
                        const isSearchingThis = searchingSpecsIndex === eqIdx

                        return (
                          <div
                            key={eq.id || `eq-${eqIdx}`}
                            className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 space-y-3 relative"
                          >
                            <div className="flex items-center justify-between gap-2 border-b border-slate-200/70 dark:border-slate-800 pb-2">
                              <div className="flex items-center gap-2">
                                <Badge
                                  variant="secondary"
                                  className="text-[10px] font-mono font-bold bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300"
                                >
                                  Item #{eqIdx + 1}
                                  {isPrimary && ' (Principal)'}
                                </Badge>
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
                                  title="Buscar especificações técnicas online nos catálogos ou Google"
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
                              <div className="space-y-1 sm:col-span-2">
                                <Label className="text-xs font-semibold">
                                  Modelo do Equipamento
                                </Label>
                                <Input
                                  value={currentModel}
                                  onChange={(e) =>
                                    handleUpdateEquipment(eqIdx, { model: e.target.value })
                                  }
                                  placeholder="Ex: BP30 / TL10-BFG / M10-B"
                                  className="text-xs h-8 font-semibold"
                                />
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
                                  value={currentPlateCount}
                                  onChange={(e) =>
                                    handleUpdateEquipment(eqIdx, {
                                      plate_count: Number(e.target.value),
                                    })
                                  }
                                  className="text-xs h-7 font-mono bg-white dark:bg-slate-950"
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-[10px] text-muted-foreground">
                                  Material da Placa
                                </Label>
                                <Input
                                  value={currentPlateMat}
                                  onChange={(e) =>
                                    handleUpdateEquipment(eqIdx, {
                                      plate_material: e.target.value,
                                    })
                                  }
                                  placeholder="AISI 316L"
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
                                  value={currentPlateThick}
                                  onChange={(e) =>
                                    handleUpdateEquipment(eqIdx, {
                                      plate_thickness: Number(e.target.value),
                                    })
                                  }
                                  className="text-xs h-7 font-mono bg-white dark:bg-slate-950"
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-[10px] text-muted-foreground">Gaxeta</Label>
                                <Input
                                  value={currentGasketMat}
                                  onChange={(e) =>
                                    handleUpdateEquipment(eqIdx, {
                                      gasket_material: e.target.value,
                                    })
                                  }
                                  placeholder="EPDM Clip-on"
                                  className="text-xs h-7 bg-white dark:bg-slate-950"
                                />
                              </div>
                            </div>
                          </div>
                        )
                      })}
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
                      3B. Mão de Obra
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
                      3C. Deslocamento & Rotas
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
                      3D. Hospedagem & Alimentação
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
                      3E. Margens & Fechamento
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
                  {/* Bloco 1: Margens Comerciais & Operacionais */}
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 block">
                      Margens e Custos Indiretos
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs font-semibold">Margem de Serviço (%)</Label>
                          <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                            {(calculatedSalePrice * (serviceMargin / 100)).toLocaleString('pt-BR', {
                              style: 'currency',
                              currency: 'BRL',
                            })}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Input
                            type="number"
                            step="0.01"
                            value={serviceMargin}
                            onChange={(e) => setServiceMargin(Number(e.target.value))}
                            className="text-xs h-8 font-mono font-bold text-emerald-700 dark:text-emerald-400 flex-1 min-w-0"
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
                              className="w-16 h-8 text-[11px] font-mono px-1.5 shrink-0 bg-emerald-50/50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800"
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

                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs font-semibold">Comissão de Vendas (%)</Label>
                          <span className="text-[10px] font-mono text-blue-600 dark:text-blue-400 font-semibold">
                            {(calculatedSalePrice * (salesCommission / 100)).toLocaleString(
                              'pt-BR',
                              {
                                style: 'currency',
                                currency: 'BRL',
                              },
                            )}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Input
                            type="number"
                            step="0.01"
                            value={salesCommission}
                            onChange={(e) => setSalesCommission(Number(e.target.value))}
                            className="text-xs h-8 font-mono font-bold text-blue-700 dark:text-blue-400 flex-1 min-w-0"
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
                              className="w-16 h-8 text-[11px] font-mono px-1.5 shrink-0 bg-blue-50/50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800"
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

                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs font-semibold">Overhead Adm (%)</Label>
                          <span className="text-[10px] font-mono text-purple-600 dark:text-purple-400 font-semibold">
                            {adminAmount.toLocaleString('pt-BR', {
                              style: 'currency',
                              currency: 'BRL',
                            })}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Input
                            type="number"
                            step="0.01"
                            value={adminRate}
                            onChange={(e) => setAdminRate(Number(e.target.value))}
                            className="text-xs h-8 font-mono font-bold text-purple-700 dark:text-purple-400 flex-1 min-w-0"
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
                              className="w-16 h-8 text-[11px] font-mono px-1.5 shrink-0 bg-purple-50/50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800"
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

                      <div className="space-y-1">
                        <Label className="text-xs font-semibold">Validade da Proposta (Dias)</Label>
                        <Input
                          type="number"
                          value={validityDays}
                          onChange={(e) => setValidityDays(Number(e.target.value))}
                          className="text-xs h-8 font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Bloco 2: Taxa Fiscal Consolidada */}
                  <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Percent className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" />
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                          Tributos & Encargos Fiscais
                        </span>
                      </div>
                      <Badge
                        variant="outline"
                        className="text-[10.5px] font-mono font-bold bg-rose-50 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-900"
                      >
                        Total Tributos: {totalTaxesPercent.toFixed(2)}% (
                        {(calculatedSalePrice * (totalTaxesPercent / 100)).toLocaleString('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        })}
                        )
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="p-2.5 rounded-md bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                            Taxa Fiscal Consolidada (%)
                          </Label>
                          <span className="text-[10.5px] font-mono font-bold text-rose-600 dark:text-rose-400">
                            {(calculatedSalePrice * (totalTaxesPercent / 100)).toLocaleString(
                              'pt-BR',
                              {
                                style: 'currency',
                                currency: 'BRL',
                              },
                            )}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            step="0.01"
                            value={taxRate}
                            onChange={(e) => setTaxRate(Number(e.target.value))}
                            className="text-xs h-8 font-mono font-bold text-slate-900 dark:text-slate-100 flex-1"
                          />
                          <Badge
                            variant="outline"
                            className="text-[10px] font-mono text-muted-foreground shrink-0"
                          >
                            Padrão: 14,83%
                          </Badge>
                        </div>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">
                          Alíquota consolidada incidente sobre a receita bruta (PIS, COFINS, ISS,
                          CSLL e IRPJ).
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Bloco 3: Formação de Preço & Fechamento Gerencial */}
                  <div className="p-3.5 rounded-lg border-2 border-amber-300 dark:border-amber-900/60 bg-amber-50/70 dark:bg-amber-950/20 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-amber-950 dark:text-amber-200 flex items-center gap-1.5">
                        <Calculator className="h-3.5 w-3.5 text-amber-700 dark:text-amber-400" />
                        Formação de Preço (Soma Custos Diretos + Indiretos + Tributos)
                      </span>
                      <Badge className="bg-amber-700 dark:bg-amber-800 text-white font-mono text-[10px]">
                        DIVISOR {(divisor * 100).toFixed(1)}%
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                      {/* Custos Diretos */}
                      <div className="bg-white dark:bg-slate-900 p-2.5 rounded-md border border-amber-200 dark:border-amber-900/50 space-y-0.5">
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold block">
                          Custos Diretos Totais
                        </span>
                        <div className="font-mono font-bold text-slate-900 dark:text-slate-100 text-sm">
                          {directCostsTotal.toLocaleString('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          })}
                        </div>
                        <div className="text-[9.5px] text-slate-500 dark:text-slate-400">
                          Mão de obra + Viagem + Hotel
                        </div>
                      </div>

                      {/* Overhead Adm */}
                      <div className="bg-white dark:bg-slate-900 p-2.5 rounded-md border border-amber-200 dark:border-amber-900/50 space-y-0.5">
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold block">
                          Overhead Adm ({adminRate}%)
                        </span>
                        <div className="font-mono font-bold text-purple-700 dark:text-purple-400 text-sm">
                          {adminAmount.toLocaleString('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          })}
                        </div>
                        <div className="text-[9.5px] text-slate-500 dark:text-slate-400">
                          Custo Indireto Operacional
                        </div>
                      </div>

                      {/* Margem + Comis + Impostos */}
                      <div className="bg-white dark:bg-slate-900 p-2.5 rounded-md border border-amber-200 dark:border-amber-900/50 space-y-0.5">
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold block">
                          Margem + Comis + Impostos
                        </span>
                        <div className="font-mono font-bold text-amber-800 dark:text-amber-300 text-sm">
                          {(
                            calculatedSalePrice * (serviceMargin / 100) +
                            calculatedSalePrice * (salesCommission / 100) +
                            calculatedSalePrice * (totalTaxesPercent / 100) +
                            adminAmount
                          ).toLocaleString('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          })}
                        </div>
                        <div className="text-[9.5px] text-slate-500 dark:text-slate-400">
                          {(serviceMargin + salesCommission + totalTaxesPercent).toFixed(2)}% sobre
                          receita
                        </div>
                      </div>

                      {/* Preço Final */}
                      <div className="bg-amber-900 text-white p-2.5 rounded-md space-y-0.5">
                        <span className="text-[10px] text-amber-200 uppercase font-bold block">
                          Preço Final Homologado
                        </span>
                        <div className="font-mono font-black text-white text-base">
                          {calculatedSalePrice.toLocaleString('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          })}
                        </div>
                        <div className="text-[9.5px] text-amber-300">Valor de Venda ao Cliente</div>
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
                    window.open(`/proposta/${token}`, '_blank')
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
