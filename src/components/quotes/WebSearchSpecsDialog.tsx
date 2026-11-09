import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { EquipmentWebSearchResultItem } from '@/services/quotes'
import {
  Check,
  ChevronDown,
  ChevronUp,
  Copy,
  ExternalLink,
  Globe,
  Loader2,
  Search,
} from 'lucide-react'
import { useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'

import type { useToast } from '@/hooks/use-toast'

interface WebSearchSpecsDialogProps {
  equipmentModel: string
  plateMaterial: string
  gasketMaterial: string
  isWebSearchModalOpen: boolean
  setIsWebSearchModalOpen: Dispatch<SetStateAction<boolean>>
  webSearchActiveIndex: number
  webSearchQuery: string
  setWebSearchQuery: Dispatch<SetStateAction<string>>
  webSearchResults: EquipmentWebSearchResultItem[]
  isWebSearching: boolean
  webSearchMessage: string
  applySpecsToEquipment: (
    index: number,
    specs: any,
    suggestedBrand?: string,
    suggestedModel?: string,
  ) => boolean
  handlePerformInternalQuery: (customQueryText: string) => any
  toast: ReturnType<typeof useToast>['toast']
}

export function WebSearchSpecsDialog(props: WebSearchSpecsDialogProps) {
  const {
    equipmentModel,
    plateMaterial,
    gasketMaterial,
    isWebSearchModalOpen,
    setIsWebSearchModalOpen,
    webSearchActiveIndex,
    webSearchQuery,
    setWebSearchQuery,
    webSearchResults,
    isWebSearching,
    webSearchMessage,
    applySpecsToEquipment,
    handlePerformInternalQuery,
    toast,
  } = props

  // 1 resultado principal + demais atrás do botão "ver outros resultados"
  const primaryResult = webSearchResults.length > 0 ? webSearchResults[0] : null
  const otherResults = webSearchResults.length > 1 ? webSearchResults.slice(1) : []
  const [showOtherResults, setShowOtherResults] = useState(false)

  const renderResultCard = (resItem: EquipmentWebSearchResultItem) => {
    const specs = resItem.specs
    return (
      <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 hover:border-teal-500/50 hover:shadow-xs transition-all space-y-2.5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                {resItem.title}
              </span>
              {resItem.badge && (
                <Badge
                  variant="secondary"
                  className="text-[10px] px-1.5 py-0 h-4 bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800"
                >
                  {resItem.badge}
                </Badge>
              )}
            </div>
            {resItem.snippet && (
              <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                {resItem.snippet}
              </p>
            )}
          </div>

          <Button
            type="button"
            size="sm"
            onClick={() => {
              const applied = applySpecsToEquipment(
                webSearchActiveIndex,
                resItem.specs,
                resItem.brand,
                resItem.model,
              )
              if (applied) {
                setIsWebSearchModalOpen(false)
                toast({
                  title: 'Especificações aplicadas!',
                  description: `Dados de ${resItem.title} preenchidos com sucesso no Item #${webSearchActiveIndex + 1}.`,
                })
              }
            }}
            className="h-7 px-3 text-xs bg-teal-600 hover:bg-teal-700 text-white shrink-0"
          >
            <Check className="h-3 w-3 mr-1" />
            Aplicar Specs
          </Button>
        </div>

        {specs && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-2 bg-slate-50 dark:bg-slate-950/60 rounded border border-slate-100 dark:border-slate-800/80 text-[11px]">
            <div>
              <span className="text-muted-foreground block text-[10px]">Qtd Placas:</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {specs.platesCount || specs.platesRange || 'N/A'}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground block text-[10px]">Material:</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200 truncate block">
                {specs.material || specs.plateMaterial || '—'}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground block text-[10px]">Gaxeta / Vedação:</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200 truncate block">
                {specs.gasketMaterial || '—'}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground block text-[10px]">Conexão / Pressão:</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200 truncate block">
                {specs.connection || '—'} • {specs.pressure || '—'}
              </span>
            </div>
          </div>
        )}

        {resItem.url && (
          <div className="flex items-center justify-between pt-0.5 text-[10px] text-muted-foreground">
            <a
              href={resItem.url}
              target="_blank"
              rel="noreferrer noopener"
              className="truncate max-w-[80%] text-teal-700 dark:text-teal-300 hover:underline flex items-center gap-1"
              title={resItem.url}
            >
              <ExternalLink className="h-2.5 w-2.5 shrink-0" />
              Fonte: {resItem.url}
            </a>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(resItem.url || '')
                toast({
                  title: 'URL copiada',
                  description: 'Endereço da fonte copiado para a área de transferência.',
                })
              }}
              className="text-teal-600 hover:underline flex items-center gap-1 shrink-0"
            >
              <Copy className="h-2.5 w-2.5" />
              Copiar URL
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    <>
      {/* Modal interno de Pesquisa Técnica — fonte oficial única, sem IA sem fonte */}
      <Dialog open={isWebSearchModalOpen} onOpenChange={setIsWebSearchModalOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-0 overflow-hidden">
          <DialogHeader className="p-4 pb-2 border-b border-slate-100 dark:border-slate-800 bg-teal-50/50 dark:bg-teal-950/20">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-sm font-bold flex items-center gap-2 text-teal-900 dark:text-teal-200">
                <Globe className="h-4 w-4 text-teal-600" />
                Busca de Especificações Técnicas — Fonte Oficial
              </DialogTitle>
              <Badge
                variant="outline"
                className="text-[10px] border-teal-300 text-teal-700 dark:border-teal-700 dark:text-teal-300"
              >
                Item #{webSearchActiveIndex + 1}
              </Badge>
            </div>
            <DialogDescription className="text-xs text-muted-foreground mt-1">
              Pesquisa restrita ao site oficial do fabricante. Sem resultado oficial, nada é
              preenchido automaticamente.
            </DialogDescription>
          </DialogHeader>

          {/* Barra de busca refinada */}
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                value={webSearchQuery}
                onChange={(e) => setWebSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handlePerformInternalQuery(webSearchQuery)
                  }
                }}
                placeholder="Ex: BP30, BP6, M10-B, BL50..."
                className="pl-8 h-8 text-xs font-medium"
              />
            </div>
            <Button
              type="button"
              size="sm"
              disabled={isWebSearching || !webSearchQuery.trim()}
              onClick={() => handlePerformInternalQuery(webSearchQuery)}
              className="h-8 px-3 text-xs bg-teal-600 hover:bg-teal-700 text-white"
            >
              {isWebSearching ? (
                <>
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  Pesquisando...
                </>
              ) : (
                <>
                  <Search className="h-3 w-3 mr-1" />
                  Pesquisar
                </>
              )}
            </Button>
          </div>

          {/* Área de Resultados */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {webSearchMessage && (
              <p className="text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/60 p-2.5 rounded-md border border-slate-200 dark:border-slate-800">
                {webSearchMessage}
              </p>
            )}

            {isWebSearching ? (
              <div className="py-12 flex flex-col items-center justify-center space-y-3 text-center">
                <Loader2 className="h-8 w-8 text-teal-600 animate-spin" />
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    Consultando o site oficial do fabricante...
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Busca limitada às fontes oficiais aprovadas
                  </p>
                </div>
              </div>
            ) : primaryResult ? (
              <div className="space-y-2.5">
                {renderResultCard(primaryResult)}

                {otherResults.length > 0 && (
                  <div className="space-y-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowOtherResults((prev) => !prev)}
                      className="h-7 text-xs w-full border-teal-200 text-teal-700 hover:bg-teal-50 dark:border-teal-800 dark:text-teal-300"
                    >
                      {showOtherResults ? (
                        <>
                          <ChevronUp className="h-3 w-3 mr-1" />
                          Ocultar outros resultados ({otherResults.length})
                        </>
                      ) : (
                        <>
                          <ChevronDown className="h-3 w-3 mr-1" />
                          Ver outros resultados ({otherResults.length})
                        </>
                      )}
                    </Button>
                    {showOtherResults && (
                      <div className="space-y-2.5">
                        {otherResults.map((r) => renderResultCard(r))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="py-8 text-center space-y-3">
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  Não encontrado no site do fabricante — consultar fabricante
                </p>
                <p className="text-xs text-muted-foreground max-w-md mx-auto">
                  A busca cobre apenas os sites oficiais aprovados. Nenhum dado técnico é preenchido
                  sem fonte — consulte o fabricante ou insira os dados manualmente.
                </p>
              </div>
            )}
          </div>

          <DialogFooter className="p-3 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span className="text-[11px] text-muted-foreground">
              Total de resultados: {webSearchResults.length}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsWebSearchModalOpen(false)}
              className="h-7 text-xs"
            >
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
