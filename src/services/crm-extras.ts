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
    status: ServiceOrderRecord['status'],
    notes?: string,
    authorName?: string,
  ): Promise<ServiceOrderRecord> {
    const payload: Partial<ServiceOrderRecord> = { status }
    const now = new Date().toISOString()

    if (status === 'approved' || status === 'in_execution') {
      payload.approved_at = now
      payload.approved_by = authorName || 'Alex Nogueira (Gestor Técnico)'
      if (notes !== undefined) payload.approval_notes = notes
    } else if (status === 'rejected') {
      payload.rejected_at = now
      payload.rejected_by = authorName || 'Alex Nogueira (Gestor Técnico)'
      if (notes !== undefined) payload.rejection_notes = notes
    } else {
      if (notes !== undefined) payload.notes = notes
    }

    return await pb.collection('service_orders').update<ServiceOrderRecord>(id, payload)
  },

  async delete(id: string): Promise<boolean> {
    return await pb.collection('service_orders').delete(id)
  },
}

export const servicesExtraService = servicesService
