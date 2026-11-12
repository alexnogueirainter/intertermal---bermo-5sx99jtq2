/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    // Coleção campaign_attachments: anexos da campanha (o mesmo arquivo sai em
    // todos os e-mails da lista) e do modelo (template_id — reaproveitável).
    // Coleção SEPARADA — não mexe na campaigns existente. Os ids são TEXT
    // (relation não remapeia collectionId — padrão já provado nas 0067/0069).
    try {
      app.findCollectionByNameOrId('campaign_attachments')
    } catch (_) {
      const collection = new Collection({
        name: 'campaign_attachments',
        type: 'base',
        listRule: '',
        viewRule: '',
        createRule: '',
        updateRule: '',
        deleteRule: '',
        fields: [
          { name: 'campaign_id', type: 'text' }, // id da campanha (vazio quando é anexo de modelo)
          { name: 'template_id', type: 'text' }, // id do modelo (vazio quando é anexo de campanha)
          { name: 'file', type: 'file', required: true, maxSize: 10485760, maxSelect: 1 },
          { name: 'filename', type: 'text' }, // nome original (para o e-mail)
          { name: 'size', type: 'number' }, // bytes
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE INDEX idx_campaign_attachments_campaign ON campaign_attachments (campaign_id)',
          'CREATE INDEX idx_campaign_attachments_template ON campaign_attachments (template_id)',
        ],
      })
      app.save(collection)
    }
  },
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('campaign_attachments')
      app.delete(col)
    } catch (_) {}
  },
)
