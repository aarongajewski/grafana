#!/usr/bin/env bash
set -euo pipefail

# Block mutating gh commands against upstream (grafana/grafana).
# Allow mutating commands targeting personal or team forks, or with no --repo (uses git origin).

INPUT_JSON="$(cat)"
COMMAND="$(python3 -c 'import json,sys; print(json.load(sys.stdin).get("command",""))' <<< "$INPUT_JSON" 2>/dev/null || true)"
COMMAND_LC="$(printf '%s' "$COMMAND" | tr '[:upper:]' '[:lower:]')"

if [[ ! "$COMMAND_LC" =~ (^|[[:space:]])gh([[:space:]]|$) ]]; then
  printf '%s\n' '{"continue":true,"permission":"allow"}'
  exit 0
fi

is_mutating="false"
if [[ "$COMMAND_LC" =~ (^|[[:space:]])(create|edit|merge|close|reopen|delete|transfer|lock|unlock|pin|unpin|upload|archive|unarchive|review|ready)([[:space:]]|$) ]]; then
  is_mutating="true"
fi

targets_upstream="false"
if [[ "$COMMAND_LC" =~ (--repo|-r)[[:space:]]*grafana/grafana ]] \
  || [[ "$COMMAND_LC" =~ github\.com/grafana/grafana ]] \
  || [[ "$COMMAND_LC" =~ (^|[[:space:]])grafana/grafana([[:space:]]|$) ]]; then
  targets_upstream="true"
fi

targets_personal_fork="false"
if [[ "$COMMAND_LC" =~ (--repo|-r)[[:space:]]*aarongajewski/grafana ]] \
  || [[ "$COMMAND_LC" =~ github\.com/aarongajewski/grafana ]]; then
  targets_personal_fork="true"
fi

targets_fieldsphere_fork="false"
if [[ "$COMMAND_LC" =~ (--repo|-r)[[:space:]]*fieldsphere/grafana ]] \
  || [[ "$COMMAND_LC" =~ github\.com/fieldsphere/grafana ]]; then
  targets_fieldsphere_fork="true"
fi

has_explicit_repo="false"
if [[ "$COMMAND_LC" =~ (--repo|-r)[[:space:]]+[^[:space:]]+ ]]; then
  has_explicit_repo="true"
fi

if [[ "$is_mutating" == "true" && "$targets_upstream" == "true" ]]; then
  cat <<'EOF'
{"continue":true,"permission":"deny","user_message":"Blocked: write actions to grafana/grafana (upstream) are not allowed. Use --repo aarongajewski/grafana or --repo fieldsphere/grafana.","agent_message":"This gh command targets grafana/grafana. Use --repo aarongajewski/grafana (default) or --repo fieldsphere/grafana for write actions."}
EOF
  exit 0
fi

if [[ "$is_mutating" == "true" && "$has_explicit_repo" == "true" && "$targets_personal_fork" != "true" && "$targets_fieldsphere_fork" != "true" ]]; then
  cat <<'EOF'
{"continue":true,"permission":"deny","user_message":"Blocked: mutating gh commands must target an allowed fork: aarongajewski/grafana or fieldsphere/grafana.","agent_message":"For mutating gh commands with --repo, use --repo aarongajewski/grafana (primary) or --repo fieldsphere/grafana (team fork). Never target grafana/grafana."}
EOF
  exit 0
fi

printf '%s\n' '{"continue":true,"permission":"allow"}'
