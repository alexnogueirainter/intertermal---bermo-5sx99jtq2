// src/components/field-visit/SteamTrapInspectionSection.tsx
// Módulo Inspeção de Purgadores (VKP) — card na Visita a Campo, abaixo do item 4.
// 4 passos: Contexto · Achados · Inspeção (registros VKP) · Resumo + PDF.
// Fotos/vídeos dos registros reutilizam a rota de mídia da visita (field_visit_media),
// ficando vinculados ao registro que os gerou — saem correlacionados no PDF.
// Tudo persiste em steam_trap_inspections (coleção própria); nada toca nos dados existentes.

import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Gauge,
  Plus,
  FileDown,
  Loader2,
  ChevronDown,
  ChevronUp,
  Trash2,
  CheckCircle2,
  Camera,
  Paperclip,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from '@/hooks/use-toast'
import type { FieldVisitData, SteamTrapInspectionData, SteamTrapRecord } from '@/types/field-visit'
import {
  STEAM_TRAP_MANUFACTURERS,
  STEAM_TRAP_MODELS,
  STEAM_TRAP_RESULTS,
  STEAM_TRAP_ACTION_BY_RESULT,
  STEAM_TRAP_DN_OPTIONS,
  STEAM_TRAP_CLASS_OPTIONS,
  STEAM_TRAP_CONNECTION_OPTIONS,
  STEAM_TRAP_TEST_EQUIPMENT,
  STEAM_TRAP_SEVERITIES,
  createEmptySteamTrap,
  isSteamTrapProblem,
  steamTrapEconomics,
} from '@/types/field-visit'
import {
  getOrCreateInspection,
  listVisitMediaForReport,
  saveInspection,
} from '@/services/steam-traps'
import { getStoredToken, getStoredDeviceId } from '@/services/field-visit-token'
import { buildTrapReportHtml, generateTrapPdfBlob } from '@/components/field-visit/steam-trap-pdf'
import pb from '@/lib/pocketbase/client'

const br = (v: number, d = 2) =>
  (Number.isFinite(v) ? v : 0).toLocaleString('pt-BR', {
    minimumFractionDigits: d,
    maximumFractionDigits: d,
  })

function genId() {
  return `st-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export function SteamTrapInspectionSection({
  visit,
  sellerMode,
}: {
  visit: FieldVisitData
  sellerMode: boolean
}) {
  const clientVisitId = String((visit as any).clientVisitId || visit.id || '')
  // Nasce aberto: o card só renderiza quando o técnico seleciona "Inspeção de Purgadores" no item 4
  const [open, setOpen] = useState(true)
  const [step, setStep] = useState(1)
  const [data, setData] = useState<SteamTrapInspectionData | null>(null)
  const [recId, setRecId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [genPdf, setGenPdf] = useState(false)
  const [newArea, setNewArea] = useState('')
  const [showNewArea, setShowNewArea] = useState(false)
  const [newFab, setNewFab] = useState('')
  const [showNewFab, setShowNewFab] = useState(false)
  const [fabSel, setFabSel] = useState('')
  const [modelSel, setModelSel] = useState('')
  const [dnSel, setDnSel] = useState('')
  const [classSel, setClassSel] = useState('')
  const [connSel, setConnSel] = useState('')
  const [actionSel, setActionSel] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [draft, setDraft] = useState<SteamTrapRecord | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const cameraRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const cameraStreamRef = useRef<MediaStream | null>(null)
  const [mediaFor, setMediaFor] = useState<string | null>(null)
  const [cameraOpen, setCameraOpen] = useState(false)
  const [cameraReady, setCameraReady] = useState(false)
  const [cameraCapturing, setCameraCapturing] = useState(false)
  const [cameraError, setCameraError] = useState('')
  const loadedForRef = useRef('')

  // No notebook, abre uma prévia real da webcam; no celular, mantém a câmera nativa.
  useEffect(() => {
    if (!cameraOpen) return
    let cancelled = false
    let activeStream: MediaStream | null = null
    setCameraReady(false)
    setCameraError('')

    const startCamera = async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Este navegador não disponibiliza acesso à webcam.')
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'user' },
          width: { ideal: 1280 },
          height: { ideal: 960 },
        },
        audio: false,
      })
      if (cancelled) {
        stream.getTracks().forEach((track) => track.stop())
        return
      }
      activeStream = stream
      cameraStreamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play().catch(() => {})
      }
      setCameraReady(true)
    }

    startCamera().catch((error: any) => {
      if (!cancelled) {
        setCameraError(
          error?.name === 'NotAllowedError'
            ? 'Permita o acesso à câmera para este site nas configurações do navegador e tente novamente.'
            : error?.name === 'NotFoundError'
              ? 'Nenhuma webcam foi encontrada. Use “Anexar” para escolher uma imagem.'
              : error?.message || 'Não foi possível abrir a webcam. Use “Anexar” como alternativa.',
        )
      }
    })

    return () => {
      cancelled = true
      activeStream?.getTracks().forEach((track) => track.stop())
      if (cameraStreamRef.current === activeStream) cameraStreamRef.current = null
    }
  }, [cameraOpen])

  // ---- carregamento (uma vez por visita) ----
  useEffect(() => {
    if (!clientVisitId || loadedForRef.current === clientVisitId) return
    loadedForRef.current = clientVisitId
    setLoading(true)
    getOrCreateInspection(clientVisitId, sellerMode ? getStoredToken() : undefined)
      .then((rec) => {
        setRecId(rec.id)
        setData(rec.data)
      })
      .catch(() => {
        toast({
          title: 'Aviso',
          description: 'Inspeção de purgadores indisponível agora (sem conexão).',
          variant: 'destructive',
        })
      })
      .finally(() => setLoading(false))
  }, [clientVisitId, sellerMode])

  // ---- autosave (debounce) ----
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const queueSave = (next: SteamTrapInspectionData) => {
    setData(next)
    if (!recId) return
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      setSaving(true)
      saveInspection(recId, next)
        .catch(() => {})
        .finally(() => setSaving(false))
    }, 900)
  }

  const econ = useMemo(
    () =>
      data
        ? steamTrapEconomics(data.traps, data.context.steamCostBrlTon, data.context.hoursPerYear)
        : { lossKgh: 0, perMonth: null, perYear: null },
    [data],
  )
  const badCount = useMemo(
    () => (data ? data.traps.filter((t) => isSteamTrapProblem(t.result)).length : 0),
    [data],
  )

  // ---- mídia: fotos/vídeos do registro via rota da visita ----
  const handleTrapMedia = async (trapId: string, files: FileList | File[] | null) => {
    if (!files || !files.length || !data) return
    const added: string[] = []
    for (const f of Array.from(files)) {
      const mediaId = genId()
      const fd = new FormData()
      fd.set('client_media_id', mediaId)
      fd.set('kind', f.type.startsWith('video/') ? 'video' : 'image')
      fd.set('original_name', f.name)
      fd.set('size', String(f.size))
      fd.set('client_visit_id', clientVisitId)
      const token = getStoredToken()
      const deviceId = getStoredDeviceId()
      if (token) fd.set('token', token)
      if (deviceId) fd.set('device_id', deviceId)
      fd.append('file', f, f.name)
      try {
        const res = (await pb.send('/backend/v1/field-visits/media/upload', {
          method: 'POST',
          body: fd,
        })) as any
        if (res?.ok && res.path) {
          added.push(mediaId)
        } else {
          toast({
            title: 'Falha ao anexar mídia',
            description: 'Tente novamente.',
            variant: 'destructive',
          })
        }
      } catch {
        toast({
          title: 'Falha ao anexar mídia',
          description: 'Sem conexão.',
          variant: 'destructive',
        })
      }
    }
    if (added.length && data) {
      const inList = data.traps.some((t) => t.id === trapId)
      if (inList) {
        queueSave({
          ...data,
          traps: data.traps.map((t) =>
            t.id === trapId ? { ...t, mediaIds: [...(t.mediaIds || []), ...added] } : t,
          ),
        })
      } else if (draft && draft.id === trapId) {
        // Registro ainda não salvo (modal aberto): a mídia fica no rascunho
        // e entra no registro quando o técnico confirmar ("Salvar registro")
        setDraft({ ...draft, mediaIds: [...(draft.mediaIds || []), ...added] })
      }
      toast({ title: 'Mídia vinculada ao registro', description: `${added.length} arquivo(s).` })
    }
  }

  const handleCaptureWebcamPhoto = async () => {
    const video = videoRef.current
    if (!draft || !video || !video.videoWidth || !video.videoHeight) {
      toast({
        title: 'Webcam ainda não está pronta',
        description: 'Aguarde a imagem aparecer e tente novamente.',
        variant: 'destructive',
      })
      return
    }
    setCameraCapturing(true)
    try {
      const canvas = document.createElement('canvas')
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const context = canvas.getContext('2d')
      if (!context) throw new Error('Não foi possível preparar a imagem da webcam.')
      context.drawImage(video, 0, 0, canvas.width, canvas.height)
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (result) => (result ? resolve(result) : reject(new Error('Falha ao capturar a foto.'))),
          'image/jpeg',
          0.88,
        )
      })
      const photo = new File([blob], `purgador-${draft.seq}-${Date.now()}.jpg`, {
        type: 'image/jpeg',
      })
      await handleTrapMedia(draft.id, [photo])
      setCameraOpen(false)
    } catch (error: any) {
      toast({
        title: 'Não foi possível tirar a foto',
        description: error?.message || 'Tente novamente ou use “Anexar”.',
        variant: 'destructive',
      })
    } finally {
      setCameraCapturing(false)
    }
  }

  const handleOpenCamera = () => {
    if (!draft) return
    setMediaFor(draft.id)
    const isMobileCamera =
      typeof window !== 'undefined' &&
      (window.matchMedia('(pointer: coarse)').matches ||
        /Android|iPhone|iPad|iPod/i.test(navigator.userAgent))
    if (isMobileCamera && cameraRef.current) {
      cameraRef.current.setAttribute('capture', 'environment')
      cameraRef.current.click()
      return
    }
    setCameraOpen(true)
  }

  // ---- PDF ----
  const handlePdf = async () => {
    if (!data) return
    setGenPdf(true)
    try {
      const media = await listVisitMediaForReport(clientVisitId, data)
      const mediaIndex = new Map(media.map((item) => [item.clientMediaId, item]))
      const blob = await generateTrapPdfBlob(
        buildTrapReportHtml({
          visit,
          data,
          econ,
          badCount,
          mediaIndex,
        }),
      )
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `inspecao-purgadores-${(visit.companyName || 'cliente').replace(/\s+/g, '_')}.pdf`
      a.click()
      URL.revokeObjectURL(url)
      toast({
        title: 'Relatório gerado',
        description: 'PDF baixado com o formato do relatório de inspeção.',
      })
    } catch (e: any) {
      toast({
        title: 'Erro no PDF',
        description: e?.message || 'Falha ao gerar o relatório.',
        variant: 'destructive',
      })
    } finally {
      setGenPdf(false)
    }
  }

  // ---- helpers de edição ----
  const addFinding = () => {
    if (!data) return
    queueSave({
      ...data,
      findings: [
        ...data.findings,
        {
          id: genId(),
          title: '',
          location: '',
          severity: 'Alta',
          description: '',
          recommendation: '',
          mediaIds: [],
        },
      ],
    })
  }
  const addTrap = () => {
    if (!data) return
    const t = createEmptySteamTrap(data.traps.length + 1)
    t.area = data.context.areas[0] || ''
    setDraft(t)
    setFabSel('')
    setModelSel('')
    setDnSel('')
    setClassSel('')
    setConnSel('')
    setActionSel('')
    setModalOpen(true)
  }
  const commitTrap = () => {
    if (!data || !draft) return
    const exists = data.traps.some((t) => t.id === draft.id)
    queueSave({
      ...data,
      traps: exists
        ? data.traps.map((t) => (t.id === draft.id ? draft : t))
        : [...data.traps, draft],
    })
    setModalOpen(false)
    setDraft(null)
  }
  const addArea = () => {
    if (!data || !newArea.trim()) return
    queueSave({
      ...data,
      context: { ...data.context, areas: [...data.context.areas, newArea.trim()] },
    })
    setNewArea('')
    setShowNewArea(false)
  }

  const RES_CLS: Record<string, string> = {
    'Purgador ok': 'bg-emerald-100 text-emerald-800',
    Vazando: 'bg-red-100 text-red-700',
    'Vazando direto': 'bg-red-200 text-red-900 font-bold',
    Represando: 'bg-orange-100 text-orange-700',
    Parado: 'bg-slate-200 text-slate-600',
    'Não Avaliado': 'bg-slate-100 text-slate-500',
  }

  return (
    <Card className="border-slate-200 dark:border-slate-800 shadow-xs bg-white dark:bg-slate-900">
      <CardHeader className="py-3.5 cursor-pointer select-none" onClick={() => setOpen((o) => !o)}>
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300 flex items-center justify-center">
              <Gauge className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-sm font-bold">4b. Inspeção de Purgadores (VKP)</CardTitle>
              <p className="text-[11px] text-muted-foreground">
                Cadastro dos purgadores testados, achados e relatório em PDF compatível com o padrão
                Bermo
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {data && data.traps.length > 0 && (
              <Badge
                variant="outline"
                className="text-[10px] border-sky-300 text-sky-700 bg-sky-50"
              >
                {data.traps.length} registro{data.traps.length === 1 ? '' : 's'}
              </Badge>
            )}
            {open ? (
              <ChevronUp className="h-4 w-4 text-slate-400" />
            ) : (
              <ChevronDown className="h-4 w-4 text-slate-400" />
            )}
          </div>
        </div>
      </CardHeader>

      {open && (
        <CardContent className="space-y-4">
          {loading && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Carregando inspeção…
            </div>
          )}
          {!loading && data && (
            <>
              {/* Passos */}
              <div className="flex gap-1.5 flex-wrap">
                {['Contexto', 'Achados', 'Inspeção VKP', 'Resumo'].map((s, i) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStep(i + 1)}
                    className={`text-[11px] font-semibold px-3 py-1.5 rounded-lg border ${
                      step === i + 1
                        ? 'bg-sky-600 text-white border-sky-600'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {i + 1}. {s}
                  </button>
                ))}
              </div>

              {/* PASSO 1 — CONTEXTO */}
              {step === 1 && (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold mb-1.5">Unidade / planta</label>
                      <Input
                        value={data.context.unit}
                        onChange={(e) =>
                          queueSave({ ...data, context: { ...data.context, unit: e.target.value } })
                        }
                        placeholder="Ex.: Lins — SP"
                        className="h-10 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1.5">Data da inspeção</label>
                      <Input
                        type="date"
                        value={data.context.inspectionDate}
                        onChange={(e) =>
                          queueSave({
                            ...data,
                            context: { ...data.context, inspectionDate: e.target.value },
                          })
                        }
                        className="h-10 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1.5">
                        Responsável técnico
                      </label>
                      <Input
                        value={data.context.responsible}
                        onChange={(e) =>
                          queueSave({
                            ...data,
                            context: { ...data.context, responsible: e.target.value },
                          })
                        }
                        placeholder="Ex.: Pedro Ferraz — Bermo"
                        className="h-10 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1.5">
                        Acompanhante (cliente)
                      </label>
                      <Input
                        value={data.context.companion}
                        onChange={(e) =>
                          queueSave({
                            ...data,
                            context: { ...data.context, companion: e.target.value },
                          })
                        }
                        className="h-10 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1.5">
                        Equipamento de teste
                      </label>
                      <select
                        value={data.context.testEquipment}
                        onChange={(e) =>
                          queueSave({
                            ...data,
                            context: { ...data.context, testEquipment: e.target.value },
                          })
                        }
                        className="h-10 w-full rounded-md border border-input bg-slate-50/70 dark:bg-slate-950 px-3 text-sm"
                      >
                        {STEAM_TRAP_TEST_EQUIPMENT.map((t) => (
                          <option key={t}>{t}</option>
                        ))}
                        <option value="Outro">Outro…</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1.5">
                        Custo do vapor (R$/t)
                      </label>
                      <Input
                        type="number"
                        step="0.01"
                        value={data.context.steamCostBrlTon ?? ''}
                        onChange={(e) =>
                          queueSave({
                            ...data,
                            context: {
                              ...data.context,
                              steamCostBrlTon:
                                e.target.value === '' ? null : Number(e.target.value),
                            },
                          })
                        }
                        placeholder="Ex.: 110,00"
                        className="h-10 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1.5">
                        Horas de operação (h/ano)
                      </label>
                      <Input
                        type="number"
                        value={data.context.hoursPerYear}
                        onChange={(e) =>
                          queueSave({
                            ...data,
                            context: { ...data.context, hoursPerYear: Number(e.target.value) || 0 },
                          })
                        }
                        className="h-10 text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1.5">
                      Áreas inspecionadas
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {data.context.areas.map((a) => (
                        <span
                          key={a}
                          className="text-[11px] px-2.5 py-1 rounded-full bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 text-sky-800 dark:text-sky-200"
                        >
                          {a}
                        </span>
                      ))}
                      <button
                        type="button"
                        onClick={() => setShowNewArea((v) => !v)}
                        className="text-[11px] px-2.5 py-1 rounded-full border border-dashed border-slate-300 text-slate-500"
                      >
                        ＋ Nova área
                      </button>
                    </div>
                    {showNewArea && (
                      <div className="flex gap-2 mt-2">
                        <Input
                          value={newArea}
                          onChange={(e) => setNewArea(e.target.value)}
                          placeholder="Nome da nova área"
                          className="h-9 text-sm"
                        />
                        <Button type="button" size="sm" onClick={addArea}>
                          Adicionar
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* PASSO 2 — ACHADOS */}
              {step === 2 && (
                <div className="space-y-3">
                  {data.findings.map((f, i) => (
                    <div
                      key={f.id}
                      className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50 space-y-2"
                    >
                      <div className="flex items-center gap-2">
                        <span className="h-5 w-5 rounded-full bg-sky-600 text-white text-[11px] font-bold flex items-center justify-center shrink-0">
                          {i + 1}
                        </span>
                        <Input
                          value={f.title}
                          onChange={(e) =>
                            queueSave({
                              ...data,
                              findings: data.findings.map((x) =>
                                x.id === f.id ? { ...x, title: e.target.value } : x,
                              ),
                            })
                          }
                          placeholder="Título do achado"
                          className="h-9 text-sm font-semibold"
                        />
                        <select
                          value={f.severity}
                          onChange={(e) =>
                            queueSave({
                              ...data,
                              findings: data.findings.map((x) =>
                                x.id === f.id ? { ...x, severity: e.target.value as any } : x,
                              ),
                            })
                          }
                          className="h-9 rounded-md border border-input bg-white dark:bg-slate-900 px-2 text-xs"
                        >
                          {STEAM_TRAP_SEVERITIES.map((s) => (
                            <option key={s}>{s}</option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() =>
                            queueSave({
                              ...data,
                              findings: data.findings.filter((x) => x.id !== f.id),
                            })
                          }
                          className="text-slate-400 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      <Input
                        value={f.location}
                        onChange={(e) =>
                          queueSave({
                            ...data,
                            findings: data.findings.map((x) =>
                              x.id === f.id ? { ...x, location: e.target.value } : x,
                            ),
                          })
                        }
                        placeholder="Local (ex.: Conserva · cozinhadores)"
                        className="h-9 text-xs"
                      />
                      <textarea
                        value={f.description}
                        onChange={(e) =>
                          queueSave({
                            ...data,
                            findings: data.findings.map((x) =>
                              x.id === f.id ? { ...x, description: e.target.value } : x,
                            ),
                          })
                        }
                        placeholder="Descrição do problema identificado"
                        rows={2}
                        className="w-full rounded-md border border-input bg-white dark:bg-slate-900 p-2 text-xs"
                      />
                      <Input
                        value={f.recommendation}
                        onChange={(e) =>
                          queueSave({
                            ...data,
                            findings: data.findings.map((x) =>
                              x.id === f.id ? { ...x, recommendation: e.target.value } : x,
                            ),
                          })
                        }
                        placeholder="Recomendação"
                        className="h-9 text-xs"
                      />
                    </div>
                  ))}
                  <Button type="button" variant="outline" size="sm" onClick={addFinding}>
                    <Plus className="h-3.5 w-3.5" /> Novo achado
                  </Button>
                </div>
              )}

              {/* PASSO 3 — INSPEÇÃO VKP */}
              {step === 3 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="text-xs text-muted-foreground">
                      {data.traps.length} registros · perda total{' '}
                      <b className="text-sky-700">{br(econ.lossKgh)} kg/h</b>
                    </div>
                    <Button type="button" size="sm" onClick={addTrap}>
                      <Plus className="h-3.5 w-3.5" /> Adicionar purgador
                    </Button>
                  </div>
                  <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                    <table className="w-full text-[11px]">
                      <thead>
                        <tr className="bg-slate-100 dark:bg-slate-950 text-left">
                          <th className="px-2 py-2">#</th>
                          <th className="px-2 py-2">Local</th>
                          <th className="px-2 py-2">Área</th>
                          <th className="px-2 py-2">Fabricante</th>
                          <th className="px-2 py-2">Modelo</th>
                          <th className="px-2 py-2">DN</th>
                          <th className="px-2 py-2">Resultado</th>
                          <th className="px-2 py-2">kg/h</th>
                          <th className="px-2 py-2">📷</th>
                          <th className="px-2 py-2"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.traps.map((t) => (
                          <tr
                            key={t.id}
                            className="border-t border-slate-100 dark:border-slate-800"
                          >
                            <td className="px-2 py-1.5 font-bold">{t.seq}</td>
                            <td className="px-2 py-1.5">{t.location || '—'}</td>
                            <td className="px-2 py-1.5">{t.area || '—'}</td>
                            <td className="px-2 py-1.5">{t.manufacturer}</td>
                            <td className="px-2 py-1.5">{t.model}</td>
                            <td className="px-2 py-1.5">{t.dn}</td>
                            <td className="px-2 py-1.5">
                              <span
                                className={`px-1.5 py-0.5 rounded text-[10px] ${RES_CLS[t.result]}`}
                              >
                                {t.result}
                              </span>
                            </td>
                            <td className="px-2 py-1.5">{t.lossKgh ? br(t.lossKgh) : '—'}</td>
                            <td className="px-2 py-1.5">
                              {(t.mediaIds || []).length > 0 ? '📷' : ''}
                            </td>
                            <td className="px-2 py-1.5 whitespace-nowrap">
                              <button
                                type="button"
                                onClick={() => {
                                  setDraft({ ...t })
                                  setFabSel(t.manufacturer)
                                  setModelSel(t.model)
                                  setDnSel(t.dn)
                                  setClassSel(t.pressureClass)
                                  setConnSel(t.connection)
                                  setActionSel(t.action)
                                  setModalOpen(true)
                                }}
                                className="text-sky-700 hover:underline mr-2"
                              >
                                editar
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  queueSave({
                                    ...data,
                                    traps: data.traps.filter((x) => x.id !== t.id),
                                  })
                                }
                                className="text-slate-400 hover:text-red-600"
                              >
                                <Trash2 className="h-3.5 w-3.5 inline" />
                              </button>
                            </td>
                          </tr>
                        ))}
                        {data.traps.length === 0 && (
                          <tr>
                            <td
                              colSpan={10}
                              className="px-2 py-4 text-center text-muted-foreground"
                            >
                              Nenhum purgador registrado ainda.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*,video/*"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      if (mediaFor) handleTrapMedia(mediaFor, e.target.files)
                      if (fileRef.current) fileRef.current.value = ''
                    }}
                  />
                  <input
                    ref={cameraRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={(e) => {
                      if (mediaFor) handleTrapMedia(mediaFor, e.target.files)
                      if (cameraRef.current) cameraRef.current.value = ''
                    }}
                  />
                </div>
              )}

              {/* PASSO 4 — RESUMO */}
              {step === 4 && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                      <div className="text-lg font-extrabold">{data.traps.length}</div>
                      <div className="text-[10px] uppercase text-muted-foreground">Analisados</div>
                    </div>
                    <div className="p-3 rounded-xl border border-red-200 bg-red-50/50 dark:border-red-900">
                      <div className="text-lg font-extrabold text-red-700">
                        {badCount} (
                        {data.traps.length ? Math.round((badCount / data.traps.length) * 100) : 0}%)
                      </div>
                      <div className="text-[10px] uppercase text-muted-foreground">
                        Com problema
                      </div>
                    </div>
                    <div className="p-3 rounded-xl border border-orange-200 bg-orange-50/50 dark:border-orange-900">
                      <div className="text-lg font-extrabold text-orange-700">
                        {br(econ.lossKgh)} kg/h
                      </div>
                      <div className="text-[10px] uppercase text-muted-foreground">
                        Perda de vapor
                      </div>
                    </div>
                    <div className="p-3 rounded-xl border border-orange-200 bg-orange-50/50 dark:border-orange-900">
                      <div className="text-lg font-extrabold text-orange-700">
                        {econ.perYear != null ? `R$ ${br(econ.perYear, 0)}` : '—'}
                      </div>
                      <div className="text-[10px] uppercase text-muted-foreground">Perda / ano</div>
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-orange-50/70 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-900 text-[11px] text-orange-900 dark:text-orange-200">
                    <b>Fórmula:</b> Σ perdas {br(econ.lossKgh)} kg/h × {data.context.hoursPerYear}{' '}
                    h/ano × R$ {br(data.context.steamCostBrlTon || 0)}/t ÷ 1.000 ={' '}
                    <b>
                      {econ.perYear != null
                        ? `R$ ${br(econ.perYear)}/ano`
                        : 'informe o custo do vapor'}
                    </b>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1.5">Conclusão</label>
                    <textarea
                      value={data.conclusion}
                      onChange={(e) => queueSave({ ...data, conclusion: e.target.value })}
                      rows={3}
                      placeholder="Fechamento do relatório — editável"
                      className="w-full rounded-md border border-input bg-white dark:bg-slate-900 p-2 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1.5">
                      Pontos de melhoria (Analisado / Corrigido)
                    </label>
                    <div className="space-y-1.5">
                      {data.improvements.map((m) => (
                        <div
                          key={m.id}
                          className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 dark:border-slate-800 text-xs"
                        >
                          <span className="flex-1">{m.title}</span>
                          <label className="flex items-center gap-1 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={m.analyzed}
                              onChange={(e) =>
                                queueSave({
                                  ...data,
                                  improvements: data.improvements.map((x) =>
                                    x.id === m.id ? { ...x, analyzed: e.target.checked } : x,
                                  ),
                                })
                              }
                            />
                            Analisado
                          </label>
                          <label className="flex items-center gap-1 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={m.fixed}
                              onChange={(e) =>
                                queueSave({
                                  ...data,
                                  improvements: data.improvements.map((x) =>
                                    x.id === m.id ? { ...x, fixed: e.target.checked } : x,
                                  ),
                                })
                              }
                            />
                            Corrigido
                          </label>
                          <button
                            type="button"
                            onClick={() =>
                              queueSave({
                                ...data,
                                improvements: data.improvements.filter((x) => x.id !== m.id),
                              })
                            }
                            className="text-slate-400 hover:text-red-600"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          queueSave({
                            ...data,
                            improvements: [
                              ...data.improvements,
                              { id: genId(), title: '', analyzed: true, fixed: false },
                            ],
                          })
                        }
                      >
                        <Plus className="h-3.5 w-3.5" /> Novo ponto
                      </Button>
                    </div>
                  </div>
                  <Button
                    type="button"
                    onClick={handlePdf}
                    disabled={genPdf}
                    className="bg-orange-600 hover:bg-orange-700"
                  >
                    {genPdf ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <FileDown className="h-4 w-4" />
                    )}
                    Gerar relatório (PDF)
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      )}

      {/* MODAL do registro VKP */}
      {modalOpen && draft && data && (
        <div
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setModalOpen(false)
          }}
        >
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold">Registro de purgador #{draft.seq}</h3>
              <button type="button" onClick={() => setModalOpen(false)} className="text-slate-400">
                ✕
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="block text-xs font-semibold mb-1">Local / equipamento</label>
                <Input
                  value={draft.location}
                  onChange={(e) => setDraft({ ...draft, location: e.target.value })}
                  placeholder="Ex.: Cozinhador I"
                  className="h-10 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Área instalada</label>
                <select
                  value={draft.area}
                  onChange={(e) => setDraft({ ...draft, area: e.target.value })}
                  className="h-10 w-full rounded-md border border-input bg-slate-50/70 dark:bg-slate-950 px-3 text-sm"
                >
                  <option value="">Selecione…</option>
                  {data.context.areas.map((a) => (
                    <option key={a}>{a}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Fabricante</label>
                <select
                  value={fabSel}
                  onChange={(e) => {
                    const v = e.target.value
                    setFabSel(v)
                    if (v === '__new') {
                      setShowNewFab(true)
                    } else {
                      setShowNewFab(false)
                      setModelSel('')
                      setDraft({ ...draft, manufacturer: v, model: '' })
                    }
                  }}
                  className="h-10 w-full rounded-md border border-input bg-slate-50/70 dark:bg-slate-950 px-3 text-sm"
                >
                  <option value="">Selecione…</option>
                  {STEAM_TRAP_MANUFACTURERS.map((m) => (
                    <option key={m}>{m}</option>
                  ))}
                  {(data.context.customManufacturers || []).map((m) => (
                    <option key={m}>{m}</option>
                  ))}
                  <option value="__new">＋ Novo fabricante…</option>
                </select>
                {showNewFab && (
                  <div className="flex gap-2 mt-2">
                    <Input
                      value={newFab}
                      onChange={(e) => setNewFab(e.target.value)}
                      placeholder="Nome do fabricante"
                      className="h-9 text-sm"
                    />
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => {
                        if (!newFab.trim()) return
                        const ctx: any = data.context
                        queueSave({
                          ...data,
                          context: {
                            ...data.context,
                            customManufacturers: [
                              ...(ctx.customManufacturers || []),
                              newFab.trim(),
                            ],
                          },
                        })
                        setFabSel(newFab.trim())
                        setDraft({ ...draft, manufacturer: newFab.trim(), model: '' })
                        setNewFab('')
                        setShowNewFab(false)
                      }}
                    >
                      OK
                    </Button>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Modelo</label>
                <select
                  value={modelSel}
                  onChange={(e) => {
                    const v = e.target.value
                    setModelSel(v)
                    if (v !== '__other') setDraft({ ...draft, model: v })
                  }}
                  className="h-10 w-full rounded-md border border-input bg-slate-50/70 dark:bg-slate-950 px-3 text-sm"
                >
                  <option value="">Selecione…</option>
                  {(STEAM_TRAP_MODELS[fabSel] || []).map((m) => (
                    <option key={m}>{m}</option>
                  ))}
                  {draft.model && !(STEAM_TRAP_MODELS[fabSel] || []).includes(draft.model) && (
                    <option key={draft.model}>{draft.model}</option>
                  )}
                  <option value="__other">Outro…</option>
                </select>
                {modelSel === '__other' && (
                  <Input
                    value={draft.model}
                    onChange={(e) => setDraft({ ...draft, model: e.target.value })}
                    placeholder="Digite o modelo"
                    className="h-9 text-sm mt-2"
                    autoFocus
                  />
                )}
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">DN (mm)</label>
                <select
                  value={dnSel}
                  onChange={(e) => {
                    const v = e.target.value
                    setDnSel(v)
                    if (v !== '__other') setDraft({ ...draft, dn: v })
                  }}
                  className="h-10 w-full rounded-md border border-input bg-slate-50/70 dark:bg-slate-950 px-3 text-sm"
                >
                  {STEAM_TRAP_DN_OPTIONS.map((d) => (
                    <option key={d}>{d}</option>
                  ))}
                  {draft.dn && !STEAM_TRAP_DN_OPTIONS.includes(draft.dn) && (
                    <option key={draft.dn}>{draft.dn}</option>
                  )}
                  <option value="__other">Outro…</option>
                </select>
                {dnSel === '__other' && (
                  <Input
                    value={draft.dn}
                    onChange={(e) => setDraft({ ...draft, dn: e.target.value })}
                    placeholder="Digite o DN"
                    className="h-9 text-sm mt-2"
                    autoFocus
                  />
                )}
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Classe de pressão</label>
                <select
                  value={classSel}
                  onChange={(e) => {
                    const v = e.target.value
                    setClassSel(v)
                    if (v !== '__other') setDraft({ ...draft, pressureClass: v })
                  }}
                  className="h-10 w-full rounded-md border border-input bg-slate-50/70 dark:bg-slate-950 px-3 text-sm"
                >
                  {STEAM_TRAP_CLASS_OPTIONS.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                  {draft.pressureClass &&
                    !STEAM_TRAP_CLASS_OPTIONS.includes(draft.pressureClass) && (
                      <option key={draft.pressureClass}>{draft.pressureClass}</option>
                    )}
                  <option value="__other">Outra…</option>
                </select>
                {classSel === '__other' && (
                  <Input
                    value={draft.pressureClass}
                    onChange={(e) => setDraft({ ...draft, pressureClass: e.target.value })}
                    className="h-9 text-sm mt-2"
                    autoFocus
                  />
                )}
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Conexão</label>
                <select
                  value={connSel}
                  onChange={(e) => {
                    const v = e.target.value
                    setConnSel(v)
                    if (v !== '__other') setDraft({ ...draft, connection: v })
                  }}
                  className="h-10 w-full rounded-md border border-input bg-slate-50/70 dark:bg-slate-950 px-3 text-sm"
                >
                  {STEAM_TRAP_CONNECTION_OPTIONS.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                  {draft.connection &&
                    !STEAM_TRAP_CONNECTION_OPTIONS.includes(draft.connection) && (
                      <option key={draft.connection}>{draft.connection}</option>
                    )}
                  <option value="__other">Outra…</option>
                </select>
                {connSel === '__other' && (
                  <Input
                    value={draft.connection}
                    onChange={(e) => setDraft({ ...draft, connection: e.target.value })}
                    className="h-9 text-sm mt-2"
                    autoFocus
                  />
                )}
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Pressão (barg)</label>
                <Input
                  type="number"
                  step="0.1"
                  value={draft.pressureBarg}
                  onChange={(e) => setDraft({ ...draft, pressureBarg: e.target.value })}
                  className="h-10 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Resultado (VKP)</label>
                <select
                  value={draft.result}
                  onChange={(e) => {
                    const r = e.target.value as SteamTrapRecord['result']
                    setDraft({
                      ...draft,
                      result: r,
                      action: STEAM_TRAP_ACTION_BY_RESULT[r] || draft.action,
                    })
                  }}
                  className="h-10 w-full rounded-md border border-input bg-slate-50/70 dark:bg-slate-950 px-3 text-sm"
                >
                  {STEAM_TRAP_RESULTS.map((r) => (
                    <option key={r}>{r}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Ação recomendada</label>
                <select
                  value={actionSel}
                  onChange={(e) => {
                    const v = e.target.value
                    setActionSel(v)
                    if (v !== '__other') setDraft({ ...draft, action: v })
                  }}
                  className="h-10 w-full rounded-md border border-input bg-slate-50/70 dark:bg-slate-950 px-3 text-sm"
                >
                  {[
                    'Sem ação',
                    'Substituição',
                    'Nova Inspeção',
                    'Analisar Instalação',
                    'Verificar Instalação',
                    'Agendar inspeção',
                  ].map((a) => (
                    <option key={a}>{a}</option>
                  ))}
                  {draft.action &&
                    ![
                      'Sem ação',
                      'Substituição',
                      'Nova Inspeção',
                      'Analisar Instalação',
                      'Verificar Instalação',
                      'Agendar inspeção',
                    ].includes(draft.action) && <option key={draft.action}>{draft.action}</option>}
                  <option value="__other">Outra…</option>
                </select>
                {actionSel === '__other' && (
                  <Input
                    value={draft.action}
                    onChange={(e) => setDraft({ ...draft, action: e.target.value })}
                    className="h-9 text-sm mt-2"
                    autoFocus
                  />
                )}
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Perda (kg/h)</label>
                <Input
                  type="number"
                  step="0.01"
                  value={draft.lossKgh ?? ''}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      lossKgh: e.target.value === '' ? null : Number(e.target.value),
                      lossEstimated: false,
                    })
                  }
                  className="h-10 text-sm"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-semibold mb-1">Observações</label>
                <textarea
                  value={draft.notes || ''}
                  onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
                  rows={2}
                  className="w-full rounded-md border border-input bg-white dark:bg-slate-900 p-2 text-xs"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-semibold mb-1">Foto / vídeo do ponto</label>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={handleOpenCamera}>
                    <Camera className="h-3.5 w-3.5 mr-1" /> Tirar foto
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (!draft) return
                      setMediaFor(draft.id)
                      if (fileRef.current) {
                        fileRef.current.removeAttribute('capture')
                        fileRef.current.click()
                      }
                    }}
                  >
                    <Paperclip className="h-3.5 w-3.5 mr-1" /> Anexar
                  </Button>
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">
                  Fica vinculado ao registro — sai correlacionado no PDF.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setModalOpen(false)}>
                Cancelar
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={commitTrap}
                className="bg-sky-600 hover:bg-sky-700"
              >
                <CheckCircle2 className="h-3.5 w-3.5" /> Salvar registro
              </Button>
            </div>
          </div>
        </div>
      )}

      {cameraOpen && (
        <div
          className="fixed inset-0 z-[70] bg-black/80 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Tirar foto do purgador"
          onClick={(event) => {
            if (event.target === event.currentTarget) setCameraOpen(false)
          }}
        >
          <div className="w-full max-w-2xl rounded-2xl bg-white dark:bg-slate-900 p-4 space-y-3 shadow-2xl">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold">Tirar foto do purgador</h3>
                <p className="text-xs text-muted-foreground">
                  A webcam será usada; a foto ficará vinculada a este registro.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCameraOpen(false)}
                className="rounded-md px-2 py-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                aria-label="Fechar câmera"
              >
                ✕
              </button>
            </div>
            <div className="overflow-hidden rounded-xl bg-black aspect-video flex items-center justify-center">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="h-full w-full object-contain"
              />
              {cameraError && (
                <p className="absolute mx-5 max-w-lg rounded-lg bg-black/75 p-3 text-center text-sm text-white">
                  {cameraError}
                </p>
              )}
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs text-muted-foreground">
                {cameraReady
                  ? 'Webcam pronta.'
                  : cameraError
                    ? 'Câmera indisponível.'
                    : 'Abrindo webcam…'}
              </p>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => setCameraOpen(false)}>
                  Cancelar
                </Button>
                <Button
                  type="button"
                  onClick={handleCaptureWebcamPhoto}
                  disabled={!cameraReady || cameraCapturing}
                  className="bg-sky-600 hover:bg-sky-700"
                >
                  {cameraCapturing ? 'Salvando foto…' : 'Capturar foto'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Card>
  )
}
