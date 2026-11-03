import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { EquipmentCatalogItem } from '@/services/equipment-catalog'
import { QuoteEquipmentItem } from '@/types/crm'
import { Globe, Loader2, Sparkles, Trash2 } from 'lucide-react'
import type { Dispatch, SetStateAction } from 'react'

import type { useToast } from '@/hooks/use-toast'

interface EquipmentItemCardProps {
  eq: QuoteEquipmentItem
  eqIdx: number
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
  handleRemoveEquipment: (index: number) => any
  handleUpdateEquipment: (index: number, patch: Partial<QuoteEquipmentItem>) => any
  handleSearchSpecsOnline: (index: number) => any
  handleModelInputChange: (index: number, val: string) => any
  handleSelectCatalogItem: (index: number, item: EquipmentCatalogItem) => any
  toast: ReturnType<typeof useToast>['toast']
}

export function EquipmentItemCard(props: EquipmentItemCardProps) {
  const {
    eq,
    eqIdx,
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
    handleRemoveEquipment,
    handleUpdateEquipment,
    handleSearchSpecsOnline,
    handleModelInputChange,
    handleSelectCatalogItem,
    toast,
  } = props

  const isPrimary = eqIdx === 0
  const currentModel = eq.model != null ? eq.model : isPrimary ? equipmentModel : ''
  const currentBrand =
    eq.brand != null && eq.brand !== '' ? eq.brand : isPrimary ? equipmentBrand || '' : ''
  const currentQty = eq.quantity != null ? eq.quantity : isPrimary ? equipmentQuantity || 1 : 1
  const currentPlateCount = eq.plate_count
  const currentPlateMat = eq.plate_material ?? ''
  const currentPlateThick = eq.plate_thickness
  const currentGasketMat = eq.gasket_material ?? ''
  const currentConnSize = eq.connection_size ?? ''
  const currentWorkingPress = eq.working_pressure_bar
  const isSearchingThis = searchingSpecsIndex === eqIdx

  return (
    <div
      key={eq.id || `eq-${eqIdx}`}
      className="p-3.5 bg-slate-50 dark:bg-slate-900/90 rounded-lg border border-slate-200 dark:border-slate-800 space-y-3 relative shadow-xs"
    >
      <div className="flex items-center justify-between gap-2 border-b border-slate-200/80 dark:border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <Badge
            variant="secondary"
            className="text-[11px] font-mono font-bold bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300"
          >
            Item #{eqIdx + 1}
            {isPrimary && ' (Principal)'}
          </Badge>
          {currentModel && (
            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
              {currentModel}
            </span>
          )}
          <span className="text-xs text-muted-foreground font-mono">
            • {currentQty} {currentQty === 1 ? 'peça/unid.' : 'peças/unid.'}
          </span>
          {eq.tag && (
            <span className="text-[11px] text-muted-foreground font-mono">TAG: {eq.tag}</span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isSearchingThis}
            onClick={() => handleSearchSpecsOnline(eqIdx)}
            className="h-7 text-xs border-teal-300 text-teal-700 hover:bg-teal-50 dark:border-teal-800 dark:text-teal-300"
            title="Buscar especificações técnicas na base técnica ou internet"
          >
            {isSearchingThis ? (
              <>
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                Buscando...
              </>
            ) : (
              <>
                <Globe className="h-3 w-3 mr-1 text-teal-600" />
                Buscar especificações na internet
              </>
            )}
          </Button>

          {equipments.length > 1 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => handleRemoveEquipment(eqIdx)}
              className="h-7 px-2 text-xs text-rose-600 hover:bg-rose-50 hover:text-rose-700"
              title="Remover este item"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="space-y-1 sm:col-span-2 relative">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-semibold flex items-center gap-1.5">
              <span>Modelo do Equipamento</span>
              <span className="text-[10px] text-teal-700 dark:text-teal-400 font-normal">
                (catálogo multi-fabricante)
              </span>
            </Label>
            {currentModel && (
              <button
                type="button"
                onClick={() => {
                  // Abre sugestões mesmo se já digitado
                  handleModelInputChange(eqIdx, currentModel || 'B')
                }}
                className="text-[10px] text-teal-600 hover:underline"
              >
                Ver na base
              </button>
            )}
          </div>
          <Input
            value={currentModel}
            onChange={(e) => handleModelInputChange(eqIdx, e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                // Fecha o autocomplete mantendo o modelo digitado sem alterar campos técnicos
                setActiveCatalogSuggestionsIndex(null)
              }
            }}
            onFocus={() => {
              if (currentModel && currentModel.trim().length > 0) {
                handleModelInputChange(eqIdx, currentModel)
              } else {
                // Mostra os primeiros itens mais populares da BERMO
                setCatalogSuggestions(allCatalogEquipments.slice(0, 8))
                setActiveCatalogSuggestionsIndex(eqIdx)
              }
            }}
            placeholder="Ex: BP30, BP6, GP10, BL14, BLN20, ARI-ZESA..."
            className="text-xs h-8 font-semibold"
            autoComplete="off"
          />

          {/* Dropdown de sugestões do catálogo local BERMO */}
          {activeCatalogSuggestionsIndex === eqIdx && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setActiveCatalogSuggestionsIndex(null)}
              />
              <div className="absolute left-0 right-0 top-full mt-1 bg-white dark:bg-slate-900 border border-teal-500/40 dark:border-teal-500/30 rounded-lg shadow-xl z-50 overflow-hidden max-h-72 overflow-y-auto">
                <div className="p-2 bg-teal-50/80 dark:bg-teal-950/60 border-b border-teal-100 dark:border-teal-900/60 flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-teal-900 dark:text-teal-200 flex items-center gap-1">
                    <Sparkles className="h-3 w-3 text-teal-600" />
                    Catálogo interno ({catalogSuggestions.length} encontrado
                    {catalogSuggestions.length !== 1 ? 's' : ''})
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    Clique para autocompletar
                  </span>
                </div>

                {/* Opção em destaque para manter o modelo digitado manualmente sem preencher dados técnicos */}
                {currentModel && currentModel.trim() && (
                  <div className="p-2 bg-amber-50/60 dark:bg-amber-950/30 border-b border-amber-200/60 dark:border-amber-900/40">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveCatalogSuggestionsIndex(null)
                        toast({
                          title: 'Modelo definido manualmente',
                          description: `Modelo "${currentModel.trim()}" mantido sem dados automáticos. Preencha os campos técnicos se desejar.`,
                        })
                      }}
                      className="w-full text-left p-2 rounded-md bg-white dark:bg-slate-900 hover:bg-amber-100/70 dark:hover:bg-amber-950/50 border border-amber-300 dark:border-amber-800 transition-colors flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-amber-900 dark:text-amber-200 truncate">
                          Usar &ldquo;{currentModel.trim()}&rdquo; (inserir manualmente, sem dados
                          automáticos)
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          Mantém os campos técnicos vazios para digitação livre.
                        </p>
                      </div>
                      <Badge
                        variant="secondary"
                        className="text-[9px] px-1.5 py-0.5 h-auto bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-700 shrink-0 font-medium"
                      >
                        Manual
                      </Badge>
                    </button>
                  </div>
                )}

                {catalogSuggestions.length > 0 ? (
                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {catalogSuggestions.map((catItem) => (
                      <button
                        key={catItem.id}
                        type="button"
                        onClick={() => handleSelectCatalogItem(eqIdx, catItem)}
                        className="w-full text-left p-2.5 hover:bg-teal-50/60 dark:hover:bg-teal-950/40 transition-colors flex items-start justify-between gap-2"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs font-bold text-teal-700 dark:text-teal-300">
                              {catItem.model}
                            </span>
                            <Badge
                              variant="secondary"
                              className="text-[9px] px-1 py-0 h-4 bg-slate-100 dark:bg-slate-800"
                            >
                              {catItem.brand}
                            </Badge>
                            {catItem.series && (
                              <span className="text-[10px] text-muted-foreground truncate">
                                • {catItem.series}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-600 dark:text-slate-300 truncate mt-0.5">
                            {catItem.name}
                          </p>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-2 flex-wrap">
                            {catItem.plate_count ? <span>{catItem.plate_count} placas</span> : null}
                            {catItem.connection_size && (
                              <span>Conexão: {catItem.connection_size}</span>
                            )}
                            {catItem.working_pressure_bar && (
                              <span>{catItem.working_pressure_bar} bar</span>
                            )}
                          </div>
                        </div>
                        <div className="shrink-0 pt-0.5">
                          <Badge
                            variant="outline"
                            className="text-[9px] border-teal-300 text-teal-700 dark:border-teal-700 dark:text-teal-300"
                          >
                            Usar specs
                          </Badge>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 text-center space-y-2">
                    <p className="text-xs text-muted-foreground">
                      Nenhum equipamento com &ldquo;{currentModel}&rdquo; encontrado no catálogo
                      interno.
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setActiveCatalogSuggestionsIndex(null)
                        handleSearchSpecsOnline(eqIdx)
                      }}
                      className="h-7 text-xs border-teal-400 text-teal-700 hover:bg-teal-50 dark:border-teal-800 dark:text-teal-300"
                    >
                      <Globe className="h-3 w-3 mr-1 text-teal-600" />
                      Buscar especificações na internet
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        <div className="space-y-1">
          <Label className="text-xs font-semibold">Marca</Label>
          <Input
            value={currentBrand}
            onChange={(e) => handleUpdateEquipment(eqIdx, { brand: e.target.value })}
            placeholder="Opcional: BERMO / Alfa Laval"
            className="text-xs h-8"
          />
        </div>

        <div className="space-y-1">
          <Label className="text-xs font-semibold">Quantidade</Label>
          <Input
            type="number"
            min="1"
            value={currentQty}
            onChange={(e) =>
              handleUpdateEquipment(eqIdx, {
                quantity: Math.max(1, Number(e.target.value)),
              })
            }
            className="text-xs h-8 font-mono"
          />
        </div>
      </div>

      {/* Detalhes Técnicos de Placas / Gaxetas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
        <div className="space-y-1">
          <Label className="text-[10px] text-muted-foreground">Qtd. de Placas</Label>
          <Input
            type="number"
            value={currentPlateCount ?? ''}
            onChange={(e) =>
              handleUpdateEquipment(eqIdx, {
                plate_count: e.target.value === '' ? undefined : Number(e.target.value),
              })
            }
            placeholder="Ex: 40"
            className="text-xs h-7 font-mono bg-white dark:bg-slate-950"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-[10px] text-muted-foreground">Material da Placa</Label>
          <Input
            value={currentPlateMat ?? ''}
            onChange={(e) =>
              handleUpdateEquipment(eqIdx, {
                plate_material: e.target.value,
              })
            }
            placeholder="Ex: AISI 316L"
            className="text-xs h-7 bg-white dark:bg-slate-950"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-[10px] text-muted-foreground">Espessura (mm)</Label>
          <Input
            type="number"
            step="0.1"
            value={currentPlateThick ?? ''}
            onChange={(e) =>
              handleUpdateEquipment(eqIdx, {
                plate_thickness: e.target.value === '' ? undefined : Number(e.target.value),
              })
            }
            placeholder="Ex: 0.5"
            className="text-xs h-7 font-mono bg-white dark:bg-slate-950"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-[10px] text-muted-foreground">Gaxeta</Label>
          <Input
            value={currentGasketMat ?? ''}
            onChange={(e) =>
              handleUpdateEquipment(eqIdx, {
                gasket_material: e.target.value,
              })
            }
            placeholder="Ex: EPDM Clip-on"
            className="text-xs h-7 bg-white dark:bg-slate-950"
          />
        </div>
      </div>
    </div>
  )
}
