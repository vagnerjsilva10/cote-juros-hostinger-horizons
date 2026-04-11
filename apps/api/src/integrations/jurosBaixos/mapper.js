const firstDefined = (...values) => values.find((value) => value !== undefined && value !== null && value !== '');

const toNumber = (value) => {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(String(value).replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : null;
};

const resolveOfferCollection = (payload = {}) =>
  payload?.offers ||
  payload?.items ||
  payload?.results ||
  payload?.data?.offers ||
  payload?.data?.results ||
  payload?.data ||
  [];

const resolveSimulationId = (payload = {}) =>
  firstDefined(payload?.simulationId, payload?.simulation_id, payload?.id, payload?.data?.simulationId, payload?.data?.id, null);

const computeMatchLabel = (offer) => {
  const monthlyRate = toNumber(firstDefined(offer.monthlyRate, offer.interest_rate_monthly, offer.interestRate, offer.taxaMensal));
  const status = firstDefined(offer.status, offer.sub_status, null);

  if (status === 'VALIDATING') return 'Em validação';
  if (status === 'ONGOING') return 'Em andamento';
  if (monthlyRate == null) return 'Compatível com seu perfil';
  if (monthlyRate <= 1.99) return 'Melhor taxa';
  if (monthlyRate <= 3.49) return 'Alta aderência';
  return 'Opção elegível';
};

export const normalizeJurosBaixosOffer = (offer = {}, index = 0) => {
  const bankName = firstDefined(offer.bankName, offer.bank?.name, offer.institutionName, offer.institution, offer.partner, 'Instituição parceira');
  const productName = firstDefined(offer.productName, offer.product?.name, offer.modality, offer.type, 'Crédito sem garantia');
  const termMonths = toNumber(firstDefined(offer.termMonths, offer.duration, offer.installments, offer.term, offer.prazo));
  const amount = toNumber(firstDefined(offer.amount, offer.amount_max, offer.totalAmount, offer.total_value));

  return {
    id: firstDefined(offer.id, offer.offer_id, offer.offerId, offer.externalOfferId, `jb_offer_${index + 1}`),
    externalOfferId: firstDefined(offer.externalOfferId, offer.offer_id, offer.offerId, offer.id, null),
    provider: 'juros_baixos',
    bankName,
    productName,
    monthlyRate: toNumber(firstDefined(offer.monthlyRate, offer.interest_rate_monthly, offer.interestRate, offer.taxaMensal)),
    cet: toNumber(firstDefined(offer.cet, offer.cet_rate, offer.totalEffectiveCost, offer.iofIncludedRate)),
    installmentAmount: toNumber(firstDefined(offer.installmentAmount, offer.installment_amount, offer.installment_value, offer.parcela)),
    totalAmount: amount,
    approvedAmount: toNumber(firstDefined(offer.approvedAmount, offer.amount, offer.amount_max, offer.valorAprovado)),
    termMonths,
    redirectUrl: firstDefined(offer.redirectUrl, offer.proposalUrl, offer.contractUrl, offer.url, null),
    matchLabel: firstDefined(offer.matchLabel, computeMatchLabel(offer)),
    rankingScore: toNumber(firstDefined(offer.rankingScore, offer.score, index + 1)),
    rawPayload: offer
  };
};

export const mapJurosBaixosSimulationResponse = (payload = {}) => {
  const rawOffers = Array.isArray(resolveOfferCollection(payload)) ? resolveOfferCollection(payload) : [];
  const offers = rawOffers.map((offer, index) => normalizeJurosBaixosOffer(offer, index));

  return {
    externalSimulationId: resolveSimulationId(payload),
    offers,
    rawResponse: payload
  };
};

export const mapCatalogOfferToCreditOffer = (offer = {}, index = 0) => ({
  id: offer.id || `catalog_offer_${index + 1}`,
  externalOfferId: offer.id || null,
  provider: 'catalog_fallback',
  bankName: offer.bankName || offer.bank?.name || 'Instituição parceira',
  productName: offer.title || offer.category || offer.product?.name || 'Oferta do catálogo',
  monthlyRate: toNumber(firstDefined(offer.monthlyRate, offer.interestRate)),
  cet: toNumber(firstDefined(offer.annualRate, offer.cet)),
  installmentAmount: null,
  totalAmount: null,
  approvedAmount: toNumber(firstDefined(offer.maxValue, offer.maxAmount)),
  termMonths: toNumber(firstDefined(offer.maxTerm, offer.termMonths)),
  redirectUrl: offer.redirectUrl || null,
  matchLabel: offer.isFeatured ? 'Destaque do portal' : 'Fallback do catálogo',
  rankingScore: toNumber(index + 1),
  rawPayload: offer
});
