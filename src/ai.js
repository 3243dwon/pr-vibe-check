'use strict'

// Optional "AI vibe read" — sends the diff to Claude and asks for a short,
// human verdict. Uses native fetch so we don't pull in an SDK. fetchImpl is
// injectable purely so tests can run without a network or API key.

const MAX_DIFF_CHARS = 12000

const SYSTEM = [
  'You are "PR Vibe Check", a witty but genuinely helpful senior engineer.',
  'You read a pull request diff and give it a quick "vibe" read.',
  'Be concise, kind, and specific. One light joke max.',
  'Respond with ONLY a JSON object, no markdown fence, of the exact shape:',
  '{"score": <integer 0-100>, "vibe": "<=8 word verdict", "summary": "2-3 sentence read"}'
].join(' ')

function extractJson(text) {
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start === -1 || end === -1 || end < start) throw new Error('no JSON object in model response')
  return JSON.parse(text.slice(start, end + 1))
}

/**
 * @param {object} args
 * @param {string} args.diff      unified diff text
 * @param {string} args.apiKey    Anthropic API key
 * @param {string} args.model     model id
 * @param {function} [args.fetchImpl] defaults to global fetch
 * @returns {Promise<{score:number, vibe:string, summary:string}>}
 */
async function aiVibe({ diff, apiKey, model, fetchImpl = globalThis.fetch }) {
  if (!apiKey) throw new Error('missing Anthropic API key')
  if (typeof fetchImpl !== 'function') throw new Error('no fetch implementation available')

  const truncated = String(diff || '').slice(0, MAX_DIFF_CHARS)
  const res = await fetchImpl('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      model: model || 'claude-haiku-4-5-20251001',
      max_tokens: 400,
      system: SYSTEM,
      messages: [{ role: 'user', content: `Here is the PR diff:\n\n${truncated}` }]
    })
  })

  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    throw new Error(`Anthropic API ${res.status}: ${detail.slice(0, 200)}`)
  }

  const data = await res.json()
  const text = (data.content || []).map((b) => b.text || '').join('').trim()
  const parsed = extractJson(text)
  const score = Math.max(0, Math.min(100, Math.round(Number(parsed.score))))
  return {
    score: Number.isFinite(score) ? score : 50,
    vibe: String(parsed.vibe || 'Vibes unclear').slice(0, 120),
    summary: String(parsed.summary || '').slice(0, 600)
  }
}

module.exports = { aiVibe, MAX_DIFF_CHARS }
