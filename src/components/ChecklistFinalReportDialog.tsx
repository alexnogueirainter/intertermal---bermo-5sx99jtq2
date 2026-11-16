import React, { useMemo, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Eye, Printer, Loader2, X } from 'lucide-react'
import { CHECKLIST_TEMPLATES } from '@/data/checklist-templates'
import pb from '@/lib/pocketbase/client'

/**
 * Relatório Final do Checklist — prévia na tela e impressão/PDF.
 * Layout no padrão do modelo de referência (Dryko 26002): capa navy com ano,
 * seções 1-8, fotos por etapa com marca d'água, medida de aperto em destaque,
 * equipamento liberado, conclusão com veredito e assinaturas.
 * Logo oficial Intertermal (paleta navy #000031 / azul #007DC5 / laranja #F58220).
 */

const LOGO_URL = '/logo-intertermal.svg'
const VERDICT_STYLE: Record<string, { bg: string; label: string }> = {
  aprovado: { bg: '#16a34a', label: 'APROVADO' },
  ressalvas: { bg: '#f59e0b', label: 'APROVADO COM RESSALVAS' },
  reprovado: { bg: '#dc2626', label: 'REPROVADO' },
}

// Rótulos de foto por etapa (padrão do modelo de referência)
const FOTO_ETAPA_LABEL: Record<string, Record<number, string>> = {
  trocador: {
    1: '01. Placa de identificação e estado inicial',
    2: '02. Inspeção externa e gaxetas',
    3: '03. Desmontagem e retirada das placas',
    4: '04. Limpeza e inspeção das placas',
    5: '05. Montagem e aperto do trocador',
    6: '06. Teste hidrostático e equipamento liberado',
  },
  valvulas: {
    1: '01. Plaqueta e estado inicial',
    2: '02. Inspeção externa',
    3: '03. Desmontagem',
    4: '04. Limpeza e inspeção interna',
    5: '05. Montagem e ajuste',
    6: '06. Provas e equipamento liberado',
  },
  purgadores: {
    1: '01. Diagnóstico de origem',
    2: '02. Serviço executado',
    3: '03. Teste final',
    4: '04. Conclusão',
    5: '05. Registro adicional',
  },
}

export const ChecklistFinalReportDialog: React.FC<{
  open: boolean
  onOpenChange: (open: boolean) => void
  checklistId: string
}> = ({ open, onOpenChange, checklistId }) => {
  const [detail, setDetail] = React.useState<ChecklistDetailData | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [generating, setGenerating] = React.useState(false)
  const printableRef = React.useRef<HTMLDivElement | null>(null)

  React.useEffect(() => {
    if (!open || !checklistId) return
    let isMounted = true
    setLoading(true)
    setDetail(null)
    ;(async () => {
      try {
        const res = (await pb.send(
          '/backend/v1/checklists/detail?id=' + encodeURIComponent(checklistId),
          { method: 'GET' },
        )) as any
        if (isMounted && res?.ok) setDetail(res.checklist)
      } catch (_) {
        // erro silencioso: prévia mostra vazio
      } finally {
        if (isMounted) setLoading(false)
      }
    })()
    return () => {
      isMounted = false
    }
  }, [open, checklistId])

  const tpl =
    CHECKLIST_TEMPLATES[(detail?.template as any) || 'trocador'] || CHECKLIST_TEMPLATES.trocador

  const fotosPorEtapa = useMemo(() => {
    const map: Record<number, any[]> = {}
    for (const m of detail?.media || []) {
      if (!m.selecionada) continue
      map[m.etapa] = map[m.etapa] || []
      map[m.etapa].push(m)
    }
    return map
  }, [detail])

  const handlePrint = async () => {
    if (!printableRef.current) return
    setGenerating(true)
    try {
      const html = printableRef.current.innerHTML
      const win = window.open('', '_blank')
      if (win) {
        win.document.write(
          '<html><head><title>Relatório Técnico — ' +
            (detail?.os_number || '') +
            '</title>' +
            '<style>' +
            REPORT_CSS +
            '</style></head><body>' +
            html +
            '</body></html>',
        )
        win.document.close()
        setTimeout(() => {
          win.focus()
          win.print()
        }, 400)
      }
    } finally {
      setGenerating(false)
    }
  }

  const v = VERDICT_STYLE[detail?.verdict || ''] || { bg: '#64748b', label: 'PENDENTE' }
  const medidaApo = detail?.ident?.medFim ? String(detail.ident.medFim) : ''

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[92vh] overflow-hidden flex flex-col">
        <DialogHeader className="pb-2">
          <DialogTitle className="flex items-center gap-2 text-base">
            <Eye className="h-4 w-4 text-teal-600" />
            Relatório Final — OS {detail?.os_number || '…'}{' '}
            {detail?.equipment_tag ? `· ${detail.equipment_tag}` : ''}
          </DialogTitle>
        </DialogHeader>
        <div className="flex items-center gap-2 pb-2">
          <Button
            type="button"
            size="sm"
            onClick={handlePrint}
            disabled={generating || !detail}
            className="bg-teal-700 hover:bg-teal-600 text-white text-xs h-8"
          >
            {generating ? (
              <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
            ) : (
              <Printer className="h-3.5 w-3.5 mr-1" />
            )}
            Imprimir / Salvar PDF
          </Button>
          <span className="text-[11px] text-muted-foreground">
            Prévia no padrão do relatório técnico oficial
          </span>
        </div>
        <div className="flex-1 overflow-y-auto bg-slate-100 dark:bg-slate-950/50 p-4">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-sm text-slate-500">
              <Loader2 className="h-5 w-5 animate-spin mr-2" /> Carregando relatório…
            </div>
          ) : detail ? (
            <div
              ref={printableRef}
              dangerouslySetInnerHTML={{
                __html: buildReportHtml(detail, tpl, fotosPorEtapa, v, medidaApo),
              }}
            />
          ) : (
            <div className="py-16 text-center text-sm text-muted-foreground">
              Checklist não encontrado.
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

interface ChecklistDetailData {
  id: string
  service_order_id: string
  os_number: string
  template: string
  client_name: string
  technician_name: string
  equipment_tag: string
  equipment_label: string
  status: string
  conformity_pct: number
  verdict: string
  completed_at: string
  created: string
  updated: string
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

function fmtDate(iso?: string): string {
  if (!iso) return '—'
  const d = new Date(String(iso).replace(' ', 'T'))
  if (isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('pt-BR')
}

function fmtDateTime(iso?: string): string {
  if (!iso) return '—'
  const d = new Date(String(iso).replace(' ', 'T'))
  if (isNaN(d.getTime())) return '—'
  return (
    d.toLocaleDateString('pt-BR') +
    ' ' +
    d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  )
}

const REPORT_CSS = `
  .rf-page { width:210mm; min-height:297mm; margin:10px auto; background:#fff; box-shadow:0 2px 8px rgba(0,0,0,.15); position:relative; }
  .rf-inner { padding:14mm 16mm; }
  .rf-cover { display:flex; min-height:297mm; }
  .rf-cover-left { flex:1; padding:20mm; display:flex; flex-direction:column; }
  .rf-cover-right { width:70mm; background:#0D193E; color:#fff; display:flex; align-items:center; justify-content:center; }
  .rf-year { font-size:64px; font-weight:800; letter-spacing:2px; }
  .rf-banner { background:#0D193E; color:#fff; font-size:26px; font-weight:800; letter-spacing:2px; padding:10px 18px; margin:24mm 0 14mm; text-transform:uppercase; display:inline-block; }
  .rf-field { font-size:15px; font-weight:700; color:#0D193E; margin-bottom:6mm; text-transform:uppercase; letter-spacing:.5px; }
  .rf-field small { display:block; font-size:10px; color:#64748b; font-weight:400; letter-spacing:1px; text-transform:uppercase; margin-bottom:2px; }
  .rf-head { display:flex; justify-content:space-between; align-items:center; border-bottom:2px solid #0D193E; padding-bottom:6px; margin-bottom:10px; }
  .rf-head-title { font-size:13px; font-weight:800; letter-spacing:2px; color:#0D193E; text-transform:uppercase; }
  .rf-meta { display:flex; justify-content:space-between; font-size:9px; color:#64748b; border-bottom:1px solid #e2e8f0; padding-bottom:5px; margin-bottom:12px; }
  .rf-client { font-weight:800; color:#0D193E; font-size:11px; letter-spacing:1px; }
  .rf-h2 { font-size:13px; font-weight:800; color:#0D193E; text-transform:uppercase; letter-spacing:1px; margin:12px 0 6px; border-left:4px solid #F08020; padding-left:8px; }
  .rf-p, .rf-li { font-size:10.5px; line-height:1.6; color:#334155; }
  .rf-ul { padding-left:16px; margin-bottom:6px; }
  .rf-kv { display:grid; grid-template-columns:1fr 1fr; gap:4px 16px; margin:6px 0 10px; }
  .rf-kv div { font-size:10.5px; color:#334155; }
  .rf-box { background:#f8fafc; border:1px solid #e2e8f0; border-radius:6px; padding:8px 10px; margin:6px 0; font-size:10.5px; color:#1e293b; white-space:pre-wrap; }
  .rf-obs { background:#fff7ed; border:1px solid #fdba74; border-radius:6px; padding:8px 10px; margin:6px 0; font-weight:700; color:#9a3412; font-size:12px; }
  .rf-photos { display:grid; grid-template-columns:1fr 1fr; gap:8px; margin:8px 0; }
  .rf-photo { border:1px solid #e2e8f0; border-radius:4px; overflow:hidden; }
  .rf-photo-full { grid-column:1 / -1; }
  .rf-photo-img { width:100%; height:52mm; background:#e2e8f0; }
  .rf-photo-full .rf-photo-img { height:72mm; }
  .rf-photo-img img { width:100%; height:100%; object-fit:cover; }
  .rf-photo-cap { text-align:center; font-size:9.5px; font-weight:600; color:#334155; padding:5px; background:#f8fafc; border-top:1px solid #e2e8f0; }
  .rf-verdict { display:inline-block; padding:6px 16px; border-radius:6px; color:#fff; font-weight:800; font-size:12px; letter-spacing:1px; }
  .rf-parts { width:100%; border-collapse:collapse; font-size:10px; margin:6px 0; }
  .rf-parts th { background:#f1f5f9; color:#334155; font-size:9px; text-transform:uppercase; border-bottom:1px solid #e2e8f0; padding:5px 7px; text-align:left; }
  .rf-parts td { padding:5px 7px; border-bottom:1px solid #f1f5f9; }
  .rf-nc { border:1px solid #fecaca; background:#fef2f2; border-radius:6px; padding:6px 10px; margin:4px 0; font-size:10.5px; }
  .rf-sign { display:grid; grid-template-columns:1fr 1fr; gap:30mm; margin-top:14mm; }
  .rf-sig-line { border-bottom:1px solid #475569; height:16mm; display:flex; align-items:flex-end; justify-content:center; font-size:10px; font-weight:600; }
  .rf-sig-label { text-align:center; font-size:9px; color:#475569; margin-top:3px; }
  .rf-foot { margin-top:10mm; border-top:1px solid #e2e8f0; padding-top:5px; display:flex; justify-content:space-between; align-items:center; font-size:8.5px; color:#64748b; }
  @media print { .rf-page { box-shadow:none; margin:0; } }
`

function buildReportHtml(
  d: ChecklistDetailData,
  tpl: any,
  fotosPorEtapa: Record<number, any[]>,
  verdict: { bg: string; label: string },
  medidaApo: string,
): string {
  const logo = LOGO_URL
  const fotoLabel = FOTO_ETAPA_LABEL[d.template] || FOTO_ETAPA_LABEL.trocador
  const cliente = d.client_name || '—'
  const headMeta = (pg: number) =>
    `<div class="rf-meta"><span>DOCUMENTO TÉCNICO · PÁGINA ${pg}/N</span><span class="rf-client">${cliente.toUpperCase()}</span></div>`
  const foot = `<div class="rf-foot"><span style="display:flex;align-items:center;gap:6px;"><img src="${logo}" style="width:22mm;height:auto;"> <span>R. Ananias Pires do Amaral, 98 — Sorocaba/SP · (11) 99407-7786 / (15) 3228-3956 · alex.nogueira@intertermal.com.br</span></span><span>OS #${d.os_number}</span></div>`

  // Capa
  const cover = `
    <div class="rf-page"><div class="rf-cover"><div class="rf-cover-left">
      <img src="${logo}" style="width:64mm;height:auto;">
      <div class="rf-banner">Relatório Técnico</div>
      <div class="rf-field"><small>Equipamento</small>${tpl.nome}</div>
      <div class="rf-field"><small>Número de fabricação</small>${d.ident?.numFabricacao || '—'}</div>
      <div class="rf-field"><small>Modelo</small>${d.ident?.modelo || d.equipment_tag || '—'}</div>
      <div class="rf-field"><small>Tag</small>${d.equipment_tag || d.equipment_label || '—'}</div>
      <div class="rf-field"><small>Ordem de Serviço</small>${d.os_number}</div>
    </div><div class="rf-cover-right"><div class="rf-year">${new Date().getFullYear()}</div></div></div></div>`

  // Seções 1-5 (texto do técnico)
  const kv = `<div class="rf-kv">
      <div><b>Relatório:</b> Checklist OS ${d.os_number}${d.equipment_tag ? ' · ' + d.equipment_tag : ''}</div>
      <div><b>Data do início:</b> ${fmtDateTime(d.created)}</div>
      <div><b>Cliente:</b> ${cliente}</div>
      <div><b>Data do término:</b> ${fmtDateTime(d.completed_at)}</div>
      <div><b>Endereço:</b> ${d.ident?.endereco || '—'}</div>
      <div><b>Técnico responsável:</b> ${d.technician_name || '—'}</div>
    </div>`
  const sec = (n: number, title: string, body: string) =>
    `<div class="rf-h2">${n}. ${title}</div>${body}`
  const box = (t?: string) => (t ? `<div class="rf-box">${t}</div>` : '<div class="rf-box">—</div>')

  const secoes = `
    <div class="rf-page"><div class="rf-inner">
      <div class="rf-head"><img src="${logo}" style="width:38mm;height:auto;"><div class="rf-head-title">Relatório Técnico</div></div>
      ${headMeta(2)}
      ${kv}
      ${sec(1, 'Atividade', `<p class="rf-p"><b>Relatório de Manutenção — ${tpl.nome}${d.equipment_tag ? ' (TAG ' + d.equipment_tag + ')' : ''}</b></p>`)}
      ${sec(2, 'Estado Inicial do Equipamento', box(d.texts?.estadoInicial))}
      ${sec(3, 'Procedimentos Realizados e Análise Técnica', box(d.texts?.procedimentos))}
      ${sec(4, 'Montagem e Aperto do Equipamento', (d.texts?.montagem ? box(d.texts.montagem) : '') + (medidaApo ? `<div class="rf-obs">OBS. MEDIDA DE APERTO DO EQUIPAMENTO = ${medidaApo} MILÍMETROS</div>` : ''))}
      ${sec(
        5,
        'Ensaio de Pressão (Teste Hidrostático)',
        `<div class="rf-kv">
        <div><b>Pressão de teste:</b> ${d.ident?.pressaoTeste || '—'} bar</div>
        <div><b>Tempo de duração:</b> ${d.ident?.tempoTeste || '—'} min</div>
        <div><b>Escopo do teste:</b> aplicado em ambos os lados</div>
        <div><b>Resultado:</b> ${d.texts?.ensaio || '—'}</div>
      </div>`,
      )}
      ${foot}
    </div></div>`

  // Fotos por etapa (IMAGEM NN — rótulo da etapa)
  let imgNum = 0
  let fotoHtml = ''
  let pg = 3
  for (const et of tpl.etapas) {
    const fotos = fotosPorEtapa[et.n] || []
    if (fotos.length === 0) continue
    fotoHtml += `<div class="rf-h2">Registro Fotográfico — Etapa ${et.n} · ${et.nome}</div><div class="rf-photos">`
    for (const f of fotos) {
      imgNum++
      fotoHtml += `<div class="rf-photo"><div class="rf-photo-img"><img src="${f.path}" crossorigin="anonymous"></div><div class="rf-photo-cap">IMAGEM ${String(imgNum).padStart(2, '0')} — ${fotoLabel[et.n] || et.nome}${f.legenda ? ' · ' + f.legenda : ''}</div></div>`
    }
    fotoHtml += '</div>'
  }

  const fotosPage = fotoHtml
    ? `<div class="rf-page"><div class="rf-inner">
        <div class="rf-head"><img src="${logo}" style="width:38mm;height:auto;"><div class="rf-head-title">Relatório Técnico</div></div>
        ${headMeta(pg)}
        ${fotoHtml}
        ${foot}
      </div></div>`
    : ''

  // Não conformidades
  const ncs = (d.answers ? Object.entries(d.answers) : [])
    .filter(([, a]: any) => a?.status === 'nok')
    .map(([num, a]: any) => {
      const it = tpl.itens.find((i: any) => String(i.num) === String(num))
      return `<div class="rf-nc"><b>Item ${num}</b> — ${it ? it.titulo : ''}${a?.obs ? ` <i>Obs: ${a.obs}</i>` : ''}</div>`
    })
    .join('')

  // Peças
  const partsRows = (d.parts || [])
    .map(
      (p, i) =>
        `<tr><td>${p.description}</td><td style="text-align:center;font-weight:700;">${p.quantity}</td><td style="text-align:center;">${p.unit || 'un'}</td><td style="text-align:right;">${p.unit_cost && Number(p.unit_cost) > 0 ? Number(p.unit_cost).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '<span style="color:#b45309;">sem custo</span>'}</td></tr>`,
    )
    .join('')
  const partsTable = (d.parts || []).length
    ? `<table class="rf-parts"><thead><tr><th>Descrição</th><th style="width:14mm;text-align:center;">Qtd</th><th style="width:12mm;text-align:center;">Un</th><th style="width:24mm;text-align:right;">Custo (R$)</th></tr></thead><tbody>${partsRows}</tbody></table>`
    : '<p class="rf-p">Nenhuma peça registrada.</p>'

  // Final: NCs + peças + conclusão + assinaturas
  const finalPage = `
    <div class="rf-page"><div class="rf-inner">
      <div class="rf-head"><img src="${logo}" style="width:38mm;height:auto;"><div class="rf-head-title">Relatório Técnico</div></div>
      ${headMeta(pg + 1)}
      ${ncs ? sec(6, 'Não Conformidades Registradas', ncs) : ''}
      ${sec(7, 'Insumos e Peças Utilizadas', partsTable)}
      ${sec(
        8,
        'Conclusão',
        `<div class="rf-verdict" style="background:${verdict.bg};">${verdict.label} — CONFORMIDADE ${d.conformity_pct}%</div>
        <p class="rf-p" style="margin-top:8px;">${d.texts?.conclusao || 'Equipamento avaliado conforme checklist de campo.'}</p>`,
      )}
      ${sec(9, 'Recomendações e Plano de Ação', box(d.texts?.recomendacoes))}
      <div class="rf-sign">
        <div><div class="rf-sig-line"><span>${d.technician_name || '—'}</span></div><div class="rf-sig-label">Técnico Responsável INTERTERMAL / BERMO</div></div>
        <div><div class="rf-sig-line"><span>&nbsp;</span></div><div class="rf-sig-label">Acompanhamento / Validação do Cliente</div></div>
      </div>
      ${foot}
    </div></div>`

  return `<style>${REPORT_CSS}</style>${cover}${secoes}${fotosPage}${finalPage}`
}
