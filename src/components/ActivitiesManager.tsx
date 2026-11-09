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
  Calendar,
  Phone,
  Video,
  Mail,
  CheckCircle2,
  Clock,
  Plus,
  Building2,
  ListTodo,
  MessageCircle,
} from 'lucide-react'
import type { ActivityRecord, ActivityType, ActivityStatus, ClientRecord } from '@/types/crm'

interface ActivitiesManagerProps {
  activities: ActivityRecord[]
  clients: ClientRecord[]
  onCreateActivity: (data: Partial<ActivityRecord>) => void
  onUpdateActivity: (id: string, data: Partial<ActivityRecord>) => void
}

const waDigits = (v?: string) => (v || '').replace(/\D/g, '')
const waMessage = (a: ActivityRecord) => {
  const contact = ((a as any).quote_contact || '').trim() || a.client_name || 'cliente'
  const numero = ((a as any).quote_number || '').trim()
  return (
    'Olá ' +
    contact +
    ', tudo bem? Conseguiu avaliar a proposta ' +
    (numero || '') +
    '? Fico à disposição.'
  )
}
const waLink = (phone: string, msg: string) =>
  'https://wa.me/' +
  (phone.startsWith('55') ? phone : '55' + phone) +
  '?text=' +
  encodeURIComponent(msg)

const TYPE_ICONS: Record<ActivityType, { label: string; icon: any }> = {
  call: { label: 'Ligação Telefônica', icon: Phone },
  meeting: { label: 'Reunião Presencial/Online', icon: Video },
  follow_up: { label: 'Follow-up Comercial', icon: Clock },
  visit: { label: 'Visita Técnica', icon: Building2 },
  email: { label: 'E-mail Comercial', icon: Mail },
  task: { label: 'Tarefa Interna', icon: ListTodo },
}

export const ActivitiesManager: React.FC<ActivitiesManagerProps> = ({
  activities,
  clients,
  onCreateActivity,
  onUpdateActivity,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all')

  // Form states
  const [title, setTitle] = useState('')
  const [clientId, setClientId] = useState('')
  const [type, setType] = useState<ActivityType>('meeting')
  const [dueDate, setDueDate] = useState(new Date().toISOString().split('T')[0])
  const [time, setTime] = useState('14:30')
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium')
  const [description, setDescription] = useState('')

  const filtered = activities.filter((a) => {
    if (filter === 'pending') return a.status === 'pending'
    if (filter === 'completed') return a.status === 'completed'
    return true
  })

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    const client = clients.find((c) => c.id === clientId)

    onCreateActivity({
      title,
      client_id: clientId || undefined,
      client_name: client ? client.name : 'Geral',
      type,
      due_date: dueDate,
      time,
      priority,
      status: 'pending',
      description,
      assigned_to: 'Alex Nogueia',
    })

    setTitle('')
    setDescription('')
    setClientId('')
    setIsModalOpen(false)
  }

  const handleToggleComplete = (activity: ActivityRecord) => {
    const newStatus: ActivityStatus = activity.status === 'completed' ? 'pending' : 'completed'
    onUpdateActivity(activity.id, {
      status: newStatus,
      outcome: newStatus === 'completed' ? 'Concluído com sucesso' : undefined,
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Calendar className="h-6 w-6 text-indigo-600" />
            Agenda & Atividades Comerciais
          </h2>
          <p className="text-xs md:text-sm text-muted-foreground mt-0.5">
            Agendamento de reuniões, rotinas de follow-up e compromissos com clientes.
          </p>
        </div>
        <Button
          onClick={() => setIsModalOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-500 shadow-sm"
        >
          <Plus className="h-4 w-4 mr-1.5" />
          Agendar Atividade
        </Button>
      </div>

      {/* Filtros rápidos */}
      <div className="flex gap-2">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('all')}
          className="text-xs"
        >
          Todas ({activities.length})
        </Button>
        <Button
          variant={filter === 'pending' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('pending')}
          className="text-xs"
        >
          Pendentes ({activities.filter((a) => a.status === 'pending').length})
        </Button>
        <Button
          variant={filter === 'completed' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('completed')}
          className="text-xs"
        >
          Concluídas ({activities.filter((a) => a.status === 'completed').length})
        </Button>
      </div>

      {/* Lista de Atividades */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {filtered.map((act) => {
          const typeConf = act.type ? TYPE_ICONS[act.type] : TYPE_ICONS.meeting
          const Icon = typeConf.icon
          const isDone = act.status === 'completed'

          return (
            <Card
              key={act.id}
              className={`p-4 border transition-all flex flex-col justify-between ${
                isDone
                  ? 'bg-slate-50/60 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 opacity-75'
                  : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:shadow-xs'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 flex items-center justify-center shrink-0">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <h3
                        className={`text-xs font-bold ${isDone ? 'line-through text-muted-foreground' : 'text-slate-900 dark:text-slate-100'}`}
                      >
                        {act.title}
                      </h3>
                      <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                        <Building2 className="h-3 w-3" />
                        {act.client_name || 'Sem cliente'}
                      </div>
                    </div>
                  </div>
                  <Badge
                    variant={act.priority === 'high' ? 'destructive' : 'secondary'}
                    className="text-[9px]"
                  >
                    {act.priority === 'high' ? 'Alta' : 'Normal'}
                  </Badge>
                </div>

                {act.description && (
                  <p className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/60 p-2 rounded">
                    {act.description}
                  </p>
                )}
              </div>

              <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <div className="text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  <span>
                    {act.due_date ? new Date(act.due_date).toLocaleDateString('pt-BR') : 'Hoje'}{' '}
                    {act.time || ''}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  {(act as any).quote_cobranca && waDigits(act.contact_phone) && (
                    <Button
                      size="sm"
                      onClick={() =>
                        window.open(
                          waLink(waDigits(act.contact_phone), waMessage(act)),
                          '_blank',
                          'noopener,noreferrer',
                        )
                      }
                      className="h-7 text-[11px] bg-emerald-600 hover:bg-emerald-500 text-white"
                      title="Abrir WhatsApp com a mensagem pronta"
                    >
                      <MessageCircle className="h-3.5 w-3.5 mr-1" />
                      WhatsApp
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant={isDone ? 'outline' : 'default'}
                    onClick={() => handleToggleComplete(act)}
                    className={`h-7 text-[11px] ${
                      isDone
                        ? 'border-emerald-300 text-emerald-600 hover:bg-emerald-50'
                        : 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900'
                    }`}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                    {isDone ? 'Concluída' : 'Marcar Feita'}
                  </Button>
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {/* Modal Criar Atividade */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">
              Agendar Nova Atividade Comercial
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-3.5 py-2">
            <div className="space-y-1">
              <Label className="text-xs font-medium">Título do Compromisso *</Label>
              <Input
                required
                placeholder="Ex: Demonstração do Módulo WhatsApp com Diretoria"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-medium">Cliente</Label>
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
                <Label className="text-xs font-medium">Tipo</Label>
                <Select value={type} onValueChange={(v) => setType(v as ActivityType)}>
                  <SelectTrigger className="text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="meeting" className="text-xs">
                      Reunião
                    </SelectItem>
                    <SelectItem value="call" className="text-xs">
                      Ligação
                    </SelectItem>
                    <SelectItem value="follow_up" className="text-xs">
                      Follow-up
                    </SelectItem>
                    <SelectItem value="visit" className="text-xs">
                      Visita Técnica
                    </SelectItem>
                    <SelectItem value="email" className="text-xs">
                      E-mail
                    </SelectItem>
                    <SelectItem value="task" className="text-xs">
                      Tarefa Interna
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-medium">Data</Label>
                <Input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-medium">Horário</Label>
                <Input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="text-xs"
                />
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
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-medium">Pauta / Observações</Label>
              <Textarea
                rows={2}
                placeholder="Objetivo da reunião e link da sala virtual..."
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
                Agendar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
