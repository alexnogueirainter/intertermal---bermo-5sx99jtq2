import { describe, it, expect } from 'vitest'
import { appendTranscriptSafely, detectBrowserEnvironment } from './useVoiceRecorder'

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
    expect(typeof env.hasGetUserMedia).toBe('boolean')
    expect(typeof env.hasMediaRecorder).toBe('boolean')
    expect(typeof env.hasSpeechRecognition).toBe('boolean')
  })
})
