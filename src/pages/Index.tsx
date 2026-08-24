import React, { useState, useEffect } from 'react'
import {
  LayoutDashboard,
  Briefcase,
  Users,
  FileSpreadsheet,
  Headphones,
  Repeat,
  Calendar,
  Sparkles,
  Database,
  Search,
  Plus,
  Moon,
  Sun,
  ShieldCheck,
  CheckCircle2,
  HelpCircle,
  FolderSearch,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from '@/components/ui/use-toast'

import { OverviewDashboard } from '@/components/OverviewDashboard'
import { PipelineKanban } from '@/components/PipelineKanban'
import { ClientsManager } from '@/components/ClientsManager'
import { QuotesManager } from '@/components/QuotesManager'
import { TicketsSupport } from '@/components/TicketsSupport'
import { ServicesManager } from '@/components/ServicesManager'
import { ActivitiesManager } from '@/components/ActivitiesManager'
import { ModelArchitectureViewer } from '@/components/ModelArchitectureViewer'
import { CopilotAssistant } from '@/components/CopilotAssistant'

import { clientsService } from '@/services/clients'
import { dealsService } from '@/services/deals'
import { quotesService, productsService } from '@/services/quotes'
import { ticketsService, servicesService, activitiesService } from '@/services/crm-extras'

import type {
  ClientRecord,
  DealRecord,
  QuoteRecord,
  ProductRecord,
  TicketRecord,
  ServiceRecord,
  ActivityRecord,
  DealStage,
  QuoteStatus,
} from '@/types/crm'

export default function Index() {
  const [currentTab, setCurrentTab] = useState<string>('overview')
  const [searchQuery, setSearchQuery] = useState('')
  const [isQuickFinderOpen, setIsQuickFinderOpen] = useState(false)

  // Data State
  const [clients, setClients] = useState<ClientRecord[]>([])
  const [deals, setDeals] = useState<DealRecord[]>([])
  const [quotes, setQuotes] = useState<QuoteRecord[]>([])
  const [products, setProducts] = useState<ProductRecord[]>([])
  const [tickets, setTickets] = useState<TicketRecord[]>([])
  const [services, setServices] = useState<ServiceRecord[]>([])
  const [activities, setActivities] = useState<ActivityRecord[]>([])

  // Selected State
  const [selectedClient, setSelectedClient] = useState<ClientRecord | null>(null)
  const [selectedQuote, setSelectedQuote] = useState<QuoteRecord | null>(null)

  const [isLoading, setIsLoading] = useState(true)

  const loadAllData = async () => {
    try {
      setIsLoading(true)
      const [cList, dList, qList, pList, tList, sList, aList] = await Promise.all([
        clientsService.getAll(),
        dealsService.getAll(),
        quotesService.getAll(),
        productsService.getAll(),
        ticketsService.getAll(),
        servicesService.getAll(),
        activitiesService.getAll(),
      ])

      setClients(cList)
      setDeals(dList)
      setQuotes(qList)
      setProducts(pList)
      setTickets(tList)
      setServices(sList)
      setActivities(aList)
    } catch (err) {
      console.error('Erro ao carregar dados do CRM:', err)
      toast({
        title: 'Aviso',
        description: 'Não foi possível carregar os dados em tempo real.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadAllData()
  }, [])

  // Handlers para Atualização & Criação
  const handleUpdateDealStage = async (dealId: string, newStage: DealStage) => {
    try {
      const updated = await dealsService.updateStage(dealId, newStage)
      setDeals((prev) => prev.map((d) => (d.id === dealId ? updated : d)))
      toast({
        title: 'Pipeline Atualizado',
        description: `Oportunidade movida para ${newStage}.`,
      })
    } catch (err) {
      toast({ title: 'Erro ao mover negócio', variant: 'destructive' })
    }
  }

  const handleCreateDeal = async (data: Partial<DealRecord>) => {
    try {
      const created = await dealsService.create(data)
      setDeals((prev) => [created, ...prev])
      toast({ title: 'Oportunidade criada com sucesso!' })
    } catch (err) {
      toast({ title: 'Erro ao criar oportunidade', variant: 'destructive' })
    }
  }

  const handleCreateClient = async (data: Partial<ClientRecord>) => {
    try {
      const created = await clientsService.create(data)
      setClients((prev) => [created, ...prev])
      setSelectedClient(created)
      toast({ title: 'Cliente cadastrado com sucesso!' })
    } catch (err) {
      toast({ title: 'Erro ao cadastrar cliente', variant: 'destructive' })
    }
  }

  const handleUpdateClient = async (id: string, data: Partial<ClientRecord>) => {
    try {
      const updated = await clientsService.update(id, data)
      setClients((prev) => prev.map((c) => (c.id === id ? updated : c)))
      if (selectedClient?.id === id) setSelectedClient(updated)
      toast({ title: 'Cliente atualizado!' })
    } catch (err) {
      toast({ title: 'Erro ao atualizar cliente', variant: 'destructive' })
    }
  }

  const handleCreateQuote = async (data: Partial<QuoteRecord>) => {
    try {
      const created = await quotesService.create(data)
      setQuotes((prev) => [created, ...prev])
      setSelectedQuote(created)
      toast({ title: 'Proposta / Orçamento gerado com sucesso!' })
    } catch (err) {
      toast({ title: 'Erro ao gerar proposta', variant: 'destructive' })
    }
  }

  const handleUpdateQuoteStatus = async (id: string, status: QuoteStatus) => {
    try {
      const updated = await quotesService.updateStatus(id, status)
      setQuotes((prev) => prev.map((q) => (q.id === id ? updated : q)))
      if (selectedQuote?.id === id) setSelectedQuote(updated)
      toast({ title: `Status do orçamento alterado para ${status}.` })
    } catch (err) {
      toast({ title: 'Erro ao atualizar status do orçamento', variant: 'destructive' })
    }
  }

  const handleCreateTicket = async (data: Partial<TicketRecord>) => {
    try {
      const created = await ticketsService.create(data)
      setTickets((prev) => [created, ...prev])
      toast({ title: 'Chamado aberto com sucesso!' })
    } catch (err) {
      toast({ title: 'Erro ao abrir chamado', variant: 'destructive' })
    }
  }

  const handleUpdateTicket = async (id: string, data: Partial<TicketRecord>) => {
    try {
      const updated = await ticketsService.update(id, data)
      setTickets((prev) => prev.map((t) => (t.id === id ? updated : t)))
      toast({ title: 'Chamado atualizado!' })
    } catch (err) {
      toast({ title: 'Erro ao atualizar chamado', variant: 'destructive' })
    }
  }

  const handleCreateService = async (data: Partial<ServiceRecord>) => {
    try {
      const created = await servicesService.create(data)
      setServices((prev) => [created, ...prev])
      toast({ title: 'Contrato / Serviço criado com sucesso!' })
    } catch (err) {
      toast({ title: 'Erro ao criar serviço', variant: 'destructive' })
    }
  }

  const handleUpdateService = async (id: string, data: Partial<ServiceRecord>) => {
    try {
      const updated = await servicesService.update(id, data)
      setServices((prev) => prev.map((s) => (s.id === id ? updated : s)))
      toast({ title: 'Contrato atualizado!' })
    } catch (err) {
      toast({ title: 'Erro ao atualizar contrato', variant: 'destructive' })
    }
  }

  const handleCreateActivity = async (data: Partial<ActivityRecord>) => {
    try {
      const created = await activitiesService.create(data)
      setActivities((prev) => [created, ...prev])
      toast({ title: 'Atividade agendada com sucesso!' })
    } catch (err) {
      toast({ title: 'Erro ao agendar atividade', variant: 'destructive' })
    }
  }

  const handleUpdateActivity = async (id: string, data: Partial<ActivityRecord>) => {
    try {
      const updated = await activitiesService.update(id, data)
      setActivities((prev) => prev.map((a) => (a.id === id ? updated : a)))
      toast({ title: 'Atividade atualizada!' })
    } catch (err) {
      toast({ title: 'Erro ao atualizar atividade', variant: 'destructive' })
    }
  }

  // Model Navigation Tabs
  const NAV_ITEMS = [
    { id: 'overview', label: 'Visão Geral', icon: LayoutDashboard },
    { id: 'pipeline', label: 'Pipeline & Funil', icon: Briefcase, badge: deals.length },
    { id: 'clients', label: 'Clientes 360°', icon: Users, badge: clients.length },
    { id: 'quotes', label: 'Orçamentos & Modelos', icon: FileSpreadsheet, badge: quotes.length },
    {
      id: 'tickets',
      label: 'Atendimento & Suporte',
      icon: Headphones,
      badge: tickets.filter((t) => t.status === 'open' || t.status === 'in_progress').length,
    },
    { id: 'services', label: 'Contratos & Serviços', icon: Repeat, badge: services.length },
    {
      id: 'activities',
      label: 'Agenda & Ações',
      icon: Calendar,
      badge: activities.filter((a) => a.status === 'pending').length,
    },
    { id: 'model_architecture', label: 'Mapa do Modelo', icon: Database, isHighlight: true },
    { id: 'copilot', label: 'Copiloto IA', icon: Sparkles, isHighlight: true },
  ]

  // Quick Finder Results
  const matchedClients = clients.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()),
  )
  const matchedQuotes = quotes.filter(
    (q) =>
      q.quote_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (q.client_name && q.client_name.toLowerCase().includes(searchQuery.toLowerCase())),
  )
  const matchedDeals = deals.filter(
    (d) =>
      d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (d.client_name && d.client_name.toLowerCase().includes(searchQuery.toLowerCase())),
  )

  return (
    <div className="min-h-screen bg-slate-50/60 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Logo & Marca */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <FolderSearch className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base sm:text-lg tracking-tight bg-gradient-to-r from-slate-900 to-indigo-900 dark:from-white dark:to-indigo-300 bg-clip-text text-transparent">
                  Localizar Modelo
                </span>
                <Badge className="bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 text-[10px] font-bold border-indigo-200">
                  CRM Comercial
                </Badge>
              </div>
              <p className="text-[11px] text-muted-foreground hidden sm:block">
                Gestão Estratégica, Pipeline & Localizador de Modelos
              </p>
            </div>
          </div>

          {/* Barra de Busca Global / Localizador Rápido */}
          <div className="flex-1 max-w-md hidden md:block">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Localizar modelo, cliente, orçamento ou proposta..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  if (e.target.value.trim().length > 1) setIsQuickFinderOpen(true)
                }}
                onFocus={() => {
                  if (searchQuery.trim().length > 1) setIsQuickFinderOpen(true)
                }}
                className="pl-9 pr-8 text-xs bg-slate-100/80 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-full h-9 focus-visible:ring-indigo-500"
              />
              <span className="absolute right-3 top-2.5 text-[10px] font-mono font-medium text-slate-400">
                ⌘K
              </span>
            </div>
          </div>

          {/* Ações Rápidas Direitas */}
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={() => setCurrentTab('model_architecture')}
              className="bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 border border-indigo-200 dark:border-indigo-800 text-xs h-9"
            >
              <Database className="h-3.5 w-3.5 mr-1.5" />
              Onde está o Modelo?
            </Button>

            <Button
              size="sm"
              onClick={() => setCurrentTab('copilot')}
              className="bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm text-xs h-9"
            >
              <Sparkles className="h-3.5 w-3.5 mr-1.5 text-amber-300" />
              Copiloto IA
            </Button>
          </div>
        </div>

        {/* Abas de Navegação Horizontal */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center gap-1 overflow-x-auto py-1.5 no-scrollbar">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon
              const isActive = currentTab === item.id

              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentTab(item.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : item.isHighlight
                        ? 'bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{item.label}</span>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                        isActive
                          ? 'bg-indigo-700 text-white'
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {currentTab === 'overview' && (
          <OverviewDashboard
            clients={clients}
            deals={deals}
            quotes={quotes}
            tickets={tickets}
            services={services}
            activities={activities}
            onNavigate={(tab) => setCurrentTab(tab)}
            onSelectClient={(c) => {
              setSelectedClient(c)
              setCurrentTab('clients')
            }}
            onSelectDeal={(d) => {
              setCurrentTab('pipeline')
            }}
            onSelectQuote={(q) => {
              setSelectedQuote(q)
              setCurrentTab('quotes')
            }}
          />
        )}

        {currentTab === 'pipeline' && (
          <PipelineKanban
            deals={deals}
            clients={clients}
            onUpdateDealStage={handleUpdateDealStage}
            onCreateDeal={handleCreateDeal}
            onSelectDeal={() => {}}
          />
        )}

        {currentTab === 'clients' && (
          <ClientsManager
            clients={clients}
            deals={deals}
            quotes={quotes}
            selectedClient={selectedClient}
            onSelectClient={setSelectedClient}
            onCreateClient={handleCreateClient}
            onUpdateClient={handleUpdateClient}
          />
        )}

        {currentTab === 'quotes' && (
          <QuotesManager
            quotes={quotes}
            clients={clients}
            products={products}
            selectedQuote={selectedQuote}
            onSelectQuote={setSelectedQuote}
            onCreateQuote={handleCreateQuote}
            onUpdateQuoteStatus={handleUpdateQuoteStatus}
          />
        )}

        {currentTab === 'tickets' && (
          <TicketsSupport
            tickets={tickets}
            clients={clients}
            onCreateTicket={handleCreateTicket}
            onUpdateTicket={handleUpdateTicket}
          />
        )}

        {currentTab === 'services' && (
          <ServicesManager
            services={services}
            clients={clients}
            onCreateService={handleCreateService}
            onUpdateService={handleUpdateService}
          />
        )}

        {currentTab === 'activities' && (
          <ActivitiesManager
            activities={activities}
            clients={clients}
            onCreateActivity={handleCreateActivity}
            onUpdateActivity={handleUpdateActivity}
          />
        )}

        {currentTab === 'model_architecture' && (
          <ModelArchitectureViewer onNavigate={(tab) => setCurrentTab(tab)} />
        )}

        {currentTab === 'copilot' && <CopilotAssistant onNavigate={(tab) => setCurrentTab(tab)} />}
      </main>

      {/* Modal Quick Finder / Resultados de Busca */}
      <Dialog open={isQuickFinderOpen} onOpenChange={setIsQuickFinderOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Search className="h-4 w-4 text-indigo-600" />
              Resultados da Busca Rápida: "{searchQuery}"
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2 max-h-[60vh] overflow-y-auto">
            {/* Clientes Encontrados */}
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">
                Clientes & Contas ({matchedClients.length})
              </span>
              {matchedClients.length === 0 ? (
                <div className="text-xs text-muted-foreground py-1">
                  Nenhum cliente correspondente.
                </div>
              ) : (
                <div className="space-y-1.5">
                  {matchedClients.map((c) => (
                    <div
                      key={c.id}
                      onClick={() => {
                        setSelectedClient(c)
                        setCurrentTab('clients')
                        setIsQuickFinderOpen(false)
                      }}
                      className="p-2 rounded-lg border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 cursor-pointer flex items-center justify-between text-xs"
                    >
                      <span className="font-semibold">{c.name}</span>
                      <span className="text-muted-foreground text-[11px]">
                        {c.segment || c.city}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Propostas Encontradas */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">
                Modelos de Orçamento ({matchedQuotes.length})
              </span>
              {matchedQuotes.length === 0 ? (
                <div className="text-xs text-muted-foreground py-1">
                  Nenhuma proposta correspondente.
                </div>
              ) : (
                <div className="space-y-1.5">
                  {matchedQuotes.map((q) => (
                    <div
                      key={q.id}
                      onClick={() => {
                        setSelectedQuote(q)
                        setCurrentTab('quotes')
                        setIsQuickFinderOpen(false)
                      }}
                      className="p-2 rounded-lg border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 cursor-pointer flex items-center justify-between text-xs"
                    >
                      <span className="font-mono font-bold text-indigo-600">
                        {q.quote_number} - {q.client_name}
                      </span>
                      <span className="font-bold">
                        {(q.total || 0).toLocaleString('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Negócios Encontrados */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">
                Oportunidades do Pipeline ({matchedDeals.length})
              </span>
              {matchedDeals.length === 0 ? (
                <div className="text-xs text-muted-foreground py-1">
                  Nenhum negócio correspondente.
                </div>
              ) : (
                <div className="space-y-1.5">
                  {matchedDeals.map((d) => (
                    <div
                      key={d.id}
                      onClick={() => {
                        setCurrentTab('pipeline')
                        setIsQuickFinderOpen(false)
                      }}
                      className="p-2 rounded-lg border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 cursor-pointer flex items-center justify-between text-xs"
                    >
                      <span className="font-semibold">{d.title}</span>
                      <span className="text-muted-foreground text-[11px]">Etapa: {d.stage}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
