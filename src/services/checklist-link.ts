import pb from '@/lib/pocketbase/client'
import type { ServiceOrderRecord } from '@/types/crm'

/**
 * Serviço do botão "Checklist" no card da OS (kanban).
 * - Gera o checklist + token (rota autenticada, idempotente).
 * - Devolve o link do técnico e a mensagem pronta de WhatsApp
 *   (com o passo a passo de abrir no Chrome/Safari — regra permanente do Alex).
 */

export interface ChecklistLinkResult {
  ok: boolean
  token?: string
  checklist_id?: string
  os_number?: string
  template?: string
  already?: boolean
  created_count?: number
  total_checklists?: number
  items?: Array<{ tag: string; label: string; template: string }>
  error?: string
}

function waMessage(
  technician: string,
  osNumber: string,
  equipamento: string,
  cliente: string,
  link: string,
): string {
  const nome = (technician || '').trim().split(/\s+/)[0] || 'bom dia'
  return (
    `${nome}, bom dia.\n\n` +
    `Segue o checklist da OS ${osNumber}` +
    (equipamento ? ` (${equipamento})` : '') +
    (cliente ? ` — ${cliente}` : '') +
    `:\n\n${link}\n\n` +
    `Como abrir (importante):\n` +
    `• Copie o link acima e cole no Chrome (Android) ou Safari (iPhone) — não abra dentro do WhatsApp, o navegador do WhatsApp bloqueia a câmera.\n` +
    `• Na 1ª vez, permita o acesso à câmera quando o celular pedir.\n` +
    `• As fotos saem com a marca d'água da OS automaticamente.\n` +
    `• Ao terminar, toque em "Enviar ao escritório".\n\n` +
    `Qualquer dúvida, me chama.\nAbs.`
  )
}

export const checklistLinkService = {
  async generate(
    os: ServiceOrderRecord,
    items?: Array<{ tag: string; label: string; template: string }>,
  ): Promise<ChecklistLinkResult> {
    try {
      const res = (await pb.send('/backend/v1/checklists/generate', {
        method: 'POST',
        body: JSON.stringify({ os_id: os.id, ...(items && items.length ? { items } : {}) }),
      })) as ChecklistLinkResult
      return res
    } catch (err: any) {
      const data = err?.response?.data || err?.data || {}
      return { ok: false, error: data.error || 'network_error' }
    }
  },

  link(token: string): string {
    const base =
      typeof window !== 'undefined' ? window.location.origin : 'https://crm.intertermal.com.br'
    return base + '/checklist?t=' + encodeURIComponent(token)
  },

  /** Libera o aparelho amarrado ao token (técnico trocou de celular ou link foi
   *  aberto por engano num computador antes de ir pro campo). */
  async unbindDevice(token: string): Promise<{ ok: boolean; error?: string }> {
    try {
      await pb.send('/backend/v1/checklists/unbind', {
        method: 'POST',
        body: JSON.stringify({ token }),
      })
      return { ok: true }
    } catch (err: any) {
      const data = err?.response?.data || err?.data || {}
      return { ok: false, error: data.error || 'network_error' }
    }
  },

  message(os: ServiceOrderRecord, token: string, technician?: string): string {
    const equip =
      [os.equipment_brand, os.equipment_model].filter(Boolean).join(' ') || 'equipamento'
    return waMessage(
      technician || String(os.assigned_to || ''),
      String(os.order_number || ''),
      equip,
      String(os.client_name || ''),
      this.link(token),
    )
  },
}
