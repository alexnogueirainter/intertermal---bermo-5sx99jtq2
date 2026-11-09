/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    // Garante a fila ACTIVE: absent row ou disabled=false = cron dispara.
    // Segurança não vem do pause — vem do design: o hook só envia quando existe
    // campanha em 'sending', que só nasce do clique "Salvar e disparar" do Alex.
    let cr = null
    try {
      cr = app.findFirstRecordByFilter('_cron_settings', 'job = {:j}', { j: 'campaigns_queue' })
    } catch (_) {
      cr = null
    }
    if (cr) {
      cr.set('disabled', false)
      app.save(cr)
    }
  },
  (app) => {
    // down: volta a pausar (estado anterior)
    let cr = null
    try {
      cr = app.findFirstRecordByFilter('_cron_settings', 'job = {:j}', { j: 'campaigns_queue' })
    } catch (_) {
      cr = null
    }
    if (cr) {
      cr.set('disabled', true)
      app.save(cr)
    }
  },
)
