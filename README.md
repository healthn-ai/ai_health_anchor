## ai_health_anchor

A Solana Anchor program showcasing health-related on-chain logic with TypeScript tests and scripts. This repo includes build/test/deploy scaffolding and a WebSocket transaction subscription example.

### Features
- Program entry and instructions in `programs/ai_health_anchor/src`:
  - `instructions/initialize.rs`: initialize state
  - `instructions/start.rs` / `instructions/stop.rs`: start/stop a business flow
  - `instructions/buy_key.rs`: purchase/register a key (example)
  - `instructions/reward.rs`: reward/points issuance logic
  - `instructions/claim.rs`: claim/settlement logic
  - `instructions/user_account.rs`: create_account logic
- Generated IDL: `target/idl/ai_health_anchor.json`
- TypeScript client types: `target/types/ai_health_anchor.ts`
- Tests and scripts:
  - `tests/ai_health_anchor.ts`: Anchor tests
  - `tests_calls/*.ts`: standalone call scripts (e.g., `init.ts`, `fetch.ts`)
  - `ws/ws.ts`: WebSocket subscription to program transactions

### Project structure (partial)
- `programs/ai_health_anchor/`: Anchor program source
- `tests/`: Anchor tests
- `tests_calls/`: standalone scripts (init/fetch/etc.)
- `ws/`: WebSocket subscription script
- `migrations/`: Anchor migration scripts (if any)
- `target/`: build artifacts (IDL, rlib, so, etc.)

## Requirements
- Rust (stable) and Cargo
- Solana CLI (v1.18+ recommended)
- Anchor CLI (v0.30+ recommended)
- Node.js 18+ and yarn or npm

Optional: local validator via `solana-test-validator`.

## Install & Init
```bash
# Install JS deps
yarn install

# Point Solana to localnet (optional)
solana config set --url http://127.0.0.1:8899

# Start a local validator (separate terminal)
solana-test-validator --reset
```

## Build
```bash
anchor build
```

Artifacts you may use:
- `target/idl/ai_health_anchor.json`
- `target/types/ai_health_anchor.ts`
- `target/deploy/ai_health_anchor.so`

## Test
```bash
anchor test
```

Anchor will spin up a local validator, deploy, and run tests in `tests/`.

### Run standalone call scripts
Use `ts-node` for scripts in `tests_calls/`:
```bash
# Initialize example
npx ts-node tests_calls/init.ts

# Fetch/read example
npx ts-node tests_calls/fetch.ts
```

### Subscribe to program transactions via WSS
```bash
npx ts-node ws/ws.ts
```

## Deploy
Switch networks and deploy:
```bash
# Example: switch to devnet
solana config set --url https://api.devnet.solana.com

# Ensure deploy wallet is set (default ~/.config/solana/id.json or ANCHOR_WALLET)
echo $ANCHOR_WALLET

# Deploy
anchor deploy
```

After deployment, confirm the `program id` in `Anchor.toml` or console output. The IDL at `target/idl/ai_health_anchor.json` can be consumed by your clients.

## Troubleshooting
- Slow build or missing deps: try `rustup update`, `anchor --version` update, `yarn install --check-files`.
- If `anchor test` port is occupied, stop existing `solana-test-validator` or run validator manually and set `--url` to localhost.
- If wallet is missing, set `ANCHOR_WALLET=/path/to/id.json` and ensure sufficient SOL on the target cluster.

## Dev tips
- Re-run `anchor build` after changing instructions/state to regenerate IDL and TS types.
- Clients can import `target/types/ai_health_anchor.ts` and `target/idl/ai_health_anchor.json` directly.

## Quick commands
```bash
# Build
anchor build

# Run tests
anchor test

# Start WSS subscription
npx ts-node ws/ws.ts
```
