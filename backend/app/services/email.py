from __future__ import annotations

import json
from dataclasses import dataclass
from urllib import error, request

from app.core.config import Settings


class EmailDeliveryError(RuntimeError):
    """Raised when an email provider request fails."""


class EmailSender:
    def send_magic_link(self, *, recipient_email: str, magic_link: str, token: str) -> None:
        raise NotImplementedError


@dataclass
class ResendEmailSender(EmailSender):
    api_key: str
    from_email: str

    def send_magic_link(self, *, recipient_email: str, magic_link: str, token: str) -> None:
        payload = {
            "from": self.from_email,
            "to": [recipient_email],
            "subject": "Your sign-in link",
            "html": (
                "<p>Use the link below to sign in to Personal Goals Tracker.</p>"
                f'<p><a href="{magic_link}">Sign in</a></p>'
                f"<p>If prompted, enter this code: <strong>{token}</strong>.</p>"
                "<p>This link expires in 15 minutes.</p>"
            ),
        }

        req = request.Request(
            "https://api.resend.com/emails",
            method="POST",
            headers={
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json",
            },
            data=json.dumps(payload).encode("utf-8"),
        )

        try:
            with request.urlopen(req, timeout=10) as response:
                if response.status >= 400:
                    raise EmailDeliveryError(f"Email provider returned status {response.status}")
        except error.HTTPError as exc:
            body = exc.read().decode("utf-8", errors="ignore")
            raise EmailDeliveryError(f"Email delivery failed with status {exc.code}: {body}") from exc
        except error.URLError as exc:
            raise EmailDeliveryError("Email delivery failed due to a network error") from exc


class ConsoleEmailSender(EmailSender):
    def send_magic_link(self, *, recipient_email: str, magic_link: str, token: str) -> None:
        return None


def get_email_sender(settings: Settings) -> EmailSender:
    if settings.email_provider == "resend":
        return ResendEmailSender(api_key=settings.email_api_key, from_email=settings.email_from)
    return ConsoleEmailSender()
