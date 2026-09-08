migrate(
  (app) => {
    const quotesCol = app.findCollectionByNameOrId('quotes')

    // Campo de arquivo para armazenar o PDF gerado da proposta
    if (!quotesCol.fields.getByName('pdf_file')) {
      quotesCol.fields.add(
        new FileField({
          name: 'pdf_file',
          maxSelect: 1,
          maxSize: 15 * 1024 * 1024, // 15MB
          mimeTypes: ['application/pdf'],
          protected: false,
        }),
      )
      app.save(quotesCol)
    }
  },
  (app) => {
    const quotesCol = app.findCollectionByNameOrId('quotes')
    const field = quotesCol.fields.getByName('pdf_file')
    if (field) {
      quotesCol.fields.removeByName('pdf_file')
      app.save(quotesCol)
    }
  },
)
