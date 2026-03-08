import test from 'node:test'
import assert from 'node:assert/strict'
import { buildGoalPayload, parseReminderTimes, validateGoalForm } from './goals.js'

test('parseReminderTimes trims values and removes empties', () => {
  assert.deepEqual(parseReminderTimes('09:00, 18:30, , 21:00'), ['09:00', '18:30', '21:00'])
  assert.deepEqual(parseReminderTimes('   '), [])
})

test('validateGoalForm enforces title, frequency and metric target', () => {
  assert.equal(validateGoalForm({ title: '', frequency: 'daily', type: 'habit', target: '' }), 'Title is required.')
  assert.equal(validateGoalForm({ title: 'Read', frequency: '', type: 'habit', target: '' }), 'Frequency is required.')
  assert.equal(
    validateGoalForm({ title: 'Steps', frequency: 'daily', type: 'metric', target: '0' }),
    'Metric goals require a target value greater than 0.'
  )
  assert.equal(validateGoalForm({ title: 'Read', frequency: 'daily', type: 'habit', target: '' }), '')
})

test('buildGoalPayload maps form state to api payload', () => {
  assert.deepEqual(
    buildGoalPayload({
      title: ' Walk ',
      type: 'metric',
      frequency: 'daily',
      target: '8',
      reminders: '07:00,19:00'
    }),
    {
      title: 'Walk',
      type: 'metric',
      frequency: 'daily',
      target_value: 8,
      reminder_times: ['07:00', '19:00'],
      is_active: true
    }
  )
})
