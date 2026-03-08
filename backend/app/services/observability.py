from __future__ import annotations

from uuid import uuid4

REQUEST_ID_HEADER = "X-Request-ID"


def resolve_request_id(header_value: str | None) -> str:
    """Return a stable request id, honoring incoming headers when present."""
    normalized = (header_value or "").strip()
    if normalized:
        return normalized
    return uuid4().hex


def observed_endpoint(path: str) -> str | None:
    """Map request paths to the endpoint groups we emit log-based metrics for."""
    if path == "/progress/weekly":
        return "/progress/weekly"
    if path.startswith("/auth/"):
        return "/auth/*"
    if path == "/goals" or path.startswith("/goals/"):
        return "/goals"
    if path == "/logs" or path.startswith("/logs/"):
        return "/logs"
    return None
