import React, { useRef } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { QuoteRecord } from '@/types/crm'
import {
  Printer,
  FileDown,
  Wrench,
  Flame,
  CheckCircle2,
  Calendar,
  Building2,
  MapPin,
  Clock,
  ShieldCheck,
  User,
  Info,
} from 'lucide-react'
import { PROPOSAL_INCLUSIONS_TEXT } from '@/data/bermo-catalog'

interface QuotePdfPreviewDialogProps {
  quote: QuoteRecord | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function QuotePdfPreviewDialog({ quote, open, onOpenChange }: QuotePdfPreviewDialogProps) {
  const printRef = useRef<HTMLDivElement>(null)

  if (!quote) return null

  const handlePrint = () => {
    window.print()
  }

  // Identificação do primeiro item com especificações
  const mainItem = quote.items && quote.items.length > 0 ? quote.items[0] : null
  const specs = mainItem?.bermo_specs || quote.service_details?.service_technical_specs
  const laborDetails = quote.service_details?.labor_costs
  const travelDetails = quote.service_details?.travel_costs
  const lodgingDetails = quote.service_details?.lodging_meals_costs
  const validityDays = quote.service_details?.payment_and_validity?.validityDays || 10

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto p-0 print:p-0 print:max-w-none print:shadow-none">
        {/* Ações Superiores (não impressas) */}
        <DialogHeader className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-row items-center justify-between sticky top-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xs z-10 print:hidden">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300">
              <Flame className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-slate-900 dark:text-slate-100">
                Visualização de Impressão / PDF Oficial
              </DialogTitle>
              <p className="text-xs text-muted-foreground">
                Documento formatado para apresentação direta ao cliente (sem custos indiretos)
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="text-xs h-8 font-semibold border-slate-300 dark:border-slate-700"
            >
              <Printer className="h-3.5 w-3.5 mr-1.5 text-teal-600" />
              Imprimir / Salvar PDF
            </Button>
            <Button
              size="sm"
              onClick={handlePrint}
              className="text-xs h-8 font-semibold bg-teal-700 hover:bg-teal-600 text-white"
            >
              <FileDown className="h-3.5 w-3.5 mr-1.5" />
              Exportar
            </Button>
          </div>
        </DialogHeader>

        {/* ÁREA DO DOCUMENTO FORMATADO (A4 STYLE) */}
        <div
          ref={printRef}
          className="p-8 sm:p-12 space-y-6 text-slate-900 bg-white font-sans text-xs leading-relaxed print:p-0 print:text-[11px]"
        >
          {/* Cabeçalho Corporativo Intertermal / BERMO */}
          <div className="border-b-2 border-teal-700 pb-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-2xl tracking-tighter text-teal-900">
                  INTERTERMAL
                </span>
                <span className="text-xs px-2 py-0.5 rounded bg-teal-100 text-teal-800 font-bold tracking-wider uppercase">
                  Engenharia Térmica
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                Assistência Técnica Autorizada & Especialista em Trocadores de Calor e Válvulas
                BERMO
              </p>
              <p className="text-[10px] text-slate-400">
                Rua Bernardo Reiter, 500 - Blumenau/SC • Tel: (47) 3333-0000 •
                contato@intertermal.com.br
              </p>
            </div>

            <div className="text-right sm:text-right space-y-1 bg-slate-50 p-3 rounded-lg border border-slate-200">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block">
                Proposta Comercial de Serviços
              </span>
              <div className="font-mono text-base font-black text-teal-800">
                {quote.quote_number}
              </div>
              <div className="text-[11px] text-slate-600 flex items-center gap-1 justify-end">
                <Calendar className="h-3 w-3 text-slate-400" />
                Data: {new Date(quote.created || Date.now()).toLocaleDateString('pt-BR')}
              </div>
              <div className="text-[11px] text-teal-700 font-semibold">
                Validade: {validityDays} dias úteis
              </div>
            </div>
          </div>

          {/* Dados do Cliente e Responsável Técnico */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-teal-800 flex items-center gap-1">
                <Building2 className="h-3 w-3" />
                Dados do Cliente
              </span>
              <div className="font-bold text-sm text-slate-900">
                {quote.client_name || 'Empresa Cliente'}
              </div>
              {travelDetails?.destinationAddress && (
                <div className="text-slate-600 flex items-start gap-1 text-[11px]">
                  <MapPin className="h-3 w-3 text-slate-400 shrink-0 mt-0.5" />
                  <span>Planta/Local: {travelDetails.destinationAddress}</span>
                </div>
              )}
            </div>

            <div className="space-y-1 sm:text-right">
              <span className="text-[10px] font-bold uppercase tracking-wider text-teal-800 flex items-center gap-1 sm:justify-end">
                <User className="h-3 w-3" />
                Responsável Técnico Intertermal
              </span>
              <div className="font-semibold text-slate-800">
                {quote.assigned_to || 'Alex Nogueira - Especialista Técnico'}
              </div>
              <div className="text-[11px] text-slate-500">
                Departamento de Engenharia e Manutenção de Campo
              </div>
            </div>
          </div>

          {/* Seção 1: Escopo de Fornecimento & Serviços BERMO */}
          <div className="space-y-2">
            <div className="flex items-center justify-between border-b border-slate-200 pb-1">
              <h3 className="font-bold text-slate-900 uppercase tracking-wider text-xs flex items-center gap-1.5">
                <Wrench className="h-3.5 w-3.5 text-teal-700" />
                1. Escopo de Serviços e Equipamentos
              </h3>
            </div>

            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 uppercase text-[10px] font-bold">
                  <tr>
                    <th className="p-2.5">Descrição Técnica dos Serviços</th>
                    <th className="p-2.5 text-center w-16">Qtd</th>
                    <th className="p-2.5 text-right w-28">Valor Unitário</th>
                    <th className="p-2.5 text-right w-28">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {quote.items && quote.items.length > 0 ? (
                    quote.items.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="p-2.5 space-y-1.5">
                          <div className="font-bold text-slate-900 text-xs">{item.name}</div>
                          {item.description && (
                            <div className="text-[11px] text-slate-700 whitespace-pre-line bg-slate-50 p-2.5 rounded border border-slate-100">
                              {item.description}
                            </div>
                          )}
                          {item.bermo_specs && (
                            <div className="p-2 rounded bg-teal-50/60 border border-teal-100 space-y-1 text-[10.5px]">
                              <div className="flex flex-wrap gap-x-3 gap-y-0.5 font-mono text-[10px]">
                                {item.bermo_specs.productCode && (
                                  <span>
                                    Modelo: <strong>{item.bermo_specs.productCode}</strong>
                                  </span>
                                )}
                                {item.bermo_specs.productBrand && (
                                  <span>
                                    Fabricante: <strong>{item.bermo_specs.productBrand}</strong>
                                  </span>
                                )}
                                {item.bermo_specs.platesCount && (
                                  <span>
                                    Nº Placas: <strong>{item.bermo_specs.platesCount}</strong>
                                  </span>
                                )}
                                {item.bermo_specs.plateDimensions && (
                                  <span>
                                    Dimensão Placas:{' '}
                                    <strong>{item.bermo_specs.plateDimensions}</strong>
                                  </span>
                                )}
                                {item.bermo_specs.gasketType && (
                                  <span>
                                    Gaxetas: <strong>{item.bermo_specs.gasketType}</strong>
                                  </span>
                                )}
                                {item.bermo_specs.operatingPressure && (
                                  <span>
                                    Pressão:{' '}
                                    <strong>{item.bermo_specs.operatingPressure} bar</strong>
                                  </span>
                                )}
                                {item.bermo_specs.inletTemp && (
                                  <span>
                                    Temp:{' '}
                                    <strong>
                                      {item.bermo_specs.inletTemp}°C a{' '}
                                      {item.bermo_specs.outletTemp || 0}°C
                                    </strong>
                                  </span>
                                )}
                                {item.bermo_specs.pipeMeasurement && (
                                  <span>
                                    Tubulação: <strong>{item.bermo_specs.pipeMeasurement}</strong>
                                  </span>
                                )}
                              </div>
                              {item.bermo_specs.serviceScope && (
                                <div className="text-slate-600 italic">
                                  Escopo: {item.bermo_specs.serviceScope}
                                </div>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="p-2.5 text-center font-semibold">{item.quantity}</td>
                        <td className="p-2.5 text-right font-mono text-slate-700">
                          {(item.unit_price || 0).toLocaleString('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          })}
                        </td>
                        <td className="p-2.5 text-right font-mono font-bold text-slate-900">
                          {(item.total || 0).toLocaleString('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          })}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="p-3 text-center text-slate-400">
                        Nenhum item adicionado
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Seção 2: Metodologia e Especificações Técnicas de Campo */}
          <div className="space-y-2">
            <div className="flex items-center justify-between border-b border-slate-200 pb-1">
              <h3 className="font-bold text-slate-900 uppercase tracking-wider text-xs flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-teal-700" />
                2. Metodologia de Execução Técnica & Segurança
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px] text-slate-700">
              <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 space-y-1">
                <span className="font-bold text-slate-900 block">
                  Desmontagem, Limpeza e Verificação
                </span>
                <p>
                  Abertura do conjunto com medição precisa do feixe (Medida A). Limpeza
                  química/mecânica não agressiva das placas e desincrustação.
                </p>
              </div>
              <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 space-y-1">
                <span className="font-bold text-slate-900 block">
                  Inspeção NDT & Teste Hidrostático
                </span>
                <p>
                  Inspeção visual/líquido penetrante para trincas e microporosidades. Remontagem com
                  torque cruzado uniforme e teste de estanqueidade.
                </p>
              </div>
            </div>
          </div>

          {/* Seção 3: Incluso no Valor (CONFORME ESPECIFICAÇÃO INSTITUCIONAL) */}
          <div className="p-3.5 rounded-xl bg-teal-50/70 border border-teal-200 text-xs text-slate-800 space-y-1.5">
            <div className="flex items-center gap-1.5 text-teal-900 font-bold uppercase text-[11px] tracking-wider">
              <CheckCircle2 className="h-4 w-4 text-teal-700" />
              Incluso no valor
            </div>
            <p className="text-[11px] text-slate-700 leading-relaxed text-justify">
              {PROPOSAL_INCLUSIONS_TEXT}
            </p>
          </div>

          {/* Seção 4: Condições Comerciais & Pagamento */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                Condições Comerciais de Faturamento
              </span>
              <div className="font-bold text-teal-800 text-xs">
                Condição: {quote.payment_terms || '28 DDL (28 dias do dia líquido)'}
              </div>
              <div className="text-[11px] text-slate-600">
                Faturamento direto contra CNPJ cadastrado após homologação do serviço.
              </div>
            </div>

            <div className="space-y-1.5 text-right sm:text-right">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                Valor Total da Proposta
              </span>
              <div className="text-xl font-black text-teal-900 font-mono">
                {(quote.total || 0).toLocaleString('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                })}
              </div>
              <div className="text-[10px] text-slate-500 font-medium">
                Impostos, mão de obra e deslocamento inclusos
              </div>
            </div>
          </div>

          {/* Observações Gerais */}
          {quote.notes && (
            <div className="p-3 rounded-lg border border-slate-200 text-[11px] text-slate-600 space-y-1">
              <span className="font-bold text-slate-800 block">Observações Técnicas:</span>
              <p>{quote.notes}</p>
            </div>
          )}

          {/* Assinatura / Aceite da Proposta */}
          <div className="pt-8 border-t border-slate-200 grid grid-cols-2 gap-8 text-center text-[10px] text-slate-600">
            <div className="space-y-10">
              <div className="border-b border-slate-400 mx-8"></div>
              <div>
                <strong className="block text-slate-800">
                  {quote.assigned_to || 'Intertermal Manutenção Industrial'}
                </strong>
                <span>Depto. de Engenharia e Serviços BERMO</span>
              </div>
            </div>

            <div className="space-y-10">
              <div className="border-b border-slate-400 mx-8"></div>
              <div>
                <strong className="block text-slate-800">
                  {quote.client_name || 'De acordo do Cliente'}
                </strong>
                <span>Assinatura do Responsável / Carimbo CNPJ</span>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 print:hidden">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="text-xs">
            Fechar Visualização
          </Button>
          <Button
            onClick={handlePrint}
            className="text-xs bg-teal-700 hover:bg-teal-600 text-white"
          >
            <Printer className="h-3.5 w-3.5 mr-1.5" />
            Imprimir Proposta Oficial
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
