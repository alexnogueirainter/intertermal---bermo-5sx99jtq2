import React, { useState } from 'react'
import {
  Mail,
  Sparkles,
  ArrowRight,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ExternalLink,
  Plus,
  Send,
  Building,
  MapPin,
  Wrench,
  Info,
  Calendar,
  AlertCircle,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { InboundQuoteEmailRecord, QuoteRecord, ClientRecord } from '@/types/crm'
import {
  inboundQuoteEmailsService,
  INBOUND_QUOTE_DEFAULT_SECRET,
} from '@/services/inbound-quote-emails'
import { useToast } from '@/hooks/use-toast'

export interface InboundQuoteEmailsTabProps {
  inboundEmails: InboundQuoteEmailRecord[]
  quotes: QuoteRecord[]
  clients: ClientRecord[]
  isLoading?: boolean
  onRefresh: () => void
  onOpenEditQuote: (quote: QuoteRecord) => void
  onQuoteCreatedFromInbound?: (quoteId: string) => void
}

export function InboundQuoteEmailsTab({
  inboundEmails = [],
  quotes = [],
  clients = [],
  isLoading = false,
  onRefresh,
  onOpenEditQuote,
  onQuoteCreatedFromInbound,
}: InboundQuoteEmailsTabProps) {
  const { toast } = useToast()
  const [isManualModalOpen, setIsManualModalOpen] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [selectedEmailForDetails, setSelectedEmailForDetails] =
    useState<InboundQuoteEmailRecord | null>(null)

  // Campos do formulário manual de colagem de e-mail
  const [senderInput, setSenderInput] = useState('')
  const [subjectInput, setSubjectInput] = useState('')
  const [bodyInput, setBodyInput] = useState('')

  // Exemplo de preenchimento rápido para demonstração / testes
  const handleLoadSample = () => {
    setSenderInput('compras@laticiniosbomgosto.com.br')
    setSubjectInput('ENC: Cotação Urgente Manutenção Trocador de Placas BP50')
    setBodyInput(`Prezados,

Encaminho cotação de manutenção preventiva e higienização para o nosso trocador de calor de placas BERMO modelo BP-50.
Precisamos de abertura, limpeza química das placas por recirculação, substituição do jogo de gaxetas em EPDM e teste hidrostático com emissão de laudo técnico.

Dados da planta:
Empresa: Laticínios Bom Gosto S/A
Contato: Eng. Roberto Vasconcelos
WhatsApp: (19) 98765-4321
Local da fábrica: Rodovia SP-340, km 154 - Mogi Mirim / SP - CEP: 13800-970
Prazo desejado: Parada programada de fábrica prevista para o próximo dia 15.

Favor enviar proposta comercial com estimativa de deslocamento e equipe técnica.

Atenciosamente,
Roberto Vasconcelos
Gerente de Manutenção Industrial`)
  }

  const handleSubmitManualEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!subjectInput.trim() || !bodyInput.trim()) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Informe pelo menos o assunto e o corpo do e-mail encaminhado.',
        variant: 'destructive',
      })
      return
    }

    setIsProcessing(true)
    try {
      const res = await inboundQuoteEmailsService.processInboundEmail({
        subject: subjectInput.trim(),
        body: bodyInput.trim(),
        sender: senderInput.trim() || 'usuario@intertermal.com.br',
        original_sender: senderInput.trim(),
        recipient: 'orcamentos@intertermal.com.br',
      })

      if (res.success && res.quote_id) {
        toast({
          title: 'Rascunho gerado com sucesso!',
          description: `Proposta ${res.quote_number || ''} criada e vinculada a ${res.client?.name || 'Cliente'}. Pronto para revisão humana.`,
        })

        // Limpa formulário
        setSenderInput('')
        setSubjectInput('')
        setBodyInput('')
        setIsManualModalOpen(false)

        // Atualiza a listagem
        onRefresh()

        if (onQuoteCreatedFromInbound && res.quote_id) {
          onQuoteCreatedFromInbound(res.quote_id)
        }

        // Se localizarmos a proposta recém-criada, podemos abrir imediatamente para revisão
        const targetQuote = quotes.find((q) => q.id === res.quote_id)
        if (targetQuote) {
          onOpenEditQuote(targetQuote)
        }
      } else {
        toast({
          title: 'Atenção ao processar e-mail',
          description: res.message || 'E-mail registrado, mas verifique os avisos.',
          variant: 'destructive',
        })
        onRefresh()
      }
    } catch (err: any) {
      toast({
        title: 'Erro no processamento',
        description: err?.message || 'Falha ao acionar IA de extração de cotações.',
        variant: 'destructive',
      })
    } finally {
      setIsProcessing(false)
    }
  }

  // Estatísticas rápidas
  const countRecebidos = inboundEmails.filter((e) => e.status === 'recebido').length
  const countRascunhos = inboundEmails.filter((e) => e.status === 'rascunho_criado').length
  const countRevisados = inboundEmails.filter((e) => e.status === 'revisado').length

  const handleMarkAsReviewed = async (record: InboundQuoteEmailRecord) => {
    const ok = await inboundQuoteEmailsService.updateStatus(record.id, 'revisado')
    if (ok) {
      toast({
        title: 'Status atualizado',
        description: 'A cotação foi marcada como revisada pela equipe.',
      })
      onRefresh()
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Banner Informativo & Ações */}
      <div className="bg-gradient-to-r from-teal-900/90 via-slate-900 to-slate-950 p-6 rounded-2xl border border-teal-800/40 text-white shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-teal-500/20 text-teal-300 text-xs font-semibold border border-teal-500/30">
              <Sparkles className="h-3.5 w-3.5 text-teal-400" />
              Triagem de Cotações por IA Intertermal
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <Mail className="h-6 w-6 text-teal-400" />
              Cotações Recebidas por E-mail → Rascunho
            </h2>
            <p className="text-xs sm:text-sm text-slate-300">
              Receba e-mails de clientes encaminhados pela equipe comercial ou cole o texto
              livremente. A IA extrai cliente, modelo BERMO, localização e escopo, criando o
              rascunho da proposta para conferência e ajuste fino de margens e deslocamento.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={isLoading}
              className="bg-white/10 hover:bg-white/20 text-white border-white/20 h-9"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>

            <Button
              onClick={() => setIsManualModalOpen(true)}
              className="bg-teal-600 hover:bg-teal-500 text-white font-semibold shadow-sm h-9"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nova Cotação por E-mail
            </Button>
          </div>
        </div>
      </div>

      {/* Mini Cards de Métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-slate-200 dark:border-slate-800">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                Rascunhos para Revisão Humana
              </p>
              <h3 className="text-2xl font-bold text-amber-600 mt-1">{countRascunhos}</h3>
            </div>
            <div className="p-3 bg-amber-500/10 rounded-xl">
              <Clock className="h-5 w-5 text-amber-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                Revisadas / Finalizadas
              </p>
              <h3 className="text-2xl font-bold text-emerald-600 mt-1">{countRevisados}</h3>
            </div>
            <div className="p-3 bg-emerald-500/10 rounded-xl">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                Total de E-mails Registrados
              </p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
                {inboundEmails.length}
              </h3>
            </div>
            <div className="p-3 bg-blue-500/10 rounded-xl">
              <Mail className="h-5 w-5 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de E-mails de Cotação Recebidos */}
      <Card className="border-slate-200 dark:border-slate-800">
        <CardHeader className="p-4 pb-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Mail className="h-4 w-4 text-teal-600" />
                Histórico e Trilha de Cotações Recebidas
              </CardTitle>
              <CardDescription className="text-xs">
                Acompanhe o status de extração, cliente associado, rascunho de proposta e avisos de
                campos faltantes.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 pt-0">
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 uppercase font-semibold">
                <tr>
                  <th className="p-3">Data / Horário</th>
                  <th className="p-3">Remetente / Assunto</th>
                  <th className="p-3">Cliente Extraído</th>
                  <th className="p-3">Equipamento</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Rascunho Gerado</th>
                  <th className="p-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {inboundEmails.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-muted-foreground">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Mail className="h-8 w-8 text-slate-400" />
                        <p className="font-medium text-slate-700 dark:text-slate-300">
                          Nenhum e-mail de cotação registrado ainda.
                        </p>
                        <p className="text-xs max-w-md">
                          Clique no botão "Nova Cotação por E-mail" para colar o texto de um e-mail
                          encaminhado ou envie diretamente via integração de endpoint.
                        </p>
                        <Button
                          size="sm"
                          onClick={() => setIsManualModalOpen(true)}
                          className="mt-2 bg-teal-600 hover:bg-teal-500 text-white text-xs"
                        >
                          <Plus className="h-3.5 w-3.5 mr-1" />
                          Colar Primeiro E-mail
                        </Button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  inboundEmails.map((item) => {
                    const linkedQuote =
                      item.expand?.quote_id || quotes.find((q) => q.id === item.quote_id)
                    const linkedClient =
                      item.expand?.client_id || clients.find((c) => c.id === item.client_id)
                    const extracted = item.extracted_data || {}
                    const warnings = item.warnings || []

                    return (
                      <tr
                        key={item.id}
                        className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors"
                      >
                        <td className="p-3 whitespace-nowrap text-muted-foreground">
                          <div className="flex items-center gap-1 font-mono text-[11px]">
                            <Calendar className="h-3 w-3" />
                            {item.created
                              ? new Date(item.created).toLocaleDateString('pt-BR', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: '2-digit',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })
                              : '—'}
                          </div>
                        </td>

                        <td className="p-3 max-w-[240px]">
                          <div
                            className="font-semibold text-slate-800 dark:text-slate-200 truncate"
                            title={item.subject}
                          >
                            {item.subject || 'Sem assunto'}
                          </div>
                          <div
                            className="text-[11px] text-muted-foreground truncate"
                            title={item.original_sender || item.sender}
                          >
                            De: {item.original_sender || item.sender || 'Não identificado'}
                          </div>
                        </td>

                        <td className="p-3">
                          <div className="font-medium text-slate-900 dark:text-slate-100 flex items-center gap-1">
                            <Building className="h-3 w-3 text-teal-600 shrink-0" />
                            <span className="truncate max-w-[150px]">
                              {linkedClient?.name ||
                                extracted.client_name ||
                                'Cliente a identificar'}
                            </span>
                          </div>
                          {(extracted.city || extracted.postal_code) && (
                            <div className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                              <MapPin className="h-2.5 w-2.5 text-slate-400" />
                              {extracted.city || 'CEP'}
                              {extracted.state ? `/${extracted.state}` : ''}{' '}
                              {extracted.postal_code ? `(${extracted.postal_code})` : ''}
                            </div>
                          )}
                        </td>

                        <td className="p-3">
                          <div className="font-medium text-slate-800 dark:text-slate-200 flex items-center gap-1">
                            <Wrench className="h-3 w-3 text-slate-500 shrink-0" />
                            <span>{extracted.equipment_model || 'Trocador BERMO'}</span>
                          </div>
                          <div className="text-[10px] text-muted-foreground">
                            {extracted.equipment_brand || 'BERMO'} •{' '}
                            {extracted.equipment_quantity || 1} un
                          </div>
                        </td>

                        <td className="p-3 whitespace-nowrap">
                          {item.status === 'rascunho_criado' && (
                            <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300 text-[10px]">
                              <Clock className="h-2.5 w-2.5 mr-1" />
                              Rascunho Criado
                            </Badge>
                          )}
                          {item.status === 'revisado' && (
                            <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300 text-[10px]">
                              <CheckCircle2 className="h-2.5 w-2.5 mr-1" />
                              Revisado
                            </Badge>
                          )}
                          {item.status === 'recebido' && (
                            <Badge variant="outline" className="text-[10px]">
                              Recebido
                            </Badge>
                          )}
                          {item.status === 'erro' && (
                            <Badge variant="destructive" className="text-[10px]">
                              <AlertCircle className="h-2.5 w-2.5 mr-1" />
                              Erro
                            </Badge>
                          )}

                          {warnings.length > 0 && (
                            <div
                              className="text-[10px] text-amber-600 dark:text-amber-400 mt-1 flex items-center gap-1 cursor-help"
                              title={warnings.join(' • ')}
                            >
                              <AlertTriangle className="h-3 w-3 shrink-0" />
                              <span>{warnings.length} aviso(s)</span>
                            </div>
                          )}
                        </td>

                        <td className="p-3">
                          {linkedQuote ? (
                            <div>
                              <button
                                type="button"
                                onClick={() => onOpenEditQuote(linkedQuote)}
                                className="font-mono font-bold text-teal-700 hover:text-teal-800 dark:text-teal-400 underline flex items-center gap-1"
                              >
                                {linkedQuote.code || linkedQuote.quote_number || 'Ver Proposta'}
                                <ExternalLink className="h-3 w-3" />
                              </button>
                              <div className="text-[10px] text-muted-foreground mt-0.5">
                                Status:{' '}
                                {linkedQuote.status === 'draft' ? 'Rascunho' : linkedQuote.status}
                              </div>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-[11px]">—</span>
                          )}
                        </td>

                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setSelectedEmailForDetails(item)}
                              title="Ver Detalhes do E-mail e Extração"
                              className="h-7 px-2 text-[11px]"
                            >
                              <Info className="h-3.5 w-3.5 mr-1 text-slate-500" />
                              Detalhes
                            </Button>

                            {linkedQuote && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => onOpenEditQuote(linkedQuote)}
                                title="Abrir no editor de orçamentos para revisar valores"
                                className="h-7 px-2 text-[11px] border-teal-300 text-teal-700 hover:bg-teal-50 dark:border-teal-800 dark:text-teal-300 dark:hover:bg-teal-950 font-semibold"
                              >
                                <ArrowRight className="h-3.5 w-3.5 mr-1" />
                                Revisar
                              </Button>
                            )}

                            {item.status === 'rascunho_criado' && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleMarkAsReviewed(item)}
                                title="Marcar cotação como revisada"
                                className="h-7 w-7 p-0 text-emerald-600 hover:bg-emerald-50"
                              >
                                <CheckCircle2 className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* GUIA DE USO E INSTRUÇÕES TÉCNICAS */}
      <Card className="border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Info className="h-4 w-4 text-teal-600" />
            Como Integrar e Usar o Encaminhamento de Cotações
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 text-xs space-y-3 text-slate-600 dark:text-slate-300">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
              <h4 className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <span className="flex items-center justify-center w-4 h-4 rounded-full bg-teal-100 text-teal-800 text-[10px] font-bold">
                  1
                </span>
                Encaminhamento Automático ou Webhook
              </h4>
              <p className="text-[11px] leading-relaxed">
                Configure uma regra no seu cliente de e-mail (Outlook, Gmail ou Exchange) para
                encaminhar pedidos de cotação ou envie via requisição HTTP direta ao endpoint do
                backend:
              </p>
              <div className="p-2 rounded bg-slate-100 dark:bg-slate-800 font-mono text-[10px] text-slate-800 dark:text-slate-200 select-all overflow-x-auto">
                POST /backend/v1/quotes/inbound-email
                <br />
                Header: X-Inbound-Token: {INBOUND_QUOTE_DEFAULT_SECRET}
              </div>
              <p className="text-[10px] text-muted-foreground">
                Exemplo curl disponível nos botões de cópia do sistema para automações via n8n, Make
                ou script de e-mail.
              </p>
            </div>

            <div className="space-y-2 p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
              <h4 className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <span className="flex items-center justify-center w-4 h-4 rounded-full bg-teal-100 text-teal-800 text-[10px] font-bold">
                  2
                </span>
                Fluxo Seguro de Revisão Humana
              </h4>
              <p className="text-[11px] leading-relaxed">
                A IA cria o orçamento com status <strong>Rascunho</strong> sem interferir nos
                valores já aprovados. O usuário responsável abre o formulário da proposta, confere o
                modelo, calcula o deslocamento pela cidade/CEP extraídos e valida a mão de obra
                antes de enviar ao cliente.
              </p>
              <ul className="text-[10px] space-y-1 text-slate-500 list-disc list-inside">
                <li>O cliente é criado automaticamente se ainda não existir.</li>
                <li>O texto original do e-mail fica arquivado no rascunho para auditoria.</li>
                <li>Nenhuma proposta é enviada ao cliente sem aprovação humana expressa.</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* MODAL 1: COLAR MANUALMENTE O TEXTO DE E-MAIL */}
      <Dialog open={isManualModalOpen} onOpenChange={setIsManualModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="text-lg font-bold flex items-center gap-2">
                <Mail className="h-5 w-5 text-teal-600" />
                Nova Cotação por E-mail (Colar Texto)
              </DialogTitle>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleLoadSample}
                className="text-xs h-7 border-teal-300 text-teal-700"
              >
                Preencher Exemplo BERMO
              </Button>
            </div>
            <DialogDescription className="text-xs">
              Cole o conteúdo do e-mail comercial encaminhado pelo cliente. A IA lerá o texto e
              criará imediatamente o rascunho de orçamento com os dados encontrados.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmitManualEmail} className="space-y-4 pt-2">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Remetente Original (opcional)</Label>
              <Input
                placeholder="ex: roberto@laticiniosbomgosto.com.br"
                value={senderInput}
                onChange={(e) => setSenderInput(e.target.value)}
                className="text-xs"
              />
              <p className="text-[10px] text-muted-foreground">
                Se não preenchido, a IA tentará extrair do cabeçalho ou assinatura do e-mail.
              </p>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Assunto do E-mail *</Label>
              <Input
                placeholder="ex: ENC: Solicitação de Cotação Manutenção Trocador BP-50"
                value={subjectInput}
                onChange={(e) => setSubjectInput(e.target.value)}
                required
                className="text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">
                Corpo / Conteúdo do E-mail Encaminhado *
              </Label>
              <Textarea
                rows={9}
                placeholder="Cole aqui o texto completo do e-mail recebido..."
                value={bodyInput}
                onChange={(e) => setBodyInput(e.target.value)}
                required
                className="text-xs font-mono"
              />
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsManualModalOpen(false)}
                disabled={isProcessing}
                className="text-xs"
              >
                Cancelar
              </Button>

              <Button
                type="submit"
                size="sm"
                disabled={isProcessing}
                className="bg-teal-700 hover:bg-teal-600 text-white font-semibold text-xs"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 mr-2 animate-spin" />
                    Extraindo e Criando Rascunho...
                  </>
                ) : (
                  <>
                    <Send className="h-3.5 w-3.5 mr-2" />
                    Processar e Gerar Rascunho
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL 2: DETALHES DO E-MAIL E EXTRAÇÃO DA IA */}
      <Dialog
        open={Boolean(selectedEmailForDetails)}
        onOpenChange={(open) => !open && setSelectedEmailForDetails(null)}
      >
        <DialogContent className="max-w-2xl max-h-[88vh] overflow-y-auto">
          {selectedEmailForDetails && (
            <>
              <DialogHeader>
                <DialogTitle className="text-base font-bold flex items-center gap-2">
                  <Mail className="h-4 w-4 text-teal-600" />
                  Detalhes da Cotação Recebida por E-mail
                </DialogTitle>
                <DialogDescription className="text-xs">
                  Trilha de auditoria e dados estruturados gerados pela IA
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 pt-2 text-xs">
                <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-muted-foreground block text-[10px]">Assunto:</span>
                      <strong className="text-slate-800 dark:text-slate-200">
                        {selectedEmailForDetails.subject || '—'}
                      </strong>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[10px]">Remetente:</span>
                      <strong className="text-slate-800 dark:text-slate-200">
                        {selectedEmailForDetails.original_sender ||
                          selectedEmailForDetails.sender ||
                          '—'}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Dados Extraídos */}
                <div>
                  <h4 className="font-semibold text-slate-800 dark:text-slate-200 mb-2 flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-teal-600" />
                    Dados Extraídos Estruturados
                  </h4>
                  <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                    <div>
                      <span className="text-muted-foreground text-[10px] block">Cliente:</span>
                      <span className="font-medium">
                        {selectedEmailForDetails.extracted_data?.client_name || '—'}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-[10px] block">Contato:</span>
                      <span>
                        {selectedEmailForDetails.extracted_data?.contact_name || '—'}
                        {selectedEmailForDetails.extracted_data?.contact_phone
                          ? ` (${selectedEmailForDetails.extracted_data.contact_phone})`
                          : ''}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-[10px] block">
                        Modelo de Equipamento:
                      </span>
                      <span className="font-semibold text-teal-700 dark:text-teal-400">
                        {selectedEmailForDetails.extracted_data?.equipment_brand || 'BERMO'}{' '}
                        {selectedEmailForDetails.extracted_data?.equipment_model || '—'}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-[10px] block">
                        Localização / CEP:
                      </span>
                      <span>
                        {selectedEmailForDetails.extracted_data?.city || '—'}{' '}
                        {selectedEmailForDetails.extracted_data?.state || ''}{' '}
                        {selectedEmailForDetails.extracted_data?.postal_code
                          ? `(${selectedEmailForDetails.extracted_data.postal_code})`
                          : ''}
                      </span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-muted-foreground text-[10px] block">
                        Escopo Identificado:
                      </span>
                      <p className="mt-0.5">
                        {selectedEmailForDetails.extracted_data?.service_scope || '—'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Avisos */}
                {selectedEmailForDetails.warnings &&
                  selectedEmailForDetails.warnings.length > 0 && (
                    <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-900">
                      <h5 className="font-semibold text-amber-800 dark:text-amber-300 flex items-center gap-1.5 mb-1 text-[11px]">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        Pontos de Atenção / Campos Faltantes:
                      </h5>
                      <ul className="list-disc list-inside space-y-0.5 text-amber-700 dark:text-amber-400 text-[10px]">
                        {selectedEmailForDetails.warnings.map((w, idx) => (
                          <li key={idx}>{w}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                {/* E-mail Bruto */}
                <div>
                  <h4 className="font-semibold text-slate-800 dark:text-slate-200 mb-1">
                    Texto Bruto do E-mail Recebido
                  </h4>
                  <pre className="p-3 bg-slate-100 dark:bg-slate-900 rounded-lg text-[10px] text-slate-700 dark:text-slate-300 whitespace-pre-wrap font-mono max-h-48 overflow-y-auto">
                    {selectedEmailForDetails.raw_body || 'Nenhum corpo de texto registrado.'}
                  </pre>
                </div>
              </div>

              <DialogFooter className="pt-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSelectedEmailForDetails(null)}
                  className="text-xs"
                >
                  Fechar
                </Button>
                {selectedEmailForDetails.quote_id && (
                  <Button
                    size="sm"
                    onClick={() => {
                      const q = quotes.find(
                        (quote) => quote.id === selectedEmailForDetails.quote_id,
                      )
                      if (q) {
                        setSelectedEmailForDetails(null)
                        onOpenEditQuote(q)
                      } else {
                        toast({
                          title: 'Proposta vinculada',
                          description: `ID da proposta: ${selectedEmailForDetails.quote_id}`,
                        })
                      }
                    }}
                    className="bg-teal-700 hover:bg-teal-600 text-white text-xs font-semibold"
                  >
                    <ArrowRight className="h-3.5 w-3.5 mr-1" />
                    Abrir Rascunho da Proposta
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
