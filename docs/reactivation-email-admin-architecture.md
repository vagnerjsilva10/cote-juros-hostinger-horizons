# Admin de email e automacao visual

Esta fase adiciona uma camada editavel sobre a operacao atual de reativacao sem quebrar os jobs em producao.

## Arquitetura

- API: `apps/api`
- Admin web: `apps/web`
- Banco: Supabase Postgres via Prisma
- Envio: SendGrid
- Automacao atual: GitHub Actions chamando os jobs existentes

## Novas rotas

Todas usam `Authorization: Bearer <REACTIVATION_ADMIN_TOKEN ou COTE_API_TOKEN>`, exceto o webhook SendGrid.

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

Para acessar os endpoints protegidos pelo browser em ambiente local/controlado, configure:

```text
VITE_ADMIN_API_TOKEN=<mesmo valor do REACTIVATION_ADMIN_TOKEN ou COTE_API_TOKEN>
```

Nao use `COTE_API_TOKEN` como `VITE_*` em producao. Variaveis `VITE_*` ficam expostas no bundle do browser. Para producao, o proximo passo recomendado e criar uma camada BFF/autenticada para o admin ou mover o admin operacional para rotas server-side.

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
- Expor acoes manuais: reenviar email, mover lead, pausar lead, aplicar/liberar suppressao.
- Criar edicao visual real com drag/connect persistente.
- Criar camada BFF/autenticada para o admin em producao, evitando token operacional no bundle Vite.

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
