# 🚀 Launch kit — pr-vibe-check

Copy-paste assets for shipping the Gen Z vibe checker. Tune the voice to taste.

> Part of a 4-repo launch (pr-vibe-check · vibe-translator · forensic-read · clear-eye). pr-vibe-check is the **lead/viral** play — funniest, novel category, lowest barrier to "share this."

---

## 1. The demo GIF (do this first — it's 80% of conversion)

A 6–8s loop of a PR getting roasted is the single highest-leverage asset.

1. Throwaway repo, add the workflow + an `ANTHROPIC_API_KEY` secret.
2. Open one **mid** PR (`fix`, no description, huge diff) and watch a `brutal` vibe check land.
3. Record with [Kap](https://getkap.co) / [LICEcap](https://www.cockos.com/licecap/). Crop tight to the comment, end on the rating.
4. Save as `docs/demo.gif`, uncomment the image line near the top of the README.

> Lead with a **brutal** roast — "watch Claude ratio a bad PR" is more shareable than a polite one.

Ready-made stills are committed (see §2), and a static example lives at [docs/example-comment.md](docs/example-comment.md).

---

## 2. Ready-made card images

Three 1280×640 PNGs (each with an editable `.svg`) — drop into the PH gallery, a tweet, or the repo's social preview:

| Asset | Use |
| :-- | :-- |
| [docs/social-card.png](docs/social-card.png) | Default hero (a `normal` 7/10 roast). Set at **Settings → Social preview**. |
| [docs/social-card-cursed.png](docs/social-card-cursed.png) | A `brutal` 2/10 roast — the "before". |
| [docs/social-card-light.png](docs/social-card-light.png) | Cream/light theme. |

Badge for other people's repos:

```markdown
[![vibe checked](https://img.shields.io/badge/PRs-vibe%20checked-ff69b4)](https://github.com/3243dwon/pr-vibe-check)
```

---

## 3. Product Hunt

**Tagline (≤60):** `A Gen Z code reviewer that vibe-checks your PRs 🔥`

**Description:**
> Your CI checks types. It doesn't check *vibes*. PR Vibe Check is a GitHub Action that reads your pull request with Claude and posts one honest, very online comment: THE VIBE, SLAY MOMENTS, L MOMENTS, a verdict, and a rating out of 10. The technical read is real — the Gen Z wrapper just makes people actually read it. Three severities: soft, normal, brutal.

**First comment (maker):**
> Hey PH 👋 I kept opening PRs titled "fix" with a 2,000-line diff and no description, so I built the code reviewer I deserved: it roasts (or hypes) your PR with Claude. `severity: brutal` is not for the weak. Free + open source, ~a cent per check. Roast my repo in the comments 🔥

**Topics:** Developer Tools · GitHub · AI · Open Source

---

## 4. Show HN

**Title:** `Show HN: PR Vibe Check – a Gen Z code reviewer for your PRs, powered by Claude`

**Body:**
> A GitHub Action that posts a vibe check on each PR — THE VIBE / SLAY MOMENTS / L MOMENTS / verdict / rating. The slang is a wrapper; under it Claude actually reads the diff and the technical observations are real. Severity is configurable (soft/normal/brutal). It updates a single comment instead of spamming. ~$0.002–0.02 per PR. Open source, MIT.
>
> Repo: https://github.com/3243dwon/pr-vibe-check

---

## 5. X / Twitter thread

1. your CI checks types. it doesn't check vibes. so I fixed that 🔥 [GIF]
2. PR Vibe Check reads your PR with Claude and posts: THE VIBE, 🔥 SLAY MOMENTS, 💀 L MOMENTS, a verdict, a rating /10. the roast is funny, the technical read is real.
3. 6 lines of YAML + an API key. `severity: soft | normal | brutal`. brutal is not for the weak.
4. free, open source, ~a cent a check ⭐ https://github.com/3243dwon/pr-vibe-check

---

## 6. Reddit

- **r/programmerhumor** — lead with a screenshot of a brutal roast (this is the home-run subreddit for this repo)
- **r/programming, r/ClaudeAI, r/SideProject** — the Show HN copy, lead with the GIF, mention it's open source

---

## 7. Hook lines (steal these)

- "Your CI checks types. Does it check vibes?"
- "Claude read your PR. It has notes. 💀"
- "`severity: brutal` is not for the weak."

---

## 8. Launch-day checklist

- [ ] Record `docs/demo.gif`, uncomment it in the README
- [ ] `npm run all`, commit `dist/`, merge the release PR (tags `v1`)
- [ ] Publish to the [Marketplace](https://docs.github.com/actions/sharing-automations/publishing-actions-in-github-marketplace) from the release
- [ ] Upload `docs/social-card.png` as the repo social preview
- [ ] Schedule PH for 12:01am PT (Tue–Thu); post Show HN same morning; r/programmerhumor screenshot
- [ ] Reply to every comment in the first 2 hours

*Build was the easy part. Distribution is the product.*
