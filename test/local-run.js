'use strict'

/**
 * Run the action locally with a MOCKED @actions/core, @actions/github, and a
 * canned Claude response — no network, no token, no API key required.
 *
 * Because src/index.js#run() takes its toolkit via dependency injection, this
 * exercises the real action logic end-to-end (prompt build → Claude call →
 * comment upsert → outputs) and prints the comment it would post.
 *
 *   npm run test:local
 */

const { run } = require('../src/index')

// ---- mock @actions/core -----------------------------------------------------
function makeCore(inputs) {
  const captured = { outputs: {}, failed: null, logs: [] }
  const log = (lvl, m) => captured.logs.push(`[${lvl}] ${m}`)
  return {
    captured,
    core: {
      // mirrors @actions/core: throws when a required input is empty
      getInput: (name, opts) => {
        const v = inputs[name] != null ? String(inputs[name]) : ''
        if (!v && opts && opts.required) throw new Error(`Input required and not supplied: ${name}`)
        return v
      },
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

// ---- mock @actions/github ---------------------------------------------------
function makeGithub({ pr, files, comments = [] }) {
  const state = { comments: [...comments], created: [], updated: [] }
  let nextId = 2000
  const octokit = {
    rest: {
      pulls: {
        get: async () => ({ data: pr }),
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
    paginate: async (method, params) => (await method(params)).data
  }
  return {
    state,
    octokit,
    github: {
      context: { repo: { owner: '3243dwon', repo: 'pr-vibe-check' }, payload: { pull_request: pr } },
      getOctokit: () => octokit
    }
  }
}

// ---- canned Claude response, so the AI call runs offline --------------------
function fakeClaude(vibeText) {
  return async () => ({
    ok: true,
    status: 200,
    json: async () => ({ content: [{ type: 'text', text: vibeText }] }),
    text: async () => vibeText
  })
}

const NORMAL_VIBE = `**✨ THE VIBE**
This PR understood the assignment — clean auth refactor, genuinely no cap.

**🔥 SLAY MOMENTS**
- Extracted the token logic into its own util — separation of concerns ate
- Tests on the edge cases?? You didn't have to go that hard bestie

**💀 L MOMENTS**
- That 2019 TODO is living rent free, evict it
- \`handleData\` is a cry for help, be more specific 💀

**🎯 VERDICT**
W — but the TODO has you on thin ice fr

**📊 VIBE RATING: 7/10** ✨`

const BRUTAL_VIBE = `**✨ THE VIBE**
1,900 lines in one PR titled "fix"? The audacity is sending me.

**🔥 SLAY MOMENTS**
- It... compiles? We'll take the W where we can.

**💀 L MOMENTS**
- 73 files, zero tests — caught in 4K being reckless
- Commit message "fix" is not it bestie

**🎯 VERDICT**
L — split this up before someone gets hurt

**📊 VIBE RATING: 2/10** 💀`

const SCENARIOS = [
  {
    name: 'Normal severity — posts a fresh vibe check',
    inputs: { 'anthropic-api-key': 'sk-test', severity: 'normal', 'github-token': 'x', comment: 'true' },
    pr: { number: 11, title: 'Refactor auth middleware', body: 'Closes #77.', user: { login: 'octocat' }, additions: 120, deletions: 30 },
    files: [{ filename: 'src/auth/index.js', additions: 80, deletions: 20, patch: '@@ +new' }],
    fetch: fakeClaude(NORMAL_VIBE),
    expect: { rating: '7', action: 'created', failed: false }
  },
  {
    name: 'Brutal severity — updates the existing comment',
    inputs: { 'anthropic-api-key': 'sk-test', severity: 'brutal', 'github-token': 'x', comment: 'true' },
    pr: { number: 12, title: 'fix', body: '', user: { login: 'goblin' }, additions: 1900, deletions: 400 },
    files: [{ filename: 'a.js', additions: 900, deletions: 100, patch: 'x' }],
    comments: [{ id: 500, body: '<!-- pr-vibe-check:do-not-remove -->\n## old' }],
    fetch: fakeClaude(BRUTAL_VIBE),
    expect: { rating: '2', action: 'updated', failed: false }
  },
  {
    name: 'Missing API key — fails gracefully (Gen Z error)',
    inputs: { severity: 'normal', 'github-token': 'x', comment: 'true' },
    pr: { number: 13, title: 'whatever', body: 'x', user: { login: 'a' }, additions: 1, deletions: 0 },
    files: [{ filename: 'a.js', additions: 1, deletions: 0, patch: 'x' }],
    fetch: fakeClaude(NORMAL_VIBE),
    expect: { failed: true }
  }
]

async function main() {
  let failures = 0
  for (const s of SCENARIOS) {
    const { core, captured } = makeCore(s.inputs)
    const { github, state } = makeGithub({ pr: s.pr, files: s.files, comments: s.comments })
    await run({ core, github, octokit: github.getOctokit(), fetch: s.fetch })

    const posted = state.created[0] || state.updated[0]
    const body = posted ? posted.body : null
    const action = state.created.length ? 'created' : state.updated.length ? 'updated' : 'none'

    const problems = []
    if (s.expect.failed === true && !captured.failed) problems.push('expected setFailed but none')
    if (s.expect.failed === false && captured.failed) problems.push(`unexpected setFailed: ${captured.failed}`)
    if (s.expect.rating != null && captured.outputs.rating !== s.expect.rating)
      problems.push(`rating ${captured.outputs.rating} != ${s.expect.rating}`)
    if (s.expect.action && action !== s.expect.action) problems.push(`comment ${action} != ${s.expect.action}`)

    const ok = problems.length === 0
    if (!ok) failures++

    console.log('\n' + '═'.repeat(72))
    console.log(`${ok ? '✅ PASS' : '❌ FAIL'}  ${s.name}`)
    console.log('═'.repeat(72))
    console.log(`outputs : ${JSON.stringify(captured.outputs)}`)
    console.log(`failed  : ${captured.failed || '—'}`)
    console.log(`comment : ${action}`)
    if (problems.length) console.log(`problems: ${problems.join('; ')}`)
    if (body) {
      console.log('\n--- rendered comment ' + '-'.repeat(50))
      console.log(body)
    }
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
