import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { EquipmentSpecsExtractionResponse } from '@/services/quotes'
import { EquipmentWebSearchResultItem } from '@/services/quotes'
import { QuoteStatus } from '@/types/crm'
import { Check, ExternalLink, Globe, Loader2, Search } from 'lucide-react'
import type { Dispatch, SetStateAction } from 'react'

interface EditorSourceReviewPanelProps {
  status: QuoteStatus
  isWebSearchModalOpen: boolean
  setIsWebSearchModalOpen: Dispatch<SetStateAction<boolean>>
  webSearchQuery: string
  webSearchResults: EquipmentWebSearchResultItem[]
  isWebSearching: boolean
  webSearchMessage: string
  webSearchExtractingId: string | null
  webSearchExtractionByResult: Record<string, EquipmentSpecsExtractionResponse>
  webSearchSelectedFields: Record<string, Record<string, boolean>>
  setWebSearchSelectedFields: Dispatch<SetStateAction<Record<string, Record<string, boolean>>>>
  handleExtractSpecsFromResult: (result: EquipmentWebSearchResultItem) => any
  handleApplyExtractedResult: (result: EquipmentWebSearchResultItem) => any
}

export function EditorSourceReviewPanel(props: EditorSourceReviewPanelProps) {
  const {
    status,
    isWebSearchModalOpen,
    setIsWebSearchModalOpen,
    webSearchQuery,
    webSearchResults,
    isWebSearching,
    webSearchMessage,
    webSearchExtractingId,
    webSearchExtractionByResult,
    webSearchSelectedFields,
    setWebSearchSelectedFields,
    handleExtractSpecsFromResult,
    handleApplyExtractedResult,
  } = props

  return (
    <>
      {isWebSearchModalOpen && (
        <Card className="border-teal-300 dark:border-teal-800 shadow-sm">
          <CardHeader className="p-4 pb-3 bg-teal-50/70 dark:bg-teal-950/30 border-b border-teal-200 dark:border-teal-900">
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle className="text-sm font-bold text-teal-900 dark:text-teal-200 flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Revisão de fonte e especificações
                </CardTitle>
                <p className="text-[11px] text-teal-800/80 dark:text-teal-300/80 mt-1">
                  Nada é aplicado automaticamente. Extraia a fonte, revise cada evidência e aplique
                  somente os campos selecionados.
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsWebSearchModalOpen(false)}
                className="h-7 px-2 text-xs text-slate-600 hover:text-slate-900"
              >
                Fechar
              </Button>
            </div>
            {webSearchQuery && (
              <div className="text-[11px] font-mono text-teal-900 dark:text-teal-200 mt-2">
                Consulta: {webSearchQuery}
              </div>
            )}
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            {isWebSearching && (
              <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                <Loader2 className="h-4 w-4 animate-spin text-teal-600" />
                Consultando fonte oficial e candidatos...
              </div>
            )}
            {webSearchMessage && !isWebSearching && (
              <div className="text-xs text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-900 rounded-md border border-slate-200 dark:border-slate-800 p-2.5">
                {webSearchMessage}
              </div>
            )}
            {!isWebSearching && webSearchResults.length === 0 && (
              <div className="text-xs text-muted-foreground border border-dashed border-slate-300 dark:border-slate-700 rounded-md p-3 text-center">
                Nenhuma fonte candidata disponível para revisão.
              </div>
            )}
            {webSearchResults.map((result) => {
              const extraction = webSearchExtractionByResult[result.id]
              const evidenceEntries = Object.entries(extraction?.fieldEvidence || {})
              return (
                <div
                  key={result.id}
                  className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-3 space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="text-[10px]">
                          {result.badge || result.sourceType || 'Candidato'}
                        </Badge>
                        {result.brand && (
                          <Badge variant="secondary" className="text-[10px]">
                            {result.brand}
                          </Badge>
                        )}
                        {result.model && (
                          <span className="text-xs font-mono font-semibold text-slate-800 dark:text-slate-200">
                            {result.model}
                          </span>
                        )}
                      </div>
                      <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                        {result.title}
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 break-all">
                        {result.sourceDomain || result.url || 'Fonte não informada'}
                      </div>
                      {result.snippet && (
                        <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                          {result.snippet}
                        </p>
                      )}
                      {result.url && (
                        <a
                          href={result.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[10px] text-teal-700 dark:text-teal-300 hover:underline break-all"
                        >
                          <ExternalLink className="h-3 w-3 shrink-0" />
                          Abrir fonte
                        </a>
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={webSearchExtractingId === result.id || !result.url}
                      onClick={() => handleExtractSpecsFromResult(result)}
                      className="h-8 text-xs shrink-0 border-teal-300 text-teal-700 hover:bg-teal-50 dark:border-teal-800 dark:text-teal-300"
                    >
                      {webSearchExtractingId === result.id ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                          Extraindo...
                        </>
                      ) : (
                        <>
                          <Search className="h-3.5 w-3.5 mr-1" />
                          Extrair dados
                        </>
                      )}
                    </Button>
                  </div>

                  {extraction && (
                    <div className="border-t border-slate-200 dark:border-slate-800 pt-3 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-[11px] font-bold text-slate-800 dark:text-slate-200">
                          {extraction.found
                            ? 'Campos explícitos encontrados'
                            : 'Sem campos explícitos suportados'}
                        </div>
                        <Badge
                          variant="outline"
                          className={
                            extraction.found
                              ? 'text-[10px] border-emerald-300 text-emerald-700'
                              : 'text-[10px] border-amber-300 text-amber-700'
                          }
                        >
                          {extraction.status || 'revisar'}
                        </Badge>
                      </div>
                      {extraction.message && (
                        <div className="text-[10px] text-slate-500 dark:text-slate-400">
                          {extraction.message}
                        </div>
                      )}
                      {evidenceEntries.length > 0 && (
                        <div className="space-y-2">
                          {evidenceEntries.map(([field, evidence]) => {
                            const selected = webSearchSelectedFields[result.id]?.[field] !== false
                            const value = extraction.specs?.[field]
                            return (
                              <label
                                key={field}
                                className="flex items-start gap-2 rounded-md border border-slate-200 dark:border-slate-800 p-2 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900"
                              >
                                <input
                                  type="checkbox"
                                  checked={selected}
                                  onChange={() =>
                                    setWebSearchSelectedFields((prev) => ({
                                      ...prev,
                                      [result.id]: {
                                        ...(prev[result.id] || {}),
                                        [field]: !selected,
                                      },
                                    }))
                                  }
                                  className="mt-0.5 accent-teal-600"
                                />
                                <span className="min-w-0 space-y-0.5">
                                  <span className="block text-[11px] font-semibold text-slate-800 dark:text-slate-200">
                                    {field}: {String(value ?? evidence.value ?? '')}
                                    {evidence.unit ? ` ${evidence.unit}` : ''}
                                  </span>
                                  <span className="block text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">
                                    Evidência: {evidence.sourceText}
                                  </span>
                                </span>
                              </label>
                            )
                          })}
                        </div>
                      )}
                      <div className="flex items-center justify-between gap-2 pt-1">
                        <span className="text-[10px] text-slate-500 dark:text-slate-400">
                          Fonte oficial validada; aplicação continua manual.
                        </span>
                        <Button
                          type="button"
                          size="sm"
                          disabled={evidenceEntries.length === 0}
                          onClick={() => handleApplyExtractedResult(result)}
                          className="h-8 text-xs bg-teal-700 hover:bg-teal-800 text-white"
                        >
                          <Check className="h-3.5 w-3.5 mr-1" />
                          Aplicar selecionados
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </CardContent>
        </Card>
      )}
    </>
  )
}
