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
  Wrench,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Calendar,
  Layers,
  Flame,
  UserCheck,
  Building2,
  Tag,
} from 'lucide-react'
import type {
  ServiceRecord,
  ClientRecord,
  DealRecord,
  ServiceStatus,
  ServiceType,
} from '@/types/crm'

interface ServicesManagerProps {
  services: ServiceRecord[]
  clients: ClientRecord[]
  deals: DealRecord[]
  onCreateService: (data: Partial<ServiceRecord>) => void
}

export const ServicesManager: React.FC<ServicesManagerProps> = ({
  services,
  clients,
  deals,
  onCreateService,
}) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  // Form State
  const [title, setTitle] = useState('')
  const [serviceType, setServiceType] = useState<ServiceType>('maintenance')
  const [clientId, setClientId] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [monthlyValue, setMonthlyValue] = useState<number>(0)
  const [notes, setNotes] = useState('')

  const filteredServices = services.filter((s) => {
    const matchesSearch =
      s.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.client_name && s.client_name.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesStatus = statusFilter === 'all' || s.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    const client = clients.find((c) => c.id === clientId)
    onCreateService({
      title,
      service_type: serviceType,
      client_id: clientId || undefined,
      client_name: client ? client.name : undefined,
      status: 'planning',
      start_date: startDate || new Date().toISOString(),
      end_date: endDate || undefined,
      monthly_value: Number(monthlyValue) || 0,
      notes,
    })
    setIsCreateModalOpen(false)
    setTitle('')
    setNotes('')
    setMonthlyValue(0)
  }

  const getStatusBadge = (status?: ServiceStatus) => {
    switch (status) {
      case 'in_progress':
        return <Badge className="bg-blue-600 text-white text-[10px]">Em Execução</Badge>
      case 'completed':
        return <Badge className="bg-emerald-600 text-white text-[10px]">Concluído</Badge>
      case 'pending_client':
        return <Badge className="bg-amber-600 text-white text-[10px]">Aguardando Fábrica</Badge>
      case 'planning':
        return <Badge className="bg-slate-600 text-white text-[10px]">Planejamento</Badge>
      default:
        return (
          <Badge variant="outline" className="text-[10px]">
            {status}
          </Badge>
        )
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Wrench className="h-6 w-6 text-teal-600 dark:text-teal-400" />
            Ordens de Serviço & Manutenção BERMO
          </h2>
          <p className="text-xs md:text-sm text-muted-foreground mt-0.5">
            Acompanhamento de equipes técnicas em campo, trocas de gaxetas, revisões de válvulas e
            comissionamento.
          </p>
        </div>
        <Button
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-teal-700 hover:bg-teal-600 text-white text-xs"
        >
          <Plus className="h-4 w-4 mr-1.5" />
          Nova Ordem de Serviço
        </Button>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar ordem de serviço ou cliente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 text-xs"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48 text-xs">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Status</SelectItem>
            <SelectItem value="planning">Planejamento</SelectItem>
            <SelectItem value="in_progress">Em Execução</SelectItem>
            <SelectItem value="pending_client">Aguardando Fábrica</SelectItem>
            <SelectItem value="completed">Concluído</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Grid de Serviços */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredServices.map((s) => (
          <Card
            key={s.id}
            className="border-slate-200 dark:border-slate-800 hover:border-teal-500/50 transition-all flex flex-col justify-between"
          >
            <CardHeader className="pb-2.5">
              <div className="flex items-start justify-between gap-2">
                <Badge
                  variant="outline"
                  className="text-[10px] font-mono uppercase text-teal-700 dark:text-teal-400"
                >
                  {s.service_type || 'Manutenção'}
                </Badge>
                {getStatusBadge(s.status)}
              </div>
              <CardTitle className="text-sm font-bold mt-2 text-slate-900 dark:text-slate-100 line-clamp-1">
                {s.title}
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                <Building2 className="h-3.5 w-3.5" />
                {s.client_name || 'Cliente Industrial'}
              </CardDescription>
            </CardHeader>

            <CardContent className="pt-0 space-y-3">
              {s.notes && (
                <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 bg-slate-50 dark:bg-slate-900 p-2 rounded-lg border border-slate-100 dark:border-slate-800">
                  {s.notes}
                </p>
              )}

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <div className="text-muted-foreground flex items-center gap-1 text-[11px]">
                  <Calendar className="h-3 w-3" />
                  {s.start_date
                    ? new Date(s.start_date).toLocaleDateString('pt-BR')
                    : 'Data a definir'}
                </div>
                {s.monthly_value ? (
                  <span className="font-bold text-slate-900 dark:text-slate-100">
                    {s.monthly_value.toLocaleString('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    })}
                  </span>
                ) : null}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Modal Nova OS */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">Nova Ordem de Serviço BERMO</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreate} className="space-y-4 py-2">
            <div className="space-y-1">
              <Label className="text-xs">Título / Escopo do Serviço *</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="ex: Limpeza CIP e Troca de Gaxetas em Trocador BP6"
                className="text-xs"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Tipo de Serviço</Label>
                <Select value={serviceType} onValueChange={(v) => setServiceType(v as ServiceType)}>
                  <SelectTrigger className="text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="maintenance">Manutenção Preventiva</SelectItem>
                    <SelectItem value="installation">Instalação & Start-up</SelectItem>
                    <SelectItem value="support">Revisão Corretiva</SelectItem>
                    <SelectItem value="consulting">Auditoria Térmica</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Cliente Industrial</Label>
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
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Data de Início Prevista</Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Valor do Serviço (R$)</Label>
                <Input
                  type="number"
                  value={monthlyValue}
                  onChange={(e) => setMonthlyValue(Number(e.target.value))}
                  placeholder="0.00"
                  className="text-xs"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Observações Técnicas / Peças</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Observações sobre placas, gaxetas, vedações ou ferramental especial..."
                className="text-xs h-20"
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsCreateModalOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" size="sm" className="bg-teal-700 hover:bg-teal-600 text-white">
                Criar Ordem de Serviço
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
