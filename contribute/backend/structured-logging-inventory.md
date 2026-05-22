# Structured logging migration inventory

This document tracks remaining format-string style logging after the structured logging migration. It is generated/maintained alongside the `structuredlogmsg` ruleguard rule and `@grafana/no-formatted-monitoring-logs` ESLint rule.

## Backend exceptions (allowed)

These packages intentionally use format-string logging because they adapt third-party APIs or human-facing CLI output:

| Path | Reason |
| --- | --- |
| [`pkg/services/sqlstore/logger.go`](../pkg/services/sqlstore/logger.go) | XORM `ILogger` bridge |
| [`pkg/util/xorm/syslogger.go`](../pkg/util/xorm/syslogger.go) | XORM syslog bridge |
| [`pkg/plugins/log/infra_wrapper.go`](../pkg/plugins/log/infra_wrapper.go) | `PrettyLogger` CLI output (`*f` methods) |
| [`pkg/build/`](../pkg/build/) | Build/CI tooling (excluded from ruleguard) |

## Frontend follow-up (not yet lint-enforced)

The ESLint rule currently flags template literals with interpolations in `logInfo`, `logWarning`, and `logDebug`. Remaining cleanup opportunities:

| Area | Notes |
| --- | --- |
| Raw `console.*` in `public/app/**` | Dev/debug paths; not production Faro telemetry. Consider scoped `no-console` in a follow-up. |
| [`packages/grafana-runtime/src/services/pluginMeta/logging.ts`](../../packages/grafana-runtime/src/services/pluginMeta/logging.ts) | Dual Faro + console logging |
| [`public/app/features/plugins/extensions/logs/log.ts`](../../public/app/features/plugins/extensions/logs/log.ts) | Dual Faro + console + BroadcastChannel |

## Verification commands

```bash
# Backend: find direct fmt.Sprintf/fmt.Sprint in log calls outside exceptions
rg '\.(Debug|Info|Warn|Error|Warning)\(fmt\.S(printf|print)\(' pkg \
  --glob '!pkg/services/sqlstore/logger.go' \
  --glob '!pkg/util/xorm/syslogger.go' \
  --glob '!pkg/plugins/log/**'

# Frontend: find interpolated monitoring log messages
rg 'log(Info|Warning|Debug)\(`[^`]*\$\{' public/app packages/grafana-runtime

# Run linters
make lint-go
yarn workspace @grafana/eslint-plugin test
```

## Migration status

- Backend application code: converted to static messages + key-value fields
- Backend enforcement: `scripts/check-structured-logging.sh` plus `structuredlogmsg` ruleguard rule (ready for `gocritic` in `.golangci.yml`)
- Frontend first batch: alerting, plugins sandbox/importer converted
- Frontend enforcement: `@grafana/no-formatted-monitoring-logs` enabled in `eslint.config.js`
