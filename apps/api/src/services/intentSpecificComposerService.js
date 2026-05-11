import { repairPortugueseText } from './portugueseTextService.js';

const normalize = (value = '') =>
  repairPortugueseText(String(value || ''))
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

const toSlug = (value = '') =>
  normalize(value)
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

export const INTENT_COMPOSER_PROFILES = {
  credit_loan: {
    label: 'Crédito e empréstimo',
    ctaPath: '/emprestimos',
    preferredSources: ['Banco Central', 'Febraban', 'Serasa'],
    requiredTerms: ['CET', 'juros', 'custo total', 'renda'],
    forbiddenTerms: ['aprovação garantida', 'taxa antecipada'],
    exampleStyle: 'simulação de custo total, prazo e impacto na renda'
  },
  fraud_pix: {
    label: 'Golpes, fraudes e Pix',
    ctaPath: '/blog',
    preferredSources: ['Banco Central', 'Gov.br', 'consumidor.gov.br'],
    requiredTerms: ['Pix', 'banco', 'contestação', 'comprovante', 'MED', 'Banco Central'],
    forbiddenTerms: ['CET', 'empréstimo', 'negativado', 'aprovação', 'parcela', 'renda comprometida', 'consignado', 'crédito para negativado'],
    exampleStyle: 'cenário de contestação, provas, protocolo e devolução segura'
  },
  inss_consignado: {
    label: 'INSS, consignado e benefícios',
    ctaPath: '/blog',
    preferredSources: ['Meu INSS', 'Gov.br', 'Banco Central'],
    requiredTerms: ['INSS', 'benefício', 'extrato', 'canal oficial'],
    forbiddenTerms: ['aprovação garantida', 'crédito para negativado'],
    exampleStyle: 'desconto no benefício, protocolo e contestação'
  },
  fgts_worker: {
    label: 'FGTS e trabalhador',
    ctaPath: '/blog',
    preferredSources: ['Caixa', 'Gov.br', 'Ministério do Trabalho'],
    requiredTerms: ['FGTS', 'Caixa', 'Gov.br', 'saldo'],
    forbiddenTerms: ['aprovação garantida', 'CET sem contexto'],
    exampleStyle: 'saldo, saque, calendário e custo de antecipação quando aplicável'
  },
  financial_education: {
    label: 'Educação financeira',
    ctaPath: '/diagnostico-financeiro',
    preferredSources: ['Banco Central', 'Gov.br'],
    requiredTerms: ['orçamento', 'prioridade', 'risco', 'decisão prática'],
    forbiddenTerms: ['contrate agora', 'aprovação', 'oferta exclusiva'],
    exampleStyle: 'rotina doméstica, escolhas e consequência no orçamento'
  },
  news_trends: {
    label: 'Notícias e tendências econômicas',
    ctaPath: '/blog',
    preferredSources: ['Banco Central', 'IBGE', 'Gov.br'],
    requiredTerms: ['data', 'contexto atual', 'impacto prático'],
    forbiddenTerms: ['notícia automática', 'sem fonte', 'aprovação garantida'],
    exampleStyle: 'mudança recente, quem é afetado e decisão prática'
  },
  score_cpf: {
    label: 'Score, cadastro e CPF',
    ctaPath: '/blog',
    preferredSources: ['Serasa', 'Banco Central', 'Gov.br'],
    requiredTerms: ['score', 'CPF', 'histórico', 'cadastro'],
    forbiddenTerms: ['aprovação garantida', 'aumenta score na hora'],
    exampleStyle: 'histórico de pagamento, cadastro e sinais de risco'
  },
  card_account: {
    label: 'Cartão e conta digital',
    ctaPath: '/cartoes',
    preferredSources: ['Banco Central', 'Febraban'],
    requiredTerms: ['fatura', 'limite', 'tarifa', 'segurança'],
    forbiddenTerms: ['aprovação garantida'],
    exampleStyle: 'fatura, limite, tarifas e uso seguro'
  },
  financing: {
    label: 'Financiamento',
    ctaPath: '/financiamentos',
    preferredSources: ['Banco Central', 'Febraban'],
    requiredTerms: ['entrada', 'prazo', 'juros', 'custo total'],
    forbiddenTerms: ['aprovação garantida'],
    exampleStyle: 'entrada, prazo longo, custo final e garantias'
  },
  taxes_revenue: {
    label: 'Impostos e Receita',
    ctaPath: '/blog',
    preferredSources: ['Receita Federal', 'Gov.br'],
    requiredTerms: ['Receita Federal', 'declaração', 'prazo', 'documentos'],
    forbiddenTerms: ['aprovação', 'empréstimo sem contexto'],
    exampleStyle: 'prazo, documento, declaração e regularização'
  }
};

export const detectIntentComposer = ({ keyword = '', topic = '', category = '', intent = '' } = {}) => {
  const text = normalize(`${keyword} ${topic} ${category} ${intent}`);
  if (/\b(golpe|fraude|pix errado|pix|med|contestacao|contestac[aã]o|comprovante falso|boletim de ocorrencia|boletim de ocorr[eê]ncia)\b/.test(text)) return 'fraud_pix';
  if (/\b(inss|consignado|beneficio|benef[ií]cio|aposentado|pensionista)\b/.test(text)) return 'inss_consignado';
  if (/\b(fgts|saque aniversario|saque-aniversario|trabalhador|caixa)\b/.test(text)) return 'fgts_worker';
  if (/\b(score|cpf|cadastro positivo|serasa|nome sujo)\b/.test(text)) return 'score_cpf';
  if (/\b(cartao|cart[aã]o|conta digital|limite|fatura)\b/.test(text)) return 'card_account';
  if (/\b(financiamento|financiar|imovel|im[oó]vel|entrada)\b/.test(text) || (/\b(veiculo|ve[ií]culo)\b/.test(text) && !/\b(emprestimo|empr[eé]stimo|credito|cr[eé]dito)\b/.test(text))) return 'financing';
  if (/\b(selic|copom|inflacao|infla[cç][aã]o|inadimplencia|inadimpl[eê]ncia|noticia|not[ií]cia|nova regra|2026)\b/.test(text)) return 'news_trends';
  if (/\b(imposto|receita federal|irpf|imposto de renda|declara[cç][aã]o)\b/.test(text)) return 'taxes_revenue';
  if (/\b(emprestimo|empr[eé]stimo|credito|cr[eé]dito|juros|garantia|custo total|cet)\b/.test(text)) return 'credit_loan';
  return 'financial_education';
};

const buildFraudPixArticle = ({ keyword = '', topic = '', category = 'Golpes e fraudes', serpIntelligence = null } = {}) => {
  const cleanKeyword = repairPortugueseText(keyword || topic || 'golpe do Pix errado o que fazer');
  const title = 'Golpe do Pix errado: o que fazer agora';

  return {
    title,
    h1: title,
    slug: toSlug(cleanKeyword),
    excerpt: 'Recebeu uma cobrança estranha depois de um Pix supostamente errado? Veja como agir, guardar provas e falar com o banco sem cair em nova fraude.',
    summary: 'Recebeu uma cobrança estranha depois de um Pix supostamente errado? Veja como agir, guardar provas e falar com o banco sem cair em nova fraude.',
    metaTitle: title,
    metaDescription: 'Veja o que fazer no golpe do Pix errado: primeiros passos, provas, banco, MED, BO, Banco Central e consumidor.gov.br.',
    category,
    tags: ['Pix', 'golpe financeiro', 'fraude bancária', 'Banco Central', 'defesa do consumidor'],
    editorialIntent: 'howto',
    intentComposerProfile: {
      type: 'fraud_pix',
      label: INTENT_COMPOSER_PROFILES.fraud_pix.label,
      preserveIntentSpecific: true,
      requiredTerms: INTENT_COMPOSER_PROFILES.fraud_pix.requiredTerms,
      forbiddenTerms: INTENT_COMPOSER_PROFILES.fraud_pix.forbiddenTerms,
      ctaPath: INTENT_COMPOSER_PROFILES.fraud_pix.ctaPath
    },
    editorialPipeline: [
      'SERP Intelligence',
      'Intent-Specific Composer',
      'Fraud/Pix consumer defense structure',
      'Semantic Intent Guard',
      'Portuguese hard gate',
      'Publish safety'
    ],
    featuredSnippet: 'Se alguém pedir devolução por um Pix supostamente errado, confira o extrato no app do banco, não use dados enviados por mensagem, guarde comprovantes e acione o banco pelos canais oficiais.',
    intro: [
      'Se alguém diz que fez um Pix errado e pede devolução rápida, pare antes de transferir. Pode ser engano real, mas também pode ser golpe.',
      'O caminho seguro é conferir o extrato, falar pelo app do banco, registrar protocolos e só devolver por canais orientados pela instituição.'
    ],
    expertInsights: [
      'Quem pressiona por devolução imediata normalmente quer tirar você do ambiente seguro do banco.',
      'Print não é confirmação de dinheiro recebido. Extrato bancário, protocolo e canal oficial pesam mais.'
    ],
    retentionHooks: [
      'O detalhe perigoso é simples: a pressa do outro não pode virar o seu prejuízo.',
      'Antes de devolver qualquer valor, você precisa saber se o dinheiro realmente entrou e se o pedido veio de uma pessoa legítima.'
    ],
    sections: [
      {
        heading: 'Resposta imediata: não devolva no impulso',
        subheading: 'A primeira decisão é ganhar alguns minutos de controle.',
        paragraphs: [
          'Abra o aplicativo do banco e confira se o valor aparece no extrato. Não use apenas print, mensagem de WhatsApp ou ligação como prova.',
          'Se o dinheiro entrou, procure no próprio app se existe função de devolução vinculada à transação. Quando a devolução acontece por fora, para outra chave Pix, o risco aumenta bastante.'
        ],
        bullets: ['Confira o extrato pelo app.', 'Não clique em links enviados por mensagem.', 'Anote horário, valor e chave Pix envolvida.', 'Procure o canal oficial do banco.']
      },
      {
        heading: 'O que pode ter acontecido',
        subheading: 'Nem todo Pix recebido por engano é golpe, mas todo pedido urgente merece cautela.',
        paragraphs: [
          'Há casos reais de erro de digitação da chave Pix. Também há fraude com comprovante falso, engenharia social e tentativa de fazer a vítima devolver para uma chave diferente.',
          'A pergunta prática é: o pedido combina com o extrato e com os dados da transação? Se não combina, trate como alerta.'
        ],
        table: {
          caption: 'Cenários comuns em pedido de devolução de Pix',
          columns: ['Situação', 'Sinal de alerta', 'Ação mais segura'],
          rows: [
            ['Dinheiro aparece no extrato', 'Pessoa pede devolução para outra chave', 'Fale com o banco antes de transferir.'],
            ['Só existe print enviado por mensagem', 'Valor não entrou na conta', 'Não devolva nada e registre evidências.'],
            ['Ligação com tom de ameaça', 'Pressão para resolver em minutos', 'Desligue e acione o canal oficial.'],
            ['Pix recebido de desconhecido', 'História confusa sobre erro', 'Guarde dados e peça orientação ao banco.']
          ]
        }
      },
      {
        heading: 'Primeiros passos nos primeiros minutos',
        subheading: 'A ordem dos passos evita duas perdas: dinheiro e prova.',
        paragraphs: [
          'Tire prints da conversa, salve o comprovante exibido no aplicativo, copie o identificador da transação quando disponível e registre o protocolo de atendimento.',
          'Depois, entre em contato com o banco pelo app, telefone oficial ou agência. Explique que recebeu ou enviou um Pix suspeito e peça orientação sobre contestação, bloqueio preventivo ou análise pelo MED.'
        ],
        bullets: ['Salve conversa completa.', 'Guarde comprovante e identificador da transação.']
      },
      {
        heading: 'O que não fazer quando alguém pede devolução',
        subheading: 'O golpe costuma crescer quando a vítima tenta resolver rápido demais.',
        paragraphs: [
          'Não devolva para uma chave diferente só porque a pessoa pediu. Também não instale aplicativo de acesso remoto, não informe senha e não confirme códigos recebidos por SMS.',
          'Se houver ameaça, promessa de processo imediato ou insistência fora do canal bancário, reduza a conversa. Banco sério não resolve contestação pedindo senha em chat informal.'
        ],
        bullets: ['Não informe senha, token ou código.', 'Não aceite ajuda por acesso remoto.', 'Não confie em comprovante fora do extrato.', 'Não faça nova transferência sob pressão.', 'Não apague conversas.']
      },
      {
        heading: 'Como falar com o banco e pedir análise',
        subheading: 'O pedido precisa ser objetivo, com dados que permitam rastrear a transação.',
        paragraphs: [
          'Informe valor, data, horário, chave Pix, nome que aparece no extrato e uma descrição curta do que aconteceu. Peça número de protocolo.',
          'Se você enviou dinheiro e percebeu fraude, avise o banco rapidamente. A instituição pode avaliar bloqueio, contestação e abertura de análise pelo Mecanismo Especial de Devolução.'
        ],
        table: {
          caption: 'Dados úteis para atendimento do banco',
          columns: ['Dado', 'Onde encontrar', 'Por que importa'],
          rows: [
            ['Valor exato', 'Extrato do Pix', 'Evita confusão com outras transações.'],
            ['Data e horário', 'Detalhe da transação', 'Ajuda na análise do banco.'],
            ['Chave Pix', 'Comprovante ou extrato', 'Identifica a conta envolvida.'],
            ['Protocolo', 'Atendimento oficial', 'Comprova que você acionou o banco.']
          ]
        }
      },
      {
        heading: 'MED: quando o Mecanismo Especial de Devolução pode ajudar',
        subheading: 'O MED existe para casos com suspeita de fraude ou falha operacional, mas não é promessa de retorno automático.',
        paragraphs: [
          'O Mecanismo Especial de Devolução, criado no ecossistema Pix do Banco Central, permite que instituições financeiras analisem uma transação suspeita e tentem bloquear valores ainda disponíveis na conta recebedora.',
          'Na prática, tempo importa. Quanto mais rápido o banco é avisado, maior a chance de análise útil. Mesmo assim, o resultado depende das regras do arranjo Pix, das evidências e da existência de saldo na conta envolvida.'
        ],
        bullets: ['Peça análise pelo MED quando houver suspeita de fraude.', 'Guarde protocolo e acompanhe o prazo informado pelo banco.', 'Entenda que o MED não substitui BO nem reclamação formal quando o caso for grave.']
      },
      {
        heading: 'BO, consumidor.gov.br e Banco Central',
        subheading: 'Quando o prejuízo existe ou o banco não responde bem, formalizar ajuda.',
        paragraphs: [
          'Se houve perda financeira, ameaça, uso de dados ou indício claro de fraude, registre boletim de ocorrência. Muitas delegacias permitem BO online, dependendo do estado.',
          'Se o banco não der retorno adequado, consumidor.gov.br pode ser usado para reclamação contra empresas participantes. O Banco Central também recebe reclamações sobre instituições financeiras, mas não julga indenização individual.'
        ],
        bullets: ['Registre BO quando houver fraude ou prejuízo.', 'Use consumidor.gov.br para tentar solução com a instituição.', 'Reclame ao Banco Central se houver falha no atendimento bancário.', 'Mantenha tudo documentado.']
      },
      {
        heading: 'Quais provas guardar',
        subheading: 'Prova boa é aquela que mostra sequência, data e canal.',
        paragraphs: [
          'Guarde prints da conversa inteira, comprovantes, extratos, protocolos, nome do atendente quando houver e qualquer áudio ou e-mail relacionado.',
          'Não edite imagens antes de salvar. Se precisar enviar para o banco ou BO, mantenha os arquivos originais em uma pasta separada.'
        ],
        table: {
          caption: 'Checklist de provas',
          columns: ['Prova', 'Prioridade', 'Observação'],
          rows: [
            ['Extrato bancário', 'Alta', 'Mostra se o valor entrou ou saiu.'],
            ['Comprovante Pix', 'Alta', 'Traz data, valor e dados da transação.'],
            ['Conversa completa', 'Alta', 'Mostra pressão, ameaça ou instrução suspeita.'],
            ['Protocolo do banco', 'Média', 'Ajuda em reclamações futuras.'],
            ['BO', 'Média', 'Formaliza o relato quando há fraude.']
          ]
        }
      },
      {
        heading: 'Sinais de golpe no Pix errado',
        subheading: 'A história pode mudar, mas alguns sinais se repetem.',
        paragraphs: [
          'Desconfie quando a pessoa pede segredo, pressiona por minutos, manda comprovante sem o dinheiro aparecer no extrato ou orienta devolução para outra chave.',
          'Outro sinal forte é tentar tirar você do app do banco. Link externo, aplicativo desconhecido e pedido de código são alerta vermelho.'
        ],
        bullets: ['Urgência exagerada.', 'Comprovante que não bate com o extrato.', 'Pedido para devolver a outra pessoa.', 'Link ou aplicativo fora do banco.']
      },
      {
        heading: 'Checklist antes de devolver qualquer valor',
        subheading: 'Devolver corretamente também é uma forma de proteção.',
        paragraphs: [
          'Se o dinheiro realmente entrou por engano, a devolução deve seguir caminho rastreável. O ideal é usar o recurso de devolução da própria transação, quando disponível, ou orientação documentada do banco.',
          'Não existe problema em agir de boa-fé. O problema é agir no escuro.'
        ],
        bullets: ['O valor está no extrato?', 'A chave de devolução é a mesma da transação?', 'O banco orientou por canal oficial?', 'Você salvou o protocolo?', 'A conversa parece coerente?']
      },
      {
        heading: 'Como reduzir risco nos próximos Pix',
        subheading: 'Prevenção no Pix é menos sobre medo e mais sobre rotina.',
        paragraphs: [
          'Ative notificações do banco, revise limites diários, mantenha o aplicativo atualizado e evite resolver pedido financeiro por link recebido em conversa.',
          'Também vale combinar com familiares uma regra simples: Pix suspeito só se resolve depois de checar no app e falar por canal conhecido.'
        ],
        bullets: ['Use limites compatíveis com sua rotina.', 'Ative alertas no celular.', 'Não confirme códigos por telefone.']
      }
    ],
    example: 'Exemplo: se alguém enviar print dizendo que fez um Pix de R$ 480 por engano, mas o valor não aparece no extrato, a ação correta é não devolver, salvar a conversa e falar com o banco.',
    alert: 'Atenção: pedido de devolução por Pix com pressa, ameaça ou chave diferente deve ser tratado como risco de fraude até o banco orientar pelos canais oficiais.',
    midQuestions: [
      {
        question: 'Recebi um Pix desconhecido. Posso devolver?',
        answer: 'Pode, mas primeiro confirme o dinheiro no extrato e use caminho rastreável. Se houver dúvida, peça orientação ao banco antes de transferir.'
      },
      {
        question: 'Enviei Pix para golpe. Ainda dá tempo?',
        answer: 'Avise o banco imediatamente, peça análise pelo MED quando couber, registre provas e acompanhe o protocolo. Velocidade aumenta a chance de bloqueio.'
      }
    ],
    financialImpact: [
      'Impacto financeiro: devolver no impulso pode transformar um pedido falso em perda real de dinheiro.',
      'Risco de prova: sem extrato, protocolo e conversa salva, fica mais difícil demonstrar o que aconteceu.',
      'Cenário negativo: se a fraude avançar, a vítima pode perder o valor transferido e ainda expor dados bancários.'
    ],
    alternatives: [
      'Usar o recurso de devolução da própria transação quando o banco permitir.',
      'Pedir orientação formal pelo app, central oficial ou agência antes de qualquer transferência.',
      'Registrar BO e reclamação em canais oficiais quando houver prejuízo ou falha de atendimento.',
      'Manter o valor parado até entender se o pedido é legítimo.'
    ],
    faq: [
      {
        question: 'Pix errado sempre é golpe?',
        answer: 'Não. Erro real existe, mas pedido urgente, comprovante sem extrato e chave diferente são sinais de alerta.'
      },
      {
        question: 'O que é MED no Pix?',
        answer: 'É o Mecanismo Especial de Devolução usado pelas instituições para analisar suspeita de fraude ou falha operacional no Pix.'
      },
      {
        question: 'Preciso fazer boletim de ocorrência?',
        answer: 'Se houve prejuízo, ameaça, uso indevido de dados ou suspeita clara de fraude, o BO ajuda a formalizar o relato.'
      },
      {
        question: 'Posso reclamar no Banco Central?',
        answer: 'Pode reclamar sobre falha de atendimento de instituição financeira, mas o Banco Central não decide indenização individual.'
      },
      {
        question: 'Devo responder quem está cobrando a devolução?',
        answer: 'Responda pouco e sem enviar dados sensíveis. Priorize o canal oficial do banco e guarde a conversa.'
      }
    ],
    conclusion: [
      'Golpe do Pix errado se combate com calma, prova e canal oficial. Muita fraude nasce justamente da pressa de parecer correto.',
      'Se o dinheiro entrou por engano, devolva pelo caminho rastreável. Se a história não fecha, pare, registre tudo e deixe o banco analisar.'
    ],
    ctas: [
      {
        position: 'after_intro',
        title: 'Leia outros alertas financeiros',
        description: 'Veja guias da Cote Juros sobre golpes, segurança bancária e decisões práticas no dia a dia.',
        to: '/blog',
        label: 'Ver alertas no blog'
      },
      {
        position: 'middle',
        title: 'Organize as provas antes de agir',
        description: 'Use ferramentas e checklists para entender o que salvar antes de falar com o banco.',
        to: '/ferramentas',
        label: 'Abrir ferramentas'
      },
      {
        position: 'before_conclusion',
        title: 'Revise sua rotina financeira',
        description: 'Um diagnóstico simples ajuda a reduzir exposição a golpes, atrasos e decisões por impulso.',
        to: '/diagnostico-financeiro',
        label: 'Fazer diagnóstico'
      }
    ],
    cta: {
      eyebrow: 'Alerta financeiro',
      title: 'Continue pelos guias de segurança',
      description: 'Entenda golpes comuns, canais oficiais e cuidados antes de movimentar dinheiro.',
      primary: { to: '/blog', label: 'Ver mais alertas' },
      secondary: { to: '/diagnostico-financeiro', label: 'Revisar rotina' }
    },
    internalLinks: [
      { path: '/blog', title: 'Blog Cote Juros', anchor: 'outros alertas financeiros' },
      { path: '/ferramentas', title: 'Ferramentas financeiras', anchor: 'ferramentas para organizar provas e decisões' },
      { path: '/diagnostico-financeiro', title: 'Diagnóstico financeiro', anchor: 'diagnóstico financeiro' }
    ],
    externalLinks: [
      { label: 'Banco Central do Brasil', url: 'https://www.bcb.gov.br/' },
      { label: 'Gov.br', url: 'https://www.gov.br/' },
      { label: 'consumidor.gov.br', url: 'https://www.consumidor.gov.br/' }
    ],
    serpIntelligence
  };
};

export const buildIntentSpecificArticle = ({ topic, keyword, intent = 'guide', category = 'Educação financeira', serpIntelligence = null } = {}) => {
  const composerType = detectIntentComposer({ keyword, topic, category, intent });
  if (composerType === 'fraud_pix') {
    return buildFraudPixArticle({ keyword, topic, category, serpIntelligence });
  }
  return null;
};
