import React, { useState } from 'react'
import { Plus, Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { quickContactService } from '@/services/quick-contact'
import type { ActivityRecord } from '@/types/crm'

interface QuickContactButtonProps {
  onCreated: (record: ActivityRecord) => void
  /** Controla o botão externamente (ex.: menu "+ Novo"). Sem valor, o botão é autônomo. */
  openSignal?: number
  /** Esconde o botão físico quando o acionamento vem do menu "+ Novo". */
  hideTrigger?: boolean
}

function tomorrowIsoDate(): string {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/**
 * Botão fixo "+ Contato rápido" — vive no topo do sistema (header, que nunca
 * sai da tela em desktop nem no celular). Abre o formulário de 3 campos e
 * cria a atividade "Retornar contato" (padrão: amanhã às 9h, data mudável).
 */
export const QuickContactButton: React.FC<QuickContactButtonProps> = ({
  onCreated,
  openSignal,
  hideTrigger = false,
}) => {
  const { toast } = useToast()
  const [open, setOpen] = useState(false)

  // Abertura externa (menu "+ Novo"): cada incremento do sinal abre o formulário
  React.useEffect(() => {
    if (openSignal && openSignal > 0) setOpen(true)
  }, [openSignal])
  const [name, setName] = useState('')
  const [company, setCompany] = useState('')
  const [phone, setPhone] = useState('')
  const [dueDate, setDueDate] = useState(tomorrowIsoDate())
  const [saving, setSaving] = useState(false)

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || saving) return
    setSaving(true)
    try {
      const record = await quickContactService.create({
        name: name.trim(),
        company: company.trim(),
        phone: phone.trim(),
        dueDate: dueDate || tomorrowIsoDate(),
      })
      const dataLabel = record.due_date
        ? new Date(record.due_date).toLocaleDateString('pt-BR')
        : 'amanhã'
      toast({
        title: 'Contato registrado!',
        description: `Atividade "Retornar contato" criada para ${dataLabel} às 9h.`,
      })
      onCreated(record)
      setName('')
      setCompany('')
      setPhone('')
      setDueDate(tomorrowIsoDate())
      setOpen(false)
    } catch (err: any) {
      toast({
        title: 'Erro ao registrar contato',
        description: err.message,
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      {!hideTrigger && (
        <Button
          size="sm"
          variant="outline"
          onClick={() => setOpen(true)}
          title="Registrar contato rápido"
          className="h-8 text-xs border-teal-200 text-teal-700 hover:bg-teal-50 dark:border-teal-800 dark:text-teal-300 dark:hover:bg-teal-950/40"
        >
          <Plus className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Contato rápido</span>
          <span className="sm:hidden">Contato</span>
        </Button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">Contato rápido</DialogTitle>
            <DialogDescription className="text-xs">
              Registra o contato e cria a atividade "Retornar contato" — por padrão amanhã às 9h.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-3 py-1">
            <div className="space-y-1">
              <Label className="text-xs font-medium">Nome *</Label>
              <Input
                required
                placeholder="Quem falou com você"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-medium">Empresa</Label>
              <Input
                placeholder="Empresa / planta"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-medium">Telefone / observação</Label>
              <Input
                placeholder="(11) 99999-0000 ou anotação do que foi falado"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-medium">Data do retorno</Label>
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="text-xs"
              />
              <p className="text-[10px] text-muted-foreground">Retorno às 9h na data escolhida.</p>
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={saving}
                className="bg-teal-700 hover:bg-teal-600"
              >
                {saving ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : null}
                Salvar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
