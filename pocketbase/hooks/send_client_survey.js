/**
 * PocketBase Hook: Send Client Satisfaction Survey Email & Log Record
 * Route: POST /send_client_survey
 * Receives: {
 *   clientId: string,
 *   contactId?: string,
 *   contactName: string,
 *   contactEmail: string,
 *   contactRole?: string,
 *   contactPhone?: string,
 *   sentBy?: string,
 *   sentByEmail?: string,
 *   customMessage?: string
 * }
 */

routerAdd('POST', '/send_client_survey', (c) => {
  try {
    const reqInfo =
      typeof c.requestInfo === 'function'
        ? c.requestInfo()
        : typeof $apis !== 'undefined' && $apis.requestInfo
          ? $apis.requestInfo(c)
          : {}
    const body = reqInfo.data || reqInfo.body || {}

    const clientId = String(body.clientId || body.client_id || '').trim()
    const contactName = String(body.contactName || body.contact_name || '').trim()
    const contactEmail = String(body.contactEmail || body.contact_email || '')
      .trim()
      .toLowerCase()
    const contactId = String(body.contactId || body.contact_id || '').trim()
    const contactRole = String(body.contactRole || body.contact_role || '').trim()
    const contactPhone = String(body.contactPhone || body.contact_phone || '').trim()
    const sentBy = String(body.sentBy || body.sent_by || 'Alex Nogueira').trim()
    const sentByEmail = String(
      body.sentByEmail || body.sent_by_email || 'alex.nogueira@intertermal.com.br',
    ).trim()
    const customMessage = String(body.customMessage || body.notes || '').trim()

    if (!clientId) {
      return c.json(400, { success: false, error: 'clientId é obrigatório.' })
    }
    if (!contactName) {
      return c.json(400, { success: false, error: 'Nome do contato é obrigatório.' })
    }
    if (!contactEmail || !contactEmail.includes('@')) {
      return c.json(400, {
        success: false,
        error: 'E-mail do contato é obrigatório e deve ser válido.',
      })
    }

    let clientRecord = null
    try {
      clientRecord = $app.findRecordById('clients', clientId)
    } catch (err) {
      return c.json(404, { success: false, error: 'Cliente não encontrado com ID: ' + clientId })
    }

    const clientName =
      clientRecord.getString('name') || clientRecord.getString('company_name') || 'Cliente'
    const surveyUrl = 'https://sa-tqmkajqlmqawtpd6gebuyb5qkq.goskip.app/udgcj46pemulb7duhnc5rg2ebe/'
    const emailSubject = 'Pesquisa de Satisfação — Intertermal | Sua avaliação é fundamental'

    const emailHtml = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>${emailSubject}</title>
</head>
<body style="margin: 0; padding: 24px 12px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; color: #1e293b;">
  <div style="max-width: 620px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(15, 23, 42, 0.08); border: 1px solid #e2e8f0;">
    
    <!-- Cabeçalho Intertermal / BERMO -->
    <div style="background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%); padding: 28px 32px; color: #ffffff; text-align: left;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
        <h1 style="margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.025em; color: #ffffff;">INTERTERMAL</h1>
        <span style="background-color: #0284c7; border: 1px solid #7dd3fc; color: #ffffff; padding: 4px 12px; border-radius: 9999px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;">Pesquisa de Satisfação</span>
      </div>
      <p style="margin: 0; font-size: 14px; opacity: 0.95; color: #e0f2fe;">Assistência Técnica Especializada em Trocadores de Calor e Válvulas Industriais</p>
    </div>

    <!-- Conteúdo Principal -->
    <div style="padding: 32px 32px 24px 32px;">
      <p style="font-size: 16px; line-height: 1.5; margin: 0 0 16px 0; color: #0f172a;">
        Olá, <strong>${contactName}</strong>!
      </p>

      <p style="font-size: 14px; line-height: 1.6; color: #334155; margin: 0 0 16px 0;">
        Esperamos que tudo esteja bem na <strong>${clientName}</strong>.
      </p>

      <p style="font-size: 14px; line-height: 1.6; color: #334155; margin: 0 0 20px 0;">
        Com o objetivo de aprimorar continuamente o padrão dos nossos serviços técnicos, atendimento comercial, cumprimento de prazos e pós-venda, gostaríamos de convidá-lo(a) a responder nossa rápida <strong>Pesquisa de Satisfação</strong>.
      </p>

      ${
        customMessage
          ? `
      <div style="background-color: #f8fafc; border-left: 4px solid #0284c7; padding: 12px 16px; margin: 0 0 20px 0; border-radius: 0 8px 8px 0; font-size: 13px; color: #334155;">
        <strong style="color: #0369a1; display: block; margin-bottom: 4px;">Mensagem da nossa equipe:</strong>
        <em>${customMessage}</em>
      </div>
      `
          : ''
      }

      <!-- Destaque do tempo de resposta -->
      <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 14px 16px; margin-bottom: 24px; text-align: center;">
        <span style="font-size: 13px; color: #166534; font-weight: 600;">⏱ Leva menos de 2 minutos para ser respondida.</span>
      </div>

      <!-- Botão CTA Centralizado com Link Exato -->
      <div style="text-align: center; margin: 30px 0;">
        <a href="${surveyUrl}" target="_blank" rel="noopener noreferrer" style="display: inline-block; background-color: #0284c7; color: #ffffff; text-decoration: none; font-weight: 700; font-size: 15px; padding: 14px 36px; border-radius: 8px; box-shadow: 0 4px 8px rgba(2, 132, 199, 0.25); text-align: center;">
          Acessar Pesquisa de Satisfação
        </a>
      </div>

      <!-- Link alternativo -->
      <p style="font-size: 12px; line-height: 1.5; color: #64748b; margin: 24px 0 0 0; text-align: center; word-break: break-all;">
        Se o botão acima não funcionar, copie e cole o link no seu navegador:<br/>
        <a href="${surveyUrl}" style="color: #0284c7; text-decoration: underline;">${surveyUrl}</a>
      </p>
    </div>

    <!-- Assinatura / Rodapé -->
    <div style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px 32px; font-size: 12px; color: #64748b; line-height: 1.6;">
      <p style="margin: 0 0 6px 0; color: #0f172a; font-weight: 600;">
        Atenciosamente,<br/>
        ${sentBy} • Intertermal / BERMO
      </p>
      <p style="margin: 0; color: #64748b;">
        <strong>INTERTERMAL SISTEMAS DE TROCA TÉRMICA & VÁLVULAS INDUSTRIAIS</strong><br/>
        E-mail: <a href="mailto:alex.nogueira@intertermal.com.br" style="color: #0284c7; text-decoration: none;">alex.nogueira@intertermal.com.br</a> | Tel: (11) 99407-7786 / (15) 3228-3956<br/>
        Sorocaba - SP | Atendimento em todo o território nacional
      </p>
    </div>

  </div>
</body>
</html>`

    // Enviar e-mail via MailClient
    let emailSent = false
    let sendError = null

    try {
      if (typeof $app !== 'undefined' && $app.newMailClient) {
        const mailClient = $app.newMailClient()
        const message = new MailerMessage({
          from: {
            address: 'alex.nogueira@intertermal.com.br',
            name: 'Alex Nogueira - Intertermal | BERMO',
          },
          to: [{ address: contactEmail }],
          subject: emailSubject,
          html: emailHtml,
          bcc: [{ address: 'alexnogueira.inter@gmail.com' }],
        })
        mailClient.send(message)
        emailSent = true
      }
    } catch (mErr) {
      sendError = mErr && mErr.message ? mErr.message : String(mErr)
      console.warn('Falha no envio do e-mail da pesquisa via $app.newMailClient():', sendError)
    }

    // Fallback de envio direto de e-mail do sistema PocketBase caso o mailClient levante exceção
    if (!emailSent) {
      try {
        if (typeof $mails !== 'undefined' && typeof $mails.send === 'function') {
          $mails.send({
            from: {
              address: 'alex.nogueira@intertermal.com.br',
              name: 'Alex Nogueira - Intertermal | BERMO',
            },
            to: [{ address: contactEmail }],
            subject: emailSubject,
            html: emailHtml,
          })
          emailSent = true
          sendError = null
        }
      } catch (fallbackErr) {
        // mantém o sendError anterior
      }
    }

    // Registrar o disparo na coleção client_surveys
    let surveyRecord = null
    try {
      const surveysCol = $app.findCollectionByNameOrId('client_surveys')
      const rec = new Record(surveysCol)
      rec.set('client_id', clientId)
      rec.set('client_name', clientName)
      rec.set('contact_id', contactId)
      rec.set('contact_name', contactName)
      rec.set('contact_email', contactEmail)
      rec.set('contact_role', contactRole)
      rec.set('contact_phone', contactPhone)
      rec.set('survey_url', surveyUrl)
      rec.set('sent_by', sentBy)
      rec.set('sent_by_email', sentByEmail)
      rec.set('email_subject', emailSubject)
      rec.set('status', emailSent ? 'sent' : sendError ? 'error' : 'sent')
      rec.set(
        'notes',
        customMessage
          ? customMessage + (sendError ? ` [Erro SMTP: ${sendError}]` : '')
          : sendError
            ? `[Erro SMTP: ${sendError}]`
            : '',
      )
      $app.save(rec)
      surveyRecord = {
        id: rec.id,
        created: rec.getString('created'),
      }
    } catch (recErr) {
      console.error('Erro ao salvar registro em client_surveys:', recErr)
    }

    if (!emailSent && sendError) {
      return c.json(500, {
        success: false,
        error: 'Erro no envio de e-mail: ' + sendError,
        surveyId: surveyRecord ? surveyRecord.id : null,
      })
    }

    return c.json(200, {
      success: true,
      message: `Pesquisa enviada com sucesso para ${contactName} (${contactEmail})!`,
      recipient: contactEmail,
      contactName: contactName,
      clientName: clientName,
      surveyUrl: surveyUrl,
      surveyId: surveyRecord ? surveyRecord.id : null,
      sentAt: new Date().toISOString(),
    })
  } catch (err) {
    console.error('Erro geral no hook /send_client_survey:', err)
    return c.json(500, {
      success: false,
      error: 'Erro ao processar disparo de pesquisa: ' + (err.message || String(err)),
    })
  }
})
