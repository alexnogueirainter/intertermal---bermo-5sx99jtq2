import { Plus, Layers, FileText, Film } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/hooks/use-toast'
import { VoiceDictationField } from '@/components/VoiceDictationField'
import { MultiMediaAttachmentField } from '@/components/field-visit/MultiMediaAttachmentField'
import { LeanEquipmentCard } from '@/components/field-visit/LeanEquipmentCard'
import { generateId } from '@/types/field-visit'
import type { FieldVisitData, EquipmentItem, MediaAttachment } from '@/types/field-visit'
import type { Dispatch, SetStateAction } from 'react'
import type { RenderConfidenceBadge } from '@/components/field-visit/fieldVisitConfidence'

export function LeanFlowSection({
  visit,
  setVisit,
  handleAddVisitAttachments,
  handleRemoveVisitAttachment,
  handleAddEquipment,
  handleUpdateEquipment,
  markFieldAsManuallyEdited,
  renderConfidenceBadge,
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
  visit: FieldVisitData
  setVisit: Dispatch<SetStateAction<FieldVisitData>>
  handleAddVisitAttachments: (files: FileList | null) => Promise<void>
  handleRemoveVisitAttachment: (attachmentId: string) => void
  handleAddEquipment: (customName?: string) => void
  handleUpdateEquipment: (id: string, updates: Partial<EquipmentItem>) => void
  markFieldAsManuallyEdited: (equipmentId: string, fieldKey: string) => void
  renderConfidenceBadge: RenderConfidenceBadge
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
    <div className="space-y-5 animate-in fade-in duration-300">
      {/* Campo em branco para Descrição Livre com Digitação OU Gravação de Voz */}
      <Card className="border-teal-200 dark:border-teal-900/60 shadow-xs bg-white dark:bg-slate-900">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 flex items-center justify-center">
              <FileText className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-sm font-bold">5. Descrição Livre da Visita</CardTitle>
              <p className="text-[11px] text-muted-foreground">
                Preenchimento por digitação manual OU gravação de voz (transcrição automática, 100%
                editável após falar)
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <VoiceDictationField
            label="Relato e levantamento técnico da visita:"
            sublabel="Fale ao microfone para transcrever ou digite normalmente."
            value={visit.freeDescription || visit.generalObservations || ''}
            onChange={(val) =>
              setVisit((prev) => ({
                ...prev,
                freeDescription: val,
                generalObservations: val, // sincroniza para manter compatibilidade
              }))
            }
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
                visitAttachments: [...(prev.visitAttachments || []), newAtt],
              }))
              toast({
                title: 'Áudio anexado à visita',
                description: 'Gravação salva como anexo da visita com sucesso.',
              })
            }}
            placeholder="Ex.: Visita na planta para levantamento de novo trocador BERMO no setor de pasteurização. Vazão desejada de 30m³/h, temperatura de entrada 85°C..."
            rows={6}
          />
        </CardContent>
      </Card>

      {/* Anexos Gerais da Visita (Múltiplas Fotos e Vídeos) */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-xs bg-white dark:bg-slate-900">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 flex items-center justify-center">
              <Film className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-sm font-bold">
                6. Anexos Gerais da Visita (Fotos e Vídeos)
              </CardTitle>
              <p className="text-[11px] text-muted-foreground">
                Anexe mais de 1 foto ou vídeo das instalações, tubulações ou planta do cliente
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <MultiMediaAttachmentField
            title="Fotos e Vídeos Gerais"
            description="Aceita múltiplos arquivos de foto e vídeo. Ficam salvos no celular e são enviados ao CRM."
            attachments={visit.visitAttachments || []}
            onAddFiles={handleAddVisitAttachments}
            onRemoveAttachment={handleRemoveVisitAttachment}
            isCompressing={isCompressingGlobal}
          />
        </CardContent>
      </Card>

      {/* Seções de Anexos por Equipamento Separados ("Equipamento 01", "Equipamento 02"...) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-2 pt-1">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Layers className="h-5 w-5 text-teal-700 dark:text-teal-400" />
              Anexos por Equipamento Separados
              <Badge variant="secondary" className="text-xs">
                {visit.equipments.length}
              </Badge>
            </h2>
            <p className="text-xs text-muted-foreground">
              Cada equipamento tem sua própria seção de anexos com botão para adicionar mais
            </p>
          </div>

          <Button
            type="button"
            onClick={() => handleAddEquipment()}
            className="bg-teal-700 hover:bg-teal-600 text-white font-semibold text-xs h-10 px-4 rounded-xl shadow-xs"
          >
            <Plus className="h-4 w-4 mr-1" />
            Adicionar equipamento
          </Button>
        </div>

        {visit.equipments.length === 0 ? (
          <div className="p-8 text-center rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 space-y-3">
            <div className="h-12 w-12 rounded-full bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-400 mx-auto flex items-center justify-center">
              <Layers className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                Nenhum equipamento separado adicionado
              </p>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                Deseja anexar fotos/vídeos de um equipamento específico (ex.: &quot;Equipamento
                01&quot;)?
              </p>
            </div>
            <Button
              type="button"
              onClick={() => handleAddEquipment('Equipamento 01')}
              variant="outline"
              className="text-xs h-9 font-semibold text-teal-800 dark:text-teal-300 border-teal-300 dark:border-teal-700 hover:bg-teal-50"
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              Adicionar Equipamento 01
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {visit.equipments.map((eq, index) => (
              <LeanEquipmentCard
                key={eq.id}
                eq={eq}
                index={index}
                setVisit={setVisit}
                handleUpdateEquipment={handleUpdateEquipment}
                markFieldAsManuallyEdited={markFieldAsManuallyEdited}
                renderConfidenceBadge={renderConfidenceBadge}
                handleAddEquipmentAttachments={handleAddEquipmentAttachments}
                handleRemoveEquipmentAttachment={handleRemoveEquipmentAttachment}
                handleTriggerNameplateOcr={handleTriggerNameplateOcr}
                setEquipmentToDelete={setEquipmentToDelete}
                isReadingNameplate={isReadingNameplate}
                readingEquipmentId={readingEquipmentId}
                activeReadingAttachmentId={activeReadingAttachmentId}
                nameplateReadingStatus={nameplateReadingStatus}
                isCompressingGlobal={isCompressingGlobal}
              />
            ))}

            <div className="pt-2">
              <Button
                type="button"
                onClick={() => handleAddEquipment()}
                variant="outline"
                className="w-full h-12 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-teal-600 hover:text-teal-700 font-semibold text-xs"
              >
                <Plus className="h-4 w-4 mr-1.5" />
                Adicionar mais um equipamento (
                {`Equipamento ${String(visit.equipments.length + 1).padStart(2, '0')}`})
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
