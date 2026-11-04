/**
 * Utilitário de OCR no cliente para placas de identificação industriais (BERMO, Alfa Laval, etc.)
 *
 * Inclui:
 * 1. Pré-processamento multi-variante via Canvas, focado em TEXTO GRAVADO EM RELEVO:
 *    - Variante A: Alto contraste + normalização/estiramento de histograma
 *    - Variante B: Binarização adaptativa (Otsu / threshold local) para gravação em baixo relevo e reflexos metálicos
 *    - Variante C: Inversão / negativo para plaquetas com fundo escuro / anodizado
 *    - Variante D: Limiar adaptativo local (luz desigual/sombra na placa) via imagem integral
 *    - Variante E: Nitidez (unsharp mask) + estiramento — recupera gravação rasa e pouco contrastada
 * 2. Reconhecimento óptico com Tesseract.js avaliando as variantes:
 *    - Seleciona a variante com maior confiança média (limiar ~70%)
 *    - Modo de página esparso (PSM 11) na melhor variante quando a leitura em bloco falha —
 *      plaquetas são TABELAS com rótulos espalhados, não um parágrafo corrido
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

    sumB += t * histogram[wB ? t : t]
    const mB = sumB / wB
    const mF = wF > 0 ? (sum - sumB) / wF : 0
    // Variância inter-classes
    const variance = wB * wF * (mB - mF) * (mB - mF)
    if (variance > maxVariance) {
      maxVariance = variance
      threshold = t
    }
  }

  return threshold
}

export type PreprocessVariant = 'contrast' | 'binarized' | 'inverted' | 'adaptive' | 'sharpened'

/**
 * Pré-processa a imagem da placa em um canvas de acordo com a variante escolhida:
 * - 'contrast': Alto contraste + estiramento de histograma
 * - 'binarized': Binarização adaptativa Otsu
 * - 'inverted': Negativo / inversão para placas escuras
 * - 'adaptive': Limiar adaptativo local (janela via imagem integral) — luz desigual/sombra
 * - 'sharpened': Unsharp mask + estiramento de contraste — gravação rasa
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

    // Fator de escala: ~2.5x (texto gravado é pequeno), limitando dimensões máximas
    const scale = Math.min(2.5, 4000 / Math.max(naturalWidth, naturalHeight))
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
      // Variante C: Negativo / Inversão para placas escuras ou gravação clara em fundo escuro
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
    } else if (variant === 'adaptive') {
      // Variante D: Limiar adaptativo LOCAL (janela 32px via imagem integral).
      // Resolve sombra/reflexo parcial na placa: o Otsu global falha quando metade
      // da placa está iluminada e a outra em sombra.
      const winR = 16
      // Im integral (soma) em Float64Array — O(n)
      const integral = new Float64Array((width + 1) * (height + 1))
      for (let y = 0; y < height; y++) {
        let rowSum = 0
        for (let x = 0; x < width; x++) {
          rowSum += grayData[y * width + x]
          integral[(y + 1) * (width + 1) + (x + 1)] = integral[y * (width + 1) + (x + 1)] + rowSum
        }
      }
      const bias = 10 // texto gravado é levemente mais escuro que o fundo local
      for (let y = 0; y < height; y++) {
        const y0 = Math.max(0, y - winR)
        const y1 = Math.min(height - 1, y + winR)
        for (let x = 0; x < width; x++) {
          const x0 = Math.max(0, x - winR)
          const x1 = Math.min(width - 1, x + winR)
          const area = (x1 - x0 + 1) * (y1 - y0 + 1)
          const s =
            integral[(y1 + 1) * (width + 1) + (x1 + 1)] -
            integral[y0 * (width + 1) + (x1 + 1)] -
            integral[(y1 + 1) * (width + 1) + x0] +
            integral[y0 * (width + 1) + x0]
          const localMean = s / area
          const val = grayData[y * width + x] < localMean - bias ? 0 : 255
          const idx = (y * width + x) * 4
          data[idx] = val
          data[idx + 1] = val
          data[idx + 2] = val
        }
      }
    } else if (variant === 'sharpened') {
      // Variante E: Unsharp mask 3x3 + estiramento de contraste.
      // Recupera gravação rasa: realça bordas dos caracteres pouco marcados.
      const blur = new Uint8Array(totalPixels)
      // Blur 3x3 (box)
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          let s = 0
          let n = 0
          for (let dy = -1; dy <= 1; dy++) {
            const yy = y + dy
            if (yy < 0 || yy >= height) continue
            for (let dx = -1; dx <= 1; dx++) {
              const xx = x + dx
              if (xx < 0 || xx >= width) continue
              s += grayData[yy * width + xx]
              n++
            }
          }
          blur[y * width + x] = Math.round(s / n)
        }
      }
      const amount = 1.6
      let lo = 255
      let hi = 0
      const sharp = new Uint8Array(totalPixels)
      for (let p = 0; p < totalPixels; p++) {
        let v = Math.round(grayData[p] + amount * (grayData[p] - blur[p]))
        if (v < 0) v = 0
        if (v > 255) v = 255
        sharp[p] = v
        if (v < lo) lo = v
        if (v > hi) hi = v
      }
      // Estiramento de contraste (percentis 2–98 aproximados por lo/hi)
      const range = Math.max(1, hi - lo)
      for (let i = 0, p = 0; i < data.length; i += 4, p++) {
        const g = Math.round(((sharp[p] - lo) / range) * 255)
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
 * Executa o OCR no cliente com Tesseract.js avaliando 5 variantes de pré-processamento
 * (A: Contraste, B: Otsu, C: Inversão, D: Limiar adaptativo local, E: Nitidez) para máxima
 * leitura em placas metálicas gravadas em relevo. Quando a leitura em bloco (PSM 6) falha,
 * roda o modo esparso (PSM 11) na melhor variante — plaquetas são tabelas com rótulos
 * espalhados, não um parágrafo corrido.
 */
export async function runClientOcr(
  imageSrc: string,
  onProgress?: OcrProgressCallback,
): Promise<{ text: string; confidence?: number; methodUsed?: string }> {
  if (!imageSrc) {
    return { text: '', confidence: 0 }
  }

  onProgress?.({ status: 'Preparando filtros de imagem...', progress: 0.1 })

  // Gera as variantes de pré-processamento
  const variantSrcs: Record<PreprocessVariant, string> = {
    contrast: imageSrc,
    binarized: imageSrc,
    inverted: imageSrc,
    adaptive: imageSrc,
    sharpened: imageSrc,
  }

  try {
    variantSrcs.contrast = await preprocessVariant(imageSrc, 'contrast')
    variantSrcs.binarized = await preprocessVariant(imageSrc, 'binarized')
    variantSrcs.inverted = await preprocessVariant(imageSrc, 'inverted')
    variantSrcs.adaptive = await preprocessVariant(imageSrc, 'adaptive')
    variantSrcs.sharpened = await preprocessVariant(imageSrc, 'sharpened')
  } catch (e) {
    console.warn('[client-ocr] Erro gerando variantes:', e)
  }

  onProgress?.({ status: 'Inicializando motor OCR...', progress: 0.2 })

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
              progress: 0.2 + rawProg * 0.7,
            })
          }
        },
      })

      const results: Array<{ name: string; text: string; conf: number }> = []

      const recognizeVariant = async (
        name: string,
        src: string,
        psm: string,
        progressFrom: number,
        progressTo: number,
      ): Promise<{ text: string; conf: number }> => {
        try {
          await worker.setParameters({ tessedit_pageseg_mode: psm })
          onProgress?.({
            status: name.startsWith('sparse')
              ? 'Lendo rótulos espalhados da placa...'
              : `Lendo com filtro ${name}...`,
            progress: progressFrom,
          })
          const res = await worker.recognize(src)
          const text = (res?.data?.text || '').trim()
          const conf = typeof res?.data?.confidence === 'number' ? res.data.confidence : 0
          results.push({ name, text, conf })
          if (conf >= 70 && text.length > 30) {
            onProgress?.({ status: 'Concluído', progress: 1.0 })
            return { text, conf }
          }
          return { text, conf }
        } catch (err: any) {
          console.warn(`[client-ocr] Falha na variante ${name}:`, err?.message || err)
          return { text: '', conf: 0 }
        }
      }

      // 1. Variante A (Alto Contraste) em bloco
      const a = await recognizeVariant('contrast', variantSrcs.contrast, '6', 0.3, 0.4)
      if (a.conf >= 70 && a.text.length > 30) {
        await worker.terminate()
        return { text: a.text, confidence: a.conf, methodUsed: 'contrast_variant' }
      }

      // 2. Variante B (Otsu) em bloco
      const b = await recognizeVariant('binarized', variantSrcs.binarized, '6', 0.4, 0.5)
      if (b.conf >= 70 && b.text.length > 30) {
        await worker.terminate()
        return { text: b.text, confidence: b.conf, methodUsed: 'binarized_variant' }
      }

      // 3. Variante D (Limiar adaptativo local) em bloco — a mais promissora para relevo com sombra
      const d = await recognizeVariant('adaptive', variantSrcs.adaptive, '6', 0.5, 0.6)
      if (d.conf >= 70 && d.text.length > 30) {
        await worker.terminate()
        return { text: d.text, confidence: d.conf, methodUsed: 'adaptive_variant' }
      }

      // 4. Variante E (Nitidez) em bloco — gravação rasa
      const e = await recognizeVariant('sharpened', variantSrcs.sharpened, '6', 0.6, 0.7)
      if (e.conf >= 70 && e.text.length > 30) {
        await worker.terminate()
        return { text: e.text, confidence: e.conf, methodUsed: 'sharpened_variant' }
      }

      // 5. Variante C (Inversão) em bloco — placas escuras
      const c = await recognizeVariant('inverted', variantSrcs.inverted, '6', 0.7, 0.8)
      if (c.conf >= 70 && c.text.length > 30) {
        await worker.terminate()
        return { text: c.text, confidence: c.conf, methodUsed: 'inverted_variant' }
      }

      // 6. Modo esparso (PSM 11) na melhor variante até agora — plaquetas são tabelas
      const ranked = [...results].sort((x, y) => y.conf - x.conf)
      const bestName = ranked[0]?.name || 'contrast'
      const bestSrc =
        bestName === 'binarized'
          ? variantSrcs.binarized
          : bestName === 'adaptive'
            ? variantSrcs.adaptive
            : bestName === 'sharpened'
              ? variantSrcs.sharpened
              : bestName === 'inverted'
                ? variantSrcs.inverted
                : variantSrcs.contrast
      const sparse = await recognizeVariant('sparse-' + bestName, bestSrc, '11', 0.8, 0.92)
      if (sparse.conf >= 70 && sparse.text.length > 30) {
        await worker.terminate()
        return { text: sparse.text, confidence: sparse.conf, methodUsed: 'sparse_variant' }
      }

      await worker.terminate()

      // Nenhuma atingiu 70%: consolida linhas únicas entre TODAS as variantes
      // (inclui o esparso, que costuma capturar rótulos isolados que o bloco perde)
      const consolidatedText = mergeOcrTexts(results.map((r) => r.text))
      const averageConf = Math.round(
        results.reduce((s, r) => s + r.conf, 0) / Math.max(1, results.length),
      )

      onProgress?.({ status: 'Concluído', progress: 1.0 })
      return {
        text: consolidatedText || ranked[0]?.text || '',
        confidence: Math.max(ranked[0]?.conf || 0, averageConf),
        methodUsed: 'consolidated_variants',
      }
    }
  } catch (err: any) {
    console.warn('[client-ocr] Erro ao executar tesseract.js local:', err?.message || err)
  }

  return { text: '', confidence: 0 }
}
