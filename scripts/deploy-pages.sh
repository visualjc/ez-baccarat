#!/usr/bin/env bash
# Publish the current build to the gh-pages branch GitHub Pages serves from.
#
# Pages is configured to deploy from a branch rather than from Actions: the
# push credential for this repo has `repo` but not `workflow` scope, so a
# workflow file cannot be pushed into .github/workflows. Nothing here needs it.
#
# Usage: scripts/deploy-pages.sh [commit-message]
#        DEPLOY_FROM=<branch> scripts/deploy-pages.sh   # deliberate override
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BRANCH="gh-pages"
BASE_PATH="/ez-baccarat/"
DEPLOY_FROM="${DEPLOY_FROM:-main}"

cd "$REPO_ROOT"

CURRENT_BRANCH="$(git rev-parse --abbrev-ref HEAD)"
if [ "$CURRENT_BRANCH" != "$DEPLOY_FROM" ]; then
  echo "on '$CURRENT_BRANCH', not '$DEPLOY_FROM' — publishing an unreviewed branch is not a deploy path." >&2
  echo "set DEPLOY_FROM='$CURRENT_BRANCH' if you mean it." >&2
  exit 1
fi

if [ -n "$(git status --porcelain)" ]; then
  echo "working tree is dirty — commit or stash first" >&2
  exit 1
fi

MESSAGE="${1:-deploy $CURRENT_BRANCH@$(git rev-parse --short HEAD)}"
# Physical path: on macOS mktemp hands back /var/... while git records the
# resolved /private/var/..., and a cleanup that string-matches would miss it.
WORKTREE="$(cd "$(mktemp -d)" && pwd -P)"

# A failed build or push would otherwise leave the temp dir behind, or worse, a
# registered worktree holding gh-pages checked out — which blocks the next run.
cleanup() {
  git worktree remove --force "$WORKTREE" >/dev/null 2>&1 || true
  rm -rf "$WORKTREE"
  git worktree prune >/dev/null 2>&1 || true
}
trap cleanup EXIT

BASE_PATH="$BASE_PATH" bun run build

git fetch -q origin "$BRANCH" 2>/dev/null || true

if git show-ref --quiet "refs/heads/$BRANCH"; then
  git worktree add "$WORKTREE" "$BRANCH" >/dev/null
elif git show-ref --quiet "refs/remotes/origin/$BRANCH"; then
  # Fresh clone after a previous publication: the branch exists only on the
  # remote, and the orphan path would push a non-fast-forward.
  git worktree add --track -b "$BRANCH" "$WORKTREE" "origin/$BRANCH" >/dev/null
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
