export type DealStage =
  | 'lead'
  | 'prospecting'
  | 'qualification'
  | 'contact'
  | 'proposal'
  | 'negotiation'
  | 'won'
  | 'lost'

export type QuoteStatus = 'draft' | 'pending_approval' | 'sent' | 'approved' | 'rejected'

export type ServiceOrderStatus =
  | 'pending'
  | 'pending_approval'
  | 'approved'
  | 'in_execution'
  | 'in_progress'
  | 'completed'
  | 'rejected'
  | 'cancelled'
export type ServiceStatus =
  | 'active'
  | 'inactive'
  | 'draft'
  | 'archived'
  | 'in_progress'
  | 'completed'
  | 'pending_client'
  | 'planning'
export type ServiceType =
  | 'maintenance'
  | 'installation'
  | 'chemical_cleaning'
  | 'hydrostatic_test'
  | 'inspection'
  | 'consulting'
  | 'other'
export type TicketStatus = 'open' | 'in_progress' | 'waiting' | 'resolved' | 'closed'
export type TicketChannel =
  | 'email'
  | 'whatsapp'
  | 'phone'
  | 'portal'
  | 'chat'
  | 'in_person'
  | 'other'

export type PaymentConditionType = '14_ddl' | '28_ddl' | '30_ddl' | '45_ddl' | '60_ddl' | 'custom'

export type ClientStatus = 'active' | 'inactive' | 'lead' | 'prospect' | 'churned' | 'partner'
export type ActivityType = 'call' | 'meeting' | 'email' | 'task' | 'visit' | 'follow_up'
export type ActivityStatus = 'pending' | 'completed' | 'cancelled'

export interface ClientContact {
  id?: string
  name: string
  role?: string
  email?: string
  phone?: string
  birth_date?: string
  is_primary?: boolean
}

export interface ClientRecord {
  id: string
  name: string
  company_name?: string
  document?: string
  email?: string
  phone?: string
  whatsapp?: string
  address?: string
  city?: string
  state?: string
  status?: ClientStatus | string
  segment?: string
  score?: number
  notes?: string
  tags?: string[]
  assigned_to?: string
  contacts?: ClientContact[]
  created?: string
  updated?: string
}

export interface DealRecord {
  id: string
  title: string
  client_id: string
  client_name?: string
  value: number
  stage: DealStage
  priority?: 'low' | 'medium' | 'high' | 'urgent'
  probability?: number
  expected_close_date?: string
  description?: string
  notes?: string
  assigned_to?: string
  created?: string
  updated?: string
}

export interface QuoteLaborConfig {
  techCount: number
  techHours: number
  techRate: number
  helperCount: number
  helperHours: number
  helperRate: number
  inspectorCount: number
  inspectorHours: number
  inspectorRate: number
}

export interface QuotePricingConfig {
  serviceMargin: number
  salesCommission: number
  adminRate?: number
  pisRate: number
  cofinsRate: number
  issRate: number
  csllRate: number
  irpjRate: number
  irDiffRate: number
}

export interface QuoteTravelConfig {
  originCep?: string
  originAddress?: string
  destinationCep?: string
  destinationAddress?: string
  distanceKm?: number
  isRoundTrip?: boolean
  consumptionKmL?: number
  fuelPrice?: number
  tollRoadPercent?: number
  manualFuelAdj?: number
  manualTollAdj?: number
  car_rental_type?: 'none' | 'simple' | 'complete' | 'custom' | string
  car_rental_daily_rate?: number
  car_rental_days?: number
  car_rental_total?: number
}

export interface QuoteLodgingMealsConfig {
  hotelDays?: number
  hotelRate?: number
  mealsDays?: number
  mealsRate?: number
}

export interface QuoteCustomMaterial {
  id: string
  description: string
  qty: number
  unitPrice: number
}

export interface DealRecord {
  id: string
  title: string
  client_id: string
  client_name?: string
  value: number
  stage: DealStage
  priority?: 'low' | 'medium' | 'high' | 'urgent'
  probability?: number
  expected_close_date?: string
  description?: string
  notes?: string
  created?: string
  updated?: string
}

export interface QuoteRecord {
  id: string
  code?: string
  quote_number?: string
  title?: string
  client_id: string
  client_name?: string
  client_document?: string
  deal_id?: string
  equipment_brand?: string
  equipment_model?: string
  equipment_series?: string
  plate_count?: number
  plate_material?: string
  plate_thickness?: number
  gasket_material?: string
  connection_type?: string
  connection_size?: string
  pressure_test_bar?: number
  working_pressure_bar?: number
  dimensions_w_h_d?: string
  weight_kg?: number
  work_fluid?: string
  scope_of_work?: string

  // Mão de obra (Valores individuais e agrupados)
  labor_hours?: number
  labor_rate_hourly?: number
  tech_count?: number
  tech_hours?: number
  tech_rate?: number
  helper_count?: number
  helper_hours?: number
  helper_rate?: number
  inspector_count?: number
  inspector_hours?: number
  inspector_rate?: number
  labor_config?: QuoteLaborConfig

  // Deslocamento & Rotas
  origin_cep?: string
  origin_address?: string
  destination_cep?: string
  destination_address?: string
  distance_km?: number
  is_round_trip?: boolean
  consumption_km_l?: number
  fuel_price?: number
  toll_road_percent?: number
  manual_fuel_adj?: number
  manual_toll_adj?: number
  car_rental_type?: 'none' | 'simple' | 'complete' | 'custom' | string
  car_rental_daily_rate?: number
  car_rental_days?: number
  car_rental_total?: number
  travel_config?: QuoteTravelConfig

  // Hospedagem & Alimentação
  hotel_days?: number
  hotel_rate?: number
  meals_days?: number
  meals_rate?: number
  lodging_meals_config?: QuoteLodgingMealsConfig

  // Peças & Consumíveis adicionais
  custom_materials?: QuoteCustomMaterial[]

  // Custos Diretos
  lodging_meals_cost?: number
  travel_cost?: number
  materials_cost?: number
  third_party_cost?: number
  other_costs?: number
  discount_amount?: number
  discount_total?: number
  total_cost?: number
  subtotal?: number

  // Impostos & Margens (Individuais e JSON)
  service_margin?: number
  sales_commission?: number
  admin_rate?: number
  admin_cost?: number
  pis_rate?: number
  cofins_rate?: number
  iss_rate?: number
  csll_rate?: number
  irpj_rate?: number
  ir_diff_rate?: number
  pricing_config?: QuotePricingConfig

  // Preço e Condições
  final_price?: number
  total?: number
  status: QuoteStatus
  validity_days?: number
  valid_until?: string
  payment_conditions?: PaymentConditionType | string
  payment_terms?: string
  technical_notes?: string
  commercial_notes?: string
  service_details?: any
  items?: any[]

  // Novos campos Seção 3A
  integration_needed?: boolean
  integration_day?: string
  integration_type?: 'day_of_work' | 'early' | string
  integration_when?: 'same_day' | 'early' | string
  integration_cost?: number
  work_permit_needed?: boolean
  work_permit_cost?: number
  work_permit_time?: 'first_hour' | string
  overnight_needed?: boolean
  overnight_cost?: number
  notes?: string
  assigned_to?: string
  created?: string
  updated?: string
}

export interface ServiceOrderRecord {
  id: string
  code: string
  order_number?: string
  quote_number?: string
  title?: string
  quote_id?: string
  deal_id?: string
  client_id: string
  client_name?: string
  status: ServiceOrderStatus
  priority?: string
  assigned_to?: string
  scheduled_date?: string
  technicians?: string[]
  notes?: string
  final_price?: number
  total_value?: number
  internal_cost?: number
  technical_details?: any
  services?: any[]
  approved_by?: string
  approved_at?: string
  approval_notes?: string
  rejected_by?: string
  rejected_at?: string
  rejection_notes?: string
  created?: string
  updated?: string
}

export interface ProductEquipmentSpecs {
  brand?: string
  model?: string
  modelSeries?: string
  plateCount?: number
  plateMaterial?: string
  plateThicknessMm?: number
  gasketMaterial?: string
  connectionSize?: string
  connectionType?: string
  testPressureBar?: number
  maxPressureBar?: number
  workingPressureBar?: number
  widthMm?: number
  heightMm?: number
  depthMm?: number
  dimensions?: string
  weightKg?: number
  description?: string
}

export interface ProductRecord {
  id: string
  name: string
  code?: string
  description?: string
  category?: string
  price?: number
  cost?: number
  unit?: string
  is_active?: boolean
  brand?: string
  model?: string
  specs?: ProductEquipmentSpecs | any
  created?: string
  updated?: string
}

export interface ServiceRecord {
  id: string
  name: string
  code?: string
  title?: string
  client_id?: string
  client_name?: string
  status?: ServiceStatus | string
  service_type?: ServiceType | string
  description?: string
  category?: string
  base_price?: number
  monthly_value?: number
  estimated_hours?: number
  start_date?: string
  end_date?: string
  notes?: string
}

export interface ActivityRecord {
  id: string
  title: string
  description?: string
  type: ActivityType | string
  status?: ActivityStatus | string
  due_date?: string
  completed: boolean
  time?: string
  priority?: 'low' | 'medium' | 'high'
  deal_id?: string
  client_id?: string
  client_name?: string
  assigned_to?: string
  outcome?: string
  created?: string
}
export interface TicketRecord {
  id: string
  code: string
  ticket_number?: string
  subject: string
  description?: string
  status: TicketStatus | string
  priority: string
  channel?: TicketChannel | string
  client_id: string
  client_name?: string
  assigned_to?: string
  timeline?: any[]
  created?: string
  updated?: string
}
