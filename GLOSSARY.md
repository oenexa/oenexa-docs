# A-to-Z Blockchain & ONXC Student Glossary

Plain-language definitions for every term used across OENEXA and ONXC.

- **Address (`32 bytes` / `64 hex chars`)**: Your public receiving account ID on OENEXA, calculated as `SHA-3-256(PublicKey)`. Can be written as bare hex, `0x...`, or `onxc...`.
- **Argon2id**: A memory-hard key derivation function (`64 MiB` RAM per guess) that turns your typed password into a strong `AES-256` key so hackers cannot easily brute-force your `keystore.json`.
- **Base Fee (`BaseFee`)**: The protocol's automatic per-gas price (starting at `10 nano-ONXC/gas`, minimum `1`) that adjusts up or down by at most `±12.5%` depending on whether the previous block exceeded `50%` of `BlockGasLimit`. **All Base Fees are burned.**
- **BFT (Byzantine Fault Tolerance)**: A consensus design guaranteeing honest validators agree on the exact same blocks even if up to almost `1/3` of voting power crashes or sends conflicting lies.
- **Block**: A numbered batch of validated transactions plus metadata (`Height`, `PrevHash`, `TxRoot`, `StateRoot`, `BaseFee`, proposer `Signature`). Produced every `2` seconds.
- **Commitment (`Note Commitment`)**: A one-way `SHA-3-256` fingerprint of a private Shielded Pool note that proves the note exists without revealing its amount or owner.
- **Consensus**: The voting protocol (`StepPropose` $\to$ `StepPrevote` $\to$ `StepPrecommit` $\to$ `StepCommit`) by which independent nodes reach irreversible agreement.
- **Delegation**: Locking your ONXC (minimum `1,000,000 nano-ONXC`) behind an active validator to boost network security and earn a share of staking rewards minus the validator's commission.
- **Dual-Pool Architecture**: OENEXA's native design combining a **Transparent Pool** (public Sparse Merkle Trie accounts) and a **Shielded Pool** (private notes), linked by the Turnstile conservation check.
- **Equivocation**: The cheating offense of a validator signing two conflicting block votes at the same `(height, round)` — punished by **10% stake slashing**.
- **Finality**: The moment a block becomes 100% permanent and irreversible. On OENEXA, `> 2/3` `Precommit` votes grant **instant finality** in 1 block (`~2s`).
- **Gas**: Unit measuring how much computation or storage a transaction consumes (`21` for a transfer, `500` for contract call, `5,000` for contract deploy, max `500,000,000` per block).
- **Genesis Block (Height `0`)**: The very first block initializing Chain ID `1`, initial validators, and the `10,000,000 ONXC` genesis premine (`5M` Treasury, `3M` Liquidity, `2M` Staking Bootstrap).
- **Halving**: Cutting the validator `BlockReward` in half (`>> 1`) every `1,000,000` blocks (starting from `45 ONXC` in Era 0). Guarantees total ONXC supply never exceeds `100,000,000`.
- **Hash (`SHA-3-256`)**: A one-way FIPS 202 cryptographic blender turning any data into a unique 32-byte fingerprint.
- **Keystore (`keystore.json`)**: Your encrypted wallet file on disk protected by `Argon2id` + `AES-256-GCM`.
- **Layer-1 (L1) / Layer-2 (L2)**: L1 (`OENEXA`) is the base settlement blockchain; L2 (`Rollup Sequencer`) executes batches off-chain and settles proofs back to L1 for extra throughput.
- **Mempool**: A priority waiting room (`DefaultMaxSize = 100,000`) holding valid pending transactions ordered by highest `GasPrice` and earliest timestamp.
- **ML-DSA-65 (FIPS 204)**: Post-quantum lattice digital signature scheme (`1,952 B` public key, `4,032 B` private key, `3,309 B` signature) safe against Shor's quantum algorithm.
- **ML-KEM-768 (FIPS 203)**: Post-quantum key encapsulation scheme used to encrypt private Shielded Pool notes.
- **Multisig (M-of-N)**: A smart contract treasury wallet requiring `M` distinct `ML-DSA-65` signatures out of `N` owners before spending ONXC.
- **nano-ONXC**: The smallest atomic unit of ONXC (`1 ONXC = 1,000,000,000 nano-ONXC`). Used internally in `uint64` arithmetic so rounding errors never occur.
- **Nonce**: Sequential counter (`0, 1, 2, ...`) on every sender's account preventing replay attacks.
- **Nullifier**: A unique `SHA-3-256` serial tag published when spending a shielded note, preventing double-spends without exposing which note was spent.
- **OENEXA**: The sovereign, quantum-resistant Layer-1 blockchain protocol (`ChainID = 1`).
- **OenexaVM**: Pure-Go WebAssembly (`wazero`) smart contract sandbox with deterministic gas limits and 8 host ABI functions (`env.oen_*`).
- **ONXC**: **Open Network for the Next Generation Coin** — native asset of OENEXA (`100,000,000` hard cap, `9` decimals).
- **Oracle**: A service feeding signed real-world market prices (such as `ONXC-USD`) on-chain using median aggregation across multiple staked reporters.
- **Priority Tip**: Optional extra fee per gas above `BaseFee` paid directly to the block validator for faster mempool priority.
- **Rosetta API (v1.4.14)**: Standardized REST interface built into `oenexa-node` allowing exchanges to query balances and construct air-gapped transactions uniformly.
- **Slashing**: Economic penalty removing `10%` of stake from a validator caught equivocating (double-signing).
- **Sparse Merkle Trie (SMT)**: A `256`-bit binary cryptographic tree mapping every 32-byte address to its account state, supporting ~1 KB balance proofs and order-independent roots.
- **StateRoot**: Single 32-byte hash summarizing *every* account balance and nonce on the entire blockchain at a given block height.
- **Turnstile**: On-chain accounting mechanism enforcing `TransparentSupply + ShieldedSupply == TotalSupply` across every block.
- **Validator**: A staked full node operator who validates transactions, proposes blocks in round-robin order, and votes in BFT consensus rounds.
- **Viewing Key**: Read-only key allowing selective auditing of shielded notes without any ability to spend funds.
