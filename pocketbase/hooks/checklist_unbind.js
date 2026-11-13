/**
 * Hook: Libera o aparelho amarrado a um token de checklist.
 * Route (POST, autenticada): /backend/v1/checklists/unbind
 * Body: { token }
 * - Limpa device_id/ip/ua/bound_at do token — o próximo aparelho que abrir
 *   o link fica amarrado (regra 1 código = 1 aparelho preservada).
 * - Uso: técnico trocou de celular, ou o link foi aberto por engano num
 *   computador antes de ir pro campo.
 */
routerAdd(
  'POST',
  '/backend/v1/checklists/unbind',
  (e) => {
    const body = e.requestInfo().body || {}
    const token = String(body.token || '').trim()
    if (!token) return e.json(400, { ok: false, error: 'missing_token' })

    let tok = null
    try {
      tok = $app.findFirstRecordByFilter('checklist_tokens', 'token = {:t} && active = true', {
        t: token,
      })
    } catch (_) {
      tok = null
    }
    if (!tok) return e.json(404, { ok: false, error: 'invalid_token' })

    tok.set('device_id', '')
    tok.set('device_ip', '')
    tok.set('device_ua', '')
    tok.set('bound_at', '')
    $app.save(tok)

    console.log('[checklist] aparelho liberado | token=' + token)
    return e.json(200, { ok: true })
  },
  $apis.requireAuth(),
)
