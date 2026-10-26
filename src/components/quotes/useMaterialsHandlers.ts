import { getStandardServiceMethodology } from '@/data/bermo-catalog'
import type { useToast } from '@/hooks/use-toast'
import {
  QuoteChemicalProductItem,
  QuoteCustomMaterial,
  QuoteEquipmentItem,
  QuoteMaterialItem,
} from '@/types/crm'
import type { Dispatch, SetStateAction } from 'react'

interface MakeMaterialsHandlersDeps {
  customMaterials: QuoteCustomMaterial[]
  equipmentBrand: string
  equipments: QuoteEquipmentItem[]
  newChemicalCategory: 'cleaning' | 'painting'
  newChemicalDescription: string
  newChemicalQty: number
  newChemicalUnit: 'L' | 'kg' | 'un' | 'gl' | 'lata'
  newChemicalUnitPrice: number
  newMaterialDescription: string
  newMaterialQty: number
  newMaterialUnitCost: number
  newPartDescription: string
  newPartQty: number
  newPartUnitPrice: number
  setChemicalProducts: Dispatch<SetStateAction<QuoteChemicalProductItem[]>>
  setCustomMaterials: Dispatch<SetStateAction<QuoteCustomMaterial[]>>
  setMaterialsCost: Dispatch<SetStateAction<number>>
  setMaterialsItems: Dispatch<SetStateAction<QuoteMaterialItem[]>>
  setNewChemicalDescription: Dispatch<SetStateAction<string>>
  setNewChemicalQty: Dispatch<SetStateAction<number>>
  setNewChemicalUnitPrice: Dispatch<SetStateAction<number>>
  setNewMaterialDescription: Dispatch<SetStateAction<string>>
  setNewMaterialQty: Dispatch<SetStateAction<number>>
  setNewMaterialUnitCost: Dispatch<SetStateAction<number>>
  setNewPartDescription: Dispatch<SetStateAction<string>>
  setNewPartQty: Dispatch<SetStateAction<number>>
  setNewPartUnitPrice: Dispatch<SetStateAction<number>>
  setScopeOfWork: Dispatch<SetStateAction<string>>
  toast: ReturnType<typeof useToast>['toast']
}

export function makeMaterialsHandlers(p: MakeMaterialsHandlersDeps) {
  const {
    customMaterials,
    equipmentBrand,
    equipments,
    newChemicalCategory,
    newChemicalDescription,
    newChemicalQty,
    newChemicalUnit,
    newChemicalUnitPrice,
    newMaterialDescription,
    newMaterialQty,
    newMaterialUnitCost,
    newPartDescription,
    newPartQty,
    newPartUnitPrice,
    setChemicalProducts,
    setCustomMaterials,
    setMaterialsCost,
    setMaterialsItems,
    setNewChemicalDescription,
    setNewChemicalQty,
    setNewChemicalUnitPrice,
    setNewMaterialDescription,
    setNewMaterialQty,
    setNewMaterialUnitCost,
    setNewPartDescription,
    setNewPartQty,
    setNewPartUnitPrice,
    setScopeOfWork,
    toast,
  } = p

  const handleInsertStandardScope = () => {
    const brandsList = equipments
      .map((e) => e.brand)
      .filter((b): b is string => !!b && b.trim() !== '')
    const standardText = getStandardServiceMethodology(
      brandsList.length > 0 ? brandsList : [equipmentBrand || 'BERMO'],
    )
    setScopeOfWork(standardText)
    toast({
      title: 'Descrição padrão inserida',
      description: 'O escopo técnico foi preenchido com a metodologia de manutenção.',
    })
  }

  // Adicionar Produto Químico (Limpeza / Pintura)
  const handleAddChemicalProduct = () => {
    if (!newChemicalDescription.trim()) {
      toast({
        title: 'Descrição obrigatória',
        description: 'Informe a descrição do produto químico (limpeza ou pintura).',
        variant: 'destructive',
      })
      return
    }
    const qty = Math.max(0.01, Number(newChemicalQty) || 1)
    const unitPrice = Math.max(0, Number(newChemicalUnitPrice) || 0)
    const subtotal = Math.round(qty * unitPrice * 100) / 100
    const newItem: QuoteChemicalProductItem = {
      id: `chem-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      category: newChemicalCategory,
      description: newChemicalDescription.trim(),
      unit: newChemicalUnit,
      quantity: qty,
      unit_price: unitPrice,
      subtotal,
    }
    setChemicalProducts((prev) => [...prev, newItem])
    setNewChemicalDescription('')
    setNewChemicalQty(1)
    setNewChemicalUnitPrice(0)
    toast({
      title: 'Produto químico adicionado',
      description: `${newItem.description} inserido com sucesso.`,
    })
  }

  // Remover Produto Químico (com confirmação)
  const handleRemoveChemicalProduct = (id: string, description?: string) => {
    const itemLabel = description ? `"${description}"` : 'este produto químico'
    if (confirm(`Deseja realmente remover ${itemLabel}?`)) {
      setChemicalProducts((prev) => prev.filter((p) => p.id !== id))
      toast({
        title: 'Produto químico removido',
        description: 'Item removido da lista.',
      })
    }
  }

  // Adicionar Peça / Componente (materials_items)
  const handleAddMaterialItem = () => {
    if (!newPartDescription.trim()) {
      toast({
        title: 'Descrição obrigatória',
        description: 'Informe a descrição da peça ou componente.',
        variant: 'destructive',
      })
      return
    }
    const qty = Math.max(0.01, Number(newPartQty) || 1)
    const unitPrice = Math.max(0, Number(newPartUnitPrice) || 0)
    const subtotal = Math.round(qty * unitPrice * 100) / 100
    const newItem: QuoteMaterialItem = {
      id: `part-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      description: newPartDescription.trim(),
      quantity: qty,
      unit_price: unitPrice,
      subtotal,
    }
    setMaterialsItems((prev) => [...prev, newItem])
    setNewPartDescription('')
    setNewPartQty(1)
    setNewPartUnitPrice(0)
    toast({
      title: 'Peça/componente adicionado',
      description: `${newItem.description} inserido com sucesso.`,
    })
  }

  // Remover Peça / Componente
  const handleRemoveMaterialItem = (id: string) => {
    setMaterialsItems((prev) => prev.filter((item) => item.id !== id))
  }

  // Adicionar Material Customizado
  const handleAddCustomMaterial = () => {
    if (!newMaterialDescription.trim()) {
      toast({
        title: 'Descrição obrigatória',
        description: 'Informe o nome ou descrição do material/peça.',
        variant: 'destructive',
      })
      return
    }
    const qty = Math.max(1, newMaterialQty)
    const unitCost = Math.max(0, newMaterialUnitCost)
    const subtotal = qty * unitCost
    const newItem: QuoteCustomMaterial = {
      id: `mat-${Date.now()}`,
      description: newMaterialDescription.trim(),
      quantity: qty,
      unit_cost: unitCost,
      subtotal,
    }
    const updated = [...customMaterials, newItem]
    setCustomMaterials(updated)
    // Recalcular materialsCost para refletir nos custos diretos
    const sumMat = updated.reduce((acc, m) => acc + (m.subtotal || 0), 0)
    setMaterialsCost(sumMat)
    setNewMaterialDescription('')
    setNewMaterialQty(1)
    setNewMaterialUnitCost(0)
  }

  // Remover Material Customizado
  const handleRemoveCustomMaterial = (id: string) => {
    const updated = customMaterials.filter((m) => m.id !== id)
    setCustomMaterials(updated)
    const sumMat = updated.reduce((acc, m) => acc + (m.subtotal || 0), 0)
    setMaterialsCost(sumMat)
  }

  return {
    handleInsertStandardScope,
    handleAddChemicalProduct,
    handleRemoveChemicalProduct,
    handleAddMaterialItem,
    handleRemoveMaterialItem,
    handleAddCustomMaterial,
    handleRemoveCustomMaterial,
  }
}
