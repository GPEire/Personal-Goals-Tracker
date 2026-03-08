from datetime import date, timedelta
from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.deps import get_current_user
from app.models import Goal, Log, User
from app.schemas import WeeklyProgressResponse
from app.services.progress import build_weekly_goal_progress, week_bounds


router = APIRouter(prefix="/progress", tags=["progress"])


@router.get("/weekly", response_model=WeeklyProgressResponse)
def get_weekly_progress(
    week_start: date = Query(..., description="Week start date (YYYY-MM-DD)"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> WeeklyProgressResponse:
    start_dt, end_dt = week_bounds(week_start, current_user.timezone)

    goals = list(
        db.execute(
            select(Goal).where(Goal.user_id == current_user.id, Goal.is_active.is_(True)).order_by(Goal.created_at.asc())
        ).scalars()
    )
    logs = list(
        db.execute(
            select(Log).where(
                Log.user_id == current_user.id,
                Log.created_at >= start_dt,
                Log.created_at < end_dt,
            )
        ).scalars()
    )

    weekly_goal_progress = build_weekly_goal_progress(
        goals=goals,
        logs=logs,
        week_start=week_start,
        user_timezone=current_user.timezone,
    )
    today = date.today()
    days_elapsed = max(0, min(7, (today - week_start).days + 1))

    return WeeklyProgressResponse(
        week_start=week_start,
        week_end=week_start + timedelta(days=6),
        days_elapsed=days_elapsed,
        goals=weekly_goal_progress,
    )
