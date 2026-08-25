---
run: ztdn0s9k
item: njrkpjjd
status: success
summary: Request changes for remote branch handling, failure cleanup, and misleading deploy documentation.
---

Reviewed `main...chore/pages-deploy` at `ef41e58` (`chore(deploy): publish to Pages from a gh-pages branch`). No product code was edited and the deploy script was not run.

`bun` is not on PATH in this dispatched environment, so `bun test`, `bunx tsc --noEmit`, and the local BASE_PATH build could not run. `nahel brief` and `nahel run update ztdn0s9k --phase ...` likewise could not run because the `nahel` executable is absent from PATH. `git diff --check` found no whitespace errors.

The boot shell is replaced safely by `mountShell()`; Vite's existing `BASE_PATH` configuration handles `/ez-baccarat/` asset URLs, and seed parsing reads `window.location.search`, so query seeds survive the subpath deploy. The `ezbac.*` localStorage prefix is appropriately app-specific for the shared GitHub Pages origin. `.nojekyll` is not required by this Vite output (no underscore-prefixed emitted paths), but is harmless. The top-level `find` is confined to the temporary worktree, preserves its `.git` pointer, and removes dotfiles; the staged-diff `if` is safe with `set -e`.

Standards review found no documented-standard breach or baseline code smell. Spec review found no scope creep.

VERDICT: REQUEST CHANGES

1. `scripts/deploy-pages.sh:27` only detects a local `refs/heads/gh-pages`. In a fresh clone after a prior publication, `gh-pages` commonly exists only as `refs/remotes/origin/gh-pages`; the script takes the orphan path and its push is rejected as non-fast-forward. Fetch/detect `origin/gh-pages` and create a tracked local branch (for example, `git worktree add --track -b "$BRANCH" "$WORKTREE" "origin/$BRANCH"`); use the orphan path only when neither local nor remote branch exists.

2. `scripts/deploy-pages.sh:14,49` cleans up only after success. A failed build leaves the temporary directory, while a failed commit or push leaves a registered worktree with `gh-pages` checked out; the next deploy can then fail because that branch is already checked out. Install an `EXIT` trap immediately after `mktemp -d` that removes the worktree when registered and otherwise removes the empty temporary directory.

3. `README.md:20` says the published site is built from `main`, but `scripts/deploy-pages.sh:17,24` builds whichever clean branch is checked out. Either enforce `main` in the script before building or revise the README to describe the actual behavior; publishing an unreviewed feature branch is not an acceptable implicit deployment path.
