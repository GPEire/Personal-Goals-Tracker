from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.deps import get_current_user
from app.models import Goal, User
from app.schemas import GoalCreate, GoalResponse, GoalUpdate, MessageResponse

router = APIRouter(prefix="/goals", tags=["goals"])


@router.get("", response_model=list[GoalResponse])
def list_goals(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> list[Goal]:
    return list(db.execute(select(Goal).where(Goal.user_id == current_user.id).order_by(Goal.created_at.desc())).scalars())


@router.post("", response_model=GoalResponse, status_code=status.HTTP_201_CREATED)
def create_goal(payload: GoalCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> Goal:
    goal = Goal(
        user_id=current_user.id,
        title=payload.title,
        type=payload.type,
        frequency=payload.frequency,
        target_value=payload.target_value,
        reminder_times=payload.reminder_times,
        description=payload.description,
        is_active=payload.is_active,
    )
    db.add(goal)
    db.commit()
    db.refresh(goal)
    return goal


@router.put("/{goal_id}", response_model=GoalResponse)
def update_goal(
    goal_id: UUID,
    payload: GoalUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Goal:
    goal = db.execute(select(Goal).where(Goal.id == goal_id, Goal.user_id == current_user.id)).scalar_one_or_none()
    if not goal:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Goal not found")

    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(goal, key, value)

    db.commit()
    db.refresh(goal)
    return goal


@router.delete("/{goal_id}", response_model=MessageResponse)
def delete_goal(goal_id: UUID, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> MessageResponse:
    goal = db.execute(select(Goal).where(Goal.id == goal_id, Goal.user_id == current_user.id)).scalar_one_or_none()
    if not goal:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Goal not found")

    db.delete(goal)
    db.commit()
    return MessageResponse(message="Goal deleted")
