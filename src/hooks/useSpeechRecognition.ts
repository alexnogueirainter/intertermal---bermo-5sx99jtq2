import { useState, useEffect, useRef, useCallback } from 'react'

export type SpeechRecordingState = 'idle' | 'requesting' | 'recording' | 'transcribing' | 'saved'

export interface UseSpeechRecognitionOptions {
  currentText: string
  onUpdateText: (newText: string) => void
  lang?: string
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
  isIos: boolean
  isAndroid: boolean
  startRecording: () => Promise<void>
  stopRecording: () => void
  toggleRecording: () => void
  clearPermissionNotice: () => void
  retryPermission: () => Promise<void>
}

// Detecção simples de navegador/plataforma para instruções específicas
function detectPlatform() {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return { isIos: false, isAndroid: false }
  }
  const ua = navigator.userAgent || ''
  const isIos =
    /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  const isAndroid = /Android/.test(ua)
  return { isIos, isAndroid }
}

export function useSpeechRecognition({
  currentText,
  onUpdateText,
  lang = 'pt-BR',
}: UseSpeechRecognitionOptions): UseSpeechRecognitionReturn {
  const [speechSupported, setSpeechSupported] = useState(false)
  const [state, setState] = useState<SpeechRecordingState>('idle')
  const [interimTranscript, setInterimTranscript] = useState('')
  const [recordingSeconds, setRecordingSeconds] = useState(0)
  const [audioDetected, setAudioDetected] = useState(false)
  const [permissionDeniedPermanent, setPermissionDeniedPermanent] = useState(false)
  const [permissionBlockedNotice, setPermissionBlockedNotice] = useState<string | null>(null)

  const recognitionRef = useRef<any>(null)
  const isRunningRef = useRef(false)
  const baseTextRef = useRef('')
  const sessionFinalRef = useRef('')
  const timerRef = useRef<any>(null)
  const saveTimeoutRef = useRef<any>(null)
  const micStreamRef = useRef<MediaStream | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const audioDetectedRef = useRef(false)
  const currentTextRef = useRef(currentText)

  // Sempre sincroniza a ref com o valor mais recente do campo
  useEffect(() => {
    currentTextRef.current = currentText
  }, [currentText])

  const { isIos, isAndroid } = detectPlatform()

  // Checagem inicial de suporte a SpeechRecognition
  useEffect(() => {
    const SpeechRec =
      typeof window !== 'undefined'
        ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
        : null
    setSpeechSupported(!!SpeechRec)
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

  // Liberação de áudio e medidor de áudio
  const setupAudioDetection = async (): Promise<boolean> => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        micStreamRef.current = stream

        try {
          const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
          if (AudioContextClass) {
            const ctx = new AudioContextClass()
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
              const average = sum / dataArray.length
              if (average > 10) {
                audioDetectedRef.current = true
                setAudioDetected(true)
              }
              requestAnimationFrame(checkAudio)
            }
            requestAnimationFrame(checkAudio)
          }
        } catch {
          // Fallback se AudioContext não estiver disponível
        }

        return true
      }
    } catch (err: any) {
      if (err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError') {
        setPermissionDeniedPermanent(true)
        setPermissionBlockedNotice(
          'Para gravar, o app precisa do microfone. Toque no ícone de cadeado/trava na barra de endereço do navegador e libere o microfone.',
        )
        return false
      }
    }
    return true
  }

  const stopAudioDetection = () => {
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
    stopAudioDetection()

    // Se houve transcrição acumulada nesta sessão, transição suave para 'saved'
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

  // Iniciar gravação com verificação de permissão simplificada
  const startRecording = useCallback(async () => {
    const SpeechRec =
      typeof window !== 'undefined'
        ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
        : null

    if (!SpeechRec) {
      setSpeechSupported(false)
      return
    }

    if (isRunningRef.current) return

    setPermissionBlockedNotice(null)
    setPermissionDeniedPermanent(false)
    setState('requesting')

    // 1. Verificar permissão de microfone se a Permissions API existir
    let permissionState: PermissionState | null = null
    try {
      if (navigator.permissions && navigator.permissions.query) {
        const queryRes = await navigator.permissions.query({ name: 'microphone' as any })
        permissionState = queryRes.state
      }
    } catch {
      // Query pode não ser suportada (ex: Firefox ou Safari antigo)
    }

    if (permissionState === 'denied') {
      setPermissionDeniedPermanent(true)
      setPermissionBlockedNotice(
        'Para gravar, o app precisa do microfone. Toque no ícone de cadeado/trava na barra de endereço do navegador e libere o microfone.',
      )
      setState('idle')
      return
    }

    // 2. Pedido nativo automático via getUserMedia (ativa popup se ainda for 'prompt')
    // Se o usuário clicar "Permitir", a stream é liberada e a gravação inicia imediatamente
    const allowed = await setupAudioDetection()
    if (!allowed) {
      setState('idle')
      return
    }

    // 3. Inicializar SpeechRecognition
    try {
      baseTextRef.current = currentTextRef.current || ''
      sessionFinalRef.current = ''
      setInterimTranscript('')
      audioDetectedRef.current = false
      setAudioDetected(false)

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
          audioDetectedRef.current = true
          setAudioDetected(true)
          commitTranscript(newFinalChunk)
        }
      }

      instance.onerror = (err: any) => {
        const errType = err?.error || ''

        if (errType === 'not-allowed' || errType === 'service-not-allowed') {
          setPermissionDeniedPermanent(true)
          setPermissionBlockedNotice(
            'Para gravar, o app precisa do microfone. Toque no ícone de cadeado/trava na barra de endereço do navegador e libere o microfone.',
          )
          isRunningRef.current = false
          stopAudioDetection()
          setState('idle')
          return
        }

        if (errType === 'audio-capture') {
          setPermissionBlockedNotice(
            'Nenhum microfone detectado. Verifique se o aparelho possui microfone disponível.',
          )
          isRunningRef.current = false
          stopAudioDetection()
          setState('idle')
          return
        }

        if (errType === 'network') {
          // Erro de rede temporário na Web Speech API
          // Preserva o texto já salvo e finaliza
          finalizeRecordingSession()
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
    } catch (e: any) {
      isRunningRef.current = false
      stopAudioDetection()
      setState('idle')
      if (e?.name === 'NotAllowedError') {
        setPermissionDeniedPermanent(true)
        setPermissionBlockedNotice(
          'Para gravar, o app precisa do microfone. Toque no ícone de cadeado/trava na barra de endereço do navegador e libere o microfone.',
        )
      }
    }
  }, [commitTranscript, finalizeRecordingSession, lang])

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

  // Tentar novamente a permissão
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
    isIos,
    isAndroid,
    startRecording,
    stopRecording,
    toggleRecording,
    clearPermissionNotice,
    retryPermission,
  }
}
