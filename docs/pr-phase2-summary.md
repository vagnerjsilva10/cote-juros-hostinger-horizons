# PR - Phase 2 Persistence Infrastructure

## Summary

This PR continues the platform evolution from static frontend MVP into a scalable financial portal architecture with persistent backend foundation.

## Architecture highlights

- Added `apps/api` backend (Express + Prisma)
- Added relational Prisma schema and initial migration
- Added service layer modules:
  - `OfferService`
  - `ArticleService`
  - `SimulationService`
  - `TrackingService`
  - `PartnerService`
  - `AppIntegrationService`
- Added API routing for offers, articles, simulations, tracking, partner redirects, and app deep links
- Updated frontend service adapter (`portalApi`) to support remote API + safe fallback

## Product impact

- Simulation leads can be persisted in database via API
- Click and CTA tracking are now infrastructure-ready
- Partner redirects are centralized and traceable
- Cote Finance AI deep links can be generated with context

## Frontend compatibility

- Existing routes and pages were preserved
- Comparison pages now track click then redirect
- If API is unavailable, frontend keeps working with local seed repository

## Changed files (high level)

- New: `apps/api/**`
- Updated: `apps/web/src/platform/services/portalApi.js`
- Updated: `apps/web/src/platform/services/partnerRedirectService.js`
- Updated: `apps/web/src/platform/integrations/coteFinanceAI.js`
- Updated: `apps/web/src/pages/EmprestimosPage.jsx`
- Updated: `apps/web/src/pages/CartoesPage.jsx`
- Updated: `apps/web/src/pages/FinanciamentoPage.jsx`
- Added: `apps/web/.env.example`
- Added: `docs/phase2-implementation.md`

## Next recommended phase

1. Add authentication and role model for admin users
2. Build admin panel for offers/articles/SEO pages
3. Add CMS workflow for editorial content
4. Add partner dashboard with click/conversion metrics
5. Add anti-fraud and deduplication on lead pipeline
