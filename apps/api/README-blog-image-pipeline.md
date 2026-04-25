# Blog image pipeline

Objetivo: cada artigo publicado deve ter foto real, contextual e unica. O pipeline bloqueia templates, SVGs, cards internos, placeholders e imagens repetidas por URL, id da fonte, SHA256 e hash perceptual.

## Prioridade de fontes

1. Pexels
2. Unsplash
3. Freepik gratuito
4. IA apenas como fallback futuro opcional; o fluxo atual nao usa IA/template quando a foto real falha.

## Variaveis necessarias

```env
PEXELS_API_KEY=""
UNSPLASH_ACCESS_KEY=""
WORDPRESS_BASE_URL=""
WORDPRESS_USERNAME=""
WORDPRESS_APPLICATION_PASSWORD=""
DATABASE_URL=""
```

## Rodar um artigo

```bash
npm run blog-images:run --prefix apps/api
```

## Backfill de artigos antigos

Dry run:

```bash
node apps/api/src/jobs/backfillBlogImages.js --limit=10 --dry-run
```

Executar:

```bash
npm run blog-images:backfill --prefix apps/api
```

O backfill corrige artigos com imagem repetida ou template/placeholder. Se nao encontrar foto unica e contextual, o artigo fica em draft e o log registra `no unique contextual image found`.

Forcar um artigo especifico:

```bash
node apps/api/src/jobs/backfillBlogImages.js --slug=slug-do-artigo --limit=1
```

## Validacao local

```bash
npm run blog-images:validate --prefix apps/api
```

Esse script comprova bloqueio de template, URL repetida, hash repetido, hash perceptual parecido e ausencia de imagem valida levando a draft.

## Persistencia

As imagens usadas ficam em `blog_used_images`:

- `post_id`
- `source`
- `source_image_id`
- `original_url`
- `download_url`
- `image_hash`
- `perceptual_hash`
- `keywords`
- `article_title`
- `used_at`
