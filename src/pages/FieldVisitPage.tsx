import React, { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft,
  Calendar,
  Clock,
  Camera,
  Trash2,
  Plus,
  Mic,
  MicOff,
  User,
  Building,
  CheckCircle2,
  RotateCcw,
  Sparkles,
  AlertTriangle,
  Upload,
  Info,
  Layers,
  Wrench,
  FileText,
  Save,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  FieldVisitData,
  EquipmentItem,
  WorkTypeOption,
  DifficultyLevel,
  STORAGE_KEY_CURRENT_VISIT,
  STORAGE_KEY_EMPLOYEE_NAME,
  createEmptyEquipment,
  createInitialVisitData,
  calculateDurationBetween,
  compressImageFile,
} from '@/types/field-visit'

const WORK_TYPE_OPTIONS: { label: WorkTypeOption; description: string }[] = [
  {
    label: 'Manutenção preventiva ou corretiva',
    description: 'Revisão, troca de gaxetas, abertura ou limpeza de trocadores e válvulas',
  },
  {
    label: 'Projeto novo ou readequação',
    description: 'Levantamento de dados térmicos para novo dimensionamento ou retrofit',
  },
  {
    label: 'Catalogação de equipamentos',
    description: 'Mapeamento de parque instalado, placas de identificação e especificações',
  },
  {
    label: 'Outro',
    description: 'Vistoria geral, acompanhamento de partida técnica ou outra atividade',
  },
]

const DIFFICULTY_OPTIONS: { level: DifficultyLevel; color: string }[] = [
  {
    level: 'Baixo',
    color:
      'border-emerald-300 hover:border-emerald-500 text-emerald-700 bg-emerald-50/60 dark:bg-emerald-950/40',
  },
  {
    level: 'Médio',
    color:
      'border-amber-300 hover:border-amber-500 text-amber-700 bg-amber-50/60 dark:bg-amber-950/40',
  },
  {
    level: 'Alto',
    color: 'border-rose-300 hover:border-rose-500 text-rose-700 bg-rose-50/60 dark:bg-rose-950/40',
  },
]

export default function FieldVisitPage() {
  // Estado principal do formulário
  const [visit, setVisit] = useState<FieldVisitData>(() => {
    let savedEmployee = ''
    try {
      savedEmployee = localStorage.getItem(STORAGE_KEY_EMPLOYEE_NAME) || ''
      const savedDraft = localStorage.getItem(STORAGE_KEY_CURRENT_VISIT)
      if (savedDraft) {
        const parsed = JSON.parse(savedDraft)
        return {
          ...createInitialVisitData(savedEmployee),
          ...parsed,
          employeeName: parsed.employeeName || savedEmployee,
        }
      }
    } catch (e) {
      console.warn('Erro ao restaurar rascunho de visita a campo:', e)
    }
    return createInitialVisitData(savedEmployee)
  })

  // Mensagens e feedbacks
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving'>('saved')
  const [quotaWarning, setQuotaWarning] = useState<string | null>(null)
  const [imageCompressingId, setImageCompressingId] = useState<string | null>(null)

  // Modais de confirmação
  const [isNewVisitDialogOpen, setIsNewVisitDialogOpen] = useState(false)
  const [equipmentToDelete, setEquipmentToDelete] = useState<string | null>(null)

  // Reconhecimento de Voz (Speech Recognition)
  const [isRecording, setIsRecording] = useState(false)
  const [speechSupported, setSpeechSupported] = useState(false)
  const recognitionRef = useRef<any>(null)

  // Verificar suporte a Web Speech API
  useEffect(() => {
    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (SpeechRec) {
      setSpeechSupported(true)
      const instance = new SpeechRec()
      instance.lang = 'pt-BR'
      instance.continuous = true
      instance.interimResults = true

      instance.onresult = (event: any) => {
        let transcript = ''
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript
        }
        if (transcript) {
          setVisit((prev) => {
            const separator =
              prev.generalObservations && !prev.generalObservations.endsWith(' ') ? ' ' : ''
            return {
              ...prev,
              generalObservations: prev.generalObservations
                ? `${prev.generalObservations}${separator}${transcript}`
                : transcript,
            }
          })
        }
      }

      instance.onerror = (err: any) => {
        console.warn('SpeechRecognition erro:', err)
        setIsRecording(false)
      }

      instance.onend = () => {
        setIsRecording(false)
      }

      recognitionRef.current = instance
    } else {
      setSpeechSupported(false)
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop()
        } catch {
          // ignore
        }
      }
    }
  }, [])

  // Auto-save com debounce de 400ms
  useEffect(() => {
    setSaveStatus('saving')
    const timer = setTimeout(() => {
      try {
        const payload = JSON.stringify({
          ...visit,
          updatedAt: new Date().toISOString(),
        })
        localStorage.setItem(STORAGE_KEY_CURRENT_VISIT, payload)
        if (visit.employeeName) {
          localStorage.setItem(STORAGE_KEY_EMPLOYEE_NAME, visit.employeeName)
        }
        setSaveStatus('saved')
        setQuotaWarning(null)
      } catch (err: any) {
        console.error('Erro ao salvar no localStorage:', err)
        // Se exceder a cota (ex: fotos grandes demais)
        if (
          err.name === 'QuotaExceededError' ||
          err.code === 22 ||
          err.code === 1014 ||
          err.name === 'NS_ERROR_DOM_QUOTA_REACHED'
        ) {
          setQuotaWarning(
            'Atenção: O limite de armazenamento local foi atingido devido a fotos em alta resolução. Seus textos continuam na tela, mas recomendamos remover algumas fotos para garantir a persistência completa.',
          )
        } else {
          setQuotaWarning(
            'Não foi possível salvar no armazenamento local: ' +
              (err.message || 'Erro desconhecido'),
          )
        }
        setSaveStatus('saved')
      }
    }, 400)

    return () => clearTimeout(timer)
  }, [visit])

  // Handlers de campos gerais
  const handleEmployeeChange = (val: string) => {
    setVisit((prev) => ({ ...prev, employeeName: val }))
  }

  const handleStartTimeChange = (newStart: string) => {
    setVisit((prev) => {
      const duration = calculateDurationBetween(newStart, prev.endTime)
      return {
        ...prev,
        startTime: newStart,
        visitDuration:
          prev.isDurationManuallyEdited && prev.visitDuration ? prev.visitDuration : duration,
      }
    })
  }

  const handleEndTimeChange = (newEnd: string) => {
    setVisit((prev) => {
      const duration = calculateDurationBetween(prev.startTime, newEnd)
      return {
        ...prev,
        endTime: newEnd,
        visitDuration:
          prev.isDurationManuallyEdited && prev.visitDuration ? prev.visitDuration : duration,
      }
    })
  }

  const handleDurationChange = (val: string) => {
    setVisit((prev) => ({
      ...prev,
      visitDuration: val,
      isDurationManuallyEdited: true,
    }))
  }

  const handleRecalculateDuration = () => {
    const calc = calculateDurationBetween(visit.startTime, visit.endTime)
    setVisit((prev) => ({
      ...prev,
      visitDuration: calc,
      isDurationManuallyEdited: false,
    }))
  }

  // Microfone toggle
  const toggleRecording = () => {
    if (!speechSupported || !recognitionRef.current) return

    if (isRecording) {
      try {
        recognitionRef.current.stop()
      } catch (e) {
        console.warn(e)
      }
      setIsRecording(false)
    } else {
      try {
        recognitionRef.current.start()
        setIsRecording(true)
      } catch (e) {
        console.warn('Erro ao iniciar speech recognition:', e)
        setIsRecording(false)
      }
    }
  }

  // Ações de Equipamentos
  const handleAddEquipment = () => {
    const newEq = createEmptyEquipment()
    setVisit((prev) => ({
      ...prev,
      equipments: [...prev.equipments, newEq],
    }))
  }

  const handleUpdateEquipment = (id: string, updates: Partial<EquipmentItem>) => {
    setVisit((prev) => ({
      ...prev,
      equipments: prev.equipments.map((eq) => (eq.id === id ? { ...eq, ...updates } : eq)),
    }))
  }

  const handleConfirmDeleteEquipment = () => {
    if (!equipmentToDelete) return
    setVisit((prev) => ({
      ...prev,
      equipments: prev.equipments.filter((eq) => eq.id !== equipmentToDelete),
    }))
    setEquipmentToDelete(null)
  }

  // Foto de equipamento
  const handlePhotoUpload = async (
    equipmentId: string,
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      setImageCompressingId(equipmentId)
      const compressedDataUrl = await compressImageFile(file, 1000, 0.7)
      handleUpdateEquipment(equipmentId, { photoDataUrl: compressedDataUrl })
      setQuotaWarning(null)
    } catch (err: any) {
      console.error('Erro ao comprimir foto:', err)
      alert('Não foi possível processar a imagem. Tente novamente.')
    } finally {
      setImageCompressingId(null)
      // Limpar o input para permitir refazer a mesma foto se desejar
      event.target.value = ''
    }
  }

  const handleRemovePhoto = (equipmentId: string) => {
    handleUpdateEquipment(equipmentId, { photoDataUrl: undefined })
  }

  // Nova Visita (Limpeza total com confirmação)
  const handleConfirmNewVisit = () => {
    const employeeToKeep =
      visit.employeeName || localStorage.getItem(STORAGE_KEY_EMPLOYEE_NAME) || ''
    const fresh = createInitialVisitData(employeeToKeep)
    setVisit(fresh)
    localStorage.removeItem(STORAGE_KEY_CURRENT_VISIT)
    setIsNewVisitDialogOpen(false)
    setQuotaWarning(null)
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-20">
      {/* Top Header Mobile-First */}
      <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Link
              to="/"
              className="inline-flex items-center justify-center h-10 w-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-teal-50 hover:text-teal-700 transition-colors"
              title="Voltar ao Painel Geral"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-sm tracking-tight text-teal-800 dark:text-teal-400">
                  INTERTERMAL
                </span>
                <span className="text-[10px] bg-teal-100 dark:bg-teal-900/60 text-teal-800 dark:text-teal-300 font-bold px-1.5 py-0.2 rounded">
                  BERMO
                </span>
              </div>
              <h1 className="text-base font-bold text-slate-900 dark:text-slate-100 leading-tight">
                Visita a campo
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Status do Auto-save */}
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-800">
              {saveStatus === 'saving' ? (
                <>
                  <RotateCcw className="h-3 w-3 animate-spin text-amber-500" />
                  <span className="hidden sm:inline">Salvando...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                  <span className="hidden sm:inline font-medium text-emerald-700 dark:text-emerald-400">
                    Salvo
                  </span>
                </>
              )}
            </div>

            {/* Botão Nova Visita */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsNewVisitDialogOpen(true)}
              className="text-xs h-9 border-slate-300 dark:border-slate-700 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200"
            >
              <RotateCcw className="h-3.5 w-3.5 mr-1" />
              Nova visita
            </Button>
          </div>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="max-w-3xl mx-auto px-4 pt-4 space-y-5">
        {/* Aviso de Cota de Armazenamento Excedida */}
        {quotaWarning && (
          <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-3 shadow-xs">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold">Aviso de Armazenamento</p>
              <p className="leading-relaxed">{quotaWarning}</p>
            </div>
          </div>
        )}

        {/* 1. SEÇÃO: FUNCIONÁRIO RESPONSÁVEL */}
        <Card className="border-slate-200 dark:border-slate-800 shadow-xs bg-white dark:bg-slate-900">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 flex items-center justify-center">
                <User className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-sm font-bold">1. Funcionário em Campo</CardTitle>
                <p className="text-[11px] text-muted-foreground">
                  Fica gravado no celular e preenche automaticamente nas próximas visitas
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Nome do funcionário
              </label>
              <Input
                value={visit.employeeName}
                onChange={(e) => handleEmployeeChange(e.target.value)}
                placeholder="Ex.: Carlos Alberto Souza"
                className="h-11 text-sm bg-slate-50/70 dark:bg-slate-950 focus-visible:ring-teal-600"
              />
            </div>
          </CardContent>
        </Card>

        {/* 2. SEÇÃO: DADOS DA VISITA */}
        <Card className="border-slate-200 dark:border-slate-800 shadow-xs bg-white dark:bg-slate-900">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 flex items-center justify-center">
                <Clock className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-sm font-bold">2. Dados da Visita</CardTitle>
                <p className="text-[11px] text-muted-foreground">
                  Data e horários de atendimento técnico
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Data */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Data da visita
                </label>
                <div className="relative">
                  <Input
                    type="date"
                    value={visit.date}
                    onChange={(e) => setVisit((prev) => ({ ...prev, date: e.target.value }))}
                    className="h-11 text-sm bg-slate-50/70 dark:bg-slate-950"
                  />
                </div>
              </div>

              {/* Horário Início */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Horário de início
                </label>
                <Input
                  type="time"
                  value={visit.startTime}
                  onChange={(e) => handleStartTimeChange(e.target.value)}
                  className="h-11 text-sm bg-slate-50/70 dark:bg-slate-950"
                />
              </div>

              {/* Horário Término */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Horário de término
                </label>
                <Input
                  type="time"
                  value={visit.endTime}
                  onChange={(e) => handleEndTimeChange(e.target.value)}
                  className="h-11 text-sm bg-slate-50/70 dark:bg-slate-950"
                />
              </div>
            </div>

            {/* Tempo de visita */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  Tempo de visita
                  {visit.isDurationManuallyEdited && (
                    <Badge
                      variant="outline"
                      className="text-[10px] font-normal text-amber-700 border-amber-300"
                    >
                      Editado manual
                    </Badge>
                  )}
                </label>
                {visit.isDurationManuallyEdited && (
                  <button
                    type="button"
                    onClick={handleRecalculateDuration}
                    className="text-[11px] text-teal-700 dark:text-teal-400 hover:underline font-medium"
                  >
                    Recalcular automático
                  </button>
                )}
              </div>
              <Input
                value={visit.visitDuration}
                onChange={(e) => handleDurationChange(e.target.value)}
                placeholder="Ex.: 2h 30min"
                className="h-11 text-sm font-medium bg-white dark:bg-slate-900"
              />
              <p className="text-[11px] text-muted-foreground mt-1">
                Calculado automaticamente entre início e término, mas você pode ajustar se
                necessário.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 3. SEÇÃO: CLIENTE */}
        <Card className="border-slate-200 dark:border-slate-800 shadow-xs bg-white dark:bg-slate-900">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 flex items-center justify-center">
                <Building className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-sm font-bold">3. Cliente Industrial</CardTitle>
                <p className="text-[11px] text-muted-foreground">
                  Identificação do contato e local
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Nome do cliente / empresa
                </label>
                <Input
                  value={visit.clientName}
                  onChange={(e) => setVisit((prev) => ({ ...prev, clientName: e.target.value }))}
                  placeholder="Ex.: Usina São Martinho / Cervejaria Petrópolis"
                  className="h-11 text-sm bg-slate-50/70 dark:bg-slate-950"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Cargo
                </label>
                <Input
                  value={visit.clientRole}
                  onChange={(e) => setVisit((prev) => ({ ...prev, clientRole: e.target.value }))}
                  placeholder="Ex.: Supervisor de Manutenção / Eng. de Processo"
                  className="h-11 text-sm bg-slate-50/70 dark:bg-slate-950"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Contato (Telefone / E-mail)
                </label>
                <Input
                  value={visit.clientContact}
                  onChange={(e) => setVisit((prev) => ({ ...prev, clientContact: e.target.value }))}
                  placeholder="Ex.: (16) 99876-5432 / contato@empresa.com"
                  className="h-11 text-sm bg-slate-50/70 dark:bg-slate-950"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Área de trabalho
                </label>
                <Input
                  value={visit.clientWorkArea}
                  onChange={(e) =>
                    setVisit((prev) => ({ ...prev, clientWorkArea: e.target.value }))
                  }
                  placeholder="Ex.: Caldeiraria, Utilidades, Fermentação, Casa de Força"
                  className="h-11 text-sm bg-slate-50/70 dark:bg-slate-950"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 4. SEÇÃO: TIPO DE TRABALHO (CARDS GRANDES) */}
        <Card className="border-slate-200 dark:border-slate-800 shadow-xs bg-white dark:bg-slate-900">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 flex items-center justify-center">
                <Wrench className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-sm font-bold">4. Tipo de Trabalho</CardTitle>
                <p className="text-[11px] text-muted-foreground">
                  Toque no card que melhor representa o objetivo da visita
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {WORK_TYPE_OPTIONS.map((opt) => {
                const isSelected = visit.workType === opt.label
                return (
                  <button
                    key={opt.label}
                    type="button"
                    onClick={() => setVisit((prev) => ({ ...prev, workType: opt.label }))}
                    className={`p-4 rounded-xl text-left border-2 transition-all flex flex-col justify-between min-h-[92px] ${
                      isSelected
                        ? 'border-teal-600 bg-teal-50/80 dark:bg-teal-950/40 shadow-sm'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span
                        className={`text-sm font-bold ${
                          isSelected
                            ? 'text-teal-900 dark:text-teal-200'
                            : 'text-slate-800 dark:text-slate-200'
                        }`}
                      >
                        {opt.label}
                      </span>
                      {isSelected && (
                        <CheckCircle2 className="h-5 w-5 text-teal-700 dark:text-teal-400 shrink-0 mt-0.5" />
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-1.5 leading-snug">
                      {opt.description}
                    </p>
                  </button>
                )
              })}
            </div>

            {/* Campo de texto livre para 'Outro' */}
            {visit.workType === 'Outro' && (
              <div className="pt-2 animate-in fade-in slide-in-from-top-1 duration-200">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Descreva o tipo de trabalho:
                </label>
                <Input
                  value={visit.workTypeOther}
                  onChange={(e) => setVisit((prev) => ({ ...prev, workTypeOther: e.target.value }))}
                  placeholder="Especifique a atividade realizada..."
                  className="h-11 text-sm bg-slate-50/70 dark:bg-slate-950"
                  autoFocus
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* 5. SEÇÃO: OBSERVAÇÕES GERAIS + GRAVAÇÃO DE VOZ */}
        <Card className="border-slate-200 dark:border-slate-800 shadow-xs bg-white dark:bg-slate-900">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 flex items-center justify-center">
                  <FileText className="h-4 w-4" />
                </div>
                <div>
                  <CardTitle className="text-sm font-bold">
                    5. Observações Gerais da Visita
                  </CardTitle>
                  <p className="text-[11px] text-muted-foreground">
                    Relato técnico, condições da fábrica, demandas extras do cliente
                  </p>
                </div>
              </div>

              {/* Botão de gravação de voz */}
              {speechSupported && (
                <Button
                  type="button"
                  variant={isRecording ? 'destructive' : 'outline'}
                  size="sm"
                  onClick={toggleRecording}
                  className={`h-9 text-xs px-3 font-semibold transition-all ${
                    isRecording
                      ? 'animate-pulse ring-2 ring-rose-400'
                      : 'border-slate-300 dark:border-slate-700'
                  }`}
                  title={isRecording ? 'Parar gravação de voz' : 'Falar para transcrever em texto'}
                >
                  {isRecording ? (
                    <>
                      <MicOff className="h-3.5 w-3.5 mr-1.5" />
                      Gravando...
                    </>
                  ) : (
                    <>
                      <Mic className="h-3.5 w-3.5 mr-1.5 text-teal-700 dark:text-teal-400" />
                      Gravar voz
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {isRecording && (
              <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-rose-600 animate-ping" />
                <span>
                  Ouvindo sua fala em português... O texto será inserido no campo abaixo ao pausar.
                </span>
              </div>
            )}
            <Textarea
              value={visit.generalObservations}
              onChange={(e) =>
                setVisit((prev) => ({ ...prev, generalObservations: e.target.value }))
              }
              placeholder="Digite aqui ou use o botão de microfone acima para gravar seu relato técnico..."
              rows={5}
              className="text-sm leading-relaxed bg-slate-50/70 dark:bg-slate-950 resize-y"
            />
          </CardContent>
        </Card>

        {/* 6. SEÇÃO: LISTA DE EQUIPAMENTOS */}
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-2 pt-2">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Layers className="h-5 w-5 text-teal-700 dark:text-teal-400" />
                Equipamentos Vistoriados
                <Badge variant="secondary" className="text-xs">
                  {visit.equipments.length}
                </Badge>
              </h2>
              <p className="text-xs text-muted-foreground">
                Adicione quantos trocadores ou válvulas desejar. Cada item possui bloco e foto
                próprios.
              </p>
            </div>

            <Button
              type="button"
              onClick={handleAddEquipment}
              className="bg-teal-700 hover:bg-teal-600 text-white font-semibold text-xs h-10 px-4 rounded-xl shadow-xs"
            >
              <Plus className="h-4 w-4 mr-1" />
              Adicionar equipamento
            </Button>
          </div>

          {visit.equipments.length === 0 ? (
            <div className="p-8 text-center rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 space-y-3">
              <div className="h-12 w-12 rounded-full bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-400 mx-auto flex items-center justify-center">
                <Layers className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  Nenhum equipamento adicionado ainda
                </p>
                <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                  Toque no botão abaixo para registrar o primeiro trocador de calor ou válvula
                  inspecionada.
                </p>
              </div>
              <Button
                type="button"
                onClick={handleAddEquipment}
                variant="outline"
                className="text-xs h-9 font-semibold text-teal-800 dark:text-teal-300 border-teal-300 dark:border-teal-700 hover:bg-teal-50"
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                Adicionar primeiro equipamento
              </Button>
            </div>
          ) : (
            <div className="space-y-5">
              {visit.equipments.map((item, index) => (
                <Card
                  key={item.id}
                  className="border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900 overflow-hidden"
                >
                  <CardHeader className="bg-slate-50/80 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 py-3 px-4">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="h-6 w-6 rounded-full bg-teal-700 text-white text-xs font-bold flex items-center justify-center">
                          {index + 1}
                        </span>
                        <CardTitle className="text-sm font-bold truncate">
                          {item.model || item.manufacturer
                            ? `${item.manufacturer ? item.manufacturer + ' ' : ''}${item.model || 'Equipamento'}`
                            : `Equipamento #${index + 1}`}
                        </CardTitle>
                      </div>

                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setEquipmentToDelete(item.id)}
                        className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950 h-8 px-2 text-xs"
                        title="Remover este equipamento"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Remover
                      </Button>
                    </div>
                  </CardHeader>

                  <CardContent className="p-4 space-y-4">
                    {/* Linha 1: Modelo, Série, Fabricante */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Modelo
                        </label>
                        <Input
                          value={item.model}
                          onChange={(e) =>
                            handleUpdateEquipment(item.id, { model: e.target.value })
                          }
                          placeholder="Ex.: M10-BFG, TL10-B"
                          className="h-10 text-xs bg-slate-50/70 dark:bg-slate-950"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Série
                        </label>
                        <Input
                          value={item.serialNumber}
                          onChange={(e) =>
                            handleUpdateEquipment(item.id, { serialNumber: e.target.value })
                          }
                          placeholder="Ex.: 30105-884"
                          className="h-10 text-xs bg-slate-50/70 dark:bg-slate-950"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Fabricante
                        </label>
                        <Input
                          value={item.manufacturer}
                          onChange={(e) =>
                            handleUpdateEquipment(item.id, { manufacturer: e.target.value })
                          }
                          placeholder="Ex.: BERMO, Alfa Laval, Sondex"
                          className="h-10 text-xs bg-slate-50/70 dark:bg-slate-950"
                        />
                      </div>
                    </div>

                    {/* Linha 2: Quantidade de placas, Local instalado */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Quantidade de placas
                        </label>
                        <Input
                          value={item.plateCount}
                          onChange={(e) =>
                            handleUpdateEquipment(item.id, { plateCount: e.target.value })
                          }
                          placeholder="Ex.: 64 placas"
                          className="h-10 text-xs bg-slate-50/70 dark:bg-slate-950"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Local instalado
                        </label>
                        <Input
                          value={item.installedLocation}
                          onChange={(e) =>
                            handleUpdateEquipment(item.id, { installedLocation: e.target.value })
                          }
                          placeholder="Ex.: Setor de Evaporação / Mezanino 2"
                          className="h-10 text-xs bg-slate-50/70 dark:bg-slate-950"
                        />
                      </div>
                    </div>

                    {/* Linha 3: Fluidos e Vazão */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Fluido 1 (Lado quente)
                        </label>
                        <Input
                          value={item.fluid1}
                          onChange={(e) =>
                            handleUpdateEquipment(item.id, { fluid1: e.target.value })
                          }
                          placeholder="Ex.: Vapor saturated 3 bar / Caldo"
                          className="h-10 text-xs bg-slate-50/70 dark:bg-slate-950"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Fluido 2 (Lado frio)
                        </label>
                        <Input
                          value={item.fluid2}
                          onChange={(e) =>
                            handleUpdateEquipment(item.id, { fluid2: e.target.value })
                          }
                          placeholder="Ex.: Água de resfriamento"
                          className="h-10 text-xs bg-slate-50/70 dark:bg-slate-950"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Vazão
                        </label>
                        <Input
                          value={item.flowRate}
                          onChange={(e) =>
                            handleUpdateEquipment(item.id, { flowRate: e.target.value })
                          }
                          placeholder="Ex.: 45 m³/h ou 12.000 kg/h"
                          className="h-10 text-xs bg-slate-50/70 dark:bg-slate-950"
                        />
                      </div>
                    </div>

                    {/* Linha 4: Temperaturas */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Temperatura de entrada
                        </label>
                        <Input
                          value={item.inletTemp}
                          onChange={(e) =>
                            handleUpdateEquipment(item.id, { inletTemp: e.target.value })
                          }
                          placeholder="Ex.: 92 °C"
                          className="h-10 text-xs bg-slate-50/70 dark:bg-slate-950"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Temperatura de saída
                        </label>
                        <Input
                          value={item.outletTemp}
                          onChange={(e) =>
                            handleUpdateEquipment(item.id, { outletTemp: e.target.value })
                          }
                          placeholder="Ex.: 45 °C"
                          className="h-10 text-xs bg-slate-50/70 dark:bg-slate-950"
                        />
                      </div>
                    </div>

                    {/* Grau de dificuldade */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        Grau de dificuldade do serviço
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {DIFFICULTY_OPTIONS.map((diff) => {
                          const isSelected = item.difficulty === diff.level
                          return (
                            <button
                              key={diff.level}
                              type="button"
                              onClick={() =>
                                handleUpdateEquipment(item.id, { difficulty: diff.level })
                              }
                              className={`h-11 rounded-lg border-2 text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                                isSelected
                                  ? `${diff.color} ring-1 ring-offset-1`
                                  : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-900'
                              }`}
                            >
                              {isSelected && <CheckCircle2 className="h-3.5 w-3.5" />}
                              {diff.level}
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    {/* FOTO DO EQUIPAMENTO (Câmera do Celular + Compressão) */}
                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                          <Camera className="h-4 w-4 text-teal-700 dark:text-teal-400" />
                          Foto da placa / equipamento
                        </label>
                        {item.photoDataUrl && (
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                            Foto anexada (comprimida)
                          </span>
                        )}
                      </div>

                      {item.photoDataUrl ? (
                        <div className="space-y-2">
                          <div className="relative rounded-lg overflow-hidden border border-slate-300 dark:border-slate-700 bg-black max-h-64 flex items-center justify-center">
                            <img
                              src={item.photoDataUrl}
                              alt={`Foto do ${item.model || 'equipamento'}`}
                              className="w-full h-auto max-h-64 object-contain"
                            />
                          </div>
                          <div className="flex gap-2">
                            {/* Refazer foto */}
                            <label className="flex-1 cursor-pointer">
                              <input
                                type="file"
                                accept="image/*"
                                capture="environment"
                                className="hidden"
                                onChange={(e) => handlePhotoUpload(item.id, e)}
                              />
                              <div className="h-9 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 flex items-center justify-center gap-1.5">
                                <Camera className="h-3.5 w-3.5 text-teal-700" />
                                Refazer foto
                              </div>
                            </label>

                            {/* Remover foto */}
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => handleRemovePhoto(item.id)}
                              className="h-9 text-xs text-rose-600 border-rose-200 hover:bg-rose-50"
                            >
                              <Trash2 className="h-3.5 w-3.5 mr-1" />
                              Remover foto
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <label className="cursor-pointer block">
                            <input
                              type="file"
                              accept="image/*"
                              capture="environment"
                              className="hidden"
                              onChange={(e) => handlePhotoUpload(item.id, e)}
                              disabled={imageCompressingId === item.id}
                            />
                            <div className="h-16 rounded-xl border-2 border-dashed border-teal-400/60 dark:border-teal-700/60 bg-teal-50/40 dark:bg-teal-950/20 hover:bg-teal-50 text-teal-800 dark:text-teal-300 flex flex-col items-center justify-center gap-1 transition-all">
                              {imageCompressingId === item.id ? (
                                <div className="flex items-center gap-2 text-xs font-medium">
                                  <RotateCcw className="h-4 w-4 animate-spin text-teal-600" />
                                  Comprimindo imagem para salvar...
                                </div>
                              ) : (
                                <>
                                  <div className="flex items-center gap-1.5 text-xs font-bold">
                                    <Camera className="h-4 w-4 text-teal-700" />
                                    Tirar foto com a câmera
                                  </div>
                                  <span className="text-[10px] text-muted-foreground">
                                    Ou escolher da galeria • Reduzida automaticamente
                                  </span>
                                </>
                              )}
                            </div>
                          </label>
                        </div>
                      )}
                    </div>

                    {/* Observações do técnico sobre o estado do equipamento */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Observações do técnico sobre o estado do equipamento
                      </label>
                      <Textarea
                        value={item.technicianNotes}
                        onChange={(e) =>
                          handleUpdateEquipment(item.id, { technicianNotes: e.target.value })
                        }
                        placeholder="Vazamento nas gaxetas, placas incrustadas, corrosão no tirante, necessidade de banho químico..."
                        rows={3}
                        className="text-xs bg-slate-50/70 dark:bg-slate-950 resize-y"
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}

              <div className="pt-2">
                <Button
                  type="button"
                  onClick={handleAddEquipment}
                  variant="outline"
                  className="w-full h-12 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-teal-600 hover:text-teal-700 font-semibold text-xs"
                >
                  <Plus className="h-4 w-4 mr-1.5" />
                  Adicionar outro equipamento
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Rodapé informativo */}
        <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-muted-foreground space-y-1">
          <div className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-300">
            <Info className="h-4 w-4 text-teal-700 dark:text-teal-400" />
            Armazenamento Seguro em Campo
          </div>
          <p>
            Todos os dados digitados e fotos ficam guardados no seu celular (armazenamento local).
            Você pode fechar a tela, abrir outra aba ou reiniciar o aparelho que as informações
            continuarão salvas aqui.
          </p>
        </div>
      </main>

      {/* Modal de Confirmação: Nova Visita */}
      <AlertDialog open={isNewVisitDialogOpen} onOpenChange={setIsNewVisitDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Iniciar uma nova visita a campo?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação irá limpar os dados da visita em curso da tela para começar um novo
              atendimento. O nome do funcionário será preservado para você não precisar digitar de
              novo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continuar editando</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmNewVisit}
              className="bg-rose-600 hover:bg-rose-700 text-white font-semibold"
            >
              Sim, começar nova visita
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal de Confirmação: Remover Equipamento */}
      <AlertDialog
        open={equipmentToDelete !== null}
        onOpenChange={(open) => !open && setEquipmentToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover este equipamento?</AlertDialogTitle>
            <AlertDialogDescription>
              Os dados e a foto deste equipamento serão excluídos do formulário desta visita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setEquipmentToDelete(null)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDeleteEquipment}
              className="bg-rose-600 hover:bg-rose-700 text-white font-semibold"
            >
              Sim, remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
