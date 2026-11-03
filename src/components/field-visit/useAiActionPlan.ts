import { useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import { toast } from '@/hooks/use-toast'
import { sellerTokenApi } from '@/services/field-visit-token'
import { generateId, type FieldVisitData } from '@/types/field-visit'

export function useAiActionPlan({
  visit,
  setVisit,
}: {
  visit: FieldVisitData
  setVisit: Dispatch<SetStateAction<FieldVisitData>>
}) {
  // Análise IA: plano de ação sugerido a partir do que o técnico registrou
  const [isAiLoading, setIsAiLoading] = useState(false)
  const [aiConfirmOpen, setAiConfirmOpen] = useState(false)
  const [aiDraft, setAiDraft] = useState<any[] | null>(null)
  const [aiMessage, setAiMessage] = useState('')
  const handleAiAnalysis = async () => {
    const hasContent =
      (visit.generalObservations || '').trim() ||
      (visit.freeDescription || '').trim() ||
      (visit.equipments || []).some((eq) => (eq.technicianNotes || '').trim())
    if (!hasContent) {
      toast({
        title: 'Sem conteúdo suficiente para análise',
        description: 'Escreva observações ou notas nos equipamentos antes de usar a Análise IA.',
        variant: 'destructive',
      })
      return
    }
    setIsAiLoading(true)
    try {
      const res = await sellerTokenApi.aiPlan({
        work_type: visit.workType || '',
        work_type_other: visit.workTypeOther || '',
        general_notes: visit.generalObservations || '',
        free_description: visit.freeDescription || '',
        equipments: (visit.equipments || []).map((eq) => ({
          id: eq.id,
          name: eq.name || '',
          model: eq.model || '',
          manufacturer: eq.manufacturer || '',
          serialNumber: eq.serialNumber || '',
          plateCount: eq.plateCount || '',
          fluid1: eq.fluid1 || '',
          fluid2: eq.fluid2 || '',
          inletTemp: eq.inletTemp || '',
          outletTemp: eq.outletTemp || '',
          flowRate: eq.flowRate || '',
          flowUnit: eq.flowUnit || '',
          installedLocation: eq.installedLocation || '',
          difficulty: eq.difficulty || '',
          technicianNotes: eq.technicianNotes || '',
          attachments_count: (eq.attachments || []).length,
          // Dados da Plaqueta
          tag: eq.tag || '',
          service: eq.service || '',
          manufacturingNumber: eq.manufacturingNumber || '',
          designPressureBar: eq.designPressureBar || '',
          testPressureBar: eq.testPressureBar || '',
          designTempC: eq.designTempC || '',
          pmtaMpa: eq.pmtaMpa || '',
          emptyWeightKg: eq.emptyWeightKg || '',
          manufacturingYear: eq.manufacturingYear || '',
          tighteningMaxA: eq.tighteningMaxA || '',
          tighteningMinA: eq.tighteningMinA || '',
        })),
      })
      if (res.ok && res.items && res.items.length > 0) {
        setAiDraft(res.items)
        setAiConfirmOpen(true)
      } else {
        toast({
          title: res.message || 'Análise indisponível',
          description: 'Não foi possível gerar a análise da IA com os dados atuais.',
          variant: 'destructive',
        })
      }
    } catch (_) {
      toast({
        title: 'Falha na análise IA',
        description: 'Tente acionar novamente.',
        variant: 'destructive',
      })
    } finally {
      setIsAiLoading(false)
    }
  }

  const handleAiConfirm = () => {
    if (!aiDraft || aiDraft.length === 0) return
    const mapped: any[] = aiDraft.map((it) => ({
      id: generateId(),
      title: it.title || 'Item do plano',
      description: it.description || '',
      priority: ['Alta', 'Média', 'Baixa'].includes(it.priority) ? it.priority : 'Média',
      suggestedAction: it.suggestedAction || '',
      source: it.equipment_id ? 'Equipamento sinalizado (com foto no relatório)' : undefined,
      equipment_id: it.equipment_id || undefined,
      diagnosis: it.diagnosis || undefined,
      technicalReference: it.technicalReference || undefined,
      installationConditions: it.installationConditions || undefined,
      pendingItems:
        Array.isArray(it.pendingItems) && it.pendingItems.length > 0 ? it.pendingItems : undefined,
    }))
    setVisit((prev) => ({ ...prev, actionPlan: mapped }))
    setAiConfirmOpen(false)
    setAiDraft(null)
    toast({
      title: 'Plano de ação da IA aplicado',
      description: 'Plano de ação estruturado em 4 seções atualizado com sucesso.',
    })
  }
  return {
    isAiLoading,
    aiConfirmOpen,
    aiDraft,
    setAiConfirmOpen,
    handleAiAnalysis,
    handleAiConfirm,
  }
}
