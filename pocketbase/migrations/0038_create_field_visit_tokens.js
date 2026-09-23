migrate(
  (app) => {
    // 1) Coleção field_visit_tokens: chaves de acesso dos vendedores ao formulário
    //    de visita a campo via link (nível médio: 1 token = 1 aparelho autorizado).
    //    Regras 100% travadas (null): acesso apenas via hooks em /backend/v1/...
    try {
      app.findCollectionByNameOrId('field_visit_tokens')
    } catch (_) {
      const collection = new Collection({
        name: 'field_visit_tokens',
        type: 'base',
        listRule: null,
        viewRule: null,
        createRule: null,
        updateRule: null,
        deleteRule: null,
        fields: [
          { name: 'seller_name', type: 'text', required: true },
          { name: 'token', type: 'text', required: true },
          { name: 'device_id', type: 'text' },
          { name: 'device_ip', type: 'text' },
          { name: 'device_ua', type: 'text' },
          { name: 'bound_at', type: 'text' },
          { name: 'active', type: 'bool' },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE UNIQUE INDEX idx_fvt_token ON field_visit_tokens (token)',
          'CREATE INDEX idx_fvt_seller ON field_visit_tokens (seller_name)',
        ],
      })
      app.save(collection)
      console.log('Coleção field_visit_tokens criada (regras travadas)')
    }

    // 2) Campos aditivos em field_visits para rastrear o vendedor de cada visita.
    //    NÃO altera nenhum dado existente — só acrescenta colunas vazias.
    try {
      const fv = app.findCollectionByNameOrId('field_visits')
      let changed = false
      if (!fv.fields.getByName('seller_name')) {
        fv.fields.add(new TextField({ name: 'seller_name' }))
        changed = true
      }
      if (!fv.fields.getByName('seller_token')) {
        fv.fields.add(new TextField({ name: 'seller_token' }))
        changed = true
      }
      if (changed) app.save(fv)
    } catch (err) {
      console.log('field_visits: falha ao adicionar campos de rastreio: ' + err)
    }

    // 3) Seeds idempotentes: um token por vendedor (Alan, Giscard, Marciel).
    const seeds = [
      { name: 'Alan', token: '3ecf7fe315048499185e50b8651386af' },
      { name: 'Giscard', token: 'dc5bfd88d9a9d4cab5412e0f7460152a' },
      { name: 'Marciel', token: '7c18a8cdc4ff81996e7d42b8b8f97a0d' },
    ]
    for (const s of seeds) {
      try {
        app.findFirstRecordByFilter('field_visit_tokens', 'token = {:t}', { t: s.token })
        // já existe
      } catch (_) {
        const col = app.findCollectionByNameOrId('field_visit_tokens')
        const rec = new Record(col)
        rec.set('seller_name', s.name)
        rec.set('token', s.token)
        rec.set('active', true)
        app.save(rec)
        console.log('Token criado para ' + s.name)
      }
    }
  },
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('field_visit_tokens')
      app.delete(col)
    } catch (_) {}
    try {
      const fv = app.findCollectionByNameOrId('field_visits')
      let changed = false
      for (const fname of ['seller_name', 'seller_token']) {
        try {
          if (fv.fields.getByName(fname)) {
            if (typeof fv.fields.removeByName === 'function') {
              fv.fields.removeByName(fname)
              changed = true
            }
          }
        } catch (_) {}
      }
      if (changed) app.save(fv)
    } catch (_) {}
  },
)
