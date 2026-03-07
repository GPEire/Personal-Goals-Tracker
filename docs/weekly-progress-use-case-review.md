# Weekly Progress Use Case Review

## Use case
**As a goal setter, I want to check my progress for the week of my goals so that I know if I’m on track.**

## Codebase findings

### Frontend completeness
1. The current UI is primarily local-state driven and seeded from hard-coded constants (`INITIAL_GOALS`, `HISTORY`, `TODAY_IDX`), which means weekly progress is currently a static/mock representation rather than persisted user data.
2. Goal actions (toggle, increment/decrement, add) only update in-memory React state and do not persist across refreshes.
3. A “progress” view exists and visually shows weekly dots and summary cards, but its percentages and trend metrics are hard-coded (`73%`, `68%`) and not computed from real backend logs.
4. Reminder preferences are editable in the UI but currently have no save handler that calls an API.
5. An API helper (`frontend/src/api.js`) exists with JWT bearer support, but no frontend code currently imports or uses it.

### Backend/database completeness
1. Backend app wiring is present (`/auth`, `/goals`, and health routes) and CORS is configured for the frontend origin.
2. Goal CRUD endpoints are implemented with per-user scoping via JWT-derived user context.
3. Auth flow is MVP/dev-only magic-link with in-memory token storage, and therefore not durable across backend restarts.
4. Database models and migration include `users`, `goals`, `logs`, and `reminder_jobs`, so the schema can store weekly progress evidence (`logs`).
5. There are no `logs` read/write API endpoints yet, and no backend endpoint for weekly rollups/analytics (e.g., “week status per goal”).

## Gap assessment for this use case
To support “check my weekly progress and know if I’m on track,” the current stack is **partially complete**:
- ✅ UI concept exists for weekly progress visualization.
- ✅ DB schema has the core entities needed to store completion evidence.
- ⚠️ Missing persistent data flow from frontend interactions to backend logs.
- ⚠️ Missing backend aggregation endpoint to calculate “on track” status per goal.
- ⚠️ Missing frontend integration/auth session flow to fetch real weekly progress.

## Implementation plan

### Phase 1 — Data model and API contract
1. **Define progress semantics per frequency/type**
   - Daily binary: expected completions in week = number of elapsed days in week.
   - Weekly binary: expected completions in week = 1.
   - Count goals: expected completions in week = goal target (or prorated if daily metric).
2. **Add log endpoints**
   - `POST /logs` (create a completion/progress event for a goal/date/value).
   - `GET /logs?week_start=YYYY-MM-DD` (raw events for debugging and timeline rendering).
3. **Add weekly progress endpoint**
   - `GET /progress/weekly?week_start=YYYY-MM-DD`
   - Response per goal: `{ completed, target, percent, on_track, daily_breakdown[] }`.

### Phase 2 — Backend implementation
1. Create `LogCreate`, `LogResponse`, and `WeeklyProgressResponse` schemas.
2. Add `logs` and `progress` routers.
3. Implement SQL queries grouped by goal + week boundary using user timezone.
4. Compute `on_track` rules in one service layer function to keep business logic centralized.
5. Add tests for:
   - daily goals mid-week,
   - weekly goals,
   - count goals,
   - missing data/zero-activity weeks.

### Phase 3 — Frontend integration
1. Add auth bootstrap flow (request/verify token) and store JWT.
2. Replace hard-coded goals with `GET /goals` data and map backend goal types/frequencies consistently.
3. Record user progress actions by calling `POST /logs` when toggling binary or adjusting count goals.
4. Replace hard-coded `HISTORY` and summary cards with data from `GET /progress/weekly`.
5. Add explicit “On track / At risk / Behind” badges in the progress tab.

### Phase 4 — UX refinements for decision support
1. Add week selector (current week + previous week comparisons).
2. Show actionable guidance per goal (e.g., “2 remaining by Sunday”).
3. Handle incomplete weeks by distinguishing “projected on track” vs “final result.”

### Phase 5 — rollout and observability
1. Add migration if extra columns are needed (e.g., log_date separate from created_at).
2. Add API metrics/logging for weekly-progress endpoint latency and error rates.
3. Validate end-to-end with seeded fixtures and one manual QA script covering the use case narrative.


## Phase 1 implementation status
- ✅ Added `POST /logs` and `GET /logs?week_start=YYYY-MM-DD` backend routes for recording and retrieving weekly goal events.
- ✅ Added `GET /progress/weekly?week_start=YYYY-MM-DD` backend route returning per-goal weekly totals, target, percent, on-track status, and a 7-day breakdown.
- ✅ Implemented initial semantics in service code:
  - daily + binary goals target elapsed days in the requested week,
  - weekly + binary goals target one completion,
  - metric goals use summed `value`, with daily metrics prorated by elapsed days.
- ℹ️ The backend is already configured for PostgreSQL by default (`postgresql+psycopg://...`), so Postgres is the correct DB choice for this plan.


## Phase 2 implementation status
- ✅ Added centralized progress business logic helpers in `app.services.progress`, including explicit `_is_on_track` evaluation.
- ✅ Updated weekly boundary handling to honor the requesting user’s timezone when translating `week_start` into UTC query boundaries.
- ✅ Updated `POST /logs`, `GET /logs`, and `GET /progress/weekly` to use timezone-aware week semantics.
- ✅ Added backend unit tests for:
  - daily binary goals mid-week,
  - weekly binary goals,
  - count/metric goals,
  - zero-activity weeks,
  - timezone-aware weekly boundaries.

## Phase 3 implementation status
- ✅ Added frontend auth bootstrap for magic-link request and token verification, persisting the JWT in local storage for subsequent API calls.
- ✅ Replaced static goals with backend-backed `GET /goals` loading.
- ✅ Wired progress actions to `POST /logs` (binary toggle and metric +1 actions).
- ✅ Replaced static weekly history/summary with backend `GET /progress/weekly` and weekly logs.
- ✅ Added explicit per-goal status badges: `On track`, `At risk`, and `Behind`.
- ✅ Added frontend utility tests covering week boundary logic, status badge thresholds, and status rollups.
