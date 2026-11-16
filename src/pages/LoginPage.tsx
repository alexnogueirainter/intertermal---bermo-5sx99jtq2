import { useState, type FormEvent } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  Flame,
  Loader2,
  Lock,
  Mail,
  Wrench,
} from 'lucide-react'

/** Símbolo oficial Intertermal (dois "U" intercalados) em versão clara, para fundos escuros. */
function BrandMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 208 264" className={className} aria-hidden="true">
      <path
        d="M 8 8 L 8 168 Q 8 228 68 228 Q 128 228 128 168 L 128 8 L 96 8 L 96 164 Q 96 196 68 196 Q 40 196 40 164 L 40 8 Z"
        fill="#ffffff"
      />
      <path
        d="M 64 8 L 64 148 Q 64 192 100 192 Q 136 192 136 148 L 136 8 L 104 8 L 104 144 Q 104 168 100 168 Q 90 168 90 144 L 90 8 Z"
        fill="#007DC5"
        opacity="0.92"
      />
    </svg>
  )
}

const HIGHLIGHTS = [
  {
    icon: Wrench,
    title: 'Ordens de serviço e visitas a campo',
    description: 'Acompanhe execução, checklists e evidências em tempo real.',
  },
  {
    icon: Flame,
    title: 'Especialista em produtos BERMO',
    description: 'Trocadores a placas, válvulas ARI e acessórios industriais.',
  },
  {
    icon: CheckCircle2,
    title: 'Orçamentos com formação de preço',
    description: 'Do dimensionamento técnico à proposta aprovada pelo cliente.',
  },
] as const

export default function LoginPage() {
  const { isAuthenticated, loading, signIn } = useAuth()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  if (!loading && isAuthenticated) {
    return <Navigate to={(location.state as { from?: string } | null)?.from || '/'} replace />
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    const result = await signIn(email, password)
    setSubmitting(false)
    if (result.error) setError(result.error)
  }

  return (
    <main className="flex min-h-screen flex-col bg-white lg:grid lg:grid-cols-[1.05fr_1fr]">
      {/* Painel de marca — visível como faixa no desktop, cabeçalho compacto no mobile */}
      <section className="relative overflow-hidden bg-[#000031] lg:flex lg:flex-col lg:justify-between">
        {/* brilhos decorativos */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-24 -top-24 h-96 w-96 rounded-full bg-[#007DC5]/30 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-32 -right-16 h-96 w-96 rounded-full bg-[#007DC5]/20 blur-3xl"
        />
        {/* malha fina lembrando placas de trocador */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              'linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)',
            backgroundSize: '44px 44px',
          }}
        />

        <div className="relative flex h-full flex-col justify-between px-6 py-8 sm:px-10 lg:px-14 lg:py-12">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/15 bg-white/10 backdrop-blur-sm">
              <BrandMark className="h-6 w-auto" />
            </div>
            <div className="leading-tight">
              <p className="text-base font-extrabold tracking-[0.18em] text-white">INTER</p>
              <p className="text-sm font-bold tracking-[0.22em] text-[#5db6e8]">TERMAL</p>
            </div>
            <span
              aria-hidden="true"
              className="ml-2 hidden h-8 w-px bg-white/20 sm:block lg:block"
            />
            <p className="hidden text-[11px] font-semibold uppercase tracking-[0.2em] text-white/60 sm:block">
              Sistemas de Troca Térmica
            </p>
          </div>

          <div className="hidden py-10 lg:block lg:py-0">
            <h2 className="max-w-md text-3xl font-bold leading-tight text-white xl:text-4xl">
              A gestão completa dos seus serviços térmicos em um só lugar.
            </h2>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-white/70">
              Plataforma interna Intertermal — CRM, serviços técnicos e produtos BERMO.
            </p>

            <ul className="mt-10 space-y-5">
              {HIGHLIGHTS.map(({ icon: Icon, title, description }) => (
                <li key={title} className="flex items-start gap-4">
                  <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/10 text-[#5db6e8]">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-white">{title}</p>
                    <p className="mt-0.5 text-sm leading-relaxed text-white/60">{description}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <p className="hidden text-xs text-white/40 lg:block">
            © {new Date().getFullYear()} Intertermal · Acesso restrito a colaboradores.
          </p>
        </div>
      </section>

      {/* Painel do formulário */}
      <section className="flex flex-1 items-center justify-center bg-slate-50 px-4 py-10 sm:px-8 lg:bg-white lg:px-14">
        <div className="w-full max-w-md">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-lg shadow-slate-900/5 sm:p-8 lg:rounded-none lg:border-none lg:bg-transparent lg:p-0 lg:shadow-none">
            <div className="lg:hidden">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#007DC5]">
                Intertermal
              </p>
              <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
                Acesse sua conta
              </h1>
              <p className="mt-1.5 text-sm text-slate-600">
                Use seu e-mail corporativo para continuar.
              </p>
            </div>
            <div className="hidden lg:block">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#007DC5]">
                Plataforma Intertermal
              </p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
                Acesse sua conta
              </h1>
              <p className="mt-2 text-sm text-slate-600">
                Digite suas credenciais para entrar no CRM.
              </p>
            </div>

            <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700" htmlFor="email">
                  E-mail
                </Label>
                <div className="relative">
                  <Mail
                    aria-hidden="true"
                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                  />
                  <Input
                    autoComplete="username"
                    className="h-11 rounded-lg border-slate-300 bg-white pl-10 text-[15px] text-slate-900 transition-colors placeholder:text-slate-400 focus-visible:border-[#007DC5] focus-visible:ring-[#007DC5]/25 focus-visible:ring-2 focus-visible:ring-offset-0"
                    disabled={submitting}
                    id="email"
                    name="email"
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="voce@intertermal.com.br"
                    required
                    type="email"
                    value={email}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700" htmlFor="password">
                  Senha
                </Label>
                <div className="relative">
                  <Lock
                    aria-hidden="true"
                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                  />
                  <Input
                    autoComplete="current-password"
                    className="h-11 rounded-lg border-slate-300 bg-white pl-10 pr-11 text-[15px] text-slate-900 transition-colors placeholder:text-slate-400 focus-visible:border-[#007DC5] focus-visible:ring-[#007DC5]/25 focus-visible:ring-2 focus-visible:ring-offset-0"
                    disabled={submitting}
                    id="password"
                    name="password"
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Sua senha de acesso"
                    required
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                  />
                  <button
                    aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                    className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007DC5]/40"
                    onClick={() => setShowPassword((value) => !value)}
                    tabIndex={-1}
                    type="button"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" aria-hidden="true" />
                    ) : (
                      <Eye className="h-4 w-4" aria-hidden="true" />
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <div
                  aria-live="polite"
                  className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
                  role="alert"
                >
                  <AlertCircle
                    className="mt-0.5 h-4 w-4 shrink-0 text-red-500"
                    aria-hidden="true"
                  />
                  <span>{error}</span>
                </div>
              )}

              <Button
                className={cn(
                  'h-11 w-full rounded-lg bg-[#007DC5] text-[15px] font-semibold text-white shadow-md shadow-[#007DC5]/25 transition-all',
                  'hover:bg-[#0069a6] hover:shadow-lg hover:shadow-[#007DC5]/30',
                  'focus-visible:ring-2 focus-visible:ring-[#007DC5]/50 focus-visible:ring-offset-2',
                  'disabled:cursor-not-allowed disabled:opacity-60',
                )}
                disabled={submitting || loading}
                type="submit"
              >
                {submitting ? (
                  <>
                    <Loader2 aria-hidden="true" className="mr-2 h-4 w-4 animate-spin" />
                    Entrando…
                  </>
                ) : (
                  <>
                    Entrar
                    <ArrowRight aria-hidden="true" className="ml-1.5 h-4 w-4" />
                  </>
                )}
              </Button>
            </form>

            <div className="mt-7 border-t border-slate-200 pt-5">
              <p className="text-center text-xs leading-relaxed text-slate-500">
                Não tem acesso?{' '}
                <span className="font-medium text-slate-700">
                  Solicite seu cadastro ao administrador do sistema.
                </span>
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
