import pb from '@/lib/pocketbase/client'
import type { DealRecord } from '@/types/crm'

export const dealsService = {
  async getAll(): Promise<DealRecord[]> {
    return await pb.collection('deals').getFullList<DealRecord>({
      sort: '-created',
    })
  },

  async getById(id: string): Promise<DealRecord> {
    return await pb.collection('deals').getOne<DealRecord>(id)
  },

  async create(data: Partial<DealRecord>): Promise<DealRecord> {
    return await pb.collection('deals').create<DealRecord>(data)
  },

  async update(id: string, data: Partial<DealRecord>): Promise<DealRecord> {
    return await pb.collection('deals').update<DealRecord>(id, data)
  },

  async updateStage(id: string, stage: DealRecord['stage']): Promise<DealRecord> {
    return await pb.collection('deals').update<DealRecord>(id, { stage })
  },

  async delete(id: string): Promise<boolean> {
    return await pb.collection('deals').delete(id)
  },
}
