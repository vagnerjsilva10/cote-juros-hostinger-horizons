# Cote Juros Reactivation: Sheets + n8n Runbook

## Ambiente

API de producao:

```txt
https://api.cotejuros.com.br
```

Variaveis obrigatorias no n8n:

```txt
COTE_API_BASE_URL=https://api.cotejuros.com.br
COTE_API_TOKEN=<token de automacao rotacionado>
GOOGLE_SHEETS_REACTIVATION_ID=<id da planilha>
REACTIVATION_BASE_URL=https://finance.cotejuros.com.br
REACTIVATION_BATCH_ID=piloto-50-2026-04-17
REACTIVATION_WAVE_SIZE=50
REACTIVATION_WAVE_DELAY_SECONDS=2
```

Variaveis obrigatorias na API/Vercel:

```txt
DATABASE_URL
DIRECT_URL
COTE_API_TOKEN
REACTIVATION_TOKEN_SECRET
REACTIVATION_PII_HASH_SECRET
REACTIVATION_PARTNER_PRIME_WEBHOOK
REACTIVATION_PARTNER_WEBHOOK_TOKEN
REACTIVATION_PARTNER_STANDARD_URL
REACTIVATION_DELIVERY_ATTEMPTS=3
REACTIVATION_DELIVERY_BACKOFF_MS=1000
REACTIVATION_DELIVERY_MAX_RETRIES=5
REACTIVATION_CONSENT_VERSION=2026-04-17
REACTIVATION_PRIVACY_POLICY_VERSION=2026-04-17
```

Rotacionar antes do piloto:

```txt
COTE_API_TOKEN
REACTIVATION_TOKEN_SECRET
REACTIVATION_PII_HASH_SECRET
```

## Abas da planilha

Crie as abas abaixo no Google Sheets usado a partir de `cote_juros_leads_consolidados_v2.xlsx`.

### leads_raw

```txt
externalLeadId,batchId,fullName,email,phone,cpf,productType,source,segment,requestedAmount,income,employmentStatus,hasRestriction,hasGuarantee,guaranteeType,rawImportedAt,rawSourceSheet,notes
```

### leads_queue

```txt
rowId,externalLeadId,batchId,fullName,email,phone,cpf,productType,source,segment,requestedAmount,income,employmentStatus,hasRestriction,hasGuarantee,guaranteeType,status,leadId,token,reactivationUrl,importedAt,lastAttemptAt,attempts,suppressionStatus,errorMessage
```

Status aceitos:

```txt
queued,suppressed,imported,sent,visited,submitted,pending_delivery,delivery_retrying,delivery_failed,delivery_success,revoked,error
```

### leads_results

```txt
leadId,externalLeadId,batchId,tokenLast4,status,scoreValue,scoreBand,qualification,partnerId,partnerName,deliveryStatus,deliveryId,redirectUrl,estimatedRevenueCents,payoutCents,createdAt,updatedAt,submittedAt,deliveredAt,lastSyncedAt
```

### kpis_daily

```txt
date,batchId,totalLeads,sentLeads,visits,consents,forms,qualified,routed,delivered,deliveryFailed,visitRate,consentRate,formRate,qualificationRate,deliveryRate,estimatedRevenueCents,payoutCents,syncedAt
```

### suppressions

```txt
email,phone,cpf,scope,reason,source,createdAt,syncedToApi,apiResult
```

### errors

```txt
timestamp,workflow,node,externalLeadId,leadId,batchId,endpoint,httpStatus,errorMessage,payloadJson,responseJson,retryable,resolved
```

## Workflow A: ingestao de leads

Objetivo: ler `leads_queue`, checar supressao, importar lead e atualizar a propria planilha.

Sequencia:

```txt
1. Cron: a cada 5 ou 15 minutos.
2. Google Sheets Read: aba leads_queue.
3. Code: filtrar status=queued, leadId vazio, limitar por REACTIVATION_WAVE_SIZE.
4. Split In Batches: 25 ou 50.
5. HTTP Request: POST /api/reactivation/suppression/check.
6. IF suppressed/emailSuppressed/whatsappSuppressed:
   - Update Row leads_queue: status=suppressed, suppressionStatus=matched, lastAttemptAt=now.
   - Append errors ou leads_results, conforme politica.
7. HTTP Request: POST /api/reactivation/import.
8. Update Row leads_queue:
   - status=imported
   - leadId=response.data.lead.id
   - token=response.data.token
   - reactivationUrl=https://finance.cotejuros.com.br/r/{token}
   - importedAt=now
   - attempts=attempts+1
9. Append leads_results com dados publicos do lead.
10. Error Trigger: append errors.
```

Filtro do node Code:

```js
const waveLimit = Number($env.REACTIVATION_WAVE_SIZE || 50);
const batchId = $env.REACTIVATION_BATCH_ID || `batch_${new Date().toISOString().slice(0, 10)}`;

return items
  .filter((item) => {
    const row = item.json;
    return String(row.status || '').toLowerCase() === 'queued' && !row.leadId;
  })
  .slice(0, waveLimit)
  .map((item) => ({
    json: {
      ...item.json,
      batchId: item.json.batchId || batchId,
      productType: item.json.productType || 'loan'
    }
  }));
```

Payload de suppression/check:

```json
{
  "email": "={{$json.email}}",
  "phone": "={{$json.phone}}",
  "cpf": "={{$json.cpf}}"
}
```

Payload de import:

```json
{
  "externalLeadId": "={{$json.externalLeadId || $json.rowId}}",
  "batchId": "={{$json.batchId}}",
  "fullName": "={{$json.fullName}}",
  "email": "={{$json.email}}",
  "phone": "={{$json.phone}}",
  "cpf": "={{$json.cpf}}",
  "productType": "={{$json.productType || 'loan'}}",
  "source": "google_sheets_n8n",
  "segment": "={{$json.segment}}",
  "requestedAmount": "={{Number($json.requestedAmount || 0) || undefined}}",
  "income": "={{Number($json.income || 0) || undefined}}",
  "employmentStatus": "={{$json.employmentStatus}}",
  "hasRestriction": "={{['true','1','sim','yes'].includes(String($json.hasRestriction || 'false').toLowerCase())}}",
  "hasGuarantee": "={{['true','1','sim','yes'].includes(String($json.hasGuarantee || 'false').toLowerCase())}}",
  "guaranteeType": "={{$json.guaranteeType}}",
  "originalPayload": "={{$json}}"
}
```

## Workflow B: retry de delivery

Objetivo: reprocessar entregas em `delivery_retrying`.

Sequencia:

```txt
1. Cron: a cada 10 minutos.
2. HTTP Request: POST /api/reactivation/deliveries/retry-due.
3. Body: { "limit": 50 }.
4. Append leads_results com deliveryId/status.
5. Se status=delivery_failed, append errors.
6. Rodar GET /api/reactivation/kpis e atualizar kpis_daily.
```

Importante:

```txt
pending_delivery de prime-credit com destination vazio nao entra no retry.
Configure REACTIVATION_PARTNER_PRIME_WEBHOOK antes de escalar leads prime.
```

## Workflow C: monitoramento

Objetivo: sincronizar KPIs e criar alertas operacionais.

Sequencia:

```txt
1. Cron: a cada 30 minutos.
2. GET /api/reactivation/kpis?batchId={{$env.REACTIVATION_BATCH_ID}}.
3. GET /api/reactivation/events?limit=500.
4. Append kpis_daily.
5. Append errors quando:
   - deliveryFailed > 0
   - pending_delivery prime-credit acima do limite interno
   - consentRate cair abaixo do esperado
   - formRate cair abaixo do esperado
```

## Chamadas HTTP de referencia

Headers protegidos:

```txt
Authorization: Bearer {{$env.COTE_API_TOKEN}}
Content-Type: application/json
```

Import:

```txt
POST {{$env.COTE_API_BASE_URL}}/api/reactivation/import
```

Lead:

```txt
GET {{$env.COTE_API_BASE_URL}}/api/reactivation/lead/{{token}}?viewed=1
```

Submit:

```txt
POST {{$env.COTE_API_BASE_URL}}/api/reactivation/submit
```

Opt-out:

```txt
POST {{$env.COTE_API_BASE_URL}}/api/reactivation/opt-out
```

Suppression:

```txt
POST {{$env.COTE_API_BASE_URL}}/api/reactivation/suppression/check
```

Retry:

```txt
POST {{$env.COTE_API_BASE_URL}}/api/reactivation/deliveries/retry-due
```

Events:

```txt
GET {{$env.COTE_API_BASE_URL}}/api/reactivation/events?leadId={{leadId}}&limit=100
```

KPIs:

```txt
GET {{$env.COTE_API_BASE_URL}}/api/reactivation/kpis?batchId={{batchId}}
```

## Ordem do piloto

```txt
1. Copiar dados da planilha consolidada para leads_raw.
2. Normalizar 5 linhas para leads_queue com status=queued.
3. Rodar Workflow A manualmente.
4. Confirmar leadId, token e reactivationUrl preenchidos.
5. Abrir 1 link /r/{token}.
6. Enviar formulario real.
7. Conferir leads_results, events e kpis_daily.
8. Configurar webhook do prime-credit.
9. Rodar 50 leads.
10. Escalar para 200 somente se delivery_success e opt-out estiverem consistentes.
```
