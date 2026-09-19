migrate(
  (app) => {
    // 1. Adiciona controle de aprovação e proveniência ao catálogo existente.
    const catalogCol = app.findCollectionByNameOrId('equipment_catalog')

    if (!catalogCol.fields.getByName('approval_status')) {
      catalogCol.fields.add(
        new SelectField({
          name: 'approval_status',
          values: ['needs_review', 'approved', 'rejected'],
          maxSelect: 1,
        }),
      )
    }
    if (!catalogCol.fields.getByName('source_type')) {
      catalogCol.fields.add(new TextField({ name: 'source_type' }))
    }
    if (!catalogCol.fields.getByName('source_title')) {
      catalogCol.fields.add(new TextField({ name: 'source_title' }))
    }
    if (!catalogCol.fields.getByName('source_excerpt')) {
      catalogCol.fields.add(new TextField({ name: 'source_excerpt' }))
    }
    if (!catalogCol.fields.getByName('provenance')) {
      catalogCol.fields.add(new JSONField({ name: 'provenance', maxSize: 2097152 }))
    }
    if (!catalogCol.fields.getByName('verified_at')) {
      catalogCol.fields.add(new DateField({ name: 'verified_at' }))
    }
    if (!catalogCol.fields.getByName('verified_by')) {
      catalogCol.fields.add(new TextField({ name: 'verified_by' }))
    }

    catalogCol.addIndex('idx_equip_catalog_approval_status', false, 'approval_status', '')
    app.save(catalogCol)

    // Os registros legados entram como pendentes até serem revisados.
    const catalogRecords = app.findRecordsByFilter('equipment_catalog', '', 'model', 5000, 0)
    for (const record of catalogRecords) {
      if (!record.getString('approval_status')) {
        record.set('approval_status', 'needs_review')
        app.save(record)
      }
    }

    // 2. Guarda a proveniência técnica utilizada em cada proposta.
    const quotesCol = app.findCollectionByNameOrId('quotes')
    if (!quotesCol.fields.getByName('technical_provenance')) {
      quotesCol.fields.add(
        new JSONField({ name: 'technical_provenance', maxSize: 2097152, required: false }),
      )
      app.save(quotesCol)
    }

    // 3. Registra cada pesquisa feita para localizar um equipamento.
    let researchesCol
    try {
      researchesCol = app.findCollectionByNameOrId('equipment_researches')
    } catch (_) {
      researchesCol = new Collection({
        name: 'equipment_researches',
        type: 'base',
        listRule: '@request.auth.id != ""',
        viewRule: '@request.auth.id != ""',
        createRule: '@request.auth.id != ""',
        updateRule: '@request.auth.id != ""',
        deleteRule: '@request.auth.id != ""',
        fields: [
          { name: 'requested_model', type: 'text', required: true },
          { name: 'requested_brand', type: 'text' },
          { name: 'query', type: 'text' },
          { name: 'status', type: 'text', required: true },
          { name: 'quote_id', type: 'text' },
          { name: 'requested_by', type: 'text' },
          { name: 'results_json', type: 'json', maxSize: 4194304 },
          { name: 'selected_result_json', type: 'json', maxSize: 2097152 },
          { name: 'error_message', type: 'text' },
          { name: 'completed_at', type: 'date' },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE INDEX idx_equipment_researches_model ON equipment_researches (requested_model)',
          'CREATE INDEX idx_equipment_researches_status ON equipment_researches (status)',
        ],
      })
      app.save(researchesCol)
    }

    // 4. Guarda as fontes candidatas e as evidências por campo.
    try {
      app.findCollectionByNameOrId('equipment_research_candidates')
    } catch (_) {
      const candidatesCol = new Collection({
        name: 'equipment_research_candidates',
        type: 'base',
        listRule: '@request.auth.id != ""',
        viewRule: '@request.auth.id != ""',
        createRule: '@request.auth.id != ""',
        updateRule: '@request.auth.id != ""',
        deleteRule: '@request.auth.id != ""',
        fields: [
          { name: 'research_id', type: 'text', required: true },
          { name: 'source_url', type: 'url' },
          { name: 'source_title', type: 'text' },
          { name: 'source_type', type: 'text' },
          { name: 'source_domain', type: 'text' },
          { name: 'resolved_brand', type: 'text' },
          { name: 'resolved_model', type: 'text' },
          { name: 'match_status', type: 'text' },
          { name: 'confirmed_specs', type: 'json', maxSize: 2097152 },
          { name: 'evidence', type: 'json', maxSize: 4194304 },
          { name: 'approval_status', type: 'text' },
          { name: 'approved_by', type: 'text' },
          { name: 'approved_at', type: 'date' },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE INDEX idx_equipment_candidates_research ON equipment_research_candidates (research_id)',
          'CREATE INDEX idx_equipment_candidates_model ON equipment_research_candidates (resolved_model)',
        ],
      })
      app.save(candidatesCol)
    }
  },
  (app) => {
    // Reversão somente da estrutura criada nesta migration.
    try {
      const candidatesCol = app.findCollectionByNameOrId('equipment_research_candidates')
      app.delete(candidatesCol)
    } catch (_) {}

    try {
      const researchesCol = app.findCollectionByNameOrId('equipment_researches')
      app.delete(researchesCol)
    } catch (_) {}

    const quotesCol = app.findCollectionByNameOrId('quotes')
    if (quotesCol.fields.getByName('technical_provenance')) {
      quotesCol.fields.removeByName('technical_provenance')
      app.save(quotesCol)
    }

    const catalogCol = app.findCollectionByNameOrId('equipment_catalog')
    if (catalogCol.fields.getByName('approval_status')) {
      catalogCol.fields.removeByName('approval_status')
    }
    if (catalogCol.fields.getByName('source_type')) {
      catalogCol.fields.removeByName('source_type')
    }
    if (catalogCol.fields.getByName('source_title')) {
      catalogCol.fields.removeByName('source_title')
    }
    if (catalogCol.fields.getByName('source_excerpt')) {
      catalogCol.fields.removeByName('source_excerpt')
    }
    if (catalogCol.fields.getByName('provenance')) {
      catalogCol.fields.removeByName('provenance')
    }
    if (catalogCol.fields.getByName('verified_at')) {
      catalogCol.fields.removeByName('verified_at')
    }
    if (catalogCol.fields.getByName('verified_by')) {
      catalogCol.fields.removeByName('verified_by')
    }
    app.save(catalogCol)
  },
)
