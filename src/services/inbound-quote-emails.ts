import pb from '@/lib/pocketbase/client'
import {
  InboundQuoteEmailRecord,
  ProcessInboundEmailPayload,
  ProcessInboundEmailResponse,
} from '@/types/crm'

export const INBOUND_QUOTE_DEFAULT_SECRET = 'intertermal-inbound-secret-2026'

export const inboundQuoteEmailsService = {
  /**
   * Lista todos os e-mails de cotação recebidos
   */
  async getInboundEmails(): Promise<InboundQuoteEmailRecord[]> {
    try {
      const records = await pb.collection('inbound_quote_emails').getFullList({
        sort: '-created',
        expand: 'quote_id,client_id',
      })
      return records as unknown as InboundQuoteEmailRecord[]
    } catch (err) {
      console.error('Erro ao buscar e-mails de cotação:', err)
      return []
    }
  },

  /**
   * Atualiza o status do e-mail de cotação (ex: quando revisado pelo usuário)
   */
  async updateStatus(
    id: string,
    status: 'recebido' | 'rascunho_criado' | 'revisado' | 'erro',
  ): Promise<boolean> {
    try {
      await pb.collection('inbound_quote_emails').update(id, { status })
      return true
    } catch (err) {
      console.error(`Erro ao atualizar status do e-mail de cotação #${id}:`, err)
      return false
    }
  },

  /**
   * Envia o texto/payload de um e-mail encaminhado para a rota backend pb_hooks
   * para extração de IA e geração automática do rascunho.
   */
  async processInboundEmail(
    payload: ProcessInboundEmailPayload,
  ): Promise<ProcessInboundEmailResponse> {
    try {
      const res = await pb.send('/backend/v1/quotes/inbound-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Inbound-Token': INBOUND_QUOTE_DEFAULT_SECRET,
        },
        body: JSON.stringify(payload),
      })
      return res as ProcessInboundEmailResponse
    } catch (err: any) {
      console.error('Erro ao processar e-mail de cotação via backend:', err)
      return {
        success: false,
        message: err?.message || 'Falha na comunicação com o serviço de extração de e-mails.',
        error: err?.message || 'Erro de conexão',
      }
    }
  },
}
