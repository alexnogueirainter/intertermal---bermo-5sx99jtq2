migrate(
  (app) => {
    const productsCol = app.findCollectionByNameOrId('products')
    const quotesCol = app.findCollectionByNameOrId('quotes')
    const clientsCol = app.findCollectionByNameOrId('clients')
    const dealsCol = app.findCollectionByNameOrId('deals')

    // 1. Limpar produtos antigos genéricos
    try {
      app.truncateCollection(productsCol)
    } catch (_) {
      app.db().newQuery('DELETE FROM products').execute()
    }

    // 2. Inserir catálogo BERMO oficial
    const bermoProducts = [
      // Trocadores Gaxetados
      {
        code: 'BERMO-BP6',
        name: 'Trocador de Calor a Placas Gaxetado BP6',
        category: 'maintenance',
        description:
          'Altura 704mm, Largura 400mm, DN65, Temp Máx 180°C, Pressão 10 barg, Vazão 20 kg/s, Área 13m², Placas AISI 316L/Hastelloy/Titânio, Gaxetas NBR/EPDM/Viton.',
        price: 14500,
        cost: 9200,
        unit: 'un',
        is_active: true,
      },
      {
        code: 'BERMO-BP30',
        name: 'Trocador de Calor a Placas Gaxetado BP30',
        category: 'maintenance',
        description:
          'Altura 1150mm, Largura 480mm, DN100, Temp Máx 180°C, Pressão 16 barg, Vazão 55 kg/s, Área 45m², Placas AISI 316L/Titânio, Gaxetas NBR/EPDM.',
        price: 28900,
        cost: 18500,
        unit: 'un',
        is_active: true,
      },
      {
        code: 'BERMO-BP60',
        name: 'Trocador de Calor a Placas Gaxetado BP60',
        category: 'maintenance',
        description:
          'Altura 1680mm, Largura 620mm, DN150, Temp Máx 190°C, Pressão 16 barg, Vazão 120 kg/s, Área 120m², Placas AISI 316L/Titânio.',
        price: 52000,
        cost: 34000,
        unit: 'un',
        is_active: true,
      },
      {
        code: 'BERMO-BP6-SAN',
        name: 'Trocador de Calor a Placas BP6 Sanitário',
        category: 'maintenance',
        description:
          'Versão sanitária alimentícia, Tri-Clamp DN65, Temp Máx 160°C, Pressão 10 barg, Placas AISI 316L eletropolidas Ra < 0.8µm, Gaxetas EPDM FDA.',
        price: 19800,
        cost: 12800,
        unit: 'un',
        is_active: true,
      },
      {
        code: 'BERMO-BP30-SAN',
        name: 'Trocador de Calor a Placas BP30 Sanitário',
        category: 'maintenance',
        description:
          'Versão sanitária alimentícia de alta capacidade, Tri-Clamp DN100, Temp Máx 160°C, Pressão 16 barg, Gaxetas EPDM FDA.',
        price: 36500,
        cost: 23500,
        unit: 'un',
        is_active: true,
      },

      // Trocadores Brasados
      {
        code: 'BERMO-BL14',
        name: 'Trocador de Calor Brasado BL14',
        category: 'hardware',
        description:
          'Temp -195°C a 200°C, Projeto 30 bar, Teste 45 bar, Placas AISI 316L, Brasagem Cobre, Conexão rosca/solda 3/4".',
        price: 3200,
        cost: 1950,
        unit: 'un',
        is_active: true,
      },
      {
        code: 'BERMO-BL20',
        name: 'Trocador de Calor Brasado BL20',
        category: 'hardware',
        description:
          'Temp -195°C a 200°C, Projeto 30 bar, Teste 45 bar, Placas AISI 316L, Brasagem Cobre, Conexão 1" BSP/solda.',
        price: 4600,
        cost: 2800,
        unit: 'un',
        is_active: true,
      },
      {
        code: 'BERMO-BL26',
        name: 'Trocador de Calor Brasado BL26',
        category: 'hardware',
        description:
          'Temp -195°C a 200°C, Projeto 30 bar, Teste 45 bar, Placas AISI 316L, Brasagem Cobre, Conexão 1.1/4".',
        price: 6800,
        cost: 4100,
        unit: 'un',
        is_active: true,
      },
      {
        code: 'BERMO-BL26C',
        name: 'Trocador de Calor Brasado BL26C (Alta Pressão)',
        category: 'hardware',
        description:
          'Temp -195°C a 200°C, Projeto 45 bar, Teste 65 bar, Placas AISI 316L para fluidos de alta pressão e CO2.',
        price: 8400,
        cost: 5200,
        unit: 'un',
        is_active: true,
      },
      {
        code: 'BERMO-BL50',
        name: 'Trocador de Calor Brasado BL50',
        category: 'hardware',
        description:
          'Temp -195°C a 200°C, Projeto 30 bar, Teste 45 bar, Placas AISI 316L, Vazão até 35 m³/h, Conexão 2" ou Flange DN50.',
        price: 13900,
        cost: 8600,
        unit: 'un',
        is_active: true,
      },

      // Válvulas Borboleta (ARI Armaturen)
      {
        code: 'ARI-ZESA',
        name: 'Válvula Borboleta ARI-ZESA',
        category: 'hardware',
        description:
          'Furos alongados tipo Wafer, alavanca com trava, fluidos: água fria/quente/potável/processo, conexões flange/rosca/solda.',
        price: 1850,
        cost: 1100,
        unit: 'un',
        is_active: true,
      },
      {
        code: 'ARI-GESA',
        name: 'Válvula Borboleta ARI-GESA',
        category: 'hardware',
        description:
          'Furos roscados tipo Lug para fim de linha, alavanca com trava, vedação estanque EPDM/NBR.',
        price: 2400,
        cost: 1450,
        unit: 'un',
        is_active: true,
      },
      {
        code: 'ARI-ZIVA-Z',
        name: 'Válvula Borboleta ARI-ZIVA Z',
        category: 'hardware',
        description:
          'Furos alongados, alavanca com trava multiposição, disco hidrodinâmico com menor perda de carga.',
        price: 2100,
        cost: 1250,
        unit: 'un',
        is_active: true,
      },
      {
        code: 'ARI-ZIVA-G',
        name: 'Válvula Borboleta ARI-ZIVA G',
        category: 'hardware',
        description:
          'Furos roscados tipo Lug, alavanca com trava, ideal para manutenção sem esvaziamento da montante.',
        price: 2750,
        cost: 1650,
        unit: 'un',
        is_active: true,
      },
      {
        code: 'ARI-ZETRIX',
        name: 'Válvula Borboleta Triexcêntrica ARI-ZETRIX',
        category: 'hardware',
        description:
          'Triexcêntrica (Triple Offset), dupla flange, vedação metálica estanque (Zero Leakage) para vapor superaquecido.',
        price: 12500,
        cost: 7800,
        unit: 'un',
        is_active: true,
      },

      // Válvulas de Esfera
      {
        code: 'BERMO-VE-BIP-150',
        name: 'Válvula de Esfera Bipartida Passagem Plena Classe 150',
        category: 'hardware',
        description:
          'Bipartida flangeada ASME 150, passagem plena 100%, haste a prova de expulsão, vedação PTFE.',
        price: 1950,
        cost: 1150,
        unit: 'un',
        is_active: true,
      },
      {
        code: 'BERMO-VE-BIP-300',
        name: 'Válvula de Esfera Bipartida Passagem Plena Classe 300',
        category: 'hardware',
        description: 'Bipartida flangeada ASME 300 para vapor de alta pressão até 51 bar.',
        price: 3100,
        cost: 1850,
        unit: 'un',
        is_active: true,
      },
      {
        code: 'BERMO-VE-TRUNNION',
        name: 'Válvula de Esfera Tripartida Trunnion Classes 150/600/1500',
        category: 'hardware',
        description:
          'Tripartida Trunnion montada em munhão, dupla vedação DBB para dutos de gás e vapor sob alta pressão.',
        price: 8900,
        cost: 5400,
        unit: 'un',
        is_active: true,
      },
      {
        code: 'BERMO-VE-FORJ-800',
        name: 'Válvula de Esfera Tripartida Forjada Classe 800',
        category: 'hardware',
        description: 'Tripartida forjada em A105/F316 Classe 800 (138 bar), conexões NPT ou SW.',
        price: 1450,
        cost: 850,
        unit: 'un',
        is_active: true,
      },
      {
        code: 'BERMO-VE-TRIP-300',
        name: 'Válvula de Esfera Tripartida Classe 300',
        category: 'hardware',
        description: 'Tripartida Classe 300 flangeada/SW em Inox 316 ou Aço Carbono WCB.',
        price: 2600,
        cost: 1550,
        unit: 'un',
        is_active: true,
      },

      // Automação
      {
        code: 'BERMO-BTC-PANEL',
        name: 'Painel Total Control BTC',
        category: 'consulting',
        description:
          'Painel microprocessado para controle automático de purga de fundo, TDS e condutividade em caldeiras.',
        price: 9800,
        cost: 5900,
        unit: 'un',
        is_active: true,
      },
      {
        code: 'BERMO-DF-DFA40',
        name: 'Válvulas Descarga de Fundo DF/DFA-40',
        category: 'hardware',
        description:
          'Válvula tipo disco com acionamento manual ou pneumático para purga rápida de lodo em caldeiras PN40.',
        price: 6200,
        cost: 3700,
        unit: 'un',
        is_active: true,
      },
      {
        code: 'BERMO-CDP-4-8',
        name: 'Temporizador CDP-4 e CDP-8',
        category: 'hardware',
        description:
          'Temporizador digital cíclico programável para purga automática de condensado e válvulas solenoides.',
        price: 1850,
        cost: 950,
        unit: 'un',
        is_active: true,
      },
      {
        code: 'BERMO-TPB-102',
        name: 'Transmissor de Pressão TPB 102',
        category: 'hardware',
        description:
          'Transmissor piezorresistivo de alta estabilidade 4-20mA HART com sensor cerâmico/inox.',
        price: 2450,
        cost: 1350,
        unit: 'un',
        is_active: true,
      },
      {
        code: 'BERMO-TP-BASE',
        name: 'Transmissor de Pressão (modelo base)',
        category: 'hardware',
        description:
          'Transmissor de pressão analógico compacto 4-20mA 2 fios para centrais térmicas e utilidades.',
        price: 1650,
        cost: 900,
        unit: 'un',
        is_active: true,
      },

      // Acessórios Industriais
      {
        code: 'BERMO-SUV',
        name: 'Separadores de Umidade Verticais SUV',
        category: 'hardware',
        description:
          'Separador centrífugo vertical para eliminação de umidade em linhas de vapor e ar comprimido (>98% eficiência).',
        price: 5400,
        cost: 3200,
        unit: 'un',
        is_active: true,
      },
      {
        code: 'BERMO-WD-2010',
        name: 'Estação Misturadora Água/Vapor WD2010/WD2010L/WD2010H',
        category: 'hardware',
        description:
          'Geração instantânea e silenciosa de água quente por injeção direta de vapor com corte de segurança anti-queimadura.',
        price: 7900,
        cost: 4800,
        unit: 'un',
        is_active: true,
      },
      {
        code: 'BERMO-TC-COND',
        name: 'Compensadores de Condensado TC',
        category: 'hardware',
        description:
          'Vaso de condensação e equalização para tomadas de transmissores de nível e pressão diferencial em vapor.',
        price: 1980,
        cost: 1100,
        unit: 'un',
        is_active: true,
      },
      {
        code: 'BERMO-RA-STD',
        name: 'Resfriador de Amostra',
        category: 'hardware',
        description:
          'Trocador de calor tubular helicoidal para resfriamento seguro de amostras de água de caldeira.',
        price: 2850,
        cost: 1650,
        unit: 'un',
        is_active: true,
      },
      {
        code: 'BERMO-RA30-SAN',
        name: 'Resfriador de Amostra Sanitário RA30',
        category: 'hardware',
        description:
          'Resfriador de amostra desmontável em Aço Inox 316L sanitário eletropolido para vapor puro e água WFI.',
        price: 4800,
        cost: 2900,
        unit: 'un',
        is_active: true,
      },
    ]

    for (let p of bermoProducts) {
      const record = new Record(productsCol)
      record.set('code', p.code)
      record.set('name', p.name)
      record.set('category', p.category)
      record.set('description', p.description)
      record.set('price', p.price)
      record.set('cost', p.cost)
      record.set('unit', p.unit)
      record.set('is_active', p.is_active)
      app.save(record)
    }

    // 3. Atualizar Clientes Industriais Exemplo
    try {
      const clients = app.findRecordsByFilter('clients', '', '', 10, 0)
      if (clients.length > 0) {
        clients[0].set('name', 'Cervejaria Artesanal Catarinense S.A.')
        clients[0].set('company_name', 'Cervejaria Catarinense')
        clients[0].set('segment', 'Alimentos e Bebidas')
        clients[0].set('address', 'Rua Pomerode, 1500 - Salto do Norte')
        clients[0].set('city', 'Blumenau')
        clients[0].set('state', 'SC')
        clients[0].set(
          'notes',
          'Planta com 2 trocadores BP6 Sanitários para mosto cervejeiro e pasteurização.',
        )
        app.save(clients[0])
      }
      if (clients.length > 1) {
        clients[1].set('name', 'Usina Termoelétrica & Açúcar Santa Maria')
        clients[1].set('company_name', 'Usina Santa Maria')
        clients[1].set('segment', 'Sucroalcooleiro & Energia')
        clients[1].set('address', 'Rodovia SP-330, Km 280')
        clients[1].set('city', 'Ribeirão Preto')
        clients[1].set('state', 'SP')
        clients[1].set(
          'notes',
          'Parque térmico com caldeiras a vapor e necessidade de manutenção em válvulas ARI-ZETRIX e DF-40.',
        )
        app.save(clients[1])
      }
    } catch (_) {}

    // 4. Limpar e recriar Orçamentos com estrutura completa de Prestação de Serviços BERMO
    try {
      app.truncateCollection(quotesCol)
    } catch (_) {
      app.db().newQuery('DELETE FROM quotes').execute()
    }

    // Orçamento 1: Manutenção em Trocador BP6 Sanitário + Válvulas Borboleta
    const quote1 = new Record(quotesCol)
    quote1.set('quote_number', 'INT-2025-001')
    quote1.set('client_name', 'Cervejaria Artesanal Catarinense S.A.')
    quote1.set('status', 'approved')
    quote1.set('payment_terms', '28 DDL (Boleto Bancário)')
    quote1.set('valid_until', '2025-06-15 18:00:00.000Z')
    quote1.set('assigned_to', 'Alexandre Nogueira - Especialista Técnico')
    quote1.set('subtotal', 18450)
    quote1.set('discount_total', 0)
    quote1.set('total', 18450)
    quote1.set(
      'notes',
      'Serviço de desmontagem, limpeza química (CIP), substituição de gaxetas EPDM FDA em Trocador BP6 Sanitário e revisão de 4 Válvulas ARI-ZESA.',
    )
    quote1.set('items', [
      {
        name: 'Prestação de Serviços Especializados em Trocador BERMO BP6 Sanitário',
        quantity: 1,
        unit_price: 11200,
        discount: 0,
        total: 11200,
        bermo_specs: {
          productCode: 'BERMO-BP6-SAN',
          productModel: 'BP6 Sanitário',
          productBrand: 'BERMO',
          serviceScope:
            'Manutenção preventiva com troca de gaxetas alimentícias EPDM FDA e teste hidrostático',
          fluidType: 'agua_quente',
          inletTemp: 85,
          outletTemp: 25,
          operatingPressure: 4.5,
          flowRate: 15,
          equipmentSize: 'DN65 / 48 Placas Inox 316L',
        },
      },
      {
        name: 'Mão de Obra Técnica Especializada (Técnico + Ajudante + Inspetor NDT)',
        quantity: 1,
        unit_price: 4850,
        discount: 0,
        total: 4850,
      },
      {
        name: 'Deslocamento Técnico, Hospedagem e Logística Operacional',
        quantity: 1,
        unit_price: 2400,
        discount: 0,
        total: 2400,
      },
    ])
    app.save(quote1)

    // Orçamento 2: Revisão de Válvulas Triexcêntricas ARI-ZETRIX e Descarga de Fundo DF-40
    const quote2 = new Record(quotesCol)
    quote2.set('quote_number', 'INT-2025-002')
    quote2.set('client_name', 'Usina Termoelétrica & Açúcar Santa Maria')
    quote2.set('status', 'sent')
    quote2.set('payment_terms', '14 DDL (Entrada e Saldo Faturado)')
    quote2.set('valid_until', '2025-06-20 18:00:00.000Z')
    quote2.set('assigned_to', 'Alexandre Nogueira - Especialista Técnico')
    quote2.set('subtotal', 32800)
    quote2.set('discount_total', 800)
    quote2.set('total', 32000)
    quote2.set(
      'notes',
      'Overhaul completo em 2 Válvulas Borboleta Triexcêntricas ARI-ZETRIX DN200 e substituição de sede em Válvula DF-40 de purga de caldeira.',
    )
    quote2.set('items', [
      {
        name: 'Serviço de Lapidação de Sede e Vedação Metal x Metal ARI-ZETRIX',
        quantity: 2,
        unit_price: 9800,
        discount: 400,
        total: 19200,
        bermo_specs: {
          productCode: 'ARI-ZETRIX',
          productModel: 'ARI-ZETRIX Triexcêntrica',
          productBrand: 'ARI Armaturen',
          serviceScope: 'Overhaul de estanqueidade Zero Leakage para vapor superaquecido',
          fluidType: 'vapor',
          inletTemp: 320,
          outletTemp: 320,
          operatingPressure: 28,
          flowRate: 45,
          equipmentSize: 'DN200 Classe 300',
        },
      },
      {
        name: 'Serviço de Revisão e Calibração de Painel Total Control BTC + Válvula DF-40',
        quantity: 1,
        unit_price: 6800,
        discount: 400,
        total: 6400,
      },
      {
        name: 'Equipe de Campo (2 Técnicos + 1 Inspetor) + Deslocamento e Estadia',
        quantity: 1,
        unit_price: 6400,
        discount: 0,
        total: 6400,
      },
    ])
    app.save(quote2)

    // Orçamento 3: Instalação de Estação Misturadora WD2010 e Resfriador de Amostra
    const quote3 = new Record(quotesCol)
    quote3.set('quote_number', 'INT-2025-003')
    quote3.set('client_name', 'Frigorífico Aurora Alimentos')
    quote3.set('status', 'draft')
    quote3.set('payment_terms', '30 DDL (Negociação Direta)')
    quote3.set('valid_until', '2025-06-30 18:00:00.000Z')
    quote3.set('assigned_to', 'Alexandre Nogueira - Especialista Técnico')
    quote3.set('subtotal', 14200)
    quote3.set('discount_total', 0)
    quote3.set('total', 14200)
    quote3.set(
      'notes',
      'Start-up e comissionamento de Estação Misturadora Água/Vapor WD2010 para higienização e instalação de Resfriador de Amostra RA30 Sanitário.',
    )
    quote3.set('items', [
      {
        name: 'Instalação & Comissionamento de Estação Misturadora BERMO WD2010',
        quantity: 1,
        unit_price: 8900,
        discount: 0,
        total: 8900,
        bermo_specs: {
          productCode: 'BERMO-WD-2010',
          productModel: 'Estação Misturadora Água/Vapor WD2010',
          productBrand: 'BERMO',
          serviceScope: 'Instalação mecânica, tubulação de vapor e água, teste de corte térmico',
          fluidType: 'vapor',
          inletTemp: 140,
          outletTemp: 65,
          operatingPressure: 6,
          flowRate: 8,
          equipmentSize: '3/4" BSP Inox',
        },
      },
      {
        name: 'Mão de Obra e Deslocamento Rodoviário Integrado',
        quantity: 1,
        unit_price: 5300,
        discount: 0,
        total: 5300,
      },
    ])
    app.save(quote3)
  },
  (app) => {},
)
