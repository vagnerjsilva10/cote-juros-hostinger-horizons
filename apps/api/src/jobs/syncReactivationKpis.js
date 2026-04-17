import 'dotenv/config.js';
import axios from 'axios';
import { googleSheetsClient } from '../integrations/googleSheets.js';
import { JobRunLogger } from './jobRunLogger.js';

class SyncReactivationKpisJob {
  constructor() {
    this.validateEnv();
    this.spreadsheetId = process.env.GOOGLE_SHEETS_REACTIVATION_ID;
    this.apiBaseUrl = process.env.COTE_API_BASE_URL;
    this.apiToken = process.env.COTE_API_TOKEN;
    this.sheetName = 'kpis_daily';
    this.stats = {
      fetched: 0,
      saved: 0,
      errors: 0,
    };
    this.jobRunLogger = new JobRunLogger('sync_reactivation_kpis');
  }

  validateEnv() {
    const required = [
      'GOOGLE_SHEETS_REACTIVATION_ID',
      'COTE_API_BASE_URL',
      'COTE_API_TOKEN',
      'GOOGLE_SHEETS_CREDENTIALS_JSON',
    ];

    const missing = required.filter(key => !process.env[key]);
    if (missing.length > 0) {
      throw new Error(`Missing environment variables: ${missing.join(', ')}`);
    }
  }

  async run() {
    const batchId = process.argv[2];

    if (!batchId) {
      throw new Error('batchId required: node syncReactivationKpis.js <batchId>');
    }

    console.log(`[SyncKpis] Job started for batchId: ${batchId}`);
    await this.jobRunLogger.start({ batchId });

    try {
      // Fetch KPIs from API
      const kpis = await this.fetchKpis(batchId);
      this.stats.fetched = 1;

      // Save to Google Sheets
      await this.saveKpisToSheet(batchId, kpis);
      this.stats.saved = 1;

      console.log('[SyncKpis] Job completed');
      console.log(
        `[SyncKpis] Summary: fetched ${this.stats.fetched}, saved ${this.stats.saved}`
      );
      await this.jobRunLogger.finish('success', this.stats);

      return this.stats;
    } catch (error) {
      console.error('[SyncKpis] Job failed:', error.message);
      this.stats.errors++;
      await this.jobRunLogger.finish('failed', this.stats, error);
      throw error;
    }
  }

  async fetchKpis(batchId) {
    try {
      const url = `${this.apiBaseUrl}/api/reactivation/kpis`;

      const response = await axios.get(url, {
        params: { batchId },
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      });

      if (response.status !== 200) {
        throw new Error(`API returned status ${response.status}`);
      }

      console.log(`[SyncKpis] Fetched KPIs for batch ${batchId}`);
      return response.data?.data || response.data;
    } catch (error) {
      if (error.response) {
        throw new Error(
          `API error (${error.response.status}): ${
            error.response.data?.message || error.message
          }`
        );
      }
      throw error;
    }
  }

  async saveKpisToSheet(batchId, kpis) {
    try {
      // Prepare row data
      const now = new Date().toISOString();
      const row = [
        now.slice(0, 10),
        batchId,
        kpis.totalLeads || 0,
        kpis.sentLeads || 0,
        kpis.visits || 0,
        kpis.consents || 0,
        kpis.forms || 0,
        kpis.qualified || 0,
        kpis.routed || 0,
        kpis.delivered || 0,
        kpis.deliveryFailed || 0,
        kpis.conversionRates?.visitRate || 0,
        kpis.conversionRates?.consentRate || 0,
        kpis.conversionRates?.formRate || 0,
        kpis.conversionRates?.qualificationRate || 0,
        kpis.conversionRates?.deliveryRate || 0,
        kpis.revenue?.estimatedRevenueCents || 0,
        kpis.revenue?.payoutCents || 0,
        now
      ];

      // Append to sheet
      await googleSheetsClient.appendRows(
        this.spreadsheetId,
        this.sheetName,
        [row]
      );

      console.log(
        `[SyncKpis] Saved KPIs to ${this.sheetName}: ` +
          `totalLeads=${kpis.totalLeads}, delivered=${kpis.delivered}`
      );
    } catch (error) {
      console.error(`[SyncKpis] Failed to save KPIs to sheet:`, error.message);
      throw error;
    }
  }
}

// Run job
const job = new SyncReactivationKpisJob();
job.run().catch(error => {
  console.error('[SyncKpis] Fatal error:', error);
  process.exit(1);
});
