import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import pb from '@/lib/pocketbase/client'
import {
  appendTranscriptSafely,
  detectBrowserEnvironment,
  useVoiceRecorder,
} from './useVoiceRecorder'

describe('appendTranscriptSafely', () => {
  it('deve retornar o texto existente se o novo trecho for vazio', () => {
    expect(appendTranscriptSafely('Texto base', '')).toBe('Texto base')
    expect(appendTranscriptSafely('Texto base', '   ')).toBe('Texto base')
  })

  it('deve retornar apenas o novo trecho se o texto base for vazio', () => {
    expect(appendTranscriptSafely('', 'Primeira fala')).toBe('Primeira fala')
    expect(appendTranscriptSafely('   ', 'Primeira fala')).toBe('Primeira fala')
  })

  it('deve adicionar com nova linha preservando o texto digitado anteriormente', () => {
    const base = 'Vazamento constatado na conexão lateral'
    const novo = 'Necessário substituir gaxetas EPDM'
    const resultado = appendTranscriptSafely(base, novo)
    expect(resultado).toBe(
      'Vazamento constatado na conexão lateral\nNecessário substituir gaxetas EPDM',
    )
  })

  it('deve evitar duplicação imediata da mesma frase repetida', () => {
    const base = 'Troca de placas recomendada'
    const repetida = 'Troca de placas recomendada.'
    expect(appendTranscriptSafely(base, repetida)).toBe(base)
  })

  it('permite múltiplos append sucessivos sem sobrescrever', () => {
    let texto = ''
    texto = appendTranscriptSafely(texto, 'Equipamento revisado.')
    texto = appendTranscriptSafely(texto, 'Pressão de operação 6 bar.')
    texto = appendTranscriptSafely(texto, 'Temperatura 85°C.')

    expect(texto).toContain('Equipamento revisado.')
    expect(texto).toContain('Pressão de operação 6 bar.')
    expect(texto).toContain('Temperatura 85°C.')
  })
})

describe('detectBrowserEnvironment', () => {
  it('retorna estrutura com campos booleanos e nome de navegador', () => {
    const env = detectBrowserEnvironment()
    expect(env).toHaveProperty('browserName')
    expect(typeof env.isIos).toBe('boolean')
    expect(typeof env.isAndroid).toBe('boolean')
    expect(typeof env.isInAppBrowser).toBe('boolean')
    expect(typeof env.isInIframe).toBe('boolean')
    expect(typeof env.hasGetUserMedia).toBe('boolean')
    expect(typeof env.hasMediaRecorder).toBe('boolean')
    expect(typeof env.hasSpeechRecognition).toBe('boolean')
  })
})

describe('useVoiceRecorder - Ciclo Completo e Reinicialização Múltipla', () => {
  let mockTracks: Array<{ stop: ReturnType<typeof vi.fn> }>
  let mockStream: any
  let speechInstances: any[]

  beforeEach(() => {
    vi.useFakeTimers()
    mockTracks = [{ stop: vi.fn() }, { stop: vi.fn() }]
    mockStream = {
      getTracks: () => mockTracks,
    }
    speechInstances = []

    // Mock navigator.mediaDevices.getUserMedia
    Object.defineProperty(window.navigator, 'mediaDevices', {
      value: {
        getUserMedia: vi.fn().mockResolvedValue(mockStream),
      },
      writable: true,
      configurable: true,
    })

    // Mock MediaRecorder
    class MockMediaRecorder {
      state = 'inactive'
      mimeType = 'audio/webm'
      ondataavailable: ((e: any) => void) | null = null
      onstop: (() => void) | null = null
      start() {
        this.state = 'recording'
      }
      stop() {
        this.state = 'inactive'
        // Simula chunk captado: o áudio gravado existe (caminho principal = servidor)
        if (this.ondataavailable) {
          this.ondataavailable({ data: new Blob(['audio'], { type: 'audio/webm' }) })
        }
        if (this.onstop) this.onstop()
      }
      static isTypeSupported() {
        return true
      }
    }
    ;(window as any).MediaRecorder = MockMediaRecorder

    // Mock SpeechRecognition
    class MockSpeechRecognition {
      lang = ''
      continuous = false
      interimResults = false
      maxAlternatives = 1
      onstart: (() => void) | null = null
      onresult: ((e: any) => void) | null = null
      onerror: ((e: any) => void) | null = null
      onend: (() => void) | null = null
      abort = vi.fn()
      stop = vi.fn()
      start = vi.fn().mockImplementation(() => {
        if (this.onstart) this.onstart()
      })
      constructor() {
        speechInstances.push(this)
      }
    }
    ;(window as any).SpeechRecognition = MockSpeechRecognition
    ;(window as any).webkitSpeechRecognition = MockSpeechRecognition

    // Mock pb.send para transcrição de áudio via backend
    vi.spyOn(pb, 'send').mockResolvedValue({ ok: true, text: 'Texto transcrito do áudio' })
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
    delete (window as any).SpeechRecognition
    delete (window as any).webkitSpeechRecognition
  })

  it('permite ciclo de pelo menos 3 gravações seguidas no mesmo campo acumulando texto aditivamente', async () => {
    let currentValue = 'Observação inicial digitada pelo técnico.'
    const onChange = vi.fn((nextVal: string) => {
      currentValue = nextVal
    })

    const { result, rerender } = renderHook(
      ({ val }) =>
        useVoiceRecorder({
          value: val,
          onChange,
        }),
      {
        initialProps: { val: currentValue },
      },
    )

    expect(result.current.state).toBe('idle')
    expect(result.current.isRecording).toBe(false)

    // ============================================
    // CICLO 1: Iniciar primeira gravação
    // ============================================
    await act(async () => {
      await result.current.startRecording()
    })

    expect(result.current.state).toBe('recording')
    expect(result.current.isRecording).toBe(true)
    expect(speechInstances.length).toBe(1)

    // Simula resultado transcrito
    act(() => {
      speechInstances[0].onresult({
        resultIndex: 0,
        results: [[{ transcript: 'Vazamento constatado na gaxeta frontal' }]],
      })
      speechInstances[0].results[0].isFinal = true
    })

    rerender({ val: currentValue })

    // Parar gravação 1
    await act(async () => {
      await result.current.stopRecording()
    })

    // Deve estar em transição transcribing/saved
    expect(result.current.state).toBe('transcribing')

    // Avança tempo da transição
    act(() => {
      vi.advanceTimersByTime(350)
    })
    expect(result.current.state).toBe('saved')

    act(() => {
      vi.advanceTimersByTime(1600)
    })
    expect(result.current.state).toBe('idle')
    expect(result.current.isRecording).toBe(false)

    // Tracks devem ter sido paradas
    expect(mockTracks[0].stop).toHaveBeenCalled()

    // Texto acumulado 1: transcrição pelo SERVIDOR (caminho principal)
    expect(currentValue).toContain('Observação inicial digitada pelo técnico.')
    expect(currentValue).toContain('Texto transcrito do áudio')

    // ============================================
    // CICLO 2: Iniciar segunda gravação no mesmo campo
    // ============================================
    mockTracks[0].stop.mockClear()
    mockTracks[1].stop.mockClear()

    await act(async () => {
      await result.current.startRecording()
    })

    expect(result.current.state).toBe('recording')
    expect(result.current.isRecording).toBe(true)
    // Uma nova instância de reconhecimento foi criada
    expect(speechInstances.length).toBe(2)

    // Simula nova fala
    act(() => {
      speechInstances[1].onresult({
        resultIndex: 0,
        results: [[{ transcript: 'Pressão manométrica aferida em 4.5 bar' }]],
      })
      speechInstances[1].results[0].isFinal = true
    })

    rerender({ val: currentValue })

    // Parar gravação 2
    await act(async () => {
      await result.current.stopRecording()
    })

    act(() => {
      vi.advanceTimersByTime(2000)
    })
    expect(result.current.state).toBe('idle')

    // Texto acumulado 2: servidor responde de novo (dedupe evita duplicar)
    expect(currentValue).toContain('Texto transcrito do áudio')

    // ============================================
    // CICLO 3: Iniciar terceira gravação no mesmo campo
    // ============================================
    await act(async () => {
      await result.current.startRecording()
    })

    expect(result.current.state).toBe('recording')
    expect(speechInstances.length).toBe(3)

    // Simula terceira fala
    act(() => {
      speechInstances[2].onresult({
        resultIndex: 0,
        results: [[{ transcript: 'Recomendada substituição preventiva' }]],
      })
      speechInstances[2].results[0].isFinal = true
    })

    rerender({ val: currentValue })

    // Parar gravação 3
    await act(async () => {
      await result.current.stopRecording()
    })

    act(() => {
      vi.advanceTimersByTime(2000)
    })
    expect(result.current.state).toBe('idle')

    // Verifica que o texto da transcrição pelo servidor e o original estão preservados
    expect(currentValue).toContain('Observação inicial digitada pelo técnico.')
    expect(currentValue).toContain('Texto transcrito do áudio')
  })

  it('permite iniciar nova gravação imediatamente mesmo enquanto a transcrição anterior ainda está em transição', async () => {
    let currentValue = 'Texto base'
    const onChange = vi.fn((nextVal: string) => {
      currentValue = nextVal
    })

    const { result, rerender } = renderHook(
      ({ val }) =>
        useVoiceRecorder({
          value: val,
          onChange,
        }),
      {
        initialProps: { val: currentValue },
      },
    )

    // Inicia gravação 1
    await act(async () => {
      await result.current.startRecording()
    })

    act(() => {
      speechInstances[0].onresult({
        resultIndex: 0,
        results: [[{ transcript: 'Trecho 1' }]],
      })
      speechInstances[0].results[0].isFinal = true
    })

    rerender({ val: currentValue })

    // Para gravação 1 -> entra em 'transcribing'
    await act(async () => {
      await result.current.stopRecording()
    })
    expect(result.current.state).toBe('transcribing')

    // Técnico clica em Gravar imediatamente durante a transição
    await act(async () => {
      await result.current.startRecording()
    })

    // Deve aceitar a nova gravação imediatamente sem travar
    expect(result.current.state).toBe('recording')
    expect(result.current.isRecording).toBe(true)

    // Simula fala da gravação 2
    act(() => {
      speechInstances[1].onresult({
        resultIndex: 0,
        results: [[{ transcript: 'Trecho 2' }]],
      })
      speechInstances[1].results[0].isFinal = true
    })

    rerender({ val: currentValue })

    await act(async () => {
      await result.current.stopRecording()
    })

    act(() => {
      vi.advanceTimersByTime(2000)
    })

    expect(result.current.state).toBe('idle')
    expect(currentValue).toContain('Texto transcrito do áudio')
  })

  it('no ambiente iOS Safari: realiza 3 gravações consecutivas transcrevendo TEXTO para o campo e acumulando sem oferecer anexo', async () => {
    // Simula UserAgent do iPhone Safari
    const originalUserAgent = navigator.userAgent
    Object.defineProperty(window.navigator, 'userAgent', {
      value:
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1',
      configurable: true,
      writable: true,
    })
    // iOS: sem Web Speech API — servidor é o caminho principal
    delete (window as any).SpeechRecognition
    delete (window as any).webkitSpeechRecognition

    // Mock pb.send com textos diferentes para cada chamada
    let callCount = 0
    vi.spyOn(pb, 'send').mockImplementation(async () => {
      callCount++
      return {
        ok: true,
        text: `Transcrição Safari #${callCount}: levantamento técnico aprovado`,
      }
    })

    const onSaveAttachment = vi.fn()
    let currentValue = 'Anotação inicial de visita.'
    const onChange = vi.fn((nextVal: string) => {
      currentValue = nextVal
    })

    const { result, rerender } = renderHook(
      ({ val }) =>
        useVoiceRecorder({
          value: val,
          onChange,
          onSaveAudioAttachment: onSaveAttachment,
        }),
      {
        initialProps: { val: currentValue },
      },
    )

    // ============================================
    // GRAVAÇÃO 1 (iOS Safari)
    // ============================================
    await act(async () => {
      await result.current.startRecording()
    })

    expect(result.current.state).toBe('recording')
    expect(result.current.isRecording).toBe(true)
    // iOS sem Web Speech API: só MediaRecorder; servidor transcreve no stop
    expect(speechInstances.length).toBe(0)

    // Para a primeira gravação
    await act(async () => {
      await result.current.stopRecording()
    })
    expect(result.current.state).toBe('transcribing')

    act(() => {
      vi.advanceTimersByTime(350)
    })
    expect(result.current.state).toBe('saved')

    act(() => {
      vi.advanceTimersByTime(1600)
    })
    expect(result.current.state).toBe('idle')
    expect(result.current.isRecording).toBe(false)
    expect(mockTracks[0].stop).toHaveBeenCalled()

    // O texto foi transcrito e inserido no campo!
    expect(currentValue).toContain('Anotação inicial de visita.')
    expect(currentValue).toContain('Transcrição Safari #1')
    // Não deve oferecer anexo porque a transcrição pelo servidor teve sucesso!
    expect(result.current.showAttachmentFallback).toBe(false)

    // ============================================
    // GRAVAÇÃO 2 (iOS Safari - Segunda gravação no mesmo campo)
    // ============================================
    mockTracks[0].stop.mockClear()
    mockTracks[1].stop.mockClear()
    rerender({ val: currentValue })

    await act(async () => {
      await result.current.startRecording()
    })

    expect(result.current.state).toBe('recording')
    expect(result.current.isRecording).toBe(true)
    // Nova instância limpa de speech criada
    expect(speechInstances.length).toBe(2)

    // Para a segunda gravação
    await act(async () => {
      await result.current.stopRecording()
    })

    act(() => {
      vi.advanceTimersByTime(2000)
    })
    expect(result.current.state).toBe('idle')
    expect(result.current.isRecording).toBe(false)
    expect(mockTracks[0].stop).toHaveBeenCalled()

    // Texto acumulado da gravação 2
    expect(currentValue).toContain('Transcrição Safari #1')
    expect(currentValue).toContain('Transcrição Safari #2')
    expect(result.current.showAttachmentFallback).toBe(false)

    // ============================================
    // GRAVAÇÃO 3 (iOS Safari - Terceira gravação no mesmo campo)
    // ============================================
    mockTracks[0].stop.mockClear()
    mockTracks[1].stop.mockClear()
    rerender({ val: currentValue })

    await act(async () => {
      await result.current.startRecording()
    })

    expect(result.current.state).toBe('recording')
    expect(result.current.isRecording).toBe(true)

    // Para a terceira gravação
    await act(async () => {
      await result.current.stopRecording()
    })

    act(() => {
      vi.advanceTimersByTime(2000)
    })
    expect(result.current.state).toBe('idle')
    expect(result.current.isRecording).toBe(false)
    expect(mockTracks[0].stop).toHaveBeenCalled()

    // Todas as 3 transcrições pelo servidor acumuladas no campo!
    expect(currentValue).toContain('Anotação inicial de visita.')
    expect(currentValue).toContain('Transcrição Safari #1')
    expect(currentValue).toContain('Transcrição Safari #2')
    expect(currentValue).toContain('Transcrição Safari #3')
    expect(result.current.showAttachmentFallback).toBe(false)

    // Restaura userAgent
    Object.defineProperty(window.navigator, 'userAgent', {
      value: originalUserAgent,
      configurable: true,
      writable: true,
    })
  })

  it('no cenário de falha total: tenta retentativa automática e só oferece anexo se todas as vias falharem, sem perder texto anterior', async () => {
    // Simula falha total do backend (ex: offline ou erro 500)
    let fetchAttempts = 0
    vi.spyOn(pb, 'send').mockImplementation(async () => {
      fetchAttempts++
      return {
        ok: false,
      }
    })

    let currentValue = 'Texto já existente no campo.'
    const onChange = vi.fn((nextVal: string) => {
      currentValue = nextVal
    })

    const { result } = renderHook(() =>
      useVoiceRecorder({
        value: currentValue,
        onChange,
      }),
    )

    await act(async () => {
      await result.current.startRecording()
    })

    // Para a gravação sem que o Web Speech tenha retornado texto
    await act(async () => {
      await result.current.stopRecording()
    })

    // Deve ter tentado 2 vezes (tentativa inicial + 1 retentativa automática)
    expect(fetchAttempts).toBe(2)

    // Apenas agora entra no fallback de anexo como último recurso
    expect(result.current.showAttachmentFallback).toBe(true)
    expect(result.current.errorMessage).toContain('anexo da visita')
    expect(result.current.exactErrorDetail).toContain('Falha na transcrição')

    // O texto que o usuário já tinha digitado NUNCA é perdido
    expect(currentValue).toBe('Texto já existente no campo.')
  })
})
