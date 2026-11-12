/**
 * Hook: Autosave e conclusão do checklist pelo técnico (link restrito).
 * Route (POST, público com token): /backend/v1/checklists/save
 * Body: { token, device_id, action: 'autosave' | 'complete', ident?, answers?, texts?, conformity_pct?, verdict?, economia_ano? }
 * - autosave: salva o estado parcial (status continua rascunho).
 * - complete: marca concluído, grava veredito/conformidade/economia e COMPLETA
 *   a regra dos 3 momentos na OS (status → completed com mudança real).
 * - Valida token ativo + aparelho (1 código = 1 aparelho).
 */
routerAdd('POST', '/backend/v1/checklists/save', (e) => {
  const body = e.requestInfo().body || {}
  const token = String(body.token || '').trim()
  const deviceId = String(body.device_id || '').trim()
  const action = String(body.action || 'autosave').trim()

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
    console.warn('[checklist] TENTATIVA DE SALVAR EM APARELHO NAO AUTORIZADO')
    return e.json(403, { ok: false, error: 'device_not_authorized' })
  }

  let cl = null
  try {
    cl = $app.findFirstRecordByFilter('os_checklists', 'service_order_id = {:o}', {
      o: String(tok.get('service_order_id') || ''),
    })
  } catch (_) {
    cl = null
  }
  if (!cl) return e.json(404, { ok: false, error: 'checklist_not_found' })

  // Autosave parcial
  if (body.ident !== undefined) cl.set('ident', body.ident)
  if (body.answers !== undefined) cl.set('answers', body.answers)
  if (body.texts !== undefined) cl.set('texts', body.texts)

  if (action === 'complete') {
    cl.set('status', 'concluido')
    cl.set('conformity_pct', Number(body.conformity_pct || 0))
    cl.set('verdict', String(body.verdict || 'pendente'))
    if (body.economia_ano !== undefined && body.economia_ano !== null && body.economia_ano !== '') {
      cl.set('economia_ano', Number(body.economia_ano || 0))
    }
    cl.set('completed_at', new Date().toISOString())

    // Regra dos 3 momentos na OS: conclusão do checklist = mudança real de status
    try {
      const so = $app.findRecordById('service_orders', String(tok.get('service_order_id') || ''))
      const current = String(so.get('status') || '')
      const terminal = ['fechado', 'completed', 'cancelled', 'rejected']
      const isTerminal = terminal.indexOf(current.toLowerCase()) >= 0
      if (!isTerminal) {
        // status_history: append com justificativa (mesmo padrão da regra do funil)
        let hist = []
        try {
          const raw = so.get('status_history')
          hist = typeof raw === 'string' ? JSON.parse(raw || '[]') : Array.isArray(raw) ? raw : []
        } catch (_) {
          hist = []
        }
        hist.push({
          from: current,
          to: 'completed',
          at: new Date().toISOString(),
          by: 'checklist',
          reason:
            'Checklist concluído pelo técnico — veredito ' + String(body.verdict || 'pendente'),
        })
        so.set('status', 'completed')
        so.set('status_history', hist)
        $app.save(so)
      }
    } catch (err) {
      console.warn('[checklist] falha ao atualizar OS: ' + (err && err.message ? err.message : ''))
    }
  }

  $app.save(cl)

  return e.json(200, {
    ok: true,
    status: String(cl.get('status') || ''),
    conformity_pct: Number(cl.get('conformity_pct') || 0),
    verdict: String(cl.get('verdict') || ''),
    updated: String(cl.get('updated') || ''),
  })
})
