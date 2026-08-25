migrate(
  (app) => {
    // 1. Enriquecer coleção quotes com campos para persistência completa de engenharia de custos
    const quotesCol = app.findCollectionByNameOrId('quotes')

    // Campos de Mão de Obra
    if (!quotesCol.fields.getByName('tech_rate')) {
      quotesCol.fields.add(new NumberField({ name: 'tech_rate' }))
    }
    if (!quotesCol.fields.getByName('tech_count')) {
      quotesCol.fields.add(new NumberField({ name: 'tech_count' }))
    }
    if (!quotesCol.fields.getByName('tech_hours')) {
      quotesCol.fields.add(new NumberField({ name: 'tech_hours' }))
    }
    if (!quotesCol.fields.getByName('helper_rate')) {
      quotesCol.fields.add(new NumberField({ name: 'helper_rate' }))
    }
    if (!quotesCol.fields.getByName('helper_count')) {
      quotesCol.fields.add(new NumberField({ name: 'helper_count' }))
    }
    if (!quotesCol.fields.getByName('helper_hours')) {
      quotesCol.fields.add(new NumberField({ name: 'helper_hours' }))
    }
    if (!quotesCol.fields.getByName('inspector_rate')) {
      quotesCol.fields.add(new NumberField({ name: 'inspector_rate' }))
    }
    if (!quotesCol.fields.getByName('inspector_count')) {
      quotesCol.fields.add(new NumberField({ name: 'inspector_count' }))
    }
    if (!quotesCol.fields.getByName('inspector_hours')) {
      quotesCol.fields.add(new NumberField({ name: 'inspector_hours' }))
    }
    if (!quotesCol.fields.getByName('labor_config')) {
      quotesCol.fields.add(new JSONField({ name: 'labor_config' }))
    }

    // Campos de Impostos, Margem e Comissão
    if (!quotesCol.fields.getByName('service_margin')) {
      quotesCol.fields.add(new NumberField({ name: 'service_margin' }))
    }
    if (!quotesCol.fields.getByName('sales_commission')) {
      quotesCol.fields.add(new NumberField({ name: 'sales_commission' }))
    }
    if (!quotesCol.fields.getByName('pis_rate')) {
      quotesCol.fields.add(new NumberField({ name: 'pis_rate' }))
    }
    if (!quotesCol.fields.getByName('cofins_rate')) {
      quotesCol.fields.add(new NumberField({ name: 'cofins_rate' }))
    }
    if (!quotesCol.fields.getByName('iss_rate')) {
      quotesCol.fields.add(new NumberField({ name: 'iss_rate' }))
    }
    if (!quotesCol.fields.getByName('csll_rate')) {
      quotesCol.fields.add(new NumberField({ name: 'csll_rate' }))
    }
    if (!quotesCol.fields.getByName('irpj_rate')) {
      quotesCol.fields.add(new NumberField({ name: 'irpj_rate' }))
    }
    if (!quotesCol.fields.getByName('ir_diff_rate')) {
      quotesCol.fields.add(new NumberField({ name: 'ir_diff_rate' }))
    }
    if (!quotesCol.fields.getByName('pricing_config')) {
      quotesCol.fields.add(new JSONField({ name: 'pricing_config' }))
    }

    // Campos de Logística e Deslocamento
    if (!quotesCol.fields.getByName('origin_cep')) {
      quotesCol.fields.add(new TextField({ name: 'origin_cep' }))
    }
    if (!quotesCol.fields.getByName('origin_address')) {
      quotesCol.fields.add(new TextField({ name: 'origin_address' }))
    }
    if (!quotesCol.fields.getByName('destination_cep')) {
      quotesCol.fields.add(new TextField({ name: 'destination_cep' }))
    }
    if (!quotesCol.fields.getByName('destination_address')) {
      quotesCol.fields.add(new TextField({ name: 'destination_address' }))
    }
    if (!quotesCol.fields.getByName('distance_km')) {
      quotesCol.fields.add(new NumberField({ name: 'distance_km' }))
    }
    if (!quotesCol.fields.getByName('is_round_trip')) {
      quotesCol.fields.add(new BoolField({ name: 'is_round_trip' }))
    }
    if (!quotesCol.fields.getByName('travel_config')) {
      quotesCol.fields.add(new JSONField({ name: 'travel_config' }))
    }

    // Campos de Equipamento
    if (!quotesCol.fields.getByName('equipment_brand')) {
      quotesCol.fields.add(new TextField({ name: 'equipment_brand' }))
    }
    if (!quotesCol.fields.getByName('equipment_model')) {
      quotesCol.fields.add(new TextField({ name: 'equipment_model' }))
    }
    if (!quotesCol.fields.getByName('equipment_series')) {
      quotesCol.fields.add(new TextField({ name: 'equipment_series' }))
    }
    if (!quotesCol.fields.getByName('plate_count')) {
      quotesCol.fields.add(new NumberField({ name: 'plate_count' }))
    }
    if (!quotesCol.fields.getByName('plate_material')) {
      quotesCol.fields.add(new TextField({ name: 'plate_material' }))
    }
    if (!quotesCol.fields.getByName('plate_thickness')) {
      quotesCol.fields.add(new NumberField({ name: 'plate_thickness' }))
    }
    if (!quotesCol.fields.getByName('gasket_material')) {
      quotesCol.fields.add(new TextField({ name: 'gasket_material' }))
    }
    if (!quotesCol.fields.getByName('connection_type')) {
      quotesCol.fields.add(new TextField({ name: 'connection_type' }))
    }
    if (!quotesCol.fields.getByName('connection_size')) {
      quotesCol.fields.add(new TextField({ name: 'connection_size' }))
    }
    if (!quotesCol.fields.getByName('pressure_test_bar')) {
      quotesCol.fields.add(new NumberField({ name: 'pressure_test_bar' }))
    }
    if (!quotesCol.fields.getByName('working_pressure_bar')) {
      quotesCol.fields.add(new NumberField({ name: 'working_pressure_bar' }))
    }
    if (!quotesCol.fields.getByName('dimensions_w_h_d')) {
      quotesCol.fields.add(new TextField({ name: 'dimensions_w_h_d' }))
    }
    if (!quotesCol.fields.getByName('weight_kg')) {
      quotesCol.fields.add(new NumberField({ name: 'weight_kg' }))
    }
    if (!quotesCol.fields.getByName('scope_of_work')) {
      quotesCol.fields.add(new TextField({ name: 'scope_of_work' }))
    }

    // Campos de Custos e Totais
    if (!quotesCol.fields.getByName('labor_hours')) {
      quotesCol.fields.add(new NumberField({ name: 'labor_hours' }))
    }
    if (!quotesCol.fields.getByName('labor_rate_hourly')) {
      quotesCol.fields.add(new NumberField({ name: 'labor_rate_hourly' }))
    }
    if (!quotesCol.fields.getByName('lodging_meals_cost')) {
      quotesCol.fields.add(new NumberField({ name: 'lodging_meals_cost' }))
    }
    if (!quotesCol.fields.getByName('travel_cost')) {
      quotesCol.fields.add(new NumberField({ name: 'travel_cost' }))
    }
    if (!quotesCol.fields.getByName('materials_cost')) {
      quotesCol.fields.add(new NumberField({ name: 'materials_cost' }))
    }
    if (!quotesCol.fields.getByName('third_party_cost')) {
      quotesCol.fields.add(new NumberField({ name: 'third_party_cost' }))
    }
    if (!quotesCol.fields.getByName('other_costs')) {
      quotesCol.fields.add(new NumberField({ name: 'other_costs' }))
    }
    if (!quotesCol.fields.getByName('discount_amount')) {
      quotesCol.fields.add(new NumberField({ name: 'discount_amount' }))
    }
    if (!quotesCol.fields.getByName('total_cost')) {
      quotesCol.fields.add(new NumberField({ name: 'total_cost' }))
    }
    if (!quotesCol.fields.getByName('final_price')) {
      quotesCol.fields.add(new NumberField({ name: 'final_price' }))
    }
    if (!quotesCol.fields.getByName('code')) {
      quotesCol.fields.add(new TextField({ name: 'code' }))
    }
    if (!quotesCol.fields.getByName('validity_days')) {
      quotesCol.fields.add(new NumberField({ name: 'validity_days' }))
    }
    if (!quotesCol.fields.getByName('payment_conditions')) {
      quotesCol.fields.add(new TextField({ name: 'payment_conditions' }))
    }
    if (!quotesCol.fields.getByName('technical_notes')) {
      quotesCol.fields.add(new TextField({ name: 'technical_notes' }))
    }
    if (!quotesCol.fields.getByName('commercial_notes')) {
      quotesCol.fields.add(new TextField({ name: 'commercial_notes' }))
    }
    if (!quotesCol.fields.getByName('service_details')) {
      quotesCol.fields.add(new JSONField({ name: 'service_details' }))
    }
    if (!quotesCol.fields.getByName('custom_materials')) {
      quotesCol.fields.add(new JSONField({ name: 'custom_materials' }))
    }

    app.save(quotesCol)

    // 2. Garantir que a coleção products tenha suporte para especificações técnicas se necessário
    const productsCol = app.findCollectionByNameOrId('products')
    if (!productsCol.fields.getByName('specs')) {
      productsCol.fields.add(new JSONField({ name: 'specs' }))
    }
    if (!productsCol.fields.getByName('brand')) {
      productsCol.fields.add(new TextField({ name: 'brand' }))
    }
    if (!productsCol.fields.getByName('model')) {
      productsCol.fields.add(new TextField({ name: 'model' }))
    }
    app.save(productsCol)
  },
  (app) => {},
)
