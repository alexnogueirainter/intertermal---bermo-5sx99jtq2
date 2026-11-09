/**
 * DEBUG TEMPORÁRIO — remover após diagnóstico.
 * Route (POST, autenticada): /backend/v1/campaigns/debug
 * Reproduz o SEND passo a passo e reporta onde quebra.
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

    const steps = {}

    let raw = null
    try {
      raw = campaign.get('recipients')
      steps.get_ok = true
    } catch (err) {
      steps.get_ok = false
      steps.get_err = String(err)
      return e.json(200, { ok: true, steps: steps })
    }
    steps.raw_typeof = typeof raw
    steps.raw_is_array = Array.isArray(raw)
    steps.raw_len = raw && raw.length !== undefined ? raw.length : null

    const bytes = []
    try {
      for (const r0 of raw) {
        if (typeof r0 === 'number') bytes.push(r0)
        else if (typeof r0 === 'string') bytes.push(r0)
      }
      steps.loop_ok = true
    } catch (err) {
      steps.loop_ok = false
      steps.loop_err = String(err)
    }
    steps.bytes_len = bytes.length
    steps.all_numbers = bytes.length > 0 && bytes.every((b) => typeof b === 'number')

    let txt = null
    try {
      if (bytes.length > 0 && steps.all_numbers) {
        txt = new TextDecoder().decode(new Uint8Array(bytes))
        steps.decode_ok = true
      } else if (bytes.length > 0) {
        txt = bytes.join('')
        steps.decode_ok = true
      }
    } catch (err) {
      steps.decode_ok = false
      steps.decode_err = String(err)
    }
    steps.txt_preview = txt ? String(txt).slice(0, 120) : null

    let list = []
    try {
      list = JSON.parse(txt || '[]')
      steps.parse_ok = true
    } catch (err) {
      steps.parse_ok = false
      steps.parse_err = String(err)
    }
    steps.list_is_array = Array.isArray(list)
    steps.list_len = Array.isArray(list) ? list.length : null

    if (Array.isArray(list) && list.length > 0) {
      const first = list[0]
      steps.first_typeof = typeof first
      steps.first_email = first && first.email ? String(first.email) : null
    }

    // tenta criar 1 record de teste (sem salvar)
    try {
      const recCol = $app.findCollectionByNameOrId('campaign_recipients')
      steps.col_ok = true
      const p = new Record(recCol)
      steps.new_record_ok = true
    } catch (err) {
      steps.col_err = String(err)
    }

    return e.json(200, { ok: true, steps: steps })
  },
  $apis.requireAuth(),
)
