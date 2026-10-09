import type { QuoteRecord, ServiceOrderRecord } from '@/types/crm'

/**
 * Localiza dinamicamente o valor vivo da proposta vinculada a uma Ordem de Serviço (OS).
 * Se a proposta vinculada for encontrada (via order.quote_id ou order.quote_number/order_number),
 * retorna `quote.total || quote.final_price || quote.subtotal`.
 * Caso contrário, faz fallback seguro para `order.total_value || order.final_price || 0`.
 */
export function resolveServiceOrderLiveValue(
  order: Partial<ServiceOrderRecord> | null | undefined,
  quotes?: QuoteRecord[] | null,
): number {
  if (!order) return 0

  if (quotes && quotes.length > 0) {
    const quoteId = order.quote_id?.trim()
    const quoteNum = (order.quote_number || '').trim().toLowerCase()
    const orderNum = (order.order_number || '').trim().toLowerCase()

    const linkedQuote = quotes.find((q) => {
      if (quoteId && q.id === quoteId) return true
      const qCode = (q.quote_number || q.code || '').trim().toLowerCase()
      if (
        quoteNum &&
        qCode &&
        (qCode === quoteNum || qCode.includes(quoteNum) || quoteNum.includes(qCode))
      ) {
        return true
      }
      if (
        orderNum &&
        qCode &&
        (qCode === orderNum || qCode.includes(orderNum) || orderNum.includes(qCode))
      ) {
        return true
      }
      return false
    })

    if (linkedQuote) {
      const qTotal = Number(linkedQuote.total)
      if (!isNaN(qTotal) && qTotal > 0) return qTotal

      const qFinalPrice = Number(linkedQuote.final_price)
      if (!isNaN(qFinalPrice) && qFinalPrice > 0) return qFinalPrice

      const sDetails = (linkedQuote as any).service_details
      if (sDetails) {
        const pricingFinal = Number(
          sDetails.pricing?.final_sale_price ?? sDetails.pricing?.calculated_sale_price,
        )
        if (!isNaN(pricingFinal) && pricingFinal > 0) return pricingFinal
      }

      const qSubtotal = Number(linkedQuote.subtotal)
      if (!isNaN(qSubtotal) && qSubtotal > 0) return qSubtotal
    }
  }

  const rawTotal = Number(order.total_value)
  if (!isNaN(rawTotal) && rawTotal > 0) return rawTotal

  const rawFinal = Number(order.final_price)
  if (!isNaN(rawFinal) && rawFinal > 0) return rawFinal

  return 0
}
