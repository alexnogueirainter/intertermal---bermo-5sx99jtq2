/**
 * PocketBase Hook: Public Proposal Client Approval & View by Token
 * Route: GET /api/public/proposals/:token -> retorna dados seguros da proposta para visualização do cliente sem login
 * Route: POST /api/public/proposals/:token/action -> aprova ou reprova a proposta, registra nome + data e gera OS automaticamente se aprovada
 */

routerAdd('GET', '/api/public/proposals/{token}', (c) => {
  const token = c.request.pathValue('token')
  if (!token || token.trim() === '') {
    return c.json(400, { success: false, error: 'Token inválido ou não fornecido.' })
  }

  let quoteRecord = null
  try {
    const quotes = $app.findRecordsByFilter(
      'quotes',
      `approval_token = "${token}" || id = "${token}" || code = "${token}" || quote_number = "${token}"`,
      '-created',
      1,
      0,
    )
    if (quotes && quotes.length > 0) {
      quoteRecord = quotes[0]
    }
  } catch (err) {
    console.error('Erro ao buscar proposta pública:', err)
  }

  if (!quoteRecord) {
    return c.json(404, { success: false, error: 'Proposta não encontrada para o token fornecido.' })
  }

  // Tentar buscar cliente
  let clientRecord = null
  const clientId = quoteRecord.get('client_id')
  if (clientId) {
    try {
      clientRecord = $app.findRecordById('clients', clientId)
    } catch (_) {}
  }

  // Retornar apenas os dados públicos relevantes para a visão do cliente (sem expor composição interna gerencial)
  const data = {
    id: quoteRecord.id,
    code: quoteRecord.get('code') || quoteRecord.get('quote_number'),
    quote_number: quoteRecord.get('quote_number') || quoteRecord.get('code'),
    status: quoteRecord.get('status'),
    title: quoteRecord.get('title'),
    client_name:
      quoteRecord.get('client_name') ||
      (clientRecord ? clientRecord.get('name') || clientRecord.get('company_name') : 'Cliente'),
    client_document: clientRecord
      ? clientRecord.get('document')
      : quoteRecord.get('client_document'),
    assigned_to: quoteRecord.get('assigned_to') || 'Alex Nogueira - Especialista Técnico',
    created: quoteRecord.get('created'),
    validity_days: quoteRecord.get('validity_days') || 10,
    payment_terms:
      quoteRecord.get('payment_terms') || quoteRecord.get('payment_conditions') || '28 DDL',
    scope_of_work: quoteRecord.get('scope_of_work') || quoteRecord.get('notes') || '',
    equipment_brand: quoteRecord.get('equipment_brand') || 'BERMO',
    equipment_model: quoteRecord.get('equipment_model') || '',
    equipment_quantity: quoteRecord.get('equipment_quantity') || 1,
    plate_count: quoteRecord.get('plate_count'),
    plate_material: quoteRecord.get('plate_material'),
    plate_thickness: quoteRecord.get('plate_thickness'),
    gasket_material: quoteRecord.get('gasket_material'),
    connection_size: quoteRecord.get('connection_size'),
    connection_type: quoteRecord.get('connection_type'),
    pressure_test_bar: quoteRecord.get('pressure_test_bar'),
    working_pressure_bar: quoteRecord.get('working_pressure_bar'),
    dimensions_w_h_d: quoteRecord.get('dimensions_w_h_d'),
    weight_kg: quoteRecord.get('weight_kg'),
    work_fluid: quoteRecord.get('work_fluid'),
    custom_work_fluid: quoteRecord.get('custom_work_fluid'),
    total: quoteRecord.get('final_price') || quoteRecord.get('total') || 0,
    final_price: quoteRecord.get('final_price') || quoteRecord.get('total') || 0,
    subtotal: quoteRecord.get('subtotal') || quoteRecord.get('total') || 0,
    commercial_notes: quoteRecord.get('commercial_notes') || '',
    notes: quoteRecord.get('notes') || '',
    items: quoteRecord.get('items') || [],
    equipments: quoteRecord.get('equipments') || [],
    service_details: quoteRecord.get('service_details') || null,
    approval_token: quoteRecord.get('approval_token'),
    approved_by_client_name: quoteRecord.get('approved_by_client_name'),
    approved_by_client_date: quoteRecord.get('approved_by_client_date'),
    rejected_by_client_reason: quoteRecord.get('rejected_by_client_reason'),
    rejected_by_client_date: quoteRecord.get('rejected_by_client_date'),
  }

  return c.json(200, { success: true, quote: data })
})

routerAdd('POST', '/api/public/proposals/{token}/action', (c) => {
  const token = c.request.pathValue('token')
  const reqInfo =
    typeof $apis !== 'undefined' && $apis.requestInfo ? $apis.requestInfo(c) : c.requestInfo()
  const body = reqInfo.data || reqInfo.body || {}
  const action = String(body.action || '')
    .trim()
    .toLowerCase() // 'approve' | 'reject'
  const clientApproverName = String(body.client_name || body.name || '').trim()
  const rejectReason = String(body.reason || body.rejection_reason || '').trim()

  if (!token || token.trim() === '') {
    return c.json(400, { success: false, error: 'Token inválido.' })
  }

  if (action !== 'approve' && action !== 'reject') {
    return c.json(400, {
      success: false,
      error: 'Ação inválida. Use action="approve" ou action="reject".',
    })
  }

  if (action === 'approve' && !clientApproverName) {
    return c.json(400, {
      success: false,
      error: 'Por favor, informe seu nome completo para registrar o aceite digital.',
    })
  }

  let quoteRecord = null
  try {
    const quotes = $app.findRecordsByFilter(
      'quotes',
      `approval_token = "${token}" || id = "${token}" || code = "${token}" || quote_number = "${token}"`,
      '-created',
      1,
      0,
    )
    if (quotes && quotes.length > 0) {
      quoteRecord = quotes[0]
    }
  } catch (err) {
    console.error('Erro ao buscar proposta:', err)
  }

  if (!quoteRecord) {
    return c.json(404, { success: false, error: 'Proposta não encontrada.' })
  }

  const nowIso = new Date().toISOString()
  const quoteNumber = quoteRecord.get('quote_number') || quoteRecord.get('code') || quoteRecord.id

  if (action === 'approve') {
    quoteRecord.set('status', 'approved')
    quoteRecord.set('approved_by_client_name', clientApproverName)
    quoteRecord.set('approved_by_client_date', nowIso)
    $app.save(quoteRecord)

    // CRIAR OS AUTOMATICAMENTE (Se ainda não existir para esta quote)
    let createdServiceOrder = null
    try {
      const existingSOs = $app.findRecordsByFilter(
        'service_orders',
        `quote_id = "${quoteRecord.id}" || order_number = "${quoteNumber}" || quote_number = "${quoteNumber}"`,
        '-created',
        1,
        0,
      )

      if (existingSOs && existingSOs.length > 0) {
        // Já existe OS vinculada, apenas atualizar para status vistoria ou proposta
        const existingSO = existingSOs[0]
        existingSO.set('approved_by', clientApproverName + ' (Cliente - Aceite Digital)')
        existingSO.set('approved_at', nowIso)
        $app.save(existingSO)
        createdServiceOrder = existingSO
      } else {
        // Criar NOVA OS
        const soCol = $app.findCollectionByNameOrId('service_orders')
        const so = new Record(soCol)
        so.set('order_number', quoteNumber)
        so.set('quote_id', quoteRecord.id)
        so.set('quote_number', quoteNumber)
        so.set('client_id', quoteRecord.get('client_id') || '')
        so.set('client_name', quoteRecord.get('client_name') || 'Cliente')
        so.set('title', `OS-${quoteNumber}: Manutenção e Revisão de Equipamentos BERMO`)
        // Pipeline: Vistoria -> Proposta -> Execução -> Inspeção -> Fechado
        // Como a proposta foi aprovada pelo cliente, a OS inicia no fluxo
        so.set('status', 'vistoria')
        so.set('total_value', quoteRecord.get('final_price') || quoteRecord.get('total') || 0)
        so.set('priority', 'high')
        so.set(
          'assigned_to',
          quoteRecord.get('assigned_to') || 'Alex Nogueira - Especialista BERMO',
        )
        so.set('services', quoteRecord.get('items') || [])
        so.set('technical_details', quoteRecord.get('service_details') || {})
        so.set('approved_by', clientApproverName + ' (Cliente - Aceite Digital)')
        so.set('approved_at', nowIso)
        so.set(
          'notes',
          `OS gerada automaticamente após aprovação digital pelo cliente (${clientApproverName}) em ${new Date().toLocaleString('pt-BR')}.`,
        )
        so.set('status_history', [
          {
            from_status: 'none',
            to_status: 'vistoria',
            date: nowIso,
            user_name: clientApproverName + ' (Cliente)',
            note: 'OS gerada automaticamente via aprovação da proposta comercial.',
          },
        ])

        // Equipamentos vinculados
        const equipModel = quoteRecord.get('equipment_model') || 'Trocador BERMO'
        const equipBrand = quoteRecord.get('equipment_brand') || 'BERMO'
        so.set('equipment_model', equipModel)
        so.set('equipment_brand', equipBrand)
        so.set('equipment_info', {
          brand: equipBrand,
          model: equipModel,
          equipments: quoteRecord.get('equipments') || [],
          details: quoteRecord.get('service_details') || {},
        })

        $app.save(so)
        createdServiceOrder = so
      }
    } catch (soErr) {
      console.warn('Erro ao criar OS automática:', soErr)
    }

    // Tentar disparar notificação por e-mail com link do aceite
    try {
      const mailClient =
        typeof $app !== 'undefined' && $app.newMailClient ? $app.newMailClient() : null
      if (mailClient) {
        const msg = new MailerMessage({
          from: { address: 'alex.nogueira@intertermal.com.br', name: 'Intertermal - Notificações' },
          to: [{ address: 'alex.nogueira@intertermal.com.br' }],
          subject: `[ACEITE CONFIRMADO] Proposta #${quoteNumber} Aprovada pelo Cliente`,
          html: `<p>A proposta #${quoteNumber} foi aprovada com sucesso por <strong>${clientApproverName}</strong> em ${new Date().toLocaleString('pt-BR')}.</p><p>A Ordem de Serviço foi gerada automaticamente e enviada para o Pipeline de Execução Técnica.</p>`,
        })
        mailClient.send(msg)
      }
    } catch (_) {}

    return c.json(200, {
      success: true,
      action: 'approved',
      message: `Proposta #${quoteNumber} aprovada com sucesso por ${clientApproverName}! Ordem de Serviço emitida no sistema.`,
      approved_by: clientApproverName,
      approved_at: nowIso,
      service_order_id: createdServiceOrder ? createdServiceOrder.id : null,
    })
  } else {
    // REJECT
    quoteRecord.set('status', 'rejected')
    quoteRecord.set('rejected_by_client_reason', rejectReason || 'Sem motivo especificado')
    quoteRecord.set('rejected_by_client_date', nowIso)
    $app.save(quoteRecord)

    return c.json(200, {
      success: true,
      action: 'rejected',
      message: `Proposta #${quoteNumber} marcada como reprovada. A equipe técnica entrará em contato.`,
      rejected_at: nowIso,
    })
  }
})
