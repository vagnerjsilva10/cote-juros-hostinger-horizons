import 'dotenv/config.js';
import { googleSheetsClient } from '../src/integrations/googleSheets.js';

const sheetHeaders = {
  leads_raw: [
    'externalLeadId',
    'batchId',
    'fullName',
    'email',
    'phone',
    'cpf',
    'productType',
    'source',
    'segment',
    'requestedAmount',
    'income',
    'employmentStatus',
    'hasRestriction',
    'hasGuarantee',
    'guaranteeType',
    'createdAt',
    'notes',
  ],
  leads_queue: [
    'status',
    'externalLeadId',
    'batchId',
    'fullName',
    'email',
    'phone',
    'cpf',
    'productType',
    'source',
    'segment',
    'requestedAmount',
    'income',
    'employmentStatus',
    'hasRestriction',
    'hasGuarantee',
    'guaranteeType',
    'attempts',
    'leadId',
    'token',
    'reactivationUrl',
    'importedAt',
    'lastAttemptAt',
    'errorMessage',
    'emailStatus',
    'emailSentAt',
    'emailProvider',
    'emailSequence',
    'emailCount',
    'lastEmailAttemptAt',
    'nextEmailAt',
    'emailError',
    'unsubscribeUrl',
  ],
  leads_results: [
    'externalLeadId',
    'batchId',
    'leadId',
    'token',
    'status',
    'scoreValue',
    'scoreBand',
    'qualification',
    'selectedPartnerId',
    'selectedPartnerName',
    'deliveryStatus',
    'redirectUrl',
    'submittedAt',
    'deliveredAt',
    'optOutAt',
    'lastSyncedAt',
    'errorMessage',
  ],
  kpis_daily: [
    'date',
    'batchId',
    'totalLeads',
    'sentLeads',
    'visits',
    'consents',
    'forms',
    'qualified',
    'routed',
    'delivered',
    'deliveryFailed',
    'visitRate',
    'consentRate',
    'formRate',
    'qualificationRate',
    'deliveryRate',
    'estimatedRevenueCents',
    'payoutCents',
    'syncedAt',
  ],
  suppressions: [
    'type',
    'value',
    'reason',
    'source',
    'createdAt',
  ],
  errors: [
    'timestamp',
    'job',
    'batchId',
    'externalLeadId',
    'leadId',
    'status',
    'errorMessage',
    'payload',
  ],
};

function validateEnv() {
  const required = [
    'GOOGLE_SHEETS_CREDENTIALS_JSON',
    'GOOGLE_SHEETS_REACTIVATION_ID',
  ];
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing environment variables: ${missing.join(', ')}`);
  }
}

async function main() {
  validateEnv();

  const spreadsheetId = process.env.GOOGLE_SHEETS_REACTIVATION_ID;
  const info = await googleSheetsClient.getSpreadsheetInfo(spreadsheetId);
  console.log(`[SetupSheets] Connected to spreadsheet: ${info.title}`);

  for (const [sheetName, headers] of Object.entries(sheetHeaders)) {
    const result = await googleSheetsClient.ensureHeaders(spreadsheetId, sheetName, headers);
    const added = result.missingHeadersAdded.length > 0
      ? `added headers: ${result.missingHeadersAdded.join(', ')}`
      : 'headers ok';
    console.log(`[SetupSheets] ${sheetName}: ${result.createdHeaders ? 'created header row' : added}`);
  }

  console.log('[SetupSheets] Done');
}

main().catch((error) => {
  console.error('[SetupSheets] Fatal error:', error.message);
  process.exit(1);
});
