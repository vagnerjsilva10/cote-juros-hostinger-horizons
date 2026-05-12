import { getPrisma } from '../lib/prisma.js';
import { LomadeeClient } from '../integrations/lomadee/client.js';
import { getLomadeeConfig, isLomadeeConfigured } from '../integrations/lomadee/config.js';

const normalizeText = (value = '') => String(value || '').trim();

const stripHtml = (value = '') =>
  normalizeText(value)
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const slugify = (value = '') =>
  String(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

const resolveItems = (payload) => {
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.items)) return payload.data.items;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload)) return payload;
  return payload?.data ? [payload.data] : [];
};

const resolvePagination = (payload) => payload?.meta || payload?.pagination || payload?.data?.meta || {};

const firstShortUrl = (channels = []) => {
  for (const channel of channels || []) {
    const shortUrl = Array.isArray(channel?.shortUrls) ? channel.shortUrls.find(Boolean) : null;
    if (shortUrl) return shortUrl;
  }
  return '';
};

const getImageUrl = (campaign) => {
  const banner = Array.isArray(campaign?.mediaKit?.banners) ? campaign.mediaKit.banners.find(Boolean) : null;
  return banner || campaign?.logo || campaign?.imageUrl || null;
};

const getCampaignKind = (campaign) => {
  if (campaign?.type === 'PersonalCoupon' || campaign?.type === 'GenericCoupon') return 'Coupon';
  if (campaign?.type === 'Offer') return 'Offer';
  return campaign?.offerType === 'Url' ? 'Offer' : 'Custom';
};

const buildPayoutText = (campaign) => {
  if (campaign?.code) return `Cupom: ${campaign.code}`;
  if (campaign?.isHighlight) return 'Oferta em destaque na Lomadee';
  return 'Condicoes conforme campanha do anunciante';
};

const NICHE_ALLOW_TERMS = [
  'credito',
  'credit',
  'emprest',
  'loan',
  'cartao',
  'financi',
  'finance',
  'banco',
  'bank',
  'conta digital',
  'fintech',
  'seguro',
  'insurance',
  'consignado',
  'score',
  'invest',
  'carteira digital'
];

const NICHE_BLOCK_TERMS = [
  'moda',
  'roupa',
  'calcado',
  'tenis',
  'beleza',
  'cosmetico',
  'perfum',
  'pet',
  'viagem',
  'hotel',
  'farmacia',
  'mercado',
  'supermercado',
  'delivery',
  'comida',
  'restaurante',
  'eletrodomestico',
  'moveis',
  'decoracao',
  'casa e jardim',
  'brinquedo',
  'game',
  'moda fitness'
];

const normalizeSearchText = (value = '') =>
  String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

const getCampaignSearchText = (campaign) => {
  const raw = campaign.raw || {};
  return normalizeSearchText(
    [
      campaign.merchantName,
      campaign.title,
      campaign.description,
      campaign.category,
      raw.type,
      raw.offerType,
      raw.organization?.name,
      raw.brand?.name,
      ...(Array.isArray(raw.categories) ? raw.categories : [])
    ].join(' ')
  );
};

const isCoteJurosNicheCampaign = (campaign) => {
  const text = getCampaignSearchText(campaign);
  const hasAllowTerm = NICHE_ALLOW_TERMS.some((term) => text.includes(term));
  if (!hasAllowTerm) return false;
  return !NICHE_BLOCK_TERMS.some((term) => text.includes(term));
};

const normalizeCampaign = (campaign) => {
  const id = String(campaign?.id || campaign?._id || '');
  const organizationId = String(campaign?.organizationId || campaign?.organization?.id || '');
  const name = normalizeText(campaign?.name || campaign?.title || id);
  const categories = Array.isArray(campaign?.categories) ? campaign.categories.filter(Boolean) : [];
  const url = normalizeText(campaign?.url || '');
  const shortUrl = firstShortUrl(campaign?.channels);

  return {
    externalProgramId: id,
    advertiserId: organizationId || `lomadee-${id}`,
    merchantName: normalizeText(campaign?.organization?.name || campaign?.brand?.name || organizationId || 'Lomadee'),
    title: name,
    description: stripHtml(campaign?.description) || 'Confira a campanha do parceiro antes de seguir para a oferta.',
    category: categories[0] || campaign?.type || 'Ofertas',
    imageUrl: getImageUrl(campaign),
    destinationUrl: url || shortUrl,
    trackingUrl: shortUrl || url,
    payoutText: buildPayoutText(campaign),
    campaignKind: getCampaignKind(campaign),
    raw: campaign
  };
};

const appendMdascFallback = ({ trackingUrl, destinationUrl, clickref }) => {
  const base = trackingUrl || destinationUrl;
  if (!base) return null;
  const url = new URL(base);
  if (clickref) url.searchParams.set('mdasc', clickref);
  return url.toString();
};

export class LomadeeService {
  static isConfigured() {
    return isLomadeeConfigured();
  }

  static async listBrands(params = {}) {
    const payload = await LomadeeClient.get('/affiliate/brands', params);
    return {
      data: resolveItems(payload),
      pagination: resolvePagination(payload)
    };
  }

  static async listCampaigns(params = {}) {
    const payload = await LomadeeClient.get('/affiliate/campaigns', params);
    return {
      data: resolveItems(payload).map(normalizeCampaign),
      pagination: resolvePagination(payload)
    };
  }

  static async shortenUrl({ url, organizationId, type = 'Custom', featureId, mdasc }) {
    const payload = await LomadeeClient.post('/affiliate/shortener/url', {
      ...(url ? { url } : {}),
      organizationId,
      type,
      ...(featureId ? { featureId } : {}),
      ...(mdasc ? { mdasc } : {})
    });

    const channels = Array.isArray(payload?.type) ? payload.type : [];
    return {
      channels,
      shortUrl: firstShortUrl(channels),
      raw: payload
    };
  }

  static async buildTrackingUrl({ trackingUrl, destinationUrl, clickref, metadata = {} }) {
    const organizationId = metadata?.lomadeeOrganizationId || metadata?.organizationId;
    const featureId = metadata?.lomadeeFeatureId || metadata?.featureId;
    const type = metadata?.lomadeeShortenerType || metadata?.type || 'Custom';

    if (!this.isConfigured() || !organizationId) {
      return appendMdascFallback({ trackingUrl, destinationUrl, clickref });
    }

    try {
      const shortened = await this.shortenUrl({
        url: destinationUrl || trackingUrl,
        organizationId,
        type,
        featureId,
        mdasc: clickref
      });

      return shortened.shortUrl || appendMdascFallback({ trackingUrl, destinationUrl, clickref });
    } catch (_error) {
      return appendMdascFallback({ trackingUrl, destinationUrl, clickref });
    }
  }

  static async syncCampaigns({
    page = 1,
    limit = 50,
    status = 'onTime',
    merchantQuery = '',
    name = '',
    categories,
    types,
    offerType,
    organizationId
  } = {}) {
    const config = getLomadeeConfig();
    const response = await this.listCampaigns({
      page,
      limit,
      status,
      name: name || merchantQuery || undefined,
      categories,
      types,
      offerType,
      organizationId
    });

    const campaigns = response.data.filter((campaign) => {
      if (!isCoteJurosNicheCampaign(campaign)) return false;
      if (!merchantQuery) return true;
      const haystack = `${campaign.merchantName} ${campaign.title} ${campaign.description} ${campaign.category}`.toLowerCase();
      return haystack.includes(String(merchantQuery).toLowerCase());
    });

    const prisma = getPrisma();
    const network = await prisma.affiliateNetwork.upsert({
      where: { code: 'lomadee' },
      update: { name: 'Lomadee', status: 'active' },
      create: { code: 'lomadee', name: 'Lomadee', status: 'active' }
    });

    const synced = [];

    for (const campaign of campaigns) {
      if (!campaign.externalProgramId || !campaign.destinationUrl) continue;

      const programRecord = await prisma.affiliateProgram.upsert({
        where: {
          networkId_advertiserId: {
            networkId: network.id,
            advertiserId: campaign.advertiserId
          }
        },
        update: {
          externalProgramId: campaign.externalProgramId,
          merchantName: campaign.merchantName,
          programName: campaign.merchantName,
          description: campaign.description,
          imageUrl: campaign.imageUrl,
          category: campaign.category,
          payoutText: campaign.payoutText,
          metadata: campaign.raw
        },
        create: {
          networkId: network.id,
          advertiserId: campaign.advertiserId,
          externalProgramId: campaign.externalProgramId,
          merchantName: campaign.merchantName,
          programName: campaign.merchantName,
          description: campaign.description,
          imageUrl: campaign.imageUrl,
          category: campaign.category,
          payoutText: campaign.payoutText,
          metadata: campaign.raw,
          status: 'active'
        }
      });

      const offerSlug = slugify(`lomadee-${campaign.merchantName}-${campaign.title}-${campaign.externalProgramId}`);
      const metadata = {
        ...(campaign.raw || {}),
        lomadeeFeatureId: campaign.externalProgramId,
        lomadeeOrganizationId: campaign.raw?.organizationId || campaign.advertiserId,
        lomadeeShortenerType: campaign.campaignKind,
        accentColor: '#F97316',
        secondaryAccentColor: '#0F172A',
        badges: ['Lomadee', campaign.category, campaign.raw?.type].filter(Boolean)
      };

      const offerRecord = await prisma.affiliateOffer.upsert({
        where: { offerSlug },
        update: {
          networkId: network.id,
          programId: programRecord.id,
          network: 'lomadee',
          advertiserId: campaign.advertiserId,
          externalProgramId: campaign.externalProgramId,
          merchantName: campaign.merchantName,
          title: campaign.title,
          category: campaign.category,
          description: campaign.description,
          audience: 'Para quem quer avaliar uma oferta parceira com leitura clara antes de seguir.',
          imageUrl: campaign.imageUrl,
          productType: null,
          pageSlugs: config.defaultPageSlugs,
          placements: config.defaultPlacements,
          destinationUrl: campaign.destinationUrl,
          trackingUrl: campaign.trackingUrl,
          payoutText: campaign.payoutText,
          ctaText: campaign.raw?.code ? 'Usar cupom' : 'Ver oferta',
          disclosureText: 'Se voce avancar por este link, o Cote Juros pode receber comissao sem custo extra para voce.',
          isActive: true,
          priority: campaign.raw?.isHighlight ? 130 : 90,
          metadata
        },
        create: {
          networkId: network.id,
          programId: programRecord.id,
          network: 'lomadee',
          advertiserId: campaign.advertiserId,
          externalProgramId: campaign.externalProgramId,
          merchantName: campaign.merchantName,
          offerSlug,
          title: campaign.title,
          category: campaign.category,
          description: campaign.description,
          audience: 'Para quem quer avaliar uma oferta parceira com leitura clara antes de seguir.',
          imageUrl: campaign.imageUrl,
          productType: null,
          pageSlugs: config.defaultPageSlugs,
          placements: config.defaultPlacements,
          destinationUrl: campaign.destinationUrl,
          trackingUrl: campaign.trackingUrl,
          payoutText: campaign.payoutText,
          ctaText: campaign.raw?.code ? 'Usar cupom' : 'Ver oferta',
          disclosureText: 'Se voce avancar por este link, o Cote Juros pode receber comissao sem custo extra para voce.',
          isActive: true,
          priority: campaign.raw?.isHighlight ? 130 : 90,
          metadata
        }
      });

      synced.push({
        programId: programRecord.id,
        offerId: offerRecord.id,
        merchantName: offerRecord.merchantName,
        offerSlug: offerRecord.offerSlug,
        externalProgramId: offerRecord.externalProgramId
      });
    }

    return {
      syncedCount: synced.length,
      pagination: response.pagination,
      synced
    };
  }
}
