from datetime import date, datetime, time, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.deps import get_current_user
from app.models import Goal, Log, User
from app.schemas import LogCreate, LogResponse
from app.services.progress import week_bounds

router = APIRouter(prefix="/logs", tags=["logs"])


@router.post("", response_model=LogResponse, status_code=status.HTTP_201_CREATED)
def create_log(
    payload: LogCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Log:
    goal = db.execute(select(Goal).where(Goal.id == payload.goal_id, Goal.user_id == current_user.id)).scalar_one_or_none()
    if not goal:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Goal not found")

    log = Log(
        user_id=current_user.id,
        goal_id=payload.goal_id,
        raw_text=payload.raw_text,
        parsed_value=payload.value,
        completed=payload.completed,
        confidence=1.0,
        created_at=datetime.combine(payload.date, time.min, tzinfo=timezone.utc),
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    return log


@router.get("", response_model=list[LogResponse])
def list_logs(
    week_start: date = Query(..., description="Week start date (YYYY-MM-DD)"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[Log]:
    week_start_dt, week_end_dt = week_bounds(week_start)
    statement = (
        select(Log)
        .where(Log.user_id == current_user.id, Log.created_at >= week_start_dt, Log.created_at < week_end_dt)
        .order_by(Log.created_at.asc())
    )
    return list(db.execute(statement).scalars())
