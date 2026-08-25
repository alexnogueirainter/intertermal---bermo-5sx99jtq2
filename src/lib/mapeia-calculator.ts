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
export function estimateCoordsFromCep(cleanCep: string): {
  lat: number
  lng: number
  cityHint?: string
  stateHint?: string
} {
  // Se for um CEP conhecido exato
  const formatted =
    cleanCep.length === 8 ? `${cleanCep.slice(0, 5)}-${cleanCep.slice(5)}` : cleanCep
  if (KNOWN_CEP_COORDS[formatted]) {
    const k = KNOWN_CEP_COORDS[formatted]
    return { lat: k.lat, lng: k.lng, cityHint: k.city, stateHint: k.state }
  }

  if (cleanCep.length < 2)
    return { lat: -26.8584, lng: -49.1174, cityHint: 'Blumenau', stateHint: 'SC' }

  const prefix1 = cleanCep.charAt(0)
  const prefix2 = cleanCep.substring(0, 2)
  const prefix3 = cleanCep.substring(0, 3)

  // Mapeamento refinado por Faixa de CEP dos Correios (macrorregiões e microrregiões)
  switch (prefix1) {
    case '0': // Grande SP
      return { lat: -23.5505, lng: -46.6333, cityHint: 'São Paulo', stateHint: 'SP' }
    case '1': // Interior SP
      if (prefix2 === '13')
        return { lat: -22.9099, lng: -47.0626, cityHint: 'Campinas', stateHint: 'SP' }
      if (prefix2 === '14')
        return { lat: -21.1767, lng: -47.8108, cityHint: 'Ribeirão Preto', stateHint: 'SP' }
      if (prefix2 === '12')
        return { lat: -23.1791, lng: -45.8872, cityHint: 'São José dos Campos', stateHint: 'SP' }
      if (prefix2 === '18')
        return { lat: -23.5015, lng: -47.4521, cityHint: 'Sorocaba', stateHint: 'SP' }
      if (prefix2 === '15')
        return { lat: -20.8113, lng: -49.3758, cityHint: 'São José do Rio Preto', stateHint: 'SP' }
      return { lat: -22.9099, lng: -47.0626, cityHint: 'Interior SP', stateHint: 'SP' }
    case '2': // RJ / ES
      if (prefix2.startsWith('29')) {
        return { lat: -20.3155, lng: -40.3128, cityHint: 'Vitória', stateHint: 'ES' }
      }
      return { lat: -22.9068, lng: -43.1729, cityHint: 'Rio de Janeiro', stateHint: 'RJ' }
    case '3': // MG
      if (prefix2 === '38')
        return { lat: -18.9186, lng: -48.2772, cityHint: 'Uberlândia', stateHint: 'MG' }
      if (prefix2 === '36')
        return { lat: -21.7642, lng: -43.3496, cityHint: 'Juiz de Fora', stateHint: 'MG' }
      return { lat: -19.9217, lng: -43.9378, cityHint: 'Belo Horizonte', stateHint: 'MG' }
    case '4': // BA / SE
      if (prefix2.startsWith('49'))
        return { lat: -10.9472, lng: -37.0731, cityHint: 'Aracaju', stateHint: 'SE' }
      return { lat: -12.9777, lng: -38.5016, cityHint: 'Salvador', stateHint: 'BA' }
    case '5': // PE / AL / PB / RN
      if (prefix2.startsWith('57'))
        return { lat: -9.6658, lng: -35.7351, cityHint: 'Maceió', stateHint: 'AL' }
      if (prefix2.startsWith('58'))
        return { lat: -7.1153, lng: -34.861, cityHint: 'João Pessoa', stateHint: 'PB' }
      if (prefix2.startsWith('59'))
        return { lat: -5.7945, lng: -35.211, cityHint: 'Natal', stateHint: 'RN' }
      return { lat: -8.0476, lng: -34.877, cityHint: 'Recife', stateHint: 'PE' }
    case '6': // CE / PI / MA / PA / AP / AM / RR / AC
      if (prefix2.startsWith('64'))
        return { lat: -5.0919, lng: -42.8034, cityHint: 'Teresina', stateHint: 'PI' }
      if (prefix2.startsWith('65'))
        return { lat: -2.5307, lng: -44.3068, cityHint: 'São Luís', stateHint: 'MA' }
      if (prefix2.startsWith('66') || prefix2.startsWith('67') || prefix2.startsWith('68')) {
        return { lat: -1.4558, lng: -48.4902, cityHint: 'Belém', stateHint: 'PA' }
      }
      if (prefix2.startsWith('69'))
        return { lat: -3.119, lng: -60.0217, cityHint: 'Manaus', stateHint: 'AM' }
      return { lat: -3.7319, lng: -38.5267, cityHint: 'Fortaleza', stateHint: 'CE' }
    case '7': // DF / GO / TO / MT / MS / RO
      if (
        prefix2.startsWith('70') ||
        prefix2.startsWith('71') ||
        prefix2.startsWith('72') ||
        prefix2.startsWith('73')
      ) {
        return { lat: -15.7942, lng: -47.8822, cityHint: 'Brasília', stateHint: 'DF' }
      }
      if (prefix2.startsWith('74') || prefix2.startsWith('75') || prefix2.startsWith('76')) {
        return { lat: -16.6869, lng: -49.2648, cityHint: 'Goiânia', stateHint: 'GO' }
      }
      if (prefix2.startsWith('78'))
        return { lat: -15.6014, lng: -56.0979, cityHint: 'Cuiabá', stateHint: 'MT' }
      if (prefix2.startsWith('79'))
        return { lat: -20.4697, lng: -54.6201, cityHint: 'Campo Grande', stateHint: 'MS' }
      if (prefix2.startsWith('77'))
        return { lat: -10.2491, lng: -48.3243, cityHint: 'Palmas', stateHint: 'TO' }
      return { lat: -15.7942, lng: -47.8822, cityHint: 'Centro-Oeste', stateHint: 'DF' }
    case '8': // PR / SC
      if (prefix2.startsWith('89')) {
        if (prefix3 === '890' || prefix3 === '891')
          return { lat: -26.9194, lng: -49.0661, cityHint: 'Blumenau', stateHint: 'SC' }
        if (prefix3 === '892')
          return { lat: -26.3045, lng: -48.8487, cityHint: 'Joinville', stateHint: 'SC' }
        if (prefix3 === '898')
          return { lat: -27.1004, lng: -52.6152, cityHint: 'Chapecó', stateHint: 'SC' }
        return { lat: -26.8584, lng: -49.1174, cityHint: 'Blumenau/Vale', stateHint: 'SC' }
      }
      if (prefix2.startsWith('88')) {
        if (prefix3 === '880')
          return { lat: -27.5954, lng: -48.548, cityHint: 'Florianópolis', stateHint: 'SC' }
        if (prefix3 === '883')
          return { lat: -26.9078, lng: -48.6619, cityHint: 'Itajaí', stateHint: 'SC' }
        if (prefix3 === '888')
          return { lat: -28.6775, lng: -49.3704, cityHint: 'Criciúma', stateHint: 'SC' }
        return { lat: -27.5954, lng: -48.548, cityHint: 'Litoral SC', stateHint: 'SC' }
      }
      // PR
      if (
        prefix3 === '800' ||
        prefix3 === '801' ||
        prefix3 === '802' ||
        prefix3 === '810' ||
        prefix3 === '820'
      ) {
        return { lat: -25.4284, lng: -49.2733, cityHint: 'Curitiba', stateHint: 'PR' }
      }
      if (prefix3 === '860' || prefix3 === '861')
        return { lat: -23.3045, lng: -51.1696, cityHint: 'Londrina', stateHint: 'PR' }
      if (prefix3 === '870')
        return { lat: -23.4205, lng: -51.9331, cityHint: 'Maringá', stateHint: 'PR' }
      if (prefix3 === '858')
        return { lat: -24.9578, lng: -53.4595, cityHint: 'Cascavel', stateHint: 'PR' }
      return { lat: -25.4284, lng: -49.2733, cityHint: 'Paraná', stateHint: 'PR' }
    case '9': // RS
      if (prefix2 === '90' || prefix2 === '91')
        return { lat: -30.0346, lng: -51.2177, cityHint: 'Porto Alegre', stateHint: 'RS' }
      if (prefix2 === '95')
        return { lat: -29.1678, lng: -51.1794, cityHint: 'Caxias do Sul', stateHint: 'RS' }
      if (prefix2 === '96')
        return { lat: -31.7654, lng: -52.3376, cityHint: 'Pelotas', stateHint: 'RS' }
      if (prefix2 === '97')
        return { lat: -29.6842, lng: -53.8069, cityHint: 'Santa Maria', stateHint: 'RS' }
      if (prefix2 === '99')
        return { lat: -28.2628, lng: -52.4067, cityHint: 'Passo Fundo', stateHint: 'RS' }
      return { lat: -30.0346, lng: -51.2177, cityHint: 'Rio Grande do Sul', stateHint: 'RS' }
    default:
      return { lat: -23.5505, lng: -46.6333, cityHint: 'São Paulo', stateHint: 'SP' }
  }
}

/**
 * Consulta API pública ViaCEP (com timeout rápido e fallback gracioso)
 */
export async function lookupCepDetails(cleanCep: string): Promise<{
  city?: string
  state?: string
  address?: string
  neighborhood?: string
  found: boolean
}> {
  if (cleanCep.length !== 8) {
    return { found: false }
  }

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 2000)
    const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`, {
      signal: controller.signal,
    })
    clearTimeout(timeoutId)
    if (res.ok) {
      const data = await res.json()
      if (!data.erro) {
        return {
          city: data.localidade,
          state: data.uf,
          address: data.logradouro,
          neighborhood: data.bairro,
          found: true,
        }
      }
    }
  } catch (_) {
    // Falha silenciosa de rede — usa o simulador
  }
  return { found: false }
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
