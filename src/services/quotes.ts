import pb from '@/lib/pocketbase/client'
import type { QuoteRecord, ProductRecord } from '@/types/crm'

export const quotesService = {
  async getAll(): Promise<QuoteRecord[]> {
    return await pb.collection('quotes').getFullList<QuoteRecord>({
      sort: '-created',
    })
  },

  async getById(id: string): Promise<QuoteRecord> {
    return await pb.collection('quotes').getOne<QuoteRecord>(id)
  },

  async create(data: Partial<QuoteRecord>): Promise<QuoteRecord> {
    return await pb.collection('quotes').create<QuoteRecord>(data)
  },

  async update(id: string, data: Partial<QuoteRecord>): Promise<QuoteRecord> {
    return await pb.collection('quotes').update<QuoteRecord>(id, data)
  },

  async updateStatus(id: string, status: QuoteRecord['status']): Promise<QuoteRecord> {
    return await pb.collection('quotes').update<QuoteRecord>(id, { status })
  },

  async delete(id: string): Promise<boolean> {
    return await pb.collection('quotes').delete(id)
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
