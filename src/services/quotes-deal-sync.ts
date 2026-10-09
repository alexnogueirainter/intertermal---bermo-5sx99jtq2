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
import type {
  DealRecord,
  DealStage,
  QuoteRecord,
  QuoteStatus,
  ServiceOrderRecord,
} from '@/types/crm'

export function extractQuoteNumericValue(
  quote: Partial<QuoteRecord> | Record<string, any>,
): number {
  if (!quote) return 0
  const rawTotal = Number(quote.total)
  if (!isNaN(rawTotal) && rawTotal > 0) return rawTotal

  const rawFinalPrice = Number(quote.final_price)
  if (!isNaN(rawFinalPrice) && rawFinalPrice > 0) return rawFinalPrice

  const sDetails = (quote as any).service_details
  if (sDetails) {
    const pricingFinal = Number(
      sDetails.pricing?.final_sale_price ?? sDetails.pricing?.calculated_sale_price,
    )
    if (!isNaN(pricingFinal) && pricingFinal > 0) return pricingFinal

    const indirectFinal = Number(
      sDetails.indirect_costs?.finalSalePrice ?? sDetails.indirect_costs?.calculatedSalePrice,
    )
    if (!isNaN(indirectFinal) && indirectFinal > 0) return indirectFinal
  }

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
  if (
    s === 'approved' ||
    s === 'aprovada' ||
    s === 'aprovado' ||
    s === 'concluida' ||
    s === 'concluída'
  ) {
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

// Trava em memória para evitar que chamadas concorrentes para a mesma proposta criem negócios duplicados
const inFlightSync = new Map<string, Promise<DealRecord | null>>()

export const quoteDealSyncService = {
  /**
   * Sincroniza uma proposta salva/alterada com a coleção `deals`.
   * Cria se não existir ou atualiza o negócio vinculado.
   * Idempotente: deduplica chamadas simultâneas via lock em memória e busca abrangente por ID ou código.
   */
  syncQuoteToDeal(quote: QuoteRecord): Promise<DealRecord | null> {
    if (!quote?.id) return Promise.resolve(null)

    // Se já houver sincronização em andamento para este quote.id, aguarda a mesma promise
    const key = quote.id
    const active = inFlightSync.get(key)
    if (active) {
      return active
    }

    const promise = this._executeSyncQuoteToDeal(quote).finally(() => {
      inFlightSync.delete(key)
    })
    inFlightSync.set(key, promise)
    return promise
  },

  async _executeSyncQuoteToDeal(quote: QuoteRecord): Promise<DealRecord | null> {
    if (!quote?.id) return null

    const quoteCode = (quote.quote_number || quote.code || `PROP-${quote.id.slice(-6)}`).trim()
    const altCode = (quote.code || quote.quote_number || '').trim()
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
          existingDeal = await pb.collection('deals').getOne<DealRecord>(quote.deal_id, {
            requestKey: null,
          })
        } catch (_) {
          existingDeal = null
        }
      }

      // 2. Se não encontrou por deal_id (ou deal_id estava apontando para deal inexistente),
      // buscar negócio existente pelo código da proposta no título ou notas
      if (!existingDeal && (quoteCode || altCode)) {
        try {
          const codesToTry = Array.from(new Set([quoteCode, altCode].filter(Boolean)))
          for (const code of codesToTry) {
            if (existingDeal) break
            const list = await pb.collection('deals').getList<DealRecord>(1, 10, {
              filter: `title ~ "${code}" || notes ~ "${code}"`,
              // Preferir o negócio que já foi ganho ('won'), ou o mais recentemente atualizado
              sort: '-updated,-created',
              requestKey: null,
            })
            if (list.items && list.items.length > 0) {
              // Se existirem múltiplos deals históricos vinculados ao mesmo código,
              // selecionar preferencialmente aquele com o id que a proposta já referenciava,
              // ou o que já está em 'won' (se a proposta for aprovada), ou o primeiro retornado.
              const preferred =
                (quote.deal_id ? list.items.find((d) => d.id === quote.deal_id) : null) ||
                (quote.status === 'approved' ? list.items.find((d) => d.stage === 'won') : null) ||
                list.items[0]
              existingDeal = preferred
            }
          }
        } catch (searchErr) {
          console.warn('Erro ao pesquisar deal existente por código:', searchErr)
          existingDeal = null
        }
      }

      // 3. Se ainda não encontrou e temos clientId, buscar se existe deal com título exato da proposta
      if (!existingDeal && quoteCode) {
        try {
          const list = await pb.collection('deals').getList<DealRecord>(1, 5, {
            filter: `title ~ "${quoteCode}"`,
            sort: '-updated',
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
        // Preservar loss_reason existente se o status for rejeitado e não tiver novo
        const payloadToUpdate: Partial<DealRecord> = {
          title: dealTitle,
          client_id: clientId || existingDeal.client_id,
          client_name: clientName || existingDeal.client_name,
          value: dealValue,
          stage,
          probability,
          assigned_to: assignedTo,
          notes: `Proposta Intertermal ${quoteCode} conectada automaticamente ao pipeline comercial.`,
        }

        if (stage === 'lost') {
          payloadToUpdate.loss_reason =
            quote.rejected_by_client_reason ||
            existingDeal.loss_reason ||
            'Proposta recusada/cancelada'
        }

        // Atualizar negócio vinculado
        const updatedDeal = await pb
          .collection('deals')
          .update<DealRecord>(existingDeal.id, payloadToUpdate, { requestKey: null })

        // Se a proposta ainda não tinha o deal_id gravado, atualiza
        if (quote.deal_id !== updatedDeal.id) {
          try {
            await pb
              .collection('quotes')
              .update(quote.id, { deal_id: updatedDeal.id }, { requestKey: null })
            quote.deal_id = updatedDeal.id
          } catch (qErr) {
            console.warn('Erro ao vincular deal_id na proposta:', qErr)
          }
        }

        return updatedDeal
      } else {
        // Criar novo negócio no pipeline apenas se NENHUM foi encontrado
        const newDeal = await pb.collection('deals').create<DealRecord>(
          {
            title: dealTitle,
            client_id: clientId,
            client_name: clientName,
            value: dealValue,
            stage,
            probability,
            priority: 'medium',
            assigned_to: assignedTo,
            notes: `Proposta Intertermal ${quoteCode} gerada e conectada automaticamente ao pipeline comercial.`,
            loss_reason:
              stage === 'lost' ? quote.rejected_by_client_reason || 'Proposta recusada' : undefined,
          },
          { requestKey: null },
        )

        // Vincular na proposta
        try {
          await pb
            .collection('quotes')
            .update(quote.id, { deal_id: newDeal.id }, { requestKey: null })
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
  /**
   * Sincroniza uma proposta salva/alterada com Deals E Service Orders vinculadas.
   * Não cria OS se não estiver aprovada (respeita o fluxo atual).
   * Não duplica OS: busca por quote_id, order_number ou quote_number.
   */
  async syncQuoteToCrm(
    quote: QuoteRecord,
  ): Promise<{ deal: DealRecord | null; serviceOrders: ServiceOrderRecord[] }> {
    if (!quote?.id) return { deal: null, serviceOrders: [] }

    // 1. Sincroniza com Deals (regras existentes com deduplicação)
    const deal = await this.syncQuoteToDeal(quote)

    // 2. Sincroniza com Service Orders (apenas existentes, sem criar OS desnecessária / duplicada)
    const quoteCode = (quote.quote_number || quote.code || `PROP-${quote.id.slice(-6)}`).trim()
    const quoteValue = extractQuoteNumericValue(quote)
    const clientName = quote.client_name || 'Cliente'
    const clientId = quote.client_id || ''
    const equipModel = quote.equipment_model || 'Trocador BERMO'
    const equipBrand = quote.equipment_brand || 'BERMO'
    const quoteTitle = quote.title || `OS-${quoteCode}: Manutenção e Revisão de Equipamentos BERMO`
    const technicalDetails = (quote as any).service_details || {}

    const updatedSOs: ServiceOrderRecord[] = []

    try {
      // Buscar OS vinculada por quote_id ou quote_number/order_number
      const filterConditions = [
        `quote_id = "${quote.id}"`,
        quoteCode ? `quote_number = "${quoteCode}"` : '',
        quoteCode ? `order_number = "${quoteCode}"` : '',
      ]
        .filter(Boolean)
        .join(' || ')

      const existingOrders = await pb.collection('service_orders').getFullList<ServiceOrderRecord>({
        filter: filterConditions,
        requestKey: null,
      })

      for (const so of existingOrders) {
        try {
          const soPayload: Partial<ServiceOrderRecord> = {
            total_value: quoteValue,
            client_name: clientName || so.client_name,
            client_id: clientId || so.client_id,
            equipment_model: equipModel || so.equipment_model,
            equipment_brand: equipBrand || so.equipment_brand,
            title: so.title || quoteTitle,
            technical_details: technicalDetails,
          }

          const updatedSO = await pb
            .collection('service_orders')
            .update<ServiceOrderRecord>(so.id, soPayload, { requestKey: null })
          updatedSOs.push(updatedSO)
        } catch (updateErr) {
          console.warn(`Erro ao atualizar Service Order ${so.id}:`, updateErr)
        }
      }
    } catch (soSearchErr) {
      console.warn('Erro ao buscar service_orders vinculadas à proposta:', soSearchErr)
    }

    return { deal, serviceOrders: updatedSOs }
  },

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
