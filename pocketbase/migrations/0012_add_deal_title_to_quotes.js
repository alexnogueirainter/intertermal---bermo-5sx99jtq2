migrate(
  (app) => {
    const quotesCol = app.findCollectionByNameOrId('quotes')

    // Campo de texto livre para Oportunidade / Negócio (CRM)
    if (!quotesCol.fields.getByName('deal_title')) {
      quotesCol.fields.add(new TextField({ name: 'deal_title' }))
    }

    app.save(quotesCol)
  },
  (app) => {
    const quotesCol = app.findCollectionByNameOrId('quotes')
    const field = quotesCol.fields.getByName('deal_title')
    if (field) {
      quotesCol.fields.removeByName('deal_title')
      app.save(quotesCol)
    }
  },
)
