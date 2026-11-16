// pocketbase/hooks/proposal_import.js
// Importação de proposta recebida (modelo PI) — Alex, 16/11.
// POST /backend/v1/proposals/import (autenticado), multipart/form-data:
//   action=extract: campo "file" (PDF). Converte com $documents.toMarkdown e extrai
//     os dados com $ai.chat (modelo fast). NÃO grava nada — devolve JSON para revisão.
//   action=commit : campo "file" (PDF) + campo "payload" (JSON revisado na tela).
//     Grava cliente (match por CNPJ), proposta (nº PI preservado), deal no funil
//     e anexa o PDF. Follow-up: follow_up_date = hoje -> o cron quote_followup_cobranca
//     cria a cobrança em D+5. Nada é enviado ao cliente por este hook.

routerAdd(
  'POST',
  '/backend/v1/proposals/import',
  (e) => {
    const body = e.requestInfo().body || {}
    const action = String(body.action || 'extract')
    const files = e.findUploadedFiles('file')

    if (action === 'extract') {
      if (!files || files.length === 0) {
        throw new BadRequestError('Anexe o PDF da proposta no campo "file".')
      }
      let markdown = ''
      let truncated = false
      try {
        const conv = $documents.toMarkdown({ file: files[0] })
        markdown = String(conv.markdown || '')
        truncated = Boolean(conv.truncated)
      } catch (err) {
        if (err && err.status === 422) {
          throw new BadRequestError('Não consegui ler o PDF: ' + err.message)
        }
        throw err
      }
      if (!markdown.trim()) {
        throw new BadRequestError(
          'O PDF não tem texto legível (possivelmente escaneado). Cadastre manualmente.',
        )
      }

      const prompt =
        'Você é o extrator de propostas técnico-comerciais da INTERPROJECT (modelo "PI").\n' +
        'Abaixo está o texto (Markdown) de uma proposta em PDF. Extraia os dados e responda SOMENTE um JSON válido:\n' +
        '{"client":{"name","document","contact_name","contact_email","contact_phone","contact_mobile","city","state","segment","notes"},' +
        '"proposal":{"quote_number","title","issue_date","total","optional_items":[{"code","description","value"}],"payment_terms","validity_days","valid_until","scope_summary","delivery_weeks"},' +
        '"deal":{"suggested_title","priority"},"warnings":["..."]}\n' +
        'Regras: valores em reais como número sem símbolo (ex.: 2119000.00); datas em YYYY-MM-DD; NUNCA invente — campo vazio quando não achar;\n' +
        'preserve o número da proposta EXATAMENTE como escrito (ex.: PI-26229P); optional_items = itens opcionais FORA do valor total;\n' +
        'priority = "high" para ticket alto, "medium" padrão; warnings = inconsistências do documento (ex.: CNPJ inconsistente, validade vencida).\n\n' +
        'TEXTO DA PROPOSTA:\n' +
        markdown.slice(0, 60000)

      let data = null
      let method = 'ai'
      try {
        const reply = $ai.chat({
          model: 'fast',
          messages: [
            {
              role: 'system',
              content: 'Responda somente com um JSON válido, sem markdown e sem texto adicional.',
            },
            { role: 'user', content: prompt },
          ],
        })
        const raw = String(reply.choices?.[0]?.message?.content || '')
        const m = raw.match(/\{[\s\S]*\}/)
        if (m) data = JSON.parse(m[0])
      } catch (errAi) {
        console.warn('[import-proposta] $ai.chat falhou:', errAi.message || errAi)
        method = 'regex'
      }
      if (!data || typeof data !== 'object') data = {}
      if (!data.client) data.client = {}
      if (!data.proposal) data.proposal = {}
      if (!data.deal) data.deal = {}
      if (!Array.isArray(data.warnings)) data.warnings = []

      // Reforço determinístico (regex) — só preenche o que a IA deixou vazio
      const fill = (cur, next) => {
        const v = String(next || '').trim()
        return !String(cur || '').trim() && v ? v : cur
      }
      const numMatch = markdown.match(/\bPI[-\s]?(\d{2,6})\s?-?\s?([A-Z])\b/i)
      if (numMatch) {
        data.proposal.quote_number = fill(
          data.proposal.quote_number,
          'PI-' + numMatch[1] + (numMatch[2] || '').toUpperCase(),
        )
      }
      const cnpjs = markdown.match(/\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}/g) || []
      const clientCnpj = cnpjs.find((c) => c.replace(/\D+/g, '') !== '19122400000106')
      data.client.document = fill(data.client.document, clientCnpj || '')
      const emails = markdown.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || []
      const contactEmail = emails.find((m2) => !/interproject\.com\.br$/i.test(m2))
      data.client.contact_email = fill(data.client.contact_email, contactEmail || '')
      // Valor total: vários padrões de layout (o modelo PI varia entre propostas)
      const toNum = (s) => Number(String(s).replace(/\./g, '').replace(',', '.')) || 0
      const totalPatterns = [
        /Valor Total do Investimento\s*\*{0,2}\s*R\$\s*([\d.]+,\d{2})/,
        /Valor Total[^\n]{0,80}?R\$\s*([\d.]+,\d{2})/,
        /Total do Investimento[^\n]{0,80}?R\$\s*([\d.]+,\d{2})/,
        /(?:^|\n)[^\n]{0,60}TOTAL GERAL[^\n]{0,60}?R\$\s*([\d.]+,\d{2})/,
        /(?:^|\n)[^\n]{0,60}Valor Global[^\n]{0,60}?R\$\s*([\d.]+,\d{2})/,
      ]
      if (!toNum(data.proposal.total)) {
        for (const p of totalPatterns) {
          const tm = markdown.match(p)
          if (tm && toNum(tm[1]) > 0) {
            data.proposal.total = toNum(tm[1])
            break
          }
        }
      }
      // Último recurso: maior valor monetário do documento (em propostas de 1 item,
      // o maior valor é o preço do fornecimento; opcionais são menores)
      if (!toNum(data.proposal.total)) {
        const allVals = [...markdown.matchAll(/R\$\s*([\d.]+,\d{2})/g)].map((mm) => toNum(mm[1]))
        if (allVals.length > 0) {
          const maior = Math.max(...allVals)
          if (maior > 0) {
            data.proposal.total = maior
            if (!Array.isArray(data.warnings)) data.warnings = []
            data.warnings.push(
              'Valor total estimado pelo maior valor monetário do PDF — confira na revisão.',
            )
          }
        }
      }
      // Aviso quando o valor não vier
      if (!toNum(data.proposal.total)) {
        if (!Array.isArray(data.warnings)) data.warnings = []
        data.warnings.push('VALOR TOTAL não identificado no PDF — preencha manualmente na revisão.')
      }
      // Aviso quando o número da proposta não vier
      if (!String(data.proposal.quote_number || '').trim()) {
        if (!Array.isArray(data.warnings)) data.warnings = []
        data.warnings.push('NÚMERO da proposta não identificado — preencha manualmente na revisão.')
      }
      const validadeMatch = markdown.match(/Validade desta proposta:\s*([^\n*]+)/)
      if (validadeMatch) {
        data.warnings.push('Validade informada no PDF: ' + validadeMatch[1].trim())
      }

      return e.json(200, { success: true, extraction_method: method, truncated, data })
    }

    // ===== action=commit =====
    return commitImport(e, body, files)

    // Declarada DENTRO do callback: o JSVM não expõe declarações top-level aos callbacks.
    function commitImport(e, body, files) {
      const payloadRaw = String(body.payload || '')
      if (!payloadRaw)
        throw new BadRequestError('Envie o payload revisado (JSON) no campo "payload".')
      let payload
      try {
        payload = JSON.parse(payloadRaw)
      } catch (_) {
        throw new BadRequestError('Payload JSON inválido.')
      }
      const client = payload.client || {}
      const proposal = payload.proposal || {}
      const deal = payload.deal || {}

      const nowIso = new Date().toISOString()
      const hoje = new Date()
      const d5 = new Date(hoje.getTime() + 5 * 86400000)
      // JSVM (goja) não suporta toLocaleString com locale — formatar na mão
      const pad2 = (n) => String(n).padStart(2, '0')
      const fmtBR = (d) =>
        pad2(d.getUTCDate()) + '/' + pad2(d.getUTCMonth() + 1) + '/' + d.getUTCFullYear()
      const fmtBRL = (n) =>
        'R$ ' +
        n
          .toFixed(2)
          .replace('.', ',')
          .replace(/\B(?=(\d{3})+(?!\d))/g, '.')

      // ---- 1. Cliente: match por CNPJ (client_document), depois por nome ----
      let clientRecord = null
      const docClean = String(client.document || '').replace(/\D+/g, '')
      const nameClean = String(client.name || '').trim()
      if (docClean) {
        try {
          const all = $app.findRecordsByFilter('clients', 'id != ""', '-created', 10000, 0)
          for (const c of all) {
            const cDoc = String(c.get('document') || '').replace(/\D+/g, '')
            if (cDoc && cDoc === docClean) {
              clientRecord = c
              break
            }
          }
        } catch (_) {}
      }
      if (!clientRecord && nameClean) {
        try {
          const found = $app.findRecordsByFilter(
            'clients',
            `name ~ "${nameClean}" || company_name ~ "${nameClean}"`,
            '-created',
            1,
            0,
          )
          if (found && found.length > 0) clientRecord = found[0]
        } catch (_) {}
      }

      let createdClient = false
      if (!clientRecord) {
        const colClients = $app.findCollectionByNameOrId('clients')
        clientRecord = new Record(colClients)
        clientRecord.set('name', nameClean || 'Cliente (proposta importada)')
        clientRecord.set('company_name', nameClean || '')
        if (docClean) clientRecord.set('document', docClean)
        if (client.email) clientRecord.set('email', String(client.email).trim().toLowerCase())
        if (client.contact_phone) clientRecord.set('phone', String(client.contact_phone).trim())
        if (client.contact_mobile)
          clientRecord.set('whatsapp', String(client.contact_mobile).trim())
        if (client.city) clientRecord.set('city', String(client.city).trim())
        if (client.state) clientRecord.set('state', String(client.state).trim())
        if (client.segment) clientRecord.set('segment', String(client.segment).trim())
        clientRecord.set('status', 'prospect')
        clientRecord.set(
          'notes',
          'Cadastrado via importação de proposta em ' +
            fmtBR(hoje) +
            (client.notes ? ' — ' + client.notes : ''),
        )
        const contacts = []
        if (client.contact_name) {
          contacts.push({
            name: String(client.contact_name).trim(),
            email: String(client.contact_email || '').trim(),
            phone: String(client.contact_phone || client.contact_mobile || '').trim(),
            is_primary: true,
          })
        }
        if (contacts.length > 0) clientRecord.set('contacts', contacts)
        $app.save(clientRecord)
        createdClient = true
      } else if (client.contact_name) {
        // Cliente existente: soma o contato se ainda não existir
        try {
          const existing = clientRecord.get('contacts')
          const list = Array.isArray(existing) ? existing : []
          const novoEmail = String(client.contact_email || '')
            .trim()
            .toLowerCase()
          const already = list.some(
            (c) => String(c?.email || '').toLowerCase() === novoEmail && novoEmail !== '',
          )
          if (!already) {
            list.push({
              name: String(client.contact_name).trim(),
              email: novoEmail,
              phone: String(client.contact_phone || client.contact_mobile || '').trim(),
              is_primary: list.length === 0,
            })
            clientRecord.set('contacts', list)
            $app.save(clientRecord)
          }
        } catch (_) {}
      }

      // ---- 2. Proposta: número preservado; colisão -> sufixo -R2/-R3 ----
      let quoteNumber = String(proposal.quote_number || '').trim()
      if (!quoteNumber) quoteNumber = 'IMP-' + Date.now().toString().slice(-6)
      const colQuotes = $app.findCollectionByNameOrId('quotes')
      let numberAdjusted = false
      for (let attempt = 2; attempt < 10; attempt++) {
        try {
          $app.findFirstRecordByFilter('quotes', 'quote_number = {:n}', { n: quoteNumber })
          quoteNumber = quoteNumber + '-R' + attempt
          numberAdjusted = true
        } catch (_) {
          break
        }
      }

      const totalNum =
        Number(
          String(proposal.total || '0')
            .replace(/\./g, '')
            .replace(',', '.'),
        ) || 0
      const optionalItems = Array.isArray(proposal.optional_items) ? proposal.optional_items : []
      const optionalTotal = optionalItems.reduce(
        (acc, it) =>
          acc +
          (Number(
            String(it.value || '0')
              .replace(/\./g, '')
              .replace(',', '.'),
          ) || 0),
        0,
      )

      const quoteRec = new Record(colQuotes)
      quoteRec.set('quote_number', quoteNumber)
      quoteRec.set('code', quoteNumber)
      quoteRec.set('title', String(proposal.title || 'Proposta importada').trim())
      quoteRec.set('client_id', clientRecord.id)
      quoteRec.set('client_name', String(clientRecord.get('name') || nameClean))
      if (docClean) quoteRec.set('client_document', docClean)
      quoteRec.set('status', 'sent') // regra dos 3 momentos: enviada -> deal em 'proposal' (60%)
      quoteRec.set('total', totalNum)
      quoteRec.set('subtotal', totalNum)
      quoteRec.set('final_price', totalNum)
      quoteRec.set('payment_terms', String(proposal.payment_terms || '').trim())
      quoteRec.set('payment_conditions', 'custom')
      if (proposal.valid_until) quoteRec.set('valid_until', String(proposal.valid_until))
      quoteRec.set('validity_days', Number(proposal.validity_days) || 30)
      if (proposal.scope_summary) {
        quoteRec.set('scope_of_work', String(proposal.scope_summary).slice(0, 4000))
      }
      quoteRec.set(
        'items',
        optionalItems.map((it, i) => ({
          id: 'opt-' + (i + 1),
          name: String(it.description || it.code || 'Item opcional').slice(0, 300),
          quantity: 1,
          unit_price:
            Number(
              String(it.value || '0')
                .replace(/\./g, '')
                .replace(',', '.'),
            ) || 0,
          discount: 0,
          total:
            Number(
              String(it.value || '0')
                .replace(/\./g, '')
                .replace(',', '.'),
            ) || 0,
          opcional: true,
        })),
      )
      // Follow-up: âncora = hoje -> cron de cobrança cria a atividade em D+5 dias corridos.
      quoteRec.set('follow_up_date', nowIso)
      quoteRec.set(
        'notes',
        '[PROPOSTA IMPORTADA — MODELO PI]\n' +
          'Importada em ' +
          hoje.toLocaleString('pt-BR') +
          ' por Alex Nogueira.\n' +
          (optionalTotal > 0
            ? 'Itens opcionais fora do total: R$ ' + fmtBRL(optionalTotal) + '\n'
            : '') +
          (proposal.delivery_weeks
            ? 'Prazo de entrega informado: ' + proposal.delivery_weeks + '\n'
            : '') +
          (Array.isArray(payload.warnings) && payload.warnings.length > 0
            ? 'Avisos da extração: ' + payload.warnings.join(' | ') + '\n'
            : ''),
      )
      quoteRec.set(
        'service_details',
        Object.assign({}, payload.service_details || {}, {
          importacao: {
            origem: 'upload_manual_pdf',
            importado_em: nowIso,
            numero_original: String(proposal.quote_number || ''),
            numero_ajustado: numberAdjusted,
            avisos: Array.isArray(payload.warnings) ? payload.warnings : [],
          },
        }),
      )
      quoteRec.set('assigned_to', 'Alex Nogueira')

      // Anexo do PDF original
      if (files && files.length > 0) {
        try {
          quoteRec.set('pdf_file', files[0])
        } catch (errFile) {
          console.warn('[import-proposta] falha ao anexar PDF:', errFile.message || errFile)
        }
      }
      $app.save(quoteRec)

      // ---- 3. Deal no funil (título legível, não o padrão do sync) ----
      const colDeals = $app.findCollectionByNameOrId('deals')
      const dealTitle = String(deal.title || '').trim()
      const dealRec = new Record(colDeals)
      dealRec.set(
        'title',
        dealTitle || quoteNumber + ' — ' + String(clientRecord.get('name') || nameClean),
      )
      dealRec.set('client_id', clientRecord.id)
      dealRec.set('client_name', String(clientRecord.get('name') || nameClean))
      dealRec.set('value', totalNum)
      dealRec.set('stage', 'proposal')
      dealRec.set('probability', 60)
      dealRec.set(
        'priority',
        ['low', 'medium', 'high', 'urgent'].includes(deal.priority) ? deal.priority : 'medium',
      )
      if (proposal.valid_until) dealRec.set('expected_close_date', String(proposal.valid_until))
      dealRec.set('assigned_to', 'Alex Nogueira')
      dealRec.set(
        'notes',
        'Proposta ' + quoteNumber + ' importada (modelo PI) e conectada ao pipeline.',
      )
      $app.save(dealRec)

      // Vincula deal na proposta
      try {
        quoteRec.set('deal_id', dealRec.id)
        $app.save(quoteRec)
      } catch (_) {}

      // ---- 4. Atividade de contexto (visível no painel, sem cobrar nada ainda) ----
      try {
        const colAct = $app.findCollectionByNameOrId('activities')
        const act = new Record(colAct)
        act.set('title', 'Proposta ' + quoteNumber + ' importada')
        act.set('type', 'task')
        act.set('status', 'completed')
        act.set('priority', 'medium')
        act.set('due_date', nowIso)
        act.set('client_id', clientRecord.id)
        act.set('client_name', String(clientRecord.get('name') || nameClean))
        act.set('assigned_to', 'Alex Nogueira')
        act.set(
          'description',
          'Proposta importada e registrada no CRM. Cobrança automática em ' +
            fmtBR(d5) +
            ' (5 dias corridos) se continuar sem resposta.',
        )
        $app.save(act)
      } catch (_) {}

      return e.json(200, {
        success: true,
        quote_id: quoteRec.id,
        quote_number: quoteNumber,
        number_adjusted: numberAdjusted,
        client_id: clientRecord.id,
        client_created: createdClient,
        deal_id: dealRec.id,
        follow_up_date: d5.toISOString().slice(0, 10),
      })
    }
  },
  $apis.requireAuth(),
)
