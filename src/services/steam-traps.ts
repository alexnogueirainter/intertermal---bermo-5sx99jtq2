// src/services/steam-traps.ts — serviço completo (arquivo novo, sem dependências além do cliente PB)
import pb from '@/lib/pocketbase/client'
import type { SteamTrapInspectionData, SteamTrapRecord } from '@/types/field-visit'

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

/** Lista de fotos/vídeos de um registro (pela referência client_media_id). */
export function trapMediaUrls(trap: SteamTrapRecord, mediaIndex: Map<string, string>): string[] {
  return (trap.mediaIds || []).map((id) => mediaIndex.get(id)).filter(Boolean) as string[]
}
