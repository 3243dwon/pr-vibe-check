# What PR Vibe Check posts

A single, self-updating comment on the PR. Here's the real output from `npm run test:local`.

---

## ✨ An immaculate PR (`hygiene` mode)

> ## ✨ PR Vibe Check — Immaculate vibes
>
> <samp>▰▰▰▰▰▰▰▰▰▰</samp>  **100/100**
>
> | Check | Score | Notes |
> | :-- | :--: | :-- |
> | ✅ Title | `20/20` | Clear and scannable. |
> | ✅ Description | `20/20` | Thorough write-up with structure. Chef’s kiss. |
> | ✅ Size | `20/20` | 150 lines — reviewable in one sitting. |
> | ✅ Focus | `15/15` | 4 files — tightly scoped. |
> | ✅ Tests | `15/15` | Tests included. We love to see it. |
> | ✅ Context | `10/10` | Linked to an issue. Traceable. |

---

## 💀 A cursed PR (`hygiene` mode, `fail-under: 50`)

> ## 💀 PR Vibe Check — Cursed vibes
>
> <samp>▰▱▱▱▱▱▱▱▱▱</samp>  **12/100**
>
> | Check | Score | Notes |
> | :-- | :--: | :-- |
> | ❌ Title | `5/20` | "fix" tells reviewers nothing. |
> | ❌ Description | `0/20` | Empty description. What does this even do? |
> | ❌ Size | `4/20` | 2300 lines — absolute unit. Reviewers weep. |
> | ❌ Focus | `3/15` | 73 files — blast radius approaching orbital. |
> | ❌ Tests | `0/15` | Code changed but no tests touched. Living dangerously. |
> | ❌ Context | `0/10` | No issue reference (e.g. "Closes #123"). |

The job also **fails the check** because the score is below `fail-under: 50`.

---

## 🤖 AI + hygiene (`both` mode)

> ## ✨ PR Vibe Check — Immaculate vibes
>
> <samp>▰▰▰▰▰▰▰▰▰</samp>  **88/100**
>
> *(hygiene breakdown table…)*
>
> ### 🤖 AI vibe read
>
> > **Clean split, well covered**
> >
> > Nicely decomposed middleware with matching tests. Double-check the error path on token refresh.
> >
> > _AI score: 86/100 · hygiene score: 90/100_

---

<sub>🔮 Vibes measured by [pr-vibe-check](https://github.com/3243dwon/pr-vibe-check).</sub>
