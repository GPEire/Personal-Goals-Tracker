# Frontend (PWA React + Vite)

## Run locally

```bash
npm install
npm run dev
```

Open the printed local URL (usually `http://localhost:5173`).

Set `VITE_API_BASE_URL` if your backend is not on `http://localhost:8000`.

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
