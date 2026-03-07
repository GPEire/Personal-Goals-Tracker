const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

export async function apiRequest(path, options = {}) {
  const token = localStorage.getItem('auth_token')
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE}${path}`, { ...options, headers })
  if (!response.ok) {
    const payload = await response.json().catch(() => ({ detail: 'Request failed' }))
    throw new Error(payload.detail || 'Request failed')
  }

  return response.status === 204 ? null : response.json()
}

export const authApi = {
  requestLink: email => apiRequest('/auth/request-link', { method: 'POST', body: JSON.stringify({ email }) }),
  verify: (email, token) => apiRequest('/auth/verify', { method: 'POST', body: JSON.stringify({ email, token }) })
}

export const goalsApi = {
  list: () => apiRequest('/goals')
}

export const logsApi = {
  create: payload => apiRequest('/logs', { method: 'POST', body: JSON.stringify(payload) }),
  listForWeek: weekStart => apiRequest(`/logs?week_start=${weekStart}`)
}

export const progressApi = {
  weekly: weekStart => apiRequest(`/progress/weekly?week_start=${weekStart}`)
}
