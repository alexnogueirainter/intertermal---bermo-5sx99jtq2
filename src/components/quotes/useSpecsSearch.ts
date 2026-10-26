import {
  searchEquipmentWeb,
  EquipmentWebSearchResultItem,
  EquipmentSpecsExtractionResponse,
} from '@/services/quotes'
import type { useToast } from '@/hooks/use-toast'
import { QuoteEquipmentItem } from '@/types/crm'
import type { Dispatch, SetStateAction } from 'react'

interface MakeSpecsSearchDeps {
  equipmentBrand: string
  equipmentModel: string
  equipments: QuoteEquipmentItem[]
  setIsWebSearchModalOpen: Dispatch<SetStateAction<boolean>>
  setIsWebSearching: Dispatch<SetStateAction<boolean>>
  setSearchingSpecsIndex: Dispatch<SetStateAction<number | null>>
  setWebSearchActiveIndex: Dispatch<SetStateAction<number>>
  setWebSearchExtractionByResult: Dispatch<
    SetStateAction<Record<string, EquipmentSpecsExtractionResponse>>
  >
  setWebSearchMessage: Dispatch<SetStateAction<string>>
  setWebSearchQuery: Dispatch<SetStateAction<string>>
  setWebSearchResults: Dispatch<SetStateAction<EquipmentWebSearchResultItem[]>>
  setWebSearchSelectedFields: Dispatch<SetStateAction<Record<string, Record<string, boolean>>>>
  toast: ReturnType<typeof useToast>['toast']
  webSearchActiveIndex: number
}

export function makeSpecsSearch(p: MakeSpecsSearchDeps) {
  const {
    equipmentBrand,
    equipmentModel,
    equipments,
    setIsWebSearchModalOpen,
    setIsWebSearching,
    setSearchingSpecsIndex,
    setWebSearchActiveIndex,
    setWebSearchExtractionByResult,
    setWebSearchMessage,
    setWebSearchQuery,
    setWebSearchResults,
    setWebSearchSelectedFields,
    toast,
    webSearchActiveIndex,
  } = p

  const handleSearchSpecsOnline = async (index: number) => {
    const item = equipments[index]
    const model = (item?.model || equipmentModel || '').trim()
    const brand = (item?.brand || equipmentBrand || '').trim()

    if (!model) {
      toast({
        title: 'Modelo não informado',
        description: 'Digite o modelo do equipamento antes de buscar especificações.',
        variant: 'destructive',
      })
      return
    }

    setSearchingSpecsIndex(index)
    setWebSearchActiveIndex(index)
    setWebSearchQuery(model)
    setIsWebSearching(true)
    setWebSearchResults([])
    setWebSearchMessage('')
    setWebSearchExtractionByResult({})
    setWebSearchSelectedFields({})

    // Abre o modal interno imediatamente para feedback visual do usuário
    setIsWebSearchModalOpen(true)

    try {
      // 1. Linha primária: consulta o endpoint rico server-side
      const webResult = await searchEquipmentWeb(model, brand)

      if (webResult && webResult.success && webResult.results && webResult.results.length > 0) {
        setWebSearchResults(webResult.results)
        setWebSearchMessage(
          webResult.message || `Localizados ${webResult.results.length} resultados no servidor.`,
        )

        // A aplicação é sempre manual: primeiro selecione uma fonte e extraia os campos.
      } else {
        setWebSearchResults([])
        setWebSearchMessage(
          webResult?.message ||
            `Nenhuma fonte oficial retornou um resultado para "${brand} ${model}". Os campos técnicos permanecem vazios.`,
        )
      }
    } catch (err) {
      console.warn('Erro na busca server-side de especificações:', err)
      setWebSearchMessage(
        'O serviço de busca online pelo servidor está momentaneamente indisponível. Utilize a cópia de termos abaixo ou informe os dados manualmente.',
      )
    } finally {
      setIsWebSearching(false)
      setSearchingSpecsIndex(null)
    }
  }

  // Realizar nova busca com texto customizado dentro do modal interno
  const handlePerformInternalQuery = async (customQueryText: string) => {
    const cleanQuery = customQueryText.trim()
    if (!cleanQuery) return

    setIsWebSearching(true)
    setWebSearchMessage('')
    try {
      const activeEq = equipments[webSearchActiveIndex]
      const brand = activeEq?.brand || equipmentBrand || ''
      const res = await searchEquipmentWeb(cleanQuery, brand, cleanQuery)
      if (res && res.results && res.results.length > 0) {
        setWebSearchResults(res.results)
        setWebSearchMessage(res.message || `Localizados ${res.results.length} resultados.`)
      } else {
        setWebSearchResults([])
        setWebSearchMessage(`Nenhum resultado retornado para "${cleanQuery}".`)
      }
    } catch (err) {
      console.warn('Erro ao refinar pesquisa:', err)
      setWebSearchMessage('Falha ao processar pesquisa no servidor.')
    } finally {
      setIsWebSearching(false)
    }
  }

  return {
    handleSearchSpecsOnline,
    handlePerformInternalQuery,
  }
}
