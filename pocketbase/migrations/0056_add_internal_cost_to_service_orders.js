/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('service_orders')
    if (!col.fields.getByName('internal_cost')) {
      col.fields.add(
        new NumberField({
          name: 'internal_cost',
          required: false,
          onlyInt: false,
        }),
      )
      app.save(col)
    }
  },
  (app) => {
    const col = app.findCollectionByNameOrId('service_orders')
    const f = col.fields.getByName('internal_cost')
    if (f) {
      col.fields.removeByName('internal_cost')
      app.save(col)
    }
  },
)
