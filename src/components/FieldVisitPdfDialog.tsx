import React, { useRef } from 'react'
import {
  Printer,
  Calendar,
  Clock,
  User,
  Building2,
  Phone,
  Briefcase,
  MapPin,
  FileText,
  Wrench,
  Thermometer,
  Layers,
  Camera,
  CheckCircle2,
  CheckSquare,
  AlertTriangle,
  Mail,
  Video,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { FieldVisitData, generateActionPlan, formatEquipmentTitle } from '@/types/field-visit'

interface FieldVisitPdfDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  visit: FieldVisitData
}

export function FieldVisitPdfDialog({ open, onOpenChange, visit }: FieldVisitPdfDialogProps) {
  const printRef = useRef<HTMLDivElement>(null)

  const handlePrint = () => {
    // Fallback mobile: alguns navegadores Android/iOS falham no window.print()
    // quando a página inteira é impressa (conteúdo em dialog com overflow).
    // Tentativa 1: window.print() normal. Se o navegador não suportar/ignorar,
    // o técnico usa o botão nativo "Imprimir/Salvar PDF" do próprio navegador.
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
    if (!isMobile || typeof window.print === 'function') {
      try {
        window.print()
        return
      } catch (_) {
        // segue para o fallback
      }
    }
    // Fallback: abre o painel de compartilhamento/impressão nativo com o HTML do relatório
    try {
      const html = printRef.current?.innerHTML || ''
      const win = window.open('', '_blank')
      if (win) {
        win.document.write(
          '<html><head><title>Relatório de Visita</title>' +
            '<meta name="viewport" content="width=device-width, initial-scale=1">' +
            '<style>body{font-family:system-ui,sans-serif;margin:16px}img{max-width:100%}</style>' +
            '</head><body>' +
            html +
            '<script>window.onload=function(){setTimeout(function(){window.print()},300)}</script>' +
            '</body></html>',
        )
        win.document.close()
      } else {
        alert(
          'Não foi possível abrir a impressão. Use o menu do navegador (⋮) → "Imprimir" ou "Adicionar à fila de impressão / Salvar PDF".',
        )
      }
    } catch (_) {
      alert(
        'Não foi possível abrir a impressão. Use o menu do navegador (⋮) → "Imprimir" ou "Salvar PDF".',
      )
    }
  }

  // Formatação de data
  let formattedDate = 'Não informada'
  if (visit.date) {
    try {
      const [year, month, day] = visit.date.split('-')
      if (year && month && day) {
        formattedDate = `${day}/${month}/${year}`
      } else {
        formattedDate = visit.date
      }
    } catch {
      formattedDate = visit.date
    }
  }

  const nowGeneratedString = new Date().toLocaleString('pt-BR')

  // Obtém ou gera o plano de ação
  const actionPlan =
    visit.actionPlan && visit.actionPlan.length > 0 ? visit.actionPlan : generateActionPlan(visit)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[92vh] flex flex-col p-0 overflow-hidden bg-slate-50 dark:bg-slate-900">
        {/* Barra de Ações Superior (Não sai na impressão física) */}
        <DialogHeader className="p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-row items-center justify-between shrink-0">
          <div>
            <DialogTitle className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Printer className="h-4 w-4 text-teal-700 dark:text-teal-400" />
              Relatório Técnico da Visita a Campo
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Formato A4 padronizado para envio ao cliente com plano de ação e anexos
            </DialogDescription>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              onClick={handlePrint}
              size="sm"
              className="bg-teal-700 hover:bg-teal-600 text-white font-semibold text-xs h-9 px-4 shadow-xs"
            >
              <Printer className="h-4 w-4 mr-1.5" />
              Imprimir / Salvar PDF
            </Button>
          </div>
        </DialogHeader>

        {/* Corpo rolavel na tela */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-100 dark:bg-slate-950/60">
          <div
            id="field-visit-printable-document"
            ref={printRef}
            className="max-w-[800px] mx-auto bg-white p-8 sm:p-12 space-y-6 text-slate-900 font-sans text-xs leading-relaxed shadow-md rounded-xl border border-slate-200 print:shadow-none print:border-none print:p-0 print:m-0 print:max-w-none"
          >
            {/* Cabeçalho no estilo Intertermal / BERMO */}
            <div className="border-b-2 border-teal-700 pb-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-2xl tracking-tighter text-teal-900">
                    INTERTERMAL
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded font-bold tracking-wider uppercase bg-teal-100 text-teal-800">
                    Engenharia Térmica
                  </span>
                </div>
                <p className="text-[11px] text-slate-700 font-medium leading-snug">
                  Assistência Técnica Autorizada & Especialista em Trocadores de Calor e Válvulas
                  BERMO
                </p>
                <p className="text-[10px] text-slate-600 leading-relaxed">
                  Rua Ananias Pires do Amaral, 98 - Sorocaba - SP - CEP 18016-456 - Jd Gonçalves
                  <br />
                  Fone: (11) 99407-7786 / (15) 3228-3956 • E-mail: alex.nogueira@intertermal.com.br
                </p>
              </div>

              <div className="text-right space-y-1.5 p-3 rounded-lg border bg-slate-50 border-slate-200 shrink-0 min-w-[190px]">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block">
                  Relatório de Visita
                </span>
                <div className="font-mono text-sm font-black text-teal-800">
                  VIS-{visit.date ? visit.date.replace(/-/g, '') : 'CAMPO'}
                </div>
                <div className="text-[11px] text-slate-600 flex items-center gap-1 justify-end">
                  <Calendar className="h-3 w-3 text-slate-400" />
                  Data: {formattedDate}
                </div>
                {visit.backendRecordId && (
                  <Badge className="bg-emerald-600 text-white text-[9px] font-mono uppercase">
                    CRM Registrado
                  </Badge>
                )}
              </div>
            </div>

            {/* Dados da Visita e Funcionário */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
              {/* Coluna 1: Funcionário & Horários */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-teal-800 flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5" />
                  Atendimento Técnico
                </span>
                <div className="font-bold text-sm text-slate-900">
                  {visit.employeeName || 'Funcionário não informado'}
                </div>
                <div className="space-y-1 text-slate-600 text-[11px]">
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-slate-400" />
                    <span>
                      Início:{' '}
                      <strong className="text-slate-800">{visit.startTime || '--:--'}</strong> •
                      Término:{' '}
                      <strong className="text-slate-800">{visit.endTime || '--:--'}</strong>
                    </span>
                  </div>
                  {visit.visitDuration && (
                    <div className="text-teal-800 font-semibold text-[11px]">
                      Duração total estimada: {visit.visitDuration}
                    </div>
                  )}
                </div>
              </div>

              {/* Coluna 2: Cliente & Área */}
              <div className="space-y-2 sm:text-right">
                <span className="text-[10px] font-bold uppercase tracking-wider text-teal-800 flex items-center gap-1.5 sm:justify-end">
                  <Building2 className="h-3.5 w-3.5" />
                  Dados do Cliente
                </span>
                <div className="font-bold text-sm text-slate-900">
                  {visit.companyName || visit.clientName || 'Empresa não informada'}
                </div>
                <div className="space-y-1 text-slate-600 text-[11px]">
                  {visit.companyName && visit.clientName && (
                    <div className="flex items-center gap-1.5 sm:justify-end text-slate-800 font-medium">
                      <User className="h-3 w-3 text-slate-400" />
                      <span>Contato: {visit.clientName}</span>
                    </div>
                  )}
                  {visit.clientRole && (
                    <div className="flex items-center gap-1.5 sm:justify-end">
                      <Briefcase className="h-3 w-3 text-slate-400" />
                      <span>Cargo: {visit.clientRole}</span>
                    </div>
                  )}
                  {visit.clientContact && (
                    <div className="flex items-center gap-1.5 sm:justify-end">
                      <Phone className="h-3 w-3 text-slate-400" />
                      <span>Contato: {visit.clientContact}</span>
                    </div>
                  )}
                  {visit.clientEmail && (
                    <div className="flex items-center gap-1.5 sm:justify-end">
                      <Mail className="h-3 w-3 text-slate-400" />
                      <span>E-mail: {visit.clientEmail}</span>
                    </div>
                  )}
                  {visit.clientWorkArea && (
                    <div className="flex items-center gap-1.5 sm:justify-end">
                      <MapPin className="h-3 w-3 text-slate-400" />
                      <span>Área: {visit.clientWorkArea}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Tipo de Trabalho */}
            <div className="p-3.5 rounded-lg border border-teal-200 bg-teal-50/40 space-y-1">
              <span className="text-[10px] uppercase font-bold text-teal-900 flex items-center gap-1.5">
                <Wrench className="h-3.5 w-3.5 text-teal-700" />
                Tipo de Visita
              </span>
              <div className="font-semibold text-slate-900 text-xs">
                {visit.workType || 'Não especificado'}
                {visit.workType === 'Outro' && visit.workTypeOther && (
                  <span className="text-slate-700 font-normal"> — {visit.workTypeOther}</span>
                )}
              </div>
            </div>

            {/* Descrição Livre / Relato Técnico */}
            {(visit.freeDescription || visit.generalObservations) && (
              <div className="space-y-1.5 border border-slate-200 rounded-lg p-3.5 bg-white">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5 text-teal-700" />
                  {visit.freeDescription
                    ? 'Descrição Livre & Levantamento Técnico'
                    : 'Relato Técnico & Observações Gerais'}
                </span>
                <p className="text-slate-800 whitespace-pre-wrap leading-relaxed text-[11px]">
                  {visit.freeDescription || visit.generalObservations}
                </p>
              </div>
            )}

            {/* Anexos Gerais da Visita (Fotos) */}
            {visit.visitAttachments && visit.visitAttachments.length > 0 && (
              <div className="space-y-2 border border-slate-200 rounded-lg p-3.5 bg-white">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Camera className="h-3.5 w-3.5 text-teal-700" />
                  Anexos Gerais da Instalação ({visit.visitAttachments.length})
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                  {visit.visitAttachments.map((att) => (
                    <div
                      key={att.id}
                      className="rounded border border-slate-200 overflow-hidden bg-slate-50 p-1 flex flex-col"
                    >
                      {att.type === 'image' ? (
                        <img
                          src={att.dataUrl}
                          alt={att.name || 'Foto geral'}
                          className="w-full h-32 object-contain bg-black/5 rounded"
                        />
                      ) : (
                        <div className="h-32 bg-slate-800 text-white flex flex-col items-center justify-center p-2 text-center rounded">
                          <Video className="h-6 w-6 text-teal-400 mb-1" />
                          <span className="text-[10px] truncate max-w-full">
                            {att.name || 'Vídeo Anexado'}
                          </span>
                        </div>
                      )}
                      <span className="text-[9px] text-slate-600 mt-1 truncate">
                        {att.name || 'Anexo'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Lista de Equipamentos Vistoriados */}
            <div className="space-y-4 pt-1">
              <div className="flex items-center justify-between border-b border-teal-700 pb-1.5">
                <h3 className="font-bold text-slate-900 uppercase tracking-wider text-xs flex items-center gap-1.5">
                  <Layers className="h-4 w-4 text-teal-700" />
                  Equipamentos Inspecionados ({visit.equipments.length})
                </h3>
                <span className="text-[10px] text-muted-foreground">
                  Placas, gaxetas, condições operacionais e imagens
                </span>
              </div>

              {visit.equipments.length === 0 ? (
                <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 text-center text-slate-500 italic text-xs">
                  Nenhum equipamento registrado nesta visita.
                </div>
              ) : (
                <div className="space-y-4">
                  {visit.equipments.map((eq, idx) => {
                    const eqTitle = formatEquipmentTitle(eq, idx)

                    const allEqAttachments =
                      eq.attachments && eq.attachments.length > 0
                        ? eq.attachments
                        : eq.photoDataUrl
                          ? [
                              {
                                id: 'legacy',
                                name: 'Foto da Placa',
                                type: 'image' as const,
                                dataUrl: eq.photoDataUrl,
                              },
                            ]
                          : []

                    return (
                      <div
                        key={eq.id}
                        className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs break-inside-avoid"
                      >
                        {/* Header do Equipamento */}
                        <div className="bg-slate-50 border-b border-slate-200 p-3 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 text-xs">{eqTitle}</span>
                            {eq.serialNumber && (
                              <span className="text-[10px] font-mono text-slate-500">
                                (Série: {eq.serialNumber})
                              </span>
                            )}
                          </div>

                          <Badge
                            variant="outline"
                            className={`text-[9px] font-bold ${
                              eq.difficulty === 'Alto'
                                ? 'text-rose-700 border-rose-300 bg-rose-50'
                                : eq.difficulty === 'Baixo'
                                  ? 'text-emerald-700 border-emerald-300 bg-emerald-50'
                                  : 'text-amber-700 border-amber-300 bg-amber-50'
                            }`}
                          >
                            Dificuldade: {eq.difficulty}
                          </Badge>
                        </div>

                        {/* Conteúdo / Tabela de Especificações */}
                        <div className="p-3.5 space-y-3">
                          {(eq.manufacturer ||
                            eq.plateCount ||
                            eq.installedLocation ||
                            eq.flowRate) && (
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10.5px]">
                              <div className="bg-slate-50/80 p-2 rounded border border-slate-100">
                                <span className="text-slate-500 block text-[9.5px] uppercase font-semibold">
                                  Fabricante
                                </span>
                                <span className="font-medium text-slate-800">
                                  {eq.manufacturer || '—'}
                                </span>
                              </div>

                              <div className="bg-slate-50/80 p-2 rounded border border-slate-100">
                                <span className="text-slate-500 block text-[9.5px] uppercase font-semibold">
                                  Qtd Placas
                                </span>
                                <span className="font-medium text-slate-800">
                                  {eq.plateCount || '—'}
                                </span>
                              </div>

                              <div className="bg-slate-50/80 p-2 rounded border border-slate-100">
                                <span className="text-slate-500 block text-[9.5px] uppercase font-semibold">
                                  Local Instalado
                                </span>
                                <span className="font-medium text-slate-800">
                                  {eq.installedLocation || '—'}
                                </span>
                              </div>

                              <div className="bg-slate-50/80 p-2 rounded border border-slate-100">
                                <span className="text-slate-500 block text-[9.5px] uppercase font-semibold">
                                  Vazão
                                </span>
                                <span className="font-medium text-slate-800">
                                  {eq.flowRate
                                    ? `${eq.flowRate}${eq.flowUnit ? ' ' + eq.flowUnit : ''}`
                                    : '—'}
                                </span>
                              </div>
                            </div>
                          )}

                          {/* Linha de Fluidos & Temperaturas */}
                          {(eq.fluid1 || eq.fluid2 || eq.inletTemp || eq.outletTemp) && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10.5px]">
                              <div className="bg-slate-50/80 p-2 rounded border border-slate-100 flex items-center justify-between">
                                <span className="text-slate-500 text-[9.5px] uppercase font-semibold">
                                  Fluidos Operacionais:
                                </span>
                                <span className="font-medium text-slate-800 text-right">
                                  {eq.fluid1 || '—'} / {eq.fluid2 || '—'}
                                </span>
                              </div>

                              <div className="bg-slate-50/80 p-2 rounded border border-slate-100 flex items-center justify-between">
                                <span className="text-slate-500 text-[9.5px] uppercase font-semibold flex items-center gap-1">
                                  <Thermometer className="h-3 w-3 text-slate-400" />
                                  Temperaturas (Entrada / Saída):
                                </span>
                                <span className="font-medium text-slate-800 text-right font-mono">
                                  {eq.inletTemp || '—'} / {eq.outletTemp || '—'}
                                </span>
                              </div>
                            </div>
                          )}

                          {/* Observações do Técnico */}
                          {eq.technicianNotes && (
                            <div className="p-2.5 rounded bg-amber-50/50 border border-amber-200/80 text-[10.5px]">
                              <span className="font-bold text-amber-900 block text-[9.5px] uppercase mb-0.5">
                                Parecer do Técnico Mecânico:
                              </span>
                              <p className="text-slate-800 whitespace-pre-wrap">
                                {eq.technicianNotes}
                              </p>
                            </div>
                          )}

                          {/* Fotos e Vídeos do Equipamento */}
                          {allEqAttachments.length > 0 && (
                            <div className="pt-1">
                              <span className="text-[9.5px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1 mb-1.5">
                                <Camera className="h-3 w-3 text-teal-700" />
                                Registros Fotográficos do Equipamento ({allEqAttachments.length})
                              </span>
                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                {allEqAttachments.map((att) => (
                                  <div
                                    key={att.id}
                                    className="rounded-lg overflow-hidden border border-slate-200 bg-slate-50 p-1 flex flex-col"
                                  >
                                    {att.type === 'image' ? (
                                      <img
                                        src={att.dataUrl}
                                        alt={att.name || eqTitle}
                                        className="h-36 w-full object-contain rounded bg-white"
                                      />
                                    ) : (
                                      <div className="h-36 bg-slate-800 text-white flex flex-col items-center justify-center p-2 text-center rounded">
                                        <Video className="h-6 w-6 text-teal-400 mb-1" />
                                        <span className="text-[10px] truncate max-w-full">
                                          {att.name || 'Vídeo'}
                                        </span>
                                      </div>
                                    )}
                                    <span className="text-[9px] text-slate-600 mt-1 truncate">
                                      {att.name || 'Registro'}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* PLANO DE AÇÃO GERADO AUTOMATICAMENTE (Regra 4: Pontos a Melhorar) */}
            <div className="space-y-3 pt-2 break-inside-avoid">
              <div className="flex items-center justify-between border-b border-teal-700 pb-1.5">
                <h3 className="font-bold text-slate-900 uppercase tracking-wider text-xs flex items-center gap-1.5">
                  <CheckSquare className="h-4 w-4 text-teal-700" />
                  Análise da IA — Plano de Ação e Pontos de Atenção
                </h3>
                <span className="text-[10px] text-teal-800 font-semibold">
                  Engenharia de Aplicação Intertermal / Bermo
                </span>
              </div>

              <div className="space-y-2.5">
                {actionPlan.map((action, aIdx) => (
                  <div
                    key={action.id || aIdx}
                    className="p-3 rounded-lg border border-slate-200 bg-slate-50/80 space-y-2 text-[11px]"
                  >
                    <div className="flex items-center justify-between gap-2 border-b border-slate-200/80 pb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="h-4 w-4 rounded-full bg-teal-100 text-teal-800 text-[10px] font-bold flex items-center justify-center">
                          {aIdx + 1}
                        </span>
                        <strong className="text-slate-900 font-bold">{action.title}</strong>
                      </div>
                      <Badge
                        variant="outline"
                        className={`text-[9px] font-semibold ${
                          action.priority === 'Alta'
                            ? 'text-rose-700 border-rose-300 bg-rose-50'
                            : action.priority === 'Média'
                              ? 'text-amber-700 border-amber-300 bg-amber-50'
                              : 'text-emerald-700 border-emerald-300 bg-emerald-50'
                        }`}
                      >
                        Prioridade {action.priority}
                      </Badge>
                    </div>

                    {/* 1. Diagnóstico */}
                    <div className="pl-6 text-[10.5px] leading-snug text-slate-700">
                      <strong className="text-slate-900 font-semibold">1. Diagnóstico: </strong>
                      <span>{action.diagnosis || action.description}</span>
                    </div>

                    {/* 2. Ação recomendada e referência do fabricante */}
                    <div className="pl-6 text-teal-900 font-medium text-[10.5px] space-y-0.5">
                      <div className="flex items-start gap-1.5">
                        <span className="font-bold shrink-0">2. Ações recomendadas:</span>
                        <span>{action.suggestedAction || action.description}</span>
                      </div>
                      <div className="text-[9.5px] text-teal-800">
                        <strong>Referência técnica: </strong>
                        <span>{action.technicalReference || 'requer consulta ao fabricante'}</span>
                      </div>
                    </div>

                    {/* 3. Condições do local de instalação */}
                    <div className="pl-6 text-[10px] text-amber-900">
                      <strong className="font-semibold">
                        3. Condições do local de instalação (acesso / dificuldade física):{' '}
                      </strong>
                      <span>
                        {action.installationConditions ||
                          'Condições do local não detalhadas na visita'}
                      </span>
                    </div>

                    {/* 4. Itens pendentes de levantamento */}
                    <div className="pl-6 text-[10px] text-rose-800">
                      <strong className="font-semibold">
                        4. Itens pendentes de levantamento:{' '}
                      </strong>
                      {action.pendingItems && action.pendingItems.length > 0 ? (
                        <ul className="list-disc list-inside space-y-0.5 pt-0.5">
                          {action.pendingItems.map((p, pIdx) => (
                            <li key={pIdx}>{p}</li>
                          ))}
                        </ul>
                      ) : (
                        <span className="text-slate-500 italic">
                          Nenhum item pendente registrado.
                        </span>
                      )}
                    </div>

                    {/* Vínculo com equipamento sinalizado: mostra as fotos dele */}
                    {(() => {
                      const eqId = (action as any).equipment_id
                      if (!eqId) return null
                      const eq = (visit.equipments || []).find((e: any) => e.id === eqId)
                      if (!eq) return null
                      const atts = [
                        ...(eq.attachments || []),
                        ...(eq.photoDataUrl
                          ? [
                              {
                                id: eq.id + '-photo',
                                dataUrl: eq.photoDataUrl,
                                type: 'image',
                                name: 'Foto',
                              },
                            ]
                          : []),
                      ]
                      if (atts.length === 0) return null
                      return (
                        <div className="pl-6 pt-1.5">
                          <span className="text-[9.5px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1 mb-1">
                            <Camera className="h-3 w-3 text-teal-700" />
                            Fotos vinculadas —{' '}
                            {(() => {
                              const eqIndex = (visit.equipments || []).findIndex(
                                (e: any) => e.id === eq.id,
                              )
                              return formatEquipmentTitle(eq, eqIndex >= 0 ? eqIndex : undefined)
                            })()}
                          </span>
                          <div className="grid grid-cols-3 gap-1.5">
                            {atts.slice(0, 6).map((att: any) => (
                              <img
                                key={att.id}
                                src={att.dataUrl}
                                alt={att.name || eq.name}
                                className="h-20 w-full object-contain rounded border border-slate-200 bg-white"
                              />
                            ))}
                          </div>
                        </div>
                      )
                    })()}
                  </div>
                ))}
              </div>
            </div>

            {/* Rodapé com data de geração */}
            <div className="border-t border-slate-200 pt-4 flex flex-col sm:flex-row justify-between items-center gap-2 text-[10px] text-slate-500">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-teal-700" />
                <span>Intertermal — Assistência Técnica e Engenharia Térmica</span>
              </div>
              <div>Relatório emitido em: {nowGeneratedString}</div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
