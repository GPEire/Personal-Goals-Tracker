# Frontend (PWA React + Vite)

## Run locally

```bash
npm install
npm run dev
```

Open the printed local URL (usually `http://localhost:5173`).

By default, the app calls `http://localhost:8000` in development and `/api` in production.
Set `VITE_API_BASE_URL` to override either environment.


## Vercel frontend project env (required)

Configure these in the **frontend Vercel project**:

- `VITE_API_BASE_URL`
  - Production: `https://<your-domain>/api` (monorepo single project) or backend project URL (two-project setup).
  - Preview: set to the matching preview API URL so preview frontend calls preview backend.

## Implemented in phase 3

- Auth bootstrap flow with request/verify magic-link token and JWT persistence.
- Goals pulled from `GET /goals`.
- Progress actions emit logs via `POST /logs`.
- Progress tab backed by `GET /progress/weekly` plus weekly logs.
- Explicit `On track / At risk / Behind` badges.

## Testing

```bash
npm run test
npm run build
```
