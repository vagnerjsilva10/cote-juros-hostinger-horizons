# Deploy da API no Vercel

## Estrutura adicionada

A API foi adaptada para Vercel Serverless:

- `apps/api/src/app.js` (app Express reutilizavel)
- `apps/api/src/server.js` (dev local com `app.listen`)
- `apps/api/api/index.js` (entrypoint serverless)
- `apps/api/vercel.json` (rewrites para `/health` e `/api/*`)

## Como criar o projeto da API no Vercel

1. New Project no Vercel
2. Selecionar este repositorio
3. Em **Root Directory**, definir: `apps/api`
4. Framework Preset: `Other`
5. Deploy

## Variaveis de ambiente (projeto API)

- `DATABASE_URL`
- `DIRECT_URL`
- `CORS_ORIGIN` (URL do frontend, ex: `https://cote-juros-hostinger-horizons-6au5.vercel.app`)

## Testes apos deploy

- `GET https://SUA-API.vercel.app/health`
- `GET https://SUA-API.vercel.app/api/offers`

Se `/health` responder JSON com `ok: true`, a API esta correta.

## Variavel no projeto WEB

No projeto do frontend, configurar:

- `VITE_API_BASE_URL=https://SUA-API.vercel.app`

Depois, fazer redeploy do frontend.
