import type { EquipmentItem } from '@/types/field-visit'

export type RenderConfidenceBadge = (
  equipment: EquipmentItem,
  fieldKey: string,
  fieldValue?: any,
) => any

export type ConfidenceLevel = 'high' | 'medium' | 'low'

/**
 * Resolve o nível de confiança de leitura de um campo a partir do mapa OCR
 * gravado em nameplateOcrData.confidence (aceita 'high'|'medium'|'low' ou número 0–1).
 */
export function resolveConfidenceLevel(
  confMap: Record<string, number | 'high' | 'medium' | 'low'> | undefined,
  fieldKey: string,
): ConfidenceLevel | null {
  if (!confMap) return null

  // Procura por chave exata ou normalizada
  let rawLevel: number | string | undefined = confMap[fieldKey]
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

  if (rawLevel === 'high') return 'high'
  if (rawLevel === 'medium') return 'medium'
  if (rawLevel === 'low') return 'low'
  if (typeof rawLevel === 'number') {
    if (rawLevel >= 0.8) return 'high'
    if (rawLevel >= 0.5) return 'medium'
    return 'low'
  }
  return null
}

/**
 * Classes de destaque amarelo para o INPUT de campo que o técnico precisa conferir
 * na foto da placa (usa ! para vencer as classes padrão do Input).
 */
export const REVIEW_INPUT_YELLOW =
  '!border-yellow-400 !bg-yellow-50 dark:!border-yellow-500 dark:!bg-yellow-950/40'

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

    const level = resolveConfidenceLevel(equipment.nameplateOcrData?.confidence, fieldKey)

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

    if (level === 'low') {
      return (
        <span
          className="inline-flex items-center gap-1 text-[9.5px] font-bold text-yellow-900 bg-yellow-200/90 dark:bg-yellow-800/70 dark:text-yellow-100 px-1.5 py-0.5 rounded-md shrink-0 shadow-2xs ring-1 ring-yellow-400"
          title="Leitura com baixa confiança — conferir na foto da placa"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-yellow-500 shrink-0" />
          Conferir
        </span>
      )
    }

    return null
  }
  return renderConfidenceBadge
}

/**
 * Fábrica dos ajudantes de destaque em amarelo (conferir na foto da placa):
 * - campo lido com baixa confiança ('low' ou score < 0.5), OU
 * - campo com divergência entre o valor digitado e o lido na placa.
 * Campos editados manualmente pelo técnico ou vazios não são destacados.
 */
export function makeFieldHighlight(manuallyEditedFields: Record<string, Record<string, boolean>>) {
  const needsReview = (equipment: EquipmentItem, fieldKey: string, fieldValue?: any): boolean => {
    if (manuallyEditedFields[equipment.id]?.[fieldKey]) return false
    const valStr = fieldValue !== undefined && fieldValue !== null ? String(fieldValue).trim() : ''
    if (!valStr) return false
    if (resolveConfidenceLevel(equipment.nameplateOcrData?.confidence, fieldKey) === 'low') {
      return true
    }
    return (equipment.nameplateOcrData?.discrepancies || []).some((d) => d.fieldKey === fieldKey)
  }

  const highlightClass = (equipment: EquipmentItem, fieldKey: string, fieldValue?: any): string =>
    needsReview(equipment, fieldKey, fieldValue) ? REVIEW_INPUT_YELLOW : ''

  return { needsReview, highlightClass }
}

export type FieldHighlightHelpers = ReturnType<typeof makeFieldHighlight>
