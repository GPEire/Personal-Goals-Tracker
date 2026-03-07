from __future__ import annotations

from collections import defaultdict
from datetime import date, datetime, time, timedelta, timezone
from zoneinfo import ZoneInfo

from app.models import Goal, Log
from app.schemas import DailyProgressBreakdown, WeeklyGoalProgress


def _days_elapsed(week_start: date, today: date) -> int:
    if today < week_start:
        return 0
    week_end = week_start + timedelta(days=6)
    if today > week_end:
        return 7
    return (today - week_start).days + 1


def _to_user_date(dt: datetime, user_timezone: str) -> date:
    return dt.astimezone(ZoneInfo(user_timezone)).date()


def _goal_completed_value(goal: Goal, logs: list[Log], user_timezone: str) -> float:
    if goal.type == "metric":
        return float(sum(float(log.parsed_value or 0) for log in logs))

    day_hits = {_to_user_date(log.created_at, user_timezone) for log in logs if log.completed}
    return float(len(day_hits))


def _goal_target_value(goal: Goal, days_elapsed: int) -> float:
    frequency = goal.frequency.lower()
    is_metric = goal.type == "metric"

    if frequency == "daily":
        if is_metric:
            weekly_target = float(goal.target_value or 0)
            return float((weekly_target / 7) * days_elapsed)
        return float(days_elapsed)

    if frequency == "weekly":
        if is_metric:
            return float(goal.target_value or 0)
        return 1.0

    return float(goal.target_value or (days_elapsed if not is_metric else 0))


def _is_on_track(completed: float, target: float) -> bool:
    if target > 0:
        return completed >= target
    return completed > 0


def _daily_breakdown(goal: Goal, logs: list[Log], week_start: date, user_timezone: str) -> list[DailyProgressBreakdown]:
    grouped_values: dict[date, float] = defaultdict(float)

    for log in logs:
        log_day = _to_user_date(log.created_at, user_timezone)
        if goal.type == "metric":
            grouped_values[log_day] += float(log.parsed_value or 0)
        elif log.completed:
            grouped_values[log_day] = 1.0

    return [
        DailyProgressBreakdown(
            date=week_start + timedelta(days=offset),
            completed=float(grouped_values.get(week_start + timedelta(days=offset), 0.0)),
        )
        for offset in range(7)
    ]


def build_weekly_goal_progress(
    *,
    goals: list[Goal],
    logs: list[Log],
    week_start: date,
    user_timezone: str = "UTC",
    today: date | None = None,
) -> list[WeeklyGoalProgress]:
    current_day = today or datetime.now(timezone.utc).date()
    days_elapsed = _days_elapsed(week_start, current_day)

    logs_by_goal: dict = defaultdict(list)
    for log in logs:
        logs_by_goal[log.goal_id].append(log)

    responses: list[WeeklyGoalProgress] = []
    for goal in goals:
        goal_logs = logs_by_goal.get(goal.id, [])
        completed = _goal_completed_value(goal, goal_logs, user_timezone)
        target = _goal_target_value(goal, days_elapsed)
        percent = 0.0 if target <= 0 else min(100.0, round((completed / target) * 100, 2))

        responses.append(
            WeeklyGoalProgress(
                goal_id=goal.id,
                goal_title=goal.title,
                frequency=goal.frequency,
                goal_type=goal.type,
                completed=round(completed, 2),
                target=round(target, 2),
                percent=percent,
                on_track=_is_on_track(completed, target),
                daily_breakdown=_daily_breakdown(goal, goal_logs, week_start, user_timezone),
            )
        )

    return responses


def week_bounds(week_start: date, user_timezone: str = "UTC") -> tuple[datetime, datetime]:
    tz = ZoneInfo(user_timezone)
    local_start = datetime.combine(week_start, time.min, tzinfo=tz)
    start = local_start.astimezone(timezone.utc)
    end = (local_start + timedelta(days=7)).astimezone(timezone.utc)
    return start, end
