// src/services/steam-traps.ts — serviço completo (arquivo novo, sem dependências além do cliente PB)
import pb from '@/lib/pocketbase/client'
import type { SteamTrapInspectionData, SteamTrapRecord } from '@/types/field-visit'
import { isSteamTrapProblem } from '@/types/field-visit'

export interface SteamTrapInspectionRec {
  id: string
  client_visit_id: string
  seller_token?: string
  status: string
  data: SteamTrapInspectionData
  created: string
  updated: string
}

const COLLECTION = 'steam_trap_inspections'

/** Busca a inspeção da visita (client_visit_id = id do celular). Cria se não existir. */
export async function getOrCreateInspection(
  clientVisitId: string,
  sellerToken?: string,
): Promise<SteamTrapInspectionRec> {
  try {
    const rec = await pb
      .collection(COLLECTION)
      .getFirstListItem(`client_visit_id = "${clientVisitId.replace(/"/g, '')}"`, {
        sort: '-updated',
      })
    return rec as unknown as SteamTrapInspectionRec
  } catch (err: any) {
    if (err?.status !== 404) throw err
    const now = new Date().toISOString()
    const created = await pb.collection(COLLECTION).create({
      client_visit_id: clientVisitId,
      seller_token: sellerToken || '',
      status: 'rascunho',
      data: {
        version: 1,
        updatedAt: now,
        context: {
          unit: '',
          inspectionDate: new Date().toISOString().slice(0, 10),
          responsible: '',
          companion: '',
          testEquipment: 'VKP 10',
          areas: [],
          steamCostBrlTon: null,
          hoursPerYear: 2000,
        },
        findings: [],
        traps: [],
        improvements: [],
        conclusion: '',
        signatures: [],
      } as SteamTrapInspectionData,
    })
    return created as unknown as SteamTrapInspectionRec
  }
}

/** Salva o conteúdo da inspeção (upsert do JSON). */
export async function saveInspection(
  recId: string,
  data: SteamTrapInspectionData,
  status: 'rascunho' | 'concluida' = 'rascunho',
): Promise<SteamTrapInspectionRec> {
  return (await pb.collection(COLLECTION).update(recId, {
    data: { ...data, updatedAt: new Date().toISOString() },
    status,
  })) as unknown as SteamTrapInspectionRec
}

/** Lista as mídias da visita com URL servida pelo PocketBase, para montar o PDF. */
export interface SteamTrapMediaFile {
  clientMediaId: string
  kind: string
  originalName: string
  dataUrl: string
}

async function compressImageForPdf(url: string): Promise<string> {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`Falha ao baixar imagem (${response.status})`)
  const objectUrl = URL.createObjectURL(await response.blob())
  try {
    const image = new Image()
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve()
      image.onerror = () => reject(new Error('Formato de imagem não suportado'))
      image.src = objectUrl
    })
    if (!image.naturalWidth || !image.naturalHeight) throw new Error('Imagem inválida')

    const maxDimension = 1280
    const scale = Math.min(1, maxDimension / Math.max(image.naturalWidth, image.naturalHeight))
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale))
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale))
    const context = canvas.getContext('2d')
    if (!context) throw new Error('Canvas indisponível')
    context.fillStyle = '#ffffff'
    context.fillRect(0, 0, canvas.width, canvas.height)
    context.drawImage(image, 0, 0, canvas.width, canvas.height)
    return canvas.toDataURL('image/jpeg', 0.72)
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}

export async function listVisitMediaForReport(
  clientVisitId: string,
  inspection: SteamTrapInspectionData,
): Promise<SteamTrapMediaFile[]> {
  if (!clientVisitId) return []
  const wantedIds = new Set(
    inspection.traps
      .filter((trap) => isSteamTrapProblem(trap.result))
      .flatMap((trap) => trap.mediaIds || []),
  )
  if (wantedIds.size === 0) return []

  // Carrega só os metadados desta visita; arquivos são baixados apenas para IDs ligados
  // a purgadores com problema, evitando baixar imagens de registros OK ou não avaliados.
  const visitMedia = await pb.collection('field_visit_media').getFullList({
    filter: pb.filter('client_visit_id = {:visitId}', { visitId: clientVisitId }),
    // collectionId/collectionName são OBRIGATÓRIOS: sem eles o pb.files.getURL()
    // monta URL quebrada e o download falha em silêncio (catch engole o erro).
    fields:
      'id,client_media_id,kind,original_name,file,client_visit_id,collectionId,collectionName',
  })
  const records = visitMedia.filter((record) => wantedIds.has(String(record.client_media_id || '')))

  return Promise.all(
    records.map(async (record) => {
      const kind = String(record.kind || 'image')
      const url = record.file ? pb.files.getURL(record, String(record.file)) : ''
      let dataUrl = ''
      if (kind === 'image' && url) {
        try {
          dataUrl = await compressImageForPdf(url)
        } catch (_) {
          // O relatório continua; o PDF informa quais registros-problema ficaram sem foto legível.
        }
      }
      return {
        clientMediaId: String(record.client_media_id || ''),
        kind,
        originalName: String(record.original_name || ''),
        dataUrl,
      }
    }),
  )
}

/** Lista de fotos/vídeos de um registro (pela referência client_media_id). */
export function trapMediaUrls(trap: SteamTrapRecord, mediaIndex: Map<string, string>): string[] {
  return (trap.mediaIds || []).map((id) => mediaIndex.get(id)).filter(Boolean) as string[]
}
