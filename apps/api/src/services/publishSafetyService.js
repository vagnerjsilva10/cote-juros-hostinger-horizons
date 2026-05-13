import {
  findPortugueseEncodingIssues,
  repairPortugueseText
} from './portugueseTextService.js';
import { validateSemanticIntent } from './semanticIntentGuardService.js';

const normalize = (value = '') =>
  repairPortugueseText(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

const CRITICAL_UNACCENTED_PATTERNS = [
  /\bnao\b/i,
  /\bvoce\b/i,
  /\bcredito\b/i,
  /\bemprestimo\b/i,
  /\bdivida\b/i,
  /\borcamento\b/i,
  /\baprovacao\b/i,
  /\bcontratacao\b/i,
  /\binformacao\b/i,
  /\binstituicao\b/i,
  /\breputacao\b/i,
  /\burgencia\b/i,
  /\breferencia\b/i,
  /\bprevencao\b/i,
  /\bsinonimo\b/i,
  /\bcomeca\b/i,
  /\bdefinicao\b/i,
  /\bopiniao\b/i,
  /\bposicao\b/i,
  /\bunico\b/i,
  /\bhistoria\b/i,
  /\bdisponiveis\b/i,
  /\bexigencia\b/i,
  /\baceitavel\b/i,
  /\bliquido\b/i,
  /\balivio\b/i,
  /\bas vezes\b/i,
  /\bso\b/i,
  /\btres\b/i,
  /\bcenario\b/i,
  /\bpoliticas\b/i,
  /\bpadrao\b/i,
  /\bcartorio\b/i,
  /\bprevio\b/i,
  /\bninguem\b/i,
  /\balem\b/i,
  /\bbinario\b/i,
  /\bcomparavel\b/i,
  /\bendereco\b/i
];

const GRAMMAR_ARTIFACTS = [
  /\bn[aã]o e\b/i,
  /\b[aA]prova[cç][aã]o n[aã]o e\b/i,
  /\besta com\b/i,
  /\besta negativad/i,
  /\besta vendendo\b/i,
  /\best[aá] dispon/i,
  /\bquem esta\b/i,
  /\bela ainda nao\b/i,
  /\bele nao\b/i,
  /\bela nao\b/i,
  /\bessa proposta melhora.*ou so muda\b/i
];

const TRUNCATED_TITLE_PATTERN = /\b(a|o|e|de|do|da|dos|das|com|para|por|em|no|na|vale)\s*$/i;
const BROKEN_ENCODING_PATTERN = /(?:Ã.|Â.|â€|�|\?stimo|\?culo|\?o|\?a)/;

const collectTextEntries = (article = {}) => {
  const entries = [];
  const add = (path, value) => {
    if (value) entries.push({ path, value: String(value) });
  };

  add('title', article.title || article.h1);
  add('metaDescription', article.metaDescription || article.seoDescription);
  add('summary', article.summary || article.excerpt);
  (article.intro || []).forEach((value, index) => add(`intro[${index}]`, value));
  add('featuredSnippet', article.featuredSnippet);
  (article.expertInsights || []).forEach((value, index) => add(`expertInsights[${index}]`, value));
  (article.retentionHooks || []).forEach((value, index) => add(`retentionHooks[${index}]`, value));
  (article.sections || []).forEach((section, sectionIndex) => {
    add(`sections[${sectionIndex}].heading`, section.heading);
    add(`sections[${sectionIndex}].subheading`, section.subheading);
    (section.paragraphs || []).forEach((value, index) => add(`sections[${sectionIndex}].paragraphs[${index}]`, value));
    (section.bullets || []).forEach((value, index) => add(`sections[${sectionIndex}].bullets[${index}]`, value));
    add(`sections[${sectionIndex}].table.caption`, section.table?.caption);
    (section.table?.columns || []).forEach((value, index) => add(`sections[${sectionIndex}].table.columns[${index}]`, value));
    (section.table?.rows || []).forEach((row, rowIndex) => {
      (row || []).forEach((value, columnIndex) => add(`sections[${sectionIndex}].table.rows[${rowIndex}][${columnIndex}]`, value));
    });
  });
  (article.faq || []).forEach((item, index) => {
    add(`faq[${index}].question`, item.question);
    add(`faq[${index}].answer`, item.answer);
  });
  (article.ctas || []).forEach((item, index) => {
    add(`ctas[${index}].title`, item.title);
    add(`ctas[${index}].description`, item.description);
    add(`ctas[${index}].label`, item.label);
  });
  (article.financialImpact || []).forEach((value, index) => add(`financialImpact[${index}]`, value));
  (article.alternatives || []).forEach((value, index) => add(`alternatives[${index}]`, value));
  (article.conclusion || []).forEach((value, index) => add(`conclusion[${index}]`, value));

  return entries;
};

const startsLowercase = (value = '') => {
  const first = String(value || '').trim().match(/[A-Za-zÀ-ÖØ-öø-ÿ]/u)?.[0];
  return Boolean(first && first === first.toLowerCase() && first !== first.toUpperCase());
};

export const validateHardPortugueseGate = (article = {}) => {
  const entries = collectTextEntries(article);
  const encodingIssues = findPortugueseEncodingIssues(article);
  const brokenEncodingEntries = entries.filter((entry) => BROKEN_ENCODING_PATTERN.test(entry.value)).map((entry) => entry.path);
  const lowercaseOpenings = entries
    .filter((entry) => !entry.path.includes('.table.'))
    .filter((entry) => startsLowercase(entry.value))
    .map((entry) => entry.path);
  const unaccentedEntries = entries.filter((entry) => CRITICAL_UNACCENTED_PATTERNS.some((pattern) => pattern.test(entry.value))).map((entry) => entry.path);
  const grammarArtifacts = entries.filter((entry) => GRAMMAR_ARTIFACTS.some((pattern) => pattern.test(entry.value))).map((entry) => entry.path);
  const title = String(article.title || article.h1 || '');
  const truncated = [
    TRUNCATED_TITLE_PATTERN.test(title) ? 'title' : null,
    /\b(com|sem|para|por|de)\.$/i.test(article.featuredSnippet || '') ? 'featuredSnippet' : null,
    /\besses\.$/i.test(article.featuredSnippet || '') ? 'featuredSnippet' : null
  ].filter(Boolean);

  const issues = [
    ...encodingIssues.map((path) => `encoding quebrado em ${path}`),
    ...brokenEncodingEntries.map((path) => `mistura de encoding em ${path}`),
    ...lowercaseOpenings.map((path) => `inicio minusculo em ${path}`),
    ...unaccentedEntries.map((path) => `acentuacao ausente em ${path}`),
    ...grammarArtifacts.map((path) => `artefato gramatical em ${path}`),
    ...truncated.map((path) => `texto truncado em ${path}`)
  ];

  return {
    passed: issues.length === 0,
    blocked: issues.length > 0,
    issues: issues.slice(0, 30),
    signals: {
      encodingIssues: encodingIssues.length + brokenEncodingEntries.length,
      lowercaseOpenings: lowercaseOpenings.length,
      unaccentedEntries: unaccentedEntries.length,
      grammarArtifacts: grammarArtifacts.length,
      truncatedText: truncated.length,
      normalizedTitle: normalize(title)
    }
  };
};

export const buildPublishHardBlockers = ({ article = {}, validation = {}, topicFatigue = null, governance = null } = {}) => {
  const qualityScore = validation.qualityScore || validation.checks?.qualityScore || {};
  const portugueseGate = validateHardPortugueseGate(article);
  const semanticIntent = validateSemanticIntent(article);
  const blockers = [
    validation.passed === false ? 'validacao editorial geral falhou' : null,
    (qualityScore.human_readability_score || 0) < 82 ? 'readability abaixo de 82' : null,
    (qualityScore.anti_template_score || 0) < 82 ? 'anti-template abaixo de 82' : null,
    (qualityScore.structural_fingerprint_score || 0) > 35 ? 'fingerprint risk acima de 35' : null,
    (qualityScore.fingerprint_risk_score || 0) > 35 ? 'fingerprint editorial acima de 35' : null,
    (qualityScore.canibalization_risk_score || 0) > 60 ? 'canibalizacao acima de 60' : null,
    (qualityScore.narrative_strength_score ?? 100) < 62 ? 'storytelling fraco' : null,
    (qualityScore.editorial_personality_score ?? 100) < 62 ? 'personalidade editorial fraca' : null,
    topicFatigue?.blocked ? `topic fatigue bloqueado: ${topicFatigue.blockers.join('; ')}` : null,
    governance && governance.decision !== 'publishable' ? `governanca editorial bloqueou: ${(governance.blockers || []).slice(0, 6).join('; ')}` : null,
    portugueseGate.blocked ? `portugues hard gate falhou: ${portugueseGate.issues.slice(0, 6).join('; ')}` : null,
    semanticIntent.blocked ? `semantic intent falhou: ${semanticIntent.issues.slice(0, 4).join('; ')}` : null
  ].filter(Boolean);

  return {
    passed: blockers.length === 0,
    blocked: blockers.length > 0,
    status: blockers.length > 0 ? 'draft_blocked' : 'publishable',
    blockers,
    portugueseGate,
    semanticIntent,
    thresholds: {
      readabilityMin: 82,
      antiTemplateMin: 82,
      fingerprintRiskMax: 35,
      topicFatigueMax: 64,
      intentMatchMin: 85,
      canibalizationRiskMax: 60,
      narrativeStrengthMin: 62,
      editorialPersonalityMin: 62
    }
  };
};
