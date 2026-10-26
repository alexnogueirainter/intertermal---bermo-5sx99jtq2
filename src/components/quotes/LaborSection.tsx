import { IntegrationPermitPanel } from './IntegrationPermitPanel'
import { LaborRolesGrid } from './LaborRolesGrid'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { Dispatch, SetStateAction } from 'react'

interface LaborSectionProps {
  setInspectorCount: Dispatch<SetStateAction<number>>
  techHours: number
  setPlumberCount: Dispatch<SetStateAction<number>>
  welderRate: number
  foremanTotal: number
  setIntegrationRequired: Dispatch<SetStateAction<boolean>>
  setWelderCount: Dispatch<SetStateAction<number>>
  helperTotal: number
  setPlumberHours: Dispatch<SetStateAction<number>>
  plumberRate: number
  foremanHours: number
  setIntegrationWeekday: Dispatch<SetStateAction<string>>
  setWelderRate: Dispatch<SetStateAction<number>>
  setIntegrationCost: Dispatch<SetStateAction<number>>
  inspectorHours: number
  setForemanRate: Dispatch<SetStateAction<number>>
  inspectorCount: number
  setInspectorRate: Dispatch<SetStateAction<number>>
  inspectorTotal: number
  workPermitRequired: boolean
  foremanRate: number
  setIntegrationTiming: Dispatch<SetStateAction<'same_day' | 'early' | string>>
  plumberTotal: number
  helperHours: number
  setTechRate: Dispatch<SetStateAction<number>>
  totalLaborHours: number
  plumberCount: number
  helperCount: number
  foremanCount: number
  setHelperCount: Dispatch<SetStateAction<number>>
  setTechHours: Dispatch<SetStateAction<number>>
  techRate: number
  setHelperHours: Dispatch<SetStateAction<number>>
  setForemanCount: Dispatch<SetStateAction<number>>
  integrationRequired: boolean
  welderHours: number
  setWelderHours: Dispatch<SetStateAction<number>>
  totalLaborCost: number
  integrationTiming: 'same_day' | 'early' | string
  setWorkPermitRequired: Dispatch<SetStateAction<boolean>>
  plumberHours: number
  integrationWeekday: string
  inspectorRate: number
  setTechCount: Dispatch<SetStateAction<number>>
  setPlumberRate: Dispatch<SetStateAction<number>>
  techTotal: number
  integrationCost: number
  setHelperRate: Dispatch<SetStateAction<number>>
  setForemanHours: Dispatch<SetStateAction<number>>
  helperRate: number
  setInspectorHours: Dispatch<SetStateAction<number>>
  welderTotal: number
  welderCount: number
  techCount: number
}

export function LaborSection(props: LaborSectionProps) {
  return (
    <>
      {/* SEÇÃO 3B: Mão de Obra */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-xs">
        <CardHeader className="p-4 pb-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span className="flex items-center justify-center w-7 h-5 rounded bg-teal-600 text-white text-[11px] font-bold">
                3B
              </span>
              3B Mão de Obra
            </CardTitle>
            <span className="text-xs font-mono font-bold text-teal-700 dark:text-teal-400">
              Subtotal:{' '}
              {totalLaborCost.toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              })}
            </span>
          </div>
        </CardHeader>
        <CardContent className="p-4 space-y-4">
          <LaborRolesGrid {...props} />
          <IntegrationPermitPanel {...props} />
        </CardContent>
      </Card>
    </>
  )
}
