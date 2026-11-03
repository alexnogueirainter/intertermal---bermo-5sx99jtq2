import pb from '@/lib/pocketbase/client'
import type { FieldVisitData, MediaAttachment } from '@/types/field-visit'

/**
 * Mídia da Visita a Campo: o arquivo vai para o SERVIDOR assim que é anexado
 * (com reenvio automático) e o rascunho no celular guarda só a referência.
 * - Cópia local do arquivo fica no IndexedDB (com metadados) até o servidor confirmar.
 * - Nada de base64 de foto/vídeo no localStorage: sanitizeVisitForStorage() remove.
 */

const DB_NAME = 'intertermal_fv_media'
const STORE = 'blobs'

export interface CachedMediaMeta {
  name: string
  kind: 'image' | 'video'
  size: number
  clientVisitId: string
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('indexeddb_indisponivel'))
      return
    }
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE)
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error || new Error('indexeddb_erro'))
  })
}

async function withStore<T>(
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => IDBRequest,
): Promise<T> {
  const db = await openDb()
  return new Promise<T>((resolve, reject) => {
    const tx = db.transaction(STORE, mode)
    const req = fn(tx.objectStore(STORE))
    req.onsuccess = () => resolve(req.result as T)
    req.onerror = () => reject(req.error || new Error('indexeddb_erro'))
    tx.oncomplete = () => db.close()
  })
}

export async function cacheMediaBlob(id: string, blob: Blob, meta: CachedMediaMeta): Promise<void> {
  await withStore('readwrite', (s) => s.put({ blob, meta }, id))
}

export async function getMediaEntry(
  id: string,
): Promise<{ blob: Blob; meta?: CachedMediaMeta } | null> {
  try {
    const v = await withStore<{ blob: Blob; meta?: CachedMediaMeta } | undefined>('readonly', (s) =>
      s.get(id),
    )
    return v ? v : null
  } catch (_) {
    return null
  }
}

export async function listCachedMediaIds(): Promise<string[]> {
  try {
    const keys = await withStore<IDBValidKey[]>('readonly', (s) => s.getAllKeys())
    return (keys || []).map(String)
  } catch (_) {
    return []
  }
}

export async function deleteMediaBlob(id: string): Promise<void> {
  try {
    await withStore('readwrite', (s) => s.delete(id))
  } catch (_) {
    // nada a fazer: o cache é descartável
  }
}

export function isBase64DataUrl(v?: string | null): boolean {
  return !!v && v.startsWith('data:')
}

/** Converte caminho relativo do PocketBase em URL absoluta do backend. */
export function absoluteMediaUrl(path: string): string {
  const base = String((pb as any).baseUrl || (pb as any).baseURL || '')
  if (!base) return path
  return base.replace(/\/+$/, '') + path
}

async function blobFromDataUrl(dataUrl: string): Promise<Blob> {
  return await (await fetch(dataUrl)).blob()
}

function guessExtension(name: string, blob: Blob): string {
  const fromName = name.includes('.') ? name.split('.').pop() : ''
  if (fromName && fromName.length <= 5) return fromName.toLowerCase()
  const mime = blob.type || ''
  if (mime.startsWith('image/')) return mime.replace('image/', '') || 'jpg'
  if (mime.startsWith('video/')) return mime.replace('video/', '') || 'mp4'
  return 'bin'
}

export interface MediaUploadResult {
  ok: boolean
  url?: string
  error?: string
}

/**
 * Envia UM arquivo ao servidor (rota multipart idempotente por client_media_id).
 * Usa a cópia local do IndexedDB. Em caso de sucesso devolve a URL absoluta do
 * arquivo no servidor e apaga a cópia local; em caso de falha a cópia fica
 * guardada para o reenvio automático.
 */
export async function uploadMediaAttachment(
  att: MediaAttachment,
  opts: { clientVisitId: string; sellerToken?: string; deviceId?: string },
): Promise<MediaUploadResult> {
  if (att.type === 'audio') return { ok: false, error: 'audio_fluxo_legado' }
  const entry = await getMediaEntry(att.id)
  if (!entry) return { ok: false, error: 'sem_copia_local' }

  const fd = new FormData()
  fd.set('client_media_id', att.id)
  fd.set('kind', att.type || 'image')
  fd.set('original_name', att.name || '')
  fd.set('size', String(att.size || entry.blob.size))
  fd.set('client_visit_id', entry.meta?.clientVisitId || opts.clientVisitId || '')
  if (opts.sellerToken) fd.set('token', opts.sellerToken)
  if (opts.deviceId) fd.set('device_id', opts.deviceId)
  fd.append(
    'file',
    entry.blob,
    `${att.name || 'arquivo'}.${guessExtension(att.name || '', entry.blob)}`,
  )

  try {
    const res = (await pb.send('/backend/v1/field-visits/media/upload', {
      method: 'POST',
      body: fd,
    })) as any
    if (res && res.ok && res.path) {
      await deleteMediaBlob(att.id)
      return { ok: true, url: absoluteMediaUrl(String(res.path)) }
    }
    return { ok: false, error: (res && res.error) || 'erro_servidor' }
  } catch (err: any) {
    const data = err?.response?.data || err?.data || {}
    return { ok: false, error: data.error || 'network_error' }
  }
}

/** Remove mídia do servidor quando o técnico exclui o anexo. */
export async function deleteServerMedia(
  clientMediaId: string,
  opts: { sellerToken?: string; deviceId?: string },
): Promise<void> {
  try {
    const q = new URLSearchParams({ client_media_id: clientMediaId })
    if (opts.sellerToken) q.set('token', opts.sellerToken)
    if (opts.deviceId) q.set('device_id', opts.deviceId)
    await pb.send(`/backend/v1/field-visits/media/delete?${q.toString()}`, { method: 'DELETE' })
  } catch (_) {
    // falha ao apagar no servidor não bloqueia o usuário; mídia órfã é inofensiva
  }
  await deleteMediaBlob(clientMediaId)
}

/**
 * Remove URLs locais (blob:/data:) de um payload snake_case da visita antes de
 * gravar na fila ou enviar ao CRM — o servidor é a única fonte confirmada.
 */
export function stripLocalMediaRefs(visitObj: any): any {
  if (!visitObj || typeof visitObj !== 'object') return visitObj
  const out = JSON.parse(JSON.stringify(visitObj))
  const fix = (atts: any) => {
    for (const a of Array.isArray(atts) ? atts : []) {
      if (!a || a.type === 'audio') continue
      const u = String(a.dataUrl || '')
      if (u.startsWith('blob:') || u.startsWith('data:')) {
        a.dataUrl = ''
        a.uploadStatus = 'pendente'
      }
    }
  }
  fix(out.visit_attachments)
  for (const eq of Array.isArray(out.equipment) ? out.equipment : []) fix(eq?.attachments)
  return out
}

/** Anexos de foto/vídeo que ainda não estão confirmados no servidor. */
export function collectPendingAttachments(visit: FieldVisitData): MediaAttachment[] {
  const out: MediaAttachment[] = []
  const isPending = (a: MediaAttachment) =>
    a.type !== 'audio' && (a.uploadStatus === 'pendente' || !a.dataUrl)
  for (const a of visit.visitAttachments || []) if (isPending(a)) out.push(a)
  for (const eq of visit.equipments || [])
    for (const a of eq.attachments || []) if (isPending(a)) out.push(a)
  return out
}

export function countPendingMedia(visit: FieldVisitData): number {
  return collectPendingAttachments(visit).length
}

/**
 * Prepara a visita para GRAVAR no rascunho (localStorage): nenhuma base64 ou
 * blob: de foto/vídeo é persistida — só a referência do servidor ou pendente.
 */
export function sanitizeVisitForStorage(visit: FieldVisitData): FieldVisitData {
  const fixAtt = (a: MediaAttachment): MediaAttachment => {
    if (a.type === 'audio') return a // áudio segue o fluxo legado
    if (isBase64DataUrl(a.dataUrl) || a.dataUrl.startsWith('blob:')) {
      return {
        ...a,
        dataUrl: '',
        uploadStatus: a.uploadStatus === 'enviado' ? 'enviado' : 'pendente',
      }
    }
    return a
  }
  return {
    ...visit,
    visitAttachments: (visit.visitAttachments || []).map(fixAtt),
    equipments: (visit.equipments || []).map((eq) => ({
      ...eq,
      photoDataUrl:
        isBase64DataUrl(eq.photoDataUrl || '') || (eq.photoDataUrl || '').startsWith('blob:')
          ? undefined
          : eq.photoDataUrl,
      attachments: (eq.attachments || []).map(fixAtt),
    })),
  }
}

/**
 * Prepara a visita carregada do rascunho para EXIBIR e reenviar:
 * - base64 legado (rascunhos antigos) vira cópia local + pendente (sobe ao servidor)
 * - pendente sem preview recupera o arquivo do IndexedDB (objectURL)
 */
export async function hydrateVisitMedia(visit: FieldVisitData): Promise<FieldVisitData> {
  let changed = false
  const clientVisitId = (visit as any).clientVisitId || visit.id || ''

  const fixAtt = async (a: MediaAttachment): Promise<MediaAttachment> => {
    if (a.type === 'audio') return a
    if (isBase64DataUrl(a.dataUrl)) {
      try {
        const blob = await blobFromDataUrl(a.dataUrl)
        await cacheMediaBlob(a.id, blob, {
          name: a.name || '',
          kind: a.type === 'video' ? 'video' : 'image',
          size: blob.size,
          clientVisitId,
        })
        changed = true
        return { ...a, uploadStatus: 'pendente' } // preview base64 fica só em memória
      } catch (_) {
        return a // mantém o preview em memória; o autosave sanitiza depois
      }
    }
    if (!a.dataUrl && a.uploadStatus === 'pendente') {
      const entry = await getMediaEntry(a.id)
      if (entry) {
        changed = true
        return { ...a, dataUrl: URL.createObjectURL(entry.blob) }
      }
    }
    return a
  }

  const visitAttachments: MediaAttachment[] = []
  for (const a of visit.visitAttachments || []) visitAttachments.push(await fixAtt(a))
  if (
    (visit.visitAttachments || []).some((a, i) => visitAttachments[i] !== a) ||
    visitAttachments.length !== (visit.visitAttachments || []).length
  ) {
    changed = true
  }

  const equipments: FieldVisitData['equipments'] = []
  for (const eq of visit.equipments || []) {
    const attachments: MediaAttachment[] = []
    for (const a of eq.attachments || []) attachments.push(await fixAtt(a))
    let eqOut: EquipmentOut = eq
    if (attachments.some((a, i) => a !== (eq.attachments || [])[i])) {
      eqOut = { ...eq, attachments }
      changed = true
    }
    // Foto legada em base64 (photoDataUrl): vira anexo pendente com cópia local
    if (isBase64DataUrl(eq.photoDataUrl || '')) {
      const pid = `${eq.id}:photo`
      const has = attachments.some((a) => a.id === pid)
      try {
        const blob = await blobFromDataUrl(eq.photoDataUrl as string)
        await cacheMediaBlob(pid, blob, {
          name: 'Foto da Placa',
          kind: 'image',
          size: blob.size,
          clientVisitId,
        })
        eqOut = {
          ...(eqOut as any),
          photoDataUrl: undefined,
          attachments: has
            ? attachments
            : [
                ...attachments,
                {
                  id: pid,
                  name: 'Foto da Placa',
                  type: 'image' as const,
                  dataUrl: URL.createObjectURL(blob),
                  size: blob.size,
                  uploadStatus: 'pendente' as const,
                },
              ],
        }
        changed = true
      } catch (_) {
        // sem cópia local possível: mantém como está
      }
    }
    equipments.push(eqOut)
  }

  if (!changed) return visit
  return { ...visit, visitAttachments, equipments }
}

type EquipmentOut = FieldVisitData['equipments'][number]

/**
 * Tenta enviar ao servidor todos os anexos pendentes da visita atual que têm
 * cópia local. Devolve os resultados por attachment id (quem aplica no estado
 * é o chamador, via setVisit).
 */
export async function retryPendingVisitMedia(
  visit: FieldVisitData,
  opts: { clientVisitId: string; sellerToken?: string; deviceId?: string },
): Promise<{
  results: Array<{ id: string; ok: boolean; url?: string; error?: string }>
}> {
  const candidates = collectPendingAttachments(visit)
  const results: Array<{ id: string; ok: boolean; url?: string; error?: string }> = []
  for (const att of candidates) {
    const entry = await getMediaEntry(att.id)
    if (!entry && !isBase64DataUrl(att.dataUrl)) {
      continue // sem cópia local: nada a enviar agora
    }
    if (isBase64DataUrl(att.dataUrl) && !entry) {
      try {
        const blob = await blobFromDataUrl(att.dataUrl)
        await cacheMediaBlob(att.id, blob, {
          name: att.name || '',
          kind: att.type === 'video' ? 'video' : 'image',
          size: blob.size,
          clientVisitId: opts.clientVisitId || '',
        })
      } catch (_) {
        results.push({ id: att.id, ok: false, error: 'sem_copia_local' })
        continue
      }
    }
    const res = await uploadMediaAttachment(att, opts)
    if (res.ok && res.url) results.push({ id: att.id, ok: true, url: res.url })
    else results.push({ id: att.id, ok: false, error: res.error })
  }
  return { results }
}

/** Aplica resultados de upload (id → url) ao estado da visita. */
export function applyMediaResults(
  visit: FieldVisitData,
  results: Array<{ id: string; ok: boolean; url?: string }>,
): FieldVisitData {
  const urlById = new Map<string, string>()
  for (const r of results) if (r.ok && r.url) urlById.set(r.id, r.url)
  if (urlById.size === 0) return visit
  const apply = (a: MediaAttachment): MediaAttachment =>
    urlById.has(a.id)
      ? { ...a, dataUrl: urlById.get(a.id) as string, uploadStatus: 'enviado' as const }
      : a
  return {
    ...visit,
    visitAttachments: (visit.visitAttachments || []).map(apply),
    equipments: (visit.equipments || []).map((eq) => ({
      ...eq,
      attachments: (eq.attachments || []).map(apply),
    })),
  }
}

/**
 * Sobe ao servidor TODA cópia local em cache (independe do rascunho atual).
 * Usada no evento online, no envio da visita e ao abrir a página.
 */
export async function retryAllCachedMedia(opts: {
  sellerToken?: string
  deviceId?: string
}): Promise<{
  sent: number
  failed: number
  results: Array<{ id: string; ok: boolean; url?: string; error?: string }>
}> {
  const ids = await listCachedMediaIds()
  const results: Array<{ id: string; ok: boolean; url?: string; error?: string }> = []
  let sent = 0
  let failed = 0
  for (const id of ids) {
    const entry = await getMediaEntry(id)
    if (!entry) continue
    const meta = entry.meta
    const att: MediaAttachment = {
      id,
      name: meta?.name || '',
      type: (meta?.kind as 'image' | 'video') || 'image',
      dataUrl: '',
      size: meta?.size || entry.blob.size,
    }
    const res = await uploadMediaAttachment(att, {
      clientVisitId: meta?.clientVisitId || '',
      sellerToken: opts.sellerToken,
      deviceId: opts.deviceId,
    })
    if (res.ok && res.url) {
      sent++
      results.push({ id, ok: true, url: res.url })
    } else {
      failed++
      results.push({ id, ok: false, error: res.error })
    }
  }
  return { sent, failed, results }
}
