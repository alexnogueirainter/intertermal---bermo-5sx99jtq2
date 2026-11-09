// Padronização de status de propostas (Alex, 09/11):
// valores únicos: draft, sent, negotiation, approved, rejected, expired.
// Converte registros legados (qualquer variação em português ou valor antigo)
// para o valor canônico. Idempotente: só altera o que estiver fora do padrão.
migrate(
  (app) => {
    const MAP = {
      rascunho: 'draft',
      enviada: 'sent',
      enviado: 'sent',
      em_negociacao: 'negotiation',
      'em negociação': 'negotiation',
      'em negociacao': 'negotiation',
      negociacao: 'negotiation',
      pending_approval: 'negotiation',
      pending: 'negotiation',
      pendente: 'negotiation',
      em_aprovacao: 'negotiation',
      aprovada: 'approved',
      aprovado: 'approved',
      concluida: 'approved',
      concluída: 'approved',
      recusada: 'rejected',
      recusado: 'rejected',
      rejeitada: 'rejected',
      rejeitado: 'rejected',
    }

    let quotes = []
    try {
      quotes = app.findRecordsByFilter('quotes', 'id != ""', '-created', 500, 0)
    } catch (e) {
      console.log('Migração 0069: nenhuma proposta encontrada:', e)
      return
    }

    let converted = 0
    for (const q of quotes) {
      const raw = String(q.getString('status') || '')
        .toLowerCase()
        .trim()
      const target = MAP[raw]
      if (target && raw !== target) {
        q.set('status', target)
        app.save(q)
        converted++
        console.log(`Migração 0069: proposta ${q.id} '${raw}' -> '${target}'`)
      }
    }
    console.log(`Migração 0069 concluída: ${converted} proposta(s) convertida(s).`)
  },
  (app) => {
    // Reversão não destrutiva: sem volta para valores legados (padrão único).
  },
)
