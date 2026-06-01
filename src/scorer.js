'use strict'

// Pure, dependency-free PR hygiene scorer.
// Takes a normalized PR object and returns a vibe result. No I/O, no SDKs —
// which is exactly why it's so easy to unit-test and to run locally.

const CODE_EXTENSIONS =
  /\.(js|jsx|ts|tsx|mjs|cjs|py|rb|go|rs|java|kt|swift|c|h|cc|cpp|hpp|cs|php|scala|ex|exs|dart|vue|svelte)$/i

const TEST_PATTERNS =
  /(^|\/)(__tests__|tests?|spec|e2e)\//i

const TEST_FILE = /(\.test\.|\.spec\.|_test\.|_spec\.|\.feature$)/i

const GENERIC_TITLE =
  /^(wip|update|updates|fix|fixes|fixed|changes|change|stuff|misc|temp|tmp|test|asdf|.|patch|minor|cleanup|refactor|tweaks?)\.?$/i

const ISSUE_REF = /\b(close[sd]?|fix(e[sd])?|resolve[sd]?)\b[^\n]*#\d+|#\d+/i

const RATINGS = [
  { min: 90, rating: 'Immaculate vibes', emoji: '✨' },
  { min: 75, rating: 'Solid vibes', emoji: '😎' },
  { min: 50, rating: 'Mixed vibes', emoji: '🤔' },
  { min: 25, rating: 'Sus vibes', emoji: '😬' },
  { min: 0, rating: 'Cursed vibes', emoji: '💀' }
]

function rate(score) {
  return RATINGS.find((r) => score >= r.min) || RATINGS[RATINGS.length - 1]
}

function meterFor(score) {
  const filled = Math.round((Math.max(0, Math.min(100, score)) / 100) * 10)
  return '▰'.repeat(filled) + '▱'.repeat(10 - filled)
}

function check(label, points, max, note) {
  const ratio = max === 0 ? 1 : points / max
  const status = ratio >= 0.85 ? 'good' : ratio >= 0.4 ? 'warn' : 'bad'
  const icon = status === 'good' ? '✅' : status === 'warn' ? '⚠️' : '❌'
  return { label, points, max, note, status, icon }
}

function scoreTitle(title) {
  const t = (title || '').trim()
  if (!t) return check('Title', 0, 20, 'No title at all. Bold strategy.')
  if (GENERIC_TITLE.test(t)) return check('Title', 5, 20, `"${t}" tells reviewers nothing.`)
  if (t.length < 10) return check('Title', 11, 20, 'A little terse — add a few words of intent.')
  if (t.length > 72) return check('Title', 14, 20, 'Title novella detected. Trim to a headline.')
  return check('Title', 20, 20, 'Clear and scannable.')
}

function scoreDescription(body) {
  const b = (body || '').trim()
  if (!b) return check('Description', 0, 20, 'Empty description. What does this even do?')
  if (b.length < 30) return check('Description', 8, 20, 'Barely a sentence — what & why, please.')
  const rich = /(^|\n)\s*[-*] \[[ x]\]/i.test(b) || /(^|\n)#{1,3}\s/.test(b)
  if (rich) return check('Description', 20, 20, 'Thorough write-up with structure. Chef’s kiss.')
  return check('Description', 16, 20, 'Decent context. A checklist would top it off.')
}

function scoreSize(additions, deletions) {
  const lines = (additions || 0) + (deletions || 0)
  if (lines === 0) return check('Size', 6, 20, 'No line changes detected.')
  if (lines <= 250) return check('Size', 20, 20, `${lines} lines — reviewable in one sitting.`)
  if (lines <= 600) return check('Size', 14, 20, `${lines} lines — getting chunky.`)
  if (lines <= 1000) return check('Size', 8, 20, `${lines} lines — consider splitting this up.`)
  return check('Size', 4, 20, `${lines} lines — absolute unit. Reviewers weep.`)
}

function scoreFocus(changedFiles) {
  const f = changedFiles || 0
  if (f === 0) return check('Focus', 8, 15, 'No files reported.')
  if (f <= 10) return check('Focus', 15, 15, `${f} files — tightly scoped.`)
  if (f <= 25) return check('Focus', 10, 15, `${f} files — a broad sweep.`)
  if (f <= 50) return check('Focus', 6, 15, `${f} files — that's a lot of surface area.`)
  return check('Focus', 3, 15, `${f} files — blast radius approaching orbital.`)
}

function scoreTests(files) {
  const names = (files || []).map((f) => f.filename || '')
  const hasTests = names.some((n) => TEST_PATTERNS.test(n) || TEST_FILE.test(n))
  if (hasTests) return check('Tests', 15, 15, 'Tests included. We love to see it.')
  const codeFiles = names.filter((n) => CODE_EXTENSIONS.test(n))
  if (codeFiles.length === 0) {
    return check('Tests', 11, 15, 'Docs/config PR — tests optional here.')
  }
  return check('Tests', 0, 15, 'Code changed but no tests touched. Living dangerously.')
}

function scoreContext(title, body) {
  const text = `${title || ''}\n${body || ''}`
  if (ISSUE_REF.test(text)) return check('Context', 10, 10, 'Linked to an issue. Traceable.')
  return check('Context', 0, 10, 'No issue reference (e.g. "Closes #123").')
}

/**
 * Score a pull request's hygiene "vibes".
 * @param {object} pr
 * @param {string} pr.title
 * @param {string} pr.body
 * @param {number} pr.additions
 * @param {number} pr.deletions
 * @param {number} pr.changedFiles
 * @param {number} [pr.commits]
 * @param {Array<{filename:string}>} [pr.files]
 * @param {string[]} [pr.labels]
 * @param {boolean} [pr.isDraft]
 * @returns {{score:number, rating:string, emoji:string, meter:string, checks:Array}}
 */
function scoreVibe(pr = {}) {
  const checks = [
    scoreTitle(pr.title),
    scoreDescription(pr.body),
    scoreSize(pr.additions, pr.deletions),
    scoreFocus(pr.changedFiles),
    scoreTests(pr.files),
    scoreContext(pr.title, pr.body)
  ]
  const score = Math.round(checks.reduce((sum, c) => sum + c.points, 0))
  const { rating, emoji } = rate(score)
  return { score, rating, emoji, meter: meterFor(score), checks }
}

module.exports = { scoreVibe, rate, meterFor }
