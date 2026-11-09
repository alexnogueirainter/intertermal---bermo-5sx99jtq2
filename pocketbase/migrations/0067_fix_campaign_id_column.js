/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    // Diagnóstico: a tabela SQL do preview não tem a coluna campaign_id (o schema da
    // API mostra o campo, mas a tabela não — dano da sequência 0064/0065).
    // Recria a coluna via SQL cru, idempotente.
    let has = false
    try {
      const rows = app
        .db()
        .newQuery(
          "SELECT COUNT(*) AS n FROM pragma_table_info('campaign_recipients') WHERE name='campaign_id'",
        )
        .all()
      has = rows && rows.length > 0 && Number(rows[0].n) > 0
    } catch (_) {
      has = false
    }
    if (!has) {
      app
        .db()
        .newQuery('ALTER TABLE campaign_recipients ADD COLUMN campaign_id TEXT NOT NULL DEFAULT ""')
        .execute()
      app
        .db()
        .newQuery(
          'CREATE INDEX IF NOT EXISTS idx_campaign_recipients_campaign_id ON campaign_recipients (campaign_id)',
        )
        .execute()
    }
  },
  (app) => {
    // down: nada (não destrói dados)
  },
)
