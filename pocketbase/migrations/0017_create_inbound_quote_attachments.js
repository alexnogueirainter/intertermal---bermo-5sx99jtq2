/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    const inboundEmailsCol = app.findCollectionByNameOrId('inbound_quote_emails')

    // 1. Criar coleção para anexos vinculados aos e-mails de cotação
    const attachmentsCol = new Collection({
      name: 'inbound_quote_attachments',
      type: 'base',
      listRule: '',
      viewRule: '',
      createRule: '',
      updateRule: '',
      deleteRule: '',
      fields: [
        {
          name: 'inbound_email_id',
          type: 'relation',
          collectionId: inboundEmailsCol.id,
          cascadeDelete: true,
          maxSelect: 1,
          required: true,
        },
        {
          name: 'file',
          type: 'file',
          maxSelect: 1,
          maxSize: 25 * 1024 * 1024, // 25MB
          protected: false,
        },
        { name: 'file_name', type: 'text' },
        { name: 'file_type', type: 'text' },
        { name: 'file_size', type: 'number' },
        {
          name: 'quote_id',
          type: 'relation',
          collectionId: app.findCollectionByNameOrId('quotes').id,
          maxSelect: 1,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_inbound_att_email ON inbound_quote_attachments (inbound_email_id)',
        'CREATE INDEX idx_inbound_att_quote ON inbound_quote_attachments (quote_id)',
        'CREATE INDEX idx_inbound_att_created ON inbound_quote_attachments (created DESC)',
      ],
    })
    app.save(attachmentsCol)
  },
  (app) => {
    try {
      const attachments = app.findCollectionByNameOrId('inbound_quote_attachments')
      app.delete(attachments)
    } catch (_) {}
  },
)
