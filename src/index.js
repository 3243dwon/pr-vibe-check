'use strict'

const { buildSystem, buildUser, renderComment, extractRating, MARKER } = require('./vibe')
const { requestVibe } = require('./anthropic')

// Find a previous vibe-check comment (by hidden marker) and update it, else
// create a fresh one — keeps the PR thread clean across pushes.
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
 * Action entrypoint. Toolkit dependencies are injectable so the action can be
 * exercised locally with mocks (see test/local-run.js).
 */
async function run(deps = {}) {
  const core = deps.core || require('@actions/core')
  const github = deps.github || require('@actions/github')
  const fetchImpl = deps.fetch || globalThis.fetch

  try {
    const ctx = github.context
    const pr = ctx.payload && ctx.payload.pull_request
    if (!pr) {
      core.info('Not a PR event — skipping vibe check bestie.')
      return
    }

    const apiKey = core.getInput('anthropic-api-key', { required: true })
    const token = core.getInput('github-token')
    const severity = (core.getInput('severity') || 'normal').toLowerCase()
    const model = core.getInput('model') || 'claude-sonnet-4-6'
    const shouldComment = (core.getInput('comment') || 'true').toLowerCase() !== 'false'

    const { owner, repo } = ctx.repo
    const number = pr.number
    const octokit = deps.octokit || github.getOctokit(token)

    core.info(`Vibe checking PR #${number}: "${pr.title}" (severity: ${severity}, model: ${model})`)

    // Pull fresh PR data + file patches (the webhook payload can be stale).
    const prData = (await octokit.rest.pulls.get({ owner, repo, pull_number: number })).data
    const files = await octokit.paginate(octokit.rest.pulls.listFiles, {
      owner,
      repo,
      pull_number: number,
      per_page: 100
    })

    const system = buildSystem(severity)
    const user = buildUser(
      {
        title: prData.title,
        body: prData.body,
        user: prData.user,
        additions: prData.additions,
        deletions: prData.deletions
      },
      files
    )

    const vibe = await requestVibe({ apiKey, model, system, user, fetchImpl })
    const body = renderComment(vibe, severity)

    if (shouldComment) {
      const result = await upsertComment(octokit, { owner, repo, number, body })
      core.info(`Comment ${result.action}.`)
    } else {
      core.info('comment=false — skipping PR comment.')
    }

    const rating = extractRating(vibe)
    if (rating != null) core.setOutput('rating', String(rating))
    core.setOutput('severity', severity)

    if (typeof core.summary?.addRaw === 'function') {
      try {
        await core.summary.addRaw(body).write()
      } catch {
        /* job summary is best-effort */
      }
    }

    core.info('Vibe check posted. We ate. ✅')
  } catch (err) {
    core.setFailed(`Vibe check bricked (genuine L): ${err && err.message ? err.message : err}`)
  }
}

// Only auto-run as the action entrypoint, never when imported by tests.
if (require.main === module) {
  run()
}

module.exports = { run, upsertComment }
