# Superadmin 2 Roadmap

Este documento prepara a remodelagem do superadmin para o funil inteligente da Cote Juros sem alterar Prisma, Supabase ou o admin atual nesta etapa.

## Situação Atual

- O admin principal já usa RBAC com `super_admin`, `admin`, editor, atendimento e papéis auxiliares.
- O painel atual gerencia ofertas, bancos, parceiros, usuários, artigos, SEO, leads de simulação, reativação, email ops, auditoria, saúde e configurações.
- Os leads públicos atuais são gravados principalmente como `SimulationLead`.
- A reativação usa fluxo separado com `ReactivationLead`, token, consentimento, auditoria e entregas.
- Seguros ainda não têm `ProductType insurance` nem tabela própria para cotação.

## Objetivo Do Superadmin 2

Criar uma camada operacional para monetização real do novo front:

- Qualificar leads do Smart Quiz.
- Ver score, perfil, recomendação e consentimento.
- Auditar roteamento para parceiros.
- Medir conversões por evento, parceiro, produto e origem.
- Gerenciar ofertas exibidas no front, inclusive seguros no futuro.

## Telas Futuras

1. Leads inteligentes
   - Lista de leads do Smart Quiz.
   - Origem, score, perfil, recomendação, status e parceiro sugerido.
   - Filtros por produto, risco, score, origem e consentimento.

2. Detalhe do lead
   - Dados de contato.
   - Respostas do quiz.
   - Score calculado.
   - Recomendação principal e secundárias.
   - Histórico de eventos.
   - Entregas/parceiros acessados.
   - Consentimento LGPD.

3. Quiz submissions
   - Respostas brutas e normalizadas.
   - Versão do algoritmo.
   - Data/hora, origem e dispositivo.

4. Recommendations
   - Resultado do algoritmo.
   - Motivo da recomendação.
   - CTA exibido.
   - Partner route sugerida.

5. Partner routing
   - Regras por score, produto, perfil e prioridade.
   - Simulador de roteamento.
   - Fallback por parceiro inativo.

6. Partner deliveries
   - Tentativas de envio.
   - Status, erro, payload sanitizado, resposta e retry.
   - Receita estimada por lead ou conversão.

7. Insurance quotes
   - Cotações de seguro auto, moto, viagem, vida, residencial e proteção financeira.
   - Status de cotação.
   - Parceiro de seguro.
   - Coberturas solicitadas.

8. Tracking events
   - Quiz iniciado/finalizado.
   - Resultado visto.
   - Lead enviado.
   - WhatsApp aberto.
   - Parceiro clicado.
   - Dashboard aberto.

9. Dashboard de conversão
   - Leads por origem.
   - Conversão quiz -> lead.
   - Conversão lead -> parceiro.
   - WhatsApp open rate.
   - Parceiros por receita estimada.
   - Funil por produto.

## Modelos/Tabelas Necessários Futuramente

Não aplicar migration agora. Modelos candidatos:

- `QuizSubmission`
- `Recommendation`
- `ConsentLog`
- `InsuranceQuote`
- `PartnerDelivery`
- `TrackingEvent`
- `CustomerAccount`

Também será necessário avaliar se `ProductType` deve incluir `insurance` ou se seguros terão domínio separado.

## Endpoints Necessários Futuramente

- `POST /api/leads`
- `GET /api/leads/:id`
- `PATCH /api/leads/:id/status`
- `POST /api/quiz/submit`
- `POST /api/recommendations`
- `GET /api/recommendations/:leadId`
- `GET /api/offers/credit`
- `GET /api/offers/insurance`
- `POST /api/insurance/quotes`
- `POST /api/partners/route`
- `POST /api/partners/:id/deliver`
- `POST /api/tracking/events`
- `POST /api/auth/login`
- `GET /api/customer/me`

## Compatibilidade Com O Backend Atual

Até os modelos reais existirem, o novo front deve usar adapters:

- Smart Quiz -> `/api/simulations/quick-credit` quando possível.
- Lead simples -> `/api/simulations`.
- Ofertas crédito/cartão/financiamento -> `/api/offers`.
- Creditas -> `/api/credit/creditas/*`, somente com dados mínimos reais.
- Parceiros -> `/api/partners/redirect` ou `/api/partners/mock-api`.
- Tracking -> `/api/tracking/cta`, `/api/tracking/clicks`, `/api/tracking/integrations`.
- Seguros -> mock visual/API-ready, sem gravar no banco.

## Regras De Segurança

- Não misturar cliente comum com sessão de admin.
- Não expor tokens sensíveis no frontend.
- Não enviar CPF/e-mail fictício para parceiros reais.
- Não prometer aprovação, pré-aprovação, liberação garantida ou menor taxa garantida.
- Preservar `/r/:token` e toda a trilha de reativação separada.

## Próximos Passos

1. Validar o novo front React usando adapters.
2. Medir quais dados realmente precisam persistir.
3. Desenhar migration com impacto e rollback.
4. Criar endpoints reais gradualmente.
5. Ligar o Superadmin 2 aos modelos novos sem quebrar o admin atual.
