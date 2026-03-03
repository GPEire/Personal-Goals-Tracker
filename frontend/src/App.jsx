import { useMemo, useState } from 'react'
import { Tabs } from './components/Tabs'

const emptyGoal = {
  title: '',
  type: 'habit',
  frequency: 'daily',
  target_value: '',
  reminder_times: '',
  description: ''
}

const starterGoals = [
  { id: 1, title: 'Morning walk', type: 'habit', frequency: 'daily', is_active: true },
  { id: 2, title: 'Read 10 pages', type: 'habit', frequency: 'daily', is_active: true }
]

export default function App() {
  const [activeTab, setActiveTab] = useState('Today')
  const [goals, setGoals] = useState(starterGoals)
  const [form, setForm] = useState(emptyGoal)

  const todayGoals = useMemo(() => goals.filter(goal => goal.is_active), [goals])

  function deleteGoal(goalId) {
    setGoals(current => current.filter(goal => goal.id !== goalId))
  }

  function createGoal(event) {
    event.preventDefault()

    const nextGoal = {
      id: Date.now(),
      title: form.title,
      type: form.type,
      frequency: form.frequency,
      target_value: form.target_value ? Number(form.target_value) : null,
      reminder_times: form.reminder_times
        .split(',')
        .map(time => time.trim())
        .filter(Boolean),
      description: form.description,
      is_active: true
    }

    setGoals(current => [nextGoal, ...current])
    setForm(emptyGoal)
  }

  return (
    <main className="container">
      <h1>Personal Resolution Tracker</h1>
      <p className="hint">UI-only iteration: no login, backend, or database required.</p>
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
            <ul>
              {goals.map(goal => (
                <li key={goal.id}>
                  {goal.title} · {goal.frequency} <button onClick={() => deleteGoal(goal.id)}>Delete</button>
                </li>
              ))}
            </ul>
            {!goals.length && <p>No goals yet. Add your first one above.</p>}
          </section>
        </>
      )}

      {activeTab === 'History' && (
        <section className="card">
          <h2>History</h2>
          <p>History and progress analytics will return in a later iteration.</p>
        </section>
      )}
    </main>
  )
}
