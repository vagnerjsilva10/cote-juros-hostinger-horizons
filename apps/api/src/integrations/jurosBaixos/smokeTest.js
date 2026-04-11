import { createThirdPartyUser, authenticateThirdPartyUser } from './users.js';
import { createThirdPartySimulation } from './simulations.js';
import { fetchSimulationOffers } from './offers.js';

const fixture = {
  lead: {
    id: 'lead_smoke_test',
    fullName: process.env.JB_TEST_FULL_NAME || 'Teste Juros Baixos',
    cpf: process.env.JB_TEST_CPF || '',
    email: process.env.JB_TEST_EMAIL || '',
    phone: process.env.JB_TEST_PHONE || '',
    income: Number(process.env.JB_TEST_INCOME || 5000),
    employmentStatus: process.env.JB_TEST_EMPLOYMENT_STATUS || 'CLT',
    hasRestriction: String(process.env.JB_TEST_HAS_RESTRICTION || 'false') === 'true',
    productType: 'loan',
    sourcePage: '/smoke-test',
    utmSource: 'local',
    utmCampaign: 'juros_baixos_smoke',
    jurosBaixosProfile: {
      due_date: process.env.JB_TEST_DUE_DATE || '2026-05-10',
      info: {
        birth_city: process.env.JB_TEST_BIRTH_CITY || '',
        birth_date: process.env.JB_TEST_BIRTH_DATE || '',
        birth_state: process.env.JB_TEST_BIRTH_STATE || '',
        mothers_name: process.env.JB_TEST_MOTHERS_NAME || '',
        gender: process.env.JB_TEST_GENDER || '',
        marital_status: process.env.JB_TEST_MARITAL_STATUS || '',
        educationalLevel: process.env.JB_TEST_EDUCATIONAL_LEVEL || ''
      },
      residence: {
        address: process.env.JB_TEST_ADDRESS || '',
        city: process.env.JB_TEST_CITY || '',
        district: process.env.JB_TEST_DISTRICT || '',
        number: process.env.JB_TEST_ADDRESS_NUMBER || '',
        state: process.env.JB_TEST_STATE || '',
        zip_code: process.env.JB_TEST_ZIP_CODE || ''
      }
    }
  },
  simulation: {
    requestedAmount: Number(process.env.JB_TEST_AMOUNT || 5000),
    installments: Number(process.env.JB_TEST_INSTALLMENTS || 12),
    reason: process.env.JB_TEST_REASON || 'OTHER_REASON',
    dueDate: process.env.JB_TEST_DUE_DATE || '2026-05-10',
    userAgent:
      process.env.JB_TEST_USER_AGENT ||
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36'
  }
};

const main = async () => {
  const created = await createThirdPartyUser({ lead: fixture.lead });
  const logged = created.externalJwt
    ? created
    : await authenticateThirdPartyUser({
        externalUserId: created.externalUserId
      });

  const simulation = await createThirdPartySimulation({
    lead: fixture.lead,
    simulation: {
      ...fixture.simulation,
      externalUserId: logged.externalUserId
    },
    userToken: logged.externalJwt
  });

  const offers = await fetchSimulationOffers({
    externalSimulationId: simulation.externalSimulationId,
    userToken: logged.externalJwt,
    statuses: ['PROPOSED', 'VALIDATING', 'ONGOING']
  });

  console.log(
    JSON.stringify(
      {
        createdUserId: created.externalUserId,
        loggedUserId: logged.externalUserId,
        simulationId: simulation.externalSimulationId,
        offers: offers.offers.slice(0, 3)
      },
      null,
      2
    )
  );
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
