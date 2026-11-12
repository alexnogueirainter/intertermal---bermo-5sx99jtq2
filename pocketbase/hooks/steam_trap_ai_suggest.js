// pocketbase/hooks/steam_trap_ai_suggest.js
// Sugestão de severidade + recomendação para achados da Inspeção de Purgadores (VKP).
// O frontend envia o texto do achado; o hook chama $ai.chat (gateway Skip AI) e devolve
// severidade (Crítica/Alta/Média) + recomendação em uma frase. Sem chaves de provedor.

routerAdd(
  'POST',
  '/backend/v1/steam-trap/ai-suggest',
  (e) => {
    const body = e.requestInfo().body || {}
    const title = String(body.title || '')
      .trim()
      .slice(0, 300)
    const description = String(body.description || '')
      .trim()
      .slice(0, 2000)
    const location = String(body.location || '')
      .trim()
      .slice(0, 200)
    const text = (title + ' ' + description).trim()
    if (!text) {
      throw new BadRequestError('Informe o título ou a descrição do achado.')
    }

    const prompt =
      'Você é engenheiro de aplicação especialista em sistemas de vapor e condensado (purgadores, trocadores de calor, caldeiras) em plantas industriais brasileiras. Um técnico registrou o seguinte achado em uma inspeção de purgadores:\n\n' +
      'Título: ' +
      (title || '(sem título)') +
      '\n' +
      'Local: ' +
      (location || '(não informado)') +
      '\n' +
      'Descrição: ' +
      (description || '(sem descrição)') +
      '\n\n' +
      'Responda APENAS um JSON válido, sem markdown, no formato exato: {"severity":"Crítica|Alta|Média","recommendation":"<uma frase objetiva, em português, com a ação corretiva>"}\n' +
      'Critério de severidade: Crítica = risco de segurança ou parada de produção iminente (vapor vivo direto, válvula de segurança ausente, golpe de aríete); Alta = perda energética relevante ou degradação de processo; Média = monitoramento/melhoria.'

    const reply = $ai.chat({
      model: 'fast',
      messages: [
        { role: 'system', content: 'Responda somente com JSON válido, sem texto adicional.' },
        { role: 'user', content: prompt },
      ],
    })

    const raw = String(reply.choices?.[0]?.message?.content || '')
    // extrai o primeiro objeto JSON da resposta (tolerante a cercas de markdown)
    const m = raw.match(/\{[\s\S]*\}/)
    if (!m) {
      throw new BadRequestError('IA não retornou JSON válido.')
    }
    let parsed
    try {
      parsed = JSON.parse(m[0])
    } catch (err) {
      throw new BadRequestError('IA retornou JSON malformado.')
    }
    const severity = ['Crítica', 'Alta', 'Média'].includes(String(parsed.severity))
      ? String(parsed.severity)
      : 'Alta'
    const recommendation = String(parsed.recommendation || '').slice(0, 500)
    if (!recommendation) {
      throw new BadRequestError('IA não retornou recomendação.')
    }
    return e.json(200, { severity, recommendation })
  },
  $apis.requireAuth(),
)
