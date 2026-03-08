from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings
from app.middleware.observability import RequestObservabilityMiddleware
from app.routers import auth, goals, health, logs, progress

settings = get_settings()
app = FastAPI(title=settings.app_name)

app.add_middleware(RequestObservabilityMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(auth.router)
app.include_router(goals.router)

app.include_router(logs.router)
app.include_router(progress.router)
