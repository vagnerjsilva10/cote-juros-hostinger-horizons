import crypto from 'node:crypto';
import sendgridEventWebhook from '@sendgrid/eventwebhook';
import sgMail from '@sendgrid/mail';
import { getPrisma } from '../lib/prisma.js';
import { CampaignTrackingService } from './campaignTrackingService.js';

const { EventWebhook, EventWebhookHeader } = sendgridEventWebhook;

const DEFAULT_FLOW = {
  nodes: [
    { key: 'trigger', type: 'trigger_lead_entry', label: 'Lead elegivel', position: { x: 80, y: 180 }, config: { source: 'leads_queue.imported' } },
    { key: 'initial', type: 'send_email', label: 'Enviar initial', position: { x: 320, y: 180 }, config: { sequenceKey: 'initial', templateSlot: 'initialTemplateId' } },
    { key: 'wait_3_days', type: 'delay', label: 'Esperar 3 dias', position: { x: 560, y: 180 }, config: { amount: 3, unit: 'days', businessHours: true } },
    { key: 'clicked_initial', type: 'condition', label: 'Clicou?', position: { x: 800, y: 180 }, config: { event: 'click', withinDays: 3 } },
    { key: 'mark_engaged', type: 'mark_status', label: 'Marcar engajado', position: { x: 1040, y: 90 }, config: { leadStatus: 'engaged' } },
    { key: 'reminder', type: 'send_email', label: 'Enviar reminder', position: { x: 1040, y: 270 }, config: { sequenceKey: 'reminder', templateSlot: 'reminderTemplateId' } },
    { key: 'wait_4_days', type: 'delay', label: 'Esperar 4 dias', position: { x: 1280, y: 270 }, config: { amount: 4, unit: 'days', businessHours: true } },
    { key: 'clicked_reminder', type: 'condition', label: 'Clicou?', position: { x: 1520, y: 270 }, config: { event: 'click', withinDays: 4 } },
    { key: 'last_call', type: 'send_email', label: 'Enviar last call', position: { x: 1760, y: 360 }, config: { sequenceKey: 'last_call', templateSlot: 'lastCallTemplateId' } },
    { key: 'wait_submit', type: 'wait_event', label: 'Aguardar submit', position: { x: 1280, y: 90 }, config: { event: 'form_submitted', timeoutDays: 3 } },
    { key: 'converted', type: 'end_flow', label: 'Finalizar convertido', position: { x: 1520, y: 90 }, config: { result: 'converted' } },
    { key: 'completed', type: 'end_flow', label: 'Finalizar completed', position: { x: 2000, y: 360 }, config: { result: 'completed' } }
  ],
  edges: [
    { key: 'e1', source: 'trigger', target: 'initial' },
    { key: 'e2', source: 'initial', target: 'wait_3_days' },
    { key: 'e3', source: 'wait_3_days', target: 'clicked_initial' },
    { key: 'e4', source: 'clicked_initial', target: 'mark_engaged', label: 'sim', condition: { clicked: true } },
    { key: 'e5', source: 'clicked_initial', target: 'reminder', label: 'nao', condition: { clicked: false } },
    { key: 'e6', source: 'mark_engaged', target: 'wait_submit' },
    { key: 'e7', source: 'wait_submit', target: 'converted', condition: { event: 'form_submitted' } },
    { key: 'e8', source: 'reminder', target: 'wait_4_days' },
    { key: 'e9', source: 'wait_4_days', target: 'clicked_reminder' },
    { key: 'e10', source: 'clicked_reminder', target: 'mark_engaged', label: 'sim', condition: { clicked: true } },
    { key: 'e11', source: 'clicked_reminder', target: 'last_call', label: 'nao', condition: { clicked: false } },
    { key: 'e12', source: 'last_call', target: 'completed' }
  ]
};

const DEFAULT_TEMPLATES = [
  {
    name: 'Reativacao initial',
    slug: 'reactivation-initial',
    subject: 'Ainda faz sentido buscar credito agora?',
    preheader: 'Atualize seus dados e confirme se deseja receber alternativas de credito.',
    text: 'Ola {{firstName}}, confirme seu interesse em opcoes de credito com parceiros da Cote Juros: {{reactivationUrl}}',
    html: '<p>Ola {{firstName}},</p><p>Confirme seu interesse em opcoes de credito com parceiros da Cote Juros.</p><p><a href="{{reactivationUrl}}">Atualizar meu interesse</a></p>',
    variables: ['firstName', 'reactivationUrl']
  },
  {
    name: 'Reativacao reminder',
    slug: 'reactivation-reminder',
    subject: 'Seu link de atualizacao ainda esta disponivel',
    preheader: 'Use seu link seguro para continuar a atualizacao.',
    text: 'Ola {{firstName}}, seu link seguro ainda esta ativo: {{reactivationUrl}}',
    html: '<p>Ola {{firstName}},</p><p>Seu link seguro ainda esta ativo.</p><p><a href="{{reactivationUrl}}">Continuar atualizacao</a></p>',
    variables: ['firstName', 'reactivationUrl']
  },
  {
    name: 'Reativacao last call',
    slug: 'reactivation-last-call',
    subject: 'Podemos encerrar seu cadastro?',
    preheader: 'Ultima mensagem desta sequencia de atualizacao.',
    text: 'Ola {{firstName}}, esta e a ultima mensagem desta sequencia. Confirme aqui: {{reactivationUrl}}',
    html: '<p>Ola {{firstName}},</p><p>Esta e a ultima mensagem desta sequencia.</p><p><a href="{{reactivationUrl}}">Confirmar interesse</a></p>',
    variables: ['firstName', 'reactivationUrl']
  }
];

const slugify = (value) => String(value || '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '')
  .slice(0, 80);

const hashEmail = (email) => {
  if (!email) return null;
  const secret = process.env.REACTIVATION_PII_HASH_SECRET || process.env.REACTIVATION_TOKEN_SECRET || 'local-dev-secret';
  return crypto.createHmac('sha256', secret).update(String(email).trim().toLowerCase()).digest('hex');
};

const maskEmail = (email) => String(email || '').replace(/^(.{2}).*(@.*)$/, '$1***$2');

const actorFromReq = (req) => req?.adminUser?.email || req?.headers?.['x-admin-user'] || req?.headers?.['x-github-actor'] || 'admin';

const getIp = (req) => String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '').split(',')[0] || null;

const audit = async (prisma, req, action, entityType, entityId, after, before = null, metadata = null) => {
  await prisma.reactivationAdminAuditLog.create({
    data: {
      actor: actorFromReq(req),
      action,
      entityType,
      entityId,
      before,
      after,
      metadata,
      ipAddress: req ? getIp(req) : null,
      userAgent: req?.headers?.['user-agent'] || null
    }
  });
};

const renderTemplate = (template, variables) => String(template || '').replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, key) => {
  return variables[key] ?? '';
});

export class ReactivationAdminService {
  static validateFlow(definition = {}) {
    const nodes = Array.isArray(definition.nodes) ? definition.nodes : [];
    const edges = Array.isArray(definition.edges) ? definition.edges : [];
    const errors = [];
    const nodeKeys = new Set();

    for (const node of nodes) {
      if (!node.key) errors.push({ path: 'nodes', message: 'Todo no precisa de key.' });
      if (node.key && nodeKeys.has(node.key)) errors.push({ path: `nodes.${node.key}`, message: 'Node key duplicada.' });
      if (node.key) nodeKeys.add(node.key);
      if (!node.type) errors.push({ path: `nodes.${node.key || '?'}.type`, message: 'Tipo do no obrigatorio.' });
      if (node.type === 'send_email' && !node.config?.sequenceKey && !node.config?.templateId && !node.config?.templateSlot) {
        errors.push({ path: `nodes.${node.key}.config`, message: 'No de email precisa de sequenceKey, templateId ou templateSlot.' });
      }
      if (node.type === 'delay' && (!node.config?.amount || !node.config?.unit)) {
        errors.push({ path: `nodes.${node.key}.config`, message: 'Delay precisa de amount e unit.' });
      }
    }

    const triggerCount = nodes.filter((node) => node.type === 'trigger_lead_entry').length;
    const endCount = nodes.filter((node) => node.type === 'end_flow').length;
    if (triggerCount !== 1) errors.push({ path: 'nodes', message: 'O fluxo precisa de exatamente um trigger de entrada.' });
    if (endCount < 1) errors.push({ path: 'nodes', message: 'O fluxo precisa de pelo menos um encerramento.' });

    for (const edge of edges) {
      if (!edge.source || !edge.target) errors.push({ path: `edges.${edge.key || '?'}`, message: 'Edge precisa de source e target.' });
      if (edge.source && !nodeKeys.has(edge.source)) errors.push({ path: `edges.${edge.key || '?'}.source`, message: `Source inexistente: ${edge.source}` });
      if (edge.target && !nodeKeys.has(edge.target)) errors.push({ path: `edges.${edge.key || '?'}.target`, message: `Target inexistente: ${edge.target}` });
      if (edge.source === edge.target) errors.push({ path: `edges.${edge.key || '?'}`, message: 'Self-loop nao permitido.' });
    }

    const adjacency = new Map(nodes.map((node) => [node.key, []]));
    edges.forEach((edge) => {
      if (adjacency.has(edge.source)) adjacency.get(edge.source).push(edge.target);
    });
    const visiting = new Set();
    const visited = new Set();
    const hasCycle = (key) => {
      if (visiting.has(key)) return true;
      if (visited.has(key)) return false;
      visiting.add(key);
      for (const next of adjacency.get(key) || []) {
        if (hasCycle(next)) return true;
      }
      visiting.delete(key);
      visited.add(key);
      return false;
    };
    for (const key of adjacency.keys()) {
      if (hasCycle(key)) {
        errors.push({ path: 'edges', message: 'Loop detectado. Loops precisam ser modelados com wait_event/delay e saida explicita.' });
        break;
      }
    }

    return { valid: errors.length === 0, errors };
  }

  static async dashboard() {
    const prisma = getPrisma();
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);

    const [
      leadsInQueue,
      activeCampaigns,
      activeFlows,
      pausedFlows,
      sentToday,
      delivered,
      opens,
      clicks,
      bounces,
      spamReports,
      optOuts,
      nextMessages,
      recentJobRuns,
      reactivationKpis,
      campaignTracking
    ] = await Promise.all([
      prisma.reactivationLead.count({ where: { status: { in: ['imported', 'visited'] } } }),
      prisma.reactivationEmailCampaign.count({ where: { status: 'active', isActive: true } }),
      prisma.reactivationFlowDefinition.count({ where: { status: 'active', isActive: true } }),
      prisma.reactivationFlowDefinition.count({ where: { status: 'paused' } }),
      prisma.reactivationEmailMessage.count({ where: { sentAt: { gte: today, lt: tomorrow } } }),
      prisma.reactivationEmailMessageEvent.count({ where: { eventType: 'delivered' } }),
      prisma.reactivationEmailMessageEvent.count({ where: { eventType: 'open' } }),
      prisma.reactivationEmailMessageEvent.count({ where: { eventType: 'click' } }),
      prisma.reactivationEmailMessageEvent.count({ where: { eventType: 'bounce' } }),
      prisma.reactivationEmailMessageEvent.count({ where: { eventType: 'spamreport' } }),
      prisma.reactivationEmailMessageEvent.count({ where: { eventType: { in: ['unsubscribe', 'group_unsubscribe'] } } }),
      prisma.reactivationEmailMessage.findMany({
        where: { status: 'queued', scheduledAt: { not: null } },
        orderBy: { scheduledAt: 'asc' },
        take: 10
      }),
      prisma.reactivationAutomationJobRun.findMany({
        orderBy: { startedAt: 'desc' },
        take: 12
      }),
      this.reactivationKpiSnapshot(),
      CampaignTrackingService.dashboardSummary()
    ]);

    const dailyLimitConfig = await prisma.reactivationAdminConfig.findUnique({ where: { key: 'email.daily_limit' } });
    const dailyLimit = Number(dailyLimitConfig?.value?.limit || process.env.REACTIVATION_EMAIL_DAILY_LIMIT || 5);
    const openRate = delivered > 0 ? (opens / delivered) * 100 : 0;
    const clickRate = delivered > 0 ? (clicks / delivered) * 100 : 0;

    return {
      leadsInQueue,
      sentToday,
      delivered,
      opens,
      clicks,
      bounces,
      spamReports,
      optOuts,
      activeCampaigns,
      activeFlows,
      pausedFlows,
      dailyLimit,
      dailyLimitUsed: sentToday,
      dailyLimitRemaining: Math.max(0, dailyLimit - sentToday),
      nextMessages,
      openRate,
      clickRate,
      conversionToSubmit: reactivationKpis.conversionRates?.formRate || 0,
      conversionByCampaign: await this.conversionByCampaign(prisma),
      conversionByPartner: reactivationKpis.byPartner || [],
      estimatedRevenueCents: reactivationKpis.revenue?.estimatedRevenueCents || 0,
      campaignTracking,
      recentJobRuns
    };
  }

  static async reactivationKpiSnapshot() {
    const { ReactivationService } = await import('./reactivationService.js');
    return ReactivationService.getKpis({});
  }

  static async conversionByCampaign(prisma) {
    const campaigns = await prisma.reactivationEmailCampaign.findMany({
      take: 20,
      orderBy: { createdAt: 'desc' },
      include: { messages: true }
    });
    return campaigns.map((campaign) => {
      const messages = campaign.messages || [];
      const sent = messages.filter((message) => message.sentAt).length;
      const clicked = messages.filter((message) => message.clickedAt).length;
      return {
        id: campaign.id,
        name: campaign.name,
        slug: campaign.slug,
        sent,
        clicked,
        clickRate: sent > 0 ? (clicked / sent) * 100 : 0
      };
    });
  }

  static async listCampaigns() {
    const prisma = getPrisma();
    return prisma.reactivationEmailCampaign.findMany({ orderBy: { createdAt: 'desc' } });
  }

  static async saveCampaign(payload, req) {
    const prisma = getPrisma();
    const data = {
      name: payload.name,
      slug: payload.slug || slugify(payload.name),
      description: payload.description || null,
      status: payload.status || 'draft',
      isActive: Boolean(payload.isActive),
      startsAt: payload.startsAt ? new Date(payload.startsAt) : null,
      endsAt: payload.endsAt ? new Date(payload.endsAt) : null,
      initialTemplateId: payload.initialTemplateId || null,
      reminderTemplateId: payload.reminderTemplateId || null,
      lastCallTemplateId: payload.lastCallTemplateId || null,
      flowDefinitionId: payload.flowDefinitionId || null,
      publishedFlowVersionId: payload.publishedFlowVersionId || null,
      dailyLimit: Number(payload.dailyLimit || 5),
      batchSize: Number(payload.batchSize || 5),
      sendWindow: payload.sendWindow || null,
      exitRules: payload.exitRules || null,
      metadata: payload.metadata || null,
      updatedBy: actorFromReq(req)
    };

    const campaign = payload.id
      ? await prisma.reactivationEmailCampaign.update({ where: { id: payload.id }, data })
      : await prisma.reactivationEmailCampaign.create({ data: { ...data, createdBy: actorFromReq(req) } });
    await audit(prisma, req, payload.id ? 'campaign_updated' : 'campaign_created', 'campaign', campaign.id, campaign);
    return campaign;
  }

  static async duplicateCampaign(id, req) {
    const prisma = getPrisma();
    const source = await prisma.reactivationEmailCampaign.findUnique({ where: { id } });
    if (!source) return null;
    const copy = await prisma.reactivationEmailCampaign.create({
      data: {
        name: `${source.name} copia`,
        slug: `${source.slug}-copy-${Date.now()}`,
        description: source.description,
        status: 'draft',
        isActive: false,
        initialTemplateId: source.initialTemplateId,
        reminderTemplateId: source.reminderTemplateId,
        lastCallTemplateId: source.lastCallTemplateId,
        flowDefinitionId: source.flowDefinitionId,
        publishedFlowVersionId: source.publishedFlowVersionId,
        dailyLimit: source.dailyLimit,
        batchSize: source.batchSize,
        sendWindow: source.sendWindow,
        exitRules: source.exitRules,
        metadata: source.metadata,
        createdBy: actorFromReq(req),
        updatedBy: actorFromReq(req)
      }
    });
    await audit(prisma, req, 'campaign_duplicated', 'campaign', copy.id, copy, source);
    return copy;
  }

  static async setCampaignStatus(id, status, req) {
    const prisma = getPrisma();
    const campaign = await prisma.reactivationEmailCampaign.update({
      where: { id },
      data: { status, isActive: status === 'active', updatedBy: actorFromReq(req) }
    });
    const action = status === 'active' ? 'campaign_activated' : status === 'paused' ? 'campaign_paused' : 'campaign_archived';
    await audit(prisma, req, action, 'campaign', id, campaign);
    return campaign;
  }

  static async listTemplates() {
    const prisma = getPrisma();
    return prisma.reactivationEmailTemplate.findMany({ orderBy: [{ slug: 'asc' }, { version: 'desc' }] });
  }

  static async saveTemplate(payload, req) {
    const prisma = getPrisma();
    const slug = payload.slug || slugify(payload.name);
    const nextVersion = payload.id
      ? undefined
      : Number(payload.version || ((await prisma.reactivationEmailTemplate.count({ where: { slug } })) + 1));
    const data = {
      name: payload.name,
      slug,
      status: payload.status || 'draft',
      isActive: Boolean(payload.isActive),
      subject: payload.subject,
      preheader: payload.preheader || null,
      html: payload.html,
      text: payload.text,
      variables: payload.variables || [],
      metadata: payload.metadata || null,
      updatedBy: actorFromReq(req),
      publishedAt: payload.status === 'active' ? new Date() : null
    };
    const template = payload.id
      ? await prisma.reactivationEmailTemplate.update({ where: { id: payload.id }, data })
      : await prisma.reactivationEmailTemplate.create({ data: { ...data, version: nextVersion, parentId: payload.parentId || null, createdBy: actorFromReq(req) } });
    await audit(prisma, req, payload.id ? 'template_updated' : 'template_created', 'template', template.id, template);
    return template;
  }

  static async listFlows() {
    const prisma = getPrisma();
    return prisma.reactivationFlowDefinition.findMany({
      orderBy: { updatedAt: 'desc' },
      include: { versions: { orderBy: { version: 'desc' }, take: 1 } }
    });
  }

  static async getFlow(id) {
    const prisma = getPrisma();
    return prisma.reactivationFlowDefinition.findUnique({
      where: { id },
      include: {
        versions: {
          orderBy: { version: 'desc' },
          include: { nodes: true, edges: true }
        }
      }
    });
  }

  static async saveFlow(payload, req) {
    const prisma = getPrisma();
    const definition = payload.definition || { nodes: payload.nodes || [], edges: payload.edges || [] };
    const validation = this.validateFlow(definition);
    const slug = payload.slug || slugify(payload.name);
    const flow = payload.id
      ? await prisma.reactivationFlowDefinition.update({
          where: { id: payload.id },
          data: { name: payload.name, slug, description: payload.description || null, status: payload.status || 'draft', isActive: Boolean(payload.isActive), metadata: payload.metadata || null, updatedBy: actorFromReq(req) }
        })
      : await prisma.reactivationFlowDefinition.create({
          data: { name: payload.name, slug, description: payload.description || null, status: 'draft', isActive: false, metadata: payload.metadata || null, createdBy: actorFromReq(req), updatedBy: actorFromReq(req) }
        });

    const latest = await prisma.reactivationFlowVersion.findFirst({ where: { flowId: flow.id }, orderBy: { version: 'desc' } });
    const version = await prisma.reactivationFlowVersion.create({
      data: {
        flowId: flow.id,
        version: (latest?.version || 0) + 1,
        status: validation.valid && payload.publish ? 'published' : 'draft',
        definition,
        validationErrors: validation.valid ? null : validation.errors,
        publishedAt: validation.valid && payload.publish ? new Date() : null,
        createdBy: actorFromReq(req),
        nodes: {
          create: definition.nodes.map((node) => ({
            nodeKey: node.key,
            type: node.type,
            label: node.label,
            config: node.config || null,
            position: node.position || null
          }))
        },
        edges: {
          create: definition.edges.map((edge) => ({
            edgeKey: edge.key || `${edge.source}-${edge.target}`,
            sourceNodeKey: edge.source,
            targetNodeKey: edge.target,
            label: edge.label || null,
            condition: edge.condition || null
          }))
        }
      }
    });

    if (validation.valid && payload.publish) {
      await prisma.reactivationFlowDefinition.update({
        where: { id: flow.id },
        data: { status: 'active', isActive: true, publishedVersionId: version.id }
      });
      await audit(prisma, req, 'flow_published', 'flow', flow.id, { flow, version });
    } else {
      await audit(prisma, req, payload.id ? 'flow_updated' : 'flow_created', 'flow', flow.id, { flow, version, validation });
    }

    return { flow, version, validation };
  }

  static async setFlowStatus(id, status, req) {
    const prisma = getPrisma();
    const flow = await prisma.reactivationFlowDefinition.update({
      where: { id },
      data: { status, isActive: status === 'active', updatedBy: actorFromReq(req) }
    });
    await audit(prisma, req, status === 'active' ? 'flow_activated' : 'flow_paused', 'flow', id, flow);
    return flow;
  }

  static async leadTimeline(leadId) {
    const prisma = getPrisma();
    const [lead, auditEvents, messages, flowExecutions, flowSteps] = await Promise.all([
      prisma.reactivationLead.findUnique({ where: { id: leadId } }),
      prisma.reactivationAuditEvent.findMany({ where: { leadId }, orderBy: { createdAt: 'asc' } }),
      prisma.reactivationEmailMessage.findMany({ where: { leadId }, include: { events: true }, orderBy: { createdAt: 'asc' } }),
      prisma.reactivationLeadFlowExecution.findMany({ where: { leadId }, orderBy: { createdAt: 'asc' } }),
      prisma.reactivationFlowExecutionStep.findMany({ where: { leadId }, orderBy: { createdAt: 'asc' } })
    ]);
    return { lead, auditEvents, messages, flowExecutions, flowSteps };
  }

  static async previewTemplate(templateId, variables = {}) {
    const prisma = getPrisma();
    const template = await prisma.reactivationEmailTemplate.findUnique({ where: { id: templateId } });
    if (!template) return null;
    const defaults = {
      firstName: 'Marina',
      name: 'Marina',
      fullName: 'Marina Teste Cote',
      reactivationUrl: 'https://finance.cotejuros.com.br/r/exemplo-token',
      unsubscribeUrl: 'https://finance.cotejuros.com.br/r/exemplo-token?optout=1'
    };
    const merged = { ...defaults, ...variables };
    return {
      template,
      rendered: {
        subject: renderTemplate(template.subject, merged),
        preheader: renderTemplate(template.preheader || '', merged),
        html: renderTemplate(template.html, merged),
        text: renderTemplate(template.text, merged)
      },
      variables: merged
    };
  }

  static async sendTemplateTest({ templateId, toEmail, variables = {} }, req) {
    const preview = await this.previewTemplate(templateId, variables);
    if (!preview) return null;
    if (!process.env.SENDGRID_API_KEY) {
      throw new Error('SENDGRID_API_KEY is required to send template tests');
    }
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    const message = {
      to: toEmail,
      from: {
        email: process.env.SENDGRID_FROM_EMAIL || 'noreply@em.cotejuros.com.br',
        name: process.env.SENDGRID_FROM_NAME || 'Cote Juros'
      },
      replyTo: process.env.SENDGRID_REPLY_TO || process.env.SENDGRID_FROM_EMAIL || 'noreply@em.cotejuros.com.br',
      subject: `[TESTE] ${preview.rendered.subject}`,
      html: preview.rendered.html,
      text: preview.rendered.text,
      customArgs: {
        campaign: 'admin_template_test',
        templateId
      }
    };
    const [response] = await sgMail.send(message);
    await audit(getPrisma(), req, 'template_updated', 'template_test', templateId, {
      to: maskEmail(toEmail),
      statusCode: response?.statusCode || null,
      providerMessageId: response?.headers?.['x-message-id'] || null
    });
    return {
      sent: true,
      to: maskEmail(toEmail),
      statusCode: response?.statusCode || null,
      providerMessageId: response?.headers?.['x-message-id'] || null
    };
  }

  static async resendLeadEmail({ leadId, templateId, sequenceKey = 'manual_resend', reactivationUrl }, req) {
    const prisma = getPrisma();
    const [lead, template] = await Promise.all([
      prisma.reactivationLead.findUnique({ where: { id: leadId } }),
      prisma.reactivationEmailTemplate.findUnique({ where: { id: templateId } })
    ]);
    if (!lead || !template) return null;
    if (!lead.email) throw new Error('Lead does not have an email');
    if (!reactivationUrl) {
      throw new Error('reactivationUrl is required because raw reactivation tokens are not stored in the database');
    }
    if (!process.env.SENDGRID_API_KEY) {
      throw new Error('SENDGRID_API_KEY is required to resend email');
    }

    const campaign = await prisma.reactivationEmailCampaign.findFirst({ where: { slug: CAMPAIGN_SLUG } });
    const variables = {
      firstName: String(lead.fullName || 'Ola').trim().split(/\s+/)[0],
      name: String(lead.fullName || 'Ola').trim().split(/\s+/)[0],
      fullName: lead.fullName || '',
      reactivationUrl,
      unsubscribeUrl: `${reactivationUrl}?optout=1`
    };
    const idempotencyKey = crypto.createHash('sha256')
      .update(['manual_resend', leadId, templateId, Date.now()].join(':'))
      .digest('hex');
    const subject = renderTemplate(template.subject, variables);
    const html = renderTemplate(template.html, variables);
    const text = renderTemplate(template.text, variables);

    const messageRecord = await prisma.reactivationEmailMessage.create({
      data: {
        leadId,
        campaignId: campaign?.id || null,
        templateId,
        sequenceKey,
        provider: 'sendgrid',
        toEmailHash: hashEmail(lead.email),
        toEmailMasked: maskEmail(lead.email),
        subject,
        status: 'sending',
        idempotencyKey,
        requestPayload: {
          to: maskEmail(lead.email),
          subject,
          sequenceKey,
          action: 'manual_resend'
        },
        scheduledAt: new Date()
      }
    });

    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    const [response] = await sgMail.send({
      to: lead.email,
      from: {
        email: process.env.SENDGRID_FROM_EMAIL || 'noreply@em.cotejuros.com.br',
        name: process.env.SENDGRID_FROM_NAME || 'Cote Juros'
      },
      replyTo: process.env.SENDGRID_REPLY_TO || process.env.SENDGRID_FROM_EMAIL || 'noreply@em.cotejuros.com.br',
      subject,
      html,
      text,
      trackingSettings: {
        clickTracking: { enable: true, enableText: true },
        openTracking: { enable: true }
      },
      customArgs: {
        messageId: messageRecord.id,
        leadId,
        campaignId: campaign?.id || '',
        campaign: campaign?.slug || CAMPAIGN_SLUG,
        sequence: sequenceKey
      }
    });
    const providerMessageId = response?.headers?.['x-message-id'] || null;
    await prisma.reactivationEmailMessage.update({
      where: { id: messageRecord.id },
      data: {
        status: 'sent',
        sentAt: new Date(),
        providerMessageId,
        responsePayload: {
          statusCode: response?.statusCode || null,
          providerMessageId
        }
      }
    });
    await prisma.reactivationEmailMessageEvent.create({
      data: {
        messageId: messageRecord.id,
        leadId,
        campaignId: campaign?.id || null,
        eventType: 'manual_resend',
        provider: 'sendgrid',
        providerEventId: `manual-resend-${messageRecord.id}`,
        providerMessageId,
        emailHash: hashEmail(lead.email),
        rawPayload: { actor: actorFromReq(req) },
        signatureVerified: true,
        occurredAt: new Date()
      }
    });
    await audit(prisma, req, 'lead_email_resent', 'lead', leadId, {
      messageId: messageRecord.id,
      templateId,
      sequenceKey,
      to: maskEmail(lead.email)
    });
    return { messageId: messageRecord.id, providerMessageId, to: maskEmail(lead.email) };
  }

  static async pauseLeadFlow(leadId, req) {
    const prisma = getPrisma();
    const result = await prisma.reactivationLeadFlowExecution.updateMany({
      where: {
        leadId,
        status: { in: ['active', 'waiting'] }
      },
      data: { status: 'paused' }
    });
    await audit(prisma, req, 'lead_paused', 'lead', leadId, { pausedExecutions: result.count });
    return { pausedExecutions: result.count };
  }

  static async moveLeadFlowNode({ leadId, executionId, nodeKey, reason }, req) {
    const prisma = getPrisma();
    const execution = await prisma.reactivationLeadFlowExecution.findFirst({
      where: {
        id: executionId || undefined,
        leadId,
        status: { in: ['active', 'waiting', 'paused'] }
      }
    });
    if (!execution) return null;
    const node = await prisma.reactivationFlowNode.findFirst({
      where: {
        flowVersionId: execution.flowVersionId,
        nodeKey
      }
    });
    if (!node) throw new Error(`Node ${nodeKey} not found in execution flow version`);
    const updated = await prisma.reactivationLeadFlowExecution.update({
      where: { id: execution.id },
      data: {
        currentNodeKey: nodeKey,
        status: 'active',
        waitingUntil: null,
        errorMessage: null,
        context: {
          ...(execution.context || {}),
          manualMove: {
            nodeKey,
            reason: reason || null,
            actor: actorFromReq(req),
            at: new Date().toISOString()
          }
        }
      }
    });
    await prisma.reactivationFlowExecutionStep.create({
      data: {
        executionId: execution.id,
        leadId,
        flowNodeId: node.id,
        nodeKey,
        nodeType: node.type,
        status: 'completed',
        input: { manual: true, reason: reason || null },
        output: { movedBy: actorFromReq(req) },
        startedAt: new Date(),
        completedAt: new Date()
      }
    });
    await audit(prisma, req, 'lead_flow_moved', 'lead', leadId, { executionId: execution.id, nodeKey, reason });
    return updated;
  }

  static async forceNextExecution(leadId, req) {
    const prisma = getPrisma();
    const result = await prisma.reactivationLeadFlowExecution.updateMany({
      where: {
        leadId,
        status: 'waiting'
      },
      data: {
        status: 'active',
        waitingUntil: null
      }
    });
    await audit(prisma, req, 'lead_flow_moved', 'lead', leadId, { forcedExecutions: result.count, action: 'force_next_execution' });
    return { forcedExecutions: result.count };
  }

  static async applyLeadSuppression({ leadId, email, scope = 'dnc_global', reason = 'admin_manual' }, req) {
    const prisma = getPrisma();
    const lead = leadId ? await prisma.reactivationLead.findUnique({ where: { id: leadId } }) : null;
    const targetEmail = email || lead?.email;
    if (!targetEmail) throw new Error('email or leadId with email is required');
    const suppression = await prisma.reactivationSuppression.upsert({
      where: { emailHash_scope: { emailHash: hashEmail(targetEmail), scope } },
      create: {
        scope,
        emailHash: hashEmail(targetEmail),
        reason,
        source: 'admin_manual'
      },
      update: {
        reason,
        source: 'admin_manual'
      }
    });
    if (leadId) {
      await prisma.reactivationLead.update({
        where: { id: leadId },
        data: {
          status: scope === 'revoked_consent' ? 'revoked' : 'suppressed',
          optOutReason: reason,
          consentRevokedAt: scope === 'revoked_consent' ? new Date() : undefined
        }
      });
    }
    await audit(prisma, req, 'lead_suppressed', leadId ? 'lead' : 'suppression', leadId || suppression.id, {
      suppressionId: suppression.id,
      scope,
      reason,
      email: maskEmail(targetEmail)
    });
    return suppression;
  }

  static async releaseSuppression({ suppressionId, leadId, email, scope }, req) {
    const prisma = getPrisma();
    let deleted;
    if (suppressionId) {
      deleted = await prisma.reactivationSuppression.deleteMany({ where: { id: suppressionId } });
    } else {
      const lead = leadId ? await prisma.reactivationLead.findUnique({ where: { id: leadId } }) : null;
      const targetEmail = email || lead?.email;
      if (!targetEmail || !scope) throw new Error('suppressionId or email/leadId plus scope is required');
      deleted = await prisma.reactivationSuppression.deleteMany({
        where: { emailHash: hashEmail(targetEmail), scope }
      });
    }
    await audit(prisma, req, 'lead_suppressed', leadId ? 'lead' : 'suppression', leadId || suppressionId || null, {
      action: 'release_suppression',
      deleted: deleted.count,
      scope
    });
    return { deleted: deleted.count };
  }

  static verifySendGridSignature(req) {
    const publicKey = process.env.SENDGRID_WEBHOOK_PUBLIC_KEY;
    if (!publicKey) return false;
    const signature = req.header(EventWebhookHeader.SIGNATURE());
    const timestamp = req.header(EventWebhookHeader.TIMESTAMP());
    if (!signature || !timestamp || !req.rawBody) return false;
    const eventWebhook = new EventWebhook();
    const key = eventWebhook.convertPublicKeyToECDSA(publicKey);
    return eventWebhook.verifySignature(key, req.rawBody, signature, timestamp);
  }

  static mapSendGridEventType(event) {
    const raw = String(event || '').toLowerCase();
    if (raw === 'spam_report') return 'spamreport';
    if (raw === 'group_unsubscribe') return 'group_unsubscribe';
    if (raw === 'group_resubscribe') return 'group_resubscribe';
    return ['processed', 'delivered', 'open', 'click', 'bounce', 'dropped', 'deferred', 'spamreport', 'unsubscribe'].includes(raw)
      ? raw
      : 'processed';
  }

  static messageStatusForEvent(eventType) {
    const map = {
      processed: 'sent',
      delivered: 'delivered',
      open: 'opened',
      click: 'clicked',
      bounce: 'bounced',
      dropped: 'dropped',
      spamreport: 'spam_reported',
      unsubscribe: 'unsubscribed',
      group_unsubscribe: 'unsubscribed'
    };
    return map[eventType] || null;
  }

  static async handleSendGridWebhook(events, req) {
    const prisma = getPrisma();
    const signatureVerified = this.verifySendGridSignature(req);
    const safeEvents = Array.isArray(events) ? events : [];
    const results = [];

    for (const event of safeEvents) {
      const providerEventId = event.sg_event_id || event.event_id || null;
      const providerMessageId = event.sg_message_id || event['smtp-id'] || null;
      const leadId = event.leadId || event.lead_id || null;
      const campaignId = event.campaignId || event.campaign_id || null;
      const messageId = event.messageId || event.message_id || null;
      const eventType = this.mapSendGridEventType(event.event);
      const occurredAt = event.timestamp ? new Date(Number(event.timestamp) * 1000) : new Date();
      const effectiveProviderEventId = providerEventId || `${providerMessageId || messageId || 'unknown'}-${event.event}-${event.timestamp || Date.now()}`;
      const existingMessage = messageId
        ? await prisma.reactivationEmailMessage.findUnique({ where: { id: messageId } })
        : providerMessageId
          ? await prisma.reactivationEmailMessage.findFirst({ where: { providerMessageId } })
          : null;

      const messageEvent = await prisma.reactivationEmailMessageEvent.upsert({
        where: {
          provider_providerEventId: {
            provider: 'sendgrid',
            providerEventId: effectiveProviderEventId
          }
        },
        create: {
          messageId: existingMessage?.id || null,
          leadId: existingMessage?.leadId || leadId,
          campaignId: existingMessage?.campaignId || campaignId,
          eventType,
          provider: 'sendgrid',
          providerEventId: effectiveProviderEventId,
          providerMessageId,
          emailHash: hashEmail(event.email),
          url: event.url || null,
          userAgent: event.useragent || event.user_agent || null,
          ipAddress: event.ip || null,
          reason: event.reason || event.response || event.status || null,
          rawPayload: event,
          signatureVerified,
          occurredAt
        },
        update: {}
      });

      const nextStatus = this.messageStatusForEvent(eventType);
      if (existingMessage && nextStatus) {
        const dateField = {
          delivered: 'deliveredAt',
          opened: 'openedAt',
          clicked: 'clickedAt',
          bounced: 'bouncedAt',
          unsubscribed: 'unsubscribedAt'
        }[nextStatus];
        await prisma.reactivationEmailMessage.update({
          where: { id: existingMessage.id },
          data: {
            status: nextStatus,
            ...(dateField ? { [dateField]: occurredAt } : {})
          }
        });
      }

      if (['unsubscribe', 'group_unsubscribe', 'spamreport', 'bounce', 'dropped'].includes(eventType) && event.email) {
        await prisma.reactivationSuppression.upsert({
          where: { emailHash_scope: { emailHash: hashEmail(event.email), scope: 'unsubscribe_email' } },
          create: {
            scope: 'unsubscribe_email',
            emailHash: hashEmail(event.email),
            reason: `sendgrid:${eventType}`,
            source: 'sendgrid_webhook'
          },
          update: {
            reason: `sendgrid:${eventType}`,
            source: 'sendgrid_webhook'
          }
        });
      }

      results.push({ id: messageEvent.id, eventType, providerEventId });
    }

    await audit(prisma, req, 'webhook_received', 'sendgrid_event_batch', null, {
      count: results.length,
      signatureVerified
    });

    return { processed: results.length, signatureVerified, results };
  }

  static verifyBrevoWebhook(req) {
    const secret = process.env.BREVO_WEBHOOK_SECRET;
    if (!secret) return false;
    const provided = req.header('x-brevo-webhook-secret') || req.query?.secret || '';
    return provided && provided === secret;
  }

  static mapBrevoEventType(event) {
    const raw = String(event || '').toLowerCase();
    if (['delivered'].includes(raw)) return 'delivered';
    if (['opened', 'open'].includes(raw)) return 'open';
    if (['click', 'clicked', 'unique_click'].includes(raw)) return 'click';
    if (['hardbounce', 'softbounce', 'blocked', 'invalid', 'error'].includes(raw)) return 'bounce';
    if (['spam', 'complaint'].includes(raw)) return 'spamreport';
    if (['unsubscribed', 'unsubscribe'].includes(raw)) return 'unsubscribe';
    if (['request', 'requests', 'sent'].includes(raw)) return 'processed';
    return 'processed';
  }

  static async handleBrevoWebhook(events, req) {
    const prisma = getPrisma();
    const signatureVerified = this.verifyBrevoWebhook(req);
    const safeEvents = Array.isArray(events) ? events : [events].filter(Boolean);
    const results = [];

    for (const event of safeEvents) {
      const providerMessageId = event['message-id'] || event.messageId || event.message_id || event.messageIdBrevo || null;
      const providerEventId = event.id || event.event_id || `${providerMessageId || 'unknown'}-${event.event || event.eventType}-${event.ts || event.date || Date.now()}`;
      const eventType = this.mapBrevoEventType(event.event || event.eventType);
      const occurredAt = event.ts ? new Date(Number(event.ts) * 1000) : event.date ? new Date(event.date) : new Date();
      const existingMessage = providerMessageId
        ? await prisma.reactivationEmailMessage.findFirst({ where: { providerMessageId } })
        : null;

      const messageEvent = await prisma.reactivationEmailMessageEvent.upsert({
        where: {
          provider_providerEventId: {
            provider: 'brevo',
            providerEventId
          }
        },
        create: {
          messageId: existingMessage?.id || null,
          leadId: existingMessage?.leadId || null,
          campaignId: existingMessage?.campaignId || null,
          eventType,
          provider: 'brevo',
          providerEventId,
          providerMessageId,
          emailHash: hashEmail(event.email),
          url: event.link || event.url || null,
          userAgent: event.user_agent || event.userAgent || null,
          ipAddress: event.ip || null,
          reason: event.reason || event.tag || null,
          rawPayload: event,
          signatureVerified,
          occurredAt
        },
        update: {}
      });

      const nextStatus = this.messageStatusForEvent(eventType);
      if (existingMessage && nextStatus) {
        const dateField = {
          delivered: 'deliveredAt',
          opened: 'openedAt',
          clicked: 'clickedAt',
          bounced: 'bouncedAt',
          unsubscribed: 'unsubscribedAt'
        }[nextStatus];
        await prisma.reactivationEmailMessage.update({
          where: { id: existingMessage.id },
          data: {
            status: nextStatus,
            ...(dateField ? { [dateField]: occurredAt } : {})
          }
        });
      }

      if (['unsubscribe', 'spamreport', 'bounce', 'dropped'].includes(eventType) && event.email) {
        await prisma.reactivationSuppression.upsert({
          where: { emailHash_scope: { emailHash: hashEmail(event.email), scope: 'unsubscribe_email' } },
          create: {
            scope: 'unsubscribe_email',
            emailHash: hashEmail(event.email),
            reason: `brevo:${eventType}`,
            source: 'brevo_webhook'
          },
          update: {
            reason: `brevo:${eventType}`,
            source: 'brevo_webhook'
          }
        });
      }

      results.push({ id: messageEvent.id, eventType, providerEventId });
    }

    await audit(prisma, req, 'webhook_received', 'brevo_event_batch', null, {
      count: results.length,
      signatureVerified
    });

    return { processed: results.length, results };
  }

  static async bootstrapDefaults(req) {
    const prisma = getPrisma();
    const templates = [];
    for (const template of DEFAULT_TEMPLATES) {
      const saved = await prisma.reactivationEmailTemplate.upsert({
        where: { slug_version: { slug: template.slug, version: 1 } },
        update: { ...template, status: 'active', isActive: true, updatedBy: actorFromReq(req), publishedAt: new Date() },
        create: { ...template, version: 1, status: 'active', isActive: true, createdBy: actorFromReq(req), updatedBy: actorFromReq(req), publishedAt: new Date() }
      });
      templates.push(saved);
    }

    const flowValidation = this.validateFlow(DEFAULT_FLOW);
    const flow = await prisma.reactivationFlowDefinition.upsert({
      where: { slug: 'reactivation-credit-v1' },
      update: { name: 'Reativacao credito v1', status: 'active', isActive: true, updatedBy: actorFromReq(req) },
      create: {
        name: 'Reativacao credito v1',
        slug: 'reactivation-credit-v1',
        description: 'Fluxo visual inicial: initial, reminder e last call com splits por clique e submit.',
        status: 'active',
        isActive: true,
        createdBy: actorFromReq(req),
        updatedBy: actorFromReq(req)
      }
    });

    let version = await prisma.reactivationFlowVersion.findFirst({ where: { flowId: flow.id, version: 1 } });
    if (!version) {
      version = await prisma.reactivationFlowVersion.create({
        data: {
          flowId: flow.id,
          version: 1,
          status: flowValidation.valid ? 'published' : 'draft',
          definition: DEFAULT_FLOW,
          validationErrors: flowValidation.valid ? null : flowValidation.errors,
          publishedAt: flowValidation.valid ? new Date() : null,
          createdBy: actorFromReq(req),
          nodes: {
            create: DEFAULT_FLOW.nodes.map((node) => ({
              nodeKey: node.key,
              type: node.type,
              label: node.label,
              config: node.config,
              position: node.position
            }))
          },
          edges: {
            create: DEFAULT_FLOW.edges.map((edge) => ({
              edgeKey: edge.key,
              sourceNodeKey: edge.source,
              targetNodeKey: edge.target,
              label: edge.label || null,
              condition: edge.condition || null
            }))
          }
        }
      });
    }

    await prisma.reactivationFlowDefinition.update({
      where: { id: flow.id },
      data: { publishedVersionId: version.id }
    });

    const campaign = await prisma.reactivationEmailCampaign.upsert({
      where: { slug: 'reactivation-credit-main' },
      update: {
        status: 'active',
        isActive: true,
        initialTemplateId: templates[0].id,
        reminderTemplateId: templates[1].id,
        lastCallTemplateId: templates[2].id,
        flowDefinitionId: flow.id,
        publishedFlowVersionId: version.id,
        dailyLimit: Number(process.env.REACTIVATION_EMAIL_DAILY_LIMIT || 5),
        batchSize: Number(process.env.REACTIVATION_EMAIL_BATCH_SIZE || 5),
        updatedBy: actorFromReq(req)
      },
      create: {
        name: 'Reativacao de credito Cote Juros',
        slug: 'reactivation-credit-main',
        description: 'Campanha principal de reativacao de leads antigos para credito.',
        status: 'active',
        isActive: true,
        initialTemplateId: templates[0].id,
        reminderTemplateId: templates[1].id,
        lastCallTemplateId: templates[2].id,
        flowDefinitionId: flow.id,
        publishedFlowVersionId: version.id,
        dailyLimit: Number(process.env.REACTIVATION_EMAIL_DAILY_LIMIT || 5),
        batchSize: Number(process.env.REACTIVATION_EMAIL_BATCH_SIZE || 5),
        sendWindow: { timezone: 'America/Sao_Paulo', weekdays: [1, 2, 3, 4, 5], start: '09:30', end: '17:30' },
        exitRules: { stopOnSubmit: true, stopOnOptOut: true, stopOnSuppression: true, maxEmails: 3 },
        createdBy: actorFromReq(req),
        updatedBy: actorFromReq(req)
      }
    });

    await audit(prisma, req, 'config_updated', 'bootstrap_defaults', campaign.id, { campaign, flow, version, templates });
    return { campaign, flow, version, templates };
  }
}
