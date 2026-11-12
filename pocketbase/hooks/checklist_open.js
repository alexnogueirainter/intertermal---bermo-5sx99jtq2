/**
 * Hook: O técnico abre o checklist pelo link restrito.
 * Route (GET, público com token): /backend/v1/checklists/open?t=CÓDIGO&device_id=X
 * - Valida token ativo + aparelho (1 código = 1 aparelho, amarrado no 1º uso).
 * - Devolve o checklist daquela OS com a identificação pré-preenchida da OS + cliente.
 * - O técnico NUNCA vê o CRM: só o checklist da OS do token.
 */
routerAdd('GET', '/backend/v1/checklists/open', (e) => {
  const q = e.requestInfo().query || {}
  const token = String(q['t'] || '').trim()
  const deviceId = String(q['device_id'] || '').trim()

  if (!token) return e.json(400, { ok: false, error: 'missing_token' })

  let tok = null
  try {
    tok = $app.findFirstRecordByFilter('checklist_tokens', 'token = {:t} && active = true', {
      t: token,
    })
  } catch (_) {
    tok = null
  }
  if (!tok) return e.json(403, { ok: false, error: 'invalid_token' })

  const boundDevice = String(tok.get('device_id') || '')
  if (boundDevice && deviceId && boundDevice !== deviceId) {
    console.warn('[checklist] TENTATIVA EM APARELHO NAO AUTORIZADO | ip=' + e.request.remoteAddr)
    return e.json(403, { ok: false, error: 'device_not_authorized' })
  }

  // Primeiro uso: amarra o aparelho (mesma régua do bind da visita)
  if (!boundDevice && deviceId) {
    tok.set('device_id', deviceId)
    tok.set('device_ip', String(e.request.remoteAddr || ''))
    tok.set(
      'device_ua',
      String((e.requestInfo().headers && e.requestInfo().headers['user_agent']) || ''),
    )
    tok.set('bound_at', new Date().toISOString())
    $app.save(tok)
    console.log('[checklist] aparelho vinculado | token=' + token + ' | ip=' + e.request.remoteAddr)
  }

  // Checklist da OS do token
  let cl = null
  try {
    cl = $app.findFirstRecordByFilter('os_checklists', 'service_order_id = {:o}', {
      o: String(tok.get('service_order_id') || ''),
    })
  } catch (_) {
    cl = null
  }
  if (!cl) return e.json(404, { ok: false, error: 'checklist_not_found' })

  // Fotos já no servidor (a página do técnico recarrega e não perde a galeria)
  const media = []
  try {
    const mrecs = $app.findRecordsByFilter(
      'os_checklist_media',
      'checklist_id = {:c}',
      'created',
      500,
      0,
      { c: cl.id },
    )
    for (const m of mrecs) {
      const fname = String(m.get('file') || '')
      media.push({
        client_media_id: String(m.get('client_media_id') || ''),
        item_numero: Number(m.get('item_numero') || 0),
        etapa: Number(m.get('etapa') || 0),
        legenda: String(m.get('legenda') || ''),
        selecionada: !!m.get('selecionada'),
        ordem: Number(m.get('ordem') || 0),
        path: fname ? '/api/files/os_checklist_media/' + m.id + '/' + fname : '',
      })
    }
  } catch (_) {}

  // Identificação pré-preenchida: OS + cliente
  let so = null
  try {
    so = $app.findRecordById('service_orders', String(tok.get('service_order_id') || ''))
  } catch (_) {
    so = null
  }
  let clientAddr = ''
  let clientCity = ''
  if (so && String(so.get('client_id') || '')) {
    try {
      const c = $app.findRecordById('clients', String(so.get('client_id')))
      clientAddr = String(c.get('address') || '')
      clientCity = String(c.get('city') || '')
    } catch (_) {}
  }

  const osNumber = so
    ? String(so.get('order_number') || cl.get('os_number') || '')
    : String(cl.get('os_number') || '')
  const title = so ? String(so.get('title') || '') : ''
  const equipBrand = so ? String(so.get('equipment_brand') || '') : ''
  const equipModel = so ? String(so.get('equipment_model') || '') : ''

  return e.json(200, {
    ok: true,
    technician_name: String(tok.get('technician_name') || ''),
    os_number: osNumber,
    template: String(cl.get('template') || tok.get('template') || 'trocador'),
    status: String(cl.get('status') || 'rascunho'),
    conformity_pct: Number(cl.get('conformity_pct') || 0),
    verdict: String(cl.get('verdict') || ''),
    checklist: {
      id: cl.id,
      ident: cl.get('ident') || {},
      answers: cl.get('answers') || {},
      texts: cl.get('texts') || {},
      media: media,
      updated: String(cl.get('updated') || ''),
    },
    os: {
      order_number: osNumber,
      title: title,
      client_name: so
        ? String(so.get('client_name') || cl.get('client_name') || '')
        : String(cl.get('client_name') || ''),
      client_address: clientAddr,
      client_city: clientCity,
      equipment_brand: equipBrand,
      equipment_model: equipModel,
      assigned_to: so ? String(so.get('assigned_to') || '') : '',
    },
  })
})
