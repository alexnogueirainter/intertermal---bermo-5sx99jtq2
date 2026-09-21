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

  if (!requestedBrand) {
    return e.json(400, {
      success: false,
      found: false,
      status: 'invalid_request',
      model: requestedModel || customQuery,
      brand: '',
      results: [],
      message: 'Informe o fabricante antes de pesquisar o modelo.',
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

  if (!sourceBrand) {
    return emptyResponse(
      'not_configured',
      `A pesquisa aceita a marca "${requestedBrand}", mas ainda não há fonte oficial configurada para ela. Os campos técnicos permanecem vazios.`,
    )
  }

  const results = []
  const addCandidate = (result) => {
    try {
      const candidate = new Record(candidateCollection)
      candidate.set('research_id', researchId)
      candidate.set('source_url', result.url)
      candidate.set('source_title', result.title)
      candidate.set('source_type', result.sourceType)
      candidate.set('source_domain', result.sourceDomain)
      candidate.set('resolved_brand', result.brand)
      candidate.set('resolved_model', result.model)
      candidate.set('match_status', result.evidence.match_status || 'exact')
      candidate.set('confirmed_specs', {})
      candidate.set('evidence', result.evidence)
      candidate.set('approval_status', 'needs_review')
      $app.save(candidate)
      result.id = String(candidate.id || result.id)
    } catch (persistErr) {
      $app.logger().error('Falha ao registrar candidato técnico', 'error', String(persistErr))
    }
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

  const status = results.length > 0 ? 'found' : 'not_found'
  const message =
    results.length > 0
      ? `Fonte oficial da ${sourceBrand} localizada para "${model}". Revise a fonte antes de extrair ou aplicar dados.`
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
    brand: sourceBrand,
    totalResults: results.length,
    results,
    recommendedSpecs: null,
    message,
    researchId,
  })
})
