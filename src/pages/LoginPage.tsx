import { useState, type FormEvent } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function LoginPage() {
  const { isAuthenticated, loading, signIn } = useAuth()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
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
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <section className="w-full max-w-md rounded-xl border bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-6">
          <p className="text-sm font-semibold uppercase tracking-wide text-[#12a8aa]">
            Intertermal
          </p>
          <h1 className="mt-2 text-2xl font-bold text-slate-900">Entrar no CRM</h1>
          <p className="mt-2 text-sm text-slate-600">Use sua conta corporativa para continuar.</p>
        </div>
        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input
              autoComplete="username"
              id="email"
              name="email"
              onChange={(event) => setEmail(event.target.value)}
              required
              type="email"
              value={email}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <Input
              autoComplete="current-password"
              id="password"
              name="password"
              onChange={(event) => setPassword(event.target.value)}
              required
              type="password"
              value={password}
            />
          </div>
          {error && (
            <p
              aria-live="polite"
              className="rounded-md bg-red-50 p-3 text-sm text-red-700"
              role="alert"
            >
              {error}
            </p>
          )}
          <Button className="w-full" disabled={submitting || loading} type="submit">
            {submitting ? 'Entrando…' : 'Entrar'}
          </Button>
        </form>
        <p className="mt-6 text-xs text-slate-500">
          Se não tiver acesso, solicite ao administrador.
        </p>
      </section>
    </main>
  )
}
