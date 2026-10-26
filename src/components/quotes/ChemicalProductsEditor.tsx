import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { QuoteChemicalProductItem } from '@/types/crm'
import { Plus, Trash2 } from 'lucide-react'
import type { Dispatch, SetStateAction } from 'react'

interface ChemicalProductsEditorProps {
  chemicalProducts: QuoteChemicalProductItem[]
  newChemicalCategory: 'cleaning' | 'painting'
  setNewChemicalCategory: Dispatch<SetStateAction<'cleaning' | 'painting'>>
  newChemicalDescription: string
  setNewChemicalDescription: Dispatch<SetStateAction<string>>
  newChemicalUnit: 'L' | 'kg' | 'un' | 'gl' | 'lata'
  setNewChemicalUnit: Dispatch<SetStateAction<'L' | 'kg' | 'un' | 'gl' | 'lata'>>
  newChemicalQty: number
  setNewChemicalQty: Dispatch<SetStateAction<number>>
  newChemicalUnitPrice: number
  setNewChemicalUnitPrice: Dispatch<SetStateAction<number>>
  chemicalProductsTotal: number
  handleAddChemicalProduct: () => any
  handleRemoveChemicalProduct: (id: string, description?: string) => any
}

export function ChemicalProductsEditor(props: ChemicalProductsEditorProps) {
  const {
    chemicalProducts,
    newChemicalCategory,
    setNewChemicalCategory,
    newChemicalDescription,
    setNewChemicalDescription,
    newChemicalUnit,
    setNewChemicalUnit,
    newChemicalQty,
    setNewChemicalQty,
    newChemicalUnitPrice,
    setNewChemicalUnitPrice,
    chemicalProductsTotal,
    handleAddChemicalProduct,
    handleRemoveChemicalProduct,
  } = props

  return (
    <>
      {/* Bloco: Produtos Químicos (Limpeza e Pintura) */}
      <div className="p-3.5 bg-slate-50 dark:bg-slate-900/90 rounded-lg border border-slate-200 dark:border-slate-800 space-y-3 shadow-xs">
        <div className="flex items-center justify-between gap-2 border-b border-slate-200/80 dark:border-slate-800 pb-2">
          <div className="flex items-center gap-2">
            <Badge
              variant="secondary"
              className="text-[11px] font-bold bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300"
            >
              Insumos Químicos
            </Badge>
            <Label className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide">
              Produtos Químicos (Limpeza e Pintura)
            </Label>
          </div>
          <span className="text-xs font-mono font-bold text-teal-700 dark:text-teal-400">
            Total Químicos:{' '}
            {chemicalProductsTotal.toLocaleString('pt-BR', {
              style: 'currency',
              currency: 'BRL',
            })}
          </span>
        </div>

        {/* Formulário de inserção rápida */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end bg-white dark:bg-slate-950 p-2.5 rounded-md border border-slate-200 dark:border-slate-800">
          <div className="sm:col-span-2 space-y-1">
            <Label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
              Finalidade
            </Label>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => setNewChemicalCategory('cleaning')}
                className={`flex-1 text-[11px] py-1 px-1.5 rounded font-medium transition-colors border ${
                  newChemicalCategory === 'cleaning'
                    ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                }`}
              >
                Limpeza
              </button>
              <button
                type="button"
                onClick={() => setNewChemicalCategory('painting')}
                className={`flex-1 text-[11px] py-1 px-1.5 rounded font-medium transition-colors border ${
                  newChemicalCategory === 'painting'
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                }`}
              >
                Pintura
              </button>
            </div>
          </div>

          <div className="sm:col-span-4 space-y-1">
            <Label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
              Descrição do Produto Químico
            </Label>
            <Input
              value={newChemicalDescription}
              onChange={(e) => setNewChemicalDescription(e.target.value)}
              placeholder={
                newChemicalCategory === 'cleaning'
                  ? 'Ex: Desengraxante alcalino, solvente decapante...'
                  : 'Ex: Fundo primer epóxi, esmalte poliuretano...'
              }
              className="text-xs h-8"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleAddChemicalProduct()
                }
              }}
            />
          </div>

          <div className="sm:col-span-2 space-y-1">
            <Label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
              Unidade
            </Label>
            <Select
              value={newChemicalUnit}
              onValueChange={(val: 'L' | 'kg' | 'un' | 'gl' | 'lata') => setNewChemicalUnit(val)}
            >
              <SelectTrigger className="text-xs h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="L">L (Litro)</SelectItem>
                <SelectItem value="kg">kg (Quilograma)</SelectItem>
                <SelectItem value="un">un (Unidade)</SelectItem>
                <SelectItem value="gl">gl (Galão)</SelectItem>
                <SelectItem value="lata">lata (Lata)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="sm:col-span-1 space-y-1">
            <Label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
              Qtd
            </Label>
            <Input
              type="number"
              step="any"
              min="0.01"
              value={newChemicalQty}
              onChange={(e) => setNewChemicalQty(parseFloat(e.target.value) || 0)}
              className="text-xs h-8 font-mono"
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
              value={newChemicalUnitPrice}
              onChange={(e) => setNewChemicalUnitPrice(parseFloat(e.target.value) || 0)}
              className="text-xs h-8 font-mono"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleAddChemicalProduct()
                }
              }}
            />
          </div>

          <div className="sm:col-span-12 sm:flex sm:justify-end">
            <Button
              type="button"
              onClick={handleAddChemicalProduct}
              className="h-8 text-xs bg-teal-600 hover:bg-teal-700 text-white font-semibold gap-1.5 px-3"
              title="+ Adicionar produto químico"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>+ Adicionar produto químico</span>
            </Button>
          </div>
        </div>

        {/* Lista de Produtos Químicos Adicionados */}
        {chemicalProducts.length > 0 ? (
          <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-md bg-white dark:bg-slate-950">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 text-[11px] text-muted-foreground uppercase">
                <tr>
                  <th className="p-2 w-10 text-center">#</th>
                  <th className="p-2 w-24">Finalidade</th>
                  <th className="p-2">Descrição</th>
                  <th className="p-2 w-16 text-center">Unid.</th>
                  <th className="p-2 w-20 text-right">Qtd</th>
                  <th className="p-2 w-24 text-right">Preço Unit.</th>
                  <th className="p-2 w-24 text-right">Subtotal</th>
                  <th className="p-2 w-12 text-center">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {chemicalProducts.map((p, idx) => {
                  const isCleaning = p.category === 'cleaning'
                  return (
                    <tr
                      key={p.id || idx}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-900/40"
                    >
                      <td className="p-2 text-center text-muted-foreground font-mono">{idx + 1}</td>
                      <td className="p-2">
                        <Badge
                          variant="secondary"
                          className={`text-[10px] font-semibold ${
                            isCleaning
                              ? 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300 border-teal-300'
                              : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-300'
                          }`}
                        >
                          {isCleaning ? 'Limpeza' : 'Pintura'}
                        </Badge>
                      </td>
                      <td className="p-2 font-medium text-slate-800 dark:text-slate-200">
                        {p.description}
                      </td>
                      <td className="p-2 text-center font-mono text-muted-foreground">{p.unit}</td>
                      <td className="p-2 text-right font-mono font-semibold">{p.quantity}</td>
                      <td className="p-2 text-right font-mono text-muted-foreground">
                        {(p.unit_price || 0).toLocaleString('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        })}
                      </td>
                      <td className="p-2 text-right font-mono font-bold text-slate-900 dark:text-slate-100">
                        {(p.subtotal || 0).toLocaleString('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        })}
                      </td>
                      <td className="p-2 text-center">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveChemicalProduct(p.id, p.description)}
                          className="h-6 w-6 p-0 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                          title="Remover produto químico"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot className="bg-slate-50 dark:bg-slate-900/60 border-t border-slate-200 dark:border-slate-800 font-semibold">
                <tr>
                  <td colSpan={6} className="p-2 text-right text-xs">
                    Somatório dos Produtos Químicos:
                  </td>
                  <td className="p-2 text-right font-mono font-bold text-teal-700 dark:text-teal-300 text-xs">
                    {chemicalProductsTotal.toLocaleString('pt-BR', {
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
          <div className="p-3 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-md bg-slate-50/50 dark:bg-slate-900/30">
            <p className="text-xs text-muted-foreground">
              Nenhum produto químico cadastrado para esta proposta. Use os campos acima para
              quantificar produtos de limpeza e pintura.
            </p>
          </div>
        )}
      </div>
    </>
  )
}
