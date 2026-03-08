import { useEffect, useMemo, useState } from 'react'
import { authApi, goalsApi, logsApi, progressApi } from './api'
import {
  getGoalGuidance,
  getStatusBadge,
  getStatusContext,
  getWeekSelectorOptions,
  getWeekStartISO,
  isMetricGoal,
  summarizeGoals
} from './utils/progress'
import { buildGoalPayload, parseReminderTimes, validateGoalForm } from './utils/goals'

const initialGoalForm = {
  title: '',
  type: 'habit',
  frequency: 'daily',
  target: '',
  reminders: ''
}

function AuthPanel({ onAuthenticated }) {
  const [email, setEmail] = useState('')
  const [token, setToken] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const requestLink = async () => {
    try {
      setError('')
      const response = await authApi.requestLink(email)
      setMessage(response.message)
      const match = response.message.match(/development:\s(.+)$/)
      if (match) {
        setToken(match[1])
      }
    } catch (err) {
      setError(err.message)
    }
  }

  const verify = async () => {
    try {
      setError('')
      const response = await authApi.verify(email, token)
      localStorage.setItem('auth_token', response.access_token)
      onAuthenticated()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <section>
      <h1>Sign in</h1>
      <input aria-label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
      <button onClick={requestLink}>Email me a sign-in link</button>
      <p>After requesting, check your email for a sign-in link and one-time code.</p>
      <input aria-label="Token" value={token} onChange={e => setToken(e.target.value)} placeholder="Enter one-time code" />
      <button onClick={verify}>Sign in with code</button>
      {message && <p>{message}</p>}
      {error && <p role="alert">{error}</p>}
    </section>
  )
}

export default function App() {
  const [view, setView] = useState('today')
  const [isAuthed, setIsAuthed] = useState(Boolean(localStorage.getItem('auth_token')))
  const [goals, setGoals] = useState([])
  const [progress, setProgress] = useState(null)
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [goalForm, setGoalForm] = useState(initialGoalForm)
  const [editingGoalId, setEditingGoalId] = useState('')
  const [goalError, setGoalError] = useState('')
  const [goalMessage, setGoalMessage] = useState('')

  const weekOptions = useMemo(() => getWeekSelectorOptions(), [])
  const [weekStart, setWeekStart] = useState(() => getWeekStartISO())

  const refreshData = async selectedWeekStart => {
    try {
      setLoading(true)
      setError('')
      const [goalData, progressData, logData] = await Promise.all([
        goalsApi.list(),
        progressApi.weekly(selectedWeekStart),
        logsApi.listForWeek(selectedWeekStart)
      ])
      setGoals(goalData)
      setProgress(progressData)
      setLogs(logData)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isAuthed) {
      refreshData(weekStart)
    }
  }, [isAuthed, weekStart])

  const progressByGoal = useMemo(() => {
    const entries = progress?.goals ?? []
    return Object.fromEntries(entries.map(item => [item.goal_id, item]))
  }, [progress])

  const todayISO = new Date().toISOString().slice(0, 10)
  const isCurrentWeek = weekStart === getWeekStartISO()

  const logProgress = async (goal, nextValue) => {
    await logsApi.create({
      goal_id: goal.id,
      date: todayISO,
      completed: isMetricGoal(goal) ? nextValue > 0 : Boolean(nextValue),
      value: isMetricGoal(goal) ? nextValue : null,
      raw_text: 'ui'
    })
    await refreshData(weekStart)
  }

  const toggleBinary = async goal => {
    const current = progressByGoal[goal.id]?.daily_breakdown?.find(day => day.date === todayISO)?.completed ?? 0
    const next = current > 0 ? 0 : 1
    await logProgress(goal, next)
  }

  const incrementMetric = async goal => {
    const current = progressByGoal[goal.id]?.daily_breakdown?.find(day => day.date === todayISO)?.completed ?? 0
    await logProgress(goal, current + 1)
  }

  const updateFormField = (field, value) => {
    setGoalForm(current => ({ ...current, [field]: value }))
  }

  const resetGoalForm = () => {
    setGoalForm(initialGoalForm)
    setEditingGoalId('')
  }

  const submitGoalForm = async event => {
    event.preventDefault()
    setGoalError('')
    setGoalMessage('')

    const validationError = validateGoalForm(goalForm)
    if (validationError) {
      setGoalError(validationError)
      return
    }

    try {
      const payload = buildGoalPayload(goalForm)
      if (editingGoalId) {
        await goalsApi.update(editingGoalId, payload)
        setGoalMessage('Goal updated.')
      } else {
        await goalsApi.create(payload)
        setGoalMessage('Goal created.')
      }
      resetGoalForm()
      await refreshData(weekStart)
    } catch (err) {
      setGoalError(err.message)
    }
  }

  const startEditingGoal = goal => {
    setGoalError('')
    setGoalMessage('')
    setEditingGoalId(goal.id)
    setGoalForm({
      title: goal.title,
      type: goal.type,
      frequency: goal.frequency,
      target: goal.target_value == null ? '' : String(goal.target_value),
      reminders: (goal.reminder_times ?? []).join(', ')
    })
  }

  const archiveGoal = async goal => {
    setGoalError('')
    setGoalMessage('')
    try {
      await goalsApi.update(goal.id, { is_active: false })
      setGoalMessage(`Archived "${goal.title}".`)
      if (editingGoalId === goal.id) {
        resetGoalForm()
      }
      await refreshData(weekStart)
    } catch (err) {
      setGoalError(err.message)
    }
  }

  const removeGoal = async goal => {
    setGoalError('')
    setGoalMessage('')
    try {
      await goalsApi.delete(goal.id)
      setGoalMessage(`Deleted "${goal.title}".`)
      if (editingGoalId === goal.id) {
        resetGoalForm()
      }
      await refreshData(weekStart)
    } catch (err) {
      setGoalError(err.message)
    }
  }

  if (!isAuthed) {
    return <AuthPanel onAuthenticated={() => setIsAuthed(true)} />
  }

  const counts = summarizeGoals(progress?.goals ?? [])
  const statusContext = getStatusContext(isCurrentWeek, progress?.days_elapsed ?? 7)

  return (
    <main>
      <h1>Personal Goals Tracker</h1>
      <nav>
        {['today', 'progress', 'reminders'].map(v => (
          <button key={v} onClick={() => setView(v)}>
            {v}
          </button>
        ))}
      </nav>

      <section>
        <h2>{editingGoalId ? 'Edit goal' : 'Create goal'}</h2>
        <form onSubmit={submitGoalForm}>
          <input
            aria-label="Goal title"
            value={goalForm.title}
            onChange={event => updateFormField('title', event.target.value)}
            placeholder="Goal title"
          />
          <select aria-label="Goal type" value={goalForm.type} onChange={event => updateFormField('type', event.target.value)}>
            <option value="habit">habit</option>
            <option value="metric">metric</option>
            <option value="project">project</option>
          </select>
          <input
            aria-label="Goal frequency"
            value={goalForm.frequency}
            onChange={event => updateFormField('frequency', event.target.value)}
            placeholder="daily / weekly"
          />
          <input
            aria-label="Goal target"
            type="number"
            min="0"
            step="1"
            disabled={goalForm.type !== 'metric'}
            value={goalForm.target}
            onChange={event => updateFormField('target', event.target.value)}
            placeholder="Target value"
          />
          <input
            aria-label="Goal reminders"
            value={goalForm.reminders}
            onChange={event => updateFormField('reminders', event.target.value)}
            placeholder="09:00, 18:30"
          />
          <button type="submit">{editingGoalId ? 'Save changes' : 'Create goal'}</button>
          {editingGoalId && <button onClick={resetGoalForm}>Cancel edit</button>}
        </form>
        <p>Reminder values saved: {parseReminderTimes(goalForm.reminders).length}</p>
        {goalMessage && <p>{goalMessage}</p>}
        {goalError && <p role="alert">{goalError}</p>}
      </section>

      {loading && <p>Loading...</p>}
      {error && <p role="alert">{error}</p>}

      {view === 'today' && (
        <section>
          {goals.map(goal => {
            const goalProgress = progressByGoal[goal.id]
            const todayValue = goalProgress?.daily_breakdown?.find(day => day.date === todayISO)?.completed ?? 0
            return (
              <article key={goal.id}>
                <strong>{goal.title}</strong>
                <span> ({goal.frequency}) </span>
                <span>{goal.is_active ? 'active' : 'archived'}</span>
                {isMetricGoal(goal) ? (
                  <>
                    <span>
                      {todayValue}/{goal.target_value ?? 0}
                    </span>
                    <button onClick={() => incrementMetric(goal)} disabled={!goal.is_active}>
                      +1
                    </button>
                  </>
                ) : (
                  <button onClick={() => toggleBinary(goal)} disabled={!goal.is_active}>
                    {todayValue > 0 ? 'Done' : 'Mark done'}
                  </button>
                )}
                <button onClick={() => startEditingGoal(goal)}>Edit</button>
                <button onClick={() => archiveGoal(goal)} disabled={!goal.is_active}>
                  Archive
                </button>
                <button onClick={() => removeGoal(goal)}>Delete</button>
              </article>
            )
          })}
        </section>
      )}

      {view === 'progress' && (
        <section>
          <label htmlFor="week-selector">Week</label>{' '}
          <select id="week-selector" value={weekStart} onChange={event => setWeekStart(event.target.value)}>
            {weekOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <p>{statusContext}</p>
          {(progress?.goals ?? []).map(goal => (
            <article key={goal.goal_id}>
              <strong>{goal.goal_title}</strong>
              <span>
                {' '}
                {goal.completed}/{goal.target} ({goal.percent}%)
              </span>
              <span> — {getStatusBadge(goal)}</span>
              <p>{getGoalGuidance(goal, isCurrentWeek, progress?.days_elapsed ?? 7)}</p>
            </article>
          ))}
          <div>
            <p>On track: {counts.onTrack}</p>
            <p>At risk: {counts.atRisk}</p>
            <p>Behind: {counts.behind}</p>
            <p>Logged entries this week: {logs.length}</p>
          </div>
        </section>
      )}

      {view === 'reminders' && <section>Reminder preferences are managed per goal in backend payload.</section>}
    </main>
  )
}
