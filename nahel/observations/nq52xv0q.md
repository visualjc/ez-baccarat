---
id: nq52xv0q
name: ezb-codegraph-indexed
created: 2026-08-25T21:54:52Z
tags:
  - tooling
  - reference
sources:
  - 6jahadxr
---
This repo is CodeGraph-indexed and AGENTS.md documents it outside the nahel orientation block: query 'codegraph explore/node/callers/impact/affected' before grep, and run 'codegraph sync' after editing source or the index answers with stale code. The index (.codegraph/, gitignored SQLite, 49 files / 441 nodes / 1656 edges) is rebuilt per machine with 'codegraph init .'. The MCP server is installed for Claude Code only; the shell CLI is the vendor-neutral path that codex and other agents use. Grep stays correct for prose: markdown, nahel journal JSONL, CSS.
