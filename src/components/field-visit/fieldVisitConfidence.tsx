import type { EquipmentItem } from '@/types/field-visit'

export type RenderConfidenceBadge = (
  equipment: EquipmentItem,
  fieldKey: string,
  fieldValue?: any,
) => any

/**
 * Fábrica do indicador de confiança OCR (mesma renderização de antes).
 * Depende do mapa de campos editados manualmente do estado da página.
 */
export function makeRenderConfidenceBadge(
  manuallyEditedFields: Record<string, Record<string, boolean>>,
): RenderConfidenceBadge {
  const renderConfidenceBadge = (equipment: EquipmentItem, fieldKey: string, fieldValue?: any) => {
    // Se o técnico editou manualmente após a leitura, vira "editado manualmente"
    const isEdited = manuallyEditedFields[equipment.id]?.[fieldKey]
    if (isEdited) {
      return (
        <span
          className="inline-flex items-center gap-1 text-[9px] font-semibold text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded shrink-0"
          title="Campo alterado manualmente pelo técnico"
        >
          editado
        </span>
      )
    }

    // Se o campo estiver vazio, não exibe indicador
    const valStr = fieldValue !== undefined && fieldValue !== null ? String(fieldValue).trim() : ''
    if (!valStr) return null

    const confMap = equipment.nameplateOcrData?.confidence
    if (!confMap) return null

    // Procura por chave exata ou normalizada
    let rawLevel = confMap[fieldKey]
    if (rawLevel === undefined) {
      const cleanTarget = fieldKey.toLowerCase().replace(/[^a-z0-9]/g, '')
      for (const [k, v] of Object.entries(confMap)) {
        if (k.toLowerCase().replace(/[^a-z0-9]/g, '') === cleanTarget) {
          rawLevel = v
          break
        }
      }
    }

    if (rawLevel === undefined) return null

    let level: 'high' | 'medium' | null = null
    if (rawLevel === 'high') level = 'high'
    else if (rawLevel === 'medium') level = 'medium'
    else if (typeof rawLevel === 'number') {
      if (rawLevel >= 0.8) level = 'high'
      else if (rawLevel >= 0.5) level = 'medium'
    }

    if (level === 'high') {
      return (
        <span
          className="inline-flex items-center gap-1 text-[9.5px] font-bold text-emerald-800 bg-emerald-100/90 dark:bg-emerald-950 dark:text-emerald-300 px-1.5 py-0.5 rounded-md shrink-0 shadow-2xs"
          title="Lido com clareza da plaqueta (alta confiança)"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
          Placa
        </span>
      )
    }

    if (level === 'medium') {
      return (
        <span
          className="inline-flex items-center gap-1 text-[9.5px] font-bold text-amber-800 bg-amber-100/90 dark:bg-amber-950 dark:text-amber-300 px-1.5 py-0.5 rounded-md shrink-0 shadow-2xs"
          title="Leitura parcial da plaqueta (revisar)"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
          Parcial
        </span>
      )
    }

    return null
  }
  return renderConfidenceBadge
}
