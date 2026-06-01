'use strict'

const { scoreVibe } = require('./scorer')
const { renderComment, MARKER } = require('./comment')
const { aiVibe } = require('./ai')

// Find a previous vibe-check comment (by hidden marker) and update it, else
// create a fresh one. Keeps the PR thread clean across pushes.
async function upsertComment(octokit, { owner, repo, number, body }) {
  const existing = await octokit.paginate(octokit.rest.issues.listComments, {
    owner,
    repo,
    issue_number: number,
    per_page: 100
  })
  const mine = existing.find((c) => typeof c.body === 'string' && c.body.includes(MARKER))
  if (mine) {
    await octokit.rest.issues.updateComment({ owner, repo, comment_id: mine.id, body })
    return { action: 'updated', id: mine.id }
  }
  const created = await octokit.rest.issues.createComment({ owner, repo, issue_number: number, body })
  return { action: 'created', id: created.data && created.data.id }
}

/**
 * Action entrypoint. All toolkit dependencies are injectable so the action can
 * be exercised locally with mocks (see test/local-run.js).
 * @param {object} [deps]
 * @param {object} [deps.core]    @actions/core (mock in tests)
 * @param {object} [deps.github]  @actions/github (mock in tests)
 * @param {object} [deps.octokit] pre-built octokit (mock in tests)
 * @param {function} [deps.fetch] fetch impl for the AI call
 */
async function run(deps = {}) {
  const core = deps.core || require('@actions/core')
  const github = deps.github || require('@actions/github')
  const fetchImpl = deps.fetch || globalThis.fetch

  try {
    const ctx = github.context
    const pr = ctx.payload && ctx.payload.pull_request
    if (!pr) {
      core.info('No pull_request in the event payload — nothing to vibe-check. Skipping.')
      return
    }

    const token = core.getInput('github-token')
    const mode = (core.getInput('mode') || 'hygiene').toLowerCase()
    const failUnder = core.getInput('fail-under')
    const shouldComment = (core.getInput('comment') || 'true').toLowerCase() !== 'false'

    const { owner, repo } = ctx.repo
    const number = pr.number
    const octokit = deps.octokit || github.getOctokit(token)

    // Pull fresh PR data + file list (the webhook payload can be stale).
    const prData = (await octokit.rest.pulls.get({ owner, repo, pull_number: number })).data
    const files = await octokit.paginate(octokit.rest.pulls.listFiles, {
      owner,
      repo,
      pull_number: number,
      per_page: 100
    })

    const hygiene = scoreVibe({
      title: prData.title,
      body: prData.body,
      additions: prData.additions,
      deletions: prData.deletions,
      changedFiles: prData.changed_files,
      commits: prData.commits,
      files: files.map((f) => ({ filename: f.filename })),
      labels: (prData.labels || []).map((l) => l.name),
      isDraft: prData.draft
    })

    let ai = null
    if (mode === 'ai' || mode === 'both') {
      const apiKey = core.getInput('anthropic-api-key')
      if (!apiKey) {
        core.warning(`mode="${mode}" but no anthropic-api-key provided — skipping the AI read.`)
      } else {
        try {
          const diff = (
            await octokit.rest.pulls.get({
              owner,
              repo,
              pull_number: number,
              mediaType: { format: 'diff' }
            })
          ).data
          ai = await aiVibe({
            diff: String(diff),
            apiKey,
            model: core.getInput('ai-model'),
            fetchImpl
          })
        } catch (err) {
          core.warning(`AI vibe read failed (${err.message}) — falling back to hygiene only.`)
        }
      }
    }

    const headScore = mode === 'ai' && ai ? ai.score : hygiene.score
    const body = renderComment(hygiene, { ai, mode })

    if (shouldComment) {
      const result = await upsertComment(octokit, { owner, repo, number, body })
      core.info(`Comment ${result.action}.`)
    } else {
      core.info('comment=false — skipping PR comment.')
    }

    core.setOutput('score', String(headScore))
    core.setOutput('rating', hygiene.rating)
    core.setOutput('emoji', hygiene.emoji)
    core.info(`Vibe: ${hygiene.emoji} ${hygiene.rating} (${headScore}/100)`)

    if (typeof core.summary?.addRaw === 'function') {
      try {
        await core.summary.addRaw(body).write()
      } catch {
        /* job summary is best-effort */
      }
    }

    if (failUnder !== '' && failUnder != null && Number(headScore) < Number(failUnder)) {
      core.setFailed(`Vibe score ${headScore} is below fail-under=${failUnder}.`)
    }
  } catch (err) {
    core.setFailed(err && err.message ? err.message : String(err))
  }
}

// Only auto-run when invoked as the action entrypoint, never when imported by tests.
if (require.main === module) {
  run()
}

module.exports = { run, upsertComment }
