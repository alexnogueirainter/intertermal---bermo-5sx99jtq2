import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { ArrowLeftRight, Car, Loader2, Truck } from 'lucide-react'
import type { Dispatch, SetStateAction } from 'react'

interface TravelSectionProps {
  originCep: string
  setOriginCep: Dispatch<SetStateAction<string>>
  originAddress: string
  setOriginAddress: Dispatch<SetStateAction<string>>
  destinationCep: string
  setDestinationCep: Dispatch<SetStateAction<string>>
  destinationAddress: string
  setDestinationAddress: Dispatch<SetStateAction<string>>
  distanceKm: number
  setDistanceKm: Dispatch<SetStateAction<number>>
  isRoundTrip: boolean
  setIsRoundTrip: Dispatch<SetStateAction<boolean>>
  consumptionKmL: number
  setConsumptionKmL: Dispatch<SetStateAction<number>>
  fuelPrice: number
  setFuelPrice: Dispatch<SetStateAction<number>>
  tollRoadPercent: number
  setTollRoadPercent: Dispatch<SetStateAction<number>>
  manualFuelAdj: number
  setManualFuelAdj: Dispatch<SetStateAction<number>>
  manualTollAdj: number
  setManualTollAdj: Dispatch<SetStateAction<number>>
  isCalculatingRoute: boolean
  carRentalType: string
  setCarRentalType: Dispatch<SetStateAction<string>>
  carRentalDailyRate: number
  setCarRentalDailyRate: Dispatch<SetStateAction<number>>
  carRentalDays: number
  setCarRentalDays: Dispatch<SetStateAction<number>>
  carRentalSubtotal: number
  travelTotalCost: number
  handleRecalculateRouteByCep: (destCep?: string, origCep?: string) => any
  handleRecalculateRouteByCities: (origCity: string, destCity: string) => any
}

export function TravelSection(props: TravelSectionProps) {
  const {
    originCep,
    setOriginCep,
    originAddress,
    setOriginAddress,
    destinationCep,
    setDestinationCep,
    destinationAddress,
    setDestinationAddress,
    distanceKm,
    setDistanceKm,
    isRoundTrip,
    setIsRoundTrip,
    consumptionKmL,
    setConsumptionKmL,
    fuelPrice,
    setFuelPrice,
    tollRoadPercent,
    setTollRoadPercent,
    manualFuelAdj,
    setManualFuelAdj,
    manualTollAdj,
    setManualTollAdj,
    isCalculatingRoute,
    carRentalType,
    setCarRentalType,
    carRentalDailyRate,
    setCarRentalDailyRate,
    carRentalDays,
    setCarRentalDays,
    carRentalSubtotal,
    travelTotalCost,
    handleRecalculateRouteByCep,
    handleRecalculateRouteByCities,
  } = props

  return (
    <>
      {/* SEÇÃO 3C: Deslocamento & Rotas */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-xs">
        <CardHeader className="p-4 pb-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span className="flex items-center justify-center w-7 h-5 rounded bg-teal-600 text-white text-[11px] font-bold">
                3C
              </span>
              3C Deslocamento & Rotas
            </CardTitle>
            <span className="text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400">
              Subtotal:{' '}
              {travelTotalCost.toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              })}
            </span>
          </div>
        </CardHeader>
        <CardContent className="p-4 space-y-4">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Truck className="h-4 w-4 text-emerald-600" />
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                  Deslocamento & Rotas (Ref. Mapeia / ViaCEP / Haversine)
                </span>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 bg-white dark:bg-slate-950 px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-800">
                  <ArrowLeftRight
                    className={`h-3.5 w-3.5 ${isRoundTrip ? 'text-emerald-600' : 'text-slate-400'}`}
                  />
                  <Label
                    htmlFor="toggle-round-trip-modal"
                    className="text-xs font-semibold cursor-pointer select-none"
                  >
                    {isRoundTrip ? 'Ida e Volta (×2)' : 'Apenas Ida (×1)'}
                  </Label>
                  <Switch
                    id="toggle-round-trip-modal"
                    checked={isRoundTrip}
                    onCheckedChange={setIsRoundTrip}
                  />
                </div>

                <span className="text-xs font-bold text-emerald-600 font-mono">
                  Subtotal:{' '}
                  {travelTotalCost.toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  })}
                </span>
              </div>
            </div>

            {/* CEPs */}
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
                      setOriginCep(val)
                      const clean = val.replace(/\D/g, '')
                      if (clean.length === 8) {
                        handleRecalculateRouteByCep(destinationCep, val)
                      }
                    }}
                    placeholder="89066-000"
                    className="text-xs h-8 w-32 font-mono font-bold"
                  />
                  <Input
                    value={originAddress}
                    onChange={(e) => setOriginAddress(e.target.value)}
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
                      setDestinationCep(val)
                      const clean = val.replace(/\D/g, '')
                      if (clean.length === 8) {
                        handleRecalculateRouteByCep(val, originCep)
                      }
                    }}
                    placeholder="Ex: 89801-000"
                    className="text-xs h-8 w-32 font-mono font-bold text-teal-700 dark:text-teal-300"
                  />
                  <Input
                    value={destinationAddress}
                    onChange={(e) => setDestinationAddress(e.target.value)}
                    placeholder="Cidade/UF do Cliente"
                    className="text-xs h-8 flex-1"
                  />
                </div>
              </div>
            </div>

            {/* Parâmetros do percurso */}
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
                  onChange={(e) => setDistanceKm(Number(e.target.value))}
                  className="text-xs h-8 font-bold font-mono text-emerald-800 dark:text-emerald-300"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-[10px] text-muted-foreground">Consumo Veículo (km/L)</Label>
                <Input
                  type="number"
                  value={consumptionKmL}
                  onChange={(e) => setConsumptionKmL(Number(e.target.value))}
                  className="text-xs h-8"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-[10px] text-muted-foreground">
                  Preço Litro Combustível (R$)
                </Label>
                <Input
                  type="number"
                  step="0.01"
                  value={fuelPrice}
                  onChange={(e) => setFuelPrice(Number(e.target.value))}
                  className="text-xs h-8"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-[10px] text-muted-foreground">% Rodovias c/ Pedágio</Label>
                <Input
                  type="number"
                  value={tollRoadPercent}
                  onChange={(e) => setTollRoadPercent(Number(e.target.value))}
                  className="text-xs h-8"
                />
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
                  onChange={(e) => setManualFuelAdj(Number(e.target.value))}
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
                  onChange={(e) => setManualTollAdj(Number(e.target.value))}
                  placeholder="0.00"
                  className="text-xs h-8 font-mono"
                />
              </div>
            </div>

            {/* Aluguel de Carro */}
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
                  <Select value={carRentalType} onValueChange={setCarRentalType}>
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
                        Valor Diária (R$)
                      </Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={carRentalDailyRate}
                        onChange={(e) => setCarRentalDailyRate(Number(e.target.value))}
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
                        onChange={(e) => setCarRentalDays(Math.max(1, Number(e.target.value)))}
                        className="text-xs h-8 font-mono font-semibold"
                      />
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-[10px] text-muted-foreground">
                * Digite as cidades (ou CEPs) para rota automática via Nominatim/Mapeia.
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isCalculatingRoute}
                onClick={() => {
                  const orig = originAddress.trim()
                  const dest = destinationAddress.trim()
                  if (orig.length >= 3 && dest.length >= 3) {
                    handleRecalculateRouteByCities(orig, dest)
                  } else {
                    handleRecalculateRouteByCep()
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
        </CardContent>
      </Card>
    </>
  )
}
