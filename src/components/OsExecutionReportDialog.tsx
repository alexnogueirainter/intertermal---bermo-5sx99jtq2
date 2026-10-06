import React, { useState, useEffect, useRef } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Wrench,
  Printer,
  Download,
  Plus,
  Trash2,
  Calendar,
  Clock,
  User,
  Building2,
  Layers,
  FileText,
  Package,
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Eye,
  FileCheck2,
} from 'lucide-react'
import type {
  ServiceOrderRecord,
  QuoteRecord,
  OsExecutionReportRecord,
  OsExecutionReportMaterialItem,
} from '@/types/crm'
import { osExecutionReportsService } from '@/services/os-execution-reports'
import { generateExecutionReportPdf } from '@/lib/execution-report-pdf'

interface OsExecutionReportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  serviceOrder: ServiceOrderRecord | null
  quote?: QuoteRecord | null
  existingReport?: OsExecutionReportRecord | null
  defaultTechnicianName?: string
  onReportSaved?: (report: OsExecutionReportRecord) => void
}

export const OsExecutionReportDialog: React.FC<OsExecutionReportDialogProps> = ({
  open,
  onOpenChange,
  serviceOrder,
  quote,
  existingReport,
  defaultTechnicianName = 'Alex Nogueira (Especialista BERMO)',
  onReportSaved,
}) => {
  const printableRef = useRef<HTMLDivElement>(null)

  // Estados do formulário
  const [activeTab, setActiveTab] = useState<'form' | 'preview'>('form')
  const [reportId, setReportId] = useState<string | null>(null)
  const [workStartDatetime, setWorkStartDatetime] = useState<string>('')
  const [equipmentModel, setEquipmentModel] = useState<string>('')
  const [equipmentTag, setEquipmentTag] = useState<string>('')
  const [exchangerCurrentStatus, setExchangerCurrentStatus] = useState<string>('')
  const [technicianName, setTechnicianName] = useState<string>('')
  const [materials, setMaterials] = useState<OsExecutionReportMaterialItem[]>([])
  const [observations, setObservations] = useState<string>('')

  // Estados de controle
  const [isSaving, setIsSaving] = useState(false)
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Inicialização / Sincronização ao abrir ou mudar OS/existingReport
  useEffect(() => {
    if (!open || !serviceOrder) return

    setErrorMessage(null)
    setSaveSuccess(false)
    setActiveTab('form')

    // Tentar carregar dados existentes se fornecidos
    if (existingReport) {
      setReportId(existingReport.id)
      setWorkStartDatetime(existingReport.work_start_datetime || '')
      setEquipmentModel(
        existingReport.equipment_model ||
          serviceOrder.equipment_model ||
          (serviceOrder.equipment_info?.model as string) ||
          'Trocador de Calor BERMO',
      )
      setEquipmentTag(
        existingReport.equipment_tag || (serviceOrder.equipment_info?.tag as string) || '',
      )
      setExchangerCurrentStatus(existingReport.exchanger_current_status || '')
      setTechnicianName(
        existingReport.technician_name || serviceOrder.assigned_to || defaultTechnicianName,
      )
      setMaterials(
        Array.isArray(existingReport.materials_used) && existingReport.materials_used.length > 0
          ? existingReport.materials_used
          : [],
      )
      setObservations(existingReport.observations || '')
      return
    }

    // Caso não tenha existingReport via prop, buscar se já existe algum no backend para esta OS
    let isMounted = true
    osExecutionReportsService
      .getByServiceOrderId(serviceOrder.id)
      .then((records) => {
        if (!isMounted) return
        if (records.length > 0) {
          const rec = records[0]
          setReportId(rec.id)
          setWorkStartDatetime(rec.work_start_datetime || '')
          setEquipmentModel(
            rec.equipment_model ||
              serviceOrder.equipment_model ||
              (serviceOrder.equipment_info?.model as string) ||
              'Trocador de Calor BERMO',
          )
          setEquipmentTag(rec.equipment_tag || (serviceOrder.equipment_info?.tag as string) || '')
          setExchangerCurrentStatus(rec.exchanger_current_status || '')
          setTechnicianName(
            rec.technician_name || serviceOrder.assigned_to || defaultTechnicianName,
          )
          setMaterials(
            Array.isArray(rec.materials_used) && rec.materials_used.length > 0
              ? rec.materials_used
              : buildDefaultMaterials(serviceOrder, quote),
          )
          setObservations(rec.observations || '')
        } else {
          // Valores iniciais padrão
          initDefaults(serviceOrder, quote)
        }
      })
      .catch(() => {
        if (isMounted) initDefaults(serviceOrder, quote)
      })

    return () => {
      isMounted = false
    }
  }, [open, serviceOrder, existingReport, defaultTechnicianName])

  // Inicializa valores padrões baseados na OS e na cotação
  const initDefaults = (so: ServiceOrderRecord, q?: QuoteRecord | null) => {
    setReportId(null)
    const now = new Date()
    const nowIsoLocal = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16)
    setWorkStartDatetime(nowIsoLocal)

    const model =
      so.equipment_model ||
      q?.equipment_model ||
      (so.equipment_info?.model as string) ||
      'Trocador de Calor BERMO'
    setEquipmentModel(model)

    const tag = (so.equipment_info?.tag as string) || q?.equipments?.[0]?.tag || ''
    setEquipmentTag(tag)

    setExchangerCurrentStatus(
      'Equipamento isolado termicamente e hidraulicamente na planta. Bloqueios de segurança efetuados para início da intervenção técnica.',
    )

    setTechnicianName(so.assigned_to || defaultTechnicianName)
    setMaterials(buildDefaultMaterials(so, q))
    setObservations(
      'Trabalho de campo iniciado com conformidade de segurança e EPIs completos. Vistoria visual preliminar realizada.',
    )
  }

  // Monta lista de insumos baseada nos materiais e químicos da proposta (se houver)
  const buildDefaultMaterials = (
    so: ServiceOrderRecord,
    q?: QuoteRecord | null,
  ): OsExecutionReportMaterialItem[] => {
    const list: OsExecutionReportMaterialItem[] = []

    // 1. Químicos da proposta
    if (q?.chemical_products && Array.isArray(q.chemical_products)) {
      q.chemical_products.forEach((cp, idx) => {
        list.push({
          id: `chem-${idx}`,
          description: cp.description || 'Produto Químico Intertermal',
          quantity: cp.quantity || 1,
          unit: cp.unit || 'L',
          notes: cp.category === 'cleaning' ? 'Limpeza Química CIP' : 'Pintura/Proteção',
        })
      })
    }

    // 2. Peças e materiais customizados da proposta
    if (q?.materials_items && Array.isArray(q.materials_items)) {
      q.materials_items.forEach((m, idx) => {
        list.push({
          id: `mat-${idx}`,
          description: m.description || 'Peça / Componente de Reposição',
          quantity: m.quantity || 1,
          unit: 'un',
        })
      })
    }

    // 3. Fallback se não houver lista
    if (list.length === 0) {
      list.push(
        {
          id: '1',
          description: 'Desincrustante / Solução Química CIP Intertermal',
          quantity: 20,
          unit: 'L',
          notes: 'Circulação em circuito fechado',
        },
        {
          id: '2',
          description: 'Gaxetas e anéis de vedação de elastômero',
          quantity: 1,
          unit: 'cj',
          notes: 'Substituição preventiva',
        },
      )
    }

    return list
  }

  // Manipulação de Insumos
  const handleAddMaterial = () => {
    setMaterials((prev) => [
      ...prev,
      {
        id: `custom-${Date.now()}`,
        description: '',
        quantity: 1,
        unit: 'un',
        notes: '',
      },
    ])
  }

  const handleUpdateMaterial = (
    index: number,
    field: keyof OsExecutionReportMaterialItem,
    value: any,
  ) => {
    setMaterials((prev) => {
      const copy = [...prev]
      copy[index] = { ...copy[index], [field]: value }
      return copy
    })
  }

  const handleRemoveMaterial = (index: number) => {
    setMaterials((prev) => prev.filter((_, i) => i !== index))
  }

  // Salvar no backend (PocketBase collection: os_execution_reports)
  const handleSaveReport = async (): Promise<OsExecutionReportRecord | null> => {
    if (!serviceOrder) return null
    setIsSaving(true)
    setErrorMessage(null)
    setSaveSuccess(false)

    try {
      const payload: Partial<OsExecutionReportRecord> = {
        service_order_id: serviceOrder.id,
        order_number: serviceOrder.order_number || serviceOrder.quote_number || serviceOrder.id,
        quote_number: serviceOrder.quote_number || quote?.quote_number || '',
        client_id: serviceOrder.client_id || '',
        client_name: serviceOrder.client_name || 'Cliente Industrial',
        work_start_datetime: workStartDatetime,
        equipment_model: equipmentModel,
        equipment_tag: equipmentTag,
        exchanger_current_status: exchangerCurrentStatus,
        technician_name: technicianName,
        materials_used: materials,
        observations: observations,
        created_by: technicianName,
      }

      let saved: OsExecutionReportRecord
      if (reportId) {
        saved = await osExecutionReportsService.update(reportId, payload)
      } else {
        saved = await osExecutionReportsService.create(payload)
        setReportId(saved.id)
      }

      setSaveSuccess(true)
      if (onReportSaved) {
        onReportSaved(saved)
      }
      return saved
    } catch (err: any) {
      console.error('Erro ao salvar relatório de execução:', err)
      setErrorMessage(err?.message || 'Falha ao salvar relatório no banco.')
      return null
    } finally {
      setIsSaving(false)
    }
  }

  // Gerar e Baixar PDF com os dados em tempo real da sessão
  const handleDownloadPdf = async () => {
    setIsGeneratingPdf(true)
    setErrorMessage(null)
    try {
      // 1. Tenta salvar os dados atuais em segundo plano, mas sem bloquear a emissão se falhar
      handleSaveReport().catch((err) =>
        console.warn('Salvamento em segundo plano antes do download do PDF:', err),
      )

      // 2. Mudar para a aba de prévia para acompanhamento visual
      if (activeTab !== 'preview') {
        setActiveTab('preview')
        await new Promise((resolve) => setTimeout(resolve, 250))
      }

      const printableEl =
        printableRef.current || document.getElementById('os-execution-report-printable')
      if (!printableEl) {
        throw new Error('Elemento do relatório não encontrado para gerar PDF.')
      }

      const safeNumber = (serviceOrder?.order_number || serviceOrder?.quote_number || 'OS').replace(
        /[^a-zA-Z0-9_-]/g,
        '_',
      )
      const fileName = `Relatorio_Execucao_${safeNumber}.pdf`

      await generateExecutionReportPdf(printableEl, fileName)
    } catch (err: any) {
      console.error('Erro ao gerar PDF:', err)
      setErrorMessage(err?.message || 'Falha ao compilar PDF.')
    } finally {
      setIsGeneratingPdf(false)
    }
  }

  // Impressão via diálogo nativo do navegador com os dados em tempo real da sessão
  const handlePrint = async () => {
    // 1. Salva em segundo plano de forma silenciosa para persistência
    handleSaveReport().catch((err) =>
      console.warn('Salvamento em segundo plano antes da impressão:', err),
    )

    // 2. Alterna para a aba de prévia para garantir feedback imediato ao usuário
    if (activeTab !== 'preview') {
      setActiveTab('preview')
      await new Promise((resolve) => setTimeout(resolve, 250))
    }

    // 3. Prepara classes de impressão para os seletores CSS do Radix Portal
    document.body.classList.add('quote-printing-active')
    document.querySelectorAll('[data-radix-portal]').forEach((portal) => {
      if (portal.querySelector('#os-execution-report-printable')) {
        portal.classList.add('print-visible-portal')
      } else {
        portal.classList.remove('print-visible-portal')
      }
    })

    // 4. Fallback caso algum navegador mobile Android/iOS bloqueie window.print() sobre o dialog
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
    if (!isMobile || typeof window.print === 'function') {
      setTimeout(() => {
        try {
          window.print()
        } finally {
          // Limpeza de classes após a impressão
          document.body.classList.remove('quote-printing-active')
          document
            .querySelectorAll('[data-radix-portal].print-visible-portal')
            .forEach((portal) => {
              portal.classList.remove('print-visible-portal')
            })
        }
      }, 200)
      return
    }

    // Fallback para mobile restritivo: janela pop-up dedicada com o HTML da prévia renderizada
    try {
      const html = printableRef.current?.innerHTML || ''
      const win = window.open('', '_blank')
      if (win) {
        win.document.write(
          '<html><head><title>Relatório de Execução de OS</title>' +
            '<meta name="viewport" content="width=device-width, initial-scale=1">' +
            '<style>body{font-family:system-ui,sans-serif;margin:16px;color:#0f172a}table{width:100%;border-collapse:collapse}th,td{border:1px solid #cbd5e1;padding:8px}</style>' +
            '</head><body>' +
            html +
            '<script>window.onload=function(){setTimeout(function(){window.print()},300)}</script>' +
            '</body></html>',
        )
        win.document.close()
      }
    } catch (popupErr) {
      console.warn('Fallback popup de impressão:', popupErr)
    } finally {
      document.body.classList.remove('quote-printing-active')
      document.querySelectorAll('[data-radix-portal].print-visible-portal').forEach((portal) => {
        portal.classList.remove('print-visible-portal')
      })
    }
  }

  if (!serviceOrder) return null

  const orderNum = serviceOrder.order_number || serviceOrder.quote_number || serviceOrder.id
  const formattedStart = workStartDatetime
    ? new Date(workStartDatetime).toLocaleString('pt-BR', {
        dateStyle: 'short',
        timeStyle: 'short',
      })
    : 'Não informada'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[92vh] flex flex-col p-0 overflow-hidden bg-slate-50 dark:bg-slate-900">
        {/* Cabeçalho do Dialog */}
        <DialogHeader className="p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-row items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-teal-100 dark:bg-teal-950/70 text-teal-700 dark:text-teal-300">
              <FileCheck2 className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                Relatório de Início de Execução — OS #{orderNum}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Cliente: <strong>{serviceOrder.client_name || 'Cliente'}</strong> • Registro técnico
                de início de trabalho e insumos
              </DialogDescription>
            </div>
          </div>

          {/* Abas e Ações Rápidas */}
          <div className="flex items-center gap-2">
            <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs">
              <button
                type="button"
                onClick={() => setActiveTab('form')}
                className={`px-3 py-1 rounded-md font-semibold transition-all flex items-center gap-1.5 ${
                  activeTab === 'form'
                    ? 'bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-300 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <FileText className="h-3.5 w-3.5" />
                Preenchimento
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('preview')}
                className={`px-3 py-1 rounded-md font-semibold transition-all flex items-center gap-1.5 ${
                  activeTab === 'preview'
                    ? 'bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-300 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <Eye className="h-3.5 w-3.5" />
                Prévia do PDF
              </button>
            </div>

            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handlePrint}
              className="text-xs h-8 text-slate-700 dark:text-slate-200"
              title="Imprimir relatório"
            >
              <Printer className="h-3.5 w-3.5 mr-1" /> Imprimir
            </Button>

            <Button
              type="button"
              size="sm"
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf || isSaving}
              className="bg-teal-700 hover:bg-teal-600 text-white font-semibold text-xs h-8 shadow-xs"
            >
              {isGeneratingPdf ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                  Gerando PDF...
                </>
              ) : (
                <>
                  <Download className="h-3.5 w-3.5 mr-1.5" />
                  Baixar PDF
                </>
              )}
            </Button>
          </div>
        </DialogHeader>

        {/* Alertas de Sucesso / Erro */}
        {errorMessage && (
          <div className="mx-4 mt-3 p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200 text-xs flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        {saveSuccess && (
          <div className="mx-4 mt-3 p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-200 text-xs flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            <span>Relatório salvo com sucesso no banco de dados!</span>
          </div>
        )}

        {/* Corpo do Dialog */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-100 dark:bg-slate-950/50">
          {/* Aba de Formulário (oculta apenas na tela quando ativaTab !== 'form', e sempre oculta na impressão) */}
          <div className={`${activeTab === 'form' ? 'block' : 'hidden'} print:hidden`}>
            {/* FORMULÁRIO DE PREENCHIMENTO */}
            <div className="max-w-3xl mx-auto space-y-4">
              {/* Card 1: Identificação da OS e Início do Trabalho */}
              <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3">
                <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
                  <Wrench className="h-4 w-4 text-teal-600" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                    1. Identificação da OS & Início do Trabalho
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <Label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                      Número da OS
                    </Label>
                    <Input
                      disabled
                      value={`OS #${orderNum}`}
                      className="text-xs font-mono font-bold bg-slate-50 dark:bg-slate-950 h-8"
                    />
                  </div>

                  <div>
                    <Label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                      Proposta de Origem
                    </Label>
                    <Input
                      disabled
                      value={
                        serviceOrder.quote_number
                          ? `Proposta #${serviceOrder.quote_number}`
                          : 'Direta / Sem proposta'
                      }
                      className="text-xs font-mono bg-slate-50 dark:bg-slate-950 h-8"
                    />
                  </div>

                  <div>
                    <Label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                      Data/Hora de Início do Trabalho *
                    </Label>
                    <Input
                      type="datetime-local"
                      value={workStartDatetime}
                      onChange={(e) => setWorkStartDatetime(e.target.value)}
                      className="text-xs h-8 font-semibold bg-white dark:bg-slate-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                  <div>
                    <Label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                      Cliente Industrial
                    </Label>
                    <Input
                      disabled
                      value={serviceOrder.client_name || 'Cliente'}
                      className="text-xs bg-slate-50 dark:bg-slate-950 h-8"
                    />
                  </div>

                  <div>
                    <Label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                      Técnico Responsável *
                    </Label>
                    <Input
                      value={technicianName}
                      onChange={(e) => setTechnicianName(e.target.value)}
                      placeholder="Nome do técnico responsável..."
                      className="text-xs h-8 font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* Card 2: Status Atual do Trocador de Calor */}
              <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3">
                <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
                  <Layers className="h-4 w-4 text-teal-600" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                    2. Equipamento & Status Atual do Trocador
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <Label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                      Modelo do Trocador de Calor
                    </Label>
                    <Input
                      value={equipmentModel}
                      onChange={(e) => setEquipmentModel(e.target.value)}
                      placeholder="Ex: Trocador de Placas BERMO B25 / SIGMA 37"
                      className="text-xs h-8"
                    />
                  </div>

                  <div>
                    <Label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                      TAG / Identificação de Campo (opcional)
                    </Label>
                    <Input
                      value={equipmentTag}
                      onChange={(e) => setEquipmentTag(e.target.value)}
                      placeholder="Ex: TC-101-PA / Setor Caldeira"
                      className="text-xs h-8 font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 flex items-center justify-between">
                    <span>Status Atual do Trocador (Situação no momento da chegada) *</span>
                    <span className="text-[10px] text-muted-foreground font-normal">
                      Campo de texto livre
                    </span>
                  </Label>
                  <Textarea
                    value={exchangerCurrentStatus}
                    onChange={(e) => setExchangerCurrentStatus(e.target.value)}
                    placeholder="Descreva o estado do trocador na chegada: vazamentos visíveis, incrustação, integridade do pacote de placas, abertura do aperto A/B, etc."
                    className="text-xs min-h-[85px] leading-relaxed"
                  />
                </div>
              </div>

              {/* Card 3: Insumos Internos Utilizados */}
              <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-teal-600" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                      3. Insumos Internos Utilizados para Realização do Trabalho
                    </h3>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleAddMaterial}
                    className="text-[11px] h-7 px-2 text-teal-700 dark:text-teal-400 border-teal-300 dark:border-teal-800"
                  >
                    <Plus className="h-3 w-3 mr-1" /> Adicionar Insumo
                  </Button>
                </div>

                <p className="text-[11px] text-muted-foreground">
                  Liste os produtos químicos, placas, gaxetas, vedações e consumíveis retirados do
                  estoque interno para a execução desta OS.
                </p>

                <div className="space-y-2">
                  {materials.map((mat, index) => (
                    <div
                      key={mat.id || index}
                      className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40 flex flex-col sm:flex-row items-stretch sm:items-center gap-2"
                    >
                      <div className="flex-1">
                        <Input
                          placeholder="Descrição do insumo (ex: Gaxeta EPDM B25, Produto CIP...)"
                          value={mat.description}
                          onChange={(e) =>
                            handleUpdateMaterial(index, 'description', e.target.value)
                          }
                          className="text-xs h-8 bg-white dark:bg-slate-900"
                        />
                      </div>

                      <div className="w-24">
                        <Input
                          type="number"
                          step="any"
                          placeholder="Qtd"
                          value={mat.quantity}
                          onChange={(e) => handleUpdateMaterial(index, 'quantity', e.target.value)}
                          className="text-xs h-8 text-center bg-white dark:bg-slate-900 font-mono"
                        />
                      </div>

                      <div className="w-20">
                        <Input
                          placeholder="Un (L, kg, un)"
                          value={mat.unit || ''}
                          onChange={(e) => handleUpdateMaterial(index, 'unit', e.target.value)}
                          className="text-xs h-8 text-center bg-white dark:bg-slate-900"
                        />
                      </div>

                      <div className="flex-1">
                        <Input
                          placeholder="Obs / Lote / Aplicação (opcional)"
                          value={mat.notes || ''}
                          onChange={(e) => handleUpdateMaterial(index, 'notes', e.target.value)}
                          className="text-xs h-8 bg-white dark:bg-slate-900"
                        />
                      </div>

                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveMaterial(index)}
                        className="h-8 w-8 text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                        title="Remover insumo"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}

                  {materials.length === 0 && (
                    <div className="p-4 text-center text-xs text-muted-foreground border border-dashed rounded-lg">
                      Nenhum insumo adicionado ainda. Clique em "Adicionar Insumo" acima.
                    </div>
                  )}
                </div>
              </div>

              {/* Card 4: Campo de Observações Livres */}
              <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-2">
                <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
                  <FileText className="h-4 w-4 text-teal-600" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                    4. Observações Gerais da Execução
                  </h3>
                </div>

                <Textarea
                  value={observations}
                  onChange={(e) => setObservations(e.target.value)}
                  placeholder="Informações adicionais sobre o início do trabalho, condições da sala de máquinas, bloqueios efetuados, testes iniciais ou particularidades do cliente..."
                  className="text-xs min-h-[90px] leading-relaxed"
                />
              </div>

              {/* Botões do Rodapé do Formulário */}
              <div className="flex items-center justify-between pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onOpenChange(false)}
                  className="text-xs"
                >
                  Fechar
                </Button>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setActiveTab('preview')}
                    className="text-xs border-teal-300 dark:border-teal-800 text-teal-800 dark:text-teal-300"
                  >
                    <Eye className="h-3.5 w-3.5 mr-1" /> Ver Prévia do PDF
                  </Button>

                  <Button
                    type="button"
                    size="sm"
                    onClick={handleSaveReport}
                    disabled={isSaving}
                    className="bg-teal-700 hover:bg-teal-600 text-white font-semibold text-xs shadow-xs"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      <>
                        <Save className="h-3.5 w-3.5 mr-1.5" />
                        Salvar Relatório
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Aba de Prévia do PDF Oficial A4 (SEMPRE montada no DOM para impressão e html2pdf) */}
          <div
            className={`${
              activeTab === 'preview' ? 'block' : 'hidden'
            } print:block max-w-[800px] mx-auto`}
          >
            <div
              id="os-execution-report-printable"
              ref={printableRef}
              className="bg-white p-8 sm:p-12 space-y-6 text-slate-900 font-sans text-xs leading-relaxed shadow-md rounded-xl border border-slate-200 print:shadow-none print:border-none print:p-0 print:m-0 print:max-w-none"
            >
              {/* Cabeçalho Intertermal / BERMO */}
              <div className="report-print-header border-b-2 border-teal-700 pb-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-2xl tracking-tighter text-teal-900">
                      INTERTERMAL
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded font-bold tracking-wider uppercase bg-teal-100 text-teal-800">
                      Serviços & Engenharia
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-700 font-medium leading-snug">
                    Assistência Técnica Especializada em Trocadores de Calor & Válvulas BERMO
                  </p>
                  <p className="text-[10px] text-slate-600 leading-relaxed">
                    Sorocaba / SP • Fone: (11) 99407-7786 / (15) 3228-3956 •
                    alex.nogueira@intertermal.com.br
                  </p>
                </div>

                <div className="text-right space-y-1 p-3 rounded-lg border bg-slate-50 border-slate-200 shrink-0 min-w-[200px]">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block">
                    Relatório de Execução
                  </span>
                  <div className="font-mono text-base font-black text-teal-800">OS #{orderNum}</div>
                  {serviceOrder.quote_number && (
                    <div className="text-[10.5px] font-mono text-slate-600">
                      Prop: #{serviceOrder.quote_number}
                    </div>
                  )}
                  <div className="text-[10px] text-slate-500">
                    Emitido em: {new Date().toLocaleDateString('pt-BR')}
                  </div>
                </div>
              </div>

              {/* Bloco de Identificação */}
              <div className="report-print-card grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-teal-800 flex items-center gap-1.5">
                    <Building2 className="h-3.5 w-3.5" />
                    Dados do Cliente
                  </span>
                  <div className="font-bold text-sm text-slate-900">
                    {serviceOrder.client_name || 'Cliente Industrial'}
                  </div>
                  <div className="text-[11px] text-slate-600 space-y-0.5">
                    <div>OS: #{orderNum}</div>
                    {serviceOrder.title && (
                      <div className="text-slate-700 font-medium">{serviceOrder.title}</div>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5 sm:text-right">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-teal-800 flex items-center gap-1.5 sm:justify-end">
                    <User className="h-3.5 w-3.5" />
                    Responsável Técnico & Horário
                  </span>
                  <div className="font-bold text-sm text-slate-900">
                    {technicianName || 'Alex Nogueira'}
                  </div>
                  <div className="text-[11px] text-slate-600 space-y-0.5">
                    <div className="flex items-center gap-1 sm:justify-end">
                      <Clock className="h-3 w-3 text-slate-400" />
                      <span>
                        Início dos Trabalhos: <strong>{formattedStart}</strong>
                      </span>
                    </div>
                    <div className="text-teal-800 font-semibold text-[10px]">
                      Status: EM EXECUÇÃO DE CAMPO
                    </div>
                  </div>
                </div>
              </div>

              {/* Bloco do Trocador de Calor */}
              <div className="report-print-card border border-slate-200 rounded-xl overflow-hidden bg-white">
                <div className="bg-teal-50/70 border-b border-teal-200/80 p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Wrench className="h-4 w-4 text-teal-700" />
                    <span className="font-bold text-slate-900 text-xs uppercase tracking-wide">
                      Equipamento Intervencionado
                    </span>
                  </div>
                  {equipmentTag && (
                    <span className="font-mono text-[10px] bg-white px-2 py-0.5 rounded border border-teal-300 text-teal-800 font-bold">
                      TAG: {equipmentTag}
                    </span>
                  )}
                </div>

                <div className="p-4 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-50/80 p-3 rounded-lg border border-slate-100">
                    <div>
                      <span className="text-slate-500 text-[10px] uppercase font-semibold block">
                        Modelo do Equipamento
                      </span>
                      <strong className="text-slate-900 text-xs">
                        {equipmentModel || 'Trocador de Calor BERMO'}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] uppercase font-semibold block">
                        Fabricante de Origem
                      </span>
                      <span className="text-slate-800 font-medium">
                        {serviceOrder.equipment_brand || 'BERMO / Fabricação Oficial'}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-700 block">
                      Status Atual do Trocador no Início dos Serviços
                    </span>
                    <p className="text-slate-800 whitespace-pre-wrap leading-relaxed text-[11px] bg-slate-50 p-3 rounded-lg border border-slate-100">
                      {exchangerCurrentStatus ||
                        'Equipamento inspecionado e liberado pela equipe de segurança para abertura/intervenção.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Tabela de Insumos Utilizados */}
              <div className="report-print-card space-y-2">
                <div className="flex items-center justify-between border-b border-teal-700 pb-1.5">
                  <h3 className="font-bold text-slate-900 uppercase tracking-wider text-xs flex items-center gap-1.5">
                    <Package className="h-4 w-4 text-teal-700" />
                    Insumos Internos Utilizados para a Execução ({materials.length})
                  </h3>
                  <span className="text-[10px] text-muted-foreground">
                    Controle interno de estoque e aplicação
                  </span>
                </div>

                <table className="w-full text-left text-xs border border-slate-200 rounded-lg overflow-hidden">
                  <thead className="bg-slate-50 text-slate-700 uppercase text-[10px] font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-2.5 w-12 text-center">Item</th>
                      <th className="p-2.5">Descrição do Insumo / Material</th>
                      <th className="p-2.5 text-center w-24">Quantidade</th>
                      <th className="p-2.5 text-center w-20">Unidade</th>
                      <th className="p-2.5">Observações / Destinação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {materials.map((mat, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="p-2.5 text-center font-mono text-[11px] text-slate-500">
                          {idx + 1}
                        </td>
                        <td className="p-2.5 font-medium text-slate-900">
                          {mat.description || '—'}
                        </td>
                        <td className="p-2.5 text-center font-mono font-bold text-slate-800">
                          {mat.quantity}
                        </td>
                        <td className="p-2.5 text-center text-slate-600">{mat.unit || 'un'}</td>
                        <td className="p-2.5 text-slate-600 text-[11px]">{mat.notes || '—'}</td>
                      </tr>
                    ))}
                    {materials.length === 0 && (
                      <tr>
                        <td colSpan={5} className="p-4 text-center text-slate-500 italic">
                          Nenhum insumo específico registrado.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Observações Gerais */}
              {observations && (
                <div className="report-print-card space-y-1.5 border border-slate-200 rounded-xl p-4 bg-white">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5 text-teal-700" />
                    Observações Técnicas de Campo
                  </span>
                  <p className="text-slate-800 whitespace-pre-wrap leading-relaxed text-[11px]">
                    {observations}
                  </p>
                </div>
              )}

              {/* Assinaturas Técnicas */}
              <div className="report-print-card pt-8 mt-6 border-t border-slate-200 grid grid-cols-2 gap-8 text-center text-xs">
                <div className="space-y-2">
                  <div className="border-b border-slate-400 pb-1 h-12 flex items-end justify-center">
                    <span className="font-semibold text-slate-800">{technicianName}</span>
                  </div>
                  <span className="text-[10px] uppercase font-bold text-slate-600 block">
                    Técnico Responsável INTERTERMAL / BERMO
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="border-b border-slate-400 pb-1 h-12 flex items-end justify-center">
                    <span className="font-semibold text-slate-800">
                      {serviceOrder.client_name || 'Responsável da Fábrica'}
                    </span>
                  </div>
                  <span className="text-[10px] uppercase font-bold text-slate-600 block">
                    Acompanhamento / Validação do Cliente
                  </span>
                </div>
              </div>

              {/* Rodapé Institucional */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-[9px] text-slate-500">
                <span>INTERTERMAL Soluções Térmicas Industriais • Registro de Campo Oficial</span>
                <span className="font-mono">
                  OS #{orderNum} • {new Date().toLocaleTimeString('pt-BR')}
                </span>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
