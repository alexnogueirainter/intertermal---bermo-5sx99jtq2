import pb from '@/lib/pocketbase/client'
import {
  InboundQuoteEmailRecord,
  InboundQuoteAttachmentRecord,
  ProcessInboundEmailPayload,
  ProcessInboundEmailResponse,
} from '@/types/crm'

export const INBOUND_QUOTE_DEFAULT_SECRET = 'intertermal-inbound-secret-2026'

/**
 * Retorna a URL pública para download ou visualização de um anexo salvo
 */
export function getInboundAttachmentUrl(
  record: InboundQuoteAttachmentRecord | { id: string; file: string },
): string {
  if (!record || !record.file) return ''
  return `${pb.baseUrl}/api/files/inbound_quote_attachments/${record.id}/${record.file}`
}

export const inboundQuoteEmailsService = {
  /**
   * Lista todos os e-mails de cotação recebidos com seus anexos
   */
  async getInboundEmails(): Promise<InboundQuoteEmailRecord[]> {
    try {
      const records = await pb.collection('inbound_quote_emails').getFullList({
        sort: '-created',
        expand: 'quote_id,client_id',
      })

      // Buscar todos os anexos para enriquecer a lista
      let allAttachments: InboundQuoteAttachmentRecord[] = []
      try {
        allAttachments = (await pb.collection('inbound_quote_attachments').getFullList({
          sort: '-created',
        })) as unknown as InboundQuoteAttachmentRecord[]
      } catch (attErr) {
        console.warn('Erro ao carregar anexos de cotações:', attErr)
      }

      // Mapear anexos por inbound_email_id
      const attMap = new Map<string, InboundQuoteAttachmentRecord[]>()
      for (const att of allAttachments) {
        if (!att.inbound_email_id) continue
        const existing = attMap.get(att.inbound_email_id) || []
        existing.push(att)
        attMap.set(att.inbound_email_id, existing)
      }

      return records.map((r) => {
        const item = r as unknown as InboundQuoteEmailRecord
        const atts = attMap.get(item.id) || []
        return {
          ...item,
          attachments: atts,
          attachments_count: atts.length,
        }
      })
    } catch (err) {
      console.error('Erro ao buscar e-mails de cotação:', err)
      return []
    }
  },

  /**
   * Busca anexos vinculados a uma quote específica (pelo quote_id)
   */
  async getAttachmentsByQuoteId(quoteId: string): Promise<InboundQuoteAttachmentRecord[]> {
    if (!quoteId) return []
    try {
      const records = await pb.collection('inbound_quote_attachments').getFullList({
        filter: `quote_id = "${quoteId}"`,
        sort: '-created',
      })
      return records as unknown as InboundQuoteAttachmentRecord[]
    } catch (err) {
      console.error(`Erro ao buscar anexos para proposta #${quoteId}:`, err)
      return []
    }
  },

  /**
   * Busca anexos vinculados a um inbound_email específico
   */
  async getAttachmentsByEmailId(emailId: string): Promise<InboundQuoteAttachmentRecord[]> {
    if (!emailId) return []
    try {
      const records = await pb.collection('inbound_quote_attachments').getFullList({
        filter: `inbound_email_id = "${emailId}"`,
        sort: '-created',
      })
      return records as unknown as InboundQuoteAttachmentRecord[]
    } catch (err) {
      console.error(`Erro ao buscar anexos para e-mail #${emailId}:`, err)
      return []
    }
  },

  /**
   * Salva arquivos diretamente como anexos vinculados a um e-mail de cotação e/ou proposta
   */
  async uploadAttachment(
    emailId: string,
    file: File,
    quoteId?: string | null,
  ): Promise<InboundQuoteAttachmentRecord | null> {
    try {
      const formData = new FormData()
      formData.append('inbound_email_id', emailId)
      formData.append('file', file)
      formData.append('file_name', file.name)
      formData.append('file_type', file.type || 'application/octet-stream')
      formData.append('file_size', String(file.size))
      if (quoteId) {
        formData.append('quote_id', quoteId)
      }

      const record = await pb.collection('inbound_quote_attachments').create(formData)
      return record as unknown as InboundQuoteAttachmentRecord
    } catch (err) {
      console.error(`Erro ao fazer upload do anexo ${file.name}:`, err)
      return null
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
   * Suporta envio de arquivos (multipart/form-data) ou JSON.
   */
  async processInboundEmail(
    payload: ProcessInboundEmailPayload,
  ): Promise<ProcessInboundEmailResponse> {
    try {
      const files = payload.files || []

      // Se houver arquivos anexados, enviar como multipart/form-data
      if (files.length > 0) {
        const formData = new FormData()
        formData.append('subject', payload.subject)
        formData.append('body', payload.body)
        if (payload.sender) formData.append('sender', payload.sender)
        if (payload.original_sender) formData.append('original_sender', payload.original_sender)
        if (payload.recipient) formData.append('recipient', payload.recipient)

        files.forEach((file) => {
          formData.append('attachments', file)
          formData.append('files', file)
        })

        const res = (await pb.send('/backend/v1/quotes/inbound-email', {
          method: 'POST',
          headers: {
            'X-Inbound-Token': INBOUND_QUOTE_DEFAULT_SECRET,
          },
          body: formData,
        })) as ProcessInboundEmailResponse

        // Se o backend criou o registro mas a rota não gravou os arquivos diretamente via FormData,
        // garantimos o salvamento resiliente de cada anexo via SDK
        if (
          res.success &&
          res.inbound_email_id &&
          (!res.attachments_count || res.attachments_count < files.length)
        ) {
          let savedCount = res.attachments_count || 0
          for (const file of files) {
            try {
              const att = await inboundQuoteEmailsService.uploadAttachment(
                res.inbound_email_id,
                file,
                res.quote_id,
              )
              if (att) savedCount++
            } catch (attErr) {
              console.warn(`Falha ao salvar anexo de fallback ${file.name}:`, attErr)
            }
          }
          res.attachments_count = savedCount
        }

        return res
      }

      // Envio tradicional em JSON se não houver arquivos
      const res = (await pb.send('/backend/v1/quotes/inbound-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Inbound-Token': INBOUND_QUOTE_DEFAULT_SECRET,
        },
        body: JSON.stringify(payload),
      })) as ProcessInboundEmailResponse

      return res
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
