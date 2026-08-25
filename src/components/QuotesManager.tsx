import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  FileSpreadsheet,
  Plus,
  Send,
  CheckCircle2,
  Clock,
  Printer,
  Copy,
  Building2,
  Trash2,
  Package,
  Layers,
  Sparkles,
  Download,
  Flame,
  Truck,
  Hotel,
  Utensils,
  Percent,
  Calculator,
  ShieldCheck,
  Eye,
  EyeOff,
  Wrench,
  UserCheck,
  Calendar,
  DollarSign,
  MapPin,
  HelpCircle,
  SlidersHorizontal,
} from 'lucide-react'
import type {
  QuoteRecord,
  QuoteStatus,
  ClientRecord,
  ProductRecord,
  QuoteItem,
  ServiceTechnicalSpecs,
  LaborCosts,
  TravelCosts,
  LodgingMealsCosts,
  IndirectCosts,
  IndirectTaxes,
  PaymentAndValidity,
  PaymentConditionType,
} from '@/types/crm'
import { BERMO_CATALOG, BermoProductItem } from '@/data/bermo-catalog'
import { calculateRouteMapeiaStyle } from '@/lib/mapeia-calculator'
import {
  calculateQuoteServiceComposition,
  DEFAULT_INDIRECT_TAXES,
  QuoteServiceComputation,
} from '@/lib/quote-calculator'

interface QuotesManagerProps {
  quotes: QuoteRecord[]
  clients: ClientRecord[]
  products: ProductRecord[]
  selectedQuote?: QuoteRecord | null
  onSelectQuote: (quote: QuoteRecord | null) => void
  onCreateQuote: (data: Partial<QuoteRecord>) => void
  onUpdateQuoteStatus: (id: string, status: QuoteStatus) => void
  onOpenCatalog?: () => void
}

const TEMPLATE_PRESETS = [
  {
    id: 'tpl-trocador-gaxetado',
    name: 'Modelo 1: Manutenção em Trocador a Placas BP6 Sanitário',
    description: 'Abertura, limpeza química CIP, troca de gaxetas EPDM FDA e teste hidrostático.',
    productCode: 'BERMO-BP6-SAN',
    defaultItemName:
      'Serviço de Manutenção Preventiva e Troca de Gaxetas em Trocador BP6 Sanitário',
    fluid: 'agua_quente',
    tempIn: 85,
    tempOut: 25,
    pressure: 4.5,
    flow: 15,
    serviceScope:
      'Desmontagem de pacote de placas, limpeza CIP, relubrificação de tirantes e teste',
    laborTechHours: 16,
    laborHelperHours: 16,
    laborInspectorHours: 4,
    distanceKm: 180,
    hotelDays: 1,
    mealsDays: 2,
    terms: '28 DDL',
  },
  {
    id: 'tpl-valvulas-vapor',
    name: 'Modelo 2: Overhaul em Válvulas Triexcêntricas ARI-ZETRIX & DF-40',
    description:
      'Lapidação de sedes metal x metal, substituição de anel de grafite e calibração de purga.',
    productCode: 'ARI-ZETRIX',
    defaultItemName:
      'Overhaul e Teste de Estanqueidade Zero Leakage ARI-ZETRIX DN200 + Válvula DF-40',
    fluid: 'vapor',
    tempIn: 300,
    tempOut: 300,
    pressure: 25,
    flow: 40,
    serviceScope:
      'Lapidação de sedes, ensaio de estanqueidade conforme norma e regulagem pneumática',
    laborTechHours: 24,
    laborHelperHours: 12,
    laborInspectorHours: 8,
    distanceKm: 340,
    hotelDays: 2,
    mealsDays: 3,
    terms: '14 DDL',
  },
  {
    id: 'tpl-estacao-misturadora',
    name: 'Modelo 3: Instalação & Start-up de Estação Misturadora WD2010',
    description:
      'Montagem mecânica, tubulações de vapor e água com teste de segurança anti-queimadura.',
    productCode: 'BERMO-WD-2010',
    defaultItemName:
      'Instalação, Comissionamento e Start-up de Estação Misturadora Água/Vapor WD2010',
    fluid: 'vapor',
    tempIn: 140,
    tempOut: 65,
    pressure: 6,
    flow: 8,
    serviceScope: 'Instalação completa em linha de higienização de fábrica com teste térmico',
    laborTechHours: 12,
    laborHelperHours: 12,
    laborInspectorHours: 2,
    distanceKm: 90,
    hotelDays: 0,
    mealsDays: 1,
    terms: '30 DDL',
  },
]

export const QuotesManager: React.FC<QuotesManagerProps> = ({
  quotes,
  clients,
  products,
  selectedQuote,
  onSelectQuote,
  onCreateQuote,
  onUpdateQuoteStatus,
  onOpenCatalog,
}) => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [viewMode, setViewMode] = useState<'client' | 'internal'>('client') // Proposta cliente vs Preview interno

  // Form State - 3a. Equipamento & Especificações Técnicas BERMO
  const [quoteNumber, setQuoteNumber] = useState(`INT-2025-00${quotes.length + 1}`)
  const [clientId, setClientId] = useState('')
  const [selectedBermoCode, setSelectedBermoCode] = useState<string>('BERMO-BP6-SAN')
  const [serviceScope, setServiceScope] = useState(
    'Manutenção preventiva especializada e revisão de estanqueidade',
  )
  const [fluidType, setFluidType] = useState<any>('vapor')
  const [fluidName, setFluidName] = useState('Vapor Saturado')
  const [inletTemp, setInletTemp] = useState<number | string>(120)
  const [outletTemp, setOutletTemp] = useState<number | string>(60)
  const [operatingPressure, setOperatingPressure] = useState<number | string>(6.0)
  const [flowRate, setFlowRate] = useState<number | string>(12)
  const [pressureDrop, setPressureDrop] = useState<number | string>(0.3)
  const [equipmentSize, setEquipmentSize] = useState('DN65 / 40 Placas')
  const [frameMaterial, setFrameMaterial] = useState('Aço Carbono Pintura Epóxi')
  const [gasketType, setGasketType] = useState('EPDM FDA')

  // Form State - Itens e Serviços
  const [items, setItems] = useState<QuoteItem[]>([
    {
      name: 'Prestação de Serviços Especializados em Equipamento BERMO',
      quantity: 1,
      unit_price: 6500,
      discount: 0,
      total: 6500,
    },
  ])

  // Form State - 3b. Mão de Obra (3 funções)
  const [techCount, setTechCount] = useState<number>(1)
  const [techHours, setTechHours] = useState<number>(16)
  const [techRate, setTechRate] = useState<number>(180) // R$ 180/h

  const [helperCount, setHelperCount] = useState<number>(1)
  const [helperHours, setHelperHours] = useState<number>(16)
  const [helperRate, setHelperRate] = useState<number>(95) // R$ 95/h

  const [inspectorCount, setInspectorCount] = useState<number>(1)
  const [inspectorHours, setInspectorHours] = useState<number>(4)
  const [inspectorRate, setInspectorRate] = useState<number>(240) // R$ 240/h

  // Form State - 3c. Deslocamento (Mapeia / Google Maps)
  const [originAddress, setOriginAddress] = useState('Rua Bernardo Reiter, 500 - Blumenau/SC')
  const [originCep, setOriginCep] = useState('89066-000')
  const [destinationAddress, setDestinationAddress] = useState('')
  const [destinationCep, setDestinationCep] = useState('80010-000')
  const [distanceKm, setDistanceKm] = useState<number>(150)
  const [roundTrip, setRoundTrip] = useState<boolean>(true)
  const [consumptionKmL, setConsumptionKmL] = useState<number>(10)
  const [fuelPrice, setFuelPrice] = useState<number>(6.1)
  const [tollRoadPercent, setTollRoadPercent] = useState<number>(70)
  const [tollRateKm, setTollRateKm] = useState<number>(0.15)
  const [manualFuelAdj, setManualFuelAdj] = useState<number>(0)
  const [manualTollAdj, setManualTollAdj] = useState<number>(0)

  // Form State - 3d. Hospedagem & Alimentação
  const [hotelDays, setHotelDays] = useState<number>(1)
  const [hotelRate, setHotelRate] = useState<number>(250) // R$ 250 por diária
  const [mealsDays, setMealsDays] = useState<number>(2)
  const [mealsRate, setMealsRate] = useState<number>(90) // R$ 90 por dia/refeições

  // Form State - 3e. Custos Indiretos (Internos)
  const [serviceMargin, setServiceMargin] = useState<number>(25) // Slider 20% a 30% (padrão 25%)
  const [adminCost, setAdminCost] = useState<number>(15) // Fixo 15%
  const [salesCommission, setSalesCommission] = useState<number>(6) // Slider 4% a 10% (padrão 6%)

  // Impostos
  const [pisRate, setPisRate] = useState<number>(1.65)
  const [cofinsRate, setCofinsRate] = useState<number>(7.6)
  const [issRate, setIssRate] = useState<number>(5.0) // Editável por município
  const [csllRate, setCsllRate] = useState<number>(1.08)
  const [irpjRate, setIrpjRate] = useState<number>(4.8)
  const [irDiffRate, setIrDiffRate] = useState<number>(20.0) // 20% sobre IRPJ

  // Form State - 3f. Validade e Condições de Pagamento
  const [validityDays, setValidityDays] = useState<number>(10) // 10 dias úteis
  const [paymentCondition, setPaymentCondition] = useState<PaymentConditionType>('28_ddl')
  const [customPaymentCondition, setCustomPaymentCondition] = useState('')
  const [notes, setNotes] = useState('')

  // Efeito ao selecionar cliente: preenche cidade e destino automaticamente
  useEffect(() => {
    if (clientId) {
      const c = clients.find((client) => client.id === clientId)
      if (c) {
        if (c.address || c.city) {
          setDestinationAddress(
            `${c.address ? c.address + ', ' : ''}${c.city || ''} - ${c.state || ''}`,
          )
        }
        if (c.city === 'São Paulo' || c.state === 'SP') setDestinationCep('01001-000')
        else if (c.city === 'Curitiba' || c.state === 'PR') setDestinationCep('80010-000')
        else if (c.city === 'Porto Alegre' || c.state === 'RS') setDestinationCep('90010-000')
        else if (c.city === 'Belo Horizonte' || c.state === 'MG') setDestinationCep('30130-000')
        else if (c.city === 'Ribeirão Preto') setDestinationCep('14000-000')
        else setDestinationCep('88010-000')
      }
    }
  }, [clientId, clients])

  // Recalcular Rota Mapeia automaticamente quando o CEP de destino ou distância mudar
  const handleRecalculateRoute = async () => {
    const res = await calculateRouteMapeiaStyle({
      originCep,
      destinationCep,
      consumptionKmL,
      fuelPrice,
      tollRoadPercent,
      tollRateKm,
      roundTrip,
      manualDistanceKm: distanceKm > 0 ? distanceKm : undefined,
    })
    setDistanceKm(res.distanceKm)
  }

  // Sincronizar dados ao selecionar produto BERMO
  const handleSelectBermoProduct = (code: string) => {
    setSelectedBermoCode(code)
    const prd = BERMO_CATALOG.find((p) => p.code === code)
    if (prd) {
      if (prd.specs.connection) setEquipmentSize(prd.specs.connection)
      if (prd.specs.gaskets) setGasketType(prd.specs.gaskets.split('/')[0].trim())
      if (prd.specs.materials) setFrameMaterial(prd.specs.materials.split('/')[0].trim())

      // Atualizar primeiro item da proposta
      const updated = [...items]
      updated[0] = {
        name: `Prestação de Serviços em ${prd.name}`,
        quantity: 1,
        unit_price: Math.round(prd.basePrice * 0.45),
        discount: 0,
        total: Math.round(prd.basePrice * 0.45),
        bermo_specs: {
          productCode: prd.code,
          productModel: prd.model,
          productBrand: prd.brand,
          serviceScope,
          fluidType,
          inletTemp,
          outletTemp,
          operatingPressure,
          flowRate,
          equipmentSize,
        },
      }
      setItems(updated)
    }
  }

  const handleApplyPreset = (tplId: string) => {
    const tpl = TEMPLATE_PRESETS.find((t) => t.id === tplId)
    if (!tpl) return

    setSelectedBermoCode(tpl.productCode)
    setServiceScope(tpl.serviceScope)
    setFluidType(tpl.fluid)
    setInletTemp(tpl.tempIn)
    setOutletTemp(tpl.tempOut)
    setOperatingPressure(tpl.pressure)
    setFlowRate(tpl.flow)
    setTechHours(tpl.laborTechHours)
    setHelperHours(tpl.laborHelperHours)
    setInspectorHours(tpl.laborInspectorHours)
    setDistanceKm(tpl.distanceKm)
    setHotelDays(tpl.hotelDays)
    setMealsDays(tpl.mealsDays)
    if (tpl.terms === '14 DDL') setPaymentCondition('14_ddl')
    else if (tpl.terms === '28 DDL') setPaymentCondition('28_ddl')
    else if (tpl.terms === '30 DDL') setPaymentCondition('30_ddl')

    setItems([
      {
        name: tpl.defaultItemName,
        quantity: 1,
        unit_price: 5800,
        discount: 0,
        total: 5800,
      },
    ])
    setNotes(`Orçamento estruturado com base no ${tpl.name}. Validade: 10 dias úteis.`)
  }

  // Cálculos em tempo real
  const laborTechTotal = techCount * techHours * techRate
  const laborHelperTotal = helperCount * helperHours * helperRate
  const laborInspectorTotal = inspectorCount * inspectorHours * inspectorRate
  const laborTotal = laborTechTotal + laborHelperTotal + laborInspectorTotal

  const effectiveDistance = roundTrip ? distanceKm * 2 : distanceKm
  const baseFuelCost =
    Math.round((effectiveDistance / Math.max(consumptionKmL, 1)) * fuelPrice * 100) / 100
  const baseTollCost =
    Math.round(effectiveDistance * (tollRoadPercent / 100) * tollRateKm * 100) / 100
  const travelFuelCost = baseFuelCost + Number(manualFuelAdj || 0)
  const travelTollCost = baseTollCost + Number(manualTollAdj || 0)
  const travelTotal = Math.max(0, travelFuelCost + travelTollCost)

  const hotelTotal = hotelDays * hotelRate
  const mealsTotal = mealsDays * mealsRate
  const lodgingMealsTotal = hotelTotal + mealsTotal

  const laborCostsObj: LaborCosts = {
    technician: {
      professionalsCount: techCount,
      estimatedHours: techHours,
      hourlyRate: techRate,
      total: laborTechTotal,
    },
    helper: {
      professionalsCount: helperCount,
      estimatedHours: helperHours,
      hourlyRate: helperRate,
      total: laborHelperTotal,
    },
    inspector: {
      professionalsCount: inspectorCount,
      estimatedHours: inspectorHours,
      hourlyRate: inspectorRate,
      total: laborInspectorTotal,
    },
    total: laborTotal,
  }

  const travelCostsObj: TravelCosts = {
    originAddress,
    originCep,
    destinationAddress,
    destinationCep,
    distanceKm,
    roundTrip,
    fuelConsumptionKmL: consumptionKmL,
    fuelPricePerLiter: fuelPrice,
    tollRoadPercentage: tollRoadPercent,
    tollRatePerKm: tollRateKm,
    calculatedFuelCost: baseFuelCost,
    calculatedTollCost: baseTollCost,
    manualFuelAdjustment: Number(manualFuelAdj || 0),
    manualTollAdjustment: Number(manualTollAdj || 0),
    total: travelTotal,
  }

  const lodgingMealsCostsObj: LodgingMealsCosts = {
    hotelDailyCount: hotelDays,
    hotelDailyRate: hotelRate,
    mealsDailyCount: mealsDays,
    mealsDailyRate: mealsRate,
    hotelSubtotal: hotelTotal,
    mealsSubtotal: mealsTotal,
    total: lodgingMealsTotal,
  }

  const customTaxesObj: IndirectTaxes = {
    pis: pisRate,
    cofins: cofinsRate,
    iss: issRate,
    csll: csllRate,
    irpj: irpjRate,
    irDifference: irDiffRate,
    totalTaxesPercentage: 0,
    calculatedTaxesAmount: 0,
  }

  const computation: QuoteServiceComputation = calculateQuoteServiceComposition({
    items,
    labor: laborCostsObj,
    travel: travelCostsObj,
    lodgingMeals: lodgingMealsCostsObj,
    serviceMarginPercent: serviceMargin,
    adminCostPercent: adminCost,
    salesCommissionPercent: salesCommission,
    customTaxes: customTaxesObj,
  })

  // Itens manipulation
  const handleAddItem = (productId?: string) => {
    if (productId) {
      const bermo = BERMO_CATALOG.find((p) => p.id === productId || p.code === productId)
      if (bermo) {
        setItems([
          ...items,
          {
            name: `Serviço Especializado BERMO: ${bermo.name}`,
            quantity: 1,
            unit_price: Math.round(bermo.basePrice * 0.4),
            discount: 0,
            total: Math.round(bermo.basePrice * 0.4),
            bermo_specs: {
              productCode: bermo.code,
              productModel: bermo.model,
              productBrand: bermo.brand,
              equipmentSize: bermo.specs.connection,
            },
          },
        ])
        return
      }
    }
    setItems([
      ...items,
      {
        name: 'Serviço Técnico Adicional / Teste de Estanqueidade',
        quantity: 1,
        unit_price: 1500,
        discount: 0,
        total: 1500,
      },
    ])
  }

  const handleUpdateItem = (index: number, field: keyof QuoteItem, value: any) => {
    const updated = [...items]
    const item = { ...updated[index], [field]: value }
    const qty = Number(item.quantity) || 1
    const price = Number(item.unit_price) || 0
    const disc = Number(item.discount) || 0
    item.total = Math.max(0, qty * price - disc)
    updated[index] = item
    setItems(updated)
  }

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const getPaymentTermLabel = (type: PaymentConditionType, custom?: string) => {
    switch (type) {
      case '14_ddl':
        return '14 DDL (14 dias do dia líquido)'
      case '28_ddl':
        return '28 DDL (28 dias do dia líquido)'
      case '30_ddl':
        return '30 DDL (30 dias negociados)'
      case '45_ddl':
        return '45 DDL (45 dias negociados)'
      case '60_ddl':
        return '60 DDL (60 dias negociados)'
      case 'custom':
        return custom || 'À combinar'
    }
  }

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    const client = clients.find((c) => c.id === clientId)
    const prd = BERMO_CATALOG.find((p) => p.code === selectedBermoCode)

    const paymentTermsFormatted = getPaymentTermLabel(paymentCondition, customPaymentCondition)
    const validUntilDate = new Date()
    validUntilDate.setDate(validUntilDate.getDate() + (validityDays || 10) * 1.4) // Aproximação dias corridos p/ dias úteis

    const quotePayload: Partial<QuoteRecord> = {
      quote_number: quoteNumber || `INT-2025-${Math.floor(100 + Math.random() * 900)}`,
      client_id: clientId || undefined,
      client_name: client ? client.name : 'Cliente Industrial',
      status: 'draft',
      items,
      subtotal: computation.directCostsTotal,
      discount_total: 0,
      total: computation.finalClientPrice,
      payment_terms: paymentTermsFormatted,
      valid_until: validUntilDate.toISOString(),
      notes:
        notes ||
        `Orçamento de Prestação de Serviços BERMO (${prd?.name || 'Válvulas & Trocadores'}).`,
      assigned_to: 'Alexandre Nogueira - Especialista Técnico Intertermal',
      service_details: {
        service_technical_specs: {
          productCode: selectedBermoCode,
          productModel: prd?.model,
          productBrand: prd?.brand,
          serviceScope,
          fluidType,
          fluidName,
          inletTemp,
          outletTemp,
          operatingPressure,
          flowRate,
          pressureDrop,
          equipmentSize,
          frameMaterial,
          gasketType,
        },
        labor_costs: laborCostsObj,
        travel_costs: travelCostsObj,
        lodging_meals_costs: lodgingMealsCostsObj,
        indirect_costs: {
          serviceMarginPercent: serviceMargin,
          administrativeCostPercent: adminCost,
          salesCommissionPercent: salesCommission,
          taxes: computation.taxes,
          totalDirectCosts: computation.directCostsTotal,
          serviceMarginAmount: computation.serviceMarginAmount,
          adminCostAmount: computation.adminCostAmount,
          salesCommissionAmount: computation.salesCommissionAmount,
          taxesAmount: computation.taxesAmount,
          totalIndirectAmount: computation.totalIndirectCosts,
          calculatedSalePrice: computation.finalClientPrice,
        },
        payment_and_validity: {
          validityDays,
          conditionType: paymentCondition,
          customConditionText: customPaymentCondition,
        },
      },
    }

    onCreateQuote(quotePayload)
    setIsCreateModalOpen(false)
  }

  const currentViewQuote = selectedQuote || (quotes.length > 0 ? quotes[0] : null)

  return (
    <div className="space-y-6">
      {/* Header com Branding Intertermal / BERMO */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Wrench className="h-6 w-6 text-teal-600 dark:text-teal-400" />
            Orçamentos de Prestação de Serviços BERMO
          </h2>
          <p className="text-xs md:text-sm text-muted-foreground mt-0.5">
            Gerador técnico de propostas com cálculo de mão de obra (3 funções), logística Mapeia,
            hospedagem e precificação interna.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {onOpenCatalog && (
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenCatalog}
              className="border-teal-300 dark:border-teal-800 text-teal-700 dark:text-teal-300 hover:bg-teal-50 dark:hover:bg-teal-950 text-xs"
            >
              <Package className="h-4 w-4 mr-1.5" />
              Catálogo BERMO
            </Button>
          )}
          <Button
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-teal-700 hover:bg-teal-600 text-white shadow-sm text-xs"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Novo Orçamento de Serviço
          </Button>
        </div>
      </div>

      {/* Modelos Prontos de Serviços BERMO */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        {TEMPLATE_PRESETS.map((tpl) => (
          <Card
            key={tpl.id}
            className="p-3.5 border-slate-200 dark:border-slate-800 hover:border-teal-500 transition-all bg-gradient-to-b from-white to-slate-50/50 dark:from-slate-900 dark:to-slate-950 flex flex-col justify-between"
          >
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <Flame className="h-4 w-4 text-teal-600" />
                <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100">{tpl.name}</h3>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">{tpl.description}</p>
            </div>
            <div className="pt-3 mt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="text-[10px] font-semibold text-slate-500">
                Condição: {tpl.terms}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  handleApplyPreset(tpl.id)
                  setIsCreateModalOpen(true)
                }}
                className="text-[11px] h-7 text-teal-700 border-teal-300 hover:bg-teal-50 dark:hover:bg-teal-950"
              >
                Usar Este Modelo
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Grid: Lista Lateral de Orçamentos + Visualizador */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Lista Lateral */}
        <div className="lg:col-span-4 space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-1 flex items-center justify-between">
            <span>Propostas de Serviços ({quotes.length})</span>
          </div>

          {quotes.map((q) => {
            const isSelected = currentViewQuote?.id === q.id
            return (
              <Card
                key={q.id}
                onClick={() => onSelectQuote(q)}
                className={`p-3.5 cursor-pointer transition-all border ${
                  isSelected
                    ? 'border-teal-600 ring-2 ring-teal-500/20 bg-teal-50/20 dark:bg-teal-950/20'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between gap-1">
                  <div className="space-y-0.5">
                    <span className="font-mono text-xs font-bold text-teal-700 dark:text-teal-400">
                      {q.quote_number}
                    </span>
                    <div className="text-xs font-semibold text-slate-900 dark:text-slate-100 line-clamp-1">
                      {q.client_name || 'Cliente'}
                    </div>
                  </div>
                  <Badge
                    variant={
                      q.status === 'approved'
                        ? 'default'
                        : q.status === 'sent'
                          ? 'secondary'
                          : 'outline'
                    }
                    className="text-[10px] capitalize"
                  >
                    {q.status === 'approved'
                      ? 'Aprovado'
                      : q.status === 'sent'
                        ? 'Enviado'
                        : q.status === 'draft'
                          ? 'Rascunho'
                          : q.status}
                  </Badge>
                </div>

                <div className="flex items-center justify-between pt-2 mt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                  <span className="font-bold text-slate-900 dark:text-slate-100">
                    {(q.total || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                  <span className="text-[11px] text-muted-foreground truncate max-w-[140px]">
                    {q.payment_terms || '14 DDL'}
                  </span>
                </div>
              </Card>
            )
          })}
        </div>

        {/* Visualizador da Proposta (Modo Cliente vs Modo Interno com Custos Indiretos) */}
        <div className="lg:col-span-8">
          {currentViewQuote ? (
            <Card className="border-slate-300 dark:border-slate-700 shadow-md bg-white dark:bg-slate-950 overflow-hidden">
              {/* Header do Documento */}
              <div className="bg-gradient-to-r from-slate-950 via-teal-950 to-slate-900 p-6 text-white flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono tracking-widest text-teal-300 uppercase font-bold">
                      INTERTERMAL • PROPOSTA DE SERVIÇOS TÉCNICOS BERMO
                    </span>
                  </div>
                  <h3 className="text-xl font-extrabold">{currentViewQuote.quote_number}</h3>
                  <p className="text-xs text-slate-300">
                    Emitido por:{' '}
                    {currentViewQuote.assigned_to ||
                      'Alexandre Nogueira - Especialista de Aplicações BERMO'}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Alternador de Visão: Cliente vs Interno */}
                  <div className="flex items-center rounded-lg bg-slate-800/90 p-1 border border-slate-700 text-xs">
                    <button
                      onClick={() => setViewMode('client')}
                      className={`px-2.5 py-1 rounded font-medium flex items-center gap-1 transition-all ${
                        viewMode === 'client'
                          ? 'bg-teal-700 text-white shadow-xs'
                          : 'text-slate-400 hover:text-white'
                      }`}
                      title="Exibição formal enviada ao cliente (sem custos indiretos)"
                    >
                      <Eye className="h-3 w-3" />
                      Proposta Cliente
                    </button>
                    <button
                      onClick={() => setViewMode('internal')}
                      className={`px-2.5 py-1 rounded font-medium flex items-center gap-1 transition-all ${
                        viewMode === 'internal'
                          ? 'bg-teal-700 text-white shadow-xs'
                          : 'text-slate-400 hover:text-white'
                      }`}
                      title="Exibição interna completa com impostos, margem e comissão"
                    >
                      <SlidersHorizontal className="h-3 w-3" />
                      Composição Interna
                    </button>
                  </div>

                  <Select
                    value={currentViewQuote.status}
                    onValueChange={(val) =>
                      onUpdateQuoteStatus(currentViewQuote.id, val as QuoteStatus)
                    }
                  >
                    <SelectTrigger className="h-8 text-xs bg-slate-800 border-slate-700 text-white w-28">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Rascunho</SelectItem>
                      <SelectItem value="sent">Enviado</SelectItem>
                      <SelectItem value="approved">Aprovado</SelectItem>
                      <SelectItem value="rejected">Recusado</SelectItem>
                      <SelectItem value="expired">Expirado</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.print()}
                    className="h-8 text-xs bg-slate-800/80 hover:bg-slate-700 border-slate-700 text-white"
                  >
                    <Printer className="h-3.5 w-3.5 mr-1" /> Imprimir / PDF
                  </Button>
                </div>
              </div>

              {/* Corpo da Proposta */}
              <CardContent className="p-6 space-y-6">
                {/* Banner de Identificação da Visão */}
                {viewMode === 'client' ? (
                  <div className="p-2.5 rounded-lg bg-teal-50/60 dark:bg-teal-950/20 border border-teal-200/80 dark:border-teal-900/60 flex items-center justify-between text-xs text-teal-800 dark:text-teal-300">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-teal-600 shrink-0" />
                      <span>
                        <strong>Visão Oficial do Cliente:</strong> Exibe apenas dados do cliente,
                        produtos/serviços BERMO, mão de obra, logística, valor total e condições.
                        Custos indiretos ocultados.
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="p-2.5 rounded-lg bg-amber-50/70 dark:bg-amber-950/30 border border-amber-300/80 dark:border-amber-900/60 flex items-center justify-between text-xs text-amber-900 dark:text-amber-300">
                    <div className="flex items-center gap-2">
                      <SlidersHorizontal className="h-4 w-4 text-amber-600 shrink-0" />
                      <span>
                        <strong>Visão Interna (Intertermal):</strong> Visualização gerencial com
                        margem de lucro, taxa administrativa, impostos (PIS/COFINS/ISS/CSLL/IRPJ) e
                        comissão de vendas.
                      </span>
                    </div>
                  </div>
                )}

                {/* Dados do Cliente e Condições */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                  <div className="space-y-1">
                    <span className="text-muted-foreground uppercase text-[10px] font-bold tracking-wider block">
                      Destinatário / Empresa Cliente
                    </span>
                    <div className="font-bold text-sm text-slate-900 dark:text-slate-100">
                      {currentViewQuote.client_name || 'Cliente Corporativo'}
                    </div>
                    <div className="text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3 text-slate-400" />
                      Validade da Proposta:{' '}
                      <strong className="text-slate-700 dark:text-slate-300">
                        10 dias úteis
                      </strong>{' '}
                      da emissão
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-muted-foreground uppercase text-[10px] font-bold tracking-wider block">
                      Condições de Pagamento & Faturamento
                    </span>
                    <div className="font-semibold text-teal-700 dark:text-teal-400">
                      {currentViewQuote.payment_terms || '28 DDL (28 dias do dia líquido)'}
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      Faturamento via boleto bancário mediante aprovação cadastral.
                    </div>
                  </div>
                </div>

                {/* Tabela de Itens e Serviços BERMO */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center justify-between">
                    <span>1. Escopo de Serviços & Produtos BERMO</span>
                  </h4>
                  <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 uppercase text-[10px] font-semibold">
                        <tr>
                          <th className="p-2.5">Descrição do Serviço / Produto BERMO</th>
                          <th className="p-2.5 text-center">Qtd</th>
                          <th className="p-2.5 text-right">Valor Unitário</th>
                          <th className="p-2.5 text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {currentViewQuote.items && currentViewQuote.items.length > 0 ? (
                          currentViewQuote.items.map((item, idx) => (
                            <tr
                              key={idx}
                              className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50"
                            >
                              <td className="p-2.5 space-y-1">
                                <div className="font-semibold text-slate-900 dark:text-slate-100">
                                  {item.name}
                                </div>
                                {item.bermo_specs && (
                                  <div className="text-[11px] text-muted-foreground bg-slate-50 dark:bg-slate-900/70 p-1.5 rounded border border-slate-100 dark:border-slate-800 space-y-0.5">
                                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 font-mono text-[10px]">
                                      {item.bermo_specs.productCode && (
                                        <span>
                                          Ref: <strong>{item.bermo_specs.productCode}</strong>
                                        </span>
                                      )}
                                      {item.bermo_specs.fluidType && (
                                        <span>
                                          Fluido: <strong>{item.bermo_specs.fluidType}</strong>
                                        </span>
                                      )}
                                      {item.bermo_specs.operatingPressure && (
                                        <span>
                                          Pressão:{' '}
                                          <strong>{item.bermo_specs.operatingPressure} bar</strong>
                                        </span>
                                      )}
                                      {item.bermo_specs.inletTemp && (
                                        <span>
                                          Temp:{' '}
                                          <strong>
                                            {item.bermo_specs.inletTemp}°C →{' '}
                                            {item.bermo_specs.outletTemp}°C
                                          </strong>
                                        </span>
                                      )}
                                    </div>
                                    {item.bermo_specs.serviceScope && (
                                      <div className="text-[10px] text-slate-600 dark:text-slate-300">
                                        Escopo: {item.bermo_specs.serviceScope}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </td>
                              <td className="p-2.5 text-center">{item.quantity}</td>
                              <td className="p-2.5 text-right">
                                {(item.unit_price || 0).toLocaleString('pt-BR', {
                                  style: 'currency',
                                  currency: 'BRL',
                                })}
                              </td>
                              <td className="p-2.5 text-right font-bold text-slate-900 dark:text-slate-100">
                                {(item.total || 0).toLocaleString('pt-BR', {
                                  style: 'currency',
                                  currency: 'BRL',
                                })}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={4} className="p-4 text-center text-muted-foreground">
                              Nenhum item adicionado.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 4. Custos Indiretos Internos (EXIBIDO APENAS NO MODO INTERNO) */}
                {viewMode === 'internal' && (
                  <div className="p-4 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-300 dark:border-amber-900/60 space-y-3 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-amber-900 dark:text-amber-300 flex items-center gap-1.5 uppercase text-[11px] tracking-wider">
                        <SlidersHorizontal className="h-4 w-4" />
                        Custos Internos & Composição de Preço (NÃO VISÍVEL AO CLIENTE)
                      </span>
                      <Badge className="bg-amber-200 text-amber-900 dark:bg-amber-900 dark:text-amber-200 text-[10px]">
                        Uso Interno Intertermal
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                      <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900">
                        <span className="text-muted-foreground block text-[10px]">
                          Margem de Serviços:
                        </span>
                        <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                          {serviceMargin}%
                        </span>
                        <span className="text-[10px] text-muted-foreground block">
                          {(computation.serviceMarginAmount || 0).toLocaleString('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          })}
                        </span>
                      </div>

                      <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900">
                        <span className="text-muted-foreground block text-[10px]">
                          Custos Administrativos:
                        </span>
                        <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                          15% fixo
                        </span>
                        <span className="text-[10px] text-muted-foreground block">
                          {(computation.adminCostAmount || 0).toLocaleString('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          })}
                        </span>
                      </div>

                      <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900">
                        <span className="text-muted-foreground block text-[10px]">
                          Total de Impostos:
                        </span>
                        <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                          {computation.totalTaxesPercent}%
                        </span>
                        <span className="text-[10px] text-muted-foreground block">
                          {(computation.taxesAmount || 0).toLocaleString('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          })}
                        </span>
                      </div>

                      <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900">
                        <span className="text-muted-foreground block text-[10px]">
                          Comissão de Vendas:
                        </span>
                        <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                          {salesCommission}%
                        </span>
                        <span className="text-[10px] text-muted-foreground block">
                          {(computation.salesCommissionAmount || 0).toLocaleString('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          })}
                        </span>
                      </div>
                    </div>

                    <div className="text-[11px] text-slate-600 dark:text-slate-300 pt-1 border-t border-amber-200/60 dark:border-amber-900/60 flex flex-wrap gap-x-4">
                      <span>
                        PIS: <strong>1.65%</strong>
                      </span>
                      <span>
                        COFINS: <strong>7.60%</strong>
                      </span>
                      <span>
                        ISS: <strong>{issRate}%</strong>
                      </span>
                      <span>
                        CSLL: <strong>1.08%</strong>
                      </span>
                      <span>
                        IRPJ: <strong>4.80%</strong>
                      </span>
                      <span>
                        Dif. IR (20% s/ IRPJ): <strong>0.96%</strong>
                      </span>
                    </div>
                  </div>
                )}

                {/* Resumo Financeiro Final */}
                <div className="flex justify-end pt-2">
                  <div className="w-72 space-y-2 text-xs">
                    {viewMode === 'internal' && (
                      <div className="flex justify-between text-muted-foreground">
                        <span>Custos Diretos (Subtotal):</span>
                        <span>
                          {(
                            computation.directCostsTotal ||
                            currentViewQuote.subtotal ||
                            0
                          ).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </span>
                      </div>
                    )}
                    {viewMode === 'internal' && (
                      <div className="flex justify-between text-muted-foreground">
                        <span>Custos Indiretos + Margem + Impostos:</span>
                        <span>
                          {(computation.totalIndirectCosts || 0).toLocaleString('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          })}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between text-base font-extrabold text-slate-900 dark:text-slate-100 pt-2 border-t border-slate-200 dark:border-slate-800">
                      <span>Valor Total da Proposta:</span>
                      <span className="text-teal-700 dark:text-teal-400">
                        {(currentViewQuote.total || 0).toLocaleString('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Observações & Condições */}
                {currentViewQuote.notes && (
                  <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300">
                    <span className="font-bold block text-slate-900 dark:text-slate-100 mb-1">
                      Observações Técnicas & Condições Gerais:
                    </span>
                    {currentViewQuote.notes}
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="p-12 text-center text-muted-foreground">
              <FileSpreadsheet className="h-10 w-10 mx-auto text-slate-400 mb-2" />
              <p className="text-sm font-semibold">Nenhum orçamento selecionado</p>
              <p className="text-xs">
                Selecione uma proposta na lista ou gere uma nova proposta técnica.
              </p>
            </Card>
          )}
        </div>
      </div>

      {/* Modal Completo de Criação de Orçamento de Prestação de Serviços BERMO */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="sm:max-w-[840px] max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <Badge className="bg-teal-700 text-white text-[10px]">
                Intertermal - Serviços BERMO
              </Badge>
              <span className="text-xs text-muted-foreground">
                Engenharia & Manutenção de Válvulas e Trocadores
              </span>
            </div>
            <DialogTitle className="text-lg font-bold">
              Novo Orçamento de Prestação de Serviços
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreate} className="space-y-5 py-2">
            {/* 1. Dados Básicos */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-medium">Número do Orçamento *</Label>
                <Input
                  value={quoteNumber}
                  onChange={(e) => setQuoteNumber(e.target.value)}
                  className="text-xs font-mono"
                  required
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-medium">Cliente Industrial Destinatário *</Label>
                <Select value={clientId} onValueChange={setClientId} required>
                  <SelectTrigger className="text-xs">
                    <SelectValue placeholder="Selecione o cliente..." />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((c) => (
                      <SelectItem key={c.id} value={c.id} className="text-xs">
                        {c.name} {c.city ? `(${c.city}/${c.state})` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* SEÇÃO 3a: SELEÇÃO DE PRODUTOS & ESPECIFICAÇÕES TÉCNICAS BERMO */}
            <div className="p-3.5 rounded-xl bg-teal-50/40 dark:bg-teal-950/20 border border-teal-200 dark:border-teal-900/60 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Flame className="h-4 w-4 text-teal-700" />
                  <span className="text-xs font-bold text-teal-900 dark:text-teal-200 uppercase tracking-wider">
                    3a. Produto BERMO & Parâmetros Técnicos do Serviço
                  </span>
                </div>
                <Badge
                  variant="outline"
                  className="text-[10px] bg-teal-100 text-teal-800 border-teal-300"
                >
                  Catálogo Oficial BERMO
                </Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                    Modelo / Referência BERMO *
                  </Label>
                  <Select value={selectedBermoCode} onValueChange={handleSelectBermoProduct}>
                    <SelectTrigger className="text-xs bg-white dark:bg-slate-900">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {BERMO_CATALOG.map((p) => (
                        <SelectItem key={p.code} value={p.code} className="text-xs">
                          {p.code} - {p.name} ({p.brand})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                    Fluido Utilizado no Processo
                  </Label>
                  <Select value={fluidType} onValueChange={setFluidType}>
                    <SelectTrigger className="text-xs bg-white dark:bg-slate-900">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="vapor" className="text-xs">
                        Vapor Saturado / Superaquecido
                      </SelectItem>
                      <SelectItem value="oleo_termico" className="text-xs">
                        Óleo Térmico
                      </SelectItem>
                      <SelectItem value="agua_quente" className="text-xs">
                        Água Quente
                      </SelectItem>
                      <SelectItem value="agua_gelada" className="text-xs">
                        Água Gelada / Chilled Water
                      </SelectItem>
                      <SelectItem value="ar_comprimido" className="text-xs">
                        Ar Comprimido
                      </SelectItem>
                      <SelectItem value="gases" className="text-xs">
                        Gases / CO2
                      </SelectItem>
                      <SelectItem value="quimico" className="text-xs">
                        Fluido Químico / CIP
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Grid Técnico de Parâmetros Termodinâmicos */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                <div className="space-y-1">
                  <Label className="text-[10px] text-muted-foreground">Temp. Entrada (°C)</Label>
                  <Input
                    type="number"
                    value={inletTemp}
                    onChange={(e) => setInletTemp(e.target.value)}
                    className="text-xs h-8 bg-white dark:bg-slate-900"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] text-muted-foreground">Temp. Saída (°C)</Label>
                  <Input
                    type="number"
                    value={outletTemp}
                    onChange={(e) => setOutletTemp(e.target.value)}
                    className="text-xs h-8 bg-white dark:bg-slate-900"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] text-muted-foreground">
                    Pressão Trabalho (bar)
                  </Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={operatingPressure}
                    onChange={(e) => setOperatingPressure(e.target.value)}
                    className="text-xs h-8 bg-white dark:bg-slate-900"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] text-muted-foreground">Vazão (m³/h ou kg/s)</Label>
                  <Input
                    type="number"
                    value={flowRate}
                    onChange={(e) => setFlowRate(e.target.value)}
                    className="text-xs h-8 bg-white dark:bg-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                <div className="space-y-1">
                  <Label className="text-[10px] text-muted-foreground">Tamanho / Conexão</Label>
                  <Input
                    value={equipmentSize}
                    onChange={(e) => setEquipmentSize(e.target.value)}
                    placeholder="ex: DN65 / 40 Placas"
                    className="text-xs h-8 bg-white dark:bg-slate-900"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] text-muted-foreground">
                    Material da Estrutura/Placas
                  </Label>
                  <Input
                    value={frameMaterial}
                    onChange={(e) => setFrameMaterial(e.target.value)}
                    placeholder="ex: AISI 316L / Titânio"
                    className="text-xs h-8 bg-white dark:bg-slate-900"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] text-muted-foreground">
                    Tipo de Vedação / Sede
                  </Label>
                  <Input
                    value={gasketType}
                    onChange={(e) => setGasketType(e.target.value)}
                    placeholder="ex: EPDM FDA / NBR / Metal"
                    className="text-xs h-8 bg-white dark:bg-slate-900"
                  />
                </div>
              </div>
            </div>

            {/* SEÇÃO 3b: MÃO DE OBRA (3 FUNÇÕES) */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <UserCheck className="h-4 w-4 text-blue-600" />
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                    3b. Mão de Obra Especializada (3 Funções)
                  </span>
                </div>
                <span className="text-xs font-bold text-blue-600">
                  Subtotal M.O.:{' '}
                  {laborTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
              </div>

              {/* Tabela das 3 Funções */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* 1. Técnico */}
                <div className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-xs text-slate-900 dark:text-slate-100">
                      1. Técnico Mecânico
                    </span>
                    <Badge variant="secondary" className="text-[9px]">
                      Líder
                    </Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-1 text-[10px]">
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
                  <div className="text-right text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    Total:{' '}
                    {laborTechTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </div>
                </div>

                {/* 2. Ajudante */}
                <div className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-xs text-slate-900 dark:text-slate-100">
                      2. Ajudante
                    </span>
                    <Badge variant="secondary" className="text-[9px]">
                      Suporte
                    </Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-1 text-[10px]">
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
                  <div className="text-right text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    Total:{' '}
                    {laborHelperTotal.toLocaleString('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    })}
                  </div>
                </div>

                {/* 3. Inspetor */}
                <div className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-xs text-slate-900 dark:text-slate-100">
                      3. Inspetor / NDT
                    </span>
                    <Badge variant="secondary" className="text-[9px]">
                      Qualidade
                    </Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-1 text-[10px]">
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
                  <div className="text-right text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    Total:{' '}
                    {laborInspectorTotal.toLocaleString('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* SEÇÃO 3c: DESLOCAMENTO (PADRÃO MAPIEA & GOOGLE MAPS) */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Truck className="h-4 w-4 text-emerald-600" />
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                    3c. Deslocamento & Rotas (Ref. Mapeia / Google Maps)
                  </span>
                </div>
                <span className="text-xs font-bold text-emerald-600">
                  Subtotal Deslocamento:{' '}
                  {travelTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-[10px] text-muted-foreground">
                    Origem (Endereço e CEP)
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      value={originAddress}
                      onChange={(e) => setOriginAddress(e.target.value)}
                      placeholder="Blumenau/SC"
                      className="text-xs h-8 flex-1"
                    />
                    <Input
                      value={originCep}
                      onChange={(e) => setOriginCep(e.target.value)}
                      placeholder="CEP Origem"
                      className="text-xs h-8 w-28 font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-[10px] text-muted-foreground">
                    Destino do Cliente (Endereço e CEP)
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      value={destinationAddress}
                      onChange={(e) => setDestinationAddress(e.target.value)}
                      placeholder="Cidade/UF do Cliente"
                      className="text-xs h-8 flex-1"
                    />
                    <Input
                      value={destinationCep}
                      onChange={(e) => setDestinationCep(e.target.value)}
                      placeholder="CEP Destino"
                      className="text-xs h-8 w-28 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Parâmetros do Mapeia */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                <div className="space-y-1">
                  <Label className="text-[10px] text-muted-foreground">Distância (km só ida)</Label>
                  <Input
                    type="number"
                    value={distanceKm}
                    onChange={(e) => setDistanceKm(Number(e.target.value))}
                    className="text-xs h-8 font-bold"
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
                    % Rodovias com Pedágio
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
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 bg-white dark:bg-slate-950 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs">
                <div className="flex items-center justify-between sm:justify-start gap-2">
                  <span className="text-muted-foreground">Combustível Calc.:</span>
                  <strong className="text-slate-900 dark:text-slate-100">
                    {baseFuelCost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </strong>
                </div>
                <div className="flex items-center justify-between sm:justify-start gap-2">
                  <span className="text-muted-foreground">Pedágio Calc. (R$ 0,15/km):</span>
                  <strong className="text-slate-900 dark:text-slate-100">
                    {baseTollCost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </strong>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleRecalculateRoute}
                    className="text-[11px] h-7 w-full border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                  >
                    Recalcular Rota
                  </Button>
                </div>
              </div>
            </div>

            {/* SEÇÃO 3d: HOSPEDAGEM & ALIMENTAÇÃO */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Hotel className="h-4 w-4 text-purple-600" />
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                    3d. Hospedagem & Alimentação
                  </span>
                </div>
                <span className="text-xs font-bold text-purple-600">
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

            {/* SEÇÃO 3e: CUSTOS INDIRETOS (INTERNOS - NÃO VISÍVEIS AO CLIENTE) */}
            <div className="p-4 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border-2 border-amber-300 dark:border-amber-800 space-y-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="h-4 w-4 text-amber-600" />
                  <span className="text-xs font-bold text-amber-900 dark:text-amber-200 uppercase tracking-wider">
                    3e. Custos Internos (NÃO visíveis ao cliente na proposta)
                  </span>
                </div>
                <Badge className="bg-amber-200 text-amber-900 dark:bg-amber-900 dark:text-amber-100 text-[10px] font-bold">
                  Composição de Preço de Venda
                </Badge>
              </div>

              {/* Sliders: Margem e Comissão */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white dark:bg-slate-950 p-3 rounded-lg border border-amber-200 dark:border-amber-900">
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <Label className="font-semibold text-slate-900 dark:text-slate-100">
                      Margem de Serviços: <strong>{serviceMargin}%</strong>
                    </Label>
                    <span className="text-[11px] text-muted-foreground">
                      (20% a 30% - Padrão 25%)
                    </span>
                  </div>
                  <Slider
                    value={[serviceMargin]}
                    min={20}
                    max={30}
                    step={1}
                    onValueChange={(val) => setServiceMargin(val[0])}
                    className="py-1"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <Label className="font-semibold text-slate-900 dark:text-slate-100">
                      Comissão de Vendas: <strong>{salesCommission}%</strong>
                    </Label>
                    <span className="text-[11px] text-muted-foreground">
                      (4% a 10% - Padrão 6%)
                    </span>
                  </div>
                  <Slider
                    value={[salesCommission]}
                    min={4}
                    max={10}
                    step={1}
                    onValueChange={(val) => setSalesCommission(val[0])}
                    className="py-1"
                  />
                </div>
              </div>

              {/* Impostos Editáveis */}
              <div className="space-y-1.5 pt-1">
                <Label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                  Impostos Fiscais Incidentes (Total: {computation.totalTaxesPercent}%)
                </Label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-xs">
                  <div>
                    <Label className="text-[9px] text-muted-foreground">PIS (%)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={pisRate}
                      onChange={(e) => setPisRate(Number(e.target.value))}
                      className="text-xs h-7"
                    />
                  </div>
                  <div>
                    <Label className="text-[9px] text-muted-foreground">COFINS (%)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={cofinsRate}
                      onChange={(e) => setCofinsRate(Number(e.target.value))}
                      className="text-xs h-7"
                    />
                  </div>
                  <div>
                    <Label className="text-[9px] text-muted-foreground">ISS Municipal (%)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={issRate}
                      onChange={(e) => setIssRate(Number(e.target.value))}
                      className="text-xs h-7 bg-amber-50/60 dark:bg-amber-950/40"
                    />
                  </div>
                  <div>
                    <Label className="text-[9px] text-muted-foreground">CSLL (%)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={csllRate}
                      onChange={(e) => setCsllRate(Number(e.target.value))}
                      className="text-xs h-7"
                    />
                  </div>
                  <div>
                    <Label className="text-[9px] text-muted-foreground">IRPJ (%)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={irpjRate}
                      onChange={(e) => setIrpjRate(Number(e.target.value))}
                      className="text-xs h-7"
                    />
                  </div>
                  <div>
                    <Label className="text-[9px] text-muted-foreground">Dif. IR s/ IRPJ (%)</Label>
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
            </div>

            {/* SEÇÃO 3f: PRAZO DE VALIDADE & CONDIÇÕES DE PAGAMENTO */}
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
                  <span className="text-xs text-muted-foreground">
                    dias úteis a partir da emissão
                  </span>
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
                      14 DDL (14 dias do dia líquido) - Padrão
                    </SelectItem>
                    <SelectItem value="28_ddl" className="text-xs">
                      28 DDL (28 dias do dia líquido) - Padrão
                    </SelectItem>
                    <SelectItem value="30_ddl" className="text-xs">
                      30 DDL (Negociação)
                    </SelectItem>
                    <SelectItem value="45_ddl" className="text-xs">
                      45 DDL (Negociação)
                    </SelectItem>
                    <SelectItem value="60_ddl" className="text-xs">
                      60 DDL (Negociação)
                    </SelectItem>
                    <SelectItem value="custom" className="text-xs">
                      Outras Condições Especiais
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Totalizador Geral e Botões */}
            <div className="p-4 rounded-xl bg-slate-900 text-white flex items-center justify-between">
              <div>
                <span className="text-[11px] text-slate-400 block">
                  Preço Final de Venda ao Cliente:
                </span>
                <span className="text-xl font-black text-teal-300">
                  {computation.finalClientPrice.toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  })}
                </span>
              </div>
              <div className="text-right text-[11px] text-slate-300">
                <div>
                  Custos Diretos:{' '}
                  {computation.directCostsTotal.toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  })}
                </div>
                <div>
                  Custos Indiretos:{' '}
                  {computation.totalIndirectCosts.toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  })}
                </div>
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsCreateModalOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" size="sm" className="bg-teal-700 hover:bg-teal-600 text-white">
                Gerar Proposta Intertermal
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
