from functools import lru_cache

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
    email_provider: str = "console"
    email_api_key: str = ""
    email_from: str = ""

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

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


@lru_cache
def get_settings() -> Settings:
    return Settings()
