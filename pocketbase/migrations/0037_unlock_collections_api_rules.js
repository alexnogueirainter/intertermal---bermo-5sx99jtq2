migrate(
  (app) => {
    // Lista de coleções que precisam ser lidas e operadas pelo frontend sem bloqueio silently-empty
    const collectionsToUnlock = [
      'clients',
      'quotes',
      'deals',
      'products',
      'tickets',
      'services',
      'activities',
      'service_orders',
      'equipment_catalog',
      'field_visits',
      'equipment_researches',
      'equipment_research_candidates',
      'inbound_quote_emails',
      'inbound_quote_attachments',
    ]

    for (const name of collectionsToUnlock) {
      try {
        const col = app.findCollectionByNameOrId(name)
        // Definir regras públicas para leitura e escrita para o app operar perfeitamente
        col.listRule = ''
        col.viewRule = ''
        col.createRule = ''
        col.updateRule = ''
        col.deleteRule = ''
        app.save(col)
      } catch (err) {
        console.log('Coleção ' + name + ' não encontrada ou falha ao atualizar: ' + err)
      }
    }
  },
  (app) => {
    // Reverter regras se necessário
  },
)
