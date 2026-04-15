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
import AffiliateOfferGrid from '@/components/affiliates/AffiliateOfferGrid.jsx';
import AffiliateInlineCTA from '@/components/affiliates/AffiliateInlineCTA.jsx';
import AffiliateSidebarWidget from '@/components/affiliates/AffiliateSidebarWidget.jsx';
import AffiliateDisclosure from '@/components/affiliates/AffiliateDisclosure.jsx';
import SuperSimOfferCard from '@/components/affiliates/SuperSimOfferCard.jsx';
import SuperSimInlineCTA from '@/components/affiliates/SuperSimInlineCTA.jsx';
import SuperSimSidebarCard from '@/components/affiliates/SuperSimSidebarCard.jsx';
import { useAffiliatePlacements } from '@/hooks/useAffiliatePlacements.js';
import { portalApi } from '@/platform/services/portalApi.js';
import { affiliateRedirectService } from '@/platform/services/affiliateRedirectService.js';
import {
  getBankRoute,
  getComparePage,
  getQuickLinks,
  getStaticSeoPage,
  requiredBankRoutes,
  resolveSiteUrl,
  slugify
} from '@/seo/seoCatalog.js';
import { normalizeMojibakeDeep } from '@/lib/textEncoding.js';
import { getNonSupersimOffers, getSupersimOffer } from '@/lib/supersim.js';

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
        badge: 'Comparação financeira',
        pageType: 'compare'
      };
    }

    const pretty = params.comparisonSlug.split('-').join(' ');
    return {
      path: `/comparar/${params.comparisonSlug}`,
      heading: `Comparar ${pretty} com taxas e condições em um só lugar.`,
      title: `Comparar ${pretty} | Cote Juros`,
      description: 'Veja opções, compare custos e entenda o que observar antes de contratar.',
      productType: null,
      pageType: 'compare',
      badge: 'Comparação financeira'
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
  if (Array.isArray(model?.body) && model.body.length) {
    return model.body;
  }

  if (model.pageType === 'tool') {
    return [
      'Esta ferramenta foi criada para transformar decisão financeira em leitura prática. Você simula cenários, entende o impacto dos juros e escolhe com mais clareza.',
      'Use os cálculos como base para negociar melhores condições e depois compare ofertas reais com mais segurança.'
    ];
  }

  if (model.pageType === 'blog-article') {
    return model.body || [];
  }

  if (model.pageType === 'hub' && model.path === '/comparar') {
    return [
      'A seção de comparadores reúne caminhos práticos para analisar cartões, empréstimos e financiamentos antes de contratar.',
      'Use as páginas para comparar taxas, benefícios, prazos, custos e cuidados importantes de acordo com o seu objetivo.'
    ];
  }

  if (model.pageType === 'hub' && model.path === '/bancos') {
    return [
      'A página de bancos organiza instituições por oferta de cartão, crédito pessoal e financiamento. Assim, você compara banco contra banco com o mesmo critério.',
      'A proposta é eliminar comparação superficial e mostrar o que realmente pesa: taxa, custo efetivo total, prazo e aderência ao perfil.'
    ];
  }

  if (model.pageType === 'bank') {
    return [
      `Nesta página você compara os principais produtos financeiros do ${model.heading.split(':')[0]} com foco em clareza de taxa, benefícios e custo total.`,
      'A leitura foi pensada para deixar a decisão mais simples: menos ruído visual, mais objetividade e links para comparadores relacionados.'
    ];
  }

  return [
    'Use esta comparação para entender quais opções combinam melhor com o que você procura e quais custos precisam entrar na conta.',
    offersCount
      ? `No momento, encontramos ${offersCount} opção${offersCount > 1 ? 'ões' : ''} para comparar nesta página. Analise taxas, limites, prazos e condições antes de avançar.`
      : 'Ainda estamos atualizando as opções desta página. Enquanto isso, use os critérios abaixo para comparar propostas com mais segurança.'
  ];
};

const buildDecisionChecklist = (model) => {
  if (model.productType === 'credit_card') {
    return ['Compare anuidade e limite no mesmo olhar.', 'Separe benefício real de promessa de marketing.', 'Avance só no cartão que fizer sentido para o seu perfil.'];
  }

  if (model.productType === 'financing') {
    return ['Olhe taxa, entrada e prazo juntos.', 'Entenda o custo total antes da parcela parecer confortável.', 'Compare com calma antes de assumir uma dívida longa.'];
  }

  return ['Compare taxa, custo total e prazo no mesmo bloco.', 'Entenda o que pesa de verdade antes de avançar.', 'Escolha o próximo passo com mais clareza e menos impulso.'];
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

  if (!offers.length && comparisonRows.length) {
    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: `Comparação: ${model.heading}`,
      itemListElement: comparisonRows.slice(0, 10).map((row, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        item: {
          '@type': 'Product',
          name: Array.isArray(row) ? row[0] : row?.title || `${model.heading} ${index + 1}`,
          category: model.badge || 'Comparação financeira'
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
        <p className="text-muted-foreground">Ainda não há dados suficientes para esta combinação. Ajuste a rota de comparação.</p>
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

function RecommendationCardsSection({ title = 'Recomendação editorial', cards = [] }) {
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
                <PageActionButton action={{ label: card.ctaLabel || 'Ver condições', href: card.href, to: card.to }} size="default" className="w-full sm:w-auto" />
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
            <h3>Veja também</h3>
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

  const normalizedModel = useMemo(() => normalizeMojibakeDeep(model), [model]);
  const pageOffers = useMemo(() => filterOffersForPage(offers, normalizedModel), [offers, normalizedModel]);
  const highlights = useMemo(
    () => normalizeMojibakeDeep(buildHighlights(normalizedModel || {}, pageOffers)),
    [normalizedModel, pageOffers]
  );
  const bodyCopy = useMemo(
    () => (normalizedModel ? normalizeMojibakeDeep(buildDefaultCopy(normalizedModel, pageOffers.length)) : []),
    [normalizedModel, pageOffers.length]
  );
  const decisionChecklist = useMemo(
    () => (normalizedModel ? normalizeMojibakeDeep(buildDecisionChecklist(normalizedModel)) : []),
    [normalizedModel]
  );
  const faqItems = normalizeMojibakeDeep(normalizedModel?.faq || defaultFaq);
  const editorialSections = Array.isArray(normalizedModel?.editorialSections)
    ? normalizeMojibakeDeep(normalizedModel.editorialSections)
    : [];
  const recommendationCards = Array.isArray(normalizedModel?.recommendationCards)
    ? normalizeMojibakeDeep(normalizedModel.recommendationCards)
    : [];
  const linkGroups = Array.isArray(normalizedModel?.linkGroups) ? normalizeMojibakeDeep(normalizedModel.linkGroups) : [];
  const affiliatePlacements = useAffiliatePlacements({
    pageSlug: normalizedModel?.path || '',
    productType: normalizedModel?.productType || undefined
  });
  const heroAffiliateOffer = useMemo(
    () => getSupersimOffer(Object.values(affiliatePlacements || {}).flatMap((offers) => offers || [])),
    [affiliatePlacements]
  );
  const belowHeroSupersimOffer = getSupersimOffer(affiliatePlacements.below_hero || []);
  const belowHeroOtherOffers = getNonSupersimOffers(affiliatePlacements.below_hero || []);
  const beforeFaqSupersimOffer = getSupersimOffer(affiliatePlacements.before_faq || []);
  const beforeFaqOtherOffers = getNonSupersimOffers(affiliatePlacements.before_faq || []);
  const midContentOffer = affiliatePlacements.mid_content?.[0] || null;
  const sidebarOffer = affiliatePlacements.sidebar?.[0] || null;
  const isCleanComparePage = normalizedModel?.pageType === 'compare';
  const visibleEditorialSections = isCleanComparePage ? [] : editorialSections;
  const visibleRecommendationCards = isCleanComparePage ? [] : recommendationCards;
  const visibleLinkGroups = isCleanComparePage ? [] : linkGroups;

  if (!normalizedModel) {
    return (
      <section className="page-section">
        <div className="page-shell">
          <div className="mx-auto max-w-3xl rounded-[16px] border border-border bg-white p-10 text-center">
            <h1 className="text-3xl">Página não encontrada</h1>
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
  const canonicalUrl = `${siteUrl}${normalizedModel.path}`;
  const structuredData = normalizeMojibakeDeep(
    buildStructuredData({ model: normalizedModel, canonicalUrl, offers: pageOffers, faqItems })
  );

  const handleAffiliateClick = async (offer, position) => {
    try {
      const result = await affiliateRedirectService.create({
        offerSlug: offer.offerSlug,
        pageSlug: normalizedModel.path,
        position
      });

      if (result?.redirectUrl) {
        window.location.href = result.redirectUrl;
      }
    } catch {
      // keep editorial navigation resilient
    }
  };

  return (
    <>
      <Helmet>
        <title>{normalizedModel.title}</title>
        <meta name="description" content={normalizedModel.description} />
        <meta name="robots" content="index,follow,max-image-preview:large" />
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:title" content={normalizedModel.title} />
        <meta property="og:description" content={normalizedModel.description} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Cote Juros" />
        <meta name="twitter:card" content="summary_large_image" />
        {structuredData.map((schema, index) => (
          <script key={`${normalizedModel.path}-${index}`} type="application/ld+json">
            {JSON.stringify(schema)}
          </script>
        ))}
      </Helmet>

      <PageHero
        badge={normalizedModel.badge}
        title={normalizedModel.heading}
        subtitle={normalizedModel.description}
      >
        {normalizedModel.heroFeature && heroAffiliateOffer && !isCleanComparePage ? (
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-end">
            <div className="space-y-5">
              {Array.isArray(normalizedModel.heroBadges) && normalizedModel.heroBadges.length ? (
                <div className="flex flex-wrap gap-2">
                  {normalizedModel.heroBadges.map((item) => (
                    <Badge key={`${normalizedModel.path}-hero-${item}`} variant="outline" className="border-primary/20 bg-white/80 text-foreground">
                      {item}
                    </Badge>
                  ))}
                </div>
              ) : null}

              <div className="rounded-[18px] border border-border bg-white/80 p-5 shadow-[var(--shadow-sm)]">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary/80">{normalizedModel.heroFeature.eyebrow}</p>
                <h2 className="mt-2 text-2xl text-foreground">{normalizedModel.heroFeature.title}</h2>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{normalizedModel.heroFeature.description}</p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                {normalizedModel.primaryCta?.action === 'affiliate' ? (
                  <Button className="w-full sm:w-auto" size="lg" onClick={() => handleAffiliateClick(heroAffiliateOffer, 'hero')}>
                    {normalizedModel.primaryCta.label || 'Simular empréstimo'}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                ) : (
                  <PageActionButton
                    action={normalizedModel.primaryCta || { label: 'Ver minhas opções agora', to: '/emprestimos' }}
                    className="w-full sm:w-auto"
                  />
                )}
                <PageActionButton
                  action={normalizedModel.secondaryCta || { label: normalizedModel.pageType === 'tool' ? 'Abrir ferramenta completa' : 'Ir para comparadores', to: normalizedModel.pageType === 'tool' ? '/ferramentas' : '/comparar' }}
                  variant="outline"
                  className="hero-secondary-btn w-full sm:w-auto"
                />
              </div>
            </div>

            <Card className="overflow-hidden border-border bg-white/90">
              <CardContent className="space-y-4 p-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-[18px] border border-primary/15 bg-white shadow-[0_12px_28px_rgba(15,23,42,0.08)]">
                    {heroAffiliateOffer.imageUrl ? (
                      <img src={heroAffiliateOffer.imageUrl} alt={heroAffiliateOffer.merchantName} className="h-10 w-10 object-contain" />
                    ) : (
                      <span className="text-lg font-bold text-primary">{heroAffiliateOffer.merchantName?.slice(0, 2)}</span>
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary/80">{heroAffiliateOffer.merchantName}</p>
                    <p className="text-sm text-muted-foreground">Recomendação editorial com disclosure discreto.</p>
                  </div>
                </div>
                <AffiliateDisclosure text={heroAffiliateOffer.disclosureText} />
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="flex flex-col gap-3 sm:flex-row">
            {normalizedModel.primaryCta?.action === 'affiliate' && heroAffiliateOffer ? (
              <Button className="w-full sm:w-auto" size="lg" onClick={() => handleAffiliateClick(heroAffiliateOffer, 'hero')}>
                {normalizedModel.primaryCta.label || 'Simular empréstimo'}
                <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <PageActionButton
                action={normalizedModel.primaryCta || { label: 'Ver minhas opções agora', to: '/emprestimos' }}
                className="w-full sm:w-auto"
              />
            )}
            <PageActionButton
              action={normalizedModel.secondaryCta || { label: normalizedModel.pageType === 'tool' ? 'Abrir ferramenta completa' : 'Ir para comparadores', to: normalizedModel.pageType === 'tool' ? '/ferramentas' : '/comparar' }}
              variant="outline"
              className="hero-secondary-btn w-full sm:w-auto"
            />
          </div>
        )}
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
            {normalizedModel.pageType === 'compare' ? (
              <Card className="min-w-0 border-border bg-white">
                <CardContent className="min-w-0 space-y-6 p-5 sm:p-6 md:p-8">
                  <div className="flex flex-col gap-3 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary/80">Leitura da comparação</p>
                      <h2 className="mt-2 text-2xl text-foreground">O que faz sentido comparar nesta página</h2>
                    </div>
                    <Badge variant="outline" className="border-primary/25 bg-primary/10 text-primary">
                      Antes de decidir
                    </Badge>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3">
                    {decisionChecklist.map((item) => (
                      <div key={item} className="rounded-[16px] border border-border bg-background-secondary px-4 py-4 text-sm leading-6 text-muted-foreground">
                        {item}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : null}

            <Card className="min-w-0 border-border bg-white">
              <CardContent className="min-w-0 space-y-5 p-5 sm:p-6 md:p-8">
                {bodyCopy.map((paragraph, index) => (
                  <p key={`${normalizedModel.path}-paragraph-${index}`}>{paragraph}</p>
                ))}
              </CardContent>
            </Card>

            {!isCleanComparePage && belowHeroSupersimOffer ? (
              <SuperSimOfferCard
                offer={belowHeroSupersimOffer}
                title={normalizedModel.path === '/supersim-emprestimo' ? 'SuperSim Empréstimo' : 'SuperSim como recomendação editorial'}
                description={
                  normalizedModel.path === '/supersim-emprestimo'
                    ? 'Resumo claro da oferta SuperSim para quem quer continuar a pesquisa com contexto, sem transformar a página em vitrine comercial.'
                    : 'A SuperSim aparece aqui como uma recomendação editorial alinhada ao tema da página, com CTA natural e design consistente com o portal.'
                }
                onSelect={(offer) => handleAffiliateClick(offer, 'below_hero')}
              />
            ) : null}

            {!isCleanComparePage && belowHeroOtherOffers.length ? (
              <AffiliateOfferGrid
                offers={belowHeroOtherOffers}
                title="Condições relacionadas para analisar nesta comparação"
                eyebrow="Veja condições"
                onSelect={(offer) => handleAffiliateClick(offer, 'below_hero')}
              />
            ) : null}

            <EditorialSections sections={visibleEditorialSections} relatedGroups={visibleLinkGroups} />

            {normalizedModel.pageType === 'tool' ? (
              <Card className="min-w-0 border-border bg-white">
                <CardContent className="min-w-0 space-y-6 p-5 sm:p-6 md:p-8">
                  <div className="flex items-center gap-2">
                    <Calculator className="h-4 w-4 text-primary" />
                    <h3>Simulação orientada para decisão</h3>
                  </div>
                  <p className="text-muted-foreground">
                    Para cálculo completo com gráficos e ajustes avançados, acesse a central de ferramentas do Cote Juros.
                  </p>
                  <Link to="/ferramentas" className="inline-flex w-full sm:w-auto">
                    <Button className="w-full sm:w-auto">
                      Abrir central de ferramentas <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : null}

            {normalizedModel.pageType !== 'tool' && normalizedModel.pageType !== 'blog-article' ? (
              <Card className="min-w-0 border-border bg-white">
                <CardContent className="min-w-0 space-y-6 p-5 sm:p-6 md:p-8">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <h3>Tabela comparativa</h3>
                    <Badge variant="outline" className="border-primary/25 bg-primary/10 text-primary">
                      Compare com calma
                    </Badge>
                  </div>
                  <OfferComparisonTable model={normalizedModel} offers={pageOffers} />
                  {normalizedModel?.comparisonTable?.note ? (
                    <p className="text-sm leading-6 text-muted-foreground">{normalizedModel.comparisonTable.note}</p>
                  ) : null}
                </CardContent>
              </Card>
            ) : null}

            <RecommendationCardsSection title={normalizedModel.recommendationCardsTitle || 'Sugestões para você'} cards={visibleRecommendationCards} />

            {!isCleanComparePage && midContentOffer ? (
              getSupersimOffer([midContentOffer]) ? (
                <SuperSimInlineCTA
                  offer={midContentOffer}
                  title="Antes de decidir, vale comparar a SuperSim"
                  onSelect={(offer) => handleAffiliateClick(offer, 'mid_content')}
                />
              ) : (
                <AffiliateInlineCTA
                  offer={midContentOffer}
                  title="Quer comparar mais uma opção antes de decidir?"
                  onSelect={(offer) => handleAffiliateClick(offer, 'mid_content')}
                />
              )
            ) : null}

            {!isCleanComparePage && beforeFaqSupersimOffer ? (
              <SuperSimOfferCard
                offer={beforeFaqSupersimOffer}
                title="SuperSim para seguir a jornada com mais clareza"
                description="Se a pesquisa já fez sentido até aqui, a SuperSim entra como uma próxima etapa editorial antes da FAQ e da decisão final."
                onSelect={(offer) => handleAffiliateClick(offer, 'before_faq')}
              />
            ) : null}

            {!isCleanComparePage && beforeFaqOtherOffers.length ? (
              <AffiliateOfferGrid
                offers={beforeFaqOtherOffers}
                title="Mais opções para avaliar antes de concluir sua pesquisa"
                eyebrow="Compare opções"
                onSelect={(offer) => handleAffiliateClick(offer, 'before_faq')}
              />
            ) : null}
            <Card className="min-w-0 border-border bg-white">
              <CardContent className="min-w-0 space-y-5 p-5 sm:p-6 md:p-8">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  <h3>Perguntas frequentes</h3>
                </div>
                <Accordion type="single" collapsible className="w-full">
                  {faqItems.map((faq, index) => (
                    <AccordionItem key={`${normalizedModel.path}-faq-${index}`} value={`${normalizedModel.path}-faq-${index}`}>
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
                  <h4>{normalizedModel.usageTitle || 'Como usar esta comparação'}</h4>
                </div>
                <ul className="space-y-2 text-sm leading-6 text-muted-foreground">
                  {(Array.isArray(normalizedModel.usageTips) && normalizedModel.usageTips.length
                    ? normalizedModel.usageTips
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

            {!isCleanComparePage && sidebarOffer ? (
              getSupersimOffer([sidebarOffer]) ? (
                <SuperSimSidebarCard
                  offer={sidebarOffer}
                  onSelect={(offer) => handleAffiliateClick(offer, 'sidebar')}
                />
              ) : (
                <AffiliateSidebarWidget
                  offer={sidebarOffer}
                  onSelect={(offer) => handleAffiliateClick(offer, 'sidebar')}
                />
              )
            ) : null}

            <InternalLinkGroups customGroups={visibleLinkGroups} />
          </aside>
        </div>
      </section>

      {normalizedModel.pageType === 'hub' && normalizedModel.path === '/bancos' ? (
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



