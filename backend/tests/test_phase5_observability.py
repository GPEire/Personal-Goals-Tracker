from app.services.observability import REQUEST_ID_HEADER, observed_endpoint, resolve_request_id


def test_resolve_request_id_uses_existing_header_value():
    request_id = resolve_request_id("trace-123")

    assert request_id == "trace-123"


def test_resolve_request_id_generates_uuid_when_header_missing():
    request_id = resolve_request_id(None)

    assert len(request_id) == 32
    assert request_id.isalnum()


def test_observed_endpoint_tracks_required_routes():
    assert observed_endpoint("/progress/weekly") == "/progress/weekly"
    assert observed_endpoint("/auth/request-link") == "/auth/*"
    assert observed_endpoint("/auth/verify") == "/auth/*"
    assert observed_endpoint("/goals") == "/goals"
    assert observed_endpoint("/goals/123") == "/goals"
    assert observed_endpoint("/logs") == "/logs"
    assert observed_endpoint("/logs/123") == "/logs"


def test_observed_endpoint_skips_untracked_paths():
    assert observed_endpoint("/health") is None
    assert REQUEST_ID_HEADER == "X-Request-ID"
