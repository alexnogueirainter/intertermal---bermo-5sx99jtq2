/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    // Coleção email_log: histórico de envios de e-mail de propostas
    // (para quem, quando, resultado) — exibido na proposta na hora do envio.
    try {
      app.findCollectionByNameOrId('email_log')
    } catch (_) {
      const collection = new Collection({
        name: 'email_log',
        type: 'base',
        listRule: '',
        viewRule: '',
        createRule: '',
        updateRule: '',
        deleteRule: '',
        fields: [
          { name: 'quote_id', type: 'text', required: true },
          { name: 'quote_number', type: 'text' },
          { name: 'to_emails', type: 'text' },
          { name: 'status', type: 'text' }, // sent | failed
          { name: 'error_message', type: 'text' },
          { name: 'method', type: 'text' }, // resend
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        ],
        indexes: ['CREATE INDEX idx_email_log_quote ON email_log (quote_id)'],
      })
      app.save(collection)
    }
  },
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('email_log')
      app.delete(col)
    } catch (_) {}
  },
)
