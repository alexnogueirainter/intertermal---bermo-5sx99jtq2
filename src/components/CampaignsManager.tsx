import React, { useState, useEffect, useMemo } from 'react'
import {
  campaignsService,
  type CampaignRecord,
  type CampaignRecipientRecord,
} from '@/services/campaigns'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Send,
  Loader2,
  Mail,
  Users,
  Tag,
  FileText,
  RefreshCw,
  FlaskConical,
  Megaphone,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface CampaignsManagerProps {
  onDone?: () => void
}

const STATUS_META: Record<string, { label: string; color: string }> = {
  pending: { label: 'Na fila', color: 'bg-slate-100 text-slate-700 border-slate-300' },
  sent: { label: 'Enviado', color: 'bg-blue-50 text-blue-700 border-blue-300' },
  delivered: { label: 'Entregue', color: 'bg-emerald-50 text-emerald-700 border-emerald-300' },
  bounced: { label: 'Recusado', color: 'bg-rose-50 text-rose-700 border-rose-300' },
  complained: { label: 'Spam', color: 'bg-rose-50 text-rose-700 border-rose-300' },
  unsubscribed: { label: 'Descadastrado', color: 'bg-amber-50 text-amber-700 border-amber-300' },
  failed: { label: 'Falhou', color: 'bg-rose-50 text-rose-700 border-rose-300' },
}

const TEMPLATE_CATEGORIES = ['Prospecção', 'Follow-up', 'Pós-visita', 'Institucional', 'Outro']

export const CampaignsManager: React.FC<CampaignsManagerProps> = ({ onDone }) => {
  const { toast } = useToast()

  // ===== Modelo de e-mail =====
  const [name, setName] = useState('')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [templatesOpen, setTemplatesOpen] = useState(false)

  // ===== Destinatários =====
  const [tags, setTags] = useState<string[]>([])
  const [listTag, setListTag] = useState('')
  const [contacts, setContacts] = useState<{ email: string; name: string; company: string }[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [contactSearch, setContactSearch] = useState('')
  const [unsubCount, setUnsubCount] = useState(0)

  // ===== Modelos (banco) =====
  const [templates, setTemplates] = useState<CampaignTemplateRecord[]>([])
  const [tplName, setTplName] = useState('')
  const [tplCategory, setTplCategory] = useState('Prospecção')
  const [tplEditingId, setTplEditingId] = useState<string | null>(null)
  const [tplOpen, setTplOpen] = useState(false)

  // ===== Estado geral =====
  const [campaigns, setCampaigns] = useState<CampaignRecord[]>([])
  const [recipientsOf, setRecipientsOf] = useState<CampaignRecipientRecord[] | null>(null)
  const [recipientsOfId, setRecipientsOfId] = useState('')
  const [busy, setBusy] = useState('')

  const loadAll = async () => {
    try {
      const [t, c, cs, u] = await Promise.all([
        campaignsService.getAllTags(),
        campaignsService.getEligibleContacts(),
        campaignsService.getAll(),
        campaignsService.getUnsubscribedCount(),
      ])
      setTags(t)
      setContacts(c)
      setCampaigns(cs)
      setUnsubCount(u)
      // Modelos carregam em separado — falha aqui não derruba a tela inteira
      templatesService
        .getAll()
        .then(setTemplates)
        .catch(() => setTemplates([]))
    } catch (err: any) {
      toast({
        title: 'Erro ao carregar campanhas',
        description: err.message,
        variant: 'destructive',
      })
    }
  }

  useEffect(() => {
    loadAll()
  }, [])

  const filteredContacts = useMemo(() => {
    const q = contactSearch.toLowerCase().trim()
    if (!q) return contacts
    return contacts.filter(
      (c) =>
        c.email.toLowerCase().includes(q) ||
        c.name.toLowerCase().includes(q) ||
        c.company.toLowerCase().includes(q),
    )
  }, [contacts, contactSearch])

  const handleSaveAndSend = async () => {
    if (!name.trim() || !subject.trim() || !body.trim()) {
      toast({ title: 'Preencha nome, assunto e texto', variant: 'destructive' })
      return
    }
    if (!listTag && selected.size === 0) {
      toast({ title: 'Escolha a etiqueta ou marque os destinatários', variant: 'destructive' })
      return
    }
    setBusy('save')
    try {
      // A resolução da ETIQUETA é feita aqui (SDK traz tags parseadas): o hook recebe
      // sempre uma lista explícita de e-mails — mesmo caminho já provado do manual.
      const tagEmails = listTag
        ? contacts.filter((c) => (c.tags || []).includes(listTag)).map((c) => c.email)
        : []
      const finalRecipients = listTag ? tagEmails : Array.from(selected)
      if (listTag && tagEmails.length === 0) {
        toast({
          title: 'Nenhum contato com essa etiqueta',
          description: 'Confira a etiqueta na aba Clientes.',
          variant: 'destructive',
        })
        setBusy('')
        return
      }
      const res = await campaignsService.save({
        name: name.trim(),
        subject: subject.trim(),
        body: body.trim(),
        list_tag: listTag || undefined,
        recipients: finalRecipients,
      })
      if (!res.ok || !res.campaign_id) throw new Error(res.error || 'Falha ao salvar')
      const campaignId = res.campaign_id
      setBusy('send')
      const sendRes = await campaignsService.activate(campaignId)
      if (!sendRes.ok) throw new Error(sendRes.error || 'Falha ao ativar')
      toast({
        title: 'Campanha na fila!',
        description: `${sendRes.queued} destinatários · até 90 e-mails/dia (continua no dia seguinte se a lista for maior).`,
      })
      setName('')
      setSubject('')
      setBody('')
      setListTag('')
      setSelected(new Set())
      await loadAll()
      onDone?.()
    } catch (err: any) {
      toast({ title: 'Erro na campanha', description: err.message, variant: 'destructive' })
    } finally {
      setBusy('')
    }
  }

  const handleSendTest = async () => {
    if (!subject.trim() || !body.trim()) {
      toast({ title: 'Preencha assunto e texto antes do teste', variant: 'destructive' })
      return
    }
    setBusy('test')
    try {
      const res = await campaignsService.sendOne(
        'alex.nogueira@intertermal.com.br',
        '[TESTE] ' + subject.trim(),
        body.trim(),
      )
      if (!res.ok) throw new Error(res.error || 'Falha no teste')
      toast({
        title: 'Teste enviado!',
        description: 'Cheque a caixa de alex.nogueira@intertermal.com.br.',
      })
    } catch (err: any) {
      toast({ title: 'Erro no envio de teste', description: err.message, variant: 'destructive' })
    } finally {
      setBusy('')
    }
  }

  const openRecipients = async (c: CampaignRecord) => {
    setRecipientsOfId(c.id)
    setRecipientsOf(null)
    try {
      const r = await campaignsService.getRecipients(c.id)
      setRecipientsOf(r)
    } catch (err: any) {
      toast({
        title: 'Erro ao carregar destinatários',
        description: err.message,
        variant: 'destructive',
      })
      setRecipientsOf([])
    }
  }

  const toggleAll = () => {
    if (selected.size === filteredContacts.length && filteredContacts.length > 0)
      setSelected(new Set())
    else setSelected(new Set(filteredContacts.map((c) => c.email)))
  }

  // ===== Modelos =====
  const templatesByCategory = useMemo(() => {
    const map = new Map<string, CampaignTemplateRecord[]>()
    for (const t of templates) {
      const cat = t.category || 'Outro'
      if (!map.has(cat)) map.set(cat, [])
      map.get(cat)!.push(t)
    }
    return map
  }, [templates])

  const openTemplatesModal = () => {
    setTplOpen(true)
  }

  const applyTemplate = (t: CampaignTemplateRecord) => {
    setSubject(t.subject)
    setBody(t.body)
    if (!name.trim()) setName(t.name)
    setTplOpen(false)
  }

  const saveTemplate = async () => {
    if (!tplName.trim() || !subject.trim() || !body.trim()) {
      toast({
        title: 'Preencha nome, assunto e texto antes de salvar o modelo',
        variant: 'destructive',
      })
      return
    }
    try {
      // Salva pelo hook do backend (caminho único e provado, igual campanha)
      const res = await campaignsService.saveTemplate({
        name: tplName.trim(),
        category: tplCategory,
        subject: subject.trim(),
        body: body.trim(),
        template_id: tplEditingId || undefined,
      })
      if (!res.ok) throw new Error(res.error || 'Falha ao salvar modelo')
      toast({
        title: tplEditingId ? 'Modelo atualizado' : 'Modelo salvo',
        description: 'Aparece no botão Modelos de agora em diante.',
      })
      setTplEditingId(null)
      setTplName('')
      setTplCategory('Prospecção')
      setTemplates(await templatesService.getAll())
    } catch (err: any) {
      toast({ title: 'Erro ao salvar modelo', description: err.message, variant: 'destructive' })
    }
  }

  const editTemplate = (t: CampaignTemplateRecord) => {
    setTplEditingId(t.id)
    setTplName(t.name)
    setTplCategory(t.category || 'Outro')
    setSubject(t.subject)
    setBody(t.body)
    setTplOpen(false)
  }

  const deleteTemplate = async (t: CampaignTemplateRecord) => {
    try {
      await templatesService.remove(t.id)
      setTemplates(await templatesService.getAll())
      toast({ title: 'Modelo excluído' })
    } catch (err: any) {
      toast({ title: 'Erro ao excluir modelo', description: err.message, variant: 'destructive' })
    }
  }
  // deleteTemplate usa o SDK direto (delete da própria coleção funciona com o token do Alex)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Megaphone className="h-6 w-6 text-indigo-600" />
            Campanhas de E-mail
          </h2>
          <p className="text-xs md:text-sm text-muted-foreground mt-0.5">
            Prospecção e follow-up por e-mail · Resend · até 90 envios/dia (plano gratuito, com
            folga para propostas e avisos)
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={loadAll} className="text-xs">
          <RefreshCw className="h-3.5 w-3.5 mr-1" />
          Atualizar
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* ===== Coluna esquerda: modelo + destinatários + ações ===== */}
        <div className="space-y-6">
          {/* Modelo de e-mail */}
          <Card className="border-slate-200 dark:border-slate-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <FileText className="h-4 w-4 text-indigo-600" />1 · Modelo de e-mail
              </CardTitle>
              <CardDescription className="text-xs">
                Campos automáticos: {'{nome}'} e {'{empresa}'} — trocados por contato.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-end justify-between gap-2">
                <div className="flex-1 space-y-1">
                  <Label className="text-xs font-medium">Nome da campanha *</Label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex.: Prospecção — trocadores em Sorocaba"
                    className="text-xs"
                  />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setTemplatesOpen(true)}
                  className="text-xs shrink-0 h-8"
                >
                  <FileText className="h-3.5 w-3.5 mr-1" />
                  Modelos
                </Button>
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-medium">Assunto *</Label>
                <Input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Ex.: Assistência técnica Bermo em trocadores — {empresa}"
                  className="text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-medium">Texto *</Label>
                <Textarea
                  rows={7}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder={
                    'Olá {nome},\n\nVimos que a {empresa} trabalha com trocadores de calor...'
                  }
                  className="text-xs"
                />
              </div>
              {body.trim() && (
                <div className="rounded-lg bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 p-3">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Pré-visualização (com seus dados)
                  </p>
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    {subject
                      .split('{nome}')
                      .join('Alex Nogueira')
                      .split('{empresa}')
                      .join('Intertermal')}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 whitespace-pre-line">
                    {body}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Destinatários */}
          <Card className="border-slate-200 dark:border-slate-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Users className="h-4 w-4 text-indigo-600" />2 · Destinatários
              </CardTitle>
              <CardDescription className="text-xs">
                {contacts.length} contatos elegíveis · {unsubCount} descadastrados (fora de todas as
                campanhas)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1">
                <Label className="text-xs font-medium">Enviar para a etiqueta</Label>
                <Select
                  value={listTag || '__none__'}
                  onValueChange={(v) => {
                    setListTag(v === '__none__' ? '' : v)
                    if (v !== '__none__') setSelected(new Set())
                  }}
                >
                  <SelectTrigger className="text-xs">
                    <SelectValue placeholder="Escolha uma etiqueta (ou marque um a um)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__" className="text-xs">
                      — Marcar manualmente —
                    </SelectItem>
                    {tags.map((t) => (
                      <SelectItem key={t} value={t} className="text-xs">
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {listTag && (
                  <p className="text-[10px] text-teal-700 dark:text-teal-400 font-semibold">
                    Envia para todos os contatos das contas com a etiqueta "{listTag}" —
                    descadastrados excluídos.
                  </p>
                )}
              </div>

              {!listTag && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <Label className="text-xs font-medium">
                      Marcar contatos ({selected.size} selecionados)
                    </Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={toggleAll}
                      className="text-[11px] h-6 px-2"
                    >
                      {selected.size === filteredContacts.length && filteredContacts.length > 0
                        ? 'Limpar'
                        : 'Marcar todos'}
                    </Button>
                  </div>
                  <Input
                    value={contactSearch}
                    onChange={(e) => setContactSearch(e.target.value)}
                    placeholder="Buscar por e-mail, nome ou empresa..."
                    className="text-xs"
                  />
                  <div className="max-h-56 overflow-y-auto space-y-1 rounded-lg border border-slate-200 dark:border-slate-800 p-2">
                    {filteredContacts.map((c) => (
                      <label
                        key={c.email}
                        className="flex items-center gap-2 p-1.5 rounded hover:bg-slate-50 dark:hover:bg-slate-900 cursor-pointer"
                      >
                        <Checkbox
                          checked={selected.has(c.email)}
                          onCheckedChange={(v: boolean) => {
                            const next = new Set(selected)
                            if (v) next.add(c.email)
                            else next.delete(c.email)
                            setSelected(next)
                          }}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="text-[11px] font-semibold text-slate-800 dark:text-slate-200 truncate">
                            {c.company}
                          </div>
                          <div className="text-[10px] text-muted-foreground truncate">
                            {c.name ? c.name + ' · ' : ''}
                            {c.email}
                          </div>
                        </div>
                      </label>
                    ))}
                    {filteredContacts.length === 0 && (
                      <p className="text-[11px] text-muted-foreground p-2">
                        Nenhum contato elegível. Importe contatos na aba Clientes.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Salvar como modelo */}
          <Card className="border-slate-200 dark:border-slate-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold flex items-center gap-2">
                <FileText className="h-3.5 w-3.5 text-indigo-600" />
                Salvar como modelo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex gap-2">
                <Input
                  value={tplName}
                  onChange={(e) => setTplName(e.target.value)}
                  placeholder="Nome do modelo (ex.: Follow-up 5 dias)"
                  className="text-xs flex-1"
                />
                <Select value={tplCategory} onValueChange={setTplCategory}>
                  <SelectTrigger className="text-xs w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TEMPLATE_CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c} className="text-xs">
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={saveTemplate}
                disabled={!tplName.trim() || !subject.trim() || !body.trim()}
                className="text-xs w-full"
              >
                {tplEditingId ? 'Atualizar modelo' : 'Salvar modelo'}
              </Button>
              {tplEditingId && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setTplEditingId(null)
                    setTplName('')
                    setTplCategory('Prospecção')
                  }}
                  className="text-[11px] w-full"
                >
                  Cancelar edição (novo modelo)
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Ações */}
          <Card className="border-slate-200 dark:border-slate-800">
            <CardContent className="pt-4 flex flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                onClick={handleSendTest}
                disabled={!!busy || !subject.trim() || !body.trim()}
                className="flex-1 text-xs border-teal-200 text-teal-700 hover:bg-teal-50 dark:border-teal-800 dark:text-teal-300"
              >
                {busy === 'test' ? (
                  <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                ) : (
                  <FlaskConical className="h-3.5 w-3.5 mr-1" />
                )}
                3 · Enviar teste para mim
              </Button>
              <Button
                onClick={handleSaveAndSend}
                disabled={!!busy || (!listTag && selected.size === 0)}
                className="flex-1 text-xs bg-indigo-600 hover:bg-indigo-500"
              >
                {busy === 'save' || busy === 'send' ? (
                  <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                ) : (
                  <Send className="h-3.5 w-3.5 mr-1" />
                )}
                4 · Salvar e disparar
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* ===== Coluna direita: campanhas + status por destinatário ===== */}
        <div className="space-y-4">
          <Card className="border-slate-200 dark:border-slate-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Mail className="h-4 w-4 text-indigo-600" />
                Campanhas
              </CardTitle>
              <CardDescription className="text-xs">
                Fila: 90 e-mails/dia, dias úteis às 10h (BRT) · continua no dia seguinte
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {campaigns.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  Nenhuma campanha ainda. Crie à esquerda.
                </p>
              )}
              {campaigns.map((c) => (
                <div
                  key={c.id}
                  className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-indigo-300 transition-all"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                        {c.name}
                      </div>
                      <div className="text-[11px] text-muted-foreground truncate">{c.subject}</div>
                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        {c.list_tag && (
                          <Badge variant="outline" className="text-[9px]">
                            <Tag className="h-2.5 w-2.5 mr-0.5" />
                            {c.list_tag}
                          </Badge>
                        )}
                        <span className="text-[10px] text-muted-foreground">
                          {(c.recipients || []).length} destinatários
                        </span>
                      </div>
                    </div>
                    <Badge
                      className={`text-[9px] uppercase px-1.5 font-bold ${
                        c.status === 'sending'
                          ? 'bg-blue-50 text-blue-700 border-blue-300'
                          : c.status === 'done'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                            : 'bg-slate-100 text-slate-700 border-slate-300'
                      }`}
                    >
                      {c.status === 'sending'
                        ? 'Enviando'
                        : c.status === 'done'
                          ? 'Concluída'
                          : 'Rascunho'}
                    </Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openRecipients(c)}
                    className="text-[11px] mt-1 h-6 px-2"
                  >
                    Ver status dos destinatários
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>

          {recipientsOfId && (
            <Card className="border-slate-200 dark:border-slate-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-bold">Status por destinatário</CardTitle>
                <CardDescription className="text-[11px]">
                  Enviado → Entregue → (Recusado/Spam/Descadastrado). Avisos chegam pelo webhook do
                  Resend.
                </CardDescription>
              </CardHeader>
              <CardContent className="max-h-80 overflow-y-auto space-y-1.5">
                {!recipientsOf && (
                  <p className="text-xs text-muted-foreground flex items-center gap-2">
                    <Loader2 className="h-3 w-3 animate-spin" /> Carregando…
                  </p>
                )}
                {recipientsOf && recipientsOf.length === 0 && (
                  <p className="text-xs text-muted-foreground">Sem destinatários.</p>
                )}
                {recipientsOf?.map((r) => {
                  const meta = STATUS_META[r.status] || STATUS_META.pending
                  return (
                    <div
                      key={r.id}
                      className="flex items-center justify-between gap-2 p-2 rounded-lg border border-slate-100 dark:border-slate-800"
                    >
                      <div className="min-w-0">
                        <div className="text-[11px] font-semibold text-slate-800 dark:text-slate-200 truncate">
                          {r.name || '—'} {r.company ? `(${r.company})` : ''}
                        </div>
                        <div className="text-[10px] text-muted-foreground truncate">{r.email}</div>
                        {r.error && (
                          <div className="text-[10px] text-rose-600 truncate">{r.error}</div>
                        )}
                      </div>
                      <Badge className={`text-[9px] px-1.5 border ${meta.color}`}>
                        {meta.label}
                      </Badge>
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Modal de modelos (banco) */}
      <Dialog open={tplOpen} onOpenChange={setTplOpen}>
        <DialogContent className="sm:max-w-[620px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">Modelos de campanha</DialogTitle>
            <DialogDescription className="text-xs">
              Clique para usar · edite ou exclua os seus · {`{nome}`} e {`{empresa}`} são trocados
              por contato.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-1">
            {templates.size === 0 && (
              <p className="text-xs text-muted-foreground">
                Nenhum modelo salvo ainda. Escreva o assunto e o texto na tela ao lado e clique em
                "Salvar como modelo".
              </p>
            )}
            {Array.from(templatesByCategory.entries()).map(([cat, list]) => (
              <div key={cat}>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  {cat}
                </p>
                <div className="space-y-1.5">
                  {list.map((t) => (
                    <div
                      key={t.id}
                      className="flex items-start justify-between gap-2 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-indigo-300 transition-all"
                    >
                      <button onClick={() => applyTemplate(t)} className="flex-1 text-left min-w-0">
                        <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                          {t.name}
                        </div>
                        <div className="text-[11px] text-muted-foreground truncate">
                          {t.subject}
                        </div>
                      </button>
                      <div className="flex gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => editTemplate(t)}
                          className="h-6 px-2 text-[10px]"
                        >
                          Editar
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteTemplate(t)}
                          className="h-6 px-2 text-[10px] text-rose-600 hover:text-rose-700"
                        >
                          Excluir
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setTplOpen(false)}
              className="text-xs"
            >
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
