# Integracao Creditas

## Status

A API da Cote Juros ja possui uma camada backend pronta para Creditas em `apps/api/src/integrations/creditas` e rotas em `/api/credit/creditas/*`.

O que esta pronto antes das credenciais:

- autenticacao OAuth 2.0 Client Credentials com cache de token;
- ambientes Staging e Production com URLs oficiais;
- health check de configuracao;
- validacao dos payloads de Auto Equity e Home Equity antes do envio;
- fluxo Auto Equity: elegibilidade, oferta, consulta de oferta, proposta e webhook;
- fluxo Home Equity: elegibilidade, proposta e consulta de status v2;
- endpoints auxiliares para documentos da proposta;
- captura de `rawBody` para validar webhook assinado.

## Variaveis

Staging:

```env
CREDITAS_ENV="staging"
CREDITAS_AUTH_URL="https://auth-staging.creditas.com.br/api/affiliate_clients/tokens"
CREDITAS_API_BASE_URL="https://stg-api.creditas.io/b2b"
CREDITAS_CONSUMER_KEY=""
CREDITAS_CONSUMER_SECRET=""
CREDITAS_TIMEOUT_MS="15000"
CREDITAS_RETRY_COUNT="1"
CREDITAS_WEBHOOK_SECRET=""
CREDITAS_PARTNER_ID="e62dbc2d-be9c-4137-8de1-e797c8be3998"
CREDITAS_PARTNER_NAME="49.810.360 VAGNER DE JESUS SILVA"
CREDITAS_PARTNER_EMAIL="contato@cotejuros.com.br"
CREDITAS_PARTNER_DESCRIPTION="49.810.360 VAGNER DE JESUS SILVA"
CREDITAS_PARTNER_STATUS="ACTIVE"
```

Producao:

```env
CREDITAS_ENV="production"
CREDITAS_AUTH_URL="https://auth.creditas.com.br/api/affiliate_clients/tokens"
CREDITAS_API_BASE_URL="https://api.creditas.io/b2b"
CREDITAS_CONSUMER_KEY=""
CREDITAS_CONSUMER_SECRET=""
CREDITAS_TIMEOUT_MS="15000"
CREDITAS_RETRY_COUNT="1"
CREDITAS_WEBHOOK_SECRET=""
CREDITAS_PARTNER_ID=""
CREDITAS_PARTNER_NAME=""
CREDITAS_PARTNER_EMAIL=""
CREDITAS_PARTNER_DESCRIPTION=""
CREDITAS_PARTNER_STATUS=""
```

## Rotas

- `GET /api/credit/creditas/health`
- `POST /api/credit/creditas/token/check`
- `POST /api/credit/creditas/eligibility`
- `POST /api/credit/creditas/offers`
- `GET /api/credit/creditas/offers/:id`
- `POST /api/credit/creditas/proposals`
- `GET /api/credit/creditas/proposals/:id/status?includes=metadata`
- `GET /api/credit/creditas/proposals/:id/documents`
- `POST /api/credit/creditas/proposals/:id/documents`
- `POST /api/credit/creditas/webhook`

## Fluxo recomendado

Auto Equity:

1. `/creditas/eligibility`
2. `/creditas/offers`
3. `/creditas/offers/:id`
4. `/creditas/proposals` com `product: "auto_equity"`
5. `/creditas/webhook`

Home Equity:

1. `/creditas/eligibility`
2. simulacao Home Equity, quando a Creditas confirmar o payload final de staging
3. `/creditas/proposals` com `product: "home_equity"`
4. `/creditas/proposals/:id/status`

## Credenciais

A Creditas libera `consumer_key` e `consumer_secret` manualmente. O fluxo oficial e:

1. solicitar credenciais de Staging ao consultor/time Creditas;
2. configurar `CREDITAS_CONSUMER_KEY` e `CREDITAS_CONSUMER_SECRET`;
3. testar `/creditas/token/check`;
4. executar evidencias em Staging: `/eligibility` com 200, `/offers` com 201 e `/proposals` com 201;
5. enviar para Creditas as evidencias tecnicas e o comprovante visual do opt-in de comunicacoes;
6. apos aprovacao, trocar para credenciais de Production.

## Evidencias para go-live

Guarde screenshots ou logs com:

- data e horario da chamada;
- endpoint chamado;
- status HTTP retornado;
- trecho do retorno com `eligible: true` em elegibilidade;
- `id` de oferta iniciado por `OFR-`;
- `id` de proposta iniciado por `B2B-`, `legacyId` e `productType`;
- comprovante visual do opt-in de comunicacoes na interface.

## Observacoes

- O endpoint de status v2 usa header `Accept: application/vnd.creditas.v2+json`.
- Webhook exige `CREDITAS_WEBHOOK_SECRET`, obtido pelo magic-link enviado pela Creditas apos cadastro do webhook.
- Sem credenciais, a integracao permanece desabilitada e o health informa as variaveis faltantes.
