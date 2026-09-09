migrate(
  (app) => {
    const quotesCol = app.findCollectionByNameOrId('quotes')

    // Vale Transporte na Seção 3C (Deslocamento & Rotas)
    if (!quotesCol.fields.getByName('transit_voucher_qty')) {
      quotesCol.fields.add(new NumberField({ name: 'transit_voucher_qty' }))
    }
    if (!quotesCol.fields.getByName('transit_voucher_rate')) {
      quotesCol.fields.add(new NumberField({ name: 'transit_voucher_rate' }))
    }
    if (!quotesCol.fields.getByName('transit_voucher_total')) {
      quotesCol.fields.add(new NumberField({ name: 'transit_voucher_total' }))
    }

    app.save(quotesCol)
  },
  (app) => {
    const quotesCol = app.findCollectionByNameOrId('quotes')

    const fQty = quotesCol.fields.getByName('transit_voucher_qty')
    if (fQty) quotesCol.fields.remove(fQty)

    const fRate = quotesCol.fields.getByName('transit_voucher_rate')
    if (fRate) quotesCol.fields.remove(fRate)

    const fTotal = quotesCol.fields.getByName('transit_voucher_total')
    if (fTotal) quotesCol.fields.remove(fTotal)

    app.save(quotesCol)
  },
)
