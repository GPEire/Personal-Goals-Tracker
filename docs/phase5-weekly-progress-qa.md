# Phase 5 Weekly Progress Manual QA Script

This script validates the weekly-progress use-case narrative end-to-end with seeded fixtures.

## Preconditions
- Backend dependencies installed (`pip install -r backend/requirements.txt`).
- Database configured and migrated (`alembic upgrade head`).
- API running locally on `http://localhost:8000`.

## 1) Seed deterministic fixture data
```bash
cd backend
python scripts/seed_weekly_progress_fixture.py
```
Expected output includes:
- fixture email: `phase5.qa@example.com`
- fixture week start: `2026-01-05`

## 2) Authenticate as fixture user
```bash
curl -s -X POST http://localhost:8000/auth/request-link \
  -H 'Content-Type: application/json' \
  -d '{"email":"phase5.qa@example.com"}'
```
Copy the token from the `message` response.

```bash
curl -s -X POST http://localhost:8000/auth/verify \
  -H 'Content-Type: application/json' \
  -d '{"email":"phase5.qa@example.com","token":"<TOKEN_FROM_PREVIOUS_STEP>"}'
```
Copy `access_token` to `JWT`.

## 3) Validate weekly logs and aggregate progress
```bash
JWT='<paste_access_token_here>'

curl -s "http://localhost:8000/logs?week_start=2026-01-05" \
  -H "Authorization: Bearer $JWT"

curl -s "http://localhost:8000/progress/weekly?week_start=2026-01-05" \
  -H "Authorization: Bearer $JWT"
```
Expected high-level outcomes from `/progress/weekly`:
- `Read` (daily habit): partial completion for elapsed days of fixture week.
- `Workout` (weekly metric target 5): completed value = 3.
- `Publish weekly update` (weekly binary): on-track once completed log exists.

## 4) Validate observability logs and request correlation in deployed environment
Use your hosting provider logs (for example: Vercel Runtime Logs / CloudWatch / Datadog) and filter for `endpoint_request_metric`.

```bash
REQ_ID="qa-phase5-$(date +%s)"

curl -s "http://localhost:8000/progress/weekly?week_start=2026-01-05" \
  -H "Authorization: Bearer $JWT" \
  -H "X-Request-ID: $REQ_ID"
```

Expected in deployed logs for the same `request_id`:
- `event=endpoint_request_metric`
- `endpoint=/progress/weekly`
- `latency_ms`, `status_code`, and `failed` fields are present
- Response includes `X-Request-ID` header matching the submitted value

Repeat with calls to `/auth/request-link`, `/goals`, and `/logs` to confirm endpoint-level metric logs are emitted for all tracked route groups.

## 5) Narrative sign-off checklist
- [ ] User can fetch persisted logs for a selected week.
- [ ] Weekly progress endpoint returns per-goal target, completion, percent, and on-track signal.
- [ ] Endpoint metrics are visible in deployed structured logs with latency/status/error fields (not process memory).
- [ ] `X-Request-ID` is accepted and echoed so requests can be correlated in logs.
