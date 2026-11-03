import { Sparkles } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { FieldVisitData } from '@/types/field-visit'

export function ActionPlanSection({ visit }: { visit: FieldVisitData }) {
  return (
    <>
      {/* 7. SEÇÃO: PLANO DE AÇÃO GERADO PELA IA */}
      {visit.actionPlan && visit.actionPlan.length > 0 && (
        <Card className="border-violet-300 dark:border-violet-800 bg-white dark:bg-slate-900 shadow-sm">
          <CardHeader className="bg-violet-50/70 dark:bg-violet-950/40 border-b border-violet-200 dark:border-violet-800 py-3.5 px-4">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-violet-600" />
                <CardTitle className="text-sm font-bold text-violet-950 dark:text-violet-200">
                  Plano de Ação para Orçamento ({visit.actionPlan.length}{' '}
                  {visit.actionPlan.length === 1 ? 'item' : 'itens'})
                </CardTitle>
              </div>
              <Badge className="bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-200 text-[10px] font-semibold border-violet-300">
                Gerado por Análise da IA
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            <p className="text-xs text-muted-foreground">
              Plano técnico estruturado a partir dos dados coletados na visita para subsidiar o
              orçamento e o relatório ao cliente.
            </p>
            <div className="space-y-3">
              {visit.actionPlan.map((action, aIdx) => (
                <div
                  key={action.id || aIdx}
                  className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50 space-y-2.5 text-xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="h-5 w-5 rounded-full bg-violet-600 text-white text-[11px] font-bold flex items-center justify-center shrink-0">
                        {aIdx + 1}
                      </span>
                      <strong className="text-slate-900 dark:text-slate-100 text-xs sm:text-sm">
                        {action.title}
                      </strong>
                    </div>
                    <Badge
                      variant="outline"
                      className={`text-[9.5px] font-semibold ${
                        action.priority === 'Alta'
                          ? 'text-rose-700 border-rose-300 bg-rose-50'
                          : action.priority === 'Média'
                            ? 'text-amber-700 border-amber-300 bg-amber-50'
                            : 'text-emerald-700 border-emerald-300 bg-emerald-50'
                      }`}
                    >
                      Prioridade {action.priority}
                    </Badge>
                  </div>

                  {/* 1. Diagnóstico */}
                  <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
                    <span className="text-[10.5px] font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide block">
                      1. Diagnóstico (baseado exclusivamente no registro da visita):
                    </span>
                    <p className="text-slate-700 dark:text-slate-300 text-[11px] leading-relaxed">
                      {action.diagnosis || action.description}
                    </p>
                  </div>

                  {/* 2. Ações recomendadas */}
                  <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
                    <span className="text-[10.5px] font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide block">
                      2. Ações Recomendadas:
                    </span>
                    <p className="text-slate-700 dark:text-slate-300 text-[11px] leading-relaxed">
                      {action.suggestedAction || action.description}
                    </p>
                    {action.technicalReference && (
                      <div className="pt-1 text-[11px] text-teal-800 dark:text-teal-300 flex items-start gap-1 font-medium">
                        <strong className="shrink-0">Referência técnica:</strong>
                        <span>{action.technicalReference}</span>
                      </div>
                    )}
                  </div>

                  {/* 3. Condições do local de instalação */}
                  <div className="p-2.5 rounded-lg bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 space-y-1">
                    <span className="text-[10.5px] font-bold text-amber-900 dark:text-amber-300 uppercase tracking-wide block">
                      3. Condições do Local de Instalação (Grau de Dificuldade Físico):
                    </span>
                    <p className="text-amber-800 dark:text-amber-200 text-[11px] leading-relaxed">
                      {action.installationConditions ||
                        'Condições do local não detalhadas na visita'}
                    </p>
                  </div>

                  {/* 4. Itens pendentes de levantamento */}
                  {action.pendingItems && action.pendingItems.length > 0 && (
                    <div className="p-2.5 rounded-lg bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 space-y-1">
                      <span className="text-[10.5px] font-bold text-rose-900 dark:text-rose-300 uppercase tracking-wide block">
                        4. Itens Pendentes de Levantamento:
                      </span>
                      <ul className="list-disc list-inside text-rose-800 dark:text-rose-200 text-[11px] space-y-0.5 leading-relaxed">
                        {action.pendingItems.map((item, pIdx) => (
                          <li key={pIdx}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </>
  )
}
