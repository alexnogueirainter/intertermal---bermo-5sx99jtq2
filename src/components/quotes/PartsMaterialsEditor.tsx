import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { QuoteMaterialItem } from '@/types/crm'
import { Package, Plus, Trash2 } from 'lucide-react'
import type { Dispatch, SetStateAction } from 'react'

interface PartsMaterialsEditorProps {
  materialsItems: QuoteMaterialItem[]
  newPartDescription: string
  setNewPartDescription: Dispatch<SetStateAction<string>>
  newPartQty: number
  setNewPartQty: Dispatch<SetStateAction<number>>
  newPartUnitPrice: number
  setNewPartUnitPrice: Dispatch<SetStateAction<number>>
  materialsCost: number
  setMaterialsCost: Dispatch<SetStateAction<number>>
  materialsItemsTotal: number
  totalMaterialsCostCombined: number
  handleAddMaterialItem: () => any
  handleRemoveMaterialItem: (id: string) => any
}

export function PartsMaterialsEditor(props: PartsMaterialsEditorProps) {
  const {
    materialsItems,
    newPartDescription,
    setNewPartDescription,
    newPartQty,
    setNewPartQty,
    newPartUnitPrice,
    setNewPartUnitPrice,
    materialsCost,
    setMaterialsCost,
    materialsItemsTotal,
    totalMaterialsCostCombined,
    handleAddMaterialItem,
    handleRemoveMaterialItem,
  } = props

  return (
    <>
      <div className="p-3.5 bg-slate-50 dark:bg-slate-900/90 rounded-lg border border-slate-200 dark:border-slate-800 space-y-3 shadow-xs">
        <div className="flex items-center justify-between gap-2 border-b border-slate-200/80 dark:border-slate-800 pb-2">
          <div className="flex items-center gap-2">
            <Badge
              variant="secondary"
              className="text-[11px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
            >
              Materiais
            </Badge>
            <Label className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide">
              Materiais / Peças / Componentes
            </Label>
          </div>
          <span className="text-xs font-mono font-bold text-amber-700 dark:text-amber-400">
            Total Materiais (com peças):{' '}
            {totalMaterialsCostCombined.toLocaleString('pt-BR', {
              style: 'currency',
              currency: 'BRL',
            })}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end bg-white dark:bg-slate-950 p-2.5 rounded-md border border-slate-200 dark:border-slate-800">
          <div className="space-y-1">
            <Label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
              Custo Direto de Materiais (R$)
            </Label>
            <Input
              type="number"
              step="any"
              min="0"
              value={materialsCost}
              onChange={(e) => setMaterialsCost(parseFloat(e.target.value) || 0)}
              placeholder="0,00"
              className="text-xs h-8 font-mono"
            />
          </div>
          <p className="text-[11px] text-muted-foreground">
            Informe o valor direto de materiais ou use a tabela de peças e componentes abaixo. Ambos
            somam ao custo de materiais.
          </p>
        </div>

        {/* Bloco: Peças e Componentes (materials_items) */}
        <div className="space-y-2.5 pt-2 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="h-3.5 w-3.5 text-amber-700 dark:text-amber-400" />
              <Label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Peças e Componentes ({materialsItems.length})
              </Label>
            </div>
            <span className="text-xs font-mono font-bold text-amber-700 dark:text-amber-400">
              Total do Grupo:{' '}
              {materialsItemsTotal.toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              })}
            </span>
          </div>

          {/* Formulário para Inserir Peça / Componente */}
          <div className="p-2.5 bg-white dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-end">
              <div className="sm:col-span-5 space-y-1">
                <Label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                  Descrição da Peça / Componente
                </Label>
                <Input
                  value={newPartDescription}
                  onChange={(e) => setNewPartDescription(e.target.value)}
                  placeholder="Ex: Jogo de Gaxetas NBR Clip-on, Placa Inox 316 0.5mm..."
                  className="text-xs h-8"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleAddMaterialItem()
                    }
                  }}
                />
              </div>

              <div className="sm:col-span-2 space-y-1">
                <Label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                  Quantidade
                </Label>
                <Input
                  type="number"
                  step="any"
                  min="0.01"
                  value={newPartQty}
                  onChange={(e) => setNewPartQty(parseFloat(e.target.value) || 0)}
                  className="text-xs h-8 font-mono text-center"
                />
              </div>

              <div className="sm:col-span-2 space-y-1">
                <Label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                  Preço Unit. (R$)
                </Label>
                <Input
                  type="number"
                  step="any"
                  min="0"
                  value={newPartUnitPrice}
                  onChange={(e) => setNewPartUnitPrice(parseFloat(e.target.value) || 0)}
                  placeholder="0,00"
                  className="text-xs h-8 font-mono text-right"
                />
              </div>

              <div className="sm:col-span-3 flex items-center gap-2">
                <div className="flex-1 text-right">
                  <span className="text-[10px] text-muted-foreground block">Subtotal</span>
                  <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200 block truncate">
                    {((newPartQty || 0) * (newPartUnitPrice || 0)).toLocaleString('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    })}
                  </span>
                </div>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleAddMaterialItem}
                  className="h-8 px-3 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shrink-0"
                >
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Adicionar Peça
                </Button>
              </div>
            </div>
          </div>

          {/* Lista de Peças e Componentes Adicionados */}
          {materialsItems.length > 0 ? (
            <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden bg-white dark:bg-slate-950">
              <table className="w-full text-left text-xs">
                <thead className="bg-amber-50/70 dark:bg-amber-950/40 text-slate-700 dark:text-slate-300 uppercase text-[10px] font-bold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="p-2 w-8 text-center">#</th>
                    <th className="p-2">Descrição</th>
                    <th className="p-2 text-right w-20">Qtd</th>
                    <th className="p-2 text-right w-28">Preço Unit.</th>
                    <th className="p-2 text-right w-28">Subtotal</th>
                    <th className="p-2 w-10 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {materialsItems.map((item, idx) => {
                    const qty = Number(item.quantity) || 0
                    const unitPrice = Number(item.unit_price) || 0
                    const sub = Number(item.subtotal) || qty * unitPrice
                    return (
                      <tr
                        key={item.id || idx}
                        className="hover:bg-slate-50/70 dark:hover:bg-slate-900/60"
                      >
                        <td className="p-2 text-center font-mono text-slate-400 text-[11px]">
                          {idx + 1}
                        </td>
                        <td className="p-2 font-medium text-slate-900 dark:text-slate-100">
                          {item.description}
                        </td>
                        <td className="p-2 text-right font-mono font-semibold">{qty}</td>
                        <td className="p-2 text-right font-mono text-slate-700 dark:text-slate-300">
                          {unitPrice.toLocaleString('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          })}
                        </td>
                        <td className="p-2 text-right font-mono font-bold text-slate-900 dark:text-slate-100">
                          {sub.toLocaleString('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          })}
                        </td>
                        <td className="p-2 text-center">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveMaterialItem(item.id)}
                            className="h-7 w-7 p-0 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                            title="Remover peça"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot className="bg-slate-50 dark:bg-slate-900/80 font-bold border-t border-slate-200 dark:border-slate-800">
                  <tr>
                    <td colSpan={4} className="p-2 text-right text-slate-700 dark:text-slate-300">
                      Total do Grupo (Peças e Componentes):
                    </td>
                    <td className="p-2 text-right font-mono text-amber-700 dark:text-amber-400 font-bold">
                      {materialsItemsTotal.toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      })}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          ) : (
            <p className="text-[11px] text-muted-foreground italic px-1">
              Nenhuma peça ou componente adicionado. Utilize o formulário acima para inserir itens
              detalhados (ex: gaxetas, placas adicionais, tirantes).
            </p>
          )}
        </div>
      </div>
    </>
  )
}
