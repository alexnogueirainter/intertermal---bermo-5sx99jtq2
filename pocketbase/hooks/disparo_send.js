// Rota de disparo de e-mails — prospecção Intertermal
// POST /backend/v1/disparo/send  { token, to, subject, html }
// Usa o SMTP configurado na instância (Hostinger) via $app.newMailClient().
routerAdd('POST', '/backend/v1/disparo/send', (e) => {
  const body = e.requestInfo().body || {}
  const token = body.token || ''
  const expected = $secrets.get('DISPARO_TOKEN') || ''

  if (!expected || token !== expected) {
    return e.json(403, { ok: false, error: 'token_invalido' })
  }

  const to = String(body.to || '').trim()
  const subject = String(body.subject || '').trim()
  const html = String(body.html || '')

  if (!to || !subject || !html) {
    return e.json(400, { ok: false, error: 'campos_obrigatorios: to, subject, html' })
  }

  try {
    const client = $app.newMailClient()
    client.send({
      from: {
        address: 'alex.nogueira@intertermal.com.br',
        name: 'Alex Nogueira - Intertermal | Grupo Inter',
      },
      to: [{ address: to }],
      subject: subject,
      html: html,
      bcc: [{ address: 'alexnogueira433@gmail.com' }],
    })
    return e.json(200, { ok: true, to: to })
  } catch (err) {
    console.error('disparo_send falhou:', err)
    return e.json(502, { ok: false, error: String(err) })
  }
})
