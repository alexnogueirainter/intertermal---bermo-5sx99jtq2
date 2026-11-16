import pb from '@/lib/pocketbase/client'

/**
 * Serviço de importação de proposta recebida (modelo PI).
 * O hook backend /backend/v1/proposals/import faz a extração (IA) e o commit.
 * Nada é gravado sem a revisão humana na tela (Alex, 16/11).
 *
 * Upload vai por fetch direto com FormData (multipart garantido) e o token
 * do authStore no header — mesmo padrão de autenticação do pb.send.
 */

const API_BASE = () => {
  const base = String(import.meta.env.VITE_POCKETBASE_URL || '').replace(/\/+$/, '')
  return base + '/backend/v1/proposals/import'
}

async function postForm(form: FormData): Promise<any> {
  const token = pb.authStore.token
  const res = await fetch(API_BASE(), {
    method: 'POST',
    headers: token ? { Authorization: token } : undefined,
    body: form,
  })
  const json = await res.json().catch(() => null)
  if (!res.ok) {
    const msg = (json && (json.message || json.error)) || `Falha na importação (HTTP ${res.status})`
    throw new Error(msg)
  }
  return json
}

export interface ImportedClient {
  name: string
  document: string
  contact_name: string
  contact_email: string
  contact_phone: string
  contact_mobile: string
  city: string
  state: string
  segment: string
  notes: string
}

export interface ImportedProposal {
  quote_number: string
  title: string
  issue_date: string
  total: string | number
  optional_items: Array<{ code?: string; description?: string; value?: string | number }>
  payment_terms: string
  validity_days: string | number
  valid_until: string
  scope_summary: string
  delivery_weeks: string
}

export interface ImportedDeal {
  suggested_title: string
  priority: string
}

export interface ImportExtraction {
  client: ImportedClient
  proposal: ImportedProposal
  deal: ImportedDeal
  warnings: string[]
}

export interface ImportCommitResult {
  success: boolean
  quote_id: string
  quote_number: string
  number_adjusted: boolean
  client_id: string
  client_created: boolean
  deal_id: string
  follow_up_date: string
}

export const proposalImportService = {
  /** Etapa 1: extrai os dados do PDF (não grava nada). */
  async extract(
    file: File,
  ): Promise<{ data: ImportExtraction; truncated: boolean; method: string }> {
    const form = new FormData()
    form.append('action', 'extract')
    form.append('file', file)
    const res = await postForm(form)
    return {
      data: res.data as ImportExtraction,
      truncated: !!res.truncated,
      method: res.extraction_method || 'ai',
    }
  },

  /** Etapa 2: grava cliente + proposta + deal com o PDF anexado. */
  async commit(
    payload: {
      client: ImportedClient
      proposal: ImportedProposal
      deal: ImportedDeal
      warnings: string[]
    },
    file: File,
  ): Promise<ImportCommitResult> {
    const form = new FormData()
    form.append('action', 'commit')
    form.append('payload', JSON.stringify(payload))
    form.append('file', file)
    return (await postForm(form)) as ImportCommitResult
  },
}
