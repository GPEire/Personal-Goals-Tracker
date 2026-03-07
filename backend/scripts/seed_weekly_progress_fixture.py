"""Seed deterministic data for weekly progress QA checks.

Usage:
    python scripts/seed_weekly_progress_fixture.py
"""

from datetime import date, datetime, time, timezone
from zoneinfo import ZoneInfo

from sqlalchemy import select

from app.core.database import SessionLocal
from app.models import Goal, Log, User

FIXTURE_EMAIL = "phase5.qa@example.com"
FIXTURE_WEEK_START = "2026-01-05"


def _local_to_utc(year: int, month: int, day: int, tz_name: str) -> datetime:
    local_dt = datetime.combine(date(year, month, day), time.min, tzinfo=ZoneInfo(tz_name))
    return local_dt.astimezone(timezone.utc)


def main() -> None:
    with SessionLocal() as db:
        user = db.execute(select(User).where(User.email == FIXTURE_EMAIL)).scalar_one_or_none()
        if not user:
            user = User(email=FIXTURE_EMAIL, timezone="America/Los_Angeles")
            db.add(user)
            db.commit()
            db.refresh(user)

        existing_goals = list(db.execute(select(Goal).where(Goal.user_id == user.id)).scalars())
        for goal in existing_goals:
            db.delete(goal)
        db.commit()

        read_goal = Goal(user_id=user.id, title="Read", type="habit", frequency="daily")
        workout_goal = Goal(user_id=user.id, title="Workout", type="metric", frequency="weekly", target_value=5)
        publish_goal = Goal(user_id=user.id, title="Publish weekly update", type="project", frequency="weekly")
        db.add_all([read_goal, workout_goal, publish_goal])
        db.commit()
        db.refresh(read_goal)
        db.refresh(workout_goal)
        db.refresh(publish_goal)

        logs = [
            Log(
                user_id=user.id,
                goal_id=read_goal.id,
                raw_text="manual",
                parsed_value=None,
                completed=True,
                confidence=1.0,
                created_at=_local_to_utc(2026, 1, 5, user.timezone),
            ),
            Log(
                user_id=user.id,
                goal_id=read_goal.id,
                raw_text="manual",
                parsed_value=None,
                completed=True,
                confidence=1.0,
                created_at=_local_to_utc(2026, 1, 6, user.timezone),
            ),
            Log(
                user_id=user.id,
                goal_id=workout_goal.id,
                raw_text="manual",
                parsed_value=2,
                completed=True,
                confidence=1.0,
                created_at=_local_to_utc(2026, 1, 5, user.timezone),
            ),
            Log(
                user_id=user.id,
                goal_id=workout_goal.id,
                raw_text="manual",
                parsed_value=1,
                completed=True,
                confidence=1.0,
                created_at=_local_to_utc(2026, 1, 6, user.timezone),
            ),
            Log(
                user_id=user.id,
                goal_id=publish_goal.id,
                raw_text="manual",
                parsed_value=None,
                completed=True,
                confidence=1.0,
                created_at=_local_to_utc(2026, 1, 7, user.timezone),
            ),
        ]
        db.add_all(logs)
        db.commit()

    print("Seeded fixture user:", FIXTURE_EMAIL)
    print("Fixture week_start:", FIXTURE_WEEK_START)


if __name__ == "__main__":
    main()
