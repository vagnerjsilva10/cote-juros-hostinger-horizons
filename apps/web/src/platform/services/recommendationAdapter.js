const parseMoney = (value) => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  const normalized = String(value || '').replace(/\./g, '').replace(',', '.').replace(/[^\d.]/g, '');
  return normalized ? Number(normalized) : 0;
};

const normalizeText = (value = '') =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

const clampScore = (score) => Math.max(0, Math.min(100, Math.round(score)));

const normalizeNegativeStatus = (value) => {
  if (value === true || value === 'yes' || value === 'sim') return true;
  if (value === false || value === 'no' || value === 'nao' || value === 'não') return false;
  return null;
};

const hasValue = (value) => value !== undefined && value !== null && String(value).trim() !== '';

export const normalizeSimulationProfile = (answers = {}) => ({
  requestedAmount: parseMoney(answers.requestedAmount ?? answers.amount ?? answers.valor),
  monthlyIncome: parseMoney(answers.monthlyIncome ?? answers.income ?? answers.renda),
  hasNegativeStatus: normalizeNegativeStatus(answers.hasNegativeStatus ?? answers.hasRestriction ?? answers.negativado),
  occupation: answers.occupation ?? answers.workType ?? answers.tipoTrabalho ?? answers.employmentStatus ?? '',
  creditPurpose: answers.creditPurpose ?? answers.objective ?? answers.objetivo ?? answers.purpose ?? '',
  hasVehicle: Boolean(answers.hasVehicle ?? answers.vehicle),
  hasProperty: Boolean(answers.hasProperty ?? answers.property),
  city: answers.city || '',
  state: String(answers.state || '').toUpperCase(),
  contactName: answers.contactName ?? answers.name ?? answers.fullName ?? '',
  whatsapp: answers.whatsapp ?? answers.phone ?? '',
  email: answers.email ?? '',
  consentGeneral: Boolean(answers.consentGeneral),
  consentPartnerSharing: Boolean(answers.consentPartnerSharing),
  consentVersion: answers.consentVersion || 'cj-funnel-v1',
  sourcePage: answers.sourcePage || answers.source || 'smart_quiz'
});

const resolveReasons = (profile, score) => {
  const reasons = [];
  const occupation = normalizeText(profile.occupation);

  if (profile.monthlyIncome >= 3000) reasons.push('Renda informada ajuda a estimar capacidade de pagamento.');
  if (profile.requestedAmount && profile.monthlyIncome && profile.requestedAmount <= profile.monthlyIncome * 6) {
    reasons.push('Valor solicitado parece proporcional à renda informada.');
  }
  if (occupation.includes('clt') || occupation.includes('servidor')) reasons.push('Ocupação formal pode ampliar caminhos em parceiros.');
  if (occupation.includes('mei') || occupation.includes('autonom')) reasons.push('Perfil autônomo exige análise individual, mas ainda pode ter alternativas.');
  if (profile.hasVehicle || profile.hasProperty) reasons.push('Garantia declarada abre caminho para consulta de elegibilidade.');
  if (profile.hasNegativeStatus) reasons.push('Nome negativado direciona a análise para parceiros mais permissivos.');
  if (!reasons.length) reasons.push(`Score inicial ${score} gerado com os dados disponíveis.`);

  return reasons;
};

const resolveWarnings = (profile) => {
  const warnings = [];

  if (!profile.monthlyIncome) warnings.push('Informe renda mensal para uma recomendação mais precisa.');
  if (profile.monthlyIncome > 0 && profile.monthlyIncome < 1800) warnings.push('Renda baixa pode limitar valores, prazos e parceiros disponíveis.');
  if (profile.hasNegativeStatus) warnings.push('Mesmo com opções possíveis, aprovação nunca é garantida e pode exigir análise mais restritiva.');
  if (!profile.city || !profile.state) warnings.push('Cidade e estado ajudam a validar disponibilidade por região.');

  return warnings;
};

export const buildPartnerMatches = (profileInput = {}, recommendation = null) => {
  const profile = normalizeSimulationProfile(profileInput);
  const missingContact = ['contactName', 'whatsapp', 'email'].filter((field) => !hasValue(profile[field]));
  const hasGuarantee = Boolean(profile.hasVehicle || profile.hasProperty);
  const isNegative = profile.hasNegativeStatus === true;
  const purpose = normalizeText(profile.creditPurpose);
  const wantsFastCredit = purpose.includes('emergencia') || purpose.includes('credito') || purpose.includes('fgts') || purpose.includes('rapido');
  const score = recommendation?.score ?? 50;
  const matches = [];

  const completeDataAction = missingContact.length
    ? { actionType: 'complete_data', requiredFields: missingContact, ctaLabel: 'Completar dados' }
    : null;

  if (hasGuarantee) {
    matches.push({
      partnerId: 'creditas',
      partnerName: 'Creditas',
      productType: profile.hasProperty ? 'home_equity_eligibility' : 'vehicle_equity_eligibility',
      matchScore: clampScore(score + 8),
      chanceLabel: isNegative ? 'média' : score >= 70 ? 'alta' : 'média',
      reason: 'Você informou uma garantia. Por isso, faz sentido consultar elegibilidade de crédito com garantia.',
      requiredFields: completeDataAction?.requiredFields || ['guaranteeType'],
      actionType: completeDataAction?.actionType || 'eligibility',
      ctaLabel: completeDataAction?.ctaLabel || 'Consultar elegibilidade'
    });
  }

  if (isNegative || wantsFastCredit) {
    matches.push({
      partnerId: 'upp',
      partnerName: 'Up.p',
      productType: 'fgts',
      matchScore: clampScore(score + (isNegative ? 4 : 0)),
      chanceLabel: isNegative ? 'média' : score >= 55 ? 'média' : 'baixa',
      reason: 'Pode fazer sentido para quem busca FGTS ou crédito rápido, inclusive em perfis que precisam de alternativas mais permissivas. A análise é sempre do parceiro.',
      requiredFields: completeDataAction?.requiredFields || [],
      actionType: completeDataAction?.actionType || 'redirect',
      ctaLabel: completeDataAction?.ctaLabel || 'Ver opção de FGTS'
    });
  }

  matches.push({
    partnerId: isNegative ? 'restriction-friendly-credit' : 'standard-credit-hub',
    partnerName: isNegative ? 'Parceiro permissivo' : 'Hub de crédito pessoal',
    productType: 'personal_loan',
    matchScore: clampScore(score - (isNegative ? 6 : 0)),
    chanceLabel: isNegative ? 'baixa' : score >= 70 ? 'alta' : score >= 45 ? 'média' : 'baixa',
    reason: isNegative
      ? 'Seu perfil pede parceiros que aceitam análise mesmo com restrição, sem promessa de aprovação.'
      : 'Caminho de crédito pessoal para comparar condições antes de decidir.',
    requiredFields: completeDataAction?.requiredFields || [],
    actionType: completeDataAction?.actionType || 'redirect',
    ctaLabel: completeDataAction?.ctaLabel || 'Ver opção'
  });

  if (profile.monthlyIncome < 3000 || isNegative) {
    matches.push({
      partnerId: 'financial-organization',
      partnerName: 'Plano de organização',
      productType: 'decision_support',
      matchScore: clampScore(score - 4),
      chanceLabel: 'média',
      reason: 'Antes de contratar, pode valer revisar orçamento, dívidas e alternativas de menor custo.',
      requiredFields: [],
      actionType: 'redirect',
      ctaLabel: 'Ver caminhos'
    });
  }

  return matches.slice(0, 4);
};

export const recommendProducts = (answers = {}) => {
  const profile = normalizeSimulationProfile(answers);
  const occupation = normalizeText(profile.occupation);
  const purpose = normalizeText(profile.creditPurpose);

  let baseScore = 52;
  if (profile.monthlyIncome >= 8000) baseScore += 18;
  else if (profile.monthlyIncome >= 3000) baseScore += 10;
  else if (profile.monthlyIncome > 0 && profile.monthlyIncome < 1800) baseScore -= 10;

  if (profile.hasNegativeStatus === true) baseScore -= 22;
  if (profile.hasNegativeStatus === null) baseScore -= 4;
  if (occupation.includes('clt') || occupation.includes('servidor')) baseScore += 10;
  if (occupation.includes('mei') || occupation.includes('autonom')) baseScore += 4;
  if (occupation.includes('desempreg')) baseScore -= 14;
  if (profile.hasVehicle) baseScore += 6;
  if (profile.hasProperty) baseScore += 8;

  if (profile.requestedAmount > 0 && profile.monthlyIncome > 0) {
    if (profile.requestedAmount <= profile.monthlyIncome * 6) baseScore += 10;
    if (profile.requestedAmount > profile.monthlyIncome * 12) baseScore -= 12;
  }

  if (purpose.includes('quitar') || purpose.includes('divida')) baseScore -= 3;

  const score = clampScore(baseScore);
  const profileLabel = score >= 70 ? 'baixo risco' : score >= 42 ? 'médio risco' : 'alto risco';
  const result = {
    score,
    profileLabel,
    profile: profileLabel,
    risk: profileLabel,
    reasons: resolveReasons(profile, score),
    warnings: resolveWarnings(profile),
    nextBestActions: [
      'Compare custo total antes de avançar.',
      'Confira se a parcela cabe no orçamento mensal.',
      'Avance para parceiro somente com consentimento explícito.'
    ],
    mainProduct: profile.hasVehicle || profile.hasProperty ? 'Crédito com garantia como elegibilidade' : 'Crédito pessoal com análise do parceiro',
    secondaryProducts: ['Comparação de alternativas', 'Organização financeira', 'Consulta de elegibilidade'],
    cta: 'Ver caminhos possíveis',
    partnerRoute: profile.hasVehicle || profile.hasProperty ? 'creditas' : 'standard_credit',
    explanation: 'Resultado indicativo baseado nas informações fornecidas. A Cote Juros não é banco, não cobra antecipado e não garante aprovação.'
  };

  return {
    ...result,
    partnerMatches: buildPartnerMatches(profile, result),
    simulationProfile: profile
  };
};
