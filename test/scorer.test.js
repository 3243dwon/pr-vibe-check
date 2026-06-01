'use strict'

const { test } = require('node:test')
const assert = require('node:assert/strict')
const { scoreVibe, rate, meterFor } = require('../src/scorer')
const { renderComment, MARKER } = require('../src/comment')

const GREAT_PR = {
  title: 'Add retry logic to the payments webhook handler',
  body: '## What\nAdds exponential backoff when Stripe webhooks fail.\n\n## Why\nCloses #482 — we were dropping events during outages.\n\n- [x] Tests added\n- [x] Docs updated',
  additions: 120,
  deletions: 30,
  changedFiles: 4,
  commits: 3,
  files: [
    { filename: 'src/payments/webhook.js' },
    { filename: 'src/payments/__tests__/webhook.test.js' },
    { filename: 'README.md' }
  ]
}

const CURSED_PR = {
  title: 'fix',
  body: '',
  additions: 1900,
  deletions: 400,
  changedFiles: 73,
  commits: 41,
  files: [{ filename: 'src/a.js' }, { filename: 'src/b.js' }]
}

test('a clean PR earns high vibes', () => {
  const r = scoreVibe(GREAT_PR)
  assert.ok(r.score >= 90, `expected >=90, got ${r.score}`)
  assert.equal(r.emoji, '✨')
  assert.equal(r.rating, 'Immaculate vibes')
  assert.equal(r.meter.length, 10)
})

test('a messy PR earns cursed vibes', () => {
  const r = scoreVibe(CURSED_PR)
  assert.ok(r.score <= 25, `expected <=25, got ${r.score}`)
  assert.equal(r.emoji, '💀')
})

test('score is always within 0..100 and checks sum to it', () => {
  for (const pr of [GREAT_PR, CURSED_PR, {}]) {
    const r = scoreVibe(pr)
    assert.ok(r.score >= 0 && r.score <= 100)
    const sum = r.checks.reduce((s, c) => s + c.points, 0)
    assert.equal(r.score, sum)
  }
})

test('docs-only PRs are not punished for missing tests', () => {
  const r = scoreVibe({
    title: 'Improve the getting-started guide',
    body: 'Clarifies install steps. Closes #12.',
    additions: 40,
    deletions: 5,
    changedFiles: 2,
    files: [{ filename: 'docs/intro.md' }, { filename: 'README.md' }]
  })
  const tests = r.checks.find((c) => c.label === 'Tests')
  assert.ok(tests.points > 0, 'docs PR should get partial test credit')
})

test('rate() bands are correct at the boundaries', () => {
  assert.equal(rate(90).emoji, '✨')
  assert.equal(rate(89).emoji, '😎')
  assert.equal(rate(74).emoji, '🤔')
  assert.equal(rate(49).emoji, '😬')
  assert.equal(rate(0).emoji, '💀')
})

test('meterFor() renders 10 cells', () => {
  assert.equal(meterFor(0), '▱▱▱▱▱▱▱▱▱▱')
  assert.equal(meterFor(100), '▰▰▰▰▰▰▰▰▰▰')
  assert.equal(meterFor(55).length, 10)
})

test('renderComment includes the marker and score', () => {
  const r = scoreVibe(GREAT_PR)
  const md = renderComment(r, { mode: 'hygiene' })
  assert.ok(md.includes(MARKER))
  assert.ok(md.includes(`${r.score}/100`))
  assert.ok(md.includes('PR Vibe Check'))
})

test('renderComment shows the AI section in both mode', () => {
  const r = scoreVibe(GREAT_PR)
  const md = renderComment(r, {
    mode: 'both',
    ai: { score: 88, vibe: 'Clean and well-tested', summary: 'Solid retry logic. Watch the backoff cap.' }
  })
  assert.ok(md.includes('AI vibe read'))
  assert.ok(md.includes('Clean and well-tested'))
})
