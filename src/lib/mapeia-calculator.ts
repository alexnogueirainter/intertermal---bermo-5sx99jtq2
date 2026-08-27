export interface Coordinates {
  lat: number
  lng: number
  city?: string
  state?: string
}

export const SOROCABA_COORDS: Coordinates = {
  lat: -23.5015,
  lng: -47.4526,
  city: 'Sorocaba',
  state: 'SP',
}

export const BLUMENAU_COORDS: Coordinates = {
  lat: -26.9194,
  lng: -49.0661,
  city: 'Blumenau',
  state: 'SC',
}

// Cidades com coordenadas mapeadas para cálculo offline rápido
const KNOWN_CITY_COORDS: Record<string, Coordinates> = {
  sorocaba: { lat: -23.5015, lng: -47.4526, city: 'Sorocaba', state: 'SP' },
  chapeco: { lat: -27.1004, lng: -52.6152, city: 'Chapecó', state: 'SC' },
  joinville: { lat: -26.3045, lng: -48.8487, city: 'Joinville', state: 'SC' },
  itajai: { lat: -26.9078, lng: -48.6619, city: 'Itajaí', state: 'SC' },
  criciuma: { lat: -28.6775, lng: -49.3703, city: 'Criciúma', state: 'SC' },
  florianopolis: { lat: -27.5954, lng: -48.548, city: 'Florianópolis', state: 'SC' },
  curitiba: { lat: -25.4284, lng: -49.2733, city: 'Curitiba', state: 'PR' },
  'porto alegre': { lat: -30.0346, lng: -51.2177, city: 'Porto Alegre', state: 'RS' },
  'sao paulo': { lat: -23.5505, lng: -46.6333, city: 'São Paulo', state: 'SP' },
  campinas: { lat: -22.9056, lng: -47.0608, city: 'Campinas', state: 'SP' },
  cascavel: { lat: -24.9555, lng: -53.4552, city: 'Cascavel', state: 'PR' },
  lages: { lat: -27.8159, lng: -50.3262, city: 'Lages', state: 'SC' },
  concordia: { lat: -27.2336, lng: -52.0239, city: 'Concórdia', state: 'SC' },
}

export async function geocodeCity(cityName: string): Promise<Coordinates | null> {
  const cleanCity = (cityName || '').trim()
  if (!cleanCity || cleanCity.length < 3) {
    return null
  }

  // 1. Tenta correspondência direta nas cidades conhecidas locais
  const lower = cleanCity.toLowerCase()
  for (const [key, coords] of Object.entries(KNOWN_CITY_COORDS)) {
    if (lower.includes(key) || key.includes(lower)) {
      return coords
    }
  }

  // 2. Consulta a API Nominatim / OpenStreetMap
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(cleanCity)},Brazil&limit=1`
    const res = await fetch(url, {
      headers: {
        Accept: 'application/json',
      },
    })
    if (!res.ok) throw new Error(`Nominatim HTTP ${res.status}`)
    const data = await res.json()
    if (Array.isArray(data) && data.length > 0) {
      const first = data[0]
      const lat = parseFloat(first.lat)
      const lng = parseFloat(first.lon)
      const displayName = first.display_name || ''
      const parts = displayName.split(',').map((p: string) => p.trim())
      const city = parts[0] || cleanCity
      const state = parts.length > 2 ? parts[parts.length - 3] : undefined

      return {
        lat,
        lng,
        city,
        state,
      }
    }
    return null
  } catch (err) {
    console.warn('Erro ao consultar Nominatim OSM para cidade:', cleanCity, err)
    return null
  }
}

export async function fetchCepCoordinates(cep: string): Promise<Coordinates> {
  const cleanCep = cep.replace(/\D/g, '')
  if (cleanCep.length !== 8) {
    return SOROCABA_COORDS
  }

  try {
    const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`)
    if (!res.ok) throw new Error('ViaCEP offline')
    const data = await res.json()

    if (data.erro) {
      return SOROCABA_COORDS
    }

    const cityLower = (data.localidade || '').toLowerCase()
    const mapped = KNOWN_CITY_COORDS[cityLower]

    if (mapped) {
      return {
        lat: mapped.lat,
        lng: mapped.lng,
        city: data.localidade,
        state: data.uf,
      }
    }

    // Coordenada aproximada baseada na UF
    let lat = -27.0
    let lng = -50.0
    if (data.uf === 'PR') {
      lat = -25.4
      lng = -51.5
    } else if (data.uf === 'RS') {
      lat = -29.8
      lng = -52.5
    } else if (data.uf === 'SP') {
      lat = -23.5
      lng = -47.5
    }

    return {
      lat,
      lng,
      city: data.localidade,
      state: data.uf,
    }
  } catch (err) {
    console.warn('Erro ao consultar ViaCEP:', err)
    return SOROCABA_COORDS
  }
}

export function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
  roadCurvatureFactor: number = 1.28,
): number {
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
  const straightDistanceKm = R * c
  return Math.round(straightDistanceKm * roadCurvatureFactor)
}

export const haversineDistanceKm = haversineDistance

export interface RoadTripResult {
  distanceKm: number
  roundTripDistanceKm: number
  estimatedTravelTimeHours: number
  litersFuel: number
  estimatedFuelCost: number
  estimatedTolls: number
  estimatedTollCost: number
  totalTravelCost: number
}

export function calculateRoadTrip(
  distanceKm: number,
  isRoundTrip: boolean = true,
  consumptionKmL: number = 9.5,
  fuelPrice: number = 5.89,
  tollRoadPercent: number = 60,
): RoadTripResult {
  const finalDistance = isRoundTrip ? distanceKm * 2 : distanceKm
  const liters = finalDistance / (consumptionKmL || 9.5)
  const fuelCost = liters * fuelPrice

  const estimatedTolls = Math.max(
    1,
    Math.round((finalDistance / 100) * (tollRoadPercent / 100) * 1.5),
  )
  const tollCost = estimatedTolls * 14.5

  return {
    distanceKm: isRoundTrip ? distanceKm : finalDistance,
    roundTripDistanceKm: isRoundTrip ? finalDistance : distanceKm * 2,
    estimatedTravelTimeHours: Math.round((finalDistance / 75) * 10) / 10,
    litersFuel: Math.round(liters * 10) / 10,
    estimatedFuelCost: Math.round(fuelCost * 100) / 100,
    estimatedTolls,
    estimatedTollCost: Math.round(tollCost * 100) / 100,
    totalTravelCost: Math.round((fuelCost + tollCost) * 100) / 100,
  }
}
