import { getPrisma } from '../lib/prisma.js';

const serializeDecimal = (value) => (value == null ? null : Number(value));

const serializeOffer = (offer) => ({
  id: offer.id,
  externalOfferId: offer.externalOfferId,
  provider: offer.provider,
  bankName: offer.bankName,
  productName: offer.productName,
  monthlyRate: serializeDecimal(offer.monthlyRate),
  cet: serializeDecimal(offer.cet),
  installmentAmount: serializeDecimal(offer.installmentAmount),
  totalAmount: serializeDecimal(offer.totalAmount),
  approvedAmount: serializeDecimal(offer.approvedAmount),
  termMonths: offer.termMonths,
  redirectUrl: offer.redirectUrl,
  rankingScore: serializeDecimal(offer.rankingScore),
  matchLabel: offer.matchLabel,
  rawPayload: offer.rawPayload,
  createdAt: offer.createdAt
});

export class CreditOfferService {
  static async replaceSimulationOffers({ simulationId, provider, offers }) {
    const prisma = getPrisma();
    await prisma.creditOfferSnapshot.deleteMany({ where: { simulationId } });

    for (const offer of offers) {
      await prisma.creditOfferSnapshot.create({
        data: {
          simulationId,
          provider: offer.provider || provider,
          externalOfferId: offer.externalOfferId || null,
          bankName: offer.bankName,
          productName: offer.productName,
          monthlyRate: offer.monthlyRate,
          cet: offer.cet,
          installmentAmount: offer.installmentAmount,
          totalAmount: offer.totalAmount,
          approvedAmount: offer.approvedAmount,
          termMonths: offer.termMonths,
          redirectUrl: offer.redirectUrl,
          rankingScore: offer.rankingScore,
          matchLabel: offer.matchLabel || null,
          rawPayload: offer.rawPayload || null
        }
      });
    }

    return this.listBySimulationId(simulationId);
  }

  static async listBySimulationId(simulationId) {
    const offers = await getPrisma().creditOfferSnapshot.findMany({
      where: { simulationId },
      orderBy: [{ rankingScore: 'asc' }, { createdAt: 'asc' }]
    });

    return offers.map(serializeOffer);
  }

  static async getById(id) {
    const offer = await getPrisma().creditOfferSnapshot.findUnique({
      where: { id },
      include: {
        simulation: true
      }
    });

    if (!offer) return null;
    return {
      ...serializeOffer(offer),
      simulation: offer.simulation
    };
  }
}
