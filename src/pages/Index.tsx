import React, { useState, useEffect } from 'react'
import {
  Users,
  Kanban,
  FileSpreadsheet,
  Layers,
  Wrench,
  MessageSquare,
  Activity,
  Bot,
  LayoutDashboard,
  Search,
  Bell,
  CheckCircle2,
  AlertCircle,
  Plus,
  Compass,
  Package,
  Shield,
  Flame,
  History as HistoryIcon,
  BarChart3,
  Mail,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { useRealtime } from '@/hooks/use-realtime'

// Services & Types
import { clientsService } from '@/services/clients'
import { dealsService } from '@/services/deals'
import { quotesService } from '@/services/quotes'
import { quoteDealSyncService } from '@/services/quotes-deal-sync'
import {
  servicesExtraService,
  serviceOrdersService,
  ticketsService,
  activitiesService,
  productsService,
} from '@/services/crm-extras'
import type {
  ClientRecord,
  DealRecord,
  QuoteRecord,
  QuoteStatus,
  ProductRecord,
  TicketRecord,
  ServiceRecord,
  ServiceOrderRecord,
  ServiceOrderStatus,
  ActivityRecord,
  DealStage,
} from '@/types/crm'
import { BermoProductItem } from '@/data/bermo-catalog'

// Feature Components
import { OverviewDashboard } from '@/components/OverviewDashboard'
import { ClientsManager } from '@/components/ClientsManager'
import { PipelineKanban } from '@/components/PipelineKanban'
import { QuotesManager } from '@/components/QuotesManager'
import { ServicesManager } from '@/components/ServicesManager'
import { ServiceOrdersKanban } from '@/components/ServiceOrdersKanban'
import { ServiceOrdersReport } from '@/components/ServiceOrdersReport'
import { EquipmentServiceHistory } from '@/components/EquipmentServiceHistory'
import { TicketsSupport } from '@/components/TicketsSupport'
import { ActivitiesManager } from '@/components/ActivitiesManager'
import { CopilotAssistant } from '@/components/CopilotAssistant'
import { ModelArchitectureViewer } from '@/components/ModelArchitectureViewer'
import { BermoCatalogViewer } from '@/components/BermoCatalogViewer'
import { InboundQuoteEmailsTab } from '@/components/InboundQuoteEmailsTab'
import { inboundQuoteEmailsService } from '@/services/inbound-quote-emails'
import { InboundQuoteEmailRecord } from '@/types/crm'

type ActiveTab =
  | 'overview'
  | 'quotes'
  | 'inbound_quotes'
  | 'catalog'
  | 'deals'
  | 'clients'
  | 'services'
  | 'service_kanban'
  | 'service_report'
  | 'equipment_history'
  | 'tickets'
  | 'activities'
  | 'copilot'
  | 'architecture'
// Garantir Mail globalmente acessível para QuotesManager antes da renderização do componente
if (typeof window !== 'undefined' && !(window as any).Mail) {
  ;(window as any).Mail = Mail
}
if (typeof globalThis !== 'undefined' && !(globalThis as any).Mail) {
  ;(globalThis as any).Mail = Mail
}

export default function IndexPage() {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview')
  const [isLoading, setIsLoading] = useState(true)

  // Global CRM State
  const [clients, setClients] = useState<ClientRecord[]>([])
  const [deals, setDeals] = useState<DealRecord[]>([])
  const [quotes, setQuotes] = useState<QuoteRecord[]>([])
  const [products, setProducts] = useState<ProductRecord[]>([])
  const [tickets, setTickets] = useState<TicketRecord[]>([])
  const [services, setServices] = useState<ServiceRecord[]>([])
  const [serviceOrders, setServiceOrders] = useState<ServiceOrderRecord[]>([])
  const [activities, setActivities] = useState<ActivityRecord[]>([])

  // Selection states for cross-view navigation
  const [selectedClient, setSelectedClient] = useState<ClientRecord | null>(null)
  const [selectedQuote, setSelectedQuote] = useState<QuoteRecord | null>(null)
  const [inboundEmailsList, setInboundEmailsList] = useState<InboundQuoteEmailRecord[]>([])
  const [isLoadingInboundEmails, setIsLoadingInboundEmails] = useState<boolean>(false)

  const loadInboundEmails = async () => {
    setIsLoadingInboundEmails(true)
    try {
      const list = await inboundQuoteEmailsService.getInboundEmails()
      setInboundEmailsList(list)
    } catch (_) {
      // Ignora silenciosamente
    } finally {
      setIsLoadingInboundEmails(false)
    }
  }

  useEffect(() => {
    loadInboundEmails()
  }, [])

  // Carregar dados de propostas de forma silenciosa e rápida
  const refreshQuotes = async () => {
    try {
      const quotesRes = await quotesService.getAll()
      setQuotes(quotesRes)
    } catch (err) {
      console.warn('Erro ao atualizar propostas em background:', err)
    }
  }

  // Carregar todos os dados (com indicador opcional de loading)
  const loadAllData = async (silent = false) => {
    try {
      if (!silent) setIsLoading(true)
      const [
        clientsRes,
        dealsRes,
        quotesRes,
        productsRes,
        ticketsRes,
        servicesRes,
        serviceOrdersRes,
        activitiesRes,
      ] = await Promise.all([
        clientsService.getAll(),
        dealsService.getAll(),
        quotesService.getAll(),
        productsService.getAll(),
        ticketsService.getAll(),
        servicesExtraService.getAll(),
        serviceOrdersService.getAll().catch(() => [] as ServiceOrderRecord[]),
        activitiesService.getAll(),
      ])

      setClients(clientsRes)
      setDeals(dealsRes)
      setQuotes(quotesRes)
      setProducts(productsRes)
      setTickets(ticketsRes)
      setServices(servicesRes)
      setServiceOrders(serviceOrdersRes)
      setActivities(activitiesRes)

      // Sincronização em lote das propostas existentes com o pipeline comercial
      // Idempotente: atualiza deals vinculados ou cria os faltantes sem alterar os cálculos
      try {
        quoteDealSyncService
          .syncAllQuotes(quotesRes)
          .then((syncResult) => {
            if (syncResult && syncResult.syncedCount > 0) {
              dealsService.getAll().then((freshDeals) => setDeals(freshDeals))
            }
          })
          .catch((e) => console.warn('Erro sync em background:', e))
      } catch (syncBatchErr) {
        console.warn('Erro ao disparar sync em background:', syncBatchErr)
      }
    } catch (err: any) {
      console.error('Erro ao carregar dados:', err)
      if (!silent) {
        toast({
          title: 'Erro ao conectar ao banco',
          description: err.message || 'Verifique as coleções do PocketBase.',
          variant: 'destructive',
        })
      }
    } finally {
      if (!silent) setIsLoading(false)
    }
  }

  useEffect(() => {
    loadAllData()
  }, [])

  // Inscrição em Realtime para a coleção 'quotes'
  useRealtime<any>('quotes', (e) => {
    const record = e.record as unknown as QuoteRecord
    if (e.action === 'create') {
      setQuotes((prev) => {
        const exists = prev.some((q) => q.id === record.id)
        return exists
          ? prev.map((q) => (q.id === record.id ? { ...q, ...record } : q))
          : [record, ...prev]
      })
      // Sincronizar deals ao receber nova proposta via realtime
      quoteDealSyncService
        .syncQuoteToDeal(record)
        .then(() => {
          dealsService.getAll().then((freshDeals) => setDeals(freshDeals))
        })
        .catch((err) => console.warn('Erro sync realtime quote create:', err))
    } else if (e.action === 'update') {
      setQuotes((prev) => prev.map((q) => (q.id === record.id ? { ...q, ...record } : q)))
      setSelectedQuote((prev) => (prev?.id === record.id ? { ...prev, ...record } : prev))
      // Sincronizar deals ao receber atualização de proposta via realtime
      quoteDealSyncService
        .syncQuoteToDeal(record)
        .then(() => {
          dealsService.getAll().then((freshDeals) => setDeals(freshDeals))
        })
        .catch((err) => console.warn('Erro sync realtime quote update:', err))
    } else if (e.action === 'delete') {
      setQuotes((prev) => prev.filter((q) => q.id !== record.id))
      setSelectedQuote((prev) => (prev?.id === record.id ? null : prev))
    }
  })

  // Inscrição em Realtime para a coleção 'deals'
  useRealtime<any>('deals', (e) => {
    const record = e.record as unknown as DealRecord
    if (e.action === 'create') {
      setDeals((prev) => {
        const exists = prev.some((d) => d.id === record.id)
        return exists
          ? prev.map((d) => (d.id === record.id ? { ...d, ...record } : d))
          : [record, ...prev]
      })
    } else if (e.action === 'update') {
      setDeals((prev) => prev.map((d) => (d.id === record.id ? { ...d, ...record } : d)))
    } else if (e.action === 'delete') {
      setDeals((prev) => prev.filter((d) => d.id !== record.id))
    }
  })

  // Inscrição em Realtime para a coleção 'service_orders' (quando OS é criada após aprovação)
  useRealtime<any>('service_orders', (e) => {
    const record = e.record as unknown as ServiceOrderRecord
    if (e.action === 'create') {
      setServiceOrders((prev) => {
        const exists = prev.some((o) => o.id === record.id)
        return exists
          ? prev.map((o) => (o.id === record.id ? { ...o, ...record } : o))
          : [record, ...prev]
      })
    } else if (e.action === 'update') {
      setServiceOrders((prev) => prev.map((o) => (o.id === record.id ? { ...o, ...record } : o)))
    } else if (e.action === 'delete') {
      setServiceOrders((prev) => prev.filter((o) => o.id !== record.id))
    }
  })

  // Listener para eventos customizados da aplicação e BroadcastChannel entre abas
  useEffect(() => {
    const handleProposalStatusUpdated = (evt?: any) => {
      refreshQuotes()
      loadAllData(true)
      const detail = evt?.detail
      if (detail?.quoteId && detail?.status) {
        setQuotes((prev) =>
          prev.map((q) =>
            q.id === detail.quoteId
              ? {
                  ...q,
                  status: detail.status,
                  ...(detail.reason ? { rejected_by_client_reason: detail.reason } : {}),
                  ...(detail.client_name ? { approved_by_client_name: detail.client_name } : {}),
                }
              : q,
          ),
        )
      }
    }

    // Ouvir CustomEvent local emitido pela mesma janela
    window.addEventListener('intertermal:proposal-updated', handleProposalStatusUpdated)

    // Ouvir BroadcastChannel para sincronização instantânea entre abas no mesmo navegador
    let bc: BroadcastChannel | null = null
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        bc = new BroadcastChannel('intertermal_proposals_channel')
        bc.onmessage = (msgEvent) => {
          if (msgEvent.data?.type === 'PROPOSAL_STATUS_CHANGED') {
            handleProposalStatusUpdated({ detail: msgEvent.data })
          }
        }
      }
    } catch {
      /* intentionally ignored */
    }

    // Refetch ao retomar o foco da janela ou aba (ex: voltou da aba do cliente / aprovação)
    const handleFocus = () => {
      refreshQuotes()
    }
    window.addEventListener('focus', handleFocus)

    return () => {
      window.removeEventListener('intertermal:proposal-updated', handleProposalStatusUpdated)
      window.removeEventListener('focus', handleFocus)
      if (bc) {
        bc.close()
      }
    }
  }, [])

  // Handler de seleção de produto do catálogo para abrir o orçamento
  const handleSelectProductForQuote = (product: BermoProductItem) => {
    setActiveTab('quotes')
    toast({
      title: 'Produto BERMO Selecionado',
      description: `${product.name} pronto para composição de orçamento técnico.`,
    })
  }

  // Clientes Handlers
  const handleCreateClient = async (data: Partial<ClientRecord>): Promise<ClientRecord> => {
    try {
      const created = await clientsService.create(data)
      setClients([created, ...clients])
      toast({ title: 'Cliente cadastrado com sucesso!' })
      return created
    } catch (err: any) {
      toast({ title: 'Erro ao cadastrar', description: err.message, variant: 'destructive' })
      throw err
    }
  }

  const handleUpdateClient = async (id: string, data: Partial<ClientRecord>) => {
    try {
      const updated = await clientsService.update(id, data)
      setClients(clients.map((c) => (c.id === id ? updated : c)))
      if (selectedClient?.id === id) setSelectedClient(updated)
      toast({ title: 'Cliente atualizado com sucesso!' })
    } catch (err: any) {
      toast({
        title: 'Erro ao atualizar cliente',
        description: err.message,
        variant: 'destructive',
      })
    }
  }

  const handleUpdateTicket = async (id: string, data: Partial<TicketRecord>) => {
    try {
      const updated = await ticketsService.update(id, data)
      setTickets(tickets.map((t) => (t.id === id ? updated : t)))
      toast({ title: 'Chamado atualizado!' })
    } catch (err: any) {
      toast({
        title: 'Erro ao atualizar chamado',
        description: err.message,
        variant: 'destructive',
      })
    }
  }

  // Oportunidades Handlers
  const handleUpdateDealStage = async (id: string, stage: DealStage) => {
    try {
      const updated = await dealsService.update(id, { stage })
      setDeals(deals.map((d) => (d.id === id ? updated : d)))
      toast({ title: 'Estágio atualizado!' })
    } catch (err: any) {
      toast({ title: 'Erro ao atualizar', description: err.message, variant: 'destructive' })
    }
  }

  const handleCreateDeal = async (data: Partial<DealRecord>) => {
    try {
      const created = await dealsService.create(data)
      setDeals([created, ...deals])
      toast({ title: 'Negócio criado no funil!' })
    } catch (err: any) {
      toast({ title: 'Erro ao criar', description: err.message, variant: 'destructive' })
    }
  }

  // Orçamentos Handlers
  const handleCreateQuote = async (data: Partial<QuoteRecord>) => {
    try {
      const created = await quotesService.create(data)
      setQuotes([created, ...quotes])
      setSelectedQuote(created)
      // Sincronizar e recarregar os deals para refletir instantaneamente no Pipeline e Dashboard
      try {
        await quoteDealSyncService.syncQuoteToDeal(created)
        const freshDeals = await dealsService.getAll()
        setDeals(freshDeals)
      } catch (dealErr) {
        console.warn('Erro ao atualizar deals após criação de proposta:', dealErr)
      }
      toast({ title: 'Orçamento de serviços gerado e conectado ao pipeline comercial!' })
    } catch (err: any) {
      toast({ title: 'Erro ao gerar proposta', description: err.message, variant: 'destructive' })
    }
  }

  const handleUpdateQuote = async (id: string, data: Partial<QuoteRecord>) => {
    try {
      const updated = await quotesService.update(id, data)
      setQuotes(quotes.map((q) => (q.id === id ? updated : q)))
      if (selectedQuote?.id === id) setSelectedQuote(updated)
      // Sincronizar e recarregar os deals para refletir instantaneamente no Pipeline e Dashboard
      try {
        await quoteDealSyncService.syncQuoteToDeal(updated)
        const freshDeals = await dealsService.getAll()
        setDeals(freshDeals)
      } catch (dealErr) {
        console.warn('Erro ao atualizar deals após alteração de proposta:', dealErr)
      }
      toast({ title: 'Orçamento atualizado com sucesso no CRM e no Pipeline!' })
    } catch (err: any) {
      toast({
        title: 'Erro ao atualizar proposta',
        description: err.message,
        variant: 'destructive',
      })
    }
  }

  const handleDeleteQuote = async (id: string) => {
    try {
      await quotesService.delete(id)
      setQuotes((prev) => prev.filter((q) => q.id !== id))
      if (selectedQuote?.id === id) setSelectedQuote(null)
    } catch (err: any) {
      console.error('Erro ao deletar proposta:', err)
      throw err
    }
  }

  const handleUpdateQuoteStatus = async (id: string, status: QuoteStatus) => {
    try {
      const updated = await quotesService.update(id, { status })
      setQuotes(quotes.map((q) => (q.id === id ? updated : q)))
      if (selectedQuote?.id === id) setSelectedQuote(updated)

      // Sincronizar automaticamente no pipeline comercial (deals)
      try {
        await quoteDealSyncService.syncQuoteToDeal(updated)
        const freshDeals = await dealsService.getAll()
        setDeals(freshDeals)
      } catch (dealErr) {
        console.warn('Erro ao sincronizar status da proposta no pipeline:', dealErr)
      }

      // Se a proposta for aprovada, gerar automaticamente uma Ordem de Serviço (OS)
      if (status === 'approved') {
        try {
          const createdOS = await serviceOrdersService.createFromApprovedQuote(updated)
          setServiceOrders((prev) => {
            const exists = prev.some((o) => o.id === createdOS.id)
            return exists
              ? prev.map((o) => (o.id === createdOS.id ? createdOS : o))
              : [createdOS, ...prev]
          })
          toast({
            title: '🎉 Proposta Aprovada & OS Gerada!',
            description: `Ordem de Serviço #${createdOS.order_number || updated.quote_number} gerada no Pipeline de Serviços Técnicos (Vistoria).`,
          })
        } catch (osErr: any) {
          console.error('Erro ao gerar OS automática:', osErr)
          toast({
            title: 'Proposta aprovada',
            description: 'Status atualizado para aprovado.',
          })
        }
      } else {
        toast({ title: `Orçamento marcado como ${status}!` })
      }
    } catch (err: any) {
      toast({ title: 'Erro ao atualizar', description: err.message, variant: 'destructive' })
    }
  }

  // OS Handlers
  const handleUpdateServiceOrderStatus = async (
    id: string,
    status: ServiceOrderStatus,
    notes?: string,
    authorName?: string,
  ) => {
    const author = authorName || 'Alex Nogueira (Especialista BERMO)'
    try {
      const currentOrder = serviceOrders.find((o) => o.id === id)
      const updated = await serviceOrdersService.updateStatus(
        id,
        status,
        notes,
        author,
        currentOrder?.status_history,
      )
      setServiceOrders((prev) => prev.map((o) => (o.id === id ? { ...o, ...updated } : o)))

      // Notificação visual com Toast rico
      toast({
        title: `🔄 OS #${updated.order_number || id}: Transição para "${status.toUpperCase()}"`,
        description: `Registrado por ${author}. ${notes ? `"${notes}"` : ''}`,
      })
    } catch (err: any) {
      console.error('Erro ao atualizar OS:', err)
      // Fallback local com histórico
      const now = new Date().toISOString()
      setServiceOrders((prev) =>
        prev.map((so) => {
          if (so.id === id) {
            const hist = Array.isArray(so.status_history) ? [...so.status_history] : []
            hist.push({
              from_status: so.status,
              to_status: status,
              date: now,
              user_name: author,
              note: notes || `Movido para ${status}`,
            })
            return {
              ...so,
              status,
              status_history: hist,
              notes: notes || so.notes,
            }
          }
          return so
        }),
      )

      toast({
        title: `Status da OS Atualizado para ${status.toUpperCase()}`,
        description: `Transição salva localmente.`,
      })
    }
  }

  const handleDeleteServiceOrder = async (id: string) => {
    try {
      const target = serviceOrders.find((o) => o.id === id)
      await serviceOrdersService.delete(id)
      setServiceOrders((prev) => prev.filter((o) => o.id !== id))
      toast({
        title: 'Ordem de Serviço excluída com sucesso',
        description: `A OS #${target?.order_number || id} foi removida permanentemente do sistema.`,
      })
    } catch (err: any) {
      console.error('Erro ao deletar OS no backend, aplicando remoção local:', err)
      setServiceOrders((prev) => prev.filter((o) => o.id !== id))
      toast({
        title: 'Ordem de Serviço removida',
        description: 'A OS foi removida da visualização.',
      })
    }
  }

  const handleCancelServiceOrder = async (id: string, cancelReason?: string) => {
    const author = 'Alex Nogueira (Especialista BERMO)'
    const reason = cancelReason || 'Ordem de Serviço cancelada pelo usuário'
    try {
      const currentOrder = serviceOrders.find((o) => o.id === id)
      const updated = await serviceOrdersService.updateStatus(
        id,
        'cancelled',
        reason,
        author,
        currentOrder?.status_history,
      )
      setServiceOrders((prev) => prev.map((o) => (o.id === id ? { ...o, ...updated } : o)))
      toast({
        title: `🚫 OS #${updated.order_number || id} Cancelada`,
        description: `Status alterado para cancelado. Histórico preservado: "${reason}".`,
      })
    } catch (err: any) {
      console.error('Erro ao cancelar OS no backend, aplicando status local:', err)
      const now = new Date().toISOString()
      setServiceOrders((prev) =>
        prev.map((so) => {
          if (so.id === id) {
            const hist = Array.isArray(so.status_history) ? [...so.status_history] : []
            hist.push({
              from_status: so.status,
              to_status: 'cancelled',
              date: now,
              user_name: author,
              note: reason,
            })
            return {
              ...so,
              status: 'cancelled',
              status_history: hist,
              notes: reason,
            }
          }
          return so
        }),
      )
      toast({
        title: 'OS Cancelada',
        description: 'Status atualizado para cancelado localmente.',
      })
    }
  }

  // Tickets Handlers
  const handleCreateTicket = async (data: Partial<TicketRecord>) => {
    try {
      const created = await ticketsService.create(data)
      setTickets([created, ...tickets])
      toast({ title: 'Chamado técnico registrado!' })
    } catch (err: any) {
      toast({ title: 'Erro ao abrir chamado', description: err.message, variant: 'destructive' })
    }
  }

  // Serviços Pós-Venda Handlers
  const handleCreateService = async (data: Partial<ServiceRecord>) => {
    try {
      const created = await servicesExtraService.create(data)
      setServices([created, ...services])
      toast({ title: 'Ordem de serviço aberta!' })
    } catch (err: any) {
      toast({
        title: 'Erro ao registrar serviço',
        description: err.message,
        variant: 'destructive',
      })
    }
  }

  // Atividades Handlers
  const handleCreateActivity = async (data: Partial<ActivityRecord>) => {
    try {
      const created = await activitiesService.create(data)
      setActivities([created, ...activities])
      toast({ title: 'Atividade agendada!' })
    } catch (err: any) {
      toast({ title: 'Erro ao agendar', description: err.message, variant: 'destructive' })
    }
  }

  const handleUpdateActivity = async (id: string, data: Partial<ActivityRecord>) => {
    try {
      const updated = await activitiesService.update(id, data)
      setActivities(activities.map((a) => (a.id === id ? updated : a)))
      toast({ title: 'Atividade atualizada!' })
    } catch (err: any) {
      toast({
        title: 'Erro ao atualizar atividade',
        description: err.message,
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="flex h-screen w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-hidden font-sans">
      {/* Sidebar de Navegação */}
      <aside className="w-64 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col justify-between hidden md:flex shrink-0">
        <div>
          {/* Logo & Branding Intertermal / BERMO */}
          <div className="p-5 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-teal-700 via-teal-600 to-emerald-500 flex items-center justify-center text-white shadow-md shadow-teal-500/20">
                <Flame className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-base font-extrabold tracking-tight text-slate-900 dark:text-slate-100 leading-none">
                  INTERTERMAL
                </h1>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="text-[10px] uppercase font-bold text-teal-700 dark:text-teal-400 tracking-wider">
                    Serviços & Engenharia
                  </span>
                  <Badge
                    variant="outline"
                    className="text-[8px] px-1 py-0 h-4 border-teal-300 text-teal-700"
                  >
                    BERMO
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          {/* Menu de Navegação */}
          <nav className="p-3 space-y-1">
            <button
              onClick={() => setActiveTab('overview')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'overview'
                  ? 'bg-teal-700 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <LayoutDashboard className="h-4 w-4" />
              Painel Geral
            </button>

            <button
              onClick={() => setActiveTab('quotes')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'quotes'
                  ? 'bg-teal-700 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <FileSpreadsheet className="h-4 w-4" />
                Orçamentos Intertermal
              </div>
              <Badge className="bg-teal-500/20 text-teal-700 dark:text-teal-300 text-[10px] px-1.5">
                {quotes.length}
              </Badge>
            </button>

            <button
              onClick={() => setActiveTab('inbound_quotes')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'inbound_quotes'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-amber-500 group-hover:text-amber-600" />
                Cotações por E-mail
              </div>
              <Badge className="bg-amber-500/20 text-amber-800 dark:text-amber-300 text-[10px] px-1.5">
                {inboundEmailsList.length}
              </Badge>
            </button>

            <button
              onClick={() => setActiveTab('catalog')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'catalog'
                  ? 'bg-teal-700 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <Package className="h-4 w-4" />
                Catálogo BERMO
              </div>
              <Badge variant="outline" className="text-[9px] px-1 py-0 text-slate-500">
                Oficial
              </Badge>
            </button>

            <button
              onClick={() => setActiveTab('deals')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'deals'
                  ? 'bg-teal-700 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <Kanban className="h-4 w-4" />
                Pipeline Comercial
              </div>
              <Badge variant="secondary" className="text-[10px] px-1.5">
                {deals.length}
              </Badge>
            </button>

            <button
              onClick={() => setActiveTab('clients')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'clients'
                  ? 'bg-teal-700 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <Users className="h-4 w-4" />
                Clientes Industriais
              </div>
              <span className="text-[11px] text-muted-foreground">{clients.length}</span>
            </button>

            <button
              onClick={() => setActiveTab('service_kanban')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'service_kanban'
                  ? 'bg-teal-700 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <Kanban className="h-4 w-4 text-amber-500" />
                Pipeline de OS (Kanban)
              </div>
              <Badge className="bg-amber-500/20 text-amber-800 dark:text-amber-300 text-[10px] px-1.5">
                {serviceOrders.length}
              </Badge>
            </button>

            <button
              onClick={() => setActiveTab('service_report')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'service_report'
                  ? 'bg-teal-700 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <BarChart3 className="h-4 w-4 text-teal-400" />
                Relatório de OS
              </div>
              <span className="text-[11px] text-muted-foreground">{serviceOrders.length}</span>
            </button>

            <button
              onClick={() => setActiveTab('services')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'services'
                  ? 'bg-teal-700 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <Wrench className="h-4 w-4" />
                Ordens & Contratos
              </div>
              <Badge variant="outline" className="text-[10px] px-1.5">
                {services.length}
              </Badge>
            </button>

            <button
              onClick={() => setActiveTab('equipment_history')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'equipment_history'
                  ? 'bg-teal-700 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <HistoryIcon className="h-4 w-4 text-teal-500" />
                Histórico de Serviços
              </div>
              <Badge variant="outline" className="text-[9px] px-1 text-slate-500">
                Equipamentos
              </Badge>
            </button>

            <button
              onClick={() => setActiveTab('tickets')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'tickets'
                  ? 'bg-teal-700 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <MessageSquare className="h-4 w-4" />
                Suporte & Ocorrências
              </div>
              {tickets.filter((t) => t.status === 'open').length > 0 && (
                <Badge className="bg-amber-500 text-white text-[10px] px-1.5">
                  {tickets.filter((t) => t.status === 'open').length}
                </Badge>
              )}
            </button>

            <button
              onClick={() => setActiveTab('activities')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'activities'
                  ? 'bg-teal-700 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <Activity className="h-4 w-4" />
                Agenda & Visitas
              </div>
              <span className="text-[11px] text-muted-foreground">{activities.length}</span>
            </button>

            <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setActiveTab('copilot')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'copilot'
                    ? 'bg-teal-700 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Bot className="h-4 w-4 text-teal-600" />
                Copilot Técnico Intertermal
              </button>

              <button
                onClick={() => setActiveTab('architecture')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'architecture'
                    ? 'bg-teal-700 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Compass className="h-4 w-4 text-slate-500" />
                Arquitetura do Sistema
              </button>
            </div>
          </nav>
        </div>

        {/* Footer do Usuário na Sidebar */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-teal-800 text-white flex items-center justify-center font-bold text-xs">
              AN
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                Alex Nogueia
              </p>
              <p className="text-[10px] text-teal-700 dark:text-teal-400 truncate">
                Especialista BERMO
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Área Principal de Conteúdo */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-14 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between px-4 sm:px-6 shrink-0">
          {/* Navegação Mobile e Título */}
          <div className="flex items-center gap-3">
            <div className="md:hidden flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-teal-700 flex items-center justify-center text-white font-bold text-xs">
                IT
              </div>
              <span className="font-bold text-sm tracking-tight text-slate-900">Intertermal</span>
            </div>

            {/* Breadcrumb / Visão Ativa */}
            <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
              <span className="text-teal-700 dark:text-teal-400 font-bold">Intertermal</span>
              <span>/</span>
              <span className="capitalize text-slate-900 dark:text-slate-100">
                {activeTab === 'overview' && 'Painel Geral'}
                {activeTab === 'quotes' && 'Orçamentos de Serviços Intertermal'}
                {activeTab === 'inbound_quotes' && 'Cotações Recebidas por E-mail (Triagem IA)'}
                {activeTab === 'catalog' && 'Catálogo de Produtos & Válvulas BERMO'}
                {activeTab === 'deals' && 'Pipeline Comercial (Funil)'}
                {activeTab === 'clients' && 'Gestão de Clientes Industriais'}
                {activeTab === 'service_kanban' && 'Pipeline de Serviços Técnicos (Kanban)'}
                {activeTab === 'service_report' && 'Relatório Analítico de Ordens de Serviço (OS)'}
                {activeTab === 'equipment_history' &&
                  'Histórico de Manutenções por Cliente & Equipamento'}
                {activeTab === 'services' && 'Ordens de Serviço & Contratos'}
                {activeTab === 'tickets' && 'Suporte Técnico & Pós-Venda'}
                {activeTab === 'activities' && 'Agenda & Visitas de Campo'}
                {activeTab === 'copilot' && 'Copiloto de Engenharia'}
                {activeTab === 'architecture' && 'Especificação da Arquitetura'}
              </span>
            </div>
          </div>

          {/* Ações de Topo */}
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center text-xs text-muted-foreground mr-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500 mr-1.5 animate-pulse" />
              Backend Conectado
            </div>

            <Button
              size="sm"
              onClick={() => setActiveTab('quotes')}
              className="bg-teal-700 hover:bg-teal-600 text-white text-xs h-8"
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              Novo Orçamento
            </Button>
          </div>
        </header>

        {/* Conteúdo Renderizado por Aba */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {activeTab === 'overview' && (
            <OverviewDashboard
              clients={clients}
              deals={deals}
              quotes={quotes}
              tickets={tickets}
              services={services}
              serviceOrders={serviceOrders}
              onNavigate={(tab) => setActiveTab(tab as ActiveTab)}
            />
          )}
          {activeTab === 'quotes' && (
            <QuotesManager
              quotes={quotes}
              clients={clients}
              selectedQuote={selectedQuote}
              onCreateQuote={handleCreateQuote}
              onUpdateQuote={handleUpdateQuote}
              onDeleteQuote={handleDeleteQuote}
              onUpdateQuoteStatus={handleUpdateQuoteStatus}
              onCreateClient={handleCreateClient}
              onOpenCatalog={() => setActiveTab('catalog')}
            />
          )}

          {activeTab === 'inbound_quotes' && (
            <InboundQuoteEmailsTab
              inboundEmails={inboundEmailsList}
              quotes={quotes}
              clients={clients}
              isLoading={isLoadingInboundEmails}
              onRefresh={() => {
                loadInboundEmails()
                refreshQuotes()
              }}
              onOpenEditQuote={(quote) => {
                setSelectedQuote(quote)
                setActiveTab('quotes')
              }}
              onQuoteCreatedFromInbound={(quoteId) => {
                loadInboundEmails()
                refreshQuotes()
                loadAllData(true)
                const created = quotes.find((q) => q.id === quoteId)
                if (created) setSelectedQuote(created)
                setActiveTab('quotes')
              }}
            />
          )}

          {activeTab === 'catalog' && (
            <BermoCatalogViewer onSelectProductForQuote={handleSelectProductForQuote} />
          )}
          {activeTab === 'deals' && (
            <PipelineKanban
              deals={deals}
              clients={clients}
              quotes={quotes}
              onUpdateDealStage={handleUpdateDealStage}
              onCreateDeal={handleCreateDeal}
              onNavigateToQuote={(quoteId) => {
                const target = quotes.find((q) => q.id === quoteId)
                if (target) setSelectedQuote(target)
                setActiveTab('quotes')
              }}
            />
          )}
          {activeTab === 'clients' && (
            <ClientsManager
              clients={clients}
              deals={deals}
              quotes={quotes}
              serviceOrders={serviceOrders}
              tickets={tickets}
              selectedClient={selectedClient}
              onSelectClient={setSelectedClient}
              onCreateClient={handleCreateClient}
              onUpdateClient={handleUpdateClient}
            />
          )}
          {activeTab === 'service_kanban' && (
            <ServiceOrdersKanban
              serviceOrders={serviceOrders}
              clients={clients}
              quotes={quotes}
              onUpdateStatus={handleUpdateServiceOrderStatus}
              onDeleteServiceOrder={handleDeleteServiceOrder}
              onCancelServiceOrder={handleCancelServiceOrder}
            />
          )}
          {activeTab === 'service_report' && (
            <ServiceOrdersReport serviceOrders={serviceOrders} clients={clients} quotes={quotes} />
          )}
          {activeTab === 'equipment_history' && (
            <EquipmentServiceHistory
              clients={clients}
              serviceOrders={serviceOrders}
              quotes={quotes}
            />
          )}
          {activeTab === 'services' && (
            <ServicesManager
              services={services}
              serviceOrders={serviceOrders}
              clients={clients}
              deals={deals}
              onCreateService={handleCreateService}
              onUpdateServiceOrderStatus={handleUpdateServiceOrderStatus}
              onDeleteServiceOrder={handleDeleteServiceOrder}
              onCancelServiceOrder={handleCancelServiceOrder}
            />
          )}
          {activeTab === 'tickets' && (
            <TicketsSupport
              tickets={tickets}
              clients={clients}
              onCreateTicket={handleCreateTicket}
              onUpdateTicket={handleUpdateTicket}
            />
          )}
          {activeTab === 'activities' && (
            <ActivitiesManager
              activities={activities}
              clients={clients}
              onCreateActivity={handleCreateActivity}
              onUpdateActivity={handleUpdateActivity}
            />
          )}
          {activeTab === 'copilot' && (
            <CopilotAssistant
              clients={clients}
              deals={deals}
              quotes={quotes}
              services={services}
              tickets={tickets}
            />
          )}
          {activeTab === 'architecture' && <ModelArchitectureViewer />}
        </div>
      </main>
    </div>
  )
}
