/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    // 1) Coleção field_visit_media: arquivos (fotos/vídeos/áudios) da Visita a Campo
    //    guardados como FILE no servidor — o celular guarda só a referência.
    try {
      app.findCollectionByNameOrId('field_visit_media')
    } catch (_) {
      const collection = new Collection({
        name: 'field_visit_media',
        type: 'base',
        listRule: '',
        viewRule: '',
        createRule: '',
        updateRule: '',
        deleteRule: '',
        fields: [
          { name: 'client_media_id', type: 'text', required: true }, // id gerado no celular (idempotência)
          { name: 'kind', type: 'text' }, // image | video | audio
          { name: 'original_name', type: 'text' },
          { name: 'size', type: 'number' },
          { name: 'client_visit_id', type: 'text' }, // visita do celular à qual o arquivo pertence
          { name: 'seller_token', type: 'text' }, // token do vendedor (modo link seguro)
          { name: 'file', type: 'file', required: true, maxSize: 52428800, maxSelect: 1 },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE UNIQUE INDEX idx_field_visit_media_client_id ON field_visit_media (client_media_id)',
          'CREATE INDEX idx_field_visit_media_visit ON field_visit_media (client_visit_id)',
        ],
      })
      app.save(collection)
    }

    // 2) Campo visit_attachments (JSON) em field_visits: referências dos anexos gerais
    const col = app.findCollectionByNameOrId('field_visits')
    if (!col.fields.getByName('visit_attachments')) {
      col.fields.add(
        new JSONField({
          name: 'visit_attachments',
          required: false,
          maxSize: 15728640,
        }),
      )
      app.save(col)
    }
  },
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('field_visit_media')
      app.delete(col)
    } catch (_) {}
    try {
      const col = app.findCollectionByNameOrId('field_visits')
      const f = col.fields.getByName('visit_attachments')
      if (f) {
        col.fields.removeByName('visit_attachments')
        app.save(col)
      }
    } catch (_) {}
  },
)
