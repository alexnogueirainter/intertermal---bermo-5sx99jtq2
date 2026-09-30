import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import printStyles from './ExecutiveReportPrint.css?inline'
import { FileDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type {
  ActivityRecord,
  ClientRecord,
  DealRecord,
  QuoteRecord,
  ServiceOrderRecord,
  TicketRecord,
} from '@/types/crm'
import type { FieldVisitRecord } from '@/services/field-visits'

type PeriodFilter = 'all' | 'month' | 'quarter' | 'year' | 'custom'
type QuoteBucket = 'approved' | 'pending' | 'rejected' | 'other'
interface ExecutiveReportProps {
  clients: ClientRecord[]
  deals: DealRecord[]
  quotes: QuoteRecord[]
  tickets: TicketRecord[]
  activities?: ActivityRecord[]
  serviceOrders: ServiceOrderRecord[]
  fieldVisits: FieldVisitRecord[]
  fieldVisitsError?: boolean
  periodFilter: PeriodFilter
  periodLabel: string
  customStartDate?: string
  customEndDate?: string
  onPopupBlocked?: () => void
}
interface Row {
  key: string
  label: string
  count: number
  value: number
}
interface ClientGroup {
  key: string
  name: string
  count: number
  approved: number
  pending: number
  total: number
}
interface ReportData {
  generated: Date
  period: string
  proposals: {
    total: number
    approved: number
    pending: number
    rejected: number
    other: number
    approvedValue: number
    pendingValue: number
    rejectedValue: number
    otherValue: number
    rate: number | null
    missingLossReasons: number
  }
  pipeline: { deals: DealRecord[]; value: number; stages: Row[] }
  operations: {
    active: ServiceOrderRecord[]
    value: number
    high: number
    unassigned: number
    statuses: Row[]
  }
  clients: { total: number; active: number; leads: number; top: ClientGroup[] }
  visits: { count: number | null; latest: FieldVisitRecord | null }
  tickets: { open: number; urgent: number }
  overdueActivities: number
  actions: string[]
}

const APPROVED = new Set(['approved', 'aprovada', 'aprovado', 'concluida', 'concluída'])
const PENDING = new Set([
  'sent',
  'enviada',
  'enviado',
  'pending_approval',
  'pending',
  'pendente',
  'em_negociacao',
  'em negociação',
  'em_aprovacao',
  'em aprovação',
])
const REJECTED = new Set(['rejected', 'recusada', 'recusado', 'rejeitada', 'rejeitado'])
const TERMINAL_ORDERS = new Set([
  'fechado',
  'closed',
  'completed',
  'concluido',
  'concluida',
  'cancelled',
  'canceled',
  'cancelado',
  'cancelada',
  'rejected',
  'rejeitado',
  'rejeitada',
])
const OPEN_TICKETS = new Set(['open', 'in_progress', 'waiting', 'aberto', 'em_andamento'])
const STAGE_LABELS: Record<string, string> = {
  lead: 'Lead',
  prospecting: 'Prospecção',
  qualification: 'Qualificação',
  contact: 'Contato',
  proposal: 'Proposta',
  negotiation: 'Negociação',
}
const ORDER_LABELS: Record<string, string> = {
  vistoria: 'Vistoria',
  proposta: 'Proposta',
  execucao: 'Execução',
  in_execution: 'Execução',
  in_progress: 'Em andamento',
  inspecao: 'Inspeção',
  pending_approval: 'Aguardando aprovação',
  pending: 'Pendente',
  approved: 'Aprovada',
}
const C = {
  teal: '#087E83',
  green: '#27845D',
  amber: '#D68A22',
  red: '#C65152',
  blue: '#4D79B8',
  purple: '#7861A8',
  track: '#E8EEF3',
}
const norm = (value?: string | null) =>
  String(value || '')
    .trim()
    .toLowerCase()
const number = (value: unknown) => {
  const result = Number(value)
  return Number.isFinite(result) ? result : 0
}
function bucket(status?: string): QuoteBucket {
  const s = norm(status)
  return APPROVED.has(s)
    ? 'approved'
    : PENDING.has(s)
      ? 'pending'
      : REJECTED.has(s)
        ? 'rejected'
        : 'other'
}
function quoteValue(q: QuoteRecord) {
  for (const raw of [q.total, q.final_price, q.subtotal, q.total_cost]) {
    const n = number(raw)
    if (n > 0) return n
  }
  return 0
}
function money(n: number) {
  if (Math.abs(n) >= 1_000_000)
    return `R$ ${(n / 1_000_000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} mi`
  if (Math.abs(n) >= 10_000)
    return `R$ ${(n / 1_000).toLocaleString('pt-BR', { maximumFractionDigits: 0 })} mil`
  if (Math.abs(n) >= 1_000)
    return `R$ ${(n / 1_000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} mil`
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
}
function parseDate(value?: string | null): Date | null {
  if (!value) return null
  const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})$/)
  const d = match ? new Date(+match[1], +match[2] - 1, +match[3]) : new Date(value)
  return Number.isNaN(d.getTime()) ? null : d
}
function inPeriod(value: string | undefined, p: ExecutiveReportProps, now: Date) {
  if (p.periodFilter === 'all') return true
  const d = parseDate(value)
  if (!d) return false
  let from: Date | null = null
  let to: Date | null = now
  if (p.periodFilter === 'month') from = new Date(now.getFullYear(), now.getMonth(), 1)
  else if (p.periodFilter === 'quarter')
    from = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1)
  else if (p.periodFilter === 'year') from = new Date(now.getFullYear(), 0, 1)
  else {
    from = p.customStartDate ? parseDate(p.customStartDate) : null
    const end = p.customEndDate ? parseDate(p.customEndDate) : null
    to = end ? new Date(end.getFullYear(), end.getMonth(), end.getDate(), 23, 59, 59, 999) : null
  }
  return (!from || d >= from) && (!to || d <= to)
}
function labelFor(value?: string) {
  const s = norm(value)
  return (
    ORDER_LABELS[s] ||
    STAGE_LABELS[s] ||
    (s ? s.replace(/[_-]+/g, ' ').replace(/^\p{L}/u, (l) => l.toUpperCase()) : 'Não informado')
  )
}

function makeReport(p: ExecutiveReportProps, generated: Date): ReportData {
  const totals = {
    approved: { count: 0, value: 0 },
    pending: { count: 0, value: 0 },
    rejected: { count: 0, value: 0 },
    other: { count: 0, value: 0 },
  }
  const clientNames = new Map(
    p.clients.map((c) => [c.id, c.name || c.company_name || 'Cliente sem nome']),
  )
  const groups = new Map<string, ClientGroup>()
  let missingLossReasons = 0
  let staleCount = 0
  for (const q of p.quotes) {
    const b = bucket(q.status),
      v = quoteValue(q)
    totals[b].count += 1
    totals[b].value += v
    const key = q.client_id || norm(q.client_name) || 'sem-cliente'
    const group = groups.get(key) || {
      key,
      name: q.client_name || clientNames.get(q.client_id) || 'Cliente sem nome',
      count: 0,
      approved: 0,
      pending: 0,
      total: 0,
    }
    group.count += 1
    group.total += v
    if (b === 'approved') group.approved += v
    if (b === 'pending') {
      group.pending += v
      const updated = parseDate(q.updated || q.created)
      if (updated && Math.floor((generated.getTime() - updated.getTime()) / 86_400_000) >= 5)
        staleCount += 1
    }
    if (b === 'rejected' && !String(q.rejected_by_client_reason || '').trim())
      missingLossReasons += 1
    groups.set(key, group)
  }
  const decided = totals.approved.count + totals.rejected.count
  const pipeline = p.deals.filter(
    (d) => !['won', 'lost', 'ganho', 'perdido'].includes(norm(d.stage)),
  )
  const stageMap = new Map<string, Row>()
  for (const d of pipeline) {
    const key = norm(d.stage) || 'outro',
      row = stageMap.get(key) || {
        key,
        label: STAGE_LABELS[key] || labelFor(d.stage),
        count: 0,
        value: 0,
      }
    row.count += 1
    row.value += Math.max(0, number(d.value))
    stageMap.set(key, row)
  }
  const stageOrder = ['lead', 'prospecting', 'qualification', 'contact', 'proposal', 'negotiation']
  const stages = [
    ...stageOrder.map((k) => stageMap.get(k)).filter((r): r is Row => Boolean(r)),
    ...Array.from(stageMap.values()).filter((r) => !stageOrder.includes(r.key)),
  ]
  const activeOrders = p.serviceOrders.filter((o) => !TERMINAL_ORDERS.has(norm(o.status)))
  const orderMap = new Map<string, Row>()
  for (const o of activeOrders) {
    const key = norm(o.status) || 'outro',
      row = orderMap.get(key) || {
        key,
        label: ORDER_LABELS[key] || labelFor(o.status),
        count: 0,
        value: 0,
      }
    row.count += 1
    row.value += Math.max(0, number(o.total_value ?? o.final_price))
    orderMap.set(key, row)
  }
  const statuses = Array.from(orderMap.values()).sort((a, b) => b.count - a.count)
  const visits = p.fieldVisits
    .filter((v) => inPeriod(v.visit_date || v.sent_at || v.created, p, generated))
    .sort(
      (a, b) =>
        (parseDate(b.visit_date || b.sent_at || b.created)?.getTime() || 0) -
        (parseDate(a.visit_date || a.sent_at || a.created)?.getTime() || 0),
    )
  const openTickets = p.tickets.filter((t) => OPEN_TICKETS.has(norm(t.status)))
  const urgentTickets = openTickets.filter((t) =>
    ['high', 'urgent', 'alta', 'urgente'].includes(norm(t.priority)),
  ).length
  const pendingActivities = (p.activities || []).filter(
    (a) => norm(a.status) === 'pending' || (!a.status && a.completed !== true),
  )
  const overdueActivities = pendingActivities.filter((a) => {
    const d = parseDate(a.due_date)
    return Boolean(
      d && d < new Date(generated.getFullYear(), generated.getMonth(), generated.getDate()),
    )
  }).length
  const high = activeOrders.filter((o) =>
    ['high', 'urgent', 'alta', 'urgente'].includes(norm(o.priority)),
  ).length
  const unassigned = activeOrders.filter((o) => !String(o.assigned_to || '').trim()).length
  const actions: string[] = []
  if (staleCount)
    actions.push(
      `${staleCount} proposta(s) em aberto sem atualização há 5+ dias; confirmar follow-up e próximo passo.`,
    )
  if (missingLossReasons)
    actions.push(
      `${missingLossReasons} recusa(s) sem motivo registrado; documentar antes de revisar preço.`,
    )
  if (high)
    actions.push(`${high} OS ativa(s) prioritária(s); confirmar responsável e plano de execução.`)
  if (unassigned) actions.push(`${unassigned} OS ativa(s) sem responsável informado.`)
  if (urgentTickets)
    actions.push(`${urgentTickets} chamado(s) aberto(s) de prioridade alta/urgente.`)
  if (overdueActivities)
    actions.push(`${overdueActivities} atividade(s) vencida(s) ainda pendente(s).`)
  if (!actions.length)
    actions.push(
      'Sem alertas calculáveis pelos campos disponíveis; confirmar próximos passos com os responsáveis.',
    )
  return {
    generated,
    period: p.periodLabel,
    proposals: {
      total: p.quotes.length,
      approved: totals.approved.count,
      pending: totals.pending.count,
      rejected: totals.rejected.count,
      other: totals.other.count,
      approvedValue: totals.approved.value,
      pendingValue: totals.pending.value,
      rejectedValue: totals.rejected.value,
      otherValue: totals.other.value,
      rate: decided ? (totals.approved.count / decided) * 100 : null,
      missingLossReasons,
    },
    pipeline: {
      deals: pipeline,
      value: pipeline.reduce((s, d) => s + Math.max(0, number(d.value)), 0),
      stages,
    },
    operations: {
      active: activeOrders,
      value: activeOrders.reduce(
        (s, o) => s + Math.max(0, number(o.total_value ?? o.final_price)),
        0,
      ),
      high,
      unassigned,
      statuses,
    },
    clients: {
      total: p.clients.length,
      active: p.clients.filter((c) => ['active', 'partner'].includes(norm(c.status))).length,
      leads: p.clients.filter((c) => ['lead', 'prospect'].includes(norm(c.status))).length,
      top: Array.from(groups.values())
        .sort((a, b) => b.total - a.total || b.count - a.count)
        .slice(0, 4),
    },
    visits: {
      count: p.fieldVisitsError ? null : visits.length,
      latest: p.fieldVisitsError ? null : visits[0] || null,
    },
    tickets: { open: openTickets.length, urgent: urgentTickets },
    overdueActivities,
    actions,
  }
}

function Donut({ items }: { items: Array<{ label: string; value: number; color: string }> }) {
  const sum = items.reduce((n, x) => n + x.value, 0),
    circumference = 2 * Math.PI * 33
  let offset = 0
  return (
    <svg
      className="executive-report-donut"
      viewBox="0 0 100 100"
      role="img"
      aria-label={items.map((x) => `${x.label}: ${x.value}`).join(', ')}
    >
      <circle cx="50" cy="50" r="33" fill="none" stroke={C.track} strokeWidth="12" />
      {sum > 0 &&
        items
          .filter((x) => x.value > 0)
          .map((x) => {
            const length = (x.value / sum) * circumference
            const node = (
              <circle
                key={x.label}
                cx="50"
                cy="50"
                r="33"
                fill="none"
                stroke={x.color}
                strokeWidth="12"
                strokeDasharray={`${length} ${circumference - length}`}
                strokeDashoffset={-offset}
                transform="rotate(-90 50 50)"
              />
            )
            offset += length
            return node
          })}
      <text x="50" y="48" textAnchor="middle" className="executive-report-donut-number">
        {sum}
      </text>
      <text x="50" y="61" textAnchor="middle" className="executive-report-donut-caption">
        PROPOSTAS
      </text>
    </svg>
  )
}
function Kpi({
  label,
  value,
  note,
  color,
  highlight = false,
}: {
  label: string
  value: string
  note: string
  color: string
  highlight?: boolean
}) {
  return (
    <div
      className={`executive-report-kpi${highlight ? ' is-highlight' : ''}`}
      style={{ '--kpi-color': color } as CSSProperties}
    >
      <div className="executive-report-kpi-label">{label}</div>
      <div className="executive-report-kpi-value">{value}</div>
      <div className="executive-report-kpi-note">{note}</div>
    </div>
  )
}
function Bar({ row, max, color }: { row: Row; max: number; color: string }) {
  const width = max > 0 ? Math.max(3, Math.min(100, (row.value / max) * 100)) : 3
  return (
    <div className="executive-report-bar-row">
      <div className="executive-report-bar-label" title={row.label}>
        {row.label}
      </div>
      <div className="executive-report-bar-track">
        <span style={{ width: `${width}%`, backgroundColor: color }} />
      </div>
      <div className="executive-report-bar-count">{row.count}</div>
      <div className="executive-report-bar-value">{money(row.value)}</div>
    </div>
  )
}
function ReportPage({ data }: { data: ReportData }) {
  const segments = [
    { label: 'Aprovadas', value: data.proposals.approved, color: C.green },
    { label: 'Em aberto', value: data.proposals.pending, color: C.amber },
    { label: 'Recusadas', value: data.proposals.rejected, color: C.red },
    { label: 'Rascunhos / outras', value: data.proposals.other, color: C.blue },
  ]
  const maxQuote = Math.max(
    data.proposals.approvedValue,
    data.proposals.pendingValue,
    data.proposals.rejectedValue,
    data.proposals.otherValue,
    1,
  )
  const maxStage = Math.max(...data.pipeline.stages.map((x) => x.value), 1),
    maxOrder = Math.max(...data.operations.statuses.map((x) => x.value), 1)
  const visit = data.visits.latest,
    visitName = visit?.client_name || visit?.company_name || 'Cliente não informado'
  const visitWhen = visit?.visit_date || visit?.sent_at || visit?.created
  return (
    <div id="executive-report-print-root" className="executive-report-print-root">
      <main id="executive-report-page" className="executive-report-page">
        <header className="executive-report-header">
          <div className="executive-report-brand-mark">IP</div>
          <div className="executive-report-header-copy">
            <div className="executive-report-eyebrow">INTERTERMAL · PAINEL EXECUTIVO</div>
            <h1>Diretoria 360°</h1>
            <div className="executive-report-subtitle">
              Comercial, operação, clientes e decisões em uma página
            </div>
          </div>
          <div className="executive-report-header-meta">
            <div className="executive-report-period">{data.period}</div>
            <div className="executive-report-generated">
              Gerado em{' '}
              {data.generated.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
            </div>
          </div>
        </header>
        <section className="executive-report-kpis" aria-label="Indicadores principais">
          <Kpi
            label="Propostas no período"
            value={String(data.proposals.total)}
            note="inclui rascunhos e outros status"
            color={C.teal}
          />
          <Kpi
            label="Valor aprovado"
            value={money(data.proposals.approvedValue)}
            note={`${data.proposals.approved} aprovada(s) · não é recebido`}
            color={C.green}
            highlight
          />
          <Kpi
            label="Aprovação decidida"
            value={
              data.proposals.rate === null
                ? '—'
                : `${data.proposals.rate.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}%`
            }
            note="aprovadas ÷ (aprovadas + recusadas)"
            color={C.blue}
          />
          <Kpi
            label="Pipeline em aberto"
            value={money(data.pipeline.value)}
            note={`${data.pipeline.deals.length} oportunidade(s), ganho/perdido excluídos`}
            color={C.purple}
          />
          <Kpi
            label="OS ativas"
            value={String(data.operations.active.length)}
            note={`${money(data.operations.value)} em valor de OS`}
            color={C.amber}
          />
        </section>
        <section className="executive-report-grid" aria-label="Análise integrada">
          <article className="executive-report-panel executive-report-commercial">
            <div className="executive-report-panel-heading">
              <div>
                <h2>Propostas · status e valor</h2>
                <p>Distribuição por status no período selecionado</p>
              </div>
              <span className="executive-report-panel-tag">{data.proposals.total} registros</span>
            </div>
            <div className="executive-report-commercial-content">
              <div className="executive-report-donut-wrap">
                <Donut items={segments} />
                <div className="executive-report-legend">
                  {segments.map((x) => (
                    <div className="executive-report-legend-item" key={x.label}>
                      <span className="executive-report-dot" style={{ backgroundColor: x.color }} />
                      <span>{x.label}</span>
                      <strong>{x.value}</strong>
                    </div>
                  ))}
                </div>
              </div>
              <div className="executive-report-value-bars">
                <div className="executive-report-value-title">Valor por situação</div>
                {segments.map((x) => (
                  <Bar
                    key={x.label}
                    row={{
                      key: x.label,
                      label: x.label,
                      count: x.value,
                      value:
                        data.proposals[
                          x.label === 'Aprovadas'
                            ? 'approvedValue'
                            : x.label === 'Em aberto'
                              ? 'pendingValue'
                              : x.label === 'Recusadas'
                                ? 'rejectedValue'
                                : 'otherValue'
                        ],
                    }}
                    max={maxQuote}
                    color={x.color}
                  />
                ))}
              </div>
            </div>
          </article>
          <article className="executive-report-panel executive-report-pipeline">
            <div className="executive-report-panel-heading">
              <div>
                <h2>Pipeline comercial</h2>
                <p>Oportunidades abertas por etapa</p>
              </div>
            </div>
            <div className="executive-report-bars-list">
              {data.pipeline.stages.length ? (
                data.pipeline.stages
                  .slice(0, 6)
                  .map((row) => <Bar key={row.key} row={row} max={maxStage} color={C.teal} />)
              ) : (
                <div className="executive-report-empty">Sem oportunidades em aberto</div>
              )}
            </div>
          </article>
          <article className="executive-report-panel executive-report-operations">
            <div className="executive-report-panel-heading">
              <div>
                <h2>Execução · ordens de serviço</h2>
                <p>Snapshot atual · etapas não terminais</p>
              </div>
              <span className="executive-report-panel-tag">{data.operations.high} alta(s)</span>
            </div>
            <div className="executive-report-bars-list executive-report-ops-bars">
              {data.operations.statuses.length ? (
                data.operations.statuses
                  .slice(0, 5)
                  .map((row, i) => (
                    <Bar
                      key={row.key}
                      row={row}
                      max={maxOrder}
                      color={[C.blue, C.teal, C.amber, C.purple, C.green][i % 5]}
                    />
                  ))
              ) : (
                <div className="executive-report-empty">Sem OS ativas</div>
              )}
            </div>
            <div className="executive-report-panel-note">
              {data.operations.unassigned} OS ativa(s) sem responsável registrado
            </div>
          </article>
          <article className="executive-report-panel executive-report-clients">
            <div className="executive-report-panel-heading">
              <div>
                <h2>Clientes · exposição comercial</h2>
                <p>
                  {data.clients.total} no CRM · {data.clients.active} ativos/parceiros ·{' '}
                  {data.clients.leads} leads/prospects
                </p>
              </div>
            </div>
            <div className="executive-report-client-table-wrap">
              <table className="executive-report-client-table">
                <thead>
                  <tr>
                    <th>Cliente</th>
                    <th>Prop.</th>
                    <th>Aprovado</th>
                    <th>Em aberto</th>
                  </tr>
                </thead>
                <tbody>
                  {data.clients.top.length ? (
                    data.clients.top.map((x) => (
                      <tr key={x.key}>
                        <td title={x.name}>{x.name}</td>
                        <td>{x.count}</td>
                        <td>{money(x.approved)}</td>
                        <td>{money(x.pending)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="executive-report-empty-cell">
                        Sem propostas no período
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </article>
          <article className="executive-report-panel executive-report-customer">
            <div className="executive-report-panel-heading">
              <div>
                <h2>Cliente, campo e próxima ação</h2>
                <p>Visitas no período · chamados abertos agora</p>
              </div>
            </div>
            <div className="executive-report-service-summary">
              <div className="executive-report-service-stat">
                <strong>{data.visits.count === null ? '—' : data.visits.count}</strong>
                <span>visitas</span>
              </div>
              <div className="executive-report-service-stat">
                <strong>{data.tickets.open}</strong>
                <span>chamados abertos</span>
              </div>
              <div className="executive-report-service-stat">
                <strong>{data.overdueActivities}</strong>
                <span>atividades vencidas</span>
              </div>
            </div>
            <div className="executive-report-visit-line">
              {data.visits.count === null
                ? 'Visitas indisponíveis.'
                : visit
                  ? `Última visita: ${visitName} · ${visit.employee_name || 'Responsável não informado'}${visitWhen ? ` · ${parseDate(visitWhen)?.toLocaleDateString('pt-BR') || ''}` : ''}`
                  : 'Nenhuma visita registrada neste período.'}
            </div>
            <div className="executive-report-actions-title">Pontos para decisão</div>
            <ul className="executive-report-actions">
              {data.actions.slice(0, 2).map((x, i) => (
                <li key={`${i}-${x}`}>{x}</li>
              ))}
            </ul>
          </article>
        </section>
        <footer className="executive-report-footer">
          <span>
            Propostas e visitas: {data.period} · Clientes, pipeline, OS e chamados: fotografia
            atual.
          </span>
          <strong>
            Valor aprovado não é recebido · recebimentos e satisfação não estão estruturados no CRM.
          </strong>
        </footer>
      </main>
    </div>
  )
}

export function ExecutiveReportPrintButton(props: ExecutiveReportProps) {
  const [requested, setRequested] = useState(false),
    [generated, setGenerated] = useState<Date | null>(null)
  const popup = useRef<Window | null>(null),
    onBlocked = useRef(props.onPopupBlocked)
  useEffect(() => {
    onBlocked.current = props.onPopupBlocked
  }, [props.onPopupBlocked])
  const data = useMemo(
    () => makeReport(props, generated || new Date()),
    [
      props.clients,
      props.deals,
      props.quotes,
      props.tickets,
      props.activities,
      props.serviceOrders,
      props.fieldVisits,
      props.fieldVisitsError,
      props.periodFilter,
      props.periodLabel,
      props.customStartDate,
      props.customEndDate,
      generated,
    ],
  )
  const portal =
    requested && typeof document !== 'undefined'
      ? createPortal(<ReportPage data={data} />, document.body)
      : null
  useEffect(() => {
    if (!requested) return
    const win = popup.current,
      page = document.getElementById('executive-report-page')
    if (!win || win.closed || !page) {
      if (win && !win.closed) win.close()
      popup.current = null
      setRequested(false)
      onBlocked.current?.()
      return
    }
    try {
      win.document.open()
      win.document.write(
        `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Relatório Diretoria 360° — Intertermal</title><style>${printStyles}</style></head><body>${page.parentElement?.outerHTML || page.outerHTML}</body></html>`,
      )
      win.document.close()
      const timer = window.setTimeout(() => {
        try {
          win.focus()
          win.print()
        } catch {
          onBlocked.current?.()
        }
        setRequested(false)
      }, 260)
      return () => window.clearTimeout(timer)
    } catch {
      if (!win.closed) win.close()
      popup.current = null
      setRequested(false)
      onBlocked.current?.()
    }
  }, [requested, generated])
  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="shrink-0 border-teal-300 text-teal-800 hover:bg-teal-50 dark:border-teal-800 dark:text-teal-300 dark:hover:bg-teal-950/40"
        title="Abrir impressão e escolher Salvar como PDF"
        aria-label="Gerar relatório da diretoria em PDF"
        onClick={() => {
          const win = window.open('', 'intertermal-directoria360')
          if (!win) {
            onBlocked.current?.()
            return
          }
          popup.current = win
          win.document.write(
            '<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Preparando relatório…</title></head><body style="font-family:Arial,sans-serif;padding:24px;color:#172b3a">Preparando relatório para impressão…</body></html>',
          )
          win.document.close()
          setGenerated(new Date())
          setRequested(true)
        }}
      >
        <FileDown className="h-4 w-4" />
        Gerar PDF
      </Button>
      {portal}
    </>
  )
}
