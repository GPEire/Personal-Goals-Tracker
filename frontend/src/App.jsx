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
      <button onClick={requestLink}>Request magic link</button>
      <input aria-label="Token" value={token} onChange={e => setToken(e.target.value)} placeholder="Paste token" />
      <button onClick={verify}>Verify</button>
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
                {isMetricGoal(goal) ? (
                  <>
                    <span>
                      {todayValue}/{goal.target_value ?? 0}
                    </span>
                    <button onClick={() => incrementMetric(goal)}>+1</button>
                  </>
                ) : (
                  <button onClick={() => toggleBinary(goal)}>{todayValue > 0 ? 'Done' : 'Mark done'}</button>
                )}
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
