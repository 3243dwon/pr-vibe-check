'use strict'

// Pure, dependency-free vibe-check building blocks: the persona prompt, the
// diff summariser, the comment renderer, and the rating parser. No I/O lives
// here, which is exactly what makes it trivial to unit-test.

const SEVERITY_PROMPTS = {
  soft: 'Be encouraging and hype them up, but still keep it real with Gen Z slang. Positive energy.',
  normal: 'Be honest and funny. Roast when necessary, praise when deserved. No cap.',
  brutal: 'ZERO filter. Absolutely ruthless. Real ones only. Make them feel it.'
}

// Hidden marker so we update our own comment instead of spamming a new one on
// every push (an upgrade over posting fresh each time).
const MARKER = '<!-- pr-vibe-check:do-not-remove -->'

function severityNote(severity) {
  return SEVERITY_PROMPTS[severity] || SEVERITY_PROMPTS.normal
}

function buildSystem(severity) {
  return `You are the most chronically online, terminally Gen Z code reviewer on the internet.
Your entire personality is built around giving PRs a VIBE CHECK.
${severityNote(severity)}
You use slang naturally — no cap, lowkey, based, rent free, understood the assignment, fr fr, slay, it's giving, the audacity, bestie, bussin, not it, main character energy, ate and left no crumbs, caught in 4K, mid, ratio'd, etc.
You are funny but your technical observations are REAL and ACCURATE. The slang is the wrapper, the substance is the gift.`
}

function summarizeDiff(files, { maxFiles = 20, perFile = 600, total = 12000 } = {}) {
  return (files || [])
    .slice(0, maxFiles)
    .map((f) => {
      const patch = f.patch ? f.patch.slice(0, perFile) : '(binary / no patch)'
      return `### ${f.filename}  (+${f.additions} / -${f.deletions})\n${patch}`
    })
    .join('\n\n')
    .slice(0, total)
}

function buildUser(pr, files) {
  const body = (pr.body || '').trim()
  return `Vibe check this pull request. Be a legend about it.

**PR DEETS:**
- Title: ${pr.title}
- Description: ${body || '(no description — already a red flag bestie 🚩)'}
- Author: @${(pr.user && pr.user.login) || 'unknown'}
- Files changed: ${(files || []).length}
- Lines added: +${pr.additions ?? '?'}
- Lines deleted: -${pr.deletions ?? '?'}

**DIFF:**
${summarizeDiff(files)}

---

Structure your vibe check EXACTLY like this (use the headers, keep it snappy):

**✨ THE VIBE**
[One punchy sentence on what this PR is giving. Make it hit.]

**🔥 SLAY MOMENTS**
[2–3 bullets. What they actually did well. Be specific, not vague.]

**💀 L MOMENTS**
[2–3 bullets. What flopped, what needs work, what you clocked immediately. Be real.]

**🎯 VERDICT**
[W / L / Mid] — [One spicy closing sentence. Make it memorable.]

**📊 VIBE RATING: X/10** [One emoji that perfectly captures it]

Keep it under 380 words. Every word should earn its place.`
}

function renderComment(vibeText, severity) {
  return [
    MARKER,
    '## 🔍 PR Vibe Check™',
    '',
    String(vibeText || '').trim(),
    '',
    '---',
    `*no cap powered by [pr-vibe-check](https://github.com/3243dwon/pr-vibe-check) × Claude · severity: \`${severity}\`*`
  ].join('\n')
}

function extractRating(vibeText) {
  const m = String(vibeText || '').match(/VIBE RATING:\s*(\d{1,2})\s*\/\s*10/i)
  if (!m) return null
  const n = Number(m[1])
  return n >= 0 && n <= 10 ? n : null
}

module.exports = {
  SEVERITY_PROMPTS,
  buildSystem,
  buildUser,
  summarizeDiff,
  renderComment,
  extractRating,
  MARKER
}
