import pb from '@/lib/pocketbase/client'

/**
 * Serviço do modo vendedor: link com token + trava de aparelho.
 * O token vem na URL (?t=...) e fica salvo no aparelho; o device_id identifica
 * o celular autorizado (1 token = 1 aparelho). Nada disso é login.
 */

export const SELLER_TOKEN_KEY = 'intertermal_field_visit_token_v1'
export const SELLER_DEVICE_KEY = 'intertermal_field_visit_device_v1'

function randomDeviceId(): string {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

export function getStoredToken(): string {
  try {
    return localStorage.getItem(SELLER_TOKEN_KEY) || ''
  } catch (_) {
    return ''
  }
}

export function getStoredDeviceId(): string {
  try {
    let id = localStorage.getItem(SELLER_DEVICE_KEY) || ''
    if (!id) {
      id = randomDeviceId()
      localStorage.setItem(SELLER_DEVICE_KEY, id)
    }
    return id
  } catch (_) {
    return 'device-indisponivel'
  }
}

export interface SellerBindResult {
  ok: boolean
  seller_name?: string
  error?: string
}

export const sellerTokenApi = {
  async bind(token: string, deviceId: string): Promise<SellerBindResult> {
    try {
      const res = await pb.send('/backend/v1/field-visits/device/bind', {
        method: 'POST',
        body: JSON.stringify({ token, device_id: deviceId }),
      })
      return res as SellerBindResult
    } catch (err: any) {
      const data = err?.response?.data || err?.data || {}
      return { ok: false, error: data.error || 'network_error' }
    }
  },

  async submitVisit(payload: {
    token: string
    device_id: string
    visit: any
    edit_id?: string
    client_visit_id?: string
  }): Promise<{
    ok: boolean
    visit_id?: string
    seller_name?: string
    edited?: boolean
    error?: string
  }> {
    try {
      const res = await pb.send('/backend/v1/field-visits/submit', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
      return res as any
    } catch (err: any) {
      const data = err?.response?.data || err?.data || {}
      return { ok: false, error: data.error || 'network_error' }
    }
  },

  async myVisits(
    token: string,
    deviceId: string,
  ): Promise<{ ok: boolean; seller_name?: string; visits?: any[]; error?: string }> {
    try {
      const res = await pb.send(
        `/backend/v1/field-visits/mine?token=${encodeURIComponent(token)}&device_id=${encodeURIComponent(deviceId)}`,
        { method: 'GET' },
      )
      return res as any
    } catch (err: any) {
      const data = err?.response?.data || err?.data || {}
      return { ok: false, error: data.error || 'network_error' }
    }
  },

  async getVisit(
    token: string,
    deviceId: string,
    id: string,
  ): Promise<{ ok: boolean; seller_name?: string; visit?: any; error?: string }> {
    try {
      const res = await pb.send(
        `/backend/v1/field-visits/get?id=${encodeURIComponent(id)}&token=${encodeURIComponent(token)}&device_id=${encodeURIComponent(deviceId)}`,
        { method: 'GET' },
      )
      return res as any
    } catch (err: any) {
      const data = err?.response?.data || err?.data || {}
      return { ok: false, error: data.error || 'network_error' }
    }
  },
}
