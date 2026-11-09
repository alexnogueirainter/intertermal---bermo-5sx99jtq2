/**
 * DEBUG TEMPORÁRIO — remover após diagnóstico.
 * Route (POST, autenticada): /backend/v1/emails/debug
 * Reproduz emails/send passo a passo e reporta onde quebra.
 */
routerAdd(
  'POST',
  '/backend/v1/emails/debug',
  (e) => {
    const steps = {}

    let apiKey = ''
    try {
      apiKey = $secrets.get('RESEND_API_KEY') || ''
      steps.secret_ok = true
      steps.secret_len = apiKey.length
    } catch (err) {
      steps.secret_ok = false
      steps.secret_err = String(err)
      return e.json(200, { ok: true, steps: steps })
    }

    const to = 'alex.nogueira@intertermal.com.br'
    const subject = '[TESTE] Debug'
    const bodyText = 'Linha 1\nLinha 2'

    const escapeHtml = (s) =>
      String(s || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')

    let html = ''
    try {
      const paragraphs = bodyText
        .split('\n')
        .filter((l) => l.trim().length > 0)
        .map((l) => '<p style="font-size: 14px;">' + escapeHtml(l) + '</p>')
        .join('')
      html =
        '<div style="font-family: Arial, sans-serif;">' +
        paragraphs +
        '<p><a href="https://crm-comercial-sofisticado-00224.shrd03.internal.goskip.dev/backend/v1/campaigns/unsubscribe?t=' +
        encodeURIComponent(to) +
        '">Não quero mais receber</a></p>' +
        '</div>'
      steps.html_ok = true
    } catch (err) {
      steps.html_ok = false
      steps.html_err = String(err)
      return e.json(200, { ok: true, steps: steps })
    }

    let payload = null
    try {
      payload = JSON.stringify({
        from: 'Intertermal | Grupo Inter <alex.nogueira@intertermal.com.br>',
        reply_to: 'alex.nogueira@intertermal.com.br',
        to: [to],
        subject: subject,
        html: html,
      })
      steps.payload_ok = true
      steps.payload_len = payload.length
    } catch (err) {
      steps.payload_ok = false
      steps.payload_err = String(err)
      return e.json(200, { ok: true, steps: steps })
    }

    try {
      const res = $http.send({
        url: 'https://api.resend.com/emails',
        method: 'POST',
        headers: { Authorization: 'Bearer ' + apiKey, 'Content-Type': 'application/json' },
        body: payload,
        timeout: 20,
      })
      steps.http_ok = true
      steps.status = res.statusCode
      steps.body_preview = String(res.body ? new TextDecoder().decode(res.body) : '').slice(0, 300)
    } catch (err) {
      steps.http_ok = false
      steps.http_err = String(err)
    }

    return e.json(200, { ok: true, steps: steps })
  },
  $apis.requireAuth(),
)
