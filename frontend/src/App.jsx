import { useEffect, useMemo, useState } from 'react'
import { apiRequest } from './api'
import { Tabs } from './components/Tabs'

const emptyGoal = {
  title: '',
  type: 'habit',
  frequency: 'daily',
  target_value: '',
  reminder_times: '',
  description: ''
}

export default function App() {
  const [activeTab, setActiveTab] = useState('Today')
  const [email, setEmail] = useState('')
  const [tokenInput, setTokenInput] = useState('')
  const [devToken, setDevToken] = useState('')
  const [goals, setGoals] = useState([])
  const [form, setForm] = useState(emptyGoal)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const isAuthed = Boolean(localStorage.getItem('auth_token'))

  const todayGoals = useMemo(() => goals.filter(goal => goal.is_active), [goals])

  async function loadGoals() {
    setLoading(true)
    setError('')
    try {
      const data = await apiRequest('/goals')
      setGoals(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isAuthed) {
      loadGoals()
    }
  }, [isAuthed])

  async function requestMagicLink(event) {
    event.preventDefault()
    setError('')
    const data = await apiRequest('/auth/request-link', {
      method: 'POST',
      body: JSON.stringify({ email })
    })
    setDevToken(data.message.split(': ').at(-1) || '')
  }

  async function verifyToken(event) {
    event.preventDefault()
    setError('')
    try {
      const data = await apiRequest('/auth/verify', {
        method: 'POST',
        body: JSON.stringify({ email, token: tokenInput })
      })
      localStorage.setItem('auth_token', data.access_token)
      await loadGoals()
    } catch (err) {
      setError(err.message)
    }
  }


  async function deleteGoal(goalId) {
    setError('')
    try {
      await apiRequest(`/goals/${goalId}`, { method: 'DELETE' })
      await loadGoals()
    } catch (err) {
      setError(err.message)
    }
  }

  async function createGoal(event) {
    event.preventDefault()
    setError('')
    try {
      await apiRequest('/goals', {
        method: 'POST',
        body: JSON.stringify({
          ...form,
          target_value: form.target_value ? Number(form.target_value) : null,
          reminder_times: form.reminder_times
            .split(',')
            .map(time => time.trim())
            .filter(Boolean)
        })
      })
      setForm(emptyGoal)
      await loadGoals()
    } catch (err) {
      setError(err.message)
    }
  }

  if (!isAuthed) {
    return (
      <main className="container">
        <h1>Personal Resolution Tracker</h1>
        <p>Sign in with a magic link to manage your goals.</p>
        <form onSubmit={requestMagicLink} className="card">
          <input required type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
          <button type="submit">Request link</button>
        </form>
        <form onSubmit={verifyToken} className="card">
          <input required placeholder="Paste token" value={tokenInput} onChange={e => setTokenInput(e.target.value)} />
          <button type="submit">Verify</button>
        </form>
        {devToken && <p className="hint">Dev token: {devToken}</p>}
        {error && <p className="error">{error}</p>}
      </main>
    )
  }

  return (
    <main className="container">
      <h1>Personal Resolution Tracker</h1>
      <Tabs activeTab={activeTab} onChange={setActiveTab} />

      {activeTab === 'Today' && (
        <section className="card">
          <h2>Today</h2>
          <ul>{todayGoals.map(goal => <li key={goal.id}>{goal.title}</li>)}</ul>
          {!todayGoals.length && <p>No active goals yet.</p>}
        </section>
      )}

      {activeTab === 'Goals' && (
        <>
          <form onSubmit={createGoal} className="card">
            <h2>Add Goal</h2>
            <input required placeholder="Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
            <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
              <option value="habit">Habit</option>
              <option value="metric">Metric</option>
              <option value="project">Project</option>
            </select>
            <input required placeholder="Frequency" value={form.frequency} onChange={e => setForm({ ...form, frequency: e.target.value })} />
            <input placeholder="Target value" value={form.target_value} onChange={e => setForm({ ...form, target_value: e.target.value })} />
            <input placeholder="Reminder times (comma separated HH:MM)" value={form.reminder_times} onChange={e => setForm({ ...form, reminder_times: e.target.value })} />
            <textarea placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            <button type="submit">Create goal</button>
          </form>

          <section className="card">
            <h2>Goal List</h2>
            {loading ? <p>Loading...</p> : <ul>{goals.map(goal => <li key={goal.id}>{goal.title} · {goal.frequency} <button onClick={() => deleteGoal(goal.id)}>Delete</button></li>)}</ul>}
          </section>
        </>
      )}

      {activeTab === 'History' && (
        <section className="card">
          <h2>History</h2>
          <p>History logging ships in Iteration 2.</p>
        </section>
      )}

      {error && <p className="error">{error}</p>}
    </main>
  )
}
