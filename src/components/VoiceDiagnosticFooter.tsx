/**
 * VoiceDiagnosticFooter — Painel visível de diagnóstico do módulo de voz e permissões.
 *
 * Exibe em tempo real no rodapé da tela /visita-a-campo:
 * - Status da permissão do microfone (prompt / granted / denied)
 * - Navegador e plataforma detectados
 * - Disponibilidade das APIs: getUserMedia, MediaRecorder, Web Speech API
 * - Última ação executada e último erro detalhado ocorrido
 * - Botão de teste rápido de microfone diretamente do painel
 */

import React, { useEffect, useState } from 'react'
import {
  subscribeToVoiceDiagnostic,
  type VoiceDiagnosticInfo,
  detectBrowserEnvironment,
} from '@/hooks/useVoiceRecorder'
import { Activity, ShieldCheck, ShieldAlert, Radio, AlertCircle, RefreshCw } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

export function VoiceDiagnosticFooter() {
  const [diag, setDiag] = useState<VoiceDiagnosticInfo>(() => {
    const env = detectBrowserEnvironment()
    return {
      browserName: env.browserName,
      isIos: env.isIos,
      isAndroid: env.isAndroid,
      isInAppBrowser: env.isInAppBrowser,
      hasGetUserMedia: env.hasGetUserMedia,
      hasMediaRecorder: env.hasMediaRecorder,
      hasSpeechRecognition: env.hasSpeechRecognition,
      permissionState: 'prompt',
      lastError: null,
      lastAction: 'Aguardando interação',
    }
  })

  const [testResult, setTestResult] = useState<string | null>(null)
  const [isTesting, setIsTesting] = useState(false)

  useEffect(() => {
    const unsub = subscribeToVoiceDiagnostic((d) => setDiag(d))
    return unsub
  }, [])

  const runQuickMicTest = async () => {
    setIsTesting(true)
    setTestResult(null)
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        setTestResult('Erro: navigator.mediaDevices.getUserMedia não existe neste navegador')
        return
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const tracks = stream.getAudioTracks()
      const trackLabel = tracks[0]?.label || 'Microfone padrão'
      tracks.forEach((t) => t.stop())
      setTestResult(`Sucesso! Microfone acessado: "${trackLabel}"`)
    } catch (err: any) {
      setTestResult(`Falha no teste: ${err?.name || 'Erro'} - ${err?.message || ''}`)
    } finally {
      setIsTesting(false)
    }
  }

  return (
    <div className="p-3.5 rounded-2xl bg-slate-900 text-slate-100 border border-slate-800 shadow-md space-y-2.5 text-xs font-mono">
      <div className="flex items-center justify-between gap-2 flex-wrap pb-1.5 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-teal-400" />
          <span className="font-bold tracking-tight text-white text-xs">
            Diagnóstico de Gravação de Voz (Tempo Real)
          </span>
          <Badge
            variant="outline"
            className="text-[9.5px] border-teal-500/40 text-teal-300 bg-teal-950/40 px-1.5 py-0"
          >
            Modo Campo
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={runQuickMicTest}
            disabled={isTesting}
            className="h-7 text-[11px] font-sans border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200"
          >
            <RefreshCw className={`h-3 w-3 mr-1 ${isTesting ? 'animate-spin' : ''}`} />
            {isTesting ? 'Testando mic...' : 'Testar Permissão'}
          </Button>
        </div>
      </div>

      {/* Grid de capacidades */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
        {/* Navegador */}
        <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800">
          <span className="text-[10px] text-slate-400 block uppercase">Navegador</span>
          <span className="font-semibold text-teal-300 truncate block">
            {diag.browserName}
            {diag.isInAppBrowser ? ' (In-App)' : ''}
          </span>
        </div>

        {/* Status da Permissão */}
        <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800">
          <span className="text-[10px] text-slate-400 block uppercase">Permissão</span>
          <div className="flex items-center gap-1 font-semibold">
            {diag.permissionState === 'granted' ? (
              <span className="text-emerald-400 flex items-center gap-1">
                <ShieldCheck className="h-3 w-3" /> Concedida
              </span>
            ) : diag.permissionState === 'denied' ? (
              <span className="text-rose-400 flex items-center gap-1">
                <ShieldAlert className="h-3 w-3" /> Bloqueada/Negada
              </span>
            ) : (
              <span className="text-amber-300 flex items-center gap-1">
                <Radio className="h-3 w-3" /> Aguardando toque
              </span>
            )}
          </div>
        </div>

        {/* getUserMedia e MediaRecorder */}
        <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800">
          <span className="text-[10px] text-slate-400 block uppercase">Captura de Áudio</span>
          <span className="text-slate-300">
            gUM: {diag.hasGetUserMedia ? '✓' : '✗'} | Rec:{' '}
            {diag.hasMediaRecorder ? '✓ (Suportado)' : '✗'}
          </span>
        </div>

        {/* Transcrição Nativa */}
        <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800">
          <span className="text-[10px] text-slate-400 block uppercase">Transcrição Nativa</span>
          <span className={diag.hasSpeechRecognition ? 'text-emerald-400' : 'text-amber-300'}>
            {diag.hasSpeechRecognition ? 'Web Speech API ✓' : 'Fallback Gravação (Safari)'}
          </span>
        </div>
      </div>

      {/* Última ação */}
      {diag.lastAction && (
        <div className="text-[11px] text-slate-300 flex items-center gap-1.5 pt-0.5">
          <span className="text-slate-400">Última ação:</span>
          <span className="text-teal-200">{diag.lastAction}</span>
        </div>
      )}

      {/* Último erro se houver */}
      {diag.lastError && (
        <div className="p-2 rounded bg-rose-950/50 border border-rose-800/80 text-rose-300 text-[11px] flex items-start gap-1.5">
          <AlertCircle className="h-3.5 w-3.5 text-rose-400 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-semibold block">Último erro capturado:</span>
            <span className="break-all">{diag.lastError}</span>
          </div>
        </div>
      )}

      {/* Resultado do teste manual de microfone */}
      {testResult && (
        <div
          className={`p-2 rounded text-[11px] ${
            testResult.startsWith('Sucesso')
              ? 'bg-emerald-950/50 border border-emerald-800 text-emerald-300'
              : 'bg-amber-950/50 border border-amber-800 text-amber-300'
          }`}
        >
          {testResult}
        </div>
      )}
    </div>
  )
}
