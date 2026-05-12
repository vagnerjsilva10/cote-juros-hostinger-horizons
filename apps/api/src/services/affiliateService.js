import crypto from 'node:crypto';
import { getPrisma } from '../lib/prisma.js';
import { AwinService } from './awinService.js';
import { AdmitadService } from './admitadService.js';

const normalizePath = (value = '') => {
  if (!value) return '/';
  return value.startsWith('/') ? value : `/${value}`;
};

const slugifyPath = (value = '') =>
  normalizePath(value)
    .replace(/^\/+/, '')
    .replace(/\/+/g, '-')
    .replace(/^-|-$/g, '') || 'home';

const normalizePlacement = (value = '') => String(value || '').trim().toLowerCase();

const detectDevice = (userAgent = '') => {
  const ua = String(userAgent).toLowerCase();
  if (/mobile|android|iphone|ipod|blackberry|iemobile|opera mini/.test(ua)) return 'mobile';
  if (/ipad|tablet/.test(ua)) return 'tablet';
  return 'desktop';
};

const normalizeAffiliateOffer = (offer) => ({
  id: offer.id,
  network: offer.network,
  advertiserId: offer.advertiserId,
  externalProgramId: offer.externalProgramId,
  merchantName: offer.merchantName,
  offerSlug: offer.offerSlug,
  title: offer.title,
  category: offer.category,
  description: offer.description,
  audience: offer.audience,
  imageUrl: offer.imageUrl,
  destinationUrl: offer.destinationUrl,
  trackingUrl: offer.trackingUrl,
  payoutText: offer.payoutText,
  ctaText: offer.ctaText,
  disclosureText: offer.disclosureText,
  priority: offer.priority,
  pageSlugs: offer.pageSlugs,
  placements: offer.placements,
  productType: offer.productType,
  metadata: offer.metadata,
  merchantProgram: offer.program
    ? {
      id: offer.program.id,
      advertiserId: offer.program.advertiserId,
      merchantName: offer.program.merchantName
    }
    : null
});

export class AffiliateService {
  static async listOffers({ pageSlug, position, productType, limit = 6 }) {
    const normalizedPageSlug = normalizePath(pageSlug);
    const placement = normalizePlacement(position);

    const offers = await getPrisma().affiliateOffer.findMany({
      where: {
        isActive: true,
        ...(productType ? { productType } : {}),
        ...(pageSlug ? { pageSlugs: { has: normalizedPageSlug } } : {}),
        ...(placement ? { placements: { has: placement } } : {})
      },
      include: {
        program: true
      },
      orderBy: [{ priority: 'desc' }, { updatedAt: 'desc' }],
      take: Number(limit) || 6
    });

    return offers.map(normalizeAffiliateOffer);
  }

  static async getPlacements({ pageSlug, productType }) {
    const offers = await getPrisma().affiliateOffer.findMany({
      where: {
        isActive: true,
        ...(pageSlug ? { pageSlugs: { has: normalizePath(pageSlug) } } : {}),
        ...(productType ? { productType } : {})
      },
      include: {
        program: true
      },
      orderBy: [{ priority: 'desc' }, { updatedAt: 'desc' }]
    });

    const grouped = new Map();

    offers.forEach((offer) => {
      offer.placements.forEach((placement) => {
        const key = normalizePlacement(placement);
        if (!grouped.has(key)) grouped.set(key, []);
        grouped.get(key).push(normalizeAffiliateOffer(offer));
      });
    });

    return {
      pageSlug: normalizePath(pageSlug),
      productType: productType || null,
      placements: Object.fromEntries(grouped)
    };
  }

  static async handleClick({ offerSlug, pageSlug, position, userAgent }) {
    const offer = await getPrisma().affiliateOffer.findUnique({
      where: { offerSlug }
    });

    if (!offer || !offer.isActive) {
      return null;
    }

    const device = detectDevice(userAgent);
    const normalizedPageSlug = normalizePath(pageSlug);
    const normalizedPosition = normalizePlacement(position) || 'unknown';
    const clickrefContext = [
      slugifyPath(normalizedPageSlug),
      normalizedPosition,
      offer.offerSlug,
      device
    ].join('__');
    const clickref = `${clickrefContext}__${crypto.randomBytes(8).toString('hex')}`;

    await getPrisma().affiliateClick.create({
      data: {
        affiliateOfferId: offer.id,
        offerSlug: offer.offerSlug,
        pageSlug: normalizedPageSlug,
        position: normalizedPosition,
        clickref,
        device
      }
    });

    return {
      offer: normalizeAffiliateOffer(offer),
      clickref,
      device,
      redirectUrl:
        offer.network === 'admitad'
          ? AdmitadService.buildTrackingUrl({
            trackingUrl: offer.trackingUrl,
            destinationUrl: offer.destinationUrl,
            clickref
          })
          : AwinService.buildTrackingUrl({
            trackingUrl: offer.trackingUrl,
            destinationUrl: offer.destinationUrl,
            clickref
          })
    };
  }
}
