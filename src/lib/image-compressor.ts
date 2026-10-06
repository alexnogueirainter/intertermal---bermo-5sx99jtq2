/**
 * Utilitário de compressão de imagens para upload seguro no PocketBase
 * Redimensiona para no máx ~1600px no maior lado e comprime via canvas (JPEG ~0.8)
 * Se falhar, retorna o arquivo original.
 */
export async function compressImageForUpload(
  file: File,
  maxDimension = 1600,
  quality = 0.8,
): Promise<File> {
  // Se não for imagem suportada, retorna o arquivo original
  if (!file.type.startsWith('image/')) {
    return file
  }

  // Se já for muito pequeno (< 300KB), não precisa recomprimir
  if (file.size < 300 * 1024) {
    return file
  }

  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onerror = () => resolve(file)
    reader.onload = () => {
      const img = new Image()
      img.onerror = () => resolve(file)
      img.onload = () => {
        try {
          let { width, height } = img

          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = Math.round((height * maxDimension) / width)
              width = maxDimension
            } else {
              width = Math.round((width * maxDimension) / height)
              height = maxDimension
            }
          }

          const canvas = document.createElement('canvas')
          canvas.width = width
          canvas.height = height
          const ctx = canvas.getContext('2d')

          if (!ctx) {
            resolve(file)
            return
          }

          // Fundo branco caso PNG transparente seja convertido em JPEG
          ctx.fillStyle = '#FFFFFF'
          ctx.fillRect(0, 0, width, height)
          ctx.drawImage(img, 0, 0, width, height)

          const outputType = file.type === 'image/png' ? 'image/png' : 'image/jpeg'
          const actualQuality = outputType === 'image/png' ? undefined : quality

          canvas.toBlob(
            (blob) => {
              if (!blob || blob.size >= file.size) {
                // Se a compressão não reduziu o tamanho ou falhou, mantém o original
                resolve(file)
                return
              }
              const compressedFile = new File([blob], file.name, {
                type: blob.type || outputType,
                lastModified: Date.now(),
              })
              resolve(compressedFile)
            },
            outputType,
            actualQuality,
          )
        } catch {
          resolve(file)
        }
      }
      img.src = reader.result as string
    }
    reader.readAsDataURL(file)
  })
}
