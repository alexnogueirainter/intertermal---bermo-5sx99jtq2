migrate(
  (app) => {
    // Limpeza dos dados de TESTE da implementacao (nenhum dado real e tocado):
    // 1) apaga as duas visitas de teste criadas pelos testes automatizados
    const testIds = ['wl7rrmpgh3ncu1a', 'cixh7u5ipy5f7fp']
    for (const id of testIds) {
      try {
        const rec = app.findRecordById('field_visits', id)
        if (
          String(rec.get('client_name') || '').indexOf('TESTE') > -1 ||
          String(rec.get('client_name') || '').indexOf('TESTE') > -1
        ) {
          app.delete(rec)
          console.log('Visita de teste apagada: ' + id)
        }
      } catch (_) {
        // nao existe ou ja apagada
      }
    }
    // 2) libera os vinculos de aparelho usados nos testes (Alan e Giscard)
    //    para que o primeiro celular REAL de cada vendedor faca o vinculo.
    for (const name of ['Alan', 'Giscard']) {
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
