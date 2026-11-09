// BUSCA ÚNICA de especificações técnicas (unifica equipment_specs_search + equipment_official_research).
// Regras (Alex, 09/11):
// 1. Só fontes oficiais da lista aprovada de fabricantes — nada de candidato solto na internet.
// 2. Nada de preenchimento por IA sem fonte: sem resultado oficial, retorna
//    "Não encontrado no site do fabricante — consultar fabricante".
// 3. Resposta com 1 resultado principal (primaryResult) + demais (otherResults).
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

  // ---- Lista oficial de fabricantes aprovada (tabela do Alex, 09/11) ----
  const OFFICIAL_SOURCES = [
    { brand: 'Apema', url: 'https://www.apema.com.br/', domain: 'apema.com.br' },
    { brand: 'Ártica', url: 'https://www.artica.com.br/', domain: 'artica.com.br' },
    { brand: 'Dantherm', url: 'https://www.dantherm.com.br/', domain: 'dantherm.com.br' },
    { brand: 'ICP Latin America', url: 'https://icp-la.com.br/', domain: 'icp-la.com.br' },
    {
      brand: 'Expander',
      url: 'https://www.expandermanutencao.com.br/',
      domain: 'expandermanutencao.com.br',
    },
    { brand: 'Tauscher Group', url: 'https://tauscher.com.br/', domain: 'tauscher.com.br' },
    { brand: 'Termo-Tek', url: 'https://www.termotek.com.br/', domain: 'termotek.com.br' },
    { brand: 'Maze', url: 'https://www.maze.ind.br/', domain: 'maze.ind.br' },
    {
      brand: 'Tubal',
      url: 'https://www.tubaltrocadoresdecalor.com.br/',
      domain: 'tubaltrocadoresdecalor.com.br',
    },
    { brand: 'Incase', url: 'https://www.incase.com.br/', domain: 'incase.com.br' },
    {
      brand: 'JPX Equipamentos',
      url: 'https://www.jpxequipamentos.com.br/',
      domain: 'jpxequipamentos.com.br',
    },
    { brand: 'FGalvão', url: 'https://fgalvao.ind.br/', domain: 'fgalvao.ind.br' },
    { brand: 'Brahex Refrigeração', url: 'https://www.brahex.com.br/', domain: 'brahex.com.br' },
    { brand: 'BeBräx', url: 'https://www.bebrax.com/', domain: 'bebrax.com' },
    {
      brand: 'Evacon',
      url: 'https://interplast.com.br/expositor/50933-evacon/',
      domain: 'interplast.com.br',
    },
    {
      brand: 'Alfa Laval',
      url: 'https://www.alfalaval.com.br/',
      domain: 'alfalaval.com.br',
      extraDomains: ['alfalaval.com', 'assets.alfalaval.com', 'shop.alfalaval.com'],
    },
    { brand: 'Kelvion', url: 'https://www.kelvion.com/pt/', domain: 'kelvion.com' },
    { brand: 'SWEP', url: 'https://www.swep.net/', domain: 'swep.net' },
    { brand: 'Bermo', url: 'https://bermo.com.br/', domain: 'bermo.com.br' },
    { brand: 'Tranter', url: 'https://www.tranter.com/', domain: 'tranter.com' },
  ]

  const normalize = (s) =>
    String(s || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9 ]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()

  const requestedBy = e.auth ? String(e.auth.id || '') : ''
  const normalizedBrand = normalize(requestedBrand)

  // Resolve a fonte oficial: marca informada, marca do catálogo interno ou prefixo conhecido (Bermo)
  let source = null
  let catalogBrand = ''
  for (const entry of OFFICIAL_SOURCES) {
    const n = normalize(entry.brand)
    if (
      normalizedBrand &&
      (n === normalizedBrand || n.startsWith(normalizedBrand) || normalizedBrand.startsWith(n))
    ) {
      source = entry
      break
    }
  }

  const cleanLower = model.toLowerCase()
  const safeToken = cleanLower
    .split(/\s+/)[0]
    .replace(/[^a-z0-9]+/g, '')
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")

  // Catálogo interno (base homologada, com fonte oficial registrada) — vale para qualquer marca
  let catalogMatches = []
  if (safeToken) {
    try {
      catalogMatches = $app.findRecordsByFilter(
        'equipment_catalog',
        `model ~ '${safeToken}' || name ~ '${safeToken}' || series ~ '${safeToken}'`,
        '-created',
        8,
      )
    } catch (catalogErr) {
      $app.logger().warn('Falha ao consultar catálogo interno', 'error', String(catalogErr))
    }
  }
  if (!source && catalogMatches.length > 0) {
    catalogBrand = String(catalogMatches[0].getString('brand') || '')
    const nCatalog = normalize(catalogBrand)
    for (const entry of OFFICIAL_SOURCES) {
      const n = normalize(entry.brand)
      if (nCatalog && (n === nCatalog || n.startsWith(nCatalog) || nCatalog.startsWith(n))) {
        source = entry
        break
      }
    }
  }
  if (!source && !normalizedBrand) {
    const upper = model.toUpperCase().replace(/[\s\-_]/g, '')
    if (/^(BP|BL|BM|BTL)/.test(upper)) source = OFFICIAL_SOURCES.find((s) => s.brand === 'Bermo')
  }

  // Persistência de auditoria (equipment_researches / candidates)
  const researchCollection = $app.findCollectionByNameOrId('equipment_researches')
  const candidateCollection = $app.findCollectionByNameOrId('equipment_research_candidates')
  let researchRecord = null
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

  const finalize = (status, results, message) => {
    if (researchRecord) {
      try {
        researchRecord.set('status', status)
        researchRecord.set('results_json', results)
        researchRecord.set('completed_at', new Date().toISOString())
        if (status === 'unavailable') researchRecord.set('error_message', message)
        $app.save(researchRecord)
      } catch (persistErr) {
        $app.logger().error('Falha ao concluir pesquisa técnica', 'error', String(persistErr))
      }
    }
    const primaryResult = results.length > 0 ? results[0] : null
    const otherResults = results.length > 1 ? results.slice(1) : []
    return e.json(200, {
      success: true,
      found: results.length > 0,
      status,
      model,
      brand: source ? source.brand : requestedBrand,
      sourceDomain: source ? source.domain : '',
      officialUrl: source ? source.url : '',
      totalResults: results.length,
      results,
      primaryResult,
      otherResults,
      recommendedSpecs: primaryResult && primaryResult.specs ? primaryResult.specs : null,
      message,
      researchId,
    })
  }

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
      candidate.set('match_status', 'candidate')
      candidate.set('confirmed_specs', {})
      candidate.set('evidence', result.evidence || {})
      candidate.set('approval_status', 'needs_review')
      $app.save(candidate)
      result.id = String(candidate.id || result.id)
    } catch (persistErr) {
      $app.logger().error('Falha ao registrar candidato técnico', 'error', String(persistErr))
    }
  }

  const NOT_FOUND_MSG = 'Não encontrado no site do fabricante — consultar fabricante.'

  // Sem fonte oficial definida: não busca em lugar nenhum
  if (!source) {
    return finalize(
      'not_found',
      [],
      requestedBrand
        ? `O fabricante "${requestedBrand}" não está na lista de fontes oficiais aceitas. ${NOT_FOUND_MSG}`
        : `Fabricante não identificado para "${model}". Informe o fabricante ou consulte a lista de fontes oficiais. ${NOT_FOUND_MSG}`,
    )
  }

  const domains = [source.domain].concat(source.extraDomains || [])
  const isOfficialHost = (hostname) =>
    domains.some((d) => hostname === d || hostname.endsWith(`.${d}`))

  const results = []

  // 1) Catálogo interno homologado (dados oficiais com source_url) — resultado principal quando bate exato
  const cleanNoHyphen = cleanLower.replace(/[\s\-_]/g, '')
  for (const record of catalogMatches) {
    const recordBrand = String(record.getString('brand') || '')
    const nRecord = normalize(recordBrand)
    const nSource = normalize(source.brand)
    const brandOk =
      !nRecord || nRecord === nSource || nSource.startsWith(nRecord) || nRecord.startsWith(nSource)
    if (!brandOk) continue
    const recordModel = String(record.getString('model') || model)
    const recordSource = String(record.getString('source_url') || source.url)
    const isExact = recordModel.toLowerCase().replace(/[\s\-_]/g, '') === cleanNoHyphen
    const item = {
      id: `catalog-${record.id}`,
      sourceType: 'official_catalog',
      sourceDomain: source.domain,
      title: `${recordBrand ? recordBrand + ' ' : ''}${recordModel} — catálogo oficial`,
      url: recordSource,
      snippet:
        'Modelo localizado no catálogo oficial homologado. Revise os dados antes de aplicar.',
      brand: recordBrand || source.brand,
      model: recordModel,
      badge: isExact ? 'Catálogo oficial — match exato' : 'Catálogo oficial',
      specs: null,
      evidence: {
        source_url: recordSource,
        extraction_status: 'pending',
        match_status: isExact ? 'exact' : 'catalog_match',
        source_type: 'official_catalog',
      },
    }
    if (isExact) {
      results.unshift(item)
    } else {
      results.push(item)
    }
  }

  // 2) Busca na web RESTRITA ao domínio oficial do fabricante (Tavily, filtro por hostname)
  if (results.length === 0 || results[0].sourceType !== 'official_catalog' || true) {
    const tavilyKey = $secrets.get('TAVILY_API_KEY') || ''
    if (!tavilyKey) {
      if (results.length === 0) {
        return finalize(
          'search_provider_required',
          [],
          'A busca no site oficial do fabricante precisa do provedor de conteúdo configurado (TAVILY_API_KEY). ' +
            NOT_FOUND_MSG,
        )
      }
    } else {
      const searchQuery = `${source.brand} ${model} ficha técnica especificações trocador de calor`
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
            include_domains: domains,
          }),
          timeout: 30,
        })
      } catch (searchErr) {
        $app.logger().error('Falha de transporte na busca Tavily', 'error', String(searchErr))
        if (results.length === 0) {
          return finalize(
            'unavailable',
            [],
            'A busca no site oficial do fabricante está indisponível agora. Tente novamente. ' +
              NOT_FOUND_MSG,
          )
        }
      }

      if (searchResponse && searchResponse.statusCode >= 200 && searchResponse.statusCode < 300) {
        const payload = searchResponse.json || {}
        const webResults = Array.isArray(payload.results) ? payload.results : []
        const terms = String(model)
          .toUpperCase()
          .split(/[^A-Z0-9]+/)
          .filter(
            (t) =>
              t.length >= 3 &&
              !['TROCADOR', 'CALOR', 'PLACA', 'PLACAS', 'HEAT', 'EXCHANGER'].includes(t),
          )

        for (let i = 0; i < webResults.length; i++) {
          const item = webResults[i] || {}
          const url = String(item.url || '').trim()
          const title = String(item.title || '').trim()
          const content = String(item.content || '').trim()
          if (!/^https?:\/\//i.test(url)) continue

          let hostname = ''
          const hostMatch = url.match(/^https?:\/\/([^/]+)/i)
          if (hostMatch) {
            hostname = String(hostMatch[1])
              .toLowerCase()
              .replace(/^www\./, '')
              .split(':')[0]
          }
          if (!isOfficialHost(hostname)) continue

          const searchable = `${url} ${title} ${content}`.toUpperCase()
          if (terms.length > 0 && !terms.some((t) => searchable.indexOf(t) !== -1)) continue

          results.push({
            id: `official-${Date.now()}-${i + 1}`,
            sourceType: 'official_product_page',
            sourceDomain: hostname,
            title: title || url,
            url,
            snippet: content.slice(0, 700),
            brand: source.brand,
            model,
            badge: 'Fonte oficial do fabricante',
            specs: null,
            evidence: {
              source_url: url,
              source_domain: hostname,
              extraction_status: 'pending',
              match_status: 'candidate',
              discovery_provider: 'tavily_official_domain',
              search_query: searchQuery,
              official_domain_match: true,
            },
          })
        }
      } else if (results.length === 0 && searchResponse) {
        $app.logger().warn('Tavily retornou erro', 'statusCode', searchResponse.statusCode)
      }
    }
  }

  for (const result of results) addCandidate(result)

  if (results.length === 0) {
    return finalize(
      'not_found',
      [],
      `Site oficial consultado (${source.brand} — ${source.domain}). ${NOT_FOUND_MSG}`,
    )
  }

  const primary = results[0]
  const message =
    results.length > 1
      ? `Resultado principal em ${primary.sourceDomain} + ${results.length - 1} outro(s) resultado(s) no site oficial. Revise antes de extrair ou aplicar dados.`
      : `Resultado principal em ${primary.sourceDomain}. Revise antes de extrair ou aplicar dados.`
  return finalize('found', results, message)
})
