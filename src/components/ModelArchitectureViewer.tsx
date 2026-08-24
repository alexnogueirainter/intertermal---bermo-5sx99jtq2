import React from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Database,
  Table,
  Key,
  Layers,
  ArrowRight,
  ShieldCheck,
  FileSpreadsheet,
  Users,
  Briefcase,
  Headphones,
  Calendar,
  Sparkles,
  CheckCircle2,
} from 'lucide-react'

interface ModelArchitectureViewerProps {
  onNavigate: (tab: string) => void
}

const COLLECTIONS_MAP = [
  {
    name: 'clients',
    title: '1. Modelo de Clientes / Contas (clients)',
    icon: Users,
    color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/40 border-blue-200',
    description:
      'Centraliza a inteligência cadastral de pessoas jurídicas/físicas, score de qualificação, contatos e localização.',
    fields: [
      { name: 'name', type: 'text', desc: 'Razão Social do Cliente (Obrigatório)' },
      { name: 'company_name', type: 'text', desc: 'Nome Fantasia Comercial' },
      { name: 'document', type: 'text', desc: 'CNPJ ou CPF' },
      { name: 'email', type: 'email', desc: 'E-mail para faturamento/contato' },
      { name: 'phone / whatsapp', type: 'text', desc: 'Telefones e canal direto' },
      { name: 'segment', type: 'text', desc: 'Nicho/Setor de atuação' },
      { name: 'status', type: 'select', desc: 'lead | prospect | active | churned | partner' },
      { name: 'score', type: 'number', desc: 'Pontuação de probabilidade (0 a 100)' },
      { name: 'address / city / state', type: 'text', desc: 'Endereço físico' },
      { name: 'tags', type: 'json', desc: 'Tags corporativas (Key Account, SaaS, etc.)' },
    ],
    targetTab: 'clients',
  },
  {
    name: 'deals',
    title: '2. Modelo de Oportunidades & Pipeline (deals)',
    icon: Briefcase,
    color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200',
    description:
      'Modela o funil de vendas, etapas de conversão, probabilidade de fechamento e previsão de receita.',
    fields: [
      { name: 'title', type: 'text', desc: 'Título da Oportunidade' },
      { name: 'client_id', type: 'relation', desc: 'Chave estrangeira para a coleção "clients"' },
      { name: 'client_name', type: 'text', desc: 'Denormalização do nome para consultas rápidas' },
      { name: 'value', type: 'number', desc: 'Valor total em Reais (R$)' },
      {
        name: 'stage',
        type: 'select',
        desc: 'prospecting | qualification | proposal | negotiation | won | lost',
      },
      { name: 'probability', type: 'number', desc: 'Probabilidade de fechamento em %' },
      { name: 'expected_close_date', type: 'date', desc: 'Data prevista para fechamento' },
      { name: 'priority', type: 'select', desc: 'low | medium | high | urgent' },
    ],
    targetTab: 'pipeline',
  },
  {
    name: 'quotes',
    title: '3. Modelo de Orçamentos & Propostas (quotes)',
    icon: FileSpreadsheet,
    color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/40 border-amber-200',
    description:
      'Estrutura formal de propostas comerciais emitidas, condições de parcelamento, itens calculados e status.',
    fields: [
      {
        name: 'quote_number',
        type: 'text (unique)',
        desc: 'Identificador único (ex: ORC-2025-001)',
      },
      {
        name: 'client_id / client_name',
        type: 'relation / text',
        desc: 'Cliente destinatário da proposta',
      },
      { name: 'deal_id', type: 'relation', desc: 'Oportunidade de origem no pipeline' },
      { name: 'status', type: 'select', desc: 'draft | sent | approved | rejected | expired' },
      {
        name: 'items',
        type: 'json',
        desc: 'Array de itens: [{ name, quantity, unit_price, discount, total }]',
      },
      {
        name: 'subtotal / discount_total / total',
        type: 'number',
        desc: 'Totalizadores financeiros',
      },
      { name: 'payment_terms', type: 'text', desc: 'Forma e condições de faturamento' },
      { name: 'valid_until', type: 'date', desc: 'Data de expiração da proposta' },
    ],
    targetTab: 'quotes',
  },
  {
    name: 'products',
    title: '4. Modelo de Catálogo de Produtos & Serviços (products)',
    icon: Layers,
    color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200',
    description:
      'Catálogo de itens padronizados com precificação unitária, margem de custo e categorias.',
    fields: [
      { name: 'code', type: 'text', desc: 'Código SKU (ex: PRD-001, SRV-001)' },
      { name: 'name', type: 'text', desc: 'Nome comercial do produto ou serviço' },
      {
        name: 'category',
        type: 'select',
        desc: 'software | hardware | consulting | maintenance | subscription | training',
      },
      { name: 'price / cost', type: 'number', desc: 'Preço de venda e custo de entrega' },
      { name: 'unit', type: 'text', desc: 'Unidade (licença, mês, un, hora)' },
      { name: 'is_active', type: 'bool', desc: 'Disponibilidade para novas propostas' },
    ],
    targetTab: 'quotes',
  },
  {
    name: 'tickets',
    title: '5. Modelo de Atendimento & Chamados (tickets)',
    icon: Headphones,
    color: 'text-purple-600 bg-purple-50 dark:bg-purple-950/40 border-purple-200',
    description:
      'Suporte omnichannel ao cliente com canais de entrada (WhatsApp, E-mail, Fone) e timeline de diálogo.',
    fields: [
      { name: 'ticket_number', type: 'text', desc: 'Código do protocolo (ex: TCK-1042)' },
      { name: 'client_id / client_name', type: 'relation / text', desc: 'Cliente associado' },
      { name: 'channel', type: 'select', desc: 'whatsapp | email | phone | chat | in_person' },
      { name: 'subject', type: 'text', desc: 'Assunto do atendimento' },
      { name: 'status', type: 'select', desc: 'open | in_progress | resolved | closed' },
      {
        name: 'timeline',
        type: 'json',
        desc: 'Histórico de mensagens com timestamp, autor e papel',
      },
    ],
    targetTab: 'tickets',
  },
  {
    name: 'services',
    title: '6. Modelo de Contratos Recorrentes & Onboarding (services)',
    icon: CheckCircle2,
    color: 'text-rose-600 bg-rose-50 dark:bg-rose-950/40 border-rose-200',
    description:
      'Entregáveis pós-venda, checklists de implantação, marcos contratuais e MRR (receita recorrente).',
    fields: [
      { name: 'title', type: 'text', desc: 'Nome do Projeto / Contrato' },
      {
        name: 'service_type',
        type: 'select',
        desc: 'installation | training | support | maintenance | consulting | contract',
      },
      { name: 'client_id / client_name', type: 'relation / text', desc: 'Cliente contratante' },
      {
        name: 'status',
        type: 'select',
        desc: 'planning | in_progress | pending_client | completed | cancelled',
      },
      { name: 'monthly_value', type: 'number', desc: 'Valor recorrente mensal (MRR)' },
      { name: 'checklist', type: 'json', desc: 'Lista de tarefas com status e data de conclusão' },
      { name: 'stages', type: 'json', desc: 'Etapas de evolução do onboarding' },
    ],
    targetTab: 'services',
  },
  {
    name: 'activities',
    title: '7. Modelo de Agenda & Atividades Comerciais (activities)',
    icon: Calendar,
    color: 'text-sky-600 bg-sky-50 dark:bg-sky-950/40 border-sky-200',
    description:
      'Compromissos do time de vendas, follow-ups de propostas, reuniões e tarefas com data/hora.',
    fields: [
      { name: 'title', type: 'text', desc: 'Descrição da atividade agendada' },
      { name: 'type', type: 'select', desc: 'call | meeting | follow_up | visit | email | task' },
      { name: 'client_id / client_name', type: 'relation / text', desc: 'Cliente de destino' },
      { name: 'due_date / time', type: 'date / text', desc: 'Data e hora limite' },
      { name: 'priority', type: 'select', desc: 'low | medium | high' },
      { name: 'status', type: 'select', desc: 'pending | completed | cancelled' },
    ],
    targetTab: 'activities',
  },
]

export const ModelArchitectureViewer: React.FC<ModelArchitectureViewerProps> = ({ onNavigate }) => {
  return (
    <div className="space-y-6">
      {/* Banner Informativo Explicando "Onde Está o Modelo" */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white border border-indigo-900/50 space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full bg-indigo-500/20 px-3 py-1 text-xs font-semibold text-indigo-300 border border-indigo-400/30">
          <Database className="h-3.5 w-3.5" />
          Mapeamento Conceitual & Arquitetura
        </div>
        <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">
          Onde está o Modelo de Dados e Negócios?
        </h2>
        <p className="text-sm md:text-base text-slate-300 leading-relaxed max-w-4xl">
          Aqui está o <strong>esquema completo de entidades, tabelas e modelos</strong> que compõem
          o sistema. O modelo está estruturado no banco de dados em{' '}
          <strong>7 coleções principais</strong> integradas entre si (relacionamentos por{' '}
          <code className="bg-slate-800 px-1.5 py-0.5 rounded text-indigo-300">client_id</code> e{' '}
          <code className="bg-slate-800 px-1.5 py-0.5 rounded text-indigo-300">deal_id</code>), além
          dos modelos operacionais de propostas e atendimento.
        </p>
      </div>

      {/* Grid de Modelos e Coleções */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {COLLECTIONS_MAP.map((col) => {
          const Icon = col.icon

          return (
            <Card
              key={col.name}
              className="border-slate-200 dark:border-slate-800 hover:shadow-md transition-all flex flex-col justify-between"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className={`p-2 rounded-lg border ${col.color}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-sm font-bold text-slate-900 dark:text-slate-100">
                        {col.title}
                      </CardTitle>
                      <CardDescription className="text-xs mt-0.5">
                        Tabela SQLite / Coleção PocketBase:{' '}
                        <code className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">
                          {col.name}
                        </code>
                      </CardDescription>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-[10px] font-mono">
                    {col.fields.length} campos
                  </Badge>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 pt-2 leading-relaxed">
                  {col.description}
                </p>
              </CardHeader>

              <CardContent className="space-y-3 pt-0">
                <div className="border border-slate-100 dark:border-slate-800 rounded-lg overflow-hidden">
                  <table className="w-full text-left text-[11px]">
                    <thead className="bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 font-semibold uppercase text-[10px]">
                      <tr>
                        <th className="p-2">Campo</th>
                        <th className="p-2">Tipo</th>
                        <th className="p-2">Descrição da Regra</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {col.fields.slice(0, 5).map((f, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/40">
                          <td className="p-2 font-mono font-semibold text-slate-900 dark:text-slate-100">
                            {f.name}
                          </td>
                          <td className="p-2 text-indigo-600 dark:text-indigo-400 font-mono text-[10px]">
                            {f.type}
                          </td>
                          <td className="p-2 text-slate-600 dark:text-slate-300">{f.desc}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <span className="text-[11px] text-muted-foreground">
                    Exibindo 5 de {col.fields.length} campos mapeados
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onNavigate(col.targetTab)}
                    className="text-xs h-7 text-indigo-600 border-indigo-200 hover:bg-indigo-50 dark:hover:bg-indigo-950"
                  >
                    Acessar Módulo <ArrowRight className="ml-1 h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
