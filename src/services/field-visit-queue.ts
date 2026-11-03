import pb from '@/lib/pocketbase/client'
import { getStoredDeviceId } from '@/services/field-visit-token'
import { fieldVisitsService } from '@/services/field-visits'
import { retryAllCachedMedia } from '@/services/field-visit-media'

/**
 * Fila local de "Pendentes de envio" (funciona nos dois modos: interno e vendedor).
 * - Cada item guarda o identificador unico da visita (client_visit_id) gerado no
 *   celular; o reenvio atualiza o mesmo registro no CRM (idempotente, nunca duplica).
 * - No modo vendedor guarda token + device_id e envia pelo hook seguro.
 * - Antes de reenviar, sobe ao servidor toda mídia (foto/vídeo) em cache local.
 * - Reenvio automatico quando a conexao volta (evento online) + botao manual.
 * - NUNCA falha em silencio: retryAll devolve os erros por visita para a tela avisar.
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

export interface QueueRetryResult {
  sent: number
  failed: number
  errors: Array<{ client_visit_id: string; error: string }>
  confirmed: Array<{ client_visit_id: string; visit_id: string }>
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
    // 1. Sobe primeiro toda mídia em cache local e aplica as referências do servidor
    // no payload da visita (quem confirma o recebimento é o servidor, nunca o celular).
    try {
      const mediaRes = await retryAllCachedMedia({
        sellerToken: item.seller_token || undefined,
        deviceId: getStoredDeviceId(),
      })
      if (mediaRes.results.length > 0) {
        const urlById = new Map<string, string>()
        for (const r of mediaRes.results) if (r.ok && r.url) urlById.set(r.id, r.url)
        if (urlById.size > 0) {
          const fix = (atts: any) => {
            for (const a of Array.isArray(atts) ? atts : []) {
              const u = urlById.get(String(a?.id || ''))
              if (u) {
                a.dataUrl = u
                a.uploadStatus = 'enviado'
              }
            }
          }
          fix((item.visit as any)?.visit_attachments)
          const eqList = (item.visit as any)?.equipment
          for (const eq of Array.isArray(eqList) ? eqList : []) fix(eq?.attachments)
        }
      }
    } catch (_) {
      // mídia continua pendente; a visita pode ser confirmada e a mídia reenvia depois
    }

    // 2. Envia a visita
    if (item.seller_token) {
      try {
        const res = await pb.send('/backend/v1/field-visits/submit', {
          method: 'POST',
          body: JSON.stringify({
            token: item.seller_token,
            device_id: getStoredDeviceId(),
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
    }

    // Modo interno (logado): idempotente por client_visit_id no PocketBase
    try {
      let existing: any = null
      try {
        existing = await pb
          .collection('field_visits')
          .getFirstListItem(`client_visit_id = "${item.client_visit_id}"`)
      } catch (_) {
        existing = null
      }
      const rec = existing
        ? await fieldVisitsService.update(existing.id, item.visit)
        : await fieldVisitsService.create({ ...item.visit, client_visit_id: item.client_visit_id })
      return { ok: true, visit_id: (rec as any)?.id }
    } catch (err: any) {
      return { ok: false, error: err?.message || 'network_error' }
    }
  },

  async retryAll(): Promise<QueueRetryResult> {
    const queue = readQueueSafe()
    const result: QueueRetryResult = { sent: 0, failed: 0, errors: [], confirmed: [] }
    const remaining: PendingVisit[] = []
    for (const item of queue) {
      try {
        const res = await pendingQueue.retryOne(item)
        if (res && res.ok) {
          result.sent++
          if (res.visit_id)
            result.confirmed.push({ client_visit_id: item.client_visit_id, visit_id: res.visit_id })
        } else {
          result.failed++
          const error = res?.error || 'erro'
          result.errors.push({ client_visit_id: item.client_visit_id, error })
          item.attempts = (item.attempts || 0) + 1
          item.last_error = error
          remaining.push(item)
        }
      } catch (_) {
        result.failed++
        result.errors.push({ client_visit_id: item.client_visit_id, error: 'network_error' })
        item.attempts = (item.attempts || 0) + 1
        remaining.push(item)
      }
    }
    writeQueueSafe(remaining)
    return result
  },
}
