import { repairPortugueseInObject, repairPortugueseText } from './portugueseTextService.js';
import { detectIntentComposer, INTENT_COMPOSER_PROFILES } from './intentSpecificComposerService.js';

const normalize = (value = '') =>
  repairPortugueseText(String(value || ''))
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();

const clampScore = (value = 0) => Math.max(0, Math.min(100, Math.round(value)));

const collectText = (article = {}) => {
  const repaired = repairPortugueseInObject(article);
  return [
    repaired.title,
    repaired.h1,
    repaired.metaDescription,
    repaired.summary,
    ...(repaired.intro || []),
    repaired.featuredSnippet,
    repaired.example,
    repaired.alert,
    ...(repaired.expertInsights || []),
    ...(repaired.retentionHooks || []),
    ...(repaired.sections || []).flatMap((section) => [
      section.heading,
      section.subheading,
      ...(section.paragraphs || []),
      ...(section.bullets || []),
      section.table?.caption,
      ...(section.table?.columns || []),
      ...((section.table?.rows || []).flat())
    ]),
    ...(repaired.midQuestions || []).flatMap((item) => [item.question, item.answer]),
    ...(repaired.financialImpact || []),
    ...(repaired.alternatives || []),
    ...(repaired.faq || []).flatMap((item) => [item.question, item.answer]),
    ...(repaired.ctas || []).flatMap((item) => [item.title, item.description, item.label, item.to]),
    repaired.cta?.title,
    repaired.cta?.description,
    repaired.cta?.primary?.label,
    repaired.cta?.primary?.to,
    repaired.cta?.secondary?.label,
    repaired.cta?.secondary?.to,
    ...(repaired.conclusion || [])
  ].filter(Boolean).join(' ');
};

const countMatches = (plain = '', patterns = []) =>
  patterns.flatMap((pattern) => {
    const matches = plain.match(pattern) || [];
    return matches.map((match) => match);
  });

const hasAny = (plain = '', patterns = []) => patterns.some((pattern) => pattern.test(plain));

const FORBIDDEN_BY_INTENT = {
  fraud_pix: [
    /\bcet\b/i,
    /\bemprestimo(s)?\b/i,
    /\bnegativad[oa]s?\b/i,
    /\baprovacao\b/i,
    /\bparcela(s)?\b/i,
    /\brenda comprometida\b/i,
    /\bconsignado\b/i,
    /\bcredito para negativado\b/i
  ],
  financial_education: [
    /\bcontrate agora\b/i,
    /\bver opcoes de credito\b/i,
    /\/emprestimos\b/i
  ],
  score_cpf: [
    /\baprovacao garantida\b/i,
    /\baumenta score na hora\b/i
  ],
  news_trends: [
    /\bsem fonte\b/i,
    /\bnoticia automatica\b/i
  ],
  inss_consignado: [
    /\baprovacao garantida\b/i,
    /\bcredito para negativado\b/i
  ],
  fgts_worker: [
    /\baprovacao garantida\b/i
  ]
};

const REQUIRED_BY_INTENT = {
  fraud_pix: [
    /\bpix\b/i,
    /\bbanco\b/i,
    /\bcontestacao\b/i,
    /\bcomprovante\b/i,
    /\bmed\b|mecanismo especial de devolucao/i,
    /\bbanco central\b/i,
    /\bconsumidor\.gov\.br\b|consumidor/i,
    /\bgolpe\b|\bfraude\b/i
  ],
  news_trends: [
    /\b2026\b|\bhoje\b|\batual\b|\brecente\b|\bdata\b/i,
    /\bimpacto\b/i,
    /\bbanco central\b|\bibge\b|\bgov\.br\b/i
  ],
  inss_consignado: [
    /\binss\b/i,
    /\bgov\.br\b|\bmeu inss\b/i,
    /\bbeneficio\b/i
  ],
  fgts_worker: [
    /\bfgts\b/i,
    /\bcaixa\b/i,
    /\bgov\.br\b/i
  ],
  score_cpf: [
    /\bscore\b/i,
    /\bcpf\b/i,
    /\bhistorico\b|\bcadastro\b/i
  ]
};

const CTA_FIT_BY_INTENT = {
  fraud_pix: {
    allowed: [/\/blog\b/i, /\/diagnostico-financeiro\b/i, /\/ferramentas\b/i],
    disallowed: [/\/emprestimos\b/i, /\bcredito\b/i, /\bemprestimo\b/i]
  },
  financial_education: {
    allowed: [/\/diagnostico-financeiro\b/i, /\/ferramentas\b/i, /\/blog\b/i],
    disallowed: [/\bcontrate agora\b/i, /\/emprestimos\b/i]
  },
  inss_consignado: {
    allowed: [/\/blog\b/i, /\/diagnostico-financeiro\b/i],
    disallowed: [/\baprovacao garantida\b/i]
  },
  fgts_worker: {
    allowed: [/\/blog\b/i, /\/diagnostico-financeiro\b/i],
    disallowed: [/\baprovacao garantida\b/i]
  },
  score_cpf: {
    allowed: [/\/blog\b/i, /\/diagnostico-financeiro\b/i],
    disallowed: [/\baprovacao garantida\b/i]
  }
};

export const validateSemanticIntent = (article = {}) => {
  const repaired = repairPortugueseInObject(article);
  const intentType = repaired.intentComposerProfile?.type || detectIntentComposer({
    keyword: repaired.clusterKeyword || repaired.tags?.[0] || repaired.title,
    topic: repaired.title,
    category: repaired.category,
    intent: repaired.editorialIntent
  });
  const profile = INTENT_COMPOSER_PROFILES[intentType] || INTENT_COMPOSER_PROFILES.financial_education;
  const plain = normalize(collectText(repaired));
  const forbiddenPatterns = FORBIDDEN_BY_INTENT[intentType] || [];
  const requiredPatterns = REQUIRED_BY_INTENT[intentType] || [];
  const ctaFit = CTA_FIT_BY_INTENT[intentType] || null;
  const forbiddenHits = countMatches(plain, forbiddenPatterns);
  const requiredHits = requiredPatterns.filter((pattern) => pattern.test(plain)).length;
  const requiredScore = requiredPatterns.length
    ? (requiredHits / requiredPatterns.length) * 100
    : 92;
  const forbiddenTermsScore = clampScore(100 - forbiddenHits.length * 28);
  const ctaText = normalize([
    ...(repaired.ctas || []).flatMap((item) => [item.title, item.description, item.label, item.to]),
    repaired.cta?.primary?.to,
    repaired.cta?.secondary?.to,
    repaired.cta?.primary?.label,
    repaired.cta?.secondary?.label
  ].filter(Boolean).join(' '));
  const ctaAllowed = ctaFit ? hasAny(ctaText, ctaFit.allowed) : true;
  const ctaDisallowed = ctaFit ? hasAny(ctaText, ctaFit.disallowed) : false;
  const ctaFitScore = clampScore((ctaAllowed ? 100 : 65) - (ctaDisallowed ? 55 : 0));
  const semanticConsistencyScore = clampScore((requiredScore * 0.5) + (forbiddenTermsScore * 0.35) + (ctaFitScore * 0.15));
  const intentMatchScore = clampScore((requiredScore * 0.45) + (forbiddenTermsScore * 0.35) + (ctaFitScore * 0.2));
  const issues = [
    intentMatchScore < 85 ? `intent_match_score abaixo de 85 (${intentMatchScore})` : null,
    forbiddenHits.length ? `termos proibidos para ${intentType}: ${[...new Set(forbiddenHits)].slice(0, 8).join(', ')}` : null,
    ctaDisallowed ? `CTA inadequado para ${intentType}` : null,
    intentType === 'news_trends' && requiredScore < 80 ? 'noticia/tendencia sem contexto temporal ou fonte suficiente' : null,
    intentType === 'inss_consignado' && requiredScore < 80 ? 'conteudo INSS sem fonte oficial ou termos essenciais' : null,
    intentType === 'fgts_worker' && requiredScore < 80 ? 'conteudo FGTS sem Caixa/Gov.br ou termos essenciais' : null,
    intentType === 'score_cpf' && forbiddenHits.length ? 'conteudo de score mistura promessa de aprovacao' : null
  ].filter(Boolean);

  return {
    passed: issues.length === 0,
    blocked: issues.length > 0,
    intentType,
    profileLabel: profile.label,
    intent_match_score: intentMatchScore,
    forbidden_terms_score: forbiddenTermsScore,
    semantic_consistency_score: semanticConsistencyScore,
    CTA_fit_score: ctaFitScore,
    issues,
    signals: {
      requiredTermsMatched: requiredHits,
      requiredTermsTotal: requiredPatterns.length,
      forbiddenHits: [...new Set(forbiddenHits)].slice(0, 20),
      ctaAllowed,
      ctaDisallowed
    }
  };
};
