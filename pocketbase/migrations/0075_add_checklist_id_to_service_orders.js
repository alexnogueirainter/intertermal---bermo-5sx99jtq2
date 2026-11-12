/// <reference path="../pb_data/types.d.ts" />
// 0075 — Vínculo da OS com o checklist (relation opcional).
// Altera SOMENTE service_orders: campo checklist_id (relation -> os_checklists).
// A OS sabe qual checklist a executa; o checklist sabe de qual OS nasce.
// Nenhum outro campo é tocado.
migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('service_orders')
    let hasField = false
    try {
      hasField = !!col.fields.getByName('checklist_id')
    } catch (_) {
      hasField = false
    }
    if (!hasField) {
      col.fields.add(
        new RelationField({
          name: 'checklist_id',
          collectionId: app.findCollectionByNameOrId('os_checklists').id,
          cascadeDelete: false,
          maxSelect: 1,
          minSelect: 0,
          required: false,
          presentable: false,
        }),
      )
      app.save(col)
    }
  },
  (app) => {
    const col = app.findCollectionByNameOrId('service_orders')
    try {
      const f = col.fields.getByName('checklist_id')
      col.fields.removeByName('checklist_id')
      app.save(col)
    } catch (_) {}
  },
)
