// src/components/field-visit/SteamTrapImportDialog.tsx
// Importação de planilha VKP (XLSX/CSV) para a Inspeção de Purgadores.
// Mesma mecânica do ClientImportDialog: lê o arquivo, localiza o cabeçalho nas 5
// primeiras linhas, mostra PRÉVIA (novos / erros) e só grava após confirmação.
// Nada é gravado antes do botão "Importar N registros".

import React, { useState } from 'react'
import * as XLSX from 'xlsx'
import { FileSpreadsheet, Loader2, AlertTriangle } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { toast } from '@/hooks/use-toast'
import type { SteamTrapRecord } from '@/types/field-visit'
import { STEAM_TRAP_RESULTS, STEAM_TRAP_ACTION_BY_RESULT } from '@/types/field-visit'

interface SteamTrapImportRow {
  line: number
  location: string
  area: string
  tagClient: string
  tagAri: string
  thermoNumber: string
  manufacturer: string
  model: string
  dn: string
  pressureClass: string
  connection: string
  pressureBarg: string
  result: string
  action: string
  lossKgh: number | null
  notes: string
}

interface ImportSummary {
  rows: SteamTrapImportRow[]
  errorRows: { line: number; reason: string }[]
}

const HEADER_ALIASES: Record<string, keyof Omit<SteamTrapImportRow, 'line' | 'lossKgh'>> = {
  // local / equipamento
  'local / equipamento': 'location',
  'local/equipamento': 'location',
  local: 'location',
  equipamento: 'location',
  'local equipamento': 'location',
  ponto: 'location',
  // área instalada
  'área instalada': 'area',
  'area instalada': 'area',
  área: 'area',
  area: 'area',
  setor: 'area',
  // tags (etapa 1)
  'tag ari': 'tagAri',
  tagari: 'tagAri',
  'tag do cliente': 'tagClient',
  'tag cliente': 'tagClient',
  tagclient: 'tagClient',
  'nº termografia': 'thermoNumber',
  'no termografia': 'thermoNumber',
  'n° termografia': 'thermoNumber',
  termografia: 'thermoNumber',
  'nº termog': 'thermoNumber',
  // fabricante / modelo
  fabricante: 'manufacturer',
  marca: 'manufacturer',
  modelo: 'model',
  // dn
  dn: 'dn',
  'dn (mm)': 'dn',
  // classe
  'classe de pressão': 'pressureClass',
  'classe de pressao': 'pressureClass',
  classe: 'pressureClass',
  // conexão
  conexão: 'connection',
  conexao: 'connection',
  conex: 'connection',
  // pressão
  'pressão operação (barg)': 'pressureBarg',
  'pressão operação(barg)': 'pressureBarg',
  'pressão operacao (barg)': 'pressureBarg',
  'pressão (barg)': 'pressureBarg',
  'pressao (barg)': 'pressureBarg',
  pressão: 'pressureBarg',
  pressao: 'pressureBarg',
  barg: 'pressureBarg',
  // resultado
  resultado: 'result',
  'resultado (vkp)': 'result',
  'resultado vkp': 'result',
  status: 'result',
  // ação recomendada
  'ação recomendada': 'action',
  'acao recomendada': 'action',
  ação: 'action',
  acao: 'action',
  // perda
  'perda estimada (kg/h)': 'lossKgh',
  'perda (kg/h)': 'lossKgh',
  'perda estimada(kg/h)': 'lossKgh',
  'perda kg/h': 'lossKgh',
  'kg/h': 'lossKgh',
  // observações
  observações: 'notes',
  observacoes: 'notes',
  obs: 'notes',
}

const normHeader = (h: string) =>
  String(h || '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')

const RESULT_ALIASES: Record<string, string> = {
  'purgador ok': 'Purgador ok',
  ok: 'Purgador ok',
  vazando: 'Vazando',
  'vazando direto': 'Vazando direto',
  represando: 'Represando',
  parado: 'Parado',
  'não avaliado': 'Não Avaliado',
  'nao avaliado': 'Não Avaliado',
  'n/a': 'Não Avaliado',
}

const normResult = (v: string): string | null => {
  const k = normHeader(v)
  if (!k) return null
  if (RESULT_ALIASES[k]) return RESULT_ALIASES[k]
  for (const r of STEAM_TRAP_RESULTS) if (normHeader(r) === k) return r
  return null
}

/** Normaliza número BR/US: "1.234,56" → 1234.56 · "32,25" → 32.25 · "32.25" → 32.25. */
function parseNumberBR(v: string): number | null {
  const s = String(v ?? '')
    .trim()
    .replace(/\s/g, '')
  if (!s) return null
  let cleaned = s
  const hasDot = s.includes('.')
  const hasComma = s.includes(',')
  if (hasDot && hasComma) {
    // o separador que aparece POR ÚLTIMO é o decimal; o outro é milhar
    cleaned =
      s.lastIndexOf(',') > s.lastIndexOf('.')
        ? s.replace(/\./g, '').replace(',', '.')
        : s.replace(/,/g, '')
  } else if (hasComma) {
    cleaned = s.replace(/,/g, '.') // vírgula sola = decimal (padrão BR)
  } // ponto sola = decimal (não mexe — "32.25" continua 32.25)
  const n = Number(cleaned)
  return Number.isFinite(n) ? n : null
}

/** Lê .xlsx ou .csv e devolve as linhas normalizadas + erros. */
export async function parseTrapFile(file: File): Promise<ImportSummary> {
  const buf = await file.arrayBuffer()
  // CSV chega em UTF-8 — decodifica como texto antes do SheetJS (sem isso o parser
  // assume cp1252 e acentos viram lixo, quebrando o casamento dos cabeçalhos).
  const isCsv = /\.csv$/i.test(file.name) || /^text\/(csv|plain)/.test(file.type || '')
  const wb = isCsv
    ? XLSX.read(new TextDecoder('utf-8').decode(buf), { type: 'string' })
    : XLSX.read(buf, { type: 'array' })
  const ws = wb.Sheets[wb.SheetNames[0]]
  if (!ws) throw new Error('A planilha está vazia.')
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, blankrows: false, defval: '' }) as any[][]
  if (rows.length === 0) throw new Error('A planilha está vazia.')

  // Localiza a linha de cabeçalho (dentro das 5 primeiras) por pelo menos 2 colunas conhecidas
  let headerIdx = -1
  let colMap: Record<number, keyof Omit<SteamTrapImportRow, 'line' | 'lossKgh'>> = {}
  let lossCol = -1
  for (let i = 0; i < Math.min(rows.length, 5); i++) {
    const map: Record<number, keyof Omit<SteamTrapImportRow, 'line' | 'lossKgh'>> = {}
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
      'Não encontrei as colunas esperadas. Use o cabeçalho da planilha VKP: Local / equipamento, Área instalada, Fabricante, Modelo, DN, Classe de pressão, Conexão, Pressão operação (barg), Resultado, Ação recomendada, Perda estimada (kg/h).',
    )
  }
  // coluna de perda pode estar fora do map tipado — procura pelo alias
  for (let j = 0; j < (rows[headerIdx] || []).length; j++) {
    if (HEADER_ALIASES[normHeader(String(rows[headerIdx][j]))] === 'lossKgh') lossCol = j
  }

  const out: SteamTrapImportRow[] = []
  const errorRows: ImportSummary['errorRows'] = []
  for (let i = headerIdx + 1; i < rows.length; i++) {
    const r = rows[i] || []
    const get = (key: string) => {
      for (const [col, k] of Object.entries(colMap)) {
        if (k === key) return String(r[Number(col)] ?? '').trim()
      }
      return ''
    }
    const row: SteamTrapImportRow = {
      line: i + 1,
      location: get('location'),
      area: get('area'),
      tagClient: get('tagClient'),
      tagAri: get('tagAri'),
      thermoNumber: get('thermoNumber'),
      manufacturer: get('manufacturer'),
      model: get('model'),
      dn: get('dn'),
      pressureClass: get('pressureClass'),
      connection: get('connection'),
      pressureBarg: get('pressureBarg'),
      result: get('result'),
      action: get('action'),
      lossKgh: lossCol >= 0 ? parseNumberBR(String(r[lossCol] ?? '')) : null,
      notes: get('notes'),
    }
    // Linha totalmente vazia não entra
    if (
      !row.location &&
      !row.area &&
      !row.manufacturer &&
      !row.model &&
      !row.result &&
      row.lossKgh == null
    )
      continue
    if (!row.location && !row.manufacturer && !row.result) {
      errorRows.push({ line: row.line, reason: 'Sem local, fabricante ou resultado' })
      continue
    }
    const result = normResult(row.result)
    if (row.result && !result) {
      errorRows.push({ line: row.line, reason: `Resultado desconhecido: "${row.result}"` })
      continue
    }
    row.result = result || 'Não Avaliado'
    if (!row.action)
      row.action = STEAM_TRAP_ACTION_BY_RESULT[row.result as SteamTrapRecord['result']] || ''
    out.push(row)
  }
  return { rows: out, errorRows }
}

/** Converte as linhas da prévia em registros SteamTrapRecord (IDs gerados no commit). */
export function rowsToTraps(rows: SteamTrapImportRow[]): SteamTrapRecord[] {
  return rows.map((r) => ({
    id: `st-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    seq: 0, // renumerado no commit, pela ordem de chegada
    location: r.location,
    area: r.area,
    tagClient: r.tagClient,
    tagAri: r.tagAri,
    thermoNumber: r.thermoNumber,
    manufacturer: r.manufacturer,
    model: r.model,
    dn: r.dn || '25',
    pressureClass: r.pressureClass || 'ANSI 150',
    connection: r.connection || 'NPT',
    pressureBarg: r.pressureBarg || '3.0',
    result: (r.result as SteamTrapRecord['result']) || 'Não Avaliado',
    action: r.action || 'Sem ação',
    lossKgh: r.lossKgh,
    lossEstimated: false,
    notes: r.notes,
    mediaIds: [],
  }))
}

interface SteamTrapImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImport: (traps: SteamTrapRecord[]) => void
}

export const SteamTrapImportDialog: React.FC<SteamTrapImportDialogProps> = ({
  open,
  onOpenChange,
  onImport,
}) => {
  const [file, setFile] = useState<File | null>(null)
  const [summary, setSummary] = useState<ImportSummary | null>(null)
  const [busy, setBusy] = useState(false)

  const reset = () => {
    setFile(null)
    setSummary(null)
  }

  React.useEffect(() => {
    if (open) reset()
  }, [open])

  const handleSelect = async (f: File | null) => {
    if (!f) return
    setFile(f)
    try {
      const s = await parseTrapFile(f)
      setSummary(s)
    } catch (err: any) {
      toast({ title: 'Erro ao ler a planilha', description: err.message, variant: 'destructive' })
      setFile(null)
      setSummary(null)
    }
  }

  const handleConfirm = () => {
    if (!summary || busy) return
    if (summary.rows.length === 0) {
      toast({
        title: 'Nada para importar',
        description: 'A planilha não trouxe registros válidos.',
        variant: 'destructive',
      })
      return
    }
    setBusy(true)
    const traps = rowsToTraps(summary.rows)
    onImport(traps)
    setBusy(false)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-sm font-bold">Importar planilha VKP</DialogTitle>
          <DialogDescription className="text-xs">
            XLSX ou CSV com as colunas da planilha Bermo: Local / equipamento, Área instalada,
            Fabricante, Modelo, DN, Classe de pressão, Conexão, Pressão operação (barg), Resultado,
            Ação recomendada, Perda estimada (kg/h). Tag ARI, Tag do cliente, Nº termografia e
            Observações são opcionais.
          </DialogDescription>
        </DialogHeader>

        {!summary && (
          <label className="border-2 border-dashed border-sky-300 rounded-xl p-6 text-center cursor-pointer hover:border-sky-500 transition-colors">
            <input
              type="file"
              accept=".xlsx,.xls,.csv,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              className="hidden"
              onChange={(e) => handleSelect(e.target.files?.[0] || null)}
            />
            <FileSpreadsheet className="h-8 w-8 mx-auto text-sky-500" />
            <p className="text-sm font-semibold mt-2">
              {file ? file.name : 'Clique para escolher o arquivo .xlsx ou .csv'}
            </p>
            <p className="text-[11px] text-muted-foreground mt-1">
              O cabeçalho é detectado nas 5 primeiras linhas. Nada é gravado antes da prévia.
            </p>
          </label>
        )}

        {summary && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs">
              <span className="px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
                {summary.rows.length} registro(s) prontos
              </span>
              {summary.errorRows.length > 0 && (
                <span className="px-2 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-semibold inline-flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" /> {summary.errorRows.length} linha(s) com erro
                </span>
              )}
            </div>

            <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-x-auto max-h-72">
              <table className="w-full text-[10.5px]">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-950 text-left">
                    <th className="px-2 py-1.5">#</th>
                    <th className="px-2 py-1.5">Linha</th>
                    <th className="px-2 py-1.5">Local</th>
                    <th className="px-2 py-1.5">Área</th>
                    <th className="px-2 py-1.5">Tag ARI</th>
                    <th className="px-2 py-1.5">Tag cliente</th>
                    <th className="px-2 py-1.5">Termog.</th>
                    <th className="px-2 py-1.5">Fab.</th>
                    <th className="px-2 py-1.5">Modelo</th>
                    <th className="px-2 py-1.5">DN</th>
                    <th className="px-2 py-1.5">Resultado</th>
                    <th className="px-2 py-1.5">kg/h</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.rows.slice(0, 60).map((r, i) => (
                    <tr key={r.line} className="border-t border-slate-100 dark:border-slate-800">
                      <td className="px-2 py-1 font-bold">{i + 1}</td>
                      <td className="px-2 py-1 text-muted-foreground">{r.line}</td>
                      <td className="px-2 py-1">{r.location || '—'}</td>
                      <td className="px-2 py-1">{r.area || '—'}</td>
                      <td className="px-2 py-1">{r.tagAri || '—'}</td>
                      <td className="px-2 py-1">{r.tagClient || '—'}</td>
                      <td className="px-2 py-1">{r.thermoNumber || '—'}</td>
                      <td className="px-2 py-1">{r.manufacturer || '—'}</td>
                      <td className="px-2 py-1">{r.model || '—'}</td>
                      <td className="px-2 py-1">{r.dn || '—'}</td>
                      <td className="px-2 py-1">{r.result}</td>
                      <td className="px-2 py-1">{r.lossKgh != null ? r.lossKgh : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {summary.rows.length > 60 && (
              <p className="text-[10px] text-muted-foreground">
                Prévia mostra os primeiros 60 de {summary.rows.length}. Todos entram ao confirmar.
              </p>
            )}

            {summary.errorRows.length > 0 && (
              <div className="rounded-lg border border-amber-200 bg-amber-50/60 p-2 text-[11px] text-amber-800">
                <b>Linhas ignoradas:</b>
                <ul className="list-disc ml-4 mt-1">
                  {summary.errorRows.slice(0, 10).map((e) => (
                    <li key={e.line}>
                      Linha {e.line}: {e.reason}
                    </li>
                  ))}
                </ul>
                {summary.errorRows.length > 10 && (
                  <span className="text-[10px]">
                    … e mais {summary.errorRows.length - 10}. Corrija na planilha e importe de novo
                    se precisar.
                  </span>
                )}
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          {summary && (
            <Button
              type="button"
              size="sm"
              onClick={handleConfirm}
              disabled={busy || summary.rows.length === 0}
              className="bg-sky-600 hover:bg-sky-700"
            >
              {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
              Importar {summary.rows.length} registro(s)
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
