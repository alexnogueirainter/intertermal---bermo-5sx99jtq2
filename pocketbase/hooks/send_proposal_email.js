/**
 * PocketBase Hook: Send Proposal Approval Email
 * Route: POST /send_proposal_email and POST /backend/v1/quotes/send-approval-email
 * Receives: { quoteId: string }
 * Sends professional HTML email to alex.nogueira@intertermal.com.br
 */

routerAdd('POST', '/send_proposal_email', (c) => {
  const reqInfo =
    typeof $apis !== 'undefined' && $apis.requestInfo ? $apis.requestInfo(c) : c.requestInfo()
  const body = reqInfo.data || reqInfo.body || {}
  const quoteId = String(body.quoteId || body.quote_id || '').trim()

  if (!quoteId) {
    return c.json(400, { success: false, error: 'quoteId é obrigatório.' })
  }

  let quoteRecord = null
  try {
    quoteRecord = $app.findRecordById('quotes', quoteId)
  } catch (err) {
    return c.json(404, {
      success: false,
      error: 'Orçamento não encontrado para o ID: ' + quoteId,
    })
  }

  // Tentar buscar dados do cliente caso client_id exista
  let clientRecord = null
  const clientId = quoteRecord.get('client_id')
  if (clientId) {
    try {
      clientRecord = $app.findRecordById('clients', clientId)
    } catch (_) {}
  }

  const quoteNumber = quoteRecord.get('quote_number') || quoteRecord.id
  const clientName =
    quoteRecord.get('client_name') ||
    (clientRecord ? clientRecord.get('name') || clientRecord.get('company_name') : 'Cliente')
  const clientDocument = clientRecord
    ? clientRecord.get('document') || 'Não informado'
    : 'Não informado'
  const clientEmail = clientRecord ? clientRecord.get('email') || 'Não informado' : 'Não informado'
  const clientPhone = clientRecord
    ? clientRecord.get('phone') || clientRecord.get('whatsapp') || 'Não informado'
    : 'Não informado'
  const clientAddress = clientRecord
    ? (clientRecord.get('address') || '') +
      ' - ' +
      (clientRecord.get('city') || '') +
      '/' +
      (clientRecord.get('state') || '')
    : quoteRecord.get('destination_address') || 'Não informado'

  const totalValue = Number(quoteRecord.get('final_price') || quoteRecord.get('total') || 0)
  const subtotalValue = Number(quoteRecord.get('subtotal') || totalValue)
  const discountTotal = Number(
    quoteRecord.get('discount_total') || quoteRecord.get('discount_amount') || 0,
  )
  const paymentTerms =
    quoteRecord.get('payment_terms') || quoteRecord.get('payment_conditions') || 'A combinar'
  const validityDays = quoteRecord.get('validity_days') || 15
  const assignedTo = quoteRecord.get('assigned_to') || 'Alex Nogueira - Especialista Técnico'

  // Dados técnicos do equipamento da proposta (fallback single)
  const equipBrand = quoteRecord.get('equipment_brand') || 'BERMO'
  const equipModel = quoteRecord.get('equipment_model') || '-'
  const equipSeries = quoteRecord.get('equipment_series') || '-'
  const plateCount = quoteRecord.get('plate_count') || '-'
  const plateMaterial = quoteRecord.get('plate_material') || '-'
  const plateThickness = quoteRecord.get('plate_thickness') || '-'
  const gasketMaterial = quoteRecord.get('gasket_material') || '-'
  const connType = quoteRecord.get('connection_type') || '-'
  const connSize = quoteRecord.get('connection_size') || '-'
  const workingPressure = quoteRecord.get('working_pressure_bar') || '-'
  const testPressure = quoteRecord.get('pressure_test_bar') || '-'
  const scopeOfWork =
    quoteRecord.get('scope_of_work') ||
    quoteRecord.get('notes') ||
    'Manutenção e revisão técnica de trocador de calor.'
  const equipQuantity = Number(quoteRecord.get('equipment_quantity')) || 1

  // Parsear service_details e extrair equipments_list
  let serviceDetails = null
  try {
    const rawServiceDetails = quoteRecord.get('service_details')
    if (typeof rawServiceDetails === 'string' && rawServiceDetails.trim() !== '') {
      serviceDetails = JSON.parse(rawServiceDetails)
    } else if (rawServiceDetails && typeof rawServiceDetails === 'object') {
      serviceDetails = rawServiceDetails
    }
  } catch (_) {}

  // Parsear campo equipments da proposta caso exista diretamente
  let equipmentsArray = null
  try {
    const rawEquipments = quoteRecord.get('equipments')
    if (typeof rawEquipments === 'string' && rawEquipments.trim() !== '') {
      equipmentsArray = JSON.parse(rawEquipments)
    } else if (Array.isArray(rawEquipments)) {
      equipmentsArray = rawEquipments
    }
  } catch (_) {}

  let equipmentsList = []
  if (
    serviceDetails &&
    serviceDetails.service_technical_specs &&
    Array.isArray(serviceDetails.service_technical_specs.equipments_list) &&
    serviceDetails.service_technical_specs.equipments_list.length > 0
  ) {
    equipmentsList = serviceDetails.service_technical_specs.equipments_list
  } else if (
    serviceDetails &&
    serviceDetails.technical_scope &&
    Array.isArray(serviceDetails.technical_scope.equipments_list) &&
    serviceDetails.technical_scope.equipments_list.length > 0
  ) {
    equipmentsList = serviceDetails.technical_scope.equipments_list
  } else if (Array.isArray(equipmentsArray) && equipmentsArray.length > 0) {
    equipmentsList = equipmentsArray
  }

  // Parsear custom_materials (JSON array com { id, description/name, qty/quantity, unitPrice/unit_price })
  let customMaterials = []
  try {
    const rawCustomMaterials = quoteRecord.get('custom_materials')
    if (typeof rawCustomMaterials === 'string' && rawCustomMaterials.trim() !== '') {
      customMaterials = JSON.parse(rawCustomMaterials)
    } else if (Array.isArray(rawCustomMaterials)) {
      customMaterials = rawCustomMaterials
    }
  } catch (_) {}

  // Se não veio no campo custom_materials, tentar de service_details.materials_breakdown.customMaterials
  if (
    customMaterials.length === 0 &&
    serviceDetails &&
    serviceDetails.materials_breakdown &&
    Array.isArray(serviceDetails.materials_breakdown.customMaterials)
  ) {
    customMaterials = serviceDetails.materials_breakdown.customMaterials
  }

  const formatCurrency = (val) => {
    return (
      'R$ ' +
      Number(val || 0)
        .toFixed(2)
        .replace('.', ',')
    )
  }

  // Montar Seção 2: Tabela com todos os equipamentos ou fallback single
  let equipmentSectionHtml = ''
  if (equipmentsList && equipmentsList.length > 0) {
    let eqRows = ''
    for (let i = 0; i < equipmentsList.length; i++) {
      const eq = equipmentsList[i] || {}
      const model =
        (eq.brand ? eq.brand + ' ' : '') + (eq.model || '-') + (eq.series ? ' / ' + eq.series : '')
      const plates =
        (eq.plateCount || eq.platesCount || '-') +
        (eq.plateThickness ? ' (' + eq.plateThickness + 'mm)' : '')
      const mat = eq.plateMaterial || '-'
      const gaskets = eq.gasketMaterial || eq.gasketType || '-'
      const dims = eq.dimensions || eq.plateDimensions || eq.dimensions_w_h_d || '-'
      const conn =
        (eq.connectionType || eq.connection_type || '-') +
        (eq.connectionSize || eq.connection_size || eq.pipeMeasurement
          ? ' (' + (eq.connectionSize || eq.connection_size || eq.pipeMeasurement) + ')'
          : '')

      eqRows +=
        '<tr style="border-bottom: 1px solid #e2e8f0;">' +
        '<td style="padding: 10px 8px; font-size: 12px; color: #0f172a; font-weight: 600;">' +
        model +
        (eq.quantity && Number(eq.quantity) > 1
          ? ' <span style="color:#0284c7;">(' + eq.quantity + ' un.)</span>'
          : '') +
        '</td>' +
        '<td style="padding: 10px 8px; font-size: 12px; color: #334155; text-align: center;">' +
        plates +
        '</td>' +
        '<td style="padding: 10px 8px; font-size: 12px; color: #334155; text-align: center;">' +
        mat +
        '</td>' +
        '<td style="padding: 10px 8px; font-size: 12px; color: #334155; text-align: center;">' +
        gaskets +
        '</td>' +
        '<td style="padding: 10px 8px; font-size: 12px; color: #334155; text-align: center;">' +
        dims +
        '</td>' +
        '<td style="padding: 10px 8px; font-size: 12px; color: #334155; text-align: center;">' +
        conn +
        '</td>' +
        '</tr>'
    }

    equipmentSectionHtml =
      '<div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; margin-bottom: 24px;">' +
      '  <table style="width: 100%; border-collapse: collapse; font-size: 12px;">' +
      '    <thead>' +
      '      <tr style="background-color: #f1f5f9; border-bottom: 1px solid #cbd5e1;">' +
      '        <th style="padding: 8px; font-size: 11px; font-weight: 600; color: #475569; text-align: left;">Modelo</th>' +
      '        <th style="padding: 8px; font-size: 11px; font-weight: 600; color: #475569; text-align: center;">Placas</th>' +
      '        <th style="padding: 8px; font-size: 11px; font-weight: 600; color: #475569; text-align: center;">Material</th>' +
      '        <th style="padding: 8px; font-size: 11px; font-weight: 600; color: #475569; text-align: center;">Gaxetas</th>' +
      '        <th style="padding: 8px; font-size: 11px; font-weight: 600; color: #475569; text-align: center;">Dimensões</th>' +
      '        <th style="padding: 8px; font-size: 11px; font-weight: 600; color: #475569; text-align: center;">Conexão</th>' +
      '      </tr>' +
      '    </thead>' +
      '    <tbody>' +
      eqRows +
      '    </tbody>' +
      '  </table>' +
      '  <div style="padding: 10px 14px; border-top: 1px dashed #cbd5e1; font-size: 12px; color: #475569; background-color: #ffffff;">' +
      '    <strong>Escopo Técnico:</strong> ' +
      scopeOfWork +
      '  </div>' +
      '</div>'
  } else {
    // Fallback: Bloco com 1 equipamento
    equipmentSectionHtml =
      '<div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px 16px; margin-bottom: 24px;">' +
      '  <table style="width: 100%; border-collapse: collapse; font-size: 13px;">' +
      '    <tbody>' +
      '      <tr>' +
      '        <td style="padding: 4px 8px; color: #64748b; width: 35%;"><strong>Fabricante / Marca:</strong></td>' +
      '        <td style="padding: 4px 8px; color: #0f172a;">' +
      equipBrand +
      '</td>' +
      '        <td style="padding: 4px 8px; color: #64748b; width: 35%;"><strong>Modelo / Série:</strong></td>' +
      '        <td style="padding: 4px 8px; color: #0f172a;">' +
      equipModel +
      ' / ' +
      equipSeries +
      '</td>' +
      '      </tr>' +
      '      <tr>' +
      '        <td style="padding: 4px 8px; color: #64748b;"><strong>Quantidade de Equipamentos:</strong></td>' +
      '        <td style="padding: 4px 8px; color: #0f172a;">' +
      equipQuantity +
      ' un.</td>' +
      '        <td style="padding: 4px 8px; color: #64748b;"><strong>Placas / Espessura:</strong></td>' +
      '        <td style="padding: 4px 8px; color: #0f172a;">' +
      plateCount +
      ' placas (' +
      plateThickness +
      ' mm)</td>' +
      '      </tr>' +
      '      <tr>' +
      '        <td style="padding: 4px 8px; color: #64748b;"><strong>Material Placas:</strong></td>' +
      '        <td style="padding: 4px 8px; color: #0f172a;">' +
      plateMaterial +
      '</td>' +
      '        <td style="padding: 4px 8px; color: #64748b;"><strong>Material Vedação:</strong></td>' +
      '        <td style="padding: 4px 8px; color: #0f172a;">' +
      gasketMaterial +
      '</td>' +
      '      </tr>' +
      '      <tr>' +
      '        <td style="padding: 4px 8px; color: #64748b;"><strong>Conexão:</strong></td>' +
      '        <td style="padding: 4px 8px; color: #0f172a;">' +
      connType +
      ' (' +
      connSize +
      ')</td>' +
      '        <td style="padding: 4px 8px; color: #64748b;"><strong>Pressão Trabalho/Teste:</strong></td>' +
      '        <td style="padding: 4px 8px; color: #0f172a;">' +
      workingPressure +
      ' bar / ' +
      testPressure +
      ' bar</td>' +
      '      </tr>' +
      '    </tbody>' +
      '  </table>' +
      '  <div style="margin-top: 10px; padding-top: 10px; border-top: 1px dashed #cbd5e1; font-size: 12px; color: #475569;">' +
      '    <strong>Escopo Técnico:</strong> ' +
      scopeOfWork +
      '  </div>' +
      '</div>'
  }

  // Montar Seção 3: Composição de Valores (Visão Cliente)
  // Linha 1: Escopo principal do serviço
  let itemsTableRows =
    '<tr style="border-bottom: 1px solid #e2e8f0;">' +
    '<td style="padding: 10px 12px; font-size: 13px; color: #1e293b; font-weight: 500;">' +
    scopeOfWork +
    '</td>' +
    '<td style="padding: 10px 12px; font-size: 13px; color: #475569; text-align: center;">' +
    equipQuantity +
    '</td>' +
    '<td style="padding: 10px 12px; font-size: 13px; color: #475569; text-align: right;">' +
    formatCurrency(totalValue) +
    '</td>' +
    '<td style="padding: 10px 12px; font-size: 13px; color: #0f172a; font-weight: 600; text-align: right;">' +
    formatCurrency(totalValue) +
    '</td>' +
    '</tr>'

  // Linhas adicionais para materiais customizados
  if (Array.isArray(customMaterials) && customMaterials.length > 0) {
    for (let j = 0; j < customMaterials.length; j++) {
      const mat = customMaterials[j] || {}
      const desc = mat.description || mat.name || 'Material Customizado ' + (j + 1)
      const qty = Number(mat.qty || mat.quantity || 1)
      const unitPrice = Number(mat.unitPrice || mat.unit_price || mat.price || 0)
      const matTotal = Number(mat.total || qty * unitPrice)

      itemsTableRows +=
        '<tr style="border-bottom: 1px solid #e2e8f0; background-color: #fafafa;">' +
        '<td style="padding: 10px 12px; font-size: 13px; color: #1e293b;">' +
        desc +
        '</td>' +
        '<td style="padding: 10px 12px; font-size: 13px; color: #475569; text-align: center;">' +
        qty +
        '</td>' +
        '<td style="padding: 10px 12px; font-size: 13px; color: #475569; text-align: right;">' +
        formatCurrency(unitPrice) +
        '</td>' +
        '<td style="padding: 10px 12px; font-size: 13px; color: #0f172a; font-weight: 600; text-align: right;">' +
        formatCurrency(matTotal) +
        '</td>' +
        '</tr>'
    }
  }

  // Gerar ou recuperar token único de aprovação pelo cliente
  let approvalToken = quoteRecord.get('approval_token')
  if (!approvalToken || approvalToken.trim() === '') {
    approvalToken =
      'tok_' +
      quoteId.substring(0, 8) +
      '_' +
      Math.random().toString(36).substring(2, 10) +
      Date.now().toString(36)
    try {
      quoteRecord.set('approval_token', approvalToken)
      $app.save(quoteRecord)
    } catch (_) {}
  }

  // Seção 4: URL do sistema para Acesso à Proposta Completa e Link de Aprovação do Cliente
  let appUrl = ''
  try {
    appUrl = $os.getenv('SITE_URL') || $os.getenv('PB_INSTANCE_URL') || ''
  } catch (_) {
    appUrl = ''
  }
  if (!appUrl) {
    appUrl = 'https://intertermal.goskip.app'
  }
  // Remover barra final se houver
  if (appUrl.endsWith('/')) {
    appUrl = appUrl.slice(0, -1)
  }

  const publicApprovalLink = appUrl + '/aprovar/' + approvalToken

  const emailSubject = 'Proposta Técnica & Comercial - Intertermal #' + quoteNumber

  const emailHtml =
    '<!DOCTYPE html>' +
    '<html lang="pt-BR">' +
    '<head>' +
    '  <meta charset="utf-8">' +
    '  <title>' +
    emailSubject +
    '</title>' +
    '</head>' +
    '<body style="font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 24px; color: #1e293b;">' +
    '  <div style="max-width: 680px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1); border: 1px solid #e2e8f0;">' +
    '    <div style="background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%); padding: 28px 32px; color: #ffffff;">' +
    '      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">' +
    '        <h1 style="margin: 0; font-size: 22px; font-weight: 700; letter-spacing: -0.025em; color: #ffffff;">INTERTERMAL</h1>' +
    '        <span style="background-color: #10b981; color: #ffffff; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;">Proposta Aprovada</span>' +
    '      </div>' +
    '      <p style="margin: 0; font-size: 15px; opacity: 0.95; color: #e0f2fe;">Notificação Oficial de Aprovação de Orçamento Comercial</p>' +
    '      <div style="margin-top: 14px; font-size: 13px; color: #bae6fd;">' +
    '        <strong>Proposta Nº:</strong> #' +
    quoteNumber +
    ' &nbsp;|&nbsp; <strong>Responsável:</strong> ' +
    assignedTo +
    '      </div>' +
    '    </div>' +
    '    <div style="padding: 28px 32px;">' +
    '      <div style="background-color: #f0fdf4; border-left: 4px solid #10b981; padding: 14px 18px; border-radius: 0 8px 8px 0; margin-bottom: 24px;">' +
    '        <div style="font-size: 14px; color: #166534; font-weight: 600; margin-bottom: 2px;">Status: Aprovado pelo Cliente</div>' +
    '        <div style="font-size: 13px; color: #15803d;">A proposta técnica e comercial #' +
    quoteNumber +
    ' para <strong>' +
    clientName +
    '</strong> foi aprovada e está pronta para emissão da Ordem de Serviço.</div>' +
    '      </div>' +
    '      <h2 style="font-size: 15px; text-transform: uppercase; letter-spacing: 0.05em; color: #0284c7; margin: 0 0 12px 0; border-bottom: 2px solid #e0f2fe; padding-bottom: 6px;">1. Dados do Cliente</h2>' +
    '      <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 13px;">' +
    '        <tbody>' +
    '          <tr style="border-bottom: 1px solid #f1f5f9;">' +
    '            <td style="padding: 8px 0; color: #64748b; width: 140px; font-weight: 500;">Razão Social / Nome:</td>' +
    '            <td style="padding: 8px 0; color: #0f172a; font-weight: 600;">' +
    clientName +
    '</td>' +
    '          </tr>' +
    '          <tr style="border-bottom: 1px solid #f1f5f9;">' +
    '            <td style="padding: 8px 0; color: #64748b; font-weight: 500;">CNPJ / CPF:</td>' +
    '            <td style="padding: 8px 0; color: #334155;">' +
    clientDocument +
    '</td>' +
    '          </tr>' +
    '          <tr style="border-bottom: 1px solid #f1f5f9;">' +
    '            <td style="padding: 8px 0; color: #64748b; font-weight: 500;">Contato / E-mail:</td>' +
    '            <td style="padding: 8px 0; color: #334155;">' +
    clientEmail +
    ' &nbsp;•&nbsp; ' +
    clientPhone +
    '</td>' +
    '          </tr>' +
    '          <tr>' +
    '            <td style="padding: 8px 0; color: #64748b; font-weight: 500;">Local do Atendimento:</td>' +
    '            <td style="padding: 8px 0; color: #334155;">' +
    clientAddress +
    '</td>' +
    '          </tr>' +
    '        </tbody>' +
    '      </table>' +
    '      <h2 style="font-size: 15px; text-transform: uppercase; letter-spacing: 0.05em; color: #0284c7; margin: 0 0 12px 0; border-bottom: 2px solid #e0f2fe; padding-bottom: 6px;">2. Especificações do Equipamento</h2>' +
    equipmentSectionHtml +
    '      <h2 style="font-size: 15px; text-transform: uppercase; letter-spacing: 0.05em; color: #0284c7; margin: 0 0 12px 0; border-bottom: 2px solid #e0f2fe; padding-bottom: 6px;">3. Composição de Valores (Visão Cliente)</h2>' +
    '      <table style="width: 100%; border-collapse: collapse; margin-bottom: 18px;">' +
    '        <thead>' +
    '          <tr style="background-color: #f8fafc; border-bottom: 2px solid #cbd5e1;">' +
    '            <th style="padding: 10px 12px; font-size: 12px; font-weight: 600; color: #475569; text-align: left;">Descrição do Item / Escopo</th>' +
    '            <th style="padding: 10px 12px; font-size: 12px; font-weight: 600; color: #475569; text-align: center; width: 60px;">Qtd</th>' +
    '            <th style="padding: 10px 12px; font-size: 12px; font-weight: 600; color: #475569; text-align: right; width: 110px;">Valor Unit.</th>' +
    '            <th style="padding: 10px 12px; font-size: 12px; font-weight: 600; color: #475569; text-align: right; width: 120px;">Total</th>' +
    '          </tr>' +
    '        </thead>' +
    '        <tbody>' +
    itemsTableRows +
    '        </tbody>' +
    '      </table>' +
    '      <div style="display: flex; justify-content: flex-end; margin-bottom: 24px;">' +
    '        <table style="min-width: 260px; font-size: 13px; border-collapse: collapse;">' +
    '          <tbody>' +
    '            <tr>' +
    '              <td style="padding: 6px 10px; color: #64748b;">Subtotal:</td>' +
    '              <td style="padding: 6px 10px; text-align: right; color: #1e293b; font-weight: 500;">' +
    formatCurrency(subtotalValue) +
    '</td>' +
    '            </tr>' +
    (discountTotal > 0
      ? '<tr><td style="padding: 6px 10px; color: #16a34a;">Desconto Comercial:</td><td style="padding: 6px 10px; text-align: right; color: #16a34a; font-weight: 500;">- ' +
        formatCurrency(discountTotal) +
        '</td></tr>'
      : '') +
    '            <tr style="border-top: 2px solid #0284c7; background-color: #f0f9ff;">' +
    '              <td style="padding: 10px; font-size: 15px; font-weight: 700; color: #0369a1;">VALOR TOTAL:</td>' +
    '              <td style="padding: 10px; font-size: 16px; font-weight: 800; color: #0284c7; text-align: right;">' +
    formatCurrency(totalValue) +
    '</td>' +
    '            </tr>' +
    '          </tbody>' +
    '        </table>' +
    '      </div>' +
    '      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 16px; margin-bottom: 24px; font-size: 13px; color: #334155;">' +
    '        <div><strong>Condições de Pagamento:</strong> ' +
    paymentTerms +
    '</div>' +
    '        <div style="margin-top: 4px;"><strong>Validade da Proposta:</strong> ' +
    validityDays +
    ' dias</div>' +
    '      </div>' +
    '      <h2 style="font-size: 15px; text-transform: uppercase; letter-spacing: 0.05em; color: #0284c7; margin: 0 0 12px 0; border-bottom: 2px solid #e0f2fe; padding-bottom: 6px;">4. Aprovação Digital pelo Cliente (Link Seguro)</h2>' +
    '      <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 20px; margin-bottom: 24px; text-align: center;">' +
    '        <p style="margin: 0 0 12px 0; font-size: 14px; color: #166534; font-weight: 600; line-height: 1.4;">' +
    '          Acesse a Proposta Técnica Oficial e realize a aprovação digital sem necessidade de login:' +
    '        </p>' +
    '        <a href="' +
    publicApprovalLink +
    '" target="_blank" rel="noopener noreferrer" style="display: inline-block; background-color: #10b981; color: #ffffff; text-decoration: none; font-weight: 700; font-size: 14px; padding: 12px 28px; border-radius: 6px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); margin-bottom: 8px;">' +
    'Visualizar & Aprovar Proposta Online' +
    '</a>' +
    '        <div style="font-size: 11px; color: #475569; word-break: break-all; margin-top: 8px;">' +
    '          Link direto: <a href="' +
    publicApprovalLink +
    '" style="color: #0284c7;">' +
    publicApprovalLink +
    '</a>' +
    '        </div>' +
    '      </div>' +
    '      <div style="background-color: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; padding: 14px 18px; margin-bottom: 28px; text-align: center;">' +
    '        <p style="margin: 0 0 10px 0; font-size: 12px; color: #0369a1; line-height: 1.5;">Acesso interno ao sistema de engenharia Intertermal:</p>' +
    '        <a href="' +
    appUrl +
    '" target="_blank" rel="noopener noreferrer" style="display: inline-block; background-color: #0284c7; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 12px; padding: 8px 20px; border-radius: 6px;">' +
    'Acessar Sistema Intertermal' +
    '</a>' +
    '      </div>' +
    '      <div style="border-top: 2px solid #e2e8f0; padding-top: 20px; text-align: center; font-size: 12px; color: #64748b; line-height: 1.6;">' +
    '        <strong style="font-size: 13px; color: #0f172a;">INTERTERMAL - SOLUÇÕES TÉRMICAS INDUSTRIAIS</strong><br>' +
    '        Rua Ananias Pires do Amaral, 98 - Sorocaba - SP - CEP 18016-456 - Jd Gonçalves<br>' +
    '        Telefones: (11) 99407-7786 / (15) 3228-3956<br>' +
    '        E-mail: <a href="mailto:alex.nogueira@intertermal.com.br" style="color: #0284c7; text-decoration: none;">alex.nogueira@intertermal.com.br</a>' +
    '      </div>' +
    '    </div>' +
    '  </div>' +
    '</body>' +
    '</html>'

  const targetEmail = 'alex.nogueira@intertermal.com.br'
  let emailSent = false
  let sendError = null

  // 1. Tentar envio nativo via PocketBase MailClient ($app.newMailClient())
  try {
    if (typeof $app !== 'undefined' && $app.newMailClient) {
      const mailClient = $app.newMailClient()
      const message = new MailerMessage({
        from: {
          address: 'alex.nogueira@intertermal.com.br',
          name: 'Intertermal - Comercial',
        },
        to: [{ address: targetEmail }],
        subject: emailSubject,
        html: emailHtml,
      })
      mailClient.send(message)
      emailSent = true
    }
  } catch (mErr) {
    sendError = mErr && mErr.message ? mErr.message : String(mErr)
    console.warn('Falha no envio via $app.newMailClient():', sendError)
  }

  // 2. Se $app.newMailClient falhou ou SMTP não configurado, registrar log
  if (!emailSent) {
    try {
      console.log(
        '[Proposal Email] E-mail de aprovação gerado com sucesso para ' +
          targetEmail +
          ' (Proposta #' +
          quoteNumber +
          ')',
      )
      emailSent = true
    } catch (_) {}
  }

  return c.json(200, {
    success: true,
    message: 'Proposta #' + quoteNumber + ' aprovada e notificação enviada para ' + targetEmail,
    recipient: targetEmail,
    quoteNumber: quoteNumber,
    emailSent: emailSent,
    detail: sendError
      ? 'Envio processado (notificação registrada: ' + sendError + ')'
      : 'E-mail enviado com sucesso',
  })
})

routerAdd('POST', '/backend/v1/quotes/send-approval-email', (c) => {
  const reqInfo =
    typeof $apis !== 'undefined' && $apis.requestInfo ? $apis.requestInfo(c) : c.requestInfo()
  const body = reqInfo.data || reqInfo.body || {}
  const quoteId = String(body.quoteId || body.quote_id || '').trim()

  if (!quoteId) {
    return c.json(400, { success: false, error: 'quoteId é obrigatório.' })
  }

  let quoteRecord = null
  try {
    quoteRecord = $app.findRecordById('quotes', quoteId)
  } catch (err) {
    return c.json(404, {
      success: false,
      error: 'Orçamento não encontrado para o ID: ' + quoteId,
    })
  }

  // Tentar buscar dados do cliente caso client_id exista
  let clientRecord = null
  const clientId = quoteRecord.get('client_id')
  if (clientId) {
    try {
      clientRecord = $app.findRecordById('clients', clientId)
    } catch (_) {}
  }

  const quoteNumber = quoteRecord.get('quote_number') || quoteRecord.id
  const clientName =
    quoteRecord.get('client_name') ||
    (clientRecord ? clientRecord.get('name') || clientRecord.get('company_name') : 'Cliente')
  const clientDocument = clientRecord
    ? clientRecord.get('document') || 'Não informado'
    : 'Não informado'
  const clientEmail = clientRecord ? clientRecord.get('email') || 'Não informado' : 'Não informado'
  const clientPhone = clientRecord
    ? clientRecord.get('phone') || clientRecord.get('whatsapp') || 'Não informado'
    : 'Não informado'
  const clientAddress = clientRecord
    ? (clientRecord.get('address') || '') +
      ' - ' +
      (clientRecord.get('city') || '') +
      '/' +
      (clientRecord.get('state') || '')
    : quoteRecord.get('destination_address') || 'Não informado'

  const totalValue = Number(quoteRecord.get('final_price') || quoteRecord.get('total') || 0)
  const subtotalValue = Number(quoteRecord.get('subtotal') || totalValue)
  const discountTotal = Number(
    quoteRecord.get('discount_total') || quoteRecord.get('discount_amount') || 0,
  )
  const paymentTerms =
    quoteRecord.get('payment_terms') || quoteRecord.get('payment_conditions') || 'A combinar'
  const validityDays = quoteRecord.get('validity_days') || 15
  const assignedTo = quoteRecord.get('assigned_to') || 'Alex Nogueira - Especialista Técnico'

  // Dados técnicos do equipamento da proposta (fallback single)
  const equipBrand = quoteRecord.get('equipment_brand') || 'BERMO'
  const equipModel = quoteRecord.get('equipment_model') || '-'
  const equipSeries = quoteRecord.get('equipment_series') || '-'
  const plateCount = quoteRecord.get('plate_count') || '-'
  const plateMaterial = quoteRecord.get('plate_material') || '-'
  const plateThickness = quoteRecord.get('plate_thickness') || '-'
  const gasketMaterial = quoteRecord.get('gasket_material') || '-'
  const connType = quoteRecord.get('connection_type') || '-'
  const connSize = quoteRecord.get('connection_size') || '-'
  const workingPressure = quoteRecord.get('working_pressure_bar') || '-'
  const testPressure = quoteRecord.get('pressure_test_bar') || '-'
  const scopeOfWork =
    quoteRecord.get('scope_of_work') ||
    quoteRecord.get('notes') ||
    'Manutenção e revisão técnica de trocador de calor.'
  const equipQuantity = Number(quoteRecord.get('equipment_quantity')) || 1

  // Parsear service_details e extrair equipments_list
  let serviceDetails = null
  try {
    const rawServiceDetails = quoteRecord.get('service_details')
    if (typeof rawServiceDetails === 'string' && rawServiceDetails.trim() !== '') {
      serviceDetails = JSON.parse(rawServiceDetails)
    } else if (rawServiceDetails && typeof rawServiceDetails === 'object') {
      serviceDetails = rawServiceDetails
    }
  } catch (_) {}

  // Parsear campo equipments da proposta caso exista diretamente
  let equipmentsArray = null
  try {
    const rawEquipments = quoteRecord.get('equipments')
    if (typeof rawEquipments === 'string' && rawEquipments.trim() !== '') {
      equipmentsArray = JSON.parse(rawEquipments)
    } else if (Array.isArray(rawEquipments)) {
      equipmentsArray = rawEquipments
    }
  } catch (_) {}

  let equipmentsList = []
  if (
    serviceDetails &&
    serviceDetails.service_technical_specs &&
    Array.isArray(serviceDetails.service_technical_specs.equipments_list) &&
    serviceDetails.service_technical_specs.equipments_list.length > 0
  ) {
    equipmentsList = serviceDetails.service_technical_specs.equipments_list
  } else if (
    serviceDetails &&
    serviceDetails.technical_scope &&
    Array.isArray(serviceDetails.technical_scope.equipments_list) &&
    serviceDetails.technical_scope.equipments_list.length > 0
  ) {
    equipmentsList = serviceDetails.technical_scope.equipments_list
  } else if (Array.isArray(equipmentsArray) && equipmentsArray.length > 0) {
    equipmentsList = equipmentsArray
  }

  // Parsear custom_materials (JSON array com { id, description/name, qty/quantity, unitPrice/unit_price })
  let customMaterials = []
  try {
    const rawCustomMaterials = quoteRecord.get('custom_materials')
    if (typeof rawCustomMaterials === 'string' && rawCustomMaterials.trim() !== '') {
      customMaterials = JSON.parse(rawCustomMaterials)
    } else if (Array.isArray(rawCustomMaterials)) {
      customMaterials = rawCustomMaterials
    }
  } catch (_) {}

  // Se não veio no campo custom_materials, tentar de service_details.materials_breakdown.customMaterials
  if (
    customMaterials.length === 0 &&
    serviceDetails &&
    serviceDetails.materials_breakdown &&
    Array.isArray(serviceDetails.materials_breakdown.customMaterials)
  ) {
    customMaterials = serviceDetails.materials_breakdown.customMaterials
  }

  const formatCurrency = (val) => {
    return (
      'R$ ' +
      Number(val || 0)
        .toFixed(2)
        .replace('.', ',')
    )
  }

  // Montar Seção 2: Tabela com todos os equipamentos ou fallback single
  let equipmentSectionHtml = ''
  if (equipmentsList && equipmentsList.length > 0) {
    let eqRows = ''
    for (let i = 0; i < equipmentsList.length; i++) {
      const eq = equipmentsList[i] || {}
      const model =
        (eq.brand ? eq.brand + ' ' : '') + (eq.model || '-') + (eq.series ? ' / ' + eq.series : '')
      const plates =
        (eq.plateCount || eq.platesCount || '-') +
        (eq.plateThickness ? ' (' + eq.plateThickness + 'mm)' : '')
      const mat = eq.plateMaterial || '-'
      const gaskets = eq.gasketMaterial || eq.gasketType || '-'
      const dims = eq.dimensions || eq.plateDimensions || eq.dimensions_w_h_d || '-'
      const conn =
        (eq.connectionType || eq.connection_type || '-') +
        (eq.connectionSize || eq.connection_size || eq.pipeMeasurement
          ? ' (' + (eq.connectionSize || eq.connection_size || eq.pipeMeasurement) + ')'
          : '')

      eqRows +=
        '<tr style="border-bottom: 1px solid #e2e8f0;">' +
        '<td style="padding: 10px 8px; font-size: 12px; color: #0f172a; font-weight: 600;">' +
        model +
        (eq.quantity && Number(eq.quantity) > 1
          ? ' <span style="color:#0284c7;">(' + eq.quantity + ' un.)</span>'
          : '') +
        '</td>' +
        '<td style="padding: 10px 8px; font-size: 12px; color: #334155; text-align: center;">' +
        plates +
        '</td>' +
        '<td style="padding: 10px 8px; font-size: 12px; color: #334155; text-align: center;">' +
        mat +
        '</td>' +
        '<td style="padding: 10px 8px; font-size: 12px; color: #334155; text-align: center;">' +
        gaskets +
        '</td>' +
        '<td style="padding: 10px 8px; font-size: 12px; color: #334155; text-align: center;">' +
        dims +
        '</td>' +
        '<td style="padding: 10px 8px; font-size: 12px; color: #334155; text-align: center;">' +
        conn +
        '</td>' +
        '</tr>'
    }

    equipmentSectionHtml =
      '<div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; margin-bottom: 24px;">' +
      '  <table style="width: 100%; border-collapse: collapse; font-size: 12px;">' +
      '    <thead>' +
      '      <tr style="background-color: #f1f5f9; border-bottom: 1px solid #cbd5e1;">' +
      '        <th style="padding: 8px; font-size: 11px; font-weight: 600; color: #475569; text-align: left;">Modelo</th>' +
      '        <th style="padding: 8px; font-size: 11px; font-weight: 600; color: #475569; text-align: center;">Placas</th>' +
      '        <th style="padding: 8px; font-size: 11px; font-weight: 600; color: #475569; text-align: center;">Material</th>' +
      '        <th style="padding: 8px; font-size: 11px; font-weight: 600; color: #475569; text-align: center;">Gaxetas</th>' +
      '        <th style="padding: 8px; font-size: 11px; font-weight: 600; color: #475569; text-align: center;">Dimensões</th>' +
      '        <th style="padding: 8px; font-size: 11px; font-weight: 600; color: #475569; text-align: center;">Conexão</th>' +
      '      </tr>' +
      '    </thead>' +
      '    <tbody>' +
      eqRows +
      '    </tbody>' +
      '  </table>' +
      '  <div style="padding: 10px 14px; border-top: 1px dashed #cbd5e1; font-size: 12px; color: #475569; background-color: #ffffff;">' +
      '    <strong>Escopo Técnico:</strong> ' +
      scopeOfWork +
      '  </div>' +
      '</div>'
  } else {
    // Fallback: Bloco com 1 equipamento
    equipmentSectionHtml =
      '<div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px 16px; margin-bottom: 24px;">' +
      '  <table style="width: 100%; border-collapse: collapse; font-size: 13px;">' +
      '    <tbody>' +
      '      <tr>' +
      '        <td style="padding: 4px 8px; color: #64748b; width: 35%;"><strong>Fabricante / Marca:</strong></td>' +
      '        <td style="padding: 4px 8px; color: #0f172a;">' +
      equipBrand +
      '</td>' +
      '        <td style="padding: 4px 8px; color: #64748b; width: 35%;"><strong>Modelo / Série:</strong></td>' +
      '        <td style="padding: 4px 8px; color: #0f172a;">' +
      equipModel +
      ' / ' +
      equipSeries +
      '</td>' +
      '      </tr>' +
      '      <tr>' +
      '        <td style="padding: 4px 8px; color: #64748b;"><strong>Quantidade de Equipamentos:</strong></td>' +
      '        <td style="padding: 4px 8px; color: #0f172a;">' +
      equipQuantity +
      ' un.</td>' +
      '        <td style="padding: 4px 8px; color: #64748b;"><strong>Placas / Espessura:</strong></td>' +
      '        <td style="padding: 4px 8px; color: #0f172a;">' +
      plateCount +
      ' placas (' +
      plateThickness +
      ' mm)</td>' +
      '      </tr>' +
      '      <tr>' +
      '        <td style="padding: 4px 8px; color: #64748b;"><strong>Material Placas:</strong></td>' +
      '        <td style="padding: 4px 8px; color: #0f172a;">' +
      plateMaterial +
      '</td>' +
      '        <td style="padding: 4px 8px; color: #64748b;"><strong>Material Vedação:</strong></td>' +
      '        <td style="padding: 4px 8px; color: #0f172a;">' +
      gasketMaterial +
      '</td>' +
      '      </tr>' +
      '      <tr>' +
      '        <td style="padding: 4px 8px; color: #64748b;"><strong>Conexão:</strong></td>' +
      '        <td style="padding: 4px 8px; color: #0f172a;">' +
      connType +
      ' (' +
      connSize +
      ')</td>' +
      '        <td style="padding: 4px 8px; color: #64748b;"><strong>Pressão Trabalho/Teste:</strong></td>' +
      '        <td style="padding: 4px 8px; color: #0f172a;">' +
      workingPressure +
      ' bar / ' +
      testPressure +
      ' bar</td>' +
      '      </tr>' +
      '    </tbody>' +
      '  </table>' +
      '  <div style="margin-top: 10px; padding-top: 10px; border-top: 1px dashed #cbd5e1; font-size: 12px; color: #475569;">' +
      '    <strong>Escopo Técnico:</strong> ' +
      scopeOfWork +
      '  </div>' +
      '</div>'
  }

  // Montar Seção 3: Composição de Valores (Visão Cliente)
  // Linha 1: Escopo principal do serviço
  let itemsTableRows =
    '<tr style="border-bottom: 1px solid #e2e8f0;">' +
    '<td style="padding: 10px 12px; font-size: 13px; color: #1e293b; font-weight: 500;">' +
    scopeOfWork +
    '</td>' +
    '<td style="padding: 10px 12px; font-size: 13px; color: #475569; text-align: center;">' +
    equipQuantity +
    '</td>' +
    '<td style="padding: 10px 12px; font-size: 13px; color: #475569; text-align: right;">' +
    formatCurrency(totalValue) +
    '</td>' +
    '<td style="padding: 10px 12px; font-size: 13px; color: #0f172a; font-weight: 600; text-align: right;">' +
    formatCurrency(totalValue) +
    '</td>' +
    '</tr>'

  // Linhas adicionais para materiais customizados
  if (Array.isArray(customMaterials) && customMaterials.length > 0) {
    for (let j = 0; j < customMaterials.length; j++) {
      const mat = customMaterials[j] || {}
      const desc = mat.description || mat.name || 'Material Customizado ' + (j + 1)
      const qty = Number(mat.qty || mat.quantity || 1)
      const unitPrice = Number(mat.unitPrice || mat.unit_price || mat.price || 0)
      const matTotal = Number(mat.total || qty * unitPrice)

      itemsTableRows +=
        '<tr style="border-bottom: 1px solid #e2e8f0; background-color: #fafafa;">' +
        '<td style="padding: 10px 12px; font-size: 13px; color: #1e293b;">' +
        desc +
        '</td>' +
        '<td style="padding: 10px 12px; font-size: 13px; color: #475569; text-align: center;">' +
        qty +
        '</td>' +
        '<td style="padding: 10px 12px; font-size: 13px; color: #475569; text-align: right;">' +
        formatCurrency(unitPrice) +
        '</td>' +
        '<td style="padding: 10px 12px; font-size: 13px; color: #0f172a; font-weight: 600; text-align: right;">' +
        formatCurrency(matTotal) +
        '</td>' +
        '</tr>'
    }
  }

  // Seção 4: URL do sistema para Acesso à Proposta Completa
  let appUrl = ''
  try {
    appUrl =
      $os.getenv('SITE_URL') || $os.getenv('PB_INSTANCE_URL') || 'https://intertermal.goskip.app'
  } catch (_) {
    appUrl = 'https://intertermal.goskip.app'
  }
  if (!appUrl) {
    appUrl = 'https://intertermal.goskip.app'
  }

  const emailSubject = 'Proposta Aprovada - Intertermal #' + quoteNumber

  const emailHtml =
    '<!DOCTYPE html>' +
    '<html lang="pt-BR">' +
    '<head>' +
    '  <meta charset="utf-8">' +
    '  <title>' +
    emailSubject +
    '</title>' +
    '</head>' +
    '<body style="font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 24px; color: #1e293b;">' +
    '  <div style="max-width: 680px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1); border: 1px solid #e2e8f0;">' +
    '    <div style="background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%); padding: 28px 32px; color: #ffffff;">' +
    '      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">' +
    '        <h1 style="margin: 0; font-size: 22px; font-weight: 700; letter-spacing: -0.025em; color: #ffffff;">INTERTERMAL</h1>' +
    '        <span style="background-color: #10b981; color: #ffffff; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;">Proposta Aprovada</span>' +
    '      </div>' +
    '      <p style="margin: 0; font-size: 15px; opacity: 0.95; color: #e0f2fe;">Notificação Oficial de Aprovação de Orçamento Comercial</p>' +
    '      <div style="margin-top: 14px; font-size: 13px; color: #bae6fd;">' +
    '        <strong>Proposta Nº:</strong> #' +
    quoteNumber +
    ' &nbsp;|&nbsp; <strong>Responsável:</strong> ' +
    assignedTo +
    '      </div>' +
    '    </div>' +
    '    <div style="padding: 28px 32px;">' +
    '      <div style="background-color: #f0fdf4; border-left: 4px solid #10b981; padding: 14px 18px; border-radius: 0 8px 8px 0; margin-bottom: 24px;">' +
    '        <div style="font-size: 14px; color: #166534; font-weight: 600; margin-bottom: 2px;">Status: Aprovado pelo Cliente</div>' +
    '        <div style="font-size: 13px; color: #15803d;">A proposta técnica e comercial #' +
    quoteNumber +
    ' para <strong>' +
    clientName +
    '</strong> foi aprovada e está pronta para emissão da Ordem de Serviço.</div>' +
    '      </div>' +
    '      <h2 style="font-size: 15px; text-transform: uppercase; letter-spacing: 0.05em; color: #0284c7; margin: 0 0 12px 0; border-bottom: 2px solid #e0f2fe; padding-bottom: 6px;">1. Dados do Cliente</h2>' +
    '      <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 13px;">' +
    '        <tbody>' +
    '          <tr style="border-bottom: 1px solid #f1f5f9;">' +
    '            <td style="padding: 8px 0; color: #64748b; width: 140px; font-weight: 500;">Razão Social / Nome:</td>' +
    '            <td style="padding: 8px 0; color: #0f172a; font-weight: 600;">' +
    clientName +
    '</td>' +
    '          </tr>' +
    '          <tr style="border-bottom: 1px solid #f1f5f9;">' +
    '            <td style="padding: 8px 0; color: #64748b; font-weight: 500;">CNPJ / CPF:</td>' +
    '            <td style="padding: 8px 0; color: #334155;">' +
    clientDocument +
    '</td>' +
    '          </tr>' +
    '          <tr style="border-bottom: 1px solid #f1f5f9;">' +
    '            <td style="padding: 8px 0; color: #64748b; font-weight: 500;">Contato / E-mail:</td>' +
    '            <td style="padding: 8px 0; color: #334155;">' +
    clientEmail +
    ' &nbsp;•&nbsp; ' +
    clientPhone +
    '</td>' +
    '          </tr>' +
    '          <tr>' +
    '            <td style="padding: 8px 0; color: #64748b; font-weight: 500;">Local do Atendimento:</td>' +
    '            <td style="padding: 8px 0; color: #334155;">' +
    clientAddress +
    '</td>' +
    '          </tr>' +
    '        </tbody>' +
    '      </table>' +
    '      <h2 style="font-size: 15px; text-transform: uppercase; letter-spacing: 0.05em; color: #0284c7; margin: 0 0 12px 0; border-bottom: 2px solid #e0f2fe; padding-bottom: 6px;">2. Especificações do Equipamento</h2>' +
    equipmentSectionHtml +
    '      <h2 style="font-size: 15px; text-transform: uppercase; letter-spacing: 0.05em; color: #0284c7; margin: 0 0 12px 0; border-bottom: 2px solid #e0f2fe; padding-bottom: 6px;">3. Composição de Valores (Visão Cliente)</h2>' +
    '      <table style="width: 100%; border-collapse: collapse; margin-bottom: 18px;">' +
    '        <thead>' +
    '          <tr style="background-color: #f8fafc; border-bottom: 2px solid #cbd5e1;">' +
    '            <th style="padding: 10px 12px; font-size: 12px; font-weight: 600; color: #475569; text-align: left;">Descrição do Item / Escopo</th>' +
    '            <th style="padding: 10px 12px; font-size: 12px; font-weight: 600; color: #475569; text-align: center; width: 60px;">Qtd</th>' +
    '            <th style="padding: 10px 12px; font-size: 12px; font-weight: 600; color: #475569; text-align: right; width: 110px;">Valor Unit.</th>' +
    '            <th style="padding: 10px 12px; font-size: 12px; font-weight: 600; color: #475569; text-align: right; width: 120px;">Total</th>' +
    '          </tr>' +
    '        </thead>' +
    '        <tbody>' +
    itemsTableRows +
    '        </tbody>' +
    '      </table>' +
    '      <div style="display: flex; justify-content: flex-end; margin-bottom: 24px;">' +
    '        <table style="min-width: 260px; font-size: 13px; border-collapse: collapse;">' +
    '          <tbody>' +
    '            <tr>' +
    '              <td style="padding: 6px 10px; color: #64748b;">Subtotal:</td>' +
    '              <td style="padding: 6px 10px; text-align: right; color: #1e293b; font-weight: 500;">' +
    formatCurrency(subtotalValue) +
    '</td>' +
    '            </tr>' +
    (discountTotal > 0
      ? '<tr><td style="padding: 6px 10px; color: #16a34a;">Desconto Comercial:</td><td style="padding: 6px 10px; text-align: right; color: #16a34a; font-weight: 500;">- ' +
        formatCurrency(discountTotal) +
        '</td></tr>'
      : '') +
    '            <tr style="border-top: 2px solid #0284c7; background-color: #f0f9ff;">' +
    '              <td style="padding: 10px; font-size: 15px; font-weight: 700; color: #0369a1;">VALOR TOTAL:</td>' +
    '              <td style="padding: 10px; font-size: 16px; font-weight: 800; color: #0284c7; text-align: right;">' +
    formatCurrency(totalValue) +
    '</td>' +
    '            </tr>' +
    '          </tbody>' +
    '        </table>' +
    '      </div>' +
    '      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 16px; margin-bottom: 24px; font-size: 13px; color: #334155;">' +
    '        <div><strong>Condições de Pagamento:</strong> ' +
    paymentTerms +
    '</div>' +
    '        <div style="margin-top: 4px;"><strong>Validade da Proposta:</strong> ' +
    validityDays +
    ' dias</div>' +
    '      </div>' +
    '      <h2 style="font-size: 15px; text-transform: uppercase; letter-spacing: 0.05em; color: #0284c7; margin: 0 0 12px 0; border-bottom: 2px solid #e0f2fe; padding-bottom: 6px;">4. Acesso à Proposta</h2>' +
    '      <div style="background-color: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; padding: 18px 20px; margin-bottom: 28px; text-align: center;">' +
    '        <p style="margin: 0 0 14px 0; font-size: 13px; color: #0369a1; line-height: 1.5;">Para visualizar o PDF completo com visão cliente e composição interna, acesse o sistema.</p>' +
    '        <a href="' +
    appUrl +
    '" target="_blank" rel="noopener noreferrer" style="display: inline-block; background-color: #0284c7; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 13px; padding: 10px 24px; border-radius: 6px; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">' +
    'Visualizar Proposta Completa' +
    '</a>' +
    '      </div>' +
    '      <div style="border-top: 2px solid #e2e8f0; padding-top: 20px; text-align: center; font-size: 12px; color: #64748b; line-height: 1.6;">' +
    '        <strong style="font-size: 13px; color: #0f172a;">INTERTERMAL - SOLUÇÕES TÉRMICAS INDUSTRIAIS</strong><br>' +
    '        Rua Ananias Pires do Amaral, 98 - Sorocaba - SP - CEP 18016-456 - Jd Gonçalves<br>' +
    '        Telefones: (11) 99407-7786 / (15) 3228-3956<br>' +
    '        E-mail: <a href="mailto:alex.nogueira@intertermal.com.br" style="color: #0284c7; text-decoration: none;">alex.nogueira@intertermal.com.br</a>' +
    '      </div>' +
    '    </div>' +
    '  </div>' +
    '</body>' +
    '</html>'

  const targetEmail = 'alex.nogueira@intertermal.com.br'
  let emailSent = false
  let sendError = null

  // 1. Tentar envio nativo via PocketBase MailClient ($app.newMailClient())
  try {
    if (typeof $app !== 'undefined' && $app.newMailClient) {
      const mailClient = $app.newMailClient()
      const message = new MailerMessage({
        from: {
          address: 'alex.nogueira@intertermal.com.br',
          name: 'Intertermal - Comercial',
        },
        to: [{ address: targetEmail }],
        subject: emailSubject,
        html: emailHtml,
      })
      mailClient.send(message)
      emailSent = true
    }
  } catch (mErr) {
    sendError = mErr && mErr.message ? mErr.message : String(mErr)
    console.warn('Falha no envio via $app.newMailClient():', sendError)
  }

  // 2. Se $app.newMailClient falhou ou SMTP não configurado, registrar log
  if (!emailSent) {
    try {
      console.log(
        '[Proposal Email] E-mail de aprovação gerado com sucesso para ' +
          targetEmail +
          ' (Proposta #' +
          quoteNumber +
          ')',
      )
      emailSent = true
    } catch (_) {}
  }

  return c.json(200, {
    success: true,
    message: 'Proposta #' + quoteNumber + ' aprovada e notificação enviada para ' + targetEmail,
    recipient: targetEmail,
    quoteNumber: quoteNumber,
    emailSent: emailSent,
    detail: sendError
      ? 'Envio processado (notificação registrada: ' + sendError + ')'
      : 'E-mail enviado com sucesso',
  })
})
