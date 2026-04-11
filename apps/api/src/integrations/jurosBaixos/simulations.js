import { getJurosBaixosConfig } from './config.js';
import { jurosBaixosRequest } from './client.js';
import { mapJurosBaixosSimulationResponse } from './mapper.js';
import { JurosBaixosValidationError } from './errors.js';

const digitsOnly = (value = '') => String(value).replace(/\D/g, '');

const normalizeIncomeSource = (employmentStatus) => {
  const normalized = String(employmentStatus || '').toUpperCase();

  const mapping = {
    CLT: 'CLT',
    PJ: 'ENTREPRENEUR',
    AUTONOMO: 'AUTONOMOUS',
    'AUTÔNOMO': 'AUTONOMOUS',
    AUTONOMOUS: 'AUTONOMOUS',
    MEI: 'MEI',
    APOSENTADO: 'RETIREMENT',
    RETIREMENT: 'RETIREMENT',
    DESEMPREGADO: 'UNEMPLOYED',
    UNEMPLOYED: 'UNEMPLOYED',
    SELF_EMPLOYED: 'SELF_EMPLOYED',
    PENSION: 'PENSION'
  };

  return mapping[normalized] || 'OTHER_INCOME';
};

const buildDefaultProfile = ({ lead, simulation }) => ({
  source: 'cote_juros',
  customer_id: lead.id,
  ad_group: lead.utmCampaign || lead.productType || 'organic',
  ad_source: lead.utmSource || 'portal',
  ad_campaign: lead.utmCampaign || undefined,
  due_date: simulation.dueDate || lead.jurosBaixosProfile?.due_date || null,
  restricted_to: simulation.restrictedTo || lead.jurosBaixosProfile?.restricted_to || undefined,
  reason: simulation.reason || 'OTHER_REASON',
  info: {
    name: lead.fullName,
    birth_city: lead.jurosBaixosProfile?.info?.birth_city || null,
    birth_date: lead.jurosBaixosProfile?.info?.birth_date || null,
    birth_state: lead.jurosBaixosProfile?.info?.birth_state || null,
    mothers_name: lead.jurosBaixosProfile?.info?.mothers_name || null,
    gender: lead.jurosBaixosProfile?.info?.gender || null,
    marital_status: lead.jurosBaixosProfile?.info?.marital_status || null,
    educationalLevel: lead.jurosBaixosProfile?.info?.educationalLevel || null,
    politically_exposed: lead.jurosBaixosProfile?.info?.politically_exposed ?? false,
    rg: lead.jurosBaixosProfile?.info?.rg || undefined,
    drivers_license: lead.jurosBaixosProfile?.info?.drivers_license || undefined
  },
  finance: {
    income_source: lead.jurosBaixosProfile?.finance?.income_source || normalizeIncomeSource(lead.employmentStatus),
    monthly_income: Number(lead.income || 0),
    annotated: Boolean(lead.hasRestriction),
    account: lead.jurosBaixosProfile?.finance?.account || undefined
  },
  residence: {
    address: lead.jurosBaixosProfile?.residence?.address || null,
    city: lead.jurosBaixosProfile?.residence?.city || null,
    district: lead.jurosBaixosProfile?.residence?.district || null,
    number: lead.jurosBaixosProfile?.residence?.number || null,
    state: lead.jurosBaixosProfile?.residence?.state || null,
    zip_code: lead.jurosBaixosProfile?.residence?.zip_code || null,
    complement: lead.jurosBaixosProfile?.residence?.complement || undefined,
    living_here_since: lead.jurosBaixosProfile?.residence?.living_here_since || undefined
  }
});

const listMissingFields = (payload) => {
  const requiredPaths = [
    'info.birth_city',
    'info.birth_date',
    'info.birth_state',
    'info.name',
    'info.gender',
    'info.mothers_name',
    'info.marital_status',
    'info.educationalLevel',
    'finance.income_source',
    'finance.monthly_income',
    'finance.annotated',
    'residence.address',
    'residence.city',
    'residence.district',
    'residence.number',
    'residence.state',
    'residence.zip_code',
    'ad_group',
    'duration',
    'amount',
    'user_id',
    'reason',
    'cpf',
    'email',
    'mobile_phone',
    'customer_id',
    'source',
    'due_date'
  ];

  return requiredPaths.filter((path) => {
    const value = path.split('.').reduce((acc, key) => (acc == null ? undefined : acc[key]), payload);
    return value === undefined || value === null || value === '';
  });
};

export const buildSimulationPayload = ({ lead, simulation, externalUserId }) => {
  const profile = buildDefaultProfile({ lead, simulation });

  const payload = {
    info: profile.info,
    finance: profile.finance,
    residence: profile.residence,
    ad_campaign: profile.ad_campaign,
    ad_group: profile.ad_group,
    ad_source: profile.ad_source,
    duration: simulation.installments,
    amount: simulation.requestedAmount,
    user_id: externalUserId || simulation.externalUserId || null,
    reason: profile.reason,
    cpf: digitsOnly(lead.cpf),
    email: lead.email || null,
    mobile_phone: digitsOnly(lead.phone || ''),
    due_date: profile.due_date,
    customer_id: profile.customer_id,
    source: profile.source,
    restricted_to: profile.restricted_to
  };

  const missingFields = listMissingFields(payload);
  if (missingFields.length) {
    throw new JurosBaixosValidationError(
      `Missing Juros Baixos simulation fields required by official docs: ${missingFields.join(', ')}.`,
      { details: { missingFields } }
    );
  }

  return payload;
};

export const createThirdPartySimulation = async ({ lead, simulation, userToken }) => {
  const config = getJurosBaixosConfig();
  const payload = await jurosBaixosRequest({
    path: config.endpoints.simulationCreatePath,
    method: 'POST',
    token: userToken,
    headers: {
      'User-Agent': simulation.userAgent || lead.userAgent || 'cote-juros-backend/1.0'
    },
    body: buildSimulationPayload({
      lead,
      simulation,
      externalUserId: simulation.externalUserId || null
    })
  });

  return mapJurosBaixosSimulationResponse(payload);
};
