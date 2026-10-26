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
import { ClientRecord, DealRecord } from '@/types/crm'
import { TrendingUp, UserPlus } from 'lucide-react'
import type { Dispatch, SetStateAction } from 'react'

interface ScopeClientDealFieldsProps {
  clients: ClientRecord[]
  deals: DealRecord[]
  setIsNewClientDialogOpen: Dispatch<SetStateAction<boolean>>
  setNewClientName: Dispatch<SetStateAction<string>>
  setNewClientDocument: Dispatch<SetStateAction<string>>
  setNewClientContact: Dispatch<SetStateAction<string>>
  setNewClientEmail: Dispatch<SetStateAction<string>>
  setNewClientPhone: Dispatch<SetStateAction<string>>
  setNewClientCity: Dispatch<SetStateAction<string>>
  setNewClientState: Dispatch<SetStateAction<string>>
  clientId: string
  setClientId: Dispatch<SetStateAction<string>>
  setClientName: Dispatch<SetStateAction<string>>
  quoteTitle: string
  setQuoteTitle: Dispatch<SetStateAction<string>>
  dealId: string
  setDealId: Dispatch<SetStateAction<string>>
  dealTitle: string
  setDealTitle: Dispatch<SetStateAction<string>>
  assignedTo: string
  setAssignedTo: Dispatch<SetStateAction<string>>
  setDestinationAddress: Dispatch<SetStateAction<string>>
}

export function ScopeClientDealFields(props: ScopeClientDealFieldsProps) {
  const {
    clients,
    deals,
    setIsNewClientDialogOpen,
    setNewClientName,
    setNewClientDocument,
    setNewClientContact,
    setNewClientEmail,
    setNewClientPhone,
    setNewClientCity,
    setNewClientState,
    clientId,
    setClientId,
    setClientName,
    quoteTitle,
    setQuoteTitle,
    dealId,
    setDealId,
    dealTitle,
    setDealTitle,
    assignedTo,
    setAssignedTo,
    setDestinationAddress,
  } = props

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-semibold">Cliente</Label>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setNewClientName('')
                setNewClientDocument('')
                setNewClientContact('')
                setNewClientEmail('')
                setNewClientPhone('')
                setNewClientCity('')
                setNewClientState('')
                setIsNewClientDialogOpen(true)
              }}
              className="h-6 px-1.5 text-[11px] font-semibold text-teal-700 hover:text-teal-800 hover:bg-teal-50 dark:text-teal-300 dark:hover:bg-teal-950/50 flex items-center gap-1"
              title="Inserir novo cliente manualmente"
            >
              <UserPlus className="h-3.5 w-3.5" />
              <span>Novo cliente</span>
            </Button>
          </div>
          <div className="flex items-center gap-1.5">
            <Select
              value={clientId}
              onValueChange={(val) => {
                setClientId(val)
                const found = clients.find((c) => c.id === val)
                if (found) {
                  setClientName(found.name || found.company_name || '')
                  if (found.address) setDestinationAddress(found.address)
                }
              }}
            >
              <SelectTrigger className="text-xs h-8 flex-1">
                <SelectValue placeholder="Selecione o cliente..." />
              </SelectTrigger>
              <SelectContent>
                {clients.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name || c.company_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setNewClientName('')
                setNewClientDocument('')
                setNewClientContact('')
                setNewClientEmail('')
                setNewClientPhone('')
                setNewClientCity('')
                setNewClientState('')
                setIsNewClientDialogOpen(true)
              }}
              className="h-8 px-2 text-teal-700 border-teal-300 hover:bg-teal-50 dark:border-teal-700 dark:text-teal-300 dark:hover:bg-teal-950/50 shrink-0"
              title="Cadastrar novo cliente manualmente"
            >
              <UserPlus className="h-3.5 w-3.5" />
              <span className="sr-only">Cadastrar novo cliente</span>
            </Button>
          </div>
        </div>

        <div className="space-y-1">
          <Label className="text-xs font-semibold">Título da Proposta</Label>
          <Input
            value={quoteTitle}
            onChange={(e) => setQuoteTitle(e.target.value)}
            placeholder="Ex: Manutenção Preventiva Trocador BP30"
            className="text-xs h-8"
          />
        </div>
      </div>

      {/* Vínculo com Oportunidade do Pipeline Comercial & Responsável */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
        <div className="space-y-1">
          <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <TrendingUp className="h-3.5 w-3.5 text-teal-600" />
            Vínculo Oportunidade (CRM)
          </Label>
          <Select
            value={dealId || 'none'}
            onValueChange={(val) => {
              if (val === 'none') {
                setDealId('')
                return
              }
              setDealId(val)
              const found = deals.find((d) => d.id === val)
              if (found) {
                setDealTitle(found.title)
                if (!clientId && found.client_id) {
                  setClientId(found.client_id)
                  setClientName(found.client_name || '')
                }
              }
            }}
          >
            <SelectTrigger className="text-xs h-8">
              <SelectValue placeholder="Selecione a oportunidade..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Nenhum negócio vinculado</SelectItem>
              {deals.map((d) => (
                <SelectItem key={d.id} value={d.id}>
                  {d.title} ({d.client_name || 'Sem cliente'} -{' '}
                  {(d.value || 0).toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  })}
                  )
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Título Oportunidade / Negócio (Livre)
          </Label>
          <Input
            value={dealTitle}
            onChange={(e) => setDealTitle(e.target.value)}
            placeholder="Ex: Reforma Trocador Placas Linha 2"
            className="text-xs h-8"
          />
        </div>

        <div className="space-y-1">
          <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Responsável Técnico
          </Label>
          <Input
            value={assignedTo}
            onChange={(e) => setAssignedTo(e.target.value)}
            placeholder="Ex: Alex Nogueira"
            className="text-xs h-8"
          />
        </div>
      </div>
    </>
  )
}
