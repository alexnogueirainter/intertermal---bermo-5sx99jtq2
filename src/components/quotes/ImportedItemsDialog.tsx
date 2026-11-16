import { AlertTriangle, FileText } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import type { QuoteRecord } from '@/types/crm'

interface ImportedItemsDialogProps {
  quote: QuoteRecord | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

const fmtBRL = (v: unknown): string => {
  const n = Number(v) || 0
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

/** Itens da proposta importada (modelo PI): descrição + valor final de cada item. */
export function ImportedItemsDialog({ quote, open, onOpenChange }: ImportedItemsDialogProps) {
  if (!quote) return null

  const rawItems = Array.isArray(quote.items) ? quote.items : []
  const items = rawItems.map((it: any, i: number) => {
    const unit = Number(it?.unit_price ?? it?.unitPrice ?? 0) || 0
    const qty = Number(it?.quantity ?? 1) || 1
    const disc = Number(it?.discount ?? 0) || 0
    const total = Number(it?.total ?? unit * qty - disc) || unit * qty - disc
    return {
      key: it?.id || `it-${i}`,
      name: String(it?.name || it?.description || `Item ${i + 1}`),
      qty,
      unit,
      disc,
      total,
      opcional: Boolean(it?.opcional),
    }
  })

  const totalGeral = Number(quote.total || 0)
  const somaItens = items.reduce((acc, it) => acc + it.total, 0)
  const somaOpcionais = items.filter((it) => it.opcional).reduce((acc, it) => acc + it.total, 0)
  const somaBase = somaItens - somaOpcionais
  const diverge =
    somaBase > 0 && totalGeral > 0 && Math.abs(somaBase - totalGeral) / totalGeral > 0.01

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <FileText className="h-4 w-4 text-teal-600" />
            Itens da proposta {quote.quote_number || quote.code || ''}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">
            {quote.client_name} — {quote.title || 'Proposta importada'}
          </p>

          {items.length === 0 ? (
            <p className="text-xs text-muted-foreground py-4 text-center">
              Esta proposta não tem itens detalhados — o valor total foi registrado direto no
              cadastro. Edite a proposta para detalhar itens se precisar.
            </p>
          ) : (
            <div className="rounded-md border border-slate-200 dark:border-slate-800 overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase">
                    <th className="py-2 px-3">Item</th>
                    <th className="py-2 px-3 text-center">Qtd</th>
                    <th className="py-2 px-3 text-right">Valor final</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:border-slate-800">
                  {items.map((it) => (
                    <tr key={it.key} className="hover:bg-slate-50/80 dark:hover:bg-slate-900/60">
                      <td className="py-2.5 px-3 text-slate-800 dark:text-slate-200">
                        {it.name}
                        {it.opcional && (
                          <span className="ml-2 text-[10px] font-semibold text-amber-600 uppercase">
                            opcional
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center text-slate-600 dark:text-slate-400">
                        {it.qty}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-900 dark:text-slate-100">
                        {fmtBRL(it.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {items.length > 0 && (
            <div className="rounded-md bg-slate-50 dark:bg-slate-900 p-3 space-y-1.5 text-xs">
              {somaBase > 0 && (
                <div className="flex justify-between text-slate-700 dark:text-slate-300">
                  <span>Soma dos itens do fornecimento</span>
                  <span className="font-mono font-semibold">{fmtBRL(somaBase)}</span>
                </div>
              )}
              {somaOpcionais > 0 && (
                <div className="flex justify-between text-amber-700 dark:text-amber-400">
                  <span>Soma dos itens opcionais (fora do total)</span>
                  <span className="font-mono font-semibold">{fmtBRL(somaOpcionais)}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-slate-200 dark:border-slate-800 pt-1.5 text-slate-900 dark:text-slate-100 font-semibold">
                <span>Valor total registrado da proposta</span>
                <span className="font-mono">{fmtBRL(totalGeral)}</span>
              </div>
              {diverge && (
                <p className="text-amber-600 flex items-start gap-1.5 pt-1">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                  A soma dos itens do fornecimento ({fmtBRL(somaBase)}) difere do total registrado (
                  {fmtBRL(totalGeral)}) — confira no PDF original.
                </p>
              )}
            </div>
          )}

          {quote.pdf_file && (
            <p className="text-[11px] text-muted-foreground">
              Consulte o PDF original pelo botão de download na lista de propostas.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default ImportedItemsDialog
