import type { OsExecutionReportRecord, QuoteRecord, ServiceOrderRecord } from '@/types/crm'

/**
 * Custo PREVISTO da OS = custo direto total da proposta de origem.
 * Fonte: internal_cost da OS (copiado da proposta na aprovação) ou, como fallback,
 * o total_cost da própria proposta vinculada.
 * Retorna null quando não há custo previsto informado.
 */
export function resolveOrderPlannedCost(
  order: Partial<ServiceOrderRecord> | null | undefined,
  quotes?: QuoteRecord[] | null,
): number | null {
  if (!order) return null

  const internal = Number(order.internal_cost)
  if (!isNaN(internal) && internal > 0) return internal

  if (quotes && quotes.length > 0) {
    const quoteId = order.quote_id?.trim()
    const quoteNum = (order.quote_number || '').trim().toLowerCase()
    const orderNum = (order.order_number || '').trim().toLowerCase()

    const linkedQuote = quotes.find((q) => {
      if (quoteId && q.id === quoteId) return true
      const qCode = (q.quote_number || q.code || '').trim().toLowerCase()
      if (quoteNum && qCode && (qCode === quoteNum || quoteNum.includes(qCode))) return true
      if (orderNum && qCode && (qCode === orderNum || orderNum.includes(qCode))) return true
      return false
    })

    if (linkedQuote) {
      const tc = Number((linkedQuote as any).total_cost)
      if (!isNaN(tc) && tc > 0) return tc
    }
  }

  return null
}

/**
 * Custo REAL da OS = soma dos custos lançados nos relatórios de execução:
 * insumos (quantidade × custo unitário) + horas extras (valor total).
 * Retorna null quando nada foi lançado ainda.
 */
export function resolveOrderRealCost(reports?: OsExecutionReportRecord[] | null): number | null {
  if (!reports || reports.length === 0) return null

  let total = 0
  let hasAny = false

  for (const rep of reports) {
    if (Array.isArray(rep.materials_used)) {
      for (const mat of rep.materials_used) {
        const unitCost = Number((mat as any).unit_cost)
        const qty = Number(mat.quantity)
        if (!isNaN(unitCost) && unitCost > 0) {
          total += unitCost * (isNaN(qty) || qty === 0 ? 1 : qty)
          hasAny = true
        }
      }
    }
    if (Array.isArray(rep.extra_hours)) {
      for (const eh of rep.extra_hours) {
        const cost = Number(eh.total_cost)
        if (!isNaN(cost) && cost > 0) {
          total += cost
          hasAny = true
        }
      }
    }
  }

  return hasAny ? total : null
}

export interface OrderMargins {
  /** Preço final da OS (valor vivo da proposta vinculada) */
  price: number
  /** Custo previsto (proposta) — null quando não informado */
  plannedCost: number | null
  /** Custo real (relatórios de execução) — null quando nada lançado */
  realCost: number | null
  /** Margem prevista % — null sem custo previsto */
  plannedMargin: number | null
  /** Margem realizada % — null sem custo real */
  realMargin: number | null
}

export function computeOrderMargins(
  order: Partial<ServiceOrderRecord> | null | undefined,
  price: number,
  quotes?: QuoteRecord[] | null,
  reports?: OsExecutionReportRecord[] | null,
): OrderMargins {
  const plannedCost = resolveOrderPlannedCost(order, quotes)
  const realCost = resolveOrderRealCost(reports)

  const plannedMargin =
    plannedCost !== null && price > 0 ? ((price - plannedCost) / price) * 100 : null
  const realMargin = realCost !== null && price > 0 ? ((price - realCost) / price) * 100 : null

  return {
    price,
    plannedCost,
    realCost,
    plannedMargin,
    realMargin,
  }
}
