import { Link } from 'react-router-dom'
import {
  ArrowLeft,
  CheckCircle2,
  RotateCcw,
  Sparkles,
  FileText,
  Send,
  Printer,
  Loader2,
  Check,
  CloudOff,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { FieldVisitData } from '@/types/field-visit'

export function VisitPageHeader({
  sellerMode,
  saveStatus,
  isAiLoading,
  isSendingToCrm,
  visit,
  handleAiAnalysis,
  handleSendToCrm,
  setIsPdfDialogOpen,
  setIsNewVisitDialogOpen,
  mediaStatus,
  onRetryMedia,
}: {
  sellerMode: boolean
  saveStatus: 'saved' | 'saving'
  isAiLoading: boolean
  isSendingToCrm: boolean
  visit: FieldVisitData
  handleAiAnalysis: () => void
  handleSendToCrm: () => void
  setIsPdfDialogOpen: (open: boolean) => void
  setIsNewVisitDialogOpen: (open: boolean) => void
  mediaStatus?: { uploading: number; pending: number }
  onRetryMedia?: () => void
}) {
  return (
    <>
      {/* Top Header Mobile-First */}
      <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {sellerMode ? (
              <button
                type="button"
                onClick={() => {
                  window.location.href = '/visita-vendedor?lista=1'
                }}
                className="inline-flex items-center justify-center h-10 w-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-teal-50 hover:text-teal-700 transition-colors"
                title="Minhas visitas"
              >
                <FileText className="h-5 w-5" />
              </button>
            ) : (
              <Link
                to="/"
                className="inline-flex items-center justify-center h-10 w-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-teal-50 hover:text-teal-700 transition-colors"
                title="Voltar ao Painel Geral"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
            )}
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-sm tracking-tight text-teal-800 dark:text-teal-400">
                  INTERTERMAL
                </span>
                <span className="text-[10px] bg-teal-100 dark:bg-teal-900/60 text-teal-800 dark:text-teal-300 font-bold px-1.5 py-0.2 rounded">
                  BERMO
                </span>
              </div>
              <h1 className="text-base font-bold text-slate-900 dark:text-slate-100 leading-tight">
                Visita a campo
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Status no topo: Salvo no celular / Enviado ao CRM / Não enviado (tocar p/ reenviar) */}
            {(() => {
              const uploading = mediaStatus?.uploading || 0
              const pending = mediaStatus?.pending || 0
              if (uploading > 0) {
                return (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-800">
                    <Loader2 className="h-3 w-3 animate-spin text-teal-600" />
                    <span className="hidden md:inline">Enviando {uploading} arquivo(s)...</span>
                  </div>
                )
              }
              if (pending > 0) {
                return (
                  <button
                    type="button"
                    onClick={onRetryMedia}
                    title="Reenviar arquivos ao CRM"
                    className="flex items-center gap-1.5 text-xs px-2 py-1 rounded-full bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-900 transition-colors"
                  >
                    <CloudOff className="h-3 w-3" />
                    <span className="hidden md:inline font-semibold">
                      Não enviado — tocar para reenviar ({pending})
                    </span>
                    <span className="md:hidden font-semibold">{pending}</span>
                  </button>
                )
              }
              if (visit.crmStatus === 'enviada') {
                return (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-800">
                    <CheckCircle2 className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                    <span className="hidden md:inline font-medium text-emerald-700 dark:text-emerald-400">
                      Enviado ao CRM ✔
                    </span>
                  </div>
                )
              }
              return (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-800">
                  {saveStatus === 'saving' ? (
                    <>
                      <RotateCcw className="h-3 w-3 animate-spin text-amber-500" />
                      <span className="hidden md:inline">Salvando...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                      <span className="hidden md:inline font-medium text-emerald-700 dark:text-emerald-400">
                        Salvo no celular
                      </span>
                    </>
                  )}
                </div>
              )
            })()}

            {/* Botão Análise IA */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAiAnalysis}
              disabled={isAiLoading}
              className="text-xs h-9 border-violet-300 dark:border-violet-800 text-violet-800 dark:text-violet-300 hover:bg-violet-50 dark:hover:bg-violet-950 font-semibold"
              title="Gerar plano de ação com IA a partir das observações e dados registrados"
            >
              {isAiLoading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                  Analisando...
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5 mr-1 text-violet-600" />
                  <span className="hidden sm:inline">Análise </span>IA
                </>
              )}
            </Button>

            {/* Botão Gerar PDF Resumo */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsPdfDialogOpen(true)}
              className="text-xs h-9 border-teal-300 dark:border-teal-800 text-teal-800 dark:text-teal-300 hover:bg-teal-50 dark:hover:bg-teal-950 font-semibold"
              title="Gerar visualização e PDF da visita em formato A4"
            >
              <Printer className="h-3.5 w-3.5 mr-1 text-teal-600" />
              <span className="hidden sm:inline">Resumo em </span>PDF
            </Button>

            {/* Botão Enviar ao CRM (Topo) */}
            <Button
              type="button"
              size="sm"
              onClick={handleSendToCrm}
              disabled={isSendingToCrm}
              className={`text-xs h-9 font-bold px-3 shadow-xs ${
                visit.crmStatus === 'enviada'
                  ? 'bg-emerald-700 hover:bg-emerald-600 text-white'
                  : 'bg-teal-700 hover:bg-teal-600 text-white'
              }`}
              title={
                visit.crmStatus === 'enviada'
                  ? 'Reenviar alterações ao CRM'
                  : 'Enviar relatório da visita ao CRM'
              }
            >
              {isSendingToCrm ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                  Enviando...
                </>
              ) : visit.crmStatus === 'enviada' ? (
                <>
                  <Check className="h-3.5 w-3.5 mr-1" />
                  Reenviar CRM
                </>
              ) : (
                <>
                  <Send className="h-3.5 w-3.5 mr-1" />
                  Enviar CRM
                </>
              )}
            </Button>

            {/* Botão Nova Visita */}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsNewVisitDialogOpen(true)}
              className="text-xs h-9 text-slate-500 hover:bg-rose-50 hover:text-rose-700 px-2"
              title="Iniciar nova visita em branco"
            >
              <RotateCcw className="h-3.5 w-3.5 sm:mr-1" />
              <span className="hidden sm:inline">Nova</span>
            </Button>
          </div>
        </div>
      </header>
    </>
  )
}
