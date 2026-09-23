migrate(
  (app) => {
    // Libera o vinculo de aparelho do Giscard (usado apenas em teste automatizado).
    // O token continua ativo; ele sera re-vinculado ao primeiro celular real que abrir o link.
    try {
      const rec = app.findFirstRecordByFilter('field_visit_tokens', 'seller_name = {:n}', {
        n: 'Giscard',
      })
      if (rec) {
        rec.set('device_id', '')
        rec.set('device_ip', '')
        rec.set('device_ua', '')
        rec.set('bound_at', '')
        app.save(rec)
        console.log('Vinculo de aparelho do Giscard liberado (teste)')
      }
    } catch (err) {
      console.log('Giscard sem vinculo para liberar: ' + err)
    }
  },
  (app) => {},
)
