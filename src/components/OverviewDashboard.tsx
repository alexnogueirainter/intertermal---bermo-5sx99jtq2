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
import { computeOrderMargins } from '@/lib/order-margins'
import { osExecutionReportsService } from '@/services/os-execution-reports'
import type { OsExecutionReportRecord } from '@/types/crm'

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
  const [executionReports, setExecutionReports] = React.useState<OsExecutionReportRecord[]>([])

  // Relatórios de execução para a margem realizada
  React.useEffect(() => {
    let active = true
    osExecutionReportsService
      .getAll()
      .then((reps) => {
        if (active) setExecutionReports(reps)
      })
      .catch(() => {
        // falha silenciosa: margem realizada simplesmente não aparece
      })
    return () => {
      active = false
    }
  }, [])

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

  // Utilitário para verificar se um negócio está ativo (exclui perdidos/lost/recusados)
  const isDealActive = (deal: DealRecord): boolean => {
    if (!deal) return false
    const s = (deal.stage || '').toLowerCase().trim()
    return s !== 'lost' && s !== 'perdido' && s !== 'recusado' && s !== 'rejeitado'
  }

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

  const activeDeals = deals.filter(isDealActive)
  const totalPipelineValue = activeDeals.reduce((sum, d) => sum + getDealNumericValue(d), 0)

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