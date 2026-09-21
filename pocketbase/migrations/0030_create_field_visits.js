migrate(
  (app) => {
    // Criação da coleção field_visits para registrar visitas a campo enviadas ao CRM
    try {
      app.findCollectionByNameOrId('field_visits')
      return // Já existe
    } catch (_) {}

    const collection = new Collection({
      name: 'field_visits',
      type: 'base',
      listRule: '',
      viewRule: '',
      createRule: '',
      updateRule: '',
      deleteRule: '',
      fields: [
        { name: 'employee_name', type: 'text', required: true },
        { name: 'visit_date', type: 'text' },
        { name: 'start_time', type: 'text' },
        { name: 'end_time', type: 'text' },
        { name: 'duration', type: 'text' },
        { name: 'client_name', type: 'text' },
        { name: 'client_role', type: 'text' },
        { name: 'client_contact', type: 'text' },
        { name: 'work_area', type: 'text' },
        { name: 'work_type', type: 'text' },
        { name: 'work_type_other', type: 'text' },
        { name: 'general_notes', type: 'text' },
        { name: 'equipment', type: 'json', maxSize: 15728640 }, // suporta fotos em base64 comprimidas
        { name: 'status', type: 'text' },
        { name: 'sent_at', type: 'date' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_field_visits_employee ON field_visits (employee_name)',
        'CREATE INDEX idx_field_visits_date ON field_visits (visit_date)',
        'CREATE INDEX idx_field_visits_client ON field_visits (client_name)',
      ],
    })

    app.save(collection)
  },
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('field_visits')
      app.delete(col)
    } catch (_) {}
  },
)
