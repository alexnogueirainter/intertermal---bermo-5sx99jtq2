import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import type { Dispatch, SetStateAction } from 'react'

interface MarginsSlidersPanelProps {
  serviceMargin: number
  setServiceMargin: Dispatch<SetStateAction<number>>
  salesCommission: number
  setSalesCommission: Dispatch<SetStateAction<number>>
  adminRate: number
  setAdminRate: Dispatch<SetStateAction<number>>
  validityDays: number
  setValidityDays: Dispatch<SetStateAction<number>>
  adminAmount: number
  calculatedSalePrice: number
}

export function MarginsSlidersPanel(props: MarginsSlidersPanelProps) {
  const {
    serviceMargin,
    setServiceMargin,
    salesCommission,
    setSalesCommission,
    adminRate,
    setAdminRate,
    validityDays,
    setValidityDays,
    adminAmount,
    calculatedSalePrice,
  } = props

  return (
    <>
      {/* Bloco 1: Margens Comerciais & Operacionais com Sliders 0-50% */}
      <div className="space-y-3">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 block">
          Margens e Custos Indiretos (Barras 0 a 50%)
        </span>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Margem de Serviço */}
          <div className="p-3 rounded-lg border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/30 dark:bg-emerald-950/20 space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold text-emerald-900 dark:text-emerald-300">
                Margem de Serviço (%)
              </Label>
              <span className="text-[11px] font-mono text-emerald-700 dark:text-emerald-300 font-bold">
                {(calculatedSalePrice * (serviceMargin / 100)).toLocaleString('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                })}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Slider
                value={[Math.min(50, Math.max(0, serviceMargin))]}
                min={0}
                max={50}
                step={1}
                onValueChange={(val) => setServiceMargin(Math.round(val[0]))}
                className="flex-1 cursor-pointer"
              />
              <span className="text-[11px] font-mono font-bold w-12 text-right text-emerald-800 dark:text-emerald-300">
                {serviceMargin}%
              </span>
            </div>
            <div className="flex items-center gap-1.5 pt-0.5">
              <Input
                type="number"
                min="0"
                max="50"
                step="1"
                value={serviceMargin}
                onChange={(e) => {
                  const val = Math.min(50, Math.max(0, Math.round(parseFloat(e.target.value) || 0)))
                  setServiceMargin(val)
                }}
                className="text-xs h-7 font-mono font-bold text-emerald-700 dark:text-emerald-400 flex-1 min-w-0"
              />
              <Select
                value={
                  [15, 20, 25, 30, 35].includes(serviceMargin) ? String(serviceMargin) : 'custom'
                }
                onValueChange={(val) => {
                  if (val !== 'custom') setServiceMargin(Number(val))
                }}
              >
                <SelectTrigger
                  className="w-16 h-7 text-[11px] font-mono px-1.5 shrink-0 bg-emerald-50/50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800"
                  title="Escolher percentual pré-definido"
                >
                  <SelectValue placeholder="Opção" />
                </SelectTrigger>
                <SelectContent align="end">
                  <SelectItem value="15" className="text-xs font-mono">
                    15%
                  </SelectItem>
                  <SelectItem value="20" className="text-xs font-mono">
                    20%
                  </SelectItem>
                  <SelectItem value="25" className="text-xs font-mono">
                    25% (Padrão)
                  </SelectItem>
                  <SelectItem value="30" className="text-xs font-mono">
                    30%
                  </SelectItem>
                  <SelectItem value="35" className="text-xs font-mono">
                    35%
                  </SelectItem>
                  {![15, 20, 25, 30, 35].includes(serviceMargin) && (
                    <SelectItem value="custom" className="text-xs font-mono text-muted-foreground">
                      {serviceMargin}% (Outro)
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Comissão de Vendas */}
          <div className="p-3 rounded-lg border border-blue-200 dark:border-blue-900/50 bg-blue-50/30 dark:bg-blue-950/20 space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold text-blue-900 dark:text-blue-300">
                Comissão de Vendas (%)
              </Label>
              <span className="text-[11px] font-mono text-blue-700 dark:text-blue-300 font-bold">
                {(calculatedSalePrice * (salesCommission / 100)).toLocaleString('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                })}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Slider
                value={[Math.min(50, Math.max(0, salesCommission))]}
                min={0}
                max={50}
                step={1}
                onValueChange={(val) => setSalesCommission(Math.round(val[0]))}
                className="flex-1 cursor-pointer"
              />
              <span className="text-[11px] font-mono font-bold w-12 text-right text-blue-800 dark:text-blue-300">
                {salesCommission}%
              </span>
            </div>
            <div className="flex items-center gap-1.5 pt-0.5">
              <Input
                type="number"
                min="0"
                max="50"
                step="1"
                value={salesCommission}
                onChange={(e) => {
                  const val = Math.min(50, Math.max(0, Math.round(parseFloat(e.target.value) || 0)))
                  setSalesCommission(val)
                }}
                className="text-xs h-7 font-mono font-bold text-blue-700 dark:text-blue-400 flex-1 min-w-0"
              />
              <Select
                value={
                  [0, 2, 3, 5, 6, 8, 10].includes(salesCommission)
                    ? String(salesCommission)
                    : 'custom'
                }
                onValueChange={(val) => {
                  if (val !== 'custom') setSalesCommission(Number(val))
                }}
              >
                <SelectTrigger
                  className="w-16 h-7 text-[11px] font-mono px-1.5 shrink-0 bg-blue-50/50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800"
                  title="Escolher percentual pré-definido"
                >
                  <SelectValue placeholder="Opção" />
                </SelectTrigger>
                <SelectContent align="end">
                  <SelectItem value="0" className="text-xs font-mono">
                    0% (Sem)
                  </SelectItem>
                  <SelectItem value="2" className="text-xs font-mono">
                    2%
                  </SelectItem>
                  <SelectItem value="3" className="text-xs font-mono">
                    3%
                  </SelectItem>
                  <SelectItem value="5" className="text-xs font-mono">
                    5%
                  </SelectItem>
                  <SelectItem value="6" className="text-xs font-mono">
                    6% (Padrão)
                  </SelectItem>
                  <SelectItem value="8" className="text-xs font-mono">
                    8%
                  </SelectItem>
                  <SelectItem value="10" className="text-xs font-mono">
                    10%
                  </SelectItem>
                  {![0, 2, 3, 5, 6, 8, 10].includes(salesCommission) && (
                    <SelectItem value="custom" className="text-xs font-mono text-muted-foreground">
                      {salesCommission}% (Outro)
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Overhead Administrativo */}
          <div className="p-3 rounded-lg border border-purple-200 dark:border-purple-900/50 bg-purple-50/30 dark:bg-purple-950/20 space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold text-purple-900 dark:text-purple-300">
                Overhead Adm (%)
              </Label>
              <span className="text-[11px] font-mono text-purple-700 dark:text-purple-300 font-bold">
                {adminAmount.toLocaleString('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                })}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Slider
                value={[Math.min(50, Math.max(0, adminRate))]}
                min={0}
                max={50}
                step={1}
                onValueChange={(val) => setAdminRate(Math.round(val[0]))}
                className="flex-1 cursor-pointer"
              />
              <span className="text-[11px] font-mono font-bold w-12 text-right text-purple-800 dark:text-purple-300">
                {adminRate}%
              </span>
            </div>
            <div className="flex items-center gap-1.5 pt-0.5">
              <Input
                type="number"
                min="0"
                max="50"
                step="1"
                value={adminRate}
                onChange={(e) => {
                  const val = Math.min(50, Math.max(0, Math.round(parseFloat(e.target.value) || 0)))
                  setAdminRate(val)
                }}
                className="text-xs h-7 font-mono font-bold text-purple-700 dark:text-purple-400 flex-1 min-w-0"
              />
              <Select
                value={[0, 2, 3, 5, 8, 10, 15].includes(adminRate) ? String(adminRate) : 'custom'}
                onValueChange={(val) => {
                  if (val !== 'custom') setAdminRate(Number(val))
                }}
              >
                <SelectTrigger
                  className="w-16 h-7 text-[11px] font-mono px-1.5 shrink-0 bg-purple-50/50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800"
                  title="Escolher percentual pré-definido"
                >
                  <SelectValue placeholder="Opção" />
                </SelectTrigger>
                <SelectContent align="end">
                  <SelectItem value="0" className="text-xs font-mono">
                    0% (Sem)
                  </SelectItem>
                  <SelectItem value="2" className="text-xs font-mono">
                    2%
                  </SelectItem>
                  <SelectItem value="3" className="text-xs font-mono">
                    3% (Padrão)
                  </SelectItem>
                  <SelectItem value="5" className="text-xs font-mono">
                    5%
                  </SelectItem>
                  <SelectItem value="8" className="text-xs font-mono">
                    8%
                  </SelectItem>
                  <SelectItem value="10" className="text-xs font-mono">
                    10%
                  </SelectItem>
                  <SelectItem value="15" className="text-xs font-mono">
                    15% (Fixo Adm)
                  </SelectItem>
                  {![0, 2, 3, 5, 8, 10, 15].includes(adminRate) && (
                    <SelectItem value="custom" className="text-xs font-mono text-muted-foreground">
                      {adminRate}% (Outro)
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2">
            <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Validade da Proposta (Dias):
            </Label>
            <Input
              type="number"
              value={validityDays}
              onChange={(e) => setValidityDays(Number(e.target.value))}
              className="text-xs h-7 w-24 font-mono font-bold"
            />
          </div>
          <span className="text-[11px] text-muted-foreground font-mono">
            Margem ({serviceMargin}%) + Comissão ({salesCommission}%) + Overhead ({adminRate}%) ={' '}
            {(serviceMargin + salesCommission + adminRate).toFixed(2)}%
          </span>
        </div>
      </div>
    </>
  )
}
