migrate(
  (app) => {
    // 1. Remover registros duplicados de service_orders onde order_number se repete,
    // mantendo APENAS o registro mais recente (updated mais novo) de cada grupo de duplicados.
    // SQLite query utilizando Window Function row_number() ou subquery:
    app
      .db()
      .newQuery(`
      DELETE FROM service_orders
      WHERE id IN (
        SELECT id FROM (
          SELECT id, order_number,
                 ROW_NUMBER() OVER (
                   PARTITION BY order_number
                   ORDER BY datetime(updated) DESC, datetime(created) DESC, id DESC
                 ) as rn
          FROM service_orders
          WHERE order_number IS NOT NULL AND order_number != ''
        ) WHERE rn > 1
      )
    `)
      .execute()
  },
  (app) => {
    // Reversão não é necessária / dados duplicados removidos
  },
)
