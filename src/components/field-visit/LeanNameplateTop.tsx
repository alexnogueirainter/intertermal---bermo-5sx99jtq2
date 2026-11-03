import { Input } from '@/components/ui/input'
import { onlyNumericPtBR, type EquipmentItem } from '@/types/field-visit'
import type { RenderConfidenceBadge } from '@/components/field-visit/fieldVisitConfidence'

export function LeanNameplateSectionTop({
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
      {/* Plaqueta - Linha 1: Serviço, Nº Fabricação, Tag */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300">
              Serviço
            </label>
            {renderConfidenceBadge(eq, 'service', eq.service)}
          </div>
          <Input
            value={eq.service || ''}
            onChange={(e) => {
              markFieldAsManuallyEdited(eq.id, 'service')
              handleUpdateEquipment(eq.id, { service: e.target.value })
            }}
            placeholder="Ex.: RESFRIAMENTO"
            className="h-9 text-xs bg-white dark:bg-slate-900"
          />
          {(() => {
            const disc = eq.nameplateOcrData?.discrepancies?.find((d) => d.fieldKey === 'service')
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
              Nº de Fabricação
            </label>
            {renderConfidenceBadge(eq, 'manufacturingNumber', eq.manufacturingNumber)}
          </div>
          <Input
            value={eq.manufacturingNumber || ''}
            onChange={(e) => {
              markFieldAsManuallyEdited(eq.id, 'manufacturingNumber')
              handleUpdateEquipment(eq.id, {
                manufacturingNumber: e.target.value,
              })
            }}
            placeholder="Ex.: 639.065"
            className="h-9 text-xs bg-white dark:bg-slate-900 font-mono"
          />
          {(() => {
            const disc = eq.nameplateOcrData?.discrepancies?.find(
              (d) => d.fieldKey === 'manufacturingNumber',
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
              Tag do Equipamento
            </label>
            {renderConfidenceBadge(eq, 'tag', eq.tag)}
          </div>
          <Input
            value={eq.tag || ''}
            onChange={(e) => {
              markFieldAsManuallyEdited(eq.id, 'tag')
              handleUpdateEquipment(eq.id, { tag: e.target.value })
            }}
            placeholder="Ex.: TC-01 / TQ-101"
            className="h-9 text-xs bg-white dark:bg-slate-900"
          />
          {(() => {
            const disc = eq.nameplateOcrData?.discrepancies?.find((d) => d.fieldKey === 'tag')
            if (!disc) return null
            return (
              <p className="text-[10px] text-amber-700 dark:text-amber-400 mt-1 font-medium leading-tight">
                Placa indica {disc.plateValue} — campo preenchido com {disc.currentValue}
              </p>
            )
          })()}
        </div>
      </div>

      {/* Plaqueta - Linha 2: Pressões, Temperatura, PMTA */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300">
              Pressão de Projeto (bar)
            </label>
            {renderConfidenceBadge(eq, 'designPressureBar', eq.designPressureBar)}
          </div>
          <Input
            value={eq.designPressureBar || ''}
            inputMode="decimal"
            onChange={(e) => {
              markFieldAsManuallyEdited(eq.id, 'designPressureBar')
              handleUpdateEquipment(eq.id, {
                designPressureBar: onlyNumericPtBR(e.target.value),
              })
            }}
            placeholder="Ex.: 10,00"
            className="h-9 text-xs bg-white dark:bg-slate-900"
          />
          {(() => {
            const disc = eq.nameplateOcrData?.discrepancies?.find(
              (d) => d.fieldKey === 'designPressureBar',
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
              Pressão de Teste (bar)
            </label>
            {renderConfidenceBadge(eq, 'testPressureBar', eq.testPressureBar)}
          </div>
          <Input
            value={eq.testPressureBar || ''}
            inputMode="decimal"
            onChange={(e) => {
              markFieldAsManuallyEdited(eq.id, 'testPressureBar')
              handleUpdateEquipment(eq.id, {
                testPressureBar: onlyNumericPtBR(e.target.value),
              })
            }}
            placeholder="Ex.: 13,00"
            className="h-9 text-xs bg-white dark:bg-slate-900"
          />
          {(() => {
            const disc = eq.nameplateOcrData?.discrepancies?.find(
              (d) => d.fieldKey === 'testPressureBar',
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
              Temp. de Projeto (°C)
            </label>
            {renderConfidenceBadge(eq, 'designTempC', eq.designTempC)}
          </div>
          <Input
            value={eq.designTempC || ''}
            inputMode="decimal"
            onChange={(e) => {
              markFieldAsManuallyEdited(eq.id, 'designTempC')
              handleUpdateEquipment(eq.id, {
                designTempC: onlyNumericPtBR(e.target.value),
              })
            }}
            placeholder="Ex.: 165"
            className="h-9 text-xs bg-white dark:bg-slate-900"
          />
          {(() => {
            const disc = eq.nameplateOcrData?.discrepancies?.find(
              (d) => d.fieldKey === 'designTempC',
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
              PMTA (MPa)
            </label>
            {renderConfidenceBadge(eq, 'pmtaMpa', eq.pmtaMpa)}
          </div>
          <Input
            value={eq.pmtaMpa || ''}
            inputMode="decimal"
            onChange={(e) => {
              markFieldAsManuallyEdited(eq.id, 'pmtaMpa')
              handleUpdateEquipment(eq.id, {
                pmtaMpa: onlyNumericPtBR(e.target.value),
              })
            }}
            placeholder="Ex.: 1,30"
            className="h-9 text-xs bg-white dark:bg-slate-900"
          />
          {(() => {
            const disc = eq.nameplateOcrData?.discrepancies?.find((d) => d.fieldKey === 'pmtaMpa')
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
