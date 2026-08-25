import React from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Database,
  Layers,
  Cpu,
  Server,
  Code,
  ShieldCheck,
  CheckCircle2,
  FileSpreadsheet,
  Truck,
  Wrench,
  Percent,
} from 'lucide-react'

export const ModelArchitectureViewer: React.FC = () => {
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 text-white border border-teal-800/40">
        <Badge className="bg-teal-500/20 text-teal-300 border-teal-400/30 text-[10px] mb-2">
          Documentação de Engenharia de Software
        </Badge>
        <h2 className="text-xl md:text-2xl font-extrabold tracking-tight">
          Arquitetura Técnica do Intertermal (BERMO CRM)
        </h2>
        <p className="text-xs md:text-sm text-slate-300 mt-1">
          Visão detalhada do modelo de dados estendido no PocketBase (Skip Cloud), módulos de
          cálculo (Mapeia e M.O.), catálogo de produtos BERMO e regras fiscais/indiretas.
        </p>
      </div>

      {/* Grid de Camadas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Camada 1: Modelo de Orçamento de Prestação de Serviços */}
        <Card className="border-slate-200 dark:border-slate-800">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-teal-600" />
              <CardTitle className="text-sm font-bold">
                1. Módulo de Orçamentos & Serviços
              </CardTitle>
            </div>
            <CardDescription className="text-xs">
              Estruturação dos 6 pilares de prestação de serviços BERMO
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2.5 text-xs text-muted-foreground">
            <div className="p-2 rounded bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 space-y-1">
              <strong className="text-slate-900 dark:text-slate-100 block font-mono text-[11px]">
                3a. Especificações Técnicas de Equipamento BERMO
              </strong>
              <p className="text-[11px]">
                Parâmetros termodinâmicos vinculados ao modelo: fluido (vapor, óleo, água, gases),
                temperaturas de entrada/saída, pressão, vazão volumétrica e materiais das placas e
                gaxetas.
              </p>
            </div>

            <div className="p-2 rounded bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 space-y-1">
              <strong className="text-slate-900 dark:text-slate-100 block font-mono text-[11px]">
                3b. Mão de Obra (3 Funções Industriais)
              </strong>
              <p className="text-[11px]">
                Cálculo individual por função: <strong>Técnico</strong>, <strong>Ajudante</strong> e{' '}
                <strong>Inspetor</strong> (Qtde × Horas × R$/Hora).
              </p>
            </div>

            <div className="p-2 rounded bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 space-y-1">
              <strong className="text-slate-900 dark:text-slate-100 block font-mono text-[11px]">
                3c. Logística & Deslocamento (Referência Mapeia)
              </strong>
              <p className="text-[11px]">
                Origem (Blumenau/SC) e Destino com cálculo geodésico Haversine + sinuosidade
                rodoviária brasileira (1.28x), combustível (km/L × R$/L) e pedágios (R$ 0,15/km
                pedagiado).
              </p>
            </div>

            <div className="p-2 rounded bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 space-y-1">
              <strong className="text-slate-900 dark:text-slate-100 block font-mono text-[11px]">
                3d. Hospedagem & Alimentação
              </strong>
              <p className="text-[11px]">
                Diárias de hotel e refeições estimadas por quantidade de dias em campo da equipe.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Camada 2: Custos Indiretos e Regras Fiscais */}
        <Card className="border-slate-200 dark:border-slate-800">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Percent className="h-5 w-5 text-amber-600" />
              <CardTitle className="text-sm font-bold">
                2. Custos Internos & Composição de Venda
              </CardTitle>
            </div>
            <CardDescription className="text-xs">
              Algoritmo de precificação interna (oculto na proposta do cliente)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2.5 text-xs text-muted-foreground">
            <div className="p-2 rounded bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 space-y-1">
              <strong className="text-slate-900 dark:text-slate-100 block font-mono text-[11px]">
                Margens & Taxa de Administração
              </strong>
              <p className="text-[11px]">
                - Margem de serviços: 20% a 30% (padrão 25%)
                <br />- Custos administrativos: Fixo 15%
                <br />- Comissão de vendas: 4% a 10% (padrão 6%)
              </p>
            </div>

            <div className="p-2 rounded bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 space-y-1">
              <strong className="text-slate-900 dark:text-slate-100 block font-mono text-[11px]">
                Impostos Fiscais Incidentes
              </strong>
              <p className="text-[11px]">
                - PIS: 1,65% | COFINS: 7,60%
                <br />- ISS: 5,00% (editável conforme o município de prestação)
                <br />- CSLL: 1,08% | IRPJ: 4,80%
                <br />- Diferença de alíquota IR: 20,00% sobre o IRPJ (0,96%)
              </p>
            </div>

            <div className="p-2 rounded bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 space-y-1">
              <strong className="text-slate-900 dark:text-slate-100 block font-mono text-[11px]">
                Prazos & Faturamento DDL
              </strong>
              <p className="text-[11px]">
                - Validade da proposta: 10 dias úteis da emissão.
                <br />- Condições de faturamento: 14 DDL, 28 DDL (padrão), 30, 45 ou 60 DDL.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Camada 3: Catálogo BERMO */}
      <Card className="border-slate-200 dark:border-slate-800">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-sm font-bold">3. Catálogo Técnico BERMO Integrado</CardTitle>
          </div>
          <CardDescription className="text-xs">
            Substituição total do catálogo genérico anterior por 6 categorias oficiais da BERMO &
            ARI Armaturen
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <strong className="text-teal-700 dark:text-teal-400 block mb-1">
                Trocadores Gaxetados
              </strong>
              <p className="text-[11px] text-muted-foreground">
                BP6, BP30, BP60, BP6 Sanitário, BP30 Sanitário com placas AISI 316L / Titânio e
                gaxetas NBR/EPDM/Viton.
              </p>
            </div>
            <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <strong className="text-teal-700 dark:text-teal-400 block mb-1">
                Trocadores Brasados
              </strong>
              <p className="text-[11px] text-muted-foreground">
                BL14, BL20, BL26, BL26C (Alta Pressão/CO2) e BL50 para temperaturas de -195°C a
                +200°C e pressão de até 45 bar.
              </p>
            </div>
            <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <strong className="text-teal-700 dark:text-teal-400 block mb-1">
                Válvulas Borboleta (ARI)
              </strong>
              <p className="text-[11px] text-muted-foreground">
                ARI-ZESA, ARI-GESA, ARI-ZIVA Z, ARI-ZIVA G e ARI-ZETRIX Triexcêntrica com
                estanqueidade Zero Leakage.
              </p>
            </div>
            <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <strong className="text-teal-700 dark:text-teal-400 block mb-1">
                Válvulas de Esfera
              </strong>
              <p className="text-[11px] text-muted-foreground">
                Bipartida Passagem Plena Cl. 150/300, Tripartida Trunnion Cl. 150/600/1500,
                Tripartida Forjada Cl. 800 e Cl. 300.
              </p>
            </div>
            <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <strong className="text-teal-700 dark:text-teal-400 block mb-1">
                Automação de Caldeiras
              </strong>
              <p className="text-[11px] text-muted-foreground">
                Painel Total Control BTC, Válvula de Descarga de Fundo DF/DFA-40, Temporizador
                CDP-4/CDP-8 e Transmissores TPB 102.
              </p>
            </div>
            <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <strong className="text-teal-700 dark:text-teal-400 block mb-1">
                Acessórios Industriais
              </strong>
              <p className="text-[11px] text-muted-foreground">
                Separadores de Umidade SUV, Estação Misturadora WD2010, Compensadores TC e
                Resfriadores de Amostra Sanitários RA30.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
