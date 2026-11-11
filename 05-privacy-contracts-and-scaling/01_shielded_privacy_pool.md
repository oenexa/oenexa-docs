# Chapter 10: The Dual-Pool Privacy Engine (Shielded Pool & Turnstile)

## 1. Public Notebooks vs. Private Envelopes

On most blockchains, every balance and every coffee purchase is completely public forever. Imagine your bank balance and every grocery store receipt being posted on a billboard with your account ID!

At the same time, exchanges and regulators often want transparent supply auditing to verify no hidden bug inflated coins out of thin air.

**OENEXA (`internal/shielded/`) solves both problems using a Dual-Pool Architecture:**

```text
+--------------------------------+            TURNSTILE           +-------------------------------+
|       TRANSPARENT POOL         |   TxShield (deposit A) --->    |         SHIELDED POOL         |
|  - Public account balances     |                                |  - Confidential Value Notes   |
|  - Standard Sparse Merkle Trie |   <--- TxUnshield (withdraw A) |  - Encrypted memos (ML-KEM)   |
+--------------------------------+                                +-------------------------------+
              |                                                                   |
              +---------------> Transparent + Shielded == TotalSupply <-----------+
```

Users choose whichever mode fits each payment:
- **Transparent Mode (`TxTransfer`)**: Fast, simple, public balances — ideal for exchanges, staking, and treasury transparency.
- **Shielded Mode (`TxShield`, `TxShieldedTransfer`, `TxUnshield`)**: Confidential value notes protected by post-quantum encryption.

---

## 2. How Shielded Notes Work (Sealed Envelopes in a Safe Deposit Box)

Instead of an account saying *"Alice has 50 ONXC"*, the **Shielded Pool** (`internal/shielded/note.go`) stores sealed **Notes**:

Every `Note` holds:
- `Value`: Amount in `nano-ONXC` (`uint64`)
- `RecipientPK`: Recipient's public key
- `Rho`: A random 32-byte serial number
- `Rcm`: A random 32-byte secret blinding factor (trapdoor)
- `Memo`: Optional encrypted text note

Instead of writing the `Value` publicly on-chain, the sender publishes only a **`SHA-3-256` Note Commitment**:
$$\text{cm} = \text{SHA-3-256}(\texttt{"OENEXA\_NOTE\_CM"} \parallel \text{Value} \parallel \text{RecipientPK} \parallel \text{Rho} \parallel \text{Rcm})$$

Think of `cm` like a **locked glass envelope**:
- Everyone can see the envelope `cm` is appended to the **Note Commitment Tree** (`NoteCommitmentTree`, depth `TreeDepth = 32` supporting up to $2^{32}$ historical notes, using domain tag `"OENEXA_TREE_NODE"`).
- **Nobody** can see the `Value` or `RecipientPK` hidden inside `cm`, because `Rcm` adds 256 bits of random secret noise!
- Note payload encryption uses **NIST FIPS 203 `ML-KEM-768`** (post-quantum Key Encapsulation) paired with symmetric encryption so only the recipient can decrypt and read the incoming note.

---

## 3. Stopping Double Spends Privately: Nullifiers (`nullifier.go`)

Wait: if a shielded note's `Value` and `cm` stay secret when you spend it, how does OENEXA stop someone from spending the **same hidden note twice**?

Answer: **Nullifiers!**

When a user spends a note, they publish a unique deterministic serial code (`ComputeNullifier` in `internal/shielded/nullifier.go`):
$$\text{nf} = \text{SHA-3-256}(\texttt{"OENEXA\_NULLIFIER"} \parallel \text{spendingKey} \parallel \text{Rho} \parallel \text{cm})$$

1. Every node maintains a **`NullifierSet`** of all spent `nf` hashes.
2. You can spend a note **once** because its `nf` can only be added to `NullifierSet` **once** — trying again throws `"double spend detected, nullifier already exists"`.
3. Outsiders cannot link which historical commitment `cm` produced which `nf` without the secret `spendingKey`!

---

## 4. Selective Auditability: Viewing Keys (`viewingkey.go`)

Privacy does not have to mean zero accountability. OENEXA includes **Viewing Keys**:
- Using `oenexa-node wallet export-viewing-key`, a business or student organization can share a **read-only Viewing Key** (`SHA-3-256("OENEXA_VIEWING_KEY" || privKey)`) with an auditor or tax accountant.
- The auditor can inspect incoming note details to verify accounting **without ever having permission to spend a single nano-ONXC**!

---

## 5. The Turnstile Supply Conservation Law (`turnstile.go`)

Imagine an amusement park turnstile counting every single coin entering and leaving the private hall.

Inside `internal/shielded/turnstile.go`, the **`Turnstile`** continuously enforces one unbreakable mathematical invariant on every block (`onxc_getTurnstileStatus`):

$$\text{TransparentSupply} + \text{ShieldedSupply} \equiv \text{TotalSupply}$$

- When someone runs `TxShield(amount)`: `transparentSupply -= amount` and `shieldedSupply += amount`.
- When someone runs `TxUnshield(amount)`: `shieldedSupply -= amount` and `transparentSupply += amount` (and rejects any attempt if `shieldedSupply < amount`).
- You can inspect this live conservation proof at any time via `onxc_getTurnstileStatus` or `oenexa-node query turnstile`!

---

## Check Your Understanding

1. **Why does a `Note` include a random 32-byte `Rcm` blinding factor inside `cm`?**  
   *Answer:* Without `Rcm`, an attacker could guess common round numbers (e.g., `10 ONXC`) and check `SHA-3-256` to see if your commitment matches. Random `Rcm` hides the note contents completely.

2. **How does OENEXA guarantee that no hidden inflation bug can ever mint counterfeit ONXC inside the Shielded Pool?**  
   *Answer:* The **Turnstile** tracks total value entering (`TxShield`) and leaving (`TxUnshield`) the shielded pool and rejects any unshield exceeding `shieldedSupply`, enforcing `Transparent + Shielded == Total`.
