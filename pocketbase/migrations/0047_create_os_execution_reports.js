migrate(
  (app) => {
    try {
      app.findCollectionByNameOrId('os_execution_reports')
      return // Já existe
    } catch (_) {}

    const collection = new Collection({
      name: 'os_execution_reports',
      type: 'base',
      listRule: '',
      viewRule: '',
      createRule: '',
      updateRule: '',
      deleteRule: '',
      fields: [
        {
          name: 'service_order_id',
          type: 'relation',
          collectionId: app.findCollectionByNameOrId('service_orders').id,
          cascadeDelete: false,
          maxSelect: 1,
        },
        { name: 'order_number', type: 'text', required: true },
        { name: 'quote_number', type: 'text' },
        { name: 'client_id', type: 'text' },
        { name: 'client_name', type: 'text' },
        { name: 'work_start_datetime', type: 'text' },
        { name: 'equipment_model', type: 'text' },
        { name: 'equipment_tag', type: 'text' },
        { name: 'exchanger_current_status', type: 'text' },
        { name: 'technician_name', type: 'text' },
        { name: 'materials_used', type: 'json' },
        { name: 'observations', type: 'text' },
        { name: 'created_by', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_os_exec_rep_so ON os_execution_reports (service_order_id)',
        'CREATE INDEX idx_os_exec_rep_number ON os_execution_reports (order_number)',
        'CREATE INDEX idx_os_exec_rep_tech ON os_execution_reports (technician_name)',
      ],
    })

    app.save(collection)
  },
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('os_execution_reports')
      app.delete(col)
    } catch (_) {}
  },
)
