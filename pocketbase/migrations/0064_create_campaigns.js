/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    // ===== Campanhas de e-mail (tela Comercial > Campanhas) =====

    // 1) Coleção campaigns: modelos de e-mail + destinatários + status
    try {
      app.findCollectionByNameOrId('campaigns')
    } catch (_) {
      const collection = new Collection({
        name: 'campaigns',
        type: 'base',
        listRule: '',
        viewRule: '',
        createRule: '',
        updateRule: '',
        deleteRule: '',
        fields: [
          { name: 'name', type: 'text', required: true },
          { name: 'subject', type: 'text', required: true },
          { name: 'body', type: 'text', required: true }, // texto com {nome} e {empresa}
          { name: 'list_tag', type: 'text' }, // etiqueta de segmentação
          { name: 'recipients', type: 'json', maxSize: 2000000 }, // [{email, name, company}]
          {
            name: 'status',
            type: 'select',
            values: ['draft', 'sending', 'done', 'cancelled'],
            required: true,
          },
          { name: 'daily_limit', type: 'number' }, // padrão 90
          { name: 'sent_count', type: 'number' },
          { name: 'test_sent', type: 'bool' },
          { name: 'created_by', type: 'text' },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: ['CREATE INDEX idx_campaigns_status ON campaigns (status)'],
      })
      app.save(collection)
    }

    // 2) Coleção campaign_recipients: status por destinatário
    try {
      app.findCollectionByNameOrId('campaign_recipients')
    } catch (_) {
      const collection = new Collection({
        name: 'campaign_recipients',
        type: 'base',
        listRule: '',
        viewRule: '',
        createRule: '',
        updateRule: '',
        deleteRule: '',
        fields: [
          { name: 'campaign', type: 'relation', collectionId: 'pbc_612317808', maxSelect: 1 },
          { name: 'client_id', type: 'text' },
          { name: 'email', type: 'text', required: true },
          { name: 'name', type: 'text' },
          { name: 'company', type: 'text' },
          { name: 'resend_id', type: 'text' },
          {
            name: 'status',
            type: 'select',
            values: [
              'pending',
              'sent',
              'delivered',
              'bounced',
              'complained',
              'unsubscribed',
              'failed',
            ],
            required: true,
          },
          { name: 'error', type: 'text' },
          { name: 'sent_at', type: 'date' },
          { name: 'delivered_at', type: 'date' },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE INDEX idx_campaign_recipients_campaign ON campaign_recipients (campaign)',
          'CREATE INDEX idx_campaign_recipients_email ON campaign_recipients (email)',
        ],
      })
      app.save(collection)
    }

    // 3) Coleção unsubscribes: descadastrados ficam fora de TODAS as próximas campanhas
    try {
      app.findCollectionByNameOrId('unsubscribes')
    } catch (_) {
      const collection = new Collection({
        name: 'unsubscribes',
        type: 'base',
        listRule: '',
        viewRule: '',
        createRule: '',
        updateRule: '',
        deleteRule: '',
        fields: [
          { name: 'email', type: 'text', required: true },
          { name: 'reason', type: 'text' },
          { name: 'source', type: 'text' }, // campaign:{id} | webhook:complained
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: ['CREATE UNIQUE INDEX idx_unsubscribes_email ON unsubscribes (email)'],
      })
      app.save(collection)
    }

    // 4) Campos novos em clients: tags já existe; adiciona unsubscribed_at
    const clientsCol = app.findCollectionByNameOrId('clients')
    if (!clientsCol.fields.getByName('unsubscribed_at')) {
      clientsCol.fields.add(new DateField({ name: 'unsubscribed_at' }))
      app.save(clientsCol)
    }

    // 5) Resolves o id real da coleção campaigns e corrige a relation em campaign_recipients
    const campaignsCol = app.findCollectionByNameOrId('campaigns')
    const recCol = app.findCollectionByNameOrId('campaign_recipients')
    const relField = recCol.fields.getByName('campaign')
    if (relField && String(relField.collectionId || '') !== campaignsCol.id) {
      relField.collectionId = campaignsCol.id
      app.save(recCol)
    }

    // 6) Fila pausada por padrão (o Alex decide quando rodar)
    const cronCol = app.findCollectionByNameOrId('_cron_settings')
    let cr = null
    try {
      cr = app.findFirstRecordByFilter('_cron_settings', 'job = {:j}', { j: 'campaigns_queue' })
    } catch (_) {
      cr = null
    }
    if (!cr) {
      cr = new Record(cronCol)
      cr.set('job', 'campaigns_queue')
      cr.set('disabled', true)
      app.save(cr)
    }
  },
  (app) => {
    for (const name of ['campaign_recipients', 'campaigns', 'unsubscribes']) {
      try {
        const col = app.findCollectionByNameOrId(name)
        app.delete(col)
      } catch (_) {}
    }
    try {
      const clientsCol = app.findCollectionByNameOrId('clients')
      const f = clientsCol.fields.getByName('unsubscribed_at')
      if (f) {
        clientsCol.fields.removeByName('unsubscribed_at')
        app.save(clientsCol)
      }
    } catch (_) {}
    try {
      const cr = app.findFirstRecordByFilter('_cron_settings', 'job = {:j}', {
        j: 'campaigns_queue',
      })
      if (cr) app.delete(cr)
    } catch (_) {}
  },
)
