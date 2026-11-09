/**
 * Hook: Webhook de avisos do Resend (Resend docs, Webhooks > Event Types).
 * Route (POST, pública): /backend/v1/resend/webhook
 * Eventos tratados: email.delivered, email.bounced, email.complained, email.sent, email.failed
 * - Atualiza campaign_recipients pelo email_id (resend_id) ou pelo destinatário.
 * - bounced/complained = descadastrado: unsubscribes + clients.unsubscribed_at.
 * Configure no Resend: endpoint = https://crm-comercial-sofisticado-00224.shrd03.internal.goskip.dev/backend/v1/resend/webhook
 */
routerAdd('POST', '/backend/v1/resend/webhook', (e) => {
  const body = e.requestInfo().body || {}
  const type = String(body.type || '')
  const data = body.data || {}

  const emailId = String(data.email_id || data.message_id || '')
  const toArr = Array.isArray(data.to) ? data.to : []
  const toEmail = String(toArr[0] || '')
    .toLowerCase()
    .trim()

  const updateRecipient = (filter, params, newStatus, errTxt) => {
    let rec = null
    try {
      rec = $app.findFirstRecordByFilter('campaign_recipients', filter, params)
    } catch (_) {
      rec = null
    }
    if (!rec) return
    const current = String(rec.get('status') || '')
    // Nunca rebaixa um status mais avançado
    const rank = {
      pending: 0,
      failed: 1,
      sent: 2,
      delivered: 3,
      bounced: 4,
      complained: 4,
      unsubscribed: 5,
    }
    if ((rank[newStatus] || 0) < (rank[current] || 0)) return
    rec.set('status', newStatus)
    if (newStatus === 'delivered') rec.set('delivered_at', new Date().toISOString())
    if (errTxt) rec.set('error', String(errTxt).slice(0, 300))
    $app.save(rec)
    console.log('[resend-webhook] ' + type + ' → ' + String(rec.get('email')) + ' = ' + newStatus)
  }

  // 1) Match por email_id (resend_id)
  if (emailId) updateRecipient('resend_id = {:r}', { r: emailId }, null, null)

  const applyStatus = (newStatus, errTxt) => {
    if (emailId) updateRecipient('resend_id = {:r}', { r: emailId }, newStatus, errTxt)
    else if (toEmail) updateRecipient('email = {:e}', { e: toEmail }, newStatus, errTxt)
  }

  if (type === 'email.delivered') {
    applyStatus('delivered')
  } else if (type === 'email.sent') {
    applyStatus('sent')
  } else if (type === 'email.failed') {
    applyStatus('failed', 'Resend: falha no envio')
  } else if (type === 'email.bounced') {
    applyStatus('bounced', 'Resend: bounce (endereço recusou/inválido)')
    if (toEmail) {
      try {
        const col = $app.findCollectionByNameOrId('unsubscribes')
        let rec = null
        try {
          rec = $app.findFirstRecordByFilter('unsubscribes', 'email = {:e}', { e: toEmail })
        } catch (_) {
          rec = null
        }
        if (!rec) {
          rec = new Record(col)
          rec.set('email', toEmail)
          rec.set('reason', 'Bounce (Resend)')
          rec.set('source', 'webhook:complained')
          $app.save(rec)
        }
      } catch (_) {}
    }
  } else if (type === 'email.complained') {
    applyStatus('complained', 'Resend: marcou como spam')
    if (toEmail) {
      try {
        const col = $app.findCollectionByNameOrId('unsubscribes')
        let rec = null
        try {
          rec = $app.findFirstRecordByFilter('unsubscribes', 'email = {:e}', { e: toEmail })
        } catch (_) {
          rec = null
        }
        if (!rec) {
          rec = new Record(col)
          rec.set('email', toEmail)
          rec.set('reason', 'Marcou como spam (Resend)')
          rec.set('source', 'webhook:complained')
          $app.save(rec)
        }
      } catch (_) {}
    }
  }

  return e.json(200, { ok: true })
})
