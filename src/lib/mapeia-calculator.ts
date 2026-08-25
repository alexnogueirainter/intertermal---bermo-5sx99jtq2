export interface RouteCalculationInput {
  originCep: string
  destinationCep: string
  fuelPrice?: number
  consumptionKmL?: number
  tollRoadPercent?: number
  isRoundTrip?: boolean
}

export interface RouteCalculationResult {
  distanceOneWayKm: number
  roundTripKm: number
  distanceKm: number // Distância considerada (ida ou ida e volta dependendo do parâmetro)
  isRoundTrip: boolean
  destinationCity?: string
  destinationState?: string
  destinationAddress?: string
  originCity?: string
  originState?: string
  originAddress?: string
  fuelCost: number
  tollCost: number
  totalTravelCost: number
  originFormatted: string
  destinationFormatted: string
}

export const CEP_DATABASE: Record<
  string,
  { city: string; state: string; lat: number; lng: number }
> = {
  '89066-000': { city: 'Blumenau', state: 'SC', lat: -26.868, lng: -49.095 },
  '89010-000': { city: 'Blumenau', state: 'SC', lat: -26.919, lng: -49.066 },
  '89201-000': { city: 'Joinville', state: 'SC', lat: -26.304, lng: -48.848 },
  '88301-000': { city: 'Itajaí', state: 'SC', lat: -26.907, lng: -48.661 },
  '88010-000': { city: 'Florianópolis', state: 'SC', lat: -27.596, lng: -48.549 },
  '89801-000': { city: 'Chapecó', state: 'SC', lat: -27.1, lng: -52.615 },
  '89251-000': { city: 'Jaraguá do Sul', state: 'SC', lat: -26.485, lng: -49.083 },
  '89700-000': { city: 'Concórdia', state: 'SC', lat: -27.233, lng: -52.023 },
  '88801-000': { city: 'Criciúma', state: 'SC', lat: -28.677, lng: -49.37 },
  '01001-000': { city: 'São Paulo', state: 'SP', lat: -23.55, lng: -46.633 },
  '80010-000': { city: 'Curitiba', state: 'PR', lat: -25.429, lng: -49.271 },
}

// Coordenadas aproximadas por estado/região do Brasil (fallback geográfico caso necessário)
const STATE_COORDINATES: Record<string, { lat: number; lng: number }> = {
  SC: { lat: -27.2423, lng: -50.2189 },
  PR: { lat: -25.2521, lng: -52.0215 },
  RS: { lat: -30.0346, lng: -51.2177 },
  SP: { lat: -23.5505, lng: -46.6333 },
  RJ: { lat: -22.9068, lng: -43.1729 },
  MG: { lat: -19.9167, lng: -43.9345 },
  ES: { lat: -20.3155, lng: -40.3128 },
  MS: { lat: -20.4697, lng: -54.6201 },
  MT: { lat: -15.6014, lng: -56.0979 },
  GO: { lat: -16.6869, lng: -49.2648 },
  DF: { lat: -15.7975, lng: -47.8919 },
  BA: { lat: -12.9777, lng: -38.5016 },
  PE: { lat: -8.0476, lng: -34.877 },
  CE: { lat: -3.7319, lng: -38.5267 },
}

// Cidades conhecidas para coordenadas mais precisas
const CITY_COORDINATES: Record<string, { lat: number; lng: number }> = {
  'blumenau/sc': { lat: -26.868, lng: -49.095 },
  'joinville/sc': { lat: -26.304, lng: -48.848 },
  'florianópolis/sc': { lat: -27.596, lng: -48.549 },
  'florianopolis/sc': { lat: -27.596, lng: -48.549 },
  'itajaí/sc': { lat: -26.907, lng: -48.661 },
  'itajai/sc': { lat: -26.907, lng: -48.661 },
  'jaraguá do sul/sc': { lat: -26.485, lng: -49.083 },
  'jaragua do sul/sc': { lat: -26.485, lng: -49.083 },
  'chapeco/sc': { lat: -27.1, lng: -52.615 },
  'chapecó/sc': { lat: -27.1, lng: -52.615 },
  'criciúma/sc': { lat: -28.677, lng: -49.37 },
  'criciuma/sc': { lat: -28.677, lng: -49.37 },
  'concórdia/sc': { lat: -27.233, lng: -52.023 },
  'concordia/sc': { lat: -27.233, lng: -52.023 },
  'brusque/sc': { lat: -27.098, lng: -48.917 },
  'lages/sc': { lat: -27.816, lng: -50.326 },
  'tubarão/sc': { lat: -28.473, lng: -49.014 },
  'tubarao/sc': { lat: -28.473, lng: -49.014 },
  'rio do sul/sc': { lat: -27.214, lng: -49.643 },
  'curitiba/pr': { lat: -25.429, lng: -49.271 },
  'são paulo/sp': { lat: -23.55, lng: -46.633 },
  'sao paulo/sp': { lat: -23.55, lng: -46.633 },
  'campinas/sp': { lat: -22.905, lng: -47.06 },
  'porto alegre/rs': { lat: -30.034, lng: -51.217 },
  'caxias do sul/rs': { lat: -29.167, lng: -51.179 },
}

export interface ViaCepResponse {
  cep: string
  logradouro?: string
  complemento?: string
  bairro?: string
  localidade: string
  uf: string
  ibge?: string
  gia?: string
  ddd?: string
  siafi?: string
  erro?: boolean
}

/**
 * Consulta CEP na API oficial do ViaCEP
 */
export async function fetchViaCep(cep: string): Promise<ViaCepResponse | null> {
  const clean = cep.replace(/\D/g, '')
  if (clean.length !== 8) return null

  try {
    const res = await fetch(`https://viacep.com.br/ws/${clean}/json/`)
    if (!res.ok) return null
    const data = await res.json()
    if (data.erro) return null
    return data as ViaCepResponse
  } catch (err) {
    console.warn(`[ViaCEP] Falha ao consultar CEP ${clean}:`, err)
    return null
  }
}

/**
 * Fórmula de Haversine para cálculo de distância em linha reta entre 2 coordenadas geográficas
 * Multiplicado por 1.25 para simulação de traçado de rodovias brasileiras
 */
export function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371 // Raio da Terra em km
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  // Multiplica por 1.25 para estimar a malha viária real
  return Math.round(R * c * 1.25)
}

function resolveCoordinates(
  cepClean: string,
  viaCepData: ViaCepResponse | null,
  fallbackCity: string,
  fallbackState: string,
): { lat: number; lng: number; city: string; state: string; address?: string } {
  // 1. Procura na tabela de CEPs conhecidos
  const origKey = Object.keys(CEP_DATABASE).find((k) => k.replace(/\D/g, '') === cepClean)
  if (origKey && CEP_DATABASE[origKey]) {
    const item = CEP_DATABASE[origKey]
    return {
      lat: item.lat,
      lng: item.lng,
      city: item.city,
      state: item.state,
      address: `${item.city}/${item.state}`,
    }
  }

  // 2. Se temos resposta do ViaCEP
  if (viaCepData && viaCepData.localidade) {
    const cityKey = `${viaCepData.localidade.toLowerCase()}/${viaCepData.uf.toLowerCase()}`
    const cityCleanKey = `${viaCepData.localidade
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')}/${viaCepData.uf.toLowerCase()}`

    let coords = CITY_COORDINATES[cityKey] || CITY_COORDINATES[cityCleanKey]
    if (!coords) {
      coords = STATE_COORDINATES[viaCepData.uf.toUpperCase()] || { lat: -27.24, lng: -50.21 }
    }

    const addrParts = [
      viaCepData.logradouro,
      viaCepData.bairro,
      `${viaCepData.localidade}/${viaCepData.uf}`,
    ].filter(Boolean)

    return {
      lat: coords.lat,
      lng: coords.lng,
      city: viaCepData.localidade,
      state: viaCepData.uf,
      address: addrParts.join(' - '),
    }
  }

  // 3. Fallbacks regionais baseados no prefixo do CEP
  if (cepClean.startsWith('890') || cepClean.startsWith('891')) {
    return { lat: -26.91, lng: -49.06, city: 'Blumenau / Vale do Itajaí', state: 'SC' }
  } else if (cepClean.startsWith('892')) {
    return { lat: -26.3, lng: -48.84, city: 'Joinville / Norte SC', state: 'SC' }
  } else if (cepClean.startsWith('880') || cepClean.startsWith('881')) {
    return { lat: -27.59, lng: -48.54, city: 'Grande Florianópolis', state: 'SC' }
  } else if (cepClean.startsWith('883')) {
    return { lat: -26.9, lng: -48.66, city: 'Itajaí / Litoral SC', state: 'SC' }
  } else if (cepClean.startsWith('898')) {
    return { lat: -27.1, lng: -52.61, city: 'Chapecó / Oeste SC', state: 'SC' }
  } else if (cepClean.startsWith('80') || cepClean.startsWith('81')) {
    return { lat: -25.42, lng: -49.27, city: 'Curitiba', state: 'PR' }
  } else if (cepClean.startsWith('0')) {
    return { lat: -23.55, lng: -46.63, city: 'São Paulo', state: 'SP' }
  } else if (cepClean.startsWith('9')) {
    return { lat: -30.03, lng: -51.21, city: 'Porto Alegre / RS', state: 'RS' }
  }

  return {
    lat: -27.1,
    lng: -52.615,
    city: fallbackCity || 'Destino',
    state: fallbackState || 'SC',
  }
}

/**
 * Calcula deslocamento completo (IDA E VOLTA) entre CEP de origem e destino
 * Utiliza ViaCEP para resolução de endereço e coordenadas e fórmula de Haversine
 */
export async function calculateDistanceBetweenCeps(
  originCep: string,
  destinationCep: string,
  fuelPrice: number = 6.1,
  consumptionKmL: number = 10,
  tollRoadPercent: number = 70,
  isRoundTrip: boolean = true,
): Promise<RouteCalculationResult> {
  const cleanOrig = (originCep || '89066-000').replace(/\D/g, '')
  const cleanDest = (destinationCep || '').replace(/\D/g, '')

  // Consulta ViaCEP em paralelo para origem e destino
  const [origViaCep, destViaCep] = await Promise.all([
    cleanOrig.length === 8 ? fetchViaCep(cleanOrig) : Promise.resolve(null),
    cleanDest.length === 8 ? fetchViaCep(cleanDest) : Promise.resolve(null),
  ])

  const origInfo = resolveCoordinates(cleanOrig, origViaCep, 'Blumenau', 'SC')
  const destInfo = resolveCoordinates(cleanDest, destViaCep, 'Chapecó', 'SC')

  // Distância só de ida (mínimo 15km)
  const distanceOneWayKm = Math.max(
    15,
    haversineDistance(origInfo.lat, origInfo.lng, destInfo.lat, destInfo.lng),
  )

  // DISTÂNCIA TOTAL (se ida e volta, distância × 2; se apenas ida, distância × 1)
  const roundTripKm = distanceOneWayKm * 2
  const effectiveDistanceKm = isRoundTrip ? roundTripKm : distanceOneWayKm

  // Combustível: distância / consumo (10 km/L) × preço do combustível (R$6,10/L)
  const liters = effectiveDistanceKm / (consumptionKmL > 0 ? consumptionKmL : 10)
  const fuelCost = Math.round(liters * fuelPrice * 100) / 100

  // Pedágio: 70% da rota em rodovias pedagiadas × R$0,15/km (com suporte a customização via percentual e distância)
  // Fórmula: effectiveDistanceKm × (tollRoadPercent / 100) × R$0,15/km
  const tollCost = Math.round(effectiveDistanceKm * (tollRoadPercent / 100) * 0.15 * 100) / 100

  const originFormatted = origInfo.address || `${origInfo.city}/${origInfo.state}`
  const destinationFormatted = destInfo.address || `${destInfo.city}/${destInfo.state}`

  return {
    distanceOneWayKm,
    roundTripKm,
    distanceKm: effectiveDistanceKm,
    isRoundTrip,
    destinationCity: destInfo.city,
    destinationState: destInfo.state,
    destinationAddress: destinationFormatted,
    originCity: origInfo.city,
    originState: origInfo.state,
    originAddress: originFormatted,
    fuelCost,
    tollCost,
    totalTravelCost: Math.round((fuelCost + tollCost) * 100) / 100,
    originFormatted,
    destinationFormatted,
  }
}
