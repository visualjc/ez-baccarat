---
id: bjcze2pk
name: ezb-push-account
created: 2026-08-25T16:42:46Z
tags:
  - friction
  - tooling
sources:
  - wk50rys1
---
Pushing this repo needs the visualjc gh account: origin is github.com/visualjc/ez-baccarat and the machine default account justgamesjim gets 403. Procedure: gh auth switch --user visualjc, push, gh auth switch --user justgamesjim to restore the default. gh holds the token throughout; do not extract it. The visualjc token carries codespace/gist/read:org/repo but no workflow scope, which is why the Pages deploy workflow is still parked at docs/deploy/pages.yml.
