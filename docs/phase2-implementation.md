# Phase 2 - Persistence and Tracking Foundation

## What was implemented

Phase 2 introduces the first real backend data layer without breaking the current portal UX:

- New API app in `apps/api` with Express + Prisma
- Prisma schema and initial SQL migration for core entities
- Domain service modules for offers, articles, simulation, tracking, partner redirects, and app integration
- Frontend `portalApi` updated to support remote API via `VITE_API_BASE_URL` with local fallback
- Simulation flow continues working and now persists through API when available
- Offer click flow now records tracking and redirects to partner destination

## Database entities added

- `banks`
- `financial_products`
- `offers`
- `categories`
- `articles`
- `simulation_leads`
- `click_events`
- `cta_events`
- `app_integration_events`
- `partner_redirects`

## API routes added

- `GET /api/offers`
- `GET /api/offers/:id`
- `GET /api/articles`
- `GET /api/articles/slug/:slug`
- `GET /api/articles/category/:category`
- `POST /api/simulations`
- `GET /api/simulations/:id`
- `POST /api/tracking/clicks`
- `POST /api/tracking/cta`
- `POST /api/tracking/integrations`
- `POST /api/partners/redirect`
- `POST /api/integration/app-link`

## Environment variables

### API (`apps/api/.env`)

- `PORT` (default `4100`)
- `CORS_ORIGIN`
- `DATABASE_URL`
- `DIRECT_URL`

### Web (`apps/web/.env`)

- `VITE_API_BASE_URL` (optional, ex: `http://localhost:4100`)

If `VITE_API_BASE_URL` is not defined, frontend automatically uses local repository/seed fallback.

## Migration instructions

1. Install dependencies in root and api workspace.
2. Copy `apps/api/.env.example` to `apps/api/.env` and set Supabase/Postgres credentials.
3. Run:
   - `npm run prisma:generate --prefix apps/api`
   - `npm run prisma:migrate --prefix apps/api`
4. Start API:
   - `npm run dev --prefix apps/api`
5. Optional: connect frontend to API:
   - create `apps/web/.env` with `VITE_API_BASE_URL=http://localhost:4100`

## Notes

- Frontend routes/pages were preserved.
- Build remains compatible with fallback mode.
- Data contracts are now ready for future admin/CMS and partner dashboard phases.
