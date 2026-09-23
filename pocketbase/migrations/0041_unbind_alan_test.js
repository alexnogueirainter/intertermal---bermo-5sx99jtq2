migrate(
  (app) => {
    // Libera o vinculo de aparelho do Alan usado no teste final, para que o
    // primeiro celular REAL dele faca o vinculo ao abrir o link.
    try {
      const rec = app.findFirstRecordByFilter('field_visit_tokens', 'seller_name = {:n}', {
        n: 'Alan',
      })
      if (rec && String(rec.get('device_id') || '') !== '') {
        rec.set('device_id', '')
        rec.set('device_ip', '')
        rec.set('device_ua', '')
        rec.set('bound_at', '')
        app.save(rec)
        console.log('Vinculo de teste do Alan liberado')
      }
    } catch (err) {
      console.log('Alan sem vinculo para liberar: ' + err)
    }
  },
  (app) => {},
)
