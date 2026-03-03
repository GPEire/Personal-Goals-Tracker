import secrets
from datetime import UTC, datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import create_access_token
from app.models import User
from app.schemas import AuthLinkRequest, AuthResponse, AuthVerifyRequest, MessageResponse

router = APIRouter(prefix="/auth", tags=["auth"])

# MVP shortcut store. Replace with email provider in iteration 2+.
_MAGIC_TOKENS: dict[str, tuple[str, datetime]] = {}


@router.post("/request-link", response_model=MessageResponse)
def request_magic_link(payload: AuthLinkRequest, db: Session = Depends(get_db)) -> MessageResponse:
    user = db.execute(select(User).where(User.email == payload.email)).scalar_one_or_none()
    if not user:
        user = User(email=payload.email)
        db.add(user)
        db.commit()

    token = secrets.token_urlsafe(16)
    _MAGIC_TOKENS[payload.email] = (token, datetime.now(UTC) + timedelta(minutes=15))
    # In production this token would be emailed.
    return MessageResponse(message=f"Magic link token generated for development: {token}")


@router.post("/verify", response_model=AuthResponse)
def verify_magic_link(payload: AuthVerifyRequest) -> AuthResponse:
    entry = _MAGIC_TOKENS.get(payload.email)
    if not entry:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No token requested")

    token, expires_at = entry
    if token != payload.token or expires_at < datetime.now(UTC):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired token")

    access_token = create_access_token(payload.email)
    _MAGIC_TOKENS.pop(payload.email, None)
    return AuthResponse(access_token=access_token)
