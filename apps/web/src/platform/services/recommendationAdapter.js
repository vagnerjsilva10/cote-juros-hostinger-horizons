const parseMoney = (value) => {
  if (typeof value === 'number') return value;
  const normalized = String(value || '').replace(/\./g, '').replace(',', '.').replace(/[^\d.]/g, '');
  return normalized ? Number(normalized) : 0;
};

const normalizeText = (value = '') =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

const clampScore = (score) => Math.max(0, Math.min(100, Math.round(score)));

const resolveProduct = ({ answers, score, profile }) => {
  const objective = normalizeText(answers.objective || answers.objetivo || answers.goal || '');
  const purpose = normalizeText(answers.purpose || answers.finalidade || '');
  const workType = normalizeText(answers.workType || answers.tipoTrabalho || answers.employmentStatus || '');
  const hasRestriction = Boolean(answers.hasRestriction ?? answers.negativado);
  const wantsInsurance = Boolean(answers.wantsInsurance ?? answers.interesseSeguro)
    || objective.includes('seguro')
    || purpose.includes('seguro');

  if (wantsInsurance) {
    return {
      mainProduct: 'Seguro com cobertura comparável',
      secondaryProducts: ['Proteção financeira', 'Seguro residencial', 'Seguro vida'],
      cta: 'Ver seguros disponíveis',
      partnerRoute: 'insurance_partner'
    };
  }

  if (workType.includes('aposent') || workType.includes('pension')) {
    return {
      mainProduct: 'Consignado como caminho possível',
      secondaryProducts: ['Crédito pessoal', 'Cartão básico', 'Proteção financeira'],
      cta: 'Continuar minha análise gratuita',
      partnerRoute: 'consigned_or_standard_credit'
    };
  }

  if (hasRestriction) {
    return {
      mainProduct: 'Opções para negativado sujeitas à análise',
      secondaryProducts: ['Cartão com análise facilitada', 'Crédito com garantia', 'Proteção financeira'],
      cta: 'Ver opções disponíveis para meu perfil',
      partnerRoute: 'restricted_credit'
    };
  }

  if (score >= 70) {
    return {
      mainProduct: 'Crédito com garantia pode fazer sentido',
      secondaryProducts: ['Cartão premium', 'Financiamento', 'Empréstimo pessoal'],
      cta: 'Simular com garantia',
      partnerRoute: 'creditas'
    };
  }

  return {
    mainProduct: profile === 'alto risco' ? 'Crédito pessoal com análise cuidadosa' : 'Empréstimo pessoal',
    secondaryProducts: ['Cartão comum', 'Seguro/proteção', 'Financiamento se fizer sentido'],
    cta: 'Ver opções disponíveis para meu perfil',
    partnerRoute: 'standard_credit'
  };
};

export const recommendProducts = (quizAnswers = {}) => {
  const income = parseMoney(quizAnswers.income ?? quizAnswers.renda);
  const amount = parseMoney(quizAnswers.amount ?? quizAnswers.valor ?? quizAnswers.requestedAmount);
  const workType = normalizeText(quizAnswers.workType || quizAnswers.tipoTrabalho || quizAnswers.employmentStatus || '');
  const hasRestriction = Boolean(quizAnswers.hasRestriction ?? quizAnswers.negativado);

  let baseScore = 50;

  if (income >= 8000) baseScore += 20;
  else if (income >= 3000) baseScore += 10;

  if (hasRestriction) baseScore -= 20;
  if (workType.includes('clt')) baseScore += 10;
  if (workType.includes('mei') || workType.includes('autonom')) baseScore += 5;
  if (workType.includes('desempreg')) baseScore -= 10;

  if (amount > 0 && income > 0) {
    if (amount <= income * 6) baseScore += 15;
    if (amount > income * 12) baseScore -= 10;
  }

  const score = clampScore(baseScore);
  const profile = score >= 70 ? 'baixo risco' : score >= 40 ? 'moderado' : 'alto risco';
  const risk = profile;
  const product = resolveProduct({ answers: quizAnswers, score, profile });

  return {
    score,
    profile,
    risk,
    ...product,
    explanation:
      `Com base nas respostas, seu perfil foi classificado como ${profile}. ` +
      `A recomendação indica boa aderência inicial, mas depende da avaliação do parceiro e das condições disponíveis.`
  };
};
