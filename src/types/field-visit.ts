/* eslint-disable no-console */
/**
 * Types and helper functions for Field Visit ("Visita a campo")
 * Strictly client-side via localStorage.
 */

export type WorkTypeOption =
  | 'Projeto Novo'
  | 'Readequação'
  | 'Manutenção Preventiva'
  | 'Manutenção Corretiva'
  | 'Catálogo de Equipamentos'
  | 'Outro'
  // Compatibilidade com registros legados gravados anteriormente:
  | 'Manutenção preventiva ou corretiva'
  | 'Projeto novo ou readequação'
  | 'Catalogação de equipamentos'

export type DifficultyLevel = 'Baixo' | 'Médio' | 'Alto'

export interface MediaAttachment {
  id: string
  name: string
  type: 'image' | 'video'
  dataUrl: string
  size?: number
}

export interface EquipmentItem {
  id: string
  // Identificação básica para seção em tipos livre ("Equipamento 1", "Equipamento 2" etc.) ou estruturada
  name?: string
  model: string
  serialNumber: string
  manufacturer: string
  plateCount: string
  fluid1: string
  fluid2: string
  inletTemp: string
  outletTemp: string
  flowRate: string
  flowUnit?: string // unidade da vazão: m³/h, L/min, kg/h etc. (padrão m³/h)
  installedLocation: string
  difficulty: DifficultyLevel
  photoDataUrl?: string // retrocompatibilidade com 1 foto legada
  attachments?: MediaAttachment[] // múltiplos arquivos (fotos e vídeos)
  technicianNotes: string
}

export interface ActionPlanItem {
  id: string
  title: string
  description: string
  priority: 'Alta' | 'Média' | 'Baixa'
  suggestedAction: string
  source?: string // ex.: "Equipamento #1: Alfa Laval M10-BFG"
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
  clientEmail: string
  clientWorkArea: string
  workType: WorkTypeOption | ''
  workTypeOther: string
  generalObservations: string
  freeDescription: string // descrição livre para Projeto Novo, Readequação e Outro
  visitAttachments?: MediaAttachment[] // anexos gerais da visita (múltiplas imagens e vídeos)
  equipments: EquipmentItem[]
  actionPlan?: ActionPlanItem[]
  updatedAt: string
  // Dados de sincronização com o CRM PocketBase
  backendRecordId?: string
  crmStatus?: 'rascunho' | 'enviada' | 'pendente'
  lastSentAt?: string
}

export const STORAGE_KEY_CURRENT_VISIT = 'intertermal_field_visit_draft_v1'
export const STORAGE_KEY_EMPLOYEE_NAME = 'intertermal_field_visit_employee_name_v1'

/** Aceita apenas dígitos e vírgula (padrão pt-BR). */
export function onlyNumericPtBR(value: string): string {
  return (value || '').replace(/[^0-9,]/g, '')
}

/** Converte "1.234,56" ou "12,5" para "1234.5" (formato internacional para cálculo). */
export function numericToInternational(value: string): string {
  const raw = (value || '').trim()
  if (!raw) return ''
  return raw.replace(/\./g, '').replace(',', '.')
}

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

export function createEmptyEquipment(customName?: string): EquipmentItem {
  return {
    id: generateId(),
    name: customName || '',
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
    photoDataUrl: undefined,
    attachments: [],
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
    clientEmail: '',
    clientWorkArea: '',
    workType: '',
    workTypeOther: '',
    generalObservations: '',
    freeDescription: '',
    visitAttachments: [],
    equipments: [],
    actionPlan: [],
    updatedAt: new Date().toISOString(),
  }
}

/**
 * Gera automaticamente um Plano de Ação com base nas informações levantadas,
 * dificuldades detectadas e observações do técnico mecânico.
 */
export function generateActionPlan(visit: Partial<FieldVisitData>): ActionPlanItem[] {
  const plan: ActionPlanItem[] = []
  const textCorpus = [
    visit.freeDescription || '',
    visit.generalObservations || '',
    visit.workTypeOther || '',
  ]
    .join(' ')
    .toLowerCase()

  // 1. Analisar tipo de visita
  if (visit.workType === 'Projeto Novo' || visit.workType === 'Projeto novo ou readequação') {
    plan.push({
      id: generateId(),
      title: 'Elaboração de Proposta Técnica e Dimensionamento Térmico',
      description:
        'Elaborar memória de cálculo e dimensionamento do trocador BERMO para novo processo.',
      priority: 'Alta',
      suggestedAction:
        'Engenharia de aplicação Intertermal rodar simulação térmica e emitir proposta comercial detalhada.',
    })
  } else if (visit.workType === 'Readequação') {
    plan.push({
      id: generateId(),
      title: 'Estudo de Readequação Térmica (Retrofit)',
      description:
        'Avaliar adição de placas ou redimensionamento de canais para atender a nova demanda térmica.',
      priority: 'Alta',
      suggestedAction:
        'Engenharia térmica analisar as temperaturas e vazões coletadas e propor pacote de readequação.',
    })
  } else if (
    visit.workType === 'Catálogo de Equipamentos' ||
    visit.workType === 'Catalogação de equipamentos'
  ) {
    plan.push({
      id: generateId(),
      title: 'Mapeamento e Ficha Técnica do Parque Instalado',
      description:
        'Cadastrar parque de trocadores no CRM com números de série, placas e peças sobressalentes recomendadas.',
      priority: 'Média',
      suggestedAction:
        'Registrar histórico no sistema Intertermal e manter estoque estratégico de gaxetas correspondentes.',
    })
  }

  // 2. Analisar equipamentos
  const equipments = visit.equipments || []
  equipments.forEach((eq, idx) => {
    const eqLabel =
      eq.name ||
      (eq.model
        ? `${eq.manufacturer ? eq.manufacturer + ' ' : ''}${eq.model}`
        : `Equipamento #${idx + 1}`)
    const notesLower = (eq.technicianNotes || '').toLowerCase()
    const diff = eq.difficulty

    if (
      diff === 'Alto' ||
      notesLower.includes('vazamento') ||
      notesLower.includes('vazando') ||
      notesLower.includes('trinca') ||
      notesLower.includes('urgente')
    ) {
      plan.push({
        id: generateId(),
        title: `Intervenção Corretiva Urgente — ${eqLabel}`,
        description: `Grau de dificuldade alto ou relatos de vazamento/risco operacional. Observação: "${eq.technicianNotes || 'Revisão imediata necessária'}".`,
        priority: 'Alta',
        suggestedAction:
          'Programar parada imediata ou abertura preventiva para teste com líquido penetrante e troca das gaxetas.',
        source: eqLabel,
      })
    } else if (
      notesLower.includes('gaxeta') ||
      notesLower.includes('borracha') ||
      notesLower.includes('ressecad') ||
      notesLower.includes('envelhecid')
    ) {
      plan.push({
        id: generateId(),
        title: `Substituição de Jogo de Gaxetas — ${eqLabel}`,
        description:
          'Constatado desgaste, ressecamento ou fim de vida útil das gaxetas de vedação.',
        priority: 'Média',
        suggestedAction:
          'Fornecer kit sobressalente de gaxetas originais BERMO (NBR / EPDM / FKM) e alinhar janela de montagem.',
        source: eqLabel,
      })
    } else if (
      notesLower.includes('incrust') ||
      notesLower.includes('suj') ||
      notesLower.includes('limpeza') ||
      notesLower.includes('quimic') ||
      notesLower.includes('cip')
    ) {
      plan.push({
        id: generateId(),
        title: `Limpeza Química Desincrustante (CIP ou Banho) — ${eqLabel}`,
        description:
          'Presença de incrustações ou depósitos que reduzem a eficiência de troca térmica.',
        priority: 'Média',
        suggestedAction:
          'Executar desincrustação química controlada com neutralização e passivação das placas.',
        source: eqLabel,
      })
    } else if (
      notesLower.includes('tirante') ||
      notesLower.includes('corros') ||
      notesLower.includes('ferrugem') ||
      notesLower.includes('parafuso')
    ) {
      plan.push({
        id: generateId(),
        title: `Manutenção Mecânica na Estrutura e Tirantes — ${eqLabel}`,
        description:
          'Sinais de corrosão ou desgaste nas barras de aperto e estrutura metálica do trocador.',
        priority: 'Baixa',
        suggestedAction:
          'Realizar lubrificação técnica dos tirantes com graxa grafitada e aplicação de proteção anticorrosiva.',
        source: eqLabel,
      })
    }
  })

  // 3. Analisar termos no relato geral ou descrição livre
  if (
    textCorpus.includes('vazamento') &&
    !plan.some((p) => p.title.includes('Vazamento') || p.title.includes('Corretiva Urgente'))
  ) {
    plan.push({
      id: generateId(),
      title: 'Inspeção e Contenção de Vazamento no Sistema',
      description:
        'Identificado relato de vazamento de fluido térmico durante a vistoria em campo.',
      priority: 'Alta',
      suggestedAction:
        'Realizar teste hidrostático e verificar torque de aperto das porcas nos tirantes.',
    })
  }

  if (
    textCorpus.includes('eficiência') ||
    textCorpus.includes('aquecendo pouco') ||
    textCorpus.includes('resfriando pouco') ||
    textCorpus.includes('delta t')
  ) {
    plan.push({
      id: generateId(),
      title: 'Auditoria de Rendimento Térmico Operacional',
      description:
        'Desvio térmico identificado entre a condição de projeto e os dados operacionais medidos.',
      priority: 'Média',
      suggestedAction:
        'Cruzar dados de vazão e temperaturas com a simulação BERMO para identificar perda de carga ou entupimento.',
    })
  }

  // 4. Plano de ação padrão de acompanhamento caso nada específico tenha sido levantado
  if (plan.length === 0) {
    plan.push({
      id: generateId(),
      title: 'Plano de Acompanhamento Técnico Preventivo',
      description:
        'Manter rotina de inspeção periódica e monitoramento das variáveis operacionais de temperatura e pressão.',
      priority: 'Média',
      suggestedAction:
        'Recomenda-se nova checagem técnica dentro de 6 meses ou na próxima parada programada da planta.',
    })
  }

  return plan
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
    safeEquipments = record.equipment.map((eq: any, idx: number) => ({
      ...eq,
      name: eq.name || `Equipamento ${idx + 1}`,
      attachments: Array.isArray(eq.attachments)
        ? eq.attachments
        : eq.photoDataUrl
          ? [{ id: generateId(), name: 'Foto 1', type: 'image' as const, dataUrl: eq.photoDataUrl }]
          : [],
    }))
  } else if (typeof record.equipment === 'string' && record.equipment) {
    try {
      const parsed = JSON.parse(record.equipment)
      if (Array.isArray(parsed)) {
        safeEquipments = parsed.map((eq: any, idx: number) => ({
          ...eq,
          name: eq.name || `Equipamento ${idx + 1}`,
          attachments: Array.isArray(eq.attachments)
            ? eq.attachments
            : eq.photoDataUrl
              ? [
                  {
                    id: generateId(),
                    name: 'Foto 1',
                    type: 'image' as const,
                    dataUrl: eq.photoDataUrl,
                  },
                ]
              : [],
        }))
      }
    } catch {
      safeEquipments = []
    }
  }

  // Parse de plano de ação
  let safeActionPlan: ActionPlanItem[] = []
  if (Array.isArray(record.action_plan)) {
    safeActionPlan = record.action_plan
  } else if (typeof record.action_plan === 'string' && record.action_plan) {
    try {
      const parsed = JSON.parse(record.action_plan)
      if (Array.isArray(parsed)) safeActionPlan = parsed
    } catch {
      safeActionPlan = []
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
    clientEmail: record.client_email || '',
    clientWorkArea: record.work_area || '',
    workType: (record.work_type as any) || '',
    workTypeOther: record.work_type_other || '',
    generalObservations: record.general_notes || '',
    freeDescription: record.free_description || '',
    visitAttachments: [],
    equipments: safeEquipments,
    actionPlan: safeActionPlan.length > 0 ? safeActionPlan : undefined,
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

/**
 * Lê qualquer arquivo (imagem ou vídeo) como Data URL.
 * Para imagens, aplica compressão quando possível.
 * Para vídeos, valida o tamanho e gera DataURL.
 */
export async function readFileAsMediaAttachment(file: File): Promise<MediaAttachment> {
  const isVideo = file.type.startsWith('video/')
  if (isVideo) {
    // Alerta de tamanho se > 25MB
    if (file.size > 25 * 1024 * 1024) {
      throw new Error('Vídeo muito grande. Limite máximo recomendado de 25MB por vídeo.')
    }
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = () => reject(new Error('Erro ao ler vídeo'))
      reader.readAsDataURL(file)
    })
    return {
      id: generateId(),
      name: file.name,
      type: 'video',
      dataUrl,
      size: file.size,
    }
  }

  // Imagem
  let dataUrl: string
  try {
    dataUrl = await compressImageFile(file, 1000, 0.7)
  } catch {
    dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = () => reject(new Error('Erro ao ler imagem'))
      reader.readAsDataURL(file)
    })
  }

  return {
    id: generateId(),
    name: file.name,
    type: 'image',
    dataUrl,
    size: file.size,
  }
}
