import React, { useRef, useState } from 'react'
import {
  Camera,
  Image as ImageIcon,
  Video,
  Trash2,
  Sparkles,
  Loader2,
  RotateCcw,
  Upload,
  AlertCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MediaAttachment } from '@/types/field-visit'

export interface EquipmentMediaAttachmentSectionProps {
  title?: string
  description?: string
  attachments?: MediaAttachment[]
  onAddFiles: (files: FileList | null) => Promise<void>
  onRemoveAttachment: (attachmentId: string) => void
  isCompressing?: boolean
  /** Dispara a leitura da plaqueta por IA para uma imagem específica */
  onReadNameplatePhoto?: (photo: MediaAttachment) => Promise<void>
  /** Se a IA está atualmente processando alguma leitura neste equipamento */
  isReadingNameplate?: boolean
  /** ID da foto que está sendo lida agora */
  activeReadingAttachmentId?: string | null
  /** Status textual ou percentual do progresso (ex: "Lendo placa... 45%") */
  readingStatusText?: string
  /** Se permite acionar a leitura de plaqueta (habilitado para equipamentos) */
  enableNameplateReader?: boolean
}

export function EquipmentMediaAttachmentSection({
  title = 'Anexos deste equipamento (Fotos / Vídeos)',
  description = 'Foto da placa de identificação, vazamentos ou vídeo de operação',
  attachments = [],
  onAddFiles,
  onRemoveAttachment,
  isCompressing = false,
  onReadNameplatePhoto,
  isReadingNameplate = false,
  activeReadingAttachmentId = null,
  readingStatusText = 'Lendo plaqueta...',
  enableNameplateReader = true,
}: EquipmentMediaAttachmentSectionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  return (
    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Camera className="h-4 w-4 text-teal-700 dark:text-teal-400" />
            {title}
          </label>
          <p className="text-[11px] text-muted-foreground">{description}</p>
        </div>
        <div className="flex items-center gap-2">
          {enableNameplateReader && (
            <span className="text-[10.5px] font-medium text-teal-700 dark:text-teal-300 bg-teal-100/70 dark:bg-teal-900/40 px-2 py-0.5 rounded-full flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-teal-600" />
              OCR com IA Nativa
            </span>
          )}
          <Badge variant="secondary" className="text-[10px]">
            {attachments.length} {attachments.length === 1 ? 'anexo' : 'anexos'}
          </Badge>
        </div>
      </div>

      {/* Grid de anexos */}
      {attachments.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {attachments.map((att) => {
            const isThisReading = isReadingNameplate && activeReadingAttachmentId === att.id
            const isImage = att.type === 'image' || !att.type

            return (
              <div
                key={att.id}
                className="relative group rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 bg-black/5 dark:bg-white/5 flex flex-col"
              >
                <div className="aspect-video w-full bg-black/85 flex items-center justify-center overflow-hidden relative">
                  {att.type === 'video' ? (
                    <video src={att.dataUrl} controls className="w-full h-full object-contain" />
                  ) : (
                    <img
                      src={att.dataUrl}
                      alt={att.name || 'Foto anexada'}
                      className="w-full h-full object-contain"
                    />
                  )}

                  {isThisReading && (
                    <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white p-2 text-center animate-in fade-in">
                      <Loader2 className="h-6 w-6 animate-spin text-teal-400 mb-1" />
                      <span className="text-[11px] font-semibold">
                        {readingStatusText || 'Lendo plaqueta...'}
                      </span>
                      <span className="text-[9px] text-slate-300">Extraindo dados técnicos</span>
                    </div>
                  )}
                </div>

                <div className="p-2 bg-white dark:bg-slate-900 flex flex-col gap-1.5 border-t border-slate-200 dark:border-slate-800 text-[11px]">
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span className="truncate flex items-center gap-1 max-w-[150px]">
                      {att.type === 'video' ? (
                        <Video className="h-3 w-3 text-teal-600 shrink-0" />
                      ) : (
                        <ImageIcon className="h-3 w-3 text-teal-600 shrink-0" />
                      )}
                      {att.name || (att.type === 'video' ? 'Vídeo' : 'Foto')}
                    </span>
                    <button
                      type="button"
                      onClick={() => onRemoveAttachment(att.id)}
                      disabled={isThisReading}
                      className="text-rose-600 hover:text-rose-700 p-1 rounded hover:bg-rose-50"
                      title="Remover anexo"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* Indicador de leitura em andamento na foto */}
                  {isThisReading && (
                    <div className="flex items-center gap-1 text-[10.5px] text-teal-700 dark:text-teal-300 font-semibold py-1">
                      <Loader2 className="h-3 w-3 animate-spin text-teal-600" />
                      <span>{readingStatusText || 'Lendo placa...'}</span>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Controles de Upload */}
      <div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          multiple
          className="hidden"
          onChange={(e) => {
            onAddFiles(e.target.files)
            if (fileInputRef.current) fileInputRef.current.value = ''
          }}
          disabled={isCompressing || isReadingNameplate}
        />

        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => {
            onAddFiles(e.target.files)
            if (cameraInputRef.current) cameraInputRef.current.value = ''
          }}
          disabled={isCompressing || isReadingNameplate}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {/* Opção 1: Fotos e Vídeos da Galeria */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isCompressing || isReadingNameplate}
            className="h-10 text-xs border-teal-300 dark:border-teal-700 text-teal-800 dark:text-teal-300 hover:bg-teal-50 flex items-center justify-center gap-1.5 font-semibold"
          >
            {isCompressing ? (
              <>
                <RotateCcw className="h-3.5 w-3.5 animate-spin text-teal-600" />
                Processando arquivos...
              </>
            ) : (
              <>
                <Upload className="h-3.5 w-3.5 text-teal-600" />
                Anexar Fotos / Vídeos
              </>
            )}
          </Button>

          {/* Opção 2: Câmera Direta do Celular */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => cameraInputRef.current?.click()}
            disabled={isCompressing || isReadingNameplate}
            className="h-10 text-xs border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 flex items-center justify-center gap-1.5 font-semibold"
          >
            <Camera className="h-3.5 w-3.5 text-teal-700" />
            Tirar Foto com a Câmera
          </Button>
        </div>

        {/* Dica amigável para o técnico */}
        <p className="text-[10.5px] text-muted-foreground mt-2 flex items-center gap-1">
          <AlertCircle className="h-3 w-3 text-slate-400 shrink-0" />
          Tire a foto ou anexe o arquivo: a leitura da placa e o preenchimento automático ocorrem
          sozinhos, sem precisar clicar em nada.
        </p>
      </div>
    </div>
  )
}
