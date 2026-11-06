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
  client_email?: string
  work_area?: string
  work_type?: string
  work_type_other?: string
  general_notes?: string
  free_description?: string
  action_plan?: any
  equipment?: EquipmentItem[]
  visit_attachments?: any
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

  /**
   * Lista LEVE para dashboards/contagens: exclui o JSON `equipment` (fotos em
   * base64 podem somar dezenas de MB e atrasar todo o carregamento do app).
   * O registro completo continua disponível com getById(id) quando precisar
   * abrir/editar a visita.
   */
  async getLightweight(): Promise<FieldVisitRecord[]> {
    return await pb.collection('field_visits').getFullList<FieldVisitRecord>({
      sort: '-created',
      fields:
        'id,employee_name,seller_name,visit_date,start_time,end_time,duration,client_name,company_name,contact_person,client_role,client_contact,client_email,work_area,work_type,work_type_other,general_notes,free_description,action_plan,visit_attachments,status,sent_at,created,updated',
    })
  },

  async getRecentSummary(limit = 100): Promise<FieldVisitRecord[]> {
    return await pb.collection('field_visits').getFullList<FieldVisitRecord>({
      sort: '-created',
      requestKey: null,
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
