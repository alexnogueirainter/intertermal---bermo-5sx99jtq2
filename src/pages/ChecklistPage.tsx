import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Loader2,
  RefreshCw,
  Link2,
  ShieldAlert,
  WifiOff,
  ClipboardList,
  Camera,
  CheckCircle2,
  XCircle,
  CircleDashed,
  Send,
  ImagePlus,
  Trash2,
  Printer,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { toast } from '@/hooks/use-toast'
import {
  CHECKLIST_TEMPLATES,
  type ChecklistTemplateType,
  type ChecklistItemType,
} from '@/data/checklist-templates'
import {
  checklistApi,
  getChecklistToken,
  getChecklistDeviceId,
  CHECKLIST_TOKEN_KEY,
  type ChecklistOpenResult,
} from '@/services/checklist-api'

/**
 * Página do técnico: Checklist Digital da OS via link com token (sem login).
 * O link abre SÓ o checklist daquela OS — sem menu, sem clientes, sem CRM.
 * 1 token = 1 aparelho (amarrado no 1º uso, mesma régua do link de visita).
 * Autosave no servidor a cada alteração; fotos sobem com marca d'água.
 */

type AccessStatus = 'checking' | 'ok' | 'invalid' | 'device' | 'network'
type AnswerStatus = 'ok' | 'nok' | 'na' | null
type AnswerMap = Record<string, { status: AnswerStatus; obs: string }>

interface PhotoRec {
  id: string
  url: string
  serverPath?: string
  etapa: number
  itemNumero: number
  legenda: string
  selecionada: boolean
  uploadStatus: 'enviado' | 'pendente'
  timestamp: string
  ordem: number
}

interface ChecklistTab {
  id: string
  template: string
  equipment_tag: string
  equipment_label: string
  status: string
  conformity_pct: number
  verdict: string
  answers: Record<string, { status: string | null; obs: string }>
  texts: Record<string, string>
  parts: any[]
}

function nowStamp(): string {
  const d = new Date()
  const pad = (n: number) => (n < 10 ? '0' + n : '' + n)
  return (
    pad(d.getDate()) +
    '/' +
    pad(d.getMonth() + 1) +
    '/' +
    d.getFullYear() +
    ' ' +
    pad(d.getHours()) +
    ':' +
    pad(d.getMinutes())
  )
}

function stageName(t: ChecklistTemplateType, n: number): string {
  const s = t.etapas.find((x) => x.n === n)
  return s ? s.nome : 'Geral'
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('img'))
    }
    img.src = url
  })
}

function compressToCanvas(img: HTMLImageElement): HTMLCanvasElement {
  const maxW = 1280
  const scale = img.width > maxW ? maxW / img.width : 1
  const c = document.createElement('canvas')
  c.width = Math.round(img.width * scale)
  c.height = Math.round(img.height * scale)
  c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height)
  return c
}

function drawWatermark(
  canvas: HTMLCanvasElement,
  meta: { cliente: string; tag: string; os: string; stamp: string; etapa: string },
): HTMLCanvasElement {
  const ctx = canvas.getContext('2d')!
  const W = canvas.width
  const H = canvas.height
  const bandH = Math.round(H * 0.09)
  const y0 = H - bandH
  const navy = '#0D193E'
  const orange = '#F48C06'
  const slate = '#4a6079'
  ctx.save()
  ctx.globalAlpha = 0.94
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, y0, W, bandH)
  ctx.restore()
  ctx.fillStyle = navy
  ctx.fillRect(0, y0, W, 4)
  const pad = Math.round(bandH * 0.18)
  const mainSize = Math.round(bandH * 0.42)
  ctx.textBaseline = 'middle'
  ctx.textAlign = 'left'
  const midY = y0 + bandH * 0.42
  ctx.font = '800 ' + mainSize + 'px system-ui, Arial, sans-serif'
  ctx.fillStyle = navy
  const inter = 'INTER'
  const wInter = ctx.measureText(inter).width
  ctx.fillText(inter, pad, midY)
  ctx.font = '400 ' + mainSize + 'px system-ui, Arial, sans-serif'
  ctx.fillText('TERMAL', pad + wInter + mainSize * 0.2, midY)
  ctx.textAlign = 'right'
  const rightX = W - pad
  const l1Size = Math.max(9, Math.round(bandH * 0.26))
  const l2Size = Math.max(7, Math.round(bandH * 0.18))
  const l1 = (meta.cliente || '—') + ' · ' + (meta.tag || '—') + ' · OS ' + (meta.os || '—')
  const l2 = meta.stamp + ' · ' + meta.etapa
  ctx.font = '700 ' + l1Size + 'px system-ui, Arial, sans-serif'
  ctx.fillStyle = navy
  ctx.fillText(l1, rightX, y0 + bandH * 0.38)
  ctx.font = '400 ' + l2Size + 'px system-ui, Arial, sans-serif'
  ctx.fillStyle = slate
  ctx.fillText(l2, rightX, y0 + bandH * 0.7)
  ctx.textAlign = 'left'
  return canvas
}

function canvasToJpeg(c: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    c.toBlob((b) => (b ? resolve(b) : reject(new Error('blob'))), 'image/jpeg', 0.75)
  })
}

function computeStats(
  itens: ChecklistItemType[],
  answers: AnswerMap,
): {
  applicable: number
  ok: number
  nok: number
  pct: number
  byStage: Record<number, { app: number; ok: number; nok: number }>
  ncList: Array<{ num: number; stage: number; titulo: string; obs: string }>
  verdict: 'aprovado' | 'ressalvas' | 'reprovado' | 'pendente'
} {
  let applicable = 0
  let ok = 0
  let nok = 0
  const byStage: Record<number, { app: number; ok: number; nok: number }> = {}
  const ncList: Array<{ num: number; stage: number; titulo: string; obs: string }> = []
  for (const it of itens) {
    const st = answers[String(it.num)]?.status
    if (!st || st === 'na') continue
    applicable++
    byStage[it.etapa] = byStage[it.etapa] || { app: 0, ok: 0, nok: 0 }
    byStage[it.etapa].app++
    if (st === 'ok') {
      ok++
      byStage[it.etapa].ok++
    }
    if (st === 'nok') {
      nok++
      byStage[it.etapa].nok++
      ncList.push({
        num: it.num,
        stage: it.etapa,
        titulo: it.titulo,
        obs: answers[String(it.num)]?.obs || '',
      })
    }
  }
  const pct = applicable ? Math.round((ok / applicable) * 100) : 0
  const lateNok = ncList.some((n) => n.stage >= 5)
  const earlyNok = ncList.some((n) => n.stage <= 4)
  let verdict: 'aprovado' | 'ressalvas' | 'reprovado' | 'pendente' = 'pendente'
  if (lateNok) verdict = 'reprovado'
  else if (applicable > 0 && ok === applicable) verdict = 'aprovado'
  else if (earlyNok) verdict = 'ressalvas'
  return { applicable, ok, nok, pct, byStage, ncList, verdict }
}

export default function ChecklistPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const urlToken = searchParams.get('t') || ''

  const [status, setStatus] = useState<AccessStatus>('checking')
  const [data, setData] = useState<ChecklistOpenResult | null>(null)

  const [answers, setAnswers] = useState<AnswerMap>({})
  const [texts, setTexts] = useState<Record<string, string>>({})
  const [ident, setIdent] = useState<Record<string, any>>({})
  const [parts, setParts] = useState<
    Array<{
      id: string
      description: string
      quantity: number
      unit: string
      unit_cost: number | ''
    }>
  >([])
  const [photos, setPhotos] = useState<PhotoRec[]>([])
  // Multi-equipamento: abas = checklists da OS (1 por equipamento)
  const [tabs, setTabs] = useState<ChecklistTab[]>([])
  const [activeTabId, setActiveTabId] = useState('')
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [sending, setSending] = useState(false)
  const [sentDone, setSentDone] = useState(false)

  const templateId = (data?.template || 'trocador') as ChecklistTemplateType['id']
  const template = CHECKLIST_TEMPLATES[templateId] || CHECKLIST_TEMPLATES.trocador
  const checklistId = data?.checklist?.id || ''
  const osNumber = data?.os_number || ''
  const tagName = String(ident.tag || '')

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const pendingPhotoItem = useRef<number | null>(null)
  const pendingPhotoEtapa = useRef<number>(0)

  // ---- Abertura pelo token ----
  const activate = useCallback(async (token: string) => {
    const res = await checklistApi.open(token, getChecklistDeviceId())
    if (res.ok && res.checklist) {
      try {
        localStorage.setItem(CHECKLIST_TOKEN_KEY, token)
      } catch (_) {
        // localStorage indisponível: segue sem persistir o token
      }
      setData(res)
      // Multi-equipamento: abas com todos os checklists da OS
      const serverTabs: ChecklistTab[] = Array.isArray((res as any).tabs)
        ? (res as any).tabs.length > 0
          ? (res as any).tabs
          : [
              {
                id: res.checklist.id,
                template: String(res.template || 'trocador'),
                equipment_tag: '',
                equipment_label: '',
                status: String(res.status || 'rascunho'),
                conformity_pct: Number(res.conformity_pct || 0),
                verdict: String(res.verdict || ''),
                answers: res.checklist.answers || {},
                texts: res.checklist.texts || {},
                parts: Array.isArray((res.checklist as any).parts)
                  ? (res.checklist as any).parts
                  : [],
              },
            ]
        : [
            {
              id: res.checklist.id,
              template: String(res.template || 'trocador'),
              equipment_tag: '',
              equipment_label: '',
              status: String(res.status || 'rascunho'),
              conformity_pct: Number(res.conformity_pct || 0),
              verdict: String(res.verdict || ''),
              answers: res.checklist.answers || {},
              texts: res.checklist.texts || {},
              parts: Array.isArray((res.checklist as any).parts)
                ? (res.checklist as any).parts
                : [],
            },
          ]
      setTabs(serverTabs)
      const first = serverTabs[0]
      setActiveTabId(first.id)
      setAnswers(first.answers || {})
      setTexts(first.texts || {})
      setIdent((prev) => ({
        ...prev,
        ...(res.checklist?.ident || {}),
        ...(first.equipment_tag ? { tag: first.equipment_tag } : {}),
      }))
      const serverParts = Array.isArray(first.parts) ? first.parts : []
      setParts(
        serverParts.map((p: any, i: number) => ({
          id: String(p.id || 'p' + i),
          description: String(p.description || ''),
          quantity: Number(p.quantity) || 1,
          unit: String(p.unit || 'un'),
          unit_cost:
            p.unit_cost !== undefined && p.unit_cost !== null && Number(p.unit_cost) > 0
              ? Number(p.unit_cost)
              : ('' as const),
        })),
      )
      const serverPhotos: PhotoRec[] = (res.checklist.media || []).map((m, i) => ({
        id: m.client_media_id,
        url: m.path,
        serverPath: m.path,
        etapa: m.etapa,
        itemNumero: m.item_numero,
        legenda: m.legenda,
        selecionada: m.selecionada,
        uploadStatus: 'enviado',
        timestamp: '',
        ordem: m.ordem || i + 1,
      }))
      setPhotos(serverPhotos)
      if (serverTabs.every((t) => t.status === 'concluido')) setSentDone(true)
      setStatus('ok')
      return true
    }
    if (res.error === 'device_not_authorized') setStatus('device')
    else if (res.error === 'network_error') setStatus('network')
    else setStatus('invalid')
    return false
  }, [])

  useEffect(() => {
    const token = urlToken || getChecklistToken()
    if (!token) {
      setStatus('invalid')
      return
    }
    setStatus('checking')
    activate(token).then((ok) => {
      if (ok && urlToken) setSearchParams({}, { replace: true })
    })
  }, [urlToken, activate])

  // ---- Autosave no servidor (900ms, padrão do CRM) ----
  const persistNow = useCallback(
    async (action: 'autosave' | 'complete', extra?: Record<string, any>) => {
      if (!checklistId) return
      setSaveState('saving')
      const res = await checklistApi.save({
        token: getChecklistToken(),
        device_id: getChecklistDeviceId(),
        action,
        checklist_id: activeTabId || checklistId,
        ident,
        answers,
        texts,
        parts: parts
          .filter((p) => p.description.trim() || Number(p.quantity) > 0)
          .map((p) => ({
            id: p.id,
            description: p.description.trim(),
            quantity: Number(p.quantity) || 0,
            unit: p.unit || 'un',
            unit_cost: p.unit_cost === '' ? null : Number(p.unit_cost),
          })),
        ...(extra || {}),
      })
      if (res.ok) setSaveState('saved')
      else setSaveState('error')
    },
    [checklistId, activeTabId, ident, answers, texts, parts],
  )

  const scheduleSave = useCallback(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => persistNow('autosave'), 900)
  }, [persistNow])

  // ---- Respostas ----
  const setAnswer = useCallback(
    (num: number, st: Exclude<AnswerStatus, null>) => {
      setAnswers((prev) => {
        const cur = prev[String(num)] || { status: null, obs: '' }
        const next = { ...prev, [String(num)]: { ...cur, status: cur.status === st ? null : st } }
        return next
      })
      scheduleSave()
    },
    [scheduleSave],
  )

  const setObs = useCallback(
    (num: number, v: string) => {
      setAnswers((prev) => ({
        ...prev,
        [String(num)]: { ...(prev[String(num)] || { status: null, obs: '' }), obs: v },
      }))
      scheduleSave()
    },
    [scheduleSave],
  )

  const setIdentField = useCallback(
    (k: string, v: any) => {
      setIdent((prev) => ({ ...prev, [k]: v }))
      scheduleSave()
    },
    [scheduleSave],
  )

  const setText = useCallback(
    (k: string, v: string) => {
      setTexts((prev) => ({ ...prev, [k]: v }))
      scheduleSave()
    },
    [scheduleSave],
  )

  // ---- Troca de aba (multi-equipamento): guarda o estado da atual e carrega a destino ----
  const switchTab = useCallback(
    (tabId: string) => {
      if (tabId === activeTabId) return
      // persiste a aba atual em memória (autosave já roda em background)
      setTabs((prev) =>
        prev.map((t) =>
          t.id === activeTabId
            ? { ...t, answers: answers, texts: texts, parts: parts as any[] }
            : t,
        ),
      )
      const target = tabs.find((t) => t.id === tabId)
      if (!target) return
      setActiveTabId(tabId)
      setAnswers(target.answers || {})
      setTexts(target.texts || {})
      setParts(
        (target.parts || []).map((p: any, i: number) => ({
          id: String(p.id || 'p' + i),
          description: String(p.description || ''),
          quantity: Number(p.quantity) || 1,
          unit: String(p.unit || 'un'),
          unit_cost:
            p.unit_cost !== undefined && p.unit_cost !== null && Number(p.unit_cost) > 0
              ? Number(p.unit_cost)
              : ('' as const),
        })),
      )
      setPhotos([]) // fotos são por checklist; recarregam no autosave/open da aba
      if (target.equipment_tag) {
        setIdent((prev) => ({ ...prev, tag: target.equipment_tag }))
      }
    },
    [activeTabId, tabs, answers, texts, parts],
  )

  // ---- Peças e materiais (custo opcional — alimenta a margem realizada da OS) ----
  const addPart = useCallback(() => {
    setParts((prev) => [
      ...prev,
      {
        id: 'p' + Date.now() + '-' + Math.floor(Math.random() * 1000),
        description: '',
        quantity: 1,
        unit: 'un',
        unit_cost: '',
      },
    ])
    scheduleSave()
  }, [scheduleSave])

  const updatePart = useCallback(
    (id: string, field: 'description' | 'quantity' | 'unit' | 'unit_cost', value: any) => {
      setParts((prev) => prev.map((p) => (p.id === id ? { ...p, [field]: value } : p)))
      scheduleSave()
    },
    [scheduleSave],
  )

  const removePart = useCallback(
    (id: string) => {
      setParts((prev) => prev.filter((p) => p.id !== id))
      scheduleSave()
    },
    [scheduleSave],
  )

  // ---- Fotos: captura, marca d'água e upload ----
  const processPhoto = useCallback(
    async (file: File, itemNum: number, etapa: number) => {
      try {
        const img = await loadImage(file)
        const base = compressToCanvas(img)
        const marked = document.createElement('canvas')
        marked.width = base.width
        marked.height = base.height
        marked.getContext('2d')!.drawImage(base, 0, 0)
        drawWatermark(marked, {
          cliente: String(ident.cliente || data?.os?.client_name || ''),
          tag: tagName,
          os: osNumber,
          stamp: nowStamp(),
          etapa: stageName(template, etapa),
        })
        const blob = await canvasToJpeg(marked)
        const id = 'f' + Date.now() + Math.floor(Math.random() * 1000)
        const url = URL.createObjectURL(blob)
        const rec: PhotoRec = {
          id,
          url,
          etapa,
          itemNumero: itemNum,
          legenda: itemNum ? 'Item ' + itemNum : stageName(template, etapa),
          selecionada: true,
          uploadStatus: 'pendente',
          timestamp: nowStamp(),
          ordem: photos.length + 1,
        }
        setPhotos((prev) => [...prev, rec])
        // Upload direto (idempotente no servidor)
        const res = await checklistApi.uploadMedia({
          client_media_id: id,
          kind: 'image',
          original_name: file.name || 'foto.jpg',
          size: blob.size,
          item_numero: itemNum,
          etapa,
          legenda: rec.legenda,
          checklist_id: checklistId,
          token: getChecklistToken(),
          device_id: getChecklistDeviceId(),
          file: blob,
          filename: id + '.jpg',
        })
        if (res.ok && res.path) {
          setPhotos((prev) =>
            prev.map((p) =>
              p.id === id
                ? { ...p, url: res.path as string, serverPath: res.path, uploadStatus: 'enviado' }
                : p,
            ),
          )
          toast({ title: 'Foto salva com marca d\u2019água.' })
        } else {
          toast({
            title: 'Foto guardada no aparelho',
            description: 'Sem conex\u00e3o agora \u2014 a foto reenvia quando a internet voltar.',
            variant: 'destructive',
          })
        }
      } catch (_) {
        toast({ title: 'Não foi possível processar a foto.', variant: 'destructive' })
      }
    },
    [ident, tagName, osNumber, template, checklistId, photos.length],
  )

  const openPhotoFlow = useCallback((itemNum: number, etapa: number) => {
    pendingPhotoItem.current = itemNum
    pendingPhotoEtapa.current = etapa
    fileInputRef.current?.click()
  }, [])

  const onFileChosen = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files && e.target.files[0]
      e.target.value = ''
      if (!f) return
      processPhoto(f, pendingPhotoItem.current || 0, pendingPhotoEtapa.current || 0)
      pendingPhotoItem.current = null
      pendingPhotoEtapa.current = 0
    },
    [processPhoto],
  )

  const deletePhoto = useCallback(
    async (id: string) => {
      const rec = photos.find((p) => p.id === id)
      setPhotos((prev) => prev.filter((p) => p.id !== id))
      if (rec && rec.uploadStatus === 'enviado') {
        await checklistApi.deleteMedia(id, getChecklistToken(), getChecklistDeviceId())
      }
    },
    [photos],
  )

  const toggleSelected = useCallback((id: string) => {
    setPhotos((prev) => prev.map((p) => (p.id === id ? { ...p, selecionada: !p.selecionada } : p)))
  }, [])

  // ---- Conclusão ----
  const stats = useMemo(() => computeStats(template.itens, answers), [template, answers])

  const handleSend = useCallback(async () => {
    if (stats.applicable === 0) {
      toast({
        title: 'Responda os itens antes de enviar',
        description: 'Marque OK, Não OK ou N/A em pelo menos um item.',
        variant: 'destructive',
      })
      return
    }
    setSending(true)
    // Multi-equipamento: completa a aba ativa e depois as demais pendentes
    await persistNow('complete', {
      conformity_pct: stats.pct,
      verdict: stats.verdict,
      ...(templateId === 'purgadores'
        ? { economia_ano: Number(ident.economia_ano || 0) || null }
        : {}),
    })
    const pendingTabs = tabs.filter((t) => t.id !== activeTabId && t.status !== 'concluido')
    for (const t of pendingTabs) {
      const tTemplate =
        CHECKLIST_TEMPLATES[(t.template as ChecklistTemplateType['id']) || 'trocador'] ||
        CHECKLIST_TEMPLATES.trocador
      const tStats = computeStats(tTemplate.itens, t.answers || {})
      if (tStats.applicable === 0) continue // aba nunca preenchida: não bloqueia o envio
      await checklistApi.save({
        token: getChecklistToken(),
        device_id: getChecklistDeviceId(),
        action: 'complete',
        checklist_id: t.id,
        answers: t.answers || {},
        texts: t.texts || {},
        parts: (t.parts || []).map((p: any) => ({
          id: p.id,
          description: String(p.description || ''),
          quantity: Number(p.quantity) || 0,
          unit: p.unit || 'un',
          unit_cost:
            p.unit_cost === '' || p.unit_cost === undefined || p.unit_cost === null
              ? null
              : Number(p.unit_cost),
        })),
        conformity_pct: tStats.pct,
        verdict: tStats.verdict,
        ...(t.template === 'purgadores'
          ? { economia_ano: Number((t as any).economia_ano || 0) || null }
          : {}),
      })
    }
    setSending(false)
    setSentDone(true)
    const totalTabs = tabs.length
    toast({
      title:
        totalTabs > 1
          ? `${totalTabs} checklists enviados ao escritório`
          : 'Checklist enviado ao escritório',
      description: 'A OS foi atualizada. Obrigado!',
    })
  }, [stats, persistNow, templateId, ident, tabs, activeTabId])

  // ---- Pré-preenchimento da identificação a partir da OS ----
  useEffect(() => {
    if (!data) return
    setIdent((prev) => ({
      cliente: prev.cliente || data.os?.client_name || '',
      endereco: prev.endereco || data.os?.client_address || '',
      cidade: prev.cidade || data.os?.client_city || '',
      os: prev.os || data.os_number || '',
      equipamento: prev.equipamento || data.os?.equipment_brand || '',
      modelo: prev.modelo || data.os?.equipment_model || '',
      tecnico: prev.tecnico || data.technician_name || '',
      ...prev,
    }))
  }, [data])

  // ---- Telas de acesso ----
  if (status === 'checking') {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center gap-3 px-6">
        <Loader2 className="h-8 w-8 animate-spin text-teal-700" />
        <p className="text-sm text-slate-600 dark:text-slate-400">Verificando seu acesso…</p>
      </div>
    )
  }

  if (status === 'invalid') {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center px-6">
        <Card className="w-full max-w-sm">
          <CardContent className="pt-8 pb-8 flex flex-col items-center text-center gap-3">
            <div className="h-14 w-14 rounded-2xl bg-rose-100 dark:bg-rose-950/60 flex items-center justify-center">
              <Link2 className="h-7 w-7 text-rose-600" />
            </div>
            <h1 className="text-lg font-bold">Link inválido</h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Este link não está ativo. Peça um novo link ao Alex.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (status === 'device') {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center px-6">
        <Card className="w-full max-w-sm">
          <CardContent className="pt-8 pb-8 flex flex-col items-center text-center gap-3">
            <div className="h-14 w-14 rounded-2xl bg-rose-100 dark:bg-rose-950/60 flex items-center justify-center">
              <ShieldAlert className="h-7 w-7 text-rose-600" />
            </div>
            <h1 className="text-lg font-bold">Aparelho não autorizado</h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Este link já está vinculado a outro celular. Fale com o Alex para liberar.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (status === 'network') {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center px-6">
        <Card className="w-full max-w-sm">
          <CardContent className="pt-8 pb-8 flex flex-col items-center text-center gap-3">
            <div className="h-14 w-14 rounded-2xl bg-amber-100 dark:bg-amber-950/60 flex items-center justify-center">
              <WifiOff className="h-7 w-7 text-amber-600" />
            </div>
            <h1 className="text-lg font-bold">Sem conexão</h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Confira a internet e tente de novo.
            </p>
            <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
              <RefreshCw className="h-4 w-4 mr-1.5" /> Tentar novamente
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!data) return null

  const answered = template.itens.filter((it) => answers[String(it.num)]?.status).length
  const pct = template.itens.length ? Math.round((answered / template.itens.length) * 100) : 0
  const selectedPhotos = photos.filter((p) => p.selecionada)

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-28">
      {/* Cabeçalho fixo */}
      <header className="sticky top-0 z-30 bg-[#0D193E] text-white shadow-md">
        <div className="max-w-3xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-sm tracking-tight">
                  INTER<span className="font-normal">TERMAL</span>
                </span>
                <span className="text-[10px] bg-[#F48C06]/20 text-[#F48C06] font-bold px-1.5 py-0.5 rounded">
                  CHECKLIST
                </span>
              </div>
              <h1 className="text-base font-bold leading-tight truncate">
                {template.nome} · OS {osNumber}
              </h1>
              <p className="text-xs text-slate-300 truncate">
                {data.os?.client_name}
                {(() => {
                  const at = tabs.find((t) => t.id === activeTabId)
                  const ref = at ? at.equipment_tag || at.equipment_label : ''
                  return ref ? ` · ${ref}` : ''
                })()}
              </p>
            </div>
            <div className="text-right shrink-0">
              <span className="text-[11px] block">
                {saveState === 'saving'
                  ? 'Salvando…'
                  : saveState === 'saved'
                    ? 'Salvo ✓'
                    : saveState === 'error'
                      ? 'Sem conexão — salva ao voltar'
                      : 'Aguardando'}
              </span>
              {sentDone && (
                <Badge className="mt-1 bg-emerald-600 text-white text-[10px]">ENVIADO</Badge>
              )}
            </div>
          </div>
          {/* Abas multi-equipamento: 1 checklist por equipamento */}
          {tabs.length > 1 && (
            <div className="flex gap-1.5 mt-2.5 overflow-x-auto pb-0.5">
              {tabs.map((t) => {
                const tTpl =
                  CHECKLIST_TEMPLATES[(t.template as ChecklistTemplateType['id']) || 'trocador'] ||
                  CHECKLIST_TEMPLATES.trocador
                const tAnswered = tTpl.itens.filter(
                  (it) => (t.answers || {})[String(it.num)]?.status,
                ).length
                const done = t.status === 'concluido'
                const active = t.id === activeTabId
                const ref = t.equipment_tag || t.equipment_label || tTpl.nome.split(' ')[0]
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => switchTab(t.id)}
                    className={`shrink-0 px-2.5 py-1.5 rounded-lg text-[11px] font-bold border transition-all flex items-center gap-1.5 ${
                      active
                        ? 'bg-[#F48C06] text-white border-[#F48C06]'
                        : done
                          ? 'bg-emerald-600/20 text-emerald-300 border-emerald-600/40'
                          : 'bg-white/10 text-slate-200 border-white/20'
                    }`}
                  >
                    {done && <CheckCircle2 className="h-3 w-3" />}
                    <span className="truncate max-w-[110px]">{ref}</span>
                    <span className="opacity-75">
                      {tAnswered}/{tTpl.itens.length}
                    </span>
                  </button>
                )
              })}
            </div>
          )}
          <div className="mt-2">
            <div className="flex justify-between text-[11px] font-semibold">
              <span>
                {answered} de {template.itens.length} respondidos
              </span>
              <span>{pct}%</span>
            </div>
            <div className="h-2 bg-white/20 rounded-full overflow-hidden mt-1">
              <div className="h-full bg-[#F48C06] transition-all" style={{ width: pct + '%' }} />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-4 space-y-4">
        {/* Identificação */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold">Identificação</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Cliente</Label>
              <Input
                value={String(ident.cliente || '')}
                readOnly
                className="bg-slate-100 dark:bg-slate-800"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Nº da OS</Label>
              <Input
                value={String(ident.os || '')}
                readOnly
                className="bg-slate-100 dark:bg-slate-800"
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-xs">Endereço</Label>
              <Input
                value={String(ident.endereco || '')}
                readOnly
                className="bg-slate-100 dark:bg-slate-800"
              />
            </div>
            {template.camposEspecificos.map((c) => (
              <div key={c.key} className="space-y-1.5">
                <Label className="text-xs">
                  {c.label}
                  {c.obrigatorio && <span className="text-rose-600 ml-1">*</span>}
                </Label>
                <Input
                  type={c.tipo === 'number' ? 'number' : 'text'}
                  value={String(ident[c.key] ?? '')}
                  onChange={(e) =>
                    setIdentField(c.key, c.tipo === 'number' ? e.target.value : e.target.value)
                  }
                  placeholder={c.helper || ''}
                />
              </div>
            ))}
            <div className="space-y-1.5">
              <Label className="text-xs">Técnico responsável</Label>
              <Input
                value={String(ident.tecnico || '')}
                onChange={(e) => setIdentField('tecnico', e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Etapas do checklist */}
        {template.etapas.map((st) => {
          const items = template.itens.filter((it) => it.etapa === st.n)
          const done = items.filter((it) => answers[String(it.num)]?.status).length
          return (
            <Card key={st.n}>
              <div
                className="flex items-center justify-between px-4 py-2.5 text-white rounded-t-xl"
                style={{ background: st.cor }}
              >
                <h3 className="text-sm font-bold">
                  Etapa {st.n} — {st.nome}
                </h3>
                <span className="text-[11px] font-bold bg-white/20 rounded-full px-2 py-0.5">
                  {done}/{items.length}
                </span>
              </div>
              <CardContent className="divide-y divide-slate-100 dark:divide-slate-800">
                {items.map((it) => {
                  const a = answers[String(it.num)] || { status: null, obs: '' }
                  return (
                    <div key={it.num} className="py-3">
                      <div className="flex items-start gap-2">
                        <span className="h-6 w-6 shrink-0 rounded-lg bg-slate-100 dark:bg-slate-800 text-[12px] font-extrabold flex items-center justify-center">
                          {it.num}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold leading-snug">{it.titulo}</p>
                          <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5">
                            Critério: {it.criterio}
                          </p>
                          <div className="flex gap-1.5 mt-2">
                            <Button
                              type="button"
                              size="sm"
                              onClick={() => setAnswer(it.num, 'ok')}
                              className={
                                'h-8 px-3 text-xs ' +
                                (a.status === 'ok'
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300')
                              }
                            >
                              <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> OK
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              onClick={() => setAnswer(it.num, 'nok')}
                              className={
                                'h-8 px-3 text-xs ' +
                                (a.status === 'nok'
                                  ? 'bg-rose-600 text-white'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300')
                              }
                            >
                              <XCircle className="h-3.5 w-3.5 mr-1" /> Não OK
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              onClick={() => setAnswer(it.num, 'na')}
                              className={
                                'h-8 px-3 text-xs ' +
                                (a.status === 'na'
                                  ? 'bg-slate-500 text-white'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300')
                              }
                            >
                              <CircleDashed className="h-3.5 w-3.5 mr-1" /> N/A
                            </Button>
                          </div>
                          <Textarea
                            className="mt-2 text-sm min-h-[52px]"
                            placeholder="Observação (opcional)"
                            value={a.obs}
                            onChange={(e) => setObs(it.num, e.target.value)}
                          />
                          <div className="flex items-center justify-between mt-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-8 text-xs"
                              onClick={() => openPhotoFlow(it.num, st.n)}
                            >
                              <Camera className="h-3.5 w-3.5 mr-1" /> Foto do item
                            </Button>
                            <span className="text-[10px] text-slate-400">
                              {photos.filter((p) => p.itemNumero === it.num).length} foto(s)
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          )
        })}

        {/* Fotos */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold">Registro fotográfico</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                className="bg-[#F48C06] text-[#14120e] hover:bg-[#d97d05]"
                onClick={() => openPhotoFlow(0, 0)}
              >
                <Camera className="h-4 w-4 mr-1.5" /> Tirar foto
              </Button>
              <span className="text-xs text-slate-500 self-center">
                {photos.length} foto(s) · {selectedPhotos.length} no relatório
              </span>
            </div>
            {photos.length === 0 ? (
              <p className="text-xs text-slate-500">
                Nenhuma foto ainda. As fotos saem com a marca d'água da OS automaticamente.
              </p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {photos.map((p) => (
                  <div
                    key={p.id}
                    className="rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden"
                  >
                    <img src={p.url} alt={p.legenda} className="w-full aspect-[4/3] object-cover" />
                    <div className="p-2 space-y-1">
                      <Input
                        className="text-xs h-8"
                        value={p.legenda}
                        onChange={(e) =>
                          setPhotos((prev) =>
                            prev.map((x) =>
                              x.id === p.id ? { ...x, legenda: e.target.value } : x,
                            ),
                          )
                        }
                        placeholder="Legenda"
                      />
                      <div className="flex items-center justify-between gap-1">
                        <label className="flex items-center gap-1 text-[11px]">
                          <input
                            type="checkbox"
                            checked={p.selecionada}
                            onChange={() => toggleSelected(p.id)}
                          />
                          No relatório
                        </label>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-rose-600"
                          onClick={() => deletePhoto(p.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Textos do relatório */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold">Relatório — textos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {template.secoes.map((s) => (
              <div key={s.key} className="space-y-1.5">
                <Label className="text-xs font-bold">{s.label}</Label>
                <Textarea
                  value={texts[s.key] || ''}
                  onChange={(e) => setText(s.key, e.target.value)}
                  placeholder={s.placeholder}
                  className="min-h-[72px] text-sm"
                />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Peças e materiais */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold">Peças e materiais utilizados</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-[11px] text-muted-foreground">
              Opcional. Peça com custo informado entra no custo real da OS (margem realizada). Sem
              custo, o escritório completa depois.
            </p>
            {parts.map((p) => (
              <div
                key={p.id}
                className="grid grid-cols-[1fr_64px_64px_88px_36px] gap-1.5 items-center"
              >
                <Input
                  value={p.description}
                  onChange={(e) => updatePart(p.id, 'description', e.target.value)}
                  placeholder="Descrição da peça"
                  className="text-xs"
                />
                <Input
                  type="number"
                  min="0"
                  step="1"
                  value={p.quantity}
                  onChange={(e) => updatePart(p.id, 'quantity', e.target.value)}
                  placeholder="Qtd"
                  className="text-xs"
                />
                <Input
                  value={p.unit}
                  onChange={(e) => updatePart(p.id, 'unit', e.target.value)}
                  placeholder="un"
                  className="text-xs"
                />
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={p.unit_cost === '' ? '' : p.unit_cost}
                  onChange={(e) =>
                    updatePart(
                      p.id,
                      'unit_cost',
                      e.target.value === '' ? '' : Number(e.target.value),
                    )
                  }
                  placeholder="R$ custo"
                  className="text-xs"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removePart(p.id)}
                  className="h-8 w-8 p-0 text-rose-600"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={addPart} className="text-xs">
              + Adicionar peça
            </Button>
          </CardContent>
        </Card>

        {/* Resultado */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold">Resultado</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div
              className="flex items-center justify-between rounded-xl p-4 text-white"
              style={{ background: 'linear-gradient(135deg,#0D193E,#0077B6)' }}
            >
              <div>
                <p className="text-[11px] uppercase font-bold opacity-85">Conformidade</p>
                <p className="text-2xl font-extrabold">{stats.pct}%</p>
                <p className="text-xs opacity-90">
                  {stats.ok} de {stats.applicable} aplicáveis OK
                </p>
              </div>
              <div
                className="h-16 w-16 rounded-full grid place-items-center"
                style={{
                  background: `conic-gradient(#F48C06 ${stats.pct * 1}%, rgba(255,255,255,.18) 0)`,
                }}
              >
                <div className="h-12 w-12 rounded-full bg-[#0D193E] grid place-items-center text-sm font-extrabold">
                  {stats.pct}%
                </div>
              </div>
            </div>
            {stats.verdict === 'aprovado' && (
              <div className="rounded-xl p-4 text-center font-extrabold bg-emerald-600 text-white">
                APROVADO
                <span className="block text-xs font-medium">Pronto para enviar ao escritório.</span>
              </div>
            )}
            {stats.verdict === 'ressalvas' && (
              <div className="rounded-xl p-4 text-center font-extrabold bg-amber-400 text-[#3b2a00]">
                APROVADO COM RESSALVAS
                <span className="block text-xs font-medium">
                  Há Não OK nas etapas 1 a 4. Registre a ação corretiva.
                </span>
              </div>
            )}
            {stats.verdict === 'reprovado' && (
              <div className="rounded-xl p-4 text-center font-extrabold bg-rose-600 text-white">
                REPROVADO
                <span className="block text-xs font-medium">
                  Falha em montagem/teste. Não retorna à operação.
                </span>
              </div>
            )}
            {stats.ncList.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-xs font-bold">Não conformidades</p>
                {stats.ncList.map((n) => (
                  <div
                    key={n.num}
                    className="text-xs rounded-lg border border-rose-200 dark:border-rose-900 p-2"
                  >
                    <span className="font-bold">Item {n.num}</span> — {n.titulo}
                    {n.obs ? <span className="block text-slate-500">Obs: {n.obs}</span> : null}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Rodapé fixo: enviar */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-3">
        <div className="max-w-3xl mx-auto">
          {sentDone ? (
            <div className="flex items-center justify-center gap-2 text-sm font-bold text-emerald-700 dark:text-emerald-400 py-2">
              <CheckCircle2 className="h-5 w-5" /> Checklist enviado — OS atualizada no CRM
            </div>
          ) : (
            <Button
              className="w-full h-12 text-sm font-bold bg-teal-700 hover:bg-teal-600 text-white"
              disabled={sending || saveState === 'saving'}
              onClick={handleSend}
            >
              {sending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Enviar ao escritório
            </Button>
          )}
        </div>
      </div>

      {/* Input de foto oculto */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={onFileChosen}
      />
    </div>
  )
}
