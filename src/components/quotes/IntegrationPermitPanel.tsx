import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { ShieldCheck, Users } from 'lucide-react'
import type { Dispatch, SetStateAction } from 'react'

interface IntegrationPermitPanelProps {
  integrationRequired: boolean
  setIntegrationRequired: Dispatch<SetStateAction<boolean>>
  integrationTiming: 'same_day' | 'early' | string
  setIntegrationTiming: Dispatch<SetStateAction<'same_day' | 'early' | string>>
  integrationWeekday: string
  setIntegrationWeekday: Dispatch<SetStateAction<string>>
  integrationCost: number
  setIntegrationCost: Dispatch<SetStateAction<number>>
  workPermitRequired: boolean
  setWorkPermitRequired: Dispatch<SetStateAction<boolean>>
}

export function IntegrationPermitPanel(props: IntegrationPermitPanelProps) {
  const {
    integrationRequired,
    setIntegrationRequired,
    integrationTiming,
    setIntegrationTiming,
    integrationWeekday,
    setIntegrationWeekday,
    integrationCost,
    setIntegrationCost,
    workPermitRequired,
    setWorkPermitRequired,
  } = props

  return (
    <>
      {/* Integração de Funcionários & Permissão de Trabalho (PT) */}
      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-teal-600" />
            <span className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
              Integração de Funcionários & Permissão de Trabalho (PT)
            </span>
          </div>
          {integrationRequired && (
            <Badge
              variant="outline"
              className="text-[10px] font-mono border-teal-300 text-teal-700 bg-teal-50 dark:bg-teal-950/40"
            >
              Custo Integração:{' '}
              {integrationCost.toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              })}
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Switch: Integração de Funcionários */}
          <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800">
            <div className="space-y-0.5 pr-2">
              <Label
                htmlFor="toggle-integration-needed"
                className="text-xs font-semibold cursor-pointer select-none text-slate-900 dark:text-slate-100 block"
              >
                Exige integração de funcionários no cliente?
              </Label>
              <span className="text-[10px] text-muted-foreground block">
                Habilita parâmetros de agendamento e custo de integração
              </span>
            </div>
            <Switch
              id="toggle-integration-needed"
              checked={integrationRequired}
              onCheckedChange={setIntegrationRequired}
            />
          </div>

          {/* Switch: Permissão de Trabalho (PT) */}
          <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800">
            <div className="space-y-0.5 pr-2">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-teal-600 shrink-0" />
                <Label
                  htmlFor="toggle-work-permit"
                  className="text-xs font-semibold cursor-pointer select-none text-slate-900 dark:text-slate-100 block"
                >
                  Exige liberação de Permissão de Trabalho (PT)?
                </Label>
              </div>
              <span className="text-[10px] text-muted-foreground block">
                Obrigatoriedade de liberação de segurança / APR antes da partida
              </span>
            </div>
            <Switch
              id="toggle-work-permit"
              checked={workPermitRequired}
              onCheckedChange={setWorkPermitRequired}
            />
          </div>
        </div>

        {/* Campos condicionais quando a integração está ativada */}
        {integrationRequired && (
          <div className="p-3 bg-white dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800 space-y-3">
            <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 block uppercase tracking-wider">
              Parâmetros da Integração
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1 sm:col-span-1">
                <Label className="text-[10px] text-muted-foreground font-medium block mb-1">
                  Dias da Integração
                </Label>
                <div className="flex flex-wrap gap-1">
                  {[
                    'Segunda-feira',
                    'Terça-feira',
                    'Quarta-feira',
                    'Quinta-feira',
                    'Sexta-feira',
                    'Sábado',
                    'Domingo',
                  ].map((day) => {
                    const currentDays = (integrationWeekday || '')
                      .split(',')
                      .map((d) => d.trim())
                      .filter(Boolean)
                    const isSelected = currentDays.includes(day)
                    const shortLabel = day.replace('-feira', '')

                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => {
                          let updated: string[]
                          if (isSelected) {
                            updated = currentDays.filter((d) => d !== day)
                          } else {
                            updated = [...currentDays, day]
                          }
                          setIntegrationWeekday(updated.join(','))
                        }}
                        className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors border ${
                          isSelected
                            ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                            : 'bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        {shortLabel}
                      </button>
                    )
                  })}
                </div>
                <span className="text-[9px] text-muted-foreground block mt-1">
                  {(() => {
                    const selected = (integrationWeekday || '')
                      .split(',')
                      .map((d) => d.trim())
                      .filter(Boolean)
                    if (selected.length === 0) return 'Nenhum dia selecionado'
                    return `${selected.length} dia${selected.length > 1 ? 's' : ''} selecionado${selected.length > 1 ? 's' : ''}`
                  })()}
                </span>
              </div>

              <div className="space-y-1">
                <Label className="text-[10px] text-muted-foreground font-medium">
                  Momento da Integração
                </Label>
                <Select
                  value={integrationTiming || 'same_day'}
                  onValueChange={setIntegrationTiming}
                >
                  <SelectTrigger className="text-xs h-8">
                    <SelectValue placeholder="Selecione o momento..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="same_day">No primeiro dia de serviço (same_day)</SelectItem>
                    <SelectItem value="early">Dia anterior / dedicado (early)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-[10px] text-muted-foreground font-medium">
                  Custo da Integração (R$)
                </Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={integrationCost}
                  onChange={(e) => setIntegrationCost(Number(e.target.value))}
                  placeholder="532.00"
                  className="text-xs h-8 font-mono font-semibold"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
