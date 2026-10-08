/**
 * Utilitário de OCR no cliente para placas de identificação industriais (BERMO, Alfa Laval, etc.)
 *
 * Inclui:
 * 1. Pré-processamento multi-variante via Canvas:
 *    - Variante A: Alto contraste + normalização/estiramento de histograma
 *    - Variante B: Binarização adaptativa (Otsu / threshold local) para gravação em baixo relevo e reflexos metálicos
 *    - Variante C: Inversão / negativo para plaquetas com fundo escuro / anodizado
 * 2. Reconhecimento óptico com Tesseract.js avaliando as variantes:
 *    - Seleciona a variante com maior confiança média (limiar ~70%)
 *    - Se nenhuma atingir 70%, combina linhas únicas entre as variantes
 *    - Callbacks contínuos de progresso mantidos
 * 3. Sanitização do texto extraído para envio ao backend
 */

export interface NameplateOcrProgress {
  status: string
  progress: number
}

export type OcrProgressCallback = (progress: NameplateOcrProgress) => void

/**
 * Carrega uma imagem a partir de uma dataURL ou URL http(s) para um elemento HTMLImageElement
 */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = (e) => reject(new Error('Falha ao carregar imagem para OCR: ' + String(e)))
    img.src = src
  })
}

/**
 * Calcula o limiar de Otsu a partir de um histograma de 256 níveis de cinza
 */
function calculateOtsuThreshold(histogram: number[], totalPixels: number): number {
  let sum = 0
  for (let i = 0; i < 256; i++) {
    sum += i * histogram[i]
  }

  let sumB = 0
  let wB = 0
  let wF = 0
  let maxVariance = 0
  let threshold = 128

  for (let t = 0; t < 256; t++) {
    wB += histogram[t]
    if (wB === 0) continue
    wF = totalPixels - wB
    if (wF === 0) break

    sumB += t * histogram[t]
    const mB = sumB / wB
    const mF = (sum - sumB) / wF

    // Variância inter-classes
    const variance = wB * wF * (mB - mF) * (mB - mF)
    if (variance > maxVariance) {
      maxVariance = variance
      threshold = t
    }
  }

  return threshold
}

export type PreprocessVariant = 'contrast' | 'binarized' | 'inverted'

/**
 * Pré-processa a imagem da placa em um canvas de acordo com a variante escolhida:
 * - 'contrast': Alto contraste + estiramento de histograma
 * - 'binarized': Binarização adaptativa Otsu
 * - 'inverted': Negativo / inversão para placas escuras
 */
export async function preprocessVariant(
  imageSrc: string,
  variant: PreprocessVariant = 'contrast',
): Promise<string> {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return imageSrc
  }

  try {
    const img = await loadImage(imageSrc)
    const naturalWidth = img.naturalWidth || img.width || 800
    const naturalHeight = img.naturalHeight || img.height || 600

    // Fator de escala: ~2x, limitando dimensões máximas
    const scale = Math.min(2.0, 3000 / Math.max(naturalWidth, naturalHeight))
    const width = Math.max(200, Math.round(naturalWidth * Math.max(1, scale)))
    const height = Math.max(200, Math.round(naturalHeight * Math.max(1, scale)))

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height

    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) return imageSrc

    // Desenha imagem redimensionada com suavização
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(img, 0, 0, width, height)

    const imgData = ctx.getImageData(0, 0, width, height)
    const data = imgData.data
    const totalPixels = width * height

    // 1. Converter para escala de cinza e montar histograma
    const grayData = new Uint8Array(totalPixels)
    const histogram = new Array<number>(256).fill(0)
    let sumGray = 0

    for (let i = 0, p = 0; i < data.length; i += 4, p++) {
      const r = data[i]
      const g = data[i + 1]
      const b = data[i + 2]
      // Luminância ITU-R BT.709
      const lum = Math.round(0.2126 * r + 0.7152 * g + 0.0722 * b)
      grayData[p] = lum
      histogram[lum]++
      sumGray += lum
    }

    const avgGray = sumGray / totalPixels

    if (variant === 'contrast') {
      // Variante A: Alto contraste + normalização de histograma
      const contrastFactor = 1.55
      const brightnessAdjust = avgGray < 100 ? 25 : avgGray > 190 ? -20 : 0

      for (let i = 0, p = 0; i < data.length; i += 4, p++) {
        let g = grayData[p] + brightnessAdjust
        g = (g - 128) * contrastFactor + 128
        if (g < 0) g = 0
        if (g > 255) g = 255

        // Estiramento de histograma
        if (g < 80) {
          g = Math.max(0, g * 0.65)
        } else if (g > 180) {
          g = Math.min(255, g * 1.2)
        }

        data[i] = g
        data[i + 1] = g
        data[i + 2] = g
      }
    } else if (variant === 'binarized') {
      // Variante B: Binarização adaptativa Otsu para gravação em baixo relevo e reflexos
      const otsuT = calculateOtsuThreshold(histogram, totalPixels)
      // Ajuste leve baseado no brilho geral da placa
      const threshold = Math.max(60, Math.min(200, otsuT))

      for (let i = 0, p = 0; i < data.length; i += 4, p++) {
        const val = grayData[p] >= threshold ? 255 : 0
        data[i] = val
        data[i + 1] = val
        data[i + 2] = val
      }
    } else if (variant === 'inverted') {
      // Variante C: Negativo / Inversão para placas com fundo escuro ou anodizado
      for (let i = 0, p = 0; i < data.length; i += 4, p++) {
        const inv = 255 - grayData[p]
        // Leve aumento de contraste do negativo
        let g = (inv - 128) * 1.35 + 128
        if (g < 0) g = 0
        if (g > 255) g = 255
        data[i] = g
        data[i + 1] = g
        data[i + 2] = g
      }
    }

    ctx.putImageData(imgData, 0, 0)
    return canvas.toDataURL('image/jpeg', 0.9)
  } catch (err) {
    console.warn(`[client-ocr] Falha no pré-processamento variante '${variant}':`, err)
    return imageSrc
  }
}

/**
 * Função mantida para retrocompatibilidade
 */
export async function preprocessNameplateImage(imageSrc: string): Promise<string> {
  return preprocessVariant(imageSrc, 'contrast')
}

/**
 * Limpa e normaliza linhas de texto de OCR
 */
function normalizeLine(line: string): string {
  return line.trim().replace(/\s+/g, ' ').replace(/[|~]/g, '').trim()
}

/**
 * Combina linhas únicas de múltiplas variantes de OCR, preservando ordem e removendo duplicatas
 */
function mergeOcrTexts(texts: string[]): string {
  const seen = new Set<string>()
  const mergedLines: string[] = []

  for (const text of texts) {
    if (!text) continue
    const lines = text.split('\n')
    for (const rawLine of lines) {
      const line = normalizeLine(rawLine)
      if (line.length < 2) continue
      // Chave simplificada para deduplicação sem case/pontuação
      const key = line.toLowerCase().replace(/[^a-z0-9]/g, '')
      if (key && !seen.has(key)) {
        seen.add(key)
        mergedLines.push(line)
      }
    }
  }

  return mergedLines.join('\n')
}

/**
 * Executa o OCR no cliente com Tesseract.js avaliando 3 variantes de pré-processamento
 * (A: Contraste, B: Binarização Otsu, C: Inversão) para máxima leitura em placas metálicas.
 */
export async function runClientOcr(
  imageSrc: string,
  onProgress?: OcrProgressCallback,
): Promise<{ text: string; confidence?: number; methodUsed?: string }> {
  if (!imageSrc) {
    return { text: '', confidence: 0 }
  }

  onProgress?.({ status: 'Preparando filtros de imagem...', progress: 0.1 })

  // Gera as 3 variantes de pré-processamento
  let variantA = imageSrc
  let variantB = imageSrc
  let variantC = imageSrc

  try {
    variantA = await preprocessVariant(imageSrc, 'contrast')
    variantB = await preprocessVariant(imageSrc, 'binarized')
    variantC = await preprocessVariant(imageSrc, 'inverted')
  } catch (e) {
    console.warn('[client-ocr] Erro gerando variantes:', e)
  }

  onProgress?.({ status: 'Inicializando motor OCR...', progress: 0.25 })

  try {
    const tesseractModule = await import('tesseract.js')
    const createWorker =
      tesseractModule.createWorker ||
      (tesseractModule.default && (tesseractModule.default as any).createWorker)

    if (typeof createWorker === 'function') {
      const worker = await createWorker('eng', 1, {
        logger: (m: any) => {
          if (m && m.status === 'recognizing text') {
            const rawProg = typeof m.progress === 'number' ? m.progress : 0
            const pct = Math.round(rawProg * 100)
            onProgress?.({
              status: `Lendo caracteres na placa... ${pct}%`,
              progress: 0.25 + rawProg * 0.65,
            })
          }
        },
      })

      // 1. Executa primeira variante (Alto Contraste)
      onProgress?.({ status: 'Lendo com filtro de alto contraste...', progress: 0.35 })
      const resA = await worker.recognize(variantA)
      const textA = (resA?.data?.text || '').trim()
      const confA = typeof resA?.data?.confidence === 'number' ? resA.data.confidence : 0

      // Se a variante A tiver confiança muito boa (>= 70%) e texto substantivo, finaliza cedo
      if (confA >= 70 && textA.length > 30) {
        await worker.terminate()
        onProgress?.({ status: 'Concluído', progress: 1.0 })
        return { text: textA, confidence: confA, methodUsed: 'contrast_variant' }
      }

      // 2. Executa segunda variante (Binarização adaptativa Otsu)
      onProgress?.({ status: 'Lendo com filtro de relevo metálico...', progress: 0.55 })
      const resB = await worker.recognize(variantB)
      const textB = (resB?.data?.text || '').trim()
      const confB = typeof resB?.data?.confidence === 'number' ? resB.data.confidence : 0

      if (confB >= 70 && textB.length > 30) {
        await worker.terminate()
        onProgress?.({ status: 'Concluído', progress: 1.0 })
        return { text: textB, confidence: confB, methodUsed: 'binarized_variant' }
      }

      // 3. Executa terceira variante (Inversão para placas escuras)
      onProgress?.({ status: 'Lendo com filtro de placa escura...', progress: 0.75 })
      const resC = await worker.recognize(variantC)
      const textC = (resC?.data?.text || '').trim()
      const confC = typeof resC?.data?.confidence === 'number' ? resC.data.confidence : 0

      await worker.terminate()

      // Escolhe a melhor ou consolida as linhas únicas se nenhuma atingir 70%
      const variants = [
        { name: 'contrast', text: textA, conf: confA },
        { name: 'binarized', text: textB, conf: confB },
        { name: 'inverted', text: textC, conf: confC },
      ].sort((a, b) => b.conf - a.conf)

      const best = variants[0]

      // Se a melhor tiver confiança razoável (>= 70%), usa ela
      if (best.conf >= 70 && best.text.length > 20) {
        onProgress?.({ status: 'Concluído', progress: 1.0 })
        return { text: best.text, confidence: best.conf, methodUsed: best.name }
      }

      // Caso contrário, consolida linhas únicas entre as variantes para capturar o máximo de dados
      const consolidatedText = mergeOcrTexts([textA, textB, textC])
      const averageConf = Math.round((confA + confB + confC) / 3)

      onProgress?.({ status: 'Concluído', progress: 1.0 })
      return {
        text: consolidatedText || best.text,
        confidence: Math.max(best.conf, averageConf),
        methodUsed: 'consolidated_variants',
      }
    }
  } catch (err: any) {
    console.warn('[client-ocr] Erro ao executar tesseract.js local:', err?.message || err)
  }

  return { text: '', confidence: 0 }
}
