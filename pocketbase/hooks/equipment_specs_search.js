routerAdd('POST', '/backend/v1/equipment/search-specs', (e) => {
  const body = e.requestInfo().body || {}
  const modelQuery = (body.model || '').trim()

  if (!modelQuery) {
    return e.json(400, { error: 'Modelo do equipamento é obrigatório para busca.' })
  }

  try {
    const prompt = `Você é um especialista em engenharia de trocadores de calor a placas e válvulas industriais com foco técnico nas marcas BERMO (bermo.com.br), Alfa Laval (alfalaval.com.br), ARI Armaturen, Danfoss, Sondex, Kelvion, Swep, Tranter e APV.

O usuário pesquisou pelo modelo de equipamento ou trocador de calor: "${modelQuery}".

Sua tarefa:
1. Identifique o fabricante mais provável (ex: BERMO, Alfa Laval, ARI Armaturen, Swep, Kelvion, etc.) e as especificações técnicas típicas deste modelo de acordo com a literatura técnica e catálogos oficiais do fabricante (bermo.com.br, alfalaval.com.br, etc.).
2. Se você encontrar o modelo ou família correspondente, responda estritamente em formato JSON válido com as chaves:
{
  "found": true,
  "brand": "BERMO" | "Alfa Laval" | "Outro fabricante",
  "model": "Código/Modelo normalizado",
  "name": "Nome técnico completo do equipamento",
  "description": "Breve descrição técnica",
  "specs": {
    "connection": "ex: DN50 (2 pol) Flangeado ou 2 pol BSP ou Tri-Clamp",
    "pressure": "ex: 16 bar ou 10 bar ou 25 bar",
    "temperature": "ex: -10°C a 160°C",
    "material": "ex: AISI 316L (0.5mm) ou Titânio",
    "gasketMaterial": "ex: EPDM Clip-on / NBR ou Viton",
    "platesRange": "ex: 20 a 100 placas",
    "plateDimensions": "ex: 680 x 280 mm",
    "gasketsCount": "ex: 40",
    "maxFlowRate": "ex: 35 m³/h",
    "applications": "ex: Vapor, condensado, CIP, alimentício ou industrial"
  },
  "source": "Catálogo do Fabricante (ex: bermo.com.br / alfalaval.com.br)"
}

3. Se o modelo não for reconhecido como nenhum equipamento conhecido de trocadores ou válvulas industriais mesmo após busca profunda, retorne:
{
  "found": false,
  "brand": "Outro",
  "model": "${modelQuery}",
  "specs": null,
  "message": "Modelo não localizado nos catálogos técnicos online. Campos abertos para preenchimento manual."
}

IMPORTANTE: Responda APENAS com o objeto JSON válido, sem crases de markdown e sem texto antes ou depois.`

    const reply = $ai.chat({
      model: 'fast',
      messages: [
        {
          role: 'system',
          content:
            'Você é um assistente técnico que retorna única e exclusivamente dados em formato JSON estrito para integração de sistemas de engenharia.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
    })

    const rawContent =
      reply.choices && reply.choices[0] && reply.choices[0].message
        ? reply.choices[0].message.content
        : ''

    let cleaned = rawContent.trim()
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '')
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '')
    }

    let parsed = null
    try {
      parsed = JSON.parse(cleaned)
    } catch (parseErr) {
      // Se não conseguiu parsear direto, tenta extrair bloco JSON
      const firstBrace = cleaned.indexOf('{')
      const lastBrace = cleaned.lastIndexOf('}')
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        parsed = JSON.parse(cleaned.substring(firstBrace, lastBrace + 1))
      }
    }

    if (parsed && typeof parsed === 'object') {
      return e.json(200, parsed)
    }

    return e.json(200, {
      found: false,
      brand: 'Outro',
      model: modelQuery,
      specs: null,
      message: 'Modelo não identificado automaticamente. Preenchimento manual disponível.',
    })
  } catch (err) {
    return e.json(200, {
      found: false,
      brand: 'Outro',
      model: modelQuery,
      specs: null,
      message: 'Busca online indisponível no momento. Preencha manualmente os campos técnicos.',
    })
  }
})
