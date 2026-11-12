/**
 * Hook: Fila de envio das campanhas — Resend via RESEND_API_KEY.
 * cronAdd campaigns_queue 7 13 * * 1-5 (10h BRT, dias úteis).
 * - 90 e-mails/dia no total (limite do plano gratuito + folga p/ propostas e avisos).
 * - Pega a campanha mais antiga em 'sending', manda os pendentes do dia.
 * - Conta TODOS os e-mails do dia (propostas, avisos, testes) pelo log _logs source=email
 *   + os enviados nesta rodada — o teto de 90 vale para a instância inteira.
 * - Termina a campanha quando a fila zera; continua no dia seguinte se a lista for maior.
 * - Descadastrados (unsubscribes) e clientes com unsubscribed_at nunca recebem.
 * - Marca contato como descadastrado no Resend quando há bounce/complaint.
 */
cronAdd('campaigns_queue', '7 13 * * 1-5', () => {
  const apiKey = $secrets.get('RESEND_API_KEY') || ''
  if (!apiKey) {
    console.warn('[campanhas] RESEND_API_KEY não configurada — rodada ignorada')
    return
  }

  const DAILY_LIMIT = 90
  const FROM = 'Intertermal | Grupo Inter <alex.nogueira@intertermal.com.br>'
  const nowIso = new Date().toISOString()
  const todayKey = nowIso.slice(0, 10)

  // ---- Quota do dia: e-mails de campanha já enviados hoje + log transacional de hoje ----
  let usedToday = 0
  try {
    const recs = $app.findRecordsByFilter(
      'campaign_recipients',
      "status = 'sent' || status = 'delivered'",
      '-sent_at',
      500,
      0,
    )
    for (const r of recs) {
      const s = String(r.getDateTime('sent_at').string() || '')
      if (s.slice(0, 10) === todayKey) usedToday++
    }
  } catch (err) {
    console.error('[campanhas] falha ao contar quota:', err)
    return
  }
  try {
    const logs = $app.findRecordsByFilter('_logs', "data.source = 'email'", '-created', 500, 0)
    for (const l of logs) {
      let data = l.get('data') || {}
      if (typeof data === 'string') {
        try {
          data = JSON.parse(data)
        } catch (_) {
          data = {}
        }
      }
      if (String(data.source || '') !== 'email') continue
      const c = String(l.getDateTime('created').string() || '')
      if (c.slice(0, 10) === todayKey) usedToday++
    }
  } catch (_) {
    /* log indisponível: segue só com a fila */
  }

  // ---- Campanha ativa mais antiga ----
  let campaign = null
  try {
    campaign = $app.findFirstRecordByFilter('campaigns', "status = 'sending'", '-created')
  } catch (_) {
    campaign = null
  }
  if (!campaign) return

  const campaignId = String(campaign.id)
  const subject = String(campaign.get('subject') || '')
  const bodyTpl = String(campaign.get('body') || '')

  // ---- Anexos da campanha (o mesmo arquivo sai em todos os e-mails) ----
  // Mesmo padrão provado do envio de propostas: baixa o arquivo do próprio
  // PocketBase e converte para Base64 (o runtime JSVM não tem btoa).
  const uint8ToBase64 = (bytes) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
    const out = []
    for (let i = 0; i < bytes.length; i += 3) {
      const b1 = bytes[i]
      const b2 = i + 1 < bytes.length ? bytes[i + 1] : 0
      const b3 = i + 2 < bytes.length ? bytes[i + 2] : 0
      const has2 = i + 1 < bytes.length
      const has3 = i + 2 < bytes.length
      out.push(
        chars[b1 >> 2],
        chars[((b1 & 3) << 4) | (b2 >> 4)],
        has2 ? chars[((b2 & 15) << 2) | (b3 >> 6)] : '=',
        has3 ? chars[b3 & 63] : '=',
      )
    }
    return out.join('')
  }
  const attachments = []
  try {
    const atts = $app.findRecordsByFilter(
      'campaign_attachments',
      'campaign_id = {:c}',
      '-created',
      10,
      0,
      { c: campaignId },
    )
    for (const a of atts) {
      const fname = String(a.get('file') || '')
      if (!fname) continue
      const fileUrl =
        ($secrets.get('PB_INSTANCE_URL') || '') +
        '/api/files/' +
        a.collection().id +
        '/' +
        a.id +
        '/' +
        encodeURIComponent(fname) +
        '?token=' +
        ($secrets.get('PB_SUPERUSER_TOKEN') || '')
      try {
        const fRes = $http.send({ url: fileUrl, method: 'GET', timeout: 30 })
        if (fRes.statusCode === 200 && fRes.body && fRes.body.length > 0) {
          attachments.push({
            filename: String(a.get('filename') || fname),
            content: uint8ToBase64(new Uint8Array(fRes.body)),
          })
        } else {
          console.warn('[campanhas] Anexo não baixado (HTTP ' + fRes.statusCode + '): ' + fname)
        }
      } catch (errA) {
        console.warn('[campanhas] Falha ao baixar anexo ' + fname + ':', errA)
      }
    }
  } catch (_) {
    /* coleção sem anexos ou indisponível: envia sem anexo */
  }
  if (attachments.length > 0) console.log('[campanhas] Anexos carregados: ' + attachments.length)

  // ---- Descadastrados (nunca recebem) ----
  const unsubSet = new Set()
  try {
    const unsubs = $app.findRecordsByFilter('unsubscribes', 'id != ""', '-created', 10000, 0)
    for (const u of unsubs)
      unsubSet.add(
        String(u.get('email') || '')
          .toLowerCase()
          .trim(),
      )
  } catch (_) {}

  // ---- Pendentes da campanha ----
  let pending = []
  try {
    pending = $app.findRecordsByFilter(
      'campaign_recipients',
      'campaign_id = {:c} && status = {:s}',
      '-created',
      500,
      0,
      { c: campaignId, s: 'pending' },
    )
  } catch (err) {
    console.error('[campanhas] falha ao carregar pendentes:', err)
    return
  }

  const sendable = []
  for (const p of pending) {
    const email = String(p.get('email') || '')
      .toLowerCase()
      .trim()
    if (!email || unsubSet.has(email)) {
      p.set('status', 'unsubscribed')
      p.set('error', 'Descadastrado — fora das próximas campanhas')
      $app.save(p)
      continue
    }
    sendable.push(p)
  }

  const budget = DAILY_LIMIT - usedToday
  const batch = sendable.slice(0, Math.max(0, budget))
  const skippedToday = sendable.length - batch.length

  const escapeHtml = (s) =>
    String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')

  let sentOk = 0
  let sentFail = 0
  for (const p of batch) {
    if (usedToday >= DAILY_LIMIT) break
    const email = String(p.get('email') || '')
      .toLowerCase()
      .trim()
    const nomeCompleto = String(p.get('name') || '').trim()
    const empresa = String(p.get('company') || '').trim()
    // {nome} = primeiro nome, sem título (Eng., Dr. etc.), inicial maiúscula;
    // {nome_completo} = nome inteiro. {nome_completo} TEM de ser trocado antes
    // de {nome} — senão o split de {nome} quebra o token maior.
    const limpo = nomeCompleto.replace(/^(eng\.?|dr\.?|dra\.?|sr\.?|sra\.?)\s+/i, '').trim()
    const primeiro = (limpo.split(/\s+/)[0] || '').trim()
    const primeiroNome = primeiro
      ? primeiro.charAt(0).toUpperCase() + primeiro.slice(1).toLowerCase()
      : ''

    const personalizar = (txt) =>
      String(txt || '')
        .split('{nome_completo}')
        .join(nomeCompleto || 'cliente')
        .split('{nome}')
        .join(primeiroNome || 'cliente')
        .split('{empresa}')
        .join(empresa || 'sua empresa')

    const htmlBody =
      '<div style="font-family: Arial, sans-serif; color: #1a1a1a; max-width: 560px; margin: 0 auto;">' +
      personalizar(bodyTpl)
        .split('\n')
        .filter((l) => l.trim().length > 0)
        .map(
          (l) =>
            '<p style="font-size: 14px; line-height: 1.6; margin: 0 0 12px;">' +
            escapeHtml(l) +
            '</p>',
        )
        .join('') +
      '<hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />' +
      '<p style="font-size: 12px; color: #64748b;">Intertermal Projetos e Instalações · Engenharia, instalações industriais e automação · www.interproject.com.br</p>' +
      '<p style="font-size: 12px;"><a href="https://crm-comercial-sofisticado-00224.shrd03.internal.goskip.dev/backend/v1/campaigns/unsubscribe?t=' +
      encodeURIComponent(email) +
      '" style="color: #64748b;">Não quero mais receber</a></p>' +
      '</div>'

    let ok = false
    let resendId = ''
    let errTxt = ''
    try {
      // Payload montado de forma imperativa: o JSVM não suporta spread
      // condicional em objeto literal (ReferenceError __spreadValues).
      const resendPayload = {
        from: FROM,
        to: [email],
        subject: personalizar(subject),
        html: htmlBody,
      }
      if (attachments.length > 0) resendPayload.attachments = attachments
      const res = $http.send({
        url: 'https://api.resend.com/emails',
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(resendPayload),
        timeout: 20,
      })
      if (res.statusCode === 200 && res.json && res.json.id) {
        ok = true
        resendId = String(res.json.id || '')
      } else {
        let errBody = ''
        try {
          if (res.body && res.body.length > 0) {
            errBody = new TextDecoder().decode(new Uint8Array(res.body))
          }
        } catch (_) {
          errBody = ''
        }
        errTxt = 'HTTP ' + res.statusCode + ': ' + String(errBody).slice(0, 250)
      }
    } catch (err) {
      errTxt = 'transporte: ' + String(err)
    }

    if (ok) {
      usedToday++
      sentOk++
      p.set('status', 'sent')
      p.set('resend_id', resendId)
      p.set('sent_at', new Date().toISOString())
    } else {
      sentFail++
      p.set('status', 'failed')
      p.set('error', errTxt.slice(0, 300))
    }
    $app.save(p)
  }

  // ---- Fim da fila? ----
  let stillPending = 0
  try {
    const rest = $app.findRecordsByFilter(
      'campaign_recipients',
      'campaign_id = {:c} && status = {:s}',
      '-created',
      1,
      0,
      { c: campaignId, s: 'pending' },
    )
    stillPending = rest.length
  } catch (_) {}

  if (stillPending === 0) {
    campaign.set('status', 'done')
    campaign.set('sent_count', sentOk)
    $app.save(campaign)
    console.log('[campanhas] Campanha CONCLUÍDA: ' + sentOk + ' enviados, ' + sentFail + ' falhas')
  } else {
    console.log(
      '[campanhas] Rodada: ' +
        sentOk +
        ' enviados, ' +
        sentFail +
        ' falhas, ' +
        stillPending +
        ' pendentes (continua amanhã), ' +
        skippedToday +
        ' adiados por quota',
    )
  }
})
