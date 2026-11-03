import { useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import { toast } from '@/hooks/use-toast'
import { fieldVisitsService, type FieldVisitRecord } from '@/services/field-visits'
import { pendingQueue } from '@/services/field-visit-queue'
import { sellerTokenApi, getStoredToken, getStoredDeviceId } from '@/services/field-visit-token'
import {
  retryAllCachedMedia,
  applyMediaResults,
  stripLocalMediaRefs,
} from '@/services/field-visit-media'
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

    // 1. Sobe ao servidor toda mídia em cache local (reenvio automático antes do envio).
    // Falha de mídia NÃO bloqueia o envio: o hook do servidor resolve as referências depois.
    let effectiveVisit = visit
    try {
      const mediaRes = await retryAllCachedMedia({
        sellerToken: sellerMode ? getStoredToken() || undefined : undefined,
        deviceId: getStoredDeviceId(),
      })
      if (mediaRes.results.length > 0) {
        effectiveVisit = applyMediaResults(visit, mediaRes.results)
        setVisit(effectiveVisit)
      }
    } catch (_) {
      // segue com as referências pendentes; o servidor completa depois
    }

    // Preserva o plano já gerado (pela IA ou existente no formulário), sem regenerar automaticamente
    const currentPlan =
      effectiveVisit.actionPlan && effectiveVisit.actionPlan.length > 0
        ? effectiveVisit.actionPlan
        : []

    // Formatar nome de cliente/empresa compatível
    const companyTrimmed = (effectiveVisit.companyName || '').trim()
    const contactPersonTrimmed = (effectiveVisit.clientName || '').trim()
    let combinedClientName: string | undefined = undefined
    if (companyTrimmed && contactPersonTrimmed) {
      combinedClientName = `${companyTrimmed} (${contactPersonTrimmed})`
    } else if (companyTrimmed) {
      combinedClientName = companyTrimmed
    } else if (contactPersonTrimmed) {
      combinedClientName = contactPersonTrimmed
    }

    // Identificador único da visita gerado no celular (idempotência de reenvio).
    let clientVisitId = (effectiveVisit as any).clientVisitId || ''
    if (!clientVisitId) {
      clientVisitId =
        'cv_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 10)
      setVisit((prev) => ({ ...prev, clientVisitId }) as any)
    }

    // Preparar payload salvando em campos aditivos sem sobrescrever ou perder dados
    const payload: Partial<FieldVisitRecord> = {
      employee_name: trimmedEmployee || 'Técnico Intertermal',
      visit_date: trimmedDate || undefined,
      start_time: effectiveVisit.startTime || undefined,
      end_time: effectiveVisit.endTime || undefined,
      duration: effectiveVisit.visitDuration || undefined,
      client_name: combinedClientName,
      company_name: companyTrimmed || undefined,
      contact_person: contactPersonTrimmed || undefined,
      client_role: effectiveVisit.clientRole?.trim() || undefined,
      client_contact: effectiveVisit.clientContact?.trim() || undefined,
      client_email: effectiveVisit.clientEmail?.trim() || undefined,
      work_area: effectiveVisit.clientWorkArea?.trim() || undefined,
      work_type: effectiveVisit.workType || undefined,
      work_type_other: effectiveVisit.workTypeOther?.trim() || undefined,
      general_notes: effectiveVisit.generalObservations?.trim() || undefined,
      free_description: effectiveVisit.freeDescription?.trim() || undefined,
      action_plan: currentPlan,
      equipment: effectiveVisit.equipments || [],
      visit_attachments: effectiveVisit.visitAttachments || [],
      status: 'enviada',
      sent_at: nowIso,
    }

    // Nenhuma URL local (blob:/data:) sai do celular: anexo pendente vai como
    // referência vazia e o servidor resolve com o arquivo já enviado (ou que
    // ainda vai subir — o hook de upload completa o registro depois).
    const cleanPayload = stripLocalMediaRefs(payload) as Partial<FieldVisitRecord>

    if (sellerMode) {
      // Modo vendedor: envio pelo link seguro (token + aparelho autorizado), sem login.
      const submitRes = await sellerTokenApi.submitVisit({
        token: getStoredToken(),
        device_id: getStoredDeviceId(),
        client_visit_id: clientVisitId,
        visit: cleanPayload,
        edit_id: effectiveVisit.backendRecordId || undefined,
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
          visit: cleanPayload,
          edit_id: effectiveVisit.backendRecordId || undefined,
          seller_token: getStoredToken(),
        })
        setVisit((prev) => ({ ...prev, crmStatus: 'pendente' }) as any)
        toast({
          title: 'Não enviado — salvo em Pendentes',
          description:
            'Toque em "Enviar CRM" quando a internet voltar, ou aguarde o reenvio automático.',
          variant: 'destructive',
        })
        setIsSendingToCrm(false)
        return
      }
      // Servidor confirmou: visita nunca mais volta para pendente
      pendingQueue.remove(clientVisitId)
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
      if (effectiveVisit.backendRecordId) {
        // Reenvio: atualiza o mesmo registro sem duplicar
        savedRecord = await fieldVisitsService.update(effectiveVisit.backendRecordId, cleanPayload)
        toast({
          title: 'Visita atualizada no CRM!',
          description: `Os dados da visita e plano de ação foram sincronizados com sucesso.`,
        })
      } else {
        // Primeiro envio: cria novo registro
        savedRecord = await fieldVisitsService.create(cleanPayload)
        toast({
          title: 'Visita enviada ao CRM!',
          description: `Visita técnica gravada com sucesso no CRM Intertermal.`,
        })
      }

      // Servidor confirmou: tira da fila de pendentes (rascunho pode ser apagado com segurança)
      pendingQueue.remove(clientVisitId)
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
      // Falha de rede/servidor: entra na fila de pendentes (reenvio automático)
      pendingQueue.add({
        client_visit_id: clientVisitId,
        visit: cleanPayload,
      })
      setVisit((prev) => ({ ...prev, crmStatus: 'pendente' }) as any)
      toast({
        title: 'Não enviado — salvo em Pendentes',
        description:
          'Toque em "Enviar CRM" quando a internet voltar, ou aguarde o reenvio automático.',
        variant: 'destructive',
      })
    } finally {
      setIsSendingToCrm(false)
    }
  }

  return { isSendingToCrm, handleSendToCrm }
}
