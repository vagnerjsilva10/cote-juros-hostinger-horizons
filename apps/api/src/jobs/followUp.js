import 'dotenv/config.js';
import sgMail from '@sendgrid/mail';
import { googleSheetsClient } from '../integrations/googleSheets.js';

class FollowUpJob {
  constructor() {
    this.validateEnv();
    this.spreadsheetId = process.env.GOOGLE_SHEETS_REACTIVATION_ID;
    this.sendgridApiKey = process.env.SENDGRID_API_KEY;
    this.fromEmail = process.env.SENDGRID_FROM_EMAIL || 'noreply@finance.cotejuros.com.br';

    if (this.sendgridApiKey) {
      sgMail.setApiKey(this.sendgridApiKey);
    }
  }

  validateEnv() {
    const required = ['GOOGLE_SHEETS_REACTIVATION_ID'];
    const missing = required.filter(key => !process.env[key]);
    if (missing.length > 0) {
      throw new Error(`Missing env: ${missing.join(', ')}`);
    }
  }

  async run() {
    console.log('[FollowUp] Processing follow-ups');

    try {
      const noResponse = await this.getNoResponseLeads();
      await this.sendReminders(noResponse);

      const refusals = await this.getRefusalLeads();
      await this.suppressLeads(refusals);

      console.log(`[FollowUp] Processed ${noResponse.length} reminders, ${refusals.length} suppressions`);
      return { reminders: noResponse.length, suppressions: refusals.length };
    } catch (error) {
      console.error('[FollowUp] Failed:', error.message);
      throw error;
    }
  }

  async getNoResponseLeads() {
    const rows = await googleSheetsClient.readRows(this.spreadsheetId, 'leads_queue');

    return rows.filter(row => {
      const sentDate = row.lastEmailSent ? new Date(row.lastEmailSent) : null;
      const daysSince = sentDate ? (Date.now() - sentDate.getTime()) / (1000 * 60 * 60 * 24) : 999;

      return row.status === 'email_sent' &&
             daysSince > 3 &&
             (row.emailCount || 0) < 3; // Máximo 2 lembretes + 1 inicial = 3
    });
  }

  async sendReminders(leads) {
    for (const lead of leads) {
      try {
        await this.sendReminderEmail(lead);

        await googleSheetsClient.updateRow(
          this.spreadsheetId,
          'leads_queue',
          lead._rowIndex,
          {
            emailCount: (lead.emailCount || 0) + 1,
            lastReminder: new Date().toISOString()
          }
        );

        console.log(`[FollowUp] Reminder sent to ${this.sanitizeEmail(lead.email)}`);
      } catch (error) {
        console.error(`[FollowUp] Failed to send reminder to lead ${lead.id}:`, error.message);
      }
    }
  }

  async sendReminderEmail(lead) {
    if (!this.sendgridApiKey) {
      console.log(`[FollowUp] SIMULATION: Would send reminder to ${this.sanitizeEmail(lead.email)}`);
      return;
    }

    const reminderNumber = (lead.emailCount || 1) - 1; // Já foi incrementado

    const msg = {
      to: lead.email,
      from: this.fromEmail,
      subject: reminderNumber === 1 ? 'Último lembrete: sua oferta expira em 24h' : 'Lembrete: crédito pré-aprovado esperando',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Oi ${lead.name || 'amigo'}, ainda interessado?</h2>
          <p>Você recebeu nossa oferta de crédito pré-aprovado, mas ainda não respondeu.</p>
          <p>⏰ ${reminderNumber === 1 ? 'Esta é sua última chance' : 'Não perca esta oportunidade'}</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://finance.cotejuros.com.br/r/${lead.token}"
               style="background: #28a745; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
              Ver Oferta Agora
            </a>
          </div>
          <p style="font-size: 12px; color: #666;">
            Se não quiser mais receber nossas mensagens,
            <a href="https://finance.cotejuros.com.br/unsubscribe/${lead.token}">clique aqui</a>.
          </p>
        </div>
      `
    };

    await sgMail.send(msg);
  }

  async getRefusalLeads() {
    const rows = await googleSheetsClient.readRows(this.spreadsheetId, 'leads_queue');
    return rows.filter(row => row.status === 'refused');
  }

  async suppressLeads(leads) {
    for (const lead of leads) {
      await googleSheetsClient.updateRow(
        this.spreadsheetId,
        'leads_queue',
        lead._rowIndex,
        {
          status: 'suppressed',
          suppressedAt: new Date().toISOString(),
          suppressionReason: 'refused_follow_up'
        }
      );

      // Mover para aba suppressions
      await googleSheetsClient.appendRows(
        this.spreadsheetId,
        'suppressions',
        [[
          lead.email,
          'refused',
          new Date().toISOString(),
          lead.name || '',
          lead.phone || ''
        ]]
      );

      console.log(`[FollowUp] Suppressed lead ${lead.id}: ${this.sanitizeEmail(lead.email)}`);
    }
  }

  sanitizeEmail(email) {
    return email ? email.replace(/(.{2}).*@/, '$1***@') : '[NO_EMAIL]';
  }
}

// Run job
const job = new FollowUpJob();
job.run().catch(error => {
  console.error('[FollowUp] Fatal error:', error);
  process.exit(1);
});
