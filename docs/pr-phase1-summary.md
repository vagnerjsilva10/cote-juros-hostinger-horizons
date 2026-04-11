# PR - Phase 1 Foundation (Portal Escalavel)

## Summary
This PR starts the architecture transition from a static frontend MVP to a scalable financial platform foundation integrated with Cote Finance AI.

## What was implemented

### 1. Domain and data foundation
- Added unified domain contracts and seed-based catalog.
- Added normalized entities for banks, products, offers, categories, articles, SEO pages, testimonials, app integration sources.

### 2. API/service foundation
- Added `portalApi` as application service entrypoint.
- Added repository layer with filtering and local persistence for leads/events.
- Added services for tracking, partner redirect registration, and simulation funnel.

### 3. Cote Finance AI integration layer
- Added URL builder + redirect orchestration with source/utm/campaign/simulation context.
- Added integration event tracking.
- Connected Cote Finance AI page CTA to real app redirect flow.

### 4. Frontend migration away from UI hardcode
- Migrated SEO route source in `App.jsx` to centralized seed.
- Migrated Home testimonials to centralized seed.
- Migrated key business pages to `portalApi` data flow:
  - Loans (`EmprestimosPage`)
  - Cards (`CartoesPage`)
  - Financing (`FinanciamentoPage`)
  - Blog (`BlogPage`)
- Simulation modal and diagnostic flow now persist lead/funnel data through service layer.

### 5. Architecture documentation
- Added phase architecture report:
  - `docs/phase1-architecture-report.md`

## Build/validation
- `npm run build` passes.
- `npm run lint` unavailable in this environment (`eslint` command not found locally).

## Next phase recommended
1. Stand up real backend (Node + DB) and replace local repository storage.
2. Introduce admin/CMS APIs for offers/articles/SEO pages.
3. Implement partner routing rules and attribution dashboards.
4. Add server-side tracking pipeline and observability.
