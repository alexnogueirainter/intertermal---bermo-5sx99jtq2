import { Clock, User, Building, CheckCircle2, Wrench, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { WORK_TYPE_OPTIONS } from '@/components/field-visit/field-visit-options'
import type { FieldVisitData } from '@/types/field-visit'
import type { Dispatch, SetStateAction } from 'react'

export function VisitBasicsSections({
  visit,
  setVisit,
  sellerMode,
  sellerName,
  handleEmployeeChange,
  handleStartTimeChange,
  handleEndTimeChange,
  handleDurationChange,
  handleRecalculateDuration,
}: {
  visit: FieldVisitData
  setVisit: Dispatch<SetStateAction<FieldVisitData>>
  sellerMode: boolean
  sellerName: string
  handleEmployeeChange: (val: string) => void
  handleStartTimeChange: (val: string) => void
  handleEndTimeChange: (val: string) => void
  handleDurationChange: (val: string) => void
  handleRecalculateDuration: () => void
}) {
  return (
    <>
      {/* 1. SEÇÃO: FUNCIONÁRIO RESPONSÁVEL */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-xs bg-white dark:bg-slate-900">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 flex items-center justify-center">
              <User className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-sm font-bold">1. Funcionário em Campo</CardTitle>
              <p className="text-[11px] text-muted-foreground">
                Fica gravado no celular e preenche automaticamente nas próximas visitas
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Nome do funcionário
            </label>
            <Input
              value={sellerMode ? sellerName : visit.employeeName}
              onChange={(e) => handleEmployeeChange(e.target.value)}
              disabled={sellerMode}
              placeholder="Ex.: Carlos Alberto Souza"
              className={`h-11 text-sm bg-slate-50/70 dark:bg-slate-950 focus-visible:ring-teal-600 ${sellerMode ? 'opacity-80' : ''}`}
            />
          </div>
        </CardContent>
      </Card>

      {/* 2. SEÇÃO: DADOS DA VISITA */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-xs bg-white dark:bg-slate-900">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 flex items-center justify-center">
              <Clock className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-sm font-bold">2. Dados da Visita</CardTitle>
              <p className="text-[11px] text-muted-foreground">
                Data e horários de atendimento técnico
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Data */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Data da visita
              </label>
              <Input
                type="date"
                value={visit.date}
                onChange={(e) => setVisit((prev) => ({ ...prev, date: e.target.value }))}
                className="h-11 text-sm bg-slate-50/70 dark:bg-slate-950"
              />
            </div>

            {/* Horário Início */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Horário de início
              </label>
              <Input
                type="time"
                value={visit.startTime}
                onChange={(e) => handleStartTimeChange(e.target.value)}
                className="h-11 text-sm bg-slate-50/70 dark:bg-slate-950"
              />
            </div>

            {/* Horário Término */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Horário de término
              </label>
              <Input
                type="time"
                value={visit.endTime}
                onChange={(e) => handleEndTimeChange(e.target.value)}
                className="h-11 text-sm bg-slate-50/70 dark:bg-slate-950"
              />
            </div>
          </div>

          {/* Tempo de visita */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                Tempo de visita
                {visit.isDurationManuallyEdited && (
                  <Badge
                    variant="outline"
                    className="text-[10px] font-normal text-amber-700 border-amber-300"
                  >
                    Editado manual
                  </Badge>
                )}
              </label>
              {visit.isDurationManuallyEdited && (
                <button
                  type="button"
                  onClick={handleRecalculateDuration}
                  className="text-[11px] text-teal-700 dark:text-teal-400 hover:underline font-medium"
                >
                  Recalcular automático
                </button>
              )}
            </div>
            <Input
              value={visit.visitDuration}
              onChange={(e) => handleDurationChange(e.target.value)}
              placeholder="Ex.: 2h 30min"
              className="h-11 text-sm font-medium bg-white dark:bg-slate-900"
            />
            <p className="text-[11px] text-muted-foreground mt-1">
              Calculado automaticamente entre início e término, com ajuste manual livre se
              necessário.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 3. SEÇÃO: CLIENTE E E-MAIL */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-xs bg-white dark:bg-slate-900">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 flex items-center justify-center">
              <Building className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-sm font-bold">3. Cliente Industrial</CardTitle>
              <p className="text-[11px] text-muted-foreground">
                Identificação da empresa, contato e e-mail para envio do relatório
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Campo Empresa */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Empresa
              </label>
              <Input
                value={visit.companyName}
                onChange={(e) => setVisit((prev) => ({ ...prev, companyName: e.target.value }))}
                placeholder="Ex.: Usina São Martinho, Cervejaria Petrópolis"
                className="h-11 text-sm bg-slate-50/70 dark:bg-slate-950"
              />
            </div>

            {/* Campo Nome do cliente (Pessoa de contato) */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Nome do cliente
              </label>
              <Input
                value={visit.clientName}
                onChange={(e) => setVisit((prev) => ({ ...prev, clientName: e.target.value }))}
                placeholder="Ex.: Carlos Mendes, Amanda Silva"
                className="h-11 text-sm bg-slate-50/70 dark:bg-slate-950"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Cargo
              </label>
              <Input
                value={visit.clientRole}
                onChange={(e) => setVisit((prev) => ({ ...prev, clientRole: e.target.value }))}
                placeholder="Ex.: Supervisor de Manutenção / Eng. de Processo"
                className="h-11 text-sm bg-slate-50/70 dark:bg-slate-950"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Telefone de Contato
              </label>
              <Input
                value={visit.clientContact}
                onChange={(e) => setVisit((prev) => ({ ...prev, clientContact: e.target.value }))}
                placeholder="Ex.: (16) 99876-5432"
                className="h-11 text-sm bg-slate-50/70 dark:bg-slate-950"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5 text-teal-600" />
                E-mail do cliente (Envio de relatório)
              </label>
              <Input
                type="email"
                value={visit.clientEmail || ''}
                onChange={(e) => setVisit((prev) => ({ ...prev, clientEmail: e.target.value }))}
                placeholder="Ex.: cliente@empresa.com.br"
                className="h-11 text-sm bg-slate-50/70 dark:bg-slate-950"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Área / Setor
              </label>
              <Input
                value={visit.clientWorkArea}
                onChange={(e) => setVisit((prev) => ({ ...prev, clientWorkArea: e.target.value }))}
                placeholder="Ex.: Caldeiraria, Utilidades, Fermentação, Casa de Força"
                className="h-11 text-sm bg-slate-50/70 dark:bg-slate-950"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 4. SEÇÃO: SELEÇÃO DOS 6 TIPOS DE VISITA (CARDS GRANDES MOBILE-FIRST) */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-xs bg-white dark:bg-slate-900">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 flex items-center justify-center">
              <Wrench className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-sm font-bold">4. Tipo de Visita</CardTitle>
              <p className="text-[11px] text-muted-foreground">
                Escolha um dos 6 tipos abaixo. O formulário se ajusta automaticamente ao fluxo
                adequado.
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {WORK_TYPE_OPTIONS.map((opt) => {
              const isSelected =
                visit.workType === opt.label ||
                (opt.label === 'Projeto Novo' &&
                  visit.workType === 'Projeto novo ou readequação') ||
                (opt.label === 'Catálogo de Equipamentos' &&
                  visit.workType === 'Catalogação de equipamentos') ||
                (opt.label === 'Manutenção Preventiva' &&
                  visit.workType === 'Manutenção preventiva ou corretiva')

              return (
                <button
                  key={opt.label}
                  type="button"
                  onClick={() => {
                    setVisit((prev) => ({ ...prev, workType: opt.label }))
                  }}
                  className={`p-4 rounded-xl text-left border-2 transition-all flex flex-col justify-between min-h-[110px] ${
                    isSelected
                      ? 'border-teal-600 bg-teal-50/90 dark:bg-teal-950/40 shadow-sm ring-1 ring-teal-600'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span
                      className={`text-sm font-bold ${
                        isSelected
                          ? 'text-teal-950 dark:text-teal-200'
                          : 'text-slate-800 dark:text-slate-200'
                      }`}
                    >
                      {opt.label}
                    </span>
                    {isSelected && (
                      <CheckCircle2 className="h-5 w-5 text-teal-700 dark:text-teal-400 shrink-0 mt-0.5" />
                    )}
                  </div>

                  <div className="mt-2 space-y-1">
                    <Badge
                      variant="outline"
                      className={`text-[9px] px-1.5 py-0 ${
                        opt.category === 'lean'
                          ? 'border-teal-300 text-teal-700 bg-teal-50/50'
                          : 'border-blue-300 text-blue-700 bg-blue-50/50'
                      }`}
                    >
                      {opt.badge}
                    </Badge>
                    <p className="text-[11px] text-muted-foreground leading-snug">
                      {opt.description}
                    </p>
                  </div>
                </button>
              )
            })}
          </div>

          {/* Campo de texto livre para 'Outro' */}
          {visit.workType === 'Outro' && (
            <div className="pt-2 animate-in fade-in slide-in-from-top-1 duration-200">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Especifique a atividade realizada:
              </label>
              <Input
                value={visit.workTypeOther}
                onChange={(e) => setVisit((prev) => ({ ...prev, workTypeOther: e.target.value }))}
                placeholder="Descreva o propósito da visita..."
                className="h-11 text-sm bg-slate-50/70 dark:bg-slate-950"
                autoFocus
              />
            </div>
          )}
        </CardContent>
      </Card>
    </>
  )
}
