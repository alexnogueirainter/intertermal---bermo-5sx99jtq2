/**
 * Hook: Gera os checklists de uma OS e o link restrito do técnico.
 * Route (POST, autenticada): /backend/v1/checklists/generate
 * Body: { os_id, template?, items?: [{tag, label, template}] }
 *
 * MULTI-EQUIPAMENTO:
 * - Se body.items vier (modal informou), cria 1 checklist por item.
 * - Se não vier, lê service_orders.equipment_items (lista da proposta aprovada)
 *   e cria 1 checklist por item — template por tipo inferido do modelo/marca.
 * - OS sem lista e sem items: fallback = 1 checklist único (comportamento antigo).
 * - Idempotente: item já com checklist (mesma equipment_tag+label) não é duplicado;
 *   item novo ganha checklist novo. Token único por OS (1 código = 1 aparelho).
 * - Amarra checklist_id na OS (service_orders.checklist_id) no 1º checklist criado.
 */
routerAdd(
  'POST',
  '/backend/v1/checklists/generate',
  (e) => {
    const body = e.requestInfo().body || {}
    const osId = String(body.os_id || '').trim()
    const fallbackTemplate = String(body.template || 'trocador').trim()

    if (!osId) return e.json(400, { ok: false, error: 'missing_os_id' })

    let so = null
    try {
      so = $app.findRecordById('service_orders', osId)
    } catch (_) {
      so = null
    }
    if (!so) return e.json(404, { ok: false, error: 'os_not_found' })

    const osNumber = String(so.get('order_number') || '')
    const clientId = String(so.get('client_id') || '')
    let clientName = String(so.get('client_name') || '')
    if (!clientName && clientId) {
      try {
        const c = $app.findRecordById('clients', clientId)
        clientName = String(c.get('name') || '')
      } catch (_) {}
    }

    // ============================================================
    // Monta a lista de itens (equipamentos) da OS
    // ============================================================
    const items = []

    // 1) Itens informados pelo modal (fallback manual ou ajuste de tipo)
    const bodyItems = Array.isArray(body.items) ? body.items : []
    for (const bi of bodyItems) {
      const tag = String(bi?.tag || '').trim()
      const label = String(bi?.label || '').trim()
      const tpl = String(bi?.template || '').trim()
      if (!tag && !label) continue
      items.push({
        tag: tag,
        label: label,
        template: ['trocador', 'valvulas', 'purgadores'].indexOf(tpl) >= 0 ? tpl : 'trocador',
      })
    }

    // 2) Sem itens do modal → lê a lista da OS (equipment_items da proposta)
    if (items.length === 0) {
      let raw = null
      try {
        raw = so.get('equipment_items')
      } catch (_) {
        raw = null
      }
      let list = []
      if (raw && raw.byteLength !== undefined) {
        try {
          list = JSON.parse(new TextDecoder().decode(new Uint8Array(raw)))
        } catch (_) {
          list = []
        }
      } else if (Array.isArray(raw)) {
        if (raw.length > 0 && typeof raw[0] === 'number') {
          try {
            list = JSON.parse(new TextDecoder().decode(new Uint8Array(raw)))
          } catch (_) {
            list = []
          }
        } else {
          list = raw
        }
      } else if (typeof raw === 'string' && raw.trim()) {
        try {
          list = JSON.parse(raw)
        } catch (_) {
          list = []
        }
      }

      // Contadores para rótulos automáticos por tipo
      const counters = { trocador: 0, valvulas: 0, purgadores: 0 }
      const inferTemplate = (model, brand) => {
        const s = String(model || '') + ' ' + String(brand || '')
        const t = s.toLowerCase()
        if (/válvula|valve|safe|psv|ari-con|ari-trabon/.test(t)) return 'valvulas'
        if (/purgador|trap|vk\b|vs\b/.test(t)) return 'purgadores'
        return 'trocador'
      }
      const LABELS = { trocador: 'Trocador', valvulas: 'Válvula', purgadores: 'Purgador' }

      for (const it of list) {
        const tag = String(it?.tag || '').trim()
        const model = String(it?.model || '').trim()
        const brand = String(it?.brand || '').trim()
        if (!tag && !model) continue
        const tpl = inferTemplate(model, brand)
        counters[tpl]++
        const n = counters[tpl]
        items.push({
          tag: tag,
          label: (LABELS[tpl] + (n > 1 ? ' ' + n : '')).trim(),
          template: tpl,
        })
      }
    }

    // 3) Fallback: OS sem lista e sem itens do modal → 1 checklist único (comportamento antigo)
    if (items.length === 0) {
      items.push({ tag: '', label: '', template: fallbackTemplate })
    }

    // ============================================================
    // Idempotência: checklists existentes da OS (por tag+label)
    // ============================================================
    const existing = $app.findRecordsByFilter(
      'os_checklists',
      'service_order_id = {:o}',
      'created',
      500,
      0,
      { o: osId },
    )
    const existingKeys = new Set()
    for (const ex of existing) {
      existingKeys.add(
        String(ex.get('equipment_tag') || '') + '|' + String(ex.get('equipment_label') || ''),
      )
    }

    // ============================================================
    // Cria os checklists que faltam
    // ============================================================
    const col = $app.findCollectionByNameOrId('os_checklists')
    const created = []
    let firstId = existing.length > 0 ? existing[0].id : ''
    for (const it of items) {
      const key = String(it.tag || '') + '|' + String(it.label || '')
      if (existingKeys.has(key)) continue
      const rec = new Record(col)
      rec.set('service_order_id', osId)
      rec.set('os_number', osNumber)
      rec.set('template', it.template)
      rec.set('client_id', clientId)
      rec.set('client_name', clientName)
      rec.set('technician_name', String(so.get('assigned_to') || ''))
      rec.set('status', 'rascunho')
      rec.set('answers', {})
      rec.set('ident', {})
      rec.set('texts', {})
      rec.set('parts', [])
      rec.set('equipment_tag', it.tag)
      rec.set('equipment_label', it.label)
      $app.save(rec)
      created.push(rec.id)
      if (!firstId) firstId = rec.id
    }

    // ============================================================
    // Token único por OS (1 código = 1 aparelho)
    // ============================================================
    let token = ''
    try {
      const tok = $app.findFirstRecordByFilter(
        'checklist_tokens',
        'service_order_id = {:o} && active = true',
        { o: osId },
      )
      token = String(tok.get('token') || '')
    } catch (_) {
      const rand = () => {
        const abc = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
        let s = ''
        for (let i = 0; i < 4; i++) s += abc.charAt(Math.floor(Math.random() * abc.length))
        return s
      }
      token = 'CKL-' + rand() + '-' + rand()
      const colTok = $app.findCollectionByNameOrId('checklist_tokens')
      const recTok = new Record(colTok)
      recTok.set('token', token)
      recTok.set('service_order_id', osId)
      recTok.set('os_number', osNumber)
      recTok.set('technician_name', String(so.get('assigned_to') || ''))
      recTok.set('template', 'multi')
      recTok.set('active', true)
      $app.save(recTok)
    }

    // Amarra o 1º checklist na OS (compatibilidade com código existente)
    if (firstId && !String(so.get('checklist_id') || '')) {
      so.set('checklist_id', firstId)
      $app.save(so)
    }

    console.log(
      '[checklist] gerado | os=' +
        osNumber +
        ' | itens=' +
        items.length +
        ' | criados=' +
        created.length +
        ' | token=' +
        token,
    )

    return e.json(200, {
      ok: true,
      already: created.length === 0,
      checklist_id: firstId,
      created_count: created.length,
      total_checklists: existing.length + created.length,
      token: token,
      os_number: osNumber,
      template: 'multi',
      items: items,
    })
  },
  $apis.requireAuth(),
)
