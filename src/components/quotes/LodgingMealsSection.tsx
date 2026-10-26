import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { Dispatch, SetStateAction } from 'react'

interface LodgingMealsSectionProps {
  hotelDays: number
  setHotelDays: Dispatch<SetStateAction<number>>
  hotelRate: number
  setHotelRate: Dispatch<SetStateAction<number>>
  mealsDays: number
  setMealsDays: Dispatch<SetStateAction<number>>
  mealsRate: number
  setMealsRate: Dispatch<SetStateAction<number>>
  mealVoucherHousedQty: number
  setMealVoucherHousedQty: Dispatch<SetStateAction<number>>
  mealVoucherHousedRate: number
  setMealVoucherHousedRate: Dispatch<SetStateAction<number>>
  mealVoucherUnhousedQty: number
  setMealVoucherUnhousedQty: Dispatch<SetStateAction<number>>
  mealVoucherUnhousedRate: number
  setMealVoucherUnhousedRate: Dispatch<SetStateAction<number>>
  hotelTotal: number
  mealsTotal: number
  voucherHousedTotal: number
  voucherUnhousedTotal: number
  lodgingMealsTotalCost: number
}

export function LodgingMealsSection(props: LodgingMealsSectionProps) {
  const {
    hotelDays,
    setHotelDays,
    hotelRate,
    setHotelRate,
    mealsDays,
    setMealsDays,
    mealsRate,
    setMealsRate,
    mealVoucherHousedQty,
    setMealVoucherHousedQty,
    mealVoucherHousedRate,
    setMealVoucherHousedRate,
    mealVoucherUnhousedQty,
    setMealVoucherUnhousedQty,
    mealVoucherUnhousedRate,
    setMealVoucherUnhousedRate,
    hotelTotal,
    mealsTotal,
    voucherHousedTotal,
    voucherUnhousedTotal,
    lodgingMealsTotalCost,
  } = props

  return (
    <>
      {/* SEÇÃO 3D: Hospedagem & Alimentação */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-xs">
        <CardHeader className="p-4 pb-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span className="flex items-center justify-center w-7 h-5 rounded bg-teal-600 text-white text-[11px] font-bold">
                3D
              </span>
              3D Hospedagem & Alimentação
            </CardTitle>
            <span className="text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400">
              Subtotal:{' '}
              {lodgingMealsTotalCost.toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              })}
            </span>
          </div>
        </CardHeader>
        <CardContent className="p-4 space-y-4">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                Composição de Hospedagem & Alimentação em Campo
              </span>
              <span className="text-xs font-bold text-emerald-600 font-mono">
                Subtotal:{' '}
                {lodgingMealsTotalCost.toLocaleString('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                })}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Diárias de Hotel */}
              <div className="p-3 bg-white dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800 space-y-2">
                <Label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Diárias de Hotel
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-0.5">
                    <Label className="text-[10px] text-muted-foreground">
                      Quantidade de Diárias
                    </Label>
                    <Input
                      type="number"
                      min="0"
                      value={hotelDays}
                      onChange={(e) => setHotelDays(Number(e.target.value))}
                      className="text-xs h-8 font-mono"
                    />
                  </div>
                  <div className="space-y-0.5">
                    <Label className="text-[10px] text-muted-foreground">Valor Diária (R$)</Label>
                    <Input
                      type="number"
                      min="0"
                      value={hotelRate}
                      onChange={(e) => setHotelRate(Number(e.target.value))}
                      className="text-xs h-8 font-mono"
                    />
                  </div>
                </div>
                <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300 font-mono text-right pt-1">
                  Subtotal Hotel:{' '}
                  {hotelTotal.toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  })}
                </div>
              </div>

              {/* Refeições */}
              <div className="p-3 bg-white dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800 space-y-2">
                <Label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Refeições / Alimentação Diária
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-0.5">
                    <Label className="text-[10px] text-muted-foreground">
                      Quantidade de Refeições
                    </Label>
                    <Input
                      type="number"
                      min="0"
                      value={mealsDays}
                      onChange={(e) => setMealsDays(Number(e.target.value))}
                      className="text-xs h-8 font-mono"
                    />
                  </div>
                  <div className="space-y-0.5">
                    <Label className="text-[10px] text-muted-foreground">Valor Refeição (R$)</Label>
                    <Input
                      type="number"
                      min="0"
                      value={mealsRate}
                      onChange={(e) => setMealsRate(Number(e.target.value))}
                      className="text-xs h-8 font-mono"
                    />
                  </div>
                </div>
                <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300 font-mono text-right pt-1">
                  Subtotal Refeições:{' '}
                  {mealsTotal.toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  })}
                </div>
              </div>
            </div>

            {/* Vale Refeição Funcionários (Alojado e Não Alojado) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div className="p-3 bg-white dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800 space-y-2">
                <Label className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  Vale Refeição Alojado (Equipe Hospedada)
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-0.5">
                    <Label className="text-[10px] text-muted-foreground">Quantidade</Label>
                    <Input
                      type="number"
                      min="0"
                      value={mealVoucherHousedQty}
                      onChange={(e) => setMealVoucherHousedQty(Number(e.target.value))}
                      className="text-xs h-8 font-mono"
                    />
                  </div>
                  <div className="space-y-0.5">
                    <Label className="text-[10px] text-muted-foreground">Valor (R$)</Label>
                    <Input
                      type="number"
                      min="0"
                      value={mealVoucherHousedRate}
                      onChange={(e) => setMealVoucherHousedRate(Number(e.target.value))}
                      className="text-xs h-8 font-mono"
                    />
                  </div>
                </div>
                <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300 font-mono text-right pt-1">
                  Subtotal:{' '}
                  {voucherHousedTotal.toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  })}
                </div>
              </div>

              <div className="p-3 bg-white dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800 space-y-2">
                <Label className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  Vale Refeição Não Alojado (Equipe Local)
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-0.5">
                    <Label className="text-[10px] text-muted-foreground">Quantidade</Label>
                    <Input
                      type="number"
                      min="0"
                      value={mealVoucherUnhousedQty}
                      onChange={(e) => setMealVoucherUnhousedQty(Number(e.target.value))}
                      className="text-xs h-8 font-mono"
                    />
                  </div>
                  <div className="space-y-0.5">
                    <Label className="text-[10px] text-muted-foreground">Valor (R$)</Label>
                    <Input
                      type="number"
                      min="0"
                      value={mealVoucherUnhousedRate}
                      onChange={(e) => setMealVoucherUnhousedRate(Number(e.target.value))}
                      className="text-xs h-8 font-mono"
                    />
                  </div>
                </div>
                <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300 font-mono text-right pt-1">
                  Subtotal:{' '}
                  {voucherUnhousedTotal.toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  })}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  )
}
