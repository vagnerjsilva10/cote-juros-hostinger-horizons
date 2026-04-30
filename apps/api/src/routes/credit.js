import express from 'express';
import { z } from 'zod';
import { asyncHandler, pickUtm } from '../lib/http.js';
import { CreditOfferService } from '../services/creditOfferService.js';
import { CreditSimulationService } from '../services/creditSimulationService.js';
import { CreditTrackingService } from '../services/creditTrackingService.js';
import { getJurosBaixosConfig, getJurosBaixosHealth } from '../integrations/jurosBaixos/config.js';
import {
  createCreditasAutoEquityOffer,
  createCreditasAutoEquityProposal,
  createCreditasHomeEquityProposal,
  creditasDocumentPayloadSchema,
  creditasProposalRequestSchema,
  creditasProposalStatusQuerySchema,
  getCreditasAccessToken,
  getCreditasAutoEquityOffer,
  getCreditasHealth,
  getCreditasProposalStatus,
  listCreditasProposalDocuments,
  sendCreditasProposalDocument,
  verifyCreditasWebhookSignature
} from '../integrations/creditas/index.js';
import {
  checkCreditasEligibility as checkPublicCreditasEligibility,
  submitCreditasLead
} from '../services/creditasClient.js';

const router = express.Router();

const stateEnum = z.enum(['AC', 'AL', 'AM', 'AP', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MG', 'MS', 'MT', 'PA', 'PB', 'PE', 'PI', 'PR', 'RJ', 'RN', 'RO', 'RR', 'RS', 'SC', 'SE', 'SP', 'TO']);
const genderEnum = z.enum(['MALE', 'FEMALE', 'OTHER']);
const maritalStatusEnum = z.enum(['SINGLE', 'MARRIED', 'WIDOWED', 'DIVORCED', 'STABLE_UNION']);
const educationalLevelEnum = z.enum([
  'INCOMPLETE_ELEMENTARY',
  'ELEMENTARY',
  'INCOMPLETE_HIGH',
  'HIGH',
  'INCOMPLETE_COLLEGE',
  'COLLEGE',
  'INCOMPLETE_POSTGRADUATE',
  'POSTGRADUATE'
]);

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

const startSchema = z.object({
  fullName: z.string().min(3),
  cpf: z.string().min(11),
  email: z.string().optional(),
  phone: z.string().min(10).optional(),
  birthDate: dateSchema.optional(),
  mothersName: z.string().min(3).optional(),
  gender: genderEnum.optional(),
  maritalStatus: maritalStatusEnum.optional(),
  educationalLevel: educationalLevelEnum.optional(),
  birthCity: z.string().min(2).optional(),
  birthState: stateEnum.optional(),
  address: z.string().min(4).optional(),
  addressNumber: z.string().min(1).optional(),
  district: z.string().min(2).optional(),
  city: z.string().min(2).optional(),
  state: stateEnum.optional(),
  zipCode: z.string().min(8).optional(),
  jurosBaixosProfile: z
    .object({
      due_date: dateSchema.nullable().optional(),
      info: z
        .object({
          birth_city: z.string().min(2).optional(),
          birth_date: dateSchema.optional(),
          birth_state: stateEnum.optional(),
          mothers_name: z.string().min(3).optional(),
          gender: genderEnum.optional(),
          marital_status: maritalStatusEnum.optional(),
          educationalLevel: educationalLevelEnum.optional()
        })
        .partial()
        .optional(),
      residence: z
        .object({
          address: z.string().min(4).optional(),
          number: z.string().min(1).optional(),
          district: z.string().min(2).optional(),
          city: z.string().min(2).optional(),
          state: stateEnum.optional(),
          zip_code: z.string().min(8).optional()
        })
        .partial()
        .optional()
    })
    .partial()
    .optional(),
  requestedAmount: z.number().positive(),
  income: z.number().positive().optional(),
  scoreRange: z.string().optional(),
  employmentStatus: z.string().optional(),
  hasRestriction: z.boolean().optional(),
  productType: z.enum(['loan', 'credit_card', 'financing']),
  sourcePage: z.string().optional(),
  utm_source: z.string().optional(),
  utm_medium: z.string().optional(),
  utm_campaign: z.string().optional()
});

const simulateSchema = z.object({
  leadId: z.string().min(1),
  providerSessionId: z.string().optional(),
  requestedAmount: z.number().positive(),
  installments: z.number().int().positive(),
  productType: z.enum(['loan', 'credit_card', 'financing']),
  birthDate: dateSchema.optional(),
  mothersName: z.string().min(3).optional(),
  gender: genderEnum.optional(),
  maritalStatus: maritalStatusEnum.optional(),
  educationalLevel: educationalLevelEnum.optional(),
  birthCity: z.string().min(2).optional(),
  birthState: stateEnum.optional(),
  address: z.string().min(4).optional(),
  addressNumber: z.string().min(1).optional(),
  district: z.string().min(2).optional(),
  city: z.string().min(2).optional(),
  state: stateEnum.optional(),
  zipCode: z.string().min(8).optional()
});

const clickSchema = z.object({
  sourcePage: z.string(),
  utm_source: z.string().optional(),
  utm_medium: z.string().optional(),
  utm_campaign: z.string().optional()
});

const webhookSchema = z.object({}).passthrough();

const creditasPublicPayloadSchema = z.object({
  fullName: z.string().optional(),
  name: z.string().optional(),
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
  email: z.string().email().optional(),
  cpf: z.string().optional(),
  income: z.union([z.number(), z.string()]).optional(),
  requestedAmount: z.union([z.number(), z.string()]).optional(),
  amount: z.union([z.number(), z.string()]).optional(),
  productType: z.string().optional(),
  guaranteeType: z.string().optional(),
  assetValue: z.union([z.number(), z.string()]).optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  consent: z.boolean().optional(),
  sourcePage: z.string().optional(),
  quizAnswers: z.record(z.any()).optional(),
  recommendation: z.record(z.any()).optional()
}).passthrough();

router.get(
  '/health',
  asyncHandler(async (_req, res) => {
    res.json({
      data: {
        ok: true,
        providers: {
          jurosBaixos: getJurosBaixosHealth(),
          creditas: getCreditasHealth()
        },
        timestamp: new Date().toISOString()
      }
    });
  })
);

router.get(
  '/creditas/health',
  asyncHandler(async (_req, res) => {
    res.json({
      data: {
        ok: true,
        ...getCreditasHealth(),
        timestamp: new Date().toISOString()
      }
    });
  })
);

router.post(
  '/creditas/token/check',
  asyncHandler(async (_req, res) => {
    const token = await getCreditasAccessToken({ forceRefresh: true });
    res.json({
      data: {
        ok: true,
        tokenType: token.tokenType,
        expiresAt: token.expiresAt,
        expiresIn: token.expiresIn
      }
    });
  })
);

router.post(
  '/creditas/eligibility',
  asyncHandler(async (req, res) => {
    const payload = creditasPublicPayloadSchema.parse(req.body || {});
    const data = await checkPublicCreditasEligibility(payload);
    res.json({ data });
  })
);

router.post(
  '/creditas/lead',
  asyncHandler(async (req, res) => {
    const payload = creditasPublicPayloadSchema.parse(req.body || {});
    const data = await submitCreditasLead(payload);
    res.status(data.ok ? 201 : 200).json({ data });
  })
);

router.post(
  '/creditas/offers',
  asyncHandler(async (req, res) => {
    const data = await createCreditasAutoEquityOffer(req.body || {});
    res.status(201).json({ data });
  })
);

router.get(
  '/creditas/offers/:id',
  asyncHandler(async (req, res) => {
    const data = await getCreditasAutoEquityOffer(req.params.id);
    res.json({ data });
  })
);

router.post(
  '/creditas/proposals',
  asyncHandler(async (req, res) => {
    const { product, payload } = creditasProposalRequestSchema.parse(req.body || {});
    const data = product === 'home_equity'
      ? await createCreditasHomeEquityProposal(payload)
      : await createCreditasAutoEquityProposal(payload);
    res.status(201).json({ data });
  })
);

router.get(
  '/creditas/proposals/:id/status',
  asyncHandler(async (req, res) => {
    const query = creditasProposalStatusQuerySchema.parse(req.query || {});
    const data = await getCreditasProposalStatus({
      proposalId: req.params.id,
      includes: query.includes
    });
    res.json({ data });
  })
);

router.get(
  '/creditas/proposals/:id/documents',
  asyncHandler(async (req, res) => {
    const data = await listCreditasProposalDocuments(req.params.id);
    res.json({ data });
  })
);

router.post(
  '/creditas/proposals/:id/documents',
  asyncHandler(async (req, res) => {
    const payload = creditasDocumentPayloadSchema.parse(req.body || {});
    const data = await sendCreditasProposalDocument({
      proposalId: req.params.id,
      payload
    });
    res.status(201).json({ data });
  })
);

router.post(
  '/creditas/webhook',
  asyncHandler(async (req, res) => {
    const rawBody = req.rawBody || Buffer.from(JSON.stringify(req.body || {}));
    const targetUri = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
    const verification = verifyCreditasWebhookSignature({
      headers: req.headers,
      rawBody,
      targetUri
    });

    if (!verification.valid) {
      return res.status(401).json({
        error: 'Invalid Creditas webhook signature',
        details: verification.reason
      });
    }

    CreditTrackingService.log('CREDIT_WEBHOOK_RECEIVED', {
      provider: 'creditas',
      signatureChecked: verification.checked,
      keys: Object.keys(req.body || {})
    });

    return res.status(202).json({
      data: {
        received: true,
        signatureChecked: verification.checked
      }
    });
  })
);

router.post(
  '/start',
  asyncHandler(async (req, res) => {
    const payload = startSchema.parse(req.body || {});
    const journey = await CreditSimulationService.startJourney({
      ...payload,
      ...pickUtm(payload)
    });

    res.status(201).json({ data: journey });
  })
);

router.post(
  '/simulate',
  asyncHandler(async (req, res) => {
    const payload = simulateSchema.parse(req.body || {});
    const result = await CreditSimulationService.simulate({
      ...payload,
      userAgent: req.get('user-agent') || null
    });
    res.status(201).json({ data: result });
  })
);

router.get(
  '/simulations/:id',
  asyncHandler(async (req, res) => {
    const simulation = await CreditSimulationService.getSimulationById(req.params.id);
    if (!simulation) return res.status(404).json({ error: 'Credit simulation not found' });
    return res.json({ data: simulation });
  })
);

router.post(
  '/offers/:id/click',
  asyncHandler(async (req, res) => {
    const payload = clickSchema.parse(req.body || {});
    const offer = await CreditOfferService.getById(req.params.id);
    if (!offer) return res.status(404).json({ error: 'Credit offer not found' });

    const click = await CreditTrackingService.recordOfferClick({
      simulationId: offer.simulation.id,
      offerSnapshotId: offer.id,
      provider: offer.provider,
      sourcePage: payload.sourcePage,
      ...pickUtm(payload)
    });

    CreditTrackingService.log('CREDIT_OFFER_CLICK', {
      simulationId: offer.simulation.id,
      offerId: offer.id,
      provider: offer.provider,
      sourcePage: payload.sourcePage
    });

    return res.status(201).json({
      data: {
        clickId: click.id,
        simulationId: offer.simulation.id,
        offerId: offer.id,
        redirectUrl: offer.redirectUrl,
        provider: offer.provider
      }
    });
  })
);

router.post(
  '/webhook',
  asyncHandler(async (req, res) => {
    const payload = webhookSchema.parse(req.body || {});
    const config = getJurosBaixosConfig();
    const signature = req.headers['x-juros-baixos-signature'];
    const rawBody = JSON.stringify(payload);

    if (config.webhookSecret) {
      const valid = CreditTrackingService.verifyWebhookSignature({
        rawBody,
        signature: Array.isArray(signature) ? signature[0] : signature,
        secret: config.webhookSecret
      });

      if (!valid) {
        return res.status(401).json({ error: 'Invalid webhook signature' });
      }
    }

    await CreditTrackingService.recordWebhookReceipt();
    CreditTrackingService.log('CREDIT_WEBHOOK_RECEIVED', {
      provider: 'juros_baixos',
      keys: Object.keys(payload)
    });

    return res.status(202).json({ data: { received: true } });
  })
);

export default router;
