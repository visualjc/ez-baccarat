---
id: zasn46mk
name: actions-deploy
kind: feature
horizon: next
parent: ekncbtyt
adrs: []
epic: jcxmed9x
features: []
created: 2026-08-25T21:47:44Z
updated: 2026-08-25T21:47:44Z
---
Move publishing from the local branch deploy to GitHub Actions, so a merge to main is what ships the site rather than someone remembering to run a script. The workflow is already written and parked at docs/deploy/pages.yml: checkout, Bun, BASE_PATH=/ez-baccarat/ bun run build, upload dist, deploy. Adopting it means moving that file to .github/workflows/, adding a bun test step it currently lacks (the build only gates on tsc), flipping the Pages source from the gh-pages branch to GitHub Actions, and deleting both the gh-pages branch and scripts/deploy-pages.sh so no second, silent publish path remains.

Blocked on one thing only: pushes touching .github/workflows need a workflow-scoped credential, and the visualjc token has repo scope alone. Jim runs 'gh auth refresh -h github.com -s workflow -u visualjc' once, then the rest is a normal PR.

Deferred by Jim on 2026-08-25, thinking about it. His stated reason is that the local build costs no Actions minutes; worth noting for whoever picks this up that Actions minutes are free on public repos, so the real trade is reproducibility and an automatic trigger against one interactive token refresh. Not urgent: the branch deploy works and the site is live.
