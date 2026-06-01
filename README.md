# ✨ PR Vibe Check

> A GitHub Action that gives every pull request a **vibe score** — and tells you why.

[![CI](https://github.com/3243dwon/pr-vibe-check/actions/workflows/ci.yml/badge.svg)](https://github.com/3243dwon/pr-vibe-check/actions/workflows/ci.yml)
[![Marketplace](https://img.shields.io/badge/marketplace-pr--vibe--check-purple?logo=github)](https://github.com/marketplace/actions/pr-vibe-check)
[![vibe](https://img.shields.io/badge/vibe%20check-100%2F100%20%C2%B7%20Immaculate-brightgreen)](https://github.com/3243dwon/pr-vibe-check)
[![license](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![PRs welcome](https://img.shields.io/badge/PRs-welcome-ff69b4.svg)](https://github.com/3243dwon/pr-vibe-check/pulls)

PR Vibe Check reads each pull request and posts a single, self-updating comment with a **0–100 vibe score**, a breakdown of *why*, and (optionally) a one-line "vibe read" of the diff from Claude. It's a friendly nudge toward small, well-described, tested PRs — not a replacement for human review.

<p align="center">
  <img src="docs/social-card.svg" alt="PR Vibe Check — give every pull request a vibe score" width="100%">
</p>

<!-- Once you've recorded a demo (recipe in LAUNCH.md), drop it in here: -->
<!-- ![PR Vibe Check in action](docs/demo.gif) -->

> 💬 **See exactly what it posts:** [docs/example-comment.md](docs/example-comment.md)

---

## 🚀 Quick start

Drop this in `.github/workflows/vibe-check.yml`. Zero config, no API key:

```yaml
name: Vibe Check
on:
  pull_request:
    types: [opened, synchronize, reopened, edited]

permissions:
  contents: read
  pull-requests: write   # needed to post the comment

jobs:
  vibe:
    runs-on: ubuntu-latest
    steps:
      - uses: 3243dwon/pr-vibe-check@v1
```

That's it. Open a PR and watch the vibes roll in. 🔮

---

## 🎛️ Modes

| Mode | API key? | What you get |
| :-- | :--: | :-- |
| `hygiene` *(default)* | ❌ | Rule-based score: title, description, size, focus, tests, issue links. |
| `ai` | ✅ | Claude reads the diff and gives a short "vibe read" + score. |
| `both` | ✅ | Hygiene score **plus** the AI read, side by side. |

### AI mode

```yaml
      - uses: 3243dwon/pr-vibe-check@v1
        with:
          mode: both
          anthropic-api-key: ${{ secrets.ANTHROPIC_API_KEY }}
          ai-model: claude-haiku-4-5-20251001   # cheap & fast (default)
```

### Gate merges on the vibe (optional)

```yaml
      - uses: 3243dwon/pr-vibe-check@v1
        with:
          fail-under: 50   # the check fails if the PR scores below 50
```

---

## ⚙️ Inputs

| Input | Default | Description |
| :-- | :-- | :-- |
| `github-token` | `${{ github.token }}` | Token used to read the PR and post the comment. |
| `mode` | `hygiene` | `hygiene` \| `ai` \| `both`. |
| `anthropic-api-key` | `''` | Required only for `ai` / `both`. Store it in repo **secrets**. |
| `ai-model` | `claude-haiku-4-5-20251001` | Claude model id for the AI read. |
| `fail-under` | `''` | If set (0–100), the check fails when the score is below it. |
| `comment` | `true` | Set `false` to compute the score without posting a comment. |

## 📤 Outputs

| Output | Example | Description |
| :-- | :-- | :-- |
| `score` | `87` | Numeric vibe score (0–100). |
| `rating` | `Solid vibes` | Human-readable rating. |
| `emoji` | `😎` | Emoji for the vibe. |

Use them in later steps:

```yaml
      - uses: 3243dwon/pr-vibe-check@v1
        id: vibe
      - run: echo "This PR scored ${{ steps.vibe.outputs.score }} ${{ steps.vibe.outputs.emoji }}"
```

---

## 🧮 How the hygiene score works

100 points across six checks — small, described, tested, focused PRs win:

| Check | Max | Rewards |
| :-- | :--: | :-- |
| **Title** | 20 | A clear, specific title (not `fix` / `update` / `wip`). |
| **Description** | 20 | A real body; bonus for checklists or headings. |
| **Size** | 20 | Fewer lines changed — reviewable in one sitting. |
| **Focus** | 15 | Fewer files touched — a tight blast radius. |
| **Tests** | 15 | Test files in the diff (docs/config PRs are excused). |
| **Context** | 10 | A linked issue (`Closes #123`). |

| Score | Rating |
| :--: | :-- |
| 90–100 | ✨ Immaculate vibes |
| 75–89 | 😎 Solid vibes |
| 50–74 | 🤔 Mixed vibes |
| 25–49 | 😬 Sus vibes |
| 0–24 | 💀 Cursed vibes |

---

## 🛠️ Local development

The action logic is dependency-injected, so you can run the **whole thing** locally with a mocked `@actions/core` / `@actions/github` — no token, no network:

```bash
npm install
npm test          # unit tests (node --test)
npm run test:local # run the action with mocked toolkit; prints the comment it would post
npm run build     # bundle src/ -> dist/index.js with @vercel/ncc
```

`npm run test:local` exercises three scenarios end-to-end (immaculate PR, cursed PR with `fail-under`, and AI `both` mode with a mocked Claude response) and prints the rendered comment for each — handy for screenshots.

> **Always `npm run build` and commit `dist/` before tagging a release** — GitHub runs the action from the committed bundle.

---

## 📦 Releasing (automated)

Releases run on [release-please](https://github.com/googleapis/release-please) plus a job that moves the floating `v1` / `v1.x` tags — see [.github/workflows/release.yml](.github/workflows/release.yml). The flow:

1. Commit with [Conventional Commits](https://www.conventionalcommits.org) (`feat:`, `fix:`, `feat!:` for breaking). CI enforces that `dist/` is rebuilt and committed.
2. release-please opens and continuously updates a **release PR** that bumps the version and `CHANGELOG.md`.
3. Merge it → release-please tags `vX.Y.Z` and publishes a GitHub Release.
4. The `tag-major` job force-moves `vX` and `vX.Y` to that commit, so anyone pinning `@v1` gets the update automatically.

Then tick **Publish this Action to the Marketplace** on the GitHub Release (enabled by the committed `action.yml`).

<details><summary>Manual release (fallback)</summary>

```bash
npm run all                       # test + build
git commit -am "release: v1.0.0"
git tag v1.0.0 && git tag -f v1
git push origin main --tags --force
```
</details>

---

## 🔒 Security & dependencies

`npm audit` reports a few **transitive** advisories in `undici`, pulled in via `@actions/github@6 → @actions/http-client → undici@5`. They are **not fixable within the 5.x line** (5.29.0 is the latest 5.x and remains flagged). The clean fix lives in `@actions/github@9`, which bundles a patched `undici` — but its `exports` map does not yet bundle with `@vercel/ncc`, so adopting it would break the published action.

These advisories (request smuggling, CRLF injection, decompression/websocket resource exhaustion) require an attacker-controlled server/proxy or an open websocket. This action only makes TLS calls to `api.github.com` (and, in AI mode, `api.anthropic.com`) and opens no sockets, so the practical risk is low. We'll move to `@actions/github@9` as soon as it bundles cleanly. Track it in [issues](https://github.com/3243dwon/pr-vibe-check/issues).

---

## 💜 Spread the vibes

Add a badge to your repo so contributors know you vibe-check PRs:

```markdown
[![vibe checked](https://img.shields.io/badge/PRs-vibe%20checked-purple)](https://github.com/3243dwon/pr-vibe-check)
```

[![vibe checked](https://img.shields.io/badge/PRs-vibe%20checked-purple)](https://github.com/3243dwon/pr-vibe-check)

Launch assets, taglines, and copy live in [LAUNCH.md](LAUNCH.md).

---

## License

[MIT](LICENSE) © 2026 [3243dwon](https://github.com/3243dwon)
