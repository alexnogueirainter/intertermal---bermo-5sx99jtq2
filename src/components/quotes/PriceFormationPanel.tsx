import { Badge } from '@/components/ui/badge'
import { Calculator, Package, Wrench } from 'lucide-react'

interface PriceFormationPanelProps {
  materialsCost: number
  serviceMargin: number
  salesCommission: number
  adminRate: number
  materialsItemsTotal: number
  chemicalProductsTotal: number
  materialsPassThrough: number
  serviceDirectCostsTotal: number
  directCostsTotal: number
  totalTaxesPercent: number
  divisor: number
  adminAmount: number
  serviceSalePrice: number
  calculatedSalePrice: number
  serviceMarginAmount: number
  salesCommissionAmount: number
  taxesAmount: number
}

export function PriceFormationPanel(props: PriceFormationPanelProps) {
  const {
    materialsCost,
    serviceMargin,
    salesCommission,
    adminRate,
    materialsItemsTotal,
    chemicalProductsTotal,
    materialsPassThrough,
    serviceDirectCostsTotal,
    directCostsTotal,
    totalTaxesPercent,
    divisor,
    adminAmount,
    serviceSalePrice,
    calculatedSalePrice,
    serviceMarginAmount,
    salesCommissionAmount,
    taxesAmount,
  } = props

  return (
    <>
      {/* Bloco 3: Formação de Preço & Fechamento Gerencial */}
      <div className="p-3.5 rounded-lg border-2 border-amber-300 dark:border-amber-900/60 bg-amber-50/70 dark:bg-amber-950/20 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-950 dark:text-amber-200 flex items-center gap-1.5">
            <Calculator className="h-3.5 w-3.5 text-amber-700 dark:text-amber-400" />
            Formação de Preço: Serviços Tributados + Repasse Puro de Materiais
          </span>
          <div className="flex items-center gap-1.5">
            <Badge className="bg-amber-700 dark:bg-amber-800 text-white font-mono text-[10px]">
              DIVISOR DE SERVIÇO: {(divisor * 100).toFixed(1)}%
            </Badge>
          </div>
        </div>

        {/* Destaque das 3 Parcelas Obrigatórias */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
          {/* Parcela 1: Serviços Especializados */}
          <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border-2 border-teal-500/40 dark:border-teal-700/50 space-y-1 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-teal-800 dark:text-teal-300 flex items-center gap-1">
                <Wrench className="h-3 w-3 text-teal-600" />
                Serviços Especializados
              </span>
              <Badge
                variant="secondary"
                className="text-[9px] font-mono bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-300"
              >
                com tributos e margem
              </Badge>
            </div>
            <div className="font-mono font-black text-teal-900 dark:text-teal-100 text-base">
              {serviceSalePrice.toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              })}
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
              Direto:{' '}
              {serviceDirectCostsTotal.toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              })}{' '}
              + Adm ({adminRate}%):{' '}
              {adminAmount.toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              })}{' '}
              ÷ {divisor.toFixed(4)}
            </div>
          </div>

          {/* Parcela 2: Repasse de Materiais e Componentes */}
          <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border-2 border-blue-500/40 dark:border-blue-700/50 space-y-1 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-blue-800 dark:text-blue-300 flex items-center gap-1">
                <Package className="h-3 w-3 text-blue-600" />
                Repasse de Materiais e Componentes
              </span>
              <Badge
                variant="secondary"
                className="text-[9px] font-mono bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
              >
                sem tributos
              </Badge>
            </div>
            <div className="font-mono font-black text-blue-900 dark:text-blue-100 text-base">
              {materialsPassThrough.toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              })}
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
              Materiais:{' '}
              {materialsCost.toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              })}{' '}
              • Peças:{' '}
              {materialsItemsTotal.toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              })}{' '}
              • Químicos:{' '}
              {chemicalProductsTotal.toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              })}
            </div>
          </div>

          {/* Parcela 3: Preço Final Consolidado */}
          <div className="bg-amber-900 text-white p-3 rounded-lg space-y-1 shadow-sm border-2 border-amber-800">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-amber-200">
                Preço Final Consolidado
              </span>
              <Badge className="bg-amber-700 text-white text-[9px] font-mono">Total Proposta</Badge>
            </div>
            <div className="font-mono font-black text-white text-lg">
              {calculatedSalePrice.toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              })}
            </div>
            <div className="text-[10px] text-amber-300 leading-tight">
              Serviço tributado (
              {serviceSalePrice.toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              })}
              ) + Repasse puro (
              {materialsPassThrough.toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              })}
              )
            </div>
          </div>
        </div>

        {/* Linha de Apoio: Custos Diretos Totais e Margem/Comissão/Tributos */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs pt-1 border-t border-amber-200 dark:border-amber-900/40">
          <div className="bg-white/80 dark:bg-slate-900/80 p-2 rounded border border-amber-200/80 dark:border-amber-900/50 space-y-0.5">
            <span className="text-[9.5px] text-slate-500 uppercase font-semibold block">
              Custos Diretos Totais
            </span>
            <div className="font-mono font-bold text-slate-800 dark:text-slate-200 text-xs">
              {directCostsTotal.toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              })}
            </div>
            <div className="text-[9px] text-slate-500">
              Serviços{' '}
              {serviceDirectCostsTotal.toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              })}{' '}
              + Repasse{' '}
              {materialsPassThrough.toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              })}
            </div>
          </div>

          <div className="bg-white/80 dark:bg-slate-900/80 p-2 rounded border border-amber-200/80 dark:border-amber-900/50 space-y-0.5">
            <span className="text-[9.5px] text-slate-500 uppercase font-semibold block">
              Overhead Adm ({adminRate}%)
            </span>
            <div className="font-mono font-bold text-purple-700 dark:text-purple-400 text-xs">
              {adminAmount.toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              })}
            </div>
            <div className="text-[9px] text-slate-500">Incide apenas sobre serviço</div>
          </div>

          <div className="bg-white/80 dark:bg-slate-900/80 p-2 rounded border border-amber-200/80 dark:border-amber-900/50 space-y-0.5">
            <span className="text-[9.5px] text-slate-500 uppercase font-semibold block">
              Margem ({serviceMargin}%) + Comis ({salesCommission}%)
            </span>
            <div className="font-mono font-bold text-emerald-700 dark:text-emerald-400 text-xs">
              {(serviceMarginAmount + salesCommissionAmount).toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              })}
            </div>
            <div className="text-[9px] text-slate-500">
              Sobre serviço:{' '}
              {serviceMarginAmount.toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              })}{' '}
              +{' '}
              {salesCommissionAmount.toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              })}
            </div>
          </div>

          <div className="bg-white/80 dark:bg-slate-900/80 p-2 rounded border border-amber-200/80 dark:border-amber-900/50 space-y-0.5">
            <span className="text-[9.5px] text-slate-500 uppercase font-semibold block">
              Tributos Totais ({totalTaxesPercent.toFixed(2)}%)
            </span>
            <div className="font-mono font-bold text-rose-700 dark:text-rose-400 text-xs">
              {taxesAmount.toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              })}
            </div>
            <div className="text-[9px] text-slate-500">Incidem exclusivamente no serviço</div>
          </div>
        </div>
      </div>
    </>
  )
}
