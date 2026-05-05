import express from 'express';
import { z } from 'zod';
import { asyncHandler } from '../lib/http.js';
import { PartnerService } from '../services/partnerService.js';
import { PartnerMatcherService } from '../services/partnerMatcherService.js';

const router = express.Router();
const fallbackProfile = {
  negativado: null,
  renda: null,
  valor: null,
  urgencia: null
};

router.post(
  '/match',
  asyncHandler(async (req, res) => {
    const schema = z.object({
      productType: z.enum(['loan', 'credit_card', 'financing']).default('loan'),
      profile: z
        .object({
          negativado: z.boolean().nullable().optional(),
          renda: z.number().nullable().optional(),
          valor: z.number().nullable().optional(),
          urgencia: z.string().nullable().optional(),
          tipoCredito: z.string().nullable().optional(),
          tipoCliente: z.string().nullable().optional(),
          employmentStatus: z.string().nullable().optional(),
          hasVehicle: z.boolean().nullable().optional(),
          hasProperty: z.boolean().nullable().optional(),
          city: z.string().nullable().optional(),
          state: z.string().nullable().optional(),
          fullName: z.string().nullable().optional(),
          phone: z.string().nullable().optional(),
          whatsapp: z.string().nullable().optional(),
          email: z.string().nullable().optional()
        })
        .partial()
        .optional()
    });

    const payload = schema.parse(req.body || {});
    const profile = {
      ...fallbackProfile,
      ...(payload.profile || {})
    };

    const recommendations = await PartnerMatcherService.match({
      productType: payload.productType,
      lead: {
        hasRestriction: profile.negativado,
        income: profile.renda,
        requestedAmount: profile.valor,
        urgency: profile.urgencia,
        employmentStatus: profile.employmentStatus || profile.tipoCliente || '',
        creditType: profile.tipoCredito,
        hasVehicle: profile.hasVehicle,
        hasProperty: profile.hasProperty,
        fullName: profile.fullName,
        phone: profile.phone,
        whatsapp: profile.whatsapp,
        email: profile.email
      }
    });

    res.json({
      data: {
        profile,
        recommendations
      }
    });
  })
);

router.post(
  '/redirect',
  asyncHandler(async (req, res) => {
    const schema = z.object({
      partnerId: z.string().optional(),
      partnerSlug: z.string().optional(),
      simulationId: z.string().optional(),
      leadId: z.string().optional(),
      offerId: z.string().optional(),
      sourcePage: z.string(),
      utm: z.record(z.string()).optional()
    }).refine((data) => data.partnerId || data.partnerSlug, {
      message: 'partnerId ou partnerSlug obrigatorio'
    });

    const payload = schema.parse(req.body || {});
    const result = await PartnerService.createTrackedRedirect({
      partnerId: payload.partnerId,
      partnerSlug: payload.partnerSlug,
      simulationId: payload.simulationId,
      leadId: payload.leadId,
      sourcePage: payload.sourcePage,
      utm: payload.utm,
      userAgent: req.get('user-agent') || null,
      ipHash: PartnerService.buildRequestIpHash(req)
    });

    res.status(201).json(result);
  })
);

router.post(
  '/postback',
  asyncHandler(async (req, res) => {
    const schema = z.object({
      clickId: z.string().min(4),
      partnerSlug: z.string().optional(),
      status: z.enum(['lead', 'approved', 'rejected', 'paid', 'canceled']),
      commissionValue: z.coerce.number().optional().nullable(),
      contractValue: z.coerce.number().optional().nullable(),
      externalId: z.string().optional().nullable(),
      rawPayload: z.any().optional()
    });

    const payload = schema.parse(req.body || {});
    try {
      PartnerService.assertPostbackSecret(req.get('x-partner-secret'));
    } catch (error) {
      if (
        error?.code === 'PARTNER_POSTBACK_UNAUTHORIZED' ||
        error?.code === 'PARTNER_POSTBACK_SECRET_NOT_CONFIGURED'
      ) {
        return res.status(error.status || 500).json({
          error: error.message,
          code: error.code,
          message: error.message
        });
      }
      throw error;
    }
    const result = await PartnerService.recordPostback(payload);
    res.status(201).json(result);
  })
);

router.post(
  '/mock-api',
  asyncHandler(async (req, res) => {
    const schema = z.object({
      partnerId: z.string(),
      leadId: z.string().optional(),
      sourcePage: z.string(),
      productType: z.enum(['loan', 'credit_card', 'financing']).optional(),
      profile: z.string().optional()
    });

    const payload = schema.parse(req.body || {});
    const result = await PartnerService.submitMockApiLead({
      partnerId: payload.partnerId,
      leadId: payload.leadId,
      sourcePage: payload.sourcePage,
      productType: payload.productType,
      profile: payload.profile
    });

    res.status(202).json({ data: result });
  })
);

export default router;
