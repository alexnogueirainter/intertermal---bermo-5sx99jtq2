import pb from '@/lib/pocketbase/client'

export interface QuoteHistoryItem {
  id?: string
  quote_id: string
  field_name: string
  old_value: string
  new_value: string
  changed_by: string
  timestamp: string
  created?: string
}

export interface QuoteSnapshot {
  total: number
  serviceMargin: number
  integrationRequired: boolean
  integrationCost: number
  equipmentModel: string
  equipmentBrand: string
  plateCount: number
  status: string
  techHours: number
  techRate: number
  materialsCost: number
  thirdPartyCost: number
  distanceKm: number
  fuelPrice: number
}

export function extractQuoteSnapshot(obj: any): QuoteSnapshot {
  return {
    total: Number(obj.total ?? obj.final_price ?? 0),
    serviceMargin: Number(obj.serviceMargin ?? obj.service_margin ?? 0),
    integrationRequired: Boolean(
      obj.integrationRequired ?? obj.service_details?.technical?.integrationRequired,
    ),
    integrationCost: Number(
      obj.integrationCost ?? obj.service_details?.technical?.integrationCost ?? 0,
    ),
    equipmentModel: String(obj.equipmentModel ?? obj.equipment_model ?? ''),
    equipmentBrand: String(obj.equipmentBrand ?? obj.equipment_brand ?? ''),
    plateCount: Number(obj.plateCount ?? obj.plate_count ?? 0),
    status: String(obj.status ?? 'draft'),
    techHours: Number(obj.techHours ?? obj.service_details?.labor?.techHours ?? 0),
    techRate: Number(obj.techRate ?? obj.service_details?.labor?.techRate ?? 0),
    materialsCost: Number(obj.materialsCost ?? obj.service_details?.materials?.materialsCost ?? 0),
    thirdPartyCost: Number(obj.thirdPartyCost ?? obj.service_details?.costs?.thirdPartyCost ?? 0),
    distanceKm: Number(obj.distanceKm ?? obj.service_details?.travel?.distanceKm ?? 0),
    fuelPrice: Number(obj.fuelPrice ?? obj.service_details?.travel?.fuelPrice ?? 0),
  }
}

export interface DiffEntry {
  field_name: string
  old_value: string
  new_value: string
}

const FIELD_LABELS: Record<keyof QuoteSnapshot, string> = {
  total: 'Valor Total',
  serviceMargin: 'Margem de Serviço',
  integrationRequired: 'Exigência de Integração',
  integrationCost: 'Custo de Integração',
  equipmentModel: 'Modelo do Equipamento',
  equipmentBrand: 'Marca do Equipamento',
  plateCount: 'Quantidade de Placas',
  status: 'Status da Proposta',
  techHours: 'Horas Técnicas (Mão de Obra)',
  techRate: 'Valor/Hora Técnico',
  materialsCost: 'Custo de Materiais',
  thirdPartyCost: 'Serviços de Terceiros',
  distanceKm: 'Distância / Rota (km)',
  fuelPrice: 'Preço do Combustível',
}

function formatValue(key: keyof QuoteSnapshot, val: any): string {
  if (val === undefined || val === null || val === '') return 'Não informado'
  if (
    key === 'total' ||
    key === 'integrationCost' ||
    key === 'techRate' ||
    key === 'materialsCost' ||
    key === 'thirdPartyCost' ||
    key === 'fuelPrice'
  ) {
    return Number(val).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  }
  if (key === 'serviceMargin') {
    return `${val}%`
  }
  if (key === 'integrationRequired') {
    return val ? 'Sim (Exigida)' : 'Não'
  }
  if (key === 'distanceKm') {
    return `${val} km`
  }
  if (key === 'status') {
    const labels: Record<string, string> = {
      draft: 'Rascunho',
      sent: 'Enviada',
      negotiation: 'Em negociação',
      approved: 'Aprovada',
      rejected: 'Recusada',
      expired: 'Expirada',
    }
    return labels[String(val)] || String(val)
  }
  return String(val)
}

export function computeQuoteDiffs(prev: QuoteSnapshot, curr: QuoteSnapshot): DiffEntry[] {
  const diffs: DiffEntry[] = []
  const keys = Object.keys(FIELD_LABELS) as (keyof QuoteSnapshot)[]

  for (const key of keys) {
    const vOld = prev[key]
    const vNew = curr[key]

    let changed = false
    if (typeof vOld === 'number') {
      changed = Math.abs((vOld || 0) - (Number(vNew) || 0)) > 0.009
    } else if (typeof vOld === 'boolean') {
      changed = Boolean(vOld) !== Boolean(vNew)
    } else {
      changed = String(vOld ?? '').trim() !== String(vNew ?? '').trim()
    }

    if (changed) {
      diffs.push({
        field_name: FIELD_LABELS[key] || key,
        old_value: formatValue(key, vOld),
        new_value: formatValue(key, vNew),
      })
    }
  }

  return diffs
}

export const quoteHistoryService = {
  async recordDiffs(quoteId: string, diffs: DiffEntry[], changedBy: string): Promise<void> {
    if (!quoteId || diffs.length === 0) return

    const nowIso = new Date().toISOString()

    for (const diff of diffs) {
      try {
        await pb.collection('quote_history').create({
          quote_id: quoteId,
          field_name: diff.field_name,
          old_value: diff.old_value,
          new_value: diff.new_value,
          changed_by: changedBy || 'Usuário do Sistema',
          timestamp: nowIso,
        })
      } catch (err) {
        console.warn('Erro ao salvar item no quote_history:', err)
      }
    }
  },

  async getHistoryByQuote(quoteId: string): Promise<QuoteHistoryItem[]> {
    if (!quoteId) return []
    try {
      const records = await pb.collection('quote_history').getFullList<QuoteHistoryItem>({
        filter: `quote_id = "${quoteId}"`,
        sort: '-created',
        requestKey: null,
      })
      return records
    } catch (err) {
      console.warn('Erro ao carregar quote_history:', err)
      return []
    }
  },
}
