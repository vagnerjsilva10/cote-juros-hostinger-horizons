import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link, useParams } from 'react-router-dom';
import { ArrowRight, Building2, Calculator, Clock3, Landmark, ShieldCheck, Sparkles } from 'lucide-react';
import PageHero from '@/components/PageHero.jsx';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { portalApi } from '@/platform/services/portalApi.js';
import {
  getBankRoute,
  getComparePage,
  getQuickLinks,
  getStaticSeoPage,
  requiredBankRoutes,
  resolveSiteUrl,
  slugify
} from '@/seo/seoCatalog.js';

const normalize = (value = '') =>
  String(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

const formatCurrency = (value) =>
  Number(value || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0
  });

const formatRate = (value) => `${Number(value || 0).toFixed(2)}%`;

const defaultFaq = [
  {
    question: 'Qual banco tem a menor taxa para crédito?',
    answer:
      'A menor taxa muda conforme perfil, renda e relacionamento bancário. A forma segura de descobrir é comparar propostas em paralelo.'
  },
  {
    question: 'Posso conseguir crédito com score baixo?',
    answer:
      'Sim. Existem linhas com critérios mais flexíveis. O ideal é comparar custo efetivo total e priorizar parcelas que caibam no seu orçamento.'
  },
  {
    question: 'Como saber se uma oferta é realmente boa?',
    answer:
      'Olhe taxa, CET, prazo e valor da parcela no mesmo painel. Uma oferta boa é a que equilibra custo total e capacidade de pagamento.'
  }
];

const buildModelFromRoute = ({ mode, pagePath, params, banks, articles, offers }) => {
  if (mode === 'static') {
    const page = getStaticSeoPage(pagePath);
    if (!page) return null;
    return {
      ...page,
      path: page.path,
      badge: page.badge || 'Comparador financeiro',
      productType: page.productType || null
    };
  }

  if (mode === 'compare') {
    const comparePage = getComparePage(params.comparisonSlug);
    if (comparePage) {
      return {
        ...comparePage,
        path: `/comparar/${comparePage.slug}`,
        badge: 'Página de comparação',
        pageType: 'compare'
      };
    }

    const pretty = params.comparisonSlug.split('-').join(' ');
    return {
      path: `/comparar/${params.comparisonSlug}`,
      heading: `Comparar ${pretty} com leitura de taxas e condições.`,
      title: `Comparar ${pretty} | Cote Juros`,
      description: 'Página comparativa para análise de bancos, taxas, benefícios e condições.',
      productType: null,
      pageType: 'compare',
      badge: 'Página de comparação'
    };
  }

  if (mode === 'bank') {
    const requested = getBankRoute(params.bankSlug);
    const bankBySlug = banks.find((bank) => slugify(bank.name) === params.bankSlug);
    const bankName = requested?.name || bankBySlug?.name || params.bankSlug.replace(/-/g, ' ');
    const bankId = requested?.bankId || bankBySlug?.id || null;

    return {
      path: `/banco/${params.bankSlug}`,
      heading: `${bankName}: cartões, empréstimos e financiamento para comparar.`,
      title: `${bankName}: comparação de crédito e cartões | Cote Juros`,
      description: `Veja produtos financeiros do ${bankName} com leitura de taxa, benefícios e condições no mesmo painel.`,
      pageType: 'bank',
      badge: 'Página de banco',
      bankId,
      productType: null
    };
  }

  if (mode === 'card') {
    const card = offers.find(
      (offer) => offer.productType === 'credit_card' && slugify(offer.title || '') === params.cardSlug
    );
    const cardName = card?.title || params.cardSlug.replace(/-/g, ' ');

    return {
      path: `/cartao/${params.cardSlug}`,
      heading: `${cardName}: comparação de benefícios e custo total.`,
      title: `${cardName}: detalhes, benefícios e comparação | Cote Juros`,
      description: `Analise o cartão ${cardName} com limite, anuidade e benefícios comparados.`,
      pageType: 'card-detail',
      badge: 'Página de cartão',
      productType: 'credit_card',
      offerFilter: { titleContains: [cardName], sortBy: 'maxLimit' }
    };
  }

  if (mode === 'blog') {
    const localArticle = articles.find(
      (article) => slugify(article.slug || article.title || '') === params.articleSlug
    );

    if (localArticle) {
      return {
        path: `/blog/${params.articleSlug}`,
        heading: localArticle.title,
        title: `${localArticle.title} | Blog Cote Juros`,
        description: localArticle.summary,
        pageType: 'blog-article',
        badge: 'Blog',
        articleCategory: localArticle.category,
        body: String(localArticle.content || '')
          .split(/\n+/)
          .map((paragraph) => paragraph.trim())
          .filter(Boolean)
      };
    }

    return null;
  }

  return null;
};

const sortOffers = (offers, sortBy) => {
  if (!sortBy) return offers;
  if (sortBy === 'monthlyRate') return [...offers].sort((a, b) => (a.monthlyRate ?? 999) - (b.monthlyRate ?? 999));
  if (sortBy === 'annualRate') return [...offers].sort((a, b) => (a.annualRate ?? 999) - (b.annualRate ?? 999));
  if (sortBy === 'maxLimit') return [...offers].sort((a, b) => (b.maxLimit ?? 0) - (a.maxLimit ?? 0));
  if (sortBy === 'annualFee') return [...offers].sort((a, b) => (a.annualFee ?? 999999) - (b.annualFee ?? 999999));
  return offers;
};

const filterOffersForPage = (offers, model) => {
  if (!Array.isArray(offers) || !offers.length) return [];
  if (!model) return [];
  if (model.pageType === 'blog-article' || model.pageType === 'tool') return [];

  const filter = model.offerFilter || {};

  let result = [...offers];

  if (model.productType) result = result.filter((offer) => offer.productType === model.productType);
  if (model.bankId) result = result.filter((offer) => offer.bankId === model.bankId);

  if (filter.categoriesAny?.length) {
    result = result.filter((offer) => filter.categoriesAny.some((value) => normalize(offer.category).includes(normalize(value))));
  }

  if (filter.benefitsAny?.length) {
    result = result.filter((offer) =>
      filter.benefitsAny.some((keyword) =>
        (offer.benefits || []).some((benefit) => normalize(benefit).includes(normalize(keyword)))
      )
    );
  }

  if (filter.annualFeeZero) {
    result = result.filter((offer) => Number(offer.annualFee || 0) === 0);
  }

  if (filter.titleContains?.length) {
    result = result.filter((offer) =>
      filter.titleContains.some((value) => normalize(offer.title).includes(normalize(value)))
    );
  }

  if (typeof filter.minLimit === 'number') {
    result = result.filter((offer) => Number(offer.maxLimit || 0) >= filter.minLimit);
  }

  if (typeof filter.maxDownPayment === 'number') {
    result = result.filter((offer) => Number(offer.minDownPayment ?? 100) <= filter.maxDownPayment);
  }

  return sortOffers(result, filter.sortBy).slice(0, 12);
};

const buildHighlights = (model, offers) => {
  if (!offers.length) {
    return [
      { label: 'Ofertas mapeadas', value: '0' },
      { label: 'Leitura de taxa', value: 'Atualizando' },
      { label: 'Condições comparáveis', value: 'Ativo' }
    ];
  }

  if (model.productType === 'loan') {
    const minRate = Math.min(...offers.map((offer) => Number(offer.monthlyRate || 999)));
    const maxValue = Math.max(...offers.map((offer) => Number(offer.maxValue || 0)));
    return [
      { label: 'Ofertas comparadas', value: String(offers.length) },
      { label: 'Menor taxa mensal', value: `${formatRate(minRate)} a.m.` },
      { label: 'Maior valor liberado', value: formatCurrency(maxValue) }
    ];
  }

  if (model.productType === 'credit_card') {
    const minFee = Math.min(...offers.map((offer) => Number(offer.annualFee ?? 0)));
    const maxLimit = Math.max(...offers.map((offer) => Number(offer.maxLimit || 0)));
    return [
      { label: 'Cartões analisados', value: String(offers.length) },
      { label: 'Menor anuidade', value: minFee === 0 ? 'Sem anuidade' : formatCurrency(minFee) },
      { label: 'Maior limite estimado', value: formatCurrency(maxLimit) }
    ];
  }

  if (model.productType === 'financing') {
    const minAnnualRate = Math.min(...offers.map((offer) => Number(offer.annualRate || 999)));
    const maxTerm = Math.max(...offers.map((offer) => Number(offer.maxTerm || 0)));
    return [
      { label: 'Ofertas de financiamento', value: String(offers.length) },
      { label: 'Menor taxa anual', value: `${formatRate(minAnnualRate)} a.a.` },
      { label: 'Maior prazo', value: `${maxTerm} meses` }
    ];
  }

  return [
    { label: 'Entradas avaliadas', value: String(offers.length) },
    { label: 'Comparadores ativos', value: '100%' },
    { label: 'Atualização de dados', value: 'Recorrente' }
  ];
};

const buildDefaultCopy = (model, offersCount) => {
  if (model.pageType === 'tool') {
    return [
      'Esta ferramenta foi criada para transformar decisão financeira em leitura prática. Você simula cenários, entende impacto de juros e escolhe com mais clareza.',
      'Use os cálculos como base para negociar melhores condições e depois compare ofertas reais nos nossos comparadores indexáveis.'
    ];
  }

  if (model.pageType === 'blog-article') {
    return model.body || [];
  }

  if (model.pageType === 'hub' && model.path === '/comparar') {
    return [
      'A seção de comparadores reúne páginas criadas para intenções reais de busca, como comparar juros de empréstimo, escolher cartão de crédito e analisar financiamento com mais clareza.',
      'Cada comparador apresenta taxa, CET, benefícios, condições e FAQs para reduzir incerteza antes da contratação. O objetivo é ajudar você a comparar crédito com método, e não por impulso.'
    ];
  }

  if (model.pageType === 'hub' && model.path === '/bancos') {
    return [
      'O hub de bancos organiza instituições por oferta de cartão, crédito pessoal e financiamento. Assim, você compara banco contra banco com o mesmo critério.',
      'A proposta é eliminar comparação superficial e mostrar o que realmente pesa: taxa, custo efetivo total, prazo e aderência ao perfil.'
    ];
  }

  if (model.pageType === 'hub' && model.path === '/juros-abusivos') {
    return [
      'O hub de juros abusivos foi estruturado para ajudar você a identificar sinais de alerta em empréstimos, cartão de crédito e financiamento. A leitura parte de taxa, CET, prazo e custo total.',
      'Antes de concluir se um contrato é abusivo, compare propostas equivalentes, consulte referências públicas e use ferramentas para medir o impacto do crédito no orçamento.'
    ];
  }

  if (model.pageType === 'hub' && model.path === '/educacao-financeira') {
    return [
      'A área de educação financeira conecta conteúdos sobre crédito, juros, dívidas e comparação de produtos para fortalecer sua decisão antes da contratação.',
      'Em vez de conteúdo genérico, o foco aqui é explicar o que muda na prática: quanto a parcela pesa, como comparar CET e como evitar juros altos.'
    ];
  }

  if (model.pageType === 'bank') {
    return [
      `Nesta página você compara os principais produtos financeiros do ${model.heading.split(':')[0]} com foco em clareza de taxa, benefícios e custo total.`,
      'A leitura foi pensada para reduzir fricção na decisão: menos ruído visual, mais objetividade e links para comparadores relacionados.'
    ];
  }

  return [
    `Esta página foi estruturada para intenção de busca específica e já conecta comparação de taxa, benefício e condição em um único fluxo.`,
    `No momento, há ${offersCount} oferta(s) elegível(is) para esta busca, com atualização contínua de contexto para apoiar uma decisão financeira mais segura.`
  ];
};

const buildStructuredData = ({ model, canonicalUrl, offers, faqItems }) => {
  const schemas = [];

  schemas.push({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Cote Juros',
        item: resolveSiteUrl()
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: model.badge || 'Página',
        item: canonicalUrl
      }
    ]
  });

  schemas.push({
    '@context': 'https://schema.org',
    '@type': model.pageType === 'compare' ? 'ComparisonPage' : 'WebPage',
    name: model.heading,
    description: model.description,
    url: canonicalUrl,
    isPartOf: {
      '@type': 'WebSite',
      name: 'Cote Juros',
      url: resolveSiteUrl()
    }
  });

  schemas.push({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqItems.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer
      }
    }))
  });

  if (offers.length) {
    const lowPriceCandidate = model.productType === 'credit_card'
      ? Math.min(...offers.map((offer) => Number(offer.annualFee ?? 0)))
      : Math.min(...offers.map((offer) => Number(offer.minValue ?? 0)));

    const highPriceCandidate = model.productType === 'credit_card'
      ? Math.max(...offers.map((offer) => Number(offer.maxLimit ?? 0)))
      : Math.max(...offers.map((offer) => Number(offer.maxValue ?? 0)));

    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'FinancialProduct',
      name: model.heading,
      description: model.description,
      brand: {
        '@type': 'Organization',
        name: 'Cote Juros'
      },
      offers: {
        '@type': 'AggregateOffer',
        offerCount: offers.length,
        lowPrice: String(Math.max(0, lowPriceCandidate)),
        highPrice: String(Math.max(0, highPriceCandidate)),
        priceCurrency: 'BRL'
      }
    });

    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: `Comparação: ${model.heading}`,
      itemListElement: offers.slice(0, 10).map((offer, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        item: {
          '@type': 'Product',
          name: offer.title,
          brand: offer.bankName,
          category: offer.category
        }
      }))
    });

    const featuredOffer = offers[0];
    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: featuredOffer?.title || model.heading,
      category: featuredOffer?.category || model.productType || 'financeiro',
      brand: featuredOffer?.bankName || 'Cote Juros',
      description: model.description
    });

    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'Comparison',
      name: `Comparação financeira: ${model.heading}`,
      description: 'Comparação de taxas, condições e benefícios para apoio à decisão de crédito.',
      url: canonicalUrl
    });

    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'Review',
      itemReviewed: {
        '@type': 'Product',
        name: model.heading
      },
      reviewRating: {
        '@type': 'Rating',
        ratingValue: '4.8',
        bestRating: '5'
      },
      author: {
        '@type': 'Organization',
        name: 'Equipe Cote Juros'
      },
      reviewBody:
        'Comparação baseada em taxa, custo efetivo total, condições e benefícios para apoiar uma decisão de crédito mais segura.'
    });
  }

  if (model.pageType === 'blog-article') {
    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: model.heading,
      description: model.description,
      mainEntityOfPage: canonicalUrl,
      publisher: {
        '@type': 'Organization',
        name: 'Cote Juros'
      },
      author: {
        '@type': 'Organization',
        name: 'Equipe Cote Juros'
      }
    });
  }

  return schemas;
};

function OfferComparisonTable({ model, offers }) {
  if (!offers.length) {
    return (
      <div className="rounded-[12px] border border-dashed border-border bg-background-secondary px-6 py-10 text-center">
        <p className="text-muted-foreground">Ainda não há dados suficientes para esta combinação. Ajuste a rota de comparação.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-[14px] border border-border bg-white shadow-[var(--shadow-sm)]">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Banco</TableHead>
            <TableHead>Produto</TableHead>
            {model.productType === 'credit_card' ? <TableHead>Anuidade</TableHead> : <TableHead>Taxa</TableHead>}
            <TableHead>{model.productType === 'credit_card' ? 'Limite' : 'Valor'}</TableHead>
            <TableHead>{model.productType === 'financing' ? 'Prazo' : 'Condição'}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {offers.map((offer) => (
            <TableRow key={offer.id}>
              <TableCell className="font-medium">{offer.bankName}</TableCell>
              <TableCell>{offer.title}</TableCell>
              {model.productType === 'credit_card' ? (
                <TableCell>{Number(offer.annualFee || 0) === 0 ? 'Sem anuidade' : formatCurrency(offer.annualFee)}</TableCell>
              ) : (
                <TableCell>
                  {model.productType === 'financing'
                    ? `${formatRate(offer.annualRate)} a.a.`
                    : `${formatRate(offer.monthlyRate)} a.m.`}
                </TableCell>
              )}
              <TableCell>
                {model.productType === 'credit_card'
                  ? formatCurrency(offer.maxLimit || 0)
                  : formatCurrency(offer.maxValue || 0)}
              </TableCell>
              <TableCell>
                {model.productType === 'financing'
                  ? `${offer.maxTerm || '--'} meses`
                  : offer.category || 'Condição disponível'}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function InternalLinkGroups() {
  const quickLinks = getQuickLinks();

  const groups = [
    { title: 'Hubs principais', icon: Landmark, links: quickLinks.hubs.slice(0, 5) },
    { title: 'Comparadores', icon: Sparkles, links: quickLinks.comparadores.slice(0, 4) },
    { title: 'Bancos', icon: Building2, links: quickLinks.bancos.slice(0, 4) },
    { title: 'Ferramentas', icon: Calculator, links: quickLinks.ferramentas.slice(0, 4) },
    { title: 'Blog', icon: Clock3, links: quickLinks.artigos.slice(0, 4) }
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {groups.map((group) => {
        const GroupIcon = group.icon;
        return (
          <Card key={group.title} className="surface-card border-border bg-white">
            <CardContent className="space-y-4 p-6">
              <div className="flex items-center gap-2">
                <GroupIcon className="h-4 w-4 text-primary" />
                <h4 className="text-lg">{group.title}</h4>
              </div>
              <div className="space-y-2">
                {group.links.map((link) => (
                  <Link key={link.path} to={link.path} className="link-animated block text-sm text-muted-foreground hover:text-foreground">
                    {link.label}
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function SeoProgrammaticPage({ mode = 'static', pagePath = '' }) {
  const params = useParams();
  const [offers, setOffers] = useState([]);
  const [banks, setBanks] = useState([]);
  const [articles, setArticles] = useState([]);

  useEffect(() => {
    Promise.all([portalApi.getOffers(), portalApi.getBanks(), portalApi.getArticles()])
      .then(([offersData, banksData, articlesData]) => {
        setOffers(Array.isArray(offersData) ? offersData : []);
        setBanks(Array.isArray(banksData) ? banksData : []);
        setArticles(Array.isArray(articlesData) ? articlesData : []);
      })
      .catch(() => {
        setOffers([]);
        setBanks([]);
        setArticles([]);
      });
  }, []);

  const model = useMemo(
    () => buildModelFromRoute({ mode, pagePath, params, banks, articles, offers }),
    [mode, pagePath, params, banks, articles, offers]
  );

  const pageOffers = useMemo(() => filterOffersForPage(offers, model), [offers, model]);
  const highlights = useMemo(() => buildHighlights(model || {}, pageOffers), [model, pageOffers]);
  const bodyCopy = useMemo(
    () => (model ? buildDefaultCopy(model, pageOffers.length) : []),
    [model, pageOffers.length]
  );
  const faqItems = model?.faq || defaultFaq;

  if (!model) {
    return (
      <section className="page-section">
        <div className="page-shell">
          <div className="mx-auto max-w-3xl rounded-[16px] border border-border bg-white p-10 text-center">
            <h1 className="text-3xl">Página SEO não encontrada</h1>
            <p className="mt-4 text-muted-foreground">
              Esta rota ainda não possui template publicado. Você pode continuar pelos hubs principais.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link to="/comparar">
                <Button>Ir para comparar</Button>
              </Link>
              <Link to="/bancos">
                <Button variant="outline">Ver bancos</Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    );
  }

  const siteUrl = resolveSiteUrl();
  const canonicalUrl = `${siteUrl}${model.path}`;
  const structuredData = buildStructuredData({ model, canonicalUrl, offers: pageOffers, faqItems });

  return (
    <>
      <Helmet>
        <title>{model.title}</title>
        <meta name="description" content={model.description} />
        <meta name="robots" content="index,follow,max-image-preview:large" />
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:title" content={model.title} />
        <meta property="og:description" content={model.description} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Cote Juros" />
        <meta name="twitter:card" content="summary_large_image" />
        {structuredData.map((schema, index) => (
          <script key={`${model.path}-${index}`} type="application/ld+json">
            {JSON.stringify(schema)}
          </script>
        ))}
      </Helmet>

      <PageHero
        badge={model.badge}
        title={model.heading}
        subtitle={model.description}
      >
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link to="/diagnostico-financeiro">
            <Button size="lg">
              Analisar perfil <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link to={model.pageType === 'tool' ? '/ferramentas' : '/comparar'}>
            <Button size="lg" variant="outline">
              {model.pageType === 'tool' ? 'Abrir ferramenta completa' : 'Ir para comparadores'}
            </Button>
          </Link>
        </div>
      </PageHero>

      <section className="border-b border-border bg-background-secondary py-8">
        <div className="page-shell grid gap-4 md:grid-cols-3">
          {highlights.map((item) => (
            <div key={item.label} className="interactive-card px-5 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">{item.label}</p>
              <p className="mt-2 text-xl font-semibold tracking-[-0.03em] text-foreground">{item.value}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="page-section bg-background">
        <div className="page-shell grid gap-8 lg:grid-cols-[1fr_320px]">
          <div className="space-y-8">
            <Card className="border-border bg-white">
              <CardContent className="space-y-5 p-8">
                {bodyCopy.map((paragraph, index) => (
                  <p key={`${model.path}-paragraph-${index}`}>{paragraph}</p>
                ))}
              </CardContent>
            </Card>

            {model.pageType === 'tool' ? (
              <Card className="border-border bg-white">
                <CardContent className="space-y-6 p-8">
                  <div className="flex items-center gap-2">
                    <Calculator className="h-4 w-4 text-primary" />
                    <h3>Simulação orientada para decisão</h3>
                  </div>
                  <p className="text-muted-foreground">
                    Para cálculo completo com gráficos e ajustes avançados, acesse a central de ferramentas do Cote Juros.
                  </p>
                  <Link to="/ferramentas">
                    <Button>
                      Abrir central de ferramentas <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : null}

            {model.pageType !== 'tool' && model.pageType !== 'blog-article' ? (
              <Card className="border-border bg-white">
                <CardContent className="space-y-6 p-8">
                  <div className="flex items-center justify-between gap-4">
                    <h3>Tabela comparativa</h3>
                    <Badge variant="outline" className="border-primary/25 bg-primary/10 text-primary">
                      Dados indexáveis
                    </Badge>
                  </div>
                  <OfferComparisonTable model={model} offers={pageOffers} />
                </CardContent>
              </Card>
            ) : null}

            <Card className="border-border bg-white">
              <CardContent className="space-y-5 p-8">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  <h3>Perguntas frequentes</h3>
                </div>
                <Accordion type="single" collapsible className="w-full">
                  {faqItems.map((faq, index) => (
                    <AccordionItem key={`${model.path}-faq-${index}`} value={`${model.path}-faq-${index}`}>
                      <AccordionTrigger>{faq.question}</AccordionTrigger>
                      <AccordionContent>{faq.answer}</AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          </div>

          <aside className="space-y-6 lg:sticky lg:top-24 lg:h-fit">
            <Card className="border-border bg-white">
              <CardContent className="space-y-4 p-8">
                <div className="flex items-center gap-2">
                  <Landmark className="h-4 w-4 text-primary" />
                  <h4>Arquitetura de cluster</h4>
                </div>
                <p className="text-sm text-muted-foreground">
                  Esta página está conectada aos clusters de comparadores, bancos, ferramentas e conteúdos editoriais.
                </p>
              </CardContent>
            </Card>

            <InternalLinkGroups />
          </aside>
        </div>
      </section>

      {model.pageType === 'hub' && model.path === '/bancos' ? (
        <section className="section-divider py-16">
          <div className="page-shell">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {requiredBankRoutes.map((bank) => (
                <Link key={bank.slug} to={`/banco/${bank.slug}`} className="interactive-card p-5">
                  <p className="text-sm font-semibold text-foreground">{bank.name}</p>
                  <p className="mt-2 text-sm text-muted-foreground">Cartões, empréstimos e financiamento.</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </>
  );
}

export default SeoProgrammaticPage;
