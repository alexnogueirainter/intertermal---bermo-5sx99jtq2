import { useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function ChangePasswordPage() {
  const { user, isAuthenticated, loading, changePassword, signOut } = useAuth()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  if (!loading && (!isAuthenticated || !user)) return <Navigate to="/login" replace />
  if (!loading && user && !user.must_change_password) return <Navigate to="/" replace />

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    if (newPassword.length < 8) {
      setError('A nova senha precisa ter pelo menos 8 caracteres.')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('A confirmação não confere com a nova senha.')
      return
    }
    setSubmitting(true)
    const result = await changePassword(currentPassword, newPassword)
    setSubmitting(false)
    if (result.error) {
      setError(result.error)
      return
    }
    window.location.replace('/')
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <section className="w-full max-w-md rounded-xl border bg-white p-6 shadow-sm sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">Intertermal</p>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">Crie sua senha pessoal</h1>
        <p className="mt-2 text-sm text-slate-600">
          Por segurança, troque a senha provisória antes de acessar o CRM.
        </p>
        <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="current-password">Senha provisória</Label>
            <Input
              autoComplete="current-password"
              id="current-password"
              onChange={(event) => setCurrentPassword(event.target.value)}
              required
              type="password"
              value={currentPassword}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-password">Nova senha</Label>
            <Input
              autoComplete="new-password"
              id="new-password"
              minLength={8}
              onChange={(event) => setNewPassword(event.target.value)}
              required
              type="password"
              value={newPassword}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirmar nova senha</Label>
            <Input
              autoComplete="new-password"
              id="confirm-password"
              minLength={8}
              onChange={(event) => setConfirmPassword(event.target.value)}
              required
              type="password"
              value={confirmPassword}
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
          <Button className="w-full" disabled={submitting} type="submit">
            {submitting ? 'Atualizando…' : 'Salvar nova senha'}
          </Button>
          <Button className="w-full" onClick={signOut} type="button" variant="outline">
            Sair
          </Button>
        </form>
      </section>
    </main>
  )
}
