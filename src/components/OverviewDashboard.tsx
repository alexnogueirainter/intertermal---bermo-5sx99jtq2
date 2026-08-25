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
} from '@/types/crm'

interface OverviewDashboardProps {
  clients: ClientRecord[]
  deals: DealRecord[]
  quotes: QuoteRecord[]
  tickets: TicketRecord[]
  services: ServiceRecord[]
  onNavigate: (tab: string) => void
}

export const OverviewDashboard: React.FC<OverviewDashboardProps> = ({
  clients,
  deals,
  quotes,
  tickets,
  services,
  onNavigate,
}) => {
  // Cálculos de métricas
  const totalPipelineValue = deals
    .filter((d) => d.stage !== 'lost')
    .reduce((sum, d) => sum + (Number(d.value) || 0), 0)

  const approvedQuotesTotal = quotes
    .filter((q) => q.status === 'approved')
    .reduce((sum, q) => sum + (Number(q.total) || 0), 0)

  const pendingQuotes = quotes.filter((q) => q.status === 'sent' || q.status === 'draft')
  const openTickets = tickets.filter((t) => t.status === 'open' || t.status === 'in_progress')
  const activeServices = services.filter(
    (s) => s.status === 'in_progress' || s.status === 'planning',
  )

  return (
    <div className="space-y-6">
      {/* Banner de Boas-Vindas Intertermal */}
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
            Painel integrado de orçamentos técnicos de válvulas e trocadores de calor BERMO, ordens
            de serviço de campo, cálculo logístico no padrão Mapeia e inteligência operacional.
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

      {/* Grid de KPIs Principais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-slate-200 dark:border-slate-800 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Orçamentos Aprovados
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-slate-900 dark:text-slate-100">
              {approvedQuotesTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              {quotes.filter((q) => q.status === 'approved').length} propostas fechadas
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Pipeline Comercial BERMO
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center">
              <TrendingUp className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-slate-900 dark:text-slate-100">
              {totalPipelineValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              {deals.length} oportunidades em andamento
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800 shadow-xs">
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
              {activeServices.length} ativas
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Manutenções e revisões térmicas
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800 shadow-xs">
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
              Atendimento pós-venda industrial
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
                Orçamentos de Serviços BERMO Recentes
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
                    {(q.total || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                  <Badge
                    variant={
                      q.status === 'approved'
                        ? 'default'
                        : q.status === 'sent'
                          ? 'secondary'
                          : 'outline'
                    }
                    className="text-[9px] uppercase px-1.5"
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
    </div>
  )
}
