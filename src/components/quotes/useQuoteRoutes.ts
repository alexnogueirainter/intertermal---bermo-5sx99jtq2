import {
  BLUMENAU_COORDS,
  geocodeCity,
  fetchCepCoordinates,
  haversineDistance,
} from '@/lib/mapeia-calculator'
import type { useToast } from '@/hooks/use-toast'
import type { Dispatch, SetStateAction } from 'react'

interface MakeQuoteRoutesDeps {
  destinationCep: string
  originCep: string
  setDistanceKm: Dispatch<SetStateAction<number>>
  setIsCalculatingRoute: Dispatch<SetStateAction<boolean>>
  toast: ReturnType<typeof useToast>['toast']
}

export function makeQuoteRoutes(p: MakeQuoteRoutesDeps) {
  const { destinationCep, originCep, setDistanceKm, setIsCalculatingRoute, toast } = p

  const handleRecalculateRouteByCep = async (destCep?: string, origCep?: string) => {
    const dest = (destCep || destinationCep || '').replace(/\D/g, '')
    const orig = (origCep || originCep || '').replace(/\D/g, '')

    if (dest.length !== 8) {
      toast({
        title: 'CEP Inválido',
        description: 'Digite um CEP de destino completo com 8 dígitos para o cálculo.',
      })
      return
    }

    setIsCalculatingRoute(true)
    try {
      const destCoords = await fetchCepCoordinates(dest)
      let origCoords = BLUMENAU_COORDS
      if (orig.length === 8) {
        const customOrig = await fetchCepCoordinates(orig)
        if (customOrig) origCoords = customOrig
      }

      if (!destCoords) {
        toast({
          title: 'Rota manual recomendada',
          description:
            'Não foi possível obter coordenadas para o CEP informado. Ajuste os km manualmente.',
        })
        return
      }

      const straightKm = haversineDistance(
        origCoords.lat,
        origCoords.lng ?? 0,
        destCoords.lat,
        destCoords.lng ?? 0,
        1.0,
      )
      const roadKm = Math.max(10, Math.round(straightKm * 1.25))

      setDistanceKm(roadKm)
      toast({
        title: 'Rota Mapeia Calculada',
        description: `Distância estimada: ${roadKm} km por percurso rodoviário.`,
      })
    } catch (err: any) {
      console.warn('Erro ao calcular rota:', err)
    } finally {
      setIsCalculatingRoute(false)
    }
  }

  const handleRecalculateRouteByCities = async (origCity: string, destCity: string) => {
    setIsCalculatingRoute(true)
    try {
      const [origCoords, destCoords] = await Promise.all([
        geocodeCity(origCity),
        geocodeCity(destCity),
      ])
      if (origCoords && destCoords) {
        const straightKm = haversineDistance(
          origCoords.lat,
          origCoords.lng ?? 0,
          destCoords.lat,
          destCoords.lng ?? 0,
          1.0,
        )
        const roadKm = Math.max(10, Math.round(straightKm * 1.25))

        setDistanceKm(roadKm)
        toast({
          title: 'Rota Calculada',
          description: `${origCity} até ${destCity}: ~${roadKm} km rodoviários.`,
        })
      } else {
        toast({
          title: 'Atenção',
          description: 'Não foi possível localizar uma das cidades informadas.',
        })
      }
    } catch {
      // Ignora erro
    } finally {
      setIsCalculatingRoute(false)
    }
  }

  return {
    handleRecalculateRouteByCep,
    handleRecalculateRouteByCities,
  }
}
