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
    question: 'Qual banco tem a menor taxa para crÃ©dito?',
    answer:
      'A menor taxa muda conforme perfil, renda e relacionamento bancÃ¡rio. A forma segura de descobrir Ã© comparar propostas em paralelo.'
  },
  {
    question: 'Posso conseguir crÃ©dito com score baixo?',
    answer:
      'Sim. Existem linhas com critÃ©rios mais flexÃ­veis. O ideal Ã© comparar custo efetivo total e priorizar parcelas que caibam no seu orÃ§amento.'
  },
  {
    question: 'Como saber se uma oferta Ã© realmente boa?',
    answer:
      'Olhe taxa, CET, prazo e valor da parcela no mesmo painel. Uma oferta boa Ã© a que equilibra custo total e capacidade de pagamento.'
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
        badge: 'ComparaÃ§Ã£o financeira',
        pageType: 'compare'
      };
    }

    const pretty = params.comparisonSlug.split('-').join(' ');
    return {
      path: `/comparar/${params.comparisonSlug}`,
      heading: `Comparar ${pretty} com taxas e condiÃ§Ãµes em um sÃ³ lugar.`,
      title: `Comparar ${pretty} | Cote Juros`,
      description: 'Veja opÃ§Ãµes, compare custos e entenda o que observar antes de contratar.',
      productType: null,
      pageType: 'compare',
      badge: 'ComparaÃ§Ã£o financeira'
    };
  }

  if (mode === 'bank') {
    const requested = getBankRoute(params.bankSlug);
    const bankBySlug = banks.find((bank) => slugify(bank.name) === params.bankSlug);
    const bankName = requested?.name || bankBySlug?.name || params.bankSlug.replace(/-/g, ' ');
    const bankId = requested?.bankId || bankBySlug?.id || null;

    return {
      path: `/banco/${params.bankSlug}`,
      heading: `${bankName}: cartÃµes, emprÃ©stimos e financiamento para comparar.`,
      title: `${bankName}: comparaÃ§Ã£o de crÃ©dito e cartÃµes | Cote Juros`,
      description: `Veja produtos financeiros do ${bankName} com leitura de taxa, benefÃ­cios e condiÃ§Ãµes no mesmo painel.`,
      pageType: 'bank',
      badge: 'PÃ¡gina de banco',
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
      heading: `${cardName}: comparaÃ§Ã£o de benefÃ­cios e custo total.`,
      title: `${cardName}: detalhes, benefÃ­cios e comparaÃ§Ã£o | Cote Juros`,
      description: `Analise o cartÃ£o ${cardName} com limite, anuidade e benefÃ­cios comparados.`,
      pageType: 'card-detail',
      badge: 'PÃ¡gina de cartÃ£o',
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
  if (Array.isArray(model?.comparisonTable?.rows) && model.comparisonTable.rows.length && !model.productType && !model.bankId && !model.offerFilter) {
    return [];
  }

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
  if (Array.isArray(model?.highlights) && model.highlights.length) {
    return model.highlights;
  }

  if (!offers.length) {
    return [
      { label: 'Ofertas mapeadas', value: '0' },
      { label: 'Leitura de taxa', value: 'Atualizando' },
      { label: 'CondiÃ§Ãµes comparÃ¡veis', value: 'Ativo' }
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
      { label: 'CartÃµes analisados', value: String(offers.length) },
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
    { label: 'AtualizaÃ§Ã£o de dados', value: 'Recorrente' }
  ];
};

const buildDefaultCopy = (model, offersCount) => {
  if (Array.isArray(model?.body) && model.body.length) {
    return model.body;
  }

  if (model.pageType === 'tool') {
    return [
      'Esta ferramenta foi criada para transformar decisÃ£o financeira em leitura prÃ¡tica. VocÃª simula cenÃ¡rios, entende impacto de juros e escolhe com mais clareza.',
      'Use os cÃ¡lculos como base para negociar melhores condiÃ§Ãµes e depois compare ofertas reais com mais seguranÃ§a.'
    ];
  }

  if (model.pageType === 'blog-article') {
    return model.body || [];
  }

  if (model.pageType === 'hub' && model.path === '/comparar') {
    return [
      'A seÃ§Ã£o de comparadores reÃºne caminhos prÃ¡ticos para analisar cartÃµes, emprÃ©stimos e financiamentos antes de contratar.',
      'Use as pÃ¡ginas para comparar taxas, benefÃ­cios, prazos, custos e cuidados importantes de acordo com o seu objetivo.'
    ];
  }

  if (model.pageType === 'hub' && model.path === '/bancos') {
    return [
      'A pÃ¡gina de bancos organiza instituiÃ§Ãµes por oferta de cartÃ£o, crÃ©dito pessoal e financiamento. Assim, vocÃª compara banco contra banco com o mesmo critÃ©rio.',
      'A proposta Ã© eliminar comparaÃ§Ã£o superficial e mostrar o que realmente pesa: taxa, custo efetivo total, prazo e aderÃªncia ao perfil.'
    ];
  }

  if (model.pageType === 'bank') {
    return [
      `Nesta pÃ¡gina vocÃª compara os principais produtos financeiros do ${model.heading.split(':')[0]} com foco em clareza de taxa, benefÃ­cios e custo total.`,
      'A leitura foi pensada para deixar a decisÃ£o mais simples: menos ruÃ­do visual, mais objetividade e links para comparadores relacionados.'
    ];
  }

  return [
    'Use esta comparaÃ§Ã£o para entender quais opÃ§Ãµes combinam melhor com o que vocÃª procura e quais custos precisam entrar na conta.',
    offersCount
      ? `No momento, encontramos ${offersCount} opÃ§Ã£o${offersCount > 1 ? 'Ãµes' : ''} para comparar nesta pÃ¡gina. Analise taxas, limites, prazos e condiÃ§Ãµes antes de avanÃ§ar.`
      : 'Ainda estamos atualizando as opÃ§Ãµes desta pÃ¡gina. Enquanto isso, use os critÃ©rios abaixo para comparar propostas com mais seguranÃ§a.'
  ];
};

const buildStructuredData = ({ model, canonicalUrl, offers, faqItems }) => {
  const schemas = [];
  const comparisonRows = Array.isArray(model?.comparisonTable?.rows) ? model.comparisonTable.rows : [];

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
      name: `ComparaÃ§Ã£o: ${model.heading}`,
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
      name: `ComparaÃ§Ã£o financeira: ${model.heading}`,
      description: 'ComparaÃ§Ã£o de taxas, condiÃ§Ãµes e benefÃ­cios para apoio Ã  decisÃ£o de crÃ©dito.',
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
        'ComparaÃ§Ã£o baseada em taxa, custo efetivo total, condiÃ§Ãµes e benefÃ­cios para apoiar uma decisÃ£o de crÃ©dito mais segura.'
    });
  }

  if (!offers.length && comparisonRows.length) {
    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: `ComparaÃ§Ã£o: ${model.heading}`,
      itemListElement: comparisonRows.slice(0, 10).map((row, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        item: {
          '@type': 'Product',
          name: Array.isArray(row) ? row[0] : row?.title || `${model.heading} ${index + 1}`,
          category: model.badge || 'ComparaÃ§Ã£o financeira'
        }
      }))
    });
  }

  return schemas;
};

function OfferComparisonTable({ model, offers }) {
  const customColumns = Array.isArray(model?.comparisonTable?.columns) ? model.comparisonTable.columns : [];
  const customRows = Array.isArray(model?.comparisonTable?.rows) ? model.comparisonTable.rows : [];

  if (customColumns.length && customRows.length) {
    return (
      <div className="max-w-full min-w-0 overflow-x-auto rounded-[14px] border border-border bg-white shadow-[var(--shadow-sm)]">
        <Table className="min-w-[620px] sm:min-w-[760px]">
          <TableHeader>
            <TableRow>
              {customColumns.map((column) => (
                <TableHead key={column}>{column}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {customRows.map((row, index) => (
              <TableRow key={`${model.path || model.slug}-custom-row-${index}`}>
                {row.map((cell, cellIndex) => (
                  <TableCell key={`${model.path || model.slug}-custom-cell-${index}-${cellIndex}`} className={cellIndex === 0 ? 'font-medium' : ''}>
                    {cell}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (!offers.length) {
    return (
      <div className="rounded-[12px] border border-dashed border-border bg-background-secondary px-6 py-10 text-center">
        <p className="text-muted-foreground">Ainda nÃ£o hÃ¡ dados suficientes para esta combinaÃ§Ã£o. Ajuste a rota de comparaÃ§Ã£o.</p>
      </div>
    );
  }

  return (
    <div className="max-w-full min-w-0 overflow-x-auto rounded-[14px] border border-border bg-white shadow-[var(--shadow-sm)]">
      <Table className="min-w-[560px] sm:min-w-[680px]">
        <TableHeader>
          <TableRow>
            <TableHead>Banco</TableHead>
            <TableHead>Produto</TableHead>
            {model.productType === 'credit_card' ? <TableHead>Anuidade</TableHead> : <TableHead>Taxa</TableHead>}
            <TableHead>{model.productType === 'credit_card' ? 'Limite' : 'Valor'}</TableHead>
            <TableHead>{model.productType === 'financing' ? 'Prazo' : 'CondiÃ§Ã£o'}</TableHead>
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
                  : offer.category || 'CondiÃ§Ã£o disponÃ­vel'}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function PageActionButton({ action, variant = 'default', size = 'lg', className = '' }) {
  if (!action) return null;

  if (action.href) {
    return (
      <Button asChild size={size} variant={variant} className={className}>
        <a href={action.href} target="_blank" rel="nofollow sponsored noopener noreferrer">
          {action.label}
          <ArrowRight className="h-4 w-4" />
        </a>
      </Button>
    );
  }

  return (
    <Button asChild size={size} variant={variant} className={className}>
      <Link to={action.to || '/comparar'}>
        {action.label}
        <ArrowRight className="h-4 w-4" />
      </Link>
    </Button>
  );
}

function RecommendationCardsSection({ title = 'RecomendaÃ§Ã£o editorial', cards = [] }) {
  if (!cards.length) return null;

  return (
    <Card className="min-w-0 border-border bg-white">
      <CardContent className="min-w-0 space-y-5 p-5 sm:p-6 md:p-8">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <h3>{title}</h3>
        </div>
        <div className="grid min-w-0 gap-4 xl:grid-cols-2">
          {cards.map((card) => (
            <div key={`${card.title}-${card.href || card.label}`} className="min-w-0 rounded-[16px] border border-border bg-background-secondary p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary/80">{card.label}</p>
              <h4 className="mt-2 text-lg text-foreground">{card.title}</h4>
              {card.description ? <p className="mt-2 text-sm leading-6 text-muted-foreground">{card.description}</p> : null}
              {Array.isArray(card.bullets) && card.bullets.length ? (
                <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-6 text-muted-foreground marker:text-primary">
                  {card.bullets.map((bullet) => (
                    <li key={`${card.title}-${bullet}`}>{bullet}</li>
                  ))}
                </ul>
              ) : null}
              <div className="mt-5">
                <PageActionButton action={{ label: card.ctaLabel || 'Ver condiÃ§Ãµes', href: card.href, to: card.to }} size="default" className="w-full sm:w-auto" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function EditorialSections({ sections = [], relatedGroups = [] }) {
  if (!sections.length) return null;

  const relatedLinks = relatedGroups.flatMap((group) => group.links || []).slice(0, 6);

  return (
    <Card className="min-w-0 border-border bg-white">
      <CardContent className="min-w-0 space-y-8 p-5 sm:p-6 md:p-8">
        {sections.map((section, index) => (
          <section key={`${section.heading}-${index}`} className="space-y-4">
            <h3>{section.heading}</h3>
            {Array.isArray(section.paragraphs)
              ? section.paragraphs.map((paragraph, paragraphIndex) => (
                <p key={`${section.heading}-p-${paragraphIndex}`} className="text-muted-foreground">
                  {paragraph}
                </p>
              ))
              : null}
            {Array.isArray(section.bullets) && section.bullets.length ? (
              <ul className="list-disc space-y-2 pl-5 text-sm leading-6 text-muted-foreground marker:text-primary">
                {section.bullets.map((bullet) => (
                  <li key={`${section.heading}-${bullet}`}>{bullet}</li>
                ))}
              </ul>
            ) : null}
          </section>
        ))}

        {relatedLinks.length ? (
          <section className="space-y-4 border-t border-border pt-6">
            <h3>Veja tambÃ©m</h3>
            <div className="grid min-w-0 gap-3 sm:grid-cols-2">
              {relatedLinks.map((link) => (
                <Link key={`${link.path}-${link.label}`} to={link.path} className="min-w-0 rounded-[12px] border border-border bg-background-secondary px-4 py-4 text-sm leading-6 text-muted-foreground transition-colors hover:border-primary/35 hover:bg-primary/[0.03] hover:text-foreground">
                  {link.label}
                </Link>
              ))}
            </div>
          </section>
        ) : null}
      </CardContent>
    </Card>
  );
}

function InternalLinkGroups({ customGroups = null }) {
  const quickLinks = getQuickLinks();

  const groups = Array.isArray(customGroups) && customGroups.length
    ? customGroups.map((group, index) => ({
      title: group.title,
      icon: [Sparkles, Building2, Calculator, Clock3][index % 4],
      links: Array.isArray(group.links) ? group.links : []
    }))
    : [
      { title: 'Comparadores', icon: Sparkles, links: quickLinks.comparadores.slice(0, 4) },
      { title: 'Bancos', icon: Building2, links: quickLinks.bancos.slice(0, 4) },
      { title: 'Ferramentas', icon: Calculator, links: quickLinks.ferramentas.slice(0, 4) },
      { title: 'Blog', icon: Clock3, links: quickLinks.artigos.slice(0, 4) }
    ];

  return (
    <div className="grid min-w-0 gap-4 md:grid-cols-2 lg:grid-cols-1">
      {groups.map((group) => {
        const GroupIcon = group.icon;
        return (
          <Card key={group.title} className="surface-card min-w-0 border-border bg-white">
            <CardContent className="min-w-0 space-y-4 p-5 sm:p-6">
              <div className="flex items-center justify-center gap-2 text-center">
                <GroupIcon className="h-4 w-4 text-primary" />
                <h4 className="text-lg">{group.title}</h4>
              </div>
              <div className="space-y-2">
                {group.links.map((link) => (
                  <Link key={link.path} to={link.path} className="block min-w-0 break-words rounded-[12px] border border-border bg-background-secondary px-4 py-3 text-sm leading-6 text-muted-foreground transition-colors hover:border-primary/35 hover:bg-primary/[0.03] hover:text-foreground">
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
  const editorialSections = Array.isArray(model?.editorialSections) ? model.editorialSections : [];
  const recommendationCards = Array.isArray(model?.recommendationCards) ? model.recommendationCards : [];
  const linkGroups = Array.isArray(model?.linkGroups) ? model.linkGroups : [];

  if (!model) {
    return (
      <section className="page-section">
        <div className="page-shell">
          <div className="mx-auto max-w-3xl rounded-[16px] border border-border bg-white p-10 text-center">
            <h1 className="text-3xl">PÃ¡gina SEO nÃ£o encontrada</h1>
            <p className="mt-4 text-muted-foreground">
              Esta rota ainda nÃ£o possui template publicado. VocÃª pode continuar pelos hubs principais.
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
          <PageActionButton
            action={model.primaryCta || { label: 'Analisar perfil', to: '/diagnostico-financeiro' }}
            className="w-full sm:w-auto"
          />
          <PageActionButton
            action={model.secondaryCta || { label: model.pageType === 'tool' ? 'Abrir ferramenta completa' : 'Ir para comparadores', to: model.pageType === 'tool' ? '/ferramentas' : '/comparar' }}
            variant="outline"
            className="w-full sm:w-auto"
          />
        </div>
      </PageHero>

      <section className="border-b border-border bg-background-secondary py-8">
        <div className="page-shell grid min-w-0 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {highlights.map((item) => (
            <div key={item.label} className="interactive-card min-w-0 px-5 py-4 text-center sm:text-left">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">{item.label}</p>
              <p className="mt-2 text-xl font-semibold tracking-[-0.03em] text-foreground">{item.value}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="page-section bg-background">
        <div className="page-shell grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-8">
          <div className="min-w-0 space-y-6 md:space-y-8">
            <Card className="min-w-0 border-border bg-white">
              <CardContent className="min-w-0 space-y-5 p-5 sm:p-6 md:p-8">
                {bodyCopy.map((paragraph, index) => (
                  <p key={`${model.path}-paragraph-${index}`}>{paragraph}</p>
                ))}
              </CardContent>
            </Card>

            <EditorialSections sections={editorialSections} relatedGroups={linkGroups} />

            {model.pageType === 'tool' ? (
              <Card className="min-w-0 border-border bg-white">
                <CardContent className="min-w-0 space-y-6 p-5 sm:p-6 md:p-8">
                  <div className="flex items-center gap-2">
                    <Calculator className="h-4 w-4 text-primary" />
                    <h3>SimulaÃ§Ã£o orientada para decisÃ£o</h3>
                  </div>
                  <p className="text-muted-foreground">
                    Para cÃ¡lculo completo com grÃ¡ficos e ajustes avanÃ§ados, acesse a central de ferramentas do Cote Juros.
                  </p>
                  <Link to="/ferramentas" className="inline-flex w-full sm:w-auto">
                    <Button className="w-full sm:w-auto">
                      Abrir central de ferramentas <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : null}

            {model.pageType !== 'tool' && model.pageType !== 'blog-article' ? (
              <Card className="min-w-0 border-border bg-white">
                <CardContent className="min-w-0 space-y-6 p-5 sm:p-6 md:p-8">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <h3>Tabela comparativa</h3>
                    <Badge variant="outline" className="border-primary/25 bg-primary/10 text-primary">
                      Compare com calma
                    </Badge>
                  </div>
                  <OfferComparisonTable model={model} offers={pageOffers} />
                  {model?.comparisonTable?.note ? (
                    <p className="text-sm leading-6 text-muted-foreground">{model.comparisonTable.note}</p>
                  ) : null}
                </CardContent>
              </Card>
            ) : null}

            <RecommendationCardsSection title={model.recommendationCardsTitle || 'Blocos de conversÃ£o'} cards={recommendationCards} />

            <Card className="min-w-0 border-border bg-white">
              <CardContent className="min-w-0 space-y-5 p-5 sm:p-6 md:p-8">
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

          <aside className="min-w-0 space-y-6 lg:sticky lg:top-24 lg:h-fit">
            <Card className="min-w-0 border-border bg-white">
              <CardContent className="min-w-0 space-y-4 p-5 sm:p-6 md:p-8">
                <div className="flex items-center justify-center gap-2 text-center">
                  <Landmark className="h-4 w-4 text-primary" />
                  <h4>{model.usageTitle || 'Como usar esta comparação'}</h4>
                </div>
                <ul className="space-y-2 text-sm leading-6 text-muted-foreground">
                  {(Array.isArray(model.usageTips) && model.usageTips.length
                    ? model.usageTips
                    : [
                      'Compare taxa, prazo, limite e custo total antes de escolher.',
                      'Use as ferramentas para simular parcelas e evitar decisões no impulso.',
                      'Leia conteúdos relacionados quando tiver dúvida sobre riscos ou condições.'
                    ]).map((tip) => (
                    <li key={tip}>{tip}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <InternalLinkGroups customGroups={linkGroups} />
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
                  <p className="mt-2 text-sm text-muted-foreground">CartÃµes, emprÃ©stimos e financiamento.</p>
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
