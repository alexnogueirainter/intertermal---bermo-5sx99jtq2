routerAdd(
  'POST',
  '/backend/v1/intertermal/equipment-official-research',
  (e) => {
    const body = e.requestInfo().body || {}
    const requestedModel = String(body.model || '').trim()
    const requestedBrand = String(body.brand || '').trim()
    const customQuery = String(body.query || '').trim()

    if (!requestedModel && !customQuery) {
      return e.json(400, {
        success: false,
        found: false,
        status: 'invalid_request',
        results: [],
        message: 'Modelo ou consulta é obrigatório.',
      })
    }

    const model = requestedModel || customQuery
    const normalizedBrand = requestedBrand.toLowerCase()
    const researchCollection = $app.findCollectionByNameOrId('equipment_researches')
    const candidateCollection = $app.findCollectionByNameOrId('equipment_research_candidates')
    let researchRecord = null
    const requestedBy = e.auth ? String(e.auth.id || '') : ''

    try {
      researchRecord = new Record(researchCollection)
      researchRecord.set('requested_model', model)
      researchRecord.set('requested_brand', requestedBrand)
      researchRecord.set('query', customQuery || model)
      researchRecord.set('status', 'searching')
      researchRecord.set('requested_by', requestedBy)
      researchRecord.set('results_json', [])
      $app.save(researchRecord)
    } catch (persistErr) {
      $app.logger().error('Falha ao registrar pesquisa técnica', 'error', String(persistErr))
    }

    const researchId = researchRecord ? String(researchRecord.id || '') : ''
    const emptyResponse = (status, message) => {
      if (researchRecord) {
        try {
          researchRecord.set('status', status)
          researchRecord.set('results_json', [])
          researchRecord.set('completed_at', new Date().toISOString())
          researchRecord.set('error_message', status === 'unavailable' ? message : '')
          $app.save(researchRecord)
        } catch (persistErr) {
          $app.logger().error('Falha ao atualizar pesquisa técnica', 'error', String(persistErr))
        }
      }
      return e.json(200, {
        success: true,
        found: false,
        status,
        model,
        brand: requestedBrand || 'BERMO',
        totalResults: 0,
        results: [],
        recommendedSpecs: null,
        message,
        researchId,
      })
    }

    // Esta primeira fonte oficial é restrita ao site da BERMO.
    // Outros fabricantes entram em etapas posteriores, com fontes próprias.
    if (normalizedBrand && normalizedBrand !== 'bermo' && normalizedBrand !== 'outro') {
      return emptyResponse(
        'not_found',
        'Nenhuma fonte oficial configurada para esta marca nesta etapa. Os campos técnicos permanecem vazios.',
      )
    }

    const catalogUrl = 'https://bermo.com.br/produtos/troca-termica'
    let catalogResponse
    try {
      catalogResponse = $http.send({
        url: catalogUrl,
        method: 'GET',
        headers: {
          Accept: 'text/html,application/xhtml+xml',
          'User-Agent': 'Intertermal-Technical-Research/1.0',
        },
        timeout: 20,
      })
    } catch (httpErr) {
      $app.logger().error('Falha de transporte na fonte BERMO', 'error', String(httpErr))
      return emptyResponse(
        'unavailable',
        'A fonte oficial da BERMO não pôde ser consultada agora. Tente novamente.',
      )
    }

    if (!catalogResponse || catalogResponse.statusCode !== 200) {
      const statusCode = catalogResponse ? catalogResponse.statusCode : 0
      $app.logger().warn('Fonte BERMO indisponível', 'statusCode', statusCode)
      return emptyResponse(
        'unavailable',
        'A fonte oficial da BERMO não pôde ser validada agora. Tente novamente.',
      )
    }

    let html = ''
    try {
      html = new TextDecoder('utf-8').decode(catalogResponse.body || new Uint8Array())
    } catch (decodeErr) {
      $app.logger().error('Falha ao ler resposta HTML da BERMO', 'error', String(decodeErr))
      return emptyResponse('unavailable', 'Não foi possível ler a fonte oficial da BERMO.')
    }

    const parts = model
      .toUpperCase()
      .trim()
      .split(/[\s\-_]+/)
      .filter((part) => part.length > 0)
      .map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    const modelPattern = parts.length > 0 ? parts.join('[^A-Z0-9]*') : ''
    const exactModelPattern = modelPattern
      ? new RegExp('(^|[^A-Z0-9])' + modelPattern + '([^A-Z0-9]|$)', 'i')
      : null
    const linkPattern = /<a\b[^>]*href\s*=\s*["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi
    const results = []
    let linkMatch

    while ((linkMatch = linkPattern.exec(html)) !== null) {
      const rawHref = String(linkMatch[1] || '').trim()
      const label = String(linkMatch[2] || '')
        .replace(/<[^>]*>/g, ' ')
        .replace(/&nbsp;|&#160;/gi, ' ')
        .replace(/&amp;/gi, '&')
        .replace(/&quot;/gi, '"')
        .replace(/&#39;|&apos;/gi, "'")
        .replace(/\s+/g, ' ')
        .trim()

      if (!rawHref || rawHref.indexOf('/produtos/detalhes/') === -1) continue
      const href = rawHref.startsWith('http')
        ? rawHref
        : 'https://bermo.com.br' + (rawHref.startsWith('/') ? rawHref : '/' + rawHref)
      if (href.indexOf('https://bermo.com.br/') !== 0) continue

      const searchable = `${href} ${label}`.toUpperCase()
      if (!exactModelPattern || !exactModelPattern.test(searchable)) continue

      let duplicate = false
      for (const existing of results) {
        if (existing.url === href) duplicate = true
      }
      if (duplicate) continue

      // Confirma que a página específica também está acessível antes de criar o candidato.
      let detailResponse
      try {
        detailResponse = $http.send({
          url: href,
          method: 'GET',
          headers: {
            Accept: 'text/html,application/xhtml+xml',
            'User-Agent': 'Intertermal-Technical-Research/1.0',
          },
          timeout: 20,
        })
      } catch (detailErr) {
        continue
      }
      if (!detailResponse || detailResponse.statusCode !== 200) continue

      const result = {
        id: `official-${Date.now()}-${results.length + 1}`,
        sourceType: 'official_product_page',
        title: label || `BERMO ${model}`,
        url: href,
        snippet: 'Página oficial do fabricante localizada. Extração técnica pendente de revisão.',
        brand: 'BERMO',
        model,
        badge: 'Fonte oficial BERMO',
        specs: null,
        evidence: {
          source_url: href,
          source_catalog_url: catalogUrl,
          extraction_status: 'pending',
        },
      }
      results.push(result)

      try {
        const candidate = new Record(candidateCollection)
        candidate.set('research_id', researchId)
        candidate.set('source_url', href)
        candidate.set('source_title', result.title)
        candidate.set('source_type', result.sourceType)
        candidate.set('source_domain', 'bermo.com.br')
        candidate.set('resolved_brand', 'BERMO')
        candidate.set('resolved_model', model)
        candidate.set('match_status', 'exact')
        candidate.set('confirmed_specs', {})
        candidate.set('evidence', result.evidence)
        candidate.set('approval_status', 'needs_review')
        $app.save(candidate)
        result.id = String(candidate.id || result.id)
      } catch (persistErr) {
        $app.logger().error('Falha ao registrar candidato técnico', 'error', String(persistErr))
      }
    }

    const status = results.length > 0 ? 'found' : 'not_found'
    const message =
      results.length > 0
        ? `Fonte oficial da BERMO localizada para "${model}". Revise antes de extrair ou aplicar dados.`
        : `Nenhuma página oficial da BERMO foi localizada para "${model}". Os campos técnicos permanecem vazios.`

    if (researchRecord) {
      try {
        researchRecord.set('status', status)
        researchRecord.set('results_json', results)
        researchRecord.set('completed_at', new Date().toISOString())
        $app.save(researchRecord)
      } catch (persistErr) {
        $app.logger().error('Falha ao concluir pesquisa técnica', 'error', String(persistErr))
      }
    }

    return e.json(200, {
      success: true,
      found: results.length > 0,
      status,
      model,
      brand: 'BERMO',
      totalResults: results.length,
      results,
      recommendedSpecs: null,
      message,
      researchId,
    })
  },
  $apis.requireAuth(),
)
