#!/bin/bash
set -euo pipefail

ENVIRONMENT="${1:-${DEPLOY_ENVIRONMENT:-development}}"
BRANCH="${GITHUB_REF_NAME:-$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo unknown)}"
LOG_DIR="deploy/logs/${ENVIRONMENT}"
TIMESTAMP="$(date -u +"%Y%m%dT%H%M%SZ")"
LOG_FILE="${LOG_DIR}/${TIMESTAMP}.log"

mkdir -p "$LOG_DIR"

case "$ENVIRONMENT" in
  development)
    ;;
  staging)
    if [[ "$BRANCH" != "main" && ! "$BRANCH" =~ ^release/ ]]; then
      echo "Staging deployments are only allowed from main or release/* branches." | tee -a "$LOG_FILE"
      exit 1
    fi
    ;;
  production)
    if [[ "$BRANCH" != "main" ]]; then
      echo "Production deployments are only allowed from the main branch." | tee -a "$LOG_FILE"
      exit 1
    fi
    ;;
  *)
    echo "Unsupported environment: $ENVIRONMENT" | tee -a "$LOG_FILE"
    exit 1
    ;;
esac

BUNDLE_DIR="$(node scripts/prepare-deployment-bundle.mjs "$ENVIRONMENT")"
echo "Prepared deployment bundle at $BUNDLE_DIR" | tee -a "$LOG_FILE"

if [[ -n "${CONTRACT_DEPLOY_COMMAND:-}" ]]; then
  echo "Running contract deployment command" | tee -a "$LOG_FILE"
  bash -lc "$CONTRACT_DEPLOY_COMMAND" 2>&1 | tee -a "$LOG_FILE"
fi

if [[ -n "${RELAYER_DEPLOY_COMMAND:-}" ]]; then
  echo "Running relayer deployment command" | tee -a "$LOG_FILE"
  bash -lc "$RELAYER_DEPLOY_COMMAND" 2>&1 | tee -a "$LOG_FILE"
fi

if [[ -n "${FRONTEND_DEPLOY_COMMAND:-}" ]]; then
  echo "Running frontend deployment command" | tee -a "$LOG_FILE"
  bash -lc "$FRONTEND_DEPLOY_COMMAND" 2>&1 | tee -a "$LOG_FILE"
fi

if [[ -z "${CONTRACT_DEPLOY_COMMAND:-}" && -z "${RELAYER_DEPLOY_COMMAND:-}" && -z "${FRONTEND_DEPLOY_COMMAND:-}" ]]; then
  echo "No deployment commands configured; bundle-only dry run completed." | tee -a "$LOG_FILE"
fi
