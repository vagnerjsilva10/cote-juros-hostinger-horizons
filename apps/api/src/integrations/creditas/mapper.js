const firstDefined = (...values) => values.find((value) => value !== undefined && value !== null && value !== '');

const toNumber = (value) => {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(String(value).replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : null;
};

const percentageFromDecimal = (value) => {
  const number = toNumber(value);
  if (number == null) return null;
  return number > 0 && number < 1 ? number * 100 : number;
};

const resolveOfferCollection = (payload = {}) =>
  payload?.offers ||
  payload?.data?.offers ||
  payload?.items ||
  payload?.results ||
  [];

export const normalizeCreditasOffer = (offer = {}, index = 0) => {
  const termMonths = toNumber(firstDefined(offer.loanTerm, offer.term, offer.installments, offer.conditions?.installments));
  const approvedAmount = toNumber(firstDefined(offer.loanAmount, offer.approvedAmount, offer.amount, offer.intendedCredit?.amount));
  const installmentAmount = toNumber(firstDefined(offer.installmentAmount, offer.installment?.amount, offer.monthlyInstallment));

  return {
    id: firstDefined(offer.id, offer.offerId, offer.externalOfferId, `creditas_offer_${index + 1}`),
    externalOfferId: firstDefined(offer.id, offer.offerId, offer.externalOfferId, null),
    provider: 'creditas',
    bankName: 'Creditas',
    productName: firstDefined(offer.productName, offer.productType, 'Credito com garantia Creditas'),
    monthlyRate: percentageFromDecimal(firstDefined(offer.monthlyInterestRate, offer.interestRate?.monthly, offer.monthlyRate)),
    cet: percentageFromDecimal(firstDefined(offer.totalEffectiveCost, offer.cet, offer.cetRate)),
    installmentAmount,
    totalAmount: toNumber(firstDefined(offer.totalAmount, offer.totalDebt, offer.loanAmount)),
    approvedAmount,
    termMonths,
    redirectUrl: firstDefined(offer.redirectUrl, offer.url, offer.proposalUrl, null),
    matchLabel: firstDefined(offer.approvedStatus, offer.status, 'Simulacao Creditas'),
    rankingScore: toNumber(index + 1),
    rawPayload: offer
  };
};

export const mapCreditasOfferResponse = (payload = {}) => {
  const rawOffers = Array.isArray(resolveOfferCollection(payload)) ? resolveOfferCollection(payload) : [];

  return {
    externalOfferId: firstDefined(payload?.id, payload?.offerId, payload?.data?.id, null),
    approvedStatus: firstDefined(payload?.approvedStatus, payload?.status, payload?.data?.approvedStatus, null),
    offers: rawOffers.map((offer, index) => normalizeCreditasOffer(offer, index)),
    rawResponse: payload
  };
};

