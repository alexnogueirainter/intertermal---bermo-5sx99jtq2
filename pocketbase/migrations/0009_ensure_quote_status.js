migrate(
  (app) => {
    const quotesCol = app.findCollectionByNameOrId('quotes')

    const statusField = quotesCol.fields.getByName('status')
    if (!statusField) {
      quotesCol.fields.add(
        new TextField({
          name: 'status',
          required: false,
        }),
      )
      app.save(quotesCol)
    }

    // Garantir que propostas sem status definido recebam 'draft'
    try {
      app
        .db()
        .newQuery("UPDATE quotes SET status = 'draft' WHERE status IS NULL OR status = ''")
        .execute()
    } catch (_) {}
  },
  (app) => {},
)
