import express from 'express';
import { z } from 'zod';
import { asyncHandler, pickUtm } from '../lib/http.js';
import { SimulationService } from '../services/simulationService.js';
import { PartnerService } from '../services/partnerService.js';
import { PartnerMatcherService } from '../services/partnerMatcherService.js';

const router = express.Router();

const leadPayloadSchema = z.object({
  productType: z.enum(['loan', 'credit_card', 'financing']),
  requestedAmount: z.number().optional(),
  income: z.number().optional(),
  scoreRange: z.string().optional(),
  employmentStatus: z.string().optional(),
  hasRestriction: z.boolean().optional(),
  fullName: z.string().optional(),
  phone: z.string().optional(),
  profile: z.string().optional(),
  partnerId: z.string().optional(),
  partnerName: z.string().optional(),
  deliveryMode: z.string().optional(),
  redirectUrl: z.string().optional(),
  status: z.string().optional(),
  originPage: z.string().optional(),
  utm_source: z.string().optional(),
  utm_medium: z.string().optional(),
  utm_campaign: z.string().optional()
});

const leadPatchSchema = leadPayloadSchema
  .omit({ productType: true })
  .partial()
  .extend({
    productType: z.enum(['loan', 'credit_card', 'financing']).optional()
  });

const quickCreditSchema = z.object({
  productType: z.enum(['loan', 'credit_card', 'financing']).default('loan'),
  amount: z.number().optional(),
  requestedAmount: z.number().optional(),
  income: z.number(),
  employmentStatus: z.string(),
  hasRestriction: z.boolean(),
  fullName: z.string().min(3),
  phone: z.string().min(10),
  sourcePage: z.string().optional(),
  originPage: z.string().optional(),
  originLabel: z.string().optional(),
  utm_source: z.string().optional(),
  utm_medium: z.string().optional(),
  utm_campaign: z.string().optional(),
  utm: z.record(z.string()).optional()
});

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const payload = leadPayloadSchema.parse(req.body || {});
    const lead = await SimulationService.createLead({
      productType: payload.productType,
      requestedAmount: payload.requestedAmount,
      income: payload.income,
      scoreRange: payload.scoreRange,
      employmentStatus: payload.employmentStatus,
      hasRestriction: payload.hasRestriction,
      fullName: payload.fullName,
      phone: payload.phone,
      profile: payload.profile,
      partnerId: payload.partnerId,
      partnerName: payload.partnerName,
      deliveryMode: payload.deliveryMode,
      redirectUrl: payload.redirectUrl,
      status: payload.status,
      originPage: payload.originPage,
      ...pickUtm(payload)
    });

    res.status(201).json({ data: lead });
  })
);

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const schema = z.object({
      productType: z.enum(['loan', 'credit_card', 'financing', 'all']).optional(),
      status: z.string().optional(),
      originPage: z.string().optional(),
      sourcePage: z.string().optional(),
      from: z.string().optional(),
      to: z.string().optional()
    });

    const filters = schema.parse(req.query || {});
    const leads = await SimulationService.listLeads({
      productType: filters.productType,
      status: filters.status,
      originPage: filters.originPage || filters.sourcePage,
      from: filters.from,
      to: filters.to
    });

    res.json({ data: leads });
  })
);

router.get(
  '/overview',
  asyncHandler(async (req, res) => {
    const overview = await SimulationService.getOverview();
    res.json({ data: overview });
  })
);

router.post(
  '/quick-credit',
  asyncHandler(async (req, res) => {
    const payload = quickCreditSchema.parse(req.body || {});
    const originPage = payload.originPage || payload.sourcePage || '/';
    const requestedAmount = payload.requestedAmount ?? payload.amount;
    const utm = {
      ...pickUtm(payload),
      utmSource: payload.utm_source || payload.utm?.utm_source || null,
      utmMedium: payload.utm_medium || payload.utm?.utm_medium || null,
      utmCampaign: payload.utm_campaign || payload.utm?.utm_campaign || null
    };
    const rawUtm = {
      utm_source: utm.utmSource,
      utm_medium: utm.utmMedium,
      utm_campaign: utm.utmCampaign
    };

    const profile = PartnerMatcherService.calculateProfile({
      income: payload.income,
      hasRestriction: payload.hasRestriction,
      employmentStatus: payload.employmentStatus
    });
    const recommendations = await PartnerMatcherService.match({
      productType: payload.productType,
      lead: {
        requestedAmount,
        income: payload.income,
        employmentStatus: payload.employmentStatus,
        hasRestriction: payload.hasRestriction,
        urgency: payload.originLabel
      }
    });
    const partner = recommendations[0];
    const initialStatus = 'matched';

    const lead = await SimulationService.createLead({
      productType: payload.productType,
      requestedAmount,
      income: payload.income,
      employmentStatus: payload.employmentStatus,
      hasRestriction: payload.hasRestriction,
      fullName: payload.fullName.trim(),
      phone: payload.phone.replace(/\D/g, ''),
      profile,
      partnerId: partner.id,
      partnerName: partner.name,
      deliveryMode: partner.mode,
      status: initialStatus,
      originPage,
      ...utm
    });

    let redirectUrl = '';
    let deliveryRecord = null;

    if (partner.mode === 'tracking_link') {
      redirectUrl = PartnerService.buildRedirectUrl({
        destinationUrl: partner.destinationUrl,
        sourcePage: originPage,
        utm: rawUtm
      });
      deliveryRecord = await PartnerService.registerRedirect({
        partnerId: partner.id,
        sourcePage: originPage,
        destinationUrl: redirectUrl
      });
      await SimulationService.updateLead(lead.id, {
        redirectUrl,
        status: 'matched'
      });
    } else {
      deliveryRecord = await PartnerService.submitMockApiLead({
        partnerId: partner.id,
        leadId: lead.id,
        sourcePage: originPage,
        productType: payload.productType,
        profile
      });
      await SimulationService.updateLead(lead.id, {
        status: 'matched'
      });
    }

    const updatedLead = await SimulationService.getById(lead.id);
    await PartnerMatcherService.recordRoutingArtifacts({
      lead: updatedLead,
      profile,
      recommendations,
      sourcePage: originPage
    });

    res.status(201).json({
      data: {
        lead: updatedLead,
        profile,
        partner,
        recommendations,
        deliveryMode: partner.mode,
        status: updatedLead?.status || initialStatus,
        redirectUrl,
        sentAt: updatedLead?.updatedAt || updatedLead?.createdAt || new Date().toISOString(),
        deliveryRecord
      }
    });
  })
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const lead = await SimulationService.getById(req.params.id);
    if (!lead) return res.status(404).json({ error: 'Simulation not found' });
    res.json({ data: lead });
  })
);

router.patch(
  '/:id',
  asyncHandler(async (req, res) => {
    const payload = leadPatchSchema.parse(req.body || {});
    const lead = await SimulationService.updateLead(req.params.id, {
      requestedAmount: payload.requestedAmount,
      income: payload.income,
      scoreRange: payload.scoreRange,
      employmentStatus: payload.employmentStatus,
      hasRestriction: payload.hasRestriction,
      fullName: payload.fullName,
      phone: payload.phone,
      profile: payload.profile,
      partnerId: payload.partnerId,
      partnerName: payload.partnerName,
      deliveryMode: payload.deliveryMode,
      redirectUrl: payload.redirectUrl,
      status: payload.status,
      originPage: payload.originPage,
      ...pickUtm(payload)
    });

    if (!lead) return res.status(404).json({ error: 'Simulation not found' });
    res.json({ data: lead });
  })
);

export default router;
