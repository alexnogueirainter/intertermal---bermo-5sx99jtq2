import type { ReportData } from '@/components/ExecutiveReportPrint'
import { loadHtml2Pdf } from '@/lib/quote-pdf-generator'
import { resolveServiceOrderLiveValue } from '@/lib/service-order-live-value'
import { INTERTERMAL_LOGO_BASE64 } from '@/lib/intertermal-logo'
import type { QuoteRecord, ServiceOrderRecord } from '@/types/crm'

/**
 * Geração do arquivo PDF do relatório executivo do painel, para DOWNLOAD DIRETO
 * (html2pdf.js), sem abrir a janela de impressão do navegador. Máximo de 2 páginas:
 * 1. Visão operacional · 2. Relatório de conversão · 3. Rentabilidade & margem real.
 * Usa os mesmos números do painel para o período selecionado.
 */

const APPROVED_SET = new Set(['approved', 'aprovada', 'aprovado'])
const REJECTED_SET = new Set(['rejected', 'recusada', 'recusado', 'rejeitada', 'rejeitado'])

const esc = (s: unknown) =>
  String(s ?? '').replace(
    /[&<>"]/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c] || c,
  )

const money = (n: number) =>
  (Number.isFinite(n) ? n : 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  })

const pct = (n: number) =>
  `${(Number.isFinite(n) ? n : 0).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`

const quoteValue = (q: QuoteRecord) => {
  for (const raw of [q.total, q.final_price, q.subtotal, q.total_cost]) {
    const n = Number(raw)
    if (Number.isFinite(n) && n > 0) return n
  }
  return 0
}

function conversionData(quotes: QuoteRecord[]) {
  const approved = quotes.filter((q) =>
    APPROVED_SET.has(
      String(q.status || '')
        .toLowerCase()
        .trim(),
    ),
  )
  const rejected = quotes.filter((q) =>
    REJECTED_SET.has(
      String(q.status || '')
        .toLowerCase()
        .trim(),
    ),
  )
  const pending = quotes.filter((q) => {
    const s = String(q.status || '')
      .toLowerCase()
      .trim()
    return !APPROVED_SET.has(s) && !REJECTED_SET.has(s)
  })
  const sum = (list: QuoteRecord[]) => list.reduce((acc, q) => acc + quoteValue(q), 0)
  const byClient = new Map<
    string,
    {
      name: string
      issued: number
      approved: number
      rejected: number
      pending: number
      approvedValue: number
      totalValue: number
    }
  >()
  for (const q of quotes) {
    const key = q.client_id || q.client_name || 'outros'
    const row = byClient.get(key) || {
      name: q.client_name || 'Cliente Não Identificado',
      issued: 0,
      approved: 0,
      rejected: 0,
      pending: 0,
      approvedValue: 0,
      totalValue: 0,
    }
    row.issued += 1
    row.totalValue += quoteValue(q)
    const s = String(q.status || '')
      .toLowerCase()
      .trim()
    if (APPROVED_SET.has(s)) {
      row.approved += 1
      row.approvedValue += quoteValue(q)
    } else if (REJECTED_SET.has(s)) {
      row.rejected += 1
    } else {
      row.pending += 1
    }
    byClient.set(key, row)
  }
  const total = quotes.length
  return {
    total,
    approved: approved.length,
    rejected: rejected.length,
    pending: pending.length,
    approvedValue: sum(approved),
    rejectedValue: sum(rejected),
    pendingValue: sum(pending),
    totalValue: sum(quotes),
    approvalRate: total > 0 ? (approved.length / total) * 100 : 0,
    rejectionRate: total > 0 ? (rejected.length / total) * 100 : 0,
    pendingRate: total > 0 ? (pending.length / total) * 100 : 0,
    clients: Array.from(byClient.values())
      .sort((a, b) => b.approvedValue - a.approvedValue || b.issued - a.issued)
      .slice(0, 8),
  }
}

function profitabilityData(serviceOrders: ServiceOrderRecord[], quotes: QuoteRecord[]) {
  const items = [
    ...serviceOrders.map((so) => {
      const finalPrice = resolveServiceOrderLiveValue(so, quotes)
      const internalCost =
        Number(so.internal_cost) ||
        (so.technical_details?.service_composition?.directCostsTotal
          ? Number(so.technical_details.service_composition.directCostsTotal)
          : 0)
      return {
        title: so.title || so.order_number || 'OS',
        client: so.client_name || 'Cliente Industrial',
        finalPrice,
        internalCost,
        hasCost: internalCost > 0,
        realMargin:
          internalCost > 0 && finalPrice > 0 ? ((finalPrice - internalCost) / finalPrice) * 100 : 0,
      }
    }),
    ...quotes
      .filter(
        (q) =>
          APPROVED_SET.has(
            String(q.status || '')
              .toLowerCase()
              .trim(),
          ) &&
          !serviceOrders.some((so) => so.quote_id === q.id || so.order_number === q.quote_number),
      )
      .map((q) => {
        const finalPrice = quoteValue(q)
        const internalCost =
          Number(q.service_details?.service_composition?.directCostsTotal) ||
          (Number(q.total_cost) > 0 ? Number(q.total_cost) : 0)
        return {
          title: q.title || q.quote_number || 'Proposta',
          client: q.client_name || 'Cliente Industrial',
          finalPrice,
          internalCost,
          hasCost: internalCost > 0,
          realMargin:
            internalCost > 0 && finalPrice > 0
              ? ((finalPrice - internalCost) / finalPrice) * 100
              : 0,
        }
      }),
  ]
  const totalRevenue = items.reduce((acc, it) => acc + it.finalPrice, 0)
  const withCost = items.filter((it) => it.hasCost)
  const totalCost = withCost.reduce((acc, it) => acc + it.internalCost, 0)
  const totalProfit = withCost.reduce((acc, it) => acc + (it.finalPrice - it.internalCost), 0)
  const costRevenue = withCost.reduce((acc, it) => acc + it.finalPrice, 0)
  return {
    count: items.length,
    totalRevenue,
    totalCost,
    totalProfit,
    averageMargin: costRevenue > 0 ? (totalProfit / costRevenue) * 100 : 0,
    costCoverage: totalRevenue > 0 ? Math.round((withCost.length / items.length) * 100) : 0,
    withoutCost: items.length - withCost.length,
    top: [...items].sort((a, b) => b.realMargin - a.realMargin).slice(0, 5),
  }
}

function kpi(label: string, value: string, note: string) {
  return `<div class="kpi"><div class="kpi-label">${esc(label)}</div><div class="kpi-value">${esc(value)}</div><div class="kpi-note">${esc(note)}</div></div>`
}

function reportHtml(
  d: ReportData,
  conv: ReturnType<typeof conversionData>,
  rent: ReturnType<typeof profitabilityData>,
) {
  const generated = d.generated.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
  const osRows = d.operations.statuses
    .slice(0, 5)
    .map(
      (r) =>
        `<tr><td>${esc(r.label)}</td><td class="num">${r.count}</td><td class="num">${money(r.value)}</td></tr>`,
    )
    .join('')
  const stageRows = d.pipeline.stages
    .slice(0, 6)
    .map(
      (r) =>
        `<tr><td>${esc(r.label)}</td><td class="num">${r.count}</td><td class="num">${money(r.value)}</td></tr>`,
    )
    .join('')
  const clientRows = conv.clients
    .map(
      (c) =>
        `<tr><td>${esc(c.name)}</td><td class="num">${c.issued}</td><td class="num">${c.approved}</td><td class="num">${c.rejected}</td><td class="num">${c.pending}</td><td class="num">${money(c.approvedValue)}</td><td class="num">${money(c.totalValue)}</td></tr>`,
    )
    .join('')
  const rentRows = rent.top
    .map(
      (it) =>
        `<tr><td>${esc(it.title)}</td><td>${esc(it.client)}</td><td class="num">${money(it.finalPrice)}</td><td class="num">${it.hasCost ? pct(it.realMargin) : 'Sem custo'}</td></tr>`,
    )
    .join('')
  const alerts = d.actions
    .slice(0, 4)
    .map((a) => `<li>${esc(a)}</li>`)
    .join('')
  return `
  <div class="page">
    <header class="rep-header">
      <img class="rep-logo" src="data:image/jpeg;base64,${INTERTERMAL_LOGO_BASE64}" alt="Intertermal" />
      <div class="rep-header-meta">
        <div><span class="rep-meta-label">Período:</span> ${esc(d.period)}</div>
        <div><span class="rep-meta-label">Gerado em:</span> ${esc(generated)}</div>
      </div>
    </header>
    <div class="rep-title">Relatório Executivo — Painel</div>

    <section class="rep-section">
      <h2>1. Visão operacional</h2>
      <div class="kpi-grid">
        ${kpi('Propostas no período', String(d.proposals.total), `Aprovadas ${d.proposals.approved} · Em aberto ${d.proposals.pending} · Recusadas ${d.proposals.rejected}`)}
        ${kpi('Valor aprovado', money(d.proposals.approvedValue), 'Não é recebido')}
        ${kpi('Pipeline em aberto', money(d.pipeline.value), `${d.pipeline.deals.length} oportunidade(s)`)}
        ${kpi('OS ativas', String(d.operations.active.length), `${money(d.operations.value)} em valor de OS`)}
        ${kpi('Visitas no período', d.visits.count === null ? '—' : String(d.visits.count), 'Registros de visita a campo')}
        ${kpi('Chamados abertos', String(d.tickets.open), `${d.tickets.urgent} de prioridade alta/urgente`)}
      </div>
      <div class="two-col">
        <div>
          <h3>OS ativas por etapa</h3>
          <table><thead><tr><th>Etapa</th><th class="num">Qtd</th><th class="num">Valor</th></tr></thead><tbody>${osRows || '<tr><td colspan="3" class="empty">Sem OS ativas</td></tr>'}</tbody></table>
        </div>
        <div>
          <h3>Pipeline por etapa</h3>
          <table><thead><tr><th>Etapa</th><th class="num">Qtd</th><th class="num">Valor</th></tr></thead><tbody>${stageRows || '<tr><td colspan="3" class="empty">Sem oportunidades em aberto</td></tr>'}</tbody></table>
        </div>
      </div>
      <h3>Pontos para decisão</h3>
      <ul class="alerts">${alerts}</ul>
    </section>

    <section class="rep-section">
      <h2>2. Relatório de conversão</h2>
      <div class="kpi-grid">
        ${kpi('Taxa de aprovação', pct(conv.approvalRate), `${conv.approved} aprovadas de ${conv.total} emitidas`)}
        ${kpi('Taxa de recusa', pct(conv.rejectionRate), `${conv.rejected} propostas recusadas`)}
        ${kpi('Em negociação', String(conv.pending), `${pct(conv.pendingRate)} · ${money(conv.pendingValue)}`)}
        ${kpi('Volume aprovado', money(conv.approvedValue), `Volume total ${money(conv.totalValue)}`)}
      </div>
      <table class="wide">
        <thead><tr><th>Cliente</th><th class="num">Emitidas</th><th class="num">Aprovadas</th><th class="num">Recusadas</th><th class="num">Em negociação</th><th class="num">Volume aprovado</th><th class="num">Volume total</th></tr></thead>
        <tbody>${clientRows || '<tr><td colspan="7" class="empty">Sem propostas no período</td></tr>'}</tbody>
      </table>
    </section>

    <section class="rep-section">
      <h2>3. Rentabilidade &amp; margem real</h2>
      <div class="kpi-grid">
        ${kpi('Faturamento de serviços', money(rent.totalRevenue), `${rent.count} OS/proposta(s) concluída(s) ou aprovada(s)`)}
        ${kpi('Custos internos totais', rent.withCost === 0 && rent.count > 0 ? 'Custo não informado' : money(rent.totalCost), rent.withoutCost > 0 ? `${rent.withoutCost} item(ns) sem custo informado` : 'MO + deslocamento + hospedagem + peças')}
        ${kpi('Lucro bruto real', money(rent.totalProfit), 'Somente itens com custo informado')}
        ${kpi('Margem real média', pct(rent.averageMargin), `Cobertura de custo: ${rent.costCoverage}% do faturamento`)}
      </div>
      <table class="wide">
        <thead><tr><th>Item</th><th>Cliente</th><th class="num">Preço final</th><th class="num">Margem real</th></tr></thead>
        <tbody>${rentRows || '<tr><td colspan="4" class="empty">Sem itens concluídos/aprovados</td></tr>'}</tbody>
      </table>
      <p class="rep-note">Margens calculadas apenas sobre itens com custo interno informado — sem estimativa. Valor aprovado não é recebido.</p>
    </section>
  </div>`
}

const PRINT_CSS = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, Helvetica, sans-serif; color: #172b3a; }
  .page { width: 760px; background: #fff; padding: 4px 2px; }
  .rep-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #0f766e; padding-bottom: 10px; }
  .rep-logo { height: 40px; }
  .rep-header-meta { text-align: right; font-size: 11px; color: #334155; line-height: 1.7; }
  .rep-meta-label { font-weight: bold; text-transform: uppercase; font-size: 9px; letter-spacing: 0.08em; color: #64748b; }
  .rep-title { font-size: 17px; font-weight: 800; margin: 12px 0 2px; color: #0f172a; }
  .rep-section { margin-top: 14px; }
  .rep-section h2 { font-size: 12.5px; font-weight: 800; color: #0f766e; text-transform: uppercase; letter-spacing: 0.04em; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; margin-bottom: 8px; }
  .rep-section h3 { font-size: 10.5px; font-weight: 700; color: #334155; margin: 10px 0 4px; }
  .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; }
  .kpi { border: 1px solid #e2e8f0; border-radius: 6px; padding: 6px 8px; }
  .kpi-label { font-size: 8px; font-weight: 700; text-transform: uppercase; color: #64748b; letter-spacing: 0.03em; }
  .kpi-value { font-size: 15px; font-weight: 800; color: #0f172a; margin-top: 2px; }
  .kpi-note { font-size: 8px; color: #64748b; margin-top: 2px; line-height: 1.35; }
  .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 4px; }
  table { width: 100%; table-layout: fixed; border-collapse: collapse; font-size: 9px; }
  table.wide { margin-top: 4px; }
  th { text-align: left; background: #f1f5f9; color: #334155; font-size: 8px; text-transform: uppercase; letter-spacing: 0.02em; padding: 3px 5px; border-bottom: 1px solid #cbd5e1; word-break: break-word; }
  td { padding: 3px 5px; border-bottom: 1px solid #eef2f6; word-break: break-word; }
  td.num, th.num { text-align: right; white-space: nowrap; }
  .kpi-grid, .two-col, .rep-section { page-break-inside: avoid; }
  .rep-section h2 { page-break-after: avoid; }
  tr { page-break-inside: avoid; }
  .empty { color: #94a3b8; font-style: italic; }
  .alerts { margin: 2px 0 0 14px; font-size: 9.5px; color: #334155; }
  .alerts li { margin-bottom: 2px; }
  .rep-note { font-size: 8.5px; color: #64748b; margin-top: 8px; font-style: italic; }
`

export async function buildExecutivePdfFile(
  data: ReportData,
  quotes: QuoteRecord[],
  serviceOrders: ServiceOrderRecord[],
): Promise<void> {
  const conv = conversionData(quotes)
  const rent = profitabilityData(serviceOrders, quotes)
  const holder = document.createElement('div')
  holder.style.position = 'fixed'
  holder.style.left = '-10000px'
  holder.style.top = '0'
  holder.innerHTML = `<style>${PRINT_CSS}</style>${reportHtml(data, conv, rent)}`
  document.body.appendChild(holder)
  try {
    const target = holder.querySelector('.page') as HTMLElement
    const html2pdf = await loadHtml2Pdf()
    if (!html2pdf) throw new Error('Gerador de PDF indisponível')
    const stamp = new Date().toISOString().slice(0, 10)
    await html2pdf()
      .set({
        margin: [10, 10, 12, 10],
        filename: `relatorio-painel-intertermal-${stamp}.pdf`,
        image: { type: 'jpeg', quality: 0.95 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          logging: false,
          scrollY: 0,
          width: 760,
          windowWidth: 760,
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['css', 'legacy'] },
      })
      .from(target)
      .toPdf()
      .get('pdf')
      .then((pdf: any) => {
        // Limite duro: no máximo 2 páginas
        const total = pdf.internal.getNumberOfPages()
        for (let i = total; i > 2; i--) pdf.deletePage(i)
        const pages = pdf.internal.getNumberOfPages()
        for (let i = 1; i <= pages; i++) {
          pdf.setPage(i)
          const w = pdf.internal.pageSize.getWidth()
          const h = pdf.internal.pageSize.getHeight()
          pdf.setFontSize(7.5)
          pdf.setTextColor(110, 122, 136)
          pdf.text(`Intertermal · Painel Executivo · ${data.period}`, 10, h - 5)
          try {
            pdf.text(`Página ${i} de ${pages}`, w - 10, h - 5, { align: 'right' })
          } catch {
            pdf.text(`Página ${i} de ${pages}`, w - 30, h - 5)
          }
        }
      })
      .save()
  } finally {
    holder.remove()
  }
}
