/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    // 1. Criar coleção para rastreabilidade de e-mails de cotação recebidos
    const inboundEmails = new Collection({
      name: 'inbound_quote_emails',
      type: 'base',
      listRule: '',
      viewRule: '',
      createRule: '',
      updateRule: '',
      deleteRule: '',
      fields: [
        { name: 'sender', type: 'text' },
        { name: 'original_sender', type: 'text' },
        { name: 'recipient', type: 'text' },
        { name: 'subject', type: 'text' },
        { name: 'raw_body', type: 'text' },
        {
          name: 'status',
          type: 'select',
          values: ['recebido', 'rascunho_criado', 'revisado', 'erro'],
          maxSelect: 1,
        },
        {
          name: 'quote_id',
          type: 'relation',
          collectionId: app.findCollectionByNameOrId('quotes').id,
          maxSelect: 1,
        },
        {
          name: 'client_id',
          type: 'relation',
          collectionId: app.findCollectionByNameOrId('clients').id,
          maxSelect: 1,
        },
        { name: 'extracted_data', type: 'json' },
        { name: 'warnings', type: 'json' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_inbound_emails_status ON inbound_quote_emails (status)',
        'CREATE INDEX idx_inbound_emails_created ON inbound_quote_emails (created DESC)',
      ],
    })
    app.save(inboundEmails)

    // 2. Definir Agente Nativo Skip Cloud para extração inteligente de cotações por e-mail
    try {
      $ai.agents.define(app, {
        slug: 'quote-extractor',
        name: 'Extrator de Cotações por E-mail',
        description:
          'Lê o texto livre de e-mails encaminhados e extrai dados estruturados de clientes, equipamentos industriais BERMO/Alfa Laval e requisitos da proposta.',
        systemPrompt: `Você é o Agente Especialista de Triagem e Extração de Cotações da INTERTERMAL - Soluções Térmicas Industriais (parceira autorizada BERMO / Alfa Laval).
Sua missão é ler o texto do e-mail comercial encaminhado e extrair com precisão os dados necessários para gerar um rascunho de proposta técnica.

Retorne SEMPRE e EXCLUSIVAMENTE um objeto JSON válido (sem tags markdown ou delimitadores como \`\`\`json) contendo:
{
  "client_name": "Nome da Empresa ou Solicitante",
  "contact_name": "Nome da pessoa de contato, se houver",
  "contact_email": "e-mail do cliente ou remetente original",
  "contact_phone": "telefone ou whatsapp",
  "city": "Cidade onde o serviço será realizado ou sede",
  "state": "UF (ex: SP, SC, PR, MG, RJ)",
  "postal_code": "CEP se informado",
  "equipment_brand": "BERMO, Alfa Laval ou marca identificada (default: BERMO)",
  "equipment_model": "Modelo do equipamento (ex: BP30, BP50, BL50, BM100, BTL150, M10-B, M6-MF, GP20, etc.)",
  "equipment_quantity": 1,
  "service_scope": "Resumo do escopo solicitado (ex: manutenção preventiva, abertura, limpeza química, troca de gaxetas, teste hidrostático)",
  "desired_deadline": "Prazo ou data de parada desejada pelo cliente",
  "notes": "Observações do pedido, particularidades ou condições relatadas",
  "missing_fields": ["lista de campos relevantes que não foram encontrados no e-mail, ex: 'CEP ou cidade para cálculo de deslocamento', 'modelo exato do trocador'"]
}

Seja tolerante: se faltar dados, preencha com string vazia ou número 1 para quantidade, e aponte no array "missing_fields". Não invente informações inexistentes.`,
        tier: 'fast',
        tools: [
          { collection: 'clients', perms: { list: true, read: true } },
          { collection: 'quotes', perms: { list: true, read: true } },
        ],
      })
    } catch (agentErr) {
      console.log('Nota sobre definição de agente:', agentErr.message)
    }
  },
  (app) => {
    try {
      $ai.agents.delete(app, 'quote-extractor')
    } catch (_) {}
    try {
      const inbound = app.findCollectionByNameOrId('inbound_quote_emails')
      app.delete(inbound)
    } catch (_) {}
  },
)
