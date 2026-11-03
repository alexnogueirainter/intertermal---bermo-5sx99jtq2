import { quoteHistoryService, QuoteHistoryItem } from '@/services/quote-history'
import type { Dispatch, SetStateAction } from 'react'

interface MakeLoadQuoteHistoryDeps {
  setIsLoadingHistory: Dispatch<SetStateAction<boolean>>
  setQuoteHistoryList: Dispatch<SetStateAction<QuoteHistoryItem[]>>
}

export function makeLoadQuoteHistory(p: MakeLoadQuoteHistoryDeps) {
  const { setIsLoadingHistory, setQuoteHistoryList } = p

  const loadQuoteHistory = async (qId: string) => {
    if (!qId) {
      setQuoteHistoryList([])
      return
    }
    setIsLoadingHistory(true)
    try {
      const items = await quoteHistoryService.getHistoryByQuote(qId)
      setQuoteHistoryList(items)
    } catch (err) {
      console.warn('Erro ao carregar histórico:', err)
    } finally {
      setIsLoadingHistory(false)
    }
  }

  return {
    loadQuoteHistory,
  }
}
