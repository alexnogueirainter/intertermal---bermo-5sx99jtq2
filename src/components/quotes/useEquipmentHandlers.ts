import { equipmentCatalogService, EquipmentCatalogItem } from '@/services/equipment-catalog'
import { useEffect } from 'react'
import type { useToast } from '@/hooks/use-toast'
import { QuoteEquipmentItem } from '@/types/crm'
import type { Dispatch, SetStateAction } from 'react'

interface UseEquipmentHandlersDeps {
  allCatalogEquipments: EquipmentCatalogItem[]
  connectionSize: string
  gasketMaterial: string
  plateMaterial: string
  plateThickness: number | undefined
  setActiveCatalogSuggestionsIndex: Dispatch<SetStateAction<number | null>>
  setAllCatalogEquipments: Dispatch<SetStateAction<EquipmentCatalogItem[]>>
  setCatalogSuggestions: Dispatch<SetStateAction<EquipmentCatalogItem[]>>
  setConnectionSize: Dispatch<SetStateAction<string>>
  setEquipmentBrand: Dispatch<SetStateAction<string>>
  setEquipmentModel: Dispatch<SetStateAction<string>>
  setEquipmentQuantity: Dispatch<SetStateAction<number>>
  setEquipments: Dispatch<SetStateAction<QuoteEquipmentItem[]>>
  setGasketMaterial: Dispatch<SetStateAction<string>>
  setPlateCount: Dispatch<SetStateAction<number | undefined>>
  setPlateMaterial: Dispatch<SetStateAction<string>>
  setPlateThickness: Dispatch<SetStateAction<number | undefined>>
  setPressureTestBar: Dispatch<SetStateAction<number | undefined>>
  setWorkingPressureBar: Dispatch<SetStateAction<number | undefined>>
  toast: ReturnType<typeof useToast>['toast']
  workingPressureBar: number | undefined
}

export function useEquipmentHandlers(p: UseEquipmentHandlersDeps) {
  const {
    allCatalogEquipments,
    connectionSize,
    gasketMaterial,
    plateMaterial,
    plateThickness,
    setActiveCatalogSuggestionsIndex,
    setAllCatalogEquipments,
    setCatalogSuggestions,
    setConnectionSize,
    setEquipmentBrand,
    setEquipmentModel,
    setEquipmentQuantity,
    setEquipments,
    setGasketMaterial,
    setPlateCount,
    setPlateMaterial,
    setPlateThickness,
    setPressureTestBar,
    setWorkingPressureBar,
    toast,
    workingPressureBar,
  } = p

  const handleAddEquipment = () => {
    setEquipments((prev) => [
      ...prev,
      {
        id: `eq-${Date.now()}-${prev.length + 1}`,
        model: '',
        brand: '',
        quantity: 1,
        tag: '',
        serial_number: '',
        plate_count: undefined,
        plate_material: '',
        plate_thickness: undefined,
        gasket_material: '',
        connection_size: '',
        pressure_test_bar: undefined,
        working_pressure_bar: undefined,
      },
    ])
  }

  // Remover equipamento dinâmico
  const handleRemoveEquipment = (index: number) => {
    setEquipments((prev) => {
      if (prev.length <= 1) return prev
      const next = prev.filter((_, idx) => idx !== index)
      if (index === 0 && next[0]) {
        setEquipmentModel(next[0].model || '')
        setEquipmentBrand(next[0].brand || '')
        setEquipmentQuantity(next[0].quantity || 1)
        setPlateCount(next[0].plate_count)
        setPlateMaterial(next[0].plate_material || '')
        setPlateThickness(next[0].plate_thickness)
        setGasketMaterial(next[0].gasket_material || '')
        setConnectionSize(next[0].connection_size || '')
        setPressureTestBar(next[0].pressure_test_bar)
        setWorkingPressureBar(next[0].working_pressure_bar)
      }
      return next
    })
  }

  // Atualizar campo de equipamento dinâmico
  const handleUpdateEquipment = (index: number, patch: Partial<QuoteEquipmentItem>) => {
    setEquipments((prev) => {
      const next = [...prev]
      const curr = next[index] || { id: `eq-${index}` }
      next[index] = { ...curr, ...patch }
      if (index === 0) {
        if (patch.model !== undefined) setEquipmentModel(patch.model)
        if (patch.brand !== undefined) setEquipmentBrand(patch.brand)
        if (patch.quantity !== undefined) setEquipmentQuantity(patch.quantity)
        if (patch.plate_count !== undefined) setPlateCount(patch.plate_count)
        if (patch.plate_material !== undefined) setPlateMaterial(patch.plate_material)
        if (patch.plate_thickness !== undefined) setPlateThickness(patch.plate_thickness)
        if (patch.gasket_material !== undefined) setGasketMaterial(patch.gasket_material)
        if (patch.connection_size !== undefined) setConnectionSize(patch.connection_size)
        if (patch.pressure_test_bar !== undefined) setPressureTestBar(patch.pressure_test_bar)
        if (patch.working_pressure_bar !== undefined)
          setWorkingPressureBar(patch.working_pressure_bar)
      }
      return next
    })
  }

  // Aplica conjunto de especificações técnicas recebido no equipamento especificado
  // Retorna booleano indicando se alguma especificação válida foi aplicada
  const applySpecsToEquipment = (
    index: number,
    specs: any,
    suggestedBrand?: string,
    suggestedModel?: string,
  ): boolean => {
    if (!specs || typeof specs !== 'object') {
      toast({
        title: 'Nenhuma especificação encontrada',
        description:
          'Não foram localizados dados técnicos confirmados para este modelo. Preencha os campos manualmente.',
        variant: 'destructive',
      })
      return false
    }

    const patch: Partial<QuoteEquipmentItem> = {}
    let hasAppliedFields = false

    if (suggestedBrand && suggestedBrand.trim()) {
      patch.brand = suggestedBrand.trim()
    }
    if (suggestedModel && suggestedModel.trim()) {
      patch.model = suggestedModel.trim()
    }
    if (specs.platesCount) {
      const parsed = parseInt(String(specs.platesCount), 10)
      if (!isNaN(parsed) && parsed > 0) {
        patch.plate_count = parsed
        hasAppliedFields = true
      }
    }
    if (specs.material || specs.plateMaterial) {
      const mat = (specs.material || specs.plateMaterial || '').trim()
      if (mat) {
        patch.plate_material = mat
        hasAppliedFields = true
      }
    }
    if (specs.plateThickness) {
      const parsedThick = parseFloat(String(specs.plateThickness))
      if (!isNaN(parsedThick) && parsedThick > 0) {
        patch.plate_thickness = parsedThick
        hasAppliedFields = true
      }
    }
    if (specs.gasketMaterial) {
      const gMat = (specs.gasketMaterial || '').trim()
      if (gMat) {
        patch.gasket_material = gMat
        hasAppliedFields = true
      }
    }
    if (specs.connection || specs.connectionSize) {
      const conn = (specs.connection || specs.connectionSize || '').trim()
      if (conn) {
        patch.connection_size = conn
        hasAppliedFields = true
      }
    }
    if (specs.pressure || specs.workingPressureBar) {
      const rawPress = specs.pressure || specs.workingPressureBar
      const match = String(rawPress).match(/(\d+)/)
      if (match && match[1]) {
        const p = parseInt(match[1], 10)
        if (!isNaN(p) && p > 0) {
          patch.working_pressure_bar = p
          hasAppliedFields = true
        }
      }
    }

    if (!hasAppliedFields) {
      toast({
        title: 'Nenhuma especificação encontrada',
        description:
          'Os dados retornados não contêm especificações técnicas confirmadas. O equipamento permaneceu inalterado para inserção manual.',
        variant: 'destructive',
      })
      return false
    }

    handleUpdateEquipment(index, patch)
    return true
  }

  // Executa busca server-side (web/técnica/AI) sem abrir abas externas no navegador

  useEffect(() => {
    let isMounted = true
    equipmentCatalogService
      .getAll()
      .then((items) => {
        if (isMounted && items && items.length > 0) {
          setAllCatalogEquipments(items)
        }
      })
      .catch((err) => {
        console.warn('Erro ao carregar catálogo de equipamentos inicial:', err)
      })
    return () => {
      isMounted = false
    }
  }, [])

  // Buscar sugestões de equipamentos do catálogo conforme o usuário digita
  const handleModelInputChange = (index: number, val: string) => {
    handleUpdateEquipment(index, { model: val })
    const trimmed = val.trim().toLowerCase()
    if (!trimmed) {
      setActiveCatalogSuggestionsIndex(null)
      setCatalogSuggestions([])
      return
    }

    const cleanNoHyphen = trimmed.replace(/[\s\-_]/g, '')
    const matches = allCatalogEquipments.filter((item) => {
      const m = (item.model || '').toLowerCase()
      const mClean = m.replace(/[\s\-_]/g, '')
      const n = (item.name || '').toLowerCase()
      const s = (item.series || '').toLowerCase()
      const b = (item.brand || '').toLowerCase()
      return (
        m.includes(trimmed) ||
        mClean.includes(cleanNoHyphen) ||
        n.includes(trimmed) ||
        s.includes(trimmed) ||
        b.includes(trimmed)
      )
    })

    setCatalogSuggestions(matches.slice(0, 8))
    setActiveCatalogSuggestionsIndex(index)
  }

  // Ao selecionar um equipamento do catálogo da BERMO no autocomplete
  const handleSelectCatalogItem = (index: number, item: EquipmentCatalogItem) => {
    const patch: Partial<QuoteEquipmentItem> = {
      model: item.model,
      brand: item.brand || '',
    }

    if (item.plate_count && item.plate_count > 0) {
      patch.plate_count = item.plate_count
    }
    if (item.plate_material) {
      patch.plate_material = item.plate_material
    }
    if (item.plate_thickness) {
      patch.plate_thickness = item.plate_thickness
    }
    if (item.gasket_material) {
      patch.gasket_material = item.gasket_material
    }
    if (item.connection_size) {
      patch.connection_size = item.connection_size
    }
    if (item.working_pressure_bar) {
      patch.working_pressure_bar = item.working_pressure_bar
      if (item.pressure_test_bar) {
        patch.pressure_test_bar = item.pressure_test_bar
      }
    }

    handleUpdateEquipment(index, patch)
    setActiveCatalogSuggestionsIndex(null)
    setCatalogSuggestions([])

    toast({
      title: 'Equipamento BERMO selecionado!',
      description: `${item.name} (${item.model}) preenchido automaticamente com dados da base.`,
    })
  }

  // Carregar Proposta Existente no Formulário

  return {
    handleAddEquipment,
    handleRemoveEquipment,
    handleUpdateEquipment,
    applySpecsToEquipment,
    handleModelInputChange,
    handleSelectCatalogItem,
  }
}
