---
run: rr5esvc4
item: dh6xeqdg
role: dev
created: 2026-08-25T05:31:33Z
---
# Task — epic closeout artifacts (item dh6xeqdg): README + GitHub Pages deploy

Two deliverables:

1. README.md — the public face of github.com/visualjc/ez-baccarat: what the
   game is (EZ Baccarat + Dragon 7 / Panda 8 counting trainer), a Play
   section (GitHub Pages URL will be https://visualjc.github.io/ez-baccarat/
   once deployed; also bun install / bun run dev), the count systems table
   (from PRODUCT.md domain facts, with the WoO attribution), trainer vs
   casino mode, seeded shoes (?seed=), and a "built by role-routed agents
   through nahel playbooks" section naming the roles/models (from
   docs/adr/0003-per-role-dispatch.md). Honest, skimmable, short paragraphs.

2. .github/workflows/pages.yml — standard static Pages deploy: on push to
   main, bun setup (oven-sh/setup-bun), bun install, bun run build, upload
   dist/, deploy with actions/deploy-pages (needs pages permissions +
   environment). IMPORTANT: vite needs base: '/ez-baccarat/' for project
   pages — set it via vite config (create vite.config.ts with base from
   env BASE_PATH defaulting to '/', and pass BASE_PATH=/ez-baccarat/ in the
   workflow build step) so local dev stays at '/'.

Verify: bun run build still clean locally (host runs it). No git commits.
Result to your run result.md.
