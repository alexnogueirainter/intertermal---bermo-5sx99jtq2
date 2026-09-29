/**
 * Hook: Análise IA da visita — plano de ação sugerido a partir do que o técnico registrou.
 * Route: POST /backend/v1/field-visits/ai-plan
 * Body: { visit: { work_type, equipments: [...], general_notes, free_description } }
 *
 * REGRAS DA ANÁLISE DA IA:
 * 1. Baseada EXCLUSIVAMENTE nas informações registradas pelo técnico (formulário, observações, fotos, transcrições).
 * 2. PROIBIDO inventar/presumir/completar dados não registrados. Se faltar informação essencial: "Informação não levantada na visita: [qual dado falta]".
 * 3. Recomendações embasadas em referências técnicas dos fabricantes (manuais, especificações), citando a origem.
 *    Sem referência disponível -> "requer consulta ao fabricante", nunca solução genérica.
 * 4. Linguagem industrial e técnica de trocadores de calor e válvulas.
 * 5. GRAU DE DIFICULDADE: considerar APENAS condições do local de instalação (acesso ao equipamento, espaço para manobra, altura, andaime/guindaste, espaço confinado, interferência, distância para descarga). NÃO considerar complexidade técnica do reparo.
 *    Campo dedicado "Condições do local de instalação" com descrição e grau correspondente.
 *    Se o técnico não registrou: "Condições do local não detalhadas na visita".
 * 6. SAÍDA EM 4 SEÇÕES por item ou no plano:
 *    - 1. Diagnóstico (só o que o técnico registrou)
 *    - 2. Ações recomendadas (com referência do fabricante quando disponível; senão "requer consulta ao fabricante")
 *    - 3. Condições do local de instalação e grau de dificuldade correspondente
 *    - 4. Itens pendentes de levantamento ("Informação não levantada na visita: ...")
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
    if (eq.name) parts.push('Identificação: ' + eq.name)
    if (eq.model) parts.push('Modelo: ' + eq.model)
    if (eq.manufacturer) parts.push('Fabricante: ' + eq.manufacturer)
    if (eq.serialNumber) parts.push('Número de série: ' + eq.serialNumber)
    if (eq.plateCount) parts.push('Qtd de placas: ' + eq.plateCount)
    if (eq.installedLocation) parts.push('Local instalado (físico): ' + eq.installedLocation)
    if (eq.fluid1) parts.push('Fluido primário (lado 1): ' + eq.fluid1)
    if (eq.fluid2) parts.push('Fluido secundário (lado 2): ' + eq.fluid2)
    if (eq.inletTemp) parts.push('Temp. entrada: ' + eq.inletTemp + ' °C')
    if (eq.outletTemp) parts.push('Temp. saída: ' + eq.outletTemp + ' °C')
    if (eq.flowRate) parts.push('Vazão: ' + eq.flowRate + (eq.flowUnit ? ' ' + eq.flowUnit : ''))
    if (eq.difficulty) parts.push('Grau de dificuldade físico do acesso: ' + eq.difficulty)
    if (eq.technicianNotes)
      parts.push('Observações e relato técnico do mecânico: ' + eq.technicianNotes)
    const hasPhotos = Array.isArray(eq.attachments) && eq.attachments.length > 0
    parts.push(
      'Anexos registrados: ' +
        (hasPhotos
          ? String(eq.attachments.length)
          : eq.attachments_count
            ? String(eq.attachments_count)
            : '0'),
    )
    if (parts.length > 0) {
      const numStr = i + 1 < 10 ? '0' + (i + 1) : String(i + 1)
      const spec = [eq.manufacturer, eq.model].filter(Boolean).join(' ')
      const eqTag = spec ? 'Equipamento ' + numStr + ' - ' + spec : 'Equipamento ' + numStr
      eqLines.push(eqTag + ' [id: ' + (eq.id || '') + ']: ' + parts.join('; '))
    }
  }

  const corpus = [
    visit.work_type ? 'Tipo de visita técnica: ' + visit.work_type : '',
    visit.company_name ? 'Empresa cliente: ' + visit.company_name : '',
    visit.client_work_area ? 'Área / Setor da fábrica: ' + visit.client_work_area : '',
    visit.general_notes ? 'Observações gerais registradas: ' + visit.general_notes : '',
    visit.free_description
      ? 'Descrição livre / Levantamento de campo: ' + visit.free_description
      : '',
    eqLines.length > 0 ? '--- DADOS DOS EQUIPAMENTOS LEVANTADOS ---\n' + eqLines.join('\n') : '',
  ]
    .filter(Boolean)
    .join('\n\n')

  if (!corpus || corpus.length < 20) {
    return e.json(200, {
      ok: false,
      reason: 'sem_conteudo',
      message: 'Sem conteúdo suficiente para análise.',
    })
  }

  const systemPrompt = [
    'Você é engenheiro especialista sênior da Intertermal / Bermo (engenharia térmica, trocadores de calor de placas gaxetadas, brasados, espirais e válvulas industriais).',
    'Sua função é gerar a "Análise da IA" (plano de ação) com base EXCLUSIVAMENTE nas informações levantadas pelo técnico na visita a campo.',
    'O plano orienta a elaboração do orçamento comercial e a equipe técnica.',
    '',
    'REGRAS MANDATÓRIAS E INEGOCIÁVEIS:',
    '1. FIDELIDADE ABSOLUTA AOS DADOS COLETADOS:',
    '   - Baseie-se EXCLUSIVAMENTE nas informações registradas no texto enviado (formulário, observações, notas dos equipamentos, transcrições).',
    '   - É ESTRITAMENTE PROIBIDO inventar, presumir ou completar dados não registrados. Nunca infira diâmetros, pressões, vazões ou modelos sem registro.',
    '2. DADOS FALTANTES / PENDÊNCIAS:',
    '   - Se faltar informação essencial para o dimensionamento ou orçamento (ex.: modelo exato, número de série/plaqueta, quantidade de placas, vazão, temperaturas de entrada/saída, fluidos em operação), obrigatoriamente liste no formato: "Informação não levantada na visita: [qual dado falta]".',
    '3. EMBASAMENTO TÉCNICO E FABRICANTES:',
    '   - Recomendações devem ser embasadas em referências técnicas dos fabricantes (manuais de operação e manutenção, procedimentos de aperto de tirantes a frio/quente, substituição de gaxetas, CIP/desincrustação, normas ASME/DIN/ABNT), citando a origem (ex.: "conforme recomendação do fabricante Bermo para trocadores de placas", "conforme manual Alfa Laval para este modelo").',
    '   - Se NÃO houver referência técnica disponível ou o fabricante for desconhecido: sinalizar expressamente "requer consulta ao fabricante". NUNCA proponha solução genérica sem referência.',
    '   - Empregue linguagem industrial e técnica rigorosa de trocadores de calor e válvulas industriais.',
    '4. GRAU DE DIFICULDADE (ATENÇÃO MÁXIMA):',
    '   - O grau de dificuldade considera APENAS as condições do local de instalação: acesso ao equipamento, espaço físico para manobra das placas/ferramental, altura de trabalho, necessidade de andaime ou guindaste/talha, espaço confinado, interferência com tubulações da produção ativa, distância para descarga/transporte de peças.',
    '   - NUNCA considerar a complexidade técnica do reparo mecânico como grau de dificuldade (o grau de dificuldade é puramente físico/logístico e impacta mão de obra, equipe, equipamentos de acesso e tempo de serviço).',
    '   - Se o técnico registrou detalhes do local/acesso: descreva as condições do local de instalação e o grau de dificuldade correspondente (Baixo, Médio ou Alto).',
    '   - Se o técnico NÃO registrou informações sobre o local de instalação/acesso: preencha exatamente "Condições do local não detalhadas na visita" — NUNCA presuma.',
    '5. ESTRUTURAÇÃO OBRIGATÓRIA DA SAÍDA — CADA ITEM DEVE CONTER AS 4 SEÇÕES:',
    '   - Seção 1: Diagnóstico (só o que o técnico registrou, sem presunções)',
    '   - Seção 2: Ações recomendadas (com referência do fabricante quando disponível; senão "requer consulta ao fabricante")',
    '   - Seção 3: Condições do local de instalação e grau de dificuldade correspondente (apenas acesso físico)',
    '   - Seção 4: Itens pendentes de levantamento ("Informação não levantada na visita: ...")',
    '',
    'FORMATO DA RESPOSTA: Retorne APENAS um JSON válido (sem texto antes ou depois, sem markdown adicional fora do bloco json):',
    '{',
    '  "items": [',
    '    {',
    '      "title": "Título conciso da intervenção ou estudo",',
    '      "priority": "Alta | Média | Baixa",',
    '      "equipment_id": "id do equipamento vinculado se houver, ou vazio se geral",',
    '      "diagnosis": "1. Diagnóstico: descrição objetiva do estado constatado pelo técnico",',
    '      "suggestedAction": "2. Ações recomendadas para orçamento e reparo",',
    '      "technicalReference": "Referência do fabricante citada ou requer consulta ao fabricante",',
    '      "installationConditions": "3. Condições do local de instalação e grau de dificuldade correspondente (ou Condições do local não detalhadas na visita)",',
    '      "pendingItems": [',
    '        "Informação não levantada na visita: modelo da placa",',
    '        "Informação não levantada na visita: temperatura de saída"',
    '      ],',
    '      "description": "Resumo integrado citando dados técnicos coletados"',
    '    }',
    '  ]',
    '}',
    'Gere entre 1 e 4 itens pertinentes ao que foi levantado em campo.',
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
    const m = raw.match(/\{[\s\S]*\}/)
    if (!m) {
      return e.json(200, {
        ok: false,
        reason: 'ai_sem_json',
        message: 'IA não retornou plano em formato estruturado.',
      })
    }
    const parsed = JSON.parse(m[0])
    const items = Array.isArray(parsed.items) ? parsed.items.slice(0, 4) : []
    if (items.length === 0) {
      return e.json(200, {
        ok: false,
        reason: 'ai_sem_itens',
        message: 'IA não gerou itens para este conteúdo.',
      })
    }

    // Normaliza cada item garantindo a presença das 4 seções
    const sanitizedItems = items.map((it, idx) => {
      const eqId = it.equipment_id || ''
      const pending = Array.isArray(it.pendingItems)
        ? it.pendingItems.map((p) => String(p).trim()).filter(Boolean)
        : []

      const technicalRef = (it.technicalReference || '').trim() || 'requer consulta ao fabricante'
      const installCond =
        (it.installationConditions || '').trim() || 'Condições do local não detalhadas na visita'
      const diag =
        (it.diagnosis || it.description || '').trim() ||
        'Diagnóstico baseado nas observações registradas pelo técnico.'
      const action =
        (it.suggestedAction || '').trim() || 'Ação a definir conforme especificação técnica.'

      return {
        title: it.title || 'Ação Técnica #' + (idx + 1),
        priority: ['Alta', 'Média', 'Baixa'].includes(it.priority) ? it.priority : 'Média',
        equipment_id: eqId,
        diagnosis: diag,
        suggestedAction: action,
        technicalReference: technicalRef,
        installationConditions: installCond,
        pendingItems: pending,
        description: it.description || diag,
      }
    })

    return e.json(200, { ok: true, items: sanitizedItems })
  } catch (err) {
    console.error('[ai-plan] erro na análise IA: ' + err)
    return e.json(200, {
      ok: false,
      reason: 'ai_erro',
      message: 'Falha na análise IA. Mantido o plano automático.',
    })
  }
})
