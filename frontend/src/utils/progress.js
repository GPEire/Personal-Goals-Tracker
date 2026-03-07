export function getWeekStartISO(date = new Date()) {
  const dt = new Date(date)
  const day = dt.getDay() // Sun=0
  const diffToMonday = day === 0 ? -6 : 1 - day
  dt.setDate(dt.getDate() + diffToMonday)
  return dt.toISOString().slice(0, 10)
}

export function getWeekStartOffsetISO(offsetWeeks, baseDate = new Date()) {
  const dt = new Date(baseDate)
  dt.setDate(dt.getDate() + offsetWeeks * 7)
  return getWeekStartISO(dt)
}

export function getWeekSelectorOptions(baseDate = new Date()) {
  const currentWeek = getWeekStartISO(baseDate)
  const previousWeek = getWeekStartOffsetISO(-1, baseDate)
  return [
    { value: currentWeek, label: `Current week (${currentWeek})` },
    { value: previousWeek, label: `Previous week (${previousWeek})` }
  ]
}

export function getStatusBadge(goalProgress) {
  if (goalProgress.percent >= 100) return 'On track'
  if (goalProgress.percent >= 50) return 'At risk'
  return 'Behind'
}

export function isMetricGoal(goal) {
  return goal.type === 'metric'
}

export function summarizeGoals(progressGoals) {
  if (!progressGoals.length) {
    return { onTrack: 0, atRisk: 0, behind: 0 }
  }

  return progressGoals.reduce(
    (acc, goal) => {
      const badge = getStatusBadge(goal)
      if (badge === 'On track') acc.onTrack += 1
      if (badge === 'At risk') acc.atRisk += 1
      if (badge === 'Behind') acc.behind += 1
      return acc
    },
    { onTrack: 0, atRisk: 0, behind: 0 }
  )
}

export function getStatusContext(isCurrentWeek, daysElapsed) {
  if (isCurrentWeek && daysElapsed < 7) {
    return 'Projected status (week in progress)'
  }
  return 'Final status (week complete)'
}

export function getGoalGuidance(goalProgress, isCurrentWeek, daysElapsed) {
  const remaining = Math.max(0, Number((goalProgress.target - goalProgress.completed).toFixed(2)))

  if (isCurrentWeek && daysElapsed < 7) {
    if (remaining <= 0) {
      return 'Ahead of plan — already enough progress for this week.'
    }

    const daysLeft = Math.max(1, 7 - daysElapsed)
    const pace = Number((remaining / daysLeft).toFixed(2))
    return `${remaining} remaining by Sunday (${pace}/day needed).`
  }

  if (remaining <= 0) {
    return 'Final result: goal achieved for this week.'
  }

  return `Final result: ${remaining} short of target.`
}
