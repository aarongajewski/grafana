// @ts-check
const { ESLintUtils, AST_NODE_TYPES } = require('@typescript-eslint/utils');

const createRule = ESLintUtils.RuleCreator(
  (name) => `https://github.com/grafana/grafana/blob/main/contribute/style-guides/frontend-logging.md#${name}`
);

const MONITORING_LOG_CALLEES = new Set(['logInfo', 'logWarning', 'logDebug']);

/** @param {import('@typescript-eslint/utils').TSESTree.CallExpression} node */
function getCalleeName(node) {
  const callee = node.callee;
  if (callee.type === AST_NODE_TYPES.Identifier) {
    return callee.name;
  }
  if (
    callee.type === AST_NODE_TYPES.MemberExpression &&
    !callee.computed &&
    callee.property.type === AST_NODE_TYPES.Identifier
  ) {
    return callee.property.name;
  }
  return undefined;
}

const noFormattedMonitoringLogsRule = createRule({
  create(context) {
    return {
      CallExpression(node) {
        const calleeName = getCalleeName(node);
        if (!calleeName || !MONITORING_LOG_CALLEES.has(calleeName)) {
          return;
        }

        const [messageArg] = node.arguments;
        if (!messageArg) {
          return;
        }

        if (messageArg.type === AST_NODE_TYPES.TemplateLiteral && messageArg.expressions.length > 0) {
          context.report({
            node: messageArg,
            messageId: 'noFormattedMonitoringLogs',
          });
        }
      },
    };
  },
  name: 'no-formatted-monitoring-logs',
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow template literal monitoring log messages; use a stable message string and LogContext fields instead.',
    },
    messages: {
      noFormattedMonitoringLogs:
        'Use a stable monitoring log message and pass dynamic values in the context object instead of template literals.',
    },
    schema: [],
  },
  defaultOptions: [],
});

module.exports = noFormattedMonitoringLogsRule;
