/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    // Coleção campaign_templates: banco de modelos reutilizáveis da tela Campanhas.
    // O Alex cria/edita na tela; o botão "Modelos" lista os registros, agrupados
    // por category (prospecção, follow-up, pós-visita, etc.).
    try {
      app.findCollectionByNameOrId('campaign_templates')
    } catch (_) {
      const collection = new Collection({
        name: 'campaign_templates',
        type: 'base',
        listRule: '',
        viewRule: '',
        createRule: '',
        updateRule: '',
        deleteRule: '',
        fields: [
          { name: 'name', type: 'text', required: true },
          { name: 'category', type: 'text' },
          { name: 'subject', type: 'text', required: true },
          { name: 'body', type: 'text', required: true },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: ['CREATE INDEX idx_campaign_templates_category ON campaign_templates (category)'],
      })
      app.save(collection)
    }
  },
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('campaign_templates')
      app.delete(col)
    } catch (_) {}
  },
)
