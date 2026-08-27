import React, { useRef, useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { QuoteRecord } from '@/types/crm'
import {
  Printer,
  FileDown,
  Wrench,
  Flame,
  CheckCircle2,
  Calendar,
  Building2,
  MapPin,
  Clock,
  ShieldCheck,
  User,
  Info,
  SlidersHorizontal,
  Eye,
  Truck,
  Hotel,
  Percent,
  Calculator,
  Layers,
  AlertTriangle,
} from 'lucide-react'
import { PROPOSAL_INCLUSIONS_TEXT } from '@/data/bermo-catalog'

interface QuotePdfPreviewDialogProps {
  quote: QuoteRecord | null
  open: boolean
  onOpenChange: (open: boolean) => void
  viewMode?: 'client' | 'internal'
}

export function QuotePdfPreviewDialog({
  quote,
  open,
  onOpenChange,
  viewMode = 'client',
}: QuotePdfPreviewDialogProps) {
  const printRef = useRef<HTMLDivElement>(null)
  const [currentViewMode, setCurrentViewMode] = useState<'client' | 'internal'>(viewMode)

  // Sincroniza com a prop viewMode quando o modal abre ou a prop muda
  useEffect(() => {
    if (open) {
      setCurrentViewMode(viewMode || 'client')
    }
  }, [open, viewMode])

  if (!quote) return null

  const handlePrint = () => {
    window.print()
  }

  // Identificação do primeiro item com especificações
  const mainItem = quote.items && quote.items.length > 0 ? quote.items[0] : null
  const specs =
    quote.service_details?.service_technical_specs ||
    quote.service_details?.technical_scope ||
    mainItem?.bermo_specs

  // Determina o fluido de trabalho efetivo
  const rawFluid = specs?.workFluid || specs?.work_fluid || quote.work_fluid || ''
  const customFluid =
    specs?.custom_work_fluid ||
    specs?.customWorkFluid ||
    quote.service_details?.technical_scope?.custom_work_fluid ||
    quote.service_details?.service_technical_specs?.custom_work_fluid ||
    quote.custom_work_fluid ||
    ''
  const effectiveWorkFluid = rawFluid === 'Outro' && customFluid ? customFluid : rawFluid
  const laborDetails = quote.service_details?.labor_costs
  const travelDetails = quote.service_details?.travel_costs
  const lodgingDetails = quote.service_details?.lodging_meals_costs
  const indirectCosts = quote.service_details?.indirect_costs
  const taxes = indirectCosts?.taxes || {}
  const validityDays =
    quote.validity_days || quote.service_details?.payment_and_validity?.validityDays || 10

  // Resolução de Mão de Obra
  const techCount =
    laborDetails?.techMechanical?.count ?? quote.tech_count ?? quote.labor_config?.techCount ?? 1
  const techHours =
    laborDetails?.techMechanical?.hours ?? quote.tech_hours ?? quote.labor_config?.techHours ?? 16
  const techRate =
    laborDetails?.techMechanical?.ratePerHour ??
    quote.tech_rate ??
    quote.labor_config?.techRate ??
    quote.labor_rate_hourly ??
    140
  const techTotal = laborDetails?.techMechanical?.total ?? techCount * techHours * techRate

  const helperCount =
    laborDetails?.helper?.count ?? quote.helper_count ?? quote.labor_config?.helperCount ?? 1
  const helperHours =
    laborDetails?.helper?.hours ?? quote.helper_hours ?? quote.labor_config?.helperHours ?? 16
  const helperRate =
    laborDetails?.helper?.ratePerHour ?? quote.helper_rate ?? quote.labor_config?.helperRate ?? 85
  const helperTotal = laborDetails?.helper?.total ?? helperCount * helperHours * helperRate

  const inspectorCount =
    laborDetails?.inspectorNDT?.count ??
    quote.inspector_count ??
    quote.labor_config?.inspectorCount ??
    1
  const inspectorHours =
    laborDetails?.inspectorNDT?.hours ??
    quote.inspector_hours ??
    quote.labor_config?.inspectorHours ??
    6
  const inspectorRate =
    laborDetails?.inspectorNDT?.ratePerHour ??
    quote.inspector_rate ??
    quote.labor_config?.inspectorRate ??
    190
  const inspectorTotal =
    laborDetails?.inspectorNDT?.total ?? inspectorCount * inspectorHours * inspectorRate

  const totalLabor = laborDetails?.totalLabor ?? techTotal + helperTotal + inspectorTotal

  // Resolução de Deslocamento
  const distanceKm =
    travelDetails?.distanceKm ?? quote.distance_km ?? quote.travel_config?.distanceKm ?? 120
  const isRoundTrip =
    travelDetails?.isRoundTrip ?? quote.is_round_trip ?? quote.travel_config?.isRoundTrip ?? true
  const consumptionKmL =
    travelDetails?.consumptionKmL ??
    quote.travel_config?.consumptionKmL ??
    quote.consumption_km_l ??
    9.5
  const fuelPrice =
    travelDetails?.fuelPrice ?? quote.travel_config?.fuelPrice ?? quote.fuel_price ?? 5.89
  const tollRoadPercent =
    travelDetails?.tollRoadPercent ??
    quote.travel_config?.tollRoadPercent ??
    quote.toll_road_percent ??
    60
  const manualFuelAdj =
    travelDetails?.manualFuelAdj ?? quote.travel_config?.manualFuelAdj ?? quote.manual_fuel_adj ?? 0
  const manualTollAdj =
    travelDetails?.manualTollAdj ?? quote.travel_config?.manualTollAdj ?? quote.manual_toll_adj ?? 0

  const litersFuel = distanceKm / (consumptionKmL || 9.5)
  const baseFuelCost = litersFuel * fuelPrice + manualFuelAdj
  const estimatedTolls = Math.max(1, Math.round((distanceKm / 100) * (tollRoadPercent / 100) * 1.5))
  const baseTollCost = estimatedTolls * 14.5 + manualTollAdj

  const carRentalType =
    travelDetails?.car_rental_type ??
    quote.car_rental_type ??
    quote.travel_config?.car_rental_type ??
    'none'
  const carRentalDailyRate =
    travelDetails?.car_rental_daily_rate ??
    quote.car_rental_daily_rate ??
    quote.travel_config?.car_rental_daily_rate ??
    0
  const carRentalDays =
    travelDetails?.car_rental_days ??
    quote.car_rental_days ??
    quote.travel_config?.car_rental_days ??
    1
  const carRentalTotal =
    carRentalType !== 'none'
      ? (travelDetails?.car_rental_total ??
        quote.car_rental_total ??
        quote.travel_config?.car_rental_total ??
        carRentalDailyRate * carRentalDays)
      : 0

  const calculatedTravelCost = Math.max(0, baseFuelCost + baseTollCost + carRentalTotal)
  const totalTravelCost =
    travelDetails?.totalTravelCost ?? quote.travel_cost ?? calculatedTravelCost

  // Resolução de Hospedagem & Alimentação
  const hotelDays =
    lodgingDetails?.hotelDays ?? quote.hotel_days ?? quote.lodging_meals_config?.hotelDays ?? 2
  const hotelRate =
    lodgingDetails?.hotelRatePerDay ??
    quote.hotel_rate ??
    quote.lodging_meals_config?.hotelRate ??
    220
  const hotelTotal = hotelDays * hotelRate

  const mealsDays =
    lodgingDetails?.mealsDays ?? quote.meals_days ?? quote.lodging_meals_config?.mealsDays ?? 4
  const mealsRate =
    lodgingDetails?.mealsRatePerDay ??
    quote.meals_rate ??
    quote.lodging_meals_config?.mealsRate ??
    95
  const mealsTotal = mealsDays * mealsRate

  const totalLodgingMeals =
    lodgingDetails?.totalLodgingMeals ?? quote.lodging_meals_cost ?? hotelTotal + mealsTotal

  // Peças e materiais
  const materialsCost =
    quote.service_details?.materials_breakdown?.totalMaterials ?? quote.materials_cost ?? 0

  // Outros custos diretos
  const thirdPartyCost = quote.third_party_cost ?? 0
  const otherCosts = quote.other_costs ?? 0

  // Total de Custos Diretos
  const directCostsTotal =
    indirectCosts?.directCostsTotal ??
    quote.total_cost ??
    totalLabor + totalTravelCost + totalLodgingMeals + materialsCost + thirdPartyCost + otherCosts

  // Custos Indiretos, Margens e Tributos
  const serviceMarginPercent =
    indirectCosts?.serviceMarginPercent ??
    quote.service_margin ??
    quote.pricing_config?.serviceMargin ??
    25
  const salesCommissionPercent =
    indirectCosts?.salesCommissionPercent ??
    quote.sales_commission ??
    quote.pricing_config?.salesCommission ??
    6
  const adminCostPercent =
    indirectCosts?.administrativeCostPercent ??
    quote.admin_rate ??
    quote.pricing_config?.adminRate ??
    0

  const pisPercent = taxes.pis ?? quote.pis_rate ?? quote.pricing_config?.pisRate ?? 0.65
  const cofinsPercent = taxes.cofins ?? quote.cofins_rate ?? quote.pricing_config?.cofinsRate ?? 3.0
  const issPercent = taxes.iss ?? quote.iss_rate ?? quote.pricing_config?.issRate ?? 5.0
  const csllPercent = taxes.csll ?? quote.csll_rate ?? quote.pricing_config?.csllRate ?? 2.88
  const irpjPercent = taxes.irpj ?? quote.irpj_rate ?? quote.pricing_config?.irpjRate ?? 4.8
  const irDiffPercent =
    taxes.irDiff ?? quote.ir_diff_rate ?? quote.pricing_config?.irDiffRate ?? 1.5

  const totalTaxesPercent =
    taxes.totalTaxes ??
    pisPercent + cofinsPercent + issPercent + csllPercent + irpjPercent + irDiffPercent

  // Lista unificada de equipamentos da proposta (suporta array q.equipments, service_details ou fallback)
  let quoteEquipmentsList: any[] = []
  if (quote.equipments && Array.isArray(quote.equipments) && quote.equipments.length > 0) {
    quoteEquipmentsList = quote.equipments
  } else if (
    specs?.equipments_list &&
    Array.isArray(specs.equipments_list) &&
    specs.equipments_list.length > 0
  ) {
    quoteEquipmentsList = specs.equipments_list
  } else if (quote.items && quote.items.length > 0) {
    const itemsWithSpecs = quote.items.filter((it) => it.bermo_specs && it.bermo_specs.productModel)
    if (itemsWithSpecs.length > 0) {
      quoteEquipmentsList = itemsWithSpecs.map((it, idx) => ({
        id: it.id || `eq-${idx}`,
        model: it.bermo_specs?.productModel || it.bermo_specs?.productCode || '',
        brand: it.bermo_specs?.productBrand || quote.equipment_brand || 'Alfa Laval / BERMO',
        series: it.bermo_specs?.productSeries || quote.equipment_series || '',
        quantity: Number(it.quantity) || 1,
        plateCount:
          Number(it.bermo_specs?.platesCount) ||
          (quote.plate_count != null ? Number(quote.plate_count) : 45),
        plateMaterial: it.bermo_specs?.plateMaterial || quote.plate_material || 'AISI 316L',
        plateThickness:
          Number(it.bermo_specs?.plateThickness) ||
          (quote.plate_thickness != null ? Number(quote.plate_thickness) : 0.5),
        gasketMaterial: it.bermo_specs?.gasketType || quote.gasket_material || 'EPDM Clip-on',
        connectionSize:
          it.bermo_specs?.pipeMeasurement ||
          it.bermo_specs?.equipmentSize ||
          quote.connection_size ||
          'DN100 (4")',
        pressureTestBar:
          Number(it.bermo_specs?.testPressure) ||
          (quote.pressure_test_bar != null ? Number(quote.pressure_test_bar) : 16),
        workingPressureBar:
          Number(it.bermo_specs?.operatingPressure) ||
          (quote.working_pressure_bar != null ? Number(quote.working_pressure_bar) : 10),
        dimensions:
          it.bermo_specs?.plateDimensions || quote.dimensions_w_h_d || '1450 x 480 x 1120 mm',
        weightKg:
          Number(it.bermo_specs?.weightKg) ||
          (quote.weight_kg != null ? Number(quote.weight_kg) : 480),
      }))
    }
  }

  if (quoteEquipmentsList.length === 0) {
    quoteEquipmentsList = [
      {
        id: 'eq-default',
        model: quote.equipment_model || specs?.productModel || specs?.productCode || '',
        brand: quote.equipment_brand || specs?.productBrand || 'Alfa Laval / BERMO',
        series: quote.equipment_series || specs?.productSeries || '',
        quantity: quote.equipment_quantity ?? 1,
        plateCount:
          quote.plate_count ?? (specs?.platesCount != null ? Number(specs.platesCount) : 45),
        plateMaterial: quote.plate_material || specs?.plateMaterial || 'AISI 316L',
        plateThickness:
          quote.plate_thickness ??
          (specs?.plateThickness != null ? Number(specs.plateThickness) : 0.5),
        gasketMaterial: quote.gasket_material || specs?.gasketType || 'EPDM Clip-on',
        connectionSize:
          quote.connection_size || specs?.equipmentSize || specs?.pipeMeasurement || 'DN100 (4")',
        pressureTestBar:
          quote.pressure_test_bar ??
          (specs?.testPressure != null ? Number(specs.testPressure) : 16),
        workingPressureBar:
          quote.working_pressure_bar ??
          (specs?.operatingPressure != null ? Number(specs.operatingPressure) : 10),
        dimensions: quote.dimensions_w_h_d || specs?.dimensions || '1450 x 480 x 1120 mm',
        weightKg: quote.weight_kg ?? (specs?.weightKg != null ? Number(specs.weightKg) : 480),
      },
    ]
  }

  const totalEquipmentUnits = quoteEquipmentsList.reduce(
    (acc, eq) => acc + (Number(eq.quantity) || 1),
    0,
  )

  const equipmentQuantity = totalEquipmentUnits || quote.equipment_quantity || 1
  const finalSalePrice = quote.total ?? quote.final_price ?? indirectCosts?.finalSalePrice ?? 0

  const adminCostAmount =
    indirectCosts?.adminCostAmount ??
    quote.admin_cost ??
    directCostsTotal * (adminCostPercent / 100)

  const marginAmount = finalSalePrice * (serviceMarginPercent / 100)
  const commissionAmount = finalSalePrice * (salesCommissionPercent / 100)
  const taxesAmount = finalSalePrice * (totalTaxesPercent / 100)
  const totalIndirectMarkupSum =
    indirectCosts?.totalIndirectMarkupSum ??
    marginAmount + commissionAmount + taxesAmount + adminCostAmount

  const isInternal = currentViewMode === 'internal'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto p-0 print:p-0 print:max-w-none print:shadow-none">
        {/* Ações Superiores (não impressas) */}
        <DialogHeader className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-row items-center justify-between sticky top-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs z-10 print:hidden">
          <div className="flex items-center gap-2">
            <div
              className={`p-2 rounded-lg ${
                isInternal
                  ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300'
                  : 'bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300'
              }`}
            >
              {isInternal ? (
                <SlidersHorizontal className="h-5 w-5" />
              ) : (
                <Flame className="h-5 w-5" />
              )}
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span>Visualização de Impressão / PDF</span>
                <Badge
                  variant="outline"
                  className={
                    isInternal
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200 border-amber-300 font-bold text-[10px]'
                      : 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-200 border-teal-300 font-bold text-[10px]'
                  }
                >
                  {isInternal ? 'Composição Interna' : 'Visão Cliente'}
                </Badge>
              </DialogTitle>
              <p className="text-xs text-muted-foreground">
                {isInternal
                  ? 'Documento gerencial detalhado com abertura completa de custos diretos, indiretos e tributos'
                  : 'Documento formatado para apresentação direta ao cliente (apenas valor final)'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Toggle Visão Cliente / Composição Interna */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 mr-1">
              <Button
                type="button"
                variant={currentViewMode === 'client' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setCurrentViewMode('client')}
                className={`h-7 px-2.5 text-xs font-semibold ${
                  currentViewMode === 'client'
                    ? 'bg-teal-700 hover:bg-teal-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                }`}
              >
                <Eye className="h-3.5 w-3.5 mr-1" />
                Visão Cliente
              </Button>
              <Button
                type="button"
                variant={currentViewMode === 'internal' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setCurrentViewMode('internal')}
                className={`h-7 px-2.5 text-xs font-semibold ${
                  currentViewMode === 'internal'
                    ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                }`}
              >
                <SlidersHorizontal className="h-3.5 w-3.5 mr-1" />
                Composição Interna
              </Button>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="text-xs h-8 font-semibold border-slate-300 dark:border-slate-700"
            >
              <Printer className="h-3.5 w-3.5 mr-1.5 text-teal-600" />
              Imprimir / PDF
            </Button>
            <Button
              size="sm"
              onClick={handlePrint}
              className={`text-xs h-8 font-semibold text-white ${
                isInternal ? 'bg-amber-700 hover:bg-amber-600' : 'bg-teal-700 hover:bg-teal-600'
              }`}
            >
              <FileDown className="h-3.5 w-3.5 mr-1.5" />
              Exportar
            </Button>
          </div>
        </DialogHeader>

        {/* ÁREA DO DOCUMENTO FORMATADO (A4 STYLE) */}
        <div
          id="quote-printable-document"
          ref={printRef}
          className="relative p-8 sm:p-12 space-y-6 text-slate-900 bg-white font-sans text-xs leading-relaxed print:p-0 print:text-[11px] overflow-hidden"
        >
          {/* Marca d'água discreta para Composição Interna */}
          {isInternal && (
            <div className="pointer-events-none select-none absolute inset-0 flex items-center justify-center opacity-[0.04] z-0">
              <div className="text-6xl sm:text-8xl font-black tracking-widest text-slate-900 rotate-[-30deg] text-center uppercase">
                USO GERENCIAL
                <br />
                INTERNO
              </div>
            </div>
          )}

          {/* Banner de Identificação Interna (quando no modo internal) */}
          {isInternal && (
            <div className="bg-amber-50 border-2 border-dashed border-amber-300 rounded-lg p-2.5 flex items-center justify-between text-amber-900">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                <span className="font-bold text-[11px] uppercase tracking-wide">
                  DOCUMENTO INTERNO — RELATÓRIO DE COMPOSIÇÃO DE CUSTOS & ENGENHARIA DE PREÇO
                </span>
              </div>
              <Badge className="bg-amber-600 text-white font-mono text-[10px] uppercase">
                USO RESTRITO
              </Badge>
            </div>
          )}

          {/* Cabeçalho Corporativo Intertermal / BERMO */}
          <div
            className={`border-b-2 pb-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ${
              isInternal ? 'border-amber-600' : 'border-teal-700'
            }`}
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span
                  className={`font-extrabold text-2xl tracking-tighter ${
                    isInternal ? 'text-amber-950' : 'text-teal-900'
                  }`}
                >
                  INTERTERMAL
                </span>
                <span
                  className={`text-xs px-2 py-0.5 rounded font-bold tracking-wider uppercase ${
                    isInternal ? 'bg-amber-100 text-amber-900' : 'bg-teal-100 text-teal-800'
                  }`}
                >
                  {isInternal ? 'Engenharia de Custos' : 'Engenharia Térmica'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                Assistência Técnica Autorizada & Especialista em Trocadores de Calor e Válvulas
                BERMO
              </p>
              <p className="text-[10px] text-slate-400 leading-relaxed">
                <a
                  href="https://www.google.com/maps/search/?api=1&query=Rua+Ananias+Pires+do+Amaral,+98+-+Sorocaba+-+SP"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline hover:text-teal-700 transition-colors"
                >
                  Rua Ananias Pires do Amaral, 98 - Sorocaba - SP - CEP 18016-456 - Jd Gonçalves
                </a>
                <br />
                Fone: (11) 99407-7786 / (15) 3228-3956 • E-mail: alex.nogueira@intertermal.com.br •
                Site: www.interproject.com.br
              </p>
            </div>

            <div
              className={`text-right sm:text-right space-y-1 p-3 rounded-lg border ${
                isInternal ? 'bg-amber-50/60 border-amber-200' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block">
                {isInternal ? 'Memória de Cálculo Interna' : 'Proposta Comercial de Serviços'}
              </span>
              <div
                className={`font-mono text-base font-black ${
                  isInternal ? 'text-amber-900' : 'text-teal-800'
                }`}
              >
                {quote.quote_number || quote.code}
              </div>
              <div className="text-[11px] text-slate-600 flex items-center gap-1 justify-end">
                <Calendar className="h-3 w-3 text-slate-400" />
                Data: {new Date(quote.created || Date.now()).toLocaleDateString('pt-BR')}
              </div>
              <div
                className={`text-[11px] font-semibold ${
                  isInternal ? 'text-amber-700' : 'text-teal-700'
                }`}
              >
                Validade: {validityDays} dias úteis
              </div>
            </div>
          </div>

          {/* Dados do Cliente e Responsável Técnico */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="space-y-1">
              <span
                className={`text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${
                  isInternal ? 'text-amber-800' : 'text-teal-800'
                }`}
              >
                <Building2 className="h-3 w-3" />
                Dados do Cliente
              </span>
              <div className="font-bold text-sm text-slate-900">
                {quote.client_name || 'Empresa Cliente'}
              </div>
              {travelDetails?.destinationAddress && (
                <div className="text-slate-600 flex items-start gap-1 text-[11px]">
                  <MapPin className="h-3 w-3 text-slate-400 shrink-0 mt-0.5" />
                  <span>Planta/Local: {travelDetails.destinationAddress}</span>
                </div>
              )}
              {quote.client_document && (
                <div className="text-[10.5px] text-slate-500 font-mono">
                  CNPJ/CPF: {quote.client_document}
                </div>
              )}
            </div>

            <div className="space-y-1 sm:text-right">
              <span
                className={`text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 sm:justify-end ${
                  isInternal ? 'text-amber-800' : 'text-teal-800'
                }`}
              >
                <User className="h-3 w-3" />
                {quote.assigned_to &&
                (quote.assigned_to.includes(',') || quote.assigned_to.includes(';'))
                  ? 'Responsáveis Técnicos / Comerciais'
                  : 'Responsável Técnico Intertermal'}
              </span>
              <div className="font-semibold text-slate-800">
                {quote.assigned_to || 'Alex Nogueira'}
              </div>
              <div className="text-[11px] text-slate-500">
                Departamento de Engenharia e Manutenção de Campo
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* SEÇÕES EXCLUSIVAS DA COMPOSIÇÃO INTERNA (viewMode === 'internal')        */}
          {/* ========================================================================= */}
          {isInternal && (
            <div className="space-y-6">
              {/* Seção Interna A: Mão de Obra Especializada */}
              <div className="space-y-2">
                <div className="flex items-center justify-between border-b border-amber-300 pb-1">
                  <h3 className="font-bold text-slate-900 uppercase tracking-wider text-xs flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5 text-amber-700" />
                    Composição de Mão de Obra Especializada
                  </h3>
                  <Badge
                    variant="outline"
                    className="text-[10px] font-mono border-amber-300 text-amber-800"
                  >
                    Subtotal Mão de Obra:{' '}
                    {totalLabor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </Badge>
                </div>

                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-amber-50/70 text-slate-700 uppercase text-[10px] font-bold border-b border-slate-200">
                      <tr>
                        <th className="p-2.5">Função Especializada</th>
                        <th className="p-2.5 text-center w-20">Quantidade</th>
                        <th className="p-2.5 text-center w-20">Horas</th>
                        <th className="p-2.5 text-right w-28">Valor / Hora</th>
                        <th className="p-2.5 text-right w-28">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      <tr className="hover:bg-slate-50/50">
                        <td className="p-2.5 font-medium text-slate-900">
                          Técnico Mecânico de Campo
                        </td>
                        <td className="p-2.5 text-center font-mono">{techCount} un</td>
                        <td className="p-2.5 text-center font-mono">{techHours}h</td>
                        <td className="p-2.5 text-right font-mono text-slate-700">
                          {techRate.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          /h
                        </td>
                        <td className="p-2.5 text-right font-mono font-bold text-slate-900">
                          {techTotal.toLocaleString('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          })}
                        </td>
                      </tr>
                      <tr className="hover:bg-slate-50/50">
                        <td className="p-2.5 font-medium text-slate-900">
                          Ajudante / Auxiliar Técnico
                        </td>
                        <td className="p-2.5 text-center font-mono">{helperCount} un</td>
                        <td className="p-2.5 text-center font-mono">{helperHours}h</td>
                        <td className="p-2.5 text-right font-mono text-slate-700">
                          {helperRate.toLocaleString('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          })}
                          /h
                        </td>
                        <td className="p-2.5 text-right font-mono font-bold text-slate-900">
                          {helperTotal.toLocaleString('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          })}
                        </td>
                      </tr>
                      <tr className="hover:bg-slate-50/50">
                        <td className="p-2.5 font-medium text-slate-900">
                          Inspetor de Qualidade / END / Solda
                        </td>
                        <td className="p-2.5 text-center font-mono">{inspectorCount} un</td>
                        <td className="p-2.5 text-center font-mono">{inspectorHours}h</td>
                        <td className="p-2.5 text-right font-mono text-slate-700">
                          {inspectorRate.toLocaleString('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          })}
                          /h
                        </td>
                        <td className="p-2.5 text-right font-mono font-bold text-slate-900">
                          {inspectorTotal.toLocaleString('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          })}
                        </td>
                      </tr>
                    </tbody>
                    <tfoot className="bg-slate-50 font-bold border-t border-slate-200">
                      <tr>
                        <td colSpan={4} className="p-2.5 text-right text-slate-700">
                          Soma Mão de Obra:
                        </td>
                        <td className="p-2.5 text-right font-mono text-amber-900">
                          {totalLabor.toLocaleString('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          })}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Seção Interna B: Deslocamento & Rotas */}
              <div className="space-y-2">
                <div className="flex items-center justify-between border-b border-amber-300 pb-1">
                  <h3 className="font-bold text-slate-900 uppercase tracking-wider text-xs flex items-center gap-1.5">
                    <Truck className="h-3.5 w-3.5 text-amber-700" />
                    Composição de Deslocamento & Logística (ViaCEP / Mapeia)
                  </h3>
                  <Badge
                    variant="outline"
                    className="text-[10px] font-mono border-amber-300 text-amber-800"
                  >
                    Subtotal Deslocamento:{' '}
                    {totalTravelCost.toLocaleString('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    })}
                  </Badge>
                </div>

                <div
                  className={`grid grid-cols-1 ${carRentalType !== 'none' ? 'sm:grid-cols-5' : 'sm:grid-cols-4'} gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200 text-[11px]`}
                >
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">
                      Distância / Rota
                    </span>
                    <div className="font-bold text-slate-900 font-mono">
                      {distanceKm} km {isRoundTrip ? '(Ida + Volta)' : '(Só Ida)'}
                    </div>
                    <div className="text-[10px] text-slate-500">Consumo: {consumptionKmL} km/L</div>
                  </div>

                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">
                      Combustível
                    </span>
                    <div className="font-bold text-slate-900 font-mono">
                      {baseFuelCost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      {litersFuel.toFixed(1)} L a R$ {fuelPrice.toFixed(2)}/L
                    </div>
                  </div>

                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">
                      Pedágios Estimados
                    </span>
                    <div className="font-bold text-slate-900 font-mono">
                      {baseTollCost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      ~{estimatedTolls} praças ({tollRoadPercent}% rodovia pedagiada)
                    </div>
                  </div>

                  {carRentalType !== 'none' && (
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-bold text-slate-500 uppercase block">
                        Aluguel de Carro
                      </span>
                      <div className="font-bold text-slate-900 font-mono">
                        {carRentalTotal.toLocaleString('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        })}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {carRentalDays} diária(s) ×{' '}
                        {carRentalDailyRate.toLocaleString('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        })}
                      </div>
                    </div>
                  )}

                  <div className="space-y-0.5 bg-amber-50/80 p-2 rounded border border-amber-200">
                    <span className="text-[10px] font-bold text-amber-900 uppercase block">
                      Total Deslocamento
                    </span>
                    <div className="font-bold text-amber-900 font-mono text-sm">
                      {totalTravelCost.toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      })}
                    </div>
                    <div className="text-[9.5px] text-amber-700">
                      {carRentalType !== 'none'
                        ? 'Combustível + Pedágios + Carro'
                        : 'Combustível + Pedágios'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Seção Interna C: Hospedagem & Alimentação */}
              <div className="space-y-2">
                <div className="flex items-center justify-between border-b border-amber-300 pb-1">
                  <h3 className="font-bold text-slate-900 uppercase tracking-wider text-xs flex items-center gap-1.5">
                    <Hotel className="h-3.5 w-3.5 text-amber-700" />
                    Composição de Hospedagem & Alimentação
                  </h3>
                  <Badge
                    variant="outline"
                    className="text-[10px] font-mono border-amber-300 text-amber-800"
                  >
                    Subtotal Estadia:{' '}
                    {totalLodgingMeals.toLocaleString('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    })}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200 text-[11px]">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">
                      Diárias de Hotel
                    </span>
                    <div className="font-bold text-slate-900 font-mono">
                      {hotelDays} diárias ×{' '}
                      {hotelRate.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </div>
                    <div className="text-[10px] text-slate-600 font-mono">
                      Total:{' '}
                      {hotelTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </div>
                  </div>

                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">
                      Refeições / Alimentação
                    </span>
                    <div className="font-bold text-slate-900 font-mono">
                      {mealsDays} refeições ×{' '}
                      {mealsRate.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </div>
                    <div className="text-[10px] text-slate-600 font-mono">
                      Total:{' '}
                      {mealsTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </div>
                  </div>

                  <div className="space-y-0.5 bg-amber-50/80 p-2 rounded border border-amber-200">
                    <span className="text-[10px] font-bold text-amber-900 uppercase block">
                      Total Hospedagem & Refeições
                    </span>
                    <div className="font-bold text-amber-900 font-mono text-sm">
                      {totalLodgingMeals.toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      })}
                    </div>
                    <div className="text-[9.5px] text-amber-700">
                      Diárias de Hotel + Alimentação
                    </div>
                  </div>
                </div>
              </div>

              {/* Seção Interna D: Custos Indiretos, Margem & Tributos */}
              <div className="space-y-2">
                <div className="flex items-center justify-between border-b border-amber-300 pb-1">
                  <h3 className="font-bold text-slate-900 uppercase tracking-wider text-xs flex items-center gap-1.5">
                    <Percent className="h-3.5 w-3.5 text-amber-700" />
                    Custos Indiretos, Margens e Tributos Fiscais
                  </h3>
                  <Badge
                    variant="outline"
                    className="text-[10px] font-mono border-amber-300 text-amber-800"
                  >
                    Markup Indireto:{' '}
                    {totalIndirectMarkupSum.toLocaleString('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    })}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-[11px]">
                  <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 space-y-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">
                      Margem de Serviço
                    </span>
                    <div className="font-mono font-bold text-emerald-700 text-sm">
                      {serviceMarginPercent}%
                    </div>
                    <div className="text-[10px] text-slate-600 font-mono">
                      {marginAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 space-y-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">
                      Comissão de Vendas
                    </span>
                    <div className="font-mono font-bold text-blue-700 text-sm">
                      {salesCommissionPercent}%
                    </div>
                    <div className="text-[10px] text-slate-600 font-mono">
                      {commissionAmount.toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      })}
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 space-y-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">
                      Administração / Overhead
                    </span>
                    <div className="font-mono font-bold text-purple-700 text-sm">
                      {adminCostPercent}%
                    </div>
                    <div className="text-[10px] text-slate-600 font-mono">
                      {adminCostAmount.toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      })}
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 space-y-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">
                      Carga Tributária Total
                    </span>
                    <div className="font-mono font-bold text-rose-700 text-sm">
                      {totalTaxesPercent.toFixed(2)}%
                    </div>
                    <div className="text-[10px] text-slate-600 font-mono">
                      {taxesAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </div>
                  </div>
                </div>

                {/* Indicação de Quantidade de Equipamentos na Composição Interna */}
                {equipmentQuantity > 1 && (
                  <div className="p-2.5 bg-amber-100/60 rounded-lg border border-amber-300 text-[11px] text-amber-900 font-medium flex items-center justify-between">
                    <span>
                      Escopo com <strong>{equipmentQuantity} unidades</strong> de equipamentos.
                    </span>
                    <span className="font-mono text-[10px] text-amber-800">
                      Custo unitário por equipamento:{' '}
                      {(directCostsTotal / equipmentQuantity).toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      })}
                    </span>
                  </div>
                )}

                {/* Detalhamento dos Impostos */}
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 block mb-2">
                    Abertura de Alíquotas Fiscais Aplicadas sobre a Receita Bruta:
                  </span>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-[10.5px] font-mono text-center">
                    <div className="p-1.5 bg-white rounded border border-slate-200">
                      <span className="text-[9.5px] text-slate-500 block font-sans">PIS</span>
                      <strong>{pisPercent}%</strong>
                    </div>
                    <div className="p-1.5 bg-white rounded border border-slate-200">
                      <span className="text-[9.5px] text-slate-500 block font-sans">COFINS</span>
                      <strong>{cofinsPercent}%</strong>
                    </div>
                    <div className="p-1.5 bg-white rounded border border-slate-200">
                      <span className="text-[9.5px] text-slate-500 block font-sans">ISS</span>
                      <strong>{issPercent}%</strong>
                    </div>
                    <div className="p-1.5 bg-white rounded border border-slate-200">
                      <span className="text-[9.5px] text-slate-500 block font-sans">CSLL</span>
                      <strong>{csllPercent}%</strong>
                    </div>
                    <div className="p-1.5 bg-white rounded border border-slate-200">
                      <span className="text-[9.5px] text-slate-500 block font-sans">IRPJ</span>
                      <strong>{irpjPercent}%</strong>
                    </div>
                    <div className="p-1.5 bg-white rounded border border-slate-200">
                      <span className="text-[9.5px] text-slate-500 block font-sans">IR Dif</span>
                      <strong>{irDiffPercent}%</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Seção Interna E: Consolidação Geral dos Custos Diretos vs Indiretos vs Preço Final */}
              <div className="p-4 rounded-xl bg-amber-50/80 border-2 border-amber-300 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold uppercase tracking-wider text-xs text-amber-950 flex items-center gap-1.5">
                    <Calculator className="h-4 w-4 text-amber-700" />
                    Consolidação Financeira da Proposta (Formação de Preço Divisor)
                  </span>
                  <Badge className="bg-amber-700 text-white font-mono text-[10px]">
                    RESUMO GERENCIAL
                  </Badge>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="bg-white p-2.5 rounded-lg border border-amber-200 space-y-0.5">
                    <span className="text-[10px] text-slate-500 uppercase font-semibold block">
                      Custos Diretos Totais
                    </span>
                    <div className="font-mono font-bold text-slate-900 text-sm">
                      {directCostsTotal.toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      })}
                    </div>
                    <div className="text-[9.5px] text-slate-500">
                      Mão de obra + Logística + Hotel
                    </div>
                  </div>

                  <div className="bg-white p-2.5 rounded-lg border border-amber-200 space-y-0.5">
                    <span className="text-[10px] text-slate-500 uppercase font-semibold block">
                      Custos Indiretos & Adm
                    </span>
                    <div className="font-mono font-bold text-purple-800 text-sm">
                      {adminCostAmount.toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      })}
                    </div>
                    <div className="text-[9.5px] text-slate-500">Overhead operacional</div>
                  </div>

                  <div className="bg-white p-2.5 rounded-lg border border-amber-200 space-y-0.5">
                    <span className="text-[10px] text-slate-500 uppercase font-semibold block">
                      Margem + Comis + Impostos
                    </span>
                    <div className="font-mono font-bold text-amber-800 text-sm">
                      {totalIndirectMarkupSum.toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      })}
                    </div>
                    <div className="text-[9.5px] text-slate-500">Markup divisor aplicado</div>
                  </div>

                  <div className="bg-amber-900 text-white p-2.5 rounded-lg space-y-0.5">
                    <span className="text-[10px] text-amber-200 uppercase font-bold block">
                      Preço Final Homologado
                    </span>
                    <div className="font-mono font-black text-white text-base">
                      {finalSalePrice.toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      })}
                    </div>
                    <div className="text-[9.5px] text-amber-300">Valor de Venda ao Cliente</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* SEÇÕES GERAIS DA PROPOSTA (ESCOPO, METODOLOGIA, CONDIÇÕES, INCLUSÕES)    */}
          {/* ========================================================================= */}

          {/* Seção: Escopo de Fornecimento & Serviços BERMO */}
          <div className="space-y-3">
            <div
              className={`flex items-center justify-between border-b pb-1 ${
                isInternal ? 'border-amber-300' : 'border-slate-200'
              }`}
            >
              <h3 className="font-bold text-slate-900 uppercase tracking-wider text-xs flex items-center gap-1.5">
                <Wrench
                  className={`h-3.5 w-3.5 ${isInternal ? 'text-amber-700' : 'text-teal-700'}`}
                />
                {isInternal
                  ? '1. Escopo de Serviços & Detalhes Técnicos'
                  : '1. Escopo de Serviços e Equipamentos'}
              </h3>
              <span className="text-[10px] text-slate-500 font-semibold">
                {quoteEquipmentsList.length}{' '}
                {quoteEquipmentsList.length === 1 ? 'equipamento' : 'equipamentos'} (
                {totalEquipmentUnits} {totalEquipmentUnits === 1 ? 'unidade' : 'unidades'})
              </span>
            </div>

            {/* LISTAGEM DE ESPECIFICAÇÕES TÉCNICAS DE CADA EQUIPAMENTO */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                Equipamentos Contemplados na Proposta Técnica (Especificações):
              </span>
              <div className="grid grid-cols-1 gap-2.5">
                {quoteEquipmentsList.map((eq, idx) => (
                  <div
                    key={eq.id || idx}
                    className={`p-3 rounded-lg border text-xs space-y-2 ${
                      isInternal
                        ? 'bg-amber-50/50 border-amber-200'
                        : 'bg-teal-50/50 border-teal-100'
                    }`}
                  >
                    <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-800/60 pb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-[11.5px]">
                          Item {idx + 1}: {eq.brand || 'BERMO'} {eq.model || 'Trocador de Calor'}
                        </span>
                        {Number(eq.quantity) > 1 && (
                          <Badge
                            variant="secondary"
                            className="text-[9px] px-1.5 py-0 bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300 font-mono"
                          >
                            {eq.quantity} unidades
                          </Badge>
                        )}
                      </div>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        {eq.series || 'Placas Desmontáveis'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-1 text-[10.5px] font-mono">
                      <div>
                        <span className="text-slate-500 font-sans text-[9.5px] block">
                          Modelo / Fabricante
                        </span>
                        <strong className="text-slate-900">{eq.model || 'N/A'}</strong> (
                        {eq.brand || 'BERMO'})
                      </div>
                      <div>
                        <span className="text-slate-500 font-sans text-[9.5px] block">
                          Nº de Placas
                        </span>
                        <strong className="text-slate-900">{eq.plateCount ?? 'N/A'}</strong> (
                        {eq.plateMaterial || 'AISI 316L'})
                      </div>
                      <div>
                        <span className="text-slate-500 font-sans text-[9.5px] block">
                          Espessura Placas
                        </span>
                        <strong className="text-slate-900">{eq.plateThickness ?? '0.5'} mm</strong>
                      </div>
                      <div>
                        <span className="text-slate-500 font-sans text-[9.5px] block">Gaxetas</span>
                        <strong className="text-slate-900">
                          {eq.gasketMaterial || 'EPDM Clip-on'}
                        </strong>
                      </div>
                      <div>
                        <span className="text-slate-500 font-sans text-[9.5px] block">
                          Conexão / Bitola
                        </span>
                        <strong className="text-slate-900">
                          {eq.connectionSize || 'DN100 (4")'}
                        </strong>
                      </div>
                      <div>
                        <span className="text-slate-500 font-sans text-[9.5px] block">
                          Pressão Trab. / Teste
                        </span>
                        <strong className="text-slate-900">
                          {eq.workingPressureBar ?? 10} bar / {eq.pressureTestBar ?? 16} bar
                        </strong>
                      </div>
                      <div>
                        <span className="text-slate-500 font-sans text-[9.5px] block">
                          Dimensões (L x A x P)
                        </span>
                        <strong className="text-slate-900">
                          {eq.dimensions || '1450 x 480 x 1120 mm'}
                        </strong>
                      </div>
                      <div>
                        <span className="text-slate-500 font-sans text-[9.5px] block">
                          Peso Estimado
                        </span>
                        <strong className="text-slate-900">{eq.weightKg ?? 480} kg</strong>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ESCOPO GLOBAL E FLUIDO */}
            {(quote.scope_of_work || specs?.scopeOfWork || effectiveWorkFluid) && (
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 block">
                  Escopo Detalhado dos Serviços de Manutenção & Parâmetros Operacionais:
                </span>
                <p className="text-[11px] text-slate-700 whitespace-pre-line leading-relaxed">
                  {quote.scope_of_work ||
                    specs?.scopeOfWork ||
                    'Manutenção preventiva e corretiva com desmontagem, limpeza química, inspeção por líquido penetrante, teste hidrostático e montagem.'}
                </p>
                {effectiveWorkFluid && (
                  <div className="text-[10.5px] text-slate-600 font-mono pt-1 border-t border-slate-200">
                    <span className="font-sans font-semibold text-slate-700">
                      Fluido de Trabalho:{' '}
                    </span>
                    {effectiveWorkFluid}
                  </div>
                )}
              </div>
            )}

            {/* TABELA DE VALOR DO SERVIÇO GLOBAL */}
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 uppercase text-[10px] font-bold">
                  <tr>
                    <th className="p-2.5">Descrição do Pacote de Serviços de Engenharia</th>
                    <th className="p-2.5 text-center w-28">Equipamentos</th>
                    <th className="p-2.5 text-right w-36">Total Global</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr className="hover:bg-slate-50/50">
                    <td className="p-2.5 space-y-1">
                      <div className="font-bold text-slate-900 text-xs">
                        {quote.title ||
                          `Serviço Especializado de Manutenção e Engenharia (${quoteEquipmentsList.length} ${quoteEquipmentsList.length === 1 ? 'Equipamento' : 'Equipamentos'})`}
                      </div>
                      <div className="text-[10.5px] text-slate-600">
                        Manutenção técnica completa contemplando os equipamentos listados acima, com
                        mão de obra especializada, testes e relatórios.
                      </div>
                    </td>
                    <td className="p-2.5 text-center font-semibold font-mono text-xs">
                      {totalEquipmentUnits} un
                    </td>
                    <td className="p-2.5 text-right font-mono font-bold text-slate-900 text-sm">
                      {(quote.total ?? quote.final_price ?? finalSalePrice ?? 0).toLocaleString(
                        'pt-BR',
                        {
                          style: 'currency',
                          currency: 'BRL',
                        },
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Seção: Incluso no Valor (CONFORME ESPECIFICAÇÃO INSTITUCIONAL) */}
          <div
            className={`p-3.5 rounded-xl border text-xs text-slate-800 space-y-1.5 ${
              isInternal ? 'bg-amber-50/70 border-amber-200' : 'bg-teal-50/70 border-teal-200'
            }`}
          >
            <div
              className={`flex items-center gap-1.5 font-bold uppercase text-[11px] tracking-wider ${
                isInternal ? 'text-amber-950' : 'text-teal-900'
              }`}
            >
              <CheckCircle2
                className={`h-4 w-4 ${isInternal ? 'text-amber-700' : 'text-teal-700'}`}
              />
              Incluso no valor
            </div>
            <p className="text-[11px] text-slate-700 leading-relaxed text-justify">
              {PROPOSAL_INCLUSIONS_TEXT}
            </p>
          </div>

          {/* Seção: Condições Comerciais & Pagamento */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                Condições Comerciais de Faturamento
              </span>
              <div
                className={`font-bold text-xs ${isInternal ? 'text-amber-900' : 'text-teal-800'}`}
              >
                Condição: {quote.payment_terms || '28 DDL (28 dias do dia líquido)'}
              </div>
              <div className="text-[11px] text-slate-600">
                Faturamento direto contra CNPJ cadastrado após homologação do serviço.
              </div>
            </div>

            <div className="space-y-1.5 text-right sm:text-right">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                Valor Total da Proposta
              </span>
              <div
                className={`text-xl font-black font-mono ${
                  isInternal ? 'text-amber-950' : 'text-teal-900'
                }`}
              >
                {(quote.total ?? quote.final_price ?? finalSalePrice ?? 0).toLocaleString('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                })}
              </div>
              <div className="text-[10px] text-slate-500 font-medium">
                Impostos, mão de obra e deslocamento inclusos
              </div>
            </div>
          </div>

          {/* Observações Gerais */}
          {quote.notes && (
            <div className="p-3 rounded-lg border border-slate-200 text-[11px] text-slate-600 space-y-1">
              <span className="font-bold text-slate-800 block">Observações:</span>
              <p className="whitespace-pre-line leading-relaxed">{quote.notes}</p>
            </div>
          )}

          {/* Assinatura / Aceite da Proposta */}
          <div className="pt-8 border-t border-slate-200 grid grid-cols-2 gap-8 text-center text-[10px] text-slate-600">
            <div className="space-y-6">
              <div className="border-b border-slate-400 mx-8"></div>
              <div>
                <strong className="block text-slate-900 font-bold text-[11px]">
                  Intertermal Serviços
                </strong>
                {quote.assigned_to ? (
                  <div className="space-y-0.5 mt-1">
                    {(quote.assigned_to.includes(',') || quote.assigned_to.includes(';')
                      ? quote.assigned_to
                          .split(/[,;]/)
                          .map((n) => n.trim())
                          .filter(Boolean)
                      : [quote.assigned_to]
                    ).map((resp, idx) => (
                      <span key={idx} className="block text-slate-700 font-medium">
                        {resp}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="block text-slate-700 font-medium mt-1">Alex Nogueira</span>
                )}
                <span className="text-[9.5px] text-slate-400 mt-0.5 block">
                  Depto. de Engenharia e Serviços
                </span>
              </div>
            </div>

            <div className="space-y-6">
              <div className="border-b border-slate-400 mx-8"></div>
              <div>
                <strong className="block text-slate-900 font-bold text-[11px]">
                  {quote.client_name || 'De acordo do Cliente'}
                </strong>
                <span className="text-[9.5px] text-slate-400 mt-0.5 block">
                  Assinatura do Responsável / Carimbo CNPJ
                </span>
              </div>
            </div>
          </div>

          {/* Rodapé Interno quando for Composição Interna */}
          {isInternal && (
            <div className="pt-4 border-t-2 border-dashed border-amber-300 text-center text-[10px] font-bold text-amber-900 tracking-wider uppercase">
              *** DOCUMENTO INTERNO — USO GERENCIAL EXCLUSIVO INTERTERMAL / BERMO — PROIBIDA A
              DIVULGAÇÃO EXTERNA ***
            </div>
          )}
        </div>

        <DialogFooter className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 print:hidden">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="text-xs">
            Fechar Visualização
          </Button>
          <Button
            onClick={handlePrint}
            className={`text-xs text-white ${
              isInternal ? 'bg-amber-700 hover:bg-amber-600' : 'bg-teal-700 hover:bg-teal-600'
            }`}
          >
            <Printer className="h-3.5 w-3.5 mr-1.5" />
            {isInternal ? 'Imprimir Composição Interna' : 'Imprimir Proposta Oficial'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
