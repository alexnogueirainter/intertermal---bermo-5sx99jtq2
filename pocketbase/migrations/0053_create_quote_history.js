migrate(
  (app) => {
    const quoteCol = app.findCollectionByNameOrId('quotes')

    const collection = new Collection({
      name: 'quote_history',
      type: 'base',
      listRule: '',
      viewRule: '',
      createRule: '',
      updateRule: '',
      deleteRule: '',
      fields: [
        {
          name: 'quote_id',
          type: 'relation',
          required: true,
          collectionId: quoteCol.id,
          cascadeDelete: true,
          maxSelect: 1,
        },
        { name: 'field_name', type: 'text', required: true },
        { name: 'old_value', type: 'text' },
        { name: 'new_value', type: 'text' },
        { name: 'changed_by', type: 'text' },
        { name: 'timestamp', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_quote_history_quote ON quote_history (quote_id)',
        'CREATE INDEX idx_quote_history_created ON quote_history (created DESC)',
      ],
    })

    app.save(collection)
  },
  (app) => {
    try {
      const collection = app.findCollectionByNameOrId('quote_history')
      app.delete(collection)
    } catch (_) {}
  },
)
