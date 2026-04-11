import { getPrisma } from '../lib/prisma.js';

export class CreditProviderSessionService {
  static async getLatestByLeadId(leadId, provider = 'juros_baixos') {
    return getPrisma().creditProviderSession.findFirst({
      where: { leadId, provider },
      orderBy: { updatedAt: 'desc' }
    });
  }

  static async ensureSession({ leadId, provider = 'juros_baixos' }) {
    const existing = await this.getLatestByLeadId(leadId, provider);
    if (existing) return existing;

    return getPrisma().creditProviderSession.create({
      data: {
        leadId,
        provider,
        status: 'pending'
      }
    });
  }

  static async updateSession(id, payload) {
    return getPrisma().creditProviderSession.update({
      where: { id },
      data: {
        externalUserId: payload.externalUserId ?? undefined,
        externalSessionId: payload.externalSessionId ?? undefined,
        externalJwt: payload.externalJwt ?? undefined,
        tokenExpiresAt: payload.tokenExpiresAt ? new Date(payload.tokenExpiresAt) : payload.tokenExpiresAt === null ? null : undefined,
        status: payload.status ?? undefined,
        lastError: payload.lastError ?? undefined
      }
    });
  }
}
