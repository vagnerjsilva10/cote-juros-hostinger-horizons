import 'dotenv/config.js';
import axios from 'axios';
import { googleSheetsClient } from '../integrations/googleSheets.js';

const SHEET_NAME = 'leads_queue';
const STATUS_COLUMN = 'status';
const STATUS_QUEUED = 'queued';
const STATUS_IMPORTED = 'imported';
const STATUS_ERROR = 'error';

class ImportLeadsJob {
  constructor() {
    this.validateEnv();
    this.spreadsheetId = process.env.GOOGLE_SHEETS_REACTIVATION_ID;
    this.apiBaseUrl = process.env.COTE_API_BASE_URL;
    this.apiToken = process.env.COTE_API_TOKEN;
    this.reactivationBaseUrl = process.env.REACTIVATION_BASE_URL;
    this.stats = {
      total: 0,
      imported: 0,
      errors: 0,
      skipped: 0,
    };
  }

  validateEnv() {
    const required = [
      'GOOGLE_SHEETS_CREDENTIALS_JSON',
      'GOOGLE_SHEETS_REACTIVATION_ID',
      'COTE_API_BASE_URL',
      'COTE_API_TOKEN',
      'REACTIVATION_BASE_URL',
    ];

    const missing = required.filter(key => !process.env[key]);
    if (missing.length > 0) {
      throw new Error(`Missing environment variables: ${missing.join(', ')}`);
    }
  }

  async run() {
    console.log('[ImportLeads] Job started');

    try {
      // Read leads from Google Sheets
      const leads = await this.readLeads();
      console.log(`[ImportLeads] Found ${leads.length} leads to process`);

      this.stats.total = leads.length;

      // Process each lead
      for (const lead of leads) {
        await this.processLead(lead);
      }

      console.log('[ImportLeads] Job completed');
      console.log(
        `[ImportLeads] Summary: ${this.stats.imported} imported, ${this.stats.errors} errors, ${this.stats.skipped} skipped`
      );

      return this.stats;
    } catch (error) {
      console.error('[ImportLeads] Job failed:', error.message);
      throw error;
    }
  }

  async readLeads() {
    try {
      const rows = await googleSheetsClient.readRows(
        this.spreadsheetId,
        SHEET_NAME
      );

      return rows.filter(row => row[STATUS_COLUMN] === STATUS_QUEUED);
    } catch (error) {
      console.error('[ImportLeads] Failed to read leads:', error.message);
      throw error;
    }
  }

  async processLead(lead) {
    const externalLeadId = lead.externalLeadId || lead.id || lead.rowId;
    const rowIndex = lead._rowIndex;

    if (!externalLeadId) {
      console.warn('[ImportLeads] Lead missing externalLeadId/id/rowId, skipping row:', rowIndex);
      this.stats.skipped++;
      return;
    }

    try {
      console.log(`[ImportLeads] Processing externalLeadId: ${externalLeadId} (row ${rowIndex})`);

      // Call API to import lead
      const response = await this.importLeadViaApi(lead);

      // Update row with success response
      await this.updateLeadRow(rowIndex, {
        [STATUS_COLUMN]: STATUS_IMPORTED,
        leadId: response.leadId,
        token: response.token,
        reactivationUrl: response.reactivationUrl,
        importedAt: new Date().toISOString(),
        errorMessage: '',
      });

      console.log(`[ImportLeads] Successfully imported externalLeadId: ${externalLeadId}`);
      this.stats.imported++;
    } catch (error) {
      const safeError = this.formatApiError(error);
      console.error(`[ImportLeads] Error importing externalLeadId ${externalLeadId}:`, safeError);

      // Update row with error status
      try {
        await this.updateLeadRow(rowIndex, {
          [STATUS_COLUMN]: STATUS_ERROR,
          lastAttemptAt: new Date().toISOString(),
          attempts: Number(lead.attempts || 0) + 1,
          errorMessage: this.sanitizeError(safeError),
        });
      } catch (updateError) {
        console.error(`[ImportLeads] Failed to update error status for lead ${externalLeadId}:`, updateError.message);
      }

      this.stats.errors++;
    }
  }

  async importLeadViaApi(lead) {
    const url = `${this.apiBaseUrl}/api/reactivation/import`;
    const payload = this.cleanPayload({
      externalLeadId: this.firstValue(lead.externalLeadId, lead.id, lead.rowId),
      batchId: this.firstValue(lead.batchId, process.env.REACTIVATION_BATCH_ID),
      fullName: this.firstValue(lead.fullName, lead.name, lead.nome),
      email: this.firstValue(lead.email),
      phone: this.firstValue(lead.phone, lead.telefone),
      cpf: this.firstValue(lead.cpf),
      productType: this.firstValue(lead.productType, 'loan'),
      source: this.firstValue(lead.source, 'google_sheets_job'),
      segment: this.firstValue(lead.segment),
      requestedAmount: this.parseNumber(lead.requestedAmount, lead.valor),
      income: this.parseNumber(lead.income, lead.renda),
      employmentStatus: this.firstValue(lead.employmentStatus, lead.ocupacao),
      hasRestriction: this.parseBoolean(this.firstValue(lead.hasRestriction, lead.restricao)),
      hasGuarantee: this.parseBoolean(this.firstValue(lead.hasGuarantee, lead.garantia)),
      guaranteeType: this.firstValue(lead.guaranteeType, lead.tipo_garantia),
      originalPayload: lead
    });

    const response = await axios.post(
      url,
      payload,
      {
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      }
    );

    if (response.status !== 200 && response.status !== 201) {
      throw new Error(`API returned status ${response.status}`);
    }

    const data = response.data?.data || response.data;
    const leadData = data.lead || {};
    const token = data.token || null;
    return {
      leadId: leadData.id || data.leadId || '',
      token,
      reactivationUrl: token ? `${this.reactivationBaseUrl}/r/${token}` : '',
      duplicate: Boolean(data.duplicate)
    };
  }

  async updateLeadRow(rowIndex, updates) {
    await googleSheetsClient.updateRow(
      this.spreadsheetId,
      SHEET_NAME,
      rowIndex,
      updates
    );
  }

  sanitizeError(message) {
    // Remove sensitive information like API tokens, emails, etc.
    return message
      .replace(/Bearer\s+\S+/g, 'Bearer [REDACTED]')
      .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[EMAIL]')
      .substring(0, 200); // Limit message length
  }

  formatApiError(error) {
    const response = error.response;
    if (!response) return error.message;
    const bodyError = response.data?.error || response.data?.message;
    const issues = response.data?.issues || response.data?.details;
    const issueText = Array.isArray(issues)
      ? ` ${issues.map((item) => item.message || item.path?.join('.') || JSON.stringify(item)).join('; ')}`
      : '';
    return `API ${response.status}: ${bodyError || error.message}${issueText}`;
  }

  firstValue(...values) {
    return values.find((value) => value !== null && value !== undefined && value !== '');
  }

  parseNumber(...values) {
    const value = this.firstValue(...values);
    const number = Number(value);
    return Number.isFinite(number) && number > 0 ? number : undefined;
  }

  cleanPayload(payload) {
    return Object.fromEntries(
      Object.entries(payload).filter(([, value]) => value !== null && value !== undefined && value !== '')
    );
  }

  parseBoolean(value) {
    if (typeof value === 'boolean') return value;
    return ['true', '1', 'sim', 'yes'].includes(String(value || 'false').toLowerCase());
  }
}

// Run job
const job = new ImportLeadsJob();
job.run().catch(error => {
  console.error('[ImportLeads] Fatal error:', error);
  process.exit(1);
});
