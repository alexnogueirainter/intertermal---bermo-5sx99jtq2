/**
 * Utilitário de OCR no cliente para placas de identificação industriais (BERMO, Alfa Laval, etc.)
 *
 * Inclui:
 * 1. Pré-processamento via Canvas:
 *    - Escala ~2x (upscale com interpolação suave para leitura de gravação de baixo relevo)
 *    - Conversão para escala de cinza (luminância Rec. 709)
 *    - Ajuste de contraste e binarização adaptativa leve para destacar caracteres gravados em metal/alumínio
 * 2. Reconhecimento óptico com Tesseract.js (idioma 'eng' ou fallback CDN)
 * 3. Sanitização do texto extraído
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
 * Pré-processa a imagem da placa em um canvas:
 * - Upscaling 2x (até no máximo 3000px para economizar memória do dispositivo)
 * - Escala de cinza
 * - Aumento de contraste e filtro de realce de texto em metal
 */
export async function preprocessNameplateImage(imageSrc: string): Promise<string> {
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

    // Obter dados dos pixels
    const imgData = ctx.getImageData(0, 0, width, height)
    const data = imgData.data
    const totalPixels = data.length

    // 1º passo: Calcular brilho médio para ajuste adaptativo
    let sumGray = 0
    for (let i = 0; i < totalPixels; i += 4) {
      // Luminância ITU-R BT.709
      const gray = 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2]
      sumGray += gray
    }
    const avgGray = sumGray / (totalPixels / 4)

    // Fator de contraste: moderado (1.35 a 1.6)
    const contrastFactor = 1.45
    // Fator para realçar detalhes em metal (onde o fundo costuma ter brilho reflexivo)
    const brightnessAdjust = avgGray < 100 ? 25 : avgGray > 190 ? -20 : 0

    for (let i = 0; i < totalPixels; i += 4) {
      const r = data[i]
      const g = data[i + 1]
      const b = data[i + 2]

      // Escala de cinza
      let gray = 0.2126 * r + 0.7152 * g + 0.0722 * b + brightnessAdjust

      // Contraste sigmoidal/linear centrado no cinza médio
      gray = (gray - 128) * contrastFactor + 128

      // Clamp entre 0 e 255
      if (gray < 0) gray = 0
      if (gray > 255) gray = 255

      // Leve estiramento de histograma para destacar gravação em preto/fundo cinza
      if (gray < 75) {
        gray = Math.max(0, gray * 0.7) // letras mais escuras
      } else if (gray > 185) {
        gray = Math.min(255, gray * 1.15) // fundo metálico mais claro
      }

      data[i] = gray
      data[i + 1] = gray
      data[i + 2] = gray
      // alpha permanece data[i + 3]
    }

    ctx.putImageData(imgData, 0, 0)
    return canvas.toDataURL('image/jpeg', 0.9)
  } catch (err) {
    console.warn('[client-ocr] Falha no pré-processamento de imagem, usando original:', err)
    return imageSrc
  }
}

/**
 * Executa o OCR no cliente com Tesseract.js
 * Retorna o texto extraído limpo ou string vazia se falhar
 */
export async function runClientOcr(
  imageSrc: string,
  onProgress?: OcrProgressCallback,
): Promise<{ text: string; confidence?: number }> {
  if (!imageSrc) {
    return { text: '', confidence: 0 }
  }

  onProgress?.({ status: 'Preparando imagem...', progress: 0.1 })

  // 1. Pré-processamento em canvas
  let processedSrc = imageSrc
  try {
    processedSrc = await preprocessNameplateImage(imageSrc)
  } catch (_) {
    processedSrc = imageSrc
  }

  onProgress?.({ status: 'Inicializando motor OCR...', progress: 0.25 })

  try {
    // Importação dinâmica para evitar overhead inicial do bundle
    const tesseractModule = await import('tesseract.js')
    const createWorker =
      tesseractModule.createWorker ||
      (tesseractModule.default && (tesseractModule.default as any).createWorker)

    if (typeof createWorker === 'function') {
      const worker = await createWorker('eng', 1, {
        logger: (m: any) => {
          if (m && m.status) {
            const pct = typeof m.progress === 'number' ? Math.round(m.progress * 100) : 0
            if (m.status === 'recognizing text') {
              onProgress?.({
                status: `Lendo placa... ${pct}%`,
                progress: 0.3 + (m.progress || 0) * 0.65,
              })
            } else {
              onProgress?.({
                status: 'Processando placa...',
                progress: 0.25,
              })
            }
          }
        },
      })

      const ret = await worker.recognize(processedSrc)
      const rawText = ret && ret.data && ret.data.text ? ret.data.text : ''
      const confidence =
        ret && ret.data && typeof ret.data.confidence === 'number' ? ret.data.confidence : 0

      await worker.terminate()

      onProgress?.({ status: 'Concluído', progress: 1.0 })

      return {
        text: (rawText || '').trim(),
        confidence,
      }
    }
  } catch (err: any) {
    console.warn('[client-ocr] Erro ao executar tesseract.js local:', err?.message || err)
  }

  // Fallback caso Tesseract.js falhe em carregar workers no ambiente
  return { text: '', confidence: 0 }
}
