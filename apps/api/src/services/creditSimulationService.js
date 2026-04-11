import { getPrisma } from '../lib/prisma.js';
import { OfferService } from './offerService.js';
import { CreditLeadService } from './creditLeadService.js';
import { CreditOfferService } from './creditOfferService.js';
import { CreditProviderSessionService } from './creditProviderSessionService.js';
import { CreditTrackingService } from './creditTrackingService.js';
import {
  JurosBaixosApiError,
  createThirdPartySimulation,
  createThirdPartyUser,
  authenticateThirdPartyUser,
  fetchSimulationOffers,
  isJurosBaixosConfigured,
  mapCatalogOfferToCreditOffer
} from '../integrations/jurosBaixos/index.js';

const serializeDecimal = (value) => (value == null ? null : Number(value));

const serializeSimulation = (simulation) => ({
  id: simulation.id,
  leadId: simulation.leadId,
  providerSessionId: simulation.providerSessionId,
  provider: simulation.provider,
  externalSimulationId: simulation.externalSimulationId,
  requestedAmount: serializeDecimal(simulation.requestedAmount),
  installments: simulation.installments,
  productType: simulation.productType,
  status: simulation.status,
  rawRequest: simulation.rawRequest,
  rawResponse: simulation.rawResponse,
  createdAt: simulation.createdAt,
  updatedAt: simulation.updatedAt
});

const maskCpf = (cpf = '') => {
  const digits = String(cpf).replace(/\D/g, '');
  if (!digits) return null;
  return `${digits.slice(0, 3)}***${digits.slice(-2)}`;
};

const serializeLead = (lead) => ({
  ...lead,
  cpf: maskCpf(lead.cpf)
});

const serializeProviderSession = (providerSession) =>
  providerSession
    ? {
        id: providerSession.id,
        leadId: providerSession.leadId,
        provider: providerSession.provider,
        externalUserId: providerSession.externalUserId,
        externalSessionId: providerSession.externalSessionId,
        tokenExpiresAt: providerSession.tokenExpiresAt,
        status: providerSession.status,
        lastError: providerSession.lastError,
        createdAt: providerSession.createdAt,
        updatedAt: providerSession.updatedAt
      }
    : null;

const ensureProviderIdentity = async ({ lead, providerSession }) => {
  let session = providerSession;

  if (!session.externalUserId) {
    try {
      const createdUser = await createThirdPartyUser({ lead });
      session = await CreditProviderSessionService.updateSession(session.id, {
        ...createdUser,
        status: createdUser.externalJwt ? 'authenticated' : 'user_created',
        lastError: null
      });
    } catch (error) {
      if (!(error instanceof JurosBaixosApiError) || error.statusCode !== 409) {
        throw error;
      }
    }
  }

  if (!session.externalJwt) {
    const authenticated = await authenticateThirdPartyUser({
      lead,
      externalUserId: session.externalUserId
    });

    session = await CreditProviderSessionService.updateSession(session.id, {
      ...authenticated,
      status: authenticated.externalJwt ? 'authenticated' : 'ready',
      lastError: null
    });
  }

  return session;
};

export class CreditSimulationService {
  static async startJourney(payload) {
    CreditTrackingService.log('CREDIT_START_REQUEST', {
      sourcePage: payload.sourcePage,
      productType: payload.productType,
      cpf: payload.cpf
    });

    try {
      const lead = await CreditLeadService.createOrReuseLead(payload);
      let providerSession = await CreditProviderSessionService.ensureSession({
        leadId: lead.id,
        provider: 'juros_baixos'
      });

      if (isJurosBaixosConfigured()) {
        providerSession = await ensureProviderIdentity({ lead, providerSession });
      } else {
        providerSession = await CreditProviderSessionService.updateSession(providerSession.id, {
          status: 'not_configured',
          lastError: 'Juros Baixos integration not configured. Falling back to local catalog.'
        });
      }

      CreditTrackingService.log('CREDIT_START_SUCCESS', {
        leadId: lead.id,
        providerSessionId: providerSession.id,
        providerConfigured: isJurosBaixosConfigured()
      });

      return {
        lead: serializeLead(lead),
        providerSession: serializeProviderSession(providerSession)
      };
    } catch (error) {
      CreditTrackingService.log(
        'CREDIT_START_ERROR',
        {
          message: error.message,
          code: error.code || null,
          sourcePage: payload.sourcePage
        },
        'error'
      );
      throw error;
    }
  }

  static async simulate({ leadId, providerSessionId, requestedAmount, installments, productType }) {
    CreditTrackingService.log('CREDIT_SIMULATION_REQUEST', {
      leadId,
      requestedAmount,
      installments,
      productType
    });

    const prisma = getPrisma();
    const lead = await CreditLeadService.getById(leadId);
    if (!lead) {
      throw new Error('Credit lead not found.');
    }

    let providerSession =
      (providerSessionId && (await prisma.creditProviderSession.findUnique({ where: { id: providerSessionId } }))) ||
      (await CreditProviderSessionService.ensureSession({ leadId, provider: 'juros_baixos' }));

    const simulation = await prisma.creditSimulation.create({
      data: {
        leadId,
        providerSessionId: providerSession.id,
        provider: isJurosBaixosConfigured() ? 'juros_baixos' : 'catalog_fallback',
        requestedAmount,
        installments,
        productType,
        status: 'pending',
        rawRequest: {
          leadId,
          requestedAmount,
          installments,
          productType
        }
      }
    });

    try {
      let normalizedOffers;
      let externalSimulationId = null;
      let rawResponse = null;

      if (isJurosBaixosConfigured()) {
        providerSession = await ensureProviderIdentity({ lead, providerSession });

        let providerResponse = await createThirdPartySimulation({
          lead,
          simulation: {
            requestedAmount,
            installments,
            productType
          },
          userToken: providerSession.externalJwt
        });

        externalSimulationId = providerResponse.externalSimulationId;
        normalizedOffers = providerResponse.offers;
        rawResponse = providerResponse.rawResponse;

        if ((!normalizedOffers || normalizedOffers.length === 0) && externalSimulationId) {
          providerResponse = await fetchSimulationOffers({
            externalSimulationId,
            userToken: providerSession.externalJwt
          });
          normalizedOffers = providerResponse.offers;
          rawResponse = providerResponse.rawResponse;
        }
      } else {
        const catalogOffers = await OfferService.list({ productType });
        const rankedCatalogOffers = OfferService.rank(catalogOffers, {
          requestedAmount,
          scoreRange: lead.scoreRange
        }).slice(0, 8);

        normalizedOffers = rankedCatalogOffers.map((offer, index) => mapCatalogOfferToCreditOffer(offer, index));
        rawResponse = {
          mode: 'catalog_fallback',
          totalOffers: normalizedOffers.length
        };
      }

      const persistedOffers = await CreditOfferService.replaceSimulationOffers({
        simulationId: simulation.id,
        provider: isJurosBaixosConfigured() ? 'juros_baixos' : 'catalog_fallback',
        offers: normalizedOffers
      });

      const updatedSimulation = await prisma.creditSimulation.update({
        where: { id: simulation.id },
        data: {
          provider: isJurosBaixosConfigured() ? 'juros_baixos' : 'catalog_fallback',
          externalSimulationId,
          status: persistedOffers.length ? 'completed' : 'no_offers',
          rawResponse
        }
      });

      CreditTrackingService.log('CREDIT_SIMULATION_SUCCESS', {
        simulationId: updatedSimulation.id,
        leadId,
        offers: persistedOffers.length,
        provider: updatedSimulation.provider
      });

      return {
        simulation: serializeSimulation(updatedSimulation),
        offers: persistedOffers,
        providerConfigured: isJurosBaixosConfigured()
      };
    } catch (error) {
      await prisma.creditSimulation.update({
        where: { id: simulation.id },
        data: {
          status: 'error',
          rawResponse: {
            error: error.message,
            code: error.code || null
          }
        }
      });

      await CreditProviderSessionService.updateSession(providerSession.id, {
        status: 'error',
        lastError: error.message
      });

      CreditTrackingService.log(
        error instanceof JurosBaixosApiError ? 'CREDIT_PROVIDER_RESPONSE_ERROR' : 'CREDIT_SIMULATION_ERROR',
        {
          simulationId: simulation.id,
          leadId,
          message: error.message,
          code: error.code || null
        },
        'error'
      );

      throw error;
    }
  }

  static async getSimulationById(id) {
    const simulation = await getPrisma().creditSimulation.findUnique({
      where: { id },
      include: {
        lead: true,
        providerSession: true
      }
    });

    if (!simulation) return null;

    const offers = await CreditOfferService.listBySimulationId(id);

    return {
      simulation: serializeSimulation(simulation),
      lead: serializeLead(simulation.lead),
      providerSession: serializeProviderSession(simulation.providerSession),
      offers
    };
  }
}
