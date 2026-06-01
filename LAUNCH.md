# 🚀 Launch kit

Copy-paste assets for shipping **PR Vibe Check**. Tweak the voice to taste.

---

## 1. The demo GIF (do this first — it's 80% of the conversion)

A 6–8 second loop of a PR getting its vibe comment is the single highest-leverage asset. Recipe:

1. Make a throwaway repo, add `.github/workflows/vibe-check.yml` (the quick-start snippet).
2. Open one **great** PR (good title, description, tests, `Closes #1`) and one **cursed** PR (`fix`, empty body, huge diff).
3. Screen-record the PR page as the comment appears and the score lands. Tools: [Kap](https://getkap.co) or [LICEcap](https://www.cockos.com/licecap/) (both export GIF directly).
4. Keep it **under 8s**, crop tight to the comment, end on the ✨ score.
5. Save as `docs/demo.gif`, then uncomment the image line near the top of `README.md`.

> Pro tip: lead with the **cursed → fixed** transition. "Watch a 💀 PR become ✨" is more shareable than a single happy path.

A static fallback already exists at [docs/example-comment.md](docs/example-comment.md) — generated live by `npm run test:local`.

### Ready-made card images

Three 1280×640 PNGs are committed and ready to drop into the PH gallery, a tweet, or the repo's social preview (each has an editable `.svg` beside it):

| Asset | Use |
| :-- | :-- |
| [docs/social-card.png](docs/social-card.png) | Default hero (dark). Set it at **Settings → General → Social preview**. |
| [docs/social-card-cursed.png](docs/social-card-cursed.png) | The "before" — a 💀 18/100 PR. Pair with the default for a before→after slide. |
| [docs/social-card-light.png](docs/social-card-light.png) | Cream/light theme, for light backgrounds. |

To re-export after editing an `.svg`: open it in any browser and screenshot at 1280×640, or use a converter (`rsvg-convert -w 1280 -h 640`, or `npx sharp-cli -i card.svg -o card.png`).

---

## 2. Badges (already wired into the README)

The shareable one for *other people's* repos:

```markdown
[![vibe checked](https://img.shields.io/badge/PRs-vibe%20checked-purple)](https://github.com/3243dwon/pr-vibe-check)
```

Put "add this badge to your repo" in your launch post — badges are free distribution.

---

## 3. Product Hunt

**Name:** PR Vibe Check

**Tagline** (≤60 chars):
> Give every pull request a vibe score — and know why ✨

**Alternates:**
> A friendly 0–100 vibe score for every pull request
> Vibe-check your PRs before your teammates do

**Description:**
> PR Vibe Check is a GitHub Action that scores every pull request 0–100 on the stuff reviewers actually care about: a clear title, a real description, small size, a tight blast radius, tests, and a linked issue. It drops one self-updating comment explaining the score — playfully.
>
> Zero config and no API key to start. Want more? Flip on AI mode and Claude adds a one-line "vibe read" of the diff. Optionally gate merges with `fail-under`.
>
> It's not a replacement for human review — it's the friendly nudge that makes the human review easier.

**First comment (from you, the maker):**
> Hey Product Hunt! 👋
>
> I kept opening PRs titled "fix" with no description and a 2,000-line diff, then wondering why review took forever. So I built the nudge I needed: a GitHub Action that gives each PR a 0–100 *vibe score* and tells you exactly why.
>
> It's free and zero-config — paste 6 lines of YAML and you're done. There's an optional AI mode (Claude reads the diff) if you want a vibe read too.
>
> The whole thing is open source and MIT. I'd love feedback on the scoring rubric — what would *you* reward or punish in a PR? 💜

**Topics:** Developer Tools · GitHub · Open Source · Productivity · Artificial Intelligence

**Gallery captions:**
1. "One comment. One score. Instant context." *(the demo GIF)*
2. "Six checks, 100 points — small, tested, well-described PRs win."
3. "Optional AI mode: Claude reads the diff and gives a vibe read."
4. "Gate merges with `fail-under` — or just vibe."

**Launch timing:** Post 12:01am PT (Product Hunt's day starts then). Tuesday–Thursday convert best. Line up 5–10 people to check it out in the first hour.

---

## 4. Show HN

**Title:**
> Show HN: PR Vibe Check – a GitHub Action that scores your pull requests 0–100

**Body:**
> I built a GitHub Action that posts a single comment on each PR with a 0–100 "vibe score" — based on title clarity, description, diff size, files touched, tests, and whether an issue is linked.
>
> It's zero-config (no API key) for the rule-based score. There's an optional mode where Claude reads the diff and adds a short verdict. You can also fail the check below a threshold to gently gate merges.
>
> The scoring is deliberately simple and transparent (six checks, source in `src/scorer.js`). I'd genuinely like to argue about the rubric — what belongs in a "good PR" heuristic, and what's noise?
>
> Code + rubric: https://github.com/3243dwon/pr-vibe-check

> HN note: be ready to defend the rubric and respond fast in the first 2 hours. Lead with the source link, not marketing.

---

## 5. X / Twitter thread

**1/**
> Every PR titled "fix" with no description and a 1,500-line diff is a tiny act of violence against your reviewer.
>
> So I built PR Vibe Check: a GitHub Action that scores each PR 0–100 and tells you why. ✨
>
> [demo gif]

**2/**
> Zero config. No API key. 6 lines of YAML:
>
> ```yaml
> - uses: 3243dwon/pr-vibe-check@v1
> ```
>
> Open a PR → get a vibe comment. That's it.

**3/**
> The score is 6 transparent checks: title, description, size, focus, tests, linked issue.
>
> 💀 Cursed → ✨ Immaculate. No black box — the rubric is ~120 lines of plain JS.

**4/**
> Want magic? Flip on AI mode and Claude reads the diff for a one-line vibe read.
>
> Want discipline? `fail-under: 50` blocks merges below a score.

**5/**
> Free, open source, MIT.
>
> ⭐ https://github.com/3243dwon/pr-vibe-check
>
> Tell me what your rubric would reward 👇

---

## 6. Reddit (r/github, r/programming, r/devops)

**Title:**
> I made a free GitHub Action that gives your pull requests a 0–100 "vibe score"

**Body:** short version of the Show HN post + the demo GIF. Reddit hates anything that smells like marketing — lead with the rubric and the fact that it's open source, ask for critique of the scoring.

---

## 7. Launch-day checklist

- [ ] Record `docs/demo.gif`, uncomment it in the README
- [ ] `npm run all`, commit `dist/`, tag `v1` + `v1.0.0`, push
- [ ] Publish to the [GitHub Marketplace](https://docs.github.com/actions/sharing-automations/publishing-actions-in-github-marketplace) (a release with `action.yml` enables the "Publish" button)
- [ ] Add the "vibe checked" badge to this repo and 2–3 of your other repos
- [ ] Add 3–4 gallery images + the GIF to the Product Hunt draft
- [ ] Schedule the PH post for 12:01am PT, Tue–Thu
- [ ] Post Show HN the same morning; cross-post to Reddit
- [ ] Reply to every comment in the first 2 hours
