from __future__ import annotations

import json
import logging
from time import perf_counter

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

from app.services.observability import REQUEST_ID_HEADER, observed_endpoint, resolve_request_id

logger = logging.getLogger("app.observability")


class RequestObservabilityMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next) -> Response:
        request_id = resolve_request_id(request.headers.get(REQUEST_ID_HEADER))
        request.state.request_id = request_id

        start = perf_counter()
        status_code = 500
        failed = False

        try:
            response = await call_next(request)
            status_code = response.status_code
            failed = status_code >= 500
        except Exception:
            failed = True
            raise
        finally:
            latency_ms = round((perf_counter() - start) * 1000, 2)
            endpoint = observed_endpoint(request.url.path)
            if endpoint:
                payload = {
                    "event": "endpoint_request_metric",
                    "request_id": request_id,
                    "endpoint": endpoint,
                    "method": request.method,
                    "path": request.url.path,
                    "status_code": status_code,
                    "latency_ms": latency_ms,
                    "failed": failed,
                }
                logger.info(json.dumps(payload, sort_keys=True))

        response.headers[REQUEST_ID_HEADER] = request_id
        return response
