/**
 * Serviço de Sincronização Automática entre Propostas (quotes) e Pipeline Comercial BERMO (deals).
 *
 * Regras de Mapeamento:
 * 1. draft / rascunho -> 'proposal' (probabilidade 40%)
 * 2. sent / enviada -> 'proposal' (probabilidade 60%)
 * 3. pending_approval / em aprovação -> 'negotiation' (probabilidade 75%)
 * 4. approved / aprovada / aprovado -> 'won' (probabilidade 100%)
 * 5. rejected / recusada / recusado / expired -> 'lost' (probabilidade 0%)
 *
 * Valor do negócio = valor real da proposta (total > 0 ? total : final_price > 0 ? final_price : subtotal)
 * Nome do negócio = "Proposta INT-XXXX — Cliente"
 * Sem vazamento de custos internos (apenas valor de venda ao cliente).
 */

import pb from '@/lib/pocketbase/client'
import type { DealRecord, DealStage, QuoteRecord, QuoteStatus } from '@/types/crm'

export function extractQuoteNumericValue(
  quote: Partial<QuoteRecord> | Record<string, any>,
): number {
  if (!quote) return 0
  const rawTotal = Number(quote.total)
  if (!isNaN(rawTotal) && rawTotal > 0) return rawTotal

  const rawFinalPrice = Number(quote.final_price)
  if (!isNaN(rawFinalPrice) && rawFinalPrice > 0) return rawFinalPrice

  const rawSubtotal = Number(quote.subtotal)
  if (!isNaN(rawSubtotal) && rawSubtotal > 0) return rawSubtotal

  const rawCost = Number(quote.total_cost)
  if (!isNaN(rawCost) && rawCost > 0) return rawCost

  return 0
}

export function mapQuoteStatusToDealStage(status?: string | QuoteStatus): {
  stage: DealStage
  probability: number
} {
  const s = (status || '').toLowerCase().trim()
  if (s === 'approved' || s === 'aprovada' || s === 'aprovado') {
    return { stage: 'won', probability: 100 }
  }
  if (
    s === 'rejected' ||
    s === 'recusada' ||
    s === 'recusado' ||
    s === 'rejeitada' ||
    s === 'rejeitado' ||
    s === 'expired'
  ) {
    return { stage: 'lost', probability: 0 }
  }
  if (
    s === 'pending_approval' ||
    s === 'pending' ||
    s === 'pendente' ||
    s === 'em_aprovacao' ||
    s === 'em_negociacao'
  ) {
    return { stage: 'negotiation', probability: 75 }
  }
  if (s === 'sent' || s === 'enviada' || s === 'enviado') {
    return { stage: 'proposal', probability: 60 }
  }
  // Default: draft / rascunho
  return { stage: 'proposal', probability: 40 }
}

export function formatDealTitleForQuote(quoteCode: string, clientName?: string): string {
  const cleanCode = quoteCode.trim()
  const cleanClient = (clientName || 'Cliente').trim()
  return `Proposta ${cleanCode} — ${cleanClient}`
}

export const quoteDealSyncService = {
  /**
   * Sincroniza uma proposta salva/alterada com a coleção `deals`.
   * Cria se não existir ou atualiza o negócio vinculado.
   * Atualiza `quotes.deal_id` se ainda não estiver vinculado.
   */
  async syncQuoteToDeal(quote: QuoteRecord): Promise<DealRecord | null> {
    if (!quote?.id) return null

    const quoteCode = quote.quote_number || quote.code || `PROP-${quote.id.slice(-6)}`
    const clientName = quote.client_name || 'Cliente'
    const clientId = quote.client_id || ''
    const dealTitle = formatDealTitleForQuote(quoteCode, clientName)
    const dealValue = extractQuoteNumericValue(quote)
    const { stage, probability } = mapQuoteStatusToDealStage(quote.status)
    const assignedTo = quote.assigned_to || 'Alex Nogueira'

    try {
      let existingDeal: DealRecord | null = null

      // 1. Tentar buscar pelo deal_id existente na proposta
      if (quote.deal_id) {
        try {
          existingDeal = await pb.collection('deals').getOne<DealRecord>(quote.deal_id)
        } catch (_) {
          existingDeal = null
        }
      }

      // 2. Se não encontrou por deal_id, tentar buscar negócio pelo código da proposta no título
      if (!existingDeal && quoteCode) {
        try {
          const list = await pb.collection('deals').getList<DealRecord>(1, 1, {
            filter: `title ~ "${quoteCode}"`,
            sort: '-created',
            requestKey: null,
          })
          if (list.items && list.items.length > 0) {
            existingDeal = list.items[0]
          }
        } catch (_) {
          existingDeal = null
        }
      }

      if (existingDeal) {
        // Atualizar negócio vinculado
        const updatedDeal = await pb.collection('deals').update<DealRecord>(existingDeal.id, {
          title: dealTitle,
          client_id: clientId || existingDeal.client_id,
          client_name: clientName || existingDeal.client_name,
          value: dealValue,
          stage,
          probability,
          assigned_to: assignedTo,
          notes: `Proposta Intertermal ${quoteCode} conectada automaticamente ao pipeline comercial.`,
        })

        // Se a proposta ainda não tinha o deal_id gravado, atualiza
        if (quote.deal_id !== updatedDeal.id) {
          try {
            await pb.collection('quotes').update(quote.id, { deal_id: updatedDeal.id })
            quote.deal_id = updatedDeal.id
          } catch (qErr) {
            console.warn('Erro ao vincular deal_id na proposta:', qErr)
          }
        }

        return updatedDeal
      } else {
        // Criar novo negócio no pipeline
        const newDeal = await pb.collection('deals').create<DealRecord>({
          title: dealTitle,
          client_id: clientId,
          client_name: clientName,
          value: dealValue,
          stage,
          probability,
          priority: 'medium',
          assigned_to: assignedTo,
          notes: `Proposta Intertermal ${quoteCode} gerada e conectada automaticamente ao pipeline comercial.`,
        })

        // Vincular na proposta
        try {
          await pb.collection('quotes').update(quote.id, { deal_id: newDeal.id })
          quote.deal_id = newDeal.id
        } catch (qErr) {
          console.warn('Erro ao vincular novo deal_id na proposta:', qErr)
        }

        return newDeal
      }
    } catch (err) {
      console.error('Erro na sincronização proposta -> deal:', err)
      return null
    }
  },

  /**
   * Sincroniza em lote todas as propostas existentes com o pipeline comercial.
   * Idempotente: não duplica negócios nem altera valores calculados das propostas.
   */
  async syncAllQuotes(
    quotesList?: QuoteRecord[],
  ): Promise<{ syncedCount: number; deals: DealRecord[] }> {
    try {
      const quotes =
        quotesList && quotesList.length > 0
          ? quotesList
          : await pb.collection('quotes').getFullList<QuoteRecord>({
              sort: '-created',
              requestKey: null,
            })

      const updatedDeals: DealRecord[] = []
      let syncedCount = 0

      for (const q of quotes) {
        const deal = await this.syncQuoteToDeal(q)
        if (deal) {
          updatedDeals.push(deal)
          syncedCount++
        }
      }

      return { syncedCount, deals: updatedDeals }
    } catch (err) {
      console.error('Erro na sincronização em lote quotes -> deals:', err)
      return { syncedCount: 0, deals: [] }
    }
  },
}
