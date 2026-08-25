import type { BermoProductItem } from '@/data/bermo-catalog'

export type ClientStatus = 'lead' | 'prospect' | 'active' | 'churned' | 'partner'

export interface ClientRecord {
  id: string
  name: string
  company_name?: string
  document?: string
  email?: string
  phone?: string
  whatsapp?: string
  segment?: string
  status?: ClientStatus
  score?: number
  address?: string
  city?: string
  state?: string
  notes?: string
  tags?: string[]
  assigned_to?: string
  created?: string
  updated?: string
}

export type DealStage =
  | 'prospecting'
  | 'qualification'
  | 'proposal'
  | 'negotiation'
  | 'won'
  | 'lost'

export type Priority = 'low' | 'medium' | 'high' | 'urgent'

export interface DealRecord {
  id: string
  title: string
  client_id?: string
  client_name?: string
  value?: number
  stage?: DealStage
  probability?: number
  expected_close_date?: string
  assigned_to?: string
  priority?: Priority
  loss_reason?: string
  notes?: string
  created?: string
  updated?: string
}

export type ProductCategory =
  | 'software'
  | 'hardware'
  | 'consulting'
  | 'maintenance'
  | 'subscription'
  | 'training'

export interface ProductRecord {
  id: string
  code?: string
  name: string
  category?: ProductCategory
  description?: string
  price?: number
  cost?: number
  unit?: string
  is_active?: boolean
  created?: string
  updated?: string
}

export type QuoteStatus = 'draft' | 'sent' | 'approved' | 'rejected' | 'expired'

// 3a. Especificações Técnicas de Serviço para produtos BERMO
export interface ServiceTechnicalSpecs {
  productId?: string
  productCode?: string
  productModel?: string
  productBrand?: 'BERMO' | 'ARI Armaturen'
  category?: string
  serviceScope?: string // ex: Manutenção preventiva, Reparos em sede, Retubagem, Troca de gaxetas, Instalação e start-up, Calibração
  fluidType?:
    | 'vapor'
    | 'oleo_termico'
    | 'agua_quente'
    | 'agua_gelada'
    | 'ar_comprimido'
    | 'gases'
    | 'quimico'
    | 'outros'
  fluidName?: string
  inletTemp?: number | string // °C
  outletTemp?: number | string // °C
  operatingPressure?: number | string // bar / barg
  flowRate?: number | string // m³/h ou kg/s
  pressureDrop?: number | string // bar / mca
  equipmentSize?: string // Tamanho ou número de placas/DN
  frameMaterial?: string // ex: Aço Carbono, Inox 304, Inox 316
  gasketType?: string // ex: NBR, EPDM, Viton, PTFE
  platesCount?: number | string // Número das placas
  plateDimensions?: string // Dimensão das placas
  gasketsCount?: number | string // Quantidade de gaxetas
}

// 3b. Mão de obra — 3 funções
export interface LaborRoleItem {
  professionalsCount: number
  estimatedHours: number
  hourlyRate: number // R$/h
  total: number
}

export interface LaborCosts {
  technician: LaborRoleItem // Técnico
  helper: LaborRoleItem // Ajudante
  inspector: LaborRoleItem // Inspetor
  total: number
}

// 3c. Deslocamento (Google Maps / Mapeia / Haversine)
export interface TravelCosts {
  originAddress: string
  originCep: string
  destinationAddress: string
  destinationCep: string
  distanceKm: number
  roundTrip: boolean // Ida e volta (2x)
  fuelConsumptionKmL: number // Padrão 10 km/L
  fuelPricePerLiter: number // Padrão R$ 6.10
  tollRoadPercentage: number // Padrão 70%
  tollRatePerKm: number // Padrão R$ 0.15 por km pedagiado
  calculatedFuelCost: number
  calculatedTollCost: number
  manualFuelAdjustment: number
  manualTollAdjustment: number
  total: number
}

// 3d. Hospedagem e Alimentação
export interface LodgingMealsCosts {
  hotelDailyCount: number
  hotelDailyRate: number // R$ por diária
  mealsDailyCount: number
  mealsDailyRate: number // R$ por refeição/diária
  hotelSubtotal: number
  mealsSubtotal: number
  total: number
}

// 3e. Custos Indiretos (Internos - NÃO exibidos ao cliente na proposta final)
export interface IndirectTaxes {
  pis: number // Padrão 1.65%
  cofins: number // Padrão 7.60%
  iss: number // Padrão 5.00% (editável conforme município)
  csll: number // Padrão 1.08%
  irpj: number // Padrão 4.80%
  irDifference: number // Padrão 20.00% sobre o IRPJ (= 0.96%)
  totalTaxesPercentage: number
  calculatedTaxesAmount: number
}

export interface IndirectCosts {
  serviceMarginPercent: number // 20% a 30% (Padrão 25%)
  administrativeCostPercent: number // Fixo 15%
  taxes: IndirectTaxes
  salesCommissionPercent: number // 4% a 10% (Padrão 6%)
  totalDirectCosts: number // MO + Deslocamento + Hosp/Alim + Equip/Peças
  serviceMarginAmount: number
  adminCostAmount: number
  salesCommissionAmount: number
  taxesAmount: number
  totalIndirectAmount: number
  calculatedSalePrice: number
}

// 3f. Prazos e Condições
export type PaymentConditionType = '14_ddl' | '28_ddl' | '30_ddl' | '45_ddl' | '60_ddl' | 'custom'

export interface PaymentAndValidity {
  validityDays: number // Padrão 10 dias úteis
  conditionType: PaymentConditionType
  customConditionText?: string
}

export interface QuoteItem {
  product_id?: string
  name: string
  quantity: number
  unit_price: number
  discount: number
  total: number
  bermo_specs?: ServiceTechnicalSpecs
}

export interface QuoteServiceDetails {
  service_technical_specs?: ServiceTechnicalSpecs
  labor_costs?: LaborCosts
  travel_costs?: TravelCosts
  lodging_meals_costs?: LodgingMealsCosts
  indirect_costs?: IndirectCosts
  payment_and_validity?: PaymentAndValidity
}

export interface QuoteRecord {
  id: string
  quote_number: string
  client_id?: string
  client_name?: string
  deal_id?: string
  status?: QuoteStatus
  items?: QuoteItem[]
  subtotal?: number
  discount_total?: number
  total?: number
  payment_terms?: string
  valid_until?: string
  notes?: string
  follow_up_date?: string
  assigned_to?: string
  created?: string
  updated?: string
  // Dados estendidos de prestação de serviços (armazenados em notes/JSON ou campos estruturados)
  service_details?: QuoteServiceDetails
}

export type TicketChannel = 'whatsapp' | 'email' | 'phone' | 'chat' | 'in_person'
export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed'

export interface TicketMessage {
  author: string
  role: 'client' | 'agent'
  message: string
  timestamp: string
  type: string
}

export interface TicketRecord {
  id: string
  ticket_number: string
  client_id?: string
  client_name?: string
  channel?: TicketChannel
  subject: string
  description?: string
  priority?: Priority
  status?: TicketStatus
  assigned_to?: string
  timeline?: TicketMessage[]
  resolution_notes?: string
  created?: string
  updated?: string
}

export type ServiceType =
  | 'installation'
  | 'training'
  | 'support'
  | 'maintenance'
  | 'consulting'
  | 'contract'

export type ServiceStatus =
  | 'planning'
  | 'in_progress'
  | 'pending_client'
  | 'completed'
  | 'cancelled'

export interface ServiceChecklistItem {
  id: string
  text: string
  completed: boolean
  completed_at?: string | null
}

export interface ServiceStageItem {
  name: string
  date: string
  status: 'done' | 'active' | 'pending'
}

export interface ServiceRecord {
  id: string
  title: string
  service_type?: ServiceType
  client_id?: string
  client_name?: string
  deal_id?: string
  status?: ServiceStatus
  start_date?: string
  end_date?: string
  contract_renewal_date?: string
  monthly_value?: number
  assigned_to?: string
  checklist?: ServiceChecklistItem[]
  stages?: ServiceStageItem[]
  notes?: string
  created?: string
  updated?: string
}

export type ActivityType = 'call' | 'meeting' | 'follow_up' | 'visit' | 'email' | 'task'

export type ActivityStatus = 'pending' | 'completed' | 'cancelled'

export interface ActivityRecord {
  id: string
  title: string
  type?: ActivityType
  client_id?: string
  client_name?: string
  deal_id?: string
  due_date: string
  time?: string
  priority?: Priority
  status?: ActivityStatus
  assigned_to?: string
  description?: string
  outcome?: string
  created?: string
  updated?: string
}
