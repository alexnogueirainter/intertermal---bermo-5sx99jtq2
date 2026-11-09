import React from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Phone, UserPlus, CalendarClock, XCircle, Loader2 } from 'lucide-react'
import type { ActivityRecord } from '@/types/crm'

interface QuickReturnContactsProps {
  activities: ActivityRecord[]
  onConvert: (id: string) => void
  onSnooze: (id: string) => void
  onDiscard: (id: string) => void
}

const fmtDate = (iso?: string) => {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  return d.toLocaleDateString('pt-BR')
}

/**
 * Painel "Contatos a retornar" — lista as atividades criadas pelo botão
 * "+ Contato rápido" que ainda estão pendentes. Vencidos em vermelho.
 * Ações: Virar oportunidade · Adiar 1 dia · Descartar.
 * some quando não há contatos pendentes (não ocupa espaço no painel).
 */
export const QuickReturnContacts: React.FC<QuickReturnContactsProps> = ({
  activities,
  onConvert,
  onSnooze,
  onDiscard,
}) => {
  const [busyId, setBusyId] = React.useState<string>('')

  const items = activities
    .filter((a) => (a as any).quick_contact && a.status === 'pending')
    .sort((a, b) => new Date(a.due_date || 0).getTime() - new Date(b.due_date || 0).getTime())

  if (items.length === 0) return null

  const run = (id: string, fn: (id: string) => void) => {
    if (busyId) return
    setBusyId(id)
    try {
      fn(id)
    } finally {
      setTimeout(() => setBusyId(''), 1200)
    }
  }

  return (
    <Card className="border-amber-300 dark:border-amber-900/60 shadow-xs">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Phone className="h-4 w-4 text-amber-600" />
            Contatos a retornar
          </CardTitle>
          <CardDescription className="text-xs">
            Capturados no botão "+ Contato rápido" — quem espera retorno seu.
          </CardDescription>
        </div>
        <Badge className="bg-amber-500 text-white text-[10px] px-1.5">{items.length}</Badge>
      </CardHeader>
      <CardContent className="space-y-2.5">
        {items.map((a) => {
          const due = a.due_date ? new Date(a.due_date).getTime() : 0
          const overdue = due > 0 && due < Date.now()
          const company = a.client_name && a.client_name !== a.title ? a.client_name : ''
          return (
            <div
              key={a.id}
              className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl border transition-all ${
                overdue
                  ? 'border-rose-300 dark:border-rose-900/60 bg-rose-50/60 dark:bg-rose-950/20'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/40'
              }`}
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                    {a.title}
                  </span>
                  {overdue ? (
                    <Badge className="bg-rose-600 text-white text-[9px] px-1.5 uppercase">
                      Vencido
                    </Badge>
                  ) : null}
                </div>
                <div className="text-[11px] text-muted-foreground mt-0.5 truncate">
                  {[company, a.contact_phone || a.description || ''].filter(Boolean).join(' · ')}
                </div>
                <div
                  className={`text-[11px] font-semibold mt-0.5 ${
                    overdue
                      ? 'text-rose-700 dark:text-rose-400'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Retornar: {fmtDate(a.due_date)} {a.time || '09:00'}
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                <Button
                  size="sm"
                  onClick={() => run(a.id, onConvert)}
                  disabled={!!busyId}
                  className="h-7 text-[11px] bg-teal-700 hover:bg-teal-600 text-white"
                >
                  {busyId === a.id ? (
                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  ) : (
                    <UserPlus className="h-3 w-3 mr-1" />
                  )}
                  Virar oportunidade
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => run(a.id, onSnooze)}
                  disabled={!!busyId}
                  className="h-7 text-[11px]"
                >
                  <CalendarClock className="h-3 w-3 mr-1" />
                  Adiar 1 dia
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => run(a.id, onDiscard)}
                  disabled={!!busyId}
                  className="h-7 text-[11px] border-rose-200 text-rose-600 hover:bg-rose-50 dark:border-rose-900 dark:text-rose-400"
                >
                  <XCircle className="h-3 w-3 mr-1" />
                  Descartar
                </Button>
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
