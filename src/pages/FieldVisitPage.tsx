import React, { useState, useEffect, useRef } from 'react'
import { Link, useSearchParams, useLocation } from 'react-router-dom'
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
  Send,
  Printer,
  Loader2,
  Check,
  Video,
  FileCode2,
  Mail,
  HelpCircle,
  Eye,
  Film,
  Image as ImageIcon,
  X,
  FileSpreadsheet,
  Lock,
  Volume2,
  Copy,
  ExternalLink,
} from 'lucide-react'
import { VoiceDictationField } from '@/components/VoiceDictationField'
import { VoiceDiagnosticFooter } from '@/components/VoiceDiagnosticFooter'
import { detectBrowserEnvironment } from '@/hooks/useVoiceRecorder'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/hooks/use-toast'
import { fieldVisitsService, type FieldVisitRecord } from '@/services/field-visits'
import { pendingQueue } from '@/services/field-visit-queue'
import { sellerTokenApi, getStoredToken, getStoredDeviceId } from '@/services/field-visit-token'
import { onlyNumericPtBR } from '@/types/field-visit'
import { FieldVisitPdfDialog } from '@/components/FieldVisitPdfDialog'
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
  MediaAttachment,
  STORAGE_KEY_CURRENT_VISIT,
  STORAGE_KEY_EMPLOYEE_NAME,
  createEmptyEquipment,
  createInitialVisitData,
  calculateDurationBetween,
  recordToFieldVisitData,
  readFileAsMediaAttachment,
  generateActionPlan,
  formatEquipmentTitle,
  generateId,
} from '@/types/field-visit'
import {
  readNameplateFromImage,
  compareAndMergeNameplateData,
  NameplateComparisonResult,
} from '@/services/nameplate-reader'
import { NameplateOcrReviewDialog } from '@/components/NameplateOcrReviewDialog'
import { EquipmentMediaAttachmentSection } from '@/components/EquipmentMediaAttachmentSection'
import { EquipmentCustomFieldsSection } from '@/components/EquipmentCustomFieldsSection'

/**
 * 6 Tipos exatos solicitados pelo usuário
 */
const WORK_TYPE_OPTIONS: {
  label: WorkTypeOption
  category: 'lean' | 'detailed'
  badge: string
  description: string
}[] = [
  {
    label: 'Projeto Novo',
    category: 'lean',
    badge: 'Formulário Enxuto',
    description: 'Levantamento para novo trocador de calor ou novo processo térmico.',
  },
  {
    label: 'Readequação',
    category: 'lean',
    badge: 'Formulário Enxuto',
    description: 'Retrofit, aumento de capacidade ou readequação de trocador existente.',
  },
  {
    label: 'Manutenção Preventiva',
    category: 'detailed',
    badge: 'Formulário Completo',
    description: 'Revisão periódica, troca preventiva de gaxetas e limpeza mecânica.',
  },
  {
    label: 'Manutenção Corretiva',
    category: 'detailed',
    badge: 'Formulário Completo',
    description: 'Intervenção imediata, reparo de vazamento ou recuperação emergencial.',
  },
  {
    label: 'Catálogo de Equipamentos',
    category: 'detailed',
    badge: 'Formulário Completo',
    description: 'Mapeamento do parque de trocadores instalados e placas de identificação.',
  },
  {
    label: 'Outro',
    category: 'lean',
    badge: 'Formulário Enxuto',
    description: 'Vistoria geral, acompanhamento de partida técnica ou outra atividade.',
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

const FLOW_UNIT_OPTIONS = ['m³/h', 'm³/min', 'L/min', 'L/s', 'kg/h', 'kg/s', 't/h', 'GPM']

/**
 * Fabricantes pré-definidos (regra do Alex): técnico seleciona; "Outros" abre campo editável.
 * Dados pré-existentes NUNCA são alterados: valor que não é preset continua no campo livre.
 */
const MANUFACTURER_PRESETS = ['Bermo', 'Alfa Laval', 'SPX']

// VoiceDictationField e VoiceDiagnosticFooter substituem a implementação anterior de gravação

/**
 * Componente para campo de anexos com suporte a MÚLTIPLAS imagens e vídeos
 */
function MultiMediaAttachmentField({
  attachments = [],
  onAddFiles,
  onRemoveAttachment,
  title = 'Anexos (Fotos e Vídeos)',
  description = 'Aceita múltiplos arquivos de foto e vídeo ao mesmo tempo.',
  isCompressing = false,
}: {
  attachments?: MediaAttachment[]
  onAddFiles: (files: FileList | null) => Promise<void>
  onRemoveAttachment: (attachmentId: string) => void
  title?: string
  description?: string
  isCompressing?: boolean
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  return (
    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Camera className="h-4 w-4 text-teal-700 dark:text-teal-400" />
            {title}
          </label>
          <p className="text-[11px] text-muted-foreground">{description}</p>
        </div>
        <Badge variant="secondary" className="text-[10px]">
          {attachments.length} {attachments.length === 1 ? 'anexo' : 'anexos'}
        </Badge>
      </div>

      {/* Grid de miniaturas existentes */}
      {attachments.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {attachments.map((att) => (
            <div
              key={att.id}
              className="relative group rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 bg-black/5 dark:bg-white/5 flex flex-col"
            >
              <div className="aspect-video w-full bg-black/80 flex items-center justify-center overflow-hidden">
                {att.type === 'video' ? (
                  <video src={att.dataUrl} controls className="w-full h-full object-contain" />
                ) : (
                  <img
                    src={att.dataUrl}
                    alt={att.name || 'Foto anexada'}
                    className="w-full h-full object-contain"
                  />
                )}
              </div>

              <div className="p-1.5 bg-white dark:bg-slate-900 flex items-center justify-between text-[10px] text-muted-foreground border-t border-slate-200 dark:border-slate-800">
                <span className="truncate flex items-center gap-1 max-w-[120px]">
                  {att.type === 'video' ? (
                    <Video className="h-3 w-3 text-teal-600 shrink-0" />
                  ) : (
                    <ImageIcon className="h-3 w-3 text-teal-600 shrink-0" />
                  )}
                  {att.name || (att.type === 'video' ? 'Vídeo' : 'Foto')}
                </span>
                <button
                  type="button"
                  onClick={() => onRemoveAttachment(att.id)}
                  className="text-rose-600 hover:text-rose-700 p-1 rounded hover:bg-rose-50"
                  title="Remover anexo"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Botões de Upload Múltiplo */}
      <div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          multiple
          className="hidden"
          onChange={(e) => onAddFiles(e.target.files)}
          disabled={isCompressing}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {/* Opção 1: Fotos e Vídeos da Galeria/Arquivos (Múltiplos) */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isCompressing}
            className="h-10 text-xs border-teal-300 dark:border-teal-700 text-teal-800 dark:text-teal-300 hover:bg-teal-50 flex items-center justify-center gap-1.5 font-semibold"
          >
            {isCompressing ? (
              <>
                <RotateCcw className="h-3.5 w-3.5 animate-spin text-teal-600" />
                Processando arquivos...
              </>
            ) : (
              <>
                <Upload className="h-3.5 w-3.5 text-teal-600" />
                Anexar Fotos / Vídeos (Múltiplos)
              </>
            )}
          </Button>

          {/* Opção 2: Câmera Direta do Celular */}
          <label className="cursor-pointer">
            <input
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => onAddFiles(e.target.files)}
              disabled={isCompressing}
            />
            <div className="h-10 px-3 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 flex items-center justify-center gap-1.5">
              <Camera className="h-3.5 w-3.5 text-teal-700" />
              Tirar Foto com a Câmera
            </div>
          </label>
        </div>
      </div>
    </div>
  )
}

export default function FieldVisitPage({
  sellerMode = false,
  sellerName = '',
  initialVisitData = null,
}: {
  sellerMode?: boolean
  sellerName?: string
  initialVisitData?: FieldVisitData | null
} = {}) {
  const [searchParams] = useSearchParams()
  const location = useLocation()
  const queryVisitId = searchParams.get('id')

  // Estado principal do formulário
  const [visit, setVisit] = useState<FieldVisitData>(() => {
    let savedEmployee = ''
    try {
      savedEmployee = localStorage.getItem(STORAGE_KEY_EMPLOYEE_NAME) || ''

      // Prioridade 1: se recebemos via location.state (navegação direta do botão Editar)
      const locationStateData = (location?.state as any)?.visitData as FieldVisitData | undefined
      if (locationStateData) {
        return {
          ...createInitialVisitData(savedEmployee),
          ...locationStateData,
        }
      }

      // Modo vendedor (link com token): dados vêm do link seguro na edição;
      // em visita nova, começa limpo com o nome fixo do vendedor.
      if (sellerMode) {
        if (initialVisitData) {
          return {
            ...createInitialVisitData(sellerName),
            ...initialVisitData,
          }
        }
        const baseSeller = createInitialVisitData(sellerName || savedEmployee)
        const savedDraftSeller = localStorage.getItem(STORAGE_KEY_CURRENT_VISIT)
        if (savedDraftSeller) {
          try {
            const parsed = JSON.parse(savedDraftSeller)
            return {
              ...baseSeller,
              ...parsed,
              employeeName: sellerName || baseSeller.employeeName,
            }
          } catch (_) {
            // rascunho corrompido: ignora e segue com formulário limpo
          }
        }
        return baseSeller
      }

      // Prioridade 2: draft do localStorage
      const savedDraft = localStorage.getItem(STORAGE_KEY_CURRENT_VISIT)
      if (savedDraft) {
        const parsed = JSON.parse(savedDraft)
        const restoredCompanyName =
          parsed.companyName !== undefined ? parsed.companyName : parsed.clientName || ''
        const restoredClientName = parsed.companyName !== undefined ? parsed.clientName || '' : ''

        return {
          ...createInitialVisitData(savedEmployee),
          ...parsed,
          companyName: restoredCompanyName,
          clientName: restoredClientName,
          employeeName: parsed.employeeName || savedEmployee,
        }
      }
    } catch (e) {
      console.warn('Erro ao restaurar rascunho de visita a campo:', e)
    }
    return createInitialVisitData(savedEmployee)
  })

  // Efeito para carregar do backend caso tenhamos ?id= e os dados ainda não correspondam a ele
  const [isLoadingRecord, setIsLoadingRecord] = useState(false)
  useEffect(() => {
    if (!queryVisitId) return
    if (visit.backendRecordId === queryVisitId) return

    let isMounted = true
    setIsLoadingRecord(true)

    fieldVisitsService
      .getById(queryVisitId)
      .then((record) => {
        if (!isMounted || !record) return
        const { data } = recordToFieldVisitData(record)
        data.backendRecordId = record.id
        data.crmStatus = 'enviada'
        data.lastSentAt = record.sent_at || record.created

        setVisit(data)
        try {
          localStorage.setItem(STORAGE_KEY_CURRENT_VISIT, JSON.stringify(data))
          if (data.employeeName) {
            localStorage.setItem(STORAGE_KEY_EMPLOYEE_NAME, data.employeeName)
          }
        } catch (e) {
          console.warn('Erro ao sincronizar visita carregada no localStorage:', e)
        }
      })
      .catch((err) => {
        console.error('Erro ao carregar visita por ID:', err)
        toast({
          title: 'Aviso',
          description:
            'Não foi possível recuperar a visita pelo servidor. Usando dados salvos localmente.',
          variant: 'destructive',
        })
      })
      .finally(() => {
        if (isMounted) setIsLoadingRecord(false)
      })

    return () => {
      isMounted = false
    }
  }, [queryVisitId, visit.backendRecordId])

  // Reenvio automático da fila de pendentes quando a conexão volta
  useEffect(() => {
    const onOnline = async () => {
      try {
        if (pendingQueue.count() > 0) {
          const r = await pendingQueue.retryAll()
          if (r.sent > 0) {
            toast({
              title: 'Visitas pendentes enviadas!',
              description: `${r.sent} visita(s) sincronizada(s) com o CRM.`,
            })
          }
        }
      } catch (_) {
        // nova tentativa no próximo evento online
      }
    }
    window.addEventListener('online', onOnline)
    return () => window.removeEventListener('online', onOnline)
  }, [])

  // Mensagens e feedbacks
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving'>('saved')
  const [quotaWarning, setQuotaWarning] = useState<string | null>(null)
  const [isSendingToCrm, setIsSendingToCrm] = useState(false)
  const [isPdfDialogOpen, setIsPdfDialogOpen] = useState(false)
  const [isCompressingGlobal, setIsCompressingGlobal] = useState(false)

  // Modais de confirmação
  const [isNewVisitDialogOpen, setIsNewVisitDialogOpen] = useState(false)
  const [equipmentToDelete, setEquipmentToDelete] = useState<string | null>(null)

  // Análise IA: plano de ação sugerido a partir do que o técnico registrou
  const [isAiLoading, setIsAiLoading] = useState(false)
  const [aiConfirmOpen, setAiConfirmOpen] = useState(false)
  const [aiDraft, setAiDraft] = useState<any[] | null>(null)
  const [aiMessage, setAiMessage] = useState('')

  // Leitura Automática de Plaqueta por Foto (OCR Cliente + Agente Skip Cloud)
  const [isReadingNameplate, setIsReadingNameplate] = useState(false)
  const [nameplateReadingStatus, setNameplateReadingStatus] = useState<string>('Lendo placa...')
  const [readingEquipmentId, setReadingEquipmentId] = useState<string | null>(null)
  const [activeReadingAttachmentId, setActiveReadingAttachmentId] = useState<string | null>(null)
  const [ocrReviewOpen, setOcrReviewOpen] = useState(false)
  const [ocrComparisonResult, setOcrComparisonResult] = useState<NameplateComparisonResult | null>(
    null,
  )
  const [targetOcrEquipment, setTargetOcrEquipment] = useState<EquipmentItem | null>(null)

  const handleAiAnalysis = async () => {
    const hasContent =
      (visit.generalObservations || '').trim() ||
      (visit.freeDescription || '').trim() ||
      (visit.equipments || []).some((eq) => (eq.technicianNotes || '').trim())
    if (!hasContent) {
      toast({
        title: 'Sem conteúdo suficiente para análise',
        description: 'Escreva observações ou notas nos equipamentos antes de usar a Análise IA.',
        variant: 'destructive',
      })
      return
    }
    setIsAiLoading(true)
    try {
      const res = await sellerTokenApi.aiPlan({
        work_type: visit.workType || '',
        work_type_other: visit.workTypeOther || '',
        general_notes: visit.generalObservations || '',
        free_description: visit.freeDescription || '',
        equipments: (visit.equipments || []).map((eq) => ({
          id: eq.id,
          name: eq.name || '',
          model: eq.model || '',
          manufacturer: eq.manufacturer || '',
          serialNumber: eq.serialNumber || '',
          plateCount: eq.plateCount || '',
          fluid1: eq.fluid1 || '',
          fluid2: eq.fluid2 || '',
          inletTemp: eq.inletTemp || '',
          outletTemp: eq.outletTemp || '',
          flowRate: eq.flowRate || '',
          flowUnit: eq.flowUnit || '',
          installedLocation: eq.installedLocation || '',
          difficulty: eq.difficulty || '',
          technicianNotes: eq.technicianNotes || '',
          attachments_count: (eq.attachments || []).length,
          // Dados da Plaqueta
          tag: eq.tag || '',
          service: eq.service || '',
          manufacturingNumber: eq.manufacturingNumber || '',
          designPressureBar: eq.designPressureBar || '',
          testPressureBar: eq.testPressureBar || '',
          designTempC: eq.designTempC || '',
          pmtaMpa: eq.pmtaMpa || '',
          emptyWeightKg: eq.emptyWeightKg || '',
          manufacturingYear: eq.manufacturingYear || '',
          tighteningMaxA: eq.tighteningMaxA || '',
          tighteningMinA: eq.tighteningMinA || '',
        })),
      })
      if (res.ok && res.items && res.items.length > 0) {
        setAiDraft(res.items)
        setAiConfirmOpen(true)
      } else {
        toast({
          title: res.message || 'Análise indisponível',
          description: 'Não foi possível gerar a análise da IA com os dados atuais.',
          variant: 'destructive',
        })
      }
    } catch (_) {
      toast({
        title: 'Falha na análise IA',
        description: 'Tente acionar novamente.',
        variant: 'destructive',
      })
    } finally {
      setIsAiLoading(false)
    }
  }

  const handleAiConfirm = () => {
    if (!aiDraft || aiDraft.length === 0) return
    const mapped: any[] = aiDraft.map((it) => ({
      id: generateId(),
      title: it.title || 'Item do plano',
      description: it.description || '',
      priority: ['Alta', 'Média', 'Baixa'].includes(it.priority) ? it.priority : 'Média',
      suggestedAction: it.suggestedAction || '',
      source: it.equipment_id ? 'Equipamento sinalizado (com foto no relatório)' : undefined,
      equipment_id: it.equipment_id || undefined,
      diagnosis: it.diagnosis || undefined,
      technicalReference: it.technicalReference || undefined,
      installationConditions: it.installationConditions || undefined,
      pendingItems:
        Array.isArray(it.pendingItems) && it.pendingItems.length > 0 ? it.pendingItems : undefined,
    }))
    setVisit((prev) => ({ ...prev, actionPlan: mapped }))
    setAiConfirmOpen(false)
    setAiDraft(null)
    toast({
      title: 'Plano de ação da IA aplicado',
      description: 'Plano de ação estruturado em 4 seções atualizado com sucesso.',
    })
  }

  // Determinar qual é o fluxo ativo:
  // "Projeto Novo", "Readequação" ou "Outro" = fluxo enxuto (lean)
  // "Manutenção Preventiva", "Manutenção Corretiva", "Catálogo de Equipamentos" = fluxo completo detalhado
  const isLeanFlow =
    visit.workType === 'Projeto Novo' ||
    visit.workType === 'Readequação' ||
    visit.workType === 'Outro' ||
    visit.workType === 'Projeto novo ou readequação'

  // Auto-save com debounce de 400ms (Regra geral: salvar automaticamente cada campo preenchido)
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
        if (
          err.name === 'QuotaExceededError' ||
          err.code === 22 ||
          err.code === 1014 ||
          err.name === 'NS_ERROR_DOM_QUOTA_REACHED'
        ) {
          setQuotaWarning(
            'Atenção: O limite de armazenamento local foi atingido devido a múltiplos vídeos ou fotos em alta resolução. Seus textos continuam preservados na tela, mas recomendamos enviar ao CRM.',
          )
        } else {
          setQuotaWarning(
            'Não foi possível salvar no armazenamento local: ' +
              (err.message || 'Erro desconhecido'),
          )
        }
        setSaveStatus('saved')
      }
    }, 1000)

    return () => clearTimeout(timer)
  }, [visit])

  // Salvar também ao sair/minimizar a página (mobile: momento mais comum de perda)
  useEffect(() => {
    const saveNow = () => {
      try {
        localStorage.setItem(
          STORAGE_KEY_CURRENT_VISIT,
          JSON.stringify({ ...visit, updatedAt: new Date().toISOString() }),
        )
      } catch (_) {
        // storage indisponível: segue sem travar
      }
    }
    window.addEventListener('pagehide', saveNow)
    document.addEventListener('visibilitychange', saveNow)
    return () => {
      window.removeEventListener('pagehide', saveNow)
      document.removeEventListener('visibilitychange', saveNow)
    }
  }, [visit])

  // Auto-save por inatividade: se o técnico parar de digitar por 15s, salva na hora
  // (protege contra perda quando o app do navegador é fechado sem disparar pagehide)
  useEffect(() => {
    const idleSave = setTimeout(() => {
      try {
        localStorage.setItem(
          STORAGE_KEY_CURRENT_VISIT,
          JSON.stringify({ ...visit, updatedAt: new Date().toISOString() }),
        )
      } catch (_) {
        // storage indisponível: segue sem travar
      }
    }, 15000)
    return () => clearTimeout(idleSave)
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

  // Handlers para anexos gerais da visita (fluxo enxuto)
  const handleAddVisitAttachments = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    setIsCompressingGlobal(true)
    try {
      const newAttachments: MediaAttachment[] = []
      for (let i = 0; i < files.length; i++) {
        const item = await readFileAsMediaAttachment(files[i])
        newAttachments.push(item)
      }
      setVisit((prev) => ({
        ...prev,
        visitAttachments: [...(prev.visitAttachments || []), ...newAttachments],
      }))
      toast({
        title: 'Anexos adicionados',
        description: `${newAttachments.length} ${newAttachments.length === 1 ? 'arquivo anexado' : 'arquivos anexados'} com sucesso.`,
      })
    } catch (err: any) {
      console.error('Erro ao processar anexos da visita:', err)
      toast({
        title: 'Erro ao anexar arquivo',
        description: err.message || 'Não foi possível carregar o arquivo.',
        variant: 'destructive',
      })
    } finally {
      setIsCompressingGlobal(false)
    }
  }

  const handleRemoveVisitAttachment = (attachmentId: string) => {
    setVisit((prev) => ({
      ...prev,
      visitAttachments: (prev.visitAttachments || []).filter((a) => a.id !== attachmentId),
    }))
  }

  // Ações de Equipamentos
  const handleAddEquipment = (customName?: string) => {
    const nextIndex = visit.equipments.length + 1
    const padStr = String(nextIndex).padStart(2, '0')
    const newEq = createEmptyEquipment(customName || `Equipamento ${padStr}`)
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

  // Anexos múltiplos por equipamento + acoplamento do fluxo de leitura automática da foto
  const handleAddEquipmentAttachments = async (equipmentId: string, files: FileList | null) => {
    if (!files || files.length === 0) return
    setIsCompressingGlobal(true)
    try {
      const newAttachments: MediaAttachment[] = []
      for (let i = 0; i < files.length; i++) {
        const item = await readFileAsMediaAttachment(files[i])
        newAttachments.push(item)
      }

      setVisit((prev) => ({
        ...prev,
        equipments: prev.equipments.map((eq) => {
          if (eq.id !== equipmentId) return eq
          const current = eq.attachments || []
          const updated = [...current, ...newAttachments]
          return {
            ...eq,
            attachments: updated,
            // Sincroniza também photoDataUrl para retrocompatibilidade se for imagem
            photoDataUrl: updated.find((a) => a.type === 'image')?.dataUrl || eq.photoDataUrl,
          }
        }),
      }))

      toast({
        title: 'Anexo adicionado ao equipamento',
        description: `${newAttachments.length} ${newAttachments.length === 1 ? 'arquivo salvo' : 'arquivos salvos'}.`,
      })

      // Se houver fotos entre os arquivos anexados, dispara a leitura da 1ª imagem automaticamente
      const firstPhoto = newAttachments.find((a) => a.type === 'image' || !a.type)
      if (firstPhoto) {
        handleTriggerNameplateOcr(equipmentId, firstPhoto)
      }
    } catch (err: any) {
      console.error('Erro ao processar anexos do equipamento:', err)
      toast({
        title: 'Erro ao anexar',
        description: err.message || 'Falha ao processar arquivo.',
        variant: 'destructive',
      })
    } finally {
      setIsCompressingGlobal(false)
    }
  }

  // Acionamento da Leitura Automática de Plaqueta via OCR no cliente + Backend Skip Cloud
  const handleTriggerNameplateOcr = async (equipmentId: string, photo: MediaAttachment) => {
    const currentEq = visit.equipments.find((e) => e.id === equipmentId)
    if (!currentEq) return

    setIsReadingNameplate(true)
    setNameplateReadingStatus('Lendo placa...')
    setReadingEquipmentId(equipmentId)
    setActiveReadingAttachmentId(photo.id)

    try {
      // 1. OCR no navegador com Tesseract.js e pré-processamento via canvas
      let ocrText = ''
      try {
        const { runClientOcr } = await import('@/services/client-ocr')
        const ocrResult = await runClientOcr(photo.dataUrl, (p) => {
          setNameplateReadingStatus(p.status || 'Lendo placa...')
        })
        ocrText = (ocrResult.text || '').trim()
      } catch (ocrErr) {
        console.warn('[FieldVisitPage] Falha no OCR do cliente:', ocrErr)
      }

      // Se o OCR não retornou texto visível suficiente
      if (!ocrText) {
        toast({
          title: 'Não foi possível ler a placa',
          description: 'Tire a foto novamente ou preencha manualmente.',
        })
        return
      }

      setNameplateReadingStatus('Interpretando dados técnicos...')

      // 2. Envia apenas o texto transcrito ao backend (sem base64 pesada de imagem)
      const res = await readNameplateFromImage({
        clientOcrText: ocrText,
        context: `Equipamento ${currentEq.name || ''} - Modelo atual: ${currentEq.model || 'vazio'}`,
      })

      if (res.ok && res.data) {
        const comparison = compareAndMergeNameplateData(currentEq, res.data, photo.id)
        setOcrComparisonResult(comparison)
        setTargetOcrEquipment(currentEq)
        setOcrReviewOpen(true)
      } else {
        toast({
          title: 'Não foi possível ler a placa',
          description: res.message || 'Tire a foto novamente ou preencha manualmente.',
        })
      }
    } catch (err: any) {
      console.warn('Falha na leitura da plaqueta:', err)
      toast({
        title: 'Não foi possível ler a placa',
        description: 'Tire a foto novamente ou preencha manualmente.',
      })
    } finally {
      setIsReadingNameplate(false)
      setNameplateReadingStatus('Lendo placa...')
      setReadingEquipmentId(null)
      setActiveReadingAttachmentId(null)
    }
  }

  // Aplicação da confirmação leve de leitura da plaqueta
  const handleApplyNameplateOcr = (mergedEq: EquipmentItem) => {
    if (!mergedEq || !mergedEq.id) return
    const targetId = mergedEq.id

    setVisit((prev) => {
      // Localiza o equipamento alvo no estado mais recente
      const currentEq = prev.equipments.find((e) => e.id === targetId)
      if (!currentEq) return prev

      // Helper para preencher SÓ campos vazios, preservando estritamente valores já digitados
      const fillOnlyIfEmpty = (currentVal: any, incomingVal: any): string => {
        const c = currentVal !== undefined && currentVal !== null ? String(currentVal).trim() : ''
        if (c) return String(currentVal)
        return incomingVal !== undefined && incomingVal !== null ? String(incomingVal).trim() : ''
      }

      // Mesclagem segura campo a campo
      const updatedEquipment: EquipmentItem = {
        ...currentEq,
        tag: fillOnlyIfEmpty(currentEq.tag, mergedEq.tag),
        service: fillOnlyIfEmpty(currentEq.service, mergedEq.service),
        manufacturingNumber: fillOnlyIfEmpty(
          currentEq.manufacturingNumber,
          mergedEq.manufacturingNumber,
        ),
        model: fillOnlyIfEmpty(currentEq.model, mergedEq.model),
        manufacturer: fillOnlyIfEmpty(currentEq.manufacturer, mergedEq.manufacturer),
        serialNumber: fillOnlyIfEmpty(currentEq.serialNumber, mergedEq.serialNumber),
        designPressureBar: fillOnlyIfEmpty(currentEq.designPressureBar, mergedEq.designPressureBar),
        testPressureBar: fillOnlyIfEmpty(currentEq.testPressureBar, mergedEq.testPressureBar),
        designTempC: fillOnlyIfEmpty(currentEq.designTempC, mergedEq.designTempC),
        pmtaMpa: fillOnlyIfEmpty(currentEq.pmtaMpa, mergedEq.pmtaMpa),
        emptyWeightKg: fillOnlyIfEmpty(currentEq.emptyWeightKg, mergedEq.emptyWeightKg),
        manufacturingYear: fillOnlyIfEmpty(currentEq.manufacturingYear, mergedEq.manufacturingYear),
        tighteningMaxA: fillOnlyIfEmpty(currentEq.tighteningMaxA, mergedEq.tighteningMaxA),
        tighteningMinA: fillOnlyIfEmpty(currentEq.tighteningMinA, mergedEq.tighteningMinA),
        plateCount: fillOnlyIfEmpty(currentEq.plateCount, mergedEq.plateCount),
        fluid1: fillOnlyIfEmpty(currentEq.fluid1, mergedEq.fluid1),
        fluid2: fillOnlyIfEmpty(currentEq.fluid2, mergedEq.fluid2),
      }

      // Adicionar customFields novos vindos do OCR sem duplicar labels existentes
      const currentCustom = currentEq.customFields || []
      const incomingCustom = mergedEq.customFields || []
      const mergedCustom = [...currentCustom]

      for (const inc of incomingCustom) {
        const incLabel = (inc.label || '').trim().toLowerCase()
        if (!incLabel) continue
        const alreadyExists = mergedCustom.some(
          (c) => (c.label || '').trim().toLowerCase() === incLabel,
        )
        if (!alreadyExists) {
          mergedCustom.push(inc)
        }
      }
      updatedEquipment.customFields = mergedCustom

      // Preservar metadados da leitura e discrepâncias
      updatedEquipment.nameplateOcrData = {
        ...(currentEq.nameplateOcrData || {}),
        ...(mergedEq.nameplateOcrData || {}),
        discrepancies:
          mergedEq.nameplateOcrData?.discrepancies ||
          ocrComparisonResult?.discrepancies ||
          currentEq.nameplateOcrData?.discrepancies ||
          [],
      }

      return {
        ...prev,
        equipments: prev.equipments.map((eq) => (eq.id === targetId ? updatedEquipment : eq)),
      }
    })

    setOcrReviewOpen(false)
    setOcrComparisonResult(null)
    setTargetOcrEquipment(null)
    toast({
      title: 'Dados da plaqueta aplicados!',
      description: 'Campos vazios preenchidos e novos campos adicionados com sucesso.',
    })
  }

  const handleDiscardNameplateOcr = () => {
    setOcrReviewOpen(false)
    setOcrComparisonResult(null)
    setTargetOcrEquipment(null)
  }

  const handleRemoveEquipmentAttachment = (equipmentId: string, attachmentId: string) => {
    setVisit((prev) => ({
      ...prev,
      equipments: prev.equipments.map((eq) => {
        if (eq.id !== equipmentId) return eq
        const updated = (eq.attachments || []).filter((a) => a.id !== attachmentId)
        return {
          ...eq,
          attachments: updated,
          photoDataUrl: updated.find((a) => a.type === 'image')?.dataUrl,
        }
      }),
    }))
  }

  // Envio ao CRM PocketBase
  const handleSendToCrm = async () => {
    const trimmedEmployee = (visit.employeeName || '').trim()
    const trimmedDate = (visit.date || '').trim()

    // Validação prévia: os 3 campos obrigatórios (nunca bloquear em silêncio)
    const missing: string[] = []
    if (!(visit.date || '').trim()) missing.push('Data da visita')
    if (!((visit.companyName || '').trim() || (visit.clientName || '').trim()))
      missing.push('Cliente/Empresa')
    if (!visit.workType) missing.push('Tipo de visita')
    if (missing.length > 0) {
      toast({
        title: 'Faltam campos obrigatórios',
        description: 'Preencha: ' + missing.join(', ') + '.',
        variant: 'destructive',
      })
      return
    }

    setIsSendingToCrm(true)
    const nowIso = new Date().toISOString()

    // Preserva o plano já gerado (pela IA ou existente no formulário), sem regenerar automaticamente
    const currentPlan = visit.actionPlan && visit.actionPlan.length > 0 ? visit.actionPlan : []

    // Formatar nome de cliente/empresa compatível
    const companyTrimmed = (visit.companyName || '').trim()
    const contactPersonTrimmed = (visit.clientName || '').trim()
    let combinedClientName: string | undefined = undefined
    if (companyTrimmed && contactPersonTrimmed) {
      combinedClientName = `${companyTrimmed} (${contactPersonTrimmed})`
    } else if (companyTrimmed) {
      combinedClientName = companyTrimmed
    } else if (contactPersonTrimmed) {
      combinedClientName = contactPersonTrimmed
    }

    // Preparar payload salvando em campos aditivos sem sobrescrever ou perder dados
    const payload: Partial<FieldVisitRecord> = {
      employee_name: trimmedEmployee || 'Técnico Intertermal',
      visit_date: trimmedDate || undefined,
      start_time: visit.startTime || undefined,
      end_time: visit.endTime || undefined,
      duration: visit.visitDuration || undefined,
      client_name: combinedClientName,
      company_name: companyTrimmed || undefined,
      contact_person: contactPersonTrimmed || undefined,
      client_role: visit.clientRole?.trim() || undefined,
      client_contact: visit.clientContact?.trim() || undefined,
      client_email: visit.clientEmail?.trim() || undefined,
      work_area: visit.clientWorkArea?.trim() || undefined,
      work_type: visit.workType || undefined,
      work_type_other: visit.workTypeOther?.trim() || undefined,
      general_notes: visit.generalObservations?.trim() || undefined,
      free_description: visit.freeDescription?.trim() || undefined,
      action_plan: currentPlan,
      equipment: visit.equipments || [],
      status: 'enviada',
      sent_at: nowIso,
    }

    // Identificador único da visita gerado no celular (idempotência de reenvio).
    let clientVisitId = (visit as any).clientVisitId || ''
    if (!clientVisitId) {
      clientVisitId =
        'cv_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 10)
      setVisit((prev) => ({ ...prev, clientVisitId }) as any)
    }

    if (sellerMode) {
      // Modo vendedor: envio pelo link seguro (token + aparelho autorizado), sem login.
      const submitRes = await sellerTokenApi.submitVisit({
        token: getStoredToken(),
        device_id: getStoredDeviceId(),
        client_visit_id: clientVisitId,
        visit: {
          visit_date: trimmedDate || undefined,
          start_time: visit.startTime || undefined,
          end_time: visit.endTime || undefined,
          duration: visit.visitDuration || undefined,
          client_name: combinedClientName,
          company_name: companyTrimmed || undefined,
          contact_person: contactPersonTrimmed || undefined,
          client_role: visit.clientRole?.trim() || undefined,
          client_contact: visit.clientContact?.trim() || undefined,
          client_email: visit.clientEmail?.trim() || undefined,
          work_area: visit.clientWorkArea?.trim() || undefined,
          work_type: visit.workType || undefined,
          work_type_other: visit.workTypeOther?.trim() || undefined,
          general_notes: visit.generalObservations?.trim() || undefined,
          free_description: visit.freeDescription?.trim() || undefined,
          action_plan: currentPlan,
          equipment: visit.equipments || [],
        },
        edit_id: visit.backendRecordId || undefined,
      })
      if (!submitRes.ok) {
        if (submitRes.error === 'device_not_authorized' || submitRes.error === 'invalid_token') {
          // Segurança: não entra na fila; pede ação do Alex.
          const msg =
            submitRes.error === 'device_not_authorized'
              ? 'Aparelho não autorizado. Fale com o Alex para liberar este celular.'
              : 'Seu link de acesso não está mais ativo. Peça um novo link ao Alex.'
          toast({ title: 'Erro ao enviar ao CRM', description: msg, variant: 'destructive' })
          setIsSendingToCrm(false)
          return
        }
        // Falha de rede/servidor: salva na fila de pendentes (idempotente).
        pendingQueue.add({
          client_visit_id: clientVisitId,
          visit: {
            visit_date: trimmedDate || undefined,
            start_time: visit.startTime || undefined,
            end_time: visit.endTime || undefined,
            duration: visit.visitDuration || undefined,
            client_name: combinedClientName,
            company_name: companyTrimmed || undefined,
            contact_person: contactPersonTrimmed || undefined,
            client_role: visit.clientRole?.trim() || undefined,
            client_contact: visit.clientContact?.trim() || undefined,
            client_email: visit.clientEmail?.trim() || undefined,
            work_area: visit.clientWorkArea?.trim() || undefined,
            work_type: visit.workType || undefined,
            work_type_other: visit.workTypeOther?.trim() || undefined,
            general_notes: visit.generalObservations?.trim() || undefined,
            free_description: visit.freeDescription?.trim() || undefined,
            action_plan: currentPlan,
            equipment: visit.equipments || [],
          },
          edit_id: visit.backendRecordId || undefined,
          seller_token: getStoredToken(),
        })
        setVisit((prev) => ({ ...prev, crmStatus: 'pendente' }) as any)
        toast({
          title: 'Sem conexão — visita salva em Pendentes',
          description: 'Será enviada automaticamente quando a internet voltar.',
          variant: 'destructive',
        })
        setIsSendingToCrm(false)
        return
      }
      setVisit((prev) => ({
        ...prev,
        actionPlan: currentPlan,
        backendRecordId: submitRes.visit_id || prev.backendRecordId,
        crmStatus: 'enviada',
        lastSentAt: nowIso,
        updatedAt: nowIso,
      }))
      toast({
        title: submitRes.edited ? 'Visita atualizada no CRM!' : 'Visita enviada ao CRM!',
        description: 'Relatório gravado com sucesso no CRM Intertermal.',
      })
      setIsSendingToCrm(false)
      return
    }

    try {
      let savedRecord: FieldVisitRecord
      if (visit.backendRecordId) {
        // Reenvio: atualiza o mesmo registro sem duplicar
        savedRecord = await fieldVisitsService.update(visit.backendRecordId, payload)
        toast({
          title: 'Visita atualizada no CRM!',
          description: `Os dados da visita e plano de ação foram sincronizados com sucesso.`,
        })
      } else {
        // Primeiro envio: cria novo registro
        savedRecord = await fieldVisitsService.create(payload)
        toast({
          title: 'Visita enviada ao CRM!',
          description: `Visita técnica gravada com sucesso no CRM Intertermal.`,
        })
      }

      setVisit((prev) => ({
        ...prev,
        actionPlan: currentPlan,
        backendRecordId: savedRecord.id,
        crmStatus: 'enviada',
        lastSentAt: nowIso,
        updatedAt: nowIso,
      }))
    } catch (err: any) {
      console.error('Erro ao enviar visita ao CRM:', err)
      toast({
        title: 'Erro ao enviar ao CRM',
        description:
          err.message ||
          'Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setIsSendingToCrm(false)
    }
  }

  // Nova Visita (Limpeza com confirmação, mantendo nome do funcionário)
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
            {sellerMode ? (
              <button
                type="button"
                onClick={() => {
                  window.location.href = '/visita-vendedor?lista=1'
                }}
                className="inline-flex items-center justify-center h-10 w-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-teal-50 hover:text-teal-700 transition-colors"
                title="Minhas visitas"
              >
                <FileText className="h-5 w-5" />
              </button>
            ) : (
              <Link
                to="/"
                className="inline-flex items-center justify-center h-10 w-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-teal-50 hover:text-teal-700 transition-colors"
                title="Voltar ao Painel Geral"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
            )}
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
                  <span className="hidden md:inline">Salvando...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                  <span className="hidden md:inline font-medium text-emerald-700 dark:text-emerald-400">
                    Salvo
                  </span>
                </>
              )}
            </div>

            {/* Botão Análise IA */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAiAnalysis}
              disabled={isAiLoading}
              className="text-xs h-9 border-violet-300 dark:border-violet-800 text-violet-800 dark:text-violet-300 hover:bg-violet-50 dark:hover:bg-violet-950 font-semibold"
              title="Gerar plano de ação com IA a partir das observações e dados registrados"
            >
              {isAiLoading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                  Analisando...
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5 mr-1 text-violet-600" />
                  <span className="hidden sm:inline">Análise </span>IA
                </>
              )}
            </Button>

            {/* Botão Gerar PDF Resumo */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsPdfDialogOpen(true)}
              className="text-xs h-9 border-teal-300 dark:border-teal-800 text-teal-800 dark:text-teal-300 hover:bg-teal-50 dark:hover:bg-teal-950 font-semibold"
              title="Gerar visualização e PDF da visita em formato A4"
            >
              <Printer className="h-3.5 w-3.5 mr-1 text-teal-600" />
              <span className="hidden sm:inline">Resumo em </span>PDF
            </Button>

            {/* Botão Enviar ao CRM (Topo) */}
            <Button
              type="button"
              size="sm"
              onClick={handleSendToCrm}
              disabled={isSendingToCrm}
              className={`text-xs h-9 font-bold px-3 shadow-xs ${
                visit.crmStatus === 'enviada'
                  ? 'bg-emerald-700 hover:bg-emerald-600 text-white'
                  : 'bg-teal-700 hover:bg-teal-600 text-white'
              }`}
              title={
                visit.crmStatus === 'enviada'
                  ? 'Reenviar alterações ao CRM'
                  : 'Enviar relatório da visita ao CRM'
              }
            >
              {isSendingToCrm ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                  Enviando...
                </>
              ) : visit.crmStatus === 'enviada' ? (
                <>
                  <Check className="h-3.5 w-3.5 mr-1" />
                  Reenviar CRM
                </>
              ) : (
                <>
                  <Send className="h-3.5 w-3.5 mr-1" />
                  Enviar CRM
                </>
              )}
            </Button>

            {/* Botão Nova Visita */}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsNewVisitDialogOpen(true)}
              className="text-xs h-9 text-slate-500 hover:bg-rose-50 hover:text-rose-700 px-2"
              title="Iniciar nova visita em branco"
            >
              <RotateCcw className="h-3.5 w-3.5 sm:mr-1" />
              <span className="hidden sm:inline">Nova</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="max-w-3xl mx-auto px-4 pt-4 space-y-5">
        {/* Aviso de Navegador Embutido (WhatsApp / Instagram / redes sociais) */}
        {detectBrowserEnvironment().isInAppBrowser && (
          <div className="p-4 rounded-xl bg-amber-500/10 dark:bg-amber-950/50 border-2 border-amber-500/40 text-amber-950 dark:text-amber-200 text-xs space-y-2 shadow-xs animate-in fade-in">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1 flex-1">
                <p className="font-bold text-sm text-amber-950 dark:text-amber-100">
                  Abra este link no Chrome ou Safari para gravar voz
                </p>
                <p className="text-xs leading-relaxed text-amber-900/90 dark:text-amber-200/90">
                  Você está visualizando a página pelo navegador interno do WhatsApp/Instagram, que
                  bloqueia o uso do microfone por questões de segurança. Para gravar seu relato por
                  voz:
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-amber-300/60 dark:border-amber-800/60">
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  try {
                    navigator.clipboard.writeText(window.location.href)
                    toast({
                      title: 'Link copiado!',
                      description: 'Abra seu navegador Chrome ou Safari e cole o endereço.',
                    })
                  } catch {
                    toast({
                      title: 'Copie o link da barra de endereço',
                      description: window.location.href,
                    })
                  }
                }}
                className="h-8 text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white shadow-xs"
              >
                <Copy className="h-3.5 w-3.5 mr-1.5" />
                Copiar link da página
              </Button>

              <span className="text-[11px] text-amber-800 dark:text-amber-300">
                Toque nos três pontos ou no ícone de compartilhar e selecione &quot;Abrir no
                navegador&quot;.
              </span>
            </div>
          </div>
        )}

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

        {/* Indicador de carregamento */}
        {isLoadingRecord && (
          <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 flex items-center gap-2 text-xs text-amber-900 dark:text-amber-200 shadow-xs">
            <Loader2 className="h-4 w-4 animate-spin text-amber-600" />
            <span>Carregando dados da visita técnica para edição...</span>
          </div>
        )}

        {/* Banner de Status de Envio ao CRM */}
        {visit.crmStatus === 'enviada' && (
          <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 flex items-center justify-between flex-wrap gap-2 text-xs shadow-xs">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                <Check className="h-4 w-4" />
              </div>
              <div>
                <div className="font-bold text-emerald-900 dark:text-emerald-200 flex items-center gap-2">
                  <span>Enviado ao CRM Intertermal</span>
                  <Badge className="bg-emerald-700 text-white text-[9px] font-mono">
                    ID: {visit.backendRecordId?.slice(0, 8)}...
                  </Badge>
                  {queryVisitId && (
                    <Badge
                      variant="outline"
                      className="text-[9px] bg-amber-50 text-amber-800 border-amber-300"
                    >
                      Modo Edição
                    </Badge>
                  )}
                </div>
                <div className="text-[11px] text-emerald-700 dark:text-emerald-300 mt-0.5">
                  {visit.lastSentAt
                    ? `Último envio sincronizado em: ${new Date(visit.lastSentAt).toLocaleString('pt-BR')}`
                    : 'Registro sincronizado com o banco de dados.'}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link to="/visitas-recebidas">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Ver Visitas Recebidas
                </Button>
              </Link>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsPdfDialogOpen(true)}
                className="h-8 text-xs border-emerald-300 text-emerald-800 dark:border-emerald-700 dark:text-emerald-300 hover:bg-emerald-100/60"
              >
                <Printer className="h-3.5 w-3.5 mr-1" />
                Resumo PDF
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleSendToCrm}
                disabled={isSendingToCrm}
                className="h-8 text-xs font-semibold bg-emerald-700 hover:bg-emerald-600 text-white"
              >
                {isSendingToCrm ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                ) : (
                  <RotateCcw className="h-3.5 w-3.5 mr-1" />
                )}
                Salvar Alterações
              </Button>
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
                value={sellerMode ? sellerName : visit.employeeName}
                onChange={(e) => handleEmployeeChange(e.target.value)}
                disabled={sellerMode}
                placeholder="Ex.: Carlos Alberto Souza"
                className={`h-11 text-sm bg-slate-50/70 dark:bg-slate-950 focus-visible:ring-teal-600 ${sellerMode ? 'opacity-80' : ''}`}
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
                <Input
                  type="date"
                  value={visit.date}
                  onChange={(e) => setVisit((prev) => ({ ...prev, date: e.target.value }))}
                  className="h-11 text-sm bg-slate-50/70 dark:bg-slate-950"
                />
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
                Calculado automaticamente entre início e término, com ajuste manual livre se
                necessário.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 3. SEÇÃO: CLIENTE E E-MAIL */}
        <Card className="border-slate-200 dark:border-slate-800 shadow-xs bg-white dark:bg-slate-900">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 flex items-center justify-center">
                <Building className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-sm font-bold">3. Cliente Industrial</CardTitle>
                <p className="text-[11px] text-muted-foreground">
                  Identificação da empresa, contato e e-mail para envio do relatório
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Campo Empresa */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Empresa
                </label>
                <Input
                  value={visit.companyName}
                  onChange={(e) => setVisit((prev) => ({ ...prev, companyName: e.target.value }))}
                  placeholder="Ex.: Usina São Martinho, Cervejaria Petrópolis"
                  className="h-11 text-sm bg-slate-50/70 dark:bg-slate-950"
                />
              </div>

              {/* Campo Nome do cliente (Pessoa de contato) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Nome do cliente
                </label>
                <Input
                  value={visit.clientName}
                  onChange={(e) => setVisit((prev) => ({ ...prev, clientName: e.target.value }))}
                  placeholder="Ex.: Carlos Mendes, Amanda Silva"
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
                  Telefone de Contato
                </label>
                <Input
                  value={visit.clientContact}
                  onChange={(e) => setVisit((prev) => ({ ...prev, clientContact: e.target.value }))}
                  placeholder="Ex.: (16) 99876-5432"
                  className="h-11 text-sm bg-slate-50/70 dark:bg-slate-950"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-teal-600" />
                  E-mail do cliente (Envio de relatório)
                </label>
                <Input
                  type="email"
                  value={visit.clientEmail || ''}
                  onChange={(e) => setVisit((prev) => ({ ...prev, clientEmail: e.target.value }))}
                  placeholder="Ex.: cliente@empresa.com.br"
                  className="h-11 text-sm bg-slate-50/70 dark:bg-slate-950"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Área / Setor
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

        {/* 4. SEÇÃO: SELEÇÃO DOS 6 TIPOS DE VISITA (CARDS GRANDES MOBILE-FIRST) */}
        <Card className="border-slate-200 dark:border-slate-800 shadow-xs bg-white dark:bg-slate-900">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 flex items-center justify-center">
                <Wrench className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-sm font-bold">4. Tipo de Visita</CardTitle>
                <p className="text-[11px] text-muted-foreground">
                  Escolha um dos 6 tipos abaixo. O formulário se ajusta automaticamente ao fluxo
                  adequado.
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {WORK_TYPE_OPTIONS.map((opt) => {
                const isSelected =
                  visit.workType === opt.label ||
                  (opt.label === 'Projeto Novo' &&
                    visit.workType === 'Projeto novo ou readequação') ||
                  (opt.label === 'Catálogo de Equipamentos' &&
                    visit.workType === 'Catalogação de equipamentos') ||
                  (opt.label === 'Manutenção Preventiva' &&
                    visit.workType === 'Manutenção preventiva ou corretiva')

                return (
                  <button
                    key={opt.label}
                    type="button"
                    onClick={() => {
                      setVisit((prev) => ({ ...prev, workType: opt.label }))
                    }}
                    className={`p-4 rounded-xl text-left border-2 transition-all flex flex-col justify-between min-h-[110px] ${
                      isSelected
                        ? 'border-teal-600 bg-teal-50/90 dark:bg-teal-950/40 shadow-sm ring-1 ring-teal-600'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span
                        className={`text-sm font-bold ${
                          isSelected
                            ? 'text-teal-950 dark:text-teal-200'
                            : 'text-slate-800 dark:text-slate-200'
                        }`}
                      >
                        {opt.label}
                      </span>
                      {isSelected && (
                        <CheckCircle2 className="h-5 w-5 text-teal-700 dark:text-teal-400 shrink-0 mt-0.5" />
                      )}
                    </div>

                    <div className="mt-2 space-y-1">
                      <Badge
                        variant="outline"
                        className={`text-[9px] px-1.5 py-0 ${
                          opt.category === 'lean'
                            ? 'border-teal-300 text-teal-700 bg-teal-50/50'
                            : 'border-blue-300 text-blue-700 bg-blue-50/50'
                        }`}
                      >
                        {opt.badge}
                      </Badge>
                      <p className="text-[11px] text-muted-foreground leading-snug">
                        {opt.description}
                      </p>
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Campo de texto livre para 'Outro' */}
            {visit.workType === 'Outro' && (
              <div className="pt-2 animate-in fade-in slide-in-from-top-1 duration-200">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Especifique a atividade realizada:
                </label>
                <Input
                  value={visit.workTypeOther}
                  onChange={(e) => setVisit((prev) => ({ ...prev, workTypeOther: e.target.value }))}
                  placeholder="Descreva o propósito da visita..."
                  className="h-11 text-sm bg-slate-50/70 dark:bg-slate-950"
                  autoFocus
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* ========================================================================= */}
        {/* FLUXO 1: PROJETO NOVO, READEQUAÇÃO E OUTRO (ENXUTO COM VOZ E ANEXOS SEPARADOS) */}
        {/* ========================================================================= */}
        {isLeanFlow ? (
          <div className="space-y-5 animate-in fade-in duration-300">
            {/* Campo em branco para Descrição Livre com Digitação OU Gravação de Voz */}
            <Card className="border-teal-200 dark:border-teal-900/60 shadow-xs bg-white dark:bg-slate-900">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 flex items-center justify-center">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-bold">
                      5. Descrição Livre da Visita
                    </CardTitle>
                    <p className="text-[11px] text-muted-foreground">
                      Preenchimento por digitação manual OU gravação de voz (transcrição automática,
                      100% editável após falar)
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <VoiceDictationField
                  label="Relato e levantamento técnico da visita:"
                  sublabel="Fale ao microfone para transcrever ou digite normalmente."
                  value={visit.freeDescription || visit.generalObservations || ''}
                  onChange={(val) =>
                    setVisit((prev) => ({
                      ...prev,
                      freeDescription: val,
                      generalObservations: val, // sincroniza para manter compatibilidade
                    }))
                  }
                  onSaveAudioAttachment={(audioFile) => {
                    const newAtt: MediaAttachment = {
                      id: generateId(),
                      type: 'audio',
                      name: audioFile.name,
                      dataUrl: audioFile.dataUrl,
                      size: audioFile.blob.size,
                      createdAt: new Date().toISOString(),
                    }
                    setVisit((prev) => ({
                      ...prev,
                      visitAttachments: [...(prev.visitAttachments || []), newAtt],
                    }))
                    toast({
                      title: 'Áudio anexado à visita',
                      description: 'Gravação salva como anexo da visita com sucesso.',
                    })
                  }}
                  placeholder="Ex.: Visita na planta para levantamento de novo trocador BERMO no setor de pasteurização. Vazão desejada de 30m³/h, temperatura de entrada 85°C..."
                  rows={6}
                />
              </CardContent>
            </Card>

            {/* Anexos Gerais da Visita (Múltiplas Fotos e Vídeos) */}
            <Card className="border-slate-200 dark:border-slate-800 shadow-xs bg-white dark:bg-slate-900">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 flex items-center justify-center">
                    <Film className="h-4 w-4" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-bold">
                      6. Anexos Gerais da Visita (Fotos e Vídeos)
                    </CardTitle>
                    <p className="text-[11px] text-muted-foreground">
                      Anexe mais de 1 foto ou vídeo das instalações, tubulações ou planta do cliente
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <MultiMediaAttachmentField
                  title="Fotos e Vídeos Gerais"
                  description="Aceita múltiplos arquivos de foto e vídeo. Ficam salvos no celular e são enviados ao CRM."
                  attachments={visit.visitAttachments || []}
                  onAddFiles={handleAddVisitAttachments}
                  onRemoveAttachment={handleRemoveVisitAttachment}
                  isCompressing={isCompressingGlobal}
                />
              </CardContent>
            </Card>

            {/* Seções de Anexos por Equipamento Separados ("Equipamento 01", "Equipamento 02"...) */}
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-2 pt-1">
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Layers className="h-5 w-5 text-teal-700 dark:text-teal-400" />
                    Anexos por Equipamento Separados
                    <Badge variant="secondary" className="text-xs">
                      {visit.equipments.length}
                    </Badge>
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Cada equipamento tem sua própria seção de anexos com botão para adicionar mais
                  </p>
                </div>

                <Button
                  type="button"
                  onClick={() => handleAddEquipment()}
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
                      Nenhum equipamento separado adicionado
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                      Deseja anexar fotos/vídeos de um equipamento específico (ex.:
                      &quot;Equipamento 01&quot;)?
                    </p>
                  </div>
                  <Button
                    type="button"
                    onClick={() => handleAddEquipment('Equipamento 01')}
                    variant="outline"
                    className="text-xs h-9 font-semibold text-teal-800 dark:text-teal-300 border-teal-300 dark:border-teal-700 hover:bg-teal-50"
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    Adicionar Equipamento 01
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {visit.equipments.map((eq, index) => {
                    const padStr = String(index + 1).padStart(2, '0')
                    const eqLabel = eq.name || `Equipamento ${padStr}`
                    return (
                      <Card
                        key={eq.id}
                        className="border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900 overflow-hidden"
                      >
                        <CardHeader className="bg-slate-50/80 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 py-3 px-4">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="h-6 w-6 rounded-full bg-teal-700 text-white text-xs font-bold flex items-center justify-center">
                                {index + 1}
                              </span>
                              <Input
                                value={eq.name || `Equipamento ${padStr}`}
                                onChange={(e) =>
                                  handleUpdateEquipment(eq.id, { name: e.target.value })
                                }
                                placeholder={`Equipamento ${padStr}`}
                                className="h-8 text-xs font-bold w-48 bg-white dark:bg-slate-900"
                              />
                            </div>

                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setEquipmentToDelete(eq.id)}
                              className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950 h-8 px-2 text-xs"
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Remover
                            </Button>
                          </div>
                        </CardHeader>

                        <CardContent className="p-4 space-y-4">
                          {/* Identificação rápida opcional */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                Série
                              </label>
                              <Input
                                value={eq.serialNumber}
                                onChange={(e) =>
                                  handleUpdateEquipment(eq.id, { serialNumber: e.target.value })
                                }
                                placeholder="Ex.: 30105-884"
                                className="h-10 text-xs bg-slate-50/70 dark:bg-slate-950"
                              />
                              {(() => {
                                const disc = eq.nameplateOcrData?.discrepancies?.find(
                                  (d) => d.fieldKey === 'serialNumber',
                                )
                                if (!disc) return null
                                return (
                                  <p className="text-[10px] text-amber-700 dark:text-amber-400 mt-1 font-medium leading-tight">
                                    Placa indica {disc.plateValue} — campo preenchido com{' '}
                                    {disc.currentValue}
                                  </p>
                                )
                              })()}
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                Local Instalado / Linha (Opcional)
                              </label>
                              <Input
                                value={eq.installedLocation}
                                onChange={(e) =>
                                  handleUpdateEquipment(eq.id, {
                                    installedLocation: e.target.value,
                                  })
                                }
                                placeholder="Ex.: Linha 02 - Mezanino"
                                className="h-10 text-xs bg-slate-50/70 dark:bg-slate-950"
                              />
                            </div>
                          </div>

                          {/* SUB-SEÇÃO: DADOS DA PLAQUETA DE IDENTIFICAÇÃO (Plaqueta BERMO) */}
                          <div className="rounded-xl border border-teal-200/80 dark:border-teal-900/60 bg-teal-50/30 dark:bg-teal-950/20 p-3.5 space-y-3">
                            <div className="flex items-center justify-between gap-2 border-b border-teal-200/60 dark:border-teal-900/40 pb-2">
                              <div className="flex items-center gap-2">
                                <span className="h-6 w-6 rounded-md bg-teal-700 text-white flex items-center justify-center text-xs font-bold shadow-2xs">
                                  🏷️
                                </span>
                                <div>
                                  <h4 className="text-xs font-bold text-teal-950 dark:text-teal-200 tracking-tight">
                                    Dados da Plaqueta de Identificação (BERMO)
                                  </h4>
                                  <p className="text-[10.5px] text-teal-800/80 dark:text-teal-400">
                                    Informações gravadas na plaqueta de fábrica (todos opcionais)
                                  </p>
                                </div>
                              </div>
                              <span className="text-[10px] font-medium text-teal-700 dark:text-teal-300 bg-teal-100/80 dark:bg-teal-900/60 px-2 py-0.5 rounded-full">
                                Plaqueta de fábrica
                              </span>
                            </div>

                            {/* Plaqueta - Linha 1: Serviço, Nº Fabricação, Tag */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                              <div>
                                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                  Serviço
                                </label>
                                <Input
                                  value={eq.service || ''}
                                  onChange={(e) =>
                                    handleUpdateEquipment(eq.id, { service: e.target.value })
                                  }
                                  placeholder="Ex.: RESFRIAMENTO"
                                  className="h-9 text-xs bg-white dark:bg-slate-900"
                                />
                                {(() => {
                                  const disc = eq.nameplateOcrData?.discrepancies?.find(
                                    (d) => d.fieldKey === 'service',
                                  )
                                  if (!disc) return null
                                  return (
                                    <p className="text-[10px] text-amber-700 dark:text-amber-400 mt-1 font-medium leading-tight">
                                      Placa indica {disc.plateValue} — campo preenchido com{' '}
                                      {disc.currentValue}
                                    </p>
                                  )
                                })()}
                              </div>

                              <div>
                                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                  Nº de Fabricação
                                </label>
                                <Input
                                  value={eq.manufacturingNumber || ''}
                                  onChange={(e) =>
                                    handleUpdateEquipment(eq.id, {
                                      manufacturingNumber: e.target.value,
                                    })
                                  }
                                  placeholder="Ex.: 639.065"
                                  className="h-9 text-xs bg-white dark:bg-slate-900 font-mono"
                                />
                                {(() => {
                                  const disc = eq.nameplateOcrData?.discrepancies?.find(
                                    (d) => d.fieldKey === 'manufacturingNumber',
                                  )
                                  if (!disc) return null
                                  return (
                                    <p className="text-[10px] text-amber-700 dark:text-amber-400 mt-1 font-medium leading-tight">
                                      Placa indica {disc.plateValue} — campo preenchido com{' '}
                                      {disc.currentValue}
                                    </p>
                                  )
                                })()}
                              </div>

                              <div>
                                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                  Tag do Equipamento
                                </label>
                                <Input
                                  value={eq.tag || ''}
                                  onChange={(e) =>
                                    handleUpdateEquipment(eq.id, { tag: e.target.value })
                                  }
                                  placeholder="Ex.: TC-01 / TQ-101"
                                  className="h-9 text-xs bg-white dark:bg-slate-900"
                                />
                                {(() => {
                                  const disc = eq.nameplateOcrData?.discrepancies?.find(
                                    (d) => d.fieldKey === 'tag',
                                  )
                                  if (!disc) return null
                                  return (
                                    <p className="text-[10px] text-amber-700 dark:text-amber-400 mt-1 font-medium leading-tight">
                                      Placa indica {disc.plateValue} — campo preenchido com{' '}
                                      {disc.currentValue}
                                    </p>
                                  )
                                })()}
                              </div>
                            </div>

                            {/* Plaqueta - Linha 2: Pressões, Temperatura, PMTA */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                              <div>
                                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                  Pressão de Projeto (bar)
                                </label>
                                <Input
                                  value={eq.designPressureBar || ''}
                                  inputMode="decimal"
                                  onChange={(e) =>
                                    handleUpdateEquipment(eq.id, {
                                      designPressureBar: onlyNumericPtBR(e.target.value),
                                    })
                                  }
                                  placeholder="Ex.: 10,00"
                                  className="h-9 text-xs bg-white dark:bg-slate-900"
                                />
                                {(() => {
                                  const disc = eq.nameplateOcrData?.discrepancies?.find(
                                    (d) => d.fieldKey === 'designPressureBar',
                                  )
                                  if (!disc) return null
                                  return (
                                    <p className="text-[10px] text-amber-700 dark:text-amber-400 mt-1 font-medium leading-tight">
                                      Placa indica {disc.plateValue} — campo preenchido com{' '}
                                      {disc.currentValue}
                                    </p>
                                  )
                                })()}
                              </div>

                              <div>
                                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                  Pressão de Teste (bar)
                                </label>
                                <Input
                                  value={eq.testPressureBar || ''}
                                  inputMode="decimal"
                                  onChange={(e) =>
                                    handleUpdateEquipment(eq.id, {
                                      testPressureBar: onlyNumericPtBR(e.target.value),
                                    })
                                  }
                                  placeholder="Ex.: 13,00"
                                  className="h-9 text-xs bg-white dark:bg-slate-900"
                                />
                                {(() => {
                                  const disc = eq.nameplateOcrData?.discrepancies?.find(
                                    (d) => d.fieldKey === 'testPressureBar',
                                  )
                                  if (!disc) return null
                                  return (
                                    <p className="text-[10px] text-amber-700 dark:text-amber-400 mt-1 font-medium leading-tight">
                                      Placa indica {disc.plateValue} — campo preenchido com{' '}
                                      {disc.currentValue}
                                    </p>
                                  )
                                })()}
                              </div>

                              <div>
                                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                  Temp. de Projeto (°C)
                                </label>
                                <Input
                                  value={eq.designTempC || ''}
                                  inputMode="decimal"
                                  onChange={(e) =>
                                    handleUpdateEquipment(eq.id, {
                                      designTempC: onlyNumericPtBR(e.target.value),
                                    })
                                  }
                                  placeholder="Ex.: 165"
                                  className="h-9 text-xs bg-white dark:bg-slate-900"
                                />
                                {(() => {
                                  const disc = eq.nameplateOcrData?.discrepancies?.find(
                                    (d) => d.fieldKey === 'designTempC',
                                  )
                                  if (!disc) return null
                                  return (
                                    <p className="text-[10px] text-amber-700 dark:text-amber-400 mt-1 font-medium leading-tight">
                                      Placa indica {disc.plateValue} — campo preenchido com{' '}
                                      {disc.currentValue}
                                    </p>
                                  )
                                })()}
                              </div>

                              <div>
                                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                  PMTA (MPa)
                                </label>
                                <Input
                                  value={eq.pmtaMpa || ''}
                                  inputMode="decimal"
                                  onChange={(e) =>
                                    handleUpdateEquipment(eq.id, {
                                      pmtaMpa: onlyNumericPtBR(e.target.value),
                                    })
                                  }
                                  placeholder="Ex.: 1,30"
                                  className="h-9 text-xs bg-white dark:bg-slate-900"
                                />
                                {(() => {
                                  const disc = eq.nameplateOcrData?.discrepancies?.find(
                                    (d) => d.fieldKey === 'pmtaMpa',
                                  )
                                  if (!disc) return null
                                  return (
                                    <p className="text-[10px] text-amber-700 dark:text-amber-400 mt-1 font-medium leading-tight">
                                      Placa indica {disc.plateValue} — campo preenchido com{' '}
                                      {disc.currentValue}
                                    </p>
                                  )
                                })()}
                              </div>
                            </div>

                            {/* Plaqueta - Linha 3: Peso, Ano, "a" máx, "a" mín */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                              <div>
                                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                  Peso Vazio (kgf)
                                </label>
                                <Input
                                  value={eq.emptyWeightKg || ''}
                                  inputMode="decimal"
                                  onChange={(e) =>
                                    handleUpdateEquipment(eq.id, {
                                      emptyWeightKg: onlyNumericPtBR(e.target.value),
                                    })
                                  }
                                  placeholder="Ex.: 164,30"
                                  className="h-9 text-xs bg-white dark:bg-slate-900"
                                />
                                {(() => {
                                  const disc = eq.nameplateOcrData?.discrepancies?.find(
                                    (d) => d.fieldKey === 'emptyWeightKg',
                                  )
                                  if (!disc) return null
                                  return (
                                    <p className="text-[10px] text-amber-700 dark:text-amber-400 mt-1 font-medium leading-tight">
                                      Placa indica {disc.plateValue} — campo preenchido com{' '}
                                      {disc.currentValue}
                                    </p>
                                  )
                                })()}
                              </div>

                              <div>
                                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                  Ano de Fabricação
                                </label>
                                <Input
                                  value={eq.manufacturingYear || ''}
                                  inputMode="numeric"
                                  maxLength={4}
                                  onChange={(e) =>
                                    handleUpdateEquipment(eq.id, {
                                      manufacturingYear: e.target.value.replace(/\D/g, ''),
                                    })
                                  }
                                  placeholder="Ex.: 2025"
                                  className="h-9 text-xs bg-white dark:bg-slate-900"
                                />
                                {(() => {
                                  const disc = eq.nameplateOcrData?.discrepancies?.find(
                                    (d) => d.fieldKey === 'manufacturingYear',
                                  )
                                  if (!disc) return null
                                  return (
                                    <p className="text-[10px] text-amber-700 dark:text-amber-400 mt-1 font-medium leading-tight">
                                      Placa indica {disc.plateValue} — campo preenchido com{' '}
                                      {disc.currentValue}
                                    </p>
                                  )
                                })()}
                              </div>

                              <div>
                                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                  &quot;a&quot; Máximo (mm)
                                </label>
                                <Input
                                  value={eq.tighteningMaxA || ''}
                                  inputMode="decimal"
                                  onChange={(e) =>
                                    handleUpdateEquipment(eq.id, {
                                      tighteningMaxA: onlyNumericPtBR(e.target.value),
                                    })
                                  }
                                  placeholder="Ex.: 66"
                                  className="h-9 text-xs bg-white dark:bg-slate-900"
                                />
                                {(() => {
                                  const disc = eq.nameplateOcrData?.discrepancies?.find(
                                    (d) => d.fieldKey === 'tighteningMaxA',
                                  )
                                  if (!disc) return null
                                  return (
                                    <p className="text-[10px] text-amber-700 dark:text-amber-400 mt-1 font-medium leading-tight">
                                      Placa indica {disc.plateValue} — campo preenchido com{' '}
                                      {disc.currentValue}
                                    </p>
                                  )
                                })()}
                              </div>

                              <div>
                                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                  &quot;a&quot; Mínimo (mm)
                                </label>
                                <Input
                                  value={eq.tighteningMinA || ''}
                                  inputMode="decimal"
                                  onChange={(e) =>
                                    handleUpdateEquipment(eq.id, {
                                      tighteningMinA: onlyNumericPtBR(e.target.value),
                                    })
                                  }
                                  placeholder="Ex.: 70"
                                  className="h-9 text-xs bg-white dark:bg-slate-900"
                                />
                                {(() => {
                                  const disc = eq.nameplateOcrData?.discrepancies?.find(
                                    (d) => d.fieldKey === 'tighteningMinA',
                                  )
                                  if (!disc) return null
                                  return (
                                    <p className="text-[10px] text-amber-700 dark:text-amber-400 mt-1 font-medium leading-tight">
                                      Placa indica {disc.plateValue} — campo preenchido com{' '}
                                      {disc.currentValue}
                                    </p>
                                  )
                                })()}
                              </div>
                            </div>
                          </div>

                          {/* Campos Complementares Dinâmicos da Plaqueta (Novos campos sem alterar existentes) */}
                          <EquipmentCustomFieldsSection
                            customFields={eq.customFields || []}
                            onChange={(fields) =>
                              handleUpdateEquipment(eq.id, { customFields: fields })
                            }
                          />

                          {/* Seção própria de anexos com suporte a fotos, vídeos e leitura OCR da plaqueta */}
                          <EquipmentMediaAttachmentSection
                            title={`Anexos de ${eqLabel}`}
                            description="Fotos da placa (leitura automática por IA), detalhes mecânicos ou vídeos deste equipamento"
                            attachments={eq.attachments || []}
                            onAddFiles={(files) => handleAddEquipmentAttachments(eq.id, files)}
                            onRemoveAttachment={(attId) =>
                              handleRemoveEquipmentAttachment(eq.id, attId)
                            }
                            onReadNameplatePhoto={(photo) =>
                              handleTriggerNameplateOcr(eq.id, photo)
                            }
                            isReadingNameplate={isReadingNameplate && readingEquipmentId === eq.id}
                            activeReadingAttachmentId={activeReadingAttachmentId}
                            readingStatusText={nameplateReadingStatus}
                            isCompressing={isCompressingGlobal}
                          />

                          {/* Observações com Voz para este equipamento */}
                          <VoiceDictationField
                            label={`Observações do técnico sobre ${eqLabel}`}
                            sublabel="Digite ou grave sua fala com transcrição automática"
                            value={eq.technicianNotes}
                            onChange={(val) =>
                              handleUpdateEquipment(eq.id, { technicianNotes: val })
                            }
                            onSaveAudioAttachment={(audioFile) => {
                              const newAtt: MediaAttachment = {
                                id: generateId(),
                                type: 'audio',
                                name: audioFile.name,
                                dataUrl: audioFile.dataUrl,
                                size: audioFile.blob.size,
                                createdAt: new Date().toISOString(),
                              }
                              setVisit((prev) => ({
                                ...prev,
                                equipments: prev.equipments.map((item) =>
                                  item.id === eq.id
                                    ? {
                                        ...item,
                                        attachments: [...(item.attachments || []), newAtt],
                                      }
                                    : item,
                                ),
                              }))
                              toast({
                                title: 'Áudio anexado ao equipamento',
                                description: `Gravação salva nos anexos de ${eqLabel}.`,
                              })
                            }}
                            placeholder="Descreva detalhes específicos, medidas, pontos críticos ou necessidades deste equipamento..."
                            rows={3}
                          />
                        </CardContent>
                      </Card>
                    )
                  })}

                  <div className="pt-2">
                    <Button
                      type="button"
                      onClick={() => handleAddEquipment()}
                      variant="outline"
                      className="w-full h-12 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-teal-600 hover:text-teal-700 font-semibold text-xs"
                    >
                      <Plus className="h-4 w-4 mr-1.5" />
                      Adicionar mais um equipamento (
                      {`Equipamento ${String(visit.equipments.length + 1).padStart(2, '0')}`})
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* ========================================================================= */
          /* FLUXO 2: MANUTENÇÃO PREVENTIVA, CORRETIVA E CATÁLOGO DE EQUIPAMENTOS */
          /* (FORMULÁRIO EXISTENTE INTACTO + GRAVAÇÃO DE VOZ NAS OBSERVAÇÕES DO TÉCNICO) */
          /* ========================================================================= */
          <div className="space-y-5 animate-in fade-in duration-300">
            {/* 5. SEÇÃO: OBSERVAÇÕES GERAIS + GRAVAÇÃO DE VOZ */}
            <Card className="border-slate-200 dark:border-slate-800 shadow-xs bg-white dark:bg-slate-900">
              <CardHeader className="pb-3">
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
              </CardHeader>
              <CardContent className="space-y-2">
                <VoiceDictationField
                  label="Relato técnico geral:"
                  value={visit.generalObservations}
                  onChange={(val) =>
                    setVisit((prev) => ({
                      ...prev,
                      generalObservations: val,
                      freeDescription: val,
                    }))
                  }
                  onSaveAudioAttachment={(audioFile) => {
                    const newAtt: MediaAttachment = {
                      id: generateId(),
                      type: 'audio',
                      name: audioFile.name,
                      dataUrl: audioFile.dataUrl,
                      size: audioFile.blob.size,
                      createdAt: new Date().toISOString(),
                    }
                    setVisit((prev) => ({
                      ...prev,
                      visitAttachments: [...(prev.visitAttachments || []), newAtt],
                    }))
                    toast({
                      title: 'Áudio anexado à visita',
                      description: 'Gravação salva como anexo da visita com sucesso.',
                    })
                  }}
                  placeholder="Digite aqui ou use o botão de microfone acima para gravar seu relato técnico..."
                  rows={5}
                />
              </CardContent>
            </Card>

            {/* 6. SEÇÃO: LISTA DE EQUIPAMENTOS INTACTA COM BOTÃO DE VOZ NAS OBSERVAÇÕES */}
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
                    Formulário técnico com parâmetros mecânicos, fluidos, temperaturas e anexos
                  </p>
                </div>

                <Button
                  type="button"
                  onClick={() => handleAddEquipment()}
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
                      Toque no botão abaixo para registrar o primeiro trocador de calor
                      inspecionado.
                    </p>
                  </div>
                  <Button
                    type="button"
                    onClick={() => handleAddEquipment()}
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
                              {formatEquipmentTitle(item, index)}
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
                        {/* Linha 1: Modelo, Série, Fabricante, Tag */}
                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                          <div>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                              Modelo
                            </label>
                            <Input
                              value={item.model}
                              onChange={(e) =>
                                handleUpdateEquipment(item.id, { model: e.target.value })
                              }
                              placeholder="Ex.: BP 60 B"
                              className="h-10 text-xs bg-slate-50/70 dark:bg-slate-950"
                            />
                            {(() => {
                              const disc = item.nameplateOcrData?.discrepancies?.find(
                                (d) => d.fieldKey === 'model',
                              )
                              if (!disc) return null
                              return (
                                <p className="text-[10px] text-amber-700 dark:text-amber-400 mt-1 font-medium leading-tight">
                                  Placa indica {disc.plateValue} — campo preenchido com{' '}
                                  {disc.currentValue}
                                </p>
                              )
                            })()}
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
                            {(() => {
                              const disc = item.nameplateOcrData?.discrepancies?.find(
                                (d) => d.fieldKey === 'serialNumber',
                              )
                              if (!disc) return null
                              return (
                                <p className="text-[10px] text-amber-700 dark:text-amber-400 mt-1 font-medium leading-tight">
                                  Placa indica {disc.plateValue} — campo preenchido com{' '}
                                  {disc.currentValue}
                                </p>
                              )
                            })()}
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                              Fabricante
                            </label>
                            {(() => {
                              const isPreset =
                                !item.manufacturer ||
                                MANUFACTURER_PRESETS.some(
                                  (m) =>
                                    m.toLowerCase() === (item.manufacturer || '').toLowerCase(),
                                )
                              const presetValue = isPreset ? item.manufacturer || '' : 'OUTROS'
                              return (
                                <div className="flex gap-1.5">
                                  <select
                                    value={presetValue}
                                    onChange={(e) => {
                                      const v = e.target.value
                                      if (v === 'OUTROS') {
                                        if (!item.manufacturer) {
                                          handleUpdateEquipment(item.id, { manufacturer: '' })
                                        }
                                      } else {
                                        handleUpdateEquipment(item.id, { manufacturer: v })
                                      }
                                    }}
                                    className="h-10 text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-1.5 text-slate-700 dark:text-slate-300 shrink-0 w-[42%]"
                                    title="Selecione o fabricante"
                                  >
                                    <option value="">—</option>
                                    {MANUFACTURER_PRESETS.map((m) => (
                                      <option key={m} value={m}>
                                        {m}
                                      </option>
                                    ))}
                                    <option value="OUTROS">Outros</option>
                                  </select>
                                  {!isPreset && (
                                    <Input
                                      value={item.manufacturer}
                                      onChange={(e) =>
                                        handleUpdateEquipment(item.id, {
                                          manufacturer: e.target.value,
                                        })
                                      }
                                      placeholder="Digite o fabricante"
                                      className="h-10 text-xs bg-slate-50/70 dark:bg-slate-950"
                                      autoFocus
                                    />
                                  )}
                                </div>
                              )
                            })()}
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                              Tag do Equipamento (Opcional)
                            </label>
                            <Input
                              value={item.tag || ''}
                              onChange={(e) =>
                                handleUpdateEquipment(item.id, { tag: e.target.value })
                              }
                              placeholder="Ex.: TQ-101 / TC-01"
                              className="h-10 text-xs bg-slate-50/70 dark:bg-slate-950"
                            />
                            {(() => {
                              const disc = item.nameplateOcrData?.discrepancies?.find(
                                (d) => d.fieldKey === 'tag',
                              )
                              if (!disc) return null
                              return (
                                <p className="text-[10px] text-amber-700 dark:text-amber-400 mt-1 font-medium leading-tight">
                                  Placa indica {disc.plateValue} — campo preenchido com{' '}
                                  {disc.currentValue}
                                </p>
                              )
                            })()}
                          </div>
                        </div>

                        {/* SUB-SEÇÃO: DADOS DA PLAQUETA DE IDENTIFICAÇÃO (Plaqueta BERMO) */}
                        <div className="rounded-xl border border-teal-200/80 dark:border-teal-900/60 bg-teal-50/30 dark:bg-teal-950/20 p-3.5 space-y-3">
                          <div className="flex items-center justify-between gap-2 border-b border-teal-200/60 dark:border-teal-900/40 pb-2">
                            <div className="flex items-center gap-2">
                              <span className="h-6 w-6 rounded-md bg-teal-700 text-white flex items-center justify-center text-xs font-bold shadow-2xs">
                                🏷️
                              </span>
                              <div>
                                <h4 className="text-xs font-bold text-teal-950 dark:text-teal-200 tracking-tight">
                                  Dados da Plaqueta de Identificação (BERMO)
                                </h4>
                                <p className="text-[10.5px] text-teal-800/80 dark:text-teal-400">
                                  Informações gravadas na plaqueta de fábrica do trocador de calor
                                  (todos opcionais)
                                </p>
                              </div>
                            </div>
                            <span className="text-[10px] font-medium text-teal-700 dark:text-teal-300 bg-teal-100/80 dark:bg-teal-900/60 px-2 py-0.5 rounded-full">
                              Referência de campo
                            </span>
                          </div>

                          {/* Plaqueta - Linha 1: Serviço e Nº de Fabricação */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                Serviço
                              </label>
                              <Input
                                value={item.service || ''}
                                onChange={(e) =>
                                  handleUpdateEquipment(item.id, { service: e.target.value })
                                }
                                placeholder="Ex.: RESFRIAMENTO, AQUECIMENTO, CONDENSAÇÃO"
                                className="h-9 text-xs bg-white dark:bg-slate-900"
                              />
                              {(() => {
                                const disc = item.nameplateOcrData?.discrepancies?.find(
                                  (d) => d.fieldKey === 'service',
                                )
                                if (!disc) return null
                                return (
                                  <p className="text-[10px] text-amber-700 dark:text-amber-400 mt-1 font-medium leading-tight">
                                    Placa indica {disc.plateValue} — campo preenchido com{' '}
                                    {disc.currentValue}
                                  </p>
                                )
                              })()}
                            </div>

                            <div>
                              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                Nº de Fabricação
                              </label>
                              <Input
                                value={item.manufacturingNumber || ''}
                                onChange={(e) =>
                                  handleUpdateEquipment(item.id, {
                                    manufacturingNumber: e.target.value,
                                  })
                                }
                                placeholder="Ex.: 639.065"
                                className="h-9 text-xs bg-white dark:bg-slate-900 font-mono"
                              />
                              {(() => {
                                const disc = item.nameplateOcrData?.discrepancies?.find(
                                  (d) => d.fieldKey === 'manufacturingNumber',
                                )
                                if (!disc) return null
                                return (
                                  <p className="text-[10px] text-amber-700 dark:text-amber-400 mt-1 font-medium leading-tight">
                                    Placa indica {disc.plateValue} — campo preenchido com{' '}
                                    {disc.currentValue}
                                  </p>
                                )
                              })()}
                            </div>
                          </div>

                          {/* Plaqueta - Linha 2: Pressão Projeto, Pressão Teste, Temp Projeto, PMTA */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <div>
                              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                Pressão de Projeto (bar)
                              </label>
                              <Input
                                value={item.designPressureBar || ''}
                                inputMode="decimal"
                                onChange={(e) =>
                                  handleUpdateEquipment(item.id, {
                                    designPressureBar: onlyNumericPtBR(e.target.value),
                                  })
                                }
                                placeholder="Ex.: 10,00"
                                className="h-9 text-xs bg-white dark:bg-slate-900"
                              />
                              {(() => {
                                const disc = item.nameplateOcrData?.discrepancies?.find(
                                  (d) => d.fieldKey === 'designPressureBar',
                                )
                                if (!disc) return null
                                return (
                                  <p className="text-[10px] text-amber-700 dark:text-amber-400 mt-1 font-medium leading-tight">
                                    Placa indica {disc.plateValue} — campo preenchido com{' '}
                                    {disc.currentValue}
                                  </p>
                                )
                              })()}
                            </div>

                            <div>
                              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                Pressão de Teste (bar)
                              </label>
                              <Input
                                value={item.testPressureBar || ''}
                                inputMode="decimal"
                                onChange={(e) =>
                                  handleUpdateEquipment(item.id, {
                                    testPressureBar: onlyNumericPtBR(e.target.value),
                                  })
                                }
                                placeholder="Ex.: 13,00"
                                className="h-9 text-xs bg-white dark:bg-slate-900"
                              />
                              {(() => {
                                const disc = item.nameplateOcrData?.discrepancies?.find(
                                  (d) => d.fieldKey === 'testPressureBar',
                                )
                                if (!disc) return null
                                return (
                                  <p className="text-[10px] text-amber-700 dark:text-amber-400 mt-1 font-medium leading-tight">
                                    Placa indica {disc.plateValue} — campo preenchido com{' '}
                                    {disc.currentValue}
                                  </p>
                                )
                              })()}
                            </div>

                            <div>
                              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                Temp. de Projeto (°C)
                              </label>
                              <Input
                                value={item.designTempC || ''}
                                inputMode="decimal"
                                onChange={(e) =>
                                  handleUpdateEquipment(item.id, {
                                    designTempC: onlyNumericPtBR(e.target.value),
                                  })
                                }
                                placeholder="Ex.: 165"
                                className="h-9 text-xs bg-white dark:bg-slate-900"
                              />
                              {(() => {
                                const disc = item.nameplateOcrData?.discrepancies?.find(
                                  (d) => d.fieldKey === 'designTempC',
                                )
                                if (!disc) return null
                                return (
                                  <p className="text-[10px] text-amber-700 dark:text-amber-400 mt-1 font-medium leading-tight">
                                    Placa indica {disc.plateValue} — campo preenchido com{' '}
                                    {disc.currentValue}
                                  </p>
                                )
                              })()}
                            </div>

                            <div>
                              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                PMTA (MPa)
                              </label>
                              <Input
                                value={item.pmtaMpa || ''}
                                inputMode="decimal"
                                onChange={(e) =>
                                  handleUpdateEquipment(item.id, {
                                    pmtaMpa: onlyNumericPtBR(e.target.value),
                                  })
                                }
                                placeholder="Ex.: 1,30"
                                className="h-9 text-xs bg-white dark:bg-slate-900"
                              />
                              {(() => {
                                const disc = item.nameplateOcrData?.discrepancies?.find(
                                  (d) => d.fieldKey === 'pmtaMpa',
                                )
                                if (!disc) return null
                                return (
                                  <p className="text-[10px] text-amber-700 dark:text-amber-400 mt-1 font-medium leading-tight">
                                    Placa indica {disc.plateValue} — campo preenchido com{' '}
                                    {disc.currentValue}
                                  </p>
                                )
                              })()}
                            </div>
                          </div>

                          {/* Plaqueta - Linha 3: Peso Vazio, Ano Fabr., "a" Máx, "a" Mín */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <div>
                              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                Peso Vazio (kgf)
                              </label>
                              <Input
                                value={item.emptyWeightKg || ''}
                                inputMode="decimal"
                                onChange={(e) =>
                                  handleUpdateEquipment(item.id, {
                                    emptyWeightKg: onlyNumericPtBR(e.target.value),
                                  })
                                }
                                placeholder="Ex.: 164,30"
                                className="h-9 text-xs bg-white dark:bg-slate-900"
                              />
                              {(() => {
                                const disc = item.nameplateOcrData?.discrepancies?.find(
                                  (d) => d.fieldKey === 'emptyWeightKg',
                                )
                                if (!disc) return null
                                return (
                                  <p className="text-[10px] text-amber-700 dark:text-amber-400 mt-1 font-medium leading-tight">
                                    Placa indica {disc.plateValue} — campo preenchido com{' '}
                                    {disc.currentValue}
                                  </p>
                                )
                              })()}
                            </div>

                            <div>
                              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                Ano de Fabricação
                              </label>
                              <Input
                                value={item.manufacturingYear || ''}
                                inputMode="numeric"
                                maxLength={4}
                                onChange={(e) =>
                                  handleUpdateEquipment(item.id, {
                                    manufacturingYear: e.target.value.replace(/\D/g, ''),
                                  })
                                }
                                placeholder="Ex.: 2025"
                                className="h-9 text-xs bg-white dark:bg-slate-900"
                              />
                              {(() => {
                                const disc = item.nameplateOcrData?.discrepancies?.find(
                                  (d) => d.fieldKey === 'manufacturingYear',
                                )
                                if (!disc) return null
                                return (
                                  <p className="text-[10px] text-amber-700 dark:text-amber-400 mt-1 font-medium leading-tight">
                                    Placa indica {disc.plateValue} — campo preenchido com{' '}
                                    {disc.currentValue}
                                  </p>
                                )
                              })()}
                            </div>

                            <div>
                              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                &quot;a&quot; Máximo (mm)
                              </label>
                              <Input
                                value={item.tighteningMaxA || ''}
                                inputMode="decimal"
                                onChange={(e) =>
                                  handleUpdateEquipment(item.id, {
                                    tighteningMaxA: onlyNumericPtBR(e.target.value),
                                  })
                                }
                                placeholder="Ex.: 66"
                                className="h-9 text-xs bg-white dark:bg-slate-900"
                              />
                              {(() => {
                                const disc = item.nameplateOcrData?.discrepancies?.find(
                                  (d) => d.fieldKey === 'tighteningMaxA',
                                )
                                if (!disc) return null
                                return (
                                  <p className="text-[10px] text-amber-700 dark:text-amber-400 mt-1 font-medium leading-tight">
                                    Placa indica {disc.plateValue} — campo preenchido com{' '}
                                    {disc.currentValue}
                                  </p>
                                )
                              })()}
                            </div>

                            <div>
                              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                &quot;a&quot; Mínimo (mm)
                              </label>
                              <Input
                                value={item.tighteningMinA || ''}
                                inputMode="decimal"
                                onChange={(e) =>
                                  handleUpdateEquipment(item.id, {
                                    tighteningMinA: onlyNumericPtBR(e.target.value),
                                  })
                                }
                                placeholder="Ex.: 70"
                                className="h-9 text-xs bg-white dark:bg-slate-900"
                              />
                              {(() => {
                                const disc = item.nameplateOcrData?.discrepancies?.find(
                                  (d) => d.fieldKey === 'tighteningMinA',
                                )
                                if (!disc) return null
                                return (
                                  <p className="text-[10px] text-amber-700 dark:text-amber-400 mt-1 font-medium leading-tight">
                                    Placa indica {disc.plateValue} — campo preenchido com{' '}
                                    {disc.currentValue}
                                  </p>
                                )
                              })()}
                            </div>
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
                                handleUpdateEquipment(item.id, {
                                  installedLocation: e.target.value,
                                })
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
                            <div className="flex gap-1.5">
                              <Input
                                value={item.flowRate}
                                inputMode="decimal"
                                onChange={(e) =>
                                  handleUpdateEquipment(item.id, {
                                    flowRate: onlyNumericPtBR(e.target.value),
                                  })
                                }
                                placeholder="Ex.: 45,5"
                                className="h-10 text-xs bg-slate-50/70 dark:bg-slate-950"
                              />
                              <select
                                value={item.flowUnit || 'm³/h'}
                                onChange={(e) =>
                                  handleUpdateEquipment(item.id, { flowUnit: e.target.value })
                                }
                                className="h-10 text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-1.5 text-slate-700 dark:text-slate-300"
                                title="Unidade da vazão"
                              >
                                {FLOW_UNIT_OPTIONS.map((u) => (
                                  <option key={u} value={u}>
                                    {u}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        </div>

                        {/* Linha 4: Temperaturas */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                              Temperatura de entrada (°C)
                            </label>
                            <Input
                              value={item.inletTemp}
                              inputMode="decimal"
                              onChange={(e) =>
                                handleUpdateEquipment(item.id, {
                                  inletTemp: onlyNumericPtBR(e.target.value),
                                })
                              }
                              placeholder="Ex.: 92,5"
                              className="h-10 text-xs bg-slate-50/70 dark:bg-slate-950"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                              Temperatura de saída (°C)
                            </label>
                            <Input
                              value={item.outletTemp}
                              inputMode="decimal"
                              onChange={(e) =>
                                handleUpdateEquipment(item.id, {
                                  outletTemp: onlyNumericPtBR(e.target.value),
                                })
                              }
                              placeholder="Ex.: 45,0"
                              className="h-10 text-xs bg-slate-50/70 dark:bg-slate-950"
                            />
                          </div>
                        </div>

                        {/* Grau de dificuldade (Apenas condições físicas do local de instalação) */}
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                              Grau de dificuldade do local de instalação
                            </label>
                            <span className="text-[10px] text-muted-foreground">
                              Acesso, altura, espaço confinado
                            </span>
                          </div>
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

                        {/* Campos Complementares Dinâmicos da Plaqueta (Novos campos sem alterar existentes) */}
                        <EquipmentCustomFieldsSection
                          customFields={item.customFields || []}
                          onChange={(fields) =>
                            handleUpdateEquipment(item.id, { customFields: fields })
                          }
                        />

                        {/* ANEXOS DO EQUIPAMENTO (Múltiplas Fotos ou Vídeos com Leitura OCR de Plaqueta) */}
                        <EquipmentMediaAttachmentSection
                          title="Anexos deste equipamento (Fotos / Vídeos)"
                          description="Foto da placa (leitura automática por IA), vazamentos ou vídeo de operação"
                          attachments={
                            item.attachments && item.attachments.length > 0
                              ? item.attachments
                              : item.photoDataUrl
                                ? [
                                    {
                                      id: 'legacy_photo',
                                      name: 'Foto da Placa',
                                      type: 'image',
                                      dataUrl: item.photoDataUrl,
                                    },
                                  ]
                                : []
                          }
                          onAddFiles={(files) => handleAddEquipmentAttachments(item.id, files)}
                          onRemoveAttachment={(attId) =>
                            handleRemoveEquipmentAttachment(item.id, attId)
                          }
                          onReadNameplatePhoto={(photo) =>
                            handleTriggerNameplateOcr(item.id, photo)
                          }
                          isReadingNameplate={isReadingNameplate && readingEquipmentId === item.id}
                          activeReadingAttachmentId={activeReadingAttachmentId}
                          readingStatusText={nameplateReadingStatus}
                          isCompressing={isCompressingGlobal}
                        />

                        {/* OBSERVAÇÕES DO TÉCNICO COM GRAVAÇÃO DE VOZ E TRANSCRIÇÃO AUTOMÁTICA */}
                        <VoiceDictationField
                          label="Observações do técnico sobre o estado do equipamento:"
                          sublabel="Grave por voz ou digite. O texto permanece 100% editável após falar."
                          value={item.technicianNotes}
                          onChange={(val) =>
                            handleUpdateEquipment(item.id, { technicianNotes: val })
                          }
                          onSaveAudioAttachment={(audioFile) => {
                            const newAtt: MediaAttachment = {
                              id: generateId(),
                              type: 'audio',
                              name: audioFile.name,
                              dataUrl: audioFile.dataUrl,
                              size: audioFile.blob.size,
                              createdAt: new Date().toISOString(),
                            }
                            setVisit((prev) => ({
                              ...prev,
                              equipments: prev.equipments.map((eq) =>
                                eq.id === item.id
                                  ? {
                                      ...eq,
                                      attachments: [...(eq.attachments || []), newAtt],
                                    }
                                  : eq,
                              ),
                            }))
                            toast({
                              title: 'Áudio anexado ao equipamento',
                              description: 'Gravação salva como anexo do equipamento.',
                            })
                          }}
                          placeholder="Vazamento nas gaxetas, placas incrustadas, corrosão no tirante, necessidade de banho químico..."
                          rows={3}
                        />
                      </CardContent>
                    </Card>
                  ))}

                  <div className="pt-2">
                    <Button
                      type="button"
                      onClick={() => handleAddEquipment()}
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
          </div>
        )}

        {/* 7. SEÇÃO: PLANO DE AÇÃO GERADO PELA IA */}
        {visit.actionPlan && visit.actionPlan.length > 0 && (
          <Card className="border-violet-300 dark:border-violet-800 bg-white dark:bg-slate-900 shadow-sm">
            <CardHeader className="bg-violet-50/70 dark:bg-violet-950/40 border-b border-violet-200 dark:border-violet-800 py-3.5 px-4">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-violet-600" />
                  <CardTitle className="text-sm font-bold text-violet-950 dark:text-violet-200">
                    Plano de Ação para Orçamento ({visit.actionPlan.length}{' '}
                    {visit.actionPlan.length === 1 ? 'item' : 'itens'})
                  </CardTitle>
                </div>
                <Badge className="bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-200 text-[10px] font-semibold border-violet-300">
                  Gerado por Análise da IA
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <p className="text-xs text-muted-foreground">
                Plano técnico estruturado a partir dos dados coletados na visita para subsidiar o
                orçamento e o relatório ao cliente.
              </p>
              <div className="space-y-3">
                {visit.actionPlan.map((action, aIdx) => (
                  <div
                    key={action.id || aIdx}
                    className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50 space-y-2.5 text-xs"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="h-5 w-5 rounded-full bg-violet-600 text-white text-[11px] font-bold flex items-center justify-center shrink-0">
                          {aIdx + 1}
                        </span>
                        <strong className="text-slate-900 dark:text-slate-100 text-xs sm:text-sm">
                          {action.title}
                        </strong>
                      </div>
                      <Badge
                        variant="outline"
                        className={`text-[9.5px] font-semibold ${
                          action.priority === 'Alta'
                            ? 'text-rose-700 border-rose-300 bg-rose-50'
                            : action.priority === 'Média'
                              ? 'text-amber-700 border-amber-300 bg-amber-50'
                              : 'text-emerald-700 border-emerald-300 bg-emerald-50'
                        }`}
                      >
                        Prioridade {action.priority}
                      </Badge>
                    </div>

                    {/* 1. Diagnóstico */}
                    <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
                      <span className="text-[10.5px] font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide block">
                        1. Diagnóstico (baseado exclusivamente no registro da visita):
                      </span>
                      <p className="text-slate-700 dark:text-slate-300 text-[11px] leading-relaxed">
                        {action.diagnosis || action.description}
                      </p>
                    </div>

                    {/* 2. Ações recomendadas */}
                    <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
                      <span className="text-[10.5px] font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide block">
                        2. Ações Recomendadas:
                      </span>
                      <p className="text-slate-700 dark:text-slate-300 text-[11px] leading-relaxed">
                        {action.suggestedAction || action.description}
                      </p>
                      {action.technicalReference && (
                        <div className="pt-1 text-[11px] text-teal-800 dark:text-teal-300 flex items-start gap-1 font-medium">
                          <strong className="shrink-0">Referência técnica:</strong>
                          <span>{action.technicalReference}</span>
                        </div>
                      )}
                    </div>

                    {/* 3. Condições do local de instalação */}
                    <div className="p-2.5 rounded-lg bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 space-y-1">
                      <span className="text-[10.5px] font-bold text-amber-900 dark:text-amber-300 uppercase tracking-wide block">
                        3. Condições do Local de Instalação (Grau de Dificuldade Físico):
                      </span>
                      <p className="text-amber-800 dark:text-amber-200 text-[11px] leading-relaxed">
                        {action.installationConditions ||
                          'Condições do local não detalhadas na visita'}
                      </p>
                    </div>

                    {/* 4. Itens pendentes de levantamento */}
                    {action.pendingItems && action.pendingItems.length > 0 && (
                      <div className="p-2.5 rounded-lg bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 space-y-1">
                        <span className="text-[10.5px] font-bold text-rose-900 dark:text-rose-300 uppercase tracking-wide block">
                          4. Itens Pendentes de Levantamento:
                        </span>
                        <ul className="list-disc list-inside text-rose-800 dark:text-rose-200 text-[11px] space-y-0.5 leading-relaxed">
                          {action.pendingItems.map((item, pIdx) => (
                            <li key={pIdx}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Bloco de Envio Grande no Rodapé */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border-2 border-teal-600/30 dark:border-teal-700/40 shadow-sm space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Send className="h-4 w-4 text-teal-700 dark:text-teal-400" />
                Finalizar Atendimento & Sincronizar com o CRM
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Gera o registro oficial da visita, envia o plano de ação e dados levantados ao CRM e
                gera o PDF completo.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={() => setIsPdfDialogOpen(true)}
                className="h-11 px-4 text-xs font-bold border-teal-300 dark:border-teal-700 text-teal-800 dark:text-teal-300 hover:bg-teal-50"
              >
                <Printer className="h-4 w-4 mr-1.5 text-teal-600" />
                Gerar Resumo em PDF
              </Button>

              <Button
                type="button"
                size="lg"
                onClick={handleSendToCrm}
                disabled={isSendingToCrm}
                className={`h-11 px-6 text-xs font-bold shadow-sm ${
                  visit.crmStatus === 'enviada'
                    ? 'bg-emerald-700 hover:bg-emerald-600 text-white'
                    : 'bg-teal-700 hover:bg-teal-600 text-white'
                }`}
              >
                {isSendingToCrm ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Enviando ao CRM...
                  </>
                ) : visit.crmStatus === 'enviada' ? (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Reenviar ao CRM
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Enviar a Visita ao CRM
                  </>
                )}
              </Button>
            </div>
          </div>

          {visit.lastSentAt && (
            <div className="text-[11px] text-muted-foreground pt-1 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span>Rascunho local vinculado ao CRM.</span>
              <span className="font-medium text-emerald-700 dark:text-emerald-400">
                Sincronizado em {new Date(visit.lastSentAt).toLocaleString('pt-BR')}
              </span>
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
            continuarão salvas aqui mesmo após enviar ao CRM.
          </p>
        </div>

        {/* Diagnóstico visível temporário para validação em campo */}
        <div className="pt-2">
          <VoiceDiagnosticFooter />
        </div>
      </main>

      {/* Modal de Prévia e Impressão do PDF da Visita */}
      <FieldVisitPdfDialog open={isPdfDialogOpen} onOpenChange={setIsPdfDialogOpen} visit={visit} />

      {/* Modal de Revisão Leve da Leitura da Plaqueta (Confirmação Não-Bloqueante) */}
      <NameplateOcrReviewDialog
        open={ocrReviewOpen}
        onOpenChange={setOcrReviewOpen}
        comparisonResult={ocrComparisonResult}
        onApply={handleApplyNameplateOcr}
        onDiscard={handleDiscardNameplateOcr}
        equipmentName={
          targetOcrEquipment
            ? formatEquipmentTitle(
                targetOcrEquipment,
                visit.equipments.findIndex((e) => e.id === targetOcrEquipment.id),
              )
            : undefined
        }
      />

      {/* Modal de confirmação da Análise IA */}
      <AlertDialog open={aiConfirmOpen} onOpenChange={setAiConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Aplicar plano de ação da IA?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="max-h-64 overflow-y-auto space-y-2 text-sm">
                <p className="text-amber-700 dark:text-amber-400 font-semibold">
                  Revise antes de salvar — você poderá editar depois.
                </p>
                {(aiDraft || []).map((it, idx) => (
                  <div
                    key={idx}
                    className="border rounded p-2.5 bg-slate-50 dark:bg-slate-900 space-y-1.5 text-xs"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold text-xs text-slate-900 dark:text-slate-100">
                        {idx + 1}. {it.title}
                      </p>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-violet-100 dark:bg-violet-950 text-violet-700 dark:text-violet-300">
                        {it.priority}
                      </span>
                    </div>

                    {it.diagnosis && (
                      <div className="p-1.5 rounded bg-white dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800">
                        <strong className="text-[11px] text-slate-700 dark:text-slate-300 block">
                          1. Diagnóstico:
                        </strong>
                        <p className="text-[11px] text-slate-600 dark:text-slate-400">
                          {it.diagnosis}
                        </p>
                      </div>
                    )}

                    <div className="p-1.5 rounded bg-white dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 space-y-1">
                      <strong className="text-[11px] text-slate-700 dark:text-slate-300 block">
                        2. Ações recomendadas:
                      </strong>
                      <p className="text-[11px] text-slate-700 dark:text-slate-300">
                        {it.suggestedAction || it.description}
                      </p>
                      {it.technicalReference && (
                        <p className="text-[10.5px] text-teal-700 dark:text-teal-400 font-medium">
                          <strong>Referência do fabricante:</strong> {it.technicalReference}
                        </p>
                      )}
                    </div>

                    <div className="p-1.5 rounded bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50">
                      <strong className="text-[11px] text-amber-900 dark:text-amber-300 block">
                        3. Condições do local de instalação:
                      </strong>
                      <p className="text-[11px] text-amber-800 dark:text-amber-400">
                        {it.installationConditions || 'Condições do local não detalhadas na visita'}
                      </p>
                    </div>

                    {Array.isArray(it.pendingItems) && it.pendingItems.length > 0 && (
                      <div className="p-1.5 rounded bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50">
                        <strong className="text-[11px] text-rose-900 dark:text-rose-300 block">
                          4. Itens pendentes de levantamento:
                        </strong>
                        <ul className="list-disc list-inside text-[10.5px] text-rose-800 dark:text-rose-400 space-y-0.5">
                          {it.pendingItems.map((p: string, pIdx: number) => (
                            <li key={pIdx}>{p}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {it.equipment_id && (
                      <p className="text-[10px] text-teal-700 dark:text-teal-400 pt-0.5">
                        📷 Fotos do equipamento serão vinculadas no relatório
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setAiConfirmOpen(false)}>Descartar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleAiConfirm}
              className="bg-violet-600 hover:bg-violet-700 text-white font-semibold"
            >
              Aplicar plano
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
              Os dados e os anexos deste equipamento serão excluídos do formulário desta visita.
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
