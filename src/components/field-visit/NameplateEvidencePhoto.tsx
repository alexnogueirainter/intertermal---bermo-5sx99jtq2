import { useState } from 'react'
import { Image as ImageIcon, X } from 'lucide-react'
import { absolutizeMediaUrl, type EquipmentItem, type MediaAttachment } from '@/types/field-visit'

/** Localiza a foto da placa usada na última leitura OCR do equipamento. */
export function getEvidenceAttachment(eq: EquipmentItem): MediaAttachment | undefined {
  const evidenceId = eq.nameplateOcrData?.evidenceAttachmentId
  if (!evidenceId) return undefined
  return (eq.attachments || []).find(
    (a) => a.id === evidenceId && (a.type === 'image' || !a.type) && Boolean(a.dataUrl),
  )
}

/**
 * Foto da placa usada na leitura automática, exibida ao lado dos campos da plaqueta
 * na tela de revisão. Clique amplia. Os campos em amarelo devem ser conferidos nela.
 */
export function NameplateEvidencePhoto({
  eq,
  className,
}: {
  eq: EquipmentItem
  className?: string
}) {
  const [expanded, setExpanded] = useState(false)
  const att = getEvidenceAttachment(eq)
  if (!att?.dataUrl) return null

  return (
    <div className={`space-y-1 ${className || ''}`}>
      <div className="relative rounded-lg overflow-hidden border-2 border-yellow-400 dark:border-yellow-500 bg-black/85 shadow-sm">
        <img
          src={absolutizeMediaUrl(att.dataUrl)}
          alt="Foto da placa usada na leitura automática"
          className="w-full max-h-44 object-contain cursor-zoom-in"
          onClick={() => setExpanded(true)}
        />
        <span className="absolute top-1.5 left-1.5 inline-flex items-center gap-1 text-[9px] font-bold bg-yellow-300/95 text-yellow-950 px-1.5 py-0.5 rounded shadow-sm">
          <ImageIcon className="h-2.5 w-2.5" />
          Foto da placa
        </span>
      </div>
      <p className="text-[9.5px] leading-tight text-yellow-800 dark:text-yellow-300 font-medium">
        Campos em amarelo: confira nesta foto antes de enviar.
      </p>

      {expanded && (
        <div
          className="fixed inset-0 z-[60] bg-black/85 flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setExpanded(false)}
        >
          <img
            src={absolutizeMediaUrl(att.dataUrl)}
            alt="Foto da placa ampliada"
            className="max-h-[90vh] max-w-full object-contain rounded-lg shadow-2xl"
          />
          <button
            type="button"
            className="absolute top-3 right-3 h-9 w-9 rounded-full bg-white/90 text-slate-900 flex items-center justify-center shadow-lg"
            onClick={() => setExpanded(false)}
            title="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      )}
    </div>
  )
}
