import assert from 'node:assert/strict';
import { enforceArticleStandard, stripHtmlArtifacts, validateArticle } from '../src/services/articleQualityService.js';

const baseArticle = {
  title: 'Financiamento sem entrada analise completa',
  h1: 'Financiamento sem entrada analise completa',
  summary: 'Guia sobre financiamento sem entrada.',
  intro: [
    'Financiamento sem entrada exige comparar custo total, parcela e risco antes de decidir.'
  ],
  sections: [
    {
      heading: 'Como funciona',
      subheading: 'Entenda a base da decisao.',
      paragraphs: ['Para avaliar a contratacao, olhe o custo total e a parcela dentro da renda.'],
      bullets: ['Compare CET.', 'Confira prazo.']
    }
  ],
  faq: [],
  conclusion: []
};

const cleaned = stripHtmlArtifacts('Para <a href="/blog/teste" title="comprar carro sem entrada">comprar carro sem entrada</a>, compare custos.');
assert.equal(cleaned, 'Para comprar carro sem entrada, compare custos.');

const standardized = enforceArticleStandard({
  article: baseArticle,
  primaryKeyword: 'Financiamento sem entrada',
  internalLinks: [
    { path: '/emprestimos', title: 'Emprestimos' },
    { path: '/financiamentos', title: 'Financiamentos' },
    { path: '/ferramentas', title: 'Ferramentas' }
  ]
});

const validation = validateArticle({
  article: standardized,
  internalLinks: standardized.internalLinks
});

assert.equal(validation.passed, true, validation.issues.join(' | '));
assert.equal(standardized.intro.length <= 2, true);
assert.equal(standardized.faq.length >= 4, true);
assert.equal(standardized.ctas.length, 3);
assert.equal(/<a\b/i.test(JSON.stringify(standardized)), false);

const invalid = validateArticle({
  article: {
    title: 'Titulo fraco',
    intro: ['Texto com <a href="/blog/x">tag crua</a>.'],
    sections: [],
    faq: []
  },
  internalLinks: []
});

assert.equal(invalid.passed, false);
assert.equal(invalid.issues.some((issue) => /HTML cru|Headline|FAQ|CTA/.test(issue)), true);

console.log(JSON.stringify({ ok: true, checks: validation.checks }, null, 2));
