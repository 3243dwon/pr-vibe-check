# Contributing to PR Vibe Check

Thanks for vibing with us. 💜 This project releases automatically, so a few small habits keep things smooth.

## Dev setup

Requires Node 20+.

```bash
npm ci
npm test            # unit tests (node --test)
npm run test:local  # run the action end-to-end with a mocked toolkit
npm run build       # bundle src/ -> dist/index.js with @vercel/ncc
npm run all         # test + build (run this before you push)
```

### The one golden rule: rebuild `dist/`

GitHub runs the action from the **committed bundle** in `dist/`, not from `src/`. So whenever you change anything under `src/`:

```bash
npm run build && git add dist/
```

CI will fail the **`build-is-committed`** check if `dist/` is out of date. (Your PR also gets vibe-checked by the action itself — dogfooding. 🔮)

## Conventional Commits

We use [Conventional Commits](https://www.conventionalcommits.org). [release-please](https://github.com/googleapis/release-please) reads them to decide the next version and build the changelog, so the prefix matters.

| Prefix | Use for | Version bump |
| :-- | :-- | :-- |
| `feat:` | a new feature / input / output | **minor** (1.2.0 → 1.3.0) |
| `fix:` | a bug fix | **patch** (1.2.0 → 1.2.1) |
| `perf:` | a performance improvement | patch |
| `docs:` | docs only | none |
| `refactor:` | code change that isn't a feat/fix | none |
| `test:` | adding or fixing tests | none |
| `build:` / `ci:` | build system or CI changes | none |
| `chore:` | tooling, deps, housekeeping | none |

**Breaking changes** bump the **major** version (1.x → 2.0.0). Mark them either way:

```
feat!: rename the `mode` input to `engine`

BREAKING CHANGE: workflows using `mode:` must switch to `engine:`.
```

Examples:

```
feat: add `min-files` input to relax the focus check
fix: handle PRs with a null body without crashing
docs: clarify AI mode setup in the README
test: cover the docs-only PR scoring path
```

## How releases happen (you don't tag manually)

1. You merge Conventional Commits into `main`.
2. release-please opens/updates a **release PR** with the version bump + `CHANGELOG.md`.
3. A maintainer merges it → `vX.Y.Z` is tagged and a GitHub Release is published.
4. The `tag-major` job moves the floating `vX` / `vX.Y` tags to the new commit.

See [.github/workflows/release.yml](.github/workflows/release.yml).

## Code notes

- Plain CommonJS, no build step for `src/` other than the `ncc` bundle.
- Keep `src/vibe.js` **pure** (no I/O) — prompts, diff summary, comment rendering, rating parsing. That's what makes it easy to test; new logic goes there with a matching test in `test/vibe.test.js`.
- `src/anthropic.js` is the Claude call (native `fetch`); `src/index.js` wires up GitHub. Both take their dependencies via injection so `test/local-run.js` can mock `@actions/core`, `@actions/github`, and `fetch`.

## Pull request checklist

- [ ] `npm run all` passes and `dist/` is committed
- [ ] Tests cover the change
- [ ] A clear title + description (it'll score better 😉)
- [ ] Linked to an issue where relevant

By contributing you agree your work is licensed under the [MIT License](LICENSE).
