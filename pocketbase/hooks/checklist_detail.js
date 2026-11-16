/**
 * Hook: Detalhe completo de um checklist para o escritório.
 * Route (GET, autenticada): /backend/v1/checklists/detail?id=<checklist_id>
 * - Devolve o checklist completo: identificação, respostas, textos, peças,
 *   fotos (os_checklist_media) e rastreabilidade (token/aparelho/datas).
 * - Uso: tela "Checklists Recebidos" (visão operacional do escritório).
 */
routerAdd(
  'GET',
  '/backend/v1/checklists/detail',
  (e) => {
    const q = e.requestInfo().query || {}
    const id = String(q['id'] || '').trim()
    if (!id) return e.json(400, { ok: false, error: 'missing_id' })

    let cl = null
    try {
      cl = $app.findRecordById('os_checklists', id)
    } catch (_) {
      cl = null
    }
    if (!cl) return e.json(404, { ok: false, error: 'checklist_not_found' })

    // Peças (JSONField pode voltar como bytes/array/string)
    let parts = []
    try {
      const pr = cl.get('parts')
      if (pr && pr.byteLength !== undefined) {
        parts = JSON.parse(new TextDecoder().decode(new Uint8Array(pr)))
      } else if (Array.isArray(pr)) {
        if (pr.length > 0 && typeof pr[0] === 'number') {
          parts = JSON.parse(new TextDecoder().decode(new Uint8Array(pr)))
        } else {
          parts = pr
        }
      } else if (typeof pr === 'string' && pr.trim()) {
        parts = JSON.parse(pr)
      }
    } catch (_) {
      parts = []
    }
    if (!Array.isArray(parts)) parts = []

    // Fotos
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

    // Rastreabilidade: token/aparelho da OS
    const osId = String(cl.get('service_order_id') || '')
    let trace = { device_bound_at: '', device_ip: '', device_ua: '' }
    try {
      const tok = $app.findFirstRecordByFilter(
        'checklist_tokens',
        'service_order_id = {:o} && active = true',
        { o: osId },
      )
      trace = {
        device_bound_at: String(tok.get('bound_at') || ''),
        device_ip: String(tok.get('device_ip') || ''),
        device_ua: String(tok.get('device_ua') || ''),
      }
    } catch (_) {}

    // Respostas/textos/ident (mesmo tratamento de JSON)
    const parseJson = (raw, fallback) => {
      try {
        if (raw && raw.byteLength !== undefined) {
          return JSON.parse(new TextDecoder().decode(new Uint8Array(raw)))
        }
        if (Array.isArray(raw)) {
          if (raw.length > 0 && typeof raw[0] === 'number') {
            return JSON.parse(new TextDecoder().decode(new Uint8Array(raw)))
          }
          return raw
        }
        if (typeof raw === 'string' && raw.trim()) return JSON.parse(raw)
      } catch (_) {}
      return fallback
    }

    return e.json(200, {
      ok: true,
      checklist: {
        id: cl.id,
        service_order_id: osId,
        os_number: String(cl.get('os_number') || ''),
        template: String(cl.get('template') || 'trocador'),
        client_name: String(cl.get('client_name') || ''),
        technician_name: String(cl.get('technician_name') || ''),
        equipment_tag: String(cl.get('equipment_tag') || ''),
        equipment_label: String(cl.get('equipment_label') || ''),
        status: String(cl.get('status') || 'rascunho'),
        conformity_pct: Number(cl.get('conformity_pct') || 0),
        verdict: String(cl.get('verdict') || ''),
        economia_ano: Number(cl.get('economia_ano') || 0),
        completed_at: String(cl.get('completed_at') || ''),
        created: String(cl.get('created') || ''),
        updated: String(cl.get('updated') || ''),
        ident: parseJson(cl.get('ident'), {}),
        answers: parseJson(cl.get('answers'), {}),
        texts: parseJson(cl.get('texts'), {}),
        parts: parts,
        media: media,
        trace: trace,
      },
    })
  },
  $apis.requireAuth(),
)
