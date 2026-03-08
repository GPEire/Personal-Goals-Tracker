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
