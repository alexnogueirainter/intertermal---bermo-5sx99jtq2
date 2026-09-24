migrate(
  (app) => {
    // Limpeza dos vinculos e dados de TESTE (nenhum dado real e tocado):
    // - apaga visitas de teste marcadas com client_visit_id de teste
    // - libera o vinculo de aparelho dos 3 vendedores para o primeiro celular real
    try {
      const rec = app.findFirstRecordByFilter('field_visits', 'client_visit_id = {:c}', {
        c: 'cv_teste_bossa_001',
      })
      if (rec) {
        app.delete(rec)
        console.log('Visita de teste idempotencia apagada: ' + rec.id)
      }
    } catch (_) {
      // nenhuma visita de teste encontrada
    }
    for (const name of ['Alan', 'Giscard', 'Marciel']) {
      try {
        const rec = app.findFirstRecordByFilter('field_visit_tokens', 'seller_name = {:n}', {
          n: name,
        })
        if (rec && String(rec.get('device_id') || '') !== '') {
          rec.set('device_id', '')
          rec.set('device_ip', '')
          rec.set('device_ua', '')
          rec.set('bound_at', '')
          app.save(rec)
          console.log('Vinculo de teste liberado: ' + name)
        }
      } catch (_) {}
    }
  },
  (app) => {},
)
