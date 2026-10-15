import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Send,
  Mail,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  History,
  Sparkles,
  UserCheck,
  Building2,
  Clock,
  Loader2,
} from 'lucide-react'
import type { ClientRecord, ClientContact, ClientSurveyRecord } from '@/types/crm'
import { clientSurveysService } from '@/services/client-surveys'

interface ClientSurveyModalProps {
  isOpen: boolean
  onClose: () => void
  client: ClientRecord | null
  onSurveySent?: (survey: ClientSurveyRecord) => void
}

export const SURVEY_PUBLIC_URL =
  'https://sa-tqmkajqlmqawtpd6gebuyb5qkq.goskip.app/udgcj46pemulb7duhnc5rg2ebe/'

export const ClientSurveyModal: React.FC<ClientSurveyModalProps> = ({
  isOpen,
  onClose,
  client,
  onSurveySent,
}) => {
  const [selectedContactKey, setSelectedContactKey] = useState<string>('')
  const [contactName, setContactName] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [contactRole, setContactRole] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [customMessage, setCustomMessage] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  // Histórico de pesquisas disparadas para este cliente
  const [surveyHistory, setSurveyHistory] = useState<ClientSurveyRecord[]>([])
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)

  // Ao abrir o modal ou mudar o cliente selecionado
  useEffect(() => {
    if (!isOpen || !client) {
      setSelectedContactKey('')
      setContactName('')
      setContactEmail('')
      setContactRole('')
      setContactPhone('')
      setCustomMessage('')
      setErrorMsg(null)
      setSuccessMsg(null)
      setSurveyHistory([])
      return
    }

    // Carregar histórico de pesquisas
    setIsLoadingHistory(true)
    clientSurveysService
      .getByClientId(client.id)
      .then((history) => {
        setSurveyHistory(history)
      })
      .catch((err) => {
        console.warn('Erro ao obter histórico de pesquisas:', err)
      })
      .finally(() => {
        setIsLoadingHistory(false)
      })

    // Pré-selecionar contato inicial inteligente
    const clientContacts = client.contacts || []
    if (clientContacts.length > 0) {
      // Priorizar o primeiro contato com e-mail preenchido
      const firstWithEmail = clientContacts.find((c) => Boolean(c.email && c.email.includes('@')))
      const initialContact = firstWithEmail || clientContacts[0]
      const initialKey = initialContact.id || 'idx-0'
      setSelectedContactKey(initialKey)
      setContactName(initialContact.name || '')
      setContactEmail(initialContact.email || '')
      setContactRole(initialContact.role || '')
      setContactPhone(initialContact.phone || '')
    } else if (client.email && client.email.includes('@')) {
      // Usar os dados gerais da empresa se não houver lista de contatos
      setSelectedContactKey('company_main')
      setContactName(client.name || 'Responsável')
      setContactEmail(client.email)
      setContactRole('Contato Geral')
      setContactPhone(client.phone || client.whatsapp || '')
    } else {
      setSelectedContactKey('custom')
      setContactName('')
      setContactEmail('')
      setContactRole('')
      setContactPhone('')
    }
  }, [isOpen, client])

  // Tratar troca de contato no select
  const handleSelectContact = (key: string) => {
    setSelectedContactKey(key)
    setErrorMsg(null)
    setSuccessMsg(null)

    if (!client) return

    if (key === 'company_main') {
      setContactName(client.name || 'Responsável')
      setContactEmail(client.email || '')
      setContactRole('Contato Geral')
      setContactPhone(client.phone || client.whatsapp || '')
      return
    }

    if (key === 'custom') {
      setContactName('')
      setContactEmail('')
      setContactRole('')
      setContactPhone('')
      return
    }

    const contacts = client.contacts || []
    const found = contacts.find((c, idx) => (c.id ? c.id === key : `idx-${idx}` === key))
    if (found) {
      setContactName(found.name || '')
      setContactEmail(found.email || '')
      setContactRole(found.role || '')
      setContactPhone(found.phone || '')
    }
  }

  const handleSendSurvey = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!client) return

    setErrorMsg(null)
    setSuccessMsg(null)

    // Validação estrita de e-mail conforme requisito 5
    const cleanEmail = contactEmail.trim().toLowerCase()
    if (!cleanEmail) {
      setErrorMsg(
        'O contato selecionado não possui e-mail cadastrado. Por favor, informe um endereço de e-mail válido para disparar a pesquisa.',
      )
      return
    }

    if (!cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setErrorMsg('Por favor, informe um endereço de e-mail válido com @ e domínio.')
      return
    }

    if (!contactName.trim()) {
      setErrorMsg('Por favor, informe o nome do contato destinatário.')
      return
    }

    setIsSending(true)

    try {
      const payload = {
        clientId: client.id,
        contactId:
          selectedContactKey !== 'custom' && selectedContactKey !== 'company_main'
            ? selectedContactKey
            : undefined,
        contactName: contactName.trim(),
        contactEmail: cleanEmail,
        contactRole: contactRole.trim() || undefined,
        contactPhone: contactPhone.trim() || undefined,
        sentBy: client.assigned_to || 'Alex Nogueira',
        sentByEmail: 'alex.nogueira@intertermal.com.br',
        customMessage: customMessage.trim() || undefined,
      }

      const res = await clientSurveysService.sendSurvey(payload)

      if (res && res.success) {
        setSuccessMsg(
          res.message || `Pesquisa de satisfação enviada com sucesso para ${contactName}!`,
        )

        // Recarregar histórico
        const updatedHistory = await clientSurveysService.getByClientId(client.id)
        setSurveyHistory(updatedHistory)

        if (onSurveySent && updatedHistory.length > 0) {
          onSurveySent(updatedHistory[0])
        }
      } else {
        setErrorMsg(res?.error || 'Não foi possível concluir o envio da pesquisa.')
      }
    } catch (err: any) {
      console.error('Falha ao disparar pesquisa:', err)
      const message =
        err?.data?.error ||
        err?.message ||
        'Erro ao conectar com o serviço de e-mail. Verifique a conexão e tente novamente.'
      setErrorMsg(message)
    } finally {
      setIsSending(false)
    }
  }

  if (!client) return null

  const availableContacts = client.contacts || []
  const hasNoEmail = !contactEmail || !contactEmail.includes('@')

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[620px] max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                Disparar Pesquisa de Satisfação
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Cliente:{' '}
                <strong className="text-slate-800 dark:text-slate-200">{client.name}</strong>
                {client.company_name ? ` (${client.company_name})` : ''}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSendSurvey} className="space-y-4 pt-1">
          {/* Alerta informativo da pesquisa com link público */}
          <div className="p-3 rounded-lg border border-teal-200 dark:border-teal-900/60 bg-teal-50/50 dark:bg-teal-950/20 text-xs space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-teal-900 dark:text-teal-200 flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-teal-600" />
                Pesquisa Intertermal / BERMO (6 etapas rápidas)
              </span>
              <a
                href={SURVEY_PUBLIC_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] text-teal-700 dark:text-teal-400 font-semibold inline-flex items-center hover:underline"
              >
                Visualizar formulário <ExternalLink className="h-3 w-3 ml-1" />
              </a>
            </div>
            <p className="text-[11px] text-teal-800 dark:text-teal-300">
              O destinatário receberá um e-mail profissional convidando a avaliar atendimento,
              logística, qualidade do serviço de trocadores/válvulas, cumprimento de prazos,
              pós-venda e NPS.
            </p>
          </div>

          {/* Seleção do Contato Cadastrado */}
          <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 space-y-3">
            <div className="space-y-1">
              <Label className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <UserCheck className="h-4 w-4 text-indigo-600" />
                1. Selecionar Contato Destinatário *
              </Label>
              <Select value={selectedContactKey} onValueChange={handleSelectContact}>
                <SelectTrigger className="text-xs h-9 bg-white dark:bg-slate-950">
                  <SelectValue placeholder="Selecione um contato do cliente" />
                </SelectTrigger>
                <SelectContent>
                  {availableContacts.map((c, idx) => {
                    const key = c.id || `idx-${idx}`
                    return (
                      <SelectItem key={key} value={key} className="text-xs">
                        {c.name} {c.role ? `(${c.role})` : ''} — {c.email || '⚠️ Sem e-mail'}
                      </SelectItem>
                    )
                  })}
                  {client.email && (
                    <SelectItem value="company_main" className="text-xs">
                      🏢 E-mail Geral da Empresa ({client.email})
                    </SelectItem>
                  )}
                  <SelectItem value="custom" className="text-xs">
                    ✏️ Outro contato / preenchimento manual
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Campos de Nome e E-mail */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="space-y-1">
                <Label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                  Nome do Destinatário *
                </Label>
                <Input
                  required
                  placeholder="Ex: Carlos Alberto"
                  value={contactName}
                  onChange={(e) => {
                    setContactName(e.target.value)
                    setErrorMsg(null)
                  }}
                  className="text-xs h-8 bg-white dark:bg-slate-950"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                  E-mail do Destinatário *
                </Label>
                <Input
                  type="email"
                  required
                  placeholder="Ex: carlos@empresa.com.br"
                  value={contactEmail}
                  onChange={(e) => {
                    setContactEmail(e.target.value)
                    setErrorMsg(null)
                  }}
                  className={`text-xs h-8 bg-white dark:bg-slate-950 ${
                    hasNoEmail && contactEmail
                      ? 'border-amber-400 focus-visible:ring-amber-400'
                      : ''
                  }`}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-[11px] text-muted-foreground">
                  Cargo / Função (opcional)
                </Label>
                <Input
                  placeholder="Ex: Gerente de Manutenção"
                  value={contactRole}
                  onChange={(e) => setContactRole(e.target.value)}
                  className="text-xs h-7 bg-white dark:bg-slate-950"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px] text-muted-foreground">
                  Telefone / WhatsApp (opcional)
                </Label>
                <Input
                  placeholder="Ex: (11) 99999-8888"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  className="text-xs h-7 bg-white dark:bg-slate-950"
                />
              </div>
            </div>

            {/* Requisito 5: Se o contato não tiver e-mail, alertar e bloquear */}
            {hasNoEmail && (
              <div className="p-2.5 rounded-md bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-300 text-xs flex items-start gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
                <div>
                  <span className="font-semibold block">Contato sem e-mail cadastrado</span>
                  Para realizar o disparo, informe o endereço de e-mail deste responsável acima. O
                  disparo é bloqueado sem e-mail válido.
                </div>
              </div>
            )}
          </div>

          {/* Mensagem personalizada opcional */}
          <div className="space-y-1">
            <Label className="text-xs font-semibold text-slate-800 dark:text-slate-200">
              Mensagem personalizada no corpo do e-mail (opcional)
            </Label>
            <Textarea
              rows={2}
              placeholder="Ex: Obrigado pela confiança na revisão recente do Trocador BP6. Sua opinião é essencial para aprimorarmos nossa entrega..."
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              className="text-xs"
            />
          </div>

          {/* Feedbacks de Sucesso ou Erro (Requisito 4) */}
          {errorMsg && (
            <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200 text-xs flex items-start gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
              <div>
                <strong className="block font-semibold">Não foi possível enviar:</strong>
                <span>{errorMsg}</span>
              </div>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-200 text-xs flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
              <div>
                <strong className="block font-semibold">Sucesso:</strong>
                <span>{successMsg}</span>
              </div>
            </div>
          )}

          {/* Histórico de Envios Anteriores deste Cliente (Requisito 3) */}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <History className="h-3.5 w-3.5 text-teal-600" />
                Histórico de Pesquisas Disparadas ({surveyHistory.length})
              </Label>
              {isLoadingHistory && (
                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" /> Carregando...
                </span>
              )}
            </div>

            {surveyHistory.length === 0 ? (
              <p className="text-[11px] text-muted-foreground italic py-1">
                Nenhuma pesquisa disparada para este cliente até o momento.
              </p>
            ) : (
              <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                {surveyHistory.map((item) => (
                  <div
                    key={item.id}
                    className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-[11px] flex items-center justify-between gap-2"
                  >
                    <div className="space-y-0.5 truncate">
                      <div className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5 truncate">
                        <Mail className="h-3 w-3 text-teal-600 shrink-0" />
                        <span className="truncate">{item.contact_name}</span>
                        <span className="text-muted-foreground font-normal truncate">
                          ({item.contact_email})
                        </span>
                      </div>
                      <div className="text-[10px] text-muted-foreground flex items-center gap-2">
                        <span>Por: {item.sent_by || 'Alex Nogueira'}</span>
                        {item.contact_role && <span>• {item.contact_role}</span>}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <Badge
                        variant={item.status === 'sent' ? 'default' : 'destructive'}
                        className={`text-[9px] px-1.5 py-0 ${
                          item.status === 'sent'
                            ? 'bg-emerald-600 text-white'
                            : 'bg-rose-600 text-white'
                        }`}
                      >
                        {item.status === 'sent' ? 'Enviado' : 'Falha'}
                      </Badge>
                      <div className="text-[9px] text-muted-foreground font-mono mt-0.5">
                        {item.created
                          ? new Date(item.created).toLocaleDateString('pt-BR', {
                              day: '2-digit',
                              month: '2-digit',
                              year: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : ''}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isSending}
            >
              Fechar
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSending || hasNoEmail}
              className="bg-teal-700 hover:bg-teal-600 text-white font-semibold"
            >
              {isSending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                  Disparando e-mail...
                </>
              ) : (
                <>
                  <Send className="h-3.5 w-3.5 mr-1.5" />
                  Disparar Pesquisa por E-mail
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
