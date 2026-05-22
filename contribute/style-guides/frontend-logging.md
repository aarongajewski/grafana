# Frontend structured logging

Production frontend telemetry should use the Faro helpers from `@grafana/runtime` in [`packages/grafana-runtime/src/utils/logging.ts`](../../packages/grafana-runtime/src/utils/logging.ts).

## Contract

- Use a **stable message string** as the log identifier.
- Put dynamic values in the optional `LogContext` object (Faro context fields).
- Prefer `createMonitoringLogger('feature.area')` for feature-owned telemetry so `source` and default context are applied consistently.
- Use `logMeasurement` for timings and numeric performance data.

**Do:**

```typescript
import { createMonitoringLogger } from '@grafana/runtime';

const logger = createMonitoringLogger('features.alerting');

logger.logInfo('Route groups matched', {
  matchingTimeMs: String(timeSpent),
  alertGroupsCount: String(alertGroups.length),
});
```

**Do not** embed dynamic values in template literal messages when structured context is available:

```typescript
// Bad
logInfo(`Route groups matched in ${timeSpent} ms`, { matchingTimeMs: String(timeSpent) });

// Good
logInfo('Route groups matched', { matchingTimeMs: String(timeSpent) });
```

## Dev-only logging

The following are for local debugging only and are not production telemetry:

- `createLogger` from `@grafana/ui` (gated by `localStorage grafana.debug`)
- `createDebugLog` in `public/app/core/utils/debugLog.ts`
- Raw `console.*` calls in development paths

Do not use `console.*` for production monitoring. If Faro console instrumentation is enabled, duplicate logs may be emitted.

## Analytics vs monitoring

- Use `reportInteraction` / `defineFeatureEvents` for product analytics events.
- Use `logInfo` / `logWarning` / `logError` / `logMeasurement` for operational monitoring via Faro.

## Enforcement

The ESLint rule `@grafana/no-formatted-monitoring-logs` flags template literal messages passed to monitoring log helpers (`logInfo`, `logWarning`, `logDebug`, and methods on loggers created with `createMonitoringLogger`).
