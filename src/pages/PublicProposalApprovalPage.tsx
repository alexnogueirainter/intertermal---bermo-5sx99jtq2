import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { quotesService } from '@/services/quotes'
import { generateAndUploadQuotePdf } from '@/lib/quote-pdf-generator'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Flame,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  Building2,
  Calendar,
  Layers,
  Wrench,
  Download,
  AlertTriangle,
  FileCheck,
  Check,
  Printer,
  Sparkles,
} from 'lucide-react'

export const PublicProposalApprovalPage: React.FC = () => {
  const { token } = useParams<{ token: string }>()
  const [loading, setLoading] = useState(true)
  const [quote, setQuote] = useState<any | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Modais de Aprovação e Reprovação
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false)
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false)
  const [clientApproverName, setClientApproverName] = useState('')
  const [rejectReason, setRejectReason] = useState('')
  const [submittingAction, setSubmittingAction] = useState(false)
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null)

  const loadProposal = async () => {
    if (!token) {
      setError('Token de proposta não especificado.')
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    try {
      const res = await quotesService.getPublicProposal(token)
      if (res.success && res.quote) {
        setQuote(res.quote)
      } else {
        setError(res.error || 'Não foi possível carregar a proposta com o token fornecido.')
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao conectar ao servidor de propostas.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProposal()
  }, [token])

  // Notificar outros componentes/abas sobre alteração no status da proposta
  const notifyProposalChange = (
    status: 'approved' | 'rejected',
    extraData?: Record<string, any>,
  ) => {
    const quoteId = quote?.id
    const payload = {
      type: 'PROPOSAL_STATUS_CHANGED',
      quoteId,
      status,
      timestamp: Date.now(),
      ...extraData,
    }

    try {
      window.dispatchEvent(new CustomEvent('intertermal:proposal-updated', { detail: payload }))
    } catch {
      /* intentionally ignored */
    }

    try {
      if (typeof BroadcastChannel !== 'undefined') {
        const bc = new BroadcastChannel('intertermal_proposals_channel')
        bc.postMessage(payload)
        bc.close()
      }
    } catch {
      /* intentionally ignored */
    }
  }

  const handleApprove = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!clientApproverName.trim()) return

    setSubmittingAction(true)
    try {
      const approverName = clientApproverName.trim()

      // Tenta gerar e subir o PDF oficial da proposta a partir do documento renderizado na tela pública
      try {
        const docEl =
          document.querySelector('main') || document.querySelector('.max-w-4xl') || document.body
        if (docEl && quote?.id) {
          await generateAndUploadQuotePdf(quote, docEl as HTMLElement)
        }
      } catch (pdfErr) {
        console.warn('PDF não gerado previamente no fluxo público:', pdfErr)
      }

      const res = await quotesService.actionPublicProposal(token!, 'approve', {
        client_name: approverName,
      })
      if (res.success) {
        notifyProposalChange('approved', { client_name: approverName })
        setActionSuccessMessage(
          res.message || 'Proposta aprovada com sucesso! A Ordem de Serviço foi emitida.',
        )
        setIsApproveModalOpen(false)
        await loadProposal()
      } else {
        alert(res.error || 'Erro ao aprovar proposta.')
      }
    } catch (err: any) {
      alert(err.message || 'Erro ao processar aprovação.')
    } finally {
      setSubmittingAction(false)
    }
  }

  const handleReject = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmittingAction(true)
    try {
      const reasonText = rejectReason.trim() || 'Sem motivo detalhado'
      const res = await quotesService.actionPublicProposal(token!, 'reject', {
        reason: reasonText,
      })
      if (res.success) {
        notifyProposalChange('rejected', { reason: reasonText })
        setActionSuccessMessage(
          res.message || 'Proposta marcada como reprovada. Entraremos em contato para ajustes.',
        )
        setIsRejectModalOpen(false)
        await loadProposal()
      } else {
        alert(res.error || 'Erro ao reprovar proposta.')
      }
    } catch (err: any) {
      alert(err.message || 'Erro ao processar ação.')
    } finally {
      setSubmittingAction(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-teal-700 flex items-center justify-center text-white animate-pulse shadow-lg shadow-teal-500/20">
            <Flame className="h-6 w-6" />
          </div>
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            Carregando Proposta Técnica Intertermal...
          </p>
        </div>
      </div>
    )
  }

  if (error || !quote) {
    return (
      <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
        <Card className="max-w-md w-full p-6 text-center shadow-lg border-rose-200 dark:border-rose-900 bg-white dark:bg-slate-900 space-y-4">
          <div className="h-12 w-12 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 mx-auto flex items-center justify-center">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Proposta não Encontrada
            </h2>
            <p className="text-xs text-muted-foreground mt-1">{error}</p>
          </div>
          <p className="text-xs text-slate-500">
            Verifique o link recebido por e-mail ou entre em contato com a equipe Intertermal.
          </p>
        </Card>
      </div>
    )
  }

  const isApproved = quote.status === 'approved' || Boolean(quote.approved_by_client_name)
  const isRejected = quote.status === 'rejected'

  const formattedTotal = Number(quote.final_price || quote.total || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 py-8 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Banner de Mensagem de Ação Realizada */}
        {actionSuccessMessage && (
          <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-100 flex items-center gap-3 shadow-sm">
            <CheckCircle2 className="h-6 w-6 text-emerald-600 shrink-0" />
            <div className="text-xs font-semibold">{actionSuccessMessage}</div>
          </div>
        )}

        {/* Status de Aceite Atual */}
        {isApproved && (
          <div className="p-4 rounded-xl bg-emerald-500 text-white flex items-center justify-between shadow-md">
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-7 w-7 shrink-0" />
              <div>
                <h3 className="text-sm font-bold">Proposta Aprovada Digitalmente</h3>
                <p className="text-xs text-emerald-100">
                  Aceite registrado por{' '}
                  <strong>{quote.approved_by_client_name || 'Cliente'}</strong> em{' '}
                  {quote.approved_by_client_date
                    ? new Date(quote.approved_by_client_date).toLocaleString('pt-BR')
                    : 'data registrada'}
                  .
                </p>
              </div>
            </div>
            <Badge className="bg-white text-emerald-800 text-xs px-2.5 py-1 font-bold">
              OS Em Produção
            </Badge>
          </div>
        )}

        {isRejected && (
          <div className="p-4 rounded-xl bg-rose-600 text-white flex items-center justify-between shadow-md">
            <div className="flex items-center gap-3">
              <XCircle className="h-7 w-7 shrink-0" />
              <div>
                <h3 className="text-sm font-bold">Proposta Reprovada</h3>
                <p className="text-xs text-rose-100">
                  Motivo: {quote.rejected_by_client_reason || 'Revisão solicitada pelo cliente'}.
                </p>
              </div>
            </div>
            <Badge className="bg-white text-rose-800 text-xs px-2.5 py-1 font-bold">
              Aguardando Ajustes
            </Badge>
          </div>
        )}

        {/* Documento Principal da Proposta Técnica */}
        <Card className="shadow-lg border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
          {/* Header Corporativo BERMO / Intertermal */}
          <div className="bg-gradient-to-r from-teal-900 via-teal-800 to-slate-900 text-white p-6 sm:p-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-3.5">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-tr from-teal-500 to-emerald-400 flex items-center justify-center text-slate-950 font-bold shadow-md">
                <Flame className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-xl font-black tracking-tight leading-none">INTERTERMAL</h1>
                <p className="text-xs text-teal-300 font-semibold tracking-wider uppercase mt-1">
                  Soluções Térmicas & Engenharia Oficial BERMO
                </p>
              </div>
            </div>

            <div className="text-left sm:text-right">
              <span className="text-[11px] font-mono text-teal-300 block">PROPOSTA COMERCIAL</span>
              <span className="text-lg font-mono font-black text-white">
                #{quote.quote_number || quote.code}
              </span>
              <div className="text-[11px] text-teal-200 mt-0.5">
                Validade: {quote.validity_days || 10} dias
              </div>
            </div>
          </div>

          <CardContent className="p-6 sm:p-8 space-y-6">
            {/* Seção 1: Dados do Cliente e Responsável */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200/80 dark:border-slate-800 text-xs">
              <div className="space-y-1">
                <span className="text-muted-foreground font-semibold block text-[11px] uppercase tracking-wider">
                  Cliente / Empresa
                </span>
                <strong className="text-sm text-slate-900 dark:text-slate-100 block">
                  {quote.client_name}
                </strong>
                {quote.client_document && (
                  <span className="text-muted-foreground block font-mono">
                    CNPJ: {quote.client_document}
                  </span>
                )}
              </div>

              <div className="space-y-1">
                <span className="text-muted-foreground font-semibold block text-[11px] uppercase tracking-wider">
                  Especialista Técnico BERMO
                </span>
                <strong className="text-sm text-slate-900 dark:text-slate-100 block">
                  {quote.assigned_to || 'Alex Nogueira'}
                </strong>
                <span className="text-muted-foreground block">
                  alex.nogueira@intertermal.com.br
                </span>
              </div>
            </div>

            {/* Seção 2: Especificações Técnicas do Equipamento */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-teal-800 dark:text-teal-400 flex items-center gap-1.5 border-b pb-1">
                <Layers className="h-4 w-4" />
                1. Especificações Técnicas dos Equipamentos BERMO
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
                  <span className="text-muted-foreground text-[10px] block">Modelo:</span>
                  <strong className="text-slate-900 dark:text-slate-100">
                    {quote.equipment_model || 'Trocador BERMO BP'}
                  </strong>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
                  <span className="text-muted-foreground text-[10px] block">Nº de Placas:</span>
                  <strong className="text-slate-900 dark:text-slate-100">
                    {quote.plate_count || 'Conforme projeto'} un
                  </strong>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
                  <span className="text-muted-foreground text-[10px] block">Material Placas:</span>
                  <strong className="text-slate-900 dark:text-slate-100">
                    {quote.plate_material || 'AISI 316L / Titânio'}
                  </strong>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
                  <span className="text-muted-foreground text-[10px] block">
                    Gaxetas / Vedação:
                  </span>
                  <strong className="text-slate-900 dark:text-slate-100">
                    {quote.gasket_material || 'EPDM / NBR'}
                  </strong>
                </div>
              </div>
            </div>

            {/* Seção 3: Escopo de Serviços & Itens */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-teal-800 dark:text-teal-400 flex items-center gap-1.5 border-b pb-1">
                <Wrench className="h-4 w-4" />
                2. Escopo de Fornecimento & Procedimentos de Manutenção
              </h3>

              {quote.items && Array.isArray(quote.items) && quote.items.length > 0 ? (
                <div className="border rounded-lg overflow-hidden border-slate-200 dark:border-slate-800">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-semibold uppercase">
                      <tr>
                        <th className="p-2.5">Descrição do Serviço / Peça</th>
                        <th className="p-2.5 text-center">Qtd</th>
                        <th className="p-2.5 text-right">Valor</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {quote.items.map((it: any, idx: number) => (
                        <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50">
                          <td className="p-2.5 font-medium text-slate-900 dark:text-slate-100">
                            {it.description || it.service_name || 'Procedimento técnico'}
                          </td>
                          <td className="p-2.5 text-center font-mono">{it.quantity || 1}</td>
                          <td className="p-2.5 text-right font-mono font-semibold">
                            {(it.unit_price || it.price || 0).toLocaleString('pt-BR', {
                              style: 'currency',
                              currency: 'BRL',
                            })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-950 border text-xs text-slate-700 dark:text-slate-300">
                  <p className="font-semibold mb-1">
                    Manutenção e Revisão Geral de Trocador de Calor:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>Desmontagem técnica em campo e inspeção visual das placas.</li>
                    <li>Limpeza química desincrustante CIP e banho térmico ultra-som.</li>
                    <li>
                      Teste de estanqueidade por líquido penetrante para detecção de microfissuras.
                    </li>
                    <li>Instalação de novas gaxetas padrão original BERMO.</li>
                    <li>
                      Fechamento com torque controlado e teste hidrostático com emissão de laudo.
                    </li>
                  </ul>
                </div>
              )}
            </div>

            {/* Seção 4: Condições Comerciais & Total */}
            <div className="p-4 rounded-xl bg-teal-50/60 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1 text-xs">
                <span className="font-bold text-teal-950 dark:text-teal-200 block">
                  Condições de Pagamento:
                </span>
                <span className="text-slate-700 dark:text-slate-300">
                  {quote.payment_terms || '28 DDL faturado após entrega técnica'}
                </span>
                <span className="text-muted-foreground block text-[11px]">
                  Impostos inclusos conforme regime tributário nacional.
                </span>
              </div>

              <div className="text-left sm:text-right">
                <span className="text-[11px] text-muted-foreground uppercase font-bold block">
                  Valor Total da Proposta
                </span>
                <span className="text-2xl font-black text-teal-800 dark:text-teal-300">
                  {formattedTotal}
                </span>
              </div>
            </div>

            {/* Seção de Botões de Ação para o Cliente (Aceite Digital) */}
            {!isApproved && !isRejected && (
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsRejectModalOpen(true)}
                  className="w-full sm:w-auto text-rose-600 border-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950 text-xs font-semibold"
                >
                  <XCircle className="h-4 w-4 mr-1.5" /> Solicitar Ajustes / Reprovar
                </Button>

                <Button
                  type="button"
                  onClick={() => setIsApproveModalOpen(true)}
                  className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm px-6 py-2.5 shadow-md"
                >
                  <Check className="h-4 w-4 mr-1.5" /> Aprovar Proposta & Gerar Ordem de Serviço
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Rodapé Seguro */}
        <div className="text-center text-xs text-muted-foreground space-y-1">
          <p>
            Intertermal Engenharia Térmica • Representante e Assistência Técnica Autorizada BERMO
          </p>
          <p className="text-[10px]">
            Documento de aceite com registro criptográfico de token único. Nenhuma senha necessária.
          </p>
        </div>
      </div>

      {/* Modal de Confirmação de Aprovação Digital pelo Cliente */}
      <Dialog open={isApproveModalOpen} onOpenChange={setIsApproveModalOpen}>
        <DialogContent className="sm:max-w-[460px]">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2 text-emerald-800 dark:text-emerald-300">
              <ShieldCheck className="h-5 w-5 text-emerald-600" />
              Aprovação Digital da Proposta #{quote.quote_number || quote.code}
            </DialogTitle>
            <CardDescription className="text-xs">
              Ao confirmar, seu aceite será registrado oficialmente no CRM da Intertermal e a Ordem
              de Serviço será gerada para execução técnica.
            </CardDescription>
          </DialogHeader>

          <form onSubmit={handleApprove} className="space-y-4 py-2 text-xs">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Seu Nome Completo (Responsável pelo Aceite) *
              </Label>
              <Input
                required
                placeholder="Ex: Carlos Eduardo de Oliveira"
                value={clientApproverName}
                onChange={(e) => setClientApproverName(e.target.value)}
                className="text-xs h-9"
              />
              <p className="text-[10px] text-muted-foreground">
                Este nome será gravado com carimbo de data/hora oficial no laudo técnico.
              </p>
            </div>

            <div className="p-3 bg-emerald-50/60 dark:bg-emerald-950/40 rounded-lg border border-emerald-200 dark:border-emerald-800 text-[11px] text-emerald-900 dark:text-emerald-200 space-y-1">
              <p className="font-semibold">Resumo do Aceite:</p>
              <p>
                • Valor Autorizado: <strong>{formattedTotal}</strong>
              </p>
              <p>
                • Condição: <strong>{quote.payment_terms || '28 DDL'}</strong>
              </p>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsApproveModalOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={submittingAction || !clientApproverName.trim()}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
              >
                {submittingAction ? 'Registrando...' : 'Confirmar e Emitir OS'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal de Reprovação / Solicitação de Ajustes */}
      <Dialog open={isRejectModalOpen} onOpenChange={setIsRejectModalOpen}>
        <DialogContent className="sm:max-w-[460px]">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2 text-rose-800 dark:text-rose-300">
              <XCircle className="h-5 w-5 text-rose-600" />
              Solicitar Ajustes na Proposta
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleReject} className="space-y-4 py-2 text-xs">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Motivo / Ajustes Necessários
              </Label>
              <Textarea
                rows={3}
                placeholder="Ex: Necessário estender prazo de pagamento para 45 DDL ou incluir mais um jogo de gaxetas..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="text-xs"
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsRejectModalOpen(false)}
              >
                Voltar
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={submittingAction}
                className="bg-rose-600 hover:bg-rose-500 text-white font-bold"
              >
                {submittingAction ? 'Enviando...' : 'Enviar Solicitação'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
