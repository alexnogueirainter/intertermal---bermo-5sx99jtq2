/**
 * VoiceDictationField — Componente Autocontido de Gravação e Ditado por Voz
 *
 * Atende às seguintes regras:
 * 1. Mantém posição, tamanho e estilo visual padrão do botão de gravar.
 * 2. Toque único: Inicia chamada direta ao microfone, sem checagens que abortem.
 * 3. Estados visuais: "Gravando..." com cronômetro em tempo real, "Transcrevendo...", "Transcrição salva".
 * 4. Caminho duplo: Web Speech API (Chrome/Android) e MediaRecorder com preservação do áudio e opção de anexo (Safari).
 * 5. Salvamento aditivo imediato: nunca sobrescreve o texto existente; preserva digitação manual.
 * 6. Exibição clara e amigável de erros de permissão com botão "Tentar novamente" sem recarregar a página.
 */

import React from 'react'
import {
  Mic,
  MicOff,
  Loader2,
  Check,
  CheckCircle2,
  Lock,
  RotateCcw,
  Volume2,
  X,
  FileAudio,
  ExternalLink,
  Layers,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useVoiceRecorder, detectBrowserEnvironment } from '@/hooks/useVoiceRecorder'

export interface VoiceDictationFieldProps {
  label: string
  sublabel?: string
  value: string
  onChange: (val: string) => void
  placeholder?: string
  rows?: number
  onSaveAudioAttachment?: (file: { blob: Blob; dataUrl: string; name: string }) => void
}

export function VoiceDictationField({
  label,
  sublabel,
  value,
  onChange,
  placeholder,
  rows = 4,
  onSaveAudioAttachment,
}: VoiceDictationFieldProps) {
  const {
    state,
    isRecording,
    recordingSeconds,
    interimTranscript,
    audioDetected,
    errorMessage,
    exactErrorDetail,
    permissionDenied,
    isInIframe,
    recordedAudioUrl,
    recordedAudioBlob,
    isMediaRecorderFallback,
    toggleRecording,
    clearError,
    retryPermission,
    saveRecordedAudioAsAttachment,
    openInNewTab,
  } = useVoiceRecorder({
    value,
    onChange,
    onSaveAudioAttachment,
  })

  const env = detectBrowserEnvironment()

  return (
    <div className="space-y-2">
      {/* Banner destacado quando a página estiver embutida em iframe */}
      {isInIframe && (
        <div className="p-3 rounded-xl bg-amber-500/10 dark:bg-amber-950/40 border-2 border-amber-500/40 text-amber-950 dark:text-amber-200 text-xs space-y-2 shadow-xs animate-in fade-in">
          <div className="flex items-start gap-2.5">
            <Layers className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1 flex-1">
              <p className="font-bold text-xs text-amber-950 dark:text-amber-100 flex items-center gap-1.5">
                <span>Página aberta dentro de um quadro</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-200/70 dark:bg-amber-900/70 text-amber-900 dark:text-amber-200">
                  iframe
                </span>
              </p>
              <p className="text-[11px] leading-relaxed text-amber-900/90 dark:text-amber-200/90">
                O navegador bloqueia o microfone quando a página roda embutida em outra página.
                Toque no botão abaixo para abrir o sistema em uma aba própria e gravar por lá.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1 border-t border-amber-300/60 dark:border-amber-800/60">
            <Button
              type="button"
              size="sm"
              onClick={openInNewTab}
              className="h-8 text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white shadow-xs"
            >
              <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
              Abrir em nova aba
            </Button>
            <span className="text-[10.5px] text-amber-800 dark:text-amber-300">
              Abre diretamente em tela cheia com microfone liberado
            </span>
          </div>
        </div>
      )}

      {/* Cabeçalho do campo com rótulo e botão de gravar na posição e tamanho atuais */}
      <div className="flex items-center justify-between gap-2">
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
            {label}
          </label>
          {sublabel && <p className="text-[11px] text-muted-foreground">{sublabel}</p>}
        </div>

        {/* Botão de Gravação — Mantém exatamente a posição e as classes de tamanho */}
        <Button
          type="button"
          variant={isRecording ? 'destructive' : 'outline'}
          size="sm"
          onClick={toggleRecording}
          className={`h-8 text-xs px-2.5 font-semibold transition-all ${
            isRecording
              ? 'animate-pulse ring-2 ring-rose-400 bg-rose-600 text-white'
              : state === 'transcribing'
                ? 'border-amber-300 bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300'
                : state === 'saved'
                  ? 'border-emerald-400 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                  : 'border-teal-300 dark:border-teal-800 text-teal-800 dark:text-teal-300 hover:bg-teal-50'
          }`}
          title={
            isRecording
              ? 'Toque para parar e salvar a fala'
              : state === 'transcribing'
                ? 'Transcrevendo áudio...'
                : state === 'saved'
                  ? 'Transcrição salva no campo'
                  : 'Gravar voz com transcrição automática'
          }
        >
          {isRecording ? (
            <>
              <MicOff className="h-3.5 w-3.5 mr-1" />
              Gravando...
            </>
          ) : state === 'transcribing' ? (
            <>
              <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin text-amber-600" />
              Transcrevendo...
            </>
          ) : state === 'saved' ? (
            <>
              <Check className="h-3.5 w-3.5 mr-1 text-emerald-600" />
              Transcrição salva
            </>
          ) : (
            <>
              <Mic className="h-3.5 w-3.5 mr-1 text-teal-600 dark:text-teal-400" />
              Gravar voz
            </>
          )}
        </Button>
      </div>

      {/* Caixa de aviso de permissão ou erro do microfone com passo a passo e Tentar Novamente */}
      {errorMessage && (
        <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs space-y-2 animate-in fade-in">
          <div className="flex items-start gap-2">
            <Lock className="h-4 w-4 text-amber-700 shrink-0 mt-0.5" />
            <div className="space-y-1 flex-1">
              <p className="font-semibold text-xs text-amber-950 dark:text-amber-100">
                {permissionDenied
                  ? 'Permissão do Microfone Necessária'
                  : 'Aviso do Gravador de Voz'}
              </p>
              <p className="text-[11px] leading-relaxed">{errorMessage}</p>

              {exactErrorDetail && (
                <p className="text-[10px] font-mono bg-white/70 dark:bg-black/40 p-1.5 rounded text-amber-900/80 dark:text-amber-300/80 border border-amber-200 dark:border-amber-900">
                  {exactErrorDetail}
                </p>
              )}

              {permissionDenied && (
                <div className="pt-1 text-[11px] text-slate-700 dark:text-slate-300 space-y-1">
                  <p className="font-semibold">Como resolver o bloqueio do microfone:</p>
                  {isInIframe ? (
                    <div className="p-2 rounded bg-amber-100/70 dark:bg-amber-900/40 border border-amber-300/80 space-y-1.5">
                      <p className="text-[10.5px] font-medium text-amber-950 dark:text-amber-100">
                        A página está dentro de um quadro embutido (iframe). Os navegadores
                        bloqueiam o microfone nesse modo mesmo quando as permissões do site estão
                        ativas.
                      </p>
                      <Button
                        type="button"
                        size="sm"
                        onClick={openInNewTab}
                        className="h-7 text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white"
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        Abrir em nova aba para gravar
                      </Button>
                    </div>
                  ) : env.isIos ? (
                    <p className="text-[10.5px] leading-relaxed">
                      No Safari iOS: toque no botão <strong>aA</strong> na barra de endereços &gt;{' '}
                      <strong>Ajustes do Site</strong> &gt; Microfone: selecione{' '}
                      <strong>Permitir</strong>. Em seguida verifique em Ajustes do iPhone &gt;
                      Privacidade e Segurança &gt; Microfone.
                    </p>
                  ) : env.isAndroid ? (
                    <p className="text-[10.5px] leading-relaxed">
                      No Chrome Android: toque no ícone de <strong>Cadeado</strong> ou{' '}
                      <strong>Trava</strong> ao lado da URL &gt; <strong>Permissões</strong> &gt;
                      libere o <strong>Microfone</strong>.
                    </p>
                  ) : (
                    <div className="space-y-1 text-[10.5px] leading-relaxed">
                      <p>
                        <strong>Passo 1 (Navegador):</strong> Toque no ícone de{' '}
                        <strong>Cadeado / Trava</strong> ao lado do endereço (URL) e altere o
                        microfone para <strong>Permitir</strong>.
                      </p>
                      <p>
                        <strong>Passo 2 (Windows):</strong> Acesse{' '}
                        <strong>
                          Configurações do Windows &gt; Privacidade e segurança &gt; Microfone
                        </strong>{' '}
                        e certifique-se de que a opção{' '}
                        <em>
                          &quot;Permitir que aplicativos de área de trabalho acessem o
                          microfone&quot;
                        </em>{' '}
                        está ativada (com o Google Chrome listado como permitido).
                      </p>
                      <p>
                        <strong>Passo 3 (Outros programas):</strong> Feche outros apps que possam
                        estar com o microfone em uso (ex.:{' '}
                        <em>WhatsApp Desktop, Google Meet, Microsoft Teams, Zoom</em>).
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={clearError}
              className="text-amber-700 hover:text-amber-900 p-0.5"
              title="Fechar aviso"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Player do áudio gravado se disponível (ex.: gravou via fallback ou antes de erro) */}
          {recordedAudioUrl && (
            <div className="pt-1.5 space-y-1.5 border-t border-amber-200 dark:border-amber-900/60">
              <p className="text-[10.5px] font-medium text-amber-900 dark:text-amber-200">
                Áudio gravado pelo microfone:
              </p>
              <audio src={recordedAudioUrl} controls className="w-full h-8" />
              {onSaveAudioAttachment && recordedAudioBlob && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={saveRecordedAudioAsAttachment}
                  className="h-7 text-xs font-semibold bg-white dark:bg-slate-900 border-amber-400 text-amber-900 dark:text-amber-200 hover:bg-amber-100"
                >
                  <FileAudio className="h-3 w-3 mr-1" />
                  Salvar este áudio como anexo da visita
                </Button>
              )}
            </div>
          )}

          <div className="flex items-center gap-2 pt-1 border-t border-amber-200 dark:border-amber-900/60 flex-wrap">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={retryPermission}
              className="h-7 text-xs font-semibold bg-white dark:bg-slate-900 border-amber-400 text-amber-900 dark:text-amber-200 hover:bg-amber-100"
            >
              <RotateCcw className="h-3 w-3 mr-1" />
              Tentar novamente
            </Button>
            {isInIframe && (
              <Button
                type="button"
                size="sm"
                onClick={openInNewTab}
                className="h-7 text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white"
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                Abrir em nova aba
              </Button>
            )}
            <span className="text-[10.5px] text-amber-800/80 dark:text-amber-300/80">
              Reavalia a permissão sem recarregar a página
            </span>
          </div>
        </div>
      )}

      {/* Caixa de gravação ativa com temporizador em tempo real e indicador de fala captada */}
      {isRecording && (
        <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs flex flex-col gap-1.5 animate-in fade-in">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-rose-600 animate-ping" />
            <span className="font-semibold">
              {isMediaRecorderFallback
                ? 'Gravando áudio do microfone...'
                : 'Ouvindo sua fala em português (pt-BR)...'}
            </span>

            {audioDetected && (
              <span className="flex items-center gap-1 text-[10px] text-emerald-700 dark:text-emerald-400 font-medium bg-emerald-100/80 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded">
                <Volume2 className="h-3 w-3" />
                Voz captada
              </span>
            )}

            <span className="ml-auto font-mono text-[11px] font-bold px-1.5 py-0.5 rounded bg-rose-100 dark:bg-rose-900/60">
              {String(Math.floor(recordingSeconds / 60)).padStart(2, '0')}:
              {String(recordingSeconds % 60).padStart(2, '0')}
            </span>
          </div>

          {interimTranscript && (
            <div className="italic text-[11px] text-rose-700 dark:text-rose-300 bg-white/70 dark:bg-slate-900/60 p-2 rounded border border-rose-200 dark:border-rose-800">
              &ldquo;{interimTranscript}&rdquo;
            </div>
          )}

          <div className="text-[10px] text-rose-600/90 dark:text-rose-400/90 flex items-center justify-between">
            <span>Toque em &ldquo;Gravando...&rdquo; para finalizar e salvar</span>
            <span>Cada gravação é somada ao texto já escrito</span>
          </div>
        </div>
      )}

      {/* Confirmação transitória de transcrição salva */}
      {state === 'saved' && (
        <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span className="font-semibold text-[11px]">
            Transcrição salva com sucesso no campo! Você pode editar manualmente ou gravar mais.
          </span>
        </div>
      )}

      {/* Textarea sempre editável manualmente após cada transcrição */}
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="text-xs sm:text-sm leading-relaxed bg-slate-50/70 dark:bg-slate-950 resize-y"
      />
    </div>
  )
}
