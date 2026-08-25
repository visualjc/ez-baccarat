---
id: 3s23ctvr
name: ezb-tooling-frictions
created: 2026-08-25T05:44:02Z
tags:
  - friction
  - nahel-backlog
sources:
  - y3tmppwz
  - e0b9mtcj
  - 87ayay05
---
Frictions for the nahel backlog: (1) dispatched worker sandboxes lack nahel and bun on PATH — reviewers cannot journal attributed verdicts (terra epic review fell back to its result doc) and devs cannot run suites (every dev round-tripped through the host); (2) a host git reset --hard destroyed uncommitted journal appends on a tracked run file (incident y3tmppwz) — envelope replay recovered it but validate could not detect the loss; (3) OAuth token without workflow scope cannot push .github/workflows (Pages deploy parked at docs/deploy/pages.yml for Jim).
