import React, { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Link2,
  ShieldAlert,
  Loader2,
  Plus,
  Pencil,
  RefreshCw,
  ClipboardList,
  CheckCircle2,
  WifiOff,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import FieldVisitPage from './FieldVisitPage'
import {
  sellerTokenApi,
  getStoredToken,
  getStoredDeviceId,
  SELLER_TOKEN_KEY,
} from '@/services/field-visit-token'
import { recordToFieldVisitData, type FieldVisitData } from '@/types/field-visit'

/**
 * Página do vendedor: visita a campo via link com token (sem login).
 * Segurança nível médio: 1 token = 1 aparelho autorizado.
 * Modos pela URL:
 *  - ?t=<token>  : ativação do link (vincula o aparelho na 1ª vez)
 *  - ?lista=1    : "Minhas visitas" (lista e edição)
 *  - ?editar=<id>: abre o formulário com a visita carregada (busca segura)
 *  - padrão      : formulário de nova visita
 */
type AccessStatus = 'checking' | 'ok' | 'invalid' | 'device' | 'network'

function CenteredLoader({ text }: { text: string }) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center gap-3 px-6">
      <Loader2 className="h-8 w-8 animate-spin text-teal-700" />
      <p className="text-sm text-slate-600 dark:text-slate-400">{text}</p>
    </div>
  )
}

function AccessError({
  icon,
  title,
  text,
  onRetry,
}: {
  icon: React.ReactNode
  title: string
  text: string
  onRetry?: () => void
}) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center px-6">
      <Card className="w-full max-w-sm border-slate-200 dark:border-slate-800">
        <CardContent className="pt-8 pb-8 flex flex-col items-center text-center gap-3">
          <div className="h-14 w-14 rounded-2xl bg-rose-100 dark:bg-rose-950/60 flex items-center justify-center">
            {icon}
          </div>
          <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">{title}</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">{text}</p>
          {onRetry && (
            <Button variant="outline" size="sm" onClick={onRetry} className="mt-2">
              <RefreshCw className="h-4 w-4 mr-1.5" />
              Tentar novamente
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default function SellerFieldVisitPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const urlToken = searchParams.get('t') || ''
  const listMode = searchParams.get('lista') === '1'
  const editId = searchParams.get('editar') || ''

  const [status, setStatus] = useState<AccessStatus>('checking')
  const [sellerName, setSellerName] = useState('')
  const [initialVisitData, setInitialVisitData] = useState<FieldVisitData | null>(null)
  const [loadingVisit, setLoadingVisit] = useState(false)
  const [visits, setVisits] = useState<any[]>([])
  const [loadingList, setLoadingList] = useState(false)

  const activate = useCallback(async (token: string) => {
    const res = await sellerTokenApi.bind(token, getStoredDeviceId())
    if (res.ok && res.seller_name) {
      try {
        localStorage.setItem(SELLER_TOKEN_KEY, token)
      } catch (_) {
        // localStorage indisponível: segue sem persistir o token
      }
      setSellerName(res.seller_name)
      setStatus('ok')
      return true
    }
    if (res.error === 'device_not_authorized') setStatus('device')
    else if (res.error === 'network_error') setStatus('network')
    else setStatus('invalid')
    return false
  }, [])

  // Ativação por link (?t=...) ou revalidação silenciosa do token salvo
  useEffect(() => {
    if (urlToken) {
      setStatus('checking')
      activate(urlToken).then((ok) => {
        if (ok) setSearchParams({}, { replace: true }) // limpa o token da URL
      })
      return
    }
    const stored = getStoredToken()
    if (!stored) {
      setStatus('invalid')
      return
    }
    setStatus('checking')
    activate(stored)
  }, [urlToken, activate])

  // Lista "Minhas visitas"
  const loadVisits = useCallback(async () => {
    setLoadingList(true)
    const res = await sellerTokenApi.myVisits(getStoredToken(), getStoredDeviceId())
    if (res.ok && res.visits) setVisits(res.visits)
    setLoadingList(false)
  }, [])

  useEffect(() => {
    if (status === 'ok' && listMode) loadVisits()
  }, [status, listMode, loadVisits])

  // Modo edição: busca segura (só a própria visita do token)
  useEffect(() => {
    if (status !== 'ok' || !editId) return
    setLoadingVisit(true)
    setInitialVisitData(null)
    sellerTokenApi.getVisit(getStoredToken(), getStoredDeviceId(), editId).then((res) => {
      if (res.ok && res.visit) {
        const { data } = recordToFieldVisitData(res.visit)
        data.backendRecordId = res.visit.id
        data.crmStatus = 'enviada'
        data.lastSentAt = res.visit.sent_at || res.visit.created
        setInitialVisitData(data)
      }
      setLoadingVisit(false)
    })
  }, [status, editId])

  if (status === 'checking') {
    return <CenteredLoader text="Verificando seu acesso..." />
  }

  if (status === 'invalid') {
    return (
      <AccessError
        icon={<Link2 className="h-7 w-7 text-rose-600" />}
        title="Link inválido"
        text="Este link não está ativo. Peça um novo link de acesso ao Alex."
      />
    )
  }

  if (status === 'device') {
    return (
      <AccessError
        icon={<ShieldAlert className="h-7 w-7 text-rose-600" />}
        title="Aparelho não autorizado"
        text="Este link já está vinculado a outro celular. Fale com o Alex para liberar este aparelho."
      />
    )
  }

  if (status === 'network') {
    return (
      <AccessError
        icon={<WifiOff className="h-7 w-7 text-amber-600" />}
        title="Sem conexão"
        text="Não foi possível verificar seu acesso. Confira a internet e tente de novo."
        onRetry={() => window.location.reload()}
      />
    )
  }

  // ---- Modo: Minhas visitas ----
  if (listMode) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-24">
        <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
          <div className="max-w-3xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-sm tracking-tight text-teal-800 dark:text-teal-400">
                    INTERTERMAL
                  </span>
                  <span className="text-[10px] bg-teal-100 dark:bg-teal-900/60 text-teal-800 dark:text-teal-300 font-bold px-1.5 py-0.2 rounded">
                    BERMO
                  </span>
                </div>
                <h1 className="text-base font-bold leading-tight">Minhas visitas</h1>
              </div>
              <Badge
                variant="outline"
                className="bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 border-teal-200 dark:border-teal-900"
              >
                {sellerName}
              </Badge>
            </div>
          </div>
        </header>

        <main className="max-w-3xl mx-auto px-4 py-4 space-y-3">
          {loadingList ? (
            <div className="flex items-center justify-center py-16 gap-2 text-sm text-slate-500">
              <Loader2 className="h-5 w-5 animate-spin" /> Carregando...
            </div>
          ) : visits.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="pt-8 pb-8 flex flex-col items-center text-center gap-2">
                <ClipboardList className="h-10 w-10 text-slate-300" />
                <p className="text-sm text-slate-500">
                  Você ainda não enviou visitas. Toque em "Nova visita" para começar.
                </p>
              </CardContent>
            </Card>
          ) : (
            visits.map((v) => (
              <Card key={v.id} className="border-slate-200 dark:border-slate-800">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-sm truncate">
                        {v.company_name || v.client_name || 'Visita sem cliente'}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {v.visit_date || 'sem data'} · {v.work_type || 'tipo não informado'}
                      </p>
                      <div className="mt-1.5">
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400">
                          {v.status === 'enviada'
                            ? 'ENVIADA'
                            : String(v.status || '').toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="shrink-0 text-xs h-8 border-teal-300 dark:border-teal-800 text-teal-800 dark:text-teal-300"
                      onClick={() => {
                        window.location.href = `/visita-vendedor?editar=${v.id}`
                      }}
                    >
                      <Pencil className="h-3.5 w-3.5 mr-1" />
                      Editar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </main>

        <div className="fixed bottom-0 left-0 right-0 border-t border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-3">
          <div className="max-w-3xl mx-auto flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-11 flex-1 text-xs"
              onClick={loadVisits}
              disabled={loadingList}
            >
              <RefreshCw className={`h-4 w-4 mr-1 ${loadingList ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
            <Button
              size="sm"
              className="h-11 flex-1 text-xs font-bold bg-teal-700 hover:bg-teal-600 text-white"
              onClick={() => {
                window.location.href = '/visita-vendedor'
              }}
            >
              <Plus className="h-4 w-4 mr-1" />
              Nova visita
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // ---- Modo: formulário (nova visita ou edição) ----
  if (editId && loadingVisit) {
    return <CenteredLoader text="Carregando sua visita..." />
  }

  return (
    <FieldVisitPage
      key={editId || 'nova-visita'}
      sellerMode
      sellerName={sellerName}
      initialVisitData={initialVisitData}
    />
  )
}
