// src/components/field-visit/steam-trap-pdf.tsx
// Gera o PDF do Relatório de Inspeção de Purgadores (A4 retrato, formato compatível
// com o padrão Bermo/JBS): carta, metadados, achados, tabela completa, síntese com
// fórmula econômica, melhorias, conclusão e registro fotográfico correlacionado.
// Reutiliza loadHtml2Pdf() (mesma lib do relatório do painel) e o logo base64.

import { loadHtml2Pdf } from '@/lib/quote-pdf-generator'
import { INTERTERMAL_LOGO_BASE64 } from '@/lib/intertermal-logo'
import type { FieldVisitData, SteamTrapInspectionData } from '@/types/field-visit'

const br = (v: number, d = 2) =>
  (Number.isFinite(v) ? v : 0).toLocaleString('pt-BR', {
    minimumFractionDigits: d,
    maximumFractionDigits: d,
  })

const esc = (s: unknown) =>
  String(s ?? '').replace(
    /[&<>"]/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c] || c,
  )

const RES_CLS: Record<string, string> = {
  'Purgador ok': 'ok',
  Vazando: 'vaz',
  'Vazando direto': 'vazd',
  Represando: 'rep',
  Parado: 'par',
  'Não Avaliado': 'na',
}

interface PdfInput {
  visit: FieldVisitData
  data: SteamTrapInspectionData
  econ: { lossKgh: number; perMonth: number | null; perYear: number | null }
  badCount: number
}

export function buildTrapReportHtml({ visit, data, econ, badCount }: PdfInput): string {
  const ctx = data.context
  const total = data.traps.length
  const loss = econ.lossKgh
  const custo = ctx.steamCostBrlTon
  const horas = ctx.hoursPerYear

  const trapsRows = data.traps
    .map(
      (t, i) => `<tr>
<td>${i + 1}</td><td>${esc(t.tagAri || '—')}</td><td>${esc(t.tagClient || '—')}</td><td>${esc(t.thermoNumber || '—')}</td>
<td>${esc(t.location)}</td><td>${esc(t.area)}</td><td>${esc(t.manufacturer)}</td><td>${esc(t.model)}</td>
<td>${esc(t.dn)}</td><td>${esc(t.pressureClass)}</td><td>${esc(t.connection)}</td><td>${br(Number(t.pressureBarg) || 0)}</td>
<td><span class="res ${RES_CLS[t.result] || 'na'}">${esc(t.result)}</span></td><td>${esc(t.action)}</td>
<td>${t.lossKgh ? br(t.lossKgh) : '—'}</td></tr>`,
    )
    .join('')

  const findingsHtml = data.findings
    .map(
      (
        f,
        i,
      ) => `<div class="find ${f.severity === 'Crítica' ? 'crit' : f.severity === 'Alta' ? 'alt' : 'med'}">
<div class="fh"><span class="num">${i + 1}.</span><h5>${esc(f.title)}</h5><span class="sev ${f.severity === 'Crítica' ? 'critica' : f.severity === 'Alta' ? 'alta' : 'media'}">${esc(f.severity)}</span></div>
<p>${esc(f.description)}</p><div class="rec"><b>Recomendação:</b> ${esc(f.recommendation)}</div></div>`,
    )
    .join('')

  const improvementsHtml = data.improvements
    .map(
      (m) =>
        `<tr><td>${esc(m.title)}</td><td style="text-align:center">${m.analyzed ? '☑' : '☐'}</td><td style="text-align:center">${m.fixed ? '☑' : '☐'}</td></tr>`,
    )
    .join('')

  const photos = data.traps
    .flatMap((t) => (t.mediaIds || []).map((mid) => ({ t, mid })))
    .slice(0, 6)
  const photosHtml = photos
    .map(
      ({ t }) => `<figure><figcaption><b>Registro ${t.seq} — ${esc(t.location)}</b>
${esc(t.manufacturer)} ${esc(t.model)} · DN ${esc(t.dn)} · ${br(Number(t.pressureBarg) || 0)} barg · ${esc(t.result)}${t.lossKgh ? ` · ${br(t.lossKgh)} kg/h` : ''}</figcaption></figure>`,
    )
    .join('')

  return `<!doctype html><html><head><meta charset="utf-8"><style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Segoe UI',Helvetica,Arial,sans-serif;color:#1e293b;font-size:10.5px;line-height:1.5}
.page{width:194mm;padding:6mm 0 10mm}
.bb{height:4px;background:linear-gradient(90deg,#000030 0%,#000030 45%,#0078C0 72%,#F08020 90%)}
.hdr{display:flex;align-items:center;gap:12px;padding:7mm 0 5mm}
.hdr img{height:12mm}
h1{font-size:14px;color:#000030;line-height:1.3}
.meta{font-size:9px;color:#64748b;margin-top:2px}
h2{font-size:11px;color:#000030;text-transform:uppercase;letter-spacing:.5px;border-bottom:2px solid #0078C0;padding-bottom:3px;margin:11px 0 7px}
h2 .n{color:#F08020}
p{margin-bottom:6px;text-align:justify}
.meta-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin:8px 0}
.meta-grid .m{border:1px solid #e2e8f0;border-radius:6px;padding:6px 8px}
.meta-grid .l{font-size:7.5px;color:#64748b;text-transform:uppercase}
.meta-grid .v{font-size:10px;font-weight:650;color:#000030}
.find{border:1px solid #e2e8f0;border-left:3.5px solid #0078C0;border-radius:6px;padding:7px 10px;margin-bottom:7px}
.find.crit{border-left-color:#dc2626}.find.alt{border-left-color:#F08020}.find.med{border-left-color:#eab308}
.find .fh{display:flex;align-items:baseline;gap:8px}
.find .num{font-weight:800;color:#0078C0}
.find h5{font-size:10.5px;flex:1}
.find .sev{font-size:7.5px;font-weight:750;text-transform:uppercase;padding:2px 7px;border-radius:4px}
.sev.critica{background:#fee2e2;color:#dc2626}.sev.alta{background:#ffedd5;color:#ea580c}.sev.media{background:#fef9c3;color:#a16207}
.find p{font-size:9.5px;margin:3px 0 0;color:#334155}
.find .rec{font-size:9px;color:#166534;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:5px;padding:4px 8px;margin-top:4px}
table.insp{width:100%;border-collapse:collapse;font-size:7.4px}
table.insp th{background:#000030;color:#fff;font-size:6.3px;text-transform:uppercase;padding:3px 3px;text-align:left}
table.insp td{padding:2.2px 3px;border-bottom:1px solid #e2e8f0;white-space:nowrap;color:#334155}
table.insp tr:nth-child(even) td{background:#f8fafc}
.res{font-size:7px;font-weight:650;padding:1px 5px;border-radius:3px}
.res.ok{background:#dcfce7;color:#16a34a}.res.vaz{background:#fee2e2;color:#dc2626}
.res.vazd{background:#fecaca;color:#b91c1c;font-weight:750}.res.rep{background:#ffedd5;color:#ea580c}
.res.par{background:#e2e8f0;color:#475569}.res.na{background:#f1f5f9;color:#64748b}
.kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:7px;margin:7px 0}
.kpi{border:1px solid #e2e8f0;border-top:3px solid #0078C0;border-radius:6px;padding:7px 9px}
.kpi.warn{border-top-color:#dc2626}.kpi.money{border-top-color:#F08020}
.kpi .v{font-size:14px;font-weight:800;color:#000030}
.kpi.warn .v{color:#dc2626}.kpi.money .v{color:#ea580c}
.kpi .l{font-size:7.5px;color:#64748b;text-transform:uppercase;margin-top:2px}
.econ{border:1.5px solid #F08020;background:#fff7ed;border-radius:8px;padding:10px 12px;margin-top:8px}
.econ h6{font-size:9.5px;color:#9a3412;text-transform:uppercase;margin-bottom:4px}
.econ .f{font-size:9.5px;color:#7c2d12;background:#fff;border:1px solid #fed7aa;border-radius:5px;padding:5px 8px;font-family:Consolas,monospace}
.econ .obs{font-size:8px;color:#9a3412;margin-top:6px}
table.mel{width:100%;border-collapse:collapse;font-size:9px;margin-top:3px}
table.mel th{background:#000030;color:#fff;padding:4px 8px;font-size:7.5px;text-transform:uppercase;text-align:left}
table.mel td{padding:5px 8px;border-bottom:1px solid #e2e8f0;color:#334155}
.concl{background:#f1f5f9;border-left:3.5px solid #000030;border-radius:0 6px 6px 0;padding:8px 11px;font-size:9.5px}
.sig2{display:grid;grid-template-columns:1fr 1fr;gap:24mm;margin-top:12mm}
.sig2 .s{text-align:center;font-size:9px}
.sig2 .s .ln{border-top:1px solid #334155;padding-top:4px;margin-top:12mm}
.sig2 .s b{display:block;font-size:9.5px}
.fotos{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:4px}
.fotos figure{border:1px solid #e2e8f0;border-radius:6px;padding:6px;font-size:8px;color:#475569}
.fotos figcaption b{color:#0f172a;display:block;margin-bottom:2px}
.tnote{font-size:8px;color:#64748b;margin-top:4px}
</style></head><body><div class="page">
<div class="bb"></div>
<div class="hdr"><img src="${INTERTERMAL_LOGO_BASE64}" alt="Intertermal">
<div style="margin-left:auto;text-align:right"><h1>Relatório de Inspeção<br>Sistema de Vapor e Condensado</h1>
<div class="meta">Rev. 00 · ${esc(ctx.inspectionDate)} · ${esc(visit.companyName)}${ctx.unit ? ' — ' + esc(ctx.unit) : ''}</div></div></div>

<div class="meta-grid">
<div class="m"><div class="l">Cliente</div><div class="v">${esc(visit.companyName)}</div></div>
<div class="m"><div class="l">Unidade</div><div class="v">${esc(ctx.unit)}</div></div>
<div class="m"><div class="l">Data da inspeção</div><div class="v">${esc(ctx.inspectionDate)}</div></div>
<div class="m"><div class="l">Responsável técnico</div><div class="v">${esc(ctx.responsible)}</div></div>
<div class="m"><div class="l">Acompanhante</div><div class="v">${esc(ctx.companion)}</div></div>
<div class="m"><div class="l">Equipamento de teste</div><div class="v">${esc(ctx.testEquipment)}</div></div>
</div>

<p>Prezado Cliente ${esc(visit.companyName)},</p>
<p>Em função das visitas realizadas para avaliar as instalações, apresentamos o relatório com os pontos identificados de <b>não conformidades e oportunidades</b> para propor melhorias no sistema de vapor e condensado.</p>

<h2><span class="n">1.</span> Achados identificados</h2>
${findingsHtml || '<p class="tnote">Nenhum achado registrado.</p>'}

<h2><span class="n">2.</span> Inspeção de purgadores</h2>
<table class="insp"><thead><tr><th>#</th><th>Tag ARI</th><th>Tag cliente</th><th>Termog.</th><th>Local</th><th>Área</th><th>Fabricante</th><th>Modelo</th><th>DN</th><th>Classe</th><th>Conex.</th><th>barg</th><th>Resultado</th><th>Ação</th><th>kg/h</th></tr></thead>
<tbody>${trapsRows}</tbody></table>

<h2><span class="n">3.</span> Resultado — síntese</h2>
<div class="kpis">
<div class="kpi"><div class="v">${total}</div><div class="l">Purgadores analisados</div></div>
<div class="kpi warn"><div class="v">${badCount} (${total ? Math.round((badCount / total) * 100) : 0}%)</div><div class="l">Com problema</div></div>
<div class="kpi money"><div class="v">${br(loss)} kg/h</div><div class="l">Perda de vapor vivo</div></div>
<div class="kpi money"><div class="v">${econ.perYear != null ? 'R$ ' + br(econ.perYear, 0) : '—'}</div><div class="l">Perda estimada / ano</div></div>
</div>
<div class="econ">
<h6>Bloco econômico — calculado automaticamente pelo CRM</h6>
<div class="f">Σ perdas ${br(loss)} kg/h × ${horas} h/ano × R$ ${br(custo || 0)}/t ÷ 1.000 = ${econ.perYear != null ? 'R$ ' + br(econ.perYear) + '/ano' : 'informe o custo do vapor'}</div>
<div class="obs">${custo != null ? `Custo do vapor R$ ${br(custo)}/t e base de ${horas} h/ano (configuráveis no CRM).` : 'Custo do vapor não informado — bloco econômico em kg/h.'}</div>
</div>

<h2><span class="n">4.</span> Pontos de melhoria — acompanhamento</h2>
<table class="mel"><thead><tr><th>Ponto de melhoria</th><th style="width:20mm;text-align:center">Analisado</th><th style="width:20mm;text-align:center">Corrigido</th></tr></thead>
<tbody>${improvementsHtml || '<tr><td colspan="3">Nenhum ponto registrado.</td></tr>'}</tbody></table>

<h2><span class="n">5.</span> Conclusão</h2>
<div class="concl">${esc(data.conclusion) || '—'}</div>

<div class="sig2">
<div class="s"><div class="ln"><b>${esc(data.signatures[0]?.name || ctx.responsible)}</b>${esc(data.signatures[0]?.role || 'Responsável técnico')}</div></div>
<div class="s"><div class="ln"><b>${esc(data.signatures[1]?.name || 'Intertermal')}</b>${esc(data.signatures[1]?.role || 'Parceiro Autorizado Bermo')}</div></div>
</div>

${
  photos.length
    ? `<h2><span class="n">6.</span> Registro fotográfico — correlacionado aos registros</h2>
<div class="fotos">${photosHtml}</div>
<p class="tnote">Galeria completa de fotos e vídeos disponível na visita no CRM.</p>`
    : ''
}

</div></body></html>`
}

/** Compila o HTML em PDF A4 (download direto, mesma engine do relatório do painel). */
export async function generateTrapPdfBlob(html: string): Promise<Blob> {
  const holder = document.createElement('div')
  holder.style.position = 'fixed'
  holder.style.left = '0'
  holder.style.top = '0'
  holder.style.zIndex = '-9999'
  holder.style.background = '#ffffff'
  holder.innerHTML = html
  document.body.appendChild(holder)
  try {
    const target = holder.querySelector('.page') as HTMLElement
    const html2pdf = await loadHtml2Pdf()
    if (!html2pdf) throw new Error('Gerador de PDF indisponível')
    const worker = html2pdf()
      .set({
        margin: [8, 8, 10, 8],
        filename: 'inspecao-purgadores.pdf',
        image: { type: 'jpeg', quality: 0.95 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          logging: false,
          scrollX: 0,
          scrollY: 0,
          backgroundColor: '#ffffff',
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['css', 'legacy'] },
      })
      .from(target)
      .toPdf()
    return (await worker.output('blob')) as Blob
  } finally {
    document.body.removeChild(holder)
  }
}
