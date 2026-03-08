export function parseReminderTimes(rawReminders) {
  if (!rawReminders.trim()) {
    return []
  }

  return rawReminders
    .split(',')
    .map(reminder => reminder.trim())
    .filter(Boolean)
}

export function buildGoalPayload(formState) {
  return {
    title: formState.title.trim(),
    type: formState.type,
    frequency: formState.frequency.trim(),
    target_value: formState.type === 'metric' ? Number(formState.target) : null,
    reminder_times: parseReminderTimes(formState.reminders),
    is_active: true
  }
}

export function validateGoalForm(formState) {
  if (!formState.title.trim()) {
    return 'Title is required.'
  }

  if (!formState.frequency.trim()) {
    return 'Frequency is required.'
  }

  if (formState.type === 'metric') {
    const target = Number(formState.target)
    if (!Number.isFinite(target) || target <= 0) {
      return 'Metric goals require a target value greater than 0.'
    }
  }

  return ''
}
