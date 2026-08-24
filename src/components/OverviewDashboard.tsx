import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  TrendingUp,
  Users,
  DollarSign,
  FileSpreadsheet,
  Headphones,
  CheckCircle2,
  Calendar,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Building2,
} from 'lucide-react'
import type {
  ClientRecord,
  DealRecord,
  QuoteRecord,
  TicketRecord,
  ServiceRecord,
  ActivityRecord,
} from '@/types/crm'

interface OverviewDashboardProps {
  clients: ClientRecord[]
  deals: DealRecord[]
  quotes: QuoteRecord[]
  tickets: TicketRecord[]
  services: ServiceRecord[]
  activities: ActivityRecord[]
  onNavigate: (tab: string) => void
  onSelectClient?: (client: ClientRecord) => void
  onSelectDeal?: (deal: DealRecord) => void
  onSelectQuote?: (quote: QuoteRecord) => void
}

export const OverviewDashboard: React.FC<OverviewDashboardProps> = ({
  clients,
  deals,
  quotes,
  tickets,
  services,
  activities,
  onNavigate,
  onSelectClient,
  onSelectQuote,
}) => {
  const totalPipelineValue = deals
    .filter((d) => d.stage !== 'lost')
    .reduce((acc, curr) => acc + (curr.value || 0), 0)

  const wonDealsValue = deals
    .filter((d) => d.stage === 'won')
    .reduce((acc, curr) => acc + (curr.value || 0), 0)

  const pendingQuotesValue = quotes
    .filter((q) => q.status === 'sent' || q.status === 'draft')
    .reduce((acc, curr) => acc + (curr.total || 0), 0)

  const openTicketsCount = tickets.filter(
    (t) => t.status === 'open' || t.status === 'in_progress',
  ).length
  const pendingActivitiesCount = activities.filter((a) => a.status === 'pending').length

  return (
    <div className="space-y-6">
      {/* Banner / Guia Rápido "Onde está o modelo?" */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 md:p-8 text-white shadow-xl border border-indigo-900/50">
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-indigo-500/20 px-3 py-1 text-xs font-semibold text-indigo-300 backdrop-blur-md border border-indigo-400/30">
            <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
            Central de Navegação & Modelos do Sistema
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            Localizador de Modelos & Gestão Comercial
          </h2>
          <p className="text-sm md:text-base text-slate-300 leading-relaxed">
            Precisa encontrar um <strong>modelo de orçamento</strong>,{' '}
            <strong>ficha do cliente</strong>, <strong>etapa do funil</strong> ou o{' '}
            <strong>mapa de entidades do sistema</strong>? Tudo está organizado em módulos
            inteligentes com busca rápida e integração em tempo real.
          </p>
          <div className="pt-2 flex flex-wrap gap-2.5">
            <Button
              size="sm"
              onClick={() => onNavigate('model_architecture')}
              className="bg-indigo-600 hover:bg-indigo-500 text-white shadow-md font-medium"
            >
              <ShieldCheck className="mr-1.5 h-4 w-4" />
              Ver Mapa do Modelo de Dados
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onNavigate('quotes')}
              className="border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-200"
            >
              <FileSpreadsheet className="mr-1.5 h-4 w-4" />
              Modelos de Propostas & Orçamentos
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onNavigate('copilot')}
              className="border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-200"
            >
              <Sparkles className="mr-1.5 h-4 w-4 text-amber-400" />
              Perguntar ao Copiloto IA
            </Button>
          </div>
        </div>
        <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-indigo-500/10 to-transparent pointer-events-none" />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="hover:shadow-md transition-shadow border-slate-200 dark:border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Pipeline Total Ativo
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-blue-100 dark:bg-blue-950/60 flex items-center justify-center text-blue-600">
              <DollarSign className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {totalPipelineValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-emerald-500" />
              {deals.length} oportunidades em andamento
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow border-slate-200 dark:border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Receita Fechada (Ganhos)
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {wonDealsValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {deals.filter((d) => d.stage === 'won').length} contratos confirmados
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow border-slate-200 dark:border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Propostas em Análise
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-amber-100 dark:bg-amber-950/60 flex items-center justify-center text-amber-600">
              <FileSpreadsheet className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {pendingQuotesValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {quotes.filter((q) => q.status === 'sent' || q.status === 'draft').length} propostas
              emitidas
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow border-slate-200 dark:border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Clientes & Atendimento
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-violet-100 dark:bg-violet-950/60 flex items-center justify-center text-violet-600">
              <Users className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {clients.length}{' '}
              <span className="text-sm font-normal text-muted-foreground">empresas</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <Headphones className="h-3 w-3 text-amber-500" />
              {openTicketsCount} chamados abertos / {pendingActivitiesCount} tarefas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Grid 2 colunas: Acesso Rápido a Modelos + Oportunidades Quentes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Painel "Onde encontrar cada modelo" */}
        <Card className="lg:col-span-1 border-slate-200 dark:border-slate-800">
          <CardHeader>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-indigo-600" />
              Guia: Onde está cada Modelo?
            </CardTitle>
            <CardDescription className="text-xs">
              Atalhos diretos para as estruturas de dados e modelos operacionais:
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div
              onClick={() => onNavigate('model_architecture')}
              className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-600 bg-slate-50/50 dark:bg-slate-900/50 cursor-pointer transition-all flex items-center justify-between group"
            >
              <div>
                <div className="text-xs font-semibold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600">
                  Modelo Conceitual & Tabelas
                </div>
                <div className="text-[11px] text-muted-foreground">
                  7 coleções estruturadas (schema, campos e regras)
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-transform" />
            </div>

            <div
              onClick={() => onNavigate('quotes')}
              className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-600 bg-slate-50/50 dark:bg-slate-900/50 cursor-pointer transition-all flex items-center justify-between group"
            >
              <div>
                <div className="text-xs font-semibold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600">
                  Modelos de Orçamento & Proposta
                </div>
                <div className="text-[11px] text-muted-foreground">
                  Formatos comerciais, parcelamentos e itens
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-transform" />
            </div>

            <div
              onClick={() => onNavigate('clients')}
              className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-600 bg-slate-50/50 dark:bg-slate-900/50 cursor-pointer transition-all flex items-center justify-between group"
            >
              <div>
                <div className="text-xs font-semibold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600">
                  Modelo de Conta & Cliente 360°
                </div>
                <div className="text-[11px] text-muted-foreground">
                  Score de engajamento, CNPJ, contatos e histórico
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-transform" />
            </div>

            <div
              onClick={() => onNavigate('services')}
              className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-600 bg-slate-50/50 dark:bg-slate-900/50 cursor-pointer transition-all flex items-center justify-between group"
            >
              <div>
                <div className="text-xs font-semibold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600">
                  Modelo de Contratos & Onboarding
                </div>
                <div className="text-[11px] text-muted-foreground">
                  Checklists, entregáveis e renovação recorrente
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </CardContent>
        </Card>

        {/* Propostas e Orçamentos Recentes */}
        <Card className="lg:col-span-2 border-slate-200 dark:border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base font-bold">Últimos Orçamentos & Propostas</CardTitle>
              <CardDescription className="text-xs">
                Modelos de propostas comerciais emitidas no sistema
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onNavigate('quotes')}
              className="text-xs text-indigo-600 hover:text-indigo-700"
            >
              Ver Todos <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {quotes.slice(0, 4).map((q) => (
              <div
                key={q.id}
                onClick={() => {
                  if (onSelectQuote) onSelectQuote(q)
                  onNavigate('quotes')
                }}
                className="flex items-center justify-between p-3 rounded-lg border border-slate-100 dark:border-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors cursor-pointer"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400">
                      {q.quote_number}
                    </span>
                    <span className="text-xs font-medium text-slate-800 dark:text-slate-200">
                      {q.client_name || 'Cliente'}
                    </span>
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    Condição: {q.payment_terms || 'À combinar'}
                  </div>
                </div>

                <div className="text-right space-y-1">
                  <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    {(q.total || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </div>
                  <Badge
                    variant={
                      q.status === 'approved'
                        ? 'default'
                        : q.status === 'sent'
                          ? 'secondary'
                          : 'outline'
                    }
                    className="text-[10px] capitalize"
                  >
                    {q.status === 'approved'
                      ? 'Aprovado'
                      : q.status === 'sent'
                        ? 'Enviado'
                        : q.status === 'draft'
                          ? 'Rascunho'
                          : q.status}
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Grid Secundário: Clientes Principais e Tarefas Imediatas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Principais Clientes */}
        <Card className="border-slate-200 dark:border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base font-bold">Clientes em Destaque</CardTitle>
              <CardDescription className="text-xs">
                Contas corporativas com maior score de oportunidade
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onNavigate('clients')}
              className="text-xs text-indigo-600 hover:text-indigo-700"
            >
              Ver Carteira <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {clients.slice(0, 4).map((c) => (
              <div
                key={c.id}
                onClick={() => {
                  if (onSelectClient) onSelectClient(c)
                  onNavigate('clients')
                }}
                className="flex items-center justify-between p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold flex items-center justify-center text-xs">
                    <Building2 className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                      {c.name}
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      {c.city ? `${c.city}/${c.state}` : c.segment || 'Corporativo'} •{' '}
                      {c.phone || c.email}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <Badge
                    variant="outline"
                    className="text-[10px] bg-indigo-50/50 text-indigo-700 border-indigo-200"
                  >
                    Score {c.score || 80}/100
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Agenda & Atividades */}
        <Card className="border-slate-200 dark:border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base font-bold">Próximas Ações Comerciais</CardTitle>
              <CardDescription className="text-xs">
                Reuniões, ligações e follow-ups agendados
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onNavigate('activities')}
              className="text-xs text-indigo-600 hover:text-indigo-700"
            >
              Agenda Completa <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {activities.slice(0, 4).map((a) => (
              <div
                key={a.id}
                className="flex items-center justify-between p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center text-xs">
                    <Calendar className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                      {a.title}
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      {a.client_name} •{' '}
                      {a.due_date ? new Date(a.due_date).toLocaleDateString('pt-BR') : 'Hoje'}{' '}
                      {a.time || ''}
                    </div>
                  </div>
                </div>
                <Badge
                  variant={a.priority === 'high' ? 'destructive' : 'secondary'}
                  className="text-[10px]"
                >
                  {a.priority === 'high' ? 'Alta' : a.priority === 'medium' ? 'Média' : 'Normal'}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
