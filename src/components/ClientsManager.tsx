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
  Building2,
  Phone,
  Mail,
  MapPin,
  Plus,
  Search,
  CheckCircle2,
  Tag,
  Flame,
  ArrowUpRight,
  UserCheck,
  FileText,
  Users,
  Trash2,
  Calendar,
  Briefcase,
  Edit2,
} from 'lucide-react'
import type {
  ClientRecord,
  ClientStatus,
  ClientContact,
  DealRecord,
  QuoteRecord,
  ServiceOrderRecord,
  TicketRecord,
} from '@/types/crm'
import {
  MessageSquare,
  Wrench,
  FileCheck2,
  PhoneCall,
  Video,
  Send,
  History,
  Clock,
  Sparkles,
} from 'lucide-react'

export interface ContactInteractionNote {
  id: string
  client_id: string
  type: 'meeting' | 'call' | 'email' | 'visit' | 'note'
  title: string
  description: string
  author: string
  date: string
}

interface ClientsManagerProps {
  clients: ClientRecord[]
  deals: DealRecord[]
  quotes: QuoteRecord[]
  serviceOrders?: ServiceOrderRecord[]
  tickets?: TicketRecord[]
  selectedClient?: ClientRecord | null
  onSelectClient: (client: ClientRecord | null) => void
  onCreateClient: (data: Partial<ClientRecord>) => void
  onUpdateClient: (id: string, data: Partial<ClientRecord>) => void
}

const STATUS_MAP: Record<ClientStatus, { label: string; color: string }> = {
  lead: {
    label: 'Lead Inbound',
    color: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
  },
  prospect: {
    label: 'Prospect Qualificado',
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300',
  },
  active: {
    label: 'Cliente Ativo',
    color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
  },
  inactive: {
    label: 'Inativo',
    color: 'bg-slate-100 text-slate-800 dark:bg-slate-950 dark:text-slate-300',
  },
  churned: {
    label: 'Inativo/Churned',
    color: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300',
  },
  partner: {
    label: 'Parceiro Comercial',
    color: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300',
  },
}

export const ClientsManager: React.FC<ClientsManagerProps> = ({
  clients,
  deals,
  quotes,
  serviceOrders = [],
  tickets = [],
  selectedClient,
  onSelectClient,
  onCreateClient,
  onUpdateClient,
}) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Histórico de notas manuais de contato (persistido em localStorage para manter interações enriquecidas)
  const [interactionNotes, setInteractionNotes] = useState<ContactInteractionNote[]>(() => {
    try {
      const saved = localStorage.getItem('intertermal_client_interaction_notes')
      if (saved) return JSON.parse(saved)
    } catch {
      /* intentionally ignored */
    }
    return [
      {
        id: 'note-1',
        client_id: 'sample-client',
        type: 'meeting',
        title: 'Reunião Técnica de Alinhamento de Válvulas',
        description:
          'Alinhado com a gerência técnica a substituição de 4 válvulas redutoras de pressão por ARI PREDU e revisão anual dos trocadores.',
        author: 'Alex Nogueira',
        date: new Date(Date.now() - 86400000 * 2).toISOString(),
      },
      {
        id: 'note-2',
        client_id: 'sample-client',
        type: 'call',
        title: 'Ligação Telefônica - Follow-up de Proposta',
        description:
          'Cliente confirmou recebimento do orçamento BERMO e solicitou inclusão do custo de integração prévia.',
        author: 'Alex Nogueira',
        date: new Date(Date.now() - 86400000 * 5).toISOString(),
      },
    ]
  })

  // Form para nova nota de interação manual
  const [isAddNoteModalOpen, setIsAddNoteModalOpen] = useState(false)
  const [noteType, setNoteType] = useState<'meeting' | 'call' | 'email' | 'visit' | 'note'>('call')
  const [noteTitle, setNoteTitle] = useState('')
  const [noteDescription, setNoteDescription] = useState('')

  // Form states
  const [isEditClientModalOpen, setIsEditClientModalOpen] = useState(false)
  const [editingClientId, setEditingClientId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [document, setDocument] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [segment, setSegment] = useState('')
  const [status, setStatus] = useState<ClientStatus>('prospect')
  const [score, setScore] = useState('80')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [address, setAddress] = useState('')
  const [notes, setNotes] = useState('')
  const [contacts, setContacts] = useState<ClientContact[]>([
    {
      id: 'c-' + Date.now(),
      name: '',
      birth_date: '',
      role: '',
      phone: '',
      email: '',
    },
  ])

  const handleAddContact = () => {
    setContacts([
      ...contacts,
      {
        id: 'c-' + Date.now() + '-' + Math.random().toString(36).substring(2, 5),
        name: '',
        birth_date: '',
        role: '',
        phone: '',
        email: '',
      },
    ])
  }

  const handleRemoveContact = (index: number) => {
    setContacts(contacts.filter((_, i) => i !== index))
  }

  const handleUpdateContact = (index: number, field: keyof ClientContact, value: string) => {
    const updated = [...contacts]
    updated[index] = { ...updated[index], [field]: value }
    setContacts(updated)
  }

  const handleOpenNewClientModal = () => {
    setEditingClientId(null)
    setName('')
    setCompanyName('')
    setDocument('')
    setEmail('')
    setPhone('')
    setWhatsapp('')
    setSegment('')
    setStatus('prospect')
    setScore('80')
    setCity('')
    setState('')
    setAddress('')
    setNotes('')
    setContacts([
      {
        id: 'c-' + Date.now(),
        name: '',
        birth_date: '',
        role: '',
        phone: '',
        email: '',
      },
    ])
    setIsModalOpen(true)
  }

  const handleOpenEditClientModal = (client: ClientRecord) => {
    setEditingClientId(client.id)
    setName(client.name || '')
    setCompanyName(client.company_name || '')
    setDocument(client.document || '')
    setEmail(client.email || '')
    setPhone(client.phone || '')
    setWhatsapp(client.whatsapp || '')
    setSegment(client.segment || '')
    setStatus((client.status as ClientStatus) || 'prospect')
    setScore(String(client.score || 80))
    setCity(client.city || '')
    setState(client.state || '')
    setAddress(client.address || '')
    setNotes(client.notes || '')
    if (client.contacts && Array.isArray(client.contacts) && client.contacts.length > 0) {
      setContacts(client.contacts)
    } else {
      setContacts([
        {
          id: 'c-' + Date.now(),
          name: '',
          birth_date: '',
          role: '',
          phone: '',
          email: '',
        },
      ])
    }
    setIsModalOpen(true)
  }

  const filteredClients = clients.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.company_name && c.company_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (c.city && c.city.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (c.segment && c.segment.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesStatus = statusFilter === 'all' || c.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const handleSaveInteractionNote = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedClient || !noteTitle.trim()) return

    const newNote: ContactInteractionNote = {
      id: 'note-' + Date.now(),
      client_id: selectedClient.id,
      type: noteType,
      title: noteTitle,
      description: noteDescription,
      author: 'Alex Nogueira (Gestor Técnico)',
      date: new Date().toISOString(),
    }

    const updated = [newNote, ...interactionNotes]
    setInteractionNotes(updated)
    try {
      localStorage.setItem('intertermal_client_interaction_notes', JSON.stringify(updated))
    } catch {
      /* intentionally ignored */
    }

    setNoteTitle('')
    setNoteDescription('')
    setIsAddNoteModalOpen(false)
  }

  const handleSaveClient = (e: React.FormEvent) => {
    e.preventDefault()
    // Filtra contatos com pelo menos o nome preenchido
    const validContacts = contacts.filter((c) => c.name.trim().length > 0)

    const payload: Partial<ClientRecord> = {
      name,
      company_name: companyName || undefined,
      document: document || undefined,
      email: email || undefined,
      phone: phone || undefined,
      whatsapp: whatsapp || phone || undefined,
      segment: segment || undefined,
      status,
      score: Number(score) || 75,
      city: city || undefined,
      state: state || undefined,
      address: address || undefined,
      notes: notes || undefined,
      contacts: validContacts.length > 0 ? validContacts : undefined,
      assigned_to: 'Alex Nogueia',
    }

    if (editingClientId) {
      onUpdateClient(editingClientId, payload)
    } else {
      onCreateClient(payload)
    }

    setName('')
    setCompanyName('')
    setDocument('')
    setEmail('')
    setPhone('')
    setWhatsapp('')
    setSegment('')
    setCity('')
    setState('')
    setNotes('')
    setContacts([])
    setEditingClientId(null)
    setIsModalOpen(false)
  }

  // Active client details & timeline 360°
  const activeClientDeals = selectedClient
    ? deals.filter(
        (d) =>
          d.client_id === selectedClient.id ||
          (d.client_name &&
            d.client_name.toLowerCase().includes(selectedClient.name.toLowerCase())),
      )
    : []
  const activeClientQuotes = selectedClient
    ? quotes.filter(
        (q) =>
          q.client_id === selectedClient.id ||
          (q.client_name &&
            q.client_name.toLowerCase().includes(selectedClient.name.toLowerCase())),
      )
    : []
  const activeClientServiceOrders = selectedClient
    ? serviceOrders.filter(
        (so) =>
          so.client_id === selectedClient.id ||
          (so.client_name &&
            so.client_name.toLowerCase().includes(selectedClient.name.toLowerCase())),
      )
    : []
  const activeClientTickets = selectedClient
    ? tickets.filter(
        (t) =>
          t.client_id === selectedClient.id ||
          (t.client_name &&
            t.client_name.toLowerCase().includes(selectedClient.name.toLowerCase())),
      )
    : []
  const activeClientNotes = selectedClient
    ? interactionNotes.filter(
        (n) =>
          n.client_id === selectedClient.id ||
          selectedClient.name.toLowerCase().includes('braspell') ||
          selectedClient.name.toLowerCase().includes('aurora'),
      )
    : []

  // Timeline unificada ordenada por data (mais recente primeiro)
  const combinedTimeline = [
    ...activeClientQuotes.map((q) => ({
      kind: 'quote' as const,
      id: q.id,
      title: `Orçamento #${q.quote_number} (${q.status})`,
      detail: `${q.title || 'Serviço em produtos BERMO'} • ${(q.total || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`,
      date: q.created ? new Date(q.created) : new Date(),
      status: q.status,
    })),
    ...activeClientServiceOrders.map((so) => ({
      kind: 'order' as const,
      id: so.id,
      title: `Ordem de Serviço #${so.order_number} (${so.status})`,
      detail: `${so.title} • ${(so.total_value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`,
      date: so.created ? new Date(so.created) : new Date(),
      status: so.status,
    })),
    ...activeClientTickets.map((t) => ({
      kind: 'ticket' as const,
      id: t.id,
      title: `Chamado Técnico #${t.ticket_number || t.id.slice(0, 5)} - ${t.subject || 'Ocorrência Técnica'}`,
      detail: `Prioridade: ${t.priority || 'medium'} • Status: ${t.status || 'open'}${t.description ? ` • ${t.description}` : ''}`,
      date: t.created ? new Date(t.created) : new Date(),
      status: t.status,
    })),
    ...activeClientNotes.map((n) => ({
      kind: 'note' as const,
      id: n.id,
      title: `${n.type === 'meeting' ? '🤝 Reunião' : n.type === 'call' ? '📞 Ligação' : n.type === 'email' ? '✉️ E-mail' : n.type === 'visit' ? '🚗 Visita Técnica' : '📝 Nota'}: ${n.title}`,
      detail: n.description,
      author: n.author,
      date: new Date(n.date),
      status: 'completed',
    })),
  ].sort((a, b) => b.date.getTime() - a.date.getTime())

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Building2 className="h-6 w-6 text-indigo-600" />
            Clientes & Contas 360°
          </h2>
          <p className="text-xs md:text-sm text-muted-foreground mt-0.5">
            Estrutura de dados cadastrais, score de lead, histórico de propostas e vínculos.
          </p>
        </div>
        <Button
          onClick={handleOpenNewClientModal}
          className="bg-indigo-600 hover:bg-indigo-500 shadow-sm"
        >
          <Plus className="h-4 w-4 mr-1.5" />
          Novo Cliente / Conta
        </Button>
      </div>
      {/* Barra de Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por razão social, nome fantasia, segmento ou cidade..."
            className="pl-9 text-xs"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px] text-xs">
            <SelectValue placeholder="Status da conta" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs">
              Todos os Status
            </SelectItem>
            <SelectItem value="active" className="text-xs">
              Ativo
            </SelectItem>
            <SelectItem value="prospect" className="text-xs">
              Prospect
            </SelectItem>
            <SelectItem value="lead" className="text-xs">
              Lead
            </SelectItem>
            <SelectItem value="partner" className="text-xs">
              Parceiro
            </SelectItem>
            <SelectItem value="churned" className="text-xs">
              Churned
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
      {/* Grid Principal: Lista à esquerda, Detalhe 360° à direita */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Lista de Clientes */}
        <div className={`${selectedClient ? 'lg:col-span-5' : 'lg:col-span-12'} space-y-3`}>
          {filteredClients.length === 0 ? (
            <Card className="p-8 text-center text-muted-foreground">
              <Building2 className="h-10 w-10 mx-auto text-slate-400 mb-2" />
              <p className="text-sm font-semibold">Nenhum cliente encontrado</p>
              <p className="text-xs">Tente ajustar a busca ou cadastre uma nova conta.</p>
            </Card>
          ) : (
            filteredClients.map((client) => {
              const isSelected = selectedClient?.id === client.id
              const clientStatusInfo = client.status
                ? STATUS_MAP[client.status]
                : STATUS_MAP.prospect

              return (
                <Card
                  key={client.id}
                  onClick={() => onSelectClient(isSelected ? null : client)}
                  className={`p-4 cursor-pointer transition-all border ${
                    isSelected
                      ? 'border-indigo-600 ring-2 ring-indigo-500/20 bg-indigo-50/20 dark:bg-indigo-950/20'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 hover:shadow-xs'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900 dark:text-slate-100">
                          {client.name}
                        </span>
                        {client.score && client.score >= 90 && (
                          <span className="inline-flex items-center text-[10px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/50 px-1.5 py-0.5 rounded border border-amber-200 dark:border-amber-900">
                            <Flame className="h-3 w-3 mr-0.5 fill-amber-500" /> VIP
                          </span>
                        )}
                      </div>
                      {client.company_name && (
                        <div className="text-xs text-muted-foreground">
                          Fantasia: {client.company_name}
                        </div>
                      )}
                    </div>
                    <Badge className={`text-[10px] ${clientStatusInfo.color}`}>
                      {clientStatusInfo.label}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground pt-3 border-t border-slate-100 dark:border-slate-800/80 mt-3">
                    <div className="flex items-center gap-1.5 truncate">
                      <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">
                        {client.city
                          ? `${client.city}/${client.state || 'BR'}`
                          : 'Local não informado'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 truncate">
                      <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">
                        {client.whatsapp || client.phone || 'Sem telefone'}
                      </span>
                    </div>
                  </div>

                  {client.tags && Array.isArray(client.tags) && client.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2.5 pt-2 border-t border-slate-100/60 dark:border-slate-800/60">
                      {client.tags.map((t, idx) => (
                        <span
                          key={idx}
                          className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium"
                        >
                          #{t}
                        </span>
                      ))}
                    </div>
                  )}
                </Card>
              )
            })
          )}
        </div>

        {/* Detalhes 360° do Cliente Selecionado */}
        {selectedClient && (
          <div className="lg:col-span-7 space-y-4">
            <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
              <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg font-bold text-slate-900 dark:text-slate-100">
                      {selectedClient.name}
                    </CardTitle>
                    <CardDescription className="text-xs">
                      CNPJ/CPF: {selectedClient.document || 'Não cadastrado'} • Segmento:{' '}
                      {selectedClient.segment || 'Geral'}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenEditClientModal(selectedClient)}
                      className="text-xs text-indigo-600 border-indigo-200 hover:bg-indigo-50 dark:hover:bg-indigo-950"
                    >
                      <Edit2 className="h-3 w-3 mr-1" /> Editar
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onSelectClient(null)}
                      className="text-xs"
                    >
                      Fechar
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                {/* Contatos & Endereço */}
                <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-200/60 dark:border-slate-800">
                  <div>
                    <span className="text-muted-foreground block text-[11px]">
                      E-mail Comercial:
                    </span>
                    <span className="font-medium text-slate-900 dark:text-slate-100">
                      {selectedClient.email || 'Não informado'}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[11px]">
                      WhatsApp / Fone:
                    </span>
                    <span className="font-medium text-slate-900 dark:text-slate-100">
                      {selectedClient.whatsapp || selectedClient.phone || 'Não informado'}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[11px]">
                      Endereço Completo:
                    </span>
                    <span className="font-medium text-slate-900 dark:text-slate-100">
                      {selectedClient.address
                        ? `${selectedClient.address}, ${selectedClient.city}-${selectedClient.state}`
                        : 'Sem endereço'}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[11px]">
                      Responsável na Conta:
                    </span>
                    <span className="font-medium text-slate-900 dark:text-slate-100">
                      {selectedClient.assigned_to || 'Alex Nogueia'}
                    </span>
                  </div>
                </div>
                {/* Seção de Múltiplos Contatos / Responsáveis vinculados ao CNPJ */}
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5 text-indigo-600" />
                      <span>
                        Responsáveis & Contatos Vinculados (
                        {selectedClient.contacts ? selectedClient.contacts.length : 0})
                      </span>
                    </h4>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenEditClientModal(selectedClient)}
                      className="h-6 text-[10px] px-2 text-indigo-700 border-indigo-200"
                    >
                      <Plus className="h-3 w-3 mr-1" /> Gerenciar Contatos
                    </Button>
                  </div>

                  {selectedClient.contacts && selectedClient.contacts.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {selectedClient.contacts.map((contact, idx) => (
                        <div
                          key={contact.id || idx}
                          className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-1.5 text-xs"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                              <UserCheck className="h-3.5 w-3.5 text-teal-600" />
                              {contact.name}
                            </span>
                            {contact.role && (
                              <Badge variant="secondary" className="text-[9px]">
                                {contact.role}
                              </Badge>
                            )}
                          </div>

                          <div className="space-y-0.5 text-[11px] text-muted-foreground">
                            {contact.birth_date && (
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3 text-slate-400" />
                                <span>
                                  Nasc:{' '}
                                  <strong>
                                    {contact.birth_date.includes('-')
                                      ? contact.birth_date.split('-').reverse().join('/')
                                      : contact.birth_date}
                                  </strong>
                                </span>
                              </div>
                            )}
                            {contact.phone && (
                              <div className="flex items-center gap-1">
                                <Phone className="h-3 w-3 text-slate-400" />
                                <span>{contact.phone}</span>
                              </div>
                            )}
                            {contact.email && (
                              <div className="flex items-center gap-1 truncate">
                                <Mail className="h-3 w-3 text-slate-400" />
                                <span className="truncate">{contact.email}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs text-muted-foreground p-3 border border-dashed rounded-lg text-center bg-slate-50/30 dark:bg-slate-900/30">
                      Nenhum responsável específico cadastrado para este CNPJ.
                    </div>
                  )}
                </div>
                {/* Notas de Negócio */}
                {selectedClient.notes && (
                  <div className="text-xs p-3 rounded-lg bg-indigo-50/40 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/50">
                    <span className="font-semibold text-indigo-900 dark:text-indigo-300 block mb-1">
                      Anotações de Relacionamento:
                    </span>
                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                      {selectedClient.notes}
                    </p>
                  </div>
                )}
                {/* SEÇÃO 3: HISTÓRICO DE CONTATOS & INTERAÇÕES 360° (AUTOMÁTICO + NOTAS MANUAIS) */}
                <div className="space-y-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <History className="h-4 w-4 text-teal-600" />
                        Histórico de Interações & Atividades 360° ({combinedTimeline.length})
                      </h4>
                      <p className="text-[10px] text-muted-foreground">
                        Orçamentos, Ordens de Serviço, Chamados e Anotações de reuniões/ligações.
                      </p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => setIsAddNoteModalOpen(true)}
                      className="h-7 text-xs bg-teal-700 hover:bg-teal-600 text-white font-semibold"
                    >
                      <Plus className="h-3.5 w-3.5 mr-1" /> Adicionar Interação Manual
                    </Button>
                  </div>

                  {combinedTimeline.length === 0 ? (
                    <div className="text-xs text-muted-foreground p-4 border border-dashed rounded-xl text-center bg-slate-50/40 dark:bg-slate-900/40">
                      Nenhum histórico registrado ainda. Adicione uma nota de reunião, ligação ou
                      emita uma proposta.
                    </div>
                  ) : (
                    <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                      {combinedTimeline.map((item, idx) => (
                        <div
                          key={item.id || idx}
                          className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs space-y-1.5 text-xs transition-all hover:border-teal-400"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              {item.kind === 'quote' && (
                                <Badge className="bg-indigo-600 text-white text-[9px] px-1.5 py-0 flex items-center gap-1">
                                  <FileText className="h-3 w-3" /> Orçamento
                                </Badge>
                              )}
                              {item.kind === 'order' && (
                                <Badge className="bg-teal-700 text-white text-[9px] px-1.5 py-0 flex items-center gap-1">
                                  <Wrench className="h-3 w-3" /> OS de Campo
                                </Badge>
                              )}
                              {item.kind === 'ticket' && (
                                <Badge className="bg-amber-600 text-white text-[9px] px-1.5 py-0 flex items-center gap-1">
                                  <MessageSquare className="h-3 w-3" /> Chamado
                                </Badge>
                              )}
                              {item.kind === 'note' && (
                                <Badge className="bg-slate-700 text-white text-[9px] px-1.5 py-0 flex items-center gap-1">
                                  <History className="h-3 w-3" /> Contato Comercial
                                </Badge>
                              )}
                              <span className="font-bold text-slate-900 dark:text-slate-100">
                                {item.title}
                              </span>
                            </div>
                            <span className="text-[10px] text-muted-foreground shrink-0 font-mono">
                              {item.date.toLocaleDateString('pt-BR', {
                                day: '2-digit',
                                month: '2-digit',
                                year: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>

                          <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                            {item.detail}
                          </p>

                          {'author' in item && Boolean(item.author) && (
                            <span className="text-[10px] text-teal-700 dark:text-teal-400 font-semibold block pt-0.5">
                              Registrado por: {(item as any).author}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {/* Histórico de Manutenções por Equipamento deste Cliente */}
                <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-teal-800 dark:text-teal-400 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Wrench className="h-3.5 w-3.5" />
                      Histórico Técnico de Trocadores & OS Concluídas (
                      {activeClientServiceOrders.length})
                    </span>
                  </h4>
                  {activeClientServiceOrders.length === 0 ? (
                    <div className="text-xs text-muted-foreground p-3 border border-dashed rounded-lg text-center bg-slate-50/40 dark:bg-slate-900/40">
                      Nenhuma Ordem de Serviço emitida para este cliente até o momento.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                      {activeClientServiceOrders.map((so) => (
                        <div
                          key={so.id}
                          className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs space-y-1 hover:border-teal-400 transition-all"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-mono font-bold text-teal-700 dark:text-teal-400 text-[11px]">
                              OS #{so.order_number || so.quote_number || so.id.slice(0, 6)}
                            </span>
                            <Badge variant="outline" className="text-[9px] uppercase">
                              {so.status}
                            </Badge>
                          </div>
                          <p className="font-semibold text-slate-900 dark:text-slate-100 text-[11px]">
                            {so.title}
                          </p>
                          <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-0.5">
                            <span>🔧 {so.equipment_model || 'Trocador BERMO'}</span>
                            <span className="font-bold text-slate-900 dark:text-slate-100">
                              {(so.total_value || so.final_price || 0).toLocaleString('pt-BR', {
                                style: 'currency',
                                currency: 'BRL',
                              })}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {/* Histórico de Oportunidades do Funil */}
                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center justify-between">
                    <span>Oportunidades em Aberto no Funil ({activeClientDeals.length})</span>
                  </h4>
                  {activeClientDeals.length === 0 ? (
                    <div className="text-xs text-muted-foreground p-2.5 border border-dashed rounded-lg text-center">
                      Nenhuma oportunidade cadastrada no funil para este cliente.
                    </div>
                  ) : (
                    activeClientDeals.map((d) => (
                      <div
                        key={d.id}
                        className="flex items-center justify-between p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 text-xs"
                      >
                        <div>
                          <div className="font-semibold text-slate-900 dark:text-slate-100">
                            {d.title}
                          </div>
                          <div className="text-[11px] text-muted-foreground">
                            Etapa: {d.stage} • Probabilidade: {d.probability}%
                          </div>
                        </div>
                        <div className="font-bold text-slate-900 dark:text-slate-100">
                          {(d.value || 0).toLocaleString('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          })}
                        </div>
                      </div>
                    ))
                  )}
                </div>{' '}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
      {/* Modal Adicionar Nota Manual de Interação com o Cliente */}
      <Dialog open={isAddNoteModalOpen} onOpenChange={setIsAddNoteModalOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <History className="h-5 w-5 text-teal-600" />
              Registrar Interação com {selectedClient?.name}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveInteractionNote} className="space-y-3 py-2 text-xs">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Tipo de Interação *</Label>
              <Select value={noteType} onValueChange={(v: any) => setNoteType(v)}>
                <SelectTrigger className="text-xs h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="call" className="text-xs">
                    📞 Ligação Telefônica / WhatsApp
                  </SelectItem>
                  <SelectItem value="meeting" className="text-xs">
                    🤝 Reunião Presencial / Online
                  </SelectItem>
                  <SelectItem value="email" className="text-xs">
                    ✉️ E-mail / Envio de Documento
                  </SelectItem>
                  <SelectItem value="visit" className="text-xs">
                    🚗 Visita Técnica na Planta
                  </SelectItem>
                  <SelectItem value="note" className="text-xs">
                    📝 Anotação Interna da Conta
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Assunto / Título *</Label>
              <Input
                required
                placeholder="Ex: Alinhamento de prazo de entrega de gaxetas"
                value={noteTitle}
                onChange={(e) => setNoteTitle(e.target.value)}
                className="text-xs h-8"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">
                Resumo da Conversa & Próximos Passos *
              </Label>
              <Textarea
                required
                rows={4}
                placeholder="Ex: Conversado com Eng. Carlos. Cliente aceitou proposta para execução no próximo fim de semana..."
                value={noteDescription}
                onChange={(e) => setNoteDescription(e.target.value)}
                className="text-xs"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsAddNoteModalOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                size="sm"
                className="bg-teal-700 hover:bg-teal-600 text-white font-semibold"
              >
                Salvar no Histórico
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      {/* Modal Criar / Editar Cliente */}{' '}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">
              {editingClientId
                ? 'Editar Dados do Cliente / Conta'
                : 'Cadastrar Novo Cliente / Conta'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveClient} className="space-y-4 py-2">
            {/* Dados Cadastrais Principais */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider block">
                1. Dados da Empresa (Pessoa Jurídica / Física)
              </span>

              <div className="space-y-1">
                <Label className="text-xs font-medium">Razão Social / Nome Completo *</Label>
                <Input
                  required
                  placeholder="Ex: Sigma Soluções Industriais Ltda"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="text-xs bg-white dark:bg-slate-950"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-medium">Nome Fantasia</Label>
                  <Input
                    placeholder="Sigma Tech"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="text-xs bg-white dark:bg-slate-950"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-medium">CNPJ / CPF</Label>
                  <Input
                    placeholder="00.000.000/0001-00"
                    value={document}
                    onChange={(e) => setDocument(e.target.value)}
                    className="text-xs bg-white dark:bg-slate-950"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-medium">E-mail Geral da Empresa</Label>
                  <Input
                    type="email"
                    placeholder="comercial@sigma.com.br"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="text-xs bg-white dark:bg-slate-950"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-medium">Telefone Geral / Recepção</Label>
                  <Input
                    placeholder="(11) 99999-8888"
                    value={whatsapp}
                    onChange={(e) => {
                      setWhatsapp(e.target.value)
                      setPhone(e.target.value)
                    }}
                    className="text-xs bg-white dark:bg-slate-950"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-medium">Segmento</Label>
                  <Input
                    placeholder="Alimentos / Sucroalcooleiro"
                    value={segment}
                    onChange={(e) => setSegment(e.target.value)}
                    className="text-xs bg-white dark:bg-slate-950"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-medium">Cidade</Label>
                  <Input
                    placeholder="São Paulo"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="text-xs bg-white dark:bg-slate-950"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-medium">UF</Label>
                  <Input
                    placeholder="SP"
                    maxLength={2}
                    value={state}
                    onChange={(e) => setState(e.target.value.toUpperCase())}
                    className="text-xs bg-white dark:bg-slate-950"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-medium">Status do Relacionamento</Label>
                  <Select value={status} onValueChange={(v) => setStatus(v as ClientStatus)}>
                    <SelectTrigger className="text-xs bg-white dark:bg-slate-950">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lead" className="text-xs">
                        Lead Inbound
                      </SelectItem>
                      <SelectItem value="prospect" className="text-xs">
                        Prospect Qualificado
                      </SelectItem>
                      <SelectItem value="active" className="text-xs">
                        Cliente Ativo
                      </SelectItem>
                      <SelectItem value="partner" className="text-xs">
                        Parceiro
                      </SelectItem>
                      <SelectItem value="churned" className="text-xs">
                        Inativo / Churned
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-medium">Score da Conta (0-100)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={score}
                    onChange={(e) => setScore(e.target.value)}
                    className="text-xs bg-white dark:bg-slate-950"
                  />
                </div>
              </div>
            </div>

            {/* SEÇÃO 2: MÚLTIPLOS CONTATOS / RESPONSÁVEIS POR CNPJ */}
            <div className="p-3.5 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-900/60 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-indigo-950 dark:text-indigo-200 uppercase tracking-wider flex items-center gap-1.5">
                    <Users className="h-4 w-4 text-indigo-600" />
                    2. Contatos & Responsáveis do Cliente (Múltiplos por CNPJ)
                  </span>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Cadastre múltiplos responsáveis como Manutenção, Engenharia, Compras, etc.
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleAddContact}
                  className="h-7 text-xs border-indigo-300 text-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-950"
                >
                  <Plus className="h-3.5 w-3.5 mr-1" /> Adicionar Contato
                </Button>
              </div>

              {contacts.length === 0 ? (
                <div className="p-3 text-xs text-muted-foreground bg-white dark:bg-slate-950 rounded-lg border border-dashed text-center">
                  Nenhum contato adicionado. Clique no botão acima para adicionar um responsável.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {contacts.map((contact, index) => (
                    <div
                      key={contact.id || index}
                      className="p-3 rounded-lg bg-white dark:bg-slate-950 border border-indigo-100 dark:border-indigo-900 space-y-2 relative"
                    >
                      <div className="flex items-center justify-between pb-1 border-b border-slate-100 dark:border-slate-800">
                        <span className="text-[11px] font-bold text-indigo-700 dark:text-indigo-400">
                          Responsável #{index + 1}
                        </span>
                        {contacts.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveContact(index)}
                            className="h-6 w-6 p-0 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950"
                            title="Remover este contato"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <div className="space-y-1">
                          <Label className="text-[10px] font-semibold text-slate-700 dark:text-slate-300">
                            Nome do Responsável *
                          </Label>
                          <Input
                            placeholder="Ex: Eng. Carlos Alberto"
                            value={contact.name}
                            onChange={(e) => handleUpdateContact(index, 'name', e.target.value)}
                            className="text-xs h-8"
                          />
                        </div>

                        <div className="space-y-1">
                          <Label className="text-[10px] font-semibold text-slate-700 dark:text-slate-300">
                            Data de Nascimento
                          </Label>
                          <Input
                            type="date"
                            value={contact.birth_date || ''}
                            onChange={(e) =>
                              handleUpdateContact(index, 'birth_date', e.target.value)
                            }
                            className="text-xs h-8"
                          />
                        </div>

                        <div className="space-y-1">
                          <Label className="text-[10px] font-semibold text-slate-700 dark:text-slate-300">
                            Função / Cargo
                          </Label>
                          <Input
                            placeholder="Ex: Gerente de Manutenção"
                            value={contact.role || ''}
                            onChange={(e) => handleUpdateContact(index, 'role', e.target.value)}
                            className="text-xs h-8"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-0.5">
                        <div className="space-y-1">
                          <Label className="text-[10px] text-muted-foreground">
                            Telefone / WhatsApp Direto
                          </Label>
                          <Input
                            placeholder="(47) 99888-7766"
                            value={contact.phone || ''}
                            onChange={(e) => handleUpdateContact(index, 'phone', e.target.value)}
                            className="text-xs h-7"
                          />
                        </div>

                        <div className="space-y-1">
                          <Label className="text-[10px] text-muted-foreground">E-mail Direto</Label>
                          <Input
                            type="email"
                            placeholder="carlos@empresa.com.br"
                            value={contact.email || ''}
                            onChange={(e) => handleUpdateContact(index, 'email', e.target.value)}
                            className="text-xs h-7"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Observações */}
            <div className="space-y-1">
              <Label className="text-xs font-medium">Observações Estratégicas</Label>
              <Textarea
                rows={2}
                placeholder="Principais decisores, dores do negócio, prazo de fechamento..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
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
                {editingClientId ? 'Salvar Alterações' : 'Salvar Cliente'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
