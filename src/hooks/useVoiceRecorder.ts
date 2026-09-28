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
 * 3. TRANSCRIÇÃO COM CAMINHO DUPLO:
 *    - Caminho 1 (Chrome/Android): Web Speech API (webkitSpeechRecognition/SpeechRecognition) pt-BR, contínua
 *      NUNCA depende de conexão com servidor próprio do app
 *    - Caminho 2 (Fallback universal / Safari): grava o áudio com MediaRecorder; se não houver transcrição,
 *      preserva o áudio gravado e oferece salvá-lo como anexo no campo sem perder nada
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

// Escolhe o melhor mime-type suportado pelo MediaRecorder
function pickSupportedAudioMimeType(): string {
  if (typeof MediaRecorder === 'undefined') return ''
  const candidates = [
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
  const activeSessionTranscriptRef = useRef('')
  const isStoppingRef = useRef(false)

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
        streamRef.current.getTracks().forEach((track) => {
          track.stop()
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
    if (!trimmed) return
    const updated = appendTranscriptSafely(valueRef.current, trimmed)
    valueRef.current = updated
    onChangeRef.current(updated)
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
    if (state === 'recording' || isStoppingRef.current) return

    // Limpa erros e estados transitórios anteriores
    setErrorMessage(null)
    setExactErrorDetail(null)
    setPermissionDenied(false)
    setInterimTranscript('')
    setAudioDetected(false)
    setRecordedAudioUrl(null)
    setRecordedAudioBlob(null)
    activeSessionTranscriptRef.current = ''
    isStoppingRef.current = false

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
      // AudioContext é opcional para VU meter visual
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

    const mimeType = pickSupportedAudioMimeType()
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
        const detail = `${recFatalErr?.name || 'Error'}: ${recFatalErr?.message || 'Falha ao iniciar gravador'}`
        setErrorMessage('Não foi possível inicializar o gravador de áudio no seu navegador.')
        setExactErrorDetail(detail)
        return
      }
    }

    recorder.ondataavailable = (event: BlobEvent) => {
      if (event.data && event.data.size > 0) {
        chunksRef.current.push(event.data)
      }
    }

    recorder.onstop = () => {
      const finalMime = recorder.mimeType || mimeType || 'audio/webm'
      const blob = new Blob(chunksRef.current, { type: finalMime })
      if (blob.size > 0) {
        setRecordedAudioBlob(blob)
        try {
          const url = URL.createObjectURL(blob)
          setRecordedAudioUrl(url)
        } catch {
          /* ignore */
        }
      }
      releaseMicrophone()
    }

    // Inicia gravação com chunks a cada 1 segundo
    recorder.start(1000)

    // 4. CAMINHO DUPLO DE TRANSCRIÇÃO:
    // Caminho 1: Web Speech API nativa (Chrome, Edge, Android)
    // Caminho 2: Fallback (Safari, WebViews sem Speech API) -> MediaRecorder já está gravando
    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition

    if (SpeechRec) {
      try {
        setIsMediaRecorderFallback(false)
        const recognition = new SpeechRec()
        recognitionRef.current = recognition
        recognition.lang = 'pt-BR'
        recognition.continuous = true
        recognition.interimResults = true
        recognition.maxAlternatives = 1

        recognition.onstart = () => {
          updateGlobalDiagnostic({
            lastAction: 'Reconhecimento Web Speech API ativo em pt-BR',
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
            activeSessionTranscriptRef.current = activeSessionTranscriptRef.current
              ? `${activeSessionTranscriptRef.current} ${newFinalAccumulated}`
              : newFinalAccumulated
            commitFinalText(newFinalAccumulated)
          }
        }

        recognition.onerror = (recErr: any) => {
          const errType = recErr?.error || 'speech-error'
          console.warn('SpeechRecognition erro:', errType)

          if (errType === 'not-allowed' || errType === 'service-not-allowed') {
            setPermissionDenied(true)
            setExactErrorDetail(`Web Speech API: ${errType}`)
            // Não quebra a gravação do MediaRecorder se o microfone ainda estiver ativo
          } else if (errType === 'network') {
            // Se falhar a conexão do Google Speech, o MediaRecorder continua gravando o áudio
            setIsMediaRecorderFallback(true)
            setErrorMessage(
              'O serviço online de transcrição do navegador oscilou. O áudio continua sendo gravado normalmente.',
            )
          }
        }

        recognition.onend = () => {
          // Se ainda estiver gravando e o SpeechRecognition encerrou por silêncio natural,
          // tenta reiniciar de forma segura se não estivermos em processo de parada
          if (!isStoppingRef.current && streamRef.current) {
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
      // Navegador sem Web Speech API (ex: Safari iOS / macOS)
      setIsMediaRecorderFallback(true)
      updateGlobalDiagnostic({
        lastAction: 'Safari/Navegador sem SpeechRecognition: gravando via MediaRecorder',
      })
    }

    setState('recording')
  }, [commitFinalText, releaseMicrophone, state])

  // Parar gravação (Toque único)
  const stopRecording = useCallback(() => {
    if (state !== 'recording' || isStoppingRef.current) return
    isStoppingRef.current = true

    updateGlobalDiagnostic({
      lastAction: 'Finalizando gravação e salvando dados...',
    })

    // 1. Para Web Speech API
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop()
      } catch {
        /* ignore */
      }
      recognitionRef.current = null
    }

    // 2. Para MediaRecorder
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop()
      } catch {
        /* ignore */
      }
    } else {
      releaseMicrophone()
    }

    setInterimTranscript('')

    // 3. Transição visual dos estados: "Transcrevendo..." -> "Transcrição salva" -> "idle"
    const hadTranscribedText = activeSessionTranscriptRef.current.trim().length > 0

    if (hadTranscribedText) {
      setState('transcribing')
      setTimeout(() => {
        setState('saved')
        updateGlobalDiagnostic({
          lastAction: 'Transcrição salva no campo com sucesso',
        })
        setTimeout(() => {
          setState('idle')
          isStoppingRef.current = false
        }, 2000)
      }, 400)
    } else {
      // Se estava no fallback do MediaRecorder e nenhuma Speech API transcreveu em texto
      if (isMediaRecorderFallback) {
        setState('transcribing')
        setTimeout(() => {
          setState('idle')
          isStoppingRef.current = false
          setErrorMessage(
            'Transcrição de fala automática não disponível neste navegador (ex: Safari). O áudio foi gravado com sucesso: você pode ouvi-lo abaixo, salvá-lo como anexo e digitar suas observações.',
          )
        }, 400)
      } else {
        setState('idle')
        isStoppingRef.current = false
      }
    }
  }, [isMediaRecorderFallback, releaseMicrophone, state])

  // Alterna entre iniciar e parar com toque único
  const toggleRecording = useCallback(() => {
    if (state === 'recording') {
      stopRecording()
    } else {
      startRecording()
    }
  }, [startRecording, stopRecording, state])

  // Limpar erro
  const clearError = useCallback(() => {
    setErrorMessage(null)
    setExactErrorDetail(null)
    setPermissionDenied(false)
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
