/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    // Garantir que a coleção inbound_quote_attachments aceite todos os tipos de arquivos comuns de cotação (.docx, .xlsx, .csv, laudos, pdfs, imagens) sem restrição indevida
    try {
      const attachmentsCol = app.findCollectionByNameOrId('inbound_quote_attachments')
      const fileField = attachmentsCol.fields.getByName('file')
      if (fileField) {
        // Garantir que maxSize seja no mínimo 25MB e sem restrição restritiva de mimeTypes
        fileField.maxSize = 25 * 1024 * 1024
        // Deixar mimeTypes vazio ou com lista ampla para aceitar .docx, .doc, .xlsx, .xls, .csv, .pdf, imagens e binários
        fileField.mimeTypes = []
        app.save(attachmentsCol)
      }
    } catch (err) {
      console.warn(
        'Migração 0018: coleção inbound_quote_attachments não encontrada ou já atualizada:',
        err,
      )
    }
  },
  (app) => {
    // Reverter não é estritamente necessário para relaxamento de restrição
  },
)
