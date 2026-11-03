import { Link } from 'react-router-dom'
import { RotateCcw, AlertTriangle, Printer, Loader2, Check, Copy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/hooks/use-toast'
import { detectBrowserEnvironment } from '@/hooks/useVoiceRecorder'
import type { FieldVisitData } from '@/types/field-visit'

export function VisitAlertsSection({
  visit,
  queryVisitId,
  isLoadingRecord,
  quotaWarning,
  isSendingToCrm,
  handleSendToCrm,
  setIsPdfDialogOpen,
}: {
  visit: FieldVisitData
  queryVisitId: string | null
  isLoadingRecord: boolean
  quotaWarning: string | null
  isSendingToCrm: boolean
  handleSendToCrm: () => void
  setIsPdfDialogOpen: (open: boolean) => void
}) {
  return (
    <>
      {/* Aviso de Navegador Embutido (WhatsApp / Instagram / redes sociais) */}
      {detectBrowserEnvironment().isInAppBrowser && (
        <div className="p-4 rounded-xl bg-amber-500/10 dark:bg-amber-950/50 border-2 border-amber-500/40 text-amber-950 dark:text-amber-200 text-xs space-y-2 shadow-xs animate-in fade-in">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1 flex-1">
              <p className="font-bold text-sm text-amber-950 dark:text-amber-100">
                Abra este link no Chrome ou Safari para gravar voz
              </p>
              <p className="text-xs leading-relaxed text-amber-900/90 dark:text-amber-200/90">
                Você está visualizando a página pelo navegador interno do WhatsApp/Instagram, que
                bloqueia o uso do microfone por questões de segurança. Para gravar seu relato por
                voz:
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-amber-300/60 dark:border-amber-800/60">
            <Button
              type="button"
              size="sm"
              onClick={() => {
                try {
                  navigator.clipboard.writeText(window.location.href)
                  toast({
                    title: 'Link copiado!',
                    description: 'Abra seu navegador Chrome ou Safari e cole o endereço.',
                  })
                } catch {
                  toast({
                    title: 'Copie o link da barra de endereço',
                    description: window.location.href,
                  })
                }
              }}
              className="h-8 text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white shadow-xs"
            >
              <Copy className="h-3.5 w-3.5 mr-1.5" />
              Copiar link da página
            </Button>

            <span className="text-[11px] text-amber-800 dark:text-amber-300">
              Toque nos três pontos ou no ícone de compartilhar e selecione &quot;Abrir no
              navegador&quot;.
            </span>
          </div>
        </div>
      )}

      {/* Aviso de Cota de Armazenamento Excedida */}
      {quotaWarning && (
        <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-3 shadow-xs">
          <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold">Aviso de Armazenamento</p>
            <p className="leading-relaxed">{quotaWarning}</p>
          </div>
        </div>
      )}

      {/* Indicador de carregamento */}
      {isLoadingRecord && (
        <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 flex items-center gap-2 text-xs text-amber-900 dark:text-amber-200 shadow-xs">
          <Loader2 className="h-4 w-4 animate-spin text-amber-600" />
          <span>Carregando dados da visita técnica para edição...</span>
        </div>
      )}

      {/* Banner de Status de Envio ao CRM */}
      {visit.crmStatus === 'enviada' && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 flex items-center justify-between flex-wrap gap-2 text-xs shadow-xs">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
              <Check className="h-4 w-4" />
            </div>
            <div>
              <div className="font-bold text-emerald-900 dark:text-emerald-200 flex items-center gap-2">
                <span>Enviado ao CRM Intertermal</span>
                <Badge className="bg-emerald-700 text-white text-[9px] font-mono">
                  ID: {visit.backendRecordId?.slice(0, 8)}...
                </Badge>
                {queryVisitId && (
                  <Badge
                    variant="outline"
                    className="text-[9px] bg-amber-50 text-amber-800 border-amber-300"
                  >
                    Modo Edição
                  </Badge>
                )}
              </div>
              <div className="text-[11px] text-emerald-700 dark:text-emerald-300 mt-0.5">
                {visit.lastSentAt
                  ? `Último envio sincronizado em: ${new Date(visit.lastSentAt).toLocaleString('pt-BR')}`
                  : 'Registro sincronizado com o banco de dados.'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link to="/visitas-recebidas">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 text-xs border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Ver Visitas Recebidas
              </Button>
            </Link>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsPdfDialogOpen(true)}
              className="h-8 text-xs border-emerald-300 text-emerald-800 dark:border-emerald-700 dark:text-emerald-300 hover:bg-emerald-100/60"
            >
              <Printer className="h-3.5 w-3.5 mr-1" />
              Resumo PDF
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSendToCrm}
              disabled={isSendingToCrm}
              className="h-8 text-xs font-semibold bg-emerald-700 hover:bg-emerald-600 text-white"
            >
              {isSendingToCrm ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
              ) : (
                <RotateCcw className="h-3.5 w-3.5 mr-1" />
              )}
              Salvar Alterações
            </Button>
          </div>
        </div>
      )}
    </>
  )
}
