# Admitad Affiliates

## Variáveis de ambiente

Defina no backend `apps/api/.env` ou no provedor de deploy da API:

```env
ADMITAD_ACCESS_TOKEN=
ADMITAD_CLIENT_ID=
ADMITAD_CLIENT_SECRET=
ADMITAD_SCOPE=advcampaigns
ADMITAD_API_BASE_URL=https://api.admitad.com
ADMITAD_OAUTH_BASE_URL=https://api.admitad.com
ADMITAD_CLICKREF_PARAM=subid
ADMITAD_DEFAULT_WEBSITE=
```

Use `ADMITAD_ACCESS_TOKEN` se você já tiver um token válido.
Se preferir OAuth2 automático, configure `ADMITAD_CLIENT_ID` e `ADMITAD_CLIENT_SECRET`.

## Endpoints internos

- `GET /api/affiliates/admitad/status`
- `POST /api/affiliates/admitad/sync`

Exemplo de sync manual:

```json
{
  "merchantQuery": "supersim",
  "limit": 50
}
```

## O que o sync faz

- consulta `GET https://api.admitad.com/advcampaigns/`
- filtra programas de finanças/crédito
- prioriza o merchant informado
- cria ou atualiza `affiliate_programs`
- cria ou atualiza `affiliate_offers`

## Oferta inicial da SuperSim

A integração já reserva a SuperSim como primeiro caso de uso em:

- `/emprestimos`
- `/comparar/emprestimo-online`
- `/emprestimo-para-negativado`

No fallback local, a oferta já está em `apps/web/src/platform/seed/affiliateSeed.js`.
