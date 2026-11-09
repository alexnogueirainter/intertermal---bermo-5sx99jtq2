import { getStatusBadge } from './QuoteStatusBadge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { QuoteEquipmentItem, QuoteRecord, QuoteStatus } from '@/types/crm'
import {
  Archive,
  ArchiveRestore,
  Ban,
  CheckCircle,
  Clock,
  ExternalLink,
  FileText,
  FolderOpen,
  MoreVertical,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Trash2,
} from 'lucide-react'
import type { Dispatch, SetStateAction } from 'react'

interface QuotesListCardProps {
  quotes: QuoteRecord[]
  searchTerm: string
  setSearchTerm: Dispatch<SetStateAction<string>>
  statusFilter: string
  setStatusFilter: Dispatch<SetStateAction<string>>
  status: QuoteStatus
  equipments: QuoteEquipmentItem[]
  filteredQuotes: QuoteRecord[]
  handleOpenCreateModal: () => any
  handleOpenEditModal: (quote: QuoteRecord) => any
  handleSetStatus: (quoteId: string, newStatus: QuoteStatus) => any
  handleOpenPdfPreview: (quoteObj: QuoteRecord, mode: 'client' | 'internal') => any
  handleDelete: (quote: QuoteRecord) => any
  archivedQuotes?: QuoteRecord[]
  onArchiveQuote?: (quote: QuoteRecord) => void
  onRestoreQuote?: (quote: QuoteRecord) => void
  isAdmin?: boolean
}

export function QuotesListCard(props: QuotesListCardProps) {
  const {
    quotes,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    status,
    equipments,
    filteredQuotes,
    handleOpenCreateModal,
    handleOpenEditModal,
    handleSetStatus,
    handleOpenPdfPreview,
    handleDelete,
    archivedQuotes = [],
    onArchiveQuote,
    onRestoreQuote,
    isAdmin = false,
  } = props

  return (
    <>
      {/* 3. Filtros e Pesquisa da Lista de Propostas */}
      <Card className="border-slate-200 dark:border-slate-800">
        <CardHeader className="p-4 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="h-4 w-4 absolute left-3 top-2.5 text-muted-foreground" />
              <Input
                placeholder="Buscar por cliente, número, modelo ou título..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="text-xs h-9 pl-9"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="text-xs h-9 w-44">
                  <SelectValue placeholder="Filtrar por Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Status ({quotes.length})</SelectItem>
                  <SelectItem value="draft">
                    Rascunho ({quotes.filter((q) => q.status === 'draft').length})
                  </SelectItem>
                  <SelectItem value="sent">
                    Enviada ({quotes.filter((q) => q.status === 'sent').length})
                  </SelectItem>
                  <SelectItem value="negotiation">
                    Em negociação ({quotes.filter((q) => q.status === 'negotiation').length})
                  </SelectItem>
                  <SelectItem value="approved">
                    Aprovada ({quotes.filter((q) => q.status === 'approved').length})
                  </SelectItem>
                  <SelectItem value="rejected">
                    Recusada ({quotes.filter((q) => q.status === 'rejected').length})
                  </SelectItem>
                  <SelectItem value="expired">
                    Expirada ({quotes.filter((q) => q.status === 'expired').length})
                  </SelectItem>
                </SelectContent>
              </Select>

              {searchTerm && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSearchTerm('')}
                  className="text-xs h-9 text-muted-foreground hover:text-slate-900"
                >
                  Limpar busca
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        {/* 4. Tabela / Lista de Propostas em Coluna Única com Ações Diretas */}
        <CardContent className="p-0">
          {filteredQuotes.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <FolderOpen className="h-10 w-10 text-muted-foreground/50 mx-auto" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Nenhuma proposta encontrada
              </p>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                {searchTerm || statusFilter !== 'all'
                  ? 'Tente ajustar os filtros ou o termo de busca.'
                  : 'Crie sua primeira proposta técnica e comercial clicando no botão acima.'}
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleOpenCreateModal}
                className="text-xs mt-2 border-teal-300 text-teal-700 hover:bg-teal-50"
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                Criar Nova Proposta
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    <th className="py-3 px-4">Proposta</th>
                    <th className="py-3 px-4">Cliente</th>
                    <th className="py-3 px-4">Equipamento / Modelo</th>
                    <th className="py-3 px-4">Responsável</th>
                    <th className="py-3 px-4 text-right">Valor Total</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredQuotes.map((quote) => {
                    const price = quote.total || quote.final_price || 0
                    return (
                      <tr
                        key={quote.id}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-900/60 transition-colors"
                      >
                        {/* Identificação / Número */}
                        <td className="py-3 px-4 font-mono font-bold text-teal-700 dark:text-teal-400 whitespace-nowrap">
                          <div>
                            <span className="font-semibold">{quote.quote_number || 'INT-S/N'}</span>
                            {quote.created && (
                              <span className="block text-[10px] text-muted-foreground font-normal font-sans">
                                {new Date(quote.created).toLocaleDateString('pt-BR')}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Cliente & Oportunidade */}
                        <td className="py-3 px-4 font-medium text-slate-900 dark:text-slate-100">
                          <div
                            className="max-w-[200px] truncate"
                            title={quote.client_name || 'Cliente Sem Nome'}
                          >
                            <span className="font-semibold block">
                              {quote.client_name || 'Cliente Sem Nome'}
                            </span>
                            {quote.deal_title && (
                              <span className="text-[10px] text-teal-600 truncate block">
                                Funil: {quote.deal_title}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Equipamento */}
                        <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                          <div className="max-w-[240px] truncate">
                            {quote.equipments &&
                            Array.isArray(quote.equipments) &&
                            quote.equipments.length > 1 ? (
                              <>
                                <span className="font-medium block truncate">
                                  {quote.equipments
                                    .map((e) => `${e.model || 'Item'} (${e.quantity || 1})`)
                                    .join(' + ')}
                                </span>
                                <span className="text-[10px] text-teal-600 dark:text-teal-400 truncate block font-medium">
                                  {quote.equipments.reduce(
                                    (sum, e) => sum + (Number(e.quantity) || 1),
                                    0,
                                  )}{' '}
                                  unidades em {quote.equipments.length} modelos
                                </span>
                              </>
                            ) : (
                              <>
                                <span className="font-medium block truncate">
                                  {quote.equipment_model
                                    ? `${quote.equipment_brand || 'BERMO'} ${quote.equipment_model}${quote.equipment_quantity && quote.equipment_quantity > 1 ? ` (${quote.equipment_quantity} peças)` : ''}`
                                    : quote.title || 'Manutenção Geral'}
                                </span>
                                <span className="text-[10px] text-muted-foreground truncate block">
                                  {quote.plate_count ? `${quote.plate_count} placas` : ''}{' '}
                                  {quote.gasket_material ? `• ${quote.gasket_material}` : ''}
                                </span>
                              </>
                            )}
                          </div>
                        </td>

                        {/* Responsável */}
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                          {quote.assigned_to || 'Alex Nogueira'}
                        </td>

                        {/* Valor Total */}
                        <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-slate-100 text-right whitespace-nowrap">
                          {price.toLocaleString('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          })}
                        </td>

                        {/* Status */}
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          {getStatusBadge(quote.status || 'draft')}
                        </td>

                        {/* Ações Diretas por Proposta */}
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1">
                            {/* Editar */}
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-8 px-2.5 text-xs font-semibold text-slate-800 dark:text-slate-100 border-slate-300 dark:border-slate-700 hover:bg-teal-50 dark:hover:bg-teal-950/40 hover:text-teal-700 dark:hover:text-teal-300"
                              onClick={() => handleOpenEditModal(quote)}
                              title="Editar Proposta"
                            >
                              <Pencil className="h-3.5 w-3.5 mr-1.5 text-teal-600 dark:text-teal-400" />
                              Editar
                            </Button>

                            {/* Visualizar PDF - Visão Cliente */}
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-8 px-2.5 text-xs text-teal-700 dark:text-teal-400 border-teal-300 hover:bg-teal-50"
                              onClick={() => handleOpenPdfPreview(quote, 'client')}
                              title="Visualizar Proposta em PDF (Visão Cliente)"
                            >
                              <FileText className="h-3.5 w-3.5 mr-1 text-teal-600" />
                              PDF
                            </Button>

                            {/* Menu de Ações Secundárias */}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-slate-500 hover:text-slate-900"
                                >
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-52">
                                <DropdownMenuLabel className="text-xs">
                                  Opções da Proposta
                                </DropdownMenuLabel>
                                <DropdownMenuItem onClick={() => handleOpenEditModal(quote)}>
                                  <Pencil className="h-3.5 w-3.5 mr-2" />
                                  Editar Parâmetros & Custos
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleOpenPdfPreview(quote, 'client')}
                                >
                                  <FileText className="h-3.5 w-3.5 mr-2 text-teal-600" />
                                  Visualizar PDF (Visão Cliente)
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleOpenPdfPreview(quote, 'internal')}
                                >
                                  <SlidersHorizontal className="h-3.5 w-3.5 mr-2 text-amber-600" />
                                  Memória de Cálculo (Visão Interna)
                                </DropdownMenuItem>

                                {(quote.approval_token || quote.id) && (
                                  <DropdownMenuItem
                                    onClick={() => {
                                      const token = quote.approval_token || quote.id
                                      window.open(
                                        `/proposta/${token}`,
                                        '_blank',
                                        'noopener,noreferrer',
                                      )
                                    }}
                                  >
                                    <ExternalLink className="h-3.5 w-3.5 mr-2 text-blue-600" />
                                    Abrir Link de Aceite do Cliente
                                  </DropdownMenuItem>
                                )}

                                <DropdownMenuSeparator />

                                {quote.status !== 'approved' && (
                                  <DropdownMenuItem
                                    onClick={() => handleSetStatus(quote.id, 'approved')}
                                    className="text-emerald-700 dark:text-emerald-400 font-semibold"
                                  >
                                    <CheckCircle className="h-3.5 w-3.5 mr-2 text-emerald-600" />
                                    Aprovar Proposta & Gerar OS
                                  </DropdownMenuItem>
                                )}

                                {quote.status !== 'rejected' && (
                                  <DropdownMenuItem
                                    onClick={() => handleSetStatus(quote.id, 'rejected')}
                                    className="text-rose-700 dark:text-rose-400"
                                  >
                                    <Ban className="h-3.5 w-3.5 mr-2 text-rose-600" />
                                    Marcar como Recusada
                                  </DropdownMenuItem>
                                )}

                                {quote.status !== 'negotiation' && (
                                  <DropdownMenuItem
                                    onClick={() => handleSetStatus(quote.id, 'negotiation')}
                                    className="text-amber-700 dark:text-amber-400"
                                  >
                                    <Clock className="h-3.5 w-3.5 mr-2 text-amber-600" />
                                    Marcar como Em negociação
                                  </DropdownMenuItem>
                                )}

                                {quote.status !== 'expired' && (
                                  <DropdownMenuItem
                                    onClick={() => handleSetStatus(quote.id, 'expired')}
                                    className="text-slate-700 dark:text-slate-400"
                                  >
                                    <Clock className="h-3.5 w-3.5 mr-2 text-slate-500" />
                                    Marcar como Expirada
                                  </DropdownMenuItem>
                                )}

                                {quote.status !== 'draft' && (
                                  <DropdownMenuItem
                                    onClick={() => handleSetStatus(quote.id, 'draft')}
                                  >
                                    <RotateCcw className="h-3.5 w-3.5 mr-2 text-slate-500" />
                                    Voltar para Rascunho
                                  </DropdownMenuItem>
                                )}

                                <DropdownMenuSeparator />

                                {isAdmin && onArchiveQuote && (
                                  <DropdownMenuItem onClick={() => onArchiveQuote(quote)}>
                                    <Archive className="h-3.5 w-3.5 mr-2 text-slate-500" />
                                    Arquivar Proposta
                                  </DropdownMenuItem>
                                )}

                                <DropdownMenuItem
                                  onClick={() => handleDelete(quote)}
                                  className="text-rose-600 focus:text-rose-600 font-semibold"
                                >
                                  <Trash2 className="h-3.5 w-3.5 mr-2" />
                                  Excluir Proposta
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Propostas Arquivadas — fora das listas e dos totais, restauráveis */}
          {archivedQuotes.length > 0 && (
            <div className="border-t border-slate-200 dark:border-slate-800">
              <div className="px-4 py-3 flex items-center gap-2 bg-slate-50/70 dark:bg-slate-900/50">
                <Archive className="h-4 w-4 text-slate-400" />
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Arquivadas
                </span>
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                  {archivedQuotes.length}
                </span>
                <span className="text-[11px] text-muted-foreground ml-1">
                  Fora das listas e dos totais. Restaure para devolver à gestão.
                </span>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {archivedQuotes.map((quote) => (
                  <div
                    key={quote.id}
                    className="flex items-center justify-between gap-3 px-4 py-2.5 bg-slate-50/40 dark:bg-slate-900/20"
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate">
                        {quote.quote_number || quote.code || quote.id} ·{' '}
                        {quote.client_name || 'Sem cliente'}
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        {(quote.total || quote.final_price || 0).toLocaleString('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        })}
                        {quote.archived_at
                          ? ` · arquivada em ${new Date(quote.archived_at).toLocaleDateString('pt-BR')}`
                          : ''}
                      </div>
                    </div>
                    {isAdmin && onRestoreQuote && (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-7 px-2 text-[11px] shrink-0"
                        onClick={() => onRestoreQuote(quote)}
                      >
                        <ArchiveRestore className="h-3 w-3 mr-1" /> Restaurar
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  )
}
