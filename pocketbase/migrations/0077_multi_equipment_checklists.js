/// <reference path="../pb_data/types.d.ts" />
// Migração 0077: multi-equipamento nos checklists.
// - service_orders.equipment_items (JSON): lista oficial dos itens a trabalhar,
//   copiada da proposta aprovada (equipments[]) pelo sync.
// - os_checklists.equipment_tag (text): TAG do equipamento deste checklist.
// - os_checklists.equipment_label (text): rótulo curto na aba ("Trocador 1", "Válvula V-101").
migrate(
  (app) => {
    const so = app.findCollectionByNameOrId('service_orders')
    if (!so.fields.getByName('equipment_items')) {
      so.fields.add(
        new JSONField({
          name: 'equipment_items',
          required: false,
          maxSize: 1000000,
        }),
      )
      app.save(so)
    }

    const cl = app.findCollectionByNameOrId('os_checklists')
    if (!cl.fields.getByName('equipment_tag')) {
      cl.fields.add(new TextField({ name: 'equipment_tag', required: false }))
    }
    if (!cl.fields.getByName('equipment_label')) {
      cl.fields.add(new TextField({ name: 'equipment_label', required: false }))
    }
    app.save(cl)
  },
  (app) => {
    const so = app.findCollectionByNameOrId('service_orders')
    const f = so.fields.getByName('equipment_items')
    if (f) {
      so.fields.removeByName('equipment_items')
      app.save(so)
    }
    const cl = app.findCollectionByNameOrId('os_checklists')
    for (const name of ['equipment_tag', 'equipment_label']) {
      const g = cl.fields.getByName(name)
      if (g) {
        cl.fields.removeByName(name)
      }
    }
    app.save(cl)
  },
)
