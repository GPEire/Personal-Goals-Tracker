from pathlib import Path

from alembic.config import Config
from alembic.runtime.migration import MigrationContext
from alembic.script import ScriptDirectory
from fastapi import APIRouter, HTTPException
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError

from app.core.database import engine
from app.services.observability import metrics_store

router = APIRouter(tags=["health"])


@router.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@router.get("/health/metrics")
def health_metrics() -> dict[str, dict[str, float | int]]:
    return {"weekly_progress": metrics_store.snapshot()}


@router.get("/health/preflight")
def preflight_health() -> dict[str, str | bool]:
    db_ok, db_error = _check_db_connectivity()
    migrations_ok, current_revision, head_revision = _check_migration_state()

    if not db_ok or not migrations_ok:
        raise HTTPException(
            status_code=503,
            detail={
                "status": "unhealthy",
                "db_connectivity": db_ok,
                "db_error": db_error,
                "migrations_current": current_revision,
                "migrations_head": head_revision,
                "migrations_up_to_date": migrations_ok,
            },
        )

    return {
        "status": "ok",
        "db_connectivity": True,
        "migrations_current": current_revision,
        "migrations_head": head_revision,
        "migrations_up_to_date": True,
    }


def _check_db_connectivity() -> tuple[bool, str]:
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        return True, ""
    except SQLAlchemyError as exc:
        return False, str(exc)


def _check_migration_state() -> tuple[bool, str, str]:
    alembic_ini_path = Path(__file__).resolve().parents[2] / "alembic.ini"
    alembic_cfg = Config(str(alembic_ini_path))
    alembic_cfg.set_main_option("script_location", str(Path(__file__).resolve().parents[2] / "alembic"))

    script = ScriptDirectory.from_config(alembic_cfg)
    heads = set(script.get_heads())

    with engine.connect() as connection:
        context = MigrationContext.configure(connection)
        current = context.get_current_revision()

    return current in heads, current or "none", ",".join(sorted(heads))
