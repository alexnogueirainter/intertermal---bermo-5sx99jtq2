/* eslint-disable no-console */
/**
 * Types and helper functions for Field Visit ("Visita a campo")
 * Strictly client-side via localStorage.
 */

export type WorkTypeOption =
  | 'Manutenção preventiva ou corretiva'
  | 'Projeto novo ou readequação'
  | 'Catalogação de equipamentos'
  | 'Outro'

export type DifficultyLevel = 'Baixo' | 'Médio' | 'Alto'

export interface EquipmentItem {
  id: string
  model: string
  serialNumber: string
  manufacturer: string
  plateCount: string
  fluid1: string
  fluid2: string
  inletTemp: string
  outletTemp: string
  flowRate: string
  installedLocation: string
  difficulty: DifficultyLevel
  photoDataUrl?: string
  technicianNotes: string
}

export interface FieldVisitData {
  id: string
  employeeName: string
  date: string
  startTime: string
  endTime: string
  visitDuration: string
  isDurationManuallyEdited: boolean
  companyName: string
  clientName: string
  clientRole: string
  clientContact: string
  clientWorkArea: string
  workType: WorkTypeOption | ''
  workTypeOther: string
  generalObservations: string
  equipments: EquipmentItem[]
  updatedAt: string
  // Dados de sincronização com o CRM PocketBase
  backendRecordId?: string
  crmStatus?: 'rascunho' | 'enviada'
  lastSentAt?: string
}

export const STORAGE_KEY_CURRENT_VISIT = 'intertermal_field_visit_draft_v1'
export const STORAGE_KEY_EMPLOYEE_NAME = 'intertermal_field_visit_employee_name_v1'

export function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return `id_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
}

export function getTodayDateString(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function createEmptyEquipment(): EquipmentItem {
  return {
    id: generateId(),
    model: '',
    serialNumber: '',
    manufacturer: '',
    plateCount: '',
    fluid1: '',
    fluid2: '',
    inletTemp: '',
    outletTemp: '',
    flowRate: '',
    installedLocation: '',
    difficulty: 'Médio',
    technicianNotes: '',
  }
}

export function createInitialVisitData(savedEmployeeName = ''): FieldVisitData {
  return {
    id: generateId(),
    employeeName: savedEmployeeName,
    date: getTodayDateString(),
    startTime: '',
    endTime: '',
    visitDuration: '',
    isDurationManuallyEdited: false,
    companyName: '',
    clientName: '',
    clientRole: '',
    clientContact: '',
    clientWorkArea: '',
    workType: '',
    workTypeOther: '',
    generalObservations: '',
    equipments: [],
    updatedAt: new Date().toISOString(),
  }
}

/**
 * Calculates duration between two HH:mm strings.
 * Returns formatted string like "2h 30min" or "45min" or "" if invalid.
 */
export function calculateDurationBetween(start: string, end: string): string {
  if (!start || !end) return ''
  const [startH, startM] = start.split(':').map(Number)
  const [endH, endM] = end.split(':').map(Number)

  if (Number.isNaN(startH) || Number.isNaN(startM) || Number.isNaN(endH) || Number.isNaN(endM)) {
    return ''
  }

  const startMinutes = startH * 60 + startM
  let endMinutes = endH * 60 + endM

  // Se o término for menor que início, assume que virou a meia-noite
  if (endMinutes < startMinutes) {
    endMinutes += 24 * 60
  }

  const diff = endMinutes - startMinutes
  if (diff <= 0) return '0 min'

  const hours = Math.floor(diff / 60)
  const mins = diff % 60

  if (hours > 0 && mins > 0) {
    return `${hours}h ${mins}min`
  }
  if (hours > 0) {
    return `${hours}h`
  }
  return `${mins}min`
}

/**
 * Compresses an image file (data URL / file) to max dimension ~1000px and JPEG quality 0.7
 * so it safely fits into localStorage without blowing quota limits.
 */
/**
 * Converte um registro do PocketBase (`FieldVisitRecord`) para o formato `FieldVisitData`.
 */
export function recordToFieldVisitData(record: any): {
  data: FieldVisitData
  parsedCompany: string
  parsedContact: string
} {
  let parsedCompany = record.company_name || ''
  let parsedContact = record.client_name || ''

  // Se veio no formato "Empresa (Contato: Nome)" ou "Empresa (Nome)"
  if (record.client_name && !record.company_name) {
    const match = record.client_name.match(/^(.+?)\s*\((?:Contato:\s*)?(.+?)\)$/i)
    if (match) {
      parsedCompany = match[1].trim()
      parsedContact = match[2].trim()
    } else {
      parsedCompany = record.client_name
    }
  }

  // Parse seguro do JSON de equipamentos se for string ou array
  let safeEquipments: EquipmentItem[] = []
  if (Array.isArray(record.equipment)) {
    safeEquipments = record.equipment
  } else if (typeof record.equipment === 'string' && record.equipment) {
    try {
      safeEquipments = JSON.parse(record.equipment)
    } catch {
      safeEquipments = []
    }
  }

  const data: FieldVisitData = {
    id: record.id,
    employeeName: record.employee_name || 'Técnico Intertermal',
    date: record.visit_date || (record.created ? record.created.slice(0, 10) : ''),
    startTime: record.start_time || '',
    endTime: record.end_time || '',
    visitDuration: record.duration || '',
    isDurationManuallyEdited: false,
    companyName: parsedCompany,
    clientName: parsedContact,
    clientRole: record.client_role || '',
    clientContact: record.client_contact || '',
    clientWorkArea: record.work_area || '',
    workType: (record.work_type as any) || '',
    workTypeOther: record.work_type_other || '',
    generalObservations: record.general_notes || '',
    equipments: safeEquipments,
    updatedAt: record.updated || record.created || new Date().toISOString(),
    backendRecordId: record.id,
    crmStatus: 'enviada',
    lastSentAt: record.sent_at || record.created,
  }

  return { data, parsedCompany, parsedContact }
}

export function compressImageFile(file: File, maxDimension = 1000, quality = 0.7): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Erro ao ler o arquivo de imagem'))
    reader.onload = () => {
      const img = new Image()
      img.onerror = () => reject(new Error('Erro ao carregar a imagem'))
      img.onload = () => {
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
          reject(new Error('Não foi possível inicializar canvas 2D'))
          return
        }

        ctx.drawImage(img, 0, 0, width, height)
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality)
        resolve(compressedDataUrl)
      }
      img.src = reader.result as string
    }
    reader.readAsDataURL(file)
  })
}
