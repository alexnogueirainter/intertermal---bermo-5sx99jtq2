/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('os_execution_reports')

    if (!col.fields.getByName('photos')) {
      col.fields.add(
        new FileField({
          name: 'photos',
          maxSelect: 12,
          maxSize: 15 * 1024 * 1024, // 15MB por foto
          mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'],
          protected: false,
        }),
      )
    }

    if (!col.fields.getByName('photos_meta')) {
      col.fields.add(
        new JSONField({
          name: 'photos_meta',
          maxSize: 1048576, // 1MB para metadados/legendas
        }),
      )
    }

    app.save(col)
  },
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('os_execution_reports')
      if (col.fields.getByName('photos')) {
        col.fields.removeByName('photos')
      }
      if (col.fields.getByName('photos_meta')) {
        col.fields.removeByName('photos_meta')
      }
      app.save(col)
    } catch (_) {}
  },
)
