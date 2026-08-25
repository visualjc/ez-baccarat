---
run: czj0k89v
item: njrkpjjd
responsibility: review
created: 2026-08-25T19:54:39Z
---
# Re-review: PR #7 — Pages deploy

You reviewed `chore/pages-deploy` (nahel item `njrkpjjd`) and returned REQUEST CHANGES with three findings:

1. `scripts/deploy-pages.sh:27` only detected a local `refs/heads/gh-pages`; a fresh clone after a prior publication would take the orphan path and be rejected as non-fast-forward.
2. `scripts/deploy-pages.sh:14,49` cleaned up only on success, leaving a registered worktree holding `gh-pages` and blocking the next run. Asked for an EXIT trap.
3. `README.md:20` claimed the site is built from `main` while the script built whatever branch was checked out.

All three are addressed in the follow-up commit:

    git log -p -1 -- scripts/deploy-pages.sh README.md

- Remote detection: `git fetch origin gh-pages`, then local branch -> tracked branch from `origin/gh-pages` (`git worktree add --track -b`) -> orphan, in that order.
- EXIT trap installed immediately after `mktemp -d`. Note the trap needed the PHYSICAL temp path: on macOS `mktemp -d` returns `/var/...` while git records `/private/var/...`, so the first version's string match found nothing and cleaned up nothing. `WORKTREE="$(cd "$(mktemp -d)" && pwd -P)"` fixes it.
- The script now refuses to run unless `main` is checked out, with `DEPLOY_FROM` as an explicit override; the README describes that.

## Host verification against scratch clones (not the real remote)

- Guard: running on `chore/pages-deploy` exits 1 with a message naming the override.
- Trap: with the push replaced by `false`, the run fails and `git worktree list` shows no stale worktree afterwards. (Confirmed the pre-fix version DID leave one — that is how the /private/var path bug surfaced.)
- Fresh clone: pushed `gh-pages` to a scratch bare remote, cloned it fresh, ran with push suppressed. The script took the tracked-branch path (`gh-pages [origin/gh-pages]`), not the orphan path, and reported "no change to publish".

## Decide

1. Are all three findings closed?
2. Is the trap now correct for every exit path, including the dirty-tree and wrong-branch early exits (which happen BEFORE `mktemp`, so the trap is not yet installed — is that ordering right)?
3. `git worktree prune` inside the trap after `rm -rf` — necessary, harmful, or noise?
4. Anything new introduced.

End with exactly one of:

    VERDICT: APPROVE
    VERDICT: REQUEST CHANGES

Do not re-litigate what you already cleared.
