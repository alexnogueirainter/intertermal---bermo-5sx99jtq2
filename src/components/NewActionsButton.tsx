import { useEffect } from 'react'
import { Bot, Building2, FileSpreadsheet, Plus, Smartphone, UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

/**
 * Botão único "+ Novo" no topo — substitui os botões de criação espalhados.
 * Opções: proposta, cliente, contato rápido, visita (regra do Alex, 09/11).
 * As telas continuam donas dos próprios fluxos: o botão navega até a tela e
 * dispara o evento "intertermal:new-action" que a tela escuta.
 */
export const NEW_ACTION_EVENT = 'intertermal:new-action'

export type NewActionKind = 'quote' | 'client' | 'quick_contact' | 'visit'

export function fireNewAction(kind: NewActionKind) {
  window.dispatchEvent(new CustomEvent(NEW_ACTION_EVENT, { detail: { kind } }))
}

/** Hook para uma tela reagir à ação "+ Novo" correspondente a ela. */
export function useNewAction(kind: NewActionKind, handler: () => void) {
  useEffect(() => {
    const h = (e: Event) => {
      const detail = (e as CustomEvent).detail || {}
      if (detail.kind === kind) handler()
    }
    window.addEventListener(NEW_ACTION_EVENT, h)
    return () => window.removeEventListener(NEW_ACTION_EVENT, h)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind, handler])
}

interface NewActionsButtonProps {
  onNewQuote: () => void
  onNewClient: () => void
  onQuickContact: () => void
  onNewVisit: () => void
}

export function NewActionsButton({
  onNewQuote,
  onNewClient,
  onQuickContact,
  onNewVisit,
}: NewActionsButtonProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          size="sm"
          className="bg-teal-700 hover:bg-teal-600 text-white text-xs h-8 font-semibold"
        >
          <Plus className="h-3.5 w-3.5 mr-1" />
          Novo
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground">
          Criar novo
        </DropdownMenuLabel>
        <DropdownMenuItem
          className="text-xs cursor-pointer"
          onClick={() => {
            onNewQuote()
            fireNewAction('quote')
          }}
        >
          <FileSpreadsheet className="h-3.5 w-3.5 mr-2 text-teal-600" />
          Proposta
        </DropdownMenuItem>
        <DropdownMenuItem
          className="text-xs cursor-pointer"
          onClick={() => {
            onNewClient()
            fireNewAction('client')
          }}
        >
          <Building2 className="h-3.5 w-3.5 mr-2 text-indigo-600" />
          Cliente
        </DropdownMenuItem>
        <DropdownMenuItem
          className="text-xs cursor-pointer"
          onClick={() => {
            onQuickContact()
            fireNewAction('quick_contact')
          }}
        >
          <UserPlus className="h-3.5 w-3.5 mr-2 text-teal-600" />
          Contato rápido
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-xs cursor-pointer" onClick={onNewVisit}>
          <Smartphone className="h-3.5 w-3.5 mr-2 text-teal-600" />
          Visita
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/** Copiloto Técnico como botão flutuante no canto da tela. */
export function CopilotFloatingButton({ onClick }: { onClick: () => void }) {
  return (
    <Button
      type="button"
      onClick={onClick}
      title="Copiloto Técnico Intertermal"
      className="fixed bottom-6 right-6 z-40 h-12 w-12 rounded-full p-0 bg-teal-700 hover:bg-teal-600 text-white shadow-lg shadow-teal-900/30"
    >
      <Bot className="h-5 w-5" />
    </Button>
  )
}
