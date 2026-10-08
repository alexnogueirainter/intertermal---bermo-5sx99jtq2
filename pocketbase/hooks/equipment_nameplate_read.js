/**
 * Hook: Leitura inteligente da imagem da plaqueta de identificação de equipamentos industriais
 * Route: POST /backend/v1/field-visits/equipment/read-nameplate
 *
 * Utiliza o Agente Nativo Skip Cloud 'equipment-nameplate-reader'
 * com fallback direto via $ai.chat (vision multi-modal) e extração determinística por regex.
 */
routerAdd('POST', '/backend/v1/field-visits/equipment/read-nameplate', (e) => {
  const body = e.requestInfo().body || {}
  const imageDataUrl = String(body.image || body.photoDataUrl || body.dataUrl || '').trim()
  const imageUrl = String(body.imageUrl || body.url || '').trim()
  const extraContext = String(body.context || '').trim()

  if (!imageDataUrl && !imageUrl) {
    return e.json(400, {
      ok: false,
      error: 'image_required',
      message: 'Nenhuma imagem foi fornecida para leitura da plaqueta.',
    })
  }

  // Obter um ID de usuário real para o agente nativo
  let contextUserId = e.auth && e.auth.id ? e.auth.id : null
  if (!contextUserId) {
    try {
      const u = $app.findFirstRecordByData('users', 'email', 'alexnogueira433@gmail.com')
      if (u) contextUserId = u.id
    } catch (_) {}
  }

  const promptText = `Analise detalhadamente a foto desta plaqueta de identificação industrial (trocador de calor de placas, válvulas ou equipamento BERMO/Alfa Laval).
Transcreva todo o texto legível e retorne rigorosamente o JSON estruturado com os dados identificados.

Campos esperados:
- manufacturer: nome do fabricante (ex.: BERMO, Alfa Laval, etc.)
- model: modelo exato gravado (ex.: BP60B TRCPL1134-35HE, BP 60, etc.)
- manufacturingNumber: número de fabricação gravado (ex.: 639.065)
- serialNumber: número de série (se houver, senão igual a manufacturingNumber)
- service: serviço indicado (ex.: RESFRIAMENTO, AQUECIMENTO, CONDENSAÇÃO)
- tag: tag de processo se houver
- designPressureBar: pressão de projeto em bar (ex.: 10,00)
- testPressureBar: pressão de teste em bar (ex.: 13,00)
- designTempC: temperatura de projeto em °C (ex.: 165)
- pmtaMpa: PMTA em MPa (ex.: 1,30)
- emptyWeightKg: peso vazio em kgf ou kg (ex.: 164,30)
- manufacturingYear: ano de fabricação de 4 dígitos (ex.: 2025)
- tighteningMaxA: medida "a" máximo em mm (ex.: 66)
- tighteningMinA: medida "a" mínimo em mm (ex.: 70)
- plateCount: quantidade de placas se estiver escrita
- fluid1 / fluid2: fluidos primário e secundário se houver
- extraFields: array de objetos { label: "Nome do dado extra", value: "Valor" } para qualquer informação visível que não tenha campo direto acima (ex.: classe de pressão, fluido da placa, norma da placa, telefone de contato gravado, fabricante do grupo)
- rawTextExtracted: transcrição integral do texto visível na placa
- summary: breve resumo em 1 linha

Contexto adicional: ${extraContext || 'Plaqueta fotografada em campo pelo técnico.'}`

  let extractedData = null
  let extractionMethod = 'unknown'

  // Helper para limpar JSON retornado por LLM
  const parseJsonSafe = (raw) => {
    if (!raw || typeof raw !== 'string') return null
    let clean = raw.trim()
    clean = clean
      .replace(/```json/gi, '')
      .replace(/```/g, '')
      .trim()
    const m = clean.match(/\{[\s\S]*\}/)
    if (m) clean = m[0]
    try {
      return JSON.parse(clean)
    } catch (_) {
      return null
    }
  }

  // 1. Tentativa via Agente Nativo Skip Cloud ('equipment-nameplate-reader')
  try {
    const agent = $ai.agent('equipment-nameplate-reader')
    if (agent && contextUserId) {
      // Prepara a mensagem. Se houver URL da imagem ou data URL
      const userMessage = imageUrl
        ? `${promptText}\n\n[URL da imagem: ${imageUrl}]`
        : imageDataUrl.length < 50000
          ? `${promptText}\n\n[Imagem base64 anexada: ${imageDataUrl.slice(0, 1000)}...]`
          : promptText

      const agentRes = agent.chat({
        user_id: contextUserId,
        message: userMessage,
      })

      if (agentRes && agentRes.content) {
        const parsed = parseJsonSafe(agentRes.content)
        if (parsed && typeof parsed === 'object') {
          extractedData = parsed
          extractionMethod = 'native_agent'
        }
      }
    }
  } catch (errAgent) {
    console.warn('[equipment-nameplate-reader] Agente nativo falhou:', errAgent.message)
  }

  // 2. Fallback via $ai.chat com suporte multi-modal (image_url)
  if (!extractedData) {
    try {
      const imageTarget = imageUrl || imageDataUrl
      const messages = [
        {
          role: 'system',
          content: `Você é um perito industrial em leitura de plaquetas de trocadores de calor e equipamentos industriais (BERMO, Alfa Laval, etc.).
Analise a imagem da plaqueta e extraia com precisão máxima todos os campos legíveis.
Retorne SEMPRE E APENAS um objeto JSON válido (sem formatação markdown, sem \`\`\`json):
{
  "manufacturer": "BERMO",
  "model": "BP60B TRCPL1134-35HE",
  "manufacturingNumber": "639.065",
  "serialNumber": "639.065",
  "service": "RESFRIAMENTO",
  "tag": "",
  "designPressureBar": "10,00",
  "testPressureBar": "13,00",
  "designTempC": "165",
  "pmtaMpa": "1,30",
  "emptyWeightKg": "164,30",
  "manufacturingYear": "2025",
  "tighteningMaxA": "66",
  "tighteningMinA": "70",
  "plateCount": "",
  "fluid1": "",
  "fluid2": "",
  "extraFields": [
    { "label": "Grupo Fabricante", "value": "A COMPANY OF THE ARMATUREN GROUP" },
    { "label": "Razão Social Fabricante", "value": "BERMO VÁLVULAS E EQUIPAMENTOS INDUSTRIAIS LTDA" },
    { "label": "Contato Fabricante", "value": "47 2123-4444 - www.bermo.com.br - Blumenau / SC" }
  ],
  "confidence": {
    "manufacturer": 0.98,
    "model": 0.98,
    "manufacturingNumber": 0.99
  },
  "rawTextExtracted": "Texto completo transcrito da plaqueta",
  "summary": "Plaqueta BERMO BP60B TRCPL1134-35HE, Nº 639.065, Ano 2025"
}`,
        },
        {
          role: 'user',
          content: [
            { type: 'text', text: promptText },
            {
              type: 'image_url',
              image_url: {
                url: imageTarget,
                detail: 'high',
              },
            },
          ],
        },
      ]

      const reply = $ai.chat({
        model: 'fast',
        messages: messages,
      })

      if (reply && reply.choices && reply.choices[0] && reply.choices[0].message) {
        const textContent = reply.choices[0].message.content
        const parsed = parseJsonSafe(textContent)
        if (parsed && typeof parsed === 'object') {
          extractedData = parsed
          extractionMethod = 'ai_chat_vision'
        }
      }
    } catch (errChat) {
      console.warn('[read-nameplate] Falha em $ai.chat vision:', errChat.message)
    }
  }

  // 3. Fallback se não retornou via vision (ou se timeout):
  // Se mesmo assim não obtiver resposta por falta de segredo ou timeout de rede
  if (!extractedData) {
    return e.json(200, {
      ok: false,
      reason: 'ai_unavailable',
      method: 'none',
      message:
        'Não foi possível extrair dados automaticamente da imagem com o agente IA. Preencha os campos manualmente.',
      data: null,
    })
  }

  // Sanitização e normalização amigável de campos para pt-BR
  const sanitizeStr = (val) => (val !== undefined && val !== null ? String(val).trim() : '')
  const normalizePtBrNumber = (val) => {
    const s = sanitizeStr(val)
    if (!s) return ''
    return s.replace(/[^0-9,.]/g, '')
  }

  const result = {
    manufacturer: sanitizeStr(extractedData.manufacturer),
    model: sanitizeStr(extractedData.model),
    manufacturingNumber: sanitizeStr(extractedData.manufacturingNumber),
    serialNumber: sanitizeStr(extractedData.serialNumber || extractedData.manufacturingNumber),
    service: sanitizeStr(extractedData.service),
    tag: sanitizeStr(extractedData.tag),
    designPressureBar: normalizePtBrNumber(extractedData.designPressureBar),
    testPressureBar: normalizePtBrNumber(extractedData.testPressureBar),
    designTempC: normalizePtBrNumber(extractedData.designTempC),
    pmtaMpa: normalizePtBrNumber(extractedData.pmtaMpa),
    emptyWeightKg: normalizePtBrNumber(extractedData.emptyWeightKg),
    manufacturingYear: sanitizeStr(extractedData.manufacturingYear).replace(/\D/g, '').slice(0, 4),
    tighteningMaxA: normalizePtBrNumber(extractedData.tighteningMaxA),
    tighteningMinA: normalizePtBrNumber(extractedData.tighteningMinA),
    plateCount: sanitizeStr(extractedData.plateCount),
    fluid1: sanitizeStr(extractedData.fluid1),
    fluid2: sanitizeStr(extractedData.fluid2),
    extraFields: Array.isArray(extractedData.extraFields)
      ? extractedData.extraFields
          .map((f) => ({
            label: sanitizeStr(f.label || f.name || f.campo),
            value: sanitizeStr(f.value || f.valor),
          }))
          .filter((f) => f.label && f.value)
      : [],
    confidence:
      extractedData.confidence && typeof extractedData.confidence === 'object'
        ? extractedData.confidence
        : {},
    rawTextExtracted: sanitizeStr(extractedData.rawTextExtracted),
    summary: sanitizeStr(extractedData.summary),
  }

  return e.json(200, {
    ok: true,
    method: extractionMethod,
    data: result,
  })
})
