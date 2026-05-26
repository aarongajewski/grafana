---
name: github-grafana-forks
description: GitHub and gh CLI work for this Grafana fork. Default to aarongajewski/grafana; use fieldsphere/grafana when the user requests the team fork. Never write to upstream grafana/grafana.
---

# GitHub fork targeting

## Repos

| Repo | Role |
| ---- | ---- |
| `grafana/grafana` | **Upstream** — read-only (fetch, compare, browse). Never open PRs or mutate issues here. |
| `aarongajewski/grafana` | **Primary fork** — default for pushes, PRs, and most agent work. Matches `git remote origin`. |
| `fieldsphere/grafana` | **Team fork** — use when the user explicitly asks for fieldsphere. |

## Default behavior

- **Mutating `gh` commands** (PR create/edit, issue create, merge, close, etc.):
  - Default: `--repo aarongajewski/grafana`
  - If the user says fieldsphere / team fork: `--repo fieldsphere/grafana`
  - Omitting `--repo` is allowed when `origin` points at the personal fork (hook permits it).
- **Read-only `gh`** against `grafana/grafana` is fine for upstream context.
- State the target repo in user-facing output, e.g. `Target repo: aarongajewski/grafana`, and include the PR URL.

## Examples

```bash
# Primary — personal fork (default)
gh pr create --repo aarongajewski/grafana --base main --head my-branch

# Team fork — only when requested
gh pr create --repo fieldsphere/grafana --base main --head my-branch

# Upstream — read only
gh pr list --repo grafana/grafana --limit 5
```

## Git remotes

Expect:

- `origin` → `https://github.com/aarongajewski/grafana.git`
- `upstream` → `https://github.com/grafana/grafana.git`

Check with `git remote -v` if unsure.

## MCP / API

For GitHub MCP tools, set owner/repo to the fork in scope (`aarongajewski` + `grafana` by default, or `fieldsphere` + `grafana` when the user requests it).
