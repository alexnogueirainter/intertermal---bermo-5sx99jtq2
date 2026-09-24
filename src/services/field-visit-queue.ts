import pb from '@/lib/pocketbase/client'
import { getStoredToken, getStoredDeviceId } from '@/services/field-visit-token'

/**
 * Fila local de "Pendentes de envio" (funciona nos dois modos: interno e vendedor).
 * - Cada item guarda o identificador unico da visita (client_visit_id) gerado no
 *   celular; o reenvio atualiza o mesmo registro no CRM (idempotente, nunca duplica).
 * - No modo vendedor guarda token + device_id e envia pelo hook seguro.
 * - Reenvio automatico quando a conexao volta (evento online) + botao manual.
 */

const QUEUE_KEY = 'intertermal_field_visit_pending_v1'

export interface PendingVisit {
  client_visit_id: string
  visit: any
  edit_id?: string
  seller_token?: string
  saved_at: string
  attempts: number
  last_error?: string
}

function readQueueSafe(): PendingVisit[] {
  try {
    const raw = localStorage.getItem(QUEUE_KEY)
    return raw ? (JSON.parse(raw) as PendingVisit[]) : []
  } catch (_) {
    return []
  }
}

function writeQueueSafe(queue: PendingVisit[]) {
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue))
  } catch (_) {
    // cota cheia: nao perde a fila em memoria; o chamador mostra aviso
  }
}

export const pendingQueue = {
  list(): PendingVisit[] {
    return readQueueSafe()
  },

  count(): number {
    return readQueueSafe().length
  },

  add(item: Omit<PendingVisit, 'saved_at' | 'attempts'>) {
    // nunca duplicar o mesmo client_visit_id na fila
    const filtered = readQueueSafe().filter((q) => q.client_visit_id !== item.client_visit_id)
    filtered.push({
      ...item,
      saved_at: new Date().toISOString(),
      attempts: 0,
    })
    writeQueueSafe(filtered)
  },

  remove(clientVisitId: string) {
    writeQueueSafe(readQueueSafe().filter((q) => q.client_visit_id !== clientVisitId))
  },

  async retryOne(item: PendingVisit): Promise<{ ok: boolean; visit_id?: string; error?: string }> {
    const token = item.seller_token || getStoredToken()
    const deviceId = getStoredDeviceId()
    try {
      const res = await pb.send('/backend/v1/field-visits/submit', {
        method: 'POST',
        body: JSON.stringify({
          token,
          device_id: deviceId,
          visit: item.visit,
          edit_id: item.edit_id,
          client_visit_id: item.client_visit_id,
        }),
      })
      return res as any
    } catch (err: any) {
      const data = err?.response?.data || err?.data || {}
      return { ok: false, error: data.error || 'network_error' }
    }
  },

  async retryAll(): Promise<{ sent: number; failed: number }> {
    const queue = readQueueSafe()
    let sent = 0
    let failed = 0
    const remaining: PendingVisit[] = []
    for (const item of queue) {
      try {
        const res = await pendingQueue.retryOne(item)
        if (res && res.ok) {
          sent++
        } else {
          failed++
          item.attempts = (item.attempts || 0) + 1
          item.last_error = res?.error || 'erro'
          remaining.push(item)
        }
      } catch (_) {
        failed++
        item.attempts = (item.attempts || 0) + 1
        remaining.push(item)
      }
    }
    writeQueueSafe(remaining)
    return { sent, failed }
  },
}
