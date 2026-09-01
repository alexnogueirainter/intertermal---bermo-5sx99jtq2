migrate(
  (app) => {
    // 1. Atualizar campos da coleção quotes: adicionar approval_token, approved_by_client_name, approved_by_client_date, rejected_by_client_reason, rejected_by_client_date se não existirem
    const quotesCol = app.findCollectionByNameOrId('quotes')

    if (!quotesCol.fields.getByName('approval_token')) {
      quotesCol.fields.add(
        new TextField({
          name: 'approval_token',
          required: false,
        }),
      )
    }
    if (!quotesCol.fields.getByName('approved_by_client_name')) {
      quotesCol.fields.add(
        new TextField({
          name: 'approved_by_client_name',
          required: false,
        }),
      )
    }
    if (!quotesCol.fields.getByName('approved_by_client_date')) {
      quotesCol.fields.add(
        new DateField({
          name: 'approved_by_client_date',
          required: false,
        }),
      )
    }
    if (!quotesCol.fields.getByName('rejected_by_client_reason')) {
      quotesCol.fields.add(
        new TextField({
          name: 'rejected_by_client_reason',
          required: false,
        }),
      )
    }
    if (!quotesCol.fields.getByName('rejected_by_client_date')) {
      quotesCol.fields.add(
        new DateField({
          name: 'rejected_by_client_date',
          required: false,
        }),
      )
    }
    app.save(quotesCol)

    // 2. Atualizar coleção service_orders com novos status (inspection, closed, etc) e campos para histórico e equipamentos
    const soCol = app.findCollectionByNameOrId('service_orders')

    // Atualizar status select values para suportar o pipeline completo:
    // vistoria, proposta, execucao, inspecao, fechado + compatibilidade com legado
    const statusField = soCol.fields.getByName('status')
    if (statusField) {
      statusField.values = [
        'vistoria',
        'proposta',
        'execucao',
        'inspecao',
        'fechado',
        'pending_approval',
        'approved',
        'in_progress',
        'completed',
        'rejected',
        'cancelled',
      ]
    }

    if (!soCol.fields.getByName('status_history')) {
      soCol.fields.add(
        new JSONField({
          name: 'status_history',
          required: false,
          maxSize: 2000000,
        }),
      )
    }

    if (!soCol.fields.getByName('equipment_info')) {
      soCol.fields.add(
        new JSONField({
          name: 'equipment_info',
          required: false,
          maxSize: 2000000,
        }),
      )
    }

    if (!soCol.fields.getByName('equipment_model')) {
      soCol.fields.add(
        new TextField({
          name: 'equipment_model',
          required: false,
        }),
      )
    }

    if (!soCol.fields.getByName('equipment_brand')) {
      soCol.fields.add(
        new TextField({
          name: 'equipment_brand',
          required: false,
        }),
      )
    }

    app.save(soCol)
  },
  (app) => {
    // Reversão suave sem apagar dados
  },
)
