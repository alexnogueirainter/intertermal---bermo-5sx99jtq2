migrate(
  (app) => {
    // Exclui definitivamente os dois registros duplicados da coleção 'deals'
    // autorizados pelo usuário:
    // 1. ywuql4dftbu2kdp: "Proposta PROP-2026-4046 — GELITA DO BRASIL", value 508688.29
    //    (o registro correto e atualizado z2p30i2kumvestz, value 372986.40, permanece intacto)
    // 2. ppdko8if95ckarp: "Proposta INT-2026-717 — Richs - Mairinque", value 0
    //    (o registro correto e atualizado ds0yhxkpmjgbhtl, value 4797.31, permanece intacto)
    app
      .db()
      .newQuery("DELETE FROM deals WHERE id IN ('ywuql4dftbu2kdp', 'ppdko8if95ckarp')")
      .execute()
  },
  (app) => {
    // Reversão não aplicável para limpeza de duplicados autorizada
  },
)
