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
