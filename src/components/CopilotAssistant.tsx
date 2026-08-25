import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Bot,
  Send,
  Sparkles,
  Flame,
  FileSpreadsheet,
  Layers,
  Wrench,
  HelpCircle,
  Calculator,
  Shield,
  Clock,
  UserCheck,
} from 'lucide-react'
import type {
  ClientRecord,
  DealRecord,
  QuoteRecord,
  ServiceRecord,
  TicketRecord,
} from '@/types/crm'
import { BERMO_CATALOG } from '@/data/bermo-catalog'

interface CopilotAssistantProps {
  clients: ClientRecord[]
  deals: DealRecord[]
  quotes: QuoteRecord[]
  services: ServiceRecord[]
  tickets: TicketRecord[]
}

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

export const CopilotAssistant: React.FC<CopilotAssistantProps> = ({
  clients,
  deals,
  quotes,
  services,
  tickets,
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content:
        'Olá, eu sou o **Copilot Técnico Intertermal**! Especialista em produtos BERMO (Trocadores de calor a placas, Válvulas Borboleta ARI Armaturen, Esfera, Automação e Acessórios Industriais). Como posso ajudar no dimensionamento, cálculo de orçamento ou manutenção hoje?',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ])
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)

  const handleSend = (textToSend?: string) => {
    const text = textToSend || inputValue
    if (!text.trim()) return

    const userMsg: Message = {
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }

    setMessages((prev) => [...prev, userMsg])
    if (!textToSend) setInputValue('')
    setIsTyping(true)

    setTimeout(() => {
      let botResponse = generateTechnicalAnswer(text, { clients, deals, quotes, services, tickets })
      const botMsg: Message = {
        role: 'assistant',
        content: botResponse,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }
      setMessages((prev) => [...prev, botMsg])
      setIsTyping(false)
    }, 700)
  }

  const generateTechnicalAnswer = (query: string, data: any) => {
    const lower = query.toLowerCase()

    if (lower.includes('bp6') || lower.includes('gaxetado')) {
      return `**Trocador BERMO BP6 Gaxetado:**
- **Dimensões:** Altura 704 mm, Largura 400 mm, Conexão DN65 (2.1/2").
- **Capacidade:** Vazão máx 20 kg/s, Área máx 13 m², Pressão 10 barg, Temp máx 180°C.
- **Materiais:** Placas AISI 316L, Hastelloy C276 ou Titânio Gr.1. Gaxetas em NBR, EPDM ou Viton.
- **Recomendação de Serviço:** Para limpeza CIP e troca de gaxetas, sugerimos equipe com 1 Técnico (16h) + 1 Ajudante (16h) e teste hidrostático a 13 bar.`
    }

    if (
      lower.includes('ari-zetrix') ||
      lower.includes('triexcentrica') ||
      lower.includes('zetrix')
    ) {
      return `**Válvula Borboleta Triexcêntrica ARI-ZETRIX:**
- **Construção:** Triplo Offset, dupla flange ou extremidades solda, vedação metálica estanque Zero Leakage.
- **Aplicações:** Vapor superaquecido, óleo térmico até +450°C e pressão de até 40 bar (Class 300).
- **Procedimento de Serviço:** Lapidação periódica de sedes estelitadas e verificação de alinhamento com torque do atuador pneumático.`
    }

    if (lower.includes('deslocamento') || lower.includes('mapeia') || lower.includes('pedagio')) {
      return `**Cálculo Logístico (Padrão Mapeia):**
O Intertermal calcula a rota a partir da matriz em Blumenau/SC (CEP 89066-000) até a fábrica do cliente.
- **Combustível:** (Distância em km / 10 km/L) × R$ 6,10/L
- **Pedágio:** Estimado com base em 70% de rodovias pedagiadas a R$ 0,15/km.
- O sistema permite ajustar manualmente tanto o consumo quanto o valor final dos pedágios.`
    }

    if (
      lower.includes('imposto') ||
      lower.includes('custos internos') ||
      lower.includes('margem')
    ) {
      return `**Composição de Custos Internos (Não visíveis na proposta do cliente):**
- **Margem de Serviços:** 20% a 30% (Padrão 25%)
- **Custos Administrativos:** Fixo 15%
- **Impostos:** PIS (1,65%), COFINS (7,6%), ISS (5,0%), CSLL (1,08%), IRPJ (4,8%) + Dif. IR 20% sobre IRPJ.
- **Comissão:** 4% a 10% (Padrão 6%)
- O preço final ao cliente soma custos diretos + todos os encargos e margem.`
    }

    if (lower.includes('orçamento') || lower.includes('proposta') || lower.includes('validade')) {
      return `**Políticas de Orçamento Intertermal:**
- **Validade:** 10 dias úteis a partir da emissão.
- **Condições de Pagamento:** Padrão 14 DDL ou 28 DDL. Negociações especiais: 30, 45 e 60 DDL.
- Existem atualmente **${data.quotes.length} orçamentos** cadastrados no sistema, totalizando R$ ${data.quotes.reduce((acc: number, q: any) => acc + (q.total || 0), 0).toLocaleString('pt-BR')}.`
    }

    return `Entendido! Você pode me consultar sobre especificações técnicas dos trocadores **BP6, BP30, BP60, BL14, BL20**, válvulas **ARI-ZESA, ARI-GESA, ARI-ZETRIX**, automação **Total Control BTC**, ou solicitar assistência no cálculo de mão de obra e deslocamento rodoviário.`
  }

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      {/* Header do Copilot */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 text-white flex items-center justify-between border border-teal-800/40">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-teal-600/30 border border-teal-400/40 flex items-center justify-center text-teal-300">
            <Bot className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-base font-bold flex items-center gap-2">
              Copilot Técnico Intertermal
              <Badge className="bg-teal-500/20 text-teal-300 text-[10px] border-teal-400/30">
                Engenharia BERMO
              </Badge>
            </h2>
            <p className="text-xs text-slate-300">
              Dimensionamento térmico, composição de propostas e procedimentos de manutenção
              industrial.
            </p>
          </div>
        </div>
      </div>

      {/* Sugestões Rápidas */}
      <div className="flex flex-wrap gap-2 text-xs">
        <button
          onClick={() => handleSend('Quais as especificações do Trocador BP6 Sanitário?')}
          className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-teal-500 text-slate-700 dark:text-slate-300 transition-colors"
        >
          🔍 Specs Trocador BP6 Sanitário
        </button>
        <button
          onClick={() => handleSend('Como é calculada a válvula triexcêntrica ARI-ZETRIX?')}
          className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-teal-500 text-slate-700 dark:text-slate-300 transition-colors"
        >
          ⚙️ Válvula ARI-ZETRIX
        </button>
        <button
          onClick={() => handleSend('Como funciona o cálculo de deslocamento padrão Mapeia?')}
          className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-teal-500 text-slate-700 dark:text-slate-300 transition-colors"
        >
          🚚 Regras de Deslocamento Mapeia
        </button>
        <button
          onClick={() => handleSend('Quais são os impostos e custos internos de um orçamento?')}
          className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-teal-500 text-slate-700 dark:text-slate-300 transition-colors"
        >
          📊 Custos Internos & Impostos
        </button>
      </div>

      {/* Área de Mensagens */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-950">
        <CardContent className="p-4 space-y-4 min-h-[420px] max-h-[500px] overflow-y-auto">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'assistant' && (
                <div className="h-7 w-7 rounded-lg bg-teal-800 text-teal-200 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="h-4 w-4" />
                </div>
              )}

              <div
                className={`max-w-[85%] rounded-2xl p-3.5 text-xs leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-teal-700 text-white rounded-br-none'
                    : 'bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-slate-200/80 dark:border-slate-800 rounded-bl-none'
                }`}
              >
                <div className="whitespace-pre-line">{msg.content}</div>
                <div
                  className={`text-[9px] mt-1.5 text-right ${
                    msg.role === 'user' ? 'text-teal-200' : 'text-muted-foreground'
                  }`}
                >
                  {msg.timestamp}
                </div>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex gap-3 items-center text-xs text-muted-foreground">
              <div className="h-7 w-7 rounded-lg bg-teal-800 text-teal-200 flex items-center justify-center">
                <Bot className="h-4 w-4" />
              </div>
              <div className="flex gap-1">
                <span className="h-2 w-2 rounded-full bg-teal-600 animate-bounce" />
                <span className="h-2 w-2 rounded-full bg-teal-600 animate-bounce [animation-delay:0.2s]" />
                <span className="h-2 w-2 rounded-full bg-teal-600 animate-bounce [animation-delay:0.4s]" />
              </div>
            </div>
          )}
        </CardContent>

        {/* Input Bar */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 flex gap-2">
          <Input
            placeholder="Pergunte sobre produtos BERMO, vazões, pressões ou cálculo de mão de obra..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            className="text-xs bg-slate-50 dark:bg-slate-900"
          />
          <Button
            onClick={() => handleSend()}
            size="sm"
            className="bg-teal-700 hover:bg-teal-600 text-white px-4 text-xs"
          >
            <Send className="h-3.5 w-3.5 mr-1" /> Enviar
          </Button>
        </div>
      </Card>
    </div>
  )
}
