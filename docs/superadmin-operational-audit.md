# SuperAdmin Operational Audit

Data: 2026-04-28

## Resumo executivo

O SuperAdmin ja tem uma base real de SaaS: autenticacao com sessao HTTP-only, RBAC, audit log, CRUD de bancos/ofertas/parceiros/artigos/usuarios/leads e endpoints publicos que leem banco para ofertas, artigos, afiliados, parceiros, leads e tracking.

O principal problema e que o site publico ainda nao tem o SuperAdmin como fonte unica da verdade. A aplicacao web mistura quatro origens:

- codigo hardcoded em paginas e componentes;
- seeds locais em `apps/web/src/data` e `apps/web/src/platform/seed`;
- localStorage via `portalRepository`;
- API/banco via `portalApi`.

Na pratica, algumas telas do admin salvam no banco e refletem no site publico quando `VITE_API_BASE_URL`/dominio remoto esta ativo. Outras telas salvam apenas no navegador local e nao controlam a operacao real. Alem disso, varias paginas publicas possuem copy, CTAs, secoes, menus, disclaimers, filtros e SEO fixos em codigo.

## Rotas publicas mapeadas

Fonte principal: `apps/web/src/App.jsx`.

- `/`: Home.
- `/emprestimos`: comparador de credito/parceiros.
- `/cartoes` e `/cartoes-de-credito`: comparador de cartoes.
- `/financiamentos` e `/financiamento`: financiamento.
- `/ofertas` e `/parceiros`: ofertas afiliadas/parceiros.
- `/ferramentas`: ferramentas financeiras.
- `/calculadora-cet`: calculadora CET.
- `/simulador-comprometimento-renda`: simulador.
- `/estudos/custo-emprestimo-negativado-2026`: estudo editorial.
- `/diagnostico-financeiro`: diagnostico.
- `/blog`: listagem de artigos.
- `/blog/:articleSlug`: artigo.
- rotas WordPress migradas vindas de `wordpressMigratedArticles`.
- `/como-funciona`, `/sobre-nos`, `/contato`, `/perguntas-frequentes`, `/faq`.
- `/politica-de-privacidade`, `/termos-de-uso`.
- `/cote-finance-ai`, `/motion-hero`.
- `/resultado` e `/proxima-etapa`.
- `/r/:token`: reativacao.
- landing pages fixas: `/emprestimo-para-negativado`, `/emprestimo-para-clt`, `/emprestimo-para-autonomo`.
- programaticas: `/comparar`, `/bancos`, `reservedSeoStaticPaths`, `/comparar/:comparisonSlug`, `/banco/:bankSlug`, `/cartao/:cardSlug`.
- landing SEO dinamicas vindas de `portalApi.getSeoPages()`, mas com fallback seed/local.

## Pagina por pagina

### Home

Arquivo: `apps/web/src/pages/HomePage.jsx`.

Hardcoded:
- `CONSENT_TEXT`, etapas do quiz, campos de contato, cards de categorias, motivos de comparacao, produtos em destaque, recomendacoes editoriais, conteudos sugeridos, FAQ, copy do hero, textos de resultado e disclaimers.
- CTAs e links internos dos cards.
- Logica de score/resultado do quiz em codigo.

Conectado:
- captura/continuidade do lead passa por `submitQuickCreditApplication` e `trackingService`.
- SEO usa `brandPages.home`, tambem hardcoded em `brandSeo.js`.

Deveria vir do SuperAdmin:
- hero, CTAs, cards, categorias exibidas, beneficios, FAQs, disclaimer/LGPD, secoes e ordem.
- regras editoriais do quiz se forem negocio, ou pelo menos os textos/labels/opcoes.

Risco:
- alteracoes no admin de settings, SEO ou conteudo nao alteram a Home hoje.

### Emprestimos

Arquivo: `apps/web/src/pages/EmprestimosPage.jsx`.

Hardcoded:
- filtros (`situationOptions`, `amountOptions`, `creditTypeOptions`, `clientTypeOptions`).
- fallback SuperSim completo com URL, copy, destaques e CTA.
- hero, disclaimer e textos da pagina.

Conectado:
- `portalApi.matchCreditPartners(profile)` chama `/api/partners/match`.
- clique chama `portalApi.trackIntegration` e `partnerRedirectService.create`.
- matcher da API usa `partner_configs`, mas tambem tem `SUPERSIM_PARTNER` hardcoded em `PartnerMatcherService`.

Deveria vir do SuperAdmin:
- filtros e labels, parceiros, prioridades, regras de elegibilidade, copy dos cards, CTA, disclaimers e fallback.

Risco:
- SuperSim existe em dois hardcodes: frontend e API. Mesmo que o admin altere o parceiro, parte do comportamento ainda pode cair no fallback antigo.

### Cartoes

Arquivo: `apps/web/src/pages/CartoesPage.jsx`.

Hardcoded:
- imagens/paletas por banco, filtros de categoria/beneficios, ordenacao, hero e CTAs.

Conectado:
- `portalApi.getOffers({ productType: 'credit_card' })`, via `/api/offers` quando remoto.
- fallback local usa `creditCardsData`/`portalSeed`.

Deveria vir do SuperAdmin:
- cards, imagens, beneficios, categorias, ordem, CTAs, link de afiliado/parceiro, filtros ativos.

Risco:
- admin de ofertas salva campos basicos, mas nao cobre bem campos especificos de cartao (`annualFee`, `maxLimit`, beneficios, imagem) no banco atual de `Offer`; o frontend normaliza alguns valores com fallback.

### Financiamentos

Arquivo: `apps/web/src/pages/FinanciamentoPage.jsx`.

Hardcoded:
- hero, CTAs, texto explicativo das abas, categorias de abas `Carro/Moto` versus demais, card final.

Conectado:
- `portalApi.getOffers({ productType: 'financing' })`.

Deveria vir do SuperAdmin:
- tipos de financiamento, textos das abas, FAQs, disclaimers, CTAs, parceiros/cards e regras.

Risco:
- admin de ofertas cobre taxas/prazos/valores, mas nao todos os campos de financiamento como entrada minima/maxima de forma persistida no schema atual de `Offer`.

### Blog

Arquivos: `BlogPage.jsx`, `BlogArticlePage.jsx`, `lib/content/articles.js`.

Hardcoded:
- hero do blog, textos de secao, recomendacoes de layout, bibliotecas comerciais/external sources em `BlogArticlePage`.

Conectado:
- `portalApi.getArticles()` e `getArticleBySlug()` usam `/api/articles` quando remoto.
- API serializa `structuredContent` se existir.

Deveria vir do SuperAdmin:
- categorias/tags, imagens, SEO, links internos, CTA interno, schema/structured content, status indexavel.

Risco:
- editor admin de artigos e simples: textarea de conteudo, resumo, SEO basico e imagem. Nao edita estrutura rica que o artigo publico espera (`sections`, `intro`, `faq`, `internalLinks`, `cta`).

### Sobre, Como Funciona, FAQ, Politicas, Termos, Contato

Arquivos: `SobreNosPage.jsx`, `ComoFuncionaPage.jsx`, `FaqPage.jsx`, `PoliticaPrivacidadePage.jsx`, `TermosUsoPage.jsx`, `ContatoPage.jsx`.

Hardcoded:
- praticamente todo o conteudo: hero, secoes, valores, passos, perguntas, textos legais e contato.

Conectado:
- SEO usa `brandPages`, tambem fixo.

Deveria vir do SuperAdmin:
- paginas institucionais como conteudo editavel, com versao/publicacao e audit log.

### Ferramentas, Resultado, Proxima etapa, Landing pages

Hardcoded:
- calculadoras e textos de apoio em `FerramentasPage`, `CalculadoraCetPage`, `SimuladorComprometimentoRendaPage`.
- `/resultado` e `/proxima-etapa` tem copy, cards e disclaimers hardcoded.
- landing pages de perfil em `App.jsx` passam props fixas.

Conectado:
- resultado busca parceiros por `portalApi.matchCreditPartners()` quando nao ha resultado no state.
- tracking/redirect de parceiros e real quando API esta ativa.

Deveria vir do SuperAdmin:
- copy, CTAs, disclaimers, parceiros exibidos, regras, SEO e landing page builder simples.

## Header, footer e SEO global

Arquivos:
- `Header.jsx`
- `Footer.jsx`
- `seoNavigation.js`
- `brandSeo.js`

Hardcoded:
- menus, footer, links legais, CTA do header, marca, dominio, URLs canonicas, logo, OG default e metas das paginas principais.

Conectado:
- nao ha leitura de settings/admin para header/footer/brand SEO.

Deveria vir do SuperAdmin:
- identidade da marca, dominio, SEO padrao, logo/favicons, header/footer, labels, ordem, ativos/inativos, CTAs e disclaimers globais.

## SuperAdmin atual

Rotas:
- `/admin/login`
- `/admin`
- `/admin/offers`
- `/admin/banks`
- `/admin/partners`
- `/admin/users`
- `/admin/articles`
- `/admin/seo-pages`
- `/admin/leads`
- `/admin/reactivation`
- `/admin/email-ops`
- `/admin/testimonials`
- `/admin/audit`
- `/admin/health`
- `/admin/settings`

Auth:
- `AdminAuthGuard` chama `/api/admin/auth/session` e `/api/admin/auth/login`.
- cookie HTTP-only `cj_admin_session`.
- login atual so pede senha no frontend, mas API aceita email opcional e usa `ADMIN_BOOTSTRAP_EMAIL || admin@cotejuros.com.br`.

Permissoes:
- schema possui `AdminRole`, `AdminPermission`, `AdminRolePermission`, `AdminUserRole`.
- `adminAuth.js` define roles/permissions e `requirePermission`.
- roles documentadas/pedidas existem conceitualmente: `super_admin`, `admin`, `editor`, `viewer`.

Modulos com backend real:
- Dashboard: `/api/admin/dashboard`.
- Health: `/api/admin/health`.
- Audit: `/api/admin/audit`.
- Users/Roles: `/api/admin/users`, `/api/admin/roles`.
- Banks: `/api/admin/banks`.
- Offers: `/api/admin/offers`.
- Partners: `/api/admin/partners`.
- Articles: `/api/admin/articles`.
- Leads: `/api/admin/leads` e detalhes/acoes.
- Email Ops/Reactivation: modulo amplo e conectado a tabelas de reativacao.

Modulos parcialmente/falsamente operacionais:
- Settings: usa apenas `portalRepository`/localStorage no frontend; nao ha endpoint `/api/admin/settings` nem tabela de site settings.
- Testimonials: usa apenas `portalRepository`/localStorage; nao ha modelo Prisma `Testimonial`.
- SEO Pages: admin usa `portalRepository`/localStorage; o publico consome `portalApi.getSeoPages()` que cai no mesmo repositorio local porque nao ha endpoint remoto implementado.

UX/funcionalidade:
- ha loading/error em alguns modulos (`Dashboard`, `Partners`, `Leads`, `Health`, `Audit`).
- `Offers`, `Articles`, `SeoPages`, `Banks`, `Settings`, `Testimonials` tem pouco tratamento de loading/erro.
- acoes destrutivas nem sempre confirmam; `Partners` confirma status, `Offers/Articles/SeoPages/Banks` nao confirmam.
- validacao e basica; muitos formularios dependem de `required` HTML ou nenhum schema no frontend.
- preview praticamente ausente, exceto operacoes de email.

## Banco/API mapeados

Modelos relevantes existentes:
- Catalogo: `Bank`, `Category`, `FinancialProduct`, `Offer`, `Article`.
- Parceiros/afiliados: `PartnerConfig`, `AffiliateNetwork`, `AffiliateProgram`, `AffiliateOffer`, `AffiliateClick`, `PartnerRedirect`.
- Leads/simulacoes/tracking: `SimulationLead`, `CreditLead`, `CreditProviderSession`, `CreditSimulation`, `CreditOfferSnapshot`, `CreditConversion`, `CreditOfferClick`, `ClickEvent`, `CtaEvent`, `AppIntegrationEvent`.
- Reativacao: `ReactivationLead`, audit/events/deliveries/suppressions/campaigns/templates/flows.
- Admin/RBAC: `AdminUser`, `AdminRole`, `AdminPermission`, `AdminRolePermission`, `AdminUserRole`, `AdminSession`, `AdminLoginAttempt`, `AdminPasswordResetToken`, `AdminAuditLog`.
- Operacao: `FeatureFlag`, `LeadTag`, `LeadOwnerAssignment`, `LeadNote`, `LeadRoutingDecision`, `LeadDeliveryAttempt`, `LeadSuppression`, `LeadScoreSnapshot`, `RevenueEvent`, `PayoutEvent`, `PartnerPayoutRule`, `IntegrationHealthCheck`, `PlatformAlert`.

Faltam modelos/tabelas claros para:
- `SiteSettings`/identidade visual/scripts/disclaimers globais.
- `NavigationMenu` e `NavigationLink`.
- `SitePage` e `SiteSection` para Home/institucionais/landing pages.
- `FaqItem` reutilizavel.
- `CtaBlock`.
- `LegalDisclaimer`/compliance.
- `SeoMeta` por pagina, canonical, robots, OG.
- `Testimonial` se depoimentos continuarem.

Endpoints publicos existentes:
- `/api/banks`
- `/api/offers`
- `/api/articles`
- `/api/simulations`
- `/api/tracking`
- `/api/partners`
- `/api/integration`
- `/api/credit`
- `/api/affiliates`
- `/api/reactivation`

Endpoints admin existentes:
- `/api/admin/auth/*`
- `/api/admin/dashboard`
- `/api/admin/health`
- `/api/admin/audit`
- `/api/admin/users`, `/api/admin/roles`
- `/api/admin/banks`
- `/api/admin/offers`
- `/api/admin/partners`
- `/api/admin/articles`
- `/api/admin/leads`
- `/api/admin/email-ops/*`

## O que ja funciona

- Auth admin com cookie seguro, bootstrap de superadmin e rate-limit basico de falhas.
- RBAC no backend com `requirePermission`.
- Audit log para bancos, ofertas, parceiros, artigos, usuarios, leads e senha.
- CRUD real para bancos/ofertas/parceiros/artigos/usuarios/leads.
- Publico consegue ler bancos/ofertas/artigos/afiliados/parceiros do banco quando API remota esta configurada.
- Partner matcher usa `partner_configs` e respeita status/produtos/prioridade.
- Redirecionamento de parceiro e cliques afiliados geram registros.
- Leads/simulacoes possuem modelos ricos e modulo admin forte.
- Reativacao/email ops e uma area mais madura que o restante do SuperAdmin.

## O que parece visual mas nao funciona como centro operacional

- Configuracoes globais do site: localStorage apenas, nao controla header/footer/SEO publico.
- Depoimentos: localStorage apenas.
- Paginas SEO do admin: localStorage apenas, sem endpoint/API persistente.
- Header/footer: totalmente controlados por codigo.
- Home/institucionais/landing pages: nao controladas pelo admin.
- Parte do catalogo de cartoes/financiamentos depende de campos que o schema/admin ainda nao modela bem.
- SuperSim tem fallback hardcoded e pode sobreviver mesmo desativado no admin.

## Dados duplicados

- SuperSim: frontend `EmprestimosPage`, API `PartnerMatcherService`, seed de afiliados.
- Bancos/ofertas/artigos: seeds em `apps/web/src/data`, `portalSeed`, banco API.
- SEO: `brandSeo.js`, `seoCatalog.js`, `portalSeed.seoPages`, admin local de SEO pages.
- Navegacao: `seoNavigation.js` e rotas em `App.jsx`.
- Disclaimers/LGPD: Home, Emprestimos, Footer, Resultado e paginas legais.

## Riscos antes de implementar

- Migrar tudo de uma vez pode quebrar trafego publico; precisa fallback por endpoint e pagina.
- Remover seeds cedo demais pode deixar paginas vazias em ambiente sem API.
- Alterar `Offer` sem cuidar de cartao/financiamento pode perder campos comerciais importantes.
- Permissoes existem no backend, mas o frontend ainda mostra menus sem checar capabilities.
- Conteudo estruturado de blog nao cabe no formulario atual.
- Site publico depende de rotas programaticas/SEO; qualquer mudanca no roteamento precisa preservar URLs.

## Proposta de evolucao segura

### Etapa A - Fundacao de conteudo operacional

Criar modelos e endpoints para:
- `SiteSetting`
- `NavigationItem`
- `SitePage`
- `SiteSection`
- `FaqItem`
- `CtaBlock`
- `LegalDisclaimer`
- `SeoMeta`

Comecar por leitura publica com fallback seguro e admin CRUD minimo com audit log.

### Etapa B - Conectar o que tem maior impacto

1. Header/footer/SEO global.
2. Disclaimers globais e LGPD.
3. Home: hero, CTAs, categorias/cards, FAQs.
4. Emprestimos: remover fallback duplicado do frontend e usar partner matcher/config.
5. Parceiros: garantir SuperSim 100% controlavel por `partner_configs`.

### Etapa C - Completar produtos

Expandir modelo de ofertas ou criar detalhes por produto para:
- cartoes: anuidade, limite, beneficios, imagem, emissor, link.
- financiamento: entrada minima/maxima, tipo, garantias, observacoes.
- emprestimos: requisitos, elegibilidade, destaques, disclaimers.

### Etapa D - CMS/SEO real

Substituir SEO Pages localStorage por API/banco.
Evoluir artigos para structured content editavel.
Criar preview.

### Etapa E - Qualidade SaaS

Unificar estados de loading/error/empty, confirmacoes, validacao com schema, permissao visual no menu, feedback e audit log completo.

## Criterio de aceite para proximas implementacoes

Uma tela do SuperAdmin so deve existir se:
- salva no banco/API, nao apenas localStorage;
- tem permissao backend;
- gera audit log em mudancas importantes;
- possui loading/empty/error;
- possui validacao e feedback;
- quando publica, altera visivelmente o site publico ou fica marcada como rascunho/interna.

