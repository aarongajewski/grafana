#!/usr/bin/env bash
set -euo pipefail

# Checks for format-string style logging in backend code.
# See contribute/backend/instrumentation.md for the structured logging contract.

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

PATTERN='\.(Debug|Info|Warn|Error|Warning)\(fmt\.S(printf|print)\('

EXCLUDES=(
  --glob '!pkg/services/sqlstore/logger.go'
  --glob '!pkg/util/xorm/syslogger.go'
  --glob '!pkg/plugins/log/**'
  --glob '!pkg/build/**'
  --glob '!pkg/ruleguard.rules.go'
)

matches="$(rg "$PATTERN" pkg apps "${EXCLUDES[@]}" 2>/dev/null || true)"

if [[ -n "$matches" ]]; then
  echo "Structured logging check failed. Use static log messages with key-value pairs instead of fmt.Sprintf/fmt.Sprint in log calls."
  echo
  echo "$matches"
  exit 1
fi

echo "Structured logging check passed."
