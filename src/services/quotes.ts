import { QuoteRecord } from '@/types/crm'
import pb from '@/lib/pocketbase/client'

const QUOTES_COLLECTION = 'quotes'

// Fallback em memória para orçamentos de serviços BERMO
export const INITIAL_QUOTES_DATA: QuoteRecord[] = [
  {
    id: 'quote-intertermal-001',
    quote_number: 'INT-2025-084',
    title: 'Manutenção Padrão BERMO BP30 - Aurora Alimentos',
    client_id: 'client-aurora-01',
    client_name: 'Aurora Alimentos S.A. - Planta Chapecó',
    deal_id: 'deal-001',
    status: 'sent',
    items: [
      {
        id: 'item-serv-01',
        name: 'Serviço Especializado de Manutenção Preventiva: Trocador BERMO BP30',
        quantity: 1,
        unit_price: 18450,
        discount: 0,
        total: 18450,
        description: `A metodologia aplicada seguiu rigorosamente as normas técnicas de manutenção industrial e as recomendações dos fabricantes (Bermo), consistindo nas seguintes etapas:

1. Desmontagem: Abertura do feixe de placas com registro prévio da Medida A (distância entre as placas de aperto) para referência de remontagem.
2. Limpeza: Remoção de incrustações e resíduos de processo através de limpeza mecânica manual e/ou química, preservando a integridade do material das placas.
3. Inspeção de Placas: Análise visual individualizada para detecção de furos, deformações, pontos de corrosão ou desgaste prematuro.
4. Inspeção de Gaxetas: Verificação da elasticidade, presença de trincas, ressecamento ou perda de perfil de vedação.
5. Montagem: Fechamento do equipamento com aplicação de torque gradual e uniforme, respeitando a Medida A final especificada.
6. Teste de Estanqueidade: Verificação pós-montagem para garantia de ausência de vazamentos externos sob pressão de operação.`,
        include_product_cost: false,
        bermo_specs: {
          productCode: 'BP30',
          productName: 'Trocador de Calor a Placas BP30',
          productModel: 'BP30',
          productBrand: 'BERMO',
          fluidType: 'vapor',
          fluidName: 'Vapor Saturado Linha de Cozimento',
          operatingPressure: '6.0',
          inletTemp: '140',
          outletTemp: '80',
          flowRate: '15',
          equipmentSize: 'DN50 (2 pol) Flangeado',
          frameMaterial: 'AISI 316L (0.5mm)',
          gasketType: 'EPDM Clip-on / NBR',
          platesCount: '40',
          plateDimensions: '680 x 280 mm',
          gasketsCount: '40',
          workAreaDifficulty: 'Médio',
          workAreaObservations: 'Acesso por escada tipo marinheiro com linha de vida.',
          needsIntegration: 'Sim',
          integrationTiming: 'same_day',
          integrationCost: 750,
          pipeMeasurement: 'DN50 (2 pol)',
          includeProductCost: false,
          productBasePrice: 18500,
          serviceBasePrice: 7400,
        },
      },
    ],
    subtotal: 9480,
    discount_total: 0,
    total: 18450,
    payment_terms: '28 DDL (28 dias do dia líquido)',
    valid_until: '2025-04-30T00:00:00.000Z',
    notes:
      'Orçamento inclui emissão de Relatório Técnico de Inspeção com registro fotográfico e laudo de ensaio por líquido penetrante conforme ASME Sec. V.',
    assigned_to: 'Alex Nogueira - Especialista Técnico Intertermal',
    service_details: {
      service_technical_specs: {
        productCode: 'BP30',
        productName: 'Trocador de Calor a Placas BP30',
        productModel: 'BP30',
        productBrand: 'BERMO',
        fluidType: 'vapor',
        operatingPressure: '6.0',
        inletTemp: '140',
        outletTemp: '80',
        flowRate: '15',
        equipmentSize: 'DN50 (2 pol)',
        frameMaterial: 'AISI 316L',
        gasketType: 'EPDM Clip-on',
        platesCount: '40',
        plateDimensions: '680 x 280 mm',
        gasketsCount: '40',
        workAreaDifficulty: 'Médio',
        needsIntegration: 'Sim',
        integrationTiming: 'same_day',
        pipeMeasurement: 'DN50 (2 pol)',
      },
      labor_costs: {
        techMechanical: { count: 1, hours: 16, ratePerHour: 85, total: 1360 },
        helper: { count: 1, hours: 16, ratePerHour: 50, total: 800 },
        inspectorNDT: { count: 1, hours: 8, ratePerHour: 110, total: 880 },
        totalLabor: 3040,
      },
      travel_costs: {
        originCep: '89066-000',
        originAddress: 'Rua Bernardo Reiter, 500 - Blumenau/SC',
        destinationCep: '89801-000',
        destinationAddress: 'Chapecó / SC',
        distanceKm: 480,
        fuelPrice: 6.1,
        consumptionKmL: 10,
        tollRoadPercent: 70,
        calculatedFuelCost: 595,
        calculatedTollCost: 87,
        manualFuelAdjustment: 0,
        manualTollAdjustment: 0,
        totalTravelCost: 682,
      },
      lodging_meals_costs: {
        hotelDays: 2,
        hotelRatePerDay: 180,
        mealsDays: 4,
        mealsRatePerDay: 75,
        totalLodgingMeals: 660,
      },
      maintenance_materials: [
        {
          id: 'mat-001',
          description: 'Solvente Desengraxante Biodegradável Industrial 20L',
          amount: 450,
        },
        {
          id: 'mat-002',
          description: 'Kit Líquido Penetrante (Penetrante + Revelador + Removedor)',
          amount: 280,
        },
      ],
      maintenance_materials_total: 730,
      indirect_costs: {
        serviceMarginPercent: 25,
        administrativeCostPercent: 15,
        salesCommissionPercent: 6,
        taxes: {
          pis: 1.65,
          cofins: 7.6,
          iss: 3.5,
          csll: 1.08,
          irpj: 4.8,
          irDiff: 0.96,
          totalTaxes: 19.59,
        },
        totalDirectCosts: 9480,
        serviceMarginAmount: 2370,
        adminCostAmount: 1422,
        salesCommissionAmount: 1107,
        taxesAmount: 3614.35,
        totalIndirectAmount: 8513.35,
        calculatedSalePrice: 18450,
      },
      payment_and_validity: {
        validityDays: 10,
        conditionType: '28_ddl',
      },
    },
    created: '2025-03-20T10:00:00.000Z',
    updated: '2025-03-20T10:00:00.000Z',
  },
]

export async function getQuotes(): Promise<QuoteRecord[]> {
  try {
    const records = await pb.collection(QUOTES_COLLECTION).getFullList<QuoteRecord>({
      sort: '-created',
      requestKey: null,
    })
    if (records && records.length > 0) return records
  } catch (error) {
    console.warn('Erro ao carregar quotes do backend:', error)
  }
  return INITIAL_QUOTES_DATA
}

export async function createQuote(data: Partial<QuoteRecord>): Promise<QuoteRecord> {
  try {
    return await pb.collection(QUOTES_COLLECTION).create<QuoteRecord>(data)
  } catch (error) {
    console.warn('Erro ao criar quote no backend:', error)
    return {
      id: `quote-${Date.now()}`,
      quote_number: data.quote_number || `INT-${Date.now()}`,
      title: data.title || data.quote_number || 'Proposta de Serviço',
      client_id: data.client_id,
      client_name: data.client_name,
      deal_id: data.deal_id,
      status: data.status || 'draft',
      items: data.items || [],
      subtotal: data.subtotal || 0,
      discount_total: data.discount_total || 0,
      total: data.total || 0,
      payment_terms: data.payment_terms || '28 DDL',
      valid_until: data.valid_until,
      notes: data.notes,
      assigned_to: data.assigned_to,
      service_details: data.service_details,
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
    }
  }
}

export async function updateQuote(id: string, data: Partial<QuoteRecord>): Promise<QuoteRecord> {
  try {
    return await pb.collection(QUOTES_COLLECTION).update<QuoteRecord>(id, data)
  } catch (error) {
    console.warn('Erro ao atualizar quote no backend:', error)
    return {
      id,
      quote_number: data.quote_number || 'INT-2025',
      title: data.title,
      client_id: data.client_id,
      client_name: data.client_name,
      deal_id: data.deal_id,
      status: data.status || 'draft',
      items: data.items || [],
      subtotal: data.subtotal || 0,
      discount_total: data.discount_total || 0,
      total: data.total || 0,
      payment_terms: data.payment_terms,
      valid_until: data.valid_until,
      notes: data.notes,
      assigned_to: data.assigned_to,
      service_details: data.service_details,
      created: data.created || new Date().toISOString(),
      updated: new Date().toISOString(),
    }
  }
}

export async function deleteQuote(id: string): Promise<boolean> {
  try {
    return await pb.collection(QUOTES_COLLECTION).delete(id)
  } catch (error) {
    console.warn('Erro ao excluir quote no backend:', error)
    return true
  }
}

export interface EquipmentSpecsSearchResult {
  found: boolean
  brand: string
  model: string
  name?: string
  description?: string
  specs?: {
    connection?: string
    pressure?: string
    temperature?: string
    material?: string
    gasketMaterial?: string
    platesRange?: string
    plateDimensions?: string
    gasketsCount?: string
    maxFlowRate?: string
    applications?: string
  } | null
  source?: string
  message?: string
}

export async function searchEquipmentSpecsOnline(
  model: string,
  brand?: string,
): Promise<EquipmentSpecsSearchResult> {
  const clean = (model || '').trim()
  if (!clean) {
    return {
      found: false,
      brand: brand || 'Outro',
      model: '',
      specs: null,
      message: 'Modelo não informado.',
    }
  }

  try {
    const res = await pb.send<EquipmentSpecsSearchResult>('/backend/v1/equipment/search-specs', {
      method: 'POST',
      body: { model: clean, brand: brand || '' },
      requestKey: null,
    })
    return res
  } catch (error) {
    console.warn('Erro ao consultar backend para specs do equipamento:', error)
    return {
      found: false,
      brand: brand || 'Outro',
      model: clean,
      specs: null,
      message: 'Busca online indisponível no momento. Preencha manualmente os campos técnicos.',
    }
  }
}

export const quotesService = {
  getAll: getQuotes,
  getById: async (id: string): Promise<QuoteRecord> => {
    return await pb.collection(QUOTES_COLLECTION).getOne<QuoteRecord>(id)
  },
  create: createQuote,
  update: updateQuote,
  delete: deleteQuote,
  searchSpecsOnline: searchEquipmentSpecsOnline,
}
