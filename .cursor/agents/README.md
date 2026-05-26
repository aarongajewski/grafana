# Custom Cursor subagents

This directory holds **project-scoped subagents**: markdown files Cursor can delegate to for specialized work.

## File format

Each agent is `<name>.md` with YAML frontmatter and a markdown **system prompt** body:

| Field | Purpose |
| ----- | ------- |
| `name` | Identifier; used for `/name` invocation |
| `description` | When Cursor should delegate automatically (most important field) |
| `model` | `inherit` or a specific model ID |
| `readonly` | If `true`, the subagent cannot edit files |
| `is_background` | If `true`, runs without blocking the parent |

## Invocation

- **Automatic** — parent agent delegates when the task matches `description`
- **Explicit** — `/grafana-alerting-specialist <prompt>` in chat
- **Natural mention** — e.g. "use the alerting specialist to …"

## Convention in this repo

Keep subagent bodies **short**. Point at existing squad guides (e.g. `public/app/features/alerting/unified/AGENTS.md`) instead of copying long conventions into `.cursor/agents/`.

## Agents defined here

| File | Scope |
| ---- | ----- |
| [grafana-alerting-specialist.md](./grafana-alerting-specialist.md) | Unified alerting frontend (`public/app/features/alerting/unified/`, `packages/grafana-alerting/`) |

To add another agent, copy the pattern: frontmatter + role + required reading + hard scope + handoff rules.
