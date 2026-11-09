/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('activities')

    // Cobrança de proposta (Alex, 09/11): atividade "Cobrar cliente" criada
    // automaticamente quando a proposta fica 5 dias em "Enviada" sem resposta.
    // quote_cobranca = id da proposta (idempotência e cancelamento automático);
    // quote_number = número da proposta (mensagem do WhatsApp);
    // quote_contact = nome do contato do cliente (mensagem do WhatsApp).
    for (const name of ['quote_cobranca', 'quote_number', 'quote_contact']) {
      if (!col.fields.getByName(name)) {
        col.fields.add(new TextField({ name }))
      }
    }

    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('activities')
    for (const name of ['quote_cobranca', 'quote_number', 'quote_contact']) {
      const f = col.fields.getByName(name)
      if (f) {
        col.fields.removeByName(name)
      }
    }
    app.save(col)
  },
)
