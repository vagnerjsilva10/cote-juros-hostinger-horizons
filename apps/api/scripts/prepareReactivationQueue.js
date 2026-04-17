import 'dotenv/config.js';
import { googleSheetsClient } from '../src/integrations/googleSheets.js';

const SOURCE_SHEET = process.env.REACTIVATION_QUEUE_SOURCE_TAB || 'IMPORT_AUTOMACAO';
const QUEUE_SHEET = 'leads_queue';
const DEFAULT_LIMIT = 5;

function validateEnv() {
  const required = ['GOOGLE_SHEETS_CREDENTIALS_JSON', 'GOOGLE_SHEETS_REACTIVATION_ID'];
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing environment variables: ${missing.join(', ')}`);
  }
}

function firstValue(...values) {
  return values.find((value) => value !== null && value !== undefined && String(value).trim() !== '');
}

function normalizePhone(value) {
  const digits = String(value || '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('55')) return digits;
  return `55${digits}`;
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim());
}

function segmentFromTier(row) {
  const tier = String(row.quality_tier || '').toUpperCase();
  const score = Number(row.quality_score || 0);
  if (tier === 'A' || score >= 80) return 'piloto_alta_intencao';
  if (tier === 'B' || score >= 60) return 'morno';
  return 'frio';
}

function mapSourceLead(row, batchId) {
  const externalLeadId = firstValue(row.lead_id, row.externalLeadId, row.id);
  const fullName = firstValue(row.nome, row.nome_padronizado, row.fullName, row.raw_nome);
  const email = firstValue(row.email, row.email_padronizado, row.raw_email);
  const phone = normalizePhone(firstValue(row.telefone, row.telefone_padronizado, row.raw_telefone_real, row.raw_whatsapp));

  return {
    status: 'queued',
    externalLeadId,
    batchId,
    fullName,
    email,
    phone,
    productType: 'loan',
    source: 'google_sheets_import_automacao',
    segment: segmentFromTier(row),
    requestedAmount: '',
    income: '',
    employmentStatus: '',
    hasRestriction: '',
    hasGuarantee: '',
    guaranteeType: '',
    attempts: 0,
    leadId: '',
    token: '',
    reactivationUrl: '',
    importedAt: '',
    lastAttemptAt: '',
    errorMessage: '',
    emailStatus: '',
    emailSentAt: '',
    emailProvider: '',
    emailSequence: '',
    emailCount: '',
    lastEmailAttemptAt: '',
    nextEmailAt: '',
    emailError: '',
    unsubscribeUrl: '',
    originalPayload: JSON.stringify({
      sourceSheet: SOURCE_SHEET,
      rowIndex: row._rowIndex,
      qualityScore: row.quality_score,
      qualityTier: row.quality_tier,
      channel: row.canal_sugerido,
      capturedAt: row.data_captura,
      importTag: row.tag_importacao,
      statusInicial: row.status_inicial,
      origem: row.origem,
    }),
  };
}

function isUsableSourceRow(row) {
  const status = String(row.status_inicial || row.crm_status || '').toLowerCase();
  const email = firstValue(row.email, row.email_padronizado, row.raw_email);
  const phone = firstValue(row.telefone, row.telefone_padronizado, row.raw_telefone_real, row.raw_whatsapp);
  const id = firstValue(row.lead_id, row.externalLeadId, row.id);

  if (!id) return false;
  if (!isValidEmail(email)) return false;
  if (!normalizePhone(phone)) return false;
  if (status.includes('descart')) return false;
  if (status.includes('bloque')) return false;
  return true;
}

async function main() {
  validateEnv();
  const spreadsheetId = process.env.GOOGLE_SHEETS_REACTIVATION_ID;
  const batchId = process.env.REACTIVATION_BATCH_ID || `piloto-${new Date().toISOString().slice(0, 10)}`;
  const limit = Number(process.argv[2] || process.env.REACTIVATION_QUEUE_LIMIT || DEFAULT_LIMIT);

  const [sourceRows, queueRows] = await Promise.all([
    googleSheetsClient.readRows(spreadsheetId, SOURCE_SHEET),
    googleSheetsClient.readRows(spreadsheetId, QUEUE_SHEET),
  ]);

  const alreadyQueued = new Set(
    queueRows
      .map((row) => String(row.externalLeadId || '').trim())
      .filter(Boolean)
  );

  const selected = [];
  let skippedExisting = 0;
  let skippedInvalid = 0;

  for (const row of sourceRows) {
    if (selected.length >= limit) break;
    const externalLeadId = firstValue(row.lead_id, row.externalLeadId, row.id);
    if (!isUsableSourceRow(row)) {
      skippedInvalid++;
      continue;
    }
    if (alreadyQueued.has(String(externalLeadId))) {
      skippedExisting++;
      continue;
    }
    selected.push(mapSourceLead(row, batchId));
    alreadyQueued.add(String(externalLeadId));
  }

  if (selected.length > 0) {
    await googleSheetsClient.appendRows(spreadsheetId, QUEUE_SHEET, selected);
  }

  console.log(
    `[PrepareQueue] Source=${SOURCE_SHEET} selected=${selected.length} ` +
      `skippedExisting=${skippedExisting} skippedInvalid=${skippedInvalid} batchId=${batchId}`
  );
  if (selected.length > 0) {
    console.log(`[PrepareQueue] First lead externalLeadId=${selected[0].externalLeadId}`);
  }
}

main().catch((error) => {
  console.error('[PrepareQueue] Fatal error:', error.message);
  process.exit(1);
});
