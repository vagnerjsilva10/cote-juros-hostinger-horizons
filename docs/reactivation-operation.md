# Operacao de reativacao e monetizacao de leads

Este documento descreve a operacao de producao da Cote Juros para transformar base antiga de leads de credito em receita com parceiros. A arquitetura real do repo e Vite/React em `apps/web` e Express/Prisma em `apps/api`, preparada para uma futura migracao para API routes de Next.js sem mudar os contratos.

## 1. Arquitetura end-to-end

```txt
Google Sheets / CSV
  -> scripts de tokenizacao e segmentacao
  -> n8n em ondas
  -> POST /api/reactivation/import
  -> disparo Email/WhatsApp com /r/:token
  -> landing finance.cotejuros.com.br/r/:token
  -> consentimento LGPD
  -> scoring
  -> roteamento
  -> delivery para parceiro
  -> retry automatico
  -> auditoria + KPIs + receita estimada
```

## 2. Estrutura dos dados

Arquivos principais:

```txt
apps/api/src/routes/reactivation.js
apps/api/src/services/reactivationService.js
apps/api/src/services/reactivationTokenService.js
apps/api/src/services/reactivationValidationService.js
apps/api/src/services/reactivationScoringService.js
apps/api/src/services/reactivationRoutingService.js
apps/api/src/services/reactivationDeliveryService.js
apps/api/prisma/migrations/20260416_reactivation_operation/migration.sql
apps/api/prisma/migrations/20260416_reactivation_hardening/migration.sql
apps/web/src/pages/ReactivationLandingPage.jsx
apps/web/src/pages/admin/AdminReactivationPage.jsx
scripts/reactivation/generateLeadTokens.js
scripts/reactivation/segmentLeadBatches.js
docs/n8n/reactivation-import-and-dispatch.workflow.json
docs/n8n/reactivation-kpi-sync.workflow.json
docs/n8n/reactivation-delivery-retry.workflow.json
```

Tabelas:

```txt
reactivation_leads
reactivation_audit_events
reactivation_partner_deliveries
reactivation_suppressions
```

Status do lead:

```txt
imported
visited
consented
qualified
routed
pending_delivery
delivery_retrying
delivery_failed
delivery_success
rejected
expired
revoked
suppressed
```

Status de delivery:

```txt
pending_delivery
delivery_retrying
delivery_failed
delivery_success
suppressed
```

## 3. Ordem de ativacao

1. Rotacionar segredos que estejam em `.env` local ou tenham sido compartilhados em workspace.
2. Configurar variaveis de ambiente no ambiente real.
3. Aplicar migrations Prisma.
4. Rodar `npm run prisma:generate`.
5. Subir API.
6. Subir front em `finance.cotejuros.com.br`.
7. Importar workflows n8n.
8. Testar ponta a ponta com 5 leads internos.
9. Liberar piloto por ondas.

## 4. Variaveis de ambiente

```bash
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."
CORS_ORIGIN="https://finance.cotejuros.com.br"

REACTIVATION_BASE_URL="https://finance.cotejuros.com.br"
REACTIVATION_TOKEN_SECRET="minimo-32-caracteres-aleatorios"
REACTIVATION_PII_HASH_SECRET="outro-segredo-minimo-32-caracteres"
REACTIVATION_TOKEN_TTL_DAYS="45"
REACTIVATION_CONSENT_VERSION="2026-04-16"
REACTIVATION_PRIVACY_POLICY_VERSION="2026-04-16"
REACTIVATION_RATE_LIMIT_WINDOW_MS="60000"
REACTIVATION_RATE_LIMIT_MAX="40"

REACTIVATION_DELIVERY_ATTEMPTS="3"
REACTIVATION_DELIVERY_BACKOFF_MS="1000"
REACTIVATION_DELIVERY_MAX_RETRIES="5"

COTE_API_BASE_URL="https://api.cotejuros.com.br"
COTE_API_TOKEN="token-longo-para-n8n"

GOOGLE_SHEETS_REACTIVATION_ID="id-da-planilha"
REACTIVATION_BATCH_ID="pilot_001"
REACTIVATION_WAVE_SIZE="50"
REACTIVATION_WAVE_DELAY_SECONDS="2"
REACTIVATION_RETRY_LIMIT="25"

EMAIL_API_URL="https://email-provider.example/send"
EMAIL_API_KEY="..."
EMAIL_REACTIVATION_TEMPLATE_ID="cote-reactivation"

WHATSAPP_API_URL="https://whatsapp-provider.example/messages"
WHATSAPP_API_KEY="..."
WHATSAPP_REACTIVATION_TEMPLATE="cote_juros_reactivation"

REACTIVATION_PARTNER_WEBHOOK_TOKEN="token-compartilhado-com-parceiros"
REACTIVATION_PARTNER_PRIME_WEBHOOK="https://partner.example/webhook"
REACTIVATION_PARTNER_STANDARD_URL="https://partner.example/ofertas"
REACTIVATION_PARTNER_RESTRICTION_WHATSAPP="https://partner.example/whatsapp"
REACTIVATION_NURTURE_EMAIL="relacionamento@cotejuros.com.br"
```

Parceiros tambem podem ser configurados por JSON:

```bash
REACTIVATION_PARTNERS_JSON='[
  {
    "id": "prime-credit",
    "name": "Parceiro Prime",
    "mode": "webhook",
    "destination": "https://partner.example/webhook",
    "accepts": {
      "qualifications": ["prime"],
      "minScore": 72,
      "productTypes": ["loan", "financing"],
      "allowGuaranteeBoost": true
    },
    "priority": 100,
    "estimatedRevenueCents": 9000
  }
]'
```

## 5. Como aplicar migration

Desenvolvimento:

```bash
npm run prisma:migrate
```

Producao:

```bash
npm run prisma:deploy
npm run prisma:generate
```

## 6. Como gerar tokens

```bash
npm run reactivation:tokens -- --input=base.json --output=out/leads-with-tokens.json --baseUrl=https://finance.cotejuros.com.br --batchId=pilot_001
```

Dry-run:

```bash
npm run reactivation:tokens -- --input=base.json --output=out/leads-with-tokens.json --dryRun
```

O script:

```txt
exige segredo forte
gera token aleatorio
salva tokenHash HMAC
deduplica por batchId + externalLeadId
gera manifest
```

## 7. Como segmentar batches

```bash
npm run reactivation:batches -- --input=out/leads-with-tokens.json --outputDir=out/batches --batchSize=500 --waveSize=50
```

Segmentos gerados:

```txt
garantia_prioritaria
alta_intencao
engajado_multicanal
whatsapp_first
email_first
enriquecimento
```

## 8. Como testar localmente

1. Subir API:

```bash
npm run dev:api
```

2. Subir front:

```bash
npm run dev
```

3. Criar um lead:

```bash
curl -X POST http://localhost:4100/api/reactivation/import \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $COTE_API_TOKEN" \
  -d '{"externalLeadId":"test-1","batchId":"local","fullName":"Lead Teste","phone":"11999999999","income":3500,"productType":"loan"}'
```

4. Abrir:

```txt
http://localhost:3000/r/TOKEN_RETORNADO
```

5. Enviar formulario e conferir:

```txt
/api/reactivation/events
/api/reactivation/kpis
/admin/reactivation
```

## 9. Validacao ponta a ponta

Checklist tecnico:

```txt
token criado e nunca persistido em claro no banco
token_hash gravado
page_viewed registrado
consent_granted registrado
privacy_policy_version gravada
form_submitted registrado
lead_scored registrado com reasons
partner_selected registrado
partner_routed ou delivery_retrying registrado
delivery salvo com request/response mascarado
idempotency_key impede submit duplicado
opt-out cria suppression
lead suprimido nao dispara
KPIs atualizam
```

## 10. Checklist de producao

```txt
[ ] Rotacionar segredos expostos em .env local
[ ] Configurar REACTIVATION_TOKEN_SECRET forte
[ ] Configurar REACTIVATION_PII_HASH_SECRET forte
[ ] Configurar COTE_API_TOKEN forte
[ ] Confirmar CORS_ORIGIN de finance.cotejuros.com.br
[ ] Aplicar migrations
[ ] Testar /health
[ ] Testar /api/reactivation/import com lead interno
[ ] Testar /r/:token em mobile
[ ] Testar opt-out
[ ] Testar submit duplicado
[ ] Testar parceiro webhook sandbox
[ ] Importar workflows n8n
[ ] Definir REACTIVATION_BATCH_ID
[ ] Definir REACTIVATION_WAVE_SIZE
[ ] Monitorar /admin/reactivation
```

## 11. Plano de rollout

Fase 1, 5 leads teste:

```txt
somente equipe interna
todos os canais verificados
validar auditoria por lead
validar opt-out
```

Fase 2, 50 leads piloto:

```txt
waveSize 25
somente horario comercial
monitorar taxa de erro, opt-out, consentimento e entrega
```

Fase 3, 200 leads:

```txt
waveSize 50
ativar retry automatico
comparar WhatsApp versus e-mail
validar parceiro que gera maior receita
```

Fase 4, 500 leads:

```txt
waveSize 100
otimizar copy por segmento
acompanhar receita estimada e payout real
preparar proximo lote
```

## 12. Riscos e mitigacao

```txt
Credenciais expostas:
  mitigar com rotacao imediata e uso de secrets manager.

Base antiga sem base legal atual:
  mitigar com copy clara, consentimento novo e opt-out simples.

Disparo para suprimidos:
  mitigar com /suppression/check antes de n8n disparar.

Duplicidade de envio:
  mitigar com idempotency_key, lock por lead e unique leadId+partnerId.

Falha de parceiro:
  mitigar com delivery_retrying, backoff e workflow de retry.

Promessa indevida de credito:
  mitigar com copy sem promessa de aprovacao.

Baixa conversao:
  mitigar com rollout por ondas e ajuste por segmento.
```

## 13. Endpoints

```txt
POST /api/reactivation/import
GET  /api/reactivation/lead/:token?viewed=1
POST /api/reactivation/submit
POST /api/reactivation/opt-out
POST /api/reactivation/refuse-consent
POST /api/reactivation/suppression/check
POST /api/reactivation/regenerate-token
POST /api/reactivation/deliveries/retry-due
GET  /api/reactivation/events
GET  /api/reactivation/kpis
```

## 14. KPIs

```txt
leads enviados
views
consentimentos
formularios completos
qualificados
roteados
entregues
falhas de delivery
taxa por batch
taxa por parceiro
receita estimada
payout registrado
```
