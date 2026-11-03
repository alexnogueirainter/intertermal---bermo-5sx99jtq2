import { Info, Send, Printer, Loader2, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { VoiceDiagnosticFooter } from '@/components/VoiceDiagnosticFooter'
import type { FieldVisitData } from '@/types/field-visit'

export function SendFooterSection({
  visit,
  handleSendToCrm,
  isSendingToCrm,
  setIsPdfDialogOpen,
}: {
  visit: FieldVisitData
  handleSendToCrm: () => void
  isSendingToCrm: boolean
  setIsPdfDialogOpen: (open: boolean) => void
}) {
  return (
    <>
      {/* Bloco de Envio Grande no Rodapé */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border-2 border-teal-600/30 dark:border-teal-700/40 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Send className="h-4 w-4 text-teal-700 dark:text-teal-400" />
              Finalizar Atendimento & Sincronizar com o CRM
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Gera o registro oficial da visita, envia o plano de ação e dados levantados ao CRM e
              gera o PDF completo.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={() => setIsPdfDialogOpen(true)}
              className="h-11 px-4 text-xs font-bold border-teal-300 dark:border-teal-700 text-teal-800 dark:text-teal-300 hover:bg-teal-50"
            >
              <Printer className="h-4 w-4 mr-1.5 text-teal-600" />
              Gerar Resumo em PDF
            </Button>

            <Button
              type="button"
              size="lg"
              onClick={handleSendToCrm}
              disabled={isSendingToCrm}
              className={`h-11 px-6 text-xs font-bold shadow-sm ${
                visit.crmStatus === 'enviada'
                  ? 'bg-emerald-700 hover:bg-emerald-600 text-white'
                  : 'bg-teal-700 hover:bg-teal-600 text-white'
              }`}
            >
              {isSendingToCrm ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enviando ao CRM...
                </>
              ) : visit.crmStatus === 'enviada' ? (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Reenviar ao CRM
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Enviar a Visita ao CRM
                </>
              )}
            </Button>
          </div>
        </div>

        {visit.lastSentAt && (
          <div className="text-[11px] text-muted-foreground pt-1 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span>Rascunho local vinculado ao CRM.</span>
            <span className="font-medium text-emerald-700 dark:text-emerald-400">
              Sincronizado em {new Date(visit.lastSentAt).toLocaleString('pt-BR')}
            </span>
          </div>
        )}
      </div>

      {/* Rodapé informativo */}
      <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-muted-foreground space-y-1">
        <div className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-300">
          <Info className="h-4 w-4 text-teal-700 dark:text-teal-400" />
          Armazenamento Seguro em Campo
        </div>
        <p>
          Todos os dados digitados e fotos ficam guardados no seu celular (armazenamento local).
          Você pode fechar a tela, abrir outra aba ou reiniciar o aparelho que as informações
          continuarão salvas aqui mesmo após enviar ao CRM.
        </p>
      </div>

      {/* Diagnóstico visível temporário para validação em campo */}
      <div className="pt-2">
        <VoiceDiagnosticFooter />
      </div>
    </>
  )
}
