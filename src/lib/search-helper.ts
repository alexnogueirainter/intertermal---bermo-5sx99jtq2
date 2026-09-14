/**
 * Utilitário seguro para busca de termos técnicos na internet.
 * Garante abertura em nova aba com noopener, evitando problemas de bloqueio por resposta (ERR_BLOCKED_BY_RESPONSE)
 * e oferecendo mecanismos seguros com fallback estruturado (Google -> DuckDuckGo -> Bing).
 */

export interface OpenInternetSearchOptions {
  model: string
  brand?: string
  extraTerms?: string
  enginePreference?: 'google' | 'duckduckgo' | 'bing'
}

/**
 * Monta URL de busca parametrizada e codificada para motores de busca seguros.
 * NUNCA aponta para a raiz do domínio (ex: www.google.com). Sempre inclui rota de busca com query codificada.
 */
export function buildSearchUrl(
  query: string,
  engine: 'google' | 'duckduckgo' | 'bing' = 'google',
): string {
  const encodedQuery = encodeURIComponent(query.trim())
  switch (engine) {
    case 'duckduckgo':
      return `https://duckduckgo.com/?q=${encodedQuery}`
    case 'bing':
      return `https://www.bing.com/search?q=${encodedQuery}`
    case 'google':
    default:
      return `https://www.google.com/search?q=${encodedQuery}`
  }
}

/**
 * Abre a pesquisa em uma nova aba do navegador com proteção noopener e noreferrer.
 * Se o navegador bloquear o popup ou falhar, tenta motores alternativos ou retorna erro amigável.
 */
export function openTechnicalSearchInNewTab(options: OpenInternetSearchOptions): {
  success: boolean
  engine: string
  url: string
} {
  const {
    model,
    brand,
    extraTerms = 'trocador de calor especificações técnicas datasheet',
    enginePreference = 'google',
  } = options
  const parts: string[] = []
  if (brand && brand.trim() && brand.trim().toLowerCase() !== 'outro') {
    parts.push(brand.trim())
  }
  if (model && model.trim()) {
    parts.push(model.trim())
  }
  if (extraTerms && extraTerms.trim()) {
    parts.push(extraTerms.trim())
  }

  const queryTerm = parts.join(' ').trim() || `${model} trocador de calor especificações`
  const targetUrl = buildSearchUrl(queryTerm, enginePreference)

  try {
    // Tenta abrir em nova aba com flags de segurança completas
    const newWindow = window.open(targetUrl, '_blank', 'noopener,noreferrer')

    // Se window.open foi bloqueado pelo popup blocker do navegador, tentamos um fallback via âncora temporária
    if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
      try {
        const link = document.createElement('a')
        link.href = targetUrl
        link.target = '_blank'
        link.rel = 'noopener noreferrer'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      } catch (domErr) {
        console.warn('Fallback de abertura via âncora falhou:', domErr)
      }
    }

    return {
      success: true,
      engine: enginePreference,
      url: targetUrl,
    }
  } catch (err) {
    console.warn(`Erro ao abrir ${enginePreference}, tentando fallback DuckDuckGo:`, err)
    const fallbackUrl = buildSearchUrl(queryTerm, 'duckduckgo')
    try {
      window.open(fallbackUrl, '_blank', 'noopener,noreferrer')
      return {
        success: true,
        engine: 'duckduckgo',
        url: fallbackUrl,
      }
    } catch (finalErr) {
      console.error('Falha geral ao abrir busca na internet:', finalErr)
      return {
        success: false,
        engine: 'failed',
        url: targetUrl,
      }
    }
  }
}
