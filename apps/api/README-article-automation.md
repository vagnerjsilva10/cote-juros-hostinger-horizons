# Automação diária de artigos

## Como funciona

O alvo da automação é o próprio site `cotejuros.com.br`. O job cria o artigo no banco (`articles`), valida conteúdo e imagem, marca `status = published` e expõe a URL final em `/blog/:slug/`.

O WordPress não é usado para publicar post. No fluxo atual ele pode ser usado apenas como armazenamento de mídia, porque o pipeline de imagem existente envia a imagem validada para a biblioteca de mídia e usa a URL retornada no artigo do Cote Juros.

## Agendamento

O agendamento real fica em `apps/api/vercel.json`, usando Vercel Cron:

- 08:30 America/Sao_Paulo: `30 11 * * *` UTC
- 13:30 America/Sao_Paulo: `30 16 * * *` UTC
- 19:30 America/Sao_Paulo: `30 22 * * *` UTC

Todos chamam:

```text
GET /api/cron/articles/run
```

O endpoint calcula o dia em `America/Sao_Paulo`, confere quantos artigos já foram publicados no dia e faz catch-up até o limite de 3.

## Endpoints

Todos exigem:

```text
Authorization: Bearer $CRON_SECRET
```

### Diagnóstico

```text
GET /api/cron/articles/diagnostics
```

Retorna timezone, horário atual, próximo slot, último job, último artigo criado/publicado, última falha, publicados hoje, limite diário, integrações e se o sistema está apto a publicar.

### Execução manual

```text
POST /api/cron/articles/run-now
```

Executa o fluxo imediatamente, gerando artigo, imagem real validada e publicação no banco do Cote Juros. Retorna `article_id`, `post_id` como alias legado, `url`, status e detalhes de validação.

### Execução de cron/catch-up

```text
GET /api/cron/articles/run
```

Executa somente se houver slot vencido e menos publicações do que o esperado para o horário atual.

## Envs obrigatórias

- `DATABASE_URL`
- `DIRECT_URL`
- `CRON_SECRET`
- `SITE_BASE_URL`
- `OPENAI_API_KEY` ou `GEMINI_API_KEY`
- `PEXELS_API_KEY` ou `UNSPLASH_ACCESS_KEY`
- `WORDPRESS_BASE_URL`, `WORDPRESS_USERNAME`, `WORDPRESS_APPLICATION_PASSWORD` somente para armazenamento/sync de mídia

## Logs

Cada execução grava em `automation_jobs`:

- `job_name`
- `started_at`
- `finished_at`
- `status`: `success`, `failed` ou `skipped`
- `error_message`
- `payload`
- `result`
- `created_article_id`
- `wordpress_post_id` fica nulo, pois o alvo não é post WordPress

O pipeline editorial detalhado também continua gravando em `editorial_job_runs`.

## Como testar

```bash
curl -X GET "$API_BASE/api/cron/articles/diagnostics" \
  -H "Authorization: Bearer $CRON_SECRET"

curl -X POST "$API_BASE/api/cron/articles/run-now" \
  -H "Authorization: Bearer $CRON_SECRET" \
  -H "Content-Type: application/json" \
  -d "{\"limit\":1,\"trigger\":\"manual-production-test\"}"
```

Sucesso só conta se a resposta trouxer URL em `https://www.cotejuros.com.br/blog/.../` e o artigo existir como `published` no banco.
