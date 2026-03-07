from fastapi import APIRouter

from app.services.observability import metrics_store

router = APIRouter(tags=["health"])


@router.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@router.get("/health/metrics")
def health_metrics() -> dict[str, dict[str, float | int]]:
    return {"weekly_progress": metrics_store.snapshot()}
