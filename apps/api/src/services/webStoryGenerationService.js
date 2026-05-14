import { PUBLIC_SITE_URL } from './editorialConfig.js';
import { buildPublicStoryUrl, validateWebStorySeo } from './webStorySeoService.js';
import { WebStoryEligibilityService } from './webStoryEligibilityService.js';
import { WebStoryFingerprintService } from './webStoryFingerprintService.js';

const clamp = (value, min = 0, max = 100) => Math.max(min, Math.min(max, Math.round(value)));

const normalize = (value = '') =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

const stripTags = (value = '') => String(value || '').replace(/<[^>]*>/g, ' ');
const compact = (value = '') => stripTags(value).replace(/\s+/g, ' ').trim();

const escapeHtml = (value = '') =>
  String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const toSlug = (value = '') =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

const truncate = (value = '', max = 64) => {
  const text = compact(value);
  if (text.length <= max) return text;
  return text.slice(0, max).trim().replace(/\s+\S*$/, '');
};

const sentence = (value = '', max = 112) => truncate(compact(value).split(/(?<=[.!?])\s+/)[0] || value, max);
const MIN_DISCOVER_READINESS = 80;

const cleanTitle = (value = '') =>
  compact(value)
    .replace(/\s+vale a pena\??/i, '')
    .replace(/\s+veja custos e riscos/i, '')
    .replace(/\s+compare custos e riscos/i, '')
    .replace(/\s+/g, ' ')
    .trim();

const pickImage = (article = {}) =>
  article.coverImage ||
  article.ogImage ||
  article.image ||
  article.featuredImageUrl ||
  'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=1200&q=80';

const articleUrl = (article = {}) =>
  `${PUBLIC_SITE_URL}${String(article.routePath || `/blog/${article.slug || toSlug(article.title)}/`).replace(/\/?$/, '/')}`;

const getSections = (article = {}) => {
  if (Array.isArray(article.sections) && article.sections.length) return article.sections;
  return [
    { heading: article.title || article.keyword, subheading: article.summary || article.reason || '', paragraphs: [article.reason || article.summary || ''] },
    { heading: 'O que muda no seu bolso', subheading: article.reason || '', paragraphs: [article.reason || 'Veja o impacto pratico antes de decidir.'] },
    { heading: 'Sinais de atencao', subheading: article.cluster || article.family || '', paragraphs: ['Compare fonte, prazo, risco e consequencia real.'] },
  ];
};

const slideToneFor = (article = {}) => {
  const text = normalize(`${article.keyword || ''} ${article.title || ''} ${article.cluster || ''}`);
  if (/golpe|fraude|falso|pix|boleto/.test(text)) return 'alert';
  if (/inss|fgts|selic|nova regra|mudanca/.test(text)) return 'news';
  if (/comparar|vale a pena|risco/.test(text)) return 'decision';
  return 'guide';
};

const microInsight = (tone, index) => {
  const map = {
    alert: [
      'Golpe bom para o criminoso sempre tenta encurtar seu tempo de conferir.',
      'Canal oficial, protocolo e comprovante valem mais que pressa.',
      'Se pediram senha, Pix ou codigo, a conversa ja mudou de risco.',
      'Pausar por dois minutos pode evitar uma perda de meses.',
    ],
    news: [
      'A noticia importa quando muda prestacao, prazo, beneficio ou renda livre.',
      'Fonte oficial vem antes de simulacao apressada.',
      'O efeito no bolso costuma aparecer aos poucos.',
      'Compare antes e depois, nao apenas a manchete.',
    ],
    decision: [
      'Parcela pequena pode ser custo grande espalhado no tempo.',
      'A proposta boa sobrevive ao mes ruim.',
      'Contrato claro responde antes de pedir documento.',
      'A decisao segura parece menos urgente e mais verificavel.',
    ],
    guide: [
      'Um passo simples pode reduzir erro caro.',
      'A ordem certa evita decisao por impulso.',
      'Quando a conta fica visivel, a escolha melhora.',
      'O objetivo e sair com proximo passo, nao com promessa.',
    ],
  };
  const list = map[tone] || map.guide;
  return list[index % list.length];
};

const ctaFor = (article = {}) => {
  const text = normalize(`${article.keyword || ''} ${article.cluster || ''} ${article.type || ''}`);
  if (/golpe|fraude|falso|pix|boleto/.test(text)) return { label: 'Ver passo a passo', url: articleUrl(article), tone: 'security' };
  if (/inss|fgts|selic|nova regra/.test(text)) return { label: 'Entender impacto', url: articleUrl(article), tone: 'news' };
  return { label: 'Ler guia completo', url: articleUrl(article), tone: 'guide' };
};

const buildSlides = (article = {}) => {
  const sections = getSections(article);
  const imageUrl = pickImage(article);
  const tone = slideToneFor(article);
  const cleanArticleTitle = cleanTitle(article.h1 || article.title || article.keyword);
  if (tone === 'alert') {
    return [
      {
        kind: 'cover',
        headline: truncate(cleanArticleTitle || 'Alerta de golpe financeiro', 52),
        subline: 'Veja os sinais antes de enviar documento, Pix ou comprovante.',
        imageUrl,
        imageRole: `${tone}-cover`,
        layout: 'cover-editorial',
      },
      {
        kind: 'hook',
        headline: 'Golpe costuma pedir pressa',
        subline: 'A urgencia serve para voce nao conferir canal, contrato e CNPJ.',
        imageUrl,
        imageRole: `${tone}-hook`,
        layout: 'quote',
      },
      {
        kind: 'check',
        headline: 'Taxa antecipada e alerta vermelho',
        subline: 'Seguro, IOF ou cadastro por Pix antes da liberacao merece pausa imediata.',
        imageUrl,
        imageRole: `${tone}-check-1`,
        layout: 'checklist',
      },
      {
        kind: 'context',
        headline: 'Aprovacao garantida nao combina com credito serio',
        subline: 'Instituicao confiavel analisa renda, risco, contrato e documentacao.',
        imageUrl,
        imageRole: `${tone}-context-1`,
        layout: 'split-read',
      },
      {
        kind: 'decision',
        headline: 'Confira o canal oficial',
        subline: 'Procure site, CNPJ, reputacao e atendimento formal antes de continuar.',
        imageUrl,
        imageRole: `${tone}-decision-1`,
        layout: 'bottom-focus',
      },
      {
        kind: 'check',
        headline: 'Salve tudo',
        subline: 'Prints, protocolos, contrato e comprovantes ajudam se virar prejuizo.',
        imageUrl,
        imageRole: `${tone}-check-2`,
        layout: 'checklist',
      },
      {
        kind: 'decision',
        headline: 'Se pediram senha, codigo ou Pix, pare',
        subline: 'Essa conversa ja saiu da simulacao e entrou em zona de risco.',
        imageUrl,
        imageRole: `${tone}-decision-2`,
        layout: 'bottom-focus',
      },
      {
        kind: 'cta',
        headline: 'Leia o guia completo antes de agir',
        subline: 'Dois minutos de checagem podem evitar meses de problema.',
        imageUrl,
        imageRole: `${tone}-cta`,
        layout: 'cta-final',
        ctaLabel: ctaFor(article).label,
      },
    ];
  }
  const opener =
    tone === 'alert'
      ? 'Antes de agir, confirme o canal e salve provas.'
      : tone === 'news'
        ? 'A mudanca importa quando aparece no boleto, no beneficio ou no prazo.'
        : tone === 'decision'
          ? 'A escolha boa costuma aparecer no custo total, nao na promessa.'
          : 'O ponto e transformar informacao em decisao simples.';

  const middle = sections.flatMap((section, index) => [
    {
      kind: index % 2 ? 'context' : 'decision',
      headline: truncate(section.heading || section.subheading || article.title, 48),
      subline: sentence(section.subheading || section.paragraphs?.[0] || section.heading, 96),
      imageUrl,
      imageRole: `${tone}-${index % 3}`,
      layout: index % 2 ? 'split-read' : 'bottom-focus',
    },
    ...(Array.isArray(section.bullets) && section.bullets[0] ? [{
      kind: 'check',
      headline: truncate(section.bullets[0], 48),
      subline: microInsight(tone, index),
      imageUrl,
      imageRole: `${tone}-check-${index % 2}`,
      layout: 'checklist',
    }] : []),
  ]);

  const slides = [
    {
      kind: 'cover',
      headline: truncate(cleanArticleTitle || article.h1 || article.title || article.keyword, 52),
      subline: sentence(article.summary || article.excerpt || opener, 94),
      imageUrl,
      imageRole: `${tone}-cover`,
      layout: 'cover-editorial',
    },
    {
      kind: 'hook',
      headline: tone === 'alert' ? 'O golpe costuma apressar voce' : 'O detalhe caro quase nunca vem no titulo',
      subline: opener,
      imageUrl,
      imageRole: `${tone}-hook`,
      layout: 'quote',
    },
    ...middle,
    {
      kind: 'cta',
      headline: 'Antes de decidir, veja o guia completo',
      subline: microInsight(tone, 3),
      imageUrl,
      imageRole: `${tone}-cta`,
      layout: 'cta-final',
      ctaLabel: ctaFor(article).label,
    },
  ];

  return slides.slice(0, 8).filter((slide) => slide.headline && slide.subline);
};

const buildSlideSvg = ({ slide = {}, story = {}, index = 0 } = {}) => `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="720" height="1280" viewBox="0 0 720 1280" role="img" aria-label="${escapeHtml(slide.headline)}">
  <defs>
    <linearGradient id="readability" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#04111f" stop-opacity="0.10"/>
      <stop offset="46%" stop-color="#04111f" stop-opacity="0.26"/>
      <stop offset="100%" stop-color="#04111f" stop-opacity="0.84"/>
    </linearGradient>
  </defs>
  <image href="${escapeHtml(slide.imageUrl)}" x="0" y="0" width="720" height="1280" preserveAspectRatio="xMidYMid slice"/>
  <rect width="720" height="1280" fill="url(#readability)"/>
  <text x="48" y="820" fill="#ffffff" font-family="Arial, sans-serif" font-size="24" font-weight="700">${escapeHtml(story.clusterLabel || 'Cote Juros')}</text>
  <text x="48" y="910" fill="#ffffff" font-family="Arial, sans-serif" font-size="44" font-weight="900">${escapeHtml(slide.headline)}</text>
  <text x="48" y="1010" fill="#f8fafc" font-family="Arial, sans-serif" font-size="28" font-weight="700">${escapeHtml(slide.subline)}</text>
  <text x="48" y="1188" fill="#e5e7eb" font-family="Arial, sans-serif" font-size="18" font-weight="700">Slide ${index + 1} de ${(story.slides || []).length}</text>
</svg>`;

const buildStoryHtml = ({ story = {} }) => {
  const pages = story.slides.map((slide, index) => `
    <amp-story-page id="page-${index + 1}">
      <amp-story-grid-layer template="fill">
        <amp-img src="${escapeHtml(slide.imageUrl)}" width="720" height="1280" layout="fill" object-fit="cover" alt="${escapeHtml(slide.headline)}"></amp-img>
      </amp-story-grid-layer>
      <amp-story-grid-layer template="fill"><div class="shade"></div></amp-story-grid-layer>
      <amp-story-grid-layer template="vertical" class="copy ${escapeHtml(slide.layout)}">
        <div class="spacer"></div>
        <p class="kicker">${escapeHtml(story.clusterLabel || 'Cote Juros')}</p>
        <h1>${escapeHtml(slide.headline)}</h1>
        <p>${escapeHtml(slide.subline)}</p>
      </amp-story-grid-layer>
      ${slide.kind === 'cta' ? `<amp-story-cta-layer><a class="cta" href="${escapeHtml(story.articleUrl)}">${escapeHtml(story.cta.label)}</a></amp-story-cta-layer>` : ''}
    </amp-story-page>`).join('\n');

  return `<!doctype html>
<html amp lang="pt-BR">
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(story.title)}</title>
  <link rel="canonical" href="${escapeHtml(story.canonical)}">
  <meta name="viewport" content="width=device-width,minimum-scale=1,initial-scale=1">
  <meta name="robots" content="${story.indexable ? 'index,follow,max-image-preview:large' : 'noindex,nofollow'}">
  <meta name="description" content="${escapeHtml(story.description)}">
  <script async src="https://cdn.ampproject.org/v0.js"></script>
  <script async custom-element="amp-story" src="https://cdn.ampproject.org/v0/amp-story-1.0.js"></script>
  <script async custom-element="amp-story-auto-ads" src="https://cdn.ampproject.org/v0/amp-story-auto-ads-0.1.js"></script>
  <style amp-boilerplate>body{-webkit-animation:-amp-start 8s steps(1,end) 0s 1 normal both;animation:-amp-start 8s steps(1,end) 0s 1 normal both}@keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}</style><noscript><style amp-boilerplate>body{-webkit-animation:none;animation:none}</style></noscript>
  <style amp-custom>
    amp-story{font-family:Arial,sans-serif;color:#fff}
    .shade{width:100%;height:100%;background:linear-gradient(180deg,rgba(2,6,23,.08),rgba(2,6,23,.18) 42%,rgba(2,6,23,.78))}
    .copy{padding:70px 34px 96px;text-shadow:0 2px 16px rgba(0,0,0,.44)}
    .spacer{height:40vh;min-height:300px}
    .kicker{display:inline-flex;width:max-content;max-width:260px;padding:10px 18px;border-radius:999px;background:rgba(2,6,23,.5);font-size:13px;font-weight:900}
    h1{width:310px;max-width:calc(100vw - 68px);font-size:30px;line-height:1.08;margin:20px 0 0;font-weight:900;letter-spacing:0;overflow-wrap:break-word}
    p{width:320px;max-width:calc(100vw - 68px);font-size:16px;line-height:1.28;margin:18px 0 0;font-weight:800;color:rgba(255,255,255,.94)}
    .quote h1{font-size:34px}.checklist h1{font-size:28px}.cta{display:inline-flex;align-items:center;justify-content:center;min-height:56px;padding:0 26px;border-radius:999px;background:#fff;color:#111827;font-size:18px;font-weight:900;text-decoration:none}
  </style>
  <script type="application/ld+json">${JSON.stringify(story.schema)}</script>
</head>
<body>
  <amp-story standalone title="${escapeHtml(story.title)}" publisher="Cote Juros" publisher-logo-src="${PUBLIC_SITE_URL}/assets/logo/logo-icon-square.png" poster-portrait-src="${escapeHtml(story.posterImageUrl)}">
    <amp-story-auto-ads><script type="application/json">{"ad-attributes":{"type":"adsense","data-ad-client":"ca-pub-2873725911890738","data-ad-slot":"1892315338"}}</script></amp-story-auto-ads>
    ${pages}
  </amp-story>
</body>
</html>`;
};

export class WebStoryGenerationService {
  static generate({ article = {}, candidate = {}, existingStories = [], history = [], dryRun = true, indexable = false } = {}) {
    const storySource = {
      ...candidate,
      ...article,
      title: article.title || candidate.title || candidate.keyword,
      keyword: candidate.keyword || article.keyword,
      slug: article.slug || toSlug(candidate.keyword || article.title),
      type: candidate.type || article.type,
      cluster: candidate.cluster || article.cluster,
      family: candidate.family || article.family,
      scores: {
        ...(candidate.scores || {}),
        ...(article.scores || {}),
      },
    };
    const eligibility = WebStoryEligibilityService.evaluate({ article: storySource, candidate, existingStories });
    if (!eligibility.eligible) {
      return {
        ok: false,
        status: 'story_blocked',
        dryRun,
        published: false,
        distributed: false,
        eligibility,
      };
    }

    const slug = storySource.slug;
    const storyPublicPath = `/stories/${slug}`;
    const canonical = buildPublicStoryUrl(storyPublicPath);
    const slides = buildSlides(storySource);
    const cta = ctaFor(storySource);
    const posterImageUrl = pickImage(storySource);
    const story = {
      status: 'story_generated_preview',
      dryRun,
      storyPublished: false,
      storyDistributed: false,
      indexable,
      slug,
      articleSlug: storySource.slug,
      articleUrl: articleUrl(storySource),
      title: `${truncate(cleanTitle(storySource.title || storySource.keyword), 64)} | Web Story`,
      headline: truncate(cleanTitle(storySource.title || storySource.keyword), 56),
      description: sentence(storySource.metaDescription || storySource.summary || storySource.reason || storySource.title, 140),
      canonical,
      storyPublicPath,
      posterImageUrl,
      cta,
      slides,
      cluster: storySource.cluster,
      family: storySource.family,
      clusterLabel: storySource.clusterLabel || storySource.cluster || 'Cote Juros',
      visualSystem: {
        templateKey: `${slideToneFor(storySource)}-${clamp((storySource.slug || '').length % 5, 0, 4)}`,
        mobileNative: true,
        dimensions: '720x1280',
      },
    };
    story.schema = {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: story.headline,
      description: story.description,
      image: story.posterImageUrl,
      mainEntityOfPage: story.canonical,
      isPartOf: story.articleUrl,
      publisher: {
        '@type': 'Organization',
        name: 'Cote Juros',
      },
    };
    story.html = buildStoryHtml({ story });
    story.bookendJson = JSON.stringify({
      bookendVersion: 'v1.0',
      shareProviders: ['facebook', 'twitter', 'email'],
      components: [{ type: 'small', title: storySource.title, url: story.articleUrl, image: story.posterImageUrl }],
    }, null, 2);
    story.slideAssets = slides.map((slide, index) => ({
      path: `${storyPublicPath}/assets/slide-${index + 1}.svg`,
      content: buildSlideSvg({ slide, story, index }),
    }));

    const seoValidation = validateWebStorySeo({
      article: storySource,
      storyHtml: story.html,
      bookendJson: story.bookendJson,
      distribution: { webStory: { path: storyPublicPath, url: canonical } },
      slideAssets: story.slideAssets,
      posterImageUrl,
      storyPublicPath,
      articleUrl: story.articleUrl,
    });
    const fingerprint = WebStoryFingerprintService.evaluate({ story, history });
    const validation = this.validateStory({ story, eligibility, seoValidation, fingerprint });

    return {
      ok: validation.passed,
      status: validation.passed ? 'story_preview_ready' : 'story_blocked',
      dryRun,
      published: false,
      distributed: false,
      indexed: Boolean(indexable && validation.passed),
      story,
      eligibility,
      fingerprint,
      seoValidation,
      validation,
      observability: {
        originArticle: storySource.slug,
        cluster: story.cluster,
        family: story.family,
        discoverReadiness: validation.scores.discoverReadiness,
        futureMetricsPrepared: ['CTR', 'completionRate', 'tapForwardRate', 'articleClickthrough', 'Discover impressions'],
      },
    };
  }

  static validateStory({ story = {}, eligibility = {}, seoValidation = {}, fingerprint = {} } = {}) {
    const slideTextIssues = (story.slides || []).flatMap((slide, index) => {
      const issues = [];
      if (compact(slide.headline).length > 58) issues.push(`slide ${index + 1}: headline longo`);
      if (compact(slide.subline).length > 116) issues.push(`slide ${index + 1}: subtitulo longo`);
      if (normalize(slide.headline).includes('segredo') || normalize(slide.headline).includes('chocante')) issues.push(`slide ${index + 1}: clickbait`);
      return issues;
    });
    const originality = clamp(100 - (fingerprint.webStoryFingerprintRisk || 0) - Math.max(0, 8 - (story.slides || []).length) * 4);
    const visualScore = clamp(100 - (fingerprint.visualRepetitionRisk || 0));
    const narrativeScore = clamp(100 - (fingerprint.narrativeRepetitionRisk || 0));
    const discoverReadiness = clamp(
      (eligibility.webStoryEligibilityScore || 0) * 0.35 +
        visualScore * 0.22 +
        narrativeScore * 0.22 +
        originality * 0.16 +
        (seoValidation.passed ? 5 : 0)
    );
    const issues = [
      ...(eligibility.blockers || []),
      ...(fingerprint.blockers || []),
      ...(seoValidation.issues || []),
      ...slideTextIssues,
      (story.slides || []).length < 5 ? 'menos de 5 slides' : null,
      (story.slides || []).length > 10 ? 'mais de 10 slides' : null,
      discoverReadiness < MIN_DISCOVER_READINESS ? `Discover readiness abaixo de ${MIN_DISCOVER_READINESS}` : null,
    ].filter(Boolean);

    return {
      passed: issues.length === 0,
      issues,
      scores: {
        webStoryEligibility: eligibility.webStoryEligibilityScore || 0,
        visualScore,
        narrativeScore,
        originality,
        discoverReadiness,
        webStoryFingerprintRisk: fingerprint.webStoryFingerprintRisk || 0,
      },
      gates: {
        articleApproved: true,
        seo: seoValidation.passed,
        antiFootprint: fingerprint.passed,
        robots: story.indexable ? 'index,follow' : 'noindex,nofollow',
      },
    };
  }
}

export default WebStoryGenerationService;
