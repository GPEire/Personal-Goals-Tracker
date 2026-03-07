from datetime import date, datetime, timezone
from types import SimpleNamespace
from uuid import uuid4

from app.services.progress import build_weekly_goal_progress, week_bounds


def make_goal(*, goal_type: str, frequency: str, target_value: float | None = None, title: str = "Goal"):
    return SimpleNamespace(
        id=uuid4(),
        title=title,
        type=goal_type,
        frequency=frequency,
        target_value=target_value,
    )


def make_log(goal_id, *, day: date, completed: bool = True, value: float | None = None):
    return SimpleNamespace(
        goal_id=goal_id,
        created_at=datetime.combine(day, datetime.min.time(), tzinfo=timezone.utc),
        completed=completed,
        parsed_value=value,
    )


def test_daily_binary_goal_midweek_progress():
    week_start = date(2026, 1, 5)
    goal = make_goal(goal_type="habit", frequency="daily", title="Read")
    logs = [
        make_log(goal.id, day=date(2026, 1, 5)),
        make_log(goal.id, day=date(2026, 1, 6)),
    ]

    progress = build_weekly_goal_progress(
        goals=[goal],
        logs=logs,
        week_start=week_start,
        today=date(2026, 1, 7),
    )

    assert len(progress) == 1
    assert progress[0].completed == 2.0
    assert progress[0].target == 3.0
    assert progress[0].percent == 66.67
    assert progress[0].on_track is False


def test_weekly_binary_goal_on_track_after_one_completion():
    week_start = date(2026, 1, 5)
    goal = make_goal(goal_type="project", frequency="weekly", title="Publish")
    logs = [make_log(goal.id, day=date(2026, 1, 6))]

    progress = build_weekly_goal_progress(
        goals=[goal],
        logs=logs,
        week_start=week_start,
        today=date(2026, 1, 7),
    )

    assert progress[0].completed == 1.0
    assert progress[0].target == 1.0
    assert progress[0].percent == 100.0
    assert progress[0].on_track is True


def test_count_goal_uses_metric_sum_and_target():
    week_start = date(2026, 1, 5)
    goal = make_goal(goal_type="metric", frequency="weekly", target_value=10, title="Push-ups")
    logs = [
        make_log(goal.id, day=date(2026, 1, 5), value=3),
        make_log(goal.id, day=date(2026, 1, 6), value=2),
    ]

    progress = build_weekly_goal_progress(
        goals=[goal],
        logs=logs,
        week_start=week_start,
        today=date(2026, 1, 7),
    )

    assert progress[0].completed == 5.0
    assert progress[0].target == 10.0
    assert progress[0].percent == 50.0
    assert progress[0].on_track is False


def test_zero_activity_week_stays_not_on_track():
    week_start = date(2026, 1, 5)
    goal = make_goal(goal_type="habit", frequency="daily", title="Meditate")

    progress = build_weekly_goal_progress(
        goals=[goal],
        logs=[],
        week_start=week_start,
        today=date(2026, 1, 7),
    )

    assert progress[0].completed == 0.0
    assert progress[0].target == 3.0
    assert progress[0].percent == 0.0
    assert progress[0].on_track is False
    assert len(progress[0].daily_breakdown) == 7
    assert all(item.completed == 0.0 for item in progress[0].daily_breakdown)


def test_week_bounds_respects_user_timezone():
    start, end = week_bounds(date(2026, 1, 5), "America/Los_Angeles")

    assert start.isoformat() == "2026-01-05T08:00:00+00:00"
    assert end.isoformat() == "2026-01-12T08:00:00+00:00"
