/**
 * Hook: Envio de e-mail — função ÚNICA via Resend (segredo RESEND_API_KEY).
 * Route (POST, autenticada): /backend/v1/emails/send
 * Body: { to, subject, body, from?, reply_to?, campaign_ref? }
 * - body = TEXTO simples (linhas viram <p>); campos {nome}/{empresa} NÃO são trocados aqui.
 * - Rodapé: assinatura Intertermal + link "Não quero mais receber" (marca descadastrado).
 * - Usada por: campanhas (teste), propostas, avisos — qualquer e-mail do CRM.
 */
routerAdd(
  'POST',
  '/backend/v1/emails/send',
  (e) => {
    const body = e.requestInfo().body || {}
    const apiKey = $secrets.get('RESEND_API_KEY') || ''
    if (!apiKey) {
      return e.json(400, {
        ok: false,
        error: 'RESEND_API_KEY não configurada no painel de segredos do Skip',
      })
    }

    const to = String(body.to || '')
      .toLowerCase()
      .trim()
    const subject = String(body.subject || '').trim()
    const bodyText = String(body.body || '')
    const from = String(body.from || 'alex.nogueira@intertermal.com.br').trim()
    const replyTo = String(body.reply_to || 'alex.nogueira@intertermal.com.br').trim()
    const campaignRef = String(body.campaign_ref || '').trim()

    if (!to || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(to)) {
      return e.json(400, { ok: false, error: 'Destinatário inválido' })
    }
    if (!subject) return e.json(400, { ok: false, error: 'Assunto obrigatório' })

    const escapeHtml = (s) =>
      String(s || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')

    const paragraphs = bodyText
      .split('\n')
      .filter((l) => l.trim().length > 0)
      .map(
        (l) =>
          '<p style="font-size: 14px; line-height: 1.6; margin: 0 0 12px;">' +
          escapeHtml(l) +
          '</p>',
      )
      .join('')

    const html =
      '<div style="font-family: Arial, sans-serif; color: #1a1a1a; max-width: 560px; margin: 0 auto;">' +
      paragraphs +
      '<hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />' +
      '<p style="font-size: 12px; color: #64748b;">Intertermal Projetos e Instalações · Engenharia, instalações industriais e automação · www.interproject.com.br</p>' +
      '<p style="font-size: 12px;"><a href="https://crm-comercial-sofisticado-00224.shrd03.internal.goskip.dev/backend/v1/campaigns/unsubscribe?t=' +
      encodeURIComponent(to) +
      '" style="color: #64748b;">Não quero mais receber</a></p>' +
      '</div>'

    let res = null
    try {
      res = $http.send({
        url: 'https://api.resend.com/emails',
        method: 'POST',
        headers: { Authorization: 'Bearer ' + apiKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: 'Intertermal | Grupo Inter <' + from + '>',
          reply_to: replyTo || undefined,
          to: [to],
          subject: subject,
          html: html,
          headers: campaignRef ? { 'X-Campaign-Ref': campaignRef } : undefined,
        }),
        timeout: 20,
      })
    } catch (err) {
      return e.json(502, { ok: false, error: 'transporte: ' + String(err) })
    }

    if (res.statusCode === 200 && res.json && res.json.id) {
      console.log('[emails/send] Enviado para ' + to + ' | resend_id=' + String(res.json.id))
      return e.json(200, { ok: true, resend_id: String(res.json.id) })
    }
    const errTxt =
      'HTTP ' +
      res.statusCode +
      ': ' +
      String(res.body ? new TextDecoder().decode(res.body) : '').slice(0, 200)
    console.error('[emails/send] Falha para ' + to + ': ' + errTxt)
    return e.json(502, { ok: false, error: errTxt })
  },
  $apis.requireAuth(),
)
