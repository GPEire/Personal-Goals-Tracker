from app.services.observability import InMemoryMetricsStore


def test_weekly_progress_metrics_aggregate_latency_and_error_rate():
    metrics = InMemoryMetricsStore()

    metrics.record_weekly_progress(latency_ms=120.0, failed=False)
    metrics.record_weekly_progress(latency_ms=80.0, failed=True)
    metrics.record_weekly_progress(latency_ms=100.0, failed=False)

    snapshot = metrics.snapshot()

    assert snapshot["total_requests"] == 3
    assert snapshot["failed_requests"] == 1
    assert snapshot["avg_latency_ms"] == 100.0
    assert snapshot["error_rate"] == 33.33


def test_weekly_progress_metrics_defaults_to_zero_without_requests():
    snapshot = InMemoryMetricsStore().snapshot()

    assert snapshot == {
        "total_requests": 0,
        "failed_requests": 0,
        "avg_latency_ms": 0.0,
        "error_rate": 0.0,
    }
