export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

export const pickUtm = (input = {}) => ({
  utmSource: input.utm_source || input.utmSource || null,
  utmMedium: input.utm_medium || input.utmMedium || null,
  utmCampaign: input.utm_campaign || input.utmCampaign || null
});

