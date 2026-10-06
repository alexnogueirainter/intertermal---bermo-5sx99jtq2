import pb from '@/lib/pocketbase/client'
import type { OsExecutionReportRecord } from '@/types/crm'

export const osExecutionReportsService = {
  async getAll(): Promise<OsExecutionReportRecord[]> {
    return await pb.collection('os_execution_reports').getFullList<OsExecutionReportRecord>({
      sort: '-created',
    })
  },

  async getById(id: string): Promise<OsExecutionReportRecord> {
    return await pb.collection('os_execution_reports').getOne<OsExecutionReportRecord>(id)
  },

  async getByServiceOrderId(serviceOrderId: string): Promise<OsExecutionReportRecord[]> {
    if (!serviceOrderId) return []
    try {
      return await pb.collection('os_execution_reports').getFullList<OsExecutionReportRecord>({
        filter: `service_order_id = "${serviceOrderId}"`,
        sort: '-created',
      })
    } catch (err) {
      console.warn('Erro ao buscar relatórios de execução por OS ID:', err)
      return []
    }
  },

  async getLatestByOrderNumber(orderNumber: string): Promise<OsExecutionReportRecord | null> {
    if (!orderNumber) return null
    try {
      const records = await pb
        .collection('os_execution_reports')
        .getFullList<OsExecutionReportRecord>({
          filter: `order_number = "${orderNumber}"`,
          sort: '-created',
          batch: 1,
        })
      return records[0] || null
    } catch {
      return null
    }
  },

  async create(data: Partial<OsExecutionReportRecord>): Promise<OsExecutionReportRecord> {
    return await pb.collection('os_execution_reports').create<OsExecutionReportRecord>(data)
  },

  async update(
    id: string,
    data: Partial<OsExecutionReportRecord>,
  ): Promise<OsExecutionReportRecord> {
    return await pb.collection('os_execution_reports').update<OsExecutionReportRecord>(id, data)
  },

  async delete(id: string): Promise<boolean> {
    return await pb.collection('os_execution_reports').delete(id)
  },
}
