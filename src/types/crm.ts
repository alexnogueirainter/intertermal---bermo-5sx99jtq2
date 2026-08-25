export type ClientStatus = 'lead' | 'prospect' | 'active' | 'churned' | 'partner'

export interface ClientContact {
  id?: string
  name: string
  role?: string
  email?: string
  phone?: string
  whatsapp?: string
  is_primary?: boolean
}

export interface ClientRecord {
  id: string
  name: string
  company_name?: string
  document?: string // CNPJ/CPF
  email?: string
  phone?: string
  whatsapp?: string
  segment?: string
  status: ClientStatus
  score?: number
  address?: string
  city?: string
  state?: string
  notes?: string
  tags?: string[]
  assigned_to?: string
  contacts?: ClientContact[]
  created: string
  updated: string
}

export type DealStage =
  | 'prospecting'
  | 'qualification'
  | 'proposal'
  | 'negotiation'
  | 'won'
  | 'lost'
export type PriorityLevel = 'low' | 'medium' | 'high' | 'urgent'

export interface DealRecord {
  id: string
  title: string
  client_id?: string
  client_name?: string
  value: number
  stage: DealStage
  probability?: number
  expected_close_date?: string
  assigned_to?: string
  priority?: PriorityLevel
  loss_reason?: string
  notes?: string
  created: string
  updated: string
}

export type QuoteStatus = 'draft' | 'sent' | 'approved' | 'rejected' | 'expired'

export interface BermoTechnicalSpecs {
  productCode?: string
  productName?: string
  productModel?: string
  productBrand?: string
  serviceScope?: string
  fluidType?: string
  fluidName?: string
  inletTemp?: string
  outletTemp?: string
  operatingPressure?: string
  flowRate?: string
  pressureDrop?: string
  equipmentSize?: string
  frameMaterial?: string
  gasketType?: string
  // Parâmetros técnicos específicos de trocadores de calor
  platesCount?: string
  plateDimensions?: string
  gasketsCount?: string
  // Novos campos adicionados (Item 3A)
  workAreaDifficulty?: 'Baixo' | 'Médio' | 'Alto'
  workAreaObservations?: string
  needsIntegration?: 'Sim' | 'Não'
  integrationTiming?: 'same_day' | 'early'
  integrationCost?: number
  integrationObservations?: string
  pipeMeasurement?: string
  // Flag de inclusão do custo do produto no orçamento
  includeProductCost?: boolean
  productBasePrice?: number
  serviceBasePrice?: number
}

export interface QuoteItem {
  id?: string
  product_id?: string
  name: string
  quantity: number
  unit_price: number
  discount: number
  total: number
  description?: string
  include_product_cost?: boolean
  bermo_specs?: BermoTechnicalSpecs
}

export type PaymentConditionType = '14_ddl' | '28_ddl' | '30_ddl' | '45_ddl' | '60_ddl' | 'custom'

export interface LaborCostsState {
  techMechanical: { count: number; hours: number; ratePerHour: number; total: number }
  helper: { count: number; hours: number; ratePerHour: number; total: number }
  inspectorNDT: { count: number; hours: number; ratePerHour: number; total: number }
  totalLabor: number
}

export interface TravelCostsState {
  originCep: string
  originAddress: string
  destinationCep: string
  destinationAddress: string
  distanceKm: number
  fuelPrice: number
  consumptionKmL: number
  tollRoadPercent: number
  calculatedFuelCost: number
  calculatedTollCost: number
  manualFuelAdjustment: number
  manualTollAdjustment: number
  totalTravelCost: number
}

export interface LodgingMealsCostsState {
  hotelDays: number
  hotelRatePerDay: number
  mealsDays: number
  mealsRatePerDay: number
  totalLodgingMeals: number
}

export interface IndirectCostsState {
  serviceMarginPercent: number
  administrativeCostPercent: number // 15% fixo
  salesCommissionPercent: number // 4% a 10%
  taxes: {
    pis: number // 1.65%
    cofins: number // 7.60%
    iss: number // editável (padrão 3.5%)
    csll: number // 1.08%
    irpj: number // 4.80%
    irDiff: number // 0.96% (20% sobre IRPJ)
    totalTaxes: number
  }
  totalDirectCosts: number
  serviceMarginAmount: number
  adminCostAmount: number
  salesCommissionAmount: number
  taxesAmount: number
  totalIndirectAmount: number
  calculatedSalePrice: number
}

export interface MaintenanceMaterialItem {
  id: string
  description: string
  amount: number
}

export interface QuoteServiceDetails {
  service_technical_specs?: BermoTechnicalSpecs
  labor_costs?: LaborCostsState
  travel_costs?: TravelCostsState
  lodging_meals_costs?: LodgingMealsCostsState
  maintenance_materials?: MaintenanceMaterialItem[]
  maintenance_materials_total?: number
  indirect_costs?: IndirectCostsState
  payment_and_validity?: {
    validityDays: number
    conditionType: PaymentConditionType
    customConditionText?: string
  }
}

export interface QuoteRecord {
  id: string
  quote_number: string
  client_id?: string
  client_name?: string
  deal_id?: string
  status: QuoteStatus
  items: QuoteItem[]
  subtotal: number
  discount_total: number
  total: number
  payment_terms?: string
  valid_until?: string
  notes?: string
  follow_up_date?: string
  assigned_to?: string
  service_details?: QuoteServiceDetails
  created: string
  updated: string
}

export type TicketChannel = 'whatsapp' | 'email' | 'phone' | 'chat' | 'in_person'
export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed'

export interface TicketRecord {
  id: string
  ticket_number: string
  client_id?: string
  client_name?: string
  channel: TicketChannel
  subject: string
  description?: string
  priority: PriorityLevel
  status: TicketStatus
  assigned_to?: string
  timeline?: {
    date: string
    author: string
    note: string
    status?: TicketStatus
  }[]
  resolution_notes?: string
  created: string
  updated: string
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

export interface ServiceRecord {
  id: string
  title: string
  service_type: ServiceType
  client_id?: string
  client_name?: string
  deal_id?: string
  status: ServiceStatus
  start_date?: string
  end_date?: string
  contract_renewal_date?: string
  monthly_value?: number
  assigned_to?: string
  checklist?: {
    id: string
    task: string
    completed: boolean
    due_date?: string
  }[]
  stages?: {
    id: string
    title: string
    status: 'pending' | 'in_progress' | 'completed'
    order: number
  }[]
  notes?: string
  created: string
  updated: string
}

export type ActivityType = 'call' | 'meeting' | 'follow_up' | 'visit' | 'email' | 'task'
export type ActivityStatus = 'pending' | 'completed' | 'cancelled'

export interface ActivityRecord {
  id: string
  title: string
  type: ActivityType
  client_id?: string
  client_name?: string
  deal_id?: string
  due_date?: string
  time?: string
  priority: 'low' | 'medium' | 'high'
  status: ActivityStatus
  assigned_to?: string
  description?: string
  outcome?: string
  created: string
  updated: string
}

export type ServiceOrderStatus =
  | 'pending_approval'
  | 'approved'
  | 'in_progress'
  | 'completed'
  | 'rejected'
  | 'cancelled'

export interface ServiceOrderTechnicalDetails {
  equipmentModel?: string
  equipmentTag?: string
  serialNumber?: string
  serviceLocation?: string
  contactPerson?: string
  contactPhone?: string
  scopeDescription?: string
  executionChecklist?: {
    id: string
    task: string
    completed: boolean
    responsible?: string
    notes?: string
  }[]
  safetyRequirements?: string[]
  toolsRequired?: string[]
  replacementParts?: {
    description: string
    quantity: number
    partNumber?: string
  }[]
}

export interface ServiceOrderRecord {
  id: string
  order_number: string
  quote_id?: string
  quote_number?: string
  client_id?: string
  client_name?: string
  title: string
  status: ServiceOrderStatus
  services: QuoteItem[]
  total_value: number
  priority: PriorityLevel
  assigned_to?: string
  technical_details?: ServiceOrderTechnicalDetails
  approval_notes?: string
  approved_at?: string
  approved_by?: string
  start_date?: string
  end_date?: string
  notes?: string
  created: string
  updated: string
}
