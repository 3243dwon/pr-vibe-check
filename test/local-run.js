'use strict'

/**
 * Run the action locally with a MOCKED @actions/core and @actions/github.
 *
 * Because src/index.js#run() accepts its toolkit via dependency injection, we
 * can drive the real action logic end-to-end — scoring, comment rendering,
 * comment upsert, outputs, fail-under — without a network, a token, or a real
 * GitHub event. This is both a smoke test and a way to preview the comment.
 *
 *   npm run test:local
 */

const { run } = require('../src/index')

// ---- mock @actions/core -----------------------------------------------------
function makeCore(inputs) {
  const captured = { outputs: {}, failed: null, logs: [] }
  const log = (level, msg) => captured.logs.push(`[${level}] ${msg}`)
  return {
    captured,
    core: {
      getInput: (name) => (inputs[name] != null ? String(inputs[name]) : ''),
      getBooleanInput: (name) => String(inputs[name]).toLowerCase() === 'true',
      setOutput: (k, v) => {
        captured.outputs[k] = v
      },
      setFailed: (m) => {
        captured.failed = m
        log('failed', m)
      },
      info: (m) => log('info', m),
      warning: (m) => log('warning', m),
      error: (m) => log('error', m),
      debug: () => {},
      summary: { addRaw: () => ({ write: async () => {} }) }
    }
  }
}

// ---- mock @actions/github (context + octokit) -------------------------------
function makeGithub({ pr, files, diff, comments = [] }) {
  const state = { comments: [...comments], created: [], updated: [] }
  let nextId = 1000
  const octokit = {
    rest: {
      pulls: {
        get: async (params) => {
          if (params.mediaType && params.mediaType.format === 'diff') {
            return { data: diff || '' }
          }
          return { data: pr }
        },
        listFiles: async () => ({ data: files })
      },
      issues: {
        listComments: async () => ({ data: state.comments }),
        createComment: async ({ body }) => {
          const c = { id: ++nextId, body }
          state.comments.push(c)
          state.created.push(c)
          return { data: c }
        },
        updateComment: async ({ comment_id, body }) => {
          const c = state.comments.find((x) => x.id === comment_id)
          if (c) c.body = body
          state.updated.push({ id: comment_id, body })
          return { data: c }
        }
      }
    },
    // our paginate just unwraps .data since the fakes return a single page
    paginate: async (method, params) => (await method(params)).data
  }
  const github = {
    context: { repo: { owner: '3243dwon', repo: 'pr-vibe-check' }, payload: { pull_request: pr } },
    getOctokit: () => octokit
  }
  return { github, octokit, state }
}

// ---- canned Anthropic response, so "both"/"ai" mode runs offline ------------
function makeFakeFetch(payload) {
  return async () => ({
    ok: true,
    status: 200,
    json: async () => ({ content: [{ type: 'text', text: JSON.stringify(payload) }] }),
    text: async () => JSON.stringify(payload)
  })
}

const SCENARIOS = [
  {
    name: 'Immaculate PR (hygiene mode)',
    inputs: { 'github-token': 'x', mode: 'hygiene', comment: 'true' },
    pr: {
      number: 7,
      title: 'Add retry logic to the payments webhook handler',
      body: '## What\nExponential backoff for failed Stripe webhooks.\n\n## Why\nCloses #482.\n\n- [x] Tests\n- [x] Docs',
      additions: 120,
      deletions: 30,
      changed_files: 4,
      commits: 3,
      labels: [{ name: 'enhancement' }],
      draft: false
    },
    files: [
      { filename: 'src/payments/webhook.js' },
      { filename: 'src/payments/__tests__/webhook.test.js' },
      { filename: 'README.md' }
    ],
    expect: { minScore: 90, failed: false }
  },
  {
    name: 'Cursed PR (hygiene mode, fail-under=50)',
    inputs: { 'github-token': 'x', mode: 'hygiene', 'fail-under': '50', comment: 'true' },
    pr: {
      number: 9,
      title: 'fix',
      body: '',
      additions: 1900,
      deletions: 400,
      changed_files: 73,
      commits: 41,
      labels: [],
      draft: false
    },
    files: [{ filename: 'src/a.js' }, { filename: 'src/b.js' }],
    expect: { maxScore: 25, failed: true }
  },
  {
    name: 'AI + hygiene (both mode, mocked Claude + existing comment to update)',
    inputs: {
      'github-token': 'x',
      mode: 'both',
      'anthropic-api-key': 'sk-test',
      'ai-model': 'claude-haiku-4-5-20251001',
      comment: 'true'
    },
    pr: {
      number: 11,
      title: 'Refactor auth middleware',
      body: 'Splits the auth middleware into smaller units. Closes #77.',
      additions: 210,
      deletions: 140,
      changed_files: 6,
      commits: 4,
      labels: [],
      draft: false
    },
    files: [{ filename: 'src/auth/index.js' }, { filename: 'src/auth/index.test.js' }],
    diff: 'diff --git a/src/auth/index.js b/src/auth/index.js\n@@ -1 +1 @@\n-old\n+new\n',
    comments: [{ id: 500, body: '<!-- pr-vibe-check:do-not-remove -->\n## old comment' }],
    fetch: makeFakeFetch({
      score: 86,
      vibe: 'Clean split, well covered',
      summary: 'Nicely decomposed middleware with matching tests. Double-check the error path on token refresh.'
    }),
    expect: { minScore: 80, failed: false, updated: true }
  }
]

async function main() {
  let failures = 0
  for (const s of SCENARIOS) {
    const { core, captured } = makeCore(s.inputs)
    const { github, state } = makeGithub({ pr: s.pr, files: s.files, diff: s.diff, comments: s.comments })

    await run({ core, github, octokit: github.getOctokit(), fetch: s.fetch })

    const score = Number(captured.outputs.score)
    const posted = state.created[0] || state.updated[0]
    const body = posted ? posted.body : state.comments.slice(-1)[0]?.body

    // assertions
    const problems = []
    if (s.expect.minScore != null && !(score >= s.expect.minScore)) problems.push(`score ${score} < ${s.expect.minScore}`)
    if (s.expect.maxScore != null && !(score <= s.expect.maxScore)) problems.push(`score ${score} > ${s.expect.maxScore}`)
    if (s.expect.failed === true && !captured.failed) problems.push('expected setFailed but none')
    if (s.expect.failed === false && captured.failed) problems.push(`unexpected setFailed: ${captured.failed}`)
    if (s.expect.updated && state.updated.length === 0) problems.push('expected an updated comment')

    const ok = problems.length === 0
    if (!ok) failures++

    console.log('\n' + '═'.repeat(72))
    console.log(`${ok ? '✅ PASS' : '❌ FAIL'}  ${s.name}`)
    console.log('═'.repeat(72))
    console.log(`outputs : ${JSON.stringify(captured.outputs)}`)
    console.log(`failed  : ${captured.failed || '—'}`)
    console.log(`comment : ${state.created.length ? 'created' : ''}${state.updated.length ? 'updated' : ''}`)
    if (problems.length) console.log(`problems: ${problems.join('; ')}`)
    console.log('\n--- rendered comment ' + '-'.repeat(50))
    console.log(body)
  }

  console.log('\n' + '═'.repeat(72))
  console.log(failures === 0 ? '✅ all local scenarios passed' : `❌ ${failures} scenario(s) failed`)
  console.log('═'.repeat(72))
  process.exit(failures === 0 ? 0 : 1)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
