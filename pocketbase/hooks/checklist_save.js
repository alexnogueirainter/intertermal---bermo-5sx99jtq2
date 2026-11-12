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
  if (body.parts !== undefined) cl.set('parts', body.parts)

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
        // status_history: append com justificativa (mesmo padrão da regra do funil).
        // JSONField no JSVM pode voltar como array de bytes, string ou array —
        // cobre os três e grava o objeto direto (PocketBase serializa).
        let hist = []
        try {
          const raw = so.get('status_history')
          if (raw && raw.byteLength !== undefined) {
            hist = JSON.parse(new TextDecoder().decode(new Uint8Array(raw)))
          } else if (Array.isArray(raw)) {
            // JSVM pode devolver JSON como array de BYTES (números) — decodificar
            if (raw.length > 0 && typeof raw[0] === 'number') {
              hist = JSON.parse(new TextDecoder().decode(new Uint8Array(raw)))
            } else {
              hist = raw
            }
          } else if (typeof raw === 'string' && raw.trim()) {
            hist = JSON.parse(raw)
          }
        } catch (_) {
          hist = []
        }
        if (!Array.isArray(hist)) hist = []
        hist.push({
          from: current,
          to: 'completed',
          at: new Date().toISOString(),
          by: 'checklist',
          reason:
            'Checklist concluído pelo técnico — veredito ' + String(body.verdict || 'pendente'),
        })
        so.set('status', 'completed')
        so.set('status_history', JSON.stringify(hist))
        $app.save(so)
      }
    } catch (err) {
      console.warn('[checklist] falha ao atualizar OS: ' + (err && err.message ? err.message : ''))
    }

    // ============================================================
    // Peças do checklist → relatório de execução (margem realizada)
    // Só peças COM custo unitário informado entram no custo real
    // (regra do Alex: não inventar número). Sem custo, fica no
    // relatório como item sem custo, para o escritório completar.
    // ============================================================
    try {
      const partsRaw = cl.get('parts')
      let parts = []
      if (partsRaw && partsRaw.byteLength !== undefined) {
        parts = JSON.parse(new TextDecoder().decode(new Uint8Array(partsRaw)))
      } else if (Array.isArray(partsRaw)) {
        if (partsRaw.length > 0 && typeof partsRaw[0] === 'number') {
          parts = JSON.parse(new TextDecoder().decode(new Uint8Array(partsRaw)))
        } else {
          parts = partsRaw
        }
      } else if (typeof partsRaw === 'string' && partsRaw.trim()) {
        parts = JSON.parse(partsRaw)
      }
      if (!Array.isArray(parts)) parts = []
      const comCusto = parts.filter(
        (p) =>
          p &&
          String(p.description || '').trim() &&
          Number(p.unit_cost) > 0 &&
          Number(p.quantity) > 0,
      )

      const osId = String(tok.get('service_order_id') || '')
      const os = $app.findRecordById('service_orders', osId)
      const osNumber = String(os.get('order_number') || cl.get('os_number') || '')

      // Relatório de execução da OS (criado pelo checklist ou já existente)
      let rep = null
      try {
        rep = $app.findFirstRecordByFilter(
          'os_execution_reports',
          'service_order_id = {:o} && created_by = {:by}',
          { o: osId, by: 'checklist' },
        )
      } catch (_) {
        rep = null
      }
      if (!rep) {
        rep = new Record($app.findCollectionByNameOrId('os_execution_reports'))
        rep.set('service_order_id', osId)
        rep.set('order_number', osNumber)
        rep.set('client_id', String(os.get('client_id') || ''))
        rep.set('client_name', String(os.get('client_name') || ''))
        rep.set('created_by', 'checklist')
        rep.set(
          'work_start_datetime',
          new Date().toISOString().slice(0, 16).replace('T', ' ') + ':00',
        )
      }
      rep.set('equipment_model', String(os.get('equipment_model') || ''))
      let eqTag = ''
      try {
        const eqInfo = os.get('equipment_info')
        if (eqInfo && eqInfo.byteLength !== undefined) {
          eqTag = String(JSON.parse(new TextDecoder().decode(new Uint8Array(eqInfo))).tag || '')
        } else if (eqInfo && typeof eqInfo === 'object') {
          eqTag = String(eqInfo.tag || '')
        }
      } catch (_) {
        eqTag = ''
      }
      rep.set('equipment_tag', eqTag)
      rep.set('technician_name', String(cl.get('technician_name') || ''))

      // materials_used: peças do checklist + observação de origem
      const mats = []
      for (const p of comCusto) {
        mats.push({
          id: 'chk-' + (p.id || mats.length + 1),
          description: String(p.description || '').trim(),
          quantity: Number(p.quantity),
          unit: String(p.unit || 'un'),
          unit_cost: Number(p.unit_cost),
          notes: 'Peça lançada no checklist de campo',
        })
      }
      // Peças SEM custo: entram sem unit_cost (não afetam a margem) para o escritório completar
      const semCusto = parts.filter(
        (p) =>
          p &&
          String(p.description || '').trim() &&
          !(Number(p.unit_cost) > 0) &&
          Number(p.quantity) > 0,
      )
      for (const p of semCusto) {
        mats.push({
          id: 'chk-' + (p.id || mats.length + 1),
          description: String(p.description || '').trim(),
          quantity: Number(p.quantity),
          unit: String(p.unit || 'un'),
          notes: 'Peça do checklist SEM custo informado — completar no escritório',
        })
      }
      rep.set('materials_used', mats)
      rep.set(
        'observations',
        'Relatório gerado automaticamente do checklist de campo concluído em ' +
          new Date().toLocaleString('pt-BR') +
          '. Peças sem custo ficam marcadas para completar no escritório.',
      )
      $app.save(rep)
      console.log(
        '[checklist] relatório de execução sincronizado | os=' +
          osNumber +
          ' | peças com custo=' +
          comCusto.length +
          ' | sem custo=' +
          semCusto.length,
      )
    } catch (err) {
      console.warn(
        '[checklist] falha ao sincronizar peças no relatório de execução: ' +
          (err && err.message ? err.message : ''),
      )
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
