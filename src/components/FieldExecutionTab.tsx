import React from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ClipboardList, CheckCircle2, XCircle, AlertTriangle, Wrench } from 'lucide-react'
import {
  type ChecklistKpis,
  type ChecklistSummary,
  businessDaysSince,
} from '@/services/checklist-dashboard'

/**
 * Sub-aba "Execução em Campo" do dashboard gerencial.
 * KPIs dos checklists, OS em campo com progresso, alerta de parado,
 * economia recuperada, não conformidades em aberto e desempenho por técnico.
 */

function brl(v: number): string {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
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

export const FieldExecutionTab: React.FC<{
  kpis: ChecklistKpis
  checklists: ChecklistSummary[]
  loading: boolean
  error: boolean
}> = ({ kpis, checklists, loading, error }) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 gap-2 text-sm text-slate-500">
        <ClipboardList className="h-5 w-5 animate-pulse" /> Carregando checklists…
      </div>
    )
  }

  const abertos = checklists.filter((c) => c.status !== 'concluido')
  const concluidos = checklists.filter((c) => c.status === 'concluido')

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-xl border border-amber-300 dark:border-amber-800 bg-amber-50/60 dark:bg-amber-950/30 p-3 text-xs text-amber-800 dark:text-amber-300">
          Não foi possível carregar os checklists agora. Tente atualizar a página.
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">
              Checklists Concluídos
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center font-bold">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {kpis.concluidos}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              {kpis.abertos} aberto(s) · {kpis.total} no total
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">
              Conformidade Média
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-600 flex items-center justify-center font-bold">
              <ClipboardList className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {kpis.conformidadeMedia}%
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              {kpis.aprovados} aprovado(s) · {kpis.ressalvas} ressalvas · {kpis.reprovados}{' '}
              reprovado(s)
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">
              Economia Recuperada
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-orange-50 dark:bg-orange-950/60 text-orange-600 flex items-center justify-center font-bold">
              <Wrench className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {brl(kpis.economiaTotal)}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">R$/ano — purgadores concluídos</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">
              Alerta de Parado
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center font-bold">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {kpis.parados.length}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              checklist(s) sem alteração há +2 dias úteis
            </p>
          </CardContent>
        </Card>
      </div>

      {/* OS em campo agora (rascunhos) — agrupado por OS (multi-equipamento) */}
      <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Wrench className="h-4 w-4 text-teal-600" /> OS em campo agora
          </CardTitle>
          <CardDescription className="text-xs">
            Checklists abertos — progresso e última alteração em tempo real
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-950/60 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 font-semibold">
                <tr>
                  <th className="py-3 px-4">OS</th>
                  <th className="py-3 px-4">Cliente</th>
                  <th className="py-3 px-4">Tipo</th>
                  <th className="py-3 px-4">Técnico</th>
                  <th className="py-3 px-4 text-center">Última alteração</th>
                  <th className="py-3 px-4 text-center">Situação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {abertos.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-muted-foreground">
                      Nenhum checklist em campo agora.
                    </td>
                  </tr>
                ) : (
                  (() => {
                    // Agrupa por OS (multi-equipamento): "2/3 concluídos" + equipamentos pendentes
                    const byOs = new Map<
                      string,
                      {
                        client: string
                        tech: string
                        total: number
                        done: number
                        lastUpd: string
                        parado: boolean
                        pendentes: string[]
                      }
                    >()
                    for (const c of checklists) {
                      const osN = c.os_number || '—'
                      const g = byOs.get(osN) || {
                        client: c.client_name || '—',
                        tech: c.technician_name || '—',
                        total: 0,
                        done: 0,
                        lastUpd: '',
                        parado: false,
                        pendentes: [],
                      }
                      g.total++
                      if (c.status === 'concluido') {
                        g.done++
                      } else {
                        if (!g.lastUpd || c.updated > g.lastUpd) g.lastUpd = c.updated
                        if (kpis.parados.some((p) => p.id === c.id)) g.parado = true
                        const t =
                          c.template === 'trocador'
                            ? 'Trocador'
                            : c.template === 'valvulas'
                              ? 'Válvula'
                              : 'Purgador'
                        const tag = (c as any).equipment_tag || ''
                        const label = (c as any).equipment_label || ''
                        g.pendentes.push(tag || label || t)
                      }
                    }
                    return Array.from(byOs.entries())
                      .filter(([, g]) => g.done < g.total)
                      .map(([osN, g]) => {
                        const dias = businessDaysSince(g.lastUpd)
                        return (
                          <tr key={osN} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/40">
                            <td className="py-3 px-4 font-mono font-bold text-teal-800 dark:text-teal-300">
                              {osN}
                            </td>
                            <td className="py-3 px-4 font-semibold">{g.client}</td>
                            <td className="py-3 px-4 text-xs">{g.pendentes.join(', ') || '—'}</td>
                            <td className="py-3 px-4">{g.tech}</td>
                            <td className="py-3 px-4 text-center">{fmtDate(g.lastUpd)}</td>
                            <td className="py-3 px-4 text-center">
                              <Badge
                                className={
                                  g.parado
                                    ? 'bg-rose-600 text-white text-[10px]'
                                    : 'bg-teal-700 text-white text-[10px]'
                                }
                              >
                                {g.done}/{g.total} concluídos{g.parado ? ` · PARADO ${dias}d` : ''}
                              </Badge>
                            </td>
                          </tr>
                        )
                      })
                  })()
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Concluídos */}
      <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Checklists concluídos
          </CardTitle>
          <CardDescription className="text-xs">
            Resultado, veredito e economia recuperada por serviço
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-950/60 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 font-semibold">
                <tr>
                  <th className="py-3 px-4">OS</th>
                  <th className="py-3 px-4">Cliente</th>
                  <th className="py-3 px-4">Tipo</th>
                  <th className="py-3 px-4 text-center">Conformidade</th>
                  <th className="py-3 px-4 text-center">Veredito</th>
                  <th className="py-3 px-4 text-right">Economia (R$/ano)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {concluidos.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-muted-foreground">
                      Nenhum checklist concluído ainda.
                    </td>
                  </tr>
                ) : (
                  concluidos.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/40">
                      <td className="py-3 px-4 font-mono font-bold text-teal-800 dark:text-teal-300">
                        {c.os_number || '—'}
                      </td>
                      <td className="py-3 px-4 font-semibold">{c.client_name || '—'}</td>
                      <td className="py-3 px-4">{c.template}</td>
                      <td className="py-3 px-4 text-center font-bold">{c.conformity_pct}%</td>
                      <td className="py-3 px-4 text-center">{verdictBadge(c.verdict)}</td>
                      <td className="py-3 px-4 text-right font-bold text-orange-700 dark:text-orange-400">
                        {c.economia_ano ? brl(c.economia_ano) : '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Por técnico */}
      <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <XCircle className="h-4 w-4 text-slate-400" /> Desempenho por técnico
          </CardTitle>
          <CardDescription className="text-xs">
            Concluídos, abertos e conformidade média por responsável
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-950/60 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 font-semibold">
                <tr>
                  <th className="py-3 px-4">Técnico</th>
                  <th className="py-3 px-4 text-center">Concluídos</th>
                  <th className="py-3 px-4 text-center">Abertos</th>
                  <th className="py-3 px-4 text-center">Conformidade média</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {kpis.porTecnico.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-muted-foreground">
                      Sem dados ainda.
                    </td>
                  </tr>
                ) : (
                  kpis.porTecnico.map((t) => (
                    <tr key={t.nome} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/40">
                      <td className="py-3 px-4 font-semibold">{t.nome}</td>
                      <td className="py-3 px-4 text-center font-bold">{t.concluidos}</td>
                      <td className="py-3 px-4 text-center">{t.abertos}</td>
                      <td className="py-3 px-4 text-center font-bold">{t.conformidadeMedia}%</td>
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
