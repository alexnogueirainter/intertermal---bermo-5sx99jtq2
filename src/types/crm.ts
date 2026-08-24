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

export interface QuoteItem {
  product_id?: string
  name: string
  quantity: number
  unit_price: number
  discount: number
  total: number
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
