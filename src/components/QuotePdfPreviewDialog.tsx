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
import {
  Printer,
  Download,
  Flame,
  CheckCircle2,
  Calendar,
  Building2,
  FileText,
  ShieldCheck,
  Wrench,
  Mail,
  Phone,
  MapPin,
  ExternalLink,
} from 'lucide-react'
import type { QuoteRecord, ClientRecord } from '@/types/crm'

interface QuotePdfPreviewDialogProps {
  isOpen: boolean
  onClose: () => void
  quote: QuoteRecord | null
  client?: ClientRecord | null
}

export const QuotePdfPreviewDialog: React.FC<QuotePdfPreviewDialogProps> = ({
  isOpen,
  onClose,
  quote,
  client,
}) => {
  const documentRef = useRef<HTMLDivElement>(null)

  if (!quote) return null

  // Calcular data de emissão e de validade (10 dias úteis padrão)
  const createdDate = quote.created ? new Date(quote.created) : new Date()
  const formattedCreatedDate = createdDate.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })

  // Validade de 10 dias úteis
  const validityDays = quote.service_details?.payment_and_validity?.validityDays || 10
  const validUntilDate = quote.valid_until
    ? new Date(quote.valid_until)
    : new Date(createdDate.getTime() + validityDays * 1.4 * 24 * 60 * 60 * 1000)
  const formattedValidDate = validUntilDate.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })

  // Termos de pagamento
  const paymentCondition =
    quote.payment_terms ||
    (quote.service_details?.payment_and_validity?.conditionType === '14_ddl'
      ? '14 DDL (14 dias do dia líquido)'
      : quote.service_details?.payment_and_validity?.conditionType === '28_ddl'
        ? '28 DDL (28 dias do dia líquido)'
        : quote.service_details?.payment_and_validity?.conditionType === '30_ddl'
          ? '30 DDL (30 dias)'
          : quote.service_details?.payment_and_validity?.conditionType === '45_ddl'
            ? '45 DDL (45 dias)'
            : quote.service_details?.payment_and_validity?.conditionType === '60_ddl'
              ? '60 DDL (60 dias)'
              : quote.service_details?.payment_and_validity?.customConditionText || '28 DDL')

  // Total do serviço na proposta externa (nunca expõe custos indiretos ou custos de produto não inclusos)
  const totalValue = quote.total || 0

  const handlePrint = () => {
    window.print()
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[92vh] flex flex-col p-0 overflow-hidden bg-slate-900 border-slate-700">
        {/* Barra de Ações Superior do PDF */}
        <div className="bg-slate-950 px-6 py-3.5 border-b border-slate-800 flex items-center justify-between text-white shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-teal-700 flex items-center justify-center text-white shadow-sm">
              <FileText className="h-4 w-4" />
            </div>
            <div>
              <DialogTitle className="text-sm font-bold text-slate-100 flex items-center gap-2">
                Prévia da Proposta Técnica em PDF
                <Badge className="bg-teal-700 text-white text-[10px] font-medium">
                  {quote.quote_number}
                </Badge>
              </DialogTitle>
              <p className="text-[11px] text-slate-400">
                Visualização oficial para envio ao cliente (sem custos indiretos internos)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 print:hidden">
            <Button
              size="sm"
              variant="outline"
              onClick={handlePrint}
              className="bg-slate-800 hover:bg-slate-700 border-slate-700 text-white text-xs h-8"
            >
              <Printer className="h-3.5 w-3.5 mr-1.5" />
              Imprimir / Salvar PDF
            </Button>
            <Button
              size="sm"
              onClick={handlePrint}
              className="bg-teal-700 hover:bg-teal-600 text-white text-xs h-8"
            >
              <Download className="h-3.5 w-3.5 mr-1.5" />
              Exportar PDF
            </Button>
          </div>
        </div>

        {/* Folha A4 do PDF (Visual Clean, Sofisticado: Azul Petróleo / Slate com acentos Verde-Musgo) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-800/60 flex justify-center">
          <div
            ref={documentRef}
            id="quote-printable-document"
            className="w-full max-w-[800px] bg-white text-slate-900 shadow-2xl rounded-sm p-8 sm:p-10 space-y-7 text-xs border border-slate-200"
            style={{
              fontFamily:
                '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
              minHeight: '1050px',
            }}
          >
            {/* 1. CABEÇALHO INTERTERMAL COM LOGO / IDENTIDADE VISUAL */}
            <header className="border-b-2 border-teal-800 pb-5">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-teal-900 via-teal-800 to-emerald-700 flex items-center justify-center text-white shadow-md">
                    <Flame className="h-7 w-7 text-teal-200" />
                  </div>
                  <div>
                    <h1 className="text-xl font-extrabold tracking-tight text-slate-950 font-mono">
                      INTERTERMAL
                    </h1>
                    <p className="text-[11px] font-semibold text-teal-800 uppercase tracking-wider">
                      Assistência Técnica & Engenharia Térmica
                    </p>
                    <p className="text-[10px] text-slate-500">
                      Especialista Autorizado em Equipamentos e Válvulas BERMO
                    </p>
                  </div>
                </div>

                <div className="text-left sm:text-right space-y-1">
                  <div className="inline-block bg-teal-900 text-white text-xs font-mono font-bold px-3 py-1 rounded">
                    PROPOSTA TÉCNICA {quote.quote_number}
                  </div>
                  <div className="text-[11px] text-slate-600">
                    Data de Emissão: <strong>{formattedCreatedDate}</strong>
                  </div>
                  <div className="text-[11px] text-emerald-800 font-semibold">
                    Validade: <strong>{validityDays} dias úteis</strong> ({formattedValidDate})
                  </div>
                </div>
              </div>
            </header>

            {/* 2. DADOS DO CLIENTE & DADOS DO PROJETO */}
            <section className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-200">
              <div className="space-y-1.5 border-b sm:border-b-0 sm:border-r border-slate-200 pb-3 sm:pb-0 sm:pr-4">
                <div className="text-[10px] font-bold text-teal-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5 text-teal-700" />
                  Dados do Cliente
                </div>
                <div className="text-sm font-bold text-slate-900">
                  {client?.company_name ||
                    client?.name ||
                    quote.client_name ||
                    'Cliente Industrial'}
                </div>
                {client?.document && (
                  <div className="text-[11px] text-slate-600">
                    <span className="font-semibold">CNPJ/CPF:</span> {client.document}
                  </div>
                )}
                {(client?.address || client?.city) && (
                  <div className="text-[11px] text-slate-600 flex items-start gap-1">
                    <MapPin className="h-3 w-3 text-slate-400 shrink-0 mt-0.5" />
                    <span>
                      {client.address ? `${client.address}, ` : ''}
                      {client.city || ''} {client.state ? `- ${client.state}` : ''}
                    </span>
                  </div>
                )}
                {(client?.email || client?.phone) && (
                  <div className="text-[10px] text-slate-500 pt-0.5">
                    {client?.phone && <span>Tel: {client.phone} </span>}
                    {client?.email && <span>| E-mail: {client.email}</span>}
                  </div>
                )}
              </div>

              <div className="space-y-1.5 sm:pl-2">
                <div className="text-[10px] font-bold text-teal-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Wrench className="h-3.5 w-3.5 text-teal-700" />
                  Responsável Técnico & Atendimento
                </div>
                <div className="text-xs font-semibold text-slate-900">
                  {quote.assigned_to || 'Alex Nogueia — Especialista Técnico de Aplicações BERMO'}
                </div>
                <div className="text-[11px] text-slate-600">
                  Intertermal Engenharia Térmica Industrial
                </div>
                <div className="text-[10px] text-slate-500">
                  Blumenau - Santa Catarina | Atendimento Brasil
                </div>
              </div>
            </section>

            {/* 3. ITENS DO ORÇAMENTO COM DESCRIÇÃO TÉCNICA DO SERVIÇO E VALORES */}
            <section className="space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-teal-700" />
                  1. Descrição dos Serviços Técnicos Especializados
                </h2>
                <span className="text-[10px] text-slate-500">Assistência Técnica Autorizada</span>
              </div>

              <table className="w-full text-left border border-slate-200 rounded overflow-hidden">
                <thead className="bg-slate-100 text-slate-800 text-[10px] font-bold uppercase">
                  <tr>
                    <th className="p-3">Item / Escopo do Serviço</th>
                    <th className="p-3 text-center w-16">Qtd</th>
                    <th className="p-3 text-right w-28">Valor Unitário</th>
                    <th className="p-3 text-right w-28">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-xs">
                  {quote.items && quote.items.length > 0 ? (
                    quote.items.map((it, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="p-3 align-top space-y-1">
                          <div className="font-bold text-slate-900">{it.name}</div>
                          {it.bermo_specs?.serviceScope && (
                            <p className="text-[11px] text-slate-600 leading-relaxed">
                              {it.bermo_specs.serviceScope}
                            </p>
                          )}
                          {/* Destaque se o custo do produto foi opcionalmente incluso pelo usuário */}
                          {it.include_product_cost && (
                            <span className="inline-block text-[9px] font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                              Fornecimento de partes/peças de reposição incluso no item
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-center align-top font-medium text-slate-700">
                          {it.quantity || 1}
                        </td>
                        <td className="p-3 text-right align-top text-slate-700">
                          {(it.unit_price || 0).toLocaleString('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          })}
                        </td>
                        <td className="p-3 text-right align-top font-bold text-slate-900">
                          {(it.total || 0).toLocaleString('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          })}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="p-4 text-center text-slate-500">
                        Nenhum item informado.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </section>

            {/* 4. ESCOPO TÉCNICO DOS PRODUTOS BERMO (MODELOS, ESPECIFICAÇÕES) — SEM CUSTO DOS PRODUTOS */}
            <section className="space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-teal-700" />
                  2. Parâmetros Técnicos do Equipamento BERMO de Referência
                </h2>
                <Badge
                  variant="outline"
                  className="text-[9px] border-teal-300 text-teal-800 bg-teal-50"
                >
                  Dados Técnicos do Fabricante
                </Badge>
              </div>

              <div className="p-4 rounded-lg bg-teal-50/40 border border-teal-200/80 space-y-3">
                {(() => {
                  const firstItemSpecs =
                    quote.items && quote.items.length > 0 ? quote.items[0]?.bermo_specs : null
                  const specs =
                    quote.service_details?.service_technical_specs || firstItemSpecs || {}

                  return (
                    <>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                        <div>
                          <span className="text-[10px] text-slate-500 block">Modelo / Ref.:</span>
                          <span className="font-bold text-teal-950">
                            {specs.productModel || specs.productCode || 'BERMO'}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 block">Fabricante:</span>
                          <span className="font-bold text-teal-950">
                            {specs.productBrand || 'BERMO / ARI Armaturen'}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 block">Fluido Térmico:</span>
                          <span className="font-semibold text-slate-800">
                            {specs.fluidName || specs.fluidType || 'Vapor / Água'}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 block">
                            Pressão de Operação:
                          </span>
                          <span className="font-semibold text-slate-800">
                            {specs.operatingPressure
                              ? `${specs.operatingPressure} bar`
                              : 'Conforme processo'}
                          </span>
                        </div>
                      </div>

                      {/* Grade de Especificações Físicas */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-2 border-t border-teal-200/60">
                        {specs.platesCount && (
                          <div>
                            <span className="text-[10px] text-slate-500 block">
                              Número de Placas:
                            </span>
                            <span className="font-bold text-teal-900">{specs.platesCount}</span>
                          </div>
                        )}
                        {specs.plateDimensions && (
                          <div>
                            <span className="text-[10px] text-slate-500 block">
                              Dimensão das Placas:
                            </span>
                            <span className="font-semibold text-slate-800">
                              {specs.plateDimensions}
                            </span>
                          </div>
                        )}
                        {specs.gasketsCount && (
                          <div>
                            <span className="text-[10px] text-slate-500 block">
                              Qtd. de Gaxetas:
                            </span>
                            <span className="font-bold text-teal-900">{specs.gasketsCount}</span>
                          </div>
                        )}
                        {specs.gasketType && (
                          <div>
                            <span className="text-[10px] text-slate-500 block">
                              Tipo de Vedação:
                            </span>
                            <span className="font-semibold text-slate-800">{specs.gasketType}</span>
                          </div>
                        )}
                        {specs.frameMaterial && (
                          <div>
                            <span className="text-[10px] text-slate-500 block">
                              Material das Placas:
                            </span>
                            <span className="font-semibold text-slate-800">
                              {specs.frameMaterial}
                            </span>
                          </div>
                        )}
                        {specs.equipmentSize && (
                          <div>
                            <span className="text-[10px] text-slate-500 block">
                              Conexão / Tamanho:
                            </span>
                            <span className="font-semibold text-slate-800">
                              {specs.equipmentSize}
                            </span>
                          </div>
                        )}
                        {specs.pipeMeasurement && (
                          <div>
                            <span className="text-[10px] text-slate-500 block">
                              Medida da Tubulação:
                            </span>
                            <span className="font-semibold text-slate-800">
                              {specs.pipeMeasurement}
                            </span>
                          </div>
                        )}
                        {specs.workAreaDifficulty && (
                          <div>
                            <span className="text-[10px] text-slate-500 block">
                              Acesso ao Local:
                            </span>
                            <span className="font-semibold text-slate-800">
                              {specs.workAreaDifficulty}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="text-[10px] text-teal-900/80 bg-teal-100/50 p-2 rounded border border-teal-200 flex items-center gap-1.5">
                        <ShieldCheck className="h-3.5 w-3.5 text-teal-700 shrink-0" />
                        <span>
                          <strong>Nota de Assistência Técnica:</strong> A Intertermal atua como
                          prestadora autorizada de serviços especializados de manutenção, instalação
                          e start-up. A aquisição de novos equipamentos BERMO é realizada
                          diretamente pelo fabricante.
                        </span>
                      </div>
                    </>
                  )
                })()}
              </div>
            </section>

            {/* 5. RESUMO FINANCEIRO TOTAL E CONDIÇÕES */}
            <section className="grid grid-cols-1 sm:grid-cols-12 gap-6 pt-2">
              <div className="sm:col-span-7 space-y-3">
                <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-2">
                  <div className="text-[10px] font-bold text-slate-800 uppercase tracking-wider">
                    Condições Comerciais & Pagamento
                  </div>
                  <div className="text-xs text-slate-700 space-y-1">
                    <div>
                      • Condição de Pagamento: <strong>{paymentCondition}</strong>
                    </div>
                    <div>
                      • Prazo de Validade da Proposta: <strong>{validityDays} dias úteis</strong> a
                      contar da emissão.
                    </div>
                    <div>
                      • Faturamento: Direto pela Intertermal Serviços de Engenharia Térmica.
                    </div>
                    <div>
                      • Garantia dos Serviços Prestados: <strong>90 (noventa) dias</strong> contra
                      defeitos de execução.
                    </div>
                  </div>
                </div>

                {quote.notes && (
                  <div className="text-[11px] text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <span className="font-semibold block text-slate-800 mb-0.5">
                      Observações Gerais:
                    </span>
                    {quote.notes}
                  </div>
                )}
              </div>

              <div className="sm:col-span-5 flex flex-col justify-between">
                <div className="bg-teal-900 text-white p-5 rounded-xl space-y-3 shadow-md">
                  <div className="text-[11px] text-teal-200 uppercase font-semibold tracking-wider">
                    Resumo do Investimento
                  </div>
                  <div>
                    <span className="text-[10px] text-teal-300 block">Valor Total do Serviço:</span>
                    <span className="text-2xl font-black text-white tracking-tight">
                      {totalValue.toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      })}
                    </span>
                  </div>
                  <div className="text-[10px] text-teal-200/80 pt-2 border-t border-teal-800/80 leading-relaxed">
                    Valor total líquido referente à prestação dos serviços técnicos descritos, mão
                    de obra especializada e logística.
                  </div>
                </div>
              </div>
            </section>

            {/* 6. ASSINATURAS E RODAPÉ */}
            <footer className="pt-8 border-t border-slate-200 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 text-center">
                <div className="space-y-1 pt-6 border-t border-slate-300">
                  <div className="font-bold text-slate-900">INTERTERMAL ENGENHARIA TÉRMICA</div>
                  <div className="text-[10px] text-slate-500">
                    {quote.assigned_to || 'Alex Nogueia — Responsável Técnico'}
                  </div>
                </div>

                <div className="space-y-1 pt-6 border-t border-slate-300">
                  <div className="font-bold text-slate-900">
                    {client?.company_name ||
                      client?.name ||
                      quote.client_name ||
                      'DE ACORDO DO CLIENTE'}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Nome / Assinatura / Data de Aprovação
                  </div>
                </div>
              </div>

              {/* Rodapé institucional com dados da Intertermal */}
              <div className="text-center text-[10px] text-slate-400 pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2">
                <div>
                  <strong>Intertermal Engenharia & Assistência Técnica BERMO</strong> • CNPJ:
                  12.345.678/0001-90
                </div>
                <div>Rua Bernardo Reiter, 500 — Blumenau / SC • contato@intertermal.com.br</div>
              </div>
            </footer>
          </div>
        </div>

        {/* Footer do Modal */}
        <DialogFooter className="bg-slate-950 px-6 py-3 border-t border-slate-800 shrink-0 flex items-center justify-between">
          <div className="text-xs text-slate-400">
            Documento formatado conforme padrões de engenharia Intertermal / BERMO.
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="bg-slate-800 hover:bg-slate-700 border-slate-700 text-white text-xs h-8"
            >
              Fechar
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handlePrint}
              className="bg-teal-700 hover:bg-teal-600 text-white text-xs h-8"
            >
              <Printer className="h-3.5 w-3.5 mr-1.5" />
              Imprimir / Salvar PDF
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
