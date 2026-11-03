import { QuotePdfPreviewDialog } from './QuotePdfPreviewDialog'
import { EditorDialogFooter } from './quotes/EditorDialogFooter'
import { EditorDialogHeader } from './quotes/EditorDialogHeader'
import { EditorFinanceSummary } from './quotes/EditorFinanceSummary'
import { EditorSourceReviewPanel } from './quotes/EditorSourceReviewPanel'
import { LaborSection } from './quotes/LaborSection'
import { LodgingMealsSection } from './quotes/LodgingMealsSection'
import { MarginsClosingSection } from './quotes/MarginsClosingSection'
import { NewClientDialog } from './quotes/NewClientDialog'
import { QuoteHistoryCard } from './quotes/QuoteHistoryCard'
import { QuotesHeaderMetrics } from './quotes/QuotesHeaderMetrics'
import { QuotesListCard } from './quotes/QuotesListCard'
import { ScopeSectionCard } from './quotes/ScopeSectionCard'
import { TravelSection } from './quotes/TravelSection'
import { WebSearchSpecsDialog } from './quotes/WebSearchSpecsDialog'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { useQuoteEditorState } from './quotes/useQuoteEditorState'
import { computeQuoteCalculations } from './quotes/useQuoteCalculations'
import { useEquipmentHandlers } from './quotes/useEquipmentHandlers'
import { makeSpecsSearch } from './quotes/useSpecsSearch'
import { makeSpecsExtract } from './quotes/useSpecsExtract'
import { makeMaterialsHandlers } from './quotes/useMaterialsHandlers'
import { makeQuoteRoutes } from './quotes/useQuoteRoutes'
import { makeNewClientQuick } from './quotes/useNewClientQuick'
import { makeGetFormDataObject } from './quotes/quoteFormData'
import { makeLoadQuoteHistory } from './quotes/quoteHistoryLoader'
import { makeLoadQuoteIntoForm } from './quotes/quoteFormLoader'
import { makeResetForm } from './quotes/quoteFormReset'
import { makeQuoteActions } from './quotes/useQuoteActions'
import { useQuoteEffects } from './quotes/useQuoteEffects'
import type { ClientRecord, DealRecord, QuoteRecord, QuoteStatus } from '@/types/crm'

export interface QuotesManagerProps {
  quotes: QuoteRecord[]
  clients: ClientRecord[]
  deals?: DealRecord[]
  selectedQuote?: QuoteRecord | null
  onCreateQuote: (data: Partial<QuoteRecord>) => Promise<void>
  onUpdateQuote: (id: string, data: Partial<QuoteRecord>) => Promise<void>
  onDeleteQuote: (id: string) => Promise<void>
  onUpdateQuoteStatus?: (id: string, status: QuoteStatus) => Promise<void>
  onCreateClient?: (data: Partial<ClientRecord>) => Promise<ClientRecord>
  onOpenCatalog?: () => void
}

export function QuotesManager({
  quotes,
  clients,
  deals = [],
  selectedQuote,
  onCreateQuote,
  onUpdateQuote,
  onDeleteQuote,
  onUpdateQuoteStatus,
  onCreateClient,
  onOpenCatalog,
}: QuotesManagerProps) {
  const S = useQuoteEditorState()
  const {
    isEditorOpen,
    setIsEditorOpen,
    isPreviewOpen,
    setIsPreviewOpen,
    quoteForPreview,
    setQuoteForPreview,
    previewViewMode,
    activeQuoteId,
    setStatus,
  } = S
  const { toast } = useToast()

  const D = computeQuoteCalculations({ ...S, quotes })
  const eqH = useEquipmentHandlers({ ...S, toast })
  const specSearchH = makeSpecsSearch({ ...S, toast })
  const specExtractH = makeSpecsExtract({
    ...S,
    toast,
    handleUpdateEquipment: eqH.handleUpdateEquipment,
  })
  const matH = makeMaterialsHandlers({ ...S, toast })
  const routesH = makeQuoteRoutes({ ...S, toast })
  const newClientH = makeNewClientQuick({ ...S, toast, onCreateClient })
  const getFormDataObject = makeGetFormDataObject({ ...S, ...D })
  const loadQuoteHistory = makeLoadQuoteHistory(S)
  const loadQuoteIntoForm = makeLoadQuoteIntoForm({ ...S, loadQuoteHistory })
  const resetForm = makeResetForm(S)
  const actionsH = makeQuoteActions({
    ...S,
    toast,
    getFormDataObject,
    loadQuoteIntoForm,
    resetForm,
    onUpdateQuote,
    onCreateQuote,
    onUpdateQuoteStatus,
    onDeleteQuote,
  })
  useQuoteEffects({
    ...S,
    getFormDataObject,
    loadQuoteIntoForm,
    loadQuoteHistory,
    onUpdateQuote,
    selectedQuote,
  })

  const UI = {
    ...S,
    ...D,
    toast,
    quotes,
    clients,
    deals,
    selectedQuote,
    onCreateQuote,
    onUpdateQuote,
    onDeleteQuote,
    onUpdateQuoteStatus,
    onCreateClient,
    onOpenCatalog,
    ...eqH,
    ...specSearchH,
    ...specExtractH,
    ...matH,
    ...routesH,
    ...newClientH,
    ...actionsH,
    getFormDataObject,
  }

  return (
    <div className="space-y-6">
      <QuotesHeaderMetrics {...UI} />
      <QuotesListCard {...UI} />

      {/* 5. DIALOG / MODAL DE EDIÇÃO E COMPOSIÇÃO DE PROPOSTA */}
      <Dialog open={isEditorOpen} onOpenChange={setIsEditorOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0 gap-0">
          <EditorDialogHeader {...UI} />

          <div className="p-4 sm:p-6 space-y-5">
            <EditorSourceReviewPanel {...UI} />

            <EditorFinanceSummary {...UI} />

            {/* SEÇÕES EMPILHADAS (Layout Unificado Versão 0.0.66) */}
            <div className="space-y-6">
              <ScopeSectionCard {...UI} />
              <LaborSection {...UI} />
              <TravelSection {...UI} />
              <LodgingMealsSection {...UI} />
              <MarginsClosingSection {...UI} />
              <QuoteHistoryCard {...UI} />
            </div>
          </div>

          <EditorDialogFooter {...UI} />
        </DialogContent>
      </Dialog>

      <NewClientDialog {...UI} />

      <WebSearchSpecsDialog {...UI} />

      {/* 6. Modal de Impressão e PDF (com suporte explícito a visão cliente e interna + aprovação) */}
      {quoteForPreview && (
        <QuotePdfPreviewDialog
          quote={
            {
              ...quoteForPreview,
              ...(activeQuoteId === quoteForPreview.id ? getFormDataObject() : {}),
              id: quoteForPreview.id,
            } as QuoteRecord
          }
          open={isPreviewOpen}
          onOpenChange={setIsPreviewOpen}
          viewMode={previewViewMode}
          onApproveQuote={async (q) => {
            const quoteId = q.id || activeQuoteId
            if (!quoteId) return

            const payload = getFormDataObject()
            payload.status = 'approved'

            if (onUpdateQuoteStatus) {
              await onUpdateQuote(quoteId, payload)
              await onUpdateQuoteStatus(quoteId, 'approved')
            } else {
              await onUpdateQuote(quoteId, payload)
            }
            setStatus('approved')
            toast({
              title: '🎉 Proposta Aprovada com Sucesso!',
              description: 'A Ordem de Serviço foi gerada e o pipeline atualizado.',
            })
          }}
        />
      )}
    </div>
  )
}

export default QuotesManager
