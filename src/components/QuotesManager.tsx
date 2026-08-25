import React, { useState, useMemo } from 'react'
import {
  QuoteRecord,
  QuoteItem,
  ClientRecord,
  QuoteStatus,
  PaymentConditionType,
  MaintenanceMaterialItem,
} from '@/types/crm'
import {
  BERMO_CATALOG,
  SUPPLIERS_DATABASE,
  searchSupplierProduct,
  getStandardServiceMethodology,
  PROPOSAL_INCLUSIONS_TEXT,
  BermoProductItem,
} from '@/data/bermo-catalog'
import { calculateQuotePricing } from '@/lib/quote-calculator'
import { calculateDistanceBetweenCeps } from '@/lib/mapeia-calculator'
import { QuotePdfPreviewDialog } from '@/components/QuotePdfPreviewDialog'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
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
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Plus,
  Trash2,
  FileText,
  Clock,
  Printer,
  Sparkles,
  Wrench,
  Flame,
  Truck,
  Hotel,
  SlidersHorizontal,
  Eye,
  ShieldCheck,
  UserCheck,
  Package,
  FileSpreadsheet,
  CheckCircle2,
  Search,
  Layers,
  AlertCircle,
} from 'lucide-react'

interface QuotesManagerProps {
  quotes: QuoteRecord[]
  clients: ClientRecord[]
  selectedQuote?: QuoteRecord | null
  onCreateQuote: (quote: Partial<QuoteRecord>) => void
  onUpdateQuote?: (id: string, quote: Partial<QuoteRecord>) => void
  onUpdateQuoteStatus: (id: string, status: QuoteStatus) => void
  onOpenCatalog?: () => void
  onCreateClient?: (client: Partial<ClientRecord>) => Promise<ClientRecord>
}

const TEMPLATE_PRESETS = [
  {
    id: 'bermo-standard-clean',
    name: 'Manutenção Padrão BERMO (Limpeza + NDT)',
    description:
      'Abertura de trocador a placas, desincrustação, líquido penetrante, troca de gaxetas e teste de estanqueidade.',
    productCode: 'BP30',
    servicePrice: 4200,
    labor: {
      techCount: 1,
      techHours: 16,
      techRate: 85,
      helperCount: 1,
      helperHours: 16,
      helperRate: 50,
      inspectorCount: 1,
      inspectorHours: 8,
      inspectorRate: 110,
    },
    terms: '28 DDL',
  },
  {
    id: 'bermo-sanitary-cip',
    name: 'Revisão Sanitária BP6-S (Alimentício / Pharma)',
    description:
      'Higienização profunda grau alimentício, inspeção de placas AISI 316L, substituição por gaxetas EPDM FDA.',
    productCode: 'BP6-S',
    servicePrice: 5800,
    labor: {
      techCount: 2,
      techHours: 20,
      techRate: 90,
      helperCount: 1,
      helperHours: 20,
      helperRate: 55,
      inspectorCount: 1,
      inspectorHours: 12,
      inspectorRate: 120,
    },
    terms: '14 DDL',
  },
  {
    id: 'bermo-heavy-plant',
    name: 'Overhaul Completo Linha Pesada (BL50 / BP60)',
    description:
      'Reforma completa de grande porte em campo: jateamento controlado, retífica de encostos, teste 25 bar.',
    productCode: 'BL50',
    servicePrice: 12500,
    labor: {
      techCount: 2,
      techHours: 36,
      techRate: 95,
      helperCount: 2,
      helperHours: 36,
      helperRate: 55,
      inspectorCount: 1,
      inspectorHours: 18,
      inspectorRate: 130,
    },
    terms: '30 DDL',
  },
]

export function QuotesManager({
  quotes,
  clients,
  selectedQuote,
  onCreateQuote,
  onUpdateQuote,
  onUpdateQuoteStatus,
  onOpenCatalog,
  onCreateClient,
}: QuotesManagerProps) {
  // Modal de criação / edição
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [editingQuoteId, setEditingQuoteId] = useState<string | null>(null)

  // Modal de Prévia em PDF
  const [isPdfPreviewOpen, setIsPdfPreviewOpen] = useState(false)
  const [quoteForPdf, setQuoteForPdf] = useState<QuoteRecord | null>(null)

  // Alternador de Visão de Exibição
  const [viewMode, setViewMode] = useState<'client' | 'internal'>('client')

  // Modal de criação rápida de cliente
  const [isNewClientModalOpen, setIsNewClientModalOpen] = useState(false)
  const [newClientName, setNewClientName] = useState('')
  const [newClientDoc, setNewClientDoc] = useState('')
  const [newClientCity, setNewClientCity] = useState('')
  const [newClientState, setNewClientState] = useState('SC')
  const [newClientCep, setNewClientCep] = useState('')

  // ----------------------------------------------------
  // ESTADOS DO FORMULÁRIO DE ORÇAMENTO
  // ----------------------------------------------------
  const [quoteNumber, setQuoteNumber] = useState('')
  const [clientId, setClientId] = useState('')
  const [validityDays, setValidityDays] = useState(10)
  const [paymentCondition, setPaymentCondition] = useState<PaymentConditionType>('28_ddl')
  const [customPaymentCondition, setCustomPaymentCondition] = useState('')
  const [notes, setNotes] = useState('')

  // Seção 3A: Produto BERMO / Fornecedor & Especificações Técnicas (Global/Padrão)
  const [selectedBermoCode, setSelectedBermoCode] = useState('BP30')
  const [modelSearchInput, setModelSearchInput] = useState('BP30')
  const [supplierSearchQuery, setSupplierSearchQuery] = useState('')
  const [showSupplierDropdown, setShowSupplierDropdown] = useState(false)
  const [matchedSupplierInfo, setMatchedSupplierInfo] = useState<BermoProductItem | null>(null)
  const [activeItemIndexForDropdown, setActiveItemIndexForDropdown] = useState<number | null>(null)

  const [fluidType, setFluidType] = useState('vapor')
  const [fluidName, setFluidName] = useState('')
  const [inletTemp, setInletTemp] = useState('140')
  const [outletTemp, setOutletTemp] = useState('80')
  const [operatingPressure, setOperatingPressure] = useState('6.0')
  const [flowRate, setFlowRate] = useState('15')
  const [pressureDrop, setPressureDrop] = useState('0.5')
  const [equipmentSize, setEquipmentSize] = useState('DN50 (2 pol)')
  const [frameMaterial, setFrameMaterial] = useState('AISI 316L (0.5mm)')
  const [gasketType, setGasketType] = useState('EPDM Clip-on / NBR')
  const [serviceScope, setServiceScope] = useState('')

  // Placas e Gaxetas
  const [platesCount, setPlatesCount] = useState('40')
  const [plateDimensions, setPlateDimensions] = useState('680 x 280 mm')
  const [gasketsCount, setGasketsCount] = useState('40')

  // Novos campos 3A
  const [workAreaDifficulty, setWorkAreaDifficulty] = useState<'Baixo' | 'Médio' | 'Alto'>('Médio')
  const [workAreaObservations, setWorkAreaObservations] = useState('')
  const [needsIntegration, setNeedsIntegration] = useState<'Sim' | 'Não'>('Não')
  const [integrationTiming, setIntegrationTiming] = useState<'same_day' | 'early'>('same_day')
  const [integrationObservations, setIntegrationObservations] = useState('')
  const [pipeMeasurement, setPipeMeasurement] = useState('DN50 (2 pol)')

  // Preço de base do produto vs Serviço de assistência
  const [includeProductCost, setIncludeProductCost] = useState(false)
  const [productBasePrice, setProductBasePrice] = useState(18500)
  const [serviceBasePrice, setServiceBasePrice] = useState(7400)

  // Itens da Proposta (Múltiplos Equipamentos / Serviços)
  const [items, setItems] = useState<QuoteItem[]>([])

  // Seção de Materiais de Manutenção (Custo Interno)
  const [maintenanceMaterials, setMaintenanceMaterials] = useState<MaintenanceMaterialItem[]>([])
  const [newMaterialDesc, setNewMaterialDesc] = useState('')
  const [newMaterialAmount, setNewMaterialAmount] = useState('')

  // Seção 3B: Mão de Obra (3 funções)
  const [techCount, setTechCount] = useState(1)
  const [techHours, setTechHours] = useState(16)
  const [techRate, setTechRate] = useState(85)

  const [helperCount, setHelperCount] = useState(1)
  const [helperHours, setHelperHours] = useState(16)
  const [helperRate, setHelperRate] = useState(50)

  const [inspectorCount, setInspectorCount] = useState(1)
  const [inspectorHours, setInspectorHours] = useState(8)
  const [inspectorRate, setInspectorRate] = useState(110)

  // Seção 3C: Deslocamento (Padrão Mapeia)
  const [originCep, setOriginCep] = useState('89066-000')
  const [originAddress, setOriginAddress] = useState('Rua Bernardo Reiter, 500 - Blumenau/SC')
  const [destinationCep, setDestinationCep] = useState('')
  const [destinationAddress, setDestinationAddress] = useState('')
  const [distanceKm, setDistanceKm] = useState(85)
  const [fuelPrice, setFuelPrice] = useState(5.89)
  const [consumptionKmL, setConsumptionKmL] = useState(9.5)
  const [tollRoadPercent, setTollRoadPercent] = useState(40)
  const [manualFuelAdj, setManualFuelAdj] = useState(0)
  const [manualTollAdj, setManualTollAdj] = useState(0)
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(false)

  // Seção 3D: Hospedagem & Alimentação
  const [hotelDays, setHotelDays] = useState(1)
  const [hotelRate, setHotelRate] = useState(180)
  const [mealsDays, setMealsDays] = useState(2)
  const [mealsRate, setMealsRate] = useState(75)

  // Seção 3E: Custos Indiretos Internos
  const [serviceMargin, setServiceMargin] = useState(25)
  const [adminCost, setAdminCost] = useState(15)
  const [salesCommission, setSalesCommission] = useState(6)

  // Impostos Fiscais
  const [pisRate, setPisRate] = useState(1.65)
  const [cofinsRate, setCofinsRate] = useState(7.6)
  const [issRate, setIssRate] = useState(3.5)
  const [csllRate, setCsllRate] = useState(1.08)
  const [irpjRate, setIrpjRate] = useState(4.8)
  const [irDiffRate, setIrDiffRate] = useState(0.96)

  // Lista de marcas presentes nos itens para gerar a metodologia dinâmica
  const distinctBrands = useMemo(() => {
    const brands = new Set<string>()
    items.forEach((it) => {
      if (it.bermo_specs?.productBrand) {
        brands.add(it.bermo_specs.productBrand)
      }
    })
    return Array.from(brands)
  }, [items])

  // Filtragem de fornecedores para o Combobox/Busca inteligente
  const filteredSuppliers = useMemo(() => {
    const q = (supplierSearchQuery || modelSearchInput || '').trim().toLowerCase()
    if (!q) return SUPPLIERS_DATABASE
    return SUPPLIERS_DATABASE.filter(
      (p) =>
        p.code.toLowerCase().includes(q) ||
        p.model.toLowerCase().includes(q) ||
        p.name.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q),
    )
  }, [supplierSearchQuery, modelSearchInput])

  // Aplica produto selecionado ou buscado da base de fornecedores para um item específico (ou o item padrão 0)
  const applySupplierProductToItem = (prod: BermoProductItem, targetIdx: number = 0) => {
    const servPrice = Math.round(prod.basePrice * 0.4)
    let extractedPlates = '40'
    if (prod.specs.platesRange) {
      const match = prod.specs.platesRange.match(/(\d+)/)
      if (match) extractedPlates = match[1]
    }

    if (targetIdx === 0) {
      setSelectedBermoCode(prod.code)
      setModelSearchInput(prod.model || prod.code)
      setMatchedSupplierInfo(prod)
      setShowSupplierDropdown(false)
      setActiveItemIndexForDropdown(null)

      setProductBasePrice(prod.basePrice)
      setServiceBasePrice(servPrice)

      if (prod.specs.pressure) setOperatingPressure(prod.specs.pressure.replace(/\D/g, '') || '16')
      if (prod.specs.connection) setEquipmentSize(prod.specs.connection)
      if (prod.specs.material) setFrameMaterial(prod.specs.material)
      if (prod.specs.gasketMaterial) setGasketType(prod.specs.gasketMaterial)
      if (prod.specs.plateDimensions) setPlateDimensions(prod.specs.plateDimensions)
      setPlatesCount(extractedPlates)
      setGasketsCount(extractedPlates)
    }

    if (items.length > targetIdx) {
      const updated = [...items]
      const brand = prod.brand || 'BERMO'
      const methodName = getStandardServiceMethodology([brand])
      const qty = updated[targetIdx].quantity || 1
      const isIncludeProd =
        updated[targetIdx].include_product_cost ?? (targetIdx === 0 ? includeProductCost : false)
      const unitPrice = isIncludeProd ? servPrice + prod.basePrice : servPrice

      updated[targetIdx] = {
        ...updated[targetIdx],
        name: `Manutenção Especializada: ${prod.brand} ${prod.model || prod.code}`,
        unit_price: unitPrice,
        total: unitPrice * qty,
        description: updated[targetIdx].description || methodName,
        include_product_cost: isIncludeProd,
        bermo_specs: {
          ...(updated[targetIdx].bermo_specs || {}),
          productCode: prod.code,
          productName: prod.name,
          productModel: prod.model,
          productBrand: prod.brand,
          equipmentSize: prod.specs.connection || 'DN50 (2 pol)',
          frameMaterial: prod.specs.material || 'AISI 316L (0.5mm)',
          gasketType: prod.specs.gasketMaterial || 'EPDM Clip-on / NBR',
          plateDimensions: prod.specs.plateDimensions || '680 x 280 mm',
          platesCount: extractedPlates,
          gasketsCount: extractedPlates,
          operatingPressure: prod.specs.pressure?.replace(/\D/g, '') || '16',
          productBasePrice: prod.basePrice,
          serviceBasePrice: servPrice,
          includeProductCost: isIncludeProd,
        },
      }
      setItems(updated)
    }
  }

  // Atalho para compatibilidade
  const applySupplierProduct = (prod: BermoProductItem) => {
    applySupplierProductToItem(
      prod,
      activeItemIndexForDropdown !== null ? activeItemIndexForDropdown : 0,
    )
  }

  // Busca manual quando o usuário digita qualquer modelo
  const handleModelSearchChange = (typedValue: string) => {
    setModelSearchInput(typedValue)
    setSupplierSearchQuery(typedValue)
    setShowSupplierDropdown(true)
    setActiveItemIndexForDropdown(0)

    // Tenta encontrar match exato ou aproximado
    const match = searchSupplierProduct(typedValue)
    if (match) {
      setMatchedSupplierInfo(match)
      setSelectedBermoCode(match.code)
      setProductBasePrice(match.basePrice)
      const servPrice = Math.round(match.basePrice * 0.4)
      setServiceBasePrice(servPrice)

      if (match.specs.pressure)
        setOperatingPressure(match.specs.pressure.replace(/\D/g, '') || '16')
      if (match.specs.connection) setEquipmentSize(match.specs.connection)
      if (match.specs.material) setFrameMaterial(match.specs.material)
      if (match.specs.gasketMaterial) setGasketType(match.specs.gasketMaterial)
      if (match.specs.plateDimensions) setPlateDimensions(match.specs.plateDimensions)
      if (match.specs.platesRange) {
        const pMatch = match.specs.platesRange.match(/(\d+)/)
        if (pMatch) {
          setPlatesCount(pMatch[1])
          setGasketsCount(pMatch[1])
        }
      }

      // Atualiza também o primeiro item
      if (items.length > 0) {
        applySupplierProductToItem(match, 0)
      }
    } else {
      setMatchedSupplierInfo(null)
      setSelectedBermoCode(typedValue.toUpperCase())
      if (items.length > 0) {
        const updated = [...items]
        updated[0] = {
          ...updated[0],
          name: `Manutenção Especializada: ${typedValue.toUpperCase()}`,
          bermo_specs: {
            ...(updated[0].bermo_specs || {}),
            productCode: typedValue.toUpperCase(),
            productModel: typedValue,
          },
        }
        setItems(updated)
      }
    }
  }

  // Atualização das especificações técnicas de um item específico (para múltiplos equipamentos)
  const handleUpdateItemSpecs = (itemIdx: number, specKey: string, specVal: any) => {
    const updated = [...items]
    const currentItem = updated[itemIdx]
    const updatedSpecs = {
      ...(currentItem.bermo_specs || {}),
      [specKey]: specVal,
    }
    updated[itemIdx] = {
      ...currentItem,
      bermo_specs: updatedSpecs,
    }
    // Se for o item 0, sincroniza também com os estados globais da Seção 3A
    if (itemIdx === 0) {
      if (specKey === 'platesCount') setPlatesCount(String(specVal))
      if (specKey === 'plateDimensions') setPlateDimensions(String(specVal))
      if (specKey === 'gasketsCount') setGasketsCount(String(specVal))
      if (specKey === 'equipmentSize') setEquipmentSize(String(specVal))
      if (specKey === 'frameMaterial') setFrameMaterial(String(specVal))
      if (specKey === 'gasketType') setGasketType(String(specVal))
      if (specKey === 'operatingPressure') setOperatingPressure(String(specVal))
      if (specKey === 'pipeMeasurement') setPipeMeasurement(String(specVal))
    }
    setItems(updated)
  }

  // Alterna se inclui ou não o custo do produto em um item individual
  const handleToggleItemIncludeProduct = (itemIdx: number, checked: boolean) => {
    const updated = [...items]
    const it = updated[itemIdx]
    const servBase = it.bermo_specs?.serviceBasePrice || it.unit_price || 2500
    const prodBase = it.bermo_specs?.productBasePrice || 0
    const newUnitPrice = checked ? servBase + prodBase : servBase
    const qty = it.quantity || 1

    updated[itemIdx] = {
      ...it,
      unit_price: newUnitPrice,
      total: Math.max(0, qty * newUnitPrice - (it.discount || 0)),
      include_product_cost: checked,
      bermo_specs: {
        ...(it.bermo_specs || {}),
        includeProductCost: checked,
      },
    }

    if (itemIdx === 0) {
      setIncludeProductCost(checked)
    }

    setItems(updated)
  }

  // Abre modal de novo orçamento
  const handleOpenNewQuote = () => {
    setIsEditMode(false)
    setEditingQuoteId(null)
    setQuoteNumber(`INT-2025-${Math.floor(100 + Math.random() * 900)}`)
    setClientId(clients.length > 0 ? clients[0].id : '')
    setValidityDays(10)
    setPaymentCondition('28_ddl')
    setCustomPaymentCondition('')
    setNotes(
      'Orçamento técnico com metodologia rigorosa de normas industriais e recomendações dos fabricantes. Inclui desmontagem com Medida A, limpeza controlada, inspeção e estanqueidade.',
    )

    const defaultBermo = BERMO_CATALOG.find((p) => p.code === 'BP30') || BERMO_CATALOG[0]
    setSelectedBermoCode(defaultBermo.code)
    setModelSearchInput(defaultBermo.model)
    setMatchedSupplierInfo(defaultBermo)
    setProductBasePrice(defaultBermo.basePrice)
    const servPrice = Math.round(defaultBermo.basePrice * 0.4)
    setServiceBasePrice(servPrice)
    setIncludeProductCost(false)

    setPlatesCount('40')
    setPlateDimensions(defaultBermo.specs.plateDimensions || '680 x 280 mm')
    setGasketsCount('40')
    setWorkAreaDifficulty('Médio')
    setWorkAreaObservations('')
    setNeedsIntegration('Não')
    setIntegrationTiming('same_day')
    setIntegrationObservations('')
    setPipeMeasurement('DN50 (2 pol)')
    setMaintenanceMaterials([])

    // Item inicial com metodologia padronizada
    const initialMethodology = getStandardServiceMethodology([defaultBermo.brand])
    setItems([
      {
        name: `Serviço Especializado BERMO: ${defaultBermo.name}`,
        quantity: 1,
        unit_price: servPrice,
        discount: 0,
        total: servPrice,
        description: initialMethodology,
        include_product_cost: false,
        bermo_specs: {
          productCode: defaultBermo.code,
          productName: defaultBermo.name,
          productModel: defaultBermo.model,
          productBrand: defaultBermo.brand,
          equipmentSize: defaultBermo.specs.connection,
          frameMaterial: defaultBermo.specs.material,
          gasketType: defaultBermo.specs.gasketMaterial,
          platesCount: '40',
          plateDimensions: defaultBermo.specs.plateDimensions || '680 x 280 mm',
          gasketsCount: '40',
          workAreaDifficulty: 'Médio',
          needsIntegration: 'Não',
          pipeMeasurement: 'DN50 (2 pol)',
          includeProductCost: false,
          productBasePrice: defaultBermo.basePrice,
          serviceBasePrice: servPrice,
        },
      },
    ])

    // Preenche destino se houver cliente selecionado
    if (clients.length > 0) {
      const c = clients[0]
      setDestinationAddress(`${c.city || ''} / ${c.state || 'SC'}`)
    }

    setIsCreateModalOpen(true)
  }

  // Abre modal para edição completa de orçamento existente
  const handleOpenEditQuote = (quote: QuoteRecord) => {
    setIsEditMode(true)
    setEditingQuoteId(quote.id)
    setQuoteNumber(quote.quote_number)
    setClientId(quote.client_id || '')
    setNotes(quote.notes || '')

    const firstItem = quote.items && quote.items.length > 0 ? quote.items[0] : null
    const specs = firstItem?.bermo_specs || quote.service_details?.service_technical_specs

    if (specs) {
      const code = specs.productCode || 'BP30'
      setSelectedBermoCode(code)
      setModelSearchInput(specs.productModel || code)
      const found = searchSupplierProduct(code)
      setMatchedSupplierInfo(found || null)

      if (specs.fluidType) setFluidType(specs.fluidType)
      if (specs.fluidName) setFluidName(specs.fluidName)
      if (specs.inletTemp) setInletTemp(specs.inletTemp)
      if (specs.outletTemp) setOutletTemp(specs.outletTemp)
      if (specs.operatingPressure) setOperatingPressure(specs.operatingPressure)
      if (specs.flowRate) setFlowRate(specs.flowRate)
      if (specs.pressureDrop) setPressureDrop(specs.pressureDrop)
      if (specs.equipmentSize) setEquipmentSize(specs.equipmentSize)
      if (specs.frameMaterial) setFrameMaterial(specs.frameMaterial)
      if (specs.gasketType) setGasketType(specs.gasketType)
      if (specs.serviceScope) setServiceScope(specs.serviceScope)

      if (specs.platesCount) setPlatesCount(specs.platesCount)
      if (specs.plateDimensions) setPlateDimensions(specs.plateDimensions)
      if (specs.gasketsCount) setGasketsCount(specs.gasketsCount)

      if (specs.workAreaDifficulty) setWorkAreaDifficulty(specs.workAreaDifficulty)
      if (specs.workAreaObservations) setWorkAreaObservations(specs.workAreaObservations)
      if (specs.needsIntegration) setNeedsIntegration(specs.needsIntegration)
      if (specs.integrationTiming) setIntegrationTiming(specs.integrationTiming)
      if (specs.integrationObservations) setIntegrationObservations(specs.integrationObservations)
      if (specs.pipeMeasurement) setPipeMeasurement(specs.pipeMeasurement)

      setIncludeProductCost(specs.includeProductCost ?? false)
      if (specs.productBasePrice) setProductBasePrice(specs.productBasePrice)
      if (specs.serviceBasePrice) setServiceBasePrice(specs.serviceBasePrice)
    }

    if (quote.service_details?.maintenance_materials) {
      setMaintenanceMaterials(quote.service_details.maintenance_materials)
    } else {
      setMaintenanceMaterials([])
    }

    if (quote.service_details?.labor_costs) {
      const l = quote.service_details.labor_costs
      setTechCount(l.techMechanical?.count ?? 1)
      setTechHours(l.techMechanical?.hours ?? 16)
      setTechRate(l.techMechanical?.ratePerHour ?? 85)
      setHelperCount(l.helper?.count ?? 1)
      setHelperHours(l.helper?.hours ?? 16)
      setHelperRate(l.helper?.ratePerHour ?? 50)
      setInspectorCount(l.inspectorNDT?.count ?? 1)
      setInspectorHours(l.inspectorNDT?.hours ?? 8)
      setInspectorRate(l.inspectorNDT?.ratePerHour ?? 110)
    }

    if (quote.service_details?.travel_costs) {
      const t = quote.service_details.travel_costs
      setOriginCep(t.originCep || '89066-000')
      setOriginAddress(t.originAddress || 'Rua Bernardo Reiter, 500 - Blumenau/SC')
      setDestinationCep(t.destinationCep || '')
      setDestinationAddress(t.destinationAddress || '')
      setDistanceKm(t.distanceKm || 85)
      setFuelPrice(t.fuelPrice || 5.89)
      setConsumptionKmL(t.consumptionKmL || 9.5)
      setTollRoadPercent(t.tollRoadPercent || 40)
      setManualFuelAdj(t.manualFuelAdjustment || 0)
      setManualTollAdj(t.manualTollAdjustment || 0)
    }

    if (quote.service_details?.lodging_meals_costs) {
      const lm = quote.service_details.lodging_meals_costs
      setHotelDays(lm.hotelDays ?? 1)
      setHotelRate(lm.hotelRatePerDay ?? 180)
      setMealsDays(lm.mealsDays ?? 2)
      setMealsRate(lm.mealsRatePerDay ?? 75)
    }

    if (quote.service_details?.indirect_costs) {
      const ind = quote.service_details.indirect_costs
      setServiceMargin(ind.serviceMarginPercent ?? 25)
      setAdminCost(ind.administrativeCostPercent ?? 15)
      setSalesCommission(ind.salesCommissionPercent ?? 6)
      if (ind.taxes) {
        setPisRate(ind.taxes.pis ?? 1.65)
        setCofinsRate(ind.taxes.cofins ?? 7.6)
        setIssRate(ind.taxes.iss ?? 3.5)
        setCsllRate(ind.taxes.csll ?? 1.08)
        setIrpjRate(ind.taxes.irpj ?? 4.8)
        setIrDiffRate(ind.taxes.irDiff ?? 0.96)
      }
    }

    if (quote.service_details?.payment_and_validity) {
      const pv = quote.service_details.payment_and_validity
      setValidityDays(pv.validityDays ?? 10)
      setPaymentCondition(pv.conditionType ?? '28_ddl')
      setCustomPaymentCondition(pv.customConditionText ?? '')
    }

    if (quote.items && quote.items.length > 0) {
      setItems(quote.items)
    }

    setIsCreateModalOpen(true)
  }

  // Manipulação de Materiais de Manutenção (Custo Interno)
  const handleAddMaterial = () => {
    if (!newMaterialDesc.trim()) return
    const amt = parseFloat(newMaterialAmount.replace(',', '.')) || 0
    if (amt <= 0) return

    const newMat: MaintenanceMaterialItem = {
      id: `mat-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      description: newMaterialDesc.trim(),
      amount: amt,
    }
    setMaintenanceMaterials([...maintenanceMaterials, newMat])
    setNewMaterialDesc('')
    setNewMaterialAmount('')
  }

  const handleRemoveMaterial = (id: string) => {
    setMaintenanceMaterials(maintenanceMaterials.filter((m) => m.id !== id))
  }

  const maintenanceMaterialsTotal = useMemo(() => {
    return maintenanceMaterials.reduce((sum, m) => sum + (m.amount || 0), 0)
  }, [maintenanceMaterials])

  // Recalculo da rota via CEP (considerando Ida e Volta automaticamente)
  const handleRecalculateRoute = async (destCep?: string, origCep?: string) => {
    setIsCalculatingRoute(true)
    const targetDest = destCep || destinationCep
    const targetOrig = origCep || originCep

    try {
      const res = await calculateDistanceBetweenCeps(
        targetOrig,
        targetDest,
        fuelPrice,
        consumptionKmL,
        tollRoadPercent,
      )
      // res.roundTripKm é a distância total (ida e volta)
      setDistanceKm(res.roundTripKm || res.distanceKm)
      if (res.destinationAddress) {
        setDestinationAddress(res.destinationAddress)
      } else if (res.destinationCity) {
        setDestinationAddress(`${res.destinationCity} / ${res.destinationState || 'SC'}`)
      }
      if (res.originAddress && (!originAddress || originAddress.includes('Blumenau'))) {
        setOriginAddress(res.originAddress)
      }
    } catch (e) {
      console.warn('Erro ao calcular rota:', e)
    } finally {
      setIsCalculatingRoute(false)
    }
  }

  // Cálculos de Mão de Obra
  const laborTechTotal = techCount * techHours * techRate
  const laborHelperTotal = helperCount * helperHours * helperRate
  const laborInspectorTotal = inspectorCount * inspectorHours * inspectorRate
  const laborTotal = laborTechTotal + laborHelperTotal + laborInspectorTotal

  // Cálculos de Logística (distanceKm já representa a distância total de IDA E VOLTA)
  const totalDistanceRoundTrip = distanceKm
  const litersNeeded = totalDistanceRoundTrip / (consumptionKmL || 9.5)
  const baseFuelCost = Math.round(litersNeeded * fuelPrice * 100) / 100
  // Para pedágios: calcula com base na distância total ida e volta (pedágios distribuídos ao longo do percurso)
  const estimatedTolls = Math.max(
    2,
    Math.round((totalDistanceRoundTrip / 80) * (tollRoadPercent / 100)),
  )
  const baseTollCost = estimatedTolls * 14.5
  const travelTotal = baseFuelCost + baseTollCost + manualFuelAdj + manualTollAdj

  // Cálculos de Hospedagem & Alimentação
  const lodgingMealsTotal = hotelDays * hotelRate + mealsDays * mealsRate

  // Estruturas de Dados
  const laborCostsObj = {
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
  }

  const travelCostsObj = {
    originCep,
    originAddress,
    destinationCep,
    destinationAddress,
    distanceKm,
    fuelPrice,
    consumptionKmL,
    tollRoadPercent,
    calculatedFuelCost: baseFuelCost,
    calculatedTollCost: baseTollCost,
    manualFuelAdjustment: manualFuelAdj,
    manualTollAdjustment: manualTollAdj,
    totalTravelCost: travelTotal,
  }

  const lodgingMealsCostsObj = {
    hotelDays,
    hotelRatePerDay: hotelRate,
    mealsDays,
    mealsRatePerDay: mealsRate,
    totalLodgingMeals: lodgingMealsTotal,
  }

  const customTaxesObj = {
    pis: pisRate,
    cofins: cofinsRate,
    iss: issRate,
    csll: csllRate,
    irpj: irpjRate,
    irDiff: irDiffRate,
  }

  // Motor de Cálculo Rigoroso
  const computation = calculateQuotePricing({
    items,
    laborTotal,
    travelCosts: travelCostsObj,
    lodgingMeals: lodgingMealsCostsObj,
    maintenanceMaterialsTotal,
    needsIntegration,
    integrationTiming,
    serviceMarginPercent: serviceMargin,
    adminCostPercent: adminCost,
    salesCommissionPercent: salesCommission,
    customTaxes: customTaxesObj,
  })

  // Adicionar novo equipamento/trocador ou serviço ao orçamento
  const handleAddEquipmentItem = (productParam?: BermoProductItem | string) => {
    let targetProduct: BermoProductItem | undefined
    if (typeof productParam === 'object' && productParam !== null) {
      targetProduct = productParam
    } else if (typeof productParam === 'string') {
      targetProduct = SUPPLIERS_DATABASE.find(
        (p) => p.id === productParam || p.code === productParam || p.model === productParam,
      )
    }

    // Se nenhum produto foi especificado, pega um modelo padrão da lista (ex: Alfa Laval M10-B ou outro BERMO)
    if (!targetProduct) {
      const nextIndex = items.length % SUPPLIERS_DATABASE.length
      targetProduct = SUPPLIERS_DATABASE[nextIndex] || BERMO_CATALOG[0]
    }

    const servPrice = Math.round(targetProduct.basePrice * 0.4)
    let extractedPlates = '40'
    if (targetProduct.specs.platesRange) {
      const match = targetProduct.specs.platesRange.match(/(\d+)/)
      if (match) extractedPlates = match[1]
    }

    const brand = targetProduct.brand || 'BERMO'
    const methodology = getStandardServiceMethodology([brand, ...distinctBrands])

    const newItem: QuoteItem = {
      name: `Manutenção Especializada: ${targetProduct.brand} ${targetProduct.model || targetProduct.code}`,
      quantity: 1,
      unit_price: servPrice,
      discount: 0,
      total: servPrice,
      description: methodology,
      include_product_cost: false,
      bermo_specs: {
        productCode: targetProduct.code,
        productName: targetProduct.name,
        productModel: targetProduct.model,
        productBrand: targetProduct.brand,
        equipmentSize: targetProduct.specs.connection || 'DN50 (2 pol)',
        frameMaterial: targetProduct.specs.material || 'AISI 316L (0.5mm)',
        gasketType: targetProduct.specs.gasketMaterial || 'EPDM Clip-on / NBR',
        plateDimensions: targetProduct.specs.plateDimensions || '680 x 280 mm',
        platesCount: extractedPlates,
        gasketsCount: extractedPlates,
        operatingPressure: targetProduct.specs.pressure?.replace(/\D/g, '') || '16',
        workAreaDifficulty: 'Médio',
        needsIntegration: 'Não',
        pipeMeasurement: targetProduct.specs.connection || 'DN50 (2 pol)',
        includeProductCost: false,
        productBasePrice: targetProduct.basePrice,
        serviceBasePrice: servPrice,
      },
    }

    setItems([...items, newItem])
  }

  // Compatibilidade com handleAddItem
  const handleAddItem = (productId?: string) => {
    handleAddEquipmentItem(productId)
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

  const handleToggleIncludeProductCost = (checked: boolean) => {
    setIncludeProductCost(checked)
    if (items.length > 0) {
      const updated = [...items]
      const servPrice = serviceBasePrice || 7400
      const prodPrice = productBasePrice || 18500
      const unit = checked ? servPrice + prodPrice : servPrice
      updated[0] = {
        ...updated[0],
        unit_price: unit,
        total: unit * (updated[0].quantity || 1),
        include_product_cost: checked,
        bermo_specs: {
          ...(updated[0].bermo_specs || {}),
          includeProductCost: checked,
        },
      }
      setItems(updated)
    }
  }

  const handleApplyPreset = (tplId: string) => {
    const tpl = TEMPLATE_PRESETS.find((t) => t.id === tplId)
    if (!tpl) return

    const bermo = BERMO_CATALOG.find((p) => p.code === tpl.productCode) || BERMO_CATALOG[0]
    setSelectedBermoCode(bermo.code)
    setModelSearchInput(bermo.model)
    setMatchedSupplierInfo(bermo)
    setProductBasePrice(bermo.basePrice)
    setServiceBasePrice(tpl.servicePrice)
    setIncludeProductCost(false)

    setTechCount(tpl.labor.techCount)
    setTechHours(tpl.labor.techHours)
    setTechRate(tpl.labor.techRate)
    setHelperCount(tpl.labor.helperCount)
    setHelperHours(tpl.labor.helperHours)
    setHelperRate(tpl.labor.helperRate)
    setInspectorCount(tpl.labor.inspectorCount)
    setInspectorHours(tpl.labor.inspectorHours)
    setInspectorRate(tpl.labor.inspectorRate)

    if (bermo.specs.plateDimensions) setPlateDimensions(bermo.specs.plateDimensions)
    if (bermo.specs.connection) setEquipmentSize(bermo.specs.connection)
    if (bermo.specs.material) setFrameMaterial(bermo.specs.material)
    if (bermo.specs.gasketMaterial) setGasketType(bermo.specs.gasketMaterial)

    const methodology = getStandardServiceMethodology([bermo.brand])
    setItems([
      {
        name: `Serviço Especializado BERMO: ${bermo.name}`,
        quantity: 1,
        unit_price: tpl.servicePrice,
        discount: 0,
        total: tpl.servicePrice,
        description: methodology,
        include_product_cost: false,
        bermo_specs: {
          productCode: bermo.code,
          productName: bermo.name,
          productModel: bermo.model,
          productBrand: bermo.brand,
          equipmentSize: bermo.specs.connection,
          frameMaterial: bermo.specs.material,
          gasketType: bermo.specs.gasketMaterial,
          plateDimensions: bermo.specs.plateDimensions,
          includeProductCost: false,
          productBasePrice: bermo.basePrice,
          serviceBasePrice: tpl.servicePrice,
        },
      },
    ])
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
    const prd = matchedSupplierInfo || searchSupplierProduct(selectedBermoCode)

    const paymentTermsFormatted = getPaymentTermLabel(paymentCondition, customPaymentCondition)
    const validUntilDate = new Date()
    validUntilDate.setDate(validUntilDate.getDate() + (validityDays || 10) * 1.4)

    const quotePayload: Partial<QuoteRecord> = {
      quote_number: quoteNumber || `INT-2025-${Math.floor(100 + Math.random() * 900)}`,
      client_id: clientId || undefined,
      client_name: client ? client.name : 'Cliente Industrial',
      status: 'draft',
      items: items.map((it, idx) => {
        if (idx === 0) {
          return {
            ...it,
            include_product_cost: includeProductCost,
            bermo_specs: {
              ...(it.bermo_specs || {}),
              productCode: selectedBermoCode || modelSearchInput,
              productName: prd?.name || it.bermo_specs?.productName || modelSearchInput,
              productModel: prd?.model || modelSearchInput,
              productBrand: prd?.brand || it.bermo_specs?.productBrand || 'BERMO',
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
              platesCount,
              plateDimensions,
              gasketsCount,
              workAreaDifficulty,
              workAreaObservations,
              needsIntegration,
              integrationTiming: needsIntegration === 'Sim' ? integrationTiming : undefined,
              integrationCost: computation.integrationTotal,
              integrationObservations,
              pipeMeasurement,
              includeProductCost,
              productBasePrice: productBasePrice || prd?.basePrice,
              serviceBasePrice,
            },
          }
        }
        return it
      }),
      subtotal: computation.directCostsTotal,
      discount_total: 0,
      total: computation.finalClientPrice,
      payment_terms: paymentTermsFormatted,
      valid_until: validUntilDate.toISOString(),
      notes:
        notes ||
        `Orçamento de Prestação de Serviços Técnicos (${prd?.name || 'Trocadores & Válvulas'}). Assistência Especializada Intertermal.`,
      assigned_to: 'Alex Nogueira - Especialista Técnico Intertermal',
      service_details: {
        service_technical_specs: {
          productCode: selectedBermoCode || modelSearchInput,
          productName: prd?.name || modelSearchInput,
          productModel: prd?.model || modelSearchInput,
          productBrand: prd?.brand || 'BERMO',
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
          platesCount,
          plateDimensions,
          gasketsCount,
          workAreaDifficulty,
          workAreaObservations,
          needsIntegration,
          integrationTiming: needsIntegration === 'Sim' ? integrationTiming : undefined,
          integrationCost: computation.integrationTotal,
          integrationObservations,
          pipeMeasurement,
          includeProductCost,
          productBasePrice: productBasePrice || prd?.basePrice,
          serviceBasePrice,
        },
        labor_costs: laborCostsObj,
        travel_costs: travelCostsObj,
        lodging_meals_costs: lodgingMealsCostsObj,
        maintenance_materials: maintenanceMaterials,
        maintenance_materials_total: maintenanceMaterialsTotal,
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

    if (isEditMode && editingQuoteId && onUpdateQuote) {
      onUpdateQuote(editingQuoteId, quotePayload)
    } else {
      onCreateQuote(quotePayload)
    }
    setIsCreateModalOpen(false)
    setIsEditMode(false)
    setEditingQuoteId(null)
  }

  const currentViewQuote = selectedQuote || (quotes.length > 0 ? quotes[0] : null)

  const handleOpenPdfPreview = (quoteToPreview?: QuoteRecord) => {
    const q = quoteToPreview || currentViewQuote
    if (q) {
      setQuoteForPdf(q)
      setIsPdfPreviewOpen(true)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header com Branding Intertermal / BERMO */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Wrench className="h-6 w-6 text-teal-600 dark:text-teal-400" />
            Orçamentos de Prestação de Serviços BERMO & Alfa Laval
          </h2>
          <p className="text-xs md:text-sm text-muted-foreground mt-0.5">
            Gerador técnico de propostas com busca integrada na base de fornecedores, metodologia
            padronizada, cálculo de mão de obra (3 funções) e logística Mapeia.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {currentViewQuote && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleOpenPdfPreview(currentViewQuote)}
              className="border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold shadow-xs"
            >
              <FileText className="h-4 w-4 mr-1.5 text-teal-600 dark:text-teal-400" />
              Visualizar PDF
            </Button>
          )}
          {onOpenCatalog && (
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenCatalog}
              className="border-teal-300 dark:border-teal-800 text-teal-700 dark:text-teal-300 hover:bg-teal-50 dark:hover:bg-teal-950 text-xs"
            >
              <Package className="h-4 w-4 mr-1.5" />
              Catálogo Fornecedores
            </Button>
          )}
          <Button
            onClick={handleOpenNewQuote}
            className="bg-teal-700 hover:bg-teal-600 text-white shadow-sm text-xs font-semibold"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Novo Orçamento de Serviço
          </Button>
        </div>
      </div>

      {/* Modelos Prontos de Serviços */}
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
                onClick={() => handleOpenEditQuote(q)}
                className={`p-3.5 cursor-pointer transition-all border ${
                  isSelected
                    ? 'border-teal-600 ring-2 ring-teal-500/20 bg-teal-50/20 dark:bg-teal-950/20'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 hover:shadow-xs'
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
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleOpenPdfPreview(q)
                      }}
                      className="p-1 text-slate-500 hover:text-teal-700 dark:hover:text-teal-400 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title="Visualizar PDF da Proposta"
                    >
                      <FileText className="h-3.5 w-3.5" />
                    </button>
                    <span className="text-[11px] text-muted-foreground truncate max-w-[100px]">
                      {q.payment_terms || '14 DDL'}
                    </span>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>

        {/* Visualizador da Proposta (Modo Cliente vs Modo Interno) */}
        <div className="lg:col-span-8">
          {currentViewQuote ? (
            <Card className="border-slate-300 dark:border-slate-700 shadow-md bg-white dark:bg-slate-950 overflow-hidden">
              {/* Header do Documento */}
              <div className="bg-gradient-to-r from-slate-950 via-teal-950 to-slate-900 p-6 text-white flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono tracking-widest text-teal-300 uppercase font-bold">
                      INTERTERMAL • PROPOSTA DE SERVIÇOS TÉCNICOS
                    </span>
                  </div>
                  <h3 className="text-xl font-extrabold">{currentViewQuote.quote_number}</h3>
                  <p className="text-xs text-slate-300">
                    Emitido por:{' '}
                    {currentViewQuote.assigned_to ||
                      'Alex Nogueira - Especialista de Aplicações Técnicas'}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleOpenPdfPreview(currentViewQuote)}
                    className="h-8 text-xs bg-emerald-700 hover:bg-emerald-600 text-white font-semibold shadow-xs"
                    title="Abrir prévia formatada em PDF da proposta"
                  >
                    <FileText className="h-3.5 w-3.5 mr-1.5" /> Prévia em PDF
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleOpenEditQuote(currentViewQuote)}
                    className="h-8 text-xs bg-teal-800/80 hover:bg-teal-700 border-teal-600 text-white font-medium"
                    title="Abrir proposta completa para conferência e edição"
                  >
                    <Wrench className="h-3.5 w-3.5 mr-1" /> Editar Proposta
                  </Button>

                  {/* Alternador de Visão: Cliente vs Interno */}
                  <div className="flex items-center rounded-lg bg-slate-800/90 p-1 border border-slate-700 text-xs">
                    <button
                      onClick={() => setViewMode('client')}
                      className={`px-2.5 py-1 rounded font-medium flex items-center gap-1 transition-all ${
                        viewMode === 'client'
                          ? 'bg-teal-700 text-white shadow-xs'
                          : 'text-slate-400 hover:text-white'
                      }`}
                      title="Exibição formal enviada ao cliente (sem custos indiretos e sem materiais de manutenção)"
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
                      title="Exibição interna completa com impostos, margem, comissão e materiais de manutenção"
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
                    onClick={() => handleOpenPdfPreview(currentViewQuote)}
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
                        <strong>Visão Oficial do Cliente:</strong> Exibe itens do serviço com
                        metodologia, especificações técnicas, inclusões e condições comerciais.
                        Custos indiretos e materiais internos ocultados.
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="p-2.5 rounded-lg bg-amber-50/70 dark:bg-amber-950/30 border border-amber-300/80 dark:border-amber-900/60 flex items-center justify-between text-xs text-amber-900 dark:text-amber-300">
                    <div className="flex items-center gap-2">
                      <SlidersHorizontal className="h-4 w-4 text-amber-600 shrink-0" />
                      <span>
                        <strong>Visão Interna (Intertermal):</strong> Visualização gerencial com
                        materiais de manutenção, margem de lucro, taxa administrativa, impostos e
                        comissão.
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
                        {currentViewQuote.service_details?.payment_and_validity?.validityDays || 10}{' '}
                        dias úteis
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
                      Faturamento via boleto bancário mediante homologação do serviço.
                    </div>
                  </div>
                </div>

                {/* Tabela de Itens e Serviços */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center justify-between">
                    <span>1. Escopo de Serviços & Equipamentos</span>
                  </h4>
                  <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 uppercase text-[10px] font-semibold">
                        <tr>
                          <th className="p-2.5">Descrição do Serviço / Produto</th>
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
                              <td className="p-2.5 space-y-1.5">
                                <div className="font-semibold text-slate-900 dark:text-slate-100">
                                  {item.name}
                                </div>
                                {item.description && (
                                  <div className="text-[11px] text-slate-600 dark:text-slate-300 whitespace-pre-line bg-slate-50 dark:bg-slate-900/40 p-2 rounded border border-slate-100 dark:border-slate-800">
                                    {item.description}
                                  </div>
                                )}
                                {item.bermo_specs && (
                                  <div className="text-[11px] text-muted-foreground bg-teal-50/40 dark:bg-teal-950/20 p-2 rounded border border-teal-100 dark:border-teal-900/50 space-y-1">
                                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 font-mono text-[10px]">
                                      {item.bermo_specs.productCode && (
                                        <span>
                                          Ref/Modelo:{' '}
                                          <strong>{item.bermo_specs.productCode}</strong>
                                        </span>
                                      )}
                                      {item.bermo_specs.productBrand && (
                                        <span>
                                          Fabricante:{' '}
                                          <strong>{item.bermo_specs.productBrand}</strong>
                                        </span>
                                      )}
                                      {item.bermo_specs.platesCount && (
                                        <span className="text-teal-700 dark:text-teal-400">
                                          Nº Placas: <strong>{item.bermo_specs.platesCount}</strong>
                                        </span>
                                      )}
                                      {item.bermo_specs.plateDimensions && (
                                        <span className="text-teal-700 dark:text-teal-400">
                                          Dimensão Placas:{' '}
                                          <strong>{item.bermo_specs.plateDimensions}</strong>
                                        </span>
                                      )}
                                      {item.bermo_specs.gasketType && (
                                        <span>
                                          Gaxetas: <strong>{item.bermo_specs.gasketType}</strong>
                                        </span>
                                      )}
                                      {item.bermo_specs.operatingPressure && (
                                        <span>
                                          Pressão:{' '}
                                          <strong>{item.bermo_specs.operatingPressure} bar</strong>
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </td>
                              <td className="p-2.5 text-center">{item.quantity}</td>
                              <td className="p-2.5 text-right font-mono">
                                {(item.unit_price || 0).toLocaleString('pt-BR', {
                                  style: 'currency',
                                  currency: 'BRL',
                                })}
                              </td>
                              <td className="p-2.5 text-right font-bold text-slate-900 dark:text-slate-100 font-mono">
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

                {/* Seção 2: Incluso no Valor (Visível na Proposta do Cliente) */}
                <div className="p-3.5 rounded-xl bg-teal-50/60 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-900 space-y-1.5 text-xs">
                  <div className="flex items-center gap-1.5 text-teal-900 dark:text-teal-200 font-bold uppercase text-[11px] tracking-wider">
                    <CheckCircle2 className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                    Incluso no valor
                  </div>
                  <p className="text-[11px] text-slate-700 dark:text-slate-300 leading-relaxed text-justify">
                    {PROPOSAL_INCLUSIONS_TEXT}
                  </p>
                </div>

                {/* Seção 3: Materiais de Manutenção & Custos Internos (EXIBIDO APENAS NO MODO INTERNO) */}
                {viewMode === 'internal' && (
                  <div className="space-y-4">
                    {/* Materiais de Manutenção Internos */}
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5 uppercase text-[11px] tracking-wider">
                          <Layers className="h-4 w-4 text-teal-600" />
                          Materiais de Manutenção (Apenas Composição Interna)
                        </span>
                        <Badge variant="outline" className="text-[10px]">
                          Não exibido ao cliente
                        </Badge>
                      </div>

                      {currentViewQuote.service_details?.maintenance_materials &&
                      currentViewQuote.service_details.maintenance_materials.length > 0 ? (
                        <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
                          <table className="w-full text-xs text-left">
                            <thead className="bg-slate-100 dark:bg-slate-800 text-[10px] font-semibold uppercase">
                              <tr>
                                <th className="p-2">Descrição do Material</th>
                                <th className="p-2 text-right">Valor (R$)</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                              {currentViewQuote.service_details.maintenance_materials.map((m) => (
                                <tr key={m.id}>
                                  <td className="p-2">{m.description}</td>
                                  <td className="p-2 text-right font-mono font-bold">
                                    {(m.amount || 0).toLocaleString('pt-BR', {
                                      style: 'currency',
                                      currency: 'BRL',
                                    })}
                                  </td>
                                </tr>
                              ))}
                              <tr className="bg-slate-100/50 dark:bg-slate-800/50 font-bold">
                                <td className="p-2 text-right">Total dos Materiais:</td>
                                <td className="p-2 text-right font-mono text-teal-700 dark:text-teal-300">
                                  {(
                                    currentViewQuote.service_details?.maintenance_materials_total ||
                                    0
                                  ).toLocaleString('pt-BR', {
                                    style: 'currency',
                                    currency: 'BRL',
                                  })}
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <p className="text-[11px] text-muted-foreground italic">
                          Nenhum material de manutenção adicional lançado nesta proposta.
                        </p>
                      )}
                    </div>

                    {/* Quebra de Custos Indiretos */}
                    <div className="p-4 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-300 dark:border-amber-900/60 space-y-3 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-amber-900 dark:text-amber-300 flex items-center gap-1.5 uppercase text-[11px] tracking-wider">
                          <SlidersHorizontal className="h-4 w-4" />
                          Custos Indiretos & Composição de Preço (NÃO VISÍVEL AO CLIENTE)
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
                        </div>

                        <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900">
                          <span className="text-muted-foreground block text-[10px]">
                            Custos Administrativos:
                          </span>
                          <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                            15% fixo
                          </span>
                        </div>

                        <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900">
                          <span className="text-muted-foreground block text-[10px]">
                            Total de Impostos:
                          </span>
                          <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                            {computation.totalTaxesPercent}%
                          </span>
                        </div>

                        <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900">
                          <span className="text-muted-foreground block text-[10px]">
                            Comissão de Vendas:
                          </span>
                          <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                            {salesCommission}%
                          </span>
                        </div>
                      </div>
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
                            currentViewQuote.subtotal ||
                            computation.directCostsTotal ||
                            0
                          ).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between text-base font-extrabold text-slate-900 dark:text-slate-100 pt-2 border-t border-slate-200 dark:border-slate-800">
                      <span>Valor Total da Proposta:</span>
                      <span className="text-teal-700 dark:text-teal-400 font-mono">
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

      {/* MODAL COMPLETO DE CRIAÇÃO / EDIÇÃO DE ORÇAMENTO */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="sm:max-w-[860px] max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <Badge className="bg-teal-700 text-white text-[10px]">
                Intertermal - Serviços Técnicos
              </Badge>
              <span className="text-xs text-muted-foreground">
                Engenharia & Manutenção de Válvulas e Trocadores (BERMO / Alfa Laval)
              </span>
            </div>
            <DialogTitle className="text-lg font-bold">
              {isEditMode
                ? `Editar Proposta Técnica: ${quoteNumber}`
                : 'Novo Orçamento de Prestação de Serviços'}
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
                  className="text-xs font-mono font-bold"
                  required
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-medium">Cliente Industrial Destinatário *</Label>
                  {onCreateClient && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setIsNewClientModalOpen(true)}
                      className="h-6 text-[11px] px-2 text-teal-700 border-teal-300 hover:bg-teal-50 dark:hover:bg-teal-950 font-medium"
                    >
                      <Plus className="h-3 w-3 mr-1 text-teal-600" />
                      Novo Cliente
                    </Button>
                  )}
                </div>
                <Select value={clientId} onValueChange={setClientId} required>
                  <SelectTrigger className="text-xs">
                    <SelectValue placeholder="Selecione o cliente..." />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.length === 0 ? (
                      <div className="p-2 text-xs text-muted-foreground text-center">
                        Nenhum cliente cadastrado
                      </div>
                    ) : (
                      clients.map((c) => (
                        <SelectItem key={c.id} value={c.id} className="text-xs">
                          {c.name} {c.city ? `(${c.city}/${c.state || 'BR'})` : ''}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* SEÇÃO 3A: PRODUTO BERMO / FORNECEDOR (COMBOBOX EDITÁVEL E BUSCA) */}
            <div className="p-3.5 rounded-xl bg-teal-50/40 dark:bg-teal-950/20 border border-teal-200 dark:border-teal-900/60 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Flame className="h-4 w-4 text-teal-700" />
                  <span className="text-xs font-bold text-teal-900 dark:text-teal-200 uppercase tracking-wider">
                    3a. Produto BERMO / Alfa Laval & Parâmetros Técnicos do Serviço
                  </span>
                </div>
                <Badge
                  variant="outline"
                  className="text-[10px] bg-teal-100 text-teal-800 border-teal-300 font-semibold"
                >
                  {matchedSupplierInfo
                    ? `Fornecedor: ${matchedSupplierInfo.brand}`
                    : 'Modelo Customizado'}
                </Badge>
              </div>

              {/* Combobox editável com busca na base de fornecedores */}
              <div className="space-y-1.5 relative">
                <div className="flex items-center justify-between">
                  <Label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                    Modelo do Equipamento (Editável - Selecione ou Digite o Modelo do Fabricante) *
                  </Label>
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <Search className="h-3 w-3 text-teal-600" />
                    Busca em base BERMO & Alfa Laval
                  </span>
                </div>

                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      value={modelSearchInput}
                      onChange={(e) => {
                        handleModelSearchChange(e.target.value)
                      }}
                      onFocus={() => {
                        setShowSupplierDropdown(true)
                        setActiveItemIndexForDropdown(0)
                      }}
                      placeholder="Digite ex: T5-BFG, BP30, M10-B, BL50 ou modelo customizado..."
                      className="text-xs h-9 bg-white dark:bg-slate-900 font-bold text-teal-900 dark:text-teal-100 pr-8"
                      required
                    />
                    {matchedSupplierInfo && (
                      <span
                        className="absolute right-2.5 top-2.5"
                        title="Especificações técnicas encontradas na base do fornecedor"
                      >
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      </span>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowSupplierDropdown(!showSupplierDropdown)
                      setActiveItemIndexForDropdown(0)
                    }}
                    className="h-9 text-xs border-teal-300 text-teal-700 bg-white dark:bg-slate-900 hover:bg-teal-50"
                  >
                    <Search className="h-3.5 w-3.5 mr-1" />
                    Busca em base BERMO & Alfa Laval ({SUPPLIERS_DATABASE.length})
                  </Button>
                </div>

                {/* Dropdown de sugestões da base de fornecedores BERMO & Alfa Laval */}
                {showSupplierDropdown && (
                  <div className="absolute z-30 left-0 right-0 mt-1 max-h-64 overflow-y-auto bg-white dark:bg-slate-900 border border-teal-400 dark:border-teal-700 rounded-lg shadow-2xl p-1.5 space-y-1">
                    <div className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <span>
                        Base de Fornecedores BERMO & Alfa Laval ({filteredSuppliers.length})
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowSupplierDropdown(false)}
                        className="text-[10px] text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                      >
                        Fechar ✕
                      </button>
                    </div>
                    {filteredSuppliers.length === 0 ? (
                      <div className="p-3 text-center text-xs text-muted-foreground bg-amber-50/50 dark:bg-amber-950/20 rounded">
                        <p className="font-semibold text-amber-900 dark:text-amber-300">
                          Modelo &ldquo;{modelSearchInput}&rdquo; não encontrado no catálogo.
                        </p>
                        <p className="text-[11px] mt-0.5 text-amber-800/80 dark:text-amber-400/80">
                          Você pode preencher as especificações técnicas manualmente nos campos
                          abaixo (placas, conexões, materiais).
                        </p>
                      </div>
                    ) : (
                      filteredSuppliers.map((p) => (
                        <div
                          key={p.id}
                          onClick={() => {
                            applySupplierProductToItem(
                              p,
                              activeItemIndexForDropdown !== null ? activeItemIndexForDropdown : 0,
                            )
                            setShowSupplierDropdown(false)
                          }}
                          className="p-2 rounded-md hover:bg-teal-50 dark:hover:bg-teal-950/70 cursor-pointer text-xs flex items-center justify-between transition-colors border border-transparent hover:border-teal-300"
                        >
                          <div>
                            <span className="font-bold text-slate-900 dark:text-slate-100 font-mono mr-2">
                              {p.code}
                            </span>
                            <span className="text-slate-700 dark:text-slate-300 font-semibold">
                              {p.name}
                            </span>
                            <div className="text-[10px] text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5 font-mono">
                              <span className="font-semibold text-teal-800 dark:text-teal-300">
                                Marca: {p.brand}
                              </span>
                              {p.specs.platesRange && <span>• Placas: {p.specs.platesRange}</span>}
                              {p.specs.connection && <span>• Conexão: {p.specs.connection}</span>}
                              {p.specs.material && <span>• Material: {p.specs.material}</span>}
                            </div>
                          </div>
                          <Badge
                            variant="secondary"
                            className={`text-[9px] shrink-0 font-bold ${
                              p.brand === 'Alfa Laval'
                                ? 'bg-blue-100 text-blue-900 dark:bg-blue-900/60 dark:text-blue-200'
                                : 'bg-teal-100 text-teal-900 dark:bg-teal-900/60 dark:text-teal-200'
                            }`}
                          >
                            {p.brand}
                          </Badge>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {matchedSupplierInfo && (
                  <div className="p-2 rounded bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/60 text-[11px] text-emerald-900 dark:text-emerald-300 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>
                      Modelo reconhecido na base <strong>{matchedSupplierInfo.brand}</strong>:
                      especificações técnicas de placas, gaxetas, dimensões e conexões
                      auto-preenchidas!
                    </span>
                  </div>
                )}
              </div>

              {/* Fluido de processo */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
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

                <div className="space-y-1">
                  <Label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                    Nome / Detalhe do Fluido (Opcional)
                  </Label>
                  <Input
                    value={fluidName}
                    onChange={(e) => setFluidName(e.target.value)}
                    placeholder="Ex: Solução Soda Cáustica 2% CIP"
                    className="text-xs bg-white dark:bg-slate-900"
                  />
                </div>
              </div>

              {/* Opção de incluir ou não o custo de compra do produto na proposta */}
              <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-emerald-700 dark:text-emerald-400" />
                    <Label
                      htmlFor="toggle-include-product-cost"
                      className="text-xs font-bold text-emerald-950 dark:text-emerald-200 cursor-pointer"
                    >
                      Incluir custo de fornecimento do equipamento novo na proposta
                    </Label>
                  </div>
                  <p className="text-[11px] text-emerald-900/80 dark:text-emerald-300/80">
                    As especificações técnicas sempre aparecem na proposta técnica. O valor de venda
                    do equipamento só é somado se esta opção for ativada.
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                  <span className="text-xs font-mono font-bold text-emerald-950 dark:text-emerald-200">
                    {(productBasePrice || 0).toLocaleString('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    })}
                  </span>
                  <Switch
                    id="toggle-include-product-cost"
                    checked={includeProductCost}
                    onCheckedChange={handleToggleIncludeProductCost}
                  />
                </div>
              </div>

              {/* ESPECIFICAÇÕES TÉCNICAS AUTO-PREENCHIDAS */}
              <div className="p-2.5 rounded-lg bg-teal-100/50 dark:bg-teal-900/30 border border-teal-300 dark:border-teal-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-teal-900 dark:text-teal-200 flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-teal-600" />
                    Especificações Técnicas de Placas & Gaxetas (Editáveis / Sincronizadas)
                  </span>
                  <Badge
                    variant="outline"
                    className="text-[9px] bg-white dark:bg-slate-900 text-teal-800 border-teal-300 font-mono"
                  >
                    Auto-Filled
                  </Badge>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div className="space-y-1">
                    <Label className="text-[10px] font-semibold text-slate-700 dark:text-slate-300">
                      Número de Placas
                    </Label>
                    <Input
                      value={platesCount}
                      onChange={(e) => setPlatesCount(e.target.value)}
                      placeholder="ex: 40"
                      className="text-xs h-8 bg-white dark:bg-slate-900 font-semibold text-teal-900 dark:text-teal-100"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[10px] font-semibold text-slate-700 dark:text-slate-300">
                      Dimensão das Placas
                    </Label>
                    <Input
                      value={plateDimensions}
                      onChange={(e) => setPlateDimensions(e.target.value)}
                      placeholder="ex: 680 x 280 mm"
                      className="text-xs h-8 bg-white dark:bg-slate-900"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[10px] font-semibold text-slate-700 dark:text-slate-300">
                      Quantidade de Gaxetas
                    </Label>
                    <Input
                      value={gasketsCount}
                      onChange={(e) => setGasketsCount(e.target.value)}
                      placeholder="ex: 40"
                      className="text-xs h-8 bg-white dark:bg-slate-900 font-semibold text-teal-900 dark:text-teal-100"
                    />
                  </div>
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
                  <Label className="text-[10px] text-muted-foreground">Vazão (m³/h)</Label>
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
                    placeholder="ex: DN50 / 2 polegadas"
                    className="text-xs h-8 bg-white dark:bg-slate-900"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] text-muted-foreground">Material das Placas</Label>
                  <Input
                    value={frameMaterial}
                    onChange={(e) => setFrameMaterial(e.target.value)}
                    placeholder="ex: AISI 316L / Titânio"
                    className="text-xs h-8 bg-white dark:bg-slate-900"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] text-muted-foreground">
                    Tipo de Gaxeta / Vedação
                  </Label>
                  <Input
                    value={gasketType}
                    onChange={(e) => setGasketType(e.target.value)}
                    placeholder="ex: NBR / EPDM / Viton"
                    className="text-xs h-8 bg-white dark:bg-slate-900"
                  />
                </div>
              </div>

              {/* CAMPOS DO ITEM 3A: DIFICULDADE, INTEGRAÇÃO E TUBULAÇÃO */}
              <div className="p-3 rounded-lg bg-teal-100/40 dark:bg-teal-900/30 border border-teal-300 dark:border-teal-800 space-y-2.5">
                <span className="text-[11px] font-bold text-teal-900 dark:text-teal-200 block">
                  Parâmetros de Acesso e Tubulação (Escopo Técnico 3A)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label className="text-[10px] font-semibold text-slate-700 dark:text-slate-300">
                      Grau de Dificuldade da Área de Trabalho *
                    </Label>
                    <Select
                      value={workAreaDifficulty}
                      onValueChange={(val: any) => setWorkAreaDifficulty(val)}
                    >
                      <SelectTrigger className="text-xs h-8 bg-white dark:bg-slate-900">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Alto" className="text-xs font-semibold text-red-600">
                          Alto (Espaço confinado / Altura / Alta Temp.)
                        </SelectItem>
                        <SelectItem value="Médio" className="text-xs font-semibold text-amber-600">
                          Médio (Plataforma padrão / Tubulação suspensa)
                        </SelectItem>
                        <SelectItem
                          value="Baixo"
                          className="text-xs font-semibold text-emerald-600"
                        >
                          Baixo (Nível do piso / Fácil acesso)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[10px] font-semibold text-slate-700 dark:text-slate-300">
                      Necessidade de Integração (Onboarding) *
                    </Label>
                    <Select
                      value={needsIntegration}
                      onValueChange={(val: any) => setNeedsIntegration(val)}
                    >
                      <SelectTrigger className="text-xs h-8 bg-white dark:bg-slate-900 font-semibold">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Não" className="text-xs font-semibold text-slate-600">
                          Não (Sem custo adicional)
                        </SelectItem>
                        <SelectItem value="Sim" className="text-xs font-semibold text-teal-700">
                          Sim (Requer integração de funcionários)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[10px] font-semibold text-slate-700 dark:text-slate-300">
                      Medida da Tubulação (Editável) *
                    </Label>
                    <Input
                      value={pipeMeasurement}
                      onChange={(e) => setPipeMeasurement(e.target.value)}
                      placeholder="Ex: DN50 (2 pol) / DN100 (4 pol)"
                      className="text-xs h-8 bg-white dark:bg-slate-900 font-semibold"
                    />
                  </div>
                </div>

                {needsIntegration === 'Sim' && (
                  <div className="p-2.5 rounded-lg bg-teal-50 dark:bg-teal-950/60 border border-teal-300 dark:border-teal-700 space-y-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-[10px] font-bold text-teal-900 dark:text-teal-200 flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5 text-teal-600" />
                          Quando será a integração? *
                        </Label>
                        <Select
                          value={integrationTiming}
                          onValueChange={(val: any) => setIntegrationTiming(val)}
                        >
                          <SelectTrigger className="text-xs h-8 bg-white dark:bg-slate-900 font-semibold text-teal-900 dark:text-teal-100">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="same_day" className="text-xs">
                              No dia do início da obra (+50% H/H da equipe)
                            </SelectItem>
                            <SelectItem value="early" className="text-xs">
                              Antecipada (+1 diária completa H/H + deslocamento)
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="p-2 rounded bg-white dark:bg-slate-900 border border-teal-200 dark:border-teal-800 text-xs flex flex-col justify-center">
                        <span className="text-[10px] text-muted-foreground block">
                          Custo Adicional da Integração Calculado:
                        </span>
                        <span className="text-sm font-bold text-teal-700 dark:text-teal-300">
                          {(computation.integrationTotal || 0).toLocaleString('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* SEÇÃO 2: ITENS & MÚLTIPLOS MODELOS/TOCADORES DE CALOR NO MESMO ORÇAMENTO */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Wrench className="h-4 w-4 text-teal-600" />
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                    Equipamentos & Serviços no Orçamento ({items.length})
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => handleAddEquipmentItem()}
                    className="h-7 text-xs bg-teal-700 hover:bg-teal-600 text-white font-semibold shadow-xs"
                  >
                    <Plus className="h-3 w-3 mr-1" /> Adicionar Equipamento
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                {items.map((it, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3 shadow-xs"
                  >
                    {/* Header do Equipamento / Item */}
                    <div className="flex items-start justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2.5">
                      <div className="flex items-center gap-2 flex-1">
                        <Badge className="bg-slate-800 text-white text-[10px] px-1.5 py-0">
                          Item #{idx + 1}
                        </Badge>
                        <div className="flex-1 space-y-1">
                          <Label className="text-[10px] font-semibold text-slate-700 dark:text-slate-300">
                            Equipamento / Modelo BERMO & Alfa Laval *
                          </Label>
                          <div className="flex items-center gap-2">
                            <Select
                              value={
                                it.bermo_specs?.productCode || (idx === 0 ? selectedBermoCode : '')
                              }
                              onValueChange={(val) => {
                                const found = SUPPLIERS_DATABASE.find(
                                  (p) => p.code === val || p.id === val,
                                )
                                if (found) {
                                  applySupplierProductToItem(found, idx)
                                }
                              }}
                            >
                              <SelectTrigger className="text-xs h-8 font-semibold bg-slate-50 dark:bg-slate-900">
                                <SelectValue placeholder="Selecione o modelo do fabricante..." />
                              </SelectTrigger>
                              <SelectContent className="max-h-56">
                                {SUPPLIERS_DATABASE.map((p) => (
                                  <SelectItem key={p.id} value={p.code} className="text-xs">
                                    <span className="font-bold mr-1">[{p.brand}]</span> {p.model} (
                                    {p.code}) - {p.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>

                      {items.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveItem(idx)}
                          className="h-7 px-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                          title="Remover Equipamento"
                        >
                          <Trash2 className="h-3.5 w-3.5 mr-1" />
                          <span className="text-[11px]">Remover</span>
                        </Button>
                      )}
                    </div>

                    {/* Especificações Técnicas do Equipamento Individual Carregadas Automaticamente */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-teal-50/50 dark:bg-teal-950/20 p-2.5 rounded-md border border-teal-100 dark:border-teal-900/40">
                      <div className="space-y-1">
                        <Label className="text-[10px] font-semibold text-slate-700 dark:text-slate-300">
                          Nº de Placas
                        </Label>
                        <Input
                          value={it.bermo_specs?.platesCount || '40'}
                          onChange={(e) =>
                            handleUpdateItemSpecs(idx, 'platesCount', e.target.value)
                          }
                          placeholder="ex: 40"
                          className="text-xs h-7 bg-white dark:bg-slate-900 font-semibold text-teal-900 dark:text-teal-100"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] font-semibold text-slate-700 dark:text-slate-300">
                          Dimensão Placas
                        </Label>
                        <Input
                          value={it.bermo_specs?.plateDimensions || '680 x 280 mm'}
                          onChange={(e) =>
                            handleUpdateItemSpecs(idx, 'plateDimensions', e.target.value)
                          }
                          placeholder="ex: 680 x 280 mm"
                          className="text-xs h-7 bg-white dark:bg-slate-900"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] font-semibold text-slate-700 dark:text-slate-300">
                          Qtd Gaxetas / Vedação
                        </Label>
                        <Input
                          value={it.bermo_specs?.gasketsCount || '40'}
                          onChange={(e) =>
                            handleUpdateItemSpecs(idx, 'gasketsCount', e.target.value)
                          }
                          placeholder="ex: 40"
                          className="text-xs h-7 bg-white dark:bg-slate-900 font-semibold text-teal-900 dark:text-teal-100"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] font-semibold text-slate-700 dark:text-slate-300">
                          Tamanho / Conexão
                        </Label>
                        <Input
                          value={it.bermo_specs?.equipmentSize || 'DN50 (2 pol)'}
                          onChange={(e) =>
                            handleUpdateItemSpecs(idx, 'equipmentSize', e.target.value)
                          }
                          placeholder="ex: DN50 (2 pol)"
                          className="text-xs h-7 bg-white dark:bg-slate-900"
                        />
                      </div>
                    </div>

                    {/* Preços, Quantidade e Custo Individual de Manutenção */}
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end pt-1">
                      <div className="sm:col-span-5 space-y-1">
                        <Label className="text-[10px] font-semibold text-slate-700 dark:text-slate-300">
                          Título / Descrição Comercial do Item *
                        </Label>
                        <Input
                          value={it.name}
                          onChange={(e) => handleUpdateItem(idx, 'name', e.target.value)}
                          className="text-xs font-semibold h-8"
                          required
                        />
                      </div>

                      <div className="sm:col-span-2 space-y-1">
                        <Label className="text-[10px] font-semibold text-slate-700 dark:text-slate-300">
                          Quantidade
                        </Label>
                        <Input
                          type="number"
                          min="1"
                          value={it.quantity}
                          onChange={(e) =>
                            handleUpdateItem(idx, 'quantity', Number(e.target.value))
                          }
                          className="text-xs h-8 text-center font-bold"
                        />
                      </div>

                      <div className="sm:col-span-3 space-y-1">
                        <div className="flex items-center justify-between">
                          <Label className="text-[10px] font-semibold text-slate-700 dark:text-slate-300">
                            Custo Unitário Manutenção (R$)
                          </Label>
                        </div>
                        <Input
                          type="number"
                          step="0.01"
                          value={it.unit_price}
                          onChange={(e) =>
                            handleUpdateItem(idx, 'unit_price', Number(e.target.value))
                          }
                          className="text-xs h-8 text-right font-mono font-bold text-teal-800 dark:text-teal-200"
                        />
                      </div>

                      <div className="sm:col-span-2 space-y-1 text-right">
                        <Label className="text-[10px] font-semibold text-slate-700 dark:text-slate-300">
                          Total do Item
                        </Label>
                        <div className="text-xs font-bold text-emerald-700 dark:text-emerald-300 h-8 flex items-center justify-end font-mono bg-slate-50 dark:bg-slate-900 px-2 rounded border border-slate-200 dark:border-slate-800">
                          {(it.total || 0).toLocaleString('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Checkbox de Fornecimento do Equipamento Novo para este item */}
                    <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-900/60 p-2 rounded border border-slate-200 dark:border-slate-800 text-xs">
                      <div className="flex items-center gap-2">
                        <Switch
                          id={`toggle-prod-item-${idx}`}
                          checked={it.include_product_cost ?? false}
                          onCheckedChange={(chk) => handleToggleItemIncludeProduct(idx, chk)}
                        />
                        <Label
                          htmlFor={`toggle-prod-item-${idx}`}
                          className="text-[11px] font-semibold cursor-pointer"
                        >
                          Incluir também fornecimento do equipamento novo (+{' '}
                          {(it.bermo_specs?.productBasePrice || 18500).toLocaleString('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          })}
                          )
                        </Label>
                      </div>
                      {it.bermo_specs?.productBrand && (
                        <Badge variant="outline" className="text-[10px] font-mono">
                          {it.bermo_specs.productBrand}
                        </Badge>
                      )}
                    </div>

                    {/* Metodologia de Engenharia do Item */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <Label className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3 text-teal-600" />
                          Metodologia do Serviço para este Equipamento (Proposta do Cliente)
                        </Label>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const brand = it.bermo_specs?.productBrand || 'BERMO'
                            handleUpdateItem(
                              idx,
                              'description',
                              getStandardServiceMethodology([brand, ...distinctBrands]),
                            )
                          }}
                          className="h-5 text-[10px] text-teal-700 hover:bg-teal-50 px-1.5"
                        >
                          Resetar Metodologia
                        </Button>
                      </div>
                      <Textarea
                        value={it.description || ''}
                        onChange={(e) => handleUpdateItem(idx, 'description', e.target.value)}
                        placeholder="Descreva a metodologia aplicada a este equipamento..."
                        rows={3}
                        className="text-xs font-mono bg-slate-50/70 dark:bg-slate-900 resize-y leading-relaxed"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* SEÇÃO 4: MATERIAIS DE MANUTENÇÃO (APENAS COMPOSIÇÃO INTERNA) */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-teal-600" />
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                    4. Materiais de Manutenção (Composição Interna)
                  </span>
                </div>
                <span className="text-xs font-bold text-teal-700 dark:text-teal-300 font-mono">
                  Subtotal Materiais:{' '}
                  {maintenanceMaterialsTotal.toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  })}
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-teal-50/60 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-900/60 text-[11px] text-teal-900 dark:text-teal-200 flex items-center gap-1.5">
                <AlertCircle className="h-4 w-4 text-teal-600 shrink-0" />
                <span>
                  O valor dos materiais inseridos aqui compõe{' '}
                  <strong>apenas a composição interna</strong> de custos diretos. NÃO é exibido
                  separadamente na proposta do cliente nem no PDF.
                </span>
              </div>

              {/* Formulário de Inserção de Material */}
              <div className="flex flex-col sm:flex-row gap-2 items-end">
                <div className="flex-1 space-y-1 w-full">
                  <Label className="text-[10px] font-semibold text-slate-700 dark:text-slate-300">
                    Descrição do Material de Manutenção
                  </Label>
                  <Input
                    value={newMaterialDesc}
                    onChange={(e) => setNewMaterialDesc(e.target.value)}
                    placeholder="Ex: Solvente Desengraxante Químico 20L, Estopas, Kit Vedação..."
                    className="text-xs h-8 bg-white dark:bg-slate-950"
                  />
                </div>
                <div className="w-full sm:w-36 space-y-1">
                  <Label className="text-[10px] font-semibold text-slate-700 dark:text-slate-300">
                    Valor (R$)
                  </Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={newMaterialAmount}
                    onChange={(e) => setNewMaterialAmount(e.target.value)}
                    placeholder="0.00"
                    className="text-xs h-8 bg-white dark:bg-slate-950 font-mono"
                  />
                </div>
                <Button
                  type="button"
                  onClick={handleAddMaterial}
                  className="h-8 text-xs bg-teal-700 hover:bg-teal-600 text-white shrink-0"
                >
                  <Plus className="h-3.5 w-3.5 mr-1" /> Adicionar Material
                </Button>
              </div>

              {/* Lista dos materiais adicionados */}
              {maintenanceMaterials.length > 0 && (
                <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden bg-white dark:bg-slate-950">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100 dark:bg-slate-800 text-[10px] uppercase font-semibold text-slate-600 dark:text-slate-300">
                      <tr>
                        <th className="p-2">Material</th>
                        <th className="p-2 text-right">Valor (R$)</th>
                        <th className="p-2 text-center w-12">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {maintenanceMaterials.map((m) => (
                        <tr key={m.id}>
                          <td className="p-2">{m.description}</td>
                          <td className="p-2 text-right font-mono font-bold">
                            {m.amount.toLocaleString('pt-BR', {
                              style: 'currency',
                              currency: 'BRL',
                            })}
                          </td>
                          <td className="p-2 text-center">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveMaterial(m.id)}
                              className="h-6 w-6 text-red-500 hover:text-red-700 hover:bg-red-50"
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

            {/* SEÇÃO 3b: MÃO DE OBRA (3 FUNÇÕES) */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
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
                  <div className="text-right text-[11px] font-bold text-slate-700 dark:text-slate-300 font-mono">
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
                  <div className="text-right text-[11px] font-bold text-slate-700 dark:text-slate-300 font-mono">
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

            {/* SEÇÃO 3c: DESLOCAMENTO & LOGÍSTICA */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Truck className="h-4 w-4 text-emerald-600" />
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                    3c. Deslocamento & Rotas (Ref. Mapeia / Google Maps)
                  </span>
                </div>
                <span className="text-xs font-bold text-emerald-600 font-mono">
                  Subtotal Deslocamento:{' '}
                  {travelTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
              </div>
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
                          handleRecalculateRoute(undefined, val)
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
                          handleRecalculateRoute(val, undefined)
                        }
                      }}
                      placeholder="CEP Destino"
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
              {/* Parâmetros do Mapeia / Deslocamento */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <Label className="text-[10px] text-muted-foreground">
                      Distância Total (Ida + Volta km)
                    </Label>
                    <Badge
                      variant="outline"
                      className="text-[9px] px-1 py-0 text-emerald-700 bg-emerald-50"
                    >
                      ×2 Ida/Volta
                    </Badge>
                  </div>
                  <Input
                    type="number"
                    value={distanceKm}
                    onChange={(e) => setDistanceKm(Number(e.target.value))}
                    className="text-xs h-8 font-bold font-mono text-emerald-800 dark:text-emerald-300"
                  />
                  <span className="text-[9px] text-muted-foreground block">
                    (Ida: ~{Math.round(distanceKm / 2)} km | Volta: ~{Math.round(distanceKm / 2)}{' '}
                    km)
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
                    Litros: ~{(distanceKm / (consumptionKmL || 9.5)).toFixed(1)} L (ida+volta)
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
                    Pedágios:{' '}
                    {baseTollCost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                </div>
              </div>
              {/* Ajustes Manuais de Combustível e Pedágio */}
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
              =======
              <div className="flex justify-end pt-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isCalculatingRoute}
                  onClick={() => handleRecalculateRoute()}
                  className="text-[11px] h-7 border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                >
                  {isCalculatingRoute ? 'Buscando Rota...' : 'Recalcular Rota Mapeia'}
                </Button>
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

            {/* SEÇÃO 3e: CUSTOS INDIRETOS & IMPOSTOS */}
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
                    <Label className="text-[9px] text-muted-foreground">ISS (%)</Label>
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
                    <Label className="text-[9px] text-muted-foreground">Dif. IR (%)</Label>
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

            {/* SEÇÃO 3f: PRAZO & CONDIÇÕES */}
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

            {/* Totalizador Geral */}
            <div className="p-4 rounded-xl bg-slate-900 text-white flex items-center justify-between">
              <div>
                <span className="text-[11px] text-slate-400 block">
                  Preço Final de Venda ao Cliente:
                </span>
                <span className="text-xl font-black text-teal-300 font-mono">
                  {computation.finalClientPrice.toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  })}
                </span>
              </div>
              <div className="text-right text-[11px] text-slate-300">
                <div>
                  Custos Diretos (com materiais):{' '}
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
                onClick={() => setIsCreateModalOpen(false)}
                className="text-xs"
              >
                Cancelar
              </Button>
              <Button type="submit" className="text-xs bg-teal-700 hover:bg-teal-600 text-white">
                {isEditMode ? 'Salvar Alterações na Proposta' : 'Emitir Proposta Técnica'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal de Criação Rápida de Cliente */}
      {onCreateClient && (
        <Dialog open={isNewClientModalOpen} onOpenChange={setIsNewClientModalOpen}>
          <DialogContent className="sm:max-w-[450px]">
            <DialogHeader>
              <DialogTitle className="text-base font-bold">Cadastrar Novo Cliente</DialogTitle>
            </DialogHeader>
            <form
              onSubmit={async (e) => {
                e.preventDefault()
                if (!newClientName) return
                const created = await onCreateClient({
                  name: newClientName,
                  document: newClientDoc,
                  city: newClientCity,
                  state: newClientState,
                  status: 'active',
                })
                if (created?.id) {
                  setClientId(created.id)
                  if (newClientCity) {
                    setDestinationAddress(`${newClientCity} / ${newClientState}`)
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

      {/* Modal de Prévia em PDF da Proposta */}
      <QuotePdfPreviewDialog
        quote={quoteForPdf}
        open={isPdfPreviewOpen}
        onOpenChange={setIsPdfPreviewOpen}
      />
    </div>
  )
}
