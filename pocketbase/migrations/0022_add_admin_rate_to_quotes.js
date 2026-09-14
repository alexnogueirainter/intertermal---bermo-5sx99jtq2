migrate(
  (app) => {
    const quotesCol = app.findCollectionByNameOrId('quotes')

    // Campo admin_rate na coleção quotes para persistência do Overhead Administrativo
    if (!quotesCol.fields.getByName('admin_rate')) {
      quotesCol.fields.add(new NumberField({ name: 'admin_rate', min: 0, max: 100 }))
    }

    app.save(quotesCol)
  },
  () => {
    // down vazio conforme orientação
  },
)
