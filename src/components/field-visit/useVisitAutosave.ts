import { useEffect } from 'react'
import {
  type FieldVisitData,
  STORAGE_KEY_CURRENT_VISIT,
  STORAGE_KEY_EMPLOYEE_NAME,
} from '@/types/field-visit'
import { sanitizeVisitForStorage } from '@/services/field-visit-media'

/**
 * Grava o rascunho SEM base64/blob de foto ou vídeo: o arquivo mora no servidor
 * (field_visit_media) e o celular guarda só a referência + cópia no IndexedDB.
 */
function persistNow(visit: FieldVisitData): { ok: true } | { ok: false; err: any } {
  try {
    const payload = JSON.stringify(
      sanitizeVisitForStorage({ ...visit, updatedAt: new Date().toISOString() }),
    )
    localStorage.setItem(STORAGE_KEY_CURRENT_VISIT, payload)
    if (visit.employeeName) {
      localStorage.setItem(STORAGE_KEY_EMPLOYEE_NAME, visit.employeeName)
    }
    return { ok: true }
  } catch (err: any) {
    return { ok: false, err }
  }
}

function storageWarning(err: any): string {
  const quota =
    err?.name === 'QuotaExceededError' ||
    err?.code === 22 ||
    err?.code === 1014 ||
    err?.name === 'NS_ERROR_DOM_QUOTA_REACHED'
  if (quota) {
    return (
      'Atenção: o limite de armazenamento local foi atingido. Seus textos continuam preservados ' +
      'na tela; as fotos e vídeos ficam guardados no servidor — toque em "Enviar CRM" para garantir o envio.'
    )
  }
  return 'Não foi possível salvar no armazenamento local: ' + (err?.message || 'Erro desconhecido')
}

export function useVisitAutosave({
  visit,
  setSaveStatus,
  setQuotaWarning,
}: {
  visit: FieldVisitData
  setSaveStatus: (s: 'saved' | 'saving') => void
  setQuotaWarning: (s: string | null) => void
}) {
  // Auto-save com debounce (mesma régua de antes) — agora sem base64 no rascunho
  useEffect(() => {
    setSaveStatus('saving')
    const timer = setTimeout(() => {
      const r = persistNow(visit)
      if (r.ok) {
        setSaveStatus('saved')
        setQuotaWarning(null)
      } else {
        console.error('Erro ao salvar no localStorage:', r.err)
        setQuotaWarning(storageWarning(r.err))
        setSaveStatus('saved')
      }
    }, 1000)

    return () => clearTimeout(timer)
  }, [visit])

  // Salvar também ao sair/minimizar a página (mobile: momento mais comum de perda)
  useEffect(() => {
    const saveNow = () => {
      persistNow(visit)
    }
    window.addEventListener('pagehide', saveNow)
    document.addEventListener('visibilitychange', saveNow)
    return () => {
      window.removeEventListener('pagehide', saveNow)
      document.removeEventListener('visibilitychange', saveNow)
    }
  }, [visit])

  // Auto-save por inatividade: se o técnico parar de digitar por 15s, salva na hora
  useEffect(() => {
    const idleSave = setTimeout(() => {
      persistNow(visit)
    }, 15000)
    return () => clearTimeout(idleSave)
  }, [visit])
}
