const firstDefined = (...values) => values.find((value) => value !== undefined && value !== null && value !== '');

const toNumber = (value) => {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(String(value).replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : null;
};

const resolveOfferCollection = (payload = {}) =>
  payload?.offers ||
  payload?.results ||
  payload?.data?.offers ||
  payload?.data?.results ||
  payload?.data ||
  [];

const resolveSimulationId = (payload = {}) =>
  firstDefined(payload?.simulationId, payload?.id, payload?.data?.simulationId, payload?.data?.id, null);

const computeMatchLabel = (offer) => {
  const monthlyRate = toNumber(firstDefined(offer.monthlyRate, offer.interestRate, offer.taxaMensal));
  if (monthlyRate == null) return 'Compatível com seu perfil';
  if (monthlyRate <= 1.99) return 'Melhor taxa';
  if (monthlyRate <= 3.49) return 'Alta aderência';
  return 'Opção elegível';
};

export const normalizeJurosBaixosOffer = (offer = {}, index = 0) => {
  const bankName = firstDefined(offer.bankName, offer.bank?.name, offer.institutionName, offer.institution, 'Instituição parceira');
  const productName = firstDefined(offer.productName, offer.product?.name, offer.modality, offer.type, 'Crédito pessoal');
  const termMonths = toNumber(firstDefined(offer.termMonths, offer.installments, offer.term, offer.prazo));

  return {
    id: firstDefined(offer.id, offer.offerId, offer.externalOfferId, `jb_offer_${index + 1}`),
    externalOfferId: firstDefined(offer.externalOfferId, offer.offerId, offer.id, null),
    provider: 'juros_baixos',
    bankName,
    productName,
    monthlyRate: toNumber(firstDefined(offer.monthlyRate, offer.interestRate, offer.taxaMensal)),
    cet: toNumber(firstDefined(offer.cet, offer.totalEffectiveCost, offer.iofIncludedRate)),
    installmentAmount: toNumber(firstDefined(offer.installmentAmount, offer.installment_value, offer.parcela)),
    totalAmount: toNumber(firstDefined(offer.totalAmount, offer.total_value, offer.valorTotal)),
    approvedAmount: toNumber(firstDefined(offer.approvedAmount, offer.amount, offer.valorAprovado)),
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
