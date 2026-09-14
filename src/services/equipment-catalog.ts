import pb from '@/lib/pocketbase/client'

export interface EquipmentCatalogItem {
  id: string
  model: string
  brand: string
  name: string
  series?: string
  category?: string
  description?: string
  plate_count?: number
  plate_material?: string
  plate_thickness?: number
  gasket_material?: string
  connection_size?: string
  working_pressure_bar?: number
  pressure_test_bar?: number
  dimensions_w_h_d?: string
  weight_kg?: number
  max_temperature?: string
  max_flow_rate?: string
  heat_exchange_area?: string
  source_url?: string
  specs?: Record<string, any>
}

class EquipmentCatalogService {
  private cache: EquipmentCatalogItem[] | null = null
  private cacheTimestamp = 0
  private CACHE_TTL = 5 * 60 * 1000 // 5 minutos

  /**
   * Obtém todos os equipamentos cadastrados no catálogo
   */
  async getAll(forceRefresh = false): Promise<EquipmentCatalogItem[]> {
    const now = Date.now()
    if (!forceRefresh && this.cache && now - this.cacheTimestamp < this.CACHE_TTL) {
      return this.cache
    }

    try {
      const records = await pb.collection('equipment_catalog').getFullList<EquipmentCatalogItem>({
        sort: 'model',
      })
      this.cache = records
      this.cacheTimestamp = now
      return records
    } catch (err) {
      console.warn('Erro ao carregar equipment_catalog do PocketBase, usando cache se houver:', err)
      return this.cache || []
    }
  }

  /**
   * Busca equipamentos por texto (modelo, marca, nome ou categoria)
   */
  async search(query: string): Promise<EquipmentCatalogItem[]> {
    if (!query || !query.trim()) return []
    const clean = query.trim().toLowerCase()
    const cleanNoHyphen = clean.replace(/[\s\-_]/g, '')

    // Tenta primeiro carregar a lista ou buscar localmente no cache
    const items = await this.getAll()
    if (items.length > 0) {
      return items.filter((item) => {
        const itemModel = (item.model || '').toLowerCase()
        const itemModelClean = itemModel.replace(/[\s\-_]/g, '')
        const itemName = (item.name || '').toLowerCase()
        const itemBrand = (item.brand || '').toLowerCase()
        const itemSeries = (item.series || '').toLowerCase()

        return (
          itemModel.includes(clean) ||
          itemModelClean.includes(cleanNoHyphen) ||
          itemName.includes(clean) ||
          itemBrand.includes(clean) ||
          itemSeries.includes(clean)
        )
      })
    }

    // Fallback: consulta direta no PocketBase
    try {
      const records = await pb
        .collection('equipment_catalog')
        .getList<EquipmentCatalogItem>(1, 20, {
          filter: `model ~ "${clean}" || name ~ "${clean}" || brand ~ "${clean}"`,
          sort: 'model',
        })
      return records.items
    } catch (err) {
      console.error('Erro na busca de equipamentos no catálogo:', err)
      return []
    }
  }

  /**
   * Busca exata ou por correspondência próxima para um modelo
   */
  async findByModel(modelStr: string): Promise<EquipmentCatalogItem | null> {
    if (!modelStr || !modelStr.trim()) return null
    const clean = modelStr
      .trim()
      .toLowerCase()
      .replace(/[\s\-_]/g, '')

    const items = await this.getAll()
    const found = items.find(
      (item) => (item.model || '').toLowerCase().replace(/[\s\-_]/g, '') === clean,
    )
    if (found) return found

    // Tentativa parcial
    return (
      items.find((item) => {
        const m = (item.model || '').toLowerCase().replace(/[\s\-_]/g, '')
        return m.includes(clean) || clean.includes(m)
      }) || null
    )
  }
}

export const equipmentCatalogService = new EquipmentCatalogService()
