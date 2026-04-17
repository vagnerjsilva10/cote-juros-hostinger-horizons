import 'dotenv/config.js';
import axios from 'axios';
import sgMail from '@sendgrid/mail';
import { googleSheetsClient } from '../integrations/googleSheets.js';

const SHEET_NAME = 'leads_queue';
const DEFAULT_LIMIT = 25;
const ELIGIBLE_STATUSES = new Set(['imported', 'email_error']);
const TERMINAL_EMAIL_STATUSES = new Set(['completed', 'suppressed', 'invalid_email', 'unsubscribed']);
const EMAIL_SEQUENCE = [
  {
    key: 'initial',
    subject: 'Ainda faz sentido buscar credito agora?',
    nextDelayDays: 3,
    eyebrow: 'Atualizacao de interesse',
    title: '{name}, voce ainda tem interesse em opcoes de credito?',
    intro:
      'Estamos atualizando nossa base para falar apenas com quem deseja continuar recebendo alternativas de credito com parceiros da Cote Juros.',
    body:
      'Para continuar, confirme seus dados e registre seu novo consentimento no link seguro abaixo.',
    note:
      'Essa atualizacao nao garante aprovacao. A analise depende das regras de cada parceiro e das informacoes preenchidas.',
    cta: 'Atualizar meu interesse',
  },
  {
    key: 'reminder',
    subject: 'Seu link de atualizacao ainda esta disponivel',
    nextDelayDays: 4,
    eyebrow: 'Lembrete Cote Juros',
    title: '{name}, seu link seguro ainda esta ativo',
    intro:
      'Voce recebeu um convite para atualizar seu interesse em opcoes de credito com parceiros da Cote Juros.',
    body:
      'Se esse assunto ainda faz sentido, use o link abaixo para confirmar seus dados atuais e autorizar uma nova analise de compatibilidade.',
    note:
      'O preenchimento e gratuito e nao representa promessa de aprovacao ou liberacao de credito.',
    cta: 'Continuar atualizacao',
  },
  {
    key: 'last_call',
    subject: 'Podemos encerrar seu cadastro?',
    nextDelayDays: null,
    eyebrow: 'Ultima mensagem desta sequencia',
    title: '{name}, devemos encerrar este contato?',
    intro:
      'Esta e a ultima mensagem desta sequencia de atualizacao da Cote Juros.',
    body:
      'Se voce ainda quiser receber alternativas de credito com parceiros, confirme seu interesse pelo link. Se nao fizer sentido agora, pode ignorar esta mensagem ou pedir a remocao do contato.',
    note:
      'Sem confirmacao, nao seguiremos com envio a parceiros a partir deste convite.',
    cta: 'Confirmar interesse',
  },
];

class SendReactivationEmailsJob {
  constructor() {
    this.validateEnv();
    this.spreadsheetId = process.env.GOOGLE_SHEETS_REACTIVATION_ID;
    this.apiBaseUrl = process.env.COTE_API_BASE_URL;
    this.apiToken = process.env.COTE_API_TOKEN;
    this.reactivationBaseUrl = process.env.REACTIVATION_BASE_URL || 'https://finance.cotejuros.com.br';
    this.limit = Number(process.env.REACTIVATION_EMAIL_BATCH_SIZE || DEFAULT_LIMIT);
    this.dailyLimit = Number(process.env.REACTIVATION_EMAIL_DAILY_LIMIT || 50);
    this.dryRun = process.env.REACTIVATION_EMAIL_DRY_RUN !== 'false';
    this.enabled = process.env.REACTIVATION_EMAIL_ENABLED === 'true';
    this.includeDryRunRows = process.env.REACTIVATION_EMAIL_SEND_DRY_RUN_ROWS === 'true';
    this.fromEmail = process.env.SENDGRID_FROM_EMAIL || 'relacionamento@finance.cotejuros.com.br';
    this.fromName = process.env.SENDGRID_FROM_NAME || 'Cote Juros';
    this.replyTo = process.env.SENDGRID_REPLY_TO || this.fromEmail;
    this.provider = process.env.EMAIL_PROVIDER || 'sendgrid';
    this.stats = {
      eligible: 0,
      sent: 0,
      dryRun: 0,
      suppressed: 0,
      completed: 0,
      skipped: 0,
      errors: 0,
    };

    if (process.env.SENDGRID_API_KEY) {
      sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    }
  }

  validateEnv() {
    const required = [
      'GOOGLE_SHEETS_CREDENTIALS_JSON',
      'GOOGLE_SHEETS_REACTIVATION_ID',
      'COTE_API_BASE_URL',
      'COTE_API_TOKEN',
    ];
    const missing = required.filter((key) => !process.env[key]);
    if (missing.length > 0) {
      throw new Error(`Missing environment variables: ${missing.join(', ')}`);
    }
  }

  async run() {
    console.log('[SendEmails] Job started');
    console.log(`[SendEmails] mode=${this.dryRun ? 'dry_run' : 'send'} enabled=${this.enabled} provider=${this.provider}`);

    const rows = await googleSheetsClient.readRows(this.spreadsheetId, SHEET_NAME);
    const eligible = this.pickEligibleRows(rows);
    this.stats.eligible = eligible.length;
    const remainingDailyQuota = Math.max(0, this.dailyLimit - this.countEmailsSentToday(rows));

    console.log(`[SendEmails] Eligible leads: ${eligible.length}`);
    console.log(`[SendEmails] Daily quota remaining: ${remainingDailyQuota}/${this.dailyLimit}`);

    if (remainingDailyQuota <= 0) {
      console.log('[SendEmails] Daily limit reached; no emails will be sent in this run');
      return this.stats;
    }

    for (const lead of eligible.slice(0, Math.min(this.limit, remainingDailyQuota))) {
      await this.processLead(lead);
    }

    console.log(
      `[SendEmails] Summary: ${this.stats.sent} sent, ${this.stats.dryRun} dry-run, ` +
        `${this.stats.suppressed} suppressed, ${this.stats.completed} completed, ` +
        `${this.stats.skipped} skipped, ${this.stats.errors} errors`
    );
    return this.stats;
  }

  pickEligibleRows(rows) {
    const now = Date.now();
    return rows.filter((row) => {
      if (!row.email || !this.isValidEmail(row.email)) return false;
      if (!row.token && !row.reactivationUrl) return false;
      if (!ELIGIBLE_STATUSES.has(String(row.status || '').toLowerCase())) return false;

      const emailStatus = String(row.emailStatus || '').toLowerCase();
      if (TERMINAL_EMAIL_STATUSES.has(emailStatus)) return false;
      if (emailStatus === 'dry_run' && !this.includeDryRunRows) return false;

      const emailCount = Number(row.emailCount || 0);
      if (emailCount >= EMAIL_SEQUENCE.length) return false;

      const nextEmailAt = row.nextEmailAt ? new Date(row.nextEmailAt).getTime() : null;
      if (nextEmailAt && nextEmailAt > now) return false;

      return true;
    });
  }

  countEmailsSentToday(rows) {
    const today = new Date().toISOString().slice(0, 10);
    return rows.filter((row) => {
      if (!row.emailSentAt) return false;
      const emailStatus = String(row.emailStatus || '').toLowerCase();
      if (!['sent', 'completed'].includes(emailStatus)) return false;
      const sentDate = new Date(row.emailSentAt);
      if (Number.isNaN(sentDate.getTime())) return false;
      return sentDate.toISOString().slice(0, 10) === today;
    }).length;
  }

  async processLead(lead) {
    const now = new Date();
    const nowIso = now.toISOString();
    const externalLeadId = lead.externalLeadId || lead.leadId || `row-${lead._rowIndex}`;
    const sequence = this.getEmailSequence(lead);

    if (!sequence) {
      await this.markCompleted(lead, nowIso);
      return;
    }

    try {
      await this.updateLeadRow(lead, {
        emailStatus: 'checking_suppression',
        lastEmailAttemptAt: nowIso,
        emailSequence: sequence.key,
        emailError: '',
      });

      const suppression = await this.checkSuppression(lead);
      if (suppression.suppressed || suppression.emailSuppressed) {
        await this.updateLeadRow(lead, {
          emailStatus: 'suppressed',
          status: 'suppressed',
          lastEmailAttemptAt: nowIso,
          emailError: this.describeSuppression(suppression),
        });
        this.stats.suppressed++;
        console.log(`[SendEmails] Suppressed externalLeadId=${externalLeadId}`);
        return;
      }

      if (this.dryRun || !this.enabled) {
        await this.updateLeadRow(lead, {
          emailStatus: 'dry_run',
          lastEmailAttemptAt: nowIso,
          emailProvider: this.provider,
          emailSequence: sequence.key,
          unsubscribeUrl: this.buildUnsubscribeUrl(lead),
          nextEmailAt: lead.nextEmailAt || '',
        });
        this.stats.dryRun++;
        console.log(`[SendEmails] DRY RUN ${sequence.key} ${this.maskEmail(lead.email)} externalLeadId=${externalLeadId}`);
        return;
      }

      await this.sendEmail(lead, sequence);

      const nextCount = Number(lead.emailCount || 0) + 1;
      const completed = nextCount >= EMAIL_SEQUENCE.length;
      await this.updateLeadRow(lead, {
        emailStatus: completed ? 'completed' : 'sent',
        emailSentAt: nowIso,
        lastEmailAttemptAt: nowIso,
        emailProvider: this.provider,
        emailSequence: sequence.key,
        emailCount: nextCount,
        nextEmailAt: completed ? '' : this.nextEmailAt(now, sequence),
        unsubscribeUrl: this.buildUnsubscribeUrl(lead),
        emailError: '',
      });

      if (completed) this.stats.completed++;
      this.stats.sent++;
      console.log(`[SendEmails] Sent ${sequence.key} ${this.maskEmail(lead.email)} externalLeadId=${externalLeadId}`);
    } catch (error) {
      this.stats.errors++;
      const safeError = this.sanitizeError(this.formatError(error));
      await this.updateLeadRow(lead, {
        emailStatus: 'error',
        lastEmailAttemptAt: nowIso,
        nextEmailAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        emailError: safeError,
      });
      console.error(`[SendEmails] Error externalLeadId=${externalLeadId}: ${safeError}`);
    }
  }

  async markCompleted(lead, nowIso) {
    await this.updateLeadRow(lead, {
      emailStatus: 'completed',
      lastEmailAttemptAt: nowIso,
      nextEmailAt: '',
    });
    this.stats.completed++;
  }

  async checkSuppression(lead) {
    const response = await axios.post(
      `${this.apiBaseUrl}/api/reactivation/suppression/check`,
      {
        email: lead.email || undefined,
        phone: lead.phone || undefined,
        cpf: lead.cpf || undefined,
      },
      {
        headers: { Authorization: `Bearer ${this.apiToken}` },
        timeout: 30000,
      }
    );

    return response.data?.data || {};
  }

  async sendEmail(lead, sequence) {
    if (this.provider !== 'sendgrid') {
      throw new Error(`Unsupported EMAIL_PROVIDER: ${this.provider}`);
    }
    if (!process.env.SENDGRID_API_KEY) {
      throw new Error('SENDGRID_API_KEY is required when REACTIVATION_EMAIL_DRY_RUN=false');
    }

    const message = this.buildEmail(lead, sequence);
    await sgMail.send(message);
  }

  buildEmail(lead, sequence) {
    const name = this.firstName(lead.fullName || lead.name || lead.nome);
    const url = this.buildReactivationUrl(lead);
    const unsubscribeUrl = this.buildUnsubscribeUrl(lead);
    const html = this.renderHtml({ name, url, unsubscribeUrl, sequence });
    const text = this.renderText({ name, url, unsubscribeUrl, sequence });

    return {
      to: lead.email,
      from: { email: this.fromEmail, name: this.fromName },
      replyTo: this.replyTo,
      subject: sequence.subject,
      html,
      text,
      trackingSettings: {
        clickTracking: { enable: true, enableText: true },
        openTracking: { enable: true },
      },
      customArgs: {
        externalLeadId: String(lead.externalLeadId || ''),
        batchId: String(lead.batchId || ''),
        leadId: String(lead.leadId || ''),
        campaign: 'reactivation_credit',
        sequence: sequence.key,
      },
    };
  }

  getEmailSequence(lead) {
    const count = Number(lead.emailCount || 0);
    return EMAIL_SEQUENCE[count] || null;
  }

  nextEmailAt(date, sequence) {
    if (!sequence.nextDelayDays) return '';
    return new Date(date.getTime() + sequence.nextDelayDays * 24 * 60 * 60 * 1000).toISOString();
  }

  renderHtml({ name, url, unsubscribeUrl, sequence }) {
    const title = sequence.title.replace('{name}', this.escapeHtml(name));
    return `
      <div style="margin:0;padding:0;background:#f6f7f9;font-family:Arial,sans-serif;color:#162033;">
        <div style="max-width:620px;margin:0 auto;padding:28px 18px;">
          <div style="background:#ffffff;border:1px solid #e5e7eb;border-radius:8px;padding:28px;">
            <p style="margin:0 0 18px;font-size:15px;color:#526070;">${this.escapeHtml(sequence.eyebrow)}</p>
            <h1 style="margin:0 0 18px;font-size:24px;line-height:1.25;color:#111827;">${title}</h1>
            <p style="margin:0 0 14px;font-size:16px;line-height:1.55;">${this.escapeHtml(sequence.intro)}</p>
            <p style="margin:0 0 14px;font-size:16px;line-height:1.55;">${this.escapeHtml(sequence.body)}</p>
            <p style="margin:0 0 22px;font-size:14px;line-height:1.5;color:#526070;">${this.escapeHtml(sequence.note)}</p>
            <div style="margin:28px 0;text-align:center;">
              <a href="${this.escapeHtml(url)}" style="display:inline-block;background:#0f766e;color:#ffffff;text-decoration:none;border-radius:8px;padding:14px 22px;font-size:16px;font-weight:700;">${this.escapeHtml(sequence.cta)}</a>
            </div>
            <p style="margin:0 0 12px;font-size:13px;line-height:1.5;color:#6b7280;">Se nao fizer sentido agora, tudo bem. Voce pode ignorar esta mensagem ou solicitar a remocao do contato.</p>
            <p style="margin:0;font-size:12px;line-height:1.5;color:#6b7280;">
              <a href="${this.escapeHtml(unsubscribeUrl)}" style="color:#0f766e;">Nao quero mais receber contatos</a>
            </p>
          </div>
        </div>
      </div>
    `;
  }

  renderText({ name, url, unsubscribeUrl, sequence }) {
    return [
      sequence.title.replace('{name}', name),
      '',
      sequence.intro,
      '',
      sequence.body,
      '',
      sequence.note,
      '',
      `${sequence.cta}: ${url}`,
      '',
      `Nao quero mais receber contatos: ${unsubscribeUrl}`,
    ].join('\n');
  }

  buildReactivationUrl(lead) {
    if (lead.reactivationUrl) return lead.reactivationUrl;
    return `${this.reactivationBaseUrl}/r/${lead.token}`;
  }

  buildUnsubscribeUrl(lead) {
    return `${this.buildReactivationUrl(lead)}?optout=1`;
  }

  describeSuppression(suppression) {
    const matches = suppression.matches || [];
    const scopes = matches.map((item) => item.scope).filter(Boolean);
    return scopes.length > 0 ? `suppressed:${scopes.join(',')}` : 'suppressed';
  }

  async updateLeadRow(lead, updates) {
    await googleSheetsClient.updateRow(this.spreadsheetId, SHEET_NAME, lead._rowIndex, updates);
  }

  isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || ''));
  }

  firstName(name) {
    const cleaned = String(name || 'Ola').trim();
    return cleaned.split(/\s+/)[0] || 'Ola';
  }

  escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  maskEmail(email) {
    return String(email || '').replace(/^(.{2}).*(@.*)$/, '$1***$2');
  }

  formatError(error) {
    if (error.code && error.response?.body) {
      const details = Array.isArray(error.response.body.errors)
        ? error.response.body.errors.map((item) => item.message).filter(Boolean).join('; ')
        : JSON.stringify(error.response.body);
      return `SendGrid ${error.code}: ${details || error.message}`;
    }
    if (!error.response) return error.message;
    const body = error.response.data;
    const message = body?.error || body?.message || error.message;
    return `HTTP ${error.response.status}: ${message}`;
  }

  sanitizeError(message) {
    return String(message || '')
      .replace(/Bearer\s+\S+/g, 'Bearer [REDACTED]')
      .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[EMAIL]')
      .slice(0, 240);
  }
}

const job = new SendReactivationEmailsJob();
job.run().catch((error) => {
  console.error('[SendEmails] Fatal error:', error.message);
  process.exit(1);
});
