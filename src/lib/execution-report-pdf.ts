/**
 * Utilitário de Geração e Download de PDF para Relatório de Execução de OS
 * Baseado no padrão html2pdf.js com suporte a fallback de impressão nativa
 */
import { loadHtml2Pdf } from '@/lib/quote-pdf-generator'

export async function generateExecutionReportPdf(
  elementOrSelector: HTMLElement | string,
  fileName: string = 'relatorio-execucao.pdf',
): Promise<void> {
  let element: HTMLElement | null = null
  if (typeof elementOrSelector === 'string') {
    element = document.querySelector(elementOrSelector)
  } else {
    element = elementOrSelector
  }

  if (!element) {
    throw new Error('Elemento do relatório não encontrado para gerar PDF.')
  }

  const html2pdf = await loadHtml2Pdf()
  if (!html2pdf) {
    // Fallback: aciona window.print
    window.print()
    return
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
        '.report-print-card',
        '.report-print-header',
        '.report-print-keep',
        '.report-photo-item',
        'h1',
        'h2',
        'h3',
        'h4',
      ],
    },
  }

  await html2pdf()
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

          pdf.setFontSize(8)
          pdf.setTextColor(100, 116, 139)
          const footerTextLeft =
            'INTERTERMAL - Relatório de Execução de OS • Suporte BERMO Especializado'
          const pageStr = `Página ${i} de ${totalPages}`
          const yPos = pageHeight - 4

          pdf.text(footerTextLeft, 8, yPos)
          try {
            pdf.text(pageStr, pageWidth - 8, yPos, { align: 'right' })
          } catch {
            pdf.text(pageStr, pageWidth - 28, yPos)
          }
        }
      } catch (err) {
        console.warn('Erro ao inserir numeração no rodapé do PDF:', err)
      }
    })
    .save()
}
