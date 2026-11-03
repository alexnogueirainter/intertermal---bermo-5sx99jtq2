/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('os_execution_reports')
    if (!col.fields.getByName('extra_hours')) {
      col.fields.add(
        new JSONField({
          name: 'extra_hours',
          required: false,
          maxSize: 2000000,
        }),
      )
      app.save(col)
    }
  },
  (app) => {
    const col = app.findCollectionByNameOrId('os_execution_reports')
    const f = col.fields.getByName('extra_hours')
    if (f) {
      col.fields.removeByName('extra_hours')
      app.save(col)
    }
  },
)
