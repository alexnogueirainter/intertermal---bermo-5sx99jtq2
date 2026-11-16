import { useState, useEffect, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import pb from '@/lib/pocketbase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  ClipboardList,
  CheckCircle2,
  Search,
  ArrowLeft,
  Wrench,
  Camera,
  Package,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react'
import { CHECKLIST_TEMPLATES } from '@/data/checklist-templates'
import { ChecklistFinalReportDialog } from '@/components/ChecklistFinalReportDialog'
import { FileText } from 'lucide-react'

/**
 * Tela "Checklists Recebidos" — visão operacional do escritório.
 * Lista completa (abertos + concluídos) com busca e filtros; clique abre o
 * detalhe: respostas item a item, fotos com marca d'água, peças e rastreio.
 * Padrão da tela "Visitas Recebidas".
 */

interface ChecklistRow {
  id: string
  service_order_id: string
  os_number: string
  template: string
  client_name: string
  technician_name: string
  status: string
  conformity_pct: number
  verdict: string
  equipment_tag?: string
  equipment_label?: string
  economia_ano: number
  completed_at: string
  created: string
  updated: string
}

interface ChecklistDetail extends ChecklistRow {
  ident: Record<string, any>
  answers: Record<string, { status: string | null; obs: string }>
  texts: Record<string, string>
  parts: Array<{
    id?: string
    description: string
    quantity: number
    unit?: string
    unit_cost?: number | null
  }>
  media: Array<{
    client_media_id: string
    item_numero: number
    etapa: number
    legenda: string
    selecionada: boolean
    ordem: number
    path: string
  }>
  trace: { device_bound_at: string; device_ip: string; device_ua: string }
}

function fmtDate(iso: string): string {
  if (!iso) return '—'
  const d = new Date(iso.replace(' ', 'T'))
  if (isNaN(d.getTime())) return '—'
  return (
    d.toLocaleDateString('pt-BR') +
    ' ' +
    d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  )
}

function tplNome(t: string): string {
  const tpl = CHECKLIST_TEMPLATES[(t as any) || 'trocador']
  return tpl ? tpl.nome.split(' ')[0] : t
}

function statusBadge(s: string) {
  if (s === 'concluido')
    return <Badge className="bg-emerald-600 text-white text-[10px]">CONCLUÍDO</Badge>
  return <Badge className="bg-teal-700 text-white text-[10px]">EM CAMPO</Badge>
}

function verdictBadge(v: string) {
  if (v === 'aprovado')
    return <Badge className="bg-emerald-600 text-white text-[10px]">APROVADO</Badge>
  if (v === 'ressalvas')
    return <Badge className="bg-amber-400 text-[#3b2a00] text-[10px]">RESSALVAS</Badge>
  if (v === 'reprovado')
    return <Badge className="bg-rose-600 text-white text-[10px]">REPROVADO</Badge>
  return (
    <Badge variant="outline" className="text-[10px]">
      PENDENTE
    </Badge>
  )
}

export default function ChecklistsReceivedPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [reportOpen, setReportOpen] = useState(false)
  const [rows, setRows] = useState<ChecklistRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [search, setSearch] = useState('')
  const [fStatus, setFStatus] = useState<'all' | 'abertos' | 'concluidos'>('all')
  const [fVerdict, setFVerdict] = useState<'all' | 'aprovado' | 'ressalvas' | 'reprovado'>('all')
  const [detail, setDetail] = useState<ChecklistDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  useEffect(() => {
    let isMounted = true
    ;(async () => {
      try {
        const res = (await pb.send('/backend/v1/checklists/list', { method: 'GET' })) as any
        if (isMounted && res?.ok && Array.isArray(res.checklists)) setRows(res.checklists)
      } catch (_) {
        if (isMounted) setError(true)
      } finally {
        if (isMounted) setLoading(false)
      }
    })()
    return () => {
      isMounted = false
    }
  }, [])

  // Detalhe quando há :id na rota
  useEffect(() => {
    if (!id) {
      setDetail(null)
      return
    }
    let isMounted = true
    setDetailLoading(true)
    ;(async () => {
      try {
        const res = (await pb.send(`/backend/v1/checklists/detail?id=${encodeURIComponent(id)}`, {
          method: 'GET',
        })) as any
        if (isMounted && res?.ok) setDetail(res.checklist)
      } catch (_) {
        if (isMounted) setDetail(null)
      } finally {
        if (isMounted) setDetailLoading(false)
      }
    })()
    return () => {
      isMounted = false
    }
  }, [id])

  const filtered = useMemo(() => {
    const term = search.toLowerCase().trim()
    return rows.filter((r) => {
      if (fStatus === 'abertos' && r.status === 'concluido') return false
      if (fStatus === 'concluidos' && r.status !== 'concluido') return false
      if (fVerdict !== 'all' && r.verdict !== fVerdict) return false
      if (!term) return true
      const hay = [
        r.os_number,
        r.client_name,
        r.technician_name,
        r.equipment_tag,
        r.equipment_label,
      ]
        .join(' ')
        .toLowerCase()
      return hay.includes(term)
    })
  }, [rows, search, fStatus, fVerdict])

  // ---------- DETALHE ----------
  if (id) {
    const tpl =
      CHECKLIST_TEMPLATES[(detail?.template as any) || 'trocador'] || CHECKLIST_TEMPLATES.trocador
    return (
      <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/checklists')}
          className="text-xs"
        >
          <ArrowLeft className="h-4 w-4 mr-1" /> Voltar para a lista
        </Button>

        {detailLoading && (
          <div className="flex items-center justify-center py-16 gap-2 text-sm text-slate-500">
            <ClipboardList className="h-5 w-5 animate-pulse" /> Carregando checklist…
          </div>
        )}

        {detail && (
          <>
            {/* Cabeçalho do detalhe */}
            <Card className="border-slate-200 dark:border-slate-800">
              <CardHeader className="pb-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <ClipboardList className="h-5 w-5 text-teal-600" />
                    OS {detail.os_number} ·{' '}
                    {detail.equipment_tag || detail.equipment_label || tplNome(detail.template)}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    {statusBadge(detail.status)}
                    {verdictBadge(detail.verdict)}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pb-2 -mt-2">
                <Button
                  type="button"
                  size="sm"
                  onClick={() => setReportOpen(true)}
                  className="bg-teal-700 hover:bg-teal-600 text-white text-xs h-8"
                >
                  <FileText className="h-3.5 w-3.5 mr-1" /> Ver relatório final
                </Button>
              </CardContent>
              <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-[10px] font-bold uppercase text-muted-foreground block">
                    Cliente
                  </span>
                  <span className="font-semibold">{detail.client_name || '—'}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-muted-foreground block">
                    Técnico
                  </span>
                  <span className="font-semibold">{detail.technician_name || '—'}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-muted-foreground block">
                    Conformidade
                  </span>
                  <span className="font-bold text-teal-700 dark:text-teal-400">
                    {detail.conformity_pct}%
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-muted-foreground block">
                    {detail.status === 'concluido' ? 'Concluído em' : 'Última alteração'}
                  </span>
                  <span>
                    {fmtDate(detail.status === 'concluido' ? detail.completed_at : detail.updated)}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Respostas item a item, agrupadas por etapa */}
            <Card className="border-slate-200 dark:border-slate-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-teal-600" /> Respostas do checklist —{' '}
                  {tpl.nome}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {tpl.etapas.map((et) => {
                  const itens = tpl.itens.filter((it) => it.etapa === et.n)
                  return (
                    <div key={et.n}>
                      <p className="text-xs font-bold text-teal-800 dark:text-teal-300 uppercase tracking-wide mb-1.5">
                        Etapa {et.n} · {et.nome}
                      </p>
                      <div className="space-y-1">
                        {itens.map((it) => {
                          const a = (detail.answers || {})[String(it.num)]
                          const st = a?.status
                          return (
                            <div
                              key={it.num}
                              className="flex items-start gap-2 text-xs rounded-lg border border-slate-100 dark:border-slate-800 px-2.5 py-1.5"
                            >
                              <span className="font-mono text-slate-400 w-6 shrink-0">
                                {it.num}
                              </span>
                              <span className="flex-1 text-slate-700 dark:text-slate-300">
                                {it.titulo}
                                {a?.obs ? (
                                  <span className="block text-[11px] text-slate-500">
                                    Obs: {a.obs}
                                  </span>
                                ) : null}
                              </span>
                              {st === 'ok' && (
                                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                              )}
                              {st === 'nok' && (
                                <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
                              )}
                              {st === 'na' && (
                                <span className="text-[10px] font-bold text-slate-400 shrink-0 mt-0.5">
                                  N/A
                                </span>
                              )}
                              {!st && (
                                <span className="text-[10px] text-slate-300 shrink-0 mt-0.5">
                                  —
                                </span>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </CardContent>
            </Card>

            {/* Textos do relatório */}
            {detail.texts && Object.keys(detail.texts).length > 0 && (
              <Card className="border-slate-200 dark:border-slate-800">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-bold">Relatório — textos do técnico</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {tpl.secoes.map((s) => {
                    const v = (detail.texts || {})[s.key]
                    if (!v) return null
                    return (
                      <div key={s.key}>
                        <span className="text-[10px] font-bold uppercase text-muted-foreground block">
                          {s.label}
                        </span>
                        <p className="text-xs whitespace-pre-wrap text-slate-700 dark:text-slate-300">
                          {v}
                        </p>
                      </div>
                    )
                  })}
                </CardContent>
              </Card>
            )}

            {/* Fotos */}
            {detail.media && detail.media.length > 0 && (
              <Card className="border-slate-200 dark:border-slate-800">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <Camera className="h-4 w-4 text-teal-600" /> Fotos de campo (
                    {detail.media.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {detail.media.map((m) => (
                      <div
                        key={m.client_media_id}
                        className="rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden"
                      >
                        <img
                          src={m.path}
                          alt={m.legenda || 'Foto de campo'}
                          className="w-full aspect-4/3 object-cover bg-slate-100"
                        />
                        {m.legenda && (
                          <p className="text-[10px] text-slate-600 dark:text-slate-400 p-1.5 text-center">
                            {m.legenda}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Peças */}
            {detail.parts && detail.parts.length > 0 && (
              <Card className="border-slate-200 dark:border-slate-800">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <Package className="h-4 w-4 text-teal-600" /> Peças e materiais (
                    {detail.parts.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-950/60 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 font-semibold">
                      <tr>
                        <th className="py-2 px-3 text-left">Descrição</th>
                        <th className="py-2 px-3 text-center w-16">Qtd</th>
                        <th className="py-2 px-3 text-center w-14">Un</th>
                        <th className="py-2 px-3 text-right w-24">Custo (R$)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {detail.parts.map((p, i) => (
                        <tr key={p.id || i}>
                          <td className="py-2 px-3 font-medium">{p.description}</td>
                          <td className="py-2 px-3 text-center font-bold">{p.quantity}</td>
                          <td className="py-2 px-3 text-center">{p.unit || 'un'}</td>
                          <td className="py-2 px-3 text-right font-mono">
                            {p.unit_cost && Number(p.unit_cost) > 0 ? (
                              Number(p.unit_cost).toLocaleString('pt-BR', {
                                minimumFractionDigits: 2,
                              })
                            ) : (
                              <span className="text-amber-600 text-[10px]">sem custo</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            )}

            {/* Relatório final (prévia + impressão) */}
            <ChecklistFinalReportDialog
              open={reportOpen}
              onOpenChange={setReportOpen}
              checklistId={detail.id}
            />

            {/* Rastreabilidade */}
            <Card className="border-slate-200 dark:border-slate-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Wrench className="h-4 w-4 text-slate-400" /> Rastreabilidade
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-slate-600 dark:text-slate-400">
                <div>
                  <span className="text-[10px] font-bold uppercase text-muted-foreground block">
                    Aparelho vinculado em
                  </span>
                  {detail.trace?.device_bound_at ? fmtDate(detail.trace.device_bound_at) : '—'}
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-muted-foreground block">
                    IP de origem
                  </span>
                  {detail.trace?.device_ip || '—'}
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-muted-foreground block">
                    Criado em
                  </span>
                  {fmtDate(detail.created)}
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {!detailLoading && !detail && (
          <Card className="border-slate-200 dark:border-slate-800">
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              Checklist não encontrado.
            </CardContent>
          </Card>
        )}
      </div>
    )
  }

  // ---------- LISTA ----------
  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-lg font-bold flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-teal-600" /> Checklists Recebidos
          </h1>
          <p className="text-xs text-muted-foreground">
            O que os técnicos preencheram em campo — clique para abrir o detalhe completo
          </p>
        </div>
        <Badge variant="outline" className="text-xs">
          {filtered.length} de {rows.length}
        </Badge>
      </div>

      {/* Busca e filtros */}
      <Card className="border-slate-200 dark:border-slate-800">
        <CardContent className="py-3 flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="h-4 w-4 absolute left-2.5 top-2.5 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por OS, cliente, TAG ou técnico…"
              className="pl-8 text-xs h-8"
            />
          </div>
          <select
            value={fStatus}
            onChange={(e) => setFStatus(e.target.value as any)}
            className="h-8 text-xs rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-2"
          >
            <option value="all">Todos os status</option>
            <option value="abertos">Em campo</option>
            <option value="concluidos">Concluídos</option>
          </select>
          <select
            value={fVerdict}
            onChange={(e) => setFVerdict(e.target.value as any)}
            className="h-8 text-xs rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-2"
          >
            <option value="all">Todos os vereditos</option>
            <option value="aprovado">Aprovado</option>
            <option value="ressalvas">Ressalvas</option>
            <option value="reprovado">Reprovado</option>
          </select>
        </CardContent>
      </Card>

      {error && (
        <div className="rounded-xl border border-amber-300 dark:border-amber-800 bg-amber-50/60 dark:bg-amber-950/30 p-3 text-xs text-amber-800 dark:text-amber-300">
          Não foi possível carregar os checklists agora. Tente atualizar a página.
        </div>
      )}

      {/* Tabela */}
      <Card className="border-slate-200 dark:border-slate-800">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-950/60 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 font-semibold">
                <tr>
                  <th className="py-3 px-4">OS</th>
                  <th className="py-3 px-4">Cliente</th>
                  <th className="py-3 px-4">Equipamento</th>
                  <th className="py-3 px-4">Tipo</th>
                  <th className="py-3 px-4">Técnico</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Veredito</th>
                  <th className="py-3 px-4 text-center">Conf.</th>
                  <th className="py-3 px-4 text-center">Última alteração</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {loading ? (
                  <tr>
                    <td colSpan={9} className="py-10 text-center text-muted-foreground">
                      Carregando…
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-10 text-center text-muted-foreground">
                      Nenhum checklist encontrado com esses filtros.
                    </td>
                  </tr>
                ) : (
                  filtered.map((r) => (
                    <tr
                      key={r.id}
                      onClick={() => navigate('/checklists/' + r.id)}
                      className="cursor-pointer hover:bg-teal-50/50 dark:hover:bg-teal-950/20 transition-colors"
                    >
                      <td className="py-3 px-4 font-mono font-bold text-teal-800 dark:text-teal-300">
                        {r.os_number || '—'}
                      </td>
                      <td className="py-3 px-4 font-semibold">{r.client_name || '—'}</td>
                      <td className="py-3 px-4">{r.equipment_tag || r.equipment_label || '—'}</td>
                      <td className="py-3 px-4">{tplNome(r.template)}</td>
                      <td className="py-3 px-4">{r.technician_name || '—'}</td>
                      <td className="py-3 px-4 text-center">{statusBadge(r.status)}</td>
                      <td className="py-3 px-4 text-center">{verdictBadge(r.verdict)}</td>
                      <td className="py-3 px-4 text-center font-bold">{r.conformity_pct}%</td>
                      <td className="py-3 px-4 text-center">{fmtDate(r.updated)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
