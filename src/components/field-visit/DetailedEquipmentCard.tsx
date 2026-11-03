import { Trash2, Plus, CheckCircle2, Layers, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/hooks/use-toast'
import { VoiceDictationField } from '@/components/VoiceDictationField'
import { EquipmentMediaAttachmentSection } from '@/components/EquipmentMediaAttachmentSection'
import { EquipmentCustomFieldsSection } from '@/components/EquipmentCustomFieldsSection'
import { DetailedNameplateSection } from '@/components/field-visit/DetailedNameplateSection'
import { DetailedSpecRows } from '@/components/field-visit/DetailedSpecRows'
import type { FieldHighlightHelpers } from '@/components/field-visit/fieldVisitConfidence'
import {
  DIFFICULTY_OPTIONS,
  MANUFACTURER_PRESETS,
} from '@/components/field-visit/field-visit-options'
import { generateId, formatEquipmentTitle } from '@/types/field-visit'
import type { EquipmentItem, MediaAttachment, FieldVisitData } from '@/types/field-visit'
import type { Dispatch, SetStateAction } from 'react'
import type { RenderConfidenceBadge } from '@/components/field-visit/fieldVisitConfidence'

export function DetailedEquipmentCard({
  item,
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
  item: EquipmentItem
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
  return (
    <Card
      key={item.id}
      className="border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900 overflow-hidden"
    >
      <CardHeader className="bg-slate-50/80 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 py-3 px-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="h-6 w-6 rounded-full bg-teal-700 text-white text-xs font-bold flex items-center justify-center">
              {index + 1}
            </span>
            <CardTitle className="text-sm font-bold truncate">
              {formatEquipmentTitle(item, index)}
            </CardTitle>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setEquipmentToDelete(item.id)}
            className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950 h-8 px-2 text-xs"
            title="Remover este equipamento"
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Remover
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-4 space-y-4">
        {/* Linha 1: Modelo, Série, Fabricante, Tag */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Modelo
            </label>
            <Input
              value={item.model}
              onChange={(e) => handleUpdateEquipment(item.id, { model: e.target.value })}
              placeholder="Ex.: BP 60 B"
              className={`h-10 text-xs bg-slate-50/70 dark:bg-slate-950 ${fieldHighlight.highlightClass(item, 'model', item.model)}`}
            />
            {(() => {
              const disc = item.nameplateOcrData?.discrepancies?.find((d) => d.fieldKey === 'model')
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
              Série
            </label>
            <Input
              value={item.serialNumber}
              onChange={(e) => handleUpdateEquipment(item.id, { serialNumber: e.target.value })}
              placeholder="Ex.: 30105-884"
              className={`h-10 text-xs bg-slate-50/70 dark:bg-slate-950 ${fieldHighlight.highlightClass(item, 'serialNumber', item.serialNumber)}`}
            />
            {(() => {
              const disc = item.nameplateOcrData?.discrepancies?.find(
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
              Fabricante
            </label>
            {(() => {
              const isPreset =
                !item.manufacturer ||
                MANUFACTURER_PRESETS.some(
                  (m) => m.toLowerCase() === (item.manufacturer || '').toLowerCase(),
                )
              const presetValue = isPreset ? item.manufacturer || '' : 'OUTROS'
              return (
                <div className="flex gap-1.5">
                  <select
                    value={presetValue}
                    onChange={(e) => {
                      const v = e.target.value
                      if (v === 'OUTROS') {
                        if (!item.manufacturer) {
                          handleUpdateEquipment(item.id, { manufacturer: '' })
                        }
                      } else {
                        handleUpdateEquipment(item.id, { manufacturer: v })
                      }
                    }}
                    className="h-10 text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-1.5 text-slate-700 dark:text-slate-300 shrink-0 w-[42%]"
                    title="Selecione o fabricante"
                  >
                    <option value="">—</option>
                    {MANUFACTURER_PRESETS.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                    <option value="OUTROS">Outros</option>
                  </select>
                  {!isPreset && (
                    <Input
                      value={item.manufacturer}
                      onChange={(e) =>
                        handleUpdateEquipment(item.id, {
                          manufacturer: e.target.value,
                        })
                      }
                      placeholder="Digite o fabricante"
                      className="h-10 text-xs bg-slate-50/70 dark:bg-slate-950"
                      autoFocus
                    />
                  )}
                </div>
              )
            })()}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Tag do Equipamento (Opcional)
            </label>
            <Input
              value={item.tag || ''}
              onChange={(e) => handleUpdateEquipment(item.id, { tag: e.target.value })}
              placeholder="Ex.: TQ-101 / TC-01"
              className={`h-10 text-xs bg-slate-50/70 dark:bg-slate-950 ${fieldHighlight.highlightClass(item, 'tag', item.tag)}`}
            />
            {(() => {
              const disc = item.nameplateOcrData?.discrepancies?.find((d) => d.fieldKey === 'tag')
              if (!disc) return null
              return (
                <p className="text-[10px] text-amber-700 dark:text-amber-400 mt-1 font-medium leading-tight">
                  Placa indica {disc.plateValue} — campo preenchido com {disc.currentValue}
                </p>
              )
            })()}
          </div>
        </div>

        <DetailedNameplateSection
          item={item}
          handleUpdateEquipment={handleUpdateEquipment}
          markFieldAsManuallyEdited={markFieldAsManuallyEdited}
          renderConfidenceBadge={renderConfidenceBadge}
          fieldHighlight={fieldHighlight}
        />

        <DetailedSpecRows item={item} handleUpdateEquipment={handleUpdateEquipment} />
        {/* Grau de dificuldade (Apenas condições físicas do local de instalação) */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Grau de dificuldade do local de instalação
            </label>
            <span className="text-[10px] text-muted-foreground">
              Acesso, altura, espaço confinado
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {DIFFICULTY_OPTIONS.map((diff) => {
              const isSelected = item.difficulty === diff.level
              return (
                <button
                  key={diff.level}
                  type="button"
                  onClick={() => handleUpdateEquipment(item.id, { difficulty: diff.level })}
                  className={`h-11 rounded-lg border-2 text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    isSelected
                      ? `${diff.color} ring-1 ring-offset-1`
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-900'
                  }`}
                >
                  {isSelected && <CheckCircle2 className="h-3.5 w-3.5" />}
                  {diff.level}
                </button>
              )
            })}
          </div>
        </div>

        {/* Campos Complementares Dinâmicos da Plaqueta (Novos campos sem alterar existentes) */}
        <EquipmentCustomFieldsSection
          customFields={item.customFields || []}
          onChange={(fields) => handleUpdateEquipment(item.id, { customFields: fields })}
          confidenceMap={item.nameplateOcrData?.confidence}
        />

        {/* ANEXOS DO EQUIPAMENTO (Múltiplas Fotos ou Vídeos com Leitura OCR de Plaqueta) */}
        <EquipmentMediaAttachmentSection
          title="Anexos deste equipamento (Fotos / Vídeos)"
          description="Foto da placa (leitura automática por IA), vazamentos ou vídeo de operação"
          attachments={
            item.attachments && item.attachments.length > 0
              ? item.attachments
              : item.photoDataUrl
                ? [
                    {
                      id: 'legacy_photo',
                      name: 'Foto da Placa',
                      type: 'image',
                      dataUrl: item.photoDataUrl,
                    },
                  ]
                : []
          }
          onAddFiles={(files) => handleAddEquipmentAttachments(item.id, files)}
          onRemoveAttachment={(attId) => handleRemoveEquipmentAttachment(item.id, attId)}
          onReadNameplatePhoto={(photo) => handleTriggerNameplateOcr(item.id, photo)}
          isReadingNameplate={isReadingNameplate && readingEquipmentId === item.id}
          activeReadingAttachmentId={activeReadingAttachmentId}
          readingStatusText={nameplateReadingStatus}
          isCompressing={isCompressingGlobal}
        />

        {/* OBSERVAÇÕES DO TÉCNICO COM GRAVAÇÃO DE VOZ E TRANSCRIÇÃO AUTOMÁTICA */}
        <VoiceDictationField
          label="Observações do técnico sobre o estado do equipamento:"
          sublabel="Grave por voz ou digite. O texto permanece 100% editável após falar."
          value={item.technicianNotes}
          onChange={(val) => handleUpdateEquipment(item.id, { technicianNotes: val })}
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
              equipments: prev.equipments.map((eq) =>
                eq.id === item.id
                  ? {
                      ...eq,
                      attachments: [...(eq.attachments || []), newAtt],
                    }
                  : eq,
              ),
            }))
            toast({
              title: 'Áudio anexado ao equipamento',
              description: 'Gravação salva como anexo do equipamento.',
            })
          }}
          placeholder="Vazamento nas gaxetas, placas incrustadas, corrosão no tirante, necessidade de banho químico..."
          rows={3}
        />
      </CardContent>
    </Card>
  )
}
