migrate(
  (app) => {
    // 1. Carregar coleções
    const quotesCol = app.findCollectionByNameOrId('quotes')
    const dealsCol = app.findCollectionByNameOrId('deals')

    // 2. Buscar todas as propostas existentes
    let quotes = []
    try {
      quotes = app.findRecordsByFilter('quotes', 'id != ""', '-created', 200, 0)
    } catch (e) {
      console.log('Nenhuma proposta encontrada ou erro na busca:', e)
      return
    }

    for (let i = 0; i < quotes.length; i++) {
      const q = quotes[i]
      const quoteId = q.id
      const quoteCode = q.getString('code') || q.getString('quote_number') || `PROP-${quoteId}`
      const clientName = q.getString('client_name') || 'Cliente Não Identificado'
      const clientId = q.getString('client_id') || ''
      const status = (q.getString('status') || 'draft').toLowerCase().trim()
      const assignedTo = q.getString('assigned_to') || 'Alex Nogueira'

      // Determinar valor real da proposta
      let quoteValue = q.getFloat('total')
      if (!quoteValue || quoteValue <= 0) {
        quoteValue = q.getFloat('final_price')
      }
      if (!quoteValue || quoteValue <= 0) {
        quoteValue = q.getFloat('subtotal')
      }
      if (!quoteValue || quoteValue <= 0) {
        quoteValue = q.getFloat('total_cost')
      }
      if (!quoteValue || quoteValue <= 0) {
        quoteValue = 0
      }

      // Mapear status -> DealStage:
      // draft -> proposal (ou negotiation)
      // sent / enviada -> proposal
      // pending_approval -> negotiation
      // approved / aprovada -> won
      // rejected / recusada -> lost
      // expired -> lost
      let stage = 'proposal'
      let probability = 50
      if (status === 'draft') {
        stage = 'proposal'
        probability = 40
      } else if (status === 'sent' || status === 'enviada') {
        stage = 'proposal'
        probability = 60
      } else if (status === 'pending_approval' || status === 'pending') {
        stage = 'negotiation'
        probability = 75
      } else if (status === 'approved' || status === 'aprovada' || status === 'aprovado') {
        stage = 'won'
        probability = 100
      } else if (
        status === 'rejected' ||
        status === 'recusada' ||
        status === 'recusado' ||
        status === 'expired'
      ) {
        stage = 'lost'
        probability = 0
      }

      const dealTitle = `Proposta ${quoteCode} — ${clientName}`

      // Verificar se já tem deal_id válido
      let existingDeal = null
      const currentDealId = q.getString('deal_id')
      if (currentDealId) {
        try {
          existingDeal = app.findFirstRecordByData('deals', 'id', currentDealId)
        } catch (_) {}
      }

      // Se não encontrou pelo ID direto, tentar por título contendo quoteCode
      if (!existingDeal) {
        try {
          const matchingDeals = app.findRecordsByFilter(
            'deals',
            `title ~ "${quoteCode}"`,
            '-created',
            1,
            0,
          )
          if (matchingDeals && matchingDeals.length > 0) {
            existingDeal = matchingDeals[0]
          }
        } catch (_) {}
      }

      if (existingDeal) {
        // Atualizar negócio existente
        existingDeal.set('title', dealTitle)
        if (clientId) existingDeal.set('client_id', clientId)
        existingDeal.set('client_name', clientName)
        existingDeal.set('value', quoteValue)
        existingDeal.set('stage', stage)
        existingDeal.set('probability', probability)
        if (assignedTo) existingDeal.set('assigned_to', assignedTo)
        existingDeal.set(
          'notes',
          `Proposta Intertermal ${quoteCode} conectada automaticamente ao pipeline.`,
        )
        app.save(existingDeal)

        // Se quotes.deal_id estiver vazio ou diferente, vinculá-lo
        if (q.getString('deal_id') !== existingDeal.id) {
          q.set('deal_id', existingDeal.id)
          app.save(q)
        }
      } else {
        // Criar novo negócio na coleção deals
        const newDeal = new Record(dealsCol)
        newDeal.set('title', dealTitle)
        if (clientId) newDeal.set('client_id', clientId)
        newDeal.set('client_name', clientName)
        newDeal.set('value', quoteValue)
        newDeal.set('stage', stage)
        newDeal.set('probability', probability)
        newDeal.set('priority', 'medium')
        newDeal.set('assigned_to', assignedTo)
        newDeal.set(
          'notes',
          `Proposta Intertermal ${quoteCode} gerada e conectada automaticamente ao pipeline comercial.`,
        )
        app.save(newDeal)

        // Vincular negócio recém-criado de volta na proposta
        q.set('deal_id', newDeal.id)
        app.save(q)
      }
    }
  },
  (app) => {
    // Reversão opcional (não destrói dados de deals criados)
  },
)
