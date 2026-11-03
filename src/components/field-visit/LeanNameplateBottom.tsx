import { Input } from '@/components/ui/input'
import { onlyNumericPtBR, type EquipmentItem } from '@/types/field-visit'
import type { RenderConfidenceBadge } from '@/components/field-visit/fieldVisitConfidence'

export function LeanNameplateSectionBottom({
  eq,
  handleUpdateEquipment,
  markFieldAsManuallyEdited,
  renderConfidenceBadge,
}: {
  eq: EquipmentItem
  handleUpdateEquipment: (id: string, updates: Partial<EquipmentItem>) => void
  markFieldAsManuallyEdited: (equipmentId: string, fieldKey: string) => void
  renderConfidenceBadge: RenderConfidenceBadge
}) {
  return (
    <>
      {/* Plaqueta - Linha 3: Peso, Ano, "a" máx, "a" mín */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300">
              Peso Vazio (kgf)
            </label>
            {renderConfidenceBadge(eq, 'emptyWeightKg', eq.emptyWeightKg)}
          </div>
          <Input
            value={eq.emptyWeightKg || ''}
            inputMode="decimal"
            onChange={(e) => {
              markFieldAsManuallyEdited(eq.id, 'emptyWeightKg')
              handleUpdateEquipment(eq.id, {
                emptyWeightKg: onlyNumericPtBR(e.target.value),
              })
            }}
            placeholder="Ex.: 164,30"
            className="h-9 text-xs bg-white dark:bg-slate-900"
          />
          {(() => {
            const disc = eq.nameplateOcrData?.discrepancies?.find(
              (d) => d.fieldKey === 'emptyWeightKg',
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
          <div className="flex items-center justify-between mb-1">
            <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300">
              Ano de Fabricação
            </label>
            {renderConfidenceBadge(eq, 'manufacturingYear', eq.manufacturingYear)}
          </div>
          <Input
            value={eq.manufacturingYear || ''}
            inputMode="numeric"
            maxLength={4}
            onChange={(e) => {
              markFieldAsManuallyEdited(eq.id, 'manufacturingYear')
              handleUpdateEquipment(eq.id, {
                manufacturingYear: e.target.value.replace(/\D/g, ''),
              })
            }}
            placeholder="Ex.: 2025"
            className="h-9 text-xs bg-white dark:bg-slate-900"
          />
          {(() => {
            const disc = eq.nameplateOcrData?.discrepancies?.find(
              (d) => d.fieldKey === 'manufacturingYear',
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
          <div className="flex items-center justify-between mb-1">
            <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300">
              &quot;a&quot; Máximo (mm)
            </label>
            {renderConfidenceBadge(eq, 'tighteningMaxA', eq.tighteningMaxA)}
          </div>
          <Input
            value={eq.tighteningMaxA || ''}
            inputMode="decimal"
            onChange={(e) => {
              markFieldAsManuallyEdited(eq.id, 'tighteningMaxA')
              handleUpdateEquipment(eq.id, {
                tighteningMaxA: onlyNumericPtBR(e.target.value),
              })
            }}
            placeholder="Ex.: 66"
            className="h-9 text-xs bg-white dark:bg-slate-900"
          />
          {(() => {
            const disc = eq.nameplateOcrData?.discrepancies?.find(
              (d) => d.fieldKey === 'tighteningMaxA',
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
          <div className="flex items-center justify-between mb-1">
            <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300">
              &quot;a&quot; Mínimo (mm)
            </label>
            {renderConfidenceBadge(eq, 'tighteningMinA', eq.tighteningMinA)}
          </div>
          <Input
            value={eq.tighteningMinA || ''}
            inputMode="decimal"
            onChange={(e) => {
              markFieldAsManuallyEdited(eq.id, 'tighteningMinA')
              handleUpdateEquipment(eq.id, {
                tighteningMinA: onlyNumericPtBR(e.target.value),
              })
            }}
            placeholder="Ex.: 70"
            className="h-9 text-xs bg-white dark:bg-slate-900"
          />
          {(() => {
            const disc = eq.nameplateOcrData?.discrepancies?.find(
              (d) => d.fieldKey === 'tighteningMinA',
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
    </>
  )
}
