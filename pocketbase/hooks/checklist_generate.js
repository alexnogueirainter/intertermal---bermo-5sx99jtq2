/**
 * Hook: Gera o checklist de uma OS e o link restrito do técnico.
 * Route (POST, autenticada): /backend/v1/checklists/generate
 * Body: { os_id, template? }
 * - Idempotente: se a OS já tem checklist, devolve o token EXISTENTE (não cria outro).
 * - Cria o registro em os_checklists (rascunho) + token em checklist_tokens.
 * - Amarra checklist_id na OS (service_orders.checklist_id).
 * - O link abre SÓ o checklist daquela OS: /checklist?t=CÓDIGO
 */
routerAdd(
  'POST',
  '/backend/v1/checklists/generate',
  (e) => {
    const body = e.requestInfo().body || {}
    const osId = String(body.os_id || '').trim()
    const template = String(body.template || 'trocador').trim()

    if (!osId) return e.json(400, { ok: false, error: 'missing_os_id' })

    let so = null
    try {
      so = $app.findRecordById('service_orders', osId)
    } catch (_) {
      so = null
    }
    if (!so) return e.json(404, { ok: false, error: 'os_not_found' })

    // Idempotência: OS já tem checklist → devolve o token existente
    const existingId = String(so.get('checklist_id') || '')
    if (existingId) {
      let existing = null
      try {
        existing = $app.findRecordById('os_checklists', existingId)
      } catch (_) {
        existing = null
      }
      if (existing) {
        let tok = null
        try {
          tok = $app.findFirstRecordByFilter(
            'checklist_tokens',
            'service_order_id = {:o} && active = true',
            { o: osId },
          )
        } catch (_) {
          tok = null
        }
        return e.json(200, {
          ok: true,
          already: true,
          checklist_id: existing.id,
          token: tok ? String(tok.get('token') || '') : '',
          os_number: String(existing.get('os_number') || ''),
          template: String(existing.get('template') || template),
        })
      }
    }

    const osNumber = String(so.get('order_number') || '')
    const clientId = String(so.get('client_id') || '')
    let clientName = String(so.get('client_name') || '')
    if (!clientName && clientId) {
      try {
        const c = $app.findRecordById('clients', clientId)
        clientName = String(c.get('name') || '')
      } catch (_) {}
    }

    // 1) Registro do checklist (rascunho)
    const col = $app.findCollectionByNameOrId('os_checklists')
    const rec = new Record(col)
    rec.set('service_order_id', osId)
    rec.set('os_number', osNumber)
    rec.set('template', template)
    rec.set('client_id', clientId)
    rec.set('client_name', clientName)
    rec.set('technician_name', String(so.get('assigned_to') || ''))
    rec.set('status', 'rascunho')
    rec.set('answers', {})
    rec.set('ident', {})
    rec.set('texts', {})
    $app.save(rec)

    // 2) Token do link (1 código = 1 aparelho)
    const rand = () => {
      const abc = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
      let s = ''
      for (let i = 0; i < 4; i++) s += abc.charAt(Math.floor(Math.random() * abc.length))
      return s
    }
    const token = 'CKL-' + rand() + '-' + rand()

    const colTok = $app.findCollectionByNameOrId('checklist_tokens')
    const recTok = new Record(colTok)
    recTok.set('token', token)
    recTok.set('service_order_id', osId)
    recTok.set('os_number', osNumber)
    recTok.set('technician_name', String(so.get('assigned_to') || ''))
    recTok.set('template', template)
    recTok.set('active', true)
    $app.save(recTok)

    // 3) Amarra o checklist na OS
    so.set('checklist_id', rec.id)
    $app.save(so)

    console.log(
      '[checklist] gerado | os=' + osNumber + ' | template=' + template + ' | token=' + token,
    )

    return e.json(200, {
      ok: true,
      checklist_id: rec.id,
      token: token,
      os_number: osNumber,
      template: template,
    })
  },
  $apis.requireAuth(),
)
