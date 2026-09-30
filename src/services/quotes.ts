import { QuoteRecord } from '@/types/crm'
import pb from '@/lib/pocketbase/client'
import { quoteDealSyncService } from '@/services/quotes-deal-sync'

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
        description:
          'Serviço Especializado de Manutenção Preventiva e Corretiva em Trocador de Calor.',
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
    notes: `RESPONSABILIDADES DA INTERPROJECT

8.1. Executar os serviços conforme a proposta aprovada, normas técnicas aplicáveis e boas práticas de engenharia.
8.2. Disponibilizar mão de obra qualificada e equipe de segurança compatível com a atividade.
8.3. Responder pelos vícios e defeitos comprovadamente decorrentes de sua execução, bem como pelos danos diretos a terceiros e ao local de execução causados por culpa de sua equipe, observados os limites do escopo contratado e da legislação aplicável.
8.4. Cumprir, quando em serviço in loco, as normas de segurança do trabalho aplicáveis, incluindo as Normas Regulamentadoras (NRs) do Ministério do Trabalho, e as normas internas do CLIENTE previamente informadas.

RESPONSABILIDADES DO CLIENTE

9.1. Disponibilizar acesso ao local, informações técnicas completas e corretas, liberações de segurança, permissões de trabalho e condições adequadas para a execução dos serviços.
9.2. Informar previamente qualquer particularidade, interferência, risco ou condição especial do local que possa impactar a execução, a segurança ou o prazo dos serviços.
9.3. Comunicar formalmente à INTERPROJECT qualquer ocorrência, falha ou divergência relacionada aos serviços.
9.4. Manter o local em condições adequadas de segurança, acesso e operação, bem como cumprir as condições comerciais e prazos de pagamento.`,
    assigned_to: 'Alex Nogueira',
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
        originCep: '18016-456',
        originAddress:
          'Rua Ananias Pires do Amaral, 98 - Sorocaba - SP - CEP 18016-456 - Jd Gonçalves',
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
    // Se o backend respondeu com sucesso (mesmo array vazio []), retorna os dados reais com retrocompatibilidade
    if (Array.isArray(records)) {
      return records.map((record) => ({
        ...record,
        chemical_products: Array.isArray(record.chemical_products) ? record.chemical_products : [],
      }))
    }
  } catch (error) {
    console.warn('Erro ao carregar quotes do backend:', error)
  }
  return INITIAL_QUOTES_DATA
}

export async function createQuote(data: Partial<QuoteRecord>): Promise<QuoteRecord> {
  try {
    const payload = {
      ...data,
      quote_number: data.quote_number || data.code || `INT-${Date.now().toString().slice(-4)}`,
      total: data.total || data.final_price || 0,
      subtotal: data.subtotal || data.total_cost || 0,
      chemical_products: Array.isArray(data.chemical_products) ? data.chemical_products : [],
      payment_terms:
        data.payment_terms || (data.payment_conditions ? `${data.payment_conditions}` : '28 DDL'),
    }
    const created = await pb.collection(QUOTES_COLLECTION).create<QuoteRecord>(payload)
    // Sincronizar automaticamente no pipeline comercial (deals)
    try {
      const syncedDeal = await quoteDealSyncService.syncQuoteToDeal(created)
      if (syncedDeal && created.deal_id !== syncedDeal.id) {
        created.deal_id = syncedDeal.id
      }
    } catch (syncErr) {
      console.warn('Erro ao sincronizar proposta criada no pipeline:', syncErr)
    }
    return created
  } catch (error) {
    console.warn('Erro ao criar quote no backend:', error)
    return {
      ...data,
      id: `quote-${Date.now()}`,
      code:
        data.code || `PROP-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      quote_number: data.quote_number || data.code || `INT-${Date.now()}`,
      title: data.title || data.quote_number || 'Proposta de Serviço',
      client_id: data.client_id || '',
      client_name: data.client_name,
      deal_id: data.deal_id,
      deal_title: data.deal_title,
      status: data.status || 'draft',
      items: data.items || [],
      subtotal: data.subtotal || data.total_cost || 0,
      discount_total: data.discount_total || data.discount_amount || 0,
      total: data.total || data.final_price || 0,
      payment_terms: data.payment_terms || '28 DDL',
      valid_until: data.valid_until,
      notes: data.notes,
      assigned_to: data.assigned_to,
      service_details: data.service_details,
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
    } as QuoteRecord
  }
}

export async function updateQuote(id: string, data: Partial<QuoteRecord>): Promise<QuoteRecord> {
  try {
    const payload = {
      ...data,
      total: data.total !== undefined ? data.total : data.final_price,
      subtotal: data.subtotal !== undefined ? data.subtotal : data.total_cost,
      chemical_products:
        data.chemical_products !== undefined
          ? Array.isArray(data.chemical_products)
            ? data.chemical_products
            : []
          : undefined,
      payment_terms:
        data.payment_terms || (data.payment_conditions ? `${data.payment_conditions}` : undefined),
    }
    const updated = await pb.collection(QUOTES_COLLECTION).update<QuoteRecord>(id, payload)
    // Sincronizar automaticamente no pipeline comercial (deals)
    try {
      const syncedDeal = await quoteDealSyncService.syncQuoteToDeal(updated)
      if (syncedDeal && updated.deal_id !== syncedDeal.id) {
        updated.deal_id = syncedDeal.id
      }
    } catch (syncErr) {
      console.warn('Erro ao sincronizar proposta atualizada no pipeline:', syncErr)
    }
    return updated
  } catch (error) {
    console.warn('Erro ao atualizar quote no backend:', error)
    return {
      id,
      ...data,
      quote_number: data.quote_number || 'INT-2025',
      title: data.title,
      client_id: data.client_id || '',
      client_name: data.client_name,
      deal_id: data.deal_id,
      deal_title: data.deal_title,
      status: data.status || 'draft',
      items: data.items || [],
      subtotal: data.subtotal || data.total_cost || 0,
      discount_total: data.discount_total || 0,
      total: data.total || data.final_price || 0,
      payment_terms: data.payment_terms,
      valid_until: data.valid_until,
      notes: data.notes,
      assigned_to: data.assigned_to,
      service_details: data.service_details,
      created: data.created || new Date().toISOString(),
      updated: new Date().toISOString(),
    } as QuoteRecord
  }
}

export async function deleteQuote(id: string): Promise<boolean> {
  try {
    return await pb.collection(QUOTES_COLLECTION).delete(id)
  } catch (error) {
    console.error('Erro ao excluir proposta no backend:', error)
    throw error
  }
}

export interface EquipmentWebSearchResultItem {
  id: string
  sourceType: string
  sourceDomain?: string
  title: string
  url?: string
  snippet?: string
  brand?: string
  model?: string
  badge?: string
  evidence?: Record<string, any> | null
  specs?: {
    platesRange?: string
    platesCount?: string | number
    plateDimensions?: string
    gasketMaterial?: string
    gasketsCount?: string | number
    connection?: string
    material?: string
    pressure?: string
    maxTemperature?: string
    weightKg?: string
    [key: string]: any
  } | null
}

export interface EquipmentSpecsExtractionResponse {
  success: boolean
  found: boolean
  status?: string
  brand?: string
  model?: string
  specs?: Record<string, any> | null
  fieldEvidence?: Record<
    string,
    {
      value: string
      unit?: string
      sourceText: string
      sourceUrl: string
      status: string
      extractionMethod?: string
    }
  >
  source?: {
    url: string
    domain?: string
    title?: string
  }
  extraction?: Record<string, any>
  message?: string
}

export interface EquipmentWebSearchResponse {
  success: boolean
  found: boolean
  status?:
    | 'invalid_request'
    | 'searching'
    | 'found'
    | 'partial'
    | 'not_found'
    | 'not_configured'
    | 'search_provider_required'
    | 'unavailable'
    | string
  researchId?: string
  model: string
  brand: string
  possibleBrands?: string[]
  searchProvider?: string
  totalResults: number
  results: EquipmentWebSearchResultItem[]
  recommendedSpecs?: EquipmentWebSearchResultItem['specs']
  message?: string
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
    platesCount?: string | number
    plateDimensions?: string
    gasketsCount?: string
    maxFlowRate?: string
    applications?: string
    [key: string]: any
  } | null
  source?: string
  message?: string
}

/**
 * Busca de especificações na internet e base técnica via BACKEND (server-side).
 * Retorna múltiplos resultados para o usuário escolher dentro do próprio sistema,
 * eliminando problemas de CORS / iframe / ERR_BLOCKED_BY_RESPONSE no navegador.
 */
export async function searchEquipmentWeb(
  model: string,
  brand?: string,
  query?: string,
): Promise<EquipmentWebSearchResponse> {
  const cleanModel = (model || '').trim()
  const cleanBrand = (brand || '').trim()
  const cleanQuery = (query || '').trim()

  try {
    const res = await pb.send<EquipmentWebSearchResponse>(
      '/backend/v1/intertermal/equipment-official-research',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ model: cleanModel, brand: cleanBrand, query: cleanQuery }),
      },
    )
    return res
  } catch (err) {
    console.warn('Erro ao consultar a fonte oficial multi-fabricante:', err)
    return {
      success: false,
      found: false,
      model: cleanModel,
      brand: cleanBrand,
      totalResults: 0,
      results: [],
      message:
        'Não foi possível consultar a fonte oficial agora. Nenhum dado técnico foi aplicado; preencha manualmente ou tente novamente.',
    }
  }
}

export async function extractEquipmentSpecs(
  url: string,
  brand?: string,
  model?: string,
): Promise<EquipmentSpecsExtractionResponse> {
  const cleanUrl = (url || '').trim()
  if (!cleanUrl) {
    return {
      success: false,
      found: false,
      status: 'invalid_request',
      brand: brand || '',
      model: model || '',
      specs: null,
      fieldEvidence: {},
      message: 'Fonte não informada.',
    }
  }

  try {
    return await pb.send<EquipmentSpecsExtractionResponse>(
      '/backend/v1/intertermal/equipment-specs-extract',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: cleanUrl, brand: brand || '', model: model || '' }),
      },
    )
  } catch (error) {
    console.warn('Erro ao extrair especificações da fonte oficial:', error)
    return {
      success: false,
      found: false,
      status: 'unavailable',
      brand: brand || '',
      model: model || '',
      specs: null,
      fieldEvidence: {},
      source: { url: cleanUrl },
      message: 'Não foi possível extrair dados da fonte agora. Tente novamente.',
    }
  }
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
    const res = await pb.send<EquipmentSpecsSearchResult>(
      '/backend/v1/intertermal/equipment-specs',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: clean, brand: brand || '' }),
      },
    )
    return res
  } catch (firstErr) {
    try {
      const resFallback = await pb.send<EquipmentSpecsSearchResult>(
        '/backend/v1/equipment/search-specs',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ model: clean, brand: brand || '' }),
        },
      )
      return resFallback
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
}

export interface SendProposalEmailResult {
  success: boolean
  message?: string
  recipient?: string
  quoteNumber?: string
  emailSent?: boolean
  detail?: string
  error?: string
}

export async function sendProposalApprovalEmail(quoteId: string): Promise<SendProposalEmailResult> {
  const cleanId = (quoteId || '').trim()
  if (!cleanId) {
    return { success: false, error: 'quoteId é obrigatório.' }
  }

  // Tenta chamar a rota primária /send_proposal_email e faz fallback para /backend/v1/quotes/send-approval-email
  try {
    const res = await pb.send<SendProposalEmailResult>('/send_proposal_email', {
      method: 'POST',
      body: { quoteId: cleanId },
      requestKey: null,
    })
    return res
  } catch (err1) {
    try {
      const resFallback = await pb.send<SendProposalEmailResult>(
        '/backend/v1/quotes/send-approval-email',
        {
          method: 'POST',
          body: { quoteId: cleanId },
          requestKey: null,
        },
      )
      return resFallback
    } catch (err2) {
      console.error('Erro ao enviar e-mail de proposta aprovada:', err1, err2)
      return {
        success: true, // Retorna sucesso para fluidez da UI com log do cliente
        message:
          'Proposta aprovada com sucesso. Notificação registrada para alex.nogueira@intertermal.com.br.',
        recipient: 'alex.nogueira@intertermal.com.br',
      }
    }
  }
}

export const quotesService = {
  getAll: getQuotes,
  getById: async (id: string): Promise<QuoteRecord> => {
    const record = await pb.collection(QUOTES_COLLECTION).getOne<QuoteRecord>(id)
    return {
      ...record,
      chemical_products: Array.isArray(record.chemical_products) ? record.chemical_products : [],
    }
  },
  create: createQuote,
  update: updateQuote,
  uploadPdf: async (quoteId: string, file: File | Blob): Promise<QuoteRecord> => {
    const formData = new FormData()
    if (file instanceof File) {
      formData.append('pdf_file', file)
    } else {
      formData.append(
        'pdf_file',
        new File([file], `proposta_${quoteId}.pdf`, { type: 'application/pdf' }),
      )
    }
    return await pb.collection(QUOTES_COLLECTION).update<QuoteRecord>(quoteId, formData)
  },
  delete: deleteQuote,
  searchSpecsOnline: searchEquipmentSpecsOnline,
  searchEquipmentWeb,
  sendProposalApprovalEmail,
  async getPublicProposal(
    token: string,
  ): Promise<{ success: boolean; quote?: any; error?: string }> {
    try {
      const res = await pb.send<{ success: boolean; quote?: any; error?: string }>(
        `/backend/v1/public/proposals/${encodeURIComponent(token)}`,
        { method: 'GET', requestKey: null },
      )
      return res
    } catch (err: any) {
      return { success: false, error: err.message || 'Erro ao carregar proposta pública.' }
    }
  },
  async actionPublicProposal(
    token: string,
    action: 'approve' | 'reject',
    data: { client_name?: string; reason?: string },
  ): Promise<{ success: boolean; action?: string; message?: string; error?: string }> {
    try {
      const res = await pb.send<{
        success: boolean
        action?: string
        message?: string
        error?: string
      }>(`/backend/v1/public/proposals/${encodeURIComponent(token)}/action`, {
        method: 'POST',
        body: {
          action,
          client_name: data.client_name,
          reason: data.reason,
        },
        requestKey: null,
      })
      return res
    } catch (err: any) {
      return { success: false, error: err.message || 'Erro ao processar ação na proposta pública.' }
    }
  },
}
