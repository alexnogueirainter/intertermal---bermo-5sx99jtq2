import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Percent } from 'lucide-react'
import type { Dispatch, SetStateAction } from 'react'

interface TaxesPanelProps {
  pisRate: number
  setPisRate: Dispatch<SetStateAction<number>>
  cofinsRate: number
  setCofinsRate: Dispatch<SetStateAction<number>>
  issRate: number
  setIssRate: Dispatch<SetStateAction<number>>
  csllRate: number
  setCsllRate: Dispatch<SetStateAction<number>>
  irpjRate: number
  setIrpjRate: Dispatch<SetStateAction<number>>
  irDiffRate: number
  setIrDiffRate: Dispatch<SetStateAction<number>>
  totalTaxesPercent: number
  serviceSalePrice: number
  taxesAmount: number
}

export function TaxesPanel(props: TaxesPanelProps) {
  const {
    pisRate,
    setPisRate,
    cofinsRate,
    setCofinsRate,
    issRate,
    setIssRate,
    csllRate,
    setCsllRate,
    irpjRate,
    setIrpjRate,
    irDiffRate,
    setIrDiffRate,
    totalTaxesPercent,
    serviceSalePrice,
    taxesAmount,
  } = props

  return (
    <>
      {/* Bloco 2: Impostos Individuais com Alíquotas e Valores em R$ */}
      <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-1.5">
            <Percent className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
              Tributos & Encargos Fiscais Individuais
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="text-[11px] font-mono font-bold bg-rose-50 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-300 dark:border-rose-800 shadow-xs"
            >
              Carga Tributária Total: {totalTaxesPercent.toFixed(2)}% •{' '}
              {taxesAmount.toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              })}
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {/* PIS */}
          <div className="p-2.5 rounded-md bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                PIS (%)
              </Label>
              <span className="text-[9px] text-muted-foreground font-mono">0,65%</span>
            </div>
            <Input
              type="number"
              step="0.01"
              value={pisRate}
              onChange={(e) => setPisRate(Number(e.target.value))}
              className="text-xs h-7 font-mono font-bold text-slate-900 dark:text-slate-100"
            />
            <div className="text-[10px] font-mono font-semibold text-rose-600 dark:text-rose-400 text-right truncate">
              {(serviceSalePrice * (Number(pisRate || 0) / 100)).toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              })}
            </div>
          </div>

          {/* COFINS */}
          <div className="p-2.5 rounded-md bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                COFINS (%)
              </Label>
              <span className="text-[9px] text-muted-foreground font-mono">3,00%</span>
            </div>
            <Input
              type="number"
              step="0.01"
              value={cofinsRate}
              onChange={(e) => setCofinsRate(Number(e.target.value))}
              className="text-xs h-7 font-mono font-bold text-slate-900 dark:text-slate-100"
            />
            <div className="text-[10px] font-mono font-semibold text-rose-600 dark:text-rose-400 text-right truncate">
              {(serviceSalePrice * (Number(cofinsRate || 0) / 100)).toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              })}
            </div>
          </div>

          {/* ISS */}
          <div className="p-2.5 rounded-md bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                ISS (%)
              </Label>
              <span className="text-[9px] text-muted-foreground font-mono">5,00%</span>
            </div>
            <Input
              type="number"
              step="0.01"
              value={issRate}
              onChange={(e) => setIssRate(Number(e.target.value))}
              className="text-xs h-7 font-mono font-bold text-slate-900 dark:text-slate-100"
            />
            <div className="text-[10px] font-mono font-semibold text-rose-600 dark:text-rose-400 text-right truncate">
              {(serviceSalePrice * (Number(issRate || 0) / 100)).toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              })}
            </div>
          </div>

          {/* CSLL */}
          <div className="p-2.5 rounded-md bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                CSLL (%)
              </Label>
              <span className="text-[9px] text-muted-foreground font-mono">2,88%</span>
            </div>
            <Input
              type="number"
              step="0.01"
              value={csllRate}
              onChange={(e) => setCsllRate(Number(e.target.value))}
              className="text-xs h-7 font-mono font-bold text-slate-900 dark:text-slate-100"
            />
            <div className="text-[10px] font-mono font-semibold text-rose-600 dark:text-rose-400 text-right truncate">
              {(serviceSalePrice * (Number(csllRate || 0) / 100)).toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              })}
            </div>
          </div>

          {/* IRPJ */}
          <div className="p-2.5 rounded-md bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                IRPJ (%)
              </Label>
              <span className="text-[9px] text-muted-foreground font-mono">4,80%</span>
            </div>
            <Input
              type="number"
              step="0.01"
              value={irpjRate}
              onChange={(e) => setIrpjRate(Number(e.target.value))}
              className="text-xs h-7 font-mono font-bold text-slate-900 dark:text-slate-100"
            />
            <div className="text-[10px] font-mono font-semibold text-rose-600 dark:text-rose-400 text-right truncate">
              {(serviceSalePrice * (Number(irpjRate || 0) / 100)).toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              })}
            </div>
          </div>

          {/* Dif. IR */}
          <div className="p-2.5 rounded-md bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Dif. IR (%)
              </Label>
              <span className="text-[9px] text-muted-foreground font-mono">1,50%</span>
            </div>
            <Input
              type="number"
              step="0.01"
              value={irDiffRate}
              onChange={(e) => setIrDiffRate(Number(e.target.value))}
              className="text-xs h-7 font-mono font-bold text-slate-900 dark:text-slate-100"
            />
            <div className="text-[10px] font-mono font-semibold text-rose-600 dark:text-rose-400 text-right truncate">
              {(serviceSalePrice * (Number(irDiffRate || 0) / 100)).toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              })}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-0.5">
          <span>Alíquotas incidentes sobre o faturamento bruto homologado da proposta.</span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setPisRate(0.65)
              setCofinsRate(3.0)
              setIssRate(5.0)
              setCsllRate(2.88)
              setIrpjRate(4.8)
              setIrDiffRate(5.0)
            }}
            className="h-6 text-[10px] font-medium text-slate-500 hover:text-rose-600 px-2"
          >
            Restaurar Alíquotas Padrão (21,33%)
          </Button>
        </div>
      </div>
    </>
  )
}
