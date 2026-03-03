from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class AuthLinkRequest(BaseModel):
    email: EmailStr


class AuthVerifyRequest(BaseModel):
    email: EmailStr
    token: str


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class GoalBase(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    type: str = Field(pattern="^(habit|metric|project)$")
    frequency: str
    target_value: float | None = None
    reminder_times: list[str] = Field(default_factory=list)
    description: str | None = None
    is_active: bool = True


class GoalCreate(GoalBase):
    pass


class GoalUpdate(BaseModel):
    title: str | None = None
    type: str | None = Field(default=None, pattern="^(habit|metric|project)$")
    frequency: str | None = None
    target_value: float | None = None
    reminder_times: list[str] | None = None
    description: str | None = None
    is_active: bool | None = None


class GoalResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    title: str
    type: str
    frequency: str
    target_value: float | None
    reminder_times: list[str]
    description: str | None
    is_active: bool
    created_at: datetime


class MessageResponse(BaseModel):
    message: str
