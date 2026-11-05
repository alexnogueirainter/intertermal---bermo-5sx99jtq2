/**
 * PocketBase Hook: Public Proposal Client Approval & View by Token
 * Route: GET /api/public/proposals/:token -> retorna dados seguros da proposta para visualização do cliente sem login
 * Route: POST /api/public/proposals/:token/action -> aprova ou reprova a proposta, registra nome + data e gera OS automaticamente se aprovada
 * Extras: aviso no painel (activities) quando o cliente ABRE, APROVA ou RECUSA a proposta.
 * Nota: os avisos são criados INLINE nos callbacks — o JSVM do PocketBase não expõe
 * declarações top-level aos callbacks.
 */

routerAdd('GET', '/backend/v1/public/proposals/{token}', (c) => {
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

  // Aviso no painel: cliente ABRIU a proposta (idempotente por dia — evita spam de avisos)
  try {
    const quoteNumberOpen =
      quoteRecord.get('quote_number') || quoteRecord.get('code') || quoteRecord.id
    const today = new Date().toISOString().slice(0, 10)
    const marker = 'abertura-' + quoteRecord.id + '-' + today
    const existing = $app.findRecordsByFilter(
      'activities',
      'description ~ "' + marker + '"',
      '-created',
      1,
      0,
    )
    if (!existing || existing.length === 0) {
      try {
        const alertCol = $app.findCollectionByNameOrId('activities')
        const alertRec = new Record(alertCol)
        alertRec.set('title', 'Proposta #' + quoteNumberOpen + ' aberta pelo cliente')
        alertRec.set('client_id', quoteRecord.getString('client_id') || '')
        alertRec.set(
          'client_name',
          quoteRecord.getString('client_name') || quoteRecord.get('client_name') || 'Cliente',
        )
        alertRec.set('type', 'proposal_alert')
        alertRec.set('priority', 'medium')
        alertRec.set('status', 'pending')
        alertRec.set('description', marker + ' — O cliente acessou a proposta online hoje.')
        alertRec.set('assigned_to', quoteRecord.get('assigned_to') || 'Alex Nogueira')
        $app.save(alertRec)
      } catch (alertErr) {
        console.warn('[Proposal Alert] Falha ao criar aviso no painel:', alertErr)
      }
    }
  } catch (openErr) {
    console.warn('[Proposal Alert] Falha no aviso de abertura:', openErr)
  }

  return c.json(200, { success: true, quote: data })
})

routerAdd('POST', '/backend/v1/public/proposals/{token}/action', (c) => {
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

    // Aviso no painel: proposta APROVADA pelo cliente
    try {
      const alertCol = $app.findCollectionByNameOrId('activities')
      const alertRec = new Record(alertCol)
      alertRec.set('title', 'Proposta #' + quoteNumber + ' APROVADA pelo cliente')
      alertRec.set('client_id', quoteRecord.getString('client_id') || '')
      alertRec.set(
        'client_name',
        quoteRecord.getString('client_name') || quoteRecord.get('client_name') || 'Cliente',
      )
      alertRec.set('type', 'proposal_alert')
      alertRec.set('priority', 'urgent')
      alertRec.set('status', 'pending')
      alertRec.set(
        'description',
        'Aprovada digitalmente por ' +
          clientApproverName +
          ' em ' +
          new Date().toLocaleString('pt-BR') +
          '. OS gerada automaticamente.',
      )
      alertRec.set('assigned_to', quoteRecord.get('assigned_to') || 'Alex Nogueira')
      $app.save(alertRec)
    } catch (alertErr) {
      console.warn('[Proposal Alert] Falha ao criar aviso no painel:', alertErr)
    }

    // SINCRONIZAR AUTOMATICAMENTE COM O PIPELINE COMERCIAL (Estágio 'won')
    try {
      let dealRecord = null
      const dealId = quoteRecord.getString('deal_id')
      if (dealId) {
        try {
          dealRecord = $app.findFirstRecordByData('deals', 'id', dealId)
        } catch (_) {}
      }
      if (!dealRecord) {
        try {
          const listDeals = $app.findRecordsByFilter(
            'deals',
            `title ~ "${quoteNumber}" || notes ~ "${quoteNumber}"`,
            '-updated,-created',
            5,
            0,
          )
          if (listDeals && listDeals.length > 0) {
            dealRecord = listDeals[0]
          }
        } catch (_) {}
      }

      const clientNameStr = quoteRecord.getString('client_name') || 'Cliente'
      const dealTitleStr = `Proposta ${quoteNumber} — ${clientNameStr}`
      let dealVal = quoteRecord.getFloat('total')
      if (!dealVal || dealVal <= 0) dealVal = quoteRecord.getFloat('final_price')
      if (!dealVal || dealVal <= 0) dealVal = quoteRecord.getFloat('subtotal')
      if (!dealVal || dealVal <= 0) dealVal = 0

      if (dealRecord) {
        // Movimento manual nunca é desfeito: se o negócio já está em won/lost, não reverter
        const currentStage = dealRecord.getString('stage')
        if (currentStage !== 'won' && currentStage !== 'lost') {
          dealRecord.set('stage', 'won')
          dealRecord.set('probability', 100)
        }
        dealRecord.set('value', dealVal)
        dealRecord.set(
          'notes',
          `Proposta #${quoteNumber} APROVADA digitalmente pelo cliente (${clientApproverName}).`,
        )
        $app.save(dealRecord)
        if (quoteRecord.getString('deal_id') !== dealRecord.id) {
          quoteRecord.set('deal_id', dealRecord.id)
          $app.save(quoteRecord)
        }
      } else {
        const dealsCol = $app.findCollectionByNameOrId('deals')
        const newDeal = new Record(dealsCol)
        newDeal.set('title', dealTitleStr)
        newDeal.set('client_id', quoteRecord.getString('client_id') || '')
        newDeal.set('client_name', clientNameStr)
        newDeal.set('value', dealVal)
        newDeal.set('stage', 'won')
        newDeal.set('probability', 100)
        newDeal.set('priority', 'urgent')
        newDeal.set('assigned_to', quoteRecord.getString('assigned_to') || 'Alex Nogueira')
        newDeal.set(
          'notes',
          `Proposta #${quoteNumber} APROVADA digitalmente pelo cliente (${clientApproverName}).`,
        )
        $app.save(newDeal)
        quoteRecord.set('deal_id', newDeal.id)
        $app.save(quoteRecord)
      }
    } catch (dealErr) {
      console.warn('Erro ao sincronizar deal na aprovação pública:', dealErr)
    }

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
        // Já existe OS vinculada, apenas atualizar para status vistoria ou proposta e sincronizar valor consolidado
        const existingSO = existingSOs[0]
        existingSO.set('approved_by', clientApproverName + ' (Cliente - Aceite Digital)')
        existingSO.set('approved_at', nowIso)
        const consolidatedVal =
          quoteRecord.getFloat('total') ||
          quoteRecord.getFloat('final_price') ||
          quoteRecord.getFloat('subtotal') ||
          0
        existingSO.set('total_value', consolidatedVal)
        // Custo direto total da proposta → custo interno da OS (fonte única de margem real)
        const consolidatedCost = quoteRecord.getFloat('total_cost') || 0
        existingSO.set('internal_cost', consolidatedCost)
        existingSO.set(
          'client_name',
          quoteRecord.getString('client_name') || existingSO.getString('client_name'),
        )
        existingSO.set(
          'client_id',
          quoteRecord.getString('client_id') || existingSO.getString('client_id'),
        )
        existingSO.set(
          'equipment_model',
          quoteRecord.getString('equipment_model') || existingSO.getString('equipment_model'),
        )
        existingSO.set(
          'equipment_brand',
          quoteRecord.getString('equipment_brand') || existingSO.getString('equipment_brand'),
        )
        if (quoteRecord.get('service_details')) {
          existingSO.set('technical_details', quoteRecord.get('service_details'))
        }
        $app.save(existingSO)
        createdServiceOrder = existingSO
      } else {
        // Criar NOVA OS com valor total consolidado
        const consolidatedVal =
          quoteRecord.getFloat('total') ||
          quoteRecord.getFloat('final_price') ||
          quoteRecord.getFloat('subtotal') ||
          0
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
        so.set('total_value', consolidatedVal)
        // Custo direto total da proposta → custo interno da OS (fonte única de margem real)
        so.set('internal_cost', quoteRecord.getFloat('total_cost') || 0)
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

    // Tentar disparar e-mail completo de aprovação chamando a rota de notificação com anexo de PDF
    try {
      let appSiteUrl = ''
      try {
        appSiteUrl = $os.getenv('SITE_URL') || $os.getenv('PB_INSTANCE_URL') || ''
      } catch (_) {
        appSiteUrl = ''
      }
      if (!appSiteUrl) appSiteUrl = 'https://intertermal.goskip.app'
      if (appSiteUrl.endsWith('/')) appSiteUrl = appSiteUrl.slice(0, -1)

      const pdfFileName = quoteRecord.getString('pdf_file') || ''
      let pdfDownloadUrl = ''
      if (pdfFileName) {
        pdfDownloadUrl =
          appSiteUrl +
          '/api/files/' +
          quoteRecord.collection().id +
          '/' +
          quoteRecord.id +
          '/' +
          pdfFileName
      }

      const mailClient =
        typeof $app !== 'undefined' && $app.newMailClient ? $app.newMailClient() : null
      if (mailClient) {
        let pdfAttachmentSection = ''
        if (pdfDownloadUrl) {
          pdfAttachmentSection = `<div style="background-color:#f0fdf4; border:2px solid #10b981; border-radius:8px; padding:16px 20px; margin:20px 0;">
            <strong style="font-size:14px; color:#166534; display:block;">PDF Oficial da Proposta Anexado (Visão Cliente + Composição Interna)</strong>
            <p style="font-size:12px; color:#15803d; margin:4px 0 10px 0;">O documento técnico completo com composição interna foi anexado a este e-mail.</p>
            <a href="${pdfDownloadUrl}" target="_blank" style="display:inline-block; background-color:#059669; color:#ffffff; text-decoration:none; font-weight:700; font-size:12px; padding:8px 18px; border-radius:6px;">Baixar PDF Oficial</a>
          </div>`
        }

        const msg = new MailerMessage({
          from: {
            address: 'alex.nogueira@intertermal.com.br',
            name: 'Intertermal - Notificações',
          },
          to: [{ address: 'alex.nogueira@intertermal.com.br' }],
          subject: `[ACEITE CONFIRMADO] Proposta #${quoteNumber} Aprovada pelo Cliente (${clientApproverName})`,
          html: `<div style="font-family:sans-serif; max-width:640px; margin:0 auto; padding:24px; color:#1e293b; background:#ffffff; border:1px solid #e2e8f0; border-radius:12px;">
            <div style="background:linear-gradient(135deg, #0284c7 0%, #0369a1 100%); padding:20px; color:#ffffff; border-radius:8px; margin-bottom:20px;">
              <h2 style="margin:0 0 6px 0; font-size:20px;">INTERTERMAL • ACEITE CONFIRMADO</h2>
              <p style="margin:0; font-size:14px; opacity:0.9;">Aprovação Digital realizada pelo cliente</p>
            </div>
            <div style="background:#f0fdf4; border-left:4px solid #10b981; padding:12px 16px; margin-bottom:18px;">
              <div style="font-size:14px; font-weight:700; color:#166534;">Aceite Digital Concluído</div>
              <div style="font-size:13px; color:#15803d;">A proposta técnica #${quoteNumber} para <strong>${quoteRecord.getString('client_name') || 'Cliente'}</strong> foi aprovada por <strong>${clientApproverName}</strong> em ${new Date().toLocaleString('pt-BR')}.</div>
            </div>
            ${pdfAttachmentSection}
            <p style="font-size:13px; color:#475569;">A Ordem de Serviço correspondente foi gerada automaticamente e enviada para o Pipeline de Execução Técnica.</p>
            <div style="margin-top:24px; padding-top:16px; border-top:1px solid #e2e8f0; font-size:11px; color:#64748b; text-align:center;">
              INTERTERMAL - SOLUÇÕES TÉRMICAS INDUSTRIAIS • alex.nogueira@intertermal.com.br
            </div>
          </div>`,
          attachments: {},
        })

        let fsInst = null
        let pdfRdr = null
        if (pdfFileName) {
          try {
            fsInst = $app.newFilesystem()
            const fKey = quoteRecord.baseFilesPath() + '/' + pdfFileName
            if (fsInst.exists(fKey)) {
              pdfRdr = fsInst.getReader(fKey)
              const attachName = 'Proposta_' + quoteNumber.replace(/[^a-zA-Z0-9_-]/g, '_') + '.pdf'
              msg.attachments[attachName] = pdfRdr
            }
          } catch (attErr) {
            console.warn('Erro ao anexar arquivo no e-mail de aprovação pública:', attErr)
          }
        }

        try {
          mailClient.send(msg)
        } finally {
          try {
            if (pdfRdr && typeof pdfRdr.close === 'function') pdfRdr.close()
          } catch (_) {}
          try {
            if (fsInst && typeof fsInst.close === 'function') fsInst.close()
          } catch (_) {}
        }
      }
    } catch (mailErr) {
      console.warn('Erro no envio do e-mail de confirmação de aceite público:', mailErr)
    }

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

    // Aviso no painel: proposta RECUSADA pelo cliente
    try {
      const alertCol = $app.findCollectionByNameOrId('activities')
      const alertRec = new Record(alertCol)
      alertRec.set('title', 'Proposta #' + quoteNumber + ' RECUSADA pelo cliente')
      alertRec.set('client_id', quoteRecord.getString('client_id') || '')
      alertRec.set(
        'client_name',
        quoteRecord.getString('client_name') || quoteRecord.get('client_name') || 'Cliente',
      )
      alertRec.set('type', 'proposal_alert')
      alertRec.set('priority', 'urgent')
      alertRec.set('status', 'pending')
      alertRec.set(
        'description',
        'Motivo informado: ' +
          (rejectReason || 'Sem motivo especificado') +
          ' — em ' +
          new Date().toLocaleString('pt-BR') +
          '.',
      )
      alertRec.set('assigned_to', quoteRecord.get('assigned_to') || 'Alex Nogueira')
      $app.save(alertRec)
    } catch (alertErr) {
      console.warn('[Proposal Alert] Falha ao criar aviso no painel:', alertErr)
    }

    // SINCRONIZAR AUTOMATICAMENTE COM O PIPELINE COMERCIAL (Estágio 'lost')
    try {
      let dealRecord = null
      const dealId = quoteRecord.getString('deal_id')
      if (dealId) {
        try {
          dealRecord = $app.findFirstRecordByData('deals', 'id', dealId)
        } catch (_) {}
      }
      if (!dealRecord) {
        try {
          const listDeals = $app.findRecordsByFilter(
            'deals',
            `title ~ "${quoteNumber}" || notes ~ "${quoteNumber}"`,
            '-updated,-created',
            5,
            0,
          )
          if (listDeals && listDeals.length > 0) {
            dealRecord = listDeals[0]
          }
        } catch (_) {}
      }

      const clientNameStr = quoteRecord.getString('client_name') || 'Cliente'
      const dealTitleStr = `Proposta ${quoteNumber} — ${clientNameStr}`
      let dealVal = quoteRecord.getFloat('total')
      if (!dealVal || dealVal <= 0) dealVal = quoteRecord.getFloat('final_price')
      if (!dealVal || dealVal <= 0) dealVal = quoteRecord.getFloat('subtotal')
      if (!dealVal || dealVal <= 0) dealVal = 0

      if (dealRecord) {
        // Movimento manual nunca é desfeito: se o negócio já está em won/lost, não reverter
        const currentStage = dealRecord.getString('stage')
        if (currentStage !== 'won' && currentStage !== 'lost') {
          dealRecord.set('stage', 'lost')
          dealRecord.set('probability', 0)
        }
        dealRecord.set('value', dealVal)
        dealRecord.set('loss_reason', rejectReason || 'Recusada pelo cliente')
        dealRecord.set(
          'notes',
          `Proposta #${quoteNumber} recusada pelo cliente: "${rejectReason || 'Sem motivo especificado'}".`,
        )
        $app.save(dealRecord)
        if (quoteRecord.getString('deal_id') !== dealRecord.id) {
          quoteRecord.set('deal_id', dealRecord.id)
          $app.save(quoteRecord)
        }
      } else {
        const dealsCol = $app.findCollectionByNameOrId('deals')
        const newDeal = new Record(dealsCol)
        newDeal.set('title', dealTitleStr)
        newDeal.set('client_id', quoteRecord.getString('client_id') || '')
        newDeal.set('client_name', clientNameStr)
        newDeal.set('value', dealVal)
        newDeal.set('stage', 'lost')
        newDeal.set('probability', 0)
        newDeal.set('loss_reason', rejectReason || 'Recusada pelo cliente')
        newDeal.set('priority', 'medium')
        newDeal.set('assigned_to', quoteRecord.getString('assigned_to') || 'Alex Nogueira')
        newDeal.set(
          'notes',
          `Proposta #${quoteNumber} recusada pelo cliente: "${rejectReason || 'Sem motivo especificado'}".`,
        )
        $app.save(newDeal)
        quoteRecord.set('deal_id', newDeal.id)
        $app.save(quoteRecord)
      }
    } catch (dealErr) {
      console.warn('Erro ao sincronizar deal na recusa pública:', dealErr)
    }

    return c.json(200, {
      success: true,
      action: 'rejected',
      message: `Proposta #${quoteNumber} marcada como reprovada. A equipe técnica entrará em contato para ajustes.`,
      rejected_at: nowIso,
    })
  }
})
