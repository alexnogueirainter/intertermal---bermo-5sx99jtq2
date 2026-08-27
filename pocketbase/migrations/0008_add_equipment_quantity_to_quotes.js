migrate(
  (app) => {
    const quotesCol = app.findCollectionByNameOrId('quotes')

    if (!quotesCol.fields.getByName('equipment_quantity')) {
      quotesCol.fields.add(new NumberField({ name: 'equipment_quantity', min: 1 }))
    }

    app.save(quotesCol)
  },
  (app) => {
    const quotesCol = app.findCollectionByNameOrId('quotes')
    quotesCol.fields.removeByName('equipment_quantity')
    app.save(quotesCol)
  },
)
