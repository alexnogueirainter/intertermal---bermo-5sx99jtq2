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

  const promptText = `Analise detalhadamente as informações e/ou foto da plaqueta de identificação industrial (trocador de calor de placas, válvulas, motores ou equipamento BERMO / Alfa Laval / WEG).
Faça uma LEITURA MINUCIOSA, CARACTERE POR CARACTERE, DÍGITO POR DÍGITO, transcrevendo exatamente o que está na placa.

REGRAS RÍGIDAS DE FIDELIDADE (TOLERÂNCIA ZERO PARA ERROS):
1. É ESTRITAMENTE PROIBIDO inventar, deduzir, adivinhar, completar, presumir ou estimar QUALQUER dado.
2. Se houver qualquer dúvida, caractere ilegível, reflexo de luz, desgaste, oxidação, corte ou baixa confiança: DEIXE O CAMPO EM BRANCO (""). NUNCA CHUTE valores.
3. Para cada campo identificado, retorne no objeto "confidence" o nível de confiança da leitura:
   - "high" (ou número >= 0.85): lido com total clareza e nitidez.
   - "medium" (ou número 0.50 a 0.84): leitura parcial ou caractere parcialmente desgastado porém legível.
   - Campos vazios ou com dúvida não devem constar ou devem ter valor omitido/"low".

MAPEAMENTO OBRIGATÓRIO DE CÓDIGOS DE LETRAS E NÚMEROS DA PLACA:
- TAG: tag de processo -> tag
- MOD / MODELO / TYPE: modelo exato -> model
- N° SÉRIE / N° FAB / S/N / SERIAL / FABRICAÇÃO: número de fabricação/série -> manufacturingNumber e serialNumber
- ANO / DATE / YEAR: ano de fabricação de 4 dígitos -> manufacturingYear
- PS / PRESSÃO PROJETO / DESIGN PRESS / P.PROJ: pressão de projeto em bar -> designPressureBar
- TS / TEMP PROJETO / DESIGN TEMP / T.PROJ: temperatura de projeto em °C -> designTempC
- PT / PRESSÃO TESTE / TEST PRESS / P.TESTE: pressão de teste em bar -> testPressureBar
- PMTA / MAWP: Pressão Máxima de Trabalho Admissível em MPa -> pmtaMpa
- PESO / WT / EMPTY WT / PESO VAZIO: peso vazio em kgf ou kg -> emptyWeightKg
- "a" MÁX / "a" MÍN: medidas de aperto de tirantes em mm -> tighteningMaxA e tighteningMinA
- Q / VAZÃO / FLOW / FLOW RATE / CAPACIDADE: vazão nominal operacional -> flowRate (ex.: 45,5) e flowUnit (ex.: m³/h)
- FL / FLUIDO / SERVICE / SERVIÇO: fluidos ou serviço -> service ou fluid1 / fluid2
- KW / CV / HP / POTÊNCIA: potência -> extraFields: { label: "Potência (kW)", value: "..." }
- A / CORRENTE / AMP / IN: corrente elétrica -> extraFields: { label: "Corrente (A)", value: "..." }
- V / TENSÃO / VOLTS: tensão elétrica -> extraFields: { label: "Tensão (V)", value: "..." }
- NEMA / IP / CARCAÇA: classificação NEMA ou proteção IP -> extraFields: { label: "Classificação NEMA / IP", value: "..." }
- DN / CONEXÕES / BOCAL / FLANGE: diâmetro nominal das conexões -> connectionSize (ex.: DN 50, DN 65)
- CL / CLASSE / RATING: classe de pressão -> extraFields: { label: "Classe de Pressão (CL)", value: "..." }
- MATERIAL PLACAS (AISI 316L, Titânio, etc.) -> plateMaterial
- MATERIAL GAXETAS (NBR, EPDM, FKM, etc.) -> gasketMaterial
- NORMA (ASME VIII, NR-13, etc.) -> fabricationStandard
- ÁREA DE TROCA (m²) -> thermalAreaM2

CORREÇÕES TÍPICAS DE OCR EM PLAQUETAS BERMO:
- Junte letras espaçadas em nomes e códigos: ex. "B P 6 0 B" ou "B P 60 B" deve ser "BP 60 B" ou "BP60B".
- Corrija pontuação com espaçamento espúrio em números de fabricação: ex. "639 . 065" deve ser "639.065".
- Se houver pressões com barra ex. "10/13 bar" ou "10 / 13 bar", atribua 10 (ou 10,00) a designPressureBar e 13 (ou 13,00) a testPressureBar.
- Limpe unidades de medida coladas nos valores (ex. "1.13MPa" -> 1,13; "265kgf" -> 265; "45m3/h" -> 45).

Campos estruturados esperados:
- manufacturer: nome do fabricante (ex.: BERMO, Alfa Laval, Sondex, Kelvion, etc.)
- model: modelo exato gravado (ex.: BP 60 B TRCPL1134-35HE, BP 60, M10-B, etc.)
- manufacturingNumber: número de fabricação gravado (ex.: 639.065)
- serialNumber: número de série (se houver, senão igual a manufacturingNumber)
- service: serviço indicado (ex.: RESFRIAMENTO, AQUECIMENTO, CONDENSAÇÃO, PASTEURIZAÇÃO)
- tag: tag de processo se houver (ex.: TC-01)
- designPressureBar: pressão de projeto em bar (ex.: 10,00)
- testPressureBar: pressão de teste em bar (ex.: 13,00)
- designTempC: temperatura de projeto em °C (ex.: 165)
- pmtaMpa: PMTA em MPa (ex.: 1,13)
- emptyWeightKg: peso vazio em kgf ou kg (ex.: 265)
- manufacturingYear: ano de fabricação de 4 dígitos (ex.: 2025)
- tighteningMaxA: medida "a" máximo em mm (ex.: 66)
- tighteningMinA: medida "a" mínimo em mm (ex.: 70)
- plateCount: quantidade de placas se estiver escrita
- fluid1 / fluid2: fluidos primário e secundário se houver
- flowRate: vazão lida com código Q ou vazão (ex.: 45,5)
- flowUnit: unidade da vazão (ex.: m³/h)
- thermalAreaM2: área de troca térmica se legível (ex.: 12,5 m²)
- fabricationStandard: norma de projeto/fabricação se indicada (ex.: ASME VIII, NR-13, AD 2000)
- connectionSize: diâmetro nominal ou tipo de conexões/bocais (ex.: DN 50, DN 65, Flange 2")
- plateMaterial: material das placas (ex.: AISI 316L, Titânio, AISI 304)
- gasketMaterial: material das gaxetas de vedação (ex.: NBR, EPDM, FKM/Viton)
- extraFields: array de objetos { label: "Nome do dado extra", value: "Valor" } para qualquer informação visível adicional (potência KW, corrente A, tensão V, NEMA, CL etc.)
- confidence: objeto com chave de cada campo preenchido ("manufacturer", "model", "manufacturingNumber", "serialNumber", "tag", "service", "designPressureBar", "testPressureBar", "designTempC", "pmtaMpa", "emptyWeightKg", "manufacturingYear", "tighteningMaxA", "tighteningMinA", "plateCount", "flowRate", etc.) mapeado para "high" | "medium" | "low" ou score 0.0 a 1.0.
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

  // 1. Tentativa via Skip AI Gateway Vision com image_url (quando imagem fornecida)
  if (gatewayUrl && gatewayKey && (imageUrl || imageDataUrl)) {
    const imageTarget = imageUrl || imageDataUrl
    try {
      let endpoint = gatewayUrl.replace(/\/+$/, '')
      if (!endpoint.endsWith('/chat/completions')) {
        endpoint = endpoint + '/chat/completions'
      }

      const systemInstruction = `Você é um perito sênior em leitura e transcrição técnica minuciosa de placas de identificação de equipamentos industriais (BERMO, Alfa Laval, etc.).
Faça a leitura caractere por caractere, dígito por dígito. PROIBIDO inventar, deduzir ou estimar dados. Dúvida ou ilegível -> campo em branco ("").
Retorne avaliação de confiança ("high" | "medium" | "low") para cada campo no objeto "confidence".
Retorne EXCLUSIVAMENTE um objeto JSON válido (sem \`\`\`json).`

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

  // 2. Se houver texto pré-extraído (OCR do navegador), processar via Agente Nativo
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

  // 2.5. Fallback VISÃO GEMINI: quando o OCR do navegador falhou (texto fraco/lixo) e há
  // imagem disponível, manda a FOTO para o Gemini (visão) — lê gravação em relevo metálico.
  // Só aciona quando o caminho nativo não produziu dados úteis (custo por leitura ~R$0,01).
  if (!extractedData && (imageDataUrl || imageUrl)) {
    try {
      const geminiKey = $secrets.get('GEMINI_API_KEY') || ''
      if (geminiKey) {
        const imageTarget = imageUrl || imageDataUrl
        const geminiPayload = {
          contents: [
            {
              parts: [
                { text: promptText },
                {
                  inline_data: {
                    mime_type: 'image/jpeg',
                    data: imageTarget.startsWith('data:')
                      ? imageTarget.slice(imageTarget.indexOf(',') + 1)
                      : imageTarget,
                  },
                },
              ],
            },
          ],
          generationConfig: { temperature: 0.1 },
        }
        const gRes = $http.send({
          url: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': geminiKey,
          },
          body: JSON.stringify(geminiPayload),
          timeout: 60,
        })
        if (gRes.statusCode === 200 && gRes.json) {
          const gText =
            gRes.json &&
            gRes.json.candidates &&
            gRes.json.candidates[0] &&
            gRes.json.candidates[0].content &&
            gRes.json.candidates[0].content.parts &&
            gRes.json.candidates[0].content.parts[0]
              ? gRes.json.candidates[0].content.parts[0].text
              : ''
          const parsed = parseJsonSafe(gText)
          if (parsed && typeof parsed === 'object') {
            extractedData = parsed
            extractionMethod = 'gemini_vision'
          }
        } else {
          console.warn(
            '[read-nameplate] Gemini vision retornou status:',
            gRes.statusCode,
            JSON.stringify(gRes.json || {}).slice(0, 300),
          )
        }
      }
    } catch (errGemini) {
      console.warn('[read-nameplate] Falha no Gemini vision:', errGemini.message)
    }
  }

  // 3. Fallback via Agente Nativo Skip Cloud ('equipment-nameplate-reader') usando contexto
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
              'Você é um perito industrial em identificação minuciosa de placas térmicas BERMO e Alfa Laval (leitura caractere por caractere, sem inventar dados, retornando mapa "confidence" por campo). Retorne rigorosamente um JSON com os campos técnicos.',
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

  // Se não foi possível obter dados
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
    let s = sanitizeStr(val)
    if (!s) return ''
    // Remove unidades comuns (bar, mpa, kg, kgf, c, mm, etc.)
    s = s.replace(/(?:bar|mpa|kgf|kg|°c|c|mm|m2|m²)/gi, '').trim()
    // Remove qualquer caractere que não seja número, vírgula ou ponto
    s = s.replace(/[^0-9,.]/g, '')
    // Se tiver apenas ponto decimal (ex: 1.13), converte para vírgula pt-BR
    if (/^\d+\.\d+$/.test(s)) {
      s = s.replace('.', ',')
    }
    return s
  }

  // Consolidação de extraFields com os novos campos dedicados (thermalArea, normas, materiais, etc.)
  const extraFieldsList = Array.isArray(extractedData.extraFields)
    ? extractedData.extraFields
        .map((f) => ({
          label: sanitizeStr(f.label || f.name || f.campo),
          value: sanitizeStr(f.value || f.valor),
        }))
        .filter((f) => f.label && f.value)
    : []

  const addExtraFieldIfPresent = (label, val) => {
    const cleanVal = sanitizeStr(val)
    if (!cleanVal) return
    const already = extraFieldsList.some((it) => it.label.toLowerCase() === label.toLowerCase())
    if (!already) {
      extraFieldsList.push({ label, value: cleanVal })
    }
  }

  addExtraFieldIfPresent('Área de Troca Térmica', extractedData.thermalAreaM2)
  addExtraFieldIfPresent('Norma de Fabricação', extractedData.fabricationStandard)
  addExtraFieldIfPresent('Conexões / Bocais', extractedData.connectionSize)
  addExtraFieldIfPresent('Material das Placas', extractedData.plateMaterial)
  addExtraFieldIfPresent('Material das Gaxetas', extractedData.gasketMaterial)
  addExtraFieldIfPresent('Potência (kW)', extractedData.powerKw)
  addExtraFieldIfPresent('Corrente (A)', extractedData.currentA)
  addExtraFieldIfPresent('Tensão (V)', extractedData.voltageV)
  addExtraFieldIfPresent('Classificação NEMA / IP', extractedData.nemaRating)
  addExtraFieldIfPresent('Classe de Pressão (CL)', extractedData.pressureClass)

  // Correção determinística de espaços espúrios em modelo (ex. "B P 6 0 B" -> "BP 60 B")
  let cleanModel = sanitizeStr(extractedData.model)
  cleanModel = cleanModel.replace(/\bB\s+P\s+([0-9]+)\s*([A-Za-z]?)\b/gi, 'BP $1 $2').trim()

  // Correção de número de fabricação espúrio (ex. "639 . 065" -> "639.065")
  let cleanManufNo = sanitizeStr(extractedData.manufacturingNumber)
  cleanManufNo = cleanManufNo.replace(/(\d+)\s*\.\s*(\d+)/g, '$1.$2')

  const result = {
    manufacturer: sanitizeStr(extractedData.manufacturer),
    model: cleanModel,
    manufacturingNumber: cleanManufNo,
    serialNumber: sanitizeStr(extractedData.serialNumber || cleanManufNo),
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
    flowRate: normalizePtBrNumber(extractedData.flowRate),
    flowUnit: sanitizeStr(extractedData.flowUnit),
    thermalAreaM2: sanitizeStr(extractedData.thermalAreaM2),
    fabricationStandard: sanitizeStr(extractedData.fabricationStandard),
    connectionSize: sanitizeStr(extractedData.connectionSize),
    plateMaterial: sanitizeStr(extractedData.plateMaterial),
    gasketMaterial: sanitizeStr(extractedData.gasketMaterial),
    extraFields: extraFieldsList,
    confidence:
      extractedData.confidence && typeof extractedData.confidence === 'object'
        ? extractedData.confidence
        : {},
    rawTextExtracted: sanitizeStr(extractedData.rawTextExtracted || clientOcrText),
    summary: sanitizeStr(extractedData.summary),
  }

  console.log(
    '[read-nameplate] Sucesso. Método:',
    extractionMethod,
    'fabricante:',
    result.manufacturer,
    'modelo:',
    result.model,
    'nº:',
    result.manufacturingNumber,
    'extras:',
    result.extraFields.length,
  )

  return e.json(200, {
    ok: true,
    method: extractionMethod,
    data: result,
  })
})
