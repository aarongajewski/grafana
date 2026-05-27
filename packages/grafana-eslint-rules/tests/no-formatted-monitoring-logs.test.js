import { RuleTester } from 'eslint';

import noFormattedMonitoringLogsRule from '../rules/no-formatted-monitoring-logs.cjs';

RuleTester.setDefaultConfig({
  languageOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
  },
});

const ruleTester = new RuleTester();

ruleTester.run('no-formatted-monitoring-logs', noFormattedMonitoringLogsRule, {
  valid: [
    {
      code: `logInfo('Route groups matched', { matchingTimeMs: String(timeSpent) });`,
    },
    {
      code: `logger.logWarning('Invalid correlation config', { pluginId });`,
    },
    {
      code: `console.warn('dev only', pluginId);`,
    },
    {
      code: `logInfo('static message without interpolation');`,
    },
  ],

  invalid: [
    {
      code: `logInfo(\`Route groups matched in \${timeSpent} ms\`, { matchingTimeMs: String(timeSpent) });`,
      errors: [{ messageId: 'noFormattedMonitoringLogs' }],
    },
    {
      code: `logger.logWarning(\`Saved searches data for \${storageKey} is not an array\`);`,
      errors: [{ messageId: 'noFormattedMonitoringLogs' }],
    },
  ],
});
