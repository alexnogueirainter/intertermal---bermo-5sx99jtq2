/**
 * Hook: Envio de visita a campo via link do vendedor (sem login).
 * Route: POST /backend/v1/field-visits/submit
 * Body: { token, device_id, visit: {...}, edit_id?, client_visit_id? }
 * - Valida token ativo + aparelho vinculado (nivel medio).
 * - IDEMPOTENTE: reenvio com mesmo client_visit_id atualiza em vez de duplicar.
 * - Edicao apenas da propria visita (seller_token = token).
 * - Loga IP e horario de cada envio (rastreabilidade).
 */
routerAdd('POST', '/backend/v1/field-visits/submit', (e) => {
  const body = e.requestInfo().body || {}
  const token = String(body.token || '').trim()
  const deviceId = String(body.device_id || '')
  const visit = body.visit || {}
  let editId = String(body.edit_id || '').trim()
  const clientVisitId = String(body.client_visit_id || '').trim()

  if (!token) return e.json(400, { ok: false, error: 'missing_token' })

  let rec = null
  try {
    rec = $app.findFirstRecordByFilter('field_visit_tokens', 'token = {:t} && active = true', {
      t: token,
    })
  } catch (_) {
    rec = null
  }

  if (!rec) {
    console.warn('[visita-vendedor] envio com token invalido | ip=' + e.request.remoteAddr)
    return e.json(403, { ok: false, error: 'invalid_token' })
  }

  const boundDevice = String(rec.get('device_id') || '')
  if (boundDevice && deviceId && boundDevice !== deviceId) {
    console.warn(
      '[visita-vendedor] TENTATIVA DE ENVIO EM APARELHO NAO AUTORIZADO | vendedor=' +
        rec.get('seller_name') +
        ' | ip=' +
        e.request.remoteAddr,
    )
    return e.json(403, { ok: false, error: 'device_not_authorized' })
  }

  if (!boundDevice && deviceId) {
    rec.set('device_id', deviceId)
    rec.set('device_ip', String(e.request.remoteAddr || ''))
    rec.set(
      'device_ua',
      String((e.requestInfo().headers && e.requestInfo().headers['user_agent']) || ''),
    )
    rec.set('bound_at', new Date().toISOString())
    $app.save(rec)
    console.log(
      '[visita-vendedor] Aparelho vinculado no primeiro envio | vendedor=' + rec.get('seller_name'),
    )
  }

  const sellerName = String(rec.get('seller_name') || '')
  const nowIso = new Date().toISOString()

  const payload = {
    employee_name: sellerName,
    visit_date: String(visit.visit_date || ''),
    start_time: String(visit.start_time || ''),
    end_time: String(visit.end_time || ''),
    duration: String(visit.duration || ''),
    client_name: String(visit.client_name || ''),
    company_name: String(visit.company_name || ''),
    contact_person: String(visit.contact_person || ''),
    client_role: String(visit.client_role || ''),
    client_contact: String(visit.client_contact || ''),
    client_email: String(visit.client_email || ''),
    work_area: String(visit.work_area || ''),
    work_type: String(visit.work_type || ''),
    work_type_other: String(visit.work_type_other || ''),
    general_notes: String(visit.general_notes || ''),
    free_description: String(visit.free_description || ''),
    action_plan: visit.action_plan || [],
    equipment: visit.equipment || [],
    status: 'enviada',
    sent_at: nowIso,
    seller_name: sellerName,
    seller_token: token,
    client_visit_id: clientVisitId,
  }

  // IDEMPOTENCIA: reenvio com mesmo client_visit_id atualiza em vez de duplicar.
  if (!editId && clientVisitId) {
    let dup = null
    try {
      dup = $app.findFirstRecordByFilter('field_visits', 'client_visit_id = {:c}', {
        c: clientVisitId,
      })
    } catch (_) {
      dup = null
    }
    if (dup) {
      const dupToken = String(dup.get('seller_token') || '')
      if (dupToken && dupToken !== token) {
        console.warn('[visita-vendedor] reenvio com client_visit_id de outro vendedor')
        return e.json(403, { ok: false, error: 'not_your_visit' })
      }
      editId = dup.id
    }
  }

  let saved = null
  if (editId) {
    let existing = null
    try {
      existing = $app.findRecordById('field_visits', editId)
    } catch (_) {
      existing = null
    }
    if (!existing) return e.json(404, { ok: false, error: 'visit_not_found' })

    const visitToken = String(existing.get('seller_token') || '')
    if (visitToken && visitToken !== token) {
      console.warn(
        '[visita-vendedor] TENTATIVA DE EDITAR VISITA DE OUTRO VENDEDOR | vendedor=' + sellerName,
      )
      return e.json(403, { ok: false, error: 'not_your_visit' })
    }

    for (const k of Object.keys(payload)) {
      existing.set(k, payload[k])
    }
    $app.save(existing)
    saved = existing
    console.log(
      '[visita-vendedor] Visita ATUALIZADA | vendedor=' +
        sellerName +
        ' | visita=' +
        editId +
        ' | ip=' +
        e.request.remoteAddr,
    )
  } else {
    const col = $app.findCollectionByNameOrId('field_visits')
    const newVisit = new Record(col)
    for (const k of Object.keys(payload)) {
      newVisit.set(k, payload[k])
    }
    if (clientVisitId) newVisit.set('client_visit_id', clientVisitId)
    $app.save(newVisit)
    saved = newVisit
    console.log(
      '[visita-vendedor] Visita CRIADA | vendedor=' + sellerName + ' | ip=' + e.request.remoteAddr,
    )
  }

  return e.json(200, {
    ok: true,
    visit_id: saved.id,
    seller_name: sellerName,
    edited: editId ? true : false,
  })
})
