# Personal Goals Tracker

Refocused Iteration 1 for the Personal Resolution Tracker (2026) MVP.

## Original PRD status
The original PRD intent is still preserved, but this first iteration has been intentionally narrowed to **UI-only** so you can validate the in-app experience before adding backend complexity.

## Iteration 1 (Reset): UI-only scope
### Included
- Frontend scaffold as installable PWA (React + Vite).
- In-app experience with 3 tabs: Today, Goals, History.
- Local-only goal interactions (add/delete) to validate UX flows.
- No login required; app opens directly into the main experience.

### Explicitly deferred
- Authentication / magic link login.
- Backend APIs and server integration.
- Database persistence and migrations.
- Notifications/reminders infrastructure.
- Production data sync and history logging.

## Repo structure
- `frontend/` – PWA client used for Iteration 1.
- `backend/` – deferred for later iteration after UX validation.


## Vercel deployment (monorepo)

This repo ships with a root `vercel.json` for a single Vercel project deployment:

- Frontend is built from `frontend/` with Vite static output (`dist/`).
- Backend API is served from `backend/app/main.py` via the Vercel Python runtime.
- `/api/*` is rewritten to the backend app, while all other routes fall back to the frontend SPA.

### Two-project fallback (if monorepo routing is unstable)

If routing/build behavior is inconsistent in your Vercel team setup, split into two Vercel projects:

1. **Frontend project**
   - Root directory: `frontend`
   - Build command: `npm run build`
   - Output directory: `dist`
   - Env: `VITE_API_BASE_URL=https://<your-backend-domain>`

2. **Backend project**
   - Root directory: `backend`
   - Runtime entrypoint: `app/main.py`
   - Expose API under its own domain (for example `https://tracker-api.vercel.app`).

This isolates build pipelines and avoids cross-project routing edge cases.

### Required Vercel environment variables

When deploying with two Vercel projects, configure env vars explicitly per project:

- **Backend project**
  - `DATABASE_URL`
  - `JWT_SECRET`
  - `ENVIRONMENT`
  - `FRONTEND_URL` (production frontend URL)
  - `ALLOWED_ORIGINS` (comma-separated list including both production and preview frontend domains)
    - Example: `https://tracker.vercel.app,https://tracker-git-feature-team.vercel.app`
  - `EMAIL_PROVIDER`, `EMAIL_API_KEY`, `EMAIL_FROM` (if using Resend)

- **Frontend project**
  - `VITE_API_BASE_URL` (point prod frontend to prod backend API, and preview frontend to preview backend API)

`localhost` origins are added automatically only in backend `development`/`local`/`test` environments and should not be included in deployed `ALLOWED_ORIGINS`.



## Backend production migrations

Before every production deploy, run `backend/scripts/predeploy_migrate.sh` with the production `DATABASE_URL` (including SSL settings such as `sslmode=require`) so schema upgrades are repeatable and gated before rollout. See `backend/README.md` for rollback and preflight health check details.
