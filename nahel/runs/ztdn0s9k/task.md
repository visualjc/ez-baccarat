---
run: ztdn0s9k
item: njrkpjjd
responsibility: review
created: 2026-08-25T19:48:17Z
---
# Review: PR #7 — chore(deploy): publish to Pages from a gh-pages branch

Reviewer for nahel item `njrkpjjd`. Branch `chore/pages-deploy` (checked out) against `main`:

    git diff main...chore/pages-deploy

Do not push, merge, or edit product code. Do NOT run the deploy script — it pushes to a remote.

## Context

The owner asked to make the game viewable online. The Actions deploy has been parked at `docs/deploy/pages.yml` since the epic closed, because this repo's push credential has `repo` but not `workflow` scope and GitHub rejects pushes touching `.github/workflows/`. Deploying from a branch needs neither, so this PR adds a branch-deploy path and leaves the workflow parked.

## What to check

1. **`scripts/deploy-pages.sh` correctness.** Read it line by line. Specifically:
   - The orphan-branch creation path (first run, when `refs/heads/gh-pages` does not exist) versus the existing-branch path. Is the first-run path actually correct — does `git worktree add --detach` + `checkout --orphan` + `rm -rf .` leave a clean orphan branch, or is there a failure mode on a repo where gh-pages has never existed?
   - The `find ... -not -name .git -exec rm -rf {} +` line. Is it safe? Could it ever delete the wrong thing, or miss dotfiles?
   - `set -euo pipefail` with the `git diff --cached --quiet` idiom — does the no-change branch behave, or does `-e` kill the script on the non-zero exit?
   - The worktree cleanup on failure: if the build or push fails, is a stale worktree left behind? Should there be a trap?
   - `mktemp -d` inside the repo vs outside; `BASE_PATH` quoting; the dirty-tree guard.
2. **`.nojekyll`** — needed here, or cargo-culted? Does Vite emit any underscore-prefixed paths in this project?
3. **`index.html`** — is the new boot shell sound? It is inline-styled because no stylesheet has loaded yet. Does it flash or fight with `mountShell()`, which calls `host.replaceChildren()` on `document.body`? Is the `noscript` placement correct? Are the new meta tags accurate?
4. **`README.md`** — does it now describe reality?
5. Anything that would break the published site specifically: base-path handling, asset URLs, the seed query parameter surviving a subpath deploy (`?seed=` is read via `window.location.search`), localStorage keys on a github.io origin shared with other projects (note: `ezbac.bankroll` and `ezbac.rules` — is the prefix collision-safe on a shared `visualjc.github.io` origin?).
6. Anything else you would block on.

Run `bun test` and `bunx tsc --noEmit` if available; say so if bun is not on your PATH. You may run `BASE_PATH=/ez-baccarat/ bun run build` if bun exists — that is local only.

End with exactly one of:

    VERDICT: APPROVE
    VERDICT: REQUEST CHANGES

then numbered findings with file:line and a concrete fix. Be adversarial; this one is going on the public internet.
