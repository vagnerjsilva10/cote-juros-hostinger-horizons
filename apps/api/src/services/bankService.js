import { getPrisma } from '../lib/prisma.js';

const serializeBank = (bank) => ({
  ...bank,
  logoUrl: bank.logo || '',
  logo: bank.logo || ''
});

export class BankService {
  static async list({ status = 'active', search = '' } = {}) {
    const where = {};

    if (status && status !== 'all') where.status = status;
    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }

    const banks = await getPrisma().bank.findMany({
      where,
      orderBy: { name: 'asc' }
    });

    return banks.map(serializeBank);
  }
}
