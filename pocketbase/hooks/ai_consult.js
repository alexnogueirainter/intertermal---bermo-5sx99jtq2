routerAdd('POST', '/backend/v1/ai/consult', (e) => {
  const body = e.requestInfo().body || {}
  const prompt = body.prompt || ''
  const context = body.context || 'Geral'

  if (!prompt || typeof prompt !== 'string') {
    return e.json(400, { error: 'Prompt é obrigatório.' })
  }

  try {
    const reply = $ai.chat({
      model: 'fast',
      messages: [
        {
          role: 'system',
          content: `Você é o Copiloto Comercial e de Negócios do sistema "Localizar Modelo" (CRM Comercial Sofisticado).
Sua missão é responder perguntas em Português do Brasil com clareza, objetividade e sofisticação estratégica.
Você tem conhecimento sobre:
1. Onde estão os modelos e dados: Propostas/Orçamentos (quotes), Clientes (clients), Negócios/Pipeline (deals), Produtos/Catálogo (products), Atendimento/Chamados (tickets), Contratos e Serviços (services), Tarefas e Atividades (activities).
2. Dicas práticas de vendas B2B, roteiros de fechamento, estratégias de follow-up, precificação e retenção.
3. Sugestão de modelos de mensagem para WhatsApp, e-mail comercial, propostas formais e SLA de atendimento.
Contexto fornecido pelo usuário: ${context}
Seja encorajador, estruturado (use tópicos quando adequado) e conciso.`,
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
    })

    const answer =
      reply.choices && reply.choices[0] && reply.choices[0].message
        ? reply.choices[0].message.content
        : 'Não foi possível gerar uma resposta no momento.'

    return e.json(200, { reply: answer })
  } catch (err) {
    return e.json(200, {
      reply:
        'Sugestão do Copiloto Comercial: Verifique o funil de vendas na aba "Pipeline & Oportunidades", visualize os modelos em "Orçamentos & Modelos" ou explore os dados do cliente em "Clientes 360°". Estamos prontos para acelerar suas conversões!',
    })
  }
})
