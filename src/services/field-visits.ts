import pb from '@/lib/pocketbase/client'
import type { EquipmentItem } from '@/types/field-visit'

export interface FieldVisitRecord {
  id: string
  employee_name: string
  visit_date?: string
  start_time?: string
  end_time?: string
  duration?: string
  client_name?: string
  company_name?: string
  contact_person?: string
  client_role?: string
  client_contact?: string
  work_area?: string
  work_type?: string
  work_type_other?: string
  general_notes?: string
  equipment?: EquipmentItem[]
  status?: string
  sent_at?: string
  created?: string
  updated?: string
}

export const fieldVisitsService = {
  async getAll(): Promise<FieldVisitRecord[]> {
    return await pb.collection('field_visits').getFullList<FieldVisitRecord>({
      sort: '-created',
    })
  },

  async getById(id: string): Promise<FieldVisitRecord> {
    return await pb.collection('field_visits').getOne<FieldVisitRecord>(id)
  },

  async create(data: Partial<FieldVisitRecord>): Promise<FieldVisitRecord> {
    return await pb.collection('field_visits').create<FieldVisitRecord>(data)
  },

  async update(id: string, data: Partial<FieldVisitRecord>): Promise<FieldVisitRecord> {
    return await pb.collection('field_visits').update<FieldVisitRecord>(id, data)
  },

  async delete(id: string): Promise<boolean> {
    return await pb.collection('field_visits').delete(id)
  },
}
