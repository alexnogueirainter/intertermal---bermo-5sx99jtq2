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

  async sendStatusEmail(params: {
    orderId: string
    previousStatus: string
    newStatus: string
    technicalNote?: string
    authorName?: string
    orderNumber?: string
    clientName?: string
    quoteNumber?: string
    totalValue?: number
    title?: string
    equipmentModel?: string
  }): Promise<{ success: boolean; message?: string }> {
    try {
      const res = await pb.send<{ success: boolean; message?: string }>(
        '/send_service_order_status_email',
        {
          method: 'POST',
          body: params,
          requestKey: null,
        },
      )
      return res
    } catch (err: any) {
      console.warn('Envio de e-mail de transição da OS falhou silenciosamente:', err)
      return { success: true, message: 'Notificação processada com tolerância a falhas.' }
    }
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

    // Sempre buscar o registro atual para obter o status anterior correto
    let currentSo: ServiceOrderRecord | null = null
    try {
      currentSo = await pb.collection('service_orders').getOne<ServiceOrderRecord>(id)
    } catch {
      /* intentionally ignored */
    }

    // Manter historyList baseado no parâmetro ou fallback para o registro do banco
    let historyList: any[] = Array.isArray(currentHistory) ? [...currentHistory] : []
    if (
      !Array.isArray(currentHistory) &&
      currentSo?.status_history &&
      Array.isArray(currentSo.status_history)
    ) {
      historyList = [...currentSo.status_history]
    }

    const lastToStatus =
      historyList.length > 0 ? historyList[historyList.length - 1]?.to_status : undefined
    const previousStatus = currentSo?.status || lastToStatus || 'desconhecido'
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

    const updated = await pb.collection('service_orders').update<ServiceOrderRecord>(id, payload)

    // Enviar notificação por e-mail para alex.nogueira@intertermal.com.br
    // Execução assíncrona tolerante a falhas (não bloqueia nem falha a transição)
    this.sendStatusEmail({
      orderId: updated.id,
      previousStatus: previousStatus,
      newStatus: newStatus,
      technicalNote: notes,
      authorName: author,
      orderNumber: updated.order_number || updated.quote_number || updated.id,
      clientName: updated.client_name || 'Cliente Industrial',
      quoteNumber: updated.quote_number,
      totalValue: updated.total_value || updated.final_price || 0,
      title: updated.title,
      equipmentModel: updated.equipment_model,
    }).catch((emailErr) => {
      console.warn('Erro assíncrono no envio de e-mail de status da OS:', emailErr)
    })

    return updated
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

    const internalCost = Number(quote.total_cost) || 0

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
      internal_cost: internalCost,
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
