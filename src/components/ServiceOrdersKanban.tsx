import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Wrench,
  Search,
  Building2,
  Calendar,
  Layers,
  CheckCircle2,
  Clock,
  ArrowRight,
  ArrowLeft,
  ChevronRight,
  Plus,
  History,
  ShieldCheck,
  AlertCircle,
  AlertTriangle,
  FileCheck2,
  FileText,
  DollarSign,
  User,
  Filter,
  Trash2,
  Ban,
  Loader2,
  Eye,
  Printer,
} from 'lucide-react'
import { OsExecutionReportDialog } from '@/components/OsExecutionReportDialog'
import { resolveServiceOrderLiveValue } from '@/lib/service-order-live-value'
import type {
  ServiceOrderRecord,
  ServiceOrderStatus,
  ClientRecord,
  QuoteRecord,
  ServiceOrderStatusHistoryItem,
} from '@/types/crm'

interface ServiceOrdersKanbanProps {
  serviceOrders: ServiceOrderRecord[]
  clients: ClientRecord[]
  quotes?: QuoteRecord[]
  onUpdateStatus: (
    id: string,
    status: ServiceOrderStatus,
    notes?: string,
    authorName?: string,
  ) => Promise<void> | void
  onDeleteServiceOrder?: (id: string) => Promise<void> | void
  onCancelServiceOrder?: (id: string, reason?: string) => Promise<void> | void
  onCreateServiceOrder?: (data: Partial<ServiceOrderRecord>) => void
  onSelectServiceOrder?: (order: ServiceOrderRecord) => void
}

// 5 Colunas Obrigatórias do Pipeline Técnico
export const SERVICE_ORDER_STAGES: {
  key: ServiceOrderStatus
  label: string
  color: string
  border: string
  bg: string
  badgeBg: string
  icon: React.ComponentType<{ className?: string }>
  description: string
}[] = [
  {
    key: 'vistoria',
    label: '1. Vistoria',
    color: 'text-amber-700 dark:text-amber-400',
    border: 'border-amber-300 dark:border-amber-800',
    bg: 'bg-amber-50/40 dark:bg-amber-950/20',
    badgeBg: 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200',
    icon: Search,
    description: 'Vistoria técnica de campo & Levantamento de dados térmicos',
  },
  {
    key: 'proposta',
    label: '2. Proposta',
    color: 'text-sky-700 dark:text-sky-400',
    border: 'border-sky-300 dark:border-sky-800',
    bg: 'bg-sky-50/40 dark:bg-sky-950/20',
    badgeBg: 'bg-sky-100 text-sky-800 dark:bg-sky-900/50 dark:text-sky-200',
    icon: FileText,
    description: 'Dimensionamento e validação da proposta comercial/técnica',
  },
  {
    key: 'execucao',
    label: '3. Execução',
    color: 'text-blue-700 dark:text-blue-400',
    border: 'border-blue-300 dark:border-blue-800',
    bg: 'bg-blue-50/40 dark:bg-blue-950/20',
    badgeBg: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200',
    icon: Wrench,
    description: 'Serviço em andamento (limpeza CIP, retubagem, placas/gaxetas)',
  },
  {
    key: 'inspecao',
    label: '4. Inspeção',
    color: 'text-purple-700 dark:text-purple-400',
    border: 'border-purple-300 dark:border-purple-800',
    bg: 'bg-purple-50/40 dark:bg-purple-950/20',
    badgeBg: 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-200',
    icon: ShieldCheck,
    description: 'Teste hidrostático, estanqueidade e emissão de laudo',
  },
  {
    key: 'fechado',
    label: '5. Fechado',
    color: 'text-emerald-700 dark:text-emerald-400',
    border: 'border-emerald-300 dark:border-emerald-800',
    bg: 'bg-emerald-50/40 dark:bg-emerald-950/20',
    badgeBg: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200',
    icon: CheckCircle2,
    description: 'Ordem de Serviço entregue, faturada e arquivada',
  },
]

// Normalizador de status legado para as 5 colunas
export function normalizeServiceOrderStatus(status?: string): ServiceOrderStatus {
  if (!status) return 'vistoria'
  switch (status) {
    case 'vistoria':
      return 'vistoria'
    case 'proposta':
    case 'pending':
    case 'pending_approval':
      return 'proposta'
    case 'execucao':
    case 'in_execution':
    case 'in_progress':
    case 'approved':
      return 'execucao'
    case 'inspecao':
      return 'inspecao'
    case 'fechado':
    case 'completed':
      return 'fechado'
    default:
      return 'vistoria'
  }
}

export const ServiceOrdersKanban: React.FC<ServiceOrdersKanbanProps> = ({
  serviceOrders,
  clients,
  quotes = [],
  onUpdateStatus,
  onDeleteServiceOrder,
  onCancelServiceOrder,
  onCreateServiceOrder,
  onSelectServiceOrder,
}) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [clientFilter, setClientFilter] = useState<string>('all')
  const [selectedOrder, setSelectedOrder] = useState<ServiceOrderRecord | null>(null)
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false)
  const [isTransitionModalOpen, setIsTransitionModalOpen] = useState(false)
  const [transitionTarget, setTransitionTarget] = useState<{
    order: ServiceOrderRecord
    targetStatus: ServiceOrderStatus
  } | null>(null)
  const [transitionNote, setTransitionNote] = useState('')
  const [draggedOrderId, setDraggedOrderId] = useState<string | null>(null)

  // Modal do Relatório de Execução da OS (PDF)
  const [isReportModalOpen, setIsReportModalOpen] = useState(false)
  const [orderForReport, setOrderForReport] = useState<ServiceOrderRecord | null>(null)

  // Modais de Exclusão e Cancelamento de OS
  const [orderToDelete, setOrderToDelete] = useState<ServiceOrderRecord | null>(null)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const [orderToCancel, setOrderToCancel] = useState<ServiceOrderRecord | null>(null)
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [isCancelling, setIsCancelling] = useState(false)

  // Filtragem
  const filteredOrders = serviceOrders.filter((so) => {
    const term = searchTerm.toLowerCase()
    const matchesTerm =
      !term ||
      (so.order_number && so.order_number.toLowerCase().includes(term)) ||
      (so.quote_number && so.quote_number.toLowerCase().includes(term)) ||
      (so.client_name && so.client_name.toLowerCase().includes(term)) ||
      (so.title && so.title.toLowerCase().includes(term)) ||
      (so.equipment_model && so.equipment_model.toLowerCase().includes(term))

    const matchesClient = clientFilter === 'all' || so.client_id === clientFilter
    return matchesTerm && matchesClient
  })

  // Agrupamento por status nas 5 colunas
  const getOrdersForStage = (stageKey: ServiceOrderStatus) => {
    return filteredOrders.filter((so) => normalizeServiceOrderStatus(so.status) === stageKey)
  }

  const getStageTotal = (stageKey: ServiceOrderStatus) => {
    return getOrdersForStage(stageKey).reduce(
      (sum, o) => sum + resolveServiceOrderLiveValue(o, quotes),
      0,
    )
  }

  // Avançar ou Retroceder de etapa
  const handleMoveOrder = (order: ServiceOrderRecord, direction: 'next' | 'prev') => {
    const currentNorm = normalizeServiceOrderStatus(order.status)
    const currentIndex = SERVICE_ORDER_STAGES.findIndex((s) => s.key === currentNorm)
    if (currentIndex === -1) return

    const targetIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1
    if (targetIndex < 0 || targetIndex >= SERVICE_ORDER_STAGES.length) return

    const targetStage = SERVICE_ORDER_STAGES[targetIndex]
    setTransitionTarget({ order, targetStatus: targetStage.key })
    setTransitionNote('')
    setIsTransitionModalOpen(true)
  }

  const handleConfirmTransition = async () => {
    if (!transitionTarget) return
    const { order, targetStatus } = transitionTarget
    const currentNorm = normalizeServiceOrderStatus(order.status)

    await onUpdateStatus(
      order.id,
      targetStatus,
      transitionNote || `Movido para ${targetStatus.toUpperCase()}`,
      'Alex Nogueira (Especialista BERMO)',
    )

    // Se está saindo de proposta para execução, disparar/oferecer o modal de geração do Relatório de Execução em PDF
    const isEnteringExecution =
      (currentNorm === 'proposta' || currentNorm === 'vistoria') && targetStatus === 'execucao'

    setIsTransitionModalOpen(false)
    setTransitionTarget(null)

    if (isEnteringExecution) {
      setOrderForReport(order)
      setIsReportModalOpen(true)
    }
  }

  // Confirmação de Exclusão de OS
  const handleConfirmDelete = async () => {
    if (!orderToDelete) return
    setIsDeleting(true)
    try {
      if (onDeleteServiceOrder) {
        await onDeleteServiceOrder(orderToDelete.id)
      }
      setIsDeleteModalOpen(false)
      setOrderToDelete(null)
    } finally {
      setIsDeleting(false)
    }
  }

  // Confirmação de Cancelamento de OS (status "cancelled")
  const handleConfirmCancel = async () => {
    if (!orderToCancel) return
    setIsCancelling(true)
    try {
      const reason = cancelReason.trim() || 'Cancelado pelo usuário no Pipeline Técnico'
      if (onCancelServiceOrder) {
        await onCancelServiceOrder(orderToCancel.id, reason)
      } else {
        await onUpdateStatus(
          orderToCancel.id,
          'cancelled',
          reason,
          'Alex Nogueira (Especialista BERMO)',
        )
      }
      setIsCancelModalOpen(false)
      setOrderToCancel(null)
      setCancelReason('')
    } finally {
      setIsCancelling(false)
    }
  }

  // Drag and Drop simples nativo HTML5
  const handleDragStart = (e: React.DragEvent, orderId: string) => {
    e.dataTransfer.setData('text/plain', orderId)
    setDraggedOrderId(orderId)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = async (e: React.DragEvent, targetStageKey: ServiceOrderStatus) => {
    e.preventDefault()
    const orderId = e.dataTransfer.getData('text/plain') || draggedOrderId
    setDraggedOrderId(null)
    if (!orderId) return

    const order = serviceOrders.find((o) => o.id === orderId)
    if (!order) return

    const currentNorm = normalizeServiceOrderStatus(order.status)
    if (currentNorm === targetStageKey) return

    setTransitionTarget({ order, targetStatus: targetStageKey })
    setTransitionNote('')
    setIsTransitionModalOpen(true)
  }

  return (
    <div className="space-y-4">
      {/* Barra de Filtro e Métricas Rápidas */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar OS, cliente, modelo de trocador..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 text-xs h-9 bg-slate-50 dark:bg-slate-950"
            />
          </div>

          <Select value={clientFilter} onValueChange={setClientFilter}>
            <SelectTrigger className="w-44 text-xs h-9 bg-slate-50 dark:bg-slate-950">
              <Filter className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
              <SelectValue placeholder="Filtrar por Cliente" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">
                Todos os Clientes
              </SelectItem>
              {clients.map((c) => (
                <SelectItem key={c.id} value={c.id} className="text-xs">
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className="text-xs font-mono px-2.5 py-1 bg-slate-50 dark:bg-slate-950"
          >
            Total no Pipeline:{' '}
            <strong className="ml-1 text-teal-700 dark:text-teal-400">
              {filteredOrders.length} OS
            </strong>
          </Badge>
        </div>
      </div>

      {/* Grid do Kanban (5 Colunas: Vistoria -> Proposta -> Execução -> Inspeção -> Fechado) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3.5 overflow-x-auto pb-4">
        {SERVICE_ORDER_STAGES.map((stage, stageIndex) => {
          const stageOrders = getOrdersForStage(stage.key)
          const totalVal = getStageTotal(stage.key)
          const StageIcon = stage.icon

          return (
            <div
              key={stage.key}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, stage.key)}
              className={`rounded-xl border ${stage.border} ${stage.bg} flex flex-col min-w-[260px] p-2.5 transition-all shadow-2xs`}
            >
              {/* Cabeçalho da Coluna */}
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200/70 dark:border-slate-800">
                <div className="flex items-center gap-1.5">
                  <div className="p-1 rounded-md bg-white dark:bg-slate-900 shadow-2xs">
                    <StageIcon className={`h-4 w-4 ${stage.color}`} />
                  </div>
                  <div>
                    <h3 className={`text-xs font-bold uppercase tracking-wider ${stage.color}`}>
                      {stage.label}
                    </h3>
                    <div className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                      {totalVal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </div>
                  </div>
                </div>
                <Badge className={`text-[10px] font-mono font-bold px-1.5 py-0.5 ${stage.badgeBg}`}>
                  {stageOrders.length}
                </Badge>
              </div>

              <p className="text-[10px] text-muted-foreground mb-2 leading-tight">
                {stage.description}
              </p>

              {/* Lista de Cards da Etapa */}
              <div className="space-y-2.5 flex-1 min-h-[360px]">
                {stageOrders.length === 0 ? (
                  <div className="h-32 flex flex-col items-center justify-center text-center text-muted-foreground/60 border border-dashed rounded-lg border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40 p-3">
                    <StageIcon className="h-5 w-5 mb-1 opacity-40" />
                    <span className="text-[11px]">Nenhuma OS nesta etapa</span>
                    <span className="text-[9px] text-slate-400">Arraste ou avance um card</span>
                  </div>
                ) : (
                  stageOrders.map((order) => {
                    const equipModel =
                      order.equipment_model ||
                      (order.equipment_info?.model as string) ||
                      'Trocador BERMO'

                    return (
                      <Card
                        key={order.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, order.id)}
                        className="p-3 shadow-2xs hover:shadow-md transition-all border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 cursor-grab active:cursor-grabbing space-y-2 group relative hover:border-teal-500/60"
                      >
                        {/* Topo do Card: Número da OS & Badges + Ações Rápidas */}
                        <div className="flex items-start justify-between gap-1.5">
                          <span className="font-mono text-[11px] font-bold text-teal-800 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/80 px-1.5 py-0.5 rounded border border-teal-200 dark:border-teal-800">
                            OS #{order.order_number || order.quote_number || order.id.slice(0, 6)}
                          </span>

                          <div className="flex items-center gap-1">
                            {order.priority === 'urgent' || order.priority === 'high' ? (
                              <Badge variant="destructive" className="text-[9px] px-1 py-0 mr-0.5">
                                Alta
                              </Badge>
                            ) : null}

                            {/* Botão Relatório de Execução da OS (PDF) */}
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation()
                                setOrderForReport(order)
                                setIsReportModalOpen(true)
                              }}
                              className="h-6 w-6 text-slate-400 hover:text-teal-700 hover:bg-teal-50 dark:hover:bg-teal-950/40 transition-colors"
                              title="Gerar / Editar Relatório de Execução (PDF)"
                              aria-label={`Relatório de Execução OS #${order.order_number || order.id}`}
                            >
                              <FileCheck2 className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
                            </Button>

                            {/* Botão Cancelar OS */}
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation()
                                setOrderToCancel(order)
                                setCancelReason(
                                  `Cancelada a partir da proposta #${order.quote_number || order.order_number || ''}`,
                                )
                                setIsCancelModalOpen(true)
                              }}
                              className="h-6 w-6 text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-colors"
                              title="Cancelar Ordem de Serviço (mantém histórico)"
                              aria-label={`Cancelar OS #${order.order_number || order.id}`}
                            >
                              <Ban className="h-3.5 w-3.5" />
                            </Button>

                            {/* Botão Excluir OS (Lixeira no padrão visual do QuotesManager) */}
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation()
                                setOrderToDelete(order)
                                setIsDeleteModalOpen(true)
                              }}
                              className="h-6 w-6 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                              title="Excluir Ordem de Serviço permanentemente"
                              aria-label={`Excluir OS #${order.order_number || order.id}`}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>

                        {/* Título e Cliente */}
                        <div>
                          <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100 group-hover:text-teal-700 dark:group-hover:text-teal-400 line-clamp-2 leading-tight">
                            {order.title || `Manutenção BERMO - ${equipModel}`}
                          </h4>
                          <div className="flex items-center gap-1 text-[11px] text-muted-foreground mt-1 truncate">
                            <Building2 className="h-3 w-3 shrink-0 text-slate-400" />
                            <span className="font-medium text-slate-700 dark:text-slate-300 truncate">
                              {order.client_name || 'Cliente Industrial'}
                            </span>
                          </div>
                        </div>

                        {/* Equipamento */}
                        <div className="bg-slate-50 dark:bg-slate-950/70 p-1.5 rounded border border-slate-100 dark:border-slate-800 text-[10px] text-slate-600 dark:text-slate-400 flex items-center justify-between">
                          <span className="truncate">
                            🔧 <strong>{equipModel}</strong>
                          </span>
                          {order.quote_number && (
                            <span className="font-mono text-[9px] text-slate-500">
                              Prop #{order.quote_number}
                            </span>
                          )}
                        </div>

                        {/* Valor da OS */}
                        <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800">
                          <span className="text-[10px] text-muted-foreground">Valor OS:</span>
                          <span className="font-bold text-xs text-slate-900 dark:text-slate-100">
                            {resolveServiceOrderLiveValue(order, quotes).toLocaleString('pt-BR', {
                              style: 'currency',
                              currency: 'BRL',
                            })}
                          </span>
                        </div>

                        {/* Histórico / Notificações badge */}
                        {order.status_history && order.status_history.length > 0 && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedOrder(order)
                              setIsHistoryModalOpen(true)
                            }}
                            className="w-full text-left text-[10px] text-teal-700 dark:text-teal-400 hover:underline flex items-center gap-1 pt-0.5"
                          >
                            <History className="h-3 w-3" />
                            <span>{order.status_history.length} evento(s) no histórico da OS</span>
                          </button>
                        )}

                        {/* Botões de Avanço / Retrocesso de Etapa */}
                        <div
                          className="pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={stageIndex === 0}
                            onClick={() => handleMoveOrder(order, 'prev')}
                            className="h-6 px-1.5 text-[10px] text-slate-600 dark:text-slate-400 disabled:opacity-30"
                            title="Retroceder etapa"
                          >
                            <ArrowLeft className="h-3 w-3 mr-0.5" /> Voltar
                          </Button>

                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={stageIndex === SERVICE_ORDER_STAGES.length - 1}
                            onClick={() => handleMoveOrder(order, 'next')}
                            className="h-6 px-2 text-[10px] bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 border-teal-200 dark:border-teal-800 font-semibold disabled:opacity-30"
                            title="Avançar etapa"
                          >
                            Avançar <ArrowRight className="h-3 w-3 ml-0.5" />
                          </Button>
                        </div>
                      </Card>
                    )
                  })
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Modal de Transição de Status com Registro de Histórico */}
      <Dialog open={isTransitionModalOpen} onOpenChange={setIsTransitionModalOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2 text-teal-900 dark:text-teal-100">
              <Wrench className="h-5 w-5 text-teal-600" />
              Mover Ordem de Serviço #{transitionTarget?.order.order_number}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2 text-xs">
            <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Cliente:</span>
                <strong className="text-slate-900 dark:text-slate-100">
                  {transitionTarget?.order.client_name}
                </strong>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Etapa Atual:</span>
                <Badge variant="outline" className="text-[10px] uppercase">
                  {transitionTarget?.order.status}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Nova Etapa:</span>
                <Badge className="bg-teal-700 text-white text-[10px] uppercase">
                  {transitionTarget?.targetStatus}
                </Badge>
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">
                Nota Técnica da Mudança de Status (Registrada no Histórico)
              </Label>
              <Textarea
                placeholder="Ex: Vistoria concluída, trocador pronto para limpeza e substituição de gaxetas EPDM..."
                value={transitionNote}
                onChange={(e) => setTransitionNote(e.target.value)}
                className="text-xs h-20"
              />
            </div>

            {/* Aviso ao mover para Execução */}
            {transitionTarget?.targetStatus === 'execucao' && (
              <div className="p-2.5 rounded-lg bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 text-teal-900 dark:text-teal-200 flex items-start gap-2">
                <FileCheck2 className="h-4 w-4 text-teal-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="font-semibold text-[11px]">Relatório de Execução em PDF</p>
                  <p className="text-[10px] text-teal-800 dark:text-teal-300 leading-relaxed">
                    Ao confirmar a mudança para <strong>Execução</strong>, o formulário do{' '}
                    <strong>Relatório de Execução</strong> será aberto para relatar o início do
                    trabalho, status do trocador, insumos internos utilizados e gerar o PDF.
                  </p>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsTransitionModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleConfirmTransition}
              className="bg-teal-700 hover:bg-teal-600 text-white font-semibold"
            >
              {transitionTarget?.targetStatus === 'execucao' ? (
                <>
                  <FileCheck2 className="h-3.5 w-3.5 mr-1" />
                  Confirmar & Abrir Relatório PDF
                </>
              ) : (
                'Confirmar Transição & Notificar'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO DE ORDEM DE SERVIÇO (AlertDialog) */}
      <AlertDialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <AlertDialogContent className="sm:max-w-[480px]">
          <AlertDialogHeader>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 shrink-0">
                <Trash2 className="h-5 w-5" />
              </div>
              <div className="overflow-hidden">
                <AlertDialogTitle className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Excluir Ordem de Serviço #{orderToDelete?.order_number || orderToDelete?.id}?
                </AlertDialogTitle>
                <AlertDialogDescription className="text-xs text-muted-foreground mt-0.5 truncate">
                  Cliente: {orderToDelete?.client_name || 'Cliente Industrial'}
                </AlertDialogDescription>
              </div>
            </div>

            <div className="space-y-3 pt-3 text-xs">
              {/* Resumo dos dados da OS */}
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Número da OS:</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                    OS #{orderToDelete?.order_number || orderToDelete?.id}
                  </span>
                </div>
                {orderToDelete?.quote_number && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Proposta Vinculada:</span>
                    <span className="font-mono text-teal-700 dark:text-teal-400 font-semibold">
                      #{orderToDelete.quote_number}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Status Atual:</span>
                  <Badge variant="outline" className="text-[10px] uppercase font-bold">
                    {orderToDelete?.status}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Valor da OS:</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">
                    {resolveServiceOrderLiveValue(orderToDelete, quotes).toLocaleString('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    })}
                  </span>
                </div>{' '}
              </div>

              {/* Alerta de Ação Permanente e Irreversível */}
              <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200 text-xs">
                <p className="font-semibold text-rose-900 dark:text-rose-100 flex items-center gap-1.5 mb-1">
                  <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                  Ação permanente e irreversível!
                </p>
                <p className="text-[11px] leading-relaxed">
                  Esta Ordem de Serviço será permanentemente excluída do Pipeline Técnico. O vínculo
                  com a proposta comercial correspondente será liberado, permitindo que a proposta
                  possa ser excluída se desejado.
                </p>
              </div>
            </div>
          </AlertDialogHeader>

          <AlertDialogFooter className="mt-3">
            <AlertDialogCancel
              disabled={isDeleting}
              className="text-xs"
              onClick={() => {
                setIsDeleteModalOpen(false)
                setOrderToDelete(null)
              }}
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={isDeleting}
              onClick={(e) => {
                e.preventDefault()
                handleConfirmDelete()
              }}
              className="text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                  Excluindo OS...
                </>
              ) : (
                <>
                  <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                  Sim, Excluir OS
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* MODAL DE CONFIRMAÇÃO DE CANCELAMENTO DE ORDEM DE SERVIÇO */}
      <AlertDialog open={isCancelModalOpen} onOpenChange={setIsCancelModalOpen}>
        <AlertDialogContent className="sm:max-w-[480px]">
          <AlertDialogHeader>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 shrink-0">
                <Ban className="h-5 w-5" />
              </div>
              <div className="overflow-hidden">
                <AlertDialogTitle className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Cancelar Ordem de Serviço #{orderToCancel?.order_number || orderToCancel?.id}?
                </AlertDialogTitle>
                <AlertDialogDescription className="text-xs text-muted-foreground mt-0.5 truncate">
                  Cliente: {orderToCancel?.client_name || 'Cliente Industrial'}
                </AlertDialogDescription>
              </div>
            </div>

            <div className="space-y-3 pt-3 text-xs">
              <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                O cancelamento altera o status da OS para <strong>"cancelado"</strong> mantendo o
                registro operacional e a trilha de auditoria salvos no CRM.
              </p>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Motivo do Cancelamento</Label>
                <Textarea
                  placeholder="Ex: Proposta renegociada, cliente suspendeu o cronograma ou cancelamento comercial..."
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="text-xs h-20"
                />
              </div>
            </div>
          </AlertDialogHeader>

          <AlertDialogFooter className="mt-3">
            <AlertDialogCancel
              disabled={isCancelling}
              className="text-xs"
              onClick={() => {
                setIsCancelModalOpen(false)
                setOrderToCancel(null)
                setCancelReason('')
              }}
            >
              Voltar
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={isCancelling}
              onClick={(e) => {
                e.preventDefault()
                handleConfirmCancel()
              }}
              className="text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white"
            >
              {isCancelling ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                  Cancelando OS...
                </>
              ) : (
                <>
                  <Ban className="h-3.5 w-3.5 mr-1.5" />
                  Confirmar Cancelamento
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal Histórico Detalhado de Notificações e Transições da OS */}
      <Dialog open={isHistoryModalOpen} onOpenChange={setIsHistoryModalOpen}>
        <DialogContent className="sm:max-w-[550px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <History className="h-5 w-5 text-teal-600" />
              Histórico & Trilha de Auditoria - OS #{selectedOrder?.order_number}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2 text-xs">
            <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 space-y-1">
              <p className="font-bold text-slate-900 dark:text-slate-100">{selectedOrder?.title}</p>
              <p className="text-muted-foreground">Cliente: {selectedOrder?.client_name}</p>
              <p className="text-muted-foreground">
                Equipamento: {selectedOrder?.equipment_model || 'Trocador BERMO'}
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Linha do Tempo de Status
              </h4>

              {selectedOrder?.status_history && selectedOrder.status_history.length > 0 ? (
                <div className="space-y-2 border-l-2 border-teal-500 ml-2 pl-3">
                  {selectedOrder.status_history.map((hist, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1 relative"
                    >
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-teal-800 dark:text-teal-300">
                          {hist.from_status.toUpperCase()} ➔ {hist.to_status.toUpperCase()}
                        </span>
                        <span className="text-muted-foreground font-mono text-[10px]">
                          {new Date(hist.date).toLocaleString('pt-BR')}
                        </span>
                      </div>
                      <p className="text-slate-700 dark:text-slate-300">{hist.note}</p>
                      {hist.user_name && (
                        <p className="text-[10px] text-muted-foreground">
                          Responsável: <strong>{hist.user_name}</strong>
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground italic">
                  Nenhum evento registrado no histórico.
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsHistoryModalOpen(false)}
            >
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIÁLOGO DO RELATÓRIO DE EXECUÇÃO DA OS (GERADOR DE PDF) */}
      <OsExecutionReportDialog
        open={isReportModalOpen}
        onOpenChange={setIsReportModalOpen}
        serviceOrder={orderForReport}
        quote={quotes.find(
          (q) =>
            q.quote_number === orderForReport?.quote_number || q.id === orderForReport?.quote_id,
        )}
        defaultTechnicianName="Alex Nogueira (Especialista BERMO)"
      />
    </div>
  )
}
