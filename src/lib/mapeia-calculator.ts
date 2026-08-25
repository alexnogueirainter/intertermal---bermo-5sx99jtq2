// Utilitário de cálculo de distâncias e custos rodoviários no padrão Mapeia / Google Maps
// Origem Padrão: Matriz Intertermal / BERMO (Blumenau - SC) CEP 89066-000

export interface CepCoords {
  lat: number
  lng: number
  city: string
  state: string
}

// Base de coordenadas de CEPs comuns no Brasil para fallback offline preciso (fórmula de Haversine)
const KNOWN_CEP_COORDS: Record<string, CepCoords> = {
  // Matriz Blumenau / SC
  '89066-000': { lat: -26.8584, lng: -49.1174, city: 'Blumenau', state: 'SC' },
  '89010-000': { lat: -26.9194, lng: -49.0661, city: 'Blumenau', state: 'SC' },
  // Capitais e polos industriais
  '01001-000': { lat: -23.5505, lng: -46.6333, city: 'São Paulo', state: 'SP' },
  '01310-100': { lat: -23.5614, lng: -46.6559, city: 'São Paulo (Paulista)', state: 'SP' },
  '14000-000': { lat: -21.1767, lng: -47.8108, city: 'Ribeirão Preto', state: 'SP' },
  '13000-000': { lat: -22.9099, lng: -47.0626, city: 'Campinas', state: 'SP' },
  '30130-000': { lat: -19.9217, lng: -43.9378, city: 'Belo Horizonte', state: 'MG' },
  '80010-000': { lat: -25.4284, lng: -49.2733, city: 'Curitiba', state: 'PR' },
  '88010-000': { lat: -27.5954, lng: -48.548, city: 'Florianópolis', state: 'SC' },
  '89200-000': { lat: -26.3045, lng: -48.8487, city: 'Joinville', state: 'SC' },
  '90010-000': { lat: -30.0346, lng: -51.2177, city: 'Porto Alegre', state: 'RS' },
  '20040-000': { lat: -22.9068, lng: -43.1729, city: 'Rio de Janeiro', state: 'RJ' },
  '70040-000': { lat: -15.7942, lng: -47.8822, city: 'Brasília', state: 'DF' },
  '40015-000': { lat: -12.9777, lng: -38.5016, city: 'Salvador', state: 'BA' },
  '60025-000': { lat: -3.7319, lng: -38.5267, city: 'Fortaleza', state: 'CE' },
  '50010-000': { lat: -8.0476, lng: -34.877, city: 'Recife', state: 'PE' },
}

/**
 * Fórmula de Haversine para calcular a distância geodésica em km
 */
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371 // Raio da terra em km
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const directDistance = R * c

  // Fator de correção de sinuosidade de malha viária rodoviária brasileira (~1.28x)
  return Math.round(directDistance * 1.28)
}

/**
 * Normaliza string de CEP removendo traços e espaços
 */
export function normalizeCep(cep: string): string {
  return cep.replace(/\D/g, '')
}

/**
 * Tenta obter coordenadas aproximadas a partir do prefixo do CEP brasileiro
 */
export function estimateCoordsFromCep(cleanCep: string): { lat: number; lng: number } {
  if (cleanCep.length < 2) return { lat: -26.8584, lng: -49.1174 } // Blumenau

  const prefix1 = cleanCep.charAt(0)
  const prefix2 = cleanCep.substring(0, 2)

  // Mapeamento por Faixa de CEP dos Correios (macrorregiões brasileiras)
  switch (prefix1) {
    case '0': // Grande SP
      return { lat: -23.5505, lng: -46.6333 }
    case '1': // Interior SP
      return { lat: -22.9099, lng: -47.0626 }
    case '2': // RJ / ES
      return prefix2.startsWith('29')
        ? { lat: -20.3155, lng: -40.3128 } // ES
        : { lat: -22.9068, lng: -43.1729 } // RJ
    case '3': // MG
      return { lat: -19.9217, lng: -43.9378 }
    case '4': // BA / SE
      return { lat: -12.9777, lng: -38.5016 }
    case '5': // PE / AL / PB / RN
      return { lat: -8.0476, lng: -34.877 }
    case '6': // CE / PI / MA / PA / AP / AM / RR / AC
      return { lat: -3.7319, lng: -38.5267 }
    case '7': // DF / GO / TO / MT / MS / RO
      return { lat: -15.7942, lng: -47.8822 }
    case '8': // PR / SC
      return prefix2.startsWith('89') || prefix2.startsWith('88')
        ? { lat: -26.8584, lng: -49.1174 } // SC
        : { lat: -25.4284, lng: -49.2733 } // PR
    case '9': // RS
      return { lat: -30.0346, lng: -51.2177 }
    default:
      return { lat: -23.5505, lng: -46.6333 }
  }
}

/**
 * Calcula a rota completa no padrão Mapeia:
 * - Distância
 * - Custo de combustível: (distância / consumo) * preço_litro
 * - Custo estimado de pedágio: distância * %rodovias_pedagiadas * R$ 0,15/km
 */
export async function calculateRouteMapeiaStyle({
  originCep,
  destinationCep,
  consumptionKmL = 10,
  fuelPrice = 6.1,
  tollRoadPercent = 70,
  tollRateKm = 0.15,
  roundTrip = true,
  manualDistanceKm,
}: {
  originCep?: string
  destinationCep?: string
  consumptionKmL?: number
  fuelPrice?: number
  tollRoadPercent?: number
  tollRateKm?: number
  roundTrip?: boolean
  manualDistanceKm?: number
}): Promise<{
  distanceKm: number
  totalDistanceKm: number
  fuelCost: number
  tollCost: number
  totalTravelCost: number
  isEstimated: boolean
}> {
  let oneWayDistance = manualDistanceKm || 0

  if (!oneWayDistance && originCep && destinationCep) {
    const cleanOrig = normalizeCep(originCep)
    const cleanDest = normalizeCep(destinationCep)

    if (cleanOrig && cleanDest) {
      if (cleanOrig === cleanDest) {
        oneWayDistance = 25 // Deslocamento urbano local
      } else {
        const c1 = estimateCoordsFromCep(cleanOrig)
        const c2 = estimateCoordsFromCep(cleanDest)
        oneWayDistance = calculateHaversineDistance(c1.lat, c1.lng, c2.lat, c2.lng)
      }
    }
  }

  if (!oneWayDistance || oneWayDistance <= 0) {
    oneWayDistance = 120 // Fallback padrão razoável
  }

  const effectiveDistance = roundTrip ? oneWayDistance * 2 : oneWayDistance

  // Custo Combustível = (distância em km / consumo médio em km/L) * preço do litro
  const fuelCost =
    Math.round((effectiveDistance / Math.max(consumptionKmL, 1)) * fuelPrice * 100) / 100

  // Custo de Pedágio = distância * (% pedagiado / 100) * taxa por km
  const tollDistance = effectiveDistance * (tollRoadPercent / 100)
  const tollCost = Math.round(tollDistance * tollRateKm * 100) / 100

  const totalTravelCost = Math.round((fuelCost + tollCost) * 100) / 100

  return {
    distanceKm: oneWayDistance,
    totalDistanceKm: effectiveDistance,
    fuelCost,
    tollCost,
    totalTravelCost,
    isEstimated: true,
  }
}
