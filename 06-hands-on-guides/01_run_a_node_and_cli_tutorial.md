# Lab 1: Running Your First OENEXA Node & Using the CLI

This hands-on tutorial takes you from an empty terminal to compiling `oenexa-node`, creating an encrypted post-quantum wallet, mining local blocks, and sending your first **ONXC** test transfer!

---

## 1. Prerequisites

- **Go `1.22+`** installed (`go version`)
- **Git** installed (`git --version`)
- Optional: **Docker & Docker Compose** (if you prefer containerized runs)

---

## 2. Build `oenexa-node` and `oenexa-cli`

Open a terminal inside the `oenexa-node` repository:

```bash
# Linux / macOS
make build build-cli
```

Or on **Windows PowerShell**:

```powershell
mkdir -Force bin | Out-Null
go build -trimpath -o bin/oenexa-node.exe ./cmd/node
go build -trimpath -o bin/oenexa-cli.exe ./cmd/oenexa-cli
```

Verify the node version and native ticker:

```bash
./bin/oenexa-node version
```

Expected output confirms:
- `Chain ID: 1  (OENEXA Mainnet)`
- `Ticker  : ONXC  (Open Network for the Next Generation Coin)`
- `Crypto  : ML-DSA-65 (FIPS 204) | ML-KEM-768 (FIPS 203) | SHA-3-256 (FIPS 202)`

---

## 3. Create Your Encrypted Post-Quantum Wallet

Set your keystore encryption password in the `ONXC_PASSWORD` environment variable (avoid passing `--password` directly as a CLI flag in production because shell history/process lists can log CLI flags!):

### PowerShell
```powershell
$env:ONXC_PASSWORD = "MyStudentLabPassword123!"
./bin/oenexa-node.exe wallet new --datadir ./my-student-node
./bin/oenexa-node.exe wallet show --datadir ./my-student-node
```

### Bash / macOS / Linux
```bash
export ONXC_PASSWORD="MyStudentLabPassword123!"
./bin/oenexa-node wallet new --datadir ./my-student-node
./bin/oenexa-node wallet show --datadir ./my-student-node
```

What just happened behind the scenes?
1. Your computer generated a **4,032-byte `ML-DSA-65` private key** and **1,952-byte public key**.
2. `SHA-3-256(publicKey)` derived your **32-byte (64-hex-char) ONXC address**.
3. `Argon2id` + `AES-256-GCM` encrypted the private key into `./my-student-node/keystore.json`.

---

## 4. Launch a Local Development Node (Instant Mining)

The fastest way to experiment locally is using the included local devnet scripts inside `oenexa-node/scripts/`:

### Windows PowerShell
```powershell
.\scripts\run-local.ps1 -Reset
```

### Bash (Linux / macOS)
```bash
./scripts/run-local.sh --reset
```

This single command:
- Compiles `oenexa-node` and `oenexa-cli` if missing
- Clears previous local devnet state (`--reset` / `-Reset`) so you start cleanly at Genesis Block `0`
- Starts a mining validator node with:
  - **JSON-RPC 2.0**: `http://127.0.0.1:8545`
  - **P2P Port**: `127.0.0.1:8765`
  - **Prometheus Metrics**: `http://127.0.0.1:9090/metrics`

Leave that terminal running and open a **second terminal** for queries and transfers!

---

## 5. Query Chain Status & Send Your First ONXC

In your second terminal:

```bash
# Check chain height, ticker, and peer count
./bin/oenexa-node query chain --rpc http://127.0.0.1:8545

# Check Turnstile supply conservation (Transparent + Shielded == Total)
./bin/oenexa-node query turnstile --rpc http://127.0.0.1:8545

# Check current EIP-1559 fee tiers
./bin/oenexa-node query fee --rpc http://127.0.0.1:8545
```

Now generate a second wallet using `oenexa-cli` so you have a destination recipient (`Bob`), check the validator's address, and send **`100 ONXC`** (`100_000_000_000 nano-ONXC`):

```bash
# Generate a fresh recipient keypair
./bin/oenexa-cli wallet new

# View validator address from local-devnet keystore
./bin/oenexa-node wallet show --datadir data/local-devnet

# Check validator ONXC balance
./bin/oenexa-node query balance --address <VALIDATOR_ADDRESS_HEX>

# Send 10 ONXC (10_000_000_000 nano-ONXC) with nonce 0
ONXC_PASSWORD=devpassword ./bin/oenexa-node tx send \
  --datadir data/local-devnet \
  --to <BOBS_ADDRESS_HEX> \
  --amount 10000000000 \
  --nonce 0
```

Within **2 seconds**, BFT consensus commits the next block! Query Bob's balance to watch the `10 ONXC` arrive:

```bash
./bin/oenexa-node query balance --address <BOBS_ADDRESS_HEX>
```

---

## 6. Running Tests to Verify Everything Yourself

Want to see the entire OENEXA protocol verified end-to-end in Go? Run:

```bash
go test -count=1 ./cmd/... ./internal/... ./test/...
```

Pay special attention to `test/real_scenario_test.go`, which spins up wallets, signs transactions, runs BFT block proposals, deposits into the Shielded Pool, verifies the Turnstile invariant, and calls JSON-RPC endpoints live!
