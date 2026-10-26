import { ChemicalProductsEditor } from './ChemicalProductsEditor'
import { EquipmentItemsEditor } from './EquipmentItemsEditor'
import { PartsMaterialsEditor } from './PartsMaterialsEditor'
import { ScopeClientDealFields } from './ScopeClientDealFields'
import { ScopeNotesFields } from './ScopeNotesFields'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EquipmentCatalogItem } from '@/services/equipment-catalog'
import {
  ClientRecord,
  DealRecord,
  QuoteChemicalProductItem,
  QuoteEquipmentItem,
  QuoteMaterialItem,
} from '@/types/crm'
import type { Dispatch, SetStateAction } from 'react'

interface ScopeSectionCardProps {
  setNewPartDescription: Dispatch<SetStateAction<string>>
  setTechnicalNotes: Dispatch<SetStateAction<string>>
  commercialNotes: string
  setNewChemicalQty: Dispatch<SetStateAction<number>>
  searchingSpecsIndex: number | null
  dealTitle: string
  setScopeOfWork: Dispatch<SetStateAction<string>>
  newPartDescription: string
  handleUpdateEquipment: (index: number, patch: Partial<QuoteEquipmentItem>) => any
  setNewChemicalDescription: Dispatch<SetStateAction<string>>
  materialsCost: number
  technicalNotes: string
  setIsNewClientDialogOpen: Dispatch<SetStateAction<boolean>>
  clientId: string
  setNewChemicalUnitPrice: Dispatch<SetStateAction<number>>
  setNewClientCity: Dispatch<SetStateAction<string>>
  handleModelInputChange: (index: number, val: string) => any
  setNewClientName: Dispatch<SetStateAction<string>>
  newChemicalUnit: 'L' | 'kg' | 'un' | 'gl' | 'lata'
  chemicalProducts: QuoteChemicalProductItem[]
  allCatalogEquipments: EquipmentCatalogItem[]
  activeCatalogSuggestionsIndex: number | null
  setNewClientPhone: Dispatch<SetStateAction<string>>
  clients: ClientRecord[]
  materialsItems: QuoteMaterialItem[]
  handleRemoveMaterialItem: (id: string) => any
  handleAddChemicalProduct: () => any
  newChemicalDescription: string
  setQuoteTitle: Dispatch<SetStateAction<string>>
  handleSearchSpecsOnline: (index: number) => any
  newChemicalUnitPrice: number
  setNewClientContact: Dispatch<SetStateAction<string>>
  assignedTo: string
  newChemicalQty: number
  handleRemoveChemicalProduct: (id: string, description?: string) => any
  totalMaterialsCostCombined: number
  setClientName: Dispatch<SetStateAction<string>>
  equipmentModel: string
  setMaterialsCost: Dispatch<SetStateAction<number>>
  setDestinationAddress: Dispatch<SetStateAction<string>>
  setNewPartUnitPrice: Dispatch<SetStateAction<number>>
  setCommercialNotes: Dispatch<SetStateAction<string>>
  setCatalogSuggestions: Dispatch<SetStateAction<EquipmentCatalogItem[]>>
  setAssignedTo: Dispatch<SetStateAction<string>>
  handleInsertStandardScope: () => any
  deals: DealRecord[]
  equipmentQuantity: number
  newPartUnitPrice: number
  materialsItemsTotal: number
  catalogSuggestions: EquipmentCatalogItem[]
  handleSelectCatalogItem: (index: number, item: EquipmentCatalogItem) => any
  equipmentBrand: string
  setNewChemicalCategory: Dispatch<SetStateAction<'cleaning' | 'painting'>>
  handleRemoveEquipment: (index: number) => any
  setNewClientState: Dispatch<SetStateAction<string>>
  chemicalProductsTotal: number
  handleAddEquipment: () => any
  setNewClientEmail: Dispatch<SetStateAction<string>>
  setActiveCatalogSuggestionsIndex: Dispatch<SetStateAction<number | null>>
  setNewChemicalUnit: Dispatch<SetStateAction<'L' | 'kg' | 'un' | 'gl' | 'lata'>>
  newPartQty: number
  dealId: string
  setNewPartQty: Dispatch<SetStateAction<number>>
  setNewClientDocument: Dispatch<SetStateAction<string>>
  quoteTitle: string
  scopeOfWork: string
  handleAddMaterialItem: () => any
  setDealId: Dispatch<SetStateAction<string>>
  setDealTitle: Dispatch<SetStateAction<string>>
  newChemicalCategory: 'cleaning' | 'painting'
  toast: ReturnType<typeof useToast>['toast']
  setClientId: Dispatch<SetStateAction<string>>
  equipments: QuoteEquipmentItem[]
}

export function ScopeSectionCard(props: ScopeSectionCardProps) {
  return (
    <>
      {/* SEÇÃO 3A: Escopo / Identificação Técnica */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-xs">
        <CardHeader className="p-4 pb-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span className="flex items-center justify-center w-7 h-5 rounded bg-teal-600 text-white text-[11px] font-bold">
                3A
              </span>
              3A Escopo / Identificação Técnica
            </CardTitle>
            <span className="text-[11px] text-muted-foreground">
              Dados do cliente, oportunidade, equipamentos, materiais e escopo técnico
            </span>
          </div>
        </CardHeader>
        <CardContent className="p-4 space-y-4">
          <ScopeClientDealFields {...props} />
          <EquipmentItemsEditor {...props} />
          <ChemicalProductsEditor {...props} />
          <PartsMaterialsEditor {...props} />
          <ScopeNotesFields {...props} />
        </CardContent>
      </Card>
    </>
  )
}
