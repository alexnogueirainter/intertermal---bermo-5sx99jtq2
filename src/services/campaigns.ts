import pb from '@/lib/pocketbase/client'

export interface CampaignRecipient {
  email: string
  name: string
  company: string
}

export interface CampaignRecord {
  id: string
  name: string
  subject: string
  body: string
  list_tag?: string
  recipients?: CampaignRecipient[]
  status: 'draft' | 'sending' | 'done' | 'cancelled' | string
  daily_limit?: number
  sent_count?: number
  test_sent?: boolean
  created_by?: string
  created?: string
  updated?: string
}

export interface CampaignRecipientRecord {
  id: string
  campaign: string
  client_id?: string
  email: string
  name?: string
  company?: string
  resend_id?: string
  status:
    | 'pending'
    | 'sent'
    | 'delivered'
    | 'bounced'
    | 'complained'
    | 'unsubscribed'
    | 'failed'
    | string
  error?: string
  sent_at?: string
  delivered_at?: string
  created?: string
}

export const campaignsService = {
  /** Salva a campanha (modelo + destinatários) no backend. */
  async save(input: {
    name: string
    subject: string
    body: string
    list_tag?: string
    recipients?: string[]
  }): Promise<{ ok: boolean; campaign_id?: string; recipients?: number; error?: string }> {
    return await pb.send('/backend/v1/campaigns/action', {
      method: 'POST',
      body: { action: 'save', ...input },
      requestKey: null,
    })
  },

  /** Envia um e-mail de teste para o próprio Alex. */
  async sendTest(subject: string, body: string): Promise<{ ok: boolean; error?: string }> {
    return await pb.send('/backend/v1/campaigns/action', {
      method: 'POST',
      body: { action: 'test', subject, body, to: 'alex.nogueira@intertermal.com.br' },
      requestKey: null,
    })
  },

  /** Envia 1 e-mail pela função única (Resend) — usado no teste da tela Campanhas. */
  async sendOne(
    to: string,
    subject: string,
    body: string,
  ): Promise<{ ok: boolean; resend_id?: string; error?: string }> {
    return await pb.send('/backend/v1/emails/send', {
      method: 'POST',
      body: { to, subject, body },
      requestKey: null,
    })
  },

  /** Salva/edita um modelo de campanha pelo hook do backend. */
  async saveTemplate(input: {
    name: string
    category?: string
    subject: string
    body: string
    template_id?: string
  }): Promise<{ ok: boolean; error?: string }> {
    return await pb.send('/backend/v1/campaigns/action', {
      method: 'POST',
      body: { action: 'template-save', ...input },
      requestKey: null,
    })
  },

  /** Ativa a campanha: cria a fila (90/dia, continua no dia seguinte). */
  async activate(campaignId: string): Promise<{ ok: boolean; queued?: number; error?: string }> {
    return await pb.send('/backend/v1/campaigns/action', {
      method: 'POST',
      body: { action: 'send', campaign_id: campaignId },
      requestKey: null,
    })
  },

  async getAll(): Promise<CampaignRecord[]> {
    return await pb.collection('campaigns').getFullList<CampaignRecord>({ sort: '-created' })
  },

  async getRecipients(campaignId: string): Promise<CampaignRecipientRecord[]> {
    return await pb.collection('campaign_recipients').getFullList<CampaignRecipientRecord>({
      filter: `campaign_id = "${campaignId}"`,
      sort: 'email',
    })
  },

  /** Etiquetas existentes (tags de clientes) para o seletor. */
  async getAllTags(): Promise<string[]> {
    const clients = await pb.collection('clients').getFullList<any>({ fields: 'tags' })
    const set = new Set<string>()
    for (const c of clients) {
      if (Array.isArray(c.tags)) c.tags.forEach((t: string) => t && set.add(t))
    }
    return Array.from(set).sort()
  },

  /** Contatos elegíveis (por etiqueta ou todos) para marcar um a um. */
  async getEligibleContacts(): Promise<
    { email: string; name: string; company: string; tags: string[] }[]
  > {
    const clients = await pb.collection('clients').getFullList<any>()
    const unsub = await pb.collection('unsubscribes').getFullList<any>()
    const unsubSet = new Set<string>(
      unsub.map((u: any) =>
        String(u.email || '')
          .toLowerCase()
          .trim(),
      ),
    )
    const out: { email: string; name: string; company: string; tags: string[] }[] = []
    const seen = new Set<string>()
    for (const c of clients) {
      if (c.unsubscribed_at) continue
      const emails: string[] = []
      if (c.email) emails.push(String(c.email))
      if (Array.isArray(c.contacts)) {
        for (const ct of c.contacts) if (ct.email) emails.push(String(ct.email))
      }
      for (const em of emails) {
        const key = em.toLowerCase().trim()
        if (!key || unsubSet.has(key) || seen.has(key)) continue
        seen.add(key)
        out.push({
          email: key,
          name: String(c.name || ''),
          company: String(c.company_name || c.name || ''),
          tags: Array.isArray(c.tags) ? c.tags.map(String) : [],
        })
      }
    }
    return out.sort((a, b) => a.company.localeCompare(b.company))
  },

  async getUnsubscribedCount(): Promise<number> {
    const l = await pb.collection('unsubscribes').getList(1, 1)
    return l.totalItems
  },
}

export interface CampaignTemplateRecord {
  id: string
  name: string
  category?: string
  subject: string
  body: string
  created?: string
  updated?: string
}

export const templatesService = {
  async getAll(): Promise<CampaignTemplateRecord[]> {
    return await pb
      .collection('campaign_templates')
      .getFullList<CampaignTemplateRecord>({ sort: '-created' })
  },

  async create(input: { name: string; category?: string; subject: string; body: string }) {
    return await pb.collection('campaign_templates').create(input)
  },

  async update(
    id: string,
    input: { name?: string; category?: string; subject?: string; body?: string },
  ) {
    return await pb.collection('campaign_templates').update(id, input)
  },

  async remove(id: string) {
    return await pb.collection('campaign_templates').delete(id)
  },
}
