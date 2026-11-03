import { useState, useEffect, useRef } from 'react'
import { useSearchParams, useLocation } from 'react-router-dom'
import { toast } from '@/hooks/use-toast'
import { fieldVisitsService } from '@/services/field-visits'
import { pendingQueue, type QueueRetryResult } from '@/services/field-visit-queue'
import { getStoredToken, getStoredDeviceId } from '@/services/field-visit-token'
import {
  cacheMediaBlob,
  retryAllCachedMedia,
  applyMediaResults,
  countPendingMedia,
  hydrateVisitMedia,
  deleteServerMedia,
  sanitizeVisitForStorage,
} from '@/services/field-visit-media'
import {
  type FieldVisitData,
  type EquipmentItem,
  type MediaAttachment,
  STORAGE_KEY_CURRENT_VISIT,
  STORAGE_KEY_EMPLOYEE_NAME,
  createEmptyEquipment,
  createInitialVisitData,
  calculateDurationBetween,
  recordToFieldVisitData,
  compressImageFile,
  generateId,
} from '@/types/field-visit'

/** Status da mídia no topo do formulário (barra fina, sem mudar o layout). */
export interface MediaStatusBar {
  uploading: number
  pending: number
}

export function useFieldVisitState({
  sellerMode = false,
  sellerName = '',
  initialVisitData = null,
}: {
  sellerMode?: boolean
  sellerName?: string
  initialVisitData?: FieldVisitData | null
}) {
  const [searchParams] = useSearchParams()
  const location = useLocation()
  const queryVisitId = searchParams.get('id')
  // Gatilho da leitura de plaqueta injetado pela página (evita dependência circular entre hooks)
  const photoTriggerRef = useRef<(equipmentId: string, photo: MediaAttachment) => void>(() => {})
  // Rastreia campos que foram editados manualmente pelo técnico para remover o indicador de OCR
  const [manuallyEditedFields, setManuallyEditedFields] = useState<
    Record<string, Record<string, boolean>>
  >({})

  const markFieldAsManuallyEdited = (equipmentId: string, fieldKey: string) => {
    setManuallyEditedFields((prev) => ({
      ...prev,
      [equipmentId]: {
        ...(prev[equipmentId] || {}),
        [fieldKey]: true,
      },
    }))
  }

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
          localStorage.setItem(
            STORAGE_KEY_CURRENT_VISIT,
            JSON.stringify(sanitizeVisitForStorage(data)),
          )
          if (data.employeeName) {
            localStorage.setItem(STORAGE_KEY_EMPLOYEE_NAME, data.employeeName)
          }
        } catch (e) {
          console.warn('Erro ao sincronizar visita carregada no localStorage:', e)
        }
        // Base64 legado do registro vira cópia local + pendente (sobe ao servidor)
        hydrateVisitMedia(data).then((h) => {
          if (isMounted && h !== data) setVisit(h)
        })
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

  // ---- Mídia no servidor (fotos/vídeos) ----
  // O rascunho guarda só a referência; a cópia local fica no IndexedDB até o
  // servidor confirmar. Barra de status + avisos na tela (nunca falha em silêncio).
  const [mediaStatus, setMediaStatus] = useState<MediaStatusBar>({ uploading: 0, pending: 0 })
  const [mediaNotice, setMediaNotice] = useState<string | null>(null)
  const [uploadingCount, setUploadingCount] = useState(0)
  const autoRetryRef = useRef(false)
  const hydratedForRef = useRef('')

  useEffect(() => {
    const pending = countPendingMedia(visit)
    setMediaStatus({
      uploading: uploadingCount,
      pending: Math.max(0, pending - uploadingCount),
    })
  }, [visit, uploadingCount])

  const sellerAuth = () => ({
    sellerToken: getStoredToken() || undefined,
    deviceId: getStoredDeviceId(),
  })

  // Sobe ao servidor toda cópia local em cache e aplica as referências no estado
  const runMediaRetry = async (announce = true): Promise<void> => {
    if (autoRetryRef.current) return
    autoRetryRef.current = true
    try {
      const r = await retryAllCachedMedia(sellerAuth())
      if (r.results.length > 0) {
        setVisit((prev) => applyMediaResults(prev, r.results))
      }
      const fails = r.results.filter((x) => !x.ok)
      if (fails.length > 0) {
        if (announce)
          setMediaNotice(
            `${fails.length} ${fails.length === 1 ? 'arquivo não foi enviado' : 'arquivos não foram enviados'} — serão reenviados automaticamente quando a internet voltar.`,
          )
      } else if (r.sent > 0) {
        setMediaNotice(null)
      }
    } catch (_) {
      if (announce)
        setMediaNotice('Não foi possível enviar os arquivos agora — toque na barra para reenviar.')
    } finally {
      autoRetryRef.current = false
    }
  }

  // Reenvio manual (tocar na barra "Não enviado")
  const retryMediaNow = async () => {
    setMediaNotice(null)
    await runMediaRetry()
  }

  // Hidratação do rascunho carregado: base64 legado vira cópia local + pendente;
  // pendentes recuperam o preview do IndexedDB (uma única vez por visita).
  useEffect(() => {
    const key = (visit as any).clientVisitId || visit.id || ''
    if (!key || hydratedForRef.current === key) return
    hydratedForRef.current = key
    hydrateVisitMedia(visit).then((h) => {
      if (h !== visit) setVisit(h)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Reenvio automático ao abrir a página e quando a conexão volta (mídia + fila)
  useEffect(() => {
    runMediaRetry()
    const onOnline = async () => {
      try {
        await runMediaRetry()
        if (pendingQueue.count() > 0) {
          const r: QueueRetryResult = await pendingQueue.retryAll()
          if (r.sent > 0) {
            toast({
              title: 'Visitas pendentes enviadas!',
              description: `${r.sent} visita(s) sincronizada(s) com o CRM.`,
            })
          }
          if (r.failed > 0) {
            setMediaNotice(
              `Visita pendente: não foi possível enviar agora (${r.errors[0]?.error || 'sem conexão'}). Toque em "Enviar CRM" para tentar de novo.`,
            )
          }
        }
      } catch (_) {
        // nova tentativa no próximo evento online
      }
    }
    window.addEventListener('online', onOnline)
    return () => window.removeEventListener('online', onOnline)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Prepara o anexo: vídeo usa objectURL (leve); imagem mantém o dataUrl comprimido
  // em memória (preview e leitura de plaqueta funcionam como antes). O rascunho
  // gravado no celular guarda só a referência — o autosave sanitiza antes de gravar.
  const buildPendingAttachment = async (
    file: File,
    clientVisitId: string,
  ): Promise<MediaAttachment> => {
    const isVideo = file.type.startsWith('video/')
    if (isVideo) {
      if (file.size > 25 * 1024 * 1024) {
        throw new Error('Vídeo muito grande. Limite máximo recomendado de 25MB por vídeo.')
      }
      const att: MediaAttachment = {
        id: generateId(),
        name: file.name,
        type: 'video',
        dataUrl: URL.createObjectURL(file),
        size: file.size,
        uploadStatus: 'pendente',
      }
      await cacheMediaBlob(att.id, file, {
        name: att.name,
        kind: 'video',
        size: file.size,
        clientVisitId,
      })
      return att
    }

    let dataUrl = ''
    try {
      dataUrl = await compressImageFile(file, 1000, 0.7)
    } catch (_) {
      dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = () => reject(new Error('Erro ao ler imagem'))
        reader.readAsDataURL(file)
      })
    }
    const blob = await (await fetch(dataUrl)).blob()
    const att: MediaAttachment = {
      id: generateId(),
      name: file.name,
      type: 'image',
      dataUrl,
      size: blob.size,
      uploadStatus: 'pendente',
    }
    await cacheMediaBlob(att.id, blob, {
      name: att.name,
      kind: 'image',
      size: blob.size,
      clientVisitId,
    })
    return att
  }

  // Mensagens e feedbacks
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving'>('saved')
  const [quotaWarning, setQuotaWarning] = useState<string | null>(null)
  const [isPdfDialogOpen, setIsPdfDialogOpen] = useState(false)
  const [isCompressingGlobal, setIsCompressingGlobal] = useState(false)

  // Modais de confirmação
  const [isNewVisitDialogOpen, setIsNewVisitDialogOpen] = useState(false)
  const [equipmentToDelete, setEquipmentToDelete] = useState<string | null>(null)
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

  // Handlers para anexos gerais da visita (fluxo enxuto) — upload imediato ao servidor
  const handleAddVisitAttachments = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    setIsCompressingGlobal(true)
    try {
      const clientVisitId = String((visit as any).clientVisitId || visit.id || '')
      const newAttachments: MediaAttachment[] = []
      for (let i = 0; i < files.length; i++) {
        newAttachments.push(await buildPendingAttachment(files[i], clientVisitId))
      }
      setVisit((prev) => ({
        ...prev,
        visitAttachments: [...(prev.visitAttachments || []), ...newAttachments],
      }))
      toast({
        title: 'Anexos adicionados',
        description: `${newAttachments.length} ${newAttachments.length === 1 ? 'arquivo anexado' : 'arquivos anexados'} — enviando ao CRM...`,
      })
      // Upload em segundo plano; falha cai na barra de status com reenvio automático
      setUploadingCount((n) => n + newAttachments.length)
      runMediaRetry()
        .catch(() => {})
        .finally(() => setUploadingCount((n) => Math.max(0, n - newAttachments.length)))
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
    // Remove do servidor e da cópia local (sem bloquear o usuário)
    deleteServerMedia(attachmentId, sellerAuth())
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
    const eq = visit.equipments.find((e) => e.id === equipmentToDelete)
    if (eq) {
      for (const a of eq.attachments || []) deleteServerMedia(a.id, sellerAuth())
    }
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
      const clientVisitId = String((visit as any).clientVisitId || visit.id || '')
      const newAttachments: MediaAttachment[] = []
      for (let i = 0; i < files.length; i++) {
        newAttachments.push(await buildPendingAttachment(files[i], clientVisitId))
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
            photoDataUrl:
              updated.find((a) => a.type === 'image' && a.dataUrl)?.dataUrl || eq.photoDataUrl,
          }
        }),
      }))

      toast({
        title: 'Anexo adicionado ao equipamento',
        description: `${newAttachments.length} ${newAttachments.length === 1 ? 'arquivo salvo' : 'arquivos salvos'} — enviando ao CRM...`,
      })

      // Upload em segundo plano; falha cai na barra de status com reenvio automático
      setUploadingCount((n) => n + newAttachments.length)
      runMediaRetry()
        .catch(() => {})
        .finally(() => setUploadingCount((n) => Math.max(0, n - newAttachments.length)))

      // Se houver fotos entre os arquivos anexados, dispara a leitura da 1ª imagem automaticamente
      const firstPhoto = newAttachments.find((a) => a.type === 'image' || !a.type)
      if (firstPhoto) {
        photoTriggerRef.current(equipmentId, firstPhoto)
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

  const handleRemoveEquipmentAttachment = (equipmentId: string, attachmentId: string) => {
    setVisit((prev) => ({
      ...prev,
      equipments: prev.equipments.map((eq) => {
        if (eq.id !== equipmentId) return eq
        const updated = (eq.attachments || []).filter((a) => a.id !== attachmentId)
        return {
          ...eq,
          attachments: updated,
          photoDataUrl: updated.find((a) => a.type === 'image' && a.dataUrl)?.dataUrl,
        }
      }),
    }))
    deleteServerMedia(attachmentId, sellerAuth())
  }

  const handleConfirmNewVisit = () => {
    const employeeToKeep =
      visit.employeeName || localStorage.getItem(STORAGE_KEY_EMPLOYEE_NAME) || ''
    const fresh = createInitialVisitData(employeeToKeep)
    setVisit(fresh)
    localStorage.removeItem(STORAGE_KEY_CURRENT_VISIT)
    setIsNewVisitDialogOpen(false)
    setQuotaWarning(null)
    setMediaNotice(null)
  }
  return {
    visit,
    setVisit,
    queryVisitId,
    manuallyEditedFields,
    markFieldAsManuallyEdited,
    isLoadingRecord,
    saveStatus,
    setSaveStatus,
    quotaWarning,
    setQuotaWarning,
    isPdfDialogOpen,
    setIsPdfDialogOpen,
    isCompressingGlobal,
    isNewVisitDialogOpen,
    setIsNewVisitDialogOpen,
    equipmentToDelete,
    setEquipmentToDelete,
    handleEmployeeChange,
    handleStartTimeChange,
    handleEndTimeChange,
    handleDurationChange,
    handleRecalculateDuration,
    handleAddVisitAttachments,
    handleRemoveVisitAttachment,
    handleAddEquipment,
    handleUpdateEquipment,
    handleConfirmDeleteEquipment,
    handleAddEquipmentAttachments,
    handleRemoveEquipmentAttachment,
    handleConfirmNewVisit,
    photoTriggerRef,
    // Mídia no servidor
    mediaStatus,
    mediaNotice,
    setMediaNotice,
    retryMediaNow,
  }
}
