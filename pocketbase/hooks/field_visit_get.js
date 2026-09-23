/**
 * Hook: Busca UMA visita do próprio vendedor para edição.
 * Route: GET /backend/v1/field-visits/get?id={id}&token={token}&device_id={device}
 * - Valida token + aparelho. Só retorna se a visita foi enviada pelo MESMO token.
 */
routerAdd('GET', '/backend/v1/field-visits/get', (e) => {
  const q = e.requestInfo().query || {}
  const id = String(q['id'] || '').trim()
  const token = String(q['token'] || '').trim()
  const deviceId = String(q['device_id'] || '').trim()

  if (!id || !token) return e.json(400, { ok: false, error: 'missing_params' })

  let rec = null
  try {
    rec = $app.findFirstRecordByFilter('field_visit_tokens', 'token = {:t} && active = true', {
      t: token,
    })
  } catch (_) {
    rec = null
  }

  if (!rec) return e.json(403, { ok: false, error: 'invalid_token' })

  const boundDevice = String(rec.get('device_id') || '')
  if (boundDevice && deviceId && boundDevice !== deviceId) {
    console.warn('[visita-vendedor] TENTATIVA DE LEITURA EM APARELHO NAO AUTORIZADO')
    return e.json(403, { ok: false, error: 'device_not_authorized' })
  }

  let visit = null
  try {
    visit = $app.findRecordById('field_visits', id)
  } catch (_) {
    visit = null
  }
  if (!visit) return e.json(404, { ok: false, error: 'visit_not_found' })

  const visitToken = String(visit.get('seller_token') || '')
  if (visitToken && visitToken !== token) {
    console.warn(
      '[visita-vendedor] TENTATIVA DE LER VISITA DE OUTRO VENDEDOR | vendedor=' +
        rec.get('seller_name'),
    )
    return e.json(403, { ok: false, error: 'not_your_visit' })
  }

  return e.json(200, {
    ok: true,
    seller_name: rec.get('seller_name'),
    visit: {
      id: visit.id,
      employee_name: visit.get('employee_name'),
      visit_date: visit.get('visit_date'),
      start_time: visit.get('start_time'),
      end_time: visit.get('end_time'),
      duration: visit.get('duration'),
      client_name: visit.get('client_name'),
      company_name: visit.get('company_name'),
      contact_person: visit.get('contact_person'),
      client_role: visit.get('client_role'),
      client_contact: visit.get('client_contact'),
      client_email: visit.get('client_email'),
      work_area: visit.get('work_area'),
      work_type: visit.get('work_type'),
      work_type_other: visit.get('work_type_other'),
      general_notes: visit.get('general_notes'),
      free_description: visit.get('free_description'),
      action_plan: visit.get('action_plan'),
      equipment: visit.get('equipment'),
      status: visit.get('status'),
      sent_at: visit.get('sent_at'),
      created: visit.get('created'),
      updated: visit.get('updated'),
    },
  })
})
