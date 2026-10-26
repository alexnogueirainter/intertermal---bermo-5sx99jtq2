interface EditorFinanceSummaryProps {
  serviceMargin: number
  adminRate: number
  travelTotalCost: number
  directCostsTotal: number
  divisor: number
  calculatedSalePrice: number
}

export function EditorFinanceSummary(props: EditorFinanceSummaryProps) {
  const {
    serviceMargin,
    adminRate,
    travelTotalCost,
    directCostsTotal,
    divisor,
    calculatedSalePrice,
  } = props

  return (
    <>
      {/* Resumo Financeiro Consolidado */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
        <div className="space-y-0.5">
          <span className="text-[10px] text-muted-foreground uppercase font-bold">
            Custos Diretos Totais
          </span>
          <div className="font-mono font-bold text-slate-900 dark:text-slate-100 text-sm">
            {directCostsTotal.toLocaleString('pt-BR', {
              style: 'currency',
              currency: 'BRL',
            })}
          </div>
          <span className="text-[9.5px] text-muted-foreground block">
            Mão Obra + Desloc. + Hotel + Peças
          </span>
        </div>

        <div className="space-y-0.5">
          <span className="text-[10px] text-muted-foreground uppercase font-bold">
            Logística & Rotas
          </span>
          <div className="font-mono font-bold text-emerald-700 dark:text-emerald-400 text-sm">
            {travelTotalCost.toLocaleString('pt-BR', {
              style: 'currency',
              currency: 'BRL',
            })}
          </div>
          <span className="text-[9.5px] text-muted-foreground block">Combustível + Pedágios</span>
        </div>

        <div className="space-y-0.5">
          <span className="text-[10px] text-muted-foreground uppercase font-bold">
            Margem / Markup
          </span>
          <div className="font-mono font-bold text-blue-700 dark:text-blue-400 text-sm">
            {serviceMargin}% Margem ({adminRate}% Adm)
          </div>
          <span className="text-[9.5px] text-muted-foreground block">
            Divisor: {(divisor * 100).toFixed(1)}%
          </span>
        </div>

        <div className="space-y-0.5 bg-teal-50 dark:bg-teal-950/60 p-2 rounded-lg border border-teal-200 dark:border-teal-800">
          <span className="text-[10px] text-teal-800 dark:text-teal-300 uppercase font-bold">
            Preço Final de Venda
          </span>
          <div className="font-mono font-extrabold text-teal-800 dark:text-teal-300 text-base">
            {calculatedSalePrice.toLocaleString('pt-BR', {
              style: 'currency',
              currency: 'BRL',
            })}
          </div>
          <span className="text-[9.5px] text-teal-700 dark:text-teal-400 block font-semibold">
            Valor total consolidado
          </span>
        </div>
      </div>
    </>
  )
}
