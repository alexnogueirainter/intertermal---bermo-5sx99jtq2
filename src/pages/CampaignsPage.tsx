import React from 'react'
import { Megaphone } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { CampaignsManager } from '@/components/CampaignsManager'

/**
 * Página dedicada da tela Campanhas (rota /campanhas) — usada no menu mobile
 * e acessível por URL direta. O conteúdo vive em CampaignsManager (mesma tela
 * da aba Comercial no desktop).
 */
export default function CampaignsPage() {
  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="mx-auto max-w-6xl p-4 sm:p-6 lg:p-8 space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-teal-700 via-teal-600 to-emerald-500 flex items-center justify-center text-white shadow-md shadow-teal-500/20">
            <Megaphone className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
              INTERTERMAL · Campanhas
            </h1>
            <p className="text-[11px] text-teal-700 dark:text-teal-400 font-semibold">
              Comercial · E-mail em massa via Resend
            </p>
          </div>
        </div>

        <Card className="border-0 shadow-none bg-transparent">
          <CardContent className="p-0">
            <CampaignsManager />
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
