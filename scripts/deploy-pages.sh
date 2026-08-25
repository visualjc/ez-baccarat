#!/usr/bin/env bash
# Publish the current build to the gh-pages branch GitHub Pages serves from.
#
# Pages is configured to deploy from a branch rather than from Actions: the
# push credential for this repo has `repo` but not `workflow` scope, so a
# workflow file cannot be pushed into .github/workflows. Nothing here needs it.
#
# Usage: scripts/deploy-pages.sh [commit-message]
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BRANCH="gh-pages"
BASE_PATH="/ez-baccarat/"
WORKTREE="$(mktemp -d)"
MESSAGE="${1:-deploy $(git -C "$REPO_ROOT" rev-parse --short HEAD)}"

cd "$REPO_ROOT"

if [ -n "$(git status --porcelain)" ]; then
  echo "working tree is dirty — commit or stash first" >&2
  exit 1
fi

BASE_PATH="$BASE_PATH" bun run build

# Detached worktree so the deploy never disturbs the checked-out branch.
if git show-ref --quiet "refs/heads/$BRANCH"; then
  git worktree add "$WORKTREE" "$BRANCH" >/dev/null
else
  git worktree add --detach "$WORKTREE" >/dev/null
  git -C "$WORKTREE" checkout --orphan "$BRANCH" >/dev/null
  git -C "$WORKTREE" rm -rf . >/dev/null 2>&1 || true
fi

find "$WORKTREE" -mindepth 1 -maxdepth 1 -not -name .git -exec rm -rf {} +
cp -R dist/. "$WORKTREE"/
# Jekyll would otherwise swallow any path starting with an underscore.
touch "$WORKTREE/.nojekyll"

git -C "$WORKTREE" add -A
if git -C "$WORKTREE" diff --cached --quiet; then
  echo "no change to publish"
else
  git -C "$WORKTREE" commit -q -m "$MESSAGE"
  git -C "$WORKTREE" push -q origin "$BRANCH"
  echo "published $MESSAGE to $BRANCH"
fi

git worktree remove --force "$WORKTREE"
