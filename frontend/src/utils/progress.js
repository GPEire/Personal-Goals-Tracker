export function getWeekStartISO(date = new Date()) {
  const dt = new Date(date)
  const day = dt.getDay() // Sun=0
  const diffToMonday = day === 0 ? -6 : 1 - day
  dt.setDate(dt.getDate() + diffToMonday)
  return dt.toISOString().slice(0, 10)
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
