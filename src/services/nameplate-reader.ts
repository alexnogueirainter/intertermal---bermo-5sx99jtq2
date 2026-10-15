import pb from '@/lib/pocketbase/client'
import { EquipmentItem, generateId, onlyNumericPtBR } from '@/types/field-visit'

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
  flowRate?: string
  flowUnit?: string
  thermalAreaM2?: string
  fabricationStandard?: string
  connectionSize?: string
  plateMaterial?: string
  gasketMaterial?: string
  extraFields?: Array<{ label: string; value: string }>
  confidence?: Record<string, number | 'high' | 'medium' | 'low' | string>
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
  isNumericPtBr?: boolean
}> = [
  { key: 'manufacturer', label: 'Fabricante', category: 'identificacao' },
  { key: 'model', label: 'Modelo do Equipamento', category: 'identificacao' },
  { key: 'serialNumber', label: 'Número de Série', category: 'identificacao' },
  { key: 'tag', label: 'TAG do Equipamento', category: 'identificacao' },
  { key: 'service', label: 'Serviço da Plaqueta', category: 'plaqueta' },
  { key: 'manufacturingNumber', label: 'Nº de Fabricação', category: 'plaqueta' },
  {
    key: 'designPressureBar',
    label: 'Pressão de Projeto (bar)',
    category: 'plaqueta',
    isNumericPtBr: true,
  },
  {
    key: 'testPressureBar',
    label: 'Pressão de Teste (bar)',
    category: 'plaqueta',
    isNumericPtBr: true,
  },
  { key: 'designTempC', label: 'Temp. de Projeto (°C)', category: 'plaqueta', isNumericPtBr: true },
  { key: 'pmtaMpa', label: 'PMTA (MPa)', category: 'plaqueta', isNumericPtBr: true },
  { key: 'emptyWeightKg', label: 'Peso Vazio (kgf)', category: 'plaqueta', isNumericPtBr: true },
  { key: 'manufacturingYear', label: 'Ano de Fabricação', category: 'plaqueta' },
  { key: 'tighteningMaxA', label: '"a" Máximo (mm)', category: 'plaqueta', isNumericPtBr: true },
  { key: 'tighteningMinA', label: '"a" Mínimo (mm)', category: 'plaqueta', isNumericPtBr: true },
  { key: 'plateCount', label: 'Quantidade de Placas', category: 'operacional' },
  { key: 'fluid1', label: 'Fluido 1 (Lado quente)', category: 'operacional' },
  { key: 'fluid2', label: 'Fluido 2 (Lado frio)', category: 'operacional' },
  { key: 'flowRate', label: 'Vazão (Q)', category: 'operacional', isNumericPtBr: true },
  { key: 'flowUnit', label: 'Unidade de Vazão', category: 'operacional' },
]

/**
 * Normaliza valores numéricos removendo unidades de medida e convertendo ponto para vírgula pt-BR
 */
export function normalizeNameplateNumeric(val: any): string {
  if (val === undefined || val === null) return ''
  let s = String(val).trim()
  if (!s) return ''
  // Remove unidades como bar, MPa, kg, kgf, °C, mm
  s = s.replace(/(?:bar|mpa|kgf|kg|°c|c|mm|m2|m²)/gi, '').trim()
  // Se for número com ponto decimal ex: 1.13 -> converte para vírgula
  if (/^\d+\.\d+$/.test(s)) {
    s = s.replace('.', ',')
  }
  return onlyNumericPtBR(s)
}

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
 * 4. Persiste as divergências em nameplateOcrData.discrepancies.
 * 5. Sinaliza campos não identificados na foto.
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

  // Mapa de valores extraídos com normalização
  const extractedMap: Record<string, string> = {
    manufacturer: (extracted.manufacturer || '').trim(),
    model: (extracted.model || '').trim(),
    serialNumber: (extracted.serialNumber || '').trim(),
    tag: (extracted.tag || '').trim(),
    service: (extracted.service || '').trim(),
    manufacturingNumber: (extracted.manufacturingNumber || '').trim(),
    designPressureBar: normalizeNameplateNumeric(extracted.designPressureBar),
    testPressureBar: normalizeNameplateNumeric(extracted.testPressureBar),
    designTempC: normalizeNameplateNumeric(extracted.designTempC),
    pmtaMpa: normalizeNameplateNumeric(extracted.pmtaMpa),
    emptyWeightKg: normalizeNameplateNumeric(extracted.emptyWeightKg),
    manufacturingYear: (extracted.manufacturingYear || '').replace(/\D/g, '').slice(0, 4),
    tighteningMaxA: normalizeNameplateNumeric(extracted.tighteningMaxA),
    tighteningMinA: normalizeNameplateNumeric(extracted.tighteningMinA),
    plateCount: (extracted.plateCount || '').trim(),
    fluid1: (extracted.fluid1 || '').trim(),
    fluid2: (extracted.fluid2 || '').trim(),
    flowRate: normalizeNameplateNumeric(extracted.flowRate),
    flowUnit: (extracted.flowUnit || '').trim(),
  }

  // Função para normalizar labels removendo acentos, pontuações, minúsculas e ignorando texto entre parênteses
  const normalizeLabelForMatching = (label: string): string => {
    return (label || '')
      .replace(/\([^)]*\)/g, ' ') // remove unidades entre parênteses, ex.: (bar), (MPa), (kgf)
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // remove diacríticos
      .replace(/[^a-z0-9]/g, ' ') // mantém apenas letras e números
      .replace(/\s+/g, ' ')
      .trim()
  }

  // Tenta casar um label de extraFields com um dos campos principais do formulário
  const matchExtraFieldToKey = (
    cleanLabel: string,
  ): { key: keyof EquipmentItem; detectedFlowUnit?: string } | null => {
    // 1. Fabricante
    if (/^(fabricante|mfg|manufacturer)$/.test(cleanLabel) || cleanLabel.startsWith('fabricante')) {
      return { key: 'manufacturer' }
    }

    // 2. Modelo
    if (
      /^(mod|modelo|model|type|tipo)$/.test(cleanLabel) ||
      cleanLabel.startsWith('mod ') ||
      cleanLabel.startsWith('modelo ')
    ) {
      return { key: 'model' }
    }

    // 3. Nº de Fabricação / Número de Série
    if (
      /^(n\s*fab|n\s*fabricacao|num\s*fab|num\s*fabricacao|numero\s*de\s*fabricacao|n\s*serie|num\s*serie|numero\s*de\s*serie|s\s*n|sn|serial|serial\s*number|fabricacao)$/.test(
        cleanLabel,
      ) ||
      cleanLabel.startsWith('n fab') ||
      cleanLabel.startsWith('no fab') ||
      cleanLabel.startsWith('n serie') ||
      cleanLabel.startsWith('no serie')
    ) {
      return { key: 'manufacturingNumber' }
    }

    // 4. TAG
    if (/^(tag|tag\s*do\s*equipamento|equip\s*tag)$/.test(cleanLabel)) {
      return { key: 'tag' }
    }

    // 5. Serviço / Fluido
    if (/^(servico|service|servico\s*da\s*plaqueta)$/.test(cleanLabel)) {
      return { key: 'service' }
    }

    // 6. Ano de Fabricação
    if (
      /^(ano|year|date|ano\s*fabricacao|ano\s*de\s*fabricacao|data\s*fabricacao)$/.test(cleanLabel)
    ) {
      return { key: 'manufacturingYear' }
    }

    // 7. Pressão de Projeto (PS / PRESSÃO PROJ / P.PROJ)
    if (
      /^(ps|pressao\s*proj|pressao\s*projeto|pressao\s*de\s*projeto|p\s*proj|p\s*projeto|design\s*pressure)$/.test(
        cleanLabel,
      )
    ) {
      return { key: 'designPressureBar' }
    }

    // 8. Pressão de Teste (PT / PRESSÃO TESTE / P.TESTE)
    if (/^(pt|pressao\s*teste|pressao\s*de\s*teste|p\s*teste|test\s*pressure)$/.test(cleanLabel)) {
      return { key: 'testPressureBar' }
    }

    // 9. Temperatura de Projeto (TS / TEMP PROJ / T.PROJ)
    if (
      /^(ts|temp\s*proj|temp\s*projeto|temperatura\s*proj|temperatura\s*projeto|temperatura\s*de\s*projeto|t\s*proj|t\s*projeto|design\s*temp|design\s*temperature)$/.test(
        cleanLabel,
      )
    ) {
      return { key: 'designTempC' }
    }

    // 10. PMTA / MAWP
    if (/^(pmta|mawp|pressao\s*maxima\s*de\s*trabalho\s*admissivel)$/.test(cleanLabel)) {
      return { key: 'pmtaMpa' }
    }

    // 11. Peso Vazio (PESO / WT / EMPTY WT)
    if (/^(peso|wt|empty\s*wt|peso\s*vazio|peso\s*liquido|empty\s*weight)$/.test(cleanLabel)) {
      return { key: 'emptyWeightKg' }
    }

    // 12. "a" Máximo / Aperto Máximo
    if (
      cleanLabel === 'a max' ||
      cleanLabel === 'a maximo' ||
      cleanLabel === 'aperto max' ||
      cleanLabel === 'aperto maximo' ||
      cleanLabel === 'medida a max' ||
      cleanLabel === 'medida a maximo'
    ) {
      return { key: 'tighteningMaxA' }
    }

    // 13. "a" Mínimo / Aperto Mínimo
    if (
      cleanLabel === 'a min' ||
      cleanLabel === 'a minimo' ||
      cleanLabel === 'aperto min' ||
      cleanLabel === 'aperto minimo' ||
      cleanLabel === 'medida a min' ||
      cleanLabel === 'medida a minimo'
    ) {
      return { key: 'tighteningMinA' }
    }

    // 14. Vazão (Q / VAZÃO / FLOW)
    if (/^(q|vazao|flow|flow\s*rate|vazao\s*q)$/.test(cleanLabel)) {
      return { key: 'flowRate' }
    }

    // 15. Placas (PLACAS / PLATES / QTD PLACAS)
    if (
      /^(placas|plates|qtd\s*placas|quantidade\s*placas|quantidade\s*de\s*placas|no\s*placas|n\s*placas)$/.test(
        cleanLabel,
      )
    ) {
      return { key: 'plateCount' }
    }

    // 16. Fluido 1
    if (/^(fluido\s*1|fluid\s*1|fluido\s*quente|lado\s*quente)$/.test(cleanLabel)) {
      return { key: 'fluid1' }
    }

    // 17. Fluido 2
    if (/^(fluido\s*2|fluid\s*2|fluido\s*frio|lado\s*frio)$/.test(cleanLabel)) {
      return { key: 'fluid2' }
    }

    return null
  }

  // Pre-processamento: Se extraFields contiver dados correspondentes aos campos da seção principal,
  // alimenta extractedMap caso o campo esteja vazio.
  // Itens não casados são guardados para irem a customFields.
  const unmatchedExtraFields: Array<{ label: string; value: string }> = []
  if (Array.isArray(extracted.extraFields) && extracted.extraFields.length > 0) {
    for (const extra of extracted.extraFields) {
      const origLabel = (extra.label || '').trim()
      const origVal = (extra.value || '').trim()
      if (!origLabel || !origVal) continue

      const cleanLabel = normalizeLabelForMatching(origLabel)
      const matched = matchExtraFieldToKey(cleanLabel)

      if (matched) {
        const key = matched.key
        // Se for campo numérico, normaliza
        const isNumeric = FORM_FIELD_DEFINITIONS.find((d) => d.key === key)?.isNumericPtBr
        let parsedVal = isNumeric ? normalizeNameplateNumeric(origVal) : origVal
        if (key === 'manufacturingYear') {
          parsedVal = origVal.replace(/\D/g, '').slice(0, 4)
        }

        // Se o extractedMap ainda estiver vazio neste campo, preenche com o valor do extraField
        if (!extractedMap[key as string] && parsedVal) {
          extractedMap[key as string] = parsedVal
        }

        // Se for vazão e o extraField contiver unidade (ex: m³/h, l/h, kg/h)
        if (key === 'flowRate' && !extractedMap.flowUnit) {
          const unitMatch = (origLabel + ' ' + origVal).match(
            /(m[³3]\/h|l\/h|kg\/h|gpm|m3\/s|l\/s)/i,
          )
          if (unitMatch) {
            extractedMap.flowUnit = unitMatch[1].replace('3', '³')
          }
        }
      } else {
        // Código/label não casa com nenhum campo principal: permanece para customFields
        unmatchedExtraFields.push(extra)
      }
    }
  }

  // Espelhamento mútuo entre manufacturingNumber e serialNumber quando um estiver vazio
  if (!extractedMap.manufacturingNumber && extractedMap.serialNumber) {
    extractedMap.manufacturingNumber = extractedMap.serialNumber
  }
  if (!extractedMap.serialNumber && extractedMap.manufacturingNumber) {
    extractedMap.serialNumber = extractedMap.manufacturingNumber
  }

  // Compara cada campo padrão
  for (const def of FORM_FIELD_DEFINITIONS) {
    const currentVal = ((merged[def.key] as string) || '').trim()
    const rawPlateVal = (extractedMap[def.key as string] || '').trim()
    const plateVal = def.isNumericPtBr ? normalizeNameplateNumeric(rawPlateVal) : rawPlateVal

    const hasCurrent = Boolean(currentVal)
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
      // Já está preenchido: checar divergência sem sobrescrever
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

  // Espelhamento mútuo também no mergedEquipment pós-preenchimento:
  // Se o usuário já tinha serialNumber mas não manufacturingNumber e a placa preencheu serialNumber,
  // ou vice-versa, garante que se um ficou vazio e o outro preenchido pela placa, espelha.
  if (!merged.serialNumber && merged.manufacturingNumber) {
    merged.serialNumber = merged.manufacturingNumber
  } else if (!merged.manufacturingNumber && merged.serialNumber) {
    merged.manufacturingNumber = merged.serialNumber
  }

  // Processa campos extras que NÃO casaram com nenhum campo principal (KW, A, V, DN, CL, normas, materiais, etc.)
  const newCustomFields: Array<{ id: string; label: string; value: string }> = []
  if (unmatchedExtraFields.length > 0) {
    for (const extra of unmatchedExtraFields) {
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

  // Grava metadados da leitura e as divergências encontradas no equipamento
  merged.nameplateOcrData = {
    lastReadAt: new Date().toISOString(),
    summary: extracted.summary || '',
    rawText: extracted.rawTextExtracted || '',
    confidence: extracted.confidence || {},
    evidenceAttachmentId: attachmentId,
    discrepancies,
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
 * Chama o backend nativo para extrair os dados da plaqueta a partir da imagem ou texto OCR
 */
export interface ReadNameplatePayload {
  imageDataUrl?: string
  imageUrl?: string
  context?: string
  clientOcrText?: string
  ocrText?: string
}

export interface ReadNameplateResponse {
  ok: boolean
  data?: NameplateExtractedData
  method?: string
  message?: string
}

export async function readNameplateFromImage(
  payload: ReadNameplatePayload,
): Promise<ReadNameplateResponse> {
  try {
    const res = await pb.send('/backend/v1/field-visits/equipment/read-nameplate', {
      method: 'POST',
      body: JSON.stringify({
        clientOcrText: payload.clientOcrText || payload.ocrText,
        ocrText: payload.clientOcrText || payload.ocrText,
        context: payload.context,
        // Envia image/imageUrl apenas se não houver clientOcrText (ou se explicitamente fornecido)
        ...(payload.clientOcrText
          ? {}
          : {
              image: payload.imageDataUrl,
              imageUrl: payload.imageUrl,
            }),
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
