/**
 * Hook: Ações da tela Campanhas (uma rota única, 3 ações no corpo).
 * Route (POST, autenticada): /backend/v1/campaigns/action
 * Body: { action: 'save' | 'test' | 'send', ... }
 * - save: cria a campanha (modelo, etiqueta, destinatários) — NÃO envia, não usa chave
 * - test: envia 1 e-mail de teste para o próprio Alex (exige RESEND_API_KEY)
 * - send: cria os campaign_recipients pendentes e ativa a fila (status → sending)
 * Regra de destinatários: lista explícita de e-mails (etiqueta resolvida no frontend
 * ou marcados um a um). Nunca inclui descadastrados (unsubscribes) nem clientes
 * com unsubscribed_at.
 */
routerAdd(
  'POST',
  '/backend/v1/campaigns/action',
  (e) => {
    const body = e.requestInfo().body || {}
    const action = String(body.action || '')
    // A chave só é exigida na AÇÃO TESTE (que envia de fato). Salvar e disparar
    // não enviam e-mail — a fila usa a chave quando rodar.
    const apiKey = $secrets.get('RESEND_API_KEY') || ''

    const FROM = 'Intertermal | Grupo Inter <alex.nogueira@intertermal.com.br>'
    const escapeHtml = (s) =>
      String(s || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')

    const renderHtml = (subject, bodyTpl, nomeCompleto, empresa, email) => {
      // {nome} = primeiro nome (sem título Eng./Dr., inicial maiúscula);
      // {nome_completo} = nome inteiro. {nome_completo} TEM de ser trocado
      // antes de {nome} — senão o split de {nome} quebra o token maior.
      const limpo = String(nomeCompleto || '')
        .replace(/^(eng\.?|dr\.?|dra\.?|sr\.?|sra\.?)\s+/i, '')
        .trim()
      const primeiro = (limpo.split(/\s+/)[0] || '').trim()
      const primeiroNome = primeiro
        ? primeiro.charAt(0).toUpperCase() + primeiro.slice(1).toLowerCase()
        : ''
      const personalizar = (txt) =>
        String(txt || '')
          .split('{nome_completo}')
          .join(nomeCompleto || 'cliente')
          .split('{nome}')
          .join(primeiroNome || 'cliente')
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

    const sendViaResend = (to, subject, bodyTpl, nome, empresa, atts) => {
      const rendered = renderHtml(subject, bodyTpl, nome, empresa, to)
      // Payload montado de forma imperativa: o JSVM não suporta spread
      // condicional em objeto literal (ReferenceError __spreadValues).
      const payload = {
        from: FROM,
        to: [to],
        subject: rendered.subject,
        html: rendered.html,
      }
      if (Array.isArray(atts) && atts.length > 0) payload.attachments = atts
      let res = null
      try {
        res = $http.send({
          url: 'https://api.resend.com/emails',
          method: 'POST',
          headers: { Authorization: 'Bearer ' + apiKey, 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          timeout: 20,
        })
      } catch (err) {
        return { ok: false, error: 'transporte: ' + String(err) }
      }
      if (res.statusCode === 200 && res.json && res.json.id) {
        return { ok: true, id: String(res.json.id) }
      }
      let errBody = ''
      try {
        if (res.body && res.body.length > 0) {
          errBody = new TextDecoder().decode(new Uint8Array(res.body))
        }
      } catch (_) {
        errBody = ''
      }
      return {
        ok: false,
        error: 'HTTP ' + res.statusCode + ': ' + String(errBody).slice(0, 250),
      }
    }

    // ---- Anexos (Base64 p/ o Resend) — mesmo padrão provado do envio de propostas ----
    // O runtime JSVM não tem btoa: conversão manual byte a byte.
    const uint8ToBase64 = (bytes) => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
      const out = []
      for (let i = 0; i < bytes.length; i += 3) {
        const b1 = bytes[i]
        const b2 = i + 1 < bytes.length ? bytes[i + 1] : 0
        const b3 = i + 2 < bytes.length ? bytes[i + 2] : 0
        const has2 = i + 1 < bytes.length
        const has3 = i + 2 < bytes.length
        out.push(
          chars[b1 >> 2],
          chars[((b1 & 3) << 4) | (b2 >> 4)],
          has2 ? chars[((b2 & 15) << 2) | (b3 >> 6)] : '=',
          has3 ? chars[b3 & 63] : '=',
        )
      }
      return out.join('')
    }

    // Baixa os anexos (campaign_attachments) e devolve no formato do Resend.
    // $http.send é síncrono; o body volta como bytes → Uint8Array.
    const buildAttachments = (ids) => {
      const out = []
      for (const id0 of Array.isArray(ids) ? ids : []) {
        const id = String(id0 || '').trim()
        if (!id) continue
        let rec = null
        try {
          rec = $app.findRecordById('campaign_attachments', id)
        } catch (_) {
          rec = null
        }
        if (!rec) continue
        const fname = String(rec.get('file') || '')
        if (!fname) continue
        const displayName = String(rec.get('filename') || fname)
        const fileUrl =
          ($secrets.get('PB_INSTANCE_URL') || '') +
          '/api/files/' +
          rec.collection().id +
          '/' +
          rec.id +
          '/' +
          encodeURIComponent(fname) +
          '?token=' +
          ($secrets.get('PB_SUPERUSER_TOKEN') || '')
        try {
          const fRes = $http.send({ url: fileUrl, method: 'GET', timeout: 30 })
          if (fRes.statusCode === 200 && fRes.body && fRes.body.length > 0) {
            out.push({ filename: displayName, content: uint8ToBase64(new Uint8Array(fRes.body)) })
          } else {
            console.warn(
              '[campanhas] Anexo não baixado (HTTP ' + fRes.statusCode + '): ' + displayName,
            )
          }
        } catch (errA) {
          console.warn('[campanhas] Falha ao baixar anexo ' + displayName + ':', errA)
        }
      }
      return out
    }

    // ===== AÇÃO: TESTE =====
    if (action === 'test') {
      if (!apiKey) {
        return e.json(400, {
          ok: false,
          error: 'RESEND_API_KEY não configurada no painel de segredos do Skip',
        })
      }
      const subject = String(body.subject || '')
      const bodyTpl = String(body.body || '')
      const to = String(body.to || 'alex.nogueira@intertermal.com.br')
        .toLowerCase()
        .trim()
      if (!subject || !bodyTpl)
        return e.json(400, { ok: false, error: 'Assunto e texto obrigatórios' })
      const atts = buildAttachments(body.attachment_ids)
      const r = sendViaResend(to, subject, bodyTpl, 'Alex Nogueira', 'Intertermal', atts)
      if (!r.ok) return e.json(502, { ok: false, error: r.error })
      return e.json(200, { ok: true, resend_id: r.id, attachments: atts.length })
    }

    // ===== AÇÃO: SAVE =====
    if (action === 'save') {
      const name = String(body.name || '').trim()
      const subject = String(body.subject || '').trim()
      const bodyTpl = String(body.body || '').trim()
      const listTag = String(body.list_tag || '').trim()
      const recipientsIn = Array.isArray(body.recipients) ? body.recipients : []
      if (!name || !subject || !bodyTpl) {
        return e.json(400, { ok: false, error: 'Nome, assunto e texto obrigatórios' })
      }
      if (!listTag && recipientsIn.length === 0) {
        return e.json(400, { ok: false, error: 'Escolha a etiqueta ou marque os destinatários' })
      }

      // Destinatários: lista explícita de e-mails (etiqueta resolvida no frontend
      // ou marcados um a um) — nunca descadastrados
      let chosen = []
      try {
        const unsubSet = new Set()
        const unsubs = $app.findRecordsByFilter('unsubscribes', 'id != ""', '-created', 10000, 0)
        for (const u of unsubs)
          unsubSet.add(
            String(u.get('email') || '')
              .toLowerCase()
              .trim(),
          )

        const wantSet = new Set(
          recipientsIn
            .map((r) =>
              String(r || '')
                .toLowerCase()
                .trim(),
            )
            .filter((x) => x),
        )
        if (wantSet.size === 0) {
          return e.json(400, { ok: false, error: 'Nenhum destinatário na lista' })
        }

        const clients = $app.findRecordsByFilter('clients', 'id != ""', '-created', 5000, 0)
        const picked = new Map()
        for (const c of clients) {
          // JSON fields no JSVM chegam como STRING ou como ARRAY DE BYTES —
          // tratar os dois (bytes faziam os e-mails de contato sumirem e o
          // save rejeitar qualquer campanha com contato marcado).
          let contacts = c.get('contacts')
          if (typeof contacts === 'string') {
            try {
              contacts = JSON.parse(contacts)
            } catch (_) {
              contacts = []
            }
          } else if (
            Array.isArray(contacts) &&
            contacts.length > 0 &&
            typeof contacts[0] === 'number'
          ) {
            try {
              contacts = JSON.parse(new TextDecoder().decode(new Uint8Array(contacts)))
            } catch (_) {
              contacts = []
            }
          }
          const unsubAt = String(c.get('unsubscribed_at') || '')
          if (unsubAt && unsubAt.indexOf('0001') !== 0) continue
          const emails = []
          if (c.get('email')) emails.push(String(c.get('email')))
          if (Array.isArray(contacts)) {
            for (const ct of contacts) if (ct.email) emails.push(String(ct.email))
          }
          let matched = false
          for (const em of emails) {
            if (wantSet.has(em.toLowerCase().trim())) {
              matched = true
              break
            }
          }
          if (!matched) continue
          // Nome da PESSOA quando o e-mail é de um contato com nome — é o que
          // vira {nome} no envio ("Olá Carlos,"). E-mail principal da conta
          // não tem nome de pessoa: name vazio → fila usa "cliente".
          const company = String(c.get('company_name') || c.get('name') || '')
          for (const em of emails) {
            const key = em.toLowerCase().trim()
            if (!key || !wantSet.has(key) || unsubSet.has(key) || picked.has(key)) continue
            let personName = ''
            if (Array.isArray(contacts)) {
              for (const ct of contacts) {
                if (
                  ct &&
                  String(ct.email || '')
                    .toLowerCase()
                    .trim() === key &&
                  String(ct.name || '').trim()
                ) {
                  personName = String(ct.name).trim()
                  break
                }
              }
            }
            picked.set(key, { email: key, name: personName, company })
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

      // Vínculo dos anexos: os arquivos já subiram pela API do PocketBase
      // (campaign_attachments com campaign_id vazio) — aqui só assina o dono.
      const attIds = Array.isArray(body.attachment_ids) ? body.attachment_ids : []
      for (const id0 of attIds) {
        const id = String(id0 || '').trim()
        if (!id) continue
        try {
          const a = $app.findRecordById('campaign_attachments', id)
          if (!String(a.get('campaign_id') || '')) {
            a.set('campaign_id', rec.id)
            $app.save(a)
          }
        } catch (_) {}
      }

      console.log(
        '[campanhas] Campanha salva: ' + rec.id + ' (' + chosen.length + ' destinatários)',
      )
      return e.json(200, { ok: true, campaign_id: rec.id, recipients: chosen.length })
    }

    // ===== AÇÃO: TEMPLATE-SAVE (criar/atualizar modelo) =====
    if (action === 'template-save') {
      try {
        const name = String(body.name || '').trim()
        const category = String(body.category || 'Outro').trim()
        const subject = String(body.subject || '').trim()
        const bodyTpl = String(body.body || '').trim()
        const templateId = String(body.template_id || '').trim()
        if (!name || !subject || !bodyTpl) {
          return e.json(400, { ok: false, error: 'Nome, assunto e texto obrigatórios' })
        }
        // Anexos do modelo: os arquivos já subiram pela API (template_id vazio)
        // — aqui só assina o dono. Anexos desmarcados são apagados.
        const attIds = Array.isArray(body.attachment_ids) ? body.attachment_ids : []
        const wantSet = new Set(attIds.map((x) => String(x || '').trim()).filter(Boolean))
        if (templateId) {
          try {
            const old = $app.findRecordsByFilter(
              'campaign_attachments',
              'template_id = {:t}',
              '-created',
              10,
              0,
              { t: templateId },
            )
            for (const o of old) {
              if (!wantSet.has(String(o.id))) $app.delete(o)
            }
          } catch (_) {}
        }
        for (const id0 of attIds) {
          const id = String(id0 || '').trim()
          if (!id) continue
          try {
            const a = $app.findRecordById('campaign_attachments', id)
            if (!String(a.get('template_id') || '')) {
              a.set('template_id', templateId)
              $app.save(a)
            }
          } catch (_) {}
        }
        const col = $app.findCollectionByNameOrId('campaign_templates')
        if (templateId) {
          let rec = null
          try {
            rec = $app.findRecordById('campaign_templates', templateId)
          } catch (_) {
            rec = null
          }
          if (!rec) return e.json(404, { ok: false, error: 'Modelo não encontrado' })
          rec.set('name', name)
          rec.set('category', category)
          rec.set('subject', subject)
          rec.set('body', bodyTpl)
          $app.save(rec)
          return e.json(200, { ok: true, template_id: rec.id })
        }
        const rec = new Record(col)
        rec.set('name', name)
        rec.set('category', category)
        rec.set('subject', subject)
        rec.set('body', bodyTpl)
        $app.save(rec)
        console.log('[campanhas] Modelo salvo: ' + rec.id + ' (' + category + ')')
        return e.json(200, { ok: true, template_id: rec.id })
      } catch (errTpl) {
        return e.json(500, { ok: false, error: 'template-save falhou: ' + String(errTpl) })
      }
    }

    // ===== AÇÃO: SEND =====
    if (action === 'send') {
      try {
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

        // O JSVM devolve o JSONField como ARRAY DE BYTES (números 0-255) —
        // decodifica para texto UTF-8 e faz o parse do JSON.
        const rawRecipients = campaign.get('recipients') || []
        const bytes = []
        for (const r0 of rawRecipients) {
          if (typeof r0 === 'number') bytes.push(r0)
          else if (typeof r0 === 'string') bytes.push(r0)
        }
        let txt = null
        if (bytes.length > 0) {
          if (bytes.every((b) => typeof b === 'number')) {
            txt = new TextDecoder().decode(new Uint8Array(bytes))
          } else {
            txt = bytes.join('')
          }
        }
        let list = []
        try {
          list = JSON.parse(txt || '[]')
        } catch (_) {
          list = []
        }
        if (!Array.isArray(list)) list = []
        if (list.length === 0) {
          return e.json(400, { ok: false, error: 'Campanha sem destinatários' })
        }

        const recCol = $app.findCollectionByNameOrId('campaign_recipients')
        let created = 0
        for (const r of list) {
          if (!r || typeof r !== 'object') continue
          const emailNorm = String(r.email || '')
            .toLowerCase()
            .trim()
          if (!emailNorm) continue
          const p = new Record(recCol)
          p.set('campaign_id', String(campaignId))
          p.set('email', emailNorm)
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
      } catch (errSend) {
        return e.json(500, { ok: false, error: 'SEND falhou: ' + String(errSend) })
      }
    }

    return e.json(400, { ok: false, error: 'Ação desconhecida' })
  },
  $apis.requireAuth(),
)
