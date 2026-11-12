import pb from '@/lib/pocketbase/client'

/**
 * Dados do Checklist Digital para o dashboard gerencial (sub-aba Execução em Campo).
 * Lê os metadados de os_checklists (leve: sem answers/texts) e cruza com as OS
 * em execução para montar KPIs, alerta de parado e lista por técnico.
 */

export interface ChecklistSummary {
  id: string
  service_order_id: string
  os_number: string
  template: string
  client_name: string
  technician_name: string
  status: 'rascunho' | 'concluido' | string
  conformity_pct: number
  verdict: string
  economia_ano: number
  completed_at: string
  created: string
  updated: string
}

export interface ChecklistDashboardData {
  checklists: ChecklistSummary[]
  error: boolean
}

export async function fetchChecklistsForDashboard(): Promise<ChecklistDashboardData> {
  try {
    const res = (await pb.send('/backend/v1/checklists/list', { method: 'GET' })) as any
    if (res && res.ok && Array.isArray(res.checklists)) {
      return { checklists: res.checklists as ChecklistSummary[], error: false }
    }
    return { checklists: [], error: false }
  } catch (_) {
    return { checklists: [], error: true }
  }
}

/** Dias úteis (aproximação: dias corridos − fins de semana) desde a última alteração. */
export function businessDaysSince(isoDate: string): number {
  if (!isoDate) return 0
  const then = new Date(isoDate.replace(' ', 'T'))
  if (isNaN(then.getTime())) return 0
  const now = new Date()
  let days = 0
  const cur = new Date(then)
  while (cur < now) {
    cur.setDate(cur.getDate() + 1)
    const wd = cur.getDay()
    if (wd !== 0 && wd !== 6) days++
  }
  return days
}

export interface ChecklistKpis {
  total: number
  concluidos: number
  abertos: number
  conformidadeMedia: number
  aprovados: number
  ressalvas: number
  reprovados: number
  economiaTotal: number
  parados: ChecklistSummary[] // rascunho sem alteração há >2 dias úteis
  porTecnico: Array<{
    nome: string
    concluidos: number
    abertos: number
    conformidadeMedia: number
  }>
}

export function computeChecklistKpis(
  checklists: ChecklistSummary[],
  serviceOrders: Array<{ id: string; status?: string; assigned_to?: string }>,
): ChecklistKpis {
  const concluidos = checklists.filter((c) => c.status === 'concluido')
  const abertos = checklists.filter((c) => c.status !== 'concluido')

  const comConformidade = concluidos.filter((c) => c.conformity_pct > 0)
  const conformidadeMedia = comConformidade.length
    ? Math.round(comConformidade.reduce((s, c) => s + c.conformity_pct, 0) / comConformidade.length)
    : 0

  const aprovados = concluidos.filter((c) => c.verdict === 'aprovado').length
  const ressalvas = concluidos.filter((c) => c.verdict === 'ressalvas').length
  const reprovados = concluidos.filter((c) => c.verdict === 'reprovado').length
  const economiaTotal = concluidos.reduce((s, c) => s + (c.economia_ano || 0), 0)

  // OS em execução com checklist aberto (rascunho) — e alerta de parado >2 dias úteis
  const osEmExecucao = new Set(
    serviceOrders
      .filter((so) => {
        const s = String(so.status || '').toLowerCase()
        return s === 'execucao' || s === 'in_execution' || s === 'in_progress' || s === 'approved'
      })
      .map((so) => so.id),
  )
  const parados = abertos.filter((c) => {
    if (!osEmExecucao.has(c.service_order_id)) return false
    return businessDaysSince(c.updated) > 2
  })

  // Por técnico
  const tecMap = new Map<
    string,
    { concluidos: number; abertos: number; confSum: number; confN: number }
  >()
  for (const c of checklists) {
    const nome = c.technician_name || 'Sem responsável'
    const cur = tecMap.get(nome) || { concluidos: 0, abertos: 0, confSum: 0, confN: 0 }
    if (c.status === 'concluido') {
      cur.concluidos++
      if (c.conformity_pct > 0) {
        cur.confSum += c.conformity_pct
        cur.confN++
      }
    } else {
      cur.abertos++
    }
    tecMap.set(nome, cur)
  }
  const porTecnico = Array.from(tecMap.entries())
    .map(([nome, v]) => ({
      nome,
      concluidos: v.concluidos,
      abertos: v.abertos,
      conformidadeMedia: v.confN ? Math.round(v.confSum / v.confN) : 0,
    }))
    .sort((a, b) => b.concluidos - a.concluidos || b.abertos - a.abertos)

  return {
    total: checklists.length,
    concluidos: concluidos.length,
    abertos: abertos.length,
    conformidadeMedia,
    aprovados,
    ressalvas,
    reprovados,
    economiaTotal,
    parados,
    porTecnico,
  }
}
