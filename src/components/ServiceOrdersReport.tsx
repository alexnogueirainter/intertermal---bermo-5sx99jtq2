import React, { useMemo, useState } from 'react'
import {
  FileCheck2,
  Filter,
  Calendar,
  Clock,
  DollarSign,
  TrendingUp,
  Search,
  Building2,
  Wrench,
  ShieldCheck,
  FileText,
  Activity,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { ClientRecord, QuoteRecord, ServiceOrderRecord } from '@/types/crm'

interface ServiceOrdersReportProps {
  serviceOrders: ServiceOrderRecord[]
  clients: ClientRecord[]
  quotes?: QuoteRecord[]
  onSelectServiceOrder?: (order: ServiceOrderRecord) => void
}

export const SO_REPORT_STATUSES = [
  {
    key: 'pending_approval',
    label: 'Pendente Aprovação',
    color: 'text-amber-700 dark:text-amber-400',
    badgeClass:
      'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    barColor: 'bg-amber-500',
  },
  {
    key: 'vistoria',
    label: 'Vistoria',
    color: 'text-amber-600 dark:text-amber-400',
    badgeClass:
      'bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    barColor: 'bg-amber-400',
  },
  {
    key: 'proposta',
    label: 'Proposta',
    color: 'text-sky-700 dark:text-sky-400',
    badgeClass:
      'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 border-sky-200 dark:border-sky-800',
    barColor: 'bg-sky-500',
  },
  {
    key: 'execucao',
    label: 'Execução',
    color: 'text-blue-700 dark:text-blue-400',
    badgeClass:
      'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-200 dark:border-blue-800',
    barColor: 'bg-blue-600',
  },
  {
    key: 'inspecao',
    label: 'Inspeção',
    color: 'text-purple-700 dark:text-purple-400',
    badgeClass:
      'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border-purple-200 dark:border-purple-800',
    barColor: 'bg-purple-500',
  },
  {
    key: 'fechado',
    label: 'Fechado / Concluído',
    color: 'text-emerald-700 dark:text-emerald-400',
    badgeClass:
      'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    barColor: 'bg-emerald-600',
  },
  {
    key: 'cancelada',
    label: 'Cancelada',
    color: 'text-slate-600 dark:text-slate-400',
    badgeClass:
      'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700',
    barColor: 'bg-slate-400',
  },
] as const

export type ServiceOrderReportStatusKey = (typeof SO_REPORT_STATUSES)[number]['key']

export function categorizeReportStatus(rawStatus?: string): ServiceOrderReportStatusKey {
  if (!rawStatus) return 'vistoria'
  const s = rawStatus.toLowerCase().trim()
  if (s === 'cancelled' || s === 'cancelada' || s === 'canceled') return 'cancelada'
  if (s === 'pending_approval' || s === 'pending') return 'pending_approval'
  if (s === 'vistoria') return 'vistoria'
  if (s === 'proposta') return 'proposta'
  if (s === 'execucao' || s === 'in_execution' || s === 'in_progress' || s === 'approved')
    return 'execucao'
  if (s === 'inspecao') return 'inspecao'
  if (s === 'fechado' || s === 'completed') return 'fechado'
  return 'vistoria'
}

export function getOrderNumericValue(order: ServiceOrderRecord): number {
  if (typeof order.total_value === 'number' && !isNaN(order.total_value)) return order.total_value
  if (typeof order.final_price === 'number' && !isNaN(order.final_price)) return order.final_price
  return 0
}

function formatDuration(hours: number): string {
  if (hours <= 0) return '-'
  if (hours < 1) {
    const mins = Math.round(hours * 60)
    return `${mins} min`
  }
  if (hours < 24) {
    return `${hours.toFixed(1)} h`
  }
  const days = hours / 24
  if (days < 30) {
    return `${days.toFixed(1)} dias`
  }
  const months = days / 30
  return `${months.toFixed(1)} meses`
}

export const ServiceOrdersReport: React.FC<ServiceOrdersReportProps> = ({
  serviceOrders,
  clients,
  onSelectServiceOrder,
}) => {
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [clientFilter, setClientFilter] = useState<string>('all')
  const [periodFilter, setPeriodFilter] = useState<'all' | 'month' | 'quarter' | 'year' | 'custom'>(
    'all',
  )
  const [customStartDate, setCustomStartDate] = useState<string>('')
  const [customEndDate, setCustomEndDate] = useState<string>('')
  const [searchTerm, setSearchTerm] = useState<string>('')

  const filteredByPeriod = useMemo(() => {
    const now = new Date()
    return serviceOrders.filter((so) => {
      if (!so.created) return true
      const date = new Date(so.created)
      if (isNaN(date.getTime())) return true

      if (periodFilter === 'all') return true
      if (periodFilter === 'month') {
        return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()
      }
      if (periodFilter === 'quarter') {
        const currentQuarter = Math.floor(now.getMonth() / 3)
        const orderQuarter = Math.floor(date.getMonth() / 3)
        return currentQuarter === orderQuarter && date.getFullYear() === now.getFullYear()
      }
      if (periodFilter === 'year') {
        return date.getFullYear() === now.getFullYear()
      }
      if (periodFilter === 'custom') {
        if (customStartDate && date < new Date(customStartDate)) return false
        if (customEndDate) {
          const end = new Date(customEndDate)
          end.setHours(23, 59, 59, 999)
          if (date > end) return false
        }
        return true
      }
      return true
    })
  }, [serviceOrders, periodFilter, customStartDate, customEndDate])

  const filteredOrders = useMemo(() => {
    return filteredByPeriod.filter((so) => {
      if (statusFilter !== 'all') {
        const cat = categorizeReportStatus(so.status)
        if (cat !== statusFilter) return false
      }
      if (clientFilter !== 'all') {
        if (so.client_id !== clientFilter && so.client_name !== clientFilter) {
          return false
        }
      }
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase()
        const matches =
          (so.order_number && so.order_number.toLowerCase().includes(term)) ||
          (so.quote_number && so.quote_number.toLowerCase().includes(term)) ||
          (so.client_name && so.client_name.toLowerCase().includes(term)) ||
          (so.title && so.title.toLowerCase().includes(term)) ||
          (so.equipment_model && so.equipment_model.toLowerCase().includes(term))
        if (!matches) return false
      }
      return true
    })
  }, [filteredByPeriod, statusFilter, clientFilter, searchTerm])

  const statusStats = useMemo(() => {
    const counts: Record<ServiceOrderReportStatusKey, { count: number; value: number }> = {
      pending_approval: { count: 0, value: 0 },
      vistoria: { count: 0, value: 0 },
      proposta: { count: 0, value: 0 },
      execucao: { count: 0, value: 0 },
      inspecao: { count: 0, value: 0 },
      fechado: { count: 0, value: 0 },
      cancelada: { count: 0, value: 0 },
    }

    filteredOrders.forEach((so) => {
      const cat = categorizeReportStatus(so.status)
      const val = getOrderNumericValue(so)
      if (counts[cat]) {
        counts[cat].count += 1
        counts[cat].value += val
      }
    })
    return counts
  }, [filteredOrders])

  const totalOrders = filteredOrders.length
  const totalValue = useMemo(() => {
    return filteredOrders.reduce((sum, so) => sum + getOrderNumericValue(so), 0)
  }, [filteredOrders])

  const inFieldOrders = useMemo(() => {
    return filteredOrders.filter((so) => {
      const cat = categorizeReportStatus(so.status)
      return (
        cat === 'vistoria' ||
        cat === 'proposta' ||
        cat === 'execucao' ||
        cat === 'inspecao' ||
        cat === 'pending_approval'
      )
    })
  }, [filteredOrders])

  const inFieldValue = useMemo(() => {
    return inFieldOrders.reduce((sum, so) => sum + getOrderNumericValue(so), 0)
  }, [inFieldOrders])

  const completedOrders = useMemo(() => {
    return filteredOrders.filter((so) => categorizeReportStatus(so.status) === 'fechado')
  }, [filteredOrders])

  const completedValue = useMemo(() => {
    return completedOrders.reduce((sum, so) => sum + getOrderNumericValue(so), 0)
  }, [completedOrders])

  const completionRate = totalOrders > 0 ? (completedOrders.length / totalOrders) * 100 : 0

  const stageAverageDurations = useMemo(() => {
    const stageDurations: Record<string, number[]> = {
      vistoria: [],
      proposta: [],
      execucao: [],
      inspecao: [],
      pending_approval: [],
    }

    filteredOrders.forEach((so) => {
      const history = so.status_history || []
      const createdDate = so.created ? new Date(so.created) : null

      if (!history || history.length === 0) {
        if (createdDate && so.updated) {
          const updatedDate = new Date(so.updated)
          const diffHours = (updatedDate.getTime() - createdDate.getTime()) / (1000 * 60 * 60)
          const cat = categorizeReportStatus(so.status)
          if (stageDurations[cat] && diffHours > 0) {
            stageDurations[cat].push(diffHours)
          }
        }
        return
      }

      const sorted = [...history].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
      )

      let prevDate = createdDate || new Date(sorted[0].date)
      let currentStage = categorizeReportStatus(sorted[0].from_status || 'vistoria')

      for (let i = 0; i < sorted.length; i++) {
        const item = sorted[i]
        const itemDate = new Date(item.date)
        if (!isNaN(itemDate.getTime()) && !isNaN(prevDate.getTime())) {
          const hours = (itemDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60)
          if (hours >= 0 && stageDurations[currentStage]) {
            stageDurations[currentStage].push(hours)
          }
        }
        prevDate = itemDate
        currentStage = categorizeReportStatus(item.to_status)
      }

      if (so.updated && currentStage !== 'fechado' && currentStage !== 'cancelada') {
        const updatedDate = new Date(so.updated)
        const trailingHours = (updatedDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60)
        if (trailingHours > 0 && stageDurations[currentStage]) {
          stageDurations[currentStage].push(trailingHours)
        }
      }
    })

    const averages: Record<string, { avgHours: number; count: number }> = {}
    Object.keys(stageDurations).forEach((key) => {
      const arr = stageDurations[key]
      if (arr.length > 0) {
        const sum = arr.reduce((a, b) => a + b, 0)
        averages[key] = { avgHours: sum / arr.length, count: arr.length }
      } else {
        averages[key] = { avgHours: 0, count: 0 }
      }
    })

    return averages
  }, [filteredOrders])

  const getLastMovementDate = (order: ServiceOrderRecord): string => {
    if (order.status_history && order.status_history.length > 0) {
      const last = order.status_history[order.status_history.length - 1]
      return last.date
    }
    return order.updated || order.created || ''
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <FileCheck2 className="h-5 w-5 text-teal-600" />
            Relatório Gerencial de Ordens de Serviço (OS)
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Monitoramento de volume em campo, taxa de conclusão, tempos médios por etapa e trilha de
            auditoria.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[180px]">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Buscar OS ou cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 text-xs h-9 bg-slate-50 dark:bg-slate-950"
            />
          </div>

          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-950 p-1 rounded-lg border border-slate-200 dark:border-slate-800">
            <Filter className="h-3.5 w-3.5 text-muted-foreground ml-1" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs font-semibold bg-transparent text-slate-800 dark:text-slate-100 focus:outline-hidden pr-2 py-1"
            >
              <option value="all">Todos os Status</option>
              {SO_REPORT_STATUSES.map((st) => (
                <option key={st.key} value={st.key}>
                  {st.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-950 p-1 rounded-lg border border-slate-200 dark:border-slate-800">
            <Building2 className="h-3.5 w-3.5 text-muted-foreground ml-1" />
            <select
              value={clientFilter}
              onChange={(e) => setClientFilter(e.target.value)}
              className="text-xs font-semibold bg-transparent text-slate-800 dark:text-slate-100 focus:outline-hidden max-w-[160px] truncate pr-2 py-1"
            >
              <option value="all">Todos os Clientes</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-950 p-1 rounded-lg border border-slate-200 dark:border-slate-800">
            <Calendar className="h-3.5 w-3.5 text-teal-600 ml-1" />
            <select
              value={periodFilter}
              onChange={(e) => setPeriodFilter(e.target.value as any)}
              className="text-xs font-semibold bg-transparent text-slate-800 dark:text-slate-100 focus:outline-hidden pr-2 py-1"
            >
              <option value="all">Todo o período</option>
              <option value="month">Este mês</option>
              <option value="quarter">Este trimestre</option>
              <option value="year">Este ano</option>
              <option value="custom">Personalizado</option>
            </select>
          </div>

          {periodFilter === 'custom' && (
            <div className="flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-1">
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="text-xs bg-transparent text-slate-800 dark:text-slate-100"
              />
              <span className="text-xs text-muted-foreground">até</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="text-xs bg-transparent text-slate-800 dark:text-slate-100"
              />
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">
              Total de Ordens de Serviço
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-600 flex items-center justify-center font-bold">
              <FileCheck2 className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-teal-700 dark:text-teal-400">{totalOrders}</div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Volume financeiro total:{' '}
              <strong className="text-slate-800 dark:text-slate-200">
                {totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </strong>
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">
              Valor em Campo (Ativas)
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center font-bold">
              <Wrench className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-700 dark:text-blue-400">
              {inFieldValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              {inFieldOrders.length} OS em vistoria, proposta, execução ou inspeção
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">
              Valor Concluído (Fechadas)
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center font-bold">
              <DollarSign className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">
              {completedValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              {completedOrders.length} OS entregues e arquivadas
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">
              Taxa de Conclusão (%)
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center font-bold">
              <TrendingUp className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-700 dark:text-purple-400">
              {completionRate.toFixed(1)}%
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              {statusStats.cancelada.count} cancelada(s) (
              {totalOrders > 0 ? ((statusStats.cancelada.count / totalOrders) * 100).toFixed(1) : 0}
              %)
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Activity className="h-4 w-4 text-teal-600" />
            Distribuição de Ordens de Serviço por Status
          </CardTitle>
          <CardDescription className="text-xs">
            Visão consolidada das 7 fases operacionais da Intertermal com contagem e valor
            correspondente
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-3.5 rounded-full overflow-hidden flex">
            {totalValue > 0 ? (
              SO_REPORT_STATUSES.map((st) => {
                const stat = statusStats[st.key]
                if (stat.value <= 0) return null
                const pct = (stat.value / totalValue) * 100
                return (
                  <div
                    key={st.key}
                    className={`${st.barColor} h-full transition-all`}
                    style={{ width: `${pct}%` }}
                    title={`${st.label}: ${stat.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} (${pct.toFixed(1)}%)`}
                  />
                )
              })
            ) : (
              <div className="w-full bg-slate-200 dark:bg-slate-700 h-full" />
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5 pt-1">
            {SO_REPORT_STATUSES.map((st) => {
              const stat = statusStats[st.key]
              const percent = totalOrders > 0 ? (stat.count / totalOrders) * 100 : 0
              return (
                <div
                  key={st.key}
                  className="p-2.5 rounded-lg border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 truncate">
                      {st.label}
                    </span>
                  </div>

                  <div className="mt-1.5">
                    <div className="text-lg font-bold text-slate-900 dark:text-slate-100">
                      {stat.count}
                    </div>
                    <div className="text-[10px] text-muted-foreground truncate">
                      {stat.value.toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                        maximumFractionDigits: 0,
                      })}
                    </div>
                  </div>

                  <div className="text-[10px] text-muted-foreground font-mono mt-1 pt-1 border-t border-slate-100 dark:border-slate-800">
                    {percent.toFixed(0)}% do total
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Clock className="h-4 w-4 text-teal-600" />
            Tempo Médio de Permanência por Etapa Operacional
          </CardTitle>
          <CardDescription className="text-xs">
            Calculado automaticamente através da trilha de auditoria e histórico de mudanças de
            status registradas em cada OS
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {[
              {
                key: 'vistoria',
                label: '1. Vistoria Técnica',
                icon: Search,
                color: 'text-amber-600',
              },
              {
                key: 'proposta',
                label: '2. Proposta & Engenharia',
                icon: FileText,
                color: 'text-sky-600',
              },
              {
                key: 'execucao',
                label: '3. Execução de Campo',
                icon: Wrench,
                color: 'text-blue-600',
              },
              {
                key: 'inspecao',
                label: '4. Inspeção / Testes',
                icon: ShieldCheck,
                color: 'text-purple-600',
              },
            ].map((stage) => {
              const data = stageAverageDurations[stage.key] || { avgHours: 0, count: 0 }
              const Icon = stage.icon
              return (
                <div
                  key={stage.key}
                  className="p-3 rounded-lg border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Icon className={`h-4 w-4 ${stage.color}`} />
                      {stage.label}
                    </span>
                    <Badge variant="outline" className="text-[10px] font-mono">
                      {data.count} registro(s)
                    </Badge>
                  </div>

                  <div className="text-xl font-bold text-slate-900 dark:text-slate-100">
                    {formatDuration(data.avgHours)}
                  </div>

                  <p className="text-[10px] text-muted-foreground">
                    {data.avgHours > 0
                      ? `Média de ${(data.avgHours / 24).toFixed(1)} dias em campo`
                      : 'Sem histórico registrado'}
                  </p>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <FileCheck2 className="h-4 w-4 text-teal-600" />
              Tabela Analítica de Ordens de Serviço ({filteredOrders.length})
            </CardTitle>
            <CardDescription className="text-xs">
              Relação completa com cliente, proposta vinculada, status atual, valor, data de criação
              e última movimentação
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-950/60 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 font-semibold">
                <tr>
                  <th className="py-3 px-4">OS / Título</th>
                  <th className="py-3 px-4">Cliente Industrial</th>
                  <th className="py-3 px-4 text-center">Proposta</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Valor da OS</th>
                  <th className="py-3 px-4 text-center">Criação</th>
                  <th className="py-3 px-4 text-center">Última Movimentação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-muted-foreground">
                      Nenhuma Ordem de Serviço encontrada com os filtros selecionados.
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((so) => {
                    const cat = categorizeReportStatus(so.status)
                    const statusMeta = SO_REPORT_STATUSES.find((s) => s.key === cat)
                    const lastMove = getLastMovementDate(so)
                    const val = getOrderNumericValue(so)

                    return (
                      <tr
                        key={so.id}
                        onClick={() => onSelectServiceOrder && onSelectServiceOrder(so)}
                        className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors ${
                          onSelectServiceOrder ? 'cursor-pointer' : ''
                        }`}
                      >
                        <td className="py-3 px-4">
                          <div className="font-mono font-bold text-teal-700 dark:text-teal-400">
                            OS #{so.order_number || so.quote_number || so.id.slice(0, 6)}
                          </div>
                          <div className="text-[11px] text-slate-700 dark:text-slate-300 font-medium line-clamp-1 max-w-[240px]">
                            {so.title || `Manutenção BERMO ${so.equipment_model || ''}`}
                          </div>
                          {so.equipment_model && (
                            <div className="text-[10px] text-muted-foreground">
                              Equip: {so.equipment_model}
                            </div>
                          )}
                        </td>

                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                            <Building2 className="h-3 w-3 text-slate-400 shrink-0" />
                            <span className="truncate max-w-[180px]">
                              {so.client_name || 'Cliente Geral'}
                            </span>
                          </div>
                        </td>

                        <td className="py-3 px-4 text-center">
                          {so.quote_number ? (
                            <Badge
                              variant="outline"
                              className="font-mono text-[10px] text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700"
                            >
                              #{so.quote_number}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-[10px]">-</span>
                          )}
                        </td>

                        <td className="py-3 px-4 text-center">
                          <Badge
                            className={`text-[10px] font-semibold uppercase ${
                              statusMeta?.badgeClass || 'bg-slate-100 text-slate-800'
                            }`}
                          >
                            {statusMeta?.label || so.status}
                          </Badge>
                        </td>

                        <td className="py-3 px-4 text-right">
                          <span className="font-bold text-slate-900 dark:text-slate-100">
                            {val.toLocaleString('pt-BR', {
                              style: 'currency',
                              currency: 'BRL',
                            })}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-center text-[11px] text-muted-foreground font-mono">
                          {so.created ? new Date(so.created).toLocaleDateString('pt-BR') : '-'}
                        </td>

                        <td className="py-3 px-4 text-center text-[11px] text-muted-foreground font-mono">
                          {lastMove ? (
                            <div>
                              <span>{new Date(lastMove).toLocaleDateString('pt-BR')}</span>
                              <div className="text-[10px] text-slate-400">
                                {new Date(lastMove).toLocaleTimeString('pt-BR', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </div>
                            </div>
                          ) : (
                            '-'
                          )}
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
}
