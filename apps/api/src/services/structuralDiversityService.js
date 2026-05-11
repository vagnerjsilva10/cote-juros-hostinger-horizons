import {
  findPortugueseEncodingIssues,
  repairPortugueseInObject,
  repairPortugueseText
} from './portugueseTextService.js';

const normalize = (value = '') =>
  repairPortugueseText(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();

const clampScore = (value = 0) => Math.max(0, Math.min(100, Math.round(value)));

const countRepeatedValues = (values = [], minCount = 2) => {
  const counts = new Map();
  values.filter((value) => value !== null && value !== undefined && value !== '').forEach((value) => {
    counts.set(value, (counts.get(value) || 0) + 1);
  });
  return [...counts.values()].filter((count) => count >= minCount).length;
};

const collectArticleTextEntries = (article = {}) => {
  const entries = [];
  const add = (path, value) => {
    if (value) entries.push({ path, value: String(value) });
  };

  add('title', article.title);
  add('h1', article.h1);
  add('metaDescription', article.metaDescription);
  add('summary', article.summary);
  (article.intro || []).forEach((value, index) => add(`intro[${index}]`, value));
  add('featuredSnippet', article.featuredSnippet);
  (article.expertInsights || []).forEach((value, index) => add(`expertInsights[${index}]`, value));
  (article.retentionHooks || []).forEach((value, index) => add(`retentionHooks[${index}]`, value));
  (article.sections || []).forEach((section, index) => {
    add(`sections[${index}].heading`, section.heading);
    add(`sections[${index}].subheading`, section.subheading);
    (section.paragraphs || []).forEach((value, paragraphIndex) => add(`sections[${index}].paragraphs[${paragraphIndex}]`, value));
    (section.bullets || []).forEach((value, bulletIndex) => add(`sections[${index}].bullets[${bulletIndex}]`, value));
    add(`sections[${index}].table.caption`, section.table?.caption);
    (section.table?.columns || []).forEach((value, columnIndex) => add(`sections[${index}].table.columns[${columnIndex}]`, value));
    (section.table?.rows || []).forEach((row, rowIndex) => {
      (row || []).forEach((value, columnIndex) => add(`sections[${index}].table.rows[${rowIndex}][${columnIndex}]`, value));
    });
  });
  (article.midQuestions || []).forEach((item, index) => {
    add(`midQuestions[${index}].question`, item.question);
    add(`midQuestions[${index}].answer`, item.answer);
  });
  (article.financialImpact || []).forEach((value, index) => add(`financialImpact[${index}]`, value));
  (article.alternatives || []).forEach((value, index) => add(`alternatives[${index}]`, value));
  (article.faq || []).forEach((item, index) => {
    add(`faq[${index}].question`, item.question);
    add(`faq[${index}].answer`, item.answer);
  });
  (article.ctas || []).forEach((item, index) => {
    add(`ctas[${index}].title`, item.title);
    add(`ctas[${index}].description`, item.description);
    add(`ctas[${index}].label`, item.label);
  });
  add('cta.title', article.cta?.title);
  add('cta.description', article.cta?.description);
  add('cta.primary.label', article.cta?.primary?.label);
  add('cta.secondary.label', article.cta?.secondary?.label);
  (article.conclusion || []).forEach((value, index) => add(`conclusion[${index}]`, value));

  return entries;
};

const startsLowercase = (value = '') => {
  const text = repairPortugueseText(value).trim();
  if (!text) return false;
  const first = text.match(/[A-Za-zÀ-ÖØ-öø-ÿ]/u)?.[0];
  return Boolean(first && first === first.toLowerCase() && first !== first.toUpperCase());
};

const sentenceCase = (value = '') => {
  const text = repairPortugueseText(value).trim();
  if (!text) return '';
  return text.replace(/^(\s*)([a-zà-öø-ÿ])/u, (_, space, char) => `${space}${char.toUpperCase()}`);
};

const sentenceCaseArray = (items = []) => items.map(sentenceCase).filter(Boolean);

const splitOpening = (value = '', words = 5) => normalize(value).split(/\s+/).slice(0, words).join(' ');

const paragraphBucket = (value = '') => {
  const count = repairPortugueseText(value).split(/\s+/).filter(Boolean).length;
  if (count <= 8) return 'micro';
  if (count <= 28) return 'short';
  if (count <= 55) return 'medium';
  if (count <= 88) return 'long';
  return 'dense';
};

const hasCommonAccentDebt = (value = '') => {
  const text = String(value || '');
  return /\b(nao|voce|credito|creditos|divida|dividas|emprestimo|emprestimos|aprovacao|analise|orcamento|opcao|opcoes|pratico|pratica|possivel|numero|numeros|tambem|ate|mes|atencao|contratacao|comparacao|restricao|seguranca|decisao|decisoes|beneficio|historico|emergencia|solucao|instituicao|informacao|cobranca)\b/i.test(text);
};

export const analyzeStructuralFingerprint = (article = {}) => {
  const repaired = repairPortugueseInObject(article);
  const sections = Array.isArray(repaired.sections) ? repaired.sections : [];
  const faq = Array.isArray(repaired.faq) ? repaired.faq : [];
  const ctas = Array.isArray(repaired.ctas) ? repaired.ctas : [];
  const paragraphs = [
    ...(repaired.intro || []),
    ...sections.flatMap((section) => section.paragraphs || []),
    ...(repaired.conclusion || [])
  ].filter(Boolean);
  const bulletCounts = sections.map((section) => Array.isArray(section.bullets) ? section.bullets.length : 0);
  const paragraphCounts = sections.map((section) => Array.isArray(section.paragraphs) ? section.paragraphs.length : 0);
  const paragraphBuckets = paragraphs.map(paragraphBucket);
  const paragraphOpenings = paragraphs.map((paragraph) => splitOpening(paragraph, 5)).filter(Boolean);
  const sectionHeadingOpenings = sections.map((section) => splitOpening(section.heading, 4)).filter(Boolean);
  const faqAnswerOpenings = faq.map((item) => splitOpening(item.answer, 5)).filter(Boolean);
  const ctaOpenings = ctas.map((item) => splitOpening(`${item.title || ''} ${item.description || ''}`, 5)).filter(Boolean);
  const allTextEntries = collectArticleTextEntries(repaired);

  const sectionsWithExactlyThreeBullets = bulletCounts.filter((count) => count === 3).length;
  const bulletPatternRepetitionScore = clampScore(
    (sectionsWithExactlyThreeBullets / Math.max(1, sections.length)) * 70
    + countRepeatedValues(bulletCounts.filter((count) => count > 0), 3) * 20
  );
  const paragraphSymmetryScore = clampScore(
    countRepeatedValues(paragraphCounts, 4) * 24
    + countRepeatedValues(paragraphBuckets, Math.ceil(Math.max(3, paragraphs.length * 0.45))) * 34
  );
  const cadenceRepetitionScore = clampScore(
    countRepeatedValues(paragraphOpenings, 2) * 22
    + countRepeatedValues(faqAnswerOpenings, 2) * 18
    + countRepeatedValues(ctaOpenings, 2) * 20
  );
  const templateSimilarityScore = clampScore(
    countRepeatedValues(sectionHeadingOpenings, 2) * 22
    + sections.filter((section) => /^(o que|como|quando|por que|lista|checklist|alternativas|riscos comuns|ponto essencial)/i.test(repairPortugueseText(section.heading || ''))).length * 4
  );
  const structureRepetitionScore = clampScore(
    bulletPatternRepetitionScore * 0.32
    + paragraphSymmetryScore * 0.3
    + cadenceRepetitionScore * 0.22
    + templateSimilarityScore * 0.16
  );
  const lowercaseOpeningPaths = allTextEntries
    .filter((entry) => !entry.path.includes('.table.'))
    .filter((entry) => startsLowercase(entry.value))
    .map((entry) => entry.path);
  const accentDebtPaths = allTextEntries.filter((entry) => hasCommonAccentDebt(entry.value)).map((entry) => entry.path);
  const lowercaseOpeningCount = lowercaseOpeningPaths.length;
  const accentDebtHits = accentDebtPaths.length;
  const encodingIssuePaths = findPortugueseEncodingIssues(repaired);
  const aiFootprintRiskScore = clampScore(
    structureRepetitionScore * 0.52
    + templateSimilarityScore * 0.18
    + Math.min(accentDebtHits, 12) * 3
    + Math.min(lowercaseOpeningCount, 8) * 4
    + Math.min(encodingIssuePaths.length, 8) * 4
  );

  return {
    structureRepetitionScore,
    templateSimilarityScore,
    bulletPatternRepetitionScore,
    cadenceRepetitionScore,
    paragraphSymmetryScore,
    aiFootprintRiskScore,
    signals: {
      sections: sections.length,
      bulletCounts,
      paragraphCounts,
      paragraphBuckets,
      sectionsWithExactlyThreeBullets,
      repeatedParagraphOpenings: countRepeatedValues(paragraphOpenings, 2),
      repeatedHeadingOpenings: countRepeatedValues(sectionHeadingOpenings, 2),
      repeatedFaqPatterns: countRepeatedValues(faqAnswerOpenings, 2),
      repeatedCtaPatterns: countRepeatedValues(ctaOpenings, 2),
      lowercaseOpeningCount,
      lowercaseOpeningPaths: lowercaseOpeningPaths.slice(0, 12),
      accentDebtHits,
      accentDebtPaths: accentDebtPaths.slice(0, 12),
      encodingIssuePaths
    }
  };
};

const HUMAN_INSERTS = [
  'Parece detalhe. Não é.',
  'Na vida real, esse é o ponto que costuma pesar.',
  'Aqui vale diminuir a velocidade.',
  'O contrato não sente urgência; quem sente é a família.',
  'A conta fica menos bonita quando entra no calendário.',
  'É nesse pedaço que muita decisão boa ou ruim nasce.',
  'A pressa costuma deixar a proposta mais convincente do que ela merece.'
];

const diversifyBullets = (bullets = [], sectionIndex = 0) => {
  const clean = sentenceCaseArray(bullets);
  if (!clean.length) return [];
  const desiredCounts = [2, 4, 0, 3, 5, 1, 2, 4, 0, 3, 2, 5];
  const desired = desiredCounts[sectionIndex % desiredCounts.length];
  if (desired === 0) return [];
  const result = clean.slice(0, Math.min(desired, clean.length));
  if (result.length === 3) {
    return sectionIndex % 2 === 0
      ? result.slice(0, 2)
      : [...result, 'Guarde a simulação antes de decidir.'];
  }
  return result;
};

const diversifyParagraphs = (paragraphs = [], sectionIndex = 0) => {
  const clean = sentenceCaseArray(paragraphs);
  if (!clean.length) return [];
  if ([1, 5, 9].includes(sectionIndex) && clean.length >= 2) {
    const insertIndex = [1, 5, 9].indexOf(sectionIndex);
    return [clean[0], HUMAN_INSERTS[insertIndex % HUMAN_INSERTS.length], ...clean.slice(1)];
  }
  if ([3, 7].includes(sectionIndex) && clean.length >= 3) {
    const insertIndex = [3, 7].indexOf(sectionIndex) + 3;
    return [clean[0], `${HUMAN_INSERTS[insertIndex % HUMAN_INSERTS.length]} ${clean[1]}`, ...clean.slice(2)];
  }
  return clean;
};

const reorderSections = (sections = []) => {
  if (sections.length < 7) return sections;
  const first = sections.slice(0, 2);
  const middle = sections.slice(2, -1);
  const last = sections.slice(-1);
  const reordered = [...middle];
  if (reordered.length >= 4) {
    [reordered[1], reordered[2]] = [reordered[2], reordered[1]];
  }
  if (reordered.length >= 7) {
    [reordered[4], reordered[5]] = [reordered[5], reordered[4]];
  }
  return [...first, ...reordered, ...last];
};

const diversifyTables = (sections = []) => {
  const tableIndexes = sections.map((section, index) => section.table?.rows?.length >= 2 ? index : null).filter((index) => index !== null);
  if (tableIndexes.length <= 3) return sections;
  const keep = new Set(tableIndexes.filter((index, tablePosition) => tablePosition < 2 || index % 4 !== 1));
  return sections.map((section, index) => keep.has(index) ? section : { ...section, table: null });
};

const diversifyFaq = (faq = []) => {
  const fallbackAnswers = [
    'Comece pelo contrato, pelo extrato do benefício e pelo canal oficial de contestação. Se o desconto não foi autorizado, não trate como detalhe administrativo.',
    'O ponto central é provar a origem da cobrança: proposta, autorização, banco responsável, número do contrato e valor descontado.',
    'Não basta cancelar a próxima parcela. Em cobrança indevida, também é preciso discutir valores já descontados e registrar protocolo.',
    'Se a resposta do banco for vaga, procure os canais oficiais do INSS, consumidor.gov.br ou defesa do consumidor com documentos salvos.'
  ];
  const seenOpenings = new Set();
  const clean = (Array.isArray(faq) ? faq : [])
    .map((item, index) => {
      let answer = sentenceCase(item?.answer || '')
        .replace(/^Vale quando/i, index % 2 === 0 ? 'Faz sentido quando' : 'Vale quando')
        .replace(/^A resposta depende/i, 'Depende menos da promessa e mais');
      const opening = splitOpening(answer, 5);
      if (seenOpenings.has(opening) || /^Depende menos da promessa/i.test(answer)) {
        answer = fallbackAnswers[index % fallbackAnswers.length];
      }
      seenOpenings.add(splitOpening(answer, 5));
      return {
        question: sentenceCase(item?.question || '').replace(/\.$/, '?'),
        answer
      };
    })
    .filter((item) => item.question && item.answer);
  return clean.slice(0, clean.length > 5 ? 5 : clean.length);
};

const diversifyCtas = (ctas = []) => {
  const clean = (Array.isArray(ctas) ? ctas : []).map((cta, index) => ({
    ...cta,
    title: sentenceCase(cta.title || ''),
    description: sentenceCase(cta.description || ''),
    label: sentenceCase(cta.label || '')
  }));
  if (clean[1]) {
    clean[1] = {
      ...clean[1],
      title: 'Faça a conta antes de aceitar',
      description: 'Compare prazo, CET e renda livre antes de tratar aprovação como boa notícia.'
    };
  }
  return clean;
};

export const applyStructuralDiversity = (article = {}) => {
  const repaired = repairPortugueseInObject(article);
  const sections = reorderSections(Array.isArray(repaired.sections) ? repaired.sections : [])
    .map((section, index) => ({
      ...section,
      heading: sentenceCase(section.heading || ''),
      subheading: sentenceCase(section.subheading || ''),
      paragraphs: diversifyParagraphs(section.paragraphs || [], index),
      bullets: diversifyBullets(section.bullets || [], index)
    }))
    .filter((section) => section.heading);

  const diversifiedSections = diversifyTables(sections);
  const diversified = repairPortugueseInObject({
    ...repaired,
    title: sentenceCase(repaired.title || repaired.h1 || ''),
    h1: sentenceCase(repaired.h1 || repaired.title || ''),
    metaTitle: sentenceCase(repaired.metaTitle || repaired.title || ''),
    metaDescription: sentenceCase(repaired.metaDescription || ''),
    summary: sentenceCase(repaired.summary || ''),
    excerpt: sentenceCase(repaired.excerpt || ''),
    intro: sentenceCaseArray(repaired.intro || []),
    featuredSnippet: sentenceCase(repaired.featuredSnippet || ''),
    expertInsights: sentenceCaseArray(repaired.expertInsights || []),
    retentionHooks: sentenceCaseArray(repaired.retentionHooks || []),
    sections: diversifiedSections,
    midQuestions: (repaired.midQuestions || []).map((item) => ({
      question: sentenceCase(item?.question || '').replace(/\.$/, '?'),
      answer: sentenceCase(item?.answer || '')
    })).filter((item) => item.question && item.answer),
    financialImpact: sentenceCaseArray(repaired.financialImpact || []),
    alternatives: sentenceCaseArray(repaired.alternatives || []),
    faq: diversifyFaq(repaired.faq || []),
    conclusion: sentenceCaseArray(repaired.conclusion || []),
    ctas: diversifyCtas(repaired.ctas || []),
    cta: repaired.cta ? {
      ...repaired.cta,
      eyebrow: sentenceCase(repaired.cta.eyebrow || ''),
      title: sentenceCase(repaired.cta.title || ''),
      description: sentenceCase(repaired.cta.description || ''),
      primary: repaired.cta.primary ? {
        ...repaired.cta.primary,
        label: sentenceCase(repaired.cta.primary.label || '')
      } : repaired.cta.primary,
      secondary: repaired.cta.secondary ? {
        ...repaired.cta.secondary,
        label: sentenceCase(repaired.cta.secondary.label || '')
      } : repaired.cta.secondary
    } : repaired.cta,
    structuralDiversity: {
      version: '2026-05-structural-diversity',
      applied: true,
      rules: [
        'Variação de quantidade de bullets por seção.',
        'Quebra de cadência com frases curtas e parágrafos assimétricos.',
        'Redução de tabelas repetidas quando há excesso.',
        'FAQ e CTA com padrões menos previsíveis.'
      ]
    }
  });

  return {
    ...diversified,
    structuralFingerprint: analyzeStructuralFingerprint(diversified)
  };
};
