migrate(
  (app) => {
    const quotesCol = app.findCollectionByNameOrId('quotes')

    // Campo materials_items (JSON) na coleção quotes para lista de peças/itens de materiais
    if (!quotesCol.fields.getByName('materials_items')) {
      quotesCol.fields.add(
        new JSONField({ name: 'materials_items', maxSize: 2097152, required: false }),
      )
    }

    app.save(quotesCol)
  },
  () => {
    // down
  },
)
