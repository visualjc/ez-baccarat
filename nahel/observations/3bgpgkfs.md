---
id: 3bgpgkfs
name: ezb-actions-deploy-deferred
created: 2026-08-25T21:54:52Z
tags:
  - decision
  - deploy
  - roadmap
sources:
  - d22vyc27
---
Jim weighed moving publication to GitHub Actions on 2026-08-25 and deferred it — parked at roadmap node zasn46mk (horizon next, work item jcxmed9x), not dropped. His stated reason for staying on the local branch deploy is that it costs no Actions minutes; for the record, Actions minutes are free on public repos, so the real trade is reproducibility (clean runner plus bun install versus whatever is on his Mac) and an automatic trigger, against one interactive token refresh only he can run. Nothing is blocked meanwhile: the branch deploy works and the site is live, it just needs scripts/deploy-pages.sh run after each merge, which makes forgetting the failure mode.
