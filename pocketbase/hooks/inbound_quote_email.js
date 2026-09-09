/**
 * PocketBase Hook: Inbound Email Quote Processing -> Draft Proposal
 * Endpoint: POST /backend/v1/quotes/inbound-email
 * Auth: Token header 'X-Inbound-Token' ou query param 'token' (token padrão: 'intertermal-inbound-secret-2026')
 * Aceita: JSON ou text/plain (corpo bruto do e-mail encaminhado)
 */

routerAdd('POST', '/backend/v1/quotes/inbound-email', (c) => {
  // 1. Validação de segurança com token simples
  const reqInfo =
    typeof $apis !== 'undefined' && $apis.requestInfo ? $apis.requestInfo(c) : c.requestInfo()
  const headers = reqInfo.headers || {}
  const query = reqInfo.query || {}

  const configuredToken = 'intertermal-inbound-secret-2026'
  const providedToken =
    headers['x-inbound-token'] ||
    headers['X-Inbound-Token'] ||
    headers['authorization'] ||
    query.token ||
    ''

  const cleanProvided = String(providedToken)
    .replace(/^Bearer\s+/i, '')
    .trim()

  // Se houver usuário autenticado no PocketBase (ex: chamada interna do app frontend), aceita direto
  const isAuthUser = Boolean(c.auth && c.auth.id)
  if (!isAuthUser && cleanProvided !== configuredToken) {
    return c.json(401, {
      success: false,
      error:
        'Acesso não autorizado. Envie o token via header X-Inbound-Token ou query param ?token=.',
    })
  }

  // 2. Extração de campos do corpo da requisição
  let sender = ''
  let originalSender = ''
  let recipient = ''
  let subject = ''
  let rawBody = ''

  const contentType = String(headers['content-type'] || headers['Content-Type'] || '')
  const reqData = reqInfo.data || reqInfo.body

  if (contentType.includes('application/json') && reqData && typeof reqData === 'object') {
    sender = String(reqData.sender || reqData.from || '').trim()
    originalSender = String(reqData.original_sender || reqData.originalSender || sender).trim()
    recipient = String(reqData.recipient || reqData.to || '').trim()
    subject = String(reqData.subject || reqData.assunto || '').trim()
    rawBody = String(
      reqData.body || reqData.text || reqData.raw_body || reqData.content || '',
    ).trim()
  } else {
    // Text plain ou fallback
    const rawContent = typeof reqData === 'string' ? reqData : JSON.stringify(reqData || '')
    rawBody = rawContent.trim()
    subject = String(
      query.subject || headers['x-email-subject'] || 'Cotação Recebida por E-mail',
    ).trim()
    sender = String(query.sender || headers['x-email-sender'] || '').trim()
    originalSender = sender
  }

  // Se o remetente original não estiver no payload, tentar detectar padrões típicos de encaminhamento
  if (!originalSender && rawBody) {
    const fromMatch = rawBody.match(/(?:De:|From:|Remetente:)\s*([^\n\r<]+)(?:<([^>]+)>)?/i)
    if (fromMatch) {
      originalSender = (fromMatch[2] || fromMatch[1] || '').trim()
    }
  }

  // Se o assunto não tiver sido passado isolado, tentar extrair do início do texto
  if (!subject && rawBody) {
    const subjMatch = rawBody.match(/(?:Assunto:|Subject:)\s*([^\n\r]+)/i)
    if (subjMatch) {
      subject = subjMatch[1].trim()
    } else {
      subject = 'Cotação de Serviços Recebida por E-mail'
    }
  }

  if (!rawBody && !subject) {
    return c.json(400, {
      success: false,
      error: 'Corpo do e-mail ou assunto é obrigatório.',
    })
  }

  // 3. Salvar registro inicial na trilha de auditoria (inbound_quote_emails)
  let inboundRecord = null
  try {
    const colInbound = $app.findCollectionByNameOrId('inbound_quote_emails')
    inboundRecord = new Record(colInbound)
    inboundRecord.set('sender', sender || 'encaminhado@intertermal.com.br')
    inboundRecord.set('original_sender', originalSender || sender || '')
    inboundRecord.set('recipient', recipient || 'orcamentos@intertermal.com.br')
    inboundRecord.set('subject', subject || 'Cotação recebida')
    inboundRecord.set('raw_body', rawBody || '')
    inboundRecord.set('status', 'recebido')
    $app.save(inboundRecord)
  } catch (errInbound) {
    console.error('Erro ao salvar registro de e-mail bruto:', errInbound)
  }

  // 4. Executar extração com IA (Tentativa 1: Agente Nativo Skip Cloud -> Fallback: $ai.chat -> Fallback: Heurística Regex)
  let extracted = {
    client_name: '',
    contact_name: '',
    contact_email: originalSender || sender || '',
    contact_phone: '',
    city: '',
    state: '',
    postal_code: '',
    equipment_brand: 'BERMO',
    equipment_model: '',
    equipment_quantity: 1,
    service_scope: '',
    desired_deadline: '',
    notes: '',
    missing_fields: [],
  }

  let extractionMethod = 'heuristic'
  const promptText = `E-MAIL ENCAMINHADO RECEBIDO:
Assunto: ${subject}
Remetente Informado: ${sender}
Remetente Original: ${originalSender}

Corpo do E-mail:
${rawBody}`

  // 4.1 Tentar Agente Nativo
  let agentSuccess = false
  try {
    const agent = $ai.agent('quote-extractor')
    // Obter um ID de usuário de contexto para o agente
    let contextUserId = c.auth && c.auth.id ? c.auth.id : null
    if (!contextUserId) {
      try {
        const u = $app.findFirstRecordByData('users', 'email', 'alexnogueira433@gmail.com')
        if (u) contextUserId = u.id
      } catch (_) {}
    }

    if (agent && contextUserId) {
      const agentRes = agent.chat({
        user_id: contextUserId,
        message: promptText,
      })

      if (agentRes && agentRes.content) {
        let cleanJson = agentRes.content.trim()
        cleanJson = cleanJson
          .replace(/```json/gi, '')
          .replace(/```/g, '')
          .trim()
        const parsed = JSON.parse(cleanJson)
        if (parsed && typeof parsed === 'object') {
          extracted = { ...extracted, ...parsed }
          agentSuccess = true
          extractionMethod = 'native_agent'
        }
      }
    }
  } catch (errAgent) {
    console.warn('Agente nativo falhou ou indisponível, usando $ai.chat:', errAgent.message)
  }

  // 4.2 Fallback: $ai.chat direto se o agente nativo falhar
  if (!agentSuccess) {
    try {
      const aiReply = $ai.chat({
        model: 'fast',
        messages: [
          {
            role: 'system',
            content: `Você é o extrator de cotações da INTERTERMAL (parceira autorizada BERMO / Alfa Laval).
Leia o e-mail e extraia os dados estritamente em JSON puro sem formatação markdown:
{
  "client_name": "Nome da empresa/cliente",
  "contact_name": "Nome do contato",
  "contact_email": "e-mail de contato",
  "contact_phone": "telefone de contato",
  "city": "Cidade",
  "state": "UF",
  "postal_code": "CEP",
  "equipment_brand": "BERMO ou Alfa Laval (default: BERMO)",
  "equipment_model": "Modelo (ex: BP30, BL50, BM100, BTL150, M10-B, etc.)",
  "equipment_quantity": 1,
  "service_scope": "Escopo de manutenção solicitado",
  "desired_deadline": "Prazo solicitado",
  "notes": "Observações do pedido",
  "missing_fields": ["lista de dados faltantes relevantes"]
}`,
          },
          {
            role: 'user',
            content: promptText,
          },
        ],
      })

      if (aiReply && aiReply.choices && aiReply.choices[0] && aiReply.choices[0].message) {
        let textResp = aiReply.choices[0].message.content.trim()
        textResp = textResp
          .replace(/```json/gi, '')
          .replace(/```/g, '')
          .trim()
        const parsedChat = JSON.parse(textResp)
        if (parsedChat && typeof parsedChat === 'object') {
          extracted = { ...extracted, ...parsedChat }
          extractionMethod = 'ai_chat'
        }
      }
    } catch (errChat) {
      console.warn(
        'Fallback $ai.chat falhou, aplicando extração determinística por regex:',
        errChat.message,
      )
    }
  }

  // 4.3 Fallback / Reforço Determinístico (Regex / Heurística)
  if (!extracted.client_name) {
    // Tenta encontrar empresa pelo assunto ou domínio de e-mail
    const emailDomain = (originalSender || sender).split('@')[1] || ''
    if (
      emailDomain &&
      !emailDomain.includes('gmail') &&
      !emailDomain.includes('hotmail') &&
      !emailDomain.includes('outlook') &&
      !emailDomain.includes('yahoo')
    ) {
      const companyPart = emailDomain.split('.')[0]
      extracted.client_name = companyPart.charAt(0).toUpperCase() + companyPart.slice(1)
    } else {
      const subjCompany = subject
        .replace(/^(enc|fwd|re|res):\s*/i, '')
        .split('-')[0]
        .trim()
      extracted.client_name = subjCompany || 'Cliente Solicitante (E-mail)'
    }
  }

  if (!extracted.contact_email) {
    const mailMatches = rawBody.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/)
    if (mailMatches) extracted.contact_email = mailMatches[0]
  }

  if (!extracted.contact_phone) {
    const phoneMatches = rawBody.match(
      /(?:\+?55\s?)?(?:\(?\d{2}\)?\s?)?(?:9\d{4}|\d{4})[-.\s]?\d{4}/,
    )
    if (phoneMatches) extracted.contact_phone = phoneMatches[0]
  }

  if (!extracted.postal_code) {
    const cepMatches = rawBody.match(/\b\d{5}-?\d{3}\b/)
    if (cepMatches) extracted.postal_code = cepMatches[0]
  }

  if (!extracted.equipment_model) {
    const modelMatches = rawBody.match(
      /\b(BP\s?\d+|BL\s?\d+|BM\s?\d+|BTL\s?\d+|M\d+[-A-Z0-9]*|T\d+[-A-Z0-9]*|GP\s?\d+)\b/i,
    )
    if (modelMatches) {
      extracted.equipment_model = modelMatches[1].toUpperCase().replace(/\s+/g, '')
    }
  }

  if (!extracted.service_scope) {
    extracted.service_scope = 'Revisão, limpeza e manutenção especializada em trocador de calor.'
  }

  // Sanitização e checagem de avisos (warnings / missing_fields)
  const warningsList = Array.isArray(extracted.missing_fields) ? [...extracted.missing_fields] : []
  if (!extracted.city && !extracted.postal_code) {
    warningsList.push(
      'Cidade ou CEP de destino não informado (necessário para cálculo de deslocamento/pedágios)',
    )
  }
  if (!extracted.equipment_model) {
    warningsList.push('Modelo específico do trocador de calor não identificado')
  }
  if (!extracted.contact_phone) {
    warningsList.push('Telefone de contato não informado')
  }

  // 5. Vincular ou Criar Cliente (sem duplicar)
  let clientRecord = null
  const clientNameClean = String(extracted.client_name || '').trim()
  const clientEmailClean = String(extracted.contact_email || '')
    .trim()
    .toLowerCase()

  try {
    // Busca por e-mail primeiro
    if (clientEmailClean) {
      try {
        const foundByEmail = $app.findRecordsByFilter(
          'clients',
          `email ~ "${clientEmailClean}"`,
          '-created',
          1,
          0,
        )
        if (foundByEmail && foundByEmail.length > 0) {
          clientRecord = foundByEmail[0]
        }
      } catch (_) {}
    }

    // Busca por nome se não achou por e-mail
    if (!clientRecord && clientNameClean) {
      try {
        const foundByName = $app.findRecordsByFilter(
          'clients',
          `name ~ "${clientNameClean}" || company_name ~ "${clientNameClean}"`,
          '-created',
          1,
          0,
        )
        if (foundByName && foundByName.length > 0) {
          clientRecord = foundByName[0]
        }
      } catch (_) {}
    }

    // Se não encontrou, criar novo cliente
    if (!clientRecord) {
      const colClients = $app.findCollectionByNameOrId('clients')
      clientRecord = new Record(colClients)
      clientRecord.set('name', clientNameClean || 'Cliente Novo (Via E-mail)')
      clientRecord.set('company_name', clientNameClean || '')
      if (clientEmailClean) clientRecord.set('email', clientEmailClean)
      if (extracted.contact_phone) clientRecord.set('phone', extracted.contact_phone)
      if (extracted.city) clientRecord.set('city', extracted.city)
      if (extracted.state) clientRecord.set('state', extracted.state)
      clientRecord.set('status', 'lead')
      clientRecord.set(
        'notes',
        `Cadastrado automaticamente via cotação recebida por e-mail em ${new Date().toLocaleDateString('pt-BR')}.`,
      )
      $app.save(clientRecord)
    }
  } catch (errClient) {
    console.error('Erro ao buscar/criar cliente:', errClient)
  }

  // 6. Criar Orçamento como RASCUNHO (status: 'draft')
  let createdQuote = null
  const quoteNumberCode = `INT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`
  const modelStr = extracted.equipment_model || 'Trocador de Calor'
  const brandStr = extracted.equipment_brand || 'BERMO'
  const equipQty = Number(extracted.equipment_quantity) || 1

  try {
    const colQuotes = $app.findCollectionByNameOrId('quotes')
    createdQuote = new Record(colQuotes)

    createdQuote.set('quote_number', quoteNumberCode)
    createdQuote.set('code', quoteNumberCode)
    createdQuote.set('status', 'draft') // Sempre rascunho para revisão humana
    createdQuote.set(
      'title',
      `Manutenção ${brandStr} ${modelStr} — ${extracted.client_name || 'Cliente'}`,
    )

    if (clientRecord) {
      createdQuote.set('client_id', clientRecord.id)
      createdQuote.set('client_name', clientRecord.getString('name') || clientNameClean)
    } else {
      createdQuote.set('client_name', clientNameClean || 'Cliente')
    }

    createdQuote.set('equipment_brand', brandStr)
    createdQuote.set('equipment_model', modelStr)
    createdQuote.set('equipment_quantity', equipQty)
    createdQuote.set(
      'scope_of_work',
      extracted.service_scope ||
        'Abertura, limpeza química por recirculação, teste hidrostático e remontagem.',
    )

    // Destino e deslocamento pré-preenchidos se identificados
    if (extracted.postal_code) {
      createdQuote.set('destination_cep', extracted.postal_code)
    }
    if (extracted.city) {
      createdQuote.set(
        'destination_address',
        `${extracted.city}${extracted.state ? ` - ${extracted.state}` : ''}`,
      )
    }

    createdQuote.set('origin_cep', '89066-000') // Base Blumenau/SC
    createdQuote.set('origin_address', 'Rua Bernardo Reiter, 500 - Blumenau/SC')
    createdQuote.set('is_round_trip', true)

    // Valores padrão para rascunho
    createdQuote.set('subtotal', 0)
    createdQuote.set('total', 0)
    createdQuote.set('final_price', 0)
    createdQuote.set('validity_days', 10)
    createdQuote.set('payment_conditions', '28_ddl')
    createdQuote.set('payment_terms', '28_DDL (10 dias de validade)')

    // Observações internas com rastreabilidade do e-mail
    const traceabilityNotes = `[COTAÇÃO RECEBIDA POR E-MAIL]
Assunto Original: ${subject}
De: ${originalSender || sender || 'Não identificado'}
Data de Entrada: ${new Date().toLocaleString('pt-BR')}
Método de Extração: ${extractionMethod}
Prazo Desejado pelo Cliente: ${extracted.desired_deadline || 'Não informado'}
Observações do E-mail: ${extracted.notes || 'Sem observações adicionais'}
Status: Rascunho para Revisão Humana (ajuste valores de mão de obra e deslocamento).`

    createdQuote.set('notes', traceabilityNotes)
    createdQuote.set(
      'technical_notes',
      `Solicitação inicial: ${extracted.service_scope || 'Manutenção'}`,
    )
    createdQuote.set(
      'commercial_notes',
      `Origem: E-mail encaminhado. Contato: ${extracted.contact_name || ''} (${extracted.contact_email || ''})`,
    )

    // Equipamento e service_details estruturados
    const defaultEquipmentItem = {
      id: `eq-${Date.now()}-1`,
      brand: brandStr,
      model: modelStr,
      quantity: equipQty,
      plateCount: 45,
      plateMaterial: 'AISI 316L',
      plateThickness: 0.5,
      gasketMaterial: 'EPDM Clip-on',
      connectionType: 'Flangeada ANSI 150#',
      connectionSize: 'DN100 (4")',
      pressureTestBar: 16,
      workingPressureBar: 10,
      dimensions: '1450 x 480 x 1120 mm',
      weightKg: 480,
      modelSource: 'manual',
    }

    createdQuote.set('equipments', [defaultEquipmentItem])

    createdQuote.set('service_details', {
      source_email: {
        subject: subject,
        sender: sender,
        original_sender: originalSender,
        received_at: new Date().toISOString(),
        raw_body: rawBody,
        extraction_method: extractionMethod,
        warnings: warningsList,
      },
      extracted_data: extracted,
      service_technical_specs: {
        productModel: modelStr,
        productBrand: brandStr,
        equipmentQuantity: equipQty,
        scopeOfWork: extracted.service_scope,
      },
    })

    $app.save(createdQuote)
  } catch (errQuote) {
    console.error('Erro ao criar rascunho de quote:', errQuote)
  }

  // 7. Atualizar registro de trilha do e-mail com vínculos e status final
  if (inboundRecord) {
    try {
      if (createdQuote) inboundRecord.set('quote_id', createdQuote.id)
      if (clientRecord) inboundRecord.set('client_id', clientRecord.id)
      inboundRecord.set('extracted_data', extracted)
      inboundRecord.set('warnings', warningsList)
      inboundRecord.set('status', createdQuote ? 'rascunho_criado' : 'erro')
      $app.save(inboundRecord)
    } catch (errSaveInbound) {
      console.warn('Erro ao atualizar registro de inbound_quote_emails:', errSaveInbound)
    }
  }

  // 8. Retorno JSON completo com o resultado
  return c.json(200, {
    success: true,
    message: createdQuote
      ? `Rascunho de proposta #${quoteNumberCode} criado com sucesso a partir do e-mail.`
      : 'E-mail registrado, mas houve falha ao instanciar o rascunho.',
    quote_id: createdQuote ? createdQuote.id : null,
    quote_number: quoteNumberCode,
    client: {
      id: clientRecord ? clientRecord.id : null,
      name: clientRecord ? clientRecord.getString('name') : clientNameClean,
      email: clientEmailClean,
    },
    inbound_email_id: inboundRecord ? inboundRecord.id : null,
    extracted_data: extracted,
    warnings: warningsList,
    extraction_method: extractionMethod,
  })
})
