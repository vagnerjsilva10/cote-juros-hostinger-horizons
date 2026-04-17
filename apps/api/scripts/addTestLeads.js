import 'dotenv/config.js';
import { pathToFileURL } from 'node:url';
import { googleSheetsClient } from '../src/integrations/googleSheets.js';

const batchId = process.env.REACTIVATION_BATCH_ID || 'piloto-5-2026-04-17';

function phoneFor(runId, index) {
  const base = String(runId).slice(-7).padStart(7, '0');
  return `119${index}${base}`.slice(0, 11);
}

function buildTestLeads() {
  const runId = Date.now();
  const common = {
    batchId,
    productType: 'loan',
    source: 'test',
    status: 'queued',
    attempts: 0,
  };

  return [
    {
      ...common,
      externalLeadId: `sheet-test-${runId}-001`,
      fullName: 'Joao Silva',
      email: `teste1+${runId}@exemplo.com`,
      phone: phoneFor(runId, 1),
      segment: 'piloto_alta_intencao',
      requestedAmount: 5000,
      income: 5200,
      employmentStatus: 'clt',
      hasRestriction: false,
      hasGuarantee: true,
      guaranteeType: 'veiculo',
    },
    {
      ...common,
      externalLeadId: `sheet-test-${runId}-002`,
      fullName: 'Maria Santos',
      email: `teste2+${runId}@exemplo.com`,
      phone: phoneFor(runId, 2),
      segment: 'morno',
      requestedAmount: 8000,
      income: 3800,
      employmentStatus: 'autonomo',
      hasRestriction: false,
      hasGuarantee: false,
      guaranteeType: '',
    },
    {
      ...common,
      externalLeadId: `sheet-test-${runId}-003`,
      fullName: 'Pedro Oliveira',
      email: `teste3+${runId}@exemplo.com`,
      phone: phoneFor(runId, 3),
      segment: 'morno',
      requestedAmount: 3000,
      income: 2200,
      employmentStatus: 'mei',
      hasRestriction: true,
      hasGuarantee: false,
      guaranteeType: '',
    },
    {
      ...common,
      externalLeadId: `sheet-test-${runId}-004`,
      fullName: 'Ana Costa',
      email: `teste4+${runId}@exemplo.com`,
      phone: phoneFor(runId, 4),
      segment: 'piloto_alta_intencao',
      requestedAmount: 10000,
      income: 7000,
      employmentStatus: 'clt',
      hasRestriction: false,
      hasGuarantee: true,
      guaranteeType: 'imovel',
    },
    {
      ...common,
      externalLeadId: `sheet-test-${runId}-005`,
      fullName: 'Carlos Ferreira',
      email: `teste5+${runId}@exemplo.com`,
      phone: phoneFor(runId, 5),
      segment: 'frio',
      requestedAmount: 15000,
      income: 3000,
      employmentStatus: 'freelancer',
      hasRestriction: false,
      hasGuarantee: false,
      guaranteeType: '',
    },
  ];
}

async function addTestLeads() {
  if (!process.env.GOOGLE_SHEETS_REACTIVATION_ID) {
    throw new Error('GOOGLE_SHEETS_REACTIVATION_ID is required');
  }

  const testLeads = buildTestLeads();
  console.log(`[AddTestLeads] Appending ${testLeads.length} queued leads to leads_queue`);
  await googleSheetsClient.appendRows(process.env.GOOGLE_SHEETS_REACTIVATION_ID, 'leads_queue', testLeads);
  console.log('[AddTestLeads] Done');
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  addTestLeads().catch((error) => {
    console.error('[AddTestLeads] Fatal error:', error.message);
    process.exit(1);
  });
}

export { addTestLeads, buildTestLeads };
