migrate(
  (app) => {
    // Apaga a visita de DIAGNOSTICO criada no teste do fix de e-mail (id cv_diag_bossa_001).
    // Nenhum dado real e tocado.
    try {
      const rec = app.findFirstRecordByFilter('field_visits', 'client_visit_id = {:c}', {
        c: 'cv_diag_bossa_001',
      })
      if (rec) {
        app.delete(rec)
        console.log('Visita de diagnostico apagada: ' + rec.id)
      }
    } catch (_) {
      // nao encontrada
    }
  },
  (app) => {},
)
