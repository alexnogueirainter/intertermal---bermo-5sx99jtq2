/**
 * Hook: Registro do aparelho do vendedor (nível médio de segurança).
 * Route: POST /backend/v1/field-visits/device/bind
 * Body: { token, device_id }
 * Regras:
 *  - Token inexistente/inativo -> 403 (não revela se existe ou não)
 *  - Token sem aparelho -> vincula o aparelho informado (primeiro uso)
 *  - Token já vinculado ao mesmo device_id -> ok (revalida)
 *  - Token vinculado a OUTRO device_id -> 403 + log de tentativa (rastreável)
 */
routerAdd('POST', '/backend/v1/field-visits/device/bind', (e) => {
  const body = e.requestInfo().body || {}
  const token = String(body.token || '').trim()
  const deviceId = String(body.device_id || '').trim()

  if (!token || !deviceId) {
    return e.json(400, { ok: false, error: 'missing_token_or_device' })
  }

  let rec = null
  try {
    rec = $app.findFirstRecordByFilter('field_visit_tokens', 'token = {:t} && active = true', {
      t: token,
    })
  } catch (_) {
    rec = null
  }

  if (!rec) {
    console.warn('[visita-vendedor] token inválido ou inativo usado no bind')
    return e.json(403, { ok: false, error: 'invalid_token' })
  }

  const boundDevice = String(rec.get('device_id') || '')
  const ip = String(e.request.remoteAddr || '')
  const ua = String((e.requestInfo().headers && e.requestInfo().headers['user_agent']) || '')

  if (boundDevice && boundDevice !== deviceId) {
    console.warn(
      '[visita-vendedor] TENTATIVA EM APARELHO NAO AUTORIZADO | vendedor=' +
        rec.get('seller_name') +
        ' | ip=' +
        ip,
    )
    return e.json(403, { ok: false, error: 'device_not_authorized' })
  }

  if (!boundDevice) {
    rec.set('device_id', deviceId)
    rec.set('device_ip', ip)
    rec.set('device_ua', ua)
    rec.set('bound_at', new Date().toISOString())
    $app.save(rec)
    console.log(
      '[visita-vendedor] Aparelho vinculado | vendedor=' + rec.get('seller_name') + ' | ip=' + ip,
    )
  }

  return e.json(200, {
    ok: true,
    seller_name: rec.get('seller_name'),
    device_bound: true,
  })
})
