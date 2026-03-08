from functools import lru_cache
from urllib.parse import parse_qsl, urlparse

from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Personal Resolution Tracker API"
    environment: str = "development"
    database_url: str = "postgresql+psycopg://postgres:postgres@localhost:5432/personal_goals"
    jwt_secret: str = "change-me"
    jwt_algorithm: str = "HS256"
    access_token_exp_minutes: int = 60 * 24 * 7
    frontend_url: str = "http://localhost:5173"
    allowed_origins: str = ""
    email_provider: str = "console"
    email_api_key: str = ""
    email_from: str = ""

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")


    @model_validator(mode="after")
    def validate_database_ssl_settings(self) -> "Settings":
        if self.environment.lower() in {"development", "local", "test"}:
            return self

        parsed = urlparse(self.database_url)
        if not parsed.scheme.startswith("postgresql"):
            return self

        query_params = dict(parse_qsl(parsed.query))
        sslmode = query_params.get("sslmode", "").lower()
        if sslmode not in {"require", "verify-ca", "verify-full"}:
            raise ValueError(
                "DATABASE_URL must include sslmode=require (or verify-ca/verify-full) in staging/production environments"
            )

        return self

    @model_validator(mode="after")
    def validate_email_provider_settings(self) -> "Settings":
        if self.email_provider == "console":
            return self

        if self.email_provider != "resend":
            raise ValueError("EMAIL_PROVIDER must be one of: console, resend")

        if not self.email_api_key:
            raise ValueError("EMAIL_API_KEY is required when EMAIL_PROVIDER is resend")
        if not self.email_from:
            raise ValueError("EMAIL_FROM is required when EMAIL_PROVIDER is resend")

        return self

    @property
    def cors_allowed_origins(self) -> list[str]:
        origins: list[str] = []
        if self.allowed_origins:
            origins.extend(origin.strip() for origin in self.allowed_origins.split(",") if origin.strip())

        if not origins:
            origins.append(self.frontend_url)

        if self.environment.lower() in {"development", "local", "test"}:
            origins.extend(["http://localhost:5173", "http://127.0.0.1:5173"])

        deduped_origins = list(dict.fromkeys(origins))
        invalid_origins = [origin for origin in deduped_origins if not origin.startswith(("http://", "https://"))]
        if invalid_origins:
            raise ValueError("ALLOWED_ORIGINS entries must be fully-qualified HTTP(S) origins")

        return deduped_origins


@lru_cache
def get_settings() -> Settings:
    return Settings()
