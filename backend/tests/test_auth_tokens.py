from datetime import UTC, datetime, timedelta

import app.routers.auth as auth_router
from app.models import AuthToken, User
from app.routers.auth import request_magic_link, verify_magic_link
from app.schemas import AuthLinkRequest, AuthVerifyRequest


class FakeScalarResult:
    def __init__(self, value):
        self._value = value

    def scalar_one_or_none(self):
        return self._value

    def scalar_one(self):
        if self._value is None:
            raise AssertionError("Expected exactly one result")
        return self._value


class FakeSession:
    def __init__(self):
        self.users_by_email: dict[str, User] = {}
        self.auth_tokens_by_hash: dict[str, AuthToken] = {}

    def execute(self, statement):
        where_clause = statement.whereclause
        values: list[str] = []

        def _collect_values(expr):
            if hasattr(expr, "clauses"):
                for clause in expr.clauses:
                    _collect_values(clause)
            elif hasattr(expr, "right") and hasattr(expr.right, "value"):
                values.append(expr.right.value)

        _collect_values(where_clause)

        model = statement.column_descriptions[0]["entity"]
        if model is User:
            email = values[0]
            return FakeScalarResult(self.users_by_email.get(email))

        if model is AuthToken:
            if len(values) == 1:
                email = values[0]
                token = next((item for item in self.auth_tokens_by_hash.values() if item.email == email), None)
                return FakeScalarResult(token)

            email, token_hash = values
            token = self.auth_tokens_by_hash.get(token_hash)
            if token and token.email == email:
                return FakeScalarResult(token)
            return FakeScalarResult(None)

        raise AssertionError("Unhandled model in fake session")

    def add(self, obj):
        if isinstance(obj, User):
            self.users_by_email[obj.email] = obj
        elif isinstance(obj, AuthToken):
            self.auth_tokens_by_hash[obj.token_hash] = obj
        else:
            raise AssertionError(f"Unsupported object type: {type(obj)}")

    def commit(self):
        return None


class FakeEmailSender:
    def __init__(self):
        self.sent = []

    def send_magic_link(self, *, recipient_email: str, magic_link: str, token: str):
        self.sent.append({"recipient_email": recipient_email, "magic_link": magic_link, "token": token})


def test_request_link_returns_dev_token_only_for_local_environment():
    db = FakeSession()
    original_env = auth_router.settings.environment

    try:
        auth_router.settings.environment = "development"
        response = request_magic_link(AuthLinkRequest(email="local@example.com"), db)
    finally:
        auth_router.settings.environment = original_env

    assert response.message.startswith("Magic link token generated for development: ")


def test_request_link_sends_email_for_non_local_environments():
    db = FakeSession()
    fake_sender = FakeEmailSender()
    original_env = auth_router.settings.environment
    original_sender = auth_router.email_sender

    try:
        auth_router.settings.environment = "production"
        auth_router.email_sender = fake_sender
        response = request_magic_link(AuthLinkRequest(email="prod@example.com"), db)
    finally:
        auth_router.settings.environment = original_env
        auth_router.email_sender = original_sender

    assert response.message == "Check your email for a sign-in link and code."
    assert len(fake_sender.sent) == 1
    assert fake_sender.sent[0]["recipient_email"] == "prod@example.com"
    assert fake_sender.sent[0]["magic_link"].startswith(auth_router.settings.frontend_url)


def test_verify_valid_token_returns_access_token():
    db = FakeSession()

    request_response = request_magic_link(AuthLinkRequest(email="valid@example.com"), db)
    token = request_response.message.rsplit(": ", 1)[1]

    verify_response = verify_magic_link(AuthVerifyRequest(email="valid@example.com", token=token), db)

    assert verify_response.token_type == "bearer"
    assert verify_response.access_token


def test_verify_expired_token_is_rejected():
    db = FakeSession()

    request_response = request_magic_link(AuthLinkRequest(email="expired@example.com"), db)
    token = request_response.message.rsplit(": ", 1)[1]

    token_record = db.execute(
        auth_router.select(AuthToken).where(AuthToken.email == "expired@example.com")
    ).scalar_one()
    token_record.expires_at = datetime.now(UTC) - timedelta(minutes=1)

    try:
        verify_magic_link(AuthVerifyRequest(email="expired@example.com", token=token), db)
        raise AssertionError("Expected verification to fail for expired token")
    except auth_router.HTTPException as exc:
        assert exc.status_code == 400
        assert exc.detail == "Invalid or expired token"


def test_verify_reused_token_is_rejected():
    db = FakeSession()

    request_response = request_magic_link(AuthLinkRequest(email="reused@example.com"), db)
    token = request_response.message.rsplit(": ", 1)[1]

    first_verify = verify_magic_link(AuthVerifyRequest(email="reused@example.com", token=token), db)
    assert first_verify.access_token

    try:
        verify_magic_link(AuthVerifyRequest(email="reused@example.com", token=token), db)
        raise AssertionError("Expected verification to fail for reused token")
    except auth_router.HTTPException as exc:
        assert exc.status_code == 400
        assert exc.detail == "Invalid or expired token"


def test_verify_wrong_token_is_rejected():
    db = FakeSession()

    request_magic_link(AuthLinkRequest(email="wrong@example.com"), db)

    try:
        verify_magic_link(AuthVerifyRequest(email="wrong@example.com", token="wrong-token"), db)
        raise AssertionError("Expected verification to fail for wrong token")
    except auth_router.HTTPException as exc:
        assert exc.status_code == 400
        assert exc.detail == "Invalid or expired token"
