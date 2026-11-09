/**
 * Hook: Ações da tela Campanhas (uma rota única, 3 ações no corpo).
 * Route (POST, autenticada): /backend/v1/campaigns/action
 * Body: { action: 'save' | 'test' | 'send', ... }
 * - save: cria/atualiza a campanha (modelo, etiqueta, destinatários marcados)
 * - test: envia 1 e-mail de teste para o próprio Alex (RESEND_API_KEY)
 * - send: cria os campaign_recipients pendentes e ativa a fila (status → sending)
 * Regra de destinatários: por etiqueta (list_tag) OU marcados um a um (emails[]).
 * Nunca inclui descadastrados (unsubscribes) nem clientes com unsubscribed_at.
 */
routerAdd(
  'POST',
  '/backend/v1/campaigns/action',
  (e) => {
    const body = e.requestInfo().body || {}
    const action = String(body.action || '')
    const apiKey = $secrets.get('RESEND_API_KEY') || ''

    if (!apiKey) {
      return e.json(400, {
        ok: false,
        error: 'RESEND_API_KEY não configurada no painel de segredos do Skip',
      })
    }

    const FROM = 'Intertermal | Grupo Inter <alex.nogueira@intertermal.com.br>'
    const escapeHtml = (s) =>
      String(s || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')

    const renderHtml = (subject, bodyTpl, nome, empresa, email) => {
      const personalizar = (txt) =>
        String(txt || '')
          .split('{nome}')
          .join(nome || 'cliente')
          .split('{empresa}')
          .join(empresa || 'sua empresa')
      const htmlBody =
        '<div style="font-family: Arial, sans-serif; color: #1a1a1a; max-width: 560px; margin: 0 auto;">' +
        personalizar(bodyTpl)
          .split('\n')
          .filter((l) => l.trim().length > 0)
          .map(
            (l) =>
              '<p style="font-size: 14px; line-height: 1.6; margin: 0 0 12px;">' +
              escapeHtml(l) +
              '</p>',
          )
          .join('') +
        '<hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />' +
        '<p style="font-size: 12px; color: #64748b;">Intertermal Projetos e Instalações · Engenharia, instalações industriais e automação · www.interproject.com.br</p>' +
        '<p style="font-size: 12px;"><a href="https://crm-comercial-sofisticado-00224.shrd03.internal.goskip.dev/backend/v1/campaigns/unsubscribe?t=' +
        encodeURIComponent(email) +
        '" style="color: #64748b;">Não quero mais receber</a></p>' +
        '</div>'
      return { subject: personalizar(subject), html: htmlBody }
    }

    const sendViaResend = (to, subject, bodyTpl, nome, empresa) => {
      const rendered = renderHtml(subject, bodyTpl, nome, empresa, to)
      let res = null
      try {
        res = $http.send({
          url: 'https://api.resend.com/emails',
          method: 'POST',
          headers: { Authorization: 'Bearer ' + apiKey, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            from: FROM,
            to: [to],
            subject: rendered.subject,
            html: rendered.html,
          }),
          timeout: 20,
        })
      } catch (err) {
        return { ok: false, error: 'transporte: ' + String(err) }
      }
      if (res.statusCode === 200 && res.json && res.json.id) {
        return { ok: true, id: String(res.json.id) }
      }
      return {
        ok: false,
        error:
          'HTTP ' +
          res.statusCode +
          ': ' +
          String(res.body ? new TextDecoder().decode(res.body) : '').slice(0, 200),
      }
    }

    // ===== AÇÃO: TESTE =====
    if (action === 'test') {
      const subject = String(body.subject || '')
      const bodyTpl = String(body.body || '')
      const to = String(body.to || 'alex.nogueira@intertermal.com.br')
        .toLowerCase()
        .trim()
      if (!subject || !bodyTpl)
        return e.json(400, { ok: false, error: 'Assunto e texto obrigatórios' })
      const r = sendViaResend(to, subject, bodyTpl, 'Alex Nogueira', 'Intertermal')
      if (!r.ok) return e.json(502, { ok: false, error: r.error })
      return e.json(200, { ok: true, resend_id: r.id })
    }

    // ===== AÇÃO: SAVE =====
    if (action === 'save') {
      const name = String(body.name || '').trim()
      const subject = String(body.subject || '').trim()
      const bodyTpl = String(body.body || '').trim()
      const listTag = String(body.list_tag || '').trim()
      const recipients = Array.isArray(body.recipients) ? body.recipients : []
      if (!name || !subject || !bodyTpl) {
        return e.json(400, { ok: false, error: 'Nome, assunto e texto obrigatórios' })
      }
      if (!listTag && recipients.length === 0) {
        return e.json(400, { ok: false, error: 'Escolha a etiqueta ou marque os destinatários' })
      }

      // Destinatários: da etiqueta (clients por tags) OU marcados um a um — nunca descadastrados
      let chosen = []
      try {
        const unsubSet = new Set()
        const unsubs = $app.findRecordsByFilter('unsubscribes', '', '-created', 10000, 0)
        for (const u of unsubs)
          unsubSet.add(
            String(u.get('email') || '')
              .toLowerCase()
              .trim(),
          )

        const clients = $app.findRecordsByFilter('clients', '', '-created', 5000, 0)
        const picked = new Map()
        for (const c of clients) {
          if (c.get('unsubscribed_at')) continue
          const tags = c.get('tags') || []
          const tagMatch = listTag && Array.isArray(tags) && tags.includes(listTag)
          const emails = []
          if (c.get('email')) emails.push(String(c.get('email')))
          const contacts = c.get('contacts') || []
          if (Array.isArray(contacts)) {
            for (const ct of contacts) if (ct.email) emails.push(String(ct.email))
          }
          const manualMatch =
            !listTag &&
            recipients.length > 0 &&
            emails.some((em) =>
              recipients
                .map((r) => String(r).toLowerCase().trim())
                .includes(em.toLowerCase().trim()),
            )
          if (!tagMatch && !manualMatch) continue
          for (const em of emails) {
            const key = em.toLowerCase().trim()
            if (!key || unsubSet.has(key) || picked.has(key)) continue
            picked.set(key, {
              email: key,
              name: String(c.get('name') || ''),
              company: String(c.get('company_name') || c.get('name') || ''),
            })
          }
        }
        chosen = Array.from(picked.values())
      } catch (err) {
        return e.json(500, { ok: false, error: 'Falha ao montar destinatários: ' + String(err) })
      }

      if (chosen.length === 0) {
        return e.json(400, {
          ok: false,
          error: 'Nenhum destinatário elegível (verifique etiqueta e descadastrados)',
        })
      }

      const col = $app.findCollectionByNameOrId('campaigns')
      const rec = new Record(col)
      rec.set('name', name)
      rec.set('subject', subject)
      rec.set('body', bodyTpl)
      rec.set('list_tag', listTag)
      rec.set('recipients', chosen)
      rec.set('status', 'draft')
      rec.set('daily_limit', 90)
      rec.set('sent_count', 0)
      rec.set('test_sent', false)
      rec.set('created_by', String(e.auth ? e.auth.get('email') || '' : ''))
      $app.save(rec)

      console.log(
        '[campanhas] Campanha salva: ' + rec.id + ' (' + chosen.length + ' destinatários)',
      )
      return e.json(200, { ok: true, campaign_id: rec.id, recipients: chosen.length })
    }

    // ===== AÇÃO: SEND =====
    if (action === 'send') {
      const campaignId = String(body.campaign_id || '')
      let campaign = null
      try {
        campaign = $app.findRecordById('campaigns', campaignId)
      } catch (_) {
        campaign = null
      }
      if (!campaign) return e.json(404, { ok: false, error: 'Campanha não encontrada' })
      if (String(campaign.get('status') || '') !== 'draft') {
        return e.json(400, { ok: false, error: 'Campanha não está em rascunho' })
      }

      const recipients = campaign.get('recipients') || []
      if (!Array.isArray(recipients) || recipients.length === 0) {
        return e.json(400, { ok: false, error: 'Campanha sem destinatários' })
      }

      const recCol = $app.findCollectionByNameOrId('campaign_recipients')
      let created = 0
      for (const r of recipients) {
        const p = new Record(recCol)
        p.set('campaign_id', campaignId)
        p.set(
          'email',
          String(r.email || '')
            .toLowerCase()
            .trim(),
        )
        p.set('name', String(r.name || ''))
        p.set('company', String(r.company || ''))
        p.set('status', 'pending')
        $app.save(p)
        created++
      }

      campaign.set('status', 'sending')
      $app.save(campaign)

      console.log(
        '[campanhas] Campanha ATIVADA: ' + campaignId + ' (' + created + ' na fila, 90/dia)',
      )
      return e.json(200, { ok: true, queued: created, daily_limit: 90 })
    }

    return e.json(400, { ok: false, error: 'Ação desconhecida' })
  },
  $apis.requireAuth(),
)
