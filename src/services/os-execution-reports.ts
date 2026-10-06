import pb from '@/lib/pocketbase/client'
import type { OsExecutionReportRecord } from '@/types/crm'

/**
 * Monta a URL completa do arquivo no PocketBase
 */
export function getReportPhotoUrl(
  recordOrId: OsExecutionReportRecord | { id: string },
  fileName: string,
  thumb?: string,
): string {
  if (!fileName) return ''
  // Se já for uma URL completa ou base64 ou blob
  if (
    fileName.startsWith('http://') ||
    fileName.startsWith('https://') ||
    fileName.startsWith('data:') ||
    fileName.startsWith('blob:')
  ) {
    return fileName
  }

  const recordId = typeof recordOrId === 'string' ? recordOrId : recordOrId.id
  if (!recordId) return ''

  try {
    if (typeof pb.files?.getURL === 'function') {
      return pb.files.getURL(recordOrId as any, fileName, { thumb })
    }
  } catch {
    // Fallback para URL padrão do PocketBase
  }

  const thumbParam = thumb ? `?thumb=${encodeURIComponent(thumb)}` : ''
  return `${pb.baseUrl}/api/files/os_execution_reports/${recordId}/${fileName}${thumbParam}`
}

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

  async create(
    data: Partial<OsExecutionReportRecord> | FormData,
  ): Promise<OsExecutionReportRecord> {
    return await pb.collection('os_execution_reports').create<OsExecutionReportRecord>(data)
  },

  async update(
    id: string,
    data: Partial<OsExecutionReportRecord> | FormData,
  ): Promise<OsExecutionReportRecord> {
    return await pb.collection('os_execution_reports').update<OsExecutionReportRecord>(id, data)
  },

  async delete(id: string): Promise<boolean> {
    return await pb.collection('os_execution_reports').delete(id)
  },

  /**
   * Helper para construir a URL pública de uma foto salva
   */
  getPhotoUrl(record: OsExecutionReportRecord, fileName: string, thumb?: string): string {
    return getReportPhotoUrl(record, fileName, thumb)
  },
}
