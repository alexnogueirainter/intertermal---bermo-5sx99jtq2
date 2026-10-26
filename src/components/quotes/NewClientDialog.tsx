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
import { Label } from '@/components/ui/label'
import { Loader2, Save, UserPlus } from 'lucide-react'
import type { Dispatch, FormEvent, SetStateAction } from 'react'

interface NewClientDialogProps {
  isNewClientDialogOpen: boolean
  setIsNewClientDialogOpen: Dispatch<SetStateAction<boolean>>
  isSavingNewClient: boolean
  newClientName: string
  setNewClientName: Dispatch<SetStateAction<string>>
  newClientDocument: string
  setNewClientDocument: Dispatch<SetStateAction<string>>
  newClientContact: string
  setNewClientContact: Dispatch<SetStateAction<string>>
  newClientEmail: string
  setNewClientEmail: Dispatch<SetStateAction<string>>
  newClientPhone: string
  setNewClientPhone: Dispatch<SetStateAction<string>>
  newClientCity: string
  setNewClientCity: Dispatch<SetStateAction<string>>
  newClientState: string
  setNewClientState: Dispatch<SetStateAction<string>>
  handleSaveNewClientQuick: (e: FormEvent) => any
}

export function NewClientDialog(props: NewClientDialogProps) {
  const {
    isNewClientDialogOpen,
    setIsNewClientDialogOpen,
    isSavingNewClient,
    newClientName,
    setNewClientName,
    newClientDocument,
    setNewClientDocument,
    newClientContact,
    setNewClientContact,
    newClientEmail,
    setNewClientEmail,
    newClientPhone,
    setNewClientPhone,
    newClientCity,
    setNewClientCity,
    newClientState,
    setNewClientState,
    handleSaveNewClientQuick,
  } = props

  return (
    <>
      {/* Modal para Cadastro Manual de Novo Cliente (Seção 3A) */}
      <Dialog open={isNewClientDialogOpen} onOpenChange={setIsNewClientDialogOpen}>
        <DialogContent className="sm:max-w-[540px] p-0 overflow-hidden">
          <DialogHeader className="p-4 pb-3 border-b border-slate-100 dark:border-slate-800 bg-teal-50/60 dark:bg-teal-950/30">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-teal-600 text-white flex items-center justify-center shrink-0">
                <UserPlus className="h-4 w-4" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Cadastrar Novo Cliente
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Preencha os dados abaixo. O novo cliente será salvo e selecionado na proposta.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <form onSubmit={handleSaveNewClientQuick} className="p-4 space-y-3.5">
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                Nome do Cliente / Razão Social <span className="text-rose-500">*</span>
              </Label>
              <Input
                required
                autoFocus
                placeholder="Ex: Cervejaria Catarinense Ltda"
                value={newClientName}
                onChange={(e) => setNewClientName(e.target.value)}
                className="text-xs h-8"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  CNPJ / CPF (opcional)
                </Label>
                <Input
                  placeholder="00.000.000/0001-00"
                  value={newClientDocument}
                  onChange={(e) => setNewClientDocument(e.target.value)}
                  className="text-xs h-8"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  Contato / Responsável
                </Label>
                <Input
                  placeholder="Ex: Eng. Roberto Silveira"
                  value={newClientContact}
                  onChange={(e) => setNewClientContact(e.target.value)}
                  className="text-xs h-8"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  E-mail
                </Label>
                <Input
                  type="email"
                  placeholder="contato@empresa.com.br"
                  value={newClientEmail}
                  onChange={(e) => setNewClientEmail(e.target.value)}
                  className="text-xs h-8"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  Telefone / Celular
                </Label>
                <Input
                  placeholder="(47) 99999-8888"
                  value={newClientPhone}
                  onChange={(e) => setNewClientPhone(e.target.value)}
                  className="text-xs h-8"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1 col-span-2">
                <Label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  Cidade
                </Label>
                <Input
                  placeholder="Ex: Blumenau"
                  value={newClientCity}
                  onChange={(e) => setNewClientCity(e.target.value)}
                  className="text-xs h-8"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-medium text-slate-700 dark:text-slate-300">UF</Label>
                <Input
                  placeholder="SC"
                  maxLength={2}
                  value={newClientState}
                  onChange={(e) => setNewClientState(e.target.value.toUpperCase())}
                  className="text-xs h-8"
                />
              </div>
            </div>

            <DialogFooter className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsNewClientDialogOpen(false)}
                className="h-8 text-xs"
                disabled={isSavingNewClient}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSavingNewClient || !newClientName.trim()}
                className="h-8 text-xs bg-teal-600 hover:bg-teal-700 text-white"
              >
                {isSavingNewClient ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="h-3.5 w-3.5 mr-1" />
                    Cadastrar e Selecionar
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
