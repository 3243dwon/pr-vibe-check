'use strict'

const { test } = require('node:test')
const assert = require('node:assert/strict')
const {
  buildSystem,
  buildUser,
  summarizeDiff,
  renderComment,
  extractRating,
  MARKER,
  SEVERITY_PROMPTS
} = require('../src/vibe')

const PR = {
  title: 'Refactor auth middleware',
  body: 'Splits the auth middleware into smaller units. Closes #77.',
  user: { login: 'octocat' },
  additions: 120,
  deletions: 30
}
const FILES = [
  { filename: 'src/auth/index.js', additions: 80, deletions: 20, patch: '@@ -1 +1 @@\n-old\n+new' },
  { filename: 'src/auth/index.test.js', additions: 40, deletions: 10, patch: '@@ +test' }
]

test('buildSystem injects the severity note', () => {
  assert.ok(buildSystem('brutal').includes(SEVERITY_PROMPTS.brutal))
  assert.ok(buildSystem('soft').includes(SEVERITY_PROMPTS.soft))
  // unknown severity falls back to normal
  assert.ok(buildSystem('chaos').includes(SEVERITY_PROMPTS.normal))
})

test('buildUser includes PR deets and the required headers', () => {
  const u = buildUser(PR, FILES)
  assert.ok(u.includes('Refactor auth middleware'))
  assert.ok(u.includes('@octocat'))
  assert.ok(u.includes('Files changed: 2'))
  for (const h of ['THE VIBE', 'SLAY MOMENTS', 'L MOMENTS', 'VERDICT', 'VIBE RATING']) {
    assert.ok(u.includes(h), `missing header ${h}`)
  }
})

test('buildUser flags a missing description', () => {
  const u = buildUser({ ...PR, body: '' }, FILES)
  assert.ok(u.includes('no description'))
})

test('summarizeDiff caps files and total length', () => {
  const many = Array.from({ length: 50 }, (_, i) => ({
    filename: `f${i}.js`,
    additions: 1,
    deletions: 0,
    patch: 'x'.repeat(5000)
  }))
  const out = summarizeDiff(many)
  assert.ok(out.length <= 12000)
  assert.ok(!out.includes('f25.js'), 'should cap at 20 files')
})

test('renderComment has the marker, brand, severity and footer', () => {
  const md = renderComment('**✨ THE VIBE**\nclean', 'brutal')
  assert.ok(md.includes(MARKER))
  assert.ok(md.includes('PR Vibe Check™'))
  assert.ok(md.includes('severity: `brutal`'))
  assert.ok(md.includes('github.com/3243dwon/pr-vibe-check'))
})

test('extractRating parses the rating, tolerating spacing', () => {
  assert.equal(extractRating('blah **📊 VIBE RATING: 7/10** ✨'), 7)
  assert.equal(extractRating('VIBE RATING:  10 / 10'), 10)
  assert.equal(extractRating('no rating here'), null)
  assert.equal(extractRating('VIBE RATING: 99/10'), null) // out of range
})
