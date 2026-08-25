migrate(
  (app) => {
    // 1. Atualizar coleção 'clients' para ter campo contacts (JSON) caso não exista
    const clientsCol = app.findCollectionByNameOrId('clients')
    if (!clientsCol.fields.getByName('contacts')) {
      clientsCol.fields.add(
        new JSONField({
          name: 'contacts',
          required: false,
          maxSize: 2000000,
        }),
      )
      app.save(clientsCol)
    }

    // 2. Criar ou atualizar coleção 'service_orders'
    let serviceOrdersCol
    try {
      serviceOrdersCol = app.findCollectionByNameOrId('service_orders')
    } catch (_) {
      const usersColId = '_pb_users_auth_'
      const clientsColId = app.findCollectionByNameOrId('clients').id
      const quotesColId = app.findCollectionByNameOrId('quotes').id

      serviceOrdersCol = new Collection({
        name: 'service_orders',
        type: 'base',
        listRule: '',
        viewRule: '',
        createRule: '',
        updateRule: '',
        deleteRule: '',
        fields: [
          { name: 'order_number', type: 'text', required: true },
          { name: 'quote_id', type: 'relation', collectionId: quotesColId, maxSelect: 1 },
          { name: 'quote_number', type: 'text' },
          { name: 'client_id', type: 'relation', collectionId: clientsColId, maxSelect: 1 },
          { name: 'client_name', type: 'text' },
          { name: 'title', type: 'text' },
          {
            name: 'status',
            type: 'select',
            values: [
              'pending_approval',
              'approved',
              'in_progress',
              'completed',
              'rejected',
              'cancelled',
            ],
            maxSelect: 1,
          },
          { name: 'services', type: 'json' },
          { name: 'total_value', type: 'number' },
          {
            name: 'priority',
            type: 'select',
            values: ['low', 'medium', 'high', 'urgent'],
            maxSelect: 1,
          },
          { name: 'assigned_to', type: 'text' },
          { name: 'technical_details', type: 'json' },
          { name: 'approval_notes', type: 'text' },
          { name: 'approved_at', type: 'date' },
          { name: 'approved_by', type: 'text' },
          { name: 'start_date', type: 'date' },
          { name: 'end_date', type: 'date' },
          { name: 'notes', type: 'text' },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE INDEX idx_service_orders_number ON service_orders (order_number)',
          'CREATE INDEX idx_service_orders_status ON service_orders (status)',
          'CREATE INDEX idx_service_orders_client ON service_orders (client_name)',
        ],
      })
      app.save(serviceOrdersCol)
    }

    // 3. Atualizar registros no banco trocando "Alexandre Nogueira" por "Alex Nogueia"
    try {
      app
        .db()
        .newQuery(`
        UPDATE quotes 
        SET assigned_to = REPLACE(assigned_to, 'Alexandre Nogueira', 'Alex Nogueia')
        WHERE assigned_to LIKE '%Alexandre Nogueira%'
      `)
        .execute()
    } catch (_) {}

    try {
      app
        .db()
        .newQuery(`
        UPDATE clients 
        SET assigned_to = REPLACE(assigned_to, 'Alexandre Nogueira', 'Alex Nogueia')
        WHERE assigned_to LIKE '%Alexandre Nogueira%'
      `)
        .execute()
    } catch (_) {}

    try {
      app
        .db()
        .newQuery(`
        UPDATE deals 
        SET assigned_to = REPLACE(assigned_to, 'Alexandre Nogueira', 'Alex Nogueia')
        WHERE assigned_to LIKE '%Alexandre Nogueira%'
      `)
        .execute()
    } catch (_) {}

    try {
      app
        .db()
        .newQuery(`
        UPDATE tickets 
        SET assigned_to = REPLACE(assigned_to, 'Alexandre Nogueira', 'Alex Nogueia')
        WHERE assigned_to LIKE '%Alexandre Nogueira%'
      `)
        .execute()
    } catch (_) {}

    try {
      app
        .db()
        .newQuery(`
        UPDATE services 
        SET assigned_to = REPLACE(assigned_to, 'Alexandre Nogueira', 'Alex Nogueia')
        WHERE assigned_to LIKE '%Alexandre Nogueira%'
      `)
        .execute()
    } catch (_) {}

    try {
      app
        .db()
        .newQuery(`
        UPDATE activities 
        SET assigned_to = REPLACE(assigned_to, 'Alexandre Nogueira', 'Alex Nogueia')
        WHERE assigned_to LIKE '%Alexandre Nogueira%'
      `)
        .execute()
    } catch (_) {}

    // 4. Adicionar contatos padrão de exemplo nos clientes existentes
    try {
      const clientsList = app.findRecordsByFilter('clients', '', '', 10, 0)
      if (clientsList.length > 0) {
        clientsList[0].set('contacts', [
          {
            id: 'c1',
            name: 'Carlos Alberto Schramm',
            birth_date: '1984-05-12',
            role: 'Gerente de Manutenção Industrial',
            phone: '(47) 99882-1122',
            email: 'carlos.schramm@catarinense.com.br',
          },
          {
            id: 'c2',
            name: 'Renata Zimmermann',
            birth_date: '1991-09-28',
            role: 'Engenheira de Processos Térmicos',
            phone: '(47) 99123-4455',
            email: 'renata.z@catarinense.com.br',
          },
        ])
        app.save(clientsList[0])
      }
      if (clientsList.length > 1) {
        clientsList[1].set('contacts', [
          {
            id: 'c3',
            name: 'Eng. Fernando Prado',
            birth_date: '1978-11-03',
            role: 'Coordenador de Utilidades e Caldeiras',
            phone: '(16) 99765-8899',
            email: 'fernando.prado@usinasantamaria.com.br',
          },
        ])
        app.save(clientsList[1])
      }
    } catch (_) {}

    // 5. Se houver quote aprovada (INT-2025-001), criar OS pendente de aprovação como seed
    try {
      const approvedQuotes = app.findRecordsByFilter(
        'quotes',
        'status = "approved"',
        '-created',
        1,
        0,
      )
      if (approvedQuotes.length > 0) {
        const q = approvedQuotes[0]
        const soCol = app.findCollectionByNameOrId('service_orders')
        const so = new Record(soCol)
        so.set('order_number', q.getString('quote_number'))
        so.set('quote_id', q.id)
        so.set('quote_number', q.getString('quote_number'))
        so.set('client_id', q.getString('client_id'))
        so.set('client_name', q.getString('client_name'))
        so.set('title', `OS-${q.getString('quote_number')}: Serviços em Equipamentos BERMO`)
        so.set('status', 'pending_approval')
        so.set('total_value', q.getFloat('total'))
        so.set('priority', 'high')
        so.set('assigned_to', 'Alex Nogueia - Especialista BERMO')
        so.set('services', q.get('items'))
        so.set(
          'notes',
          `Gerada automaticamente da Proposta ${q.getString('quote_number')}. Aguardando aprovação da gerência.`,
        )
        app.save(so)
      }
    } catch (_) {}
  },
  (app) => {
    try {
      const soCol = app.findCollectionByNameOrId('service_orders')
      app.delete(soCol)
    } catch (_) {}
  },
)
