import { Input } from '@/components/ui/input'
import { onlyNumericPtBR, type EquipmentItem } from '@/types/field-visit'
import type {
  FieldHighlightHelpers,
  RenderConfidenceBadge,
} from '@/components/field-visit/fieldVisitConfidence'
import { NameplateEvidencePhoto } from '@/components/field-visit/NameplateEvidencePhoto'

export function DetailedNameplateSection({
  item,
  handleUpdateEquipment,
  markFieldAsManuallyEdited,
  renderConfidenceBadge,
  fieldHighlight,
}: {
  item: EquipmentItem
  handleUpdateEquipment: (id: string, updates: Partial<EquipmentItem>) => void
  markFieldAsManuallyEdited: (equipmentId: string, fieldKey: string) => void
  renderConfidenceBadge: RenderConfidenceBadge
  fieldHighlight: FieldHighlightHelpers
}) {
  return (
    <>
      {/* SUB-SEÇÃO: DADOS DA PLAQUETA DE IDENTIFICAÇÃO (Plaqueta BERMO) */}
      <div className="rounded-xl border border-teal-200/80 dark:border-teal-900/60 bg-teal-50/30 dark:bg-teal-950/20 p-3.5 space-y-3">
        <div className="flex items-center justify-between gap-2 border-b border-teal-200/60 dark:border-teal-900/40 pb-2">
          <div className="flex items-center gap-2">
            <span className="h-6 w-6 rounded-md bg-teal-700 text-white flex items-center justify-center text-xs font-bold shadow-2xs">
              🏷️
            </span>
            <div>
              <h4 className="text-xs font-bold text-teal-950 dark:text-teal-200 tracking-tight">
                Dados da Plaqueta de Identificação (BERMO)
              </h4>
              <p className="text-[10.5px] text-teal-800/80 dark:text-teal-400">
                Informações gravadas na plaqueta de fábrica do trocador de calor (todos opcionais)
              </p>
            </div>
          </div>
          <span className="text-[10px] font-medium text-teal-700 dark:text-teal-300 bg-teal-100/80 dark:bg-teal-900/60 px-2 py-0.5 rounded-full">
            Referência de campo
          </span>
        </div>
        {/* Foto da placa usada na leitura, ao lado dos campos para conferência */}
        <NameplateEvidencePhoto eq={item} />
        {/* Plaqueta - Linha 1: Serviço e Nº de Fabricação */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                Serviço
              </label>
              {renderConfidenceBadge(item, 'service', item.service)}
            </div>
            <Input
              value={item.service || ''}
              onChange={(e) => {
                markFieldAsManuallyEdited(item.id, 'service')
                handleUpdateEquipment(item.id, { service: e.target.value })
              }}
              placeholder="Ex.: RESFRIAMENTO, AQUECIMENTO, CONDENSAÇÃO"
              className={`h-9 text-xs bg-white dark:bg-slate-900 ${fieldHighlight.highlightClass(item, 'service', item.service)}`}
            />
            {(() => {
              const disc = item.nameplateOcrData?.discrepancies?.find(
                (d) => d.fieldKey === 'service',
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
                Nº de Fabricação
              </label>
              {renderConfidenceBadge(item, 'manufacturingNumber', item.manufacturingNumber)}
            </div>
            <Input
              value={item.manufacturingNumber || ''}
              onChange={(e) => {
                markFieldAsManuallyEdited(item.id, 'manufacturingNumber')
                handleUpdateEquipment(item.id, {
                  manufacturingNumber: e.target.value,
                })
              }}
              placeholder="Ex.: 639.065"
              className={`h-9 text-xs bg-white dark:bg-slate-900 font-mono ${fieldHighlight.highlightClass(item, 'manufacturingNumber', item.manufacturingNumber)}`}
            />
            {(() => {
              const disc = item.nameplateOcrData?.discrepancies?.find(
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
        </div>

        {/* Plaqueta - Linha 2: Pressão Projeto, Pressão Teste, Temp Projeto, PMTA */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                Pressão de Projeto (bar)
              </label>
              {renderConfidenceBadge(item, 'designPressureBar', item.designPressureBar)}
            </div>
            <Input
              value={item.designPressureBar || ''}
              inputMode="decimal"
              onChange={(e) => {
                markFieldAsManuallyEdited(item.id, 'designPressureBar')
                handleUpdateEquipment(item.id, {
                  designPressureBar: onlyNumericPtBR(e.target.value),
                })
              }}
              placeholder="Ex.: 10,00"
              className={`h-9 text-xs bg-white dark:bg-slate-900 ${fieldHighlight.highlightClass(item, 'designPressureBar', item.designPressureBar)}`}
            />
            {(() => {
              const disc = item.nameplateOcrData?.discrepancies?.find(
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
              {renderConfidenceBadge(item, 'testPressureBar', item.testPressureBar)}
            </div>
            <Input
              value={item.testPressureBar || ''}
              inputMode="decimal"
              onChange={(e) => {
                markFieldAsManuallyEdited(item.id, 'testPressureBar')
                handleUpdateEquipment(item.id, {
                  testPressureBar: onlyNumericPtBR(e.target.value),
                })
              }}
              placeholder="Ex.: 13,00"
              className={`h-9 text-xs bg-white dark:bg-slate-900 ${fieldHighlight.highlightClass(item, 'testPressureBar', item.testPressureBar)}`}
            />
            {(() => {
              const disc = item.nameplateOcrData?.discrepancies?.find(
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
              {renderConfidenceBadge(item, 'designTempC', item.designTempC)}
            </div>
            <Input
              value={item.designTempC || ''}
              inputMode="decimal"
              onChange={(e) => {
                markFieldAsManuallyEdited(item.id, 'designTempC')
                handleUpdateEquipment(item.id, {
                  designTempC: onlyNumericPtBR(e.target.value),
                })
              }}
              placeholder="Ex.: 165"
              className={`h-9 text-xs bg-white dark:bg-slate-900 ${fieldHighlight.highlightClass(item, 'designTempC', item.designTempC)}`}
            />
            {(() => {
              const disc = item.nameplateOcrData?.discrepancies?.find(
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
              {renderConfidenceBadge(item, 'pmtaMpa', item.pmtaMpa)}
            </div>
            <Input
              value={item.pmtaMpa || ''}
              inputMode="decimal"
              onChange={(e) => {
                markFieldAsManuallyEdited(item.id, 'pmtaMpa')
                handleUpdateEquipment(item.id, {
                  pmtaMpa: onlyNumericPtBR(e.target.value),
                })
              }}
              placeholder="Ex.: 1,30"
              className={`h-9 text-xs bg-white dark:bg-slate-900 ${fieldHighlight.highlightClass(item, 'pmtaMpa', item.pmtaMpa)}`}
            />
            {(() => {
              const disc = item.nameplateOcrData?.discrepancies?.find(
                (d) => d.fieldKey === 'pmtaMpa',
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

        {/* Plaqueta - Linha 3: Peso Vazio, Ano Fabr., "a" Máx, "a" Mín */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                Peso Vazio (kgf)
              </label>
              {renderConfidenceBadge(item, 'emptyWeightKg', item.emptyWeightKg)}
            </div>
            <Input
              value={item.emptyWeightKg || ''}
              inputMode="decimal"
              onChange={(e) => {
                markFieldAsManuallyEdited(item.id, 'emptyWeightKg')
                handleUpdateEquipment(item.id, {
                  emptyWeightKg: onlyNumericPtBR(e.target.value),
                })
              }}
              placeholder="Ex.: 164,30"
              className={`h-9 text-xs bg-white dark:bg-slate-900 ${fieldHighlight.highlightClass(item, 'emptyWeightKg', item.emptyWeightKg)}`}
            />
            {(() => {
              const disc = item.nameplateOcrData?.discrepancies?.find(
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
              {renderConfidenceBadge(item, 'manufacturingYear', item.manufacturingYear)}
            </div>
            <Input
              value={item.manufacturingYear || ''}
              inputMode="numeric"
              maxLength={4}
              onChange={(e) => {
                markFieldAsManuallyEdited(item.id, 'manufacturingYear')
                handleUpdateEquipment(item.id, {
                  manufacturingYear: e.target.value.replace(/\D/g, ''),
                })
              }}
              placeholder="Ex.: 2025"
              className={`h-9 text-xs bg-white dark:bg-slate-900 ${fieldHighlight.highlightClass(item, 'manufacturingYear', item.manufacturingYear)}`}
            />
            {(() => {
              const disc = item.nameplateOcrData?.discrepancies?.find(
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
              {renderConfidenceBadge(item, 'tighteningMaxA', item.tighteningMaxA)}
            </div>
            <Input
              value={item.tighteningMaxA || ''}
              inputMode="decimal"
              onChange={(e) => {
                markFieldAsManuallyEdited(item.id, 'tighteningMaxA')
                handleUpdateEquipment(item.id, {
                  tighteningMaxA: onlyNumericPtBR(e.target.value),
                })
              }}
              placeholder="Ex.: 66"
              className={`h-9 text-xs bg-white dark:bg-slate-900 ${fieldHighlight.highlightClass(item, 'tighteningMaxA', item.tighteningMaxA)}`}
            />
            {(() => {
              const disc = item.nameplateOcrData?.discrepancies?.find(
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
              {renderConfidenceBadge(item, 'tighteningMinA', item.tighteningMinA)}
            </div>
            <Input
              value={item.tighteningMinA || ''}
              inputMode="decimal"
              onChange={(e) => {
                markFieldAsManuallyEdited(item.id, 'tighteningMinA')
                handleUpdateEquipment(item.id, {
                  tighteningMinA: onlyNumericPtBR(e.target.value),
                })
              }}
              placeholder="Ex.: 70"
              className={`h-9 text-xs bg-white dark:bg-slate-900 ${fieldHighlight.highlightClass(item, 'tighteningMinA', item.tighteningMinA)}`}
            />
            {(() => {
              const disc = item.nameplateOcrData?.discrepancies?.find(
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
      </div>
    </>
  )
}
