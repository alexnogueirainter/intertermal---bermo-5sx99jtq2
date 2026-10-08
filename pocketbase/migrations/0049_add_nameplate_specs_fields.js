/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    // 1. Garantir que a coleção field_visits tenha espaço e suporte documental
    // O campo 'equipment' já é do tipo JSON onde os registros de equipamentos residem.
    // Garantimos que o tamanho máximo seja suficiente para múltiplos equipamentos e anexos.
    const fvCol = app.findCollectionByNameOrId('field_visits')
    const equipmentField = fvCol.fields.getByName('equipment')
    if (equipmentField) {
      // Garante tamanho de JSON adequado caso não estivesse
      equipmentField.maxSize = 20 * 1024 * 1024 // 20MB
      app.save(fvCol)
    }

    // 2. Se a coleção equipment_catalog puder receber dados de serviço e parâmetros de plaqueta BERMO:
    // Não altera nenhum dado existente, apenas adiciona campos informativos se não existirem
    try {
      const catCol = app.findCollectionByNameOrId('equipment_catalog')
      if (catCol) {
        let changed = false
        if (!catCol.fields.getByName('service_application')) {
          catCol.fields.add(
            new TextField({
              name: 'service_application',
              required: false,
            }),
          )
          changed = true
        }
        if (!catCol.fields.getByName('pmta_mpa')) {
          catCol.fields.add(
            new NumberField({
              name: 'pmta_mpa',
              required: false,
            }),
          )
          changed = true
        }
        if (!catCol.fields.getByName('tightening_a_min_mm')) {
          catCol.fields.add(
            new NumberField({
              name: 'tightening_a_min_mm',
              required: false,
            }),
          )
          changed = true
        }
        if (!catCol.fields.getByName('tightening_a_max_mm')) {
          catCol.fields.add(
            new NumberField({
              name: 'tightening_a_max_mm',
              required: false,
            }),
          )
          changed = true
        }
        if (changed) {
          app.save(catCol)
        }
      }
    } catch (_) {}
  },
  (app) => {
    try {
      const catCol = app.findCollectionByNameOrId('equipment_catalog')
      if (catCol) {
        if (catCol.fields.getByName('service_application')) {
          catCol.fields.removeByName('service_application')
        }
        if (catCol.fields.getByName('pmta_mpa')) {
          catCol.fields.removeByName('pmta_mpa')
        }
        if (catCol.fields.getByName('tightening_a_min_mm')) {
          catCol.fields.removeByName('tightening_a_min_mm')
        }
        if (catCol.fields.getByName('tightening_a_max_mm')) {
          catCol.fields.removeByName('tightening_a_max_mm')
        }
        app.save(catCol)
      }
    } catch (_) {}
  },
)
