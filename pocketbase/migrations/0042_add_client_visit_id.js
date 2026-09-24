migrate(
  (app) => {
    // Aditivo: identificador unico gerado no celular (idempotencia de reenvio).
    // Nao altera nenhum registro existente; index comum (nao unique) para nao
    // conflitar com multiplos vazios em registros antigos.
    try {
      const fv = app.findCollectionByNameOrId('field_visits')
      let changed = false
      if (!fv.fields.getByName('client_visit_id')) {
        fv.fields.add(new TextField({ name: 'client_visit_id' }))
        changed = true
      }
      if (changed) {
        app.save(fv)
        console.log('Campo client_visit_id adicionado a field_visits')
      }
    } catch (err) {
      console.log('field_visits client_visit_id: ' + err)
    }
  },
  (app) => {},
)
