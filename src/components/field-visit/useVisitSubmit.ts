import { useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import { toast } from '@/hooks/use-toast'
import { fieldVisitsService, type FieldVisitRecord } from '@/services/field-visits'
import { pendingQueue } from '@/services/field-visit-queue'
import { sellerTokenApi, getStoredToken, getStoredDeviceId } from '@/services/field-visit-token'
import { formatEquipmentTitle, type FieldVisitData } from '@/types/field-visit'

export function useVisitSubmit({
  visit,
  setVisit,
  sellerMode = false,
}: {
  visit: FieldVisitData
  setVisit: Dispatch<SetStateAction<FieldVisitData>>
  sellerMode?: boolean
}) {
  const [isSendingToCrm, setIsSendingToCrm] = useState(false)
  const handleSendToCrm = async () => {
    const trimmedEmployee = (visit.employeeName || '').trim()
    const trimmedDate = (visit.date || '').trim()

    // Validação prévia: os 3 campos obrigatórios (nunca bloquear em silêncio)
    const missing: string[] = []
    if (!(visit.date || '').trim()) missing.push('Data da visita')
    if (!((visit.companyName || '').trim() || (visit.clientName || '').trim()))
      missing.push('Cliente/Empresa')
    if (!visit.workType) missing.push('Tipo de visita')
    if (missing.length > 0) {
      toast({
        title: 'Faltam campos obrigatórios',
        description: 'Preencha: ' + missing.join(', ') + '.',
        variant: 'destructive',
      })
      return
    }

    // Validação obrigatória da resposta de manutenção em cada equipamento cadastrado nesta visita
    if (Array.isArray(visit.equipments) && visit.equipments.length > 0) {
      const pendingMaintenanceEquipments: string[] = []
      visit.equipments.forEach((eq, idx) => {
        if (eq.needsMaintenance === undefined || eq.needsMaintenance === null) {
          const label = formatEquipmentTitle(eq, idx)
          pendingMaintenanceEquipments.push(label)
        }
      })

      if (pendingMaintenanceEquipments.length > 0) {
        toast({
          title: 'Responda se o equipamento necessita de manutenção',
          description: `Defina Sim ou Não em: ${pendingMaintenanceEquipments.join(', ')}.`,
          variant: 'destructive',
        })
        return
      }
    }

    setIsSendingToCrm(true)
    const nowIso = new Date().toISOString()

    // Preserva o plano já gerado (pela IA ou existente no formulário), sem regenerar automaticamente
    const currentPlan = visit.actionPlan && visit.actionPlan.length > 0 ? visit.actionPlan : []

    // Formatar nome de cliente/empresa compatível
    const companyTrimmed = (visit.companyName || '').trim()
    const contactPersonTrimmed = (visit.clientName || '').trim()
    let combinedClientName: string | undefined = undefined
    if (companyTrimmed && contactPersonTrimmed) {
      combinedClientName = `${companyTrimmed} (${contactPersonTrimmed})`
    } else if (companyTrimmed) {
      combinedClientName = companyTrimmed
    } else if (contactPersonTrimmed) {
      combinedClientName = contactPersonTrimmed
    }

    // Preparar payload salvando em campos aditivos sem sobrescrever ou perder dados
    const payload: Partial<FieldVisitRecord> = {
      employee_name: trimmedEmployee || 'Técnico Intertermal',
      visit_date: trimmedDate || undefined,
      start_time: visit.startTime || undefined,
      end_time: visit.endTime || undefined,
      duration: visit.visitDuration || undefined,
      client_name: combinedClientName,
      company_name: companyTrimmed || undefined,
      contact_person: contactPersonTrimmed || undefined,
      client_role: visit.clientRole?.trim() || undefined,
      client_contact: visit.clientContact?.trim() || undefined,
      client_email: visit.clientEmail?.trim() || undefined,
      work_area: visit.clientWorkArea?.trim() || undefined,
      work_type: visit.workType || undefined,
      work_type_other: visit.workTypeOther?.trim() || undefined,
      general_notes: visit.generalObservations?.trim() || undefined,
      free_description: visit.freeDescription?.trim() || undefined,
      action_plan: currentPlan,
      equipment: visit.equipments || [],
      status: 'enviada',
      sent_at: nowIso,
    }

    // Identificador único da visita gerado no celular (idempotência de reenvio).
    let clientVisitId = (visit as any).clientVisitId || ''
    if (!clientVisitId) {
      clientVisitId =
        'cv_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 10)
      setVisit((prev) => ({ ...prev, clientVisitId }) as any)
    }

    if (sellerMode) {
      // Modo vendedor: envio pelo link seguro (token + aparelho autorizado), sem login.
      const submitRes = await sellerTokenApi.submitVisit({
        token: getStoredToken(),
        device_id: getStoredDeviceId(),
        client_visit_id: clientVisitId,
        visit: {
          visit_date: trimmedDate || undefined,
          start_time: visit.startTime || undefined,
          end_time: visit.endTime || undefined,
          duration: visit.visitDuration || undefined,
          client_name: combinedClientName,
          company_name: companyTrimmed || undefined,
          contact_person: contactPersonTrimmed || undefined,
          client_role: visit.clientRole?.trim() || undefined,
          client_contact: visit.clientContact?.trim() || undefined,
          client_email: visit.clientEmail?.trim() || undefined,
          work_area: visit.clientWorkArea?.trim() || undefined,
          work_type: visit.workType || undefined,
          work_type_other: visit.workTypeOther?.trim() || undefined,
          general_notes: visit.generalObservations?.trim() || undefined,
          free_description: visit.freeDescription?.trim() || undefined,
          action_plan: currentPlan,
          equipment: visit.equipments || [],
        },
        edit_id: visit.backendRecordId || undefined,
      })
      if (!submitRes.ok) {
        if (submitRes.error === 'device_not_authorized' || submitRes.error === 'invalid_token') {
          // Segurança: não entra na fila; pede ação do Alex.
          const msg =
            submitRes.error === 'device_not_authorized'
              ? 'Aparelho não autorizado. Fale com o Alex para liberar este celular.'
              : 'Seu link de acesso não está mais ativo. Peça um novo link ao Alex.'
          toast({ title: 'Erro ao enviar ao CRM', description: msg, variant: 'destructive' })
          setIsSendingToCrm(false)
          return
        }
        // Falha de rede/servidor: salva na fila de pendentes (idempotente).
        pendingQueue.add({
          client_visit_id: clientVisitId,
          visit: {
            visit_date: trimmedDate || undefined,
            start_time: visit.startTime || undefined,
            end_time: visit.endTime || undefined,
            duration: visit.visitDuration || undefined,
            client_name: combinedClientName,
            company_name: companyTrimmed || undefined,
            contact_person: contactPersonTrimmed || undefined,
            client_role: visit.clientRole?.trim() || undefined,
            client_contact: visit.clientContact?.trim() || undefined,
            client_email: visit.clientEmail?.trim() || undefined,
            work_area: visit.clientWorkArea?.trim() || undefined,
            work_type: visit.workType || undefined,
            work_type_other: visit.workTypeOther?.trim() || undefined,
            general_notes: visit.generalObservations?.trim() || undefined,
            free_description: visit.freeDescription?.trim() || undefined,
            action_plan: currentPlan,
            equipment: visit.equipments || [],
          },
          edit_id: visit.backendRecordId || undefined,
          seller_token: getStoredToken(),
        })
        setVisit((prev) => ({ ...prev, crmStatus: 'pendente' }) as any)
        toast({
          title: 'Sem conexão — visita salva em Pendentes',
          description: 'Será enviada automaticamente quando a internet voltar.',
          variant: 'destructive',
        })
        setIsSendingToCrm(false)
        return
      }
      setVisit((prev) => ({
        ...prev,
        actionPlan: currentPlan,
        backendRecordId: submitRes.visit_id || prev.backendRecordId,
        crmStatus: 'enviada',
        lastSentAt: nowIso,
        updatedAt: nowIso,
      }))
      toast({
        title: submitRes.edited ? 'Visita atualizada no CRM!' : 'Visita enviada ao CRM!',
        description: 'Relatório gravado com sucesso no CRM Intertermal.',
      })
      setIsSendingToCrm(false)
      return
    }

    try {
      let savedRecord: FieldVisitRecord
      if (visit.backendRecordId) {
        // Reenvio: atualiza o mesmo registro sem duplicar
        savedRecord = await fieldVisitsService.update(visit.backendRecordId, payload)
        toast({
          title: 'Visita atualizada no CRM!',
          description: `Os dados da visita e plano de ação foram sincronizados com sucesso.`,
        })
      } else {
        // Primeiro envio: cria novo registro
        savedRecord = await fieldVisitsService.create(payload)
        toast({
          title: 'Visita enviada ao CRM!',
          description: `Visita técnica gravada com sucesso no CRM Intertermal.`,
        })
      }

      setVisit((prev) => ({
        ...prev,
        actionPlan: currentPlan,
        backendRecordId: savedRecord.id,
        crmStatus: 'enviada',
        lastSentAt: nowIso,
        updatedAt: nowIso,
      }))
    } catch (err: any) {
      console.error('Erro ao enviar visita ao CRM:', err)
      toast({
        title: 'Erro ao enviar ao CRM',
        description:
          err.message ||
          'Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setIsSendingToCrm(false)
    }
  }

  return { isSendingToCrm, handleSendToCrm }
}
