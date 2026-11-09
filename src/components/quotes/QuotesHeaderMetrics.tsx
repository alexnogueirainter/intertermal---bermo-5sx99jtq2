import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { QuoteRecord } from '@/types/crm'
import { Calculator, CheckCircle, Clock, DollarSign, FolderOpen, Sparkles } from 'lucide-react'

interface QuotesHeaderMetricsProps {
  quotes: QuoteRecord[]
  onOpenCatalog: (() => void) | undefined
  totalValue: number
  approvedQuotes: QuoteRecord[]
  approvedValue: number
  pendingQuotes: QuoteRecord[]
}

export function QuotesHeaderMetrics(props: QuotesHeaderMetricsProps) {
  const { quotes, onOpenCatalog, totalValue, approvedQuotes, approvedValue, pendingQuotes } = props

  return (
    <>
      {/* 1. Barra de Cabeçalho da Gestão de Propostas (Layout de Coluna Única) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Calculator className="h-6 w-6 text-teal-600" />
            Orçamentos de Serviços Intertermal
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            Gestão unificada de propostas comerciais e técnicas: visualize, edite, gere PDF e aprove
            diretamente.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {onOpenCatalog && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onOpenCatalog}
              className="text-xs border-teal-300 text-teal-700 hover:bg-teal-50"
            >
              <Sparkles className="h-3.5 w-3.5 mr-1 text-teal-600" />
              Catálogo BERMO
            </Button>
          )}

          {/* Criação de proposta centralizada no botão "+ Novo" do topo */}
        </div>
      </div>

      {/* 2. Resumo de Métricas (Cards em linha) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="border-slate-200 dark:border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Total de Propostas
              </span>
              <FolderOpen className="h-4 w-4 text-teal-600" />
            </div>
            <div className="mt-2 text-2xl font-bold font-mono text-slate-900 dark:text-slate-100">
              {quotes.length}
            </div>
            <span className="text-[11px] text-muted-foreground mt-0.5 block">
              Volume total emitido
            </span>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Valor em Carteira
              </span>
              <DollarSign className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="mt-2 text-2xl font-bold font-mono text-emerald-700 dark:text-emerald-400">
              {totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>
            <span className="text-[11px] text-muted-foreground mt-0.5 block">
              Soma de todas as propostas
            </span>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Aprovadas / OS
              </span>
              <CheckCircle className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="mt-2 text-2xl font-bold font-mono text-slate-900 dark:text-slate-100">
              {approvedQuotes.length}
              <span className="text-xs text-muted-foreground font-normal ml-1.5">
                ({approvedValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })})
              </span>
            </div>
            <span className="text-[11px] text-emerald-600 font-semibold mt-0.5 block">
              Convertidas para execução
            </span>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Em Negociação
              </span>
              <Clock className="h-4 w-4 text-amber-500" />
            </div>
            <div className="mt-2 text-2xl font-bold font-mono text-amber-600">
              {pendingQuotes.length}
            </div>
            <span className="text-[11px] text-muted-foreground mt-0.5 block">
              Rascunhos ou enviadas
            </span>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
