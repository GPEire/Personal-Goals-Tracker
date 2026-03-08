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
```

4. Call `POST /auth/request-link` with the user's email.

## Iteration 1 modules
- Auth magic-link development flow (`/auth/request-link`, `/auth/verify`)
- Goal CRUD (`/goals`)
- Goal logs (`POST /logs`, `GET /logs?week_start=YYYY-MM-DD`)
- Weekly progress summaries (`GET /progress/weekly?week_start=YYYY-MM-DD`)
- Weekly progress observability metrics (`GET /health/metrics`)
- Postgres schema via Alembic migration
