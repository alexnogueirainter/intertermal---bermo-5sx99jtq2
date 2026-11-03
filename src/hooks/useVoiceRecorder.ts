/**
 * Módulo de Voz e Transcrição Autocontido (Reconstrução do Zero)
 *
 * ESPECIFICAÇÃO ATENDIDA RIGOROSAMENTE:
 * 1. ACESSO AO MICROFONE:
 *    - navigator.mediaDevices.getUserMedia({ audio: true }) chamado IMEDIATAMENTE no evento de toque
 *    - Sem navigator.permissions.query, sem checagem de estado prévia, sem try/catch que aborte antes do pedido
 *    - O popup nativo pede permissão. Se aceitar, a gravação inicia na sequência
 *    - Se negar: exibe instruções exatas por navegador (cadeado/trava no Chrome/Android; aA -> Ajustes do Site no Safari iOS)
 *      e botão "Tentar novamente" que reavalia a permissão sem recarregar a página
 *    - Se getUserMedia não existir ou falhar: exibe na tela o erro EXATO retornado (name e message)
 *
 * 2. CAPTURA DE ÁUDIO:
 *    - Grava com MediaRecorder (Chrome e Safari atuais). Se não existir, avisa claramente
 *    - Toque único: toca para iniciar, toca para parar (sem segurar)
 *    - Estados visuais: "idle", "recording" com temporizador, "transcribing" e "saved"
 *
 * 3. TRANSCRIÇÃO — SERVIDOR É O CAMINHO PRINCIPAL (qualquer navegador):
 *    - Caminho 1 (principal): ao parar, o áudio gravado vai à rota /backend/v1/audio/transcribe
 *      (Whisper no servidor) e o texto volta para o campo
 *    - Caminho 2 (fallback): se o servidor não responder, usa o texto capturado pelo
 *      reconhecimento do navegador nesta sessão (deixou de ser o caminho principal)
 *    - Último recurso: preserva o áudio gravado e oferece salvá-lo como anexo
 *      ("Áudio salvo, transcrição indisponível") sem perder nada
 *
 * 4. SALVAMENTO E MÚLTIPLAS GRAVAÇÕES:
 *    - Salva imediatamente no campo ao parar
 *    - Cada gravação é ADICIONADA ao texto já existente, preservando edições manuais e com proteção anti-duplicação
 *    - Se falhar, preserva texto anterior intacto
 *
 * 5. DIAGNÓSTICO EM TEMPO REAL:
 *    - Expõe status de permissão, navegador detectado, API disponível e último erro para o rodapé da página
 */

import { useState, useRef, useEffect, useCallback } from 'react'
import pb from '@/lib/pocketbase/client'

export type VoiceRecordingState = 'idle' | 'recording' | 'transcribing' | 'saved'

export interface VoiceDiagnosticInfo {
  browserName: string
  isIos: boolean
  isAndroid: boolean
  isInAppBrowser: boolean
  isInIframe: boolean
  hasGetUserMedia: boolean
  hasMediaRecorder: boolean
  hasSpeechRecognition: boolean
  permissionState: 'prompt' | 'granted' | 'denied' | 'unknown'
  lastError: string | null
  lastAction: string | null
}

export interface UseVoiceRecorderOptions {
  value: string
  onChange: (nextValue: string) => void
  onSaveAudioAttachment?: (file: { blob: Blob; dataUrl: string; name: string }) => void
}

export interface UseVoiceRecorderReturn {
  state: VoiceRecordingState
  isRecording: boolean
  recordingSeconds: number
  interimTranscript: string
  audioDetected: boolean
  errorMessage: string | null
  exactErrorDetail: string | null
  permissionDenied: boolean
  isInIframe: boolean
  recordedAudioUrl: string | null
  recordedAudioBlob: Blob | null
  isMediaRecorderFallback: boolean
  showAttachmentFallback: boolean
  diagnostic: VoiceDiagnosticInfo
  startRecording: () => Promise<void>
  stopRecording: () => void
  toggleRecording: () => void
  clearError: () => void
  retryPermission: () => Promise<void>
  saveRecordedAudioAsAttachment: () => void
  openInNewTab: () => void
}

// ---------------------------------------------------------
// Detecção de navegador pura e segura (sem dependências)
// ---------------------------------------------------------
export function detectBrowserEnvironment() {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return {
      browserName: 'Desconhecido',
      isIos: false,
      isAndroid: false,
      isInAppBrowser: false,
      isInIframe: false,
      hasGetUserMedia: false,
      hasMediaRecorder: false,
      hasSpeechRecognition: false,
    }
  }

  let isInIframe = false
  try {
    isInIframe = window.self !== window.top
  } catch {
    // Cross-origin iframe pode lançar erro ao acessar window.top
    isInIframe = true
  }

  const ua = navigator.userAgent || ''
  const isIos =
    /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  const isAndroid = /Android/.test(ua)

  // WebViews / In-App Browsers conhecidos (WhatsApp, Instagram, FB, etc.)
  const isWhatsApp = /WhatsApp/i.test(ua)
  const isFbOrInsta = /FB_IAB|FBAN|FBAV|Instagram/i.test(ua)
  const isIosWebView = isIos && /AppleWebKit/i.test(ua) && !/Safari\//i.test(ua)
  const isAndroidWebView = isAndroid && (/Version\/.*Chrome/i.test(ua) || /\bwv\b/i.test(ua))
  const isInAppBrowser = isWhatsApp || isFbOrInsta || isIosWebView || isAndroidWebView

  let browserName = 'Navegador'
  if (isWhatsApp) browserName = 'WhatsApp In-App'
  else if (isFbOrInsta) browserName = 'Instagram/Facebook'
  else if (/CriOS/i.test(ua)) browserName = 'Chrome iOS'
  else if (/FxiOS/i.test(ua)) browserName = 'Firefox iOS'
  else if (/Edg/i.test(ua)) browserName = 'Microsoft Edge'
  else if (/Chrome/i.test(ua)) browserName = 'Google Chrome'
  else if (/Safari/i.test(ua)) browserName = 'Apple Safari'
  else if (/Firefox/i.test(ua)) browserName = 'Mozilla Firefox'

  const hasGetUserMedia = !!(
    navigator.mediaDevices && typeof navigator.mediaDevices.getUserMedia === 'function'
  )
  const hasMediaRecorder = typeof MediaRecorder !== 'undefined'
  const hasSpeechRecognition = !!(
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
  )

  return {
    browserName,
    isIos,
    isAndroid,
    isInAppBrowser,
    isInIframe,
    hasGetUserMedia,
    hasMediaRecorder,
    hasSpeechRecognition,
  }
}

// Registro global de diagnóstico para o painel no rodapé
let globalDiagnosticState: VoiceDiagnosticInfo = {
  browserName: 'Iniciando...',
  isIos: false,
  isAndroid: false,
  isInAppBrowser: false,
  isInIframe: false,
  hasGetUserMedia: false,
  hasMediaRecorder: false,
  hasSpeechRecognition: false,
  permissionState: 'unknown',
  lastError: null,
  lastAction: null,
}

const diagnosticListeners = new Set<(d: VoiceDiagnosticInfo) => void>()

export function subscribeToVoiceDiagnostic(cb: (d: VoiceDiagnosticInfo) => void) {
  diagnosticListeners.add(cb)
  cb(globalDiagnosticState)
  return () => {
    diagnosticListeners.delete(cb)
  }
}

function updateGlobalDiagnostic(patch: Partial<VoiceDiagnosticInfo>) {
  globalDiagnosticState = { ...globalDiagnosticState, ...patch }
  diagnosticListeners.forEach((cb) => {
    try {
      cb(globalDiagnosticState)
    } catch {
      /* ignore */
    }
  })
}

// Inicializa diagnóstico logo no carregamento
if (typeof window !== 'undefined') {
  const env = detectBrowserEnvironment()
  updateGlobalDiagnostic({
    browserName: env.browserName,
    isIos: env.isIos,
    isAndroid: env.isAndroid,
    isInAppBrowser: env.isInAppBrowser,
    isInIframe: env.isInIframe,
    hasGetUserMedia: env.hasGetUserMedia,
    hasMediaRecorder: env.hasMediaRecorder,
    hasSpeechRecognition: env.hasSpeechRecognition,
    permissionState: 'prompt',
    lastAction: 'Módulo carregado',
  })
}

// Escolhe o melhor mime-type suportado pelo MediaRecorder respeitando o dispositivo
function pickSupportedAudioMimeType(isIos = false): string {
  if (typeof MediaRecorder === 'undefined') return ''
  // No iOS Safari, audio/mp4 é o formato nativo mais estável e recomendado pela Apple
  const candidates = isIos
    ? ['audio/mp4', 'audio/aac', 'audio/webm;codecs=opus', 'audio/webm']
    : [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/mp4',
        'audio/aac',
        'audio/ogg;codecs=opus',
        'audio/wav',
      ]
  for (const mime of candidates) {
    try {
      if (MediaRecorder.isTypeSupported(mime)) return mime
    } catch {
      /* ignore */
    }
  }
  return ''
}
/**
 * Combina texto existente com novo trecho de transcrição de forma aditiva e inteligente:
 * - Nunca sobrescreve o texto digitado manualmente
 * - Evita duplicar frases repetidas no mesmo parágrafo
 * - Mantém quebras de linha limpas
 */
export function appendTranscriptSafely(currentText: string, newChunk: string): string {
  const trimmedChunk = (newChunk || '').trim()
  if (!trimmedChunk) return currentText || ''

  const base = (currentText || '').trim()
  if (!base) return trimmedChunk

  // Se o texto atual já termina exatamente com o que foi falado, não duplica
  const baseNormalized = base.toLowerCase().replace(/[.,!?;:]/g, '')
  const chunkNormalized = trimmedChunk.toLowerCase().replace(/[.,!?;:]/g, '')
  if (baseNormalized.endsWith(chunkNormalized)) {
    return base
  }

  // Adiciona com quebra de linha se for um novo bloco ou espaço se terminar em vírgula
  if (/[.!?]$/.test(base) || base.endsWith('\n')) {
    return `${base}\n${trimmedChunk}`
  }
  return `${base}\n${trimmedChunk}`
}

/**
 * Hook autocontido de gravação de voz e transcrição
 */
export function useVoiceRecorder({
  value,
  onChange,
  onSaveAudioAttachment,
}: UseVoiceRecorderOptions): UseVoiceRecorderReturn {
  const [state, setState] = useState<VoiceRecordingState>('idle')
  const [recordingSeconds, setRecordingSeconds] = useState(0)
  const [interimTranscript, setInterimTranscript] = useState('')
  const [audioDetected, setAudioDetected] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [exactErrorDetail, setExactErrorDetail] = useState<string | null>(null)
  const [permissionDenied, setPermissionDenied] = useState(false)
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null)
  const [recordedAudioBlob, setRecordedAudioBlob] = useState<Blob | null>(null)
  const [isMediaRecorderFallback, setIsMediaRecorderFallback] = useState(false)
  const [showAttachmentFallback, setShowAttachmentFallback] = useState(false)
  const [diagnostic, setDiagnostic] = useState<VoiceDiagnosticInfo>(globalDiagnosticState)

  // Refs de estado para evitar closures desatualizadas nos callbacks dos eventos nativos
  const valueRef = useRef(value)
  const onChangeRef = useRef(onChange)
  const onSaveAudioAttachmentRef = useRef(onSaveAudioAttachment)

  const streamRef = useRef<MediaStream | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const recognitionRef = useRef<any>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<any>(null)
  const transitionTimeoutRef = useRef<any>(null)
  const activeSessionTranscriptRef = useRef('')
  const isStoppingRef = useRef(false)
  const latestRecordedBlobRef = useRef<Blob | null>(null)

  useEffect(() => {
    valueRef.current = value
  }, [value])

  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  useEffect(() => {
    onSaveAudioAttachmentRef.current = onSaveAudioAttachment
  }, [onSaveAudioAttachment])

  // Inscrição no diagnóstico global
  useEffect(() => {
    const unsub = subscribeToVoiceDiagnostic((d) => setDiagnostic(d))
    return unsub
  }, [])

  // Timer de segundos de gravação
  useEffect(() => {
    if (state === 'recording') {
      setRecordingSeconds(0)
      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1)
      }, 1000)
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [state])

  // Parar tracks de áudio e liberar hardware do microfone
  const releaseMicrophone = useCallback(() => {
    if (streamRef.current) {
      try {
        const tracks = streamRef.current.getTracks()
        tracks.forEach((track) => {
          try {
            track.stop()
            track.enabled = false
          } catch {
            /* ignore */
          }
        })
      } catch {
        /* ignore */
      }
      streamRef.current = null
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      try {
        audioContextRef.current.close().catch(() => {})
      } catch {
        /* ignore */
      }
      audioContextRef.current = null
    }
  }, [])

  // Limpeza na desmontagem do componente
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (transitionTimeoutRef.current) clearTimeout(transitionTimeoutRef.current)
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort()
        } catch {
          /* ignore */
        }
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        try {
          mediaRecorderRef.current.stop()
        } catch {
          /* ignore */
        }
      }
      releaseMicrophone()
    }
  }, [releaseMicrophone])

  // Salva o texto transcrito no campo imediatamente de forma aditiva
  const commitFinalText = useCallback((textChunk: string) => {
    const trimmed = textChunk.trim()
    if (!trimmed) return false
    const updated = appendTranscriptSafely(valueRef.current, trimmed)
    valueRef.current = updated
    onChangeRef.current(updated)
    return true
  }, [])

  // Transcrição via caminho alternativo (Backend/Whisper) a partir do áudio gravado em Blob
  const transcribeAudioBlobViaBackend = useCallback(async (blob: Blob): Promise<string | null> => {
    if (!blob || blob.size === 0) return null
    try {
      // 1. Tenta envio via FormData multipart com pb.send
      const formData = new FormData()
      const ext = blob.type.includes('mp4') ? 'm4a' : 'webm'
      formData.append('file', blob, `audio_record.${ext}`)

      const data = await pb.send('/backend/v1/audio/transcribe', {
        method: 'POST',
        body: formData,
      })

      if (data && data.ok && data.text) {
        return data.text.trim()
      }
    } catch (err: any) {
      console.warn('transcribeAudioBlobViaBackend multipart falhou:', err)
    }

    // 2. Fallback para base64 se FormData falhar
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onloadend = () => {
          const resStr = (reader.result as string) || ''
          const commaIdx = resStr.indexOf(',')
          resolve(commaIdx >= 0 ? resStr.slice(commaIdx + 1) : resStr)
        }
        reader.onerror = reject
        reader.readAsDataURL(blob)
      })

      if (base64) {
        const data = await pb.send('/backend/v1/audio/transcribe', {
          method: 'POST',
          body: JSON.stringify({ audioBase64: base64, mimeType: blob.type }),
        })
        if (data && data.ok && data.text) {
          return data.text.trim()
        }
      }
    } catch (b64Err: any) {
      console.warn('transcribeAudioBlobViaBackend base64 falhou:', b64Err)
    }

    return null
  }, [])

  // Salva áudio gravado como anexo
  const saveRecordedAudioAsAttachment = useCallback(() => {
    if (!recordedAudioBlob) return
    try {
      const reader = new FileReader()
      reader.onloadend = () => {
        const dataUrl = reader.result as string
        if (dataUrl && onSaveAudioAttachmentRef.current) {
          const extension = recordedAudioBlob.type.includes('mp4') ? 'm4a' : 'webm'
          onSaveAudioAttachmentRef.current({
            blob: recordedAudioBlob,
            dataUrl,
            name: `audio_visita_${Date.now()}.${extension}`,
          })
        }
      }
      reader.readAsDataURL(recordedAudioBlob)
    } catch (err: any) {
      console.error('Falha ao processar áudio como anexo:', err)
    }
  }, [recordedAudioBlob])

  // Iniciar gravação de voz (Chamada IMEDIATA no toque do usuário)
  const startRecording = useCallback(async () => {
    // Se já estiver gravando, nada a fazer aqui
    if (state === 'recording') return

    // Se houver transição pendente (ex.: 'transcribing' ou 'saved'), cancela timers
    if (transitionTimeoutRef.current) {
      clearTimeout(transitionTimeoutRef.current)
      transitionTimeoutRef.current = null
    }

    // Se estiver em processo de parada da gravação anterior, força liberação imediata
    isStoppingRef.current = false

    // Garante que qualquer reconhecimento ou gravação anterior seja abortada e liberada
    if (recognitionRef.current) {
      try {
        recognitionRef.current.onend = null
        recognitionRef.current.onerror = null
        recognitionRef.current.onresult = null
        recognitionRef.current.abort()
      } catch {
        /* ignore */
      }
      recognitionRef.current = null
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop()
      } catch {
        /* ignore */
      }
      mediaRecorderRef.current = null
    }

    releaseMicrophone()

    // Limpa erros e estados transitórios anteriores
    setErrorMessage(null)
    setExactErrorDetail(null)
    setPermissionDenied(false)
    setShowAttachmentFallback(false)
    setInterimTranscript('')
    setAudioDetected(false)
    activeSessionTranscriptRef.current = ''
    latestRecordedBlobRef.current = null
    // Descartamos URLs anteriores apenas se não estivermos exibindo fallback
    if (!showAttachmentFallback) {
      setRecordedAudioUrl(null)
      setRecordedAudioBlob(null)
    }

    updateGlobalDiagnostic({
      lastAction: 'Botão Gravar acionado: chamando getUserMedia({ audio: true })',
      lastError: null,
    })

    // 1. ACESSO AO MICROFONE:
    // Chamada DIRETA ao getUserMedia no evento de clique/toque.
    // Sem permissions.query prévio, sem checagem de estado que aborte antes do pedido.
    if (
      typeof navigator === 'undefined' ||
      !navigator.mediaDevices ||
      typeof navigator.mediaDevices.getUserMedia !== 'function'
    ) {
      const errName = 'MediaDevicesNotSupported'
      const errMsg =
        'Este navegador não oferece suporte à captura de microfone. Abra a página diretamente no Google Chrome ou Apple Safari.'
      setPermissionDenied(true)
      setErrorMessage(errMsg)
      setExactErrorDetail(`Erro: ${errName} - navigator.mediaDevices.getUserMedia não existe`)
      updateGlobalDiagnostic({
        permissionState: 'denied',
        lastError: `${errName}: getUserMedia inexistente`,
        lastAction: 'Falha: getUserMedia não suportado',
      })
      return
    }

    let stream: MediaStream
    try {
      // Pedido nativo direto — aciona o popup do navegador imediatamente
      stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      })
      streamRef.current = stream
      updateGlobalDiagnostic({
        permissionState: 'granted',
        lastAction: 'Microfone liberado com sucesso pelo usuário',
      })
    } catch (err: any) {
      const errName = err?.name || 'Error'
      const rawMsg = err?.message || 'Falha ao acessar o microfone'
      console.warn('getUserMedia retornou erro:', errName, rawMsg)

      const env = detectBrowserEnvironment()
      setPermissionDenied(true)
      setExactErrorDetail(`Erro exato: ${errName}: ${rawMsg}`)
      updateGlobalDiagnostic({
        permissionState: 'denied',
        lastError: `${errName}: ${rawMsg}`,
        lastAction: 'Acesso ao microfone rejeitado ou bloqueado',
      })

      if (errName === 'NotAllowedError' || errName === 'PermissionDeniedError') {
        if (env.isInIframe) {
          setErrorMessage(
            'Página aberta dentro de um quadro embutido (iframe). O navegador bloqueia o microfone por política de segurança quando a página roda embutida em outra página. Toque no botão "Abrir em nova aba" para abrir o sistema diretamente e gravar por lá.',
          )
        } else if (env.isInAppBrowser) {
          setErrorMessage(
            "O navegador embutido do app (WhatsApp/Instagram) bloqueia o microfone por completo. Toque nos 3 pontos ou no ícone de compartilhar e selecione 'Abrir no Chrome' ou 'Abrir no Safari'.",
          )
        } else if (env.isIos) {
          setErrorMessage(
            'Acesso ao microfone negado no Safari iOS. Toque no botão "aA" na barra de endereços > Ajustes do Site > Microfone: selecione Permitir. Se persistir, verifique Ajustes do iPhone > Privacidade e Segurança > Microfone e feche outros aplicativos que possam estar em chamada.',
          )
        } else {
          setErrorMessage(
            'Acesso ao microfone negado no navegador. Passo 1: Toque no ícone de Cadeado/Trava ao lado da URL > Permissões > libere o Microfone. Passo 2: No Windows, vá em Configurações do Windows > Privacidade e segurança > Microfone e ative "Permitir que aplicativos de área de trabalho acessem o microfone" (verifique se o Chrome está permitido). Passo 3: Feche outros apps que possam estar usando o microfone no momento (ex.: WhatsApp Desktop, Meet, Teams). Depois toque em "Tentar novamente".',
          )
        }
      } else if (errName === 'NotFoundError' || errName === 'DevicesNotFoundError') {
        setErrorMessage(
          'Nenhum microfone foi detectado neste dispositivo. Conecte um fone de ouvido com microfone ou verifique as configurações de áudio do sistema.',
        )
      } else if (errName === 'NotReadableError' || errName === 'TrackStartError') {
        setErrorMessage(
          'O microfone está sendo usado por outro aplicativo ou chamada. Feche outros apps e tente novamente.',
        )
      } else {
        setErrorMessage(
          `Não foi possível iniciar o microfone (${errName}: ${rawMsg}). Verifique se o navegador tem permissão nas configurações do sistema.`,
        )
      }
      return
    }

    // 2. DETECTOR DE VOLUME / VU METER (AudioContext seguro sem travar)
    // No iOS Safari: AudioContext conectado ao MediaStream bloqueia e corrompe o buffer de áudio
    // de sessões subsequentes no WebKit. Pulamos AudioContext no iOS para evitar trava de hardware.
    const currentEnv = detectBrowserEnvironment()
    if (!currentEnv.isIos) {
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
        if (AudioCtx) {
          const audioCtx = new AudioCtx()
          audioContextRef.current = audioCtx
          const source = audioCtx.createMediaStreamSource(stream)
          const analyser = audioCtx.createAnalyser()
          analyser.fftSize = 256
          source.connect(analyser)
          const data = new Uint8Array(analyser.frequencyBinCount)

          const checkLevel = () => {
            if (!streamRef.current || audioCtx.state === 'closed') return
            analyser.getByteFrequencyData(data)
            let sum = 0
            for (let i = 0; i < data.length; i++) sum += data[i]
            const avg = sum / data.length
            if (avg > 8) {
              setAudioDetected(true)
            }
            requestAnimationFrame(checkLevel)
          }
          requestAnimationFrame(checkLevel)
        }
      } catch {
        // AudioContext é opcional para VU meter visual no desktop/Android
      }
    }

    // 3. CAPTURA COM MEDIARECORDER (Sempre gravando o áudio para garantir preservação)
    if (typeof MediaRecorder === 'undefined') {
      releaseMicrophone()
      const msg = 'Este navegador não suporta gravação de áudio (MediaRecorder inexistente).'
      setErrorMessage(msg)
      setExactErrorDetail('MediaRecorder is undefined')
      updateGlobalDiagnostic({
        lastError: 'MediaRecorder is undefined',
        lastAction: 'Abortado por falta de MediaRecorder',
      })
      return
    }

    const mimeType = pickSupportedAudioMimeType(currentEnv.isIos)
    chunksRef.current = []
    let recorder: MediaRecorder
    try {
      recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream)
      mediaRecorderRef.current = recorder
    } catch (recInitErr: any) {
      console.warn('MediaRecorder com mimeType falhou, tentando padrão:', recInitErr)
      try {
        recorder = new MediaRecorder(stream)
        mediaRecorderRef.current = recorder
      } catch (recFatalErr: any) {
        releaseMicrophone()
        mediaRecorderRef.current = null
        const detail = `${recFatalErr?.name || 'Error'}: ${recFatalErr?.message || 'Falha ao iniciar gravador'}`
        setErrorMessage('Não foi possível inicializar o gravador de áudio no seu navegador.')
        setExactErrorDetail(detail)
        return
      }
    }

    recorder.ondataavailable = (event: BlobEvent) => {
      if (event.data && event.data.size > 0) {
        chunksRef.current.push(event.data)
        if (currentEnv.isIos) {
          setAudioDetected(true)
        }
      }
    }

    recorder.onstop = () => {
      const finalMime =
        recorder.mimeType || mimeType || (currentEnv.isIos ? 'audio/mp4' : 'audio/webm')
      const blob = new Blob(chunksRef.current, { type: finalMime })
      if (blob.size > 0) {
        latestRecordedBlobRef.current = blob
        setRecordedAudioBlob(blob)
        try {
          const url = URL.createObjectURL(blob)
          setRecordedAudioUrl(url)
        } catch {
          /* ignore */
        }
      }
      // Libera tracks do microfone e descarta o recorder para garantir sessão limpa
      releaseMicrophone()
      if (mediaRecorderRef.current === recorder) {
        mediaRecorderRef.current = null
      }
    }

    // Inicia gravação com chunks a cada 1 segundo
    // No iOS Safari, passamos timeSlice seguro
    try {
      recorder.start(1000)
    } catch (startErr: any) {
      console.warn('recorder.start(1000) falhou, tentando recorder.start():', startErr)
      try {
        recorder.start()
      } catch (fatalStartErr: any) {
        releaseMicrophone()
        mediaRecorderRef.current = null
        setErrorMessage('Não foi possível iniciar a gravação de áudio no Safari.')
        setExactErrorDetail(String(fatalStartErr))
        return
      }
    }

    // 4. CAMINHO DUPLO DE TRANSCRIÇÃO COM REINÍCIO COMPLETO A CADA SESSÃO:
    // Configura SpeechRecognition com lang = 'pt-BR' tanto para Desktop/Android quanto para iOS.
    // No Desktop e Android, mantém exatamente o fluxo contínuo e idêntico que já funciona.
    // No iOS (Safari), instancia Web Speech API (webkitSpeechRecognition) se disponível e
    // simultaneamente grava com MediaRecorder como garantia para a via 2 de transcrição.
    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition

    if (SpeechRec) {
      try {
        setIsMediaRecorderFallback(false)
        const recognition = new SpeechRec()
        recognitionRef.current = recognition
        recognition.lang = 'pt-BR'
        // No iOS Safari, continuous = true pode causar congelamento precoce do WebKit;
        // mantemos continuous true em desktop/android e adaptável com segurança no iOS
        recognition.continuous = !currentEnv.isIos
        recognition.interimResults = true
        recognition.maxAlternatives = 1

        recognition.onstart = () => {
          updateGlobalDiagnostic({
            lastAction: `Reconhecimento de fala ativo em pt-BR (${currentEnv.browserName})`,
          })
        }

        recognition.onresult = (event: any) => {
          let currentInterim = ''
          let newFinalAccumulated = ''

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const res = event.results[i]
            const phrase = res[0]?.transcript || ''
            if (res.isFinal) {
              const tr = phrase.trim()
              if (tr) {
                newFinalAccumulated = newFinalAccumulated ? `${newFinalAccumulated} ${tr}` : tr
              }
            } else {
              currentInterim += phrase
            }
          }

          setInterimTranscript(currentInterim.trim())

          if (newFinalAccumulated) {
            setAudioDetected(true)
            // Reconhecimento do navegador NÃO é mais o caminho principal: o texto
            // fica só como fallback (usado se o servidor não responder no stop).
            activeSessionTranscriptRef.current = activeSessionTranscriptRef.current
              ? `${activeSessionTranscriptRef.current} ${newFinalAccumulated}`
              : newFinalAccumulated
          }
        }

        recognition.onerror = (recErr: any) => {
          const errType = recErr?.error || 'speech-error'
          console.warn('SpeechRecognition erro:', errType)

          // Ignora 'aborted' quando o usuário mesmo parou
          if (errType === 'aborted') {
            return
          }

          if (errType === 'not-allowed' || errType === 'service-not-allowed') {
            // No iOS, se a Web Speech API der service-not-allowed, não bloqueia o gravador:
            // a via 2 de transcrição do áudio gravado assume automaticamente no stop
            if (currentEnv.isIos) {
              setIsMediaRecorderFallback(true)
              updateGlobalDiagnostic({
                lastAction:
                  'Web Speech API não permitida no iOS. Áudio será transcrito via caminho alternativo ao finalizar.',
              })
            } else {
              setPermissionDenied(true)
              setExactErrorDetail(`Web Speech API: ${errType}`)
            }
          } else if (errType === 'network') {
            setIsMediaRecorderFallback(true)
            setErrorMessage(
              'O serviço online de transcrição oscilou. O áudio está sendo gravado e será processado.',
            )
          } else {
            setIsMediaRecorderFallback(true)
          }
        }

        recognition.onend = () => {
          // Se ainda estiver gravando e o SpeechRecognition encerrou por silêncio natural,
          // reinicia com segurança apenas se a gravação ainda estiver ativa e não estivermos parando
          if (
            !isStoppingRef.current &&
            streamRef.current &&
            recognitionRef.current === recognition
          ) {
            try {
              recognition.start()
            } catch {
              /* ignore */
            }
          }
        }

        recognition.start()
      } catch (recStartErr: any) {
        console.warn('Não foi possível iniciar Web Speech API, usando fallback:', recStartErr)
        setIsMediaRecorderFallback(true)
      }
    } else {
      // Navegador sem Web Speech API nativa — via 2 de transcrição do áudio gravado
      setIsMediaRecorderFallback(true)
      updateGlobalDiagnostic({
        lastAction: 'Gravador MediaRecorder ativo em pt-BR com transcrição no término',
      })
    }

    setState('recording')
  }, [commitFinalText, releaseMicrophone, state])

  // Parar gravação (Toque único)
  const stopRecording = useCallback(async () => {
    if (state !== 'recording' || isStoppingRef.current) return
    isStoppingRef.current = true

    updateGlobalDiagnostic({
      lastAction: 'Finalizando gravação e processando transcrição...',
    })

    // Texto interim não finalizado no stop: guardado como fallback do navegador
    // (o campo só recebe texto depois da tentativa pelo servidor)
    if (interimTranscript && interimTranscript.trim()) {
      const leftover = interimTranscript.trim()
      activeSessionTranscriptRef.current = activeSessionTranscriptRef.current
        ? `${activeSessionTranscriptRef.current} ${leftover}`
        : leftover
    }

    // 1. Para Web Speech API com limpeza de listeners para não auto-reiniciar no onend
    if (recognitionRef.current) {
      try {
        const rec = recognitionRef.current
        rec.onend = null
        rec.onerror = null
        rec.onresult = null
        rec.stop()
      } catch {
        /* ignore */
      }
      recognitionRef.current = null
    }

    // 2. Para MediaRecorder e dispara onstop (que chama releaseMicrophone)
    const activeRecorder = mediaRecorderRef.current
    if (activeRecorder && activeRecorder.state !== 'inactive') {
      try {
        activeRecorder.stop()
      } catch {
        releaseMicrophone()
      }
    } else {
      releaseMicrophone()
    }
    // Descartar referência para nunca reutilizar
    mediaRecorderRef.current = null

    setInterimTranscript('')

    if (transitionTimeoutRef.current) {
      clearTimeout(transitionTimeoutRef.current)
      transitionTimeoutRef.current = null
    }

    // Coloca o estado imediatamente em "transcribing" para feedback visual claro
    setState('transcribing')

    // Aguarda breve fração para garantir que o evento onstop do recorder gerou o blob
    await new Promise((resolve) => setTimeout(resolve, 150))

    // CAMINHO PRINCIPAL (qualquer navegador): transcrição pelo servidor
    // (/backend/v1/audio/transcribe). O reconhecimento do navegador deixou de
    // ser o caminho principal — vira apenas fallback se o servidor falhar.
    const audioBlob = latestRecordedBlobRef.current || recordedAudioBlob
    let serverText: string | null = null

    if (audioBlob && audioBlob.size > 0) {
      updateGlobalDiagnostic({
        lastAction: 'Transcrevendo pelo servidor...',
      })

      // Tentativa 1 do caminho principal
      serverText = await transcribeAudioBlobViaBackend(audioBlob)

      // RETENTATIVA AUTOMÁTICA: se falhou a primeira vez, tenta novamente uma vez
      if (!serverText) {
        updateGlobalDiagnostic({
          lastAction: 'Retentando transcrição pelo servidor...',
        })
        await new Promise((resolve) => setTimeout(resolve, 300))
        serverText = await transcribeAudioBlobViaBackend(audioBlob)
      }
    }

    // Servidor respondeu: texto vai ao campo (em qualquer navegador)
    if (serverText && serverText.trim()) {
      commitFinalText(serverText.trim())
      setShowAttachmentFallback(false)
      setErrorMessage(null)
      setExactErrorDetail(null)
      isStoppingRef.current = false

      transitionTimeoutRef.current = setTimeout(() => {
        setState('saved')
        updateGlobalDiagnostic({
          lastAction: 'Transcrição salva no campo com sucesso (servidor)',
        })
        transitionTimeoutRef.current = setTimeout(() => {
          setState('idle')
          transitionTimeoutRef.current = null
        }, 1500)
      }, 300)
      return
    }

    // FALLBACK: texto capturado pelo reconhecimento do navegador nesta sessão
    // (só entra se o servidor não respondeu)
    const browserText = activeSessionTranscriptRef.current.trim()
    if (browserText) {
      commitFinalText(browserText)
      setShowAttachmentFallback(false)
      setErrorMessage(null)
      setExactErrorDetail(null)
      isStoppingRef.current = false

      transitionTimeoutRef.current = setTimeout(() => {
        setState('saved')
        updateGlobalDiagnostic({
          lastAction: 'Servidor indisponível — texto do reconhecimento do navegador aplicado',
        })
        transitionTimeoutRef.current = setTimeout(() => {
          setState('idle')
          transitionTimeoutRef.current = null
        }, 1500)
      }, 300)
      return
    }

    // TRANSCRIÇÃO INDISPONÍVEL: mantém o áudio gravado preservado para salvar
    // como anexo e avisa na tela (nunca perde o relato).
    isStoppingRef.current = false
    setState('idle')
    setShowAttachmentFallback(true)

    const reasonMsg =
      audioBlob && audioBlob.size > 0
        ? 'Áudio salvo, transcrição indisponível. Salve esta gravação como anexo da visita para não perder o relato ou tente gravar novamente.'
        : 'Nenhum áudio foi captado na gravação. Toque em Gravar novamente e fale próximo ao microfone.'

    setErrorMessage(reasonMsg)
    setExactErrorDetail(
      'Falha na transcrição: servidor não retornou texto e o navegador não captou fala.',
    )
    updateGlobalDiagnostic({
      lastError: 'Falha na transcrição: nenhum texto retornado',
      lastAction: 'Áudio preservado como anexo (transcrição indisponível)',
    })
  }, [
    commitFinalText,
    interimTranscript,
    recordedAudioBlob,
    releaseMicrophone,
    state,
    transcribeAudioBlobViaBackend,
  ])

  // Alterna entre iniciar e parar com toque único
  const toggleRecording = useCallback(async () => {
    if (state === 'recording') {
      await stopRecording()
    } else {
      await startRecording()
    }
  }, [startRecording, stopRecording, state])

  // Limpar erro
  const clearError = useCallback(() => {
    setErrorMessage(null)
    setExactErrorDetail(null)
    setPermissionDenied(false)
    setShowAttachmentFallback(false)
  }, [])

  // Tentar novamente a permissão sem recarregar a página
  const retryPermission = useCallback(async () => {
    clearError()
    await startRecording()
  }, [clearError, startRecording])

  // Abrir a página em nova aba (executado direto no clique do usuário)
  const openInNewTab = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.open(window.location.href, '_blank')
    }
  }, [])

  const env = detectBrowserEnvironment()

  return {
    state,
    isRecording: state === 'recording',
    recordingSeconds,
    interimTranscript,
    audioDetected,
    errorMessage,
    exactErrorDetail,
    permissionDenied,
    isInIframe: env.isInIframe,
    recordedAudioUrl,
    recordedAudioBlob,
    isMediaRecorderFallback,
    showAttachmentFallback,
    diagnostic,
    startRecording,
    stopRecording,
    toggleRecording,
    clearError,
    retryPermission,
    saveRecordedAudioAsAttachment,
    openInNewTab,
  }
}
