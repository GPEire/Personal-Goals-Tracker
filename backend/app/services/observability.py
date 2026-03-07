from __future__ import annotations

from dataclasses import dataclass
from threading import Lock


@dataclass
class EndpointMetrics:
    total_requests: int = 0
    failed_requests: int = 0
    total_latency_ms: float = 0.0

    @property
    def avg_latency_ms(self) -> float:
        if self.total_requests == 0:
            return 0.0
        return round(self.total_latency_ms / self.total_requests, 2)

    @property
    def error_rate(self) -> float:
        if self.total_requests == 0:
            return 0.0
        return round((self.failed_requests / self.total_requests) * 100, 2)


class InMemoryMetricsStore:
    def __init__(self) -> None:
        self._lock = Lock()
        self._weekly_progress = EndpointMetrics()

    def record_weekly_progress(self, *, latency_ms: float, failed: bool) -> None:
        with self._lock:
            self._weekly_progress.total_requests += 1
            self._weekly_progress.total_latency_ms += latency_ms
            if failed:
                self._weekly_progress.failed_requests += 1

    def snapshot(self) -> dict[str, float | int]:
        with self._lock:
            metrics = self._weekly_progress
            return {
                "total_requests": metrics.total_requests,
                "failed_requests": metrics.failed_requests,
                "avg_latency_ms": metrics.avg_latency_ms,
                "error_rate": metrics.error_rate,
            }


metrics_store = InMemoryMetricsStore()
