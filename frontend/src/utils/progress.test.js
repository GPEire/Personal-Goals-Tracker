import test from 'node:test'
import assert from 'node:assert/strict'
import {
  getGoalGuidance,
  getStatusBadge,
  getStatusContext,
  getWeekSelectorOptions,
  getWeekStartISO,
  isMetricGoal,
  summarizeGoals
} from './progress.js'

test('getWeekStartISO returns monday date', () => {
  assert.equal(getWeekStartISO(new Date('2026-01-07T12:00:00Z')), '2026-01-05')
})

test('status badges use expected thresholds', () => {
  assert.equal(getStatusBadge({ percent: 100 }), 'On track')
  assert.equal(getStatusBadge({ percent: 88 }), 'At risk')
  assert.equal(getStatusBadge({ percent: 30 }), 'Behind')
})

test('metric detection and goal summary', () => {
  assert.equal(isMetricGoal({ type: 'metric' }), true)
  assert.equal(isMetricGoal({ type: 'habit' }), false)
  assert.deepEqual(
    summarizeGoals([{ percent: 100 }, { percent: 88 }, { percent: 20 }]),
    { onTrack: 1, atRisk: 1, behind: 1 }
  )
})

test('week selector provides current and previous week options', () => {
  assert.deepEqual(getWeekSelectorOptions(new Date('2026-01-07T12:00:00Z')), [
    { value: '2026-01-05', label: 'Current week (2026-01-05)' },
    { value: '2025-12-29', label: 'Previous week (2025-12-29)' }
  ])
})

test('status context differentiates projected vs final', () => {
  assert.equal(getStatusContext(true, 4), 'Projected status (week in progress)')
  assert.equal(getStatusContext(false, 7), 'Final status (week complete)')
})

test('goal guidance provides actionable pacing and final outcomes', () => {
  assert.equal(
    getGoalGuidance({ completed: 2, target: 6 }, true, 4),
    '4 remaining by Sunday (1.33/day needed).'
  )
  assert.equal(
    getGoalGuidance({ completed: 6, target: 6 }, true, 5),
    'Ahead of plan — already enough progress for this week.'
  )
  assert.equal(
    getGoalGuidance({ completed: 3, target: 5 }, false, 7),
    'Final result: 2 short of target.'
  )
})
