import type { WorkTypeOption, DifficultyLevel } from '@/types/field-visit'

export const WORK_TYPE_OPTIONS: {
  label: WorkTypeOption
  category: 'lean' | 'detailed'
  badge: string
  description: string
}[] = [
  {
    label: 'Projeto Novo',
    category: 'lean',
    badge: 'Formulário Enxuto',
    description: 'Levantamento para novo trocador de calor ou novo processo térmico.',
  },
  {
    label: 'Readequação',
    category: 'lean',
    badge: 'Formulário Enxuto',
    description: 'Retrofit, aumento de capacidade ou readequação de trocador existente.',
  },
  {
    label: 'Manutenção Preventiva',
    category: 'detailed',
    badge: 'Formulário Completo',
    description: 'Revisão periódica, troca preventiva de gaxetas e limpeza mecânica.',
  },
  {
    label: 'Manutenção Corretiva',
    category: 'detailed',
    badge: 'Formulário Completo',
    description: 'Intervenção imediata, reparo de vazamento ou recuperação emergencial.',
  },
  {
    label: 'Catálogo de Equipamentos',
    category: 'detailed',
    badge: 'Formulário Completo',
    description: 'Mapeamento do parque de trocadores instalados e placas de identificação.',
  },
  {
    label: 'Outro',
    category: 'lean',
    badge: 'Formulário Enxuto',
    description: 'Vistoria geral, acompanhamento de partida técnica ou outra atividade.',
  },
]

export const DIFFICULTY_OPTIONS: { level: DifficultyLevel; color: string }[] = [
  {
    level: 'Baixo',
    color:
      'border-emerald-300 hover:border-emerald-500 text-emerald-700 bg-emerald-50/60 dark:bg-emerald-950/40',
  },
  {
    level: 'Médio',
    color:
      'border-amber-300 hover:border-amber-500 text-amber-700 bg-amber-50/60 dark:bg-amber-950/40',
  },
  {
    level: 'Alto',
    color: 'border-rose-300 hover:border-rose-500 text-rose-700 bg-rose-50/60 dark:bg-rose-950/40',
  },
]

export const FLOW_UNIT_OPTIONS = ['m³/h', 'm³/min', 'L/min', 'L/s', 'kg/h', 'kg/s', 't/h', 'GPM']

/**
 * Fabricantes pré-definidos (regra do Alex): técnico seleciona; "Outros" abre campo editável.
 * Dados pré-existentes NUNCA são alterados: valor que não é preset continua no campo livre.
 */
export const MANUFACTURER_PRESETS = ['Bermo', 'Alfa Laval', 'SPX']
