migrate(
  (app) => {
    const clientsCol = app.findCollectionByNameOrId('clients')

    const collection = new Collection({
      name: 'client_surveys',
      type: 'base',
      listRule: '',
      viewRule: '',
      createRule: '',
      updateRule: '',
      deleteRule: '',
      fields: [
        {
          name: 'client_id',
          type: 'relation',
          required: true,
          collectionId: clientsCol.id,
          cascadeDelete: true,
          maxSelect: 1,
        },
        { name: 'client_name', type: 'text', required: true },
        { name: 'contact_id', type: 'text' },
        { name: 'contact_name', type: 'text', required: true },
        { name: 'contact_email', type: 'email', required: true },
        { name: 'contact_role', type: 'text' },
        { name: 'contact_phone', type: 'text' },
        { name: 'survey_url', type: 'url', required: true },
        { name: 'sent_by', type: 'text' },
        { name: 'sent_by_email', type: 'text' },
        { name: 'email_subject', type: 'text' },
        {
          name: 'status',
          type: 'select',
          values: ['sent', 'error'],
          maxSelect: 1,
        },
        { name: 'notes', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_client_surveys_client ON client_surveys (client_id)',
        'CREATE INDEX idx_client_surveys_created ON client_surveys (created DESC)',
      ],
    })

    app.save(collection)
  },
  (app) => {
    try {
      const collection = app.findCollectionByNameOrId('client_surveys')
      app.delete(collection)
    } catch (_) {}
  },
)
