import pb from '@/lib/pocketbase/client'
import type { ClientRecord } from '@/types/crm'

export const clientsService = {
  async getAll(): Promise<ClientRecord[]> {
    return await pb.collection('clients').getFullList<ClientRecord>({
      sort: '-created',
    })
  },

  async getById(id: string): Promise<ClientRecord> {
    return await pb.collection('clients').getOne<ClientRecord>(id)
  },

  async create(data: Partial<ClientRecord>): Promise<ClientRecord> {
    return await pb.collection('clients').create<ClientRecord>(data)
  },

  async update(id: string, data: Partial<ClientRecord>): Promise<ClientRecord> {
    return await pb.collection('clients').update<ClientRecord>(id, data)
  },

  async delete(id: string): Promise<boolean> {
    return await pb.collection('clients').delete(id)
  },
}
