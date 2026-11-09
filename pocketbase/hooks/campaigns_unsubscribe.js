/**
 * Hook: Link "Não quero mais receber" das campanhas.
 * Route (GET, pública): /backend/v1/campaigns/unsubscribe?t={email}
 * - Marca o contato como descadastrado (unsubscribes + clients.unsubscribed_at).
 * - Exclui o e-mail de TODAS as próximas campanhas (a fila consulta unsubscribes).
 */
routerAdd('GET', '/backend/v1/campaigns/unsubscribe', (e) => {
  const escapeHtml = (s) =>
    String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')

  const email = String(e.request.url.query().get('t') || '')
    .toLowerCase()
    .trim()
  const page =
    '<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Descadastro confirmado</title></head>' +
    '<body style="font-family: Arial, sans-serif; background: #f8fafc; margin: 0; padding: 40px 20px; text-align: center;">' +
    '<div style="max-width: 480px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 32px 24px;">' +
    '<h1 style="font-size: 20px; color: #0f172a; margin: 0 0 12px;">Descadastro confirmado</h1>'

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    return e.html(
      400,
      page +
        '<p style="font-size: 14px; color: #334155;">Link inválido. Entre em contato com a Intertermal pelo e-mail alex.nogueira@intertermal.com.br.</p></div></body></html>',
    )
  }

  try {
    const col = $app.findCollectionByNameOrId('unsubscribes')
    let rec = null
    try {
      rec = $app.findFirstRecordByFilter('unsubscribes', 'email = {:e}', { e: email })
    } catch (_) {
      rec = null
    }
    if (!rec) {
      rec = new Record(col)
      rec.set('email', email)
      rec.set('reason', 'Clicou em Não quero mais receber')
      rec.set('source', 'link')
      $app.save(rec)
    }

    // Marca o contato correspondente no CRM (se houver).
    // JSON fields chegam como string no JSVM — parse antes de iterar.
    try {
      const clients = $app.findRecordsByFilter('clients', 'id != ""', '-created', 2000, 0)
      for (const c of clients) {
        try {
          let match =
            String(c.get('email') || '')
              .toLowerCase()
              .trim() === email
          let contacts = c.get('contacts')
          if (typeof contacts === 'string') {
            try {
              contacts = JSON.parse(contacts)
            } catch (_) {
              contacts = []
            }
          }
          if (!match && contacts && contacts.length) {
            for (const ct of contacts) {
              if (
                String(ct.email || '')
                  .toLowerCase()
                  .trim() === email
              ) {
                match = true
                break
              }
            }
          }
          const unsubAt = String(c.get('unsubscribed_at') || '')
          if (match && (unsubAt === '' || unsubAt.indexOf('0001') === 0)) {
            c.set('unsubscribed_at', new Date().toISOString())
            $app.save(c)
          }
        } catch (_) {}
      }
    } catch (err) {
      console.error('[campanhas] falha ao marcar cliente descadastrado:', err)
    }

    console.log('[campanhas] Descadastrado: ' + email)
  } catch (err) {
    console.error('[campanhas] falha ao descadastrar ' + email + ':', err)
  }

  return e.html(
    200,
    page +
      '<p style="font-size: 14px; color: #334155;">O e-mail <strong>' +
      escapeHtml(email) +
      '</strong> foi removido da nossa lista e não receberá mais campanhas da Intertermal.</p>' +
      '<p style="font-size: 12px; color: #64748b; margin-top: 16px;">Intertermal Projetos e Instalações · www.interproject.com.br</p></div></body></html>',
  )
})
