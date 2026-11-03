/**
 * Hook: Upload de mídia (fotos/vídeos/áudios) da Visita a Campo direto para o servidor.
 * Routes:
 *   POST /backend/v1/field-visits/media/upload   (multipart: file + client_media_id + kind + ...)
 *   DELETE /backend/v1/field-visits/media/delete (query: client_media_id [+ token/device_id])
 * - IDEMPOTENTE por client_media_id: reenvio do mesmo arquivo NÃO duplica (devolve o existente).
 * - Modo vendedor: valida token ativo + aparelho vinculado (mesma régua do submit).
 * - O celular guarda só a referência; o arquivo mora aqui (coleção field_visit_media).
 * NOTA JSVM: toda a lógica vive DENTRO dos callbacks (sem funções top-level).
 */

routerAdd('POST', '/backend/v1/field-visits/media/upload', (e) => {
  const body = e.requestInfo().body || {}
  const clientMediaId = String(body.client_media_id || '').trim()
  const kind = String(body.kind || 'image')
  const originalName = String(body.original_name || '')
  const size = Number(body.size || 0)
  const clientVisitId = String(body.client_visit_id || '').trim()
  const token = String(body.token || '').trim()
  const deviceId = String(body.device_id || '').trim()

  if (!clientMediaId) return e.json(400, { ok: false, error: 'missing_client_media_id' })

  // Validação de token do vendedor (inline — JSVM não acessa funções top-level)
  let sellerName = ''
  if (token) {
    let rec = null
    try {
      rec = $app.findFirstRecordByFilter('field_visit_tokens', 'token = {:t} && active = true', {
        t: token,
      })
    } catch (_) {
      rec = null
    }
    if (!rec) {
      return e.json(403, { ok: false, error: 'invalid_token' })
    }
    const boundDevice = String(rec.get('device_id') || '')
    if (boundDevice && deviceId && boundDevice !== deviceId) {
      console.warn('[visita-media] APARELHO NAO AUTORIZADO | ip=' + e.request.remoteAddr)
      return e.json(403, { ok: false, error: 'device_not_authorized' })
    }
    sellerName = String(rec.get('seller_name') || '')
  }

  const uploaded = e.findUploadedFiles('file') || []
  if (uploaded.length === 0) return e.json(400, { ok: false, error: 'missing_file' })

  // Idempotência: mesmo client_media_id devolve o registro existente
  let existing = null
  try {
    existing = $app.findFirstRecordByFilter('field_visit_media', 'client_media_id = {:c}', {
      c: clientMediaId,
    })
  } catch (_) {
    existing = null
  }
  if (existing) {
    const fname = String(existing.get('file') || '')
    return e.json(200, {
      ok: true,
      already_uploaded: true,
      media_id: existing.id,
      client_media_id: clientMediaId,
      file_name: fname,
      path: '/api/files/field_visit_media/' + existing.id + '/' + fname,
    })
  }

  const col = $app.findCollectionByNameOrId('field_visit_media')
  const rec = new Record(col)
  rec.set('client_media_id', clientMediaId)
  rec.set('kind', kind)
  rec.set('original_name', originalName)
  rec.set('size', size)
  rec.set('client_visit_id', clientVisitId)
  rec.set('seller_token', token)
  rec.set('file', uploaded[0])
  $app.save(rec)

  const fname = String(rec.get('file') || '')
  console.log(
    '[visita-media] upload OK | id=' +
      rec.id +
      ' | kind=' +
      kind +
      ' | size=' +
      size +
      ' | visit=' +
      clientVisitId +
      ' | seller=' +
      sellerName +
      ' | ip=' +
      e.request.remoteAddr,
  )

  // Se a visita já foi enviada ao CRM, injeta o caminho do arquivo nos anexos
  // do registro (fecha o ciclo quando a mídia sobe DEPOIS do submit).
  if (clientVisitId) {
    try {
      const v = $app.findFirstRecordByFilter('field_visits', 'client_visit_id = {:c}', {
        c: clientVisitId,
      })
      let touched = false
      const fixAtts = (atts) => {
        for (const att of Array.isArray(atts) ? atts : []) {
          if (
            att &&
            String(att.id || '') === clientMediaId &&
            (!String(att.dataUrl || '') || att.uploadStatus === 'pendente')
          ) {
            att.dataUrl = '/api/files/field_visit_media/' + rec.id + '/' + fname
            att.uploadStatus = 'enviado'
            touched = true
          }
        }
      }
      const va = v.get('visit_attachments')
      if (Array.isArray(va)) {
        const copy = JSON.parse(JSON.stringify(va))
        fixAtts(copy)
        if (touched) v.set('visit_attachments', copy)
      }
      const eq = v.get('equipment')
      if (Array.isArray(eq)) {
        const eqCopy = JSON.parse(JSON.stringify(eq))
        for (const eqi of eqCopy) {
          if (eqi && Array.isArray(eqi.attachments)) fixAtts(eqi.attachments)
        }
        if (touched) v.set('equipment', eqCopy)
      }
      if (touched) $app.save(v)
    } catch (_) {}
  }

  return e.json(200, {
    ok: true,
    media_id: rec.id,
    client_media_id: clientMediaId,
    file_name: fname,
    path: '/api/files/field_visit_media/' + rec.id + '/' + fname,
  })
})

routerAdd('DELETE', '/backend/v1/field-visits/media/delete', (e) => {
  const q = e.requestInfo().query || {}
  const clientMediaId = String(q['client_media_id'] || '').trim()
  const token = String(q['token'] || '').trim()
  const deviceId = String(q['device_id'] || '').trim()

  if (!clientMediaId) return e.json(400, { ok: false, error: 'missing_client_media_id' })

  if (token) {
    let recTok = null
    try {
      recTok = $app.findFirstRecordByFilter('field_visit_tokens', 'token = {:t} && active = true', {
        t: token,
      })
    } catch (_) {
      recTok = null
    }
    if (!recTok) return e.json(403, { ok: false, error: 'invalid_token' })
    const boundDevice = String(recTok.get('device_id') || '')
    if (boundDevice && deviceId && boundDevice !== deviceId) {
      return e.json(403, { ok: false, error: 'device_not_authorized' })
    }
  }

  let rec = null
  try {
    rec = $app.findFirstRecordByFilter('field_visit_media', 'client_media_id = {:c}', {
      c: clientMediaId,
    })
  } catch (_) {
    rec = null
  }
  if (!rec) return e.json(200, { ok: true, deleted: false, reason: 'not_found' })

  // Vendedor só apaga mídia do próprio token
  const recToken = String(rec.get('seller_token') || '')
  if (recToken && token && recToken !== token) {
    return e.json(403, { ok: false, error: 'not_your_media' })
  }

  $app.delete(rec)
  console.log('[visita-media] delete OK | client_media_id=' + clientMediaId)
  return e.json(200, { ok: true, deleted: true })
})
