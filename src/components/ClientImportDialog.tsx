import React, { useState } from 'react'
import * as XLSX from 'xlsx'
import { FileSpreadsheet, Loader2, AlertTriangle } from 'lucide-react'
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
import { clientsService } from '@/services/clients'
import type { ClientRecord, ClientContact } from '@/types/crm'

export interface ClientImportRow {
  empresa: string
  nome: string
  email: string
  telefone: string
  cargo: string
  cidade: string
  line: number
}

export interface ImportSummary {
  newCount: number
  existingCount: number
  errorRows: { line: number; email: string; reason: string }[]
  newContacts: ClientImportRow[]
  existingContacts: { row: ClientImportRow; client: ClientRecord; contactIdx: number }[]
}

interface ClientImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  clients: ClientRecord[]
  onImportDone: () => void
}

const HEADER_ALIASES: Record<string, keyof Omit<ClientImportRow, 'line'>> = {
  empresa: 'empresa',
  'razao social': 'empresa',
  company: 'empresa',
  nome: 'nome',
  'nome do contato': 'nome',
  contato: 'nome',
  name: 'nome',
  'e-mail': 'email',
  'e mail': 'email',
  email: 'email',
  'e-mail do contato': 'email',
  telefone: 'telefone',
  tel: 'telefone',
  phone: 'telefone',
  celular: 'telefone',
  cargo: 'cargo',
  funcao: 'cargo',
  role: 'cargo',
  cidade: 'cidade',
  city: 'cidade',
}

const normHeader = (h: string) =>
  String(h || '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

const normEmail = (e: string) =>
  String(e || '')
    .trim()
    .toLowerCase()

/** Lê .xlsx ou .csv e devolve as linhas normalizadas (Empresa, Nome, E-mail, Telefone, Cargo, Cidade). */
export async function parseClientFile(file: File): Promise<ClientImportRow[]> {
  const buf = await file.arrayBuffer()
  const wb = XLSX.read(buf, { type: 'array' })
  const ws = wb.Sheets[wb.SheetNames[0]]
  if (!ws) throw new Error('A planilha está vazia.')
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, blankrows: false, defval: '' }) as any[][]
  if (rows.length === 0) throw new Error('A planilha está vazia.')

  // Localiza a linha de cabeçalho (dentro das 5 primeiras) por pelo menos 2 colunas conhecidas
  let headerIdx = -1
  let colMap: Record<number, keyof Omit<ClientImportRow, 'line'>> = {}
  for (let i = 0; i < Math.min(rows.length, 5); i++) {
    const map: Record<number, keyof Omit<ClientImportRow, 'line'>> = {}
    let hits = 0
    for (let j = 0; j < (rows[i] || []).length; j++) {
      const key = HEADER_ALIASES[normHeader(String(rows[i][j]))]
      if (key && !Object.values(map).includes(key)) {
        map[j] = key
        hits++
      }
    }
    if (hits >= 2) {
      headerIdx = i
      colMap = map
      break
    }
  }
  if (headerIdx === -1) {
    throw new Error(
      'Não encontrei as colunas esperadas. Use o cabeçalho: Empresa, Nome, E-mail, Telefone, Cargo, Cidade.',
    )
  }

  const out: ClientImportRow[] = []
  for (let i = headerIdx + 1; i < rows.length; i++) {
    const r = rows[i] || []
    const get = (key: string) => {
      for (const [col, k] of Object.entries(colMap)) {
        if (k === key) return String(r[Number(col)] ?? '').trim()
      }
      return ''
    }
    const row: ClientImportRow = {
      empresa: get('empresa'),
      nome: get('nome'),
      email: normEmail(get('email')),
      telefone: get('telefone'),
      cargo: get('cargo'),
      cidade: get('cidade'),
      line: i + 1,
    }
    // Linha totalmente vazia não entra; linha com dados e sem e-mail vira erro na classificação
    if (row.empresa || row.nome || row.email || row.telefone) out.push(row)
  }
  return out
}

/** Classifica: novos, existentes (mesmo e-mail) e com erro. */
export function classifyRows(rows: ClientImportRow[], clients: ClientRecord[]): ImportSummary {
  const errorRows: ImportSummary['errorRows'] = []
  const newContacts: ClientImportRow[] = []
  const existingContacts: ImportSummary['existingContacts'] = []

  const emailIndex = new Map<string, { client: ClientRecord; contactIdx: number }>()
  for (const c of clients) {
    const emails: { email: string; idx: number }[] = []
    if (c.email) emails.push({ email: normEmail(c.email), idx: -1 })
    ;(c.contacts || []).forEach((ct, idx) => {
      if (ct.email) emails.push({ email: normEmail(ct.email), idx })
    })
    for (const { email, idx } of emails) emailIndex.set(email, { client: c, contactIdx: idx })
  }

  const inFile = new Set<string>()
  for (const row of rows) {
    if (!row.email) {
      errorRows.push({ line: row.line, email: '', reason: 'Sem e-mail' })
      continue
    }
    if (!EMAIL_RE.test(row.email)) {
      errorRows.push({ line: row.line, email: row.email, reason: 'E-mail inválido' })
      continue
    }
    if (inFile.has(row.email)) continue // repetido no próprio arquivo: só a primeira linha entra
    inFile.add(row.email)
    const hit = emailIndex.get(row.email)
    if (hit) existingContacts.push({ row, client: hit.client, contactIdx: hit.contactIdx })
    else newContacts.push(row)
  }

  return {
    newCount: newContacts.length,
    existingCount: existingContacts.length,
    errorRows,
    newContacts,
    existingContacts,
  }
}

export const ClientImportDialog: React.FC<ClientImportDialogProps> = ({
  open,
  onOpenChange,
  clients,
  onImportDone,
}) => {
  const { toast } = useToast()
  const [file, setFile] = useState<File | null>(null)
  const [listName, setListName] = useState('')
  const [summary, setSummary] = useState<ImportSummary | null>(null)
  const [busy, setBusy] = useState(false)

  const reset = () => {
    setFile(null)
    setListName('')
    setSummary(null)
  }

  React.useEffect(() => {
    if (open) reset()
  }, [open])

  const handleSelect = async (f: File | null) => {
    if (!f) return
    setFile(f)
    try {
      const rows = await parseClientFile(f)
      setSummary(classifyRows(rows, clients))
    } catch (err: any) {
      toast({ title: 'Erro ao ler a planilha', description: err.message, variant: 'destructive' })
      setFile(null)
      setSummary(null)
    }
  }

  const handleConfirm = async () => {
    if (!summary || busy) return
    const label = listName.trim()
    if (!label) {
      toast({
        title: 'Informe a etiqueta da lista',
        description: 'Ex.: Prospecção out/26',
        variant: 'destructive',
      })
      return
    }
    setBusy(true)
    try {
      let createdClients = 0
      let updatedClients = 0
      let updatedContacts = 0

      // 1) Novos: agrupa por empresa — uma conta (client) por empresa, contatos dentro
      const byCompany = new Map<string, ClientImportRow[]>()
      for (const r of summary.newContacts) {
        const key = r.empresa || r.nome
        const arr = byCompany.get(key) || []
        arr.push(r)
        byCompany.set(key, arr)
      }
      for (const [company, rows] of byCompany) {
        const contacts: ClientContact[] = rows.map((r) => ({
          name: r.nome || r.empresa,
          role: r.cargo || undefined,
          email: r.email,
          phone: r.telefone || undefined,
          is_primary: true,
          tags: [label],
        }))
        const first = rows[0]
        await clientsService.create({
          name: company,
          company_name: first.empresa || undefined,
          status: 'lead',
          segment: 'Prospecção',
          city: first.cidade || undefined,
          contacts,
          tags: [label],
          assigned_to: 'Alex Nogueira',
        })
        createdClients++
      }

      // 2) Existentes: atualiza o contato do MESMO e-mail (não duplica)
      const clientCache = new Map<string, ClientRecord>()
      for (const { row, client, contactIdx } of summary.existingContacts) {
        let target = clientCache.get(client.id)
        if (!target) {
          try {
            target = await clientsService.getById(client.id)
          } catch {
            target = client
          }
          clientCache.set(client.id, target)
        }
        if (!target) continue
        const contactsArr: ClientContact[] = Array.isArray(target.contacts)
          ? [...target.contacts]
          : []
        if (contactIdx >= 0 && contactsArr[contactIdx]) {
          const ct: ClientContact = { ...contactsArr[contactIdx] }
          if (!ct.name && row.nome) ct.name = row.nome
          if (!ct.phone && row.telefone) ct.phone = row.telefone
          if (!ct.role && row.cargo) ct.role = row.cargo
          ct.tags = Array.from(new Set([...(ct.tags || []), label]))
          contactsArr[contactIdx] = ct
        } else {
          contactsArr.push({
            name: row.nome || row.empresa,
            role: row.cargo || undefined,
            email: row.email,
            phone: row.telefone || undefined,
            is_primary: contactIdx === -1 && contactsArr.length === 0 ? true : undefined,
            tags: [label],
          })
        }
        await clientsService.update(client.id, { contacts: contactsArr })
        updatedClients++
        updatedContacts++
      }

      toast({
        title: 'Importação concluída!',
        description: `${createdClients} contas criadas · ${updatedContacts} contatos gravados/atualizados · etiqueta "${label}".`,
      })
      onImportDone()
      onOpenChange(false)
    } catch (err: any) {
      toast({
        title: 'Erro ao importar',
        description: err.message,
        variant: 'destructive',
      })
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle className="text-base font-bold">Importar planilha de contatos</DialogTitle>
          <DialogDescription className="text-xs">
            .xlsx ou .csv com as colunas Empresa, Nome, E-mail, Telefone, Cargo, Cidade. Mesmo
            e-mail = atualiza o contato, não duplica.
          </DialogDescription>
        </DialogHeader>

        {/* Etiqueta da lista */}
        <div className="space-y-1">
          <Label className="text-xs font-medium">Etiqueta da lista *</Label>
          <Input
            value={listName}
            onChange={(e) => setListName(e.target.value)}
            placeholder="Ex.: Prospecção out/26"
            className="text-xs"
          />
        </div>

        {/* Seleção de arquivo */}
        <label className="block border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-6 text-center cursor-pointer hover:border-indigo-400 transition-colors">
          <input
            type="file"
            accept=".xlsx,.xls,.csv,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            className="hidden"
            onChange={(e) => handleSelect(e.target.files?.[0] || null)}
          />
          <FileSpreadsheet className="h-8 w-8 mx-auto text-indigo-500" />
          <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 mt-2">
            {file ? file.name : 'Clique para escolher o arquivo .xlsx ou .csv'}
          </p>
        </label>

        {/* Prévia */}
        {summary && (
          <div className="space-y-2 rounded-xl border border-slate-200 dark:border-slate-800 p-3 bg-slate-50/60 dark:bg-slate-950/40">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40">
                <div className="text-lg font-extrabold text-emerald-700 dark:text-emerald-400">
                  {summary.newCount}
                </div>
                <div className="text-[10px] font-semibold text-emerald-700/80 uppercase">Novos</div>
              </div>
              <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/40">
                <div className="text-lg font-extrabold text-blue-700 dark:text-blue-400">
                  {summary.existingCount}
                </div>
                <div className="text-[10px] font-semibold text-blue-700/80 uppercase">
                  Já existem
                </div>
              </div>
              <div
                className={`p-2 rounded-lg ${
                  summary.errorRows.length > 0
                    ? 'bg-rose-50 dark:bg-rose-950/40'
                    : 'bg-slate-100 dark:bg-slate-900'
                }`}
              >
                <div className="text-lg font-extrabold text-rose-700 dark:text-rose-400">
                  {summary.errorRows.length}
                </div>
                <div className="text-[10px] font-semibold text-rose-700/80 uppercase">Com erro</div>
              </div>
            </div>

            {summary.errorRows.length > 0 && (
              <div className="max-h-28 overflow-y-auto space-y-1 text-[11px]">
                {summary.errorRows.map((e, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-1.5 text-rose-700 dark:text-rose-400"
                  >
                    <AlertTriangle className="h-3 w-3 shrink-0" />
                    <span>
                      Linha {e.line}: {e.reason}
                      {e.email ? ` (${e.email})` : ''}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {summary.newCount > 0 && (
              <div className="max-h-32 overflow-y-auto space-y-1 text-[11px]">
                <div className="font-semibold text-slate-700 dark:text-slate-200">
                  Novos contatos:
                </div>
                {summary.newContacts.slice(0, 50).map((r, i) => (
                  <div key={i} className="text-slate-600 dark:text-slate-400 truncate">
                    Linha {r.line}: {r.nome || r.empresa}
                    {r.empresa && r.nome ? ` (${r.empresa})` : ''} · {r.email}
                  </div>
                ))}
                {summary.newCount > 50 && (
                  <p className="text-[10px] text-muted-foreground">
                    ... e mais {summary.newCount - 50} novos.
                  </p>
                )}
              </div>
            )}

            {summary.existingCount > 0 && (
              <div className="max-h-28 overflow-y-auto space-y-1 text-[11px]">
                <div className="font-semibold text-slate-700 dark:text-slate-200">
                  Já existem (serão atualizados):
                </div>
                {summary.existingContacts.slice(0, 50).map((x, i) => (
                  <div key={i} className="text-blue-700 dark:text-blue-400 truncate">
                    Linha {x.row.line}: {x.row.email} → {x.client.name}
                  </div>
                ))}
                {summary.existingCount > 50 && (
                  <p className="text-[10px] text-muted-foreground">
                    ... e mais {summary.existingCount - 50} existentes.
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        <DialogFooter className="pt-2">
          <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={!summary || summary.newCount + summary.existingCount === 0 || busy}
            onClick={handleConfirm}
            className="bg-indigo-600 hover:bg-indigo-500"
          >
            {busy ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : null}
            Importar {summary ? `(${summary.newCount + summary.existingCount})` : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
