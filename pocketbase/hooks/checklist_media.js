/**
 * Hook: Upload de fotos do checklist (marca d'água aplicada no celular).
 * Route (POST, público com token): /backend/v1/checklists/media/upload
 * Body (multipart): file + client_media_id + kind + item_numero + etapa + legenda + token + device_id + checklist_id
 * - IDEMPOTENTE por client_media_id: reenvio do mesmo arquivo NÃO duplica.
 * - Mesma régua de token/aparelho do open/save. Arquivo mora em os_checklist_media.
 * NOTA JSVM: toda a lógica vive DENTRO dos callbacks (sem funções top-level).
 */
routerAdd('POST', '/backend/v1/checklists/media/upload', (e) => {
  const body = e.requestInfo().body || {}
  const clientMediaId = String(body.client_media_id || '').trim()
  const kind = String(body.kind || 'image')
  const originalName = String(body.original_name || '')
  const size = Number(body.size || 0)
  const itemNumero = Number(body.item_numero || 0)
  const etapa = Number(body.etapa || 0)
  const legenda = String(body.legenda || '')
  const token = String(body.token || '').trim()
  const deviceId = String(body.device_id || '').trim()
  const checklistId = String(body.checklist_id || '').trim()

  if (!clientMediaId) return e.json(400, { ok: false, error: 'missing_client_media_id' })

  // Validação de token (inline — JSVM não acessa funções top-level)
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
    console.warn('[checklist-media] APARELHO NAO AUTORIZADO | ip=' + e.request.remoteAddr)
    return e.json(403, { ok: false, error: 'device_not_authorized' })
  }

  const uploaded = e.findUploadedFiles('file') || []
  if (uploaded.length === 0) return e.json(400, { ok: false, error: 'missing_file' })

  // Idempotência: mesmo client_media_id devolve o registro existente
  let existing = null
  try {
    existing = $app.findFirstRecordByFilter('os_checklist_media', 'client_media_id = {:c}', {
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
      path: '/api/files/os_checklist_media/' + existing.id + '/' + fname,
    })
  }

  const col = $app.findCollectionByNameOrId('os_checklist_media')
  const rec = new Record(col)
  rec.set('client_media_id', clientMediaId)
  rec.set('kind', kind)
  rec.set('original_name', originalName)
  rec.set('size', size)
  rec.set('checklist_id', checklistId || String(tok.get('service_order_id') || ''))
  rec.set('item_numero', itemNumero)
  rec.set('etapa', etapa)
  rec.set('legenda', legenda)
  rec.set('selecionada', true)
  rec.set('ordem', 0)
  rec.set('file', uploaded[0])
  $app.save(rec)

  const fname = String(rec.get('file') || '')
  console.log(
    '[checklist-media] upload OK | id=' +
      rec.id +
      ' | kind=' +
      kind +
      ' | size=' +
      size +
      ' | checklist=' +
      checklistId +
      ' | item=' +
      itemNumero +
      ' | etapa=' +
      etapa,
  )

  return e.json(200, {
    ok: true,
    media_id: rec.id,
    client_media_id: clientMediaId,
    file_name: fname,
    path: '/api/files/os_checklist_media/' + rec.id + '/' + fname,
  })
})

routerAdd('DELETE', '/backend/v1/checklists/media/delete', (e) => {
  const q = e.requestInfo().query || {}
  const clientMediaId = String(q['client_media_id'] || '').trim()
  const token = String(q['token'] || '').trim()
  const deviceId = String(q['device_id'] || '').trim()

  if (!clientMediaId) return e.json(400, { ok: false, error: 'missing_client_media_id' })

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
    return e.json(403, { ok: false, error: 'device_not_authorized' })
  }

  let rec = null
  try {
    rec = $app.findFirstRecordByFilter('os_checklist_media', 'client_media_id = {:c}', {
      c: clientMediaId,
    })
  } catch (_) {
    rec = null
  }
  if (!rec) return e.json(200, { ok: true, deleted: false, reason: 'not_found' })

  $app.delete(rec)
  console.log('[checklist-media] delete OK | client_media_id=' + clientMediaId)
  return e.json(200, { ok: true, deleted: true })
})
