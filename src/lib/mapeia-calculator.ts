export interface RouteCalculationInput {
  originCep: string
  destinationCep: string
  fuelPrice?: number
  consumptionKmL?: number
  tollRoadPercent?: number
}

export interface RouteCalculationResult {
  distanceKm: number
  destinationCity?: string
  destinationState?: string
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

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
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
  // Multiplica por 1.25 para simular traçado de rodovias reais
  return Math.round(R * c * 1.25)
}

export async function calculateDistanceBetweenCeps(
  originCep: string,
  destinationCep: string,
  fuelPrice: number = 5.89,
  consumptionKmL: number = 9.5,
  tollRoadPercent: number = 40,
): Promise<RouteCalculationResult> {
  const cleanOrig = (originCep || '89066-000').replace(/\D/g, '')
  const cleanDest = (destinationCep || '').replace(/\D/g, '')

  let origCoords = { lat: -26.868, lng: -49.095, city: 'Blumenau', state: 'SC' }
  let destCoords = { lat: -27.1, lng: -52.615, city: 'Chapecó', state: 'SC' }

  const origKey = Object.keys(CEP_DATABASE).find((k) => k.replace(/\D/g, '') === cleanOrig)
  if (origKey && CEP_DATABASE[origKey]) {
    origCoords = CEP_DATABASE[origKey]
  }

  const destKey = Object.keys(CEP_DATABASE).find((k) => k.replace(/\D/g, '') === cleanDest)
  if (destKey && CEP_DATABASE[destKey]) {
    destCoords = CEP_DATABASE[destKey]
  } else if (cleanDest.startsWith('89')) {
    destCoords = { lat: -26.5, lng: -49.5, city: 'Região Norte/Vale SC', state: 'SC' }
  } else if (cleanDest.startsWith('88')) {
    destCoords = { lat: -27.5, lng: -48.6, city: 'Região Litoral SC', state: 'SC' }
  } else if (cleanDest.startsWith('80')) {
    destCoords = { lat: -25.4, lng: -49.2, city: 'Curitiba', state: 'PR' }
  } else if (cleanDest.startsWith('0')) {
    destCoords = { lat: -23.5, lng: -46.6, city: 'Grande São Paulo', state: 'SP' }
  }

  const distanceKm = Math.max(
    15,
    haversineDistance(origCoords.lat, origCoords.lng, destCoords.lat, destCoords.lng),
  )
  const roundTripKm = distanceKm * 2
  const liters = roundTripKm / (consumptionKmL || 9.5)
  const fuelCost = Math.round(liters * fuelPrice * 100) / 100

  const tollBooths = Math.max(1, Math.round((distanceKm / 80) * (tollRoadPercent / 100)))
  const tollCost = tollBooths * 14.5

  return {
    distanceKm,
    destinationCity: destCoords.city,
    destinationState: destCoords.state,
    fuelCost,
    tollCost,
    totalTravelCost: fuelCost + tollCost,
    originFormatted: `${origCoords.city}/${origCoords.state}`,
    destinationFormatted: `${destCoords.city}/${destCoords.state}`,
  }
}
