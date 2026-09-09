// pocketbase/hooks/send_service_order_status_email.js
// Hook acionado via rota HTTP ou disparado no ciclo de transição de status da OS

routerAdd('POST', '/send_service_order_status_email', (c) => {
  try {
    const reqInfo =
      typeof c.requestInfo === 'function'
        ? c.requestInfo()
        : typeof $apis !== 'undefined' && $apis.requestInfo
          ? $apis.requestInfo(c)
          : {}
    const data = reqInfo.data || reqInfo.body || {}
    const orderId = (data.orderId || data.order_id || '').toString().trim()
    const previousStatus = (data.previousStatus || data.previous_status || data.from_status || '')
      .toString()
      .trim()
    const newStatus = (data.newStatus || data.new_status || data.to_status || '').toString().trim()
    const technicalNote = (data.technicalNote || data.notes || data.note || data.reason || '')
      .toString()
      .trim()
    const authorName = (data.authorName || data.user_name || 'Especialista Técnico Intertermal')
      .toString()
      .trim()

    let order = null

    if (orderId) {
      try {
        order = $app.dao().findRecordById('service_orders', orderId)
      } catch (err) {
        // Se não achou por ID, pode ser pelo order_number
        try {
          order = $app.dao().findFirstRecordByData('service_orders', 'order_number', orderId)
        } catch (e2) {}
      }
    }

    // Se ainda não encontrou mas veio payload completo no request
    const orderNumber = order
      ? order.get('order_number') || order.get('quote_number') || order.id
      : data.orderNumber || data.order_number || 'N/A'
    const clientName = order
      ? order.get('client_name') || 'Cliente Industrial'
      : data.clientName || data.client_name || 'Cliente Industrial'
    const quoteNumber = order
      ? order.get('quote_number') || 'N/A'
      : data.quoteNumber || data.quote_number || 'N/A'
    const orderTitle = order
      ? order.get('title') || 'Manutenção BERMO'
      : data.title || 'Manutenção BERMO'
    const equipModel = order
      ? order.get('equipment_model') || 'Trocador BERMO'
      : data.equipmentModel || data.equipment_model || 'Trocador BERMO'

    let totalValueNum = 0
    if (order) {
      totalValueNum = Number(order.get('total_value') || order.get('final_price') || 0)
    } else if (data.totalValue || data.total_value) {
      totalValueNum = Number(data.totalValue || data.total_value || 0)
    }

    const formattedValue =
      'R$ ' +
      totalValueNum.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    const nowFormatted = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })

    const isCancelled =
      newStatus.toLowerCase() === 'cancelled' ||
      newStatus.toLowerCase() === 'cancelada' ||
      newStatus.toLowerCase() === 'cancelado'
    const statusLabel = isCancelled ? 'CANCELADA' : newStatus.toUpperCase()
    const prevLabel = previousStatus ? previousStatus.toUpperCase() : 'ANTERIOR'

    const subject = isCancelled
      ? `[ALERTA INTERTERMAL] Ordem de Serviço #${orderNumber} CANCELADA - ${clientName}`
      : `[CRM INTERTERMAL] Atualização de OS #${orderNumber} [${prevLabel} ➔ ${statusLabel}] - ${clientName}`

    const htmlContent = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }
    .card { max-width: 620px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
    .header { background: #0f172a; padding: 24px; text-align: center; color: #ffffff; }
    .header h1 { margin: 0; font-size: 20px; font-weight: 700; letter-spacing: -0.5px; }
    .header p { margin: 6px 0 0; font-size: 13px; color: #94a3b8; }
    .content { padding: 28px 24px; }
    .badge { display: inline-block; padding: 6px 14px; border-radius: 9999px; font-weight: 700; font-size: 13px; text-transform: uppercase; }
    .badge-status { background-color: ${isCancelled ? '#fee2e2' : '#ccfbf1'}; color: ${isCancelled ? '#991b1b' : '#0f766e'}; }
    .grid-info { width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 13px; }
    .grid-info td { padding: 10px 12px; border-bottom: 1px solid #f1f5f9; }
    .grid-info td.label { font-weight: 600; color: #64748b; width: 38%; }
    .grid-info td.value { font-weight: 700; color: #0f172a; }
    .note-box { background-color: #f8fafc; border-left: 4px solid ${isCancelled ? '#ef4444' : '#0d9488'}; padding: 14px 16px; border-radius: 0 8px 8px 0; margin-top: 18px; font-size: 13px; color: #334155; }
    .footer { background: #f8fafc; padding: 18px 24px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h1>INTERTERMAL • Notificação Operacional de OS</h1>
      <p>Assistência Técnica e Manutenção Especializada BERMO</p>
    </div>
    <div class="content">
      <div style="text-align: center; margin-bottom: 20px;">
        <span class="badge badge-status">
          ${isCancelled ? 'STATUS: CANCELADA' : `ETAPA: ${prevLabel} ➔ ${statusLabel}`}
        </span>
      </div>

      <p style="font-size: 14px; line-height: 1.5; margin: 0 0 16px 0;">
        Olá <strong>Alex Nogueira</strong>,<br/>
        Foi registrada uma movimentação de status na seguinte Ordem de Serviço no CRM Intertermal:
      </p>

      <table class="grid-info">
        <tr>
          <td class="label">Número da OS:</td>
          <td class="value font-mono">#${orderNumber}</td>
        </tr>
        <tr>
          <td class="label">Cliente Industrial:</td>
          <td class="value">${clientName}</td>
        </tr>
        <tr>
          <td class="label">Proposta Vinculada:</td>
          <td class="value">${quoteNumber !== 'N/A' ? '#' + quoteNumber : 'Não vinculada'}</td>
        </tr>
        <tr>
          <td class="label">Título do Serviço:</td>
          <td class="value">${orderTitle}</td>
        </tr>
        <tr>
          <td class="label">Equipamento:</td>
          <td class="value">${equipModel}</td>
        </tr>
        <tr>
          <td class="label">Transição de Status:</td>
          <td class="value" style="color: ${isCancelled ? '#dc2626' : '#0d9488'}; font-weight: bold;">
            ${prevLabel} ➔ ${statusLabel}
          </td>
        </tr>
        <tr>
          <td class="label">Valor da OS:</td>
          <td class="value" style="color: #047857; font-size: 14px;">${formattedValue}</td>
        </tr>
        <tr>
          <td class="label">Data / Hora:</td>
          <td class="value">${nowFormatted}</td>
        </tr>
        <tr>
          <td class="label">Responsável / Autor:</td>
          <td class="value">${authorName}</td>
        </tr>
      </table>

      ${
        technicalNote
          ? `
        <div class="note-box">
          <strong style="display: block; margin-bottom: 4px; color: #0f172a;">
            ${isCancelled ? 'Motivo do Cancelamento:' : 'Nota Técnica / Apontamento:'}
          </strong>
          <em>"${technicalNote}"</em>
        </div>
      `
          : ''
      }
    </div>
    <div class="footer">
      Mensagem gerada automaticamente pelo Sistema Intertermal CRM.<br/>
      Intertermal Assistência Técnica e Manutenção Industrial Ltda. • alex.nogueira@intertermal.com.br
    </div>
  </div>
</body>
</html>
    `

    const recipient = 'alex.nogueira@intertermal.com.br'

    try {
      const email = new MailerMessage({
        from: {
          address: $app.settings().meta.senderAddress || 'alex.nogueira@intertermal.com.br',
          name: $app.settings().meta.senderName || 'INTERTERMAL CRM',
        },
        to: [{ address: recipient }],
        subject: subject,
        html: htmlContent,
      })

      $app.newMailClient().send(email)

      return c.json(200, {
        success: true,
        message: `E-mail de atualização de status da OS #${orderNumber} enviado com sucesso para ${recipient}.`,
        orderNumber,
        newStatus,
        recipient,
      })
    } catch (mailErr) {
      console.warn('Erro no envio de e-mail da OS via Mailer:', mailErr)
      return c.json(200, {
        success: true,
        warning: 'Transição registrada. Falha no envio SMTP: ' + (mailErr.message || mailErr),
        orderNumber,
        newStatus,
        recipient,
      })
    }
  } catch (err) {
    console.error('Erro na rota /send_service_order_status_email:', err)
    return c.json(200, {
      success: true,
      error: err.message || 'Erro capturado sem interromper fluxo.',
    })
  }
})
