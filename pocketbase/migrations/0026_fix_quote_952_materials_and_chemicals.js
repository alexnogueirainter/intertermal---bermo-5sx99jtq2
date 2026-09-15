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

      // Valores conforme o motor de cálculo da proposta INT-2026-952:
      // Materiais puros: R$ 1.200,00
      // Químicos: R$ 500,00
      // Mão de obra (tech 24h x 48 = 1.152 + helper 24h x 30 = 720): R$ 1.872,00
      // Vales hospedados (6 x 82): R$ 492,00
      // Custos Diretos Totais: 1.200 + 500 + 1.872 + 492 = R$ 4.064,00
      // Overhead Adm 15%: R$ 609,60
      // Base Bruta: 4.064,00 + 609,60 = R$ 4.673,60
      // Deduções: Margem 25% + Comissão 6% + Tributos 30,15% = 61,15%
      // Divisor: 1 - 0,6115 = 0,3885
      // Preço Final / Total / Subtotal: 4.673,60 / 0,3885 = R$ 12.029,86
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
        'Migration 0026: Proposta INT-2026-952 (1kzdlg8numgbss7) não encontrada ou já atualizada:',
        err,
      )
    }
  },
  (app) => {
    // Revert se necessário
  },
)
