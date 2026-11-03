import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardContent } from '@/components/ui/card'
import { toast } from '@/hooks/use-toast'
import { VoiceDictationField } from '@/components/VoiceDictationField'
import { EquipmentMediaAttachmentSection } from '@/components/EquipmentMediaAttachmentSection'
import { EquipmentCustomFieldsSection } from '@/components/EquipmentCustomFieldsSection'
import { LeanNameplateSectionTop } from '@/components/field-visit/LeanNameplateTop'
import { LeanNameplateSectionBottom } from '@/components/field-visit/LeanNameplateBottom'
import type { FieldHighlightHelpers } from '@/components/field-visit/fieldVisitConfidence'
import { generateId } from '@/types/field-visit'
import type { EquipmentItem, MediaAttachment, FieldVisitData } from '@/types/field-visit'
import type { Dispatch, SetStateAction } from 'react'
import type { RenderConfidenceBadge } from '@/components/field-visit/fieldVisitConfidence'

export function LeanEquipmentCard({
  eq,
  index,
  setVisit,
  handleUpdateEquipment,
  markFieldAsManuallyEdited,
  renderConfidenceBadge,
  fieldHighlight,
  handleAddEquipmentAttachments,
  handleRemoveEquipmentAttachment,
  handleTriggerNameplateOcr,
  setEquipmentToDelete,
  isReadingNameplate,
  readingEquipmentId,
  activeReadingAttachmentId,
  nameplateReadingStatus,
  isCompressingGlobal,
}: {
  eq: EquipmentItem
  index: number
  setVisit: Dispatch<SetStateAction<FieldVisitData>>
  handleUpdateEquipment: (id: string, updates: Partial<EquipmentItem>) => void
  markFieldAsManuallyEdited: (equipmentId: string, fieldKey: string) => void
  renderConfidenceBadge: RenderConfidenceBadge
  fieldHighlight: FieldHighlightHelpers
  handleAddEquipmentAttachments: (equipmentId: string, files: FileList | null) => Promise<void>
  handleRemoveEquipmentAttachment: (equipmentId: string, attachmentId: string) => void
  handleTriggerNameplateOcr: (equipmentId: string, photo: MediaAttachment) => Promise<void>
  setEquipmentToDelete: (id: string | null) => void
  isReadingNameplate: boolean
  readingEquipmentId: string | null
  activeReadingAttachmentId: string | null
  nameplateReadingStatus: string
  isCompressingGlobal: boolean
}) {
  const padStr = String(index + 1).padStart(2, '0')
  const eqLabel = eq.name || `Equipamento ${padStr}`
  return (
    <Card
      key={eq.id}
      className="border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900 overflow-hidden"
    >
      <CardHeader className="bg-slate-50/80 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 py-3 px-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="h-6 w-6 rounded-full bg-teal-700 text-white text-xs font-bold flex items-center justify-center">
              {index + 1}
            </span>
            <Input
              value={eq.name || `Equipamento ${padStr}`}
              onChange={(e) => handleUpdateEquipment(eq.id, { name: e.target.value })}
              placeholder={`Equipamento ${padStr}`}
              className="h-8 text-xs font-bold w-48 bg-white dark:bg-slate-900"
            />
          </div>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setEquipmentToDelete(eq.id)}
            className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950 h-8 px-2 text-xs"
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Remover
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-4 space-y-4">
        {/* Identificação rápida opcional */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Série
            </label>
            <Input
              value={eq.serialNumber}
              onChange={(e) => {
                markFieldAsManuallyEdited(eq.id, 'serialNumber')
                handleUpdateEquipment(eq.id, { serialNumber: e.target.value })
              }}
              placeholder="Ex.: 30105-884"
              className={`h-10 text-xs bg-slate-50/70 dark:bg-slate-950 ${fieldHighlight.highlightClass(eq, 'serialNumber', eq.serialNumber)}`}
            />
            {(() => {
              const disc = eq.nameplateOcrData?.discrepancies?.find(
                (d) => d.fieldKey === 'serialNumber',
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
              Local Instalado / Linha (Opcional)
            </label>
            <Input
              value={eq.installedLocation}
              onChange={(e) =>
                handleUpdateEquipment(eq.id, {
                  installedLocation: e.target.value,
                })
              }
              placeholder="Ex.: Linha 02 - Mezanino"
              className="h-10 text-xs bg-slate-50/70 dark:bg-slate-950"
            />
          </div>
        </div>

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
                  Informações gravadas na plaqueta de fábrica (todos opcionais)
                </p>
              </div>
            </div>
            <span className="text-[10px] font-medium text-teal-700 dark:text-teal-300 bg-teal-100/80 dark:bg-teal-900/60 px-2 py-0.5 rounded-full">
              Plaqueta de fábrica
            </span>
          </div>

          <LeanNameplateSectionTop
            eq={eq}
            handleUpdateEquipment={handleUpdateEquipment}
            markFieldAsManuallyEdited={markFieldAsManuallyEdited}
            renderConfidenceBadge={renderConfidenceBadge}
            fieldHighlight={fieldHighlight}
          />
          <LeanNameplateSectionBottom
            eq={eq}
            handleUpdateEquipment={handleUpdateEquipment}
            markFieldAsManuallyEdited={markFieldAsManuallyEdited}
            renderConfidenceBadge={renderConfidenceBadge}
            fieldHighlight={fieldHighlight}
          />
        </div>
        <EquipmentMediaAttachmentSection
          title={`Anexos de ${eqLabel}`}
          description="Fotos da placa (leitura automática por IA), detalhes mecânicos ou vídeos deste equipamento"
          attachments={eq.attachments || []}
          onAddFiles={(files) => handleAddEquipmentAttachments(eq.id, files)}
          onRemoveAttachment={(attId) => handleRemoveEquipmentAttachment(eq.id, attId)}
          onReadNameplatePhoto={(photo) => handleTriggerNameplateOcr(eq.id, photo)}
          isReadingNameplate={isReadingNameplate && readingEquipmentId === eq.id}
          activeReadingAttachmentId={activeReadingAttachmentId}
          readingStatusText={nameplateReadingStatus}
          isCompressing={isCompressingGlobal}
        />
        <EquipmentCustomFieldsSection
          customFields={eq.customFields || []}
          onChange={(fields) => handleUpdateEquipment(eq.id, { customFields: fields })}
          confidenceMap={eq.nameplateOcrData?.confidence}
        />

        {/* CAMPO DE DECISÃO: NECESSITA DE MANUTENÇÃO? */}
        <div
          className={`p-3.5 rounded-xl border-2 transition-all space-y-2.5 ${
            eq.needsMaintenance === true
              ? 'bg-amber-50/80 dark:bg-amber-950/40 border-amber-400 dark:border-amber-600'
              : eq.needsMaintenance === false
                ? 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-700'
                : 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-300 dark:border-rose-800'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <label className="block text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <span>Necessita de Manutenção?</span>
                <span className="text-rose-600 font-bold">*</span>
                {eq.needsMaintenance === undefined && (
                  <span className="text-[10px] text-rose-600 font-normal">
                    (obrigatório responder)
                  </span>
                )}
              </label>
              <p className="text-[11px] text-muted-foreground">
                Indique se este equipamento precisa de intervenção ou reparo
              </p>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <Button
                type="button"
                size="sm"
                onClick={() => handleUpdateEquipment(eq.id, { needsMaintenance: true })}
                className={`h-8 px-3 text-xs font-bold transition-all ${
                  eq.needsMaintenance === true
                    ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 hover:bg-amber-50'
                }`}
              >
                Sim, necessita
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() =>
                  handleUpdateEquipment(eq.id, {
                    needsMaintenance: false,
                    maintenanceNotes: '',
                  })
                }
                className={`h-8 px-3 text-xs font-bold transition-all ${
                  eq.needsMaintenance === false
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 hover:bg-emerald-50'
                }`}
              >
                Não
              </Button>
            </div>
          </div>

          {/* Se Sim: textarea de recomendações e identificações */}
          {eq.needsMaintenance === true && (
            <div className="pt-2 border-t border-amber-200 dark:border-amber-900/60 space-y-1 animate-in fade-in duration-200">
              <label className="block text-[11px] font-bold text-amber-900 dark:text-amber-200">
                O que foi identificado e recomendações do técnico:
              </label>
              <textarea
                value={eq.maintenanceNotes || ''}
                onChange={(e) =>
                  handleUpdateEquipment(eq.id, {
                    maintenanceNotes: e.target.value,
                  })
                }
                placeholder="Descreva problemas observados (ex.: vazamento nas gaxetas, placas incrustadas, corrosão, deformação) e a intervenção recomendada..."
                rows={3}
                className="w-full text-xs rounded-lg border border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-900 p-2 text-slate-900 dark:text-slate-100 placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
          )}
        </div>

        {/* Observações com Voz para este equipamento */}
        <VoiceDictationField
          label={`Observações do técnico sobre ${eqLabel}`}
          sublabel="Digite ou grave sua fala com transcrição automática"
          value={eq.technicianNotes}
          onChange={(val) => handleUpdateEquipment(eq.id, { technicianNotes: val })}
          onSaveAudioAttachment={(audioFile) => {
            const newAtt: MediaAttachment = {
              id: generateId(),
              type: 'audio',
              name: audioFile.name,
              dataUrl: audioFile.dataUrl,
              size: audioFile.blob.size,
              createdAt: new Date().toISOString(),
            }
            setVisit((prev) => ({
              ...prev,
              equipments: prev.equipments.map((item) =>
                item.id === eq.id
                  ? {
                      ...item,
                      attachments: [...(item.attachments || []), newAtt],
                    }
                  : item,
              ),
            }))
            toast({
              title: 'Áudio anexado ao equipamento',
              description: `Gravação salva nos anexos de ${eqLabel}.`,
            })
          }}
          placeholder="Descreva detalhes específicos, medidas, pontos críticos ou necessidades deste equipamento..."
          rows={3}
        />
      </CardContent>
    </Card>
  )
}
