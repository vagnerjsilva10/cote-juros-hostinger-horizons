const incomePoints = (income = 0) => {
  if (income >= 12000) return 30;
  if (income >= 7000) return 24;
  if (income >= 4000) return 18;
  if (income >= 2200) return 12;
  return 6;
};

const employmentPoints = (employmentStatus = '') => {
  const value = employmentStatus.toLowerCase();
  if (['clt', 'servidor_publico', 'aposentado', 'pensionista'].includes(value)) return 25;
  if (['mei', 'empresario'].includes(value)) return 18;
  if (['autonomo', 'freelancer'].includes(value)) return 12;
  return 8;
};

const amountFitPoints = ({ requestedAmount = 0, income = 0 }) => {
  if (!requestedAmount || !income) return 8;
  const ratio = requestedAmount / income;
  if (ratio <= 4) return 20;
  if (ratio <= 8) return 14;
  if (ratio <= 14) return 8;
  return 3;
};

const sourcePoints = (segment = '') => {
  const value = segment.toLowerCase();
  if (value.includes('hot') || value.includes('alta_intencao')) return 15;
  if (value.includes('morno') || value.includes('engajado')) return 10;
  return 5;
};

const guaranteePoints = ({ hasGuarantee, guaranteeType = '' }) => {
  if (!hasGuarantee) return 0;
  const type = guaranteeType.toLowerCase();
  if (['imovel', 'veiculo', 'fgts'].includes(type)) return 20;
  return 14;
};

const bandForScore = (score) => {
  if (score >= 80) return 'A';
  if (score >= 65) return 'B';
  if (score >= 45) return 'C';
  return 'D';
};

const qualificationForScore = (score, hasRestriction) => {
  if (score >= 72 && !hasRestriction) return 'prime';
  if (score >= 48) return hasRestriction ? 'restriction_friendly' : 'standard';
  return 'nurture';
};

export const ReactivationScoringService = {
  /*
   * Score auditavel em 100 pontos:
   * renda: ate 30, ocupacao: ate 25, valor/renda: ate 20,
   * origem/segmento: ate 15, garantia: ate 20, restricao: -15/+10,
   * consentimento: +5. O clamp final evita score fora da escala.
   */
  calculate(input = {}) {
    const income = Number(input.income || 0);
    const requestedAmount = Number(input.requestedAmount || 0);
    const restrictionPenalty = input.hasRestriction ? -15 : 10;
    const consentBonus = input.hasConsent ? 5 : 0;
    const rawScore =
      incomePoints(income) +
      employmentPoints(input.employmentStatus) +
      amountFitPoints({ requestedAmount, income }) +
      sourcePoints(input.segment) +
      guaranteePoints({ hasGuarantee: input.hasGuarantee, guaranteeType: input.guaranteeType }) +
      restrictionPenalty +
      consentBonus;

    const score = Math.max(0, Math.min(100, rawScore));

    return {
      value: score,
      band: bandForScore(score),
      qualification: qualificationForScore(score, Boolean(input.hasRestriction)),
      reasons: {
        income: incomePoints(income),
        employment: employmentPoints(input.employmentStatus),
        amountFit: amountFitPoints({ requestedAmount, income }),
        segment: sourcePoints(input.segment),
        guarantee: guaranteePoints({ hasGuarantee: input.hasGuarantee, guaranteeType: input.guaranteeType }),
        restriction: restrictionPenalty,
        consent: consentBonus
      }
    };
  }
};
