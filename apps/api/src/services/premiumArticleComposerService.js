import { repairPortugueseInObject, repairPortugueseText } from './portugueseTextService.js';

const compact = (value = '') => String(value || '').replace(/\s+/g, ' ').trim();

const toSlug = (value = '') =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

const unique = (items = []) => Array.from(new Set(items.map(compact).filter(Boolean)));

const normalize = (value = '') =>
  repairPortugueseText(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

const EDITORIAL_BRAND_VOICE = {
  name: 'Cote Juros Editorial',
  posture: ['pragmatica', 'transparente', 'anti-promessa falsa', 'anti-golpe', 'especialista financeira', 'humana', 'direta'],
  rules: [
    'Explicar primeiro a consequencia pratica, depois o conceito.',
    'Alertar sem assustar e sem vender urgencia.',
    'Dar opiniao editorial quando uma escolha tende a ser ruim para o consumidor.',
    'Trocar frases corporativas por leitura financeira concreta.',
    'Construir confianca mostrando limites: a Cote Juros compara, nao promete aprovacao.',
    'Usar exemplos de orcamento brasileiro, nao abstracoes de planilha perfeita.'
  ],
  blockedTone: ['coach financeiro', 'promessa de solucao facil', 'texto SEO neutro demais', 'corporativo sem opiniao', 'otimismo automatico']
};

const selectIntentFormat = (intent = '') => ({
  comparativo: {
    titleSuffix: 'como comparar sem cair em armadilhas',
    lead: 'comparar alternativas, custo total e risco real antes de aceitar a primeira proposta',
    articleType: 'guia comparativo e decisorio'
  },
  comercial: {
    titleSuffix: 'quando faz sentido e quando evitar',
    lead: 'entender a oferta, os requisitos e os sinais de risco antes de avancar',
    articleType: 'guia comercial com cautela financeira'
  },
  transacional: {
    titleSuffix: 'como simular e interpretar os numeros',
    lead: 'simular cenarios, ler o CET e decidir com base no custo total',
    articleType: 'tutorial de simulacao e decisao'
  },
  informacional: {
    titleSuffix: 'o que e, riscos e como decidir',
    lead: 'entender o conceito, os riscos e os proximos passos praticos',
    articleType: 'guia educativo aprofundado'
  }
}[intent] || {
  titleSuffix: 'custos, riscos e alternativas',
  lead: 'entender os numeros, os riscos e as alternativas antes de decidir',
  articleType: 'guia decisorio'
});

const buildStrategicOutline = ({ keyword, serpIntelligence }) => {
  const intent = selectIntentFormat(serpIntelligence?.searchIntent);
  const recommended = Array.isArray(serpIntelligence?.recommendedStructure)
    ? serpIntelligence.recommendedStructure
    : [];

  return unique([
    `Resposta direta: da para conseguir ${keyword}, mas nem sempre vale a pena`,
    recommended[0],
    'O que muda quando o nome esta negativado',
    'Modalidades que costumam funcionar para quem esta negativado',
    'Comparativo de custos, garantias e riscos',
    'Como calcular se a parcela cabe na renda',
    'Exemplo completo com CET, prazo e custo total',
    'Golpes, taxa antecipada e sinais de alerta',
    'Quando e melhor renegociar antes de pegar credito',
    'Checklist de decisao antes de enviar dados',
    'FAQ com perguntas reais da busca',
    `Conclusao: ${intent.lead}`
  ]).filter(Boolean);
};

const buildComparisonRows = ({ keyword }) => [
  {
    modalidade: 'Consignado INSS, publico ou privado',
    quandoFazSentido: 'Quando a pessoa tem beneficio, salario ou vinculo elegivel e precisa de previsibilidade.',
    principalRisco: 'Comprometer renda fixa por muitos meses e perder margem para despesas essenciais.',
    oQueComparar: 'CET, prazo, margem consignavel, custo total e regras de desconto em folha.'
  },
  {
    modalidade: 'Credito com garantia de veiculo ou imovel',
    quandoFazSentido: 'Quando existe bem quitado ou com margem para garantia e a taxa fica claramente menor.',
    principalRisco: 'Perder o bem em caso de inadimplencia grave; contrato exige leitura cuidadosa.',
    oQueComparar: 'Percentual do bem aceito, taxa, custo total, seguros, tarifas e prazo de liberacao.'
  },
  {
    modalidade: 'Antecipacao de FGTS',
    quandoFazSentido: 'Quando ha saldo no FGTS e a pessoa entende o impacto de antecipar parcelas futuras.',
    principalRisco: 'Ficar sem parte do saldo em uma emergencia ou demissao, dependendo das regras vigentes.',
    oQueComparar: 'Valor liquido recebido, parcelas antecipadas, CET e custo de oportunidade.'
  },
  {
    modalidade: 'Emprestimo pessoal sem garantia',
    quandoFazSentido: `So quando o ${keyword} troca uma divida mais cara por uma mais barata e a parcela cabe.`,
    principalRisco: 'Taxas altas para perfil negativado e maior chance de virar nova divida.',
    oQueComparar: 'CET, multa por atraso, prazo, valor final pago e reputacao da instituicao.'
  },
  {
    modalidade: 'Renegociacao da divida atual',
    quandoFazSentido: 'Quando o desconto ou o parcelamento resolve a negativacao sem criar nova operacao cara.',
    principalRisco: 'Aceitar parcela que tambem nao cabe e voltar a atrasar.',
    oQueComparar: 'Desconto, juros do parcelamento, data de baixa da restricao e valor total.'
  }
];

const buildDecisionRows = () => [
  {
    criterio: 'CET',
    comoAvaliar: 'Peca o Custo Efetivo Total anual e compare propostas pelo mesmo valor e prazo.',
    sinalDeAlerta: 'A empresa mostra apenas a parcela ou a taxa mensal e evita informar o CET.'
  },
  {
    criterio: 'Parcela sobre renda',
    comoAvaliar: 'Some todas as parcelas de credito e veja quanto sobra para moradia, comida, transporte e contas fixas.',
    sinalDeAlerta: 'A nova parcela so cabe se voce atrasar outra conta.'
  },
  {
    criterio: 'Taxa antecipada',
    comoAvaliar: 'Credito formal desconta custos no contrato; nao exige Pix previo para liberar dinheiro.',
    sinalDeAlerta: 'Pedido de deposito, seguro, IOF ou taxa cadastral antes de o valor cair na conta.'
  },
  {
    criterio: 'Instituicao',
    comoAvaliar: 'Verifique CNPJ, canais oficiais, reputacao e se a operacao e feita por empresa autorizada/parceira.',
    sinalDeAlerta: 'Atendimento so por mensagem, site recem-criado ou promessa de aprovacao garantida.'
  },
  {
    criterio: 'Objetivo do dinheiro',
    comoAvaliar: 'Use credito para trocar custo caro por custo menor, resolver urgencia essencial ou reorganizar fluxo.',
    sinalDeAlerta: 'Pegar novo credito para consumo sem plano de pagamento.'
  }
];

const applyEditorialVoiceLayer = ({ sections = [], keyword }) => sections.map((section) => {
  if (/Resposta direta/i.test(section.heading)) {
    return {
      ...section,
      paragraphs: [
        `Sim, existe ${keyword}. Mas a pergunta mais honesta nao e "quem aprova?", e sim: essa proposta melhora sua vida financeira ou so muda o nome da divida? Estar com restricao no CPF dificulta a analise, reduz as ofertas disponiveis e costuma encarecer o credito, mas nao fecha todas as portas.`,
        'A leitura da Cote Juros e direta: proposta boa para negativado precisa sobreviver a tres perguntas. Quanto entra liquido na conta? Quanto sai no total? Quanto da sua renda fica presa todo mes? Se a oferta nao responde isso por escrito, ela ainda nao merece seus documentos.',
        `O erro comum e tratar ${keyword} como alivio imediato. As vezes ele e. Mas tambem pode ser apenas uma troca: sai uma divida constrangedora, entra uma parcela longa, cara e silenciosa. E essa troca costuma parecer boa no primeiro dia e pesada no terceiro mes.`
      ]
    };
  }

  if (/nome esta negativado/i.test(section.heading)) {
    return {
      ...section,
      paragraphs: [
        section.paragraphs[0],
        'O score tambem pode entrar na analise, mas ele nao e o juiz unico da historia. Renda, relacionamento com a instituicao, tipo de divida, garantias, estabilidade do pagamento e dados cadastrais tambem pesam. Duas pessoas negativadas podem receber respostas opostas no mesmo dia.',
        'A pergunta "qual banco aprova todo mundo?" e perigosa porque chama o tipo errado de resposta. Quem promete aprovar todo mundo normalmente nao esta vendendo credito; esta vendendo ansiedade. A pergunta mais adulta e: qual modalidade tem custo aceitavel para o meu caso e quais documentos provam que consigo pagar?'
      ]
    };
  }

  if (/Modalidades/i.test(section.heading)) {
    return {
      ...section,
      paragraphs: [
        section.paragraphs[0],
        section.paragraphs[1],
        'Na pratica, compare modalidades antes de comparar logotipos. A marca importa, claro. Mas a modalidade, o CET e o contrato explicam a maior parte do custo real. Muita gente perde dinheiro porque escolhe o nome conhecido e nao a estrutura mais barata.'
      ]
    };
  }

  if (/CET|juros|prazo/i.test(section.heading)) {
    return {
      ...section,
      paragraphs: [
        section.paragraphs[0],
        section.paragraphs[1],
        'Aqui vai uma opiniao editorial: parcela pequena demais para parecer confortavel merece desconfiança. Ela pode estar escondendo prazo longo, tarifa, seguro ou simplesmente um custo total maior. A comparacao justa exige mesmo valor, mesmo prazo e todos os custos na mesa.'
      ]
    };
  }

  if (/renda/i.test(section.heading)) {
    return {
      ...section,
      paragraphs: [
        'Ser aprovado nao significa que a parcela e segura. Essa talvez seja a frase mais importante do artigo. Banco aprova olhando risco para ele; voce precisa decidir olhando risco para sua casa.',
        section.paragraphs[1],
        'Cena comum: renda familiar de R$ 2.400, contas essenciais de R$ 1.850 e dividas atuais de R$ 250. Sobram R$ 300. Uma parcela de R$ 280 parece possivel no simulador, mas qualquer remedio, botijao, conserto de moto ou atraso no pagamento ja quebra o plano. Nessa situacao, o credito nao esta folgado; esta no limite.'
      ]
    };
  }

  if (/Quando o emprestimo/i.test(section.heading)) {
    return {
      ...section,
      paragraphs: [
        section.paragraphs[0],
        section.paragraphs[1],
        'A decisao boa costuma ter uma sensacao menos empolgante e mais solida: custo total menor que a alternativa atual, parcela que cabe com sobra e plano claro para nao usar novo credito no mes seguinte. Se a proposta depende de torcida, ela nao e plano; e aposta.'
      ]
    };
  }

  if (/Golpes comuns/i.test(section.heading)) {
    return {
      ...section,
      paragraphs: [
        section.paragraphs[0],
        section.paragraphs[1],
        'Pressa tambem e ferramenta de golpe. Frases como "so hoje", "ultima vaga", "nao consulte ninguem" ou atendimento apenas por aplicativo de mensagem reduzem a chance de a pessoa checar informacoes. Se a oferta piora quando voce pede tempo para ler, ela provavelmente ja era ruim.'
      ]
    };
  }

  if (/Checklist/i.test(section.heading)) {
    return {
      ...section,
      paragraphs: [
        section.paragraphs[0],
        'Se voce nao consegue responder, nao significa que a proposta e golpe automaticamente. Significa apenas que ela ainda nao e comparavel. Em financas pessoais, informacao incompleta e um custo escondido. E custo escondido quase sempre aparece na pior hora.'
      ]
    };
  }

  if (/Erros comuns/i.test(section.heading)) {
    return {
      ...section,
      paragraphs: [
        'O primeiro erro e procurar "quem aprova na hora" antes de saber quanto pode pagar. Isso inverte a ordem da decisao: a pessoa deixa a oferta definir o orcamento, quando o correto e o orcamento filtrar a oferta.',
        section.paragraphs[1],
        'O terceiro erro e usar credito novo sem atacar a causa da negativacao. Se a renda continua menor que os gastos, o emprestimo so compra tempo. Comprar tempo pode ser util em uma estrategia, mas perigoso quando vira rotina. A conta nao desaparece; ela muda de endereco.'
      ]
    };
  }

  return section;
});

const buildPremiumSections = ({ keyword, serpIntelligence }) => {
  const comparisonRows = buildComparisonRows({ keyword });
  const decisionRows = buildDecisionRows();
  const sources = Array.isArray(serpIntelligence?.officialSourcesToCite)
    ? serpIntelligence.officialSourcesToCite
    : [];

  const sections = [
    {
      heading: `Resposta direta: existe ${keyword}, mas a pergunta certa e outra`,
      subheading: 'A aprovacao pode acontecer, mas custo, risco e finalidade importam mais que a promessa de liberacao.',
      paragraphs: [
        `Sim, existe ${keyword}. Estar com restricao no CPF dificulta a analise, reduz as ofertas disponiveis e costuma encarecer o credito, mas nao impede toda contratacao. O ponto central e separar uma proposta util de uma proposta que apenas empurra a divida para frente.`,
        'A decisao fica mais segura quando voce olha tres numeros antes de qualquer cadastro: quanto vai receber liquido, quanto vai pagar no total e quanto a parcela consome da renda mensal. Se uma oferta nao deixa esses numeros claros, ela ainda nao esta pronta para ser comparada.',
        `Para a Cote Juros, esse e um tema de decisao, nao de promessa. O artigo precisa ajudar a pessoa a entender quando o ${keyword} pode reorganizar uma divida cara e quando ele so aumenta o endividamento.`
      ],
      bullets: [
        'Credito para negativado e possivel, mas sempre depende de analise.',
        'Taxas tendem a ser maiores quando o risco de inadimplencia e maior.',
        'A melhor proposta e a que reduz custo ou resolve uma urgencia sem comprometer o minimo do orcamento.'
      ]
    },
    {
      heading: 'O que muda quando o nome esta negativado',
      subheading: 'A restricao no CPF altera a forma como bancos e financeiras enxergam risco.',
      paragraphs: [
        'Quando uma pessoa esta negativada, a instituicao entende que ja existe historico recente de atraso ou inadimplencia. Isso nao diz tudo sobre a pessoa, mas pesa no modelo de risco. Na pratica, podem aparecer menos ofertas, limites menores, exigencia de comprovante de renda e juros mais altos.',
        'O score tambem pode entrar na analise, mas ele nao e o unico criterio. Renda, relacionamento com a instituicao, tipo de divida, garantias, estabilidade do pagamento e dados cadastrais tambem podem influenciar. Por isso duas pessoas negativadas podem receber respostas bem diferentes.',
        'A leitura correta nao e “qual banco aprova todo mundo?”. Essa pergunta atrai golpe. A melhor pergunta e “qual modalidade tem custo aceitavel para o meu caso e quais documentos provam que consigo pagar?”.'
      ],
      bullets: [
        'CPF com restricao aumenta o risco percebido pela instituicao.',
        'Score baixo pode reduzir ofertas, mas nao decide tudo sozinho.',
        'Garantia, renda e consignacao podem mudar a analise.'
      ]
    },
    {
      heading: 'Modalidades que costumam funcionar para quem esta negativado',
      subheading: 'As melhores chances normalmente aparecem quando existe garantia, desconto em folha ou uma divida antiga que pode ser renegociada.',
      paragraphs: [
        'Nem todo credito para negativado e igual. Um emprestimo pessoal sem garantia tende a ser mais caro porque a instituicao assume risco maior. Ja o consignado, a antecipacao de FGTS ou o credito com garantia podem ter condicoes melhores porque existe uma forma mais previsivel de pagamento ou recuperacao.',
        'Isso nao significa que toda modalidade com garantia seja automaticamente boa. Garantia reduz risco para quem empresta, mas pode aumentar a consequencia para quem toma. Se a parcela atrasar, o problema deixa de ser apenas uma restricao no nome e pode envolver perda de margem, bloqueio de saldo ou ate risco sobre um bem.',
        'O melhor caminho e comparar modalidades, nao marcas isoladas. A marca importa, mas a modalidade, o CET e o contrato explicam a maior parte do custo real.'
      ],
      table: {
        caption: 'Comparacao pratica de alternativas para negativado',
        columns: ['Modalidade', 'Quando faz sentido', 'Principal risco', 'O que comparar'],
        rows: comparisonRows.map((row) => [row.modalidade, row.quandoFazSentido, row.principalRisco, row.oQueComparar])
      },
      bullets: [
        'Consignado costuma ter custo menor, mas prende parte da renda.',
        'Garantia pode reduzir taxa, mas aumenta consequencia em caso de atraso.',
        'Renegociar a divida original pode ser melhor que criar uma nova.'
      ]
    },
    {
      heading: 'Como comparar CET, juros, prazo e parcela sem se enganar',
      subheading: 'Parcela baixa nao significa credito barato.',
      paragraphs: [
        'O CET, Custo Efetivo Total, e o numero que ajuda a comparar propostas porque inclui juros e demais custos da operacao. O Banco Central orienta o consumidor a olhar o custo total, nao apenas a taxa anunciada ou a parcela mensal. Em credito, o detalhe caro costuma ficar fora da chamada principal.',
        'Imagine duas propostas de R$ 3.000. A primeira cobra 12 parcelas de R$ 335; a segunda cobra 18 parcelas de R$ 255. A segunda parece mais leve no mes, mas custa R$ 4.590 no total, contra R$ 4.020 da primeira. Se o objetivo era trocar uma divida cara por outra mais barata, a diferenca de R$ 570 importa.',
        'A comparacao justa exige mesmo valor, mesmo prazo e todos os custos na mesa. Se uma instituicao nao informa CET, tarifas, multa de atraso e valor total pago, ainda falta informacao para decidir.'
      ],
      table: {
        caption: 'Exemplo simples: parcela menor pode sair mais cara',
        columns: ['Proposta', 'Valor liberado', 'Prazo', 'Parcela', 'Total pago', 'Leitura'],
        rows: [
          ['A', 'R$ 3.000', '12 meses', 'R$ 335', 'R$ 4.020', 'Mais pesada por mes, menor custo total.'],
          ['B', 'R$ 3.000', '18 meses', 'R$ 255', 'R$ 4.590', 'Mais leve por mes, R$ 570 mais cara no total.'],
          ['C', 'R$ 3.000', '24 meses', 'R$ 230', 'R$ 5.520', 'Parcela confortavel, custo total muito maior.']
        ]
      },
      bullets: [
        'Compare o valor total pago, nao apenas a parcela.',
        'Pergunte se IOF, seguros, tarifas e cadastro estao no CET.',
        'Se duas propostas tem prazos diferentes, simule tambem no mesmo prazo.'
      ]
    },
    {
      heading: 'Quanto da renda pode ir para a parcela',
      subheading: 'O limite saudavel depende do orcamento, nao da aprovacao.',
      paragraphs: [
        'Ser aprovado nao significa que a parcela e segura. Uma regra pratica e testar o orcamento em um mes ruim: renda menor, conta inesperada ou atraso em recebimento. Se a parcela so cabe no melhor cenario, o contrato nasce fragil.',
        'Para quem ja esta negativado, a margem de erro costuma ser menor. Antes de assumir uma nova parcela, liste aluguel ou moradia, alimentacao, transporte, energia, agua, internet, remedios, escola e outras dividas. O que sobra depois disso precisa comportar a parcela sem empurrar outra conta para atraso.',
        'Um exemplo: renda familiar de R$ 2.400, contas essenciais de R$ 1.850 e dividas atuais de R$ 250 deixam R$ 300 de folga. Uma parcela de R$ 280 parece possivel, mas qualquer imprevisto de R$ 100 ja quebra o plano. Nesse caso, renegociar a divida antiga ou buscar valor menor pode ser mais prudente.'
      ],
      table: {
        caption: 'Teste rapido de capacidade de pagamento',
        columns: ['Item', 'Valor mensal', 'Observacao'],
        rows: [
          ['Renda liquida familiar', 'R$ 2.400', 'Use valor conservador, sem renda incerta.'],
          ['Contas essenciais', 'R$ 1.850', 'Moradia, comida, transporte, contas fixas.'],
          ['Dividas atuais', 'R$ 250', 'Parcelas, acordos, cartao e atrasos.'],
          ['Folga antes do novo credito', 'R$ 300', 'Margem real para imprevistos.'],
          ['Parcela simulada', 'R$ 280', 'Risco alto: sobra apenas R$ 20.']
        ]
      },
      bullets: [
        'Teste o contrato em um mes ruim, nao no melhor cenario.',
        'Se a parcela consome toda a folga, o risco de novo atraso e alto.',
        'Credito bom precisa resolver um problema sem criar outro maior.'
      ]
    },
    {
      heading: 'Quando o emprestimo pode valer a pena',
      subheading: 'O uso mais defensavel e trocar uma divida cara por uma mais barata e controlavel.',
      paragraphs: [
        `O ${keyword} pode fazer sentido quando existe uma finalidade objetiva. Por exemplo: quitar uma divida de cartao ou cheque especial que cresce rapido, concentrar atrasos em uma parcela menor e previsivel, ou resolver uma emergencia essencial que nao pode esperar.`,
        'Mas a conta precisa fechar. Se voce pega R$ 3.000 para quitar uma divida de R$ 2.400 e usa o restante para consumo, talvez tenha apenas aumentado o saldo devedor. Se pega credito para pagar parcela de outro credito, sem reduzir taxa ou renegociar o principal, o risco tambem cresce.',
        'A decisao boa geralmente tem tres sinais: custo total menor que a alternativa atual, parcela que cabe com sobra e plano claro para nao usar novo credito no mes seguinte.'
      ],
      bullets: [
        'Pode valer a pena para trocar divida cara por divida mais barata.',
        'Pode valer a pena para emergencia essencial, com plano de pagamento realista.',
        'Nao costuma valer para consumo, impulso ou para cobrir outra parcela sem resolver a causa.'
      ]
    },
    {
      heading: 'Golpes comuns: taxa antecipada, aprovacao garantida e pressa artificial',
      subheading: 'Quem esta negativado vira alvo facil de promessa agressiva.',
      paragraphs: [
        'O sinal de alerta mais importante e pedido de dinheiro antes da liberacao. Golpistas usam nomes como taxa de cadastro, seguro obrigatorio, antecipacao de IOF, taxa de cartorio ou desbloqueio de contrato. Em credito formal, custos devem aparecer no contrato e no CET; a exigencia de Pix previo para liberar valor e um alerta forte.',
        'Outro padrao perigoso e promessa de aprovacao garantida. Instituicoes financeiras fazem analise. Mesmo quando uma empresa trabalha com perfis negativados, a aprovacao depende de dados, renda, modalidade, garantias e politicas internas.',
        'Pressa tambem e ferramenta de golpe. Frases como “so hoje”, “ultima vaga”, “nao consulte ninguem” ou atendimento apenas por aplicativo de mensagem reduzem a chance de a pessoa checar informacoes. A regra pratica e simples: se a oferta piora quando voce pede tempo para ler, ela provavelmente ja era ruim.'
      ],
      table: {
        caption: 'Sinais de alerta antes de enviar dados ou dinheiro',
        columns: ['Sinal', 'Por que preocupa', 'O que fazer'],
        rows: [
          ['Pix antecipado', 'Pode ser golpe de falsa liberacao.', 'Nao pague e procure canais oficiais.'],
          ['Aprovacao garantida', 'Credito formal depende de analise.', 'Desconfie da promessa e compare outra fonte.'],
          ['CET ausente', 'Impede comparacao real de custo.', 'Peca a informacao por escrito.'],
          ['Contrato confuso', 'Pode esconder tarifa, seguro ou multa.', 'Leia antes e salve comprovantes.'],
          ['Atendimento informal', 'Dificulta responsabilizacao.', 'Verifique site, CNPJ e reputacao.']
        ]
      },
      bullets: [
        'Nunca pague taxa antes de receber o credito.',
        'Nao envie documentos por link suspeito.',
        'Guarde contrato, proposta, simulacao e comprovantes.'
      ]
    },
    {
      heading: 'Fontes oficiais que ajudam a decidir melhor',
      subheading: 'EEAT em financas depende de fonte, contexto e cautela.',
      paragraphs: [
        'O Banco Central e uma referencia para entender instituicoes financeiras, juros, CET e educacao financeira. Ele nao escolhe a proposta por voce, mas ajuda a confirmar conceitos e a lembrar que comparacao de custo deve ir alem da taxa anunciada.',
        'O Gov.br e os orgaos de defesa do consumidor ajudam no contexto de superendividamento, credito responsavel e renegociacao. Para quem ja esta negativado, essa camada e importante: a pergunta nao e apenas “consigo dinheiro?”, mas “consigo pagar sem comprometer o minimo necessario?”.',
        sources.length
          ? `Na SERP analisada, as fontes oficiais e institucionais detectadas foram: ${sources.map((source) => source.label).join(', ')}. Elas devem sustentar trechos sobre CET, credito responsavel, score, CPF e prevencao a golpes.`
          : 'Mesmo quando a SERP nao traz fonte oficial forte, artigos de credito precisam citar referencias confiaveis para evitar recomendacao solta.'
      ],
      bullets: [
        'Use Banco Central para conceitos de CET, juros e instituicoes.',
        'Use Gov.br e defesa do consumidor para superendividamento e credito responsavel.',
        'Use Serasa como referencia de score, negativacao e comportamento de credito.'
      ]
    },
    {
      heading: 'Checklist antes de contratar',
      subheading: 'Se alguma resposta ficar vaga, pare a contratacao.',
      paragraphs: [
        'Um bom checklist precisa ser binario: ou voce tem a informacao, ou nao tem. Isso evita que a decisao seja tomada por ansiedade. Antes de aceitar qualquer oferta, responda aos itens abaixo com base em contrato, proposta ou simulacao salva.',
        'Se voce nao consegue responder, nao significa que a proposta e golpe automaticamente. Significa apenas que ela ainda nao e comparavel. Em financas pessoais, informacao incompleta e um custo escondido.'
      ],
      table: {
        caption: 'Checklist de decisao para emprestimo para negativado',
        columns: ['Criterio', 'Como avaliar', 'Sinal de alerta'],
        rows: decisionRows.map((row) => [row.criterio, row.comoAvaliar, row.sinalDeAlerta])
      },
      bullets: [
        'Tenho CET, valor liberado, parcela, prazo e total pago?',
        'A parcela cabe mesmo em um mes de renda menor?',
        'A instituicao nao pediu nenhum pagamento antecipado?',
        'O contrato explica multa, atraso, seguros e tarifas?',
        'Existe alternativa melhor: renegociar, reduzir valor ou esperar alguns dias?'
      ]
    },
    {
      heading: 'Erros comuns de quem busca credito negativado',
      subheading: 'Os erros se repetem porque a busca costuma acontecer em momento de pressao.',
      paragraphs: [
        'O primeiro erro e procurar “quem aprova na hora” antes de saber quanto pode pagar. Isso inverte a ordem da decisao: a pessoa deixa a oferta definir o orcamento, quando o correto e o orcamento filtrar a oferta.',
        'O segundo erro e comparar apenas marcas. Duas empresas podem oferecer produtos muito diferentes; e a mesma empresa pode ter propostas diferentes por perfil. Compare modalidade, CET, prazo, valor final e consequencias de atraso.',
        'O terceiro erro e usar credito novo sem atacar a causa da negativacao. Se a renda continua menor que os gastos, o emprestimo so compra tempo. Comprar tempo pode ser util em uma estrategia, mas perigoso quando vira rotina.'
      ],
      bullets: [
        'Nao comece pela promessa de aprovacao.',
        'Nao compare apenas parcela.',
        'Nao use credito novo sem plano para a divida antiga.',
        'Nao ignore custo de atraso, multa e juros futuros.'
      ]
    }
  ];

  return applyEditorialVoiceLayer({ sections, keyword });
};

const buildFaq = ({ keyword, serpIntelligence }) => {
  const serpQuestions = Array.isArray(serpIntelligence?.faqQuestions) ? serpIntelligence.faqQuestions : [];
  const defaults = [
    {
      question: `${keyword} vale a pena?`,
      answer: 'Vale a pena quando reduz o custo de uma divida mais cara, tem CET claro e a parcela cabe na renda com margem para imprevistos. Se a parcela so cabe no melhor cenario, o risco de piorar a situacao e alto.'
    },
    {
      question: `Como conseguir ${keyword}?`,
      answer: 'Comece conferindo renda, CPF regular, documentos e modalidade adequada. Depois compare propostas pelo CET, valor total pago, prazo e reputacao da instituicao. A aprovacao sempre depende de analise.'
    },
    {
      question: 'Score baixo impede aprovacao?',
      answer: 'Nao necessariamente. O score pode influenciar, mas renda, garantias, modalidade, historico e politica da instituicao tambem entram na analise. Por isso uma negativa em um lugar nao encerra todas as possibilidades.'
    },
    {
      question: 'E normal pagar taxa antecipada para liberar emprestimo?',
      answer: 'Nao. Pedido de Pix, deposito ou taxa previa para liberar credito e um sinal forte de golpe. Custos formais devem aparecer no contrato e no CET, nao como pagamento antecipado informal.'
    },
    {
      question: 'Qual modalidade costuma ser mais barata para negativado?',
      answer: 'Em geral, modalidades com menor risco para a instituicao tendem a custar menos, como consignado ou credito com garantia. Mesmo assim, e indispensavel comparar CET, prazo e consequencias de atraso.'
    },
    {
      question: 'Quando e melhor renegociar em vez de pegar novo credito?',
      answer: 'Quando a renegociacao reduz a divida, evita nova parcela cara ou preserva renda essencial. Se o emprestimo apenas empurra o problema para frente, renegociar pode ser mais seguro.'
    }
  ];

  const answerForQuestion = (question) => {
    const normalized = normalize(question);
    if (normalized.includes('taxa antecipada')) {
      return defaults.find((item) => normalize(item.question).includes('taxa antecipada'))?.answer;
    }
    if (normalized.includes('score')) {
      return defaults.find((item) => normalize(item.question).includes('score'))?.answer;
    }
    if (normalized.includes('vale a pena')) {
      return defaults.find((item) => normalize(item.question).includes('vale a pena'))?.answer;
    }
    if (normalized.includes('como conseguir')) {
      return defaults.find((item) => normalize(item.question).includes('como conseguir'))?.answer;
    }
    if (normalized.includes('qual modalidade') || normalized.includes('mais barata')) {
      return defaults.find((item) => normalize(item.question).includes('modalidade'))?.answer;
    }
    if (normalized.includes('renegociar')) {
      return defaults.find((item) => normalize(item.question).includes('renegociar'))?.answer;
    }
    if (normalized.includes('valor maximo')) {
      return 'O valor maximo depende de renda, modalidade, garantias, politica da instituicao e analise de credito. Para negativados, limite menor e taxa maior sao comuns quando nao ha garantia.';
    }
    if (normalized.includes('bancos') || normalized.includes('quem faz') || normalized.includes('nome sujo')) {
      return 'Bancos, financeiras e plataformas podem oferecer credito para negativados, mas nenhuma instituicao confiavel aprova todo mundo. Compare modalidade, CET, prazo, reputacao e exigencias antes de escolher.';
    }
    return 'A resposta depende de CET, renda, modalidade, risco de atraso e comparacao entre alternativas. Nao avance sem proposta escrita e custo total claro.';
  };

  const merged = unique([...serpQuestions, ...defaults.map((item) => item.question)])
    .slice(0, 6)
    .map((question) => defaults.find((item) => normalize(item.question) === normalize(question)) || {
      question,
      answer: answerForQuestion(question)
    });

  return merged;
};

const buildArticleContent = (article) => [
  ...article.intro,
  article.featuredSnippet,
  ...(article.expertInsights || []),
  ...article.sections.flatMap((section) => [
    section.heading,
    section.subheading,
    ...(section.paragraphs || []),
    ...((section.table?.rows || []).flat()),
    ...(section.bullets || [])
  ]),
  ...(article.midQuestions || []).flatMap((item) => [item.question, item.answer]),
  ...article.faq.flatMap((item) => [item.question, item.answer]),
  ...article.conclusion
].filter(Boolean).join('\n\n');

const applyStorytellingFinanceLayer = (article) => repairPortugueseInObject({
  ...article,
  retentionHooks: [
    'Comeca com resposta direta e uma pergunta de decisao, nao com definicao escolar.',
    'Usa cenas curtas de orcamento brasileiro para segurar leitura.',
    'Alterna alerta, exemplo numerico, tabela e opiniao editorial.',
    'Assume posicao contra promessa facil e taxa antecipada.'
  ],
  expertInsights: [
    'Muita gente olha apenas para a parcela e ignora o CET.',
    'Aprovacao nao e sinonimo de parcela segura.',
    'Credito para negativado pode ser ferramenta defensiva, mas vira armadilha quando compra apenas tempo.',
    'Oferta que piora quando o consumidor pede tempo para ler ja comeca errada.'
  ],
  sections: article.sections.map((section) => {
    if (/Resposta direta/i.test(section.heading)) {
      return {
        ...section,
        bullets: ['A pergunta certa nao e apenas se aprova, mas se melhora o orcamento.', ...section.bullets.slice(0, 2)]
      };
    }
    if (/Quanto da renda/i.test(section.heading)) {
      return {
        ...section,
        bullets: ['Se a parcela depende de um mes perfeito, ela esta cara para a sua realidade.', ...section.bullets.slice(0, 2)]
      };
    }
    return section;
  })
});

const applyHumanRewrite = (article) => repairPortugueseInObject({
  ...article,
  intro: article.intro.map((paragraph) => (
    paragraph
      .replace(/tomar decisoes melhores/gi, 'decidir com base em numeros')
      .replace(/ter clareza/gi, 'enxergar o custo real')
      .replace(/organizar sua jornada/gi, 'organizar os proximos passos')
      .replace(/menos friccao/gi, 'menos obstaculo')
  )),
  sections: article.sections.map((section) => ({
    ...section,
    paragraphs: section.paragraphs.map((paragraph) => paragraph
      .replace(/A decisao fica mais segura/gi, 'A decisão melhora')
      .replace(/O melhor caminho/gi, 'Na pratica')
      .replace(/A regra pratica e simples/gi, 'A regra pratica'))
  }))
});

const applyHumanRewriteV2 = (article) => {
  const base = applyHumanRewrite(article);
  return repairPortugueseInObject({
    ...base,
    sections: base.sections.map((section, index) => ({
      ...section,
      paragraphs: section.paragraphs.map((paragraph, paragraphIndex) => {
        if (paragraphIndex !== 0) return paragraph;
        if (index === 3) return `Muita gente olha apenas para a parcela. E ai mora o problema. ${paragraph}`;
        if (index === 6) return `Aqui a Cote Juros e bem firme: ${paragraph}`;
        return paragraph;
      })
    }))
  });
};

const applySeoPolish = ({ article, keyword, serpIntelligence }) => {
  const title = `${keyword}: como comparar custos, riscos e alternativas`;
  return repairPortugueseInObject({
    ...article,
    title,
    h1: title,
    metaTitle: title,
    metaDescription: `Veja se ${keyword} vale a pena, compare CET, parcela, riscos, golpes e alternativas antes de contratar.`,
    summary: `Guia completo sobre ${keyword}: quando pode valer a pena, como comparar CET e parcela, riscos de golpe, alternativas e checklist de decisao.`,
    tags: unique([
      keyword,
      'emprestimos',
      'credito para negativado',
      'CET',
      'score',
      serpIntelligence?.searchIntent,
      'Cote Juros'
    ]).slice(0, 8)
  });
};

export const buildPremiumArticle = ({
  topic,
  keyword,
  intent = 'guide',
  category = 'Educacao financeira',
  serpIntelligence = null
} = {}) => {
  const cleanKeyword = repairPortugueseText(compact(keyword || topic));
  const cleanTopic = repairPortugueseText(compact(topic || cleanKeyword));
  const cleanCategory = repairPortugueseText(compact(category || 'Educacao financeira'));
  const intentFormat = selectIntentFormat(serpIntelligence?.searchIntent || intent);
  const outline = buildStrategicOutline({ keyword: cleanKeyword, serpIntelligence });
  const sections = buildPremiumSections({ keyword: cleanKeyword, serpIntelligence });
  const faq = buildFaq({ keyword: cleanKeyword, serpIntelligence });

  const baseArticle = {
    title: `${cleanKeyword}: ${intentFormat.titleSuffix}`,
    h1: `${cleanKeyword}: ${intentFormat.titleSuffix}`,
    slug: toSlug(cleanKeyword),
    excerpt: `Guia premium para ${intentFormat.lead}, com exemplos, tabelas e fontes de referencia.`,
    summary: `Guia premium para ${intentFormat.lead}, com exemplos, tabelas e fontes de referencia.`,
    metaTitle: `${cleanKeyword}: ${intentFormat.titleSuffix}`,
    metaDescription: `Veja se ${cleanKeyword} vale a pena, compare CET, parcela, riscos, golpes e alternativas antes de contratar.`,
    category: cleanCategory,
    tags: unique([cleanKeyword, cleanTopic, cleanCategory, intentFormat.articleType, 'Cote Juros']).slice(0, 8),
    intro: [
      `${cleanKeyword} pode existir mesmo para quem esta com restricao no CPF. Mas a parte mais importante nao e conseguir uma resposta positiva; e entender se essa resposta cabe no seu mes, no seu contrato e na sua vida real.`,
      'A Cote Juros olha esse tema sem promessa facil: parcela pequena pode esconder custo alto, aprovacao pode virar aperto e pressa quase sempre favorece quem vende, nao quem paga.'
    ],
    featuredSnippet: `${cleanKeyword} pode valer a pena quando troca uma divida mais cara por uma proposta com CET claro, parcela que cabe na renda e nenhum pagamento antecipado. Sem esses tres pontos, o risco de piorar o endividamento aumenta.`,
    sections,
    faq,
    conclusion: [
      `${cleanKeyword} nao deve ser tratado como atalho. Ele pode ajudar quando reduz custo, organiza uma divida cara ou resolve uma urgencia essencial com parcela segura. Fora desses casos, a contratacao pode apenas adiar o problema e deixar o orcamento mais apertado.`,
      'Antes de enviar documentos ou aceitar uma oferta, compare CET, prazo, total pago, reputacao da instituicao e impacto na renda. Se faltar informacao, a melhor decisao ainda e pausar.'
    ],
    serpIntelligence,
    editorialBrandVoice: EDITORIAL_BRAND_VOICE,
    editorialPipeline: {
      version: 'premium-human-voice-2026-05',
      stages: [
        { name: 'SERP Intelligence', output: 'Intent, concorrentes, entidades, lacunas, FAQs e fontes oficiais.' },
        { name: 'Editorial Brand Voice', output: EDITORIAL_BRAND_VOICE },
        { name: 'Strategic outline', output: outline },
        { name: 'Initial draft', output: 'Resposta direta, secoes longas e cobertura dos topicos obrigatorios.' },
        { name: 'Expert expansion', output: 'Tabelas, comparativos, calculos, exemplos de CET, renda e risco.' },
        { name: 'Factual enrichment', output: 'Banco Central, Gov.br, Serasa, Febraban e contexto brasileiro.' },
        { name: 'Opinionated finance layer', output: 'Alertas reais, leitura pratica, posicao editorial e sinais de armadilha.' },
        { name: 'Storytelling finance layer', output: 'Mini-cenarios brasileiros, consequencias praticas e erros comuns.' },
        { name: 'Human rewrite', output: 'Ritmo variado, contraste, frases curtas e menos perfeicao robotica.' },
        { name: 'SEO polish', output: 'Titulo, meta description, FAQ, featured snippet e links internos.' },
        { name: 'Final validation', output: 'Quality Score rigoroso e bloqueios anti-template.' }
      ]
    },
    cta: {
      eyebrow: 'Compare com calma',
      title: 'Veja opcoes antes de contratar',
      description: 'Compare alternativas, custo total e impacto na renda antes de aceitar qualquer proposta.',
      primary: { to: '/emprestimos', label: 'Comparar emprestimos' },
      secondary: { to: '/diagnostico-financeiro', label: 'Avaliar meu orcamento' }
    }
  };

  const storyDriven = applyStorytellingFinanceLayer(baseArticle);
  const rewritten = applyHumanRewriteV2(storyDriven);
  const polished = applySeoPolish({ article: rewritten, keyword: cleanKeyword, serpIntelligence });

  return {
    ...polished,
    content: buildArticleContent(polished)
  };
};
