routerAdd('POST', '/backend/v1/equipment/search-specs', (e) => {
  const body = e.requestInfo().body || {}
  const modelQuery = (body.model || '').trim()

  if (!modelQuery) {
    return e.json(400, { error: 'Modelo do equipamento é obrigatório para busca.' })
  }

  try {
    const prompt = `Você é um engenheiro sênior especialista em trocadores de calor a placas, trocadores brasados e válvulas industriais.
Sua principal base de conhecimento são os catálogos técnicos oficiais dos fabricantes BERMO (www.bermo.com.br) e Alfa Laval (www.alfalaval.com.br), bem como ARI Armaturen, Swep, Kelvion, Sondex, Danfoss, Tranter e APV.

O usuário pesquisou pelo modelo de equipamento: "${modelQuery}".

Sua tarefa:
1. Priorize a identificação nos catálogos e literaturas técnicas da BERMO (www.bermo.com.br) e Alfa Laval (www.alfalaval.com.br).
2. Se o modelo corresponder a um trocador de calor ou válvula industrial (ex: BP, BL, BM, BTL, T5, M6, M10, M15, TL10, TS6, CLIP, AQ4, etc.), forneça os dados técnicos oficiais e típicos.
3. Se for encontrado, retorne estritamente um JSON no seguinte formato:
{
  "found": true,
  "brand": "BERMO" | "Alfa Laval" | "Nome do Fabricante",
  "model": "Código/Modelo normalizado (ex: BP30, M10-B, T5-BFG)",
  "name": "Nome técnico descritivo (ex: Trocador de Calor a Placas BERMO BP30)",
  "description": "Breve descrição técnica das aplicações e características",
  "specs": {
    "connection": "ex: DN50 (2 pol) Flangeado / Roscado BSP",
    "pressure": "ex: 16 bar ou 10 bar",
    "temperature": "ex: -10°C a 160°C",
    "material": "ex: AISI 316L (0.5mm) ou Titânio",
    "gasketMaterial": "ex: EPDM Clip-on / NBR / Viton",
    "platesRange": "ex: 40 ou 20 a 80 placas",
    "plateDimensions": "ex: 680 x 280 mm",
    "gasketsCount": "ex: 40",
    "maxFlowRate": "ex: 35 m³/h",
    "applications": "ex: Vapor, condensado, CIP, alimentício ou utilidades"
  },
  "source": "Catálogo Fabricante (www.bermo.com.br / www.alfalaval.com.br)"
}

4. Se o modelo NÃO puder ser identificado como trocador ou válvula industrial, retorne:
{
  "found": false,
  "brand": "Outro",
  "model": "${modelQuery}",
  "specs": null,
  "message": "Modelo não localizado nos catálogos oficiais BERMO / Alfa Laval na internet. Preenchimento manual disponível."
}

IMPORTANTE: Responda APENAS com o JSON válido, sem qualquer texto adicional antes ou depois, e sem markdown com crases.`

    const reply = $ai.chat({
      model: 'fast',
      messages: [
        {
          role: 'system',
          content:
            'Você é um assistente técnico que retorna única e exclusivamente dados em formato JSON estrito para integração de sistemas de engenharia térmica e industrial.',
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
      message: 'Modelo não identificado automaticamente. Preenchimento manual liberado.',
    })
  } catch (err) {
    return e.json(200, {
      found: false,
      brand: 'Outro',
      model: modelQuery,
      specs: null,
      message: 'Busca online indisponível. Preenchimento manual liberado.',
    })
  }
})
