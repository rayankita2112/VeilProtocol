#!/bin/bash
set -euo pipefail

ENVIRONMENT="${1:-${DEPLOY_ENVIRONMENT:-development}}"
if [[ -z "${ROLLBACK_COMMAND:-}" ]]; then
  echo "No ROLLBACK_COMMAND configured for ${ENVIRONMENT}. Nothing to execute."
  exit 0
fi

echo "Running rollback for ${ENVIRONMENT}"
bash -lc "$ROLLBACK_COMMAND"
