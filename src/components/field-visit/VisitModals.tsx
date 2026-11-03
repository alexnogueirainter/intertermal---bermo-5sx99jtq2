import { FieldVisitPdfDialog } from '@/components/FieldVisitPdfDialog'
import { NameplateOcrReviewDialog } from '@/components/NameplateOcrReviewDialog'
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
import { formatEquipmentTitle } from '@/types/field-visit'
import type { FieldVisitData, EquipmentItem } from '@/types/field-visit'
import type { NameplateComparisonResult } from '@/services/nameplate-reader'

export function VisitModals({
  visit,
  isPdfDialogOpen,
  setIsPdfDialogOpen,
  ocrReviewOpen,
  setOcrReviewOpen,
  ocrComparisonResult,
  targetOcrEquipment,
  handleApplyNameplateOcr,
  handleDiscardNameplateOcr,
  aiConfirmOpen,
  setAiConfirmOpen,
  aiDraft,
  handleAiConfirm,
  isNewVisitDialogOpen,
  setIsNewVisitDialogOpen,
  handleConfirmNewVisit,
  equipmentToDelete,
  setEquipmentToDelete,
  handleConfirmDeleteEquipment,
}: {
  visit: FieldVisitData
  isPdfDialogOpen: boolean
  setIsPdfDialogOpen: (open: boolean) => void
  ocrReviewOpen: boolean
  setOcrReviewOpen: (open: boolean) => void
  ocrComparisonResult: NameplateComparisonResult | null
  targetOcrEquipment: EquipmentItem | null
  handleApplyNameplateOcr: (mergedEq: EquipmentItem) => void
  handleDiscardNameplateOcr: () => void
  aiConfirmOpen: boolean
  setAiConfirmOpen: (open: boolean) => void
  aiDraft: any[] | null
  handleAiConfirm: () => void
  isNewVisitDialogOpen: boolean
  setIsNewVisitDialogOpen: (open: boolean) => void
  handleConfirmNewVisit: () => void
  equipmentToDelete: string | null
  setEquipmentToDelete: (id: string | null) => void
  handleConfirmDeleteEquipment: () => void
}) {
  return (
    <>
      {/* Modal de Prévia e Impressão do PDF da Visita */}
      <FieldVisitPdfDialog open={isPdfDialogOpen} onOpenChange={setIsPdfDialogOpen} visit={visit} />

      {/* Modal de Revisão Leve da Leitura da Plaqueta (Confirmação Não-Bloqueante) */}
      <NameplateOcrReviewDialog
        open={ocrReviewOpen}
        onOpenChange={setOcrReviewOpen}
        comparisonResult={ocrComparisonResult}
        onApply={handleApplyNameplateOcr}
        onDiscard={handleDiscardNameplateOcr}
        equipmentName={
          targetOcrEquipment
            ? formatEquipmentTitle(
                targetOcrEquipment,
                visit.equipments.findIndex((e) => e.id === targetOcrEquipment.id),
              )
            : undefined
        }
      />

      {/* Modal de confirmação da Análise IA */}
      <AlertDialog open={aiConfirmOpen} onOpenChange={setAiConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Aplicar plano de ação da IA?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="max-h-64 overflow-y-auto space-y-2 text-sm">
                <p className="text-amber-700 dark:text-amber-400 font-semibold">
                  Revise antes de salvar — você poderá editar depois.
                </p>
                {(aiDraft || []).map((it, idx) => (
                  <div
                    key={idx}
                    className="border rounded p-2.5 bg-slate-50 dark:bg-slate-900 space-y-1.5 text-xs"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold text-xs text-slate-900 dark:text-slate-100">
                        {idx + 1}. {it.title}
                      </p>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-violet-100 dark:bg-violet-950 text-violet-700 dark:text-violet-300">
                        {it.priority}
                      </span>
                    </div>

                    {it.diagnosis && (
                      <div className="p-1.5 rounded bg-white dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800">
                        <strong className="text-[11px] text-slate-700 dark:text-slate-300 block">
                          1. Diagnóstico:
                        </strong>
                        <p className="text-[11px] text-slate-600 dark:text-slate-400">
                          {it.diagnosis}
                        </p>
                      </div>
                    )}

                    <div className="p-1.5 rounded bg-white dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 space-y-1">
                      <strong className="text-[11px] text-slate-700 dark:text-slate-300 block">
                        2. Ações recomendadas:
                      </strong>
                      <p className="text-[11px] text-slate-700 dark:text-slate-300">
                        {it.suggestedAction || it.description}
                      </p>
                      {it.technicalReference && (
                        <p className="text-[10.5px] text-teal-700 dark:text-teal-400 font-medium">
                          <strong>Referência do fabricante:</strong> {it.technicalReference}
                        </p>
                      )}
                    </div>

                    <div className="p-1.5 rounded bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50">
                      <strong className="text-[11px] text-amber-900 dark:text-amber-300 block">
                        3. Condições do local de instalação:
                      </strong>
                      <p className="text-[11px] text-amber-800 dark:text-amber-400">
                        {it.installationConditions || 'Condições do local não detalhadas na visita'}
                      </p>
                    </div>

                    {Array.isArray(it.pendingItems) && it.pendingItems.length > 0 && (
                      <div className="p-1.5 rounded bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50">
                        <strong className="text-[11px] text-rose-900 dark:text-rose-300 block">
                          4. Itens pendentes de levantamento:
                        </strong>
                        <ul className="list-disc list-inside text-[10.5px] text-rose-800 dark:text-rose-400 space-y-0.5">
                          {it.pendingItems.map((p: string, pIdx: number) => (
                            <li key={pIdx}>{p}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {it.equipment_id && (
                      <p className="text-[10px] text-teal-700 dark:text-teal-400 pt-0.5">
                        📷 Fotos do equipamento serão vinculadas no relatório
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setAiConfirmOpen(false)}>Descartar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleAiConfirm}
              className="bg-violet-600 hover:bg-violet-700 text-white font-semibold"
            >
              Aplicar plano
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal de Confirmação: Nova Visita */}
      <AlertDialog open={isNewVisitDialogOpen} onOpenChange={setIsNewVisitDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Iniciar uma nova visita a campo?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação irá limpar os dados da visita em curso da tela para começar um novo
              atendimento. O nome do funcionário será preservado para você não precisar digitar de
              novo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continuar editando</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmNewVisit}
              className="bg-rose-600 hover:bg-rose-700 text-white font-semibold"
            >
              Sim, começar nova visita
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal de Confirmação: Remover Equipamento */}
      <AlertDialog
        open={equipmentToDelete !== null}
        onOpenChange={(open) => !open && setEquipmentToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover este equipamento?</AlertDialogTitle>
            <AlertDialogDescription>
              Os dados e os anexos deste equipamento serão excluídos do formulário desta visita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setEquipmentToDelete(null)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDeleteEquipment}
              className="bg-rose-600 hover:bg-rose-700 text-white font-semibold"
            >
              Sim, remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
