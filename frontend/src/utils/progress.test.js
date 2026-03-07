import test from 'node:test'
import assert from 'node:assert/strict'
import { getStatusBadge, getWeekStartISO, isMetricGoal, summarizeGoals } from './progress.js'

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
