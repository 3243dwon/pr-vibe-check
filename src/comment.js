'use strict'

const { rate, meterFor } = require('./scorer')

// Hidden marker so the action can find and update its own comment instead of
// spamming a new one on every push.
const MARKER = '<!-- pr-vibe-check:do-not-remove -->'

function badgeUrl(score, rating) {
  const color = score >= 75 ? 'brightgreen' : score >= 50 ? 'yellow' : score >= 25 ? 'orange' : 'red'
  const label = encodeURIComponent('vibe check')
  const msg = encodeURIComponent(`${score}/100 · ${rating}`)
  return `https://img.shields.io/badge/${label}-${msg}-${color}`
}

function renderChecks(checks) {
  const rows = checks
    .map((c) => `| ${c.icon} ${c.label} | \`${c.points}/${c.max}\` | ${c.note} |`)
    .join('\n')
  return ['| Check | Score | Notes |', '| :-- | :--: | :-- |', rows].join('\n')
}

/**
 * Build the PR comment markdown.
 * @param {object} hygiene result from scoreVibe()
 * @param {object} [opts]
 * @param {object|null} [opts.ai] result from aiVibe(): {score, vibe, summary}
 * @param {string} [opts.mode] 'hygiene' | 'ai' | 'both'
 */
function renderComment(hygiene, opts = {}) {
  const { ai = null, mode = 'hygiene' } = opts
  // In pure "ai" mode the AI score is the headline; otherwise hygiene leads.
  const headline = mode === 'ai' && ai ? rate(ai.score) : { rating: hygiene.rating, emoji: hygiene.emoji }
  const headScore = mode === 'ai' && ai ? ai.score : hygiene.score
  const meter = mode === 'ai' && ai ? meterFor(ai.score) : hygiene.meter

  const parts = []
  parts.push(MARKER)
  parts.push(`## ${headline.emoji} PR Vibe Check — ${headline.rating}`)
  parts.push('')
  parts.push(`<samp>${meter}</samp>  **${headScore}/100**`)
  parts.push('')
  parts.push(`![vibe](${badgeUrl(headScore, headline.rating)})`)
  parts.push('')

  if (mode !== 'ai') {
    parts.push(renderChecks(hygiene.checks))
    parts.push('')
  }

  if (ai) {
    parts.push('### 🤖 AI vibe read')
    parts.push('')
    parts.push(`> **${ai.vibe}**`)
    parts.push('>')
    parts.push(`> ${ai.summary}`)
    if (mode === 'both') parts.push(`>\n> _AI score: ${ai.score}/100 · hygiene score: ${hygiene.score}/100_`)
    parts.push('')
  }

  parts.push('---')
  parts.push(
    '<sub>🔮 Vibes measured by [pr-vibe-check](https://github.com/3243dwon/pr-vibe-check). ' +
      'Not a substitute for a real review — just a friendly nudge.</sub>'
  )
  return parts.join('\n')
}

module.exports = { renderComment, badgeUrl, MARKER }
