import { getPrisma } from '../lib/prisma.js';

export class OfferService {
  static async list(filters = {}) {
    const where = {
      status: 'active'
    };

    if (filters.productType) {
      where.product = { type: filters.productType };
    }

    if (filters.isFeatured != null) {
      where.isFeatured = filters.isFeatured === 'true' || filters.isFeatured === true;
    }

    const offers = await getPrisma().offer.findMany({
      where,
      include: {
        bank: true,
        product: true
      },
      orderBy: [{ isFeatured: 'desc' }, { createdAt: 'desc' }],
      take: filters.limit ? Number(filters.limit) : 100
    });

    return offers;
  }

  static async getById(id) {
    return getPrisma().offer.findUnique({
      where: { id },
      include: {
        bank: true,
        product: true
      }
    });
  }

  static rank(offers, { requestedAmount, scoreRange } = {}) {
    return [...offers].sort((a, b) => {
      const scoreWeight = (offer) => {
        if (!scoreRange || !offer.scoreRequirement) return 0;
        return offer.scoreRequirement === scoreRange ? 2 : 0;
      };

      const amountWeight = (offer) => {
        if (!requestedAmount || !offer.minAmount || !offer.maxAmount) return 0;
        const amount = Number(requestedAmount);
        return amount >= Number(offer.minAmount) && amount <= Number(offer.maxAmount) ? 2 : 0;
      };

      const totalA = scoreWeight(a) + amountWeight(a) + (a.isFeatured ? 1 : 0);
      const totalB = scoreWeight(b) + amountWeight(b) + (b.isFeatured ? 1 : 0);

      if (totalA !== totalB) return totalB - totalA;
      const rateA = a.interestRate ? Number(a.interestRate) : 9999;
      const rateB = b.interestRate ? Number(b.interestRate) : 9999;
      return rateA - rateB;
    });
  }
}



