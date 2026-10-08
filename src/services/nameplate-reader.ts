import pb from '@/lib/pocketbase/client'
import { EquipmentItem, generateId } from '@/types/field-visit'

export interface NameplateExtractedData {
  manufacturer?: string
  model?: string
  manufacturingNumber?: string
  serialNumber?: string
  service?: string
  tag?: string
  designPressureBar?: string
  testPressureBar?: string
  designTempC?: string
  pmtaMpa?: string
  emptyWeightKg?: string
  manufacturingYear?: string
  tighteningMaxA?: string
  tighteningMinA?: string
  plateCount?: string
  fluid1?: string
  fluid2?: string
  extraFields?: Array<{ label: string; value: string }>
  confidence?: Record<string, number>
  rawTextExtracted?: string
  summary?: string
}

export interface NameplateComparisonResult {
  /** Campos vazios preenchidos automaticamente */
  autoFilled: Array<{ fieldKey: string; label: string; value: string }>
  /** Divergências encontradas (valor na foto vs valor digitado pelo técnico) */
  discrepancies: Array<{
    fieldKey: string
    label: string
    currentValue: string
    plateValue: string
  }>
  /** Novos campos criados que não existem no formulário padrão */
  newCustomFields: Array<{ id: string; label: string; value: string }>
  /** Campos do formulário para os quais a placa não trouxe dados */
  unidentifiedFields: Array<{ fieldKey: string; label: string }>
  /** Equipamento com os campos vazios preenchidos e novos campos acoplados */
  mergedEquipment: EquipmentItem
}

/**
 * Mapeamento dos campos do formulário para comparação amigável com a plaqueta
 */
export const FORM_FIELD_DEFINITIONS: Array<{
  key: keyof EquipmentItem
  label: string
  category: 'identificacao' | 'plaqueta' | 'operacional'
}> = [
  { key: 'manufacturer', label: 'Fabricante', category: 'identificacao' },
  { key: 'model', label: 'Modelo do Equipamento', category: 'identificacao' },
  { key: 'serialNumber', label: 'Número de Série', category: 'identificacao' },
  { key: 'tag', label: 'TAG do Equipamento', category: 'identificacao' },
  { key: 'service', label: 'Serviço da Plaqueta', category: 'plaqueta' },
  { key: 'manufacturingNumber', label: 'Nº de Fabricação', category: 'plaqueta' },
  { key: 'designPressureBar', label: 'Pressão de Projeto (bar)', category: 'plaqueta' },
  { key: 'testPressureBar', label: 'Pressão de Teste (bar)', category: 'plaqueta' },
  { key: 'designTempC', label: 'Temp. de Projeto (°C)', category: 'plaqueta' },
  { key: 'pmtaMpa', label: 'PMTA (MPa)', category: 'plaqueta' },
  { key: 'emptyWeightKg', label: 'Peso Vazio (kgf)', category: 'plaqueta' },
  { key: 'manufacturingYear', label: 'Ano de Fabricação', category: 'plaqueta' },
  { key: 'tighteningMaxA', label: '"a" Máximo (mm)', category: 'plaqueta' },
  { key: 'tighteningMinA', label: '"a" Mínimo (mm)', category: 'plaqueta' },
  { key: 'plateCount', label: 'Quantidade de Placas', category: 'operacional' },
  { key: 'fluid1', label: 'Fluido 1 (Lado quente)', category: 'operacional' },
  { key: 'fluid2', label: 'Fluido 2 (Lado frio)', category: 'operacional' },
]

function normalizeForComparison(val: any): string {
  if (val === undefined || val === null) return ''
  return String(val)
    .trim()
    .toLowerCase()
    .replace(/[.\-_/\s]/g, '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

/**
 * Compara os dados extraídos da placa com o equipamento atual,
 * seguindo rigorosamente a especificação do usuário:
 * 1. Preenche apenas campos vazios — NUNCA substitui valores já digitados.
 * 2. Cria novos campos no formulário para dados que não cabem no padrão.
 * 3. Identifica divergências entre o valor digitado e o da placa, sem alterar o digitado.
 * 4. Sinaliza campos não identificados na foto.
 */
export function compareAndMergeNameplateData(
  equipment: EquipmentItem,
  extracted: NameplateExtractedData,
  attachmentId?: string,
): NameplateComparisonResult {
  const merged: EquipmentItem = {
    ...equipment,
    customFields: [...(equipment.customFields || [])],
  }

  const autoFilled: Array<{ fieldKey: string; label: string; value: string }> = []
  const discrepancies: Array<{
    fieldKey: string
    label: string
    currentValue: string
    plateValue: string
  }> = []
  const unidentifiedFields: Array<{ fieldKey: string; label: string }> = []

  // Mapa de valores extraídos
  const extractedMap: Record<string, string> = {
    manufacturer: extracted.manufacturer || '',
    model: extracted.model || '',
    serialNumber: extracted.serialNumber || extracted.manufacturingNumber || '',
    tag: extracted.tag || '',
    service: extracted.service || '',
    manufacturingNumber: extracted.manufacturingNumber || '',
    designPressureBar: extracted.designPressureBar || '',
    testPressureBar: extracted.testPressureBar || '',
    designTempC: extracted.designTempC || '',
    pmtaMpa: extracted.pmtaMpa || '',
    emptyWeightKg: extracted.emptyWeightKg || '',
    manufacturingYear: extracted.manufacturingYear || '',
    tighteningMaxA: extracted.tighteningMaxA || '',
    tighteningMinA: extracted.tighteningMinA || '',
    plateCount: extracted.plateCount || '',
    fluid1: extracted.fluid1 || '',
    fluid2: extracted.fluid2 || '',
  }

  // Compara cada campo padrão
  for (const def of FORM_FIELD_DEFINITIONS) {
    const currentVal = (merged[def.key] as string) || ''
    const plateVal = (extractedMap[def.key as string] || '').trim()

    const hasCurrent = Boolean(currentVal.trim())
    const hasPlate = Boolean(plateVal)

    if (!hasPlate) {
      if (!hasCurrent) {
        unidentifiedFields.push({ fieldKey: String(def.key), label: def.label })
      }
      continue
    }

    if (!hasCurrent) {
      // Regra: preencher apenas campos vazios
      ;(merged as any)[def.key] = plateVal
      autoFilled.push({ fieldKey: String(def.key), label: def.label, value: plateVal })
    } else {
      // Já está preenchido: checar divergência
      const normCurrent = normalizeForComparison(currentVal)
      const normPlate = normalizeForComparison(plateVal)
      if (
        normCurrent !== normPlate &&
        !normCurrent.includes(normPlate) &&
        !normPlate.includes(normCurrent)
      ) {
        discrepancies.push({
          fieldKey: String(def.key),
          label: def.label,
          currentValue: currentVal,
          plateValue: plateVal,
        })
      }
    }
  }

  // Processa campos extras retornados que não correspondem a campos fixos
  const newCustomFields: Array<{ id: string; label: string; value: string }> = []
  if (Array.isArray(extracted.extraFields) && extracted.extraFields.length > 0) {
    for (const extra of extracted.extraFields) {
      const extraLabel = (extra.label || '').trim()
      const extraVal = (extra.value || '').trim()
      if (!extraLabel || !extraVal) continue

      // Verifica se já não existe um campo customizado igual
      const existing = (merged.customFields || []).find(
        (c) => normalizeForComparison(c.label) === normalizeForComparison(extraLabel),
      )
      if (!existing) {
        const newField = {
          id: generateId(),
          label: extraLabel,
          value: extraVal,
        }
        newCustomFields.push(newField)
        merged.customFields = [...(merged.customFields || []), newField]
      }
    }
  }

  // Grava metadados da leitura no equipamento
  merged.nameplateOcrData = {
    lastReadAt: new Date().toISOString(),
    summary: extracted.summary || '',
    rawText: extracted.rawTextExtracted || '',
    confidence: extracted.confidence || {},
    evidenceAttachmentId: attachmentId,
  }

  return {
    autoFilled,
    discrepancies,
    newCustomFields,
    unidentifiedFields,
    mergedEquipment: merged,
  }
}

/**
 * Chama o backend nativo para extrair os dados da plaqueta a partir da imagem
 */
export async function readNameplateFromImage(payload: {
  imageDataUrl?: string
  imageUrl?: string
  context?: string
}): Promise<{
  ok: boolean
  data?: NameplateExtractedData
  method?: string
  message?: string
}> {
  try {
    const res = await pb.send('/backend/v1/field-visits/equipment/read-nameplate', {
      method: 'POST',
      body: JSON.stringify({
        image: payload.imageDataUrl,
        imageUrl: payload.imageUrl,
        context: payload.context,
      }),
    })
    return res as any
  } catch (err: any) {
    const errData = err?.response?.data || err?.data || {}
    return {
      ok: false,
      message:
        errData.message ||
        err.message ||
        'Falha ao conectar com o agente de leitura de plaquetas. Você pode continuar preenchendo manualmente.',
    }
  }
}
