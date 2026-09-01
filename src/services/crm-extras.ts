import pb from '@/lib/pocketbase/client'
import type {
  TicketRecord,
  ServiceRecord,
  ServiceOrderRecord,
  ActivityRecord,
  ProductRecord,
} from '@/types/crm'

export const ticketsService = {
  async getAll(): Promise<TicketRecord[]> {
    return await pb.collection('tickets').getFullList<TicketRecord>({
      sort: '-created',
    })
  },

  async create(data: Partial<TicketRecord>): Promise<TicketRecord> {
    return await pb.collection('tickets').create<TicketRecord>(data)
  },

  async update(id: string, data: Partial<TicketRecord>): Promise<TicketRecord> {
    return await pb.collection('tickets').update<TicketRecord>(id, data)
  },

  async delete(id: string): Promise<boolean> {
    return await pb.collection('tickets').delete(id)
  },
}

export const servicesService = {
  async getAll(): Promise<ServiceRecord[]> {
    return await pb.collection('services').getFullList<ServiceRecord>({
      sort: '-created',
    })
  },

  async create(data: Partial<ServiceRecord>): Promise<ServiceRecord> {
    return await pb.collection('services').create<ServiceRecord>(data)
  },

  async update(id: string, data: Partial<ServiceRecord>): Promise<ServiceRecord> {
    return await pb.collection('services').update<ServiceRecord>(id, data)
  },

  async delete(id: string): Promise<boolean> {
    return await pb.collection('services').delete(id)
  },
}

export const activitiesService = {
  async getAll(): Promise<ActivityRecord[]> {
    return await pb.collection('activities').getFullList<ActivityRecord>({
      sort: 'due_date',
    })
  },

  async create(data: Partial<ActivityRecord>): Promise<ActivityRecord> {
    return await pb.collection('activities').create<ActivityRecord>(data)
  },

  async update(id: string, data: Partial<ActivityRecord>): Promise<ActivityRecord> {
    return await pb.collection('activities').update<ActivityRecord>(id, data)
  },

  async delete(id: string): Promise<boolean> {
    return await pb.collection('activities').delete(id)
  },
}

export const productsService = {
  async getAll(): Promise<ProductRecord[]> {
    return await pb.collection('products').getFullList<ProductRecord>({
      sort: 'name',
    })
  },

  async create(data: Partial<ProductRecord>): Promise<ProductRecord> {
    return await pb.collection('products').create<ProductRecord>(data)
  },

  async update(id: string, data: Partial<ProductRecord>): Promise<ProductRecord> {
    return await pb.collection('products').update<ProductRecord>(id, data)
  },

  async delete(id: string): Promise<boolean> {
    return await pb.collection('products').delete(id)
  },
}

export const serviceOrdersService = {
  async getAll(): Promise<ServiceOrderRecord[]> {
    return await pb.collection('service_orders').getFullList<ServiceOrderRecord>({
      sort: '-created',
    })
  },

  async getById(id: string): Promise<ServiceOrderRecord> {
    return await pb.collection('service_orders').getOne<ServiceOrderRecord>(id)
  },

  async create(data: Partial<ServiceOrderRecord>): Promise<ServiceOrderRecord> {
    return await pb.collection('service_orders').create<ServiceOrderRecord>(data)
  },

  async update(id: string, data: Partial<ServiceOrderRecord>): Promise<ServiceOrderRecord> {
    return await pb.collection('service_orders').update<ServiceOrderRecord>(id, data)
  },

  async updateStatus(
    id: string,
    newStatus: ServiceOrderRecord['status'],
    notes?: string,
    authorName?: string,
    currentHistory?: any[],
  ): Promise<ServiceOrderRecord> {
    const now = new Date().toISOString()
    const author = authorName || 'Alex Nogueira (Gestor Técnico)'

    // Obter dados atuais se não tiver histórico passado
    let currentSo: ServiceOrderRecord | null = null
    let historyList: any[] = Array.isArray(currentHistory) ? [...currentHistory] : []

    if (!currentHistory) {
      try {
        currentSo = await pb.collection('service_orders').getOne<ServiceOrderRecord>(id)
        if (currentSo?.status_history && Array.isArray(currentSo.status_history)) {
          historyList = [...currentSo.status_history]
        }
      } catch {
        /* intentionally ignored */
      }
    }

    const previousStatus = currentSo?.status || 'desconhecido'
    const newHistoryEntry = {
      from_status: previousStatus,
      to_status: newStatus,
      date: now,
      user_name: author,
      note: notes || `Transição de status para ${newStatus}`,
    }
    historyList.push(newHistoryEntry)

    const payload: Partial<ServiceOrderRecord> = {
      status: newStatus,
      status_history: historyList,
    }

    if (newStatus === 'approved' || newStatus === 'execucao' || newStatus === 'in_execution') {
      payload.approved_at = now
      payload.approved_by = author
      if (notes !== undefined) payload.approval_notes = notes
    } else if (newStatus === 'rejected') {
      payload.rejected_at = now
      payload.rejected_by = author
      if (notes !== undefined) payload.rejection_notes = notes
    } else if (notes !== undefined) {
      payload.notes = notes
    }

    return await pb.collection('service_orders').update<ServiceOrderRecord>(id, payload)
  },

  async createFromApprovedQuote(quote: any): Promise<ServiceOrderRecord> {
    const orderNumber = quote.code || quote.quote_number || `OS-${Date.now().toString().slice(-6)}`
    const nowIso = new Date().toISOString()
    const equipModel = quote.equipment_model || 'Trocador BERMO'
    const equipBrand = quote.equipment_brand || 'BERMO'

    // Evitar duplicidade
    try {
      const existing = await pb.collection('service_orders').getFullList<ServiceOrderRecord>({
        filter: `quote_id = "${quote.id}" || order_number = "${orderNumber}" || quote_number = "${orderNumber}"`,
      })
      if (existing.length > 0) {
        return existing[0]
      }
    } catch {
      /* intentionally ignored */
    }

    const record = await pb.collection('service_orders').create<ServiceOrderRecord>({
      order_number: orderNumber,
      quote_id: quote.id,
      quote_number: quote.quote_number || quote.code || '',
      client_id: quote.client_id || '',
      client_name: quote.client_name || 'Cliente',
      title: `OS ${orderNumber} - ${quote.title || 'Manutenção de Trocador de Calor BERMO'}`,
      status: 'vistoria',
      priority: 'high',
      assigned_to: quote.assigned_to || 'Alex Nogueira - Especialista BERMO',
      total_value: quote.final_price || quote.total || 0,
      services: quote.items || [],
      technical_details: quote.service_details || {},
      equipment_model: equipModel,
      equipment_brand: equipBrand,
      equipment_info: {
        brand: equipBrand,
        model: equipModel,
        equipments: quote.equipments || [],
        details: quote.service_details || {},
      },
      status_history: [
        {
          from_status: 'proposta',
          to_status: 'vistoria',
          date: nowIso,
          user_name: quote.approved_by_client_name || quote.assigned_to || 'Sistema Intertermal',
          note: 'OS gerada automaticamente a partir da proposta aprovada.',
        },
      ],
      notes: `Ordem de Serviço gerada a partir da proposta técnica aprovada #${orderNumber}.`,
    })
    return record
  },

  async delete(id: string): Promise<boolean> {
    return await pb.collection('service_orders').delete(id)
  },
}

export const servicesExtraService = servicesService
