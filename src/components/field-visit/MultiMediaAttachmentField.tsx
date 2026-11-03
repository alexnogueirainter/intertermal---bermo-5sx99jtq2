import { useRef } from 'react'
import { Camera, Trash2, RotateCcw, Upload, Video, Image as ImageIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { MediaAttachment } from '@/types/field-visit'

// VoiceDictationField e VoiceDiagnosticFooter substituem a implementação anterior de gravação

/**
 * Componente para campo de anexos com suporte a MÚLTIPLAS imagens e vídeos
 */
export function MultiMediaAttachmentField({
  attachments = [],
  onAddFiles,
  onRemoveAttachment,
  title = 'Anexos (Fotos e Vídeos)',
  description = 'Aceita múltiplos arquivos de foto e vídeo ao mesmo tempo.',
  isCompressing = false,
}: {
  attachments?: MediaAttachment[]
  onAddFiles: (files: FileList | null) => Promise<void>
  onRemoveAttachment: (attachmentId: string) => void
  title?: string
  description?: string
  isCompressing?: boolean
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  return (
    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Camera className="h-4 w-4 text-teal-700 dark:text-teal-400" />
            {title}
          </label>
          <p className="text-[11px] text-muted-foreground">{description}</p>
        </div>
        <Badge variant="secondary" className="text-[10px]">
          {attachments.length} {attachments.length === 1 ? 'anexo' : 'anexos'}
        </Badge>
      </div>

      {/* Grid de miniaturas existentes */}
      {attachments.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {attachments.map((att) => (
            <div
              key={att.id}
              className="relative group rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 bg-black/5 dark:bg-white/5 flex flex-col"
            >
              <div className="aspect-video w-full bg-black/80 flex items-center justify-center overflow-hidden">
                {att.type === 'video' ? (
                  <video src={att.dataUrl} controls className="w-full h-full object-contain" />
                ) : (
                  <img
                    src={att.dataUrl}
                    alt={att.name || 'Foto anexada'}
                    className="w-full h-full object-contain"
                  />
                )}
              </div>

              <div className="p-1.5 bg-white dark:bg-slate-900 flex items-center justify-between text-[10px] text-muted-foreground border-t border-slate-200 dark:border-slate-800">
                <span className="truncate flex items-center gap-1 max-w-[120px]">
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
                  className="text-rose-600 hover:text-rose-700 p-1 rounded hover:bg-rose-50"
                  title="Remover anexo"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Botões de Upload Múltiplo */}
      <div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          multiple
          className="hidden"
          onChange={(e) => onAddFiles(e.target.files)}
          disabled={isCompressing}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {/* Opção 1: Fotos e Vídeos da Galeria/Arquivos (Múltiplos) */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isCompressing}
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
                Anexar Fotos / Vídeos (Múltiplos)
              </>
            )}
          </Button>

          {/* Opção 2: Câmera Direta do Celular */}
          <label className="cursor-pointer">
            <input
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => onAddFiles(e.target.files)}
              disabled={isCompressing}
            />
            <div className="h-10 px-3 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 flex items-center justify-center gap-1.5">
              <Camera className="h-3.5 w-3.5 text-teal-700" />
              Tirar Foto com a Câmera
            </div>
          </label>
        </div>
      </div>
    </div>
  )
}
