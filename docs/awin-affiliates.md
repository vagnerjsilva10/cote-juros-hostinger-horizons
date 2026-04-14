# Awin Affiliates

## Variáveis de ambiente

Defina no backend `apps/api/.env` ou no provedor de deploy da API:

```env
AWIN_API_TOKEN=seu_token_bearer_da_awin
AWIN_PUBLISHER_ID=seu_publisher_id
AWIN_API_BASE_URL=https://api.awin.com
AWIN_CLICKREF_PARAM=clickref
```

## Onde cadastrar `advertiser_id` e links de tracking

Cadastre os programas e ofertas nas tabelas:

- `affiliate_networks`
- `affiliate_programs`
- `affiliate_offers`

Campos principais em `affiliate_programs`:

- `network_id`
- `advertiser_id`
- `merchant_name`

Campos principais em `affiliate_offers`:

- `advertiser_id`
- `merchant_name`
- `offer_slug`
- `title`
- `category`
- `description`
- `audience`
- `product_type`
- `page_slugs`
- `placements`
- `destination_url`
- `tracking_url`
- `cta_text`
- `disclosure_text`
- `is_active`
- `priority`

## Como ligar uma oferta a páginas existentes

Use `page_slugs` e `placements` em `affiliate_offers`.

Exemplo:

```json
{
  "page_slugs": ["/emprestimos", "/comparar/emprestimo-online"],
  "placements": ["below_hero", "mid_content", "before_faq"]
}
```

Posições usadas no portal:

- `below_hero`
- `mid_content`
- `sidebar`
- `before_faq`

## Tracking interno

O clique é registrado em `affiliate_clicks` antes do redirect.

Formato do `clickref`:

```txt
pageSlug|position|offerSlug|device
```

Exemplo:

```txt
comparar-emprestimo-online|mid_content|banco-parceiro-emprestimo|mobile
```

## Endpoints

- `GET /api/affiliates/offers?pageSlug=/emprestimos&position=below_hero`
- `GET /api/affiliates/placements?pageSlug=/comparar/emprestimo-online`
- `POST /api/affiliates/offers/:offerSlug/click`
- `GET /api/affiliates/awin/status`
