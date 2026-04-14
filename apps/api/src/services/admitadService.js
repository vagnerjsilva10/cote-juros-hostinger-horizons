import { getPrisma } from '../lib/prisma.js';
import { AdmitadClient } from '../integrations/admitad/client.js';
import { getAdmitadConfig, isAdmitadConfigured } from '../integrations/admitad/config.js';

const normalizeText = (value = '') => String(value || '').trim();

const slugify = (value = '') =>
  String(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

const resolveItems = (payload) =>
  Array.isArray(payload?.results) ? payload.results : Array.isArray(payload) ? payload : [];

const resolveField = (object, keys = [], fallback = '') => {
  for (const key of keys) {
    if (object?.[key] != null && object[key] !== '') return object[key];
  }
  return fallback;
};

const normalizeProgramme = (item) => {
  const id = String(resolveField(item, ['id', 'campaign_id', 'campaignId'], ''));
  const name = normalizeText(resolveField(item, ['name', 'campaign_name', 'advertiser_name'], ''));
  const description = normalizeText(resolveField(item, ['description', 'short_description', 'gotolink_description'], ''));
  const imageUrl = resolveField(item, ['image', 'image_url', 'logo', 'logo_url'], '');
  const gotoLink = resolveField(item, ['goto_link', 'gotoLink', 'site_url'], '');
  const trackingLink = resolveField(item, ['tracking_link', 'trackingLink', 'gotolink'], gotoLink);
  const category = normalizeText(resolveField(item, ['category_name', 'category', 'cr_category'], 'Finanças'));
  const payoutText = normalizeText(resolveField(item, ['payment_type', 'rate_of_approve', 'avg_money_transfer'], ''));

  return {
    externalProgramId: id,
    merchantName: name,
    title: name,
    description: description || 'Veja condições e entenda o perfil da oferta antes de seguir.',
    imageUrl: imageUrl || '',
    destinationUrl: gotoLink || trackingLink || '',
    trackingUrl: trackingLink || gotoLink || '',
    category,
    payoutText,
    raw: item
  };
};

const isRelevantFinanceProgramme = (programme) => {
  const text = `${programme.merchantName} ${programme.title} ${programme.description} ${programme.category}`
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  return ['finance', 'financas', 'emprest', 'loan', 'credito', 'negativado', 'pessoal'].some((term) =>
    text.includes(term)
  );
};

export class AdmitadService {
  static isConfigured() {
    return isAdmitadConfigured();
  }

  static async listProgrammes(params = {}) {
    const query = new URLSearchParams();
    if (params.limit) query.set('limit', String(params.limit));
    if (params.offset) query.set('offset', String(params.offset));
    if (params.website) query.set('website', params.website);

    const payload = await AdmitadClient.request(`/advcampaigns/${query.toString() ? `?${query.toString()}` : ''}`);
    return resolveItems(payload).map(normalizeProgramme);
  }

  static buildTrackingUrl({ trackingUrl, destinationUrl, clickref }) {
    const config = getAdmitadConfig();
    const base = trackingUrl || destinationUrl;
    if (!base) return null;

    const url = new URL(base);
    if (clickref) url.searchParams.set(config.clickRefParam, clickref);
    return url.toString();
  }

  static async syncProgrammes({ merchantQuery = 'supersim', limit = 50 } = {}) {
    const programmes = await this.listProgrammes({
      limit,
      website: getAdmitadConfig().defaultWebsite || undefined
    });

    const filtered = programmes.filter((programme) => {
      if (!isRelevantFinanceProgramme(programme)) return false;
      if (!merchantQuery) return true;
      return programme.merchantName.toLowerCase().includes(String(merchantQuery).toLowerCase());
    });

    const prisma = getPrisma();

    const network = await prisma.affiliateNetwork.upsert({
      where: { code: 'admitad' },
      update: { name: 'Admitad', status: 'active' },
      create: { code: 'admitad', name: 'Admitad', status: 'active' }
    });

    const synced = [];

    for (const programme of filtered) {
      const advertiserId = `admitad-${programme.externalProgramId}`;

      const programRecord = await prisma.affiliateProgram.upsert({
        where: {
          networkId_advertiserId: {
            networkId: network.id,
            advertiserId
          }
        },
        update: {
          externalProgramId: programme.externalProgramId,
          merchantName: programme.merchantName,
          programName: programme.title,
          description: programme.description,
          imageUrl: programme.imageUrl || null,
          category: programme.category || null,
          payoutText: programme.payoutText || null,
          metadata: programme.raw
        },
        create: {
          networkId: network.id,
          advertiserId,
          externalProgramId: programme.externalProgramId,
          merchantName: programme.merchantName,
          programName: programme.title,
          description: programme.description,
          imageUrl: programme.imageUrl || null,
          category: programme.category || null,
          payoutText: programme.payoutText || null,
          metadata: programme.raw,
          status: 'active'
        }
      });

      const offerSlug = slugify(programme.merchantName || programme.title || programme.externalProgramId);

      const offerRecord = await prisma.affiliateOffer.upsert({
        where: { offerSlug },
        update: {
          networkId: network.id,
          programId: programRecord.id,
          network: 'admitad',
          advertiserId,
          externalProgramId: programme.externalProgramId,
          merchantName: programme.merchantName,
          title: programme.title,
          category: programme.category || 'Empréstimos',
          description: programme.description,
          audience: 'Para quem busca empréstimo pessoal com análise simples e leitura clara das condições.',
          imageUrl: programme.imageUrl || null,
          productType: 'loan',
          pageSlugs: ['/emprestimos', '/comparar/emprestimo-online', '/emprestimo-para-negativado'],
          placements: ['below_hero', 'mid_content', 'before_faq', 'sidebar'],
          destinationUrl: programme.destinationUrl,
          trackingUrl: programme.trackingUrl,
          payoutText: programme.payoutText || 'Condições sujeitas à análise',
          ctaText: 'Ver condições',
          disclosureText: 'Se você avançar por este link, o Cote Juros pode receber comissão sem custo extra para você.',
          isActive: true,
          priority: 120,
          metadata: {
            ...(programme.raw || {}),
            accentColor: '#16A34A',
            secondaryAccentColor: '#0F172A',
            badges: ['Empréstimo pessoal', 'Análise rápida', 'Para negativado']
          }
        },
        create: {
          networkId: network.id,
          programId: programRecord.id,
          network: 'admitad',
          advertiserId,
          externalProgramId: programme.externalProgramId,
          merchantName: programme.merchantName,
          offerSlug,
          title: programme.title,
          category: programme.category || 'Empréstimos',
          description: programme.description,
          audience: 'Para quem busca empréstimo pessoal com análise simples e leitura clara das condições.',
          imageUrl: programme.imageUrl || null,
          productType: 'loan',
          pageSlugs: ['/emprestimos', '/comparar/emprestimo-online', '/emprestimo-para-negativado'],
          placements: ['below_hero', 'mid_content', 'before_faq', 'sidebar'],
          destinationUrl: programme.destinationUrl,
          trackingUrl: programme.trackingUrl,
          payoutText: programme.payoutText || 'Condições sujeitas à análise',
          ctaText: 'Ver condições',
          disclosureText: 'Se você avançar por este link, o Cote Juros pode receber comissão sem custo extra para você.',
          isActive: true,
          priority: 120,
          metadata: {
            ...(programme.raw || {}),
            accentColor: '#16A34A',
            secondaryAccentColor: '#0F172A',
            badges: ['Empréstimo pessoal', 'Análise rápida', 'Para negativado']
          }
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
      synced
    };
  }
}
