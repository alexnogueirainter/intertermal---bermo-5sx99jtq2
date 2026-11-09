/**
 * DEBUG TEMPORÁRIO — remover após diagnóstico.
 * Route (POST, autenticada): /backend/v1/campaigns/debug
 * Body: { campaign_id } — imprime o tipo real de recipients no JSVM.
 */
routerAdd(
  'POST',
  '/backend/v1/campaigns/debug',
  (e) => {
    const body = e.requestInfo().body || {}
    const campaignId = String(body.campaign_id || '')
    let campaign = null
    try {
      campaign = $app.findRecordById('campaigns', campaignId)
    } catch (_) {
      campaign = null
    }
    if (!campaign) return e.json(404, { ok: false, error: 'não achou' })

    const raw = campaign.get('recipients')
    const info = {
      typeof_raw: typeof raw,
      is_array: Array.isArray(raw),
      is_null: raw === null,
      string_preview: typeof raw === 'string' ? String(raw).slice(0, 120) : null,
      length: raw && raw.length !== undefined ? raw.length : null,
      keys:
        raw && typeof raw === 'object' && !Array.isArray(raw)
          ? Object.keys(raw).slice(0, 10)
          : null,
    }

    let parsed = raw
    if (typeof parsed === 'string') {
      try {
        parsed = JSON.parse(parsed)
      } catch (err) {
        info.parse_error = String(err)
        parsed = null
      }
    }
    info.parsed_typeof = typeof parsed
    info.parsed_is_array = Array.isArray(parsed)
    if (Array.isArray(parsed) && parsed.length > 0) {
      const first = parsed[0]
      info.first_typeof = typeof first
      info.first_is_array = Array.isArray(first)
      info.first_email = first && first.email ? String(first.email) : null
      if (typeof first === 'string') info.first_preview = String(first).slice(0, 120)
    }

    return e.json(200, { ok: true, info: info })
  },
  $apis.requireAuth(),
)
