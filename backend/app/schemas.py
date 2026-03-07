from datetime import date, datetime
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


class LogCreate(BaseModel):
    goal_id: UUID
    date: date
    value: float | None = None
    completed: bool = True
    raw_text: str = "manual"


class LogResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    goal_id: UUID
    raw_text: str
    parsed_value: float | None
    completed: bool
    confidence: float
    created_at: datetime


class DailyProgressBreakdown(BaseModel):
    date: date
    completed: float


class WeeklyGoalProgress(BaseModel):
    goal_id: UUID
    goal_title: str
    frequency: str
    goal_type: str
    completed: float
    target: float
    percent: float
    on_track: bool
    daily_breakdown: list[DailyProgressBreakdown]


class WeeklyProgressResponse(BaseModel):
    week_start: date
    week_end: date
    days_elapsed: int
    goals: list[WeeklyGoalProgress]


class MessageResponse(BaseModel):
    message: str
