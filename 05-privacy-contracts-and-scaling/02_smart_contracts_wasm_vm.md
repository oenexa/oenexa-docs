# Chapter 11: Smart Contracts & The OenexaVM WebAssembly Runtime

## 1. What Is a Smart Contract? (Vending Machine Analogy)

Think of a **vending machine**:
- You insert `2 ONXC`, press `B4`, and the machine automatically checks the rule: *"If `paid >= price`, release snack and store updated inventory."*
- Nobody needs a cashier to approve it, and the vending machine cannot randomly decide to keep your money and ignore the rules.

A **smart contract** is simply computer code deployed at an OENEXA address (`TxDeploy`) whose rules execute identically on every node in the network whenever someone sends a **`TxCall`** transaction!

---

## 2. Why WebAssembly (`wazero`) Inside `internal/vm/`?

Many blockchains invent proprietary custom virtual machines from scratch. OENEXA takes a modern, portable approach in `internal/vm/vm.go`: **`OenexaVM` runs WebAssembly (WASM)** using the **pure-Go `wazero` runtime**!

### Why Students & Engineers Love WebAssembly on Blockchain
- **Sandboxed Safety**: A WASM contract cannot touch the node's hard drive, make random HTTP requests, or read your OS password — it can *only* talk to the blockchain through the 8 safe host functions below.
- **Zero-CGO Portability**: Because `wazero` is 100% pure Go, `oenexa-node` cross-compiles cleanly to Linux, Windows, and macOS with zero C compiler headaches.
- **Compiled Module Caching**: When `Deploy()` validates WASM bytecode, it hashes the code (`SHA-3-256(code)`) and caches the compiled module in memory for fast repeated calls.
- **Infinite Loop Protection**: Configured with `WithCloseOnContextDone(true)` + strict gas tracking (`GasLimit` vs `GasUsed`), preventing runaway `while(true)` loops from stalling validators.

---

## 3. The 8 Host Functions Exposed to Smart Contracts (`env` Module)

In `internal/vm/vm.go` and `host.go`, every WASM contract imports its blockchain superpowers from the `"env"` module:

| Exported Host Function | Signature | What It Lets the Contract Do |
| :--- | :--- | :--- |
| `oen_get` | `(slot i32) -> i64` | Read a `uint64` value from the contract's persistent key-value storage slot. |
| `oen_set` | `(slot i32, value i64)` | Write a `uint64` value to persistent contract storage (atomic rollback if tx fails!). |
| `oen_transfer` | `(to_ptr i32, amount i64) -> i64` | Send `nano-ONXC` from the contract's own balance to a destination address. |
| `oen_balance` | `(addr_ptr i32) -> i64` | Query the transparent `nano-ONXC` balance of any 32-byte address. |
| `oen_log` | `(ptr i32, len i32)` | Emit an on-chain event log message from WASM memory. |
| `oen_caller` | `() -> i64` | Inspect who called this contract (`CallerAddr`). |
| `oen_block_height` | `() -> i64` | Read the current OENEXA block height (`BlockHeight`). |
| `oen_value` | `() -> i64` | Read how many `nano-ONXC` the caller attached (`Tx.Amount`). |

### How Execution State Isolation Works
Notice `ExecutionContext` (`internal/vm/context.go`):
- Tracks `ContractAddr`, `CallerAddr`, `Value` (in `nano-ONXC`), `BlockHeight`, `BlockTime`, `GasLimit`, `GasUsed`, and `ReadOnly` (for dry-run `onxc_call` queries!).
- When `ReadOnly == true` (such as querying a contract via JSON-RPC `onxc_call`), any attempt to mutate state (`oen_set` / `oen_transfer`) is safely blocked without changing the ledger.

---

## 4. Built-In Contract Example: Post-Quantum Multi-Signature (`internal/contracts/multisig`)

Suppose a university robotics club holds `10,000 ONXC` in a shared treasury and wants a rule: *"Spending funds requires at least **2 out of 3** club officers to approve!"*

Look at how `internal/contracts/multisig/multisig.go` enforces M-of-N approvals natively with `ML-DSA-65`:
1. **`InitMultisig`**: Stores `threshold` (`M`, e.g. `2`), `owner_count` (`N`, e.g. `3`), and each officer's **`1,952`-byte `ML-DSA-65` public key** (`owner_0`, `owner_1`, ...).
2. **`ExecuteTransfer`**: Checks `[to_address 32B][amount 8B][num_signatures 4B][sig1 3309B][sig2 3309B]...`. If `numSigs >= threshold` and all signatures verify cleanly against distinct registered owners, it dispatches the transfer!

---

## Check Your Understanding

1. **What happens if a user queries a smart contract via JSON-RPC `onxc_call` (`ReadOnly = true`) and the contract tries to call `oen_set`?**  
   *Answer:* Read-only calls cannot persist storage or balance mutations to the canonical chain state.

2. **Why is each owner public key inside `InitMultisig` exactly `1,952` bytes and each signature `3,309` bytes?**  
   *Answer:* Those are the exact FIPS 204 `ML-DSA-65` post-quantum public key and signature sizes used across OENEXA.
