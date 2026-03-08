import test from 'node:test'
import assert from 'node:assert/strict'
import { apiRequest, goalsApi } from './api.js'

function installStorage(token = '') {
  globalThis.localStorage = {
    getItem(key) {
      return key === 'auth_token' ? token : null
    }
  }
}

test('apiRequest sends auth header and parses response json', async () => {
  installStorage('abc123')
  let capturedHeaders = null
  globalThis.fetch = async (_url, options) => {
    capturedHeaders = options.headers
    return {
      ok: true,
      status: 200,
      json: async () => ({ ok: true })
    }
  }

  const payload = await apiRequest('/goals')
  assert.deepEqual(payload, { ok: true })
  assert.equal(capturedHeaders.Authorization, 'Bearer abc123')
})

test('apiRequest throws backend detail on non-ok responses', async () => {
  installStorage()
  globalThis.fetch = async () => ({
    ok: false,
    status: 400,
    json: async () => ({ detail: 'Bad request' })
  })

  await assert.rejects(() => apiRequest('/goals'), /Bad request/)
})

test('goalsApi create/update/delete use expected methods and urls', async () => {
  installStorage()
  const calls = []
  globalThis.fetch = async (url, options) => {
    calls.push({ url, method: options.method })
    return {
      ok: true,
      status: options.method === 'DELETE' ? 204 : 200,
      json: async () => ({ id: 'goal-1' })
    }
  }

  await goalsApi.create({ title: 'x' })
  await goalsApi.update('goal-1', { title: 'y' })
  await goalsApi.delete('goal-1')

  assert.equal(calls[0].url.endsWith('/goals'), true)
  assert.equal(calls[0].method, 'POST')
  assert.equal(calls[1].url.endsWith('/goals/goal-1'), true)
  assert.equal(calls[1].method, 'PUT')
  assert.equal(calls[2].url.endsWith('/goals/goal-1'), true)
  assert.equal(calls[2].method, 'DELETE')
})
