import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
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
  Plus,
  DollarSign,
  Calendar,
  Building2,
  CheckCircle,
  XCircle,
  Clock,
  Briefcase,
  AlertCircle,
  Archive,
  ArchiveRestore,
  FileSpreadsheet,
} from 'lucide-react'
import type { DealRecord, DealStage, ClientRecord, QuoteRecord } from '@/types/crm'

interface PipelineKanbanProps {
  deals: DealRecord[]
  clients: ClientRecord[]
  quotes?: QuoteRecord[]
  archivedDeals?: DealRecord[]
  onArchiveDeal?: (deal: DealRecord) => void
  onRestoreDeal?: (deal: DealRecord) => void
  isAdmin?: boolean
  onUpdateDealStage: (dealId: string, newStage: DealStage) => void
  onCreateDeal: (data: Partial<DealRecord>) => void
  onSelectDeal?: (deal: DealRecord) => void
  onNavigateToQuote?: (quoteId: string) => void
}

const STAGES: { key: DealStage; label: string; color: string; border: string; bg: string }[] = [
  {
    key: 'prospecting',
    label: 'Prospecção',
    color: 'text-sky-600 dark:text-sky-400',
    border: 'border-sky-300 dark:border-sky-800',
    bg: 'bg-sky-50/50 dark:bg-sky-950/20',
  },
  {
    key: 'qualification',
    label: 'Qualificação',
    color: 'text-indigo-600 dark:text-indigo-400',
    border: 'border-indigo-300 dark:border-indigo-800',
    bg: 'bg-indigo-50/50 dark:bg-indigo-950/20',
  },
  {
    key: 'proposal',
    label: 'Proposta Enviada',
    color: 'text-amber-600 dark:text-amber-400',
    border: 'border-amber-300 dark:border-amber-800',
    bg: 'bg-amber-50/50 dark:bg-amber-950/20',
  },
  {
    key: 'negotiation',
    label: 'Negociação',
    color: 'text-purple-600 dark:text-purple-400',
    border: 'border-purple-300 dark:border-purple-800',
    bg: 'bg-purple-50/50 dark:bg-purple-950/20',
  },
  {
    key: 'won',
    label: 'Fechado (Ganho)',
    color: 'text-emerald-600 dark:text-emerald-400',
    border: 'border-emerald-300 dark:border-emerald-800',
    bg: 'bg-emerald-50/50 dark:bg-emerald-950/20',
  },
  {
    key: 'lost',
    label: 'Perdido',
    color: 'text-rose-600 dark:text-rose-400',
    border: 'border-rose-300 dark:border-rose-800',
    bg: 'bg-rose-50/50 dark:bg-rose-950/20',
  },
]

export const PipelineKanban: React.FC<PipelineKanbanProps> = ({
  deals,
  clients,
  quotes = [],
  archivedDeals = [],
  onArchiveDeal,
  onRestoreDeal,
  isAdmin = false,
  onUpdateDealStage,
  onCreateDeal,
  onSelectDeal,
  onNavigateToQuote,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newDealTitle, setNewDealTitle] = useState('')
  const [newDealClientId, setNewDealClientId] = useState('')
  const [newDealValue, setNewDealValue] = useState('')
  const [newDealStage, setNewDealStage] = useState<DealStage>('prospecting')
  const [newDealProbability, setNewDealProbability] = useState('50')
  const [newDealNotes, setNewDealNotes] = useState('')
  const [newDealPriority, setNewDealPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>(
    'medium',
  )

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    const selectedClient = clients.find((c) => c.id === newDealClientId)
    onCreateDeal({
      title: newDealTitle,
      client_id: newDealClientId || undefined,
      client_name: selectedClient ? selectedClient.name : undefined,
      value: Number(newDealValue) || 0,
      stage: newDealStage,
      probability: Number(newDealProbability) || 50,
      priority: newDealPriority,
      notes: newDealNotes,
      assigned_to: 'Alex Nogueia',
    })

    setNewDealTitle('')
    setNewDealClientId('')
    setNewDealValue('')
    setNewDealNotes('')
    setIsModalOpen(false)
  }

  const getStageTotal = (stage: DealStage) => {
    return deals.filter((d) => d.stage === stage).reduce((acc, curr) => acc + (curr.value || 0), 0)
  }

  return (
    <div className="space-y-6">
      {/* Header Pipeline */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Briefcase className="h-6 w-6 text-indigo-600" />
            Funil de Vendas & Pipeline Comercial
          </h2>
          <p className="text-xs md:text-sm text-muted-foreground mt-0.5">
            Mova oportunidades pelas etapas do modelo de conversão B2B.
          </p>
        </div>
        <Button
          onClick={() => setIsModalOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-500 shadow-sm"
        >
          <Plus className="h-4 w-4 mr-1.5" />
          Nova Oportunidade
        </Button>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5 overflow-x-auto pb-4">
        {STAGES.map((stage) => {
          const stageDeals = deals.filter((d) => d.stage === stage.key)
          const totalVal = getStageTotal(stage.key)

          return (
            <div
              key={stage.key}
              className={`rounded-xl border ${stage.border} ${stage.bg} flex flex-col min-w-[240px] max-w-full p-2.5 transition-all`}
            >
              {/* Coluna Header */}
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200/60 dark:border-slate-800">
                <div>
                  <h3 className={`text-xs font-bold uppercase tracking-wider ${stage.color}`}>
                    {stage.label}
                  </h3>
                  <div className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                    {totalVal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </div>
                </div>
                <Badge
                  variant="secondary"
                  className="text-[10px] font-mono font-bold px-1.5 py-0.5"
                >
                  {stageDeals.length}
                </Badge>
              </div>

              {/* Cards Dentro da Etapa */}
              <div className="space-y-2.5 flex-1 min-h-[320px]">
                {stageDeals.length === 0 ? (
                  <div className="h-28 flex flex-col items-center justify-center text-center text-muted-foreground/60 border border-dashed rounded-lg border-slate-200 dark:border-slate-800">
                    <span className="text-[11px]">Nenhuma oportunidade</span>
                  </div>
                ) : (
                  stageDeals.map((deal) => (
                    <Card
                      key={deal.id}
                      onClick={() => onSelectDeal?.(deal)}
                      className="p-3 shadow-xs hover:shadow-md transition-all border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 cursor-pointer space-y-2 group"
                    >
                      <div className="flex items-start justify-between gap-1.5">
                        <div className="font-semibold text-xs text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 line-clamp-2">
                          {deal.title}
                        </div>
                        {deal.title.toLowerCase().includes('proposta') ? (
                          <Badge
                            variant="outline"
                            className="text-[9px] px-1 py-0 bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border-teal-300 font-mono flex items-center gap-0.5 shrink-0"
                          >
                            <FileSpreadsheet className="h-2.5 w-2.5" />
                            Intertermal
                          </Badge>
                        ) : deal.priority === 'urgent' ? (
                          <Badge variant="destructive" className="text-[9px] px-1 py-0 shrink-0">
                            Urgente
                          </Badge>
                        ) : null}
                      </div>

                      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground truncate">
                        <Building2 className="h-3 w-3 shrink-0 text-slate-400" />
                        <span className="truncate">
                          {deal.client_name || 'Sem cliente vinculado'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800/80">
                        <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                          {(deal.value || 0).toLocaleString('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          })}
                        </span>
                        <span className="text-[10px] font-medium text-slate-500">
                          {deal.probability || 0}% prob.
                        </span>
                      </div>

                      {/* Ações de Transição Rápida de Etapa */}
                      <div
                        className="pt-1 flex items-center justify-between gap-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Select
                          value={deal.stage}
                          onValueChange={(val) => onUpdateDealStage(deal.id, val as DealStage)}
                        >
                          <SelectTrigger className="h-6 text-[10px] px-1.5 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                            <SelectValue placeholder="Mover..." />
                          </SelectTrigger>
                          <SelectContent>
                            {STAGES.map((s) => (
                              <SelectItem key={s.key} value={s.key} className="text-xs">
                                Mover para: {s.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {isAdmin && onArchiveDeal && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-6 px-1.5 text-[10px] text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700 shrink-0"
                            title="Arquivar negócio (sai do funil e dos totais)"
                            onClick={() => onArchiveDeal(deal)}
                          >
                            <Archive className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Negócios Arquivados — fora do funil e dos totais, restauráveis */}
      {archivedDeals.length > 0 && (
        <Card className="border-slate-200 dark:border-slate-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-slate-700 dark:text-slate-300">
              <Archive className="h-4 w-4 text-slate-400" />
              Arquivados
              <Badge variant="secondary" className="text-[10px] font-mono">
                {archivedDeals.length}
              </Badge>
            </CardTitle>
            <CardDescription className="text-xs">
              Fora do funil e dos totais. Restaure para devolver ao pipeline.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {archivedDeals.map((deal) => (
              <div
                key={deal.id}
                className="flex items-center justify-between gap-3 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40"
              >
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                    {deal.title}
                  </div>
                  <div className="text-[11px] text-muted-foreground truncate">
                    {deal.client_name || 'Sem cliente'} ·{' '}
                    {(deal.value || 0).toLocaleString('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    })}
                    {deal.archived_at
                      ? ` · arquivado em ${new Date(deal.archived_at).toLocaleDateString('pt-BR')}`
                      : ''}
                  </div>
                </div>
                {isAdmin && onRestoreDeal && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 px-2 text-[11px] shrink-0"
                    onClick={() => onRestoreDeal(deal)}
                  >
                    <ArchiveRestore className="h-3 w-3 mr-1" /> Restaurar
                  </Button>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Modal Nova Oportunidade */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">
              Criar Nova Oportunidade no Funil
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Título da Oportunidade *</Label>
              <Input
                required
                placeholder="Ex: Licenciamento de CRM + 10 Ramais"
                value={newDealTitle}
                onChange={(e) => setNewDealTitle(e.target.value)}
                className="text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Cliente Relacionado</Label>
                <Select value={newDealClientId} onValueChange={setNewDealClientId}>
                  <SelectTrigger className="text-xs">
                    <SelectValue placeholder="Selecione o cliente..." />
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

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Valor Estimado (R$)</Label>
                <Input
                  type="number"
                  placeholder="25000"
                  value={newDealValue}
                  onChange={(e) => setNewDealValue(e.target.value)}
                  className="text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Etapa Inicial</Label>
                <Select value={newDealStage} onValueChange={(v) => setNewDealStage(v as DealStage)}>
                  <SelectTrigger className="text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STAGES.map((s) => (
                      <SelectItem key={s.key} value={s.key} className="text-xs">
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Probabilidade (%)</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={newDealProbability}
                  onChange={(e) => setNewDealProbability(e.target.value)}
                  className="text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Prioridade</Label>
                <Select value={newDealPriority} onValueChange={(v) => setNewDealPriority(v as any)}>
                  <SelectTrigger className="text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low" className="text-xs">
                      Baixa
                    </SelectItem>
                    <SelectItem value="medium" className="text-xs">
                      Média
                    </SelectItem>
                    <SelectItem value="high" className="text-xs">
                      Alta
                    </SelectItem>
                    <SelectItem value="urgent" className="text-xs">
                      Urgente
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Observações & Contexto</Label>
              <Textarea
                rows={3}
                placeholder="Detalhes sobre a necessidade do cliente e próximos passos..."
                value={newDealNotes}
                onChange={(e) => setNewDealNotes(e.target.value)}
                className="text-xs"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsModalOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" size="sm" className="bg-indigo-600 hover:bg-indigo-500">
                Salvar no Pipeline
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
