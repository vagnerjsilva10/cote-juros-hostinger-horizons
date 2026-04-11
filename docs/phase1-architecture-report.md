# Cote Juros - Fase 1 de Arquitetura Escalavel

## 1) Diagnostico do estado atual

### O que existe hoje
- Monorepo com foco em `apps/web` (Vite + React).
- Portal funcional com rotas de comparacao, blog, diagnostico e landing SEO.
- UI madura, mas dados de negocio majoritariamente estaticos.

### Limites encontrados
- Sem backend dedicado para entidades centrais de negocio.
- Ausencia de camada unica para dominio, tracking e integracao.
- Fluxos de simulacao sem persistencia real de funil/lead.
- Integracao com `finance.cotejuros.com.br` sem contexto padronizado.

## 2) Itens hardcoded identificados

### Dados de negocio
- Ofertas de emprestimo/cartao/financiamento em arrays estaticos.
- Artigos/editorial em arquivo local.
- SEO pages (parte) e testimonials em nivel de UI.

### Regras de funil
- Simulacao e diagnostico com logica apenas de UX (sem captura estruturada).
- Eventos de clique/CTA sem contrato unico.

## 3) Arquitetura alvo recomendada

### Camadas
1. Frontend Portal (rotas e UX).
2. Service/API Layer (contratos e casos de uso).
3. Repositorio de dominio (fonte de dados local -> backend real no proximo passo).
4. Integracao Cote Finance AI (redirect contextual + tracking).
5. Tracking e lead funnel (eventos estruturados).

### Entidades base (dominio)
- Bank
- Category
- FinancialProduct
- Offer
- Article
- SeoPage
- Testimonial
- SimulationLead
- ClickEvent
- PartnerRedirect
- CtaEvent
- AppIntegrationEvent

### APIs recomendadas (contrato)
- `getBanks`, `getCategories`, `getProducts`
- `getOffers(filters)`
- `getArticles(filters)`
- `getSeoPages`, `getSeoFallbackPaths`
- `getTestimonials`, `getAppIntegrationSources`
- `captureSimulationLead`
- `trackClick`, `trackCta`
- `createPartnerRedirect`
- `trackIntegration`

## 4) Modelo de integracao com Cote Finance AI

### Objetivo
Enviar usuarios do portal para a aplicacao principal com contexto de origem.

### Contexto transportado
- `source_page`
- `product_type`
- `campaign`
- `utm_*`
- contexto de simulacao (`lead_id`, `sim_amount`, `sim_score`)

### URL alvo
- Base: `https://finance.cotejuros.com.br/app`
- Params base: `auth=login&period=this_month&tz=America/Sao_Paulo&tab=dashboard`
- Params de contexto adicionados pela camada de integracao.

## 5) Roadmap por fases

### Fase 1 (esta entrega)
- Base de dominio unificada.
- API/service layer local.
- Persistencia local para leads/eventos.
- Integracao contextual inicial com Cote Finance AI.
- Migracao das principais paginas para consumir camada de servicos.

### Fase 2
- Backend real (Node + DB relacional).
- Endpoints REST/GraphQL para ofertas, conteudo e eventos.
- Painel admin inicial para ofertas/artigos/SEO.

### Fase 3
- Partner engine (rotas dinamicas + ranking + regras de elegibilidade).
- Attribution analytics e dashboard de funil.
- Sincronizacao ativa com Cote Finance AI.

### Fase 4
- Otimizacao de SEO programatico em escala.
- Experimentacao (A/B) e personalizacao por perfil.
- Governanca LGPD e auditoria de eventos.

## 6) Decisoes desta fase
- Manter UI e rotas existentes.
- Introduzir fundacao sem reescrever o portal.
- Isolar dados/regras em camada de dominio para futura troca por backend real.
