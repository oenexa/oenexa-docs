# Chapter 7: Global Account State & The Sparse Merkle Trie

## 1. Two Databases Inside Every Node

If every node had to replay every transaction from Block `0` every time you asked *"How much ONXC does Alice have?"*, checking a balance after 10 million blocks would take minutes!

Instead, `internal/storage` maintains **two complementary LevelDB stores**:
1. **Block Store** (`storage/blockchain.go`): Stores committed blocks sequentially by height and hash.
2. **State DB / State Store** (`internal/state/statedb.go` & `storage/statestore.go`): Stores the **current snapshot** of every account right now (`acc:<address>`), smart contract storage slots, shielded pool totals, spent nullifiers, and the **Sparse Merkle Trie** nodes (`t:<hash>`).

For every address, an `Account` stores:
- `Balance` (`uint64` in `nano-ONXC`)
- `Nonce` (`uint64` replay counter)
- `CodeHash` (hash of deployed WASM bytecode, if this address is a smart contract)
- `StorageRoot` (root hash of contract storage slots)

---

## 2. What Is a Merkle Tree? (Simple Student Analogy)

Suppose a teacher wants to prove to a principal that **Alice scored 95** in a 1,000-student gradebook without sending the entire 1,000-page spreadsheet.

Imagine hashing pairs of student grades up a binary tree like a sports tournament bracket until **one single 32-byte hash** sits at the top — the **Root Hash**:

```text
                  [ Root Hash ]
                 /             \
           Hash(AB)           Hash(CD)
           /      \           /      \
        Leaf A   Leaf B    Leaf C   Leaf D
      (Alice=95) (Bob=12) (Carol=7) (Dave=88)
```

To prove `Leaf A (Alice = 95)` belongs in `[Root Hash]`, you **only need two sibling hashes**:
1. `Leaf B` (to compute `Hash(AB)`)
2. `Hash(CD)` (to compute `Root = Hash(Hash(AB), Hash(CD))`)

That tiny list of sibling hashes is a **Merkle Proof**. Even with **billions** of accounts, verifying one account only takes ~32 hashes (**~1 KB**)!

---

## 3. Why OENEXA Uses a *Sparse* Merkle Trie (SMT)

Notice a problem with an ordinary sorted list tree: if someone inserts Bob *before* Alice versus Alice *before* Bob, or leaves empty slots, the tree shape could depend on insertion order!

OENEXA (`internal/mpt/mpt.go`) uses a **256-bit Sparse Merkle Trie (`trieDepth = 256`)**:
- An OENEXA address is `32 bytes = 256 bits` (256 zeros and ones, like `10110010...`).
- Imagine a giant imaginary binary tree of depth `256` where **every possible address in the universe already has a fixed parking spot** decided by its bits (`0` = go left, `1` = go right)!
- Obviously, nobody has enough disk space on Earth to store $2^{256}$ empty leaves!
- **The clever "Sparse" trick**: any empty branch whose leaves are all empty collapses down to a precomputed constant sentinel `zeroHash`! You **only store the paths leading to real, non-zero accounts**.

### Exact Leaf & Branch Format in `internal/mpt/mpt.go`
- **Leaf (`nodeTypeLeaf = 0x01`)**: `0x01 || address[32] || valueHash[32]`
- **Branch (`nodeTypeBranch = 0x02`)**: `0x02 || leftChildHash[32] || rightChildHash[32]`
- **Prefix in LevelDB**: `"t:"` keeps trie nodes cleanly separated from account keys (`"acc:"`).

### Three Superpowers of OENEXA's 256-bit SMT
1. **Order-Independent Convergence**: Because Alice's position is fixed forever by the 256 bits of her address, inserting Alice then Bob produces the **exact same 32-byte `StateRoot`** as inserting Bob then Alice! Every honest validator converges bit-for-bit.
2. **Compact Membership Proofs**: Light wallets can verify any account's `Balance` and `Nonce` against a block header's `StateRoot` in $O(\log_2 N)$ hashes without downloading the whole chain.
3. **Non-Membership Proofs**: Because empty subtrees hash deterministically to `zeroHash`, a node can cryptographically prove an address has **no account / 0 balance** cleanly.

---

## Check Your Understanding

1. **Why can't two OENEXA nodes arrive at different `StateRoot` hashes simply because one processed account updates in a different map iteration order?**  
   *Answer:* In the 256-bit Sparse Merkle Trie, each account's tree path is determined strictly by the 256 bits of its `32`-byte address, making the resulting `StateRoot` completely order-independent.

2. **What happens in the SMT if an empty subtree has zero active accounts?**  
   *Answer:* Empty subtrees are represented by `zeroHash` sentinels rather than allocating $2^{256}$ nodes on disk.
