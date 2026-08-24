import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  FileCode2,
  Calendar,
  CheckCircle2,
  Clock,
  Building2,
  Plus,
  Repeat,
  DollarSign,
} from 'lucide-react'
import type { ServiceRecord, ServiceStatus, ServiceType, ClientRecord } from '@/types/crm'

interface ServicesManagerProps {
  services: ServiceRecord[]
  clients: ClientRecord[]
  onCreateService: (data: Partial<ServiceRecord>) => void
  onUpdateService: (id: string, data: Partial<ServiceRecord>) => void
}

const TYPE_CONFIG: Record<ServiceType, { label: string; color: string }> = {
  installation: {
    label: 'Implantação & Setup',
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300',
  },
  training: {
    label: 'Treinamento de Equipe',
    color: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300',
  },
  support: {
    label: 'Suporte Dedicado',
    color: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
  },
  maintenance: {
    label: 'Manutenção Preventiva',
    color: 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300',
  },
  consulting: {
    label: 'Consultoria Estratégica',
    color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300',
  },
  contract: {
    label: 'Contrato Recorrente (SaaS)',
    color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
  },
}

export const ServicesManager: React.FC<ServicesManagerProps> = ({
  services,
  clients,
  onCreateService,
  onUpdateService,
}) => {
  const [selectedService, setSelectedService] = useState<ServiceRecord | null>(services[0] || null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Form states
  const [title, setTitle] = useState('')
  const [clientId, setClientId] = useState('')
  const [serviceType, setServiceType] = useState<ServiceType>('installation')
  const [monthlyValue, setMonthlyValue] = useState('')
  const [notes, setNotes] = useState('')

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    const client = clients.find((c) => c.id === clientId)

    onCreateService({
      title,
      client_id: clientId || undefined,
      client_name: client ? client.name : 'Cliente Corporativo',
      service_type: serviceType,
      status: 'in_progress',
      monthly_value: Number(monthlyValue) || 0,
      assigned_to: 'Alexandre Nogueira',
      notes,
      checklist: [
        { id: 'c-1', text: 'Alinhamento inicial de escopo e expectativas', completed: true },
        { id: 'c-2', text: 'Parametrização do ambiente do cliente', completed: true },
        { id: 'c-3', text: 'Treinamento dos usuários e homologação', completed: false },
        { id: 'c-4', text: 'Go-live e emissão de termo de aceite', completed: false },
      ],
      stages: [
        { name: 'Diagnóstico & Escopo', date: 'Semana 1', status: 'done' },
        { name: 'Execução & Integração', date: 'Semana 2-3', status: 'active' },
        { name: 'Validação & Treinamento', date: 'Semana 4', status: 'pending' },
      ],
    })

    setTitle('')
    setClientId('')
    setMonthlyValue('')
    setNotes('')
    setIsModalOpen(false)
  }

  const handleToggleChecklist = (checklistIndex: number) => {
    if (!selectedService || !selectedService.checklist) return

    const updatedChecklist = [...selectedService.checklist]
    updatedChecklist[checklistIndex].completed = !updatedChecklist[checklistIndex].completed
    if (updatedChecklist[checklistIndex].completed) {
      updatedChecklist[checklistIndex].completed_at = new Date().toISOString()
    }

    onUpdateService(selectedService.id, { checklist: updatedChecklist })
    setSelectedService({ ...selectedService, checklist: updatedChecklist })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Repeat className="h-6 w-6 text-indigo-600" />
            Contratos, Serviços & Implantação
          </h2>
          <p className="text-xs md:text-sm text-muted-foreground mt-0.5">
            Modelo de entregáveis pós-venda, checklists de onboarding e controle de recorrência.
          </p>
        </div>
        <Button
          onClick={() => setIsModalOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-500 shadow-sm"
        >
          <Plus className="h-4 w-4 mr-1.5" />
          Novo Contrato / Serviço
        </Button>
      </div>

      {/* Grid: Lista de Serviços + Detalhes do Onboarding */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Lista de Contratos/Projetos */}
        <div className="lg:col-span-5 space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-1">
            Contratos em Andamento ({services.length})
          </div>

          {services.map((srv) => {
            const isSelected = selectedService?.id === srv.id
            const typeInfo = srv.service_type ? TYPE_CONFIG[srv.service_type] : TYPE_CONFIG.contract
            const completedChecklist = srv.checklist?.filter((c) => c.completed).length || 0
            const totalChecklist = srv.checklist?.length || 0

            return (
              <Card
                key={srv.id}
                onClick={() => setSelectedService(srv)}
                className={`p-3.5 cursor-pointer transition-all border ${
                  isSelected
                    ? 'border-indigo-600 ring-2 ring-indigo-500/20 bg-indigo-50/20 dark:bg-indigo-950/20'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      {srv.title}
                    </h3>
                    <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                      <Building2 className="h-3 w-3" />
                      {srv.client_name}
                    </div>
                  </div>
                  <Badge className={`text-[9px] ${typeInfo.color}`}>{typeInfo.label}</Badge>
                </div>

                <div className="flex items-center justify-between pt-2.5 mt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                  <span className="font-semibold text-slate-900 dark:text-slate-100">
                    {srv.monthly_value
                      ? `${srv.monthly_value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}/mês`
                      : 'Valor pontual'}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    Checklist: {completedChecklist}/{totalChecklist} concluídos
                  </span>
                </div>
              </Card>
            )
          })}
        </div>

        {/* Detalhes do Serviço / Checklists & Etapas */}
        <div className="lg:col-span-7">
          {selectedService ? (
            <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
              <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100">
                      {selectedService.title}
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Cliente: <strong>{selectedService.client_name}</strong> • Responsável:{' '}
                      <strong>{selectedService.assigned_to || 'Alexandre Nogueira'}</strong>
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="text-xs capitalize font-medium">
                    {selectedService.status === 'in_progress'
                      ? 'Em Execução'
                      : selectedService.status}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="p-4 space-y-6">
                {/* Linha do Tempo de Etapas (Roadmap de Implantação) */}
                {selectedService.stages && selectedService.stages.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      Roadmap de Etapas do Onboarding
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {selectedService.stages.map((stg, idx) => (
                        <div
                          key={idx}
                          className={`p-2.5 rounded-lg border text-xs space-y-1 ${
                            stg.status === 'done'
                              ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900 text-emerald-900 dark:text-emerald-300'
                              : stg.status === 'active'
                                ? 'bg-indigo-50 dark:bg-indigo-950/20 border-indigo-300 dark:border-indigo-800 text-indigo-900 dark:text-indigo-200 ring-1 ring-indigo-400'
                                : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500'
                          }`}
                        >
                          <div className="font-bold flex items-center justify-between">
                            <span>{stg.name}</span>
                            {stg.status === 'done' && (
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                            )}
                          </div>
                          <div className="text-[10px] text-muted-foreground">{stg.date}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Checklist de Entregáveis */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center justify-between">
                    <span>Checklist Operacional & Homologação</span>
                    <span className="text-[11px] font-normal text-muted-foreground">
                      Clique para marcar como concluído
                    </span>
                  </h4>

                  <div className="space-y-1.5 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 bg-slate-50/40 dark:bg-slate-900/40">
                    {selectedService.checklist && selectedService.checklist.length > 0 ? (
                      selectedService.checklist.map((item, idx) => (
                        <div
                          key={item.id || idx}
                          onClick={() => handleToggleChecklist(idx)}
                          className="flex items-center gap-2.5 p-2 rounded hover:bg-white dark:hover:bg-slate-800 cursor-pointer transition-colors"
                        >
                          <Checkbox checked={item.completed} />
                          <span
                            className={`text-xs ${
                              item.completed
                                ? 'line-through text-muted-foreground'
                                : 'text-slate-900 dark:text-slate-100 font-medium'
                            }`}
                          >
                            {item.text}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="text-xs text-muted-foreground p-3 text-center">
                        Nenhum item de checklist configurado.
                      </div>
                    )}
                  </div>
                </div>

                {/* Anotações de Suporte e Renovação */}
                {selectedService.notes && (
                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300">
                    <span className="font-bold text-slate-900 dark:text-slate-100 block mb-1">
                      Anotações de Gestão do Contrato:
                    </span>
                    {selectedService.notes}
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="p-12 text-center text-muted-foreground">
              <FileCode2 className="h-10 w-10 mx-auto text-slate-400 mb-2" />
              <p className="text-sm font-semibold">Nenhum serviço selecionado</p>
            </Card>
          )}
        </div>
      </div>

      {/* Modal Criar Serviço */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">
              Novo Contrato de Serviço / Onboarding
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-3.5 py-2">
            <div className="space-y-1">
              <Label className="text-xs font-medium">Título do Contrato / Escopo *</Label>
              <Input
                required
                placeholder="Ex: Implantação e Onboarding Completo 20h"
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
                <Label className="text-xs font-medium">Tipo de Serviço</Label>
                <Select value={serviceType} onValueChange={(v) => setServiceType(v as ServiceType)}>
                  <SelectTrigger className="text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="installation" className="text-xs">
                      Implantação
                    </SelectItem>
                    <SelectItem value="training" className="text-xs">
                      Treinamento
                    </SelectItem>
                    <SelectItem value="support" className="text-xs">
                      Suporte
                    </SelectItem>
                    <SelectItem value="consulting" className="text-xs">
                      Consultoria
                    </SelectItem>
                    <SelectItem value="contract" className="text-xs">
                      Contrato Recorrente
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-medium">Valor Mensal Recorrente (R$)</Label>
              <Input
                type="number"
                placeholder="Ex: 1200"
                value={monthlyValue}
                onChange={(e) => setMonthlyValue(e.target.value)}
                className="text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-medium">Notas de Execução</Label>
              <Input
                placeholder="Requisitos de rede, infraestrutura, datas-chave..."
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
                Salvar Serviço
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
