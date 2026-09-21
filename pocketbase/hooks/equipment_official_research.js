routerAdd('POST', '/backend/v1/intertermal/equipment-official-research', (e) => {
  let body = {}
  try {
    body = e.requestInfo().body || {}
  } catch (_) {
    body = {}
  }

  const requestedModel = String(body.model || '').trim()
  const requestedBrand = String(body.brand || '').trim()
  const customQuery = String(body.query || '').trim()

  if (!requestedModel && !customQuery) {
    return e.json(400, {
      success: false,
      found: false,
      status: 'invalid_request',
      results: [],
      message: 'Informe o fabricante e o modelo do equipamento.',
    })
  }

  const model = requestedModel || customQuery
  const normalizedBrand = requestedBrand
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[._-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  const autoDiscovery =
    !requestedBrand ||
    normalizedBrand === 'outro' ||
    normalizedBrand === 'outros' ||
    normalizedBrand === 'desconhecido'

  let sourceBrand = ''
  if (normalizedBrand === 'bermo' || normalizedBrand === 'bermo brasil') {
    sourceBrand = 'BERMO'
  } else if (
    normalizedBrand === 'alfa laval' ||
    normalizedBrand === 'alfalaval' ||
    normalizedBrand === 'alfa-laval'
  ) {
    sourceBrand = 'Alfa Laval'
  }

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
      brand: sourceBrand || requestedBrand,
      totalResults: 0,
      results: [],
      recommendedSpecs: null,
      message,
      researchId,
    })
  }

  const results = []
  const addCandidate = (result) => {
    try {
      const candidate = new Record(candidateCollection)
      candidate.set('research_id', researchId)
      candidate.set('source_url', result.url || '')
      candidate.set('source_title', result.title || '')
      candidate.set('source_type', result.sourceType || '')
      candidate.set('source_domain', result.sourceDomain || '')
      candidate.set('resolved_brand', result.brand || '')
      candidate.set('resolved_model', result.model || model)
      candidate.set(
        'match_status',
        result.evidence && result.evidence.match_status
          ? result.evidence.match_status
          : 'candidate',
      )
      candidate.set('confirmed_specs', {})
      candidate.set('evidence', result.evidence || {})
      candidate.set('approval_status', 'needs_review')
      $app.save(candidate)
      result.id = String(candidate.id || result.id)
    } catch (persistErr) {
      $app.logger().error('Falha ao registrar candidato técnico', 'error', String(persistErr))
    }
  }

  // Fabricante opcional: catálogo interno primeiro; Tavily depois.
  if (!sourceBrand && autoDiscovery) {
    let catalogMatches = []
    try {
      const searchToken = String(model)
        .toLowerCase()
        .split(/\s+/)[0]
        .replace(/[^a-z0-9]+/g, '')
      if (searchToken) {
        const safeToken = searchToken.replace(/\\/g, '\\\\').replace(/'/g, "\\'")
        catalogMatches = $app.findRecordsByFilter(
          'equipment_catalog',
          `model ~ '${safeToken}' || name ~ '${safeToken}' || series ~ '${safeToken}'`,
          '-created',
          8,
        )
      }
    } catch (catalogErr) {
      $app
        .logger()
        .warn('Falha ao consultar catálogo interno antes da busca web', 'error', String(catalogErr))
    }

    for (const record of catalogMatches) {
      const recordBrand = record.getString('brand') || ''
      const recordModel = record.getString('model') || model
      const recordSource = record.getString('source_url') || ''
      results.push({
        id: `catalog-${record.id}`,
        sourceType: 'catalog_db',
        sourceDomain: 'catalogo-interno',
        title: `${recordBrand ? recordBrand + ' ' : ''}${recordModel} — catálogo interno`,
        url: recordSource,
        snippet:
          'Modelo localizado no catálogo interno. Revise a proveniência antes de usar qualquer dado.',
        brand: recordBrand,
        model: recordModel,
        badge: 'Catálogo interno — revisão necessária',
        specs: null,
        evidence: {
          source_url: recordSource,
          extraction_status: 'pending',
          match_status: 'catalog_match',
          source_type: 'internal_catalog',
        },
      })
    }

    if (results.length === 0) {
      const tavilyKey = $secrets.get('TAVILY_API_KEY') || ''
      if (!tavilyKey) {
        return emptyResponse(
          'search_provider_required',
          'O modelo não está no catálogo interno. A busca automática precisa de um provedor externo configurado.',
        )
      }

      const searchQuery = `${model} fabricante trocador de calor ficha técnica manual datasheet`
      let searchResponse
      try {
        searchResponse = $http.send({
          url: 'https://api.tavily.com/search',
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            Authorization: `Bearer ${tavilyKey}`,
          },
          body: JSON.stringify({
            api_key: tavilyKey,
            query: searchQuery,
            search_depth: 'advanced',
            topic: 'general',
            max_results: 8,
            include_answer: false,
            include_raw_content: false,
          }),
          timeout: 30,
        })
      } catch (searchErr) {
        $app.logger().error('Falha de transporte na busca Tavily', 'error', String(searchErr))
        return emptyResponse(
          'unavailable',
          'A busca automática na internet está indisponível agora. Tente novamente.',
        )
      }

      if (!searchResponse || searchResponse.statusCode < 200 || searchResponse.statusCode >= 300) {
        const statusCode = searchResponse ? searchResponse.statusCode : 0
        $app.logger().warn('Tavily retornou erro', 'statusCode', statusCode)
        return emptyResponse(
          'unavailable',
          'A busca automática na internet não pôde ser concluída agora. Tente novamente.',
        )
      }

      const payload = searchResponse.json || {}
      const webResults = Array.isArray(payload.results) ? payload.results : []
      const terms = String(model)
        .toUpperCase()
        .split(/[^A-Z0-9]+/)
        .filter(
          (term) =>
            term.length >= 3 &&
            !['TROCADOR', 'CALOR', 'PLACA', 'PLACAS', 'HEAT', 'EXCHANGER'].includes(term),
        )

      for (let i = 0; i < webResults.length; i++) {
        const item = webResults[i] || {}
        const url = String(item.url || '').trim()
        const title = String(item.title || '').trim()
        const content = String(item.content || '').trim()
        if (!/^https?:\/\//i.test(url)) continue

        const searchable = `${url} ${title} ${content}`.toUpperCase()
        if (terms.length > 0 && !terms.some((term) => searchable.indexOf(term) !== -1)) continue

        const sourceDomain = url
          .replace(/^https?:\/\//i, '')
          .split('/')[0]
          .split('?')[0]
          .replace(/^www\./i, '')
          .toLowerCase()
        const titleUpper = title.toUpperCase()
        let candidateBrand = ''
        if (sourceDomain.indexOf('bermo.com.br') !== -1 || titleUpper.indexOf('BERMO') !== -1) {
          candidateBrand = 'BERMO'
        } else if (
          sourceDomain.indexOf('alfalaval.com') !== -1 ||
          titleUpper.indexOf('ALFA LAVAL') !== -1
        ) {
          candidateBrand = 'Alfa Laval'
        } else if (
          sourceDomain.indexOf('kelvion.com') !== -1 ||
          titleUpper.indexOf('KELVION') !== -1
        ) {
          candidateBrand = 'Kelvion'
        } else if (sourceDomain.indexOf('swep.net') !== -1 || titleUpper.indexOf('SWEP') !== -1) {
          candidateBrand = 'SWEP'
        }

        results.push({
          id: `tavily-${Date.now()}-${i + 1}`,
          sourceType: 'web_discovery_candidate',
          sourceDomain,
          title: title || url,
          url,
          snippet: content.slice(0, 700),
          brand: candidateBrand,
          model,
          badge: candidateBrand
            ? `Possível fonte oficial ${candidateBrand}`
            : 'Candidato encontrado na internet',
          specs: null,
          evidence: {
            source_url: url,
            source_domain: sourceDomain,
            extraction_status: 'pending',
            match_status: 'candidate',
            discovery_provider: 'tavily',
            search_query: searchQuery,
            official_domain_match: Boolean(candidateBrand),
          },
        })
      }

      for (const result of results) addCandidate(result)
    }
  } else if (!sourceBrand && !autoDiscovery) {
    return emptyResponse(
      'not_configured',
      `A pesquisa aceita a marca "${requestedBrand}", mas ainda não há fonte oficial configurada para ela. Os campos técnicos permanecem vazios.`,
    )
  }

  if (sourceBrand === 'BERMO') {
    const catalogUrl = 'https://bermo.com.br/produtos/troca-termica'
    let catalogResponse
    try {
      catalogResponse = $http.send({
        url: catalogUrl,
        method: 'GET',
        headers: {
          Accept: 'text/html,application/xhtml+xml',
          'Accept-Encoding': 'identity',
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
      const responseBody = catalogResponse.body
      if (typeof responseBody === 'string') {
        html = responseBody
      } else if (Array.isArray(responseBody)) {
        html = new TextDecoder('utf-8').decode(new Uint8Array(responseBody))
      } else {
        html = new TextDecoder('utf-8').decode(responseBody || new Uint8Array())
      }
    } catch (decodeErr) {
      $app
        .logger()
        .warn(
          'Falha na primeira leitura HTML da BERMO; tentando conversão textual',
          'error',
          String(decodeErr),
        )
      try {
        html = String(catalogResponse.body || '')
      } catch (fallbackDecodeErr) {
        $app
          .logger()
          .error('Falha ao ler resposta HTML da BERMO', 'error', String(fallbackDecodeErr))
        return emptyResponse('unavailable', 'Não foi possível ler a fonte oficial da BERMO.')
      }
    }
    if (!html || html.length === 0) {
      return emptyResponse('unavailable', 'A fonte oficial da BERMO retornou uma página vazia.')
    }
    const normalizedModel = model.toLowerCase().replace(/[^a-z0-9]+/g, '')
    const directUrls = [
      `https://bermo.com.br/produtos/detalhes/${normalizedModel}-trocador-de-calor-a-placas-gaxetado/`,
      `https://bermo.com.br/produtos/detalhes/${normalizedModel}-trocador-de-calor-a-placas-semi-soldado/`,
      `https://bermo.com.br/produtos/detalhes/${normalizedModel}-trocador-de-calor-a-placas-brasado/`,
      `https://bermo.com.br/produtos/detalhes/trocador-de-calor-a-placas-sanitario-${normalizedModel}/`,
    ]

    for (const href of directUrls) {
      let detailResponse
      try {
        detailResponse = $http.send({
          url: href,
          method: 'GET',
          headers: {
            Accept: 'text/html,application/xhtml+xml',
            'Accept-Encoding': 'identity',
            'User-Agent': 'Intertermal-Technical-Research/1.0',
          },
          timeout: 20,
        })
      } catch (detailErr) {
        continue
      }

      if (!detailResponse || detailResponse.statusCode !== 200) continue

      let detailHtml = ''
      try {
        const responseBody = detailResponse.body
        if (typeof responseBody === 'string') {
          detailHtml = responseBody
        } else if (Array.isArray(responseBody)) {
          detailHtml = new TextDecoder('utf-8').decode(new Uint8Array(responseBody))
        } else {
          detailHtml = new TextDecoder('utf-8').decode(responseBody || new Uint8Array())
        }
      } catch (decodeErr) {
        try {
          detailHtml = String(detailResponse.body || '')
        } catch (fallbackDecodeErr) {
          detailHtml = ''
        }
      }
      const detailHtmlLower = detailHtml.toLowerCase()
      if (
        !detailHtmlLower ||
        detailHtmlLower.indexOf(normalizedModel) === -1 ||
        detailHtmlLower.indexOf('bermo') === -1
      ) {
        continue
      }

      const result = {
        id: `official-${Date.now()}-${results.length + 1}`,
        sourceType: 'official_product_page',
        sourceDomain: 'bermo.com.br',
        title: `BERMO ${model} — página oficial`,
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
          match_status: 'exact',
          detail_page_status: 'validated',
          model_confirmed_in_page: true,
        },
      }
      results.push(result)
      addCandidate(result)
      break
    }
  }

  if (sourceBrand === 'Alfa Laval') {
    const catalogUrl =
      'https://www.alfalaval.com/products/heat-transfer/plate-heat-exchangers/plate-heat-exchangers/'
    const normalizedModel = model
      .toUpperCase()
      .replace(/[\s\-_]+/g, '')
      .replace(/[^A-Z0-9]/g, '')
    const documentByFamily = {
      M15: 'https://www.alfalaval.com/globalassets/documents/microsites/heating-and-cooling-hub/pd-leaflets---gasketed/m15.pdf',
      M10: 'https://www.alfalaval.com/globalassets/documents/products/heat-transfer/plate-heat-exchangers/gasketed-plate-and-frame-heat-exchangers/industrial-sw/alfa-laval-m10-w_en.pdf',
      TS20: 'https://www.alfalaval.com/globalassets/documents/products/heat-transfer/plate-heat-exchangers/gasketed-plate-and-frame-heat-exchangers/industrial/productleaflet_ts20_ptbr.pdf',
      T25: 'https://www.alfalaval.com/globalassets/documents/products/heat-transfer/plate-heat-exchangers/gasketed-plate-and-frame-heat-exchangers/industrial/25_product-leaflet_en.pdf',
      T21: 'https://assets.alfalaval.com/documents/pe2a6be11/alfa-laval-t21-product-leaflet-en.pdf',
      T5: 'https://assets.alfalaval.com/documents/p48694409/alfa-laval-t5-product-leaflet-en.pdf',
      T20: 'https://www.alfalaval.com/globalassets/documents/products/heat-transfer/plate-heat-exchangers/gasketed-plate-and-frame-heat-exchangers/instruction-manuals/instruction-manual-alfa-laval-industrial-line-m15-tl10-tl15-t20-ts20-t25-mx25-ma30-widegap-100-english.pdf',
      TL10: 'https://www.alfalaval.com/globalassets/documents/products/heat-transfer/plate-heat-exchangers/gasketed-plate-and-frame-heat-exchangers/instruction-manuals/instruction-manual-alfa-laval-industrial-line-m15-tl10-tl15-t20-ts20-t25-mx25-ma30-widegap-100-english.pdf',
      TL15: 'https://www.alfalaval.com/globalassets/documents/products/heat-transfer/plate-heat-exchangers/gasketed-plate-and-frame-heat-exchangers/instruction-manuals/instruction-manual-alfa-laval-industrial-line-m15-tl10-tl15-t20-ts20-t25-mx25-ma30-widegap-100-english.pdf',
      MX25: 'https://www.alfalaval.com/globalassets/documents/products/heat-transfer/plate-heat-exchangers/gasketed-plate-and-frame-heat-exchangers/instruction-manuals/instruction-manual-alfa-laval-industrial-line-m15-tl10-tl15-t20-ts20-t25-mx25-ma30-widegap-100-english.pdf',
      MA30: 'https://www.alfalaval.com/globalassets/documents/products/heat-transfer/plate-heat-exchangers/gasketed-plate-and-frame-heat-exchangers/instruction-manuals/instruction-manual-alfa-laval-industrial-line-m15-tl10-tl15-t20-ts20-t25-mx25-ma30-widegap-100-english.pdf',
      ACH70X:
        'https://shop.alfalaval.com/en-us/brazed-fusion-bonded-plate-heat-exchangers--1385381/ach70x-62-plates-brazed-plate-heat-exchanger--1259551-',
    }

    let family = ''
    const familyKeys = Object.keys(documentByFamily)
    for (const key of familyKeys) {
      if (normalizedModel.indexOf(key) === 0) {
        family = key
        break
      }
    }

    if (!family) {
      return emptyResponse(
        'not_found',
        `Nenhum documento oficial da Alfa Laval foi configurado para o modelo "${model}" nesta etapa. Os campos técnicos permanecem vazios.`,
      )
    }

    const sourceUrl = documentByFamily[family]
    let documentResponse
    try {
      documentResponse = $http.send({
        url: sourceUrl,
        method: 'GET',
        headers: {
          Accept: 'application/pdf,text/html,application/xhtml+xml',
          'User-Agent': 'Intertermal-Technical-Research/1.0',
        },
        timeout: 20,
      })
    } catch (httpErr) {
      $app.logger().error('Falha de transporte na fonte Alfa Laval', 'error', String(httpErr))
      return emptyResponse(
        'unavailable',
        'A fonte oficial da Alfa Laval não pôde ser consultada agora. Tente novamente.',
      )
    }

    if (!documentResponse || documentResponse.statusCode !== 200) {
      const statusCode = documentResponse ? documentResponse.statusCode : 0
      $app.logger().warn('Fonte Alfa Laval indisponível', 'statusCode', statusCode)
      return emptyResponse(
        'unavailable',
        'A fonte oficial da Alfa Laval não pôde ser validada agora. Tente novamente.',
      )
    }

    const matchStatus = normalizedModel === family ? 'exact' : 'family_match'
    const result = {
      id: `official-${Date.now()}-1`,
      sourceType:
        sourceUrl.indexOf('.pdf') !== -1 ? 'official_product_document' : 'official_product_page',
      sourceDomain:
        sourceUrl.indexOf('shop.alfalaval.com') !== -1 ? 'shop.alfalaval.com' : 'alfalaval.com',
      title: `Alfa Laval ${family} — fonte oficial`,
      url: sourceUrl,
      snippet:
        matchStatus === 'exact'
          ? 'Documento oficial do fabricante localizado para o modelo informado. Extração técnica pendente de revisão.'
          : `Documento oficial da família ${family} localizado. Confirme a variante do equipamento antes de usar qualquer dado.`,
      brand: 'Alfa Laval',
      model,
      badge: 'Fonte oficial Alfa Laval',
      specs: null,
      evidence: {
        source_url: sourceUrl,
        source_catalog_url: catalogUrl,
        extraction_status: 'pending',
        match_status: matchStatus,
        matched_family: family,
      },
    }
    results.push(result)
    addCandidate(result)
  }

  const discoveredBrands = []
  for (const result of results) {
    if (result.brand && discoveredBrands.indexOf(result.brand) === -1)
      discoveredBrands.push(result.brand)
  }
  const status = results.length > 0 ? 'found' : 'not_found'
  const message =
    results.length > 0
      ? autoDiscovery
        ? `Localizados ${results.length} candidatos para "${model}"${discoveredBrands.length > 0 ? `; possíveis fabricantes: ${discoveredBrands.join(', ')}` : ''}. Revise as fontes antes de extrair ou aplicar dados.`
        : `Fonte oficial da ${sourceBrand} localizada para "${model}". Revise a fonte antes de extrair ou aplicar dados.`
      : autoDiscovery
        ? `Nenhuma fonte foi localizada para "${model}". Os campos técnicos permanecem vazios.`
        : `Nenhuma fonte oficial da ${sourceBrand} foi localizada para "${model}". Os campos técnicos permanecem vazios.`

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
    brand: sourceBrand || requestedBrand,
    possibleBrands: discoveredBrands,
    searchProvider: autoDiscovery ? 'tavily' : 'official_source',
    totalResults: results.length,
    results,
    recommendedSpecs: null,
    message,
    researchId,
  })
})
