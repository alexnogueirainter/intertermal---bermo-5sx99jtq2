import React, { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  FileText,
  Search,
  Filter,
  Calendar,
  Clock,
  User,
  Building2,
  Phone,
  Briefcase,
  MapPin,
  Wrench,
  Layers,
  Thermometer,
  Gauge,
  Camera,
  Printer,
  ChevronRight,
  ArrowLeft,
  RefreshCw,
  Eye,
  Pencil,
  Maximize2,
  X,
  AlertCircle,
  Smartphone,
  CheckCircle2,
  Sparkles,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useRealtime } from '@/hooks/use-realtime'
import { fieldVisitsService, type FieldVisitRecord } from '@/services/field-visits'
import { FieldVisitPdfDialog } from '@/components/FieldVisitPdfDialog'
import {
  recordToFieldVisitData,
  STORAGE_KEY_CURRENT_VISIT,
  STORAGE_KEY_EMPLOYEE_NAME,
  type FieldVisitData,
} from '@/types/field-visit'

export default function ReceivedFieldVisitsPage() {
  const navigate = useNavigate()
  const [visits, setVisits] = useState<FieldVisitRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Filtros
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTechnician, setSelectedTechnician] = useState<string>('ALL')
  const [selectedWorkType, setSelectedWorkType] = useState<string>('ALL')

  // Visualização de Detalhe
  const [selectedVisitRecord, setSelectedVisitRecord] = useState<FieldVisitRecord | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)

  // Visualização de PDF
  const [isPdfOpen, setIsPdfOpen] = useState(false)
  const [pdfVisitData, setPdfVisitData] = useState<FieldVisitData | null>(null)

  // Modal para ampliar fotos (lightbox)
  const [lightboxImage, setLightboxImage] = useState<{
    url: string
    title: string
    subtitle?: string
  } | null>(null)

  // Carregar visitas do PocketBase
  const loadVisits = async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) setIsRefreshing(true)
      else setIsLoading(true)
      setError(null)
      const data = await fieldVisitsService.getAll()
      setVisits(data)
    } catch (err: any) {
      console.error('Erro ao carregar visitas recebidas:', err)
      setError(
        err.message ||
          'Não foi possível obter a lista de visitas técnicas. Verifique a conexão com o servidor.',
      )
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    loadVisits()
  }, [])

  // Inscrição em Tempo Real via hook useRealtime
  useRealtime<any>('field_visits', (event) => {
    const record = event.record as FieldVisitRecord
    if (event.action === 'create') {
      setVisits((prev) => {
        const exists = prev.some((v) => v.id === record.id)
        return exists ? prev.map((v) => (v.id === record.id ? record : v)) : [record, ...prev]
      })
    } else if (event.action === 'update') {
      setVisits((prev) => prev.map((v) => (v.id === record.id ? record : v)))
      setSelectedVisitRecord((prev) => (prev?.id === record.id ? record : prev))
    } else if (event.action === 'delete') {
      setVisits((prev) => prev.filter((v) => v.id !== record.id))
      setSelectedVisitRecord((prev) => (prev?.id === record.id ? null : prev))
    }
  })

  // Lista de técnicos únicos para filtro
  const techniciansList = useMemo(() => {
    const set = new Set<string>()
    visits.forEach((v) => {
      if (v.employee_name?.trim()) set.add(v.employee_name.trim())
    })
    return Array.from(set).sort((a, b) => a.localeCompare(b))
  }, [visits])

  // Filtragem combinada (busca textual em cliente, empresa, técnico, notas e modelo/série dos equipamentos)
  const filteredVisits = useMemo(() => {
    const query = searchTerm.toLowerCase().trim()

    return visits.filter((v) => {
      // Filtro de Técnico
      if (selectedTechnician !== 'ALL') {
        if ((v.employee_name || '').trim().toLowerCase() !== selectedTechnician.toLowerCase()) {
          return false
        }
      }

      // Filtro de Tipo de Trabalho
      if (selectedWorkType !== 'ALL') {
        if ((v.work_type || '') !== selectedWorkType) {
          return false
        }
      }

      // Se não há termo de busca textual
      if (!query) return true

      // Equipamentos associados
      let equipmentText = ''
      if (Array.isArray(v.equipment)) {
        equipmentText = v.equipment
          .map(
            (eq: any) =>
              `${eq.model || ''} ${eq.manufacturer || ''} ${eq.serialNumber || ''} ${eq.installedLocation || ''} ${eq.technicianNotes || ''}`,
          )
          .join(' ')
      } else if (typeof v.equipment === 'string') {
        equipmentText = v.equipment
      }

      const matchFields = [
        v.employee_name || '',
        v.client_name || '',
        v.company_name || '',
        v.client_role || '',
        v.client_contact || '',
        v.work_area || '',
        v.work_type || '',
        v.work_type_other || '',
        v.general_notes || '',
        v.visit_date || '',
        equipmentText,
      ]
        .join(' ')
        .toLowerCase()

      return matchFields.includes(query)
    })
  }, [visits, searchTerm, selectedTechnician, selectedWorkType])

  // Handlers para abrir detalhe e PDF
  const handleOpenDetail = (record: FieldVisitRecord) => {
    setSelectedVisitRecord(record)
    setIsDetailOpen(true)
  }

  const handleOpenPdf = (record: FieldVisitRecord) => {
    const { data } = recordToFieldVisitData(record)
    setPdfVisitData(data)
    setIsPdfOpen(true)
  }

  // Handler para editar a visita no modo formulário
  const handleEditVisit = (record: FieldVisitRecord) => {
    const { data } = recordToFieldVisitData(record)
    // Garantir que backendRecordId está definido para atualizar o mesmo registro
    data.backendRecordId = record.id
    data.crmStatus = 'enviada'
    data.lastSentAt = record.sent_at || record.created || data.lastSentAt

    // Salva no localStorage como rascunho de trabalho para carregamento imediato
    try {
      localStorage.setItem(STORAGE_KEY_CURRENT_VISIT, JSON.stringify(data))
      if (data.employeeName) {
        localStorage.setItem(STORAGE_KEY_EMPLOYEE_NAME, data.employeeName)
      }
    } catch (e) {
      console.warn('Erro ao salvar no localStorage para edição:', e)
    }

    // Navega para /visita-a-campo com query param ?id= e state com os dados
    navigate(`/visita-a-campo?id=${record.id}`, { state: { visitData: data } })
  }

  // Estatísticas rápidas do topo
  const stats = useMemo(() => {
    const total = visits.length
    const thisMonthPrefix = new Date().toISOString().slice(0, 7) // 'YYYY-MM'
    const thisMonth = visits.filter(
      (v) =>
        (v.visit_date && v.visit_date.startsWith(thisMonthPrefix)) ||
        (v.created && v.created.startsWith(thisMonthPrefix)),
    ).length

    let totalEquipments = 0
    let totalPhotos = 0
    visits.forEach((v) => {
      const eqList = Array.isArray(v.equipment)
        ? v.equipment
        : typeof v.equipment === 'string'
          ? (() => {
              try {
                return JSON.parse(v.equipment)
              } catch {
                return []
              }
            })()
          : []
      totalEquipments += eqList.length
      eqList.forEach((eq: any) => {
        if (eq.attachments && Array.isArray(eq.attachments)) {
          totalPhotos += eq.attachments.length
        } else if (eq.photoDataUrl) {
          totalPhotos += 1
        }
      })
    })

    return { total, thisMonth, totalEquipments, totalPhotos }
  }, [visits])

  // Informações da visita selecionada para o modal de detalhe
  const selectedDetail = useMemo(() => {
    if (!selectedVisitRecord) return null
    return recordToFieldVisitData(selectedVisitRecord)
  }, [selectedVisitRecord])

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col">
      {/* Top Header do Escritório */}
      <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="inline-flex items-center justify-center h-9 w-9 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-teal-50 hover:text-teal-700 transition-colors"
              title="Voltar ao Painel Geral"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>

            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm tracking-tight text-teal-800 dark:text-teal-400">
                  INTERTERMAL
                </span>
                <span className="text-[10px] bg-teal-100 dark:bg-teal-900/60 text-teal-800 dark:text-teal-300 font-bold px-1.5 py-0.5 rounded">
                  ESCRITÓRIO
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  Tempo Real Ativo
                </span>
              </div>
              <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 leading-tight">
                Visitas Recebidas a Campo
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/visita-a-campo"
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-teal-200 dark:border-teal-800 text-teal-800 dark:text-teal-300 bg-teal-50/50 dark:bg-teal-950/40 hover:bg-teal-100/60 transition-colors"
            >
              <Smartphone className="h-3.5 w-3.5" />
              Modo Técnico (Celular)
            </Link>

            <Button
              variant="outline"
              size="sm"
              onClick={() => loadVisits(true)}
              disabled={isRefreshing || isLoading}
              className="text-xs h-9"
              title="Recarregar lista"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 mr-1.5 ${isRefreshing ? 'animate-spin text-teal-600' : ''}`}
              />
              <span className="hidden sm:inline">Atualizar</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Banner de Boas-Vindas & Métricas do Mês */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-teal-200 dark:border-teal-900/50 bg-gradient-to-br from-teal-50/70 via-white to-emerald-50/40 dark:from-slate-900 dark:via-teal-950/20 dark:to-slate-900 shadow-2xs">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block">
                  Total de Visitas
                </span>
                <span className="text-2xl sm:text-3xl font-extrabold text-teal-900 dark:text-teal-300">
                  {stats.total}
                </span>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Registradas na base do CRM
                </p>
              </div>
              <div className="h-11 w-11 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-xs">
                <FileText className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 dark:border-slate-800 shadow-2xs">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block">
                  Neste Mês
                </span>
                <span className="text-2xl sm:text-3xl font-extrabold text-emerald-700 dark:text-emerald-400">
                  {stats.thisMonth}
                </span>
                <p className="text-[11px] text-muted-foreground mt-0.5">Atendimentos em campo</p>
              </div>
              <div className="h-11 w-11 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center justify-center">
                <Calendar className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 dark:border-slate-800 shadow-2xs">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block">
                  Equipamentos
                </span>
                <span className="text-2xl sm:text-3xl font-extrabold text-slate-800 dark:text-slate-100">
                  {stats.totalEquipments}
                </span>
                <p className="text-[11px] text-muted-foreground mt-0.5">Trocadores catalogados</p>
              </div>
              <div className="h-11 w-11 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center">
                <Layers className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 dark:border-slate-800 shadow-2xs">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block">
                  Fotos Anexadas
                </span>
                <span className="text-2xl sm:text-3xl font-extrabold text-teal-700 dark:text-teal-400">
                  {stats.totalPhotos}
                </span>
                <p className="text-[11px] text-muted-foreground mt-0.5">Registros fotográficos</p>
              </div>
              <div className="h-11 w-11 rounded-xl bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300 flex items-center justify-center">
                <Camera className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Barra de Filtro e Busca */}
        <Card className="border-slate-200 dark:border-slate-800 shadow-2xs">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
              {/* Campo de Busca Livre */}
              <div className="md:col-span-6 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Buscar por cliente, empresa, técnico, trocador, cidade..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 text-xs h-10"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Filtro por Técnico */}
              <div className="md:col-span-3">
                <Select value={selectedTechnician} onValueChange={setSelectedTechnician}>
                  <SelectTrigger className="text-xs h-10">
                    <div className="flex items-center gap-2 truncate">
                      <User className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <SelectValue placeholder="Todos os técnicos" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Todos os técnicos ({visits.length})</SelectItem>
                    {techniciansList.map((tech) => (
                      <SelectItem key={tech} value={tech}>
                        {tech}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Filtro por Tipo de Trabalho */}
              <div className="md:col-span-3">
                <Select value={selectedWorkType} onValueChange={setSelectedWorkType}>
                  <SelectTrigger className="text-xs h-10">
                    <div className="flex items-center gap-2 truncate">
                      <Filter className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <SelectValue placeholder="Objetivo do serviço" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Todos os tipos de trabalho</SelectItem>
                    <SelectItem value="Projeto Novo">Projeto Novo</SelectItem>
                    <SelectItem value="Readequação">Readequação</SelectItem>
                    <SelectItem value="Manutenção Preventiva">Manutenção Preventiva</SelectItem>
                    <SelectItem value="Manutenção Corretiva">Manutenção Corretiva</SelectItem>
                    <SelectItem value="Catálogo de Equipamentos">
                      Catálogo de Equipamentos
                    </SelectItem>
                    <SelectItem value="Manutenção preventiva ou corretiva">
                      Manutenção preventiva ou corretiva (legado)
                    </SelectItem>
                    <SelectItem value="Projeto novo ou readequação">
                      Projeto novo ou readequação (legado)
                    </SelectItem>
                    <SelectItem value="Catalogação de equipamentos">
                      Catalogação de equipamentos (legado)
                    </SelectItem>
                    <SelectItem value="Outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Tags ativas de filtro */}
            {(searchTerm || selectedTechnician !== 'ALL' || selectedWorkType !== 'ALL') && (
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
                <span className="text-muted-foreground font-medium">Filtros ativos:</span>
                {searchTerm && (
                  <Badge variant="secondary" className="gap-1 text-[11px] font-normal">
                    Termo: &ldquo;{searchTerm}&rdquo;
                    <X className="h-3 w-3 cursor-pointer" onClick={() => setSearchTerm('')} />
                  </Badge>
                )}
                {selectedTechnician !== 'ALL' && (
                  <Badge variant="secondary" className="gap-1 text-[11px] font-normal">
                    Técnico: {selectedTechnician}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => setSelectedTechnician('ALL')}
                    />
                  </Badge>
                )}
                {selectedWorkType !== 'ALL' && (
                  <Badge variant="secondary" className="gap-1 text-[11px] font-normal">
                    Tipo: {selectedWorkType}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => setSelectedWorkType('ALL')}
                    />
                  </Badge>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchTerm('')
                    setSelectedTechnician('ALL')
                    setSelectedWorkType('ALL')
                  }}
                  className="text-[11px] h-6 px-2 text-muted-foreground hover:text-slate-900"
                >
                  Limpar todos
                </Button>
                <span className="ml-auto text-muted-foreground text-[11px]">
                  {filteredVisits.length} {filteredVisits.length === 1 ? 'resultado' : 'resultados'}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Estado de Erro */}
        {error && (
          <div className="p-4 rounded-xl border border-rose-200 bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-200 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-rose-600 mt-0.5 shrink-0" />
            <div className="text-xs space-y-1">
              <p className="font-bold">Falha ao sincronizar com o banco de visitas</p>
              <p>{error}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => loadVisits()}
                className="mt-2 text-xs border-rose-300 bg-white dark:bg-slate-900"
              >
                Tentar novamente
              </Button>
            </div>
          </div>
        )}

        {/* Lista de Visitas / Cards */}
        {isLoading ? (
          <div className="p-12 text-center space-y-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
            <RefreshCw className="h-6 w-6 animate-spin text-teal-600 mx-auto" />
            <p className="text-xs text-muted-foreground font-medium">
              Carregando visitas gravadas no CRM...
            </p>
          </div>
        ) : filteredVisits.length === 0 ? (
          <Card className="border-slate-200 dark:border-slate-800">
            <CardContent className="p-12 text-center space-y-4">
              <div className="h-16 w-16 rounded-2xl bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-400 mx-auto flex items-center justify-center">
                <FileText className="h-8 w-8" />
              </div>
              <div className="space-y-1.5 max-w-md mx-auto">
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  {searchTerm || selectedTechnician !== 'ALL' || selectedWorkType !== 'ALL'
                    ? 'Nenhuma visita encontrada para os filtros aplicados'
                    : 'Nenhuma visita técnica recebida ainda'}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {searchTerm || selectedTechnician !== 'ALL' || selectedWorkType !== 'ALL'
                    ? 'Tente ajustar os termos de pesquisa ou remover os filtros de técnico e objetivo.'
                    : 'Assim que os técnicos em campo concluírem e enviarem um relatório pelo celular no modo "Visita a Campo", ele aparecerá aqui automaticamente em tempo real.'}
                </p>
              </div>

              {searchTerm || selectedTechnician !== 'ALL' || selectedWorkType !== 'ALL' ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchTerm('')
                    setSelectedTechnician('ALL')
                    setSelectedWorkType('ALL')
                  }}
                  className="text-xs"
                >
                  Limpar Filtros
                </Button>
              ) : (
                <Link to="/visita-a-campo">
                  <Button size="sm" className="bg-teal-700 hover:bg-teal-600 text-white text-xs">
                    <Smartphone className="h-3.5 w-3.5 mr-1.5" />
                    Abrir Modo de Visita a Campo
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Mostrando {filteredVisits.length}{' '}
                {filteredVisits.length === 1 ? 'visita' : 'visitas'} (da mais recente para a mais
                antiga)
              </span>
            </div>

            <div className="grid grid-cols-1 gap-3.5">
              {filteredVisits.map((record) => {
                const { data, parsedCompany, parsedContact } = recordToFieldVisitData(record)
                const formattedDate = record.visit_date
                  ? new Date(record.visit_date + 'T12:00:00').toLocaleDateString('pt-BR')
                  : record.created
                    ? new Date(record.created).toLocaleDateString('pt-BR')
                    : 'Data não informada'

                const formattedSentAt = record.sent_at
                  ? new Date(record.sent_at).toLocaleString('pt-BR', {
                      dateStyle: 'short',
                      timeStyle: 'short',
                    })
                  : record.created
                    ? new Date(record.created).toLocaleString('pt-BR', {
                        dateStyle: 'short',
                        timeStyle: 'short',
                      })
                    : null

                const eqCount = data.equipments.length
                const photoCount = data.equipments.reduce((acc, e) => {
                  if (e.attachments && Array.isArray(e.attachments)) {
                    return acc + e.attachments.length
                  }
                  return acc + (e.photoDataUrl ? 1 : 0)
                }, 0)

                return (
                  <Card
                    key={record.id}
                    className="border-slate-200 dark:border-slate-800 hover:border-teal-500/60 dark:hover:border-teal-600 hover:shadow-md transition-all bg-white dark:bg-slate-900 overflow-hidden group"
                  >
                    <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      {/* Lado Esquerdo: Identificação & Cliente */}
                      <div
                        onClick={() => handleOpenDetail(record)}
                        className="flex-1 cursor-pointer space-y-2 min-w-0"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge
                            variant="outline"
                            className="bg-teal-50 text-teal-800 border-teal-200 dark:bg-teal-950/60 dark:text-teal-300 dark:border-teal-800 font-mono text-[10px] font-bold"
                          >
                            VIS-
                            {record.visit_date
                              ? record.visit_date.replace(/-/g, '')
                              : record.id.slice(0, 8).toUpperCase()}
                          </Badge>

                          <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 font-medium">
                            <Calendar className="h-3.5 w-3.5 text-teal-600" />
                            <span>{formattedDate}</span>
                            {record.start_time && (
                              <span className="text-muted-foreground text-[11px]">
                                ({record.start_time} - {record.end_time || '?'})
                              </span>
                            )}
                          </div>

                          <Badge className="bg-emerald-600 text-white text-[9.5px] font-semibold uppercase tracking-wider">
                            {record.status === 'enviada'
                              ? 'Enviada ao CRM'
                              : record.status || 'Gravada'}
                          </Badge>

                          {formattedSentAt && (
                            <span className="text-[10px] text-muted-foreground">
                              Recebida em {formattedSentAt}
                            </span>
                          )}
                        </div>

                        {/* Nome da Empresa & Contato */}
                        <div className="space-y-0.5">
                          <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 group-hover:text-teal-700 dark:group-hover:text-teal-400 transition-colors flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-teal-700 shrink-0" />
                            <span className="truncate">
                              {parsedCompany || parsedContact || 'Empresa não informada'}
                            </span>
                          </h3>

                          {parsedCompany && parsedContact && parsedCompany !== parsedContact && (
                            <p className="text-xs text-slate-600 dark:text-slate-400 pl-6 flex items-center gap-1 truncate">
                              <User className="h-3 w-3 text-slate-400" />
                              <span>
                                Contato: <strong>{parsedContact}</strong>
                              </span>
                              {record.client_role && (
                                <span className="text-muted-foreground">
                                  ({record.client_role})
                                </span>
                              )}
                            </p>
                          )}
                        </div>

                        {/* Metadados: Técnico, Tipo de Trabalho, Equipamentos */}
                        <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-600 dark:text-slate-400 pt-1">
                          <div className="flex items-center gap-1">
                            <User className="h-3.5 w-3.5 text-slate-400" />
                            <span>
                              Técnico:{' '}
                              <strong className="text-slate-800 dark:text-slate-200">
                                {record.employee_name || 'Não informado'}
                              </strong>
                            </span>
                          </div>

                          {record.work_type && (
                            <div className="flex items-center gap-1">
                              <Wrench className="h-3.5 w-3.5 text-teal-600" />
                              <span className="truncate max-w-xs">{record.work_type}</span>
                            </div>
                          )}

                          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                            <span className="inline-flex items-center gap-1 font-medium text-slate-700 dark:text-slate-300">
                              <Layers className="h-3 w-3 text-teal-600" />
                              {eqCount} {eqCount === 1 ? 'equipamento' : 'equipamentos'}
                            </span>
                            {photoCount > 0 && (
                              <span className="inline-flex items-center gap-1 font-medium text-teal-700 dark:text-teal-300">
                                <Camera className="h-3 w-3" />
                                {photoCount} {photoCount === 1 ? 'foto' : 'fotos'}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Resumo rápido do relato se existir */}
                        {record.general_notes && (
                          <p className="text-xs text-slate-500 line-clamp-1 italic pt-0.5">
                            &ldquo;{record.general_notes}&rdquo;
                          </p>
                        )}
                      </div>
                      {/* Lado Direito: Ações Diretas */}
                      <div className="flex sm:flex-row md:flex-col lg:flex-row items-center gap-2 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-800">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenDetail(record)}
                          className="text-xs h-9 font-semibold flex-1 md:flex-none border-slate-300 dark:border-slate-700 hover:border-teal-500"
                        >
                          <Eye className="h-3.5 w-3.5 mr-1 text-teal-700" />
                          Ler Visita Completa
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditVisit(record)}
                          className="text-xs h-9 font-semibold flex-1 md:flex-none border-amber-300 dark:border-amber-700/80 text-amber-800 dark:text-amber-300 bg-amber-50/60 dark:bg-amber-950/30 hover:bg-amber-100/80 hover:border-amber-400 dark:hover:bg-amber-900/40 transition-colors shadow-2xs"
                          title="Editar Visita Técnica"
                        >
                          <Pencil className="h-3.5 w-3.5 mr-1 text-amber-700 dark:text-amber-400" />
                          Editar
                        </Button>

                        <Button
                          size="sm"
                          onClick={() => handleOpenPdf(record)}
                          className="bg-teal-700 hover:bg-teal-600 text-white text-xs h-9 font-semibold flex-1 md:flex-none shadow-2xs"
                        >
                          <Printer className="h-3.5 w-3.5 mr-1" />
                          Gerar PDF
                        </Button>
                      </div>{' '}
                    </div>
                  </Card>
                )
              })}
            </div>
          </div>
        )}
      </main>

      {/* ========================================================================= */}
      {/* MODAL DE VISUALIZAÇÃO COMPLETA DA VISITA (Escritório: relato + fotos) */}
      {/* ========================================================================= */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-4xl max-h-[92vh] flex flex-col p-0 overflow-hidden bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          {selectedDetail && (
            <>
              {/* Header do Diálogo */}
              <DialogHeader className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-row items-center justify-between shrink-0">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className="bg-teal-50 text-teal-800 border-teal-200 dark:bg-teal-950 font-mono text-[10px] font-bold"
                    >
                      VIS-
                      {selectedDetail.data.date
                        ? selectedDetail.data.date.replace(/-/g, '')
                        : 'CAMPO'}
                    </Badge>
                    <Badge className="bg-emerald-600 text-white text-[9.5px]">
                      Sincronizada no CRM
                    </Badge>
                  </div>
                  <DialogTitle className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    {selectedDetail.parsedCompany ||
                      selectedDetail.parsedContact ||
                      'Relatório de Atendimento Técnico'}
                  </DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground">
                    Visita realizada em{' '}
                    {selectedDetail.data.date
                      ? new Date(selectedDetail.data.date + 'T12:00:00').toLocaleDateString('pt-BR')
                      : 'Data não informada'}{' '}
                    por <strong>{selectedDetail.data.employeeName}</strong>
                  </DialogDescription>
                </div>

                <div className="flex items-center gap-2 mr-6">
                  {selectedVisitRecord && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setIsDetailOpen(false)
                        handleEditVisit(selectedVisitRecord)
                      }}
                      className="text-xs h-9 font-semibold border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-300 bg-amber-50/60 dark:bg-amber-950/30 hover:bg-amber-100/80"
                      title="Editar Visita Técnica"
                    >
                      <Pencil className="h-3.5 w-3.5 mr-1.5 text-amber-700 dark:text-amber-400" />
                      Editar Visita
                    </Button>
                  )}

                  <Button
                    type="button"
                    size="sm"
                    onClick={() => {
                      setPdfVisitData(selectedDetail.data)
                      setIsPdfOpen(true)
                    }}
                    className="bg-teal-700 hover:bg-teal-600 text-white text-xs h-9 font-semibold"
                  >
                    <Printer className="h-3.5 w-3.5 mr-1.5" />
                    Gerar PDF A4
                  </Button>
                </div>
              </DialogHeader>

              {/* Corpo Rolável */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
                {/* Grade de Atendimento e Cliente */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Bloco 1: Dados do Atendimento */}
                  <div className="p-4 rounded-xl bg-white dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-3">
                    <span className="text-[10.5px] font-bold uppercase tracking-wider text-teal-800 dark:text-teal-400 flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5" />
                      Dados do Atendimento
                    </span>

                    <div className="space-y-1.5 text-xs">
                      <div>
                        <span className="text-muted-foreground block text-[11px]">
                          Técnico Mecânico Responsável:
                        </span>
                        <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                          {selectedDetail.data.employeeName}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <div className="p-2 rounded bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                          <span className="text-muted-foreground block text-[10px] uppercase">
                            Data:
                          </span>
                          <span className="font-medium text-slate-800 dark:text-slate-200">
                            {selectedDetail.data.date
                              ? new Date(selectedDetail.data.date + 'T12:00:00').toLocaleDateString(
                                  'pt-BR',
                                )
                              : '—'}
                          </span>
                        </div>
                        <div className="p-2 rounded bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                          <span className="text-muted-foreground block text-[10px] uppercase">
                            Duração Estimada:
                          </span>
                          <span className="font-medium text-slate-800 dark:text-slate-200">
                            {selectedDetail.data.visitDuration || '—'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-muted-foreground text-[11px] pt-1">
                        <Clock className="h-3.5 w-3.5 text-slate-400" />
                        <span>
                          Horário: <strong>{selectedDetail.data.startTime || '--:--'}</strong> até{' '}
                          <strong>{selectedDetail.data.endTime || '--:--'}</strong>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Bloco 2: Cliente Industrial */}
                  <div className="p-4 rounded-xl bg-white dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-3">
                    <span className="text-[10.5px] font-bold uppercase tracking-wider text-teal-800 dark:text-teal-400 flex items-center gap-1.5">
                      <Building2 className="h-3.5 w-3.5" />
                      Cliente Industrial
                    </span>

                    <div className="space-y-2 text-xs">
                      <div>
                        <span className="text-muted-foreground block text-[11px]">Empresa:</span>
                        <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                          {selectedDetail.parsedCompany || 'Não informada'}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {selectedDetail.parsedContact && (
                          <div>
                            <span className="text-muted-foreground block text-[10px] uppercase">
                              Contato / Acompanhante:
                            </span>
                            <span className="font-medium text-slate-800 dark:text-slate-200">
                              {selectedDetail.parsedContact}
                            </span>
                          </div>
                        )}

                        {selectedDetail.data.clientRole && (
                          <div>
                            <span className="text-muted-foreground block text-[10px] uppercase">
                              Cargo:
                            </span>
                            <span className="font-medium text-slate-800 dark:text-slate-200">
                              {selectedDetail.data.clientRole}
                            </span>
                          </div>
                        )}

                        {selectedDetail.data.clientContact && (
                          <div>
                            <span className="text-muted-foreground block text-[10px] uppercase">
                              Telefone / E-mail:
                            </span>
                            <span className="font-medium text-slate-800 dark:text-slate-200">
                              {selectedDetail.data.clientContact}
                            </span>
                          </div>
                        )}

                        {selectedDetail.data.clientWorkArea && (
                          <div>
                            <span className="text-muted-foreground block text-[10px] uppercase">
                              Área / Setor:
                            </span>
                            <span className="font-medium text-slate-800 dark:text-slate-200">
                              {selectedDetail.data.clientWorkArea}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bloco 3: Tipo de Trabalho / Objetivo */}
                <div className="p-3.5 rounded-xl border border-teal-200 dark:border-teal-900/60 bg-teal-50/40 dark:bg-teal-950/20 space-y-1">
                  <span className="text-[10.5px] uppercase font-bold text-teal-900 dark:text-teal-300 flex items-center gap-1.5">
                    <Wrench className="h-3.5 w-3.5 text-teal-700" />
                    Tipo de Trabalho / Objetivo da Visita
                  </span>
                  <div className="font-semibold text-slate-900 dark:text-slate-100 text-xs">
                    {selectedDetail.data.workType || 'Não especificado'}
                    {selectedDetail.data.workType === 'Outro' &&
                      selectedDetail.data.workTypeOther && (
                        <span className="text-slate-700 dark:text-slate-300 font-normal">
                          {' '}
                          — {selectedDetail.data.workTypeOther}
                        </span>
                      )}
                  </div>
                </div>

                {/* Bloco 4: Relato Técnico / Descrição Livre e Observações Gerais */}
                {selectedDetail.data.freeDescription || selectedDetail.data.generalObservations ? (
                  <div className="p-4 rounded-xl bg-white dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-2">
                    <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <FileText className="h-3.5 w-3.5 text-teal-700" />
                      {selectedDetail.data.freeDescription
                        ? 'Descrição Livre & Levantamento Técnico'
                        : 'Relato Técnico do Atendimento'}
                    </span>
                    <p className="text-xs text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed bg-slate-50 dark:bg-slate-900 p-3 rounded-lg border border-slate-100 dark:border-slate-800 font-sans">
                      {selectedDetail.data.freeDescription ||
                        selectedDetail.data.generalObservations}
                    </p>
                  </div>
                ) : (
                  <div className="p-3 text-xs text-muted-foreground italic bg-slate-50 dark:bg-slate-900/40 rounded-lg border border-dashed border-slate-200 dark:border-slate-800">
                    Nenhuma observação geral registrada para este atendimento.
                  </div>
                )}

                {/* Bloco 4.1: Plano de Ação Recomendado */}
                {selectedDetail.data.actionPlan && selectedDetail.data.actionPlan.length > 0 && (
                  <div className="p-4 rounded-xl bg-teal-50/50 dark:bg-teal-950/20 border border-teal-200 dark:border-teal-900/60 space-y-2.5">
                    <span className="text-[10.5px] font-bold uppercase tracking-wider text-teal-900 dark:text-teal-300 flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5 text-teal-700" />
                      Plano de Ação Gerado ({selectedDetail.data.actionPlan.length} ações)
                    </span>
                    <div className="space-y-2">
                      {selectedDetail.data.actionPlan.map((action, aIdx) => (
                        <div
                          key={action.id || aIdx}
                          className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 text-xs space-y-1"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-bold text-slate-900 dark:text-slate-100">
                              {aIdx + 1}. {action.title}
                            </span>
                            <Badge
                              variant="outline"
                              className={`text-[9.5px] ${
                                action.priority === 'Alta'
                                  ? 'text-rose-700 border-rose-300 bg-rose-50'
                                  : 'text-amber-700 border-amber-300 bg-amber-50'
                              }`}
                            >
                              {action.priority}
                            </Badge>
                          </div>

                          {action.diagnosis ? (
                            <p className="text-slate-700 dark:text-slate-300 text-[11px]">
                              <strong>Diagnóstico:</strong> {action.diagnosis}
                            </p>
                          ) : (
                            <p className="text-slate-600 dark:text-slate-400 text-[11px]">
                              {action.description}
                            </p>
                          )}

                          <p className="text-teal-800 dark:text-teal-300 text-[11px] font-medium pt-0.5">
                            <strong>Ação recomendada:</strong>{' '}
                            {action.suggestedAction || action.description}
                          </p>

                          {action.technicalReference && (
                            <p className="text-[10.5px] text-teal-700 dark:text-teal-400">
                              <strong>Referência técnica:</strong> {action.technicalReference}
                            </p>
                          )}

                          {action.installationConditions && (
                            <p className="text-[10.5px] text-amber-800 dark:text-amber-300">
                              <strong>Condições do local:</strong> {action.installationConditions}
                            </p>
                          )}

                          {action.pendingItems && action.pendingItems.length > 0 && (
                            <div className="text-[10.5px] text-rose-800 dark:text-rose-300 pt-0.5">
                              <strong>Itens pendentes:</strong>
                              <ul className="list-disc list-inside space-y-0.5">
                                {action.pendingItems.map((pi, pIdx) => (
                                  <li key={pIdx}>{pi}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Bloco 5: Equipamentos Inspecionados */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                    <h3 className="font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider text-xs flex items-center gap-1.5">
                      <Layers className="h-4 w-4 text-teal-700" />
                      Equipamentos Vistoriados ({selectedDetail.data.equipments.length})
                    </h3>
                    <span className="text-[11px] text-muted-foreground">
                      Parâmetros térmicos, mecânicos e fotos
                    </span>
                  </div>

                  {selectedDetail.data.equipments.length === 0 ? (
                    <div className="p-6 rounded-xl bg-slate-100 dark:bg-slate-900 text-center text-slate-500 italic text-xs">
                      Nenhum equipamento foi catalogado nesta visita.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {selectedDetail.data.equipments.map((eq, idx) => (
                        <div
                          key={eq.id || idx}
                          className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-950/60 shadow-2xs"
                        >
                          {/* Topo do Card de Equipamento */}
                          <div className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-3 flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="h-6 w-6 rounded-full bg-teal-700 text-white font-bold text-xs flex items-center justify-center shrink-0">
                                {idx + 1}
                              </span>
                              <span className="font-bold text-slate-900 dark:text-slate-100 text-xs sm:text-sm">
                                {eq.manufacturer ? `${eq.manufacturer} ` : ''}
                                {eq.model || 'Trocador de Calor'}
                              </span>
                              {eq.serialNumber && (
                                <Badge
                                  variant="outline"
                                  className="font-mono text-[10px] text-muted-foreground"
                                >
                                  Série: {eq.serialNumber}
                                </Badge>
                              )}
                            </div>

                            <Badge
                              className={`text-[9.5px] font-bold ${
                                eq.difficulty === 'Alto'
                                  ? 'bg-rose-50 text-rose-700 border-rose-300 hover:bg-rose-100'
                                  : eq.difficulty === 'Baixo'
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                                    : 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
                              }`}
                            >
                              Dificuldade: {eq.difficulty || 'Média'}
                            </Badge>
                          </div>

                          {/* Especificações Técnicas */}
                          <div className="p-4 space-y-3">
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                              <div className="bg-slate-50 dark:bg-slate-900 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800">
                                <span className="text-muted-foreground block text-[10px] uppercase font-semibold">
                                  Fabricante
                                </span>
                                <span className="font-medium text-slate-800 dark:text-slate-200">
                                  {eq.manufacturer || '—'}
                                </span>
                              </div>

                              <div className="bg-slate-50 dark:bg-slate-900 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800">
                                <span className="text-muted-foreground block text-[10px] uppercase font-semibold">
                                  Qtd de Placas
                                </span>
                                <span className="font-medium text-slate-800 dark:text-slate-200">
                                  {eq.plateCount || '—'}
                                </span>
                              </div>

                              <div className="bg-slate-50 dark:bg-slate-900 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800">
                                <span className="text-muted-foreground block text-[10px] uppercase font-semibold">
                                  Local Instalado
                                </span>
                                <span className="font-medium text-slate-800 dark:text-slate-200">
                                  {eq.installedLocation || '—'}
                                </span>
                              </div>

                              <div className="bg-slate-50 dark:bg-slate-900 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800">
                                <span className="text-muted-foreground block text-[10px] uppercase font-semibold">
                                  Vazão Operacional
                                </span>
                                <span className="font-medium text-slate-800 dark:text-slate-200">
                                  {eq.flowRate || '—'}
                                </span>
                              </div>
                            </div>

                            {/* Fluidos & Temperaturas */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                              <div className="bg-slate-50 dark:bg-slate-900 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                <span className="text-muted-foreground text-[10px] uppercase font-semibold">
                                  Fluidos (Lado 1 / Lado 2):
                                </span>
                                <span className="font-medium text-slate-800 dark:text-slate-200 text-right">
                                  {eq.fluid1 || '—'} / {eq.fluid2 || '—'}
                                </span>
                              </div>

                              <div className="bg-slate-50 dark:bg-slate-900 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                <span className="text-muted-foreground text-[10px] uppercase font-semibold flex items-center gap-1">
                                  <Thermometer className="h-3.5 w-3.5 text-teal-600" />
                                  Temperaturas (Entrada / Saída):
                                </span>
                                <span className="font-mono font-medium text-slate-800 dark:text-slate-200 text-right">
                                  {eq.inletTemp || '—'} / {eq.outletTemp || '—'}
                                </span>
                              </div>
                            </div>

                            {/* Parecer do Técnico sobre o Equipamento */}
                            {eq.technicianNotes && (
                              <div className="p-3 rounded-lg bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 text-xs">
                                <span className="font-bold text-amber-900 dark:text-amber-300 block text-[10.5px] uppercase mb-1">
                                  Parecer Técnico do Mecânico:
                                </span>
                                <p className="text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                                  {eq.technicianNotes}
                                </p>
                              </div>
                            )}

                            {/* Anexos Múltiplos (Fotos e Vídeos) do Equipamento */}
                            {((eq.attachments && eq.attachments.length > 0) || eq.photoDataUrl) && (
                              <div className="pt-2">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1 mb-2">
                                  <Camera className="h-3.5 w-3.5 text-teal-700" />
                                  Anexos e Fotos do Equipamento (toque para ampliar)
                                </span>

                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                                  {(eq.attachments && eq.attachments.length > 0
                                    ? eq.attachments
                                    : eq.photoDataUrl
                                      ? [
                                          {
                                            id: 'legacy',
                                            name: 'Foto',
                                            type: 'image' as const,
                                            dataUrl: eq.photoDataUrl,
                                          },
                                        ]
                                      : []
                                  ).map((att) => (
                                    <div
                                      key={att.id}
                                      onClick={() => {
                                        if (att.type === 'image') {
                                          setLightboxImage({
                                            url: att.dataUrl,
                                            title: `${eq.name || eq.model || 'Equipamento'} — ${att.name || 'Foto'}`,
                                            subtitle: `Série: ${eq.serialNumber || 'N/A'} • Local: ${eq.installedLocation || 'N/A'}`,
                                          })
                                        }
                                      }}
                                      className={`relative group rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 flex flex-col p-1 shadow-2xs transition-all ${
                                        att.type === 'image'
                                          ? 'cursor-pointer hover:border-teal-500'
                                          : ''
                                      }`}
                                    >
                                      {att.type === 'image' ? (
                                        <div className="h-32 flex items-center justify-center bg-black/5 dark:bg-black/30 rounded-lg overflow-hidden">
                                          <img
                                            src={att.dataUrl}
                                            alt={att.name || 'Anexo'}
                                            className="h-full w-auto object-contain rounded"
                                          />
                                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white gap-1 text-[11px] font-semibold">
                                            <Maximize2 className="h-3.5 w-3.5" />
                                            <span>Ampliar</span>
                                          </div>
                                        </div>
                                      ) : (
                                        <video
                                          src={att.dataUrl}
                                          controls
                                          className="h-32 w-full object-contain rounded bg-black"
                                        />
                                      )}
                                      <span className="text-[10px] text-slate-600 dark:text-slate-400 mt-1 px-1 truncate">
                                        {att.name || (att.type === 'video' ? 'Vídeo' : 'Foto')}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* LIGHTBOX PARA FOTOS AMPLIADAS */}
      {/* ========================================================================= */}
      {lightboxImage && (
        <Dialog open={!!lightboxImage} onOpenChange={() => setLightboxImage(null)}>
          <DialogContent className="max-w-4xl p-0 overflow-hidden bg-black/95 border-slate-800 text-white">
            <div className="p-4 flex items-center justify-between border-b border-white/10">
              <div>
                <h3 className="font-bold text-sm text-white">{lightboxImage.title}</h3>
                {lightboxImage.subtitle && (
                  <p className="text-xs text-white/70">{lightboxImage.subtitle}</p>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLightboxImage(null)}
                className="text-white hover:bg-white/10"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="p-4 flex items-center justify-center max-h-[80vh] overflow-auto">
              <img
                src={lightboxImage.url}
                alt={lightboxImage.title}
                className="max-h-[75vh] w-auto object-contain rounded shadow-lg"
              />
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* ========================================================================= */}
      {/* MODAL DE PDF (REUTILIZANDO O FieldVisitPdfDialog EXISTENTE) */}
      {/* ========================================================================= */}
      {pdfVisitData && (
        <FieldVisitPdfDialog open={isPdfOpen} onOpenChange={setIsPdfOpen} visit={pdfVisitData} />
      )}
    </div>
  )
}
