migrate(
  (app) => {
    const quotesCol = app.findCollectionByNameOrId('quotes')

    // Campo chemical_products (JSON) na coleção quotes para produtos químicos de limpeza e pintura
    if (!quotesCol.fields.getByName('chemical_products')) {
      quotesCol.fields.add(
        new JSONField({ name: 'chemical_products', maxSize: 2097152, required: false }),
      )
    }

    app.save(quotesCol)
  },
  () => {
    // down
  },
)
