import { getStatusBadge } from './QuoteStatusBadge'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { QuoteRecord, QuoteStatus } from '@/types/crm'
import { Calculator, CheckCheck, Eye, FileText, Layers } from 'lucide-react'

interface EditorDialogHeaderProps {
  activeQuoteId: string | null
  quoteNumber: string
  status: QuoteStatus
  lastSavedAt: string | null
  getFormDataObject: () => Partial<QuoteRecord>
  handleOpenPdfPreview: (quoteObj: QuoteRecord, mode: 'client' | 'internal') => any
}

export function EditorDialogHeader(props: EditorDialogHeaderProps) {
  const {
    activeQuoteId,
    quoteNumber,
    status,
    lastSavedAt,
    getFormDataObject,
    handleOpenPdfPreview,
  } = props

  return (
    <>
      <DialogHeader className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 sticky top-0 z-10 backdrop-blur-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pr-6">
          <div>
            <DialogTitle className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Calculator className="h-5 w-5 text-teal-600" />
              Editar Proposta
            </DialogTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              {quoteNumber
                ? `Orçamento nº #${quoteNumber}`
                : 'Orçamento de Serviços e Equipamentos'}{' '}
              — Layout integral unificado (5 seções).
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                const currentObj = getFormDataObject() as QuoteRecord
                handleOpenPdfPreview({ ...currentObj, id: activeQuoteId || 'draft' }, 'client')
              }}
              className="text-xs border-teal-300 text-teal-700 hover:bg-teal-50"
            >
              <FileText className="h-3.5 w-3.5 mr-1" />
              Proposta do Cliente
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                const currentObj = getFormDataObject() as QuoteRecord
                handleOpenPdfPreview({ ...currentObj, id: activeQuoteId || 'draft' }, 'internal')
              }}
              className="text-xs border-indigo-300 text-indigo-700 hover:bg-indigo-50"
            >
              <Layers className="h-3.5 w-3.5 mr-1" />
              Composição Interna
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                const currentObj = getFormDataObject() as QuoteRecord
                handleOpenPdfPreview({ ...currentObj, id: activeQuoteId || 'draft' }, 'client')
              }}
              className="text-xs border-slate-300 text-slate-700 hover:bg-slate-50"
            >
              <Eye className="h-3.5 w-3.5 mr-1" />
              Visualizar PDF
            </Button>

            <Badge
              variant="outline"
              className="text-[11px] font-mono text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 gap-1"
            >
              <CheckCheck className="h-3 w-3" />
              {lastSavedAt
                ? `✓ Salvo em ${new Date(lastSavedAt).toLocaleDateString('pt-BR')} às ${new Date(
                    lastSavedAt,
                  ).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
                : '✓ Salvo em ' +
                  new Date().toLocaleDateString('pt-BR') +
                  ' às ' +
                  new Date().toLocaleTimeString('pt-BR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
            </Badge>

            {activeQuoteId && getStatusBadge(status)}
          </div>
        </div>
      </DialogHeader>
    </>
  )
}
