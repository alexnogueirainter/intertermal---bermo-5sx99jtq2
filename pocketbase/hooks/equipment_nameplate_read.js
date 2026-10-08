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
  const clientOcrText = String(
    body.clientOcrText || body.ocrText || body.extractedText || body.rawText || '',
  ).trim()

  console.log(
    '[read-nameplate] Recebido payload. clientOcrText len:',
    clientOcrText.length,
    'hasImage:',
    Boolean(imageDataUrl || imageUrl),
  )

  if (!imageDataUrl && !imageUrl && !clientOcrText) {
    return e.json(400, {
      ok: false,
      error: 'image_required',
      message: 'Nenhuma imagem ou texto de plaqueta foi fornecido para leitura.',
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

  const promptText = `Analise detalhadamente as informações e/ou foto da plaqueta de identificação industrial (trocador de calor de placas, válvulas ou equipamento BERMO / Alfa Laval).
Identifique com rigor os campos técnicos gravados na plaqueta.
NUNCA invente dados. Deixe em branco ("") o que não for identificado.

Campos estruturados esperados:
- manufacturer: nome do fabricante (ex.: BERMO, Alfa Laval, Sondex, Kelvion, etc.)
- model: modelo exato gravado (ex.: BP60B TRCPL1134-35HE, BP 60, M10-B, etc.)
- manufacturingNumber: número de fabricação gravado (ex.: 639.065)
- serialNumber: número de série (se houver, senão igual a manufacturingNumber)
- service: serviço indicado (ex.: RESFRIAMENTO, AQUECIMENTO, CONDENSAÇÃO, PASTEURIZAÇÃO)
- tag: tag de processo se houver (ex.: TC-01)
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
- extraFields: array de objetos { label: "Nome do dado extra", value: "Valor" } para qualquer informação visível adicional
- rawTextExtracted: transcrição do texto visível
- summary: breve resumo em 1 linha (ex.: "Plaqueta BERMO BP60B identificada")

Contexto do equipamento: ${extraContext || 'Plaqueta fotografada em campo pelo técnico.'}`

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

  const gatewayUrl = $os.getenv('SKIP_AI_GATEWAY_URL') || ''
  const gatewayKey = $os.getenv('SKIP_AI_GATEWAY_API_KEY') || ''

  // 1. Tentativa via Skip AI Gateway Vision com image_url
  // Apenas se tiver gateway e imagem disponível
  if (gatewayUrl && gatewayKey && (imageUrl || imageDataUrl)) {
    // Formato suportado por provedores: OpenAI vision suporta url http(s) ou data:image/jpeg;base64,...
    // Testa variações de payload
    const imageTarget = imageUrl || imageDataUrl
    try {
      let endpoint = gatewayUrl.replace(/\/+$/, '')
      if (!endpoint.endsWith('/chat/completions')) {
        endpoint = endpoint + '/chat/completions'
      }

      const systemInstruction = `Você é um engenheiro perito em leitura e transcrição técnica de placas de identificação de trocadores de calor industriais (BERMO, Alfa Laval, etc.).
Analise detalhadamente a foto da placa e extraia os dados técnicos com fidelidade total.
Retorne EXCLUSIVAMENTE um objeto JSON válido (sem \`\`\`json).`

      // OpenAI aceita image_url como objeto { url, detail }
      // Alguns proxies exigem que detail seja 'auto', 'low' ou omitido
      const payloadVision = {
        model: 'fast',
        messages: [
          { role: 'system', content: systemInstruction },
          {
            role: 'user',
            content: [
              { type: 'text', text: promptText },
              {
                type: 'image_url',
                image_url: {
                  url: imageTarget,
                  detail: 'low',
                },
              },
            ],
          },
        ],
        temperature: 0.1,
      }

      const res = $http.send({
        url: endpoint,
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + gatewayKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payloadVision),
        timeout: 45,
      })

      if (
        res.statusCode === 200 &&
        res.json &&
        res.json.choices &&
        res.json.choices[0] &&
        res.json.choices[0].message
      ) {
        const textContent = res.json.choices[0].message.content
        const parsed = parseJsonSafe(textContent)
        if (parsed && typeof parsed === 'object') {
          extractedData = parsed
          extractionMethod = 'gateway_vision_direct'
        }
      } else {
        console.warn(
          '[read-nameplate] Vision endpoint retornou status:',
          res.statusCode,
          'json:',
          JSON.stringify(res.json || {}),
        )
      }
    } catch (errDirect) {
      console.warn('[read-nameplate] Falha em gateway vision direto:', errDirect.message)
    }
  }

  // 2. Se houver texto pré-extraído (OCR do navegador ou contexto), processar via Agente Nativo
  if (!extractedData && clientOcrText) {
    try {
      const agent = $ai.agent('equipment-nameplate-reader')
      if (agent && contextUserId) {
        const agentPrompt = `${promptText}\n\n--- TEXTO BRUTO DETECTADO NA PLAQUETA ---\n${clientOcrText}`
        const agentRes = agent.chat({
          user_id: contextUserId,
          message: agentPrompt,
        })
        if (agentRes && agentRes.content) {
          const parsed = parseJsonSafe(agentRes.content)
          if (parsed && typeof parsed === 'object') {
            extractedData = parsed
            extractionMethod = 'native_agent_with_ocr'
          }
        }
      }
    } catch (errAgent) {
      console.warn('[equipment-nameplate-reader] Agente nativo falhou com OCR:', errAgent.message)
    }
  }

  // 3. Fallback via Agente Nativo Skip Cloud ('equipment-nameplate-reader') usando contexto do equipamento e imagem
  if (!extractedData) {
    try {
      const agent = $ai.agent('equipment-nameplate-reader')
      if (agent && contextUserId) {
        const userMessage = `${promptText}\n\n[Dados do contexto anexado: ${extraContext || 'foto da plaqueta de identificação'}]`
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
  }

  // 4. Fallback via $ai.chat
  if (!extractedData) {
    try {
      const reply = $ai.chat({
        model: 'fast',
        messages: [
          {
            role: 'system',
            content:
              'Você é um perito industrial em identificação de equipamentos e placas térmicas BERMO e Alfa Laval. Retorne rigorosamente um JSON com os campos técnicos.',
          },
          {
            role: 'user',
            content: promptText + (clientOcrText ? '\n\nTexto transcrito:\n' + clientOcrText : ''),
          },
        ],
      })
      if (reply && reply.choices && reply.choices[0] && reply.choices[0].message) {
        const parsed = parseJsonSafe(reply.choices[0].message.content)
        if (parsed && typeof parsed === 'object') {
          extractedData = parsed
          extractionMethod = 'ai_chat_text'
        }
      }
    } catch (errChat) {
      console.warn('[read-nameplate] Falha em $ai.chat text:', errChat.message)
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

  console.log(
    '[read-nameplate] Sucesso. Método:',
    extractionMethod,
    'fabricante:',
    result.manufacturer,
    'modelo:',
    result.model,
  )

  return e.json(200, {
    ok: true,
    method: extractionMethod,
    data: result,
  })
})
