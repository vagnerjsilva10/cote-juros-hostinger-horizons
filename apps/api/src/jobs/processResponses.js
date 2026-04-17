import 'dotenv/config.js';
import axios from 'axios';
import { googleSheetsClient } from '../integrations/googleSheets.js';

class ProcessResponsesJob {
  constructor() {
    this.validateEnv();
    this.spreadsheetId = process.env.GOOGLE_SHEETS_REACTIVATION_ID;
    this.apiBaseUrl = process.env.COTE_API_BASE_URL;
    this.apiToken = process.env.COTE_API_TOKEN;
  }

  validateEnv() {
    const required = ['GOOGLE_SHEETS_REACTIVATION_ID', 'COTE_API_BASE_URL', 'COTE_API_TOKEN'];
    const missing = required.filter(key => !process.env[key]);
    if (missing.length > 0) {
      throw new Error(`Missing env: ${missing.join(', ')}`);
    }
  }

  async run() {
    console.log('[ProcessResponses] Checking for new responses');

    try {
      const responses = await this.getRecentResponses();

      for (const response of responses) {
        await this.processResponse(response);
      }

      console.log(`[ProcessResponses] Processed ${responses.length} responses`);
      return { processed: responses.length };
    } catch (error) {
      console.error('[ProcessResponses] Failed:', error.message);
      throw error;
    }
  }

  async getRecentResponses() {
    // Buscar leads que interagiram recentemente via API
    // Assumindo endpoint GET /api/reactivation/responses?since=...
    try {
      const url = `${this.apiBaseUrl}/api/reactivation/responses`;
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(); // Últimas 24h

      const response = await axios.get(url, {
        params: { since },
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      });

      return response.data.responses || [];
    } catch (error) {
      console.warn('[ProcessResponses] API not available, checking sheets directly');
      // Fallback: verificar planilha por mudanças de status
      return await this.getResponsesFromSheets();
    }
  }

  async getResponsesFromSheets() {
    // Fallback: buscar leads que mudaram status recentemente
    const rows = await googleSheetsClient.readRows(this.spreadsheetId, 'leads_queue');

    return rows.filter(row => {
      const lastInteraction = row.lastInteraction ? new Date(row.lastInteraction) : null;
      const hoursSince = lastInteraction ? (Date.now() - lastInteraction.getTime()) / (1000 * 60 * 60) : 999;

      return hoursSince < 24 && ['qualified', 'refused', 'suppressed'].includes(row.status);
    });
  }

  async processResponse(response) {
    // response pode vir da API ou da planilha
    const leadId = response.leadId || response.id;
    const status = response.consentGiven ? 'qualified' : 'suppressed';

    // Encontrar linha na planilha
    const rows = await googleSheetsClient.readRows(this.spreadsheetId, 'leads_queue');
    const leadRow = rows.find(row => row.id === leadId || row.leadId === leadId);

    if (!leadRow) {
      console.warn(`[ProcessResponses] Lead ${leadId} not found in sheets`);
      return;
    }

    await googleSheetsClient.updateRow(
      this.spreadsheetId,
      'leads_queue',
      leadRow._rowIndex,
      {
        status,
        consentGiven: response.consentGiven,
        desiredAmount: response.desiredAmount,
        income: response.income,
        profile: response.profile,
        hasNegativeHistory: response.hasNegativeHistory,
        lastInteraction: new Date().toISOString()
      }
    );

    console.log(`[ProcessResponses] Lead ${leadId} status: ${status}`);
  }
}

// Run job
const job = new ProcessResponsesJob();
job.run().catch(error => {
  console.error('[ProcessResponses] Fatal error:', error);
  process.exit(1);
});
