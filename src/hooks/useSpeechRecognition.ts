import { useState, useEffect, useRef, useCallback } from 'react'

export type SpeechRecordingState = 'idle' | 'requesting' | 'recording' | 'transcribing' | 'saved'

export interface UseSpeechRecognitionOptions {
  currentText: string
  onUpdateText: (newText: string) => void
  lang?: string
  onAudioRecorded?: (audioBlob: Blob, audioDataUrl: string) => void
}

export interface UseSpeechRecognitionReturn {
  speechSupported: boolean
  isRecording: boolean
  state: SpeechRecordingState
  interimTranscript: string
  recordingSeconds: number
  audioDetected: boolean
  permissionDeniedPermanent: boolean
  permissionBlockedNotice: string | null
  recordedAudioUrl: string | null
  isIos: boolean
  isAndroid: boolean
  isInAppBrowser: boolean
  isMediaRecorderFallback: boolean
  startRecording: () => Promise<void>
  stopRecording: () => void
  toggleRecording: () => void
  clearPermissionNotice: () => void
  retryPermission: () => Promise<void>
}

// Detecção de navegador/plataforma e navegador embutido (WhatsApp, WebViews de redes sociais)
export function detectPlatform() {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return { isIos: false, isAndroid: false, isInAppBrowser: false }
  }
  const ua = navigator.userAgent || ''
  const isIos =
    /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  const isAndroid = /Android/.test(ua)

  // Detecção de navegador embutido (WhatsApp, Instagram, Facebook In-App Browser, iOS UIWebView/WKWebView sem Safari, etc.)
  const isWhatsApp = /WhatsApp/i.test(ua)
  const isFacebookOrInstagram = /FB_IAB|FBAN|FBAV|Instagram/i.test(ua)
  // No iOS, se contém AppleWebKit mas NÃO contém "Safari/", é um WebView embutido de app
  const isIosWebView = isIos && /AppleWebKit/i.test(ua) && !/Safari\//i.test(ua)
  // Android WebView comum: contém "Version/X.X" e "wv" ou "; wv)"
  const isAndroidWebView = isAndroid && (/Version\/.*Chrome/i.test(ua) || /\bwv\b/i.test(ua))

  const isInAppBrowser = isWhatsApp || isFacebookOrInstagram || isIosWebView || isAndroidWebView

  return { isIos, isAndroid, isInAppBrowser }
}

function getBestMimeType(): string {
  if (typeof MediaRecorder === 'undefined') return ''
  const types = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4',
    'audio/aac',
    'audio/ogg;codecs=opus',
    'audio/wav',
  ]
  for (const t of types) {
    if (MediaRecorder.isTypeSupported(t)) {
      return t
    }
  }
  return ''
}

export function useSpeechRecognition({
  currentText,
  onUpdateText,
  lang = 'pt-BR',
  onAudioRecorded,
}: UseSpeechRecognitionOptions): UseSpeechRecognitionReturn {
  const [speechSupported, setSpeechSupported] = useState(false)
  const [state, setState] = useState<SpeechRecordingState>('idle')
  const [interimTranscript, setInterimTranscript] = useState('')
  const [recordingSeconds, setRecordingSeconds] = useState(0)
  const [audioDetected, setAudioDetected] = useState(false)
  const [permissionDeniedPermanent, setPermissionDeniedPermanent] = useState(false)
  const [permissionBlockedNotice, setPermissionBlockedNotice] = useState<string | null>(null)
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null)
  const [isMediaRecorderFallback, setIsMediaRecorderFallback] = useState(false)

  const recognitionRef = useRef<any>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const recordedChunksRef = useRef<Blob[]>([])
  const isRunningRef = useRef(false)
  const baseTextRef = useRef('')
  const sessionFinalRef = useRef('')
  const timerRef = useRef<any>(null)
  const saveTimeoutRef = useRef<any>(null)
  const micStreamRef = useRef<MediaStream | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const currentTextRef = useRef(currentText)
  const onAudioRecordedRef = useRef(onAudioRecorded)

  useEffect(() => {
    currentTextRef.current = currentText
  }, [currentText])

  useEffect(() => {
    onAudioRecordedRef.current = onAudioRecorded
  }, [onAudioRecorded])

  const { isIos, isAndroid, isInAppBrowser } = detectPlatform()

  const defaultBlockedNotice = isInAppBrowser
    ? "O WhatsApp e outros apps abrem links num navegador próprio que bloqueia o microfone por completo. Para gravar: toque no ícone de compartilhar e escolha 'Abrir no Safari' (iPhone) ou 'Abrir no Chrome' (Android). Depois toque em Gravar voz e Permitir."
    : isIos
      ? 'Acesso ao microfone negado ou não liberado no Safari. Toque no botão "aA" na barra de endereços > Ajustes do Site > Microfone: selecione Permitir. Depois toque em Tentar novamente.'
      : 'Acesso ao microfone negado no navegador. Toque no ícone de cadeado/trava ao lado da URL > Permissões > libere o microfone e toque em Tentar novamente.'

  // Checagem de capacidade: Web Speech API OU getUserMedia + MediaRecorder
  useEffect(() => {
    if (typeof window === 'undefined') {
      setSpeechSupported(false)
      return
    }
    const hasSpeechRec = !!(
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    )
    const hasMediaDevices = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)
    const hasMediaRecorder = typeof MediaRecorder !== 'undefined'
    // Suportado se tiver reconhecimento nativo OU suporte a gravação de áudio
    setSpeechSupported(hasSpeechRec || (hasMediaDevices && hasMediaRecorder))
  }, [])

  // Limpeza geral ao desmontar componente
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach((t) => t.stop())
        micStreamRef.current = null
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {})
      }
      if (recognitionRef.current && isRunningRef.current) {
        try {
          recognitionRef.current.abort?.()
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
      isRunningRef.current = false
    }
  }, [])

  // Timer de gravação em tempo real
  useEffect(() => {
    if (state === 'recording') {
      setRecordingSeconds(0)
      timerRef.current = setInterval(() => {
        setRecordingSeconds((s) => s + 1)
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

  // Salvar preservando o texto e fazendo append seguro
  const commitTranscript = useCallback(
    (newFinalChunk: string) => {
      const trimmedChunk = newFinalChunk.trim()
      if (!trimmedChunk) return

      const base = baseTextRef.current.trim()
      const accumulated = sessionFinalRef.current.trim()
      const combinedAccumulated = accumulated ? `${accumulated} ${trimmedChunk}` : trimmedChunk

      sessionFinalRef.current = combinedAccumulated

      let fullText = base
      if (combinedAccumulated) {
        fullText = base ? `${base}\n${combinedAccumulated}` : combinedAccumulated
      }

      onUpdateText(fullText)
    },
    [onUpdateText],
  )

  const stopStreamAndAnalyser = () => {
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((t) => t.stop())
      micStreamRef.current = null
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {})
      audioContextRef.current = null
    }
  }

  // Finalização da transcrição ao parar ou encerrar reconhecimento
  const finalizeRecordingSession = useCallback(() => {
    isRunningRef.current = false
    stopStreamAndAnalyser()

    const hadNewText = sessionFinalRef.current.trim().length > 0
    setInterimTranscript('')

    if (hadNewText) {
      setState('transcribing')
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
      saveTimeoutRef.current = setTimeout(() => {
        setState('saved')
        saveTimeoutRef.current = setTimeout(() => {
          setState('idle')
        }, 2200)
      }, 500)
    } else {
      setState('idle')
    }
  }, [])

  // Iniciar gravação de áudio via MediaRecorder (fallback quando Web Speech API não está disponível ou falhou)
  const startMediaRecorderFallback = useCallback((stream: MediaStream) => {
    try {
      setIsMediaRecorderFallback(true)
      recordedChunksRef.current = []

      const mimeType = getBestMimeType()
      const options = mimeType ? { mimeType } : undefined
      const recorder = new MediaRecorder(stream, options)
      mediaRecorderRef.current = recorder

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data)
        }
      }

      recorder.onstop = () => {
        isRunningRef.current = false
        stopStreamAndAnalyser()

        const finalMime = recorder.mimeType || mimeType || 'audio/webm'
        const blob = new Blob(recordedChunksRef.current, { type: finalMime })

        if (blob.size > 0) {
          const url = URL.createObjectURL(blob)
          setRecordedAudioUrl(url)

          // Avisa o técnico com clareza e oferece o áudio anexado
          setPermissionBlockedNotice(
            'Áudio gravado com sucesso. Como este navegador (ex: Safari) não transcreve fala em texto automaticamente, o áudio foi preservado para anexo e o campo continua liberado para digitação manual.',
          )

          if (onAudioRecordedRef.current) {
            try {
              const reader = new FileReader()
              reader.onloadend = () => {
                const dataUrl = reader.result as string
                if (dataUrl && onAudioRecordedRef.current) {
                  onAudioRecordedRef.current(blob, dataUrl)
                }
              }
              reader.readAsDataURL(blob)
            } catch {
              /* ignore */
            }
          }
        }

        setState('idle')
      }

      recorder.start(1000)
      isRunningRef.current = true
      setState('recording')
      setInterimTranscript('Gravando áudio do microfone...')
    } catch (err: any) {
      console.error('Falha ao iniciar MediaRecorder fallback:', err)
      isRunningRef.current = false
      stopStreamAndAnalyser()
      setState('idle')
      setPermissionBlockedNotice(
        `Falha ao iniciar o gravador de áudio: ${err?.message || 'Erro desconhecido'}`,
      )
    }
  }, [])

  // Iniciar gravação com pedido direto ao microfone (user gesture direto, sem queries que quebram)
  const startRecording = useCallback(async () => {
    if (isRunningRef.current) return

    setPermissionBlockedNotice(null)
    setPermissionDeniedPermanent(false)
    setState('requesting')

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setState('idle')
      setPermissionDeniedPermanent(true)
      setPermissionBlockedNotice(
        isInAppBrowser
          ? defaultBlockedNotice
          : 'Seu navegador não suporta captura de microfone. Abra a página diretamente no Google Chrome ou Safari.',
      )
      return
    }

    // 1. Chamar getUserMedia DIRETO no fluxo do toque (sem permissions.query prévia)
    let stream: MediaStream
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      })
      micStreamRef.current = stream
    } catch (err: any) {
      console.warn('getUserMedia falhou ou foi negado:', err)
      setState('idle')
      const name = err?.name || ''
      if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
        setPermissionDeniedPermanent(true)
        setPermissionBlockedNotice(defaultBlockedNotice)
      } else if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
        setPermissionBlockedNotice(
          'Nenhum microfone encontrado neste aparelho. Conecte um microfone ou fone de ouvido para gravar.',
        )
      } else if (name === 'NotReadableError' || name === 'TrackStartError') {
        setPermissionBlockedNotice(
          'O microfone já está sendo usado por outro aplicativo. Feche chamadas ou outros apps e tente novamente.',
        )
      } else {
        setPermissionBlockedNotice(
          `Não foi possível acessar o microfone (${err?.message || name || 'bloqueado'}). Verifique as permissões do navegador.`,
        )
      }
      return
    }

    // 2. Configurar analisador de áudio simples (sem crash se AudioContext falhar)
    try {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext
      if (AudioCtxClass) {
        const ctx = new AudioCtxClass()
        audioContextRef.current = ctx
        const source = ctx.createMediaStreamSource(stream)
        const analyser = ctx.createAnalyser()
        analyser.fftSize = 256
        source.connect(analyser)
        const dataArray = new Uint8Array(analyser.frequencyBinCount)

        const checkAudio = () => {
          if (!isRunningRef.current) return
          analyser.getByteFrequencyData(dataArray)
          let sum = 0
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i]
          }
          const avg = sum / dataArray.length
          if (avg > 8) {
            setAudioDetected(true)
          }
          requestAnimationFrame(checkAudio)
        }
        requestAnimationFrame(checkAudio)
      }
    } catch {
      // AudioContext opcional para VU meter
    }

    // 3. CAMINHO DUPLO: Web Speech API (Chrome/Edge/Android) ou MediaRecorder (Safari/WebView/Sem API)
    const SpeechRec =
      typeof window !== 'undefined'
        ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
        : null

    baseTextRef.current = currentTextRef.current || ''
    sessionFinalRef.current = ''
    setInterimTranscript('')
    setAudioDetected(false)
    setRecordedAudioUrl(null)

    if (SpeechRec) {
      try {
        setIsMediaRecorderFallback(false)
        const instance = new SpeechRec()
        instance.lang = lang
        instance.continuous = true
        instance.interimResults = true
        instance.maxAlternatives = 1

        instance.onstart = () => {
          isRunningRef.current = true
          setState('recording')
        }

        instance.onresult = (event: any) => {
          let currentInterim = ''
          let newFinalChunk = ''

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const res = event.results[i]
            const phrase = res[0]?.transcript || ''
            if (res.isFinal) {
              const trimmed = phrase.trim()
              if (trimmed) {
                newFinalChunk = newFinalChunk ? `${newFinalChunk} ${trimmed}` : trimmed
              }
            } else {
              currentInterim += phrase
            }
          }

          setInterimTranscript(currentInterim.trim())

          if (newFinalChunk) {
            setAudioDetected(true)
            commitTranscript(newFinalChunk)
          }
        }

        instance.onerror = (err: any) => {
          const errType = err?.error || ''

          if (errType === 'not-allowed' || errType === 'service-not-allowed') {
            setPermissionDeniedPermanent(true)
            setPermissionBlockedNotice(defaultBlockedNotice)
            isRunningRef.current = false
            stopStreamAndAnalyser()
            setState('idle')
            return
          }

          if (errType === 'audio-capture') {
            setPermissionBlockedNotice(
              'Nenhum áudio detectado no microfone. Verifique as configurações de áudio do dispositivo.',
            )
            isRunningRef.current = false
            stopStreamAndAnalyser()
            setState('idle')
            return
          }

          if (errType === 'network') {
            // Se Web Speech API falhar por rede (muito comum em conexões de campo),
            // se o MediaRecorder ainda não foi usado, avisa sem travar
            if (sessionFinalRef.current.trim().length > 0) {
              finalizeRecordingSession()
            } else {
              setPermissionBlockedNotice(
                'Falha na conexão do serviço de reconhecimento de voz. Se o erro persistir, digite no campo ou tente novamente.',
              )
              finalizeRecordingSession()
            }
            return
          }

          if (errType !== 'no-speech') {
            finalizeRecordingSession()
          }
        }

        instance.onend = () => {
          if (isRunningRef.current) {
            finalizeRecordingSession()
          }
        }

        recognitionRef.current = instance
        instance.start()
      } catch (recErr: any) {
        console.warn('SpeechRecognition falhou ao iniciar, usando fallback MediaRecorder:', recErr)
        startMediaRecorderFallback(stream)
      }
    } else {
      // Navegador sem Web Speech API (Safari iOS / Safari macOS / WebViews compatíveis)
      startMediaRecorderFallback(stream)
    }
  }, [
    commitTranscript,
    defaultBlockedNotice,
    finalizeRecordingSession,
    isInAppBrowser,
    isIos,
    lang,
    startMediaRecorderFallback,
  ])

  // Parar gravação
  const stopRecording = useCallback(() => {
    if (!isRunningRef.current && state !== 'recording' && state !== 'requesting') {
      return
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop()
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
      return
    }

    finalizeRecordingSession()
  }, [finalizeRecordingSession, state])

  // Toggle gravação
  const toggleRecording = useCallback(() => {
    if (state === 'recording' || state === 'requesting') {
      stopRecording()
    } else {
      startRecording()
    }
  }, [startRecording, stopRecording, state])

  // Limpar aviso
  const clearPermissionNotice = useCallback(() => {
    setPermissionBlockedNotice(null)
  }, [])

  // Tentar novamente a permissão sem recarregar a página
  const retryPermission = useCallback(async () => {
    clearPermissionNotice()
    await startRecording()
  }, [clearPermissionNotice, startRecording])

  return {
    speechSupported,
    isRecording: state === 'recording',
    state,
    interimTranscript,
    recordingSeconds,
    audioDetected,
    permissionDeniedPermanent,
    permissionBlockedNotice,
    recordedAudioUrl,
    isIos,
    isAndroid,
    isInAppBrowser,
    isMediaRecorderFallback,
    startRecording,
    stopRecording,
    toggleRecording,
    clearPermissionNotice,
    retryPermission,
  }
}
