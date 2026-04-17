import 'dotenv/config.js';
import axios from 'axios';
import { googleSheetsClient } from '../integrations/googleSheets.js';

class QualifyAndRouteJob {
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
    console.log('[QualifyAndRoute] Processing qualified leads');

    try {
      const leads = await this.getQualifiedLeads();

      for (const lead of leads) {
        const qualification = this.qualifyLead(lead);
        await this.routeLead(lead, qualification);
      }

      console.log(`[QualifyAndRoute] Processed ${leads.length} leads`);
      return { processed: leads.length };
    } catch (error) {
      console.error('[QualifyAndRoute] Failed:', error.message);
      throw error;
    }
  }

  async getQualifiedLeads() {
    const rows = await googleSheetsClient.readRows(this.spreadsheetId, 'leads_queue');
    return rows.filter(row => row.status === 'qualified' && !row.partnerAssigned);
  }

  qualifyLead(lead) {
    let score = 0;
    const income = parseFloat(lead.income) || 0;
    const desiredAmount = parseFloat(lead.desiredAmount) || 0;

    // Pontuação baseada nos dados
    if (income > 5000) score += 30;
    if (desiredAmount < 10000) score += 20;
    if (lead.hasNegativeHistory === 'false' || !lead.hasNegativeHistory) score += 25;
    if (lead.profile === 'CLT') score += 15;
    if (lead.consentGiven) score += 10;

    // Classificação
    if (score >= 70) {
      return {
        level: 'high',
        partner: lead.hasNegativeHistory === 'true' ? 'prime-recovery' : 'prime-bank',
        score
      };
    }
    if (score >= 40) {
      return {
        level: 'medium',
        partner: 'standard-finance',
        score
      };
    }
    return {
      level: 'low',
      partner: 'recovery-partner',
      score
    };
  }

  async routeLead(lead, qualification) {
    try {
      // Enviar para API de delivery existente
      const url = `${this.apiBaseUrl}/api/reactivation/import`;

      const response = await axios.post(url, {
        leadId: lead.id || lead.leadId,
        email: lead.email,
        phone: lead.phone,
        name: lead.name,
        qualification: qualification.level,
        desiredAmount: lead.desiredAmount,
        income: lead.income,
        profile: lead.profile,
        hasNegativeHistory: lead.hasNegativeHistory
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      });

      // Atualizar planilha
      await googleSheetsClient.updateRow(
        this.spreadsheetId,
        'leads_queue',
        lead._rowIndex,
        {
          status: 'routed',
          qualification: qualification.level,
          partnerAssigned: qualification.partner,
          qualificationScore: qualification.score,
          routedAt: new Date().toISOString()
        }
      );

      console.log(`[QualifyAndRoute] Lead ${lead.id} routed to ${qualification.partner} (score: ${qualification.score})`);
    } catch (error) {
      console.error(`[QualifyAndRoute] Failed to route lead ${lead.id}:`, error.message);

      await googleSheetsClient.updateRow(
        this.spreadsheetId,
        'leads_queue',
        lead._rowIndex,
        {
          status: 'routing_error',
          lastError: error.message.substring(0, 200)
        }
      );
    }
  }
}

// Run job
const job = new QualifyAndRouteJob();
job.run().catch(error => {
  console.error('[QualifyAndRoute] Fatal error:', error);
  process.exit(1);
});
