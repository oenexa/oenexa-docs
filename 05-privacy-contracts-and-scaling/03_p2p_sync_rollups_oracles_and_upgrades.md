# Chapter 12: P2P Networking, Block Sync, Layer-2 Rollups, Oracles & Self-Upgrades

A blockchain node does not work in isolation — it is part of a living global mesh of computers. This chapter explains how OENEXA nodes talk to peers, catch up after downtime, scale throughput with Layer-2 rollups, read ONXC price feeds, and upgrade safely.

---

## 1. Peer-to-Peer Mesh (`internal/p2p`)

When `oenexa-node` starts, it spins up a **`libp2p`** networking host (`internal/p2p/node.go`):
- **Peer Discovery**: Connects to configured bootstrap seeds (`P2P.BootstrapPeers` on default port `8765`) and automatically discovers nodes on the same local network via **mDNS** (`DiscoveryServiceTag = "oenexa-network-discovery"`).
- **PubSub Gossip Topics**: Nodes broadcast messages along five dedicated channels:
  - `/oenexa/tx/1.0.0`: Broadcasts new valid transactions from the mempool.
  - `/oenexa/block/1.0.0`: Broadcasts newly committed blocks.
  - `/oenexa/vote/1.0.0`: Broadcasts BFT `Prevote` and `Precommit` consensus votes.
  - `/oenexa/syncreq/1.0.0` & `/oenexa/syncres/1.0.0`: Used by nodes catching up missing historical blocks.
- **Deduplication & Reputation (`reputation.go`)**: Tracks recently seen tx/block hashes (`seenTxs`, `seenBlocks`) to avoid infinite gossip echo loops, and penalizes misbehaving peers that send spam or invalid signatures.

---

## 2. Catching Up Missing Blocks (`internal/sync`)

Suppose your laptop was powered off for an hour while the network produced 1,800 blocks. When you turn `oenexa-node` back on, the **Syncer** (`internal/sync/syncer.go`) brings your database up to date automatically:

1. Every **`SyncInterval = 5 seconds`**, the Syncer compares your local block height to the highest height advertised by connected peers (`ObservePeerHeight`).
2. If you are behind, it sends a `SyncReq{FromHeight: localTip + 1, MaxCount: 64}` (`BatchSize = 64`).
3. When blocks arrive, the node verifies signatures, executes transactions sequentially against StateDB, and persists them to `BlockStore`.

---

## 3. Scaling Beyond Layer-1: Rollup Sequencer (`internal/rollup`)

Even with `2`-second blocks and a `500,000,000` block gas limit, what if millions of users trade or play games simultaneously?

OENEXA includes a native **Layer-2 Rollup** foundation (`internal/rollup/sequencer.go`, `batch.go`, `l1_bridge.go`):
- **Off-Chain Sequencer**: Collects user `ML-DSA-65`-signed transactions in an L2 mempool, executes them every `2 seconds` (`batchInterval`) against an L2 `StateDB`, and bundles hundreds/thousands of transactions into a compact **`Batch`** (`PreRoot`, `PostRoot`, `Txs`, `Proof`).
- **L1 Settlement Bridge**: Commits the `Batch` and cryptographic validity proof back to OENEXA Layer-1, inheriting L1's security while multiplying throughput!

---

## 4. Sovereign ONXC Price Oracles (`internal/oracle`)

Smart contracts cannot open websites on their own because two validators querying an API milliseconds apart might get slightly different numbers and disagree on `StateRoot`!

**Oracles** bridge real-world market prices onto the chain safely (`internal/oracle/node.go`):
- Supported sovereign reserve pairs (`SovereignValuationPairs`): `ONXC`, `ONXC-USD`, `ONXC-EUR`, `ONXC-GBP`, `ONXC-JPY`, `ONXC-CHF`, `ONXC-USDC`.
- Instead of trusting 1 single price reporter (who might lie or get hacked), multiple staked `OracleNode` reporters submit signed `OracleReport` values, and **`AggregateReports`** takes a **stake-weighted / Byzantine-resistant median** so isolated outliers cannot manipulate on-chain DeFi prices.

---

## 5. Automated Node Upgrades (`internal/upgrade`)

Keeping dozens of independent validators running compatible software requires smooth upgrades (`internal/upgrade/manager.go`):
- **`Manager`** periodically polls configured release manifests (`DefaultReleaseURL`, `CheckInterval = 1h`), downloads binaries, verifies exact **`SHA-3-256` checksums** (`ComputeFileHash`) so corrupted or tampered files are never executed, and supports **on-chain height-scheduled upgrades (`Scheduler`)** so every validator activates protocol upgrades at the exact same block height without splitting the chain!

---

## Check Your Understanding

1. **How does a newly started `oenexa-node` catch up blocks produced while it was offline?**  
   *Answer:* Every `5s` (`SyncInterval`), the `Syncer` checks peer heights and requests missing blocks in batches of up to `64` (`BatchSize`) over `/oenexa/syncreq/1.0.0`, validating and committing each block sequentially.

2. **Why do multiple oracle nodes aggregate prices using a median rather than trusting one server?**  
   *Answer:* If one oracle malfunctions or reports a wildly fake `ONXC-USD` spike, taking the median across multiple independent staked reporters ignores the outlier.
