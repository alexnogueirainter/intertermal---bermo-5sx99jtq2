/**
 * Hook: Análise IA da visita — plano de ação sugerido a partir do que o técnico registrou.
 * Route: POST /backend/v1/field-visits/ai-plan
 * Body: { visit: { work_type, equipments: [{name, model, fluid1, fluid2, inletTemp, outletTemp, flowRate, flowUnit, difficulty, technicianNotes}], general_notes, free_description } }
 * Regras: só texto (fotos nunca enviadas); proibido inventar dados; 1-3 itens;
 * cada item traz equipment_id quando o problema é de um equipamento específico
 * (o PDF vincula as fotos já anexadas daquele equipamento).
 */
routerAdd('POST', '/backend/v1/field-visits/ai-plan', (e) => {
  const body = e.requestInfo().body || {}
  const visit = body.visit || {}

  // Monta o corpus de texto — apenas o que o técnico registrou
  const eqs = Array.isArray(visit.equipments) ? visit.equipments : []
  const eqLines = []
  for (let i = 0; i < eqs.length; i++) {
    const eq = eqs[i]
    const parts = []
    if (eq.name) parts.push('Nome: ' + eq.name)
    if (eq.model) parts.push('Modelo: ' + eq.model)
    if (eq.manufacturer) parts.push('Fabricante: ' + eq.manufacturer)
    if (eq.fluid1) parts.push('Fluido 1: ' + eq.fluid1)
    if (eq.fluid2) parts.push('Fluido 2: ' + eq.fluid2)
    if (eq.inletTemp) parts.push('Temp. entrada: ' + eq.inletTemp + ' °C')
    if (eq.outletTemp) parts.push('Temp. saída: ' + eq.outletTemp + ' °C')
    if (eq.flowRate) parts.push('Vazão: ' + eq.flowRate + (eq.flowUnit ? ' ' + eq.flowUnit : ''))
    if (eq.difficulty) parts.push('Dificuldade: ' + eq.difficulty)
    if (eq.technicianNotes) parts.push('Observações do técnico: ' + eq.technicianNotes)
    const hasPhotos = Array.isArray(eq.attachments) && eq.attachments.length > 0
    parts.push('Fotos anexadas: ' + (hasPhotos ? String(eq.attachments.length) : '0'))
    if (parts.length > 0) {
      eqLines.push('Equipamento #' + (i + 1) + ' (id: ' + (eq.id || '') + '): ' + parts.join('; '))
    }
  }

  const corpus = [
    visit.work_type ? 'Tipo de visita: ' + visit.work_type : '',
    visit.general_notes ? 'Observações gerais: ' + visit.general_notes : '',
    visit.free_description ? 'Descrição livre: ' + visit.free_description : '',
    eqLines.join('\n'),
  ]
    .filter(Boolean)
    .join('\n')

  if (!corpus || corpus.length < 20) {
    return e.json(200, {
      ok: false,
      reason: 'sem_conteudo',
      message: 'Sem conteúdo suficiente para análise.',
    })
  }

  const systemPrompt = [
    'Você é engenheiro sênior da Intertermal (trocadores de calor BERMO, válvulas de segurança, skids).',
    'Gere um plano de ação técnico a partir EXCLUSIVAMENTE dos dados registrados pelo técnico em campo.',
    'REGRAS ABSOLUTAS:',
    '1. NUNCA invente dados, números, nomes de peças ou condições não mencionados no texto.',
    '2. Campo não informado = "informação não registrada". Não presuma.',
    '3. Retorne APENAS JSON válido, sem texto fora do JSON:',
    '{"items":[{"title":"...","description":"...","priority":"Alta|Média|Baixa","suggestedAction":"...","equipment_id":"id do equipamento ou vazio"}]}',
    '4. Entre 1 e 3 itens. Título curto. Descrição cita os dados registrados.',
    '5. Se o técnico sinalizar problema em um equipamento (ex.: gaxeta ressecada), preencha equipment_id com o id daquele equipamento (as fotos dele serão anexadas ao relatório).',
    '6. Se não houver problema sinalizado, sugira ação preventiva e deixe equipment_id vazio.',
  ].join('\n')

  try {
    const reply = $ai.chat({
      model: 'fast',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: corpus },
      ],
    })
    const raw = reply.choices[0].message.content || ''
    // Extrai o JSON da resposta (tolera cercas de código)
    const m = raw.match(/\{[\s\S]*\}/)
    if (!m) {
      return e.json(200, {
        ok: false,
        reason: 'ai_sem_json',
        message: 'IA não retornou plano válido.',
      })
    }
    const parsed = JSON.parse(m[0])
    const items = Array.isArray(parsed.items) ? parsed.items.slice(0, 3) : []
    if (items.length === 0) {
      return e.json(200, { ok: false, reason: 'ai_sem_itens', message: 'IA não gerou itens.' })
    }
    return e.json(200, { ok: true, items: items })
  } catch (err) {
    console.error('[ai-plan] erro na análise IA: ' + err)
    return e.json(200, {
      ok: false,
      reason: 'ai_erro',
      message: 'Falha na análise IA. Mantido o plano automático.',
    })
  }
})
