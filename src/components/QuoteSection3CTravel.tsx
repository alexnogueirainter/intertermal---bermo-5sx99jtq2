import React from 'react'
import { Truck, ArrowLeftRight, Car, Ticket, Loader2 } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export interface QuoteSection3CTravelProps {
  originCep: string
  originAddress: string
  destinationCep: string
  destinationAddress: string
  distanceKm: number
  isRoundTrip: boolean
  consumptionKmL: number
  fuelPrice: number
  tollRoadPercent: number
  manualFuelAdj: number
  manualTollAdj: number
  baseFuelCost: number
  baseTollCost: number
  estimatedTolls: number
  travelTotal: number
  isCalculatingRoute: boolean
  carRentalType: string
  carRentalDailyRate: number
  carRentalDays: number
  carRentalSubtotal: number
  transitVoucherQty: number
  transitVoucherRate: number
  transitVoucherSubtotal: number
  onOriginCepChange: (val: string) => void
  onOriginAddressChange: (val: string) => void
  onDestinationCepChange: (val: string) => void
  onDestinationAddressChange: (val: string) => void
  onDistanceKmChange: (val: number) => void
  onToggleRoundTrip: (checked: boolean) => void
  onConsumptionKmLChange: (val: number) => void
  onFuelPriceChange: (val: number) => void
  onTollRoadPercentChange: (val: number) => void
  onManualFuelAdjChange: (val: number) => void
  onManualTollAdjChange: (val: number) => void
  onCarRentalTypeChange: (val: string) => void
  onCarRentalDailyRateChange: (val: number) => void
  onCarRentalDaysChange: (val: number) => void
  onTransitVoucherQtyChange: (val: number) => void
  onTransitVoucherRateChange: (val: number) => void
  onRecalculateRouteByCep: (dest?: string, orig?: string) => void
  onRecalculateRouteByCities: (origin: string, destination: string) => void
}

export function QuoteSection3CTravel({
  originCep,
  originAddress,
  destinationCep,
  destinationAddress,
  distanceKm,
  isRoundTrip,
  consumptionKmL,
  fuelPrice,
  tollRoadPercent,
  manualFuelAdj,
  manualTollAdj,
  baseFuelCost,
  baseTollCost,
  estimatedTolls,
  travelTotal,
  isCalculatingRoute,
  carRentalType,
  carRentalDailyRate,
  carRentalDays,
  carRentalSubtotal,
  transitVoucherQty,
  transitVoucherRate,
  transitVoucherSubtotal,
  onOriginCepChange,
  onOriginAddressChange,
  onDestinationCepChange,
  onDestinationAddressChange,
  onDistanceKmChange,
  onToggleRoundTrip,
  onConsumptionKmLChange,
  onFuelPriceChange,
  onTollRoadPercentChange,
  onManualFuelAdjChange,
  onManualTollAdjChange,
  onCarRentalTypeChange,
  onCarRentalDailyRateChange,
  onCarRentalDaysChange,
  onTransitVoucherQtyChange,
  onTransitVoucherRateChange,
  onRecalculateRouteByCep,
  onRecalculateRouteByCities,
}: QuoteSection3CTravelProps) {
  return (
    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Truck className="h-4 w-4 text-emerald-600" />
          <span className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
            3c. Deslocamento & Rotas (Ref. Mapeia / ViaCEP / Haversine)
          </span>
        </div>

        {/* TOGGLE VISUAL IDA E VOLTA (x2) COM ÍCONE ArrowLeftRight E SWITCH */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white dark:bg-slate-950 px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-800">
            <ArrowLeftRight
              className={`h-3.5 w-3.5 ${isRoundTrip ? 'text-emerald-600' : 'text-slate-400'}`}
            />
            <Label
              htmlFor="toggle-round-trip"
              className="text-xs font-semibold cursor-pointer select-none"
            >
              {isRoundTrip ? 'Ida e Volta (×2)' : 'Apenas Ida (×1)'}
            </Label>
            <Switch
              id="toggle-round-trip"
              checked={isRoundTrip}
              onCheckedChange={onToggleRoundTrip}
            />
          </div>

          <span className="text-xs font-bold text-emerald-600 font-mono">
            Subtotal: {travelTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </span>
        </div>
      </div>

      {/* CEPS COM DISPARO AUTOMÁTICO AOS 8 DÍGITOS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-[10px] font-semibold text-slate-700 dark:text-slate-300">
            Origem (CEP e Endereço da Base)
          </Label>
          <div className="flex gap-2">
            <Input
              value={originCep}
              onChange={(e) => {
                const val = e.target.value
                onOriginCepChange(val)
                const clean = val.replace(/\D/g, '')
                if (clean.length === 8) {
                  onRecalculateRouteByCep(destinationCep, val)
                }
              }}
              placeholder="89066-000"
              className="text-xs h-8 w-32 font-mono font-bold"
            />
            <Input
              value={originAddress}
              onChange={(e) => onOriginAddressChange(e.target.value)}
              placeholder="Rua Bernardo Reiter, 500 - Blumenau/SC"
              className="text-xs h-8 flex-1"
            />
          </div>
        </div>

        <div className="space-y-1">
          <Label className="text-[10px] font-semibold text-slate-700 dark:text-slate-300">
            Destino da Fábrica / Cliente (CEP e Cidade)
          </Label>
          <div className="flex gap-2">
            <Input
              value={destinationCep}
              onChange={(e) => {
                const val = e.target.value
                onDestinationCepChange(val)
                const clean = val.replace(/\D/g, '')
                if (clean.length === 8) {
                  onRecalculateRouteByCep(val, originCep)
                }
              }}
              placeholder="Ex: 89801-000"
              className="text-xs h-8 w-32 font-mono font-bold text-teal-700 dark:text-teal-300"
            />
            <Input
              value={destinationAddress}
              onChange={(e) => onDestinationAddressChange(e.target.value)}
              placeholder="Cidade/UF do Cliente"
              className="text-xs h-8 flex-1"
            />
          </div>
        </div>
      </div>

      {/* PARÂMETROS DO MAPEIA / LOGÍSTICA */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <Label className="text-[10px] text-muted-foreground">
              Distância ({isRoundTrip ? 'Ida + Volta km' : 'Apenas Ida km'})
            </Label>
            <Badge
              variant="outline"
              className={`text-[9px] px-1 py-0 ${
                isRoundTrip ? 'text-emerald-700 bg-emerald-50' : 'text-slate-600 bg-slate-50'
              }`}
            >
              {isRoundTrip ? '×2 Ida/Volta' : '×1 Só Ida'}
            </Badge>
          </div>
          <Input
            type="number"
            value={distanceKm}
            onChange={(e) => onDistanceKmChange(Number(e.target.value))}
            className="text-xs h-8 font-bold font-mono text-emerald-800 dark:text-emerald-300"
          />
          <span className="text-[9px] text-muted-foreground block">
            {isRoundTrip
              ? `(Ida: ~${Math.round(distanceKm / 2)} km | Volta: ~${Math.round(distanceKm / 2)} km)`
              : `(Percurso unidirecional: ${distanceKm} km)`}
          </span>
        </div>

        <div className="space-y-1">
          <Label className="text-[10px] text-muted-foreground">Consumo Veículo (km/L)</Label>
          <Input
            type="number"
            value={consumptionKmL}
            onChange={(e) => onConsumptionKmLChange(Number(e.target.value))}
            className="text-xs h-8"
          />
          <span className="text-[9px] text-muted-foreground block">
            Litros: ~{(distanceKm / (consumptionKmL || 9.5)).toFixed(1)} L (
            {isRoundTrip ? 'ida+volta' : 'só ida'})
          </span>
        </div>

        <div className="space-y-1">
          <Label className="text-[10px] text-muted-foreground">Preço Litro Combustível (R$)</Label>
          <Input
            type="number"
            step="0.01"
            value={fuelPrice}
            onChange={(e) => onFuelPriceChange(Number(e.target.value))}
            className="text-xs h-8"
          />
          <span className="text-[9px] text-muted-foreground block">
            Combustível:{' '}
            {baseFuelCost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </span>
        </div>

        <div className="space-y-1">
          <Label className="text-[10px] text-muted-foreground">% Rodovias c/ Pedágio</Label>
          <Input
            type="number"
            value={tollRoadPercent}
            onChange={(e) => onTollRoadPercentChange(Number(e.target.value))}
            className="text-xs h-8"
          />
          <span className="text-[9px] text-muted-foreground block">
            Pedágios ({estimatedTolls} praças):{' '}
            {baseTollCost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </span>
        </div>
      </div>

      {/* Ajustes Manuais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
        <div className="space-y-1">
          <Label className="text-[10px] text-slate-600 dark:text-slate-400">
            Ajuste Manual Combustível (+/- R$)
          </Label>
          <Input
            type="number"
            step="0.01"
            value={manualFuelAdj}
            onChange={(e) => onManualFuelAdjChange(Number(e.target.value))}
            placeholder="0.00"
            className="text-xs h-8 font-mono"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-[10px] text-slate-600 dark:text-slate-400">
            Ajuste Manual Pedágio (+/- R$)
          </Label>
          <Input
            type="number"
            step="0.01"
            value={manualTollAdj}
            onChange={(e) => onManualTollAdjChange(Number(e.target.value))}
            placeholder="0.00"
            className="text-xs h-8 font-mono"
          />
        </div>
      </div>

      {/* CAMPO DE ALUGUEL DE CARRO */}
      <div className="p-3 bg-white dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Car className="h-4 w-4 text-emerald-600" />
            <Label className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
              Aluguel de Veículo / Carro
            </Label>
          </div>
          {carRentalType !== 'none' && (
            <Badge
              variant="outline"
              className="text-[10px] font-mono border-emerald-300 text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40"
            >
              Subtotal Carro:{' '}
              {carRentalSubtotal.toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              })}
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="space-y-1">
            <Label className="text-[10px] text-muted-foreground font-medium">
              Categoria do Veículo
            </Label>
            <Select value={carRentalType} onValueChange={onCarRentalTypeChange}>
              <SelectTrigger className="text-xs h-8">
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sem aluguel</SelectItem>
                <SelectItem value="simple">Carro Simples (R$ 230,00/dia)</SelectItem>
                <SelectItem value="complete">Carro Completo (R$ 350,00/dia)</SelectItem>
                <SelectItem value="custom">Personalizado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {carRentalType !== 'none' && (
            <>
              <div className="space-y-1">
                <Label className="text-[10px] text-muted-foreground font-medium">
                  Valor Diária (R$) {carRentalType !== 'custom' && '(Editável)'}
                </Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={carRentalDailyRate}
                  onChange={(e) => onCarRentalDailyRateChange(Number(e.target.value))}
                  className="text-xs h-8 font-mono font-semibold"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-[10px] text-muted-foreground font-medium">
                  Quantidade de Dias
                </Label>
                <Input
                  type="number"
                  min="1"
                  value={carRentalDays}
                  onChange={(e) => onCarRentalDaysChange(Math.max(1, Number(e.target.value)))}
                  className="text-xs h-8 font-mono font-semibold"
                />
              </div>
            </>
          )}
        </div>

        {carRentalType !== 'none' && (
          <div className="text-[10.5px] text-slate-500 flex justify-between items-center pt-1 border-t border-slate-100 dark:border-slate-800">
            <span>
              Cálculo: {carRentalDays} diária(s) ×{' '}
              {carRentalDailyRate.toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              })}
            </span>
            <span className="font-bold text-slate-900 dark:text-slate-100 font-mono">
              ={' '}
              {carRentalSubtotal.toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              })}
            </span>
          </div>
        )}
      </div>

      {/* CAMPO NOVO: VALE TRANSPORTE */}
      <div className="p-3 bg-white dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Ticket className="h-4 w-4 text-emerald-600" />
            <Label className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
              Vale Transporte
            </Label>
          </div>
          {transitVoucherSubtotal > 0 && (
            <Badge
              variant="outline"
              className="text-[10px] font-mono border-emerald-300 text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40"
            >
              Subtotal V.T.:{' '}
              {transitVoucherSubtotal.toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              })}
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-[10px] text-muted-foreground font-medium">
              Quantidade de Vales
            </Label>
            <Input
              type="number"
              min="0"
              value={transitVoucherQty}
              onChange={(e) => onTransitVoucherQtyChange(Math.max(0, Number(e.target.value)))}
              placeholder="0"
              className="text-xs h-8 font-mono font-semibold"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-[10px] text-muted-foreground font-medium">
              Valor Unitário da Tarifa / Passe (R$)
            </Label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={transitVoucherRate}
              onChange={(e) => onTransitVoucherRateChange(Math.max(0, Number(e.target.value)))}
              placeholder="0.00"
              className="text-xs h-8 font-mono font-semibold"
            />
          </div>
        </div>

        <div className="text-[10.5px] text-slate-500 flex justify-between items-center pt-1 border-t border-slate-100 dark:border-slate-800">
          <span>
            Cálculo: {transitVoucherQty} vale(s) ×{' '}
            {transitVoucherRate.toLocaleString('pt-BR', {
              style: 'currency',
              currency: 'BRL',
            })}
          </span>
          <span className="font-bold text-slate-900 dark:text-slate-100 font-mono">
            ={' '}
            {transitVoucherSubtotal.toLocaleString('pt-BR', {
              style: 'currency',
              currency: 'BRL',
            })}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-muted-foreground">
            * Digite as cidades (ou CEPs) para rota automática via Nominatim/Mapeia.
          </span>
          {isCalculatingRoute && (
            <Badge
              variant="outline"
              className="text-[9px] px-1.5 py-0 text-teal-700 bg-teal-50 border-teal-300 flex items-center gap-1 animate-pulse"
            >
              <Loader2 className="h-2.5 w-2.5 animate-spin" />
              Automático
            </Badge>
          )}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isCalculatingRoute}
          onClick={() => {
            const orig = originAddress.trim()
            const dest = destinationAddress.trim()
            if (orig.length >= 3 && dest.length >= 3) {
              onRecalculateRouteByCities(orig, dest)
            } else {
              onRecalculateRouteByCep()
            }
          }}
          className="text-[11px] h-7 border-emerald-300 text-emerald-700 hover:bg-emerald-50"
        >
          {isCalculatingRoute ? (
            <>
              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              Calculando Rota...
            </>
          ) : (
            'Recalcular Rota Mapeia'
          )}
        </Button>
      </div>
    </div>
  )
}
