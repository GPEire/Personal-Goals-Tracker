#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "DATABASE_URL is required" >&2
  exit 1
fi

if [[ "${DATABASE_URL}" != *"sslmode="* ]]; then
  echo "DATABASE_URL must include sslmode for managed Postgres (for example: sslmode=require)" >&2
  exit 1
fi

echo "Running Alembic migrations against production database..."
alembic upgrade head

echo "Migrations complete."
