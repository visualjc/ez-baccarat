# ADR-0003: Per-role model routing and the one build playbook

- Status: accepted (founding)
- Date: 2026-08-25

## Context

The founding paragraph names the delegation explicitly: spark writes, terra
and sonnet review, sol QAs, opus designs, the orchestrator judges. This is
the project's defining experiment — per-task model delegation through nahel
playbooks, driven AFK over the afk-playbook-bridge.

## Decision

`config.roles` routes:

| role | agent | model | effort | exec |
|---|---|---|---|---|
| dev | codex | gpt-5.3-codex-spark | — | spawn |
| reviewer-terra | codex | gpt-5.6-terra | medium | spawn |
| reviewer-sonnet | claude | sonnet | — | spawn |
| qa | codex | gpt-5.6-sol | medium | spawn |
| ui-designer | claude | opus | — | spawn |
| closer | — | — | — | self |

`config.routing` mirrors the same intent for bare dispatches: implementation
and default → codex spark, review → codex terra, review2 → claude sonnet,
architecture → claude opus.

ONE build playbook (`build-review`) covers all implementable work including
bug fixes (murder-mystery evidence, nahel ticket j93bhc15): design →
implement → review panel → fix → qa → close. Ceremony is modulated inside
the drive by journaled role-skips (a bug fix skips design; a doc change may
skip qa), never by authoring a second lighter recipe. Every implementable
work item names this playbook; `qa`/`plan` items stay bare.

## Consequences

- The panel is cross-vendor by construction (terra=codex, sonnet=claude).
- The orchestrator (claude host) never takes the dev role except through
  playbook-run section 5's tiered self-fallback, journaled.
