/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('service_orders')

    // Campos de recusa da OS — já enviados pela tela (crm-extras.ts updateStatus)
    // quando o status vai para "rejected"; faltavam na coleção e o PocketBase descartava.
    if (!col.fields.getByName('rejected_at')) {
      col.fields.add(new DateField({ name: 'rejected_at' }))
    }
    if (!col.fields.getByName('rejected_by')) {
      col.fields.add(new TextField({ name: 'rejected_by' }))
    }
    if (!col.fields.getByName('rejection_notes')) {
      col.fields.add(new TextField({ name: 'rejection_notes' }))
    }

    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('service_orders')
    for (const name of ['rejected_at', 'rejected_by', 'rejection_notes']) {
      const f = col.fields.getByName(name)
      if (f) {
        col.fields.removeByName(name)
      }
    }
    app.save(col)
  },
)
