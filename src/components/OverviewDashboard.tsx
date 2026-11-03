import React from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Users,
  TrendingUp,
  FileSpreadsheet,
  AlertCircle,
  Wrench,
  CheckCircle2,
  Clock,
  Flame,
  Package,
  Layers,
  Building2,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react'
import type {
  ClientRecord,
  DealRecord,
  QuoteRecord,
  TicketRecord,
  ServiceRecord,
  ServiceOrderRecord,
  ActivityRecord,
} from '@/types/crm'
import {
  DollarSign,
  PieChart as PieChartIcon,
  BarChart3,
  Percent,
  CheckCircle,
  TrendingDown,
  Sparkles,
  Award,
  Calendar,
  FileCheck2,
  FileX2,
  Filter,
  Smartphone,
  MapPin,
  ExternalLink,
  ClipboardList,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import type { FieldVisitRecord } from '@/services/field-visits'
import { ExecutiveReportPrintButton } from '@/components/ExecutiveReportPrint'
import { useToast } from '@/hooks/use-toast'
import { resolveServiceOrderLiveValue } from '@/lib/service-order-live-value'

interface OverviewDashboardProps {
  clients: ClientRecord[]
  deals: DealRecord[]
  quotes: QuoteRecord[]
  tickets: TicketRecord[]
  services: ServiceRecord[]
  serviceOrders?: ServiceOrderRecord[]
  fieldVisits?: FieldVisitRecord[]
  fieldVisitsError?: boolean
  activities?: ActivityRecord[]
  onNavigate: (tab: string) => void
}

export const OverviewDashboard: React.FC<OverviewDashboardProps> = ({
  clients,
  deals,
  quotes,
  tickets,
  services,
  serviceOrders = [],
  fieldVisits = [],
  fieldVisitsError = false,
  activities = [],
  onNavigate,
}) => {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [dashboardTab, setDashboardTab] = React.useState<
    'overview' | 'profitability' | 'conversion'
  >('overview')
  const [periodFilter, setPeriodFilter] = React.useState<
    'all' | 'month' | 'quarter' | 'year' | 'custom'
  >('all')
  const [customStartDate, setCustomStartDate] = React.useState<string>('')
  const [customEndDate, setCustomEndDate] = React.useState<string>('')
  const [reportClientFilter, setReportClientFilter] = React.useState<string>('all')

  // Filtro de propostas por período baseado no campo created (ou updated)
  const filteredQuotesByPeriod = React.useMemo(() => {
    if (periodFilter === 'all') return quotes

    const now = new Date()
    return quotes.filter((q) => {
      const dateStr = q.created || q.updated
      if (!dateStr) return true
      const qDate = new Date(dateStr)
      if (isNaN(qDate.getTime())) return true

      if (periodFilter === 'month') {
        return qDate.getMonth() === now.getMonth() && qDate.getFullYear() === now.getFullYear()
      }

      if (periodFilter === 'quarter') {
        const currentQuarter = Math.floor(now.getMonth() / 3)
        const quoteQuarter = Math.floor(qDate.getMonth() / 3)
        return quoteQuarter === currentQuarter && qDate.getFullYear() === now.getFullYear()
      }

      if (periodFilter === 'year') {
        return qDate.getFullYear() === now.getFullYear()
      }

      if (periodFilter === 'custom') {
        if (!customStartDate && !customEndDate) return true
        const qTime = qDate.getTime()
        if (customStartDate) {
          const start = new Date(`${customStartDate}T00:00:00`).getTime()
          if (!isNaN(start) && qTime < start) return false
        }
        if (customEndDate) {
          const end = new Date(`${customEndDate}T23:59:59`).getTime()
          if (!isNaN(end) && qTime > end) return false
        }
        return true
      }

      return true
    })
  }, [quotes, periodFilter, customStartDate, customEndDate])

  // Função utilitária para extrair o valor monetário real de uma proposta
  const getQuoteNumericValue = (q: QuoteRecord): number => {
    const val =
      q.total !== undefined && q.total !== null && !isNaN(Number(q.total)) && Number(q.total) > 0
        ? Number(q.total)
        : q.final_price !== undefined &&
            q.final_price !== null &&
            !isNaN(Number(q.final_price)) &&
            Number(q.final_price) > 0
          ? Number(q.final_price)
          : Number(q.subtotal ?? q.total_cost) || 0
    return isNaN(val) ? 0 : val
  }

  // Normalização de status de propostas (abrange 'aprovada', 'approved', etc.)
  const isApprovedQuote = (status?: string): boolean => {
    if (!status) return false
    const s = status.toLowerCase().trim()
    return s === 'approved' || s === 'aprovada' || s === 'aprovado'
  }

  const isRejectedQuote = (status?: string): boolean => {
    if (!status) return false
    const s = status.toLowerCase().trim()
    return (
      s === 'rejected' ||
      s === 'recusada' ||
      s === 'recusado' ||
      s === 'rejeitada' ||
      s === 'rejeitado'
    )
  }

  const isPendingQuote = (status?: string): boolean => {
    if (!status) return true // por padrão propostas sem status definido contam como pendente/em análise
    const s = status.toLowerCase().trim()
    return (
      s === 'sent' ||
      s === 'enviada' ||
      s === 'enviado' ||
      s === 'draft' ||
      s === 'rascunho' ||
      s === 'pending_approval' ||
      s === 'pending' ||
      s === 'pendente' ||
      s === 'em_negociacao' ||
      s === 'em_aprovacao'
    )
  }

  // Cálculos de métricas de propostas afetados pelo seletor de período
  const approvedQuotes = filteredQuotesByPeriod.filter((q) => isApprovedQuote(q.status))
  const rejectedQuotes = filteredQuotesByPeriod.filter((q) => isRejectedQuote(q.status))
  const pendingQuotes = filteredQuotesByPeriod.filter((q) => isPendingQuote(q.status))

  const approvedQuotesTotal = approvedQuotes.reduce((sum, q) => sum + getQuoteNumericValue(q), 0)
  const rejectedQuotesTotal = rejectedQuotes.reduce((sum, q) => sum + getQuoteNumericValue(q), 0)
  const pendingQuotesTotal = pendingQuotes.reduce((sum, q) => sum + getQuoteNumericValue(q), 0)
  const totalQuotesValue = filteredQuotesByPeriod.reduce(
    (sum, q) => sum + getQuoteNumericValue(q),
    0,
  )

  // Utilitário para verificar se um negócio está em aberto (exclui ganhos E perdidos)
  const isDealActive = (deal: DealRecord): boolean => {
    if (!deal) return false
    const s = (deal.stage || '').toLowerCase().trim()
    return (
      s !== 'lost' &&
      s !== 'perdido' &&
      s !== 'recusado' &&
      s !== 'rejeitado' &&
      s !== 'won' &&
      s !== 'ganho' &&
      s !== 'fechado' &&
      s !== 'concluido' &&
      s !== 'concluído'
    )
  }

  // Utilitário para negócios ganhos (won) — "Ganhos no período" no painel
  const isDealWon = (deal: DealRecord): boolean => {
    if (!deal) return false
    const s = (deal.stage || '').toLowerCase().trim()
    return s === 'won' || s === 'ganho' || s === 'fechado' || s === 'concluido' || s === 'concluído'
  }

  // Deals afetados pelo seletor de período (mesma régua de datas das propostas)
  const filteredDealsByPeriod = React.useMemo(() => {
    if (periodFilter === 'all') return deals

    const now = new Date()
    return deals.filter((d) => {
      const dateStr = d.created || d.updated
      if (!dateStr) return true
      const dDate = new Date(dateStr)
      if (isNaN(dDate.getTime())) return true

      if (periodFilter === 'month') {
        return dDate.getMonth() === now.getMonth() && dDate.getFullYear() === now.getFullYear()
      }

      if (periodFilter === 'quarter') {
        const currentQuarter = Math.floor(now.getMonth() / 3)
        const dealQuarter = Math.floor(dDate.getMonth() / 3)
        return dealQuarter === currentQuarter && dDate.getFullYear() === now.getFullYear()
      }

      if (periodFilter === 'year') {
        return dDate.getFullYear() === now.getFullYear()
      }

      if (periodFilter === 'custom') {
        if (!customStartDate && !customEndDate) return true
        const dTime = dDate.getTime()
        if (customStartDate) {
          const start = new Date(`${customStartDate}T00:00:00`).getTime()
          if (!isNaN(start) && dTime < start) return false
        }
        if (customEndDate) {
          const end = new Date(`${customEndDate}T23:59:59`).getTime()
          if (!isNaN(end) && dTime > end) return false
        }
        return true
      }

      return true
    })
  }, [deals, periodFilter, customStartDate, customEndDate])

  const activeDeals = filteredDealsByPeriod.filter(isDealActive)
  const totalPipelineValue = activeDeals.reduce((sum, d) => sum + getDealNumericValue(d), 0)
  const wonDeals = filteredDealsByPeriod.filter(isDealWon)
  const wonDealsTotal = wonDeals.reduce((sum, d) => sum + getDealNumericValue(d), 0)

  // Função utilitária para extrair o valor monetário real de um negócio (com fallback de campos numéricos)
  const getDealNumericValue = (deal: DealRecord | any): number => {
    if (!deal) return 0
    const rawVal = Number(deal.value)
    if (!isNaN(rawVal) && rawVal > 0) return rawVal

    const rawTotal = Number(deal.total)
    if (!isNaN(rawTotal) && rawTotal > 0) return rawTotal

    const rawFinalPrice = Number(deal.final_price)
    if (!isNaN(rawFinalPrice) && rawFinalPrice > 0) return rawFinalPrice

    const rawSubtotal = Number(deal.subtotal ?? deal.total_cost)
    if (!isNaN(rawSubtotal) && rawSubtotal > 0) return rawSubtotal

    return 0
  }

  // Status de Ordens de Serviço (service_orders) reais do banco
  // OS ativas em campo: tudo que não estiver 'fechado', 'completed' ou 'cancelled'/'rejeitado'
  const isFieldServiceOrderActive = (status?: string): boolean => {
    if (!status) return true
    const s = status.toLowerCase().trim()
    return (
      s === 'vistoria' ||
      s === 'proposta' ||
      s === 'execucao' ||
      s === 'in_execution' ||
      s === 'in_progress' ||
      s === 'inspecao' ||
      s === 'pending_approval' ||
      s === 'pending' ||
      s === 'approved'
    )
  }

  const activeServiceOrders = serviceOrders.filter((so) => isFieldServiceOrderActive(so.status))
  const activeServiceOrdersTotal = activeServiceOrders.reduce(
    (sum, so) => sum + resolveServiceOrderLiveValue(so, quotes),
    0,
  )

  // Chamados & Suporte (tickets)
  const openTickets = tickets.filter((t) => {
    const s = (t.status || '').toLowerCase().trim()
    return (
      s === 'open' ||
      s === 'in_progress' ||
      s === 'waiting' ||
      s === 'aberto' ||
      s === 'em_andamento'
    )
  })

  // Métricas de Visitas a Campo
  const fieldVisitsMetrics = React.useMemo(() => {
    const totalCount = fieldVisits.length
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()

    // Visitas do mês corrente (verificando visit_date ou created)
    const currentMonthVisits = fieldVisits.filter((v) => {
      const dateStr = v.visit_date || v.created
      if (!dateStr) return false
      // Se for formato YYYY-MM-DD
      if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
        const [year, month] = dateStr.split('-').map(Number)
        return year === currentYear && month - 1 === currentMonth
      }
      const d = new Date(dateStr)
      return !isNaN(d.getTime()) && d.getMonth() === currentMonth && d.getFullYear() === currentYear
    })

    // Visita mais recente (ordenadas por visit_date ou created)
    let latestVisit: FieldVisitRecord | null = null
    if (fieldVisits.length > 0) {
      const sorted = [...fieldVisits].sort((a, b) => {
        const dateA = a.visit_date
          ? new Date(a.visit_date).getTime()
          : a.created
            ? new Date(a.created).getTime()
            : 0
        const dateB = b.visit_date
          ? new Date(b.visit_date).getTime()
          : b.created
            ? new Date(b.created).getTime()
            : 0
        return dateB - dateA
      })
      latestVisit = sorted[0]
    }

    let latestFormattedDate = ''
    if (latestVisit) {
      const rawDate = latestVisit.visit_date || latestVisit.created
      if (rawDate) {
        if (/^\d{4}-\d{2}-\d{2}$/.test(rawDate)) {
          const [y, m, d] = rawDate.split('-')
          latestFormattedDate = `${d}/${m}/${y}`
        } else {
          const parsed = new Date(rawDate)
          if (!isNaN(parsed.getTime())) {
            latestFormattedDate = parsed.toLocaleDateString('pt-BR')
          }
        }
      }
    }

    return {
      totalCount,
      currentMonthCount: currentMonthVisits.length,
      latestVisit,
      latestFormattedDate,
    }
  }, [fieldVisits])

  return (
    <div className="space-y-6">
      {/* Seletor de Sub-Abas do Dashboard */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl overflow-x-auto">
          <button
            type="button"
            onClick={() => setDashboardTab('overview')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
              dashboardTab === 'overview'
                ? 'bg-white dark:bg-slate-800 text-teal-700 dark:text-teal-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <TrendingUp className="h-4 w-4" />
            Visão Geral Operacional
          </button>
          <button
            type="button"
            onClick={() => setDashboardTab('profitability')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
              dashboardTab === 'profitability'
                ? 'bg-teal-700 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <PieChartIcon className="h-4 w-4" />
            Dashboard de Rentabilidade & Margem Real
          </button>
          <button
            type="button"
            onClick={() => setDashboardTab('conversion')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
              dashboardTab === 'conversion'
                ? 'bg-teal-700 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <BarChart3 className="h-4 w-4" />
            Relatório de Conversão
          </button>
        </div>

        {/* Seletor de Período Geral */}
        <div className="flex flex-wrap items-center gap-2 bg-slate-50 dark:bg-slate-900/60 p-1.5 rounded-xl border border-slate-200/80 dark:border-slate-800">
          <div className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 font-semibold px-1">
            <Calendar className="h-3.5 w-3.5 text-teal-600" />
            <span>Período:</span>
          </div>
          <select
            value={periodFilter}
            onChange={(e) => setPeriodFilter(e.target.value as any)}
            className="text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-800 dark:text-slate-100 shadow-2xs focus:outline-hidden focus:ring-1 focus:ring-teal-500"
          >
            <option value="all">Todo o período</option>
            <option value="month">Este mês</option>
            <option value="quarter">Este trimestre</option>
            <option value="year">Este ano</option>
            <option value="custom">Personalizado</option>
          </select>

          {periodFilter === 'custom' && (
            <div className="flex items-center gap-1.5">
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-slate-800 dark:text-slate-100"
                placeholder="Início"
              />
              <span className="text-xs text-muted-foreground">até</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-slate-800 dark:text-slate-100"
                placeholder="Fim"
              />
            </div>
          )}
          <ExecutiveReportPrintButton
            clients={clients}
            deals={deals}
            quotes={filteredQuotesByPeriod}
            tickets={tickets}
            activities={activities}
            serviceOrders={serviceOrders}
            fieldVisits={fieldVisits}
            fieldVisitsError={fieldVisitsError}
            periodFilter={periodFilter}
            periodLabel={
              periodFilter === 'custom'
                ? `${customStartDate || 'Início'} a ${customEndDate || 'hoje'}`
                : periodFilter === 'all'
                  ? 'Todo o período'
                  : periodFilter === 'month'
                    ? 'Este mês'
                    : periodFilter === 'quarter'
                      ? 'Este trimestre'
                      : 'Este ano'
            }
            customStartDate={customStartDate}
            customEndDate={customEndDate}
            onPopupBlocked={() =>
              toast({
                title: 'Prévia bloqueada pelo navegador',
                description:
                  'Permita a abertura de janela para este site e clique em Gerar PDF novamente.',
                variant: 'destructive',
              })
            }
          />
        </div>
      </div>

      {dashboardTab === 'conversion' ? (
        /* ==================== ABA RELATÓRIO DE CONVERSÃO ==================== */
        <div className="space-y-6">
          {(() => {
            // Filtrar quotes pelo cliente selecionado (se aplicável) e pelo período já ativo
            const quotesForConversion = filteredQuotesByPeriod.filter((q) => {
              if (reportClientFilter === 'all') return true
              return q.client_id === reportClientFilter || q.client_name === reportClientFilter
            })

            const totalIssued = quotesForConversion.length
            const convApproved = quotesForConversion.filter((q) => isApprovedQuote(q.status))
            const convRejected = quotesForConversion.filter((q) => isRejectedQuote(q.status))
            const convPending = quotesForConversion.filter((q) => isPendingQuote(q.status))

            const convApprovedValue = convApproved.reduce(
              (sum, q) => sum + getQuoteNumericValue(q),
              0,
            )
            const convRejectedValue = convRejected.reduce(
              (sum, q) => sum + getQuoteNumericValue(q),
              0,
            )
            const convPendingValue = convPending.reduce(
              (sum, q) => sum + getQuoteNumericValue(q),
              0,
            )
            const convTotalValue = quotesForConversion.reduce(
              (sum, q) => sum + getQuoteNumericValue(q),
              0,
            )

            const approvalRate = totalIssued > 0 ? (convApproved.length / totalIssued) * 100 : 0
            const rejectionRate = totalIssued > 0 ? (convRejected.length / totalIssued) * 100 : 0
            const pendingRate = totalIssued > 0 ? (convPending.length / totalIssued) * 100 : 0

            // Agrupamento por cliente para a tabela analítica
            const clientStatsMap = new Map<
              string,
              {
                id: string
                name: string
                issued: number
                approved: number
                rejected: number
                pending: number
                approvedValue: number
                totalValue: number
              }
            >()

            quotesForConversion.forEach((q) => {
              const cId = q.client_id || q.client_name || 'outros'
              const cName =
                q.client_name ||
                (q.client_id
                  ? clients.find((c) => c.id === q.client_id)?.name
                  : 'Cliente Não Identificado') ||
                'Cliente Geral'
              const val = getQuoteNumericValue(q)

              if (!clientStatsMap.has(cId)) {
                clientStatsMap.set(cId, {
                  id: cId,
                  name: cName,
                  issued: 0,
                  approved: 0,
                  rejected: 0,
                  pending: 0,
                  approvedValue: 0,
                  totalValue: 0,
                })
              }

              const row = clientStatsMap.get(cId)!
              row.issued += 1
              row.totalValue += val

              if (isApprovedQuote(q.status)) {
                row.approved += 1
                row.approvedValue += val
              } else if (isRejectedQuote(q.status)) {
                row.rejected += 1
              } else {
                row.pending += 1
              }
            })

            const clientStatsList = Array.from(clientStatsMap.values()).sort(
              (a, b) => b.approvedValue - a.approvedValue || b.issued - a.issued,
            )

            return (
              <div className="space-y-6">
                {/* Cabeçalho do Relatório com Filtro por Cliente */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-teal-600" />
                      Relatório Analítico de Conversão de Propostas
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Taxas reais de aprovação, recusa e volume negociado por cliente industrial.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                      Filtrar Cliente:
                    </span>
                    <select
                      value={reportClientFilter}
                      onChange={(e) => setReportClientFilter(e.target.value)}
                      className="text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-800 dark:text-slate-100 max-w-[200px] truncate"
                    >
                      <option value="all">Todos os Clientes</option>
                      {clients.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Métricas Principais de Conversão */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">
                        Taxa de Aprovação (%)
                      </CardTitle>
                      <div className="h-8 w-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center font-bold">
                        <Percent className="h-4 w-4" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">
                        {approvalRate.toFixed(1)}%
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-1">
                        {convApproved.length} aprovadas de {totalIssued} emitidas
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">
                        Taxa de Recusa (%)
                      </CardTitle>
                      <div className="h-8 w-8 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center font-bold">
                        <TrendingDown className="h-4 w-4" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-rose-700 dark:text-rose-400">
                        {rejectionRate.toFixed(1)}%
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-1">
                        {convRejected.length} propostas recusadas
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">
                        Em Negociação
                      </CardTitle>
                      <div className="h-8 w-8 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center font-bold">
                        <Clock className="h-4 w-4" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-amber-700 dark:text-amber-400">
                        {convPending.length}
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-1">
                        {pendingRate.toFixed(1)}% do total (
                        {convPendingValue.toLocaleString('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        })}
                        )
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">
                        Volume Aprovado (R$)
                      </CardTitle>
                      <div className="h-8 w-8 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-600 flex items-center justify-center font-bold">
                        <DollarSign className="h-4 w-4" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-teal-700 dark:text-teal-400">
                        {convApprovedValue.toLocaleString('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        })}
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-1">
                        Total emitido:{' '}
                        {convTotalValue.toLocaleString('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        })}
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Volume Aprovado vs Recusado vs Pendente (Distribuição Visual) */}
                <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <PieChartIcon className="h-4 w-4 text-teal-600" />
                      Volume: Aprovado vs. Recusado vs. Pendente
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Distribuição financeira total do valor das propostas no período selecionado
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-4 rounded-full overflow-hidden flex">
                      {convTotalValue > 0 ? (
                        <>
                          <div
                            className="bg-emerald-600 h-full transition-all"
                            style={{ width: `${(convApprovedValue / convTotalValue) * 100}%` }}
                            title={`Aprovado: ${convApprovedValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`}
                          />
                          <div
                            className="bg-amber-500 h-full transition-all"
                            style={{ width: `${(convPendingValue / convTotalValue) * 100}%` }}
                            title={`Pendente: ${convPendingValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`}
                          />
                          <div
                            className="bg-rose-500 h-full transition-all"
                            style={{ width: `${(convRejectedValue / convTotalValue) * 100}%` }}
                            title={`Recusado: ${convRejectedValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`}
                          />
                        </>
                      ) : (
                        <div className="w-full bg-slate-200 dark:bg-slate-700 h-full" />
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
                      <div className="p-3 rounded-lg border border-emerald-100 dark:border-emerald-950/60 bg-emerald-50/40 dark:bg-emerald-950/20">
                        <div className="flex items-center gap-1.5 font-semibold text-emerald-700 dark:text-emerald-400">
                          <span className="h-2.5 w-2.5 rounded-full bg-emerald-600" />
                          <span>Aprovadas ({convApproved.length})</span>
                        </div>
                        <div className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-1">
                          {convApprovedValue.toLocaleString('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          })}
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          {convTotalValue > 0
                            ? ((convApprovedValue / convTotalValue) * 100).toFixed(1)
                            : 0}
                          % do valor total
                        </div>
                      </div>

                      <div className="p-3 rounded-lg border border-amber-100 dark:border-amber-950/60 bg-amber-50/40 dark:bg-amber-950/20">
                        <div className="flex items-center gap-1.5 font-semibold text-amber-700 dark:text-amber-400">
                          <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                          <span>Pendentes / Em Análise ({convPending.length})</span>
                        </div>
                        <div className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-1">
                          {convPendingValue.toLocaleString('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          })}
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          {convTotalValue > 0
                            ? ((convPendingValue / convTotalValue) * 100).toFixed(1)
                            : 0}
                          % do valor total
                        </div>
                      </div>

                      <div className="p-3 rounded-lg border border-rose-100 dark:border-rose-950/60 bg-rose-50/40 dark:bg-rose-950/20">
                        <div className="flex items-center gap-1.5 font-semibold text-rose-700 dark:text-rose-400">
                          <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
                          <span>Recusadas ({convRejected.length})</span>
                        </div>
                        <div className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-1">
                          {convRejectedValue.toLocaleString('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          })}
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          {convTotalValue > 0
                            ? ((convRejectedValue / convTotalValue) * 100).toFixed(1)
                            : 0}
                          % do valor total
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Tabela de Conversão por Cliente */}
                <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <FileCheck2 className="h-4 w-4 text-teal-600" />
                      Tabela de Conversão por Cliente Industrial
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Histórico detalhado de propostas emitidas, taxa de sucesso e montante
                      financeiro fechado
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-slate-50 dark:bg-slate-950/60 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 font-semibold">
                          <tr>
                            <th className="py-3 px-4">Cliente Industrial</th>
                            <th className="py-3 px-4 text-center">Emitidas</th>
                            <th className="py-3 px-4 text-center">Aprovadas</th>
                            <th className="py-3 px-4 text-center">Recusadas</th>
                            <th className="py-3 px-4 text-center">Em Negociação</th>
                            <th className="py-3 px-4 text-right">Taxa Conversão (%)</th>
                            <th className="py-3 px-4 text-right">Valor Aprovado (R$)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {clientStatsList.length === 0 ? (
                            <tr>
                              <td colSpan={7} className="py-8 text-center text-muted-foreground">
                                Nenhuma proposta encontrada com os filtros selecionados.
                              </td>
                            </tr>
                          ) : (
                            clientStatsList.map((row) => {
                              const convPercent =
                                row.issued > 0 ? (row.approved / row.issued) * 100 : 0
                              return (
                                <tr
                                  key={row.id}
                                  className="hover:bg-slate-50/50 dark:hover:bg-slate-950/40"
                                >
                                  <td className="py-3 px-4 font-semibold text-slate-900 dark:text-slate-100">
                                    {row.name}
                                  </td>
                                  <td className="py-3 px-4 text-center font-bold text-slate-700 dark:text-slate-300">
                                    {row.issued}
                                  </td>
                                  <td className="py-3 px-4 text-center font-semibold text-emerald-700 dark:text-emerald-400">
                                    {row.approved}
                                  </td>
                                  <td className="py-3 px-4 text-center font-semibold text-rose-600 dark:text-rose-400">
                                    {row.rejected}
                                  </td>
                                  <td className="py-3 px-4 text-center font-semibold text-amber-600 dark:text-amber-400">
                                    {row.pending}
                                  </td>
                                  <td className="py-3 px-4 text-right font-bold">
                                    <Badge
                                      className={`text-[10px] font-bold ${
                                        convPercent >= 50
                                          ? 'bg-emerald-600 text-white'
                                          : convPercent > 0
                                            ? 'bg-amber-500 text-white'
                                            : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                                      }`}
                                    >
                                      {convPercent.toFixed(1)}%
                                    </Badge>
                                  </td>
                                  <td className="py-3 px-4 text-right font-bold text-teal-700 dark:text-teal-400">
                                    {row.approvedValue.toLocaleString('pt-BR', {
                                      style: 'currency',
                                      currency: 'BRL',
                                    })}
                                  </td>
                                </tr>
                              )
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )
          })()}
        </div>
      ) : dashboardTab === 'profitability' ? (
        /* ==================== ABA DASHBOARD DE RENTABILIDADE ==================== */
        <div className="space-y-6">
          {/* Cálculo de Rentabilidade de todas as OSs e Propostas Concluídas/Aprovadas */}
          {(() => {
            // Unir Ordens de Serviço e Orçamentos Aprovados para análise de margem real
            const completedItems = [
              ...serviceOrders.map((so) => {
                const finalPrice = resolveServiceOrderLiveValue(so, quotes)
                // Custo real apenas: OS.internal_cost ou composição direta da proposta.
                // Sem custo informado = "custo não informado" (fora da margem média).
                const internalCost =
                  Number(so.internal_cost) ||
                  (so.technical_details?.service_composition?.directCostsTotal
                    ? Number(so.technical_details.service_composition.directCostsTotal)
                    : 0)
                const hasCost = internalCost > 0
                const grossProfit = hasCost ? finalPrice - internalCost : 0
                const realMargin = hasCost && finalPrice > 0 ? (grossProfit / finalPrice) * 100 : 0
                return {
                  id: so.id,
                  code: so.order_number,
                  title: so.title,
                  client: so.client_name || 'Cliente Industrial',
                  finalPrice,
                  internalCost,
                  hasCost,
                  grossProfit,
                  realMargin: Math.round(realMargin * 10) / 10,
                  status: so.status,
                  date: so.created ? new Date(so.created) : new Date(),
                }
              }),
              // Orçamentos aprovados que não estejam duplicados
              ...quotes
                .filter(
                  (q) =>
                    isApprovedQuote(q.status) &&
                    !serviceOrders.some(
                      (so) => so.quote_id === q.id || so.order_number === q.quote_number,
                    ),
                )
                .map((q) => {
                  const finalPrice = getQuoteNumericValue(q)
                  // Custo real apenas: composição direta ou total_cost da proposta.
                  // Sem custo informado = "custo não informado" (fora da margem média).
                  const internalCost =
                    Number(q.service_details?.service_composition?.directCostsTotal) ||
                    (Number(q.total_cost) > 0 ? Number(q.total_cost) : 0)
                  const hasCost = internalCost > 0
                  const grossProfit = hasCost ? finalPrice - internalCost : 0
                  const realMargin =
                    hasCost && finalPrice > 0 ? (grossProfit / finalPrice) * 100 : 0
                  return {
                    id: q.id,
                    code: q.quote_number,
                    title: q.title || 'Manutenção Preventiva / Corretiva',
                    client: q.client_name || 'Cliente Industrial',
                    finalPrice,
                    internalCost,
                    hasCost,
                    grossProfit,
                    realMargin: Math.round(realMargin * 10) / 10,
                    status: 'approved',
                    date: q.created ? new Date(q.created) : new Date(),
                  }
                }),
            ]

            const totalRevenue = completedItems.reduce((acc, it) => acc + it.finalPrice, 0)
            // Custos e lucro só dos itens COM custo informado (regra do Alex: sem estimativa)
            const itemsWithCost = completedItems.filter((it) => it.hasCost)
            const totalCost = itemsWithCost.reduce((acc, it) => acc + it.internalCost, 0)
            const totalProfit = itemsWithCost.reduce((acc, it) => acc + it.grossProfit, 0)
            const costInformedRevenue = itemsWithCost.reduce((acc, it) => acc + it.finalPrice, 0)
            const averageMargin =
              costInformedRevenue > 0 ? (totalProfit / costInformedRevenue) * 100 : 0
            const costCoverage =
              totalRevenue > 0
                ? Math.round((itemsWithCost.length / completedItems.length) * 100)
                : 0

            // Ordenar por mais rentáveis
            const topProfitable = [...completedItems].sort((a, b) => b.realMargin - a.realMargin)

            // Agrupamento mês a mês com dados REAIS (OSs + propostas aprovadas do período)
            const monthlyMap = new Map<
              string,
              { billed: number; cost: number; costRevenue: number; hasCostCount: number }
            >()
            for (const it of completedItems) {
              const d = it.date
              const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
              const cur = monthlyMap.get(key) || {
                billed: 0,
                cost: 0,
                costRevenue: 0,
                hasCostCount: 0,
              }
              cur.billed += it.finalPrice
              if (it.hasCost) {
                cur.cost += it.internalCost
                cur.costRevenue += it.finalPrice
                cur.hasCostCount += 1
              }
              monthlyMap.set(key, cur)
            }
            const monthlyData = [...monthlyMap.entries()]
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([key, v]) => {
                const [year, month] = key.split('-').map(Number)
                const label = `${['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'][month - 1]}/${String(year).slice(2)}`
                return {
                  month: label,
                  billed: v.billed,
                  cost: v.cost,
                  margin:
                    v.costRevenue > 0
                      ? Math.round(((v.costRevenue - v.cost) / v.costRevenue) * 1000) / 10
                      : 0,
                  hasCost: v.hasCostCount > 0,
                }
              })

            return (
              <div className="space-y-6">
                {/* KPIs de Rentabilidade */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">
                        Faturamento de Serviços
                      </CardTitle>
                      <div className="h-8 w-8 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-600 flex items-center justify-center font-bold">
                        <DollarSign className="h-4 w-4" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-xl font-bold text-slate-900 dark:text-slate-100">
                        {totalRevenue.toLocaleString('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        })}
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-1">
                        Preço final cobrado dos clientes
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">
                        Custos Internos Totais
                      </CardTitle>
                      <div className="h-8 w-8 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center font-bold">
                        <TrendingDown className="h-4 w-4" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      {completedItems.length > 0 && itemsWithCost.length === 0 ? (
                        <>
                          <div className="text-xl font-bold text-slate-400 dark:text-slate-500">
                            Custo não informado
                          </div>
                          <p className="text-[11px] text-muted-foreground mt-1">
                            Nenhuma OS ou proposta com custo direto registrado no período
                          </p>
                        </>
                      ) : (
                        <>
                          <div className="text-xl font-bold text-rose-700 dark:text-rose-400">
                            {totalCost.toLocaleString('pt-BR', {
                              style: 'currency',
                              currency: 'BRL',
                            })}
                          </div>
                          <p className="text-[11px] text-muted-foreground mt-1">
                            MO + Deslocamento + Hospedagem + Peças
                            {completedItems.length > itemsWithCost.length
                              ? ` · ${completedItems.length - itemsWithCost.length} sem custo informado`
                              : ''}
                          </p>
                        </>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">
                        Lucro Bruto Real
                      </CardTitle>
                      <div className="h-8 w-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center font-bold">
                        <Award className="h-4 w-4" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      {completedItems.length > 0 && itemsWithCost.length === 0 ? (
                        <>
                          <div className="text-xl font-bold text-slate-400 dark:text-slate-500">
                            Custo não informado
                          </div>
                          <p className="text-[11px] text-muted-foreground mt-1">
                            Lucro real depende do custo direto de cada serviço
                          </p>
                        </>
                      ) : (
                        <>
                          <div className="text-xl font-bold text-emerald-700 dark:text-emerald-400">
                            {totalProfit.toLocaleString('pt-BR', {
                              style: 'currency',
                              currency: 'BRL',
                            })}
                          </div>
                          <p className="text-[11px] text-muted-foreground mt-1">
                            Margem nominal retida pela empresa
                          </p>
                        </>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">
                        Margem Real Média (%)
                      </CardTitle>
                      <div className="h-8 w-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center font-bold">
                        <Percent className="h-4 w-4" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      {completedItems.length > 0 && itemsWithCost.length === 0 ? (
                        <>
                          <div className="text-xl font-bold text-slate-400 dark:text-slate-500">
                            —
                          </div>
                          <p className="text-[11px] text-muted-foreground mt-1">
                            Custo não informado nos serviços do período
                          </p>
                        </>
                      ) : (
                        <>
                          <div className="text-xl font-bold text-indigo-700 dark:text-indigo-400">
                            {averageMargin.toFixed(1)}%
                          </div>
                          <p className="text-[11px] text-muted-foreground mt-1">
                            {costCoverage < 100
                              ? `Margem só dos ${itemsWithCost.length} itens com custo informado (${costCoverage}% do total)`
                              : 'Meta operacional atingida (Acima de 25%)'}
                          </p>
                        </>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Gráfico Visual Comparativo: Faturamento vs Custo por Período */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  <Card className="lg:col-span-7 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                            <BarChart3 className="h-4 w-4 text-teal-600" />
                            Comparativo por Período: Preço Cobrado vs. Custo Interno
                          </CardTitle>
                          <CardDescription className="text-xs">
                            Evolução das receitas e despesas diretas de serviços BERMO
                          </CardDescription>
                        </div>
                        <Badge variant="outline" className="text-[10px] text-teal-700 font-mono">
                          {itemsWithCost.length > 0
                            ? `Média Margem: ${averageMargin.toFixed(1)}%`
                            : 'Custo não informado'}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-2">
                      <div className="space-y-3">
                        {monthlyData.map((m, idx) => {
                          const maxVal = Math.max(...monthlyData.map((d) => d.billed), 1)
                          const billedPercent = (m.billed / maxVal) * 100
                          const costPercent = (m.cost / maxVal) * 100

                          return (
                            <div
                              key={idx}
                              className="space-y-1.5 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800 text-xs"
                            >
                              <div className="flex justify-between items-center font-semibold">
                                <span className="text-slate-900 dark:text-slate-100">
                                  {m.month}
                                </span>
                                <div className="flex items-center gap-3 text-[11px]">
                                  <span className="text-teal-700 dark:text-teal-400">
                                    Cobrado:{' '}
                                    {m.billed.toLocaleString('pt-BR', {
                                      style: 'currency',
                                      currency: 'BRL',
                                    })}
                                  </span>
                                  <span className="text-rose-600 dark:text-rose-400">
                                    {m.hasCost ? (
                                      <>
                                        Custo:{' '}
                                        {m.cost.toLocaleString('pt-BR', {
                                          style: 'currency',
                                          currency: 'BRL',
                                        })}
                                      </>
                                    ) : (
                                      'Custo não informado'
                                    )}
                                  </span>
                                  <Badge
                                    className={`text-white text-[9px] px-1.5 py-0 ${
                                      m.hasCost ? 'bg-emerald-600' : 'bg-slate-400'
                                    }`}
                                  >
                                    {m.hasCost ? `${m.margin}% Margem` : 'Sem custo'}
                                  </Badge>
                                </div>
                              </div>
                              {/* Barra dupla de faturamento e custo */}
                              <div className="space-y-1 pt-1">
                                <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                                  <div
                                    className="bg-teal-600 h-full rounded-full transition-all"
                                    style={{ width: `${billedPercent}%` }}
                                  />
                                </div>
                                <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                                  <div
                                    className="bg-rose-500 h-full rounded-full transition-all"
                                    style={{ width: `${costPercent}%` }}
                                  />
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>

                      <div className="flex items-center justify-center gap-6 pt-2 text-[11px] text-muted-foreground border-t border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-1.5">
                          <span className="h-2.5 w-2.5 rounded-full bg-teal-600" />
                          <span>Preço Cobrado do Cliente</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
                          <span>Custos Internos Diretos (MO + Logística + Peças)</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Top Serviços Mais Rentáveis */}
                  <Card className="lg:col-span-5 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-amber-500" />
                        Top Serviços Mais Rentáveis
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Classificados pela maior margem real líquida (%)
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2.5">
                      {topProfitable.length === 0 ? (
                        <p className="text-xs text-muted-foreground text-center py-6">
                          Nenhum serviço ou OS concluída registrada ainda.
                        </p>
                      ) : (
                        topProfitable.slice(0, 5).map((item, idx) => (
                          <div
                            key={item.id || idx}
                            className="p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 hover:border-teal-400 transition-all text-xs flex items-center justify-between gap-2"
                          >
                            <div className="space-y-0.5 max-w-[62%]">
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono text-[10px] font-bold text-teal-700 dark:text-teal-400">
                                  #{item.code}
                                </span>
                                <span className="font-bold text-slate-900 dark:text-slate-100 truncate">
                                  {item.client}
                                </span>
                              </div>
                              <p className="text-[10px] text-muted-foreground truncate">
                                {item.title}
                              </p>
                            </div>

                            <div className="text-right space-y-0.5">
                              {item.hasCost ? (
                                <>
                                  <div className="font-bold text-emerald-700 dark:text-emerald-400 text-xs">
                                    +{item.realMargin}%
                                  </div>
                                  <span className="text-[10px] text-slate-500 block">
                                    Lucro:{' '}
                                    {item.grossProfit.toLocaleString('pt-BR', {
                                      style: 'currency',
                                      currency: 'BRL',
                                    })}
                                  </span>
                                </>
                              ) : (
                                <>
                                  <div className="font-bold text-slate-400 dark:text-slate-500 text-xs">
                                    Custo não informado
                                  </div>
                                  <span className="text-[10px] text-slate-500 block">
                                    Cobrado:{' '}
                                    {item.finalPrice.toLocaleString('pt-BR', {
                                      style: 'currency',
                                      currency: 'BRL',
                                    })}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            )
          })()}
        </div>
      ) : (
        /* ==================== ABA VISÃO GERAL PADRÃO ==================== */
        <>
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 p-6 md:p-8 text-white shadow-xl border border-teal-800/40">
            <div className="relative z-10 max-w-3xl space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full bg-teal-500/20 px-3 py-1 text-xs font-semibold text-teal-300 backdrop-blur-md border border-teal-400/30">
                <Flame className="h-3.5 w-3.5 text-teal-400" />
                Intertermal • Engenharia & Serviços Autorizados BERMO
              </div>
              <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">
                Gestão Comercial & Prestação de Serviços Técnicos
              </h2>
              <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
                Painel integrado de orçamentos técnicos de válvulas e trocadores de calor BERMO,
                ordens de serviço de campo, cálculo logístico no padrão Mapeia e inteligência
                operacional.
              </p>
              <div className="flex flex-wrap gap-2.5 pt-2">
                <Button
                  size="sm"
                  onClick={() => onNavigate('quotes')}
                  className="bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold shadow-md"
                >
                  <FileSpreadsheet className="h-4 w-4 mr-1.5" />
                  Novo Orçamento de Serviço
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onNavigate('catalog')}
                  className="bg-slate-800/80 hover:bg-slate-700 text-teal-200 border-teal-500/40 text-xs font-semibold"
                >
                  <Package className="h-4 w-4 mr-1.5 text-teal-400" />
                  Catálogo BERMO & ARI Armaturen
                </Button>
              </div>
            </div>
          </div>

          {/* Cartão de Destaque / Indicador de Visitas a Campo Realizadas */}
          <Card
            onClick={() => navigate('/visitas-recebidas')}
            className="border-teal-200 dark:border-teal-900/60 bg-gradient-to-br from-white via-teal-50/30 to-emerald-50/40 dark:from-slate-900 dark:via-teal-950/20 dark:to-slate-900 shadow-xs cursor-pointer hover:border-teal-500 hover:shadow-md transition-all group"
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-teal-600 dark:bg-teal-500 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                  <ClipboardList className="h-4 w-4" />
                </div>
                <div>
                  <CardTitle className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                    Visitas a Campo Realizadas
                  </CardTitle>
                  <CardDescription className="text-[11px] text-muted-foreground">
                    Ver relatórios, fotos e pareceres dos técnicos no escritório
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-1 text-[11px] font-semibold text-teal-700 dark:text-teal-400 group-hover:translate-x-0.5 transition-transform">
                <span className="hidden sm:inline">Ver lista de visitas</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                {/* Total de Visitas */}
                <div className="p-3 rounded-xl bg-white/80 dark:bg-slate-950/60 border border-teal-100 dark:border-teal-900/40">
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                    Total Registrado
                  </span>
                  <div className="text-2xl sm:text-3xl font-extrabold text-teal-800 dark:text-teal-300 mt-0.5">
                    {fieldVisitsError ? '—' : fieldVisitsMetrics.totalCount}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {fieldVisitsError
                      ? 'Não foi possível carregar'
                      : fieldVisitsMetrics.totalCount === 0
                        ? 'Nenhuma visita registrada ainda'
                        : `${fieldVisitsMetrics.totalCount} ${fieldVisitsMetrics.totalCount === 1 ? 'visita gravada' : 'visitas gravadas'} no CRM`}
                  </p>
                </div>

                {/* Visitas no Mês Corrente */}
                <div className="p-3 rounded-xl bg-white/80 dark:bg-slate-950/60 border border-teal-100 dark:border-teal-900/40">
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                    Neste Mês
                  </span>
                  <div className="text-2xl sm:text-3xl font-extrabold text-emerald-700 dark:text-emerald-400 mt-0.5">
                    {fieldVisitsError ? '—' : fieldVisitsMetrics.currentMonthCount}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {fieldVisitsError
                      ? 'Erro de rede'
                      : fieldVisitsMetrics.currentMonthCount === 0
                        ? 'Nenhuma visita neste mês'
                        : `${fieldVisitsMetrics.currentMonthCount} ${fieldVisitsMetrics.currentMonthCount === 1 ? 'visita realizada' : 'visitas realizadas'} no mês`}
                  </p>
                </div>

                {/* Última Visita Realizada */}
                <div className="p-3 rounded-xl bg-white/80 dark:bg-slate-950/60 border border-teal-100 dark:border-teal-900/40 flex flex-col justify-center">
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                    Última Visita
                  </span>
                  {fieldVisitsError ? (
                    <div className="text-xs text-muted-foreground mt-1">—</div>
                  ) : fieldVisitsMetrics.latestVisit ? (
                    <div className="mt-1 space-y-0.5">
                      <div className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate flex items-center gap-1.5">
                        <span className="truncate">
                          {fieldVisitsMetrics.latestVisit.client_name ||
                            fieldVisitsMetrics.latestVisit.company_name ||
                            'Cliente não especificado'}
                        </span>
                      </div>
                      <div className="text-[11px] text-teal-700 dark:text-teal-400 font-medium truncate">
                        Técnico: {fieldVisitsMetrics.latestVisit.employee_name || 'Intertermal'}
                        {fieldVisitsMetrics.latestFormattedDate &&
                          ` • ${fieldVisitsMetrics.latestFormattedDate}`}
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-muted-foreground mt-1">
                      Nenhuma visita registrada ainda
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Grid de KPIs de Propostas e Status Comercial */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <Card
              onClick={() => onNavigate('quotes')}
              className="border-slate-200 dark:border-slate-800 shadow-xs cursor-pointer hover:border-emerald-400 transition-all"
            >
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Propostas Aprovadas
                </CardTitle>
                <div className="h-8 w-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold text-emerald-700 dark:text-emerald-400">
                  {approvedQuotesTotal.toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  })}
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">
                  {approvedQuotes.length} de {filteredQuotesByPeriod.length} propostas fechadas
                </p>
              </CardContent>
            </Card>

            <Card
              onClick={() => onNavigate('quotes')}
              className="border-slate-200 dark:border-slate-800 shadow-xs cursor-pointer hover:border-rose-400 transition-all"
            >
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Propostas Recusadas
                </CardTitle>
                <div className="h-8 w-8 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                  <TrendingDown className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold text-rose-700 dark:text-rose-400">
                  {rejectedQuotesTotal.toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  })}
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">
                  {rejectedQuotes.length} propostas recusadas pelo cliente
                </p>
              </CardContent>
            </Card>

            <Card
              onClick={() => onNavigate('quotes')}
              className="border-slate-200 dark:border-slate-800 shadow-xs cursor-pointer hover:border-amber-400 transition-all"
            >
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Pendentes / Em Negociação
                </CardTitle>
                <div className="h-8 w-8 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <Clock className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold text-amber-700 dark:text-amber-400">
                  {pendingQuotesTotal.toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  })}
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">
                  {pendingQuotes.length} de {filteredQuotesByPeriod.length} propostas em análise
                </p>
              </CardContent>
            </Card>

            <Card
              onClick={() => onNavigate('pipeline')}
              className="border-slate-200 dark:border-slate-800 shadow-xs cursor-pointer hover:border-teal-400 transition-all"
            >
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Pipeline Comercial
                </CardTitle>
                <div className="h-8 w-8 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                  <TrendingUp className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold text-slate-900 dark:text-slate-100">
                  {totalPipelineValue.toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  })}
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">
                  {activeDeals.length} oportunidades ativas no pipeline
                </p>
              </CardContent>
            </Card>

            <Card
              onClick={() => onNavigate('pipeline')}
              className="border-slate-200 dark:border-slate-800 shadow-xs cursor-pointer hover:border-emerald-400 transition-all"
            >
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Ganhos no período
                </CardTitle>
                <div className="h-8 w-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold text-emerald-700 dark:text-emerald-400">
                  {wonDealsTotal.toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  })}
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">
                  {wonDeals.length} negócios ganhos no período selecionado
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Segunda linha de KPIs: Operação e Suporte */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card
              onClick={() => onNavigate('service_kanban')}
              className="border-slate-200 dark:border-slate-800 shadow-xs cursor-pointer hover:border-blue-400 transition-all"
            >
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Ordens de Serviço em Campo
                </CardTitle>
                <div className="h-8 w-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <Wrench className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold text-slate-900 dark:text-slate-100">
                  {activeServiceOrdersTotal > 0
                    ? activeServiceOrdersTotal.toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      })
                    : `${activeServiceOrders.length} ativas`}
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">
                  {activeServiceOrders.length} OS em campo ({serviceOrders.length} no total)
                </p>
              </CardContent>
            </Card>

            <Card
              onClick={() => onNavigate('tickets')}
              className="border-slate-200 dark:border-slate-800 shadow-xs cursor-pointer hover:border-amber-400 transition-all"
            >
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Chamados & Suporte
                </CardTitle>
                <div className="h-8 w-8 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <AlertCircle className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold text-slate-900 dark:text-slate-100">
                  {openTickets.length} abertos
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">
                  {tickets.length > 0
                    ? `${openTickets.length} de ${tickets.length} chamados ativos`
                    : 'Atendimento pós-venda industrial'}
                </p>
              </CardContent>
            </Card>

            <Card
              onClick={() => onNavigate('quotes')}
              className="border-slate-200 dark:border-slate-800 shadow-xs cursor-pointer hover:border-teal-400 transition-all"
            >
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Volume Total em Propostas
                </CardTitle>
                <div className="h-8 w-8 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                  <DollarSign className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold text-slate-900 dark:text-slate-100">
                  {totalQuotesValue.toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  })}
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">
                  {filteredQuotesByPeriod.length} propostas no período selecionado
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Grid Central: Orçamentos Recentes de Serviços + Clientes Industriais */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Orçamentos Recentes */}
            <Card className="lg:col-span-8 border-slate-200 dark:border-slate-800">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div>
                  <CardTitle className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    Orçamentos Intertermal Recentes
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Propostas técnicas com cálculo de M.O., Deslocamento e Custos Indiretos
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onNavigate('quotes')}
                  className="text-xs text-teal-700 dark:text-teal-400 hover:text-teal-800"
                >
                  Ver todos <ArrowRight className="h-3.5 w-3.5 ml-1" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-3">
                {quotes.slice(0, 4).map((q) => (
                  <div
                    key={q.id}
                    onClick={() => onNavigate('quotes')}
                    className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-teal-500/40 hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-all cursor-pointer text-xs"
                  >
                    <div className="space-y-0.5 max-w-[65%]">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-teal-700 dark:text-teal-400">
                          {q.quote_number}
                        </span>
                        <span className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                          {q.client_name || 'Cliente'}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground truncate">
                        {q.notes || 'Serviço em produtos BERMO'}
                      </p>
                    </div>

                    <div className="text-right space-y-1">
                      <span className="font-bold text-slate-900 dark:text-slate-100 block">
                        {getQuoteNumericValue(q).toLocaleString('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        })}
                      </span>
                      <Badge
                        variant="outline"
                        className={`text-[9px] uppercase px-1.5 font-bold ${
                          isApprovedQuote(q.status)
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                            : isRejectedQuote(q.status)
                              ? 'bg-rose-50 text-rose-700 border-rose-300'
                              : q.status === 'sent'
                                ? 'bg-blue-50 text-blue-700 border-blue-300'
                                : q.status === 'pending_approval'
                                  ? 'bg-amber-50 text-amber-700 border-amber-300'
                                  : 'bg-slate-100 text-slate-700 border-slate-300'
                        }`}
                      >
                        {isApprovedQuote(q.status)
                          ? 'Aprovado'
                          : isRejectedQuote(q.status)
                            ? 'Recusado'
                            : q.status === 'sent'
                              ? 'Enviado'
                              : q.status === 'pending_approval'
                                ? 'Em Aprovação'
                                : 'Rascunho'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Resumo de Clientes Industriais */}
            <Card className="lg:col-span-4 border-slate-200 dark:border-slate-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Plantas & Clientes Industriais
                </CardTitle>
                <CardDescription className="text-xs">
                  Segmentos industriais com trocadores e válvulas BERMO
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-xs">
                {clients.slice(0, 4).map((c) => (
                  <div
                    key={c.id}
                    onClick={() => onNavigate('clients')}
                    className="p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 hover:border-teal-500/40 transition-all cursor-pointer"
                  >
                    <div className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                      {c.name}
                    </div>
                    <div className="flex justify-between items-center text-[10px] text-muted-foreground mt-1">
                      <span>{c.segment || 'Indústria Geral'}</span>
                      <span>{c.city ? `${c.city}/${c.state}` : 'Brasil'}</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}
