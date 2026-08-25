---
run: ppf844wb
item: dh6xeqdg
responsibility: review
created: 2026-08-25T05:34:45Z
---
# Review brief — epic PR #1, item dh6xeqdg, round 1

Review the FULL epic diff at HEAD 75505ef319933b482e8d2228f2c8f7751a932282, independently and adversarially:
git diff main..75505ef319933b482e8d2228f2c8f7751a932282 (application code: src/, index.html, vite.config.ts,
README.md, docs/design/, docs/prds/ — the nahel/ state trail is context,
not review surface). Read PRODUCT.md (constitution; the quoted Goal
paragraph is signed) and the PRD. Every child item already survived a
per-item panel + QA; your job is the WHOLE: cross-item seams (engine <->
counts <-> table <-> panel), anything the per-item reviews structurally
could not see, constitution compliance (esp. hard constraints 1-3), and
the release surface (README accuracy, vite base-path config, parked
docs/deploy/pages.yml correctness).

Journal EACH finding under your own actor:
  NAHEL_ACTOR=agent:codex-reviewer bun x nahel ... — NO: use the nahel on
  PATH: NAHEL_ACTOR=agent:codex-reviewer nahel log note --item dh6xeqdg \
    --data summary="review finding: <path>:<line> — <what and why>" \
    --data head=75505ef319933b482e8d2228f2c8f7751a932282 --data round=1 --data severity=<blocker|major|minor|nit>
Then exactly one verdict note (--data verdict=approve|request-changes).
