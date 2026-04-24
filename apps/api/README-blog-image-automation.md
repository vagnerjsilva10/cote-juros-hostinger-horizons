# Blog Image Automation

Automacao rigida para imagens reais do blog. O sistema nao gera cards, templates, graficos falsos, texto dentro da imagem ou placeholders.

## Regras

- Prioridade 1: Freepik gratuito, somente paginas `/free-photo/`.
- Prioridade 2: Pexels.
- Prioridade 3: Unsplash.
- Tamanho minimo: 1200x675.
- Preferencia visual: foto horizontal 16:9, editorial, profissional e contextual.
- Se nenhuma foto valida for encontrada, o artigo fica como rascunho e o erro entra no log.
- Limite diario: `BLOG_IMAGE_MAX_PER_DAY`, padrao `3`.

## Validador

O validador fica em `src/services/blogImage/validator.js` e rejeita imagens que falhem em qualquer criterio:

```js
validateBlogImage(image)
```

Retorna sinais como:

- `isRealPhoto`
- `hasNoBigTextOverlay`
- `isContextual`
- `isNotPlaceholder`
- `isNotGenericChart`
- `hasValidLicense`
- `widthMin: 1200`
- `heightMin: 675`
- `passed`
- `errors`

## Busca Contextual

Antes de buscar, o artigo e classificado por intencao:

- Financiamento de veiculo: `car financing`, `car loan`, `person with car`, `vehicle financing`, `car dealership`
- Emprestimo pessoal: `personal loan`, `financial planning`, `person using calculator`, `loan agreement`, `money and documents`
- Nome negativado: `debt`, `financial problem`, `worried person bills`, `bills debt`, `credit score`
- Cartao de credito: `credit card payment`, `person holding credit card`, `online shopping credit card`
- Financiamento imobiliario: `home financing`, `mortgage`, `family house`, `real estate contract`
- Educacao financeira: `financial education`, `family budget`, `personal finance`, `person planning finances`

## WordPress

Ao publicar, o sistema:

- faz upload da foto real;
- define `featured_media`;
- insere credito abaixo da imagem quando a fonte e Freepik: `Imagem: Freepik`;
- salva fonte e URL original nos metadados locais e tenta salvar tambem em `post_meta`;
- registra provider, URL original, keyword e validacao nos logs.

## Variaveis

```env
FREEPIK_BASE_URL="https://www.freepik.com"
PEXELS_API_KEY=""
UNSPLASH_ACCESS_KEY=""
WORDPRESS_BASE_URL="https://wordpress.cotejuros.com.br"
WORDPRESS_USERNAME=""
WORDPRESS_APPLICATION_PASSWORD=""
BLOG_IMAGE_CRON_MORNING="20 8 * * *"
BLOG_IMAGE_CRON_AFTERNOON="20 14 * * *"
BLOG_IMAGE_CRON_EVENING="20 20 * * *"
BLOG_IMAGE_MAX_PER_DAY="3"
```

Freepik usa busca publica HTML de fotos gratuitas. Pexels e Unsplash exigem chave oficial das respectivas APIs.

## Scripts

Rodar uma correcao manual:

```bash
npm run blog-images:run --prefix apps/api
```

Revisar e corrigir posts antigos com placeholder/template:

```bash
npm run blog-images:backfill --prefix apps/api
```

Iniciar scheduler:

```bash
npm run blog-images:jobs:start --prefix apps/api
```
