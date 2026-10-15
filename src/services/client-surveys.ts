import pb from '@/lib/pocketbase/client'
import type { ClientSurveyRecord } from '@/types/crm'

export interface SendSurveyPayload {
  clientId: string
  contactId?: string
  contactName: string
  contactEmail: string
  contactRole?: string
  contactPhone?: string
  sentBy?: string
  sentByEmail?: string
  customMessage?: string
}

export interface SendSurveyResponse {
  success: boolean
  message: string
  recipient?: string
  contactName?: string
  clientName?: string
  surveyUrl?: string
  surveyId?: string
  sentAt?: string
  error?: string
}

export const clientSurveysService = {
  /**
   * Dispara a pesquisa de satisfação via backend hook (POST /send_client_survey)
   */
  async sendSurvey(payload: SendSurveyPayload): Promise<SendSurveyResponse> {
    const response = await pb.send<SendSurveyResponse>('/send_client_survey', {
      method: 'POST',
      body: payload,
    })
    return response
  },

  /**
   * Lista todas as pesquisas já disparadas para um determinado cliente
   */
  async getByClientId(clientId: string): Promise<ClientSurveyRecord[]> {
    try {
      return await pb.collection('client_surveys').getFullList<ClientSurveyRecord>({
        filter: `client_id = "${clientId}"`,
        sort: '-created',
      })
    } catch (err) {
      console.warn('Erro ao carregar histórico de pesquisas do cliente:', err)
      return []
    }
  },

  /**
   * Lista todas as pesquisas disparadas no sistema
   */
  async getAll(): Promise<ClientSurveyRecord[]> {
    try {
      return await pb.collection('client_surveys').getFullList<ClientSurveyRecord>({
        sort: '-created',
      })
    } catch (err) {
      console.warn('Erro ao carregar lista de pesquisas:', err)
      return []
    }
  },
}
