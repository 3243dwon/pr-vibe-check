'use strict'

// Thin Anthropic Messages API client over native fetch — no SDK dependency, so
// the bundle stays small and the action's only deps are the GitHub toolkit.
// fetchImpl is injectable purely so tests run without a network or API key.

async function requestVibe({ apiKey, model, system, user, maxTokens = 1024, fetchImpl = globalThis.fetch }) {
  if (!apiKey) throw new Error('missing Anthropic API key')
  if (typeof fetchImpl !== 'function') throw new Error('no fetch implementation available')

  const res = await fetchImpl('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      model: model || 'claude-sonnet-4-6',
      max_tokens: maxTokens,
      system,
      messages: [{ role: 'user', content: user }]
    })
  })

  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    throw new Error(`Anthropic API ${res.status}: ${detail.slice(0, 200)}`)
  }

  const data = await res.json()
  const text = (data.content || [])
    .filter((b) => b.type === 'text')
    .map((b) => b.text)
    .join('')
    .trim()
  if (!text) throw new Error('empty response from Claude')
  return text
}

module.exports = { requestVibe }
