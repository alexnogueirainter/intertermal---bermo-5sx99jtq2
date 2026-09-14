migrate(
  (app) => {
    const quotesCol = app.findCollectionByNameOrId('quotes')

    // Campo equipments (JSON) na coleção quotes para persistência de múltiplos equipamentos manuais e do catálogo
    if (!quotesCol.fields.getByName('equipments')) {
      quotesCol.fields.add(new JSONField({ name: 'equipments', maxSize: 2097152 }))
    }

    app.save(quotesCol)
  },
  () => {
    // down
  },
)
