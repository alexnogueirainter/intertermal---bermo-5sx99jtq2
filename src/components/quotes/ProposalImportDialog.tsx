import { useEffect, useRef, useState } from 'react'
import { AlertTriangle, Building2, CheckCircle2, FileText, Loader2, Upload, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { proposalImportService, type ImportExtraction } from '@/services/proposal-import'
import type { ClientRecord, DealRecord, QuoteRecord } from '@/types/crm'

interface ProposalImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  clients: ClientRecord[]
  onImported: (result: {
    quote: QuoteRecord | null
    client: ClientRecord | null
    deal: DealRecord | null
  }) => void
}

type Step = 'upload' | 'review' | 'done'

const fmtBRL = (v: string | number): string => {
  const n = Number(String(v).replace(/\./g, '').replace(',', '.')) || 0
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function ProposalImportDialog({
  open,
  onOpenChange,
  clients,
  onImported,
}: ProposalImportDialogProps) {
  const { toast } = useToast()
  const [step, setStep] = useState<Step>('upload')
  const [file, setFile] = useState<File | null>(null)
  const [extracting, setExtracting] = useState(false)
  const [saving, setSaving] = useState(false)
  const [data, setData] = useState<ImportExtraction | null>(null)
  const [existingClient, setExistingClient] = useState<ClientRecord | null>(null)
  const [result, setResult] = useState<{
    quote_number: string
    client_created: boolean
    follow_up_date: string
    number_adjusted: boolean
  } | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) {
      setStep('upload')
      setFile(null)
      setData(null)
      setExistingClient(null)
      setResult(null)
      setExtracting(false)
      setSaving(false)
    }
  }, [open])

  // Detecta cliente existente por CNPJ (o backend também confere — aqui é só aviso visual)
  useEffect(() => {
    if (!data?.client?.document || clients.length === 0) {
      setExistingClient(null)
      return
    }
    const doc = data.client.document.replace(/\D+/g, '')
    const found = clients.find((c) => String(c.document || '').replace(/\D+/g, '') === doc)
    setExistingClient(found || null)
  }, [data, clients])

  const handleFile = async (f: File) => {
    if (!f) return
    if (f.type && !f.type.includes('pdf') && !f.name.toLowerCase().endsWith('.pdf')) {
      toast({
        title: 'Arquivo inválido',
        description: 'Envie o PDF da proposta.',
        variant: 'destructive',
      })
      return
    }
    setFile(f)
    setExtracting(true)
    try {
      const res = await proposalImportService.extract(f)
      if (!res.data?.proposal && !res.data?.client) {
        throw new Error('Extração vazia')
      }
      setData(res.data)
      setStep('review')
    } catch (err: any) {
      toast({
        title: 'Não consegui extrair os dados',
        description: err?.message || 'Verifique se o PDF tem texto selecionável.',
        variant: 'destructive',
      })
      setFile(null)
    } finally {
      setExtracting(false)
    }
  }

  const patch = (section: 'client' | 'proposal' | 'deal', field: string, value: string) => {
    setData((prev) => {
      if (!prev) return prev
      return { ...prev, [section]: { ...prev[section], [field]: value } }
    })
  }

  const handleConfirm = async () => {
    if (!data || !file) return
    if (!data.client.name?.trim()) {
      toast({
        title: 'Cliente é obrigatório',
        description: 'Informe ao menos o nome do cliente.',
        variant: 'destructive',
      })
      return
    }
    setSaving(true)
    try {
      const res = await proposalImportService.commit(data, file)
      setResult({
        quote_number: res.quote_number,
        client_created: res.client_created,
        follow_up_date: res.follow_up_date,
        number_adjusted: res.number_adjusted,
      })
      setStep('done')
      onImported({ quote: null, client: null, deal: null })
    } catch (err: any) {
      toast({
        title: 'Erro ao registrar no CRM',
        description: err?.message || 'Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const closeDialog = (open: boolean) => {
    onOpenChange(open)
  }

  return (
    <Dialog open={open} onOpenChange={closeDialog}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <FileText className="h-4 w-4 text-teal-600" />
            Importar proposta recebida (modelo PI)
          </DialogTitle>
        </DialogHeader>

        {step === 'upload' && (
          <div className="space-y-4 py-4">
            <div
              className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg p-8 text-center cursor-pointer hover:border-teal-400 hover:bg-teal-50/40 dark:hover:bg-teal-900/10 transition-colors"
              onClick={() => inputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault()
                const f = e.dataTransfer.files?.[0]
                if (f) handleFile(f)
              }}
            >
              {extracting ? (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Lendo a proposta e extraindo os dados…
                  </p>
                  <p className="text-xs text-muted-foreground">Pode levar alguns segundos.</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <Upload className="h-8 w-8 text-slate-400" />
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Clique para escolher o PDF da proposta
                  </p>
                  <p className="text-xs text-muted-foreground">
                    A IA extrai os dados e você confere antes de registrar. Nada é gravado sem sua
                    revisão.
                  </p>
                </div>
              )}
              <input
                ref={inputRef}
                type="file"
                accept="application/pdf,.pdf"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) handleFile(f)
                  e.target.value = ''
                }}
              />
            </div>
          </div>
        )}

        {step === 'review' && data && (
          <div className="space-y-4">
            {data.warnings?.length > 0 && (
              <div className="rounded-md border border-amber-300 bg-amber-50 dark:bg-amber-900/20 p-3 space-y-1">
                {data.warnings.map((w, i) => (
                  <p key={i} className="text-xs text-amber-800 dark:text-amber-300 flex gap-1.5">
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                    {w}
                  </p>
                ))}
              </div>
            )}

            {existingClient && (
              <div className="rounded-md border border-teal-300 bg-teal-50 dark:bg-teal-900/20 p-3">
                <p className="text-xs text-teal-800 dark:text-teal-300 flex gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                  Cliente já cadastrado: <strong>{existingClient.name}</strong> — será reaproveitado
                  (não duplica). O contato da proposta será somado.
                </p>
              </div>
            )}

            {/* Cliente */}
            <Card>
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm flex items-center gap-1.5">
                  <Building2 className="h-4 w-4 text-teal-600" /> Cliente
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0 grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <Label className="text-xs">Nome da empresa</Label>
                  <Input
                    className="h-8 text-xs"
                    value={data.client.name || ''}
                    onChange={(e) => patch('client', 'name', e.target.value)}
                  />
                </div>
                <div>
                  <Label className="text-xs">CNPJ</Label>
                  <Input
                    className="h-8 text-xs"
                    value={data.client.document || ''}
                    onChange={(e) => patch('client', 'document', e.target.value)}
                  />
                </div>
                <div>
                  <Label className="text-xs">Contato</Label>
                  <Input
                    className="h-8 text-xs"
                    value={data.client.contact_name || ''}
                    onChange={(e) => patch('client', 'contact_name', e.target.value)}
                  />
                </div>
                <div>
                  <Label className="text-xs">E-mail do contato</Label>
                  <Input
                    className="h-8 text-xs"
                    value={data.client.contact_email || ''}
                    onChange={(e) => patch('client', 'contact_email', e.target.value)}
                  />
                </div>
                <div>
                  <Label className="text-xs">Telefone / WhatsApp</Label>
                  <Input
                    className="h-8 text-xs"
                    value={data.client.contact_phone || data.client.contact_mobile || ''}
                    onChange={(e) => {
                      patch('client', 'contact_phone', e.target.value)
                      patch('client', 'contact_mobile', e.target.value)
                    }}
                  />
                </div>
                <div>
                  <Label className="text-xs">Cidade</Label>
                  <Input
                    className="h-8 text-xs"
                    value={data.client.city || ''}
                    onChange={(e) => patch('client', 'city', e.target.value)}
                  />
                </div>
                <div>
                  <Label className="text-xs">UF</Label>
                  <Input
                    className="h-8 text-xs"
                    value={data.client.state || ''}
                    onChange={(e) => patch('client', 'state', e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Proposta */}
            <Card>
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm flex items-center gap-1.5">
                  <FileText className="h-4 w-4 text-teal-600" /> Proposta
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0 grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Número (preservado)</Label>
                  <Input
                    className="h-8 text-xs font-mono"
                    value={data.proposal.quote_number || ''}
                    onChange={(e) => patch('proposal', 'quote_number', e.target.value)}
                  />
                </div>
                <div>
                  <Label className="text-xs">Valor total (R$)</Label>
                  <Input
                    className="h-8 text-xs font-mono"
                    value={String(data.proposal.total || '')}
                    onChange={(e) => patch('proposal', 'total', e.target.value)}
                  />
                  {data.proposal.total && (
                    <p className="text-[11px] text-muted-foreground mt-1">
                      {fmtBRL(data.proposal.total)}
                    </p>
                  )}
                  {(!data.proposal.total ||
                    Number(String(data.proposal.total).replace(/\./g, '').replace(',', '.')) ===
                      0) && (
                    <p className="text-[11px] text-amber-600 font-semibold mt-1 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" /> Valor não identificado — preencha
                      manualmente
                    </p>
                  )}
                </div>
                <div className="col-span-2">
                  <Label className="text-xs">Título / objeto</Label>
                  <Input
                    className="h-8 text-xs"
                    value={data.proposal.title || ''}
                    onChange={(e) => patch('proposal', 'title', e.target.value)}
                  />
                </div>
                <div className="col-span-2">
                  <Label className="text-xs">Condições de pagamento</Label>
                  <Input
                    className="h-8 text-xs"
                    value={data.proposal.payment_terms || ''}
                    onChange={(e) => patch('proposal', 'payment_terms', e.target.value)}
                  />
                </div>
                <div>
                  <Label className="text-xs">Válida até (AAAA-MM-DD)</Label>
                  <Input
                    className="h-8 text-xs"
                    value={data.proposal.valid_until || ''}
                    onChange={(e) => patch('proposal', 'valid_until', e.target.value)}
                  />
                </div>
                <div>
                  <Label className="text-xs">Validade (dias)</Label>
                  <Input
                    className="h-8 text-xs"
                    value={String(data.proposal.validity_days || '')}
                    onChange={(e) => patch('proposal', 'validity_days', e.target.value)}
                  />
                </div>
                <div className="col-span-2">
                  <Label className="text-xs">Escopo (resumo)</Label>
                  <Textarea
                    className="text-xs min-h-[60px]"
                    value={data.proposal.scope_summary || ''}
                    onChange={(e) => patch('proposal', 'scope_summary', e.target.value)}
                  />
                </div>
                {data.proposal.optional_items?.length > 0 && (
                  <div className="col-span-2 rounded-md bg-slate-50 dark:bg-slate-900 p-2.5">
                    <p className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Itens opcionais (FORA do total):
                    </p>
                    {data.proposal.optional_items.map((it, i) => (
                      <p key={i} className="text-[11px] text-slate-600 dark:text-slate-400">
                        • {it.code ? it.code + ' — ' : ''}
                        {it.description} — {fmtBRL(it.value || 0)}
                      </p>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Deal */}
            <Card>
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm">Negócio no funil</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0 grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <Label className="text-xs">Título</Label>
                  <Input
                    className="h-8 text-xs"
                    value={data.deal.suggested_title || ''}
                    onChange={(e) => patch('deal', 'suggested_title', e.target.value)}
                  />
                </div>
                <div>
                  <Label className="text-xs">Prioridade</Label>
                  <Input
                    className="h-8 text-xs"
                    value={data.deal.priority || 'medium'}
                    onChange={(e) => patch('deal', 'priority', e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            <div className="flex items-center justify-between gap-2 pt-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-xs"
                onClick={() => {
                  setStep('upload')
                  setFile(null)
                  setData(null)
                }}
              >
                <X className="h-3.5 w-3.5 mr-1" /> Trocar PDF
              </Button>
              <Button
                type="button"
                size="sm"
                className="text-xs bg-teal-700 hover:bg-teal-600 text-white"
                onClick={handleConfirm}
                disabled={saving}
              >
                {saving ? (
                  <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                )}
                Registrar no CRM
              </Button>
            </div>
          </div>
        )}

        {step === 'done' && result && (
          <div className="py-6 space-y-3 text-center">
            <CheckCircle2 className="h-10 w-10 text-emerald-600 mx-auto" />
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              Proposta {result.quote_number} registrada no CRM
            </p>
            <div className="text-xs text-muted-foreground space-y-1">
              <p>
                {result.client_created
                  ? 'Cliente cadastrado com os dados da proposta.'
                  : 'Cliente existente reaproveitado (sem duplicar).'}
              </p>
              <p>Deal criado no funil (etapa Proposta, 60%).</p>
              <p>
                Cobrança automática em{' '}
                <strong>
                  {new Date(result.follow_up_date + 'T12:00:00').toLocaleDateString('pt-BR')}
                </strong>{' '}
                (5 dias corridos), se continuar sem resposta.
              </p>
              {result.number_adjusted && (
                <p className="text-amber-600">
                  O número já existia — recebeu sufixo -R2 para não colidir.
                </p>
              )}
            </div>
            <Button
              type="button"
              size="sm"
              className="text-xs bg-teal-700 hover:bg-teal-600 text-white mt-2"
              onClick={() => closeDialog(false)}
            >
              Fechar
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default ProposalImportDialog
