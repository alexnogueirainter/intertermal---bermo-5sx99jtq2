/**
 * Utilitário de Geração e Upload de PDF Oficial de Propostas Intertermal
 * Renderiza o elemento HTML da proposta (ou clona) e compila em PDF A4 via html2pdf.js
 * Faz upload do arquivo binário gerado no campo `pdf_file` da proposta no PocketBase.
 */
import pb from '@/lib/pocketbase/client'
import { QuoteRecord } from '@/types/crm'

declare global {
  interface Window {
    html2pdf?: any
  }
}

/**
 * Carrega a biblioteca html2pdf.js via script tag sob demanda caso ainda não esteja carregada no window
 */
export async function loadHtml2Pdf(): Promise<any> {
  if (typeof window === 'undefined') return null
  if (window.html2pdf) return window.html2pdf

  return new Promise((resolve, reject) => {
    // Verificar se já existe a tag no DOM
    const existingScript = document.getElementById('html2pdf-cdn-script') as HTMLScriptElement
    if (existingScript) {
      if (window.html2pdf) {
        resolve(window.html2pdf)
        return
      }
      existingScript.addEventListener('load', () => resolve(window.html2pdf))
      existingScript.addEventListener('error', (e) => reject(e))
      return
    }

    const script = document.createElement('script')
    script.id = 'html2pdf-cdn-script'
    script.src = 'https://cdn.jsdelivr.net/npm/html2pdf.js@0.10.1/dist/html2pdf.bundle.min.js'
    script.async = true
    script.crossOrigin = 'anonymous'
    script.onload = () => {
      if (window.html2pdf) {
        resolve(window.html2pdf)
      } else {
        reject(new Error('html2pdf não foi carregado corretamente.'))
      }
    }
    script.onerror = () => {
      // Fallback para cdnjs se jsdelivr falhar
      const fallbackScript = document.createElement('script')
      fallbackScript.src =
        'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js'
      fallbackScript.async = true
      fallbackScript.onload = () => resolve(window.html2pdf)
      fallbackScript.onerror = (err) => reject(err)
      document.head.appendChild(fallbackScript)
    }
    document.head.appendChild(script)
  })
}

/**
 * Gera um PDF (Blob / File) a partir de um elemento HTML (ex: #quote-printable-document)
 */
export async function generateQuotePdfBlob(
  elementOrSelector: HTMLElement | string,
  fileName: string = 'proposta.pdf',
): Promise<File | Blob> {
  const html2pdf = await loadHtml2Pdf()
  if (!html2pdf) {
    throw new Error('Mecanismo de geração de PDF indisponível.')
  }

  let element: HTMLElement | null = null
  if (typeof elementOrSelector === 'string') {
    element = document.querySelector(elementOrSelector)
  } else {
    element = elementOrSelector
  }

  if (!element) {
    throw new Error('Elemento da proposta não encontrado para gerar o PDF.')
  }

  const opt = {
    margin: [8, 8, 8, 8],
    filename: fileName,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: {
      scale: 2,
      useCORS: true,
      logging: false,
      scrollY: 0,
    },
    jsPDF: {
      unit: 'mm',
      format: 'a4',
      orientation: 'portrait',
    },
    pagebreak: {
      mode: ['avoid-all', 'css', 'legacy'],
      avoid: [
        'tr',
        '.quote-print-card',
        '.quote-print-keep-together',
        '.quote-print-header',
        '.quote-print-client-info',
        '.quote-print-signatures',
        '.quote-print-terms',
        '.quote-print-footer',
        'h1',
        'h2',
        'h3',
        'h4',
      ],
    },
  }

  const worker = html2pdf()
    .set(opt)
    .from(element)
    .toPdf()
    .get('pdf')
    .then((pdf: any) => {
      try {
        const totalPages =
          (pdf.internal && typeof pdf.internal.getNumberOfPages === 'function'
            ? pdf.internal.getNumberOfPages()
            : null) || (typeof pdf.getNumberOfPages === 'function' ? pdf.getNumberOfPages() : 1)

        for (let i = 1; i <= totalPages; i++) {
          pdf.setPage(i)

          const pageWidth =
            (pdf.internal && pdf.internal.pageSize && pdf.internal.pageSize.getWidth
              ? pdf.internal.pageSize.getWidth()
              : pdf.internal?.pageSize?.width) || 210
          const pageHeight =
            (pdf.internal && pdf.internal.pageSize && pdf.internal.pageSize.getHeight
              ? pdf.internal.pageSize.getHeight()
              : pdf.internal?.pageSize?.height) || 297

          // Rodapé institucional e paginação "Página X de Y"
          pdf.setFontSize(8)
          pdf.setTextColor(100, 116, 139) // Slate-500

          const footerTextLeft =
            'INTERTERMAL - Soluções Térmicas Industriais • alex.nogueira@intertermal.com.br'
          const pageStr = `Página ${i} de ${totalPages}`

          // Margem inferior de 5mm
          const yPos = pageHeight - 4

          // Texto institucional à esquerda (margem 8mm)
          pdf.text(footerTextLeft, 8, yPos)

          // Paginação à direita (margem 8mm da direita)
          if (typeof pdf.text === 'function') {
            // Se jsPDF suportar alinhamento right
            try {
              pdf.text(pageStr, pageWidth - 8, yPos, { align: 'right' })
            } catch {
              pdf.text(pageStr, pageWidth - 32, yPos)
            }
          }
        }
      } catch (pageErr) {
        console.warn('Não foi possível adicionar rodapé com numeração ao PDF:', pageErr)
      }
    })

  const pdfBlob: Blob = await worker.outputPdf('blob')

  // Retorna como File para upload no FormData
  const file = new File([pdfBlob], fileName, { type: 'application/pdf' })
  return file
}

/**
 * Faz upload do arquivo PDF gerado diretamente no campo `pdf_file` da proposta no PocketBase
 */
export async function uploadQuotePdf(quoteId: string, pdfFile: File | Blob): Promise<QuoteRecord> {
  const cleanId = (quoteId || '').trim()
  if (!cleanId) {
    throw new Error('quoteId é obrigatório para envio do PDF.')
  }

  const formData = new FormData()
  if (pdfFile instanceof File) {
    formData.append('pdf_file', pdfFile)
  } else {
    const file = new File([pdfFile], `Proposta_${cleanId}.pdf`, { type: 'application/pdf' })
    formData.append('pdf_file', file)
  }

  const updated = await pb.collection('quotes').update<QuoteRecord>(cleanId, formData)
  return updated
}

/**
 * Função completa: Localiza o elemento do documento (#quote-printable-document ou container fornecido),
 * compila o PDF e salva no campo `pdf_file` da proposta no banco.
 */
export async function generateAndUploadQuotePdf(
  quote: Partial<QuoteRecord>,
  element?: HTMLElement | null,
): Promise<{ success: boolean; pdfUrl?: string; fileName?: string; error?: string }> {
  try {
    if (!quote?.id) {
      return { success: false, error: 'Proposta sem ID válido.' }
    }

    // 1. Achar o elemento DOM
    let targetEl = element || document.getElementById('quote-printable-document')
    if (!targetEl) {
      // Fallback: tentar qualquer card da proposta visível
      targetEl = document.querySelector('.quote-printable-container')
    }

    if (!targetEl) {
      console.warn(
        'Elemento DOM da proposta não encontrado no momento da geração do PDF. O PDF será gerado quando a prévia for aberta.',
      )
      return {
        success: false,
        error: 'Documento visual da proposta não encontrado na tela para conversão em PDF.',
      }
    }

    const safeNumber = (quote.quote_number || quote.code || quote.id).replace(
      /[^a-zA-Z0-9_-]/g,
      '_',
    )
    const fileName = `Proposta_${safeNumber}.pdf`

    // 2. Gerar o Blob/File
    const pdfFile = await generateQuotePdfBlob(targetEl, fileName)

    // 3. Fazer upload para a coleção 'quotes'
    const updated = await uploadQuotePdf(quote.id, pdfFile)

    return {
      success: true,
      fileName: updated.pdf_file,
      pdfUrl: updated.pdf_file
        ? `${pb.baseUrl}/api/files/quotes/${updated.id}/${updated.pdf_file}`
        : undefined,
    }
  } catch (err: any) {
    console.warn('Erro ao gerar e enviar PDF da proposta:', err)
    return {
      success: false,
      error: err?.message || 'Falha ao processar e salvar PDF.',
    }
  }
}
