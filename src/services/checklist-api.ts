import pb from '@/lib/pocketbase/client'

/**
 * Serviço do Checklist Digital (link com token, sem login).
 * Mesma régua do modo vendedor: 1 token = 1 aparelho; device_id amarrado no 1º uso.
 * Rotas: /backend/v1/checklists/open | save | media/upload | media/delete
 */

export const CHECKLIST_TOKEN_KEY = 'intertermal_checklist_token_v1'
export const CHECKLIST_DEVICE_KEY = 'intertermal_checklist_device_v1'

function randomDeviceId(): string {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

export function getChecklistToken(): string {
  try {
    return localStorage.getItem(CHECKLIST_TOKEN_KEY) || ''
  } catch (_) {
    return ''
  }
}

export function getChecklistDeviceId(): string {
  try {
    let id = localStorage.getItem(CHECKLIST_DEVICE_KEY) || ''
    if (!id) {
      id = randomDeviceId()
      localStorage.setItem(CHECKLIST_DEVICE_KEY, id)
    }
    return id
  } catch (_) {
    return 'device-indisponivel'
  }
}

export interface ChecklistOpenResult {
  ok: boolean
  technician_name?: string
  os_number?: string
  template?: string
  status?: string
  conformity_pct?: number
  verdict?: string
  checklist?: {
    id: string
    ident: Record<string, any>
    answers: Record<string, { status: string | null; obs: string }>
    texts: Record<string, string>
    parts?: Array<{
      id?: string
      description: string
      quantity: number
      unit?: string
      unit_cost?: number | null
    }>
    media: Array<{
      client_media_id: string
      item_numero: number
      etapa: number
      legenda: string
      selecionada: boolean
      ordem: number
      path: string
    }>
    updated?: string
  }
  os?: {
    order_number: string
    title: string
    client_name: string
    client_address: string
    client_city: string
    equipment_brand: string
    equipment_model: string
    assigned_to: string
  }
  error?: string
}

export interface ChecklistSaveResult {
  ok: boolean
  status?: string
  conformity_pct?: number
  verdict?: string
  error?: string
}

export interface ChecklistMediaResult {
  ok: boolean
  media_id?: string
  client_media_id?: string
  file_name?: string
  path?: string
  already_uploaded?: boolean
  error?: string
}

export const checklistApi = {
  async open(token: string, deviceId: string): Promise<ChecklistOpenResult> {
    try {
      const res = await pb.send(
        `/backend/v1/checklists/open?t=${encodeURIComponent(token)}&device_id=${encodeURIComponent(deviceId)}`,
        { method: 'GET' },
      )
      return res as ChecklistOpenResult
    } catch (err: any) {
      const data = err?.response?.data || err?.data || {}
      return { ok: false, error: data.error || 'network_error' }
    }
  },

  async save(payload: {
    token: string
    device_id: string
    action: 'autosave' | 'complete'
    ident?: Record<string, any>
    answers?: Record<string, any>
    texts?: Record<string, any>
    conformity_pct?: number
    verdict?: string
    economia_ano?: number | null
    parts?: Array<{
      id?: string
      description: string
      quantity: number
      unit?: string
      unit_cost?: number | null
    }>
  }): Promise<ChecklistSaveResult> {
    try {
      const res = await pb.send('/backend/v1/checklists/save', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
      return res as ChecklistSaveResult
    } catch (err: any) {
      const data = err?.response?.data || err?.data || {}
      return { ok: false, error: data.error || 'network_error' }
    }
  },

  async uploadMedia(params: {
    client_media_id: string
    kind: string
    original_name: string
    size: number
    item_numero: number
    etapa: number
    legenda: string
    checklist_id: string
    token: string
    device_id: string
    file: Blob
    filename: string
  }): Promise<ChecklistMediaResult> {
    const fd = new FormData()
    fd.set('client_media_id', params.client_media_id)
    fd.set('kind', params.kind)
    fd.set('original_name', params.original_name)
    fd.set('size', String(params.size))
    fd.set('item_numero', String(params.item_numero))
    fd.set('etapa', String(params.etapa))
    fd.set('legenda', params.legenda)
    fd.set('checklist_id', params.checklist_id)
    fd.set('token', params.token)
    fd.set('device_id', params.device_id)
    fd.append('file', params.file, params.filename)

    try {
      const res = (await pb.send('/backend/v1/checklists/media/upload', {
        method: 'POST',
        body: fd,
      })) as any
      return res as ChecklistMediaResult
    } catch (err: any) {
      const data = err?.response?.data || err?.data || {}
      return { ok: false, error: data.error || 'network_error' }
    }
  },

  async deleteMedia(
    clientMediaId: string,
    token: string,
    deviceId: string,
  ): Promise<{ ok: boolean; error?: string }> {
    try {
      const q = new URLSearchParams({
        client_media_id: clientMediaId,
        token,
        device_id: deviceId,
      })
      await pb.send(`/backend/v1/checklists/media/delete?${q.toString()}`, { method: 'DELETE' })
      return { ok: true }
    } catch (err: any) {
      const data = err?.response?.data || err?.data || {}
      return { ok: false, error: data.error || 'network_error' }
    }
  },
}
