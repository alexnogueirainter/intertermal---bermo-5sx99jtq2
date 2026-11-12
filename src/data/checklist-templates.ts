// Templates do Checklist Digital de Manutenção — conteúdo em código (não editável pela tela).
// Família: trocador a placas, válvulas de segurança/controle, purgadores de vapor.
// Fontes: Alex (HTML original), ARI/Bermo, API 527/576, NR-13, Spirax Sarco, TLV,
// histórico de inspeções VKP no CRM (JBS). Sujeito à validação da Bermo.

export type ChecklistItemType = {
  etapa: number
  num: number
  titulo: string
  criterio: string
}

export type ChecklistTemplateType = {
  id: 'trocador' | 'valvulas' | 'purgadores'
  nome: string
  subtitulo: string
  etapas: { n: number; nome: string; cor: string }[]
  itens: ChecklistItemType[]
  camposEspecificos: {
    key: string
    label: string
    tipo?: 'text' | 'number'
    obrigatorio?: boolean
    helper?: string
  }[]
  secoes: { key: string; label: string; placeholder: string }[]
}

const ETAPAS_TROCADOR = [
  { n: 1, nome: 'Recebimento e registro', cor: '#0D193E' },
  { n: 2, nome: 'Inspeção externa e diagnóstico', cor: '#0077B6' },
  { n: 3, nome: 'Desmontagem', cor: '#1d4f91' },
  { n: 4, nome: 'Limpeza', cor: '#0b6e6e' },
  { n: 5, nome: 'Montagem', cor: '#5a3e8c' },
  { n: 6, nome: 'Teste e entrega', cor: '#b35f00' },
]

const ETAPAS_VALVULAS = [
  { n: 1, nome: 'Recebimento e registro', cor: '#0D193E' },
  { n: 2, nome: 'Inspeção externa e diagnóstico', cor: '#0077B6' },
  { n: 3, nome: 'Desmontagem', cor: '#1d4f91' },
  { n: 4, nome: 'Limpeza e inspeção interna', cor: '#0b6e6e' },
  { n: 5, nome: 'Montagem e ajuste', cor: '#5a3e8c' },
  { n: 6, nome: 'Teste e entrega', cor: '#b35f00' },
]

const ITENS_TROCADOR: ChecklistItemType[] = [
  [
    1,
    1,
    'Identificação do equipamento pela placa de identificação',
    'Tipo, nº de fabricação, pressões e temperaturas permitidas, pressão de teste e medida A máx./mín. conferidos e registrados na OS',
  ],
  [
    1,
    2,
    'Registro fotográfico antes da intervenção',
    'Mínimo 4 fotos (geral, borda do pacote, conexões, placa de identificação)',
  ],
  [
    1,
    3,
    'Levantamento do histórico com o cliente',
    'Fluidos, tempo desde a última limpeza e sintoma registrados',
  ],
  [
    1,
    4,
    'Medida A de referência registrada antes de afrouxar qualquer parafuso',
    'Valor em mm anotado e conferido com a placa de identificação',
  ],
  [
    1,
    5,
    'Conferência da garantia do equipamento antes da abertura',
    'Garantia verificada junto ao fabricante ou distribuidor',
  ],
  [
    2,
    6,
    'Vazamentos externos nas bordas do pacote e nas conexões',
    'Nenhum ponto de vazamento ativo',
  ],
  [
    2,
    7,
    'Paralelismo entre chapa fixa e chapa móvel',
    'Chapas paralelas, sem desalinhamento visível',
  ],
  [
    2,
    8,
    'Deformação ou empenamento de chapas, pés de apoio e barramentos',
    'Sem deformação ou empenamento',
  ],
  [2, 9, 'Desgaste de buchas e suportes dos fusos', 'Sem folga ou desgaste excessivo'],
  [
    2,
    10,
    'Teste da unha nas gaxetas',
    'A marca da unha desaparece (gaxeta elástica). Se a marca permanecer, gaxeta endurecida — substituir',
  ],
  [
    2,
    11,
    'Cortes, achatamento, trincas, ressecamento e encaixe da gaxeta no canal',
    'Gaxeta íntegra e bem assentada no canal',
  ],
  [
    3,
    12,
    'Escovação e lubrificação das roscas dos tirantes antes de afrouxar',
    'Roscas limpas e lubrificadas',
  ],
  [
    3,
    13,
    'Lubrificação dos barramentos superior e inferior',
    'Barramentos lubrificados e livres de corrosão',
  ],
  [
    3,
    14,
    'Afrouxamento em cruz (em X), em incrementos de no máximo 10 mm por aperto',
    'Chapas mantidas paralelas durante toda a abertura',
  ],
  [
    3,
    15,
    'Retirada das placas na mesma ordem de saída, apoiadas em cavalete ou caixa',
    'Ordem preservada e identificada',
  ],
  [
    3,
    16,
    'Verificação de que nenhuma placa saiu da guia ou virou durante a abertura',
    'Nenhuma placa danificada na desmontagem',
  ],
  [
    4,
    17,
    'Lavagem de cada placa nos dois lados com água morna e escova macia',
    'Placa limpa nos dois lados, sem resíduo visível',
  ],
  [
    4,
    18,
    'Uso de escova de cerdas macias (nunca escova ou palha de aço)',
    'Nenhuma ferramenta metálica usada nas placas',
  ],
  [
    4,
    19,
    'Limpeza reforçada da parte inferior de cada placa e do verso onde a gaxeta assenta',
    'Parte inferior e assento da gaxeta limpos',
  ],
  [
    4,
    20,
    'Secagem das gaxetas com pano antes da montagem',
    'Gaxetas secas e sem partículas grudadas',
  ],
  [
    4,
    21,
    'Enxágue imediato após uso de produto químico',
    'Nenhum resíduo de produto na placa ou gaxeta',
  ],
  [
    4,
    22,
    'Registro do produto químico usado (nome, concentração, temperatura, tempo)',
    'Parâmetros registrados conforme o fabricante do equipamento',
  ],
  [
    4,
    23,
    'Confirmação de que nenhum produto proibido foi utilizado',
    'Nenhum uso de ácido clorídrico/muriático, cloro/hipoclorito ou solvente inflamável',
  ],
  [
    4,
    24,
    'Ensaio por líquido penetrante',
    'Ensaio realizado conforme procedimento do fabricante, sem indicação de trinca ou fissura nas placas',
  ],
  [
    5,
    25,
    'Conferência da ordem e da posição das placas conforme o projeto',
    'Sequência idêntica ao desenho, com alternância de fluxo esquerdo/direito',
  ],
  [
    5,
    26,
    'Conferência da gaxeta: encaixada no canal, sem torção e sem resíduo embaixo',
    'Todas as gaxetas corretamente posicionadas',
  ],
  [
    5,
    27,
    'Verificação do padrão "favo de mel" na vista lateral do pacote',
    'Bordas formando padrão regular, sem irregularidade',
  ],
  [
    5,
    28,
    'Contagem das placas (mínimo duas conferências) contra o desenho do projeto',
    'Quantidade confere com o projeto',
  ],
  [
    5,
    29,
    'Aperto em cruz, em incrementos pequenos, até atingir a medida A',
    'Medida A atingida, chapas paralelas, sem apertar além de A',
  ],
  [
    6,
    30,
    'Teste de estanqueidade hidrostática, um lado por vez com o outro aberto para a atmosfera',
    'Teste realizado nos dois lados',
  ],
  [
    6,
    31,
    'Pressão de teste = pressão de operação + 10%, nunca acima da pressão de projeto',
    'Pressão registrada dentro do limite',
  ],
  [6, 32, 'Tempo de teste de 10 minutos por lado', '10 minutos cumpridos em cada lado'],
  [6, 33, 'Verificação de vazamento após o teste', 'Nenhum vazamento interno ou externo'],
  [
    6,
    34,
    'Secagem do equipamento após o teste (quando o fluido não puder se misturar com água)',
    'Equipamento seco',
  ],
  [
    6,
    35,
    'Registro fotográfico final e assinatura do cliente',
    'Fotos anexadas e checklist assinado',
  ],
].map((r) => ({ etapa: r[0], num: r[1], titulo: r[2], criterio: r[3] }))

const ITENS_VALVULAS: ChecklistItemType[] = [
  [
    1,
    1,
    'Plaqueta de identificação conferida e registrada',
    'Tipo, fabricante, modelo, DN, nº de série, pressão de ajuste e capacidade conferidos com a plaqueta',
  ],
  [
    1,
    2,
    'Registro fotográfico antes da intervenção',
    'Mínimo 3 fotos: vista geral, plaqueta e lacre atual',
  ],
  [
    1,
    3,
    'Histórico levantado com o cliente',
    'Sintoma relatado, fluido, data da última prova e nº do lacre anterior registrados',
  ],
  [
    1,
    4,
    'Estado do lacre registrado',
    'Lacre íntegro ou rompido anotado antes da abertura — rompido sinaliza intervenção não autorizada',
  ],
  [
    1,
    5,
    'Garantia e conformidade conferidas',
    'Garantia verificada junto ao fabricante/distribuidor antes da desmontagem',
  ],
  [2, 6, 'Vazamentos externos nas conexões e flanges', 'Nenhum ponto de vazamento ativo'],
  [2, 7, 'Corrosão e revestimento do corpo', 'Corpo sem corrosão severa; revestimento íntegro'],
  [2, 8, 'Condição do lacre e da etiqueta de calibração', 'Lacre e etiqueta legíveis e íntegros'],
  [
    2,
    9,
    'Livre movimentação das partes expostas',
    'Alavanca de alívio (quando houver) opera sem travamento',
  ],
  [
    2,
    10,
    'Montagem e orientação na instalação',
    'Válvula montada na vertical, saída livre, sem esforço na tubulação',
  ],
  [
    3,
    11,
    'Marcação da posição dos componentes antes da abertura',
    'Tampa, anel de ajuste e porca da mola marcados',
  ],
  [
    3,
    12,
    'Afrouxamento gradual e registro da ordem de retirada',
    'Ordem registrada; componentes identificados',
  ],
  [
    3,
    13,
    'Proteção das superfícies de assento e do disco',
    'Superfícies protegidas contra impacto durante a desmontagem',
  ],
  [
    3,
    14,
    'Retirada da mola com registro da posição do anel de ajuste',
    'Voltas do anel e compressão da mola anotadas',
  ],
  [3, 15, 'Registro fotográfico das partes internas', 'Fotos do assento, disco, mola e guias'],
  [
    4,
    16,
    'Limpeza do corpo e dos internos com produto adequado',
    'Sem resíduo; nunca escova ou palha de aço no assento',
  ],
  [
    4,
    17,
    'Inspeção do assento e do disco',
    'Sem erosão, corrosão ou sulcos que comprometam a estanqueidade',
  ],
  [
    4,
    18,
    'Lapidação do assento quando necessário',
    'Lapidação executada e conferida — contato contínuo',
  ],
  [
    4,
    19,
    'Verificação da mola',
    'Comprimento livre e cargas conforme manual; sem trincas ou deformação',
  ],
  [
    4,
    20,
    'Substituição de juntas, gaxetas e O-rings',
    'Peças de vedação novas, material compatível com o fluido',
  ],
  [
    4,
    21,
    'Registro das peças substituídas',
    'Lista de peças com códigos registrada — alimenta o custo da OS',
  ],
  [
    5,
    22,
    'Montagem na ordem do manual do fabricante',
    'Sequência idêntica ao manual; marcas de posição respeitadas',
  ],
  [
    5,
    23,
    'Ajuste da pressão de ajuste em bancada',
    'Pressão de ajuste atingida conforme plaqueta — tolerância ±3%',
  ],
  [
    5,
    24,
    'Posição do anel de ajuste conforme manual',
    'Anel reposicionado conforme registro da desmontagem',
  ],
  [5, 25, 'Torque final dos parafusos', 'Torque conforme especificação do fabricante'],
  [5, 26, 'Lacre aplicado após o ajuste', 'Novo lacre aplicado e nº registrado'],
  [
    6,
    27,
    'Prova da pressão de ajuste em bancada',
    'Valor obtido registrado e comparado à plaqueta (±3%)',
  ],
  [
    6,
    28,
    'Prova de estanqueidade do assento (API 527)',
    'Estanqueidade conforme critério de bolhas da API 527',
  ],
  [
    6,
    29,
    'Pressão de reassentamento registrada',
    'Reassentamento dentro da faixa do fabricante (blowdown)',
  ],
  [6, 30, 'Registro fotográfico final', 'Fotos da plaqueta, lacre novo e válvula montada'],
  [6, 31, 'Assinatura do cliente', 'Checklist e certificado assinados pelo cliente'],
  [
    6,
    32,
    'Certificado de prova emitido',
    'Certificado com valores de prova, nº do lacre e próxima revisão',
  ],
].map((r) => ({ etapa: r[0], num: r[1], titulo: r[2], criterio: r[3] }))

const ETAPAS_PURGADORES = [
  { n: 1, nome: 'Recebimento e registro', cor: '#0D193E' },
  { n: 2, nome: 'Diagnóstico com equipamento VKP', cor: '#0077B6' },
  { n: 3, nome: 'Isolamento e desmontagem', cor: '#1d4f91' },
  { n: 4, nome: 'Inspeção e preparo', cor: '#0b6e6e' },
  { n: 5, nome: 'Instalação', cor: '#5a3e8c' },
  { n: 6, nome: 'Teste e entrega', cor: '#b35f00' },
]

const ITENS_PURGADORES: ChecklistItemType[] = [
  [
    1,
    1,
    'TAG ARI e TAG do cliente conferidas no local',
    'TAGs batem com o registro da inspeção VKP de origem',
  ],
  [
    1,
    2,
    'Registro fotográfico antes da intervenção',
    'Mínimo 3 fotos: vista geral, TAG e isolamento da linha',
  ],
  [
    1,
    3,
    'Diagnóstico da inspeção confirmado em campo',
    'Resultado (Vazando/Represando/Parado) e perda kg/h conferidos com a inspeção de origem',
  ],
  [
    1,
    4,
    'Tipo e modelo do purgador identificados',
    'Termodinâmico, bóia, balança, invertido ou termostático conforme corpo/plaqueta',
  ],
  [
    1,
    5,
    'Permissão de trabalho confirmada com o cliente',
    'Isolamento e despressurização autorizados pelo responsável da planta',
  ],
  [
    2,
    6,
    'Teste VKP de conferência realizado',
    'Equipamento VKP 10/42/42 Ex conectado conforme procedimento',
  ],
  [2, 7, 'Resultado de entrada classificado', 'Vazando, Represando, Parado ou OK — padrão Bermo'],
  [
    2,
    8,
    'Perda de entrada registrada em kg/h',
    'Valor medido pelo equipamento, não estimativa visual',
  ],
  [
    2,
    9,
    'Decisão registrada: substituir ou reparar',
    'Vazando → substituição · Represando → analisar instalação · Parado → nova inspeção',
  ],
  [
    2,
    10,
    'Peça de reposição conferida',
    'Novo purgador ou kit de reparo compatível com modelo, DN e pressão',
  ],
  [
    3,
    11,
    'Bloqueio e despressurização executados',
    'Linha isolada, zero energia, travas aplicadas conforme permissão',
  ],
  [
    3,
    12,
    'Drenagem e alívio de pressão confirmados',
    'Linha aberta sem pressão e sem temperatura antes da remoção',
  ],
  [
    3,
    13,
    'Remoção do purgador sem dano às conexões',
    'Chaves adequadas, flanges e roscas preservados',
  ],
  [
    3,
    14,
    'Proteção das tubulações abertas',
    'Tampas/vedação para evitar entrada de sujeira na linha',
  ],
  [3, 15, 'Registro fotográfico da desmontagem', 'Fotos das conexões e do purgador retirado'],
  [
    4,
    16,
    'Inspeção do mecanismo interno do purgador retirado',
    'Disco, cápsula ou bóia sem erosão, trinca ou deformação',
  ],
  [
    4,
    17,
    'Inspeção do filtro/strainer da linha',
    'Tela limpa ou substituída — entupimento é causa frequente de falha',
  ],
  [
    4,
    18,
    'Estado das juntas e gaxetas avaliado',
    'Vedação nova, material compatível com vapor e temperatura',
  ],
  [
    4,
    19,
    'Limpeza das conexões e flanges',
    'Faces de assentamento limpas, sem resíduo de junta antiga',
  ],
  [4, 20, 'Registro das peças substituídas', 'Lista com códigos — alimenta o custo da OS'],
  [5, 21, 'Orientação de fluxo conferida', 'Seta do corpo no sentido do fluxo do vapor'],
  [
    5,
    22,
    'Montagem na posição exigida pelo fabricante',
    'Orientação (vertical/horizontal) conforme manual do modelo',
  ],
  [5, 23, 'Juntas novas instaladas', 'Sem reuso de junta antiga'],
  [5, 24, 'Torque final em cruz', 'Aperto gradual e cruzado, sem sobrecarregar o corpo'],
  [5, 25, 'Etiqueta/lacre do serviço aplicada', 'Identificação do serviço e data no purgador'],
  [
    5,
    26,
    'Registro fotográfico da instalação final',
    'Purgador instalado, identificado e acessível',
  ],
  [6, 27, 'Teste VKP final realizado', 'Purgador operando — resultado OK no equipamento'],
  [
    6,
    28,
    'Perda final registrada em kg/h',
    'Medida no teste final — alimenta a economia do relatório',
  ],
  [6, 29, 'Verificação de vazamentos externos', 'Conexões secas após aquecimento da linha'],
  [6, 30, 'Termografia final (quando aplicável)', 'Temperatura de operação confirmada na carcaça'],
  [
    6,
    31,
    'Área liberada e isolamentos recolocados',
    'Cliente valida a entrega e a limpeza do local',
  ],
  [6, 32, 'Assinatura do cliente no relatório', 'Registro do aceite do serviço'],
].map((r) => ({ etapa: r[0], num: r[1], titulo: r[2], criterio: r[3] }))

const CAMPOS_TROCADOR = [
  {
    key: 'medRef',
    label: 'Medida A de referência (mm)',
    tipo: 'number',
    obrigatorio: true,
    helper: 'Antes de afrouxar qualquer parafuso',
  },
  {
    key: 'medFim',
    label: 'Medida A final (mm)',
    tipo: 'number',
    obrigatorio: true,
    helper: 'Após o aperto final',
  },
  {
    key: 'pressaoTeste',
    label: 'Pressão de teste (bar)',
    tipo: 'number',
    helper: 'Operação + 10%, nunca acima da de projeto',
  },
  {
    key: 'tempoTeste',
    label: 'Tempo de teste (min)',
    tipo: 'number',
    helper: 'Mínimo 10 min por lado',
  },
  { key: 'placas', label: 'Total de placas', tipo: 'number', helper: 'Quantidade no pacote' },
]

const CAMPOS_VALVULAS = [
  {
    key: 'pRef',
    label: 'Pressão de ajuste — plaqueta (bar)',
    tipo: 'number',
    obrigatorio: true,
    helper: 'Referência da plaqueta; tolerância da prova ±3%',
  },
  {
    key: 'pObt',
    label: 'Pressão de ajuste obtida (bar)',
    tipo: 'number',
    obrigatorio: true,
    helper: 'Lida na bancada; fora de ±3% reprova',
  },
  {
    key: 'pRea',
    label: 'Pressão de reassentamento (bar)',
    tipo: 'number',
    helper: 'Blowdown — faixa do fabricante',
  },
  { key: 'lacre', label: 'Nº do lacre novo', helper: 'Aplicado após o ajuste' },
]

const CAMPOS_PURGADORES = [
  { key: 'tagAri', label: 'TAG ARI', origem: 'inspecao' },
  { key: 'tagCli', label: 'TAG do cliente', origem: 'inspecao' },
  { key: 'termo', label: 'Nº termografia', origem: 'inspecao' },
  { key: 'diag', label: 'Diagnóstico da inspeção', origem: 'inspecao' },
  { key: 'perdaAntes', label: 'Perda de entrada (kg/h)', tipo: 'number', origem: 'inspecao' },
  {
    key: 'perdaDep',
    label: 'Perda final medida (kg/h)',
    tipo: 'number',
    obrigatorio: true,
    helper: 'Medida no teste final; alimenta a economia',
  },
  {
    key: 'pressao',
    label: 'Pressão de operação (bar)',
    tipo: 'number',
    helper: 'Ler no manômetro da linha',
  },
  { key: 'vkp', label: 'Equipamento de teste', helper: 'VKP 10 / 42 / 42 Ex' },
]

const SECOES_TROCADOR = [
  {
    key: 'estadoInicial',
    label: 'Estado inicial do equipamento',
    placeholder: 'Aspecto externo, conexões, vazamentos, sintomas e condição das gaxetas.',
  },
  {
    key: 'procedimentos',
    label: 'Procedimentos realizados e análise técnica',
    placeholder: 'Procedimentos executados na ordem em que ocorreram e análise dos achados.',
  },
  {
    key: 'montagem',
    label: 'Montagem e fechamento do equipamento',
    placeholder: 'Ordem e posição das placas, padrão de gaxetas, contagem e aperto até a medida A.',
  },
  {
    key: 'ensaio',
    label: 'Ensaio de pressão — resultado',
    placeholder:
      'Pressão de teste, tempo por lado, condição observada e conclusão sobre estanqueidade.',
  },
  {
    key: 'conclusao',
    label: 'Conclusão',
    placeholder: 'Resultado geral e se o equipamento está apto a retornar à operação.',
  },
  {
    key: 'recomendacoes',
    label: 'Recomendações e plano de ação',
    placeholder: 'Ações recomendadas, prazos e responsáveis para pendências.',
  },
  {
    key: 'observacoes',
    label: 'Observações gerais',
    placeholder: 'Informações adicionais relevantes ao serviço.',
  },
]

const SECOES_VALVULAS = [
  {
    key: 'estadoInicial',
    label: 'Estado inicial e lacre',
    placeholder: 'Estado da válvula ao chegar, lacre íntegro ou rompido, sintomas relatados.',
  },
  {
    key: 'procedimentos',
    label: 'Procedimentos realizados e análise técnica',
    placeholder: 'Desmontagem, inspeção de assento/disco/mola, lapidação e substituições.',
  },
  {
    key: 'ensaio',
    label: 'Prova da pressão de ajuste',
    placeholder: 'Plaqueta × bancada, desvio, reassentamento e estanqueidade API 527.',
  },
  {
    key: 'conclusao',
    label: 'Conclusão',
    placeholder: 'Válvula apta ou não a retornar à operação.',
  },
  {
    key: 'recomendacoes',
    label: 'Recomendações e plano de ação',
    placeholder: 'Ações recomendadas, prazos e responsáveis.',
  },
  {
    key: 'observacoes',
    label: 'Observações gerais',
    placeholder: 'Informações adicionais relevantes ao serviço.',
  },
]

const SECOES_PURGADORES = [
  {
    key: 'diagOrigem',
    label: 'Diagnóstico de origem (inspeção VKP)',
    placeholder: 'Resultado da inspeção que gerou esta OS e teste de conferência em campo.',
  },
  {
    key: 'servico',
    label: 'Serviço executado',
    placeholder: 'Isolamento, remoção, inspeção de mecanismo e filtro, instalação e teste final.',
  },
  {
    key: 'ensaio',
    label: 'Resultado do teste final',
    placeholder: 'Teste VKP final, vazamentos e perda final em kg/h.',
  },
  {
    key: 'conclusao',
    label: 'Conclusão',
    placeholder: 'Purgador apto à operação e próxima inspeção recomendada.',
  },
  {
    key: 'observacoes',
    label: 'Observações gerais',
    placeholder: 'Informações adicionais relevantes ao serviço.',
  },
]

export const CHECKLIST_TEMPLATES: Record<string, ChecklistTemplateType> = {
  trocador: {
    id: 'trocador',
    nome: 'Trocador de calor a placas',
    subtitulo: 'Manutenção com medida A e teste hidrostático',
    etapas: ETAPAS_TROCADOR,
    itens: ITENS_TROCADOR,
    camposEspecificos: CAMPOS_TROCADOR,
    secoes: SECOES_TROCADOR,
  },
  valvulas: {
    id: 'valvulas',
    nome: 'Válvula de segurança / controle',
    subtitulo: 'Prova de pressão com tolerância ±3%',
    etapas: ETAPAS_VALVULAS,
    itens: ITENS_VALVULAS,
    camposEspecificos: CAMPOS_VALVULAS,
    secoes: SECOES_VALVULAS,
  },
  purgadores: {
    id: 'purgadores',
    nome: 'Purgador de vapor',
    subtitulo: 'Ligado à inspeção VKP de origem, com economia recuperada',
    etapas: ETAPAS_PURGADORES,
    itens: ITENS_PURGADORES,
    camposEspecificos: CAMPOS_PURGADORES,
    secoes: SECOES_PURGADORES,
  },
}
