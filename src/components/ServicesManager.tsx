import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
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
  Plus,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  AlertCircle,
  Calendar,
  Layers,
  Flame,
  UserCheck,
  Building2,
  Tag,
  CheckCircle,
  XCircle,
  FileCheck2,
  ShieldCheck,
  Info,
  DollarSign,
  Trash2,
  Ban,
  Loader2,
} from 'lucide-react'
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
import type {
  ServiceRecord,
  ServiceOrderRecord,
  ServiceOrderStatus,
  ClientRecord,
  DealRecord,
  ServiceStatus,
  ServiceType,
} from '@/types/crm'

interface ServicesManagerProps {
  services: ServiceRecord[]
  serviceOrders?: ServiceOrderRecord[]
  clients: ClientRecord[]
  deals: DealRecord[]
  onCreateService: (data: Partial<ServiceRecord>) => void
  onUpdateServiceOrderStatus?: (
    id: string,
    status: ServiceOrderStatus,
    approvalNotes?: string,
  ) => Promise<void> | void
  onDeleteServiceOrder?: (id: string) => Promise<void> | void
  onCancelServiceOrder?: (id: string, reason?: string) => Promise<void> | void
}

export const ServicesManager: React.FC<ServicesManagerProps> = ({
  services,
  serviceOrders = [],
  clients,
  deals,
  onCreateService,
  onUpdateServiceOrderStatus,
  onDeleteServiceOrder,
  onCancelServiceOrder,
}) => {
  const [activeTab, setActiveTab] = useState<'orders' | 'services'>('orders')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [selectedOrderForApproval, setSelectedOrderForApproval] =
    useState<ServiceOrderRecord | null>(null)
  const [approvalNotes, setApprovalNotes] = useState('')
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false)
  const [actionType, setActionType] = useState<'approve' | 'reject' | 'execute' | 'complete'>(
    'approve',
  )

  // Modais de exclusão e cancelamento de OS
  const [orderToDelete, setOrderToDelete] = useState<ServiceOrderRecord | null>(null)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const [orderToCancel, setOrderToCancel] = useState<ServiceOrderRecord | null>(null)
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [isCancelling, setIsCancelling] = useState(false)

  const handleConfirmDeleteOS = async () => {
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

  const handleConfirmCancelOS = async () => {
    if (!orderToCancel) return
    setIsCancelling(true)
    try {
      const reason = cancelReason.trim() || 'Cancelado pelo usuário na aba de Serviços'
      if (onCancelServiceOrder) {
        await onCancelServiceOrder(orderToCancel.id, reason)
      } else if (onUpdateServiceOrderStatus) {
        await onUpdateServiceOrderStatus(orderToCancel.id, 'cancelled', reason)
      }
      setIsCancelModalOpen(false)
      setOrderToCancel(null)
      setCancelReason('')
    } finally {
      setIsCancelling(false)
    }
  }
  // Form State
  const [title, setTitle] = useState('')
  const [serviceType, setServiceType] = useState<ServiceType>('maintenance')
  const [clientId, setClientId] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [monthlyValue, setMonthlyValue] = useState<number>(0)
  const [notes, setNotes] = useState('')

  const filteredServices = services.filter((s) => {
    const matchesSearch =
      s.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.client_name && s.client_name.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesStatus = statusFilter === 'all' || s.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const filteredOrders = serviceOrders.filter((so) => {
    const matchesSearch =
      so.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      so.order_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      so.client_name?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || so.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    const client = clients.find((c) => c.id === clientId)
    onCreateService({
      title,
      service_type: serviceType,
      client_id: clientId || undefined,
      client_name: client ? client.name : undefined,
      status: 'planning',
      start_date: startDate || new Date().toISOString(),
      end_date: endDate || undefined,
      monthly_value: Number(monthlyValue) || 0,
      notes,
    })
    setIsCreateModalOpen(false)
    setTitle('')
    setNotes('')
    setMonthlyValue(0)
  }

  const getStatusBadge = (status?: ServiceStatus | string) => {
    switch (status) {
      case 'in_progress':
        return <Badge className="bg-blue-600 text-white text-[10px]">Em Execução</Badge>
      case 'completed':
        return <Badge className="bg-emerald-600 text-white text-[10px]">Concluído</Badge>
      case 'pending_client':
        return <Badge className="bg-amber-600 text-white text-[10px]">Aguardando Fábrica</Badge>
      case 'planning':
        return <Badge className="bg-slate-600 text-white text-[10px]">Planejamento</Badge>
      default:
        return (
          <Badge variant="outline" className="text-[10px]">
            {status}
          </Badge>
        )
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Wrench className="h-6 w-6 text-teal-600 dark:text-teal-400" />
            Ordens de Serviço & Manutenções BERMO
          </h2>
          <p className="text-xs md:text-sm text-muted-foreground mt-0.5">
            Ordens geradas automaticamente na aprovação de propostas, aguardando aprovação técnica e
            execução.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Navegação entre Abas */}
          <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-lg flex gap-1 text-xs">
            <button
              type="button"
              onClick={() => setActiveTab('orders')}
              className={`px-3 py-1.5 rounded-md font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === 'orders'
                  ? 'bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <FileCheck2 className="h-3.5 w-3.5" />
              Ordens de Serviço ({serviceOrders.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('services')}
              className={`px-3 py-1.5 rounded-md font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === 'services'
                  ? 'bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Wrench className="h-3.5 w-3.5" />
              Contratos & Manutenção ({services.length})
            </button>
          </div>
          <Button
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-teal-700 hover:bg-teal-600 text-white text-xs"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Nova OS Manual
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar ordem de serviço ou cliente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 text-xs"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48 text-xs">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Status</SelectItem>
            <SelectItem value="pending_approval">Aguardando Aprovação</SelectItem>
            <SelectItem value="approved">Aprovada</SelectItem>
            <SelectItem value="in_execution">Em Execução</SelectItem>
            <SelectItem value="in_progress">Em Andamento</SelectItem>
            <SelectItem value="completed">Concluída</SelectItem>
            <SelectItem value="rejected">Rejeitada</SelectItem>
            <SelectItem value="cancelled">Cancelada</SelectItem>
          </SelectContent>{' '}
        </Select>{' '}
      </div>

      {/* ABA 1: ORDENS DE SERVIÇO (GERADAS AUTOMATICAMENTE DAS PROPOSTAS APROVADAS) */}
      {activeTab === 'orders' ? (
        <div className="space-y-4">
          {filteredOrders.length === 0 ? (
            <Card className="p-10 text-center text-muted-foreground">
              <FileCheck2 className="h-10 w-10 mx-auto text-teal-500 mb-2 opacity-50" />
              <p className="text-sm font-semibold">Nenhuma Ordem de Serviço encontrada</p>
              <p className="text-xs">
                Aprove uma proposta na tela de Orçamentos para gerar uma OS automaticamente com a
                mesma numeração.
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredOrders.map((so) => {
                const isPending = so.status === 'pending_approval'
                const isApproved = so.status === 'approved'

                return (
                  <Card
                    key={so.id}
                    className={`border transition-all flex flex-col justify-between ${
                      isPending
                        ? 'border-amber-300 dark:border-amber-700 bg-amber-50/20 dark:bg-amber-950/10'
                        : isApproved
                          ? 'border-emerald-300 dark:border-emerald-800'
                          : 'border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <CardHeader className="pb-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-mono text-xs font-bold text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/60 px-2 py-0.5 rounded border border-teal-200 dark:border-teal-800">
                          OS #{so.order_number}
                        </span>
                        {so.status === 'pending_approval' && (
                          <Badge className="bg-amber-500 hover:bg-amber-600 text-white text-[10px] flex items-center gap-1">
                            <Clock className="h-3 w-3" /> Aguardando Aprovação
                          </Badge>
                        )}
                        {so.status === 'approved' && (
                          <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] flex items-center gap-1">
                            <ShieldCheck className="h-3 w-3" /> Aprovada (Pronta p/ Execução)
                          </Badge>
                        )}
                        {(so.status === 'in_execution' || so.status === 'in_progress') && (
                          <Badge className="bg-blue-600 hover:bg-blue-700 text-white text-[10px] flex items-center gap-1">
                            <Wrench className="h-3 w-3 animate-pulse" /> Em Execução
                          </Badge>
                        )}
                        {so.status === 'completed' && (
                          <Badge className="bg-teal-600 text-white text-[10px] flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" /> Concluída
                          </Badge>
                        )}
                        {so.status === 'rejected' && (
                          <Badge className="bg-rose-600 text-white text-[10px] flex items-center gap-1">
                            <XCircle className="h-3 w-3" /> Rejeitada
                          </Badge>
                        )}
                        {so.status === 'cancelled' && (
                          <Badge className="bg-slate-500 text-white text-[10px] flex items-center gap-1">
                            <Ban className="h-3 w-3" /> Cancelada
                          </Badge>
                        )}{' '}
                        <div className="flex items-center gap-1 ml-auto">
                          {/* Cancelar OS */}
                          {so.status !== 'cancelled' && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setOrderToCancel(so)
                                setCancelReason(
                                  `Cancelada a partir da proposta #${so.quote_number || so.order_number || ''}`,
                                )
                                setIsCancelModalOpen(true)
                              }}
                              className="h-6 w-6 text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-colors"
                              title="Cancelar Ordem de Serviço"
                              aria-label={`Cancelar OS #${so.order_number || so.id}`}
                            >
                              <Ban className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          {/* Excluir OS */}
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setOrderToDelete(so)
                              setIsDeleteModalOpen(true)
                            }}
                            className="h-6 w-6 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                            title="Excluir Ordem de Serviço"
                            aria-label={`Excluir OS #${so.order_number || so.id}`}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>

                      <CardTitle className="text-sm font-bold mt-2 text-slate-900 dark:text-slate-100 line-clamp-2">
                        {so.title}
                      </CardTitle>
                      <CardDescription className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Building2 className="h-3.5 w-3.5" />
                        {so.client_name || 'Cliente Industrial'}
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="pt-0 space-y-3">
                      {/* Resumo dos Serviços Vinculados */}
                      {so.services && Array.isArray(so.services) && so.services.length > 0 && (
                        <div className="space-y-1 bg-slate-50 dark:bg-slate-900 p-2 rounded-lg border border-slate-100 dark:border-slate-800 text-[11px]">
                          <span className="font-semibold text-slate-700 dark:text-slate-300 block">
                            Itens do Escopo ({so.services.length}):
                          </span>
                          <ul className="list-disc list-inside space-y-0.5 text-slate-600 dark:text-slate-400">
                            {so.services.slice(0, 2).map((item: any, idx: number) => (
                              <li key={idx} className="truncate">
                                {item.description || item.service_name || 'Item de manutenção'}
                              </li>
                            ))}
                            {so.services.length > 2 && (
                              <li className="text-[10px] text-muted-foreground italic">
                                + {so.services.length - 2} outros itens
                              </li>
                            )}
                          </ul>
                        </div>
                      )}

                      {so.notes && (
                        <p className="text-[11px] text-slate-600 dark:text-slate-300 line-clamp-2 italic">
                          "{so.notes}"
                        </p>
                      )}

                      {so.approved_by && (
                        <div className="text-[10px] text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                          <CheckCircle className="h-3 w-3 shrink-0" />
                          <span>
                            Aprovado por: {so.approved_by}{' '}
                            {so.approval_notes ? `("${so.approval_notes}")` : ''}
                          </span>
                        </div>
                      )}
                      {so.rejection_notes && (
                        <div className="text-[10px] text-rose-700 dark:text-rose-400 flex items-center gap-1 bg-rose-50 dark:bg-rose-950/40 p-1.5 rounded">
                          <AlertCircle className="h-3 w-3 shrink-0" />
                          <span>Motivo Rejeição: {so.rejection_notes}</span>
                        </div>
                      )}
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                        <div>
                          <span className="text-[10px] text-muted-foreground block">
                            Valor Total:
                          </span>
                          <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                            {(so.total_value || 0).toLocaleString('pt-BR', {
                              style: 'currency',
                              currency: 'BRL',
                            })}
                          </span>
                        </div>
                        {/* Botões de Transição Rápida de Etapas do Pipeline */}
                        {onUpdateServiceOrderStatus && (
                          <div className="flex items-center gap-1.5 flex-wrap justify-end">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedOrderForApproval(so)
                                setActionType('execute')
                                setApprovalNotes('')
                                setIsApproveModalOpen(true)
                              }}
                              className="h-7 px-2 text-[11px] text-blue-600 hover:bg-blue-50 border-blue-200"
                            >
                              <Wrench className="h-3.5 w-3.5 mr-1" /> Executar
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedOrderForApproval(so)
                                setActionType('complete')
                                setApprovalNotes('')
                                setIsApproveModalOpen(true)
                              }}
                              className="h-7 px-2.5 text-[11px] bg-teal-700 hover:bg-teal-600 text-white font-semibold"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Fechar
                            </Button>
                          </div>
                        )}{' '}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      ) : (
        /* ABA 2: SERVIÇOS & CONTRATOS */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredServices.map((s) => (
            <Card
              key={s.id}
              className="border-slate-200 dark:border-slate-800 hover:border-teal-500/50 transition-all flex flex-col justify-between"
            >
              <CardHeader className="pb-2.5">
                <div className="flex items-start justify-between gap-2">
                  <Badge
                    variant="outline"
                    className="text-[10px] font-mono uppercase text-teal-700 dark:text-teal-400"
                  >
                    {s.service_type || 'Manutenção'}
                  </Badge>
                  {getStatusBadge(s.status)}
                </div>
                <CardTitle className="text-sm font-bold mt-2 text-slate-900 dark:text-slate-100 line-clamp-1">
                  {s.title}
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                  <Building2 className="h-3.5 w-3.5" />
                  {s.client_name || 'Cliente Industrial'}
                </CardDescription>
              </CardHeader>

              <CardContent className="pt-0 space-y-3">
                {s.notes && (
                  <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 bg-slate-50 dark:bg-slate-900 p-2 rounded-lg border border-slate-100 dark:border-slate-800">
                    {s.notes}
                  </p>
                )}

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <div className="text-muted-foreground flex items-center gap-1 text-[11px]">
                    <Calendar className="h-3 w-3" />
                    {s.start_date
                      ? new Date(s.start_date).toLocaleDateString('pt-BR')
                      : 'Data a definir'}
                  </div>
                  {s.monthly_value ? (
                    <span className="font-bold text-slate-900 dark:text-slate-100">
                      {s.monthly_value.toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      })}
                    </span>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal de Aprovação / Rejeição / Transição de OS pelo Gestor */}
      <Dialog open={isApproveModalOpen} onOpenChange={setIsApproveModalOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              {actionType === 'approve' && (
                <>
                  <ShieldCheck className="h-5 w-5 text-emerald-600" />
                  Aprovar Ordem de Serviço #{selectedOrderForApproval?.order_number}
                </>
              )}
              {actionType === 'reject' && (
                <>
                  <XCircle className="h-5 w-5 text-rose-600" />
                  Rejeitar Ordem de Serviço #{selectedOrderForApproval?.order_number}
                </>
              )}
              {actionType === 'execute' && (
                <>
                  <Wrench className="h-5 w-5 text-blue-600" />
                  Iniciar Execução de Campo #{selectedOrderForApproval?.order_number}
                </>
              )}
              {actionType === 'complete' && (
                <>
                  <CheckCircle2 className="h-5 w-5 text-teal-600" />
                  Concluir Ordem de Serviço #{selectedOrderForApproval?.order_number}
                </>
              )}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2 text-xs">
            <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 space-y-1">
              <p className="font-bold text-slate-900 dark:text-slate-100">
                {selectedOrderForApproval?.title}
              </p>
              <p className="text-muted-foreground">
                Cliente: {selectedOrderForApproval?.client_name}
              </p>
              <p className="text-muted-foreground">
                Valor Total:{' '}
                <strong>
                  {(selectedOrderForApproval?.total_value || 0).toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  })}
                </strong>
              </p>
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold">
                {actionType === 'approve' && 'Observações de Liberação Técnica (Opcional)'}
                {actionType === 'reject' && 'Motivo da Rejeição (Obrigatório) *'}
                {actionType === 'execute' && 'Observações de Mobilização de Equipe / Ferramental'}
                {actionType === 'complete' && 'Relatório Final / Apontamento de Horas e Peças'}
              </Label>
              <Textarea
                placeholder={
                  actionType === 'approve'
                    ? 'Ex: Escopo e custos validados. Mover card no Kanban para execução...'
                    : actionType === 'reject'
                      ? 'Ex: Inconsistência no dimensionamento de placas ou falta de estoque...'
                      : actionType === 'execute'
                        ? 'Ex: Equipe de técnicos e inspetor mobilizada para a fábrica...'
                        : 'Ex: Troca de gaxetas e retubagem finalizadas com sucesso. Teste hidrostático OK.'
                }
                value={approvalNotes}
                onChange={(e) => setApprovalNotes(e.target.value)}
                className="text-xs h-20"
              />
            </div>{' '}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsApproveModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={actionType === 'reject' && !approvalNotes.trim()}
              onClick={async () => {
                if (selectedOrderForApproval && onUpdateServiceOrderStatus) {
                  let nextStatus: ServiceOrderStatus = 'execucao'
                  if (actionType === 'reject') nextStatus = 'rejected'
                  if (actionType === 'execute') nextStatus = 'execucao'
                  if (actionType === 'complete') nextStatus = 'fechado'
                  if (actionType === 'approve') nextStatus = 'execucao'

                  await onUpdateServiceOrderStatus(
                    selectedOrderForApproval.id,
                    nextStatus,
                    approvalNotes,
                  )
                  setIsApproveModalOpen(false)
                  setSelectedOrderForApproval(null)
                }
              }}
              className={
                actionType === 'approve'
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  : actionType === 'reject'
                    ? 'bg-rose-600 hover:bg-rose-500 text-white'
                    : actionType === 'execute'
                      ? 'bg-blue-600 hover:bg-blue-500 text-white'
                      : 'bg-teal-700 hover:bg-teal-600 text-white'
              }
            >
              {actionType === 'approve' && 'Confirmar Aprovação'}
              {actionType === 'reject' && 'Confirmar Rejeição'}
              {actionType === 'execute' && 'Mover para Em Execução'}
              {actionType === 'complete' && 'Concluir Ordem'}
            </Button>{' '}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Nova OS */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">Nova Ordem de Serviço BERMO</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreate} className="space-y-4 py-2">
            <div className="space-y-1">
              <Label className="text-xs">Título / Escopo do Serviço *</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="ex: Limpeza CIP e Troca de Gaxetas em Trocador BP6"
                className="text-xs"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Tipo de Serviço</Label>
                <Select value={serviceType} onValueChange={(v) => setServiceType(v as ServiceType)}>
                  <SelectTrigger className="text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="maintenance">Manutenção Preventiva</SelectItem>
                    <SelectItem value="installation">Instalação & Start-up</SelectItem>
                    <SelectItem value="support">Revisão Corretiva</SelectItem>
                    <SelectItem value="consulting">Auditoria Térmica</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Cliente Industrial</Label>
                <Select value={clientId} onValueChange={setClientId}>
                  <SelectTrigger className="text-xs">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((c) => (
                      <SelectItem key={c.id} value={c.id} className="text-xs">
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Data de Início Prevista</Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Valor do Serviço (R$)</Label>
                <Input
                  type="number"
                  value={monthlyValue}
                  onChange={(e) => setMonthlyValue(Number(e.target.value))}
                  placeholder="0.00"
                  className="text-xs"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Observações Técnicas / Peças</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Observações sobre placas, gaxetas, vedações ou ferramental especial..."
                className="text-xs h-20"
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsCreateModalOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" size="sm" className="bg-teal-700 hover:bg-teal-600 text-white">
                Criar Ordem de Serviço
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* AlertDialog de Exclusão de OS */}
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
                  <span className="text-muted-foreground">Valor Total:</span>
                  <strong className="text-emerald-700 dark:text-emerald-400 font-mono">
                    {(orderToDelete?.total_value || orderToDelete?.final_price || 0).toLocaleString(
                      'pt-BR',
                      { style: 'currency', currency: 'BRL' },
                    )}
                  </strong>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200 text-xs">
                <p className="font-semibold text-rose-900 dark:text-rose-100 flex items-center gap-1.5 mb-1">
                  <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                  Ação permanente e irreversível!
                </p>
                <p className="text-[11px] leading-relaxed">
                  Esta Ordem de Serviço será permanentemente excluída. O vínculo com a proposta
                  comercial será liberado, permitindo que a proposta possa ser excluída caso
                  desejado.
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
                handleConfirmDeleteOS()
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

      {/* AlertDialog de Cancelamento de OS */}
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
                registro histórico para fins contábeis e auditoria no CRM.
              </p>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Motivo do Cancelamento</Label>
                <Textarea
                  placeholder="Ex: Cliente cancelou a contratação, escopo renegociado..."
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
                handleConfirmCancelOS()
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
    </div>
  )
}
