migrate(
  (app) => {
    const quotesCol = app.findCollectionByNameOrId('quotes')

    if (!quotesCol.fields.getByName('integration_needed')) {
      quotesCol.fields.add(new BoolField({ name: 'integration_needed' }))
    }
    if (!quotesCol.fields.getByName('integration_day')) {
      quotesCol.fields.add(new TextField({ name: 'integration_day' }))
    }
    if (!quotesCol.fields.getByName('integration_type')) {
      quotesCol.fields.add(new TextField({ name: 'integration_type' }))
    }
    if (!quotesCol.fields.getByName('work_permit_needed')) {
      quotesCol.fields.add(new BoolField({ name: 'work_permit_needed' }))
    }
    if (!quotesCol.fields.getByName('work_permit_time')) {
      quotesCol.fields.add(new TextField({ name: 'work_permit_time' }))
    }
    if (!quotesCol.fields.getByName('overnight_needed')) {
      quotesCol.fields.add(new BoolField({ name: 'overnight_needed' }))
    }

    app.save(quotesCol)
  },
  (app) => {},
)
