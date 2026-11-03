import { EquipmentItemCard } from './EquipmentItemCard'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { EquipmentCatalogItem } from '@/services/equipment-catalog'
import { QuoteEquipmentItem } from '@/types/crm'
import { Plus } from 'lucide-react'
import type { Dispatch, SetStateAction } from 'react'

import type { useToast } from '@/hooks/use-toast'

interface EquipmentItemsEditorProps {
  equipmentModel: string
  equipmentBrand: string
  equipmentQuantity: number
  equipments: QuoteEquipmentItem[]
  searchingSpecsIndex: number | null
  activeCatalogSuggestionsIndex: number | null
  setActiveCatalogSuggestionsIndex: Dispatch<SetStateAction<number | null>>
  catalogSuggestions: EquipmentCatalogItem[]
  setCatalogSuggestions: Dispatch<SetStateAction<EquipmentCatalogItem[]>>
  allCatalogEquipments: EquipmentCatalogItem[]
  handleAddEquipment: () => any
  handleRemoveEquipment: (index: number) => any
  handleUpdateEquipment: (index: number, patch: Partial<QuoteEquipmentItem>) => any
  handleSearchSpecsOnline: (index: number) => any
  handleModelInputChange: (index: number, val: string) => any
  handleSelectCatalogItem: (index: number, item: EquipmentCatalogItem) => any
  toast: ReturnType<typeof useToast>['toast']
}

export function EquipmentItemsEditor(props: EquipmentItemsEditorProps) {
  const {
    equipmentModel,
    equipmentBrand,
    equipmentQuantity,
    equipments,
    searchingSpecsIndex,
    activeCatalogSuggestionsIndex,
    setActiveCatalogSuggestionsIndex,
    catalogSuggestions,
    setCatalogSuggestions,
    allCatalogEquipments,
    handleAddEquipment,
    handleRemoveEquipment,
    handleUpdateEquipment,
    handleSearchSpecsOnline,
    handleModelInputChange,
    handleSelectCatalogItem,
    toast,
  } = props

  return (
    <>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Label className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide">
              Itens / Equipamentos ({equipments.length})
            </Label>
            <span className="text-[11px] text-muted-foreground">
              Cada equipamento com especificações técnicas próprias
            </span>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddEquipment}
            className="h-7 text-xs border-dashed border-teal-500 text-teal-700 hover:bg-teal-50 dark:hover:bg-teal-950/40"
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            Adicionar item
          </Button>
        </div>

        <div className="space-y-3">
          {' '}
          {equipments.map((eq, eqIdx) => (
            <EquipmentItemCard
              key={eq.id || `eq-${eqIdx}`}
              eq={eq}
              eqIdx={eqIdx}
              equipmentModel={equipmentModel}
              equipmentBrand={equipmentBrand}
              equipmentQuantity={equipmentQuantity}
              equipments={equipments}
              searchingSpecsIndex={searchingSpecsIndex}
              activeCatalogSuggestionsIndex={activeCatalogSuggestionsIndex}
              setActiveCatalogSuggestionsIndex={setActiveCatalogSuggestionsIndex}
              catalogSuggestions={catalogSuggestions}
              setCatalogSuggestions={setCatalogSuggestions}
              allCatalogEquipments={allCatalogEquipments}
              handleRemoveEquipment={handleRemoveEquipment}
              handleUpdateEquipment={handleUpdateEquipment}
              handleSearchSpecsOnline={handleSearchSpecsOnline}
              handleModelInputChange={handleModelInputChange}
              handleSelectCatalogItem={handleSelectCatalogItem}
              toast={toast}
            />
          ))}
        </div>
      </div>
    </>
  )
}
