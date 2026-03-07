import hashlib
import secrets
from datetime import UTC, datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.database import get_db
from app.core.security import create_access_token
from app.models import AuthToken, User
from app.schemas import AuthLinkRequest, AuthResponse, AuthVerifyRequest, MessageResponse

router = APIRouter(prefix="/auth", tags=["auth"])
settings = get_settings()


def _hash_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


@router.post("/request-link", response_model=MessageResponse)
def request_magic_link(payload: AuthLinkRequest, db: Session = Depends(get_db)) -> MessageResponse:
    user = db.execute(select(User).where(User.email == payload.email)).scalar_one_or_none()
    if not user:
        user = User(email=payload.email)
        db.add(user)

    token = secrets.token_urlsafe(16)
    auth_token = AuthToken(
        email=payload.email,
        token_hash=_hash_token(token),
        expires_at=datetime.now(UTC) + timedelta(minutes=15),
    )
    db.add(auth_token)
    db.commit()

    # In production this token would be emailed.
    if settings.environment == "production":
        return MessageResponse(message="Magic link sent.")
    return MessageResponse(message=f"Magic link token generated for development: {token}")


@router.post("/verify", response_model=AuthResponse)
def verify_magic_link(payload: AuthVerifyRequest, db: Session = Depends(get_db)) -> AuthResponse:
    token_hash = _hash_token(payload.token)
    token_record = db.execute(
        select(AuthToken).where(AuthToken.email == payload.email, AuthToken.token_hash == token_hash)
    ).scalar_one_or_none()

    if not token_record:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired token")

    now = datetime.now(UTC)
    if token_record.used_at is not None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired token")
    if token_record.expires_at < now:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired token")

    token_record.used_at = now
    db.commit()

    access_token = create_access_token(payload.email)
    return AuthResponse(access_token=access_token)
