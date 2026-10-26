import { Badge } from '@/components/ui/badge'
import { QuoteStatus } from '@/types/crm'
import { CheckCheck, Clock, Send, XCircle } from 'lucide-react'

export const getStatusBadge = (st: QuoteStatus) => {
  switch (st) {
    case 'approved':
      return (
        <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300 font-semibold text-[11px] gap-1">
          <CheckCheck className="h-3 w-3" /> Aprovada
        </Badge>
      )
    case 'rejected':
      return (
        <Badge className="bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border-rose-300 font-semibold text-[11px] gap-1">
          <XCircle className="h-3 w-3" /> Rejeitada
        </Badge>
      )
    case 'sent':
      return (
        <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-300 font-semibold text-[11px] gap-1">
          <Send className="h-3 w-3" /> Enviada
        </Badge>
      )
    default:
      return (
        <Badge
          variant="outline"
          className="text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 border-slate-300 font-semibold text-[11px] gap-1"
        >
          <Clock className="h-3 w-3" /> Rascunho
        </Badge>
      )
  }
}
