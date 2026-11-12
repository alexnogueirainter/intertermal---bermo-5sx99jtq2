/// <reference path="../pb_data/types.d.ts" />
// Migração 0076: campo parts (JSON) em os_checklists — peças e materiais
// lançados pelo técnico no checklist, com custo unitário opcional.
// Sem custo informado, a peça NÃO entra no custo real da OS (regra: não inventar número).
migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('os_checklists')
    if (!col.fields.getByName('parts')) {
      col.fields.add(
        new JSONField({
          name: 'parts',
          required: false,
          maxSize: 500000,
        }),
      )
      app.save(col)
    }
  },
  (app) => {
    const col = app.findCollectionByNameOrId('os_checklists')
    const f = col.fields.getByName('parts')
    if (f) {
      col.fields.removeByName('parts')
      app.save(col)
    }
  },
)
