import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { QuoteHistoryItem } from '@/services/quote-history'
import { QuoteStatus } from '@/types/crm'
import { History, Loader2 } from 'lucide-react'

interface QuoteHistoryCardProps {
  activeQuoteId: string | null
  status: QuoteStatus
  quoteHistoryList: QuoteHistoryItem[]
  isLoadingHistory: boolean
}

export function QuoteHistoryCard(props: QuoteHistoryCardProps) {
  const { activeQuoteId, status, quoteHistoryList, isLoadingHistory } = props

  return (
    <>
      {/* SEÇÃO ADITIVA: Histórico de Alterações da Proposta */}
      {activeQuoteId && (
        <Card className="border-slate-200 dark:border-slate-800 shadow-xs">
          <CardHeader className="p-4 pb-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <History className="h-4 w-4 text-teal-600" />
                Histórico de Alterações da Proposta
              </CardTitle>
              <Badge variant="outline" className="text-[10px] font-mono">
                {quoteHistoryList.length} registro(s)
              </Badge>
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Rastreabilidade aditiva de edições: valores, margens, logística, escopo e status.
            </p>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            {isLoadingHistory ? (
              <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
                <Loader2 className="h-4 w-4 animate-spin text-teal-600" />
                Carregando histórico de alterações...
              </div>
            ) : quoteHistoryList.length === 0 ? (
              <div className="text-xs text-muted-foreground py-3 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-lg">
                Nenhuma alteração registrada após a criação. Modificações futuras aparecerão aqui
                automaticamente.
              </div>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {quoteHistoryList.map((item, idx) => {
                  const dateObj = item.created
                    ? new Date(item.created)
                    : item.timestamp
                      ? new Date(item.timestamp)
                      : new Date()
                  const dateStr = dateObj.toLocaleDateString('pt-BR')
                  const timeStr = dateObj.toLocaleTimeString('pt-BR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                  return (
                    <div
                      key={item.id || idx}
                      className="text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                    >
                      <div className="space-y-0.5 min-w-0 flex-1">
                        <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 flex-wrap">
                          <span className="text-teal-700 dark:text-teal-400 font-medium">
                            {item.field_name}:
                          </span>
                          <span>
                            De{' '}
                            <del className="text-rose-600 font-normal">
                              {item.old_value || 'vazio'}
                            </del>{' '}
                            para{' '}
                            <strong className="text-emerald-700 dark:text-emerald-400">
                              {item.new_value}
                            </strong>
                          </span>
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          Modificado por <strong>{item.changed_by || 'Usuário'}</strong> em{' '}
                          {dateStr} às {timeStr}
                        </div>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono shrink-0">
                        {timeStr}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </>
  )
}
