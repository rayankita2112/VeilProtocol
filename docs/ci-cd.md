# CI/CD Architecture

This repository now uses a modular GitHub Actions layout:

- `ci.yml`: pull request and `main` branch validation for build, lint, format, typecheck, tests, contracts, circuits, and frontend build integrity.
- `security.yml`: dependency audits, license validation, secret scanning, and Trivy-based security scanning.
- `codeql.yml`: GitHub CodeQL analysis for JavaScript/TypeScript and Rust.
- `release.yml`: semantic versioning, changelog management, GitHub Release creation, and release artifact publication.
- `deploy.yml`: environment-aware deployment pipeline with GitHub Environments, branch policy enforcement, deployment bundling, and rollback hooks.
- `maintenance.yml`: scheduled dependency health reporting.

## Validation Entry Points

All workflows call repository scripts instead of inlining logic:

- `npm run ci:quick`
- `npm run ci:full`
- `npm run validate:circuits`
- `npm run validate:contracts`
- `npm run validate:frontend`
- `npm run validate:secrets`
- `npm run validate:licenses`

This keeps GitHub Actions thin and makes local reproduction straightforward.

License enforcement is policy-driven. The validator always generates reports; to hard-fail on specific licenses, set `DISALLOWED_LICENSES` as a repository or environment variable, for example `GPL,AGPL,LGPL`.

## Environment Configuration

Tracked templates:

- [`.env.example`](/Users/samya/Downloads/VIEL-PROTOCOL/.env.example:1)
- [`app/.env.example`](/Users/samya/Downloads/VIEL-PROTOCOL/app/.env.example:1)
- [`config/testnet-deployment.example.json`](/Users/samya/Downloads/VIEL-PROTOCOL/config/testnet-deployment.example.json:1)

Generated local files:

- `.env`
- `app/.env.local`

Local secret overrides can be provided through:

- shell environment variables
- `config/testnet-deployment.local.json`

`config/testnet-deployment.json` is now treated as non-secret deployment metadata only.

## Required GitHub Secrets

CI/CD expects these secrets or variables when the corresponding capability is enabled:

- `DEPLOYER_SECRET_KEY`
- `RELAYER_SECRET_KEY`
- `SUBMITTER_SECRET_KEY`
- `POOL_CONTRACT_ID`
- `VERIFIER_CONTRACT_ID`
- `TOKEN_CONTRACT_ID`
- `CONTRACT_DEPLOY_COMMAND`
- `RELAYER_DEPLOY_COMMAND`
- `FRONTEND_DEPLOY_COMMAND`
- `ROLLBACK_COMMAND`

Recommended repository variables:

- `CI_E2E_ENABLED`
- `RELAYER_URL`
- `STELLAR_RPC_URL`

## Deployment Process

`deploy.yml` supports:

- automatic staging deployment after successful CI on `main`
- manual deployment to `development`, `staging`, or `production`
- GitHub Environment-based approvals
- rollback hooks via `ROLLBACK_COMMAND`

Deployment packaging is handled by [`scripts/prepare-deployment-bundle.mjs`](/Users/samya/Downloads/VIEL-PROTOCOL/scripts/prepare-deployment-bundle.mjs:1), while execution hooks live in [`deploy/deploy.sh`](/Users/samya/Downloads/VIEL-PROTOCOL/deploy/deploy.sh:1) and [`deploy/rollback.sh`](/Users/samya/Downloads/VIEL-PROTOCOL/deploy/rollback.sh:1).

## Release Process

`release.yml` uses Release Please for:

- semantic versioning
- changelog updates
- release pull requests
- Git tags
- GitHub Releases

When a release is created, the workflow rebuilds validated artifacts and uploads a `release-bundle.tgz` asset.

## Repository Settings To Enable

These cannot be enforced from repository files alone and should be configured in GitHub:

1. Protect `main` with required status checks:
   - `Quality Gates`
   - `Soroban Contracts`
   - `Frontend Build`
   - `Dependency Audit`
   - `License Validation`
   - `Secret Scanning`
   - `Basic SAST`
   - `Analyze`
2. Require pull request reviews before merge.
3. Create GitHub Environments: `development`, `staging`, `production`.
4. Add required reviewers for the `production` environment.
5. Enable GitHub Advanced Security features if available:
   - secret scanning
   - push protection
   - dependency graph
   - Dependabot alerts

## Troubleshooting

- If `validate:circuits` fails, run `npm ci --prefix circuits` and verify `circom` is installed.
- If `validate:contracts` fails, verify the `wasm32v1-none` Rust target is installed.
- If `validate:frontend` fails because of missing env files, rerun `npm run setup:testnet`.
- If deployment is a dry run, set the deployment command secrets for the target environment.
