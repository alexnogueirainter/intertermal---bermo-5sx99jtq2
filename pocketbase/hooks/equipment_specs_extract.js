// Extração técnica determinística: somente valores explicitamente presentes na fonte oficial.
routerAdd('POST', '/backend/v1/intertermal/equipment-specs-extract', (e) => {
  const body = e.requestInfo().body || {}
  const url = String(body.url || '').trim()
  const requestedBrand = String(body.brand || '').trim()
  const requestedModel = String(body.model || '').trim()

  if (!url) {
    return e.json(400, {
      success: false,
      found: false,
      status: 'invalid_request',
      specs: null,
      fieldEvidence: {},
      message: 'A URL da fonte oficial é obrigatória.',
    })
  }

  const hostMatch = url.match(/^https?:\/\/([^/]+)/i)
  const hostname = hostMatch
    ? String(hostMatch[1])
        .toLowerCase()
        .replace(/^www\./, '')
    : ''
  const officialDomains = [
    'bermo.com.br',
    'alfalaval.com',
    'alfalaval.com.br',
    'assets.alfalaval.com',
    'shop.alfalaval.com',
  ]
  const isOfficialDomain = officialDomains.some(
    (domain) => hostname === domain || hostname.endsWith(`.${domain}`),
  )

  if (!isOfficialDomain) {
    return e.json(200, {
      success: false,
      found: false,
      status: 'untrusted_source',
      brand: requestedBrand,
      model: requestedModel,
      specs: null,
      fieldEvidence: {},
      source: { url, domain: hostname },
      message:
        'A extração técnica só aceita fonte oficial do fabricante. Esta fonte deve ser revisada, mas não pode fornecer especificações automaticamente.',
    })
  }

  let rawText = ''
  let extractionMethod = 'official_page_text'
  let sourceTitle = `${requestedBrand || 'Fabricante'} ${requestedModel || ''}`.trim()

  const decodeBody = (responseBody) => {
    if (typeof responseBody === 'string') return responseBody
    if (Array.isArray(responseBody)) {
      return new TextDecoder('utf-8').decode(new Uint8Array(responseBody))
    }
    return new TextDecoder('utf-8').decode(responseBody || new Uint8Array())
  }

  if (hostname === 'bermo.com.br' || hostname.endsWith('.bermo.com.br')) {
    try {
      const sourceResponse = $http.send({
        url,
        method: 'GET',
        headers: {
          Accept: 'text/html,application/xhtml+xml',
          'Accept-Encoding': 'identity',
          'User-Agent': 'Intertermal-Technical-Research/1.0',
        },
        timeout: 25,
      })
      if (!sourceResponse || sourceResponse.statusCode !== 200) {
        return e.json(200, {
          success: false,
          found: false,
          status: 'unavailable',
          brand: requestedBrand || 'BERMO',
          model: requestedModel,
          specs: null,
          fieldEvidence: {},
          source: { url, domain: hostname },
          message: 'A página oficial BERMO não pôde ser consultada agora.',
        })
      }
      rawText = decodeBody(sourceResponse.body)
      extractionMethod = 'bermo_official_html'
    } catch (error) {
      $app.logger().error('Falha ao consultar fonte BERMO para extração', 'error', String(error))
      return e.json(200, {
        success: false,
        found: false,
        status: 'unavailable',
        brand: requestedBrand || 'BERMO',
        model: requestedModel,
        specs: null,
        fieldEvidence: {},
        source: { url, domain: hostname },
        message: 'A página oficial BERMO não pôde ser consultada agora.',
      })
    }
  } else {
    const tavilyKey = $secrets.get('TAVILY_API_KEY') || ''
    if (!tavilyKey) {
      return e.json(200, {
        success: false,
        found: false,
        status: 'search_provider_required',
        brand: requestedBrand,
        model: requestedModel,
        specs: null,
        fieldEvidence: {},
        source: { url, domain: hostname },
        message: 'A extração de documentos oficiais precisa do provedor de conteúdo configurado.',
      })
    }

    try {
      const extractResponse = $http.send({
        url: 'https://api.tavily.com/extract',
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tavilyKey}`,
        },
        body: JSON.stringify({
          api_key: tavilyKey,
          urls: [url],
          query: `${requestedBrand || 'fabricante'} ${requestedModel || ''} technical specifications dimensions connection pressure temperature material`,
          extract_depth: 'advanced',
          format: 'markdown',
          chunks_per_source: 5,
          include_images: false,
        }),
        timeout: 35,
      })
      if (
        !extractResponse ||
        extractResponse.statusCode < 200 ||
        extractResponse.statusCode >= 300
      ) {
        return e.json(200, {
          success: false,
          found: false,
          status: 'unavailable',
          brand: requestedBrand,
          model: requestedModel,
          specs: null,
          fieldEvidence: {},
          source: { url, domain: hostname },
          message: 'O documento oficial não pôde ser lido agora. Tente novamente.',
        })
      }
      const extractPayload = extractResponse.json || {}
      const extractedResults = Array.isArray(extractPayload.results) ? extractPayload.results : []
      const firstExtracted = extractedResults.length > 0 ? extractedResults[0] : null
      rawText = firstExtracted
        ? String(firstExtracted.raw_content || firstExtracted.content || '')
        : ''
      sourceTitle =
        firstExtracted && firstExtracted.title ? String(firstExtracted.title) : sourceTitle
      extractionMethod = 'tavily_official_document_extract'
    } catch (error) {
      $app.logger().error('Falha na extração Tavily de documento oficial', 'error', String(error))
      return e.json(200, {
        success: false,
        found: false,
        status: 'unavailable',
        brand: requestedBrand,
        model: requestedModel,
        specs: null,
        fieldEvidence: {},
        source: { url, domain: hostname },
        message: 'O documento oficial não pôde ser lido agora. Tente novamente.',
      })
    }
  }

  if (!rawText || rawText.trim().length < 20) {
    return e.json(200, {
      success: true,
      found: false,
      status: 'no_explicit_specs',
      brand: requestedBrand,
      model: requestedModel,
      specs: null,
      fieldEvidence: {},
      source: { url, domain: hostname, title: sourceTitle },
      extraction: { method: extractionMethod, rawTextAvailable: false },
      message:
        'A fonte oficial foi acessada, mas não trouxe texto técnico explícito para os campos suportados.',
    })
  }

  let text = String(rawText)
  text = text
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/tr>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&aacute;/gi, 'á')
    .replace(/&atilde;/gi, 'ã')
    .replace(/&acirc;/gi, 'â')
    .replace(/&agrave;/gi, 'à')
    .replace(/&eacute;/gi, 'é')
    .replace(/&ecirc;/gi, 'ê')
    .replace(/&iacute;/gi, 'í')
    .replace(/&oacute;/gi, 'ó')
    .replace(/&ocirc;/gi, 'ô')
    .replace(/&otilde;/gi, 'õ')
    .replace(/&uacute;/gi, 'ú')
    .replace(/&ccedil;/gi, 'ç')
    .replace(/&uuml;/gi, 'ü')
    .replace(/&ndash;/gi, '–')
    .replace(/&mdash;/gi, '—')
    .replace(/&ordm;/gi, 'º')
    .replace(/&rdquo;/gi, '”')
    .replace(/&ldquo;/gi, '“')
    .replace(/&sup2;/gi, '²')
    .replace(/&frac14;/gi, '¼')
    .replace(/&frac12;/gi, '½')
    .replace(/&frac34;/gi, '¾')
    .replace(/&#39;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/&amp;/gi, '&')
    .replace(/\r/g, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n[ \t]+/g, '\n')
    .trim()

  const normalizedForSearch = text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
  const specs = {}
  const fieldEvidence = {}
  const addField = (field, value, sourceText, unit) => {
    const cleanValue = String(value || '')
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/[.;]+$/, '')
    const cleanSource = String(sourceText || '')
      .replace(/\s+/g, ' ')
      .trim()
    if (!cleanValue || !cleanSource) return
    specs[field] = cleanValue
    fieldEvidence[field] = {
      value: cleanValue,
      unit: unit || '',
      sourceText: cleanSource.slice(0, 500),
      sourceUrl: url,
      status: 'explicit',
      extractionMethod,
    }
  }

  const firstMatch = (patterns) => {
    for (const pattern of patterns) {
      const match = text.match(pattern)
      if (match && match[1] && match[0]) return { value: match[1], sourceText: match[0] }
    }
    return null
  }

  const plateMaterialMatch = firstMatch([
    /Material\s+(?:das|de|of)\s+placas?\s*[:\-]\s*([^\n|]{2,240})/i,
    /(?:plate\s+material|material\s+of\s+plates?)\s*[:\-]\s*([^\n|]{2,240})/i,
  ])
  if (plateMaterialMatch)
    addField('plateMaterial', plateMaterialMatch.value, plateMaterialMatch.sourceText)

  const gasketMaterialMatch = firstMatch([
    /Material\s+(?:das|de|of)\s+gaxetas?\s*[:\-]\s*([^\n|]{2,240})/i,
    /(?:gasket\s+material|material\s+of\s+gaskets?)\s*[:\-]\s*([^\n|]{2,240})/i,
  ])
  if (gasketMaterialMatch)
    addField('gasketMaterial', gasketMaterialMatch.value, gasketMaterialMatch.sourceText)

  const connectionMatch = firstMatch([
    /Conex(?:ão|oes|ões)\s*[:\-]\s*([^\n|]{2,160})/i,
    /Connections?\s*[:\-]\s*([^\n|]{2,160})/i,
    /Connection\s+size\s*[:\-]\s*([^\n|]{2,160})/i,
  ])
  if (connectionMatch) addField('connection', connectionMatch.value, connectionMatch.sourceText)

  const pressureMatch = firstMatch([
    /Press(?:ão|ao)\s+(?:M[aá]x(?:ima)?\.?|Maximum|Max\.?)\s*(?:\([^)]*\))?\s*[:\-]?\s*([0-9]+(?:[.,][0-9]+)?\s*(?:bar(?:g)?|barg|psi|MPa)?)/i,
    /(?:maximum|max\.?|working)\s+pressure\s*[:\-]?\s*([0-9]+(?:[.,][0-9]+)?\s*(?:bar(?:g)?|barg|psi|MPa)?)/i,
    /Pressure\s+rating\s*[:\-]?\s*([0-9]+(?:[.,][0-9]+)?\s*(?:bar(?:g)?|barg|psi|MPa)?)/i,
  ])
  if (pressureMatch) addField('pressure', pressureMatch.value, pressureMatch.sourceText, 'bar')

  const testPressureMatch = firstMatch([
    /Press(?:ão|ao)\s+(?:de\s+)?teste\s*[:\-]?\s*([0-9]+(?:[.,][0-9]+)?\s*(?:bar(?:g)?|barg|psi|MPa)?)/i,
    /(?:test|hydrostatic)\s+pressure\s*[:\-]?\s*([0-9]+(?:[.,][0-9]+)?\s*(?:bar(?:g)?|barg|psi|MPa)?)/i,
  ])
  if (testPressureMatch)
    addField('testPressure', testPressureMatch.value, testPressureMatch.sourceText, 'bar')

  const temperatureMatch = firstMatch([
    /Temperat(?:ura|ure)\s+(?:M[aá]x(?:ima)?\.?|Maximum|Max\.?)\s*[:\-]?\s*([0-9]+(?:[.,][0-9]+)?\s*(?:°|º)?\s*C)/i,
    /(?:maximum|max\.?|operating)\s+temperature\s*[:\-]?\s*([0-9]+(?:[.,][0-9]+)?\s*(?:°|º)?\s*C)/i,
  ])
  if (temperatureMatch)
    addField('maxTemperature', temperatureMatch.value, temperatureMatch.sourceText, '°C')

  const weightMatch = firstMatch([
    /(?:Peso|Weight)\s*[:\-]?\s*([0-9]+(?:[.,][0-9]+)?\s*(?:kg|公斤)?)/i,
  ])
  if (weightMatch) addField('weightKg', weightMatch.value, weightMatch.sourceText, 'kg')

  const dimensionsMatch = firstMatch([
    /Dimens(?:ões|oes|ions)\s*[:\-]?\s*((?!Modelo(?:\s|$))[^\n|]{3,220})/i,
    /(?:height|altura)[^\n|]{0,80}(?:width|largura)[^\n|]{0,80}(?:length|comprimento)[^\n|]{0,80}/i,
  ])
  if (dimensionsMatch && dimensionsMatch.value.trim().toLowerCase() !== 'modelo') {
    addField('plateDimensions', dimensionsMatch.value, dimensionsMatch.sourceText, 'mm')
  }

  const maxAreaMatch = firstMatch([
    /(?:[ÁA]rea|Area)\s+(?:M[aá]xima|Maximum)\s+(?:de\s+Transfer[eê]ncia|Transfer\s*Area)\s*[:\-]?\s*([0-9]+(?:[.,][0-9]+)?\s*m[²2])/i,
  ])
  if (maxAreaMatch) addField('maxTransferArea', maxAreaMatch.value, maxAreaMatch.sourceText, 'm²')

  // Documentos Alfa Laval costumam publicar tabelas em duas colunas.
  const alfaPlateMaterialMatch = firstMatch([
    /Heat\s+transfer\s+plate,?\s*Single\s+plate\s*:\s*(?:\|\s*)?([^\n|]{2,180})/i,
    /Heat\s+transfer\s+plate[^\n|]{0,80}Material\s*[:\-]\s*(?:\|\s*)?([^\n|]{2,180})/i,
  ])
  if (!specs.plateMaterial && alfaPlateMaterialMatch) {
    addField('plateMaterial', alfaPlateMaterialMatch.value, alfaPlateMaterialMatch.sourceText)
  }

  const alfaGasketMaterialMatch = firstMatch([
    /Field\s+gasket\s*:\s*(?:\|\s*)?([^\n|]{2,180})/i,
    /Gasket\s+material\s*[:\-]\s*(?:\|\s*)?([^\n|]{2,180})/i,
  ])
  if (!specs.gasketMaterial && alfaGasketMaterialMatch) {
    addField('gasketMaterial', alfaGasketMaterialMatch.value, alfaGasketMaterialMatch.sourceText)
  }

  const alfaConnectionMatch = firstMatch([
    /Connection\s+(?:size|type|standard)\s*[:\-]\s*(?:\|\s*)?([^\n|]{2,120})/i,
  ])
  if (!specs.connection && alfaConnectionMatch) {
    addField('connection', alfaConnectionMatch.value, alfaConnectionMatch.sourceText)
  }

  const alfaTemperatureMatch = firstMatch([
    /Temperature\s+range[\s\S]{0,220}?From\s+[-0-9.,]+\s+to\s+([0-9]+(?:[.,][0-9]+)?)(?:\s*\([^\n|]{0,60}\))?/i,
    /Temperature\s+range\s*[:\-]\s*(?:\|\s*)?([^\n|]{3,160})/i,
  ])
  if (!specs.maxTemperature && alfaTemperatureMatch) {
    addField('maxTemperature', alfaTemperatureMatch.value, alfaTemperatureMatch.sourceText, '°C')
  }

  const alfaPressureMatch = firstMatch([
    /Pressure\s+range[\s\S]{0,240}?to\s+([0-9]+(?:[.,][0-9]+)?)(?:\s*\([^\n|]{0,60}\))?/i,
    /Pressure\s+range\s*[:\-]\s*(?:\|\s*)?([^\n|]{3,180})/i,
  ])
  if (!specs.pressure && alfaPressureMatch) {
    addField('pressure', alfaPressureMatch.value, alfaPressureMatch.sourceText, 'barg')
  }

  // BERMO publica alguns dados em linhas de tabela sem dois-pontos.
  if (hostname === 'bermo.com.br' || hostname.endsWith('.bermo.com.br')) {
    const tempTable = firstMatch([/Temperature\s+M[aá]x\.?.{0,80}?([0-9]+(?:[.,][0-9]+)?\s*°?C?)/i])
    if (!specs.maxTemperature && tempTable)
      addField('maxTemperature', tempTable.value, tempTable.sourceText, '°C')
    const pressureTable = firstMatch([
      /Press(?:ão|ao)\s+M[aá]x\.?\s*\([^)]*\).{0,80}?([0-9]+(?:[.,][0-9]+)?\s*(?:bar|barg))/i,
    ])
    if (!specs.pressure && pressureTable)
      addField('pressure', pressureTable.value, pressureTable.sourceText, 'bar')
    const connectionTable = firstMatch([/Conex(?:ão|ao)\s*\n?\s*([A-Z0-9][^\n|]{1,80})/i])
    if (!specs.connection && connectionTable)
      addField('connection', connectionTable.value, connectionTable.sourceText)
  }

  const fieldCount = Object.keys(specs).length
  const status = fieldCount > 0 ? 'extracted' : 'no_explicit_specs'
  const message =
    fieldCount > 0
      ? `${fieldCount} campo(s) técnico(s) extraído(s) literalmente da fonte oficial. Revise a evidência e aplique manualmente.`
      : 'A fonte oficial foi acessada, mas nenhum valor explícito dos campos suportados foi encontrado.'

  return e.json(200, {
    success: true,
    found: fieldCount > 0,
    status,
    brand: requestedBrand,
    model: requestedModel,
    specs: fieldCount > 0 ? specs : null,
    fieldEvidence,
    source: { url, domain: hostname, title: sourceTitle },
    extraction: {
      method: extractionMethod,
      rawTextAvailable: true,
      sourceOfficial: true,
      valuesAreExplicit: true,
      searchedTextLength: text.length,
      normalizedSearchPreview: normalizedForSearch.slice(0, 120),
    },
    message,
  })
})
