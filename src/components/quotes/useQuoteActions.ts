import pb from '@/lib/pocketbase/client'
import { quoteDealSyncService } from '@/services/quotes-deal-sync'
import {
  computeQuoteDiffs,
  extractQuoteSnapshot,
  quoteHistoryService,
  QuoteSnapshot,
} from '@/services/quote-history'
import { QuoteRecord, QuoteStatus } from '@/types/crm'
import type { Dispatch, MutableRefObject, SetStateAction } from 'react'
import type { useToast } from '@/hooks/use-toast'

interface MakeQuoteActionsDeps {
  activeQuoteId: string | null
  assignedTo: string
  getFormDataObject: () => Partial<QuoteRecord>
  initialSnapshotRef: MutableRefObject<QuoteSnapshot | null>
  loadQuoteIntoForm: (quote: QuoteRecord) => any
  loadedQuoteIdRef: MutableRefObject<string | null>
  onCreateQuote: (data: Partial<QuoteRecord>) => Promise<void>
  onDeleteQuote: (id: string) => Promise<void>
  onUpdateQuote: (id: string, data: Partial<QuoteRecord>) => Promise<void>
  onUpdateQuoteStatus: ((id: string, status: QuoteStatus) => Promise<void>) | undefined
  resetForm: () => any
  setIsEditorOpen: Dispatch<SetStateAction<boolean>>
  setIsPreviewOpen: Dispatch<SetStateAction<boolean>>
  setIsSaving: Dispatch<SetStateAction<boolean>>
  setPreviewViewMode: Dispatch<SetStateAction<'client' | 'internal'>>
  setQuoteForPreview: Dispatch<SetStateAction<QuoteRecord | null>>
  setStatus: Dispatch<SetStateAction<QuoteStatus>>
  status: QuoteStatus
  toast: ReturnType<typeof useToast>['toast']
}

export function makeQuoteActions(p: MakeQuoteActionsDeps) {
  const {
    activeQuoteId,
    assignedTo,
    getFormDataObject,
    initialSnapshotRef,
    loadQuoteIntoForm,
    loadedQuoteIdRef,
    onCreateQuote,
    onDeleteQuote,
    onUpdateQuote,
    onUpdateQuoteStatus,
    resetForm,
    setIsEditorOpen,
    setIsPreviewOpen,
    setIsSaving,
    setPreviewViewMode,
    setQuoteForPreview,
    setStatus,
    status,
    toast,
  } = p

  const handleOpenCreateModal = () => {
    resetForm()
    setIsEditorOpen(true)
  }

  // Abrir editor para editar proposta existente
  const handleOpenEditModal = (quote: QuoteRecord) => {
    loadedQuoteIdRef.current = quote.id
    loadQuoteIntoForm(quote)
    setIsEditorOpen(true)
  }

  // Se receber selectedQuote das props externas (ex: do Kanban ou Pipeline), carrega e abre apenas se mudou de ID ou ao abrir
  // Durante a edição ativa (quando isEditorOpen é true e activeQuoteId === selectedQuote.id), NÃO recarrega para evitar reset/duplicação

  const handleSaveQuote = async () => {
    const payload = getFormDataObject()
    setIsSaving(true)
    try {
      if (activeQuoteId) {
        await onUpdateQuote(activeQuoteId, payload)
        // Dispara sincronização com o CRM (deals + service orders vinculadas).
        // REGRA: o card do funil só se move quando o STATUS da proposta muda de verdade.
        try {
          const quoteToSync = {
            ...payload,
            id: activeQuoteId,
            _statusChanged:
              (initialSnapshotRef.current?.status ?? payload.status) !== payload.status,
          } as QuoteRecord
          await quoteDealSyncService.syncQuoteToCrm(quoteToSync)
        } catch (syncErr) {
          console.warn('Erro ao sincronizar quote com CRM após update:', syncErr)
        }

        // Diff engine e gravação no histórico aditivo
        if (initialSnapshotRef.current) {
          const currentSnapshot = extractQuoteSnapshot(payload)
          const diffs = computeQuoteDiffs(initialSnapshotRef.current, currentSnapshot)
          if (diffs.length > 0) {
            await quoteHistoryService.recordDiffs(
              activeQuoteId,
              diffs,
              assignedTo || 'Usuário do Sistema',
            )
            initialSnapshotRef.current = currentSnapshot
          }
        }

        toast({ title: 'Alterações salvas com sucesso!' })
      } else {
        await onCreateQuote(payload)
        toast({ title: 'Nova proposta técnica criada!' })
      }
      setIsEditorOpen(false)
    } catch (err: any) {
      toast({
        title: 'Erro ao salvar proposta',
        description: err.message || 'Verifique os dados preenchidos.',
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  // Salvar como Rascunho explicitamente
  const handleSaveDraft = async () => {
    const payload = getFormDataObject()
    payload.status = 'draft'
    setStatus('draft')
    setIsSaving(true)
    try {
      if (activeQuoteId) {
        await onUpdateQuote(activeQuoteId, payload)
        // Dispara sincronização com o CRM (deals + service orders vinculadas).
        // REGRA: o card do funil só se move quando o STATUS da proposta muda de verdade.
        try {
          const quoteToSync = {
            ...payload,
            id: activeQuoteId,
            _statusChanged:
              (initialSnapshotRef.current?.status ?? payload.status) !== payload.status,
          } as QuoteRecord
          await quoteDealSyncService.syncQuoteToCrm(quoteToSync)
        } catch (syncErr) {
          console.warn('Erro ao sincronizar quote com CRM após salvar rascunho:', syncErr)
        }

        // Diff engine e gravação no histórico aditivo
        if (initialSnapshotRef.current) {
          const currentSnapshot = extractQuoteSnapshot(payload)
          const diffs = computeQuoteDiffs(initialSnapshotRef.current, currentSnapshot)
          if (diffs.length > 0) {
            await quoteHistoryService.recordDiffs(
              activeQuoteId,
              diffs,
              assignedTo || 'Usuário do Sistema',
            )
            initialSnapshotRef.current = currentSnapshot
          }
        }

        toast({ title: 'Rascunho salvo com sucesso!' })
      } else {
        await onCreateQuote(payload)
        toast({ title: 'Proposta salva como rascunho!' })
      }
      setIsEditorOpen(false)
    } catch (err: any) {
      toast({
        title: 'Erro ao salvar rascunho',
        description: err.message || 'Verifique os dados preenchidos.',
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  // Ações de Mudança de Status
  const handleSetStatus = async (quoteId: string, newStatus: QuoteStatus) => {
    try {
      if (onUpdateQuoteStatus) {
        await onUpdateQuoteStatus(quoteId, newStatus)
      } else {
        await onUpdateQuote(quoteId, { status: newStatus })
      }
      if (activeQuoteId === quoteId) {
        setStatus(newStatus)
      }
      toast({
        title:
          newStatus === 'approved'
            ? '🎉 Proposta Aprovada! Ordem de Serviço (OS) gerada no fluxo técnico.'
            : newStatus === 'rejected'
              ? 'Proposta marcada como recusada'
              : `Status alterado para ${newStatus}`,
      })
    } catch (err: any) {
      toast({
        title: 'Erro ao atualizar status',
        description: err.message,
        variant: 'destructive',
      })
    }
  }

  // Abrir Visualização do PDF nas duas visões
  const handleOpenPdfPreview = (quoteObj: QuoteRecord, mode: 'client' | 'internal' = 'client') => {
    setQuoteForPreview(quoteObj)
    setPreviewViewMode(mode)
    setIsPreviewOpen(true)
  }

  // Excluir proposta com confirmação + opção de excluir o negócio vinculado
  const handleDelete = async (quote: QuoteRecord) => {
    if (
      !confirm(
        `Deseja realmente excluir a proposta ${quote.quote_number || ''} do cliente ${quote.client_name || ''}?`,
      )
    ) {
      return
    }
    let deleteLinkedDeal = false
    if (quote.deal_id) {
      deleteLinkedDeal = confirm(
        `A proposta está vinculada ao negócio "${quote.deal_title || quote.quote_number || ''}" no Pipeline Comercial.\n\nExcluir também o negócio vinculado?`,
      )
    }
    try {
      await onDeleteQuote(quote.id)
      if (deleteLinkedDeal && quote.deal_id) {
        try {
          await pb.collection('deals').delete(quote.deal_id)
        } catch (dealErr: any) {
          toast({
            title: 'Negócio vinculado não excluído',
            description:
              dealErr?.message || 'A proposta foi excluída, mas o negócio permaneceu no pipeline.',
            variant: 'destructive',
          })
        }
      }
      if (activeQuoteId === quote.id) {
        setIsEditorOpen(false)
        resetForm()
      }
      toast({ title: 'Proposta excluída com sucesso.' })
    } catch (err: any) {
      toast({
        title: 'Erro ao excluir proposta',
        description: err.message,
        variant: 'destructive',
      })
    }
  }

  // Filtragem de Lista de Propostas

  return {
    handleOpenCreateModal,
    handleOpenEditModal,
    handleSaveQuote,
    handleSaveDraft,
    handleSetStatus,
    handleOpenPdfPreview,
    handleDelete,
  }
}
