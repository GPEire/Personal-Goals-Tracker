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
