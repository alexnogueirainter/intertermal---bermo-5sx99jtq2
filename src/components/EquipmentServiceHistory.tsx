import React, { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  History,
  Wrench,
  Search,
  Building2,
  Calendar,
  Layers,
  CheckCircle2,
  Clock,
  ShieldCheck,
  FileText,
  DollarSign,
  ChevronRight,
  Filter,
  CheckCircle,
  AlertCircle,
} from 'lucide-react'
import type { ServiceOrderRecord, ClientRecord, QuoteRecord } from '@/types/crm'

interface EquipmentServiceHistoryProps {
  clients: ClientRecord[]
  serviceOrders: ServiceOrderRecord[]
  quotes?: QuoteRecord[]
  selectedClientId?: string
}

interface EquipmentMaintenanceEvent {
  id: string
  orderNumber: string
  quoteNumber?: string
  date: string
  clientName: string
  clientId?: string
  equipmentModel: string
  equipmentBrand: string
  title: string
  status: string
  totalValue: number
  servicesSummary: string[]
  notes?: string
  approvedBy?: string
  technicalDetails?: any
  isCompleted: boolean
}

export const EquipmentServiceHistory: React.FC<EquipmentServiceHistoryProps> = ({
  clients,
  serviceOrders,
  quotes = [],
  selectedClientId: initialClientId,
}) => {
  const [selectedClientId, setSelectedClientId] = useState<string>(initialClientId || 'all')
  const [selectedEquipmentModel, setSelectedEquipmentModel] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [onlyCompleted, setOnlyCompleted] = useState(false)

  // Extrair todos os modelos de equipamentos distintos presentes nas OS e propostas
  const equipmentModelsList = useMemo(() => {
    const set = new Set<string>()
    serviceOrders.forEach((so) => {
      if (so.equipment_model) set.add(so.equipment_model)
      if (so.equipment_info?.model) set.add(so.equipment_info.model)
    })
    quotes.forEach((q) => {
      if (q.equipment_model) set.add(q.equipment_model)
      if (q.equipments && Array.isArray(q.equipments)) {
        q.equipments.forEach((eq) => eq.model && set.add(eq.model))
      }
    })
    return Array.from(set).filter(Boolean)
  }, [serviceOrders, quotes])

  // Gerar eventos cronológicos de manutenção
  const maintenanceEvents: EquipmentMaintenanceEvent[] = useMemo(() => {
    const list: EquipmentMaintenanceEvent[] = []

    serviceOrders.forEach((so) => {
      const equipModel =
        so.equipment_model ||
        (so.equipment_info?.model as string) ||
        (so.title?.includes('BP') ? 'BERMO BP' : 'Trocador BERMO')
      const equipBrand = so.equipment_brand || (so.equipment_info?.brand as string) || 'BERMO'

      const date = so.created || so.updated || new Date().toISOString()
      const isCompleted =
        so.status === 'fechado' || so.status === 'completed' || so.status === 'inspecao'

      const servicesSummary: string[] = []
      if (so.services && Array.isArray(so.services)) {
        so.services.forEach((s: any) => {
          if (s.description) servicesSummary.push(s.description)
          else if (s.service_name) servicesSummary.push(s.service_name)
        })
      }

      list.push({
        id: so.id,
        orderNumber: so.order_number || so.code || so.id.slice(0, 6),
        quoteNumber: so.quote_number,
        date,
        clientName: so.client_name || 'Cliente Industrial',
        clientId: so.client_id,
        equipmentModel: equipModel,
        equipmentBrand: equipBrand,
        title: so.title || `Manutenção e Revisão Térmica - ${equipModel}`,
        status: so.status,
        totalValue: so.total_value || so.final_price || 0,
        servicesSummary,
        notes: so.notes,
        approvedBy: so.approved_by,
        technicalDetails: so.technical_details,
        isCompleted,
      })
    })

    // Ordenar de forma cronológica decrescente (mais recentes primeiro)
    return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [serviceOrders])

  // Filtragem
  const filteredEvents = useMemo(() => {
    return maintenanceEvents.filter((ev) => {
      const term = searchTerm.toLowerCase()
      const matchesTerm =
        !term ||
        ev.clientName.toLowerCase().includes(term) ||
        ev.equipmentModel.toLowerCase().includes(term) ||
        ev.orderNumber.toLowerCase().includes(term) ||
        ev.title.toLowerCase().includes(term)

      const matchesClient = selectedClientId === 'all' || ev.clientId === selectedClientId
      const matchesModel =
        selectedEquipmentModel === 'all' ||
        ev.equipmentModel.toLowerCase() === selectedEquipmentModel.toLowerCase()
      const matchesCompleted = !onlyCompleted || ev.isCompleted

      return matchesTerm && matchesClient && matchesModel && matchesCompleted
    })
  }, [maintenanceEvents, searchTerm, selectedClientId, selectedEquipmentModel, onlyCompleted])

  // Agrupamento por Equipamento/Cliente
  const selectedClientRecord = clients.find((c) => c.id === selectedClientId)

  return (
    <div className="space-y-5">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h3 className="text-lg md:text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <History className="h-5 w-5 text-teal-700 dark:text-teal-400" />
            Histórico Técnico de Serviços por Cliente e Equipamento
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Linha do tempo de manutenções preventivas, corretivas e testes hidrostáticos realizados
            em cada trocador BERMO.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className="text-xs font-mono px-3 py-1 bg-white dark:bg-slate-900 border-teal-200 dark:border-teal-800 text-teal-800 dark:text-teal-300"
          >
            {filteredEvents.length} registro(s) localizados
          </Badge>
        </div>
      </div>

      {/* Barra de Filtros Integrada */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
        {/* Busca por texto */}
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por OS, cliente, modelo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8 text-xs h-9 bg-slate-50 dark:bg-slate-950"
          />
        </div>

        {/* Filtro por Cliente */}
        <Select value={selectedClientId} onValueChange={setSelectedClientId}>
          <SelectTrigger className="text-xs h-9 bg-slate-50 dark:bg-slate-950">
            <Building2 className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
            <SelectValue placeholder="Cliente..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs">
              Todos os Clientes
            </SelectItem>
            {clients.map((c) => (
              <SelectItem key={c.id} value={c.id} className="text-xs">
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Filtro por Modelo de Trocador */}
        <Select value={selectedEquipmentModel} onValueChange={setSelectedEquipmentModel}>
          <SelectTrigger className="text-xs h-9 bg-slate-50 dark:bg-slate-950">
            <Layers className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
            <SelectValue placeholder="Modelo do Equipamento..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs">
              Todos os Modelos BERMO
            </SelectItem>
            {equipmentModelsList.map((m) => (
              <SelectItem key={m} value={m} className="text-xs">
                {m}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Toggle Apenas Concluídos */}
        <Button
          type="button"
          variant={onlyCompleted ? 'default' : 'outline'}
          size="sm"
          onClick={() => setOnlyCompleted(!onlyCompleted)}
          className={`text-xs h-9 ${
            onlyCompleted
              ? 'bg-teal-700 hover:bg-teal-600 text-white'
              : 'text-slate-700 dark:text-slate-300'
          }`}
        >
          <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
          {onlyCompleted ? 'Apenas Concluídas' : 'Todas as OS'}
        </Button>
      </div>

      {/* Timeline Cronológica */}
      {filteredEvents.length === 0 ? (
        <Card className="p-10 text-center text-muted-foreground bg-white/50 dark:bg-slate-900/50 border-dashed">
          <History className="h-10 w-10 mx-auto text-teal-600/40 mb-2" />
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            Nenhuma manutenção registrada para os filtros selecionados
          </p>
          <p className="text-xs mt-1">
            À medida que as propostas forem aprovadas e executadas, o histórico técnico deste
            equipamento será montado automaticamente aqui.
          </p>
        </Card>
      ) : (
        <div className="relative border-l-2 border-teal-600 dark:border-teal-700 ml-4 pl-6 space-y-6">
          {filteredEvents.map((ev, index) => {
            const dateObj = new Date(ev.date)
            const formattedDate = dateObj.toLocaleDateString('pt-BR', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
            })
            const formattedTime = dateObj.toLocaleTimeString('pt-BR', {
              hour: '2-digit',
              minute: '2-digit',
            })

            return (
              <div key={ev.id} className="relative group">
                {/* Marcador na linha do tempo */}
                <div className="absolute -left-[31px] top-1.5 h-4 w-4 rounded-full bg-teal-700 border-4 border-white dark:border-slate-950 group-hover:scale-125 transition-transform" />

                {/* Card de Manutenção */}
                <Card className="border border-slate-200 dark:border-slate-800 shadow-2xs hover:shadow-md transition-all bg-white dark:bg-slate-900 overflow-hidden">
                  <div className="bg-slate-50 dark:bg-slate-950/80 px-4 py-2.5 border-b border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-teal-800 dark:text-teal-300 bg-teal-50 dark:bg-teal-950 px-2 py-0.5 rounded border border-teal-200 dark:border-teal-800">
                        OS #{ev.orderNumber}
                      </span>
                      {ev.quoteNumber && (
                        <span className="text-[11px] text-muted-foreground font-mono">
                          (Proposta #{ev.quoteNumber})
                        </span>
                      )}
                      <Badge
                        variant={ev.isCompleted ? 'default' : 'secondary'}
                        className={`text-[10px] font-semibold uppercase ${
                          ev.isCompleted
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        }`}
                      >
                        {ev.status}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
                      <Calendar className="h-3.5 w-3.5 text-teal-600" />
                      <span>
                        {formattedDate} às {formattedTime}
                      </span>
                    </div>
                  </div>

                  <CardContent className="p-4 space-y-3">
                    {/* Título & Detalhes do Cliente/Equipamento */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                      <div>
                        <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                          {ev.title}
                        </h4>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                          <span className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
                            <Building2 className="h-3.5 w-3.5 text-teal-600" />
                            {ev.clientName}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1 text-teal-800 dark:text-teal-300 font-semibold bg-teal-50 dark:bg-teal-950/60 px-1.5 py-0.5 rounded">
                            <Layers className="h-3 w-3" />
                            {ev.equipmentBrand} - {ev.equipmentModel}
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] text-muted-foreground block">
                          Valor da Ordem:
                        </span>
                        <span className="font-bold text-base text-slate-900 dark:text-slate-100">
                          {ev.totalValue.toLocaleString('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          })}
                        </span>
                      </div>
                    </div>

                    {/* Serviços executados */}
                    {ev.servicesSummary.length > 0 && (
                      <div className="bg-slate-50 dark:bg-slate-950 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800/80 text-xs space-y-1">
                        <span className="font-semibold text-slate-700 dark:text-slate-300 block text-[11px]">
                          Procedimentos Técnicos Realizados ({ev.servicesSummary.length}):
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-[11px] text-slate-600 dark:text-slate-400">
                          {ev.servicesSummary.map((srv, idx) => (
                            <div key={idx} className="flex items-start gap-1.5 truncate">
                              <CheckCircle className="h-3 w-3 text-teal-600 shrink-0 mt-0.5" />
                              <span className="truncate">{srv}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Notas e Aceite */}
                    {ev.notes && (
                      <p className="text-xs text-slate-600 dark:text-slate-400 italic bg-amber-50/40 dark:bg-amber-950/20 p-2 rounded border border-amber-100 dark:border-amber-900/40">
                        "{ev.notes}"
                      </p>
                    )}

                    {ev.approvedBy && (
                      <div className="text-[11px] text-emerald-800 dark:text-emerald-300 flex items-center gap-1 pt-1">
                        <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                        <span>
                          Aprovação Técnica / Digital: <strong>{ev.approvedBy}</strong>
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
