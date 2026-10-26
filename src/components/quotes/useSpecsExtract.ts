import {
  extractEquipmentSpecs,
  EquipmentWebSearchResultItem,
  EquipmentSpecsExtractionResponse,
} from '@/services/quotes'
import type { useToast } from '@/hooks/use-toast'
import { QuoteEquipmentItem, QuoteStatus } from '@/types/crm'
import type { Dispatch, SetStateAction } from 'react'

interface MakeSpecsExtractDeps {
  gasketMaterial: string
  handleUpdateEquipment: (index: number, patch: Partial<QuoteEquipmentItem>) => any
  plateCount: number | undefined
  plateMaterial: string
  setTechnicalProvenance: Dispatch<SetStateAction<any[]>>
  setWebSearchExtractingId: Dispatch<SetStateAction<string | null>>
  setWebSearchExtractionByResult: Dispatch<
    SetStateAction<Record<string, EquipmentSpecsExtractionResponse>>
  >
  setWebSearchSelectedFields: Dispatch<SetStateAction<Record<string, Record<string, boolean>>>>
  status: QuoteStatus
  toast: ReturnType<typeof useToast>['toast']
  webSearchActiveIndex: number
  webSearchExtractionByResult: Record<string, EquipmentSpecsExtractionResponse>
  webSearchSelectedFields: Record<string, Record<string, boolean>>
}

export function makeSpecsExtract(p: MakeSpecsExtractDeps) {
  const {
    gasketMaterial,
    handleUpdateEquipment,
    plateCount,
    plateMaterial,
    setTechnicalProvenance,
    setWebSearchExtractingId,
    setWebSearchExtractionByResult,
    setWebSearchSelectedFields,
    status,
    toast,
    webSearchActiveIndex,
    webSearchExtractionByResult,
    webSearchSelectedFields,
  } = p

  const handleExtractSpecsFromResult = async (result: EquipmentWebSearchResultItem) => {
    if (!result.url) {
      toast({
        title: 'Fonte sem URL',
        description: 'Este candidato não possui uma fonte que possa ser extraída.',
        variant: 'destructive',
      })
      return
    }

    setWebSearchExtractingId(result.id)
    try {
      const extraction = await extractEquipmentSpecs(result.url, result.brand, result.model)
      setWebSearchExtractionByResult((prev) => ({ ...prev, [result.id]: extraction }))
      const fieldKeys = Object.keys(extraction.fieldEvidence || {})
      setWebSearchSelectedFields((prev) => ({
        ...prev,
        [result.id]: Object.fromEntries(fieldKeys.map((field) => [field, true])),
      }))
      if (!extraction.found) {
        toast({
          title: 'Nenhum campo técnico extraído',
          description:
            extraction.message ||
            'A fonte não apresentou valores explícitos nos campos suportados.',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.warn('Falha ao extrair a fonte oficial:', error)
      toast({
        title: 'Falha na extração',
        description: 'A fonte não pôde ser lida agora. Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setWebSearchExtractingId(null)
    }
  }

  const handleApplyExtractedResult = (result: EquipmentWebSearchResultItem) => {
    const extraction = webSearchExtractionByResult[result.id]
    if (!extraction || !extraction.specs || !extraction.fieldEvidence) {
      toast({
        title: 'Nada para aplicar',
        description: 'Extraia e revise os campos antes de aplicar qualquer dado.',
        variant: 'destructive',
      })
      return
    }

    const selected = webSearchSelectedFields[result.id] || {}
    const specs = extraction.specs as Record<string, any>
    const patch: Partial<QuoteEquipmentItem> = {}
    const appliedFields: Record<string, any> = {}

    const isSelected = (field: string) => selected[field] !== false
    const numericValue = (value: any) => {
      const match = String(value || '')
        .replace(',', '.')
        .match(/-?\d+(?:\.\d+)?/)
      return match ? Number(match[0]) : undefined
    }

    if (isSelected('plateCount') && specs.plateCount !== undefined) {
      const value = numericValue(specs.plateCount)
      if (value !== undefined && value > 0) {
        patch.plate_count = value
        appliedFields.plateCount = extraction.fieldEvidence.plateCount
      }
    }
    if (isSelected('plateMaterial') && specs.plateMaterial) {
      patch.plate_material = String(specs.plateMaterial).trim()
      appliedFields.plateMaterial = extraction.fieldEvidence.plateMaterial
    }
    if (isSelected('gasketMaterial') && specs.gasketMaterial) {
      patch.gasket_material = String(specs.gasketMaterial).trim()
      appliedFields.gasketMaterial = extraction.fieldEvidence.gasketMaterial
    }
    if (isSelected('connection') && specs.connection) {
      patch.connection_size = String(specs.connection).trim()
      appliedFields.connection = extraction.fieldEvidence.connection
    }
    if (isSelected('pressure') && specs.pressure !== undefined) {
      const value = numericValue(specs.pressure)
      if (value !== undefined && value > 0) {
        patch.working_pressure_bar = value
        appliedFields.pressure = extraction.fieldEvidence.pressure
      }
    }
    if (isSelected('testPressure') && specs.testPressure !== undefined) {
      const value = numericValue(specs.testPressure)
      if (value !== undefined && value > 0) {
        patch.pressure_test_bar = value
        appliedFields.testPressure = extraction.fieldEvidence.testPressure
      }
    }
    if (isSelected('plateDimensions') && specs.plateDimensions) {
      patch.dimensions_w_h_d = String(specs.plateDimensions).trim()
      appliedFields.plateDimensions = extraction.fieldEvidence.plateDimensions
    }
    if (isSelected('weightKg') && specs.weightKg !== undefined) {
      const value = numericValue(specs.weightKg)
      if (value !== undefined && value > 0) {
        patch.weight_kg = value
        appliedFields.weightKg = extraction.fieldEvidence.weightKg
      }
    }

    if (result.brand && result.brand.trim() && isSelected('__brand')) {
      patch.brand = result.brand.trim()
      appliedFields.__brand = {
        value: result.brand.trim(),
        sourceUrl: result.url,
        sourceText:
          'Fabricante identificado na fonte candidata; revisão manual realizada pelo usuário.',
        status: 'reviewed',
      }
    }
    if (result.model && result.model.trim() && isSelected('__model')) {
      patch.model = result.model.trim()
      appliedFields.__model = {
        value: result.model.trim(),
        sourceUrl: result.url,
        sourceText:
          'Modelo informado/localizado na fonte candidata; revisão manual realizada pelo usuário.',
        status: 'reviewed',
      }
    }

    if (Object.keys(appliedFields).length === 0) {
      toast({
        title: 'Nenhum campo selecionado',
        description: 'Marque ao menos um campo explícito antes de aplicar.',
        variant: 'destructive',
      })
      return
    }

    handleUpdateEquipment(webSearchActiveIndex, patch)
    setTechnicalProvenance((prev) => [
      ...prev.filter(
        (entry) =>
          !(entry.equipmentIndex === webSearchActiveIndex && entry.sourceUrl === result.url),
      ),
      {
        equipmentIndex: webSearchActiveIndex,
        model: result.model || extraction.model || '',
        brand: result.brand || extraction.brand || '',
        sourceUrl: result.url,
        sourceTitle: result.title,
        sourceDomain: result.sourceDomain,
        extractedAt: new Date().toISOString(),
        fields: appliedFields,
        reviewStatus: 'applied_manually',
      },
    ])

    toast({
      title: 'Campos selecionados aplicados',
      description:
        'A proposta recebeu somente os valores revisados. Nenhum campo derivado foi criado.',
    })
  }

  // Preencher descrição padrão dos serviços

  return {
    handleExtractSpecsFromResult,
    handleApplyExtractedResult,
  }
}
