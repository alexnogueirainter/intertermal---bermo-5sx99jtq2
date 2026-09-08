migrate(
  (app) => {
    const quotesCol = app.findCollectionByNameOrId('quotes')

    // Novas Funções de Mão de Obra Especializada: Soldador, Encanador e Encarregado
    if (!quotesCol.fields.getByName('welder_rate')) {
      quotesCol.fields.add(new NumberField({ name: 'welder_rate' }))
    }
    if (!quotesCol.fields.getByName('welder_count')) {
      quotesCol.fields.add(new NumberField({ name: 'welder_count' }))
    }
    if (!quotesCol.fields.getByName('welder_hours')) {
      quotesCol.fields.add(new NumberField({ name: 'welder_hours' }))
    }

    if (!quotesCol.fields.getByName('plumber_rate')) {
      quotesCol.fields.add(new NumberField({ name: 'plumber_rate' }))
    }
    if (!quotesCol.fields.getByName('plumber_count')) {
      quotesCol.fields.add(new NumberField({ name: 'plumber_count' }))
    }
    if (!quotesCol.fields.getByName('plumber_hours')) {
      quotesCol.fields.add(new NumberField({ name: 'plumber_hours' }))
    }

    if (!quotesCol.fields.getByName('foreman_rate')) {
      quotesCol.fields.add(new NumberField({ name: 'foreman_rate' }))
    }
    if (!quotesCol.fields.getByName('foreman_count')) {
      quotesCol.fields.add(new NumberField({ name: 'foreman_count' }))
    }
    if (!quotesCol.fields.getByName('foreman_hours')) {
      quotesCol.fields.add(new NumberField({ name: 'foreman_hours' }))
    }

    // Hospedagem & Alimentação: Hotel, Refeições e Vale Refeição (Alojado / Não Alojado)
    if (!quotesCol.fields.getByName('hotel_days')) {
      quotesCol.fields.add(new NumberField({ name: 'hotel_days' }))
    }
    if (!quotesCol.fields.getByName('hotel_rate')) {
      quotesCol.fields.add(new NumberField({ name: 'hotel_rate' }))
    }
    if (!quotesCol.fields.getByName('meals_days')) {
      quotesCol.fields.add(new NumberField({ name: 'meals_days' }))
    }
    if (!quotesCol.fields.getByName('meals_rate')) {
      quotesCol.fields.add(new NumberField({ name: 'meals_rate' }))
    }
    if (!quotesCol.fields.getByName('meal_voucher_housed_qty')) {
      quotesCol.fields.add(new NumberField({ name: 'meal_voucher_housed_qty' }))
    }
    if (!quotesCol.fields.getByName('meal_voucher_housed_rate')) {
      quotesCol.fields.add(new NumberField({ name: 'meal_voucher_housed_rate' }))
    }
    if (!quotesCol.fields.getByName('meal_voucher_unhoused_qty')) {
      quotesCol.fields.add(new NumberField({ name: 'meal_voucher_unhoused_qty' }))
    }
    if (!quotesCol.fields.getByName('meal_voucher_unhoused_rate')) {
      quotesCol.fields.add(new NumberField({ name: 'meal_voucher_unhoused_rate' }))
    }
    if (!quotesCol.fields.getByName('lodging_meals_config')) {
      quotesCol.fields.add(new JSONField({ name: 'lodging_meals_config' }))
    }

    app.save(quotesCol)
  },
  (app) => {},
)
