migrate(
  (app) => {
    try {
      const record = app.findFirstRecordByData('quotes', 'id', '1kzdlg8numgbss7')

      const chemicalProducts = [
        {
          id: 'chem-1kzd-1',
          category: 'cleaning',
          description: 'SOLVENTE',
          unit: 'L',
          quantity: 1,
          unit_price: 500,
          subtotal: 500,
        },
        {
          id: 'chem-1kzd-2',
          category: 'cleaning',
          description: 'JATEAMENTO PEÇAS',
          unit: 'un',
          quantity: 1,
          unit_price: 0,
          subtotal: 0,
        },
      ]

      record.set('materials_cost', 1200)
      record.set('chemical_products', chemicalProducts)
      record.set('total_cost', 4064.0)
      record.set('admin_cost', 609.6)
      record.set('final_price', 12029.86)
      record.set('subtotal', 12029.86)
      record.set('total', 12029.86)

      app.save(record)
    } catch (err) {
      console.log(
        'Migration 0025: Proposta INT-2026-952 (1kzdlg8numgbss7) não encontrada ou já atualizada:',
        err,
      )
    }
  },
  (app) => {
    // Revert se necessário
  },
)
