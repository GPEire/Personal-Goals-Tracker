import pytest
from fastapi import HTTPException

from app.routers import health


def test_preflight_health_returns_ok_when_db_and_migrations_are_ready(monkeypatch):
    monkeypatch.setattr(health, "_check_db_connectivity", lambda: (True, ""))
    monkeypatch.setattr(health, "_check_migration_state", lambda: (True, "20260115_000002", "20260115_000002"))

    response = health.preflight_health()

    assert response["status"] == "ok"
    assert response["migrations_up_to_date"] is True


def test_preflight_health_returns_503_when_preflight_fails(monkeypatch):
    monkeypatch.setattr(health, "_check_db_connectivity", lambda: (False, "db unavailable"))
    monkeypatch.setattr(health, "_check_migration_state", lambda: (False, "20260101_000001", "20260115_000002"))

    with pytest.raises(HTTPException) as exc:
        health.preflight_health()

    assert exc.value.status_code == 503
    assert exc.value.detail["db_connectivity"] is False
    assert exc.value.detail["migrations_up_to_date"] is False
