import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Headphones,
  Plus,
  MessageSquare,
  Mail,
  Phone,
  CheckCircle2,
  Clock,
  User,
  Send,
  Building2,
  LifeBuoy,
} from 'lucide-react'
import type { TicketRecord, TicketStatus, TicketChannel, ClientRecord } from '@/types/crm'

interface TicketsSupportProps {
  tickets: TicketRecord[]
  clients: ClientRecord[]
  onCreateTicket: (data: Partial<TicketRecord>) => void
  onUpdateTicket: (id: string, data: Partial<TicketRecord>) => void
}

const STATUS_CONFIG: Record<TicketStatus, { label: string; color: string }> = {
  open: {
    label: 'Aberto',
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  },
  in_progress: {
    label: 'Em Análise',
    color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  },
  waiting: {
    label: 'Aguardando',
    color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  },
  resolved: {
    label: 'Resolvido',
    color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  },
  closed: {
    label: 'Fechado',
    color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400',
  },
}
const CHANNEL_CONFIG: Record<TicketChannel, { label: string; icon: any }> = {
  whatsapp: { label: 'WhatsApp', icon: MessageSquare },
  email: { label: 'E-mail', icon: Mail },
  phone: { label: 'Telefone', icon: Phone },
  chat: { label: 'Chat Online', icon: MessageSquare },
  in_person: { label: 'Presencial', icon: User },
}

export const TicketsSupport: React.FC<TicketsSupportProps> = ({
  tickets,
  clients,
  onCreateTicket,
  onUpdateTicket,
}) => {
  const [selectedTicket, setSelectedTicket] = useState<TicketRecord | null>(tickets[0] || null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [replyText, setReplyText] = useState('')

  // Form states
  const [subject, setSubject] = useState('')
  const [clientId, setClientId] = useState('')
  const [channel, setChannel] = useState<TicketChannel>('whatsapp')
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium')
  const [description, setDescription] = useState('')

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    const client = clients.find((c) => c.id === clientId)
    const tckNumber = `TCK-${1000 + tickets.length + 1}`

    onCreateTicket({
      ticket_number: tckNumber,
      client_id: clientId || undefined,
      client_name: client ? client.name : 'Cliente Anônimo',
      subject,
      description,
      channel,
      priority,
      status: 'open',
      assigned_to: 'Alex Nogueia',
      timeline: [
        {
          author: client ? client.name : 'Cliente',
          role: 'client',
          message: description,
          timestamp: new Date().toISOString(),
          type: channel,
        },
      ],
    })

    setSubject('')
    setDescription('')
    setClientId('')
    setIsModalOpen(false)
  }

  const handleSendReply = () => {
    if (!selectedTicket || !replyText.trim()) return

    const currentTimeline = selectedTicket.timeline || []
    const updatedTimeline = [
      ...currentTimeline,
      {
        author: 'Alex Nogueia (Especialista)',
        role: 'agent' as const,
        message: replyText,
        timestamp: new Date().toISOString(),
        type: selectedTicket.channel || 'whatsapp',
      },
    ]

    onUpdateTicket(selectedTicket.id, {
      timeline: updatedTimeline,
      status: selectedTicket.status === 'open' ? 'in_progress' : selectedTicket.status,
    })

    setSelectedTicket({
      ...selectedTicket,
      timeline: updatedTimeline,
      status: selectedTicket.status === 'open' ? 'in_progress' : selectedTicket.status,
    })

    setReplyText('')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Headphones className="h-6 w-6 text-indigo-600" />
            Central de Atendimento & Suporte Omnichannel
          </h2>
          <p className="text-xs md:text-sm text-muted-foreground mt-0.5">
            Gestão de chamados, canais (WhatsApp/E-mail) e timeline de resolução.
          </p>
        </div>
        <Button
          onClick={() => setIsModalOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-500 shadow-sm"
        >
          <Plus className="h-4 w-4 mr-1.5" />
          Novo Chamado / Atendimento
        </Button>
      </div>

      {/* Grid: Lista de Tickets + Timeline Interativa */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Lista de Chamados */}
        <div className="lg:col-span-5 space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-1">
            Fila de Atendimento ({tickets.length})
          </div>

          {tickets.map((t) => {
            const isSelected = selectedTicket?.id === t.id
            const statusConfig = t.status ? STATUS_CONFIG[t.status] : STATUS_CONFIG.open
            const channelConfig = t.channel ? CHANNEL_CONFIG[t.channel] : CHANNEL_CONFIG.whatsapp
            const Icon = channelConfig.icon

            return (
              <Card
                key={t.id}
                onClick={() => setSelectedTicket(t)}
                className={`p-3.5 cursor-pointer transition-all border ${
                  isSelected
                    ? 'border-indigo-600 ring-2 ring-indigo-500/20 bg-indigo-50/20 dark:bg-indigo-950/20'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400">
                        {t.ticket_number}
                      </span>
                      <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 line-clamp-1">
                        {t.subject}
                      </span>
                    </div>
                    <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                      <Building2 className="h-3 w-3" />
                      {t.client_name || 'Cliente'}
                    </div>
                  </div>

                  <Badge className={`text-[9px] ${statusConfig.color}`}>{statusConfig.label}</Badge>
                </div>

                <div className="flex items-center justify-between pt-2.5 mt-2 border-t border-slate-100 dark:border-slate-800 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Icon className="h-3.5 w-3.5 text-slate-400" />
                    <span>{channelConfig.label}</span>
                  </div>
                  <span className="text-[10px]">
                    {t.priority === 'urgent'
                      ? '⚡ Urgente'
                      : t.priority === 'high'
                        ? 'Alta Prioridade'
                        : 'Normal'}
                  </span>
                </div>
              </Card>
            )
          })}
        </div>

        {/* Detalhes & Timeline do Ticket */}
        <div className="lg:col-span-7">
          {selectedTicket ? (
            <Card className="border-slate-200 dark:border-slate-800 shadow-sm flex flex-col h-full min-h-[500px]">
              <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-indigo-600 dark:text-indigo-400">
                        {selectedTicket.ticket_number}
                      </span>
                      <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100">
                        {selectedTicket.subject}
                      </CardTitle>
                    </div>
                    <CardDescription className="text-xs mt-1">
                      Cliente: <strong>{selectedTicket.client_name}</strong> • Canal:{' '}
                      <strong>{selectedTicket.channel}</strong>
                    </CardDescription>
                  </div>

                  <Select
                    value={selectedTicket.status}
                    onValueChange={(val) => {
                      onUpdateTicket(selectedTicket.id, { status: val as TicketStatus })
                      setSelectedTicket({ ...selectedTicket, status: val as TicketStatus })
                    }}
                  >
                    <SelectTrigger className="w-36 text-xs h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Aberto</SelectItem>
                      <SelectItem value="in_progress">Em Atendimento</SelectItem>
                      <SelectItem value="resolved">Resolvido</SelectItem>
                      <SelectItem value="closed">Fechado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>

              {/* Timeline de Mensagens */}
              <CardContent className="p-4 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-3 overflow-y-auto max-h-[360px] pr-1">
                  {selectedTicket.timeline && selectedTicket.timeline.length > 0 ? (
                    selectedTicket.timeline.map((msg, idx) => {
                      const isAgent = msg.role === 'agent'
                      return (
                        <div
                          key={idx}
                          className={`flex flex-col ${isAgent ? 'items-end' : 'items-start'} space-y-1`}
                        >
                          <span className="text-[10px] text-muted-foreground px-1">
                            {msg.author} •{' '}
                            {new Date(msg.timestamp).toLocaleTimeString('pt-BR', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                          <div
                            className={`p-3 rounded-xl max-w-[85%] text-xs ${
                              isAgent
                                ? 'bg-indigo-600 text-white rounded-br-none'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-bl-none'
                            }`}
                          >
                            {msg.message}
                          </div>
                        </div>
                      )
                    })
                  ) : (
                    <div className="p-4 text-center text-xs text-muted-foreground">
                      {selectedTicket.description ||
                        'Nenhum histórico disponível para este chamado.'}
                    </div>
                  )}
                </div>

                {/* Caixa de Resposta */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                  <Textarea
                    rows={2}
                    placeholder="Digite a resposta para o cliente ou nota interna..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    className="text-xs"
                  />
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] text-muted-foreground">
                      Enviando via canal:{' '}
                      <strong className="capitalize">{selectedTicket.channel}</strong>
                    </span>
                    <Button
                      size="sm"
                      onClick={handleSendReply}
                      className="bg-indigo-600 hover:bg-indigo-500 text-xs h-8"
                    >
                      <Send className="h-3.5 w-3.5 mr-1" />
                      Responder Chamado
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="p-12 text-center text-muted-foreground">
              <LifeBuoy className="h-10 w-10 mx-auto text-slate-400 mb-2" />
              <p className="text-sm font-semibold">Nenhum chamado selecionado</p>
            </Card>
          )}
        </div>
      </div>

      {/* Modal Novo Ticket */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Abrir Novo Chamado de Suporte</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-3.5 py-2">
            <div className="space-y-1">
              <Label className="text-xs font-medium">Assunto do Chamado *</Label>
              <Input
                required
                placeholder="Ex: Dúvida sobre integração da API do WhatsApp"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-medium">Cliente Relacionado</Label>
                <Select value={clientId} onValueChange={setClientId}>
                  <SelectTrigger className="text-xs">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((c) => (
                      <SelectItem key={c.id} value={c.id} className="text-xs">
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-medium">Canal de Origem</Label>
                <Select value={channel} onValueChange={(v) => setChannel(v as TicketChannel)}>
                  <SelectTrigger className="text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="whatsapp" className="text-xs">
                      WhatsApp
                    </SelectItem>
                    <SelectItem value="email" className="text-xs">
                      E-mail
                    </SelectItem>
                    <SelectItem value="phone" className="text-xs">
                      Telefone
                    </SelectItem>
                    <SelectItem value="in_person" className="text-xs">
                      Presencial
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-medium">Prioridade</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as any)}>
                <SelectTrigger className="text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low" className="text-xs">
                    Baixa
                  </SelectItem>
                  <SelectItem value="medium" className="text-xs">
                    Média
                  </SelectItem>
                  <SelectItem value="high" className="text-xs">
                    Alta
                  </SelectItem>
                  <SelectItem value="urgent" className="text-xs">
                    Urgente
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-medium">Descrição da Solicitação *</Label>
              <Textarea
                rows={3}
                required
                placeholder="Descreva o que o cliente solicitou ou relatou..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="text-xs"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsModalOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" size="sm" className="bg-indigo-600 hover:bg-indigo-500">
                Registrar Chamado
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
