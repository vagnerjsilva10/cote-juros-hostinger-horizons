const normalize = (value = '') =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

const stripTags = (value = '') => String(value || '').replace(/<[^>]*>/g, ' ');
const compact = (value = '') => stripTags(value).replace(/\s+/g, ' ').trim();

const truncate = (value = '', max = 58) => {
  const text = compact(value);
  if (text.length <= max) return text;
  return text.slice(0, max).trim().replace(/\s+\S*$/, '');
};

const cleanTitle = (value = '') =>
  compact(value)
    .replace(/\s+vale a pena\??/i, '')
    .replace(/\s+veja custos e riscos/i, '')
    .replace(/\s+compare custos e riscos/i, '')
    .replace(/\s+/g, ' ')
    .trim();

const firstSentence = (value = '', max = 96) =>
  truncate(compact(value).split(/(?<=[.!?])\s+/)[0] || value, max);

const detectTone = (article = {}) => {
  const text = normalize(`${article.keyword || ''} ${article.title || ''} ${article.cluster || ''} ${article.type || ''}`);
  if (/golpe|fraude|falso|pix|boleto|atendente/.test(text)) return 'alert';
  if (/inss|fgts|selic|nova regra|mudanca|banco central/.test(text)) return 'news';
  if (/comparar|vale a pena|risco|cartao|emprestimo|financiamento/.test(text)) return 'decision';
  return 'guide';
};

const pickImage = (article = {}) =>
  article.coverImage ||
  article.ogImage ||
  article.image ||
  article.featuredImageUrl ||
  'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=1200&q=80';

const paletteFor = (tone, seed = '') => {
  const variants = {
    alert: [
      { key: 'alert-red', accent: '#ef4444', shade: 'rgba(69,10,10,.82)' },
      { key: 'alert-amber', accent: '#f59e0b', shade: 'rgba(69,26,3,.82)' },
      { key: 'alert-slate', accent: '#38bdf8', shade: 'rgba(8,47,73,.82)' },
    ],
    news: [
      { key: 'news-blue', accent: '#0ea5e9', shade: 'rgba(12,43,71,.82)' },
      { key: 'news-green', accent: '#22c55e', shade: 'rgba(20,83,45,.82)' },
      { key: 'news-indigo', accent: '#818cf8', shade: 'rgba(49,46,129,.82)' },
    ],
    decision: [
      { key: 'decision-cyan', accent: '#06b6d4', shade: 'rgba(22,78,99,.82)' },
      { key: 'decision-gold', accent: '#eab308', shade: 'rgba(66,32,6,.82)' },
      { key: 'decision-emerald', accent: '#10b981', shade: 'rgba(6,78,59,.82)' },
    ],
    guide: [
      { key: 'guide-teal', accent: '#14b8a6', shade: 'rgba(15,76,70,.82)' },
      { key: 'guide-violet', accent: '#a78bfa', shade: 'rgba(76,29,149,.82)' },
      { key: 'guide-rose', accent: '#fb7185', shade: 'rgba(136,19,55,.82)' },
    ],
  };
  const list = variants[tone] || variants.guide;
  const index = String(seed || '').length % list.length;
  return list[index];
};

const ctaFor = (article = {}) => {
  const tone = detectTone(article);
  if (tone === 'alert') return { label: 'Conferir o guia', tone: 'security' };
  if (tone === 'news') return { label: 'Ver o impacto', tone: 'news' };
  if (tone === 'decision') return { label: 'Comparar com calma', tone: 'decision' };
  return { label: 'Ler o guia', tone: 'guide' };
};

const slide = ({ kind, role, headline, subline, imageUrl, imageRole, layout, visualCue }) => ({
  kind,
  role,
  headline: truncate(headline, 54),
  subline: truncate(subline, 82),
  imageUrl,
  imageRole,
  layout,
  visualCue,
});

const alertStory = ({ article, imageUrl }) => {
  const title = cleanTitle(article.title || article.keyword || 'Alerta de golpe financeiro');
  return [
    slide({
      kind: 'cover',
      role: 'problema',
      headline: title,
      subline: 'O golpe parece oferta boa. A pressa entrega o risco.',
      imageUrl,
      imageRole: 'alert-cover-human',
      layout: 'cover-editorial',
      visualCue: 'alerta',
    }),
    slide({
      kind: 'hook',
      role: 'risco',
      headline: 'Desconfie da urgência',
      subline: 'Quem apressa você quer cortar sua checagem.',
      imageUrl,
      imageRole: 'alert-pressure',
      layout: 'quote',
      visualCue: 'cronometro',
    }),
    slide({
      kind: 'example',
      role: 'exemplo',
      headline: 'Exemplo comum no Brasil',
      subline: 'Prometem liberar crédito, mas pedem Pix de taxa antes.',
      imageUrl,
      imageRole: 'alert-brazil-case',
      layout: 'split-read',
      visualCue: 'caso-real',
    }),
    slide({
      kind: 'authority',
      role: 'autoridade',
      headline: 'Crédito sério tem análise',
      subline: 'Renda, contrato, CNPJ e canal oficial precisam aparecer.',
      imageUrl,
      imageRole: 'alert-authority',
      layout: 'bottom-focus',
      visualCue: 'contrato',
    }),
    slide({
      kind: 'warning',
      role: 'orientacao',
      headline: 'Senha e código: nunca',
      subline: 'Banco não pede senha completa nem código para “liberar”.',
      imageUrl,
      imageRole: 'alert-password',
      layout: 'impact',
      visualCue: 'bloqueio',
    }),
    slide({
      kind: 'check',
      role: 'checklist',
      headline: 'Cheque antes de pagar',
      subline: 'CNPJ, site oficial, contrato, CET e reputação.',
      imageUrl,
      imageRole: 'alert-checklist',
      layout: 'checklist',
      visualCue: 'checklist',
    }),
    slide({
      kind: 'action',
      role: 'proximo-passo',
      headline: 'Se já pagou, salve provas',
      subline: 'Prints, comprovantes e protocolos ajudam no BO.',
      imageUrl,
      imageRole: 'alert-evidence',
      layout: 'action',
      visualCue: 'provas',
    }),
    slide({
      kind: 'cta',
      role: 'cta',
      headline: 'Antes de agir, leia o guia',
      subline: 'Dois minutos podem evitar meses de prejuízo.',
      imageUrl,
      imageRole: 'alert-cta',
      layout: 'cta-final',
      visualCue: 'guia',
    }),
  ];
};

const newsStory = ({ article, imageUrl }) => {
  const title = cleanTitle(article.title || article.keyword || 'Mudança financeira');
  return [
    slide({ kind: 'cover', role: 'problema', headline: title, subline: 'A manchete importa se muda dinheiro, prazo ou benefício.', imageUrl, imageRole: 'news-cover', layout: 'cover-editorial', visualCue: 'noticia' }),
    slide({ kind: 'context', role: 'risco', headline: 'O ponto é o impacto', subline: 'Não é só o que mudou. É quando chega no bolso.', imageUrl, imageRole: 'news-impact', layout: 'quote', visualCue: 'bolso' }),
    slide({ kind: 'example', role: 'exemplo', headline: 'Compare antes e depois', subline: 'Parcela, benefício, taxa ou regra: veja a diferença prática.', imageUrl, imageRole: 'news-before-after', layout: 'split-read', visualCue: 'comparativo' }),
    slide({ kind: 'authority', role: 'autoridade', headline: 'Fonte oficial primeiro', subline: 'Banco Central, Gov.br ou órgão regulador vêm antes do boato.', imageUrl, imageRole: 'news-source', layout: 'bottom-focus', visualCue: 'fonte' }),
    slide({ kind: 'check', role: 'checklist', headline: 'Checklist rápido', subline: 'Quem muda, desde quando, quem é afetado e quanto custa.', imageUrl, imageRole: 'news-check', layout: 'checklist', visualCue: 'checklist' }),
    slide({ kind: 'cta', role: 'cta', headline: 'Entenda o cenário completo', subline: 'Leia a análise antes de decidir por impulso.', imageUrl, imageRole: 'news-cta', layout: 'cta-final', visualCue: 'analise' }),
  ];
};

const decisionStory = ({ article, imageUrl }) => {
  const title = cleanTitle(article.title || article.keyword || 'Decisão financeira');
  return [
    slide({ kind: 'cover', role: 'problema', headline: title, subline: 'A proposta boa precisa caber no mês ruim.', imageUrl, imageRole: 'decision-cover', layout: 'cover-editorial', visualCue: 'decisao' }),
    slide({ kind: 'risk', role: 'risco', headline: 'Parcela baixa engana', subline: 'O custo pode estar escondido no prazo longo.', imageUrl, imageRole: 'decision-risk', layout: 'quote', visualCue: 'parcela' }),
    slide({ kind: 'example', role: 'exemplo', headline: 'Olhe o total pago', subline: 'R$ 200 por mês pode custar muito mais no fim.', imageUrl, imageRole: 'decision-total', layout: 'split-read', visualCue: 'total' }),
    slide({ kind: 'authority', role: 'autoridade', headline: 'Compare pelo CET', subline: 'Juros, tarifas e seguros precisam entrar na conta.', imageUrl, imageRole: 'decision-cet', layout: 'bottom-focus', visualCue: 'cet' }),
    slide({ kind: 'check', role: 'checklist', headline: 'Checklist de decisão', subline: 'CET, prazo, renda livre, contrato e atraso.', imageUrl, imageRole: 'decision-check', layout: 'checklist', visualCue: 'checklist' }),
    slide({ kind: 'cta', role: 'cta', headline: 'Compare com calma', subline: 'Leia o guia completo antes de assumir parcela.', imageUrl, imageRole: 'decision-cta', layout: 'cta-final', visualCue: 'guia' }),
  ];
};

const guideStory = ({ article, imageUrl }) => {
  const title = cleanTitle(article.title || article.keyword || 'Guia financeiro');
  const sections = Array.isArray(article.sections) ? article.sections : [];
  return [
    slide({ kind: 'cover', role: 'problema', headline: title, subline: firstSentence(article.summary || article.excerpt || 'Organize a decisão em passos simples.'), imageUrl, imageRole: 'guide-cover', layout: 'cover-editorial', visualCue: 'guia' }),
    slide({ kind: 'hook', role: 'risco', headline: 'Comece pelo que pesa', subline: 'Renda, prazo, risco e urgência vêm antes da promessa.', imageUrl, imageRole: 'guide-risk', layout: 'quote', visualCue: 'ordem' }),
    slide({ kind: 'example', role: 'exemplo', headline: truncate(sections[0]?.heading || 'Transforme em conta'), subline: firstSentence(sections[0]?.subheading || sections[0]?.paragraphs?.[0] || 'A decisão melhora quando o custo fica visível.'), imageUrl, imageRole: 'guide-example', layout: 'split-read', visualCue: 'exemplo' }),
    slide({ kind: 'check', role: 'checklist', headline: 'Checklist prático', subline: 'Fonte, custo, prazo, consequência e próximo passo.', imageUrl, imageRole: 'guide-check', layout: 'checklist', visualCue: 'checklist' }),
    slide({ kind: 'cta', role: 'cta', headline: 'Leia antes de decidir', subline: 'O guia completo ajuda a evitar pressa cara.', imageUrl, imageRole: 'guide-cta', layout: 'cta-final', visualCue: 'guia' }),
  ];
};

export class WebStoryPremiumComposerService {
  static compose({ article = {} } = {}) {
    const tone = detectTone(article);
    const imageUrl = pickImage(article);
    const palette = paletteFor(tone, article.slug || article.title);
    const builders = {
      alert: alertStory,
      news: newsStory,
      decision: decisionStory,
      guide: guideStory,
    };
    const slides = (builders[tone] || guideStory)({ article, imageUrl });
    const title = cleanTitle(article.title || article.keyword || 'Web Story Cote Juros');
    const description = firstSentence(
      tone === 'alert'
        ? `${title}: sinais de alerta, exemplo prático, checklist e próximo passo seguro.`
        : article.metaDescription || article.summary || article.excerpt || title,
      140
    );

    return {
      tone,
      title,
      headline: truncate(title, 56),
      description,
      posterImageUrl: imageUrl,
      slides,
      cta: ctaFor(article),
      visualSystem: {
        templateKey: `${tone}-${palette.key}-${String(article.slug || '').length % 7}`,
        palette,
        mobileNative: true,
        dimensions: '720x1280',
        storyArc: slides.map((item) => item.role),
      },
    };
  }
}

export default WebStoryPremiumComposerService;
