/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('quotes')

    if (!col.fields.getByName('title')) {
      col.fields.add(
        new TextField({
          name: 'title',
          required: false,
          max: 300,
        }),
      )
    }

    if (!col.fields.getByName('homologated_procedure')) {
      col.fields.add(
        new TextField({
          name: 'homologated_procedure',
          required: false,
          max: 5000,
        }),
      )
    }

    if (!col.fields.getByName('work_fluid')) {
      col.fields.add(
        new TextField({
          name: 'work_fluid',
          required: false,
          max: 300,
        }),
      )
    }

    if (!col.fields.getByName('client_document')) {
      col.fields.add(
        new TextField({
          name: 'client_document',
          required: false,
          max: 40,
        }),
      )
    }

    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('quotes')
    for (const name of ['title', 'homologated_procedure', 'work_fluid', 'client_document']) {
      const f = col.fields.getByName(name)
      if (f) {
        col.fields.removeByName(name)
      }
    }
    app.save(col)
  },
)
