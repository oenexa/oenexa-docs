# Chapter 3: Digital Fingerprints (Hashing) & Wallet Addresses

## 1. What Is a Cryptographic Hash?

Think of a **cryptographic hash function** like an **irreversible fruit blender**:
- You can put a mango, a textbook, or the entire history of transactions into the blender, and out comes a fixed-size **32-byte (64-hex-character) digital fingerprint**.
- Every time you blend the **exact same input**, you get the **exact same 64 hex characters**.
- Change **just one comma or one bit** in the input, and the entire output fingerprint scrambles unpredictably (**avalanche effect**).
- Given the smoothie (the hash), **nobody on Earth can reverse-engineer the original mango** (one-way preimage resistance).

OENEXA uses the **FIPS 202 `SHA-3-256`** hashing standard everywhere (`internal/crypto/hash.go`):
- Output length: **`HashSize = 32` bytes** (`256` bits).
- Zero legacy hashes are used; `SHA-3-256` is quantum-resistant against practical collision attacks (finding two different inputs with the same hash requires $O(2^{128})$ quantum work — physically impossible).

### Helper Functions in `internal/crypto/hash.go`
- `Hash256(data []byte) [32]byte`: Hashes a single byte slice with `SHA-3-256`.
- `HashMany(parts ...[]byte) [32]byte`: Streams multiple fields into `SHA-3-256` sequentially without extra memory copying.

---

## 2. How Wallet Addresses Are Born

A **Wallet** (`internal/crypto/wallet.go`) does **not** store your coins on your laptop or phone! Your coins live inside OENEXA's shared global state (and if your computer explodes, your coins are still safe as long as you backed up your key).

A wallet holds a mathematical **keypair**:
1. **Private Key (`4,032` bytes)** — Your top-secret digital pen. **Never share this.** Anyone who has it can sign transactions to spend your ONXC.
2. **Public Key (`1,952` bytes)** — Your public signature verifier. Anyone can verify a signature made by your Private Key without learning the Private Key.
3. **Address (`32` bytes)** — Derived directly by hashing the Public Key with `SHA-3-256`:

```text
  [ Public Key (1,952 bytes) ]
               |
         SHA-3-256()
               v
  [ Address (32 bytes / 64 hex characters) ]
```

Because `SHA-3-256` is deterministic:
- Same Public Key $\implies$ always the same 32-byte Address.
- Even if a hacker knows your Address, they cannot work backward to obtain your Public Key until you publish it when signing a transaction — and even from your Public Key, `ML-DSA-65` prevents them from recovering your Private Key!

---

## 3. Address Formats Accepted by OENEXA

Look at `HexToAddress` in `internal/crypto/hash.go`:

```go
if strings.HasPrefix(lower, "onxc") {
    s = s[4:]
} else if len(s) >= 2 && (s[:2] == "0x" || s[:2] == "0X") {
    s = s[2:]
}
```

When passing an address to `oenexa-cli`, `oenexa-node`, or JSON-RPC (`onxc_getBalance`), OENEXA cleanly accepts:
1. **Bare 64-char hex**: `a1b2c3...` (32 bytes)
2. **`0x`-prefixed hex**: `0xa1b2c3...` (32 bytes, useful for Web3 tools)
3. **`onxc`-prefixed hex**: `onxca1b2c3...` (32 bytes, canonical ONXC display format)
4. **20-byte addresses** (40 hex chars): Automatically right-aligned into the lower 20 bytes of the 32-byte `[32]byte` array for tool compatibility.

---

## 4. Where Else Does OENEXA Use `SHA-3-256`?

Hashing is the glue holding every layer together:
- **Transaction Hash (`tx.Hash`)**: Hash of canonical transaction fields $\implies$ unique receipt ID.
- **Block Hash**: Hash of the block header (`PrevHash`, `TxRoot`, `StateRoot`, etc.) $\implies$ links the chain.
- **Sparse Merkle Trie Nodes**: Hash of `(leftChild, rightChild)` $\implies$ authenticates every account balance.
- **Shielded Note Commitments & Nullifiers**: Domain-separated hashes (`"OENEXA_NOTE_CM"`, `"OENEXA_NULLIFIER"`) $\implies$ guarantees privacy without counterfeiting.
- **Binary Upgrades**: Verifying downloaded node release binaries against tampered software.

---

## Check Your Understanding

1. **If Alice edits `Amount` from `10 ONXC` to `100 ONXC` in an old block, why does the hash catch her immediately?**  
   *Answer:* Because `SHA-3-256` exhibits the avalanche effect: changing even a single bit completely changes the 32-byte digest, which invalidates `TxRoot`, the Block Hash, and every subsequent block's `PrevHash`.

2. **How many bytes is a canonical OENEXA address, and how is it calculated?**  
   *Answer:* `32` bytes (`64` hex characters), calculated as `SHA-3-256(PublicKey)`.
