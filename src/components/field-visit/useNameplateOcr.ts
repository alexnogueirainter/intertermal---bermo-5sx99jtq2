import { useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import { toast } from '@/hooks/use-toast'
import {
  readNameplateFromImage,
  compareAndMergeNameplateData,
  type NameplateComparisonResult,
} from '@/services/nameplate-reader'
import type { EquipmentItem, FieldVisitData, MediaAttachment } from '@/types/field-visit'

export function useNameplateOcr({
  visit,
  setVisit,
}: {
  visit: FieldVisitData
  setVisit: Dispatch<SetStateAction<FieldVisitData>>
}) {
  // Leitura Automática de Plaqueta por Foto (OCR Cliente + Agente Skip Cloud)
  const [isReadingNameplate, setIsReadingNameplate] = useState(false)
  const [nameplateReadingStatus, setNameplateReadingStatus] = useState<string>('Lendo placa...')
  const [readingEquipmentId, setReadingEquipmentId] = useState<string | null>(null)
  const [activeReadingAttachmentId, setActiveReadingAttachmentId] = useState<string | null>(null)
  const [ocrReviewOpen, setOcrReviewOpen] = useState(false)
  const [ocrComparisonResult, setOcrComparisonResult] = useState<NameplateComparisonResult | null>(
    null,
  )
  const [targetOcrEquipment, setTargetOcrEquipment] = useState<EquipmentItem | null>(null)
  const handleTriggerNameplateOcr = async (equipmentId: string, photo: MediaAttachment) => {
    const currentEq = visit.equipments.find((e) => e.id === equipmentId)
    if (!currentEq) return

    setIsReadingNameplate(true)
    setNameplateReadingStatus('Lendo placa...')
    setReadingEquipmentId(equipmentId)
    setActiveReadingAttachmentId(photo.id)

    try {
      // 1. OCR no navegador com Tesseract.js e pré-processamento via canvas
      let ocrText = ''
      try {
        const { runClientOcr } = await import('@/services/client-ocr')
        const ocrResult = await runClientOcr(photo.dataUrl, (p) => {
          setNameplateReadingStatus(p.status || 'Lendo placa...')
        })
        ocrText = (ocrResult.text || '').trim()
      } catch (ocrErr) {
        console.warn('[FieldVisitPage] Falha no OCR do cliente:', ocrErr)
      }

      // Se o OCR não retornou texto visível suficiente
      if (!ocrText) {
        toast({
          title: 'Não foi possível ler a placa',
          description: 'Tire a foto novamente ou preencha manualmente.',
        })
        return
      }

      setNameplateReadingStatus('Interpretando dados técnicos...')

      // 2. Envia o texto transcrito + a foto ao backend: a foto é o fallback de
      // visão (Gemini) quando o OCR do navegador não produz dados úteis
      const res = await readNameplateFromImage({
        clientOcrText: ocrText,
        imageDataUrl: photo.dataUrl,
        context: `Equipamento ${currentEq.name || ''} - Modelo atual: ${currentEq.model || 'vazio'}`,
      })

      if (res.ok && res.data) {
        // Disparado diretamente pelo evento da foto: aplica os dados extraídos sem diálogo bloqueante
        const comparison = compareAndMergeNameplateData(currentEq, res.data, photo.id)
        const mergedEq = comparison.mergedEquipment

        // Aplica diretamente ao equipamento usando setVisit((prev) => ...) reativo
        setVisit((prev) => {
          const freshCurrentEq = prev.equipments.find((e) => e.id === equipmentId)
          if (!freshCurrentEq) return prev

          // Helper para preencher SÓ campos vazios, preservando estritamente valores já digitados pelo técnico
          const fillOnlyIfEmpty = (currentVal: any, incomingVal: any): string => {
            const c =
              currentVal !== undefined && currentVal !== null ? String(currentVal).trim() : ''
            if (c) return String(currentVal)
            return incomingVal !== undefined && incomingVal !== null
              ? String(incomingVal).trim()
              : ''
          }

          // Mesclagem segura campo a campo
          const updatedEquipment: EquipmentItem = {
            ...freshCurrentEq,
            tag: fillOnlyIfEmpty(freshCurrentEq.tag, mergedEq.tag),
            service: fillOnlyIfEmpty(freshCurrentEq.service, mergedEq.service),
            manufacturingNumber: fillOnlyIfEmpty(
              freshCurrentEq.manufacturingNumber,
              mergedEq.manufacturingNumber,
            ),
            model: fillOnlyIfEmpty(freshCurrentEq.model, mergedEq.model),
            manufacturer: fillOnlyIfEmpty(freshCurrentEq.manufacturer, mergedEq.manufacturer),
            serialNumber: fillOnlyIfEmpty(freshCurrentEq.serialNumber, mergedEq.serialNumber),
            designPressureBar: fillOnlyIfEmpty(
              freshCurrentEq.designPressureBar,
              mergedEq.designPressureBar,
            ),
            testPressureBar: fillOnlyIfEmpty(
              freshCurrentEq.testPressureBar,
              mergedEq.testPressureBar,
            ),
            designTempC: fillOnlyIfEmpty(freshCurrentEq.designTempC, mergedEq.designTempC),
            pmtaMpa: fillOnlyIfEmpty(freshCurrentEq.pmtaMpa, mergedEq.pmtaMpa),
            emptyWeightKg: fillOnlyIfEmpty(freshCurrentEq.emptyWeightKg, mergedEq.emptyWeightKg),
            manufacturingYear: fillOnlyIfEmpty(
              freshCurrentEq.manufacturingYear,
              mergedEq.manufacturingYear,
            ),
            tighteningMaxA: fillOnlyIfEmpty(freshCurrentEq.tighteningMaxA, mergedEq.tighteningMaxA),
            tighteningMinA: fillOnlyIfEmpty(freshCurrentEq.tighteningMinA, mergedEq.tighteningMinA),
            plateCount: fillOnlyIfEmpty(freshCurrentEq.plateCount, mergedEq.plateCount),
            fluid1: fillOnlyIfEmpty(freshCurrentEq.fluid1, mergedEq.fluid1),
            fluid2: fillOnlyIfEmpty(freshCurrentEq.fluid2, mergedEq.fluid2),
            flowRate: fillOnlyIfEmpty(freshCurrentEq.flowRate, mergedEq.flowRate),
            flowUnit: fillOnlyIfEmpty(freshCurrentEq.flowUnit, mergedEq.flowUnit),
          }

          // Adicionar customFields novos vindos do OCR sem duplicar labels existentes
          const currentCustom = freshCurrentEq.customFields || []
          const incomingCustom = mergedEq.customFields || []
          const mergedCustom = [...currentCustom]

          for (const inc of incomingCustom) {
            const incLabel = (inc.label || '').trim().toLowerCase()
            if (!incLabel) continue
            const alreadyExists = mergedCustom.some(
              (c) => (c.label || '').trim().toLowerCase() === incLabel,
            )
            if (!alreadyExists) {
              mergedCustom.push(inc)
            }
          }
          updatedEquipment.customFields = mergedCustom

          // Preservar metadados da leitura, discrepâncias registradas e campos não identificados
          updatedEquipment.nameplateOcrData = {
            ...(freshCurrentEq.nameplateOcrData || {}),
            ...(mergedEq.nameplateOcrData || {}),
            discrepancies:
              comparison.discrepancies ||
              mergedEq.nameplateOcrData?.discrepancies ||
              freshCurrentEq.nameplateOcrData?.discrepancies ||
              [],
          }

          return {
            ...prev,
            equipments: prev.equipments.map((eq) =>
              eq.id === equipmentId ? updatedEquipment : eq,
            ),
          }
        })

        // Notificação toast discreta e não-bloqueante (o técnico pode ignorar e continuar trabalhando)
        const filledCount = comparison.autoFilled.length
        const discCount = comparison.discrepancies.length

        let descText = ''
        if (filledCount > 0 && discCount > 0) {
          descText = `${filledCount} ${filledCount === 1 ? 'campo preenchido' : 'campos preenchidos'}, ${discCount} ${discCount === 1 ? 'divergência a revisar' : 'divergências a revisar'}.`
        } else if (filledCount > 0) {
          descText = `${filledCount} ${filledCount === 1 ? 'campo preenchido automaticamente' : 'campos preenchidos automaticamente'}.`
        } else if (discCount > 0) {
          descText = `Campos mantidos intactos (${discCount} ${discCount === 1 ? 'divergência apontada sob o input' : 'divergências apontadas sob os inputs'}).`
        } else {
          descText = 'Dados da placa compatíveis com o formulário.'
        }

        toast({
          title: 'Dados da placa aplicados',
          description: descText,
        })
      } else {
        toast({
          title: 'Não foi possível ler a placa',
          description: res.message || 'Tire a foto novamente ou preencha manualmente.',
        })
      }
    } catch (err: any) {
      console.warn('Falha na leitura da plaqueta:', err)
      toast({
        title: 'Não foi possível ler a placa',
        description: 'Tire a foto novamente ou preencha manualmente.',
      })
    } finally {
      setIsReadingNameplate(false)
      setNameplateReadingStatus('Lendo placa...')
      setReadingEquipmentId(null)
      setActiveReadingAttachmentId(null)
    }
  }

  // Aplicação manual caso algum fluxo secundário utilize (mantido compatível)
  const handleApplyNameplateOcr = (mergedEq: EquipmentItem) => {
    if (!mergedEq || !mergedEq.id) return
    const targetId = mergedEq.id

    setVisit((prev) => {
      // Localiza o equipamento alvo no estado mais recente
      const currentEq = prev.equipments.find((e) => e.id === targetId)
      if (!currentEq) return prev

      // Helper para preencher SÓ campos vazios, preservando estritamente valores já digitados
      const fillOnlyIfEmpty = (currentVal: any, incomingVal: any): string => {
        const c = currentVal !== undefined && currentVal !== null ? String(currentVal).trim() : ''
        if (c) return String(currentVal)
        return incomingVal !== undefined && incomingVal !== null ? String(incomingVal).trim() : ''
      }

      // Mesclagem segura campo a campo
      const updatedEquipment: EquipmentItem = {
        ...currentEq,
        tag: fillOnlyIfEmpty(currentEq.tag, mergedEq.tag),
        service: fillOnlyIfEmpty(currentEq.service, mergedEq.service),
        manufacturingNumber: fillOnlyIfEmpty(
          currentEq.manufacturingNumber,
          mergedEq.manufacturingNumber,
        ),
        model: fillOnlyIfEmpty(currentEq.model, mergedEq.model),
        manufacturer: fillOnlyIfEmpty(currentEq.manufacturer, mergedEq.manufacturer),
        serialNumber: fillOnlyIfEmpty(currentEq.serialNumber, mergedEq.serialNumber),
        designPressureBar: fillOnlyIfEmpty(currentEq.designPressureBar, mergedEq.designPressureBar),
        testPressureBar: fillOnlyIfEmpty(currentEq.testPressureBar, mergedEq.testPressureBar),
        designTempC: fillOnlyIfEmpty(currentEq.designTempC, mergedEq.designTempC),
        pmtaMpa: fillOnlyIfEmpty(currentEq.pmtaMpa, mergedEq.pmtaMpa),
        emptyWeightKg: fillOnlyIfEmpty(currentEq.emptyWeightKg, mergedEq.emptyWeightKg),
        manufacturingYear: fillOnlyIfEmpty(currentEq.manufacturingYear, mergedEq.manufacturingYear),
        tighteningMaxA: fillOnlyIfEmpty(currentEq.tighteningMaxA, mergedEq.tighteningMaxA),
        tighteningMinA: fillOnlyIfEmpty(currentEq.tighteningMinA, mergedEq.tighteningMinA),
        plateCount: fillOnlyIfEmpty(currentEq.plateCount, mergedEq.plateCount),
        fluid1: fillOnlyIfEmpty(currentEq.fluid1, mergedEq.fluid1),
        fluid2: fillOnlyIfEmpty(currentEq.fluid2, mergedEq.fluid2),
        flowRate: fillOnlyIfEmpty(currentEq.flowRate, mergedEq.flowRate),
        flowUnit: fillOnlyIfEmpty(currentEq.flowUnit, mergedEq.flowUnit),
      }

      // Adicionar customFields novos vindos do OCR sem duplicar labels existentes
      const currentCustom = currentEq.customFields || []
      const incomingCustom = mergedEq.customFields || []
      const mergedCustom = [...currentCustom]

      for (const inc of incomingCustom) {
        const incLabel = (inc.label || '').trim().toLowerCase()
        if (!incLabel) continue
        const alreadyExists = mergedCustom.some(
          (c) => (c.label || '').trim().toLowerCase() === incLabel,
        )
        if (!alreadyExists) {
          mergedCustom.push(inc)
        }
      }
      updatedEquipment.customFields = mergedCustom

      // Preservar metadados da leitura e discrepâncias
      updatedEquipment.nameplateOcrData = {
        ...(currentEq.nameplateOcrData || {}),
        ...(mergedEq.nameplateOcrData || {}),
        discrepancies:
          mergedEq.nameplateOcrData?.discrepancies ||
          ocrComparisonResult?.discrepancies ||
          currentEq.nameplateOcrData?.discrepancies ||
          [],
      }

      return {
        ...prev,
        equipments: prev.equipments.map((eq) => (eq.id === targetId ? updatedEquipment : eq)),
      }
    })

    setOcrReviewOpen(false)
    setOcrComparisonResult(null)
    setTargetOcrEquipment(null)
    toast({
      title: 'Dados da placa aplicados!',
      description: 'Campos vazios preenchidos e novos campos adicionados com sucesso.',
    })
  }

  const handleDiscardNameplateOcr = () => {
    setOcrReviewOpen(false)
    setOcrComparisonResult(null)
    setTargetOcrEquipment(null)
  }
  return {
    isReadingNameplate,
    nameplateReadingStatus,
    readingEquipmentId,
    activeReadingAttachmentId,
    ocrReviewOpen,
    setOcrReviewOpen,
    ocrComparisonResult,
    targetOcrEquipment,
    handleTriggerNameplateOcr,
    handleApplyNameplateOcr,
    handleDiscardNameplateOcr,
  }
}
