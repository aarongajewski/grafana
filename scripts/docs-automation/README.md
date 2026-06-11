# Cursor + Harness docs automation demo

This folder contains the Cursor SDK runner used by the Harness pipeline
`cursor_docs_update_demo` in project `cursor_demo`.

## Repo choice

This demo uses the Grafana fork (`aarongajewski/grafana`) for enterprise
realism: a large `docs/sources/` tree and `docs/AGENTS.md` style rules.

## Harness prerequisites

1. **Secrets** in `cursor_demo`:
   - `github_pat` — GitHub PAT with repo + PR comment scope
   - `cursor_api_key` — Cursor user or service-account API key (`CURSOR_API_KEY`)
2. **Harness Cloud** validated on the account (or a delegate runtime)
3. **Connector** `github_grafana` pointing at this fork
4. **PR trigger** `docs_pr_trigger` registered on the repo (Harness UI → Triggers → register webhook)

## Demo PR

- Branch: `demo/docs-automation`
- PR: adds `pkg/util/harness_docs_demo.go` **without** matching docs
- Expected outcome: pipeline runs Cursor, updates `docs/sources/`, commits to the PR branch

## Local dry run

```bash
export CURSOR_API_KEY="cursor_..."
export GITHUB_TOKEN="ghp_..."   # only needed for push
cd scripts/docs-automation
npm install
npx tsx update-docs.ts --base main --dry-run
```

## Pipeline

- **ID:** `cursor_docs_update_demo`
- **Trigger:** `docs_pr_trigger` on PR open/reopen/sync → `main`
- **Manual run input:** PR number (e.g. `5`)
