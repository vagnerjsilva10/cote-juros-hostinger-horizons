const normalize = (value = '') =>
  String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

const tokenize = (...values) =>
  values
    .flatMap((value) => normalize(value).split(/[^a-z0-9]+/))
    .map((item) => item.trim())
    .filter(Boolean);

const CURATED_IMAGE_LIBRARY = Object.freeze([
  {
    key: 'loan-negativado-contract',
    cluster: 'emprestimos',
    title: 'Empréstimo para negativado confiável',
    publicPath: 'https://wordpress.cotejuros.com.br/wp-content/uploads/2026/01/emprestimo-para-negativado-confiavel-1024x683.png',
    width: 1024,
    height: 683,
    fileSizeBytes: 180000,
    intent: 'human',
    prompt: 'Pessoa analisando contrato de empréstimo para negativado em ambiente limpo, com contexto financeiro realista e premium.',
    tags: ['emprestimo', 'negativado', 'nome sujo', 'contrato', 'analise', 'credito', 'seguro']
  },
  {
    key: 'loan-golpes-warning',
    cluster: 'emprestimos',
    title: 'Golpes em empréstimo para negativado',
    publicPath: 'https://wordpress.cotejuros.com.br/wp-content/uploads/2026/01/golpes-emprestimo-para-negativado-1024x683.png',
    width: 1024,
    height: 683,
    fileSizeBytes: 175000,
    intent: 'editorial',
    prompt: 'Documentos financeiros, celular e cartão em composição editorial premium sobre golpes em empréstimo para negativado.',
    tags: ['emprestimo', 'negativado', 'golpe', 'fraude', 'online', 'seguranca', 'alerta']
  },
  {
    key: 'loan-banks-comparison',
    cluster: 'emprestimos',
    title: 'Comparação entre bancos para empréstimo',
    publicPath: 'https://wordpress.cotejuros.com.br/wp-content/uploads/2024/11/itau-bradesco-bb-1024x512.jpg',
    width: 1024,
    height: 512,
    fileSizeBytes: 155000,
    intent: 'conceptual',
    prompt: 'Comparação editorial entre bancos e instituições de crédito, com visual limpo e foco em análise de opções.',
    tags: ['emprestimo', 'comparacao', 'bancos', 'taxas', 'opcoes', 'analise', 'credito']
  },
  {
    key: 'loan-digital-fast',
    cluster: 'emprestimos',
    title: 'Bancos digitais e crédito rápido',
    publicPath: 'https://wordpress.cotejuros.com.br/wp-content/uploads/2026/01/Bancos-Digitais-para-Credito-Rapido-1024x683.png',
    width: 1024,
    height: 683,
    fileSizeBytes: 170000,
    intent: 'editorial',
    prompt: 'Capa editorial sobre crédito digital rápido com estética fintech premium e contexto de aprovação online.',
    tags: ['emprestimo', 'credito', 'online', 'digital', 'aprovacao', 'fintech', 'rapido']
  },
  {
    key: 'financing-no-entry',
    cluster: 'financiamentos',
    title: 'Carro sem entrada',
    publicPath: 'https://wordpress.cotejuros.com.br/wp-content/uploads/2026/02/Carro-sem-entrada-como-financiar-mesmo-com-nome-negativado-2-1024x683.png',
    width: 1024,
    height: 683,
    fileSizeBytes: 185000,
    intent: 'human',
    prompt: 'Imagem premium de carro sem entrada, com contexto de aprovação e financiamento veicular.',
    tags: ['financiamento', 'carro', 'sem entrada', 'veiculo', 'aprovacao', 'nome sujo']
  },
  {
    key: 'financing-leasing',
    cluster: 'financiamentos',
    title: 'Leasing sem entrada',
    publicPath: 'https://wordpress.cotejuros.com.br/wp-content/uploads/2026/02/Financiamento-de-Veiculos-Sem-Entrada-As-Melhores-Empresas-para-Contratar-Leasing-1024x683.png',
    width: 1024,
    height: 683,
    fileSizeBytes: 176000,
    intent: 'editorial',
    prompt: 'Carros modernos e contrato digital para financiamento de veículos sem entrada via leasing.',
    tags: ['financiamento', 'veiculo', 'leasing', 'sem entrada', 'contrato', 'parcelas']
  },
  {
    key: 'financing-name-dirty',
    cluster: 'financiamentos',
    title: 'Financiar carro com nome sujo',
    publicPath: 'https://wordpress.cotejuros.com.br/wp-content/uploads/2025/09/Como-Financiar-um-Carro-com-Nome-Sujo-Guia-Completo-e-Seguro-1024x576.png',
    width: 1024,
    height: 576,
    fileSizeBytes: 168000,
    intent: 'human',
    prompt: 'Casal assinando contrato em concessionária para financiamento com nome sujo, em estética limpa e confiável.',
    tags: ['financiamento', 'carro', 'nome sujo', 'negativado', 'concessionaria', 'contrato']
  },
  {
    key: 'cards-nubank-limit',
    cluster: 'cartoes',
    title: 'Aumentar limite do cartão',
    publicPath: 'https://wordpress.cotejuros.com.br/wp-content/uploads/2024/12/Como-Aumentar-o-Limite-do-Nubank-Veja-Truques-para-Usar-Agora-1024x576.jpg',
    width: 1024,
    height: 576,
    fileSizeBytes: 165000,
    intent: 'human',
    prompt: 'Pessoa segurando cartão de crédito em cena premium sobre aumento de limite e uso responsável.',
    tags: ['cartao', 'credito', 'limite', 'aumento', 'nubank', 'uso', 'score']
  },
  {
    key: 'cards-limit-machine',
    cluster: 'cartoes',
    title: 'Uso prático do cartão',
    publicPath: 'https://wordpress.cotejuros.com.br/wp-content/uploads/2024/12/2988232-1024x768.jpeg',
    width: 1024,
    height: 768,
    fileSizeBytes: 172000,
    intent: 'human',
    prompt: 'Pessoa usando cartão em maquininha com composição limpa para artigo sobre limite, aprovação e uso do crédito.',
    tags: ['cartao', 'credito', 'limite', 'maquininha', 'uso', 'compras', 'aprovacao']
  },
  {
    key: 'cards-debt-reorg',
    cluster: 'cartoes',
    title: 'Reorganização de dívidas com cartão',
    publicPath: 'https://wordpress.cotejuros.com.br/wp-content/uploads/2024/12/23496937-1024x576.jpeg',
    width: 1024,
    height: 576,
    fileSizeBytes: 160000,
    intent: 'human',
    prompt: 'Homem preocupado analisando cartão e contas para artigo sobre dívidas, rotativo e reorganização financeira.',
    tags: ['cartao', 'dividas', 'rotativo', 'reorganizacao', 'limite baixo', 'credito']
  },
  {
    key: 'score-clean-name',
    cluster: 'score',
    title: 'Limpar nome e score',
    publicPath: 'https://wordpress.cotejuros.com.br/wp-content/uploads/2024/12/Como-Consultar-o-CPF-e-Limpar-o-Nome-na-Serasa-3-Passo-a-Passo-para-Recuperar-o-Credito-1024x600.jpg',
    width: 1024,
    height: 600,
    fileSizeBytes: 166000,
    intent: 'human',
    prompt: 'Mulher refletindo sobre regularização de pendências e recuperação de crédito em cena editorial premium.',
    tags: ['score', 'serasa', 'cpf', 'limpar nome', 'credito', 'pendencias']
  },
  {
    key: 'score-increase',
    cluster: 'score',
    title: 'Como aumentar o score',
    publicPath: 'https://wordpress.cotejuros.com.br/wp-content/uploads/2024/12/13-aumentar-score-cpf-1024x576.jpg',
    width: 1024,
    height: 576,
    fileSizeBytes: 162000,
    intent: 'conceptual',
    prompt: 'Capa editorial sobre aumento de score de crédito, limpa, com visual informativo e confiável.',
    tags: ['score', 'aumentar', 'credito', 'cpf', 'limite', 'serasa']
  },
  {
    key: 'education-reserve',
    cluster: 'educacao',
    title: 'Reserva de emergência',
    publicPath: 'https://wordpress.cotejuros.com.br/wp-content/uploads/2025/02/4386341-1024x683.jpeg',
    width: 1024,
    height: 683,
    fileSizeBytes: 158000,
    intent: 'conceptual',
    prompt: 'Itens de planejamento financeiro e reserva de emergência em composição clara e premium.',
    tags: ['educacao financeira', 'reserva de emergencia', 'planejamento', 'orcamento', 'seguranca']
  },
  {
    key: 'education-calculator',
    cluster: 'educacao',
    title: 'Calculadora do Cidadão',
    publicPath: 'https://wordpress.cotejuros.com.br/wp-content/uploads/2025/02/calculadoracidadao-768x422.jpg',
    width: 768,
    height: 422,
    fileSizeBytes: 120000,
    intent: 'editorial',
    prompt: 'Tela da Calculadora do Cidadão como apoio visual para simulações, juros e parcelas.',
    tags: ['educacao financeira', 'calculadora do cidadao', 'juros', 'parcelas', 'simulacao']
  }
]);

const inferCluster = ({ cluster, topic, title, slug }) => {
  const haystack = normalize(`${cluster} ${topic} ${title} ${slug}`);
  if (/cart|credito|anuidade|limite/.test(haystack)) return 'cartoes';
  if (/financi|veiculo|imovel|entrada|leasing/.test(haystack)) return 'financiamentos';
  if (/score|serasa|spc|cpf/.test(haystack)) return 'score';
  if (/educ|reserva|orcamento|planejamento|calculadora/.test(haystack)) return 'educacao';
  return 'emprestimos';
};

const scoreLibraryMatch = ({ entry, haystackTerms }) => {
  const matched = entry.tags.filter((tag) => haystackTerms.some((term) => tag.includes(term) || term.includes(tag))).length;
  const base = entry.cluster === 'cartoes' || entry.cluster === 'financiamentos' || entry.cluster === 'emprestimos' ? 40 : 36;
  return base + matched * 8;
};

export const getCuratedBlogImageCandidates = ({ title, topic, slug, cluster }) => {
  const inferredCluster = inferCluster({ title, topic, slug, cluster });
  const haystackTerms = tokenize(title, topic, slug, cluster);

  const ranked = CURATED_IMAGE_LIBRARY
    .filter((entry) => entry.cluster === inferredCluster)
    .map((entry) => ({
      ...entry,
      semanticScore: scoreLibraryMatch({ entry, haystackTerms })
    }))
    .sort((a, b) => b.semanticScore - a.semanticScore)
    .slice(0, 3)
    .map((entry, index) => ({
      key: `library-${index + 1}`,
      label: entry.title,
      intent: entry.intent,
      prompt: entry.prompt,
      provider: 'library',
      publicPath: entry.publicPath,
      absolutePath: null,
      fileSizeBytes: entry.fileSizeBytes,
      metadata: {
        width: entry.width,
        height: entry.height,
        fileSizeBytes: entry.fileSizeBytes,
        mimeType: 'image/jpeg'
      },
      librarySource: entry.key,
      semanticScore: entry.semanticScore
    }));

  return {
    cluster: inferredCluster,
    variants: ranked
  };
};
