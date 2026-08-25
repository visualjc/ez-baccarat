# ADR-0002: Constitution boundary under the hands-off founding

- Status: accepted (founding)
- Date: 2026-08-25

## Context

This project was founded hands-off: Jim handed one paragraph over in chat
(2026-08-24) and left, with an explicit delegation to his agent
(journaled in the nahel repo as event vzpj1m1d) covering founding acts.

## Decision

Only the quoted Goal paragraph in PRODUCT.md is signed constitutional
content. Every elaboration around it — domain facts, hard constraints,
non-goals, this ADR set — is agent-drafted legislation: AFK work may rely
on it as a parkable assumption, never as an un-overridable rule. Work that
would contradict the PARAGRAPH parks; work that strains only the
elaboration journals the tension and proceeds on judgment.

## Consequences

- `governance.product: delegated`, `governance.architecture: human`.
- The paragraph is checked before every implementation dispatch
  (afk-run step 8).
- The human promotes elaboration into signed constitution by editing
  PRODUCT.md and journaling the sign-off.
