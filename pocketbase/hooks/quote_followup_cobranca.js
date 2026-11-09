/**
 * Hook: Cobrança de proposta — "Cobrar cliente" (Alex, 09/11).
 * cronAdd quote_followup_cobranca 3 11 * * 1-5 (08:00 BRT, dias úteis).
 *
 * Regra: proposta em status 'sent' (Enviada) há 5 dias corridos sem resposta
 * -> cria atividade "Cobrar cliente" para o responsável (assigned_to da proposta),
 * com o telefone WhatsApp do cliente e a mensagem pronta para o botão do CRM.
 *
 * - Âncora dos 5 dias: campo follow_up_date da própria proposta (existe no schema,
 *   não era usado). Gravado no 1º dia útil em que a proposta aparece como 'sent'
 *   (ou reenviada). Dias corridos contados a partir dessa âncora.
 * - Idempotente: uma cobrança por proposta (quote_cobranca = id da proposta).
 * - Cancela a cobrança se a proposta sair de 'sent' (aprovada/recusada/negociação).
 * - Concluída a cobrança (status completed), rearma o ciclo: nova âncora = hoje,
 *   nova cobrança em 5 dias se continuar 'sent'.
 * - Não altera nada na proposta além de follow_up_date (âncora do ciclo).
 */
cronAdd('quote_followup_cobranca', '3 11 * * 1-5', () => {
  const FOLLOWUP_DAYS = 5
  const nowIso = new Date().toISOString()

  // ---- Propostas em 'sent' ----
  let sent = []
  try {
    sent = $app.findRecordsByFilter(
      'quotes',
      "status = 'sent' && archived != true",
      '-updated',
      500,
      0,
    )
  } catch (err) {
    console.error('[cobranca] falha ao buscar propostas enviadas:', err)
    return
  }

  // ---- Cobranças pendentes existentes (para cancelamento rápido) ----
  let pendentes = []
  try {
    pendentes = $app.findRecordsByFilter(
      'activities',
      "quote_cobranca != '' && status = 'pending'",
      '-created',
      500,
      0,
    )
  } catch (_) {
    pendentes = []
  }
  const pendentePorQuote = new Map()
  for (const a of pendentes) {
    pendentePorQuote.set(String(a.get('quote_cobranca') || ''), a)
  }

  // ---- Telefone por cliente (whatsapp -> phone) ----
  const phoneByClient = new Map()
  try {
    const clients = $app.findRecordsByFilter('clients', 'id != ""', '-updated', 10000, 0)
    for (const c of clients) {
      const fone = String(c.get('whatsapp') || c.get('phone') || '').trim()
      if (fone) phoneByClient.set(String(c.id), fone)
    }
  } catch (_) {}

  const sentIds = new Set()
  let criadas = 0
  let canceladas = 0
  let rearmadas = 0

  for (const q of sent) {
    sentIds.add(String(q.id))

    // Âncora do ciclo: 1ª vez vista como 'sent' (ou rearmada após cobrança concluída)
    let anchor = String(q.get('follow_up_date') || '').trim()
    if (!anchor) {
      q.set('follow_up_date', nowIso)
      try {
        $app.save(q)
      } catch (err) {
        console.error('[cobranca] falha ao ancorar follow_up_date da proposta ' + q.id + ':', err)
        continue
      }
      anchor = nowIso
    }

    const diasCorridos = Math.floor((Date.now() - new Date(anchor).getTime()) / 86400000)
    if (diasCorridos < FOLLOWUP_DAYS) continue

    // Já tem cobrança pendente? (não duplica)
    if (pendentePorQuote.has(String(q.id))) continue

    // Cobrança anterior concluída? Rearma o ciclo (nova âncora = agora) e cria a próxima.
    let anteriorConcluida = null
    try {
      anteriorConcluida = $app.findFirstRecordByFilter(
        'activities',
        "quote_cobranca = {:q} && status = 'completed'",
        '-updated',
        1,
        0,
        { q: String(q.id) },
      )
    } catch (_) {
      anteriorConcluida = null
    }
    if (anteriorConcluida) {
      const fimAnterior = String(anteriorConcluida.getDateTime('updated').string() || nowIso)
      const diasDesdeCobranca = Math.floor(
        (Date.now() - new Date(fimAnterior).getTime()) / 86400000,
      )
      if (diasDesdeCobranca < FOLLOWUP_DAYS) {
        // Dentro do novo ciclo de 5 dias pós-cobrança: reancora e segue
        q.set('follow_up_date', fimAnterior)
        try {
          $app.save(q)
        } catch (_) {}
        continue
      }
      rearmadas++
    }

    // Dados da cobrança
    const clientId = String(q.get('client_id') || '')
    const clientName = String(q.get('client_name') || '').trim()
    const quoteNumber = String(q.get('quote_number') || q.get('code') || '').trim()
    const responsavel = String(q.get('assigned_to') || '').trim() || 'Alex Nogueira'

    // Contato: 1º contato do cliente (nome + telefone)
    let contactName = ''
    let contactPhone = ''
    if (clientId) {
      try {
        const client = $app.findFirstRecordByFilter('clients', 'id = {:c}', { c: clientId })
        contactPhone = String(client.get('whatsapp') || client.get('phone') || '').trim()
        const contacts = client.get('contacts')
        if (Array.isArray(contacts) && contacts.length > 0) {
          const primary = contacts.find((c) => c && c.is_primary) || contacts[0]
          contactName = String(primary?.name || '').trim()
          if (!contactPhone) contactPhone = String(primary?.phone || primary?.whatsapp || '').trim()
        }
      } catch (_) {}
    }
    if (!contactPhone && clientId) {
      contactPhone = phoneByClient.get(clientId) || ''
    }

    const activitiesCol = $app.findCollectionByNameOrId('activities')
    const act = new Record(activitiesCol)
    act.set('title', 'Cobrar cliente')
    act.set('type', 'follow_up')
    act.set('status', 'pending')
    act.set('priority', 'high')
    act.set('due_date', nowIso)
    act.set('time', '08:00')
    act.set('client_id', clientId)
    act.set('client_name', clientName)
    act.set('assigned_to', responsavel)
    act.set('quote_cobranca', String(q.id))
    act.set('quote_number', quoteNumber)
    act.set('quote_contact', contactName)
    if (contactPhone) act.set('contact_phone', contactPhone)
    act.set(
      'description',
      'Proposta ' +
        quoteNumber +
        ' em "Enviada" há ' +
        diasCorridos +
        ' dias sem resposta. Cobrar o cliente.' +
        (contactPhone ? ' WhatsApp: ' + contactPhone : ''),
    )
    $app.save(act)
    criadas++
    console.log(
      '[cobranca] Atividade criada | proposta=' +
        quoteNumber +
        ' | cliente=' +
        clientName +
        ' | responsavel=' +
        responsavel +
        ' | dias=' +
        diasCorridos,
    )
  }

  // ---- Cancela cobranças de propostas que saíram de 'sent' ----
  for (const [quoteId, act] of pendentePorQuote) {
    if (sentIds.has(quoteId)) continue
    act.set('status', 'cancelled')
    act.set('outcome', 'Cancelada automaticamente — proposta saiu de "Enviada"')
    try {
      $app.save(act)
      canceladas++
    } catch (_) {}
  }

  if (criadas || canceladas || rearmadas) {
    console.log(
      '[cobranca] Rodada: ' +
        criadas +
        ' criadas, ' +
        canceladas +
        ' canceladas, ' +
        rearmadas +
        ' rearma',
    )
  }
})
