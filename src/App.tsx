/* Main App Component - Handles routing (using react-router-dom), query client and other providers - use this file to add all routes */
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import Index from './pages/Index'
import NotFound from './pages/NotFound'
import Layout from './components/Layout'
import { PublicProposalApprovalPage } from './pages/PublicProposalApprovalPage'
import FieldVisitPage from './pages/FieldVisitPage'
import ReceivedFieldVisitsPage from './pages/ReceivedFieldVisitsPage'

// ONLY IMPORT AND RENDER WORKING PAGES, NEVER ADD PLACEHOLDER COMPONENTS OR PAGES IN THIS FILE
// AVOID REMOVING ANY CONTEXT PROVIDERS FROM THIS FILE (e.g. TooltipProvider, Toaster, Sonner)

const App = () => (
  <BrowserRouter>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <Routes>
        {/* Rota pública de aprovação de proposta via link seguro com token (sem login) */}
        <Route path="/aprovar/:token" element={<PublicProposalApprovalPage />} />
        <Route path="/proposta/:token" element={<PublicProposalApprovalPage />} />

        {/* Rota de Visita a Campo para técnicos no celular */}
        <Route path="/visita-a-campo" element={<FieldVisitPage />} />

        {/* Rota de Visitas Recebidas no escritório */}
        <Route path="/visitas-recebidas" element={<ReceivedFieldVisitsPage />} />

        <Route element={<Layout />}>
          <Route path="/" element={<Index />} />
          {/* ADD ALL CUSTOM ROUTES MUST BE ADDED HERE */}
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </TooltipProvider>
  </BrowserRouter>
)

export default App
