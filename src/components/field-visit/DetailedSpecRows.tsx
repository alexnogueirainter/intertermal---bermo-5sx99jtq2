import { Input } from '@/components/ui/input'
import { onlyNumericPtBR, type EquipmentItem } from '@/types/field-visit'
import { FLOW_UNIT_OPTIONS } from '@/components/field-visit/field-visit-options'
import type {
  FieldHighlightHelpers,
  RenderConfidenceBadge,
} from '@/components/field-visit/fieldVisitConfidence'

export function DetailedSpecRows({
  item,
  handleUpdateEquipment,
  markFieldAsManuallyEdited,
  fieldHighlight,
  renderConfidenceBadge,
}: {
  item: EquipmentItem
  handleUpdateEquipment: (id: string, updates: Partial<EquipmentItem>) => void
  markFieldAsManuallyEdited?: (equipmentId: string, fieldKey: string) => void
  fieldHighlight?: FieldHighlightHelpers
  renderConfidenceBadge?: RenderConfidenceBadge
}) {
  const mark = (key: string) => {
    if (markFieldAsManuallyEdited) markFieldAsManuallyEdited(item.id, key)
  }
  const hl = (key: string, val?: any) =>
    fieldHighlight ? fieldHighlight.highlightClass(item, key, val) : ''
  const badge = (key: string, val?: any) =>
    renderConfidenceBadge ? renderConfidenceBadge(item, key, val) : null
  return (
    <>
      {/* Linha 2: Quantidade de placas, Local instalado */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Quantidade de placas
            </label>
            {badge('plateCount', item.plateCount)}
          </div>
          <Input
            value={item.plateCount}
            onChange={(e) => {
              mark('plateCount')
              handleUpdateEquipment(item.id, { plateCount: e.target.value })
            }}
            placeholder="Ex.: 64 placas"
            className={`h-10 text-xs bg-slate-50/70 dark:bg-slate-950 ${hl('plateCount', item.plateCount)}`}
          />
          {(() => {
            const disc = item.nameplateOcrData?.discrepancies?.find(
              (d) => d.fieldKey === 'plateCount',
            )
            if (!disc) return null
            return (
              <p className="text-[10px] text-amber-700 dark:text-amber-400 mt-1 font-medium leading-tight">
                Placa indica {disc.plateValue} — campo preenchido com {disc.currentValue}
              </p>
            )
          })()}
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Local instalado
          </label>
          <Input
            value={item.installedLocation}
            onChange={(e) =>
              handleUpdateEquipment(item.id, {
                installedLocation: e.target.value,
              })
            }
            placeholder="Ex.: Setor de Evaporação / Mezanino 2"
            className="h-10 text-xs bg-slate-50/70 dark:bg-slate-950"
          />
        </div>
      </div>

      {/* Linha 3: Fluidos e Vazão */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Fluido 1 (Lado quente)
            </label>
            {badge('fluid1', item.fluid1)}
          </div>
          <Input
            value={item.fluid1}
            onChange={(e) => {
              mark('fluid1')
              handleUpdateEquipment(item.id, { fluid1: e.target.value })
            }}
            placeholder="Ex.: Vapor saturated 3 bar / Caldo"
            className={`h-10 text-xs bg-slate-50/70 dark:bg-slate-950 ${hl('fluid1', item.fluid1)}`}
          />
          {(() => {
            const disc = item.nameplateOcrData?.discrepancies?.find((d) => d.fieldKey === 'fluid1')
            if (!disc) return null
            return (
              <p className="text-[10px] text-amber-700 dark:text-amber-400 mt-1 font-medium leading-tight">
                Placa indica {disc.plateValue} — campo preenchido com {disc.currentValue}
              </p>
            )
          })()}
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Fluido 2 (Lado frio)
            </label>
            {badge('fluid2', item.fluid2)}
          </div>
          <Input
            value={item.fluid2}
            onChange={(e) => {
              mark('fluid2')
              handleUpdateEquipment(item.id, { fluid2: e.target.value })
            }}
            placeholder="Ex.: Água de resfriamento"
            className={`h-10 text-xs bg-slate-50/70 dark:bg-slate-950 ${hl('fluid2', item.fluid2)}`}
          />
          {(() => {
            const disc = item.nameplateOcrData?.discrepancies?.find((d) => d.fieldKey === 'fluid2')
            if (!disc) return null
            return (
              <p className="text-[10px] text-amber-700 dark:text-amber-400 mt-1 font-medium leading-tight">
                Placa indica {disc.plateValue} — campo preenchido com {disc.currentValue}
              </p>
            )
          })()}
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Vazão
            </label>
            {badge('flowRate', item.flowRate)}
          </div>
          <div className="flex gap-1.5">
            <Input
              value={item.flowRate}
              inputMode="decimal"
              onChange={(e) => {
                mark('flowRate')
                handleUpdateEquipment(item.id, {
                  flowRate: onlyNumericPtBR(e.target.value),
                })
              }}
              placeholder="Ex.: 45,5"
              className={`h-10 text-xs bg-slate-50/70 dark:bg-slate-950 ${hl('flowRate', item.flowRate)}`}
            />
            <select
              value={item.flowUnit || 'm³/h'}
              onChange={(e) => handleUpdateEquipment(item.id, { flowUnit: e.target.value })}
              className="h-10 text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-1.5 text-slate-700 dark:text-slate-300"
              title="Unidade da vazão"
            >
              {FLOW_UNIT_OPTIONS.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>
          {(() => {
            const disc = item.nameplateOcrData?.discrepancies?.find(
              (d) => d.fieldKey === 'flowRate',
            )
            if (!disc) return null
            return (
              <p className="text-[10px] text-amber-700 dark:text-amber-400 mt-1 font-medium leading-tight">
                Placa indica {disc.plateValue} — campo preenchido com {disc.currentValue}
              </p>
            )
          })()}
        </div>
      </div>

      {/* Linha 4: Temperaturas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Temperatura de entrada (°C)
          </label>
          <Input
            value={item.inletTemp}
            inputMode="decimal"
            onChange={(e) =>
              handleUpdateEquipment(item.id, {
                inletTemp: onlyNumericPtBR(e.target.value),
              })
            }
            placeholder="Ex.: 92,5"
            className="h-10 text-xs bg-slate-50/70 dark:bg-slate-950"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Temperatura de saída (°C)
          </label>
          <Input
            value={item.outletTemp}
            inputMode="decimal"
            onChange={(e) =>
              handleUpdateEquipment(item.id, {
                outletTemp: onlyNumericPtBR(e.target.value),
              })
            }
            placeholder="Ex.: 45,0"
            className="h-10 text-xs bg-slate-50/70 dark:bg-slate-950"
          />
        </div>
      </div>
    </>
  )
}
