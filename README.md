# Veil Protocol

Veil Protocol is a privacy-focused Stellar Soroban application for shielded deposits, private withdrawals, and optional token swaps. It combines Rust smart contracts, Groth16 zero-knowledge proofs, Circom circuits, a relayer service, a TypeScript SDK, and a responsive Next.js wallet interface.

The application is designed around a simple user flow: a user deposits a fixed amount into a pool, receives a private note, and later withdraws to a recipient without publicly linking the deposit and withdrawal. The protocol also includes selective disclosure and compliance-oriented tooling for demo and audit workflows.

## Key Features

- Fixed-denomination shielded pools on Stellar Soroban.
- Groth16 proof verification through a dedicated verifier contract.
- Inter-contract communication between the pool, verifier, token contract, and swap router.
- Nullifier-based double-spend protection.
- Incremental Merkle tree state stored on-chain.
- Optional private withdrawal-to-swap flow through a router contract.
- Event emission for deposits, withdrawals, rate updates, and swaps.
- Frontend event synchronization with interval polling, reconnect recovery, and tab-visibility resync.
- Browser-side note handling and proof workflow.
- Relayer service for withdrawal submission.
- Mobile-responsive wallet UI with dashboard, send, receive, notes, explorer, compliance, and settings pages.
- CI/CD workflows for quality checks, tests, contract builds, frontend builds, security checks, releases, and deployment hooks.

## Repository Structure

```text
.
├── app/                    # Next.js frontend and API routes
├── circuits/               # Circom circuits and proof artifacts
├── contracts/              # Soroban smart contracts
│   ├── groth16-verifier/   # On-chain Groth16 verifier
│   ├── swap-router/        # Fixed-rate router for withdrawal swaps
│   └── veil-pool/          # Privacy pool contract
├── deploy/                 # Deployment and rollback scripts
├── docs/                   # CI/CD and production-readiness documentation
├── relayer/                # Withdrawal relay service
├── scripts/                # Build, validation, demo, and deployment helpers
└── sdk/                    # TypeScript protocol SDK
```

## System Architecture

Veil Protocol is split into five main layers:

1. Smart contracts
   The Soroban contracts hold protocol state, verify proofs, enforce access control, emit events, and perform token transfers.

2. Zero-knowledge circuits
   Circom circuits produce the withdrawal and subset proofs used to prove membership without revealing the original deposit.

3. Relayer
   The relayer submits withdrawal transactions so a recipient can receive funds without needing to expose a funding path.

4. SDK
   The SDK contains reusable TypeScript utilities for notes, Merkle trees, proof helpers, relayer calls, and viewing keys.

5. Frontend
   The Next.js app provides the user-facing wallet, private send/receive flows, explorer views, and compliance demo pages.

## Smart Contracts

The protocol uses three Soroban contracts.

### Veil Pool

Location: [contracts/veil-pool/src/lib.rs](/Users/samya/Downloads/VIEL-PROTOCOL/contracts/veil-pool/src/lib.rs:1)

The pool contract is the core protocol contract. It manages:

- Pool initialization and admin configuration.
- Fixed-denomination deposits.
- Poseidon commitment insertion into the Merkle tree.
- Known root tracking.
- Nullifier tracking to prevent double withdrawals.
- Encrypted note storage.
- Withdrawal proof validation through the verifier contract.
- Token transfers to recipients and relayers.
- Optional withdrawal-to-swap execution through the router.

Important methods:

- `initialize(admin, token, verifier, denomination)`
- `deposit(from, commitment)`
- `deposit_with_note(from, commitment, encrypted_note)`
- `withdraw(proof, root, nullifier_hash, recipient, relayer, fee, refund)`
- `withdraw_swap(...)`
- `set_swap_router(router)`
- `is_known_root(root)`
- `is_spent(nullifier_hash)`
- `get_last_root()`
- `get_next_index()`

Events:

- `DepositEvent`
- `WithdrawalEvent`

### Groth16 Verifier

Location: [contracts/groth16-verifier/src/lib.rs](/Users/samya/Downloads/VIEL-PROTOCOL/contracts/groth16-verifier/src/lib.rs:1)

The verifier contract stores the verification key and verifies Groth16 proofs using Soroban's BN254 host functions.

Responsibilities:

- Store the verification key during initialization.
- Validate proof public input length.
- Compute the verification key linear combination.
- Run the BN254 pairing check.
- Return a boolean verification result to the pool contract.

Important methods:

- `initialize(admin, vk)`
- `verify(proof, public_inputs)`
- `num_public_inputs()`

### Swap Router

Location: [contracts/swap-router/src/lib.rs](/Users/samya/Downloads/VIEL-PROTOCOL/contracts/swap-router/src/lib.rs:1)

The swap router is a simple fixed-rate router used by the pool's withdrawal-to-swap path. It is intentionally small and easy to inspect.

Responsibilities:

- Store admin-managed token pair rates.
- Calculate output amounts in basis points.
- Enforce minimum output checks.
- Transfer router reserves to the recipient.
- Emit rate update and swap execution events.

Important methods:

- `initialize(admin)`
- `set_rate(token_in, token_out, rate_bps)`
- `get_amount_out(token_in, token_out, amount_in)`
- `swap(token_in, token_out, amount_in, min_amount_out, recipient)`

Events:

- `RateUpdatedEvent`
- `SwapExecutedEvent`

## Inter-Contract Communication

The pool contract calls the verifier contract during withdrawal:

```text
User/Relayer
    |
    | withdraw(proof, root, nullifier, recipient, relayer, fee)
    v
Veil Pool
    |
    | verify(proof, public_inputs)
    v
Groth16 Verifier
    |
    | true / false
    v
Veil Pool
    |
    | transfer payout
    v
Token Contract
```

For swap withdrawals, the pool also calls the swap router:

```text
Veil Pool
    |
    | transfer swap amount to router
    | swap(token_in, token_out, amount_in, min_amount_out, recipient)
    v
Swap Router
    |
    | transfer token_out
    v
Recipient
```

## Event Architecture

Contract events are used to make protocol activity observable and to keep the frontend synchronized with on-chain state.

| Event               | Contract      | Purpose                                  |
| ------------------- | ------------- | ---------------------------------------- |
| `DepositEvent`      | `veil-pool`   | New commitment inserted into the pool    |
| `WithdrawalEvent`   | `veil-pool`   | Nullifier spent and withdrawal completed |
| `RateUpdatedEvent`  | `swap-router` | Router price changed for a token pair    |
| `SwapExecutedEvent` | `swap-router` | Swap completed through router reserves   |

Frontend synchronization is implemented in [app/src/lib/event-stream.mjs](/Users/samya/Downloads/VIEL-PROTOCOL/app/src/lib/event-stream.mjs:1). It performs:

- Initial tree sync on page load.
- Periodic refresh from `/api/tree`.
- Re-sync when the browser comes back online.
- Re-sync when the tab becomes visible again.
- Event classification when the tree index or root changes.

## Technology Stack

- Stellar Soroban
- Rust
- Soroban SDK `26.1.0`
- Circom
- snarkjs
- Groth16 over BN254
- Next.js 14
- React 18
- TypeScript
- Tailwind CSS
- Node.js test runner
- GitHub Actions

## Updated Deployed Contract Addresses

The project is configured for Stellar Testnet. These are the active deployed addresses from the latest deployment snapshot, generated on `2026-07-17T20:35:19.066Z`.

| Component           | Address                                                    |
| ------------------- | ---------------------------------------------------------- |
| Project account     | `GBJYIJAZCL2ZPEPJMXZS5CDRCPCR6TPMXN2C5VKRGLOJ3RZZ577WMJAM` |
| Native XLM SAC      | `CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC` |
| Groth16 verifier    | `CCLF3HMQGNPC4DM7JQNGLSTBBSEYWJWM7SDCBXA65W5CUZ5BSIJLFNH4` |
| Swap router         | `CAVKAQI3XUTZ6NJ2KKII5IZUROINOIPC3RSP4KIW7Q4FSC3NOO6FBLM3` |
| Active 100 XLM pool | `CB4MIF2KM4QHGXI5TSOOMKIJT3DOLXNWDMWPWY66OSPTCY5YDIGNLQTG` |

Verified transaction hash:

```text
f1e6caef84d957de2717ff074dccb526176c5d8a1bd9d232a68c3d6d9d8f4ee5
```

Live verification evidence:

```text
Stellar RPC getHealth: healthy
Pool get_denomination: "1000000000"
Pool get_next_index: 1
```

Deployment metadata is stored in [config/testnet-deployment.json](/Users/samya/Downloads/VIEL-PROTOCOL/config/testnet-deployment.json:1).

## CI/CD Pipelines

<img width="1456" height="791" alt="Screenshot 2026-07-19 at 3 20 28 AM" src="https://github.com/user-attachments/assets/dbf07c6f-0169-4c8f-bf78-92e84da0c66c" />

## Prerequisites

- Node.js 18 or newer
- npm
- Rust toolchain
- Stellar CLI
- `wasm32v1-none` Rust target

Install the Rust target:

```bash
rustup target add wasm32v1-none
```

## Installation

Install dependencies:

```bash
npm install
npm ci --prefix circuits
```

Generate local environment files from the checked-in deployment config:

```bash
npm run setup:testnet
```

This creates:

- `.env`
- `app/.env.local`

## Environment Variables

Root and relayer variables:

| Variable                     | Description                    |
| ---------------------------- | ------------------------------ |
| `STELLAR_RPC_URL`            | Stellar RPC endpoint           |
| `STELLAR_NETWORK_PASSPHRASE` | Stellar network passphrase     |
| `POOL_CONTRACT_ID`           | Deployed pool contract         |
| `VERIFIER_CONTRACT_ID`       | Deployed verifier contract     |
| `TOKEN_CONTRACT_ID`          | Token/SAC contract             |
| `RELAYER_SECRET_KEY`         | Relayer signing key            |
| `SUBMITTER_SECRET_KEY`       | Optional submitter signing key |
| `RELAYER_PORT`               | Local relayer port             |

Frontend variables:

| Variable                           | Description                  |
| ---------------------------------- | ---------------------------- |
| `NEXT_PUBLIC_STELLAR_RPC_URL`      | Browser-visible RPC endpoint |
| `NEXT_PUBLIC_STELLAR_NETWORK`      | `testnet` or `mainnet`       |
| `NEXT_PUBLIC_POOL_CONTRACT_ID`     | Active pool contract         |
| `NEXT_PUBLIC_VERIFIER_CONTRACT_ID` | Verifier contract            |
| `NEXT_PUBLIC_TOKEN_CONTRACT_ID`    | Token contract               |
| `NEXT_PUBLIC_RELAYER_URL`          | Relayer API URL              |

Templates are available in:

- `.env.example`
- `app/.env.example`
- `config/testnet-deployment.example.json`

## Running Locally

Build the workspaces:

```bash
npm run build
```

Start the relayer:

```bash
RELAYER_PORT=3002 node relayer/dist/index.js
```

Start the frontend:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

## Testing and Validation

Run the full local test suite:

```bash
npm test
```

Current verified test summary:

```text
groth16-verifier: 2 passed
swap-router: 2 passed
veil-pool: 3 passed
frontend/integration: 3 passed
```

Run individual validation steps:

```bash
npm run lint
npm run format:check
npm run typecheck
npm run validate:contracts
npm run validate:frontend
```

What the tests cover:

- Contract initialization.
- Verifier public input count.
- Merkle tree initialization.
- Nullifier spend status.
- Swap router rate validation.
- Swap router output calculation.
- Frontend tree snapshot normalization.
- Frontend event classification.
- Frontend polling and sync behavior.

## Smart Contract Build and Deployment

Build contract WASM:

```bash
cd contracts
stellar contract build
cd ..
```

For a fresh testnet deployment:

1. Fund a Stellar Testnet deployer account.
2. Deploy `groth16-verifier`.
3. Deploy `swap-router`.
4. Deploy `veil-pool`.
5. Initialize the contracts.
6. Set the router address on the pool if swap withdrawals are enabled.
7. Update `config/testnet-deployment.json`.
8. Run `npm run setup:testnet`.
9. Re-run tests and frontend validation.

## Deployment Workflow

Prepare a deployment bundle:

```bash
npm run prepare:deploy
```

Run a local deployment dry run:

```bash
bash deploy/deploy.sh development
```

Verified dry-run output:

```text
Prepared deployment bundle at deploy/artifacts/development-snapshot-2026-07-17T20-35-19-054Z
No deployment commands configured; bundle-only dry run completed.
```

Deployment hooks are controlled by environment variables:

- `CONTRACT_DEPLOY_COMMAND`
- `RELAYER_DEPLOY_COMMAND`
- `FRONTEND_DEPLOY_COMMAND`
- `ROLLBACK_COMMAND`

Rollback:

```bash
bash deploy/rollback.sh development
```

## CI/CD

The main workflow is [.github/workflows/ci.yml](/Users/samya/Downloads/VIEL-PROTOCOL/.github/workflows/ci.yml:1). It runs on pull requests and pushes to `main`.

Pipeline order:

1. Quality gates
   Installs dependencies, generates env files, validates lockfiles and environment templates, scans for secrets, runs linting, format checks, type checks, and frontend/integration tests.

2. Contract validation
   Installs circuit dependencies, configures Rust, validates circuits, builds Soroban contracts, runs contract tests, and uploads WASM artifacts.

3. Frontend validation
   Validates browser circuit assets, runs frontend tests, builds the Next.js app, and uploads frontend artifacts.

4. Optional end-to-end flow
   Runs only when enabled with `CI_E2E_ENABLED=true` and the required secrets are configured.

Additional workflows cover security scanning, CodeQL, releases, deployments, maintenance, and Dependabot updates. More detail is available in [docs/ci-cd.md](/Users/samya/Downloads/VIEL-PROTOCOL/docs/ci-cd.md:1).

## Demo Walkthrough

1. Run `npm run setup:testnet`.
2. Start the relayer with `RELAYER_PORT=3002 node relayer/dist/index.js`.
3. Start the frontend with `npm run dev`.
4. Open the wallet page.
5. Create or unlock a wallet.
6. Deposit into the active pool.
7. Save the generated private note.
8. Confirm the dashboard updates after the tree sync.
9. Withdraw using the note.
10. Verify the resulting transaction hash on Stellar Testnet.

Networked end-to-end script:

```bash
RUN_E2E=true npm run test:e2e
```

## Screenshots

Recommended screenshot locations:

```text
docs/screenshots/home-desktop.png
docs/screenshots/wallet-mobile.png
docs/screenshots/send-flow.png
docs/screenshots/explorer.png
docs/screenshots/ci-passing.png
```

## Security Notes

- Nullifiers prevent double spending.
- Withdrawal proofs bind public inputs such as root, nullifier, recipient, relayer, fee, and refund.
- Admin actions require Soroban address authorization.
- The verifier contract is separated from the pool contract to keep proof verification isolated.
- Persistent storage entries and instance storage use TTL extension.
- Secret keys must be provided through local environment files or deployment secrets, not source control.

## Troubleshooting

- Missing local env files: run `npm run setup:testnet`.
- Contract build fails: confirm `wasm32v1-none` is installed.
- Circuit validation fails: run `npm ci --prefix circuits`, then `npm run validate:circuits`.
- Frontend cannot reach relayer: confirm `NEXT_PUBLIC_RELAYER_URL` and `RELAYER_PORT`.
- E2E flow is skipped: set `RUN_E2E=true` locally or `CI_E2E_ENABLED=true` in CI and provide the required secrets.
- Build shows `web-worker` warning: this is from proof-generation dependencies and does not currently fail the production build.

## Additional Documentation

- [CI/CD documentation](/Users/samya/Downloads/VIEL-PROTOCOL/docs/ci-cd.md:1)
- [Final production readiness report](/Users/samya/Downloads/VIEL-PROTOCOL/docs/final-report.md:1)
