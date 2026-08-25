---
run: ydpz7kgt
item: njrkpjjd
responsibility: review
created: 2026-08-25T19:59:16Z
---
# Re-review: PR #7 — Pages deploy (documentation finding only)

Your last pass cleared all three original findings and left exactly one request:

> README lines 20–25 state the default `main` rule but omit the `DEPLOY_FROM=<branch>` deliberate override, even though the task requires the README to describe it. Add that documented escape hatch, then re-review.

Addressed:

    git log -p -1 -- README.md

The README now shows both invocations in a fenced block — the plain `scripts/deploy-pages.sh` and `DEPLOY_FROM=my-branch scripts/deploy-pages.sh` — and says plainly that the override is for the rare deliberate exception such as previewing a branch.

It also gained one line of operational fact learned in the field: Pages must serve the `gh-pages` branch at `/ (root)`, because the owner initially pointed it at a source branch and the site 404'd on `/src/main.ts` (the unbuilt index.html asking for TypeScript).

## Decide

Is the documentation finding closed? Anything wrong with the added lines.

End with exactly one of:

    VERDICT: APPROVE
    VERDICT: REQUEST CHANGES

Do not re-litigate what you already cleared. Do not invent new findings.
