import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { Dispatch, SetStateAction } from 'react'

interface LaborRolesGridProps {
  techCount: number
  setTechCount: Dispatch<SetStateAction<number>>
  techHours: number
  setTechHours: Dispatch<SetStateAction<number>>
  techRate: number
  setTechRate: Dispatch<SetStateAction<number>>
  helperCount: number
  setHelperCount: Dispatch<SetStateAction<number>>
  helperHours: number
  setHelperHours: Dispatch<SetStateAction<number>>
  helperRate: number
  setHelperRate: Dispatch<SetStateAction<number>>
  inspectorCount: number
  setInspectorCount: Dispatch<SetStateAction<number>>
  inspectorHours: number
  setInspectorHours: Dispatch<SetStateAction<number>>
  inspectorRate: number
  setInspectorRate: Dispatch<SetStateAction<number>>
  welderCount: number
  setWelderCount: Dispatch<SetStateAction<number>>
  welderHours: number
  setWelderHours: Dispatch<SetStateAction<number>>
  welderRate: number
  setWelderRate: Dispatch<SetStateAction<number>>
  plumberCount: number
  setPlumberCount: Dispatch<SetStateAction<number>>
  plumberHours: number
  setPlumberHours: Dispatch<SetStateAction<number>>
  plumberRate: number
  setPlumberRate: Dispatch<SetStateAction<number>>
  foremanCount: number
  setForemanCount: Dispatch<SetStateAction<number>>
  foremanHours: number
  setForemanHours: Dispatch<SetStateAction<number>>
  foremanRate: number
  setForemanRate: Dispatch<SetStateAction<number>>
  techTotal: number
  helperTotal: number
  inspectorTotal: number
  welderTotal: number
  plumberTotal: number
  foremanTotal: number
  totalLaborCost: number
  totalLaborHours: number
}

export function LaborRolesGrid(props: LaborRolesGridProps) {
  const {
    techCount,
    setTechCount,
    techHours,
    setTechHours,
    techRate,
    setTechRate,
    helperCount,
    setHelperCount,
    helperHours,
    setHelperHours,
    helperRate,
    setHelperRate,
    inspectorCount,
    setInspectorCount,
    inspectorHours,
    setInspectorHours,
    inspectorRate,
    setInspectorRate,
    welderCount,
    setWelderCount,
    welderHours,
    setWelderHours,
    welderRate,
    setWelderRate,
    plumberCount,
    setPlumberCount,
    plumberHours,
    setPlumberHours,
    plumberRate,
    setPlumberRate,
    foremanCount,
    setForemanCount,
    foremanHours,
    setForemanHours,
    foremanRate,
    setForemanRate,
    techTotal,
    helperTotal,
    inspectorTotal,
    welderTotal,
    plumberTotal,
    foremanTotal,
    totalLaborCost,
    totalLaborHours,
  } = props

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 space-y-2">
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
            Técnico Mecânico
          </span>
          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-0.5">
              <Label className="text-[10px] text-muted-foreground">Qtd</Label>
              <Input
                type="number"
                min="0"
                value={techCount}
                onChange={(e) => setTechCount(Number(e.target.value))}
                className="text-xs h-7 font-mono"
              />
            </div>
            <div className="space-y-0.5">
              <Label className="text-[10px] text-muted-foreground">Horas</Label>
              <Input
                type="number"
                min="0"
                value={techHours}
                onChange={(e) => setTechHours(Number(e.target.value))}
                className="text-xs h-7 font-mono"
              />
            </div>
            <div className="space-y-0.5">
              <Label className="text-[10px] text-muted-foreground">R$/h</Label>
              <Input
                type="number"
                min="0"
                value={techRate}
                onChange={(e) => setTechRate(Number(e.target.value))}
                className="text-xs h-7 font-mono"
              />
            </div>
          </div>
          <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300 font-mono text-right pt-1">
            Subtotal: {techTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </div>
        </div>

        <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 space-y-2">
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
            Ajudante / Auxiliar
          </span>
          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-0.5">
              <Label className="text-[10px] text-muted-foreground">Qtd</Label>
              <Input
                type="number"
                min="0"
                value={helperCount}
                onChange={(e) => setHelperCount(Number(e.target.value))}
                className="text-xs h-7 font-mono"
              />
            </div>
            <div className="space-y-0.5">
              <Label className="text-[10px] text-muted-foreground">Horas</Label>
              <Input
                type="number"
                min="0"
                value={helperHours}
                onChange={(e) => setHelperHours(Number(e.target.value))}
                className="text-xs h-7 font-mono"
              />
            </div>
            <div className="space-y-0.5">
              <Label className="text-[10px] text-muted-foreground">R$/h</Label>
              <Input
                type="number"
                min="0"
                value={helperRate}
                onChange={(e) => setHelperRate(Number(e.target.value))}
                className="text-xs h-7 font-mono"
              />
            </div>
          </div>
          <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300 font-mono text-right pt-1">
            Subtotal:{' '}
            {helperTotal.toLocaleString('pt-BR', {
              style: 'currency',
              currency: 'BRL',
            })}
          </div>
        </div>

        <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 space-y-2">
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
            Inspetor END / Qualidade
          </span>
          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-0.5">
              <Label className="text-[10px] text-muted-foreground">Qtd</Label>
              <Input
                type="number"
                min="0"
                value={inspectorCount}
                onChange={(e) => setInspectorCount(Number(e.target.value))}
                className="text-xs h-7 font-mono"
              />
            </div>
            <div className="space-y-0.5">
              <Label className="text-[10px] text-muted-foreground">Horas</Label>
              <Input
                type="number"
                min="0"
                value={inspectorHours}
                onChange={(e) => setInspectorHours(Number(e.target.value))}
                className="text-xs h-7 font-mono"
              />
            </div>
            <div className="space-y-0.5">
              <Label className="text-[10px] text-muted-foreground">R$/h</Label>
              <Input
                type="number"
                min="0"
                value={inspectorRate}
                onChange={(e) => setInspectorRate(Number(e.target.value))}
                className="text-xs h-7 font-mono"
              />
            </div>
          </div>
          <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300 font-mono text-right pt-1">
            Subtotal:{' '}
            {inspectorTotal.toLocaleString('pt-BR', {
              style: 'currency',
              currency: 'BRL',
            })}
          </div>
        </div>
      </div>

      {/* Linha 2 de Funções */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
        <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 space-y-2">
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
            Soldador Especializado (TIG / Eletrodo)
          </span>
          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-0.5">
              <Label className="text-[10px] text-muted-foreground">Qtd</Label>
              <Input
                type="number"
                min="0"
                value={welderCount}
                onChange={(e) => setWelderCount(Number(e.target.value))}
                className="text-xs h-7 font-mono"
              />
            </div>
            <div className="space-y-0.5">
              <Label className="text-[10px] text-muted-foreground">Horas</Label>
              <Input
                type="number"
                min="0"
                value={welderHours}
                onChange={(e) => setWelderHours(Number(e.target.value))}
                className="text-xs h-7 font-mono"
              />
            </div>
            <div className="space-y-0.5">
              <Label className="text-[10px] text-muted-foreground">R$/h</Label>
              <Input
                type="number"
                min="0"
                value={welderRate}
                onChange={(e) => setWelderRate(Number(e.target.value))}
                className="text-xs h-7 font-mono"
              />
            </div>
          </div>
          <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300 font-mono text-right pt-1">
            Subtotal:{' '}
            {welderTotal.toLocaleString('pt-BR', {
              style: 'currency',
              currency: 'BRL',
            })}
          </div>
        </div>

        <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 space-y-2">
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
            Encanador Industrial / Tubulações
          </span>
          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-0.5">
              <Label className="text-[10px] text-muted-foreground">Qtd</Label>
              <Input
                type="number"
                min="0"
                value={plumberCount}
                onChange={(e) => setPlumberCount(Number(e.target.value))}
                className="text-xs h-7 font-mono"
              />
            </div>
            <div className="space-y-0.5">
              <Label className="text-[10px] text-muted-foreground">Horas</Label>
              <Input
                type="number"
                min="0"
                value={plumberHours}
                onChange={(e) => setPlumberHours(Number(e.target.value))}
                className="text-xs h-7 font-mono"
              />
            </div>
            <div className="space-y-0.5">
              <Label className="text-[10px] text-muted-foreground">R$/h</Label>
              <Input
                type="number"
                min="0"
                value={plumberRate}
                onChange={(e) => setPlumberRate(Number(e.target.value))}
                className="text-xs h-7 font-mono"
              />
            </div>
          </div>
          <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300 font-mono text-right pt-1">
            Subtotal:{' '}
            {plumberTotal.toLocaleString('pt-BR', {
              style: 'currency',
              currency: 'BRL',
            })}
          </div>
        </div>

        <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 space-y-2">
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
            Encarregado de Equipe / Supervisão
          </span>
          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-0.5">
              <Label className="text-[10px] text-muted-foreground">Qtd</Label>
              <Input
                type="number"
                min="0"
                value={foremanCount}
                onChange={(e) => setForemanCount(Number(e.target.value))}
                className="text-xs h-7 font-mono"
              />
            </div>
            <div className="space-y-0.5">
              <Label className="text-[10px] text-muted-foreground">Horas</Label>
              <Input
                type="number"
                min="0"
                value={foremanHours}
                onChange={(e) => setForemanHours(Number(e.target.value))}
                className="text-xs h-7 font-mono"
              />
            </div>
            <div className="space-y-0.5">
              <Label className="text-[10px] text-muted-foreground">R$/h</Label>
              <Input
                type="number"
                min="0"
                value={foremanRate}
                onChange={(e) => setForemanRate(Number(e.target.value))}
                className="text-xs h-7 font-mono"
              />
            </div>
          </div>
          <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300 font-mono text-right pt-1">
            Subtotal:{' '}
            {foremanTotal.toLocaleString('pt-BR', {
              style: 'currency',
              currency: 'BRL',
            })}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between p-3 bg-teal-50 dark:bg-teal-950/40 rounded-lg border border-teal-200 dark:border-teal-800">
        <span className="text-xs font-bold text-teal-900 dark:text-teal-200">
          Total da Mão de Obra ({totalLaborHours} horas homem)
        </span>
        <span className="font-mono font-bold text-sm text-teal-900 dark:text-teal-200">
          {totalLaborCost.toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL',
          })}
        </span>
      </div>
    </>
  )
}
