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
  type: 'image' | 'video' | 'audio'
  dataUrl: string
  size?: number
  createdAt?: string
  // Sincronização do arquivo com o servidor (o rascunho guarda só a referência)
  uploadStatus?: 'pendente' | 'enviado'
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

  // Dados da Plaqueta de Identificação (Plaqueta BERMO e equivalentes industriais)
  // Todos opcionais (a plaqueta pode estar ilegível ou ausente em campo)
  tag?: string // Tag industrial opcional (ex: TQ-101 / TC-01)
  service?: string // Serviço (ex: "RESFRIAMENTO", "AQUECIMENTO", "CONDENSAÇÃO")
  manufacturingNumber?: string // Nº de Fabricação (ex: "639.065")
  designPressureBar?: string // Pressão de Projeto em bar (ex: "10,00")
  testPressureBar?: string // Pressão de Teste em bar (ex: "13,00")
  designTempC?: string // Temp. de Projeto em °C (ex: "165")
  pmtaMpa?: string // PMTA (Pressão Máxima de Trabalho Admissível) em MPa (ex: "1,30")
  emptyWeightKg?: string // Peso Vazio em kgf (ex: "164,30")
  manufacturingYear?: string // Ano de Fabricação (ex: "2025")
  tighteningMaxA?: string // "a" máximo em mm (ex: "66")
  tighteningMinA?: string // "a" mínimo em mm (ex: "70")

  // Campos complementares/dinâmicos criados a partir da leitura da placa ou inseridos pelo técnico
  // Preserva integralmente qualquer dado novo sem colidir com campos existentes
  customFields?: Array<{ id: string; label: string; value: string }>

  // Necessidade de Manutenção (Novo campo da visita técnica)
  // true = Necessita manutenção, false = Não necessita manutenção, undefined = não respondido ainda
  needsMaintenance?: boolean
  maintenanceNotes?: string

  // Metadados da última leitura de plaqueta realizada pela IA
  nameplateOcrData?: {
    lastReadAt?: string
    summary?: string
    rawText?: string
    method?: string
    confidence?: Record<string, number | 'high' | 'medium' | 'low'>
    evidenceAttachmentId?: string
    discrepancies?: Array<{
      fieldKey: string
      label: string
      currentValue: string
      plateValue: string
    }>
    unidentifiedFields?: string[]
  }
}

export interface ActionPlanItem {
  id: string
  title: string
  description: string
  priority: 'Alta' | 'Média' | 'Baixa'
  suggestedAction: string
  source?: string // ex.: "Equipamento #1: Alfa Laval M10-BFG"
  equipment_id?: string
  diagnosis?: string // Diagnóstico embasado exclusivamente no registrado pelo técnico
  technicalReference?: string // Referência técnica do fabricante ou "requer consulta ao fabricante"
  installationConditions?: string // Condições de acesso/local e grau de dificuldade correspondente
  pendingItems?: string[] // Itens pendentes ("Informação não levantada na visita: [qual dado falta]")
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

const PB_BASE = String(import.meta.env.VITE_POCKETBASE_URL || '').replace(/\/+$/, '')

/** Caminho relativo do servidor (/api/files/...) vira URL absoluta do backend. */
export function absolutizeMediaUrl(u?: string | null): string {
  const v = String(u || '')
  if (!v) return ''
  if (v.startsWith('data:') || v.startsWith('blob:') || v.startsWith('http')) return v
  if (v.startsWith('/api/files/')) return PB_BASE + v
  return v
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
    // Campos da plaqueta
    service: '',
    manufacturingNumber: '',
    designPressureBar: '',
    testPressureBar: '',
    designTempC: '',
    pmtaMpa: '',
    emptyWeightKg: '',
    manufacturingYear: '',
    tighteningMaxA: '',
    tighteningMinA: '',
    customFields: [],
    needsMaintenance: undefined,
    maintenanceNotes: '',
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
/**
 * Retorna o título / identificação formatada do equipamento para relatórios e exibição:
 * Formato preferencial: "Equipamento 01 - [Fabricante] [Modelo]" (ex.: "Equipamento 01 - Alfa Laval T10-BFM").
 * Se name customizado existir e não for apenas genérico ("Equipamento X"), preserva-o;
 * Se os dados de fabricante/modelo estiverem preenchidos, anexa ao prefixo numérico.
 * Se nada estiver preenchido, cai com segurança para "Equipamento 01".
 */
export function formatEquipmentTitle(
  eq: Partial<EquipmentItem> | undefined | null,
  index?: number,
  options?: { prefix?: boolean },
): string {
  const numPrefix =
    typeof index === 'number' ? `Equipamento ${String(index + 1).padStart(2, '0')}` : ''

  if (!eq) {
    return numPrefix || 'Equipamento'
  }

  // Monta a especificação técnica real: Fabricante + Modelo
  const manufacturer = (eq.manufacturer || '').trim()
  const model = (eq.model || '').trim()
  let realSpec = ''
  if (manufacturer && model) {
    // Se o modelo já começa com o fabricante, evita duplicação (ex: "Alfa Laval Alfa Laval T10")
    if (model.toLowerCase().startsWith(manufacturer.toLowerCase())) {
      realSpec = model
    } else {
      realSpec = `${manufacturer} ${model}`
    }
  } else if (model) {
    realSpec = model
  } else if (manufacturer) {
    realSpec = manufacturer
  }

  // Verifica se o campo name foi preenchido manualmente com algo que não seja apenas o genérico
  const customName = (eq.name || '').trim()
  const isGenericName =
    !customName || /^equipamento\s*(#?\s*\d+)?$/i.test(customName) || /^\d+$/i.test(customName)

  // Se o usuário digitou um nome específico diferente do padrão genérico
  let descriptiveName = ''
  if (!isGenericName) {
    descriptiveName = customName
  }

  // Identificação principal do equipamento (além da numeração)
  let identity = ''
  if (descriptiveName && realSpec) {
    if (descriptiveName.toLowerCase().includes(realSpec.toLowerCase())) {
      identity = descriptiveName
    } else {
      identity = `${descriptiveName} (${realSpec})`
    }
  } else if (realSpec) {
    identity = realSpec
  } else if (descriptiveName) {
    identity = descriptiveName
  }

  const includePrefix = options?.prefix !== false

  if (includePrefix && numPrefix) {
    return identity ? `${numPrefix} - ${identity}` : numPrefix
  }

  if (identity) {
    return identity
  }

  return numPrefix || 'Equipamento'
}

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
    const missing: string[] = []
    if (!visit.equipments || visit.equipments.length === 0) {
      missing.push(
        'Informação não levantada na visita: especificações preliminares dos equipamentos para o novo projeto',
      )
    }
    plan.push({
      id: generateId(),
      title: 'Elaboração de Proposta Técnica e Dimensionamento Térmico',
      description:
        'Elaborar memória de cálculo e dimensionamento do trocador BERMO para novo processo com base no levantamento.',
      priority: 'Alta',
      suggestedAction:
        'Engenharia de aplicação Intertermal rodar simulação térmica e emitir proposta comercial detalhada.',
      diagnosis: 'Demanda de novo projeto térmico registrada em visita a campo.',
      technicalReference:
        'Conforme catálogo e metodologia de cálculo de trocadores de calor de placas BERMO.',
      installationConditions: 'Condições do local não detalhadas na visita',
      pendingItems: missing.length > 0 ? missing : undefined,
    })
  } else if (visit.workType === 'Readequação') {
    plan.push({
      id: generateId(),
      title: 'Estudo de Readequação Térmica (Retrofit)',
      description:
        'Avaliar adição de placas ou redimensionamento de canais para atender a nova demanda operacional.',
      priority: 'Alta',
      suggestedAction:
        'Engenharia térmica analisar as temperaturas e vazões coletadas e propor pacote de readequação.',
      diagnosis: 'Readequação de carga térmica ou troca de processo registrada em visita técnica.',
      technicalReference:
        'Conforme manual de procedimentos de repotenciamento do fabricante BERMO.',
      installationConditions: 'Condições do local não detalhadas na visita',
    })
  } else if (
    visit.workType === 'Catálogo de Equipamentos' ||
    visit.workType === 'Catalogação de equipamentos'
  ) {
    plan.push({
      id: generateId(),
      title: 'Mapeamento e Ficha Técnica do Parque Instalado',
      description:
        'Cadastrar parque de trocadores no CRM com números de série, placas e sobressalentes recomendados.',
      priority: 'Média',
      suggestedAction:
        'Registrar histórico no sistema Intertermal e manter estoque estratégico de gaxetas correspondentes.',
      diagnosis: 'Catalogação do parque instalado de trocadores e válvulas industriais.',
      technicalReference:
        'Conforme diretrizes de rastreabilidade e peças sobressalentes dos fabricantes.',
      installationConditions: 'Condições do local não detalhadas na visita',
    })
  }

  // 2. Analisar equipamentos
  const equipments = visit.equipments || []
  equipments.forEach((eq, idx) => {
    const eqLabel = formatEquipmentTitle(eq, idx)
    const notesLower = (eq.technicianNotes || '').toLowerCase()
    const diff = eq.difficulty || 'Médio'
    const loc = eq.installedLocation
      ? `${eq.installedLocation} (Grau de dificuldade físico: ${diff})`
      : `Grau de dificuldade físico do local: ${diff}`

    const pending: string[] = []
    if (!eq.model) pending.push('Informação não levantada na visita: modelo do equipamento')
    if (!eq.serialNumber)
      pending.push('Informação não levantada na visita: número de série / plaqueta')
    if (!eq.plateCount) pending.push('Informação não levantada na visita: quantidade de placas')
    if (!eq.inletTemp || !eq.outletTemp)
      pending.push('Informação não levantada na visita: temperaturas de entrada e saída')

    if (
      notesLower.includes('vazamento') ||
      notesLower.includes('vazando') ||
      notesLower.includes('trinca') ||
      notesLower.includes('urgente')
    ) {
      plan.push({
        id: generateId(),
        title: `Intervenção Corretiva Urgente — ${eqLabel}`,
        description: `Relatos de vazamento ou risco operacional registrados pelo técnico: "${eq.technicianNotes || 'Revisão necessária'}".`,
        priority: 'Alta',
        suggestedAction:
          'Programar parada de linha para teste com líquido penetrante, substituição das vedações e teste hidrostático.',
        source: eqLabel,
        equipment_id: eq.id,
        diagnosis: `Vazamento ou anomalia mecânica informada pelo técnico (${eq.technicianNotes}).`,
        technicalReference: eq.manufacturer
          ? `Conforme procedimentos de desmontagem e teste de vedação do fabricante ${eq.manufacturer}`
          : 'requer consulta ao fabricante',
        installationConditions: loc,
        pendingItems: pending.length > 0 ? pending : undefined,
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
          'Constatado desgaste, ressecamento ou fim de vida útil das gaxetas de vedação nas observações do técnico.',
        priority: 'Média',
        suggestedAction:
          'Fornecer kit sobressalente de gaxetas originais (NBR / EPDM / FKM) e alinhar janela de montagem com torque controlado.',
        source: eqLabel,
        equipment_id: eq.id,
        diagnosis: `Desgaste ou ressecamento das gaxetas registrado pelo técnico em campo: "${eq.technicianNotes}".`,
        technicalReference: eq.manufacturer
          ? `Conforme recomendação técnica de substituição de gaxetas do fabricante ${eq.manufacturer}`
          : 'requer consulta ao fabricante',
        installationConditions: loc,
        pendingItems: pending.length > 0 ? pending : undefined,
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
          'Presença de incrustações ou depósitos relatados pelo técnico, reduzindo a eficiência de transferência térmica.',
        priority: 'Média',
        suggestedAction:
          'Executar desincrustação química controlada com solução compatível com o metal das placas, seguida de neutralização e passivação.',
        source: eqLabel,
        equipment_id: eq.id,
        diagnosis: `Incrustação ou sujidade registrada nas placas: "${eq.technicianNotes}".`,
        technicalReference: eq.manufacturer
          ? `Conforme procedimento de higienização e compatibilidade química do fabricante ${eq.manufacturer}`
          : 'requer consulta ao fabricante',
        installationConditions: loc,
        pendingItems: pending.length > 0 ? pending : undefined,
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
          'Sinais de oxidação ou necessidade de intervenção nos tirantes de aperto e estrutura metálica do trocador.',
        priority: 'Baixa',
        suggestedAction:
          'Realizar lubrificação técnica dos tirantes com graxa grafitada e aplicação de proteção anticorrosiva.',
        source: eqLabel,
        equipment_id: eq.id,
        diagnosis: `Oxidação ou desgaste nos tirantes relatado: "${eq.technicianNotes}".`,
        technicalReference: eq.manufacturer
          ? `Conforme recomendação de torque e conservação de tirantes do fabricante ${eq.manufacturer}`
          : 'requer consulta ao fabricante',
        installationConditions: loc,
        pendingItems: pending.length > 0 ? pending : undefined,
      })
    } else if (eq.technicianNotes && eq.technicianNotes.trim()) {
      plan.push({
        id: generateId(),
        title: `Avaliação Operacional — ${eqLabel}`,
        description: `Observação registrada pelo técnico: "${eq.technicianNotes}".`,
        priority: 'Média',
        suggestedAction:
          'Programar inspeção detalhada dos parâmetros de trabalho e alinhamento com a equipe de manutenção da planta.',
        source: eqLabel,
        equipment_id: eq.id,
        diagnosis: `Condição observada pelo técnico em campo: ${eq.technicianNotes}`,
        technicalReference: eq.manufacturer
          ? `Conforme manual técnico de manutenção preventiva ${eq.manufacturer}`
          : 'requer consulta ao fabricante',
        installationConditions: loc,
        pendingItems: pending.length > 0 ? pending : undefined,
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
        'Realizar teste hidrostático e verificar torque de aperto das porcas nos tirantes conforme cota nominal.',
      diagnosis: 'Relato de vazamento registrado nas notas gerais da visita técnica.',
      technicalReference:
        'Conforme procedimento padrão de estanqueidade e teste de pressão Intertermal/Bermo.',
      installationConditions: 'Condições do local não detalhadas na visita',
    })
  }

  // 4. Plano de ação padrão de acompanhamento caso nada específico tenha sido levantado
  if (plan.length === 0) {
    plan.push({
      id: generateId(),
      title: 'Plano de Acompanhamento Técnico Preventivo',
      description:
        'Manter rotina de inspeção periódica e monitoramento das variáveis operacionais de temperatura e perda de carga.',
      priority: 'Média',
      suggestedAction:
        'Recomenda-se nova checagem técnica dentro de 6 meses ou na próxima parada programada da planta.',
      diagnosis:
        'Nenhuma anomalia crítica ou defeito mecânico registrado pelo técnico durante a vistoria.',
      technicalReference:
        'Conforme procedimentos de inspeção preventiva para trocadores de calor de placas.',
      installationConditions: 'Condições do local não detalhadas na visita',
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
    safeEquipments = record.equipment.map((eq: any, idx: number) => {
      const numStr = String(idx + 1).padStart(2, '0')
      return {
        ...eq,
        name: eq.name || `Equipamento ${numStr}`,
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
      }
    })
  } else if (typeof record.equipment === 'string' && record.equipment) {
    try {
      const parsed = JSON.parse(record.equipment)
      if (Array.isArray(parsed)) {
        safeEquipments = parsed.map((eq: any, idx: number) => {
          const numStr = String(idx + 1).padStart(2, '0')
          return {
            ...eq,
            name: eq.name || `Equipamento ${numStr}`,
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
          }
        })
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
    visitAttachments: Array.isArray((record as any).visit_attachments)
      ? (record as any).visit_attachments
      : [],
    equipments: safeEquipments,
    actionPlan: safeActionPlan.length > 0 ? safeActionPlan : undefined,
    updatedAt: record.updated || record.created || new Date().toISOString(),
    backendRecordId: record.id,
    crmStatus: 'enviada',
    lastSentAt: record.sent_at || record.created,
  }

  // Normaliza referências de mídia: caminhos do servidor viram URL absoluta
  const abs = (a: any) => ({ ...a, dataUrl: absolutizeMediaUrl(a.dataUrl) })
  data.visitAttachments = (data.visitAttachments || []).map(abs)
  data.equipments = data.equipments.map((eq) => ({
    ...eq,
    photoDataUrl: eq.photoDataUrl ? absolutizeMediaUrl(eq.photoDataUrl) : eq.photoDataUrl,
    attachments: (eq.attachments || []).map(abs),
  }))

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

// ===== Inspeção de Purgadores (VKP) =====
export type SteamTrapResult =
  | 'Purgador ok'
  | 'Vazando'
  | 'Vazando direto'
  | 'Represando'
  | 'Parado'
  | 'Não Avaliado'

/** Resultados que representam um problema confirmado e entram na evidência fotográfica do relatório. */
export function isSteamTrapProblem(result: SteamTrapResult): boolean {
  return (
    result === 'Vazando' ||
    result === 'Vazando direto' ||
    result === 'Represando' ||
    result === 'Parado'
  )
}

export interface SteamTrapFinding {
  id: string
  title: string
  location: string
  severity: 'Crítica' | 'Alta' | 'Média'
  description: string
  recommendation: string
  mediaIds?: string[] // client_media_id das fotos/vídeos vinculados
}

export interface SteamTrapRecord {
  id: string
  seq: number // nº do registro na inspeção (1, 2, 3…)
  location: string // Local / equipamento (ex.: Cozinhador I)
  area: string // Área instalada (lista do contexto ou nova)
  tagClient?: string // Tag do cliente
  tagAri?: string // Tag ARI
  thermoNumber?: string // Nº da termografia
  manufacturer: string
  model: string
  dn: string // DN em mm
  pressureClass: string // ANSI 150 etc.
  connection: string // NPT etc.
  pressureBarg: string // pressão de operação
  result: SteamTrapResult
  action: string // ação recomendada
  lossKgh: number | null // perda medida/estimada (kg/h); null = não medida
  lossEstimated?: boolean // true quando a perda é estimativa (sem VKP)
  notes?: string
  mediaIds?: string[] // client_media_id das fotos/vídeos do registro
}

export interface SteamTrapImprovement {
  id: string
  title: string
  analyzed: boolean
  fixed: boolean
}

export interface SteamTrapInspectionData {
  version: 1
  updatedAt: string
  context: {
    unit: string
    inspectionDate: string
    responsible: string
    companion: string
    testEquipment: string // VKP 10 / VKP 42 / VKP 42 Ex / outro
    areas: string[] // lista de áreas (alimenta dropdown + filtros)
    steamCostBrlTon: number | null // custo do vapor R$/t
    hoursPerYear: number // base de horas (padrão 2000)
    customManufacturers?: string[] // fabricantes fora do catálogo, criados na visita
  }
  findings: SteamTrapFinding[]
  traps: SteamTrapRecord[]
  improvements: SteamTrapImprovement[]
  conclusion: string
  signatures: { name: string; role: string }[]
}

// Helpers de cálculo (fonte única — usados pelo módulo e pelo PDF)
export function steamTrapLossTotal(traps: SteamTrapRecord[]): number {
  return traps.reduce((s, t) => s + (Number(t.lossKgh) || 0), 0)
}
export function steamTrapBadCount(traps: SteamTrapRecord[]): number {
  return traps.filter((t) => isSteamTrapProblem(t.result)).length
}
export function steamTrapEconomics(
  traps: SteamTrapRecord[],
  steamCostBrlTon: number | null,
  hoursPerYear: number,
): { lossKgh: number; perMonth: number | null; perYear: number | null } {
  const lossKgh = steamTrapLossTotal(traps)
  if (steamCostBrlTon == null || !hoursPerYear) {
    return { lossKgh, perMonth: null, perYear: null }
  }
  const perYear = (lossKgh * hoursPerYear * steamCostBrlTon) / 1000
  return { lossKgh, perMonth: perYear / 12, perYear }
}
export function createEmptySteamTrap(seq: number): SteamTrapRecord {
  return {
    id: `st-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    seq,
    location: '',
    area: '',
    manufacturer: '',
    model: '',
    dn: '25',
    pressureClass: 'ANSI 150',
    connection: 'NPT',
    pressureBarg: '3.0',
    result: 'Purgador ok',
    action: 'Sem ação',
    lossKgh: null,
    lossEstimated: false,
    notes: '',
    mediaIds: [],
  }
}
export const STEAM_TRAP_MANUFACTURERS = ['TLV', 'Spirax Sarco', 'Gestra', 'Pennat']
export const STEAM_TRAP_MODELS: Record<string, string[]> = {
  TLV: ['JX', 'JHX', 'JH7.2X', 'JH3X', 'SS Bimetálico', 'TA5'],
  'Spirax Sarco': ['FT14HC', 'FT14X14', 'FT20', 'TDS52', 'TD52'],
  Gestra: ['UNA 25', 'UNA 25H', 'BK45'],
  Pennat: ['PT65'],
}
export const STEAM_TRAP_RESULTS: SteamTrapResult[] = [
  'Purgador ok',
  'Vazando',
  'Vazando direto',
  'Represando',
  'Parado',
  'Não Avaliado',
]
export const STEAM_TRAP_ACTION_BY_RESULT: Record<SteamTrapResult, string> = {
  'Purgador ok': 'Sem ação',
  Vazando: 'Substituição',
  'Vazando direto': 'Substituição',
  Represando: 'Analisar Instalação',
  Parado: 'Nova Inspeção',
  'Não Avaliado': 'Agendar inspeção',
}
export const STEAM_TRAP_DN_OPTIONS = ['15', '20', '25', '40', '50', '65', '80', '100']
export const STEAM_TRAP_CLASS_OPTIONS = ['ANSI 150', 'ANSI 300', 'ANSI 600', 'PN16', 'PN25', 'PN40']
export const STEAM_TRAP_CONNECTION_OPTIONS = ['NPT', 'BSP', 'Flange', 'Solda (SW)', 'Solda direta']
export const STEAM_TRAP_TEST_EQUIPMENT = ['VKP 10', 'VKP 42', 'VKP 42 Ex']
export const STEAM_TRAP_SEVERITIES: SteamTrapFinding['severity'][] = ['Crítica', 'Alta', 'Média']
