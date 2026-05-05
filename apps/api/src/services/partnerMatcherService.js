import { getPrisma } from '../lib/prisma.js';

export const SUPERSIM_PARTNER = {
  id: 'supersim',
  slug: 'supersim',
  name: '',
  type: 'affiliate_link',
  mode: 'tracking_link',
  status: 'active',
  destinationUrl: '',
  description: 'Opção de crédito pessoal online com análise conforme o perfil informado.',
  highlights: ['Processo online', 'Pode ser alternativa para quem busca crédito rápido', 'Condições sujeitas à análise do parceiro'],
  ctaText: 'Ver condições',
  eventType: 'click_partner_supersim',
  priority: 100
};

const normalizeText = (value = '') => String(value || '').trim().toLowerCase();

const serializePartnerConfig = (partner) => ({
  id: partner.slug || partner.id,
  configId: partner.id,
  slug: partner.slug,
  name: partner.name,
  type: partner.integrationType === 'tracking_link' ? 'affiliate_link' : partner.integrationType,
  mode: partner.integrationType,
  status: partner.status,
  destinationUrl: partner.affiliateUrl || partner.trackingLink || partner.webhookUrl || partner.apiBaseUrl || partner.metadata?.affiliateUrl || '',
  affiliateUrl: partner.affiliateUrl || partner.trackingLink || partner.metadata?.affiliateUrl || '',
  productType: partner.productType || partner.productTypes?.[0] || null,
  actionType: partner.actionType || partner.metadata?.actionType || null,
  description: partner.metadata?.description || 'Opcao parceira para comparar condicoes de credito.',
  highlights: Array.isArray(partner.metadata?.highlights)
    ? partner.metadata.highlights
    : ['Compare custo total', 'Confira prazo e condicoes', 'Sujeito a criterios do parceiro'],
  ctaText: partner.metadata?.ctaText || 'Ver condicoes',
  eventType: partner.metadata?.eventType || `click_partner_${partner.slug || partner.id}`,
  priority: Number(partner.priority || 0)
});

export class PartnerMatcherService {
  static calculateProfile({ income = 0, hasRestriction = false, employmentStatus = '' } = {}) {
    if (hasRestriction) return 'negativado';
    if (normalizeText(employmentStatus) === 'clt' && Number(income || 0) >= 3000) return 'clt';
    if (['autonomo', 'autônomo'].includes(normalizeText(employmentStatus))) return 'autonomo';
    return 'geral';
  }

  static shouldIncludeSuperSim({ hasRestriction = null, requestedAmount = null, urgency = null } = {}) {
    const amount = Number(requestedAmount || 0);
    const urgent = ['alta', 'urgente', 'high'].includes(normalizeText(urgency));
    const hasNoProfileData = hasRestriction == null && requestedAmount == null && !normalizeText(urgency);
    if (hasNoProfileData) return true;
    return Boolean(hasRestriction) || urgent || (amount > 0 && amount <= 25000);
  }

  static scoreLead({ income = 0, hasRestriction = false, employmentStatus = '', requestedAmount = 0 } = {}) {
    const incomeValue = Number(income || 0);
    const amount = Number(requestedAmount || 0);
    const amountFit = incomeValue && amount ? Math.max(0, 25 - Math.round((amount / incomeValue) * 2)) : 10;
    const employment = normalizeText(employmentStatus) === 'clt' ? 25 : ['autonomo', 'autônomo'].includes(normalizeText(employmentStatus)) ? 15 : 10;
    const restriction = hasRestriction ? 10 : 30;
    const incomePoints = incomeValue >= 7000 ? 25 : incomeValue >= 3000 ? 18 : 10;
    const value = Math.max(0, Math.min(100, incomePoints + amountFit + employment + restriction));

    return {
      value,
      band: value >= 75 ? 'A' : value >= 55 ? 'B' : value >= 35 ? 'C' : 'D'
    };
  }

  static async listConfiguredPartners(productType = 'loan') {
    try {
      const partners = await getPrisma().partnerConfig.findMany({
        where: {
          status: 'active',
          isActive: true,
          OR: [
            { productTypes: { isEmpty: true } },
            { productTypes: { has: productType } },
            { productType }
          ]
        },
        orderBy: [{ priority: 'desc' }, { updatedAt: 'desc' }]
      });

      return partners
        .map(serializePartnerConfig)
        .filter((partner) => partner.destinationUrl);
    } catch {
      return [];
    }
  }

  static async getSuperSimConfigStatus() {
    try {
      const partner = await getPrisma().partnerConfig.findUnique({
        where: { slug: SUPERSIM_PARTNER.slug },
        select: { status: true }
      });
      return {
        exists: Boolean(partner),
        inactive: partner?.status === 'inactive' || partner?.status === 'archived'
      };
    } catch {
      return { exists: false, inactive: false };
    }
  }

  static async match({ lead = {}, productType = 'loan' } = {}) {
    const [configured, superSimConfig] = await Promise.all([
      this.listConfiguredPartners(productType),
      this.getSuperSimConfigStatus()
    ]);
    const normalizedConfigured = configured.map((partner) =>
      partner.slug === 'supersim'
        ? {
          ...SUPERSIM_PARTNER,
          ...partner,
          configId: partner.configId,
          destinationUrl: partner.destinationUrl || SUPERSIM_PARTNER.destinationUrl,
          description: partner.description || SUPERSIM_PARTNER.description,
          highlights: Array.isArray(partner.highlights) && partner.highlights.length ? partner.highlights : SUPERSIM_PARTNER.highlights,
          ctaText: partner.ctaText || SUPERSIM_PARTNER.ctaText,
          eventType: partner.eventType || SUPERSIM_PARTNER.eventType,
          priority: Number(partner.priority ?? SUPERSIM_PARTNER.priority)
        }
        : partner
    );

    const byId = new Map(normalizedConfigured.map((partner) => [partner.id, partner]));
    const includeSuperSim = false;
    if (includeSuperSim && !byId.has(SUPERSIM_PARTNER.id)) {
      byId.set(SUPERSIM_PARTNER.id, SUPERSIM_PARTNER);
    }

    const configuredRecommendations = Array.from(byId.values())
      .filter((partner) => partner.status === 'active')
      .sort((a, b) => Number(b.priority || 0) - Number(a.priority || 0))
      .slice(0, 4);

    const score = this.scoreLead({
      income: lead.income != null ? Number(lead.income) : 0,
      hasRestriction: Boolean(lead.hasRestriction),
      employmentStatus: lead.employmentStatus || '',
      requestedAmount: lead.requestedAmount != null ? Number(lead.requestedAmount) : 0
    });
    const hasGuarantee = Boolean(lead.hasVehicle || lead.hasProperty || ['vehicle-secured', 'home-secured'].includes(normalizeText(lead.creditType || lead.tipoCredito)));
    const missingRequired = [
      !lead.fullName && 'contactName',
      !lead.phone && !lead.whatsapp && 'whatsapp',
      !lead.email && 'email'
    ].filter(Boolean);
    const actionFallback = missingRequired.length ? 'complete_data' : 'redirect';

    const decisionMatches = [];

    if (hasGuarantee) {
      decisionMatches.push({
        id: 'creditas',
        slug: 'creditas',
        name: 'Creditas',
        type: 'eligibility',
        mode: 'eligibility',
        status: 'active',
        destinationUrl: '',
        description: 'Elegibilidade para crédito com garantia, sem chamada de oferta ou proposta neste lote.',
        highlights: ['Garantia informada', 'Consulta de elegibilidade', 'Sem promessa de aprovação'],
        ctaText: missingRequired.length ? 'Completar dados' : 'Consultar elegibilidade',
        partnerId: 'creditas',
        partnerName: 'Creditas',
        productType: lead.hasProperty ? 'home_equity_eligibility' : 'vehicle_equity_eligibility',
        matchScore: Math.min(100, score.value + 8),
        chanceLabel: lead.hasRestriction ? 'média' : score.value >= 70 ? 'alta' : 'média',
        reason: 'Garantia declarada abre caminho para consulta de elegibilidade de crédito com garantia.',
        requiredFields: missingRequired,
        actionType: missingRequired.length ? 'complete_data' : 'eligibility',
        ctaLabel: missingRequired.length ? 'Completar dados' : 'Consultar elegibilidade'
      });
    }

    decisionMatches.push({
      id: lead.hasRestriction ? 'restriction-friendly-credit' : 'standard-credit-hub',
      slug: lead.hasRestriction ? 'restriction-friendly-credit' : 'standard-credit-hub',
      name: lead.hasRestriction ? 'Parceiro permissivo' : 'Hub de crédito pessoal',
      type: 'decision_match',
      mode: 'redirect',
      status: 'active',
      destinationUrl: '',
      description: lead.hasRestriction
        ? 'Parceiros mais permissivos podem analisar perfis com restrição, sem garantia de aprovação.'
        : 'Caminho de crédito pessoal para comparar antes de decidir.',
      highlights: ['Análise do parceiro', 'Sem taxa antecipada', 'Condições podem variar'],
      ctaText: missingRequired.length ? 'Completar dados' : 'Ver opção',
      partnerId: lead.hasRestriction ? 'restriction-friendly-credit' : 'standard-credit-hub',
      partnerName: lead.hasRestriction ? 'Parceiro permissivo' : 'Hub de crédito pessoal',
      productType,
      matchScore: score.value,
      chanceLabel: lead.hasRestriction ? 'baixa' : score.value >= 70 ? 'alta' : score.value >= 45 ? 'média' : 'baixa',
      reason: lead.hasRestriction
        ? 'Nome negativado prioriza rotas mais permissivas e evita classificar chance como alta sem justificativa.'
        : 'Perfil compatível com comparação inicial de crédito pessoal.',
      requiredFields: missingRequired,
      actionType: actionFallback,
      ctaLabel: missingRequired.length ? 'Completar dados' : 'Ver opção'
    });

    return configuredRecommendations.length
      ? configuredRecommendations.map((partner, index) => ({
        ...decisionMatches[index % decisionMatches.length],
        ...partner,
        partnerId: partner.id,
        partnerName: partner.name,
        productType,
        matchScore: Math.max(30, score.value - index * 5),
        chanceLabel: lead.hasRestriction ? 'baixa' : score.value >= 70 ? 'alta' : score.value >= 45 ? 'média' : 'baixa',
        reason: partner.description || 'Parceiro ativo compatível com os dados informados.',
        requiredFields: missingRequired,
        actionType: missingRequired.length ? 'complete_data' : 'redirect',
        ctaLabel: missingRequired.length ? 'Completar dados' : partner.ctaText || 'Ver opção'
      }))
      : decisionMatches;
  }

  static async recordRoutingArtifacts({ lead, profile, recommendations, sourcePage }) {
    const prisma = getPrisma();
    const primaryPartner = recommendations[0] || SUPERSIM_PARTNER;
    const score = this.scoreLead({
      income: lead.income != null ? Number(lead.income) : 0,
      hasRestriction: Boolean(lead.hasRestriction),
      employmentStatus: lead.employmentStatus || '',
      requestedAmount: lead.requestedAmount != null ? Number(lead.requestedAmount) : 0
    });

    await Promise.all([
      prisma.leadRoutingDecision.create({
        data: {
          leadId: lead.id,
          routeType: 'hub_match',
          inputSnapshot: {
            productType: lead.productType,
            requestedAmount: lead.requestedAmount != null ? Number(lead.requestedAmount) : null,
            income: lead.income != null ? Number(lead.income) : null,
            employmentStatus: lead.employmentStatus,
            hasRestriction: lead.hasRestriction,
            recommendations: recommendations.map((partner) => partner.id)
          },
          ruleMatched: `profile:${profile}`,
          partnerId: primaryPartner.id,
          partnerName: primaryPartner.name,
          fallbackUsed: recommendations.length === 1 && primaryPartner.id === SUPERSIM_PARTNER.id,
          reason: 'Matcher simples do hub de credito',
          scoreValue: score.value,
          scoreBand: score.band
        }
      }),
      prisma.leadScoreSnapshot.create({
        data: {
          leadId: lead.id,
          productType: lead.productType,
          scoreValue: score.value,
          normalizedScore: score.value,
          eligibilityScore: score.value,
          propensityScore: score.value,
          explanation: {
            profile,
            sourcePage,
            hasRestriction: Boolean(lead.hasRestriction),
            recommendations: recommendations.map((partner) => partner.id)
          }
        }
      }),
      prisma.leadDeliveryAttempt.create({
        data: {
          leadId: lead.id,
          partnerId: primaryPartner.id,
          partnerName: primaryPartner.name,
          mode: primaryPartner.mode,
          status: 'matched',
          requestPayload: {
            sourcePage,
            productType: lead.productType,
            profile
          },
          responsePayload: {
            recommendations: recommendations.map((partner) => ({
              id: partner.id,
              name: partner.name,
              mode: partner.mode
            }))
          }
        }
      }),
      prisma.revenueEvent.create({
        data: {
          leadId: lead.id,
          partnerId: primaryPartner.id,
          productType: lead.productType,
          sourcePage,
          eventType: 'hub_match',
          estimatedCents: primaryPartner.id === SUPERSIM_PARTNER.id ? 4500 : 2500,
          confirmedCents: 0,
          metadata: {
            partnerName: primaryPartner.name,
            profile,
            scoreBand: score.band,
            recommendations: recommendations.map((partner) => partner.id)
          }
        }
      })
    ]);

    return score;
  }
}
