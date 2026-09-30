import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import pb from '@/lib/pocketbase/client'

export interface AuthUser {
  id: string
  email?: string
  name?: string
  role?: 'admin' | 'field_user' | string
  is_active?: boolean
  must_change_password?: boolean
}

interface AuthContextValue {
  user: AuthUser | null
  isAuthenticated: boolean
  loading: boolean
  signIn: (
    email: string,
    password: string,
  ) => Promise<{ user: AuthUser | null; error: string | null }>
  signOut: () => void
  changePassword: (
    currentPassword: string,
    newPassword: string,
  ) => Promise<{ error: string | null }>
}

const AuthContext = createContext<AuthContextValue | null>(null)

function isPermittedUser(record: AuthUser | null | undefined): record is AuthUser {
  return Boolean(
    record &&
    record.id &&
    record.is_active !== false &&
    (record.role === 'admin' || record.role === 'field_user'),
  )
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const record = pb.authStore.isValid ? (pb.authStore.record as AuthUser | null) : null
    return isPermittedUser(record) ? record : null
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    const unsubscribe = pb.authStore.onChange((_token, record) => {
      if (!active) return
      setUser(
        pb.authStore.isValid && isPermittedUser(record as AuthUser | null)
          ? (record as AuthUser)
          : null,
      )
    })

    const refreshSession = async () => {
      try {
        if (pb.authStore.isValid) {
          const result = await pb.collection('users').authRefresh()
          if (!isPermittedUser(result.record as AuthUser)) pb.authStore.clear()
        } else if (pb.authStore.record) {
          pb.authStore.clear()
        }
      } catch {
        pb.authStore.clear()
      } finally {
        if (active) {
          const record = pb.authStore.isValid ? (pb.authStore.record as AuthUser | null) : null
          setUser(isPermittedUser(record) ? record : null)
          setLoading(false)
        }
      }
    }

    void refreshSession()
    return () => {
      active = false
      unsubscribe()
    }
  }, [])

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      const result = await pb.collection('users').authWithPassword(email.trim(), password)
      const record = result.record as AuthUser
      if (!isPermittedUser(record)) {
        pb.authStore.clear()
        return { user: null, error: 'Conta inativa ou sem perfil de acesso autorizado.' }
      }
      setUser(record)
      return { user: record, error: null }
    } catch {
      pb.authStore.clear()
      return { user: null, error: 'E-mail ou senha inválidos, ou conta sem acesso ativo.' }
    }
  }, [])

  const signOut = useCallback(() => {
    pb.authStore.clear()
    setUser(null)
  }, [])

  const changePassword = useCallback(
    async (currentPassword: string, newPassword: string) => {
      if (!user || !pb.authStore.isValid) {
        return { error: 'Sua sessão expirou. Entre novamente.' }
      }

      try {
        const updated = await pb.collection('users').update(user.id, {
          oldPassword: currentPassword,
          password: newPassword,
          passwordConfirm: newPassword,
          must_change_password: false,
        })
        pb.authStore.save(pb.authStore.token, updated)
        setUser(updated as unknown as AuthUser)
        return { error: null }
      } catch {
        return {
          error: 'Não foi possível alterar a senha. Confira a senha atual e tente novamente.',
        }
      }
    },
    [user],
  )

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user && pb.authStore.isValid),
      loading,
      signIn,
      signOut,
      changePassword,
    }),
    [user, loading, signIn, signOut, changePassword],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth deve ser usado dentro de AuthProvider.')
  return context
}
