/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    // Arquivamento de negócios e propostas: saem do funil e dos totais,
    // ficam na lista "Arquivados" e podem ser restaurados.
    const deals = app.findCollectionByNameOrId('deals')
    if (!deals.fields.getByName('archived')) {
      deals.fields.add(new BoolField({ name: 'archived' }))
    }
    if (!deals.fields.getByName('archived_at')) {
      deals.fields.add(new DateField({ name: 'archived_at' }))
    }
    app.save(deals)

    const quotes = app.findCollectionByNameOrId('quotes')
    if (!quotes.fields.getByName('archived')) {
      quotes.fields.add(new BoolField({ name: 'archived' }))
    }
    if (!quotes.fields.getByName('archived_at')) {
      quotes.fields.add(new DateField({ name: 'archived_at' }))
    }
    app.save(quotes)
  },
  (app) => {
    const deals = app.findCollectionByNameOrId('deals')
    for (const name of ['archived', 'archived_at']) {
      const f = deals.fields.getByName(name)
      if (f) {
        deals.fields.removeByName(name)
      }
    }
    app.save(deals)

    const quotes = app.findCollectionByNameOrId('quotes')
    for (const name of ['archived', 'archived_at']) {
      const f = quotes.fields.getByName(name)
      if (f) {
        quotes.fields.removeByName(name)
      }
    }
    app.save(quotes)
  },
)
