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

## Iteration 1 modules
- Auth magic-link development flow (`/auth/request-link`, `/auth/verify`)
- Goal CRUD (`/goals`)
- Postgres schema via Alembic migration
