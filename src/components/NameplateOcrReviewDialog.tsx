import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, CheckCircle2, Sparkles, Plus, AlertTriangle, Layers } from 'lucide-react'
import { NameplateComparisonResult } from '@/services/nameplate-reader'

interface NameplateOcrReviewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  comparisonResult: NameplateComparisonResult | null
  onApply: (updatedEquipment: any) => void
  onDiscard: () => void
  equipmentName?: string
}

export function NameplateOcrReviewDialog({
  open,
  onOpenChange,
  comparisonResult,
  onApply,
  onDiscard,
  equipmentName,
}: NameplateOcrReviewDialogProps) {
  if (!comparisonResult) return null

  const { autoFilled, discrepancies, newCustomFields, unidentifiedFields, mergedEquipment } =
    comparisonResult

  const totalIdentified = autoFilled.length + discrepancies.length + newCustomFields.length

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="p-4 sm:p-5 bg-teal-50/70 dark:bg-teal-950/40 border-b border-teal-200/70 dark:border-teal-900/40">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-teal-600 text-white flex items-center justify-center shrink-0">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-teal-950 dark:text-teal-100">
                Leitura Automática da Plaqueta
              </DialogTitle>
              <p className="text-xs text-teal-800 dark:text-teal-300">
                {equipmentName || 'Equipamento'} • Agente Especialista Skip Cloud
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="p-4 sm:p-5 space-y-4 text-xs">
          {/* Resumo */}
          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between flex-wrap gap-2">
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              Dados reconhecidos na foto:
            </span>
            <div className="flex items-center gap-1.5 flex-wrap">
              <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300">
                {autoFilled.length} a preencher
              </Badge>
              {discrepancies.length > 0 && (
                <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300">
                  {discrepancies.length} divergência(s)
                </Badge>
              )}
              {newCustomFields.length > 0 && (
                <Badge className="bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300 border-teal-300">
                  +{newCustomFields.length} campo(s) novo(s)
                </Badge>
              )}
            </div>
          </div>

          {/* 1. Campos que serão preenchidos automaticamente */}
          {autoFilled.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 font-semibold text-emerald-800 dark:text-emerald-400">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span>Campos vazios que serão preenchidos ({autoFilled.length})</span>
              </div>
              <div className="border border-emerald-200 dark:border-emerald-900/60 rounded-lg overflow-hidden divide-y divide-emerald-100 dark:divide-emerald-900/40 bg-emerald-50/20">
                {autoFilled.map((f) => (
                  <div key={f.fieldKey} className="p-2.5 flex items-center justify-between gap-2">
                    <span className="text-slate-600 dark:text-slate-400 font-medium">
                      {f.label}
                    </span>
                    <span className="font-bold text-slate-900 dark:text-slate-100 font-mono text-right">
                      {f.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 2. Divergências detectadas (preservando o valor digitado) */}
          {discrepancies.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 font-semibold text-amber-800 dark:text-amber-400">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <span>Divergências detectadas ({discrepancies.length})</span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                O seu valor digitado foi mantido intacto. Você pode conferir abaixo a indicação da
                placa:
              </p>
              <div className="border border-amber-200 dark:border-amber-900/60 rounded-lg overflow-hidden divide-y divide-amber-100 dark:divide-amber-900/40 bg-amber-50/30 dark:bg-amber-950/20">
                {discrepancies.map((d) => (
                  <div key={d.fieldKey} className="p-2.5 space-y-1">
                    <div className="font-semibold text-slate-800 dark:text-slate-200">
                      {d.label}
                    </div>
                    <div className="flex items-center justify-between text-[11px] gap-2">
                      <span className="text-slate-600 dark:text-slate-400">
                        Seu preenchimento:{' '}
                        <strong className="text-slate-900 dark:text-slate-100">
                          {d.currentValue}
                        </strong>
                      </span>
                      <span className="text-amber-800 dark:text-amber-300 font-mono">
                        Placa indica: <strong>{d.plateValue}</strong>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 3. Novos campos dinâmicos criados pela leitura da placa */}
          {newCustomFields.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 font-semibold text-teal-800 dark:text-teal-400">
                <Plus className="h-4 w-4 text-teal-600" />
                <span>Novos campos identificados na placa ({newCustomFields.length})</span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Informações da placa que não pertenciam ao formulário padrão serão adicionadas como
                novos campos do equipamento:
              </p>
              <div className="border border-teal-200 dark:border-teal-900/60 rounded-lg overflow-hidden divide-y divide-teal-100 dark:divide-teal-900/40 bg-teal-50/20">
                {newCustomFields.map((cf) => (
                  <div key={cf.id} className="p-2.5 flex items-center justify-between gap-2">
                    <span className="text-slate-700 dark:text-slate-300 font-medium">
                      {cf.label}
                    </span>
                    <span className="font-semibold text-teal-900 dark:text-teal-200 text-right">
                      {cf.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 4. Campos não identificados na foto */}
          {unidentifiedFields.length > 0 && (
            <div className="space-y-1 pt-1 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-[11px]">
                <AlertCircle className="h-3.5 w-3.5" />
                <span>
                  Não identificados na foto ({unidentifiedFields.length}): preencher manualmente se
                  necessário.
                </span>
              </div>
              <div className="flex flex-wrap gap-1 pt-1">
                {unidentifiedFields.slice(0, 6).map((uf) => (
                  <span
                    key={uf.fieldKey}
                    className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded"
                  >
                    {uf.label}
                  </span>
                ))}
                {unidentifiedFields.length > 6 && (
                  <span className="text-[10px] text-muted-foreground px-1 py-0.5">
                    +{unidentifiedFields.length - 6} outros
                  </span>
                )}
              </div>
            </div>
          )}

          {totalIdentified === 0 && (
            <div className="p-4 text-center text-muted-foreground space-y-1">
              <p>Nenhuma nova informação pôde ser preenchida automaticamente.</p>
              <p className="text-[11px]">Você pode continuar preenchendo os dados manualmente.</p>
            </div>
          )}
        </div>

        <DialogFooter className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between sm:justify-end gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={onDiscard} className="text-xs">
            Descartar
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={() => onApply(mergedEquipment)}
            className="bg-teal-700 hover:bg-teal-600 text-white font-semibold text-xs"
          >
            Aplicar no Formulário
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
