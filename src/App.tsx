/* Main App Component - Handles routing (using react-router-dom), query client and other providers - use this file to add all routes */
import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import Index from './pages/Index'
import NotFound from './pages/NotFound'
import Layout from './components/Layout'
import { PublicProposalApprovalPage } from './pages/PublicProposalApprovalPage'
import FieldVisitPage from './pages/FieldVisitPage'
import SellerFieldVisitPage from './pages/SellerFieldVisitPage'
import ReceivedFieldVisitsPage from './pages/ReceivedFieldVisitsPage'
import LoginPage from './pages/LoginPage'
import ChangePasswordPage from './pages/ChangePasswordPage'
import { AuthProvider, useAuth } from './lib/auth'

// ONLY IMPORT AND RENDER WORKING PAGES, NEVER ADD PLACEHOLDER COMPONENTS OR PAGES IN THIS FILE
// AVOID REMOVING ANY CONTEXT PROVIDERS FROM THIS FILE (e.g. TooltipProvider, Toaster, Sonner)

function ProtectedRoute() {
  const { user, isAuthenticated, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 text-sm text-slate-600">
        Verificando acesso…
      </main>
    )
  }
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }
  if (user.must_change_password && location.pathname !== '/trocar-senha') {
    return <Navigate to="/trocar-senha" replace />
  }
  if (
    user.role === 'field_user' &&
    location.pathname !== '/visita-a-campo' &&
    location.pathname !== '/trocar-senha'
  ) {
    return <Navigate to="/visita-a-campo" replace />
  }
  return <Outlet />
}

const App = () => (
  <AuthProvider>
    <BrowserRouter>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <Routes>
          {/* Fluxos públicos mantidos; os dados correspondentes devem ser autorizados por token no backend. */}
          <Route path="/aprovar/:token" element={<PublicProposalApprovalPage />} />
          <Route path="/proposta/:token" element={<PublicProposalApprovalPage />} />
          <Route path="/visita-vendedor" element={<SellerFieldVisitPage />} />

          <Route path="/login" element={<LoginPage />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/trocar-senha" element={<ChangePasswordPage />} />
            <Route path="/visita-a-campo" element={<FieldVisitPage />} />
            <Route path="/visitas-recebidas" element={<ReceivedFieldVisitsPage />} />
            <Route element={<Layout />}>
              <Route path="/" element={<Index />} />
              {/* ADD ALL CUSTOM ROUTES MUST BE ADDED HERE */}
            </Route>
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </TooltipProvider>
    </BrowserRouter>
  </AuthProvider>
)
export default App
