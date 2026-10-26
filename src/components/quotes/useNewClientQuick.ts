import { ClientRecord, QuoteStatus } from '@/types/crm'
import type { Dispatch, FormEvent, SetStateAction } from 'react'

interface MakeNewClientQuickDeps {
  newClientCity: string
  newClientContact: string
  newClientDocument: string
  newClientEmail: string
  newClientName: string
  newClientPhone: string
  newClientState: string
  onCreateClient: ((data: Partial<ClientRecord>) => Promise<ClientRecord>) | undefined
  setClientId: Dispatch<SetStateAction<string>>
  setClientName: Dispatch<SetStateAction<string>>
  setDestinationAddress: Dispatch<SetStateAction<string>>
  setIsNewClientDialogOpen: Dispatch<SetStateAction<boolean>>
  setIsSavingNewClient: Dispatch<SetStateAction<boolean>>
  setNewClientCity: Dispatch<SetStateAction<string>>
  setNewClientContact: Dispatch<SetStateAction<string>>
  setNewClientDocument: Dispatch<SetStateAction<string>>
  setNewClientEmail: Dispatch<SetStateAction<string>>
  setNewClientName: Dispatch<SetStateAction<string>>
  setNewClientPhone: Dispatch<SetStateAction<string>>
  setNewClientState: Dispatch<SetStateAction<string>>
  status: QuoteStatus
  toast: ReturnType<typeof useToast>['toast']
}

export function makeNewClientQuick(p: MakeNewClientQuickDeps) {
  const {
    newClientCity,
    newClientContact,
    newClientDocument,
    newClientEmail,
    newClientName,
    newClientPhone,
    newClientState,
    onCreateClient,
    setClientId,
    setClientName,
    setDestinationAddress,
    setIsNewClientDialogOpen,
    setIsSavingNewClient,
    setNewClientCity,
    setNewClientContact,
    setNewClientDocument,
    setNewClientEmail,
    setNewClientName,
    setNewClientPhone,
    setNewClientState,
    status,
    toast,
  } = p

  const handleSaveNewClientQuick = async (e: FormEvent) => {
    e.preventDefault()
    const trimmedName = newClientName.trim()
    if (!trimmedName) {
      toast({
        title: 'Nome obrigatório',
        description: 'Informe a razão social ou nome do cliente.',
        variant: 'destructive',
      })
      return
    }

    setIsSavingNewClient(true)
    try {
      const clientData: Partial<ClientRecord> = {
        name: trimmedName,
        company_name: trimmedName,
        document: newClientDocument.trim() || undefined,
        email: newClientEmail.trim() || undefined,
        phone: newClientPhone.trim() || undefined,
        whatsapp: newClientPhone.trim() || undefined,
        city: newClientCity.trim() || undefined,
        state: newClientState.trim().toUpperCase() || undefined,
        status: 'prospect',
      }

      if (newClientContact.trim()) {
        clientData.contacts = [
          {
            id: `c-${Date.now()}`,
            name: newClientContact.trim(),
            email: newClientEmail.trim() || undefined,
            phone: newClientPhone.trim() || undefined,
            role: 'Contato Comercial / Manutenção',
          },
        ]
      }

      let created: ClientRecord
      if (onCreateClient) {
        created = await onCreateClient(clientData)
      } else {
        created = await clientsService.create(clientData)
      }

      // Seleciona automaticamente o novo cliente na proposta
      setClientId(created.id)
      setClientName(created.name || created.company_name || trimmedName)
      if (created.address) {
        setDestinationAddress(created.address)
      } else if (created.city || created.state) {
        setDestinationAddress([created.city, created.state].filter(Boolean).join(' - '))
      }

      toast({
        title: 'Cliente cadastrado com sucesso!',
        description: `${created.name} foi adicionado e selecionado na proposta.`,
      })

      // Limpar formulário e fechar modal
      setNewClientName('')
      setNewClientDocument('')
      setNewClientContact('')
      setNewClientEmail('')
      setNewClientPhone('')
      setNewClientCity('')
      setNewClientState('')
      setIsNewClientDialogOpen(false)
    } catch (err: any) {
      console.error('Erro ao cadastrar novo cliente:', err)
      toast({
        title: 'Erro ao cadastrar cliente',
        description: err.message || 'Não foi possível cadastrar o cliente no sistema.',
        variant: 'destructive',
      })
    } finally {
      setIsSavingNewClient(false)
    }
  }

  // Abrir editor para nova proposta

  return {
    handleSaveNewClientQuick,
  }
}
