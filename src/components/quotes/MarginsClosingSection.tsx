import { MarginsSlidersPanel } from './MarginsSlidersPanel'
import { PriceFormationPanel } from './PriceFormationPanel'
import { TaxesPanel } from './TaxesPanel'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { QuoteStatus } from '@/types/crm'
import type { Dispatch, SetStateAction } from 'react'

interface MarginsClosingSectionProps {
  salesCommissionAmount: number
  adminAmount: number
  adminRate: number
  divisor: number
  setPaymentTerms: Dispatch<SetStateAction<string>>
  setSalesCommission: Dispatch<SetStateAction<number>>
  irpjRate: number
  issRate: number
  serviceMarginAmount: number
  setCofinsRate: Dispatch<SetStateAction<number>>
  setStatus: Dispatch<SetStateAction<QuoteStatus>>
  totalTaxesPercent: number
  setServiceMargin: Dispatch<SetStateAction<number>>
  materialsCost: number
  materialsItemsTotal: number
  materialsPassThrough: number
  serviceMargin: number
  serviceDirectCostsTotal: number
  setIrDiffRate: Dispatch<SetStateAction<number>>
  serviceSalePrice: number
  chemicalProductsTotal: number
  setAdminRate: Dispatch<SetStateAction<number>>
  setPisRate: Dispatch<SetStateAction<number>>
  csllRate: number
  pisRate: number
  paymentTerms: string
  setIssRate: Dispatch<SetStateAction<number>>
  taxesAmount: number
  cofinsRate: number
  status: QuoteStatus
  irDiffRate: number
  setIrpjRate: Dispatch<SetStateAction<number>>
  setValidityDays: Dispatch<SetStateAction<number>>
  validityDays: number
  salesCommission: number
  setCsllRate: Dispatch<SetStateAction<number>>
  directCostsTotal: number
  calculatedSalePrice: number
}

export function MarginsClosingSection(props: MarginsClosingSectionProps) {
  return (
    <>
      {/* SEÇÃO 3E: Margens & Fechamento */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-xs">
        <CardHeader className="p-4 pb-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span className="flex items-center justify-center w-7 h-5 rounded bg-teal-600 text-white text-[11px] font-bold">
                3E
              </span>
              3E Margens & Fechamento
            </CardTitle>
            <span className="text-xs font-mono font-extrabold text-teal-800 dark:text-teal-300">
              Total:{' '}
              {calculatedSalePrice.toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              })}
            </span>
          </div>
        </CardHeader>
        <CardContent className="p-4 space-y-4">
          <MarginsSlidersPanel {...props} />
          <TaxesPanel {...props} />
          <PriceFormationPanel {...props} />
          {/* Bloco 4: Condições de Pagamento e Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Condições de Pagamento</Label>
              <Input
                value={paymentTerms}
                onChange={(e) => setPaymentTerms(e.target.value)}
                placeholder="Ex: 28 DDL faturado após entrega técnica"
                className="text-xs h-8"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Status Inicial</Label>
              <Select value={status} onValueChange={(val) => setStatus(val as QuoteStatus)}>
                <SelectTrigger className="text-xs h-8">
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Rascunho</SelectItem>
                  <SelectItem value="sent">Enviada ao Cliente</SelectItem>
                  <SelectItem value="approved">Aprovada</SelectItem>
                  <SelectItem value="rejected">Rejeitada</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  )
}
