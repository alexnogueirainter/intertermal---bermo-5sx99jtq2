import pb from '@/lib/pocketbase/client'
import type { ActivityRecord } from '@/types/crm'

export interface QuickContactInput {
  name: string
  company: string
  phone: string
  dueDate: string // YYYY-MM-DD
}

export const quickContactService = {
  /** Cria a atividade "Retornar contato" às 9h da data escolhida (padrão: amanhã). */
  async create(input: QuickContactInput): Promise<ActivityRecord> {
    return await pb.collection('activities').create<ActivityRecord>({
      title: input.name,
      client_name: input.company || input.name,
      type: 'follow_up',
      due_date: `${input.dueDate}T09:00:00.000-03:00`,
      time: '09:00',
      priority: 'medium',
      status: 'pending',
      description: input.phone,
      assigned_to: 'Alex Nogueira',
      quick_contact: '1',
      contact_phone: input.phone,
    })
  },

  async updateDate(id: string, dueDateIso: string): Promise<ActivityRecord> {
    return await pb.collection('activities').update<ActivityRecord>(id, { due_date: dueDateIso })
  },

  /** Descarta: sai da lista "Contatos a retornar" (status cancelled). */
  async discard(id: string): Promise<void> {
    await pb.collection('activities').update<ActivityRecord>(id, { status: 'cancelled' })
  },

  /** Converte no backend: cria cliente (se não existir) + negócio na Prospecção. */
  async convert(id: string): Promise<{
    ok: boolean
    client_id: string
    deal_id: string
    created_client: boolean
    created_deal: boolean
  }> {
    return await pb.send('/backend/v1/quick-contact/convert', {
      method: 'POST',
      body: { activity_id: id },
      requestKey: null,
    })
  },
}
