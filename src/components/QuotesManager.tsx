import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  FileSpreadsheet,
  Plus,
  Send,
  CheckCircle2,
  Clock,
  Printer,
  Copy,
  Building2,
  Trash2,
  Package,
  Layers,
  Sparkles,
  Download,
} from 'lucide-react'
import type { QuoteRecord, QuoteStatus, ClientRecord, ProductRecord, QuoteItem } from '@/types/crm'

interface QuotesManagerProps {
  quotes: QuoteRecord[]
  clients: ClientRecord[]
  products: ProductRecord[]
  selectedQuote?: QuoteRecord | null
  onSelectQuote: (quote: QuoteRecord | null) => void
  onCreateQuote: (data: Partial<QuoteRecord>) => void
  onUpdateQuoteStatus: (id: string, status: QuoteStatus) => void
}

const TEMPLATE_PRESETS = [
  {
    id: 'tpl-saas-enterprise',
    name: 'Modelo 1: Proposta Enterprise SaaS (Software + Implantação)',
    description:
      'Indicado para clientes de médio/grande porte com licenças anuais e onboarding consultivo.',
    defaultItems: [
      {
        name: 'Software CRM Enterprise (5 Licenças)',
        quantity: 2,
        unit_price: 4800,
        discount: 600,
        total: 9000,
      },
      {
        name: 'Implantação & Onboarding Completo',
        quantity: 1,
        unit_price: 3500,
        discount: 0,
        total: 3500,
      },
      {
        name: 'Suporte Premium 24/7 & SLA 1h',
        quantity: 1,
        unit_price: 1200,
        discount: 200,
        total: 1000,
      },
    ],
    terms: 'Entrada 40% + 3x de 20% no boleto bancário sem juros',
  },
  {
    id: 'tpl-omnichannel',
    name: 'Modelo 2: Proposta Omnichannel WhatsApp & Atendimento',
    description:
      'Focado em clínicas, varejo e serviços que necessitam de atendimento multi-atendente.',
    defaultItems: [
      {
        name: 'Módulo Omnichannel WhatsApp',
        quantity: 1,
        unit_price: 1800,
        discount: 0,
        total: 1800,
      },
      { name: 'Terminal VoIP Integrado', quantity: 4, unit_price: 950, discount: 300, total: 3500 },
      {
        name: 'Consultoria Comercial Estratégica',
        quantity: 1,
        unit_price: 6200,
        discount: 1000,
        total: 5200,
      },
    ],
    terms: 'Entrada 30% + 4x via cartão corporativo ou boleto',
  },
  {
    id: 'tpl-consultoria',
    name: 'Modelo 3: Diagnóstico & Consultoria Comercial',
    description: 'Proposta rápida de serviços pontuais para alinhamento e auditoria de vendas.',
    defaultItems: [
      {
        name: 'Consultoria Comercial Estratégica',
        quantity: 1,
        unit_price: 6200,
        discount: 700,
        total: 5500,
      },
      {
        name: 'Implantação & Onboarding Completo',
        quantity: 1,
        unit_price: 3500,
        discount: 500,
        total: 3000,
      },
    ],
    terms: '50% no aceite da proposta + 50% na entrega final do relatório',
  },
]

export const QuotesManager: React.FC<QuotesManagerProps> = ({
  quotes,
  clients,
  products,
  selectedQuote,
  onSelectQuote,
  onCreateQuote,
  onUpdateQuoteStatus,
}) => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')

  // Form states
  const [quoteNumber, setQuoteNumber] = useState(`ORC-2025-00${quotes.length + 1}`)
  const [clientId, setClientId] = useState('')
  const [paymentTerms, setPaymentTerms] = useState('')
  const [validUntil, setValidUntil] = useState('')
  const [notes, setNotes] = useState('')
  const [items, setItems] = useState<QuoteItem[]>([
    { name: 'Software CRM Enterprise', quantity: 1, unit_price: 4800, discount: 0, total: 4800 },
  ])

  const handleApplyTemplate = (templateId: string) => {
    const tpl = TEMPLATE_PRESETS.find((t) => t.id === templateId)
    if (tpl) {
      setItems(tpl.defaultItems)
      setPaymentTerms(tpl.terms)
      setNotes(`Baseado no ${tpl.name}. Validade padrão de 15 dias corridos.`)
    }
  }

  const handleAddItem = (productId?: string) => {
    if (productId) {
      const prd = products.find((p) => p.id === productId)
      if (prd) {
        setItems([
          ...items,
          {
            product_id: prd.id,
            name: prd.name,
            quantity: 1,
            unit_price: prd.price || 0,
            discount: 0,
            total: prd.price || 0,
          },
        ])
        return
      }
    }
    setItems([
      ...items,
      { name: 'Item Personalizado', quantity: 1, unit_price: 1000, discount: 0, total: 1000 },
    ])
  }

  const handleUpdateItem = (index: number, field: keyof QuoteItem, value: any) => {
    const updated = [...items]
    const item = { ...updated[index], [field]: value }

    const qty = Number(item.quantity) || 1
    const price = Number(item.unit_price) || 0
    const disc = Number(item.discount) || 0
    item.total = Math.max(0, qty * price - disc)

    updated[index] = item
    setItems(updated)
  }

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const subtotal = items.reduce(
    (acc, it) => acc + (Number(it.quantity) || 1) * (Number(it.unit_price) || 0),
    0,
  )
  const discountTotal = items.reduce((acc, it) => acc + (Number(it.discount) || 0), 0)
  const total = Math.max(0, subtotal - discountTotal)

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    const client = clients.find((c) => c.id === clientId)

    onCreateQuote({
      quote_number: quoteNumber || `ORC-2025-${Math.floor(100 + Math.random() * 900)}`,
      client_id: clientId || undefined,
      client_name: client ? client.name : undefined,
      status: 'draft',
      items,
      subtotal,
      discount_total: discountTotal,
      total,
      payment_terms: paymentTerms,
      valid_until: validUntil || undefined,
      notes,
      assigned_to: 'Alexandre Nogueira',
    })

    setIsCreateModalOpen(false)
  }

  const currentViewQuote = selectedQuote || (quotes.length > 0 ? quotes[0] : null)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <FileSpreadsheet className="h-6 w-6 text-indigo-600" />
            Modelos de Orçamento & Propostas Comerciais
          </h2>
          <p className="text-xs md:text-sm text-muted-foreground mt-0.5">
            Gerador de propostas padronizadas, cálculo de itens, condições de pagamento e
            exportação.
          </p>
        </div>
        <Button
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-500 shadow-sm"
        >
          <Plus className="h-4 w-4 mr-1.5" />
          Gerar Novo Orçamento
        </Button>
      </div>

      {/* Modelos Prontos (Presets) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        {TEMPLATE_PRESETS.map((tpl) => (
          <Card
            key={tpl.id}
            className="p-3.5 border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-600 transition-all bg-gradient-to-b from-white to-slate-50/50 dark:from-slate-900 dark:to-slate-950 flex flex-col justify-between"
          >
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-indigo-600" />
                <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100">{tpl.name}</h3>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">{tpl.description}</p>
            </div>
            <div className="pt-3 mt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="text-[10px] font-semibold text-slate-500">
                {tpl.defaultItems.length} itens pré-configurados
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  handleApplyTemplate(tpl.id)
                  setIsCreateModalOpen(true)
                }}
                className="text-[11px] h-7 text-indigo-600 border-indigo-200 hover:bg-indigo-50 dark:hover:bg-indigo-950"
              >
                Usar Este Modelo
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Grid: Lista de Orçamentos + Visualizador do Modelo Selecionado */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Lista Lateral de Orçamentos */}
        <div className="lg:col-span-4 space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-1">
            Propostas Emitidas ({quotes.length})
          </div>
          {quotes.map((q) => {
            const isSelected = currentViewQuote?.id === q.id
            return (
              <Card
                key={q.id}
                onClick={() => onSelectQuote(q)}
                className={`p-3.5 cursor-pointer transition-all border ${
                  isSelected
                    ? 'border-indigo-600 ring-2 ring-indigo-500/20 bg-indigo-50/20 dark:bg-indigo-950/20'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between gap-1">
                  <div className="space-y-0.5">
                    <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400">
                      {q.quote_number}
                    </span>
                    <div className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                      {q.client_name || 'Cliente'}
                    </div>
                  </div>
                  <Badge
                    variant={
                      q.status === 'approved'
                        ? 'default'
                        : q.status === 'sent'
                          ? 'secondary'
                          : 'outline'
                    }
                    className="text-[10px] capitalize"
                  >
                    {q.status === 'approved'
                      ? 'Aprovado'
                      : q.status === 'sent'
                        ? 'Enviado'
                        : q.status === 'draft'
                          ? 'Rascunho'
                          : q.status}
                  </Badge>
                </div>

                <div className="flex items-center justify-between pt-2 mt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                  <span className="font-bold text-slate-900 dark:text-slate-100">
                    {(q.total || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    {q.items?.length || 0} itens
                  </span>
                </div>
              </Card>
            )
          })}
        </div>

        {/* Visualizador de Folha de Proposta Comercial / Layout Formal */}
        <div className="lg:col-span-8">
          {currentViewQuote ? (
            <Card className="border-slate-300 dark:border-slate-700 shadow-md bg-white dark:bg-slate-950 overflow-hidden">
              {/* Header do Documento de Proposta */}
              <div className="bg-gradient-to-r from-slate-900 to-indigo-950 p-6 text-white flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div className="space-y-1">
                  <div className="text-xs font-mono tracking-widest text-indigo-300 uppercase">
                    PROPOSTA COMERCIAL & ORÇAMENTO
                  </div>
                  <h3 className="text-xl font-extrabold">{currentViewQuote.quote_number}</h3>
                  <p className="text-xs text-slate-300">
                    Emitido por:{' '}
                    {currentViewQuote.assigned_to || 'Alexandre Nogueira - Diretor Comercial'}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Select
                    value={currentViewQuote.status}
                    onValueChange={(val) =>
                      onUpdateQuoteStatus(currentViewQuote.id, val as QuoteStatus)
                    }
                  >
                    <SelectTrigger className="h-8 text-xs bg-slate-800 border-slate-700 text-white w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Rascunho</SelectItem>
                      <SelectItem value="sent">Enviado</SelectItem>
                      <SelectItem value="approved">Aprovado</SelectItem>
                      <SelectItem value="rejected">Recusado</SelectItem>
                      <SelectItem value="expired">Expirado</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.print()}
                    className="h-8 text-xs bg-slate-800/80 hover:bg-slate-700 border-slate-700 text-white"
                  >
                    <Printer className="h-3.5 w-3.5 mr-1" /> Imprimir / PDF
                  </Button>
                </div>
              </div>

              {/* Corpo da Proposta */}
              <CardContent className="p-6 space-y-6">
                {/* Dados do Cliente e Condições */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                  <div className="space-y-1">
                    <span className="text-muted-foreground uppercase text-[10px] font-bold tracking-wider block">
                      Destinatário / Empresa
                    </span>
                    <div className="font-bold text-sm text-slate-900 dark:text-slate-100">
                      {currentViewQuote.client_name || 'Cliente Corporativo'}
                    </div>
                    <div className="text-muted-foreground">
                      Validade:{' '}
                      {currentViewQuote.valid_until
                        ? new Date(currentViewQuote.valid_until).toLocaleDateString('pt-BR')
                        : '15 dias corridos'}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-muted-foreground uppercase text-[10px] font-bold tracking-wider block">
                      Condição de Faturamento & Pagamento
                    </span>
                    <div className="font-medium text-slate-800 dark:text-slate-200">
                      {currentViewQuote.payment_terms || 'À combinar com o departamento financeiro'}
                    </div>
                  </div>
                </div>

                {/* Tabela de Itens */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Composição dos Itens & Licenças
                  </h4>
                  <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 uppercase text-[10px] font-semibold">
                        <tr>
                          <th className="p-2.5">Descrição do Produto / Serviço</th>
                          <th className="p-2.5 text-center">Qtd</th>
                          <th className="p-2.5 text-right">Valor Unitário</th>
                          <th className="p-2.5 text-right">Desconto</th>
                          <th className="p-2.5 text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {currentViewQuote.items && currentViewQuote.items.length > 0 ? (
                          currentViewQuote.items.map((item, idx) => (
                            <tr
                              key={idx}
                              className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50"
                            >
                              <td className="p-2.5 font-medium text-slate-900 dark:text-slate-100">
                                {item.name}
                              </td>
                              <td className="p-2.5 text-center">{item.quantity}</td>
                              <td className="p-2.5 text-right">
                                {(item.unit_price || 0).toLocaleString('pt-BR', {
                                  style: 'currency',
                                  currency: 'BRL',
                                })}
                              </td>
                              <td className="p-2.5 text-right text-emerald-600">
                                {item.discount
                                  ? `-${item.discount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`
                                  : '-'}
                              </td>
                              <td className="p-2.5 text-right font-bold text-slate-900 dark:text-slate-100">
                                {(item.total || 0).toLocaleString('pt-BR', {
                                  style: 'currency',
                                  currency: 'BRL',
                                })}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={5} className="p-4 text-center text-muted-foreground">
                              Nenhum item adicionado à proposta.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Resumo de Totais */}
                <div className="flex justify-end pt-2">
                  <div className="w-64 space-y-2 text-xs">
                    <div className="flex justify-between text-muted-foreground">
                      <span>Subtotal Bruto:</span>
                      <span>
                        {(currentViewQuote.subtotal || currentViewQuote.total || 0).toLocaleString(
                          'pt-BR',
                          { style: 'currency', currency: 'BRL' },
                        )}
                      </span>
                    </div>
                    {currentViewQuote.discount_total ? (
                      <div className="flex justify-between text-emerald-600 font-medium">
                        <span>Desconto Concedido:</span>
                        <span>
                          -
                          {(currentViewQuote.discount_total || 0).toLocaleString('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          })}
                        </span>
                      </div>
                    ) : null}
                    <div className="flex justify-between text-base font-extrabold text-slate-900 dark:text-slate-100 pt-2 border-t border-slate-200 dark:border-slate-800">
                      <span>Total Geral:</span>
                      <span className="text-indigo-600 dark:text-indigo-400">
                        {(currentViewQuote.total || 0).toLocaleString('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Termos & Notas Legais */}
                {currentViewQuote.notes && (
                  <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300">
                    <span className="font-bold block text-slate-900 dark:text-slate-100 mb-1">
                      Observações & Condições Gerais:
                    </span>
                    {currentViewQuote.notes}
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="p-12 text-center text-muted-foreground">
              <FileSpreadsheet className="h-10 w-10 mx-auto text-slate-400 mb-2" />
              <p className="text-sm font-semibold">Nenhum modelo de proposta selecionado</p>
              <p className="text-xs">Selecione uma proposta na lista ou crie uma nova.</p>
            </Card>
          )}
        </div>
      </div>

      {/* Modal Criar Orçamento */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">
              Criar Proposta / Orçamento Comercial
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreate} className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-medium">Número do Orçamento</Label>
                <Input
                  value={quoteNumber}
                  onChange={(e) => setQuoteNumber(e.target.value)}
                  className="text-xs font-mono"
                  required
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-medium">Cliente Destinatário</Label>
                <Select value={clientId} onValueChange={setClientId}>
                  <SelectTrigger className="text-xs">
                    <SelectValue placeholder="Selecione o cliente..." />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((c) => (
                      <SelectItem key={c.id} value={c.id} className="text-xs">
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Modelos rápidos */}
            <div className="space-y-1">
              <Label className="text-xs font-medium">Carregar a partir de Modelo Padrão:</Label>
              <div className="flex flex-wrap gap-2">
                {TEMPLATE_PRESETS.map((t) => (
                  <Button
                    key={t.id}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleApplyTemplate(t.id)}
                    className="text-[11px] h-7"
                  >
                    <Sparkles className="h-3 w-3 mr-1 text-amber-500" />
                    {t.name.split(':')[0]}
                  </Button>
                ))}
              </div>
            </div>

            {/* Itens */}
            <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold uppercase tracking-wider">
                  Itens da Proposta
                </Label>
                <div className="flex gap-2">
                  <Select onValueChange={(val) => handleAddItem(val)}>
                    <SelectTrigger className="h-7 text-[11px] w-48">
                      <SelectValue placeholder="+ Adicionar do Catálogo" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((p) => (
                        <SelectItem key={p.id} value={p.id} className="text-xs">
                          {p.name} - R$ {p.price}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => handleAddItem()}
                    className="h-7 text-[11px]"
                  >
                    + Item Avulso
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                {items.map((item, idx) => (
                  <div
                    key={idx}
                    className="grid grid-cols-12 gap-2 items-center bg-slate-50 dark:bg-slate-900/40 p-2 rounded-lg border border-slate-200/60 dark:border-slate-800 text-xs"
                  >
                    <div className="col-span-5">
                      <Input
                        placeholder="Nome do Item"
                        value={item.name}
                        onChange={(e) => handleUpdateItem(idx, 'name', e.target.value)}
                        className="text-xs h-8"
                      />
                    </div>
                    <div className="col-span-2">
                      <Input
                        type="number"
                        min="1"
                        placeholder="Qtd"
                        value={item.quantity}
                        onChange={(e) => handleUpdateItem(idx, 'quantity', Number(e.target.value))}
                        className="text-xs h-8"
                      />
                    </div>
                    <div className="col-span-2">
                      <Input
                        type="number"
                        placeholder="Preço Unit"
                        value={item.unit_price}
                        onChange={(e) =>
                          handleUpdateItem(idx, 'unit_price', Number(e.target.value))
                        }
                        className="text-xs h-8"
                      />
                    </div>
                    <div className="col-span-2">
                      <Input
                        type="number"
                        placeholder="Desc."
                        value={item.discount}
                        onChange={(e) => handleUpdateItem(idx, 'discount', Number(e.target.value))}
                        className="text-xs h-8"
                      />
                    </div>
                    <div className="col-span-1 text-center">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveItem(idx)}
                        className="h-8 w-8 p-0 text-rose-500 hover:text-rose-600"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Totalizador */}
              <div className="text-right text-xs pt-1 font-semibold text-slate-900 dark:text-slate-100">
                Total da Proposta:{' '}
                <span className="text-indigo-600 text-sm font-bold">
                  {total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-medium">Condições de Pagamento & Faturamento</Label>
              <Input
                placeholder="Ex: Entrada 30% + 3x de 20% no boleto faturado"
                value={paymentTerms}
                onChange={(e) => setPaymentTerms(e.target.value)}
                className="text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-medium">Observações & Prazos</Label>
              <Textarea
                rows={2}
                placeholder="Notas de homologação, regras de entrega, etc."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="text-xs"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsCreateModalOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" size="sm" className="bg-indigo-600 hover:bg-indigo-500">
                Criar Proposta
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
