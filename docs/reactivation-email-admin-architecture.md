# Admin de email e automacao visual

Esta fase adiciona uma camada editavel sobre a operacao atual de reativacao sem quebrar os jobs em producao.

## Arquitetura

- API: `apps/api`
- Admin web: `apps/web`
- Banco: Supabase Postgres via Prisma
- Envio: SendGrid
- Automacao atual: GitHub Actions chamando os jobs existentes

## Autenticacao do admin

As rotas do admin aceitam dois modos:

- Browser: login por `POST /api/reactivation-admin/auth/login`, com cookie HTTP-only `cj_admin_session`.
- Automacoes/scripts: `Authorization: Bearer <REACTIVATION_ADMIN_TOKEN ou COTE_API_TOKEN>`.

Variaveis recomendadas para producao:

```text
REACTIVATION_ADMIN_PASSWORD=<senha forte para operadores>
REACTIVATION_ADMIN_SESSION_SECRET=<segredo aleatorio de 32+ bytes>
REACTIVATION_ADMIN_COOKIE_DOMAIN=.cotejuros.com.br
REACTIVATION_ADMIN_SESSION_TTL_SECONDS=43200
REACTIVATION_ADMIN_TOKEN=<token administrativo para scripts, diferente de COTE_API_TOKEN>
```

O frontend nao precisa mais expor `COTE_API_TOKEN` em `VITE_ADMIN_API_TOKEN`. Esse fallback ainda existe para ambiente local/controlado, mas nao deve ser usado em producao.

## Novas rotas

Todas usam cookie de sessao ou `Authorization: Bearer`, exceto login/logout/session e webhook SendGrid.

- `POST /api/reactivation-admin/auth/login`
- `POST /api/reactivation-admin/auth/logout`
- `GET /api/reactivation-admin/auth/session`
- `GET /api/reactivation-admin/dashboard`
- `GET /api/reactivation-admin/campaigns`
- `POST /api/reactivation-admin/campaigns`
- `POST /api/reactivation-admin/campaigns/:id/status`
- `POST /api/reactivation-admin/campaigns/:id/duplicate`
- `GET /api/reactivation-admin/templates`
- `POST /api/reactivation-admin/templates`
- `GET /api/reactivation-admin/flows`
- `GET /api/reactivation-admin/flows/:id`
- `POST /api/reactivation-admin/flows`
- `POST /api/reactivation-admin/flows/validate`
- `POST /api/reactivation-admin/flows/:id/status`
- `GET /api/reactivation-admin/leads/:leadId/timeline`
- `POST /api/reactivation-admin/leads/:leadId/resend-email`
- `POST /api/reactivation-admin/leads/:leadId/pause-flow`
- `POST /api/reactivation-admin/leads/:leadId/move-flow-node`
- `POST /api/reactivation-admin/leads/:leadId/force-next-execution`
- `POST /api/reactivation-admin/suppressions/apply`
- `POST /api/reactivation-admin/suppressions/release`
- `POST /api/reactivation-admin/bootstrap-defaults`
- `POST /api/reactivation-admin/webhooks/sendgrid`

## Webhook SendGrid

Configure no SendGrid Event Webhook:

```text
POST https://api.cotejuros.com.br/api/reactivation-admin/webhooks/sendgrid
```

Eventos:

- processed
- delivered
- open
- click
- bounce
- dropped
- deferred
- spamreport
- unsubscribe
- group_unsubscribe
- group_resubscribe

Para verificacao de assinatura, configure:

```text
SENDGRID_WEBHOOK_PUBLIC_KEY=<public key do SendGrid Event Webhook>
```

Sem essa variavel, os eventos sao aceitos e salvos com `signatureVerified=false`.

## Admin web

Nova tela:

```text
/admin/email-ops
```

Ela carrega:

- dashboard operacional
- campanhas
- templates
- visualizacao do fluxo em blocos conectados
- login seguro por cookie HTTP-only
- preview e envio de teste de template
- reenvio manual
- pausa/movimento de lead no fluxo
- aplicacao/liberacao de supressao

## Fluxo inicial publicado

Foi criado o fluxo `reactivation-credit-v1`:

```text
Lead elegivel
-> Email initial
-> Esperar 3 dias
-> Condicao: clicou?
   -> sim: marcar engajado / aguardar submit
   -> nao: enviar reminder
-> Esperar 4 dias
-> Condicao: clicou?
   -> sim: marcar engajado
   -> nao: enviar last call
-> finalizar
```

Campanha inicial:

```text
reactivation-credit-main
```

Templates iniciais:

- `reactivation-initial`
- `reactivation-reminder`
- `reactivation-last-call`

## Proximos incrementos

- Registrar eventos reais de delivered/open/click/bounce via webhook SendGrid em producao.
- Criar edicao visual real com drag/connect persistente.
- Criar editor completo de template com preview HTML lado a lado.
- Criar tela detalhada do lead dentro do fluxo.

## Integracao ja ativa nesta fase

O job `sendReactivationEmails.js` agora:

- carrega a campanha `reactivation-credit-main`;
- usa `dailyLimit` e `batchSize` da campanha;
- usa templates versionados quando configurados;
- cria `reactivation_email_messages` antes do envio real;
- salva `providerMessageId` retornado pelo SendGrid;
- cria evento `sent`;
- cria/atualiza execucao em `reactivation_lead_flow_executions`;
- registra etapa em `reactivation_flow_execution_steps`;
- registra health em `reactivation_automation_job_runs`.

Os jobs de import, retry e KPI tambem registram health em `reactivation_automation_job_runs`.
