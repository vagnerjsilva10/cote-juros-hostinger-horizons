# Admin Auth Runbook

## Fluxo

O login do admin usa a API em `/api/admin/auth/login`. A API garante as tabelas administrativas, sincroniza o bootstrap minimo, valida a senha, cria uma linha em `admin_sessions` e devolve o cookie HTTP-only `cj_admin_session`.

O frontend nao grava token em localStorage. A sessao e confirmada chamando `/api/admin/auth/session` com `credentials: include`.

## Variaveis obrigatorias da API

- `DATABASE_URL`: banco Supabase/Postgres usado pela API.
- `ADMIN_BOOTSTRAP_PASSWORD`: senha inicial/sincronizada do `super_admin`.
- `ADMIN_PASSWORD_HASH_SECRET`: segredo estavel usado no hash da senha. Se mudar, a senha bootstrap deve estar configurada para rehash seguro.
- `ADMIN_SESSION_SECRET`: segredo estavel usado para assinar o cookie de sessao.
- `ADMIN_COOKIE_DOMAIN`: em producao, use `.cotejuros.com.br` quando frontend e API estiverem em subdominios desse dominio.
- `CORS_ORIGIN`: inclua os dominios publicados do frontend, por exemplo `https://www.cotejuros.com.br,https://cotejuros.com.br`.

## Migrations obrigatorias

Estas migrations precisam estar aplicadas no Supabase antes do deploy do admin:

- `20260417_admin_governance_foundation`
- `20260417_admin_partner_configs`

O diagnostico `/api/admin/auth/diagnostics` lista tabelas ausentes e migrations administrativas aplicadas.

## Ordem segura de producao

1. Configure ou confirme as env vars da API na Vercel.
2. Aplique as migrations no banco real com `npm run prisma:deploy --prefix apps/api`.
3. Faça deploy da API.
4. Confirme `GET https://api.cotejuros.com.br/api/admin/auth/diagnostics`.
5. Faça deploy do frontend.
6. Teste login, sessao, dashboard e logout no browser.

## Testes rapidos

- Senha correta: `POST /api/admin/auth/login` deve retornar `data.authenticated=true` e `Set-Cookie`.
- Senha incorreta: deve retornar `401` com `code=ADMIN_INVALID_CREDENTIALS`.
- Sessao: `GET /api/admin/auth/session` com cookie deve retornar `authenticated=true`.
- Sem cookie: rotas protegidas como `/api/admin/dashboard` devem retornar `401`.
- Banco sem migration: login deve retornar `503` com `code=ADMIN_MIGRATION_MISSING`, nunca erro cru do Prisma.
- Bootstrap ausente: se nao existir usuario admin e faltar `ADMIN_BOOTSTRAP_PASSWORD`, login deve retornar `503` com `code=ADMIN_BOOTSTRAP_NOT_CONFIGURED`.
