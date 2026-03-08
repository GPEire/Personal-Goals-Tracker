# Backend (FastAPI)

## Run locally

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
alembic upgrade head
uvicorn app.main:app --reload
```

## Production migration strategy (safe + repeatable)

Use a **CI/CD pre-deploy migration job** before every backend rollout.

1. Export the production `DATABASE_URL` (must include `sslmode=require` or stricter).
2. Run `backend/scripts/predeploy_migrate.sh`.
3. Deploy only when migrations succeed.
4. Gate rollout with `GET /health/preflight` so traffic shifts only if DB connectivity and migration version are healthy.

### Deployment command

```bash
cd backend
DATABASE_URL='postgresql+psycopg://<user>:<pass>@<host>:5432/<db>?sslmode=require' ./scripts/predeploy_migrate.sh
```

### Rollback guidance for failed migrations

- If `alembic upgrade head` fails, **stop deployment** and keep serving the previous app version.
- Identify the current DB revision with:

```bash
cd backend
alembic current
alembic history --verbose
```

- Roll back to the previous known-good migration:

```bash
cd backend
alembic downgrade -1
```

- If the migration is non-reversible, restore the database from a pre-deploy backup/snapshot and redeploy the previous app artifact.
- After recovery, fix migration scripts and re-run `alembic upgrade head` in staging before production.

## Auth email provider setup

The auth flow now sends magic-link emails through a pluggable provider.

### Configuration

Set these environment variables in `backend/.env`:

- `ENVIRONMENT`: `development`, `local`, `test`, `staging`, or `production`.
  - `development`, `local`, and `test` keep the token-in-response fallback for easier local testing.
  - Other environments require provider delivery.
- `EMAIL_PROVIDER`: `console` or `resend`.
- `EMAIL_API_KEY`: required when `EMAIL_PROVIDER=resend`.
- `EMAIL_FROM`: required when `EMAIL_PROVIDER=resend` (must be a verified sender in Resend).
- `FRONTEND_URL`: used to build the sign-in link included in the email.

### Resend quick start

1. Create a Resend account and verify a sending domain or sender address.
2. Generate an API key in the Resend dashboard.
3. Configure:

```env
ENVIRONMENT=production
EMAIL_PROVIDER=resend
EMAIL_API_KEY=re_xxxxxxxxxxxxxxxxx
EMAIL_FROM=auth@yourdomain.com
FRONTEND_URL=https://your-frontend.example.com
DATABASE_URL=postgresql+psycopg://<user>:<pass>@<host>:5432/<db>?sslmode=require
```

4. Call `POST /auth/request-link` with the user's email.

## Iteration 1 modules
- Auth magic-link development flow (`/auth/request-link`, `/auth/verify`)
- Goal CRUD (`/goals`)
- Goal logs (`POST /logs`, `GET /logs?week_start=YYYY-MM-DD`)
- Weekly progress summaries (`GET /progress/weekly?week_start=YYYY-MM-DD`)
- Weekly progress observability metrics (`GET /health/metrics`)
- Deployment preflight check (`GET /health/preflight`)
- Postgres schema via Alembic migration
