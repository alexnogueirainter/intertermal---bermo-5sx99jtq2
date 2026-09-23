/**
 * Hook: Lista as visitas do próprio vendedor (para a tela "Minhas visitas").
 * Route: GET /backend/v1/field-visits/mine
 * Headers/Query: token, device_id
 * - Valida token + aparelho. Retorna SOMENTE visitas com seller_token = token.
 * - Campos leves (sem equipamentos/fotos) para carregar rápido no celular.
 */
routerAdd('GET', '/backend/v1/field-visits/mine', (e) => {
  const token = String((e.requestInfo().query && e.requestInfo().query['token']) || '').trim()
  const deviceId = String(
    (e.requestInfo().query && e.requestInfo().query['device_id']) || '',
  ).trim()

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
    console.warn('[visita-vendedor] listagem com token invalido | ip=' + e.request.remoteAddr)
    return e.json(403, { ok: false, error: 'invalid_token' })
  }

  const boundDevice = String(rec.get('device_id') || '')
  if (boundDevice && deviceId && boundDevice !== deviceId) {
    console.warn(
      '[visita-vendedor] TENTATIVA DE LISTAGEM EM APARELHO NAO AUTORIZADO | vendedor=' +
        rec.get('seller_name'),
    )
    return e.json(403, { ok: false, error: 'device_not_authorized' })
  }

  const visits = $app.findRecordsByFilter(
    'field_visits',
    'seller_token = {:t}',
    '-created',
    100,
    0,
    { t: token },
  )

  const items = []
  for (const v of visits) {
    items.push({
      id: v.id,
      visit_date: v.get('visit_date'),
      client_name: v.get('client_name'),
      company_name: v.get('company_name'),
      work_type: v.get('work_type'),
      status: v.get('status'),
      sent_at: v.get('sent_at'),
      updated: v.get('updated'),
    })
  }

  return e.json(200, {
    ok: true,
    seller_name: rec.get('seller_name'),
    visits: items,
  })
})
