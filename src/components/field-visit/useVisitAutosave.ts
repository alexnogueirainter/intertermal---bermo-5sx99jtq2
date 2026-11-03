import { useEffect } from 'react'
import {
  type FieldVisitData,
  STORAGE_KEY_CURRENT_VISIT,
  STORAGE_KEY_EMPLOYEE_NAME,
} from '@/types/field-visit'

export function useVisitAutosave({
  visit,
  setSaveStatus,
  setQuotaWarning,
}: {
  visit: FieldVisitData
  setSaveStatus: (s: 'saved' | 'saving') => void
  setQuotaWarning: (s: string | null) => void
}) {
  // Auto-save com debounce de 400ms (Regra geral: salvar automaticamente cada campo preenchido)
  useEffect(() => {
    setSaveStatus('saving')
    const timer = setTimeout(() => {
      try {
        const payload = JSON.stringify({
          ...visit,
          updatedAt: new Date().toISOString(),
        })
        localStorage.setItem(STORAGE_KEY_CURRENT_VISIT, payload)
        if (visit.employeeName) {
          localStorage.setItem(STORAGE_KEY_EMPLOYEE_NAME, visit.employeeName)
        }
        setSaveStatus('saved')
        setQuotaWarning(null)
      } catch (err: any) {
        console.error('Erro ao salvar no localStorage:', err)
        if (
          err.name === 'QuotaExceededError' ||
          err.code === 22 ||
          err.code === 1014 ||
          err.name === 'NS_ERROR_DOM_QUOTA_REACHED'
        ) {
          setQuotaWarning(
            'Atenção: O limite de armazenamento local foi atingido devido a múltiplos vídeos ou fotos em alta resolução. Seus textos continuam preservados na tela, mas recomendamos enviar ao CRM.',
          )
        } else {
          setQuotaWarning(
            'Não foi possível salvar no armazenamento local: ' +
              (err.message || 'Erro desconhecido'),
          )
        }
        setSaveStatus('saved')
      }
    }, 1000)

    return () => clearTimeout(timer)
  }, [visit])

  // Salvar também ao sair/minimizar a página (mobile: momento mais comum de perda)
  useEffect(() => {
    const saveNow = () => {
      try {
        localStorage.setItem(
          STORAGE_KEY_CURRENT_VISIT,
          JSON.stringify({ ...visit, updatedAt: new Date().toISOString() }),
        )
      } catch (_) {
        // storage indisponível: segue sem travar
      }
    }
    window.addEventListener('pagehide', saveNow)
    document.addEventListener('visibilitychange', saveNow)
    return () => {
      window.removeEventListener('pagehide', saveNow)
      document.removeEventListener('visibilitychange', saveNow)
    }
  }, [visit])

  // Auto-save por inatividade: se o técnico parar de digitar por 15s, salva na hora
  // (protege contra perda quando o app do navegador é fechado sem disparar pagehide)
  useEffect(() => {
    const idleSave = setTimeout(() => {
      try {
        localStorage.setItem(
          STORAGE_KEY_CURRENT_VISIT,
          JSON.stringify({ ...visit, updatedAt: new Date().toISOString() }),
        )
      } catch (_) {
        // storage indisponível: segue sem travar
      }
    }, 15000)
    return () => clearTimeout(idleSave)
  }, [visit])
}
