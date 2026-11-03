import { useFieldVisitState } from '@/components/field-visit/useFieldVisitState'
import { useVisitAutosave } from '@/components/field-visit/useVisitAutosave'
import { useAiActionPlan } from '@/components/field-visit/useAiActionPlan'
import { useNameplateOcr } from '@/components/field-visit/useNameplateOcr'
import { useVisitSubmit } from '@/components/field-visit/useVisitSubmit'
import {
  makeFieldHighlight,
  makeRenderConfidenceBadge,
} from '@/components/field-visit/fieldVisitConfidence'
import { VisitPageHeader } from '@/components/field-visit/VisitPageHeader'
import { VisitAlertsSection } from '@/components/field-visit/VisitAlertsSection'
import { VisitBasicsSections } from '@/components/field-visit/VisitBasicsSections'
import { LeanFlowSection } from '@/components/field-visit/LeanFlowSection'
import { DetailedFlowSection } from '@/components/field-visit/DetailedFlowSection'
import { ActionPlanSection } from '@/components/field-visit/ActionPlanSection'
import { SendFooterSection } from '@/components/field-visit/SendFooterSection'
import { VisitModals } from '@/components/field-visit/VisitModals'
import type { FieldVisitData } from '@/types/field-visit'

export default function FieldVisitPage({
  sellerMode = false,
  sellerName = '',
  initialVisitData = null,
}: {
  sellerMode?: boolean
  sellerName?: string
  initialVisitData?: FieldVisitData | null
} = {}) {
  const s = useFieldVisitState({ sellerMode, sellerName, initialVisitData })
  useVisitAutosave({
    visit: s.visit,
    setSaveStatus: s.setSaveStatus,
    setQuotaWarning: s.setQuotaWarning,
  })
  const ai = useAiActionPlan({ visit: s.visit, setVisit: s.setVisit })
  const ocr = useNameplateOcr({ visit: s.visit, setVisit: s.setVisit })
  const submit = useVisitSubmit({ visit: s.visit, setVisit: s.setVisit, sellerMode })
  const renderConfidenceBadge = makeRenderConfidenceBadge(s.manuallyEditedFields)
  const fieldHighlight = makeFieldHighlight(s.manuallyEditedFields)
  // Liga o gatilho da leitura de plaqueta aos anexos do equipamento (mesmo comportamento de antes)
  s.photoTriggerRef.current = ocr.handleTriggerNameplateOcr

  const isLeanFlow =
    s.visit.workType === 'Projeto Novo' ||
    s.visit.workType === 'Readequação' ||
    s.visit.workType === 'Outro' ||
    s.visit.workType === 'Projeto novo ou readequação'

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-20">
      <VisitPageHeader
        sellerMode={sellerMode}
        saveStatus={s.saveStatus}
        isAiLoading={ai.isAiLoading}
        isSendingToCrm={submit.isSendingToCrm}
        visit={s.visit}
        handleAiAnalysis={ai.handleAiAnalysis}
        handleSendToCrm={submit.handleSendToCrm}
        setIsPdfDialogOpen={s.setIsPdfDialogOpen}
        setIsNewVisitDialogOpen={s.setIsNewVisitDialogOpen}
        mediaStatus={s.mediaStatus}
        onRetryMedia={s.retryMediaNow}
      />

      <main className="max-w-3xl mx-auto px-4 pt-4 space-y-5">
        {/* Aviso da fila: nunca falha em silêncio (mídia não enviada / visita pendente) */}
        {s.mediaNotice && (
          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 flex items-center justify-between gap-2 text-xs text-amber-900 dark:text-amber-200 shadow-xs">
            <span className="leading-relaxed">{s.mediaNotice}</span>
            <button
              type="button"
              onClick={s.retryMediaNow}
              className="shrink-0 text-[11px] font-bold px-2 py-1 rounded-md bg-amber-600 hover:bg-amber-700 text-white"
            >
              Reenviar agora
            </button>
          </div>
        )}
        <VisitAlertsSection
          visit={s.visit}
          queryVisitId={s.queryVisitId}
          isLoadingRecord={s.isLoadingRecord}
          quotaWarning={s.quotaWarning}
          isSendingToCrm={submit.isSendingToCrm}
          handleSendToCrm={submit.handleSendToCrm}
          setIsPdfDialogOpen={s.setIsPdfDialogOpen}
        />

        <VisitBasicsSections
          visit={s.visit}
          setVisit={s.setVisit}
          sellerMode={sellerMode}
          sellerName={sellerName}
          handleEmployeeChange={s.handleEmployeeChange}
          handleStartTimeChange={s.handleStartTimeChange}
          handleEndTimeChange={s.handleEndTimeChange}
          handleDurationChange={s.handleDurationChange}
          handleRecalculateDuration={s.handleRecalculateDuration}
        />

        {isLeanFlow ? (
          <LeanFlowSection
            visit={s.visit}
            setVisit={s.setVisit}
            handleAddVisitAttachments={s.handleAddVisitAttachments}
            handleRemoveVisitAttachment={s.handleRemoveVisitAttachment}
            handleAddEquipment={s.handleAddEquipment}
            handleUpdateEquipment={s.handleUpdateEquipment}
            markFieldAsManuallyEdited={s.markFieldAsManuallyEdited}
            renderConfidenceBadge={renderConfidenceBadge}
            fieldHighlight={fieldHighlight}
            handleAddEquipmentAttachments={s.handleAddEquipmentAttachments}
            handleRemoveEquipmentAttachment={s.handleRemoveEquipmentAttachment}
            handleTriggerNameplateOcr={ocr.handleTriggerNameplateOcr}
            setEquipmentToDelete={s.setEquipmentToDelete}
            isReadingNameplate={ocr.isReadingNameplate}
            readingEquipmentId={ocr.readingEquipmentId}
            activeReadingAttachmentId={ocr.activeReadingAttachmentId}
            nameplateReadingStatus={ocr.nameplateReadingStatus}
            isCompressingGlobal={s.isCompressingGlobal}
          />
        ) : (
          <DetailedFlowSection
            visit={s.visit}
            setVisit={s.setVisit}
            handleAddEquipment={s.handleAddEquipment}
            handleUpdateEquipment={s.handleUpdateEquipment}
            markFieldAsManuallyEdited={s.markFieldAsManuallyEdited}
            renderConfidenceBadge={renderConfidenceBadge}
            fieldHighlight={fieldHighlight}
            handleAddEquipmentAttachments={s.handleAddEquipmentAttachments}
            handleRemoveEquipmentAttachment={s.handleRemoveEquipmentAttachment}
            handleTriggerNameplateOcr={ocr.handleTriggerNameplateOcr}
            setEquipmentToDelete={s.setEquipmentToDelete}
            isReadingNameplate={ocr.isReadingNameplate}
            readingEquipmentId={ocr.readingEquipmentId}
            activeReadingAttachmentId={ocr.activeReadingAttachmentId}
            nameplateReadingStatus={ocr.nameplateReadingStatus}
            isCompressingGlobal={s.isCompressingGlobal}
          />
        )}

        <ActionPlanSection visit={s.visit} />

        <SendFooterSection
          visit={s.visit}
          handleSendToCrm={submit.handleSendToCrm}
          isSendingToCrm={submit.isSendingToCrm}
          setIsPdfDialogOpen={s.setIsPdfDialogOpen}
        />
      </main>

      <VisitModals
        visit={s.visit}
        isPdfDialogOpen={s.isPdfDialogOpen}
        setIsPdfDialogOpen={s.setIsPdfDialogOpen}
        ocrReviewOpen={ocr.ocrReviewOpen}
        setOcrReviewOpen={ocr.setOcrReviewOpen}
        ocrComparisonResult={ocr.ocrComparisonResult}
        targetOcrEquipment={ocr.targetOcrEquipment}
        handleApplyNameplateOcr={ocr.handleApplyNameplateOcr}
        handleDiscardNameplateOcr={ocr.handleDiscardNameplateOcr}
        aiConfirmOpen={ai.aiConfirmOpen}
        setAiConfirmOpen={ai.setAiConfirmOpen}
        aiDraft={ai.aiDraft}
        handleAiConfirm={ai.handleAiConfirm}
        isNewVisitDialogOpen={s.isNewVisitDialogOpen}
        setIsNewVisitDialogOpen={s.setIsNewVisitDialogOpen}
        handleConfirmNewVisit={s.handleConfirmNewVisit}
        equipmentToDelete={s.equipmentToDelete}
        setEquipmentToDelete={s.setEquipmentToDelete}
        handleConfirmDeleteEquipment={s.handleConfirmDeleteEquipment}
      />
    </div>
  )
}
