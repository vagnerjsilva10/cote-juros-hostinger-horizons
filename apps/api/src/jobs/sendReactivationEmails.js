import 'dotenv/config.js';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import axios from 'axios';
import { googleSheetsClient } from '../integrations/googleSheets.js';
import { getPrisma } from '../lib/prisma.js';
import { buildBrevoTransactionalEmailPayload, sendBrevoTransactionalEmail } from '../services/brevoEmailService.js';
import { CampaignTrackingService } from '../services/campaignTrackingService.js';

const SHEET_NAME = 'leads_queue';
const DEFAULT_LIMIT = 25;
const CAMPAIGN_SLUG = process.env.REACTIVATION_EMAIL_CAMPAIGN_SLUG || 'reactivation-credit-main';
const ELIGIBLE_STATUSES = new Set(['imported', 'email_error']);
const TERMINAL_EMAIL_STATUSES = new Set(['completed', 'suppressed', 'invalid_email', 'unsubscribed']);
const REAL_RECIPIENTS_GUARD_ENV = 'REACTIVATION_ALLOW_REAL_RECIPIENTS';
const FALLBACK_SEQUENCE = [
  {
    key: 'initial',
    templateSlot: 'initialTemplateId',
    nextDelayDays: 3,
    subject: 'Ainda faz sentido buscar credito agora?',
    preheader: 'Atualize seu interesse antes de receber novas oportunidades.',
    html: '<p>Ola {{firstName}},</p><p>Estamos revisando cadastros antigos da Cote Juros. Se ainda fizer sentido receber opcoes de credito, confirme seu interesse no link abaixo.</p><p><a href="{{reactivationUrl}}">Atualizar meu interesse</a></p>',
    text: 'Ola {{firstName}}, estamos revisando cadastros antigos da Cote Juros. Confirme seu interesse: {{reactivationUrl}}',
  },
  {
    key: 'reminder',
    templateSlot: 'reminderTemplateId',
    nextDelayDays: 4,
    subject: 'Seu link de atualizacao ainda esta disponivel',
    preheader: 'Seu link seguro continua disponivel por tempo limitado.',
    html: '<p>Ola {{firstName}},</p><p>Seu link seguro ainda esta ativo para atualizar seu interesse em opcoes de credito.</p><p><a href="{{reactivationUrl}}">Continuar atualizacao</a></p>',
    text: 'Ola {{firstName}}, seu link seguro ainda esta ativo para atualizar seu interesse: {{reactivationUrl}}',
  },
  {
    key: 'last_call',
    templateSlot: 'lastCallTemplateId',
    nextDelayDays: null,
    subject: 'Podemos encerrar seu cadastro?',
    preheader: 'Se voce nao tiver interesse, pode se descadastrar com um clique.',
    html: '<p>Ola {{firstName}},</p><p>Esta e a ultima mensagem desta sequencia. Se ainda quiser receber opcoes de credito da Cote Juros, confirme abaixo.</p><p><a href="{{reactivationUrl}}">Confirmar interesse</a></p>',
    text: 'Ola {{firstName}}, esta e a ultima mensagem desta sequencia. Confirme aqui: {{reactivationUrl}}',
  },
];

const nowIso = () => new Date().toISOString();

export class SendReactivationEmailsJob {
  constructor() {
    this.dryRun = process.env.REACTIVATION_EMAIL_DRY_RUN !== 'false';
    this.validateEnv();
    this.prisma = this.dryRun && !process.env.DATABASE_URL ? null : getPrisma();
    this.spreadsheetId = process.env.GOOGLE_SHEETS_REACTIVATION_ID;
    this.apiBaseUrl = process.env.COTE_API_BASE_URL;
    this.apiToken = process.env.COTE_API_TOKEN;
    this.reactivationBaseUrl = process.env.REACTIVATION_BASE_URL || 'https://www.cotejuros.com.br';
    this.limit = Number(process.env.REACTIVATION_BATCH_LIMIT || process.env.REACTIVATION_EMAIL_BATCH_SIZE || DEFAULT_LIMIT);
    this.dailyLimit = Number(process.env.REACTIVATION_EMAIL_DAILY_LIMIT || 50);
    this.enabled = process.env.REACTIVATION_EMAIL_ENABLED === 'true';
    this.includeDryRunRows = process.env.REACTIVATION_EMAIL_SEND_DRY_RUN_ROWS === 'true';
    this.testEmail = this.normalizeEmail(process.env.REACTIVATION_TEST_EMAIL);
    this.testMode = Boolean(this.testEmail);
    this.testRunId = this.testMode ? `${Date.now()}-${crypto.randomBytes(4).toString('hex')}` : null;
    this.fromEmail = process.env.BREVO_SENDER_EMAIL || 'relacionamento@finance.cotejuros.com.br';
    this.fromName = process.env.BREVO_SENDER_NAME || 'Cote Juros';
    this.replyToEmail = process.env.BREVO_REPLY_TO_EMAIL || process.env.BREVO_SENDER_EMAIL || this.fromEmail;
    this.replyToName = process.env.BREVO_REPLY_TO_NAME || this.fromName;
    this.provider = process.env.EMAIL_PROVIDER || 'brevo';
    this.campaign = null;
    this.templates = new Map();
    this.jobRun = null;
    this.stats = {
      eligible: 0,
      sent: 0,
      dryRun: 0,
      suppressed: 0,
      completed: 0,
      skipped: 0,
      errors: 0,
    };

    if (this.testMode && !this.isValidEmail(this.testEmail)) {
      throw new Error('REACTIVATION_TEST_EMAIL must be a valid email address');
    }
    this.applyTestModeLimits();
    if (!this.dryRun && !this.testMode && process.env[REAL_RECIPIENTS_GUARD_ENV] !== 'true') {
      throw new Error(
        `Real recipient sends are blocked. Set REACTIVATION_TEST_EMAIL for controlled tests or ${REAL_RECIPIENTS_GUARD_ENV}=true for an approved campaign send.`
      );
    }
    if (!this.dryRun && !process.env.BREVO_API_KEY) {
      throw new Error('BREVO_API_KEY is required when REACTIVATION_EMAIL_DRY_RUN=false');
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
    console.log(
      `[SendEmails] mode=${this.dryRun ? 'dry_run' : 'send'} enabled=${this.enabled} ` +
        `provider=${this.provider} test_mode=${this.testMode}`
    );
    this.jobRun = await this.startJobRun();

    try {
      await this.loadCampaign();
      const rows = await googleSheetsClient.readRows(this.spreadsheetId, SHEET_NAME);
      const eligible = this.pickEligibleRows(rows);
      this.stats.eligible = eligible.length;
      const remainingDailyQuota = this.testMode
        ? Math.min(this.limit, this.dailyLimit)
        : Math.max(0, this.dailyLimit - await this.countEmailsSentToday(rows));

      console.log(`[SendEmails] Campaign=${this.campaign?.slug || 'fallback'} dailyLimit=${this.dailyLimit} batchSize=${this.limit}`);
      console.log(`[SendEmails] Eligible leads: ${eligible.length}`);
      console.log(`[SendEmails] Daily quota remaining: ${remainingDailyQuota}/${this.dailyLimit}`);
      if (this.dryRun || !this.enabled) {
        console.log('[SendEmails] Dry-run active; Brevo will not be called and lead rows will not be mutated');
      }
      if (this.testMode) {
        console.log(
          `[SendEmails] Test mode active; all sends are forced to ${this.maskEmail(this.testEmail)} ` +
            `and lead rows will not be mutated; testRunId=${this.testRunId}`
        );
      }

      if (!this.campaign?.isActive || this.campaign?.status !== 'active') {
        console.log('[SendEmails] Campaign is not active; no emails will be sent');
        await this.finishJobRun('success');
        return this.stats;
      }

      if (remainingDailyQuota <= 0) {
        console.log('[SendEmails] Daily limit reached; no emails will be sent in this run');
        await this.finishJobRun('success');
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
      await this.finishJobRun(this.stats.errors > 0 ? 'partial_success' : 'success');
      return this.stats;
    } catch (error) {
      await this.finishJobRun('failed', error);
      throw error;
    }
  }

  async startJobRun() {
    if (this.dryRun || !this.prisma) {
      return null;
    }
    return this.prisma.reactivationAutomationJobRun.create({
      data: {
        jobName: 'send_reactivation_emails',
        status: 'running',
        triggerSource: process.env.GITHUB_ACTIONS ? 'github_actions' : 'local',
        metadata: {
          dryRun: this.dryRun,
          enabled: this.enabled,
          provider: this.provider,
          testMode: this.testMode,
          testRecipient: this.testMode ? this.maskEmail(this.testEmail) : null,
          campaignSlug: CAMPAIGN_SLUG,
        },
      },
    });
  }

  async finishJobRun(status, error = null) {
    if (!this.jobRun) return;
    const finishedAt = new Date();
    await this.prisma.reactivationAutomationJobRun.update({
      where: { id: this.jobRun.id },
      data: {
        status,
        finishedAt,
        durationMs: finishedAt.getTime() - this.jobRun.startedAt.getTime(),
        processedCount: this.stats.eligible,
        successCount: this.stats.sent + this.stats.dryRun + this.stats.suppressed + this.stats.completed,
        errorCount: this.stats.errors,
        errorMessage: error ? this.sanitizeError(error.message) : null,
        metadata: {
          ...this.jobRun.metadata,
          stats: this.stats,
        },
      },
    });
  }

  async loadCampaign() {
    try {
      this.campaign = this.prisma
        ? await this.prisma.reactivationEmailCampaign.findUnique({
            where: { slug: CAMPAIGN_SLUG },
          })
        : null;
    } catch (error) {
      if (!this.dryRun) throw error;
      console.warn(`[SendEmails] Dry-run could not load campaign from database; using fallback campaign: ${this.sanitizeError(error.message)}`);
      this.campaign = null;
    }

    if (!this.campaign) {
      console.warn(`[SendEmails] Campaign ${CAMPAIGN_SLUG} not found; using env fallback limits/templates`);
      this.campaign = {
        id: null,
        slug: CAMPAIGN_SLUG,
        status: 'active',
        isActive: true,
        dailyLimit: this.dailyLimit,
        batchSize: this.limit,
      };
      return;
    }

    this.dailyLimit = Number(this.campaign.dailyLimit || this.dailyLimit);
    this.limit = Number(this.campaign.batchSize || this.limit);
    this.applyTestModeLimits();
    const ids = [
      this.campaign.initialTemplateId,
      this.campaign.reminderTemplateId,
      this.campaign.lastCallTemplateId,
    ].filter(Boolean);
    const templates = ids.length > 0
      ? await this.prisma.reactivationEmailTemplate.findMany({ where: { id: { in: ids } } })
      : [];
    this.templates = new Map(templates.map((template) => [template.id, template]));
  }

  applyTestModeLimits() {
    if (!this.testMode) return;
    const requestedLimit = Number(process.env.REACTIVATION_BATCH_LIMIT || process.env.REACTIVATION_EMAIL_BATCH_SIZE || this.limit || 1);
    const requestedDailyLimit = Number(process.env.REACTIVATION_EMAIL_DAILY_LIMIT || this.dailyLimit || 1);
    this.limit = Math.min(Math.max(1, Number(this.limit) || 1), Math.max(1, requestedLimit), 5);
    this.dailyLimit = Math.min(Math.max(1, Number(this.dailyLimit) || 1), Math.max(1, requestedDailyLimit), 5);
  }

  pickEligibleRows(rows) {
    const now = Date.now();
    return rows.filter((row) => {
      if (!row.email || !this.isValidEmail(row.email)) return false;
      if (!row.token && !row.reactivationUrl) return false;
      if (!ELIGIBLE_STATUSES.has(String(row.status || '').toLowerCase())) return false;
      if (this.isRevokedOrOptedOut(row)) return false;

      const emailStatus = String(row.emailStatus || '').toLowerCase();
      if (TERMINAL_EMAIL_STATUSES.has(emailStatus)) return false;
      if (emailStatus === 'dry_run' && !this.includeDryRunRows) return false;

      const emailCount = Number(row.emailCount || 0);
      if (emailCount >= FALLBACK_SEQUENCE.length) return false;

      const nextEmailAt = row.nextEmailAt ? new Date(row.nextEmailAt).getTime() : null;
      if (nextEmailAt && nextEmailAt > now) return false;

      return true;
    });
  }

  async countEmailsSentToday(rows) {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
    const dbCount = this.campaign?.id
      ? await this.prisma.reactivationEmailMessage.count({
          where: {
            campaignId: this.campaign.id,
            sentAt: { gte: today, lt: tomorrow },
          },
        })
      : 0;
    const sheetCount = rows.filter((row) => {
      if (!row.emailSentAt) return false;
      const emailStatus = String(row.emailStatus || '').toLowerCase();
      if (!['sent', 'completed'].includes(emailStatus)) return false;
      const sentDate = new Date(row.emailSentAt);
      if (Number.isNaN(sentDate.getTime())) return false;
      return sentDate.toISOString().slice(0, 10) === today.toISOString().slice(0, 10);
    }).length;

    return Math.max(dbCount, sheetCount);
  }

  async processLead(lead) {
    const currentIso = nowIso();
    const externalLeadId = lead.externalLeadId || lead.leadId || `row-${lead._rowIndex}`;
    const sequence = this.getEmailSequence(lead);

    if (!sequence) {
      if (this.dryRun || !this.enabled) {
        this.stats.completed++;
      } else {
        await this.markCompleted(lead, currentIso);
      }
      return;
    }

    try {
      if (this.dryRun || !this.enabled) {
        const email = this.buildEmail(lead, sequence, null);
        const validation = this.validateDryRunEmail(email);
        this.stats.dryRun++;
        console.log(
          `[SendEmails] DRY RUN ${sequence.key} ${this.maskEmail(this.recipientEmailForLead(lead))} ` +
            `externalLeadId=${externalLeadId} valid=${validation.valid}`
        );
        if (this.stats.dryRun <= 3) {
          console.log(`[SendEmails] DRY RUN payload example=${JSON.stringify(this.sanitizeBrevoPayload(email.brevoPayload))}`);
        }
        return;
      }

      if (!this.testMode) {
        await this.updateLeadRow(lead, {
          emailStatus: 'checking_suppression',
          lastEmailAttemptAt: currentIso,
          emailSequence: sequence.key,
          emailError: '',
        });

        const suppression = await this.checkSuppression(lead);
        if (suppression.suppressed || suppression.emailSuppressed) {
          await this.markSuppressed(lead, suppression, currentIso);
          console.log(`[SendEmails] Suppressed externalLeadId=${externalLeadId}`);
          return;
        }
      }

      const execution = this.testMode ? null : await this.ensureFlowExecution(lead);
      const messageRecord = await this.createMessageRecord(lead, sequence, execution);
      const sendResult = await this.sendEmail(lead, sequence, messageRecord);
      await this.markMessageSent(messageRecord, sendResult);

      const nextCount = Number(lead.emailCount || 0) + 1;
      const completed = nextCount >= FALLBACK_SEQUENCE.length;
      if (!this.testMode) {
        await this.updateLeadRow(lead, {
          emailStatus: completed ? 'completed' : 'sent',
          emailSentAt: currentIso,
          lastEmailAttemptAt: currentIso,
          emailProvider: this.provider,
          emailSequence: sequence.key,
          emailCount: nextCount,
          nextEmailAt: completed ? '' : this.nextEmailAt(new Date(), sequence),
          unsubscribeUrl: this.buildUnsubscribeUrl(lead),
          emailError: '',
        });

        await this.markFlowStepCompleted(execution, sequence, messageRecord);
      }

      if (completed && !this.testMode) this.stats.completed++;
      this.stats.sent++;
      console.log(
        `[SendEmails] Sent status=${sendResult.statusCode || 'unknown'} provider=${this.provider} ` +
          `messageId=${sendResult.providerMessageId || 'missing'} test_mode=${this.testMode} ` +
          `recipient=${this.maskEmail(this.recipientEmailForLead(lead))} externalLeadId=${externalLeadId}`
      );
    } catch (error) {
      this.stats.errors++;
      const safeError = this.sanitizeError(this.formatError(error));
      if (!this.testMode) {
        await this.updateLeadRow(lead, {
          emailStatus: 'error',
          lastEmailAttemptAt: nowIso(),
          nextEmailAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          emailError: safeError,
        });
      }
      console.error(`[SendEmails] Error externalLeadId=${externalLeadId}: ${safeError}`);
    }
  }

  async markCompleted(lead, currentIso) {
    await this.updateLeadRow(lead, {
      emailStatus: 'completed',
      lastEmailAttemptAt: currentIso,
      nextEmailAt: '',
    });
    this.stats.completed++;
  }

  async markSuppressed(lead, suppression, currentIso) {
    await this.updateLeadRow(lead, {
      emailStatus: 'suppressed',
      status: 'suppressed',
      lastEmailAttemptAt: currentIso,
      emailError: this.describeSuppression(suppression),
    });
    if (this.campaign?.id && lead.leadId) {
      await this.prisma.reactivationEmailMessage.create({
        data: {
          leadId: lead.leadId,
          campaignId: this.campaign.id,
          sequenceKey: String(lead.emailSequence || ''),
          provider: this.provider,
          toEmailHash: this.hashEmail(lead.email),
          toEmailMasked: this.maskEmail(lead.email),
          status: 'suppressed',
          errorMessage: this.describeSuppression(suppression),
        },
      }).catch(() => null);
    }
    this.stats.suppressed++;
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

  async ensureFlowExecution(lead) {
    if (!lead.leadId || !this.campaign?.flowDefinitionId || !this.campaign?.publishedFlowVersionId) return null;
    const existing = await this.prisma.reactivationLeadFlowExecution.findFirst({
      where: {
        leadId: lead.leadId,
        campaignId: this.campaign.id,
        flowVersionId: this.campaign.publishedFlowVersionId,
        status: { in: ['active', 'waiting', 'paused'] },
      },
    });
    if (existing) return existing;

    return this.prisma.reactivationLeadFlowExecution.create({
      data: {
        leadId: lead.leadId,
        campaignId: this.campaign.id,
        flowId: this.campaign.flowDefinitionId,
        flowVersionId: this.campaign.publishedFlowVersionId,
        currentNodeKey: 'trigger',
        status: 'active',
        context: {
          externalLeadId: lead.externalLeadId || null,
          batchId: lead.batchId || null,
          source: 'send_reactivation_emails_job',
        },
      },
    });
  }

  async createMessageRecord(lead, sequence, execution) {
    const template = this.templateForSequence(sequence);
    const idempotencyKey = this.messageIdempotencyKey(lead, sequence);
    const email = this.buildEmail(lead, sequence, null);
    const record = await this.prisma.reactivationEmailMessage.upsert({
      where: { idempotencyKey },
      create: {
        leadId: this.testMode ? null : lead.leadId || null,
        campaignId: this.campaign?.id || null,
        templateId: template?.id || null,
        flowExecutionId: execution?.id || null,
        stepKey: sequence.key,
        sequenceKey: sequence.key,
        provider: this.provider,
        toEmailHash: this.hashEmail(this.recipientEmailForLead(lead)),
        toEmailMasked: this.maskEmail(this.recipientEmailForLead(lead)),
        subject: email.subject,
        status: 'sending',
        idempotencyKey,
        requestPayload: this.maskEmailPayload(email),
        scheduledAt: new Date(),
      },
      update: {},
    });

    if (record.status !== 'queued' && record.status !== 'sending') {
      throw new Error(`Email already processed for idempotencyKey=${idempotencyKey}`);
    }
    return record;
  }

  async sendEmail(lead, sequence, messageRecord) {
    if (this.provider !== 'brevo') {
      throw new Error(`Unsupported EMAIL_PROVIDER: ${this.provider}`);
    }

    const destinationUrl = this.buildReactivationUrl(lead);
    const ctaClick = await CampaignTrackingService.ensureEmailCtaClick({
      lead,
      campaign: this.campaign,
      messageRecord,
      sequence,
      destinationUrl,
      fallbackUrl: destinationUrl,
    });
    const message = this.buildEmail(lead, sequence, messageRecord, ctaClick);
    await this.prisma.reactivationEmailMessage.update({
      where: { id: messageRecord.id },
      data: { requestPayload: this.maskEmailPayload(message) },
    });
    return sendBrevoTransactionalEmail(message.brevoRequest);
  }

  async markMessageSent(messageRecord, sendResult) {
    const sentAt = new Date();
    await this.prisma.reactivationEmailMessage.update({
      where: { id: messageRecord.id },
      data: {
        status: 'sent',
        sentAt,
        providerMessageId: sendResult.providerMessageId,
        responsePayload: {
          statusCode: sendResult.statusCode,
          providerMessageId: sendResult.providerMessageId,
          test_mode: this.testMode,
          ...(sendResult.responsePayload || {}),
        },
      },
    });
    await this.prisma.reactivationEmailMessageEvent.create({
      data: {
        messageId: messageRecord.id,
        leadId: messageRecord.leadId,
        campaignId: messageRecord.campaignId,
        eventType: 'sent',
        provider: this.provider,
        providerEventId: `sent-${messageRecord.id}`,
        providerMessageId: sendResult.providerMessageId,
        emailHash: messageRecord.toEmailHash,
        rawPayload: {
          statusCode: sendResult.statusCode,
          providerMessageId: sendResult.providerMessageId,
          test_mode: this.testMode,
        },
        signatureVerified: true,
        occurredAt: sentAt,
      },
    });
  }

  async markFlowStepCompleted(execution, sequence, messageRecord) {
    if (!execution) return;
    const node = await this.prisma.reactivationFlowNode.findFirst({
      where: {
        flowVersionId: execution.flowVersionId,
        nodeKey: sequence.key,
      },
    });
    await this.prisma.reactivationFlowExecutionStep.create({
      data: {
        executionId: execution.id,
        leadId: execution.leadId,
        flowNodeId: node?.id || null,
        nodeKey: sequence.key,
        nodeType: 'send_email',
        status: 'completed',
        input: { sequenceKey: sequence.key },
        output: { messageId: messageRecord.id },
        startedAt: messageRecord.scheduledAt || new Date(),
        completedAt: new Date(),
      },
    });
    await this.prisma.reactivationLeadFlowExecution.update({
      where: { id: execution.id },
      data: {
        currentNodeKey: sequence.nextDelayDays ? `wait_${sequence.nextDelayDays}_days` : 'completed',
        status: sequence.nextDelayDays ? 'waiting' : 'completed',
        waitingUntil: sequence.nextDelayDays ? new Date(Date.now() + sequence.nextDelayDays * 24 * 60 * 60 * 1000) : null,
        completedAt: sequence.nextDelayDays ? null : new Date(),
      },
    });
  }

  buildEmail(lead, sequence, messageRecord, ctaClick = null) {
    const template = this.templateForSequence(sequence);
    const variables = this.templateVariables(lead, ctaClick);
    const subject = this.renderTemplate(template?.subject || sequence.subject, variables);
    const preheader = this.renderTemplate(template?.preheader || sequence.preheader || '', variables);
    const html = this.withComplianceHtml(this.renderTemplate(template?.html || sequence.html, variables), variables, preheader);
    const text = this.withComplianceText(this.renderTemplate(template?.text || sequence.text, variables), variables);
    const recipientEmail = this.recipientEmailForLead(lead);
    const recipientName = this.testMode ? 'Teste Cote Juros' : variables.fullName;
    const headers = this.buildEmailHeaders(variables);

    return {
      to: recipientEmail,
      name: recipientName,
      subject,
      htmlContent: html,
      textContent: text,
      brevoRequest: {
        to: recipientEmail,
        name: recipientName,
        subject,
        htmlContent: html,
        textContent: text,
        senderName: this.fromName,
        senderEmail: this.fromEmail,
        replyTo: { email: this.replyToEmail, name: this.replyToName },
        headers,
        tags: ['reactivation', sequence.key],
        params: {
          messageId: String(messageRecord?.id || ''),
          externalLeadId: String(lead.externalLeadId || ''),
          batchId: String(lead.batchId || ''),
          leadId: String(lead.leadId || ''),
          campaignId: String(this.campaign?.id || ''),
          campaign: String(this.campaign?.slug || CAMPAIGN_SLUG),
          sequence: sequence.key,
          test_mode: this.testMode,
          ctaClickId: String(ctaClick?.clickId || ''),
        },
      },
      brevoPayload: buildBrevoTransactionalEmailPayload({
        to: recipientEmail,
        name: recipientName,
        subject,
        htmlContent: html,
        textContent: text,
        senderName: this.fromName,
        senderEmail: this.fromEmail,
        replyTo: { email: this.replyToEmail, name: this.replyToName },
        headers,
        tags: ['reactivation', sequence.key],
        params: {
          messageId: String(messageRecord?.id || ''),
          externalLeadId: String(lead.externalLeadId || ''),
          batchId: String(lead.batchId || ''),
          leadId: String(lead.leadId || ''),
          campaignId: String(this.campaign?.id || ''),
          campaign: String(this.campaign?.slug || CAMPAIGN_SLUG),
          sequence: sequence.key,
          test_mode: this.testMode,
          ctaClickId: String(ctaClick?.clickId || ''),
        },
      }),
      customArgs: {
        messageId: String(messageRecord?.id || ''),
        externalLeadId: String(lead.externalLeadId || ''),
        batchId: String(lead.batchId || ''),
        leadId: String(lead.leadId || ''),
        campaignId: String(this.campaign?.id || ''),
        campaign: String(this.campaign?.slug || CAMPAIGN_SLUG),
        sequence: sequence.key,
        test_mode: String(this.testMode),
        ctaClickId: String(ctaClick?.clickId || ''),
      },
    };
  }

  templateForSequence(sequence) {
    const templateId = this.campaign?.[sequence.templateSlot];
    return templateId ? this.templates.get(templateId) : null;
  }

  templateVariables(lead, ctaClick = null) {
    const firstName = this.firstName(lead.fullName || lead.name || lead.nome);
    const directReactivationUrl = this.buildReactivationUrl(lead);
    const reactivationUrl = ctaClick
      ? CampaignTrackingService.buildGoUrl(ctaClick.clickId)
      : directReactivationUrl;
    const unsubscribeUrl = this.buildUnsubscribeUrl(lead);
    return {
      firstName,
      name: firstName,
      fullName: lead.fullName || lead.name || lead.nome || firstName,
      reactivationUrl,
      directReactivationUrl,
      unsubscribeUrl,
    };
  }

  renderTemplate(template, variables) {
    return String(template || '').replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, key) => {
      return variables[key] ?? '';
    });
  }

  getEmailSequence(lead) {
    const count = Number(lead.emailCount || 0);
    return FALLBACK_SEQUENCE[count] || null;
  }

  nextEmailAt(date, sequence) {
    if (!sequence.nextDelayDays) return '';
    return new Date(date.getTime() + sequence.nextDelayDays * 24 * 60 * 60 * 1000).toISOString();
  }

  buildReactivationUrl(lead) {
    if (lead.reactivationUrl) return lead.reactivationUrl;
    return `${this.reactivationBaseUrl}/r/${lead.token}`;
  }

  buildUnsubscribeUrl(lead) {
    if (!lead.token) return `${this.buildReactivationUrl(lead)}?optout=1`;
    return `${this.apiBaseUrl}/api/reactivation/unsubscribe/${encodeURIComponent(lead.token)}?scope=unsubscribe_email`;
  }

  buildEmailHeaders(variables) {
    const unsubscribeUrl = variables.unsubscribeUrl;
    return {
      'List-Unsubscribe': `<${unsubscribeUrl}>`,
      'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
    };
  }

  withComplianceHtml(html, variables, preheader = '') {
    const hiddenPreheader = preheader
      ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent">${preheader}</div>`
      : '';
    const footer = `
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0" />
      <p style="font-size:12px;line-height:18px;color:#475569;margin:0">
        Voce recebeu este email porque seu cadastro consta na base da Cote Juros para atualizacao de interesse.
        Se nao quiser mais receber emails de reativacao, <a href="${variables.unsubscribeUrl}">descadastre-se aqui</a>.
      </p>
    `;
    return `${hiddenPreheader}${html}${footer}`;
  }

  withComplianceText(text, variables) {
    return `${text}\n\nVoce recebeu este email porque seu cadastro consta na base da Cote Juros para atualizacao de interesse.\nDescadastro: ${variables.unsubscribeUrl}`;
  }

  isRevokedOrOptedOut(row) {
    const status = String(row.status || '').toLowerCase();
    const emailStatus = String(row.emailStatus || '').toLowerCase();
    const optOutReason = String(row.optOutReason || row.opt_out_reason || '').trim();
    return Boolean(
      ['revoked', 'suppressed', 'rejected'].includes(status) ||
      ['unsubscribed', 'suppressed', 'spam_reported', 'bounce', 'bounced'].includes(emailStatus) ||
      row.consentRevokedAt ||
      row.tokenRevokedAt ||
      optOutReason
    );
  }

  describeSuppression(suppression) {
    const matches = suppression.matches || [];
    const scopes = matches.map((item) => item.scope).filter(Boolean);
    return scopes.length > 0 ? `suppressed:${scopes.join(',')}` : 'suppressed';
  }

  async updateLeadRow(lead, updates) {
    await googleSheetsClient.updateRow(this.spreadsheetId, SHEET_NAME, lead._rowIndex, updates);
  }

  messageIdempotencyKey(lead, sequence) {
    const base = [
      this.campaign?.id || CAMPAIGN_SLUG,
      this.testMode ? `test:${this.testEmail}:${this.testRunId}` : 'live',
      lead.leadId || lead.externalLeadId || `row-${lead._rowIndex}`,
      sequence.key,
      Number(lead.emailCount || 0),
    ].join(':');
    return crypto.createHash('sha256').update(base).digest('hex');
  }

  hashEmail(email) {
    if (!email) return null;
    const secret = process.env.REACTIVATION_PII_HASH_SECRET || process.env.REACTIVATION_TOKEN_SECRET || 'local-dev-secret';
    return crypto.createHmac('sha256', secret).update(String(email).trim().toLowerCase()).digest('hex');
  }

  maskEmailPayload(email) {
    return {
      to: this.maskEmail(email.to),
      subject: email.subject,
      customArgs: email.customArgs,
    };
  }

  validateDryRunEmail(email) {
    if (!this.isValidEmail(email.to)) {
      throw new Error('Invalid recipient email');
    }
    if (!email.subject || !email.htmlContent || !email.textContent) {
      throw new Error('Invalid Brevo payload: subject, htmlContent and textContent are required');
    }
    return { valid: true };
  }

  sanitizeBrevoPayload(payload) {
    return {
      ...payload,
      sender: {
        name: payload.sender?.name,
        email: this.maskEmail(payload.sender?.email),
      },
      to: (payload.to || []).map((recipient) => ({
        ...recipient,
        email: this.maskEmail(recipient.email),
      })),
      htmlContent: '[HTML_REDACTED]',
      textContent: '[TEXT_REDACTED]',
    };
  }

  isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || ''));
  }

  normalizeEmail(email) {
    return String(email || '').trim().toLowerCase();
  }

  recipientEmailForLead(lead) {
    return this.testMode ? this.testEmail : lead.email;
  }

  firstName(name) {
    const cleaned = String(name || 'Ola').trim();
    return cleaned.split(/\s+/)[0] || 'Ola';
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

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const job = new SendReactivationEmailsJob();
  job.run().catch((error) => {
    console.error('[SendEmails] Fatal error:', error.message);
    process.exit(1);
  });
}
