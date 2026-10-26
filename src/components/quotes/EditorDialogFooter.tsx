import { Button } from '@/components/ui/button'
import { DialogFooter } from '@/components/ui/dialog'
import { QuoteRecord } from '@/types/crm'
import { Clock, ExternalLink, Eye, Loader2, Save } from 'lucide-react'
import type { Dispatch, SetStateAction } from 'react'

interface EditorDialogFooterProps {
  setIsEditorOpen: Dispatch<SetStateAction<boolean>>
  activeQuoteId: string | null
  isSaving: boolean
  approvalToken: string
  getFormDataObject: () => Partial<QuoteRecord>
  handleSaveQuote: () => any
  handleSaveDraft: () => any
  handleOpenPdfPreview: (quoteObj: QuoteRecord, mode: 'client' | 'internal') => any
}

export function EditorDialogFooter(props: EditorDialogFooterProps) {
  const {
    setIsEditorOpen,
    activeQuoteId,
    isSaving,
    approvalToken,
    getFormDataObject,
    handleSaveQuote,
    handleSaveDraft,
    handleOpenPdfPreview,
  } = props

  return (
    <>
      <DialogFooter className="p-4 sm:p-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sticky bottom-0 z-10 backdrop-blur-sm">
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsEditorOpen(false)}
            className="text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100"
          >
            Cancelar
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              const currentObj = getFormDataObject() as QuoteRecord
              handleOpenPdfPreview({ ...currentObj, id: activeQuoteId || 'draft' }, 'client')
            }}
            className="text-xs border-teal-300 text-teal-700 hover:bg-teal-50 dark:border-teal-800 dark:text-teal-300"
          >
            <Eye className="h-3.5 w-3.5 mr-1 text-teal-600" />
            Visualizar PDF
          </Button>

          {activeQuoteId && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                const token = approvalToken || activeQuoteId
                window.open(`/proposta/${token}`, '_blank', 'noopener,noreferrer')
              }}
              className="text-xs text-slate-600 hover:text-teal-700 hidden sm:inline-flex"
            >
              <ExternalLink className="h-3.5 w-3.5 mr-1" />
              Link Aceite
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleSaveDraft}
            disabled={isSaving}
            className="text-xs border-slate-300 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300"
          >
            <Clock className="h-3.5 w-3.5 mr-1 text-slate-500" />
            Salvar Rascunho
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={handleSaveQuote}
            disabled={isSaving}
            className="text-xs font-bold bg-teal-700 hover:bg-teal-600 text-white shadow-xs"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="h-3.5 w-3.5 mr-1" />
                Salvar Alterações
              </>
            )}
          </Button>
        </div>
      </DialogFooter>
    </>
  )
}
