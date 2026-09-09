import React, { useState, useEffect, useRef } from 'react'
import {
  FileText,
  Plus,
  Trash2,
  Edit,
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
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import {
  QuoteRecord,
  ClientRecord,
  QuoteStatus,
  QuoteTravelConfig,
  QuoteLodgingMealsConfig,
} from '@/types/crm'
import { QuoteSection3CTravel } from './QuoteSection3CTravel'
import { QuotePdfPreviewDialog } from './QuotePdfPreviewDialog'
import {
  BLUMENAU_COORDS,
  geocodeCity,
  fetchCepCoordinates,
  haversineDistance,
} from '@/lib/mapeia-calculator'
import { quotesService } from '@/services/quotes'

export interface QuotesManagerProps {
  quotes: QuoteRecord[]
  clients: ClientRecord[]
  selectedQuote?: QuoteRecord | null
  onCreateQuote: (data: Partial<QuoteRecord>) => Promise<void>
  onUpdateQuote: (id: string, data: Partial<QuoteRecord>) => Promise<void>
  onDeleteQuote: (id: string) => Promise<void>
  onUpdateQuoteStatus?: (id: string, status: QuoteStatus) => Promise<void>
  onCreateClient?: (data: Partial<ClientRecord>) => Promise<ClientRecord>
  onOpenCatalog?: () => void
}

// QuotesManager principal
export function QuotesManager({
  quotes,
  clients,
  selectedQuote,
  onCreateQuote,
  onUpdateQuote,
  onDeleteQuote,
  onUpdateQuoteStatus,
  onCreateClient,
  onOpenCatalog,
}: QuotesManagerProps) {
  const { toast } = useToast()

  // State de busca e filtros
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  // Proposta em edição / ativa
  const [activeQuoteId, setActiveQuoteId] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [activeTabSection, setActiveTabSection] = useState('escopo')

  // PDF Preview Dialog
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [quoteForPreview, setQuoteForPreview] = useState<QuoteRecord | null>(null)

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
  const [scopeOfWork, setScopeOfWork] = useState(
    'Desmontagem completa, limpeza química/mecânica por imersão, teste de líquido penetrante, substituição das gaxetas e teste hidrostático conforme norma ASME.',
  )

  // Seção 3A: Mão de Obra
  const [techCount, setTechCount] = useState(2)
  const [techHours, setTechHours] = useState(16)
  const [techRate, setTechRate] = useState(85)
  const [helperCount, setHelperCount] = useState(1)
  const [helperHours, setHelperHours] = useState(16)
  const [helperRate, setHelperRate] = useState(55)
  const [inspectorCount, setInspectorCount] = useState(0)
  const [inspectorHours, setInspectorHours] = useState(0)
  const [inspectorRate, setInspectorRate] = useState(120)

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

  // VALE TRANSPORTE (Feature Solicitada)
  const [transitVoucherQty, setTransitVoucherQty] = useState<number>(0)
  const [transitVoucherRate, setTransitVoucherRate] = useState<number>(0)

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

  // Auto-save debounce timer ref
  const autoSaveTimerRef = useRef<any>(null)
  const isInitialMount = useRef(true)

  // Cálculos de Mão de Obra
  const techTotal = techCount * techHours * techRate
  const helperTotal = helperCount * helperHours * helperRate
  const inspectorTotal = inspectorCount * inspectorHours * inspectorRate
  const totalLaborCost = techTotal + helperTotal + inspectorTotal

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

  // SUB-TOTAL VALE TRANSPORTE: qty * rate
  const transitVoucherSubtotal = Math.max(0, (transitVoucherQty || 0) * (transitVoucherRate || 0))

  // Total Deslocamento incluindo Vale Transporte
  const travelTotalCost = Math.max(
    0,
    baseFuelCost + baseTollCost + carRentalSubtotal + transitVoucherSubtotal,
  )

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

  // Total Tributos
  const totalTaxesPercent = pisRate + cofinsRate + issRate + csllRate + irpjRate + irDiffRate

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
      transit_voucher_qty: transitVoucherQty,
      transit_voucher_rate: transitVoucherRate,
      transit_voucher_total: transitVoucherSubtotal,
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

    return {
      title:
        quoteTitle || `Proposta Técnica ${equipmentModel || 'BERMO'} - ${clientName || 'Cliente'}`,
      quote_number:
        quoteNumber || `INT-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      client_id: clientId,
      client_name: clientName,
      status,
      equipment_brand: equipmentBrand,
      equipment_model: equipmentModel,
      equipment_quantity: equipmentQuantity,
      plate_count: plateCount,
      plate_material: plateMaterial,
      plate_thickness: plateThickness,
      gasket_material: gasketMaterial,
      connection_size: connectionSize,
      pressure_test_bar: pressureTestBar,
      working_pressure_bar: workingPressureBar,
      scope_of_work: scopeOfWork,

      // Custos diretos
      labor_hours: techHours + helperHours + inspectorHours,
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

      // VALE TRANSPORTE (Feature Solicitada)
      transit_voucher_qty: transitVoucherQty,
      transit_voucher_rate: transitVoucherRate,
      transit_voucher_total: transitVoucherSubtotal,
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

  // Reset Form
  const resetForm = () => {
    setActiveQuoteId(null)
    setIsEditing(false)
    setClientId('')
    setClientName('')
    setQuoteTitle('')
    setQuoteNumber('')
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
    setScopeOfWork(
      'Desmontagem completa, limpeza química/mecânica por imersão, teste de líquido penetrante, substituição das gaxetas e teste hidrostático conforme norma ASME.',
    )
    setTechCount(2)
    setTechHours(16)
    setTechRate(85)
    setHelperCount(1)
    setHelperHours(16)
    setHelperRate(55)
    setInspectorCount(0)
    setInspectorHours(0)
    setInspectorRate(120)

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

    // Reset Vale Transporte
    setTransitVoucherQty(0)
    setTransitVoucherRate(0)

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

  // Carregar e Restaurar Proposta Selecionada
  const loadQuoteIntoForm = (quote: QuoteRecord) => {
    setActiveQuoteId(quote.id)
    setIsEditing(true)
    setClientId(quote.client_id || '')
    setClientName(quote.client_name || '')
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
    setScopeOfWork(quote.scope_of_work || '')

    setTechCount(quote.tech_count ?? 2)
    setTechHours(quote.tech_hours ?? 16)
    setTechRate(quote.tech_rate ?? 85)
    setHelperCount(quote.helper_count ?? 1)
    setHelperHours(quote.helper_hours ?? 16)
    setHelperRate(quote.helper_rate ?? 55)
    setInspectorCount(quote.inspector_count ?? 0)
    setInspectorHours(quote.inspector_hours ?? 0)
    setInspectorRate(quote.inspector_rate ?? 120)

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

    // RESTAURAÇÃO VALE TRANSPORTE: raiz da quote, travel_config ou fallback 0
    setTransitVoucherQty(quote.transit_voucher_qty ?? quote.travel_config?.transit_voucher_qty ?? 0)
    setTransitVoucherRate(
      quote.transit_voucher_rate ?? quote.travel_config?.transit_voucher_rate ?? 0,
    )

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

  // Atualizar quando selectedQuote mudar por props externas (ex: do KanBan ou navegação)
  useEffect(() => {
    if (selectedQuote) {
      loadQuoteIntoForm(selectedQuote)
    }
  }, [selectedQuote])

  // AUTO-SAVE DE 2 SEGUNDOS: debounced quando alterado em proposta existente
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false
      return
    }

    if (!activeQuoteId || !isEditing) return

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
    activeQuoteId,
    isEditing,
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
    transitVoucherQty,
    transitVoucherRate,
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
    paymentTerms,
    validityDays,
    technicalNotes,
    commercialNotes,
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

      // Cálculo de distância por coordenadas geográficas
      const lat1 = origCoords.lat
      const lon1 = origCoords.lng ?? 0
      const lat2 = destCoords.lat
      const lon2 = destCoords.lng ?? 0

      const straightKm = haversineDistance(lat1, lon1, lat2, lon2, 1.0)
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
        const lat1 = origCoords.lat
        const lon1 = origCoords.lng ?? 0
        const lat2 = destCoords.lat
        const lon2 = destCoords.lng ?? 0

        const straightKm = haversineDistance(lat1, lon1, lat2, lon2, 1.0)
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
      // Ignora erro de geocodificação
    } finally {
      setIsCalculatingRoute(false)
    }
  }

  // Salvar Proposta (Manual)
  const handleSaveQuote = async () => {
    const payload = getFormDataObject()

    try {
      if (activeQuoteId) {
        await onUpdateQuote(activeQuoteId, payload)
        toast({ title: 'Proposta atualizada com sucesso!' })
      } else {
        await onCreateQuote(payload)
        toast({ title: 'Nova proposta técnica criada!' })
      }
    } catch (err: any) {
      toast({
        title: 'Erro ao salvar proposta',
        description: err.message || 'Verifique os dados preenchidos.',
        variant: 'destructive',
      })
    }
  }

  // Filtragem de Lista de Propostas
  const filteredQuotes = quotes.filter((q) => {
    const matchesSearch =
      (q.quote_number || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (q.client_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (q.equipment_model || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (q.title || '').toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === 'all' || q.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-6">
      {/* Barra de Cabeçalho da Gestão de Propostas */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Calculator className="h-6 w-6 text-teal-600" />
            Engenharia de Propostas & Orçamentos Técnicos BERMO
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Composição detalhada de custos industriais, rotas e margens de serviço
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
            onClick={() => {
              resetForm()
              setIsEditing(true)
            }}
            className="text-xs font-bold bg-teal-700 hover:bg-teal-600 text-white shadow-xs"
          >
            <Plus className="h-4 w-4 mr-1" />
            Nova Proposta
          </Button>
        </div>
      </div>

      {/* Grid: Lista de Propostas (Esquerda) vs Formulário de Edição (Direita) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Painel Esquerdo: Lista de Propostas Existentes */}
        <div className="lg:col-span-4 space-y-3">
          <Card className="border-slate-200 dark:border-slate-800">
            <CardHeader className="p-3.5 pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <FolderOpen className="h-4 w-4 text-teal-600" />
                  Propostas ({filteredQuotes.length})
                </CardTitle>
                <Badge variant="outline" className="text-[10px] font-mono">
                  Total: {quotes.length}
                </Badge>
              </div>

              {/* Filtro e Pesquisa */}
              <div className="space-y-2 pt-2">
                <div className="relative">
                  <Search className="h-3.5 w-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
                  <Input
                    placeholder="Buscar cliente, número, modelo..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="text-xs h-8 pl-8"
                  />
                </div>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="text-xs h-7">
                    <SelectValue placeholder="Todos os Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Status</SelectItem>
                    <SelectItem value="draft">Rascunho</SelectItem>
                    <SelectItem value="sent">Enviada</SelectItem>
                    <SelectItem value="approved">Aprovada</SelectItem>
                    <SelectItem value="rejected">Rejeitada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>

            <CardContent className="p-2 space-y-2 max-h-[750px] overflow-y-auto">
              {filteredQuotes.length === 0 ? (
                <div className="p-6 text-center text-xs text-muted-foreground">
                  Nenhuma proposta encontrada.
                </div>
              ) : (
                filteredQuotes.map((q) => {
                  const isSelected = activeQuoteId === q.id
                  return (
                    <div
                      key={q.id}
                      onClick={() => loadQuoteIntoForm(q)}
                      className={`p-3 rounded-lg border text-xs cursor-pointer transition-all ${
                        isSelected
                          ? 'border-teal-500 bg-teal-50/70 dark:bg-teal-950/40 shadow-xs'
                          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="font-mono font-bold text-[11px] text-teal-700 dark:text-teal-400">
                          {q.quote_number || 'INT-S/N'}
                        </span>
                        <Badge
                          variant="outline"
                          className={`text-[9.5px] px-1.5 py-0 uppercase ${
                            q.status === 'approved'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                              : q.status === 'rejected'
                                ? 'bg-rose-50 text-rose-700 border-rose-300'
                                : q.status === 'sent'
                                  ? 'bg-blue-50 text-blue-700 border-blue-300'
                                  : 'bg-slate-100 text-slate-700 border-slate-300'
                          }`}
                        >
                          {q.status === 'approved'
                            ? 'Aprovada'
                            : q.status === 'rejected'
                              ? 'Rejeitada'
                              : q.status === 'sent'
                                ? 'Enviada'
                                : 'Rascunho'}
                        </Badge>
                      </div>

                      <div className="font-bold text-slate-900 dark:text-slate-100 line-clamp-1">
                        {q.client_name || 'Cliente Sem Nome'}
                      </div>
                      <div className="text-[11px] text-muted-foreground line-clamp-1">
                        {q.equipment_model ? `Trocador ${q.equipment_model}` : q.title || 'Serviço'}
                      </div>

                      <div className="flex items-center justify-between pt-2 mt-2 border-t border-slate-100 dark:border-slate-800 text-[11px]">
                        <span className="font-bold text-slate-900 dark:text-slate-100 font-mono">
                          {(q.total || q.final_price || 0).toLocaleString('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          })}
                        </span>
                        <div
                          className="flex items-center gap-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-slate-500 hover:text-teal-600"
                            onClick={() => {
                              setQuoteForPreview(q)
                              setIsPreviewOpen(true)
                            }}
                            title="Visualizar PDF / Impressão"
                          >
                            <Printer className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-slate-400 hover:text-rose-600"
                            onClick={() => {
                              if (confirm('Deseja excluir esta proposta?')) {
                                onDeleteQuote(q.id)
                                if (activeQuoteId === q.id) resetForm()
                              }
                            }}
                            title="Excluir Proposta"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </CardContent>
          </Card>
        </div>

        {/* Painel Direito: Editor Completo de Composição da Proposta */}
        <div className="lg:col-span-8 space-y-4">
          <Card className="border-slate-200 dark:border-slate-800 shadow-xs">
            <CardHeader className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-900/50">
              <div>
                <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <span>
                    {activeQuoteId
                      ? `Editando Proposta #${quoteNumber}`
                      : 'Nova Proposta Comercial'}
                  </span>
                  {activeQuoteId && (
                    <Badge
                      variant="outline"
                      className="text-[10px] font-mono text-emerald-700 bg-emerald-50"
                    >
                      Auto-save 2s ativo
                    </Badge>
                  )}
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  Altere os parâmetros e o cálculo consolidará custos diretos e indiretos
                  automaticamente.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const currentObj = getFormDataObject() as QuoteRecord
                    setQuoteForPreview({ ...currentObj, id: activeQuoteId || 'draft' })
                    setIsPreviewOpen(true)
                  }}
                  className="text-xs h-8 font-semibold border-slate-300 dark:border-slate-700"
                >
                  <Printer className="h-3.5 w-3.5 mr-1 text-teal-600" />
                  Visualizar PDF
                </Button>

                <Button
                  type="button"
                  size="sm"
                  onClick={handleSaveQuote}
                  className="text-xs h-8 font-bold bg-teal-700 hover:bg-teal-600 text-white shadow-xs"
                >
                  <Save className="h-3.5 w-3.5 mr-1" />
                  Salvar
                </Button>
              </div>
            </CardHeader>

            <CardContent className="p-4 space-y-5">
              {/* Resumo Financeiro no Topo do Editor */}
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
                    Combustível + Pedágios + V.T.
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
                    Valor total homologado
                  </span>
                </div>
              </div>

              {/* Seções por Abas */}
              <Tabs value={activeTabSection} onValueChange={setActiveTabSection} className="w-full">
                <TabsList className="grid grid-cols-4 w-full h-9">
                  <TabsTrigger value="escopo" className="text-xs">
                    1. Cliente & Escopo
                  </TabsTrigger>
                  <TabsTrigger value="labor" className="text-xs">
                    2. Mão de Obra
                  </TabsTrigger>
                  <TabsTrigger value="travel" className="text-xs">
                    3. Deslocamento & V.T.
                  </TabsTrigger>
                  <TabsTrigger value="pricing" className="text-xs">
                    4. Margens & Fechamento
                  </TabsTrigger>
                </TabsList>

                {/* ABA 1: Cliente & Escopo */}
                <TabsContent value="escopo" className="space-y-4 pt-3">
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

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold">Modelo do Equipamento</Label>
                      <Input
                        value={equipmentModel}
                        onChange={(e) => setEquipmentModel(e.target.value)}
                        placeholder="Ex: BP30 / TL10-BFG"
                        className="text-xs h-8 font-semibold"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs font-semibold">Marca</Label>
                      <Input
                        value={equipmentBrand}
                        onChange={(e) => setEquipmentBrand(e.target.value)}
                        placeholder="Ex: BERMO / Alfa Laval"
                        className="text-xs h-8"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs font-semibold">Quantidade de Equipamentos</Label>
                      <Input
                        type="number"
                        min="1"
                        value={equipmentQuantity}
                        onChange={(e) => setEquipmentQuantity(Math.max(1, Number(e.target.value)))}
                        className="text-xs h-8 font-mono"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">
                      Escopo Detalhado do Fornecimento
                    </Label>
                    <Textarea
                      rows={3}
                      value={scopeOfWork}
                      onChange={(e) => setScopeOfWork(e.target.value)}
                      className="text-xs leading-relaxed"
                    />
                  </div>
                </TabsContent>

                {/* ABA 2: Mão de Obra */}
                <TabsContent value="labor" className="space-y-4 pt-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 space-y-2">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                        Técnico Especialista
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
                        Auxiliar Operacional
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
                        Inspetor / Encarregado
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
                </TabsContent>

                {/* ABA 3: Deslocamento & Rotas com VALE TRANSPORTE */}
                <TabsContent value="travel" className="space-y-4 pt-3">
                  <QuoteSection3CTravel
                    originCep={originCep}
                    originAddress={originAddress}
                    destinationCep={destinationCep}
                    destinationAddress={destinationAddress}
                    distanceKm={distanceKm}
                    isRoundTrip={isRoundTrip}
                    consumptionKmL={consumptionKmL}
                    fuelPrice={fuelPrice}
                    tollRoadPercent={tollRoadPercent}
                    manualFuelAdj={manualFuelAdj}
                    manualTollAdj={manualTollAdj}
                    baseFuelCost={baseFuelCost}
                    baseTollCost={baseTollCost}
                    estimatedTolls={estimatedTolls}
                    travelTotal={travelTotalCost}
                    isCalculatingRoute={isCalculatingRoute}
                    carRentalType={carRentalType}
                    carRentalDailyRate={carRentalDailyRate}
                    carRentalDays={carRentalDays}
                    carRentalSubtotal={carRentalSubtotal}
                    transitVoucherQty={transitVoucherQty}
                    transitVoucherRate={transitVoucherRate}
                    transitVoucherSubtotal={transitVoucherSubtotal}
                    onOriginCepChange={setOriginCep}
                    onOriginAddressChange={setOriginAddress}
                    onDestinationCepChange={setDestinationCep}
                    onDestinationAddressChange={setDestinationAddress}
                    onDistanceKmChange={setDistanceKm}
                    onToggleRoundTrip={setIsRoundTrip}
                    onConsumptionKmLChange={setConsumptionKmL}
                    onFuelPriceChange={setFuelPrice}
                    onTollRoadPercentChange={setTollRoadPercent}
                    onManualFuelAdjChange={setManualFuelAdj}
                    onManualTollAdjChange={setManualTollAdj}
                    onCarRentalTypeChange={setCarRentalType}
                    onCarRentalDailyRateChange={setCarRentalDailyRate}
                    onCarRentalDaysChange={setCarRentalDays}
                    onTransitVoucherQtyChange={setTransitVoucherQty}
                    onTransitVoucherRateChange={setTransitVoucherRate}
                    onRecalculateRouteByCep={handleRecalculateRouteByCep}
                    onRecalculateRouteByCities={handleRecalculateRouteByCities}
                  />
                </TabsContent>

                {/* ABA 4: Margens & Fechamento */}
                <TabsContent value="pricing" className="space-y-4 pt-3">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold">Margem de Serviço (%)</Label>
                      <Input
                        type="number"
                        value={serviceMargin}
                        onChange={(e) => setServiceMargin(Number(e.target.value))}
                        className="text-xs h-8 font-mono font-bold text-emerald-700"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs font-semibold">Comissão de Vendas (%)</Label>
                      <Input
                        type="number"
                        value={salesCommission}
                        onChange={(e) => setSalesCommission(Number(e.target.value))}
                        className="text-xs h-8 font-mono font-bold text-blue-700"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs font-semibold">Overhead Adm (%)</Label>
                      <Input
                        type="number"
                        value={adminRate}
                        onChange={(e) => setAdminRate(Number(e.target.value))}
                        className="text-xs h-8 font-mono"
                      />
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

                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Condições de Pagamento</Label>
                    <Input
                      value={paymentTerms}
                      onChange={(e) => setPaymentTerms(e.target.value)}
                      placeholder="Ex: 28 DDL faturado"
                      className="text-xs h-8"
                    />
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modal de Impressão e PDF */}
      {quoteForPreview && (
        <QuotePdfPreviewDialog
          quote={quoteForPreview}
          open={isPreviewOpen}
          onOpenChange={setIsPreviewOpen}
        />
      )}
    </div>
  )
}
export default QuotesManager
