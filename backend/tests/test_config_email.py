import pytest

from app.core.config import Settings


def test_resend_requires_api_key_and_from_address():
    with pytest.raises(ValueError):
        Settings(email_provider="resend", email_api_key="", email_from="sender@example.com")

    with pytest.raises(ValueError):
        Settings(email_provider="resend", email_api_key="re_xxx", email_from="")


def test_allows_resend_when_required_settings_present():
    settings = Settings(email_provider="resend", email_api_key="re_xxx", email_from="sender@example.com")

    assert settings.email_provider == "resend"


def test_production_requires_database_sslmode():
    with pytest.raises(ValueError):
        Settings(environment="production", database_url="postgresql+psycopg://user:pass@db.example.com:5432/app")


def test_production_accepts_database_sslmode_require():
    settings = Settings(
        environment="production",
        database_url="postgresql+psycopg://user:pass@db.example.com:5432/app?sslmode=require",
    )

    assert settings.database_url.endswith("sslmode=require")


def test_cors_origins_supports_comma_separated_values():
    settings = Settings(
        environment="production",
        allowed_origins="https://app.example.com, https://preview.example.com",
        database_url="postgresql+psycopg://user:pass@db.example.com:5432/app?sslmode=require",
    )

    assert settings.cors_allowed_origins == ["https://app.example.com", "https://preview.example.com"]


def test_cors_origins_include_localhost_only_for_development():
    settings = Settings(environment="development", frontend_url="https://app.example.com")

    assert "http://localhost:5173" in settings.cors_allowed_origins
    assert "http://127.0.0.1:5173" in settings.cors_allowed_origins


def test_cors_origins_exclude_localhost_in_production():
    settings = Settings(
        environment="production",
        frontend_url="https://app.example.com",
        database_url="postgresql+psycopg://user:pass@db.example.com:5432/app?sslmode=require",
    )

    assert settings.cors_allowed_origins == ["https://app.example.com"]


def test_cors_origins_reject_invalid_entries():
    settings = Settings(allowed_origins="app.example.com")

    with pytest.raises(ValueError):
        _ = settings.cors_allowed_origins
