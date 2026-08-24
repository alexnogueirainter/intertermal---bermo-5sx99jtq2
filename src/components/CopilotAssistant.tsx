import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Sparkles,
  Send,
  Bot,
  User,
  Loader2,
  FileQuestion,
  Lightbulb,
  Building2,
  FileSpreadsheet,
  Layers,
  ArrowRight,
} from 'lucide-react'
import pb from '@/lib/pocketbase/client'

interface CopilotAssistantProps {
  onNavigate: (tab: string) => void
}

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const QUICK_PROMPTS = [
  'Onde está o modelo de orçamento e propostas comerciais?',
  'Onde encontro a lista de clientes cadastrados e seus contatos?',
  'Como está estruturado o funil de vendas (pipeline)?',
  'Qual o modelo de suporte para WhatsApp e chamados?',
  'Como funciona o modelo de contratos de implantação e recorrência?',
  'Quais são os produtos do catálogo com os melhores preços?',
]

export const CopilotAssistant: React.FC<CopilotAssistantProps> = ({ onNavigate }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content:
        'Olá! Eu sou o seu **Copiloto Comercial Inteligente**. Você pode me perguntar *"Onde está o modelo?"*, solicitar dicas para estruturar uma proposta comercial ou navegar rapidamente pelos dados de clientes, funil, contratos e atendimento. Como posso ajudar agora?',
    },
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSend = async (queryText?: string) => {
    const textToSend = queryText || input
    if (!textToSend.trim() || isLoading) return

    const userMsg: Message = { role: 'user', content: textToSend }
    setMessages((prev) => [...prev, userMsg])
    if (!queryText) setInput('')
    setIsLoading(true)

    try {
      const res = await pb.send('/backend/v1/ai/consult', {
        method: 'POST',
        body: {
          prompt: textToSend,
          context:
            'O usuário está consultando a localização dos modelos e a gestão comercial no CRM Localizar Modelo.',
        },
      })

      const reply =
        res?.reply ||
        'Entendido! Recomendo conferir as abas "Orçamentos & Modelos" ou "Clientes 360°" no menu superior.'
      setMessages((prev) => [...prev, { role: 'assistant', content: reply }])
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content:
            '**Localização dos Modelos:**\n- **Modelos de Proposta & Orçamento:** Acesse a aba **Orçamentos & Modelos**.\n- **Modelo de Dados & Esquema das Tabelas:** Acesse a aba **Mapa do Modelo**.\n- **Funil de Vendas:** Acesse a aba **Pipeline**.\n- **Clientes e Contas:** Acesse a aba **Clientes 360°**.',
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-indigo-600" />
            Copiloto IA & Localizador Inteligente
          </h2>
          <p className="text-xs md:text-sm text-muted-foreground mt-0.5">
            Tire dúvidas em linguagem natural sobre onde estão os modelos, estratégias de vendas e
            contratos.
          </p>
        </div>
      </div>

      {/* Prompts Rápidos */}
      <div className="space-y-2">
        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
          <Lightbulb className="h-3.5 w-3.5 text-amber-500" /> Sugestões de Perguntas Rápidas:
        </span>
        <div className="flex flex-wrap gap-2">
          {QUICK_PROMPTS.map((prompt, idx) => (
            <Button
              key={idx}
              variant="outline"
              size="sm"
              onClick={() => handleSend(prompt)}
              className="text-xs h-8 text-slate-700 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:text-indigo-600"
            >
              {prompt}
            </Button>
          ))}
        </div>
      </div>

      {/* Chat Container */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-sm flex flex-col h-[520px]">
        <CardContent className="p-4 flex-1 flex flex-col justify-between overflow-hidden">
          {/* Mensagens */}
          <div className="space-y-4 overflow-y-auto pr-2 flex-1 mb-4">
            {messages.map((m, idx) => {
              const isAssistant = m.role === 'assistant'
              return (
                <div
                  key={idx}
                  className={`flex gap-3 ${isAssistant ? 'justify-start' : 'justify-end'}`}
                >
                  {isAssistant && (
                    <div className="h-8 w-8 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                      <Bot className="h-4 w-4" />
                    </div>
                  )}
                  <div
                    className={`p-3.5 rounded-2xl max-w-[80%] text-xs leading-relaxed whitespace-pre-wrap ${
                      isAssistant
                        ? 'bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-200/60 dark:border-slate-800 rounded-tl-none'
                        : 'bg-indigo-600 text-white rounded-tr-none'
                    }`}
                  >
                    {m.content}
                  </div>
                  {!isAssistant && (
                    <div className="h-8 w-8 rounded-full bg-slate-800 text-white flex items-center justify-center shrink-0">
                      <User className="h-4 w-4" />
                    </div>
                  )}
                </div>
              )
            })}
            {isLoading && (
              <div className="flex gap-3 items-center text-xs text-muted-foreground p-2">
                <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />
                <span>O Copiloto está consultando o modelo de dados...</span>
              </div>
            )}
          </div>

          {/* Input Box */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex gap-2">
            <Input
              placeholder="Digite sua dúvida (ex: Onde está o modelo de proposta?)"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSend()
              }}
              disabled={isLoading}
              className="text-xs flex-1"
            />
            <Button
              onClick={() => handleSend()}
              disabled={isLoading || !input.trim()}
              className="bg-indigo-600 hover:bg-indigo-500 text-xs px-4"
            >
              <Send className="h-3.5 w-3.5 mr-1" />
              Enviar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
