import pb from '@/lib/pocketbase/client'
import type { TicketRecord, ServiceRecord, ActivityRecord } from '@/types/crm'

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
